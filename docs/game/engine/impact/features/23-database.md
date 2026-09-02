# impact.feature.database — game database loader

> **Status**: core · Modules: `impact.feature.database.database`,
> `impact.feature.database.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `database.database` | `ig.Database` (singleton `ig.database`, `SingleLoadable`) | Loads the boot database JSON and serves typed lookups by key |
| `database.plug-in` | — | Entry point + editor registration |

## Behavior

- Loads `ig.DATABASE_FILE` (configured in `game.config` as
  `"data/database.json"`); `ig.DATABASE` config declares the editor entry
  types (e.g. `ACHIEVEMENTS: 1`).
- `ig.database.get(key)` returns the stored entry; `ig.database.register(name,
  editor, displayName, external)` registers **editor types** — how the map
  editor knows how to edit entries of that kind (with optional external
  path/data backing).
- `assets/data/database.json` holds boot-time data such as the achievement
  definitions and editor metadata — see
  [DATABASE format](../../../data/formats/14-database.md).

## Consumers

- Achievements (`game.feature.achievements`) read their definitions from
  the database; the editor uses registered types for entity dialogs.