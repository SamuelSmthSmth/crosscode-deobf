# impact.feature.greenworks — Steam integration

> **Status**: core · Modules: `impact.feature.greenworks.greenworks`,
> `impact.feature.greenworks.plug-in`. Runtime libs:
> `assets/modules/greenworks-*` (0.4.0 / 0.5.3 / 0.13.0 / nw-0.35 variants).

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `greenworks.greenworks` | `ig.Greenworks` | Loads the native greenworks module; Steam init, user stats, achievements, overlay, cloud |
| `greenworks.plug-in` | — | Boot activation; fails quietly when not on Steam |

## Behavior

- Wraps the `greenworks` native Steamworks bindings. `ig.Greenworks` exposes
  availability (`isAvailable`), `getUserStats`, `setAchievement`, overlay
  enable/disable, screenshot/cloud hooks.
- The game layer consumes it via `sc.TrophyManager`
  (`game.feature.achievements.achievements`) — Steam achievements mirror the
  in-game trophies; `sc.StatsModel` feeds the stat pipeline.
- Offline/factory builds degrade gracefully (no crash without Steam).

## Touchpoints

- Achievements data: `assets/data/database.json` → `achievements` section
  ([DATABASE format](../../../data/formats/14-database.md)).
- Steam App ID: root `steam_appid.txt`.