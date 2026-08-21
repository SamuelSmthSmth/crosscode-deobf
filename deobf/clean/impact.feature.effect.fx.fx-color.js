/**
 * impact.feature.effect.fx.fx-color
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-color")`.
 *
 * Defines effect steps that animate the color / alpha / scale of the target entity's
 * animState and sprite overlays — without spawning any particle entities.
 *
 * Defines:
 *   ig.EFFECT_ENTRY.FLASH_COLOR   — single-shot alpha flash overlay on the target
 *   ig.EFFECT_ENTRY.BLINK_COLOR   — repeating blink overlay on the target
 *   ig.EFFECT_ENTRY.FADE_COLOR    — fade-in / hold / fade-out overlay on the target
 *   ig.EFFECT_ENTRY.CHANGE_ALPHA  — smoothly transition the target entity's animState.alpha
 *   ig.EFFECT_ENTRY.CHANGE_SCALE  — smoothly transition the target entity's animState.scaleX/Y
 */

ig.module("impact.feature.effect.fx.fx-color")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // =========================================================================
    // ig.EFFECT_ENTRY.FLASH_COLOR
    // =========================================================================
    /**
     * Creates a colour overlay on the target entity that starts at full intensity
     * and fades to zero over `duration` seconds.  An optional `keepDuration` holds
     * the full-intensity flash before the fade begins.
     *
     * The overlay is managed via ig.ColorOverlay / ig.EntityTools.addEntityColorOverlay.
     *
     * Step config fields:
     *   color        {string}   CSS colour string (default "white")
     *   alpha        {number}   peak overlay alpha (0–1, default 1)
     *   duration     {number}   fade-out time in seconds (default 1)
     *   keepDuration {number}   hold time at peak before fading (default 0)
     *   noLighter    {boolean}  use regular "source-over" blending instead of "lighter"
     */
    ig.EFFECT_ENTRY.FLASH_COLOR = ig.EffectStepBase.extend({
        color:        null,
        alpha:        1,
        keepDuration: 0,
        duration:     1,
        lighter:      true,

        _wm: new ig.Config({
            attributes: {
                color:        { _type: "String",  _info: "Color to flash in" },
                alpha:        { _type: "Number",  _info: "Maximum alpha of color flash" },
                duration:     { _type: "Number",  _info: "Duration of color flash" },
                keepDuration: { _type: "Number",  _info: "Duration of showing maximum flash intensity at beginning." },
                noLighter:    { _type: "Boolean", _info: "If true, don't apply lighter color but regular color overlay" }
            }
        }),

        init: function (sheet, cfg) {
            this.color        = cfg.color        || "white";
            this.alpha        = cfg.alpha        || 1;
            this.duration     = cfg.duration     || 1;
            this.keepDuration = cfg.keepDuration || 0;
            this.lighter      = !cfg.noLighter;
            assert(this.duration >= 0);
        },

        getDuration: function () { return this.duration + this.keepDuration; },

        start: function (effectEntity) {
            var spriteIdx = effectEntity.spriteFilter ? effectEntity.spriteFilter[0] : null;
            var overlay   = new ig.ColorOverlay(this.color, 0, spriteIdx, this.lighter);
            if (effectEntity.target && effectEntity.target.animState) {
                ig.EntityTools.addEntityColorOverlay(effectEntity.target, overlay);
            }
            return { duration: this.duration + this.keepDuration, overlay: overlay };
        },

        update: function (effectEntity, timer, duration, runnerData) {
            var weight = timer < this.keepDuration
                ? 1
                : Math.max(0, 1 - (timer - this.keepDuration) / this.duration);
            runnerData.overlay.alpha = weight * this.alpha;
        },

        finish: function (effectEntity, runnerData) {
            runnerData.overlay.clear();
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.BLINK_COLOR
    // =========================================================================
    /**
     * Applies a colour overlay that oscillates between `minAlpha` and `maxAlpha`
     * at the given blink rate for `blinkCount` cycles.
     *
     * Step config fields:
     *   color          {string}   CSS colour
     *   maxAlpha       {number}   peak alpha (default 1)
     *   minAlpha       {number}   trough alpha (default 0)
     *   blinkDuration  {number}   seconds per full blink cycle (min→max→min)
     *   blinkCount     {number}   total cycles; -1 = unlimited (loops forever)
     *   noLighter      {boolean}  use "source-over" blending
     */
    ig.EFFECT_ENTRY.BLINK_COLOR = ig.EffectStepBase.extend({
        color:         null,
        maxAlpha:      1,
        minAlpha:      0,
        blinkDuration: 0.5,
        blinkCount:    1,
        lighter:       true,

        _wm: new ig.Config({
            attributes: {
                color:         { _type: "String",  _info: "Color to blink in" },
                maxAlpha:      { _type: "Number",  _info: "Maximum alpha intensity" },
                minAlpha:      { _type: "Number",  _info: "Minimum alpha intensity" },
                blinkDuration: { _type: "Number",  _info: "Duration of one time flashing back and forth between min and max alpha" },
                blinkCount:    { _type: "Integer", _info: "Number of blinks. -1 if unlimited" },
                noLighter:     { _type: "Boolean", _info: "If true, don't apply lighter color but regular color overlay" }
            }
        }),

        init: function (sheet, cfg) {
            this.color         = cfg.color         || "white";
            this.maxAlpha      = cfg.maxAlpha      || 1;
            this.minAlpha      = cfg.minAlpha      || 0;
            this.blinkDuration = cfg.blinkDuration || 0;
            this.blinkCount    = cfg.blinkCount    || 1;
            this.lighter       = !cfg.noLighter;
        },

        getDuration: function () {
            return this.blinkCount < 0 ? -1 : this.blinkCount * this.blinkDuration;
        },

        start: function (effectEntity) {
            var spriteIdx = effectEntity.spriteFilter ? effectEntity.spriteFilter[0] : null;
            var overlay   = new ig.ColorOverlay(this.color, 0, spriteIdx, this.lighter);
            if (effectEntity.target && effectEntity.target.animState) {
                ig.EntityTools.addEntityColorOverlay(effectEntity.target, overlay);
            }
            return { duration: this.getDuration(), overlay: overlay };
        },

        update: function (effectEntity, timer, duration, runnerData) {
            // ramp to zero at the very start and end of the run (half-blink fade)
            var base = this.minAlpha;
            if (timer < this.blinkDuration / 2 ||
                (duration > 0 && duration - timer < this.blinkDuration / 2)) {
                base = 0;
            }

            // compute phase position within one cycle (0–1), map to 0–1 triangle wave
            var phase = (timer % this.blinkDuration) / this.blinkDuration;
            var wave  = (phase > 0.5 ? 1 - phase : phase) * 2; // triangle 0→1→0

            runnerData.overlay.alpha = base * (1 - wave) + this.maxAlpha * wave;
        },

        /**
         * When cancelled (effect stopped early), wait until the end of the
         * current blink cycle so the fade-out is complete.
         * @returns {number} remaining seconds until end of cycle
         */
        cancel: function (effectEntity, timer) {
            return Math.ceil(timer / this.blinkDuration) * this.blinkDuration;
        },

        finish: function (effectEntity, runnerData) {
            runnerData.overlay.clear();
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.FADE_COLOR
    // =========================================================================
    /**
     * Applies a colour overlay that fades in, holds, then fades out.
     * When cancelled (effect looping ends), the fade-out section plays from
     * wherever the timer currently is.
     *
     * Step config fields:
     *   color     {string}   CSS colour
     *   alpha     {number}   peak alpha (default 1)
     *   fadeIn    {number}   fade-in time in seconds
     *   fadeOut   {number}   fade-out time in seconds
     *   duration  {number}   hold time at peak; -1 = hold forever (loop step)
     *   noLighter {boolean}  use "source-over" blending
     */
    ig.EFFECT_ENTRY.FADE_COLOR = ig.EffectStepBase.extend({
        color:    null,
        alpha:    1,
        fadeIn:   0,
        fadeOut:  0,
        duration: 0,
        lighter:  true,

        _wm: new ig.Config({
            attributes: {
                color:    { _type: "String",  _info: "Color to blink in" },
                alpha:    { _type: "Number",  _info: "Maximum alpha intensity" },
                fadeIn:   { _type: "Number",  _info: "Fade in duration of color" },
                fadeOut:  { _type: "Number",  _info: "Fade out duration of color" },
                duration: { _type: "Number",  _info: "Duration of color display. -1 = forever" },
                noLighter: { _type: "Boolean", _info: "If true, don't apply lighter color but regular color overlay" }
            }
        }),

        init: function (sheet, cfg) {
            this.color    = cfg.color    || "white";
            this.alpha    = cfg.alpha    || 1;
            this.fadeIn   = cfg.fadeIn   || 0;
            this.fadeOut  = cfg.fadeOut  || 0;
            this.duration = cfg.duration || 0;
            this.lighter  = !cfg.noLighter;
        },

        getDuration: function () {
            return this.duration < 0 ? -1 : this.fadeIn + this.duration + this.fadeOut;
        },

        start: function (effectEntity) {
            var spriteIdx = effectEntity.spriteFilter ? effectEntity.spriteFilter[0] : null;
            var overlay   = new ig.ColorOverlay(this.color, 0, spriteIdx, this.lighter);
            if (effectEntity.target && effectEntity.target.animState) {
                ig.EntityTools.addEntityColorOverlay(effectEntity.target, overlay, effectEntity.noMultiGroup);
            }
            return { duration: this.getDuration(), overlay: overlay };
        },

        update: function (effectEntity, timer, duration, runnerData) {
            var weight = 1;
            if (duration > 0 && duration - timer < this.fadeOut) {
                weight = (duration - timer) / this.fadeOut;  // fade-out phase
            } else if (timer < this.fadeIn) {
                weight = timer / this.fadeIn;               // fade-in phase
            }
            runnerData.overlay.alpha = this.alpha * weight;
        },

        /**
         * When the effect stops, set duration to (current time + fadeOut) so the
         * overlay fades out rather than cutting off abruptly.
         * @returns {number} additional seconds for the fade-out
         */
        cancel: function (effectEntity, timer) {
            return timer + this.fadeOut;
        },

        finish: function (effectEntity, runnerData) {
            runnerData.overlay.clear();
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.CHANGE_ALPHA
    // =========================================================================
    /**
     * Transitions the target entity's animState.alpha to a new value over `duration` seconds.
     *
     * Step config fields:
     *   alpha    {number}   target alpha value (0–1)
     *   duration {number}   transition time (0 = instant)
     */
    ig.EFFECT_ENTRY.CHANGE_ALPHA = ig.EffectStepBase.extend({
        alpha:    0,
        duration: 0,

        _wm: new ig.Config({
            attributes: {
                alpha:    { _type: "Number", _info: "Target alpha value" },
                duration: { _type: "Number", _info: "Transition time to target alpha value" }
            }
        }),

        init: function (sheet, cfg) {
            this.alpha    = cfg.alpha    || 0;
            this.duration = cfg.duration || 0;
        },

        getDuration: function () { return this.duration; },

        start: function (effectEntity) {
            if (!effectEntity.target || !effectEntity.target.animState) return;
            if (this.duration === 0) {
                // instant: apply immediately, no runner needed
                effectEntity.target.animState.alpha = this.alpha;
            } else {
                return { duration: this.duration, startAlpha: effectEntity.target.animState.alpha };
            }
        },

        update: function (effectEntity, timer, duration, runnerData) {
            if (!effectEntity.target || !effectEntity.target.animState) return;
            var t = Math.min(1, timer / duration);
            effectEntity.target.animState.alpha = runnerData.startAlpha * (1 - t) + this.alpha * t;
        },

        finish: function (effectEntity) {
            if (effectEntity.target && effectEntity.target.animState) {
                effectEntity.target.animState.alpha = this.alpha;
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.CHANGE_SCALE
    // =========================================================================
    /**
     * Transitions the target entity's animState.scaleX and scaleY to new values.
     *
     * Step config fields:
     *   scaleX   {number}         target X scale (default 1)
     *   scaleY   {number}         target Y scale (default 1)
     *   duration {number}         transition time (0 = instant)
     *   spline   {KEY_SPLINES key} easing curve (default LINEAR)
     */
    ig.EFFECT_ENTRY.CHANGE_SCALE = ig.EffectStepBase.extend({
        scaleX:   0,
        scaleY:   0,
        duration: 0,
        spline:   null,

        _wm: new ig.Config({
            attributes: {
                scaleX:   { _type: "Number", _info: "Target scale X value", _default: 1 },
                scaleY:   { _type: "Number", _info: "Target scale Y value", _default: 1 },
                duration: { _type: "Number", _info: "Transition time to target scale value" },
                spline:   { _type: "String", _info: "Spline for transition", _optional: true, _select: KEY_SPLINES }
            }
        }),

        init: function (sheet, cfg) {
            this.scaleX   = cfg.scaleX   || 0;
            this.scaleY   = cfg.scaleY   || 0;
            this.duration = cfg.duration || 0;
            this.spline   = KEY_SPLINES[cfg.spline || "LINEAR"];
        },

        getDuration: function () { return this.duration; },

        start: function (effectEntity) {
            if (!effectEntity.target || !effectEntity.target.animState) return;
            if (this.duration === 0) {
                effectEntity.target.animState.scaleX = this.scaleX;
                effectEntity.target.animState.scaleY = this.scaleY;
            } else {
                return {
                    duration:    this.duration,
                    startScaleX: effectEntity.target.animState.scaleX,
                    startScaleY: effectEntity.target.animState.scaleY
                };
            }
        },

        update: function (effectEntity, timer, duration, runnerData) {
            if (!effectEntity.target || !effectEntity.target.animState) return;
            var t = this.spline.get(Math.min(1, timer / duration));
            effectEntity.target.animState.scaleX = runnerData.startScaleX * (1 - t) + this.scaleX * t;
            effectEntity.target.animState.scaleY = runnerData.startScaleY * (1 - t) + this.scaleY * t;
        },

        finish: function (effectEntity) {
            if (effectEntity.target && effectEntity.target.animState) {
                effectEntity.target.animState.scaleX = this.scaleX;
                effectEntity.target.animState.scaleY = this.scaleY;
            }
        }
    });

});
