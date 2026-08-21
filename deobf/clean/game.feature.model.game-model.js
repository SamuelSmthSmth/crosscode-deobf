/**
 * game.feature.model.game-model
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.model.game-model")`.
 *
 * `sc.GameModel` (the `sc.model` add-on): the central game-state model —
 * title/game/cutscene states and substates (running, teleport, menu, pause,
 * …), combat mode + rank tracking, task/perma-task display, mobility blocks
 * (teleport/save/checkpoint/map-leave), cutscene skipping, and the demo
 * high-score timer. Also defines `sc.COMBAT_RANK`, `sc.GAME_MOBILITY_BLOCK`
 * and the `sc.GAME_MODEL_*` message/state constants.
 */
ig.module("game.feature.model.game-model")
    .requires(
        "impact.base.game",
        "impact.feature.bgm.bgm",
        "game.feature.model.base-model",
        "game.feature.player.player-model",
        "game.feature.msg.message-model",
        "game.feature.menu.menu-model",
        "game.feature.model.options-model",
        "impact.feature.env-particles.env-particles"
    )
    .defines(function () {

    sc.COMBAT_RANK = [{
        label: "D",
        dropRate: 1
    }, {
        label: "C",
        dropRate: 1.1
    }, {
        label: "B",
        dropRate: 1.25
    }, {
        label: "A",
        dropRate: 1.5
    }, {
        label: "S",
        dropRate: 2
    }];

    sc.GAME_MOBILITY_BLOCK = {
        NONE: {},
        TELEPORT: {
            teleportBlock: true
        },
        SAVE: {
            teleportBlock: true,
            saveBlock: true
        },
        CHECKPOINT: {
            teleportBlock: true,
            saveBlock: true,
            checkpointBlock: true
        },
        NO_MAP_LEAVE: {
            teleportBlock: true,
            saveBlock: true,
            checkpointBlock: true,
            mapLeaveBlock: true
        }
    };

    sc.GameModel = ig.GameAddon.extend({
        observers: [],
        currentState: 0,
        currentSubState: 0,
        prevSubState: 0,
        currentTask: null,
        permaTask: null,
        keepTaskDisplayed: false,
        taskTimer: -1,
        leaConfig: new sc.PlayerConfig("Lea"),
        player: null,
        message: null,
        menu: null,
        options: null,
        inputGuis: [],
        startDifficulty: sc.DIFFICULTY.NORMAL,
        skipTimer: 0,
        combatMode: false,
        combatTimer: 0,
        combatRank: 0,
        inCombatTime: 0,
        pauseMusicStop: false,
        mobilityBlock: "NONE",
        forceCombatMode: false,
        starSpawner: new ig.EnvParticleSpawner("STARS"),
        skipBlock: false,
        runsTimer: false,
        hsTimer: 0,
        highScore: [],
        highScoreObs: [],
        maxHighScore: 10,
        outOfCombatDialogTimer: 0,

        /** Start the demo-mode high-score timer (observatory challenges). */
        startHighScoreTimer: function () {
            this.hsTimer = 0;
            this.runsTimer = true
        },

        /** Stop the timer and record the elapsed time in the (regular or obs) high-score list. */
        stopHighScoreTimer: function (observatory) {
            if (this.runsTimer) {
                this.runsTimer = false;
                var list = observatory ? this.highScoreObs : this.highScore;
                list.push(this.hsTimer);
                list.sort(function (x, y) {
                    return x - y
                });
                list.length > 10 && list.pop()
            }
        },

        init: function () {
            this.parent("GameModel");
            this.message = sc.message;
            this.menu = sc.menu;
            this.options = sc.options;
            this.player = new sc.PlayerModel;
            this.player.setConfig(this.leaConfig);
            ig.storage.register(this)
        },

        /** Enable/disable combat mode (optionally forced); fires the cooldown/mode observers. */
        setCombatMode: function (active, force) {
            var wasCombatMode = this.isCombatMode(),
                wasCooldown = this.isCombatCooldown();
            force ? this.forceCombatMode = !!active : this.combatMode = !!active;
            if (this.isCombatActive()) this.combatTimer = this.player.getCombatCooldownTime();
            wasCooldown != this.isCombatCooldown() && sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED);
            wasCombatMode != this.isCombatMode() ? this.isCombatMode() ? this.startCombat() : this.endCombat() : this.updateCombatMusic()
        },

        cancelCombatCooldown: function () {
            if (this.combatTimer > 0) {
                this.combatTimer = 0;
                this.endCombat()
            }
        },

        isCombatRankActive: function () {
            return sc.autoControl.isActive() ? true : !this.player.getCore(sc.PLAYER_CORE.COMBAT_RANK) || !this.isCombatMode() || sc.pvp.isActive() || sc.map.isDungeon() || this.isForceCombat() ? false : true
        },

        isSRank: function () {
            return this.getCombatRank() == sc.COMBAT_RANK.length - 1
        },

        /** Add combat-rank progress; fires COMBAT_RANK_CHANGED on rank-up (with S-rank fanfare). */
        increaseCombatRank: function (weight) {
            if (!this.isCombatRankActive()) return false;
            var weight = (weight || 1) * 1,
                oldRank = this.getCombatRank();
            this.combatRank = this.combatRank + weight / (4 * Math.pow(1.5, Math.floor(this.combatRank)));
            if (this.combatRank > sc.COMBAT_RANK.length - 1) this.combatRank = sc.COMBAT_RANK.length - 1;
            var newRank = this.getCombatRank();
            if (oldRank != newRank) {
                if (this.isSRank() && sc.options.get("s-rank-effects")) {
                    if (ig.bgm.hasDefaultTrackType("sRankBattle")) {
                        ig.bgm.popDefaultTrackType("SLOW");
                        ig.bgm.pushDefaultTrackType("sRankBattle", "IMMEDIATELY")
                    }
                    ig.weather.addExtraParticles(this.starSpawner, 10)
                }
                sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.COMBAT_RANK_CHANGED);
                return true
            }
            return false
        },

        forceStartSRank: function () {
            this.combatRank = sc.COMBAT_RANK.length - 1;
            if (ig.bgm.hasDefaultTrackType("sRankBattle")) {
                ig.bgm.popDefaultTrackType("SLOW");
                ig.bgm.pushDefaultTrackType("sRankBattle", "IMMEDIATELY")
            }
            ig.weather.addExtraParticles(this.starSpawner, 10);
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.COMBAT_RANK_CHANGED)
        },

        startSRank: function () {},

        addChoiceGui: function (gui) {
            this.inputGuis.push(gui)
        },

        removeChoiceGui: function (gui) {
            this.inputGuis.erase(gui)
        },

        notifyDreamFxChange: function () {
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.DREAM_MODE_CHANGE)
        },

        getCombatRank: function () {
            return Math.floor(this.combatRank)
        },

        getCombatRankLabel: function () {
            return sc.COMBAT_RANK[this.getCombatRank()].label
        },

        getCombatRankByLabel: function (label) {
            for (var index = sc.COMBAT_RANK.length; index--;)
                if (sc.COMBAT_RANK[index].label == label) return index;
            throw Error("Combat Rannk of Label '" + label + "' does not exist");
        },

        getCombatRankDropRate: function () {
            return sc.COMBAT_RANK[this.getCombatRank()].dropRate
        },

        getCombatRankProgress: function () {
            return this.isSRank() ? 1 : this.combatRank - Math.floor(this.combatRank)
        },

        isMapLeaveBlocked: function () {
            return sc.GAME_MOBILITY_BLOCK[this.mobilityBlock] && sc.GAME_MOBILITY_BLOCK[this.mobilityBlock].mapLeaveBlock
        },

        isCheckpointBlocked: function () {
            return sc.GAME_MOBILITY_BLOCK[this.mobilityBlock] && sc.GAME_MOBILITY_BLOCK[this.mobilityBlock].checkpointBlock
        },

        isSaveBlocked: function () {
            return sc.GAME_MOBILITY_BLOCK[this.mobilityBlock] && sc.GAME_MOBILITY_BLOCK[this.mobilityBlock].saveBlock
        },

        isTeleportBlocked: function () {
            return sc.GAME_MOBILITY_BLOCK[this.mobilityBlock] &&
                sc.GAME_MOBILITY_BLOCK[this.mobilityBlock].teleportBlock
        },

        isTeleportBlockedNewGame: function () {
            return sc.newgame.get("waypoints-teleport") && ig.game.playerEntity && !ig.game.playerEntity.atLandmarkTeleport
        },

        isAssistMode: function () {
            return sc.options.get("assist-damage") != 1 || sc.options.get("assist-attack-frequency") != 1 || sc.options.get("assist-puzzle-speed") != 1
        },

        setCancelButton: function (text) {
            this.cancelButtonText = text
        },

        setMobilityBlock: function (block) {
            if (sc.GAME_MOBILITY_BLOCK[block]) this.mobilityBlock = block
        },

        startCombat: function () {
            sc.stats.addMap("combat", "started", 1);
            this.inCombatTime = 0;
            this.updateCombatMusic();
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED, true)
        },

        endCombat: function () {
            sc.stats.setMapMax("combat", "streakTime", this.inCombatTime);
            sc.model.player.params.getHpFactor() <= sc.HP_LOW_WARNING && sc.stats.addMap("combat", "lowHealthWins", 1);
            ig.weather.removeExtraParticles(this.starSpawner);
            sc.combat.updateCombatCompletionData();
            sc.combat.setCombatSpeed(1);
            this.combatRank = 0;
            this.updateCombatMusic();
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED, false)
        },

        /** Swap the default BGM track type between battle / rank-battle / calm. */
        updateCombatMusic: function () {
            sc.arena.active || (this.isCombatMode() ? ig.bgm.getDefaultTrackTypeCount() == 1 && (this.isCombatRankActive() && ig.bgm.hasDefaultTrackType("rankBattle") ? ig.bgm.pushDefaultTrackType("rankBattle", "FAST_OUT") : ig.bgm.pushDefaultTrackType("battle", "FAST_OUT")) : ig.bgm.getDefaultTrackTypeCount() > 1 && ig.bgm.popDefaultTrackType("SLOW"))
        },

        _isOutOfCombatDialogReadyIntern: function () {
            return !this.isCombatMode() && this.isRunning() && this.isGame() &&
                !sc.autoControl.isActive()
        },

        isOutOfCombatDialogReady: function () {
            return this._isOutOfCombatDialogReadyIntern() && this.outOfCombatDialogTimer <= 0
        },

        onReset: function () {
            this.player.setConfig(this.leaConfig);
            this.player.reset();
            this.setCombatMode(false);
            this.setCombatMode(false, true);
            this.cancelCombatCooldown();
            this.mobilityBlock = "NONE";
            this.cancelButtonText = null;
            this.skipBlock = this.pauseMusicStop = this.runsTimer = false;
            this.inCombatTime = 0;
            this.inputGuis.length = 0;
            this.setTask(null, false);
            this.setPermaTask(null)
        },

        onPreUpdate: function () {
            if (this.isCombatCooldown())
                if (this.isCutscene()) this.cancelCombatCooldown();
                else if (this.isRunning()) {
                this.combatTimer = this.combatTimer - ig.system.tick;
                if (this.combatTimer <= 0) {
                    this.combatTimer = 0;
                    this.endCombat()
                }
            }
            if (this.isCombatMode() && ig.game.firstUpdateLoop) {
                this.inCombatTime = this.inCombatTime + ig.system.rawTick;
                sc.stats.addMap("combat", "time", ig.system.rawTick)
            }
            if (this._isOutOfCombatDialogReadyIntern()) {
                if (this.outOfCombatDialogTimer > 0) this.outOfCombatDialogTimer = this.outOfCombatDialogTimer -
                    1
            } else this.outOfCombatDialogTimer = 2;
            if (!this.isPaused() && (this.isRunning() || this.isMenu()) && this.runsTimer) this.hsTimer = this.hsTimer + ig.system.actualTick;
            if (this.isCutscene() && this.isRunning() || this.message.isMenuMode()) {
                if (this.skipTimer > 0) {
                    this.skipTimer = this.skipTimer - ig.system.actualTick;
                    if (this.skipTimer <= 0) {
                        this.skipTimer = 0;
                        sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.CUTSCENE_SKIP, false)
                    }
                }
            } else if (this.skipTimer > 0) {
                this.skipTimer = 0;
                sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.CUTSCENE_SKIP, false)
            }
        },

        onVarsChanged: function () {
            !sc.model.isTitle() && sc.lore.loaded && this.player && this.player.updateChapter()
        },

        clearTopMessage: function () {
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.CLEAR_TOP_MESSAGE, true)
        },

        /** Hold-to-skip cutscenes: accumulate skipTimer, then confirm or skip directly. */
        skipCutscene: function () {
            if (!this.skipBlock)
                if (this.skipTimer > 0) {
                    this.skipTimer = 0;
                    sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.CUTSCENE_SKIP, false);
                    if (sc.options.get("skip-confirm")) {
                        ig.canLeavePauseMenu = false;
                        this.message.isMenuMode() || ig.game.setPaused(true);
                        sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.skipConfirm"),
                            null,
                            function (dialogResult) {
                                ig.canLeavePauseMenu = true;
                                this.message.isMenuMode() || ig.game.setPaused(false);
                                dialogResult.data == 0 && this.startSkip()
                            }.bind(this))
                    } else this.startSkip()
                } else {
                    this.skipTimer = 3;
                    sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.CUTSCENE_SKIP, true)
                }
        },

        enterTitle: function () {
            ig.system.skipMode = false;
            this._setState(sc.GAME_MODEL_STATE.TITLE);
            this.message.onSceneEnd(true)
        },

        enterCutscene: function (setCombatActive) {
            this.message.clearSideMessages();
            this._setState(sc.GAME_MODEL_STATE.CUTSCENE);
            setCombatActive && sc.combat.setActive(true)
        },

        enterGame: function () {
            ig.system.skipMode = false;
            this.message.onSceneEnd();
            this._setState(sc.GAME_MODEL_STATE.GAME)
        },

        enterRunning: function (skipNotify) {
            this.isPaused() && this.pauseMusicStop && ig.bgm.resume("IMMEDIATELY");
            ig.game.setPaused(false);
            this._setSubState(sc.GAME_MODEL_SUBSTATE.RUNNING, skipNotify)
        },

        enterTeleport: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.TELEPORT)
        },

        enterLoading: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.LOADING)
        },

        enterNewGame: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.NEWGAME)
        },

        enterReset: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.RESET)
        },

        enterLoadGame: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.LOADGAME)
        },

        enterLevelUp: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.LEVELUP)
        },

        enterQuestSolved: function () {
            this._setSubState(sc.GAME_MODEL_SUBSTATE.QUESTSOLVED)
        },

        enterQuickMenu: function () {
            if (this.currentState == sc.GAME_MODEL_STATE.GAME && this.currentSubState == sc.GAME_MODEL_SUBSTATE.RUNNING && !this.isPlayerControlBlocked()) {
                ig.game.setPaused(true);
                this._setSubState(sc.GAME_MODEL_SUBSTATE.QUICK);
                return true
            }
            return false
        },

        enterOnMapMenu: function () {
            if ((this.currentState == sc.GAME_MODEL_STATE.GAME || this.currentState == sc.GAME_MODEL_STATE.CUTSCENE) && this.currentSubState == sc.GAME_MODEL_SUBSTATE.RUNNING) {
                this._setSubState(sc.GAME_MODEL_SUBSTATE.ONMAPMENU);
                return true
            }
            return false
        },

        enterPrevSubState: function () {
            if (this.currentSubState != this.prevSubState) switch (this.prevSubState) {
                case sc.GAME_MODEL_SUBSTATE.MENU:
                    this.enterMenu();
                    break;
                case sc.GAME_MODEL_SUBSTATE.RUNNING:
                    this.enterRunning();
                    break;
                case sc.GAME_MODEL_SUBSTATE.PAUSE:
                    this.enterPause(true);
                    break;
                default:
                    this._setSubState(this.prevSubState)
            }
        },

        enterMenu: function (force) {
            if (force || this.currentState == sc.GAME_MODEL_STATE.GAME && this.currentSubState == sc.GAME_MODEL_SUBSTATE.RUNNING) {
                ig.game.setPaused(true);
                this._setSubState(sc.GAME_MODEL_SUBSTATE.MENU);
                return true
            }
            return false
        },

        enterPause: function (force) {
            if (force || this.currentState !== sc.GAME_MODEL_STATE.TITLE && this.currentSubState == sc.GAME_MODEL_SUBSTATE.RUNNING) {
                this.pauseMusicStop && ig.bgm.pause("IMMEDIATELY");
                ig.game.setPaused(true);
                this.stopSkip();
                this._setSubState(sc.GAME_MODEL_SUBSTATE.PAUSE);
                return true
            }
            return false
        },

        isTitle: function () {
            return this.currentState == sc.GAME_MODEL_STATE.TITLE
        },

        isGame: function () {
            return this.currentState == sc.GAME_MODEL_STATE.GAME
        },

        isCutscene: function () {
            return this.currentState == sc.GAME_MODEL_STATE.CUTSCENE
        },

        isRunning: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.RUNNING
        },

        isTeleport: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.TELEPORT
        },

        isLoading: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.LOADING
        },

        isNewGame: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.NEWGAME
        },

        isReset: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.RESET
        },

        isLoadGame: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.LOADGAME
        },

        isMenu: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.MENU
        },

        isPaused: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.PAUSE
        },

        isHUDBlocked: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.PAUSE || this.currentSubState == sc.GAME_MODEL_SUBSTATE.QUICK || this.currentSubState ==
                sc.GAME_MODEL_SUBSTATE.TELEPORT || this.currentSubState == sc.GAME_MODEL_SUBSTATE.LOADING
        },

        isLevelUp: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.LEVELUP
        },

        isQuestSolved: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.QUESTSOLVED
        },

        isQuickMenu: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.QUICK
        },

        isQuickMenuElementSwapEnabled: function () {
            var quickElement = sc.options.get("quick-element"),
                result = quickElement & this.currentSubState == sc.GAME_MODEL_SUBSTATE.QUICK;
            return result = result & sc.quickmodel.isQuickNone()
        },

        isOnMapMenu: function () {
            return this.currentSubState == sc.GAME_MODEL_SUBSTATE.ONMAPMENU
        },

        isForceCombat: function () {
            return this.forceCombatMode
        },

        isCombatMode: function () {
            return this.isCombatActive() || this.combatTimer > 0
        },

        isCombatActive: function () {
            return this.combatMode || this.forceCombatMode
        },

        isCombatCooldown: function () {
            return !this.isCombatActive() && this.combatTimer > 0
        },

        getCombatCooldownFactor: function () {
            return this.combatTimer / this.player.getCombatCooldownTime()
        },

        isSaveAllowed: function () {
            return !this.isSaveBlocked() &&
                !this.isCombatMode() && ig.game.isInterruptible()
        },

        isPlayerControlBlocked: function () {
            var playerEntity = ig.game.playerEntity;
            return !playerEntity ? false : playerEntity.isControlBlocked()
        },

        hasActiveChoice: function () {
            return this.message.hasChoice() || this.inputGuis.length > 0
        },

        startSkip: function () {
            if (!this.skipBlock && (this.message.isMenuMode() || this.currentState == sc.GAME_MODEL_STATE.CUTSCENE) && !this.message.hasChoice()) ig.system.skipMode = true
        },

        stopSkip: function () {
            ig.system.skipMode = false
        },

        setTask: function (task, keepDisplayed, timer) {
            this.currentTask = task;
            this.keepTaskDisplayed = keepDisplayed;
            this.taskTimer = timer != void 0 && timer >= 0 ? timer : -1;
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.TASK_CHANGED)
        },

        setPermaTask: function (task) {
            this.permaTask = task;
            this.taskTimer = -1;
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.PERMA_TASK_CHANGED)
        },

        resetMenuState: function () {
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.RESET_MENU_STATE)
        },

        _setState: function (state) {
            this.currentState = state;
            sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.STATE_CHANGED)
        },

        _setSubState: function (subState, skipNotify) {
            this.prevSubState = this.currentSubState;
            this.currentSubState = subState;
            skipNotify || sc.Model.notifyObserver(this, sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)
        },

        onStorageSave: function (data) {
            data.player = this.player.getSaveData();
            data.mobilityBlock = this.mobilityBlock;
            data.forceCombatMode = this.forceCombatMode;
            data.highscore = ig.copy(this.highScore);
            data["highscore-obs"] = ig.copy(this.highScoreObs);
            data.currentTask = this.currentTask && this.currentTask.data;
            data.permaTask = this.permaTask && this.permaTask.data;
            data.keepTaskDisplayed = this.keepTaskDisplayed;
            data.cancelButtonText = this.cancelButtonText
        },

        onStoragePreLoad: function (data) {
            this.player.preLoad(data.player);
            this.mobilityBlock = data.mobilityBlock;
            this.cancelButtonText = data.cancelButtonText;
            if (!this.mobilityBlock) this.mobilityBlock = data.saveBlock ? "SAVE" : "NONE";
            this.pauseMusicStop = false;
            this.highScore = data.highscore || [];
            this.highScoreObs = data["highscore-obs"] || [];
            this.currentTask = data.currentTask && new ig.LangLabel(data.currentTask);
            this.keepTaskDisplayed = data.keepTaskDisplayed;
            this.setPermaTask(data.permaTask && new ig.LangLabel(data.permaTask))
        },

        onStoragePostLoad: function (data) {
            this.setCombatMode(false);
            this.setCombatMode(data.forceCombatMode, true);
            this.cancelCombatCooldown();
            this.player.postLoad(data.player)
        }
    });

    ig.addGameAddon(function () {
        return sc.model = new sc.GameModel
    });

    sc.GAME_MODEL_MSG = {
        STATE_CHANGED: 0,
        TASK_CHANGED: 1,
        SUB_STATE_CHANGED: 2,
        COMBAT_MODE_CHANGED: 3,
        COMBAT_RANK_CHANGED: 4,
        CUTSCENE_SKIP: 5,
        RESET_MENU_STATE: 6,
        PERMA_TASK_CHANGED: 7,
        CLEAR_TOP_MESSAGE: 8,
        DREAM_MODE_CHANGE: 9
    };

    sc.GAME_MODEL_STATE = {
        TITLE: 0,
        GAME: 1,
        CUTSCENE: 2
    };

    sc.GAME_MODEL_SUBSTATE = {
        RUNNING: 0,
        TELEPORT: 1,
        LOADING: 2,
        NEWGAME: 3,
        RESET: 4,
        LOADGAME: 5,
        MENU: 6,
        PAUSE: 7,
        LEVELUP: 8,
        QUICK: 9,
        ONMAPMENU: 10,
        QUESTSOLVED: 11
    }
});
ig.baked = !0;
