# MAP format (`assets/data/maps/**/*.json`)

> **Status**: stub (pending).

## Scope

- 240+ level files, one per map (e.g. `rookie-harbor/rookie-harbor.json`),
  DOCTYPE: `MAP`.
- Contains layers (background maps, collision map, height map), entities,
  event sheets, spawn points, map attributes (style, ambience, weather,
  bgm) and navigation graph.

## To document

- Full field reference: `attributes`, `layers[]` (type, tileset, data),
  `entities[]`, `eventSheets[]`, `spawnPoints`, `door`/`teleport`
  declarations, `mapStyle`, `mapSound`/`mapSounds`, `bgm` keys,
  `parallax`, `influences`, `lightMap` config.
- Related per-map data: `assets/data/parallax/`,
  `assets/data/maps/*/map.json` (background image refs).
- How `ig.Map`/`ig.BackgroundMap` load it
  ([engine: maps](../../engine/impact/04-maps.md)).

## Related

- Areas group maps: [AREA format](09-area.md).
- Event sheets inside maps: [EVENT SHEET format](07-event-sheet.md).
- Map-content entities (doors, props):
  [impact.feature.map-content](../../engine/impact/features/17-map-content.md).