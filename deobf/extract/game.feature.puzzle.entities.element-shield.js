ig.module("game.feature.puzzle.entities.element-shield").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    function b(a) {
        return a instanceof sc.ElementShieldEntity
    }
    var a = ["---", "Heat", "Cold", "Shock", "Wave"],
        d = Vec2.create(),
        c = Vec3.create();
    ig.ENTITY.ElementShieldSrc = ig.AnimatedEntity.extend({
        respawnTimer: 0,
        currentShield: null,
        active: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                element: {
                    _type: "String",
                    _info: "Element of shield",
                    _select: ["HEAT", "COLD", "SHOCK", "WAVE"],
                    _default: "HEAT"
                },
                onActivateAdd: {
                    _type: "VarName",
                    _info: "Add 1 if shield is activated",
                    _optional: true
                }
            }
        }),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(16, 16, 0);
            this.coll.zGravityFactor = 1E3;
            this.element = d.element || "HEAT";
            this.onActivateAdd = d.onActivateAdd || null;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 16,
                    height: 16,
                    xCount: 1,
                    offX: 32,
                    offY: 48
                },
                SUB: [{
                    name: "idle",
                    time: 1,
                    frames: [0],
                    repeat: false
                }]
            });
            this.setCurrentAnim("on")
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
            }
            this.active = true;
            this.spawnShield(a)
        },
        onHideRequest: function() {
            this.active = false;
            if (this.currentShield) {
                this.currentShield.panel = null;
                this.currentShield.destroy()
            }
            ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        update: function() {
            if (this.respawnTimer) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                this.respawnTimer <= 0 && this.spawnShield()
            }
            this.parent()
        },
        spawnShield: function(a) {
            if (this.active) {
                this.respawnTimer = 0;
                this.setCurrentAnim("on");
                var b = this.getCenter(d);
                this.currentShield = ig.game.spawnEntity(sc.ElementShieldBallEntity, b.x, b.y, this.coll.pos.z + 12, {
                    panel: this,
                    element: this.element
                }, !a)
            }
        },
        onShieldReset: function() {
            this.currentShield = null;
            this.respawnTimer = 1;
            this.onActivateAdd && ig.vars.add(this.onActivateAdd,
                1)
        }
    });
    sc.ElementShieldBallEntity = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element of shield",
                    _select: ["HEAT", "COLD", "SHOCK", "WAVE"]
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.shield")
        },
        sounds: {
            charge: new ig.Sound("media/sound/puzzle/element-ball-charge.ogg", 1, 0)
        },
        panel: null,
        state: 0,
        charge: {
            current: 0,
            prev: 0,
            timer: 0
        },
        dischargeTimer: 0,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16, 16,
                16);
            this.coll.zGravityFactor = 1;
            this.coll.float.height = 12;
            this.coll.float.variance = 3;
            this.coll.float.accel = 5;
            this.coll.shadow.size = 16;
            this.coll.zBounciness = 0.5;
            this.coll.bounciness = 0;
            this.coll.friction.air = 0.2;
            this.coll.setPos(a - this.coll.size.x / 2, b - this.coll.size.y / 2, c);
            this.coll.setPadding(2, 2);
            this.element = sc.ELEMENT[d.element];
            this.panel = d.panel;
            this.rotateTimer = 0;
            a = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
            a.setOffset(0, 4, 0);
            ig.light.addLightHandle(a);
            this.initAnimations({
                shapeType: "Y_FLAT",
                wallY: 0,
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 24,
                    height: 24,
                    xCount: 5,
                    offX: 128,
                    offY: 64
                },
                SUB: [{
                    time: 1,
                    frames: [0],
                    repeat: false,
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "charge"
                    }]
                }, {
                    time: 1,
                    renderMode: "lighter",
                    repeat: false,
                    SUB: [{
                        name: "idle",
                        frames: [1 + (this.element - 1) * 2]
                    }, {
                        name: "idle",
                        frames: [-1, -1, -1, -1, 0, 1, 2, 3, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1],
                        time: 0.05,
                        tileOffset: 9,
                        repeat: true
                    }, {
                        name: "charge",
                        frames: [1 + (this.element - 1) * 2]
                    }, {
                        name: "charge",
                        frames: [2 + (this.element - 1) * 2]
                    }]
                }]
            });
            this.setCurrentAnim("idle")
        },
        show: function(b) {
            this.parent(b);
            if (!b) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget("show" + a[this.element], this, {
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                })
            }
        },
        onEffectEvent: function(a) {
            if (!this._killed && a.state == ig.EFFECT_STATE.ENDED) {
                if (a == this.effects.hitHandle) this.effects.hitHandle = null;
                this.isDestroyed() && this.kill()
            }
        },
        onActionEndDetach: function() {
            this.state < 3 && this.destroy()
        },
        update: function() {
            var a = this.isCharged() ? 3 : this.charge.current || Vec2.length(this.coll.vel) > 20 ? 2 : 1;
            this.rotateTimer = (this.rotateTimer +
                a * ig.system.tick) % 1;
            if (this.charge.timer) {
                this.charge.timer = this.charge.timer - ig.system.tick;
                if (this.charge.timer <= 0) {
                    this.charge.timer = 0;
                    this.charge.current || this.setCurrentAnim("idle")
                }
            }
            if (this.dischargeTimer) {
                this.dischargeTimer = this.dischargeTimer - ig.system.tick;
                if (this.dischargeTimer <= 0)
                    if (this.isCharged()) this.destroy();
                    else {
                        this.charge.prev = this._getVisibleCharge();
                        this.charge.current--;
                        this.charge.timer = 0.1;
                        this.dischargeTimer = this.charge.current > 0 ? 0.1 : 0
                    }
            }
            this.parent()
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length > 0 && !this.isDestroyed()) {
                var a = this.rotateTimer / 1,
                    b = this.sprites[0];
                b.setPivot(12, 12);
                b.setTransform(1, 1, a * Math.PI * 2);
                b.setAlpha(0.6)
            }
            if (this.currentAnim == "charge" && this.sprites.length >= 3) {
                a = this._getVisibleCharge() / 4;
                a = a == 1 ? 24 : 2 + Math.round(20 * a);
                b = 24 - a;
                this.sprites[1].setGfxCut(0, a);
                this.sprites[2].setGfxCut(b, 0)
            } else {
                this.sprites[1] && this.sprites[1].setGfxCut(0, 0);
                this.sprites[2] && this.sprites[2].setGfxCut(0, 0)
            }
        },
        _getVisibleCharge: function() {
            var a = this.charge.timer / 0.1;
            return this.charge.prev *
                a + this.charge.current * (1 - a)
        },
        bounce: function(a, b, c) {
            if (this.panel && this.state == 0) this.state = 1;
            Vec2.assign(this.coll.vel, a);
            Vec2.length(this.coll.vel, b || 180);
            c && Vec2.flip(this.coll.vel)
        },
        ballHit: function(b) {
            if (this.state >= 3) return true;
            b.getHitCenter(this);
            var c = b.getElement(),
                g = b.getCombatant().getCombatantRoot();
            if (g.party != sc.COMBATANT_PARTY.PLAYER) return false;
            var h = b.getHitVel(this, d),
                c = this.element == c,
                i = 1;
            if (b instanceof sc.CompressedShockEntity || b instanceof sc.CompressedWaveEntity) {
                i = 2;
                b.destroy()
            }
            if (c) {
                this.charge.prev =
                    this._getVisibleCharge();
                this.charge.current = this.charge.current + i;
                this.charge.timer = 0;
                this.dischargeTimer = 0.3 * i;
                if (this.charge.current >= 4) {
                    this.charge.current = 4;
                    this.state = 3;
                    ig.game.spawnEntity(sc.ElementShieldEntity, 0, 0, 0, {
                        source: this,
                        element: this.element,
                        target: g
                    })
                }
                this.setCurrentAnim("charge")
            }
            this.clearHitHandle();
            g = "hit";
            if (c) {
                g = "charge" + a[this.element];
                i = 1 + (this.charge.current - 1) * 0.2;
                ig.SoundHelper.playAtEntity(this.sounds.charge, this, false, {
                    speed: i
                })
            }
            if (this.charge.current >= 4) {
                this.dischargeTimer =
                    0.3;
                Vec2.mulF(this.coll.vel, 0);
                this.coll.time.globalStatic = true;
                this.effects.hitHandle = this.effects.sheet.spawnOnTarget(g + "Max", this, {
                    duration: -1,
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                });
                sc.combat.doDramaticEffect(this, ig.game.playerEntity, sc.DRAMATIC_EFFECT.ELEMENT_SHIELD, true)
            } else this.effects.hitHandle = this.effects.sheet.spawnOnTarget(g, this, {
                callback: this,
                duration: 0.3,
                offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            });
            i = 150;
            if (this.isCharged()) {
                i = !b.isBall ? 350 : 250;
                c = false
            } else if (b.isBall) b.attackInfo.hasHint("CHARGED") || (i = 100);
            else {
                i =
                    100;
                c = false
            }!c || ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) > 32 ? this.bounce(h, i, c) : Vec2.mulF(this.coll.vel, 0.5);
            return true
        },
        isBallDestroyer: function() {
            return true
        },
        isIdle: function() {
            return this.state == 0
        },
        isCharged: function() {
            return this.state == 3
        },
        isDestroyed: function() {
            return this.state == 4
        },
        clearHitHandle: function() {
            if (this.effects.hitHandle) {
                this.effects.hitHandle.setCallback(null);
                this.effects.hitHandle.stop()
            }
        },
        destroy: function() {
            if (!this.isDestroyed()) {
                if (this.panel) this.panel.onShieldReset();
                this.state = 4;
                this.clearHitHandle();
                this.effects.hitHandle = this.effects.sheet.spawnOnTarget("destroy" + a[this.element], this, {
                    callback: this,
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                })
            }
        }
    });
    sc.ElementShieldEntity = ig.AnimatedEntity.extend({
        effects: {
            sheet: new ig.EffectSheet("puzzle.shield"),
            handle: null
        },
        target: null,
        timer: 0,
        endWarning: false,
        init: function(c, d, g, h) {
            this.parent(c, d, g, h);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(48, 48, 0);
            this.element = h.element;
            this.target = h.target;
            c = h.source;
            this.initAnimations({
                guiSprites: true,
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 48,
                    height: 48,
                    xCount: 2,
                    offX: 0,
                    offY: 64
                },
                offset: {
                    y: 256,
                    z: 256
                },
                SUB: [{
                    time: 1,
                    frames: [0],
                    repeat: false,
                    name: "default"
                }, {
                    time: 1,
                    renderMode: "lighter",
                    repeat: false,
                    SUB: [{
                        name: "default",
                        frames: [1 + this.element],
                        offset: {
                            y: 257,
                            z: 257
                        }
                    }, {
                        name: "default",
                        frames: [1],
                        offset: {
                            y: 258,
                            z: 258
                        }
                    }]
                }]
            });
            this.setCurrentAnim("default");
            this.timer = 8.4;
            this._updatePos();
            d = this.effects.sheet.spawnOnTarget("shieldAppear", this);
            d.setIgnoreSlowdown();
            d = this.effects.sheet.spawnOnTarget("shieldStart" +
                a[this.element], this.target, {
                    offset: {
                        z: 12
                    },
                    target2: c,
                    target2Offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                });
            d.setIgnoreSlowdown();
            this.effects.handle = this.effects.sheet.spawnOnTarget("shieldAura", this, {
                duration: -1
            });
            this.target.clearEntityAttached(b);
            this.target.addEntityAttached(this);
            c = [1, 1, 1, 1];
            c[this.element - 1] = 0;
            c = new sc.COMBAT_SHIELDS.DIRECTIONAL({
                baseFactor: 1,
                elementFactors: c,
                strength: "BLOCK_ALL",
                hitResist: "MASSIVE",
                stableOverride: "MASSIVE",
                neutralize: true,
                duration: -1,
                range: 1
            }, "elementOrbShield");
            this.connection = this.target.addShield(c,
                0)
        },
        onEntityKillDetach: function() {
            this.timer && this.destroy()
        },
        _updatePos: function() {
            var a = this.target.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c);
            Vec2.addMulF(a, this.coll.size, -0.5);
            a.z = a.z + 12;
            this.setPos(a.x, a.y, a.z)
        },
        deferredUpdate: function() {
            this._updatePos();
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer / 8 < 0.25 && !this.endWarning) {
                    this.endWarning = true;
                    if (this.effects.handle) {
                        this.effects.handle.stop();
                        this.effects.handle = this.effects.sheet.spawnOnTarget("shieldAuraEnd", this, {
                            duration: -1
                        })
                    }
                }
                if (sc.model.isCutscene()) this.timer =
                    0;
                this.timer <= 0 && this.destroy()
            }
        },
        destroy: function() {
            this.timer = 0;
            this.connection.onEntityKillDetach();
            if (this.effects.handle) {
                this.effects.handle.stop();
                this.effects.handle = null
            }
            this.effects.sheet.spawnOnTarget("shieldClear" + a[this.element], this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            this._killed || a.state == ig.EFFECT_STATE.ENDED && this.kill()
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length >= 2) {
                var a = this.timer / 2;
                this.sprites[1].setPivot(24,
                    24);
                this.sprites[1].rotate = a * Math.PI * 2
            }
            if (this.timer <= 8) {
                var a = this.timer / 8,
                    b = 1;
                a < 0.25 && (b = Math.abs(Math.cos((0.25 - a) * 8 / 0.15 * Math.PI)));
                this.sprites.length >= 2 && this.sprites[1].setAlpha(b);
                if (this.sprites.length >= 3) {
                    b = Math.ceil(4 + KEY_SPLINES.EASE_IN_OUT.get(1 - a) * 40);
                    a = 0.5 * (1 - a);
                    this.sprites[2].setGfxCut(b, 0);
                    this.sprites[2].setTransform(1, 1, a * Math.PI * 2)
                }
            }
        }
    });
    sc.ElementShieldEntity.clearRunningShields = function(a) {
        a.clearEntityAttached(b)
    }
});
ig.baked = !0;
