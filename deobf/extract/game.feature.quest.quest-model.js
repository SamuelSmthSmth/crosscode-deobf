ig.module("game.feature.quest.quest-model").requires("impact.base.game", "impact.base.loader", "impact.feature.database.database", "game.config", "game.feature.quest.quest-types", "game.feature.model.game-model", "game.feature.combat.combat", "game.feature.timers.timers-model").defines(function() {
    var b = {
            quest: null,
            state: null
        },
        a = {
            item: 0,
            amount: 0,
            enemy: null,
            quest: null
        };
    sc.QUEST_LIST_TYPE = {
        ACTIVE: 0,
        SOLVED: 1,
        ALL: 2
    };
    sc.QUEST_SORT_TYPE = {
        ACCEPTED: 0,
        ORDER: 1,
        NAME: 2,
        LEVEL: 3
    };
    var d = {
        "rookie-harbor": 0,
        "autumn-area": 1,
        "autumn-fall": 2,
        "bergen-trails": 3,
        bergen: 4,
        "heat-area": 5,
        "heat-village": 6,
        jungle: 7,
        "jungle-city": 8
    };
    sc.QuestModel = ig.GameAddon.extend({
        observers: [],
        staticQuests: {},
        activeQuests: [],
        finishedQuests: {},
        focusQuest: -1,
        markedQuests: [],
        _activeQuestIndex: {},
        _solvedQueue: [],
        _solvedTimer: 0,
        _hasSolveDialogs: false,
        _subQuest: [],
        init: function() {
            this.parent("Quests");
            this._loadStaticQuests();
            if (window.wm) {
                ig.database.register("quests", "QuestEnumEditor", "Quests");
                ig.database.register("questHubs", "QuestHubList", "Quest Hubs")
            }
            ig.storage.register(this);
            ig.vars.registerVarAccessor("quest", this, "VarQuestEditor");
            ig.vars.registerVarAccessor("questHubs", this, "VarQuestHubEditor");
            sc.combat.addCombatListener(this);
            sc.Model.addObserver(sc.model.player, this)
        },
        getTotalQuestsSolved: function(a, b, d, g) {
            var h = 0,
                i = 0,
                j;
            for (j in this.staticQuests)
                if (!(b && this.staticQuests[j].area != b) && (!d || this.staticQuests[j].hubSettings) && !this.staticQuests[j].noTrack && !this.staticQuests[j].extension) {
                    this.finishedQuests[j] && h++;
                    i++
                } return i ? a ? h / i : h : g ? 1 : 0
        },
        getTotalHubQuestsSolved: function(a,
            b) {
            b = b || {
                total: 0,
                solved: 0
            };
            b.total = 0;
            b.solved = 0;
            for (var d in this.staticQuests) {
                var g = this.staticQuests[d];
                if (a == g.area && (g.hubSettings && !g.noTrack) && (!g.extension || ig.extensions.hasExtension(g.extension))) {
                    this.finishedQuests[d] && b.solved++;
                    b.total++
                }
            }
        },
        hasAreaQuests: function(a) {
            var b = this.staticQuests,
                d;
            for (d in b)
                if (b[d].area == a) return true;
            return false
        },
        onPreUpdate: function() {
            if (sc.model.isOutOfCombatDialogReady())
                if (this._solvedQueue.length >= 1)
                    if (this._solvedTimer <= 0) {
                        var a = this._solvedQueue.splice(0,
                            1)[0];
                        this._hasSolveDialogs = true;
                        a = this.getQuestEvent(this.staticQuests[a]);
                        sc.Cutscene.startCutscene(a);
                        this._solvedTimer = 0
                    } else this._solvedTimer = this._solvedTimer - ig.system.actualTick;
            else this._hasSolveDialogs = false
        },
        resetOrder: -1,
        onReset: function() {
            this.activeQuests.length = 0;
            this._activeQuestIndex = {};
            this.focusQuest = -1;
            this._solvedTimer = this._solvedQueue.length = 0;
            this.finishedQuests = {};
            this.markedQuests = [];
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED)
        },
        popInlineSolvedQuest: function() {
            if (this._solvedQueue.length >=
                1) {
                this._hasSolveDialogs = true;
                ig.vars.set("tmp._questRewardsFinished", false);
                var a = this._solvedQueue.splice(0, 1)[0];
                this.getInlineQuestResolve(this.staticQuests[a]);
                return true
            }
            return this._hasSolveDialogs = false
        },
        getInlineQuestResolve: function(a) {
            a = ig.gui.createEventGui(null, "QuestSolvedDialog", {
                quest: a
            });
            ig.gui.spawnEventGui(a)
        },
        getQuestEvent: function(a) {
            return new ig.Event({
                steps: [{
                        type: "WAIT",
                        time: 0.2,
                        ignoreSlowDown: true
                    }, {
                        type: "ADD_GUI",
                        name: null,
                        guiInfo: {
                            type: "QuestSolvedDialog",
                            settings: {
                                quest: a
                            }
                        }
                    },
                    {
                        type: "WAIT_UNTIL_TRUE",
                        condition: "tmp._questRewardsFinished"
                    }, {
                        type: "WAIT",
                        time: 0.1,
                        ignoreSlowDown: true
                    }
                ]
            })
        },
        markQuest: function(a) {
            if (this.isQuestSolved(a)) {
                this.markedQuests.erase(a);
                this.focusQuest = -1;
                sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E4)
            } else {
                this.markedQuests.indexOf(a) == -1 ? this.markedQuests.push(a) : this.markedQuests.erase(a);
                this.focusQuest = -1;
                sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E4);
                this.sortIDList(this.markedQuests)
            }
        },
        isMarkedQuest: function(a) {
            for (var b =
                    this.markedQuests.length; b--;)
                if (a == this.markedQuests[b]) return true;
            return false
        },
        hasQuestSolvedDialogs: function() {
            return this._hasSolveDialogs
        },
        hasSolvedQuestsStacked: function() {
            return this._solvedQueue.length > 0
        },
        setFavQuestOld: function(a) {
            if (a < 0) return false;
            a == this.focusQuest && (a = -1);
            var b = this.focusQuest;
            this.focusQuest = a;
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, b);
            return true
        },
        cycleFavQuest: function(a, b) {
            if (this.markedQuests.length != 0) {
                var d = this.focusQuest,
                    a = a || 0;
                this.focusQuest = this.focusQuest + a;
                if (a >= 0) {
                    if (this.focusQuest >= this.markedQuests.length) this.focusQuest = -1
                } else if (this.focusQuest == -2) this.focusQuest = this.markedQuests.length - 1;
                else if (this.focusQuest < 0) this.focusQuest = -1;
                if (this.focusQuest != -1 && this.isMarkedQuestDone()) {
                    this.markedQuests.splice(this.focusQuest, 1);
                    this.cycleFavQuest(a, b)
                } else b || sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, d)
            }
        },
        sendNotification: function(a, d, f) {
            a == sc.QUEST_MODEL_EVENT.FINISHED && this.setQuestFinished(d.quest,
                f);
            b.state = d || null;
            b.quest = d.quest || null;
            sc.Model.notifyObserver(this, a, b)
        },
        createQuest: function(a) {
            a = new sc.Quest(a);
            this._setCurrentLocationAndTime(a);
            var d = new sc.QuestState(a);
            b.quest = a;
            b.state = d;
            this.activeQuests.push(d);
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.ADDED, b);
            sc.commonEvents.triggerEvent("QUEST_ACCEPTED", {});
            ig.game.varsChangedDeferred()
        },
        activateStaticQuest: function(a, d, f) {
            var g = this.staticQuests[a];
            if (!g) throw Error("Could not find quest with ID: " + a);
            if (this._hasAlreadyFinished(g)) throw Error("Static quest is already finished! Quest ID: " +
                a);
            this._setCurrentLocationAndTime(g, d, f);
            d = new sc.QuestState(g);
            if (!d.finished) {
                this.activeQuests.push(d);
                this._activeQuestIndex[a] = this.activeQuests.length - 1;
                b.quest = g;
                b.state = d;
                sc.stats.setMapMax("quests", "active", this.activeQuests.length);
                sc.menu.addLog({
                    type: "QUEST",
                    accept: true,
                    quest: a
                });
                sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.ADDED, b);
                sc.commonEvents.triggerEvent("QUEST_ACCEPTED", {})
            }
            ig.game.varsChangedDeferred();
            return d
        },
        solveQuestCondition: function(b, d) {
            for (var f = this.staticQuests[b],
                    g = this.activeQuests.length; g--;) {
                var h = this.activeQuests[g];
                if (h.quest == f) {
                    h.labels[d] = true;
                    a.label = d;
                    a.value = true;
                    h.updateState("CONDITION", a);
                    ig.game.varsChangedDeferred();
                    return
                }
            }
            throw Error("Tried to solve condition of quest that is not active");
        },
        updateQuestLocation: function(a) {
            if (this.isQuestActive(a)) {
                a = this.staticQuests[a];
                a.location.area = sc.map.getCurrentPlayerAreaName();
                a.location.map = sc.map.getCurrentMapName(true)
            }
        },
        resetQuestTask: function(a, b) {
            var d = this._activeQuestIndex[a];
            if (d != void 0) {
                this.activeQuests[d].resetTaskIndex(b);
                ig.game.varsChangedDeferred()
            }
        },
        updateActiveQuests: function(a, b) {
            for (var d = this.activeQuests.length; d--;) this.activeQuests[d].updateState(a, b);
            ig.game.varsChangedDeferred()
        },
        resolveActiveQuestChanges: function(a, b) {
            for (var d = this.activeQuests.length; d--;) this.activeQuests[d].updateState(a, b, true);
            ig.game.varsChangedDeferred()
        },
        setQuestFinished: function(b, d) {
            if (this.finishedQuests[b.id]) throw Error("Static quest has already been finished! ID: " + b.id);
            if (!d) {
                var f = this._activeQuestIndex[b.id];
                if (f ==
                    void 0) {
                    console.error("Quest with State %O is not an active quest and cannot be finished!", b.id);
                    return
                }
                this.activeQuests.splice(f, 1);
                for (var g in this._activeQuestIndex) this._activeQuestIndex[g] >= f && (this._activeQuestIndex[g] = this._activeQuestIndex[g] - 1)
            }
            sc.menu.addLog({
                type: "QUEST",
                finish: true,
                quest: b.id
            });
            this._solvedQueue.push(b.id);
            if ((f = this.getMarkedQuest()) && f.id == b.id) this.focusQuest = -1;
            this.isMarkedQuest(b.id) && this.markQuest(b.id);
            if (b.id) {
                this.finishedQuests[b.id] = {
                    solved: true
                };
                d || delete this._activeQuestIndex[b.id]
            }
            sc.stats.addMap("quests",
                "solved", 1);
            sc.stats.setMap("quests", "solvedTotal", this.getTotalQuestsSolved(true));
            ig.game.varsChangedDeferred();
            a.quest = b.id;
            a.value = true;
            this.updateActiveQuests("QUEST", a)
        },
        finishUpQuest: function(a) {
            this._collectRewards(a);
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.POST_FINISHED, a)
        },
        isQuestActive: function(a) {
            return this._activeQuestIndex[a] != void 0
        },
        isQuestSolved: function(a) {
            return this.finishedQuests[a]
        },
        isQuestLabelSolved: function(a, b) {
            var d = this.getQuestState(a);
            return d ? d.labels[b] :
                this.isQuestSolved(a.id) ? true : false
        },
        getQuestState: function(a) {
            return this.activeQuests[this._activeQuestIndex[a.id]]
        },
        getSubQuests: function(a) {
            if (a.tasks[0] && a.tasks[0].subQuests) return a.tasks[0].subQuests
        },
        getQuestTask: function(a, b) {
            if (this.staticQuests[a]) return this.staticQuests[a].tasks[b]
        },
        getStaticQuest: function(a) {
            return this.staticQuests[a]
        },
        isTaskDone: function(a, b) {
            var d = this.activeQuests[this._activeQuestIndex[a.id]];
            return d ? d.currentTask > b : this.finishedQuests[a.id] ? true : false
        },
        getCurrentTask: function(a,
            b) {
            var d = this.activeQuests[this._activeQuestIndex[a.id]];
            if (d) return b ? d.highestTask : d.currentTask;
            if (this.finishedQuests[a.id]) return a.tasks.length - 1
        },
        getQuestName: function(a) {
            return !this.staticQuests[a] ? "NO QUEST" : this.staticQuests[a].name
        },
        getQuestList: function(a, b) {
            var d = [];
            if (a == sc.QUEST_LIST_TYPE.ACTIVE || a == sc.QUEST_LIST_TYPE.ALL)
                for (var g = this.activeQuests.length; g--;) d.push(this.activeQuests[g].quest);
            if (a == sc.QUEST_LIST_TYPE.SOLVED || a == sc.QUEST_LIST_TYPE.ALL)
                for (var h in this.finishedQuests) d.push(this.staticQuests[h]);
            b != void 0 && this.sortQuestList(d, b);
            return d
        },
        sortIDList: function(a) {
            a.sort(function(a, b) {
                return this.staticQuests[b].timeStamp - this.staticQuests[a].timeStamp
            }.bind(this))
        },
        sortQuestList: function(a, b) {
            switch (b) {
                case sc.QUEST_SORT_TYPE.ACCEPTED:
                    a.sort(function(a, b) {
                        return b.timeStamp - a.timeStamp
                    });
                    break;
                case sc.QUEST_SORT_TYPE.ORDER:
                    a.sort(function(a, b) {
                        var c = a.order,
                            e = b.order,
                            c = c + (d[a.area] || 0) * 1E5,
                            e = e + (d[b.area] || 0) * 1E5;
                        return c - e
                    });
                    break;
                case sc.QUEST_SORT_TYPE.NAME:
                    a.sort(function(a, b) {
                        return a.name.toString().localeCompare(b.name.toString())
                    });
                    break;
                case sc.QUEST_SORT_TYPE.LEVEL:
                    a.sort(function(a, b) {
                        return a.level != b.level ? a.level - b.level : b.timeStamp - a.timeStamp
                    })
            }
        },
        getActiveQuestID: function(a) {
            return this._activeQuestIndex[a.id]
        },
        _sortOrder: function(a, b) {
            return a.order - b.order
        },
        getMarkedQuest: function() {
            return this.focusQuest < 0 ? null : this.staticQuests[this.markedQuests[this.focusQuest]]
        },
        getCurrentMarkedQuestTaskIndex: function() {
            return this.focusQuest < 0 ? null : this.activeQuests[this.getActiveQuestID(this.staticQuests[this.markedQuests[this.focusQuest]])].currentTask
        },
        isMarkedQuestDone: function() {
            if (!this.markedQuests[this.focusQuest]) return true;
            var a = this.activeQuests[this.getActiveQuestID(this.staticQuests[this.markedQuests[this.focusQuest]])];
            return !a ? true : a.isDone()
        },
        isMarkedTaskDone: function(a) {
            return this.focusQuest < 0 ? false : this.activeQuests[this.focusQuest].currentTask > a
        },
        getMarkedTaskIndex: function(a) {
            for (var b = this.activeQuests[this.focusQuest].quest, d = b.tasks.length; d--;)
                if (b.tasks[d] == a) return d
        },
        getSubTaskState: function(a, b, d) {
            return this.activeQuests[this._activeQuestIndex[a.id]] ?
                this.activeQuests[this._activeQuestIndex[a.id]].done[b][d] : {}
        },
        isSubTaskDone: function(a, b, d) {
            return this.activeQuests[this._activeQuestIndex[a.id]] ? a.tasks[b].subTasks[d].isFulfilled(this.activeQuests[this._activeQuestIndex[a.id]].done[b][d]) : false
        },
        onVarAccess: function(a, b) {
            if (b[0] == "quest") {
                var d = this._activeQuestIndex[b[1]];
                if (d != void 0 && d >= 0) {
                    if (d = this.activeQuests[d]) switch (b[2]) {
                        case "started":
                            return true;
                        case "solved":
                            return d.finished;
                        case "task":
                            return d.currentTask == b[3] * 1;
                        case "currentTask":
                            return d.currentTask;
                        case "subtask":
                            return d.isSubTaskSolved(b[3] * 1);
                        case "subvalue":
                            return d.getCurrentSubTaskValue(b[3] * 1) + "";
                        case "subrequire":
                            return d.getCurrentSubTaskValue(b[3] * 1, true) + "";
                        case "label":
                            return d.labels[b[3]]
                    }
                } else if (this.finishedQuests[b[1]]) {
                    d = this.staticQuests[b[1]];
                    switch (b[2]) {
                        case "task":
                            return d.tasks.length == b[3] * 1;
                        case "currentTask":
                            return d.tasks.length;
                        default:
                            return true
                    }
                }
            }
        },
        onCombatEvent: function(b, d) {
            if (d == sc.COMBAT_EVENT.DEFEATED) {
                a.enemy = b.enemyName || null;
                a.amount = 1;
                this.updateActiveQuests("KILL",
                    a)
            }
        },
        onLandmarkEvent: function(b) {
            if (b) {
                a.area = b;
                this.updateActiveQuests("LANDMARK", a)
            }
        },
        modelChanged: function(b, d, f) {
            if (b == sc.model.player)
                if (d == sc.PLAYER_MSG.ITEM_OBTAINED) {
                    a.item = f.id;
                    a.amount = f.amount;
                    this.updateActiveQuests("COLLECT", a)
                } else if (d == sc.PLAYER_MSG.ITEM_REMOVED) {
                a.item = f.id;
                a.amount = -f.amount;
                this.resolveActiveQuestChanges("COLLECT", a)
            } else if (d == sc.PLAYER_MSG.ITEM_USED) {
                a.item = f;
                a.amount = -1;
                this.resolveActiveQuestChanges("COLLECT", a)
            } else if (d == sc.PLAYER_MSG.EQUIP_CHANGE)
                if (f.amount <
                    0) {
                    a.item = f.id;
                    a.amount = -1;
                    this.resolveActiveQuestChanges("COLLECT", a)
                } else if (f.amount > 0) {
                a.item = f.id;
                a.amount = 1;
                this.updateActiveQuests("COLLECT", a)
            }
        },
        _collectRewards: function(a) {
            if (a.rewards) {
                var b = sc.model.player,
                    d = a.rewards;
                if (d.exp) {
                    a = b.addExperience(d.exp.exp, a.level, d.exp.bonus, true, sc.LEVEL_CURVES.QUEST);
                    sc.stats.addMap("quests", "exp", a)
                }
                if (d.money) {
                    b.addCredit(d.money);
                    sc.stats.addMap("quests", "money", d.money || 0)
                }
                if (d.cp) {
                    a = d.cp.element;
                    if (a == "ALL_ELEMENTS") {
                        b.addSkillPoints(d.cp.amount,
                            sc.ELEMENT.HEAT, false, true);
                        b.addSkillPoints(d.cp.amount, sc.ELEMENT.COLD, false, true);
                        b.addSkillPoints(d.cp.amount, sc.ELEMENT.SHOCK, false, true);
                        b.addSkillPoints(d.cp.amount, sc.ELEMENT.WAVE, false, true);
                        sc.stats.addMap("quest", "cp", d.cp.amount)
                    } else {
                        b.addSkillPoints(d.cp.amount, a == "ALL" ? -1 : sc.ELEMENT[a], a == "ALL", true);
                        sc.stats.addMap("quest", "cp", d.cp.amount * (a == "ALL" ? 5 : 1))
                    }
                }
                if (d.items)
                    for (a = 0; a < d.items.length; a++) {
                        b.addItem(d.items[a].id, d.items[a].amount, true);
                        sc.stats.addMap("quests", "rewards", 1)
                    }
            }
        },
        updateTimeStamp: function(a, b) {
            a.timeStamp = sc.stats.getMap("player", "playtime") + b
        },
        _setCurrentLocationAndTime: function(a, b, d) {
            a.location.area = sc.map.getCurrentPlayerAreaName();
            a.location.map = d ? sc.map.getMapName(d) : sc.map.getCurrentMapName(true);
            a.timeStamp = sc.stats.getMap("player", "playtime");
            a.character = b || null
        },
        _hasAlreadyFinished: function(a) {
            return this.finishedQuests[a.id]
        },
        _loadStaticQuests: function() {
            this.staticQuests = {};
            var a = ig.database.get("quests"),
                b;
            for (b in a) this.staticQuests[b] = new sc.Quest(a[b],
                b);
            ig.JSON_LOG && ig.log("%cDATABASE: %cLoaded Static Quests: \n%O", "color:orange", "", this.staticQuests)
        },
        onStorageSave: function(a) {
            var b = {};
            b.focusQuest = this.focusQuest;
            b.markedQuests = ig.copy(this.markedQuests);
            b.finished = ig.copy(this.finishedQuests);
            b.solvedQueue = ig.copy(this._solvedQueue);
            var d = {},
                g = null,
                h;
            for (h in this.staticQuests) {
                g = this.staticQuests[h];
                g.timeStamp > 0 && (d[h] = {
                    time: g.timeStamp,
                    location: {
                        area: g.location.area.data,
                        map: g.location.map.data
                    },
                    character: g.character
                })
            }
            b.locale = d;
            d = [];
            g =
                this.activeQuests.length;
            for (h = null; g--;) {
                h = this.activeQuests[g];
                d[g] = h.getSaveData()
            }
            b.states = d;
            a.quests = b
        },
        onStoragePreLoad: function(a) {
            (a = a.quests) || (a = {});
            this.focusQuest = a.focusQuest == void 0 ? -1 : a.focusQuest;
            this.markedQuests = a.markedQuests || [];
            if (this.markedQuests.length == 0) this.focusQuest = -1;
            else
                for (var b = 0; b < this.markedQuests.length; b++)
                    if (!this.staticQuests[this.markedQuests[b]]) {
                        this.markedQuests.length = 0;
                        this.focusQuest = -1
                    } this._solvedQueue = a.solvedQueue || [];
            this._solvedTimer = 0;
            var d = null,
                b = a.locale,
                g;
            for (g in b)
                if (this.staticQuests[g]) {
                    d = this.staticQuests[g];
                    d.location.area = new ig.LangLabel(b[g].location.area || "???");
                    d.location.map = new ig.LangLabel(b[g].location.map || "???");
                    d.timeStamp = b[g].time;
                    d.character = b[g].character ? b[g].character : null
                } this.finishedQuests = a.finished || {};
            g = a.states || [];
            this._activeQuestIndex = {};
            this.activeQuests.length = 0;
            for (var h = null, i = false, j = [], b = 0; b < g.length; ++b) {
                a = g[b];
                if (d = this.staticQuests[g[b].id]) {
                    if (d.tasks.length != a.completed.length) {
                        i = true;
                        h = new sc.QuestState(d);
                        j.push(d)
                    } else {
                        h = new sc.QuestState(d, true);
                        h.setLoadData(a)
                    }
                    if (!h.finished) {
                        this._activeQuestIndex[d.id] = this.activeQuests.length;
                        this.activeQuests.push(h)
                    }
                } else i = true
            }
            if (!this.activeQuests[this.focusQuest]) this.focusQuest = -1;
            for (d in this.finishedQuests) this.staticQuests[d] || delete this.finishedQuests[d];
            if (i) {
                for (b = j.length; b--;) this.checkIfSubQuests(j[b]);
                ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.questUpdate"))
            }
            sc.stats.setMap("quests", "solvedTotal", this.getTotalQuestsSolved(true));
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E5)
        },
        checkIfSubQuests: function(b) {
            if (b = b.tasks[0].subQuests)
                for (var d = b.length; d--;)
                    if (this.isQuestSolved(b[d])) {
                        a.quest = b[d];
                        a.value = true;
                        this.updateActiveQuests("QUEST", a)
                    }
        }
    });
    sc.QuestState = ig.Class.extend({
        quest: null,
        done: [],
        currentTask: 0,
        highestTask: 0,
        finished: false,
        labels: {},
        init: function(a, b) {
            this.quest = a;
            !b && this.initState()
        },
        finalizeTask: function(a) {
            for (var a = a.subTasks, b = a.length; b--;) {
                a[b].finalize && a[b].finalize();
                sc.stats.addMap("quests",
                    "subtasks", 1);
                sc.stats.addMap("quests", "subtasks" + a[b].type, 1)
            }
        },
        initState: function(a) {
            var b = this.quest.tasks,
                d;
            for (d in this.labels) this.labels[d] = false;
            this.done.length = 0;
            d = null;
            for (var g = true, h = false, i = 0; i < b.length; i++) {
                d = b[i].subTasks;
                this.done[i] = [];
                for (var g = true, j = d[k], k = 0; k < d.length; k++) {
                    j = d[k];
                    this.done[i][k] = {};
                    j.initState(this.done[i][k], this.labels);
                    j.isFulfilled(this.done[i][k]) || (g = false)
                }
                if (g) {
                    if (!h) {
                        this.currentTask++;
                        this.highestTask = this.currentTask;
                        if (this.currentTask >= 2) {
                            sc.stats.addMap("quests",
                                "tasks", 1);
                            this.finalizeTask(b[this.currentTask - 2])
                        }
                    }
                } else h = true
            }
            if (this.currentTask > this.done.length - 1) {
                this.highestTask = this.currentTask = this.done.length;
                this.finalizeTask(b[this.currentTask - 1]);
                this.done.length >= 2 && this.finalizeTask(b[this.currentTask - 2]);
                this.finished = true;
                sc.stats.addMap("quests", "tasks", 1);
                !a && sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.FINISHED, this, true)
            }
        },
        updateState: function(a, b, d) {
            if (!(this.currentTask >= this.done.length)) {
                this.checkSubTask(a, b, this.currentTask) ? this.increaseTaskIndex() :
                    sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.UPDATE, this);
                if (d && this.currentTask > 0)
                    if (this.checkSubTask(a, b, this.currentTask - 1)) sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.UPDATE, this);
                    else {
                        a = this.quest.tasks[this.currentTask];
                        this.currentTask = this.currentTask - 1;
                        sc.stats.subMap("quests", "tasks", 1);
                        for (b = a.length; b--;) {
                            sc.stats.subMap("quests", "subtasks", 1);
                            sc.stats.subMap("quests", "subtasks" + a[b].type, 1)
                        }
                        sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_UNDONE, this)
                    }
            }
        },
        increaseTaskIndex: function() {
            if (this.currentTask >=
                this.done.length - 1) {
                this.highestTask = this.currentTask = this.done.length;
                this.finalizeTask(this.quest.tasks[this.currentTask - 1]);
                this.done.length >= 2 && this.finalizeTask(this.quest.tasks[this.currentTask - 2]);
                this.finished = true;
                sc.stats.addMap("quests", "tasks", 1);
                sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.FINISHED, this)
            } else {
                var a = this.highestTask != this.currentTask;
                this.currentTask++;
                this.highestTask = this.currentTask;
                this.currentTask >= 2 && this.finalizeTask(this.quest.tasks[this.currentTask - 2]);
                sc.stats.addMap("quests",
                    "tasks", 1);
                a || sc.menu.addLog({
                    type: "QUEST",
                    task: this.currentTask - 1,
                    quest: this.quest.id
                });
                sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_DONE, this);
                this.hasCollectSubtask(this.currentTask) && (this.checkSubTask("COLLECT", null, this.currentTask, true) || this.checkSubTask("LANDMARK", null, this.currentTask, true)) && this.increaseTaskIndex()
            }
            ig.game.varsChangedDeferred()
        },
        resetTaskIndex: function(a) {
            if (!(a >= this.currentTask)) {
                for (var b = this.currentTask; b > a;) {
                    b--;
                    for (var d = this.quest.tasks[b].subTasks, g = d.length; g--;) {
                        var h =
                            d[g];
                        h.reset && h.reset(this.getSubTaskData(g, b), this.labels);
                        sc.stats.subMap("quests", "subtasks", 1);
                        sc.stats.subMap("quests", "subtasks" + h.type, 1)
                    }
                    sc.stats.subMap("quests", "tasks", 1)
                }
                this.currentTask = b;
                sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_UNDONE, this)
            }
        },
        hasCollectSubtask: function(a) {
            return this.quest.tasks[a].containsCollect
        },
        skipPreviousTask: function() {
            return this.quest.tasks[Math.max(this.currentTask - 1, 0)].skipNotify
        },
        checkSubTask: function(a, b, d, g) {
            for (var d = Math.max(0, d), h = this.quest.tasks[d].subTasks,
                    i = h.length, j = null, k = this.labels, l = null, o = true; i--;) {
                j = h[i];
                l = this.getSubTaskData(i, d);
                j.type == a && j.updateState(l, b, k, g);
                j.isFulfilled(l) || (o = false)
            }
            return o
        },
        isSubTaskSolved: function(a) {
            var b = this.quest.tasks[this.currentTask].subTasks[a];
            return b ? b.isFulfilled(this.done[this.currentTask][a]) : false
        },
        getCurrentSubTaskValue: function(a, b) {
            var d = this.quest.tasks[this.currentTask].subTasks[a];
            return d ? d.getCurrentValue(this.done[this.currentTask][a], b) : 0
        },
        getCurrentTask: function() {
            return this.quest.tasks[this.currentTask]
        },
        getSubTaskData: function(a, b) {
            return this.done[b == void 0 ? this.currentTask : b][a]
        },
        isDone: function() {
            return this.currentTask >= this.done.length
        },
        getSaveData: function() {
            var a = {};
            a.id = this.quest.id;
            a.task = this.currentTask;
            a.highest = this.highestTask;
            a.finished = this.finished;
            a.completed = ig.copy(this.done);
            a.labels = ig.copy(this.labels);
            return a
        },
        setLoadData: function(a) {
            this.finished = a.finished || false;
            this.currentTask = a.task || 0;
            this.highestTask = a.highest;
            this.done = a.completed;
            var a = a.labels,
                b;
            for (b in a) this.labels[b] =
                a[b]
        }
    });
    sc.QUEST_MODEL_EVENT = {};
    sc.QUEST_MODEL_EVENT.ADDED = 0;
    sc.QUEST_MODEL_EVENT.UPDATE = 1;
    sc.QUEST_MODEL_EVENT.TASK_DONE = 2;
    sc.QUEST_MODEL_EVENT.TASK_UNDONE = 3;
    sc.QUEST_MODEL_EVENT.SUBTASK_DONE = 4;
    sc.QUEST_MODEL_EVENT.FINISHED = 5;
    sc.QUEST_MODEL_EVENT.POST_FINISHED = 6;
    sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED = 7;
    ig.addGameAddon(function() {
        return sc.quests = new sc.QuestModel
    })
});
ig.baked = !0;
