/**
 * game.feature.player.player-config
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-config")`.
 *
 * Player definitions: `sc.PLAYER_CLASSES`, `sc.PLAYER_ACTION` (action id
 * constants), `sc.PlayerConfig` (JSON-loaded character data: proxies, combat
 * style, element configs, autoequip), `sc.PlayerAction` (an action plus its
 * metadata) and `sc.PlayerSubConfig` (per-element action/param-factor sets).
 * The `AIM_ACTIONS` map marks actions that keep the aim state.
 */
ig.module("game.feature.player.player-config").defines(function () {

    sc.PLAYER = {};

    sc.PLAYER_CLASSES = {
        SPHEROMANCER: 0,
        TRIBLADER: 1,
        QUADROGUARD: 2,
        PENTAFIST: 3,
        HEXACAST: 4,
        UNKNOWN: 5
    };

    sc.PLAYER_ACTION = {
        AIM_START: 1,
        THROW_NORMAL: 2,
        THROW_NORMAL_REV: 3,
        THROW_CHARGED: 4,
        THROW_CHARGED_REV: 5,
        ATTACK: 6,
        ATTACK_REV: 7,
        ATTACK_FINISHER: 8,
        DASH: 9,
        DASH_SLOW: 10,
        CHARGING: 11,
        GUARD: 12,
        PERFECT_GUARD: 13,
        THROW_SPECIAL1: 21,
        THROW_SPECIAL2: 22,
        THROW_SPECIAL3: 23,
        ATTACK_SPECIAL1: 24,
        ATTACK_SPECIAL2: 25,
        ATTACK_SPECIAL3: 26,
        DASH_SPECIAL1: 27,
        DASH_SPECIAL2: 28,
        DASH_SPECIAL3: 29,
        GUARD_SPECIAL1: 30,
        GUARD_SPECIAL2: 31,
        GUARD_SPECIAL3: 32,
        DASH_LONG: 33
    };

    var AIM_ACTIONS = {
        AIM_START: true,
        THROW_NORMAL: false,
        THROW_NORMAL_REV: false,
        THROW_CHARGED: false,
        THROW_CHARGED_REV: false,
        ATTACK: false,
        ATTACK_REV: false,
        ATTACK_FINISHER: false,
        DASH: false,
        DASH_SLOW: false,
        DASH_LONG: false,
        GUARD: true,
        CHARGING: false
    };

    sc.PLAYER_SP_COST = [1, 3, 6];

    sc.PlayerConfig = ig.JsonLoadable.extend({
        cacheType: "PlayerConfig",
        name: null,
        clazz: null,
        character: null,
        combatStyle: {
            comboCount: 4,
            throwCount: 4,
            throwProb: 0.5,
            sidewaySpeed: 1,
            normDistance: 120,
            meleeDistance: 24,
            minDistance: 48
        },
        animSheet: null,
        proxies: {},
        headIdx: 0,
        stats: null,
        autoequip: null,
        baseConfig: [],
        elementConfigs: {},
        skillRanking: [],

        init: function (name) {
            this.name = name;
            this.parent(name.toLowerCase())
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/players/", ".json") + ig.getCacheSuffix()
        },

        onload: function (data) {
            var jsonData;
            jsonData = ig.jsonTemplate.resolve(data);
            if (!jsonData) throw Error("Can't find data of player '" + elementKey + "'");
            for (var proxyKey in jsonData.proxies) {
                var proxyData = jsonData.proxies[proxyKey];
                this.proxies[proxyKey] = new sc.PROXY_TYPE[proxyData.type || "BALL"](proxyData)
            }
            this.clazz = jsonData["class"];
            this.character = new sc.Character(jsonData.character);
            this.animSheet = new ig.AnimationSheet(jsonData.sheet);
            this.stats = jsonData.stats;
            var combatStyle = jsonData.combatStyle || {};
            this.combatStyle.comboCount = combatStyle.comboCount || 4;
            this.combatStyle.throwCount = combatStyle.throwCount || 4;
            this.combatStyle.throwProb = combatStyle.throwProb || 0;
            this.combatStyle.sidewaySpeed = combatStyle.sidewaySpeed || 1;
            this.combatStyle.normDistance = combatStyle.normDistance || 120;
            this.combatStyle.meleeDistance = combatStyle.meleeDistance || 24;
            this.combatStyle.minDistance = combatStyle.minDistance || 48;
            this.combatStyle.foodSprites = combatStyle.foodSprites || null;
            this.combatStyle.foodOffset = combatStyle.foodOffset || null;
            this.combatStyle.foodBubbleOffset = combatStyle.foodBubbleOffset || null;
            this.walkAnims = jsonData.walkAnims;
            if (this.autoequip = jsonData.autoequip)
                for (var index = 0; index < this.autoequip.length; ++index) this.autoequip[index].condition && (this.autoequip[index].condition = new ig.VarCondition(this.autoequip[index].condition));
            this.headIdx = jsonData.headIdx || 0;
            this.baseConfig = new sc.PlayerSubConfig("BASE", jsonData.actions.BASE);
            for (var elementKey in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[elementKey]] = new sc.PlayerSubConfig(elementKey, jsonData.actions[elementKey]);
            if (jsonData = jsonData.skillRanking)
                for (index = 0; index < jsonData.length; ++index) this.skillRanking.push(jsonData[index].skill)
        },

        getCacheKey: function (key) {
            return key
        },

        onCacheCleared: function () {
            this.character.decreaseRef();
            this.baseConfig.clearCached();
            for (var elementKey in this.elementConfigs[elementKey]) this.elementConfigs[elementKey].clearCached();
            for (var proxyKey in this.proxies) this.proxies[proxyKey].clearCached()
        }
    });

    /** Pick the ball proxy matching the given element and charge state. */
    sc.PlayerConfig.getElementBall = function (config, element, charged) {
        var ballKey = charged ? "charged" : "default";
        element == sc.ELEMENT.NEUTRAL ? ballKey = ballKey + "Neutral" : element == sc.ELEMENT.HEAT ? ballKey = ballKey + "Heat" : element == sc.ELEMENT.COLD ? ballKey = ballKey + "Cold" : element == sc.ELEMENT.WAVE ? ballKey = ballKey + "Wave" : element == sc.ELEMENT.SHOCK && (ballKey = ballKey + "Shock");
        return config.proxies[ballKey]
    };

    var ELEMENT_PARAM_FACTORS = {
        NEUTRAL: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1, 1, 1, 1]
        },
        HEAT: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1, 1.5, 1, 1]
        },
        COLD: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1.5, 1, 1, 1]
        },
        SHOCK: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1, 1, 1, 1.5]
        },
        WAVE: {
            hp: 1,
            attack: 1,
            defense: 1,
            focus: 1,
            elemFactor: [1, 1, 1.5, 1]
        }
    };

    sc.ACTION_DMG_TYPE = {
        MELEE: 1,
        RANGED: 2,
        NONE: 3,
        MIXED: 4
    };
    sc.ACTION_STUN_TYPE = {
        INTERRUPT: 1,
        LOCK: 2
    };

    sc.PlayerAction = ig.Class.extend({
        action: null,
        key: null,
        name: null,
        description: null,
        dmgType: null,
        stunType: false,
        status: false,

        init: function (key, data, element) {
            this.key = key;
            if (data && data.steps) {
                this.action = new ig.Action(key, data.steps, AIM_ACTIONS[key]);
                this.name = data.name ? new ig.LangLabel(data.name) : null;
                this.description = data.description ? new ig.LangLabel(data.description) : null;
                this.dmgType = sc.ACTION_DMG_TYPE[data.dmgType] || null;
                this.stunType = sc.ACTION_STUN_TYPE[data.stunType] || false;
                this.status = data.status || false;
                this.icon = sc.getCombatArtIcon(element, this.key)
            } else this.action = new ig.Action(key, data, AIM_ACTIONS[key])
        },

        clearCached: function () {
            this.action.clearCached()
        }
    });

    sc.PlayerSubConfig = ig.Class.extend({
        paramFactors: null,
        skillFactors: {},
        actions: {},
        baseParams: {},
        modifiers: {},
        activeBalls: {},
        activeActions: {},

        init: function (element, actionData) {
            this.paramFactors = ELEMENT_PARAM_FACTORS[element] || null;
            var elementIndex = element == "BASE" ? -1 : sc.ELEMENT[element],
                actionKey;
            for (actionKey in actionData) this.actions[actionKey] = new sc.PlayerAction(actionKey, actionData[actionKey], elementIndex);
            this.preSkillInit()
        },

        clearCached: function () {
            for (var key in this.actions) this.actions[key].clearCached()
        },

        preSkillInit: function () {
            this.skillFactors.hp = 0;
            this.skillFactors.attack = 0;
            this.skillFactors.defense = 0;
            this.skillFactors.focus = 0;
            this.skillFactors.elemFactor || (this.skillFactors.elemFactor = []);
            this.skillFactors.elemFactor[sc.ELEMENT.HEAT - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.COLD - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.SHOCK - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.WAVE - 1] = 0;
            for (var modifier in sc.MODIFIERS) this.skillFactors[modifier] = 0;
            this.activeBalls = {};
            for (var proxyKey in this.proxies) this.activeBalls[proxyKey] = this.proxies[proxyKey];
            this.activeActions = {};
            for (var actionKey in sc.PLAYER_ACTION) this.actions[actionKey] && (this.activeActions[sc.PLAYER_ACTION[actionKey]] = this.actions[actionKey])
        },

        /** Recompute baseParams and modifiers from the player's current params. */
        update: function (playerParams, modifierValues) {
            if (this.paramFactors) {
                for (var key in playerParams) this.baseParams[key] = Math.floor(playerParams[key] * (this.paramFactors[key] + this.skillFactors[key]));
                this.baseParams.elemFactor = this.baseParams.elemFactor || [];
                var elemFactors = playerParams.elemFactor;
                for (key = 0; key < this.paramFactors.elemFactor.length; ++key) this.baseParams.elemFactor[key] = (2 - elemFactors[key]) * (this.paramFactors.elemFactor[key] + this.skillFactors.elemFactor[key]);
                for (var modifierKey in sc.MODIFIERS) {
                    var value = 0;
                    modifierValues && modifierValues[modifierKey] !== void 0 && (value = modifierValues[modifierKey] - 1);
                    value = value + this.skillFactors[modifierKey];
                    this.modifiers[modifierKey] = value
                }
            }
        },

        getParam: function (key) {
            return this.baseParams[key]
        },

        getParamFactor: function (key) {
            return this.paramFactors[key]
        },

        getPlayerAction: function (key) {
            return this.actions[key]
        },

        getActiveCombatArtName: function (actionKey) {
            return this.activeActions[actionKey] && this.activeActions[actionKey].name
        },

        getAction: function (actionKey) {
            return this.activeActions[actionKey] && this.activeActions[actionKey].action
        },

        getActionMaxLevel: function (baseKey) {
            for (var level = 0; level < 3; ++level)
                if (!this.getAction(sc.PLAYER_ACTION[baseKey + (level + 1)])) break;
            return level
        },

        getBalls: function () {
            return this.activeBalls
        }
    })
});
ig.baked = !0;
