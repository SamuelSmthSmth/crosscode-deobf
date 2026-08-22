/**
 * game.feature.combat.stat-change
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.stat-change")`.
 *
 * The buff/stat-change system. `sc.StatChange` is the base unit applied to
 * `sc.CombatParams` (multiplies stats, adds modifiers); `sc.ItemBuff` and
 * `sc.ActionBuff` are the two concrete kinds (timed item buffs vs. active
 * action buffs). The `sc.STAT_CHANGE_SETTINGS` table maps buff IDs like
 * `"ATTACK-2"` / `"BREAK_DMG-3"` to their effect, icon and rank.
 */
ig.module("game.feature.combat.stat-change")
    .requires("impact.base.game")
    .defines(function () {

    // Easter egg left by Radical Fish Games in the shipped bundle.
    window.FOR_THE_HACKERS = "I see you are browsing through the code of our game! Hope you having a good time around here. I thought I adda little extra for you here, since you took the effort to check out the optimized/obfuscated code of CrossCode.If you happen to have a particular question about a feature, you can write us a mail and will be happy to answer it!Simply check out our homepage over at www.radicalfishgames.com! Also don't tell Lachsen you found this, or he will throw evil looks at me all day! - R.D.";

    sc.STAT_CHANGE_ICONS = {
        "stat-default": [0, 0],
        "stat-hp": [0, 0],
        "stat-attack": [0, 1],
        "stat-defense": [0, 2],
        "stat-focus": [0, 3],
        "stat-heat": [0, 4],
        "stat-cold": [0, 5],
        "stat-shock": [0, 6],
        "stat-wave": [0, 7],
        "stat-rank-1": [0, 8],
        "stat-rank-2": [0, 9],
        "stat-rank-3": [0, 10],
        "stat-level-1": [0, 11],
        "stat-level-2": [0, 12],
        "stat-level-3": [0, 13],
        "stat-regen": [0, 14],
        "stat-overheat": [0, 15],
        "stat-sp-regen": [0, 16],
        "stat-cond-healing": [0, 18],
        "stat-stun-threshold": [0, 19],
        "stat-spike-dmg": [0, 20],
        "stat-cross-counter": [0, 21],
        "stat-break-dmg": [0, 22],
        "stat-hack": [0, 23],
        "stat-rank-down-1": [0, 24],
        "stat-rank-down-2": [0, 25],
        "stat-rank-down-3": [0, 26],
        "stat-rank-4": [0, 27],
        insetArrow: [0, 28],
        "stat-money": [0, 29],
        "stat-dash": [0, 30],
        "stat-melee": [0, 31],
        "stat-ranged": [0, 32]
    };
    sc.STAT_CHANGE_ICONS_LARGE = {
        "stat-default": [4, 0],
        "stat-hp": [4, 0],
        "stat-attack": [4, 1],
        "stat-defense": [4, 2],
        "stat-focus": [4, 3],
        "stat-heat": [4, 4],
        "stat-cold": [4, 5],
        "stat-shock": [4, 6],
        "stat-wave": [4, 7],
        "stat-rank-1": [4, 8],
        "stat-rank-2": [4, 9],
        "stat-rank-3": [4, 10],
        "stat-level-1": [4, 11],
        "stat-level-2": [4, 12],
        "stat-level-3": [4, 13],
        "stat-regen": [4, 14],
        "stat-overheat": [4, 15],
        "stat-sp-regen": [4, 16],
        "stat-cond-healing": [4, 18],
        "stat-stun-threshold": [4, 19],
        "stat-spike-dmg": [4, 20],
        "stat-cross-counter": [4, 21],
        "stat-break-dmg": [4, 22],
        "stat-hack": [4, 23],
        "stat-rank-down-1": [4, 24],
        "stat-rank-down-2": [4, 25],
        "stat-rank-down-3": [4, 26],
        "stat-rank-4": [4, 27],
        "stat-money": [4, 28],
        "stat-dash": [4, 29],
        "stat-melee": [4, 30],
        "stat-ranged": [4, 31]
    };

    // Scratch array for vector stat multiplication + the stat key order.
    var STAT_SCRATCH = [0, 0, 0, 0],
        STAT_KEYS = ["hp", "attack", "defense", "focus"];

    /**
     * Base buff unit. `params` holds per-stat multipliers (hp/attack/defense/
     * focus/elemFactor), `modifiers` holds additive modifier values.
     * Compatible with `sc.CombatParams.addBuff`/`removeBuff`.
     */
    sc.StatChange = ig.Class.extend({
        params: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1, 1, 1, 1]
        },
        modifiers: {},
        iconString: "\\i[stat-default]",

        init: function (changeIds) {
            var i = changeIds.length,
                setting = null;
            for (this.iconString = ""; i--;)
                if ((setting = sc.STAT_CHANGE_SETTINGS[changeIds[i]]) && setting.change != sc.STAT_CHANGE_TYPE.HEAL)
                    if (setting.change == sc.STAT_CHANGE_TYPE.STATS)
                        setting.type.key != "elemFactor"
                            ? this.params[setting.type.key] = this.params[setting.type.key] * (setting.value || 1)
                            : this.params.elemFactor[setting.type.index] = this.params.elemFactor[setting.type.index] * (setting.value || 1);
                    else {
                        this.modifiers[setting.type.key] || (this.modifiers[setting.type.key] = 0);
                        this.modifiers[setting.type.key] = this.modifiers[setting.type.key] + setting.value
                    }
            this.iconString = sc.inventory.getBuffString(-1, true, changeIds)
        },

        // Applied by `CombatParams.getStat` (multiplicative).
        multiply: function (value, key) {
            var factor = this.params[key];
            if (factor) {
                if (value instanceof Array) {
                    for (var i = factor.length; i--;) STAT_SCRATCH[i] = value[i] * factor[i];
                    return STAT_SCRATCH
                }
                return value * factor
            }
            return value
        },

        // Applied by `CombatParams.getModifier` (additive).
        add: function (value, key) {
            return value + (this.modifiers[key] || 0)
        },

        clear: function () {},
        getStatFactor: function (key) {
            return this.params[key]
        },
        hasTimer: false,
        getTimeFactor: function () {
            return 0
        },

        // Whether two buffs overlap (so one must replace the other).
        intersectsWith: function (other) {
            for (var i = STAT_KEYS.length; i--;) {
                var key = STAT_KEYS[i];
                if (this.params[key] != 1 && other.params[key] != 1) return true
            }
            for (i = 4; i--;)
                if (this.params.elemFactor[i] != 1 && other.params.elemFactor[i] != 1) return true;
            for (var mod in this.modifiers)
                if (other.modifiers[mod]) return true;
            return false
        }
    });

    /** A buff granted by consuming an item, with a real-time duration. */
    sc.ItemBuff = sc.StatChange.extend({
        timer: 0,
        time: 0,
        itemID: -1,
        init: function (changeIds, time, itemID) {
            this.parent(changeIds);
            this.timer = this.time = time || 0;
            this.itemID = itemID || -1
        },
        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    return true
                }
            }
            return false
        },
        clear: function () {
            this.timer = 0
        },
        reset: function (time) {
            this.timer = this.time = time + this.timer
        },
        hasTimer: true,
        getTimeFactor: function () {
            return this.time <= 0 ? 0 : this.timer / this.time
        }
    });

    /** A buff tied to an attached action; lives while the action is active. */
    sc.ActionBuff = sc.StatChange.extend({
        active: true,
        name: null,
        hacked: false,
        init: function (changeIds, name, hacked) {
            this.parent(changeIds);
            this.name = name;
            this.hacked = hacked || false
        },
        update: function () {
            return !this.active
        },
        onActionEndDetach: function () {
            this.active = false
        },
        onEntityKillDetach: function () {
            this.active = false
        },
        clear: function () {
            this.active = false
        },
        reset: function (time) {
            this.timer = this.time = time + this.timer
        },
        hasTimer: false,
        getTimeFactor: function () {
            return this.active ? 1 : 0
        }
    });

    sc.STAT_CHANGE_TYPE = {};
    sc.STAT_CHANGE_TYPE.STATS = 0;
    sc.STAT_CHANGE_TYPE.MODIFIER = 1;
    sc.STAT_CHANGE_TYPE.HEAL = 2;
    sc.STAT_PARAM_TYPE = {};
    sc.STAT_PARAM_TYPE.HP_REGEN = {
        key: "HP_REGEN"
    };
    sc.STAT_PARAM_TYPE.HP = {
        key: "hp"
    };
    sc.STAT_PARAM_TYPE.HEAL = {
        key: "heal"
    };
    sc.STAT_PARAM_TYPE.ATTACK = {
        key: "attack"
    };
    sc.STAT_PARAM_TYPE.DEFENSE = {
        key: "defense"
    };
    sc.STAT_PARAM_TYPE.FOCUS = {
        key: "focus"
    };
    sc.STAT_PARAM_TYPE.HEAT = {
        key: "elemFactor",
        index: 0
    };
    sc.STAT_PARAM_TYPE.COLD = {
        key: "elemFactor",
        index: 1
    };
    sc.STAT_PARAM_TYPE.SHOCK = {
        key: "elemFactor",
        index: 2
    };
    sc.STAT_PARAM_TYPE.WAVE = {
        key: "elemFactor",
        index: 3
    };
    sc.STAT_PARAM_TYPE.OVERHEAT = {
        key: "OVERHEAT_REDUCTION"
    };
    sc.STAT_PARAM_TYPE.SP_REGEN = {
        key: "SP_REGEN"
    };
    sc.STAT_PARAM_TYPE.COND_HEALING = {
        key: "COND_HEALING"
    };
    sc.STAT_PARAM_TYPE.STUN_THRESHOLD = {
        key: "STUN_THRESHOLD"
    };
    sc.STAT_PARAM_TYPE.SPIKE_DMG = {
        key: "SPIKE_DMG"
    };
    sc.STAT_PARAM_TYPE.CROSS_COUNTER = {
        key: "CROSS_COUNTER"
    };
    sc.STAT_PARAM_TYPE.BREAK_DMG = {
        key: "BREAK_DMG"
    };
    sc.STAT_PARAM_TYPE.MELEE_DMG = {
        key: "MELEE_DMG"
    };
    sc.STAT_PARAM_TYPE.RANGED_DMG = {
        key: "RANGED_DMG"
    };
    sc.STAT_PARAM_TYPE.MONEY_PLUS = {
        key: "MONEY_PLUS"
    };
    sc.STAT_PARAM_TYPE.DASH_STEP = {
        key: "DASH_STEP"
    };
    sc.STAT_USE_SPEED = {};
    sc.STAT_USE_SPEED.NORMAL = 1;
    sc.STAT_USE_SPEED.SLOW = 2;
    sc.STAT_USE_SPEED.FAST = 3;

    // Buff definitions: `change` (STATS multiplier / MODIFIER additive / HEAL),
    // `type` (which param), `value`, `icon`, `grade` (rank display).
    sc.STAT_CHANGE_SETTINGS = {};
    sc.STAT_CHANGE_SETTINGS["HP-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HP, value: 1.1, icon: "stat-hp", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["HP-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HP, value: 1.15, icon: "stat-hp", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["HP-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HP, value: 1.2, icon: "stat-hp", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["HP-MINUS-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HP, value: 0.5, icon: "stat-hp", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["ATTACK-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.ATTACK, value: 1.1, icon: "stat-attack", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["ATTACK-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.ATTACK, value: 1.15, icon: "stat-attack", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["ATTACK-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.ATTACK, value: 1.2, icon: "stat-attack", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS.HACK = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.ATTACK, value: 1, icon: "stat-hack", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["DEFENSE-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.DEFENSE, value: 1.1, icon: "stat-defense", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["DEFENSE-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.DEFENSE, value: 1.15, icon: "stat-defense", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["DEFENSE-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.DEFENSE, value: 1.2, icon: "stat-defense", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["FOCUS-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.FOCUS, value: 1.1, icon: "stat-focus", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["FOCUS-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.FOCUS, value: 1.15, icon: "stat-focus", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["FOCUS-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.FOCUS, value: 1.2, icon: "stat-focus", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["ATTACK-4"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.ATTACK, value: 1.3, icon: "stat-attack", grade: "stat-rank-4" };
    sc.STAT_CHANGE_SETTINGS["FOCUS-4"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.FOCUS, value: 1.3, icon: "stat-focus", grade: "stat-rank-4" };
    sc.STAT_CHANGE_SETTINGS["DEFENSE-MINUS-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.DEFENSE, value: 0.5, negative: true, icon: "stat-defense", grade: "stat-rank-down-3" };
    sc.STAT_CHANGE_SETTINGS["HEAT-RES-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HEAT, value: 0.9, icon: "stat-heat", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["HEAT-RES-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HEAT, value: 0.8, icon: "stat-heat", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["HEAT-RES-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.HEAT, value: 0.7, icon: "stat-heat", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["COLD-RES-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.COLD, value: 0.9, icon: "stat-cold", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["COLD-RES-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.COLD, value: 0.8, icon: "stat-cold", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["COLD-RES-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.COLD, value: 0.7, icon: "stat-cold", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["SHOCK-RES-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.SHOCK, value: 0.9, icon: "stat-shock", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["SHOCK-RES-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.SHOCK, value: 0.8, icon: "stat-shock", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["SHOCK-RES-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.SHOCK, value: 0.7, icon: "stat-shock", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["WAVE-RES-1"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.WAVE, value: 0.9, icon: "stat-wave", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["WAVE-RES-2"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.WAVE, value: 0.8, icon: "stat-wave", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["WAVE-RES-3"] = { change: sc.STAT_CHANGE_TYPE.STATS, type: sc.STAT_PARAM_TYPE.WAVE, value: 0.7, icon: "stat-wave", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["HEAL-1"] = { change: sc.STAT_CHANGE_TYPE.HEAL, type: sc.STAT_PARAM_TYPE.HEAL, value: 1.15, icon: "stat-default" };
    sc.STAT_CHANGE_SETTINGS["HEAL-2"] = { change: sc.STAT_CHANGE_TYPE.HEAL, type: sc.STAT_PARAM_TYPE.HEAL, value: 1.25, icon: "stat-default" };
    sc.STAT_CHANGE_SETTINGS["HEAL-3"] = { change: sc.STAT_CHANGE_TYPE.HEAL, type: sc.STAT_PARAM_TYPE.HEAL, value: 1.5, icon: "stat-default" };
    sc.STAT_CHANGE_SETTINGS["HEAL-4"] = { change: sc.STAT_CHANGE_TYPE.HEAL, type: sc.STAT_PARAM_TYPE.HEAL, value: 1.7, icon: "stat-default" };
    sc.STAT_CHANGE_SETTINGS["HEAL-5"] = { change: sc.STAT_CHANGE_TYPE.HEAL, type: sc.STAT_PARAM_TYPE.HEAL, value: 1.8, icon: "stat-default" };
    sc.STAT_CHANGE_SETTINGS["REGEN-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.HP_REGEN, value: 0.5, icon: "stat-regen", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["REGEN-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.HP_REGEN, value: 0.8, icon: "stat-regen", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["REGEN-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.HP_REGEN, value: 1, icon: "stat-regen", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["REGEN-4"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.HP_REGEN, value: 1.2, icon: "stat-regen", grade: "stat-rank-4" };
    sc.STAT_CHANGE_SETTINGS["OVERHEAT-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.OVERHEAT, value: 0.3, icon: "stat-overheat", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["OVERHEAT-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.OVERHEAT, value: 0.4, icon: "stat-overheat", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["OVERHEAT-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.OVERHEAT, value: 0.5, icon: "stat-overheat", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["SP_REGEN-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.SP_REGEN, value: 0.3, icon: "stat-sp-regen", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["SP_REGEN-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.SP_REGEN, value: 0.4, icon: "stat-sp-regen", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["SP_REGEN-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.SP_REGEN, value: 0.5, icon: "stat-sp-regen", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["COND_HEALING-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.COND_HEALING, value: 0.3, icon: "stat-cond-healing", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["COND_HEALING-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.COND_HEALING, value: 0.5, icon: "stat-cond-healing", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["COND_HEALING-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.COND_HEALING, value: 0.75, icon: "stat-cond-healing", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["STUN_THRESHOLD-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.STUN_THRESHOLD, value: 0.1, icon: "stat-stun-threshold", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["SPIKE_DMG-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.SPIKE_DMG, value: 0.5, icon: "stat-spike-dmg", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["CROSS_COUNTER-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.CROSS_COUNTER, value: 0.15, icon: "stat-cross-counter", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["CROSS_COUNTER-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.CROSS_COUNTER, value: 0.25, icon: "stat-cross-counter", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["CROSS_COUNTER-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.CROSS_COUNTER, value: 0.35, icon: "stat-cross-counter", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["BREAK_DMG-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.BREAK_DMG, value: 0.35, icon: "stat-break-dmg", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["MELEE_DMG-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.MELEE_DMG, value: 0.1, icon: "stat-melee", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["MELEE_DMG-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.MELEE_DMG, value: 0.2, icon: "stat-melee", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["MELEE_DMG-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.MELEE_DMG, value: 0.3, icon: "stat-melee", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["MELEE_DMG-4"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.MELEE_DMG, value: 0.5, icon: "stat-melee", grade: "stat-rank-4" };
    sc.STAT_CHANGE_SETTINGS["RANGED_DMG-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.RANGED_DMG, value: 0.1, icon: "stat-ranged", grade: "stat-rank-1" };
    sc.STAT_CHANGE_SETTINGS["RANGED_DMG-2"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.RANGED_DMG, value: 0.2, icon: "stat-ranged", grade: "stat-rank-2" };
    sc.STAT_CHANGE_SETTINGS["RANGED_DMG-3"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.RANGED_DMG, value: 0.3, icon: "stat-ranged", grade: "stat-rank-3" };
    sc.STAT_CHANGE_SETTINGS["RANGED_DMG-4"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.RANGED_DMG, value: 0.5, icon: "stat-ranged", grade: "stat-rank-4" };
    sc.STAT_CHANGE_SETTINGS["MONEY-MINUS-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.MONEY_PLUS, value: -2, negative: true, icon: "stat-money", grade: "stat-rank-down-3" };
    sc.STAT_CHANGE_SETTINGS["DASH-STEP-1"] = { change: sc.STAT_CHANGE_TYPE.MODIFIER, type: sc.STAT_PARAM_TYPE.DASH_STEP, value: 1, icon: "stat-dash", grade: "stat-rank-1" }
});
ig.baked = !0;
