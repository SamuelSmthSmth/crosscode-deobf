# Catalog — enemies

> **Status**: core · 229 enemy definitions in `assets/data/enemies/`
> (74 top-level + area folders). Schema:
> [ENEMY format](../formats/01-enemy.md). Consumed by the combat engine
> ([combat](../../engine/game/02-combat.md)).

## Area folders (counts)

| Folder | Files | Notes |
|---|---|---|
| `arid/` | 15 | Arid fauna (goats, vultures…) |
| `autumn-fall/` | 9 | Autumn's Fall enemies |
| `autumn-rh/` | 7 | Autumn Rise enemies |
| `heat/` | 17 | Vermillion Wasteland enemies |
| `jungle/` | 21 | Jungle enemies |
| `forest/` | 8 | Forest enemies |
| `cold/` | 10 | Cold dungeon enemies |
| `avatar/` | 7 | Player-avatar clones (PvP fights) |
| `boss/` | 6 | Bosses (apex, djungelskog, giant… see `boss/*.json`) |
| `minibosses/` | 18 | Mini-boss variants |
| `guest/` | 4 | Guest-star enemies |
| `beach/` | 1 | DLC beach enemy |
| `final/` | 2 | Final dungeon enemies |
| `rhombus/` | 2 | Arena/hub enemies |
| `special/` | 5 | Special encounters (turret defense…) |

## Notable top-level files

`baggy-kun.json`, `beat-bot.json`, `buffalo.json` / `buffalo-alt.json`,
`captain.json`, `daft-frobbit.json` / `frobbit.json`,
`frobbit-miniboss-femme/gallant.json`, `goat.json` / `goat-cave.json`,
`gray-frobbit.json`, `greenlight.json`, `guard-hostile-default.json`,
`default.json` (fallback template), plus boss/test files
(`beat-boss.json`, `boss-driller.json`, `boss-test.json`,
`boss-extra.json`, `baggy-kun-test.json`).

> Enemy entries define stats, element modes, AI states/actions (ACTION_STEP
> scripts, [06-action-steps](../formats/06-action-steps.md)) and drop
> tables (item ids → [10-item-database](../formats/10-item-database.md)).