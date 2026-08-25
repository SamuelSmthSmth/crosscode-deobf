ig.module("game.feature.player.player-config").defines(function() {
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
    var b = {
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
        init: function(a) {
            this.name = a;
            this.parent(a.toLowerCase())
        },
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/players/", ".json") + ig.getCacheSuffix()
        },
        onload: function(a) {
            var b;
            b = ig.jsonTemplate.resolve(a);
            if (!b) throw Error("Can't find data of player '" + f + "'");
            for (var e in b.proxies) {
                a = b.proxies[e];
                this.proxies[e] = new sc.PROXY_TYPE[a.type ||
                    "BALL"](a)
            }
            this.clazz = b["class"];
            this.character = new sc.Character(b.character);
            this.animSheet = new ig.AnimationSheet(b.sheet);
            this.stats = b.stats;
            a = b.combatStyle || {};
            this.combatStyle.comboCount = a.comboCount || 4;
            this.combatStyle.throwCount = a.throwCount || 4;
            this.combatStyle.throwProb = a.throwProb || 0;
            this.combatStyle.sidewaySpeed = a.sidewaySpeed || 1;
            this.combatStyle.normDistance = a.normDistance || 120;
            this.combatStyle.meleeDistance = a.meleeDistance || 24;
            this.combatStyle.minDistance = a.minDistance || 48;
            this.combatStyle.foodSprites =
                a.foodSprites || null;
            this.combatStyle.foodOffset = a.foodOffset || null;
            this.combatStyle.foodBubbleOffset = a.foodBubbleOffset || null;
            this.walkAnims = b.walkAnims;
            if (this.autoequip = b.autoequip)
                for (a = 0; a < this.autoequip.length; ++a) this.autoequip[a].condition && (this.autoequip[a].condition = new ig.VarCondition(this.autoequip[a].condition));
            this.headIdx = b.headIdx || 0;
            this.baseConfig = new sc.PlayerSubConfig("BASE", b.actions.BASE);
            for (var f in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[f]] = new sc.PlayerSubConfig(f, b.actions[f]);
            if (b = b.skillRanking)
                for (a = 0; a < b.length; ++a) this.skillRanking.push(b[a].skill)
        },
        getCacheKey: function(a) {
            return a
        },
        onCacheCleared: function() {
            this.character.decreaseRef();
            this.baseConfig.clearCached();
            for (var a in this.elementConfigs[a]) this.elementConfigs[a].clearCached();
            for (var b in this.proxies) this.proxies[b].clearCached()
        }
    });
    sc.PlayerConfig.getElementBall = function(a, b, e) {
        e = e ? "charged" : "default";
        b == sc.ELEMENT.NEUTRAL ? e = e + "Neutral" : b == sc.ELEMENT.HEAT ? e = e + "Heat" : b == sc.ELEMENT.COLD ? e = e + "Cold" : b == sc.ELEMENT.WAVE ?
            e = e + "Wave" : b == sc.ELEMENT.SHOCK && (e = e + "Shock");
        return a.proxies[e]
    };
    var a = {
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
        init: function(a, c, e) {
            this.key = a;
            if (c && c.steps) {
                this.action = new ig.Action(a, c.steps, b[a]);
                this.name = c.name ? new ig.LangLabel(c.name) : null;
                this.description = c.description ? new ig.LangLabel(c.description) : null;
                this.dmgType = sc.ACTION_DMG_TYPE[c.dmgType] || null;
                this.stunType = sc.ACTION_STUN_TYPE[c.stunType] || false;
                this.status = c.status || false;
                this.icon = sc.getCombatArtIcon(e, this.key)
            } else this.action = new ig.Action(a, c, b[a])
        },
        clearCached: function() {
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
        init: function(b, c) {
            this.paramFactors = a[b] || null;
            var e = b == "BASE" ? -1 : sc.ELEMENT[b],
                f;
            for (f in c) this.actions[f] = new sc.PlayerAction(f, c[f], e);
            this.preSkillInit()
        },
        clearCached: function() {
            for (var a in this.actions) this.actions[a].clearCached()
        },
        preSkillInit: function() {
            this.skillFactors.hp = 0;
            this.skillFactors.attack = 0;
            this.skillFactors.defense = 0;
            this.skillFactors.focus =
                0;
            this.skillFactors.elemFactor || (this.skillFactors.elemFactor = []);
            this.skillFactors.elemFactor[sc.ELEMENT.HEAT - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.COLD - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.SHOCK - 1] = 0;
            this.skillFactors.elemFactor[sc.ELEMENT.WAVE - 1] = 0;
            for (var a in sc.MODIFIERS) this.skillFactors[a] = 0;
            this.activeBalls = {};
            for (var b in this.proxies) this.activeBalls[b] = this.proxies[b];
            this.activeActions = {};
            for (var e in sc.PLAYER_ACTION) this.actions[e] && (this.activeActions[sc.PLAYER_ACTION[e]] =
                this.actions[e])
        },
        update: function(a, b) {
            if (this.paramFactors) {
                for (var e in a) this.baseParams[e] = Math.floor(a[e] * (this.paramFactors[e] + this.skillFactors[e]));
                this.baseParams.elemFactor = this.baseParams.elemFactor || [];
                var f = a.elemFactor;
                for (e = 0; e < this.paramFactors.elemFactor.length; ++e) this.baseParams.elemFactor[e] = (2 - f[e]) * (this.paramFactors.elemFactor[e] + this.skillFactors.elemFactor[e]);
                for (var g in sc.MODIFIERS) {
                    e = 0;
                    b && b[g] !== void 0 && (e = b[g] - 1);
                    e = e + this.skillFactors[g];
                    this.modifiers[g] = e
                }
            }
        },
        getParam: function(a) {
            return this.baseParams[a]
        },
        getParamFactor: function(a) {
            return this.paramFactors[a]
        },
        getPlayerAction: function(a) {
            return this.actions[a]
        },
        getActiveCombatArtName: function(a) {
            return this.activeActions[a] && this.activeActions[a].name
        },
        getAction: function(a) {
            return this.activeActions[a] && this.activeActions[a].action
        },
        getActionMaxLevel: function(a) {
            for (var b = 0; b < 3; ++b)
                if (!this.getAction(sc.PLAYER_ACTION[a + (b + 1)])) break;
            return b
        },
        getBalls: function() {
            return this.activeBalls
        }
    })
});
ig.baked = !0;
