# game.feature.gui — HUD & GUI components

> **Status**: core · 55 modules in `deobf/clean/game.feature.gui.*`
> (23 hud + 17 widget + 7 base + 7 screen + plug-in). The game-layer
> component library and HUD widgets built on `impact.feature.gui`
> ([01-gui](../../engine/impact/features/01-gui.md)).

## Modules & classes — base components (7)

| Module | Key classes | Responsibility |
|---|---|---|
| `gui.base.boxes` | `sc.BoxGui` (ninepatch/transition base), `sc.GridBox`, `sc.AnimatedBoxGui` | Rounded/ninepatch box GUI containers |
| `gui.base.button` | `sc.ButtonGui` + button-group hooks | Button component |
| `gui.base.compact-choice-box` | `sc.CompactChoiceBox` | Small choice box with arrow |
| `gui.base.misc` | `sc.TextGui`, `sc.TextBlock`, `sc.NumberGui`, `sc.NumberBarGui`, `sc.ProgressBar`, `sc.ButtonGui`, `sc.InfoBox`, `sc.InfoBar` | Core widget helpers |
| `gui.base.numbers` | `sc.NUMBER_SIZE`/`sc.NUMBER_COLOR`, `sc.NumberGui`, `sc.NumberBarGui`, `sc.ProgressBar` | Number/text displays + progress bars |
| `gui.base.slick-box` | `sc.SlickBox` | Rounded box GUI |
| `gui.base.text` | `sc.TextGui`, `sc.TextBlock` | Text with line wrap + per-char effects |

## Modules & classes — HUD widgets (23)

| Module | Key classes | Responsibility |
|---|---|---|
| `gui.hud.hp-hud` | `sc.HpHudGui`, `sc.HpHudBarGui` | HP box + animated HP/EXP bar |
| `gui.hud.sp-hud` | `sc.SpHudGui` | Full animated SP bar (segment renderer) |
| `gui.hud.sp-mini-hud` | `sc.SpMiniHudGui` | 4-pip mini SP bar above the player |
| `gui.hud.sp-change-hud` | `sc.SpChangeHudGui` | SP gain/consume popup |
| `gui.hud.exp-hud` | `sc.ExpHudGui` | Floating EXP entries + menu EXP counter |
| `gui.hud.param-hud` | `sc.ParamHudGui` | Level + HP/ATK/DEF/FOC boxes with pies |
| `gui.hud.element-hud` | `sc.ElementHudGui` | Element selector circle |
| `gui.hud.buff-hud` | `sc.BuffHudGui` | Buff icon row with time bars |
| `gui.hud.combat-hud` | `sc.CombatHudGui` | Combat transition bars + skip + ranked/PvP HUDs |
| `gui.hud.status-hud` | `sc.StatusHudGui` | Master status HUD + element bg/mode + overload overlay |
| `gui.hud.right-hud` | `sc.RightHudGui`, `sc.RightHudBoxGui` | Right-side box stack (timers, keys, hints) |
| `gui.hud.member-hud` | `sc.PartyHudGui` | Party portraits + HP/EXP/SP bars |
| `gui.hud.task-hud` | `sc.TaskHudBox` | Current/perma task box with timeout |
| `gui.hud.quest-hud` | `sc.QuestUpdateHud`, `sc.FavQuestHud` | Quest task box + pinned quest |
| `gui.hud.item-hud` | `sc.ItemHudBox` | Obtained-items list with amounts |
| `gui.hud.item-timer-hud` | `sc.ItemTimerHudGui` | Item-use cooldown countdown |
| `gui.hud.money-hud` | `sc.MoneyHudBox` | Credits gained + sum box |
| `gui.hud.lore-hud` | `sc.LoreUpdateHud` | Lore unlock/update box |
| `gui.hud.key-hud` | `sc.KeyHudGui` | Dungeon key / master key counter |
| `gui.hud.drop-hud` | `sc.DropUpdateHud` | Botanics drop completed box |
| `gui.hud.feat-hud` | `sc.FeatHud` | Trophy/feat unlock box |
| `gui.hud.landmark-hud` | `sc.LandmarkHud` | Landmark unlocked box |
| `gui.hud.top-msg-hud` | `sc.TopMsgHudGui` | Large center announcements (icon/title/sub) |

## Modules & classes — widgets (17)

| Module | Key classes | Responsibility |
|---|---|---|
| `gui.widget.modal-dialog` | `sc.ModalDialog`, `sc.DialogBox` | Modal overlay + dialog box |
| `gui.widget.chest-items` | `sc.ChestItemsGui` | Chest obtain-items overlay |
| `gui.widget.level-up-hud` | `sc.LevelUpHudGui` | Level-up flash overlay |
| `gui.widget.timer-gui` | `sc.TimerGui` | Countdown timer box |
| `gui.widget.counter-hud` | `sc.CounterHudGui` | Combo counter HUD |
| `gui.widget.information` | `sc.InformationGui` | Popup info box |
| `gui.widget.bar-widget` | `sc.BarWidget` | Generic progress bar widget |
| `gui.widget.skip-scene` | `sc.SkipSceneGui` | Skip-scene button overlay |
| `gui.widget.click-box` | `sc.ClickBox` | Click-to-continue hint |
| `gui.widget.gamepad-box` | `sc.GamepadBox` | Gamepad icon hint box |
| `gui.widget.social` | `sc.SocialWidget` | Social links bar (Twitch/YouTube/Discord/Steam) |
| `gui.widget.sergey-mode` | `sc.SergeyModeGui` | Dev/hidden sergey-mode toggle box |
| `gui.widget.tutorial-start-gui` | `sc.TutorialStartGui` | Tutorial intro box |
| `gui.widget.tutorial-marker` | `sc.TutorialMarkerGui` | On-screen tutorial marker |
| `gui.widget.demo-stats` | `sc.DemoStatsGui` | Demo stats screen |
| `gui.widget.demo-highscore` | `sc.DemoHighscoreGui` | Demo highscore entry |
| `gui.widget.indiegogo-gui` | `sc.IndieGoGoGui` | Backing banner |

## Modules & classes — screens (7)

| Module | Key classes | Responsibility |
|---|---|---|
| `gui.screen.title-screen` | `sc.TitleScreen` | Main menu (new game / continue / options) |
| `gui.screen.title-preset` | `sc.TitlePreset` | Title screen layout presets |
| `gui.screen.title-logo` | `sc.TitleLogo` | Animated logo |
| `gui.screen.pause-screen` | `sc.PauseScreen` | Pause menu |
| `gui.screen.intro-screen` | `sc.IntroScreen` | Logo intro sequence |
| `gui.screen.credits-screen` | `sc.CreditsScreen` | Rolling credits |
| `gui.screen.loading-screen` | `sc.LoadingScreenGui` | Loading progress screen |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Add a reusable widget | `sc.GuiElementBase`-based component | Own layout, focus, draw, and removal lifecycle |
| Display model state | Observer callback → widget state | Update on model messages, not every draw |
| Add HUD content | Right/left HUD stack or named GUI hook | Keep it below/above the intended HUD order |
| Draw a number/bar | `sc.NumberGui` / `sc.ProgressBar` | Use existing fonts, transitions, and scaling |
| Add a screen | `sc.*Screen` | Coordinate pause/loading/title ownership with the model |

```ts
widget.modelChanged?(model: sc.Model, message: string, data?: unknown): void;
widget.remove?(deep?: boolean): void;
```

## Guardrails

- Do not create a second top-level canvas or bypass `ig.gui` for ordinary HUD.
- Do not mutate model state in `onDraw`; subscribe and update widget state in
  lifecycle/model callbacks.
- Do not assume logical canvas dimensions are physical pixels; GUI layout uses
  the logical canvas coordinate system.
- Remove hooks and child GUI elements when a screen/widget is replaced to avoid
  duplicate HUD entries and retained references.

## Behavior

- **HUD widgets** attach to the right/left box stacks or float in the world
  (mini SP bar, buff icons, element selector); they subscribe to their
  models (`sc.PlayerModel`, `sc.QuestModel`, …) as observers
  ([model](15-model.md)) and redraw on `modelChanged`.
- **Base components** (`sc.BoxGui`, `sc.SlickBox`, `sc.ButtonGui`,
  `sc.TextGui`, `sc.NumberGui`…) are the shared vocabulary for both HUDs
  and the menu system ([menu](05-menu.md)) — everything derives from
  `ig.GuiElementBase` with transition states (see
  [impact.feature.gui](../../engine/impact/features/01-gui.md)).
- **Screens** are the top-level full-screen GUIs swapped on state changes
  (title → intro → loading → game; pause on top).
- Draw order: HUD lives at addon order **500** (postDraw), above world
  effects ([01-core.md](../../engine/impact/01-core.md)).

## Hooks & steps

- HUD updates are model-driven; no step registrations of its own (the
  msg/quest/timer steps show/hide specific HUD elements, see
  [msg](07-msg.md), [quest](08-quest.md), [timers](18-timers.md)).

## Related

- [menu](05-menu.md) · [model](15-model.md) · [msg](07-msg.md)
- Engine: [impact.feature.gui](../../engine/impact/features/01-gui.md),
  [01-core.md](../../engine/impact/01-core.md) (addon draw order)