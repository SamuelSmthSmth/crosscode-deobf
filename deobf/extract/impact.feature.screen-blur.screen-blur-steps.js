ig.module("impact.feature.screen-blur.screen-blur-steps").requires("impact.feature.screen-blur.screen-blur", "impact.base.action", "impact.base.event", "impact.base.entity").defines(function() {
    ig.EVENT_STEP.SET_SCREEN_BLUR = ig.EventStepBase.extend({
        alpha: 0,
        _wm: new ig.Config({
            attributes: {
                alpha: {
                    _type: "Number",
                    _info: "Alpha of Screen blur. The lower, the stronger the effect",
                    _default: 0.5
                }
            }
        }),
        init: function(b) {
            this.alpha = b.alpha || 0.5
        },
        start: function() {
            ig.screenBlur.setAlpha(this.alpha)
        }
    });
    ig.EVENT_STEP.CLEAR_SCREEN_BLUR =
        ig.EventStepBase.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            start: function() {
                ig.screenBlur.clear()
            }
        });
    ig.EVENT_STEP.SET_ZOOM_BLUR = ig.EventStepBase.extend({
        zoomType: null,
        fadeIn: 0,
        duration: 0,
        fadeOut: 0,
        name: null,
        _wm: new ig.Config({
            attributes: {
                zoomType: {
                    _type: "String",
                    _info: "Type of Zoom Blur effect",
                    _select: ig.BLUR_ZOOM_CONFIG
                },
                fadeIn: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade in",
                    _default: 0.2
                },
                duration: {
                    _type: "Number",
                    _info: "Time of effect. -1 = run forever",
                    _default: 1
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade out",
                    _default: 0.2
                },
                name: {
                    _type: "String",
                    _info: "Name of zoom blur. Can be used to fadeOut permanent zoom blurs",
                    _optional: true
                },
                target: {
                    _type: "Entity",
                    _info: "Target on which to focus zoom blur",
                    _optional: true
                },
                align: {
                    _type: "String",
                    _info: "Alignment on how to get pos from target",
                    _select: ig.ENTITY_ALIGN,
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.zoomType = b.zoomType;
            this.fadeIn =
                b.fadeIn;
            this.duration = b.duration;
            this.fadeOut = b.fadeOut;
            this.name = b.name;
            this.target = b.target;
            this.align = ig.ENTITY_ALIGN[b.align] || ig.ENTITY_ALIGN.CENTER;
            this.offset = b.offset
        },
        start: function() {
            var b = this.target ? ig.Event.getEntity(this.target) : null,
                b = new ig.ZoomBlurHandle(this.zoomType, this.duration, this.fadeIn, this.fadeOut, this.name, b, this.align, this.offset);
            ig.screenBlur.addZoom(b)
        }
    });
    ig.EVENT_STEP.FADE_OUT_ZOOM_BLUR = ig.EventStepBase.extend({
        name: null,
        fadeOut: 0,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of zoom blur to be faded out"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade out",
                    _default: 0.2
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.fadeOut = b.fadeOut || 0
        },
        start: function() {
            ig.screenBlur.fadeOutZoom(this.name, this.fadeOut)
        }
    });
    ig.ACTION_STEP.SET_ZOOM_BLUR = ig.ActionStepBase.extend({
        zoomType: null,
        fadeIn: 0,
        duration: 0,
        fadeOut: 0,
        name: null,
        _wm: new ig.Config({
            attributes: {
                zoomType: {
                    _type: "String",
                    _info: "Type of Zoom Blur effect",
                    _select: ig.BLUR_ZOOM_CONFIG
                },
                fadeIn: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade in",
                    _default: 0.2
                },
                duration: {
                    _type: "Number",
                    _info: "Time of effect. -1 = run forever",
                    _default: 1
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade out",
                    _default: 0.2
                },
                name: {
                    _type: "String",
                    _info: "Name of zoom blur. Can be used to fadeOut permanent zoom blurs",
                    _optional: true
                },
                align: {
                    _type: "String",
                    _info: "Alignment on how to get pos from target",
                    _select: ig.ENTITY_ALIGN,
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.zoomType = b.zoomType;
            this.fadeIn = b.fadeIn;
            this.duration = b.duration;
            this.fadeOut = b.fadeOut;
            this.name = b.name;
            this.align = ig.ENTITY_ALIGN[b.align] || ig.ENTITY_ALIGN.CENTER;
            this.offset = b.offset
        },
        start: function(b) {
            var a = new ig.ZoomBlurHandle(this.zoomType, this.duration, this.fadeIn, this.fadeOut, this.name, b, this.align, this.offset);
            ig.screenBlur.addZoom(a);
            this.duration == -1 && b.addActionAttached(a)
        }
    });
    ig.ACTION_STEP.FADE_OUT_ZOOM_BLUR = ig.ActionStepBase.extend({
        name: null,
        fadeOut: 0,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of zoom blur to be faded out"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Time in seconds for effect to fade out",
                    _default: 0.2
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.fadeOut = b.fadeOut || 0
        },
        start: function() {
            ig.screenBlur.fadeOutZoom(this.name, this.fadeOut)
        }
    })
});
ig.baked = !0;
