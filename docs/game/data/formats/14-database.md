# DATABASE format (`assets/data/database.json`)

> **Status**: stub (pending).

## Scope

- Boot-time game database loaded by `ig.Database` (`ig.database`, see
  [impact.feature.database](../../engine/impact/features/23-database.md)).

## To document

- Field reference: editor entry types registered via
  `ig.database.register(name, editor, displayName, external)`
  (achievements metadata, editor dialogs).
- How `game.feature.achievements` reads its definitions from the database
  ([game: achievements](../../engine/game/13-achievements.md)).

## Related

- Engine: [impact.feature.database](../../engine/impact/features/23-database.md).