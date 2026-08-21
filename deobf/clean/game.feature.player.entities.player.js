/**
 * game.feature.player.entities.player
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.entities.player")`.
 *
 * The playable Lea entity (`ig.ENTITY.Player`): movement, dashing, guarding,
 * charging (combat arts), throwing, melee combos, camera targets, skin
 * (appearance / step fx / aura / pet) handling, idle/pet actions and the
 * per-frame input state machine (`gatherInput` → `handleDash`/`handleGuard`/
 * `handleCharge`/`handleStateChange`/`handleStateStart`).
 */
ig.module("game.feature.player.entities.player").requires(
    "impact.feature.env-particles.env-particles",
    "game.feature.combat.entities.ball",
    "game.feature.player.entities.player-base",
    "game.feature.combat.entities.combatant",
    "game.feature.player.entities.crosshair",
    "game.feature.player.entities.player-pet",
    "game.feature.player.player-level-notifier",
    "game.feature.player.item-consumption",
    "game.feature.new-game.new-game-model"
).defines(function () {

    /** Charge level (1..maxLevel) reached after a given charge time. */
    function getChargeLevel(charging) {
        for (var level = CHARGE_LEVEL_TIMES.length, index = 0; level--;)
            if (charging.time >=
                CHARGE_LEVEL_TIMES[level]) {
                index = level + 1;
                break
            }
        return index = Math.min(charging.maxLevel, index)
    }

    /** Tick a named countdown down by the frame time; floors at zero. */
    function tickDownCounter(counters, key) {
        if (counters[key] > 0) {
            counters[key] = counters[key] - ig.system.tick;
            counters[key] <= 0 && (counters[key] = 0)
        }
    }
    Vec2.create();
    var CHARGE_TYPE_ATTACK = {
            actionKey: "ATTACK_SPECIAL"
        },
        CHARGE_TYPE_THROW = {
            actionKey: "THROW_SPECIAL"
        },
        CHARGE_TYPE_GUARD = {
            actionKey: "GUARD_SPECIAL"
        },
        CHARGE_TYPE_DASH = {
            actionKey: "DASH_SPECIAL"
        },
        ELEMENT_NAMES = ["Neutral", "Heat", "Cold", "Shock", "Wave"],
        CHARGE_LEVEL_TIMES = [0.25, 0.5, 1];
    sc.PLAYER_ZOOM = 1;

    /** Reused input snapshot filled by gatherInput(). */
    var inputState = {
            thrown: false,
            melee: false,
            aim: false,
            autoThrow: false,
            attack: false,
            guard: false,
            charge: false,
            dashX: 0,
            dashY: 0,
            switchMode: false,
            relativeVel: 0,
            moveDir: Vec2.create()
        },
        /** Reused derived state written by the handle* methods. */
        derivedState = {};
    ig.ENTITY.Player = sc.PlayerBaseEntity.extend({
        skin: {
            appearanceFx: null,
            appearance: null,
            stepFx: null,
            auraFx: null,
            auraFxHandle: null,
            pet: null
        },
        proxies: null,
        model: null,
        state: 0,
        throwCounter: 0,
        attackCounter: 0,
        attackResetTimer: 0,
        throwDir: Vec2.create(),
        throwDirData: Vec2.create(),
        doAttack: false,
        lastMoveDir: Vec2.create(),
        dashCount: 0,
        dashAttackCount: 0,
        maxDash: 3,
        keepLastMoveDir: 0,
        moveDirStartedTimer: 0,
        jumpPoint: Vec2.create(),
        jumpForwardDir: Vec2.create(),
        idle: {
            timer: 0,
            actions: [],
            petAction: null
        },
        gui: {},
        cameraHandle: null,
        cameraTargets: [],
        mapStartPos: Vec3.create(),
        actionBlocked: {
            action: 0,
            charge: 0,
            dash: 0,
            reaim: 0,
            move: 0
        },
        combatStats: {
            lastTarget: null
        },
        dashDir: Vec2.create(),
        dashDirData: Vec2.create(),
        dashTimer: 0,
        dashBlock: 0,
        doEscapeTimer: 0,
        stunEscapeDash: false,
        dashPerfect: false,
        perfectGuardCooldown: 0,
        charging: {
            time: -1,
            cancelTime: 0,
            swapped: false,
            type: null,
            maxLevel: 0,
            fx: null,
            block: 0,
            msg: null,
            executeLevel: 0,
            prefDir: Vec2.create()
        },
        chargeThrowCharged: false,
        floating: false,
        recordInput: false,
        interactObject: null,
        explicitAimStart: 0,
        levelUpNotifier: null,
        atLandmarkHeal: 0,
        atLandmarkTeleport: 0,
        itemConsumer: null,
        isPlayer: true,
        hidePets: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.levelUpNotifier = new sc.PlayerLevelNotifier;
            this.itemConsumer = new sc.ItemConsumption;
            if (sc.model) {
                this.model = sc.model.player;
                sc.Model.addObserver(this.model, this);
                sc.Model.addObserver(sc.model, this);
                this.initModel()
            }
            sc.Model.addObserver(sc.playerSkins, this);
            this.charging.fx = new sc.CombatCharge(this, true);
            sc.combat.addActiveCombatant(this)
        },

        initModel: function () {
            this.params =
                this.model.params;
            this.params.setCombatant(this);
            this.animSheet = this.animSheetReplace || this.model.animSheet;
            sc.Model.addObserver(this.params, this);
            this.initAnimations();
            this.copyModelSkills();
            this.updateModelStats(true);
            this.updateSkinStepFx();
            this.updateSkinAura();
            this.updateSkinPet(false);
            this.initIdleActions()
        },

        replaceAnimSheet: function (animSheet) {
            this.animSheetReplace = animSheet;
            this.updateAnimSheet()
        },

        initIdleActions: function () {
            this.idle.actions.length = 0;
            if (this.model.name == "Lea") {
                var idleAction = sc.gameCode.isEnabled("caramelldansen") ?
                    new ig.Action("PLAYER_IDLE", [{
                        type: "SET_FACE",
                        face: "SOUTH",
                        rotate: true
                    }, {
                        type: "WAIT",
                        time: 0.3
                    }, {
                        type: "SHOW_EXTERN_ANIM",
                        anim: {
                            sheet: "player-poses",
                            name: "caramelldansen"
                        }
                    }, {
                        type: "WAIT",
                        time: 5
                    }, {
                        type: "SHOW_ANIMATION",
                        anim: "preIdle",
                        wait: true
                    }], false, false) : new ig.Action("PLAYER_IDLE", [{
                        type: "CHANGE_STAT_MAP_NUMBER",
                        map: "misc",
                        stat: "yawns",
                        value: 1,
                        changeType: "add"
                    }, {
                        type: "SET_FACE",
                        face: "SOUTH_EAST",
                        rotate: true
                    }, {
                        type: "SHOW_ANIMATION",
                        anim: "idleStretch",
                        wait: true
                    }], false, false);
                this.idle.actions.push(idleAction)
            }
        },

        /** Lea pets the active pet: walk over to it, then it hops toward her. */
        doPetAction: function () {
            var offsets = [{
                    x: 0,
                    y: -7
                }, {
                    x: 12,
                    y: -1
                }, {
                    x: -12,
                    y: -1
                }, {
                    x: 0,
                    y: 7
                }],
                pet = this.skin.pet;
            if (pet.petSkin.petOffsets) offsets = pet.petSkin.petOffsets;
            var playerAction = new ig.Action("PLAYER_IDLE", [{
                type: "SET_FACE_TO_ENTITY",
                entity: pet,
                rotate: true
            }, {
                type: "WAIT",
                time: 0.4
            }, {
                type: "SET_COLL_TYPE",
                value: "IGNORE"
            }, {
                type: "SET_RELATIVE_SPEED",
                value: 0.3
            }, {
                type: "MOVE_TO_ENTITY_CLOSEST_OFFSET",
                entity: pet,
                offsets: offsets,
                maxTime: 0.4,
                forceTime: true
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: pet,
                rotate: false
            }, {
                type: "SHOW_ANIMATION",
                anim: "pet"
            }, {
                type: "WAIT",
                time: 1.5
            }, {
                type: "SHOW_ANIMATION",
                anim: "preIdle",
                wait: true
            }, {
                type: "WAIT",
                time: 1
            }], false, false);
            var petActionSteps = [{
                type: "SHOW_ANIMATION",
                anim: "idle",
                viaWalkConfig: true
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: this,
                rotate: true
            }, {
                type: "SET_COLL_TYPE",
                value: "IGNORE"
            }, {
                type: "WAIT",
                time: 1
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: this,
                rotate: true
            }, {
                type: "WAIT",
                time: 0.6
            }, {
                type: "PLAY_PET_SOUND"
            }, {
                type: "WAIT",
                time: 0.6
            }, {
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "npc",
                    name: "hearts"
                }
            }];
            this.skin.pet.coll.float.height ? petActionSteps.push({
                type: "SET_Z_VEL",
                value: 100
            }, {
                type: "SET_FLOAT_HEIGHT",
                value: 8
            }, {
                type: "SET_FLOAT_PARAMS",
                variance: 8,
                accel: 10
            }, {
                type: "WAIT",
                time: 1
            }) : petActionSteps.push({
                type: "JUMP",
                jumpHeight: "S",
                wait: true,
                ignoreSounds: true
            }, {
                type: "JUMP",
                jumpHeight: "S",
                wait: true,
                ignoreSounds: true
            }, {
                type: "JUMP",
                jumpHeight: "S",
                wait: true,
                ignoreSounds: true
            });
            petActionSteps = new ig.Action("PLAYER_IDLE", petActionSteps, false, false);
            this.setAction(playerAction);
            this.skin.pet.setAction(petActionSteps)
        },

        /** Pick the active appearance skin's animSheet (unless a replacement is forced). */
        updateAnimSheet: function (skipFx) {
            var skin = null,
                appearance = sc.playerSkins.getCurrentSkin("Appearance");
            if (appearance && appearance.loaded)
                if (appearance.noHide) skin = appearance;
                else if ((!sc.model.isCutscene() ||
                    ig.game.events.hasBlockingEventCallHint("SKIN_ALLOWED")) && !ig.dreamFx.isActive()) skin = appearance;
            if (skin != this.skin.appearance) {
                if (!skipFx) {
                    if (this.skin.appearanceFx) {
                        this.skin.appearanceFx.setCallback(null);
                        this.skin.appearanceFx.stop();
                        this.skin.appearanceFx = null
                    }
                    skin ? this.skin.appearanceFx = skin.fx.spawnOnTarget("skinOn", this, {
                        callback: this
                    }) : this.skin.appearance.fx.spawnOnTarget("skinOff", this)
                }
                this.skin.appearance = skin
            }
            if (this.animSheetReplace) this.animSheet = this.animSheetReplace;
            else {
                skipFx = this.model.animSheet;
                if (this.skin.appearance &&
                    !this.skin.appearanceFx) skipFx = this.skin.appearance.animSheet;
                this.animSheet = skipFx
            }
        },

        updateSkinStepFx: function () {
            var skin = sc.playerSkins.getCurrentSkin("StepEffect");
            this.skin.stepFx = skin && skin.loaded ? skin.fx : null
        },

        updateSkinAura: function () {
            var skin = sc.playerSkins.getCurrentSkin("Aura");
            this.skin.auraFx = skin && skin.loaded ? skin.fx : null;
            this.skin.auraFxHandle && this.skin.auraFxHandle.stop();
            this.skin.auraFxHandle = null;
            if (this.skin.auraFx) {
                var effectName = "aura",
                    element = ELEMENT_NAMES[this.model.currentElementMode];
                this.skin.auraFx.hasEffect(effectName + element) && (effectName = effectName + element);
                this.skin.auraFxHandle =
                    this.skin.auraFx.spawnOnTarget(effectName, this, {
                        duration: -1
                    })
            }
        },

        updateSkinPet: function (forceSpawn) {
            if (this.skin.pet) {
                this.skin.pet.remove();
                this.skin.pet = null
            }
            var skin = sc.playerSkins.getCurrentSkin("Pet");
            if (skin && skin.loaded) this.skin.pet = ig.game.spawnEntity(sc.PlayerPetEntity, 0, 0, 0, {
                petSkin: skin
            }, forceSpawn || false)
        },

        onEffectEvent: function (effect) {
            if (effect == this.skin.appearanceFx && effect.state >= ig.EFFECT_STATE.POST_LOOP) {
                this.skin.appearanceFx = null;
                this.updateAnimSheet()
            }
        },

        regenPvp: function (amount) {
            this.parent(amount);
            this.model.addElementLoad(-1E3)
        },

        updateModelStats: function (skipAnimSheetFx) {
            this.regenFactor =
                this.params.getModifier("HP_REGEN");
            if (sc.newgame.get("combat-regen-half")) this.regenFactor = this.regenFactor / 2;
            else if (sc.newgame.get("combat-regen-zero")) this.regenFactor = 0;
            this.stunData.stunEscapeTime = 1.5;
            this.gui.crosshair && this.gui.crosshair.setBaseSpeedFactor(1 + this.params.getModifier("AIM_SPEED"));
            if (this.params) this.params.criticalDmgFactor = 1.5 + this.params.getModifier("CRITICAL_DMG");
            this.stunThreshold = this.params.getModifier("STUN_THRESHOLD");
            this.updateAnimSheet(skipAnimSheetFx);
            this.configs.aiming.overwrite("maxVel",
                100 * (1 + this.params.getModifier("AIMING_MOVEMENT")));
            this.maxDash = Math.round(this.getMaxDashes() + this.params.getModifier("DASH_STEP"));
            this.spikeDmg.baseFactor = this.params.getModifier("SPIKE_DMG")
        },

        getMaxDashes: function () {
            return this.model.name != "Lea" ? 3 : sc.newgame.get("dash-1") ? 1 : 3
        },

        hasCameraTarget: function (target) {
            return this.cameraTargets.indexOf(target) != -1
        },

        addCameraTarget: function (target, transitionType) {
            if (this.cameraTargets.indexOf(target) == -1) {
                this.cameraTargets.push(target);
                this._updateCameraHandle(transitionType || "NORMAL")
            }
        },

        removeCameraTarget: function (target,
            transitionType) {
            this.cameraTargets.erase(target);
            this._updateCameraHandle(transitionType || "NORMAL")
        },

        removeAllCameraTargets: function (transitionType) {
            this.cameraTargets.length = 0;
            this._updateCameraHandle(transitionType || "NORMAL")
        },

        _updateCameraHandle: function (transitionType) {
            var handle = null;
            if (this.cameraTargets.length == 0) handle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this), 0, 0);
            else {
                handle = [this];
                handle.push.apply(handle, this.cameraTargets);
                handle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget(handle, true), 0, 0)
            }
            handle.keepZoomFocusAligned = true;
            sc.PLAYER_ZOOM != 1 && handle.setZoom(sc.PLAYER_ZOOM,
                0.1);
            this.cameraHandle ? ig.camera.replaceTarget(this.cameraHandle, handle, transitionType, KEY_SPLINES.EASE_IN_OUT) : ig.camera.pushTarget(handle, transitionType, KEY_SPLINES.EASE_IN_OUT);
            this.cameraHandle = handle
        },

        onPlayerPlaced: function () {
            if (ig.camera) {
                for (; ig.camera.getTargetCount() > 0;) ig.camera.popTarget();
                this._updateCameraHandle()
            }
            sc.party.onMapEnter();
            Vec3.assign(this.respawn.pos, this.coll.pos);
            Vec3.assign(this.mapStartPos, this.coll.pos);
            this.skin.pet && this.skin.pet.resetStartPos()
        },

        onMoveEffect: function (effect) {
            effect == "step" && sc.stats.addMap("player",
                "steps", 1);
            this.skin.stepFx && this.skin.stepFx.hasEffect(effect) && (effect == "jump" ? this.skin.stepFx.spawnOnTarget("jump", this, {
                angle: Vec2.clockangle(this.face)
            }) : this.skin.stepFx.spawnOnTarget(effect, this));
            sc.gameCode.isEnabled("speedlines") && (effect == "step" ? ig.game.effects.speedlines.spawnOnTarget("speedlinesWalk", this, {
                duration: 0.2,
                align: "CENTER"
            }) : effect == "dash" ? ig.game.effects.speedlines.spawnOnTarget("speedlinesDash", this, {
                duration: 0.3,
                align: "CENTER"
            }) : effect == "jump" && ig.game.effects.speedlines.spawnOnTarget("speedlinesJump",
                this, {
                    duration: 0.5,
                    align: "CENTER"
                }))
        },

        setAction: function (action, arg2, arg3) {
            this.coll.relativeVel = 1;
            this.parent(action, arg2, arg3)
        },

        doCombatAction: function (action) {
            this.doPlayerAction(action);
            this.model.increaseActionHeat(sc.PLAYER_ACTION[action]);
            this.actionBlocked.action = this.actionBlocked.charge = this.actionBlocked.move = this.actionBlocked.reaim = this.actionBlocked.dash = 100;
            sc.gameCode.isEnabled("speedlines") && ig.game.effects.speedlines.spawnOnTarget("speedlinesDash", this, {
                duration: 0.3,
                align: "CENTER"
            })
        },

        setActionBlocked: function (blocked) {
            this.actionBlocked.action =
                blocked.action;
            this.actionBlocked.charge = blocked.charge || blocked.action;
            this.actionBlocked.dash = blocked.dash;
            this.actionBlocked.reaim = blocked.reaim;
            this.actionBlocked.move = blocked.move
        },

        clearActionBlocked: function () {
            this.charging.executeLevel = 0;
            this.actionBlocked.action = this.actionBlocked.move = this.actionBlocked.charge = this.actionBlocked.reaim = this.actionBlocked.dash = 0
        },

        showChargeEffect: function (level) {
            this.charging.fx.charge(this.model.currentElementMode, level);
            this.params.notifySpConsume(sc.PLAYER_SP_COST[level - 1]);
            this.cameraHandle.setZoom(sc.PLAYER_ZOOM +
                level * 0.5 / 3, 0.5, KEY_SPLINES.JUMPY);
            if (level >= 2) {
                var zoomHandle = new ig.ZoomBlurHandle(level == 2 ? "LIGHT" : "MEDIUM", 0.2, 0, 0.3);
                ig.screenBlur.addZoom(zoomHandle)
            }
        },

        clearCharge: function () {
            if (this.charging.time != -1) {
                this.params.notifySpConsume(0);
                this.charging.time = -1;
                ig.slowMotion.clearNamed("playerCharge", 0);
                this.gui.crosshair.setSpecial(false);
                this.coll.time.animStatic = false;
                this.charging.fx.stop();
                this.cameraHandle.setZoom(sc.PLAYER_ZOOM, 0.5, KEY_SPLINES.EAST_IN_OUT)
            }
        },

        onKill: function (silent) {
            this.clearCharge();
            this.parent(silent);
            sc.Model.removeObserver(this.model,
                this);
            sc.Model.removeObserver(sc.model, this);
            sc.Model.removeObserver(this.params, this);
            sc.Model.removeObserver(sc.playerSkins, this);
            sc.combat.removeActiveCombatant(this);
            if (!silent) {
                var deaths = ig.vars.get("stats.deaths") || 0;
                ig.game.respawn();
                ig.vars.set("stats.deaths", deaths + 1)
            }
        },

        show: function () {
            this.parent();
            this.gui.crosshair = ig.game.spawnEntity(ig.ENTITY.Crosshair, 0, 0, 0, {
                thrower: this,
                controller: new sc.PlayerCrossHairController
            });
            this.updateModelStats();
            this.updateSkinAura()
        },

        hide: function () {
            this.parent();
            if (this.skin.auraFxHandle) {
                this.skin.auraFxHandle.stop();
                this.skin.auraFxHandle = null
            }
        },

        /** Which charge type the current input maps to (attack / throw / guard / dash). */
        getChargeType: function (state, input) {
            return this.dashTimer > 0.33 ? CHARGE_TYPE_DASH : input.guarding || sc.control.guarding() && Vec2.isZero(input.moveDir) ? this.model.getCore(sc.PLAYER_CORE.GUARD) ? CHARGE_TYPE_GUARD : CHARGE_TYPE_ATTACK : sc.control.dashHold() ? CHARGE_TYPE_DASH : this.state == 1 || (this.state == 2 || this.state == 5) && this.model.getCore(sc.PLAYER_CORE.THROWING) && sc.control.aiming() ? CHARGE_TYPE_THROW : CHARGE_TYPE_ATTACK
        },

        getCurrentChargeLevel: function () {
            return this.charging.time <= 0 ? 0 : getChargeLevel(this.charging)
        },

        getMaxChargeLevel: function (chargeType) {
            var level = 0,
                actionKey = chargeType.actionKey,
                levelLimit = 3;
            for (this.model.name == "Lea" && (sc.newgame.get("combat-arts-level-1") ?
                    levelLimit = 1 : sc.newgame.get("combat-arts-level-2") && (levelLimit = 2)); level < levelLimit && this.model.getAction(sc.PLAYER_ACTION[actionKey + (level + 1)]);) level++;
            return level
        },

        startCharge: function (chargeType) {
            if (!this.model.getCore(sc.PLAYER_CORE.SPECIAL) || !this.model.getCore(sc.PLAYER_CORE.CLOSE_COMBAT) && chargeType == CHARGE_TYPE_ATTACK) return false;
            var maxLevel = this.getMaxChargeLevel(chargeType),
                sp = this.model.params.getSp(),
                affordableLevel = 0;
            sp >= sc.PLAYER_SP_COST[2] ? affordableLevel = 3 : sp >= sc.PLAYER_SP_COST[1] ? affordableLevel = 2 : sp >= sc.PLAYER_SP_COST[0] && (affordableLevel = 1);
            maxLevel = Math.min(maxLevel, affordableLevel);
            if (affordableLevel == 0) {
                if (!this.charging.msg || this.charging.msg.isFinished()) {
                    var noSpText = ig.lang.get("sc.gui.combat.no-sp");
                    this.charging.msg = new sc.SmallEntityBox(this, noSpText, 0.5);
                    ig.gui.addGuiElement(this.charging.msg)
                }
            } else {
                this.charging.msg && !this.charging.msg.isFinished() && this.charging.msg.remove();
                this.charging.msg = null
            }
            if (maxLevel == 0) return false;
            this.charging.maxLevel = maxLevel;
            this.charging.type = chargeType;
            Vec2.assignC(this.charging.prefDir, 0, 0);
            chargeType == CHARGE_TYPE_THROW ? this.quickStateSwitch(1) : chargeType == CHARGE_TYPE_ATTACK && this.quickStateSwitch(3);
            return true
        },

        getChargeAction: function (chargeType, level) {
            for (var actionKey = chargeType.actionKey; level && !this.model.getAction(sc.PLAYER_ACTION[actionKey + level]);) level--;
            if (!level) return 0;
            var spCost = sc.PLAYER_SP_COST[level - 1];
            sc.newgame.get("infinite-sp") || this.model.params.consumeSp(spCost);
            return actionKey + level
        },

        quickStateSwitch: function (state) {
            this.state = state;
            if (state == 1) {
                this.gui.crosshair.setActive(true);
                this.setDefaultConfig(this.configs.aiming)
            } else {
                this.gui.crosshair.setActive(false);
                this.setDefaultConfig(this.configs.normal)
            }
        },

        isElementChangeBlocked: function () {
            return this.isControlBlocked() || this.charging.time != -1
        },

        isControlBlocked: function () {
            return this.hasStun() || this.params.isDefeated() || this.interactObject ||
                this.currentAction && this.currentAction.eventAction
        },

        update: function () {
            this.playerTrack.lastPlayerAction = null;
            for (var index = this.cameraTargets.length; index--;) {
                var target = this.cameraTargets[index];
                target._killed && this.removeCameraTarget(target)
            }
            if (this.attackResetTimer > 0) {
                this.attackResetTimer = this.attackResetTimer - ig.system.tick;
                if (this.attackResetTimer <= 0) this.attackCounter = this.attackResetTimer = 0
            }
            if (this.perfectGuardCooldown > 0) {
                this.perfectGuardCooldown = this.perfectGuardCooldown - ig.system.tick;
                if (this.perfectGuardCooldown <
                    0) this.perfectGuardCooldown = 0
            }
            if (!sc.inputForcer.isBlocking()) {
                tickDownCounter(this.actionBlocked, "charge");
                tickDownCounter(this.actionBlocked, "action");
                tickDownCounter(this.actionBlocked, "dash");
                tickDownCounter(this.actionBlocked, "reaim");
                tickDownCounter(this.actionBlocked, "move");
                this.model.updateLoop(sc.combat.isInCombat(this));
                if (this.explicitAimStart) {
                    this.explicitAimStart = this.explicitAimStart - ig.system.actualTick;
                    if (this.explicitAimStart <= 0) this.explicitAimStart = 0
                }
                if (this.hasStun() && this.interactObject) {
                    this.interactObject.onInteractObjectDrop();
                    this.explicitAimStart =
                        0.05;
                    this.interactObject = null
                }
                var inputState = this.gatherInput();
                if (this.doEscapeTimer > 0) {
                    this.doEscapeTimer = this.doEscapeTimer - ig.system.tick;
                    if (this.doEscapeTimer <= 0 || this.params.isDefeated()) {
                        this.doEscapeTimer = 0;
                        Vec2.assignC(this.dashDir, 0, 0);
                        this.hitStable = sc.ATTACK_TYPE.LIGHT
                    } else if (this.damageTimer > 0 && this.damageTimer <= 0.2) this.damageTimer = 1E-5
                }
                if (this.switchedMode) {
                    this.switchedMode = false;
                    sc.combat.showModeChange(this, this.model.currentElementMode);
                    this.updateSkinAura()
                }
                if (this.isControlBlocked()) {
                    this.clearCharge();
                    this.clearActionBlocked();
                    this.regenShield(false);
                    sc.combat.clearModeAura(this);
                    this.dashBlock = this.dashTimer = this.dashCount = 0;
                    this.hasStun() && this.stunData.time >= this.stunData.stunEscapeTime ? this.handleDash(derivedState, inputState, true, true) : this.hasStun() && this.damageTimer <= 0.2 ? this.handleDash(derivedState, inputState, true) : this.dashDir.x = this.dashDir.y = 0;
                    this.attackResetTimer = this.attackCounter = 0;
                    var targetState = this.currentAction && this.currentAction.eventAction ? 0 : 4;
                    if (this.state != targetState) {
                        this.state = targetState;
                        this.jumpingEnabled = false;
                        if (this.state == 0) {
                            this.setDefaultConfig(this.configs.normal);
                            this.defaultConfig.apply(this)
                        }
                        this.gui.crosshair.setActive(false);
                        Vec2.assignC(this.throwDir, 0, 0);
                        this.doAttack = false
                    }
                    this.parent()
                } else {
                    if (this.model.hasLevelUp() && this.coll.pos.z == this.coll.baseZPos && sc.model.isOutOfCombatDialogReady()) {
                        var groundEntity = (groundEntity = (groundEntity = this.coll._collData && this.coll._collData.groundEntry) && groundEntity.parentColl || groundEntity) && groundEntity.entity;
                        (!groundEntity || !groundEntity.isDefeated || !groundEntity.isDefeated()) && this.levelUpNotifier.runLevelUpScene(this, this.model)
                    }
                    if (this.currentAction && this.currentAction.name === "PLAYER_IDLE" && !Vec2.isZero(inputState.moveDir)) {
                        this.cancelAction();
                        this.skin.pet && (this.skin.pet.currentAction && this.skin.pet.currentAction.name === "PLAYER_IDLE") && this.skin.pet.cancelAction()
                    }
                    this.currentAction || this.clearActionBlocked();
                    if (!this.jumping && this.coll.pos.z == this.coll.baseZPos) this.maxJumpHeight = -1;
                    this.handleDash(derivedState, inputState);
                    this.handleGuard(derivedState, inputState);
                    this.handleCharge(derivedState, inputState);
                    this.handleStateChange(derivedState, inputState);
                    if (this.dashTimer > 0) {
                        ig.game.firstUpdateLoop && sc.stats.addMap("player", "dashTime", ig.system.rawTick);
                        this.dashTimer = this.dashTimer - ig.system.tick;
                        if (this.dashTimer <=
                            0) {
                            this.dashTimer = 0;
                            this.gui.crosshair.setSpeedFactor(1);
                            !derivedState.guarding && !derivedState.isCharging && this.defaultConfig.apply(this)
                        }
                    } else {
                        this.dashCount = 0;
                        this.updatePlayerMovement(derivedState, inputState)
                    }
                    if (this.state != 5 || derivedState.startState == 5) this.gui.crosshair.active && (this.state != 2 || derivedState.guarding) && !derivedState.isCharging ? this.gui.crosshair.getDir(this.face) : ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && derivedState.guarding && this.gui.crosshair.getDir(this.face);
                    this.handleStateStart(derivedState, inputState);
                    this.charging.executing = false;
                    !sc.model.isCutscene() &&
                        (this.state != 0 || !Vec2.isZero(this.coll.accelDir) || derivedState.guarding) ? sc.combat.showModeAura(this, this.model.currentElementMode) : sc.combat.clearModeAura(this);
                    this.parent();
                    if (this.idle.timer > 0 && this.currentAnim == "idle" && !this.isControlBlocked() && !sc.model.isCutscene() && !this.currentAction) {
                        this.idle.timer = this.idle.timer - ig.system.tick;
                        if (this.idle.timer <= 3.75 && this.skin.pet && ig.CollTools.getGroundDistance(this.skin.pet.coll, this.coll) < 32 && Vec2.dot(this.skin.pet.face, this.face) <= 0 && this.skin.pet.coll.baseZPos ==
                            this.coll.pos.z) {
                            this.idle.timer = 0;
                            this.doPetAction()
                        } else if (this.idle.timer <= 0) {
                            var idleAction = this.idle.actions[Math.floor(this.idle.actions.length * Math.random())];
                            this.setAction(idleAction)
                        }
                    } else this.idle.timer = 5 + Math.random() * 5
                }
            }
        },

        /** Snapshot the current control state into the shared inputState object. */
        gatherInput: function () {
            inputState.thrown = false;
            inputState.melee = false;
            inputState.aimStart = false;
            inputState.aim = false;
            inputState.attack = false;
            inputState.autoThrow = false;
            inputState.charge = false;
            inputState.dashX = 0;
            inputState.dashY = 0;
            inputState.guard = false;
            inputState.relativeVel = this.coll.relativeVel;
            Vec2.assign(inputState.moveDir, 0, 0);
            if (ig.game.isControlBlocked()) {
                this.explicitAimStart = 0.05;
                return inputState
            }
            inputState.charge =
                sc.control.charge();
            if (!ig.interact.isBlocked()) {
                if (this.model.getCore(sc.PLAYER_CORE.THROWING)) {
                    inputState.aimStart = sc.control.aimStart();
                    inputState.aim = sc.control.aiming();
                    inputState.thrown = sc.control.thrown();
                    inputState.autoThrow = sc.control.autoThrown()
                }
                if (!this.floating && this.model.getCore(sc.PLAYER_CORE.CLOSE_COMBAT)) {
                    inputState.attack = this.model.getCore(sc.PLAYER_CORE.THROWING) ? sc.control.attacking() : sc.control.fullScreenAttacking();
                    inputState.melee = sc.control.melee()
                }
            }
            if (this.model.getCore(sc.PLAYER_CORE.GUARD)) inputState.guard = sc.control.guarding();
            inputState.relativeVel = !this.floating && this.model.getCore(sc.PLAYER_CORE.MOVE) ? sc.control.moveDir(inputState.moveDir, this.coll.relativeVel) : 1;
            if (Vec2.isZero(inputState.moveDir)) this.moveDirStartedTimer = 0;
            else {
                var moveAngle = Vec2.angle(inputState.moveDir, this.lastMoveDir);
                if (!Vec2.isZero(this.lastMoveDir) && Math.abs(moveAngle) > Math.PI / 3) this.moveDirStartedTimer = 0;
                this.moveDirStartedTimer = this.moveDirStartedTimer + ig.system.actualTick
            }
            var canAim = false;
            if (this.charging.time >= 0 || sc.inputForcer.isSubmitted()) canAim = true;
            inputState.aim && (canAim = true);
            ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE &&
                (canAim = true);
            if (this.keepLastMoveDir <= 0 && !Vec2.equal(this.lastMoveDir, inputState.moveDir)) this.keepLastMoveDir = 2 / 60;
            if (this.keepLastMoveDir > 0) {
                this.keepLastMoveDir = this.keepLastMoveDir - ig.system.actualTick;
                if (!sc.inputForcer.isSubmitted() && this.keepLastMoveDir > 0 && (inputState.moveDir.x != 0 || inputState.moveDir.y != 0)) {
                    if (inputState.moveDir.x == 0) inputState.moveDir.x = this.lastMoveDir.x;
                    if (inputState.moveDir.y == 0) inputState.moveDir.y = this.lastMoveDir.y
                }
            }
            Vec2.assign(this.lastMoveDir, inputState.moveDir);
            if (!this.jumping && sc.control.dashing() && this.dashBlock < 0.2 && (canAim || this.moveDirStartedTimer >
                0.05)) {
                inputState.dashX = inputState.moveDir.x;
                inputState.dashY = inputState.moveDir.y
            }
            return inputState
        },

        handleDash: function (state, input, forceBlock, escape) {
            if (this.dashBlock > 0) this.dashBlock = this.dashBlock - ig.system.tick;
            if (!this.actionBlocked.dash && (input.dashX || input.dashY) && this.dashTimer <= 0.4 && this.dashBlock <= 0) {
                if (input.dashX) this.dashDir.x = input.dashX;
                if (input.dashY) this.dashDir.y = input.dashY;
                if (escape) {
                    this.doEscapeTimer = 0.3;
                    this.hitStable = sc.ATTACK_TYPE.MASSIVE
                }
            }
            state.redashReady = this.dashTimer <= (this.dashCount < this.maxDash ? 0.15 : 0.1);
            if (forceBlock) state.redashReady = false;
            if (!this.jumping && this.model.getCore(sc.PLAYER_CORE.DASH)) {
                if ((this.dashDir.x !=
                        0 || this.dashDir.y != 0) && state.redashReady) {
                    if (this.doEscapeTimer) {
                        this.doEscapeTimer = 0;
                        this.stunEscapeDash = true;
                        this.resetStunData();
                        this.hitStable = sc.ATTACK_TYPE.LIGHT;
                        sc.combat.showCombatMessage(this, sc.COMBAT_MSG_TYPE.STUN_CANCEL)
                    } else this.stunEscapeDash = false;
                    this.startDash();
                    state.redashReady = false
                }
            } else {
                this.dashCount = 0;
                this.dashTimer = this.dashDir.x = this.dashDir.y = 0
            }
        },

        handleGuard: function (state, input) {
            var canGuard = this.guard.damage < 1 && state.redashReady && !this.actionBlocked.action && (this.charging.time == -1 || this.charging.type ==
                CHARGE_TYPE_GUARD);
            state.guarding = false;
            var guardAction = this.model.getAction(sc.PLAYER_ACTION.GUARD),
                perfectGuardAction = this.model.getAction(sc.PLAYER_ACTION.PERFECT_GUARD);
            if (canGuard)
                if (input.guard) {
                    if (this.attackCounter && !this.attackResetTimer) this.attackResetTimer = 0.1;
                    if (this.currentAction != guardAction && this.currentAction != perfectGuardAction) {
                        this.dashTimer = 0;
                        if (this.perfectGuardCooldown > 0) this.setAction(guardAction);
                        else {
                            this.setAction(perfectGuardAction);
                            this.perfectGuardCooldown = 0.5
                        }
                    }
                    this.gui.crosshair.setSpeedFactor(0.25);
                    state.guarding = true;
                    ig.game.firstUpdateLoop && sc.stats.addMap("combat", "guardTime",
                        ig.system.rawTick);
                    this.recordInput && ig.vars.add("playerVar.input.guardTime", ig.system.tick)
                } else if (this.charging.time != -1 && this.charging.type == CHARGE_TYPE_GUARD) state.guarding = true;
            else if (this.currentAction == guardAction || this.currentAction == perfectGuardAction) {
                this.cancelAction();
                this.gui.crosshair.setSpeedFactor(1)
            }
            this.regenShield(state.guarding)
        },

        handleCharge: function (state, input) {
            if (this.charging.block > 0) {
                this.charging.block = this.charging.block - ig.system.actualTick;
                if (this.charging.block < 0) this.charging.block = 0
            } else if (input.charge && this.charging.time ==
                -1 && this.actionBlocked.charge != -1 && this.actionBlocked.charge < 0.2) {
                var chargeType = this.getChargeType(state, input);
                if (this.startCharge(chargeType)) {
                    this.attackResetTimer = this.attackCounter = 0;
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.dashTimer = 0;
                    this.dashDir.x = this.dashDir.y = 0;
                    this.charging.swapped = false;
                    this.charging.time = 0;
                    this.charging.cancelTime = 0
                }
            }
            state.applyCharge = 0;
            state.isCharging = false;
            if (this.charging.time >= 0) {
                state.isCharging = true;
                if (!this.actionBlocked.charge) {
                    if (this.charging.time == 0) {
                        ig.slowMotion.add(0.1,
                            0.2, "playerCharge");
                        this.showChargeEffect(1);
                        this.gui.crosshair.setSpecial(true);
                        if (!state.guarding) {
                            this.currentAction && this.cancelAction();
                            this.doPlayerAction("CHARGING")
                        }
                        this.coll.time.animStatic = true;
                        this.gui.crosshair.active ? this.gui.crosshair.getDir(this.face) : Vec2.isZero(input.moveDir) || Vec2.assign(this.face, input.moveDir)
                    }
                    Vec2.isZero(input.moveDir) || Vec2.assign(this.charging.prefDir, input.moveDir);
                    var chargeLevel = getChargeLevel(this.charging);
                    ig.game.firstUpdateLoop && sc.stats.addMap("combat", "charging", ig.system.rawTick);
                    if (!sc.autoControl.isActive() ||
                        !ig.slowMotion.hasSlowMotion("tutorialMsg")) this.charging.time = this.charging.time + ig.system.actualTick;
                    if (!sc.autoControl.isActive()) this.charging.cancelTime = this.charging.cancelTime + ig.system.actualTick;
                    if (this.charging.maxLevel < 3) this.charging.time = Math.min(this.charging.time, CHARGE_LEVEL_TIMES[this.charging.maxLevel] - 0.05);
                    var newLevel = getChargeLevel(this.charging);
                    if (chargeLevel >= 1 && newLevel != chargeLevel) {
                        this.charging.cancelTime = 0;
                        this.showChargeEffect(newLevel)
                    }
                }
                if ((this.charging.cancelTime > 1 || !input.charge) && this.charging.time >= CHARGE_LEVEL_TIMES[0]) {
                    state.applyCharge = getChargeLevel(this.charging);
                    state.isCharging = false;
                    this.clearCharge();
                    if (this.charging.cancelTime > 1) this.charging.block = 0.5
                }
            }
        },

        handleStateChange: function (state, input) {
            state.startState = -1;
            if (state.isCharging) {
                if (!this.charging.swapped)
                    if (this.charging.type != CHARGE_TYPE_GUARD && state.guarding) {
                        this.charging.swapped = true;
                        this.startCharge(CHARGE_TYPE_GUARD)
                    } else if (this.charging.type != CHARGE_TYPE_DASH && !state.guarding && this.charging.time < 0.1 && sc.control.dashing() && !Vec2.isZero(input.moveDir)) {
                    this.charging.swapped = true;
                    this.startCharge(CHARGE_TYPE_DASH)
                } else if (this.charging.type == CHARGE_TYPE_ATTACK && this.model.getCore(sc.PLAYER_CORE.THROWING) &&
                    sc.control.chargeThrowSwap()) {
                    this.charging.swapped = true;
                    this.startCharge(CHARGE_TYPE_THROW)
                } else if (this.charging.type == CHARGE_TYPE_THROW && sc.control.chargeAttackSwap()) {
                    this.charging.swapped = true;
                    this.startCharge(CHARGE_TYPE_ATTACK)
                }
            } else {
                if (this.state == 4) {
                    this.state = 0;
                    state.startState = this.state
                }
                if (state.applyCharge) {
                    this.state = 5;
                    if (this.charging.type == CHARGE_TYPE_THROW) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.gui.crosshair.setThrown()
                    }
                    state.startState = this.state
                } else if (this.state == 0 && (input.attack || input.melee)) {
                    this.state = 3;
                    state.startState = this.state
                } else if (this.state ==
                    0 && (input.aimStart || !this.explicitAimStart && !this.dashTimer && input.aim)) {
                    this.state = 1;
                    state.startState = this.state
                } else if (this.state == 1)
                    if (input.thrown || input.autoThrow && (!this.dashTimer || state.redashReady)) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.state = 2;
                        state.startState = this.state;
                        this.throwCharge = this.gui.crosshair.isThrowCharged();
                        this.gui.crosshair.setThrown();
                        this.gui.crosshair.setSpeedFactor(0.25)
                    } else {
                        if (!input.aim) {
                            this.state = 0;
                            state.startState = this.state
                        }
                    }
                else if (this.state == 2 || this.state == 3 || this.state == 5) {
                    var canThrow =
                        input.thrown && this.actionBlocked.action >= 0 && this.actionBlocked.action < 0.2 || input.autoThrow && !this.actionBlocked.action;
                    if (this.gui.crosshair.active && !this.doAttack && canThrow) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.throwCharge = this.gui.crosshair.isThrowCharged();
                        this.gui.crosshair.setThrown()
                    }
                    if ((input.attack || input.melee) && this.actionBlocked.action >= 0 && this.actionBlocked.action < 0.2) this.doAttack = true;
                    if (!this.actionBlocked.action && !Vec2.isZero(this.throwDir)) {
                        this.state = 2;
                        state.startState = this.state
                    } else if (!this.actionBlocked.action &&
                        this.doAttack) {
                        this.state = 3;
                        state.startState = this.state
                    } else if (!this.currentAction || state.guarding || !this.actionBlocked.move && (input.moveDir.x != 0 || input.moveDir.y != 0) || !this.actionBlocked.reaim && input.aim) {
                        if (this.attackCounter && !this.attackResetTimer) this.attackResetTimer = 0.1;
                        if (this.dashTimer <= 0 && !state.guarding) {
                            this.cancelAction();
                            this.clearActionBlocked()
                        }
                        if (input.aim) {
                            this.state = 1;
                            state.startState = this.state
                        } else {
                            this.state = 0;
                            state.startState = this.state;
                            this.setCurrentAnim("preIdle", true, "idle")
                        }
                    }
                }
            }
        },

        updatePlayerMovement: function (state,
            input) {
            if (state.guarding) {
                this.state == 1 && ig.game.firstUpdateLoop && sc.stats.addMap("combat", "aiming", ig.system.rawTick);
                Vec2.assignC(this.coll.accelDir, 0, 0);
                (input.moveDir.x || input.moveDir.y) && Vec2.assign(this.face, input.moveDir)
            } else if (this.state == 0 || this.state == 1) {
                this.state == 1 && ig.game.firstUpdateLoop && sc.stats.addMap("combat", "aiming", ig.system.rawTick);
                if (!this.currentAction || this.currentAction.parallelMove) {
                    Vec2.assign(this.coll.accelDir, input.moveDir);
                    this.coll.relativeVel = input.relativeVel
                }
                this.jumping && (Vec2.dot(this.coll.accelDir,
                    this.jumpForwardDir) >= 0 && Vec2.distance(this.coll.pos, this.jumpPoint) < 8 ? Vec2.add(this.coll.accelDir, this.jumpForwardDir) : Vec2.assignC(this.jumpForwardDir, 0, 0))
            } else this.jumping || Vec2.assignC(this.coll.accelDir, 0, 0)
        },

        handleStateStart: function (state, input) {
            state.startState != -1 && this.cancelJump();
            switch (state.startState) {
                case 0:
                    this.recordInput && ig.vars.set("playerVar.input.aiming", false);
                    this.setWalkAnims("normal");
                    this.setDefaultConfig(this.configs.normal);
                    this.gui.crosshair.setActive(false);
                    break;
                case 1:
                    this.recordInput &&
                        ig.vars.set("playerVar.input.aiming", true);
                    this.explicitAimStart = 0;
                    this.setDefaultConfig(this.configs.aiming);
                    this.dashTimer <= 0 && (!this.jumping && !state.guarding) && this.setAction(this.model.getAction(sc.PLAYER_ACTION.AIM_START));
                    this.setWalkAnims("aiming");
                    this.gui.crosshair.chargeActive = this.model.getCore(sc.PLAYER_CORE.CHARGE);
                    this.gui.crosshair.active || this.gui.crosshair.setActive(true);
                    this.gui.crosshair.setSpeedFactor(1);
                    break;
                case 3:
                    this.recordInput && ig.vars.set("playerVar.input.aiming", false);
                    ig.input.currentDevice ==
                        ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && (this.model.getCore(sc.PLAYER_CORE.THROWING) && sc.options.get("close-circle")) && this.gui.crosshair.setCircleGlow();
                    this.attackCounter++;
                    this.attackResetTimer = 0;
                    var actionKey;
                    if (this.attackCounter <= 3) actionKey = this.attackCounter % 2 == 1 ? "ATTACK_REV" : "ATTACK";
                    else {
                        actionKey = "ATTACK_FINISHER";
                        this.attackResetTimer = this.attackCounter = 0
                    }
                    ig.vars.add("playerVar.input.melee", 1);
                    sc.stats.addMap("player", "close", 1);
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.charging.executeLevel =
                        0;
                    this.startCloseCombatAction(actionKey, input);
                    break;
                case 2:
                    if (this.recordInput) {
                        ig.vars.set("playerVar.input.aiming", false);
                        ig.vars.add("playerVar.input.thrown", 1)
                    }
                    this.throwCounter++;
                    actionKey = this.throwCounter % 2 == 0 ? this.throwCharge ? "THROW_CHARGED_REV" : "THROW_NORMAL_REV" : this.throwCharge ? "THROW_CHARGED" : "THROW_NORMAL";
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.charging.executeLevel = 0;
                    this.startThrowAction(actionKey, input);
                    break;
                case 5:
                    actionKey = this.getChargeAction(this.charging.type, state.applyCharge);
                    if (sc.options.get("combat-art-name")) {
                        var artName =
                            this.model.getCombatArtName(sc.PLAYER_ACTION[actionKey]);
                        if (artName) {
                            var artNameBox = new sc.SmallEntityBox(this, artName.toString(), 1);
                            artNameBox.stopRumble();
                            ig.gui.addGuiElement(artNameBox)
                        }
                    }
                    this.charging.executeLevel = state.applyCharge;
                    sc.stats.addMap("combat", "specials", 1);
                    sc.stats.addMap("combat", "specials-" + this.model.currentElementMode + "-level-" + state.applyCharge, 1);
                    if (this.charging.type == CHARGE_TYPE_ATTACK) {
                        sc.stats.addMap("combat", "specialsClose", 1);
                        Vec2.isZero(this.charging.prefDir) || Vec2.assign(this.face, this.charging.prefDir);
                        this.startCloseCombatAction(actionKey, input)
                    } else if (this.charging.type ==
                        CHARGE_TYPE_THROW) {
                        sc.stats.addMap("combat", "specialsThrow", 1);
                        this.startThrowAction(actionKey, input)
                    } else if (this.charging.type == CHARGE_TYPE_GUARD) {
                        sc.stats.addMap("combat", "specialsGuard", 1);
                        this.doCombatAction(actionKey)
                    } else if (this.charging.type == CHARGE_TYPE_DASH) {
                        sc.stats.addMap("combat", "specialsDash", 1);
                        Vec2.isZero(this.charging.prefDir) || Vec2.assign(this.dashDirData, this.charging.prefDir);
                        this.gui.crosshair.setActive(false);
                        this.setAttribute("dashDir", this.dashDirData);
                        this.doCombatAction(actionKey)
                    }
            }
        },

        startThrowAction: function (action, input) {
            if (this.dashTimer > 0) this.dashBlock =
                0.3;
            this.dashTimer = 0;
            Vec2.assign(this.face, this.throwDir);
            this.coll.pos.z == this.coll.baseZPos ? this.setAttribute("dashDir", Vec2.assign(this.dashDirData, input.moveDir)) : this.setAttribute("dashDir", Vec2.assignC(this.dashDirData, 0, 0));
            Vec2.assign(this.throwDirData, this.throwDir);
            Vec2.assignC(this.throwDir, 0, 0);
            this.doCombatAction(action)
        },

        startCloseCombatAction: function (action, input) {
            if (this.dashTimer > 0) this.dashBlock = 0.3;
            this.dashTimer = 0;
            this.doAttack = false;
            this.gui.crosshair.setActive(false);
            this.coll.pos.z == this.coll.baseZPos ?
                this.setAttribute("dashDir", Vec2.assign(this.dashDirData, input.moveDir)) : this.setAttribute("dashDir", Vec2.assignC(this.dashDirData, 0, 0));
            Vec2.isZero(input.moveDir) || Vec2.assign(this.face, input.moveDir);
            this.doCombatAction(action)
        },

        startDash: function () {
            if (this.state == 3) {
                this.recordInput && ig.vars.add("playerVar.input.attackDashCancel", 1);
                sc.stats.addMap("player", "atkDashCancel", 1)
            }
            this.attackCounter = 0;
            this.dashCount++;
            this.doAttack = this.dashPerfect = false;
            Vec2.assignC(this.throwDir, 0, 0);
            this.gui.crosshair.active || Vec2.assign(this.face,
                this.dashDir);
            this.setAttribute("dashDir", Vec2.assign(this.dashDirData, this.dashDir));
            this.dashDir.x = this.dashDir.y = 0;
            if (this.charging.time >= 0) {
                if (this.charging.time <= 0.2) return;
                this.clearCharge();
                this.charging.block = 0.5
            }
            if (this.state == 2) this.state = 1;
            else if (this.state == 3) {
                this.setWalkAnims("normal");
                this.setDefaultConfig(this.configs.normal);
                this.state = 0
            }
            if (this.dashCount <= this.maxDash) {
                sc.stats.addMap("player", "dash", 1);
                sc.stats.addMap("player", "steps", 3)
            }
            this.clearActionBlocked();
            this.gui.crosshair.reducePrecision(0.2);
            this.gui.crosshair.setSpeedFactor(0.5);
            this.jumpingEnabled = false;
            this.dashTimer = sc.newgame.get("dash-1") ? 0.26 : 0.36;
            this.onMoveEffect("dash");
            var dashAction = this.dashCount <= this.maxDash ? this.getMaxDashes() != 3 ? "DASH_LONG" : "DASH" : "DASH_SLOW";
            this.playerTrack.lastPlayerAction = dashAction;
            this.doPlayerAction(dashAction);
            this.dashCount <= this.maxDash && sc.combat.showModeDash(this, this.model.currentElementMode)
        },

        deferredUpdate: function () {
            if (this.interactObject && this.interactObject.onInteractObjectDeferredUpdate) this.interactObject.onInteractObjectDeferredUpdate(this)
        },

        postActionUpdate: function () {
            if (this.interactObject && this.interactObject.onInteractObjectPostActionUpdate) this.interactObject.onInteractObjectPostActionUpdate()
        },

        cancelInteract: function () {
            if (this.interactObject) {
                this.interactObject = null;
                if (sc.control.aiming()) this.explicitAimStart = 0.05
            }
        },

        onPreDamageModification: function (target, shieldConnections, unk1, unk2, damageData, shieldResult) {
            this.recordInput && (shieldResult ? ig.vars.add("playerVar.input.shieldedHits", 1) : ig.vars.add("playerVar.input.hits", 1));
            if (shieldResult) {
                sc.stats.addMap("combat", "shieldedHits", 1);
                if (shieldResult == sc.SHIELD_RESULT.PERFECT) {
                    ig.vars.add("playerVar.input.perfectShield",
                        1);
                    sc.stats.addMap("combat", "perfectShield", 1);
                    if (this.params.getModifier("PERFECT_GUARD_RESET") >= 1) {
                        this.perfectGuardCooldown = 0;
                        for (shieldConnections = this.shieldsConnections.length; shieldConnections--;) this.shieldsConnections[shieldConnections].resetPerfectGuardTime()
                    }
                }
            } else sc.stats.addMap("combat", "damageHits", 1);
            if (damageData && shieldResult != sc.SHIELD_RESULT.PERFECT && !ig.vars.get("g.newgame.ignoreLeaMustDie"))
                if (sc.newgame.get("lea-must-die")) damageData.damage = Math.max(damageData.damage, this.params.currentHp || 1);
                else if (sc.newgame.get("enemy-damage-15")) damageData.damage = Math.round(damageData.damage *
                1.5);
            else if (sc.newgame.get("enemy-damage-2")) damageData.damage = damageData.damage * 2;
            else if (sc.newgame.get("enemy-damage-4")) damageData.damage = damageData.damage * 4;
            sc.arena.onPreDamageModification(damageData, shieldResult, target);
            return false
        },

        onPlayerShieldBreak: function () {
            sc.stats.addMap("combat", "shieldBreaks", 1);
            this.state = 4;
            this.cancelAction()
        },

        onPerfectDash: function () {
            if (!this.dashPerfect) {
                sc.stats.addMap("player", "perfectDash", 1);
                sc.arena.onPerfectDodge();
                if (this.model.name == "Lea" && sc.newgame.get("witch-time") && !ig.vars.get("tmp.slowMotionActive")) {
                    sc.combat.showPerfectDashEffect(this);
                    var proxy = sc.ProxyTools.getProxy("evadeSloMo", this);
                    proxy && proxy.spawn(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, this, this.face, true);
                    this.invincibleTimer = 4
                }
                this.dashPerfect = true
            }
        },

        onDamageTaken: function (damage, shieldResult) {
            shieldResult != sc.SHIELD_RESULT.PERFECT && !sc.model.isCutscene() && sc.stats.addMap("combat", "damageTaken", damage)
        },

        onHeal: function (unk, amount) {
            sc.stats.addMap("combat", "healed", amount)
        },

        onTargetHit: function (target, hitData, damageData, unk) {
            if (!ig.vars.get("playerVar.damageStatsIgnore")) {
                sc.stats.addMap("combat", "damageGiven", damageData.damage);
                sc.stats.setMapMax("combat",
                    "maxDamage", damageData.damage)
            }
            this.combatStats.lastTarget = target;
            if (damageData.critical) {
                sc.stats.addMap("combat", "critHits", 1);
                hitData.ballDamage ? sc.stats.addMap("combat", "critHitsThrow", 1) : sc.stats.addMap("combat", "critHitsClose", 1)
            }
            if (hitData.spFactor) {
                hitData.ballDamage || sc.stats.addMap("player", "closeHits", 1);
                this.model.onTargetHit(target, hitData, damageData)
            }
            sc.arena.onTargetHit(hitData, damageData, unk, target);
            this.parent(target, hitData, damageData, unk)
        },

        onJump: function (jumpHeight, unk) {
            sc.stats.addMap("player", "jumps", 1);
            this.maxJumpHeight = this.coll.pos.z + jumpHeight;
            Vec2.assign(this.jumpPoint, this.coll.pos);
            jumpHeight >= 16 ? Vec2.assign(this.jumpForwardDir,
                this.coll.accelDir) : Vec2.assignC(this.jumpForwardDir, 0, 0);
            this.parent(jumpHeight, unk)
        },

        onPhysicsSquish: function (squishData) {
            if (squishData.squishRespawn) {
                Vec3.assign(this.respawn.pos, this.mapStartPos);
                this.quickFall(ig.TERRAIN.HOLE)
            }
        },

        varsChanged: function () {
            this.condition && this.condition.evaluate();
            if (!this.floating && ig.vars.get("playerVar.staticFloat")) {
                this.floating = true;
                this.configs.normal.overwrite("floatHeight", 6);
                this.configs.aiming.overwrite("floatHeight", 6);
                this.setDefaultConfig(this.configs.normal)
            } else if (this.floating &&
                !ig.vars.get("playerVar.staticFloat")) {
                this.floating = false;
                this.configs.normal.clearOverwrite();
                this.configs.aiming.clearOverwrite();
                this.setDefaultConfig(this.configs.normal)
            }
            if (this.recordInput != ig.vars.get("playerVar.recordInput"))
                if (this.recordInput = ig.vars.get("playerVar.recordInput")) {
                    ig.vars.set("playerVar.input.thrown", 0);
                    ig.vars.set("playerVar.input.aiming", false);
                    ig.vars.set("playerVar.input.guardTime", 0);
                    ig.vars.set("playerVar.input.shieldedHits", 0);
                    ig.vars.set("playerVar.input.hits", 0);
                    ig.vars.set("playerVar.input.perfectShield", 0);
                    ig.vars.set("playerVar.input.attackDashCancel", 0);
                    ig.vars.set("playerVar.input.melee", 0)
                }
        },

        modelChanged: function (model, msg, data) {
            if (model == this.params) msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED && this.updateModelStats();
            else if (model == this.model)
                if (msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) {
                    this.copyModelSkills();
                    this.updateModelStats()
                } else msg == sc.PLAYER_MSG.CONFIG_CHANGED ? this.initModel() : msg == sc.PLAYER_MSG.STATS_CHANGED ? this.updateModelStats() : msg == sc.PLAYER_MSG.ITEM_USED ? this.itemConsumer.activateItemEffect(this,
                    this.model, data) : msg == sc.PLAYER_MSG.ITEM_TOGGLED && this.updateModelStats();
            else model == sc.playerSkins ? data == "Appearance" ? this.updateAnimSheet() : data == "StepEffect" ? this.updateSkinStepFx() : data == "Aura" ? this.updateSkinAura() : data == "Pet" && this.updateSkinPet(true) : model == sc.model && msg == sc.GAME_MODEL_MSG.STATE_CHANGED && this.updateAnimSheet()
        },

        copyModelSkills: function () {
            this.proxies = this.model.getBalls()
        },

        doQuickRespawn: function (terrain, unk1, unk2) {
            (terrain == ig.TERRAIN.WATER || terrain == ig.TERRAIN.HOLE || terrain == ig.TERRAIN.COAL || terrain == ig.TERRAIN.QUICKSAND || terrain == ig.TERRAIN.HIGHWAY) &&
                sc.stats.addMap("player", "respawns", 1);
            terrain == ig.TERRAIN.WATER ? sc.stats.addMap("player", "waterDeath", 1) : terrain == ig.TERRAIN.COAL ? sc.stats.addMap("player", "coalDeath", 1) : terrain == ig.TERRAIN.QUICKSAND ? sc.stats.addMap("player", "sandDeath", 1) : terrain == ig.TERRAIN.HOLE ? sc.stats.addMap("player", "holeDeath", 1) : terrain == ig.TERRAIN.HIGHWAY && sc.stats.addMap("player", "highwayDeath", 1);
            this.parent(terrain, unk1, unk2)
        },

        onRespawnEnd: function () {
            for (var entities = ig.game.getOverlapEntities(this), index = entities.length; index--;) {
                var entity = entities[index];
                (entity instanceof ig.ENTITY.WavePushPullBlock ||
                    entity instanceof ig.ENTITY.PushPullBlock) && entity.resetPos()
            }
        },

        isThrowCharged: function () {
            return this.gui.crosshair.isThrowCharged()
        },

        setOverrideBall: function (ball) {
            this.overrideBall = ball
        },

        useItem: function (itemId) {
            this.itemConsumer.runItemUseAction(this, this.model, itemId)
        },

        onVarAccess: function (path, access) {
            return access[1] == "hasElementShield" ? this.hasShield("elementOrbShield") : this.parent(path, access)
        }
    });
    window.checkPlayerPos = function () {
        var player = ig.game.playerEntity;
        if (player && !player.debugCheck && player.coll.pos.x == 1) player.debugCheck = true
    }
});
ig.baked = !0;
