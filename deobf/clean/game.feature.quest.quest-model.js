/**
 * @module game.feature.quest.quest-model
 *
 * Quest tracking and management system. Loads all static quests from the
 * database, manages active and finished quests, tracks quest tasks and
 * subtasks, handles quest rewards (exp, money, CP, items), provides
 * quest list sorting and filtering, and supports marked/favorite quests.
 * Integrates with storage for save/load and with the combat listener
 * for enemy-kill-based quest objectives.
 */
ig.module("game.feature.quest.quest-model").requires("impact.base.game", "impact.base.loader", "impact.feature.database.database", "game.config", "game.feature.quest.quest-types", "game.feature.model.game-model", "game.feature.combat.combat", "game.feature.timers.timers-model").defines(function() {
    var notificationData = {quest: null, state: null};
    var combatData = {item: 0, amount: 0, enemy: null, quest: null};
    sc.QUEST_LIST_TYPE = {ACTIVE: 0, SOLVED: 1, ALL: 2};
    sc.QUEST_SORT_TYPE = {ACCEPTED: 0, ORDER: 1, NAME: 2, LEVEL: 3};
    var areaOrder = {"rookie-harbor": 0, "autumn-area": 1, "autumn-fall": 2, "bergen-trails": 3, bergen: 4, "heat-area": 5, "heat-village": 6, jungle: 7, "jungle-city": 8};
    sc.QuestModel = ig.GameAddon.extend({
        observers: [], staticQuests: {}, activeQuests: [], finishedQuests: {},
        focusQuest: -1, markedQuests: [], _activeQuestIndex: {}, _solvedQueue: [], _solvedTimer: 0,
        _hasSolveDialogs: false, _subQuest: [],
        init: function() {
            this.parent("Quests");
            this._loadStaticQuests();
            if (window.wm) {ig.database.register("quests", "QuestEnumEditor", "Quests"); ig.database.register("questHubs", "QuestHubList", "Quest Hubs")}
            ig.storage.register(this);
            ig.vars.registerVarAccessor("quest", this, "VarQuestEditor");
            ig.vars.registerVarAccessor("questHubs", this, "VarQuestHubEditor");
            sc.combat.addCombatListener(this);
            sc.Model.addObserver(sc.model.player, this)
        },
        getTotalQuestsSolved: function(asFraction, areaFilter, hubOnly, fallbackValue) {
            var solved = 0, total = 0, key;
            for (key in this.staticQuests)
                if (!(areaFilter && this.staticQuests[key].area != areaFilter) && (!hubOnly || this.staticQuests[key].hubSettings) && !this.staticQuests[key].noTrack && !this.staticQuests[key].extension) {this.finishedQuests[key] && solved++; total++}
            return total ? asFraction ? solved / total : solved : fallbackValue ? 1 : 0
        },
        getTotalHubQuestsSolved: function(area, result) {
            result = result || {total: 0, solved: 0};
            result.total = 0; result.solved = 0;
            for (var key in this.staticQuests) {
                var quest = this.staticQuests[key];
                if (area == quest.area && (quest.hubSettings && !quest.noTrack) && (!quest.extension || ig.extensions.hasExtension(quest.extension))) {this.finishedQuests[key] && result.solved++; result.total++}
            }
        },
        hasAreaQuests: function(area) {var quests = this.staticQuests, key; for (key in quests) if (quests[key].area == area) return true; return false},
        onPreUpdate: function() {
            if (sc.model.isOutOfCombatDialogReady())
                if (this._solvedQueue.length >= 1)
                    if (this._solvedTimer <= 0) {
                        var questId = this._solvedQueue.splice(0, 1)[0];
                        this._hasSolveDialogs = true;
                        var event = this.getQuestEvent(this.staticQuests[questId]);
                        sc.Cutscene.startCutscene(event);
                        this._solvedTimer = 0
                    } else this._solvedTimer = this._solvedTimer - ig.system.actualTick;
            else this._hasSolveDialogs = false
        },
        resetOrder: -1,
        onReset: function() {this.activeQuests.length = 0; this._activeQuestIndex = {}; this.focusQuest = -1; this._solvedTimer = this._solvedQueue.length = 0; this.finishedQuests = {}; this.markedQuests = []; sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED)},
        popInlineSolvedQuest: function() {
            if (this._solvedQueue.length >= 1) {this._hasSolveDialogs = true; ig.vars.set("tmp._questRewardsFinished", false); var questId = this._solvedQueue.splice(0, 1)[0]; this.getInlineQuestResolve(this.staticQuests[questId]); return true}
            return this._hasSolveDialogs = false
        },
        getInlineQuestResolve: function(quest) {var gui = ig.gui.createEventGui(null, "QuestSolvedDialog", {quest: quest}); ig.gui.spawnEventGui(gui)},
        getQuestEvent: function(quest) {return new ig.Event({steps: [{type: "WAIT", time: 0.2, ignoreSlowDown: true}, {type: "ADD_GUI", name: null, guiInfo: {type: "QuestSolvedDialog", settings: {quest: quest}}}, {type: "WAIT_UNTIL_TRUE", condition: "tmp._questRewardsFinished"}, {type: "WAIT", time: 0.1, ignoreSlowDown: true}]})},
        markQuest: function(questId) {
            if (this.isQuestSolved(questId)) {this.markedQuests.erase(questId); this.focusQuest = -1; sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E4)}
            else {this.markedQuests.indexOf(questId) == -1 ? this.markedQuests.push(questId) : this.markedQuests.erase(questId); this.focusQuest = -1; sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E4); this.sortIDList(this.markedQuests)}
        },
        isMarkedQuest: function(questId) {for (var idx = this.markedQuests.length; idx--;) if (questId == this.markedQuests[idx]) return true; return false},
        hasQuestSolvedDialogs: function() {return this._hasSolveDialogs},
        hasSolvedQuestsStacked: function() {return this._solvedQueue.length > 0},
        setFavQuestOld: function(index) {if (index < 0) return false; index == this.focusQuest && (index = -1); var prev = this.focusQuest; this.focusQuest = index; sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, prev); return true},
        cycleFavQuest: function(direction, silent) {
            if (this.markedQuests.length != 0) {var prev = this.focusQuest; direction = direction || 0; this.focusQuest = this.focusQuest + direction; if (direction >= 0) {if (this.focusQuest >= this.markedQuests.length) this.focusQuest = -1} else if (this.focusQuest == -2) this.focusQuest = this.markedQuests.length - 1; else if (this.focusQuest < 0) this.focusQuest = -1; if (this.focusQuest != -1 && this.isMarkedQuestDone()) {this.markedQuests.splice(this.focusQuest, 1); this.cycleFavQuest(direction, silent)} else silent || sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, prev)}
        },
        sendNotification: function(eventType, state, isInline) {eventType == sc.QUEST_MODEL_EVENT.FINISHED && this.setQuestFinished(state.quest, isInline); notificationData.state = state || null; notificationData.quest = state.quest || null; sc.Model.notifyObserver(this, eventType, notificationData)},
        createQuest: function(quest) {quest = new sc.Quest(quest); this._setCurrentLocationAndTime(quest); var state = new sc.QuestState(quest); notificationData.quest = quest; notificationData.state = state; this.activeQuests.push(state); sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.ADDED, notificationData); sc.commonEvents.triggerEvent("QUEST_ACCEPTED", {}); ig.game.varsChangedDeferred()},
        activateStaticQuest: function(questId, character, mapId) {
            var quest = this.staticQuests[questId];
            if (!quest) throw Error("Could not find quest with ID: " + questId);
            if (this._hasAlreadyFinished(quest)) throw Error("Static quest is already finished! Quest ID: " + questId);
            this._setCurrentLocationAndTime(quest, character, mapId);
            var state = new sc.QuestState(quest);
            if (!state.finished) {
                this.activeQuests.push(state);
                this._activeQuestIndex[questId] = this.activeQuests.length - 1;
                notificationData.quest = quest; notificationData.state = state;
                sc.stats.setMapMax("quests", "active", this.activeQuests.length);
                sc.menu.addLog({type: "QUEST", accept: true, quest: questId});
                sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.ADDED, notificationData);
                sc.commonEvents.triggerEvent("QUEST_ACCEPTED", {})
            }
            ig.game.varsChangedDeferred();
            return state
        },
        solveQuestCondition: function(questId, label) {
            for (var quest = this.staticQuests[questId], idx = this.activeQuests.length; idx--;) {
                var state = this.activeQuests[idx];
                if (state.quest == quest) {state.labels[label] = true; combatData.label = label; combatData.value = true; state.updateState("CONDITION", combatData); ig.game.varsChangedDeferred(); return}
            }
            throw Error("Tried to solve condition of quest that is not active");
        },
        updateQuestLocation: function(questId) {if (this.isQuestActive(questId)) {var quest = this.staticQuests[questId]; quest.location.area = sc.map.getCurrentPlayerAreaName(); quest.location.map = sc.map.getCurrentMapName(true)}},
        resetQuestTask: function(questId, taskIndex) {var idx = this._activeQuestIndex[questId]; if (idx != void 0) {this.activeQuests[idx].resetTaskIndex(taskIndex); ig.game.varsChangedDeferred()}},
        updateActiveQuests: function(type, data) {for (var idx = this.activeQuests.length; idx--;) this.activeQuests[idx].updateState(type, data); ig.game.varsChangedDeferred()},
        resolveActiveQuestChanges: function(type, data) {for (var idx = this.activeQuests.length; idx--;) this.activeQuests[idx].updateState(type, data, true); ig.game.varsChangedDeferred()},
        setQuestFinished: function(quest, isInline) {
            if (this.finishedQuests[quest.id]) throw Error("Static quest has already been finished! ID: " + quest.id);
            if (!isInline) {
                var idx = this._activeQuestIndex[quest.id];
                if (idx == void 0) {console.error("Quest with State %O is not an active quest and cannot be finished!", quest.id); return}
                this.activeQuests.splice(idx, 1);
                for (var key in this._activeQuestIndex) this._activeQuestIndex[key] >= idx && (this._activeQuestIndex[key] = this._activeQuestIndex[key] - 1)
            }
            sc.menu.addLog({type: "QUEST", finish: true, quest: quest.id});
            this._solvedQueue.push(quest.id);
            var markedQuest = this.getMarkedQuest();
            if (markedQuest && markedQuest.id == quest.id) this.focusQuest = -1;
            this.isMarkedQuest(quest.id) && this.markQuest(quest.id);
            if (quest.id) {this.finishedQuests[quest.id] = {solved: true}; isInline || delete this._activeQuestIndex[quest.id]}
            sc.stats.addMap("quests", "solved", 1);
            sc.stats.setMap("quests", "solvedTotal", this.getTotalQuestsSolved(true));
            ig.game.varsChangedDeferred();
            combatData.quest = quest.id; combatData.value = true;
            this.updateActiveQuests("QUEST", combatData)
        },
        finishUpQuest: function(quest) {this._collectRewards(quest); sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.POST_FINISHED, quest)},
        isQuestActive: function(questId) {return this._activeQuestIndex[questId] != void 0},
        isQuestSolved: function(questId) {return this.finishedQuests[questId]},
        isQuestLabelSolved: function(quest, label) {var state = this.getQuestState(quest); return state ? state.labels[label] : this.isQuestSolved(quest.id)},
        getQuestState: function(quest) {return this.activeQuests[this._activeQuestIndex[quest.id]]},
        getSubQuests: function(quest) {if (quest.tasks[0] && quest.tasks[0].subQuests) return quest.tasks[0].subQuests},
        getQuestTask: function(questId, taskIndex) {if (this.staticQuests[questId]) return this.staticQuests[questId].tasks[taskIndex]},
        getStaticQuest: function(questId) {return this.staticQuests[questId]},
        isTaskDone: function(quest, taskIndex) {var state = this.activeQuests[this._activeQuestIndex[quest.id]]; return state ? state.currentTask > taskIndex : this.finishedQuests[quest.id]},
        getCurrentTask: function(quest, returnHighest) {var state = this.activeQuests[this._activeQuestIndex[quest.id]]; if (state) return returnHighest ? state.highestTask : state.currentTask; if (this.finishedQuests[quest.id]) return quest.tasks.length - 1},
        getQuestName: function(questId) {return !this.staticQuests[questId] ? "NO QUEST" : this.staticQuests[questId].name},
        getQuestList: function(listType, sortType) {
            var result = [];
            if (listType == sc.QUEST_LIST_TYPE.ACTIVE || listType == sc.QUEST_LIST_TYPE.ALL)
                for (var idx = this.activeQuests.length; idx--;) result.push(this.activeQuests[idx].quest);
            if (listType == sc.QUEST_LIST_TYPE.SOLVED || listType == sc.QUEST_LIST_TYPE.ALL)
                for (var key in this.finishedQuests) result.push(this.staticQuests[key]);
            sortType != void 0 && this.sortQuestList(result, sortType);
            return result
        },
        sortIDList: function(list) {list.sort(function(a, b) {return this.staticQuests[b].timeStamp - this.staticQuests[a].timeStamp}.bind(this))},
        sortQuestList: function(list, sortType) {
            switch (sortType) {
                case sc.QUEST_SORT_TYPE.ACCEPTED: list.sort(function(a, b) {return b.timeStamp - a.timeStamp}); break;
                case sc.QUEST_SORT_TYPE.ORDER: list.sort(function(a, b) {var orderA = a.order + (areaOrder[a.area] || 0) * 1E5, orderB = b.order + (areaOrder[b.area] || 0) * 1E5; return orderA - orderB}); break;
                case sc.QUEST_SORT_TYPE.NAME: list.sort(function(a, b) {return a.name.toString().localeCompare(b.name.toString())}); break;
                case sc.QUEST_SORT_TYPE.LEVEL: list.sort(function(a, b) {return a.level != b.level ? a.level - b.level : b.timeStamp - a.timeStamp})
            }
        },
        getActiveQuestID: function(quest) {return this._activeQuestIndex[quest.id]},
        _sortOrder: function(a, b) {return a.order - b.order},
        getMarkedQuest: function() {return this.focusQuest < 0 ? null : this.staticQuests[this.markedQuests[this.focusQuest]]},
        getCurrentMarkedQuestTaskIndex: function() {return this.focusQuest < 0 ? null : this.activeQuests[this.getActiveQuestID(this.staticQuests[this.markedQuests[this.focusQuest]])].currentTask},
        isMarkedQuestDone: function() {if (!this.markedQuests[this.focusQuest]) return true; var state = this.activeQuests[this.getActiveQuestID(this.staticQuests[this.markedQuests[this.focusQuest]])]; return !state ? true : state.isDone()},
        isMarkedTaskDone: function(taskIndex) {return this.focusQuest < 0 ? false : this.activeQuests[this.focusQuest].currentTask > taskIndex},
        getMarkedTaskIndex: function(task) {for (var quest = this.activeQuests[this.focusQuest].quest, idx = quest.tasks.length; idx--;) if (quest.tasks[idx] == task) return idx},
        getSubTaskState: function(quest, taskIdx, subIdx) {return this.activeQuests[this._activeQuestIndex[quest.id]] ? this.activeQuests[this._activeQuestIndex[quest.id]].done[taskIdx][subIdx] : {}},
        isSubTaskDone: function(quest, taskIdx, subIdx) {return this.activeQuests[this._activeQuestIndex[quest.id]] ? quest.tasks[taskIdx].subTasks[subIdx].isFulfilled(this.activeQuests[this._activeQuestIndex[quest.id]].done[taskIdx][subIdx]) : false},
        onVarAccess: function(path, args) {
            if (args[0] == "quest") {
                var idx = this._activeQuestIndex[args[1]];
                if (idx != void 0 && idx >= 0) {
                    var state = this.activeQuests[idx];
                    if (state) switch (args[2]) {
                        case "started": return true; case "solved": return state.finished;
                        case "task": return state.currentTask == args[3] * 1; case "currentTask": return state.currentTask;
                        case "subtask": return state.isSubTaskSolved(args[3] * 1);
                        case "subvalue": return state.getCurrentSubTaskValue(args[3] * 1) + "";
                        case "subrequire": return state.getCurrentSubTaskValue(args[3] * 1, true) + "";
                        case "label": return state.labels[args[3]]
                    }
                } else if (this.finishedQuests[args[1]]) {var quest = this.staticQuests[args[1]]; switch (args[2]) {case "task": return quest.tasks.length == args[3] * 1; case "currentTask": return quest.tasks.length; default: return true}}
            }
        },
        onCombatEvent: function(entity, eventType) {if (eventType == sc.COMBAT_EVENT.DEFEATED) {combatData.enemy = entity.enemyName || null; combatData.amount = 1; this.updateActiveQuests("KILL", combatData)}},
        onLandmarkEvent: function(area) {if (area) {combatData.area = area; this.updateActiveQuests("LANDMARK", combatData)}},
        modelChanged: function(model, msg, data) {
            if (model == sc.model.player)
                if (msg == sc.PLAYER_MSG.ITEM_OBTAINED) {combatData.item = data.id; combatData.amount = data.amount; this.updateActiveQuests("COLLECT", combatData)}
                else if (msg == sc.PLAYER_MSG.ITEM_REMOVED) {combatData.item = data.id; combatData.amount = -data.amount; this.resolveActiveQuestChanges("COLLECT", combatData)}
                else if (msg == sc.PLAYER_MSG.ITEM_USED) {combatData.item = data; combatData.amount = -1; this.resolveActiveQuestChanges("COLLECT", combatData)}
                else if (msg == sc.PLAYER_MSG.EQUIP_CHANGE)
                    if (data.amount < 0) {combatData.item = data.id; combatData.amount = -1; this.resolveActiveQuestChanges("COLLECT", combatData)}
                    else if (data.amount > 0) {combatData.item = data.id; combatData.amount = 1; this.updateActiveQuests("COLLECT", combatData)}
        },
        _collectRewards: function(quest) {
            if (quest.rewards) {
                var player = sc.model.player, rewards = quest.rewards;
                if (rewards.exp) {var exp = player.addExperience(rewards.exp.exp, quest.level, rewards.exp.bonus, true, sc.LEVEL_CURVES.QUEST); sc.stats.addMap("quests", "exp", exp)}
                if (rewards.money) {player.addCredit(rewards.money); sc.stats.addMap("quests", "money", rewards.money || 0)}
                if (rewards.cp) {
                    var cpElem = rewards.cp.element;
                    if (cpElem == "ALL_ELEMENTS") {player.addSkillPoints(rewards.cp.amount, sc.ELEMENT.HEAT, false, true); player.addSkillPoints(rewards.cp.amount, sc.ELEMENT.COLD, false, true); player.addSkillPoints(rewards.cp.amount, sc.ELEMENT.SHOCK, false, true); player.addSkillPoints(rewards.cp.amount, sc.ELEMENT.WAVE, false, true); sc.stats.addMap("quest", "cp", rewards.cp.amount)}
                    else {player.addSkillPoints(rewards.cp.amount, cpElem == "ALL" ? -1 : sc.ELEMENT[cpElem], cpElem == "ALL", true); sc.stats.addMap("quest", "cp", rewards.cp.amount * (cpElem == "ALL" ? 5 : 1))}
                }
                if (rewards.items)
                    for (var idx = 0; idx < rewards.items.length; idx++) {player.addItem(rewards.items[idx].id, rewards.items[idx].amount, true); sc.stats.addMap("quests", "rewards", 1)}
            }
        },
        updateTimeStamp: function(quest, offset) {quest.timeStamp = sc.stats.getMap("player", "playtime") + offset},
        _setCurrentLocationAndTime: function(quest, character, mapId) {quest.location.area = sc.map.getCurrentPlayerAreaName(); quest.location.map = mapId ? sc.map.getMapName(mapId) : sc.map.getCurrentMapName(true); quest.timeStamp = sc.stats.getMap("player", "playtime"); quest.character = character || null},
        _hasAlreadyFinished: function(quest) {return this.finishedQuests[quest.id]},
        _loadStaticQuests: function() {this.staticQuests = {}; var data = ig.database.get("quests"), key; for (key in data) this.staticQuests[key] = new sc.Quest(data[key], key); ig.JSON_LOG && ig.log("%cDATABASE: %cLoaded Static Quests: \n%O", "color:orange", "", this.staticQuests)},
        onStorageSave: function(storageData) {
            var saveObj = {};
            saveObj.focusQuest = this.focusQuest;
            saveObj.markedQuests = ig.copy(this.markedQuests);
            saveObj.finished = ig.copy(this.finishedQuests);
            saveObj.solvedQueue = ig.copy(this._solvedQueue);
            var localeData = {}, quest = null, key;
            for (key in this.staticQuests) {quest = this.staticQuests[key]; quest.timeStamp > 0 && (localeData[key] = {time: quest.timeStamp, location: {area: quest.location.area.data, map: quest.location.map.data}, character: quest.character})}
            saveObj.locale = localeData;
            var states = [], len = this.activeQuests.length, state = null;
            for (key = null; len--;) {state = this.activeQuests[len]; states[len] = state.getSaveData()}
            saveObj.states = states;
            storageData.quests = saveObj
        },
        onStoragePreLoad: function(storageData) {
            var saveData = storageData.quests || {};
            this.focusQuest = saveData.focusQuest == void 0 ? -1 : saveData.focusQuest;
            this.markedQuests = saveData.markedQuests || [];
            if (this.markedQuests.length == 0) this.focusQuest = -1;
            else for (var idx = 0; idx < this.markedQuests.length; idx++) if (!this.staticQuests[this.markedQuests[idx]]) {this.markedQuests.length = 0; this.focusQuest = -1}
            this._solvedQueue = saveData.solvedQueue || [];
            this._solvedTimer = 0;
            var quest = null, localeData = saveData.locale, key;
            for (key in localeData)
                if (this.staticQuests[key]) {quest = this.staticQuests[key]; quest.location.area = new ig.LangLabel(localeData[key].location.area || "???"); quest.location.map = new ig.LangLabel(localeData[key].location.map || "???"); quest.timeStamp = localeData[key].time; quest.character = localeData[key].character ? localeData[key].character : null}
            this.finishedQuests = saveData.finished || {};
            var states = saveData.states || [];
            this._activeQuestIndex = {};
            this.activeQuests.length = 0;
            var state = null, needsUpdate = false, updatedQuests = [], idx2 = 0;
            for (idx2 = 0; idx2 < states.length; ++idx2) {
                var entry = states[idx2];
                quest = this.staticQuests[states[idx2].id];
                if (quest) {
                    if (quest.tasks.length != entry.completed.length) {needsUpdate = true; state = new sc.QuestState(quest); updatedQuests.push(quest)}
                    else {state = new sc.QuestState(quest, true); state.setLoadData(entry)}
                    if (!state.finished) {this._activeQuestIndex[quest.id] = this.activeQuests.length; this.activeQuests.push(state)}
                } else needsUpdate = true
            }
            if (!this.activeQuests[this.focusQuest]) this.focusQuest = -1;
            for (key in this.finishedQuests) this.staticQuests[key] || delete this.finishedQuests[key];
            if (needsUpdate) {for (idx2 = updatedQuests.length; idx2--;) this.checkIfSubQuests(updatedQuests[idx2]); ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.questUpdate"))}
            sc.stats.setMap("quests", "solvedTotal", this.getTotalQuestsSolved(true));
            sc.Model.notifyObserver(this, sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED, -1E5)
        },
        checkIfSubQuests: function(quest) {if (quest = quest.tasks[0].subQuests) for (var idx = quest.length; idx--;) if (this.isQuestSolved(quest[idx])) {combatData.quest = quest[idx]; combatData.value = true; this.updateActiveQuests("QUEST", combatData)}}
    });
    sc.QuestState = ig.Class.extend({
        quest: null, done: [], currentTask: 0, highestTask: 0, finished: false, labels: {},
        init: function(quest, skipInit) {this.quest = quest; !skipInit && this.initState()},
        finalizeTask: function(task) {var subtasks = task.subTasks; for (var idx = subtasks.length; idx--;) {subtasks[idx].finalize && subtasks[idx].finalize(); sc.stats.addMap("quests", "subtasks", 1); sc.stats.addMap("quests", "subtasks" + subtasks[idx].type, 1)}},
        initState: function(skipFinishNotify) {
            var tasks = this.quest.tasks, subtask = null;
            for (var key in this.labels) this.labels[key] = false;
            this.done.length = 0;
            subtask = null;
            var anyBlocked = false;
            for (var taskIdx = 0; taskIdx < tasks.length; taskIdx++) {
                var subtasks = tasks[taskIdx].subTasks;
                this.done[taskIdx] = [];
                var allFulfilled = true;
                for (var subIdx = 0; subIdx < subtasks.length; subIdx++) {
                    var sub = subtasks[subIdx];
                    this.done[taskIdx][subIdx] = {};
                    sub.initState(this.done[taskIdx][subIdx], this.labels);
                    sub.isFulfilled(this.done[taskIdx][subIdx]) || (allFulfilled = false)
                }
                if (allFulfilled) {
                    if (!anyBlocked) {this.currentTask++; this.highestTask = this.currentTask; if (this.currentTask >= 2) {sc.stats.addMap("quests", "tasks", 1); this.finalizeTask(tasks[this.currentTask - 2])}}
                } else anyBlocked = true
            }
            if (this.currentTask > this.done.length - 1) {this.highestTask = this.currentTask = this.done.length; this.finalizeTask(tasks[this.currentTask - 1]); this.done.length >= 2 && this.finalizeTask(tasks[this.currentTask - 2]); this.finished = true; sc.stats.addMap("quests", "tasks", 1); !skipFinishNotify && sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.FINISHED, this, true)}
        },
        updateState: function(type, data, resolve) {
            if (!(this.currentTask >= this.done.length)) {this.checkSubTask(type, data, this.currentTask) ? this.increaseTaskIndex() : sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.UPDATE, this); if (resolve && this.currentTask > 0) if (this.checkSubTask(type, data, this.currentTask - 1)) sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.UPDATE, this); else {var task = this.quest.tasks[this.currentTask]; this.currentTask = this.currentTask - 1; sc.stats.subMap("quests", "tasks", 1); for (var idx = task.length; idx--;) {sc.stats.subMap("quests", "subtasks", 1); sc.stats.subMap("quests", "subtasks" + task[idx].type, 1)} sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_UNDONE, this)}}
        },
        increaseTaskIndex: function() {
            if (this.currentTask >= this.done.length - 1) {this.highestTask = this.currentTask = this.done.length; this.finalizeTask(this.quest.tasks[this.currentTask - 1]); this.done.length >= 2 && this.finalizeTask(this.quest.tasks[this.currentTask - 2]); this.finished = true; sc.stats.addMap("quests", "tasks", 1); sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.FINISHED, this)}
            else {var wasHighest = this.highestTask != this.currentTask; this.currentTask++; this.highestTask = this.currentTask; this.currentTask >= 2 && this.finalizeTask(this.quest.tasks[this.currentTask - 2]); sc.stats.addMap("quests", "tasks", 1); wasHighest || sc.menu.addLog({type: "QUEST", task: this.currentTask - 1, quest: this.quest.id}); sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_DONE, this); this.hasCollectSubtask(this.currentTask) && (this.checkSubTask("COLLECT", null, this.currentTask, true) || this.checkSubTask("LANDMARK", null, this.currentTask, true)) && this.increaseTaskIndex()}
            ig.game.varsChangedDeferred()
        },
        resetTaskIndex: function(targetTask) {
            if (!(targetTask >= this.currentTask)) {for (var idx = this.currentTask; idx > targetTask;) {idx--; for (var subtasks = this.quest.tasks[idx].subTasks, subIdx = subtasks.length; subIdx--;) {var sub = subtasks[subIdx]; sub.reset && sub.reset(this.getSubTaskData(subIdx, idx), this.labels); sc.stats.subMap("quests", "subtasks", 1); sc.stats.subMap("quests", "subtasks" + sub.type, 1)} sc.stats.subMap("quests", "tasks", 1)} this.currentTask = idx; sc.quests.sendNotification(sc.QUEST_MODEL_EVENT.TASK_UNDONE, this)}
        },
        hasCollectSubtask: function(taskIdx) {return this.quest.tasks[taskIdx].containsCollect},
        skipPreviousTask: function() {return this.quest.tasks[Math.max(this.currentTask - 1, 0)].skipNotify},
        checkSubTask: function(type, data, taskIdx, forceRecheck) {
            taskIdx = Math.max(0, taskIdx);
            var subtasks = this.quest.tasks[taskIdx].subTasks, len = subtasks.length, sub = null, labels = this.labels, subData = null, allFulfilled = true;
            for (; len--;) {sub = subtasks[len]; subData = this.getSubTaskData(len, taskIdx); sub.type == type && sub.updateState(subData, data, labels, forceRecheck); sub.isFulfilled(subData) || (allFulfilled = false)}
            return allFulfilled
        },
        isSubTaskSolved: function(subIdx) {var sub = this.quest.tasks[this.currentTask].subTasks[subIdx]; return sub ? sub.isFulfilled(this.done[this.currentTask][subIdx]) : false},
        getCurrentSubTaskValue: function(subIdx, asRemaining) {var sub = this.quest.tasks[this.currentTask].subTasks[subIdx]; return sub ? sub.getCurrentValue(this.done[this.currentTask][subIdx], asRemaining) : 0},
        getCurrentTask: function() {return this.quest.tasks[this.currentTask]},
        getSubTaskData: function(subIdx, taskIdx) {return this.done[taskIdx == void 0 ? this.currentTask : taskIdx][subIdx]},
        isDone: function() {return this.currentTask >= this.done.length},
        getSaveData: function() {var data = {}; data.id = this.quest.id; data.task = this.currentTask; data.highest = this.highestTask; data.finished = this.finished; data.completed = ig.copy(this.done); data.labels = ig.copy(this.labels); return data},
        setLoadData: function(data) {this.finished = data.finished || false; this.currentTask = data.task || 0; this.highestTask = data.highest; this.done = data.completed; var labels = data.labels, key; for (key in labels) this.labels[key] = labels[key]}
    });
    sc.QUEST_MODEL_EVENT = {};
    sc.QUEST_MODEL_EVENT.ADDED = 0; sc.QUEST_MODEL_EVENT.UPDATE = 1; sc.QUEST_MODEL_EVENT.TASK_DONE = 2;
    sc.QUEST_MODEL_EVENT.TASK_UNDONE = 3; sc.QUEST_MODEL_EVENT.SUBTASK_DONE = 4; sc.QUEST_MODEL_EVENT.FINISHED = 5;
    sc.QUEST_MODEL_EVENT.POST_FINISHED = 6; sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED = 7;
    ig.addGameAddon(function() {return sc.quests = new sc.QuestModel})
});
ig.baked = !0;