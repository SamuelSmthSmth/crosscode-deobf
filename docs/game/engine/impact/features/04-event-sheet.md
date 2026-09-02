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

- Event sheets let a single map file store **many named events** in one
  entity (the editor's "event sheets" workflow) instead of one entity per
  event; `sc.EventTrigger`/location triggers consume them
  (`game.feature.msg.entities.event-trigger`).
- Steps allow events to fire other sheet events (`CALL_EVENT`-style),
  composing quest/cutscene chains.
- Format: covered by the [EVENTS format](../../../data/formats/08-event.md)
  (event JSON `events` map keyed by name).