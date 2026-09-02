# game.feature.quest — quests

> **Status**: stub (pending).

## Modules (4)

`quest.quest-model`, `quest.quest-steps`, `quest.quest-types`, `quest.plug-in`

## To document

- `sc.QuestModel`: quest list, states (available/active/completed),
  objectives, progress tracking, rewards.
- Quest types (`quest-types`) — story, side, arena, NPC…
- Quest EVENT_STEPs (`quest-steps`) used by event sheets to start/advance
  quests.
- Quest definitions live in map event sheets + character JSONs
  ([EVENT SHEET format](../../data/formats/07-event-sheet.md)).

## Related

- [msg](07-msg.md) · [impact.feature.event-sheet](../../engine/impact/features/04-event-sheet.md)