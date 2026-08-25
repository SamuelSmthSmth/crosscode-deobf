ig.module("game.feature.combat.combat").requires("impact.base.game", "impact.feature.effect.effect-sheet", "impact.feature.database.database", "impact.feature.navigation.navigation", "game.feature.model.game-model").defines(function() {
    sc.COMBATANT_PARTY = {
        PLAYER: 1,
        ENEMY: 2,
        OTHER: 3
    };
    sc.COMBATANT_MATERIAL = {
        METAL: 1,
        ORGANIC: 2
    };
    sc.COMBAT_ENEMY_SORT_TYPE = {
        ORDER: 0,
        NAME: 1,
        LEVEL: 2,
        AREA: 3
    };
    var b = {};
    b[sc.ELEMENT.NEUTRAL] = "neutral";
    b[sc.ELEMENT.HEAT] = "heat";
    b[sc.ELEMENT.COLD] = "cold";
    b[sc.ELEMENT.SHOCK] = "shock";
    b[sc.ELEMENT.WAVE] =
        "wave";
    sc.THROW_SOUND_CLASS = {
        HEXACAST: "Hexa"
    };
    sc.ATTACK_FREQUENCY = {
        SPAMM: {
            gap: 0.25
        },
        OFTEN: {
            gap: 0.5
        },
        NORMAL: {
            gap: 1
        },
        SOMETIMES: {
            gap: 2.5
        },
        RARE: {
            gap: 5
        },
        VERY_RARE: {
            gap: 10
        }
    };
    var a = [1, 0.85, 0.7],
        d = [],
        c;
    for (c in sc.ATTACK_FREQUENCY) d.push(c);
    sc.COMBAT_EVENT = {
        DEFEATED: 1
    };
    var e = {};
    c = e[sc.ELEMENT.NEUTRAL] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/ball-hit-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light3.ogg",
        1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light4.ogg", 1, 0.1, "hitLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/ball-hit-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium4.ogg", 1, 0.1, "hitMedium")];
    c[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/ball-hit-hard1.ogg",
        1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard4.ogg", 1, 0.1, "hitHeavy")];
    c[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/ball-hit-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/ball-hit-hard4.ogg", 1, 0.1, "hitMassive")];
    c = e[sc.ELEMENT.HEAT] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/fire-hit-light1.ogg",
        1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light4.ogg", 1, 0.1, "hitLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/fire-hit-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium3.ogg", 1,
        0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium4.ogg", 1, 0.1, "hitMedium")];
    c[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/fire-hit-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard4.ogg", 1, 0.1, "hitHeavy")];
    c[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/fire-hit-hard3.ogg",
        1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/fire-hit-hard4.ogg", 1, 0.1, "hitMassive")];
    c = e[sc.ELEMENT.COLD] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light4.ogg", 1, 0.1, "hitLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium4.oggg", 1, 0.1, "hitMedium")];
    c[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard2.ogg",
        1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard4.ogg", 1, 0.1, "hitHeavy")];
    c[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard4.ogg", 1, 0.1, "hitMassive")];
    c = e[sc.ELEMENT.SHOCK] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-light1.ogg",
        1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light4.ogg", 1, 0.1, "hitLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium3.ogg",
        1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium4.oggg", 1, 0.1, "hitMedium")];
    c[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard4.ogg", 1, 0.1, "hitHeavy")];
    c[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard3.ogg",
        1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard4.ogg", 1, 0.1, "hitMassive")];
    c = e[sc.ELEMENT.WAVE] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light4.ogg", 1, 0.1, "hitLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium4.oggg", 1, 0.1, "hitMedium")];
    c[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard2.ogg",
        1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard4.ogg", 1, 0.1, "hitHeavy")];
    c[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard4.ogg", 1, 0.1, "hitMassive")];
    var f = {
            ignore: new ig.Sound("media/sound/battle/ball-kill.ogg", 0.8, 0.1),
            shielded: new ig.Sound("media/sound/battle/hit-block.ogg",
                0.8, 0.05),
            perfectShielded: new ig.Sound("media/sound/battle/hit-counter-echo.ogg", 1, 0.05),
            neutralized: new ig.Sound("media/sound/battle/blubb-4.ogg", 1, 0.05)
        },
        g = {};
    c = g[sc.COMBATANT_MATERIAL.METAL] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/hit-metal-light-2.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-metal-light-3.ogg", 0.6, 0.1, "hitMatLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/hit-metal-medium-1.ogg", 1, 0.1, "hitMatMedium"),
        new ig.Sound("media/sound/battle/airon/hit-metal-medium-2.ogg", 1, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-metal-medium-3.ogg", 1, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-metal-medium-4.ogg", 1, 0.1, "hitMatMedium")
    ];
    c = g[sc.COMBATANT_MATERIAL.ORGANIC] = {};
    c[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/hit-organic-1.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-organic-2.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-organic-3.ogg",
        0.6, 0.1, "hitMatLight")];
    c[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/hit-organic-deep-1.ogg", 0.8, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-organic-deep-2.ogg", 0.8, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-organic-deep-3.ogg", 0.8, 0.1, "hitMatMedium")];
    sc.DRAMATIC_EFFECT = {
        HP_BREAK_ZOOM: {
            timeFactor: 0.1,
            wait: 0.5,
            blurDuration: 0.2,
            clearTime: 0.2,
            zoom: 1.5,
            camera: 1,
            alwaysFocus: true,
            speedlines: true
        },
        LAST_ENEMY_ZOOM: {
            timeFactor: 0.001,
            wait: 0.5,
            blurDuration: 0.2,
            clearTime: 0.2,
            zoom: 1.5,
            camera: 1,
            alwaysFocus: true,
            speedlines: true
        },
        BOSS_ZOOM: {
            timeFactor: 0.001,
            wait: 1,
            blurDuration: 0.7,
            clearTime: 1,
            zoom: 1.5,
            camera: 1,
            alwaysFocus: true,
            speedlines: true
        },
        BREAK_NONE: {
            timeFactor: 0,
            wait: 0,
            clearTime: 0,
            zoom: 0,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 2,
            blurDuration: 0,
            blurType: "NONE"
        },
        BREAK_NO_TEXT: {
            timeFactor: 0,
            wait: 0,
            clearTime: 0,
            "break": true,
            zoom: 0,
            camera: 2,
            blurDuration: 0,
            blurType: "NONE"
        },
        BREAK_LIGHT: {
            timeFactor: 0.001,
            wait: 0.1,
            clearTime: 0.1,
            zoom: 1,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 2,
            blurDuration: 0.1,
            blurType: "LIGHT",
            speedlines: true
        },
        BREAK: {
            timeFactor: 0.001,
            wait: 0.2,
            clearTime: 0.1,
            zoom: 1.25,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 2,
            blurDuration: 0.1,
            blurType: "LIGHT",
            speedlines: true
        },
        BREAK_ALWAYS: {
            timeFactor: 0.001,
            wait: 0.2,
            clearTime: 0.1,
            zoom: 1.25,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 2,
            blurDuration: 0.1,
            blurType: "LIGHT",
            alwaysFocus: true,
            speedlines: true
        },
        BREAK_BIG: {
            timeFactor: 0.001,
            wait: 0.4,
            clearTime: 0.1,
            zoom: 1.5,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 1,
            blurDuration: 0.1,
            blurType: "LIGHT",
            alwaysFocus: true,
            speedlines: true
        },
        BREAK_WIDE: {
            timeFactor: 0.001,
            wait: 0.4,
            clearTime: 0.1,
            zoom: 1.25,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 1,
            blurDuration: 0.1,
            blurType: "LIGHT",
            alwaysFocus: true,
            speedlines: true
        },
        BREAK_WIDE_NOSLOW: {
            timeFactor: 1,
            wait: 0.4,
            clearTime: 0.1,
            zoom: 1.25,
            label: "sc.gui.combat-msg.break",
            "break": true,
            camera: 1,
            blurDuration: 0.1,
            blurType: "LIGHT",
            alwaysFocus: true,
            speedlines: true
        },
        OVERLOAD: {
            timeFactor: 0.001,
            wait: 1,
            clearTime: 0.3,
            zoom: 1,
            camera: 1,
            blurDuration: 0.7,
            speedlines: true
        },
        GUARD_COUNTER: {
            timeFactor: 0.001,
            wait: 0.2,
            clearTime: 0.1,
            zoom: 1.25,
            label: "sc.gui.combat-msg.guard-counter",
            camera: 2,
            blurDuration: 0.1,
            blurType: "LIGHT",
            speedlines: true
        },
        GUARD_BREAK: {
            timeFactor: 0.1,
            wait: 0.4,
            label: "sc.gui.combat-msg.guard-break",
            clearTime: 0.1,
            zoom: 1,
            camera: 1,
            blurDuration: 0.3,
            blurType: "LIGHT",
            speedlines: true
        },
        RANK_UP: {
            timeFactor: 1,
            wait: 0.3,
            blurDuration: 0.2,
            clearTime: 0.2,
            blurType: "LIGHT"
        },
        S_RANK: {
            timeFactor: 0.025,
            wait: 0.2,
            earlyCameraOut: 3,
            cameraOutOverlap: 1,
            clearTime: 0.8,
            zoom: 2,
            cameraBackTime: 1,
            camera: 1,
            blurDuration: 0.2,
            speedlines: true,
            blurType: "LIGHTER"
        },
        PVP_KO: {
            timeFactor: 0.001,
            wait: 0.5,
            blurDuration: 0.2,
            clearTime: 0.2,
            zoom: 1.5,
            camera: 2,
            speedlines: true
        },
        PVP_FINAL_KO: {
            timeFactor: 0.001,
            wait: 1,
            blurDuration: 0.7,
            clearTime: 1,
            zoom: 1.5,
            camera: 2,
            speedlines: true
        },
        ARENA_FINAL_KO: {
            timeFactor: 0.001,
            wait: 1,
            blurDuration: 0.7,
            clearTime: 1,
            zoom: 1.5,
            camera: 1,
            arena: true,
            speedlines: true
        },
        ONCE_MORE: {
            timeFactor: 0.001,
            wait: 0.6,
            label: "sc.gui.combat-msg.once-more",
            clearTime: 0.3,
            zoom: 1,
            camera: 1,
            blurDuration: 0.4,
            speedlines: true
        },
        ELEMENT_SHIELD: {
            timeFactor: 0.001,
            wait: 0.2,
            clearTime: 0.1,
            zoom: 1.125,
            camera: 1,
            blurDuration: 0.1,
            blurType: "LIGHT"
        },
        PERFECT_DASH: {
            timeFactor: 0.1,
            wait: 0.2,
            clearTime: 0.1,
            zoom: 1.125,
            camera: 1,
            blurDuration: 0.1,
            blurType: "LIGHT"
        }
    };
    sc.COMBAT_MSG_TYPE = {
        STUN_CANCEL: {
            icon: "\\i[stun-cancel]",
            msg: "sc.gui.combat.stun",
            keepPos: true,
            duration: 1
        }
    };
    sc.MIN_KILLS = 10;
    var h = Vec2.create(),
        i = Vec2.create(),
        j = Vec2.create(),
        k = Vec2.create(),
        l = Vec2.create(),
        o = Vec2.create(),
        m = Vec3.create(),
        n = Vec2.create(),
        p = {
            damagingEntity: null,
            attackInfo: null
        };
    sc.Combat = ig.GameAddon.extend({
        listeners: [],
        actionToken: {},
        freeLineCommands: [],
        activeCombatants: {},
        forces: [],
        active: true,
        time: 0,
        speed: 1,
        recentlyAttacked: [],
        playerStartedCombat: false,
        collabs: [],
        hideDamageNumbers: false,
        effects: {
            hit: new ig.EffectSheet("default-hit"),
            guard: new ig.EffectSheet("guard"),
            combat: new ig.EffectSheet("combat"),
            combatant: new ig.EffectSheet("combatant"),
            "throw": new ig.EffectSheet("throw"),
            mode: new ig.EffectSheet("combat.mode"),
            heal: new ig.EffectSheet("drops"),
            cooldownHandle: null
        },
        cooldownTick: {
            sounds: [{
                below: 0.6,
                sound: new ig.Sound("media/sound/battle/rank-timeout-01.ogg", 1)
            }, {
                below: 0.2,
                sound: new ig.Sound("media/sound/battle/rank-timeout-02.ogg", 1)
            }],
            hasCooldown: false,
            currentSound: -1,
            endSound: new ig.Sound("media/sound/battle/rank-timeout-03.ogg", 1),
            handle: null
        },
        stats: {
            killStreak: 0,
            killedEnemies: [],
            prevRank: 0
        },
        finalDramaticEffect: null,
        respawnBlocker: [],
        enemyDataList: null,
        init: function() {
            this.parent("Combat");
            sc.Model.addObserver(sc.model,
                this);
            this.activeCombatants[sc.COMBATANT_PARTY.PLAYER] = [];
            this.activeCombatants[sc.COMBATANT_PARTY.ENEMY] = [];
            this.activeCombatants[sc.COMBATANT_PARTY.OTHER] = [];
            window.wm && ig.database.register("enemies", "EnemyEnumEditor", "Enemies");
            this.enemyDataList = ig.database.get("enemies");
            for (var a in this.enemyDataList)
                if (this.enemyDataList[a].track)
                    for (var b = this.enemyDataList[a].descriptions, c = b.length; c--;)
                        if (b[c].condition) {
                            var d = new ig.VarCondition(b[c].condition);
                            b[c].condObj = d
                        } ig.vars.registerVarAccessor("combat",
                this, "VarCombatEditor")
        },
        _unlockAllEnemies: function() {
            for (var a in this.enemyDataList) this.enemyDataList[a].track && sc.stats.setMap("combat", "kill" + a, 999)
        },
        setCombatSpeed: function(a) {
            this.speed = a
        },
        getTotalEnemiesFound: function(a, b) {
            var c = 0,
                d = 0,
                e;
            for (e in this.enemyDataList) {
                var f = this.enemyDataList[e];
                if (f.track && !f.extension)
                    if (b) {
                        if (f.category == b) {
                            (sc.stats.getMap("combat", "kill" + e) >= 1 || sc.stats.getMap("combat", "kill" + e) <= -1) && c++;
                            d++
                        }
                    } else {
                        (sc.stats.getMap("combat", "kill" + e) >= 1 || sc.stats.getMap("combat",
                            "kill" + e) <= -1) && c++;
                        d++
                    }
            }
            return a ? c / d : c
        },
        getTotalEnemyReportsFound: function(a, b, c) {
            var d = 0,
                e = 0,
                f = this.enemyDataList,
                g = 0,
                h = 0,
                i;
            for (i in f)
                if (f[i].track && !f[i].extension && !(b && f[i].category != b)) {
                    if (c) {
                        (sc.stats.getMap("combat", "kill" + i) >= 1 || sc.stats.getMap("combat", "kill" + i) <= -1) && g++;
                        h++
                    }
                    var j = f[i].boss ? 1 : f[i].kills || sc.MIN_KILLS;
                    (sc.stats.getMap("combat", "kill" + i) <= -1 || sc.stats.getMap("combat", "kill" + i) >= j) && d++;
                    e++
                } if (c) {
                c.enemies = g / h;
                c.reports = d / e
            } else return a ? d / e : d
        },
        getEnemyMenuOffset: function(a) {
            return !this.enemyDataList[a] ?
                null : this.enemyDataList[a].offset || null
        },
        isEnemyAnalyzable: function(a) {
            return !a || !this.enemyDataList[a] ? false : !this.enemyDataList[a].disableAnalyze
        },
        addActiveCombatant: function(a) {
            if (this.activeCombatants[a.party].indexOf(a) != -1) throw Error("Tried to add same combatant as active twice!");
            this.activeCombatants[a.party].push(a);
            if (a.party == sc.COMBATANT_PARTY.ENEMY && a.aggression == sc.ENEMY_AGGRESSION.THREAT) {
                this.recentlyAttacked.push(a);
                a.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED && this.effects.combatant.spawnOnTarget("boosted",
                    a, {
                        align: "CENTER",
                        group: "_boostedFX",
                        duration: -1
                    })
            }
        },
        removeActiveCombatant: function(a) {
            this.activeCombatants[a.party].erase(a);
            ig.EffectTools.clearEffects(a, "_boostedFX")
        },
        changeCombatantParty: function(a, b) {
            a.target && this.removeActiveCombatant(a);
            a.party = b;
            a.target && this.addActiveCombatant(a)
        },
        areSpawnersCleared: function() {
            for (var a = ig.game.getEntitiesByType(ig.ENTITY.EnemySpawner), b = a.length; b--;)
                if (!a[b].isCleared()) return false;
            return true
        },
        getActiveCombatantCount: function(a, b) {
            if (a == sc.COMBATANT_PARTY.PLAYER) return sc.party.getStrategy("BEHAVIOUR").onlyTargetPlayer ?
                1 : 1 + sc.party.getPartySizeAlive(true);
            for (var c = this.activeCombatants[a], d = 0, e = c.length; e--;) b && c[e].enemyName != b || c[e].aggression != sc.ENEMY_AGGRESSION.PEACEFUL && d++;
            return d
        },
        getActiveCombatants: function(a, b) {
            for (var c = ig.copy(this.activeCombatants[a]), d = c.length; d--;) c[d].isDefeated() ? c.splice(d, 1) : b && (!c[d].isPlayer && !ig.EntityTools.isInScreen(c[d], 32)) && c.splice(d, 1);
            return c
        },
        isDamageIgnore: function() {
            return sc.model.isCutscene() || sc.model.isTeleport() || ig.game.events.getBlockingEventCall()
        },
        getEnemyTarget: function() {
            if (sc.party.getStrategy("BEHAVIOUR").onlyTargetPlayer) return ig.game.playerEntity;
            for (var a = [ig.game.playerEntity], b = 0; b < sc.party.currentParty.length; ++b) this._addPartyMember(a, sc.party.getPartyMemberEntityByIndex(b), sc.party.ai.targeting > 0);
            if (sc.party.ai.targeting > 0 && a.length > 1 && Math.random() < sc.party.ai.targeting) a.splice(0, 1);
            else if (sc.party.ai.targeting < 0 && a.length > 1 && Math.random() < -sc.party.ai.targeting) a.length = 1;
            return a[Math.floor(Math.random() * a.length)]
        },
        _addPartyMember: function(a,
            b, c) {
            b && (c || ig.EntityTools.isInScreen(b, 32)) && a.push(b)
        },
        getPlayerTarget: function(a) {
            var b = ig.game.playerEntity.combatStats.lastTarget,
                c = sc.party.getStrategy("TARGET");
            if (c.same && b && !b.isDefeated() && !b._killed) return b;
            for (var d = this.getActiveCombatants(sc.COMBATANT_PARTY.ENEMY, true), e = d.length; e--;)
                if (ig.navigation.isPathAvailable(a, d[e])) {
                    if (sc.EnemyAnno.doesRandomlyUnderstand(d[e], a)) {
                        if (sc.EnemyAnno.isVulnerable(d[e]) || sc.EnemyAnno.isWeak(d[e])) return d[e];
                        sc.EnemyAnno.isImmune(d[e]) && d.length >
                            1 && d.splice(e, 1)
                    }
                } else d.splice(e, 1);
            b && (d.length > 1 && !c.same) && d.erase(b);
            return d[Math.floor(Math.random() * d.length)]
        },
        getActiveEnemiesNames: function() {
            for (var a = [], b = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], c = b.length; c--;) a.indexOf(b[c].enemyName) == -1 && a.push(b[c].enemyName);
            return a
        },
        getEnemyName: function(a) {
            return this.enemyDataList[a] ? ig.LangLabel.getText(this.enemyDataList[a].name) : "\\c[1]ERROR\\c[0]"
        },
        getEnemyCategory: function(a) {
            return this.enemyDataList[a] ? sc.ENEMY_CATEGORY[this.enemyDataList[a].category ||
                "ANIMALS"] : sc.ENEMY_CATEGORY.ANIMALS
        },
        canShowBoosted: function(a) {
            return !a.boss && sc.stats.getMap("combat", "kill" + a.path) > 0 && this.getEnemyCategory(a.path) != sc.ENEMY_CATEGORY.PLAYERS
        },
        canShowBoostedEntry: function(a, b) {
            return !b && sc.stats.getMap("combat", "kill" + a) > 0 && this.getEnemyCategory(a) != sc.ENEMY_CATEGORY.PLAYERS
        },
        getEnemyLevel: function(a) {
            return this.enemyDataList[a] ? this.enemyDataList[a].level : 1
        },
        getEnemyArea: function(a) {
            return this.enemyDataList[a] ? sc.map.getAreaName(this.enemyDataList[a].area,
                true) : "\\c[1]ERROR\\c[0]"
        },
        getEnemyDrops: function(a) {
            return this.enemyDataList[a] ? this.enemyDataList[a].itemDrops : "\\c[1]ERROR\\c[0]"
        },
        setScreenEnemiesTarget: function(a) {
            for (var b = ig.game.shownEntities, c = b.length; c--;) {
                var d = b[c];
                d instanceof ig.ENTITY.Enemy && ig.EntityTools.isInScreen(d, 0) && d.setTarget(a, true)
            }
        },
        removeEnemies: function(a, b, c, d) {
            for (var e = ig.game.shownEntities, f = e.length; f--;) {
                var g = e[f];
                g instanceof ig.ENTITY.Enemy && !g.isDefeated() && (g != b && !(a && g.enemyName != a)) && g.instantDefeat(c,
                    d)
            }
        },
        setFinalDramaticEffect: function(a) {
            this.finalDramaticEffect = a
        },
        onCombatantDeathHit: function(a, b) {
            var c = sc.pvp.onPvpCombatantDefeat(b);
            c && a && this.doDramaticEffect(a, b, c, true);
            if (b.isPlayer && !b.manualKill && !sc.pvp.isActive()) {
                c = ig.vars.get("stats.deaths") || 0;
                ig.game.respawn();
                ig.vars.set("stats.deaths", c + 1)
            } else if (b.party == sc.COMBATANT_PARTY.ENEMY) {
                c = false;
                sc.arena.onCombatantDeathHit(a, b);
                if (this.finalDramaticEffect) {
                    for (var d = this.activeCombatants[b.party], e = 0, f = d.length; f--;) {
                        var g = d[f];
                        (!g.params ||
                            !g.params.isDefeated()) && e++
                    }
                    if (e == 0) {
                        if (!c && a) {
                            this.doDramaticEffect(a || b, b, this.finalDramaticEffect, true);
                            c = true
                        }
                        if (this.finalDramaticEffect.arena) sc.arena.onFinalDeathHit();
                        this.finalDramaticEffect = null
                    }
                }
                e = sc.model.increaseCombatRank(1 * b.enemyType.enduranceScale);
                d = b.getAlignedPos(ig.ENTITY_ALIGN.CENTER, m);
                if (e) {
                    if (sc.model.isSRank() && sc.options.get("s-rank-effects")) {
                        c = this.effects.combat.spawnFixed("rankS", d.x, d.y, d.z);
                        c.setIgnoreSlowdown();
                        this.doDramaticEffect(a, b, sc.DRAMATIC_EFFECT.S_RANK,
                            true)
                    } else {
                        e = "rank" + sc.model.getCombatRankLabel();
                        this.effects.combat.spawnFixed(e, d.x, d.y, d.z);
                        c || this.doDramaticEffect(a || b, b, sc.DRAMATIC_EFFECT.RANK_UP)
                    }
                    c = ig.lang.get("sc.gui.combat-msg.rank-up") + " " + sc.model.getCombatRankLabel();
                    c = new sc.SmallEntityBox(b, c, 2);
                    ig.gui.addGuiElement(c)
                } else if (sc.model.isSRank() && sc.options.get("s-rank-effects")) {
                    c = this.effects.combat.spawnFixed("sRankKill", d.x, d.y, d.z);
                    c.setIgnoreSlowdown()
                }
            }
        },
        showCombatantLabel: function(a, b, c) {
            var d = sc.SMALL_BOX_ALIGN.TOP,
                e = -10;
            if (a.dmgZFocus) {
                d = sc.SMALL_BOX_ALIGN.BOTTOM;
                e = a.dmgZFocus
            } else if (a.cameraZFocus) {
                d = sc.SMALL_BOX_ALIGN.BOTTOM;
                e = a.cameraZFocus + 48
            }
            a = new sc.SmallEntityBox(a, b, c || 1, d, e);
            ig.gui.addGuiElement(a)
        },
        showCombatMessage: function(a, b) {
            var c = b.icon + ig.lang.get(b.msg),
                c = new sc.SmallEntityBox(a, c, b.duration || 0.5, sc.SMALL_BOX_ALIGN.CENTER);
            b.keepPos && c.setFixedPos();
            ig.gui.addGuiElement(c)
        },
        hasCollabs: function() {
            return this.collabs.length > 0
        },
        doDramaticEffect: function(a, b, c, d) {
            if (c.label) {
                var e = ig.lang.get(c.label);
                this.showCombatantLabel(b, e)
            }
            a || (a = b);
            b || (b = a);
            e = [];
            d = d || a.isPlayer || c.alwaysFocus;
            c.speedlines && sc.options.get("speedlines") && e.push({
                type: "SHOW_EFFECT",
                entity: b,
                align: "CENTER",
                effect: {
                    sheet: "speedlines",
                    name: "speedlinesDramatic"
                },
                duration: c.wait + (c.earlyCameraOut || 0) - (c.cameraOutOverlap || 0) + 0.05,
                ignoreSlowMo: true
            });
            if (d) {
                e.push({
                    type: "ADD_SLOW_MOTION",
                    name: "levelUp",
                    factor: c.timeFactor,
                    time: c.timeFadeIn || 0
                });
                c.camera == 1 && e.push({
                    type: "SET_CAMERA_TARGET",
                    entity: b,
                    speed: 0.1,
                    transition: "EASE_OUT",
                    zoom: c.zoom || 1
                });
                c.camera == 2 && e.push({
                    type: "SET_CAMERA_BETWEEN",
                    entity1: a,
                    entity2: b,
                    speed: 0.1,
                    transition: "EASE_OUT",
                    zoom: c.zoom || 1
                })
            }
            c.blurDuration && e.push({
                type: "SET_ZOOM_BLUR",
                zoomType: c.blurType || "MEDIUM",
                fadeIn: 0.1,
                duration: c.blurDuration,
                fadeOut: 0.2,
                target: b
            });
            e.push({
                type: "WAIT",
                time: c.wait,
                ignoreSlowDown: true
            });
            if (c.earlyCameraOut && c.camera) {
                e.push({
                    type: "SET_CAMERA_ZOOM",
                    zoom: 1,
                    duration: c.earlyCameraOut,
                    transition: "EASE_IN_OUT"
                });
                e.push({
                    type: "WAIT",
                    time: c.earlyCameraOut - c.cameraOutOverlap,
                    ignoreSlowDown: true
                })
            }
            if (d) {
                e.push({
                    type: "CLEAR_SLOW_MOTION",
                    name: "levelUp",
                    time: c.clearTime
                });
                c.camera && e.push({
                    type: "UNDO_CAMERA",
                    speed: c.cameraBackTime || 1,
                    transition: "EASE_IN_OUT",
                    wait: true
                })
            }
            a = new ig.Event({
                steps: e
            });
            ig.game.events.callEvent(a, ig.EventRunType.INTERRUPTABLE)
        },
        sendEnemyMessage: function(a, b) {
            this.sendGlobalEnemyEvent(a, sc.COMBAT_ENEMY_EVENT.ENEMY_MSG, {
                key: b
            })
        },
        sendGlobalEnemyEvent: function(a, b, c) {
            for (var d = ig.game.shownEntities, e = d.length; e--;) {
                var f = d[e];
                if (f instanceof ig.ENTITY.Enemy &&
                    !f.isDefeated() && f.onEnemyEvent) f.onEnemyEvent(a, b, c)
            }
        },
        postUpdateOrder: 500,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused) {
                if (this.active) this.time = this.time + ig.system.tick;
                if (this.recentlyAttacked.length > 0) {
                    for (var a = 0, b = [], c = this.recentlyAttacked.length; c--;) {
                        var d = this.recentlyAttacked[c],
                            a = Math.max(a, d.enemyType.level);
                        b.indexOf(d.enemyName) == -1 && b.push(d.enemyName)
                    }
                    c = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY].length <= this.recentlyAttacked.length;
                    !sc.model.isForceCombat() && !sc.arena.active &&
                        sc.commonEvents.triggerEvent("ENEMY_ATTACKS", {
                            enemies: b,
                            levelGap: a - sc.model.player.level,
                            playerStarted: this.playerStartedCombat,
                            battleStarted: c
                        });
                    this.recentlyAttacked.length = 0;
                    this.playerStartedCombat = false
                }
                for (c = this.forces.length; c--;) {
                    a = this.forces[c];
                    (b = a.combatantRoot) && ig.vars.pushEntityAccessor(b);
                    if (!a.combatantRoot || a.update()) {
                        if (a.onEnd) a.onEnd();
                        a.onActionEndDetach();
                        this.forces.splice(c, 1)
                    }
                    b && ig.vars.popEntityAccessor(b)
                }
                for (var e in this.actionToken) {
                    this.actionToken[e] = this.actionToken[e] -
                        ig.system.tick;
                    this.actionToken[e] <= 0 && delete this.actionToken[e]
                }
                for (c = this.freeLineCommands.length; c--;) {
                    e = this.freeLineCommands[c];
                    e.time = e.time - ig.system.tick;
                    (e.time <= 0 || e.entity.hasStun()) && this.freeLineCommands.splice(c, 1)
                }
                e = -1;
                if (sc.model.isCombatCooldown() && sc.options.get("s-rank-effects")) {
                    this.cooldownTick.hasCooldown = true;
                    a = sc.model.getCombatCooldownFactor();
                    for (c = this.cooldownTick.sounds.length; c--;)
                        if (a < this.cooldownTick.sounds[c].below) {
                            e = c;
                            break
                        }
                }
                if (e !== this.cooldownTick.currentSound) {
                    this.cooldownTick.currentSound =
                        e;
                    if (this.cooldownTick.handle) {
                        this.cooldownTick.handle.stop();
                        this.cooldownTick.handle = null
                    }
                    if (e !== -1) {
                        c = this.cooldownTick.sounds[e];
                        this.cooldownTick.handle = c.sound.play(true, {
                            speed: c.speed
                        })
                    }
                }
            }
        },
        onReset: function() {
            this.stats.killStreak = 0;
            this.stats.killedEnemies.length = 0;
            this.respawnBlocker.length = 0;
            this.recentlyAttacked.length = 0;
            this.finalDramaticEffect = null
        },
        onLevelLoadStart: function() {
            this.respawnBlocker.length = 0;
            this.finalDramaticEffect = null;
            this.hideDamageNumbers = false
        },
        onVarAccess: function(a,
            b) {
            if (b[0] == "combat") {
                var c = b.slice(2).join("."),
                    c = c ? c.replace(/\//g, ".") : null;
                switch (b[1]) {
                    case "name":
                        return this.getEnemyName(c);
                    case "activeCnt":
                        return this.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, c);
                    case "spawnersCleared":
                        return this.areSpawnersCleared();
                    case "active":
                        return sc.model.isCombatActive();
                    case "enemiesFound":
                        return this.getTotalEnemiesFound(true);
                    case "enemyReportsFound":
                        return this.getTotalEnemyReportsFound(true)
                }
            }
            throw Error("Unsupported var access path: " + a);
        },
        modelChanged: function(a,
            b, c) {
            if (a instanceof sc.GameModel)
                if (b == sc.GAME_MODEL_MSG.STATE_CHANGED) this.setActive(!a.isCutscene());
                else if (b == sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED)
                if (c != void 0)
                    if (c) {
                        this.stats.killStreak = 0;
                        this.stats.killedEnemies.length = 0;
                        this.stats.prevRank = sc.model.getCombatRank()
                    } else {
                        if (this.cooldownTick.hasCooldown) {
                            this.cooldownTick.hasCooldown = false;
                            this.cooldownTick.handle && this.cooldownTick.handle.stop();
                            this.cooldownTick.currentSound = -1;
                            !ig.game.isReset && sc.options.get("s-rank-effects") && this.cooldownTick.endSound.play()
                        }
                        sc.arena.active ||
                            sc.commonEvents.triggerEvent("BATTLE_OVER", {
                                enemies: this.stats.killedEnemies,
                                killCount: this.stats.killStreak,
                                rank: this.stats.prevRank
                            });
                        sc.stats.setMapMax("combat", "streakKilled", this.stats.killStreak)
                    }
            else if (sc.model.isCombatCooldown()) {
                sc.arena.active || sc.commonEvents.triggerEvent("COOLDOWN_START", {
                    enemies: this.stats.killedEnemies,
                    killCount: this.stats.killStreak,
                    rank: sc.model.getCombatRank(),
                    prevRank: this.stats.prevRank
                });
                this.stats.killedEnemies.length = 0;
                this.stats.prevRank = sc.model.getCombatRank()
            }
        },
        addCombatForce: function(a) {
            this.forces.push(a)
        },
        setActive: function(a) {
            this.active = a
        },
        forceEnd: function() {
            for (var a = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], b = a.length; b--;) a[b].setTarget(null);
            sc.model.cancelCombatCooldown()
        },
        addCombatListener: function(a) {
            this.listeners.push(a)
        },
        removeCombatListener: function(a) {
            this.listeners.erase(a)
        },
        gatherCollaborators: function(a, b, c, d, e, f) {
            for (var g = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], h = g.length, e = e || d, i = 0; h--;) {
                var j = g[h];
                if (f || !j.hasStun())
                    if (!j.params ||
                        !j.params.defeated) {
                        j.params && j.params.isLocked() && j.params.clearLock();
                        if (!j.collaboration && j.collabReady(b) && a.addParticipant(j, b, c)) {
                            i++;
                            if (i == e) return true
                        }
                    }
            }
            return i >= d
        },
        getNearbyThreat: function(a, b, c, d) {
            for (var e = a.coll.pos, f = a.coll.size, b = ig.game.getEntitiesInRectangle(e.x - b, e.y - b, e.z, f.x + 2 * b, f.y + 2 * b, f.z + b, a), e = b.length; e--;) {
                f = b[e];
                if (f.getCombatant) {
                    var g = f.getCombatant();
                    if (g && g.party != a.party) {
                        g = f.getAttackInfo && f.getAttackInfo();
                        if (!g && (!f.isThreat || Vec2.isZero(f.coll.vel)))
                            if (!(a instanceof sc.PartyMemberEntity) || !(f instanceof ig.ENTITY.Enemy) || !sc.EnemyAnno.needDodge(f, a)) continue;
                        if (!g || !g.hasNoEffect()) {
                            var h = null;
                            if (g) {
                                p.damagingEntity = f;
                                p.attackInfo = g;
                                h = p
                            }
                            if (!d || d.check(a, Math.random(), h)) {
                                g = ig.CollTools.getDistVec2(a.coll, f.coll, k);
                                if (!(Vec2.angle(g, a.face) > Math.PI * c)) {
                                    Vec2.flip(g);
                                    if (Vec2.angle(g, f.coll.vel) < Math.PI / 2) return f
                                }
                            }
                        }
                    }
                }
            }
            return null
        },
        getPartyHpFactor: function(a) {
            return a == sc.COMBATANT_PARTY.PLAYER ? ig.game.playerEntity.params.getHpFactor() : 0
        },
        getAssistDamageFactor: function() {
            return sc.options.get("assist-damage")
        },
        getAssistAttackFrequency: function() {
            var a = sc.options.get("assist-attack-frequency");
            sc.newgame.hasHarderEnemies() && (a = a * 1.5);
            return a
        },
        notifyCombatantDefeated: function(a, b, c) {
            if (!a.defeatNotified) {
                a.defeatNotified = true;
                a.onDefeat(b);
                if (c) sc.arena.onCombatantDeathHit(a, a);
                this.stats.killStreak++;
                if (a.enemyName) {
                    sc.stats.addMap("combat", "totalKilled", 1);
                    b = sc.stats.getMap("combat", "kill" + a.enemyName) || 0;
                    b = Math.max(1, b + 1);
                    sc.stats.setMap("combat", "kill" + a.enemyName, b);
                    a.enemyType.aiGroup && sc.stats.addMap("combat",
                        "aiGroupKill" + a.enemyType.aiGroup, 1);
                    a.boosterState && a.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED && sc.stats.addMap("combat", "boostedKills", 1);
                    this.stats.killedEnemies.indexOf(a.enemyName) == -1 && this.stats.killedEnemies.push(a.enemyName);
                    sc.commonEvents.triggerEvent("ENEMY_DEFEATED", {
                        enemy: a.enemyName
                    })
                }
                for (b = 0; b < this.listeners.length; ++b) {
                    var d = this.listeners[b].onCombatEvent(a, sc.COMBAT_EVENT.DEFEATED);
                    if (d) {
                        var c = a,
                            e = c.getCenter(h);
                        ig.game.spawnEntity("CombatantMarble", e.x, e.y, c.coll.pos.z, {
                            target: d
                        })
                    }
                }
            }
        },
        updateCombatCompletionData: function() {
            var a = {
                enemies: 0,
                reports: 0
            };
            this.getTotalEnemyReportsFound(true, null, a);
            sc.stats.setMap("combat", "enemyCompletionRate", a.enemies);
            sc.stats.setMap("combat", "enemyReportsCompletionRate", a.reports)
        },
        getMultiToken: function(a, b) {
            for (var c = a.length; c--;)
                if (this.actionToken[a[c]]) return false;
            for (c = a.length; c--;) this.actionToken[a[c]] = b[c] || 0;
            return true
        },
        getActionToken: function(a, b) {
            if (this.actionToken[a]) return false;
            this.actionToken[a] = b;
            return true
        },
        getGlobalDmgFactor: function(a) {
            var b =
                1,
                b = a == sc.COMBATANT_PARTY.PLAYER ? b * sc.party.getDmgFactor() : b * this.getAssistDamageFactor();
            return b = b * sc.pvp.getDmgFactor()
        },
        initFrequencyTimers: function(a) {
            for (var b = this.getActiveCombatantCount(a.party), c = this.getActiveCombatantCount(sc.COMBATANT_PARTY.PLAYER), b = this._getTimerFrequencyFactor(a, b, c), c = d.length; c--;) {
                var e = d[c];
                a.stateTimers["_freq" + e] = sc.ATTACK_FREQUENCY[e].gap * b * (0.05 + Math.random() * 0.4)
            }
        },
        checkFrequency: function(a, b) {
            for (var c = d.indexOf(b) + 1; c--;) {
                var e = "_freq" + d[c];
                if (this.actionToken[e] ||
                    a.stateTimers[e] > 0) return false
            }
            return true
        },
        submitFrequency: function(a, b, c) {
            var e = this.getActiveCombatantCount(a.party),
                f = this.getActiveCombatantCount(sc.COMBATANT_PARTY.PLAYER);
            if (e) {
                var g = this._getTimerFrequencyFactor(a, e, f),
                    e = this._getTokenFrequencyFactor(a, e, f);
                a.nextTimerChange = {};
                b = d.indexOf(b) + 1;
                for (f = 1; b--;) {
                    var h = d[b],
                        i = sc.ATTACK_FREQUENCY[h],
                        h = "_freq" + h;
                    a.nextTimerChange[h] = Math.max(a.nextTimerChange[h] || 0, i.gap * g * (0.8 + Math.random() * 0.4) * f);
                    c || (this.actionToken[h] = Math.max(this.actionToken[h] ||
                        0, i.gap * e * (0.8 + Math.random() * 0.4) * f));
                    f = 0.5
                }
            }
        },
        _getTimerFrequencyFactor: function(b, c, d) {
            d = d.limit(1, 3);
            return Math.pow(c, 0.75) * 2 * a[d - 1] / (this.speed * this.getAssistAttackFrequency())
        },
        _getTokenFrequencyFactor: function(b, c, d) {
            d = d.limit(1, 3);
            return Math.pow(1 / c, 0.25) * 2 * a[d - 1] / (this.speed * this.getAssistAttackFrequency())
        },
        addFreeLineCommand: function(a, b) {
            this.freeLineCommands.push({
                entity: a,
                time: b
            })
        },
        isBlockingFreeLine: function(a) {
            for (var b = a.getCenter(h), c = 0; c < this.freeLineCommands.length; ++c) {
                var d =
                    this.freeLineCommands[c],
                    e = d.entity.getTarget();
                if (e) {
                    var f = d.entity.coll.size.x + a.coll.size.x,
                        d = d.entity.getCenter(i),
                        e = e.getCenter(j),
                        e = Vec2.sub(e, d, k),
                        g = Vec2.length(e);
                    Vec2.normalize(e);
                    var d = Vec2.sub(b, d, l),
                        m = Vec2.dot(d, e);
                    if (m < 0 || m > g) continue;
                    e = Vec2.rotate90CCW(e, o);
                    d = Vec2.dot(d, e);
                    if (Math.abs(d) > f * 1.5) continue;
                    return d > 0 ? e : Vec2.flip(e)
                }
                return false
            }
        },
        showHitEffect: function(a, b, c, d, i, j, k, m) {
            var l = "";
            switch (c) {
                case sc.ATTACK_TYPE.NONE:
                    l = "none";
                    break;
                case sc.ATTACK_TYPE.LIGHT:
                    l = "light";
                    break;
                case sc.ATTACK_TYPE.MEDIUM:
                    l =
                        "medium";
                    break;
                case sc.ATTACK_TYPE.HEAVY:
                    l = "heavy";
                    break;
                case sc.ATTACK_TYPE.MASSIVE:
                    l = "massive";
                    break;
                case sc.ATTACK_TYPE.BREAK:
                    l = "massive"
            }
            var w = "";
            switch (d) {
                case sc.ELEMENT.HEAT:
                    w = "Heat";
                    break;
                case sc.ELEMENT.COLD:
                    w = "Cold";
                    break;
                case sc.ELEMENT.SHOCK:
                    w = "Shock";
                    break;
                case sc.ELEMENT.WAVE:
                    w = "Wave"
            }
            if (j) {
                j = this.effects.hit.spawnFixed("critical", b.x, b.y, b.z, a, {
                    angle: Math.PI * 2 * Math.random(),
                    spriteFilter: m
                });
                j.setIgnoreSlowdown()
            }
            if (i == sc.SHIELD_RESULT.PERFECT) {
                j = ig.getRoundedFaceDir(a.face.x, a.face.y,
                    8, n);
                j = this.effects.guard.spawnOnTarget("perfectGuard", a, {
                    align: "CENTER",
                    angle: Vec2.clockangle(j),
                    spriteFilter: m
                });
                j.setIgnoreSlowdown()
            }
            j = this.effects.hit.spawnFixed(l + w, b.x, b.y, b.z, a, {
                angle: Math.PI * 2 * Math.random(),
                spriteFilter: m
            });
            j.setIgnoreSlowdown();
            if (!k) {
                Vec2.assignC(h, b.x, b.y - b.z);
                if (i == sc.SHIELD_RESULT.NEUTRALIZE) b = f.neutralized;
                else if (i && c != sc.ATTACK_TYPE.BREAK) b = i == sc.SHIELD_RESULT.PERFECT ? f.perfectShielded : f.shielded;
                else if (c == sc.ATTACK_TYPE.NONE) b = f.ignore;
                else {
                    b = e[d] || e[sc.ELEMENT.NEUTRAL];
                    b = b[c] || b[sc.ATTACK_TYPE.MASSIVE];
                    d = Math.floor(Math.random() * b.length);
                    b = b[d]
                }(j = b.play()) && j.setFixPosition(h);
                if (!i && a && c != sc.ATTACK_TYPE.NONE) {
                    a = g[a.material] || g[sc.COMBATANT_MATERIAL.METAL];
                    c = a[c] || a[sc.ATTACK_TYPE.MEDIUM];
                    a = Math.floor(Math.random() * c.length);
                    b = c[a];
                    (j = b.play()) && j.setFixPosition(h)
                }
            }
            return j
        },
        showPerfectDashEffect: function(a) {
            var b = ig.getRoundedFaceDir(a.face.x, a.face.y, 8, n);
            this.effects.guard.spawnOnTarget("perfectDash", a, {
                align: "CENTER",
                angle: Vec2.clockangle(b)
            }).setIgnoreSlowdown();
            this.doDramaticEffect(a, a, sc.DRAMATIC_EFFECT.PERFECT_DASH, false)
        },
        showHealEffect: function(a) {
            this.effects.heal.spawnOnTarget("healing", a)
        },
        showCharge: function(a, c, d) {
            c = "chargeLevel" + c;
            d && (c = c + b[d]);
            return this.effects.combat.spawnOnTarget(c, a, {
                duration: -1,
                align: ig.ENTITY_ALIGN.CENTER
            })
        },
        showThrowEffect: function(a, c, d, e) {
            c = b[c];
            d && (c = c + "Charged");
            e && (c = c + e);
            return this.effects.throw.spawnOnTarget(c, a, {
                duration: 0,
                align: ig.ENTITY_ALIGN.FACE
            })
        },
        showModeChange: function(a, c) {
            var d = b[c];
            ig.EffectTools.clearEffects(a,
                "modeChange");
            return this.effects.mode.spawnOnTarget(d, a, {
                duration: 0,
                align: ig.ENTITY_ALIGN.BOTTOM,
                group: "modeChange",
                offset: {
                    x: 0,
                    y: 0,
                    z: 16
                }
            })
        },
        showModeAura: function(a, c) {
            var d = b[c] + "Aura",
                e = ig.EffectTools.getFirstEffect(a, "modeAura");
            if (!(e && e.effect.id == "combat.mode/" + d)) {
                ig.EffectTools.clearEffects(a, "modeAura");
                c != sc.ELEMENT.NEUTRAL && this.effects.mode.spawnOnTarget(d, a, {
                    duration: -1,
                    align: ig.ENTITY_ALIGN.BOTTOM,
                    group: "modeAura",
                    offset: {
                        x: 0,
                        y: 0,
                        z: 12
                    }
                })
            }
        },
        clearModeAura: function(a) {
            ig.EffectTools.clearEffects(a,
                "modeAura")
        },
        showModeDash: function(a, c) {
            var d = b[c] + "Dash";
            ig.EffectTools.clearEffects(a, "modeDash");
            c != sc.ELEMENT.NEUTRAL && this.effects.mode.spawnOnTarget(d, a, {
                duration: 0.3,
                align: ig.ENTITY_ALIGN.BOTTOM,
                group: "modeDash",
                offset: {
                    x: 0,
                    y: 0,
                    z: 12
                }
            })
        },
        addRespawnBlocker: function(a) {
            this.respawnBlocker.push(a.coll)
        },
        isRespawnBlocked: function(a) {
            for (var b = this.respawnBlocker.length; b--;)
                if (ig.CollTools.intersect(a, this.respawnBlocker[b], true)) return true;
            return false
        },
        notifyNearbyEnemiesOfTarget: function(a,
            b) {
            for (var c = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, m), c = ig.game.getEntitiesInCircle(c, b, 1, 16, void 0, void 0, void 0, a), d = c.length; d--;) {
                var e = c[d];
                e instanceof ig.ENTITY.Enemy && (e.target || e.enemyType.reselectTarget(e, true))
            }
        },
        isInCombat: function(a) {
            return a.target || a.party == sc.COMBATANT_PARTY.PLAYER && sc.model.isCombatMode() && !sc.model.isCutscene() || sc.pvp.isCombatantInPvP(a) ? true : false
        },
        isPlayerPartyInCombat: function() {
            for (var a = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], b = a.length; b--;)
                if (a[b].aggression ==
                    sc.ENEMY_AGGRESSION.THREAT) return true;
            return false
        },
        getEnemyAiExp: function(a, b) {
            if (!a.enemyType) return 0;
            if (a.enemyType.aiLearnType.knowItAll) return 1;
            var b = b || 1,
                c = a.enemyType.enduranceScale,
                d = sc.stats.getMap("combat", "kill" + a.enemyName) || 0,
                e = 0,
                d = d * c * b;
            if (a.enemyType.aiGroup) {
                e = sc.stats.getMap("combat", "aiGroupKill" + a.enemyType.aiGroup) || 0;
                e = e * c * t;
                e > r / 2 && (e = r / 2)
            } else d = d * (1 + t);
            c = Math.min(d + e, r);
            return Math.pow(c, q) / Math.pow(r, q)
        },
        getKillCount: function() {},
        getElementMode: function(a) {
            return a instanceof
            sc.PlayerBaseEntity ? a.model.currentElementMode : a instanceof ig.ENTITY.Enemy ? a.elementModes ? a.elementModes.current : sc.ELEMENT.NEUTRAL : sc.ELEMENT.NEUTRAL
        }
    });
    var r = 20,
        t = 0.5,
        q = 0.75;
    ig.addGameAddon(function() {
        return sc.combat = new sc.Combat
    });
    h = Vec2.create();
    ig.NavExternalBlockers.register(function(a, b) {
        return b.party != sc.COMBATANT_PARTY.PLAYER ? false : a.externalData.partyBlocked
    })
});
ig.baked = !0;
