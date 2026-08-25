ig.module("game.feature.arena.arena-score-types").requires("impact.base.game").defines(function() {
    sc.ARENA_SCORE_TYPES = {
        DAMAGE_DONE: {
            order: 0,
            "static": true
        },
        DAMAGE_DONE_EFFECTIVE: {
            order: 1,
            "static": true,
            asBonus: true
        },
        DAMAGE_TAKEN: {
            order: 2,
            staticMultiplier: 25,
            "static": true,
            asMali: true
        },
        KILL: {
            points: 500,
            order: 100,
            chain: true
        },
        BOSS_KILL: {
            points: 5E3,
            order: 101,
            chain: true
        },
        TARGET_KILL: {
            points: 500,
            order: 102,
            chain: true
        },
        MULTI_KILL: {
            points: 1E3,
            order: 103,
            chain: true
        },
        ENVIRONMENT_KILL: {
            points: 1E3,
            order: 104
        },
        ONE_HIT_KILL: {
            points: 10,
            order: 105,
            chain: true
        },
        LOCK_FINISH: {
            points: 500,
            order: 200
        },
        LOCK_FINISH_3: {
            points: 1E3,
            order: 201
        },
        ELEMENT_OVERLOAD: {
            points: -1E4,
            order: 300,
            asMali: true
        },
        PERFECT_SHIELD: {
            points: 100,
            order: 3E3,
            dimReturns: true
        },
        PERFECT_DODGE: {
            points: 100,
            order: 4E3,
            dimReturns: true
        },
        ENEMY_BREAK: {
            points: 500,
            order: 5E3
        },
        GUARD_COUNTER: {
            points: 500,
            order: 6E3
        },
        STATUS_INFLICT: {
            points: 250,
            order: 7E3
        },
        PVP_ROUND_WON: {
            points: 5E3,
            order: 8E3
        },
        PVP_ROUND_LOST: {
            points: -5E3,
            order: 8001,
            asMali: true
        },
        ENEMY_HEAL: {
            order: 2E3,
            "static": true,
            asMali: true
        }
    }
});
ig.baked = !0;
