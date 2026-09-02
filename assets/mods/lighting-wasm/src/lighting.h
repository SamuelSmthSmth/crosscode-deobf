/**
 * lighting.h
 * ==========
 * C kernels for the CrossCode Night Mode lighting engine, compiled to
 * WebAssembly with Emscripten and executed inside a Web Worker.
 *
 * Design constraint (see docs/RESEARCH-3 & 6): the WASM data boundary
 * (getImageData/putImageData round-trip) dominates cost, so every exported
 * task does MULTIPLE passes per copy. The light map lives entirely in WASM
 * heap: callers add N radial lights (no JS copies), then call lighting_apply
 * once, which reads the source once and writes once.
 *
 * Threading: built with `-pthread` (SharedArrayBuffer) — the game's
 * nw.js/Chromium runs with `--enable-features=SharedArrayBuffer` (repo
 * package.json), so pthreads start. The heavy row loops fan out across a
 * pre-spawned pthread pool (disjoint rows => no data races); the JS data
 * boundary is unchanged (still one copy-in / one copy-out per task).
 */

#ifndef LIGHTING_H
#define LIGHTING_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* (Re)allocate the internal light-map scratch buffer for (w × h) RGBA pixels.
 * Returns 1 on success (or if a matching buffer already exists), 0 if OOM. */
int lighting_init(int w, int h);

/* Release the internal light-map scratch buffer. */
void lighting_free(void);

/* Zero the light map (start of a frame's light accumulation). */
void lighting_clear(void);

/* Accumulate one radial light into the internal map (row-parallel pthreads).
 * cx, cy   : center in pixel coordinates
 * radius   : falloff reach (> 0), in pixels
 * intensity: overall strength multiplier 0..1+
 * r,g,b    : light colour, 0..255
 * falloff  : power exponent (1.0 = linear, 1.5 = quicker falloff)
 * Multiple calls composite additively; call lighting_clear() between frames. */
void lighting_add_radial(float cx, float cy, float radius, float intensity,
                         float r, float g, float b, float falloff);

/* Final composite (row-parallel pthreads): reads src RGBA once, adds the
 * accumulated light map and a night ambient term, writes out once.
 *
 * out = src * (1 - nightFactor) + src * (ambient + light * lightGain) * nightFactor
 *
 * ambientR/G/B : dark base multiplier for night (0..1); 0 = pitch black
 * nightFactor  : 0 = day (pass-through), 1 = full night
 * lightGain    : scales the accumulated light contribution
 */
void lighting_apply(const uint8_t *src, uint8_t *out, int w, int h,
                    float ambientR, float ambientG, float ambientB,
                    float nightFactor, float lightGain);

/* Host control of the pthread fan-out: n <= 0 => auto (logical cores, capped);
 * n > 0 => exact number of workers used per kernel call. PTHREAD_POOL_SIZE is
 * still what is physically pre-spawned at module load. */
void lighting_set_max_threads(int n);

/* Peak pthread concurrency used by the last kernel call. 0 = single-threaded;
 * >= 2 proves the kernel actually ran across multiple threads. Diagnostics +
 * the Node harness use this to verify true multithreading. */
int lighting_get_last_parallelism(void);

#ifdef __cplusplus
}
#endif

#endif /* LIGHTING_H */