# game.feature.msg — messaging & dialogue

> **Status**: stub (pending).

## Modules (10)

`msg.entities.event-trigger`, `msg.gui.dream-msg`, `msg.gui.message-board`,
`msg.gui.message-box`, `msg.gui.message-overlay`, `msg.gui.msg-skip-hud`,
`msg.gui.side-message-hud`, `msg.message-model`, `msg.msg-steps`,
`msg.plug-in`

## To document

- `sc.MessageModel`: message queue, types (box, board, dream, side),
  choices, typewriter effect, lang-key resolution.
- `sc.MessageBox` + variants (dream messages, message boards).
- Skip HUD (hold-to-skip) and event-trigger entities that fire messages.
- Msg EVENT_STEPs (`msg-steps`).

## Related

- [npc](03-npc.md) · [quest](08-quest.md) · [LANG format](../../data/formats/12-lang.md)