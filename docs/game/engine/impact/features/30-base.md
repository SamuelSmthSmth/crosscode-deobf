# impact.feature.base — shared steps & entities

> **Status**: core · Modules: `impact.feature.base.action-steps`,
> `impact.feature.base.event-steps`, `impact.feature.base.entities.marker`,
> `impact.feature.base.entities.object-layer-view`,
> `impact.feature.base.entities.sound-entities`,
> `impact.feature.base.entities.touch-trigger`, `impact.feature.base.plug-in`.

This is the **foundation of all scripting in the game**: the universal
step libraries that every entity AI, cutscene and quest uses. Game-layer
steps (`game.feature.base.*`, `game.feature.action-steps`, …) extend
these with game-specific behaviour.

## The step libraries

| Module | Content | Responsibility |
|---|---|---|
| `action-steps` | `ig.ACTION_STEP.*` — **97 action steps** | Per-actor scripted actions (movement, animation, attributes, control flow) |
| `event-steps` | `ig.EVENT_STEP.*` — **42 event steps** + `ig.ConsoleType` | Cutscene/quest script commands (teleports, vars, waits, mass-avatar control) |

### ACTION_STEP highlights (97 total)

- **Movement**: `MOVE_FORWARD`, `MOVE_BACKWARD`, `MOVE_RANDOM`,
  `MOVE_TO_POINT`, `MOVE_TO_LINE`, `MOVE_TO_ENTITY_DISTANCE`,
  `MOVE_TO_ENTITY_CLOSEST_OFFSET`, `JUMP`, `JUMP_TO_POINT`,
  `FLY_TO_POINT`, `Z_INTERPOLATE`, `SLIDE_OUT`, `STOP_XY`, `STOP_Z_ZENITH`,
  `TELEPORT_TO_ATTRIB_POS`, `SCALE_VEL`.
- **Physics attributes**: `SET_SPEED`, `SET_ACCEL_SPEED`, `SET_FRICTION`,
  `SET_AIR_FRICTION`, `SET_TERRAIN_FRICTION_IGNORE`, `SET_WEIGHT`,
  `SET_BOUNCINESS`, `SET_Z_BOUNCINESS`, `SET_Z_GRAVITY_FACTOR`,
  `SET_Z_VEL`, `SET_MAX_ZVEL`, `SET_JUMPING`, `SET_FLY_HEIGHT`,
  `SET_FLY_KEEP_HEIGHT`, `SET_FLOAT_HEIGHT`, `SET_FLOAT_PARAMS`,
  `SET_GROUND_CONNECTED`, `SET_SLIP_THROUGH`, `SET_COLL_TYPE`,
  `SET_COLL_SHAPE`, `SET_COLL_SIZE`, `SET_SIZE`, `SET_SHADOW`.
- **Facing**: `SET_FACE`, `SET_FACE_FIX`, `SET_FACE_TO_DIR`,
  `SET_FACE_TO_ENTITY`, `SET_FACE_TO_VEL`, `SET_CLOSEST_FACE`,
  `ROTATE_FACE`, `SET_ATTRIB_FACE`.
- **Animation**: `SHOW_ANIMATION`, `SHOW_RANDOM_ANIMATION`,
  `SHOW_PART_ANIMATION`, `SHOW_EXTERN_ANIM`, `CLEAR_ANIMATION`,
  `ADD_ANIM_MOD`, `REMOVE_ANIM_MOD`, `SET_WALK_ANIMS`,
  `SET_TARGET_WALK_ANIMS`, `SYNC_ACTION_WITH_ENTITY`,
  `WAIT_UNTIL_ANIM_LOOP_END`.
- **Variables/attributes**: `SET_ATTRIB_NUMBER(_RANDOM)`, `SET_ATTRIB_BOOL`,
  `SET_ATTRIB_STRING`, `SET_ATTRIB_POS`, `SET_ATTRIB_VEC2`,
  `SET_RANDOM_VAR_NUMBER`, `CHANGE_VAR_NUMBER`, `CHANGE_VAR_BOOL`,
  `CHANGE_VAR_STRING`, `CHANGE_VAR_LANG`.
- **Control flow**: `IF`, `LABEL`, `GOTO_LABEL`, `WAIT`, `WAIT_RANDOM`,
  `WAIT_UNTIL`, `WAIT_UNTIL_ON_GROUND`, `WAIT_UNTIL_Z_DISTANCE`,
  `WAIT_UNTIL_Z_ZENITH`, `WAIT_UNTIL_PLAYER_ON_TOP`, `SELECT_FIRST`,
  `SELECT_RANDOM`, `DO_ATTRIB_ACTION`, `DETACH_TIME_PARENT`.
- **Audio/visibility**: `PLAY_SOUND`, `PLAY_RANDOM_SOUND`, `STOP_SOUNDS`,
  `HIDE`, `HIDE_OTHER`, `RESET_ACTOR`, `SET_STATIC_TIME`.

### EVENT_STEP highlights (42 total)

- **Teleport/movement**: `TELEPORT`, `SET_ENTITY_POS`,
  `SET_ENTITY_POS_TO_ENTITY`, `ADJUST_ENTITY_POS`,
  `SET_ENTITY_STATIC_TIME`, `SET_MOVING_LAYER_STOP`.
- **Variables**: `CHANGE_VAR_NUMBER/BOOL/STRING/LANG/VEC2/VEC3`,
  `SET_RANDOM_VAR_NUMBER`, `ROUND_VAR_NUMBER`, `SET_VAR_TIME`,
  `SET_ATTRIB_STRING/VEC2/VEC3`, `CLEAR_TEMP_STORAGE`.
- **Control flow**: `IF`, `FORK_CONDITION`, `LABEL`, `GOTO_LABEL`,
  `GOTO_LABEL_WHILE`, `WAIT`, `WAIT_RANDOM`, `WAIT_UNTIL_TRUE`,
  `WAIT_UNTIL_ACTION_DONE`, `WAIT_UNTIL_ON_GROUND`, `SELECT_FIRST`,
  `SELECT_RANDOM`, `DO_ACTION`.
- **Scene**: `SHOW_ENTITY`, `HIDE_ENTITY`, `SHOW_ANIMATION`,
  `SHOW_EXTERN_ANIM`, `CLEAR_ANIMATION`, `GROUP_FACE_TO_ENTITY`,
  `MASS_AVATAR_FACE/JUMP/MOVE`, `SET_ENTITY_ON_TOP_OTHER`, `PLAY_SOUND`,
  `STOP_SOUND`, `CONSOLE_LOG` (`ig.ConsoleType`), `STOP_SKIP_MODE`.

## Shared entities

| Module | Classes | Responsibility |
|---|---|---|
| `entities.marker` | `ig.ENTITY.Marker` | Invisible editor/scene marker (spawn points, script anchors) |
| `entities.object-layer-view` | `ig.ENTITY.ObjectLayerView` (+ `staticNavBlock`), `ig.ObjectLayerTools` | Renders editor object layers at runtime |
| `entities.sound-entities` | `ig.ENTITY.SoundSource` | Map entity playing a looping positioned sound (`ig.EntityHideManager` helper) |
| `entities.touch-trigger` | `ig.ENTITY.TouchTrigger`, `ig.TOUCH_TRIGGER_TYPE` | Trigger zone firing on entity touch (typed triggers) |

## Why this matters

- **Every entity script** (`assets/data/characters/*.json`,
  `assets/data/enemies/*.json`) is a list of ACTION_STEPs; **every cutscene
  and quest** (`assets/data/maps/*` event sheets) is a list of EVENT_STEPs.
  These two tables *are* the scripting language of the game — see
  [action/event step reference](../../../data/formats/06-action-steps.md)
  and [event sheets](../../../data/formats/07-event-sheet.md).