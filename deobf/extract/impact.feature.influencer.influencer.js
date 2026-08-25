ig.module("impact.feature.influencer.influencer").defines(function() {
    ig.InfluencerCallbacks = {
        callbacks: [],
        addCallback: function(a) {
            this.callbacks.push(a)
        },
        init: function(a) {
            for (var b = 0; b < this.callbacks.length; ++b) a.callbacks[b] = new this.callbacks[b](a, a.entity)
        }
    };
    ig.Influencer = ig.Class.extend({
        entity: null,
        entries: [],
        callbacks: [],
        init: function(a) {
            this.entity = a;
            ig.InfluencerCallbacks.init(this)
        },
        hasPush: function() {
            for (var a = this.entries.length; a--;)
                if (this.entries[a].push) return true
        },
        addInfluence: function(a) {
            this.entries.indexOf(a) ==
                -1 && this.entries.push(a)
        },
        removeInfluence: function(a) {
            this.entries.erase(a);
            if (a.updateInfluencer == this) a.updateInfluencer = null
        },
        removeActionInfluences: function() {
            for (var a = this.entries.length; a--;) this.entries[a].actionInfluence && this.removeInfluence(this.entries[a])
        },
        updateCallbacks: function() {
            for (var a = 0; a < this.callbacks.length; ++a) this.callbacks[a].onUpdate(this, this.entity)
        },
        onUpdate: function() {
            this.updateCallbacks();
            this.updateInfluencerState(false)
        },
        updateInfluencerState: function(a) {
            for (var e =
                    this.entity.coll, f = 1, g = 1, h = 1, i = 1, j = this.entries.length, k = 0, l = d; j--;) {
                var o = this.entries[j];
                if (!o.updateInfluencer) o.updateInfluencer = this;
                var m = 1;
                if (o.state == b.REMOVED) this.entries.splice(j, 1);
                else {
                    if (o.updateInfluencer == this) {
                        if (!o.fadeTimer.done()) {
                            o.state = b.FADE_OUT;
                            if (!a) {
                                o.fadeTimer.tick();
                                if (o.fadeTimer.done()) {
                                    this.entries.splice(j, 1);
                                    o.state = b.REMOVED;
                                    continue
                                }
                            }
                            m = o.getFactor()
                        }
                    } else o.state == b.FADE_OUT && (m = o.getFactor());
                    f = f * (1 - m + m * o.timeScale);
                    g = Math.max(g, 1 - m + m * o.slowmoScale);
                    h = h * (1 - m + m *
                        o.logicTimeScale);
                    i = i * (1 - m + m * o.moveXYScale);
                    if (o.push)
                        if (o = o.getPush(e, m)) {
                            k = Math.max(k, Vec2.length(o));
                            Vec2.add(l, o)
                        }
                }
            }
            e.time.factor = f * g;
            e.time.logicFactor = h;
            e.time.moveXYFactor = i;
            if (k) {
                Vec2.length(l) > k && Vec2.length(l, k);
                Vec2.add(e.pushVel, l)
            }
        },
        onPostSpriteUpdate: function() {
            for (var a = 0, d = this.entries.length; d--;) {
                var f = this.entries[d];
                f.state = b.NORMAL;
                var g = f.getFactor(),
                    a = a + f.groundSinkZ * g
            }
            if (a = Math.round(a)) {
                f = this.entity.sprites;
                for (d = f.length; d--;) f[d].pos.z = f[d].pos.z - a
            }
        }
    });
    var b = {
        NORMAL: 0,
        FADE_OUT: 1,
        REMOVED: 2
    };
    sc.INFLUENCE_PUSH = {
        PULL: function(a, b, d, g, h, i, j) {
            b.getCenter(a);
            Vec2.sub(a, d);
            Vec2.flip(a);
            b = Vec2.length(a);
            d = 1;
            g && (b > g + h ? d = 0 : b >= g && (d = 1 - (b - g) / h));
            b < 2 && (d = 0);
            Vec2.length(a, d * j * i)
        },
        PUSH: function(a, b, d, g, h, i, j) {
            b.getCenter(a);
            Vec2.sub(a, d);
            b = Vec2.length(a);
            d = 1;
            g && (b > g + h ? d = 0 : b >= g && (d = 1 - (b - g) / h));
            b < 2 && (d = 0);
            Vec2.length(a, d * j * i)
        },
        DIR: function(a, b, d, g, h, i, j) {
            Vec2.sub(a, d);
            Vec2.length(i * j)
        }
    };
    var a = Vec2.create(),
        d = Vec2.create();
    ig.InfluenceEntry = ig.Class.extend({
        fadeTimer: null,
        timeScale: 1,
        slowmoScale: 1,
        logicTimeScale: 1,
        moveXYScale: 1,
        groundSinkZ: 0,
        updateInfluencer: null,
        state: b.NORMAL,
        push: null,
        init: function() {
            this.fadeTimer = new ig.WeightTimer(false)
        },
        setPushType: function(a, b, d, g) {
            this.push = {
                type: a,
                range: b,
                fadeRange: d,
                speed: g,
                vec: Vec2.create()
            }
        },
        setPushEntityCenter: function(a) {
            this.push && a.getCenter(this.push.vec)
        },
        setPushCenter: function(a) {
            Vec2.assign(this.push.vec, a)
        },
        getPush: function(b, d) {
            if (!this.push) return null;
            this.push.type(a, b, this.push.vec, this.push.range, this.push.fadeRange,
                this.push.speed, d);
            return a
        },
        setFadeOut: function(a) {
            this.fadeTimer.set(a, ig.TIMER_MODE.ONCE)
        },
        getFactor: function() {
            return this.fadeTimer.done() ? 1 : 1 - this.fadeTimer.get()
        }
    });
    ig.InfluenceConnection = ig.Class.extend({
        init: function(a, b) {
            this.influencer = a;
            this.influenceEntry = b;
            b.actionInfluence = true;
            this.influencer.addInfluence(this.influenceEntry)
        },
        updateImmediately: function() {
            this.influencer.updateInfluencerState(true)
        },
        clear: function() {
            this.influencer.removeInfluence(this.influenceEntry)
        },
        onActionEndDetach: function() {
            this.clear()
        }
    })
});
ig.baked = !0;
