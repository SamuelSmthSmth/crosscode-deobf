# impact.base — GlobalSettings & TileInfo loadables

> **Status**: core · Source: `deobf/clean/impact.base.global-settings.js`,
> `impact.base.tile-info.js` (classes), consumed from `assets/data/global-settings.json`
> and `assets/data/tile-infos.json`.

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.global-settings` | `ig.GlobalSettings` (`ig.globalSettings`) — `ig.SingleLoadable` | One boot-time JSON (`assets/data/global-settings.json`) holding **per-entity-type default config** and the `ItemDestruct` settings table |
| `impact.base.tile-info` | `ig.TileInfoList`, `ig.TileInfo` | Boot-time per-tileset tile metadata (`assets/data/tile-infos.json`) — solid/one-way/slope/animation flags (see [04-maps.md](04-maps.md)) |

## global-settings.json anatomy

```json
{
  "ItemDestruct": { … },
  "ENTITY": { "<EntityType>": { …default attribute overrides… } }
}
```

- `ENTITY.<Type>`: default attribute values merged onto entities of that
  type at spawn (e.g. shared `shadow`, `weight`, `collType` defaults) —
  applied by the `ig.Entity` spawn pipeline.
- `ItemDestruct`: settings for item-dropping destructibles
  (`game.feature.puzzle.entities.item-destruct`): drop chances, item pools,
  loot rules.
- Both are plain **data tables** — full value inventory in
  [data/misc-formats.md](../../data/formats/14-misc-formats.md) (stub; the
  JSON itself is the source of truth meanwhile).

## tile-infos.json anatomy

```json
{
  "media/map/rookie-harbor.png": [ …per-tile-index entries… ],
  …
}
```

Keyed by tileset image path (same keys as `assets/data/terrain.json`).
Each entry describes one tile index: solidity, directionality (one-way
drop-through), height/slope class, animation frame list. `ig.TileInfoList`
indexes these for fast `ig.CollMapTools` queries.