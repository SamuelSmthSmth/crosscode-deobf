# DOC 6 — Other Languages: TypeScript & C++ for CrossCode Mods

**Question:** can we use TypeScript or C++ (for performance) inside the mod/injection plan?

**Short answers:**
- **TypeScript: YES, trivially.** It compiles to plain JS that CCLoader already loads. Zero runtime risk. CCLoader even ships `.d.ts` types for its own API.
- **C++: YES for *native Node addons* (`.node` files), and the game already proves it works** — the bundled Steam integration (`greenworks`) is a compiled C++ addon running inside this exact runtime. But it's the wrong tool for the rendering/audio features in `Visuals_to_check.md`: those are *browser-side* (Canvas2D + WebAudio in the Chromium renderer), which C++ cannot reach except through expensive bridges.

---

## 1. The runtime you're actually targeting

## Runtime update (2026): the main folder now runs native-Linux nw.js 0.115 / Chromium 152

The main `CrossCode/` folder launches **nw.js v0.115.0 (Linux SDK, native)** — `./nw` reports `nwjs 152.0.7977.42`. This swap (replacing the stock Windows runtime with the `nwjs-sdk-v0.115.0-linux-x64` files) is what unlocks **WASM threads + SharedArrayBuffer out of the box**: Chromium 152 fully supports Emscripten pthreads and SAB natively, no COOP/COEP headers or flags required.

| Component | Main build (current) | Stock GOG / `CrossCode (Copy)` |
|---|---|---|
| Runtime | **nw.js v0.115.0 (Chromium 152), native Linux** | nw.js 0.35.5 (Chromium 71) |
| Embedded Node | nw 0.115-era Node (libnode.so) — ABI far newer than 68 | Node v11.6.0, ABI **68** |
| WASM threads / SAB | **available natively** (`Atomics`+`SharedArrayBuffer`, pthreads build runs) | unavailable (Chrome 71 predates WASM threads post-MVP) |
| Steam `greenworks` | does **not** load (ABI mismatch) → silently disabled (guarded) | loads (ABI-68 build) |
| Engine | Impact.js fork ("Cubic Impact"), Canvas2D only | same |

The stock nw.js 0.35.5 / Chromium 71 data below is retained for historical accuracy and still applies to any folder still on the Windows 0.35 runtime (e.g. the untouched `CrossCode (Copy)` crypto/client build). The greenworks ABI discussion matters only for that older runtime — on the Linux 152 build Steam integration is unavailable but never crashes (the game wraps init in `try/catch`).

**Proof native C++ works here:** `assets/modules/greenworks-nw-0.35/win64/greenworks-win64.node` is a compiled C++ Steam addon that the game `require()`s at startup and initializes successfully (the code logs "GREENWORKS: Successfully initialized! [Compiled for NW.js 0.35.x]"). The game even version-gates between three greenworks builds (`0.13.0`, `0.4.0`, `0.5.3`, `nw-0.35`) by `ig.nwjsVersion`.

---

## 2. TypeScript — recommended default for all new mod code

### Why it's free
- TS compiles to plain ES5/ES2018 JS. CCLoader loads `.js` via `<script>`/`require()` — it never sees the difference.
- **CCLoader ships its own type definitions**: `ccloader/js/types/mod.d.ts` and `plugin.d.ts` (namespace `ccloader`, class `Mod` with `loadPrestart/loadPreload/loadPostload/loadPlugin/onload` lifecycle). So the loader API is already typed.
- Our existing mods (`ambient-nights/poststart.js`, `positional-audio/`) are plain JS; a TS build step slots in without touching CCLoader.

### Setup (per-mod)
```
assets/mods/my-mod/
  ccmod.json          # unchanged — "main": "dist/main.js"
  src/main.ts         # authored here
  tsconfig.json       # target ES2018 (Chromium 71), module commonjs
  dist/main.js        # committed build output (CCLoader loads this)
```
- `tsconfig`: `"target": "ES2018"`, `"module": "CommonJS"`, `"strict": true`. No bundler needed unless you want one (esbuild is enough if you do).
- Commit `dist/` so users don't need a build step; add `npm run build` for development.
- Type the game surface you touch by hand (`ig.game`, `ig.Camera`, `ig.SoundHandleWebAudio`, …) in a `globals.d.ts` — ~100 lines covers everything our 5 research docs hook into. The deobf sources are the source of truth for those signatures.

### What TS buys us here
- The feature set in `Visuals_to_check.md` is glue-heavy: injects into `ig.Sprite.prototype.draw`, `ig.Camera.onPostUpdate`, `ig.SoundHandleWebAudio`, BGM transitions. Exactly the code where a typo silently breaks the game loop. TS catches those at build time.
- Refactors (e.g., swapping the motion-blur strategy in DOC 2) become safe.

### What it does NOT buy
- **Zero runtime performance.** TS is JS. Same V8, same Canvas2D calls, same GC. Do not adopt it for speed.

---

## 3. C++ — where it can and cannot run

### 3a. Native Node addons (`.node`) — proven to work, wrong layer
- The runtime is Node v11.6.0 → addons compiled for **ABI 68 (NODE_MODULE_VERSION 68)** load fine; greenworks proves it (binary exports `node::RegisterModule`, i.e. the classic NAN/V8-ABI path, no `napi_*` symbols).
- Toolchain: `node-gyp` with Node 11.x headers, NAN-style (greenworks-nw-0.35 is NAN/ABI-pinned, not N-API). N-API would also work and is version-agnostic, but the shipped precedent is ABI-pinned.
- **What it CAN do:** filesystem-heavy work, Steam integration, TCP/UDP, spawning processes, native crypto/compression — anything on the Node side of the nw.js split.
- **What it CANNOT touch:** the Canvas2D context, WebAudio graph, `requestAnimationFrame`, DOM. Those live in the **Chromium renderer process**, and Node addons have no handle on them. Every feature in `Visuals_to_check.md` (god rays, water, motion blur, DOF, positional audio) lives renderer-side.

### 3b. WebAssembly — the realistic "C++ in the renderer" path
- Chromium 71 runs WASM fine. C++ → Emscripten → `.wasm` executes inside the same JS thread(s) as the game.
- Use it for **per-pixel math**: the god-ray occlusion pass, water displacement, DOF blur kernels — the loops that are too slow in JS (see DOC 3's `getImageData` cost analysis).
- **The catch (same as DOC 3):** the data boundary. Getting pixels into and out of WASM still means `getImageData`/`putImageData` round-trips — often the dominant cost, not the math. WASM helps most when the kernel does *many passes per copy* (e.g., separable blur at 3 passes, water sim stepped 2–4× per frame).
- **Threads (updated):** Chromium 71 has no COOP/COEP, but we enable true Emscripten pthreads anyway by launching nw.js with `--enable-features=SharedArrayBuffer` (repo `package.json`). That makes SharedArrayBuffer + Atomics available without cross-origin headers, so the WASM kernels can run across a pre-spawned pthread pool (see DOC 7). Worth it only when a kernel does enough per-frame math to beat thread-sync overhead.

### 3c. Web Workers — the engine's own pattern to copy
- The engine already offloads per-pixel filters to a Web Worker (`impact.base.worker` + `assets/impact/webworker/image-tasks.js`, tasks `WORKER.IMAGE.SCALE` and `WORKER.IMAGE.MONOCHROME`, dispatched via `ig.Image.worker.doTask`). `ig.Image.addFiltered()` runs them async with a sync `<script>` fallback.
- **This is the correct home for heavy C++/WASM kernels**: a custom worker that imports our WASM module and exposes new task names (e.g., `WORKER.IMAGE.GODRAY`). Zero main-thread jank, matches engine architecture, no native-ABI issues at all.
- Caveat: workers can't touch the main canvas — they return ImageData buffers, so the same copy cost applies. Precompute what you can (static masks per map) at load time, like the engine's `addFiltered` cache does.

---

## 4. Decision table per feature (from `Visuals_to_check.md`)

| Feature | TS? | C++ native addon? | WASM in worker? | Verdict |
|---|---|---|---|---|
| 5. Positional audio (short-sound panning fix) | ✅ 10-line inject | ❌ no audio-graph access | ❌ pointless | **TS only** |
| 3. Motion blur (speedlines variants) | ✅ data + draw inject | ❌ | ⚠️ only if blur kernel proves slow | **TS first; WASM later if profiling demands** |
| 4. Foreground parallax blur | ✅ chunked band-draw | ❌ | ⚠️ separable blur candidate | **TS first** |
| 2. Water (reflection/refraction/caustics) | ✅ composite ops | ❌ | ✅ best WASM candidate (multi-pass sim) | **TS composite first; WASM if quality demands** |
| 1. God rays (occlusion) | ✅ pseudo beams | ❌ | ✅ occlusion mask + radial pass | **TS pseudo first; WASM mask as phase 2** |

---

## 5. Risks & gotchas

1. **ABI lock-in:** any `.node` addon must be compiled for Node **11.6 / ABI 68** (NAN/V8 ABI — the shipped greenworks is ABI-pinned, not N-API) and nw.js 0.35's Chromium. A system Node 18/20 toolchain will happily produce an addon that crashes the game on load. Pin the toolchain (`nvm use 11`) and test in-game, not in system Node. N-API addons are the one exception (version-agnostic), but then you must vendor the N-API runtime headers compatible with Chromium 71.
2. **Distribution:** `.node` binaries are platform-specific (win32/win64/linux/osx — exactly why greenworks ships 5 builds). A C++ mod multiplies support surface; a TS/WASM mod ships one artifact for all platforms.
3. **CSP / loading:** CCLoader injects mod JS as scripts; WASM instantiation from a worker script is fine, but fetching `.wasm` needs a file path the loader serves (`ig.getFilePath`), same as mod assets.
4. **No JIT in some contexts:** keep WASM in workers (full JIT); avoid relying on it inside the sync worker-fallback path.
5. **GC pressure stays in JS:** even with WASM math, the buffers you copy are JS-owned; reuse `ImageData` buffers (the engine reuses `ImageData` pools the same way) or you'll churn the GC every frame.
6. **TS gotcha:** Chromium 71 ≠ modern V8 — no optional chaining (`?.`) or nullish coalescing (`??`) in runtime code unless your TS target downlevels them (it does, with `target: ES2018`). Keep `lib` set to `ES2018 + DOM` so you don't accidentally reference newer DOM APIs.

---

## 6. Recommendation

1. **Adopt TypeScript now** for all new mod code (positional-audio, motion blur, parallax). Build to `dist/`, commit output, target ES2018. Immediate safety win, zero runtime risk.
2. **Skip C++ native addons** for this feature set — they can't reach the renderer-side systems we need, and they add ABI + 5-platform build burden for zero benefit here.
3. **Keep WASM-in-worker as the phase-2 performance lever**, only for water simulation and god-ray occlusion *if* profiling shows the TS/Canvas2D versions missing frame budget (DOC 3's budget table is the trigger). Mirror the engine's own `ig.Worker` + task-registry pattern so it feels native.
