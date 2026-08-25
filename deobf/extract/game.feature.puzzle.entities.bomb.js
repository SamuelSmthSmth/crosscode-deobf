ig.module("game.feature.puzzle.entities.bomb").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create();
    Vec3.create();
    ig.ENTITY.BombPanel = ig.AnimatedEntity.extend({
        respawnTimer: 0,
        bomb: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                noHeatFocus: {
                    _type: "Boolean",
                    _info: "No camera-follow with heat"
                }
            }
        }),
        effects: {
            bomb: new ig.EffectSheet("puzzle.bomb")
        },
        init: function(a,
            b, c, e) {
            this.parent(a, b, c, e);
            this.noHeatFocus = e.noHeatFocus;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(24, 24, 1);
            this.coll.zGravityFactor = 1;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 24,
                    height: 24,
                    xCount: 2,
                    offX: 0,
                    offY: 88
                },
                SUB: [{
                    name: "on",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "off",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "blink",
                    time: 0.04,
                    frames: [0],
                    repeat: false
                }, {
                    name: "blink",
                    time: 0.04,
                    frames: [1, 1, 1, 1, 1, 1, 1, 1],
                    framesAlpha: [0, 0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2],
                    repeat: true
                }]
            });
            this.setCurrentAnim("on")
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {})
            }
            this.spawnBomb(a)
        },
        onHideRequest: function() {
            if (this.bomb) {
                this.bomb.destroy();
                this.bomb = null
            }
            this.respawnTimer = 0;
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a.isDone()) {
                this.effects.hideHandle =
                    null;
                this.hide()
            }
        },
        update: function() {
            if (this.respawnTimer) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                this.respawnTimer <= 0 && this.spawnBomb()
            }
            this.parent()
        },
        spawnBomb: function(a) {
            this.respawnTimer = 0;
            this.setCurrentAnim("on");
            var d = this.getCenter(b);
            this.bomb = ig.game.spawnEntity(sc.BombEntity, d.x, d.y, this.coll.pos.z + this.coll.size.z, {
                panel: this
            });
            this.bomb.noHeatFocus = this.noHeatFocus;
            a || this.effects.bomb.spawnOnTarget("appear", this.bomb, {})
        },
        hasBomb: function() {
            return !!this.bomb
        },
        onBombStart: function() {
            this.bomb =
                null;
            this.setCurrentAnim("off")
        },
        onBombExplode: function() {
            this.setCurrentAnim("blink");
            this.respawnTimer = 1.5
        }
    });
    sc.BombEntity = ig.AnimatedEntity.extend({
        panel: null,
        timer: 0,
        combatant: null,
        heatMode: false,
        effects: {
            bomb: new ig.EffectSheet("puzzle.bomb")
        },
        cameraHandle: null,
        noHeatFocus: false,
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.coll.setSize(20, 20, 16);
            this.coll.friction.air = 0.06;
            this.coll.shadow.size = 20;
            this.coll.edgeSlipInward =
                true;
            this.coll.setPos(a - this.coll.size.x / 2, b - this.coll.size.y / 2, c);
            this.panel = e.panel || null;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: -3,
                    z: 0
                },
                sheet: {
                    src: a.sheet,
                    width: 24,
                    height: 24,
                    xCount: 5,
                    offX: 0,
                    offY: 64
                },
                SUB: [{
                        name: "off",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "ticking",
                        time: 0.1,
                        frames: [2, 1, 0, 1],
                        repeat: true
                    }, {
                        name: "ticking",
                        time: 1,
                        frames: [3],
                        repeat: false
                    }, {
                        name: "ticking",
                        time: 1,
                        frames: [4],
                        repeat: false
                    }, {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [0, 0, 2, 2],
                        repeat: true
                    },
                    {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [3, 3, 3, 3],
                        framesAlpha: [0, 0, 1, 1],
                        repeat: true
                    }, {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [4, 4, 4, 4],
                        framesAlpha: [0, 0, 1, 1],
                        repeat: true
                    }
                ]
            });
            this.setCurrentAnim("off")
        },
        destroy: function() {
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a.isDone()) {
                this.effects.hideHandle = null;
                this.kill()
            }
        },
        start: function(a, b, c, e) {
            if (!this.timer) {
                this.setCurrentAnim("ticking");
                this.timer =
                    3 / sc.options.get("assist-puzzle-speed");
                this.panel && this.panel.onBombStart();
                Vec2.assign(this.coll.vel, a);
                Vec2.length(this.coll.vel, c || 180);
                this.coll.vel.z = e || 200;
                this.combatant = b;
                this.fxHandle = this.effects.bomb.spawnOnTarget("active", this, {
                    duration: -1
                })
            }
        },
        setLastSecond: function() {
            this.timer = 0.75;
            this.setCurrentAnim("tickingEnd");
            if (this.sprites.length > 1) {
                this.sprites[1].setGfxCut(0, 0);
                this.sprites[2].setGfxCut(0, 0)
            }
            this.fxHandle && this.fxHandle.stop();
            this.fxHandle = this.effects.bomb.spawnOnTarget("almost",
                this, {
                    duration: -1
                })
        },
        explode: function() {
            if (!this._killed) {
                var a = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, Vec3.create());
                this.effects.bomb.spawnFixed("explosion", a.x, a.y, a.z);
                a.z = a.z - 24;
                this.panel && this.panel.onBombExplode();
                if (this.combatant) {
                    a = new sc.CircleHitForce(this.combatant, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 2,
                            spFactor: 0,
                            hints: ["BOMB"],
                            noHack: true
                        },
                        pos: a,
                        radius: 8,
                        zHeight: 40,
                        duration: 0.1,
                        expandRadius: 40,
                        alwaysFull: true,
                        party: "OTHER"
                    });
                    sc.combat.addCombatForce(a)
                }
                this.cameraHandle &&
                    ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                this.kill()
            }
        },
        enterHeatMode: function(a, b) {
            if (!this._killed && !this.heatMode) {
                this.heatMode = true;
                var c = this.coll;
                this.coll.edgeSlipInward = false;
                Vec2.assign(c.accelDir, a);
                c.maxVel = 400;
                c.weight = 2E3;
                Vec2.assign(c.vel, a);
                Vec2.length(c.vel, 400);
                this.timer = 2;
                this.combatant = b;
                this.fxHandle && this.fxHandle.stop();
                if (!this.noHeatFocus) {
                    this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([this, ig.game.playerEntity]),
                        0, 0);
                    ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
                }
                this.effects.bomb.spawnOnTarget("bombHeatTrail", this, {
                    duration: -1,
                    angle: Vec2.clockangle(a),
                    offset: {
                        z: 6
                    }
                })
            }
        },
        update: function() {
            this.coll.pos.z < ig.game.minLevelZ && this.explode();
            if (this.heatMode) {
                (this.coll.totalBlockTimer > 0 || this.coll.partlyBlockTimer > 0) && this.explode();
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && this.explode()
            } else if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && this.explode();
                this.currentAnim == "ticking" && this.timer <= 0.75 && this.setLastSecond()
            }
            if (this.currentAnim == "ticking" && this.sprites.length > 1) {
                var a = this.sprites[1],
                    b = this.sprites[2],
                    c = a.size.y + a.size.z,
                    e = (this.timer - 0.75) / (3 / sc.options.get("assist-puzzle-speed") - 0.75 - 1.5),
                    e = e.limit(0, 1),
                    e = Math.ceil(8 * (1 - e));
                a.setGfxCut(c - 1 - e, 1);
                b.setGfxCut(c - 7 - e, 7)
            }
            a = this.coll;
            a.friction.terrain = ig.terrain.getTerrain(a, true) == ig.TERRAIN.ICE ? 0.02 : 1;
            this.parent()
        },
        absorbFerro: function() {
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle,
                "SLOW", KEY_SPLINES.EASE_IN_OUT);
            this.kill()
        },
        ballHit: function(a) {
            if (this.heatMode) return false;
            var d = a.getHitCenter(this),
                c = a.getHitVel(this, b),
                e = a.isBall && !a.attackInfo.hasHint("CHARGED") && a.attackInfo.element == sc.ELEMENT.HEAT;
            if (!a.attackInfo.hasHint("DEEP_FLAME") && a.isBall && !a.attackInfo.hasHint("CHARGED") && (!this.timer || !e)) {
                sc.combat.showHitEffect(this, d, sc.ATTACK_TYPE.NONE, a.getElement(), true, false, true);
                return true
            }
            sc.combat.showHitEffect(this, d, sc.ATTACK_TYPE.MEDIUM, a.getElement(), false, false,
                true);
            if (a.attackInfo.hasHint("DEEP_FLAME")) {
                d = a.getCombatantRoot();
                d.target && ig.CollTools.getDistVec2(this.coll, d.target.coll, c);
                this.enterHeatMode(c, a.getCombatantRoot())
            } else !e && a.attackInfo.element == sc.ELEMENT.HEAT ? this.enterHeatMode(c, a.getCombatantRoot()) : this.timer ? this.explode() : this.start(c, a.getCombatantRoot());
            return true
        },
        onTouchGround: function(a) {
            if (this.coll.pos.z >= -1 && !this.coll.ignoreCollision) {
                var b = this.getCenter();
                a < -50 && ig.game.effects.dust.spawnFixed("medium", b.x, b.y, this.coll.pos.z);
                if ((a = ig.EntityTools.getGroundEntity(this)) && a.bombSnap) this.coll.vel.z = 0
            }
        },
        isBallAdjust: function() {
            return true
        },
        doBallAdjust: function(a, b, c) {
            this.getCenter(a);
            Vec3.assign(c, this.coll.size);
            return 0
        },
        isBallDestroyer: function(a, b, c) {
            return this.heatMode || !c || this.timer && !sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? true : false
        }
    });
    sc.COMBAT_POI.BOMB_PANEL = {
        _wm: {
            attributes: {
                ready: {
                    _type: "Boolean",
                    _info: "If true: Bomb panel has to include a bomb "
                }
            }
        },
        filterEntities: function(a, b, c) {
            for (var c = c.ready,
                    e = b.length; e--;) {
                var f = b[e];
                f instanceof ig.ENTITY.BombPanel && (!c || f.hasBomb()) && a.push(f)
            }
            return a
        }
    }
});
ig.baked = !0;
