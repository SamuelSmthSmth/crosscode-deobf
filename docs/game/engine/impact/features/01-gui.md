# impact.feature.gui — the GUI system

> **Status**: core · Modules: `impact.feature.gui.gui`,
> `impact.feature.gui.base.basic-gui`, `impact.feature.gui.base.box`,
> `impact.feature.gui.gui-images`, `impact.feature.gui.gui-steps`,
> `impact.feature.gui.plug-in`. Game layer: `game.feature.gui.*`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `gui.gui` | `ig.Gui` (element tree root), `ig.GuiHook` (linkable hook), `ig.GuiElementBase` (all GUI elements), `ig.GuiDrawable`, `ig.GuiTransform`, `ig.GuiStepPool` | The element hierarchy: pos/size/focus/draw, transitions, hooks |
| `gui.base.basic-gui` | `ig.ImageGui`, `ig.ColorGui`, `ig.SequenceGui`, `ig.SimpleGui` | Leaf element types: images, color fills, sequenced children |
| `gui.base.box` | `ig.NinePatch`, `ig.BoxGui` | Nine-patch image slicing + box layout base |
| `gui.gui-images` | `ig.GuiImage` (singleton), `ig.GuiImageContainer` | Preloaded image registry for GUI assets (`assets/media/gui/`) |
| `gui.gui-steps` | EVENT_STEP: `ADD_GUI`, `REMOVE_GUI`, `CHANGE_GUI_STATE`, `SHOW_IMAGE`, `MOVE_IMAGE`, `REMOVE_IMAGE` | Script GUI manipulation from events |
| `gui.plug-in` | — | Entry point, adds `ig.gui` addon + editor registration |

## How it works

- `ig.Gui` is a `GameAddon` (`postDrawOrder` ~500 — above world effects) that
  owns one root element; elements chain via `GuiHook`s. Every HUD box in the
  game (`sc.*HudGui`, `sc.*Menu`) is a `GuiElementBase` under `ig.gui`.
- Elements are **layout + draw + focus** units: `focus` navigation
  (arrow keys/gamepad), `onDraw` via nine-patch `BoxGui`, per-element
  ordering (`zIndex`), transitions (`executeTransition`).
- `ig.NinePatch` renders 3×3-sliced boxes from `assets/media/gui/*`,
  the backbone of every window/dialog frame in the game.
- `GuiStepPool` executes step-like element anims (move/alpha) — used by HUD
  pop-in animations.

## Data & asset touchpoints

- Images: `assets/media/gui/` (+ `gui/skins`, `gui/unused`) —
  see [media guide](../../../media/README.md).
- Script-driven GUI: `gui-steps` used inside event JSONs
  ([EVENT SHEET format](../../../data/formats/07-event-sheet.md)).
- The whole game HUD/menu layer (`game.feature.gui.*`, 55 modules: hud 23,
  widgets 17, base 7, screens 7) builds on this subsystem —
  see [game page](../../game/README.md) (stub).