/**
 * impact.feature.influencer.influencer-steps
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.influencer.influencer-steps")`.
 *
 * Action steps to temporarily apply (and later clear) an influence on the
 * acting entity or its target.
 */
ig.module("impact.feature.influencer.influencer-steps")
    .requires("impact.base.action", "impact.base.event", "impact.base.entity", "impact.feature.influencer.influencer")
    .defines(function () {

    function isInfluenceConnection(obj) {
        return obj instanceof ig.InfluenceConnection;
    }

    /** Resolves which entity an influence step applies to. */
    var influenceTarget = {
        SELF: function (entity) {
            return entity;
        },
        TARGET: function (entity) {
            return entity.getTarget();
        },
        OWNER: function (entity) {
            return entity.getCombatantRoot();
        }
    };

    ig.ACTION_STEP.ADD_TEMP_INFLUENCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "On what target to apply influence",
                    _select: influenceTarget
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

        init: function (settings) {
            this.target = influenceTarget[settings.target] || influenceTarget.SELF;
            this.influenceEntry = new ig.InfluenceEntry();
            this.influenceEntry.timeScale = settings.timeScale === void 0 ? 1 : settings.timeScale;
            this.influenceEntry.logicTimeScale = settings.logicTimeScale === void 0 ? 1 : settings.logicTimeScale;
            this.influenceEntry.moveXYScale = settings.moveXYScale || 0;
        },

        start: function (entity) {
            var target = this.target(entity);
            if (target && target.influencer) {
                var connection = new ig.InfluenceConnection(target.influencer, this.influenceEntry);
                entity.addActionAttached(connection);
            }
        }
    });

    ig.ACTION_STEP.CLEAR_TEMP_INFLUENCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        start: function (entity) {
            entity.clearActionAttached(isInfluenceConnection);
        }
    });
});
ig.baked = !0;
