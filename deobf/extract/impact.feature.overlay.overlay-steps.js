ig.module("impact.feature.overlay.overlay-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.SET_OVERLAY = ig.EventStepBase.extend({
        color: null,
        alpha: 0,
        time: 0,
        lighter: false,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "Color",
                    _info: "Color of overlay"
                },
                alpha: {
                    _type: "Number",
                    _info: "Alpha of overlay, range [0,1]. 0 = transparent"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time to new overlay color and alpha"
                },
                lighter: {
                    _type: "Boolean",
                    _info: "Apply color in lighter mode"
                },
                overMessage: {
                    _type: "Boolean",
                    _info: "If true: show overlay above messages",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            assertContent(b, "alpha", "time", "color");
            this.alpha = b.alpha;
            this.time = b.time;
            this.color = new ig.RGBColor(b.color);
            this.lighter = b.lighter || false;
            this.overMessage = b.overMessage || false
        },
        start: function() {
            ig.overlay.setColor(this.color.r || 0, this.color.g || 0, this.color.b || 0, this.alpha, this.time, this.lighter, this.overMessage)
        }
    });
    ig.EVENT_STEP.SET_OVERLAY_CORNER = ig.EventStepBase.extend({
        color: null,
        alpha: 0,
        time: 0,
        blinkAlpha: null,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color of corner",
                    _select: ig.OVERLAY_CORNER
                },
                alpha: {
                    _type: "Number",
                    _info: "Alpha of corner, range [0,1]. 0 = transparent"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time to new alpha value"
                },
                blinkAlpha: {
                    _type: "Number",
                    _info: "If specified: alterate between alpha and blinkAlpha",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            assertContent(b, "alpha", "time", "color");
            this.alpha = b.alpha;
            this.time = b.time;
            this.color = b.color;
            this.blinkAlpha =
                b.blinkAlpha
        },
        start: function() {
            ig.overlay.setCorner(this.color, this.alpha, this.time, this.blinkAlpha === null ? void 0 : this.blinkAlpha)
        }
    });
    ig.ACTION_STEP.SET_OVERLAY_CORNER = ig.EventStepBase.extend({
        color: null,
        alpha: 0,
        time: 0,
        blinkAlpha: null,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color of corner",
                    _select: ig.OVERLAY_CORNER
                },
                alpha: {
                    _type: "Number",
                    _info: "Alpha of corner, range [0,1]. 0 = transparent"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time to new alpha value"
                },
                blinkAlpha: {
                    _type: "Number",
                    _info: "If specified: alterate between alpha and blinkAlpha",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            assertContent(b, "alpha", "time", "color");
            this.alpha = b.alpha;
            this.time = b.time;
            this.color = b.color;
            this.blinkAlpha = b.blinkAlpha
        },
        start: function() {
            ig.overlay.setCorner(this.color, this.alpha, this.time, this.blinkAlpha === null ? void 0 : this.blinkAlpha)
        }
    })
});
ig.baked = !0;
