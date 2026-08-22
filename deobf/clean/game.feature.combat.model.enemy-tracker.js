/**
 * game.feature.combat.model.enemy-tracker
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-tracker")`.
 *
 * Enemy reaction trackers: `sc.EnemyTracker` base plus `sc.ENEMY_TRACKER.*`
 * (TIME, HIT, HP). Each tracks progress toward a condition threshold — a
 * countdown, accumulated hits, or accumulated damage — and resets after the
 * reaction performs.
 */
ig.module("game.feature.combat.model.enemy-tracker")
    .defines(function () {

    sc.EnemyTracker = ig.Class.extend({
        update: null,
        onStateChange: null,
        onReactionActivate: null,
        onConditionEval: function () {
            return false
        },
        onPerformed: function () {},
        reset: function () {}
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

        init: function (combatant, settings) {
            this.target = settings.target;
            this.initRandom = settings.initRandom;
            this.resetRandom = settings.resetRandom;
            this.noStateReset = settings.noStateReset;
            this.hpBreakFactor = settings.hpBreakFactor;
            this.noAssist = settings.noAssist || false;
            this._initTimer(combatant)
        },

        update: function () {
            this.current = this.current + ig.system.tick
        },

        onStateChange: function (combatant) {
            this.noStateReset || this.reset(combatant)
        },

        onConditionEval: function (combatant) {
            return this.current >= this._getTarget(combatant)
        },

        onPerformed: function (combatant, noReset) {
            noReset || this.reset(combatant)
        },

        _initTimer: function (combatant) {
            this.current = this._getTarget(combatant) * Math.random() * this.initRandom
        },

        reset: function (combatant, randomOverride) {
            var random = randomOverride !== void 0 ? randomOverride : Math.random() * this.resetRandom;
            this.current = this._getTarget(combatant) * random
        },

        _getTarget: function (combatant) {
            var target = this.target;
            this.hpBreakFactor && (target = target * (this.hpBreakFactor[combatant.hpBreakReached] || 1));
            this.noAssist || (target = target / sc.options.get("assist-attack-frequency"));
            return target
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

        init: function (combatant, settings) {
            this.target = settings.target;
            this.hpBreakTargets = settings.hpBreakTargets;
            this.scaleDmgFactor = settings.scaleDmgFactor;
            this.scaleEnemyFactor = settings.scaleEnemyFactor;
            this.limitOffScale = settings.limitOffScale;
            this.scaleElement = settings.scaleElement;
            this.noStateReset = settings.noStateReset || false;
            this.current = 0
        },

        onStateChange: function () {},

        onReactionActivate: function (combatant) {
            this.noStateReset || this.reset(combatant)
        },

        onConditionEval: function (combatant, random, hitData, attackInfo) {
            var target = this._getTarget(combatant);
            if (hitData) {
                var hitValue = 1;
                if (this.scaleDmgFactor && hitData.damageResult) {
                    hitValue = hitData.damageResult.baseOffensiveFactor;
                    this.limitOffScale && (hitValue = Math.min(hitValue, this.limitOffScale));
                    attackInfo && attackInfo.damageFactor != void 0 && (hitValue = hitValue * attackInfo.damageFactor)
                }
                this.scaleEnemyFactor && (hitValue = hitValue * combatant.params.damageFactor);
                this.scaleElement && hitData.damageResult && (hitValue = hitValue * hitData.damageResult.elementalDef);
                this.current = this.current + hitValue;
                hitData.weakness = this.current / target
            }
            return this.current >= target
        },

        onPerformed: function (combatant) {
            this.reset(combatant)
        },

        reset: function (combatant, randomOverride) {
            this.current = Math.floor((randomOverride !== void 0 ? randomOverride : 0) * this._getTarget(combatant))
        },

        _getTarget: function (combatant) {
            var target = this.target;
            this.hpBreakTargets && (target = this.hpBreakTargets[combatant.hpBreakReached] || this.target);
            return target
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

        init: function (combatant, settings) {
            this.target = settings.target;
            this.hpReduced = 0
        },

        onStateChange: function () {},

        onReactionActivate: function (combatant) {
            this.reset(combatant)
        },

        onConditionEval: function (combatant, random, hitData, attackInfo) {
            if (hitData && hitData.damageResult) {
                var damage = hitData.damageResult.damage;
                attackInfo && attackInfo.damageFactor != void 0 && (damage = damage * attackInfo.damageFactor);
                this.hpReduced = this.hpReduced + damage;
                hitData.weakness = this.hpReduced / combatant.params.getStat("hp") / this.target
            }
            return this.hpReduced / combatant.params.getStat("hp") >= this.target
        },

        onPerformed: function (combatant) {
            this.reset(combatant)
        },

        reset: function (combatant, randomOverride) {
            if (combatant.params) this.hpReduced = Math.floor((randomOverride !== void 0 ? randomOverride : 0) * this.target * combatant.params.getStat("hp"))
        }
    })
});
ig.baked = !0;
