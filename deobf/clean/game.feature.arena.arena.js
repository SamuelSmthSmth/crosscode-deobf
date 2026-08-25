/**
 * @module game.feature.arena.arena
 *
 * Core arena system. Manages cup registration and loading, arena
 * runtime state (rounds, waves, score, chain, player death),
 * combat event listeners for scoring (kills, damage, shields,
 * dodges, etc.), spawn management, round lifecycle (start, end,
 * death, next round), bonus objectives, challenge modifiers,
 * coin earnings, and trophy/medal calculations. Integrates
 * with storage for save/load and with extensions for custom cups.
 */
ig.module("game.feature.arena.arena").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model", "game.feature.arena.entities.arena-spawn", "game.feature.arena.arena-loadable", "game.feature.combat.combat", "game.feature.arena.arena-bonus-objectives", "game.feature.arena.arena-score-types", "game.feature.arena.arena-challenges", "game.feature.arena.arena-cheer").defines(function() {
    var cupOrderMap = {"rookie-cup": {order: 100}, "seeker-cup": {order: 200}, "boss-cup": {order: 1E3}, "faction-cup-1": {order: 2E3}, "faction-cup-2": {order: 2100}, "rookie-team-cup": {order: 101}, "faction-team-cup-1": {order: 200}};
    var customCupOrderMap = {"console-cup-1": {order: 100}};
    var coinWeights = [0.2, 0.3, 0.5];
    sc.ARENA_MEDALS_TROPHIES = {BRONZE: 1, SILVER: 2, GOLD: 3, PLATIN: 4, TRUE_PLATIN: 5};
    sc.ARENA_BASE_TYPE = {SOLO_CUP: "SOLO_CUP", TEAM_CUP: "TEAM_CUP", SOLO_CUSTOM: "SOLO_CUSTOM", TEAM_CUSTOM: "TEAM_CUSTOM"};
    sc.ARENA_ROUND_MODE = {DEFAULT: "DEFAULT"};
    sc.ARENA_CHAIN_MAX_TIME = 10;
    sc.ARENA_SORT_TYPES = {ORDER: 0};
    sc.ARENA_SILVER_MEDAL_QUOTA = 0.7;
    sc.ARENA_RUSH_COIN_QUOTA = 0.5;
    sc.ARENA_TROPHY_QUOTA = 0.75;
    sc.ARENA_EVENT = {};
    sc.ARENA_MAX_CHAIN_HITS = 2;
    sc.ARENA_MAX_CHAIN_MULTIPLIER = 999;
    var conditionCheck = null;
    var spawnPos = Vec3.createC(0, 0, 0);
    var healAmount = {value: 0};
    sc.ARENA_PAUSE_ACTIONS = {NONE: 0, RESTART: 1, LOBBY: 2};
    ig.perf.grantArenaBonus = false;
    ig.perf.enableArenaRound = window.IG_GAME_DEBUG;
    sc.Arena = ig.GameAddon.extend({
        active: false, arenaCache: null, runtime: null, coins: 0, coinsSpend: 0, cups: {},
        observers: [], partyStash: [], pauseOverlay: null, sounds: null,
        effects: new ig.EffectSheet("arena"),
        _pauseBlock: false, _endRoundDone: false, _exitCup: false, _pauseAction: 0,
        _isFinalHit: false, _partySettingBehaviour: null, _hasCustomCups: false,
        init: function() {
            this.parent("Arena");
            for (var cupId in cupOrderMap) this.registerCup(cupId, cupOrderMap[cupId]);
            for (cupId in customCupOrderMap) this.registerCup(cupId, customCupOrderMap[cupId]);
            this.sounds = new sc.ArenaCrowdCheerController;
            ig.storage.register(this);
            ig.vars.registerVarAccessor("arena", this, "VarArenaEditor");
            ig.extensions.addListener(this, "arena");
            sc.Model.addObserver(sc.model, this)
        },
        postUpdateOrder: 700,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused && this.active) {
                ig.game.firstUpdateLoop && sc.stats.addMap("arena", "time", ig.system.tick);
                var runtime = this.runtime;
                if (runtime.killTimer > 0) runtime.killTimer = runtime.killTimer - ig.system.tick;
                if (!runtime.roundFinished && runtime.roundStarted && runtime.chainTimer > 0 && !sc.model.isCutscene()) {
                    runtime.chainTimer = runtime.chainTimer - ig.system.tick;
                    !runtime.chainGui.pulsing && runtime.chainTimer / sc.ARENA_CHAIN_MAX_TIME <= 0.5 && runtime.chainGui.setPulse(true);
                    if (runtime.chainTimer <= 0) {runtime.chain = 0; runtime.rushChain = 0; runtime.chainGui.setChainNumber(0)}
                }
                this.sounds.update()
            }
        },
        onReset: function() {
            this.clearProgress();
            this._cleaRuntimeCache(true);
            if (this.arenaCache) {this.arenaCache.decreaseRef(); this.arenaCache = null}
            this.sounds.resetTimers();
            sc.combat.setCombatSpeed(1);
            this.runtime = null; this.active = false; this.coinsSpend = this.coins = this.partyStash.length = 0;
            this._hasCustomCups = this._endRoundDone = this._pauseBlock = false; this._pauseAction = 0;
            sc.combat.removeCombatListener(this)
        },
        levelLoadStartOrder: 1,
        onLevelLoadStart: function() {
            if (this.active) {
                var runtime = this.runtime;
                this.resetRuntimeRoundStats();
                var round = this.getCurrentRound();
                var cupCore = this.getCupCore(runtime.cup, "music");
                if (!runtime.defaultBgmTrack) runtime.defaultBgmTrack = ig.bgm.loadTrack(runtime.rush ? cupCore.rushMusic || "challenge" : cupCore.music || "challenge");
                this.addChallengeMods();
                (!runtime.rush || runtime.currentRound == 0) && sc.model.player.params.removeAllBuffs();
                sc.party.reviveAllPartyMemberModels();
                if (!this.pauseOverlay) {this.pauseOverlay = new sc.ArenaChallengeOverlay; ig.gui.addGuiElement(this.pauseOverlay)}
                this.pauseOverlay.setChallengeMods(runtime.challengeMods);
                if (!this.isCurrentRoundCustom()) {
                    if (round.music) {runtime.bgmTrack && ig.warn("Unclear bgm track found: " + runtime.bgmTrack.name); runtime.bgmTrack = ig.bgm.loadTrack(round.music || "lolfanfare")}
                    var waves = round.waves, waveCount = waves.length;
                    runtime.enemyInfo && ig.warn("enemyInfo cache might not be cleared!");
                    var enemyInfo = [];
                    for (; waveCount--;) {enemyInfo[waveCount] = []; for (var enemies = waves[waveCount].enemies, enemyIdx = enemies.length; enemyIdx--;) enemyInfo[waveCount][enemyIdx] = new sc.EnemyInfo(enemies[enemyIdx])}
                    runtime.enemyInfo = enemyInfo
                }
            }
        },
        levelLoadedOrder: 200,
        onLevelLoaded: function() {if (this.active && !this.isCurrentRoundCustom()) {this.runtime.roundStartedPre = true; sc.commonEvents.startCallEvent("arena-start-round")}},
        onVarsChanged: function() {if (this.active) {var runtime = this.runtime; if (runtime.playerDeath < 2 && runtime.roundStarted && ig.vars.get("tmp.playerDeathArena")) {runtime.playerDeath = 2; sc.commonEvents.startCallEvent("arena-player-death")}}},
        onPvpRoundFinished: function(result) {result == sc.COMBATANT_PARTY.PLAYER ? this.addScore("PVP_ROUND_WON") : this.addScore("PVP_ROUND_LOST")},
        onPreDamageModification: function(damage, shieldResult) {
            if (this.active && !(this.runtime.roundEndPre || this._pauseAction > 0))
                if (shieldResult == sc.SHIELD_RESULT.PERFECT) this.addScore("PERFECT_SHIELD");
                else if (damage && damage.damage > 0) {
                    var runtime = this.runtime;
                    runtime.chainHits--;
                    if (runtime.chainHits <= 0) {runtime.chain = 0; runtime.rushChain = 0; runtime.chainGui.setChainNumber(0)}
                    else runtime.chain >= 2 && runtime.chainGui.rumble();
                    runtime.chainHits / sc.ARENA_MAX_CHAIN_HITS <= 0.5 && runtime.chainGui.setPulse(true);
                    var params = sc.model.player.params;
                    if (this.hasChallenge("LEA_MUST_DIE")) damage.damage = params.currentHp;
                    if (params.currentHp - damage.damage <= 0 && runtime.playerDeath < 1)
                        if (params.currentHp > 0 && params.getModifier("ONCE_MORE")) this.addScore("DAMAGE_TAKEN", -damage.damage);
                        else {
                            if (!sc.pvp.isActive()) {
                                runtime.playerDeath = 1; runtime.chain = 0; runtime.rushChain = 0; runtime.rushChainMax = 0;
                                runtime.chainGui.setChainNumber(0); this._pauseBlock = true; this._endRoundDone = false;
                                ig.bgm.pause("IMMEDIATELY"); sc.stats.addMap("arena", "deaths", 1);
                                sc.commonEvents.startCallEvent("arena-player-death-pre")
                            }
                        }
                    else ig.perf.grantArenaBonus || this.addScore("DAMAGE_TAKEN", -damage.damage)
                }
        },
        onTargetHit: function(attacker, status, target, targetParams) {if (this.active) {status.status > 0 && attacker.element > 0 && targetParams.statusStates[attacker.element - 1].active && this.addScore("STATUS_INFLICT"); this.refreshChainTimer(true)}},
        onPreDamageApply: function(combatant, hit, shieldResult, target, attacker) {
            if (this.active && !(shieldResult == sc.SHIELD_RESULT.PERFECT || target.getCombatantRoot().party != sc.COMBATANT_PARTY.PLAYER || this.isEnemyBlocked(combatant))) {
                var multiplier = 1;
                if (target.params.buffs.length > 0)
                    for (var buffs = target.params.buffs, idx = 0, len = buffs.length; idx < len; idx++)
                        if (buffs[idx] instanceof sc.ActionBuff && buffs[idx].name == "sergeyHax") {multiplier = attacker.attackerParams.getStat("attack", true) / attacker.attackerParams.getStat("attack", false); break}
                var cappedDmg = Math.min(Math.max(0, combatant.params.currentHp), Math.floor(hit.damage * multiplier));
                if (cappedDmg > 0) {this.addScore("DAMAGE_DONE", cappedDmg); var effective = Math.floor(cappedDmg - cappedDmg / hit.defensiveFactor); if (effective > 0) {sc.stats.addMap("arena", "effectiveDamage", effective); this.addScore("DAMAGE_DONE_EFFECTIVE", effective)}}
            }
        },
        onPreInstantDamage: function(combatant, damage) {if (this.active && !(combatant.party != sc.COMBATANT_PARTY.ENEMY || combatant.getCombatantRoot().party == sc.COMBATANT_PARTY.PLAYER || this.isEnemyBlocked(combatant))) {damage = Math.min(Math.max(0, combatant.params.currentHp), damage); damage > 0 && this.addScore("DAMAGE_DONE", damage)}},
        onLockEnd: function(combatant, attacker, element, lockType) {if (this.active && !this.isEnemyBlocked(combatant) && combatant.params && combatant.params.isDefeated()) {lockType == 2 ? this.addScore("LOCK_FINISH") : lockType == 3 && this.addScore("LOCK_FINISH_3"); this.sounds.play("SURPRISED")}},
        onElementOverload: function() {this.addScore("ELEMENT_OVERLOAD")},
        onPerfectDodge: function() {this.addScore("PERFECT_DODGE")},
        onGuardCounter: function(combatant) {if (this.active && !this.isEnemyBlocked(combatant)) {combatant.getCombatStat("guardCounters", 0) <= 0 && this.addScore("GUARD_COUNTER"); this.sounds.play("SURPRISED")}},
        onEnemyBreak: function(combatant) {if (this.active && !this.isEnemyBlocked(combatant)) {combatant.getCombatStat("breaks", 0) <= 0 && this.addScore("ENEMY_BREAK"); this.sounds.play("SURPRISED")}},
        onHitKill: function(combatant) {this.isEnemyBlocked(combatant) || this.addScore("ONE_HIT_KILL")},
        onCombatantHeal: function(combatant, healAmt) {if (this.active && !combatant.getCombatantRoot().isPlayer && !(combatant.party != sc.COMBATANT_PARTY.ENEMY || this.isEnemyBlocked(combatant))) {var curHp = combatant.params.currentHp, maxHp = combatant.params.getStat("hp"); curHp + healAmt > maxHp && (healAmt = maxHp - curHp); healAmt > 0 && this.addScore("ENEMY_HEAL", -healAmt)}},
        onCombatantDeathHit: function(attacker, combatant) {
            if (this.active && !this.runtime.playerDeath && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
                sc.stats.addMap("arena", "kills", 1);
                var runtime = this.runtime;
                if (!this.isEnemyBlocked(combatant)) {this.increaseChain(); combatant.enemyType && combatant.enemyType.boss ? this.addScore("BOSS_KILL") : this.addScore("KILL"); runtime.killTimer > 0 && this.addScore("MULTI_KILL"); runtime.killTimer = 0.3}
                this.sounds.play("APPLAUSE");
                if (!runtime.customRound) {
                    this.isEnemyBlocked(combatant) || runtime.roundKills++;
                    if (runtime.roundKills >= runtime.waveKillsNeeded) {
                        var round = this.getCurrentRound();
                        if (runtime.currentWave == round.waves.length - 1) {runtime.rush ? runtime.currentRound == runtime.rounds.length - 1 && ig.bgm.pause("IMMEDIATELY") : ig.bgm.pause("IMMEDIATELY"); runtime.roundEndPre = true; sc.commonEvents.startCallEvent("arena-end-round")}
                        else sc.commonEvents.startCallEvent("arena-next-wave")
                    }
                }
            }
        },
        onEnvironmentKill: function(combatant) {this.active && !(combatant.party != sc.COMBATANT_PARTY.ENEMY || this.isEnemyBlocked(combatant)) && this.addScore("ENVIRONMENT_KILL")},
        onFinalDeathHit: function() {var runtime = this.runtime; if (this.active && (!runtime.playerDeath && !(runtime.roundEndPre || this._pauseAction > 0)) && runtime.customRound) {this._isFinalHit = true; runtime.roundEndPre = true; ig.game.varsChangedDeferred()}},
        spawnCurrentWave: function(silent, increase, focusPlayer) {
            if (this.active && !this.runtime.playerDeath && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
                var round = this.getCurrentRound(), waves = round.waves, runtime = this.runtime;
                if (increase) runtime.currentWave = Math.min(runtime.currentWave + 1, waves.length - 1);
                var wave = waves[runtime.currentWave];
                sc.combat.setCombatSpeed(wave.speed ? wave.speed || 1 : round.speed || 1);
                runtime.waveKillsNeeded = runtime.waveKillsNeeded + wave.enemies.length;
                for (var enemies = wave.enemies, idx = enemies.length; idx--;) this._spawnEnemy(idx, enemies[idx], this._getLevelToSpawn(enemies[idx], wave, round, this.getCupCore(runtime.cup)), silent);
                if (focusPlayer) {var entities = ig.game.entities; for (idx = entities.length; idx--;) {var ent = entities[idx]; ent instanceof ig.ENTITY.Enemy && ent.setTarget(ig.game.playerEntity, true)}}
                ig.game.varsChangedDeferred()
            }
        },
        startRound: function() {
            var runtime = this.runtime, round = this.getCurrentRound();
            runtime.scoreStats = {};
            this.addGui();
            sc.timers.timers.arenaTimer ? sc.timers.resumeTimer("arenaTimer") : sc.timers.addTimer("arenaTimer", sc.TIMER_TYPES.COUNTER, null, null, null, true, true, null, ig.lang.get("sc.gui.arena.time"), true);
            if (!sc.pvp.isActive()) ig.game.playerEntity.manualKill = "tmp.playerDeathArena";
            sc.timers.addTimer("arenaTimerReal", sc.TIMER_TYPES.COUNTER, null, null, null, false, true);
            runtime.customRound = round.customCode || false;
            runtime.roundKills = 0; runtime.score = 0; runtime.roundFinished = false; runtime.roundStarted = true;
            runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS; runtime.prevScoreType = null; runtime.killTimer = 0;
            runtime.chain = 0; runtime.chainGui.setChainNumber(0, true);
            runtime.prevMedal = this.getCupMedal(runtime.cup, runtime.currentRound);
            if (!runtime.rush || runtime.rush && runtime.currentRound == 0) {healAmount.value = 1; ig.game.playerEntity.heal(healAmount, true); sc.model.player.setElementMode(0, true, true); sc.party.reviveAllPartyMembers()}
            else {healAmount.value = 0.5; ig.game.playerEntity.heal(healAmount, false)}
            sc.model.player.params.resetSp();
            for (var challengeKey in runtime.challengeMods) {ig.debug("CHALLENGE ON: " + challengeKey); sc.ARENA_CHALLENGES[challengeKey].toggle(true)}
            this.addBonusObjectives();
            sc.model.setTask(this.getCurrentObjective(), false, 0);
            if (!round.customCode) {runtime.rush && runtime.currentRound == 0 ? ig.bgm.play(runtime.bgmTrack || runtime.defaultBgmTrack, 1, "IMMEDIATELY") : runtime.rush || ig.bgm.play(runtime.bgmTrack || runtime.defaultBgmTrack, 1, "IMMEDIATELY"); var entities = ig.game.entities; for (var idx = entities.length; idx--;) {var ent = entities[idx]; ent instanceof ig.ENTITY.Enemy && ent.setTarget(ig.game.playerEntity, true)}}
        },
        endRound: function() {
            ig.system.skipMode = false;
            var runtime = this.runtime;
            this._pauseBlock = true; this._endRoundDone = false;
            sc.timers.stopTimer("arenaTimer"); sc.timers.stopTimer("arenaTimerReal");
            runtime.timer = sc.timers.timers.arenaTimerReal ? sc.timers.getPassedTime("arenaTimerReal") : 0;
            runtime.scoreGui && runtime.scoreGui.remove();
            ig.gui.freeEventGui(runtime.scoreGui); runtime.scoreGui = null;
            runtime.roundStarted = false; runtime.roundFinished = true;
            runtime.chainGui.pulsing && runtime.chainGui.setPulse(false);
            var overlay = new sc.ArenaRoundEndOverlay; ig.gui.addGuiElement(overlay); overlay.show()
        },
        endRoundDeath: function() {
            ig.system.skipMode = false;
            var runtime = this.runtime;
            this._pauseBlock = true; this._endRoundDone = false;
            sc.timers.stopTimer("arenaTimer"); sc.timers.stopTimer("arenaTimerReal");
            runtime.timer = 0; runtime.chainGui.pulsing && runtime.chainGui.setPulse(false);
            var overlay = new sc.ArenaPlayerDeathOverlay; ig.gui.addGuiElement(overlay); overlay.show()
        },
        stopTimers: function() {sc.timers.stopTimer("arenaTimer"); sc.timers.stopTimer("arenaTimerReal")},
        resumeTimers: function() {sc.timers.resumeTimer("arenaTimer"); sc.timers.resumeTimer("arenaTimerReal")},
        startNextRound: function(incrementRound) {
            var runtime = this.runtime;
            this._cleaRuntimeCache(false);
            sc.model.setTask(null, false);
            if (runtime.scoreGui) {runtime.scoreGui.remove(); ig.gui.freeEventGui(runtime.scoreGui); runtime.scoreGui = null}
            runtime.chainGui && runtime.chainGui.setChainNumber(0);
            sc.timers.removeTimer("arenaTimerReal");
            runtime.rush || sc.timers.removeTimer("arenaTimer");
            incrementRound && runtime.currentRound++;
            this._endRoundDone = true
        },
        restartCup: function() {var runtime = this.runtime; runtime.currentRound = 0; runtime.rushChain = 0; runtime.rushChainMax = 0; if (runtime.rush) for (var scores = runtime.rushScores, idx = scores.length; idx--;) {scores[idx].points = 0; scores[idx].medal = 0; scores[idx].time = 0} sc.timers.removeTimer("arenaTimer"); this.startNextRound(false)},
        prepareLobbyReturn: function() {var runtime = this.runtime; runtime.chainGui && runtime.chainGui.setChainNumber(0); if (runtime.scoreGui) {runtime.scoreGui.remove(); ig.gui.freeEventGui(runtime.scoreGui); runtime.scoreGui = null} sc.timers.removeTimer("arenaTimerReal"); sc.timers.removeTimer("arenaTimer"); this._endRoundDone = true},
        teleportToCurrentRound: function() {var round = this.runtime.rounds[this.runtime.currentRound]; ig.game.teleport(round.map, round.spawn ? new ig.TeleportPosition(round.spawn) : null)},
        resetRuntimeRoundStats: function() {var runtime = this.runtime; sc.stats.setMap("arena", "effectiveDamage", 0); this.sounds.resetTimers(); this._validateCoins(); runtime.playerDeath = 0; this._pauseBlock = this._isFinalHit = false; this._pauseAction = 0; this._endRoundDone = false; runtime.challengeMods = {}; runtime.bonusObjectives.length = 0; runtime.roundEndPre = false; runtime.roundKills = 0; runtime.roundStarted = false; runtime.roundStartedPre = false; runtime.roundFinished = false; runtime.currentWave = 0; runtime.waveKillsNeeded = 0; runtime.scoreStats = {}; runtime.enemyIgnore = {}; runtime.scoreIgnore = {}; runtime.prevScoreType = null},
        addChallengeMods: function() {this.runtime.challengeMods = this.getChallengeMods(this.runtime.cup, this.runtime.currentRound)},
        addBonusObjectives: function() {
            var runtime = this.runtime, round = this.getCurrentRound();
            runtime.bonusObjectives.length = 0;
            var bonuses = round.bonuses;
            for (var idx = bonuses.length; idx--;) {var data = {}, bonus = bonuses[idx]; sc.ARENA_BONUS_OBJECTIVE[bonus.type].init(bonus, data); runtime.bonusObjectives.push({type: bonus.type, points: bonus.points, data: data})}
            for (var key in sc.ARENA_DEFAULT_BONUS_OBJECTIVES) {data = {}; var defaultBonus = sc.ARENA_DEFAULT_BONUS_OBJECTIVES[key]; if (!defaultBonus.challenge || this.hasChallenge(defaultBonus.challenge)) if (!defaultBonus.ignoreOn || !this.hasChallenge(defaultBonus.ignoreOn)) {sc.ARENA_BONUS_OBJECTIVE[key].init(defaultBonus, data); runtime.bonusObjectives.push({type: key, points: defaultBonus.points, data: data})}}
        },
        addGui: function() {
            var runtime = this.runtime;
            if (runtime.scoreGui) {runtime.scoreGui.remove(); ig.gui.freeEventGui(runtime.scoreGui)}
            var scoreHud = ig.gui.createEventGui("score", "ScoreHud", {taskTitle: ig.lang.get("sc.gui.arena.score"), maxValue: 999999999, time: 0.2, useDots: true, variable: "arena.score", cutsceneOkay: true});
            ig.gui.spawnEventGui(scoreHud);
            runtime.scoreGui = scoreHud;
            if (runtime.chainGui) runtime.chainGui.setPos(0, 22);
            else {var chainHud = new sc.ArenaChainHud; ig.gui.addGuiElement(chainHud); runtime.chainGui = chainHud}
            ig.game.varsChangedDeferred()
        },
        addScore: function(scoreType, value) {
            if (this.active && sc.ARENA_SCORE_TYPES[scoreType] && !this.runtime.scoreIgnore[scoreType]) {
                var scoreDef = sc.ARENA_SCORE_TYPES[scoreType], points = 0, runtime = this.runtime, scoreStats = runtime.scoreStats;
                scoreStats[scoreType] || (scoreStats[scoreType] = {count: 0, value: 0, repeated: 1, "static": scoreDef["static"]});
                if (scoreStats[scoreType]["static"]) {points = 1; scoreDef.staticMultiplier && !this.hasChallenge("PVP_BATTLE") && (points = scoreDef.staticMultiplier); points = Math.floor(value * points)}
                else {
                    var isChain = scoreDef.chain || false, isDimReturns = scoreDef.dimReturns || false;
                    points = scoreDef.points || 0;
                    isChain && (points = points * this.getChainMultiplier());
                    if (runtime.prevScoreType == scoreType) scoreStats[scoreType].repeated++;
                    else if (runtime.prevScoreType) scoreStats[runtime.prevScoreType].repeated = 1;
                    isDimReturns && (points = points / scoreStats[scoreType].repeated);
                    scoreStats[scoreType].count++;
                    points = Math.floor(points)
                }
                runtime.score = runtime.score + points;
                if (runtime.score < 0) runtime.score = 0;
                scoreStats[scoreType].value = scoreStats[scoreType].value + points;
                runtime.prevScoreType = scoreType;
                ig.game.varsChangedDeferred()
            }
        },
        addScoreIgnore: function(type) {this.active && sc.ARENA_SCORE_TYPES[type] && (this.runtime.scoreIgnore[type] = true)},
        removeScoreIgnore: function(type) {this.active && sc.ARENA_SCORE_TYPES[type] && this.runtime.scoreIgnore[type] && delete this.runtime.scoreIgnore[type]},
        clearScoreIgnore: function() {if (this.active) this.runtime.scoreIgnore = {}},
        increaseChain: function(amount) {amount = amount || 1; var runtime = this.runtime; runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS; runtime.chain = runtime.chain + amount; runtime.rushChain = runtime.rushChain + amount; runtime.rushChainMax = Math.max(runtime.rushChain, runtime.rushChainMax); runtime.chain < 0 ? this.resetChain() : this.refreshChainTimer()},
        refreshChainTimer: function(skipUpdate) {var runtime = sc.arena.runtime; runtime.chainTimer = sc.ARENA_CHAIN_MAX_TIME; runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS; runtime.chainGui.pulsing && runtime.chainGui.setPulse(false); skipUpdate || runtime.chainGui && runtime.chainGui.setChainNumber(runtime.chain)},
        resetChain: function() {var runtime = this.runtime; runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS; runtime.chain = 0; runtime.rushChain = 0; runtime.chainGui.setChainNumber(0); runtime.chainTimer = sc.ARENA_CHAIN_MAX_TIME},
        getChainMultiplier: function() {return Math.min(sc.ARENA_MAX_CHAIN_MULTIPLIER, Math.max(1, 1 + (this.runtime.chain - 1)))},
        enterArenaMode: function(cupId, roundIndex) {
            this.active = true;
            sc.model.setMobilityBlock("CHECKPOINT");
            sc.model.player.setCore(sc.PLAYER_CORE.CREDITS, false);
            sc.model.player.setCore(sc.PLAYER_CORE.EXP, false);
            sc.model.player.setCore(sc.PLAYER_CORE.ITEMS, false);
            this.arenaCache = new sc.ArenaCache;
            this.runtime = {scoreIgnore: {}, enemyIgnore: {}, defaultBgmTrack: null, bgmTrack: null, scoreGui: null, chainGui: null, score: 0, prevScore: 0, timer: 0, cup: cupId, prevMedal: 0, customRound: false, preTrophy: this.getCupTrophy(cupId), chain: 0, rushChain: 0, rushChainMax: 0, chainHits: sc.ARENA_MAX_CHAIN_HITS, chainTimer: 0, type: this.getCupCoreAttrib(cupId, "type"), roundKills: 0, currentWave: 0, waveKillsNeeded: 0, playerDeath: 0, rush: roundIndex == -1, roundStarted: false, roundStartedPre: false, scoreStats: {}, prevScoreType: null, roundEndPre: false, bonusObjectives: [], challengeMods: {}, currentRound: roundIndex == -1 ? 0 : roundIndex, enemyInfo: null, rounds: this.getCupRounds(cupId)};
            if (this.runtime.rush) {var rt = this.runtime; rt.rushScores = []; for (var rounds = rt.rounds, idx = 0; idx < rounds.length; idx++) rt.rushScores.push({points: 0, medal: 0, time: 0})}
            this._partySettingBehaviour = sc.party.strategyKeys.BEHAVIOUR;
            !this.isCupSolo(this.runtime.cup) && this._partySettingBehaviour == "DO_NOTHING" && sc.party.updatePartyStrategy("BEHAVIOUR", "OFFENSIVE");
            if (this.hasAscendedChallenge(this.runtime.cup)) {sc.inventory.updateScaledEquipment(this.getCupLevel(this.runtime.cup)); sc.model.player.updateStats()}
        },
        exitArenaMode: function() {
            this.active = false; sc.combat.setCombatSpeed(1); sc.combat.removeCombatListener(this);
            if (this.hasAscendedChallenge(this.runtime.cup)) {sc.inventory.updateScaledEquipment(sc.model.player.level); sc.model.player.updateStats()}
            this.arenaCache.decreaseRef(); this.arenaCache = null;
            this._cleaRuntimeCache(true);
            sc.model.setTask();
            sc.timers.removeTimer("arenaTimerReal"); sc.timers.removeTimer("arenaTimer");
            ig.game.playerEntity.manualKill = null;
            sc.party.updatePartyStrategy("BEHAVIOUR", this._partySettingBehaviour);
            if (this.pauseOverlay) {this.pauseOverlay.remove(); this.pauseOverlay = null}
            var runtime = this.runtime;
            runtime.chainGui && runtime.chainGui.doStateTransition("HIDDEN", false, true);
            if (runtime.scoreGui) {runtime.scoreGui.remove(); ig.gui.freeEventGui(runtime.scoreGui)}
            sc.model.player.setCore(sc.PLAYER_CORE.CREDITS, true);
            sc.model.player.setCore(sc.PLAYER_CORE.EXP, true);
            sc.model.player.setCore(sc.PLAYER_CORE.ITEMS, true);
            sc.model.setMobilityBlock("NONE");
            this._endRoundDone = this._pauseBlock = false;
            this.runtime = null; this._exitCup = true; this._isFinalHit = false; this._partySettingBehaviour = null;
            sc.arena.isCupSolo(runtime.cup) && this.unstashPartyMembers();
            ig.game.teleport("rhombus-sqr.interior.arena-01", new ig.TeleportPosition("CUP_END"))
        },
        stashPartyMembers: function() {this.partyStash.length >= 1 && ig.warn("Trying to stash party members while other are stashed."); this.partyStash.length = 0; for (var party = sc.party.currentParty, idx = 0; idx < party.length; idx++) this.partyStash.push(party[idx]); for (idx = 0; idx < this.partyStash.length; idx++) sc.party.removePartyMember(this.partyStash[idx], null, true)},
        unstashPartyMembers: function() {if (this.partyStash.length >= 1) {for (var idx = 0; idx < this.partyStash.length; idx++) sc.party.addPartyMember(this.partyStash[idx], null, null, true); this.partyStash.length = 0}},
        registerCup: function(cupId, config, isExtension) {this.cups[cupId] ? ig.warn("Cup with id '" + cupId + "' already exists.") : this.cups[cupId] = {path: config.path || cupId, order: config.order != void 0 ? config.order : 9999999, extension: isExtension || false, data: null, progress: null}},
        loadCache: function() {ig.JSON_LOG && ig.log("%cLOADABLE: %cLoading Cup Cache: \n%O", "color:#149AEB", "", this.cups); for (var cupId in this.cups) {var cup = this.cups[cupId]; if (cup.path) {cup.data = new sc.CupAsset(cupId, cup.path); cup.data.addLoadListener(this)}} this.sounds.loadCache()},
        clearCache: function() {ig.JSON_LOG && ig.log("%cLOADABLE: %cClearing Cup Cache: \n%O", "color:#149AEB", "", this.cups); for (var cupId in this.cups) {var cup = this.cups[cupId]; if (cup.path && cup.data) {cup.data.decreaseRef(); cup.data = null}} this.sounds.clearCache()},
        initMetaData: function(cupId) {
            if (this.cups[cupId]) {
                this.cups[cupId].name = this.getCupCoreAttrib(cupId, "name");
                this.cups[cupId].condition = this.getCupCoreAttrib(cupId, "condition") || null;
                this.cups[cupId].noRush = this.getCupCoreAttrib(cupId, "noRush") || false;
                var cupType = this.getCupCoreAttrib(cupId, "type");
                if (this.cups[cupId].extension) {cupType == "SOLO_CUP" && (this.getCupCore(cupId).type = "SOLO_CUSTOM"); cupType == "TEAM_CUP" && (this.getCupCore(cupId).type = "TEAM_CUSTOM")}
                cupType = this.getCupCoreAttrib(cupId, "type");
                if (cupType == "SOLO_CUSTOM" || cupType == "TEAM_CUSTOM") this._hasCustomCups = true;
                if (this.cups[cupId].progress) {
                    var rounds = this.getCupRounds(cupId);
                    var progressRounds = this.cups[cupId].progress.rounds;
                    if (rounds.length != progressRounds.length)
                        if (rounds.length > progressRounds.length) for (var idx = progressRounds.length; idx < rounds.length; idx++) progressRounds.push({medal: 0, points: 0, time: 0, cleared: 0});
                        else progressRounds.length = rounds.length
                } else this.setEmptyProgress(cupId)
            } else throw Error("Cup not found: " + cupId);
        },
        setEmptyProgress: function(cupId) {var rounds = this.getCupRounds(cupId); if (!rounds) this.cups[cupId].progress = null; var progress = {rush: {medal: 0, points: 0, time: 0, cleared: 0, chain: 0}, rounds: []}; for (var idx = 0; idx < rounds.length; idx++) progress.rounds.push({medal: 0, points: 0, time: 0, cleared: 0}); this.cups[cupId].progress = progress},
        setPauseAction: function(action) {this._pauseAction = action},
        saveScore: function(score, isRush) {
            score < 0 && (score = 0);
            var runtime = this.runtime;
            var progress = isRush ? this.cups[runtime.cup].progress.rush : this.cups[runtime.cup].progress.rounds[runtime.currentRound];
            runtime.score = score;
            var prevTrophy = isRush ? runtime.preTrophy : this.getCupTrophy(runtime.cup);
            runtime.prevMedal = progress.medal;
            progress.cleared++; progress.points = Math.max(progress.points, score);
            progress.medal = this.getMedalForCurrentRound(progress.points, isRush);
            progress.time = runtime.timer <= 0 ? 0 : progress.time <= 0 ? runtime.timer : Math.min(runtime.timer, progress.time);
            sc.stats.addMap("arena", "score", score);
            if (progress.medal > 0) {sc.stats.addMap("arena", "totalMedals", 1); sc.stats.addMap("arena", "medals-got-" + progress.medal, 1)}
            if (runtime.rush && !isRush) {var rushScore = runtime.rushScores[runtime.currentRound]; rushScore.points = Math.max(score, 0); rushScore.medal = this.getMedalForCurrentRound(rushScore.points, isRush); rushScore.time = Math.max(runtime.timer, 0)}
            if (isRush) {progress.chain = Math.max(progress.chain, runtime.rushChainMax); sc.stats.addMap("arena", "rushCleared", 1)}
            else sc.stats.addMap("arena", "roundsCleared", 1);
            return this.getCupTrophy(runtime.cup) > prevTrophy
        },
        saveRushScore: function() {var runtime = this.runtime; runtime.timer = sc.timers.getPassedTime("arenaTimer"); var total = 0; for (var scores = runtime.rushScores.length; scores--;) total = total + runtime.rushScores[scores].points; return this.saveScore(total, true)},
        addEnemyIgnore: function(name) {this.active && name && (this.runtime.enemyIgnore[name] = true)},
        removeEnemyIgnore: function(name) {this.active && name && (this.runtime.enemyIgnore[name] = false)},
        removeArenaCoins: function(amount) {this.coinsSpend = this.coinsSpend + amount; this.coins = this.coins - amount},
        clearProgress: function(cupId, roundIdx) {
            if (cupId) {if (this.cups[cupId].progress) {if (roundIdx != void 0) return this._clearProgress(cupId, roundIdx); this._clearProgress(cupId, -1); for (var idx = 0; idx < this.cups[cupId].progress.rounds.length; idx++) this._clearProgress(cupId, idx)}}
            else for (var key in this.cups) if (this.cups[key].progress) {this._clearProgress(key, -1); for (idx = 0; idx < this.cups[key].progress.rounds.length; idx++) this._clearProgress(key, idx)}
        },
        _getCoinWeightMultiplier: function(from, to) {from = Math.min(from, 3); to = Math.min(to, 3); if (to - from > 0) {var total = 0; for (var idx = from; idx < to; idx++) total = total + coinWeights[idx]; return total} return 0},
        _validateCoins: function() {var totalCoins = 0, key; for (key in this.cups) this.isCupCustom(key) || (totalCoins = totalCoins + this.getArenaCoinsObtainedInCup(key)); this.coins = totalCoins - this.coinsSpend; if (this.coins < 0) this.coins = 0},
        _clearProgress: function(cupId, roundIdx) {if (this.cups[cupId].progress) {if (roundIdx == -1) this.cups[cupId].progress.rush = {points: 0, medal: 0, time: 0, cleared: 0, chain: 0}; this.cups[cupId].progress.rounds[roundIdx] = {points: 0, medal: 0, time: 0, cleared: 0}}},
        _cleaRuntimeCache: function(fullClear) {
            var runtime = this.runtime;
            if (runtime) {
                if (sc.pvp.isActive()) {sc.pvp.onReset(); sc.model.setCombatMode(false, true)}
                ig.gui.clearNamedGuiElements();
                if (fullClear) {runtime.defaultBgmTrack && runtime.defaultBgmTrack.clearCached(); runtime.defaultBgmTrack = null}
                runtime.bgmTrack && runtime.bgmTrack.clearCached(); runtime.bgmTrack = null;
                if (runtime.enemyInfo) {for (var idx = runtime.enemyInfo.length; idx--;) for (var j = runtime.enemyInfo[idx].length; j--;) runtime.enemyInfo[idx][j].clearCached(); runtime.enemyInfo = null}
                for (var key in runtime.challengeMods) {ig.debug("CHALLENGE OFF: " + key); sc.ARENA_CHALLENGES[key].toggle(false)}
            }
        },
        _spawnEnemy: function(idx, enemyCfg, level, silent) {
            var marker = ig.game.getEntityByName(enemyCfg.marker);
            var enemyInfo = this.runtime.enemyInfo[this.runtime.currentWave][idx];
            var coll = marker.coll, enemyType = enemyInfo.enemyType;
            var align = enemyCfg.align;
            var pos = spawnPos; pos = pos || Vec3.createC(0, 0, 0);
            pos.z = coll.pos.z;
            align = align || defaultAlign;
            switch (sc.ARENA_ALIGN_X[align.alignX || "CENTER"]) {
                case sc.ARENA_ALIGN_X.LEFT: pos.x = coll.pos.x; break;
                case sc.ARENA_ALIGN_X.CENTER: pos.x = coll.pos.x + coll.size.x / 2 - enemyType.size.x / 2; break;
                case sc.ARENA_ALIGN_X.RIGHT: pos.x = coll.pos.x + coll.size.x - enemyType.size.x
            }
            switch (sc.ARENA_ALIGN_Y[align.alignY || "CENTER"]) {
                case sc.ARENA_ALIGN_Y.TOP: pos.y = coll.pos.y; break;
                case sc.ARENA_ALIGN_Y.CENTER: pos.y = coll.pos.y + coll.size.y / 2 - enemyType.size.y / 2; break;
                case sc.ARENA_ALIGN_Y.BOTTOM: pos.y = coll.pos.y + coll.size.y - enemyType.size.y
            }
            pos.x = pos.x + (align.offset ? align.offset.x || 0 : 0);
            pos.y = pos.y + (align.offset ? align.offset.y || 0 : 0);
            pos.z = pos.z + (align.offset ? align.offset.z || 0 : 0);
            var settings = enemyInfo.getSettings(); settings.level = level;
            ig.game.spawnEntity(ig.ENTITY.Enemy, pos.x, pos.y, pos.z, {enemyInfo: settings}, !silent)
        },
        _getLevelToSpawn: function(enemy, wave, round, cupCore) {return enemy.level ? ig.Event.getExpressionValue(enemy.level) : wave.level ? ig.Event.getExpressionValue(wave.level) : round.level ? ig.Event.getExpressionValue(round.level) : cupCore.level ? ig.Event.getExpressionValue(cupCore.level) : 1},
        onExtensionLoaded: function(cupInfo, path) {this.registerCup(cupInfo.id, cupInfo, this.isSafeExtension(path))},
        isSafeExtension: function(path) {return path.path == "post-game" ? false : true},
        modelChanged: function(model, msg) {this.active && msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && (sc.model.isPaused() && this.hasAnyChallenge() ? this.pauseOverlay && this.pauseOverlay.show() : this.pauseOverlay && this.pauseOverlay.hide())},
        onLoadableComplete: function(asset, data) {if (asset && data && this.cups[data.key]) {this.initMetaData(data.key); for (var rounds = data.data.rounds, idx = rounds.length; idx--;) {var round = rounds[idx]; if (!round.platPoints || round.platPoints < round.points) round.platPoints = (round.points || 1E3) * 1E3}}},
        onVarAccess: function(path, args) {
            if (args[0] == "arena" && args[1]) {
                switch (args[1]) {
                    case "currentRound": return this.runtime.currentRound;
                    case "currentWave": return this.runtime.currentWave;
                    case "active": return this.active;
                    case "isCurrentSolo": return this.runtime ? this.isCupSolo(this.runtime.cup) : false;
                    case "roundCameraTarget": return this.getCurrentRound().camFocus || "";
                    case "roundFocusTarget": return this.getCurrentRound().roundFocus || "";
                    case "waveCameraTarget": return args[2] && args[2] == "next" ? this.getNextWave().camFocus || "" : this.getCurrentWave().camFocus || "";
                    case "objective": return this.getCurrentObjective();
                    case "enemyLevel": return ig.Event.getExpressionValue(this.getCurrentRound().level) || this.getCupLevel(this.runtime.cup) || 0;
                    case "roundLevel": return ig.Event.getExpressionValue(this.getCurrentRound().level) || 0;
                    case "cupLevel": return this.getCupLevel(this.runtime.cup) || 0;
                    case "isRush": return this.active && this.runtime.rush;
                    case "finalHit": return this._isFinalHit;
                    case "isLastWave": return this.runtime.currentWave == this.getCurrentRound().waves.length - 1;
                    case "isLastRound": return this.isCurrentRoundLast();
                    case "isCustomRound": return this.runtime.customRound;
                    case "isPauseRestart": return this._pauseAction == sc.ARENA_PAUSE_ACTIONS.RESTART;
                    case "isPauseLobby": return this._pauseAction == sc.ARENA_PAUSE_ACTIONS.LOBBY;
                    case "score": return this.runtime ? this.runtime.score : 0;
                    case "roundStarted": return this.runtime ? this.runtime.roundStarted : false;
                    case "roundFinished": return this.runtime ? this.runtime.roundFinished : false;
                    case "cupEnded": return this._exitCup;
                    case "hasCustomCups": return this._hasCustomCups
                }
                if (this.cups[args[1]]) switch (args[2]) {
                    case "name": return this.getCupName(args[1]);
                    case "isSolo": return this.isCupSolo(args[1])
                }
            }
            throw Error("Unsupported var access path: " + path);
        },
        clearEndFlag: function() {if (this._exitCup) {this._exitCup = false; this._pauseAction = sc.ARENA_PAUSE_ACTIONS.NONE}},
        getTotalArenaCompletion: function() {var total = 0, count = 0, key; for (key in cupOrderMap) {total = total + this.getCupCompletion(key); count++} return total / count},
        getTotalDefaultCups: function(asObject) {
            if (asObject) {
                var keys = Object.keys(cupOrderMap); keys.sort(function(a, b) {return cupOrderMap[a].order - cupOrderMap[b].order}.bind(this));
                var result = {}; for (var idx = 0; idx < keys.length; idx++) result[keys[idx]] = cupOrderMap[keys[idx]];
                return result
            }
            return cupOrderMap
        },
        getTotalDefaultTrophies: function(threshold, returnTotal) {
            var earned = 0, total = 0, key;
            for (key in cupOrderMap) {
                var trophy = this.getCupTrophy(key);
                if (this.isCupUnlocked(key))
                    if (threshold == 0) {earned = earned + trophy; total = total + 5}
                    else {trophy >= threshold && earned++; total++}
            }
            return returnTotal ? total : earned
        },
        isSideMessagesBlocked: function() {return !this.active ? false : this.runtime.roundStartedPre || this.runtime.roundStarted},
        isEnemyBlocked: function(combatant) {if (!this.active) return false; if (combatant) return this.runtime.enemyIgnore[combatant.enemyName] ? true : combatant.getAttribute("arenaIgnore") != void 0},
        getCupCompletion: function(cupId) {
            var cup = this.cups[cupId];
            if (cup && cup.progress) {
                var progress = cup.progress, roundCount = 1;
                var goldCount = progress.rush.medal >= sc.ARENA_MEDALS_TROPHIES.GOLD ? 1 : 0;
                if (cup.noRush) goldCount = roundCount = 0;
                if (progress) {
                    var rounds = progress.rounds;
                    for (var idx = rounds.length; idx--;) {rounds[idx].medal >= sc.ARENA_MEDALS_TROPHIES.GOLD && goldCount++; roundCount++}
                    return goldCount / roundCount
                }
            }
            return 0
        },
        getCurrentObjective: function() {var round = this.getCurrentRound(); return round.objective ? ig.LangLabel.getText(round.objective) : ig.lang.get("sc.gui.arena.menu.objectiveDefault")},
        getChallengeMods: function(cupId, roundIdx) {
            var mods = {}, globalMods = this.getCupCoreAttrib(cupId, "mods"), idx = 0;
            if (globalMods) for (idx = globalMods.length; idx--;) mods[globalMods[idx]] = {global: true};
            if (roundIdx >= 0) {
                var roundMods = this.getCupRounds(cupId)[roundIdx || 0].mods;
                if (roundMods) for (idx = roundMods.length; idx--;) mods[roundMods[idx]] || (mods[roundMods[idx]] = {global: false})
            }
            return mods
        },
        isStatusModifierBlocked: function(modifier) {return !this.active ? false : this.runtime.challengeMods["NO_" + modifier]},
        hasAnyChallenge: function() {for (var key in this.runtime.challengeMods) return true; return false},
        hasChallenge: function(challenge) {return !this.active ? false : this.runtime.challengeMods[challenge]},
        hasAscendedChallenge: function(cupId) {return this.getCupCoreAttrib(cupId, "mods")},
        isScoreNewRecord: function(score, cupId, roundIdx) {cupId = cupId || this.runtime.cup; roundIdx = roundIdx || this.runtime.currentRound; return !this.cups[cupId] || !this.cups[cupId].progress ? false : score > (roundIdx < 0 ? this.cups[cupId].progress.rush.points : this.cups[cupId].progress.rounds[roundIdx].points)},
        isPauseBlocked: function() {return this._pauseBlock},
        getCurrentWave: function() {return this.runtime.rounds[this.runtime.currentRound].waves[this.runtime.currentWave]},
        getNextWave: function() {var round = this.runtime.rounds[this.runtime.currentRound], wave = this.runtime.currentWave; return round.waves[wave + 1] ? round.waves[wave + 1] : null},
        getCurrentRound: function() {return this.runtime.rounds[this.runtime.currentRound]},
        isCurrentRoundCustom: function() {return this.runtime.rounds[this.runtime.currentRound].customCode},
        isCurrentRoundLast: function() {return this.runtime.currentRound == this.runtime.rounds.length - 1},
        isCupSolo: function(cupId) {var cupType = this.getCupCoreAttrib(cupId, "type"); return cupType == "SOLO_CUP" || cupType == "SOLO_CUSTOM"},
        isCupCustom: function(cupId) {var cupType = this.getCupCoreAttrib(cupId, "type"); return cupType == "SOLO_CUSTOM" || cupType == "TEAM_CUSTOM"},
        getRoundCompletionTotal: function(cupId, roundIdx) {return this.cups[cupId] ? roundIdx == -1 ? this.cups[cupId].progress.rush.cleared : this.cups[cupId].progress.rounds[roundIdx].cleared : 0},
        getRoundMedalRequirement: function(cupId, roundIdx, isSilver, isPlatinum) {
            var rounds = this.getCupRounds(cupId);
            if (rounds) {
                if (roundIdx == -1) {var total = 0; for (var len = rounds.length; len--;) total = total + (isPlatinum ? rounds[len].platPoints ? rounds[len].platPoints : rounds[len].points * 1E3 : rounds[len].points); return Math.round(total * (isSilver ? sc.ARENA_SILVER_MEDAL_QUOTA : 1))}
                return Math.round(rounds[roundIdx][isPlatinum ? "platPoints" : "points"] * (isSilver ? sc.ARENA_SILVER_MEDAL_QUOTA : 1))
            }
            return 0
        },
        getMedalForCurrentRound: function(points, isRush) {
            var runtime = this.runtime;
            if (isRush) {
                if (points >= this.getRoundMedalRequirement(runtime.cup, -1, false, true)) return sc.ARENA_MEDALS_TROPHIES.PLATIN;
                if (points >= this.getRoundMedalRequirement(runtime.cup, -1, false, false)) return sc.ARENA_MEDALS_TROPHIES.GOLD;
                if (points >= this.getRoundMedalRequirement(runtime.cup, -1, true, false)) return sc.ARENA_MEDALS_TROPHIES.SILVER
            } else {
                var round = runtime.rounds[runtime.currentRound];
                if (round.platPoints && points >= round.platPoints) return sc.ARENA_MEDALS_TROPHIES.PLATIN;
                if (points >= round.points) return sc.ARENA_MEDALS_TROPHIES.GOLD;
                if (points >= ~~(round.points * sc.ARENA_SILVER_MEDAL_QUOTA)) return sc.ARENA_MEDALS_TROPHIES.SILVER
            }
            return sc.ARENA_MEDALS_TROPHIES.BRONZE
        },
        getTotalArenaCoins: function() {return this.coins},
        getArenaCoinsObtainedInCup: function(cupId) {if (this.cups[cupId] && this.cups[cupId].progress) {var total = 0, progress = this.cups[cupId].progress; total = total + this.getArenaCoinsObtainedInRound(cupId, -1); for (var idx = progress.rounds.length; idx--;) total = total + this.getArenaCoinsObtainedInRound(cupId, idx); return total}},
        getArenaCoinsObtainedInRound: function(cupId, roundIdx, prevMedal) {if (this.cups[cupId] && this.cups[cupId].progress) {var progress = this.cups[cupId].progress; return roundIdx == -1 ? this.getAvailableArenaCoinsInRound(cupId, roundIdx) * this._getCoinWeightMultiplier(prevMedal || 0, progress.rush.medal) : this.getAvailableArenaCoinsInRound(cupId, roundIdx) * this._getCoinWeightMultiplier(prevMedal || 0, progress.rounds[roundIdx].medal)}},
        getAvailableArenaCoinsInCup: function(cupId, excludeRush) {var rounds = this.getCupRounds(cupId); if (rounds) {var total = 0; for (var idx = rounds.length; idx--;) total = total + (rounds[idx].coins || 0); excludeRush || (total = total + ~~(total * sc.ARENA_RUSH_COIN_QUOTA)); return total} return 0},
        getAvailableArenaCoinsInRound: function(cupId, roundIdx) {if (roundIdx == -1) return ~~(this.getAvailableArenaCoinsInCup(cupId, true) * sc.ARENA_RUSH_COIN_QUOTA); var rounds = this.getCupRounds(cupId); return rounds ? rounds[roundIdx].coins || 0 : 0},
        getTotalPoints: function(cupId, includeRush) {if (this.cups[cupId] && this.cups[cupId].progress) {var total = 0, rounds = this.cups[cupId].progress.rounds; for (var idx = rounds.length; idx--;) total = total + rounds[idx].points; includeRush && (total = total + this.cups[cupId].progress.rush.points); return total} return -1},
        getRoundPoints: function(cupId, roundIdx) {if (this.cups[cupId] && this.cups[cupId].progress) {if (roundIdx == -1) return this.cups[cupId].progress.rush.points; if (this.cups[cupId].progress.rounds[roundIdx]) return this.cups[cupId].progress.rounds[roundIdx].points} return 0},
        getTotalTime: function(cupId) {if (this.cups[cupId] && this.cups[cupId].progress) {var total = 0, rounds = this.cups[cupId].progress.rounds; for (var idx = rounds.length; idx--;) total = total + rounds[idx].time; return total} return -1},
        getRoundTime: function(cupId, roundIdx) {if (this.cups[cupId] && this.cups[cupId].progress) {if (roundIdx == -1) return this.cups[cupId].progress.rush.time; if (this.cups[cupId].progress.rounds[roundIdx]) return this.cups[cupId].progress.rounds[roundIdx].time} return -1},
        hasMedalsForTrophy: function(cupId) {if (this.cups[cupId] && this.cups[cupId].progress) {var progress = this.cups[cupId].progress; for (var idx = progress.rounds.length; idx--;) if (progress.rounds[idx].medal <= 0) return false; return true} return false},
        getCupTrophy: function(cupId) {
            if (this.cups[cupId]) {if (!this.hasMedalsForTrophy(cupId)) return 0; var progress = this.cups[cupId].progress, noRush = this.cups[cupId].noRush || false, totalMedals = 0; for (var idx = progress.rounds.length; idx--;) totalMedals = totalMedals + progress.rounds[idx].medal; totalMedals = totalMedals / progress.rounds.length; var floored = ~~totalMedals; totalMedals = totalMedals > floored ? totalMedals - floored >= sc.ARENA_TROPHY_QUOTA ? Math.round(totalMedals) : floored : floored; if (totalMedals >= 4 && (noRush || progress.rush.medal == 4)) {sc.stats.setMap("arena", "unlockedTruePlatin", 1); return 5} return floored} return -1
        },
        getCupMedal: function(cupId, roundIdx) {if (this.cups[cupId]) {if (roundIdx <= -1) return this.cups[cupId].progress.rush.medal; if (this.cups[cupId].progress.rounds[roundIdx]) return this.cups[cupId].progress.rounds[roundIdx].medal} return -1},
        getCupLevel: function(cupId) {var core = this.getCupCore(cupId); return core ? ig.Event.getExpressionValue(core.level) : -1},
        getRoundsCleared: function(cupId) {var rounds = this.getCupRounds(cupId), progress = this.cups[cupId].progress.rounds, len = rounds.length; for (var count = 0; len--;) progress[len] && progress[len].cleared >= 1 && count++; return count},
        isCupUnlocked: function(cupId) {
            var cup = this.cups[cupId];
            if (cup) {conditionCheck || (conditionCheck = new ig.VarCondition); if (cup.condition) {conditionCheck.setCondition(cup.condition); return conditionCheck.evaluate()} return true}
            return false
        },
        getCupName: function(cupId) {if (this.cups[cupId] && this.cups[cupId].name) return ig.LangLabel.getText(this.cups[cupId].name); var core = this.getCupCore(cupId); return core ? ig.LangLabel.getText(core.name) : "\\c[1]~" + cupId + "\\c[0]"},
        getCupDescription: function(cupId) {var core = this.getCupCore(cupId); return core ? ig.LangLabel.getText(core.info) : "\\c[1]~" + cupId + "\\c[0]"},
        getCupDifficultyIcon: function(cupId) {var core = this.getCupCore(cupId); return core ? "\\i[diff-" + parseInt(core.difficulty).limit(1, 6) + "]" : "\\c[1]~" + cupId + "\\c[0]"},
        getCupProgress: function(cupId) {return this.cups[cupId] ? this.cups[cupId].progress : null},
        getCupCore: function(cupId) {var data = this.getCupData(cupId); return data ? data.core : null},
        getCupCoreAttrib: function(cupId, attr) {var data = this.getCupData(cupId); return data ? data.core[attr] : null},
        getCupRounds: function(cupId) {var data = this.getCupData(cupId); return data ? data.rounds : null},
        getCupData: function(cupId) {return this.cups[cupId] && this.cups[cupId].data ? this.cups[cupId].data.data : null},
        getSortedCupList: function(cupType, sortType) {
            var result = [], key;
            for (key in this.cups) {var cup = this.cups[key]; cup.data && cup.data.data.core.type == cupType && result.push(key)}
            if (sortType != void 0) switch (sortType) {case sc.ARENA_SORT_TYPES.ORDER: result.sort(function(a, b) {return (this.cups[a].order || 0) - (this.cups[b].order || 0)}.bind(this))}
            return result
        },
        onStorageSave: function(storageData) {
            var saveObj = {cupData: {}}, key;
            for (key in this.cups)
                if (this.cups[key] && this.cups[key].progress) {
                    var progress = this.cups[key].progress, cupSaveData = {rush: {medal: progress.rush.medal, points: progress.rush.points, time: progress.rush.time, cleared: progress.rush.cleared, chain: progress.rush.chain}, rounds: []};
                    for (var idx = 0; idx < progress.rounds.length; idx++) cupSaveData.rounds.push({medal: progress.rounds[idx].medal, points: progress.rounds[idx].points, time: progress.rounds[idx].time, cleared: progress.rounds[idx].cleared});
                    saveObj.cupData[key] = cupSaveData;
                    saveObj.cupData[key].name = ig.copy(this.cups[key].name);
                    saveObj.cupData[key].noRush = this.cups[key].noRush || false;
                    saveObj.cupData[key].condition = ig.copy(this.cups[key].condition)
                } else saveObj.cupData[key] = {};
            saveObj.coins = this.coins || 0; saveObj.coinsSpend = this.coinsSpend || 0;
            storageData.arena = saveObj
        },
        onStoragePreLoad: function(storageData) {
            this.clearProgress();
            if (storageData.arena) {
                var cupData = storageData.arena.cupData, key;
                for (key in cupData) {
                    if (this.cups[key]) {
                        var saved = cupData[key];
                        if (saved && saved.rush && saved.rounds) {
                            var progress = {rush: {medal: saved.rush.medal || 0, points: saved.rush.points || 0, time: saved.rush.time || 0, cleared: saved.rush.cleared || 0, chain: saved.rush.chain || 0}, rounds: []};
                            for (var idx = 0; idx < saved.rounds.length; idx++) progress.rounds.push({medal: saved.rounds[idx].medal || 0, points: saved.rounds[idx].points || 0, time: saved.rounds[idx].time || 0, cleared: saved.rounds[idx].cleared || 0});
                            this.cups[key].progress = progress;
                            this.cups[key].name = saved.name || null;
                            this.cups[key].condition = saved.condition || null;
                            this.cups[key].noRush = saved.noRush || null
                        }
                    }
                    var cupType = this.getCupCoreAttrib(key, "type"), extId = this.getCupCoreAttrib(key, "extension");
                    if (!extId || ig.extensions.hasExtension(extId))
                        if (cupType == "SOLO_CUSTOM" || cupType == "TEAM_CUSTOM") this._hasCustomCups = true
                }
                this.coins = storageData.arena.coins || 0; this.coinsSpend = storageData.arena.coinsSpend || 0
            }
        },
        onNewGameApply: function(data) {this.onStoragePreLoad(data); this.coinsSpend = 0}
    });
    ig.addGameAddon(function() {return sc.arena = new sc.Arena});
    var defaultAlign = {alignX: "CENTER", alignY: "CENTER"}
});
ig.baked = !0;