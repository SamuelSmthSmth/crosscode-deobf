ig.module("game.feature.player.modifiers").requires("impact.base.game").defines(function() {
    sc.MODIFIERS = {};
    sc.MODIFIERS.AIM_SPEED = {
        icon: 8
    };
    sc.MODIFIERS.AIM_STABILITY = {
        icon: 32
    };
    sc.MODIFIERS.AIMING_MOVEMENT = {
        icon: 23
    };
    sc.MODIFIERS.KNOCKBACK = {
        icon: 11
    };
    sc.MODIFIERS.RANGED_DMG = {
        icon: 10
    };
    sc.MODIFIERS.MELEE_DMG = {
        icon: 12
    };
    sc.MODIFIERS.CRITICAL_DMG = {
        icon: 14
    };
    sc.MODIFIERS.BREAK_DMG = {
        icon: 43
    };
    sc.MODIFIERS.SPIKE_DMG = {
        icon: 25
    };
    sc.MODIFIERS.ASSAULT = {
        icon: 13
    };
    sc.MODIFIERS.CROSS_COUNTER = {
        icon: 42
    };
    sc.MODIFIERS.BERSERK = {
        icon: 46
    };
    sc.MODIFIERS.MOMENTUM = {
        icon: 52
    };
    sc.MODIFIERS.DASH_INVINC = {
        icon: 15
    };
    sc.MODIFIERS.DASH_STEP = {
        icon: 24,
        noPercent: true
    };
    sc.MODIFIERS.GUARD_STRENGTH = {
        icon: 20
    };
    sc.MODIFIERS.GUARD_SP = {
        icon: 29
    };
    sc.MODIFIERS.GUARD_AREA = {
        icon: 31,
        noPercent: true
    };
    sc.MODIFIERS.PERFECT_GUARD_WINDOW = {
        icon: 27
    };
    sc.MODIFIERS.PERFECT_GUARD_RESET = {
        icon: 28,
        noPercent: true
    };
    sc.MODIFIERS.STUN_THRESHOLD = {
        icon: 16
    };
    sc.MODIFIERS.OVERHEAT_REDUCTION = {
        icon: 22
    };
    sc.MODIFIERS.HP_REGEN = {
        icon: 17
    };
    sc.MODIFIERS.SP_REGEN = {
        icon: 47
    };
    sc.MODIFIERS.ITEM_GUARD = {
        icon: 48,
        noPercent: true
    };
    sc.MODIFIERS.ONCE_MORE = {
        icon: 45,
        noPercent: true
    };
    sc.MODIFIERS.XP_PLUS = {
        icon: 9
    };
    sc.MODIFIERS.DROP_CHANCE = {
        icon: 19
    };
    sc.MODIFIERS.MONEY_PLUS = {
        icon: 26
    };
    sc.MODIFIERS.XP_ZERO = {
        icon: 18,
        noPercent: true
    };
    sc.MODIFIERS.RANK_PLANTS = {
        icon: 30,
        noPercent: true
    };
    sc.MODIFIERS.ITEM_BOOST = {
        icon: 21
    };
    sc.MODIFIERS.APPETITE = {
        icon: 44
    };
    sc.MODIFIERS.COND_HEALING = {
        icon: 41
    };
    sc.MODIFIERS.COND_EFFECT_HEAT = {
        icon: 33
    };
    sc.MODIFIERS.COND_EFFECT_COLD = {
        icon: 34
    };
    sc.MODIFIERS.COND_EFFECT_SHOCK = {
        icon: 35
    };
    sc.MODIFIERS.COND_EFFECT_WAVE = {
        icon: 36
    };
    sc.MODIFIERS.COND_EFFECT_ALL = {
        icon: 49
    };
    sc.MODIFIERS.COND_GUARD_HEAT = {
        icon: 37
    };
    sc.MODIFIERS.COND_GUARD_COLD = {
        icon: 38
    };
    sc.MODIFIERS.COND_GUARD_SHOCK = {
        icon: 39
    };
    sc.MODIFIERS.COND_GUARD_WAVE = {
        icon: 40
    };
    sc.MODIFIERS.SPIDER_SLOW_DOWN_GUARD = {
        icon: 50,
        noPercent: true
    };
    sc.MODIFIERS.BEGONE_ICE = {
        icon: 51,
        noPercent: true
    };
    var b = 0,
        a;
    for (a in sc.MODIFIERS) {
        sc.MODIFIERS[a].order = b;
        b++
    }
});
ig.baked = !0;
