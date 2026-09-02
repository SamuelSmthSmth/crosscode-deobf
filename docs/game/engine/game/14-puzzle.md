# game.feature.puzzle — puzzle entities & logic

> **Status**: core · 43 modules in `deobf/clean/game.feature.puzzle.*`
> (42 entities/components + plug-in + steps). CrossCode's dungeon puzzle
> vocabulary: switches, blocks, platforms, element balls, destructibles,
> rails, teleporters and hazards — all map-placed `ig.ENTITY.*` classes.

## Modules & classes

### Shared component

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.components.push-pullable` | `sc.PushPullable` | Shared push/pull block logic: player grip (4-pixel-step dragging), interaction icons, used by `sc.PushPullBlock`/`sc.WavePushPullBlock` |

### Switches & activators

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.entities.switch` | `ig.ENTITY.Switch` | Ball-hit toggle switch flipping a named variable; animated on/off states; optional ball destroyer |
| `puzzle.entities.one-time-switch` | `ig.ENTITY.OneTimeSwitch`, `sc.ONE_TIME_SWTICH_TYPE` | Fires once: sets/increments a var, optionally timed, optional teslaSwitch reaction |
| `puzzle.entities.multi-hit-switch` | `ig.ENTITY.MultiHitSwitch` | Requires `hitCount` hits within a timeout; hits decay after `decreaseDelay`; stays on once fully hit |
| `puzzle.entities.floor-switch` | `ig.ENTITY.FloorSwitch` | Pressure switch activated by entities standing on it (PERMANENT / WHILE_ON_TOP delayed / UNDOABLE); increments a var while active |
| `puzzle.entities.group-switch` | `ig.ENTITY.GroupSwitch` | Ball-hit switch grouped by name; all must be hit within the active time to toggle (LOCAL resets individually, GLOBAL is shared) |
| `puzzle.entities.bounce-switch` | `ig.ENTITY.BounceSwitch`, `ig.ENTITY.BounceBlock`, `sc.BounceSwitchGroups` | Launch groups of bounce blocks when activated (optionally setting a var) |
| `puzzle.entities.key-panel` | `ig.ENTITY.KeyPanel` | Ground panel overriding the thrown ball with a dungeon key projectile while stood on (REGULAR: DUNGEON_KEY, MASTER: DUNGEON_MASTER_KEY) |
| `puzzle.entities.ball-changer` | `ig.ENTITY.BallChanger`, `sc.BALL_CHANGER_TYPE` | Pad modifying a passing ball: CHANGE_DIR (8-way redirect), CHANGE_SPEED, RESET_SPEED… |
| `puzzle.entities.enemy-counter` | `ig.ENTITY.EnemyCounter` | Scoreboard counting down defeats of an enemy group (2-digit display); sets preVariable when cleared, postVariable when the marble arrives |

### Blocks, walls & platforms

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.entities.block` | `ig.ENTITY.Block` | Simple solid block with normal/touched animations (0.2 s flash on touch) |
| `puzzle.entities.blockers` | `ig.ENTITY.Blocker`, `sc.BLOCKER_TYPE` | Variable-controlled barrier toggling on/off animations + heights; diagonal slope variants (diagonalNW/NE/SE/SW) |
| `puzzle.entities.walls` | `ig.ENTITY.WallBase`, `WallHorizontal`, `WallVertical` | Variable walls: tiled barrier lines gated by VarCondition, optional end caps (STOP/CORNER_LEFT/CORNER_RIGHT) |
| `puzzle.entities.push-pull-block` | `ig.ENTITY.PushPullBlock`, `sc.PUSH_PULL_TYPES` | Standard player-interactable block wrapping `sc.PushPullable`; size variants (Large/BergenLeftRight/BergenUpDown/SmallTest) |
| `puzzle.entities.push-pull-dest` | `ig.ENTITY.PushPullDest` | Destination socket a push-pullable locks into; saves placed state to a map/tmp var, z-move animation, respawn handling |
| `puzzle.entities.sliding-block` | `ig.ENTITY.SlidingBlock` | Heavy block shoved by ball/attack at 400 px/s; blocked hits only show effects |
| `puzzle.entities.dynamic-platform` | `ig.ENTITY.DynamicPlatform`, `sc.DYNAMIC_PLATFORM_TYPES` | Moving/extractable platform iterating configured states (position, speed, pause conditions, animations) |
| `puzzle.entities.extract-platform` | `ig.ENTITY.ExtractPlatform`, `sc.EXTRACT_PLATFORM_TYPE` | Platform raising/lowering in z when a VarCondition flips, animated over `extractTime` (Small/Large) |
| `puzzle.entities.ol-platform` | `ig.ENTITY.OLPlatform` | Moving platform rendered from an object layer: named states (var condition, offset, optional maps, spline) |
| `puzzle.entities.lorry` | `ig.ENTITY.Lorry`, `ig.ENTITY.LorryRail`, `ig.ENTITY.LorryRespawner`, `sc.LORRY_TYPES`/`LORRY_MOVE_TYPES`/`LORRY_RAIL_TYPES`/`LORRY_SPEED` | Rail-riding moving platform with respawner |
| `puzzle.entities.boss-platform` | `ig.ENTITY.BossPlatform`, `sc.BossPlatforms` | Boss-arena platform bouncing/nudging under impact with radius falloff; lockable |

### Destructibles

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.entities.destructible` | `ig.ENTITY.Destructible`, `sc.DESTRUCTIBLE_TYPE` | Breakable objects (boxes, ice blocks, bomb walls, key walls): per-type hit counts/conditions/effects/range-chain kills |
| `puzzle.entities.item-destruct` | `ig.ENTITY.ItemDestruct`, `sc.ITEM_DESTRUCT_TYPE` | Item-dropping destructibles (stones, plants, vases, eggs) |
| `puzzle.entities.regen-destruct` | `ig.ENTITY.RegenDestruct`, `sc.REGEN_DESTRUCT_TYPE` | Destructible that regenerates after a respawn time |
| `puzzle.entities.bomb` | `ig.ENTITY.BombPanel`, `sc.BombEntity` | Panel spawning bombs (3-second fuse after first hit): ticks, flashes last 0.75 s, `CircleHitForce` explosion; HEAT variant |

### Ball & element puzzles

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.entities.water-bubble` | `ig.ENTITY.WaterBubblePanel`, `sc.WaterBubbleEntity` | Ground source spawning bubbles: float up, bounce on hit, freeze to ice disk (COLD), burst to steam (HEAT) |
| `puzzle.entities.water-block` | `ig.ENTITY.WaterBlock` | Water block: freeze to ice (COLD), melt (HEAT), steam (HEAT on bubbling block) with `CircleHitForce`; reforms |
| `puzzle.entities.ice-disk` | `sc.IceDiskEntity` | Sliding ice disk from COLD bubble: 400 px/s, carries damage, melts after 1.5 s (or HEAT), breaks after 5 wall bounces, cools hot coals |
| `puzzle.entities.element-shield` | `ig.ENTITY.ElementShieldSrc`, `sc.ElementShieldBallEntity` | Shield puzzle: same-element hits charge the ball up to 4; full charge spawns… |
| `puzzle.entities.thermo-pole` | `ig.ENTITY.ElementPole`, `ig.ENTITY.ElementPoleDest`, `sc.ElementPoleGroups`, `sc.TERMO_POLE_TYPE` | Element poles charged by element balls to activate destinations; groups share a destination |
| `puzzle.entities.magnet` | `ig.ENTITY.Magnet` | Directional magnet: SHOCK hit pulls entities along its facing for 0.4 s via `onMagnetStart/End` callbacks |
| `puzzle.entities.tesla-coil` | `ig.ENTITY.TeslaCoil`, `sc.TESLA_COIL_TYPE` | Charges from a compressed SHOCK ball, discharges lightning through coils + tesla switches |
| `puzzle.entities.ferro` | `ig.ENTITY.FerroSpot`, `ig.ENTITY.FerroLine`, `sc.FerroEntity`, `sc.FerroWaveAttack`, `ig.ENTITY.FerroRespawner` | Ferro (liquid metal): source spots + beams chain the flowing ferro; respawner |
| `puzzle.entities.compressor` | `ig.ENTITY.Compressor`/`AntiCompressor`/`CompressorBouncer`, `sc.CompressedBaseEntity`/`CompressedShockEntity`/`CompressedWaveEntity` | Squash the player ball into compressed shock/wave entities |
| `puzzle.entities.glowing-line` | `ig.ENTITY.GlowingLine` | Decorative glowing line while its VarCondition is true, fading over 0.25 s |
| `puzzle.entities.wave-teleport` | `ig.ENTITY.WaveTeleport` | Wave-element beacon: a charged wave ball starts a 0.1 s teleport animation, transporting player + party to the beacon |

### Hazards & terrain

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.entities.quick-sand` | `ig.QuickSand` (influencer callback) | Sinks/slows entities on QUICKSAND terrain; after 2 s triggers `onQuickSandFall` (player) or makes the entity sink |
| `puzzle.entities.spiderweb` | `ig.Spiderweb` (influencer callback) | Gradually slows non-enemy combatants standing on SPIDERWEB terrain |
| `puzzle.entities.steam-pipes` | `ig.ENTITY.SteamPipe`, `SteamTurnout`, `SteamOven`, `sc.SteamTools`, `sc.SteamGlowEntity`, `sc.STEAM_PIPE_TYPES` | Steam rail system: straight pipes, switchable turnouts, ovens; flow driven by tools + glow |
| `puzzle.entities.rotate-blocker` | `ig.ENTITY.RotateBlocker` | Triangular slope blocker the player rotates between four directions (NE/SE/SW/NW); VarCondition-gated |

### Steps & entry

| Module | Key classes | Responsibility |
|---|---|---|
| `puzzle.puzzle-steps` | EVENT/ACTION steps | Destroy destructibles, push-pull alignment, wave teleport, bombing, bubble shooting, boss-platform shockwaves, tesla coil / element shield placement… |
| `puzzle.plug-in` | — | Entry point: requires all components/entities/steps; editor registration |

## Behavior

- Everything is map-placed: puzzle entities are `ig.ENTITY.*` classes
  placed in map object layers with `_wm` configs; `VarCondition`s and
  `ig.vars` flags wire them together (a switch flips a var, a wall's
  condition reads it, an extract platform reacts).
- Element balls are the universal key: `ig.ENTITY.Ball` from the combat
  engine ([combat](02-combat.md)) interacts with changers, compressors,
  element poles, tesla coils, magnets, key panels and teleport beacons —
  the ball carries its element, and entities react per element.
- Hazards (quicksand, spiderweb) and some blocks are implemented as
  `ig.InfluencerCallbacks` on terrain types (`assets/data/tile-infos.json`,
  [TERRAIN format](../../data/formats/13-misc.md)).

## Hooks & steps

- EVENT/ACTION steps from `puzzle-steps` (destruction, push-pull
  alignment, wave teleport, bombing, bubble shooting, boss platforms,
  coil/shield placement).
- Chests drop items via `sc.ItemDropEntity.spawnDrops` (combat/inventory
  cross-link); item-destructibles feed the botanics drop log.

## Related

- [combat](02-combat.md) (balls, element modes) · [map-content](16-map-content.md)
- Engine: [impact.base.entity](../../engine/impact/02-entities.md),
  [impact.feature.terrain](../../engine/impact/features/15-terrain.md),
  [impact.base.vars](../../engine/impact/01-core.md)
- Data: [TERRAIN format](../../data/formats/13-misc.md),
  [MAP format](../../data/formats/05-map.md)