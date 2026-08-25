ig.module("impact.feature.influencer.influencer-steps").requires("impact.base.action", "impact.base.event", "impact.base.entity", "impact.feature.influencer.influencer").defines(function() {
    function b(a) {
        return a instanceof ig.InfluenceConnection
    }
    var a = {
        SELF: function(a) {
            return a
        },
        TARGET: function(a) {
            return a.getTarget()
        },
        OWNER: function(a) {
            return a.getCombatantRoot()
        }
    };
    ig.ACTION_STEP.ADD_TEMP_INFLUENCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "On what target to apply influence",
                    _select: a
                },
                timeScale: {
                    _type: "Number",
                    _info: "Scale general time of target",
                    _default: 1
                },
                logicTimeScale: {
                    _type: "Number",
                    _info: "Scale logic time of target (won't slow down physics)",
                    _default: 1
                },
                moveXYScale: {
                    _type: "Number",
                    _info: "Scale XY movement speed of target",
                    _default: 1
                }
            }
        }),
        init: function(b) {
            this.target = a[b.target] || a.SELF;
            this.influenceEntry = new ig.InfluenceEntry;
            this.influenceEntry.timeScale = b.timeScale === void 0 ? 1 : b.timeScale;
            this.influenceEntry.logicTimeScale = b.logicTimeScale === void 0 ? 1 : b.logicTimeScale;
            this.influenceEntry.moveXYScale =
                b.moveXYScale || 0
        },
        start: function(a) {
            var b = this.target(a);
            if (b && b.influencer) {
                b = new ig.InfluenceConnection(b.influencer, this.influenceEntry);
                a.addActionAttached(b)
            }
        }
    });
    ig.ACTION_STEP.CLEAR_TEMP_INFLUENCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.clearActionAttached(b)
        }
    })
});
ig.baked = !0;
