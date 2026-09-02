# ACTION_STEP reference — the entity scripting language

> **Status**: core · `ig.ACTION_STEP.<NAME>` classes are the per-actor
> script commands used in enemy `actions`, character scripts and
> event-sheet `DO_ACTION` blocks. **~300 registered steps** across the
> engine + game layers. The authoritative catalogue is the code itself —
> this page documents the execution model, the registration map and
> representative steps per family.

## Registration map (where steps live)

| Module | Steps | Families |
|---|---|---|
| `impact.feature.base.action-steps` ([30-base](../../engine/impact/features/30-base.md)) | 91 | Movement/physics (`MOVE_TO`, `SET_VEL`…), animation (`PLAY_ANIM`, `SET_ANIM`…), vars (`SET_VAR`, `CHANGE_VAR`…), sound, IF/WAIT/JUMP/LABEL control flow, entity ops |
| `game.feature.combat.combat-action-steps` ([combat](../../engine/game/02-combat.md)) | 115 | Targeting/facing (`FACE_TO`, `SET_TARGET`…), hitbox forces (`TACKLE`, `SWEEP`, `STICKY_CIRCLE`, `PUSH`…), proxies (`SHOOT_PROXY`, `SET_PROXY`…), shields, HP/SP, stun, respawn, enemy events/spawning |
| `game.feature.base.action-steps` | 2 | Game-layer generic extensions |
| `game.feature.player.player-steps` ([player](../../engine/game/01-player.md)) | 16 | `CONSUME_ITEM`, `SET_PLAYER_INVINCIBLE`, `SHOOT_PROXY_PLAYER`, `ADD_PLAYER_CAMERA_TARGET`, `SET_PLAYER_ANIM_SHEET`… |
| `game.feature.puzzle.puzzle-steps` ([puzzle](../../engine/game/14-puzzle.md)) | 13 | `THROW_BOMB`, `RAIN_BOMB`, `SHOOT_BUBBLE`, `DO_WAVE_TELEPORT`, `PLACE_TESLA_COIL`… |
| `game.feature.msg.msg-steps` | 2 | `SHOW_DREAM_MSG`, `CLEAR_DREAM_MSG` |
| `game.feature.npc.npc-steps` | 2 | `RESET_NPC`, `APPLY_NPC_CONFIG` |
| `game.feature.party.party-steps` | 2 | `SET_PARTY_TEMP_TARGET`, `SET_TARGET_TO_PARTYMEMBER` |
| `game.feature.arena.arena-steps` | 1 | `ADD_ARENA_IGNORE_TYPE` |

## Execution model

- **Context**: a step executes against an `actor` (the `ig.Entity` running
  the script) with `step.exec(actor, …)`; steps expose
  `doStep(actor)`/`finishStep(actor)` and may stay active over several
  frames (movement/waits) until they report done.
- **Chaining**: steps run in order from the script array; `WAIT`,
  `WAIT_UNTIL_*` and movement steps pause the chain; `IF`/`LABEL`/`JUMP`
  provide branching and loops; `SYNC`/`DETACH` split flows.
- **JSON form**: in script arrays each step is
  `{"type": "<STEP_NAME>", …params }` (see
  [EVENT SHEET format](07-event-sheet.md) for the same shape in events;
  `DO_ACTION` event steps run action scripts).

## Representative steps by family

| Family | Examples | Purpose |
|---|---|---|
| Control flow | `WAIT`, `IF`, `LABEL`, `JUMP`, `SYNC`, `DETACH` | Sequencing, branching, loops |
| Movement | `MOVE_TO`, `SET_VEL`, `SET_ACCEL`, `FLY`, `SLIDE`, `INTERPOLATE`, `SET_ATTRIB_*` | Position/velocity control, interpolation |
| Facing/targeting | `FACE_TO`, `SET_TARGET`, `SET_ATTRIB_CLOSE_TARGET_POS`, `SET_ATTRIB_TARGET_DELTA_POS` | Turn and lock targets (combat AI) |
| Animation | `PLAY_ANIM`, `SET_ANIM`, `SHOW`/`HIDE`, `SCALE`, `ROTATE` | Sprite/animation control |
| Vars | `SET_VAR`, `CHANGE_VAR_BOOL`, `ADD_VAR_NUMBER`… | Write `ig.vars` |
| Sound | `PLAY_SOUND`/`SHOW`-family | Audio cues |
| Combat forces | `TACKLE`, `SWEEP`, `STICKY_CIRCLE`, `CIRCLE_HIT_FORCE`, `PUSH`/`PULL`, `SHOW_THROW` | Spawn live hitboxes on the combatant |
| Proxies | `SHOOT_PROXY`, `SHOOT_PROXY_PLAYER`, `SET_PROXY`, `SHARE_PROXY`, `SPAWN_ASSAULT` | Spawn balls/projectiles |
| HP/SP/status | `SET_DAMAGE`, `ABSORB_DAMAGE`, `SET_HIT_*`, `SET_SP`…, `COMBAT_STUN` family | Damage, SP, stun |
| Enemy events | `SPAWN_ENEMY`, `SPAWN_ENEMIES`, `UNLOCK_ENEMY`, `CONNECT_HP`, `SET_COLLAB`, `SET_ENEMY_ELEMENT_MODE` | Enemy lifecycle/AI scripting |
| Player/puzzle | `CONSUME_ITEM`, `THROW_BOMB`, `SHOOT_BUBBLE`, `DO_WAVE_TELEPORT` | Game-layer scripted actions |

## Related

- Runtime: [impact.base events](../../engine/impact/07-events.md)
- Engine registry: [features/30-base](../../engine/impact/features/30-base.md)
- Event-sheet steps: [EVENT SHEET format](07-event-sheet.md)