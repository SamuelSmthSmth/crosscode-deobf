/**
 * impact.feature.parallax.parallax
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.parallax.parallax")`.
 *
 * The parallax subsystem:
 *   - `ig.Parallax` — a `JsonLoadable` for `data/parallax/*.json` files that
 *     converts entry/sequence data into GUI element definitions and a
 *     timeline of state transitions.
 *   - `ig.GUI.Parallax` (`ig.ParallaxGui`) — a `SequenceGui` that plays the
 *     parallax timeline, optionally blocking cutscene skip.
 */
ig.module("impact.feature.parallax.parallax")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image")
    .defines(function () {

    /** Loads and converts a parallax JSON definition. */
    ig.Parallax = ig.JsonLoadable.extend({
        cacheType: "Parallax",
        gfx: {},
        gui: {},
        timeLine: [],
        cancelSkip: false,
        skipBlock: false,

        init: function (path) {
            this.parent(path);
        },

        onCacheCleared: function () {
            for (var name in this.gfx) this.gfx[name].decreaseRef();
            for (name in this.gui) this.gui[name].sound && this.gui[name].sound.clearCached();
            delete this.gfx;
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/parallax/", ".json") + ig.getCacheSuffix();
        },

        onload: function (data) {
            if (data.cancelSkip) this.cancelSkip = true;
            if (data.blockSkip) this.skipBlock = true;
            this._convertEntries(data.entries, data.points);
            this._convertSequence(data.sequence);
        },

        /** Build one GUI element definition per parallax entry. */
        _convertEntries: function (entries, points) {
            for (var i = 0; i < entries.length; ++i) {
                var entry = entries[i],
                    guiData = {};
                this.gfx[entry.gfx] || (this.gfx[entry.gfx] = new ig.Image(entry.gfx));
                if (entry.gfx) {
                    guiData.gfx = entry.gfx;
                } else if (entry.color) {
                    guiData.color = entry.color;
                }
                guiData.align = { x: ig.GUI_ALIGN.X_LEFT, y: ig.GUI_ALIGN.Y_TOP };
                if (entry.align) {
                    if (entry.align.x) {
                        var alignValue = ig.GUI_ALIGN_X[entry.align.x];
                        if (!alignValue) throw Error("Unknown x align type '" + entry.align.x + "'");
                        guiData.align.x = alignValue;
                    }
                    if (entry.align.y) {
                        alignValue = ig.GUI_ALIGN_Y[entry.align.y];
                        if (!alignValue) throw Error("Unknown y align type '" + entry.align.y + "'");
                        guiData.align.y = alignValue;
                    }
                }
                guiData.transitions = {
                    HIDDEN: {
                        state: { alpha: 0 },
                        time: 0,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                if (entry.pos) guiData.pos = Vec2.create(entry.pos);
                if (entry.src) {
                    guiData.src = {
                        x: entry.src.x,
                        y: entry.src.y,
                        w: entry.src.w,
                        h: entry.src.h
                    };
                }
                if (entry.sound) {
                    guiData.sound = new ig.Sound(entry.sound, entry.volume, entry.variance);
                    guiData.sndSettings = {
                        speed: entry.speed || 1
                    };
                }
                if (entry.anim) {
                    guiData.anim = {
                        frames: entry.anim.frames,
                        time: entry.anim.time,
                        xCount: entry.anim.xCount
                    };
                }
                if (entry.pivot && (alignValue = points[entry.pivot])) {
                    guiData.pivot = Vec2.create(alignValue);
                    guiData.pos && Vec2.sub(guiData.pivot, guiData.pos);
                }
                guiData.renderMode = entry.renderMode || null;
                guiData.flipX = entry.flipX || false;
                guiData.flipY = entry.flipY || false;
                this.gui[entry.name] = guiData;
            }
        },

        /** Convert the sequence entries into the timeline. */
        _convertSequence: function (sequence) {
            for (var time = 0, currentSpline = KEY_SPLINES.LINEAR, i = 0; i < sequence.length; ++i) {
                var item = sequence[i];
                if (item.wait) {
                    time = time + item.wait * 1;
                } else if (item.keySpline) {
                    currentSpline = KEY_SPLINES[item.keySpline];
                } else if (item["goto"]) {
                    this.timeLine.push({ time: time, "goto": item["goto"] });
                } else if (item.label) {
                    this.timeLine.push({ time: time, label: item.label });
                } else if (item.skipLabel !== void 0) {
                    this.timeLine.push({ time: time, skipLabel: item.skipLabel });
                } else if (item.sound) {
                    this.timeLine.push({ time: time, sound: this.gui[item.sound] });
                } else {
                    var gui = this.gui[item.entry],
                        timelineItem = { gui: item.entry };
                    if (item.reset || !item.reset && !item.move) {
                        var stateName = "STEP" + i + "_PRE",
                            state = {};
                        item.reset && this._copyStateValues(state, item.reset);
                        gui.transitions[stateName] = {
                            state: state,
                            time: 0,
                            timeFunction: currentSpline
                        };
                        timelineItem.preState = stateName;
                    }
                    if (item.move) {
                        stateName = "STEP" + i;
                        state = {};
                        this._copyStateValues(state, item.move);
                        gui.transitions[stateName] = {
                            state: state,
                            time: item.duration * 1,
                            timeFunction: currentSpline
                        };
                        timelineItem.state = stateName;
                    }
                    timelineItem.time = time;
                    this.timeLine.push(timelineItem);
                }
            }
            this.timeLine.push({ time: time, end: true });
        },

        /** Fill a transition state object from raw move/reset values. */
        _copyStateValues: function (state, values) {
            state.offsetX = values.x || 0;
            state.offsetY = values.y || 0;
            if (values.alpha != void 0) state.alpha = values.alpha;
            state.angle = (values.angle || 0) * Math.PI * 2;
            state.scaleX = 1;
            state.scaleY = 1;
            if (values.zoom != void 0) {
                state.scaleX = state.scaleX * values.zoom;
                state.scaleY = state.scaleY * values.zoom;
            }
            if (values.scaleX != void 0) state.scaleX = state.scaleX * values.scaleX;
            if (values.scaleY != void 0) state.scaleY = state.scaleY * values.scaleY;
        }
    });

    /** The GUI that plays a parallax timeline. */
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
                state: { alpha: 0 },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        init: function (settings, parent) {
            this.parent(parent || null);
            this.hook.zIndex = 0;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.parallax = new ig.Parallax(settings.parallax);
            this.parallax.addLoadListener(this);
        },

        clearCached: function () {
            this.parallax && this.parallax.decreaseRef();
        },

        onLoadableComplete: function () {
            this.initTimeLine(
                this.parallax.gfx,
                ig.copy(this.parallax.gui),
                ig.copy(this.parallax.timeLine)
            );
        },

        onAttach: function () {
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
        },

        start: function (keepOnEnd) {
            this.parallax.cancelSkip && sc.model.stopSkip();
            if (this.parallax.skipBlock) sc.model.skipBlock = true;
            this.parent();
            this.keepOnEnd = keepOnEnd || false;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
        },

        end: function () {
            if (this.parallax.skipBlock) sc.model.skipBlock = false;
            this.parent();
            this.keepOnEnd || this.doStateTransition("HIDDEN", false, true);
        }
    });
});
ig.baked = !0;
