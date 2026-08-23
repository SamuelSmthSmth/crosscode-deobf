/**
 * game.feature.puzzle.entities.ice-disk
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.ice-disk")`.
 *
 * `sc.IceDiskEntity`: a sliding disk of ice created by a water bubble hit
 * with COLD. It slides at 400 px/s, can carry damage to enemies, melts after
 * 1.5 s (or on HEAT), breaks after 5 wall bounces, and turns hot coals into
 * `sc.CooledCoals`. `sc.CooledCoals` is the cooled coal pile that reverts to
 * normal coals after a timer.
 */
ig.module("game.feature.puzzle.entities.ice-disk")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    var hitVelScratch = Vec2.create(),
        alignedPosScratch = Vec3.create();

    sc.IceDiskEntity = ig.AnimatedEntity.extend({
        timer: 0,
        combatant: null,
        state: 1,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble"),
            handle: null,
            hitHandle: null
        },
        cameraHandle: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0;
            this.coll.bounciness = 1;
            this.coll.setSize(16, 16, 16);
            this.coll.setPadding(4, 4);
            this.coll.friction.air = 0.2;
            this.coll.shadow.size = 24;
            this.coll.setPos(x - this.coll.size.x / 2, y - this.coll.size.y / 2, z);
            this.remainingHits = 5;
            this.coll.weight = 2E5;
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 24,
                    height: 24,
                    xCount: 1,
                    offX: 224,
                    offY: 16
                },
                SUB: [{
                    name: "idle",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }]
            });
            this.setCurrentAnim("idle");
            this.panel = settings.panel || null;
            this.coalCoolTime = settings.coalCoolTime;
            this.timer = 8 / sc.options.get("assist-puzzle-speed");
            this.animState.alpha = 0;
            this.coll.vel.z = 150;
            this.effects.sheet.spawnOnTarget("iceAppear", this, {})
        },

        slide: function (vel, combatant) {
            if (!this._killed && this.state != 2) {
                this.state = 2;
                var coll = this.coll;
                coll.maxVel = 400;
                coll.friction.ground = 0;
                coll.friction.air = 0;
                coll.noSlipping = true;
                coll.weight = 9001;
                Vec2.assign(coll.vel, vel);
                Vec2.round(coll.vel, Math.PI * 0.03);
                Vec2.length(coll.vel, 400);
                this.timer = 1.5;
                this.attackInfo = new sc.AttackInfo(combatant.params, {
                    element: sc.ELEMENT.COLD,
                    hints: ["ICE_DISK"]
                });
                if (!this.combatant) this.combatant = combatant;
                this.effects.handle && this.effects.handle.stop();
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.effects.sheet.spawnOnTarget("iceTrail", this, {
                    duration: -1,
                    angle: Vec2.clockangle(vel),
                    offset: {
                        z: 6
                    }
                })
            }
        },

        consume: function (pos) {
            this.state = 3;
            Vec2.assignC(this.coll.vel, 0, 0);
            ig.EffectTools.clearEffects(this);
            this.effects.sheet.spawnOnTarget("iceAbsorb", this, {
                callback: this,
                align: "CENTER"
            });
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            pos && this.setPos(pos.x - this.coll.size.x / 2, pos.y - this.coll.size.y / 2, pos.z)
        },

        onKill: function (parent) {
            parent || this.panel && this.panel.onBubbleBurst();
            this.parent(parent)
        },

        startMelt: function () {
            if (!this._killed) {
                Vec2.assignC(this.coll.vel, 0, 0);
                this.state = 3;
                this.effects.sheet.spawnOnTarget("iceMelt", this, {
                    callback: this,
                    align: "CENTER"
                })
            }
        },

        onEffectEvent: function (effect) {
            this._killed || effect.state == ig.EFFECT_STATE.ENDED && this.kill()
        },

        handleMovementTrace: function (trace) {
            if (!this._killed) {
                if (trace.collided) {
                    var center = this.getCenter();
                    center.x = center.x + trace.blockDir.x * this.coll.size.x / 2.05;
                    center.y = center.y + trace.blockDir.y * this.coll.size.y / 2.05;
                    if (!this.remainingHits) {
                        this.iceBreak();
                        return
                    }
                    this.remainingHits--;
                    this.effects.sheet.spawnFixed("iceBounce", center.x, center.y, this.coll.pos.z, null, {
                        angle: Vec2.clockangle(trace.blockDir)
                    })
                }
                this.parent(trace)
            }
        },

        iceBreak: function () {
            if (!this._killed) {
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                this.effects.sheet.spawnFixed("iceBreak", pos.x, pos.y, pos.z, null, {});
                this.kill()
            }
        },

        turnCooledCoals: function () {
            if (!this._killed) {
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                ig.game.spawnEntity(sc.CooledCoals, pos.x, pos.y, this.coll.pos.z, {
                    panel: this.panel,
                    coalCoolTime: this.coalCoolTime
                });
                this.panel = null;
                this.kill()
            }
        },

        absorbFerro: function () {
            this.panel = null;
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            this.kill()
        },

        update: function () {
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.state == 1 && this.coll.weight != -1 && this.coll.pos.z == this.coll.baseZPos) this.coll.weight = -1;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.state == 1 ? this.startMelt() : this.iceBreak()
                }
            }
            this.coll.pos.z < ig.game.minLevelZ && this.iceBreak();
            this.coll.pos.z == this.coll.baseZPos && ig.terrain.getTerrain(this.coll, true) == ig.TERRAIN.COAL && this.turnCooledCoals();
            this.parent()
        },

        ballHit: function (ball) {
            var element = ball.getElement();
            if (this.state == 3 || element != sc.ELEMENT.HEAT && this.state != 1) return false;
            var hitCenter = ball.getHitCenter(this),
                hitVel = ball.getHitVel(this, hitVelScratch);
            sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.MEDIUM, ball.getElement(), false, false, true);
            element == sc.ELEMENT.HEAT ? this.startMelt() : this.slide(hitVel, ball.getCombatantRoot());
            return true
        },

        onTouchGround: function (impactVelocity) {
            if (this.coll.pos.z >= -1 && !this.coll.ignoreCollision) {
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, alignedPosScratch);
                impactVelocity < -30 && this.effects.sheet.spawnFixed("iceLand", pos.x, pos.y, pos.z, null, {})
            }
        },

        collideWith: function (entity) {
            this.state == 2 && (entity.damage && entity.party != this.combatant.party ? entity.damage(this, this.attackInfo) && this.iceBreak() : entity instanceof ig.ENTITY.RegenDestruct && entity.ballHit(this) && this.consume(entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM)))
        },

        isBallAdjust: function () {
            return true
        },

        doBallAdjust: function (pos, other, size) {
            this.getCenter(pos);
            pos.z = this.coll.pos.z;
            Vec3.assign(size, this.coll.size);
            return 3
        },

        isBallDestroyer: function (entity, other, ignore) {
            return !ignore || sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? true : false
        },

        getHitCenter: function (entity, out) {
            return this.getOverlapCenterCoords(entity, out)
        },

        getHitVel: function (entity, out) {
            var vel = out || {};
            Vec2.assign(vel, this.coll.vel);
            return vel
        },

        getElement: function () {
            return sc.ELEMENT.COLD
        },

        getCombatant: function () {
            return this.combatant
        },

        getCombatantRoot: function () {
            return this.combatant.getCombatantRoot()
        },

        getAttackInfo: function () {
            return this.attackInfo
        },

        isIceDisk: function () {
            return true
        }
    });

    sc.CooledCoals = ig.AnimatedEntity.extend({
        timer: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.terrain = ig.TERRAIN.STONE;
            this.coll.zGravityFactor = 1;
            this.coll.setSize(28, 28, 2);
            this.coll.setPos(x - this.coll.size.x / 2, y - this.coll.size.y / 2, z);
            var coalsStyle = ig.mapStyle.get("coals");
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: 2,
                    z: 0
                },
                size: {
                    x: 32,
                    y: 32,
                    z: 0
                },
                sheet: {
                    src: coalsStyle.sheet,
                    width: 32,
                    height: 32,
                    xCount: 1,
                    offX: coalsStyle.x,
                    offY: coalsStyle.y
                },
                SUB: [{
                    name: "idle",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }]
            });
            this.setCurrentAnim("idle");
            this.panel = settings.panel || null;
            this.timer = (settings.coalCoolTime || 5) / sc.options.get("assist-puzzle-speed");
            this.effects.sheet.spawnOnTarget("coalsAppear", this, {})
        },

        onKill: function (parent) {
            parent || this.panel && this.panel.onBubbleBurst();
            this.parent(parent)
        },

        startMelt: function () {
            this._killed || this.effects.sheet.spawnOnTarget("coalsDisappear", this, {
                callback: this,
                align: "CENTER"
            })
        },

        onEffectEvent: function (effect) {
            this._killed || effect.state == ig.EFFECT_STATE.ENDED && this.kill()
        },

        update: function () {
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.startMelt()
                }
            }
            this.parent()
        }
    })
});
ig.baked = !0;