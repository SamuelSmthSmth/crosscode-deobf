/**
 * @module game.feature.achievements.achievements
 *
 * Trophy/achievement manager. Loads all achievements from the database,
 * tracks their unlock state based on stat conditions, and supports
 * Steam achievement integration via greenworks. Organizes trophies
 * by type (General, Combat, Exploration), section, and sort order.
 */
ig.module("game.feature.achievements.achievements").requires("impact.base.game", "impact.base.loader", "impact.base.vars", "impact.feature.database.database", "impact.feature.greenworks.greenworks", "game.config", "game.feature.achievements.stats-model").defines(function() {
    var condition = new ig.VarCondition("");
    sc.TROPHY_TYPES = {
        GENERAL: "GENERAL",
        COMBAT: "COMBAT",
        EXPLORATION: "EXPLORATION"
    };
    sc.TROPHY_SECTIONS = {
        GENERAL: {PROGRESS: "PROGRESS", PLAYER: "PLAYER", ITEMS: "ITEMS", SPECIAL: "SPECIAL"},
        COMBAT: {ACTIONS: "ACTIONS", ENEMIES: "ENEMIES", CIRCUITS: "CIRCUITS", CUMULATIVE: "CUMULATIVE"},
        EXPLORATION: {DISCOVERY: "DISCOVERY", AREAS: "AREAS", CHESTS: "CHESTS", QUESTS: "QUESTS"}
    };
    sc.TROPHY_PROGESS_TYPE = {VALUE: "VALUE", VALUE_HIDDEN: "VALUE_HIDDEN", PERCENT: "PERCENT", NONE: "NONE", TIME: "TIME", CONDITION: "CONDITION", ENEMY: "ENEMY"};
    sc.TROPHY_ICONS = {
        DEFAULT: {index: 1, cat: "GENERAL"}, KILL: {index: 2, cat: "COMBAT"}, DAMAGE: {index: 3, cat: "COMBAT"},
        STREAK: {index: 4, cat: "COMBAT"}, STREAK_KILL: {index: 5, cat: "COMBAT"}, HEAL: {index: 6, cat: "COMBAT"},
        THROW: {index: 7, cat: "COMBAT"}, MELEE: {index: 8, cat: "COMBAT"}, DASH: {index: 9, cat: "COMBAT"},
        GUARD: {index: 10, cat: "COMBAT"}, CRITS: {index: 11, cat: "COMBAT"}, ARTS: {index: 111, cat: "COMBAT"},
        BOSS_MISC: {index: 13, cat: "COMBAT", hidden: true}, QUESTS: {index: 14, cat: "EXPLORATION"},
        QUEST_TASKS: {index: 15, cat: "EXPLORATION"}, TRADER: {index: 16, cat: "EXPLORATION"},
        BOTANICS: {index: 17, cat: "EXPLORATION"}, DASH_PLUS: {index: 18, cat: "COMBAT"},
        GUARD_PLUS: {index: 19, cat: "COMBAT"}, ENEMIES: {index: 20, cat: "COMBAT"},
        ENEMIES_REPORTS: {index: 21, cat: "COMBAT"}, PLAY_TIME: {index: 22, cat: "GENERAL"},
        LEVEL: {index: 23, cat: "GENERAL"}, PLATIN_TROPHY: {index: 66, cat: "GENERAL"},
        MONEY: {index: 107, cat: "GENERAL"}, STEPS: {index: 108, cat: "GENERAL"},
        JUMPS: {index: 62, cat: "GENERAL"}, KEY: {index: 63, cat: "GENERAL"},
        KEY_SILVER: {index: 64, cat: "GENERAL"}, KEY_GOLD: {index: 65, cat: "GENERAL"},
        CHEST_PERCENT: {index: 104, cat: "EXPLORATION"}, CHESTS: {index: 104, cat: "EXPLORATION"},
        CHESTS_AUTUMN: {index: 67, cat: "EXPLORATION"}, CHESTS_BERGEN: {index: 68, cat: "EXPLORATION"},
        CHESTS_MAROON: {index: 69, cat: "EXPLORATION"}, CHESTS_JUNGLE: {index: 70, cat: "EXPLORATION"},
        CHESTS_RIDGE: {index: 71, cat: "EXPLORATION"}, CHESTS_SQUARE: {index: 72, cat: "EXPLORATION"},
        CHESTS_COLD: {index: 73, cat: "EXPLORATION"}, CHESTS_HEAT: {index: 74, cat: "EXPLORATION"},
        CHESTS_SHOCKWAVE: {index: 75, cat: "EXPLORATION"}, CHESTS_VERMILLION: {index: 76, cat: "EXPLORATION"},
        LORE: {index: 77, cat: "EXPLORATION"}, LANDMARK_PERCENT: {index: 78, cat: "EXPLORATION"},
        LANDMARK: {index: 78, cat: "EXPLORATION"}, LANDMARK_AUTUMN: {index: 79, cat: "EXPLORATION"},
        LANDMARK_BERGEN: {index: 80, cat: "EXPLORATION"}, LANDMARK_MAROON: {index: 81, cat: "EXPLORATION"},
        LANDMARK_JUNGLE: {index: 82, cat: "EXPLORATION"}, LANDMARK_RIDGE: {index: 83, cat: "EXPLORATION"},
        LANDMARK_RHOMBUS: {index: 112, cat: "EXPLORATION"}, CIRCUIT_COLD: {index: 85, cat: "COMBAT"},
        CIRCUIT_HEAT: {index: 84, cat: "COMBAT"}, CIRCUIT_SHOCK: {index: 86, cat: "COMBAT"},
        CIRCUIT_WAVE: {index: 87, cat: "COMBAT"}, CIRCUIT_LEVEL_3: {index: 110, cat: "COMBAT"},
        GUARD_COUNTER: {index: 92, cat: "COMBAT"}, LOW_HEALTH_WINS: {index: 93, cat: "COMBAT"},
        ENVIRONMENT_KILLS: {index: 94, cat: "COMBAT"}, APOLLO_PERFECT: {index: 95, cat: "GENERAL"},
        ONE_PUNCH: {index: 96, cat: "COMBAT"}, ONE_SHOT: {index: 114, cat: "COMBAT"},
        STORY: {index: 97, cat: "GENERAL"}, ITEMS_USED: {index: 98, cat: "GENERAL"},
        METAL_GEARS: {index: 100, cat: "GENERAL"}, OLD_DRILL: {index: 101, cat: "GENERAL"},
        ITEMS_FOUND: {index: 102, cat: "GENERAL"}, ALL_IS_NORMAL: {index: 103, cat: "GENERAL"},
        MONK_TRIALS: {index: 105, cat: "GENERAL"}, ITEM_EXPO: {index: 106, cat: "GENERAL"},
        SPIDERS: {index: 109, cat: "GENERAL"}, EMILIE_RACES: {index: 116, cat: "GENERAL"},
        UNIQUE_EQUIP: {index: 117, cat: "GENERAL"},
        BOSS_CRAB: {index: 24, cat: "COMBAT", hidden: true}, BOSS_TURRET: {index: 25, cat: "COMBAT", hidden: true},
        BOSS_DRILLER: {index: 26, cat: "COMBAT", hidden: true}, BOSS_TIM: {index: 27, cat: "COMBAT", hidden: true},
        BOSS_MOTH: {index: 28, cat: "COMBAT", hidden: true}, BOSS_FROBBIT: {index: 29, cat: "COMBAT", hidden: true},
        BOSS_PHANTOM: {index: 30, cat: "COMBAT", hidden: true}, BOSS_BLOB: {index: 31, cat: "COMBAT", hidden: true},
        BOSS_APE: {index: 32, cat: "COMBAT", hidden: true}, BOSS_APE_WHALE: {index: 33, cat: "COMBAT", hidden: true},
        BOSS_SLOTH: {index: 37, cat: "COMBAT", hidden: true}, BOSS_SNAIL: {index: 38, cat: "COMBAT", hidden: true},
        BOSS_APOLLO: {index: 34, cat: "COMBAT", hidden: true}, BOSS_APOLLO_2: {index: 35, cat: "COMBAT", hidden: true},
        BOSS_APOLLO_3: {index: 36, cat: "COMBAT", hidden: true}, BOSS_SAMURAI: {index: 39, cat: "COMBAT", hidden: true},
        BOSS_SHIZUKA: {index: 40, cat: "COMBAT", hidden: true}, BOSS_DESIGNER: {index: 41, cat: "COMBAT", hidden: true},
        BOSS_ELEPHANT: {index: 42, cat: "COMBAT", hidden: true}
    };
    sc.TROPHY_SORT_TYPES = {ORDER: 0, UNLOCKED: 1, NAME: 2, POINTS: 3};
    sc.TROPHY_STARS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5};
    sc.TrophyManager = ig.GameAddon.extend({
        observers: [],
        trophies: null,
        totalPoints: 0,
        version: 4,
        subLists: null,
        latest: [],
        init: function() {
            this.parent("Achievements");
            sc.Model.addObserver(sc.stats, this);
            this._initSubLists();
            if (window.wm) ig.database.register("achievements", "FeatEnumList", "Achievements");
            else {
                ig.storage.register(this);
                this.onStorageGlobalLoad(ig.storage.globalData)
            }
            for (var key in sc.TROPHY_ICONS);
            ig.vars.registerVarAccessor("trophies", this, "VarTrophyEditor")
        },
        getTotalTrophiesUnlocked: function(asFraction, categoryFilter, sectionFilter) {
            var unlocked = 0, total = 0, key;
            for (key in this.trophies) {
                var trophy = this.trophies[key];
                if (trophy.track && !(categoryFilter && categoryFilter != trophy.category) && !(sectionFilter && sectionFilter != trophy.section)) {
                    trophy.triggered && unlocked++;
                    total++
                }
            }
            return asFraction ? unlocked / total : unlocked
        },
        getTotalTrophies: function(categoryFilter, sectionFilter, resultObj) {
            var unlocked = 0, total = 0, key;
            for (key in this.trophies) {
                var trophy = this.trophies[key];
                if (trophy.track && !(categoryFilter && categoryFilter != trophy.category) && !(sectionFilter && sectionFilter != trophy.section)) {
                    trophy.triggered && unlocked++;
                    total++
                }
            }
            resultObj || (resultObj = {count: 0, total: 0});
            resultObj.count = unlocked;
            resultObj.total = total;
            return resultObj
        },
        varsChangedOrder: 1E4,
        onVarsChanged: function() {
            sc.model.currentState == sc.GAME_MODEL_STATE.TITLE || (sc.model.currentSubState == sc.GAME_MODEL_SUBSTATE.LOADGAME || sc.model.currentSubState == sc.GAME_MODEL_SUBSTATE.LOADING) || this.subLists.varConditions && this._updateSubList(this.subLists.varConditions)
        },
        onVarAccess: function(path, args) {
            if (args[0] == "trophies") switch (args[1]) {
                case "triggered":
                    var trophy = this.getTrophy(args[2]);
                    return !trophy ? false : trophy.triggered || false;
                case "name": return this.getTrophyName(args[2]);
                case "version": return this.version + ""
            }
            throw Error("Unsupported var access path: " + path);
        },
        updateAll: function() {
            if (!sc.newgame.get("no-trophies"))
                for (var key in this.subLists) this._updateSubList(this.subLists[key])
        },
        triggerTrophy: function(trophyId) {
            if (!sc.newgame.get("no-trophies") && this.trophies[trophyId] && !this.trophies[trophyId].triggered) {
                this.trophies[trophyId].triggered = true;
                this.validateFeatPoints();
                this._notifyNewTrophy(trophyId);
                ig.storage.saveGlobals()
            }
        },
        clearTrophies: function() {
            for (var key in this.trophies) this.trophies[key].triggered = false;
            sc.menu.clearNewUnlock(sc.MENU_SUBMENU.TROPHY);
            ig.storage.saveGlobals()
        },
        validateFeatPoints: function() {
            var trophyCount = this.totalPoints = 0, key;
            for (key in this.trophies) {
                var trophy = this.trophies[key];
                if (trophy.track && trophy.triggered) {
                    this.totalPoints = this.totalPoints + (trophy.points || 0);
                    trophyCount++
                }
            }
            sc.stats.setMap("player", "trophies", trophyCount)
        },
        getTotalPoints: function() {this.validateFeatPoints(); return this.totalPoints},
        getTrophy: function(id) {return this.trophies[id]},
        getTrophyName: function(id) {return !this.trophies[id] ? "???" : ig.LangLabel.getText(this.trophies[id].name)},
        isTrophyUnlocked: function(id) {return this.trophies[id].triggered || false},
        _addToLatest: function(trophy) {this.latest.push(trophy); this.latest.length >= 3 && this.latest.shift()},
        _initSubLists: function() {
            this.subLists = {};
            this.trophies = ig.database.get("achievements");
            var trophy = null, statEntry = null, idx = 0, key;
            for (key in this.trophies) {
                trophy = this.trophies[key];
                trophy.key = key;
                if (!trophy.stats || trophy.stats.length == 0) {
                    if (trophy.condition) {
                        this.subLists.varConditions || (this.subLists.varConditions = []);
                        this.subLists.varConditions.push(trophy)
                    }
                } else
                    for (idx = trophy.stats.length; idx--;) {
                        statEntry = trophy.stats[idx];
                        this.subLists[statEntry.key] || (this.subLists[statEntry.key] = []);
                        this.subLists[statEntry.key].push(trophy)
                    }
            }
            ig.JSON_LOG && ig.log("%cDATABASE: %cLoaded Achievements: \n%O", "color:orange", "", this.subLists)
        },
        _updateSubList: function(list) {
            if (!sc.newgame.get("no-trophies")) {
                for (var len = list.length, idx = 0, stats = sc.stats, trophy = null, statEntry = null, statValue = null, anyTriggered = false, isFulfilled = false; len--;) {
                    trophy = list[len];
                    if (!trophy.triggered && trophy.track) {
                        idx = trophy.stats.length;
                        for (isFulfilled = true; idx--;) {
                            statEntry = trophy.stats[idx];
                            statValue = statEntry.mapKey ? stats.getMap(statEntry.key, statEntry.mapKey) : stats.get(statEntry.key);
                            var targetValue = ig.Event.getExpressionValue(statEntry.value);
                            if (!this._compare(statEntry.compare, statValue, targetValue)) {isFulfilled = false; break}
                        }
                        if (trophy.condition && isFulfilled) {condition.setCondition(trophy.condition); isFulfilled = condition.evaluate()}
                        if (isFulfilled) {anyTriggered = trophy.triggered = true; this._notifyNewTrophy(trophy.key)}
                    }
                }
                if (anyTriggered) {this.validateFeatPoints(); ig.storage.saveGlobals()}
            }
        },
        _notifyNewTrophy: function(trophyId) {
            this._addToLatest(this.trophies[trophyId]);
            this.trophies[trophyId].triggered = true;
            ig.greenworks.isActive() && this.trophies[trophyId].steamID && ig.greenworks.activateAchievement(this.trophies[trophyId].steamID);
            sc.Model.notifyObserver(this, sc.TROPHY_EVENTS.TRIGGERED, trophyId);
            sc.menu.addLog({type: "TROPHY", trophy: trophyId});
            sc.menu.addNewUnlock(sc.MENU_SUBMENU.TROPHY, trophyId)
        },
        _compare: function(op, actual, target) {
            if (op == "min") return actual >= target;
            if (op == "max") return actual <= target;
            if (op == "equal") return actual == target
        },
        onStorageGlobalSave: function(data) {
            var triggered = {}, key;
            for (key in this.trophies) this.trophies[key].triggered && (triggered[key] = true);
            data.featVersion = this.version;
            data.feats = triggered
        },
        onStorageGlobalLoad: function(data) {
            var saved = data.feats, key;
            for (key in saved)
                if (this.trophies[key] && saved[key] == true) {
                    this.trophies[key].triggered = true;
                    ig.greenworks.isActive() && this.trophies[key].steamID && ig.greenworks.activateAchievement(this.trophies[key].steamID)
                } this.validateFeatPoints()
        },
        modelChanged: function(model, msg, data) {
            if (msg == sc.STATS_EVENT.STAT_CHANGED) this.subLists[data.key] && this._updateSubList(this.subLists[data.key]);
            else if (msg == sc.STATS_EVENT.DEFERRED_STAT_CHANGED)
                for (var idx = data.length; idx--;) this.subLists[data[idx].key] && this._updateSubList(this.subLists[data[idx].key])
        }
    });
    sc.TROPHY_EVENTS = {};
    sc.TROPHY_EVENTS.TRIGGERED = 0;
    ig.addGameAddon(function() {return sc.trophies = new sc.TrophyManager})
});
ig.baked = !0;