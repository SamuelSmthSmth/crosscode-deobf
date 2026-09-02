# impact.base — Maps, background layers & collision

> **Status**: core · Source: `deobf/clean/impact.base.map.js`,
> `impact.base.background-map.js`, `impact.base.collision-map.js`,
> `impact.base.tile-info.js`. Platform-side: `game.feature.map-content.*`
> (doors, props, teleports) and height-map (`features/07-height-map.md`).

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.map` | `ig.Map`, `ig.ChunkedMap`, `ig.MAP` (layer registry) | 2D tile grids; chunked rendering (pre-rendered offscreen chunks), scroll/distance/parallax, animated tiles |
| `impact.base.background-map` | `ig.MAP.Background` (ChunkedMap), `ig.MAP.MovingParallax` | Background/parallax tile layers with pre-rendering + auto-scroll |
| `impact.base.collision-map` | `ig.MAP.Collision`, `ig.CollMapTools`, `ig.COLLISION` consts | Solid-tile layer format + the tile-vs-entity collision solver (`solveBlockCollision`), slope support |
| `impact.base.tile-info` | `ig.TileInfoList`, `ig.TileInfo` (registry) | Per-tileset metadata: which tile indices are solid/one-way/sloped, baked into `assets/data/tile-infos.json` |

## Map data model

A map JSON (see [MAP format](../../data/formats/05-map.md)) contains:

- `levels: [{height: -48}, {height: 0}, …]` — up to 5 z-indexed layers
  (`getLevelIdx(z)` maps entity z onto them).
- `masterLevel` — index of the layer the player stands on.
- Named layers — e.g. `"collision"` (grid of ids), `"first"`, `"object1"`,
  `"object2"`, `"postlight"`, background layers — each a
  `{ tileset name, data: [[tileId…]], repeat, distance, moveSpeed }`.

### `ig.MAP` registry

| Key | Class | Role |
|---|---|---|
| `ig.MAP.Collision` | (CollisionMap logic) | The solid layer: id → solidity lookup via TileInfo; `staticNoCollision` hint map; per-tile slope/height data |
| `ig.MAP.Background` | ChunkedMap | Parallax/background tilemaps (pre-rendered chunks for speed; `screenRender`/`lighter` flags for compositing) |
| `ig.MAP.MovingParallax` | ChunkedMap | Auto-scrolling background layers (`moveSpeed` driven) |
| `ig.MAP.HeightMap` | (from height-map feature) | Editor height data — see [features/07-height-map.md](features/07-height-map.md) |
| `ig.MAP.Light` | (from light feature) | Shadow-provider layer — see [features/08-light.md](features/08-light.md) |
| `ig.MAP.Navigation` | (from navigation feature) | Pathfinding node graph — see [features/16-navigation.md](features/16-navigation.md) |

## Collision solver

- `ig.CollMapTools` (in collision-map.js): spatial queries over solid grids
  (`isSolid`, tile lookups).
- `ig.MAP.Collision.solveBlockCollision(result, x, y, velX, velY, sizeX,
  sizeY, blockX, blockY, blockW, blockH, slopeType)` — per-block resolution
  used by `ig.Physics` ([02-entities.md](02-entities.md)); `slopeType` maps
  to slope tiles (up-hill movement allowed on RAMP tiles).
- `ig.COLLISION.EPS = 1e-5`, `SLIP_PIXELS = 8`, `HEIGHT_TOLERATE = 4` —
  the tunable constants of tile-vs-entity solving.
- **Holes**: non-solid "hole" tiles; `traceHole` in physics detects them
  (fall-through platforms).

## TileInfo — the solidity dictionary

- `assets/data/tile-infos.json` is keyed by tileset PNG path
  (e.g. `"media/map/rookie-harbor.png"`) and lists per-tile-index metadata
  (solid, one-way, slope, animated…).
- `ig.TileInfoList` (SingleLoadable) loads it once at boot; `ig.TileInfo`
  answers queries like "is tile 42 of sheet X passable from the top?".
- `assets/data/terrain.json` complements it with terrain-type constants
  (for the height-map editor) — see [data misc](../../data/formats/14-misc-formats.md).

## Rendering notes

- `ig.ChunkedMap.draw()` renders only visible chunks (viewport intersection)
  and caches them — this is why big maps stay cheap.
- Animated tiles: tile indices flagged animated in TileInfo get re-drawn
  per frame from the sheet.
- `setScreenPos()` per layer each frame: scroll = camera pos × distance
  (1.0 = normal, <1 = parallax far layers); `repeat` tiles wrap modulo map.
- Baked static layers exist in `assets/media/map/baked/` — pre-rendered
  composite images used by the editor/renderer for huge layers.