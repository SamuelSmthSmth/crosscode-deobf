# AREA format (`assets/data/areas/**/*.json`)

> **Status**: stub (pending).

## Scope

One JSON per area (rookie-harbor, bergen, autumn-area, arid,
final-dungeon…) describing the area as a whole: display name, description,
which maps it contains, weather, BGM, influences.

## To document

- Field reference: `name`, `description`, `maps[]`, `bgm` /
  `bgmSets` (see [impact.feature.bgm](../../engine/impact/features/12-bgm.md)),
  `weather` presets, `mapSound` ambience, `influences`, `spawnPoints`,
  `savepoints`…
- How the area is loaded at boot and how the game resolves
  map → area (fast travel, world map, BGM switching).

## Related

- Maps: [MAP format](05-map.md).
- Engine: [impact.feature.bgm](../../engine/impact/features/12-bgm.md),
  [impact.feature.weather](../../engine/impact/features/09-weather.md),
  [impact.feature.map-sounds](../../engine/impact/features/29-map-sounds.md).