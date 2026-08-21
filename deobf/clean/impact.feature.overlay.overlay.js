/**
 * impact.feature.overlay.overlay
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.overlay.overlay")`.
 *
 * `ig.overlay` add-on: a full-screen color overlay (fading between colors)
 * plus corner overlays (white/red/black) whose alpha can be animated and
 * blinked. The screen offset is applied via `ig.game.screen`.
 */
ig.module("impact.feature.overlay.overlay")
    .requires("impact.base.event", "impact.base.game", "impact.feature.gui.gui")
    .defines(function () {

    ig.perf.overlay = true;

    /** Full-screen colored overlay element. */
    ig.OverlayGui = ig.GuiElementBase.extend({
        color: null,
        lighter: false,

        init: function () {
            this.parent();
            this.hook.zIndex = -10;
        },

        updateDrawables: function (drawables) {
            if (ig.perf.overlay && this.color) {
                var color = this.color;
                if (color.a > 0.01) {
                    color = "rgba(" + Math.floor(color.r) + "," + Math.floor(color.g) + "," + Math.floor(color.b) + "," + color.a + ")";
                    drawables = drawables.addColor(color, 0, 0, ig.system.width, ig.system.height);
                    this.lighter && drawables.setCompositionMode("lighter");
                }
            }
        }
    });

    /** Interpolates/animates an alpha value, optionally blinking. */
    ig.AlphaTransitionHandler = ig.Class.extend({
        timer: null,
        startAlpha: 0,
        targetAlpha: 0,
        blinkAlpha: void 0,

        init: function () {
            this.timer = new ig.WeightTimer(true);
        },

        /** Returns true once the transition is done. */
        update: function () {
            if (!this.timer.done()) {
                this.timer.tick();
                this.timer.get();
                if (this.blinkAlpha !== void 0 && this.timer.onBlinkDecline()) {
                    this.startAlpha = this.blinkAlpha;
                    this.blinkAlpha = void 0;
                }
                return false;
            }
            return true;
        },

        getAlpha: function () {
            var t = this.timer.get();
            return (1 - t) * this.startAlpha + t * this.targetAlpha;
        },

        set: function (targetAlpha, time, blinkAlpha) {
            this.startAlpha = this.getAlpha();
            this.targetAlpha = targetAlpha;
            this.blinkAlpha = blinkAlpha;
            this.timer.set(time, blinkAlpha !== void 0 ? ig.TIMER_MODE.BLINK : ig.TIMER_MODE.ONCE);
        }
    });

    /** Corner overlay image whose alpha is driven by an AlphaTransitionHandler. */
    ig.OverlayCornerGui = ig.GuiElementBase.extend({
        gfx: null,
        alphaHandler: null,

        init: function (gfx) {
            this.parent();
            this.hook.localAlpha = 0;
            this.hook.zIndex = -20;
            this.gfx = gfx;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.alphaHandler = new ig.AlphaTransitionHandler(true);
        },

        update: function () {
            if (!this.alphaHandler.update()) this.hook.localAlpha = this.alphaHandler.getAlpha();
        },

        updateDrawables: function (drawables) {
            if (ig.perf.overlay) {
                drawables.addGfx(this.gfx, 0, 0);
                drawables.addGfx(this.gfx, this.hook.size.x - this.gfx.width, 0, 0, 0, void 0, void 0, true);
            }
        },

        setAlpha: function (alpha, time, blinkAlpha) {
            if (!time) this.hook.localAlpha = alpha;
            this.alphaHandler.set(alpha, time, blinkAlpha);
        }
    });

    ig.OVERLAY_CORNER = {
        WHITE: 0,
        RED: 1,
        BLACK: 2
    };

    /** The overlay add-on (`ig.overlay`). */
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

        init: function () {
            this.parent("Overlay");
            this.colorGui = new ig.OverlayGui();
            ig.gui.addGuiElement(this.colorGui);
            for (var key in this.gfx) {
                var cornerGui = new ig.OverlayCornerGui(this.gfx[key]);
                this.cornerGui[ig.OVERLAY_CORNER[key]] = cornerGui;
                ig.gui.addGuiElement(cornerGui);
            }
        },

        deferredUpdateOrder: 400,

        onDeferredUpdate: function () {
            if (this.timer < this.max) {
                this.timer = this.timer + ig.system.actualTick;
                if (this.timer >= this.max) {
                    this.timer = this.max;
                    if (this.colorNew.a == 0) {
                        this.colorNew.r = 0;
                        this.colorNew.g = 0;
                        this.colorNew.b = 0;
                        this.lighter = false;
                    }
                }
            }
            var color = this._getCurrentColor();
            this.colorGui.color = color;
            this.colorGui.lighter = this.lighter;
        },

        onReset: function () {
            this.setColor(0, 0, 0, 0, 0, false);
            for (var key in ig.OVERLAY_CORNER) this.setCorner(key, 0, 0, false);
        },

        setColor: function (r, g, b, a, time, lighter, overMessage) {
            this.colorOld = this._getCurrentColor();
            this.colorNew.r = r;
            this.colorNew.g = g;
            this.colorNew.b = b;
            this.colorNew.a = a;
            this.lighter = lighter || false;
            this.max = time;
            this.timer = 0;
            var zIndex = overMessage ? 1300 : -10;
            if (zIndex != this.colorGui.hook.zIndex) {
                this.colorGui.hook.zIndex = zIndex;
                ig.gui.sortGui();
            }
        },

        setAlpha: function (alpha, time) {
            this.colorOld = this._getCurrentColor();
            this.colorNew.a = alpha;
            this.max = time;
            this.timer = 0;
        },

        setCorner: function (corner, alpha, time, blinkAlpha) {
            corner = typeof corner == "string" ? ig.OVERLAY_CORNER[corner] : corner;
            this.cornerGui[corner].setAlpha(alpha, time, blinkAlpha);
        },

        _getCurrentColor: function () {
            var color = {},
                t = this.max ? (this.timer / this.max).limit(0, 1) : 1,
                key;
            for (key in this.colorOld) color[key] = this.colorOld[key] * (1 - t) + this.colorNew[key] * t;
            return color;
        }
    });

    ig.addGameAddon(function () {
        return ig.overlay = new ig.Overlay();
    });
});
ig.baked = !0;
