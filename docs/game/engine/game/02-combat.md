# game.feature.combat — the combat engine

> **Status**: core · 45 modules in `deobf/clean/game.feature.combat.*` — the
> largest game-layer group. Covers `sc.Combat` (the central manager),
> combatants/enemies/balls, combat math (`sc.CombatParams`), forces
> (live hitboxes), shields, charge/assault/sweep arts, stat changes,
> drops, PvP and the big step libraries. Consumes `assets/data/enemies/*`
> ([ENEMY](../../data/formats/01-enemy.md)) and `assets/data/effects/*`
> ([EFFECT](../../data/formats/03-effect.md)).

## Modules & classes

### Core combat & models

| Module | Key classes | Responsibility |
|---|---|---|
| `combat.combat` | `sc.Combat` (GameAddon) | Central combat manager: combatant roster, forces, attack-frequency throttle, targeting, enemy data lookups, kill/reward bookkeeping, dramatic-effect choreography, hit/guard/mode effects + sounds, respawn blocking |
| `combat.model.combat-params` | `sc.ELEMENT`, `sc.CombatParams` | Combat math heart: element counter table (heat↔cold, shock↔wave), HP/SP/attack/defense/focus, buffs, status states, the central `getDamage()` formula |
| `combat.model.ball-behavior` | `sc.BallBehavior`, `sc.BALL_BEHAVIOR.*`, `sc.BallTools` | Ball steering: FOLLOW_TARGET, CLOSE_SELF_DESTRUCT, WIRL_SIDEWAYS, SLOW_DOWN; `adjustDirection` steers balls to targets |
| `combat.model.combat-condition` | — | Combat condition checks used by steps/enemies |
| `combat.model.enemy-type` | — | Enemy type definitions (data tables) |
| `combat.model.enemy-reaction` | — | Enemy hit-reaction configs |
| `combat.model.enemy-annotation` | — | Enemy display annotations |
| `combat.model.enemy-booster` | — | Enemy boosting (NG+/difficulty scaling hooks) |
| `combat.model.enemy-collab` | — | Enemy collaboration behaviors |
| `combat.model.enemy-level-scaling` | — | Enemy level scaling with player level |
| `combat.model.enemy-tracker` | — | Enemy spawn/defeat tracking (hunting log, respawns) |
| `combat.model.combat-status` | `sc.CombatStatus` | Status-state machine shared by combatants |
| `combat.model.proxy` | `sc.PROXY_TYPE` | Combat proxy spawner model (balls, effects, drops) |
| `combat.combat-target-event` | — | Target-event wiring (target switching on defeat) |
| `combat.combat-poi` | `sc.COMBAT_POI`, `sc.CombatPoI` | \"Point of interest\" filters (NAMED_ENTITY, NAMED_ENTITIES, ACTIVE_ENEMIES) resolving AI targeting targets |
| `combat.stat-change` | `sc.StatChange`, `sc.ItemBuff`, `sc.ActionBuff`, `sc.STAT_CHANGE_SETTINGS` | Buffs: multiply stats/add modifiers; timed item buffs vs. active action buffs; buff-id → settings table |
| `combat.pvp` | `sc.PvpModel` | PvP addon: round scoring, KO handling, round banners, post-round HP/SP regen; `pvp.*` var accessor |

### Combat arts & mechanics

| Module | Key classes | Responsibility |
|---|---|---|
| `combat.combat-charge` | `sc.CombatCharge` | Ambient charge-up effect: darkness dimming, per-level charge sound, charge visual, optional slow-motion + camera zoom |
| `combat.combat-assault` | `sc.ASSAULT_PROJECTILES`, `sc.AssaultTools` | \"Assault\" charged-shot art: fan-out spread of element balls, damage split from ASSAULT modifier |
| `combat.combat-sweep` | `sc.COMBAT_SWEEPS.*`, `sc.CombatSweep` | Melee sweep arts (spheromancer, triblader, quadroguard + finishers): circular hit force + visual |
| `combat.combat-shield` | `sc.CombatShield`, `sc.CombatantShieldConnection`, `sc.COMBAT_SHIELDS.*`, `sc.SHIELD_STRENGTH` | Shields/guards: DIRECTIONAL, PARTS, PLAYER variants attached to combatants |
| `combat.combat-stun` | `sc.CombatStun`, `sc.COMBAT_STUN.*` | Stun hit-reactions: start/end lock, block xy/fall, pull, z-pull, force position, z velocity/bounce, set face |
| `combat.combat-force` | `sc.CircleHitForce`, `sc.DirectHitForce`, + more | Live ticking hitboxes spawned on a combatant: radial/sweeping arc, guaranteed N-tick direct hits, push/pull |
| `combat.combat-assault` *(see above)* | — | — |

### Entities

| Module | Key classes | Responsibility |
|---|---|---|
| `combat.entities.combatant` | `sc.BasicCombatant`, `ig.ENTITY.Combatant`, `sc.CombatantAnimPartEntity` | Base combatant: tackle/contact damage, targeting; HP/SP params, shields, spike damage, stun, knockback/fly, quick-respawn, defeat/death; animated body-part sub-entities |
| `combat.entities.enemy` | `ig.ENTITY.Enemy`, `ig.ACTOR_CONFIGS.ENEMY` | Enemy AI glue: state-machine hooks, reactions, HP-breaks, dodge/counter timers, target detection, element modes, HP-attached minions, defeat rewards |
| `combat.entities.ball` | `sc.BallInfo`, `ig.ENTITY.Ball` | Thrown ball projectile: steering behaviors, time bonuses, grab/fling, wall/air kill effects, bounce proxies |
| `combat.entities.projectile` | `ig.ENTITY.Projectile`, `ig.PROJECTILE_KILL_TYPE` | Base projectile: bouncing, tied to a combatant's hit proxy, hit/bounce callbacks, kill type (wall/air/other) |
| `combat.entities.combatant-marble` | — | Marble-mode combatant entity (arena ball-switching) |
| `combat.entities.combat-proxy` | — | Entity wrapper for combat proxies |
| `combat.entities.drop` | `sc.DropEntity` | HP/SP/coin/item drops: pop out, fall, home toward player; `spawnDrops` splits values, `spawnGenericDrops` randomizes counts |
| `combat.entities.item-drop` | `sc.ItemDropEntity` | Item drops (chests, destructibles use this too) |
| `combat.entities.enemy-spawner` | — | Enemy spawner entities |
| `combat.entities.respawn-blocker` | — | Blocks enemy respawns (arenas, boss fights) |
| `combat.entities.burst-spawner` | — | Effect burst spawner |
| `combat.entities.food-icon` | — | Floating food icons (sandwich heal) |
| `combat.entities.hit-number` | — | Floating damage numbers |
| `combat.entities.stone` | — | Stone/marble entity |

### GUI & steps

| Module | Key classes | Responsibility |
|---|---|---|
| `combat.gui.enemy-display-gui` | — | Enemy name/HP display above enemies |
| `combat.gui.status-bar` | — | Enemy status-bar GUI |
| `combat.gui.hp-bar-boss` | — | Boss HP bar |
| `combat.gui.pvp-gui` | — | PvP HUD |
| `combat.combat-action-steps` | 114 `ig.ACTION_STEP.*` classes | Targeting/facing, movement, hitbox forces (tackle, sweep, push/pull, direct hits), proxy spawn/modify, shields, HP/SP, stun, respawn, enemy events/spawning |
| `combat.combat-event-steps` | `ig.EVENT_STEP.*` classes | Spawn/kill/swap enemies, set targets/states, HP/SP manipulation, PvP control, respawn points, `COMBAT_IF` branching, proxy removal; extends `ig.FX_FIRST/SECOND_TARGET_OPTION` |
| `combat.enemy-steps` | ACTION_STEP: `CHANGE_ENEMY_ANNOTATION`, `DO_ENEMY_ACTION`, `DO_ENEMY_ACTION_INLINE`, `SET_AGGRESSION`, `SET_ENEMY_ELEMENT_MODE` | Enemy-script action steps |
| `combat.plug-in` | — | Entry point + editor registration |

## Behavior

- **`sc.Combat` owns the fight**: it keeps the active combatant roster,
  applies the per-second attack-frequency throttle, resolves target
  selection (through `sc.CombatPoI` filters), and performs kill/reward
  bookkeeping (EXP, credits, drops, hunting logs). Dramatic-effect
  choreography (slow-motion, hit-stop, camera) is coordinated here too.
- **`sc.CombatParams` is the math core**: the element counter table
  (heat↔cold, shock↔wave), stat buffs/status states, and the central
  `getDamage()` formula that every hit goes through. `sc.StatChange`
  buffs plug into it (`sc.ItemBuff` for timed item buffs, `sc.ActionBuff`
  for active action buffs).
- **Forces are the actual hitboxes**: `sc.CombatForce` subclasses
  (`sc.CircleHitForce` radial/sweeping arcs, `sc.DirectHitForce` guaranteed
  N-tick hits, push/pull forces) tick each frame on their owning combatant
  and apply collision + damage. Combat arts are data (`sc.COMBAT_SWEEPS.*`,
  `sc.ASSAULT_PROJECTILES`) plus spawn logic (`sc.CombatSweep.show`,
  `sc.AssaultTools.spawn`).
- **Enemies are AI-driven combatants**: `ig.ENTITY.Enemy` extends
  `ig.ENTITY.Combatant` with state-machine hooks, reactions, HP-breaks,
  dodge/counter timers, target detection, element modes and defeat
  rewards. The enemy JSON ([ENEMY format](../../data/formats/01-enemy.md))
  drives stats, AI states and actions; action scripts run
  `ig.ACTION_STEP.*` classes from `combat-action-steps` + `enemy-steps`.

## Hooks & steps

- **114 combat ACTION_STEP classes** + enemy-steps: targeting, movement,
  forces, proxies, shields, HP/SP, stun, respawn, enemy events.
- **Combat EVENT_STEP classes**: spawn/kill/swap enemies, PvP, `COMBAT_IF`
  branching, respawn points — used from event sheets/cutscenes.
- **Data consumption**: enemy JSONs (`assets/data/enemies/*`), effects
  (`assets/data/effects/*` via `impact.feature.effect`), item drops
  (`assets/data/item-database.json`), arena cups ([arena](12-arena.md)).
- **Save integration**: combat state (respawns, hunting logs, PvP record)
  persists through `ig.storage` and `ig.vars`.

## Related

- [player](01-player.md) · [party](04-party.md) · [arena](12-arena.md) ·
  [puzzle](14-puzzle.md) (ball/element puzzles reuse combat entities)
- Engine: [impact.feature.effect](../../engine/impact/features/02-effect.md),
  [impact.base.action](../../engine/impact/07-events.md)
- Data: [ENEMY format](../../data/formats/01-enemy.md),
  [EFFECT format](../../data/formats/03-effect.md),
  [ITEM DATABASE format](../../data/formats/10-item-database.md)