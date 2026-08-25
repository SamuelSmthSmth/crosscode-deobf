ig.module("impact.feature.effect.fx.fx-color").requires("impact.feature.effect.effect-sheet").defines(function() {
    ig.EFFECT_ENTRY.FLASH_COLOR = ig.EffectStepBase.extend({
        color: null,
        alpha: 1,
        keepDuration: 0,
        duration: 1,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color to flash in"
                },
                alpha: {
                    _type: "Number",
                    _info: "Maximum alpha of color flash"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of color flash"
                },
                keepDuration: {
                    _type: "Number",
                    _info: "Duration of showing maximum flash intensity at beginnging."
                },
                noLighter: {
                    _type: "Boolean",
                    _info: "If true, don't apply lighter color but regular color overlay"
                }
            }
        }),
        init: function(b, a) {
            this.color = a.color || "white";
            this.alpha = a.alpha || 1;
            this.duration = a.duration || 1;
            this.keepDuration = a.keepDuration || 0;
            this.lighter = !a.noLighter;
            assert(this.duration >= 0)
        },
        start: function(b) {
            var a = new ig.ColorOverlay(this.color, 0, b.spriteFilter ? b.spriteFilter[0] : null, this.lighter);
            b.target && b.target.animState && ig.EntityTools.addEntityColorOverlay(b.target, a);
            return {
                duration: this.duration +
                    this.keepDuration,
                overlay: a
            }
        },
        getDuration: function() {
            return this.duration + this.keepDuration
        },
        update: function(b, a, d, c) {
            b = 0;
            b = a < this.keepDuration ? 1 : Math.max(0, 1 - (a - this.keepDuration) / this.duration);
            c.overlay.alpha = b * this.alpha
        },
        finish: function(b, a) {
            a.overlay.clear()
        }
    });
    ig.EFFECT_ENTRY.BLINK_COLOR = ig.EffectStepBase.extend({
        color: null,
        maxAlpha: 1,
        minAlpha: 0,
        blinkDuration: 0.5,
        blinkCount: 1,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color to blink in"
                },
                maxAlpha: {
                    _type: "Number",
                    _info: "Maximum alpha intensity"
                },
                minAlpha: {
                    _type: "Number",
                    _info: "Minimum alpha intensity"
                },
                blinkDuration: {
                    _type: "Number",
                    _info: "Duration of one time flashing back and force between min and max alpha"
                },
                blinkCount: {
                    _type: "Integer",
                    _info: "Number of blinks. -1 if unlimited"
                },
                noLighter: {
                    _type: "Boolean",
                    _info: "If true, don't apply lighter color but regular color overlay"
                }
            }
        }),
        init: function(b, a) {
            this.color = a.color || "white";
            this.maxAlpha = a.maxAlpha || 1;
            this.minAlpha = a.minAlpha || 0;
            this.blinkDuration = a.blinkDuration || 0;
            this.blinkCount = a.blinkCount ||
                1;
            this.lighter = !a.noLighter
        },
        start: function(b) {
            var a = new ig.ColorOverlay(this.color, 0, b.spriteFilter ? b.spriteFilter[0] : null, this.lighter);
            b.target && b.target.animState && ig.EntityTools.addEntityColorOverlay(b.target, a);
            return {
                duration: this.getDuration(),
                overlay: a
            }
        },
        getDuration: function() {
            return this.blinkCount < 0 ? -1 : this.blinkCount * this.blinkDuration
        },
        update: function(b, a, d, c) {
            b = this.minAlpha;
            if (a < this.blinkDuration / 2 || d > 0 && d - a < this.blinkDuration / 2) b = 0;
            a = a % this.blinkDuration / this.blinkDuration;
            a = (a > 0.5 ?
                1 - a : a) * 2;
            c.overlay.alpha = b * (1 - a) + this.maxAlpha * a
        },
        cancel: function(b, a) {
            return Math.ceil(a / this.blinkDuration) * this.blinkDuration
        },
        finish: function(b, a) {
            a.overlay.clear()
        }
    });
    ig.EFFECT_ENTRY.FADE_COLOR = ig.EffectStepBase.extend({
        color: null,
        alpha: 1,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color to blink in"
                },
                alpha: {
                    _type: "Number",
                    _info: "Maximum alpha intensity"
                },
                fadeIn: {
                    _type: "Number",
                    _info: "Fade in duration of color"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Fade out duration of color"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of color display. -1 = forever"
                },
                noLighter: {
                    _type: "Boolean",
                    _info: "If true, don't apply lighter color but regular color overlay"
                }
            }
        }),
        init: function(b, a) {
            this.color = a.color || "white";
            this.alpha = a.alpha || 1;
            this.fadeIn = a.fadeIn || 0;
            this.fadeOut = a.fadeOut || 0;
            this.duration = a.duration || 0;
            this.lighter = !a.noLighter
        },
        start: function(b) {
            var a = new ig.ColorOverlay(this.color, 0, b.spriteFilter ? b.spriteFilter[0] : null, this.lighter);
            b.target && b.target.animState && ig.EntityTools.addEntityColorOverlay(b.target,
                a, b.noMultiGroup);
            return {
                duration: this.getDuration(),
                overlay: a
            }
        },
        getDuration: function() {
            return this.duration < 0 ? -1 : this.fadeIn + this.duration + this.fadeOut
        },
        update: function(b, a, d, c) {
            b = 1;
            d > 0 && d - a < this.fadeOut ? b = (d - a) / this.fadeOut : a < this.fadeIn && (b = a / this.fadeIn);
            c.overlay.alpha = this.alpha * b
        },
        cancel: function(b, a) {
            return a + this.fadeOut
        },
        finish: function(b, a) {
            a.overlay.clear()
        }
    });
    ig.EFFECT_ENTRY.CHANGE_ALPHA = ig.EffectStepBase.extend({
        alpha: 0,
        duration: 0,
        _wm: new ig.Config({
            attributes: {
                alpha: {
                    _type: "Number",
                    _info: "Target alpha value"
                },
                duration: {
                    _type: "Number",
                    _info: "Transition time to target alpha value"
                }
            }
        }),
        init: function(b, a) {
            this.alpha = a.alpha || 0;
            this.duration = a.duration || 0
        },
        getDuration: function() {
            return this.duration
        },
        start: function(b) {
            if (b.target && b.target.animState)
                if (this.duration == 0) b.target.animState.alpha = this.alpha;
                else return {
                    duration: this.duration,
                    startAlpha: b.target.animState.alpha
                }
        },
        update: function(b, a, d, c) {
            if (b.target && b.target.animState) {
                a = Math.min(1, a / d);
                b.target.animState.alpha = c.startAlpha *
                    (1 - a) + this.alpha * a
            }
        },
        finish: function(b) {
            if (b.target && b.target.animState) b.target.animState.alpha = this.alpha
        }
    });
    ig.EFFECT_ENTRY.CHANGE_SCALE = ig.EffectStepBase.extend({
        scaleX: 0,
        scaleY: 0,
        duration: 0,
        spline: null,
        _wm: new ig.Config({
            attributes: {
                scaleX: {
                    _type: "Number",
                    _info: "Target scale X value",
                    _default: 1
                },
                scaleY: {
                    _type: "Number",
                    _info: "Target scale Y value",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Transition time to target scale value"
                },
                spline: {
                    _type: "String",
                    _info: "Spline for transition",
                    _optional: true,
                    _select: KEY_SPLINES
                }
            }
        }),
        init: function(b, a) {
            this.scaleX = a.scaleX || 0;
            this.scaleY = a.scaleY || 0;
            this.duration = a.duration || 0;
            this.spline = KEY_SPLINES[a.spline || "LINEAR"]
        },
        getDuration: function() {
            return this.duration
        },
        start: function(b) {
            if (b.target && b.target.animState)
                if (this.duration == 0) {
                    b.target.animState.scaleX = this.scaleX;
                    b.target.animState.scaleY = this.scaleY
                } else return {
                    duration: this.duration,
                    startScaleX: b.target.animState.scaleX,
                    startScaleY: b.target.animState.scaleY
                }
        },
        update: function(b, a, d, c) {
            if (b.target &&
                b.target.animState) {
                a = Math.min(1, a / d);
                a = this.spline.get(a);
                b.target.animState.scaleX = c.startScaleX * (1 - a) + this.scaleX * a;
                b.target.animState.scaleY = c.startScaleY * (1 - a) + this.scaleY * a
            }
        },
        finish: function(b) {
            if (b.target && b.target.animState) {
                b.target.animState.scaleX = this.scaleX;
                b.target.animState.scaleY = this.scaleY
            }
        }
    })
});
ig.baked = !0;
