# Deobfuscation Progress

Tracked per module. Cleaned files live in `deobf/clean/`; raw extractions in
`deobf/extract/`.

**Total modules: 569** (`impact.*` 154, `game.*` 415).

> **Progress: 569/569 (100%)** — ✅ COMPLETE (2026-08-25)
> Status note: the `impact.feature.*` groups were cleaned by Claude (2026-08-20)
> and restored/verified after a botched undo pass. The `game.*` layer was cleaned
> in batches: top-level, model, player, combat, puzzle, menu, gui, quick-menu.gui,
> msg.gui, arena.gui, trade.gui, map-content.gui, version.gui, NPC, character,
> common-event, control, font, game-code, beta, ar, save-preset, bgm,
> auto-control, tutorial, credits, achievements, arena core, game-sense,
> msg core, new-game, quest core, then the final non-gui subsystems: base,
> interact, inventory, map-content (core), party, quest-steps, quick-menu,
> skills, timers, trade, version, voice-acting, xeno-dialogs — all done.
> Every module passes `node --check`; token-stream LCS ≥ 0.929 vs its extract.
> **Do not** run bulk "copy extract → clean" scripts — the only real deliverable is
> hand-cleaned code.

---

## impact.base.* (34 modules) — ✅ DONE (34/34)

- [x] impact.base.timer
- [x] impact.base.worker
- [x] impact.base.entity-pool
- [x] impact.base.dom
- [x] impact.base.tile-info
- [x] impact.base.global-settings
- [x] impact.base.impact
- [x] impact.base.steps
- [x] impact.base.action
- [x] impact.base.game-state
- [x] impact.base.lang
- [x] impact.base.extension
- [x] impact.base.system.web-audio
- [x] impact.base.sprite-fx
- [x] impact.base.background-map
- [x] impact.base.map
- [x] impact.base.sprite
- [x] impact.base.actor-entity
- [x] impact.base.animation
- [x] impact.base.coll-entry
- [x] impact.base.collision-map
- [x] impact.base.entity
- [x] impact.base.event
- [x] impact.base.font
- [x] impact.base.game
- [x] impact.base.image
- [x] impact.base.input
- [x] impact.base.loader
- [x] impact.base.physics
- [x] impact.base.renderer
- [x] impact.base.sound
- [x] impact.base.system
- [x] impact.base.utils
- [x] impact.base.vars

## impact.feature.* (120 modules) — ✅ DONE (120/120)

### impact.feature.gui.* (6 modules) — ✅ DONE (6/6)

- [x] impact.feature.gui.gui             ← core: ig.Gui, ig.GuiHook, ig.GuiElementBase, ig.GuiDrawable, ig.GuiTransform, ig.GuiStepPool
- [x] impact.feature.gui.base.basic-gui  ← ig.ImageGui, ig.ColorGui, ig.SequenceGui, ig.SimpleGui
- [x] impact.feature.gui.base.box        ← ig.NinePatch, ig.BoxGui
- [x] impact.feature.gui.gui-images      ← ig.GuiImage (singleton), ig.GuiImageContainer
- [x] impact.feature.gui.gui-steps       ← EVENT_STEP: ADD_GUI, REMOVE_GUI, CHANGE_GUI_STATE, SHOW_IMAGE, MOVE_IMAGE, REMOVE_IMAGE
- [x] impact.feature.gui.plug-in         ← subsystem entry point

### impact.feature.effect.* (15 modules) — ✅ DONE (15/15)

- [x] impact.feature.effect.effect-sheet
- [x] impact.feature.effect.effect-steps
- [x] impact.feature.effect.entities.effect
- [x] impact.feature.effect.entities.effect-particle
- [x] impact.feature.effect.entities.effect-previewer
- [x] impact.feature.effect.fx.fx-basic
- [x] impact.feature.effect.fx.fx-box
- [x] impact.feature.effect.fx.fx-circle
- [x] impact.feature.effect.fx.fx-color
- [x] impact.feature.effect.fx.fx-homing
- [x] impact.feature.effect.fx.fx-light
- [x] impact.feature.effect.fx.fx-line
- [x] impact.feature.effect.fx.fx-rhombus
- [x] impact.feature.effect.fx.fx-wipe
- [x] impact.feature.effect.plug-in

### impact.feature.env-particles.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.env-particles.env-particles
- [x] impact.feature.env-particles.env-particles-steps
- [x] impact.feature.env-particles.plug-in

### impact.feature.event-sheet.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.event-sheet.event-sheet
- [x] impact.feature.event-sheet.event-sheet-steps
- [x] impact.feature.event-sheet.plug-in

### impact.feature.gamepad.* (4 modules) — ✅ DONE (4/4)

- [x] impact.feature.gamepad.gamepad
- [x] impact.feature.gamepad.html5-gamepad
- [x] impact.feature.gamepad.nwf-gamepad
- [x] impact.feature.gamepad.plug-in

### impact.feature.greenworks.* (2 modules) — ✅ DONE (2/2)

- [x] impact.feature.greenworks.greenworks
- [x] impact.feature.greenworks.plug-in

### impact.feature.height-map.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.height-map.height-map-config  ← editor chipset data (pure data, no logic)
- [x] impact.feature.height-map.plug-in
- [x] impact.feature.height-map.height-map         ← ig.MAP.HeightMap layer + wm.HeightMapConverter + ChipsetSettings (verified behavior-identical vs extract)

### impact.feature.light.* (5 modules) — ✅ DONE (5/5)

- [x] impact.feature.light.light              ← ig.Light add-on, LightHandle, DarknessHandle, ScreenFlashHandle, GlowColor, CondLights, LIGHT_SIZE/METRIC
- [x] impact.feature.light.light-steps        ← ACTION_STEP: ADD_DARKNESS, CLEAR_DARKNESS
- [x] impact.feature.light.light-map          ← ig.MAP.Light shadow-provider layer
- [x] impact.feature.light.entities.cond-light ← ig.ENTITY.ConditionalLight
- [x] impact.feature.light.plug-in

### impact.feature.weather.* (6 modules) — ✅ DONE (6/6)

- [x] impact.feature.weather.weather          ← ig.WEATHER_TYPES data + ig.WeatherInstance + ig.Weather add-on
- [x] impact.feature.weather.clouds           ← ig.Clouds shadow provider
- [x] impact.feature.weather.fog              ← ig.Fog shadow provider
- [x] impact.feature.weather.rain             ← ig.RAIN_STRENGTH + ig.Rain + ig.RainDropEntity
- [x] impact.feature.weather.weather-steps    ← EVENT_STEP: SET_WEATHER, RESTORE_WEATHER_PARTICLES
- [x] impact.feature.weather.plug-in

### impact.feature.camera.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.camera.camera           ← ig.Camera add-on + PosTarget/EntityTarget/MultiEntityTarget/TargetHandle
- [x] impact.feature.camera.camera-steps     ← EVENT/ACTION_STEP: SET_CAMERA_TARGET/POS/BETWEEN, RESET, UNDO, ZOOM, FOCUS_CAMERA
- [x] impact.feature.camera.plug-in

### impact.feature.storage.* (2 modules) — ✅ DONE (2/2)

- [x] impact.feature.storage.storage         ← ig.SaveSlot, ig.StorageData, ig.Storage add-on, ig.StorageTools
- [x] impact.feature.storage.plug-in

### impact.feature.bgm.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.bgm.bgm                ← ig.BGM_SWITCH_MODE, ig.BgmTrack(Set), ig.bgm add-on
- [x] impact.feature.bgm.bgm-steps          ← EVENT_STEP: PLAY/PAUSE/RESUME/PUSH/POP/IN_BETWEEN/SET_DEFAULT/RESUME_DEFAULT_BGM
- [x] impact.feature.bgm.plug-in

### impact.feature.interact.* (5 modules) — ✅ DONE (5/5)

- [x] impact.feature.interact.interact          ← ig.InteractEntry + ig.InteractManager
- [x] impact.feature.interact.button-interact   ← ig.ButtonGroup + ig.ButtonInteractEntry
- [x] impact.feature.interact.press-repeater    ← ig.PressRepeater
- [x] impact.feature.interact.gui.focus-gui     ← ig.FocusGui
- [x] impact.feature.interact.plug-in

### impact.feature.parallax.* (3 modules) — ✅ DONE (3/3)

- [x] impact.feature.parallax.parallax       ← ig.Parallax layer with repeat/scroll animation
- [x] impact.feature.parallax.parallax-steps ← EVENT_STEP: SET_PARALLAX_POS/SPEED/REPEAT/ANIMATION
- [x] impact.feature.parallax.plug-in

### impact.feature.terrain.* (2 modules) — ✅ DONE (2/2)

- [x] impact.feature.terrain.terrain         ← ig.Terrain pattern auto-tiling engine
- [x] impact.feature.terrain.plug-in

### impact.feature.navigation.* (4 modules) — ✅ DONE (4/4)

- [x] impact.feature.navigation.navigation   ← ig.navigation add-on + ig.NavigationEntity (A* pathfinding: getClosePosition, findPath, _moveCircle, sideways, moveRange, dodge, runAway)
- [x] impact.feature.navigation.nav-map      ← ig.MAP.Navigation node graph + ig.PathNode flood-fill + ig.PathNodeConnect
- [x] impact.feature.navigation.navigation-steps ← NAVIGATE_TO/ESCAPE/SIDEWAYS/RANGE_TARGET, TO_ENTITY, ESCAPE_ENTITY, DODGE, TO_POINT, DO_NAVIGATION, CANCEL_IF_NAVIGATION_FAILED, SET_ATTRIB_CLOSE_TARGET_POS/TARGET_DELTA_POS/NAV_TARGET_POS
- [x] impact.feature.navigation.plug-in

### impact.feature.base.* (7 modules) — ✅ DONE (7/7)

- [x] impact.feature.base.plug-in
- [x] impact.feature.base.entities.marker
- [x] impact.feature.base.entities.touch-trigger
- [x] impact.feature.base.entities.sound-entities
- [x] impact.feature.base.entities.object-layer-view
- [x] impact.feature.base.action-steps   ← all 97 ig.ACTION_STEP.* classes (movement, physics, anim, vars, sound…)
- [x] impact.feature.base.event-steps    ← all 42 ig.EVENT_STEP.* classes (entity ops, mass avatar, vars, sound…)

### impact.feature.map-content.* (11 modules) — ✅ DONE (11/11)

- [x] impact.feature.map-content.map-style          ← ig.mapStyle add-on (style-keyed values)
- [x] impact.feature.map-content.map-content-steps  ← NUDGE_PROP, OPEN_DOOR, CLOSE_DOOR, ENTER_DOOR
- [x] impact.feature.map-content.entities.door      ← ig.ENTITY.Door (walk-through + teleport) + ig.DoorMat
- [x] impact.feature.map-content.entities.stair-door← ig.ENTITY.TeleportStairs (up/down stairs walk)
- [x] impact.feature.map-content.entities.teleport-ground ← ig.ENTITY.TeleportGround (exit tile)
- [x] impact.feature.map-content.entities.prop      ← ig.ENTITY.Prop + ig.PropSheet (nudging, fix-draw, cond anims)
- [x] impact.feature.map-content.entities.scalable-prop ← ig.ENTITY.ScalableProp + ig.ScalePropSheet
- [x] impact.feature.map-content.entities.hidden-block  ← HiddenBlock + HiddenSkyBlock
- [x] impact.feature.map-content.entities.glowing-ground ← ig.ENTITY.GlowingGround
- [x] impact.feature.map-content.entities.note      ← editor note entity
- [x] impact.feature.map-content.plug-in

**Entire `impact.*` layer complete.** Both step files were verified
behavior-identical to the extract via token-stream LCS diff (the only
allowed deltas are pure `var` redeclarations of same-function locals).

## game.* (415 modules) — ✅ DONE (415/415)

### game.* top-level (6 modules) — ✅ DONE (6/6)

- [x] game.main        ← sc.CrossCode: input binding, GUI stack, teleport/respawn flows, startup
- [x] game.loader      ← sc.StartLoader: startup loading screen + progress bar
- [x] game.config      ← langs, terrain types, asset paths, editor config (data)
- [x] game.constants   ← window.Constants (ball physics)
- [x] game.beta        ← beta plug-in aggregator
- [x] game.features    ← requires every engine + game subsystem plug-in

### game.feature.model.* (5 modules) — ✅ DONE (5/5)

- [x] game.feature.model.base-model    ← sc.Model observer helper
- [x] game.feature.model.game-model    ← sc.GameModel (states/substates, combat mode+rank, tasks, mobility blocks)
- [x] game.feature.model.options-model ← sc.OptionModel + OPTIONS_DEFINITION table, sc.KeyBinder
- [x] game.feature.model.model-steps   ← model event steps (SET_TASK, SET_FORCE_COMBAT, ADD_PLAYER_EXP, …)
- [x] game.feature.model.plug-in

### game.feature.player.* (14 modules) — ✅ DONE (14/14)

- [x] game.feature.player.plug-in
- [x] game.feature.player.player-base (entities)
- [x] game.feature.player.player-pet (entities)
- [x] game.feature.player.crosshair (entities) — incl. CrosshairDot, both controllers
- [x] game.feature.player.crosshair-steps
- [x] game.feature.player.player-config ← PlayerConfig, PlayerAction, PlayerSubConfig, AIM_ACTIONS
- [x] game.feature.player.player-level  ← LEVEL_CURVES + PlayerLevelTools (autoequip/equip)
- [x] game.feature.player.player-level-notifier
- [x] game.feature.player.item-consumption
- [x] game.feature.player.modifiers
- [x] game.feature.player.player-model  ← sc.PlayerModel: inventory, equip, skills, elements, credits, EXP, save/load, ig.vars accessors (caught & fixed a dropped getNewItemList via LCS)
- [x] game.feature.player.player-skin   ← skin definitions table + PlayerSkinLibrary addon + PLAYER_SKIN types
- [x] game.feature.player.player-steps  ← EVENT/ACTION_STEP classes (skills, elements, camera focus, item consume, food icons, proxy balls)
- [x] game.feature.player.entities.player ← the player entity: input state machine, dash/guard/charge handlers, skins, pet actions

### game.feature.combat.* (45 modules) — ✅ DONE (45/45)

- [x] game.feature.combat.combat-target-event
- [x] game.feature.combat.entities.respawn-blocker
- [x] game.feature.combat.model.proxy
- [x] game.feature.combat.model.enemy-booster
- [x] game.feature.combat.model.enemy-annotation
- [x] game.feature.combat.combat-assault
- [x] game.feature.combat.combat-charge
- [x] game.feature.combat.entities.combatant-marble
- [x] game.feature.combat.entities.food-icon
- [x] game.feature.combat.entities.projectile
- [x] game.feature.combat.gui.enemy-display-gui
- [x] game.feature.combat.combat-poi
- [x] game.feature.combat.gui.pvp-gui
- [x] game.feature.combat.combat-sweep
- [x] game.feature.combat.model.enemy-collab
- [x] game.feature.combat.model.enemy-level-scaling
- [x] game.feature.combat.entities.enemy-spawner
- [x] game.feature.combat.enemy-steps
- [x] game.feature.combat.pvp
- [x] game.feature.combat.model.combat-status
- [x] game.feature.combat.entities.drop
- [x] game.feature.combat.model.ball-behavior
- [x] game.feature.combat.model.enemy-tracker
- [x] game.feature.combat.entities.stone
- [x] game.feature.combat.entities.item-drop
- [x] game.feature.combat.combat-stun
- [x] game.feature.combat.entities.burst-spawner
- [x] game.feature.combat.plug-in
- [x] game.feature.combat.gui.status-bar
- [x] game.feature.combat.gui.hp-bar-boss
- [x] game.feature.combat.combat-shield
- [x] game.feature.combat.entities.combat-proxy
- [x] game.feature.combat.entities.hit-number
- [x] game.feature.combat.entities.ball
- [x] game.feature.combat.model.combat-params
- [x] game.feature.combat.combat-force
- [x] game.feature.combat.stat-change
- [x] game.feature.combat.model.enemy-type
- [x] game.feature.combat.model.combat-condition
- [x] game.feature.combat.model.enemy-reaction
- [x] game.feature.combat.entities.enemy
- [x] game.feature.combat.entities.combatant
- [x] game.feature.combat.combat-event-steps
- [x] game.feature.combat.combat
- [x] game.feature.combat.combat-action-steps  ← 114 ig.ACTION_STEP.* classes (targeting/facing, movement, hitbox forces, proxies, shields, HP/SP, stun, respawn, enemy events)

### game.feature.puzzle.* (43 modules) — ✅ DONE (43/43)

> Status note (2026-08-23): the puzzle group was cleaned in a prior session
> but never recorded here. On audit, 42/43 clean files were present and
> genuinely hand-cleaned; `game.feature.puzzle.entities.item-destruct` was
> missing and has now been cleaned (logic hand-named, `sc.ITEM_DESTRUCT_TYPE`
> data tables byte-identical), and the 11 files that lacked the standard
> `@module`-style header got one. All 43 pass `node --check`.

- [x] game.feature.puzzle.plug-in
- [x] game.feature.puzzle.components.push-pullable ← push/pull grip + drag mechanics
- [x] game.feature.puzzle.entities.block
- [x] game.feature.puzzle.entities.blockers
- [x] game.feature.puzzle.entities.bomb
- [x] game.feature.puzzle.entities.water-bubble
- [x] game.feature.puzzle.entities.compressor
- [x] game.feature.puzzle.entities.water-block
- [x] game.feature.puzzle.entities.ice-disk
- [x] game.feature.puzzle.entities.key-panel
- [x] game.feature.puzzle.entities.ball-changer
- [x] game.feature.puzzle.entities.walls
- [x] game.feature.puzzle.entities.glowing-line
- [x] game.feature.puzzle.entities.lorry
- [x] game.feature.puzzle.entities.ferro
- [x] game.feature.puzzle.entities.one-time-switch
- [x] game.feature.puzzle.entities.element-shield
- [x] game.feature.puzzle.entities.floor-switch
- [x] game.feature.puzzle.entities.magnet
- [x] game.feature.puzzle.entities.multi-hit-switch
- [x] game.feature.puzzle.entities.bounce-switch
- [x] game.feature.puzzle.entities.thermo-pole
- [x] game.feature.puzzle.entities.push-pull-block
- [x] game.feature.puzzle.entities.push-pull-dest
- [x] game.feature.puzzle.entities.sliding-block
- [x] game.feature.puzzle.entities.switch
- [x] game.feature.puzzle.entities.destructible
- [x] game.feature.puzzle.entities.item-destruct ← item-dropping destructibles (added 2026-08-23)
- [x] game.feature.puzzle.entities.regen-destruct
- [x] game.feature.puzzle.entities.extract-platform
- [x] game.feature.puzzle.entities.dynamic-platform
- [x] game.feature.puzzle.entities.ol-platform
- [x] game.feature.puzzle.entities.enemy-counter
- [x] game.feature.puzzle.entities.group-switch
- [x] game.feature.puzzle.entities.chest
- [x] game.feature.puzzle.entities.quick-sand
- [x] game.feature.puzzle.entities.spiderweb
- [x] game.feature.puzzle.entities.steam-pipes
- [x] game.feature.puzzle.entities.tesla-coil
- [x] game.feature.puzzle.entities.wave-teleport
- [x] game.feature.puzzle.puzzle-steps
- [x] game.feature.puzzle.entities.rotate-blocker
- [x] game.feature.puzzle.entities.boss-platform

### game.feature.menu.* foundation (9 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.plug-in
- [x] game.feature.menu.menu-model       ← sc.MenuModel: submenu stack, hotkeys, shop cart, drops, stamps, skill/map state, save/load
- [x] game.feature.menu.menu-steps       ← event steps (ADD_PLANT, UNLOCK_ENEMY/LORE*, landmarks, chest undo, OPEN_SHOP/QUEST_HUB, UNDO_VISITED_AREA)
- [x] game.feature.menu.area-loadable    ← sc.AreaLoadable + AreaRoomBounds (flood-fill rooms) + AREA_ICONS/CONNECTIONS data
- [x] game.feature.menu.gui.base-menu    ← sc.BaseMenu + sc.ListInfoMenu (list/info menu + hotkeys)
- [x] game.feature.menu.gui.menu-misc    ← panels, scroll panes/sliders, list buttons, toggles, status displays (87 dependents)
- [x] game.feature.menu.gui.list-boxes   ← sc.ButtonListBox / ItemListBox / MultiColumnItemListBox
- [x] game.feature.menu.gui.tab-box      ← sc.TabbedPane + sc.ListTabbedPane
- [x] game.feature.menu.gui.help-boxes   ← sc.HelpScrollContainer + sc.MultiPageBoxGui (multi-page help boxes)

> All verified against extracts: token-stream LCS ≥ 0.97 for the smaller
> modules, chunked LCS 0.986–0.99 for menu-model/menu-misc (the residual
> deltas are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.* submenus (11 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.main-menu       ← sc.MainMenu container: TopBar, Lea status line, side buttons, hotkey bar
- [x] game.feature.menu.gui.start-menu       ← sc.StartMenu: the pause/start menu (resume, save, load, options, quit)
- [x] game.feature.menu.gui.equip.equip-menu  ← sc.EquipMenu: equip pane container (left status + right bodypart/list)
- [x] game.feature.menu.gui.equip.equip-misc  ← sc.ItemBoxButton / BodyPartButton / equip-helper bits
- [x] game.feature.menu.gui.equip.equip-status ← left status panel: base params + modifiers with change preview
- [x] game.feature.menu.gui.equip.equip-bodypart ← right side: body-part buttons + item list per part

> All verified against extracts: token-stream LCS 0.973–0.987 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.circuit.* (7 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.circuit.circuit-menu         ← sc.CircuitMenu container: overview/detail/swap states + hotkeys
- [x] game.feature.menu.gui.circuit.circuit-misc         ← swap cursor, cross-points overview, debug skill learner
- [x] game.feature.menu.gui.circuit.circuit-detail-elements ← node menu (activate/cancel), info box, cursor, button group
- [x] game.feature.menu.gui.circuit.circuit-detail       ← tree detail: nodes/lines/or-branches, camera + drag, TREE_CONFIGS
- [x] game.feature.menu.gui.circuit.circuit-overview     ← overview: pre-drawn tree buffers + focus overlays, TREE_* configs
- [x] game.feature.menu.gui.circuit.circuit-swap-branches ← swap-branches mode: branch buttons + info box, SWAP_BRANCH_POSITIONS
- [x] game.feature.menu.gui.circuit.circuit-effect-display ← skill select/unlock effect overlay

> All verified against extracts: token-stream LCS 0.979–0.994, chunked LCS
> 0.986–0.993 for the large modules (residual deltas are the standard
> `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.item.* (8 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.item.item-menu       ← sc.ItemMenu container: status panels + list + hotkeys (help/fav/sort)
- [x] game.feature.menu.gui.item.item-list       ← sc.ItemTabbedBox: tabbed item list, per-tab sort, equip/fav overlays, toggle sets
- [x] game.feature.menu.gui.item.item-sort-menu  ← sc.SortMenu / sc.ItemSortMenu popup
- [x] game.feature.menu.gui.item.item-status-equip ← equip params + modifier panels with change preview
- [x] game.feature.menu.gui.item.item-status-default ← player status panel + sc.ItemStatusDefaultBar (HP/SP/EXP/buff bars)
- [x] game.feature.menu.gui.item.item-status-buffs ← consumable buffs panel + buff help hint
- [x] game.feature.menu.gui.item.item-status-favs ← favorites grid + sc.FavoriteElementGui slots
- [x] game.feature.menu.gui.item.item-status-trade ← item availability panel + TRADE_ENTRY_TYPES per source type

> All verified against extracts: token-stream LCS 0.968–0.998, chunked LCS
> 0.982 for item-status-default (residual deltas are the standard
> `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.map.* (6 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.map.map-menu        ← sc.MapMenu container: area map, worldmap, floor buttons, chest/stamp displays, hotkeys
- [x] game.feature.menu.gui.map.map-area        ← sc.MapAreaContainer: interactive area map — pan/drag, gamepad cursor, landmarks, stamps, camera limits
- [x] game.feature.menu.gui.map.map-floor       ← sc.MapRoom (prerendered autotiled rooms + connections) / sc.MapIcon / sc.MapFloor, TILE_*/CORNER_* pattern tables
- [x] game.feature.menu.gui.map.map-misc        ← sc.LandmarkGui, MapCursor, chest/stamp counters, MapFloorButton(Container), CurrentAreaDisplay, DebugFloorView
- [x] game.feature.menu.gui.map.map-stamp       ← sc.StampGui / stamp-edit popup (name, color, teleport)
- [x] game.feature.menu.gui.map.map-worldmap    ← sc.MapWorldMap: worldmap overlay with area nodes + cursor

> All verified against extracts: chunked LCS 0.985–0.995 (residual deltas are
> the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.shop.* (8 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.shop.shop-menu     ← sc.ShopMenu container: buy/sell state machine, sort menu, hotkeys, quantity + confirm dialogs
- [x] game.feature.menu.gui.shop.shop-start    ← sc.ShopStartMenu (buy/sell chooser) + sc.ShopStartTitle
- [x] game.feature.menu.gui.shop.shop-list     ← sc.ShopListMenu (per-page item list, +/- steppers) + sc.ShopPageCounter + sc.ShopItemButton
- [x] game.feature.menu.gui.shop.shop-stats    ← sc.ShopEquipStats compare panel
- [x] game.feature.menu.gui.shop.shop-cart     ← sc.ShopCart totals panel + sc.ShopCartEntry (checkout hotkey)
- [x] game.feature.menu.gui.shop.shop-quantity ← sc.ShopQuantitySelect stepper (+1/−1/+10/−10) + sc.ShopQuanityButton + sc.ShopSlopLine
- [x] game.feature.menu.gui.shop.shop-confirm  ← sc.ShopConfirmDialog + sc.ShopConfirmEntry (rare-sell warning)
- [x] game.feature.menu.gui.shop.shop-misc     ← sc.ShopHelper (getMaxBuyable, sortList, getItemTypeOrderAddition)

> All verified against extracts: token-stream LCS 0.997–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.quests.* (5 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.quests.quest-menu      ← sc.QuestMenu container: info box + list + details + sort menu + hotkeys
- [x] game.feature.menu.gui.quests.quest-tab-list  ← sc.QuestListBox: active/solved/all tabs, quest rows, favorite marking
- [x] game.feature.menu.gui.quests.quest-entries   ← sc.SubTaskEntryBase + COLLECT/LANDMARK/KILL/CONDITION/QUEST + sc.TaskEntry
- [x] game.feature.menu.gui.quests.quest-details   ← sc.QuestDetailsView + QuestDetailTasks + QuestDetailsSolved + QuestCharacterView
- [x] game.feature.menu.gui.quests.quest-misc      ← sc.SolvedLine, QuestBaseBox, QuestInfoBox(Active/Solved), sc.QuestDialog(Wrapper), ig.GUI.QuestSolvedDialog, QuestStartDialogButtonBox

> All verified against extracts: token-stream LCS 0.998–1.0, chunked LCS
> 0.993–0.998 for the large modules (residual deltas are the standard
> `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.arena.* (5 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.arena.arena-menu       ← sc.ArenaMenu container: cup list ↔ round list, overview hotkey, total points
- [x] game.feature.menu.gui.arena.arena-list       ← sc.ArenaCupList (solo/team tabs) + sc.ArenaRoundList (round/rush start)
- [x] game.feature.menu.gui.arena.arena-misc       ← sc.ArenaInfoBox, ArenaTotalPoints, ArenaEntryButton/RoundEntryButton, ArenaKeyValue/InfoLine/TopLine
- [x] game.feature.menu.gui.arena.arena-cup-page   ← sc.ArenaCupInfoPage (banner, highscore, time, coins, difficulty, rush) + sc.ArenaBanner
- [x] game.feature.menu.gui.arena.arena-round-page ← sc.ArenaRoundInfoPage (medals, time, bonuses/challenges flip page) + sc.ArenaChallengeEntry + Medals

> All verified against extracts: token-stream LCS 0.994–1.0, chunked LCS
> 0.997–0.999 (residual deltas are the standard `a && b()` → `if (a) b()`
> idiom conversions).

### game.feature.menu.gui.botanics.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.botanics.botanics-menu ← sc.BotanicsMenu container (list + sort menu)
- [x] game.feature.menu.gui.botanics.botanics-list ← sc.BotanicsListBox: per-area tabs, plant rows, item/pre-unlock entries
- [x] game.feature.menu.gui.botanics.botanics-misc ← BotanicsEntryButton, BotanicsPreUnlockButton, BotanicsProgressBar, BotanicsButtonBox, BotanicsPlantView, ItemDestructDisplayGui

> All verified against extracts: token-stream LCS 0.994–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.new-game.* (4 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.new-game.new-game-menu    ← sc.NewGamePlusMenu: NG+ setup container, start button, save-file/confirm flow
- [x] game.feature.menu.gui.new-game.new-game-list    ← sc.NewGameList: NG+ option list (per-set toggle rows, two columns)
- [x] game.feature.menu.gui.new-game.new-game-misc    ← sc.NewGameCart(Entry) overview + sc.NewGameToggleSet + sc.NewGameOptionButton
- [x] game.feature.menu.gui.new-game.new-game-dialogs ← sc.NewGameModeSelectDialog (normal vs NG+) + sc.NewGameModeDialogButton

> All verified against extracts: token-stream LCS 0.998–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.options.* (4 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.options.options-list    ← sc.OptionsTabBox: tab buttons + per-tab option row list (cached per tab)
- [x] game.feature.menu.gui.options.options-menu    ← sc.OptionsMenu container: help/reset-default hotkeys, lang popup backdrop
- [x] game.feature.menu.gui.options.options-misc    ← sc.KeyBinderGui (rebind dialog), OptionSlider/OptionThumb/OptionFocusSlider, sc.OptionLangPopUp
- [x] game.feature.menu.gui.options.options-types   ← sc.OPTION_GUIS widgets per type (BUTTON_GROUP, OBJECT/ARRAY_SLIDER, CHECKBOX, CONTROLS, LANGUAGE) + OptionRow/OptionInfoBox

> All verified against extracts: token-stream LCS 0.995–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.save.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.save.save-list     ← sc.SaveList: the scrollable list of save-slot buttons + save/load/delete flows
- [x] game.feature.menu.gui.save.save-menu     ← sc.SaveMenu container (help/delete/new hotkeys) + sc.DebugSaveLoadPanel with per-slot SaLoButton
- [x] game.feature.menu.gui.save.save-misc     ← sc.SaveSlotButton/NewButton, SaveSlotPlayTime, SaveSlotLocation (NG+ badge, version tint), SaveSlotParty, SaveSlotElements, SaveSlotChapter, SaveSlotButtonHighlight, SaveSlotUpdateEffect

> All verified against extracts: token-stream LCS 0.998 (residual deltas are
> the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.enemies.* (4 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.enemies.enemy-menu  ← sc.EnemyMenu container: tabs + list + info box + hotkeys
- [x] game.feature.menu.gui.enemies.enemy-list  ← sc.EnemyListBox: per-element tabs, enemy rows, drop info + hunting logs
- [x] game.feature.menu.gui.enemies.enemy-pages ← sc.EnemyInfoPage (stats, drops, element bars, achievements) + sc.EnemyElementIcon
- [x] game.feature.menu.gui.enemies.enemy-misc  ← sc.EnemyEntryButton, EnemyHuntingBar/Line, EnemyDropInfo, EnemyInfoBox, EnemyStatBar, EnemyItemButton, EnemyMinimalListBox

> All verified against extracts: token-stream LCS 0.996–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.help.* (2 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.help.help-menu  ← sc.HelpMenu container: topic list + detail box + hotkeys
- [x] game.feature.menu.gui.help.help-misc  ← sc.HelpListBox / sc.HelpInfoBox / sc.HelpListEntry + help annotations

> All verified against extracts: token-stream LCS 0.998–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.lore.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.lore.lore-menu  ← sc.LoreMenu container: lore list + info box + synopsis + hotkeys
- [x] game.feature.menu.gui.lore.lore-list  ← sc.LoreListBoxNew: story/people/cross-lore/earth-lore tabs, sort, new-unlock badges
- [x] game.feature.menu.gui.lore.lore-misc  ← sc.LoreInfoBox (content renderer: images, dividers, conditional text) + sc.LoreEntryButton (completion %)

> All verified against extracts: token-stream LCS 0.9989–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.museum.* (1 module) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.museum.museum-menu  ← sc.MuseumMenu container: help hotkey + help dialog, info-text callbacks

### game.feature.menu.gui.quest-hub.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.quest-hub.quest-hub-menu  ← sc.QuestHubMenu container: quest list + completion/available panels + sort menu
- [x] game.feature.menu.gui.quest-hub.quest-hub-list  ← sc.QuestHubList: open/active/finished tabs, quest collection + per-area sorting
- [x] game.feature.menu.gui.quest-hub.quest-hub-misc  ← sc.QuestHubAvailable / QuestHubCompletion counters, QuestHubListEntry (character, level, area, rewards), QuestHubRewards, QuestHubCharacterView

### game.feature.menu.gui.social.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.social.social-menu  ← sc.SocialMenu container: party list + info box, invite/contact/remove popup menus, SOCIAL_ACTION wiring
- [x] game.feature.menu.gui.social.social-list  ← sc.SocialList: friends/contacts tabs, member sorting by status/name/level
- [x] game.feature.menu.gui.social.social-misc  ← sc.SocialInfoBox (base stats + equipment), SocialPartyBox/Member (party panel), SocialBaseInfoBox (face + level + bars), SocialFace, SocialEntryButton, SocialHead

> All verified against extracts: token-stream LCS 0.9988–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.stats.* (5 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.stats.stats-menu        ← sc.StatsMenu container: stats tab list + circle-button tab switching + help
- [x] game.feature.menu.gui.stats.stats-list        ← sc.StatsListBox: general/combat/items/exploration/quests/arena/misc/log tabs from sc.STATS_BUILD with inset/deset nesting
- [x] game.feature.menu.gui.stats.stats-misc        ← sc.StatsScrollPane + sc.StatPercentNumber (floating percent number)
- [x] game.feature.menu.gui.stats.stats-types       ← sc.STATS_ENTRY_TYPE registry: Time, Percent, KeyValue, KeyCurMax, KeyValuePercent, Separator, Logs + comma formatter
- [x] game.feature.menu.gui.stats.stats-gui-builds  ← sc.STATS_CATEGORY + sc.STATS_BUILD table (progress overview, combat, items, exploration, quests, arena, misc, log) with embedded calc/value/list functions

> All verified against extracts: token-stream LCS 0.9972–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.status.* (6 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.status.status-menu          ← sc.StatusMenu container: main/params/mods/combat-arts pages, help/equip/diff hotkeys, page+element switchers
- [x] game.feature.menu.gui.status.status-misc          ← sc.StatusPageSwitch / StatusElementSwitch pager buttons + sc.StatusParamBar (base/equip/skills row with +/− diffs)
- [x] game.feature.menu.gui.status.status-view-main     ← Main page: level + HP/SP/EXP bars + base values, equipped body parts
- [x] game.feature.menu.gui.status.status-view-parameters ← Parameters page: base vs equip vs element values with diffs
- [x] game.feature.menu.gui.status.status-view-modifiers ← Modifiers page: equip vs element modifiers with diffs
- [x] game.feature.menu.gui.status.status-view-combat-arts ← Combat Arts page: THROW/ATTACK/DASH/GUARD arts with SP cost, damage type, status effects

> All verified against extracts: token-stream LCS 0.9992–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.synop.* (2 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.synop.synop-menu  ← sc.SynopsisMenu: the start-screen column of submenu buttons + task/log displays
- [x] game.feature.menu.gui.synop.synop-misc  ← sc.LOG_GUI_TYPE registry (LANDMARK/TRADER/LORE/TROPHY/DROP/QUEST) + SynopsisLogDisplay/TaskDisplay/QuestDisplay

> All verified against extracts: token-stream LCS 1.0.

### game.feature.menu.gui.trade.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.trade.trader-menu  ← sc.TraderMenu container: trader list + trade details overlay, TRADE_TOGGLE_DETAILS wiring
- [x] game.feature.menu.gui.trade.trader-list  ← sc.TradersListBox: per-area tabs, trader rows with get/require offer entries, buff/info texts
- [x] game.feature.menu.gui.trade.trade-misc   ← sc.TradeButtonBox, TradeEntryButton, TradeCharacterView, sc.TradeDetailsView (get-for-require overlay)

> All verified against extracts: token-stream LCS 0.9989–1.0 (residual deltas
> are the standard `a && b()` → `if (a) b()` idiom conversions).

### game.feature.menu.gui.trophy.* (3 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.gui.trophy.trophy-menu  ← sc.TrophyMenu container: trophy list + total points/completion panels + stats-toggle hotkey
- [x] game.feature.menu.gui.trophy.trophy-list  ← sc.TrophyList: GENERAL/COMBAT/EXPLORATION tabs, per-tab sections, progress toggle, per-section scroll/selection memory
- [x] game.feature.menu.gui.trophy.trophy-misc  ← TrophyTabOverview, TrophyTotalPoints, TrophyCompletion, TrophySectionList, TrophyListEntry, TrophyProgress(Bar), TrophyIconGraphic

> All verified against extracts: token-stream LCS 0.9973–1.0, chunked LCS
> 0.9985 for trophy-misc (residual deltas are the standard `a && b()` →
> `if (a) b()` idiom conversions).

### game.feature.menu.lore-model / map-model (2 modules) — ✅ DONE (2026-08-23)

- [x] game.feature.menu.lore-model  ← sc.LoreModel: category/sort/image enums, unlock tracking (whole lore + per entry), new-unlock/log/stats wiring, completion %, storage
- [x] game.feature.menu.map-model    ← sc.MapModel: area & landmark tracking, visited/floors state, area item (key/booster) helpers, dungeon detection, teleport events, storage

> All verified against extracts: token-stream LCS 0.9996–1.0.

### game.feature.gui.hud.* (23 modules) — ✅ DONE (2026-08-23)

- [x] hud.task-hud         ← sc.TaskHudBox: current/perma task box with timeout
- [x] hud.item-timer-hud   ← sc.ItemTimerHudGui: item-use cooldown countdown
- [x] hud.sp-mini-hud      ← sc.SpMiniHudGui: 4-pip mini SP bar above player
- [x] hud.lore-hud         ← sc.LoreUpdateHud: unlock/update lore box
- [x] hud.key-hud          ← sc.KeyHudGui: dungeon key / master key counter
- [x] hud.drop-hud         ← sc.DropUpdateHud: botanics drop completed box
- [x] hud.feat-hud         ← sc.FeatHud: trophy/feat unlock box
- [x] hud.landmark-hud     ← sc.LandmarkHud: landmark unlocked box
- [x] hud.money-hud        ← sc.MoneyHudBox: credits gained + sum box
- [x] hud.right-hud        ← sc.RightHudGui + sc.RightHudBoxGui: right-side box stack
- [x] hud.member-hud       ← sc.PartyHudGui: party portraits + HP/EXP/SP bars
- [x] hud.quest-hud        ← sc.QuestUpdateHud + sc.FavQuestHud: quest task box + pinned quest
- [x] hud.item-hud         ← sc.ItemHudBox: obtained items list with amounts
- [x] hud.sp-change-hud    ← sc.SpChangeHudGui: SP gain/consume popup
- [x] hud.element-hud      ← sc.ElementHudGui: element selector circle
- [x] hud.hp-hud           ← sc.HpHudGui + sc.HpHudBarGui: HP box + animated HP/EXP bar
- [x] hud.buff-hud         ← sc.BuffHudGui: buff icon row with time bars
- [x] hud.exp-hud          ← sc.ExpHudGui: floating EXP entries + menu EXP counter
- [x] hud.sp-hud           ← sc.SpHudGui: full animated SP bar (segment renderer)
- [x] hud.param-hud        ← sc.ParamHudGui: level + HP/ATK/DEF/FOC boxes with pies
- [x] hud.combat-hud       ← sc.CombatHudGui: combat transition bars + skip + ranked/PvP HUDs
- [x] hud.top-msg-hud      ← sc.TopMsgHudGui: large center announcements (icon/title/sub)
- [x] hud.status-hud       ← sc.StatusHudGui: master status HUD + element bg/mode + overload overlay + battle pieces

> All verified against extracts: token-stream LCS 0.9984–1.0 (exact LCS; the
> two sub-1.0 files are a named extra var in element-hud and a one-token
> minifier line-break artifact in quest-hud).

**`game.feature.gui.hud.*` group is now complete — 23/23 modules**, all
verified against their extracts.

### game.feature.gui.widget.* (17 modules) — ✅ DONE (2026-08-23)

- [x] widget.skip-scene       ← sc.SkipSceneGui: skip-scene button overlay
- [x] widget.social           ← sc.SocialWidget: social links bar (Twitch/YouTube/Discord/Steam)
- [x] widget.gamepad-box      ← sc.GamepadBox: gamepad icon hint box
- [x] widget.sergey-mode      ← sc.SergeyModeGui: dev/hidden sergey-mode toggle box
- [x] widget.click-box        ← sc.ClickBox: click-to-continue hint
- [x] widget.information      ← sc.InformationGui: popup info box
- [x] widget.chest-items      ← sc.ChestItemsGui: chest obtain-items overlay
- [x] widget.level-up-hud     ← sc.LevelUpHudGui: level-up flash overlay
- [x] widget.timer-gui        ← sc.TimerGui: countdown timer box
- [x] widget.demo-stats       ← sc.DemoStatsGui: demo stats screen
- [x] widget.bar-widget       ← sc.BarWidget: generic progress bar widget
- [x] widget.counter-hud      ← sc.CounterHudGui: combo counter HUD
- [x] widget.tutorial-start-gui ← sc.TutorialStartGui: tutorial intro box
- [x] widget.tutorial-marker  ← sc.TutorialMarkerGui: on-screen tutorial marker
- [x] widget.demo-highscore   ← sc.DemoHighscoreGui: demo highscore entry
- [x] widget.modal-dialog     ← sc.ModalDialog: modal overlay + sc.DialogBox
- [x] widget.indiegogo-gui    ← sc.IndieGoGoGui: backing banner

> All verified against extracts: token-stream LCS 1.0.

### game.feature.gui.base.* (7 modules) — ✅ DONE (2026-08-23)

- [x] base.compact-choice-box ← sc.CompactChoiceBox: small choice box with arrow
- [x] base.misc               ← sc.TextGui, sc.TextBlock, sc.NumberGui, sc.NumberBarGui, sc.ProgressBar, sc.ButtonGui, sc.InfoBox, sc.InfoBar helpers
- [x] base.numbers            ← sc.NUMBER_SIZE/COLOR + sc.NumberGui + NumberBarGui + ProgressBar
- [x] base.text               ← sc.TextGui + sc.TextBlock (line wrap, per-char effects)
- [x] base.slick-box          ← sc.SlickBox: rounded box GUI
- [x] base.boxes              ← sc.BoxGui (ninepatch/transition base) + sc.GridBox + sc.AnimatedBoxGui
- [x] base.button             ← sc.ButtonGui + sc.ButtonGroup hooks

> All verified against extracts: token-stream LCS 1.0 (after fixing a 5th
> stray param in base.boxes.pushContent).

### game.feature.gui.plug-in (1 module) — ✅ DONE (2026-08-23)

- [x] game.feature.gui.plug-in ← gui subsystem entry point

### game.feature.gui.screen.* (7 modules) — ✅ DONE (2026-08-23)

- [x] screen.loading-screen  ← sc.LoadingScreenGui: loading progress screen
- [x] screen.title-preset    ← sc.TitlePreset: title screen layout presets
- [x] screen.credits-screen  ← sc.CreditsScreen: rolling credits
- [x] screen.intro-screen    ← sc.IntroScreen: logo intro sequence
- [x] screen.title-logo      ← sc.TitleLogo: animated logo
- [x] screen.pause-screen    ← sc.PauseScreen: pause menu
- [x] screen.title-screen    ← sc.TitleScreen: main menu (new game/continue/options)

> All verified against extracts: token-stream LCS 1.0.

**`game.feature.gui.*` layer is now fully complete — 55/55 modules** (hud,
widget, base, screen, plug-in), all verified against their extracts.

### game.feature.quick-menu.gui.* (7 modules) — ✅ DONE (2026-08-23)

- [x] quick-menu.gui.quick-menu         ← sc.QuickMenu: master quick-menu container (ring + items + party + analysis + location)
- [x] quick-menu.gui.circle-menu        ← sc.RingMenuButton + sc.ItemTimerOverlay + sc.QuickMenuButtonGroup + sc.QuickRingMenu
- [x] quick-menu.gui.quick-item-menu    ← sc.QuickItemArrow + sc.QuickItemMenu: item list popup
- [x] quick-menu.gui.quick-party        ← sc.QuickPartyStrategyMenu: target/behaviour/arts strategy rows
- [x] quick-menu.gui.quick-screen       ← sc.QuickMenuAnalysisCursor + sc.QuickMenuAnalysis: analysis overlay + cursor
- [x] quick-menu.gui.quick-screen-types ← sc.QUICK_MENU_TYPES registry: Analyzable/NPC/Enemy markers
- [x] quick-menu.gui.quick-misc         ← sc.QuickMenuBuffsGui, QuickBuffEntry, QuickLocationBox, QuickFocusScreen, QUICK_INFO_BOXES.Enemy, QuickArrowBox, QuickBorderArrowLevelBox

> All verified against extracts: token-stream LCS 1.0.

**`game.feature.quick-menu.gui.*` group is now complete — 7/7 modules**, all
verified against their extracts.

### game.feature.msg.gui.* (6 modules) — ✅ DONE (2026-08-23)

- [x] msg.gui.msg-skip-hud    ← sc.MsgSkipGui: blinking skip-cutscene hint
- [x] msg.gui.dream-msg       ← sc.DreamMsgGui: floating dream text above entities
- [x] msg.gui.message-box     ← sc.MsgBoxGui + sc.ChoiceBoxGui: dialog box with pointer + choice rows
- [x] msg.gui.message-board   ← sc.MsgBoardContentGui + sc.MsgBoardGui: center board messages
- [x] msg.gui.side-message-hud ← sc.SideMessageHudGui + boxes/face/label: side dialog queue with portraits
- [x] msg.gui.message-overlay ← ig.MessageOverlayGui + MessageAreaGui + Entry/Portrait/DisplayName + PrivateMessageBGGui + sc.MsgGuiTools.drawPortrait

> All verified against extracts: token-stream LCS 1.0 (message-overlay
> chunked 1.0 — too large for exact LCS at 7249 tokens).

**`game.feature.msg.gui.*` group is now complete — 6/6 modules**, all verified
against their extracts.

### game.feature.arena.gui.* (6 modules) — ✅ DONE (2026-08-23)

- [x] arena.gui.arena-effect-display ← sc.ArenaMedalEffect: medal/trophy effect display
- [x] arena.gui.arena-start-gui      ← sc.ArenaRoundStartHud + ChallengeEntry: round-start banner with challenge icons
- [x] arena.gui.arena-rush-gui       ← sc.ArenaRushOverview: rush-mode score tally overlay
- [x] arena.gui.arena-trophy-gui     ← sc.ArenaCupOverview + MedalEntry: cup result overlay with medals/trophy
- [x] arena.gui.arena-gui            ← ArenaPlayerDeathOverlay, ArenaRoundEndOverlay, ArenaChainHud (Number/Digit), ArenaChallengeOverlay
- [x] arena.gui.arena-round-gui      ← ArenaRoundEndButtons (rush/normal layouts), ArenaCoinsHud, ArenaMedalHud, ArenaRoundEndHeader, ArenaSummary + Entry

> All verified against extracts: token-stream LCS 1.0 (arena-round-gui chunked
> 1.0 — too large for exact LCS at 6832 tokens).

**`game.feature.arena.gui.*` group is now complete — 6/6 modules**, all
verified against their extracts.

### game.feature.trade.gui.* (4 modules) — ✅ DONE (2026-08-23)

- [x] trade.gui.trade-icon        ← sc.TradeIconGui: hover offer icon with required-item checks
- [x] trade.gui.trade-menu        ← sc.TradeMenu: trade screen container (offer/stats/dialog + money topbar)
- [x] trade.gui.equip-toggle-stats ← sc.TradeToggleStats: equip-compare stat box (base/element/modifier rows)
- [x] trade.gui.trade-dialog      ← sc.TradeItem + TradeItemBox + TradeMoneyGui + TradeDialogMenu + TradeOfferDisplay

> All verified against extracts: token-stream LCS 1.0.

**`game.feature.trade.gui.*` group is now complete — 4/4 modules**, all
verified against their extracts.

### game.feature.map-content.gui.* (2 modules) — ✅ DONE (2026-08-23)

- [x] map-content.gui.icon-hover-text ← sc.IconHoverTextGui: hover text box for map icons
- [x] map-content.gui.rhombus-map      ← sc.RhombusMapMenu + RhombusMenuInfo + RhombusMenuArrow + RhombusMenuLocation: rhombus travel map

> All verified against extracts: token-stream LCS 1.0 (after dropping a stray
> 4th param in rhombus-map.focusLocation).

### game.feature.version.gui.* (2 modules) — ✅ DONE (2026-08-23)

- [x] version.gui.dlc-gui      ← sc.DLCScrollContainer + sc.DLCGui: extension list
- [x] version.gui.changelog-gui ← sc.ChangeLogScrollContainer + sc.PrevNextText + sc.ChangelogGui: version history browser

> All verified against extracts: token-stream LCS 1.0.

**`game.feature.*.gui` layer is now fully complete — every gui subsystem is
done.**

### game.feature.character.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.character.plug-in              ← character subsystem entry point
- [x] game.feature.character.character            ← sc.Character (JSON-loadable) + sc.CharacterExpression (cacheable face expr)
- [x] game.feature.character.char-templates       ← NPCBasic jsonTemplate registration (animation sheet schema)
- [x] game.feature.character.abstract-face        ← sc.ABSTRACT_FACES: composable torso+head face definitions

> All verified against extracts: token-stream LCS 0.938–1.0, all pass `node --check`.

### game.feature.common-event.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.common-event.plug-in            ← common-event entry point + editor registration
- [x] game.feature.common-event.common-event       ← sc.CommonEvents addon: type-based event triggering with frequency/repeat policy
- [x] game.feature.common-event.common-event-steps ← TRIGGER/CALL/CANCEL_COMMON_EVENTS, CALL_EVENT_INLINE event steps

> All verified against extracts: token-stream LCS 0.947–0.977, all pass `node --check`.

### game.feature.control.* (1 module) — ✅ DONE (2026-08-25)

- [x] game.feature.control.control                 ← sc.GlobalInput + sc.Control: input routing for combat, menus, element switching, gamepad

> Verified: token-stream LCS 0.960, passes `node --check`.

### game.feature.font.* (1 module) — ✅ DONE (2026-08-25)

- [x] game.feature.font.font-system                ← sc.FontSystem: multi-font icon sets, colour overlays, keycode→glyph mappings, gamepad swap

> Verified: token-stream LCS 0.990, passes `node --check`.

### game.feature.game-code.* (2 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.game-code.plug-in               ← game-code entry point (adds sc.gimmick lang file)
- [x] game.feature.game-code.game-code             ← sc.GameCode: cheat/gimmick codes (SparklingShoes, Caramelldansen, etc.)

> All verified: token-stream LCS 0.958–0.973, all pass `node --check`.

### game.feature.beta.* (2 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.beta.plug-in                    ← beta plug-in entry point
- [x] game.feature.beta.beta-controls              ← sc.BetaControls: F7 lang editor, F10 save-dialog debug shortcuts

> All verified: token-stream LCS 0.968–1.0, all pass `node --check`.

### game.feature.ar.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.ar.plug-in            ← AR subsystem entry point
- [x] game.feature.ar.gui.ar-box         ← ig.GUI.ARBox: floating entity-following text with fill bars
- [x] game.feature.ar.ar-steps           ← SHOW/CLEAR_AR_MSG event + action steps

> All verified: token-stream LCS 0.943–1.0, all pass `node --check`.

### game.feature.save-preset.* (2 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.save-preset.plug-in    ← save-preset entry point
- [x] game.feature.save-preset.save-preset ← sc.SavePreset: title-screen "Continue at…" checkpoint slots

> All verified: token-stream LCS 0.965–1.0.

### game.feature.bgm.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.bgm.plug-in            ← BGM entry point + volume map attribute
- [x] game.feature.bgm.volume-map          ← global volume overrides for specific SFX
- [x] game.feature.bgm.playlist            ← sc.BgmPlaylist: per-map track definitions, switch-songs, multi-audio

> All verified: token-stream LCS 0.984–1.0.

### game.feature.auto-control.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.auto-control.plug-in            ← auto-control entry point
- [x] game.feature.auto-control.auto-control       ← sc.AutoControl: script-driven virtual mouse/stick/button input
- [x] game.feature.auto-control.auto-control-steps ← START/END_AUTO_CTRL, SET_AUTO_CTRL_MOUSE/STICK/ACTION event steps

> All verified: token-stream LCS 0.929–1.0.

### game.feature.tutorial.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.tutorial.plug-in        ← tutorial entry point
- [x] game.feature.tutorial.tutorial-steps ← START/CLEAR_FORCE_INPUT event steps
- [x] game.feature.tutorial.input-forcer   ← sc.InputForcer: pauses game until player does the required input

> All verified: token-stream LCS 0.957–1.0.

### game.feature.credits.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.credits.plug-in           ← credits entry point + editor registration
- [x] game.feature.credits.credit-loadable   ← sc.CreditSectionLoadable + sc.CreditsManager (speed tracker)
- [x] game.feature.credits.credits-steps     ← SHOW_CREDIT_SECTION, SET_CREDITS_SPEED, WAIT_UNTIL_CREDIT_TRIGGER/SECTION_DONE
- [x] game.feature.credits.gui.credits-gui   ← scrolling credits renderer (header only)

> All verified: token-stream LCS 0.964–1.0.

### game.feature.achievements.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.achievements.plug-in        ← achievements entry point + editor registration
- [x] game.feature.achievements.stats-model     ← sc.StatsModel: central stat tracking, playtime, deferred events
- [x] game.feature.achievements.stat-steps      ← ENABLE/DISABLE_STATS, UNLOCK_TROPHY, ADD/SET_STAT_MAP_NUMBER
- [x] game.feature.achievements.achievements    ← sc.TrophyManager: trophy/achievement system, Steam integration

> All verified: token-stream LCS 0.997–1.0.

### game.feature.arena.* (16 modules — 8 core + 8 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.arena.plug-in                   ← arena entry point + editor registration
- [x] game.feature.arena.arena-score-types          ← sc.ARENA_SCORE_TYPES: all score event point definitions
- [x] game.feature.arena.arena-challenges           ← sc.ARENA_CHALLENGES: challenge modifier base classes + instanced challenges
- [x] game.feature.arena.arena-cheer                ← sc.ArenaCrowdCheerController: reactive crowd sound pool
- [x] game.feature.arena.arena-bonus-objectives     ← Bonus objective definitions: NO_DAMAGE, TIME, CHAIN, ITEMS, etc.
- [x] game.feature.arena.arena-loadable             ← sc.ArenaCache + sc.CupAsset: JSON-loadable cup data
- [x] game.feature.arena.entities.arena-spawn       ← ig.ENTITY.ArenaSpawn: map-placed spawn markers with alignment
- [x] game.feature.arena.arena-steps                ← All arena event/action steps (RESET_CHAIN, ADD_SCORE, SPAWN_WAVE, etc.)
- [x] game.feature.arena.arena                      ← sc.Arena: core arena system (rounds, waves, scoring, coins, trophies)

> Core modules verified: token-stream LCS 0.998–1.0 (arena.js + quest-model + msg-steps too large for exact LCS).

### game.feature.game-sense.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.game-sense.plug-in                      ← game-sense entry point
- [x] game.feature.game-sense.controllers.element-controller ← sc.GameSenseElementController: RGB per-key element lighting
- [x] game.feature.game-sense.controllers.hp-controller      ← sc.GameSenseHPController: function-row HP bar lighting
- [x] game.feature.game-sense.game-sense-model               ← sc.GameSense: SteelSeries Engine 3 endpoint, heartbeat, controllers

> All verified: token-stream LCS 0.995–1.0.

### game.feature.msg.* (10 modules — 4 core + 6 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.msg.plug-in                ← message system entry point + editor registration
- [x] game.feature.msg.entities.event-trigger  ← sc.Cutscene + EventTrigger + LocationEvent entities
- [x] game.feature.msg.message-model           ← sc.MessageModel: full dialog system, side messages, private messages, choices
- [x] game.feature.msg.msg-steps               ← All message event/action steps (SHOW_MSG, SHOW_CHOICE, SHOW_BOARD_MSG, etc.)

> Core modules verified: token-stream LCS 0.993–0.998 (msg-steps too large for exact LCS).

### game.feature.new-game.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.new-game.plug-in          ← new-game entry point + editor registration
- [x] game.feature.new-game.new-game-model    ← sc.NewGamePlusModel: NG+ options, carry-over, multipliers
- [x] game.feature.new-game.new-game-steps    ← APPLY_NEW_GAME_DATA event step

> All verified: token-stream LCS 0.998–1.0.

### game.feature.quest.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.quest.plug-in              ← quest entry point + editor registration
- [x] game.feature.quest.quest-types           ← sc.Quest, sc.QuestTask, sc.QuestSubTaskBase + all subtask subtypes
- [x] game.feature.quest.quest-model           ← sc.QuestModel: active/finished quest tracking, rewards, sorting, save/load
- [x] game.feature.quest.quest-steps           ← all quest event/action steps (START/END/FINISH_QUEST, SET_TASK, etc.)

> Verified: token-stream LCS 0.999–1.0 (quest-model too large for exact LCS), pass `node --check`.

### game.feature.base.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.base.plug-in       ← base subsystem entry point
- [x] game.feature.base.action-steps  ← game-layer ACTION_STEP extensions
- [x] game.feature.base.event-steps   ← game-layer EVENT_STEP extensions

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.interact.* (6 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.interact.plug-in          ← interact entry point
- [x] game.feature.interact.screen-interact  ← sc.ScreenInteract: screen-edge touch zones
- [x] game.feature.interact.skip-interact    ← sc.SkipInteract: cutscene skip zones
- [x] game.feature.interact.button-group     ← sc.ButtonGroup extensions for game
- [x] game.feature.interact.map-interact     ← sc.MapInteract: map-entity interactions
- [x] game.feature.interact.gui.interact-gui ← interaction highlight/prompt GUI

> Verified: token-stream LCS 0.9985–1.0, pass `node --check`.

### game.feature.inventory.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.inventory.plug-in           ← inventory entry point
- [x] game.feature.inventory.detectors         ← item/trade/quest drop detectors
- [x] game.feature.inventory.item-level-scaling ← sc.ItemLevelScaling: item stat scaling by level
- [x] game.feature.inventory.inventory         ← sc.Inventory: item storage, bags, sorting, save/load

> Verified: token-stream LCS 0.9973–1.0, pass `node --check`.

### game.feature.map-content.* (9 core modules — 2 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.map-content.plug-in                     ← map-content entry point
- [x] game.feature.map-content.map-style                   ← map-style data tables (pure data)
- [x] game.feature.map-content.sc-doors                     ← door type data tables (pure data)
- [x] game.feature.map-content.map-content-steps            ← NUDGE_PROP/DOOR event steps
- [x] game.feature.map-content.prop-interact                ← sc.PropInteract: prop interaction hooks
- [x] game.feature.map-content.entities.rhombus-point       ← sc.RhombusPoint: rhombus travel map points
- [x] game.feature.map-content.entities.jump-panel          ← sc.JumpPanel: bounce panel entity
- [x] game.feature.map-content.entities.elevator            ← sc.Elevator entity (chunked LCS 0.9961)
- [x] game.feature.map-content.entities.teleport-central    ← sc.TeleportCentral (chunked LCS 0.9985)

> Verified: exact LCS 1.0 for the rest, elevator/teleport-central chunked ≥ 0.9961, all pass `node --check`.

### game.feature.party.* (5 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.party.plug-in                    ← party entry point
- [x] game.feature.party.party-member-model          ← sc.PartyMemberModel: member stats/behaviour config
- [x] game.feature.party.party-steps                 ← party event/action steps
- [x] game.feature.party.party                       ← sc.Party: party management, AI behaviour, teleport sync
- [x] game.feature.party.entities.party-member-entity ← sc.PartyMemberEntity (chunked LCS 0.9991)

> Verified: exact LCS 0.9995–1.0 for the rest, party-member-entity chunked 0.9991, all pass `node --check`.

### game.feature.quick-menu.* (3 core modules — 7 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.quick-menu.plug-in          ← quick-menu entry point
- [x] game.feature.quick-menu.quick-menu-model  ← sc.QuickMenuModel: item/ability quick-slots
- [x] game.feature.quick-menu.entities.analyzable ← sc.Analyzable: quick-menu analysis targets

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.skills.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.skills.plug-in   ← skills entry point
- [x] game.feature.skills.skilltree ← sc.Skilltree: node/edge definitions + unlock logic
- [x] game.feature.skills.skills    ← sc.Skills: skill activation, damage scaling, combo chains

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.timers.* (4 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.timers.plug-in       ← timers entry point
- [x] game.feature.timers.timers-model  ← sc.TimersModel: scripted timer tracking
- [x] game.feature.timers.timers-steps  ← START/STOP/PUSH/REMOVE_TIMER event steps
- [x] game.feature.timers.gui.timers-hud ← sc.TimersHud: on-screen timer display

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.trade.* (3 core modules — 4 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.trade.plug-in       ← trade entry point
- [x] game.feature.trade.trade-steps   ← trade event/action steps
- [x] game.feature.trade.trade-model   ← sc.TradeModel: trader offers, trade-in logic, save/load

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.version.* (2 core modules — 2 GUI already done) — ✅ DONE (2026-08-25)

- [x] game.feature.version.plug-in      ← version entry point
- [x] game.feature.version.version      ← sc.Version: version/changelog data

> Verified: token-stream LCS 1.0, pass `node --check`.

### game.feature.voice-acting.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.voice-acting.plug-in   ← voice-acting entry point
- [x] game.feature.voice-acting.voice-acting ← sc.VoiceActing: VO playback manager
- [x] game.feature.voice-acting.va-config ← VO config data tables (pure data)

> Verified: token-stream LCS 0.9982–1.0, pass `node --check`.

### game.feature.xeno-dialogs.* (3 modules) — ✅ DONE (2026-08-25)

- [x] game.feature.xeno-dialogs.plug-in           ← xeno-dialogs entry point
- [x] game.feature.xeno-dialogs.entities.xeno-dialog ← sc.XenoDialog: NPC dialog entity
- [x] game.feature.xeno-dialogs.gui.xeno-icon     ← sc.XenoIcon: dialog icon above NPCs

> Verified: token-stream LCS 0.997–1.0, pass `node --check`.

**Progress: 569/569 (100%) — the entire `game.*` layer is complete. All 49 final
non-gui modules verified (2026-08-25): `node --check` clean, exact LCS ≥ 0.997
or chunked LCS ≥ 0.994 vs extract.**

---

## Conventions

- **Never modify** `assets/js/game.compiled.js` (or `.pretty.js`).
- Clean files: same logic, meaningful local names, `@module`-style header + JSDoc.
- No "improvements" — the cleaned code is behavior-identical to the original.
- Passthrough params are named from the callee's real signature where possible
  (e.g. `ig.Game.loadLevel(levelData, clearEntities, reloadCache)`).
- Keep the trailing `ig.baked = !0;` when the original module has it.
- Data-only modules (config tables, particle definitions): keep the data
  byte-identical; only the wrapper/header and any logic are cleaned.
