ig.module("impact.feature.effect.fx.fx-basic").requires("impact.feature.effect.effect-sheet").defines(function() {
    ig.EFFECT_ENTRY.WAIT = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time to wait"
                }
            }
        })
    });
    ig.EFFECT_ENTRY.LOOP_START = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        })
    });
    ig.EFFECT_ENTRY.LOOP_END = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        })
    });
    var b = Vec3.create();
    ig.EFFECT_ENTRY.PLAY_ANIM = ig.EffectStepBase.extend({
        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                useTargetAngle: {
                    _type: "Boolean",
                    _info: "Align animation with effect rotation"
                },
                keepAngleSync: {
                    _type: "Boolean",
                    _info: "If true: Keep target angle synchronized while particle is visible"
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
                }
            }
        }),
        particleData: null,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        rotOffset: null,
        useTargetAngle: false,
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet,
                b, a && a.cacheKey);
            if (b.offset) this.offset = b.offset;
            this.rotOffset = b.rotOffset || null;
            this.useTargetAngle = b.useTargetAngle || false;
            this.keepAngleSync = b.keepAngleSync || false
        },
        start: function(a) {
            var c = a.angle,
                d = null;
            this.useTargetAngle && (a.target && a.target.animState) && (c = c + a.target.animState.angle);
            this.keepAngleSync && (d = a);
            var e = Vec3.assignC(b, 0, 0, 0);
            if (this.rotOffset) {
                Vec3.add(e, this.rotOffset);
                Vec2.rotate(e, -a.angle)
            }
            Vec3.add(e, this.offset);
            a.spawnParticle(ig.ENTITY.Particle, e, {
                data: this.particleData,
                angle: c,
                flipX: a.flipX,
                angleSync: d
            })
        },
        getDuration: function() {
            return ig.EffectConfig.getParticleBlockTime(this.particleData)
        }
    });
    ig.EFFECT_ENTRY.PLAY_FACE_ANIM = ig.EffectStepBase.extend({
        particleData: null,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        _wm: new ig.EffectConfig({
            particleType: "FaceParticle",
            attributes: {
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.faceAnimSheet, b, a && a.cacheKey);
            if (b.offset) this.offset = b.offset
        },
        start: function(a) {
            var c =
                Vec3.assign(b, this.offset);
            if (a.target) {
                c.x = c.x - a.target.coll.size.x / 2;
                c.y = c.y - a.target.coll.size.y / 2
            }
            a.spawnParticle(ig.ENTITY.FaceParticle, c, {
                data: this.particleData,
                size: a.target && a.target.coll.size
            })
        },
        getDuration: function() {
            return ig.EffectConfig.getParticleBlockTime(this.particleData)
        }
    });
    var a = Vec2.create();
    ig.EFFECT_ENTRY.PLAY_ANIM_RANGE = ig.EffectStepBase.extend({
        particleData: null,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        radius: 0,
        duration: 0,
        numParticles: 2,
        useTargetAngle: false,
        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                radius: {
                    _type: "Number",
                    _info: "Radius in which animation is played"
                },
                useTargetAngle: {
                    _type: "Boolean",
                    _info: "Align animation with effect rotation"
                },
                numParticles: {
                    _type: "Number",
                    _info: "Amount of particles",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Duration in which to spawn particles"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                },
                alongY: {
                    _type: "Boolean",
                    _info: "If true: distribute animation along Y coordinate instead of Z"
                },
                moveZDist: {
                    _type: "Number",
                    _info: "Distance that entities should move upward (or downward if negative",
                    _optional: true
                },
                keySpline: {
                    _type: "String",
                    _info: "Keyspline of particle z movement",
                    _select: KEY_SPLINES,
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            if (b.offset) this.offset = b.offset;
            this.radius = b.radius || 0;
            this.duration = b.duration || 0;
            this.numParticles = b.numParticles || 1;
            this.useTargetAngle = b.useTargetAngle || false;
            this.alongY = b.alongY || false;
            this.moveZDist = b.moveZDist || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || null
        },
        getDuration: function() {
            return this.duration
        },
        start: function() {
            return {
                duration: this.duration,
                particles: this.numParticles
            }
        },
        update: function(b, c, d) {
            var e = b.angle;
            this.useTargetAngle && (b.target && b.target.animState) && (e = e + b.target.animState.angle);
            e = {
                data: this.particleData,
                angle: e
            };
            if (this.moveZDist) {
                e.moveOffset = Vec2.createC(0, this.moveZDist);
                e.alongZ = true;
                e.keySpline = this.keySpline
            }
            for (; c < d; ++c) {
                var f = ig.copy(this.offset),
                    g = this.radius * Math.sqrt(Math.random()),
                    h = Vec2.assignC(a, Math.random() - 0.5, Math.random() - 0.5);
                Vec2.length(h, g);
                f.x = (f.x || 0) +
                    h.x;
                this.alongY ? f.y = (f.y || 0) + h.y : f.z = (f.z || 0) + h.y;
                b.spawnParticle(ig.ENTITY[this.moveZDist ? "OffsetParticle" : "Particle"], f, e)
            }
        }
    });
    var d = {},
        c = {},
        e = Vec3.create();
    ig.EFFECT_ENTRY.PLAY_ANIMS_OVER_ENTITY = ig.EffectStepBase.extend({
        particleData: null,
        duration: 0,
        xScale: 1,
        yScale: 1,
        circular: false,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        numParticles: 0,
        keySpline: 0,
        moveZDist: 0,
        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                numParticles: {
                    _type: "Integer",
                    _info: "Amount of particles to spawn",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Duration in which to spawn particles"
                },
                circular: {
                    _type: "Boolean",
                    _info: "True if particles should be spawned circular (instead of rectangular)."
                },
                xScale: {
                    _type: "Number",
                    _info: "How much of the x dimension should be covered. 1=full",
                    _optional: true
                },
                yScale: {
                    _type: "Number",
                    _info: "How much of the y dimension should be covered. 1=full",
                    _optional: true
                },
                moveZDist: {
                    _type: "Number",
                    _info: "Distance that entities should move upward (or downward if negative",
                    _optional: true
                },
                keySpline: {
                    _type: "String",
                    _info: "Keyspline of particle z movement",
                    _select: KEY_SPLINES,
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            this.duration = b.duration || 0;
            this.xScale = b.xScale || 1;
            this.yScale = b.yScale || 1;
            this.circular = b.circular || false;
            this.moveZDist = b.moveZDist || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || null;
            b.offset && Vec3.assign(this.offset, b.offset);
            this.numParticles = b.numParticles || 2
        },
        start: function(a) {
            if (a.target) {
                ig.EntityTools.getSpriteBounds(d,
                    a.target);
                var a = d.left + d.right,
                    b = d.top + d.bottom;
                if (!(a < 0 || b < 0)) return {
                    duration: this.duration,
                    particles: this.numParticles * a / 32 * b / 32 * this.xScale * this.yScale * this.duration,
                    offX: (-d.left + d.right) / 2,
                    offY: d.bottom,
                    offZ: b / 2,
                    radius: a / 2,
                    aspectRatio: b / a
                }
            }
        },
        getDuration: function() {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData)
        },
        update: function(b, d, f, g) {
            c.data = this.particleData;
            if (this.moveZDist) {
                c.moveOffset = Vec2.createC(0, this.moveZDist);
                c.alongZ = true;
                c.keySpline = this.keySpline
            }
            for (; d <
                f; ++d) {
                var h = Vec3.assignC(e, 0, 0, 0),
                    i = Vec2.assignC(a, Math.random() - 0.5, Math.random() - 0.5);
                if (this.circular) {
                    var p = g.radius * Math.sqrt(Math.random());
                    Vec2.length(i, p)
                } else {
                    i.x = i.x * g.radius * 2;
                    i.y = i.y * g.radius * 2
                }
                h.x = g.offX + i.x * this.xScale + this.offset.x;
                h.y = g.offY + this.offset.y;
                h.z = g.offZ + i.y * this.yScale * g.aspectRatio + this.offset.z;
                b.spawnParticle(ig.ENTITY[this.moveZDist ? "OffsetParticle" : "Particle"], h, c, true)
            }
        }
    });
    var f = Vec2.create(),
        g = Vec2.create(),
        h = {};
    ig.EFFECT_ENTRY.DEBRIS_OVER_ENTITY = ig.EffectStepBase.extend({
        particleData: null,
        xScale: 1,
        yScale: 1,
        circular: false,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        numParticles: 0,
        debrisSize: 0,
        _wm: new ig.EffectConfig({
            particleType: "DeprisParticle",
            attributes: {
                numParticles: {
                    _type: "Integer",
                    _info: "Amount of particles per tile",
                    _default: 1
                },
                circular: {
                    _type: "Boolean",
                    _info: "True if particles should be spawned circular (instead of rectangular)."
                },
                xScale: {
                    _type: "Number",
                    _info: "How much of the x dimension should be covered. 1=full",
                    _optional: true
                },
                yScale: {
                    _type: "Number",
                    _info: "How much of the y dimension should be covered. 1=full",
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
                    _info: "Minimum amount of z speed"
                },
                maxZSpeed: {
                    _type: "Number",
                    _info: "Maximum amount of z speed"
                },
                debrisSize: {
                    _type: "Offset",
                    _info: "Collision size of debris",
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
                offset: {
                    _type: "Offset",
                    _info: "Offset to effect center",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            this.xScale = b.xScale || 1;
            this.yScale = b.yScale || 1;
            this.circular = b.circular || false;
            b.offset && Vec3.assign(this.offset, b.offset);
            this.minSpeed = b.minSpeed || 0;
            this.maxSpeed = b.maxSpeed || 0;
            this.minZSpeed = b.minZSpeed || 0;
            this.maxZSpeed = b.maxZSpeed || 0;
            this.zGravityFactor =
                b.zGravityFactor || null;
            if (b.zBounciness != void 0) this.zBounciness = b.zBounciness;
            this.debrisSize = b.debrisSize || void 0;
            this.numParticles = b.numParticles || 2
        },
        start: function(a) {
            if (a.target) {
                ig.EntityTools.getSpriteBounds(d, a.target);
                var b = d.left + d.right,
                    c = d.top + d.bottom,
                    i = Math.round(b * this.xScale),
                    m = Math.round(c * this.yScale),
                    b = -d.left + (b - i) / 2,
                    c = -d.top + (c - m) / 2,
                    n = Math.round(this.numParticles * i / 16),
                    p = Math.round(this.numParticles * m / 16);
                h.data = this.particleData;
                h.zGravityFactor = this.zGravityFactor;
                h.zBounciness =
                    this.zBounciness;
                h.debrisSize = this.debrisSize;
                for (var r = 0; r < n; ++r)
                    for (var t = 0; t < p; ++t) {
                        var q = i * r / (n - 1),
                            s = m * t / (p - 1),
                            v = Vec2.assignC(f, q - i / 2, s - m / 2),
                            s = Vec2.assignC(g, b + q, c + s);
                        if (this.circular) {
                            v.x = v.x * (m / i);
                            if (Vec2.length(v) > m / 2) continue;
                            v.x = v.x * (i / m)
                        }
                        q = Vec3.assignC(e, 0, 0, 0);
                        q.x = this.offset.x + s.x;
                        q.y = this.offset.y + s.y;
                        q.z = this.offset.z + s.z;
                        s = Math.random();
                        h.zVel = this.minZSpeed * s + this.maxZSpeed * (1 - s);
                        h.vel = Vec2.length(v, this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed));
                        a.spawnParticle(ig.ENTITY.DebrisParticle,
                            q, h, true)
                    }
            }
        },
        getDuration: function() {
            return ig.EffectConfig.getParticleBlockTime(this.particleData)
        }
    });
    ig.EFFECT_ENTRY.PLAY_SOUND = ig.EffectStepBase.extend({
        sound: null,
        global: false,
        loop: false,
        attachHandle: false,
        settings: null,
        _wm: new ig.Config({
            attributes: {
                sound: {
                    _type: "SoundT",
                    _info: "URL of sound."
                },
                group: {
                    _type: "String",
                    _info: "Group of sounds. Sounds of same group will interrupt each other",
                    _optional: true
                },
                volume: {
                    _type: "Number",
                    _info: "Volume of sound",
                    _default: 1
                },
                global: {
                    _type: "Boolean",
                    _info: "Play sound globally if true"
                },
                loop: {
                    _type: "Boolean",
                    _info: "Loop sound if true"
                },
                variance: {
                    _type: "Number",
                    _info: "Speed playback variance.",
                    _optional: true
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                },
                fadeDuration: {
                    _type: "Number",
                    _info: "Fade duration of sound when canceled. Increase in case of sound artifacts",
                    _optional: true
                },
                radius: {
                    _type: "Number",
                    _info: "Radius up to which you can hear the sound",
                    _optional: true
                },
                attachHandle: {
                    _type: "Boolean",
                    _info: "Attach the sound handle so even non-looped sounds can be stopped.",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            if (b.sound) this.sound = new ig.Sound(b.sound, b.volume || 1, b.variance || 0, b.group);
            this.global = b.global || false;
            this.loop = b.loop || false;
            this.radius = b.radius || 0;
            this.attachHandle = b.attachHandle || false;
            this.settings = {
                speed: b.speed || 1,
                fadeDuration: b.fadeDuration || 0
            }
        },
        clearCached: function() {
            this.sound && this.sound.clearCached()
        },
        start: function(a) {
            if (this.sound) {
                var b;
                b = this.global ? this.sound.play(this.loop, this.settings) : ig.SoundHelper.playAtEntity(this.sound, a, this.loop,
                    this.settings, this.radius);
                this.loop ? a.addEntityAttached(b) : this.attachHandle && a.addEntityAttached(b)
            }
        }
    });
    ig.EFFECT_ENTRY.PLAY_RANDOM_SOUND = ig.EffectStepBase.extend({
        sounds: [],
        global: false,
        loop: false,
        settings: null,
        _wm: new ig.Config({
            attributes: {
                sounds: {
                    _type: "Array",
                    _info: "Sound to be played random",
                    _sub: {
                        _type: "SoundConfig"
                    }
                },
                global: {
                    _type: "Boolean",
                    _info: "Play sound globally if true"
                },
                loop: {
                    _type: "Boolean",
                    _info: "Loop sound if true"
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                },
                fadeDuration: {
                    _type: "Number",
                    _info: "Fade duration of sound when canceled. Increase in case of sound artifacts",
                    _optional: true
                },
                radius: {
                    _type: "Number",
                    _info: "Radius up to which you can hear the sound",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            for (var c = 0; c < b.sounds.length; ++c) {
                var d = b.sounds[c];
                this.sounds.push(new ig.Sound(d.sound, d.volume || 1, d.variance || 0))
            }
            this.global = b.global || false;
            this.loop = b.loop || false;
            this.radius = b.radius || 0;
            this.settings = {
                speed: b.speed || 1,
                fadeDuration: b.fadeDuration ||
                    0
            }
        },
        clearCached: function() {
            for (var a = this.sounds.length; a--;) this.sounds[a].clearCached()
        },
        start: function(a) {
            var b;
            b = this.sounds.random();
            b = this.global ? b.play(this.loop, this.settings) : ig.SoundHelper.playAtEntity(b, a, this.loop, this.settings, this.radius);
            this.loop && a.addEntityAttached(b)
        }
    });
    var i = function(a) {
        return a instanceof ig.SoundHandle
    };
    ig.EFFECT_ENTRY.STOP_SOUNDS = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.clearEntityAttached(i)
        }
    })
});
ig.baked = !0;
