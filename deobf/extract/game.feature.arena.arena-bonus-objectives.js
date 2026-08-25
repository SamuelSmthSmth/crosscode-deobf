ig.module("game.feature.arena.arena-bonus-objectives").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.achievements.stats-model").defines(function() {
    function b(a) {
        var b = a % 60;
        return Math.floor(a / 60) + ":" + (b < 10 ? "0" : "") + b
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
        init: function(a, b) {
            b._startHits = sc.stats.getMap("combat", "damageTaken")
        },
        check: function(a) {
            return ig.perf.grantArenaBonus ? true : sc.stats.getMap("combat", "damageTaken") == a._startHits
        },
        getText: function(a) {
            return a
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.NO_ITEMS_USED = {
        _type: "EMPTY",
        order: -1E4,
        init: function(a, b) {
            b._startUses = sc.stats.getMap("items", "used")
        },
        check: function(a) {
            return ig.perf.grantArenaBonus ? true : sc.stats.getMap("items", "used") == a._startUses
        },
        getText: function(a) {
            return a
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.PVP_FLAWLESS = {
        _type: "EMPTY",
        order: -100,
        init: function(a, b) {
            b._startHits = sc.stats.getMap("combat", "damageTaken")
        },
        check: function() {
            if (ig.perf.grantArenaBonus) return true;
            var a = sc.arena.runtime.scoreStats.PVP_ROUND_LOST;
            return a ? a.count < 1 : true
        },
        getText: function(a) {
            return a
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.EFFECTIVE_DAMAGE = {
        _type: "Integer",
        _prefix: "target",
        order: 100,
        init: function(a, b) {
            b._damageTarget = a.target;
            b._startDamage = sc.stats.getMap("arena", "effectiveDamage") || 0
        },
        check: function(a) {
            return (sc.stats.getMap("arena",
                "effectiveDamage") || 0) - a._startDamage >= a._damageTarget
        },
        getText: function(a, b, c) {
            return a.replace("[!]", c ? b._damageTarget : b.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.HIT_COUNTER = {
        _type: "Integer",
        _prefix: "value",
        order: 1E3,
        init: function(a, b) {
            b._maxHits = a.value;
            b._startHits = sc.stats.getMap("combat", "damageHits")
        },
        check: function(a) {
            return (sc.stats.getMap("combat", "damageHits") || 0) - a._startHits < a._maxHits
        },
        getText: function(a, b, c) {
            return a.replace("[!]", c ? b._maxHits : b.value)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.TIME = {
        _type: "Integer",
        _prefix: "seconds",
        order: 0,
        displayRangePoints: true,
        init: function(a, b) {
            b._time = a.seconds
        },
        check: function(a) {
            return sc.timers.timers.arenaTimerReal ? sc.timers.getPassedTime("arenaTimerReal") <= a._time * 2 : false
        },
        getText: function(a, d, c) {
            d = c ? d._time : d.seconds;
            if (c) {
                c = Math.ceil(sc.timers.getPassedTime("arenaTimerReal"));
                return a.replace("[!]", b(c) + "\\i[slash-highlight]" + b(d))
            }
            return a.replace("[!]", b(d))
        },
        getPoints: function(a, b) {
            var c = (sc.timers.getPassedTime("arenaTimerReal") / a._time - 1).limit(0, 1);
            return b -
                Math.round(b * c)
        },
        getPointsRange: function(a) {
            return a.points
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.COMBAT_ARTS_USED = {
        _type: "Integer",
        _prefix: "target",
        order: 4E3,
        init: function(a, b) {
            b._target = a.target;
            b._start = sc.stats.getMap("combat", "specials") || 0
        },
        check: function(a) {
            return (sc.stats.getMap("combat", "specials") || 0) - a.start >= a._target
        },
        getText: function(a, b, c) {
            return a.replace("[!]", c ? b._target : b.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.CHAIN = {
        _type: "Integer",
        _prefix: "target",
        order: 5E3,
        init: function(a, b) {
            b._target = a.target
        },
        check: function(a) {
            return sc.arena.runtime.chain >= a._target
        },
        getText: function(a, b, c) {
            return a.replace("[!]", c ? b._target : b.target)
        }
    };
    sc.ARENA_BONUS_OBJECTIVE.ITEMS_USED = {
        _type: "Integer",
        _prefix: "amount",
        order: 1E4,
        init: function(a, b) {
            b._maxUses = a.amount;
            b._startUses = sc.stats.getMap("items", "used")
        },
        check: function(a) {
            return (sc.stats.getMap("items", "used") || 0) - a._startUses < a._maxUses
        },
        getText: function(a, b, c) {
            return a.replace("[!]", c ? b._maxUses : b.amount)
        }
    }
});
ig.baked = !0;
