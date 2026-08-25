/**
 * @module game.feature.arena.arena-bonus-objectives
 *
 * Bonus objectives scored at the end of each arena round. Includes
 * built-in objectives (no damage taken, no items used, PvP flawless)
 * and configurable objectives (effective damage, hit counter, time,
 * combat arts used, chain, items used). Each objective tracks stats
 * and checks conditions at round end.
 */
ig.module("game.feature.arena.arena-bonus-objectives").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.achievements.stats-model").defines(function() {
    function formatTime(seconds) {
        var secs = seconds % 60;
        return Math.floor(seconds / 60) + ":" + (secs < 10 ? "0" : "") + secs
    }
    sc.ARENA_MAX_BONUS_OBJECTIVES = 6;
    sc.ARENA_BONUS_OBJECTIVE = {};
    sc.ARENA_DEFAULT_BONUS_OBJECTIVES = {
        NO_DAMAGE_TAKEN: {
            points: 1E4
        },
        NO_ITEMS_USED: {
            points: 5E3,
            ignoreOn: "PVP_BATTLE"
        },
        PVP_FLAWLESS: {
            points: 1E4,
            challenge: "PVP_BATTLE"
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.NO_DAMAGE_TAKEN = {
        _type: "EMPTY",
        order: -10001,
        init: function(config, data) {
            data._startHits = sc.stats.getMap("combat", "damageTaken")
        },
        check: function(data) {
            return ig.perf.grantArenaBonus ? true : sc.stats.getMap("combat", "damageTaken") == data._startHits
        },
        getText: function(text) {
            return text
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.NO_ITEMS_USED = {
        _type: "EMPTY",
        order: -1E4,
        init: function(config, data) {
            data._startUses = sc.stats.getMap("items", "used")
        },
        check: function(data) {
            return ig.perf.grantArenaBonus ? true : sc.stats.getMap("items", "used") == data._startUses
        },
        getText: function(text) {
            return text
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.PVP_FLAWLESS = {
        _type: "EMPTY",
        order: -100,
        init: function(config, data) {
            data._startHits = sc.stats.getMap("combat", "damageTaken")
        },
        check: function() {
            if (ig.perf.grantArenaBonus) return true;
            var lostRound = sc.arena.runtime.scoreStats.PVP_ROUND_LOST;
            return lostRound ? lostRound.count < 1 : true
        },
        getText: function(text) {
            return text
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.EFFECTIVE_DAMAGE = {
        _type: "Integer",
        _prefix: "target",
        order: 100,
        init: function(config, data) {
            data._damageTarget = config.target;
            data._startDamage = sc.stats.getMap("arena", "effectiveDamage") || 0
        },
        check: function(data) {
            return (sc.stats.getMap("arena", "effectiveDamage") || 0) - data._startDamage >= data._damageTarget
        },
        getText: function(text, data, resolved) {
            return text.replace("[!]", resolved ? data._damageTarget : data.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.HIT_COUNTER = {
        _type: "Integer",
        _prefix: "value",
        order: 1E3,
        init: function(config, data) {
            data._maxHits = config.value;
            data._startHits = sc.stats.getMap("combat", "damageHits")
        },
        check: function(data) {
            return (sc.stats.getMap("combat", "damageHits") || 0) - data._startHits < data._maxHits
        },
        getText: function(text, data, resolved) {
            return text.replace("[!]", resolved ? data._maxHits : data.value)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.TIME = {
        _type: "Integer",
        _prefix: "seconds",
        order: 0,
        displayRangePoints: true,
        init: function(config, data) {
            data._time = config.seconds
        },
        check: function(data) {
            return sc.timers.timers.arenaTimerReal ? sc.timers.getPassedTime("arenaTimerReal") <= data._time * 2 : false
        },
        getText: function(text, data, resolved) {
            var displayTime = resolved ? data._time : data.seconds;
            if (resolved) {
                var elapsed = Math.ceil(sc.timers.getPassedTime("arenaTimerReal"));
                return text.replace("[!]", formatTime(elapsed) + "\\i[slash-highlight]" + formatTime(displayTime))
            }
            return text.replace("[!]", formatTime(displayTime))
        },
        getPoints: function(data, maxPoints) {
            var ratio = (sc.timers.getPassedTime("arenaTimerReal") / data._time - 1).limit(0, 1);
            return maxPoints - Math.round(maxPoints * ratio)
        },
        getPointsRange: function(config) {
            return config.points
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.COMBAT_ARTS_USED = {
        _type: "Integer",
        _prefix: "target",
        order: 4E3,
        init: function(config, data) {
            data._target = config.target;
            data._start = sc.stats.getMap("combat", "specials") || 0
        },
        check: function(data) {
            return (sc.stats.getMap("combat", "specials") || 0) - data.start >= data._target
        },
        getText: function(text, data, resolved) {
            return text.replace("[!]", resolved ? data._target : data.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.CHAIN = {
        _type: "Integer",
        _prefix: "target",
        order: 5E3,
        init: function(config, data) {
            data._target = config.target
        },
        check: function(data) {
            return sc.arena.runtime.chain >= data._target
        },
        getText: function(text, data, resolved) {
            return text.replace("[!]", resolved ? data._target : data.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.ITEMS_USED = {
        _type: "Integer",
        _prefix: "amount",
        order: 1E4,
        init: function(config, data) {
            data._maxUses = config.amount;
            data._startUses = sc.stats.getMap("items", "used")
        },
        check: function(data) {
            return (sc.stats.getMap("items", "used") || 0) - data._startUses < data._maxUses
        },
        getText: function(text, data, resolved) {
            return text.replace("[!]", resolved ? data._maxUses : data.amount)
        }
    }
});
ig.baked = !0;