/**
 * impact.feature.influencer.influencer
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.influencer.influencer")`.
 *
 * The influence system: `ig.Influencer` (attached to entities) aggregates
 * `ig.InfluenceEntry`s, each scaling the entity's time / logic time / XY
 * movement and optionally pushing it (PULL/PUSH/DIR force types). Entries
 * fade out over time; `ig.InfluenceConnection` ties an entry to an action
 * so it can be removed when the action ends.
 */
ig.module("impact.feature.influencer.influencer")
    .defines(function () {

    /** Registerable per-influencer callbacks (e.g. from other features). */
    ig.InfluencerCallbacks = {
        callbacks: [],

        addCallback: function (callback) {
            this.callbacks.push(callback);
        },

        /** Instantiate one callback object per registered type on `influencer`. */
        init: function (influencer) {
            for (var i = 0; i < this.callbacks.length; ++i) {
                influencer.callbacks[i] = new this.callbacks[i](influencer, influencer.entity);
            }
        }
    };

    ig.Influencer = ig.Class.extend({
        entity: null,
        entries: [],
        callbacks: [],

        init: function (entity) {
            this.entity = entity;
            ig.InfluencerCallbacks.init(this);
        },

        hasPush: function () {
            for (var i = this.entries.length; i--;)
                if (this.entries[i].push) return true;
        },

        addInfluence: function (entry) {
            this.entries.indexOf(entry) == -1 && this.entries.push(entry);
        },

        removeInfluence: function (entry) {
            this.entries.erase(entry);
            if (entry.updateInfluencer == this) entry.updateInfluencer = null;
        },

        removeActionInfluences: function () {
            for (var i = this.entries.length; i--;) {
                this.entries[i].actionInfluence && this.removeInfluence(this.entries[i]);
            }
        },

        updateCallbacks: function () {
            for (var i = 0; i < this.callbacks.length; ++i) this.callbacks[i].onUpdate(this, this.entity);
        },

        onUpdate: function () {
            this.updateCallbacks();
            this.updateInfluencerState(false);
        },

        /**
         * Aggregate all entries into the coll's time factors and push
         * velocity. With `immediate`, fade-out entries are kept (not ticked).
         */
        updateInfluencerState: function (immediate) {
            var coll = this.entity.coll,
                timeScale = 1,
                slowmoScale = 1,
                logicScale = 1,
                moveScale = 1,
                pushVec = scratchVec2b,
                maxPushLen = 0,
                push = scratchVec2a;
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i];
                if (!entry.updateInfluencer) entry.updateInfluencer = this;
                var factor = 1;
                if (entry.state == influenceState.REMOVED) {
                    this.entries.splice(i, 1);
                } else {
                    if (entry.updateInfluencer == this) {
                        if (!entry.fadeTimer.done()) {
                            entry.state = influenceState.FADE_OUT;
                            if (!immediate) {
                                entry.fadeTimer.tick();
                                if (entry.fadeTimer.done()) {
                                    this.entries.splice(i, 1);
                                    entry.state = influenceState.REMOVED;
                                    continue;
                                }
                            }
                            factor = entry.getFactor();
                        }
                    } else if (entry.state == influenceState.FADE_OUT) {
                        factor = entry.getFactor();
                    }
                    timeScale = timeScale * (1 - factor + factor * entry.timeScale);
                    slowmoScale = Math.max(slowmoScale, 1 - factor + factor * entry.slowmoScale);
                    logicScale = logicScale * (1 - factor + factor * entry.logicTimeScale);
                    moveScale = moveScale * (1 - factor + factor * entry.moveXYScale);
                    if (entry.push) {
                        if (entry = entry.getPush(coll, factor)) {
                            maxPushLen = Math.max(maxPushLen, Vec2.length(entry));
                            Vec2.add(pushVec, entry);
                        }
                    }
                }
            }
            coll.time.factor = timeScale * slowmoScale;
            coll.time.logicFactor = logicScale;
            coll.time.moveXYFactor = moveScale;
            if (maxPushLen) {
                Vec2.length(pushVec) > maxPushLen && Vec2.length(pushVec, maxPushLen);
                Vec2.add(coll.pushVel, pushVec);
            }
        },

        /** Sink sprites by the summed groundSinkZ of active entries. */
        onPostSpriteUpdate: function () {
            var sinkZ = 0;
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i];
                entry.state = influenceState.NORMAL;
                var factor = entry.getFactor(),
                    sinkZ = sinkZ + entry.groundSinkZ * factor;
            }
            if (sinkZ = Math.round(sinkZ)) {
                var sprites = this.entity.sprites;
                for (i = sprites.length; i--;) sprites[i].pos.z = sprites[i].pos.z - sinkZ;
            }
        }
    });

    var influenceState = {
        NORMAL: 0,
        FADE_OUT: 1,
        REMOVED: 2
    };

    /** Push force computations; each writes the resulting vector into `out`. */
    sc.INFLUENCE_PUSH = {
        /** Pull the entity toward `center`. */
        PULL: function (out, coll, center, range, fadeRange, speed, factor) {
            coll.getCenter(out);
            Vec2.sub(out, center);
            Vec2.flip(out);
            var dist = Vec2.length(out),
                strength = 1;
            range && (dist > range + fadeRange ? strength = 0 : dist >= range && (strength = 1 - (dist - range) / fadeRange));
            dist < 2 && (strength = 0);
            Vec2.length(out, strength * speed * factor);
        },

        /** Push the entity away from `center`. */
        PUSH: function (out, coll, center, range, fadeRange, speed, factor) {
            coll.getCenter(out);
            Vec2.sub(out, center);
            var dist = Vec2.length(out),
                strength = 1;
            range && (dist > range + fadeRange ? strength = 0 : dist >= range && (strength = 1 - (dist - range) / fadeRange));
            dist < 2 && (strength = 0);
            Vec2.length(out, strength * speed * factor);
        },

        /** Push in a fixed direction, ignoring distance. */
        DIR: function (out, coll, center, range, fadeRange, speed, factor) {
            Vec2.sub(out, center);
            Vec2.length(out, speed * factor);
        }
    };

    var scratchVec2a = Vec2.create(),
        scratchVec2b = Vec2.create();

    /** One active influence: time scales, fade-out timer and optional push. */
    ig.InfluenceEntry = ig.Class.extend({
        fadeTimer: null,
        timeScale: 1,
        slowmoScale: 1,
        logicTimeScale: 1,
        moveXYScale: 1,
        groundSinkZ: 0,
        updateInfluencer: null,
        state: influenceState.NORMAL,
        push: null,

        init: function () {
            this.fadeTimer = new ig.WeightTimer(false);
        },

        setPushType: function (type, range, fadeRange, speed) {
            this.push = {
                type: type,
                range: range,
                fadeRange: fadeRange,
                speed: speed,
                vec: Vec2.create()
            };
        },

        setPushEntityCenter: function (entity) {
            this.push && entity.getCenter(this.push.vec);
        },

        setPushCenter: function (center) {
            Vec2.assign(this.push.vec, center);
        },

        /** Compute the current push vector (scratch-returned) for `coll`. */
        getPush: function (coll, factor) {
            if (!this.push) return null;
            this.push.type(scratchVec2a, coll, this.push.vec, this.push.range, this.push.fadeRange, this.push.speed, factor);
            return scratchVec2a;
        },

        setFadeOut: function (duration) {
            this.fadeTimer.set(duration, ig.TIMER_MODE.ONCE);
        },

        /** 1 while fully active, shrinking toward 0 as the fade timer runs. */
        getFactor: function () {
            return this.fadeTimer.done() ? 1 : 1 - this.fadeTimer.get();
        }
    });

    /** Binds an influence entry to an action; cleared when the action ends. */
    ig.InfluenceConnection = ig.Class.extend({
        init: function (influencer, influenceEntry) {
            this.influencer = influencer;
            this.influenceEntry = influenceEntry;
            influenceEntry.actionInfluence = true;
            this.influencer.addInfluence(this.influenceEntry);
        },

        updateImmediately: function () {
            this.influencer.updateInfluencerState(true);
        },

        clear: function () {
            this.influencer.removeInfluence(this.influenceEntry);
        },

        onActionEndDetach: function () {
            this.clear();
        }
    });
});
ig.baked = !0;
