/**
 * impact.feature.dream-fx.dream-fx-steps
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.dream-fx.dream-fx-steps")`.
 *
 * Event steps to start/stop the dream overlay and animate its colors and
 * circle size.
 */
ig.module("impact.feature.dream-fx.dream-fx-steps")
    .requires("impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.START_DREAM_FX = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                centerColor: {
                    _type: "Color",
                    _info: "Color of center"
                },
                borderColor: {
                    _type: "Color",
                    _info: "Color of border"
                },
                circleSize: {
                    _type: "Number",
                    _info: "Size of visible circle in center. 1=fullSize"
                },
                transition: {
                    _type: "Boolean",
                    _info: "If true, slowly fade in effects"
                }
            }
        }),

        init: function (settings) {
            this.assets = new ig.DreamAssets();
            this.centerColor = new ig.RGBColor(settings.centerColor);
            this.borderColor = new ig.RGBColor(settings.borderColor);
            this.circleSize = settings.circleSize || 0;
            this.transition = settings.transition || false;
        },

        clearCached: function () {
            this.assets.clearCached();
        },

        start: function () {
            ig.dreamFx.start(this.assets, this.transition);
            ig.dreamFx.setColors(this.centerColor, this.borderColor, 0);
            ig.dreamFx.setCircleSize(this.circleSize, 0);
        }
    });

    ig.EVENT_STEP.CLEAR_DREAM_FX = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        start: function () {
            ig.dreamFx.clear();
        }
    });

    ig.EVENT_STEP.SET_DREAM_FX_COLORS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                centerColor: {
                    _type: "Color",
                    _info: "Color of center"
                },
                borderColor: {
                    _type: "Color",
                    _info: "Color of border"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of transition"
                }
            }
        }),

        init: function (settings) {
            this.centerColor = new ig.RGBColor(settings.centerColor);
            this.borderColor = new ig.RGBColor(settings.borderColor);
            this.duration = settings.duration || 0;
        },

        start: function () {
            ig.dreamFx.setColors(this.centerColor, this.borderColor, this.duration);
        }
    });

    ig.EVENT_STEP.SET_DREAM_FX_CIRCLE_SIZE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                circleSize: {
                    _type: "Number",
                    _info: "Size of visible circle in center. 1=fullSize"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of transition"
                }
            }
        }),

        init: function (settings) {
            this.circleSize = settings.circleSize || 0;
            this.duration = settings.duration || 0;
        },

        start: function () {
            ig.dreamFx.setCircleSize(this.circleSize, this.duration);
        }
    });
});
ig.baked = !0;
