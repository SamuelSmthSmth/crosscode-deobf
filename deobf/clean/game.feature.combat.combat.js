/**
 * game.feature.combat.combat
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat")`.
 *
 * The `sc.Combat` game addon — the central combat manager. Owns active
 * combatants, combat forces (live hitboxes), attack-frequency throttling,
 * target selection, enemy data lookups, kill/reward bookkeeping, dramatic
 * effect choreography, hit/guard/mode effects + sounds, respawn blocking, and
 * combat stats/cooldowns. Also defines the element/material/sound tables and
 * `sc.DRAMATIC_EFFECT` / `sc.COMBAT_MSG_TYPE` / `sc.ATTACK_FREQUENCY` data.
 */
ig.module("game.feature.combat.combat")
    .requires("impact.base.game", "impact.feature.effect.effect-sheet", "impact.feature.database.database", "impact.feature.navigation.navigation", "game.feature.model.game-model")
    .defines(function () {

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

    var ELEMENT_NAME = {};
    ELEMENT_NAME[sc.ELEMENT.NEUTRAL] = "neutral";
    ELEMENT_NAME[sc.ELEMENT.HEAT] = "heat";
    ELEMENT_NAME[sc.ELEMENT.COLD] = "cold";
    ELEMENT_NAME[sc.ELEMENT.SHOCK] = "shock";
    ELEMENT_NAME[sc.ELEMENT.WAVE] = "wave";

    sc.THROW_SOUND_CLASS = {
        HEXACAST: "Hexa"
    };

    sc.ATTACK_FREQUENCY = {
        SPAMM: { gap: 0.25 },
        OFTEN: { gap: 0.5 },
        NORMAL: { gap: 1 },
        SOMETIMES: { gap: 2.5 },
        RARE: { gap: 5 },
        VERY_RARE: { gap: 10 }
    };

    // Frequency scaling per party-member count (1 / 2 / 3 players).
    var PARTY_FREQUENCY_FACTOR = [1, 0.85, 0.7],
        ATTACK_FREQUENCY_KEYS = [];
    for (var freqKey in sc.ATTACK_FREQUENCY) ATTACK_FREQUENCY_KEYS.push(freqKey);

    sc.COMBAT_EVENT = {
        DEFEATED: 1
    };

    // Hit sounds per element, then per attack type.
    var HIT_SOUNDS = {};
    var attackSounds = HIT_SOUNDS[sc.ELEMENT.NEUTRAL] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/ball-hit-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/ball-hit-light4.ogg", 1, 0.1, "hitLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/ball-hit-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/ball-hit-medium4.ogg", 1, 0.1, "hitMedium")];
    attackSounds[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/ball-hit-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/ball-hit-hard4.ogg", 1, 0.1, "hitHeavy")];
    attackSounds[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/ball-hit-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/ball-hit-hard4.ogg", 1, 0.1, "hitMassive")];
    attackSounds = HIT_SOUNDS[sc.ELEMENT.HEAT] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/fire-hit-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/fire-hit-light4.ogg", 1, 0.1, "hitLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/fire-hit-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/fire-hit-medium4.ogg", 1, 0.1, "hitMedium")];
    attackSounds[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/fire-hit-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/fire-hit-hard4.ogg", 1, 0.1, "hitHeavy")];
    attackSounds[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/fire-hit-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/fire-hit-hard4.ogg", 1, 0.1, "hitMassive")];
    attackSounds = HIT_SOUNDS[sc.ELEMENT.COLD] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-light4.ogg", 1, 0.1, "hitLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-medium4.oggg", 1, 0.1, "hitMedium")];
    attackSounds[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard4.ogg", 1, 0.1, "hitHeavy")];
    attackSounds[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/cold/ball-hit-cold-hard4.ogg", 1, 0.1, "hitMassive")];
    attackSounds = HIT_SOUNDS[sc.ELEMENT.SHOCK] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-light4.ogg", 1, 0.1, "hitLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-medium4.oggg", 1, 0.1, "hitMedium")];
    attackSounds[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard4.ogg", 1, 0.1, "hitHeavy")];
    attackSounds[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/shock/hit-shock-hard4.ogg", 1, 0.1, "hitMassive")];
    attackSounds = HIT_SOUNDS[sc.ELEMENT.WAVE] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-light1.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light2.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light3.ogg", 1, 0.1, "hitLight"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-light4.ogg", 1, 0.1, "hitLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium1.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium2.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium3.ogg", 1, 0.1, "hitMedium"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-medium4.oggg", 1, 0.1, "hitMedium")];
    attackSounds[sc.ATTACK_TYPE.HEAVY] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard1.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard2.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard3.ogg", 1, 0.1, "hitHeavy"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard4.ogg", 1, 0.1, "hitHeavy")];
    attackSounds[sc.ATTACK_TYPE.MASSIVE] = [new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard3.ogg", 1, 0.1, "hitMassive"), new ig.Sound("media/sound/battle/airon/wave/hit-wave-hard4.ogg", 1, 0.1, "hitMassive")];

    var SHIELD_SOUNDS = {
            ignore: new ig.Sound("media/sound/battle/ball-kill.ogg", 0.8, 0.1),
            shielded: new ig.Sound("media/sound/battle/hit-block.ogg", 0.8, 0.05),
            perfectShielded: new ig.Sound("media/sound/battle/hit-counter-echo.ogg", 1, 0.05),
            neutralized: new ig.Sound("media/sound/battle/blubb-4.ogg", 1, 0.05)
        },
        MATERIAL_SOUNDS = {};
    attackSounds = MATERIAL_SOUNDS[sc.COMBATANT_MATERIAL.METAL] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/hit-metal-light-2.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-metal-light-3.ogg", 0.6, 0.1, "hitMatLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/hit-metal-medium-1.ogg", 1, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-metal-medium-2.ogg", 1, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-metal-medium-3.ogg", 1, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-metal-medium-4.ogg", 1, 0.1, "hitMatMedium")];
    attackSounds = MATERIAL_SOUNDS[sc.COMBATANT_MATERIAL.ORGANIC] = {};
    attackSounds[sc.ATTACK_TYPE.LIGHT] = [new ig.Sound("media/sound/battle/airon/hit-organic-1.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-organic-2.ogg", 0.6, 0.1, "hitMatLight"), new ig.Sound("media/sound/battle/airon/hit-organic-3.ogg", 0.6, 0.1, "hitMatLight")];
    attackSounds[sc.ATTACK_TYPE.MEDIUM] = [new ig.Sound("media/sound/battle/airon/hit-organic-deep-1.ogg", 0.8, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-organic-deep-2.ogg", 0.8, 0.1, "hitMatMedium"), new ig.Sound("media/sound/battle/airon/hit-organic-deep-3.ogg", 0.8, 0.1, "hitMatMedium")];

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

    var tmpVec2A = Vec2.create(),
        tmpVec2B = Vec2.create(),
        tmpVec2C = Vec2.create(),
        tmpVec2D = Vec2.create(),
        tmpVec2E = Vec2.create(),
        tmpVec2F = Vec2.create(),
        tmpVec3 = Vec3.create(),
        tmpVec2G = Vec2.create(),
        THREAT_SCRATCH = {
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

        init: function () {
            this.parent("Combat");
            sc.Model.addObserver(sc.model, this);
            this.activeCombatants[sc.COMBATANT_PARTY.PLAYER] = [];
            this.activeCombatants[sc.COMBATANT_PARTY.ENEMY] = [];
            this.activeCombatants[sc.COMBATANT_PARTY.OTHER] = [];
            window.wm && ig.database.register("enemies", "EnemyEnumEditor", "Enemies");
            this.enemyDataList = ig.database.get("enemies");
            for (var enemyKey in this.enemyDataList)
                if (this.enemyDataList[enemyKey].track)
                    for (var descriptions = this.enemyDataList[enemyKey].descriptions, i = descriptions.length; i--;)
                        if (descriptions[i].condition) {
                            var cond = new ig.VarCondition(descriptions[i].condition);
                            descriptions[i].condObj = cond
                        }
            ig.vars.registerVarAccessor("combat", this, "VarCombatEditor")
        },

        _unlockAllEnemies: function () {
            for (var enemyKey in this.enemyDataList) this.enemyDataList[enemyKey].track && sc.stats.setMap("combat", "kill" + enemyKey, 999)
        },

        setCombatSpeed: function (speed) {
            this.speed = speed
        },

        getTotalEnemiesFound: function (percentage, category) {
            var found = 0,
                total = 0;
            for (var enemyKey in this.enemyDataList) {
                var data = this.enemyDataList[enemyKey];
                if (data.track && !data.extension)
                    if (category) {
                        if (data.category == category) {
                            (sc.stats.getMap("combat", "kill" + enemyKey) >= 1 || sc.stats.getMap("combat", "kill" + enemyKey) <= -1) && found++;
                            total++
                        }
                    } else {
                        (sc.stats.getMap("combat", "kill" + enemyKey) >= 1 || sc.stats.getMap("combat", "kill" + enemyKey) <= -1) && found++;
                        total++
                    }
            }
            return percentage ? found / total : found
        },

        getTotalEnemyReportsFound: function (percentage, category, outObj) {
            var found = 0,
                total = 0,
                dataList = this.enemyDataList,
                enemiesFound = 0,
                enemiesTotal = 0;
            for (var enemyKey in dataList)
                if (dataList[enemyKey].track && !dataList[enemyKey].extension && !(category && dataList[enemyKey].category != category)) {
                    if (outObj) {
                        (sc.stats.getMap("combat", "kill" + enemyKey) >= 1 || sc.stats.getMap("combat", "kill" + enemyKey) <= -1) && enemiesFound++;
                        enemiesTotal++
                    }
                    var killsNeeded = dataList[enemyKey].boss ? 1 : dataList[enemyKey].kills || sc.MIN_KILLS;
                    (sc.stats.getMap("combat", "kill" + enemyKey) <= -1 || sc.stats.getMap("combat", "kill" + enemyKey) >= killsNeeded) && found++;
                    total++
                }
            if (outObj) {
                outObj.enemies = enemiesFound / enemiesTotal;
                outObj.reports = found / total
            } else return percentage ? found / total : found
        },

        getEnemyMenuOffset: function (name) {
            return !this.enemyDataList[name] ? null : this.enemyDataList[name].offset || null
        },
        isEnemyAnalyzable: function (name) {
            return !name || !this.enemyDataList[name] ? false : !this.enemyDataList[name].disableAnalyze
        },

        addActiveCombatant: function (combatant) {
            if (this.activeCombatants[combatant.party].indexOf(combatant) != -1) throw Error("Tried to add same combatant as active twice!");
            this.activeCombatants[combatant.party].push(combatant);
            if (combatant.party == sc.COMBATANT_PARTY.ENEMY && combatant.aggression == sc.ENEMY_AGGRESSION.THREAT) {
                this.recentlyAttacked.push(combatant);
                combatant.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED && this.effects.combatant.spawnOnTarget("boosted", combatant, {
                    align: "CENTER",
                    group: "_boostedFX",
                    duration: -1
                })
            }
        },
        removeActiveCombatant: function (combatant) {
            this.activeCombatants[combatant.party].erase(combatant);
            ig.EffectTools.clearEffects(combatant, "_boostedFX")
        },
        changeCombatantParty: function (combatant, party) {
            combatant.target && this.removeActiveCombatant(combatant);
            combatant.party = party;
            combatant.target && this.addActiveCombatant(combatant)
        },

        areSpawnersCleared: function () {
            for (var spawners = ig.game.getEntitiesByType(ig.ENTITY.EnemySpawner), i = spawners.length; i--;)
                if (!spawners[i].isCleared()) return false;
            return true
        },

        getActiveCombatantCount: function (party, name) {
            if (party == sc.COMBATANT_PARTY.PLAYER) return sc.party.getStrategy("BEHAVIOUR").onlyTargetPlayer ? 1 : 1 + sc.party.getPartySizeAlive(true);
            for (var combatants = this.activeCombatants[party], count = 0, i = combatants.length; i--;) name && combatants[i].enemyName != name || combatants[i].aggression != sc.ENEMY_AGGRESSION.PEACEFUL && count++;
            return count
        },
        getActiveCombatants: function (party, onScreen) {
            for (var combatants = ig.copy(this.activeCombatants[party]), i = combatants.length; i--;) combatants[i].isDefeated() ? combatants.splice(i, 1) : onScreen && (!combatants[i].isPlayer && !ig.EntityTools.isInScreen(combatants[i], 32)) && combatants.splice(i, 1);
            return combatants
        },

        isDamageIgnore: function () {
            return sc.model.isCutscene() || sc.model.isTeleport() || ig.game.events.getBlockingEventCall()
        },

        getEnemyTarget: function () {
            if (sc.party.getStrategy("BEHAVIOUR").onlyTargetPlayer) return ig.game.playerEntity;
            for (var candidates = [ig.game.playerEntity], i = 0; i < sc.party.currentParty.length; ++i) this._addPartyMember(candidates, sc.party.getPartyMemberEntityByIndex(i), sc.party.ai.targeting > 0);
            if (sc.party.ai.targeting > 0 && candidates.length > 1 && Math.random() < sc.party.ai.targeting) candidates.splice(0, 1);
            else if (sc.party.ai.targeting < 0 && candidates.length > 1 && Math.random() < -sc.party.ai.targeting) candidates.length = 1;
            return candidates[Math.floor(Math.random() * candidates.length)]
        },
        _addPartyMember: function (list, member, onScreen) {
            member && (onScreen || ig.EntityTools.isInScreen(member, 32)) && list.push(member)
        },

        getPlayerTarget: function (player) {
            var lastTarget = ig.game.playerEntity.combatStats.lastTarget,
                strategy = sc.party.getStrategy("TARGET");
            if (strategy.same && lastTarget && !lastTarget.isDefeated() && !lastTarget._killed) return lastTarget;
            for (var enemies = this.getActiveCombatants(sc.COMBATANT_PARTY.ENEMY, true), i = enemies.length; i--;)
                if (ig.navigation.isPathAvailable(player, enemies[i])) {
                    if (sc.EnemyAnno.doesRandomlyUnderstand(enemies[i], player)) {
                        if (sc.EnemyAnno.isVulnerable(enemies[i]) || sc.EnemyAnno.isWeak(enemies[i])) return enemies[i];
                        sc.EnemyAnno.isImmune(enemies[i]) && enemies.length > 1 && enemies.splice(i, 1)
                    }
                } else enemies.splice(i, 1);
            lastTarget && (enemies.length > 1 && !strategy.same) && enemies.erase(lastTarget);
            return enemies[Math.floor(Math.random() * enemies.length)]
        },

        getActiveEnemiesNames: function () {
            for (var names = [], combatants = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], i = combatants.length; i--;) names.indexOf(combatants[i].enemyName) == -1 && names.push(combatants[i].enemyName);
            return names
        },

        getEnemyName: function (name) {
            return this.enemyDataList[name] ? ig.LangLabel.getText(this.enemyDataList[name].name) : "\\c[1]ERROR\\c[0]"
        },
        getEnemyCategory: function (name) {
            return this.enemyDataList[name] ? sc.ENEMY_CATEGORY[this.enemyDataList[name].category || "ANIMALS"] : sc.ENEMY_CATEGORY.ANIMALS
        },
        canShowBoosted: function (enemyData) {
            return !enemyData.boss && sc.stats.getMap("combat", "kill" + enemyData.path) > 0 && this.getEnemyCategory(enemyData.path) != sc.ENEMY_CATEGORY.PLAYERS
        },
        canShowBoostedEntry: function (name, boss) {
            return !boss && sc.stats.getMap("combat", "kill" + name) > 0 && this.getEnemyCategory(name) != sc.ENEMY_CATEGORY.PLAYERS
        },
        getEnemyLevel: function (name) {
            return this.enemyDataList[name] ? this.enemyDataList[name].level : 1
        },
        getEnemyArea: function (name) {
            return this.enemyDataList[name] ? sc.map.getAreaName(this.enemyDataList[name].area, true) : "\\c[1]ERROR\\c[0]"
        },
        getEnemyDrops: function (name) {
            return this.enemyDataList[name] ? this.enemyDataList[name].itemDrops : "\\c[1]ERROR\\c[0]"
        },

        setScreenEnemiesTarget: function (target) {
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && ig.EntityTools.isInScreen(entity, 0) && entity.setTarget(target, true)
            }
        },
        removeEnemies: function (type, except, noRumble, explode) {
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && !entity.isDefeated() && (entity != except && !(type && entity.enemyName != type)) && entity.instantDefeat(noRumble, explode)
            }
        },

        setFinalDramaticEffect: function (effect) {
            this.finalDramaticEffect = effect
        },

        onCombatantDeathHit: function (attacker, combatant) {
            var pvpEffect = sc.pvp.onPvpCombatantDefeat(combatant);
            pvpEffect && attacker && this.doDramaticEffect(attacker, combatant, pvpEffect, true);
            if (combatant.isPlayer && !combatant.manualKill && !sc.pvp.isActive()) {
                var deaths = ig.vars.get("stats.deaths") || 0;
                ig.game.respawn();
                ig.vars.set("stats.deaths", deaths + 1)
            } else if (combatant.party == sc.COMBATANT_PARTY.ENEMY) {
                var didEffect = false;
                sc.arena.onCombatantDeathHit(attacker, combatant);
                if (this.finalDramaticEffect) {
                    var remaining = 0;
                    for (var enemies = this.activeCombatants[combatant.party], i = enemies.length; i--;) {
                        var enemy = enemies[i];
                        (!enemy.params || !enemy.params.isDefeated()) && remaining++
                    }
                    if (remaining == 0) {
                        if (!didEffect && attacker) {
                            this.doDramaticEffect(attacker || combatant, combatant, this.finalDramaticEffect, true);
                            didEffect = true
                        }
                        if (this.finalDramaticEffect.arena) sc.arena.onFinalDeathHit();
                        this.finalDramaticEffect = null
                    }
                }
                var rankUp = sc.model.increaseCombatRank(1 * combatant.enemyType.enduranceScale);
                var pos = combatant.getAlignedPos(ig.ENTITY_ALIGN.CENTER, tmpVec3);
                if (rankUp) {
                    if (sc.model.isSRank() && sc.options.get("s-rank-effects")) {
                        var rankFx = this.effects.combat.spawnFixed("rankS", pos.x, pos.y, pos.z);
                        rankFx.setIgnoreSlowdown();
                        this.doDramaticEffect(attacker, combatant, sc.DRAMATIC_EFFECT.S_RANK, true)
                    } else {
                        var rankName = "rank" + sc.model.getCombatRankLabel();
                        this.effects.combat.spawnFixed(rankName, pos.x, pos.y, pos.z);
                        didEffect || this.doDramaticEffect(attacker || combatant, combatant, sc.DRAMATIC_EFFECT.RANK_UP)
                    }
                    var rankLabel = ig.lang.get("sc.gui.combat-msg.rank-up") + " " + sc.model.getCombatRankLabel();
                    var box = new sc.SmallEntityBox(combatant, rankLabel, 2);
                    ig.gui.addGuiElement(box)
                } else if (sc.model.isSRank() && sc.options.get("s-rank-effects")) {
                    rankFx = this.effects.combat.spawnFixed("sRankKill", pos.x, pos.y, pos.z);
                    rankFx.setIgnoreSlowdown()
                }
            }
        },

        showCombatantLabel: function (entity, label, duration) {
            var align = sc.SMALL_BOX_ALIGN.TOP,
                offset = -10;
            if (entity.dmgZFocus) {
                align = sc.SMALL_BOX_ALIGN.BOTTOM;
                offset = entity.dmgZFocus
            } else if (entity.cameraZFocus) {
                align = sc.SMALL_BOX_ALIGN.BOTTOM;
                offset = entity.cameraZFocus + 48
            }
            var box = new sc.SmallEntityBox(entity, label, duration || 1, align, offset);
            ig.gui.addGuiElement(box)
        },
        showCombatMessage: function (entity, msg) {
            var text = msg.icon + ig.lang.get(msg.msg);
            var box = new sc.SmallEntityBox(entity, text, msg.duration || 0.5, sc.SMALL_BOX_ALIGN.CENTER);
            msg.keepPos && box.setFixedPos();
            ig.gui.addGuiElement(box)
        },

        hasCollabs: function () {
            return this.collabs.length > 0
        },

        // Build and run an interruptible event choreographing a dramatic effect
        // (slow motion, camera zoom, blur, speedlines, label).
        doDramaticEffect: function (attacker, target, effect, focus) {
            if (effect.label) {
                var label = ig.lang.get(effect.label);
                this.showCombatantLabel(target, label)
            }
            attacker || (attacker = target);
            target || (target = attacker);
            var steps = [];
            focus = focus || attacker.isPlayer || effect.alwaysFocus;
            effect.speedlines && sc.options.get("speedlines") && steps.push({
                type: "SHOW_EFFECT",
                entity: target,
                align: "CENTER",
                effect: {
                    sheet: "speedlines",
                    name: "speedlinesDramatic"
                },
                duration: effect.wait + (effect.earlyCameraOut || 0) - (effect.cameraOutOverlap || 0) + 0.05,
                ignoreSlowMo: true
            });
            if (focus) {
                steps.push({
                    type: "ADD_SLOW_MOTION",
                    name: "levelUp",
                    factor: effect.timeFactor,
                    time: effect.timeFadeIn || 0
                });
                effect.camera == 1 && steps.push({
                    type: "SET_CAMERA_TARGET",
                    entity: target,
                    speed: 0.1,
                    transition: "EASE_OUT",
                    zoom: effect.zoom || 1
                });
                effect.camera == 2 && steps.push({
                    type: "SET_CAMERA_BETWEEN",
                    entity1: attacker,
                    entity2: target,
                    speed: 0.1,
                    transition: "EASE_OUT",
                    zoom: effect.zoom || 1
                })
            }
            effect.blurDuration && steps.push({
                type: "SET_ZOOM_BLUR",
                zoomType: effect.blurType || "MEDIUM",
                fadeIn: 0.1,
                duration: effect.blurDuration,
                fadeOut: 0.2,
                target: target
            });
            steps.push({
                type: "WAIT",
                time: effect.wait,
                ignoreSlowDown: true
            });
            if (effect.earlyCameraOut && effect.camera) {
                steps.push({
                    type: "SET_CAMERA_ZOOM",
                    zoom: 1,
                    duration: effect.earlyCameraOut,
                    transition: "EASE_IN_OUT"
                });
                steps.push({
                    type: "WAIT",
                    time: effect.earlyCameraOut - effect.cameraOutOverlap,
                    ignoreSlowDown: true
                })
            }
            if (focus) {
                steps.push({
                    type: "CLEAR_SLOW_MOTION",
                    name: "levelUp",
                    time: effect.clearTime
                });
                effect.camera && steps.push({
                    type: "UNDO_CAMERA",
                    speed: effect.cameraBackTime || 1,
                    transition: "EASE_IN_OUT",
                    wait: true
                })
            }
            var event = new ig.Event({
                steps: steps
            });
            ig.game.events.callEvent(event, ig.EventRunType.INTERRUPTABLE)
        },

        sendEnemyMessage: function (target, key) {
            this.sendGlobalEnemyEvent(target, sc.COMBAT_ENEMY_EVENT.ENEMY_MSG, {
                key: key
            })
        },
        sendGlobalEnemyEvent: function (target, eventType, settings) {
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.Enemy && !entity.isDefeated() && entity.onEnemyEvent) entity.onEnemyEvent(target, eventType, settings)
            }
        },

        postUpdateOrder: 500,
        onPostUpdate: function () {
            if (!ig.loading && !ig.game.paused) {
                if (this.active) this.time = this.time + ig.system.tick;
                if (this.recentlyAttacked.length > 0) {
                    var maxLevel = 0,
                        enemyNames = [];
                    for (var i = this.recentlyAttacked.length; i--;) {
                        var enemy = this.recentlyAttacked[i];
                        maxLevel = Math.max(maxLevel, enemy.enemyType.level);
                        enemyNames.indexOf(enemy.enemyName) == -1 && enemyNames.push(enemy.enemyName)
                    }
                    var battleStarted = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY].length <= this.recentlyAttacked.length;
                    !sc.model.isForceCombat() && !sc.arena.active && sc.commonEvents.triggerEvent("ENEMY_ATTACKS", {
                        enemies: enemyNames,
                        levelGap: maxLevel - sc.model.player.level,
                        playerStarted: this.playerStartedCombat,
                        battleStarted: battleStarted
                    });
                    this.recentlyAttacked.length = 0;
                    this.playerStartedCombat = false
                }
                for (var fi = this.forces.length; fi--;) {
                    var force = this.forces[fi];
                    var root = force.combatantRoot;
                    root && ig.vars.pushEntityAccessor(root);
                    if (!force.combatantRoot || force.update()) {
                        if (force.onEnd) force.onEnd();
                        force.onActionEndDetach();
                        this.forces.splice(fi, 1)
                    }
                    root && ig.vars.popEntityAccessor(root)
                }
                for (var tokenKey in this.actionToken) {
                    this.actionToken[tokenKey] = this.actionToken[tokenKey] - ig.system.tick;
                    this.actionToken[tokenKey] <= 0 && delete this.actionToken[tokenKey]
                }
                for (var ci = this.freeLineCommands.length; ci--;) {
                    var command = this.freeLineCommands[ci];
                    command.time = command.time - ig.system.tick;
                    (command.time <= 0 || command.entity.hasStun()) && this.freeLineCommands.splice(ci, 1)
                }
                var soundIndex = -1;
                if (sc.model.isCombatCooldown() && sc.options.get("s-rank-effects")) {
                    this.cooldownTick.hasCooldown = true;
                    var cooldownFactor = sc.model.getCombatCooldownFactor();
                    for (var si = this.cooldownTick.sounds.length; si--;)
                        if (cooldownFactor < this.cooldownTick.sounds[si].below) {
                            soundIndex = si;
                            break
                        }
                }
                if (soundIndex !== this.cooldownTick.currentSound) {
                    this.cooldownTick.currentSound = soundIndex;
                    if (this.cooldownTick.handle) {
                        this.cooldownTick.handle.stop();
                        this.cooldownTick.handle = null
                    }
                    if (soundIndex !== -1) {
                        var soundEntry = this.cooldownTick.sounds[soundIndex];
                        this.cooldownTick.handle = soundEntry.sound.play(true, {
                            speed: soundEntry.speed
                        })
                    }
                }
            }
        },

        onReset: function () {
            this.stats.killStreak = 0;
            this.stats.killedEnemies.length = 0;
            this.respawnBlocker.length = 0;
            this.recentlyAttacked.length = 0;
            this.finalDramaticEffect = null
        },
        onLevelLoadStart: function () {
            this.respawnBlocker.length = 0;
            this.finalDramaticEffect = null;
            this.hideDamageNumbers = false
        },

        onVarAccess: function (accessor, path) {
            if (path[0] == "combat") {
                var key = path.slice(2).join(".");
                key = key ? key.replace(/\//g, ".") : null;
                switch (path[1]) {
                    case "name":
                        return this.getEnemyName(key);
                    case "activeCnt":
                        return this.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, key);
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
            throw Error("Unsupported var access path: " + accessor);
        },

        modelChanged: function (model, msg, data) {
            if (model instanceof sc.GameModel)
                if (msg == sc.GAME_MODEL_MSG.STATE_CHANGED) this.setActive(!model.isCutscene());
                else if (msg == sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED)
                    if (data != void 0)
                        if (data) {
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
                            sc.arena.active || sc.commonEvents.triggerEvent("BATTLE_OVER", {
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

        addCombatForce: function (force) {
            this.forces.push(force)
        },
        setActive: function (active) {
            this.active = active
        },
        forceEnd: function () {
            for (var enemies = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], i = enemies.length; i--;) enemies[i].setTarget(null);
            sc.model.cancelCombatCooldown()
        },
        addCombatListener: function (listener) {
            this.listeners.push(listener)
        },
        removeCombatListener: function (listener) {
            this.listeners.erase(listener)
        },

        gatherCollaborators: function (collab, collabKey, minCount, maxCount, cap, ignoreStun) {
            for (var enemies = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], i = enemies.length, cap = cap || maxCount, gathered = 0; i--;) {
                var enemy = enemies[i];
                if (ignoreStun || !enemy.hasStun())
                    if (!enemy.params || !enemy.params.defeated) {
                        enemy.params && enemy.params.isLocked() && enemy.params.clearLock();
                        if (!enemy.collaboration && enemy.collabReady(collabKey) && collab.addParticipant(enemy, collabKey, minCount)) {
                            gathered++;
                            if (gathered == cap) return true
                        }
                    }
            }
            return gathered >= maxCount
        },

        getNearbyThreat: function (entity, radius, viewAngle, conditions) {
            for (var pos = entity.coll.pos, size = entity.coll.size, candidates = ig.game.getEntitiesInRectangle(pos.x - radius, pos.y - radius, pos.z, size.x + 2 * radius, size.y + 2 * radius, size.z + radius, entity), i = candidates.length; i--;) {
                var candidate = candidates[i];
                if (candidate.getCombatant) {
                    var combatant = candidate.getCombatant();
                    if (combatant && combatant.party != entity.party) {
                        var attackInfo = candidate.getAttackInfo && candidate.getAttackInfo();
                        if (!attackInfo && (!candidate.isThreat || Vec2.isZero(candidate.coll.vel)))
                            if (!(entity instanceof sc.PartyMemberEntity) || !(candidate instanceof ig.ENTITY.Enemy) || !sc.EnemyAnno.needDodge(candidate, entity)) continue;
                        if (!attackInfo || !attackInfo.hasNoEffect()) {
                            var threatData = null;
                            if (attackInfo) {
                                THREAT_SCRATCH.damagingEntity = candidate;
                                THREAT_SCRATCH.attackInfo = attackInfo;
                                threatData = THREAT_SCRATCH
                            }
                            if (!conditions || conditions.check(entity, Math.random(), threatData)) {
                                var distVec = ig.CollTools.getDistVec2(entity.coll, candidate.coll, tmpVec2D);
                                if (!(Vec2.angle(distVec, entity.face) > Math.PI * viewAngle)) {
                                    Vec2.flip(distVec);
                                    if (Vec2.angle(distVec, candidate.coll.vel) < Math.PI / 2) return candidate
                                }
                            }
                        }
                    }
                }
            }
            return null
        },

        getPartyHpFactor: function (party) {
            return party == sc.COMBATANT_PARTY.PLAYER ? ig.game.playerEntity.params.getHpFactor() : 0
        },
        getAssistDamageFactor: function () {
            return sc.options.get("assist-damage")
        },
        getAssistAttackFrequency: function () {
            var freq = sc.options.get("assist-attack-frequency");
            sc.newgame.hasHarderEnemies() && (freq = freq * 1.5);
            return freq
        },

        notifyCombatantDefeated: function (combatant, skipRumble, silent) {
            if (!combatant.defeatNotified) {
                combatant.defeatNotified = true;
                combatant.onDefeat(skipRumble);
                if (silent) sc.arena.onCombatantDeathHit(combatant, combatant);
                this.stats.killStreak++;
                if (combatant.enemyName) {
                    sc.stats.addMap("combat", "totalKilled", 1);
                    var kills = sc.stats.getMap("combat", "kill" + combatant.enemyName) || 0;
                    kills = Math.max(1, kills + 1);
                    sc.stats.setMap("combat", "kill" + combatant.enemyName, kills);
                    combatant.enemyType.aiGroup && sc.stats.addMap("combat", "aiGroupKill" + combatant.enemyType.aiGroup, 1);
                    combatant.boosterState && combatant.boosterState == sc.ENEMY_BOOSTER_STATE.BOOSTED && sc.stats.addMap("combat", "boostedKills", 1);
                    this.stats.killedEnemies.indexOf(combatant.enemyName) == -1 && this.stats.killedEnemies.push(combatant.enemyName);
                    sc.commonEvents.triggerEvent("ENEMY_DEFEATED", {
                        enemy: combatant.enemyName
                    })
                }
                for (var i = 0; i < this.listeners.length; ++i) {
                    var target = this.listeners[i].onCombatEvent(combatant, sc.COMBAT_EVENT.DEFEATED);
                    if (target) {
                        var center = combatant.getCenter(tmpVec2A);
                        ig.game.spawnEntity("CombatantMarble", center.x, center.y, combatant.coll.pos.z, {
                            target: target
                        })
                    }
                }
            }
        },

        updateCombatCompletionData: function () {
            var completion = {
                enemies: 0,
                reports: 0
            };
            this.getTotalEnemyReportsFound(true, null, completion);
            sc.stats.setMap("combat", "enemyCompletionRate", completion.enemies);
            sc.stats.setMap("combat", "enemyReportsCompletionRate", completion.reports)
        },

        getMultiToken: function (names, times) {
            for (var i = names.length; i--;)
                if (this.actionToken[names[i]]) return false;
            for (i = names.length; i--;) this.actionToken[names[i]] = times[i] || 0;
            return true
        },
        getActionToken: function (name, time) {
            if (this.actionToken[name]) return false;
            this.actionToken[name] = time;
            return true
        },

        getGlobalDmgFactor: function (party) {
            var factor = 1;
            factor = party == sc.COMBATANT_PARTY.PLAYER ? factor * sc.party.getDmgFactor() : factor * this.getAssistDamageFactor();
            return factor = factor * sc.pvp.getDmgFactor()
        },

        initFrequencyTimers: function (combatant) {
            var enemyCount = this.getActiveCombatantCount(combatant.party),
                playerCount = this.getActiveCombatantCount(sc.COMBATANT_PARTY.PLAYER),
                factor = this._getTimerFrequencyFactor(combatant, enemyCount, playerCount);
            for (var i = ATTACK_FREQUENCY_KEYS.length; i--;) {
                var freqKey = ATTACK_FREQUENCY_KEYS[i];
                combatant.stateTimers["_freq" + freqKey] = sc.ATTACK_FREQUENCY[freqKey].gap * factor * (0.05 + Math.random() * 0.4)
            }
        },
        checkFrequency: function (combatant, frequency) {
            for (var i = ATTACK_FREQUENCY_KEYS.indexOf(frequency) + 1; i--;) {
                var key = "_freq" + ATTACK_FREQUENCY_KEYS[i];
                if (this.actionToken[key] || combatant.stateTimers[key] > 0) return false
            }
            return true
        },
        submitFrequency: function (combatant, frequency, noToken) {
            var enemyCount = this.getActiveCombatantCount(combatant.party),
                playerCount = this.getActiveCombatantCount(sc.COMBATANT_PARTY.PLAYER);
            if (enemyCount) {
                var timerFactor = this._getTimerFrequencyFactor(combatant, enemyCount, playerCount),
                    tokenFactor = this._getTokenFrequencyFactor(combatant, enemyCount, playerCount);
                combatant.nextTimerChange = {};
                var idx = ATTACK_FREQUENCY_KEYS.indexOf(frequency) + 1;
                for (var mul = 1; idx--;) {
                    var freqKey = ATTACK_FREQUENCY_KEYS[idx],
                        freqData = sc.ATTACK_FREQUENCY[freqKey],
                        timerKey = "_freq" + freqKey;
                    combatant.nextTimerChange[timerKey] = Math.max(combatant.nextTimerChange[timerKey] || 0, freqData.gap * timerFactor * (0.8 + Math.random() * 0.4) * mul);
                    noToken || (this.actionToken[timerKey] = Math.max(this.actionToken[timerKey] || 0, freqData.gap * tokenFactor * (0.8 + Math.random() * 0.4) * mul));
                    mul = 0.5
                }
            }
        },
        _getTimerFrequencyFactor: function (combatant, enemyCount, playerCount) {
            playerCount = playerCount.limit(1, 3);
            return Math.pow(enemyCount, 0.75) * 2 * PARTY_FREQUENCY_FACTOR[playerCount - 1] / (this.speed * this.getAssistAttackFrequency())
        },
        _getTokenFrequencyFactor: function (combatant, enemyCount, playerCount) {
            playerCount = playerCount.limit(1, 3);
            return Math.pow(1 / enemyCount, 0.25) * 2 * PARTY_FREQUENCY_FACTOR[playerCount - 1] / (this.speed * this.getAssistAttackFrequency())
        },

        addFreeLineCommand: function (entity, time) {
            this.freeLineCommands.push({
                entity: entity,
                time: time
            })
        },
        isBlockingFreeLine: function (entity) {
            var center = entity.getCenter(tmpVec2A);
            for (var i = 0; i < this.freeLineCommands.length; ++i) {
                var command = this.freeLineCommands[i],
                    target = command.entity.getTarget();
                if (target) {
                    var blockWidth = command.entity.coll.size.x + entity.coll.size.x,
                        commandCenter = command.entity.getCenter(tmpVec2B),
                        targetCenter = target.getCenter(tmpVec2C),
                        lineVec = Vec2.sub(targetCenter, commandCenter, tmpVec2D),
                        lineLen = Vec2.length(lineVec);
                    Vec2.normalize(lineVec);
                    var offset = Vec2.sub(center, commandCenter, tmpVec2E),
                        projection = Vec2.dot(offset, lineVec);
                    if (projection < 0 || projection > lineLen) continue;
                    var perp = Vec2.rotate90CCW(lineVec, tmpVec2F);
                    var perpDist = Vec2.dot(offset, perp);
                    if (Math.abs(perpDist) > blockWidth * 1.5) continue;
                    return perpDist > 0 ? perp : Vec2.flip(perp)
                }
                return false
            }
        },

        showHitEffect: function (entity, pos, attackType, element, shieldResult, critical, silent, spriteFilter) {
            var typeName = "";
            switch (attackType) {
                case sc.ATTACK_TYPE.NONE:
                    typeName = "none";
                    break;
                case sc.ATTACK_TYPE.LIGHT:
                    typeName = "light";
                    break;
                case sc.ATTACK_TYPE.MEDIUM:
                    typeName = "medium";
                    break;
                case sc.ATTACK_TYPE.HEAVY:
                    typeName = "heavy";
                    break;
                case sc.ATTACK_TYPE.MASSIVE:
                    typeName = "massive";
                    break;
                case sc.ATTACK_TYPE.BREAK:
                    typeName = "massive"
            }
            var elemName = "";
            switch (element) {
                case sc.ELEMENT.HEAT:
                    elemName = "Heat";
                    break;
                case sc.ELEMENT.COLD:
                    elemName = "Cold";
                    break;
                case sc.ELEMENT.SHOCK:
                    elemName = "Shock";
                    break;
                case sc.ELEMENT.WAVE:
                    elemName = "Wave"
            }
            var fx;
            if (critical) {
                fx = this.effects.hit.spawnFixed("critical", pos.x, pos.y, pos.z, entity, {
                    angle: Math.PI * 2 * Math.random(),
                    spriteFilter: spriteFilter
                });
                fx.setIgnoreSlowdown()
            }
            if (shieldResult == sc.SHIELD_RESULT.PERFECT) {
                var faceDir = ig.getRoundedFaceDir(entity.face.x, entity.face.y, 8, tmpVec2G);
                fx = this.effects.guard.spawnOnTarget("perfectGuard", entity, {
                    align: "CENTER",
                    angle: Vec2.clockangle(faceDir),
                    spriteFilter: spriteFilter
                });
                fx.setIgnoreSlowdown()
            }
            fx = this.effects.hit.spawnFixed(typeName + elemName, pos.x, pos.y, pos.z, entity, {
                angle: Math.PI * 2 * Math.random(),
                spriteFilter: spriteFilter
            });
            fx.setIgnoreSlowdown();
            if (!silent) {
                var soundPos = Vec2.assignC(tmpVec2A, pos.x, pos.y - pos.z);
                var sound;
                if (shieldResult == sc.SHIELD_RESULT.NEUTRALIZE) sound = SHIELD_SOUNDS.neutralized;
                else if (shieldResult && attackType != sc.ATTACK_TYPE.BREAK) sound = shieldResult == sc.SHIELD_RESULT.PERFECT ? SHIELD_SOUNDS.perfectShielded : SHIELD_SOUNDS.shielded;
                else if (attackType == sc.ATTACK_TYPE.NONE) sound = SHIELD_SOUNDS.ignore;
                else {
                    sound = HIT_SOUNDS[element] || HIT_SOUNDS[sc.ELEMENT.NEUTRAL];
                    sound = sound[attackType] || sound[sc.ATTACK_TYPE.MASSIVE];
                    var idx = Math.floor(Math.random() * sound.length);
                    sound = sound[idx]
                }
                var handle = sound.play();
                handle && handle.setFixPosition(soundPos);
                if (!shieldResult && entity && attackType != sc.ATTACK_TYPE.NONE) {
                    var materialSounds = MATERIAL_SOUNDS[entity.material] || MATERIAL_SOUNDS[sc.COMBATANT_MATERIAL.METAL];
                    var attackSounds2 = materialSounds[attackType] || materialSounds[sc.ATTACK_TYPE.MEDIUM];
                    idx = Math.floor(Math.random() * attackSounds2.length);
                    sound = attackSounds2[idx];
                    handle = sound.play();
                    handle && handle.setFixPosition(soundPos)
                }
            }
            return fx
        },

        showPerfectDashEffect: function (entity) {
            var faceDir = ig.getRoundedFaceDir(entity.face.x, entity.face.y, 8, tmpVec2G);
            this.effects.guard.spawnOnTarget("perfectDash", entity, {
                align: "CENTER",
                angle: Vec2.clockangle(faceDir)
            }).setIgnoreSlowdown();
            this.doDramaticEffect(entity, entity, sc.DRAMATIC_EFFECT.PERFECT_DASH, false)
        },
        showHealEffect: function (entity) {
            this.effects.heal.spawnOnTarget("healing", entity)
        },
        showCharge: function (entity, level, element) {
            var name = "chargeLevel" + level;
            element && (name = name + ELEMENT_NAME[element]);
            return this.effects.combat.spawnOnTarget(name, entity, {
                duration: -1,
                align: ig.ENTITY_ALIGN.CENTER
            })
        },
        showThrowEffect: function (entity, element, charged, suffix) {
            var name = ELEMENT_NAME[element];
            charged && (name = name + "Charged");
            suffix && (name = name + suffix);
            return this.effects.throw.spawnOnTarget(name, entity, {
                duration: 0,
                align: ig.ENTITY_ALIGN.FACE
            })
        },
        showModeChange: function (entity, element) {
            var name = ELEMENT_NAME[element];
            ig.EffectTools.clearEffects(entity, "modeChange");
            return this.effects.mode.spawnOnTarget(name, entity, {
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
        showModeAura: function (entity, element) {
            var name = ELEMENT_NAME[element] + "Aura",
                existing = ig.EffectTools.getFirstEffect(entity, "modeAura");
            if (!(existing && existing.effect.id == "combat.mode/" + name)) {
                ig.EffectTools.clearEffects(entity, "modeAura");
                element != sc.ELEMENT.NEUTRAL && this.effects.mode.spawnOnTarget(name, entity, {
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
        clearModeAura: function (entity) {
            ig.EffectTools.clearEffects(entity, "modeAura")
        },
        showModeDash: function (entity, element) {
            var name = ELEMENT_NAME[element] + "Dash";
            ig.EffectTools.clearEffects(entity, "modeDash");
            element != sc.ELEMENT.NEUTRAL && this.effects.mode.spawnOnTarget(name, entity, {
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

        addRespawnBlocker: function (coll) {
            this.respawnBlocker.push(coll)
        },
        isRespawnBlocked: function (coll) {
            for (var i = this.respawnBlocker.length; i--;)
                if (ig.CollTools.intersect(coll, this.respawnBlocker[i], true)) return true;
            return false
        },
        notifyNearbyEnemiesOfTarget: function (entity, radius) {
            for (var pos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3), nearby = ig.game.getEntitiesInCircle(pos, radius, 1, 16, void 0, void 0, void 0, entity), i = nearby.length; i--;) {
                var enemy = nearby[i];
                enemy instanceof ig.ENTITY.Enemy && (enemy.target || enemy.enemyType.reselectTarget(enemy, true))
            }
        },

        isInCombat: function (combatant) {
            return combatant.target || combatant.party == sc.COMBATANT_PARTY.PLAYER && sc.model.isCombatMode() && !sc.model.isCutscene() || sc.pvp.isCombatantInPvP(combatant) ? true : false
        },
        isPlayerPartyInCombat: function () {
            for (var enemies = this.activeCombatants[sc.COMBATANT_PARTY.ENEMY], i = enemies.length; i--;)
                if (enemies[i].aggression == sc.ENEMY_AGGRESSION.THREAT) return true;
            return false
        },

        getEnemyAiExp: function (enemy, factor) {
            if (!enemy.enemyType) return 0;
            if (enemy.enemyType.aiLearnType.knowItAll) return 1;
            factor = factor || 1;
            var enduranceScale = enemy.enemyType.enduranceScale,
                ownKills = sc.stats.getMap("combat", "kill" + enemy.enemyName) || 0,
                groupKills = 0;
            ownKills = ownKills * enduranceScale * factor;
            if (enemy.enemyType.aiGroup) {
                groupKills = sc.stats.getMap("combat", "aiGroupKill" + enemy.enemyType.aiGroup) || 0;
                groupKills = groupKills * enduranceScale * AI_LEARN_GROUP_FACTOR;
                groupKills > AI_LEARN_MAX / 2 && (groupKills = AI_LEARN_MAX / 2)
            } else ownKills = ownKills * (1 + AI_LEARN_GROUP_FACTOR);
            var experience = Math.min(ownKills + groupKills, AI_LEARN_MAX);
            return Math.pow(experience, AI_LEARN_EXP) / Math.pow(AI_LEARN_MAX, AI_LEARN_EXP)
        },
        getKillCount: function () {},
        getElementMode: function (combatant) {
            return combatant instanceof sc.PlayerBaseEntity ? combatant.model.currentElementMode : combatant instanceof ig.ENTITY.Enemy ? combatant.elementModes ? combatant.elementModes.current : sc.ELEMENT.NEUTRAL : sc.ELEMENT.NEUTRAL
        }
    });

    // Enemy AI learning curve constants (used by getEnemyAiExp).
    var AI_LEARN_MAX = 20,
        AI_LEARN_GROUP_FACTOR = 0.5,
        AI_LEARN_EXP = 0.75;

    ig.addGameAddon(function () {
        return sc.combat = new sc.Combat
    });

    tmpVec2A = Vec2.create(); // leftover scratch re-init in the compiled source

    ig.NavExternalBlockers.register(function (entity, other) {
        return other.party != sc.COMBATANT_PARTY.PLAYER ? false : entity.externalData.partyBlocked
    })
});
ig.baked = !0;
