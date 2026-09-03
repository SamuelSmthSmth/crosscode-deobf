# CrossCode modding encyclopedia

> Practical implementation guides for mods that extend rendering, lighting,
> audio, UI, lifecycle, and data-driven systems. Start with the [agent
> reference](../agent-reference.md) for canonical vocabulary and hard
> constraints, then choose a subsystem below.

## Guides

| Guide | Use it when you need to… |
|---|---|
| [Rendering & lighting](rendering-and-lighting.md) | add a Canvas2D effect, replace lighting, capture the world, or move pixels through a worker/WASM kernel |
| Audio (planned) | spatialize sounds, add buses, or coordinate BGM/ambience |
| UI & menus (planned) | add a settings panel, HUD, overlay, or menu injection |
| Mod lifecycle (planned) | package a mod, choose `preload`/`postload`/`poststart`, or handle dependencies |
| API reference (planned) | search cleaned classes and verified signatures by subsystem |
| Troubleshooting (planned) | diagnose load order, context state, resize, performance, or compatibility failures |

## Recipes

- [Fullscreen tint](recipes/fullscreen-tint.md) — a minimal physical-screen
  post-draw pass that remains below the HUD.
- [Custom world light](recipes/custom-light.md) — attach a native
  `ig.LightHandle` to an entity with an explicit lifecycle.
- [Worker/WASM image task](recipes/worker-wasm-task.md) — mirror the engine’s
  `ig.Worker` registry with a JS fallback and one-time WASM loading.

## Recommended reading order

1. [Agent reference](../agent-reference.md): hook order, coordinate spaces,
   context rules, and test matrix.
2. [Rendering engine reference](../engine/impact/03-rendering.md): sprites,
   image caches, buffers, atlas reuse, and the painter’s-order renderer.
3. [Light-map reference](../engine/impact/features/08-light.md): native light,
   darkness, glow, shadow-provider, and conditional-light behavior.
4. [Rendering & lighting](rendering-and-lighting.md): how those pieces compose
   into a mod architecture.
5. A recipe matching the feature you are implementing.

## House rules for this section

- Every guide labels whether a value is **verified** in `deobf/clean/`,
  **observed** in a working mod, or only **pseudocode**.
- A recipe must state its hook, numeric order, coordinate space, ownership of
  every canvas/worker, and cleanup behavior.
- Engine APIs are preferred over patches. Use `Class.inject` only when an addon
  cannot express the required seam, such as per-sprite drawing.
- Code snippets are intentionally defensive: readiness checks, idempotent boot,
  context restoration, resize handling, and a fallback path are part of the
  implementation contract, not optional polish.

## Current implementation examples

| Mod | Pattern worth studying |
|---|---|
| `assets/mods/tilt-shift/` | private buffer swap at `preDrawOrder: 1000`, world post-process at `postDrawOrder: 250`, HUD left native and sharp |
| `assets/mods/real-shadows/` | renderer seam via `ig.CubeSprite` + `SpriteDrawSlot.inject`; per-sprite world-space shadow |
| `assets/mods/wet-floor-reflection/` | per-entity mirror at the sprite seam plus a physical-screen tint at `postDrawOrder: 300` |
| `assets/mods/lighting-wasm/` | engine-compatible worker task registry, single-flight WASM boot, pure-JS fallback, telemetry |
| `assets/mods/dev-overlay/` | diagnostic overlay above the HUD and runtime self-checks |

## Status

This is an expanding implementation handbook. The engine and mod indexes remain
source maps; this section is the task-oriented layer. Planned guides should be
added only after their underlying classes and working examples have been read.
