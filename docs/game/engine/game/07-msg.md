# game.feature.msg — messaging & dialogue

> **Status**: core · 10 modules in `deobf/clean/game.feature.msg.*`
> (4 core + 6 GUI). Covers `sc.MessageModel` (the visual-novel-style
> conversation system), the event-trigger entities and every message
> GUI variant. Text resolves through `assets/data/lang/*`
> ([LANG format](../../data/formats/12-lang.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `msg.message-model` | `sc.MessageModel` (GameAddon) | Central message/dialog model: showing messages, choices, board messages, side messages, private messages, person management; blocking state, auto-script timers, voice-acting integration |
| `msg.msg-steps` | EVENT/ACTION steps | Show messages (normal, offscreen, side, board, dream, center), manage participants, choices, private messages, tutorial dialogs, modal choices, tutorial markers, demo highscore/time, get-item messages, auto-script… |
| `msg.entities.event-trigger` | `sc.Cutscene`, `ig.ENTITY.EventTrigger`, `ig.ENTITY.LocationEvent` | Entity-based event dispatch: Cutscene singleton (cutscene/combat-cutscene/menu-event/auto-control-event), map-placed triggers by condition/screen-visibility/proximity |
| `msg.gui.message-box` | `sc.MsgBoxGui`, `sc.ChoiceBoxGui` | Classic dialog box with pointer + choice rows |
| `msg.gui.message-board` | `sc.MsgBoardContentGui`, `sc.MsgBoardGui` | Center board messages (large announcements) |
| `msg.gui.side-message-hud` | `sc.SideMessageHudGui` + boxes/face/label | Side dialog queue with portraits (party banter) |
| `msg.gui.message-overlay` | `ig.MessageOverlayGui`, `MessageAreaGui`, `Entry/Portrait/DisplayName`, `PrivateMessageBGGui`, `sc.MsgGuiTools.drawPortrait` | On-screen message overlay (MMO-style chat) + private message backgrounds |
| `msg.gui.dream-msg` | `sc.DreamMsgGui` | Floating dream text above entities |
| `msg.gui.msg-skip-hud` | `sc.MsgSkipGui` | Blinking skip-cutscene hint |
| `msg.plug-in` | — | Entry point + editor registration, step color rules |

## Behavior

- **`sc.MessageModel`** runs the conversation system: a queue of messages
  (box/board/side/dream/overlay types), choices, private messages and
  participant management. It tracks blocking state (game waits while a
  message is up), drives auto-script timers, and integrates with the voice
  acting system (`game.feature.voice-acting`).
- **Message GUIs**: `sc.MsgBoxGui`/`sc.ChoiceBoxGui` for classic dialogue,
  `sc.SideMessageHudGui` for the portrait side queue, `sc.MsgBoardGui` for
  center boards, `sc.DreamMsgGui` for floating text, and
  `ig.MessageOverlayGui` for chat-style overlays.
- **Event triggers**: `ig.ENTITY.EventTrigger`/`ig.ENTITY.LocationEvent`
  fire messages/cutscenes from maps based on conditions, screen visibility
  and player proximity; `sc.Cutscene` starts the various event types
  (see `impact.base.event`, [07-events](../../engine/impact/07-events.md)).

## Hooks & steps

- Extensive EVENT/ACTION_STEP registrations in `msg-steps`
  (`SHOW_MSG`, `SHOW_CHOICE`, `SHOW_BOARD_MSG`, …).
- NPC dialogues open through `sc.MessageModel` from NPC interaction
  ([npc](03-npc.md)); quest accept/decline dialogs flow through quests
  ([quest](08-quest.md)); skip interact ([interact](17-interact.md))
  feeds the skip HUD.

## Related

- [npc](03-npc.md) · [quest](08-quest.md) · [interact](17-interact.md)
- Engine: [impact.base.event](../../engine/impact/07-events.md),
  [impact.feature.gui](../../engine/impact/features/01-gui.md)
- Data: [LANG format](../../data/formats/12-lang.md)