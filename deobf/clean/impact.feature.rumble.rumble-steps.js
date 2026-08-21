/**
 * impact.feature.rumble.rumble-steps
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.rumble.rumble-steps")`.
 *
 * Event/action steps to start and stop screen rumbles, plus effect entries
 * that bind a rumble to an entity's lifetime.
 */
ig.module("impact.feature.rumble.rumble-steps")
    .requires("impact.base.action", "impact.base.event", "impact.feature.effect.effect-sheet", "impact.feature.rumble.rumble")
    .defines(function () {

    function isRumbleHandle(obj) {
        return obj instanceof ig.Rumble.RumbleHandle;
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

        init: function (settings) {
            this.rumbleType = settings.rumbleType || null;
            this.name = settings.name || null;
            this.power = settings.power || "WEAKEST";
            this.speed = settings.speed || "SLOWEST";
            this.duration = settings.duration || 0;
            this.fade = settings.fade || false;
        },

        start: function () {
            if (ig.rumble.getRumble(this.name)) {
                ig.rumble.getRumble(this.name).set(this.power, this.speed, this.duration, this.fade);
            } else {
                var handle = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, this.name);
                ig.rumble.addRumble(handle);
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

        init: function (settings) {
            this.name = settings.name || null;
        },

        start: function () {
            var handle = ig.rumble.getRumble(this.name);
            handle && handle.stop();
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

        init: function (settings) {
            this.rumbleType = settings.rumbleType || null;
            this.name = settings.name || null;
            this.power = settings.power || "WEAKEST";
            this.speed = settings.speed || "SLOWEST";
            this.duration = settings.duration || 0;
            this.fade = settings.fade || false;
        },

        run: function () {
            if (ig.rumble.getRumble(this.name)) {
                ig.rumble.getRumble(this.name).set(this.power, this.speed, this.duration, this.fade);
            } else {
                var handle = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, this.name);
                ig.rumble.addRumble(handle);
            }
            return true;
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

        init: function (entity, settings) {
            this.rumbleType = settings.rumbleType || null;
            this.power = settings.power || "WEAKEST";
            this.speed = settings.speed || "SLOWEST";
            this.duration = settings.duration || 0;
            this.fade = settings.fade || false;
        },

        start: function (entity) {
            var handle = new ig.Rumble.RumbleHandle(this.rumbleType, this.power, this.speed, this.duration, this.fade, null);
            entity.addEntityAttached(handle);
            ig.rumble.addRumble(handle);
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

        init: function () {},

        start: function (entity) {
            entity.clearEntityAttached(isRumbleHandle);
        }
    });
});
ig.baked = !0;
