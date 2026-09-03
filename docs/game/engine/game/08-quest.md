# game.feature.quest — quests

> **Status**: core · 4 modules in `deobf/clean/game.feature.quest.*`.
> Covers `sc.QuestModel` (tracking/rewards), `sc.Quest`/task data
> structures and the quest step library. Quest definitions live in map
> event sheets + character JSONs, not in a dedicated data folder.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `quest.quest-types` | `sc.Quest`, `sc.QuestTask`, `sc.QuestSubTaskBase` + subtypes (COLLECT, KILL, CONDITION, QUEST, LANDMARK) | Quest/task data structures: name, level, description, tasks, rewards, area, hub settings; subtask containers |
| `quest.quest-model` | `sc.QuestModel` (GameAddon), `sc.QUEST_LIST_TYPE`, `sc.QUEST_SORT_TYPE` | Tracking/management: loads static quests from the database, active/finished quests, task progress, rewards (exp/money/CP/items), sorting/filtering, marked/favorite quests, combat listener for kill objectives, save/load |
| `quest.quest-steps` | EVENT_STEP: `CREATE_QUEST`, `START_QUEST`, `SOLVE_QUEST_CONDITION`, `UPDATE_QUEST_LOCATION`, `RESET_QUEST_TASK`, `FINISH_QUEST`, quest-dialog open… | Event steps for quest flow from event sheets/cutscenes: create, start, solve conditions, update locations, reset tasks, accept/decline dialogs, finish, inline reward resolution |
| `quest.plug-in` | — | Entry point + quest/quest-hub editor panels, `QUEST` step color rule |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Create/start a quest | `CREATE_QUEST` / `START_QUEST` | Quest id and task schema must match downstream references |
| Advance progress | combat/inventory/model listeners | Let the quest model observe source events |
| Finish a quest | `FINISH_QUEST` | Rewards and completion state are applied together |
| Display a task | `sc.QuestModel` + HUD/menu observers | Subscribe to model changes |
| Persist quest state | storage registration | Keep active/finished/task state serializable |

```ts
sc.QuestModel.startQuest?(questId: string): void;
sc.QuestModel.finishQuest?(questId: string): void;
sc.QuestModel.modelChanged?(model: sc.Model, message: string, data?: unknown): void;
```

## Guardrails

- Do not invent a standalone quest JSON folder for this build; quests are
  created by event steps and database/map/character data.
- Do not mark tasks complete by editing the HUD or `ig.vars` alone; update the
  quest model so rewards, listeners, and saves remain consistent.
- Keep task ordering and reward ids stable once a quest can exist in a save.
- Test accept/decline, reset/expiry, reward delivery, and reload from save.

## Behavior

- **`sc.Quest`** is the data object: a quest has a name, level, description,
  ordered tasks (each a `sc.QuestTask` holding `sc.QuestSubTaskBase`
  subtasks — collect items, kill enemies, satisfy conditions, run sub-quests,
  discover landmarks) and rewards (EXP, credits, CP, items).
- **`sc.QuestModel`** tracks available/active/finished quests. It listens to
  combat events (enemy kills) and inventory changes to advance subtasks,
  handles quest rewards on completion, sorts/filters the quest list
  (`sc.QUEST_LIST_TYPE`: ACTIVE/SOLVED/ALL; `sc.QUEST_SORT_TYPE`:
  ACCEPTED/ORDER/NAME/LEVEL) and persists through `ig.storage`.
- **Quests are data in event sheets**: there is no `assets/data/quests/`
  folder — quests are created at runtime by `CREATE_QUEST`/`START_QUEST`
  steps in map event sheets and character JSON scripts
  ([EVENT SHEET format](../../data/formats/07-event-sheet.md),
  [CHARACTER format](../../data/formats/04-character.md)).

## Hooks & steps

- EVENT_STEP registrations in `quest-steps` (create/start/solve/update/
  reset/finish quest, quest dialog with accept/decline branches).
- HUD/menu consumers: quest list + details menus (`menu.gui.quests.*`, see
  [menu](05-menu.md)), quest task HUDs ([gui](06-gui.md)),
  quest-hub menus, and the quest display on the start screen.
- Expiry integration: timers can reset quest tasks
  ([timers](18-timers.md)).

## Related

- [msg](07-msg.md) · [menu](05-menu.md) · [timers](18-timers.md)
- Engine: [impact.feature.event-sheet](../../engine/impact/features/04-event-sheet.md),
  [impact.base.vars](../../engine/impact/01-core.md) (condition labels)
- Data: [EVENT SHEET format](../../data/formats/07-event-sheet.md),
  [CHARACTER format](../../data/formats/04-character.md)