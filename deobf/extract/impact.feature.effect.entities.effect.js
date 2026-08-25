ig.module("impact.feature.effect.entities.effect").requires("impact.base.entity", "impact.base.entity-pool").defines(function() {
    var b = Vec3.create(),
        a = Vec2.create();
    ig.EFFECT_STATE = {
        RUNNING: 0,
        POST_LOOP: 1,
        ENDED: 2
    };
    ig.ENTITY.Effect = ig.Entity.extend({
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        rotOffset: null,
        angle: 0,
        flipX: false,
        duration: 0,
        state: ig.EFFECT_STATE.RUNNING,
        effect: null,
        target: null,
        spriteFilter: null,
        timelineIndex: 0,
        timer: 0,
        looped: false,
        particles: [],
        runners: [],
        align: ig.ENTITY_ALIGN.BOTTOM,
        target2: {
            point: null,
            entity: null,
            align: null,
            offset: Vec3.create()
        },
        attachGroup: null,
        callback: null,
        rotateFace: 0,
        flipLeftFace: false,
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this._initEffect(f)
        },
        reset: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this._initEffect(f)
        },
        _initEffect: function(b) {
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);
            this.state = ig.EFFECT_STATE.RUNNING;
            this.effect = b.effect;
            this.target = b.target || null;
            this.target2.point = b.target2Point || null;
            this.target2.entity = b.target2 || null;
            this.target2.align = b.target2Align ||
                null;
            this.noMultiGroup = b.noMultiGroup || false;
            b.target2Offset ? Vec3.assign(this.target2.offset, b.target2Offset) : Vec3.assignC(this.target2.offset, 0, 0, 0);
            this.spriteFilter = b.spriteFilter === void 0 ? null : b.spriteFilter;
            this.angle = b.angle || 0;
            this.flipX = b.flipX || false;
            this.duration = b.duration || this.effect.loopEndTime;
            b.offset ? Vec3.assign(this.offset, b.offset) : Vec3.assignC(this.offset, 0, 0, 0);
            Vec3.add(this.coll.pos, this.offset);
            if (this.rotOffset = b.rotOffset || null) {
                var c = Vec2.rotate(this.rotOffset, -this.angle,
                    a);
                Vec2.add(this.coll.pos, c)
            }
            this.rotateFace = b.rotateFace;
            this.flipLeftFace = b.flipLeftFace;
            this.attachGroup = b.group || null;
            this.align = (typeof b.align == "string" ? ig.ENTITY_ALIGN[b.align] : b.align) || 0;
            this.timer = this.timelineIndex = 0;
            this.looped = false;
            this.particles.length = 0;
            this.runners.length = 0;
            this.callback = b.callback;
            this.coll.time.parent = null;
            this.coll.time.parentAnimToGlobal = false;
            if (this.target) {
                this.target.addEntityAttached(this);
                this.target.coll.parentColl && this.target.coll.parentColl.entity.addEntityAttached(this);
                this.coll.time.parent = this.target.coll;
                this.coll.time.parentAnimToGlobal = true
            }
            if (this.target2 && this.target2.entity && this.target2.entity != this.target) {
                this.target2.entity.addEntityAttached(this);
                this.target2.entity.coll.parentColl && this.target2.entity.coll.parentColl.entity.addEntityAttached(this)
            }
            this.actionTarget = null
        },
        attachToAction: function(a) {
            this.actionTarget = a;
            a.addActionAttached(this);
            this.actionTarget != this.target && this.actionTarget != this.target2 && a.addEntityAttached(this)
        },
        setTimeEntity: function(a) {
            this.coll.time.parent =
                a && a.coll || null
        },
        setIgnoreSlowdown: function() {
            this.coll.time.parent = null;
            this.coll.time.globalStatic = true
        },
        getTarget2Pos: function(a) {
            this.target2.point ? Vec3.assign(a, this.target2.point) : this.target2.entity && this.target2.entity.getAlignedPos(this.target2.align, a);
            this.target2.offset && Vec3.add(a, this.target2.offset);
            return a
        },
        stop: function() {
            this.duration = 0
        },
        isDone: function() {
            return this.state == ig.EFFECT_STATE.ENDED
        },
        getRemainingTime: function() {
            return this.effect.getRemainingTime(this)
        },
        setCallback: function(a) {
            this.callback =
                a
        },
        onActionEndDetach: function() {
            this.stop()
        },
        onEntityKillDetach: function() {
            this.stop()
        },
        spawnParticle: function(a, b, e, f) {
            if (this._killed) throw Error("Spawned Particle after effects has been killed!");
            var g = f && this.target ? this.target.coll : this.coll,
                f = g.pos.x + (b && b.x || 0),
                h = g.pos.y + (b && b.y || 0),
                b = g.pos.z + (b && b.z || 0);
            e.ownerEffect = this;
            a = ig.game.spawnEntity(a, f, h, b, e);
            a.coll.time.parent = this.coll;
            if (a.face && this.target.face) {
                Vec2.assign(a.face, this.target.face);
                a.updateAnim()
            }
            if (!a.handle) throw Error("Particle has no handle!");
            this.particles.push(a.handle)
        },
        update: function() {},
        deferredUpdate: function() {
            var d = this.coll;
            if (this.target && this.target.face && this.rotateFace) {
                var c;
                c = this.rotateFace > 0 ? ig.getRoundedFaceDir(this.target.face.x, this.target.face.y, this.rotateFace, a) : this.target.face;
                this.angle = Vec2.clockangle(c);
                if (this.flipLeftFace && this.angle > Math.PI) this.flipX = true
            }
            var e = c = 0,
                f = 0;
            if (this.target && this.align) {
                f = this.target.getAlignedPos(this.align, b);
                Vec3.add(f, this.offset);
                if (this.rotOffset) {
                    c = Vec2.rotate(this.rotOffset,
                        -this.angle, a);
                    Vec2.add(f, c)
                }
                c = f.x - d.pos.x;
                e = f.y - d.pos.y;
                f = f.z - d.pos.z;
                d.pos.x = d.pos.x + c;
                d.pos.y = d.pos.y + e;
                d.pos.z = d.pos.z + f
            }
            for (var g = this.effect.isEnding(this), h = this.particles.length; h--;) {
                var i = this.particles[h],
                    j = i.entity.coll,
                    k = i.moveWithTarget && (i.maxTime < 0 || i.moveWithTarget >= i.timer / i.maxTime);
                if (g && (i.maxTime < 0 || k && i.cancelable)) {
                    i.cancelable = false;
                    i.cancel()
                }
                if (i.maxTime >= 0 && i.timer >= i.maxTime) {
                    i.entity.kill();
                    this.particles.splice(h, 1)
                } else if (this.target) {
                    if (k && !i.entity.autoTargetStuck) {
                        j.pos.x =
                            j.pos.x + c;
                        j.pos.y = j.pos.y + e;
                        j.pos.z = j.pos.z + f
                    } else if (d.time.parent && d.time.parent.time.factor < 1) j.time.parent = null;
                    this.target.face && i.syncFace && Vec2.assign(i.entity.face, this.target.face)
                }
            }
            this.effect.update(this);
            this.effect.isDone(this) && (this.particles.length == 0 && this.runners.length == 0) && this.kill()
        },
        updateRunners: function() {
            for (var a = this.runners.length; a--;) this.runners[a].update(this) && this.runners.splice(a, 1)
        },
        cancelRunners: function(a) {
            for (var b = this.runners.length; b--;) this.runners[b].cancel(this,
                a) && this.runners.splice(b, 1)
        },
        onKill: function(a) {
            if (this.target) {
                this.target.removeEntityAttached(this);
                this.target.removeActionAttached && this.target.removeActionAttached(this);
                if (this.target.coll.parentColl) {
                    var b = this.target.coll.parentColl.entity;
                    b.removeEntityAttached(this);
                    b.removeActionAttached && b.removeActionAttached(this)
                }
            }
            if (this.target2.entity && this.target2.entity != this.target) {
                this.target2.entity.removeEntityAttached(this);
                if (this.target2.entity.coll.parentColl) {
                    b = this.target2.entity.coll.parentColl.entity;
                    b.removeEntityAttached(this)
                }
            }
            if (this.actionTarget) {
                this.actionTarget.removeActionAttached(this);
                this.actionTarget != this.target && this.actionTarget != this.target2 && this.actionTarget.removeEntityAttached(this)
            }
            this.parent(a)
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.Effect);
    ig.EffectTools = {};
    ig.EffectTools.clearEffects = function(a, b) {
        a.clearEntityAttached(function(a) {
            return a instanceof ig.ENTITY.Effect && (!b || b == a.attachGroup)
        })
    };
    ig.EffectTools.getFirstEffect = function(a, b) {
        for (var e = a.entityAttached, f = e.length; f--;) {
            var g =
                e[f];
            if (g instanceof ig.ENTITY.Effect && b == g.attachGroup) return g
        }
        return null
    }
});
ig.baked = !0;
