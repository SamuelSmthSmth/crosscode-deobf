/**
 * impact.feature.rumble.rumble
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.rumble.rumble")`.
 *
 * `ig.rumble` add-on: stacks `ig.Rumble.RumbleHandle`s, sums their screen
 * offsets (clamped by the strongest rumble's power) and applies the result to
 * `ig.game.screen`. Handle power is scaled by the player's rumble strength
 * option and the shake speed.
 */
ig.module("impact.feature.rumble.rumble")
    .requires("impact.base.event", "impact.base.game")
    .defines(function () {

    ig.Rumble = ig.GameAddon.extend({
        rumbles: [],
        namedRumbles: {},
        offset: Vec2.createC(0, 0),

        init: function () {
            this.parent("Rumble");
        },

        postUpdateOrder: 110,

        onPostUpdate: function () {
            if (!ig.game.paused) {
                var handle = null;
                this.offset.x = 0;
                for (var maxPower = this.offset.y = 0, i = this.rumbles.length; i--;)
                    if (handle = this.rumbles[i]) {
                        handle.update();
                        if (handle.isDone()) {
                            handle.name && delete this.namedRumbles[handle.name];
                            this.rumbles.splice(i, 1);
                        } else {
                            this.offset.x = this.offset.x + handle.offset.x;
                            this.offset.y = this.offset.y + handle.offset.y;
                            maxPower = Math.max(maxPower, handle.power);
                        }
                    }
                Vec2.length(this.offset, Math.min(Vec2.length(this.offset), maxPower));
                ig.game.screen.x = ig.game.screen.x + this.offset.x;
                ig.game.screen.y = ig.game.screen.y + this.offset.y;
            }
        },

        onReset: function () {
            this.rumbles.length = 0;
            this.namedRumbles = {};
        },

        addRumble: function (handle) {
            if (this.rumbles.indexOf(handle) == -1) {
                handle.name && (this.namedRumbles[handle.name] = handle);
                this.rumbles.push(handle);
            }
        },

        removeRumble: function (handle) {
            handle.name && delete this.namedRumbles[handle.name];
            this.rumbles.erase(handle);
        },

        getRumble: function (name) {
            return this.namedRumbles[name];
        }
    });

    ig.addGameAddon(function () {
        return ig.rumble = new ig.Rumble();
    });

    ig.RUMBLE_TYPE = {
        RANDOM: 0,
        HORIZONTAL: 1,
        VERTICAL: 2
    };

    /** One active rumble: shakes between two points at the shake speed. */
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

        init: function (type, power, speed, duration, fade, name) {
            this.type = ig.RUMBLE_TYPE[type] || ig.RUMBLE_TYPE.RANDOM;
            this.name = name || null;
            this.offset = Vec2.createC(0, 0);
            this._start = Vec2.createC(0, 0);
            this._target = Vec2.createC(0, 0);
            this._temp = Vec2.createC(0, 0);
            this.set(power, speed, duration, fade);
        },

        onEntityKillDetach: function () {
            this._duration == -1 && this.stop();
        },

        update: function () {
            if (this._timer <= this._duration || this._duration == -1) {
                var power = 0,
                    power = this.fade && this._duration != -1 ? this.power * ((this._duration - this._timer) / this._duration) : this.power;
                this._updatePosition(power);
                this._timer = this._timer + ig.system.actualTick;
            } else {
                this.stop();
            }
        },

        _updatePosition: function (power) {
            this._shakeTimer = this._shakeTimer + ig.system.actualTick;
            var t = Math.min(1, this._shakeTimer / this.shakeDuration),
                t = KEY_SPLINES.EASE_IN_OUT.get(t);
            this.offset.x = this._lerp(this._target.x, this._start.x, t);
            this.offset.y = this._lerp(this._target.y, this._start.y, t);
            if (this._shakeTimer >= this.shakeDuration) {
                this._shakeTimer = 0;
                Vec2.assign(this._start, this._target);
                this.type == ig.RUMBLE_TYPE.RANDOM ? Vec2.rotate(this._target, Math.PI / 2 + Math.random() * Math.PI) : Vec2.flip(this._target);
                Vec2.length(this._target, power);
            }
        },

        _lerp: function (b, a, t) {
            return b * t + (1 - t) * a;
        },

        stop: function () {
            this.time = this._duration;
            this.offset.x = 0;
            this.offset.y = 0;
        },

        isDone: function () {
            return this.time == this._duration;
        },

        /** Configure power/speed/duration; power is scaled by the option + speed. */
        set: function (powerKey, speedKey, duration, fade) {
            this.shakeDuration = ig.Rumble.SHAKE_DURATION[speedKey];
            var power = ig.Rumble.SHAKE_POWER[powerKey],
                speedFactor = this.shakeDuration,
                strengthFactor = 1;
            speedFactor >= ig.Rumble.SHAKE_DURATION.SLOW ? strengthFactor = 0 :
                speedFactor == ig.Rumble.SHAKE_DURATION.NORMAL && (strengthFactor = 0.5);
            var rumbleStrength = 1;
            switch (sc.options.get("rumble-strength")) {
                case sc.RUMBLE_STRENGTH.STRONG:
                    rumbleStrength = 1;
                    break;
                case sc.RUMBLE_STRENGTH.NORMAL:
                    rumbleStrength = 0.75;
                    break;
                case sc.RUMBLE_STRENGTH.WEAK:
                    rumbleStrength = 0.5;
                    break;
                case sc.RUMBLE_STRENGTH.OFF:
                    rumbleStrength = 0;
            }
            this.power = power * (1 - (1 - rumbleStrength) * strengthFactor);
            this._duration = duration;
            this.fade = fade;
            this._timer = 0;
            this.offset.x = 0;
            this.offset.y = 0;
            Vec2.assign(this._start, this.offset);
            this._target.x = this._target.y = 0;
            this.type == ig.RUMBLE_TYPE.HORIZONTAL ? this._target.x = this.power : this._target.y = this.power;
            this._shakeTimer = 0;
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
    };
});
ig.baked = !0;
