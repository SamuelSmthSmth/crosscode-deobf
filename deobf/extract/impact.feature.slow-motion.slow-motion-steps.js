ig.module("impact.feature.slow-motion.slow-motion-steps").requires("impact.feature.slow-motion.slow-motion", "impact.base.action", "impact.base.event").defines(function() {
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
        init: function(b) {
            this.name = b.name;
            this.factor = b.factor;
            this.time = b.time
        },
        start: function() {
            ig.slowMotion.add(this.factor, this.time, this.name)
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
        init: function(b) {
            this.name = b.name;
            this.time = b.time
        },
        start: function() {
            ig.slowMotion.clearNamed(this.name, this.time)
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
        init: function(b) {
            this.factor = b.factor;
            this.time = b.time;
            this.keepEntityStatic =
                b.keepEntityStatic;
            this.inversAccelerate = b.inversAccelerate
        },
        start: function(b) {
            var a = ig.slowMotion.add(this.factor, this.time, null);
            b.addActionAttached(a);
            if (this.keepEntityStatic) b.coll.time.animStatic = true;
            if (this.inversAccelerate) {
                for (b = b.coll; b.time.parent;) b = b.time.parent;
                a.addInverseEntity(b.entity)
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
        init: function(b) {
            this.time = b.time;
            this.removeEntityStatic = b.removeEntityStatic
        },
        start: function(b) {
            for (var a = b.actionAttached, d = a.length; d--;)
                if (a[d] instanceof ig.SlowMotionHandle) {
                    a[d].clear(this.time);
                    a.splice(d, 1)
                } if (this.removeEntityStatic) b.coll.time.animStatic = false
        }
    })
});
ig.baked = !0;
