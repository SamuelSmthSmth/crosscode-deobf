/**
 * game.feature.player.crosshair-steps
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.crosshair-steps")`.
 *
 * Event steps that drive the aim crosshair during throw cutscenes:
 * spawn/destroy it, set its target position, speed and precision, and read
 * out its current throw direction.
 */
ig.module("game.feature.player.crosshair-steps")
    .requires("impact.base.animation", "impact.base.action", "impact.base.entity")
    .defines(function () {

    var activeCrosshair = null;

    ig.EVENT_STEP.ACTIVATE_CROSSHAIR = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to focus camera on"
                }
            }
        }),
        init: function (settings) {
            this.entity = settings.entity
        },
        start: function (entity, settings) {
            var thrower = ig.Event.getEntity(this.entity, settings);
            if (thrower) {
                activeCrosshair = ig.game.spawnEntity(ig.ENTITY.Crosshair, 0, 0, 0, {
                    thrower: thrower,
                    controller: new sc.EventCrossHairController
                });
                activeCrosshair.chargeActive = true
            }
        }
    });

    ig.EVENT_STEP.DEACTIVATE_CROSSHAIR = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            activeCrosshair && activeCrosshair.kill()
        }
    });

    ig.EVENT_STEP.SET_CROSSHAIR_TARGET = ig.EventStepBase.extend({
        pos: null,
        _wm: new ig.Config({
            attributes: {
                pos: {
                    _type: "Vec2",
                    _info: "Target position for CrossHair",
                    _visualize: true,
                    _pointSelect: true
                }
            }
        }),
        init: function (settings) {
            this.pos = settings.pos
        },
        start: function () {
            activeCrosshair.setActive(true);
            ig.Event.getVec2(this.pos, activeCrosshair.controller.targetPos)
        }
    });

    ig.EVENT_STEP.SET_CROSSHAIR_SPEED = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Speed of CrossHair. 1 is default, 0 is pause"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        start: function () {
            activeCrosshair.setSpeedFactor(this.value)
        }
    });

    ig.EVENT_STEP.REDUCE_CROSSHAIR_PRECISION = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Amount to reduce. 0=nothing, 1=maximum"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        start: function () {
            activeCrosshair.reducePrecision(this.value)
        }
    });

    var throwDir = Vec2.create();

    ig.EVENT_STEP.GET_CROSSHAIR_DIR = ig.EventStepBase.extend({
        variable: null,
        _wm: new ig.Config({
            attributes: {
                variable: {
                    _type: "VarName",
                    _info: "Variable to contain (random) CrossHair direction."
                }
            }
        }),
        init: function (settings) {
            this.variable = settings.variable
        },
        start: function () {
            activeCrosshair.getThrowDir(throwDir);
            ig.vars.set(this.variable, throwDir)
        }
    })
});
ig.baked = !0;
