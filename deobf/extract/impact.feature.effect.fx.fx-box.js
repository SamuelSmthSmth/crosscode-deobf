ig.module("impact.feature.effect.fx.fx-box").requires("impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create();
    Vec2.create();
    var a = Vec3.create(),
        d = Vec2.create(),
        c = Vec2.create(),
        e = {};
    ig.BOX_PARTICLE_SIDE = {
        ALL: 15,
        NORTH: 1,
        EAST: 2,
        SOUTH: 4,
        WEST: 8,
        NO_NORTH: 14,
        NO_EAST: 13,
        NO_SOUTH: 11,
        NO_WEST: 7
    };
    var f = [{
        x: 0,
        y: 0,
        w: 1,
        h: 0,
        flag: 1
    }, {
        x: 1,
        y: 0,
        w: 0,
        h: 1,
        flag: 2
    }, {
        x: 0,
        y: 1,
        w: 1,
        h: 0,
        flag: 4
    }, {
        x: 0,
        y: 0,
        w: 0,
        h: 1,
        flag: 8
    }];
    ig.EFFECT_ENTRY.PARTICLE_BOX = ig.EffectStepBase.extend({
        particleData: null,
        padding: {
            x: 0,
            y: 0
        },
        boxSide: 0,
        numParticles: 4,
        flipRightParticles: false,
        minSpeed: 50,
        maxSpeed: 100,
        collision: false,
        random: 0,
        moveZ: 0,
        moveZVariance: 0,
        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                boxSide: {
                    _type: "String",
                    _info: "Which side of the box to spawn particles on",
                    _select: ig.BOX_PARTICLE_SIDE
                },
                padding: {
                    _type: "Vec2",
                    _info: "Padding around target bounds. Can also be negative"
                },
                collision: {
                    _type: "Boolean",
                    _info: "Whether particles should collide."
                },
                numParticles: {
                    _type: "Integer",
                    _info: "Amount of particles",
                    _default: 1
                },
                random: {
                    _type: "Number",
                    _info: "Randomness of particle spawning from 0 to 1",
                    _optional: true
                },
                flipRightParticles: {
                    _type: "Boolean",
                    _info: "Flip particles spawned on the right side",
                    _optional: true
                },
                minSpeed: {
                    _type: "Number",
                    _info: "Minimum Speed of particles",
                    _optional: true
                },
                maxSpeed: {
                    _type: "Number",
                    _info: "Maximum Speed of particles",
                    _optional: true
                },
                moveZ: {
                    _type: "Number",
                    _info: "Move particles upwards by given pixels. (won't move away in this case)",
                    _optional: true
                },
                moveZVariance: {
                    _type: "Number",
                    _info: "Z Distance Variance.",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            b.padding && Vec2.assign(this.padding, b.padding);
            this.boxSide = ig.BOX_PARTICLE_SIDE[b.boxSide || "ALL"];
            this.numParticles = b.numParticles;
            this.flipRightParticles = b.flipRightParticles || false;
            this.minSpeed = b.minSpeed || 0;
            this.maxSpeed = b.maxSpeed || 0;
            this.collision = b.collision || false;
            this.random = b.random || 0;
            this.moveZ = b.moveZ || 0;
            this.moveZVariance = b.moveZVariance ||
                0
        },
        getDuration: function() {
            return ig.EffectConfig.getParticleBlockTime(this.particleData)
        },
        start: function(a) {
            if (a.target)
                for (var b = a.target.coll, c = f.length; c--;) this.boxSide & f[c].flag && this.spawnBoxLine(a, b, f[c])
        },
        spawnBoxLine: function(f, h, i) {
            var j = i.x ? h.size.x + this.padding.x : -this.padding.x,
                k = i.y ? h.size.y + this.padding.y : -this.padding.y,
                l = i.w ? h.size.x + this.padding.x * 2 : 0,
                o = i.h ? h.size.y + this.padding.y * 2 : 0,
                i = Vec2.assignC(b, 0, 0);
            Vec2.addC(i, j, k);
            j = Math.max(1, this.numParticles * (l + o) / 32 | 0);
            l = l / j;
            o = o / j;
            e.data =
                this.particleData;
            e.friction = 0.8;
            e.collision = this.collision;
            for (k = 0; k < j; k++) {
                var m = Vec3.assignC(a, i.x, i.y, 0);
                m.x = m.x + (0.5 + k + (Math.random() - 0.5) * this.random) * l;
                m.y = m.y + (0.5 + k + (Math.random() - 0.5) * this.random) * o;
                var n = Vec2.assignC(c, m.x, m.y);
                Vec2.subC(n, h.size.x / 2, h.size.y / 2);
                e.flipX = this.flipRightParticles && n.x < 0;
                if (this.moveZ) {
                    n = this.moveZ + (Math.random() - 0.5) * 2 * this.moveZVariance;
                    e.alongZ = true;
                    e.moveOffset = Vec2.assignC(d, 0, n);
                    e.keySpline = KEY_SPLINES.EASE_OUT;
                    f.spawnParticle(ig.ENTITY.OffsetParticle,
                        m, e, true)
                } else {
                    Vec2.length(n, this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed));
                    e.vel = n;
                    f.spawnParticle(ig.ENTITY.Particle, m, e, true)
                }
            }
        }
    })
});
ig.baked = !0;
