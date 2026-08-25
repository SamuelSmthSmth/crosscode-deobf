ig.module("game.feature.puzzle.entities.ice-disk").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create(),
        a = Vec3.create();
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
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0;
            this.coll.bounciness =
                1;
            this.coll.setSize(16, 16, 16);
            this.coll.setPadding(4, 4);
            this.coll.friction.air = 0.2;
            this.coll.shadow.size = 24;
            this.coll.setPos(a - this.coll.size.x / 2, b - this.coll.size.y / 2, e);
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
            this.panel = f.panel || null;
            this.coalCoolTime = f.coalCoolTime;
            this.timer = 8 / sc.options.get("assist-puzzle-speed");
            this.animState.alpha = 0;
            this.coll.vel.z = 150;
            this.effects.sheet.spawnOnTarget("iceAppear", this, {})
        },
        slide: function(a, b) {
            if (!this._killed && this.state != 2) {
                this.state = 2;
                var e = this.coll;
                e.maxVel = 400;
                e.friction.ground = 0;
                e.friction.air = 0;
                e.noSlipping = true;
                e.weight = 9001;
                Vec2.assign(e.vel, a);
                Vec2.round(e.vel, Math.PI * 0.03);
                Vec2.length(e.vel, 400);
                this.timer = 1.5;
                this.attackInfo = new sc.AttackInfo(b.params, {
                    element: sc.ELEMENT.COLD,
                    hints: ["ICE_DISK"]
                });
                if (!this.combatant) this.combatant =
                    b;
                this.effects.handle && this.effects.handle.stop();
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.effects.sheet.spawnOnTarget("iceTrail", this, {
                    duration: -1,
                    angle: Vec2.clockangle(a),
                    offset: {
                        z: 6
                    }
                })
            }
        },
        consume: function(a) {
            this.state = 3;
            Vec2.assignC(this.coll.vel, 0, 0);
            ig.EffectTools.clearEffects(this);
            this.effects.sheet.spawnOnTarget("iceAbsorb", this, {
                callback: this,
                align: "CENTER"
            });
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            a && this.setPos(a.x - this.coll.size.x /
                2, a.y - this.coll.size.y / 2, a.z)
        },
        onKill: function(a) {
            a || this.panel && this.panel.onBubbleBurst();
            this.parent(a)
        },
        startMelt: function() {
            if (!this._killed) {
                Vec2.assignC(this.coll.vel, 0, 0);
                this.state = 3;
                this.effects.sheet.spawnOnTarget("iceMelt", this, {
                    callback: this,
                    align: "CENTER"
                })
            }
        },
        onEffectEvent: function(a) {
            this._killed || a.state == ig.EFFECT_STATE.ENDED && this.kill()
        },
        handleMovementTrace: function(a) {
            if (!this._killed) {
                if (a.collided) {
                    var b = this.getCenter();
                    b.x = b.x + a.blockDir.x * this.coll.size.x / 2.05;
                    b.y = b.y + a.blockDir.y *
                        this.coll.size.y / 2.05;
                    if (!this.remainingHits) {
                        this.iceBreak();
                        return
                    }
                    this.remainingHits--;
                    this.effects.sheet.spawnFixed("iceBounce", b.x, b.y, this.coll.pos.z, null, {
                        angle: Vec2.clockangle(a.blockDir)
                    })
                }
                this.parent(a)
            }
        },
        iceBreak: function() {
            if (!this._killed) {
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                var a = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                this.effects.sheet.spawnFixed("iceBreak", a.x, a.y, a.z, null, {});
                this.kill()
            }
        },
        turnCooledCoals: function() {
            if (!this._killed) {
                this.cameraHandle &&
                    ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                var a = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                ig.game.spawnEntity(sc.CooledCoals, a.x, a.y, this.coll.pos.z, {
                    panel: this.panel,
                    coalCoolTime: this.coalCoolTime
                });
                this.panel = null;
                this.kill()
            }
        },
        absorbFerro: function() {
            this.panel = null;
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            this.kill()
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.state ==
                    1 && this.coll.weight != -1 && this.coll.pos.z == this.coll.baseZPos) this.coll.weight = -1;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.state == 1 ? this.startMelt() : this.iceBreak()
                }
            }
            this.coll.pos.z < ig.game.minLevelZ && this.iceBreak();
            this.coll.pos.z == this.coll.baseZPos && ig.terrain.getTerrain(this.coll, true) == ig.TERRAIN.COAL && this.turnCooledCoals();
            this.parent()
        },
        ballHit: function(a) {
            var c = a.getElement();
            if (this.state == 3 || c != sc.ELEMENT.HEAT && this.state != 1) return false;
            var e = a.getHitCenter(this),
                f = a.getHitVel(this, b);
            sc.combat.showHitEffect(this,
                e, sc.ATTACK_TYPE.MEDIUM, a.getElement(), false, false, true);
            c == sc.ELEMENT.HEAT ? this.startMelt() : this.slide(f, a.getCombatantRoot());
            return true
        },
        onTouchGround: function(b) {
            if (this.coll.pos.z >= -1 && !this.coll.ignoreCollision) {
                var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
                b < -30 && this.effects.sheet.spawnFixed("iceLand", c.x, c.y, c.z, null, {})
            }
        },
        collideWith: function(a) {
            this.state == 2 && (a.damage && a.party != this.combatant.party ? a.damage(this, this.attackInfo) && this.iceBreak() : a instanceof ig.ENTITY.RegenDestruct &&
                a.ballHit(this) && this.consume(a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM)))
        },
        isBallAdjust: function() {
            return true
        },
        doBallAdjust: function(a, b, e) {
            this.getCenter(a);
            a.z = this.coll.pos.z;
            Vec3.assign(e, this.coll.size);
            return 3
        },
        isBallDestroyer: function(a, b, e) {
            return !e || sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? true : false
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a, b)
        },
        getHitVel: function(a, b) {
            var e = b || {};
            Vec2.assign(e, this.coll.vel);
            return e
        },
        getElement: function() {
            return sc.ELEMENT.COLD
        },
        getCombatant: function() {
            return this.combatant
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot()
        },
        getAttackInfo: function() {
            return this.attackInfo
        },
        isIceDisk: function() {
            return true
        }
    });
    sc.CooledCoals = ig.AnimatedEntity.extend({
        timer: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble")
        },
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.terrain = ig.TERRAIN.STONE;
            this.coll.zGravityFactor = 1;
            this.coll.setSize(28, 28, 2);
            this.coll.setPos(a - this.coll.size.x /
                2, b - this.coll.size.y / 2, e);
            a = ig.mapStyle.get("coals");
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
                    src: a.sheet,
                    width: 32,
                    height: 32,
                    xCount: 1,
                    offX: a.x,
                    offY: a.y
                },
                SUB: [{
                    name: "idle",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }]
            });
            this.setCurrentAnim("idle");
            this.panel = f.panel || null;
            this.timer = (f.coalCoolTime || 5) / sc.options.get("assist-puzzle-speed");
            this.effects.sheet.spawnOnTarget("coalsAppear", this, {})
        },
        onKill: function(a) {
            a || this.panel && this.panel.onBubbleBurst();
            this.parent(a)
        },
        startMelt: function() {
            this._killed || this.effects.sheet.spawnOnTarget("coalsDisappear", this, {
                callback: this,
                align: "CENTER"
            })
        },
        onEffectEvent: function(a) {
            this._killed || a.state == ig.EFFECT_STATE.ENDED && this.kill()
        },
        update: function() {
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
