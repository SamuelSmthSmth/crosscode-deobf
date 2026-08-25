ig.module("impact.feature.screen-blur.screen-blur").requires("impact.base.game").defines(function() {
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
    var b = Vec2.create(),
        a = Vec3.create();
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
        init: function() {
            this.parent("ScreenBlur");
            this.timer = new ig.WeightTimer(true, 1, ig.TIMER_MODE.BLINK);
            var a = ig.$new("canvas");
            a.width = ig.system.realWidth;
            a.height = ig.system.realHeight;
            this.buffer = a;
            this.context = ig.system.getBufferContext(a);
            this.context.scale(ig.system.contextScale,
                ig.system.contextScale);
            a = ig.$new("canvas");
            a.width = ig.system.realWidth;
            a.height = ig.system.realHeight;
            this.backBuffer = a;
            this.backContext = ig.system.getBufferContext(a);
            this.backContext.scale(ig.system.contextScale, ig.system.contextScale);
            this.firstDraw = true
        },
        setAlpha: function(a) {
            this.maxAlpha = this.minAlpha = a;
            if (a == 1) this.firstDraw = true
        },
        clear: function() {
            this.setAlpha(1)
        },
        clearZooms: function() {
            this.zooms.length = 0;
            this.namedZooms = {}
        },
        addZoom: function(a) {
            if (a.name) {
                this.namedZooms[a.name] && this.zooms.erase(this.namedZooms[a.name]);
                this.namedZooms[a.name] = a
            }
            this.zooms.push(a)
        },
        fadeOutZoom: function(a, b) {
            var e = this.namedZooms[a];
            e && e.setFadeOut(b)
        },
        onPostUpdate: function() {
            this.timer.tick();
            this.repeatTimer = this.repeatTimer - ig.system.tick;
            for (var a = this.zooms.length; a--;)
                if (this.zooms[a].update()) {
                    var b = this.zooms[a];
                    b.name && delete this.namedZooms[b.name];
                    this.zooms.splice(a, 1)
                }
        },
        preDrawOrder: 1E3,
        onPreDraw: function() {
            if (this._getAlpha() < 1 || this.zooms.length) {
                this.systemContext = ig.system.context;
                this.systemBuffer = ig.system.canvas;
                ig.system.context = this.context
            }
        },
        postDrawOrder: 200,
        onPostDraw: function() {
            var a = this._getAlpha();
            if (a < 1 || this.zooms.length) {
                var b = false,
                    e = ig.system.realWidth,
                    f = ig.system.realHeight,
                    g = ig.system.contextWidth,
                    h = ig.system.contextHeight;
                if (a < 1 && this.repeatTimer <= 0) {
                    this.repeatTimer = this.repeatTimer + this.repeatCycle;
                    this.backContext.globalAlpha = this.firstDraw ? 1 : a;
                    this.backContext.drawImage(this.buffer, 0, 0, e, f, 0, 0, g, h);
                    this.backContext.globalAlpha = 1;
                    this.firstDraw = false;
                    b = true
                }
                ig.system.context = this.systemContext;
                ig.system.canvas = this.systemBuffer;
                a < 1 && ig.system.context.drawImage(this.backBuffer, 0, 0, e, f, 0, 0, g, h);
                if (!b) {
                    ig.system.context.globalAlpha = a;
                    ig.system.context.drawImage(this.buffer, 0, 0, e, f, 0, 0, g, h);
                    ig.system.context.globalAlpha = 1
                }
                for (a = 0; a < this.zooms.length; ++a) this.zooms[a].draw(this.buffer, e, f, g, h)
            }
        },
        onReset: function() {
            this.clear();
            this.clearZooms()
        },
        _getAlpha: function() {
            var a = this.timer.get();
            return this.minAlpha * a + this.maxAlpha * (1 - a)
        }
    });
    ig.addGameAddon(function() {
        return ig.screenBlur = new ig.ScreenBlur
    });
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
        init: function(a, b, e, f, g, h, i, j) {
            this.fullTimer = new ig.WeightTimer(true);
            this.repeatTimer = new ig.WeightTimer(true);
            this.config = ig.BLUR_ZOOM_CONFIG[a];
            this.alphaStep = this.config.alphaStart / (this.config.repeat - 1);
            this.name = g || null;
            this.target = h || null;
            this.align = i || ig.ENTITY_ALIGN.CENTER;
            this.offset = j || null;
            this.duration = b;
            this.fadeInTime =
                e;
            this.fadeOutTime = f;
            this.repeatTimer.set(this.config.duration, ig.TIMER_MODE.REPEAT);
            this.state = 0;
            this.fullTimer.set(this.fadeInTime, ig.TIMER_MODE.ONCE)
        },
        update: function() {
            if (this.state == 0 && (!this.fadeInTime || this.fullTimer.done())) {
                this.state = 1;
                this.fullTimer.set(this.duration, ig.TIMER_MODE.ONCE)
            }
            if (this.state == 1 && this.duration != -1 && this.fullTimer.done()) {
                this.state = 2;
                this.fullTimer.set(this.fadeOutTime, ig.TIMER_MODE.ONCE)
            }
            if (this.state == 2 && (!this.fadeOutTime || this.fullTimer.done())) return true;
            this.fullTimer.tick();
            this.repeatTimer.tick();
            return false
        },
        onActionEndDetach: function() {
            this.setFadeOut(this.fadeOutTime)
        },
        setFadeOut: function(a) {
            this.fadeOutTime = a;
            this.state = 2;
            this.fullTimer.set(a, ig.TIMER_MODE.ONCE)
        },
        draw: function(d, c, e, f, g) {
            var h;
            switch (this.state) {
                case 0:
                    h = this.fullTimer.get();
                    break;
                case 1:
                    h = 1;
                    break;
                case 2:
                    h = 1 - this.fullTimer.get()
            }
            var i = this.repeatTimer.get(),
                j = this.config,
                k = 1 + i * j.zoomAdd;
            ig.system.context.globalAlpha = h * i * j.alphaStart;
            for (var l = 0; l < j.repeat; ++l) {
                var o = ig.system.context,
                    m = k,
                    n = this.target,
                    p = this.align,
                    r = this.offset;
                o.save();
                var t = ig.system.contextWidth / 2,
                    q = ig.system.contextHeight / 2;
                if (n) {
                    t = n.getAlignedPos(p, a);
                    r && Vec3.add(t, r);
                    r = ig.system.getScreenFromMapPos(b, t.x, t.y - t.z);
                    t = r.x.limit(0, ig.system.contextWidth);
                    q = r.y.limit(0, ig.system.contextHeight)
                }
                o.translate(t, q);
                o.scale(m, m);
                o.translate(-t, -q);
                ig.system.context.drawImage(d, 0, 0, c, e, 0, 0, f, g);
                ig.system.context.restore();
                ig.system.context.globalAlpha = h * (j.alphaStart - this.alphaStep * (i + l));
                k = k + j.zoomAdd
            }
            ig.system.context.globalAlpha =
                1
        }
    })
});
ig.baked = !0;
