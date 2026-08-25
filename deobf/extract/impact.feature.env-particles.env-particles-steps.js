ig.module("impact.feature.env-particles.env-particles-steps").requires("impact.feature.env-particles.env-particles", "impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.SET_ENV_PARTICLES = ig.EventStepBase.extend({
        spawner: 0,
        quantity: 0,
        _wm: new ig.Config({
            attributes: {
                particleType: {
                    _type: "String",
                    _info: "Type of Env Particles",
                    _select: ig.ENV_PARTICLES
                },
                quantity: {
                    _type: "NumberExpression",
                    _info: "Quantity of particles (average number of visible particles)",
                    _default: 10
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true: make change immediate",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.spawner = new ig.EnvParticleSpawner(b.particleType);
            this.quantity = b.quantity;
            this.immediately = b.immediately || false
        },
        clearCached: function() {
            this.spawner.decreaseRef()
        },
        start: function() {
            var b = ig.Event.getExpressionValue(this.quantity) || 0;
            ig.envParticles.addSpawner(this.spawner, b, this.immediately)
        }
    });
    ig.EVENT_STEP.CLEAR_ENV_PARTICLES = ig.EventStepBase.extend({
        spawner: 0,
        _wm: new ig.Config({
            attributes: {
                particleType: {
                    _type: "String",
                    _info: "Type of Env Particles",
                    _select: ig.ENV_PARTICLES
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true: make change immediate",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.spawner = new ig.EnvParticleSpawner(b.particleType);
            this.immediately = b.immediately || false
        },
        clearCached: function() {
            this.spawner.decreaseRef()
        },
        start: function() {
            ig.envParticles.addSpawner(this.spawner, 0, this.immediately)
        }
    });
    ig.ACTION_STEP.SET_ENV_PARTICLES = ig.ActionStepBase.extend({
        spawner: 0,
        quantity: 0,
        _wm: new ig.Config({
            attributes: {
                particleType: {
                    _type: "String",
                    _info: "Type of Env Particles",
                    _select: ig.ENV_PARTICLES
                },
                quantity: {
                    _type: "NumberExpression",
                    _info: "Quantity of particles (average number of visible particles)",
                    _default: 10
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true: make change immediate",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.spawner = new ig.EnvParticleSpawner(b.particleType);
            this.quantity = b.quantity;
            this.immediately = b.immediately || false
        },
        clearCached: function() {
            this.spawner.decreaseRef()
        },
        start: function() {
            var b = ig.Event.getExpressionValue(this.quantity) ||
                0;
            ig.envParticles.addSpawner(this.spawner, b, this.immediately)
        }
    });
    ig.ACTION_STEP.CLEAR_ENV_PARTICLES = ig.ActionStepBase.extend({
        spawner: 0,
        _wm: new ig.Config({
            attributes: {
                particleType: {
                    _type: "String",
                    _info: "Type of Env Particles",
                    _select: ig.ENV_PARTICLES
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true: make change immediate",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.spawner = new ig.EnvParticleSpawner(b.particleType);
            this.immediately = b.immediately || false
        },
        clearCached: function() {
            this.spawner.decreaseRef()
        },
        start: function() {
            ig.envParticles.addSpawner(this.spawner, 0, this.immediately)
        }
    })
});
ig.baked = !0;
