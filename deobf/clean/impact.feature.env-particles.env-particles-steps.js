/**
 * impact.feature.env-particles.env-particles-steps
 * ================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.env-particles.env-particles-steps")`.
 *
 * Registers the four environment-particle steps:
 *   - `ig.EVENT_STEP.SET_ENV_PARTICLES`   — start/change a particle system
 *   - `ig.EVENT_STEP.CLEAR_ENV_PARTICLES` — stop one
 *   - `ig.ACTION_STEP.SET_ENV_PARTICLES`  — same, as an action step
 *   - `ig.ACTION_STEP.CLEAR_ENV_PARTICLES`— same, as an action step
 * Each holds an `ig.EnvParticleSpawner` for the configured particle type.
 */
ig.module("impact.feature.env-particles.env-particles-steps")
    .requires("impact.feature.env-particles.env-particles", "impact.base.action", "impact.base.event")
    .defines(function () {

    /** Event step: set the particle quantity of a particle type. */
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

        init: function (params) {
            this.spawner = new ig.EnvParticleSpawner(params.particleType);
            this.quantity = params.quantity;
            this.immediately = params.immediately || false;
        },

        clearCached: function () {
            this.spawner.decreaseRef();
        },

        start: function () {
            var quantity = ig.Event.getExpressionValue(this.quantity) || 0;
            ig.envParticles.addSpawner(this.spawner, quantity, this.immediately);
        }
    });

    /** Event step: clear (stop) a particle type. */
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

        init: function (params) {
            this.spawner = new ig.EnvParticleSpawner(params.particleType);
            this.immediately = params.immediately || false;
        },

        clearCached: function () {
            this.spawner.decreaseRef();
        },

        start: function () {
            ig.envParticles.addSpawner(this.spawner, 0, this.immediately);
        }
    });

    /** Action step: set the particle quantity of a particle type. */
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

        init: function (params) {
            this.spawner = new ig.EnvParticleSpawner(params.particleType);
            this.quantity = params.quantity;
            this.immediately = params.immediately || false;
        },

        clearCached: function () {
            this.spawner.decreaseRef();
        },

        start: function () {
            var quantity = ig.Event.getExpressionValue(this.quantity) || 0;
            ig.envParticles.addSpawner(this.spawner, quantity, this.immediately);
        }
    });

    /** Action step: clear (stop) a particle type. */
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

        init: function (params) {
            this.spawner = new ig.EnvParticleSpawner(params.particleType);
            this.immediately = params.immediately || false;
        },

        clearCached: function () {
            this.spawner.decreaseRef();
        },

        start: function () {
            ig.envParticles.addSpawner(this.spawner, 0, this.immediately);
        }
    });
});
ig.baked = !0;
