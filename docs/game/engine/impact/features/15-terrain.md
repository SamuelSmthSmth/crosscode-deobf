# impact.feature.terrain — terrain system

> **Status**: core · Modules: `impact.feature.terrain.terrain`,
> `impact.feature.terrain.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `terrain.terrain` | `ig.Terrain` (singleton `ig.terrain`, `SingleLoadable`) | Terrain-type lookup: name↔id maps, per-tile queries, danger/fall classification |
| `terrain.plug-in` | — | Entry point + editor registration |

## Behavior

- **Terrain ids**: `ig.TERRAIN` in `game.config` enumerates 24 types
  (NORMAL=1, METAL, CARDBOARD, EARTH, GRASS, WATER, WOOD, STONE, METALSOLID,
  SNOW, ICE, NOTHING, QUICKSAND, SHALLOW_WATER, SAND, COAL, HOLE, LASER,
  METAL_HOLLOW, SPIDERWEB, HIGHWAY, CRYSTAL, BEACH_WATER, BEACH_SAND).
  `ig.TERRAIN_DEFAULT = NORMAL`.
- **Data file**: `ig.TERRAIN_FILE = "data/terrain.json"` maps each tileset
  image path (`media/map/*.png`) to an array of per-tile terrain ids
  (one entry per tile of the tileset).
- **Queries**: `getTerrain(entity)` (terrain under an entity's centre,
  honouring per-entity overrides), `getPointTerrain(x, y, level)`,
  `getMapTerrain(x, y, levelIdx)`, `getTerrainOfMapTile(map, tileIndex)`.
- **Danger/fall**: `ig.DANGER_TERRAIN` (HOLE, WATER, COAL, HIGHWAY) is
  registered via `registerDangerTerrain(terrain, isFall)`; `isDangerTerrain`
  / `isFallTerrain` drive hazard behaviour (e.g. falling into pits).

## Consumers

- Player/NPC/enemy movement code queries terrain for footstep sounds/FX,
  ICE slip, WATER/QUICKSAND slowdown, HOLE falls. The **height-map**
  ([07-height-map.md](07-height-map.md)) and **map-content** layers read the
  same per-tile data for tile-based logic.