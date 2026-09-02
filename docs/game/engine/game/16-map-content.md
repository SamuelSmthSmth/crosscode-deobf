# game.feature.map-content — game-level map content

> **Status**: core · 11 modules in `deobf/clean/game.feature.map-content.*`
> (9 core + 2 GUI). The game-layer counterpart of
> `impact.feature.map-content` ([17-map-content](../../engine/impact/features/17-map-content.md)):
> elevators, jump panels, fast travel (rhombus map + teleporters), doors,
> prop interaction and map-style data.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `map-content.map-style` | — | Map style registrations: sprite sheets, door mats, teleport-field tiles, door variations, special-object tiles per area style (pure data) |
| `map-content.sc-doors` | — | Door type definitions for the major dungeons (cold, heat entrance/master, shockwave, final): collision size, open wait/effect, multi-part slide animations (idle/open/openFast/close) (pure data) |
| `map-content.entities.elevator` | `ig.ENTITY.Elevator`, elevator model | Per-area elevator configs (size, sprites, switch placement, sound/effects, stuck probability, party offsets); the entity moves vertically between destinations, optionally teleports to another map, with a block event + rumble; var accessor |
| `map-content.entities.jump-panel` | `ig.ENTITY.JumpPanel`, `JumpPanelFar`, `JumpPanelFloat` | Launchers: vertical, directional, float-mode; configured velocity/distance, effects, condition-gated, marks navigation as party-blocked when off |
| `map-content.entities.rhombus-point` | `sc.RhombusPoint` | Map marker for the rhombus fast-travel map: title, description, destination map/marker, visibility condition, preview icon |
| `map-content.entities.teleport-central` | `ig.ENTITY.TeleportCentral`, `sc.TeleportCentralMap`, `TeleportField` | Fast-travel system: named centers register themselves, act as landmarks (proximity detection, healing/teleport-ready AR boxes), group the TeleportField entry/exit visuals (enter/exit animations, glow, camera sequences) |
| `map-content.prop-interact` | `sc.PropInteract` | Interaction wrapper for map props: interact icon (info vs. grab), optional attached event, permanent effect, hover text, look-at camera cutscene on interaction |
| `map-content.map-content-steps` | EVENT steps | Open the rhombus fast-travel map (teleport + camera focus), move elevators, untrigger props |
| `map-content.gui.rhombus-map` | `sc.RhombusMapMenu`, `RhombusMenuInfo`, `RhombusMenuArrow`, `RhombusMenuLocation` | The rhombus travel map: selectable locations, arrow navigation, info panel |
| `map-content.gui.icon-hover-text` | `sc.IconHoverTextGui` | Hover text box for map icons |
| `map-content.plug-in` | — | Entry point: requires all entities + GUI; registers map-content lang file + editor panel |

## Behavior

- **Fast travel** is the headline feature: `sc.RhombusPoint` markers (one
  per destination) feed `sc.RhombusMapMenu`, which teleports via
  `ig.ENTITY.TeleportCentral`/`TeleportField` entry/exit pairs. The
  `OPEN_RHOMBUS_MAP` event step opens it from maps/events.
- **Elevators** move vertically between configured destinations, with
  per-area type configs, optional cross-map teleport, a block event and
  rumble feedback; the elevator model exposes a `*` var accessor for
  events to read elevator state.
- **Jump panels** are the classic launchers (vertical, directional, float),
  condition-gated and navigation-aware (a switched-off panel blocks the
  party's path).
- **Doors** (`sc-doors` data) define the dungeon door slide animations;
  the engine door mechanics themselves live in
  `impact.feature.map-content` ([17-map-content](../../engine/impact/features/17-map-content.md)).

## Hooks & steps

- EVENT steps from `map-content-steps` (`OPEN_RHOMBUS_MAP`, elevator move,
  prop untrigger) plus the engine-layer steps (`NUDGE_PROP`, `OPEN_DOOR`,
  `CLOSE_DOOR`, `ENTER_DOOR`).
- Props interact via `game.feature.interact` ([interact](17-interact.md)).

## Related

- [interact](17-interact.md) · [quest](08-quest.md) (rhombus unlocks)
- Engine: [impact.feature.map-content](../../engine/impact/features/17-map-content.md),
  [impact.feature.navigation](../../engine/impact/features/16-navigation.md)
- Data: [MAP format](../../data/formats/05-map.md), [AREA format](../../data/formats/09-area.md)