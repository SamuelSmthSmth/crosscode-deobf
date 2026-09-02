# impact.feature.gamepad — gamepad support

> **Status**: core · Modules: `impact.feature.gamepad.gamepad`,
> `impact.feature.gamepad.html5-gamepad`, `impact.feature.gamepad.nwf-gamepad`,
> `impact.feature.gamepad.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `gamepad.gamepad` | `ig.GamepadManager` (`ig.gamepad`), `ig.Gamepad` | Device abstraction: axes, buttons, connection state, mapping (Xbox/PS/Switch) |
| `gamepad.html5-gamepad` | `ig.Html5GamepadHandler` | Browser Gamepad API backend |
| `gamepad.nwf-gamepad` | `ig.NWFGamepadHandler` | nw.js native gamepad backend |
| `gamepad.plug-in` | — | Wires the manager into `ig.input` (`ig.input.gamepad`) |

## Behavior

- Standardized logical bindings: `"up"/"down"/"left"/"right"` stick+pad,
  action buttons mapped to logical names so game code is layout-agnostic.
- Dead zones, axis thresholds, per-frame delta (`pressed/released` mirroring
  `ig.Input` — see [06-input.md](../06-input.md)).
- Glyph/prompt switching (Xbox/PlayStation/Switch prompts) is handled by
  `sc.FontSystem` in the game layer (font glyph sets
  `icons-gamepad*.png` in `assets/media/font/`).