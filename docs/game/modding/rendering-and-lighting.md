# Rendering and lighting modding

> **Scope:** Canvas2D post-processing, world-space effects, native light-map
> integration, offscreen buffers, and worker/WASM lighting compute.
>
> **Verified sources:** `deobf/clean/impact.base.game.js`,
> `impact.base.system.js`, `impact.base.image.js`,
> `impact.feature.light.light.js`, `impact.feature.screen-blur.screen-blur.js`,
> plus the working mods `tilt-shift`, `real-shadows`, `wet-floor-reflection`,
> and `lighting-wasm`.

## The shortest correct mental model

CrossCode renders the game into one Canvas2D context. A frame is not “the game
canvas, then arbitrary effects”; it is an ordered sequence with two different
coordinate/transform regimes:

```text
update hooks
  → deferred update hooks
  → onPreDraw addons                 (native light/shadow prepass can run here)
  → startZoomedDraw()
      → renderer.prepareDraw()
      → renderer.drawLayers()        (maps + world entities)
      → onMidDraw addons             (native light composite, weather, particles)
      → drawPostLayerSprites()
  → endZoomedDraw()
  → onPostDraw addons                (physical post-process and HUD/diagnostics)
```

The exact engine calls are in `ig.Game.draw()`; addons are sorted numerically
inside each hook list. A number in `preDrawOrder` is never compared with a
number in `postDrawOrder`.

## At-a-glance integration table

| Feature | Preferred seam | Example order | Space | Owns / restores |
|---|---|---:|---|---|
| Shadow/light-map prepass | `ig.GameAddon.onPreDraw` | `0` | map/logical canvas while calculating | private light canvas; restore `ig.system.context` |
| World composite | `onMidDraw` | `0–101` | logical canvas with camera zoom active | `globalCompositeOperation`, `globalAlpha` |
| Capture world for blur | `onPreDraw` + `onPostDraw` | 1000/200 | buffer context then physical composite | system context/canvas, alpha, transforms |
| Blur the world below HUD | `onPostDraw` | 250 | physical/backing pixels after zoom ends | buffer, filter/composite state |
| Per-sprite shadow/reflection | `SpriteDrawSlot.draw` inject | n/a | map-space converted through current camera | save/restore around local transform/filter |
| Fullscreen tint | `onPostDraw` | 300 | physical/backing pixels | `resetTransform()`, blend mode, alpha |
| Diagnostic overlay | `onPostDraw` | >500 | physical/backing pixels | reset transform; never contaminate HUD/next frame |

The orders are repository examples, not reserved engine constants. If a mod must
sit relative to another addon, state both the number and the intended neighbor.

## Coordinate spaces and transforms

Use the vocabulary from the [agent reference](../agent-reference.md):

- **Map space:** world coordinates (`x`, `y`, `z`) used by entities, physics,
  camera targets, and map layers.
- **Logical canvas space:** the designed viewport (`ig.system.width` ×
  `ig.system.height`). The camera scroll and zoom are expressed here.
- **Physical/backing space:** bitmap pixels (`realWidth` × `realHeight` and the
  context’s backing dimensions). Fullscreen buffers and post-draw overlays use
  this space.
- **CSS viewport space:** browser layout pixels; do not use these for Canvas2D
  drawing unless you explicitly map them through the canvas element.

### Which transform is active?

- `onPreDraw` runs before `startZoomedDraw()`.
- `onMidDraw` runs after `startZoomedDraw()` and before `endZoomedDraw()`.
- `onPostDraw` runs after `endZoomedDraw()`.

For a world-space effect in `onMidDraw`, retain the camera transform and use
map-space coordinates. For a physical-screen effect in `onPostDraw`, isolate
the context and reset its transform:

```js
function drawPhysical(ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // Coordinates here are physical/backing pixels.
    ctx.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
    ctx.restore();
}
```

The engine’s `getScreenFromMapPos` and `getMapFromScreenPos` use logical canvas
coordinates and include `ig.game.screen`, zoom, and `zoomFocus`:

```ts
ig.system.getScreenFromMapPos(out: Vec2, mapX: number, mapY: number): Vec2;
ig.system.getMapFromScreenPos(out: Vec2, logicalX: number, logicalY: number): Vec2;
```

Do not reconstruct this math from `canvas.width`, CSS size, or a hard-coded
resolution. If you need a physical scale for an effect, derive it from the
current system dimensions and the buffer’s actual dimensions.

## Addon lifecycle and safe registration

The verified base contract is:

```ts
interface GameAddon {
  name: string;
  preDrawOrder: number;
  midDrawOrder: number;
  postDrawOrder: number;
  onPreDraw?(): void;
  onMidDraw?(): void;
  onPostDraw?(): void;
  onDeferredUpdate?(): void;
  onLevelLoadStart?(): void;
  onLevelLoaded?(): void;
}
```

A native addon is normally created by `ig.addGameAddon(function () { ... })` and
will be included by `ig.initGameAddons()`. A poststart mod that installs after
the game is already initialized must register the instance in the relevant
runtime lists itself, as `wet-floor-reflection` does:

```js
var addon = new ig.MyAddon();
ig.game.addons.all.push(addon);
ig.game.addons.postDraw.push(addon);
ig.game.addons.postDraw.sort(function (a, b) {
    return (a.postDrawOrder || 0) - (b.postDrawOrder || 0);
});
```

That late-registration pattern is useful but easy to get wrong. If a mod can
load before `ig.initGameAddons()`, prefer `ig.addGameAddon`; if it loads after,
verify every list it needs and make boot idempotent.

### Minimal idempotent boot shell

```js
(function () {
    if (window.__myRenderModInstalled) return;

    function ready() {
        return window.ig && ig.GameAddon && ig.game && ig.game.addons;
    }
    if (!ready()) return; // or retry briefly if the loader guarantees a later boot

    window.__myRenderModInstalled = true;
    // Install injections/addon here.
})();
```

For a retrying boot, set the installed flag only after all required patches and
addon registration succeed. If a patch throws, leave the flag clear and avoid
leaving a half-installed addon in `ig.game.addons`.

## Offscreen buffers

### Buffer ownership

Allocate long-lived canvases at boot, on resize, or when a map-sized resource
changes—not inside `onPostDraw`. Keep a record of the dimensions used to create
the buffer:

```ts
type BufferRecord = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};
```

`ig.system` exposes:

```ts
ig.system.getBufferContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D;
ig.system.createImageBuffer(
  width: number,
  height: number,
  draw: () => void
): HTMLCanvasElement;
```

Important implementation detail: `createImageBuffer` multiplies the requested
size by `ig.system.scale`, temporarily assigns the new context to
`ig.system.context`, invokes the callback, then restores the previous context.
The callback is not typed with a context parameter in the actual implementation;
use `ig.system.context` inside it or use `getBufferContext` directly.

The screen-blur addon demonstrates the full-frame pattern: buffers use
`ig.system.realWidth`/`realHeight`, their contexts are configured with
`ig.system.contextScale`, and `onPreDraw` temporarily redirects the system
context. Its `onPostDraw` restores `ig.system.context` and `ig.system.canvas`
before compositing.

### Resize and level invalidation

Canvas dimensions are not static. `ig.system.resize()` updates width, height,
scale, context dimensions, real dimensions, CSS-facing dimensions, and the
canvas bitmap. A mod-owned buffer must be recreated when any dimension it uses
changes. Map-sized light/shadow caches must be cleared at level load, typically
in `onLevelLoadStart` or `onLevelLoaded`.

A conservative check is cheap and robust:

```js
function ensureBuffer(rec, width, height) {
    if (rec.canvas && rec.width === width && rec.height === height) return rec;
    var canvas = ig.$new('canvas');
    canvas.width = width;
    canvas.height = height;
    rec = {
        canvas: canvas,
        ctx: ig.system.getBufferContext(canvas),
        width: width,
        height: height
    };
    return rec;
}
```

## Native lighting subsystem

`ig.light` is an `ig.Light` `GameAddon`. It owns four handle collections,
conditional-light groups, shadow providers, and the light-map image:

```ts
ig.light.addLightHandle(handle: ig.LightHandle): void;
ig.light.removeDarknessHandle(handle: ig.DarknessHandle): void;
ig.light.addDarknessHandle(handle: ig.DarknessHandle): void;
ig.light.addScreenFlashHandle(handle: ig.ScreenFlashHandle): void;
ig.light.addShadowProvider(provider: ShadowProvider): void;
ig.light.addCondLight(
  condition: Condition,
  pos: Vec3,
  lightSize: LightSize,
  glowSize?: LightSize,
  glowColor?: GlowColor
): void;
```

The exact handle constructors are verified in
`impact.feature.light.light.js`:

```ts
new ig.LightHandle(
  targetEntity: ig.Entity,
  size: number,
  fadeIn: number,
  fadeOut: number,
  duration: number,       // -1 means indefinite for a LightHandle
  maxAlpha: number,
  glow?: boolean
): ig.LightHandle;

new ig.DarknessHandle(useActualTick?: boolean): ig.DarknessHandle;
handle.setIntensity(intensity: number, duration: number): void;
handle.setTemporary(
  entity: ig.Entity,
  intensity: number,
  duration: number,
  fadeIn: number,
  fadeOut: number
): void;

new ig.ScreenFlashHandle(
  targetEntity: ig.Entity,
  color: string,
  fadeIn: number,
  fadeOut: number,
  duration: number
): ig.ScreenFlashHandle;
```

A `LightHandle` attaches itself to the target entity during construction. Its
`onEntityKillDetach` removes the attachment; its `update()` returns `true` when
finished. The native addon removes finished handles during `onDeferredUpdate`,
so a mod should not splice those arrays while drawing.

### Native light frame order

The verified `ig.Light` sequence is:

1. `onDeferredUpdate`: update/remove light, darkness, and flash handles; update
   conditional-light transitions.
2. `onPreDraw` order `0`: clear the private light canvas, ask shadow providers
   to draw shadows, cut conditional lights out of the shadow mask, draw the
   renderer’s light layer, apply darkness, then cut attached lights out.
3. `onMidDraw` order `0`: additive glow pass, composite the light canvas with
   `source-over`, draw attached glows and screen flashes, restore
   `source-over` and alpha `1`.

The light pass uses `ig.LIGHT_SIZE` and `ig.LIGHT_METRIC` rectangles from
`media/map/lightmap.png`; a light size is not a radius in arbitrary pixels.
The named sizes are `XXXXL`, `XXXL`, `XXL`, `XL`, `L`, `M`, `S`, `XS`, and
`NONE`.

### Darkness and lightness semantics

A `DarknessHandle` reports intensity in `[0, 1]`, where larger means darker.
`ig.Light.onPreDraw` computes the minimum remaining lightness (`1 - intensity`)
across darkness handles and fills the private light canvas with `#000008` at
the resulting darkness alpha. Multiple darkness handles therefore combine as
the darkest active result, not by blindly adding their alpha values.

### Shadow providers

A provider is expected to expose a numeric `shadowOrder` and a `drawShadows()`
method. Optional `drawGlow()` is called during the additive mid-draw pass:

```ts
interface ShadowProvider {
  shadowOrder: number;
  drawShadows(): void;
  drawGlow?(): void;
}

ig.light.addShadowProvider(provider: ShadowProvider): void;
ig.light.removeShadowProvider(provider: ShadowProvider): void;
```

Register once. `ig.Light.addShadowProvider` de-duplicates by object identity and
sorts by `shadowOrder`; it does not protect against two different providers
rendering the same geometry.

## Per-sprite seams: shadows and reflections

Some effects cannot be expressed as a single frame composite because they must
follow the renderer’s painter/depth order. The working `real-shadows` and
`wet-floor-reflection` mods use this seam:

```js
ig.CubeSprite.inject({
    setShadowFromEntity: function (entity) {
        this.parent(entity);
        // Mark this pooled sprite for the current frame.
    }
});

ig.Renderer2d.SpriteDrawSlot.inject({
    draw: function (zMin, zMax) {
        var sprite = this.cubeSprite;
        if (sprite && sprite.realShadow && this.ground) {
            // Draw effect before the sprite's own parent draw.
        }
        this.parent(zMin, zMax);
    }
});
```

This is an injection, not a public addon API. It must be treated as version
fragile and guarded by feature detection. `SpriteDrawSlot` objects are pooled;
clear per-frame flags every time `setShadowFromEntity` runs, as real-shadows
does with `this.realShadow = false` before testing the entity.

Keep the local draw operation isolated:

```js
var oldAlpha = ctx.globalAlpha;
var oldFilter = ctx.filter;
ctx.save();
try {
    ctx.globalAlpha = oldAlpha * opacity;
    ctx.filter = 'grayscale(1) brightness(0)';
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    image.draw(...);
} finally {
    ctx.restore();
    ctx.globalAlpha = oldAlpha;
    ctx.filter = oldFilter;
}
```

The `finally` is especially valuable in a development build: one thrown sprite
draw must not leave the shared context black, filtered, flipped, or scaled for
the rest of the frame.

## Workers and WASM for pixel kernels

The `lighting-wasm` mod mirrors the engine worker contract instead of inventing a
second transport. Its worker:

1. registers `WORKER.LIGHTING.APPLY`;
2. loads the pure-JS reference kernel;
3. starts one WASM instantiation flight in a real worker;
4. queues early tasks while WASM loads;
5. flushes the queue after success or failure;
6. returns the same result shape from WASM and JS.

The main thread calls it through `ig.Worker`, which means the engine’s
synchronous fallback can use the same `WORKER.LIGHTING` registry when a real
worker is unavailable.

### Stable task shape

```ts
type RadialLight = {
  cx: number;
  cy: number;
  radius: number;
  intensity: number;
  r: number;
  g: number;
  b: number;
  falloff: number;
};

type LightingParams = {
  radialLights?: RadialLight[];
  ambientR?: number;
  ambientG?: number;
  ambientB?: number;
  nightFactor?: number;
  lightGain?: number;
};

type LightingResult = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  wasm: boolean;
  parallelism: number;
  error?: string;
};
```

The kernel should have one copy into the compute heap and one copy out. Reuse
WASM allocations when width/height stay constant; free old pointers before
reallocating. Refresh the typed heap view after any operation that may grow
memory.

### Fallback contract

A worker/WASM feature is incomplete until the fallback is tested. The fallback
must:

- preserve the task name and payload/result shape;
- avoid throwing merely because `SharedArrayBuffer` or WASM is unavailable;
- report capability separately from visual correctness;
- allow the caller to disable the expensive effect if both paths fail;
- never block the main draw callback waiting for compilation.

`lighting-wasm` exposes `ig.LightingEngine._diag` and `diag(callback)` for this
reason. Its verdict intentionally requires more than “a module loaded”: it
checks SAB availability, compiled WASM use, observed parallelism, and a
brightness sanity condition.

## Performance design

### Start with a budget

Measure the complete frame, not only the kernel. Canvas copies, buffer swaps,
filters, worker serialization, WASM heap copies, and HUD diagnostics all count.
A useful mod diagnostic should report at least:

```ts
type FrameTelemetry = {
  frameMs: number;
  fps: number;
  bufferWidth: number;
  bufferHeight: number;
  effectPasses: number;
  lastKernelMs?: number;
  fallback?: boolean;
};
```

### Safe optimization ladder

1. Skip work when the effect is disabled or the relevant map/state is inactive.
2. Culling: do not draw offscreen lights, sprites, or effect regions.
3. Reuse buffers, gradients, atlas fragments, arrays, and worker allocations.
4. Reduce update frequency for slowly changing masks (`updateEvery` style).
5. Downscale expensive full-frame work, then composite to the current backing size.
6. Add adaptive quality and a failsafe that can disable the feature.
7. Only then consider a worker/WASM kernel; it does not remove copy/composite
   costs.

### Known expensive operations

- `getImageData`/`putImageData` can force synchronization; keep them out of the
  main per-frame canvas path.
- Full-resolution `ctx.filter = 'blur(...)'` is expensive; tilt-shift uses
  lower-resolution scratch buffers, cached masks, configurable pass counts, and
  adaptive/failsafe settings.
- Creating a canvas in a draw hook causes allocation/GC pressure and often
  invalidates browser optimizations.
- A worker can move arithmetic off-thread but still requires serialization or
  typed-array copies and a final Canvas2D composite.

## Compatibility matrix

Test every render mod against:

| Case | What to verify |
|---|---|
| `ig.system.zoom !== 1` | world effects remain anchored; physical effects remain full-frame |
| resize / widescreen | buffers match current real dimensions; no stretched stale canvas |
| map transition | map caches and shadow providers are rebuilt/removed |
| pause/menu/HUD | effect intentionally includes or excludes the right layer |
| dense combat | frame budget, culling, and failsafe behavior |
| lighting option off | custom light pass does not fight the native disabled state |
| worker unavailable | synchronous JS fallback produces a valid result |
| WASM unavailable | no unhandled promise/task failure; feature remains usable |
| another post-process mod | documented numeric order and clean context state |

## Guardrails — do not ship without these

- Do not hijack `ig.Game.prototype.draw` for a new frame effect when an addon
  hook expresses the same ordering.
- Do not draw physical pixels while the zoom transform is active.
- Do not use `ig.system.width` as the bitmap width for a buffer unless you have
  deliberately accounted for `ig.system.scale`/`contextScale`.
- Do not mutate handle arrays, map caches, or model state from a draw callback.
- Do not leave `globalAlpha`, `globalCompositeOperation`, `filter`, transform,
  or clip state changed after your pass.
- Do not assume a light size is a numeric radius or that a glow color is a CSS
  string; `GlowColor` is a cached `ImageCanvasWrapper`.
- Do not load WASM per frame or instantiate multiple copies because two early
  tasks raced.
- Do not make the WASM path the only path.
- Do not use `getImageData` every frame on the main canvas.
- Do not claim a render effect is “screen-space” without saying whether it is
  logical canvas or physical/backing space.

## Related references

- [Agent reference](../agent-reference.md)
- [Rendering engine](../engine/impact/03-rendering.md)
- [Native light map](../engine/impact/features/08-light.md)
- [Screen blur](../engine/impact/features/28-screen-blur.md)
- [Camera](../engine/impact/features/10-camera.md)
- [Mods index](README.md)
- [Fullscreen tint recipe](recipes/fullscreen-tint.md)
- [Custom light recipe](recipes/custom-light.md)
- [Worker/WASM recipe](recipes/worker-wasm-task.md)
