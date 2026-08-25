ig.module("game.main").requires("impact.base.game", "game.config", "game.features", "game.beta").defines(function() {
    sc.EmptyLoader = ig.Loader.extend({
        draw: function() {}
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
        init: function() {
            this.parent();
            sc.version.hasVersionChanged() && sc.version.saveCurrentVersion();
            sc.options.keyBinder.initBindings();
            ig.input.bind(ig.KEY.MOUSE1, "aim");
            ig.input.bind(ig.KEY.MOUSE2,
                "dash");
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
            ig.storage.setAutoSaveCondCallback(function(b) {
                return b ==
                    "NEW" || b == "LOAD" ? false : !sc.model.isSaveBlocked()
            });
            ig.storage.setCheckpointCondCallback(function() {
                return !sc.model.isCheckpointBlocked()
            });
            this.physics.groundDangerCallback = function(b) {
                b = ig.terrain.getMapTerrain(b.pos.x + b.size.x / 2, b.pos.y + b.size.y / 2, b.level, 0, 0);
                return ig.terrain.isFallTerrain(b) ? true : false
            };
            this.physics.groundEntityDangerCallback = function(b) {
                return ig.terrain.isFallTerrain(b.entity.terrain) ? true : false
            }
        },
        onGameLoopStart: function() {
            window.IG_LOAD_SLOT != void 0 ? this.loadStart(window.IG_LOAD_SLOT) :
                window.SC_SKIP_TITLE ? this.start() : sc.model.enterTitle()
        },
        update: function() {
            if (this.transitionTimer > 0) {
                this.transitionTimer = this.transitionTimer - ig.system.actualTick;
                this.transitionTimer <= 0 && this.transitionEnded()
            }
            this.parent()
        },
        draw: function() {
            this.parent()
        },
        getVersion: function() {
            return sc.version.toString()
        },
        addTeleportMessage: function(b) {
            this._teleportMessages.push(b)
        },
        start: function(b, a) {
            this._startMode = b != void 0 ? b : sc.START_MODE.STORY;
            sc.model.enterNewGame();
            sc.model.enterGame();
            this.transitionTimer =
                a || 0.3
        },
        loadStart: function(b) {
            this._slotToLoad = b || 0;
            sc.model.enterLoadGame();
            sc.model.enterGame();
            this.transitionTimer = 0.3
        },
        gotoTitle: function() {
            this.setTeleportColor(0, 0, 0, false);
            this.currentTeleportColor.r = 0;
            this.currentTeleportColor.g = 0;
            this.currentTeleportColor.b = 0;
            this.transitionTimer = 0.8;
            sc.model.enterReset()
        },
        transitionEnded: function() {
            switch (sc.model.currentSubState) {
                case sc.GAME_MODEL_SUBSTATE.NEWGAME:
                    sc.Debug && sc.Debug.onNewGame();
                    if (this._startMode == sc.START_MODE.GRINDING) this.teleport("rookie-harbor.west",
                        new ig.TeleportPosition("start"), "NEW");
                    else if (this._startMode == sc.START_MODE.PUZZLE) this.teleport("rhombus-dng.entrance", new ig.TeleportPosition("start"), "NEW");
                    else if (this._startMode == sc.START_MODE.NEW_GAME_PLUS) this.teleport("newgame", new ig.TeleportPosition("start"), "NEW");
                    else if (window.LOAD_LEVEL_ON_GAME_START) {
                        var b = window.MARKER_ON_GAME_START,
                            b = b ? new ig.TeleportPosition(b) : null;
                        this.teleport(window.LOAD_LEVEL_ON_GAME_START, b, "NEW")
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
        hardReset: function() {
            sc.model.enterRunning();
            ig.game.reset()
        },
        reloadCheckpoint: function() {
            this.setTeleportTime(1, 0.3);
            ig.storage.loadCheckpoint()
        },
        reloadAutosave: function() {
            this.setTeleportTime(1, 0.3);
            ig.storage.loadAutosave()
        },
        respawn: function() {
            sc.combat.effects.combat.spawnFixed("playerDefeat", 0, 0, 0).setIgnoreSlowdown();
            var b = new ig.Event({
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
            this.events.callEvent(b, ig.EventRunType.BLOCKING)
        },
        isEventStartReady: function() {
            return this.playerEntity && this.playerEntity.isDefeated() && !this.playerEntity.manualKill &&
                !sc.pvp.isActive() ? false : true
        },
        setTeleportColor: function(b, a, d, c) {
            this.teleportColor.r = b;
            this.teleportColor.g = a;
            this.teleportColor.b = d;
            this.teleportColor.lighter = c
        },
        setTeleportTime: function(b, a) {
            this.teleportColor.timeIn = b;
            this.teleportColor.timeOut = a
        },
        onTeleportStart: function() {
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
        onTeleportEnd: function() {
            sc.model.enterLoading()
        },
        createPlayer: function() {
            var b = this.getEntitiesByType(ig.ENTITY.Player)[0];
            b || (b = this.spawnEntity(ig.ENTITY.Player, 0, 0, 0));
            this.playerEntity = b
        },
        getErrorData: function(b) {
            b.save = ig.storage.getAutoSlotData()
        },
        loadLevel: function(b, a, d) {
            if (ig.storage.resetAfterTeleport) {
                sc.model.player.regenerate();
                ig.storage.resetAfterTeleport = false
            }
            sc.model.isCutscene() && sc.model.enterGame();
            this.parent(b, a, d)
        },
        loadingComplete: function() {
            this.parent();
            this.handleLoadingComplete()
        },
        handleLoadingComplete: function() {
            if (this._teleportMessages.length > 0) {
                ig.game.setPaused(true);
                var b = this._teleportMessages.pop();
                this.sounds.popup.play();
                sc.Dialogs.showInfoDialog(b, true, this.handleLoadingComplete.bind(this));
                this.hasTeleportMessageShown = true
            } else {
                this.hasTeleportMessageShown = false;
                sc.model.enterRunning();
                ig.overlay.setAlpha(0,
                    this.teleportColor.timeOut);
                this.teleportColor.timeOut = 0.3;
                this.teleportColor.timeIn = 0.3;
                if (!sc.commonEvents.triggerEvent("FORCE_UPDATE", {})) {
                    if (!this.playerEntity.hasAction()) {
                        b = new ig.Event({
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
                        ig.game.events.callEvent(b, ig.EventRunType.BLOCKING)
                    }
                    sc.commonEvents.triggerEvent("MAP_ENTERED", {})
                }
            }
        }
    });
    window.startCrossCode = function() {
        window.IG_GAME_DEBUG && sc.Debug.gameStart();
        ig.main("#canvas",
            "#game", sc.CrossCode, window.IG_GAME_FPS || 60, window.IG_WIDTH, window.IG_HEIGHT, window.IG_GAME_SCALE, sc.StartLoader)
    }
});