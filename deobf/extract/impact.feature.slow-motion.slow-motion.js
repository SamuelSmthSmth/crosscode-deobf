ig.module("impact.feature.slow-motion.slow-motion").requires("impact.base.event", "impact.base.game").defines(function() {
    ig.SlowMotion = ig.GameAddon.extend({
        slowMotions: [],
        namedSlowMotions: {},
        init: function() {
            this.parent("SlowMotion")
        },
        forceUpdate: function() {
            this.update();
            ig.system.tick = ig.system.actualTick * ig.system.timeFactor
        },
        update: function() {
            for (var b = 1, a = this.slowMotions.length; a--;) {
                var d = this.slowMotions[a];
                if (d.update()) {
                    d.name && delete this.namedSlowMotions[d.name];
                    this.slowMotions.splice(a,
                        1)
                } else b = Math.min(b, this.slowMotions[a].getFactor())
            }
            ig.system.setTimeFactor(b)
        },
        hasSlowMotion: function(b) {
            return !!this.namedSlowMotions[b]
        },
        getNonInvertSlowDown: function() {
            for (var b = 1, a = 1, d = this.slowMotions.length; d--;) {
                var c = this.slowMotions[d],
                    e = c.getFactor(),
                    a = Math.min(a, e);
                c.inverers.length > 0 && (b = Math.max(b, 1 / e))
            }
            return a * b
        },
        postUpdateOrder: 100,
        onPostUpdate: function() {
            this.update()
        },
        onLevelLoadStart: function() {
            this.onReset()
        },
        onReset: function() {
            this.slowMotions.length = 0;
            this.namedSlowMotions = {}
        },
        add: function(b, a, d) {
            b = new ig.SlowMotionHandle(b, a, d);
            this.slowMotions.push(b);
            if (d) {
                if (this.namedSlowMotions[d]) {
                    this.namedSlowMotions[d].clear();
                    this.namedSlowMotions[d].name = null
                }
                this.namedSlowMotions[d] = b
            }
            return b
        },
        clearNamed: function(b, a) {
            this.namedSlowMotions[b] && this.namedSlowMotions[b].clear(a)
        }
    });
    ig.addGameAddon(function() {
        return ig.slowMotion = new ig.SlowMotion
    });
    ig.SlowMotionHandle = ig.Class.extend({
        factor: 1,
        transitionTime: 0,
        name: null,
        timer: 0,
        cleared: false,
        inverers: [],
        init: function(b,
            a, d) {
            this.factor = b;
            this.timer = this.transitionTime = a;
            this.name = d || null
        },
        clear: function(b) {
            this.cleared = true;
            this.timer = this.transitionTime = b || 0
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer < 0) this.timer = 0
            }
            for (var b = this.inverers.length; b--;) {
                this.inverers[b].influenceEntry.slowmoScale = 1 / this.getFactor();
                this.inverers[b].updateImmediately()
            }
            if (!this.timer && this.cleared) {
                for (b = this.inverers.length; b--;) this.inverers[b].clear();
                this.inverers.length = 0;
                return true
            }
            return false
        },
        addInverseEntity: function(b) {
            var a = new ig.InfluenceEntry,
                b = new ig.InfluenceConnection(b.influencer, a);
            this.inverers.push(b)
        },
        getFactor: function() {
            var b = this.transitionTime ? this.timer / this.transitionTime : 0;
            this.cleared || (b = 1 - b);
            return (1 - b) * 1 + b * this.factor
        },
        onActionEndDetach: function() {
            this.clear(0.2)
        }
    })
});
ig.baked = !0;
