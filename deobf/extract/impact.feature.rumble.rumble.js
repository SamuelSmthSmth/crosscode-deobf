ig.module("impact.feature.rumble.rumble").requires("impact.base.event", "impact.base.game").defines(function() {
    ig.Rumble = ig.GameAddon.extend({
        rumbles: [],
        namedRumbles: {},
        offset: Vec2.createC(0, 0),
        init: function() {
            this.parent("Rumble")
        },
        postUpdateOrder: 110,
        onPostUpdate: function() {
            if (!ig.game.paused) {
                var b = null;
                this.offset.x = 0;
                for (var a = this.offset.y = 0, d = this.rumbles.length; d--;)
                    if (b = this.rumbles[d]) {
                        b.update();
                        if (b.isDone()) {
                            b.name && delete this.namedRumbles[b.name];
                            this.rumbles.splice(d, 1)
                        } else {
                            this.offset.x =
                                this.offset.x + b.offset.x;
                            this.offset.y = this.offset.y + b.offset.y;
                            a = Math.max(a, b.power)
                        }
                    } Vec2.length(this.offset, Math.min(Vec2.length(this.offset), a));
                ig.game.screen.x = ig.game.screen.x + this.offset.x;
                ig.game.screen.y = ig.game.screen.y + this.offset.y
            }
        },
        onReset: function() {
            this.rumbles.length = 0;
            this.namedRumbles = {}
        },
        addRumble: function(b) {
            if (this.rumbles.indexOf(b) == -1) {
                b.name && (this.namedRumbles[b.name] = b);
                this.rumbles.push(b)
            }
        },
        removeRumble: function(b) {
            b.name && delete this.namedRumbles[b.name];
            this.rumbles.erase(b)
        },
        getRumble: function(b) {
            return this.namedRumbles[b]
        }
    });
    ig.addGameAddon(function() {
        return ig.rumble = new ig.Rumble
    });
    ig.RUMBLE_TYPE = {
        RANDOM: 0,
        HORIZONTAL: 1,
        VERTICAL: 2
    };
    ig.Rumble.RumbleHandle = ig.Class.extend({
        type: 0,
        name: null,
        power: 0,
        shakeDuration: 0,
        time: 0,
        fade: false,
        offset: null,
        _target: null,
        _start: null,
        _temp: null,
        _timer: 0,
        _duration: 0,
        _shakeTimer: 0,
        ignoreSlowDown: false,
        init: function(b, a, d, c, e, f) {
            this.type = ig.RUMBLE_TYPE[b] || ig.RUMBLE_TYPE.RANDOM;
            this.name = f || null;
            this.offset = Vec2.createC(0, 0);
            this._start =
                Vec2.createC(0, 0);
            this._target = Vec2.createC(0, 0);
            this._temp = Vec2.createC(0, 0);
            this.set(a, d, c, e)
        },
        onEntityKillDetach: function() {
            this._duration == -1 && this.stop()
        },
        update: function() {
            if (this._timer <= this._duration || this._duration == -1) {
                var b = 0,
                    b = this.fade && this._duration != -1 ? this.power * ((this._duration - this._timer) / this._duration) : this.power;
                this._updatePosition(b);
                this._timer = this._timer + ig.system.actualTick
            } else this.stop()
        },
        _updatePosition: function(b) {
            this._shakeTimer = this._shakeTimer + ig.system.actualTick;
            var a = Math.min(1, this._shakeTimer / this.shakeDuration),
                a = KEY_SPLINES.EASE_IN_OUT.get(a);
            this.offset.x = this._lerp(this._target.x, this._start.x, a);
            this.offset.y = this._lerp(this._target.y, this._start.y, a);
            if (this._shakeTimer >= this.shakeDuration) {
                this._shakeTimer = 0;
                Vec2.assign(this._start, this._target);
                this.type == ig.RUMBLE_TYPE.RANDOM ? Vec2.rotate(this._target, Math.PI / 2 + Math.random() * Math.PI) : Vec2.flip(this._target);
                Vec2.length(this._target, b)
            }
        },
        _lerp: function(b, a, d) {
            return b * d + (1 - d) * a
        },
        stop: function() {
            this.time =
                this._duration;
            this.offset.x = 0;
            this.offset.y = 0
        },
        isDone: function() {
            return this.time == this._duration
        },
        set: function(b, a, d, c) {
            this.shakeDuration = ig.Rumble.SHAKE_DURATION[a];
            var b = ig.Rumble.SHAKE_POWER[b],
                e = this.shakeDuration,
                a = 1;
            e >= ig.Rumble.SHAKE_DURATION.SLOW ? a = 0 : e == ig.Rumble.SHAKE_DURATION.NORMAL && (a = 0.5);
            e = 1;
            switch (sc.options.get("rumble-strength")) {
                case sc.RUMBLE_STRENGTH.STRONG:
                    e = 1;
                    break;
                case sc.RUMBLE_STRENGTH.NORMAL:
                    e = 0.75;
                    break;
                case sc.RUMBLE_STRENGTH.WEAK:
                    e = 0.5;
                    break;
                case sc.RUMBLE_STRENGTH.OFF:
                    e =
                        0
            }
            this.power = b * (1 - (1 - e) * a);
            this._duration = d;
            this.fade = c;
            this._timer = 0;
            this.offset.x = 0;
            this.offset.y = 0;
            Vec2.assign(this._start, this.offset);
            this._target.x = this._target.y = 0;
            this.type == ig.RUMBLE_TYPE.HORIZONTAL ? this._target.x = this.power : this._target.y = this.power;
            this._shakeTimer = 0
        }
    });
    ig.Rumble.SHAKE_POWER = {
        WEAKESTEST: 0.5,
        WEAKEST: 1,
        WEAKER: 2,
        WEAK: 3,
        MEDIUM: 4,
        STRONG: 5,
        STRONGER: 7,
        STRONGEST: 10,
        MEGA: 15
    };
    ig.Rumble.SHAKE_DURATION = {
        SLOWEST: 2,
        SLOWER: 1,
        SLOW: 0.5,
        NORMAL: 0.2,
        FAST: 0.075,
        FASTER: 0.04,
        FASTEST: 0.02
    }
});
ig.baked = !0;
