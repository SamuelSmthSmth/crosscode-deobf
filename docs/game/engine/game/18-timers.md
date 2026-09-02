# game.feature.timers — in-game timers

> **Status**: core · 4 modules in `deobf/clean/game.feature.timers.*`.
> Covers `sc.TimersModel` (named timers), its event steps and the HUD
> display. Used by quests (timed tasks), story events and speedrun-style
> counters.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `timers.timers-model` | `sc.TimersModel`, `sc.TIMER_TYPES` (COUNTER/COUNTDOWN) | Timer system: named timers counting up or down while the game runs, optional area restriction, temporary lifecycles, quest-task reset on expiry, save/load, `timers` var accessor |
| `timers.timers-steps` | EVENT_STEP: `ADD_TIMER`, `REMOVE_TIMER`, `RESET_TIMER`, `PAUSE_TIMER`, `RESUME_TIMER` | Add/remove/reset/pause/resume named timers through the model |
| `timers.gui.timers-hud` | `sc.TimersHud` | Right-side HUD box with the timer label + time readout (hours:minutes:seconds, optional ms), live updates, hides/shows with game state |
| `timers.plug-in` | — | Entry point + editor registration; timers steps colored cyan |

## Behavior

- **`sc.TimersModel`** keeps named timers in a map. Each timer counts up
  (COUNTER) or down (COUNTDOWN) while the game is running, can be
  restricted to an area, and can have a temporary lifecycle (removed when
  done). A countdown reaching zero can reset a linked quest task.
- Timers persist through `ig.storage` and expose a `timers.*` var
  accessor so event sheets can read elapsed/remaining time (e.g.
  `timers.timerName` in `ig.vars`).
- **`sc.TimersHud`** renders active timers in the right-side HUD stack
  (see `gui.hud.right-hud`, [gui](06-gui.md)).

## Hooks & steps

- EVENT_STEP registrations in `timers-steps` (`ADD_TIMER`, `REMOVE_TIMER`,
  `RESET_TIMER`, `PAUSE_TIMER`, `RESUME_TIMER`).
- Quest integration: `quest-model` links countdown expiry to quest-task
  resets ([quest](08-quest.md)).

## Related

- [quest](08-quest.md) · [gui](06-gui.md)
- Engine: [impact.base.timer](../../engine/impact/01-core.md) (frame tick)