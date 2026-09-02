# AREA format (`assets/data/areas/*.json`)

> **Status**: core · One JSON per area (rookie-harbor, bergen,
> autumn-area, cold-dng, arid…). This file is **the area-map data** for
> the in-game map menu (floor tile grids + chest counts), *not* an
> area→maps/BGM/weather table — those live in the map `attributes`
> ([MAP format](05-map.md)) and the boot database
> ([DATABASE format](14-database.md)). DOCTYPE: `AREAS_MAP`.
> Consumed by `sc.AreaLoadable`/`sc.AreaRoomBounds` and the map menu
> ([menu](../../engine/game/05-menu.md), `menu.gui.map.*`).

## File anatomy

```json
{
  "DOCTYPE": "AREAS_MAP",
  "name": { "en_US": "Rookie Harbor", "de_DE": "Rookie Harbor", "fr_FR": "Rookie Harbor",
            "langUid": 2, "zh_CN": "新手港", "ko_KR": "초보자 항구", "ja_JP": "ルーキーハーバ―" },
  "width": 48, "height": 57,
  "floors": [ { "level": -2, "tiles": [ [0, 0, 0, …], … ] } ],
  "chests": 7,
  "defaultFloor": 0
}
```

(from `areas/rookie-harbor.json`)

## Fields

| Field | Meaning |
|---|---|
| `DOCTYPE` | `AREAS_MAP` |
| `name` | Localized area name (all 7 locales + `langUid`) |
| `width`/`height` | Area-map grid size in tiles (the map menu's canvas) |
| `floors` | One entry per floor: `{level, tiles}` where `level` is the z-level and `tiles` is a 2D grid of tile ids (map-menu autotiling, see `sc.MapFloor`/`TILE_*` tables in `menu.gui.map.map-floor`) |
| `chests` | Total treasure chests in the area (chest-completion counter for the area) |
| `defaultFloor` | Index of the default floor the area map opens on |

## Runtime use

- Loaded at boot via `sc.AreaLoadable`; `sc.AreaRoomBounds` flood-fills
  connected rooms per floor for the map's room/floor buttons.
- The map menu renders the floors, counts chests/stamps/landmarks per
  area and drives the world-map (`sc.MapWorldMap`) connections.
- Area ↔ map relationships: each map's `attributes.area` names its area;
  the `database.json` `areas` table holds per-area display data (see
  [DATABASE format](14-database.md)).

## Related

- Maps: [MAP format](05-map.md)
- Engine: [menu](../../engine/game/05-menu.md) (`menu.gui.map.*`),
  [impact.feature.bgm](../../engine/impact/features/12-bgm.md),
  [impact.feature.weather](../../engine/impact/features/09-weather.md)