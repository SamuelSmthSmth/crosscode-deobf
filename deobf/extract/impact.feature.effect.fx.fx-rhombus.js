ig.module("impact.feature.effect.fx.fx-rhombus").requires("impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec3.create(),
        a = {};
    ig.EFFECT_ENTRY.PARTICLE_RHOMBUS = ig.EffectStepBase.extend({
        particleData: null,
        duration: 0,
        numParticles: 0,
        scale: 0,
        radiusSub: 0,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        moveDistance: 0,
        moveVariance: 0,
        randomDirFlip: false,
        keySpline: null,
        alongZ: null,
        zRange: 0,
        _wm: new ig.EffectConfig({
            particleType: "RhombusParticle",
            attributes: {
                numParticles: {
                    _type: "Number",
                    _info: "Amount of particles to spawn per 32 pixel line length and second",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Duration in which to spawn particles"
                },
                scale: {
                    _type: "Number",
                    _info: "How much of the entity bounds should be covered. 0.5= half of the bounds are covered. 1.0=all the bounds",
                    _optional: true
                },
                radiusSub: {
                    _type: "Number",
                    _info: "Number of pixel substracted from radius",
                    _optional: true
                },
                moveDistance: {
                    _type: "Number",
                    _info: "Move distance of particles in pixels"
                },
                moveVariance: {
                    _type: "Number",
                    _info: "Move variance in pixels. Added +- to distance",
                    _optional: true
                },
                randomDirFlip: {
                    _type: "Boolean",
                    _info: "If true, randomly flip direction of particle",
                    _optional: true
                },
                zRange: {
                    _type: "Number",
                    _info: "zRange randomly added to zPos when spawing",
                    _optional: true
                },
                keySpline: {
                    _type: "String",
                    _info: "Keyspline of particle movement",
                    _select: KEY_SPLINES
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
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            this.duration = b.duration || 0;
            this.scale = b.scale || 0;
            this.radiusSub = b.radiusSub || 0;
            b.offset && Vec3.assign(this.offset, b.offset);
            this.numParticles = b.numParticles || 2;
            this.moveDistance = b.moveDistance || 1;
            this.moveVariance = b.moveVariance || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || null;
            this.alongZ = b.Boolean || false;
            this.randomDirFlip = b.randomDirFlip || false;
            this.zRange = b.zRange || 0
        },
        start: function(a) {
            if (a.target) {
                a = a.target.coll.size.x;
                if (!(a < 0)) {
                    var a = a / 2 * this.scale - this.radiusSub,
                        b = 4 * Math.sqrt(a * a + a * a);
                    return {
                        duration: this.duration,
                        particles: Math.round(this.numParticles * b / 32 * this.duration),
                        radius: a,
                        rhombusLength: b
                    }
                }
            }
        },
        getDuration: function() {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData)
        },
        update: function(d, c, e, f) {
            a.data = this.particleData;
            a.radius = f.radius;
            a.alongZ = this.alongZ;
            for (a.keySpline = this.keySpline; c < e; ++c) {
                var g = Vec3.assign(b, this.offset);
                g.z = g.z + Math.floor(this.zRange * Math.random());
                a.startFactor = Math.random();
                a.moveFactor = (this.moveDistance + (2 * Math.random() - 1) * this.moveVariance) / f.rhombusLength;
                this.randomDirFlip && Math.random() >= 0.5 && (a.moveFactor = -a.moveFactor);
                d.spawnParticle(ig.ENTITY.RhombusParticle, g, a)
            }
        }
    })
});
ig.baked = !0;
