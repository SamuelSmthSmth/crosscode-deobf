ig.module("game.feature.player.entities.player").requires("impact.feature.env-particles.env-particles", "game.feature.combat.entities.ball", "game.feature.player.entities.player-base", "game.feature.combat.entities.combatant", "game.feature.player.entities.crosshair", "game.feature.player.entities.player-pet", "game.feature.player.player-level-notifier", "game.feature.player.item-consumption", "game.feature.new-game.new-game-model").defines(function() {
    function b(a) {
        for (var b = h.length, c = 0; b--;)
            if (a.time >=
                h[b]) {
                c = b + 1;
                break
            } return c = Math.min(a.maxLevel, c)
    }

    function a(a, b) {
        if (a[b] > 0) {
            a[b] = a[b] - ig.system.tick;
            a[b] <= 0 && (a[b] = 0)
        }
    }
    Vec2.create();
    var d = {
            actionKey: "ATTACK_SPECIAL"
        },
        c = {
            actionKey: "THROW_SPECIAL"
        },
        e = {
            actionKey: "GUARD_SPECIAL"
        },
        f = {
            actionKey: "DASH_SPECIAL"
        },
        g = ["Neutral", "Heat", "Cold", "Shock", "Wave"],
        h = [0.25, 0.5, 1];
    sc.PLAYER_ZOOM = 1;
    var i = {
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
        j = {};
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
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
        initModel: function() {
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
        replaceAnimSheet: function(a) {
            this.animSheetReplace = a;
            this.updateAnimSheet()
        },
        initIdleActions: function() {
            this.idle.actions.length = 0;
            if (this.model.name == "Lea") {
                var a = sc.gameCode.isEnabled("caramelldansen") ?
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
                this.idle.actions.push(a)
            }
        },
        doPetAction: function() {
            var a = [{
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
                b = this.skin.pet;
            if (b.petSkin.petOffsets) a = b.petSkin.petOffsets;
            a = new ig.Action("PLAYER_IDLE", [{
                type: "SET_FACE_TO_ENTITY",
                entity: b,
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
                entity: b,
                offsets: a,
                maxTime: 0.4,
                forceTime: true
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: b,
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
            b = [{
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
            this.skin.pet.coll.float.height ? b.push({
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
            }) : b.push({
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
            b = new ig.Action("PLAYER_IDLE", b, false, false);
            this.setAction(a);
            this.skin.pet.setAction(b)
        },
        updateAnimSheet: function(a) {
            var b = null,
                c = sc.playerSkins.getCurrentSkin("Appearance");
            if (c && c.loaded)
                if (c.noHide) b = c;
                else if ((!sc.model.isCutscene() ||
                    ig.game.events.hasBlockingEventCallHint("SKIN_ALLOWED")) && !ig.dreamFx.isActive()) b = c;
            if (b != this.skin.appearance) {
                if (!a) {
                    if (this.skin.appearanceFx) {
                        this.skin.appearanceFx.setCallback(null);
                        this.skin.appearanceFx.stop();
                        this.skin.appearanceFx = null
                    }
                    b ? this.skin.appearanceFx = b.fx.spawnOnTarget("skinOn", this, {
                        callback: this
                    }) : this.skin.appearance.fx.spawnOnTarget("skinOff", this)
                }
                this.skin.appearance = b
            }
            if (this.animSheetReplace) this.animSheet = this.animSheetReplace;
            else {
                a = this.model.animSheet;
                if (this.skin.appearance &&
                    !this.skin.appearanceFx) a = this.skin.appearance.animSheet;
                this.animSheet = a
            }
        },
        updateSkinStepFx: function() {
            var a = sc.playerSkins.getCurrentSkin("StepEffect");
            this.skin.stepFx = a && a.loaded ? a.fx : null
        },
        updateSkinAura: function() {
            var a = sc.playerSkins.getCurrentSkin("Aura");
            this.skin.auraFx = a && a.loaded ? a.fx : null;
            this.skin.auraFxHandle && this.skin.auraFxHandle.stop();
            this.skin.auraFxHandle = null;
            if (this.skin.auraFx) {
                var a = "aura",
                    b = g[this.model.currentElementMode];
                this.skin.auraFx.hasEffect(a + b) && (a = a + b);
                this.skin.auraFxHandle =
                    this.skin.auraFx.spawnOnTarget(a, this, {
                        duration: -1
                    })
            }
        },
        updateSkinPet: function(a) {
            if (this.skin.pet) {
                this.skin.pet.remove();
                this.skin.pet = null
            }
            var b = sc.playerSkins.getCurrentSkin("Pet");
            if (b && b.loaded) this.skin.pet = ig.game.spawnEntity(sc.PlayerPetEntity, 0, 0, 0, {
                petSkin: b
            }, a || false)
        },
        onEffectEvent: function(a) {
            if (a == this.skin.appearanceFx && a.state >= ig.EFFECT_STATE.POST_LOOP) {
                this.skin.appearanceFx = null;
                this.updateAnimSheet()
            }
        },
        regenPvp: function(a) {
            this.parent(a);
            this.model.addElementLoad(-1E3)
        },
        updateModelStats: function(a) {
            this.regenFactor =
                this.params.getModifier("HP_REGEN");
            if (sc.newgame.get("combat-regen-half")) this.regenFactor = this.regenFactor / 2;
            else if (sc.newgame.get("combat-regen-zero")) this.regenFactor = 0;
            this.stunData.stunEscapeTime = 1.5;
            this.gui.crosshair && this.gui.crosshair.setBaseSpeedFactor(1 + this.params.getModifier("AIM_SPEED"));
            if (this.params) this.params.criticalDmgFactor = 1.5 + this.params.getModifier("CRITICAL_DMG");
            this.stunThreshold = this.params.getModifier("STUN_THRESHOLD");
            this.updateAnimSheet(a);
            this.configs.aiming.overwrite("maxVel",
                100 * (1 + this.params.getModifier("AIMING_MOVEMENT")));
            this.maxDash = Math.round(this.getMaxDashes() + this.params.getModifier("DASH_STEP"));
            this.spikeDmg.baseFactor = this.params.getModifier("SPIKE_DMG")
        },
        getMaxDashes: function() {
            return this.model.name != "Lea" ? 3 : sc.newgame.get("dash-1") ? 1 : 3
        },
        hasCameraTarget: function(a) {
            return this.cameraTargets.indexOf(a) != -1
        },
        addCameraTarget: function(a, b) {
            if (this.cameraTargets.indexOf(a) == -1) {
                this.cameraTargets.push(a);
                this._updateCameraHandle(b || "NORMAL")
            }
        },
        removeCameraTarget: function(a,
            b) {
            this.cameraTargets.erase(a);
            this._updateCameraHandle(b || "NORMAL")
        },
        removeAllCameraTargets: function(a) {
            this.cameraTargets.length = 0;
            this._updateCameraHandle(a || "NORMAL")
        },
        _updateCameraHandle: function(a) {
            var b = null;
            if (this.cameraTargets.length == 0) b = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this), 0, 0);
            else {
                b = [this];
                b.push.apply(b, this.cameraTargets);
                b = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget(b, true), 0, 0)
            }
            b.keepZoomFocusAligned = true;
            sc.PLAYER_ZOOM != 1 && b.setZoom(sc.PLAYER_ZOOM,
                0.1);
            this.cameraHandle ? ig.camera.replaceTarget(this.cameraHandle, b, a, KEY_SPLINES.EASE_IN_OUT) : ig.camera.pushTarget(b, a, KEY_SPLINES.EASE_IN_OUT);
            this.cameraHandle = b
        },
        onPlayerPlaced: function() {
            if (ig.camera) {
                for (; ig.camera.getTargetCount() > 0;) ig.camera.popTarget();
                this._updateCameraHandle()
            }
            sc.party.onMapEnter();
            Vec3.assign(this.respawn.pos, this.coll.pos);
            Vec3.assign(this.mapStartPos, this.coll.pos);
            this.skin.pet && this.skin.pet.resetStartPos()
        },
        onMoveEffect: function(a) {
            a == "step" && sc.stats.addMap("player",
                "steps", 1);
            this.skin.stepFx && this.skin.stepFx.hasEffect(a) && (a == "jump" ? this.skin.stepFx.spawnOnTarget("jump", this, {
                angle: Vec2.clockangle(this.face)
            }) : this.skin.stepFx.spawnOnTarget(a, this));
            sc.gameCode.isEnabled("speedlines") && (a == "step" ? ig.game.effects.speedlines.spawnOnTarget("speedlinesWalk", this, {
                duration: 0.2,
                align: "CENTER"
            }) : a == "dash" ? ig.game.effects.speedlines.spawnOnTarget("speedlinesDash", this, {
                duration: 0.3,
                align: "CENTER"
            }) : a == "jump" && ig.game.effects.speedlines.spawnOnTarget("speedlinesJump",
                this, {
                    duration: 0.5,
                    align: "CENTER"
                }))
        },
        setAction: function(a, b, c) {
            this.coll.relativeVel = 1;
            this.parent(a, b, c)
        },
        doCombatAction: function(a) {
            this.doPlayerAction(a);
            this.model.increaseActionHeat(sc.PLAYER_ACTION[a]);
            this.actionBlocked.action = this.actionBlocked.charge = this.actionBlocked.move = this.actionBlocked.reaim = this.actionBlocked.dash = 100;
            sc.gameCode.isEnabled("speedlines") && ig.game.effects.speedlines.spawnOnTarget("speedlinesDash", this, {
                duration: 0.3,
                align: "CENTER"
            })
        },
        setActionBlocked: function(a) {
            this.actionBlocked.action =
                a.action;
            this.actionBlocked.charge = a.charge || a.action;
            this.actionBlocked.dash = a.dash;
            this.actionBlocked.reaim = a.reaim;
            this.actionBlocked.move = a.move
        },
        clearActionBlocked: function() {
            this.charging.executeLevel = 0;
            this.actionBlocked.action = this.actionBlocked.move = this.actionBlocked.charge = this.actionBlocked.reaim = this.actionBlocked.dash = 0
        },
        showChargeEffect: function(a) {
            this.charging.fx.charge(this.model.currentElementMode, a);
            this.params.notifySpConsume(sc.PLAYER_SP_COST[a - 1]);
            this.cameraHandle.setZoom(sc.PLAYER_ZOOM +
                a * 0.5 / 3, 0.5, KEY_SPLINES.JUMPY);
            if (a >= 2) {
                a = new ig.ZoomBlurHandle(a == 2 ? "LIGHT" : "MEDIUM", 0.2, 0, 0.3);
                ig.screenBlur.addZoom(a)
            }
        },
        clearCharge: function() {
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
        onKill: function(a) {
            this.clearCharge();
            this.parent(a);
            sc.Model.removeObserver(this.model,
                this);
            sc.Model.removeObserver(sc.model, this);
            sc.Model.removeObserver(this.params, this);
            sc.Model.removeObserver(sc.playerSkins, this);
            sc.combat.removeActiveCombatant(this);
            if (!a) {
                a = ig.vars.get("stats.deaths") || 0;
                ig.game.respawn();
                ig.vars.set("stats.deaths", a + 1)
            }
        },
        show: function() {
            this.parent();
            this.gui.crosshair = ig.game.spawnEntity(ig.ENTITY.Crosshair, 0, 0, 0, {
                thrower: this,
                controller: new sc.PlayerCrossHairController
            });
            this.updateModelStats();
            this.updateSkinAura()
        },
        hide: function() {
            this.parent();
            if (this.skin.auraFxHandle) {
                this.skin.auraFxHandle.stop();
                this.skin.auraFxHandle = null
            }
        },
        getChargeType: function(a, b) {
            return this.dashTimer > 0.33 ? f : a.guarding || sc.control.guarding() && Vec2.isZero(b.moveDir) ? this.model.getCore(sc.PLAYER_CORE.GUARD) ? e : d : sc.control.dashHold() ? f : this.state == 1 || (this.state == 2 || this.state == 5) && this.model.getCore(sc.PLAYER_CORE.THROWING) && sc.control.aiming() ? c : d
        },
        getCurrentChargeLevel: function() {
            return this.charging.time <= 0 ? 0 : b(this.charging)
        },
        getMaxChargeLevel: function(a) {
            var b = 0,
                a = a.actionKey,
                c = 3;
            for (this.model.name == "Lea" && (sc.newgame.get("combat-arts-level-1") ?
                    c = 1 : sc.newgame.get("combat-arts-level-2") && (c = 2)); b < c && this.model.getAction(sc.PLAYER_ACTION[a + (b + 1)]);) b++;
            return b
        },
        startCharge: function(a) {
            if (!this.model.getCore(sc.PLAYER_CORE.SPECIAL) || !this.model.getCore(sc.PLAYER_CORE.CLOSE_COMBAT) && a == d) return false;
            var b = this.getMaxChargeLevel(a),
                e = this.model.params.getSp(),
                f = 0;
            e >= sc.PLAYER_SP_COST[2] ? f = 3 : e >= sc.PLAYER_SP_COST[1] ? f = 2 : e >= sc.PLAYER_SP_COST[0] && (f = 1);
            b = Math.min(b, f);
            if (f == 0) {
                if (!this.charging.msg || this.charging.msg.isFinished()) {
                    f = ig.lang.get("sc.gui.combat.no-sp");
                    this.charging.msg = new sc.SmallEntityBox(this, f, 0.5);
                    ig.gui.addGuiElement(this.charging.msg)
                }
            } else {
                this.charging.msg && !this.charging.msg.isFinished() && this.charging.msg.remove();
                this.charging.msg = null
            }
            if (b == 0) return false;
            this.charging.maxLevel = b;
            this.charging.type = a;
            Vec2.assignC(this.charging.prefDir, 0, 0);
            a == c ? this.quickStateSwitch(1) : a == d && this.quickStateSwitch(3);
            return true
        },
        getChargeAction: function(a, b) {
            for (var c = a.actionKey; b && !this.model.getAction(sc.PLAYER_ACTION[c + b]);) b--;
            if (!b) return 0;
            var d = sc.PLAYER_SP_COST[b - 1];
            sc.newgame.get("infinite-sp") || this.model.params.consumeSp(d);
            return c + b
        },
        quickStateSwitch: function(a) {
            this.state = a;
            if (a == 1) {
                this.gui.crosshair.setActive(true);
                this.setDefaultConfig(this.configs.aiming)
            } else {
                this.gui.crosshair.setActive(false);
                this.setDefaultConfig(this.configs.normal)
            }
        },
        isElementChangeBlocked: function() {
            return this.isControlBlocked() || this.charging.time != -1
        },
        isControlBlocked: function() {
            return this.hasStun() || this.params.isDefeated() || this.interactObject ||
                this.currentAction && this.currentAction.eventAction
        },
        update: function() {
            this.playerTrack.lastPlayerAction = null;
            for (var b = this.cameraTargets.length; b--;) {
                var c = this.cameraTargets[b];
                c._killed && this.removeCameraTarget(c)
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
                a(this.actionBlocked, "charge");
                a(this.actionBlocked, "action");
                a(this.actionBlocked, "dash");
                a(this.actionBlocked, "reaim");
                a(this.actionBlocked, "move");
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
                b = this.gatherInput();
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
                    this.hasStun() && this.stunData.time >= this.stunData.stunEscapeTime ? this.handleDash(j, b, true, true) : this.hasStun() && this.damageTimer <= 0.2 ? this.handleDash(j, b, true) : this.dashDir.x = this.dashDir.y = 0;
                    this.attackResetTimer = this.attackCounter = 0;
                    b = this.currentAction && this.currentAction.eventAction ? 0 : 4;
                    if (this.state != b) {
                        this.state = b;
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
                        c = (c = (c = this.coll._collData && this.coll._collData.groundEntry) && c.parentColl || c) && c.entity;
                        (!c || !c.isDefeated || !c.isDefeated()) && this.levelUpNotifier.runLevelUpScene(this, this.model)
                    }
                    if (this.currentAction && this.currentAction.name === "PLAYER_IDLE" && !Vec2.isZero(b.moveDir)) {
                        this.cancelAction();
                        this.skin.pet && (this.skin.pet.currentAction && this.skin.pet.currentAction.name === "PLAYER_IDLE") && this.skin.pet.cancelAction()
                    }
                    this.currentAction || this.clearActionBlocked();
                    if (!this.jumping && this.coll.pos.z == this.coll.baseZPos) this.maxJumpHeight = -1;
                    this.handleDash(j, b);
                    this.handleGuard(j, b);
                    this.handleCharge(j, b);
                    this.handleStateChange(j, b);
                    if (this.dashTimer > 0) {
                        ig.game.firstUpdateLoop && sc.stats.addMap("player", "dashTime", ig.system.rawTick);
                        this.dashTimer = this.dashTimer - ig.system.tick;
                        if (this.dashTimer <=
                            0) {
                            this.dashTimer = 0;
                            this.gui.crosshair.setSpeedFactor(1);
                            !j.guarding && !j.isCharging && this.defaultConfig.apply(this)
                        }
                    } else {
                        this.dashCount = 0;
                        this.updatePlayerMovement(j, b)
                    }
                    if (this.state != 5 || j.startState == 5) this.gui.crosshair.active && (this.state != 2 || j.guarding) && !j.isCharging ? this.gui.crosshair.getDir(this.face) : ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && j.guarding && this.gui.crosshair.getDir(this.face);
                    this.handleStateStart(j, b);
                    this.charging.executing = false;
                    !sc.model.isCutscene() &&
                        (this.state != 0 || !Vec2.isZero(this.coll.accelDir) || j.guarding) ? sc.combat.showModeAura(this, this.model.currentElementMode) : sc.combat.clearModeAura(this);
                    this.parent();
                    if (this.idle.timer > 0 && this.currentAnim == "idle" && !this.isControlBlocked() && !sc.model.isCutscene() && !this.currentAction) {
                        this.idle.timer = this.idle.timer - ig.system.tick;
                        if (this.idle.timer <= 3.75 && this.skin.pet && ig.CollTools.getGroundDistance(this.skin.pet.coll, this.coll) < 32 && Vec2.dot(this.skin.pet.face, this.face) <= 0 && this.skin.pet.coll.baseZPos ==
                            this.coll.pos.z) {
                            this.idle.timer = 0;
                            this.doPetAction()
                        } else if (this.idle.timer <= 0) {
                            b = this.idle.actions[Math.floor(this.idle.actions.length * Math.random())];
                            this.setAction(b)
                        }
                    } else this.idle.timer = 5 + Math.random() * 5
                }
            }
        },
        gatherInput: function() {
            i.thrown = false;
            i.melee = false;
            i.aimStart = false;
            i.aim = false;
            i.attack = false;
            i.autoThrow = false;
            i.charge = false;
            i.dashX = 0;
            i.dashY = 0;
            i.guard = false;
            i.relativeVel = this.coll.relativeVel;
            Vec2.assign(i.moveDir, 0, 0);
            if (ig.game.isControlBlocked()) {
                this.explicitAimStart = 0.05;
                return i
            }
            i.charge =
                sc.control.charge();
            if (!ig.interact.isBlocked()) {
                if (this.model.getCore(sc.PLAYER_CORE.THROWING)) {
                    i.aimStart = sc.control.aimStart();
                    i.aim = sc.control.aiming();
                    i.thrown = sc.control.thrown();
                    i.autoThrow = sc.control.autoThrown()
                }
                if (!this.floating && this.model.getCore(sc.PLAYER_CORE.CLOSE_COMBAT)) {
                    i.attack = this.model.getCore(sc.PLAYER_CORE.THROWING) ? sc.control.attacking() : sc.control.fullScreenAttacking();
                    i.melee = sc.control.melee()
                }
            }
            if (this.model.getCore(sc.PLAYER_CORE.GUARD)) i.guard = sc.control.guarding();
            i.relativeVel = !this.floating && this.model.getCore(sc.PLAYER_CORE.MOVE) ? sc.control.moveDir(i.moveDir, this.coll.relativeVel) : 1;
            if (Vec2.isZero(i.moveDir)) this.moveDirStartedTimer = 0;
            else {
                var a = Vec2.angle(i.moveDir, this.lastMoveDir);
                if (!Vec2.isZero(this.lastMoveDir) && Math.abs(a) > Math.PI / 3) this.moveDirStartedTimer = 0;
                this.moveDirStartedTimer = this.moveDirStartedTimer + ig.system.actualTick
            }
            a = false;
            if (this.charging.time >= 0 || sc.inputForcer.isSubmitted()) a = true;
            i.aim && (a = true);
            ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE &&
                (a = true);
            if (this.keepLastMoveDir <= 0 && !Vec2.equal(this.lastMoveDir, i.moveDir)) this.keepLastMoveDir = 2 / 60;
            if (this.keepLastMoveDir > 0) {
                this.keepLastMoveDir = this.keepLastMoveDir - ig.system.actualTick;
                if (!sc.inputForcer.isSubmitted() && this.keepLastMoveDir > 0 && (i.moveDir.x != 0 || i.moveDir.y != 0)) {
                    if (i.moveDir.x == 0) i.moveDir.x = this.lastMoveDir.x;
                    if (i.moveDir.y == 0) i.moveDir.y = this.lastMoveDir.y
                }
            }
            Vec2.assign(this.lastMoveDir, i.moveDir);
            if (!this.jumping && sc.control.dashing() && this.dashBlock < 0.2 && (a || this.moveDirStartedTimer >
                    0.05)) {
                i.dashX = i.moveDir.x;
                i.dashY = i.moveDir.y
            }
            return i
        },
        handleDash: function(a, b, c, d) {
            if (this.dashBlock > 0) this.dashBlock = this.dashBlock - ig.system.tick;
            if (!this.actionBlocked.dash && (b.dashX || b.dashY) && this.dashTimer <= 0.4 && this.dashBlock <= 0) {
                if (b.dashX) this.dashDir.x = b.dashX;
                if (b.dashY) this.dashDir.y = b.dashY;
                if (d) {
                    this.doEscapeTimer = 0.3;
                    this.hitStable = sc.ATTACK_TYPE.MASSIVE
                }
            }
            a.redashReady = this.dashTimer <= (this.dashCount < this.maxDash ? 0.15 : 0.1);
            if (c) a.redashReady = false;
            if (!this.jumping && this.model.getCore(sc.PLAYER_CORE.DASH)) {
                if ((this.dashDir.x !=
                        0 || this.dashDir.y != 0) && a.redashReady) {
                    if (this.doEscapeTimer) {
                        this.doEscapeTimer = 0;
                        this.stunEscapeDash = true;
                        this.resetStunData();
                        this.hitStable = sc.ATTACK_TYPE.LIGHT;
                        sc.combat.showCombatMessage(this, sc.COMBAT_MSG_TYPE.STUN_CANCEL)
                    } else this.stunEscapeDash = false;
                    this.startDash();
                    a.redashReady = false
                }
            } else {
                this.dashCount = 0;
                this.dashTimer = this.dashDir.x = this.dashDir.y = 0
            }
        },
        handleGuard: function(a, b) {
            var c = this.guard.damage < 1 && a.redashReady && !this.actionBlocked.action && (this.charging.time == -1 || this.charging.type ==
                e);
            a.guarding = false;
            var d = this.model.getAction(sc.PLAYER_ACTION.GUARD),
                f = this.model.getAction(sc.PLAYER_ACTION.PERFECT_GUARD);
            if (c)
                if (b.guard) {
                    if (this.attackCounter && !this.attackResetTimer) this.attackResetTimer = 0.1;
                    if (this.currentAction != d && this.currentAction != f) {
                        this.dashTimer = 0;
                        if (this.perfectGuardCooldown > 0) this.setAction(d);
                        else {
                            this.setAction(f);
                            this.perfectGuardCooldown = 0.5
                        }
                    }
                    this.gui.crosshair.setSpeedFactor(0.25);
                    a.guarding = true;
                    ig.game.firstUpdateLoop && sc.stats.addMap("combat", "guardTime",
                        ig.system.rawTick);
                    this.recordInput && ig.vars.add("playerVar.input.guardTime", ig.system.tick)
                } else if (this.charging.time != -1 && this.charging.type == e) a.guarding = true;
            else if (this.currentAction == d || this.currentAction == f) {
                this.cancelAction();
                this.gui.crosshair.setSpeedFactor(1)
            }
            this.regenShield(a.guarding)
        },
        handleCharge: function(a, c) {
            if (this.charging.block > 0) {
                this.charging.block = this.charging.block - ig.system.actualTick;
                if (this.charging.block < 0) this.charging.block = 0
            } else if (c.charge && this.charging.time ==
                -1 && this.actionBlocked.charge != -1 && this.actionBlocked.charge < 0.2) {
                var d = this.getChargeType(a, c);
                if (this.startCharge(d)) {
                    this.attackResetTimer = this.attackCounter = 0;
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.dashTimer = 0;
                    this.dashDir.x = this.dashDir.y = 0;
                    this.charging.swapped = false;
                    this.charging.time = 0;
                    this.charging.cancelTime = 0
                }
            }
            a.applyCharge = 0;
            a.isCharging = false;
            if (this.charging.time >= 0) {
                a.isCharging = true;
                if (!this.actionBlocked.charge) {
                    if (this.charging.time == 0) {
                        ig.slowMotion.add(0.1,
                            0.2, "playerCharge");
                        this.showChargeEffect(1);
                        this.gui.crosshair.setSpecial(true);
                        if (!a.guarding) {
                            this.currentAction && this.cancelAction();
                            this.doPlayerAction("CHARGING")
                        }
                        this.coll.time.animStatic = true;
                        this.gui.crosshair.active ? this.gui.crosshair.getDir(this.face) : Vec2.isZero(c.moveDir) || Vec2.assign(this.face, c.moveDir)
                    }
                    Vec2.isZero(c.moveDir) || Vec2.assign(this.charging.prefDir, c.moveDir);
                    d = b(this.charging);
                    ig.game.firstUpdateLoop && sc.stats.addMap("combat", "charging", ig.system.rawTick);
                    if (!sc.autoControl.isActive() ||
                        !ig.slowMotion.hasSlowMotion("tutorialMsg")) this.charging.time = this.charging.time + ig.system.actualTick;
                    if (!sc.autoControl.isActive()) this.charging.cancelTime = this.charging.cancelTime + ig.system.actualTick;
                    if (this.charging.maxLevel < 3) this.charging.time = Math.min(this.charging.time, h[this.charging.maxLevel] - 0.05);
                    var e = b(this.charging);
                    if (d >= 1 && e != d) {
                        this.charging.cancelTime = 0;
                        this.showChargeEffect(e)
                    }
                }
                if ((this.charging.cancelTime > 1 || !c.charge) && this.charging.time >= h[0]) {
                    a.applyCharge = b(this.charging);
                    a.isCharging = false;
                    this.clearCharge();
                    if (this.charging.cancelTime > 1) this.charging.block = 0.5
                }
            }
        },
        handleStateChange: function(a, b) {
            a.startState = -1;
            if (a.isCharging) {
                if (!this.charging.swapped)
                    if (this.charging.type != e && a.guarding) {
                        this.charging.swapped = true;
                        this.startCharge(e)
                    } else if (this.charging.type != f && !a.guarding && this.charging.time < 0.1 && sc.control.dashing() && !Vec2.isZero(b.moveDir)) {
                    this.charging.swapped = true;
                    this.startCharge(f)
                } else if (this.charging.type == d && this.model.getCore(sc.PLAYER_CORE.THROWING) &&
                    sc.control.chargeThrowSwap()) {
                    this.charging.swapped = true;
                    this.startCharge(c)
                } else if (this.charging.type == c && sc.control.chargeAttackSwap()) {
                    this.charging.swapped = true;
                    this.startCharge(d)
                }
            } else {
                if (this.state == 4) {
                    this.state = 0;
                    a.startState = this.state
                }
                if (a.applyCharge) {
                    this.state = 5;
                    if (this.charging.type == c) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.gui.crosshair.setThrown()
                    }
                    a.startState = this.state
                } else if (this.state == 0 && (b.attack || b.melee)) {
                    this.state = 3;
                    a.startState = this.state
                } else if (this.state ==
                    0 && (b.aimStart || !this.explicitAimStart && !this.dashTimer && b.aim)) {
                    this.state = 1;
                    a.startState = this.state
                } else if (this.state == 1)
                    if (b.thrown || b.autoThrow && (!this.dashTimer || a.redashReady)) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.state = 2;
                        a.startState = this.state;
                        this.throwCharge = this.gui.crosshair.isThrowCharged();
                        this.gui.crosshair.setThrown();
                        this.gui.crosshair.setSpeedFactor(0.25)
                    } else {
                        if (!b.aim) {
                            this.state = 0;
                            a.startState = this.state
                        }
                    }
                else if (this.state == 2 || this.state == 3 || this.state == 5) {
                    var g =
                        b.thrown && this.actionBlocked.action >= 0 && this.actionBlocked.action < 0.2 || b.autoThrow && !this.actionBlocked.action;
                    if (this.gui.crosshair.active && !this.doAttack && g) {
                        this.gui.crosshair.getThrowDir(this.throwDir);
                        this.throwCharge = this.gui.crosshair.isThrowCharged();
                        this.gui.crosshair.setThrown()
                    }
                    if ((b.attack || b.melee) && this.actionBlocked.action >= 0 && this.actionBlocked.action < 0.2) this.doAttack = true;
                    if (!this.actionBlocked.action && !Vec2.isZero(this.throwDir)) {
                        this.state = 2;
                        a.startState = this.state
                    } else if (!this.actionBlocked.action &&
                        this.doAttack) {
                        this.state = 3;
                        a.startState = this.state
                    } else if (!this.currentAction || a.guarding || !this.actionBlocked.move && (b.moveDir.x != 0 || b.moveDir.y != 0) || !this.actionBlocked.reaim && b.aim) {
                        if (this.attackCounter && !this.attackResetTimer) this.attackResetTimer = 0.1;
                        if (this.dashTimer <= 0 && !a.guarding) {
                            this.cancelAction();
                            this.clearActionBlocked()
                        }
                        if (b.aim) {
                            this.state = 1;
                            a.startState = this.state
                        } else {
                            this.state = 0;
                            a.startState = this.state;
                            this.setCurrentAnim("preIdle", true, "idle")
                        }
                    }
                }
            }
        },
        updatePlayerMovement: function(a,
            b) {
            if (a.guarding) {
                this.state == 1 && ig.game.firstUpdateLoop && sc.stats.addMap("combat", "aiming", ig.system.rawTick);
                Vec2.assignC(this.coll.accelDir, 0, 0);
                (b.moveDir.x || b.moveDir.y) && Vec2.assign(this.face, b.moveDir)
            } else if (this.state == 0 || this.state == 1) {
                this.state == 1 && ig.game.firstUpdateLoop && sc.stats.addMap("combat", "aiming", ig.system.rawTick);
                if (!this.currentAction || this.currentAction.parallelMove) {
                    Vec2.assign(this.coll.accelDir, b.moveDir);
                    this.coll.relativeVel = b.relativeVel
                }
                this.jumping && (Vec2.dot(this.coll.accelDir,
                    this.jumpForwardDir) >= 0 && Vec2.distance(this.coll.pos, this.jumpPoint) < 8 ? Vec2.add(this.coll.accelDir, this.jumpForwardDir) : Vec2.assignC(this.jumpForwardDir, 0, 0))
            } else this.jumping || Vec2.assignC(this.coll.accelDir, 0, 0)
        },
        handleStateStart: function(a, b) {
            a.startState != -1 && this.cancelJump();
            switch (a.startState) {
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
                    this.dashTimer <= 0 && (!this.jumping && !a.guarding) && this.setAction(this.model.getAction(sc.PLAYER_ACTION.AIM_START));
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
                    var g;
                    if (this.attackCounter <= 3) g = this.attackCounter % 2 == 1 ? "ATTACK_REV" : "ATTACK";
                    else {
                        g = "ATTACK_FINISHER";
                        this.attackResetTimer = this.attackCounter = 0
                    }
                    ig.vars.add("playerVar.input.melee", 1);
                    sc.stats.addMap("player", "close", 1);
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.charging.executeLevel =
                        0;
                    this.startCloseCombatAction(g, b);
                    break;
                case 2:
                    if (this.recordInput) {
                        ig.vars.set("playerVar.input.aiming", false);
                        ig.vars.add("playerVar.input.thrown", 1)
                    }
                    this.throwCounter++;
                    g = this.throwCounter % 2 == 0 ? this.throwCharge ? "THROW_CHARGED_REV" : "THROW_NORMAL_REV" : this.throwCharge ? "THROW_CHARGED" : "THROW_NORMAL";
                    this.dashAttackCount = Math.min(this.maxDash, this.dashCount);
                    this.charging.executeLevel = 0;
                    this.startThrowAction(g, b);
                    break;
                case 5:
                    g = this.getChargeAction(this.charging.type, a.applyCharge);
                    if (sc.options.get("combat-art-name")) {
                        var h =
                            this.model.getCombatArtName(sc.PLAYER_ACTION[g]);
                        if (h) {
                            h = new sc.SmallEntityBox(this, h.toString(), 1);
                            h.stopRumble();
                            ig.gui.addGuiElement(h)
                        }
                    }
                    this.charging.executeLevel = a.applyCharge;
                    sc.stats.addMap("combat", "specials", 1);
                    sc.stats.addMap("combat", "specials-" + this.model.currentElementMode + "-level-" + a.applyCharge, 1);
                    if (this.charging.type == d) {
                        sc.stats.addMap("combat", "specialsClose", 1);
                        Vec2.isZero(this.charging.prefDir) || Vec2.assign(this.face, this.charging.prefDir);
                        this.startCloseCombatAction(g, b)
                    } else if (this.charging.type ==
                        c) {
                        sc.stats.addMap("combat", "specialsThrow", 1);
                        this.startThrowAction(g, b)
                    } else if (this.charging.type == e) {
                        sc.stats.addMap("combat", "specialsGuard", 1);
                        this.doCombatAction(g)
                    } else if (this.charging.type == f) {
                        sc.stats.addMap("combat", "specialsDash", 1);
                        Vec2.isZero(this.charging.prefDir) || Vec2.assign(this.dashDirData, this.charging.prefDir);
                        this.gui.crosshair.setActive(false);
                        this.setAttribute("dashDir", this.dashDirData);
                        this.doCombatAction(g)
                    }
            }
        },
        startThrowAction: function(a, b) {
            if (this.dashTimer > 0) this.dashBlock =
                0.3;
            this.dashTimer = 0;
            Vec2.assign(this.face, this.throwDir);
            this.coll.pos.z == this.coll.baseZPos ? this.setAttribute("dashDir", Vec2.assign(this.dashDirData, b.moveDir)) : this.setAttribute("dashDir", Vec2.assignC(this.dashDirData, 0, 0));
            Vec2.assign(this.throwDirData, this.throwDir);
            Vec2.assignC(this.throwDir, 0, 0);
            this.doCombatAction(a)
        },
        startCloseCombatAction: function(a, b) {
            if (this.dashTimer > 0) this.dashBlock = 0.3;
            this.dashTimer = 0;
            this.doAttack = false;
            this.gui.crosshair.setActive(false);
            this.coll.pos.z == this.coll.baseZPos ?
                this.setAttribute("dashDir", Vec2.assign(this.dashDirData, b.moveDir)) : this.setAttribute("dashDir", Vec2.assignC(this.dashDirData, 0, 0));
            Vec2.isZero(b.moveDir) || Vec2.assign(this.face, b.moveDir);
            this.doCombatAction(a)
        },
        startDash: function() {
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
            var a = this.dashCount <= this.maxDash ? this.getMaxDashes() != 3 ? "DASH_LONG" : "DASH" : "DASH_SLOW";
            this.playerTrack.lastPlayerAction = a;
            this.doPlayerAction(a);
            this.dashCount <= this.maxDash && sc.combat.showModeDash(this, this.model.currentElementMode)
        },
        deferredUpdate: function() {
            if (this.interactObject && this.interactObject.onInteractObjectDeferredUpdate) this.interactObject.onInteractObjectDeferredUpdate(this)
        },
        postActionUpdate: function() {
            if (this.interactObject && this.interactObject.onInteractObjectPostActionUpdate) this.interactObject.onInteractObjectPostActionUpdate()
        },
        cancelInteract: function() {
            if (this.interactObject) {
                this.interactObject = null;
                if (sc.control.aiming()) this.explicitAimStart = 0.05
            }
        },
        onPreDamageModification: function(a, b, c, d, e, f) {
            this.recordInput && (f ? ig.vars.add("playerVar.input.shieldedHits", 1) : ig.vars.add("playerVar.input.hits", 1));
            if (f) {
                sc.stats.addMap("combat", "shieldedHits", 1);
                if (f == sc.SHIELD_RESULT.PERFECT) {
                    ig.vars.add("playerVar.input.perfectShield",
                        1);
                    sc.stats.addMap("combat", "perfectShield", 1);
                    if (this.params.getModifier("PERFECT_GUARD_RESET") >= 1) {
                        this.perfectGuardCooldown = 0;
                        for (b = this.shieldsConnections.length; b--;) this.shieldsConnections[b].resetPerfectGuardTime()
                    }
                }
            } else sc.stats.addMap("combat", "damageHits", 1);
            if (e && f != sc.SHIELD_RESULT.PERFECT && !ig.vars.get("g.newgame.ignoreLeaMustDie"))
                if (sc.newgame.get("lea-must-die")) e.damage = Math.max(e.damage, this.params.currentHp || 1);
                else if (sc.newgame.get("enemy-damage-15")) e.damage = Math.round(e.damage *
                1.5);
            else if (sc.newgame.get("enemy-damage-2")) e.damage = e.damage * 2;
            else if (sc.newgame.get("enemy-damage-4")) e.damage = e.damage * 4;
            sc.arena.onPreDamageModification(e, f, a);
            return false
        },
        onPlayerShieldBreak: function() {
            sc.stats.addMap("combat", "shieldBreaks", 1);
            this.state = 4;
            this.cancelAction()
        },
        onPerfectDash: function() {
            if (!this.dashPerfect) {
                sc.stats.addMap("player", "perfectDash", 1);
                sc.arena.onPerfectDodge();
                if (this.model.name == "Lea" && sc.newgame.get("witch-time") && !ig.vars.get("tmp.slowMotionActive")) {
                    sc.combat.showPerfectDashEffect(this);
                    var a = sc.ProxyTools.getProxy("evadeSloMo", this);
                    a && a.spawn(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, this, this.face, true);
                    this.invincibleTimer = 4
                }
                this.dashPerfect = true
            }
        },
        onDamageTaken: function(a, b) {
            b != sc.SHIELD_RESULT.PERFECT && !sc.model.isCutscene() && sc.stats.addMap("combat", "damageTaken", a)
        },
        onHeal: function(a, b) {
            sc.stats.addMap("combat", "healed", b)
        },
        onTargetHit: function(a, b, c, d) {
            if (!ig.vars.get("playerVar.damageStatsIgnore")) {
                sc.stats.addMap("combat", "damageGiven", c.damage);
                sc.stats.setMapMax("combat",
                    "maxDamage", c.damage)
            }
            this.combatStats.lastTarget = a;
            if (c.critical) {
                sc.stats.addMap("combat", "critHits", 1);
                b.ballDamage ? sc.stats.addMap("combat", "critHitsThrow", 1) : sc.stats.addMap("combat", "critHitsClose", 1)
            }
            if (b.spFactor) {
                b.ballDamage || sc.stats.addMap("player", "closeHits", 1);
                this.model.onTargetHit(a, b, c)
            }
            sc.arena.onTargetHit(b, c, d, a);
            this.parent(a, b, c, d)
        },
        onJump: function(a, b) {
            sc.stats.addMap("player", "jumps", 1);
            this.maxJumpHeight = this.coll.pos.z + a;
            Vec2.assign(this.jumpPoint, this.coll.pos);
            a >= 16 ? Vec2.assign(this.jumpForwardDir,
                this.coll.accelDir) : Vec2.assignC(this.jumpForwardDir, 0, 0);
            this.parent(a, b)
        },
        onPhysicsSquish: function(a) {
            if (a.squishRespawn) {
                Vec3.assign(this.respawn.pos, this.mapStartPos);
                this.quickFall(ig.TERRAIN.HOLE)
            }
        },
        varsChanged: function() {
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
        modelChanged: function(a, b, c) {
            if (a == this.params) b == sc.COMBAT_PARAM_MSG.STATS_CHANGED && this.updateModelStats();
            else if (a == this.model)
                if (b == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) {
                    this.copyModelSkills();
                    this.updateModelStats()
                } else b == sc.PLAYER_MSG.CONFIG_CHANGED ? this.initModel() : b == sc.PLAYER_MSG.STATS_CHANGED ? this.updateModelStats() : b == sc.PLAYER_MSG.ITEM_USED ? this.itemConsumer.activateItemEffect(this,
                    this.model, c) : b == sc.PLAYER_MSG.ITEM_TOGGLED && this.updateModelStats();
            else a == sc.playerSkins ? c == "Appearance" ? this.updateAnimSheet() : c == "StepEffect" ? this.updateSkinStepFx() : c == "Aura" ? this.updateSkinAura() : c == "Pet" && this.updateSkinPet(true) : a == sc.model && b == sc.GAME_MODEL_MSG.STATE_CHANGED && this.updateAnimSheet()
        },
        copyModelSkills: function() {
            this.proxies = this.model.getBalls()
        },
        doQuickRespawn: function(a, b, c) {
            (a == ig.TERRAIN.WATER || a == ig.TERRAIN.HOLE || a == ig.TERRAIN.COAL || a == ig.TERRAIN.QUICKSAND || a == ig.TERRAIN.HIGHWAY) &&
            sc.stats.addMap("player", "respawns", 1);
            a == ig.TERRAIN.WATER ? sc.stats.addMap("player", "waterDeath", 1) : a == ig.TERRAIN.COAL ? sc.stats.addMap("player", "coalDeath", 1) : a == ig.TERRAIN.QUICKSAND ? sc.stats.addMap("player", "sandDeath", 1) : a == ig.TERRAIN.HOLE ? sc.stats.addMap("player", "holeDeath", 1) : a == ig.TERRAIN.HIGHWAY && sc.stats.addMap("player", "highwayDeath", 1);
            this.parent(a, b, c)
        },
        onRespawnEnd: function() {
            for (var a = ig.game.getOverlapEntities(this), b = a.length; b--;) {
                var c = a[b];
                (c instanceof ig.ENTITY.WavePushPullBlock ||
                    c instanceof ig.ENTITY.PushPullBlock) && c.resetPos()
            }
        },
        isThrowCharged: function() {
            return this.gui.crosshair.isThrowCharged()
        },
        setOverrideBall: function(a) {
            this.overrideBall = a
        },
        useItem: function(a) {
            this.itemConsumer.runItemUseAction(this, this.model, a)
        },
        onVarAccess: function(a, b) {
            return b[1] == "hasElementShield" ? this.hasShield("elementOrbShield") : this.parent(a, b)
        }
    });
    window.checkPlayerPos = function() {
        var a = ig.game.playerEntity;
        if (a && !a.debugCheck && a.coll.pos.x == 1) a.debugCheck = true
    }
});
ig.baked = !0;
