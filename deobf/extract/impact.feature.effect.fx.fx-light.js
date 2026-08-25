ig.module("impact.feature.effect.fx.fx-light").requires("impact.feature.effect.effect-sheet").defines(function() {
    function b(a) {
        return a instanceof ig.LightHandle
    }

    function a(a) {
        return a instanceof ig.DarknessHandle
    }

    function d(a) {
        return a instanceof ig.ScreenFlashHandle
    }
    ig.EFFECT_ENTRY.LIGHT = ig.EffectStepBase.extend({
        size: null,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        maxAlpha: 1,
        glow: void 0,
        _wm: new ig.Config({
            attributes: {
                size: {
                    _type: "String",
                    _info: "Size of emitting light",
                    _select: ig.LIGHT_SIZE
                },
                fadeIn: {
                    _type: "Number",
                    _info: "Fade in time of light"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Fade out time of light"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of light source. -1=forever"
                },
                maxAlpha: {
                    _type: "Number",
                    _info: "Max alpha intensity of light",
                    _optional: true
                },
                glow: {
                    _type: "Boolean",
                    _info: "True if light should additionally glow (lighter rendering addition)"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset for light position",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.size = ig.LIGHT_SIZE[b.size || "XS"];
            this.fadeIn = b.fadeIn || 0;
            this.fadeOut =
                b.fadeOut || 0;
            this.duration = b.duration || 0;
            this.maxAlpha = b.maxAlpha || 1;
            this.offset = b.offset || null;
            this.glow = b.glow
        },
        start: function(a) {
            a = new ig.LightHandle(a, this.size, this.fadeIn, this.fadeOut, this.duration, this.maxAlpha, this.glow);
            this.offset && a.setOffset(this.offset.x, this.offset.y, this.offset.z);
            ig.light.addLightHandle(a)
        },
        getDuration: function() {
            return this.duration >= 0 ? this.duration + this.fadeIn + this.fadeOut : 0
        }
    });
    ig.EFFECT_ENTRY.CLEAR_LIGHT = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.clearEntityAttached(b)
        },
        getDuration: function() {
            return 0
        }
    });
    ig.EFFECT_ENTRY.DARKNESS = ig.EffectStepBase.extend({
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        intensity: 1,
        _wm: new ig.Config({
            attributes: {
                fadeIn: {
                    _type: "Number",
                    _info: "Fade in time of darkness"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Fade out time of darkness"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of darkness. -1=forever"
                },
                intensity: {
                    _type: "Number",
                    _info: "Intensity of darkness"
                }
            }
        }),
        init: function(a, b) {
            this.fadeIn = b.fadeIn ||
                0;
            this.fadeOut = b.fadeOut || 0;
            this.duration = b.duration || 0;
            this.intensity = b.intensity || 1
        },
        start: function(a) {
            var b = new ig.DarknessHandle;
            b.setTemporary(a, this.intensity, this.duration, this.fadeIn, this.fadeOut);
            ig.light.addDarknessHandle(b)
        },
        getDuration: function() {
            return this.duration >= 0 ? this.duration + this.fadeIn + this.fadeOut : 0
        }
    });
    ig.EFFECT_ENTRY.CLEAR_DARKNESS = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(b) {
            b.clearEntityAttached(a)
        },
        getDuration: function() {
            return 0
        }
    });
    ig.EFFECT_ENTRY.SCREEN_FLASH = ig.EffectStepBase.extend({
        color: null,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        intensity: 1,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color of screenflash"
                },
                fadeIn: {
                    _type: "Number",
                    _info: "Fade in time of darkness"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Fade out time of darkness"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of darkness. -1=forever"
                }
            }
        }),
        init: function(a, b) {
            this.color = b.color || null;
            this.fadeIn = b.fadeIn || 0;
            this.fadeOut = b.fadeOut || 0;
            this.duration = b.duration || 0
        },
        start: function(a) {
            a =
                new ig.ScreenFlashHandle(a, this.color, this.fadeIn, this.fadeOut, this.duration);
            ig.light.addScreenFlashHandle(a)
        },
        getDuration: function() {
            return this.duration >= 0 ? this.duration + this.fadeIn + this.fadeOut : 0
        }
    });
    ig.EFFECT_ENTRY.CLEAR_SCREEN_FLASH = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.clearEntityAttached(d)
        },
        getDuration: function() {
            return 0
        }
    })
});
ig.baked = !0;
