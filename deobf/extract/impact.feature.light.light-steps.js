ig.module("impact.feature.light.light-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    Vec3.create();
    ig.ACTION_STEP.ADD_DARKNESS = ig.EventStepBase.extend({
        intensity: 0,
        duration: 0,
        fadeIn: 0,
        fadeOut: 0,
        _wm: new ig.Config({
            attributes: {
                intensity: {
                    _type: "Number",
                    _info: "Intensity of darkness"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of darkness effect. -1 for continuous effect"
                },
                fadeIn: {
                    _type: "Number",
                    _info: "fadeIn duration"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "fadeOut duration"
                }
            }
        }),
        init: function(b) {
            this.intensity = b.intensity || 0;
            this.duration = b.duration || 0;
            this.fadeIn = b.fadeIn || 0;
            this.fadeOut = b.fadeOut || 0
        },
        start: function(b) {
            var a = new ig.DarknessHandle;
            a.setTemporary(b, this.intensity, this.duration, this.fadeIn, this.fadeOut);
            ig.light.addDarknessHandle(a);
            b.addActionAttached(a)
        }
    });
    ig.ACTION_STEP.CLEAR_DARKNESS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(b) {
            for (var b = b.actionAttached, a = b.length; a--;)
                if (b[a] instanceof ig.DarknessHandle) {
                    b[a].stop();
                    b.splice(a, 1);
                    break
                }
        }
    })
});
ig.baked = !0;
