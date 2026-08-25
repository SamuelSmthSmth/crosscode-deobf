ig.module("game.feature.combat.model.enemy-tracker").defines(function() {
    sc.EnemyTracker = ig.Class.extend({
        update: null,
        onStateChange: null,
        onReactionActivate: null,
        onConditionEval: function() {
            return false
        },
        onPerformed: function() {},
        reset: function() {}
    });
    sc.ENEMY_TRACKER = {};
    sc.ENEMY_TRACKER.TIME = sc.EnemyTracker.extend({
        target: 0,
        current: 0,
        initRandom: 0,
        resetRandom: 0,
        noStateReset: false,
        hpBreakFactor: null,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Number",
                    _info: "Target time in seconds"
                },
                initRandom: {
                    _type: "Number",
                    _info: "How much variance should be used when initializing the timer. 0 = noRandom, 1 = full range random"
                },
                resetRandom: {
                    _type: "Number",
                    _info: "How much variance should be used when resetting the timer. 0 = noRandom, 1 = full range random"
                },
                noStateReset: {
                    _type: "Boolean",
                    _info: "If true, do not initialize when state is reset"
                },
                hpBreakFactor: {
                    _type: "NumberArray",
                    _info: "A factor for each hp break level multiplied with target time",
                    _optional: true
                },
                noAssist: {
                    _type: "Boolean",
                    _info: "If true, do not slow down in Assist mode (because it makes it harder)"
                }
            }
        }),
        init: function(b, a) {
            this.target = a.target;
            this.initRandom = a.initRandom;
            this.resetRandom = a.resetRandom;
            this.noStateReset = a.noStateReset;
            this.hpBreakFactor = a.hpBreakFactor;
            this.noAssist = a.noAssist || false;
            this._initTimer(b)
        },
        update: function() {
            this.current = this.current + ig.system.tick
        },
        onStateChange: function(b) {
            this.noStateReset || this.reset(b)
        },
        onConditionEval: function(b) {
            return this.current >= this._getTarget(b)
        },
        onPerformed: function(b, a) {
            a || this.reset(b)
        },
        _initTimer: function(b) {
            this.current = this._getTarget(b) *
                Math.random() * this.initRandom
        },
        reset: function(b, a) {
            var d = a !== void 0 ? a : Math.random() * this.resetRandom;
            this.current = this._getTarget(b) * d
        },
        _getTarget: function(b) {
            var a = this.target;
            this.hpBreakFactor && (a = a * (this.hpBreakFactor[b.hpBreakReached] || 1));
            this.noAssist || (a = a / sc.options.get("assist-attack-frequency"));
            return a
        }
    });
    sc.ENEMY_TRACKER.HIT = sc.EnemyTracker.extend({
        target: 0,
        current: 0,
        notStateInit: false,
        hpBreakTargets: null,
        noStateReset: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Number",
                    _info: "Target number of hits"
                },
                hpBreakTargets: {
                    _type: "NumberArray",
                    _info: "Alternative number for each HP Break State.",
                    _optional: true
                },
                scaleDmgFactor: {
                    _type: "Boolean",
                    _info: "If true: weight hit with damage factors. NOTE: This will also consider factors of enemy shields BECAUSE ITS WEIRD."
                },
                scaleEnemyFactor: {
                    _type: "Boolean",
                    _info: "If true: scale effectiveness with damageFactor of enemy (will still ignore shields etc.)"
                },
                limitOffScale: {
                    _type: "Number",
                    _info: "Offensive factor is limited by this value and can't be higher.",
                    _optional: true
                },
                scaleElement: {
                    _type: "Boolean",
                    _info: "If true: scale with elemental defense"
                },
                noStateReset: {
                    _type: "Boolean",
                    _info: "If true, do not initialize when state is reset"
                }
            }
        }),
        init: function(b, a) {
            this.target = a.target;
            this.hpBreakTargets = a.hpBreakTargets;
            this.scaleDmgFactor = a.scaleDmgFactor;
            this.scaleEnemyFactor = a.scaleEnemyFactor;
            this.limitOffScale = a.limitOffScale;
            this.scaleElement = a.scaleElement;
            this.noStateReset = a.noStateReset || false;
            this.current = 0
        },
        onStateChange: function() {},
        onReactionActivate: function(b) {
            this.noStateReset ||
                this.reset(b)
        },
        onConditionEval: function(b, a, d, c) {
            a = this._getTarget(b);
            if (d) {
                var e = 1;
                if (this.scaleDmgFactor && d.damageResult) {
                    e = d.damageResult.baseOffensiveFactor;
                    this.limitOffScale && (e = Math.min(e, this.limitOffScale));
                    c && c.damageFactor != void 0 && (e = e * c.damageFactor)
                }
                this.scaleEnemyFactor && (e = e * b.params.damageFactor);
                this.scaleElement && d.damageResult && (e = e * d.damageResult.elementalDef);
                this.current = this.current + e;
                d.weakness = this.current / a
            }
            return this.current >= a
        },
        onPerformed: function(b) {
            this.reset(b)
        },
        reset: function(b, a) {
            this.current = Math.floor((a !== void 0 ? a : 0) * this._getTarget(b))
        },
        _getTarget: function(b) {
            var a = this.target;
            this.hpBreakTargets && (a = this.hpBreakTargets[b.hpBreakReached] || this.target);
            return a
        }
    });
    sc.ENEMY_TRACKER.HP = sc.EnemyTracker.extend({
        target: 0,
        hpReduced: 0,
        notStateInit: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Number",
                    _info: "The target anount of HP relative to HP. 0.1 = 10% of HP reduced"
                }
            }
        }),
        init: function(b, a) {
            this.target = a.target;
            this.hpReduced = 0
        },
        onStateChange: function() {},
        onReactionActivate: function(b) {
            this.reset(b)
        },
        onConditionEval: function(b, a, d, c) {
            if (d && d.damageResult) {
                a = d.damageResult.damage;
                c && c.damageFactor != void 0 && (a = a * c.damageFactor);
                this.hpReduced = this.hpReduced + a;
                d.weakness = this.hpReduced / b.params.getStat("hp") / this.target
            }
            return this.hpReduced / b.params.getStat("hp") >= this.target
        },
        onPerformed: function(b) {
            this.reset(b)
        },
        reset: function(b, a) {
            if (b.params) this.hpReduced = Math.floor((a !== void 0 ? a : 0) * this.target * b.params.getStat("hp"))
        }
    })
});
ig.baked = !0;
