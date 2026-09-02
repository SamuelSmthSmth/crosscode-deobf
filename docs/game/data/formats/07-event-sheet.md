# EVENT SHEET format (`assets/data/maps/**`, `assets/data/events/`)

> **Status**: stub (pending).

## Scope

Event sheets are cutscene/quest scripts: named lists of
`ig.EVENT_STEP.*` commands (TELEPORT, WAIT, IF, MASS_AVATAR_MOVE,
CHANGE_VAR_*, DO_ACTION…) executed by `ig.EventSheet`
([impact.feature.event-sheet](../../engine/impact/features/04-event-sheet.md)).

- Inside map JSONs (`eventSheets[]`) and shared snippets in
  `assets/data/events/` (e.g. `puzzle.json`).

## To document

- Event-sheet JSON schema: `name`, `repeatable`, `steps[]` (each step:
  `class` = `EVENT_STEP.*`, `data` params), `triggers[]`
  (EVENT_TRIGGER types: interact, cutscene, area, …).
- The 42 engine-level EVENT_STEPs
  ([features/30-base](../../engine/impact/features/30-base.md)) plus the
  game-layer additions (quest, combat, arena…).
- Trigger semantics (one-shot vs repeatable, priority, conditions).

## Related

- Steps reference: [ACTION_STEP reference](06-action-steps.md).
- Engine: [impact.feature.event-sheet](../../engine/impact/features/04-event-sheet.md).