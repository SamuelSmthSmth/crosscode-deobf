ig.module("game.feature.arena.arena").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model", "game.feature.arena.entities.arena-spawn", "game.feature.arena.arena-loadable", "game.feature.combat.combat", "game.feature.arena.arena-bonus-objectives", "game.feature.arena.arena-score-types", "game.feature.arena.arena-challenges", "game.feature.arena.arena-cheer").defines(function() {
    var b = {
            "rookie-cup": {
                order: 100
            },
            "seeker-cup": {
                order: 200
            },
            "boss-cup": {
                order: 1E3
            },
            "faction-cup-1": {
                order: 2E3
            },
            "faction-cup-2": {
                order: 2100
            },
            "rookie-team-cup": {
                order: 101
            },
            "faction-team-cup-1": {
                order: 200
            }
        },
        a = {
            "console-cup-1": {
                order: 100
            }
        },
        d = [0.2, 0.3, 0.5];
    sc.ARENA_MEDALS_TROPHIES = {
        BRONZE: 1,
        SILVER: 2,
        GOLD: 3,
        PLATIN: 4,
        TRUE_PLATIN: 5
    };
    sc.ARENA_BASE_TYPE = {
        SOLO_CUP: "SOLO_CUP",
        TEAM_CUP: "TEAM_CUP",
        SOLO_CUSTOM: "SOLO_CUSTOM",
        TEAM_CUSTOM: "TEAM_CUSTOM"
    };
    sc.ARENA_ROUND_MODE = {
        DEFAULT: "DEFAULT"
    };
    sc.ARENA_CHAIN_MAX_TIME = 10;
    sc.ARENA_SORT_TYPES = {
        ORDER: 0
    };
    sc.ARENA_SILVER_MEDAL_QUOTA = 0.7;
    sc.ARENA_RUSH_COIN_QUOTA = 0.5;
    sc.ARENA_TROPHY_QUOTA =
        0.75;
    sc.ARENA_EVENT = {};
    sc.ARENA_MAX_CHAIN_HITS = 2;
    sc.ARENA_MAX_CHAIN_MULTIPLIER = 999;
    var c = null,
        e = Vec3.createC(0, 0, 0),
        f = {
            value: 0
        };
    sc.ARENA_PAUSE_ACTIONS = {
        NONE: 0,
        RESTART: 1,
        LOBBY: 2
    };
    ig.perf.grantArenaBonus = false;
    ig.perf.enableArenaRound = window.IG_GAME_DEBUG;
    sc.Arena = ig.GameAddon.extend({
        active: false,
        arenaCache: null,
        runtime: null,
        coins: 0,
        coinsSpend: 0,
        cups: {},
        observers: [],
        partyStash: [],
        pauseOverlay: null,
        sounds: null,
        effects: new ig.EffectSheet("arena"),
        _pauseBlock: false,
        _endRoundEnd: false,
        _exitCup: false,
        _pauseAction: 0,
        _isFinalHit: false,
        _partySettingBehaviour: null,
        _hasCustomCups: false,
        init: function() {
            this.parent("Arena");
            for (var c in b) this.registerCup(c, b[c]);
            for (c in a) this.registerCup(c, a[c]);
            this.sounds = new sc.ArenaCrowdCheerController;
            ig.storage.register(this);
            ig.vars.registerVarAccessor("arena", this, "VarArenaEditor");
            ig.extensions.addListener(this, "arena");
            sc.Model.addObserver(sc.model, this)
        },
        postUpdateOrder: 700,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused && this.active) {
                ig.game.firstUpdateLoop &&
                    sc.stats.addMap("arena", "time", ig.system.tick);
                var a = this.runtime;
                if (a.killTimer > 0) a.killTimer = a.killTimer - ig.system.tick;
                if (!a.roundFinished && a.roundStarted && a.chainTimer > 0 && !sc.model.isCutscene()) {
                    a.chainTimer = a.chainTimer - ig.system.tick;
                    !a.chainGui.pulsing && a.chainTimer / sc.ARENA_CHAIN_MAX_TIME <= 0.5 && a.chainGui.setPulse(true);
                    if (a.chainTimer <= 0) {
                        a.chain = 0;
                        a.rushChain = 0;
                        a.chainGui.setChainNumber(0)
                    }
                }
                this.sounds.update()
            }
        },
        onReset: function() {
            this.clearProgress();
            this._cleaRuntimeCache(true);
            if (this.arenaCache) {
                this.arenaCache.decreaseRef();
                this.arenaCache = null
            }
            this.sounds.resetTimers();
            sc.combat.setCombatSpeed(1);
            this.runtime = null;
            this.active = false;
            this.coinsSpend = this.coins = this.partyStash.length = 0;
            this._hasCustomCups = this._endRoundDone = this._pauseBlock = false;
            this._pauseAction = 0;
            sc.combat.removeCombatListener(this)
        },
        levelLoadStartOrder: 1,
        onLevelLoadStart: function() {
            if (this.active) {
                var a = this.runtime;
                this.resetRuntimeRoundStats();
                var b = this.getCurrentRound(),
                    c = this.getCupCore(a.cup, "music");
                if (!a.defaultBgmTrack) a.defaultBgmTrack = ig.bgm.loadTrack(a.rush ?
                    c.rushMusic || "challenge" : c.music || "challenge");
                this.addChallengeMods();
                (!a.rush || a.currentRound == 0) && sc.model.player.params.removeAllBuffs();
                sc.party.reviveAllPartyMemberModels();
                if (!this.pauseOverlay) {
                    this.pauseOverlay = new sc.ArenaChallengeOverlay;
                    ig.gui.addGuiElement(this.pauseOverlay)
                }
                this.pauseOverlay.setChallengeMods(a.challengeMods);
                if (!this.isCurrentRoundCustom()) {
                    if (b.music) {
                        a.bgmTrack && ig.warn("Unclear bgm track found: " + a.bgmTrack.name);
                        a.bgmTrack = ig.bgm.loadTrack(b.music || "lolfanfare")
                    }
                    b =
                        b.waves;
                    c = b.length;
                    a.enemyInfo && ig.warn("enemyInfo cache might not be cleared!");
                    for (var d = []; c--;) {
                        d[c] = [];
                        for (var e = b[c].enemies, f = e.length; f--;) d[c][f] = new sc.EnemyInfo(e[f])
                    }
                    a.enemyInfo = d
                }
            }
        },
        levelLoadedOrder: 200,
        onLevelLoaded: function() {
            if (this.active && !this.isCurrentRoundCustom()) {
                this.runtime.roundStartedPre = true;
                sc.commonEvents.startCallEvent("arena-start-round")
            }
        },
        onVarsChanged: function() {
            if (this.active) {
                var a = this.runtime;
                if (a.playerDeath < 2 && a.roundStarted && ig.vars.get("tmp.playerDeathArena")) {
                    a.playerDeath =
                        2;
                    sc.commonEvents.startCallEvent("arena-player-death")
                }
            }
        },
        onPvpRoundFinished: function(a) {
            a == sc.COMBATANT_PARTY.PLAYER ? this.addScore("PVP_ROUND_WON") : this.addScore("PVP_ROUND_LOST")
        },
        onPreDamageModification: function(a, b) {
            if (this.active && !(this.runtime.roundEndPre || this._pauseAction > 0))
                if (b == sc.SHIELD_RESULT.PERFECT) this.addScore("PERFECT_SHIELD");
                else if (a && a.damage > 0) {
                var c = this.runtime;
                c.chainHits--;
                if (c.chainHits <= 0) {
                    c.chain = 0;
                    c.rushChain = 0;
                    c.chainGui.setChainNumber(0)
                } else c.chain >= 2 && c.chainGui.rumble();
                c.chainHits / sc.ARENA_MAX_CHAIN_HITS <= 0.5 && c.chainGui.setPulse(true);
                var d = sc.model.player.params;
                if (this.hasChallenge("LEA_MUST_DIE")) a.damage = d.currentHp;
                if (d.currentHp - a.damage <= 0 && c.playerDeath < 1)
                    if (d.currentHp > 0 && d.getModifier("ONCE_MORE")) this.addScore("DAMAGE_TAKEN", -a.damage);
                    else {
                        if (!sc.pvp.isActive()) {
                            c.playerDeath = 1;
                            c.chain = 0;
                            c.rushChain = 0;
                            c.rushChainMax = 0;
                            c.chainGui.setChainNumber(0);
                            this._pauseBlock = true;
                            this._endRoundDone = false;
                            ig.bgm.pause("IMMEDIATELY");
                            sc.stats.addMap("arena", "deaths",
                                1);
                            sc.commonEvents.startCallEvent("arena-player-death-pre")
                        }
                    }
                else ig.perf.grantArenaBonus || this.addScore("DAMAGE_TAKEN", -a.damage)
            }
        },
        onTargetHit: function(a, b, c, d) {
            if (this.active) {
                b.status > 0 && a.element > 0 && d.params.statusStates[a.element - 1].active && this.addScore("STATUS_INFLICT");
                this.refreshChainTimer(true)
            }
        },
        onPreDamageApply: function(a, b, c, d, e) {
            if (this.active && !(c == sc.SHIELD_RESULT.PERFECT || d.getCombatantRoot().party != sc.COMBATANT_PARTY.PLAYER || this.isEnemyBlocked(a))) {
                c = 1;
                if (d.params.buffs.length >
                    0)
                    for (var d = d.params.buffs, f = 0, g = d.length; f < g; f++)
                        if (d[f] instanceof sc.ActionBuff && d[f].name == "sergeyHax") {
                            c = e.attackerParams.getStat("attack", true) / e.attackerParams.getStat("attack", false);
                            break
                        } a = Math.min(Math.max(0, a.params.currentHp), Math.floor(b.damage * c));
                if (a > 0) {
                    this.addScore("DAMAGE_DONE", a);
                    b = Math.floor(a - a / b.defensiveFactor);
                    if (b > 0) {
                        sc.stats.addMap("arena", "effectiveDamage", b);
                        this.addScore("DAMAGE_DONE_EFFECTIVE", b)
                    }
                }
            }
        },
        onPreInstantDamage: function(a, b) {
            if (this.active && !(a.party != sc.COMBATANT_PARTY.ENEMY ||
                    a.getCombatantRoot().party == sc.COMBATANT_PARTY.PLAYER || this.isEnemyBlocked(a))) {
                b = Math.min(Math.max(0, a.params.currentHp), b);
                b > 0 && this.addScore("DAMAGE_DONE", b)
            }
        },
        onLockEnd: function(a, b, c, d) {
            if (this.active && !this.isEnemyBlocked(a) && a.params && a.params.isDefeated()) {
                d == 2 ? this.addScore("LOCK_FINISH") : d == 3 && this.addScore("LOCK_FINISH_3");
                this.sounds.play("SURPRISED")
            }
        },
        onElementOverload: function() {
            this.addScore("ELEMENT_OVERLOAD")
        },
        onPerfectDodge: function() {
            this.addScore("PERFECT_DODGE")
        },
        onGuardCounter: function(a) {
            if (this.active &&
                !this.isEnemyBlocked(a)) {
                a.getCombatStat("guardCounters", 0) <= 0 && this.addScore("GUARD_COUNTER");
                this.sounds.play("SURPRISED")
            }
        },
        onEnemyBreak: function(a) {
            if (this.active && !this.isEnemyBlocked(a)) {
                a.getCombatStat("breaks", 0) <= 0 && this.addScore("ENEMY_BREAK");
                this.sounds.play("SURPRISED")
            }
        },
        onHitKill: function(a) {
            this.isEnemyBlocked(a) || this.addScore("ONE_HIT_KILL")
        },
        onCombatantHeal: function(a, b) {
            if (this.active && !a.getCombatantRoot().isPlayer && !(a.party != sc.COMBATANT_PARTY.ENEMY || this.isEnemyBlocked(a))) {
                var c =
                    a.params.currentHp,
                    d = a.params.getStat("hp");
                c + b > d && (b = d - c);
                b > 0 && this.addScore("ENEMY_HEAL", -b)
            }
        },
        onCombatantDeathHit: function(a, b) {
            if (this.active && !this.runtime.playerDeath && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
                sc.stats.addMap("arena", "kills", 1);
                var c = this.runtime;
                if (!this.isEnemyBlocked(b)) {
                    this.increaseChain();
                    b.enemyType && b.enemyType.boss ? this.addScore("BOSS_KILL") : this.addScore("KILL");
                    c.killTimer > 0 && this.addScore("MULTI_KILL");
                    c.killTimer = 0.3
                }
                this.sounds.play("APPLAUSE");
                if (!c.customRound) {
                    this.isEnemyBlocked(b) ||
                        c.roundKills++;
                    if (c.roundKills >= c.waveKillsNeeded) {
                        var d = this.getCurrentRound();
                        if (c.currentWave == d.waves.length - 1) {
                            c.rush ? c.currentRound == c.rounds.length - 1 && ig.bgm.pause("IMMEDIATELY") : ig.bgm.pause("IMMEDIATELY");
                            c.roundEndPre = true;
                            sc.commonEvents.startCallEvent("arena-end-round")
                        } else sc.commonEvents.startCallEvent("arena-next-wave")
                    }
                }
            }
        },
        onEnvironmentKill: function(a) {
            this.active && !(a.party != sc.COMBATANT_PARTY.ENEMY || this.isEnemyBlocked(a)) && this.addScore("ENVIRONMENT_KILL")
        },
        onFinalDeathHit: function() {
            var a =
                this.runtime;
            if (this.active && (!a.playerDeath && !(a.roundEndPre || this._pauseAction > 0)) && a.customRound) {
                this._isFinalHit = true;
                a.roundEndPre = true;
                ig.game.varsChangedDeferred()
            }
        },
        spawnCurrentWave: function(a, b, c) {
            if (this.active && !this.runtime.playerDeath && !(this.runtime.roundEndPre || this._pauseAction > 0)) {
                var d = this.getCurrentRound(),
                    e = d.waves,
                    f = this.runtime;
                if (b) f.currentWave = Math.min(f.currentWave + 1, e.length - 1);
                e = e[f.currentWave];
                sc.combat.setCombatSpeed(e.speed ? e.speed || 1 : d.speed || 1);
                f.waveKillsNeeded =
                    f.waveKillsNeeded + e.enemies.length;
                for (var g = e.enemies, b = g.length; b--;) this._spawnEnemy(b, g[b], this._getLevelToSpawn(g[b], e, d, this.getCupCore(f.cup)), a);
                if (c) {
                    a = ig.game.entities;
                    for (b = a.length; b--;) {
                        c = a[b];
                        c instanceof ig.ENTITY.Enemy && c.setTarget(ig.game.playerEntity, true)
                    }
                }
                ig.game.varsChangedDeferred()
            }
        },
        startRound: function() {
            var a = this.runtime,
                b = this.getCurrentRound();
            a.scoreStats = {};
            this.addGui();
            sc.timers.timers.arenaTimer ? sc.timers.resumeTimer("arenaTimer") : sc.timers.addTimer("arenaTimer", sc.TIMER_TYPES.COUNTER,
                null, null, null, true, true, null, ig.lang.get("sc.gui.arena.time"), true);
            if (!sc.pvp.isActive()) ig.game.playerEntity.manualKill = "tmp.playerDeathArena";
            sc.timers.addTimer("arenaTimerReal", sc.TIMER_TYPES.COUNTER, null, null, null, false, true);
            a.customRound = b.customCode || false;
            a.roundKills = 0;
            a.score = 0;
            a.roundFinished = false;
            a.roundStarted = true;
            a.chainHits = sc.ARENA_MAX_CHAIN_HITS;
            a.prevScoreType = null;
            a.killTimer = 0;
            a.chain = 0;
            a.chainGui.setChainNumber(0, true);
            a.prevMedal = this.getCupMedal(a.cup, a.currentRound);
            if (!a.rush ||
                a.rush && a.currentRound == 0) {
                f.value = 1;
                ig.game.playerEntity.heal(f, true);
                sc.model.player.setElementMode(0, true, true);
                sc.party.reviveAllPartyMembers()
            } else {
                f.value = 0.5;
                ig.game.playerEntity.heal(f, false)
            }
            sc.model.player.params.resetSp();
            for (var c in a.challengeMods) {
                ig.debug("CHALLENGE ON: " + c);
                sc.ARENA_CHALLENGES[c].toggle(true)
            }
            this.addBonusObjectives();
            sc.model.setTask(this.getCurrentObjective(), false, 0);
            if (!b.customCode) {
                a.rush && a.currentRound == 0 ? ig.bgm.play(a.bgmTrack || a.defaultBgmTrack, 1, "IMMEDIATELY") :
                    a.rush || ig.bgm.play(a.bgmTrack || a.defaultBgmTrack, 1, "IMMEDIATELY");
                a = ig.game.entities;
                for (b = a.length; b--;) {
                    c = a[b];
                    c instanceof ig.ENTITY.Enemy && c.setTarget(ig.game.playerEntity, true)
                }
            }
        },
        endRound: function() {
            ig.system.skipMode = false;
            var a = this.runtime;
            this._pauseBlock = true;
            this._endRoundDone = false;
            sc.timers.stopTimer("arenaTimer");
            sc.timers.stopTimer("arenaTimerReal");
            a.timer = sc.timers.timers.arenaTimerReal ? sc.timers.getPassedTime("arenaTimerReal") : 0;
            a.scoreGui && a.scoreGui.remove();
            ig.gui.freeEventGui(a.scoreGui);
            a.scoreGui = null;
            a.roundStarted = false;
            a.roundFinished = true;
            a.chainGui.pulsing && a.chainGui.setPulse(false);
            a = new sc.ArenaRoundEndOverlay;
            ig.gui.addGuiElement(a);
            a.show()
        },
        endRoundDeath: function() {
            ig.system.skipMode = false;
            var a = this.runtime;
            this._pauseBlock = true;
            this._endRoundDone = false;
            sc.timers.stopTimer("arenaTimer");
            sc.timers.stopTimer("arenaTimerReal");
            a.timer = 0;
            a.chainGui.pulsing && a.chainGui.setPulse(false);
            a = new sc.ArenaPlayerDeathOverlay;
            ig.gui.addGuiElement(a);
            a.show()
        },
        stopTimers: function() {
            sc.timers.stopTimer("arenaTimer");
            sc.timers.stopTimer("arenaTimerReal")
        },
        resumeTimers: function() {
            sc.timers.resumeTimer("arenaTimer");
            sc.timers.resumeTimer("arenaTimerReal")
        },
        startNextRound: function(a) {
            var b = this.runtime;
            this._cleaRuntimeCache(false);
            sc.model.setTask(null, false);
            if (b.scoreGui) {
                b.scoreGui.remove();
                ig.gui.freeEventGui(b.scoreGui);
                b.scoreGui = null
            }
            b.chainGui && b.chainGui.setChainNumber(0);
            sc.timers.removeTimer("arenaTimerReal");
            b.rush || sc.timers.removeTimer("arenaTimer");
            a && b.currentRound++;
            this._endRoundDone = true
        },
        restartCup: function() {
            var a =
                this.runtime;
            a.currentRound = 0;
            a.rushChain = 0;
            a.rushChainMax = 0;
            if (a.rush)
                for (var a = a.rushScores, b = a.length; b--;) {
                    a[b].points = 0;
                    a[b].medal = 0;
                    a[b].time = 0
                }
            sc.timers.removeTimer("arenaTimer");
            this.startNextRound(false)
        },
        prepareLobbyReturn: function() {
            var a = this.runtime;
            a.chainGui && a.chainGui.setChainNumber(0);
            if (a.scoreGui) {
                a.scoreGui.remove();
                ig.gui.freeEventGui(a.scoreGui);
                a.scoreGui = null
            }
            sc.timers.removeTimer("arenaTimerReal");
            sc.timers.removeTimer("arenaTimer");
            this._endRoundDone = true
        },
        teleportToCurrentRound: function() {
            var a =
                this.runtime.rounds[this.runtime.currentRound];
            ig.game.teleport(a.map, a.spawn ? new ig.TeleportPosition(a.spawn) : null)
        },
        resetRuntimeRoundStats: function() {
            var a = this.runtime;
            sc.stats.setMap("arena", "effectiveDamage", 0);
            this.sounds.resetTimers();
            this._validateCoins();
            a.playerDeath = 0;
            this._pauseBlock = this._isFinalHit = false;
            this._pauseAction = 0;
            this._endRoundDone = false;
            a.challengeMods = {};
            a.bonusObjectives.length = 0;
            a.roundEndPre = false;
            a.roundKills = 0;
            a.roundStarted = false;
            a.roundStartedPre = false;
            a.roundFinished =
                false;
            a.currentWave = 0;
            a.waveKillsNeeded = 0;
            a.scoreStats = {};
            a.enemyIgnore = {};
            a.scoreIgnore = {};
            a.prevScoreType = null
        },
        addChallengeMods: function() {
            var a = this.runtime;
            a.challengeMods = this.getChallengeMods(a.cup, a.currentRound)
        },
        addBonusObjectives: function() {
            var a = this.runtime,
                b = this.getCurrentRound();
            a.bonusObjectives.length = 0;
            for (var b = b.bonuses, c = b.length; c--;) {
                var d = {},
                    e = b[c];
                sc.ARENA_BONUS_OBJECTIVE[e.type].init(e, d);
                a.bonusObjectives.push({
                    type: e.type,
                    points: e.points,
                    data: d
                })
            }
            for (var f in sc.ARENA_DEFAULT_BONUS_OBJECTIVES) {
                d = {};
                e = sc.ARENA_DEFAULT_BONUS_OBJECTIVES[f];
                if (!e.challenge || this.hasChallenge(e.challenge))
                    if (!e.ignoreOn || !this.hasChallenge(e.ignoreOn)) {
                        sc.ARENA_BONUS_OBJECTIVE[f].init(e, d);
                        a.bonusObjectives.push({
                            type: f,
                            points: e.points,
                            data: d
                        })
                    }
            }
        },
        addGui: function() {
            var a = this.runtime;
            if (a.scoreGui) {
                a.scoreGui.remove();
                ig.gui.freeEventGui(a.scoreGui)
            }
            var b = ig.gui.createEventGui("score", "ScoreHud", {
                taskTitle: ig.lang.get("sc.gui.arena.score"),
                maxValue: 999999999,
                time: 0.2,
                useDots: true,
                variable: "arena.score",
                cutsceneOkay: true
            });
            ig.gui.spawnEventGui(b);
            a.scoreGui = b;
            if (a.chainGui) a.chainGui.setPos(0, 22);
            else {
                b = new sc.ArenaChainHud;
                ig.gui.addGuiElement(b);
                a.chainGui = b
            }
            ig.game.varsChangedDeferred()
        },
        addScore: function(a, b) {
            if (this.active && sc.ARENA_SCORE_TYPES[a] && !this.runtime.scoreIgnore[a]) {
                var c = sc.ARENA_SCORE_TYPES[a],
                    d = 0,
                    e = this.runtime,
                    f = e.scoreStats;
                f[a] || (f[a] = {
                    count: 0,
                    value: 0,
                    repeated: 1,
                    "static": c["static"]
                });
                if (f[a].static) {
                    d = 1;
                    c.staticMultiplier && !this.hasChallenge("PVP_BATTLE") && (d = c.staticMultiplier);
                    d = Math.floor(b *
                        d)
                } else {
                    var g = c.chain || false,
                        n = c.dimReturns || false,
                        d = c.points || 0;
                    g && (d = d * this.getChainMultiplier());
                    if (e.prevScoreType == a) f[a].repeated++;
                    else if (e.prevScoreType) f[e.prevScoreType].repeated = 1;
                    n && (d = d / f[a].repeated);
                    f[a].count++;
                    d = Math.floor(d)
                }
                e.score = e.score + d;
                if (e.score < 0) e.score = 0;
                f[a].value = f[a].value + d;
                e.prevScoreType = a;
                ig.game.varsChangedDeferred()
            }
        },
        addScoreIgnore: function(a) {
            this.active && sc.ARENA_SCORE_TYPES[a] && (this.runtime.scoreIgnore[a] = true)
        },
        removeScoreIgnore: function(a) {
            this.active &&
                sc.ARENA_SCORE_TYPES[a] && this.runtime.scoreIgnore[a] && delete this.runtime.scoreIgnore[a]
        },
        clearScoreIgnore: function() {
            if (this.active) this.runtime.scoreIgnore = {}
        },
        increaseChain: function(a) {
            var a = a || 1,
                b = this.runtime;
            b.chainHits = sc.ARENA_MAX_CHAIN_HITS;
            b.chain = b.chain + a;
            b.rushChain = b.rushChain + a;
            b.rushChainMax = Math.max(b.rushChain, b.rushChainMax);
            b.chain < 0 ? this.resetChain() : this.refreshChainTimer()
        },
        refreshChainTimer: function(a) {
            var b = sc.arena.runtime;
            b.chainTimer = sc.ARENA_CHAIN_MAX_TIME;
            b.chainHits =
                sc.ARENA_MAX_CHAIN_HITS;
            b.chainGui.pulsing && b.chainGui.setPulse(false);
            a || b.chainGui && b.chainGui.setChainNumber(b.chain)
        },
        resetChain: function() {
            var a = this.runtime;
            a.chainHits = sc.ARENA_MAX_CHAIN_HITS;
            a.chain = 0;
            a.rushChain = 0;
            a.chainGui.setChainNumber(0);
            a.chainTimer = sc.ARENA_CHAIN_MAX_TIME
        },
        getChainMultiplier: function() {
            return Math.min(sc.ARENA_MAX_CHAIN_MULTIPLIER, Math.max(1, 1 + (this.runtime.chain - 1)))
        },
        enterArenaMode: function(a, b) {
            this.active = true;
            sc.model.setMobilityBlock("CHECKPOINT");
            sc.model.player.setCore(sc.PLAYER_CORE.CREDITS,
                false);
            sc.model.player.setCore(sc.PLAYER_CORE.EXP, false);
            sc.model.player.setCore(sc.PLAYER_CORE.ITEMS, false);
            this.arenaCache = new sc.ArenaCache;
            this.runtime = {
                scoreIgnore: {},
                enemyIgnore: {},
                defaultBgmTrack: null,
                bgmTrack: null,
                scoreGui: null,
                chainGui: null,
                score: 0,
                prevScore: 0,
                timer: 0,
                cup: a,
                prevMedal: 0,
                customRound: false,
                preTrophy: this.getCupTrophy(a),
                chain: 0,
                rushChain: 0,
                rushChainMax: 0,
                chainHits: sc.ARENA_MAX_CHAIN_HITS,
                chainTimer: 0,
                type: this.getCupCoreAttrib(a, "type"),
                roundKills: 0,
                currentWave: 0,
                waveKillsNeeded: 0,
                playerDeath: 0,
                rush: b == -1,
                roundStarted: false,
                roundStartedPre: false,
                scoreStats: {},
                prevScoreType: null,
                roundEndPre: false,
                bonusObjectives: [],
                challengeMods: {},
                currentRound: b == -1 ? 0 : b,
                enemyInfo: null,
                rounds: this.getCupRounds(a)
            };
            if (this.runtime.rush) {
                var c = this.runtime;
                c.rushScores = [];
                for (var d = c.rounds, e = 0; e < d.length; e++) c.rushScores.push({
                    points: 0,
                    medal: 0,
                    time: 0
                })
            }
            this._partySettingBehaviour = sc.party.strategyKeys.BEHAVIOUR;
            !this.isCupSolo(this.runtime.cup) && this._partySettingBehaviour == "DO_NOTHING" && sc.party.updatePartyStrategy("BEHAVIOUR",
                "OFFENSIVE");
            if (this.hasAscendedChallenge(this.runtime.cup)) {
                sc.inventory.updateScaledEquipment(this.getCupLevel(this.runtime.cup));
                sc.model.player.updateStats()
            }
        },
        exitArenaMode: function() {
            this.active = false;
            sc.combat.setCombatSpeed(1);
            sc.combat.removeCombatListener(this);
            if (this.hasAscendedChallenge(this.runtime.cup)) {
                sc.inventory.updateScaledEquipment(sc.model.player.level);
                sc.model.player.updateStats()
            }
            this.arenaCache.decreaseRef();
            this.arenaCache = null;
            this._cleaRuntimeCache(true);
            sc.model.setTask();
            sc.timers.removeTimer("arenaTimerReal");
            sc.timers.removeTimer("arenaTimer");
            ig.game.playerEntity.manualKill = null;
            sc.party.updatePartyStrategy("BEHAVIOUR", this._partySettingBehaviour);
            if (this.pauseOverlay) {
                this.pauseOverlay.remove();
                this.pauseOverlay = null
            }
            var a = this.runtime;
            a.chainGui && a.chainGui.doStateTransition("HIDDEN", false, true);
            if (a.scoreGui) {
                a.scoreGui.remove();
                ig.gui.freeEventGui(a.scoreGui)
            }
            sc.model.player.setCore(sc.PLAYER_CORE.CREDITS, true);
            sc.model.player.setCore(sc.PLAYER_CORE.EXP, true);
            sc.model.player.setCore(sc.PLAYER_CORE.ITEMS, true);
            sc.model.setMobilityBlock("NONE");
            this._endRoundDone = this._pauseBlock = false;
            this.runtime = null;
            this._exitCup = true;
            this._isFinalHit = false;
            this._partySettingBehaviour = null;
            sc.arena.isCupSolo(a.cup) && this.unstashPartyMembers();
            ig.game.teleport("rhombus-sqr.interior.arena-01", new ig.TeleportPosition("CUP_END"))
        },
        stashPartyMembers: function() {
            this.partyStash.length >= 1 && ig.warn("Trying to stash party members while other are stashed.");
            this.partyStash.length =
                0;
            for (var a = sc.party.currentParty, b = 0; b < a.length; b++) this.partyStash.push(a[b]);
            for (a = 0; a < this.partyStash.length; a++) sc.party.removePartyMember(this.partyStash[a], null, true)
        },
        unstashPartyMembers: function() {
            if (this.partyStash.length >= 1) {
                for (var a = 0; a < this.partyStash.length; a++) sc.party.addPartyMember(this.partyStash[a], null, null, true);
                this.partyStash.length = 0
            }
        },
        registerCup: function(a, b, c) {
            this.cups[a] ? ig.warn("Cup with id '" + a + "' already exists.") : this.cups[a] = {
                path: b.path || a,
                order: b.order != void 0 ?
                    b.order : 9999999,
                extension: c || false,
                data: null,
                progress: null
            }
        },
        loadCache: function() {
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoading Cup Cache: \n%O", "color:#149AEB", "", this.cups);
            for (var a in this.cups) {
                var b = this.cups[a];
                if (b.path) {
                    b.data = new sc.CupAsset(a, b.path);
                    b.data.addLoadListener(this)
                }
            }
            this.sounds.loadCache()
        },
        clearCache: function() {
            ig.JSON_LOG && ig.log("%cLOADABLE: %cClearing Cup Cache: \n%O", "color:#149AEB", "", this.cups);
            for (var a in this.cups) {
                var b = this.cups[a];
                if (b.path && b.data) {
                    b.data.decreaseRef();
                    b.data = null
                }
            }
            this.sounds.clearCache()
        },
        initMetaData: function(a) {
            if (this.cups[a]) {
                this.cups[a].name = this.getCupCoreAttrib(a, "name");
                this.cups[a].condition = this.getCupCoreAttrib(a, "condition") || null;
                this.cups[a].noRush = this.getCupCoreAttrib(a, "noRush") || false;
                var b = this.getCupCoreAttrib(a, "type");
                if (this.cups[a].extension) {
                    b == "SOLO_CUP" && (this.getCupCore(a).type = "SOLO_CUSTOM");
                    b == "TEAM_CUP" && (this.getCupCore(a).type = "TEAM_CUSTOM")
                }
                b = this.getCupCoreAttrib(a, "type");
                if (b == "SOLO_CUSTOM" || b == "TEAM_CUSTOM") this._hasCustomCups =
                    true;
                if (this.cups[a].progress) {
                    b = this.getCupRounds(a);
                    a = this.cups[a].progress.rounds;
                    if (b.length != a.length)
                        if (b.length > a.length)
                            for (var c = a.length; c < b.length; c++) a.push({
                                medal: 0,
                                points: 0,
                                time: 0,
                                cleared: 0
                            });
                        else a.length = b.length
                } else this.setEmptyProgress(a)
            } else throw Error("Cup not found: " + a);
        },
        setEmptyProgress: function(a) {
            var b = this.getCupRounds(a);
            if (!b) this.cups[a].progress = null;
            for (var c = {
                    rush: {
                        medal: 0,
                        points: 0,
                        time: 0,
                        cleared: 0,
                        chain: 0
                    },
                    rounds: []
                }, d = 0; d < b.length; d++) c.rounds.push({
                medal: 0,
                points: 0,
                time: 0,
                cleared: 0
            });
            this.cups[a].progress = c
        },
        setPauseAction: function(a) {
            this._pauseAction = a
        },
        saveScore: function(a, b) {
            a < 0 && (a = 0);
            var c = this.runtime,
                d = b ? this.cups[c.cup].progress.rush : this.cups[c.cup].progress.rounds[c.currentRound];
            c.score = a;
            var e = b ? c.preTrophy : this.getCupTrophy(c.cup);
            c.prevMedal = d.medal;
            d.cleared++;
            d.points = Math.max(d.points, a);
            d.medal = this.getMedalForCurrentRound(d.points, b);
            d.time = c.timer <= 0 ? 0 : d.time <= 0 ? c.timer : Math.min(c.timer, d.time);
            sc.stats.addMap("arena", "score", a);
            if (d.medal > 0) {
                sc.stats.addMap("arena", "totalMedals", 1);
                sc.stats.addMap("arena", "medals-got-" + d.medal, 1)
            }
            if (c.rush && !b) {
                var f = c.rushScores[c.currentRound];
                f.points = Math.max(a, 0);
                f.medal = this.getMedalForCurrentRound(f.points, b);
                f.time = Math.max(c.timer, 0)
            }
            if (b) {
                d.chain = Math.max(d.chain, c.rushChainMax);
                sc.stats.addMap("arena", "rushCleared", 1)
            } else sc.stats.addMap("arena", "roundsCleared", 1);
            return this.getCupTrophy(c.cup) > e
        },
        saveRushScore: function() {
            var a = this.runtime;
            a.timer = sc.timers.getPassedTime("arenaTimer");
            for (var b = a.rushScores.length, c = 0; b--;) c = c + a.rushScores[b].points;
            return this.saveScore(c, true)
        },
        addEnemyIgnore: function(a) {
            this.active && a && (this.runtime.enemyIgnore[a] = true)
        },
        removeEnemyIgnore: function(a) {
            this.active && a && (this.runtime.enemyIgnore[a] = false)
        },
        removeArenaCoins: function(a) {
            this.coinsSpend = this.coinsSpend + a;
            this.coins = this.coins - a
        },
        clearProgress: function(a, b) {
            if (a) {
                if (this.cups[a].progress) {
                    if (b != void 0) return this._clearProgress(a, b);
                    this._clearProgress(a, -1);
                    for (var c = 0; c < this.cups[a].progress.rounds.length; c++) this._clearProgress(a,
                        c)
                }
            } else
                for (var d in this.cups)
                    if (this.cups[d].progress) {
                        this._clearProgress(d, -1);
                        for (c = 0; c < this.cups[d].progress.rounds.length; c++) this._clearProgress(d, c)
                    }
        },
        _getCoinWeightMultiplier: function(a, b) {
            a = Math.min(a, 3);
            b = Math.min(b, 3);
            if (b - a > 0) {
                for (var c = 0, e = a; e < b; e++) c = c + d[e];
                return c
            }
            return 0
        },
        _validateCoins: function() {
            var a = 0,
                b;
            for (b in this.cups) this.isCupCustom(b) || (a = a + this.getArenaCoinsObtainedInCup(b));
            this.coins = a - this.coinsSpend;
            if (this.coins < 0) this.coins = 0
        },
        _clearProgress: function(a, b) {
            if (this.cups[a].progress) {
                if (b ==
                    -1) this.cups[a].progress.rush = {
                    points: 0,
                    medal: 0,
                    time: 0,
                    cleared: 0,
                    chain: 0
                };
                this.cups[a].progress.rounds[b] = {
                    points: 0,
                    medal: 0,
                    time: 0,
                    cleared: 0
                }
            }
        },
        _cleaRuntimeCache: function(a) {
            var b = this.runtime;
            if (b) {
                if (sc.pvp.isActive()) {
                    sc.pvp.onReset();
                    sc.model.setCombatMode(false, true)
                }
                ig.gui.clearNamedGuiElements();
                if (a) {
                    b.defaultBgmTrack && b.defaultBgmTrack.clearCached();
                    b.defaultBgmTrack = null
                }
                b.bgmTrack && b.bgmTrack.clearCached();
                b.bgmTrack = null;
                if (b.enemyInfo) {
                    for (a = b.enemyInfo.length; a--;)
                        for (var c = b.enemyInfo[a].length; c--;) b.enemyInfo[a][c].clearCached();
                    b.enemyInfo = null
                }
                for (var d in b.challengeMods) {
                    ig.debug("CHALLENGE OFF: " + d);
                    sc.ARENA_CHALLENGES[d].toggle(false)
                }
            }
        },
        _spawnEnemy: function(a, b, c, d) {
            var f = ig.game.getEntityByName(b.marker),
                a = this.runtime.enemyInfo[this.runtime.currentWave][a],
                f = f.coll,
                o = a.enemyType,
                b = b.align,
                m = e,
                m = m || Vec3.createC(0, 0, 0);
            m.z = f.pos.z;
            b = b || g;
            switch (sc.ARENA_ALIGN_X[b.alignX || "CENTER"]) {
                case sc.ARENA_ALIGN_X.LEFT:
                    m.x = f.pos.x;
                    break;
                case sc.ARENA_ALIGN_X.CENTER:
                    m.x = f.pos.x + f.size.x / 2 - o.size.x / 2;
                    break;
                case sc.ARENA_ALIGN_X.RIGHT:
                    m.x =
                        f.pos.x + f.size.x - o.size.x
            }
            switch (sc.ARENA_ALIGN_Y[b.alignY || "CENTER"]) {
                case sc.ARENA_ALIGN_Y.TOP:
                    m.y = f.pos.y;
                    break;
                case sc.ARENA_ALIGN_Y.CENTER:
                    m.y = f.pos.y + f.size.y / 2 - o.size.y / 2;
                    break;
                case sc.ARENA_ALIGN_Y.BOTTOM:
                    m.y = f.pos.y + f.size.y - o.size.y
            }
            m.x = m.x + (b.offset ? b.offset.x || 0 : 0);
            m.y = m.y + (b.offset ? b.offset.y || 0 : 0);
            m.z = m.z + (b.offset ? b.offset.z || 0 : 0);
            a = a.getSettings();
            a.level = c;
            ig.game.spawnEntity(ig.ENTITY.Enemy, e.x, e.y, e.z, {
                enemyInfo: a
            }, !d)
        },
        _getLevelToSpawn: function(a, b, c, d) {
            return a.level ? ig.Event.getExpressionValue(a.level) :
                b.level ? ig.Event.getExpressionValue(b.level) : c.level ? ig.Event.getExpressionValue(c.level) : d.level ? ig.Event.getExpressionValue(d.level) : 1
        },
        onExtensionLoaded: function(a, b) {
            this.registerCup(a.id, a, this.isSafeExtension(b))
        },
        isSafeExtension: function(a) {
            return a.path == "post-game" ? false : true
        },
        modelChanged: function(a, b) {
            this.active && b == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && (sc.model.isPaused() && this.hasAnyChallenge() ? this.pauseOverlay && this.pauseOverlay.show() : this.pauseOverlay && this.pauseOverlay.hide())
        },
        onLoadableComplete: function(a, b) {
            if (a && b && this.cups[b.key]) {
                this.initMetaData(b.key);
                for (var c = b.data.rounds, d = c.length; d--;) {
                    var e = c[d];
                    if (!e.platPoints || e.platPoints < e.points) e.platPoints = (e.points || 1E3) * 1E3
                }
            }
        },
        onVarAccess: function(a, b) {
            if (b[0] == "arena" && b[1]) {
                switch (b[1]) {
                    case "currentRound":
                        return this.runtime.currentRound;
                    case "currentWave":
                        return this.runtime.currentWave;
                    case "active":
                        return this.active;
                    case "isCurrentSolo":
                        return this.runtime ? this.isCupSolo(this.runtime.cup) : false;
                    case "roundCameraTarget":
                        return this.getCurrentRound().camFocus ||
                            "";
                    case "roundFocusTarget":
                        return this.getCurrentRound().roundFocus || "";
                    case "waveCameraTarget":
                        return b[2] && b[2] == "next" ? this.getNextWave().camFocus || "" : this.getCurrentWave().camFocus || "";
                    case "objective":
                        return this.getCurrentObjective();
                    case "enemyLevel":
                        return ig.Event.getExpressionValue(this.getCurrentRound().level) || this.getCupLevel(this.runtime.cup) || 0;
                    case "roundLevel":
                        return ig.Event.getExpressionValue(this.getCurrentRound().level) || 0;
                    case "cupLevel":
                        return this.getCupLevel(this.runtime.cup) ||
                            0;
                    case "isRush":
                        return this.active && this.runtime.rush;
                    case "finalHit":
                        return this._isFinalHit;
                    case "isLastWave":
                        return this.runtime.currentWave == this.getCurrentRound().waves.length - 1;
                    case "isLastRound":
                        return this.isCurrentRoundLast();
                    case "isCustomRound":
                        return this.runtime.customRound;
                    case "isPauseRestart":
                        return this._pauseAction == sc.ARENA_PAUSE_ACTIONS.RESTART;
                    case "isPauseLobby":
                        return this._pauseAction == sc.ARENA_PAUSE_ACTIONS.LOBBY;
                    case "score":
                        return this.runtime ? this.runtime.score : 0;
                    case "roundStarted":
                        return this.runtime ?
                            this.runtime.roundStarted : false;
                    case "roundFinished":
                        return this.runtime ? this.runtime.roundFinished : false;
                    case "cupEnded":
                        return this._exitCup;
                    case "hasCustomCups":
                        return this._hasCustomCups
                }
                if (this.cups[b[1]]) switch (b[2]) {
                    case "name":
                        return this.getCupName(b[1]);
                    case "isSolo":
                        return this.isCupSolo(b[1])
                }
            }
            throw Error("Unsupported var access path: " + a);
        },
        clearEndFlag: function() {
            if (this._exitCup) {
                this._exitCup = false;
                this._pauseAction = sc.ARENA_PAUSE_ACTIONS.NONE
            }
        },
        getTotalArenaCompletion: function() {
            var a =
                0,
                c = 0,
                d;
            for (d in b) {
                a = a + this.getCupCompletion(d);
                c++
            }
            return a / c
        },
        getTotalDefaultCups: function(a) {
            if (a) {
                a = Object.keys(b);
                a.sort(function(a, c) {
                    return b[a].order - b[c].order
                }.bind(this));
                for (var c = {}, d = 0; d < a.length; d++) c[a[d]] = b[a[d]];
                return c
            }
            return b
        },
        getTotalDefaultTrophies: function(a, c) {
            var d = 0,
                e = 0,
                f;
            for (f in b) {
                var g = this.getCupTrophy(f);
                if (this.isCupUnlocked(f))
                    if (a == 0) {
                        d = d + g;
                        e = e + 5
                    } else {
                        g >= a && d++;
                        e++
                    }
            }
            return c ? e : d
        },
        isSideMessagesBlocked: function() {
            return !this.active ? false : this.runtime.roundStartedPre ||
                this.runtime.roundStarted
        },
        isEnemyBlocked: function(a) {
            if (!this.active) return false;
            if (a) return this.runtime.enemyIgnore[a.enemyName] ? true : a.getAttribute("arenaIgnore") != void 0
        },
        getCupCompletion: function(a) {
            var b = this.cups[a];
            if (b && b.progress) {
                var c = b.progress,
                    a = 1,
                    d = c.rush.medal >= sc.ARENA_MEDALS_TROPHIES.GOLD ? 1 : 0;
                if (b.noRush) d = a = 0;
                if (c) {
                    b = c.rounds;
                    for (c = b.length; c--;) {
                        b[c].medal >= sc.ARENA_MEDALS_TROPHIES.GOLD && d++;
                        a++
                    }
                    return d / a
                }
            }
            return 0
        },
        getCurrentObjective: function() {
            var a = this.getCurrentRound();
            return a.objective ? ig.LangLabel.getText(a.objective) : ig.lang.get("sc.gui.arena.menu.objectiveDefault")
        },
        getChallengeMods: function(a, b) {
            var c = {},
                d = this.getCupCoreAttrib(a, "mods"),
                e = 0;
            if (d)
                for (e = d.length; e--;) c[d[e]] = {
                    global: true
                };
            if (b >= 0)
                if (d = this.getCupRounds(a)[b || 0].mods)
                    for (e = d.length; e--;) c[d[e]] || (c[d[e]] = {
                        global: false
                    });
            return c
        },
        isStatusModifierBlocked: function(a) {
            return !this.active ? false : this.runtime.challengeMods["NO_" + a]
        },
        hasAnyChallenge: function() {
            for (var a in this.runtime.challengeMods) return true;
            return false
        },
        hasChallenge: function(a) {
            return !this.active ? false : this.runtime.challengeMods[a]
        },
        hasAscendedChallenge: function(a) {
            return this.getCupCoreAttrib(a, "mods")
        },
        isScoreNewRecord: function(a, b, c) {
            b = b || this.runtime.cup;
            c = c || this.runtime.currentRound;
            return !this.cups[b] || !this.cups[b].progress ? false : a > (c < 0 ? this.cups[b].progress.rush.points : this.cups[b].progress.rounds[c].points)
        },
        isPauseBlocked: function() {
            return this._pauseBlock
        },
        getCurrentWave: function() {
            return this.runtime.rounds[this.runtime.currentRound].waves[this.runtime.currentWave]
        },
        getNextWave: function() {
            var a = this.runtime.rounds[this.runtime.currentRound],
                b = this.runtime.currentWave;
            return a.waves[b + 1] ? a.waves[b + 1] : null
        },
        getCurrentRound: function() {
            return this.runtime.rounds[this.runtime.currentRound]
        },
        isCurrentRoundCustom: function() {
            return this.runtime.rounds[this.runtime.currentRound].customCode
        },
        isCurrentRoundLast: function() {
            return this.runtime.currentRound == this.runtime.rounds.length - 1
        },
        isCupSolo: function(a) {
            a = this.getCupCoreAttrib(a, "type");
            return a == "SOLO_CUP" || a == "SOLO_CUSTOM"
        },
        isCupCustom: function(a) {
            a = this.getCupCoreAttrib(a, "type");
            return a == "SOLO_CUSTOM" || a == "TEAM_CUSTOM"
        },
        getRoundCompletionTotal: function(a, b) {
            return this.cups[a] ? b == -1 ? this.cups[a].progress.rush.cleared : this.cups[a].progress.rounds[b].cleared : 0
        },
        getRoundMedalRequirement: function(a, b, c, d) {
            if (a = this.getCupRounds(a)) {
                if (b == -1) {
                    for (var b = a.length, e = 0; b--;) e = e + (d ? a[b].platPoints ? a[b].platPoints : a[b].points * 1E3 : a[b].points);
                    return Math.round(e * (c ? sc.ARENA_SILVER_MEDAL_QUOTA : 1))
                }
                return Math.round(a[b][d ? "platPoints" :
                    "points"
                ] * (c ? sc.ARENA_SILVER_MEDAL_QUOTA : 1))
            }
            return 0
        },
        getMedalForCurrentRound: function(a, b) {
            var c = this.runtime;
            if (b) {
                if (a >= this.getRoundMedalRequirement(c.cup, -1, false, true)) return sc.ARENA_MEDALS_TROPHIES.PLATIN;
                if (a >= this.getRoundMedalRequirement(c.cup, -1, false, false)) return sc.ARENA_MEDALS_TROPHIES.GOLD;
                if (a >= this.getRoundMedalRequirement(c.cup, -1, true, false)) return sc.ARENA_MEDALS_TROPHIES.SILVER
            } else {
                c = c.rounds[c.currentRound];
                if (c.platPoints && a >= c.platPoints) return sc.ARENA_MEDALS_TROPHIES.PLATIN;
                if (a >= c.points) return sc.ARENA_MEDALS_TROPHIES.GOLD;
                if (a >= ~~(c.points * sc.ARENA_SILVER_MEDAL_QUOTA)) return sc.ARENA_MEDALS_TROPHIES.SILVER
            }
            return sc.ARENA_MEDALS_TROPHIES.BRONZE
        },
        getTotalArenaCoins: function() {
            return this.coins
        },
        getArenaCoinsObtainedInCup: function(a) {
            if (this.cups[a] && this.cups[a].progress) {
                var b, c = this.cups[a].progress;
                b = 0 + this.getArenaCoinsObtainedInRound(a, -1);
                for (c = c.rounds.length; c--;) b = b + this.getArenaCoinsObtainedInRound(a, c);
                return b
            }
        },
        getArenaCoinsObtainedInRound: function(a,
            b, c) {
            if (this.cups[a] && this.cups[a].progress) {
                var d = this.cups[a].progress;
                return b == -1 ? this.getAvailableArenaCoinsInRound(a, b) * this._getCoinWeightMultiplier(c || 0, d.rush.medal) : this.getAvailableArenaCoinsInRound(a, b) * this._getCoinWeightMultiplier(c || 0, d.rounds[b].medal)
            }
        },
        getAvailableArenaCoinsInCup: function(a, b) {
            var c = this.getCupRounds(a);
            if (c) {
                for (var d = c.length, e = 0; d--;) e = e + (c[d].coins || 0);
                b || (e = e + ~~(e * sc.ARENA_RUSH_COIN_QUOTA));
                return e
            }
            return 0
        },
        getAvailableArenaCoinsInRound: function(a, b) {
            if (b ==
                -1) return ~~(this.getAvailableArenaCoinsInCup(a, true) * sc.ARENA_RUSH_COIN_QUOTA);
            var c = this.getCupRounds(a);
            return c ? c[b].coins || 0 : 0
        },
        getTotalPoints: function(a, b) {
            if (this.cups[a] && this.cups[a].progress) {
                for (var c = 0, d = this.cups[a].progress.rounds, e = d.length; e--;) c = c + d[e].points;
                b && (c = c + this.cups[a].progress.rush.points);
                return c
            }
            return -1
        },
        getRoundPoints: function(a, b) {
            if (this.cups[a] && this.cups[a].progress) {
                if (b == -1) return this.cups[a].progress.rush.points;
                if (this.cups[a].progress.rounds[b]) return this.cups[a].progress.rounds[b].points
            }
            return 0
        },
        getTotalTime: function(a) {
            if (this.cups[a] && this.cups[a].progress) {
                for (var b = 0, a = this.cups[a].progress.rounds, c = a.length; c--;) b = b + a[c].time;
                return b
            }
            return -1
        },
        getRoundTime: function(a, b) {
            if (this.cups[a] && this.cups[a].progress) {
                if (b == -1) return this.cups[a].progress.rush.time;
                if (this.cups[a].progress.rounds[b]) return this.cups[a].progress.rounds[b].time
            }
            return -1
        },
        hasMedalsForTrophy: function(a) {
            if (this.cups[a] && this.cups[a].progress) {
                for (var a = this.cups[a].progress, b = a.rounds.length; b--;)
                    if (a.rounds[b].medal <=
                        0) return false;
                return true
            }
            return false
        },
        getCupTrophy: function(a) {
            if (this.cups[a]) {
                if (!this.hasMedalsForTrophy(a)) return 0;
                for (var b = this.cups[a].progress, a = this.cups[a].noRush || false, c = 0, d = b.rounds.length; d--;) c = c + b.rounds[d].medal;
                c = c / b.rounds.length;
                d = ~~c;
                c = c > d ? c - d >= sc.ARENA_TROPHY_QUOTA ? Math.round(c) : d : d;
                if (c >= 4 && (a || b.rush.medal == 4)) {
                    sc.stats.setMap("arena", "unlockedTruePlatin", 1);
                    return 5
                }
                return d
            }
            return -1
        },
        getCupMedal: function(a, b) {
            if (this.cups[a]) {
                if (b <= -1) return this.cups[a].progress.rush.medal;
                if (this.cups[a].progress.rounds[b]) return this.cups[a].progress.rounds[b].medal
            }
            return -1
        },
        getCupLevel: function(a) {
            return (a = this.getCupCore(a)) ? ig.Event.getExpressionValue(a.level) : -1
        },
        getRoundsCleared: function(a) {
            for (var b = this.getCupRounds(a), a = this.cups[a].progress.rounds, b = b.length, c = 0; b--;) a[b] && a[b].cleared >= 1 && c++;
            return c
        },
        isCupUnlocked: function(a) {
            if (a = this.cups[a]) {
                c || (c = new ig.VarCondition);
                if (a.condition) {
                    c.setCondition(a.condition);
                    return c.evaluate()
                }
                return true
            }
            return false
        },
        getCupName: function(a) {
            if (this.cups[a] &&
                this.cups[a].name) return ig.LangLabel.getText(this.cups[a].name);
            var b = this.getCupCore(a);
            return b ? ig.LangLabel.getText(b.name) : "\\c[1]~" + a + "\\c[0]"
        },
        getCupDescription: function(a) {
            var b = this.getCupCore(a);
            return b ? ig.LangLabel.getText(b.info) : "\\c[1]~" + a + "\\c[0]"
        },
        getCupDifficultyIcon: function(a) {
            var b = this.getCupCore(a);
            return b ? "\\i[diff-" + parseInt(b.difficulty).limit(1, 6) + "]" : "\\c[1]~" + a + "\\c[0]"
        },
        getCupProgress: function(a) {
            return this.cups[a] ? this.cups[a].progress : null
        },
        getCupCore: function(a) {
            return (a =
                this.getCupData(a)) ? a.core : null
        },
        getCupCoreAttrib: function(a, b) {
            var c = this.getCupData(a);
            return c ? c.core[b] : null
        },
        getCupRounds: function(a) {
            return (a = this.getCupData(a)) ? a.rounds : null
        },
        getCupData: function(a) {
            return this.cups[a] && this.cups[a].data ? this.cups[a].data.data : null
        },
        getSortedCupList: function(a, b) {
            var c = [],
                d;
            for (d in this.cups) {
                var e = this.cups[d];
                e.data && e.data.data.core.type == a && c.push(d)
            }
            if (b != void 0) switch (b) {
                case sc.ARENA_SORT_TYPES.ORDER:
                    c.sort(function(a, b) {
                        return (this.cups[a].order ||
                            0) - (this.cups[b].order || 0)
                    }.bind(this))
            }
            return c
        },
        onStorageSave: function(a) {
            var b = {
                    cupData: {}
                },
                c;
            for (c in this.cups)
                if (this.cups[c] && this.cups[c].progress) {
                    for (var d = this.cups[c].progress, e = {
                            rush: {
                                medal: d.rush.medal,
                                points: d.rush.points,
                                time: d.rush.time,
                                cleared: d.rush.cleared,
                                chain: d.rush.chain
                            },
                            rounds: []
                        }, f = 0; f < d.rounds.length; f++) e.rounds.push({
                        medal: d.rounds[f].medal,
                        points: d.rounds[f].points,
                        time: d.rounds[f].time,
                        cleared: d.rounds[f].cleared
                    });
                    b.cupData[c] = e;
                    b.cupData[c].name = ig.copy(this.cups[c].name);
                    b.cupData[c].noRush = this.cups[c].noRush || false;
                    b.cupData[c].condition = ig.copy(this.cups[c].condition)
                } else b.cupData[c] = {};
            b.coins = this.coins || 0;
            b.coinsSpend = this.coinsSpend || 0;
            a.arena = b
        },
        onStoragePreLoad: function(a) {
            this.clearProgress();
            if (a.arena) {
                var b = a.arena.cupData,
                    c;
                for (c in b) {
                    if (this.cups[c]) {
                        var d = b[c];
                        if (d && d.rush && d.rounds) {
                            for (var e = {
                                    rush: {
                                        medal: d.rush.medal || 0,
                                        points: d.rush.points || 0,
                                        time: d.rush.time || 0,
                                        cleared: d.rush.cleared || 0,
                                        chain: d.rush.chain || 0
                                    },
                                    rounds: []
                                }, f = 0; f < d.rounds.length; f++) e.rounds.push({
                                medal: d.rounds[f].medal ||
                                    0,
                                points: d.rounds[f].points || 0,
                                time: d.rounds[f].time || 0,
                                cleared: d.rounds[f].cleared || 0
                            });
                            this.cups[c].progress = e;
                            this.cups[c].name = d.name || null;
                            this.cups[c].condition = d.condition || null;
                            this.cups[c].noRush = d.noRush || null
                        }
                    }
                    d = this.getCupCoreAttrib(c, "type");
                    e = this.getCupCoreAttrib(c, "extension");
                    if (!e || ig.extensions.hasExtension(e))
                        if (d == "SOLO_CUSTOM" || d == "TEAM_CUSTOM") this._hasCustomCups = true
                }
                this.coins = a.arena.coins || 0;
                this.coinsSpend = a.arena.coinsSpend || 0
            }
        },
        onNewGameApply: function(a) {
            this.onStoragePreLoad(a);
            this.coinsSpend = 0
        }
    });
    ig.addGameAddon(function() {
        return sc.arena = new sc.Arena
    });
    var g = {
        alignX: "CENTER",
        alignY: "CENTER"
    }
});
ig.baked = !0;
