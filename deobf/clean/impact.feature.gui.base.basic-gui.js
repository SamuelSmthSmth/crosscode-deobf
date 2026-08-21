/**
 * impact.feature.gui.base.basic-gui
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.base.basic-gui")`.
 *
 * Provides the most common concrete GUI element types:
 *   - `ig.ImageGui`    — renders a static or frame-animated sprite from an `ig.Image`.
 *   - `ig.ColorGui`    — renders a solid-color (or blend-mode) fill rectangle.
 *   - `ig.SequenceGui` — drives a timeline of GUI-element state transitions and sounds,
 *                        used for cutscene/cinematic sequences.
 *   - `ig.SimpleGui`   — minimal mixin that adds typed `show()`/`hide()` helpers.
 *
 * Also defines:
 *   - `ig.SEQUENCE_MSG` — enum for SequenceGui callback messages.
 */
ig.module("impact.feature.gui.base.basic-gui").requires(
    "impact.feature.gui.gui"
).defines(function () {

    // -------------------------------------------------------------------------
    // ig.ImageGui
    // -------------------------------------------------------------------------

    ig.ImageGui = ig.GuiElementBase.extend({
        /** @type {ig.Image|null} Source image asset. */
        image:    null,
        /** Source rect X offset in the image sheet. */
        offsetX:  0,
        /** Source rect Y offset in the image sheet. */
        offsetY:  0,
        /** Canvas composite/blend mode override (null = "source-over"). */
        renderMode: null,
        flipX: false,
        flipY: false,
        /** If true, pivot was set explicitly — don't override it on load. */
        pivotOverride: false,

        // --- Frame animation state ---
        /** @type {number[]|null} Ordered list of frame indices. */
        frames:    null,
        /** Number of columns in the sprite sheet (for row/col index → src xy). */
        xCount:    0,
        /** Seconds per frame. */
        frameTime: 0,
        /** Accumulated playback time in seconds. */
        timer:     0,
        loop:      false,
        stopped:   true,

        /**
         * @param {ig.Image} [image]
         * @param {number}   [offsetX]  src X
         * @param {number}   [offsetY]  src Y
         * @param {number}   [width]
         * @param {number}   [height]
         */
        init: function (image, offsetX, offsetY, width, height) {
            this.parent();
            if (image) this.setImage(image, offsetX, offsetY, width, height);
        },

        /**
         * Set (or replace) the image source and optionally resize the hook.
         * Registers a load listener so that size/pivot can be auto-set once the
         * image dimensions are known.
         */
        setImage: function (image, offsetX, offsetY, width, height) {
            this.image   = image;
            this.offsetX = offsetX || 0;
            this.offsetY = offsetY || 0;
            this.hook.size.x = width  || 0;
            this.hook.size.y = height || 0;
            this.image.addLoadListener(this);
        },

        /**
         * Configure frame animation.
         * @param {number[]} frames     array of frame indices
         * @param {number}   frameTime  seconds per frame
         * @param {number}   xCount     columns in the sprite sheet
         * @param {boolean}  [loop]     defaults to true
         */
        setAnimation: function (frames, frameTime, xCount, loop) {
            this.loop      = loop !== undefined ? loop : true;
            this.stopped   = false;
            this.frames    = frames;
            this.frameTime = frameTime;
            this.xCount    = xCount;
        },

        /** Restart the frame animation from the beginning. */
        restartAnimation: function () {
            this.timer   = 0;
            this.stopped = false;
        },

        /**
         * Called by `ig.Image` once the image asset has finished loading.
         * Auto-sizes the hook to the image if width/height were not supplied,
         * and centers the pivot.
         */
        onLoadableComplete: function () {
            this.hook.size.x = this.hook.size.x || this.image.width;
            this.hook.size.y = this.hook.size.y || this.image.height;
            this.hook.size.x = Math.min(this.hook.size.x, this.image.width);
            this.hook.size.y = Math.min(this.hook.size.y, this.image.height);
            if (!this.pivotOverride) {
                this.hook.pivot.x = this.hook.size.x / 2;
                this.hook.pivot.y = this.hook.size.y / 2;
            }
        },

        /** Advance the animation timer each frame. */
        update: function () {
            if (this.frames && !this.stopped) {
                this.timer = this.timer + ig.system.actualTick;
            }
        },

        /** Queue the sprite draw command for the current animation frame. */
        updateDrawables: function (renderer) {
            var srcX = 0, srcY = 0;
            if (this.frames) {
                var frameIndex = Math.floor(this.timer / this.frameTime) % this.frames.length;
                // Stop on the last frame when not looping.
                if (frameIndex == this.frames.length - 1 && !this.loop) this.stopped = true;
                srcX = frameIndex % this.xCount * this.hook.size.x;
                srcY = Math.floor(frameIndex / this.xCount) * this.hook.size.y;
            }
            renderer
                .addGfx(
                    this.image,
                    0, 0,
                    this.offsetX + srcX, this.offsetY + srcY,
                    this.hook.size.x, this.hook.size.y,
                    this.flipX, this.flipY
                )
                .setCompositionMode(this.renderMode);
        }
    });

    // -------------------------------------------------------------------------
    // ig.ColorGui
    // -------------------------------------------------------------------------

    ig.ColorGui = ig.GuiElementBase.extend({
        /** CSS color string. */
        color:      null,
        /** Canvas composite/blend mode override (null = "source-over"). */
        renderMode: null,

        /**
         * @param {string} color   CSS color string (e.g. "rgba(0,0,0,0.5)")
         * @param {number} [width]  defaults to ig.system.width
         * @param {number} [height] defaults to ig.system.height
         */
        init: function (color, width, height) {
            this.parent();
            this.color = color;
            this.hook.size.x = width  === undefined ? ig.system.width  : width;
            this.hook.size.y = height === undefined ? ig.system.height : height;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2;
        },

        /** Queue a filled rectangle draw command. Skipped if size is zero. */
        updateDrawables: function (renderer) {
            if (this.hook.size.x != 0 && this.hook.size.y != 0) {
                renderer
                    .addColor(this.color, 0, 0, this.hook.size.x, this.hook.size.y)
                    .setCompositionMode(this.renderMode);
            }
        }
    });

    // -------------------------------------------------------------------------
    // ig.SEQUENCE_MSG  — callback message enum for ig.SequenceGui
    // -------------------------------------------------------------------------

    ig.SEQUENCE_MSG = {
        LABEL_REACHED: 1,  // fired when a named timeline label is passed
        ENDED:         2   // fired when the sequence reaches an `end` entry
    };

    // -------------------------------------------------------------------------
    // ig.SequenceGui
    // -------------------------------------------------------------------------

    /**
     * Drives a data-driven cutscene/cinematic sequence.
     *
     * A sequence consists of:
     *   - `gfx`      — map of name → `ig.Image`
     *   - `gui`      — map of name → `ig.ImageGui` / `ig.ColorGui` (built from JSON descriptors)
     *   - `timeLine` — ordered array of timed entries that trigger state transitions, sounds,
     *                  `goto` jumps, labels, `skipLabel` markers, and `end` sentinels.
     *
     * Usage:
     *   1. Construct with a callback: `new ig.SequenceGui(myCallback)`.
     *   2. Call `initTimeLine(gfxMap, guiDesc, timeLineData)` to build the element tree.
     *   3. Call `start()` to reset and begin playback.
     *   4. The callback receives `(ig.SEQUENCE_MSG.LABEL_REACHED, labelName)` or
     *      `(ig.SEQUENCE_MSG.ENDED, null)` when milestones are reached.
     */
    ig.SequenceGui = ig.GuiElementBase.extend({
        /** Accumulates elapsed seconds (negative = not playing). */
        timer:            -1,
        timeLineIndex:    0,
        gfx:              null,
        gui:              null,
        timeLine:         null,
        /** Labels that have been reached during the current playback. */
        reachedLabels:    [],
        /** The most-recently set skip label (used by `skip()`). */
        currentSkipLabel: null,

        /**
         * @param {Function} [callback]  receives `(messageType, data)` calls
         */
        init: function (callback) {
            this.parent();
            this.callback = callback;
            // Allow subclasses to define gfx/gui/timeLine as prototype properties.
            if (this.timeLine) this.initTimeLine(this.gfx, this.gui, this.timeLine);
        },

        /**
         * Build the child GUI element tree from JSON descriptor maps and start them in HIDDEN.
         * @param {Object} gfxMap        name → ig.Image
         * @param {Object} guiDescMap    name → element descriptor
         * @param {Array}  timeLineData  ordered array of timeline entries
         */
        initTimeLine: function (gfxMap, guiDescMap, timeLineData) {
            this.gfx      = gfxMap;
            this.gui      = guiDescMap;
            this.timeLine = timeLineData;

            for (var key in this.gui) {
                var desc    = this.gui[key];
                var element;
                if (desc.gfx) {
                    // Image-based element.
                    element = desc.src
                        ? new ig.ImageGui(this.gfx[desc.gfx], desc.src.x, desc.src.y, desc.src.w, desc.src.h)
                        : new ig.ImageGui(this.gfx[desc.gfx]);
                    if (desc.anim)       element.setAnimation(desc.anim.frames, desc.anim.time, desc.anim.xCount);
                    if (desc.pos)        element.hook.pos   = desc.pos;
                    if (desc.align)      element.hook.align = desc.align;
                    if (desc.renderMode) element.renderMode = desc.renderMode;
                    if (desc.pivot) {
                        element.hook.pivot  = desc.pivot;
                        element.pivotOverride = true;
                    }
                    if (desc.sound) element.sound = desc.sound;
                    element.flipX = desc.flipX || false;
                    element.flipY = desc.flipY || false;
                } else if (desc.sound) {
                    // Sound-only entry — skip building a visual element.
                    continue;
                } else {
                    // Color fill element.
                    element = new ig.ColorGui(desc.color);
                }
                element.hook.transitions = desc.transitions;
                element.doStateTransition("HIDDEN", true);
                this.addChildGui(element);
                this.gui[key] = element;
            }
        },

        /** Advance the timeline and trigger any entries whose `time` has been reached. */
        update: function () {
            if (this.timer >= 0) {
                this.timer = this.timer + ig.system.actualTick;
                while (
                    this.timeLineIndex < this.timeLine.length &&
                    this.timeLine[this.timeLineIndex].time <= this.timer
                ) {
                    var entry = this.timeLine[this.timeLineIndex];
                    if (entry.gui) {
                        // State transition on a named child element.
                        if (entry.preState) this.gui[entry.gui].doStateTransition(entry.preState, true);
                        if (entry.state)    this.gui[entry.gui].doStateTransition(entry.state);
                        if (entry.sound)    entry.sound.play();
                    } else if (entry.sound) {
                        entry.sound.sound.play(false, entry.sound.sndSettings);
                    } else if (entry.end) {
                        this.end();
                        break;
                    } else if (entry.goto) {
                        this.jumpTo(entry.goto);
                    } else if (entry.label) {
                        this._setLabelReached(entry.label);
                    } else if (entry.skipLabel !== undefined) {
                        this.currentSkipLabel = entry.skipLabel;
                    }
                    this.timeLineIndex++;
                }
            }
        },

        /**
         * Mark a label as reached and fire the callback (once per playback).
         * @param {string} label
         */
        _setLabelReached: function (label) {
            if (this.reachedLabels.indexOf(label) == -1) {
                this.reachedLabels.push(label);
                this.notifyCallback(ig.SEQUENCE_MSG.LABEL_REACHED, label);
            }
        },

        /** Reset all child elements to HIDDEN and restart playback from t=0. */
        start: function () {
            for (var key in this.gui) {
                if (!this.gui[key].sound) this.gui[key].doStateTransition("HIDDEN", true);
            }
            this.overlay           = {};
            this.reachedLabels.length = 0;
            this.currentSkipLabel  = null;
            this.timeLineIndex     = 0;
            this.timer             = 0;
        },

        /** Stop playback and fire the ENDED callback. */
        end: function () {
            this.timeLineIndex = 0;
            this.timer         = -1;
            this.notifyCallback(ig.SEQUENCE_MSG.ENDED);
        },

        /**
         * @param {number} messageType  ig.SEQUENCE_MSG constant
         * @param {*}      [data]
         */
        notifyCallback: function (messageType, data) {
            this.callback && this.callback(messageType, data || null);
        },

        /** Jump to the first timeline `skipLabel` that was most recently set. */
        skip: function () {
            if (this.currentSkipLabel) this.jumpTo(this.currentSkipLabel);
        },

        /**
         * Seek the timeline to the entry with matching `label`.
         * @param {string} labelName
         */
        jumpTo: function (labelName) {
            for (var i = this.timeLine.length; i--;) {
                if (this.timeLine[i].label == labelName) {
                    this.timer         = this.timeLine[i].time;
                    this.timeLineIndex = i;
                    this._setLabelReached(labelName);
                    break;
                }
            }
        },

        /** @returns {boolean} True when the sequence has ended (timer < 0). */
        hasEnded: function () { return this.timer < 0; },

        /**
         * @param {string} label
         * @returns {boolean} True if this label has been reached during current playback.
         */
        isLabelReached: function (label) { return this.reachedLabels.indexOf(label) != -1; }
    });

    // -------------------------------------------------------------------------
    // ig.SimpleGui  — adds typed show()/hide() transitions
    // -------------------------------------------------------------------------

    ig.SimpleGui = ig.GuiElementBase.extend({
        /**
         * Transition to "HIDDEN" state.
         * @param {boolean}  [immediate]
         * @param {number}   [delay]
         */
        hide: function (immediate, delay) {
            this.doStateTransition("HIDDEN", immediate, false, null, delay);
        },
        /**
         * Transition to "DEFAULT" state.
         * @param {boolean}  [immediate]
         * @param {number}   [delay]
         */
        show: function (immediate, delay) {
            this.doStateTransition("DEFAULT", immediate, false, null, delay);
        }
    });
});
