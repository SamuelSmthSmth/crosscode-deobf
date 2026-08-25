ig.module("game.feature.player.crosshair-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity").defines(function() {
    var b = null;
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
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a, c) {
            var e = ig.Event.getEntity(this.entity, c);
            if (e) {
                b = ig.game.spawnEntity(ig.ENTITY.Crosshair, 0, 0, 0, {
                    thrower: e,
                    controller: new sc.EventCrossHairController
                });
                b.chargeActive = true
            }
        }
    });
    ig.EVENT_STEP.DEACTIVATE_CROSSHAIR = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            b && b.kill()
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
        init: function(a) {
            this.pos = a.pos
        },
        start: function() {
            b.setActive(true);
            ig.Event.getVec2(this.pos, b.controller.targetPos)
        }
    });
    ig.EVENT_STEP.SET_CROSSHAIR_SPEED =
        ig.EventStepBase.extend({
            value: null,
            _wm: new ig.Config({
                attributes: {
                    value: {
                        _type: "Number",
                        _info: "Speed of CrossHair. 1 is default, 0 is pause"
                    }
                }
            }),
            init: function(a) {
                this.value = a.value
            },
            start: function() {
                b.setSpeedFactor(this.value)
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
        init: function(a) {
            this.value = a.value
        },
        start: function() {
            b.reducePrecision(this.value)
        }
    });
    var a =
        Vec2.create();
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
        init: function(a) {
            this.variable = a.variable
        },
        start: function() {
            b.getThrowDir(a);
            ig.vars.set(this.variable, a)
        }
    })
});
ig.baked = !0;
