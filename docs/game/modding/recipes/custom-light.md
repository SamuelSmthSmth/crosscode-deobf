# Recipe: attach a native world light

> Use the engine’s `ig.LightHandle` rather than drawing a radial gradient in a
> post-process pass. Native lights participate in the light map and follow the
> entity’s map-space position.

## Contract

| Item | Choice |
|---|---|
| Owner | an `ig.Entity` that can accept attached objects |
| API | `new ig.LightHandle(...)` + `ig.light.addLightHandle(handle)` |
| Space | map space; the handle aligns to the target entity |
| Timing | native `ig.Light.onDeferredUpdate` and `onPreDraw`/`onMidDraw` |
| Cleanup | entity attachment detaches on kill; finished handles are removed by `ig.Light` |

## Minimal helper

```js
function addTorchLight(entity) {
    if (!entity || !ig.light || !ig.LightHandle) return null;

    var handle = new ig.LightHandle(
        entity,
        ig.LIGHT_SIZE.M,
        0.15,   // fade in, seconds
        0.25,   // fade out, seconds
        -1,     // indefinite until stop()/entity cleanup
        0.85,   // maximum alpha
        true    // draw the glow pass too
    );
    handle.setOffset(0, 0, 18);
    ig.light.addLightHandle(handle);
    return handle;
}

function removeTorchLight(handle) {
    if (handle) handle.stop();
}
```

The constructor attaches the handle to `targetEntity`; `setOffset(x, y, z)`
changes the light’s draw position relative to the entity center. `stop()` starts
its configured fade-out. Do not manually remove it from `ig.light.lightHandles`
while the addon is iterating in deferred update.

## Entity lifecycle pattern

For a mod that creates the entity itself, keep the handle as a field and stop it
when the entity is removed:

```js
var torchState = {
    handle: null,
    attach: function (entity) {
        this.detach();
        this.handle = addTorchLight(entity);
    },
    detach: function () {
        if (this.handle) this.handle.stop();
        this.handle = null;
    }
};
```

For an existing actor, prefer an idempotent marker on the entity or a map-scoped
registry so a level reload cannot create duplicate lights. Rebuild that registry
in `onLevelLoadStart`/`onLevelLoaded`.

## Darkness and flashes

The same addon owns other native handles:

```js
var darkness = new ig.DarknessHandle(false);
ig.light.addDarknessHandle(darkness);
darkness.setIntensity(0.65, 0.5);

var flash = new ig.ScreenFlashHandle(entity, '#ffffff', 0.05, 0.2, 0.05);
ig.light.addScreenFlashHandle(flash);
```

Darkness intensity is `0` for no added darkness and `1` for maximum darkness.
Multiple active darkness handles combine through the light addon’s lightness
calculation; coordinate ownership between mods instead of stacking arbitrary
screen fills.

## Conditionally placed lights

For map lights driven by a variable condition, use `ig.light.addCondLight` so
the engine batches the group and fades condition changes over its native 0.2 s
transition:

```js
ig.light.addCondLight(
    condition,
    Vec3.createC(320, 192, 0),
    ig.LIGHT_SIZE.L,
    ig.LIGHT_SIZE.M,
    ig.light.mainGlowColor
);
```

This API expects a condition object with `evaluate()` and a position object;
it is not the same as an entity-attached `LightHandle`.

## Guardrails

- Do not call `handle.draw()` yourself; the native addon owns the light-map and
  glow phases.
- Do not treat `ig.LIGHT_SIZE.M` as an arbitrary radius; it selects a source
  rectangle in `media/map/lightmap.png`.
- Do not update timers/intensity in a draw hook.
- Do not leave a handle registered after its owner is gone; stop it or let the
  entity-kill detach path run.
- Check `sc.options.get('lighting')` behavior before promising a custom light
  will be visible when the player disabled native lighting.
- If you need colored light, study `ig.GlowColor` and cached image wrappers;
  do not allocate/colorize a canvas per frame.
