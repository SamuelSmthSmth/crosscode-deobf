# DOC 7 — Lighting engine C++/WASM backbone (`lighting-wasm`)

> Foundational compute layer for the Night Mode lighting engine. C++ kernels
> compiled to WebAssembly and run **inside a Web Worker**, mirroring the
> engine's own `ig.Worker` + `WORKER.IMAGE` task-registry architecture. This
> pass builds the backbone only — no draw hooks, no `ig.GameAddon`. The visual
> lighting features land later *under* the HUD, on the layer established by
> tilt-shift (`postDrawOrder < 500`, game world only, not the UI).
>
> Use the [agent reference](game/agent-reference.md) as the normative source for
> hook ordering, coordinate-space names, and renderer guardrails.

## 0. Runtime update (2026): main build is now native-Linux nw 0.115 / Chromium 152

The main `CrossCode/` folder was migrated from the stock Windows nw.js 0.35.5 runtime (Chromium 71) to the **nw.js v0.115.0 linux-x64 SDK** (Chromium **152**). This is significant for threading: Chromium 71 (2018) predates WASM threads/shared-memory entirely, which is why the pthreads WASM fell back to the JS kernels in-game. Under Chromium 152, Emscripten pthreads and SharedArrayBuffer are **natively available** — no COOP/COEP headers and no `--enable-features=SharedArrayBuffer` flag are needed (the flag remains as a harmless holdover in `package.json`). Sections below that mention "Chromium 71 / nw.js 0.35" refer to the stock runtime and the `CrossCode (Copy)` fallback; on the current main build the threaded module instantiates directly.

## 1. Why WebAssembly plus a worker (the short version)

From `RESEARCH-3` and `RESEARCH-6`:

- Native Node addons (ABI 68, proven by `greenworks`) run only on the **Node
  side** of the nw.js split — they **cannot** touch Canvas2D, WebAudio or
  `requestAnimationFrame`, where all lighting lives. Ruled out.
- WASM executes in the same (Chromium 152 on the current Linux build) JS thread as the game. The only real
  cost is the `getImageData`/`putImageData` **data boundary**, so the design
  rule is: **make every kernel do several passes per copy**, and never round-trip
  pixels just to move them.
- We compile with **true Emscripten pthreads** (SharedArrayBuffer). Chromium 152
  (nw.js 0.115, the current main build) supports WASM shared memory natively, so
  the pthread pool starts without any headers or flags (the historical
  `--enable-features=SharedArrayBuffer` chromium-arg for nw.js 0.35 / Chromium 71
  is kept as a harmless holdover). The heavy per-row loops fan out across that
  pool (disjoint rows => no data races); the JS→WASM copy boundary is unchanged
  (still one copy-in / one copy-out).
- The engine already runs an image worker (`assets/impact/webworker/image-tasks.js`)
  with `ig.Worker` (`deobf/clean/impact.base.worker.js`). We copy that shape.

## 2. Architecture

```
poststart.js (main thread, game renderer)
  ig.LightingEngine.apply()            task API
        │  ig.Worker(path,'LIGHTING')  (exact engine worker semantics)
        ▼
worker/lighting-worker.js  (Web Worker, OR in-page <script> fallback)
  WORKER.LIGHTING = { APPLY }          same registry/dispatch as WORKER.IMAGE
        │  uses WASM if a build exists, else pure-JS reference
        ▼
dist/LightingWasm.js + src/lighting.cpp
  lighting_init / lighting_clear / lighting_add_radial / lighting_apply
  (extern "C", exported, cwrap-bound, allocated via _malloc on the HEAP)
```

Data flow per `APPLY` task (deliberately one copy-in + one copy-out):

1. Worker receives `Uint8ClampedArray` `src` (+ width/height + params).
2. Allocates two heap buffers (`_malloc`) and `HEAPU8.set(src)` once.
3. `lighting_init(w,h)` (lazy, cached) + `lighting_clear()`.
4. N × `lighting_add_radial(...)` — accumulates a light map **inside WASM heap**,
   so no JS→WASM copies per light.
5. One `lighting_apply(...)` — reads src + light map + night ambient, writes once.
6. Copies `out` back to a fresh `Uint8ClampedArray` (single copy-out).

The multi-pass-per-copy rule holds: a scene with 1 or 40 lights costs the same
two copies.

### The composite model (`lighting_apply`)
```
lit   = src * (ambient + light * lightGain)
out   = src * (1 - nightFactor) + lit * nightFactor
```
- `nightFactor = 0` ⇒ exact day pass-through (no visual change).
- `nightFactor = 1` ⇒ full night: base is dimmed by `ambient` (~0.2 → steep
  darkness) and restored only where lamps add light.
- This is the spine the later features (lantern glow, god-ray beams) will feed
  light into. It is kept intentionally small so behaviour is auditable.

## 3. Files

| Path | Purpose |
|---|---|
| `assets/mods/lighting-wasm/ccmod.json` | ccloader manifest (`poststart`) |
| `assets/mods/lighting-wasm/poststart.js` | `ig.LightingEngine` wrapper |
| `assets/mods/lighting-wasm/worker/lighting-worker.js` | worker host + `WORKER.LIGHTING` registry + dispatch + fallback |
| `assets/mods/lighting-wasm/worker/lighting-kernels.js` | pure-JS reference kernels (UMD) |
| `assets/mods/lighting-wasm/src/lighting.{h,cpp}` | the C++ (source of truth for perf) |
| `assets/mods/lighting-wasm/build/build.sh` | `emcc` build → `dist/LightingWasm.js` |
| `assets/mods/lighting-wasm/dist/LightingWasm.js` | committed Emscripten glue artifact; loads the paired `.wasm` file |
| `assets/mods/lighting-wasm/hw/test-wasm.js` | Node harness; always tests JS ref, cross-checks WASM if built |
| `assets/mods/lighting-wasm/hw/test-worker.js` | Node harness; VM-loads the worker host and drives `WORKER.LIGHTING` + `onmessage` (JS-kernel path) |

## 4. Worker load path & resilience

- `poststart.js` builds the worker URL as `ig.root + "mods/lighting-wasm/worker/lighting-worker.js"`
  (ccloader installs mods under `assets/mods/<id>/`), and reuses `ig.Worker`,
  so callbacks + the sync fallback behave natively.
- In a worker, `lighting-worker.js` dynamically `importScripts("../dist/LightingWasm.js")`
  (the paired glue build; `locateFile` resolves the sibling `.wasm` file) and
  instantiates via the `LightingWasm` factory.
- **Fallback:** if the build is missing, instantiation fails, or the runtime
  has no `Worker`, it falls back to `lighting-kernels.js`. The API contract is
  identical; you just lose the C++ speedup. This is intentional so the mod
  remains loadable during development before `emcc` is available.

## 5. Build (required to produce the real artifact)

```bash
# once, from assets/mods/lighting-wasm:
./build/build.sh          # needs emcc on PATH
./build/build.sh --no-test
```

Emscripten invocation highlights (pthreads — `em++`, **not** `emcc`, because the
kernels use C++ `std::vector`/`std::atomic`):

```
em++ src/lighting.cpp -O3 -pthread \
  -s PTHREAD_POOL_SIZE=4 \
  -s ENVIRONMENT="web,worker,node" \
  -s MODULARIZE=1 -s EXPORT_NAME=LightingWasm \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS=_lighting_init,_lighting_free,_lighting_clear,_lighting_add_radial,_lighting_apply,_lighting_set_max_threads,_lighting_get_last_parallelism,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPU8 \
  -o dist/LightingWasm.js
```

- `-pthread` implies shared memory (`-s SHARED_MEMORY=1`); the game Chromium
  (152 on the current Linux build) supports it natively — no COOP/COEP headers
  or `--enable-features=SharedArrayBuffer` required (that flag is a harmless
  holdover from the nw.js 0.35 / Chromium 71 runtime).
- `PTHREAD_POOL_SIZE=4` pre-spawns the workers once at module load;
  `lighting_set_max_threads` controls the per-call fan-out.
- **No `SINGLE_FILE` and no `LEGACY_VM_SUPPORT`**: `SINGLE_FILE` + pthreads
  hangs under Node (the blob worker never initializes), and `LEGACY_VM_SUPPORT`
  is mutually exclusive with threads. The build therefore emits a separate
  `dist/LightingWasm.wasm`;
  the worker host passes `locateFile` so it resolves next to the glue.
- `ENVIRONMENT=web,worker,node` lets the same artifact run in the game worker
  and in the Node test harness (Node runs the pthreads on `worker_threads`).

## 6. Validation

- `node --check` on every authored `.js` (repo convention).
- `node assets/mods/lighting-wasm/hw/test-wasm.js`:
  - always verifies the JS reference (lit vs ambient, 0..255, alpha, day identity);
  - if `dist/LightingWasm.js` exists, loads it in Node and asserts the C++
    output matches the JS reference within rounding tolerance (max channel
    diff ≤ 6).
- `node assets/mods/lighting-wasm/hw/test-worker.js`: VM-loads the worker host
  (no game runtime) and validates the engine-compatible `WORKER.LIGHTING`
  registry, the `APPLY` result shape, exact agreement with the reference
  kernels, the `onmessage` dispatch loop, and the unknown-task reply.
- Manual in-game check is deferred to the lighting feature pass.

## 7. Open threads / how the lighting features plug in later

- **New kernels** (occlusion-mask build, separable blur, more falloffs) become
  new `extern "C"` functions in `src/lighting.cpp` + cwrap entries in
  `worker/lighting-worker.js`; each owns several passes per copy.
- **Rendering** happens on a future `ig.GameAddon` at `postDrawOrder` **below**
  `ig.gui` (500) — game world only, HUD/UI stays sharp on top (the tilt-shift
  rule from the night-mode discussion). `ig.LightingEngine` stays a pure
  worker/task layer; drawing reads its result out with a `putImageData` on the
  addon's offscreen buffer.
- **Caching:** because `APPLY` copies the whole frame, heavy/static work (e.g.
  per-map occlusion masks) should be precomputed once and reused, like the
  engine's `ig.Image.addFiltered` cache, rather than recomputed per frame at
  full res.
- **Performance budget (DOC 3):** keep full-screen passes few; the reference
  target is `updateEvery ≥ 2` and `scale ≤ 0.5` for expensive night passes.

## 8. Known assumptions

- Mod installed at `assets/mods/lighting-wasm` under standard ccloader layout
  (worker URL is derived from the mod id).
- The current Linux/Chromium 152 runtime exposes SharedArrayBuffer and threaded
  WASM natively. The `--enable-features=SharedArrayBuffer` argument remains a
  compatibility holdover for older nw.js folders. If threaded initialization fails
  for any reason, the worker must fall back to the pure-JS reference kernels.
- The amount of real speedup depends on frame size vs. thread-sync overhead; the
  harness proves correctness (max channel diff ≤ 6 vs the JS reference) and true
  multithreading (`lighting_get_last_parallelism ≥ 2` under a forced fan-out).
- `dist/LightingWasm.{js,wasm}` are committed so players don't need a toolchain —
  this pass builds them with Emscripten 6.0.8. The `emcc`→`em++` flag set is
  pinned in `build/build.sh`; a compatibility-tested EMSDK build may be wanted when targeting the stock
  Chromium 71 runtime rather than the current Linux build.