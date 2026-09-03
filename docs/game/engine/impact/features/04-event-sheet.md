# impact.feature.event-sheet — event sheets

> **Status**: core · Modules: `impact.feature.event-sheet.event-sheet`,
> `impact.feature.event-sheet.event-sheet-steps`,
> `impact.feature.event-sheet.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `event-sheet.event-sheet` | `ig.EventSheet` (JSON template) | Loads/parses sheet JSON: named trigger zones + event lists |
| `event-sheet.event-sheet-steps` | EVENT_STEP additions | Trigger/emit sheet events mid-map |
| `event-sheet.plug-in` | — | Entry point + editor registration |

## Behavior

- The event-sheet loader handles shared named event definitions and the
  editor's event-sheet workflow. In this build, map triggers usually carry
  their own `event` list in entity settings; shared callable definitions live
  in `assets/data/events/`.
- Steps can fire or compose other event flows (`CALL_EVENT`-style), composing
  quest/cutscene chains.
- Format: covered by the [EVENT SHEET format](../../../data/formats/07-event-sheet.md),
  including the distinction between embedded entity scripts and shared files.