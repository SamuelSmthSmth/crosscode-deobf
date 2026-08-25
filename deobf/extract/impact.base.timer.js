ig.module("impact.base.timer").defines(function() {
        ig.Timer = ig.Class.extend({
            target: 0,
            base: 0,
            last: 0,
            stopped: false,
            init: function(a) {
                this.last = this.base = ig.Timer.time;
                this.target = a || 0
            },
            set: function(a, b) {
                if (b && this.target > 0) {
                    var c = 1 + Math.min(0, this.delta() / this.target);
                    this.base = ig.Timer.time - a * c
                } else this.base = ig.Timer.time;
                this.target = a || 0
            },
            reverseRelativeDelta: function() {
                var a = Math.min(1, -this.delta() / this.target);
                this.base = ig.Timer.time - this.target * a
            },
            stop: function() {
                if (!this.stopped) {
                    this.stopped = true;
                    this.last = ig.Timer.time
                }
            },
            resume: function() {
                if (this.stopped) {
                    this.stopped = false;
                    this.base = ig.Timer.time - (this.last -
                        this.base);
                    this.last = ig.Timer.time
                }
            },
            reset: function() {
                this.base = ig.Timer.time;
                this.stopped = false
            },
            tick: function() {
                if (this.stopped) return 0;
                var a = ig.Timer.time - this.last;
                this.last = ig.Timer.time;
                return a
            },
            weight: function() {
                return Math.max(0, (this.target - ((this.stopped ? this.last : ig.Timer.time) - this.base)) / this.target)
            },
            delta: function() {
                return (this.stopped ? this.last : ig.Timer.time) - this.base - this.target
            }
        });
        ig.Timer._last = 0;
        ig.Timer.time = 0;
        ig.Timer.timeScale = 1;
        ig.Timer.maxStep = 1 / 30;
        ig.Timer.step = function() {
            var a =
                Date.now();
            ig.Timer.time = ig.Timer.time + Math.min((a - ig.Timer._last) / 1E3, ig.Timer.maxStep) * ig.Timer.timeScale;
            ig.Timer._last = a
        };
        ig.TIMER_MODE = {
            ONCE: 0,
            REPEAT: 1,
            BLINK: 2,
            SINUS: 3,
            SINUS_RND: 4
        };
        ig.WeightTimer = ig.Class.extend({
            duration: 0,
            timer: 0,
            actualTick: false,
            mode: ig.TIMER_MODE.ONCE,
            repeatCount: 0,
            _rndBool: false,
            init: function(a, b, c) {
                this.actualTick = a || false;
                this.set(b, c)
            },
            set: function(a, b) {
                this.duration = a;
                this.mode = b || ig.TIMER_MODE.ONCE;
                this.repeatCount = this.timer = 0;
                if (this.mode == ig.TIMER_MODE.SINUS_RND) this._rndBool =
                    Math.random() >= 0.5
            },
            getRemainingTime: function() {
                return this.duration - this.timer
            },
            setRemainingTime: function(a) {
                this.timer = this.duration - a;
                if (this.timer < 0) this.timer = 0
            },
            tick: function() {
                if (this.duration) {
                    this.timer = this.timer + (this.actualTick ? ig.system.actualTick : ig.system.tick);
                    if (this.timer >= this.duration) {
                        this.timer = this.mode ? this.timer % this.duration : this.duration;
                        this.mode ? this.repeatCount++ : this.repeatCount = 1
                    }
                }
            },
            done: function() {
                return !this.duration || !this.mode && this.timer >= this.duration
            },
            getTimePassed: function() {
                return this.timer
            },
            get: function() {
                if (this.duration) {
                    var a = this.timer / this.duration;
                    this.mode == ig.TIMER_MODE.BLINK && (a = (a < 0.5 ? a : 1 - a) * 2);
                    this.mode == ig.TIMER_MODE.SINUS && (a = Math.sin(Math.PI * 2 * a));
                    this.mode == ig.TIMER_MODE.SINUS_RND && (a = Math.sin(Math.PI * 2 * a) * (this._rndBool ? -1 : 1));
                    return a
                }
                return 1
            },
            getTotalWeight: function() {
                return this.timer / this.duration
            },
            hasRepeated: function() {
                return this.mode && this.repeatCount
            },
            getRepeatCount: function() {
                return this.repeatCount
            },
            onBlinkDecline: function() {
                return this.timer / this.duration >=
                    0.5
            }
        })
    });
    ig.baked = !0;
    