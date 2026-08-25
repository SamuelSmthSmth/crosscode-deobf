ig.module("game.feature.quest.quest-types").defines(function() {
    sc.QuestSubTaskBase = ig.Class.extend({
        type: null,
        init: function(b) {
            this.type = b.type || "THROWS_ERROR"
        }
    });
    sc.QUEST_SUB_TASK = {};
    sc.QUEST_SUB_TASK.COLLECT = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({
            attributes: {
                item: {
                    _type: "Item",
                    _info: "The item to collect."
                },
                amount: {
                    _type: "Number",
                    _info: "the amount you need to collect.",
                    _default: 1
                },
                keepItems: {
                    _type: "Boolean",
                    _info: "True if the player can keep the items",
                    _default: "false"
                },
                hideName: {
                    _type: "Boolean",
                    _optional: true,
                    _default: "true",
                    _info: "True if the name should be hidden until at least one of the item has been found or the sub task is finished"
                },
                hideMax: {
                    _type: "Boolean",
                    _optional: true,
                    _default: "true",
                    _info: "True if the max number should be hidden until the subtask is solved."
                }
            }
        }),
        item: 0,
        amount: 0,
        keepItems: false,
        hideName: false,
        hideMax: false,
        init: function(b) {
            this.parent(b);
            this.item = b.item;
            this.amount = b.amount;
            this.keepItems = b.keepItems;
            this.hideName = b.hideName || false;
            this.hideMax = b.hideMax || false
        },
        initState: function(b) {
            b.collected = sc.model.player.getItemAmount(this.item)
        },
        updateState: function(b, a, d, c) {
            if (c || a.item == this.item) b.collected = sc.model.player.getItemAmount(this.item)
        },
        getCurrentValue: function(b, a) {
            return a ? this.amount - b.collected : b.collected
        },
        finalize: function() {
            this.keepItems || sc.model.player.removeItem(this.item, this.amount, false, true)
        },
        isFulfilled: function(b) {
            return b.collected >= this.amount
        },
        reset: function() {}
    });
    sc.QUEST_SUB_TASK.KILL = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "EnemyName",
                    _info: "The enemy you need to defeat"
                },
                amount: {
                    _type: "Number",
                    _info: "the amount you need to defeat.",
                    _default: 1
                }
            }
        }),
        enemy: 0,
        amount: 0,
        init: function(b) {
            this.parent(b);
            this.enemy = b.enemy;
            this.amount = b.amount
        },
        initState: function(b) {
            b.killed = 0
        },
        updateState: function(b, a) {
            a.enemy == this.enemy && (b.killed = b.killed + a.amount)
        },
        getCurrentValue: function(b, a) {
            return a ? this.amount - b.killed : b.killed
        },
        isFulfilled: function(b) {
            return b.killed >= this.amount
        },
        reset: function(b) {
            ig.debug("RESTORE [KILL]: enemy:" + this.enemy +
                ", amount: " + this.amount);
            b.killed = 0
        }
    });
    sc.QUEST_SUB_TASK.CONDITION = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({
            attributes: {
                label: {
                    _type: "String",
                    _info: "The label inside the quest that will be set to true"
                },
                text: {
                    _type: "LangLabel",
                    _info: "The text that should be displayed as subtask",
                    _optional: true
                },
                shortText: {
                    _type: "LangLabel",
                    _info: "short version for minified GUI",
                    _optional: true
                }
            },
            label: function() {
                return "<b>CONDITION</b>  <code>label:" + this.label + (this.text ? " text: <i style='color: orange'>" +
                    wmPrint("LangLabel", this.text) + "</i>" : "")
            }
        }),
        text: null,
        "short": null,
        label: null,
        init: function(b) {
            this.parent(b);
            this.text = b.text ? new ig.LangLabel(b.text) : "";
            this.short = b.shortText ? new ig.LangLabel(b.shortText) : null;
            this.label = b.label || null
        },
        initState: function(b) {
            b.active = false
        },
        updateState: function(b, a, d) {
            if (this.label == a.label) {
                b.active = a.value;
                b.active && (d[this.label] = true)
            }
        },
        getCurrentValue: function(b, a) {
            return a ? false : b.active
        },
        isFulfilled: function(b) {
            return b.active
        },
        reset: function(b, a) {
            ig.debug("RESTORE [CONDITION]: label:" +
                this.label);
            b.active = false;
            a[this.label] = false
        }
    });
    sc.QUEST_SUB_TASK.QUEST = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "SubQuestSelect",
                    _info: "Quest to solve. Select parent quest first."
                },
                text: {
                    _type: "LangLabel",
                    _info: "The text that should be displayed as subtask",
                    _optional: true
                },
                shortText: {
                    _type: "LangLabel",
                    _info: "short version for minified GUI",
                    _optional: true
                }
            },
            label: function() {
                return "<b>QUEST</b>  <code>quest:" + this.quest + (this.text ? " text: <i style='color: orange'>" +
                    wmPrint("LangLabel", this.text) + "</i>" : "")
            }
        }),
        quest: null,
        text: null,
        "short": null,
        init: function(b) {
            this.parent(b);
            this.quest = b.quest || null;
            this.text = b.text ? new ig.LangLabel(b.text) : "";
            this.short = b.shortText ? new ig.LangLabel(b.shortText) : null
        },
        initState: function(b) {
            b.active = false
        },
        updateState: function(b, a, d, c) {
            if (c) {
                b.active = sc.quests.isQuestSolved(this.quest);
                ig.debug("SubQuest done after prev task finished: " + this.quest + " | state: " + b.active)
            } else this.quest == a.quest && (b.active = a.value)
        },
        getCurrentValue: function(b,
            a) {
            return a ? false : b.active
        },
        isFulfilled: function(b) {
            return b.active
        }
    });
    sc.QUEST_SUB_TASK.LANDMARK = sc.QuestSubTaskBase.extend({
        _wm: new ig.Config({
            attributes: {
                area: {
                    _type: "Select",
                    _info: "The item to check",
                    _select: "areas"
                },
                amount: {
                    _type: "Number",
                    _info: "the amount you need to unlock.",
                    _default: 1
                }
            }
        }),
        area: 0,
        amount: 0,
        init: function(b) {
            this.parent(b);
            this.area = b.area;
            this.amount = b.amount
        },
        initState: function(b) {
            b.unlocked = sc.map.getTotalLandmarksFoundInArea(this.area)
        },
        updateState: function(b, a, d, c) {
            if (c ||
                a.area == this.area) b.unlocked = sc.map.getTotalLandmarksFoundInArea(this.area)
        },
        getCurrentValue: function(b, a) {
            return a ? this.amount - b.unlocked : b.unlocked
        },
        isFulfilled: function(b) {
            return b.unlocked >= this.amount
        }
    });
    sc.QuestTask = ig.Class.extend({
        task: "",
        subTasks: [],
        containsCollect: false,
        subQuests: null,
        skipNotify: false,
        init: function(b, a) {
            this.task = new ig.LangLabel(b.task);
            this.subTasks = [];
            this.skipNotify = b.skipNotify || false;
            for (var d = b.subtasks, c = 0; c < d.length; c++) {
                var e = new sc.QUEST_SUB_TASK[d[c].type](d[c]);
                if (e.type == "CONDITION") a.labelList.push(e.label);
                else if (e.type == "COLLECT" || e.type == "LANDMARK") this.containsCollect = true;
                else if (e.type == "QUEST") {
                    if (!this.subQuests) this.subQuests = [];
                    this.subQuests.push(e.quest)
                }
                this.subTasks.push(e)
            }
        }
    });
    sc.Quest = ig.Class.extend({
        name: "",
        level: 1,
        order: 0,
        description: "",
        endDescription: "",
        tasks: null,
        rewards: null,
        id: null,
        person: null,
        personAfter: null,
        labelList: [],
        hideRewards: false,
        area: null,
        noTrack: false,
        extension: false,
        parentQuest: null,
        elite: false,
        mandatory: false,
        hubSettings: null,
        location: {
            area: "",
            map: ""
        },
        timeStamp: 0,
        character: null,
        init: function(b, a) {
            this.level = b.level || 1;
            this.name = new ig.LangLabel(b.name);
            this.description = new ig.LangLabel(b.description);
            this.endDescription = new ig.LangLabel(b.briefing);
            this.rewards = b.rewards || {};
            this.id = a || null;
            this.noTrack = b.noTrack || false;
            this.extension = b.extension || false;
            this.order = b.order || -1;
            this.person = new ig.LangLabel(b.person || "???");
            this.hideRewards = b.hideRewards || false;
            this.area = b.area || null;
            this.parentQuest = b.parent || null;
            this.elite =
                b.elite || null;
            this.mandatory = b.mandatory || false;
            this.hubSettings = b.hubSettings || null;
            if (b.hubSettings) this.hubSettings = {
                character: b.hubSettings.character || null,
                hideChar: b.hubSettings.hideChar || false,
                location: new ig.LangLabel(b.hubSettings.location || "???"),
                condition: b.hubSettings.condition || ""
            };
            if (b.personAfter) this.personAfter = new ig.LangLabel(b.personAfter || "???");
            this.tasks = [];
            for (var d = b.tasks, c = 0; c < d.length; c++) {
                this.tasks.push(new sc.QuestTask(d[c], this));
                if (c > 0 && this.tasks[c].subQuests) throw Error("Sub Quest found in" +
                    c + " task. Can only be in first task!");
            }
        }
    })
});
ig.baked = !0;
