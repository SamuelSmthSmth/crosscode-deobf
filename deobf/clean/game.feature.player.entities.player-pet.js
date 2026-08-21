/**
 * game.feature.player.entities.player-pet
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.entities.player-pet")`.
 *
 * `sc.PlayerPetEntity`: the pet that follows Lea — follows/stays-behind
 * states, combat repositioning, temp-hiding, push-away from other actors,
 * danger-terrain respawn and idle special animations. `ig.ENTITY.Pet` is the
 * editor-spawnable wrapper (skin-based, optional looping action).
 */
ig.module("game.feature.player.entities.player-pet")
    .requires("game.feature.npc.entities.sc-actor")
    .defines(function () {

    var FOLLOW_CONFIG = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: 20,
            collType: ig.COLLTYPE.IGNORE,
            walkAnims: "default",
            soundType: "none",
            shadow: 16,
            floatAccel: 2
        }),
        PET_CONFIG = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: -1,
            collType: ig.COLLTYPE.IGNORE,
            walkAnims: "default",
            soundType: "none",
            shadow: 16,
            floatAccel: 2
        }),
        distVec = Vec2.create(),
        tempVec = Vec3.create();

    sc.PlayerPetEntity = sc.ActorEntity.extend({
        npcEffects: new ig.EffectSheet("npc"),
        petSkin: null,
        configs: {},
        pushTimer: 0,
        posOffset: Vec2.createC(0, -14),
        state: 0,
        respawnPos: Vec3.create(),
        idleTimer: 0,
        idleSpecials: 0,
        tempHidden: false,
        effects: {
            water: new ig.EffectSheet("scene.water")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.setSize(8, 8, 28);
            this.coll.edgeSlipInward = true;
            this.petSkin = settings.petSkin;
            this.tempHidden = this.defaultFollow = false;
            this.outOfScreenTime = 0;
            this.animSheet = this.petSkin.animSheet;
            this.storeWalkAnims("default", this.petSkin.walkAnims);
            this.setWalkAnims("default");
            for (var idleSpecialCount = 0; this.animSheet.hasAnimation("idleSpecial" + (idleSpecialCount + 1));) idleSpecialCount = idleSpecialCount + 1;
            (this.idleSpecials = idleSpecialCount) && this.resetIdleTimer();
            var config = new ig.ActorConfig;
            config.loadFromData(this.petSkin.actorConfig, FOLLOW_CONFIG);
            this.setDefaultConfig(config);
            this.initAnimations()
        },

        show: function (force) {
            this.parent(force);
            this.resetPos(force)
        },

        resetIdleTimer: function (extraTime) {
            this.idleTimer = 2 + 2 * Math.random() + (extraTime || 0)
        },

        shouldTempHide: function () {
            return ig.game.playerEntity.interactObject
        },

        update: function () {
            var player = ig.game.playerEntity,
                hidden = player._hidden || player.hidePets,
                tempHide = hidden || this.shouldTempHide();
            if (!this.tempHidden && tempHide) {
                this.cancelAction();
                Vec2.assignC(this.coll.accelDir, 0, 0);
                hidden ? this.animState.alpha = 0 : ig.game.effects.npc.spawnOnTarget("disappear", this);
                this.coll.setType(ig.COLLTYPE.NONE);
                this.tempHidden = true
            } else if (this.tempHidden && !tempHide) {
                this.tempHidden = false;
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.resetPos(true);
                ig.game.effects.npc.spawnOnTarget("appear", this)
            }
            if (!this.currentAction && !this.tempHidden) {
                var groundDist = ig.CollTools.getGroundDistance(this.coll, player.coll);
                var newState = this.state;
                if (sc.model.isCombatActive() && (groundDist <= 120 || groundDist >= 200)) newState = 2;
                !sc.model.isCombatActive() && groundDist >= 24 && (newState = 1);
                if (!this.tempHidden) {
                    if (!sc.model.isCombatActive() && !sc.model.isCutscene()) {
                        this.outOfScreenTime = ig.EntityTools.isInScreen(this, 0) ? 0 : this.outOfScreenTime + ig.system.tick;
                        this.outOfScreenTime > 3 && this.resetPos(false, true)
                    }
                    if (this.state !== newState) {
                        this.state = newState;
                        if (newState === 1) {
                            if (!this.defaultFollow) {
                                this.nav.path.toEntity(player, 16, {
                                    posOffset: this.posOffset
                                });
                                this.defaultFollow = true
                            }
                        } else if (newState === 2) {
                            this.defaultFollow = false;
                            this.nav.path.runAway(player, 160)
                        }
                    }
                    var reachedTarget = false,
                        speedFactor = 1;
                    if (this.state === 1) {
                        speedFactor = groundDist > 48 ? 1 : Math.max(0.25, Math.pow(groundDist / 48, 2));
                        groundDist > 56 && (speedFactor = Math.min(1.25, 1.05 + (groundDist - 56) / 64));
                        this.jumping && (speedFactor = 1)
                    }
                    this.coll.relativeVel = speedFactor;
                    this.nav.path.startRelativeVel = speedFactor;
                    if (this.state === 1 || this.state === 2) {
                        if (this.nav.path.moveEntity()) {
                            this.state = 0;
                            reachedTarget = true
                        }
                    } else this.state === 0 && (reachedTarget = true);
                    if (reachedTarget) {
                        var faceDir = ig.CollTools.getDistVec2(this.coll, player.coll, distVec);
                        Vec2.rotateToward(this.face, faceDir, Math.PI * 2 * ig.system.tick * 2)
                    }
                    var coll = this.coll;
                    coll.pos.z <= coll.baseZPos && (!this.jumping && coll.zGravityFactor !== 0 && !ig.CollTools.isCloseToEdge(this.coll) &&
                        !ig.terrain.isDangerTerrain(this.stepStats.terrain) && this.stepStats.terrain != ig.TERRAIN.QUICKSAND) && Vec3.assign(this.respawnPos, this.coll.pos)
                }
            }
            this.parent();
            if (this.idleSpecials && !this.currentAction)
                if (Vec2.isZero(this.coll.accelDir)) {
                    this.idleTimer = this.idleTimer - ig.system.tick;
                    if (this.idleTimer <= 0) {
                        var specialIndex = Math.floor(this.idleSpecials * Math.random()) + 1;
                        this.setCurrentAnim("idleSpecial" + specialIndex, true, this.walkAnims.idle, true);
                        this.resetIdleTimer(2)
                    }
                } else this.resetIdleTimer();
            if (!this.tempHidden && !this.currentAction) {
                var coll = this.coll;
                var pushed = false;
                if (coll.type == ig.COLLTYPE.IGNORE) {
                    var entities = ig.game.getEntitiesInRectangle(coll.pos.x, coll.pos.y, coll.pos.z, coll.size.x, coll.size.y, coll.size.z, this);
                    for (var index = entities.length; index--;) {
                        var entity = entities[index];
                        if (entity instanceof sc.ActorEntity && entity.coll.type !== ig.COLLTYPE.TRIGGER) {
                            ig.CollTools.getDistVec2(entity.coll, coll, distVec);
                            Vec2.length(distVec, 80 * (1 - this.pushTimer / 1).limit(0, 1));
                            Vec2.add(coll.pushVel, distVec);
                            pushed = true
                        }
                    }
                }
                this.pushTimer = pushed ? this.pushTimer + ig.system.tick : 0;
                var terrain = ig.terrain.getTerrain(coll, true);
                if (ig.terrain.isDangerTerrain(terrain) && terrain != ig.TERRAIN.QUICKSAND) {
                    this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tempVec);
                    this.resetPos(false, true)
                }
            }
        },

        resetStartPos: function () {
            var player = ig.game.playerEntity;
            Vec3.assign(tempVec, player.coll.pos);
            tempVec.x = tempVec.x + (player.coll.size.x / 2 - this.coll.size.x / 2);
            tempVec.y = tempVec.y + (player.coll.size.y / 2 - this.coll.size.x / 2);
            var faceDir = Vec2.assign(distVec, player.face);
            Vec2.length(faceDir, 12);
            tempVec.x = tempVec.x - faceDir.x;
            tempVec.y = tempVec.y - faceDir.y;
            this.coll.setPos(tempVec.x, tempVec.y, tempVec.z)
        },

        /** Teleport the pet next to the player (behind their face direction). */
        resetPos: function (force, useRespawnPos) {
            var player = ig.game.playerEntity,
                navResult = ig.navigation.getClosePosition(tempVec, player.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tempVec), player.coll.size, player, null, 48, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
            tempVec.x = tempVec.x - this.coll.size.x / 2;
            tempVec.y = tempVec.y - this.coll.size.y / 2;
            !navResult && useRespawnPos && Vec3.assign(tempVec, this.respawnPos);
            this.coll.setPos(tempVec.x, tempVec.y, tempVec.z);
            if (!force) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this)
            }
        },

        onNavigationFailed: function (failCount) {
            if (failCount > 5) {
                this.nav.failTimer = 0;
                this.resetPos()
            }
        },

        remove: function () {
            this.kill()
        }
    });

    ig.ENTITY.Pet = sc.ActorEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                pet: {
                    _type: "PetSelect",
                    _info: "Pet to spawn"
                },
                action: {
                    _type: "Action",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _clear: true,
                    _optional: true
                }
            },
            label: function () {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(0,255,0, 0.5)"
        }),
        pet: null,
        skin: null,
        petSkin: null,
        petOffset: null,
        loopAction: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            sc.Model.addObserver(sc.playerSkins, this);
            this.pet = settings.pet || null;
            if (this.skin = sc.playerSkins.skins[this.pet]) {
                this.coll.setSize(16, 16, 16);
                var skinSettings = this.skin.settings;
                this.petOffsets = skinSettings.petOffsets;
                this.animSheet = new ig.AnimationSheet(skinSettings.animSheet);
                this.storeWalkAnims("default", skinSettings.walkAnims);
                this.setWalkAnims("default");
                var config = new ig.ActorConfig;
                config.loadFromData(skinSettings.actorConfig || {}, PET_CONFIG);
                this.setDefaultConfig(config);
                if (skinSettings.petSound) this.petSound = new ig.Sound(skinSettings.petSound.path, skinSettings.petSound.volume, skinSettings.petSound.variance);
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                    this.initAnimations()
                }
                if (settings.action && settings.action.length > 0 && !this.hidden) this.loopAction = new ig.Action("[PET]", settings.action)
            } else {
                this.coll.setSize(16, 16, 0);
                this.coll.type = ig.COLLTYPE.IGNORE
            }
        },

        update: function () {
            this.parent()
        },

        show: function (force) {
            var currentSkin = sc.playerSkins.getCurrentSkin("Pet");
            currentSkin && currentSkin.name == this.pet || sc.model.player.getItemAmount(this.skin.item) <= 0 || this.parent(force)
        },

        hide: function () {
            ig.EffectTools.clearEffects(this);
            this.parent()
        },

        remove: function () {
            this.kill()
        },

        postActionUpdate: function () {
            if (!this.doPostEventAction) {
                if (this.currentAction && this.currentAction.eventAction) this.eventBlocked = true;
                !this.currentAction && !this.eventBlocked && this.loopAction && this.setAction(this.loopAction)
            }
        },

        getQuickMenuSettings: function () {
            return {
                type: "Analyzable",
                color: sc.ANALYSIS_COLORS.BLUE,
                text: sc.inventory.getItemName(this.skin.item)
            }
        },

        onKill: function (reason) {
            this.parent(reason);
            sc.Model.removeObserver(sc.playerSkins, this);
            this.loopAction && this.loopAction.clearCached();
            this.petSound && this.petSound.clearCached()
        },

        modelChanged: function (model, message, data) {
            if (message == sc.SKIN_EVENT.SKIN_UPDATE && data == "Pet")(model = sc.playerSkins.getCurrentSkin("Pet")) && model.name == this.pet || sc.model.player.getItemAmount(this.skin.item) <= 0 ? this.hide() : this.show()
        }
    })
});
ig.baked = !0;
