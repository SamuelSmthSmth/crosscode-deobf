ig.module("game.feature.player.entities.player-pet").requires("game.feature.npc.entities.sc-actor").defines(function() {
    var b = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: 20,
            collType: ig.COLLTYPE.IGNORE,
            walkAnims: "default",
            soundType: "none",
            shadow: 16,
            floatAccel: 2
        }),
        a = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: -1,
            collType: ig.COLLTYPE.IGNORE,
            walkAnims: "default",
            soundType: "none",
            shadow: 16,
            floatAccel: 2
        }),
        d = Vec2.create(),
        c = Vec3.create();
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
        init: function(a, c, d, h) {
            this.parent(a, c, d, h);
            this.coll.setSize(8, 8, 28);
            this.coll.edgeSlipInward = true;
            this.petSkin = h.petSkin;
            this.tempHidden = this.defaultFollow = false;
            this.outOfScreenTime = 0;
            this.animSheet = this.petSkin.animSheet;
            this.storeWalkAnims("default", this.petSkin.walkAnims);
            this.setWalkAnims("default");
            for (a = 0; this.animSheet.hasAnimation("idleSpecial" + (a + 1));) a = a + 1;
            (this.idleSpecials = a) && this.resetIdleTimer();
            a = new ig.ActorConfig;
            a.loadFromData(this.petSkin.actorConfig, b);
            this.setDefaultConfig(a);
            this.initAnimations()
        },
        show: function(a) {
            this.parent(a);
            this.resetPos(a)
        },
        resetIdleTimer: function(a) {
            this.idleTimer = 2 + 2 * Math.random() + (a || 0)
        },
        shouldTempHide: function() {
            return ig.game.playerEntity.interactObject
        },
        update: function() {
            var a = ig.game.playerEntity,
                b = a._hidden || a.hidePets,
                g = b || this.shouldTempHide();
            if (!this.tempHidden && g) {
                this.cancelAction();
                Vec2.assignC(this.coll.accelDir, 0, 0);
                b ? this.animState.alpha = 0 : ig.game.effects.npc.spawnOnTarget("disappear", this);
                this.coll.setType(ig.COLLTYPE.NONE);
                this.tempHidden = true
            } else if (this.tempHidden && !g) {
                this.tempHidden = false;
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.resetPos(true);
                ig.game.effects.npc.spawnOnTarget("appear", this)
            }
            if (!this.currentAction && !this.tempHidden) {
                b = ig.CollTools.getGroundDistance(this.coll, a.coll);
                g = this.state;
                if (sc.model.isCombatActive() &&
                    (b <= 120 || b >= 200)) g = 2;
                !sc.model.isCombatActive() && b >= 24 && (g = 1);
                if (!this.tempHidden) {
                    if (!sc.model.isCombatActive() && !sc.model.isCutscene()) {
                        this.outOfScreenTime = ig.EntityTools.isInScreen(this, 0) ? 0 : this.outOfScreenTime + ig.system.tick;
                        this.outOfScreenTime > 3 && this.resetPos(false, true)
                    }
                    if (this.state !== g) {
                        this.state = g;
                        if (g === 1) {
                            if (!this.defaultFollow) {
                                this.nav.path.toEntity(a, 16, {
                                    posOffset: this.posOffset
                                });
                                this.defaultFollow = true
                            }
                        } else if (g === 2) {
                            this.defaultFollow = false;
                            this.nav.path.runAway(a, 160)
                        }
                    }
                    var g =
                        false,
                        h = 1;
                    if (this.state === 1) {
                        h = b > 48 ? 1 : Math.max(0.25, Math.pow(b / 48, 2));
                        b > 56 && (h = Math.min(1.25, 1.05 + (b - 56) / 64));
                        this.jumping && (h = 1)
                    }
                    this.coll.relativeVel = h;
                    this.nav.path.startRelativeVel = h;
                    if (this.state === 1 || this.state === 2) {
                        if (this.nav.path.moveEntity()) {
                            this.state = 0;
                            g = true
                        }
                    } else this.state === 0 && (g = true);
                    if (g) {
                        a = ig.CollTools.getDistVec2(this.coll, a.coll, d);
                        Vec2.rotateToward(this.face, a, Math.PI * 2 * ig.system.tick * 2)
                    }
                    a = this.coll;
                    a.pos.z <= a.baseZPos && (!this.jumping && a.zGravityFactor !== 0 && !ig.CollTools.isCloseToEdge(this.coll) &&
                        !ig.terrain.isDangerTerrain(this.stepStats.terrain) && this.stepStats.terrain != ig.TERRAIN.QUICKSAND) && Vec3.assign(this.respawnPos, this.coll.pos)
                }
            }
            this.parent();
            if (this.idleSpecials && !this.currentAction)
                if (Vec2.isZero(this.coll.accelDir)) {
                    this.idleTimer = this.idleTimer - ig.system.tick;
                    if (this.idleTimer <= 0) {
                        a = Math.floor(this.idleSpecials * Math.random()) + 1;
                        this.setCurrentAnim("idleSpecial" + a, true, this.walkAnims.idle, true);
                        this.resetIdleTimer(2)
                    }
                } else this.resetIdleTimer();
            if (!this.tempHidden && !this.currentAction) {
                a =
                    this.coll;
                b = false;
                if (a.type == ig.COLLTYPE.IGNORE) {
                    g = ig.game.getEntitiesInRectangle(a.pos.x, a.pos.y, a.pos.z, a.size.x, a.size.y, a.size.z, this);
                    for (h = g.length; h--;) {
                        var i = g[h];
                        if (i instanceof sc.ActorEntity && i.coll.type !== ig.COLLTYPE.TRIGGER) {
                            ig.CollTools.getDistVec2(i.coll, a, d);
                            Vec2.length(d, 80 * (1 - this.pushTimer / 1).limit(0, 1));
                            Vec2.add(a.pushVel, d);
                            b = true
                        }
                    }
                }
                this.pushTimer = b ? this.pushTimer + ig.system.tick : 0;
                a = ig.terrain.getTerrain(a, true);
                if (ig.terrain.isDangerTerrain(a) && a != ig.TERRAIN.QUICKSAND) {
                    this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM,
                        c);
                    this.resetPos(false, true)
                }
            }
        },
        resetStartPos: function() {
            var a = ig.game.playerEntity;
            Vec3.assign(c, a.coll.pos);
            c.x = c.x + (a.coll.size.x / 2 - this.coll.size.x / 2);
            c.y = c.y + (a.coll.size.y / 2 - this.coll.size.x / 2);
            a = Vec2.assign(d, a.face);
            Vec2.length(a, 12);
            c.x = c.x - a.x;
            c.y = c.y - a.y;
            this.coll.setPos(c.x, c.y, c.z)
        },
        resetPos: function(a, b) {
            var d = ig.game.playerEntity,
                d = ig.navigation.getClosePosition(c, d.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c), d.coll.size, d, null, 48, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
            c.x = c.x -
                this.coll.size.x / 2;
            c.y = c.y - this.coll.size.y / 2;
            !d && b && Vec3.assign(c, this.respawnPos);
            this.coll.setPos(c.x, c.y, c.z);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this)
            }
        },
        onNavigationFailed: function(a) {
            if (a > 5) {
                this.nav.failTimer = 0;
                this.resetPos()
            }
        },
        remove: function() {
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
            label: function() {
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
        init: function(b, c, d, h) {
            this.parent(b, c, d, h);
            sc.Model.addObserver(sc.playerSkins, this);
            this.pet = h.pet || null;
            if (this.skin = sc.playerSkins.skins[this.pet]) {
                this.coll.setSize(16, 16, 16);
                b = this.skin.settings;
                this.petOffsets = b.petOffsets;
                this.animSheet = new ig.AnimationSheet(b.animSheet);
                this.storeWalkAnims("default", b.walkAnims);
                this.setWalkAnims("default");
                c = new ig.ActorConfig;
                c.loadFromData(b.actorConfig || {}, a);
                this.setDefaultConfig(c);
                if (b.petSound) this.petSound = new ig.Sound(b.petSound.path, b.petSound.volume, b.petSound.variance);
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                    this.initAnimations()
                }
                if (h.action && h.action.length > 0 && !this.hidden) this.loopAction = new ig.Action("[PET]", h.action)
            } else {
                this.coll.setSize(16, 16, 0);
                this.coll.type = ig.COLLTYPE.IGNORE
            }
        },
        update: function() {
            this.parent()
        },
        show: function(a) {
            var b =
                sc.playerSkins.getCurrentSkin("Pet");
            b && b.name == this.pet || sc.model.player.getItemAmount(this.skin.item) <= 0 || this.parent(a)
        },
        hide: function() {
            ig.EffectTools.clearEffects(this);
            this.parent()
        },
        remove: function() {
            this.kill()
        },
        postActionUpdate: function() {
            if (!this.doPostEventAction) {
                if (this.currentAction && this.currentAction.eventAction) this.eventBlocked = true;
                !this.currentAction && !this.eventBlocked && this.loopAction && this.setAction(this.loopAction)
            }
        },
        getQuickMenuSettings: function() {
            return {
                type: "Analyzable",
                color: sc.ANALYSIS_COLORS.BLUE,
                text: sc.inventory.getItemName(this.skin.item)
            }
        },
        onKill: function(a) {
            this.parent(a);
            sc.Model.removeObserver(sc.playerSkins, this);
            this.loopAction && this.loopAction.clearCached();
            this.petSound && this.petSound.clearCached()
        },
        modelChanged: function(a, b, c) {
            if (b == sc.SKIN_EVENT.SKIN_UPDATE && c == "Pet")(a = sc.playerSkins.getCurrentSkin("Pet")) && a.name == this.pet || sc.model.player.getItemAmount(this.skin.item) <= 0 ? this.hide() : this.show()
        }
    })
});
ig.baked = !0;
