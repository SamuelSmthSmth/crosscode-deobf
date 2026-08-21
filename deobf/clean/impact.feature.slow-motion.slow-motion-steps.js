/**
 * impact.feature.slow-motion.slow-motion-steps
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.slow-motion.slow-motion-steps")`.
 *
 * Event/action steps to add and remove (named) slow motion effects.
 */
ig.module("impact.feature.slow-motion.slow-motion-steps")
    .requires("impact.feature.slow-motion.slow-motion", "impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.ADD_SLOW_MOTION = ig.EventStepBase.extend({
        name: null,
        factor: 0,
        time: 0,

        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the slow motion effect. Used this to remove the effect later on"
                },
                factor: {
                    _type: "Number",
                    _info: "How much to slow down the time. 0.5 = half the speed"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time for slow motion"
                }
            }
        }),

        init: function (settings) {
            this.name = settings.name;
            this.factor = settings.factor;
            this.time = settings.time;
        },

        start: function () {
            ig.slowMotion.add(this.factor, this.time, this.name);
        }
    });

    ig.EVENT_STEP.CLEAR_SLOW_MOTION = ig.EventStepBase.extend({
        name: null,
        time: 0,

        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of slow motion to be removed"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time for slow motion removal"
                }
            }
        }),

        init: function (settings) {
            this.name = settings.name;
            this.time = settings.time;
        },

        start: function () {
            ig.slowMotion.clearNamed(this.name, this.time);
        }
    });

    ig.ACTION_STEP.ADD_SLOW_MOTION = ig.ActionStepBase.extend({
        factor: 0,
        time: 0,

        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "How much to slow down the time. 0.5 = half the speed"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time for slow motion"
                },
                keepEntityStatic: {
                    _type: "Boolean",
                    _info: "If true, set entity to be in animation static time"
                },
                inversAccelerate: {
                    _type: "Boolean",
                    _info: "If true, inverse accelerate actor"
                }
            }
        }),

        init: function (settings) {
            this.factor = settings.factor;
            this.time = settings.time;
            this.keepEntityStatic = settings.keepEntityStatic;
            this.inversAccelerate = settings.inversAccelerate;
        },

        start: function (entity) {
            var handle = ig.slowMotion.add(this.factor, this.time, null);
            entity.addActionAttached(handle);
            if (this.keepEntityStatic) entity.coll.time.animStatic = true;
            if (this.inversAccelerate) {
                for (var coll = entity.coll; coll.time.parent;) coll = coll.time.parent;
                handle.addInverseEntity(coll.entity);
            }
        }
    });

    ig.ACTION_STEP.CLEAR_SLOW_MOTION = ig.ActionStepBase.extend({
        time: 0,

        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Transition time for slow motion removal"
                },
                removeEntityStatic: {
                    _type: "Boolean",
                    _info: "If true, remove entity from static time"
                }
            }
        }),

        init: function (settings) {
            this.time = settings.time;
            this.removeEntityStatic = settings.removeEntityStatic;
        },

        start: function (entity) {
            for (var attached = entity.actionAttached, i = attached.length; i--;)
                if (attached[i] instanceof ig.SlowMotionHandle) {
                    attached[i].clear(this.time);
                    attached.splice(i, 1);
                }
            if (this.removeEntityStatic) entity.coll.time.animStatic = false;
        }
    });
});
ig.baked = !0;
