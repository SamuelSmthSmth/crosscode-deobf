ig.module("impact.feature.overlay.overlay").requires("impact.base.event", "impact.base.game", "impact.feature.gui.gui").defines(function() {
    ig.perf.overlay = true;
    ig.OverlayGui = ig.GuiElementBase.extend({
        color: null,
        lighter: false,
        init: function() {
            this.parent();
            this.hook.zIndex = -10
        },
        updateDrawables: function(b) {
            if (ig.perf.overlay && this.color) {
                var a = this.color;
                if (a.a > 0.01) {
                    a = "rgba(" + Math.floor(a.r) + "," + Math.floor(a.g) + "," + Math.floor(a.b) + "," + a.a + ")";
                    b = b.addColor(a, 0, 0, ig.system.width, ig.system.height);
                    this.lighter &&
                        b.setCompositionMode("lighter")
                }
            }
        }
    });
    ig.AlphaTransitionHandler = ig.Class.extend({
        timer: null,
        startAlpha: 0,
        targetAlpha: 0,
        blinkAlpha: void 0,
        init: function() {
            this.timer = new ig.WeightTimer(true)
        },
        update: function() {
            if (!this.timer.done()) {
                this.timer.tick();
                this.timer.get();
                if (this.blinkAlpha !== void 0 && this.timer.onBlinkDecline()) {
                    this.startAlpha = this.blinkAlpha;
                    this.blinkAlpha = void 0
                }
                return false
            }
            return true
        },
        getAlpha: function() {
            var b = this.timer.get();
            return (1 - b) * this.startAlpha + b * this.targetAlpha
        },
        set: function(b,
            a, d) {
            this.startAlpha = this.getAlpha();
            this.targetAlpha = b;
            this.blinkAlpha = d;
            this.timer.set(a, d !== void 0 ? ig.TIMER_MODE.BLINK : ig.TIMER_MODE.ONCE)
        }
    });
    ig.OverlayCornerGui = ig.GuiElementBase.extend({
        gfx: null,
        alphaHandler: null,
        init: function(b) {
            this.parent();
            this.hook.localAlpha = 0;
            this.hook.zIndex = -20;
            this.gfx = b;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.alphaHandler = new ig.AlphaTransitionHandler(true)
        },
        update: function() {
            if (!this.alphaHandler.update()) this.hook.localAlpha = this.alphaHandler.getAlpha()
        },
        updateDrawables: function(b) {
            if (ig.perf.overlay) {
                b.addGfx(this.gfx, 0, 0);
                b.addGfx(this.gfx, this.hook.size.x - this.gfx.width, 0, 0, 0, void 0, void 0, true)
            }
        },
        setAlpha: function(b, a, d) {
            if (!a) this.hook.localAlpha = b;
            this.alphaHandler.set(b, a, d)
        }
    });
    ig.OVERLAY_CORNER = {
        WHITE: 0,
        RED: 1,
        BLACK: 2
    };
    ig.Overlay = ig.GameAddon.extend({
        colorOld: {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        },
        colorNew: {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        },
        lighter: false,
        timer: 0,
        max: 0,
        gfx: {
            WHITE: new ig.Image("media/gui/env-white.png"),
            RED: new ig.Image("media/gui/env-red.png"),
            BLACK: new ig.Image("media/gui/env-black.png")
        },
        colorGui: null,
        cornerGui: [],
        init: function() {
            this.parent("Overlay");
            this.colorGui = new ig.OverlayGui;
            ig.gui.addGuiElement(this.colorGui);
            for (var b in this.gfx) {
                var a = new ig.OverlayCornerGui(this.gfx[b]);
                this.cornerGui[ig.OVERLAY_CORNER[b]] = a;
                ig.gui.addGuiElement(a)
            }
        },
        deferredUpdateOrder: 400,
        onDeferredUpdate: function() {
            if (this.timer < this.max) {
                this.timer = this.timer + ig.system.actualTick;
                if (this.timer >= this.max) {
                    this.timer = this.max;
                    if (this.colorNew.a == 0) {
                        this.colorNew.r = 0;
                        this.colorNew.g = 0;
                        this.colorNew.b =
                            0;
                        this.lighter = false
                    }
                }
            }
            var b = this._getCurrentColor();
            this.colorGui.color = b;
            this.colorGui.lighter = this.lighter
        },
        onReset: function() {
            this.setColor(0, 0, 0, 0, 0, false);
            for (var b in ig.OVERLAY_CORNER) this.setCorner(b, 0, 0, false)
        },
        setColor: function(b, a, d, c, e, f, g) {
            this.colorOld = this._getCurrentColor();
            this.colorNew.r = b;
            this.colorNew.g = a;
            this.colorNew.b = d;
            this.colorNew.a = c;
            this.lighter = f || false;
            this.max = e;
            this.timer = 0;
            b = g ? 1300 : -10;
            if (b != this.colorGui.hook.zIndex) {
                this.colorGui.hook.zIndex = b;
                ig.gui.sortGui()
            }
        },
        setAlpha: function(b, a) {
            this.colorOld = this._getCurrentColor();
            this.colorNew.a = b;
            this.max = a;
            this.timer = 0
        },
        setCorner: function(b, a, d, c) {
            b = typeof b == "string" ? ig.OVERLAY_CORNER[b] : b;
            this.cornerGui[b].setAlpha(a, d, c)
        },
        _getCurrentColor: function() {
            var b = {},
                a = this.max ? (this.timer / this.max).limit(0, 1) : 1,
                d;
            for (d in this.colorOld) b[d] = this.colorOld[d] * (1 - a) + this.colorNew[d] * a;
            return b
        }
    });
    ig.addGameAddon(function() {
        return ig.overlay = new ig.Overlay
    })
});
ig.baked = !0;
