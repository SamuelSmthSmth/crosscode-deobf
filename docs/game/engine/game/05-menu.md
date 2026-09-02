# game.feature.menu — the menu system

> **Status**: core · 105 modules in `deobf/clean/game.feature.menu.*`
> (11 foundation + 94 submenu). All 22+ menu sections of the pause/start
> menus, built on `impact.feature.gui`
> ([01-gui](../../engine/impact/features/01-gui.md)). State lives in
> `sc.MenuModel` and the section models (`sc.MapModel`, `sc.LoreModel`).

## Modules & classes — foundation (11)

| Module | Key classes | Responsibility |
|---|---|---|
| `menu.menu-model` | `sc.MenuModel` | Submenu stack, hotkeys, shop cart, drops, stamps, skill/map state, save/load |
| `menu.menu-steps` | EVENT steps | ADD_PLANT, UNLOCK_ENEMY/LORE\*, landmarks, chest undo, OPEN_SHOP/QUEST_HUB, UNDO_VISITED_AREA |
| `menu.area-loadable` | `sc.AreaLoadable`, `sc.AreaRoomBounds`, `AREA_ICONS`/`AREA_CONNECTIONS` | Area metadata loading + flood-fill room bounds for the map |
| `menu.lore-model` | `sc.LoreModel` | Lore unlock tracking, categories/sort, new-unlock/log/stats wiring, completion %, storage |
| `menu.map-model` | `sc.MapModel` | Area & landmark tracking, visited/floors state, key/booster helpers, dungeon detection, teleport events, storage |
| `menu.gui.base-menu` | `sc.BaseMenu`, `sc.ListInfoMenu` | Menu container base + list/info menu with hotkeys |
| `menu.gui.menu-misc` | panels, scroll panes/sliders, list buttons, toggles, status displays | Shared menu widgets (87 dependents) |
| `menu.gui.list-boxes` | `sc.ButtonListBox`, `sc.ItemListBox`, `sc.MultiColumnItemListBox` | List box variants |
| `menu.gui.tab-box` | `sc.TabbedPane`, `sc.ListTabbedPane` | Tabbed panes |
| `menu.gui.help-boxes` | `sc.HelpScrollContainer`, `sc.MultiPageBoxGui` | Multi-page help boxes |
| `menu.plug-in` | — | Entry point + editor registration |

## Modules & classes — menu sections (94)

| Section | Modules | Key classes / content |
|---|---|---|
| `main-menu` | 1 | `sc.MainMenu` container: TopBar, Lea status line, side buttons, hotkey bar |
| `start-menu` | 1 | `sc.StartMenu`: the pause/start menu (resume, save, load, options, quit) |
| `equip.*` | 4 | `sc.EquipMenu` + misc + status panel (base params + modifier preview) + body-part buttons/list |
| `circuit.*` | 7 | `sc.CircuitMenu` (overview/detail/swap), tree rendering (`TREE_CONFIGS`), node menu, effect display |
| `item.*` | 8 | `sc.ItemMenu` + tabbed list (per-tab sort, equip/fav overlays), sort menu, status panels (equip/default/buffs/favs/trade) |
| `map.*` | 6 | `sc.MapMenu` (area map + worldmap + floors + stamps), `sc.MapAreaContainer` (pan/drag, landmarks), prerendered rooms (`sc.MapRoom`), `sc.MapWorldMap` |
| `shop.*` | 8 | `sc.ShopMenu` (buy/sell state machine), start/list/stats/cart/quantity/confirm + `sc.ShopHelper` |
| `quests.*` | 5 | `sc.QuestMenu` + tab list (active/solved/all), subtask entries, details view, misc boxes |
| `arena.*` | 5 | `sc.ArenaMenu` (cup ↔ round lists), cup info page (banner/highscore/medals), round info page (challenges) |
| `botanics.*` | 3 | `sc.BotanicsMenu`: per-area plant list, progress bars, item-destruct displays |
| `new-game.*` | 4 | `sc.NewGamePlusMenu` (NG+ setup), option list, toggle sets, mode-select dialog |
| `options.*` | 4 | `sc.OptionsMenu` (tab list + option rows), `sc.OPTION_GUIS` widget types, `sc.KeyBinderGui`, lang popup |
| `save.*` | 3 | `sc.SaveList` (slots, save/load/delete), `sc.SaveMenu`, slot buttons with NG+ badge/playtime/party |
| `enemies.*` | 4 | `sc.EnemyMenu` (per-element tabs), info pages (stats, drops, hunting logs) |
| `help.*` | 2 | `sc.HelpMenu`: topic list + detail box |
| `lore.*` | 3 | `sc.LoreMenu`: story/people/cross-lore/earth-lore tabs, info box content renderer |
| `museum.*` | 1 | `sc.MuseumMenu`: museum info + help dialog |
| `quest-hub.*` | 3 | `sc.QuestHubMenu`: open/active/finished tabs, availability + completion panels, rewards |
| `social.*` | 3 | `sc.SocialMenu`: party list + info, invite/contact/remove popups, `SOCIAL_ACTION` wiring |
| `stats.*` | 5 | `sc.StatsMenu`: `sc.STATS_BUILD` tabs (general/combat/items/exploration/quests/arena/misc/log), `sc.STATS_ENTRY_TYPE` registry |
| `status.*` | 6 | `sc.StatusMenu`: main/params/mods/combat-arts pages with base vs equip diffs |
| `synop.*` | 2 | `sc.SynopsisMenu`: start-screen submenu column + task/log displays (`sc.LOG_GUI_TYPE`) |
| `trade.*` | 3 | `sc.TraderMenu`: per-area trader list, get/require offer entries, trade details overlay |
| `trophy.*` | 3 | `sc.TrophyMenu`: GENERAL/COMBAT/EXPLORATION tabs, progress toggle, total points |

## Behavior

- **`sc.MenuModel`** manages the submenu stack (which menu is open, in
  what order), hotkey routing and per-menu state (cart, stamps, drops).
  It persists through `ig.storage`.
- **Every section** is a `sc.BaseMenu` subclass built from shared widgets
  (`menu-misc`, `list-boxes`, `tab-box`, `help-boxes`): a tabbed or
  list/info layout with a cursor, hotkeys and gamepad support, all on top
  of `ig.GuiElementBase` (see
  [impact.feature.gui](../../engine/impact/features/01-gui.md)).
- **Where data comes from**: skilltree.json ([SKILLTREE](../../data/formats/11-skilltree.md))
  → circuit menu; item-database.json ([ITEM DATABASE](../../data/formats/10-item-database.md))
  → item/equip/shop menus; enemy JSONs ([ENEMY](../../data/formats/01-enemy.md))
  → enemies menu; arena JSONs ([MISC](../../data/formats/13-misc.md)) →
  arena menu; database.json ([DATABASE](../../data/formats/14-database.md))
  → lore/museum/trophy menus.

## Hooks & steps

- EVENT steps from `menu-steps` (plant, enemy/lore unlocks, landmarks,
  chest undo, shop/quest-hub open, visited-area undo) drive menu state
  from cutscenes/events.
- Menus open from the start screen (`sc.StartMenu`), the pause screen
  (`gui.screen.pause-screen`, [gui](06-gui.md)) and the quick menu
  (`game.feature.quick-menu`).

## Related

- [gui](06-gui.md) · [model](15-model.md) · [skills](09-skills.md) ·
  [inventory](10-inventory.md) · [trade](11-trade.md) · [arena](12-arena.md)
- Engine: [impact.feature.gui](../../engine/impact/features/01-gui.md)
- Data: the format pages linked above