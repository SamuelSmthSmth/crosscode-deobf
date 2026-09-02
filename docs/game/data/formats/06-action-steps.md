# ACTION_STEP reference — the entity scripting language

> **Status**: stub (pending).

## Scope

`ig.ACTION_STEP.<NAME>` classes are the per-actor script commands used in
enemy `actions`, character scripts and event-sheet `DO_ACTION` blocks.
97 are registered by the engine feature layer
([impact.feature.base](../../engine/impact/features/30-base.md)); the game
layer (`game.feature.base.action-steps`, `game.feature.combat.combat-action-steps`,
`game.feature.arena.arena-steps`, …) registers dozens more.

## To document

- Complete alphabetical catalogue of all registered steps, engine + game
  layer, with parameter schemas and JSON examples.
- Step execution model: `ig.ActionStep.exec(actor, …)` context,
  `doStep`/`finishStep`, step chaining and wait semantics.
- Where each family is used: enemy AI actions, cutscene avatar control,
  quest event sheets.

## Related

- Engine runtime: [impact.base events](../../engine/impact/07-events.md).
- Base registry: [features/30-base](../../engine/impact/features/30-base.md).
- Event-sheet steps: [EVENT SHEET format](07-event-sheet.md).