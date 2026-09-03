# impact.base — Events, steps & actions (the scripting runtime)

> **Status**: core · Source: `deobf/clean/impact.base.steps.js`,
> `impact.base.event.js`, `impact.base.action.js`. Step registries continue
> in `impact.feature.base.event-steps.js` / `action-steps.js`
> ([features/30-base.md](features/30-base.md)) and the game layer
> (`game.feature.base.*`, combat, player, puzzle, arena…).

## The idea

Almost every "scripted" thing in CrossCode — cutscenes, NPC dialogs, puzzle
mechanics, enemy attack patterns, arena rounds — is **data**: a list of step
objects `{ "type": "STEP_NAME", …params }` executed by the step runtime.
Events run on map trigger entities; actions also run on combatants and props.

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.steps` | `ig.StepBase`, `ig.StepHelpers` | Step base class: `start/update/end`, helpers (wait, snap) |
| `impact.base.action` | `ig.Action`, `ig.ActionStepBase` (= `ig.StepBase`), `ig.ACTION_STEP` (registry) | Action = a list of ACTION_STEP instances; helpers `getVarName/getVec2/getVec3/getFace` resolve values with entity context |
| `impact.base.event` | `ig.Event`, `ig.EventCall` (running instance), `ig.EventManager`, `ig.EventRunType`, `ig.EventStepBase`, `ig.EVENT_STEP` (registry), `ig.ENTITY_FETCH_MAP` | Event defs → running calls; step execution, waiting/blocking, entity fetch syntax |

## At a glance

| Task | Shape / API | Important constraint |
|---|---|---|
| Add an event command | Register an `ig.EVENT_STEP` class | Match the data `type` exactly and expose editor metadata |
| Add an actor command | Register an `ig.ACTION_STEP` class | Action context is an actor, not an event call |
| Block until work finishes | `wait: true`, `waitSkip` | The step must report completion; do not busy-loop in draw |
| Read a variable | `ig.VarPathResolver` / step helper | Preserve indirect and `call.*` reference semantics |
| Call a script | Event manager / event-sheet step | Keep event ownership and cancellation explicit |

```ts
type StepData = { type: string; wait?: boolean; waitSkip?: number } &
  Record<string, unknown>;
class EventStep { exec(call: ig.EventCall, data: StepData): void; }
class ActionStep { exec(actor: ig.Entity, data: StepData): void; }
```

## Guardrails

- Never invent a new step name without registering its class in the correct
  registry; unregistered data fails later and is difficult to diagnose.
- Never treat event-call references (`call.*`) or indirect variable objects as
  literal strings.
- Never put per-frame simulation work in a step’s draw path; use step update/
  completion state and let the runtime own sequencing.
- Keep `wait` semantics explicit: a blocking step must eventually finish or
  intentionally cancel when its owner event ends.

## Step object anatomy

```json
{ "type": "WAIT", "time": 0.4, "ignoreSlowDown": false }
{ "type": "CHANGE_VAR_BOOL", "varName": {"indirect": "call.variable"}, "changeType": "set", "value": true }
{ "type": "SET_CAMERA_POS", "pos": {"varName": "call.targetPoint"}, "speed": "FAST", "transition": "EASE_IN_OUT", "wait": true, "waitSkip": 0 }
```

- `type` resolves via the `ig.EVENT_STEP` / `ig.ACTION_STEP` registries.
- Common flags: `wait` (block until done), `waitSkip` (skippable slack),
  `time`, `ignoreSlowDown`.
- Value references: `{"varName": "tmp.roof1"}` (variable pointer),
  `"call.x"` (event-call args), `{"indirect": …}` (double indirection),
  `{x:…,y:…}` vec objects, `"entity:Name"` / name lookups via
  `ig.Event.getEntity` + `ig.ENTITY_FETCH_MAP`.

## Event workflow

1. An entity with a `dataEvent`/`EventTrigger` (sc.Cutscene,
   `game.feature.msg.entities.event-trigger`) fires `ig.EventManager.start`.
2. `ig.EventCall` executes steps sequentially; blocking steps (`wait`)
   pause the call (events queue, cutscenes block the world).
3. `ig.EventRunType` controls parallel vs serial runs of the same def.
4. Steps can also be **actions** on combatants (`ig.Action`): enemy AI
   choices ship full action lists in ENEMY JSON ([format](../../data/formats/01-enemy.md)).

## Where the registries live

| Registry scope | Modules | Examples |
|---|---|---|
| Engine base | this page | (minimal — the big tables are the two files below) |
| Engine features | `impact.feature.base.event-steps.js` (**42 EVENT_STEP**), `impact.feature.base.action-steps.js` (**97 ACTION_STEP**) | movement, physics, anim, vars, sound, entity ops, camera/light/weather steps |
| Game layer | `game.feature.base.*`, `game.feature.combat.combat-action-steps.js` (**114 ACTION_STEP**), combat-event-steps, player-steps, puzzle-steps, msg-steps, quest-steps, arena-steps… | combat targeting/hitboxes, HP/SP, stun, respawn, dialogs, quests |

The `_wm` schema info (`_type`/`_info`) on every step comes from the same
class definitions — it's how the in-game editor renders step params.