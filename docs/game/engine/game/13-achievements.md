# game.feature.achievements — trophies & stats

> **Status**: core · 4 modules in `deobf/clean/game.feature.achievements.*`.
> Covers `sc.TrophyManager` (achievements) and `sc.StatsModel` (central
> stat tracking). Achievement definitions live in
> `assets/data/database.json` ([DATABASE format](../../data/formats/14-database.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `achievements.achievements` | `sc.TrophyManager` (GameAddon) | Trophy/achievement manager: loads achievements from the database, tracks unlock state from stat conditions, Steam integration via greenworks, organizes trophies by type (General/Combat/Exploration), section and sort order |
| `achievements.stats-model` | `sc.StatsModel` | Central statistics tracking: per-player stats (playtime, kills, items…), key→value stat maps queryable via `ig.vars`, deferred observer notifications to batch UI updates, boot count in localStorage |
| `achievements.stat-steps` | EVENT_STEP: `ENABLE/DISABLE_STATS`, `UNLOCK_TROPHY`, `ADD/SET_STAT_MAP_NUMBER` | Steps to enable/disable stat tracking, unlock trophies, manipulate stat map values |
| `achievements.plug-in` | — | Entry point + editor panels, step color rules |

## Behavior

- **`sc.StatsModel`** is the number bookkeeper: every tracked stat
  (kills, playtime, items collected…) lives in stat maps addressed through
  `ig.vars`. Changes notify observers with deferred events so HUDs and
  menus batch updates (e.g. the stats menu, `menu.gui.stats.*`).
- **`sc.TrophyManager`** watches stat conditions — when a stat crosses an
  achievement's threshold, the trophy unlocks: an in-game feat toast
  (`gui.hud.feat-hud`, [gui](06-gui.md)), and on Steam builds the
  achievement is pushed through greenworks
  ([impact.feature.greenworks](../../engine/impact/features/06-greenworks.md)).
- Trophies are organized into General/Combat/Exploration sections with
  sort order; the trophy menu ([menu](05-menu.md)) shows completion and
  total points.

## Hooks & steps

- EVENT_STEP registrations in `stat-steps`: `ENABLE_STATS`,
  `DISABLE_STATS`, `UNLOCK_TROPHY`, `ADD_STAT_MAP_NUMBER`,
  `SET_STAT_MAP_NUMBER`.
- Stats are incremented by combat ([combat](02-combat.md)), exploration
  (landmarks, areas via `menu.map-model`), quests and the arena.

## Related

- [combat](02-combat.md) · [menu](05-menu.md) · [arena](12-arena.md)
- Engine: [impact.feature.greenworks](../../engine/impact/features/06-greenworks.md),
  [impact.base.vars](../../engine/impact/01-core.md)
- Data: [DATABASE format](../../data/formats/14-database.md)