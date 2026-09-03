# EVENT SHEET format (inline in maps + `assets/data/events/`)

> **Status**: core · Event sheets are cutscene/quest scripts: named lists
> of `ig.EVENT_STEP.*` commands (TELEPORT, WAIT, IF, CHANGE_VAR_*,
> DO_ACTION, SHOW_MSG…) executed by `ig.EventSheet`
> ([04-event-sheet](../../engine/impact/features/04-event-sheet.md)).
> In this build there is **no `eventSheets[]` top-level key in maps** —
> event scripts are embedded in entity `settings` (EventTrigger, NPC,
> Cutscene…) plus shared snippets in `assets/data/events/`.

## At a glance

| Need | Shape | Runtime owner |
|---|---|---|
| Trigger a cutscene | `EventTrigger.settings.event` | `ig.EventManager` / `ig.EventCall` |
| Define a reusable snippet | `events.<name> = { input, steps }` | `ig.EventSheet` / caller context |
| Gate execution | `condition` / `endCondition` | `ig.VarCondition` and `ig.vars` |
| Call actor behavior | `DO_ACTION` | `ig.Action` / `ig.ACTION_STEP` |

```ts
type EventStepData = { type: string; wait?: boolean; waitSkip?: number } &
  Record<string, unknown>;
type EventDefinition = {
  name?: string;
  input?: Record<string, unknown>;
  steps: EventStepData[];
};
```

## Guardrails

- Do not create a map-level `eventSheets[]` field; inspect the entity settings
  shape used by the target map and entity class.
- Do not treat localized message objects, `call.*`, or `{varName: ...}` as
  ordinary strings; they are runtime value references.
- Do not use an unregistered `type`; check the engine/game step module before
  shipping the JSON.
- Make parallel triggers terminate through an explicit `endCondition` or
  lifecycle event; an accidental infinite sheet is a gameplay bug.

## Where event scripts live

1. **Map entities** — `EventTrigger` entities carry an inline `event`
   list; NPCs and other scriptable entities carry `script` lists. Both
   are step arrays with the same shape.
2. **`assets/data/events/puzzle.json`** — shared, callable snippets
   (`DOCTYPE: "EVENTS"`, keyed `events.<name>` with `input` + `steps`).
3. **Character files** may reference event flows; quest steps run from
   map scripts ([quest](../../engine/game/08-quest.md)).

## Step array shape

```json
{
  "type": "SHOW_SIDE_MSG",
  "message": { "en_US": "Let's go!", "de_DE": "Los geht's!", "langUid": 18 },
  "person": { "person": "rookie-harbor.man-small-black", "expression": "DEFAULT" }
},
{ "name": "loop", "type": "LABEL" },
{ "entity": { "player": true }, "stat": "BOTTOM_POS", "type": "SET_VAR_ENTITY_STAT", "varName": "tmp.playerPos" },
{ "withElse": true, "type": "IF", "condition": "tmp.playerPos.z <= 0",
  "thenStep": [ … ], "elseStep": [ … ] }
```

(from `maps/rookie-harbor/teleporter.json`, an `EventTrigger` `event`)

Every step: `type` = `ig.EVENT_STEP.*` class name, plus its parameters
(exact schema per class — see `impact.feature.base.event-steps` +
`game.feature.*-steps` in `deobf/clean/`). Common fields: `wait`/`waitSkip`
(whether the sheet waits for the step to finish), `condition`
(`ig.VarCondition` string) on conditional steps, `withElse` + `thenStep`/
`elseStep` on `IF`.

## Trigger types (`EventTrigger` settings)

| Field | Meaning |
|---|---|
| `name` | Sheet/trigger name |
| `eventType` | `PARALLEL` (runs every frame), `ONCE`, `ON_ENTER`… |
| `endCondition` | `ig.VarCondition` that stops the parallel sheet |
| `event` | The step list |
| `condition` | Var condition gating the trigger |

## Step families (game-layer additions, count per module)

| Module | EVENT_STEP count | Examples |
|---|---|---|
| `impact.feature.base.event-steps` ([30-base](../../engine/impact/features/30-base.md)) | 46 | Entity ops, mass avatar, vars, sound, GUI, camera |
| `game.feature.base.event-steps` | 13 | Game-layer generic steps |
| `game.feature.msg.msg-steps` | 24 | `SHOW_MSG`, `SHOW_CHOICE`, `SHOW_BOARD_MSG`, `SHOW_SIDE_MSG`, `SHOW_PRIVATE_MSG`… |
| `game.feature.model.model-steps` | 18 | `SET_TASK`, `SET_PERMA_TASK`, `SET_MOBILITY_BLOCK`, `SET_FORCE_COMBAT`, `ADD_PLAYER_EXP`… |
| `game.feature.combat.combat-event-steps` | ~17 | `SPAWN_ENEMY`, `KILL_ENEMY`, `COMBAT_IF`, PvP control… |
| `game.feature.arena.arena-steps` | 17 | `START_ROUND`, `END_ROUND`, `SPAWN_WAVE`, `ADD_SCORE`, `RESET_CHAIN`… |
| `game.feature.party.party-steps` | 14 | `SET_CONTACT_ONLINE`, add/remove/revive member… |
| `game.feature.player.player-steps` | 13 | Skill learn, element switch, camera focus… |
| `game.feature.quest.quest-steps` | 8 | `CREATE_QUEST`, `START_QUEST`, `SOLVE_QUEST_CONDITION`, `FINISH_QUEST`… |
| `game.feature.npc.npc-steps` | 5 | `DO_THE_SHAKE`, `RESET_NPC`, `SET_NPC_RUNNERS`… |
| `game.feature.timers.timers-steps` | 5 | `ADD_TIMER`, `REMOVE_TIMER`, `RESET_TIMER`, `PAUSE_TIMER`, `RESUME_TIMER` |
| `game.feature.achievements.stat-steps` | 5 | `ENABLE/DISABLE_STATS`, `UNLOCK_TROPHY`, `ADD/SET_STAT_MAP_NUMBER` |
| `game.feature.map-content.map-content-steps` | 4 | `OPEN_RHOMBUS_MAP`, elevator move, prop untrigger… |
| `game.feature.trade.trade-steps` | 2 | `RESET_TRADER`, `OPEN_NPC_TRADE` |

## Related

- Steps reference: [ACTION_STEP reference](06-action-steps.md)
- Engine: [impact.feature.event-sheet](../../engine/impact/features/04-event-sheet.md),
  [impact.base.event](../../engine/impact/07-events.md)