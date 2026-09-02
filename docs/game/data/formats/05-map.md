# MAP format (`assets/data/maps/**/*.json`)

> **Status**: core · 240+ level files, one per map, usually grouped in
> per-area folders (`maps/rookie-harbor/north.json`). DOCTYPE: `MAP`.
> Loaded by `ig.Map` ([engine 04-maps](../../engine/impact/04-maps.md)).
> A map carries tile layers, entities, inline event scripts and area
> attributes; it is the biggest single data format.

## File anatomy

```json
{ "name": "rookie-harbor/north",
  "levels": [ {"height": -64}, {"height": -48}, {"height": 0}, {"height": 32}, {"height": 96} ],
  "mapWidth": 80, "mapHeight": 110, "masterLevel": 2,
  "entities": [ …351 entries… ],
  "layer": { "0": { "id": 0, "type": "Background", "name": "Below", "level": 0,
                    "width": 80, "height": 110, "visible": 1,
                    "tilesetName": "media/map/rookie-harbor.png", "repeat": false,
                    "distance": 1, "tilesize": 16, "moveSpeed": {"x": 0, "y": 0},
                    "data": [[…tile ids…]] }, … },
  "attributes": { "saveMode": "ENABLED", "bgm": "rookieHarbor", "cameraInBounds": true,
                  "map-sounds": "", "mapStyle": "rookie-harbor-outer",
                  "weather": "AUTUMN", "area": "rookie-harbor" },
  "screen": { "x": 383, "y": 176 } }
```

(from `maps/rookie-harbor/north.json`)

## Top-level fields

| Field | Meaning |
|---|---|
| `name` | Map id (also the file path) |
| `levels` | Up to 5 z-levels `{height}` — entity z maps onto them (`getLevelIdx`) |
| `mapWidth`/`mapHeight` | Map size in tiles |
| `masterLevel` | Index of the level the player stands on |
| `entities` | Placed entities, each `{type, x, y, level, settings}` |
| `layer` | Object keyed by index → tile layer (see below) |
| `attributes` | Map attributes (see below) |
| `screen` | Initial camera screen offset |

## `layer.<idx>` — tile layers

Each layer object: `id`, `type` (`Background`, `Collision`, `HeightMap`,
`Navigation`, `Light`, `MovingParallax`…), `name` (e.g. `"Below"`,
`"object1"`, `"collision"`, `"postlight"`), `level` (z-level it renders
on), `width/height`, `visible`, `tilesetName` (image path — key into
`terrain.json`/`tile-infos.json`), `repeat`, `distance` (parallax factor),
`tilesize`, `moveSpeed` (auto-scroll), and `data` (2D array of tile ids).

## `entities[]` — placed entities

Each entry: `type` (entity class, e.g. `ObjectLayerView`, `NPC`, `Prop`,
`Enemy`, `Chest`, `Destructible`, `Door`, `TeleportCentral`,
`TeleportField`, `EventTrigger`, `TouchTrigger`, `HiddenBlock`,
`Analyzable`, `Marker`, `ScalableProp`…), `x`/`y` (pixels), `level`
(z-level or `{level, offset}`), and `settings` — a per-type config:

- `Prop`/`ScalableProp`: `propType`/`propConfig` `{sheet, name}` →
  [PROP format](08-prop.md); `propAnim`, `spawnCondition`, `size`,
  `terrain`, `blockNavMap`, `mapId` (editor id).
- `NPC`: character reference + state pages (`sc.NpcState`), interaction
  config.
- `EventTrigger`: `eventType` (PARALLEL/ONCE…), `endCondition`, and the
  inline `event` step list → [EVENT SHEET format](07-event-sheet.md).
- `TeleportCentral`/`TeleportField`: fast-travel wiring — `central`
  `{global, name}`, `dir`, `gfxType`, `landmark`, `condition`
  (e.g. `"plot.line >= 2310"`), `npcRunnerEnter/ExitProb`.
- `ObjectLayerView`: decorative/collision rectangle (`size`, `collType`,
  `zHeight`, `wallY`, `terrain`, `hideCondition`).

## `attributes` — per-map settings

| Key | Meaning |
|---|---|
| `area` | Owning area id (→ [AREA format](09-area.md)) |
| `mapStyle` | Style key (→ `game.feature.map-content.map-style` sprite/door tables) |
| `bgm` | BGM key (`ig.bgm`, [12-bgm](../../engine/impact/features/12-bgm.md)) |
| `weather` | Weather preset key ([09-weather](../../engine/impact/features/09-weather.md)) |
| `map-sounds` | Map soundscape key ([29-map-sounds](../../engine/impact/features/29-map-sounds.md)) |
| `saveMode` | `ENABLED`/`""` — whether the map allows saving |
| `cameraInBounds` | Clamp the camera to the map |
| `volume`, `npcRunners`, `mapSound` | Extra toggles (volume override, pedestrian density) |

## Related per-map data

- `assets/data/parallax/*.json` — parallax layer definitions referenced
  by map/area (see [13-misc](13-misc.md)).
- `assets/data/events/puzzle.json` — shared event-sheet snippets.
- `assets/media/map/baked/` — pre-rendered composite layer images for
  huge maps (see [engine 04-maps](../../engine/impact/04-maps.md)).

## Related

- Areas group maps: [AREA format](09-area.md)
- Inline scripts: [EVENT SHEET format](07-event-sheet.md)
- Engine: [04-maps](../../engine/impact/04-maps.md),
  [map-content](../../engine/game/16-map-content.md)