ig.module("impact.feature.effect.entities.effect-particle").requires("impact.base.entity", "impact.base.entity-pool").defines(function() {
    ig.ParticleHandle = ig.Class.extend({
        entity: null,
        syncFace: false,
        timer: 0,
        maxTime: 0,
        postAnimTime: 0,
        pData: null,
        particleState: null,
        startAngle: 0,
        angleSync: null,
        flipX: 0,
        moveWithTarget: 0,
        cancelable: false,
        init: function(a, b) {
            this.entity = a;
            this.syncFace = b
        },
        cancel: function() {
            if (this.maxTime < 0) {
                this.maxTime = 100;
                this.timer = this.maxTime - this.particleState.getMaxEndTime(this.postAnimTime)
            } else this.timer =
                Math.max(this.timer, this.maxTime - this.particleState.getMaxEndTime(this.postAnimTime))
        },
        setData: function(a) {
            var b = a.data;
            this.pData = b;
            this.particleState = b.state;
            this.maxTime = b.particleDuration;
            if (this.maxTime == -2) this.maxTime = a.ownerEffect.duration;
            if (!this.maxTime) this.maxTime = b.anim && b.anim.getDuration() || 0;
            if (b.particleDurVariance) this.maxTime = this.maxTime + (Math.random() * 2 - 1) * b.particleDurVariance;
            this.postAnimTime = b.postAnim && b.postAnim.getDuration() || 0;
            this.timer = 0;
            this.moveWithTarget = b.moveWithTarget;
            this.cancelable = b.cancelable;
            this.flipX = a.flipX || false;
            this.startAngle = a.angle || 0;
            if (b.angleVary) this.startAngle = this.startAngle + (Math.random() - 0.5) * b.angleVary * Math.PI * 2;
            if (b.randFlip && Math.random() < 0.5) this.flipX = !this.flipX;
            this.angleSync = a.angleSync || null;
            if (b.light) {
                var a = -1,
                    c = 0.05;
                if (this.maxTime > 0) c = a = this.maxTime / 2;
                this.lightHandle = new ig.LightHandle(this.entity, b.light, 0, c, a, 1, false);
                ig.light.addLightHandle(this.lightHandle)
            }
        },
        onUpdate: function() {
            if (this.angleSync) this.startAngle = this.angleSync.angle;
            this.timer = this.timer + ig.system.tick;
            this.postAnimTime && (this.maxTime > 0 && this.maxTime - this.timer < this.postAnimTime) && this.entity.setCurrentAnim("post", true)
        },
        initSprite: function(a) {
            this.particleState.initSprite(a, this.startAngle, this.flipX)
        },
        updateSprite: function(a) {
            this.particleState.updateSprite(a, this.timer, this.maxTime, this.postAnimTime, this.startAngle, this.flipX, this.angleSync)
        },
        initAnimState: function(a) {
            this.particleState.initAnimState(a, this.startAngle, this.flipX)
        },
        updateAnimState: function(a) {
            this.particleState.updateAnimState(a,
                this.timer, this.maxTime, this.postAnimTime, this.startAngle, this.flipX, this.angleSync)
        },
        initAnimations: function(a) {
            var b = this.pData;
            a.replaceAnimationSet("default", b.anim);
            if (b.followUpAnim) {
                a.replaceAnimationSet("followUp", b.followUpAnim);
                this.entity.setCurrentAnim("default", true, "followUp", true)
            } else {
                a.removeAnimSet("followUp");
                this.entity.setCurrentAnim("default", true, null, true)
            }
            b.postAnim ? a.replaceAnimationSet("post", b.postAnim) : a.removeAnimSet("post")
        }
    });
    ig.ENTITY.Particle = ig.AnimatedEntity.extend({
        handle: null,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.animSheet = new ig.AnimationSheet;
            this.handle = new ig.ParticleHandle(this);
            this._initParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initParticle(d)
        },
        _initParticle: function(a) {
            this.handle.setData(a);
            this.coll.type = a.collision ? ig.COLLTYPE.PASSIVE : ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);
            this.coll.alwaysRender = true;
            a.vel && Vec2.assign(this.coll.vel, a.vel);
            this.coll.friction.ground = a.friction || 0;
            this.coll.friction.air = this.coll.friction.ground;
            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState)
        },
        update: function() {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent()
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.Particle);
    ig.ENTITY.FaceParticle = ig.AnimatedEntity.extend({
        handle: null,
        face: {
            x: 0,
            y: 0
        },
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.animSheet = new ig.AnimationSheet;
            this.handle = new ig.ParticleHandle(this, true);
            this._initFaceParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b,
                c, d);
            this.face.x = this.face.y = 0;
            this._initFaceParticle(d)
        },
        _initFaceParticle: function(a) {
            this.handle.setData(a);
            this.handle.moveWithTarget = 1;
            this.coll.type = ig.COLLTYPE.NONE;
            if (a.size) {
                a = a.size;
                this.coll.setSize(a.x, a.y, a.z)
            } else this.coll.setSize(0, 0, 0);
            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState)
        },
        update: function() {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent()
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.FaceParticle);
    ig.ENTITY.CopyParticle =
        ig.Entity.extend({
            handle: null,
            color: null,
            colorAlpha: null,
            noLighter: false,
            oldPos: Vec3.create(),
            init: function(a, b, c, d) {
                this.parent(a, b, c, d);
                this.handle = new ig.ParticleHandle(this);
                this._initCopyParticle(d)
            },
            reset: function(a, b, c, d) {
                this.parent(a, b, c, d);
                this._initCopyParticle(d)
            },
            _initCopyParticle: function(a) {
                this.handle.setData(a);
                this.coll.type = ig.COLLTYPE.NONE;
                this.coll.friction.ground = 0;
                this.color = a.color || null;
                this.fadeColor = a.fadeColor || null;
                this.colorAlpha = a.colorAlpha || 1;
                this.noLighter = a.noLighter ||
                    false;
                for (var b = a.spriteFilter, c = a.entity, d = c.sprites.length && c.sprites[0].gui || false, e = 0, k = c.sprites.length; k--;)
                    if (!b || b.indexOf(k) != -1) {
                        this.setSpriteCount(e + 1, d);
                        var l = this.sprites[e];
                        l.assign(c.sprites[k]);
                        l.setShadow(0, 0, 0, 0);
                        l.pos.y = l.pos.y - 1;
                        l.gfxOffset.y = l.gfxOffset.y + 1;
                        a.offset && Vec3.add(l.pos, a.offset);
                        this.handle.initSprite(l);
                        e++
                    } Vec3.assign(this.oldPos, this.coll.pos)
            },
            initSprites: function() {},
            update: function() {
                this.handle.onUpdate();
                this.parent()
            },
            updateSprites: function() {
                var a = Vec3.sub(this.coll.pos,
                    this.oldPos, d);
                Vec3.assign(this.oldPos, this.coll.pos);
                var b = this.color;
                if (this.fadeColor) {
                    var b = this.handle.timer / this.handle.maxTime,
                        c = new ig.RGBColor(this.color),
                        e = new ig.RGBColor(this.fadeColor);
                    ig.RGBColor.interpolate(c, e, b, c);
                    b = c.toRGB()
                }
                for (c = this.sprites.length; c--;) {
                    Vec3.add(this.sprites[c].pos, a);
                    this.noLighter ? this.sprites[c].setOverlayColor(b, this.colorAlpha) : this.sprites[c].setLighterOverlayColor(b, this.colorAlpha);
                    this.handle.updateSprite(this.sprites[c])
                }
            }
        });
    ig.EntityPool.enableFor(ig.ENTITY.CopyParticle);
    ig.ENTITY.DebrisParticle = ig.AnimatedEntity.extend({
        handle: null,
        minZVel: 8,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.animSheet = new ig.AnimationSheet;
            this.handle = new ig.ParticleHandle(this);
            this._initDeprisParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initDeprisParticle(d)
        },
        _initDeprisParticle: function(a) {
            this.handle.setData(a);
            this.coll.type = ig.COLLTYPE.PASSIVE;
            var b = a.debrisSize;
            b ? this.coll.setSize(b.x, b.y, b.z) : this.coll.setSize(8, 8, 8);
            this.coll.zGravityFactor = a.zGravityFactor ==
                void 0 ? 1 : a.zGravityFactor;
            this.coll.zBounciness = a.zBounciness == void 0 ? 0.9 : a.zBounciness;
            this.coll.bounciness = 1;
            this.coll.friction.ground = 1;
            this.coll.friction.air = 0;
            this.coll.shadow.size = a.shadowSize;
            b = this.coll;
            b.setPos(b.pos.x - b.size.x / 2, b.pos.y - b.size.y / 2, b.pos.z);
            a.vel && Vec2.assign(this.coll.vel, a.vel);
            this.coll.vel.z = a.zVel || 0;
            this.minZVel = a.minZVel || 0;
            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState)
        },
        update: function() {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent()
        },
        onTouchGround: function() {
            if (this.minZVel && this.coll.vel.z < this.minZVel) this.coll.vel.z = this.minZVel
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.DebrisParticle);
    var b = Vec2.create(),
        a = Vec2.create();
    ig.ENTITY.OffsetParticle = ig.ENTITY.Particle.extend({
        startFactor: 0,
        moveOffset: Vec2.createC(0, 0),
        alongZ: false,
        keySpline: null,
        inverse: false,
        moveRotate: 0,
        rotateWithTime: false,
        rotateGfx: false,
        normalMoveDist: 0,
        moveDuration: 0,
        prevWeight: 0,
        moveTimer: 0,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        _initOffsetParticle: function(a) {
            this.coll.type = ig.COLLTYPE.NONE;
            this.startFactor = a.startFactor || 0;
            Vec2.assign(this.moveOffset, a.moveOffset);
            this.alongZ = a.alongZ || false;
            this.keySpline = a.keySpline || KEY_SPLINES.LINEAR;
            this.inverse = a.inverse || false;
            this.moveDuration = a.moveDuration || 0;
            this.moveRotate = a.moveRotate || 0;
            this.rotateWithTime = a.rotateWithTime || false;
            this.rotateGfx = a.rotateGfx || false;
            this.normalMoveDist = a.normalMoveDist ||
                0;
            this.moveTimer = 0;
            this.prevWeight = -1;
            this._updatePos()
        },
        _updatePos: function() {
            var c = this.prevWeight == -1 ? 0 : this.startFactor + this.prevWeight * (1 - this.startFactor);
            if (this.prevWeight == -1) this.prevWeight = 0;
            Vec2.mulF(this.moveOffset, c, b);
            c = this.moveDuration || this.handle.maxTime;
            this.moveTimer = this.moveTimer + ig.system.tick;
            if (this.moveTimer > c) this.moveTimer = c;
            var d = this.moveTimer / c,
                d = this.keySpline.get(d);
            this.inverse && (d = 1 - d);
            var e = this.startFactor + d * (1 - this.startFactor);
            if (this.moveRotate) {
                var i = (this.rotateWithTime ?
                    ig.system.tick / c : d - this.prevWeight) * this.moveRotate * Math.PI * 2;
                this.inverse && (i = -i);
                Vec2.rotate(this.moveOffset, this.alongZ ? i : -i);
                if (this.rotateGfx) this.animState.angle = this.animState.angle + i
            }
            i = 0;
            this.normalMoveDist && (i = this.normalMoveDist * (ig.system.tick / c));
            Vec2.mulF(this.moveOffset, e, a);
            Vec2.sub(a, b);
            this.setPos(this.coll.pos.x + a.x, this.coll.pos.y + (this.alongZ ? i : a.y), this.coll.pos.z + (this.alongZ ? a.y : i));
            this.prevWeight = d
        },
        update: function() {
            this.parent();
            this._updatePos()
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.OffsetParticle);
    ig.ENTITY.RhombusParticle = ig.ENTITY.Particle.extend({
        startFactor: 0,
        moveFactor: 0,
        radius: 100,
        alongZ: false,
        keySpline: null,
        prevWeight: 0,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        _initOffsetParticle: function(a) {
            this.coll.type = ig.COLLTYPE.NONE;
            this.startFactor = a.startFactor || 0;
            this.moveFactor = a.moveFactor || 0;
            this.radius = a.radius || 0;
            this.alongZ = a.alongZ || false;
            this.keySpline = a.keySpline || KEY_SPLINES.LINEAR;
            this.prevWeight = this.startFactor;
            a = this._getRhombusOffset(b, this.startFactor, this.radius);
            this.setPos(this.coll.pos.x + a.x, this.coll.pos.y + (this.alongZ ? 0 : a.y), this.coll.pos.z + (this.alongZ ? a.y : 0))
        },
        _updatePos: function() {
            var c = this._getRhombusOffset(b, this.prevWeight, this.radius);
            this.prevWeight = this.startFactor + this.handle.timer / this.handle.maxTime * this.moveFactor;
            var d = this._getRhombusOffset(a, this.prevWeight, this.radius),
                c = Vec2.sub(d, c);
            this.setPos(this.coll.pos.x + c.x, this.coll.pos.y + (this.alongZ ?
                0 : c.y), this.coll.pos.z + (this.alongZ ? c.y : 0))
        },
        _getRhombusOffset: function(a, b, c) {
            b = (b % 1 + 1) % 1;
            a.x = c * (Math.abs(Math.abs(3 - 4 * b) - 2) - 1);
            a.y = c * (2 * Math.abs(1 - 2 * b) - 1);
            return a
        },
        update: function() {
            this.parent();
            this._updatePos()
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.RhombusParticle);
    var d = Vec3.create(),
        c = Vec3.create(),
        e = Vec3.create();
    ig.FX_HOMING_FLY_TYPE = {
        FLY_ARC: [{
            dist: function(a) {
                return a
            },
            normal: function(a) {
                return 1 - (2 * a - 1) * (2 * a - 1)
            }
        }],
        EXPAND_DASH: [{
                dist: function() {
                    return 0
                },
                normal: function(a) {
                    return KEY_SPLINES.EASE_OUT.get(a)
                }
            },
            {
                dist: function(a) {
                    return a
                },
                normal: function(a) {
                    return 1 - a
                }
            }
        ]
    };
    ig.ENTITY.HomingParticle = ig.ENTITY.Particle.extend({
        inverse: false,
        flyType: null,
        ownerEffect: 0,
        normalXY: 0,
        normalZ: 0,
        moveTimer: 0,
        phaseDurations: null,
        autoTargetStuck: true,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initOffsetParticle(d)
        },
        _initOffsetParticle: function(a) {
            this.coll.type = ig.COLLTYPE.NONE;
            this.flyType = ig.FX_HOMING_FLY_TYPE[a.flyType] || ig.FX_HOMING_FLY_TYPE.FLY_ARC;
            this.inverse = a.inverse || false;
            this.ownerEffect = a.ownerEffect;
            this.normalXY = a.normalXY;
            this.normalZ = a.normalZ;
            this.phaseDurations = a.phaseDurations || [];
            this.rotateMoveDir = a.rotateMoveDir || false;
            this.autoTargetStuck = true;
            var b = Math.random();
            if (a.target1Vary) {
                this.target1Vary = Vec2.createC(0, a.target1Vary * Math.sqrt(Math.random()));
                Vec2.rotate(this.target1Vary, b * 2 * Math.PI)
            } else this.target1Vary = null;
            if (a.target2Vary) {
                this.target2Vary = Vec2.createC(0, a.target2Vary * Math.sqrt(Math.random()));
                Vec2.rotate(this.target2Vary,
                    b * 2 * Math.PI)
            } else this.target2Vary = null;
            this.moveTimer = 0;
            this._updatePos(true)
        },
        _updatePos: function(a) {
            if (this.moveTimer > this.handle.maxTime) this.moveTimer = this.handle.maxTime;
            var g = this.moveTimer / this.handle.maxTime;
            g > 1 && (g = 1);
            for (var h = 0, i = 1; h < this.flyType.length - 1 && (this.phaseDurations[h] || 0) <= g;) {
                var j = this.phaseDurations[h] || 0,
                    g = g - j,
                    i = i - j;
                h++
            }
            var j = this.flyType[h],
                g = g / (h == this.flyType.length - 1 ? i : this.phaseDurations[h] || 0),
                h = j.dist(g),
                i = j.normal(g),
                k = Vec3.assign(e, this.ownerEffect.coll.pos),
                j =
                this.ownerEffect.getTarget2Pos(d);
            this.target1Vary && Vec2.add(k, this.target1Vary);
            this.target2Vary && Vec2.add(j, this.target2Vary);
            g = this.inverse ? Vec3.lerp(k, j, h, c) : Vec3.lerp(j, k, h, c);
            if (i && this.normalXY) {
                h = Vec2.sub(j, k, b);
                this.normalXY < 0 ? Vec2.rotate90CCW(h) : Vec2.rotate90CW(h);
                Vec2.length(h, Math.abs(this.normalXY) * i);
                Vec2.add(g, h)
            }
            g.z = g.z + this.normalZ * i;
            if (this.rotateMoveDir) {
                a = a || this.rotateMoveDir == sc.HOMING_ROTATE_TYPE.AT_TARGET ? Vec3.sub(j, g, d) : Vec3.sub(g, this.coll.pos, d);
                a.y = a.y - a.z;
                a = Vec2.clockangle(a);
                this.animState.angle = a
            }
            this.setPos(g.x, g.y, g.z)
        },
        update: function() {
            this.parent();
            this.moveTimer = this.moveTimer + ig.system.tick;
            this._updatePos()
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.HomingParticle);
    ig.ENTITY.LaserParticle = ig.Entity.extend({
        handle: null,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.handle = new ig.ParticleHandle(this);
            this._initLaserParticle(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initLaserParticle(d)
        },
        _initLaserParticle: function(a) {
            this.handle.setData(a);
            this.coll.type =
                ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);
            this.coll.alwaysRender = true;
            this.ownerEffect = a.ownerEffect;
            this.patternSheet = a.patternSheet;
            this.animFrames = a.animFrames;
            this.frameTime = a.frameTime || 0.1;
            this.shiftSpeed = a.shiftSpeed || 0;
            this.animTimer = 0;
            this.offset = a.offset || null;
            this.guiSprites = a.guiSprites || false;
            this.renderMode = a.renderMode
        },
        initSprites: function() {
            this.setSpriteCount(1, this.guiSprites);
            this.handle.initSprite(this.sprites[0])
        },
        update: function() {
            this.handle.onUpdate();
            this.animTimer = this.animTimer +
                ig.system.tick;
            this.parent()
        },
        updateSprites: function() {
            var a = this.sprites[0],
                e = Vec3.assign(c, this.ownerEffect.coll.pos),
                h = this.ownerEffect.getTarget2Pos(d);
            this.offset && Vec3.add(e, this.offset);
            h = Vec2.assignC(b, h.x, h.y - h.z);
            Vec2.subC(h, e.x, e.y - e.z);
            var i = this.patternSheet.patternTileWidth,
                j = Vec2.length(h),
                j = Math.round(j);
            a.setSize(i, j, 0, 0);
            a.setPos(e.x - i / 2, e.y - j, e.z);
            a.setPivot(i / 2, j);
            if (this.renderMode) a.renderMode = this.renderMode;
            e = Math.round(-this.shiftSpeed * this.animTimer);
            i = this.patternSheet.getPattern(this.animFrames[Math.floor(this.animTimer /
                this.frameTime) % this.animFrames.length]);
            a.setImageSrc(i, 0, e);
            this.handle.updateSprite(a);
            a.rotate = Vec2.clockangle(h);
            a.alwaysRender = true
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.LaserParticle)
});
ig.baked = !0;
