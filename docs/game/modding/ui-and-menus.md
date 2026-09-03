# UI and menu modding

> **Scope:** retained GUI trees, layout, drawables, input/hit testing, HUD
> overlays, menu injection, and persistent mod options. Verified sources include
> `deobf/clean/impact.feature.gui.gui.js`,
> `impact.feature.gui.base.basic-gui.js`,
> `game.feature.model.options-model.js`, and the working `tilt-shift` menu
> integration.

## At a glance

| Need | Preferred surface | Space / lifecycle |
|---|---|---|
| Add a widget | `ig.GuiElementBase` subclass | logical canvas; attach to a parent hook |
| Add an image | `ig.ImageGui` | logical GUI coordinates; image is cached |
| Add a rectangle/tint | `ig.ColorGui` | logical GUI coordinates; optional blend mode |
| Add children | `parent.addChildGui(child)` | retained tree; child is detached from old parent |
| Add a HUD layer | `ig.gui.addGuiElement(element)` | root GUI list sorted by `hook.zIndex` |
| Remove a widget | `element.remove(immediate?)` | detach now or after transition |
| Make it clickable | `hook.setMouseRecord(true)` + `onMouseInteract` | hit-tested in logical canvas coordinates |
| Add a game option | `sc.OPTIONS_DEFINITION` + `sc.options` | option model and storage |
| Draw diagnostics | `ig.GameAddon.onPostDraw`, order >500 | physical/backing pixels above GUI |

## GUI architecture

`ig.gui` is an `ig.GameAddon` with a root `guiHooks` list. Each
`ig.GuiElementBase` owns one `ig.GuiHook`; the hook stores position, size,
alignment, pivot, scroll, visibility, alpha, transitions, clipping, z-index,
and children.

The frame flow is:

```text
ig.gui.onDeferredUpdate()
  → update mouse state
  → recursively update hooks and visibility
  → call element.update()
  → call element.updateDrawables(renderer)
  → enqueue pooled draw steps
ig.gui.onPostDraw() at postDrawOrder 500
  → renderer.draw()
```

GUI coordinates are **logical canvas coordinates**, not map space and not
physical backing pixels. The engine maps browser mouse coordinates back into
`ig.system.width`/`height` before hit testing. Use `ig.GameAddon` post-draw for
a physical screen diagnostic instead of placing a GUI element at a guessed
backing resolution.

## Minimal custom element

```js
ig.MyStatusGui = ig.GuiElementBase.extend({
    init: function (label) {
        this.parent();
        this.label = new sc.TextGui(label, { font: sc.fontsystem.tinyFont });
        this.addChildGui(this.label);
        this.setSize(140, 24);
        this.setPivot(0, 0);
    },

    update: function () {
        // Read state; do not mutate the GUI tree while the recursive update is
        // iterating unless the surrounding subsystem explicitly supports it.
    },

    updateDrawables: function (renderer) {
        renderer.addColor('rgba(0,0,0,0.65)', 0, 0, this.hook.size.x, this.hook.size.y);
    }
});

var widget = new ig.MyStatusGui('Ready');
widget.setPos(8, 8);
widget.hook.zIndex = 100;
ig.gui.addGuiElement(widget);
```

The renderer’s concrete helpers vary by GUI subsystem, but the stable pattern is
to enqueue drawables in `updateDrawables(renderer)`, not to call
`CanvasRenderingContext2D` directly. `ig.ImageGui` and `ig.ColorGui` are useful
reference implementations:

```ts
new ig.ImageGui(
  image: ig.Image,
  offsetX?: number,
  offsetY?: number,
  width?: number,
  height?: number
): ig.ImageGui;
new ig.ColorGui(
  color: string,
  width?: number,
  height?: number
): ig.ColorGui;
```

`ig.ImageGui.setAnimation(frames, frameTime, xCount, loop?)` advances from
`update()` and selects a sheet frame in `updateDrawables()`. Assets should be
loaded/cached before drawing; image load completion may determine automatic size
and pivot.

## Layout and tree ownership

```ts
element.setPos(x: number, y: number): void;
element.setSize(width: number, height: number): void;
element.setPivot(x: number, y: number): void;
element.setAlign(alignX: number, alignY: number): void;
element.setScroll(x: number, y: number): void;
element.addChildGui(child: ig.GuiElementBase): void;
element.insertChildGui(child: ig.GuiElementBase, index: number): void;
element.removeChildGui(child: ig.GuiElementBase): void;
element.removeChildGuiByIndex(index: number): ig.GuiElementBase;
element.removeAllChildren(): void;
element.remove(immediate?: boolean): void;
```

`addChildGui` detaches the child from any previous parent, appends it, and calls
attachment callbacks when the parent is itself attached. Root elements are sorted
by `hook.zIndex`. Call `ig.gui.sortGui()` after changing a root z-index at
runtime.

Use `onAttach` for resources that require a live GUI parent and `onDetach` for
cleanup. `remove(false)` marks the hook for removal after its transition;
`remove(true)` detaches immediately. A temporary/event GUI may be removed by
`ig.gui.onReset()` during map transitions.

### Visibility and transitions

The hook has a state-machine transition layer with `DEFAULT`, `HIDDEN`, custom
states, alpha, scale, angle, offsets, and easing functions. `ig.SimpleGui`
provides:

```ts
element.show(immediate?: boolean, delay?: number): void;
element.hide(immediate?: boolean, delay?: number): void;
element.doStateTransition(
  stateName: string,
  immediate?: boolean,
  removeAfter?: boolean,
  callback?: Function,
  delay?: number
): void;
```

Prefer transitions over manually changing alpha/position in a draw callback.
Keep the transition definition on the element/class and keep simulation state in
the model or update hook.

## Input and hit testing

Set `hook.setMouseRecord(true)` to register a hook with `ig.gui`’s mouse
listener list. The GUI update pass computes absolute `screenCoords`, tracks
visibility and z-order, then calls:

```ts
element.onMouseInteract?(over: boolean, click: boolean): void;
element.isMouseOver?(): boolean;
```

If multiple visible recorded hooks overlap, the highest computed GUI z-index wins.
The control module can replace the raw mouse source for gamepad/cursor support.
Do not install a second document-wide click system for a normal GUI button; it
will bypass GUI z-order and focus behavior.

Keyboard/gamepad navigation is usually owned by the menu/control subsystem. A
custom menu should integrate with the surrounding menu model rather than
consuming every key event globally. Use unique actions/bindings and respect
`ig.input.ignoreKeyboard`, focus state, and text-input targets.

## HUD, menu, and diagnostic layers

- **HUD:** a root GUI element or existing HUD container; logical coordinates,
  normally rendered by `ig.gui` at post-draw order `500`.
- **Menu:** a model-owned GUI tree that participates in focus/navigation and may
  block map rendering through `hook.screenBlocking`.
- **Diagnostic overlay:** a physical-screen `onPostDraw` addon with order above
  `500`, useful for pixels/telemetry that should sit above the GUI.

Do not use a physical Canvas2D overlay for a normal menu: it will not receive
GUI focus, transitions, or hit testing. Conversely, do not force a large
full-screen debug canvas into the GUI tree if it is only a diagnostic pass.

## Adding persistent options

The option model defines types and categories:

```ts
sc.OPTION_TYPES = {
  BUTTON_GROUP: 0, ARRAY_SLIDER: 1, OBJECT_SLIDER: 2,
  CHECKBOX: 3, CONTROLS: 4, LANGUAGE: 5, INFO: 6
};
sc.OPTION_CATEGORY = {
  GENERAL: 0, INTERFACE: 1, VIDEO: 2, AUDIO: 3,
  GAMEPAD: 4, CONTROLS: 5, ASSISTS: 6, ARENA: 7
};
```

A definition contains a type, initial value, category, and optional data/fill,
divider/header, restart, or local-save flags:

```js
sc.OPTIONS_DEFINITION['mymod-enabled'] = {
    type: 'CHECKBOX',
    init: true,
    cat: sc.OPTION_CATEGORY.VIDEO
};

sc.options.set('mymod-enabled', false);
var enabled = sc.options.get('mymod-enabled');
```

The built-in `OptionModel` normally initializes values before a poststart mod
adds new definitions. A late-loading mod must seed `sc.options.values[key]`
from its persisted/default value, as `tilt-shift` and `positional-audio` do. If
the option needs a visible native control, inject the appropriate option GUI or
register it before the model/UI initialization point. Do not assume adding a
definition after initialization automatically creates a menu row.

`sc.OptionModel.set` marks the model changed, applies system side effects for
built-in keys, and notifies observers. `persistOptions()` calls
`ig.storage.saveGlobals()` when changed. For a mod, use `sc.options.set/get` and
let the model/storage path own persistence; localStorage should be reserved for
mod-private data that is deliberately outside game options.

## Guardrails

- Never draw a GUI element directly into the game context from `update()`.
- Never confuse GUI logical coordinates with physical backing pixels or map
  coordinates.
- Never attach the same child to two parents without using the tree APIs.
- Never mutate `guiHooks` while iterating it unless you understand the detach
  semantics; schedule removal or use the owning API.
- Never leave a mouse-record hook registered after detaching it.
- Never use a generic global keydown listener for a menu action that should obey
  focus/navigation rules.
- Never add a definition without a unique option prefix; collisions overwrite
  another mod’s definition.
- Never claim a late-added option is persisted until its `values` seed and
  storage path have been tested.
- Never put a normal HUD/menu into a post-draw physical overlay merely to avoid
  learning the GUI tree.

## Related

- [Options-menu recipe](recipes/options-menu.md)
- [Engine GUI reference](../engine/impact/features/01-gui.md)
- [Agent reference](../agent-reference.md)
- [Modding index](README.md)
