# game.feature.model — the models (save-game state)

> **Status**: core · 5 modules in `deobf/clean/game.feature.model.*`.
> Covers `sc.Model` (observer helper), `sc.GameModel` (game state),
> `sc.OptionModel` (options) and the model event steps. The models are the
> save-backed state every other system reads and writes.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `model.base-model` | `sc.Model` | Observer-pattern helper shared by every game model (`sc.model`, `sc.options`, `sc.menu`, …): models keep an `observers` array; observers implement `modelChanged(model, message, data)` |
| `model.game-model` | `sc.GameModel` (`sc.model`), `sc.COMBAT_RANK`, `sc.GAME_MOBILITY_BLOCK` | Central game-state model: title/game/cutscene states + substates (running, teleport, menu, pause…), combat mode + rank tracking, task/perma-task display, mobility blocks (teleport/save/checkpoint/map-leave), cutscene skipping, demo high-score timer |
| `model.options-model` | `sc.OptionModel` (`sc.options`), `sc.OPTIONS_DEFINITION`, `sc.KeyBinder` | Every game option: definition table, enum constants, key bindings, storage persistence, system-settings side effects (fullscreen, volume, display size, language…) |
| `model.model-steps` | EVENT steps | Task + perma-task display, mobility blocks, cancel button, combat rank/force-combat, player core/SP/EXP/level, demo high-score timer |
| `model.plug-in` | — | Entry point + editor color rules for TASK/CORE steps |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Observe a model | `modelChanged(model, message, data)` | Handle only the messages the observer owns |
| Change game mode | `sc.GameModel` | Respect mobility blocks and current state transitions |
| Add an option | `OPTIONS_DEFINITION` / `sc.OptionModel` | Define type, default, category, and persistence together |
| Persist model state | storage hooks | Serialize stable data, not live GUI/entity references |

```ts
model.addObserver?(observer: ModelObserver): void;
model.removeObserver?(observer: ModelObserver): void;
observer.modelChanged?(model: sc.Model, message: string, data?: unknown): void;
```

## Guardrails

- Do not treat an observer notification as permission to mutate the same model
  recursively without a clear convergence rule.
- Do not store GUI objects, entity references, or transient timers in save data.
- Do not bypass mobility/state transitions by writing mode flags directly.
- Give every option a unique key and test its default, UI, immediate side
  effect, and save/load round trip.

## Behavior

- **`sc.Model`** is the notification backbone: player model, game model,
  options, menu model, party, quests, etc. all extend it; UIs subscribe as
  observers and get `modelChanged` callbacks with a message code and data
  (e.g. `sc.PLAYER_MSG.*`, `sc.PARTY_MSG.*`).
- **`sc.GameModel`** is the top-level state machine: which mode the game
  is in (title/game/cutscene + substates) and what the player may do right
  now (mobility blocks). Combat rank and forced combat, current task
  display, cutscene skipping and the demo timer all live here.
- **`sc.OptionModel`** holds settings; the `OPTIONS_DEFINITION` table
  drives the options menu ([menu](05-menu.md), `menu.gui.options.*`).
  Key bindings use `sc.KeyBinder`; changing options has immediate
  system-settings side effects and persists via `ig.storage`.
- All models register with `ig.storage` for save/load
  ([11-storage](../../engine/impact/features/11-storage.md)).

## Hooks & steps

- EVENT steps from `model-steps`: `SET_TASK`, `SET_PERMA_TASK`,
  `SET_MOBILITY_BLOCK`, `SET_COMBAT_RANK`, `SET_FORCE_COMBAT`,
  `ADD_PLAYER_EXP`, demo high-score timer… — used by cutscenes/events to
  drive the game model.

## Related

- [player](01-player.md) (`sc.PlayerModel` builds on `sc.Model`) ·
  [menu](05-menu.md) (`sc.MenuModel`) · [quest](08-quest.md)
- Engine: [impact.feature.storage](../../engine/impact/features/11-storage.md),
  [impact.base.vars](../../engine/impact/01-core.md)