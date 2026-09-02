# game.* — the game layer

> **Status**: stub (pending). 415 modules in `deobf/clean/game.*` — the
> entire CrossCode game built on the ImpactJS core. Groups below are the
> largest/most central; ~20 smaller features (ar, auto-control, beta,
> common-event, control, credits, font, game-code, game-sense, new-game,
> save-preset, tutorial, version, voice-acting, xeno-dialogs…) are folded
> into the nearest group until they get pages of their own.

## Group index

| # | Group | Modules | One-liner | Page |
|---|---|---|---|---|
| 1 | `player` | 14 | The player entity: movement, combat input, skins, pets, leveling | [01-player.md](01-player.md) |
| 2 | `combat` | 45 | The combat engine: enemies, combatants, balls, shields, drops, steps | [02-combat.md](02-combat.md) |
| 3 | `npc` | 8 | NPC entities, runners, waypoints, display GUI | [03-npc.md](03-npc.md) |
| 4 | `party` | 5 | Party members, models, steps | [04-party.md](04-party.md) |
| 5 | `menu` | 105 | All 22 menu sections (equipment, circuit, quest, shop, bestiary…) | [05-menu.md](05-menu.md) |
| 6 | `gui` | 55 | HUD widgets + GUI base components (boxes, buttons, text) | [06-gui.md](06-gui.md) |
| 7 | `msg` | 10 | Message boxes, dialogue, message board, skip HUD | [07-msg.md](07-msg.md) |
| 8 | `quest` | 4 | Quest model, types, steps | [08-quest.md](08-quest.md) |
| 9 | `skills` | 3 | Skill tree: skills, skilltree UI | [09-skills.md](09-skills.md) |
| 10 | `inventory` | 4 | Inventory model, detectors, item scaling | [10-inventory.md](10-inventory.md) |
| 11 | `trade` | 7 | Trade: model, menu, dialog, steps | [11-trade.md](11-trade.md) |
| 12 | `arena` | 15 | Arena challenges: rounds, rushes, trophies, GUI | [12-arena.md](12-arena.md) |
| 13 | `achievements` | 4 | Achievements + stats model | [13-achievements.md](13-achievements.md) |
| 14 | `puzzle` | 43 | Puzzle entities & logic: blocks, switches, platforms, chests | [14-puzzle.md](14-puzzle.md) |
| 15 | `model` | 5 | Base/options/game models — the save-game state | [15-model.md](15-model.md) |
| 16 | `map-content` | 11 | Game-level map content: elevators, jump panels, rhombus, doors | [16-map-content.md](16-map-content.md) |
| 17 | `interact` | 6 | Map/screen/skip interact, interact GUI, button groups | [17-interact.md](17-interact.md) |
| 18 | `timers` | 4 | In-game timers model + HUD | [18-timers.md](18-timers.md) |

## Cross-layer wiring

- **player** (1) is the hub: combat input feeds **combat** (2), animations
  come from `game.feature.character`/`assets/data/characters`, camera from
  `impact.feature.camera`.
- **combat** (2) consumes `assets/data/enemies/*` + `assets/data/effects/*`
  ([ENEMY](../../data/formats/01-enemy.md),
  [EFFECT](../../data/formats/03-effect.md)) and the
  `impact.feature.effect` engine.
- **menu** (5) + **gui** (6) build on `impact.feature.gui`
  ([features/01-gui](../../engine/impact/features/01-gui.md)).
- **model** (15) is what **storage** persists (`impact.feature.storage`).