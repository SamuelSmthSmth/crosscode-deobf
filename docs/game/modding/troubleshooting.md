# Mod troubleshooting

> Diagnose the first failure, identify the violated contract, and reduce the
> test matrix before changing code.

## Triage order

1. Confirm the mod is actually discovered and enabled.
2. Confirm the manifest stage and dependency versions.
3. Read the first exception and its source line.
4. Check whether the target `ig`/`sc` class exists at that stage.
5. Disable other mods and reintroduce them one at a time.
6. Run the smallest feature path: boot, one map, one effect, one menu, one sound.
7. Re-test resize, zoom, pause/focus, transition, and fallback behavior.

## Symptom table

| Symptom | Likely cause | First check |
|---|---|---|
| No console output | mod disabled, wrong package form, bad manifest, wrong stage field | enabled list, `.ccmod`/manifest, loader log |
| `ig` or `sc` is undefined | preload/early stage used for a runtime API | move to postload/poststart or add readiness gate |
| `Class.inject is not a function` | target is not loaded or wrong class name | search `deobf/clean/` and inspect stage |
| Effect runs twice | duplicate script/addon/injection | global install marker and addon arrays |
| HUD is blurred/tinted | post-draw order is after GUI (`500`) | print sorted `ig.game.addons.postDraw` |
| Effect is offset at zoom | map/logical/physical space confusion | active phase and `getScreenFromMapPos` use |
| Effect is clipped/stretched | stale buffer dimensions or CSS/backing mix-up | `realWidth`, `realHeight`, canvas bitmap |
| Next mod renders incorrectly | leaked alpha/filter/blend/transform/clip | `save`/`restore` and `finally` block |
| Sound has no pan | HTML5 backend or short-sound gate | `hasWebAudio`, `_doPanning`, range |
| Sound is too loud/quiet | squared volume and bus gain both applied | sound volume, manager bus, global map |
| Music fights itself | direct track play or stack mutation | use `ig.bgm` methods only |
| GUI cannot click | hook not attached/visible or no mouse record | `parentHook`, `_visible`, `setMouseRecord` |
| Option resets | late definition was not seeded/persisted | `sc.options.values`, storage global data |
| Worker works only once | stale `_id`, task mutation, non-reused protocol | inspect message/result shape |
| WASM never activates | missing paired `.wasm`, worker path, SAB/pthreads | `ig.LightingEngine._diag`, locateFile |
| Crash on map change | map cache/provider/handle survived level | level load callbacks and cleanup |

## Render debugging

Print the actual addon order, not the order you assume:

```js
ig.game.printGameAddonsString();
console.log(ig.game.addons.postDraw.map(function (a) {
    return [a.name, a.postDrawOrder];
}));
```

For every render hook record:

```text
hook: onPreDraw / onMidDraw / onPostDraw
order: numeric order
space: map, logical canvas, or physical/backing
transform: zoom active? reset?
buffer: owner, width, height, resize rule
state: alpha, blend, filter, clip, transform
```

If a physical pass is wrong, inspect `canvas.width`/`height` and compare them to
`ig.system.realWidth`/`realHeight`; CSS `style.width`/`style.height` are not the
bitmap dimensions. If a world effect is wrong only at zoom, keep it in mid-draw
or convert through the engine coordinate functions.

A context leak often manifests one addon later. Wrap custom passes in:

```js
ctx.save();
try {
    // draw
} finally {
    ctx.restore();
}
```

## Audio debugging

Check capabilities and listener state:

```js
console.log({
    enabled: ig.Sound.enabled,
    webAudio: ig.soundManager.hasWebAudio,
    context: ig.soundManager.context && ig.soundManager.context.context.state,
    listener: ig.game.soundPos
});
```

For a positioned handle inspect `handle.pos.point`, `handle.pos.range`, and
`handle.pos.rangeType`. A handle can be audible but unpanned because the native
backend intentionally does not update short one-shot positions. The
`positional-audio` mod’s `posaud-enabled`/short-sounds settings should be
checked if that mod is active; do not assume the mod can add panning to an HTML5
Audio backend.

If sounds vanish during rapid repeats, inspect their group: the sound manager
selects a closest request and stops other non-looping instances. Give genuinely
independent effects different groups or reduce event spam.

For BGM, inspect `ig.bgm.trackStack`, `defaultTrackSet`, `overloadDefault`, and
`ig.music.currentTrack`; do not fix a transition by calling the underlying track
manually.

## GUI debugging

```js
console.log(ig.gui.guiHooks);
ig.gui.logGUIArray();
```

Check:

- the element’s `hook.parentHook` is `ig.gui` or a live parent;
- `hook._visible`, `hook.size`, `hook.pos`, `hook.zIndex`;
- `hook.screenCoords` after mouse recording;
- `ig.game.mapRenderingBlocked` if a menu should block the map;
- `ig.system.width/height`, not `canvas.width/height`, for layout.

If a custom widget does not render, verify `updateDrawables(renderer)` queues a
draw command and that the root/parent is attached. If it renders but cannot be
clicked, enable mouse recording and make sure another higher-z hook is not
covering it.

## Options and save debugging

```js
console.log(sc.OPTIONS_DEFINITION['mymod-enabled']);
console.log(sc.options.values['mymod-enabled']);
console.log(sc.options.get('mymod-enabled'));
console.log(ig.storage.globalData);
```

A definition added after `OptionModel.init()` is not automatically present in
`values` or the native options GUI. Seed it, apply any saved value, and decide
whether the option belongs in global or per-save storage. On load, tolerate a
missing key from older saves; never assume a new field exists.

## Worker/WASM debugging

Use a small deterministic input and compare fallback and accelerated output.
For `lighting-wasm`:

```js
console.log(ig.LightingEngine._diag);
ig.LightingEngine.diag(console.log);
```

Interpret telemetry separately:

- `wasm: false` means the JS fallback is active, not necessarily that the visual
  result is wrong;
- `parallelism: 0` indicates the fallback/single-thread path;
- a failed locate/import/instantiation should still flush queued tasks into the
  fallback path;
- a changed memory buffer requires a fresh `HEAPU8` view.

## Packaging and compatibility checklist

Before reporting a bug, capture:

```text
CrossCode version:
CCLoader version:
mod id/version:
active mods:
manifest stage:
WebAudio active:
WASM active/fallback:
map/state:
zoom/scale:
reproduction steps:
first exception:
```

Then test with only the target mod, with the target’s declared dependencies,
and with the full enabled set. A mod that only works with an accidental load
order is not compatible yet.

## Guardrails

- Fix the first exception before chasing cascade errors.
- Do not disable all error logging to hide a compatibility failure.
- Do not debug a rendering problem only at one zoom/resolution.
- Do not call `getImageData` on the live full-resolution canvas as a first
  diagnostic; sample a downscaled/private buffer and measure the cost.
- Do not leave diagnostic overlays or hotkeys enabled in release defaults.
- Do not change several mods at once when isolating load-order behavior.

## Related

- [Mod lifecycle](mod-lifecycle.md)
- [Rendering and lighting](rendering-and-lighting.md)
- [Audio](audio.md)
- [UI and menus](ui-and-menus.md)
- [Agent reference](../agent-reference.md)
