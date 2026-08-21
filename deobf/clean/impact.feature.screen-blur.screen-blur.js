/**
 * impact.feature.screen-blur.screen-blur
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.screen-blur.screen-blur")`.
 *
 * `ig.screenBlur` add-on: blurs the game by drawing the frame buffer with
 * reduced alpha (optionally over a "ghost" back buffer for a repeating
 * trail), and supports additive "zoom blurs" that scale the frame around a
 * focus point (`ig.ZoomBlurHandle`).
 */
ig.module("impact.feature.screen-blur.screen-blur")
    .requires("impact.base.game")
    .defines(function () {

    ig.BLUR_ZOOM_CONFIG = {
        LIGHTEST: {
            zoomAdd: 0.02,
            duration: 0.5,
            repeat: 3,
            alphaStart: 0.2
        },
        LIGHTER: {
            zoomAdd: 0.025,
            duration: 0.5,
            repeat: 3,
            alphaStart: 0.3
        },
        LIGHT: {
            zoomAdd: 0.05,
            duration: 0.5,
            repeat: 3,
            alphaStart: 0.5
        },
        MEDIUM: {
            zoomAdd: 0.15,
            duration: 0.1,
            repeat: 5,
            alphaStart: 0.3
        },
        SLOW_INTENSE: {
            zoomAdd: 0.15,
            duration: 0.5,
            repeat: 5,
            alphaStart: 0.3
        },
        STATIC_LIGHT: {
            zoomAdd: 0.05,
            duration: 0,
            repeat: 3,
            alphaStart: 0.5
        }
    };

    var scratchVec2 = Vec2.create(),
        scratchVec3 = Vec3.create();

    ig.ScreenBlur = ig.GameAddon.extend({
        buffer: null,
        context: null,
        backBuffer: null,
        backContext: null,
        systemBuffer: null,
        systemContext: null,
        minAlpha: 1,
        maxAlpha: 1,
        repeatTimer: 0,
        repeatCycle: 0,
        firstDraw: false,
        timer: null,
        zooms: [],
        namedZooms: {},

        init: function () {
            this.parent("ScreenBlur");
            this.timer = new ig.WeightTimer(true, 1, ig.TIMER_MODE.BLINK);
            var canvas = ig.$new("canvas");
            canvas.width = ig.system.realWidth;
            canvas.height = ig.system.realHeight;
            this.buffer = canvas;
            this.context = ig.system.getBufferContext(canvas);
            this.context.scale(ig.system.contextScale, ig.system.contextScale);
            canvas = ig.$new("canvas");
            canvas.width = ig.system.realWidth;
            canvas.height = ig.system.realHeight;
            this.backBuffer = canvas;
            this.backContext = ig.system.getBufferContext(canvas);
            this.backContext.scale(ig.system.contextScale, ig.system.contextScale);
            this.firstDraw = true;
        },

        setAlpha: function (alpha) {
            this.maxAlpha = this.minAlpha = alpha;
            if (alpha == 1) this.firstDraw = true;
        },

        clear: function () {
            this.setAlpha(1);
        },

        clearZooms: function () {
            this.zooms.length = 0;
            this.namedZooms = {};
        },

        addZoom: function (handle) {
            if (handle.name) {
                this.namedZooms[handle.name] && this.zooms.erase(this.namedZooms[handle.name]);
                this.namedZooms[handle.name] = handle;
            }
            this.zooms.push(handle);
        },

        fadeOutZoom: function (name, time) {
            var handle = this.namedZooms[name];
            handle && handle.setFadeOut(time);
        },

        onPostUpdate: function () {
            this.timer.tick();
            this.repeatTimer = this.repeatTimer - ig.system.tick;
            for (var i = this.zooms.length; i--;)
                if (this.zooms[i].update()) {
                    var handle = this.zooms[i];
                    handle.name && delete this.namedZooms[handle.name];
                    this.zooms.splice(i, 1);
                }
        },

        preDrawOrder: 1E3,

        /** Redirect the game's context to the blur buffer. */
        onPreDraw: function () {
            if (this._getAlpha() < 1 || this.zooms.length) {
                this.systemContext = ig.system.context;
                this.systemBuffer = ig.system.canvas;
                ig.system.context = this.context;
            }
        },

        postDrawOrder: 200,

        /** Composite the blur buffer back (with the ghost trail when fading). */
        onPostDraw: function () {
            var alpha = this._getAlpha();
            if (alpha < 1 || this.zooms.length) {
                var updated = false,
                    realW = ig.system.realWidth,
                    realH = ig.system.realHeight,
                    ctxW = ig.system.contextWidth,
                    ctxH = ig.system.contextHeight;
                if (alpha < 1 && this.repeatTimer <= 0) {
                    this.repeatTimer = this.repeatTimer + this.repeatCycle;
                    this.backContext.globalAlpha = this.firstDraw ? 1 : alpha;
                    this.backContext.drawImage(this.buffer, 0, 0, realW, realH, 0, 0, ctxW, ctxH);
                    this.backContext.globalAlpha = 1;
                    this.firstDraw = false;
                    updated = true;
                }
                ig.system.context = this.systemContext;
                ig.system.canvas = this.systemBuffer;
                alpha < 1 && ig.system.context.drawImage(this.backBuffer, 0, 0, realW, realH, 0, 0, ctxW, ctxH);
                if (!updated) {
                    ig.system.context.globalAlpha = alpha;
                    ig.system.context.drawImage(this.buffer, 0, 0, realW, realH, 0, 0, ctxW, ctxH);
                    ig.system.context.globalAlpha = 1;
                }
                for (alpha = 0; alpha < this.zooms.length; ++alpha) this.zooms[alpha].draw(this.buffer, realW, realH, ctxW, ctxH);
            }
        },

        onReset: function () {
            this.clear();
            this.clearZooms();
        },

        _getAlpha: function () {
            var t = this.timer.get();
            return this.minAlpha * t + this.maxAlpha * (1 - t);
        }
    });

    ig.addGameAddon(function () {
        return ig.screenBlur = new ig.ScreenBlur();
    });

    /**
     * One zoom-blur effect: repeatedly draws the frame buffer scaled up
     * around a focus point (or screen center) with fading alpha.
     */
    ig.ZoomBlurHandle = ig.Class.extend({
        name: null,
        config: null,
        alphaStep: 0,
        fullTimer: null,
        repeatTimer: null,
        fadeInTime: 0,
        duration: 0,
        fadeOutTime: 0,
        target: null,
        align: 0,
        offset: null,
        state: 0,

        init: function (zoomType, duration, fadeIn, fadeOut, name, target, align, offset) {
            this.fullTimer = new ig.WeightTimer(true);
            this.repeatTimer = new ig.WeightTimer(true);
            this.config = ig.BLUR_ZOOM_CONFIG[zoomType];
            this.alphaStep = this.config.alphaStart / (this.config.repeat - 1);
            this.name = name || null;
            this.target = target || null;
            this.align = align || ig.ENTITY_ALIGN.CENTER;
            this.offset = offset || null;
            this.duration = duration;
            this.fadeInTime = fadeIn;
            this.fadeOutTime = fadeOut;
            this.repeatTimer.set(this.config.duration, ig.TIMER_MODE.REPEAT);
            this.state = 0;
            this.fullTimer.set(this.fadeInTime, ig.TIMER_MODE.ONCE);
        },

        /** Advance the state machine (fade in -> sustain -> fade out); true when done. */
        update: function () {
            if (this.state == 0 && (!this.fadeInTime || this.fullTimer.done())) {
                this.state = 1;
                this.fullTimer.set(this.duration, ig.TIMER_MODE.ONCE);
            }
            if (this.state == 1 && this.duration != -1 && this.fullTimer.done()) {
                this.state = 2;
                this.fullTimer.set(this.fadeOutTime, ig.TIMER_MODE.ONCE);
            }
            if (this.state == 2 && (!this.fadeOutTime || this.fullTimer.done())) return true;
            this.fullTimer.tick();
            this.repeatTimer.tick();
            return false;
        },

        onActionEndDetach: function () {
            this.setFadeOut(this.fadeOutTime);
        },

        setFadeOut: function (time) {
            this.fadeOutTime = time;
            this.state = 2;
            this.fullTimer.set(time, ig.TIMER_MODE.ONCE);
        },

        /** Draw the zoom-blurred frame around the focus point. */
        draw: function (buffer, realW, realH, ctxW, ctxH) {
            var alpha;
            switch (this.state) {
                case 0:
                    alpha = this.fullTimer.get();
                    break;
                case 1:
                    alpha = 1;
                    break;
                case 2:
                    alpha = 1 - this.fullTimer.get();
            }
            var repeat = this.repeatTimer.get(),
                config = this.config,
                zoom = 1 + repeat * config.zoomAdd;
            ig.system.context.globalAlpha = alpha * repeat * config.alphaStart;
            for (var i = 0; i < config.repeat; ++i) {
                var ctx = ig.system.context,
                    scale = zoom,
                    target = this.target,
                    align = this.align,
                    offset = this.offset;
                ctx.save();
                var focusX = ig.system.contextWidth / 2,
                    focusY = ig.system.contextHeight / 2;
                if (target) {
                    focusX = target.getAlignedPos(align, scratchVec3);
                    offset && Vec3.add(focusX, offset);
                    offset = ig.system.getScreenFromMapPos(scratchVec2, focusX.x, focusX.y - focusX.z);
                    focusX = offset.x.limit(0, ig.system.contextWidth);
                    focusY = offset.y.limit(0, ig.system.contextHeight);
                }
                ctx.translate(focusX, focusY);
                ctx.scale(scale, scale);
                ctx.translate(-focusX, -focusY);
                ig.system.context.drawImage(buffer, 0, 0, realW, realH, 0, 0, ctxW, ctxH);
                ig.system.context.restore();
                ig.system.context.globalAlpha = alpha * (config.alphaStart - this.alphaStep * (repeat + i));
                zoom = zoom + config.zoomAdd;
            }
            ig.system.context.globalAlpha = 1;
        }
    });
});
ig.baked = !0;
