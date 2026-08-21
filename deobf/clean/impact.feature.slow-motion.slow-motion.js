/**
 * impact.feature.slow-motion.slow-motion
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.slow-motion.slow-motion")`.
 *
 * `ig.slowMotion` add-on: stacks named/unnamed slow-motion handles, applies
 * the strongest one to the global time factor, and supports "inverse" entities
 * that stay at normal speed while everything else slows down.
 */
ig.module("impact.feature.slow-motion.slow-motion")
    .requires("impact.base.event", "impact.base.game")
    .defines(function () {

    ig.SlowMotion = ig.GameAddon.extend({
        slowMotions: [],
        namedSlowMotions: {},

        init: function () {
            this.parent("SlowMotion");
        },

        forceUpdate: function () {
            this.update();
            ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
        },

        /** Tick all handles; remove finished ones and apply the new time factor. */
        update: function () {
            for (var minFactor = 1, i = this.slowMotions.length; i--;) {
                var handle = this.slowMotions[i];
                if (handle.update()) {
                    handle.name && delete this.namedSlowMotions[handle.name];
                    this.slowMotions.splice(i, 1);
                } else {
                    minFactor = Math.min(minFactor, this.slowMotions[i].getFactor());
                }
            }
            ig.system.setTimeFactor(minFactor);
        },

        hasSlowMotion: function (name) {
            return !!this.namedSlowMotions[name];
        },

        /** Slow-down factor, undoing the effect for handles with inverse entities. */
        getNonInvertSlowDown: function () {
            for (var a = 1, b = 1, i = this.slowMotions.length; i--;) {
                var handle = this.slowMotions[i],
                    factor = handle.getFactor(),
                    b = Math.min(b, factor);
                handle.inverers.length > 0 && (a = Math.max(a, 1 / factor));
            }
            return b * a;
        },

        postUpdateOrder: 100,

        onPostUpdate: function () {
            this.update();
        },

        onLevelLoadStart: function () {
            this.onReset();
        },

        onReset: function () {
            this.slowMotions.length = 0;
            this.namedSlowMotions = {};
        },

        add: function (factor, time, name) {
            var handle = new ig.SlowMotionHandle(factor, time, name);
            this.slowMotions.push(handle);
            if (name) {
                if (this.namedSlowMotions[name]) {
                    this.namedSlowMotions[name].clear();
                    this.namedSlowMotions[name].name = null;
                }
                this.namedSlowMotions[name] = handle;
            }
            return handle;
        },

        clearNamed: function (name, time) {
            this.namedSlowMotions[name] && this.namedSlowMotions[name].clear(time);
        }
    });

    ig.addGameAddon(function () {
        return ig.slowMotion = new ig.SlowMotion();
    });

    /** One active slow-motion: factor, transition timer and inverse entities. */
    ig.SlowMotionHandle = ig.Class.extend({
        factor: 1,
        transitionTime: 0,
        name: null,
        timer: 0,
        cleared: false,
        inverers: [],

        init: function (factor, time, name) {
            this.factor = factor;
            this.timer = this.transitionTime = time;
            this.name = name || null;
        },

        clear: function (time) {
            this.cleared = true;
            this.timer = this.transitionTime = time || 0;
        },

        /** Returns true when the handle is done and should be removed. */
        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer < 0) this.timer = 0;
            }
            for (var i = this.inverers.length; i--;) {
                this.inverers[i].influenceEntry.slowmoScale = 1 / this.getFactor();
                this.inverers[i].updateImmediately();
            }
            if (!this.timer && this.cleared) {
                for (i = this.inverers.length; i--;) this.inverers[i].clear();
                this.inverers.length = 0;
                return true;
            }
            return false;
        },

        /** Make `entity` immune to this slow motion (stays at normal speed). */
        addInverseEntity: function (entity) {
            var entry = new ig.InfluenceEntry(),
                connection = new ig.InfluenceConnection(entity.influencer, entry);
            this.inverers.push(connection);
        },

        /** 1 while starting up, `factor` once fully active (or reversing on clear). */
        getFactor: function () {
            var t = this.transitionTime ? this.timer / this.transitionTime : 0;
            this.cleared || (t = 1 - t);
            return (1 - t) * 1 + t * this.factor;
        },

        onActionEndDetach: function () {
            this.clear(0.2);
        }
    });
});
ig.baked = !0;
