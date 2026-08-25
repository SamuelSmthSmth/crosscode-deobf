ig.module("impact.feature.parallax.parallax").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image").defines(function() {
    ig.Parallax = ig.JsonLoadable.extend({
        cacheType: "Parallax",
        gfx: {},
        gui: {},
        timeLine: [],
        cancelSkip: false,
        skipBlock: false,
        init: function(b) {
            this.parent(b)
        },
        onCacheCleared: function() {
            for (var b in this.gfx) this.gfx[b].decreaseRef();
            for (b in this.gui) this.gui[b].sound && this.gui[b].sound.clearCached();
            delete this.gfx
        },
        getJsonPath: function() {
            return ig.root +
                this.path.toPath("data/parallax/", ".json") + ig.getCacheSuffix()
        },
        onload: function(b) {
            if (b.cancelSkip) this.cancelSkip = true;
            if (b.blockSkip) this.skipBlock = true;
            this._convertEntries(b.entries, b.points);
            this._convertSequence(b.sequence)
        },
        _convertEntries: function(b, a) {
            for (var d = 0; d < b.length; ++d) {
                var c = b[d],
                    e = {};
                this.gfx[c.gfx] || (this.gfx[c.gfx] = new ig.Image(c.gfx));
                if (c.gfx) e.gfx = c.gfx;
                else if (c.color) e.color = c.color;
                e.align = {
                    x: ig.GUI_ALIGN.X_LEFT,
                    y: ig.GUI_ALIGN.Y_TOP
                };
                if (c.align) {
                    if (c.align.x) {
                        var f = ig.GUI_ALIGN_X[c.align.x];
                        if (!f) throw Error("Unknown x align type '" + c.align.x + "'");
                        e.align.x = f
                    }
                    if (c.align.y) {
                        f = ig.GUI_ALIGN_Y[c.align.y];
                        if (!f) throw Error("Unknown y align type '" + c.align.y + "'");
                        e.align.y = f
                    }
                }
                e.transitions = {
                    HIDDEN: {
                        state: {
                            alpha: 0
                        },
                        time: 0,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                if (c.pos) e.pos = Vec2.create(c.pos);
                if (c.src) e.src = {
                    x: c.src.x,
                    y: c.src.y,
                    w: c.src.w,
                    h: c.src.h
                };
                if (c.sound) {
                    e.sound = new ig.Sound(c.sound, c.volume, c.variance);
                    e.sndSettings = {
                        speed: c.speed || 1
                    }
                }
                if (c.anim) e.anim = {
                    frames: c.anim.frames,
                    time: c.anim.time,
                    xCount: c.anim.xCount
                };
                if (c.pivot)
                    if (f = a[c.pivot]) {
                        e.pivot = Vec2.create(f);
                        e.pos && Vec2.sub(e.pivot, e.pos)
                    } e.renderMode = c.renderMode || null;
                e.flipX = c.flipX || false;
                e.flipY = c.flipY || false;
                this.gui[c.name] = e
            }
        },
        _convertSequence: function(b) {
            for (var a = 0, d = KEY_SPLINES.LINEAR, c = 0; c < b.length; ++c) {
                var e = b[c];
                if (e.wait) a = a + e.wait * 1;
                else if (e.keySpline) d = KEY_SPLINES[e.keySpline];
                else if (e["goto"]) this.timeLine.push({
                    time: a,
                    "goto": e["goto"]
                });
                else if (e.label) this.timeLine.push({
                    time: a,
                    label: e.label
                });
                else if (e.skipLabel !==
                    void 0) this.timeLine.push({
                    time: a,
                    skipLabel: e.skipLabel
                });
                else if (e.sound) this.timeLine.push({
                    time: a,
                    sound: this.gui[e.sound]
                });
                else {
                    var f = this.gui[e.entry],
                        g = {
                            gui: e.entry
                        };
                    if (e.reset || !e.reset && !e.move) {
                        var h = "STEP" + c + "_PRE",
                            i = {};
                        e.reset && this._copyStateValues(i, e.reset);
                        f.transitions[h] = {
                            state: i,
                            time: 0,
                            timeFunction: d
                        };
                        g.preState = h
                    }
                    if (e.move) {
                        h = "STEP" + c;
                        i = {};
                        this._copyStateValues(i, e.move);
                        f.transitions[h] = {
                            state: i,
                            time: e.duration * 1,
                            timeFunction: d
                        };
                        g.state = h
                    }
                    g.time = a;
                    this.timeLine.push(g)
                }
            }
            this.timeLine.push({
                time: a,
                end: true
            })
        },
        _copyStateValues: function(b, a) {
            b.offsetX = a.x || 0;
            b.offsetY = a.y || 0;
            if (a.alpha != void 0) b.alpha = a.alpha;
            b.angle = (a.angle || 0) * Math.PI * 2;
            b.scaleX = 1;
            b.scaleY = 1;
            if (a.zoom != void 0) {
                b.scaleX = b.scaleX * a.zoom;
                b.scaleY = b.scaleY * a.zoom
            }
            if (a.scaleX != void 0) b.scaleX = b.scaleX * a.scaleX;
            if (a.scaleY != void 0) b.scaleY = b.scaleY * a.scaleY
        }
    });
    ig.GUI.Parallax = ig.ParallaxGui = ig.SequenceGui.extend({
        parallax: null,
        keepOnEnd: false,
        _wm: new ig.Config({
            attributes: {
                parallax: {
                    _type: "String",
                    _info: "Parallax to show",
                    _select: "parallax"
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function(b, a) {
            this.parent(a || null);
            this.hook.zIndex = 0;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.parallax = new ig.Parallax(b.parallax);
            this.parallax.addLoadListener(this)
        },
        clearCached: function() {
            this.parallax && this.parallax.decreaseRef()
        },
        onLoadableComplete: function() {
            this.initTimeLine(this.parallax.gfx, ig.copy(this.parallax.gui),
                ig.copy(this.parallax.timeLine))
        },
        onAttach: function() {
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        start: function(b) {
            this.parallax.cancelSkip && sc.model.stopSkip();
            if (this.parallax.skipBlock) sc.model.skipBlock = true;
            this.parent();
            this.keepOnEnd = b || false;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        end: function() {
            if (this.parallax.skipBlock) sc.model.skipBlock = false;
            this.parent();
            this.keepOnEnd || this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;
