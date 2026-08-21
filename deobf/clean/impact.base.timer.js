/**
 * impact.base.timer
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.base.timer")`.
 *
 * Contains two classes:
 *   - `ig.Timer`       — a wall-clock stopwatch driven by the global `ig.Timer.time`,
 *                        with pause/resume and a progress "weight" (0..1).
 *   - `ig.WeightTimer` — a configurable progress timer that can count once, repeat,
 *                        blink, or pulse (sine), used for animations/effects.
 * Also defines the global `ig.Timer.time` clock and `ig.TIMER_MODE` enum.
 */
ig.module("impact.base.timer").defines(function () {

    /**
     * Measures elapsed seconds against the global clock `ig.Timer.time`.
     * `delta()` returns how far past the `target` the timer is; `weight()`
     * returns the normalized 0..1 progress toward the target.
     */
    ig.Timer = ig.Class.extend({
        target: 0,   // seconds to count down to (0 = count up indefinitely)
        base: 0,     // clock value when the timer was started / last set
        last: 0,     // clock value at the last tick or stop (used while paused)
        stopped: false,

        /**
         * @param {number} [target] seconds until the timer "finishes" (delta() >= 0)
         */
        init: function (target) {
            this.last = this.base = ig.Timer.time;
            this.target = target || 0;
        },

        /**
         * Restart the timer.
         * @param {number} [target]
         * @param {boolean} [compensate] if true, preserve the elapsed fraction when
         *        the target changes, instead of resetting to the start.
         */
        set: function (target, compensate) {
            if (compensate && this.target > 0) {
                // Keep the same relative progress (0..1) into the new target.
                var elapsedFactor = 1 + Math.min(0, this.delta() / this.target);
                this.base = ig.Timer.time - target * elapsedFactor;
            } else {
                this.base = ig.Timer.time;
            }
            this.target = target || 0;
        },

        /**
         * Rewinds the timer so the fraction already elapsed is "un-done".
         * Used to reverse a timed transition.
         */
        reverseRelativeDelta: function () {
            var remainingFactor = Math.min(1, -this.delta() / this.target);
            this.base = ig.Timer.time - this.target * remainingFactor;
        },

        stop: function () {
            if (!this.stopped) {
                this.stopped = true;
                this.last = ig.Timer.time; // freeze elapsed time
            }
        },

        resume: function () {
            if (this.stopped) {
                this.stopped = false;
                this.base = ig.Timer.time - (this.last - this.base);
                this.last = ig.Timer.time;
            }
        },

        reset: function () {
            this.base = ig.Timer.time;
            this.stopped = false;
        },

        /**
         * @returns {number} seconds elapsed since the last tick (0 while stopped).
         */
        tick: function () {
            if (this.stopped) return 0;
            var stepSeconds = ig.Timer.time - this.last;
            this.last = ig.Timer.time;
            return stepSeconds;
        },

        /**
         * Normalized 0..1 progress toward the target (1 = finished, 0 = just started).
         */
        weight: function () {
            return Math.max(
                0,
                (this.target - ((this.stopped ? this.last : ig.Timer.time) - this.base)) / this.target
            );
        },

        /**
         * Seconds past the target (negative while still counting down).
         */
        delta: function () {
            return (this.stopped ? this.last : ig.Timer.time) - this.base - this.target;
        },
    });

    // --- global clock state -------------------------------------------------
    ig.Timer._last = 0;        // raw Date.now() of the previous step
    ig.Timer.time = 0;         // accumulated game time in seconds (scaled)
    ig.Timer.timeScale = 1;    // speed multiplier
    ig.Timer.maxStep = 1 / 30; // clamp to avoid huge jumps (e.g. after a tab pause)

    /**
     * Advance the global clock. Called once per frame by the game loop.
     */
    ig.Timer.step = function () {
        var now = Date.now();
        ig.Timer.time = ig.Timer.time +
            Math.min((now - ig.Timer._last) / 1000, ig.Timer.maxStep) * ig.Timer.timeScale;
        ig.Timer._last = now;
    };

    /**
     * Behaviour modes for ig.WeightTimer.get().
     */
    ig.TIMER_MODE = {
        ONCE: 0,       // runs to duration, then holds at 1
        REPEAT: 1,     // wraps around to 0
        BLINK: 2,      // 0..1..0 triangle wave
        SINUS: 3,      // sine wave
        SINUS_RND: 4,  // sine wave with a random starting sign
    };

    /**
     * A progress timer used to drive weights (0..1) for animations/effects.
     */
    ig.WeightTimer = ig.Class.extend({
        duration: 0,
        timer: 0,
        actualTick: false,          // if true, uses unscaled ig.system.actualTick
        mode: ig.TIMER_MODE.ONCE,
        repeatCount: 0,
        _rndBool: false,            // random sign for SINUS_RND

        /**
         * @param {boolean} [actualTick]
         * @param {number}  [duration]
         * @param {number}  [mode]
         */
        init: function (actualTick, duration, mode) {
            this.actualTick = actualTick || false;
            this.set(duration, mode);
        },

        set: function (duration, mode) {
            this.duration = duration;
            this.mode = mode || ig.TIMER_MODE.ONCE;
            this.repeatCount = this.timer = 0;
            if (this.mode == ig.TIMER_MODE.SINUS_RND) {
                this._rndBool = Math.random() >= 0.5;
            }
        },

        getRemainingTime: function () {
            return this.duration - this.timer;
        },

        setRemainingTime: function (remainingTime) {
            this.timer = this.duration - remainingTime;
            if (this.timer < 0) this.timer = 0;
        },

        /**
         * Advance the timer by one frame's delta.
         */
        tick: function () {
            if (this.duration) {
                this.timer = this.timer + (this.actualTick ? ig.system.actualTick : ig.system.tick);
                if (this.timer >= this.duration) {
                    this.timer = this.mode ? this.timer % this.duration : this.duration;
                    if (this.mode) this.repeatCount++;
                    else this.repeatCount = 1;
                }
            }
        },

        /**
         * True once the timer has completed (a ONCE timer that reached the end).
         */
        done: function () {
            return !this.duration || (!this.mode && this.timer >= this.duration);
        },

        getTimePassed: function () {
            return this.timer;
        },

        /**
         * The current weight (0..1) shaped by the timer mode.
         */
        get: function () {
            if (this.duration) {
                var weight = this.timer / this.duration;
                if (this.mode == ig.TIMER_MODE.BLINK) {
                    weight = (weight < 0.5 ? weight : 1 - weight) * 2;
                }
                if (this.mode == ig.TIMER_MODE.SINUS) {
                    weight = Math.sin(Math.PI * 2 * weight);
                }
                if (this.mode == ig.TIMER_MODE.SINUS_RND) {
                    weight = Math.sin(Math.PI * 2 * weight) * (this._rndBool ? -1 : 1);
                }
                return weight;
            }
            return 1;
        },

        getTotalWeight: function () {
            return this.timer / this.duration;
        },

        hasRepeated: function () {
            return this.mode && this.repeatCount;
        },

        getRepeatCount: function () {
            return this.repeatCount;
        },

        /**
         * For BLINK mode: true once past the halfway point (the "declining" phase).
         */
        onBlinkDecline: function () {
            return this.timer / this.duration >= 0.5;
        },
    });
});
