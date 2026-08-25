ig.module("impact.feature.parallax.parallax-steps").requires("impact.feature.parallax.parallax", "impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.SHOW_PARALLAX = ig.EventStepBase.extend({
        parallaxGui: null,
        _wm: new ig.Config({
            attributes: {
                parallax: {
                    _type: "String",
                    _info: "Parallax to show",
                    _select: "parallax"
                }
            }
        }),
        init: function(b) {
            if (!window.wm) this.parallaxGui = ig.gui.createEventGui("__parallaxGui__", "Parallax", {
                parallax: b.parallax
            })
        },
        clearCached: function() {
            ig.gui.freeEventGui(this.parallaxGui)
        },
        start: function() {
            ig.gui.spawnEventGui(this.parallaxGui);
            this.parallaxGui.start()
        },
        run: function() {
            return this.parallaxGui.hasEnded()
        }
    })
});
ig.baked = !0;
