# Recipe: fullscreen tint under the HUD

> Add a physical-screen color wash without patching the game draw method.
> This is a template, not a drop-in mod: choose an order that matches the
> effects you depend on.

## Contract

| Item | Choice |
|---|---|
| Hook | `ig.GameAddon.onPostDraw` |
| Example order | `300`, after tilt-shift (`250`) and before GUI (`500`) |
| Space | physical/backing pixels |
| State | no simulation mutation; tint color/alpha may be changed in update hooks |
| Cleanup | save/restore context; reset transform before drawing |

## Implementation

```js
(function () {
    'use strict';
    if (window.__myTintInstalled) return;

    function ready() {
        return window.ig && ig.GameAddon && ig.game && ig.game.addons &&
            ig.system && ig.system.context;
    }
    if (!ready()) return;

    var cfg = {
        enabled: true,
        color: 'rgba(18, 24, 64, 0.28)'
    };

    ig.FullscreenTintAddon = ig.GameAddon.extend({
        postDrawOrder: 300,

        onPostDraw: function () {
            if (!cfg.enabled) return;
            var ctx = ig.system.context;
            ctx.save();
            try {
                ctx.resetTransform();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
                ctx.fillStyle = cfg.color;
                ctx.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
            } finally {
                ctx.restore();
            }
        }
    });

    var addon = new ig.FullscreenTintAddon();
    ig.game.addons.all.push(addon);
    ig.game.addons.postDraw.push(addon);
    ig.game.addons.postDraw.sort(function (a, b) {
        return (a.postDrawOrder || 0) - (b.postDrawOrder || 0);
    });

    window.__myTintInstalled = true;
})();
```

## Why this works

`onPostDraw` executes after `ig.system.endZoomedDraw()`, so the camera zoom
transform has already been restored. `resetTransform()` still matters because
another addon may have left a transform on the shared context, and it makes the
space contract explicit. `realWidth`/`realHeight` cover the current backing
bitmap instead of assuming the designed logical viewport.

The example is registered directly because a `poststart` script commonly runs
after the game has initialized its addon lists. If the code loads before addon
initialization, prefer `ig.addGameAddon(function () { return new ...; })` and let
the engine include it during `ig.initGameAddons()`.

## Variations

### Multiply instead of overlay

Use `globalCompositeOperation = 'multiply'` for a color grade, but restore it
before returning. A multiply tint can darken the HUD if it runs after GUI; keep
its order below `500` when the HUD should remain unaffected.

### Animated tint

Update a numeric alpha in `onPostUpdate` or `onDeferredUpdate`, not in draw:

```js
onPostUpdate: function () {
    this.alpha = Math.max(0, Math.min(1, this.alpha + (this.target - this.alpha) * 0.1));
}
```

Then use a computed `rgba(...)` fill in `onPostDraw`.

## Failure checks

- If the tint is stretched or clipped, inspect `realWidth`/`realHeight` and the
  current canvas bitmap size.
- If the HUD is tinted unexpectedly, the order is too high or the effect is
  being drawn after GUI.
- If the next addon is broken, inspect context state and ensure the `finally`
  block ran.
- If it disappears when another post-process mod is enabled, print the sorted
  `ig.game.addons.postDraw` list and choose a deliberate order.
