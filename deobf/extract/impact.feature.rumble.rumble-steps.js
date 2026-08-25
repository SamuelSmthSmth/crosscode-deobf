ig.module("impact.feature.rumble.rumble-steps").requires("impact.base.action", "impact.base.event", "impact.feature.effect.effect-sheet", "impact.feature.rumble.rumble").defines(function() {
    function b(a) {
        return a instanceof ig.Rumble.RumbleHandle
    }
    ig.EVENT_STEP.RUMBLE_SCREEN = ig.EventStepBase.extend({
        rumbleType: null,
        name: null,
        duration: 0,
        power: 0,
        speed: 0,
        fade: false,
        _wm: new ig.Config({
            attributes: {
                rumbleType: {
                    _type: "String",
                    _info: "Type of rumble",
                    _select: ig.RUMBLE_TYPE
                },
                name: {
                    _type: "String",
                    _info: "Name of the rumble. Can be ignored for anonymous rumble effects."
                },
                duration: {
                    _type: "Number",
                    _info: "The time the rumble will take. -1 for continues effect"
                },
                power: {
                    _type: "String",
                    _select: ig.Rumble.SHAKE_POWER,
                    _info: "Power of the rumble."
                },
                speed: {
                    _type: "String",
                    _select: ig.Rumble.SHAKE_DURATION,
                    _info: "Speed of a single rumble."
                },
                fade: {
                    _type: "Boolean",
                    _info: "Rumble effect gets weaker towards the passed time."
                }
            }
        }),
        init: function(a) {
            this.rumbleType = a.rumbleType || null;
            this.name = a.name || null;
            this.power = a.power || "WEAKEST";
            this.speed = a.speed || "SLOWEST";
            this.duration = a.duration ||
                0;
            this.fade = a.fade || false
        },
        start: function() {
            if (ig.rumble.getRumble(this.name)) ig.rumble.getRumble(this.name).set(this.power, this.speed, this.duration, this.fade);
            else {
                var a = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, this.name);
                ig.rumble.addRumble(a)
            }
        }
    });
    ig.EVENT_STEP.RUMBLE_STOP_CONTINUES = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the rumble to stop. Must be given!"
                }
            }
        }),
        init: function(a) {
            this.name =
                a.name || null
        },
        start: function() {
            var a = ig.rumble.getRumble(this.name);
            a && a.stop()
        }
    });
    ig.ACTION_STEP.RUMBLE_SCREEN = ig.ActionStepBase.extend({
        rumbleType: null,
        name: null,
        duration: 0,
        power: 0,
        speed: 0,
        fade: false,
        _wm: new ig.Config({
            attributes: {
                rumbleType: {
                    _type: "String",
                    _info: "Type of rumble",
                    _select: ig.RUMBLE_TYPE
                },
                name: {
                    _type: "String",
                    _info: "Name of the rumble. Can be ignored for anonymous rumble effects."
                },
                duration: {
                    _type: "Number",
                    _info: "The time the rumble will take. -1 for continues effect"
                },
                power: {
                    _type: "String",
                    _select: ig.Rumble.SHAKE_POWER,
                    _info: "Power of the rumble."
                },
                speed: {
                    _type: "String",
                    _select: ig.Rumble.SHAKE_DURATION,
                    _info: "Speed of a single rumble."
                },
                fade: {
                    _type: "Boolean",
                    _info: "Rumble effect gets weaker towards the passed time."
                }
            }
        }),
        init: function(a) {
            this.rumbleType = a.rumbleType || null;
            this.name = a.name || null;
            this.power = a.power || "WEAKEST";
            this.speed = a.speed || "SLOWEST";
            this.duration = a.duration || 0;
            this.fade = a.fade || false
        },
        run: function() {
            if (ig.rumble.getRumble(this.name)) ig.rumble.getRumble(this.name).set(this.power,
                this.speed, this.duration, this.fade);
            else {
                var a = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, this.name);
                ig.rumble.addRumble(a)
            }
            return true
        }
    });
    ig.EFFECT_ENTRY.RUMBLE = ig.Class.extend({
        rumbleType: null,
        duration: 0,
        power: 0,
        speed: 0,
        fade: false,
        _wm: new ig.Config({
            attributes: {
                rumbleType: {
                    _type: "String",
                    _info: "Type of Rumble effect",
                    _select: ig.RUMBLE_TYPE
                },
                power: {
                    _type: "String",
                    _info: "Power of rumble effect",
                    _select: ig.Rumble.SHAKE_POWER
                },
                speed: {
                    _type: "String",
                    _info: "Speed of rumble effect",
                    _select: ig.Rumble.SHAKE_DURATION
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of rumble effect"
                },
                fade: {
                    _type: "Boolean",
                    _info: "True if rumble effect should fade towards the end."
                }
            }
        }),
        init: function(a, b) {
            this.rumbleType = b.rumbleType || null;
            this.power = b.power || "WEAKEST";
            this.speed = b.speed || "SLOWEST";
            this.duration = b.duration || 0;
            this.fade = b.fade || false
        },
        start: function(a) {
            var b = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, null);
            a.addEntityAttached(b);
            ig.rumble.addRumble(b)
        }
    });
    ig.EFFECT_ENTRY.CLEAR_RUMBLE = ig.Class.extend({
        rumbleType: null,
        duration: 0,
        power: 0,
        speed: 0,
        fade: false,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.clearEntityAttached(b)
        }
    })
});
ig.baked = !0;
