# impact.feature.interact — interaction manager

> **Status**: core · Modules: `impact.feature.interact.interact`,
> `impact.feature.interact.button-interact`, `impact.feature.interact.press-repeater`,
> `impact.feature.interact.gui.focus-gui`, `impact.feature.interact.plug-in`.
> Game layer: `game.feature.interact.*` (map-interact, screen-interact,
> skip-interact, button-group, interact-gui).

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `interact.interact` | `ig.InteractManager` (`ig.interact`), `ig.InteractEntry` | Universe of interactables: registration, hover/press routing, focus management |
| `interact.button-interact` | `ig.ButtonInteractEntry`, `ig.ButtonGroup` | Button-style interactions (menu buttons, prompt confirm) wired to groups |
| `interact.press-repeater` | `ig.PressRepeater` | Accelerating key-repeat (hold-to-scroll menus) |
| `interact.gui.focus-gui` | `ig.FocusGui` | GUI element that accepts interaction focus |
| `interact.plug-in` | — | Entry point + editor registration |

## Behavior

- Interactables register with `ig.interact` (map entities with the
  `interact` attribute, GUI buttons, screen zones). Per frame:
  hover detection → prompt display → press handling
  → callbacks (`onHover`/`onPress`/`onRelease`).
- `ig.InteractEntry` carries the prompt string, priority, and the
  press-type (`BUTTON_*`, `ONCE`, `REPEAT`…); the `interact-gui` layer
  (`game.feature.interact.gui.interact-gui`) draws the
  prompt-marker above heads (press-key icon + text).
- `ButtonGroup`s (menu buttons, quick-menu ring) let one press select among
  many entries with pointer/gamepad navigation.
- Press-repeater: the "hold to scroll" feel of lists/options.

## Game-layer consumers

- `sc.MapInteract` (NPCs, objects, chests…), `sc.ScreenInteract` (screen
  edge zones), `sc.SkipInteract` (cutscene skip zones), interactable
  buttons from `assets/data/characters`/map entities.