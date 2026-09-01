/**
 * lighting.cpp
 * ============
 * Implementation of the exported lighting kernels (see lighting.h).
 *
 * Compiled with Emscripten to WASM **with real threading** (SharedArrayBuffer
 * + a pthread pool):
 *   emcc src/lighting.cpp -O3 -pthread ... -o dist/LightingWasm.js
 * (exact invocation in build/build.sh). Functions are extern "C" so they are
 * exported under a predictable ABI and callable via cwrap.
 *
 * Threading model
 * ---------------
 * The game runs inside nw.js/Chromium with `--enable-features=SharedArrayBuffer`
 * (see repo package.json), so SharedArrayBuffer + Atomics are available and
 * Emscripten pthreads can start. The heavy row loops in lighting_add_radial and
 * lighting_apply are split across a small pool of pthreads (each row batch is
 * independent — no shared writes), so a scene actually runs on N cores instead
 * of one. The GPU/data boundary is unchanged: still one copy-in / one copy-out
 * per APPLY task; only the compute inside the WASM heap is parallelised.
 *
 * PTHREAD_POOL_SIZE pre-spawns the workers at module load; lighting_set_max_threads
 * lets the host cap how many of them an individual kernel call fans out to.
 */

#include "lighting.h"

#include <algorithm>
#include <atomic>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <pthread.h>
#include <vector>

#include <emscripten/threading.h> /* emscripten_num_logical_cores */

namespace {

/* Scratch light map, owned entirely inside the WASM heap so accumulated lights
 * never cross the JS boundary. Only one APPLY task runs at a time (the host
 * worker serialises tasks), so even though it is shared by pthreads it is
 * touched on disjoint row batches -> no data race. */
uint8_t *g_lightMap = nullptr;
int g_w = 0;
int g_h = 0;

/* Thread-cap override. 0 = auto (logical cores, capped for the game). */
int g_threadCap = 0;

/* Peak worker-thread concurrency observed during the last kernel call. Set by
 * runParallel after all joins; read from JS via lighting_get_last_parallelism
 * (diagnostics + the test harness prove true multithreading). */
int g_lastParallelism = 0;

/* Number of pthreads currently inside a rowFn row-batch (for peak tracking). */
volatile int g_active = 0;

inline uint8_t clampByte(float v) {
    if (v < 0.0f) return 0;
    if (v > 255.0f) return 255;
    return (uint8_t)(v + 0.5f); /* round, matching the JS reference closely */
}

inline int resolveThreadCount() {
    if (g_threadCap > 0) return g_threadCap;
    int c = static_cast<int>(emscripten_num_logical_cores());
    if (c < 1) c = 1;
    if (c > 4) c = 4; /* keep the game gentle: 4 workers is plenty for pixels */
    return c;
}

/* ------------------------------------------------------------------ */
/* Tiny row-parallel scheduler (no lock needed; rows are disjoint).    */
/* ------------------------------------------------------------------ */
typedef void (*RowFn)(const void *ud, int y0, int y1);

struct ThreadArg {
    RowFn fn;
    const void *ud;
    int y0;
    int y1;
    std::atomic<int> *peak;
};

void *threadEntry(void *p) {
    ThreadArg *a = static_cast<ThreadArg *>(p);
    /* Track peak concurrency (lock-free CAS on a relaxed atomic). */
    int cur = __sync_add_and_fetch(&g_active, 1);
    int pk = a->peak->load(std::memory_order_relaxed);
    while (pk < cur &&
           !a->peak->compare_exchange_weak(pk, cur, std::memory_order_relaxed)) {
    }
    a->fn(a->ud, a->y0, a->y1);
    __sync_sub_and_fetch(&g_active, 1);
    return nullptr;
}

/* Runs `fn` over the row range [0, h) split across up to `resolveThreadCount()`
 * pthreads (spawned workers + the calling thread). Small inputs stay single-
 * threaded to avoid spawn overhead. Sets g_lastParallelism. */
void runParallel(int h, RowFn fn, const void *ud) {
    if (h <= 0) return;
    const int n = resolveThreadCount();
    if (n < 2 || h < 48) {
        fn(ud, 0, h);
        g_lastParallelism = (n >= 2) ? 1 : 0;
        return;
    }
    const int chunk = std::max(1, (h + n - 1) / n);

    std::atomic<int> peak(0);
    std::vector<pthread_t> tids;
    std::vector<ThreadArg> args;
    args.reserve(static_cast<size_t>(n) - 1u); /* pre-sized so &args.back() is stable */

    for (int i = 1; i < n && i * chunk < h; ++i) {
        ThreadArg a;
        a.fn = fn;
        a.ud = ud;
        a.y0 = i * chunk;
        a.y1 = std::min(a.y0 + chunk, h);
        a.peak = &peak;
        args.push_back(a);
        pthread_t t;
        if (pthread_create(&t, nullptr, threadEntry, &args.back()) == 0) {
            tids.push_back(t);
        }
    }
    /* Calling thread handles the first batch. */
    fn(ud, 0, std::min(chunk, h));
    for (size_t i = 0; i < tids.size(); ++i) {
        pthread_join(tids[i], nullptr);
    }
    g_lastParallelism = peak.load(std::memory_order_relaxed);
}

/* ------------------------------------------------------------------ */
/* Lighting row functions (disjoint rows -> safe to parallelise).      */
/* ------------------------------------------------------------------ */
struct RadialJob {
    float cx, cy, radius, intensity, r, g, b, falloff;
};

void radialRows(const void *p, int y0, int y1) {
    const RadialJob *j = static_cast<const RadialJob *>(p);
    const float invR = 1.0f / j->radius;
    const float rn = j->r / 255.0f;
    const float gn = j->g / 255.0f;
    const float bn = j->b / 255.0f;
    for (int y = y0; y < y1; ++y) {
        const float dy = static_cast<float>(y) - j->cy;
        uint8_t *row = g_lightMap + static_cast<size_t>(y) * g_w * 4u;
        for (int x = 0; x < g_w; ++x) {
            const float dx = static_cast<float>(x) - j->cx;
            const float dist = std::sqrt(dx * dx + dy * dy);
            const float t = 1.0f - dist * invR;
            const float atten = (t > 0.0f) ? std::pow(t, j->falloff) : 0.0f;
            const float amp = atten * j->intensity;
            const size_t i = static_cast<size_t>(x) * 4u;
            row[i] = clampByte(row[i] + amp * rn * 255.0f);
            row[i + 1] = clampByte(row[i + 1] + amp * gn * 255.0f);
            row[i + 2] = clampByte(row[i + 2] + amp * bn * 255.0f);
        }
    }
}

struct ApplyJob {
    const uint8_t *src;
    uint8_t *out;
    int w, h;
    float ambR, ambG, ambB, nightFactor, lightGain;
};

void applyRows(const void *p, int y0, int y1) {
    const ApplyJob *j = static_cast<const ApplyJob *>(p);
    const bool haveMap = g_lightMap && g_w == j->w && g_h == j->h;
    for (int y = y0; y < y1; ++y) {
        const uint8_t *s = j->src + static_cast<size_t>(y) * j->w * 4u;
        const uint8_t *lm =
            haveMap ? g_lightMap + static_cast<size_t>(y) * j->w * 4u : nullptr;
        uint8_t *o = j->out + static_cast<size_t>(y) * j->w * 4u;
        for (int x = 0; x < j->w; ++x) {
            const size_t i = static_cast<size_t>(x) * 4u;
            const float r = static_cast<float>(s[i]);
            const float gr = static_cast<float>(s[i + 1]);
            const float b = static_cast<float>(s[i + 2]);
            const float a = static_cast<float>(s[i + 3]);

            const float lr = haveMap ? (lm[i] / 255.0f) * j->lightGain : 0.0f;
            const float lg = haveMap ? (lm[i + 1] / 255.0f) * j->lightGain : 0.0f;
            const float lb = haveMap ? (lm[i + 2] / 255.0f) * j->lightGain : 0.0f;

            const float litR = r * (j->ambR + lr);
            const float litG = gr * (j->ambG + lg);
            const float litB = b * (j->ambB + lb);

            const float invNight = 1.0f - j->nightFactor;
            o[i] = clampByte(r * invNight + litR * j->nightFactor);
            o[i + 1] = clampByte(gr * invNight + litG * j->nightFactor);
            o[i + 2] = clampByte(b * invNight + litB * j->nightFactor);
            o[i + 3] = static_cast<uint8_t>(a); /* alpha untouched */
        }
    }
}

} // namespace

extern "C" {

int lighting_init(int w, int h) {
    if (w <= 0 || h <= 0) return 0;
    if (g_lightMap && g_w == w && g_h == h) return 1; /* already sized */

    lighting_free();

    const size_t bytes = static_cast<size_t>(w) * static_cast<size_t>(h) * 4u;
    uint8_t *map = static_cast<uint8_t *>(std::malloc(bytes));
    if (!map) return 0;
    std::memset(map, 0, bytes);

    g_lightMap = map;
    g_w = w;
    g_h = h;
    return 1;
}

void lighting_free(void) {
    if (g_lightMap) {
        std::free(g_lightMap);
        g_lightMap = nullptr;
    }
    g_w = g_h = 0;
}

void lighting_clear(void) {
    if (g_lightMap) {
        std::memset(g_lightMap, 0,
                    static_cast<size_t>(g_w) * static_cast<size_t>(g_h) * 4u);
    }
}

void lighting_add_radial(float cx, float cy, float radius, float intensity,
                         float r, float g, float b, float falloff) {
    if (!g_lightMap || radius <= 0.0f) return;

    RadialJob j = { cx, cy, radius, intensity, r, g, b, falloff };
    runParallel(g_h, radialRows, &j);
}

void lighting_apply(const uint8_t *src, uint8_t *out, int w, int h,
                    float ambientR, float ambientG, float ambientB,
                    float nightFactor, float lightGain) {
    if (!src || !out || w <= 0 || h <= 0) return;

    ApplyJob j = { src, out, w, h, ambientR, ambientG, ambientB,
                   nightFactor, lightGain };
    runParallel(h, applyRows, &j);
}

/* Host control: 0 = auto (capped logical cores); >0 = exact worker count. */
void lighting_set_max_threads(int n) { g_threadCap = n > 0 ? n : 0; }

/* Peak pthread concurrency used by the last kernel call (0 if single-threaded). */
int lighting_get_last_parallelism(void) { return g_lastParallelism; }

} // extern "C"