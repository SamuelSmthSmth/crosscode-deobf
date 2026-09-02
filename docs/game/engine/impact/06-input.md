# impact.base — Input (keyboard, mouse, touch, gamepads)

> **Status**: core · Source: `deobf/clean/impact.base.input.js`. Extensions:
> `impact.feature.gamepad.*` ([features/05-gamepad.md](features/05-gamepad.md)),
> `game.feature.control.control` (input routing, game layer),
> `game.feature.auto-control` (scripted input, game layer).

## Module & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.input` | `ig.Input` (`ig.input`), `ig.KEY`, `ig.BIND_TYPE` | Raw key/mouse/touch capture, logical bindings (`bind/unbind`), state queries (`pressed/down/released`), mouse-to-logical-space remapping, keyboard layout handling |

## How input works

- **Bindings**: `ig.input.bind(ig.KEY.X, "jump")` maps physical keys to
  logical action names. `ig.KEY` enumerates keycodes (incl. gamepad buttons
  and `MOUSE1/2`, `MOUSE_WHEEL_UP/DOWN`).
- **State API** (polled once per frame, cleared by `ig.input.clearPressed()`):
  - `ig.input.pressed("jump")` — true on the frame the key went down;
  - `ig.input.down("jump")` — held;
  - `ig.input.released("jump")` — on the frame it went up;
  - `ig.input.state("jump")` — raw `{down, pressed, released}` object.
- **Raw axis/mouse access**: `ig.input.mouse` (`{x, y, pressed, down…}`,
  remapped to **logical resolution** via
  `mouse.x *= ig.system.width / ig.system.screenWidth`), `ig.input.touch`,
  `ig.input.accel` (device motion), `ig.input.gamepad`.
- **Keyboard layout**: `ig.KEY` supports scancode lookup per
  `ig.input.setKeyLayout` (QWERTY vs others); gamepad glyph swaps happen in
  `sc.FontSystem` ([game layer](../../engine/game/README.md)).
- **Modifiers/edges**: `altReplaced` handling, `mousemove` throttling,
  `preventDefault` policy for bound keys (stops page scrolling).

## Where the bindings are defined

The actual in-game bindings (attack, dash, guard, jump, menus…) are set in
`game.main.js` (`sc.CrossCode` boot, `initInput`-area) and re-bindable from
Options (`ig.KEY` + `sc.KeyBinder` in `sc.OptionModel`). Gamepad bindings
mirror these through `ig.GamepadManager` ([features/05-gamepad.md](features/05-gamepad.md)).

## Input consumers (map)

| Consumer | How it reads input |
|---|---|
| Player entity (`sc.Player`) | `ig.input.down/pressed` on action names + virtual stick dirs |
| `sc.Control` (game layer) | Routes for menus, combat, elements, gamepad |
| GUI (menus) | `ig.input.pressed` navigation; click via `ig.input.mouse` |
| `sc.AutoControl` | Injects synthetic `ig.input` values for cutscenes (auto-control-steps) |
| `ig.PressRepeater` | Accelerating key-repeat for menu scrolling ([features/13-interact.md](features/13-interact.md)) |