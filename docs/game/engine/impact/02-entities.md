# impact.base — Entities, collision & physics

> **Status**: core · Source: `deobf/clean/impact.base.entity.js`,
> `impact.base.actor-entity.js`, `impact.base.coll-entry.js`,
> `impact.base.physics.js`, `impact.base.entity-pool.js`.

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.entity` | `ig.Entity`, `ig.AnimatedEntity`, `ig.AnimationPartEntity`, `ig.EntityTools`, `ig.COLLTYPE`, `ig.COLLSHAPE`, `ig.Entity.COLLISION_MAP`, `ig.ENTITY_REGISTRY` (via extend) | The entity base: pos/vel (x,y,z), size, collision type/shape, per-frame `update`/`draw`, hide/out-of-screen logic |
| `impact.base.actor-entity` | `ig.ActorEntity`, `ig.ActorConfig`, `ig.ACTOR_CONFIGS` | State/action-driven animated entity used by nearly all NPC-like characters; config data objects (enemy walkConfigs etc.) |
| `impact.base.coll-entry` | `ig.CollEntry`, `ig.COLL_UPDATE_TYPE`, `ig.COLL_HEIGHT_SHAPE`, `ig.COLL_SHADOW_TYPE`, `ig.COLL_GROUND_CONNECT` | Per-entity collision record (spatial-hash entry) |
| `impact.base.physics` | `ig.Physics` | The solver: spatial hash (cellSize 64), per-frame XY+Z movement, ground/hole/ceiling detection, entity-vs-entity traces, push forces |
| `impact.base.entity-pool` | `ig.EntityPool` (plain object) | Pooling of reused entities |

## `ig.Entity` essentials

- **Position is 3D**: `coll.pos = { x, y, z }`. `x/y` are map pixels; `z` is
  the 2.5D height axis. `level` index is derived from z
  (`ig.game.getLevelIdx(z)`) — that's what links entities to map z-levels.
- **Velocity/gravity**: `vel = { x, y, z }`, per-state `gravityFactor`,
  `zGravityFactor`, `airFriction`, `maxVel`, `accel` handled by the actor
  / player layer; base physics integrates and resolves.
- **Size/collision**: `size = { x, y, z }` (z is height), `padding`,
  `collType` (see table), `collShape` (`RECTANGLE` or slope shapes,
  `COLLSHAPE.SLOPE_NE/SE/SW/NW`).
- **Per-frame lifecycle**: `update()` (movement → trace → resolve → touches)
  then `draw()` (via renderer slot, see [03-rendering.md](03-rendering.md)).
  Entities outside the viewport get `updateType` demoted
  (`COLL_UPDATE_TYPE.STATIC`/`ON_SCREEN`/`DYNAMIC`) so the physics skips them.
- **Kill/spawn**: `ig.Entity._lastId` ids; `IG_ENTITY_KILL_CALL` window flag;
  pool reuse via `ig.EntityPool` (respawn cheaply).

### `ig.COLLTYPE` (numeric IDs)

| Value | Name | Collides with |
|---|---|---|
| 0 | `NONE` | (nothing) |
| 1 | `IGNORE` | BLOCK, FENCE, NPBLOCK, NPFENCE |
| 2 | `PROJECTILE` | BLOCK, FENCE, PBLOCK |
| 3 | `VIRTUAL` | VIRTUAL, BLOCK, FENCE, NPBLOCK, NPFENCE |
| 4 | `PBLOCK` | PROJECTILE, PBLOCK, BLOCK, FENCE |
| 5 | `NPBLOCK` | IGNORE, VIRTUAL, BLOCK, FENCE, NPFENCE |
| 6 | `BLOCK` | IGNORE, PROJECTILE, VIRTUAL, PBLOCK, BLOCK, NPBLOCK, SEMI_IGNORE |
| 7 | `TRIGGER` | (special: touch callbacks, no blocking) |
| 8 | `PASSIVE` | (walk-over, no interaction by default) |
| 9 | `SEMI_IGNORE` | (one-way-ish; used for platforms) |
| 10 | `FENCE` | like BLOCK for walls/fences |
| 11 | `NPFENCE` | NPC fence |

The full pair matrix lives in `ig.Entity.COLLISION_MAP[typeA][typeB]`.

## `ig.CollEntry` flags

- `updateType`: STATIC / ON_SCREEN / DYNAMIC — physics scheduling class.
- `heightShape`: NONE / NORTH_UP / EAST_UP / WEST_UP / SOUTH_UP — wedge-like
  height ramps for ground alignment.
- `shadowType`: DEFAULT / STATIC_SIZE / RECTANGULAR.
- `groundConnect`: LOOSE / FIXED / IN_EARTH / STRONG_FLIGHT — how an entity
  anchors to ground (used by jump/fall logic and `flyHeight` enemies).

## `ig.Physics`

- Spatial hash with `cellSize: 64`; `collEntryMap` sized to the map
  (`width = ceil(mapW/64)`, `height = ceil(mapH/64)+16`).
- `update()`: iterate active entries (`collUpdateList`), promote
  out-of-screen entries, integrate XY then Z, resolve vs tiles
  (see [04-maps.md](04-maps.md) `ig.MAP.Collision`) and vs entities
  (COLLISION_MAP), emit `touch`/`collide` events.
- `trace(...)` / `traceHole(...)`: swept movement checks; **holes** are
  special non-solid "holes" in collision layers that characters can fall
  through or trigger on (used for pitfalls).
- Push forces (knockback): `forcePushEntries` list applied after movement.

## `ig.ActorEntity` / `ig.ActorConfig`

- The base for player/NPC/enemy entities (`sc.Player`, NPCs, enemies extend
  it in the game layer): holds `walkAnims`, current `animState`,
  `stateMachine` hooks, `action` execution.
- `ig.ActorConfig`: runtime key/value config applied onto an entity —
  `loadFromData`, `overwrite/clearOverwrite` (temporary stat changes like
  enemy `modifiers`), `loadFromConfig` driven by the `ig.ACTOR_CONFIGS`
  KEYS tables (`walkConfigs` in ENEMY format maps here).
- `ACTOR_RUN_THRESHOLD = 0.75` — speed fraction above which "run" anims play.

## AnimatedEntity / AnimationPartEntity

- `ig.AnimatedEntity` = Entity + `animSheet` + `currentAnim` +
  `getDrawPos`/`setAnimState` glue — the bridge to
  [03-rendering.md](03-rendering.md) animations.
- `ig.AnimationPartEntity` — entity made of multiple animated parts (the
  consumer of MULTI_ENTITY_ANIMATION JSON, see
  [ANIMATION format](../../data/formats/02-animation.md)).