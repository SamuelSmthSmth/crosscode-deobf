# game.feature.interact — interactions

> **Status**: core · 6 modules in `deobf/clean/game.feature.interact.*`.
> The game-layer interaction layer on top of
> `impact.feature.interact` ([13-interact](../../engine/impact/features/13-interact.md)):
> map-entity interactions, screen-edge zones, cutscene skipping, menu
> button groups and the floating interaction icon.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `interact.map-interact` | `sc.MapInteract` | Map-level interaction system: interact entries per world entity, per-frame state computation (HIDDEN/AWAY/NEAR/BLOCKED/FOCUS/RUNNING) from distance, line of sight, z-condition and combat state; drives the floating icon GUIs |
| `interact.gui.interact-gui` | `sc.InteractGui` | The floating interaction icon above an entity: animation state (DEFAULT/NEAR/AWAY/HIDDEN), positioned at the top of the target's collision box with a bobbing offset |
| `interact.screen-interact` | `sc.ScreenInteractEntry` | Screen-level entry triggering a callback object's `onInteraction` when the interact/escape key is pressed |
| `interact.skip-interact` | `sc.SkipInteract` | Cutscene skip: prioritized stack of entries; only the top-priority active entry receives skip events, with ENABLED/DISABLED notifications |
| `interact.button-group` | sc.ButtonGroup variants | Menu button groups: mouse-only traversal, keyboard/gamepad traversal with press-repeat, row-based grid stepping |
| `interact.plug-in` | — | Entry point: requires map/screen/skip interaction + GUI |

## Behavior

- **`sc.MapInteract`** is what makes the world interactive: each
  interactable entity registers an entry; every frame the system computes
  the entry state (hidden when far / away / near / blocked / focused /
  running) based on distance, line of sight, z-condition and whether the
  player is in combat, and shows the appropriate icon
  (`sc.InteractGui`) with the interaction prompt.
- **`sc.SkipInteract`** manages cutscene skipping: multiple systems can
  register skip requests, but only the highest-priority active one receives
  the skip input (used by the msg skip HUD, [msg](07-msg.md)).
- **`sc.ScreenInteractEntry`** handles full-screen interactions (e.g.
  \"press E\" prompts) via callback objects.

## Hooks & steps

- NPCs ([npc](03-npc.md)), props (`map-content.prop-interact`,
  [map-content](16-map-content.md)), chests ([puzzle](14-puzzle.md)) and
  fast-travel points all hook into `sc.MapInteract`.
- The base `ig.InteractManager`/`ig.InteractEntry` machinery lives in
  [impact.feature.interact](../../engine/impact/features/13-interact.md).

## Related

- [npc](03-npc.md) · [msg](07-msg.md) · [map-content](16-map-content.md)
- Engine: [impact.feature.interact](../../engine/impact/features/13-interact.md)