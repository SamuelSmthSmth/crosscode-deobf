ig.module("impact.feature.effect.fx.fx-homing").requires("impact.feature.effect.effect-sheet", "impact.feature.effect.entities.effect-particle").defines(function() {
    var b = Vec2.create();
    sc.HOMING_ROTATE_TYPE = {
        NONE: 0,
        MOVE_DIR: 1,
        AT_TARGET: 2
    };
    ig.EFFECT_ENTRY.SHOOT_HOMING_PARTICLE = ig.EffectStepBase.extend({
        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                duration: {
                    _type: "Number",
                    _info: "Time over which to spawn particles"
                },
                numParticles: {
                    _type: "Number",
                    _info: "How many homing particles to spawn"
                },
                flyType: {
                    _type: "String",
                    _info: "How particle should fly between targets",
                    _select: ig.FX_HOMING_FLY_TYPE
                },
                inverse: {
                    _type: "Boolean",
                    _info: "If true, fly target1->target2. Otherwise fly ftarget2->target1"
                },
                offsetRadius: {
                    _type: "NumberVary",
                    _info: "How far particle should fly in normal xy direction"
                },
                offRadiusZScale: {
                    _type: "Number",
                    _info: "How to scale radius along Z direction. 1=normal length",
                    _default: 1
                },
                offsetAngle: {
                    _type: "NumberVary",
                    _info: "Angle variance relative to radius pointing upwards. 1= offset radius will be along half circle"
                },
                target1Vary: {
                    _type: "Number",
                    _info: "Random radial offset from target1 pos in x/y coords",
                    _optional: true
                },
                target2Vary: {
                    _type: "Number",
                    _info: "Random radial offset from target1 pos in x/y coords",
                    _optional: true
                },
                phaseDurations: {
                    _type: "NumberArray",
                    _info: "Relative duration for each phase of the fly type. Values must add to 1"
                },
                rotateMoveDir: {
                    _type: "String",
                    _info: "How particles should be rotated",
                    _select: sc.HOMING_ROTATE_TYPE
                }
            }
        }),
        particleData: null,
        init: function(a, b) {
            this.duration = b.duration || 0;
            this.particleData =
                ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            this.numParticles = b.numParticles || 1;
            this.flyType = b.flyType;
            this.inverse = b.inverse || false;
            this.offsetRadius = b.offsetRadius || 0;
            this.offRadiusZScale = b.offRadiusZScale || 0;
            this.offsetAngle = b.offsetAngle || 0;
            this.phaseDurations = b.phaseDurations;
            this.rotateMoveDir = sc.HOMING_ROTATE_TYPE[b.rotateMoveDir] || sc.HOMING_ROTATE_TYPE.NONE;
            this.target1Vary = b.target1Vary;
            this.target2Vary = b.target2Vary
        },
        start: function(a) {
            if (this.duration) return {
                duration: this.duration,
                particles: this.numParticles
            };
            this._spawnParticles(a, 0, this.numParticles)
        },
        _spawnParticles: function(a, d, c) {
            for (var e = {
                    data: this.particleData,
                    ownerEffect: a,
                    normalXY: 0,
                    normalZ: 0,
                    phaseDurations: this.phaseDurations,
                    flyType: this.flyType,
                    inverse: this.inverse,
                    rotateMoveDir: this.rotateMoveDir,
                    target1Vary: this.target1Vary,
                    target2Vary: this.target2Vary
                }; d < c; d++) {
                var f = Vec2.assignC(b, 0, 1);
                Vec2.rotate(f, (Math.random() - 0.5) * Math.PI * this.offsetAngle);
                e.normalXY = ig.Event.getNumberVary(this.offsetRadius) * f.x;
                e.normalZ =
                    ig.Event.getNumberVary(this.offsetRadius) * f.y * this.offRadiusZScale;
                a.spawnParticle(ig.ENTITY.HomingParticle, null, e)
            }
        },
        update: function(a, b, c) {
            this._spawnParticles(a, b, c)
        },
        getDuration: function() {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData)
        }
    })
});
ig.baked = !0;
