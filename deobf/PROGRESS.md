# Deobfuscation Progress

Tracked per module. Cleaned files live in `deobf/clean/`; raw extractions in
`deobf/extract/`.

**Total modules: 569** (`impact.*` 154, `game.*` 415).

> Status note (2026-08-21): the `impact.feature.*` groups below were cleaned by
> Claude (2026-08-20) and restored/verified after a botched undo pass. The
> `game.*` layer is in progress (top-level, model, player groups done). **Do not**
> run bulk "copy extract → clean" scripts — the only real deliverable is
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

## game.* (415 modules) — 70/415

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

Next: `puzzle`, then `menu`.

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
