# impact.feature.height-map — editor height data

> **Status**: core · Modules: `impact.feature.height-map.height-map`,
> `impact.feature.height-map.height-map-config`,
> `impact.feature.height-map.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `height-map.height-map` | `ig.MAP.HeightMap` (layer), `wm.HeightMapConverter`, `ChipsetSettings` | Editor-height layer format + tooling; **verified behavior-identical to extract** |
| `height-map.height-map-config` | `ig.CHIPSET_SETTINGS`-style tables | Pure data: chipset height settings per tileset |
| `height-map.plug-in` | — | Entry point + editor registration |

## Behavior

- Height maps are the level-design data that tells the engine how each tile
  stacks in z (which tiles are "walls" rising to which z-height) — the data
  behind the 2.5D look combined with `wallY` cube-splitting
  ([03-rendering.md](../03-rendering.md)).
- `ChipsetSettings` maps tileset → per-tile height classes; the renderer and
  collision use height info for z-layering entities behind/above walls.
- Editor-side (`wm.*`): converter utilities used by the bundled editor to
  bake height maps into map JSONs (`assets/data/maps/**` carry the height
  layer data).
- Runtime consumers: `ig.CubeSprite` wall/ground splits, z-clipping in
  `SpriteDrawSlot`, camera `zFocus` logic.