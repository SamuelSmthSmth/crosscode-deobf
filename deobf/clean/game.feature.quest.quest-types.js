/**
 * @module game.feature.quest.quest-types
 *
 * Quest and task data structures. Defines the Quest class (with
 * name, level, description, tasks, rewards, area, hub settings),
 * QuestTask (container for subtasks), and all QuestSubTaskBase
 * subtypes: COLLECT (items), KILL (enemies), CONDITION (labels),
 * QUEST (sub-quests), and LANDMARK (discovery).
 */
ig.module("game.feature.quest.quest-types").defines(function() {
    sc.QuestSubTaskBase = ig.Class.extend({
        type: null,
        init: function(config) {this.type = config.type || "THROWS_ERROR"}
    });
    sc.QUEST_SUB_TASK = {};
    sc.QUEST_SUB_TASK.COLLECT = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({attributes: {
            item: {_type: "Item", _info: "The item to collect."},
            amount: {_type: "Number", _info: "the amount you need to collect.", _default: 1},
            keepItems: {_type: "Boolean", _info: "True if the player can keep the items", _default: "false"},
            hideName: {_type: "Boolean", _optional: true, _default: "true", _info: "True if the name should be hidden until at least one of the item has been found or the sub task is finished"},
            hideMax: {_type: "Boolean", _optional: true, _default: "true", _info: "True if the max number should be hidden until the subtask is solved."}
        }}),
        item: 0, amount: 0, keepItems: false, hideName: false, hideMax: false,
        init: function(config) {
            this.parent(config);
            this.item = config.item; this.amount = config.amount; this.keepItems = config.keepItems;
            this.hideName = config.hideName || false; this.hideMax = config.hideMax || false
        },
        initState: function(data) {data.collected = sc.model.player.getItemAmount(this.item)},
        updateState: function(data, eventData, labels, forceRecheck) {
            if (forceRecheck || eventData.item == this.item) data.collected = sc.model.player.getItemAmount(this.item)
        },
        getCurrentValue: function(data, asRemaining) {return asRemaining ? this.amount - data.collected : data.collected},
        finalize: function() {this.keepItems || sc.model.player.removeItem(this.item, this.amount, false, true)},
        isFulfilled: function(data) {return data.collected >= this.amount},
        reset: function() {}
    });
    sc.QUEST_SUB_TASK.KILL = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({attributes: {enemy: {_type: "EnemyName", _info: "The enemy you need to defeat"}, amount: {_type: "Number", _info: "the amount you need to defeat.", _default: 1}}}),
        enemy: 0, amount: 0,
        init: function(config) {this.parent(config); this.enemy = config.enemy; this.amount = config.amount},
        initState: function(data) {data.killed = 0},
        updateState: function(data, eventData) {eventData.enemy == this.enemy && (data.killed = data.killed + eventData.amount)},
        getCurrentValue: function(data, asRemaining) {return asRemaining ? this.amount - data.killed : data.killed},
        isFulfilled: function(data) {return data.killed >= this.amount},
        reset: function(data) {ig.debug("RESTORE [KILL]: enemy:" + this.enemy + ", amount: " + this.amount); data.killed = 0}
    });
    sc.QUEST_SUB_TASK.CONDITION = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({attributes: {label: {_type: "String", _info: "The label inside the quest that will be set to true"}, text: {_type: "LangLabel", _info: "The text that should be displayed as subtask", _optional: true}, shortText: {_type: "LangLabel", _info: "short version for minified GUI", _optional: true}}, label: function() {return "<b>CONDITION</b>  <code>label:" + this.label + (this.text ? " text: <i style='color: orange'>" + wmPrint("LangLabel", this.text) + "</i>" : "")}}),
        text: null, short: null, label: null,
        init: function(config) {
            this.parent(config);
            this.text = config.text ? new ig.LangLabel(config.text) : "";
            this.short = config.shortText ? new ig.LangLabel(config.shortText) : null;
            this.label = config.label || null
        },
        initState: function(data) {data.active = false},
        updateState: function(data, eventData, labels) {
            if (this.label == eventData.label) {data.active = eventData.value; data.active && (labels[this.label] = true)}
        },
        getCurrentValue: function(data, asRemaining) {return asRemaining ? false : data.active},
        isFulfilled: function(data) {return data.active},
        reset: function(data, labels) {ig.debug("RESTORE [CONDITION]: label:" + this.label); data.active = false; labels[this.label] = false}
    });
    sc.QUEST_SUB_TASK.QUEST = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({attributes: {quest: {_type: "SubQuestSelect", _info: "Quest to solve. Select parent quest first."}, text: {_type: "LangLabel", _info: "The text that should be displayed as subtask", _optional: true}, shortText: {_type: "LangLabel", _info: "short version for minified GUI", _optional: true}}, label: function() {return "<b>QUEST</b>  <code>quest:" + this.quest + (this.text ? " text: <i style='color: orange'>" + wmPrint("LangLabel", this.text) + "</i>" : "")}}),
        quest: null, text: null, short: null,
        init: function(config) {this.parent(config); this.quest = config.quest || null; this.text = config.text ? new ig.LangLabel(config.text) : ""; this.short = config.shortText ? new ig.LangLabel(config.shortText) : null},
        initState: function(data) {data.active = false},
        updateState: function(data, eventData, labels, forceRecheck) {
            if (forceRecheck) {data.active = sc.quests.isQuestSolved(this.quest); ig.debug("SubQuest done after prev task finished: " + this.quest + " | state: " + data.active)}
            else this.quest == eventData.quest && (data.active = eventData.value)
        },
        getCurrentValue: function(data, asRemaining) {return asRemaining ? false : data.active},
        isFulfilled: function(data) {return data.active}
    });
    sc.QUEST_SUB_TASK.LANDMARK = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({attributes: {area: {_type: "Select", _info: "The item to check", _select: "areas"}, amount: {_type: "Number", _info: "the amount you need to unlock.", _default: 1}}}),
        area: 0, amount: 0,
        init: function(config) {this.parent(config); this.area = config.area; this.amount = config.amount},
        initState: function(data) {data.unlocked = sc.map.getTotalLandmarksFoundInArea(this.area)},
        updateState: function(data, eventData, labels, forceRecheck) {
            if (forceRecheck || eventData.area == this.area) data.unlocked = sc.map.getTotalLandmarksFoundInArea(this.area)
        },
        getCurrentValue: function(data, asRemaining) {return asRemaining ? this.amount - data.unlocked : data.unlocked},
        isFulfilled: function(data) {return data.unlocked >= this.amount}
    });
    sc.QuestTask = ig.Class.extend({
        task: "", subTasks: [], containsCollect: false, subQuests: null, skipNotify: false,
        init: function(config, parentQuest) {
            this.task = new ig.LangLabel(config.task);
            this.subTasks = [];
            this.skipNotify = config.skipNotify || false;
            for (var subtasks = config.subtasks, idx = 0; idx < subtasks.length; idx++) {
                var sub = new sc.QUEST_SUB_TASK[subtasks[idx].type](subtasks[idx]);
                if (sub.type == "CONDITION") parentQuest.labelList.push(sub.label);
                else if (sub.type == "COLLECT" || sub.type == "LANDMARK") this.containsCollect = true;
                else if (sub.type == "QUEST") {if (!this.subQuests) this.subQuests = []; this.subQuests.push(sub.quest)}
                this.subTasks.push(sub)
            }
        }
    });
    sc.Quest = ig.Class.extend({
        name: "", level: 1, order: 0, description: "", endDescription: "", tasks: null, rewards: null, id: null,
        person: null, personAfter: null, labelList: [], hideRewards: false, area: null, noTrack: false,
        extension: false, parentQuest: null, elite: false, mandatory: false, hubSettings: null,
        location: {area: "", map: ""}, timeStamp: 0, character: null,
        init: function(config, id) {
            this.level = config.level || 1;
            this.name = new ig.LangLabel(config.name);
            this.description = new ig.LangLabel(config.description);
            this.endDescription = new ig.LangLabel(config.briefing);
            this.rewards = config.rewards || {};
            this.id = id || null;
            this.noTrack = config.noTrack || false;
            this.extension = config.extension || false;
            this.order = config.order || -1;
            this.person = new ig.LangLabel(config.person || "???");
            this.hideRewards = config.hideRewards || false;
            this.area = config.area || null;
            this.parentQuest = config.parent || null;
            this.elite = config.elite || null;
            this.mandatory = config.mandatory || false;
            this.hubSettings = config.hubSettings || null;
            if (config.hubSettings) this.hubSettings = {character: config.hubSettings.character || null, hideChar: config.hubSettings.hideChar || false, location: new ig.LangLabel(config.hubSettings.location || "???"), condition: config.hubSettings.condition || ""};
            if (config.personAfter) this.personAfter = new ig.LangLabel(config.personAfter || "???");
            this.tasks = [];
            for (var tasks = config.tasks, idx = 0; idx < tasks.length; idx++) {
                this.tasks.push(new sc.QuestTask(tasks[idx], this));
                if (idx > 0 && this.tasks[idx].subQuests) throw Error("Sub Quest found in " + idx + " task. Can only be in first task!");
            }
        }
    })
});
ig.baked = !0;