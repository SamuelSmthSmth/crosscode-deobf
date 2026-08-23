/**
 * game.feature.puzzle.entities.element-shield
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.element-shield")`.
 *
 * Element shield puzzle: `ig.ENTITY.ElementShieldSrc` spawns
 * `sc.ElementShieldBallEntity` balls. Hitting the ball with balls of the
 * SAME element charges it (up to 4); at full charge it spawns
 * `sc.ElementShieldEntity`, a protective aura shield around the player with
 * a directional combat shield (`sc.COMBAT_SHIELDS.DIRECTIONAL`) that blocks
 * all but the chosen element, lasting ~8.4 seconds.
 */
ig.module("game.feature.puzzle.entities.element-shield")
    .requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    function isElementShield(entity) {
        return entity instanceof sc.ElementShieldEntity
    }

    var ELEMENT_FX_NAMES = ["---", "Heat", "Cold", "Shock", "Wave"],
        vecScratch = Vec2.create(),
        alignedPosScratch = Vec3.create();

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(16, 16, 0);
            this.coll.zGravityFactor = 1E3;
            this.element = settings.element || "HEAT";
            this.onActivateAdd = settings.onActivateAdd || null;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
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

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
            }
            this.active = true;
            this.spawnShield(show)
        },

        onHideRequest: function () {
            this.active = false;
            if (this.currentShield) {
                this.currentShield.panel = null;
                this.currentShield.destroy()
            }
            ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            effect.isDone() && this.hide()
        },

        update: function () {
            if (this.respawnTimer) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                this.respawnTimer <= 0 && this.spawnShield()
            }
            this.parent()
        },

        spawnShield: function (show) {
            if (this.active) {
                this.respawnTimer = 0;
                this.setCurrentAnim("on");
                var center = this.getCenter(vecScratch);
                this.currentShield = ig.game.spawnEntity(sc.ElementShieldBallEntity, center.x, center.y, this.coll.pos.z + 12, {
                    panel: this,
                    element: this.element
                }, !show)
            }
        },

        onShieldReset: function () {
            this.currentShield = null;
            this.respawnTimer = 1;
            this.onActivateAdd && ig.vars.add(this.onActivateAdd, 1)
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16, 16, 16);
            this.coll.zGravityFactor = 1;
            this.coll.float.height = 12;
            this.coll.float.variance = 3;
            this.coll.float.accel = 5;
            this.coll.shadow.size = 16;
            this.coll.zBounciness = 0.5;
            this.coll.bounciness = 0;
            this.coll.friction.air = 0.2;
            this.coll.setPos(x - this.coll.size.x / 2, y - this.coll.size.y / 2, z);
            this.coll.setPadding(2, 2);
            this.element = sc.ELEMENT[settings.element];
            this.panel = settings.panel;
            this.rotateTimer = 0;
            var lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
            lightHandle.setOffset(0, 4, 0);
            ig.light.addLightHandle(lightHandle);
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

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget("show" + ELEMENT_FX_NAMES[this.element], this, {
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                })
            }
        },

        onEffectEvent: function (effect) {
            if (!this._killed && effect.state == ig.EFFECT_STATE.ENDED) {
                if (effect == this.effects.hitHandle) this.effects.hitHandle = null;
                this.isDestroyed() && this.kill()
            }
        },

        onActionEndDetach: function () {
            this.state < 3 && this.destroy()
        },

        update: function () {
            var speed = this.isCharged() ? 3 : this.charge.current || Vec2.length(this.coll.vel) > 20 ? 2 : 1;
            this.rotateTimer = (this.rotateTimer + speed * ig.system.tick) % 1;
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

        updateSprites: function () {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length > 0 && !this.isDestroyed()) {
                var rotateProgress = this.rotateTimer / 1,
                    sprite = this.sprites[0];
                sprite.setPivot(12, 12);
                sprite.setTransform(1, 1, rotateProgress * Math.PI * 2);
                sprite.setAlpha(0.6)
            }
            if (this.currentAnim == "charge" && this.sprites.length >= 3) {
                var chargeProgress = this._getVisibleCharge() / 4,
                    chargeProgress = chargeProgress == 1 ? 24 : 2 + Math.round(20 * chargeProgress),
                    remaining = 24 - chargeProgress;
                this.sprites[1].setGfxCut(0, chargeProgress);
                this.sprites[2].setGfxCut(remaining, 0)
            } else {
                this.sprites[1] && this.sprites[1].setGfxCut(0, 0);
                this.sprites[2] && this.sprites[2].setGfxCut(0, 0)
            }
        },

        _getVisibleCharge: function () {
            var progress = this.charge.timer / 0.1;
            return this.charge.prev * progress + this.charge.current * (1 - progress)
        },

        bounce: function (vel, speed, flip) {
            if (this.panel && this.state == 0) this.state = 1;
            Vec2.assign(this.coll.vel, vel);
            Vec2.length(this.coll.vel, speed || 180);
            flip && Vec2.flip(this.coll.vel)
        },

        ballHit: function (ball) {
            if (this.state >= 3) return true;
            ball.getHitCenter(this);
            var element = ball.getElement(),
                root = ball.getCombatant().getCombatantRoot();
            if (root.party != sc.COMBATANT_PARTY.PLAYER) return false;
            var hitVel = ball.getHitVel(this, vecScratch),
                matchesElement = this.element == element,
                chargeAmount = 1;
            if (ball instanceof sc.CompressedShockEntity || ball instanceof sc.CompressedWaveEntity) {
                chargeAmount = 2;
                ball.destroy()
            }
            if (matchesElement) {
                this.charge.prev = this._getVisibleCharge();
                this.charge.current = this.charge.current + chargeAmount;
                this.charge.timer = 0;
                this.dischargeTimer = 0.3 * chargeAmount;
                if (this.charge.current >= 4) {
                    this.charge.current = 4;
                    this.state = 3;
                    ig.game.spawnEntity(sc.ElementShieldEntity, 0, 0, 0, {
                        source: this,
                        element: this.element,
                        target: root
                    })
                }
                this.setCurrentAnim("charge")
            }
            this.clearHitHandle();
            var fxName = "hit";
            if (matchesElement) {
                fxName = "charge" + ELEMENT_FX_NAMES[this.element];
                var pitch = 1 + (this.charge.current - 1) * 0.2;
                ig.SoundHelper.playAtEntity(this.sounds.charge, this, false, {
                    speed: pitch
                })
            }
            if (this.charge.current >= 4) {
                this.dischargeTimer = 0.3;
                Vec2.mulF(this.coll.vel, 0);
                this.coll.time.globalStatic = true;
                this.effects.hitHandle = this.effects.sheet.spawnOnTarget(fxName + "Max", this, {
                    duration: -1,
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                });
                sc.combat.doDramaticEffect(this, ig.game.playerEntity, sc.DRAMATIC_EFFECT.ELEMENT_SHIELD, true)
            } else this.effects.hitHandle = this.effects.sheet.spawnOnTarget(fxName, this, {
                callback: this,
                duration: 0.3,
                offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            });
            var speed = 150;
            if (this.isCharged()) {
                speed = !ball.isBall ? 350 : 250;
                matchesElement = false
            } else if (ball.isBall) ball.attackInfo.hasHint("CHARGED") || (speed = 100);
            else {
                speed = 100;
                matchesElement = false
            }
            !matchesElement || ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) > 32 ? this.bounce(hitVel, speed, matchesElement) : Vec2.mulF(this.coll.vel, 0.5);
            return true
        },

        isBallDestroyer: function () {
            return true
        },

        isIdle: function () {
            return this.state == 0
        },

        isCharged: function () {
            return this.state == 3
        },

        isDestroyed: function () {
            return this.state == 4
        },

        clearHitHandle: function () {
            if (this.effects.hitHandle) {
                this.effects.hitHandle.setCallback(null);
                this.effects.hitHandle.stop()
            }
        },

        destroy: function () {
            if (!this.isDestroyed()) {
                if (this.panel) this.panel.onShieldReset();
                this.state = 4;
                this.clearHitHandle();
                this.effects.hitHandle = this.effects.sheet.spawnOnTarget("destroy" + ELEMENT_FX_NAMES[this.element], this, {
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(48, 48, 0);
            this.element = settings.element;
            this.target = settings.target;
            var source = settings.source;
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
            var appearFx = this.effects.sheet.spawnOnTarget("shieldAppear", this);
            appearFx.setIgnoreSlowdown();
            var startFx = this.effects.sheet.spawnOnTarget("shieldStart" + ELEMENT_FX_NAMES[this.element], this.target, {
                offset: {
                    z: 12
                },
                target2: source,
                target2Offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            });
            startFx.setIgnoreSlowdown();
            this.effects.handle = this.effects.sheet.spawnOnTarget("shieldAura", this, {
                duration: -1
            });
            this.target.clearEntityAttached(isElementShield);
            this.target.addEntityAttached(this);
            var elementFactors = [1, 1, 1, 1];
            elementFactors[this.element - 1] = 0;
            var shieldConfig = new sc.COMBAT_SHIELDS.DIRECTIONAL({
                baseFactor: 1,
                elementFactors: elementFactors,
                strength: "BLOCK_ALL",
                hitResist: "MASSIVE",
                stableOverride: "MASSIVE",
                neutralize: true,
                duration: -1,
                range: 1
            }, "elementOrbShield");
            this.connection = this.target.addShield(shieldConfig, 0)
        },

        onEntityKillDetach: function () {
            this.timer && this.destroy()
        },

        _updatePos: function () {
            var pos = this.target.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, alignedPosScratch);
            Vec2.addMulF(pos, this.coll.size, -0.5);
            pos.z = pos.z + 12;
            this.setPos(pos.x, pos.y, pos.z)
        },

        deferredUpdate: function () {
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
                if (sc.model.isCutscene()) this.timer = 0;
                this.timer <= 0 && this.destroy()
            }
        },

        destroy: function () {
            this.timer = 0;
            this.connection.onEntityKillDetach();
            if (this.effects.handle) {
                this.effects.handle.stop();
                this.effects.handle = null
            }
            this.effects.sheet.spawnOnTarget("shieldClear" + ELEMENT_FX_NAMES[this.element], this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            this._killed || effect.state == ig.EFFECT_STATE.ENDED && this.kill()
        },

        updateSprites: function () {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length >= 2) {
                var rotate = this.timer / 2;
                this.sprites[1].setPivot(24, 24);
                this.sprites[1].rotate = rotate * Math.PI * 2
            }
            if (this.timer <= 8) {
                var progress = this.timer / 8,
                    alpha = 1;
                progress < 0.25 && (alpha = Math.abs(Math.cos((0.25 - progress) * 8 / 0.15 * Math.PI)));
                this.sprites.length >= 2 && this.sprites[1].setAlpha(alpha);
                if (this.sprites.length >= 3) {
                    alpha = Math.ceil(4 + KEY_SPLINES.EASE_IN_OUT.get(1 - progress) * 40);
                    progress = 0.5 * (1 - progress);
                    this.sprites[2].setGfxCut(alpha, 0);
                    this.sprites[2].setTransform(1, 1, progress * Math.PI * 2)
                }
            }
        }
    });

    sc.ElementShieldEntity.clearRunningShields = function (entity) {
        entity.clearEntityAttached(isElementShield)
    }
});
ig.baked = !0;