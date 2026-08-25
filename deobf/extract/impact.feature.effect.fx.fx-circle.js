ig.module("impact.feature.effect.fx.fx-circle").requires("impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec3.create(),
        c = {},
        e = ig.EffectStepBase.extend({
            particleData: null,
            offset: {
                x: 0,
                y: 0,
                z: 0
            },
            duration: 0,
            clockwise: false,
            rotOffset: null,
            numParticles: 16,
            centralAngle: 0,
            startAngle: 0,
            random: false,
            uniformRandom: 0,
            startDist: 0,
            particleRotate: false,
            flipRightParticles: false,
            collision: false,
            alongZ: false,
            useTargetAngle: false,
            init: function(a, b) {
                this.particleData = ig.EffectConfig.loadParticleData(a.animSheet,
                    b, a && a.cacheKey);
                if (b.offset) this.offset = b.offset;
                this.rotOffset = b.rotOffset || null;
                this.numParticles = b.numParticles;
                this.random = b.random || false;
                this.uniformRandom = b.uniformRandom || 0;
                this.centralAngle = b.centralAngle * Math.PI * 2 || Math.PI * 2;
                this.startAngle = b.startAngle !== void 0 ? b.startAngle * Math.PI * 2 : -this.centralAngle / 2;
                this.startDist = b.startDist || 0;
                this.particleRotate = b.particleRotate || false;
                this.flipRightParticles = b.flipRightParticles || false;
                this.collision = b.collision || false;
                this.alongZ = b.alongZ || false;
                this.duration = b.duration || 0;
                this.clockwise = b.clockwise || false;
                this.useTargetAngle = b.useTargetAngle || false;
                this.circleSpline = KEY_SPLINES[b.circleSpline] || null
            },
            start: function(a) {
                if (this.duration) return {
                    duration: this.duration,
                    particles: this.numParticles,
                    keySpline: this.circleSpline
                };
                this._spawnParticles(a, 0, this.numParticles)
            },
            _spawnParticles: function(e, g, h) {
                var i = Vec2.assignC(b, 0, -1),
                    j = this.centralAngle == Math.PI * 2 ? this.numParticles : this.numParticles - 1;
                c.data = this.particleData;
                c.friction = 0.8;
                c.collision =
                    this.collision;
                for (c.alongZ = this.alongZ; g < h; g++) {
                    var k = j ? g / j : 0.5;
                    j && this.uniformRandom ? k = k + 1 / j * (Math.random() - 0.5) * this.uniformRandom : this.random && (k = Math.random());
                    k = this.startAngle + k * this.centralAngle;
                    this.clockwise || (k = -k);
                    e.flipX && (k = -k);
                    k = k + e.angle;
                    this.useTargetAngle && (k = k + e.target.animState.angle);
                    var l = Vec3.assignC(d, 0, 0, 0);
                    if (this.rotOffset) {
                        Vec3.add(l, this.rotOffset);
                        Vec2.rotate(l, -e.angle)
                    }
                    this.offset && Vec3.add(l, this.offset);
                    var o = Vec2.rotate(i, -k, a),
                        m = this.flipRightParticles && o.x < 0;
                    e.flipX &&
                        (m = !m);
                    c.angle = this.particleRotate ? k : 0;
                    c.flipX = m;
                    if (this.alongZ) o.y = o.y * -1;
                    this.spawn(e, l, c, o)
                }
            },
            update: function(a, b, c) {
                this._spawnParticles(a, b, c)
            },
            getDuration: function() {
                return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData)
            },
            spawn: function() {}
        });
    ig.EFFECT_ENTRY.OFFSET_PARTICLE_CIRCLE = e.extend({
        moveDist: 0,
        moveVariance: 0,
        keySpline: null,
        moveRotate: 0,
        rotateWithTime: false,
        inverse: false,
        normalMoveDist: 0,
        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                numParticles: {
                    _type: "Integer",
                    _info: "Number of particles to be spawned"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of particle spawning"
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "true if particles are to move clockwise",
                    _optional: true
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Circle range to spawn. 1=full circle",
                    _default: 1
                },
                startAngle: {
                    _type: "Number",
                    _info: "Turn angle from which to start relative to view direciton. 0.25=quarter turn",
                    _optional: true
                },
                startDist: {
                    _type: "Number",
                    _info: "Start distance away from center"
                },
                random: {
                    _type: "Boolean",
                    _info: "If true, spawn particles randomly along circle",
                    _optional: true
                },
                uniformRandom: {
                    _type: "Number",
                    _info: "Only vary slightly along circle. Set intensity between 0-1",
                    _optional: true
                },
                particleRotate: {
                    _type: "Boolean",
                    _info: "If true, rotate particle with movement orientation",
                    _optional: true
                },
                flipRightParticles: {
                    _type: "Boolean",
                    _info: "If true, flip particles on the right side",
                    _optional: true
                },
                alongZ: {
                    _type: "Boolean",
                    _info: "If true, move particales along z instead of y",
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                },
                rotOffset: {
                    _type: "Offset",
                    _info: "Offset rotated with effect direction",
                    _optional: true
                },
                useTargetAngle: {
                    _type: "Boolean",
                    _info: "Align spawning with rotation of target",
                    _optional: true
                },
                circleSpline: {
                    _type: "String",
                    _info: "Keyspline used for circle spawning speed",
                    _select: KEY_SPLINES,
                    _optional: true
                },
                moveDist: {
                    _type: "Number",
                    _info: "Fixed move distance in pixels away from circle (or towards circle if inverse=true)"
                },
                moveVariance: {
                    _type: "Number",
                    _info: "Move distance variation in pixels",
                    _optional: true
                },
                moveDuration: {
                    _type: "Number",
                    _info: "Duration of particle motion. If not defined, will use particleDuration",
                    _optional: true
                },
                keySpline: {
                    _type: "String",
                    _info: "Keyspline of particle movement",
                    _select: KEY_SPLINES
                },
                moveRotate: {
                    _type: "Number",
                    _info: "Particles should rotate while moving away/torwards circle. 1=full circle rotation",
                    _optional: true
                },
                rotateWithTime: {
                    _type: "Boolean",
                    _info: "Set to true if particles should rotate with time rather than move distance",
                    _optional: true
                },
                inverse: {
                    _type: "Boolean",
                    _info: "Set to true if particles should move towards center instead of away.",
                    _optional: true
                },
                normalMoveDist: {
                    _type: "Number",
                    _info: "Distance to be moved in orthogonal direction of circle",
                    _optional: true
                },
                collision: {
                    _type: "Boolean",
                    _info: "Set to true if particles should collide with environment"
                }
            }
        }),
        init: function(a, b) {
            this.parent(a, b);
            this.moveDist = b.moveDist || 0;
            this.moveVariance = b.moveVariance || 0;
            this.moveDuration = b.moveDuration || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || null;
            this.moveRotate = b.moveRotate ||
                0;
            this.rotateWithTime = b.rotateWithTime || false;
            this.inverse = b.inverse || false;
            this.normalMoveDist = b.normalMoveDist || 0
        },
        spawn: function(a, b, c, d) {
            var e = this.startDist + this.moveDist + (2 * Math.random() - 1) * this.moveVariance;
            Vec2.length(d, e);
            c.startFactor = this.startDist / e;
            c.moveOffset = d;
            c.moveDuration = this.moveDuration;
            c.keySpline = this.keySpline;
            c.moveRotate = a.flipX ? -this.moveRotate : this.moveRotate;
            c.rotateWithTime = this.rotateWithTime;
            c.rotateGfx = this.particleRotate;
            c.inverse = this.inverse;
            c.normalMoveDist = this.normalMoveDist;
            a.spawnParticle(ig.ENTITY.OffsetParticle, b, c);
            delete c.normalMoveDist;
            delete c.moveOffset;
            delete c.moveDuration;
            delete c.keySpline;
            delete c.moveRotate;
            delete c.rotateWithTime;
            delete c.inverse
        }
    });
    e = e.extend({
        spawn: function(a, b, c, d) {
            b.x = b.x + d.x * this.startDist;
            this.alongZ ? b.z = b.z + d.z * this.startDist : b.y = b.y + d.y * this.startDist;
            c.vel = Vec2.length(d, this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed));
            this.spawnVel(a, b, c);
            delete c.vel
        },
        spawnVel: function() {}
    });
    ig.EFFECT_ENTRY.PARTICLE_CIRCLE = e.extend({
        minSpeed: 50,
        maxSpeed: 100,
        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                numParticles: {
                    _type: "Integer",
                    _info: "Number of particles to be spawned"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of particle spawning"
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "true if particles are to move clockwise",
                    _optional: true
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Circle range to spawn. 1=full circle",
                    _default: 1
                },
                startAngle: {
                    _type: "Number",
                    _info: "Turn angle from which to start relative to view direciton. 0.25=quarter turn",
                    _optional: true
                },
                startDist: {
                    _type: "Number",
                    _info: "Start distance away from center"
                },
                random: {
                    _type: "Boolean",
                    _info: "If true, spawn particles randomly along circle",
                    _optional: true
                },
                uniformRandom: {
                    _type: "Number",
                    _info: "Only vary slightly along circle. Set intensity between 0-1",
                    _optional: true
                },
                particleRotate: {
                    _type: "Boolean",
                    _info: "If true, rotate particle with movement orientation",
                    _optional: true
                },
                flipRightParticles: {
                    _type: "Boolean",
                    _info: "If true, flip particles on the right side",
                    _optional: true
                },
                alongZ: {
                    _type: "Boolean",
                    _info: "If true, move particles along z instead of y",
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                },
                rotOffset: {
                    _type: "Offset",
                    _info: "Offset rotated with effect direction",
                    _optional: true
                },
                useTargetAngle: {
                    _type: "Boolean",
                    _info: "Align spawning with rotation of target",
                    _optional: true
                },
                minSpeed: {
                    _type: "Number",
                    _info: "Minimum amount of speed",
                    _optional: true
                },
                maxSpeed: {
                    _type: "Number",
                    _info: "Maximum amount of speed",
                    _optional: true
                },
                collision: {
                    _type: "Boolean",
                    _info: "Set to true if particles should not collide with environment",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.parent(a, b);
            this.minSpeed = b.minSpeed || 0;
            this.maxSpeed = b.maxSpeed || 0
        },
        spawnVel: function(a, b, c) {
            a.spawnParticle(ig.ENTITY.Particle, b, c)
        }
    });
    ig.EFFECT_ENTRY.DEBRIS_CIRCLE = e.extend({
        minSpeed: 50,
        maxSpeed: 100,
        minZSpeed: 50,
        maxZSpeed: 100,
        zGravityFactor: 0,
        zBounciness: void 0,
        _wm: new ig.EffectConfig({
            particleType: "DeprisParticle",
            attributes: {
                numParticles: {
                    _type: "Integer",
                    _info: "Number of particles to be spawned"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of particle spawning"
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "true if particles are to move clockwise",
                    _optional: true
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Circle range to spawn. 1=full circle",
                    _default: 1
                },
                startAngle: {
                    _type: "Number",
                    _info: "Turn angle from which to start relative to view direciton. 0.25=quarter turn",
                    _optional: true
                },
                startDist: {
                    _type: "Number",
                    _info: "Start distance away from center"
                },
                random: {
                    _type: "Boolean",
                    _info: "If true, spawn particles randomly along circle",
                    _optional: true
                },
                uniformRandom: {
                    _type: "Number",
                    _info: "Only vary slightly along circle. Set intensity between 0-1",
                    _optional: true
                },
                particleRotate: {
                    _type: "Boolean",
                    _info: "If true, rotate particle with movement orientation",
                    _optional: true
                },
                flipRightParticles: {
                    _type: "Boolean",
                    _info: "If true, flip particles on the right side",
                    _optional: true
                },
                alongZ: {
                    _type: "Boolean",
                    _info: "If true, move particales along z instead of y",
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                },
                rotOffset: {
                    _type: "Offset",
                    _info: "Offset rotated with effect direction",
                    _optional: true
                },
                useTargetAngle: {
                    _type: "Boolean",
                    _info: "Align spawning with rotation of target",
                    _optional: true
                },
                shadowSize: {
                    _type: "Number",
                    _info: "Size of Shadow",
                    _optional: true
                },
                minSpeed: {
                    _type: "Number",
                    _info: "Minimum amount of speed",
                    _optional: true
                },
                maxSpeed: {
                    _type: "Number",
                    _info: "Maximum amount of speed",
                    _optional: true
                },
                minZSpeed: {
                    _type: "Number",
                    _info: "Minimum amount of z speed",
                    _optional: true
                },
                maxZSpeed: {
                    _type: "Number",
                    _info: "Maximum amount of z speed",
                    _optional: true
                },
                zGravityFactor: {
                    _type: "Number",
                    _info: "Gravity factor of debris",
                    _optional: true
                },
                zBounciness: {
                    _type: "Number",
                    _info: "Z bounciness of debris",
                    _optional: true
                },
                minZVel: {
                    _type: "Number",
                    _info: "mininum zVel when bouncing on Ground",
                    _optional: true
                },
                collision: {
                    _type: "Boolean",
                    _info: "Set to true if particles should not collide with environment"
                }
            }
        }),
        init: function(a, b) {
            this.parent(a, b);
            this.minSpeed = b.minSpeed || 0;
            this.maxSpeed = b.maxSpeed || 0;
            this.minZSpeed = b.minZSpeed || 0;
            this.maxZSpeed = b.maxZSpeed || 0;
            this.zGravityFactor = b.zGravityFactor || null;
            if (b.zBounciness != void 0) this.zBounciness = b.zBounciness;
            this.shadowSize = b.shadowSize === void 0 ? 4 : b.shadowSize
        },
        spawnVel: function(a, b, c) {
            var d = Math.random();
            c.zVel = this.minZSpeed * d + this.maxZSpeed * (1 - d);
            c.zGravityFactor = this.zGravityFactor;
            c.zBounciness = this.zBounciness;
            c.shadowSize = this.shadowSize;
            a.spawnParticle(ig.ENTITY.DebrisParticle, b, c);
            delete c.zVel;
            delete c.zGravityFactor
        }
    })
});
ig.baked = !0;
