/**
 * game.main
 * =========
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.main")`.
 *
 * The CrossCode game entry point. Defines `sc.CrossCode` (the main `ig.Game`
 * subclass): input binding, HUD/GUI construction, teleport transitions,
 * save/load flows, respawn handling and the startup routine (`startCrossCode`).
 */
ig.module("game.main")
    .requires("impact.base.game", "game.config", "game.features", "game.beta")
    .defines(function () {

    sc.EmptyLoader = ig.Loader.extend({
        draw: function () {}
    });

    sc.START_MODE = {
        STORY: 0,
        GRINDING: 1,
        PUZZLE: 2,
        NEW_GAME_PLUS: 3
    };

    sc.CrossCode = ig.Game.extend({
        mapLoader: sc.EmptyLoader,
        gravity: 800,
        shadowImage: new ig.Image("media/entity/shadow.png"),
        transitionTimer: 0,
        currentTeleportColor: {
            r: 0,
            g: 0,
            b: 0
        },
        teleportColor: {
            r: 0,
            g: 0,
            b: 0,
            lighter: false,
            timeIn: 0.3,
            timeOut: 0.3
        },
        effects: {
            dust: new ig.EffectSheet("dust"),
            teleport: new ig.EffectSheet("teleport"),
            npc: new ig.EffectSheet("npc"),
            death: new ig.EffectSheet("combatant"),
            speedlines: new ig.EffectSheet("speedlines"),
            drops: new ig.EffectSheet("drops")
        },
        sounds: {
            popup: new ig.Sound("media/sound/hud/popup.ogg", 0.8)
        },
        _slotToLoad: 0,
        _startMode: sc.START_MODE.STORY,
        _teleportMessages: [],

        /** Bind input, build the GUI stack, wire up storage/physics callbacks. */
        init: function () {
            this.parent();
            sc.version.hasVersionChanged() && sc.version.saveCurrentVersion();
            sc.options.keyBinder.initBindings();
            ig.input.bind(ig.KEY.MOUSE1, "aim");
            ig.input.bind(ig.KEY.MOUSE2, "dash");
            ig.input.bind(ig.KEY.MWHEEL_UP, "scrollUp");
            ig.input.bind(ig.KEY.MWHEEL_DOWN, "scrollDown");
            ig.input.bind(ig.KEY.F8, "snapshot");
            ig.input.bind(ig.KEY.F7, "langedit");
            ig.input.bind(ig.KEY.F10, "savedialog");
            ig.platform == ig.PLATFORM_TYPES.DESKTOP && ig.input.bind(ig.KEY.F11, "fullscreen");
            window.IG_GAME_DEBUG && ig.JSON_LOG && ig.game.printGameAddonsString();
            ig.gui.addGuiElement(new sc.MasterOverlayGui);
            ig.gui.addGuiElement(new sc.TitleScreenGui);
            ig.gui.addGuiElement(new sc.LoadingScreenGui);
            ig.gui.addGuiElement(new ig.MessageOverlayGui);
            sc.gui = {};
            sc.gui.statusHud = new sc.StatusHudGui;
            ig.gui.addGuiElement(sc.gui.statusHud);
            ig.gui.addGuiElement(new sc.CombatHudGui);
            ig.gui.addGuiElement(new sc.ElementalLoadOverlayGui);
            ig.gui.addGuiElement(new sc.ElementHudGui);
            ig.gui.addGuiElement(new sc.SpChangeHudGui);
            ig.gui.addGuiElement(new sc.SideMessageHudGui);
            ig.gui.addGuiElement(new sc.MainMenu);
            ig.gui.addGuiElement(new sc.QuickMenu);
            ig.gui.addGuiElement(new sc.PauseScreenGui);
            window.testGui = new sc.TopMsgHudGui;
            ig.gui.addGuiElement(window.testGui);
            sc.gui.rightHudPanel = new sc.RightHudGui;
            sc.gui.taskHud = new sc.TaskHudBox;
            sc.gui.moneyHud = new sc.MoneyHudBox;
            sc.gui.itemHud = new sc.ItemHudBox;
            sc.gui.featHud = new sc.FeatHud;
            sc.gui.questHud = new sc.FavQuestHud;
            sc.gui.questTaskHud = new sc.QuestUpdateHud;
            sc.gui.landmarkHud = new sc.LandmarkHud;
            sc.gui.loreHud = new sc.LoreUpdateHud;
            sc.gui.dropHud = new sc.DropUpdateHud;
            sc.gui.rightHudPanel.addHudBox(sc.gui.taskHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.questHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.questTaskHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.landmarkHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.loreHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.dropHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.featHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.moneyHud);
            sc.gui.rightHudPanel.addHudBox(sc.gui.itemHud);
            ig.gui.addGuiElement(sc.gui.rightHudPanel);
            ig.overlay.setColor(0, 0, 0, 1, 0);
            sc.gamesense.addController(new sc.GameSenseHPController);
            sc.gamesense.addController(new sc.GameSenseElementController);
            ig.storage.setAutoSaveCondCallback(function (saveType) {
                return saveType == "NEW" || saveType == "LOAD" ? false : !sc.model.isSaveBlocked()
            });
            ig.storage.setCheckpointCondCallback(function () {
                return !sc.model.isCheckpointBlocked()
            });
            this.physics.groundDangerCallback = function (entity) {
                entity = ig.terrain.getMapTerrain(entity.pos.x + entity.size.x / 2, entity.pos.y + entity.size.y / 2, entity.level, 0, 0);
                return ig.terrain.isFallTerrain(entity) ? true : false
            };
            this.physics.groundEntityDangerCallback = function (entity) {
                return ig.terrain.isFallTerrain(entity.entity.terrain) ? true : false
            }
        },

        /** Decide what to do when the game loop starts: load a slot, skip the title, or enter it. */
        onGameLoopStart: function () {
            window.IG_LOAD_SLOT != void 0 ? this.loadStart(window.IG_LOAD_SLOT) :
                window.SC_SKIP_TITLE ? this.start() : sc.model.enterTitle()
        },

        update: function () {
            if (this.transitionTimer > 0) {
                this.transitionTimer = this.transitionTimer - ig.system.actualTick;
                this.transitionTimer <= 0 && this.transitionEnded()
            }
            this.parent()
        },

        draw: function () {
            this.parent()
        },

        getVersion: function () {
            return sc.version.toString()
        },

        addTeleportMessage: function (message) {
            this._teleportMessages.push(message)
        },

        /** Start a new game (optionally in a specific start mode). */
        start: function (startMode, transitionTime) {
            this._startMode = startMode != void 0 ? startMode : sc.START_MODE.STORY;
            sc.model.enterNewGame();
            sc.model.enterGame();
            this.transitionTimer = transitionTime || 0.3
        },

        /** Load an existing save slot. */
        loadStart: function (slot) {
            this._slotToLoad = slot || 0;
            sc.model.enterLoadGame();
            sc.model.enterGame();
            this.transitionTimer = 0.3
        },

        gotoTitle: function () {
            this.setTeleportColor(0, 0, 0, false);
            this.currentTeleportColor.r = 0;
            this.currentTeleportColor.g = 0;
            this.currentTeleportColor.b = 0;
            this.transitionTimer = 0.8;
            sc.model.enterReset()
        },

        /** Called when the transition timer runs out — dispatch on the current model substate. */
        transitionEnded: function () {
            switch (sc.model.currentSubState) {
                case sc.GAME_MODEL_SUBSTATE.NEWGAME:
                    sc.Debug && sc.Debug.onNewGame();
                    if (this._startMode == sc.START_MODE.GRINDING) this.teleport("rookie-harbor.west",
                        new ig.TeleportPosition("start"), "NEW");
                    else if (this._startMode == sc.START_MODE.PUZZLE) this.teleport("rhombus-dng.entrance", new ig.TeleportPosition("start"), "NEW");
                    else if (this._startMode == sc.START_MODE.NEW_GAME_PLUS) this.teleport("newgame", new ig.TeleportPosition("start"), "NEW");
                    else if (window.LOAD_LEVEL_ON_GAME_START) {
                        var marker = window.MARKER_ON_GAME_START,
                            teleportPosition = marker ? new ig.TeleportPosition(marker) : null;
                        this.teleport(window.LOAD_LEVEL_ON_GAME_START, teleportPosition, "NEW")
                    } else this.teleport("hideout.entrance", new ig.TeleportPosition("start"),
                        "NEW");
                    break;
                case sc.GAME_MODEL_SUBSTATE.RESET:
                    sc.model.enterRunning();
                    ig.game.reset();
                    sc.model.enterTitle();
                    break;
                case sc.GAME_MODEL_SUBSTATE.LOADGAME:
                    ig.storage.loadSlot(this._slotToLoad)
            }
        },

        hardReset: function () {
            sc.model.enterRunning();
            ig.game.reset()
        },

        reloadCheckpoint: function () {
            this.setTeleportTime(1, 0.3);
            ig.storage.loadCheckpoint()
        },

        reloadAutosave: function () {
            this.setTeleportTime(1, 0.3);
            ig.storage.loadAutosave()
        },

        /** Play the defeat/respawn sequence: slow-motion, zoom, overlay fade to black, reload. */
        respawn: function () {
            sc.combat.effects.combat.spawnFixed("playerDefeat", 0, 0, 0).setIgnoreSlowdown();
            var respawnEvent = new ig.Event({
                steps: [{
                        type: "ADD_SLOW_MOTION",
                        factor: 0.001,
                        time: 0,
                        name: "playerRespawn"
                    }, {
                        type: "SET_ZOOM_BLUR",
                        zoomType: "MEDIUM",
                        fadeIn: 0.5,
                        duration: 1,
                        fadeOut: 1
                    }, {
                        type: "SET_CAMERA_TARGET",
                        entity: ig.game.playerEntity,
                        speed: 0.1,
                        transition: "EASE_OUT",
                        zoom: 1
                    }, {
                        type: "WAIT",
                        time: 0.3,
                        ignoreSlowDown: true
                    }, {
                        type: "CLEAR_SLOW_MOTION",
                        name: "playerRespawn",
                        time: 0.4
                    }, {
                        type: "ADD_SLOW_MOTION",
                        factor: 0.05,
                        time: 0.8
                    }, {
                        type: "SET_CAMERA_ZOOM",
                        zoom: 3,
                        duration: 2,
                        transition: "EASE_IN"
                    }, {
                        type: "WAIT",
                        time: 0.2,
                        ignoreSlowDown: true
                    },
                    {
                        type: "WAIT",
                        time: 0.5,
                        ignoreSlowDown: true
                    }, {
                        type: "SET_OVERLAY_CORNER",
                        alpha: 0,
                        time: 0.5,
                        color: "RED"
                    }, {
                        type: "SET_OVERLAY",
                        alpha: 1,
                        time: 0.5,
                        color: "white"
                    }, {
                        type: "WAIT",
                        time: 1,
                        ignoreSlowDown: true
                    }, {
                        type: "ADD_SLOW_MOTION",
                        factor: 0,
                        time: 0
                    }, {
                        type: "SET_OVERLAY",
                        alpha: 1,
                        time: 0.5,
                        color: "black"
                    }, {
                        type: "WAIT",
                        time: 1,
                        ignoreSlowDown: true
                    }, {
                        type: "LOAD"
                    }
                ]
            });
            this.events.callEvent(respawnEvent, ig.EventRunType.BLOCKING)
        },

        isEventStartReady: function () {
            return this.playerEntity && this.playerEntity.isDefeated() && !this.playerEntity.manualKill &&
                !sc.pvp.isActive() ? false : true
        },

        setTeleportColor: function (red, green, blue, lighter) {
            this.teleportColor.r = red;
            this.teleportColor.g = green;
            this.teleportColor.b = blue;
            this.teleportColor.lighter = lighter
        },

        setTeleportTime: function (timeIn, timeOut) {
            this.teleportColor.timeIn = timeIn;
            this.teleportColor.timeOut = timeOut
        },

        onTeleportStart: function () {
            ig.overlay.setColor(this.teleportColor.r, this.teleportColor.g, this.teleportColor.b, 1, this.teleportColor.timeIn, this.teleportColor.lighter);
            this.currentTeleportColor.r = this.teleportColor.r;
            this.currentTeleportColor.g = this.teleportColor.g;
            this.currentTeleportColor.b = this.teleportColor.b;
            this.teleportColor.r = 0;
            this.teleportColor.g = 0;
            this.teleportColor.b = 0;
            this.teleportColor.lighter = false;
            sc.model.enterTeleport();
            return this.teleportColor.timeIn
        },

        onTeleportEnd: function () {
            sc.model.enterLoading()
        },

        createPlayer: function () {
            var playerEntity = this.getEntitiesByType(ig.ENTITY.Player)[0];
            playerEntity || (playerEntity = this.spawnEntity(ig.ENTITY.Player, 0, 0, 0));
            this.playerEntity = playerEntity
        },

        getErrorData: function (data) {
            data.save = ig.storage.getAutoSlotData()
        },

        loadLevel: function (levelData, clearEntities, reloadCache) {
            if (ig.storage.resetAfterTeleport) {
                sc.model.player.regenerate();
                ig.storage.resetAfterTeleport = false
            }
            sc.model.isCutscene() && sc.model.enterGame();
            this.parent(levelData, clearEntities, reloadCache)
        },

        loadingComplete: function () {
            this.parent();
            this.handleLoadingComplete()
        },

        /** Show queued teleport messages, then hand control back to the game model. */
        handleLoadingComplete: function () {
            if (this._teleportMessages.length > 0) {
                ig.game.setPaused(true);
                var teleportMessage = this._teleportMessages.pop();
                this.sounds.popup.play();
                sc.Dialogs.showInfoDialog(teleportMessage, true, this.handleLoadingComplete.bind(this));
                this.hasTeleportMessageShown = true
            } else {
                this.hasTeleportMessageShown = false;
                sc.model.enterRunning();
                ig.overlay.setAlpha(0, this.teleportColor.timeOut);
                this.teleportColor.timeOut = 0.3;
                this.teleportColor.timeIn = 0.3;
                if (!sc.commonEvents.triggerEvent("FORCE_UPDATE", {})) {
                    if (!this.playerEntity.hasAction()) {
                        var resumeEvent = new ig.Event({
                            steps: [{
                                type: "DO_ACTION",
                                entity: this.playerEntity,
                                action: [{
                                    type: "WAIT",
                                    time: 0.1
                                }, {
                                    type: "WAIT_UNTIL_ON_GROUND"
                                }]
                            }]
                        });
                        ig.game.events.callEvent(resumeEvent, ig.EventRunType.BLOCKING)
                    }
                    sc.commonEvents.triggerEvent("MAP_ENTERED", {})
                }
            }
        }
    });

    window.startCrossCode = function () {
        window.IG_GAME_DEBUG && sc.Debug.gameStart();
        ig.main("#canvas",
            "#game", sc.CrossCode, window.IG_GAME_FPS || 60, window.IG_WIDTH, window.IG_HEIGHT, window.IG_GAME_SCALE, sc.StartLoader)
    }
});
