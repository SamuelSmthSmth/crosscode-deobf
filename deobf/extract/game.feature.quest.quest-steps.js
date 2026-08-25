ig.module("game.feature.quest.quest-steps").requires("impact.base.action", "impact.base.entity", "impact.base.event", "game.feature.quest.quest-model", "game.feature.menu.gui.quests.quest-misc").defines(function() {
    ig.EVENT_STEP.CREATE_QUEST = ig.EventStepBase.extend({
        settings: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "LangLabel",
                    _info: "Name of the quest",
                    _compact: true
                },
                level: {
                    _type: "Number",
                    _info: "Level of the quest"
                },
                description: {
                    _type: "LangLabel",
                    _info: "Starting description text",
                    _large: true,
                    _compact: true,
                    _height: 70
                },
                briefing: {
                    _type: "LangLabel",
                    _info: "Ending description text",
                    _large: true,
                    _compact: true,
                    _height: 70
                },
                rewards: {
                    _type: "QuestRewards",
                    _info: "The rewards the player gets for completing the quest.",
                    _popup: true
                },
                tasks: {
                    _type: "QuestTaskList",
                    _info: "The tasks to complete"
                }
            },
            label: function() {
                return "<b style='color: limegreen'>CREATE QUEST</b> name: <i>" + new ig.LangLabel(this.name) + "</i>, description: <i>" + new ig.LangLabel(this.description) + "</i>, tasks: <i>" + (this.tasks ? this.tasks.length : 0) + "</i>"
            }
        }),
        init: function(b) {
            this.settings = b
        },
        start: function() {
            sc.quests.createQuest(this.settings)
        }
    });
    ig.EVENT_STEP.START_STATIC_QUEST = ig.EventStepBase.extend({
        quest: null,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "QuestNameSelect",
                    _info: "The quest to start"
                }
            },
            label: function() {
                return "<b style='color: limegreen'> START STATIC QUEST </b> <i>" + this.quest + "</i>"
            }
        }),
        init: function(b) {
            this.quest = b.quest || ""
        },
        start: function() {
            sc.quests.activateStaticQuest(this.quest)
        }
    });
    ig.EVENT_STEP.SOLVE_QUEST_CONDITION = ig.EventStepBase.extend({
        questId: null,
        label: null,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "QuestLabelSelect",
                    _info: "The label to set to active"
                }
            },
            label: function() {
                return "<b style='color: limegreen'> SOLVE QUEST CONDITION </b> <i>" + wmPrint("QuestLabelSelect", this.quest) + "</i>"
            }
        }),
        init: function(b) {
            this.questId = b.quest.quest;
            this.label = b.quest.label || null
        },
        start: function() {
            sc.quests.solveQuestCondition(this.questId, this.label)
        }
    });
    ig.EVENT_STEP.UPDATE_QUEST_LOCATION = ig.EventStepBase.extend({
        questId: null,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "Quest",
                    _info: "the quest to update. ONLY WORKS IF QUEST IS ACTIVE!"
                }
            },
            label: function() {
                return "<b style='color: limegreen'> UPDATE QUEST LOCATION </b> <i>" + this.quest + "</i>"
            }
        }),
        init: function(b) {
            this.questId = b.quest
        },
        start: function() {
            console.log(this.questId);
            sc.quests.updateQuestLocation(this.questId)
        }
    });
    ig.EVENT_STEP.RESET_QUEST_TASK = ig.EventStepBase.extend({
        quest: null,
        index: -1,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "Quest",
                    _info: "The quest on which the index should be reset",
                    _context: "Quest"
                },
                task: {
                    _type: "TaskIndex",
                    _info: "The quest task to reset to"
                }
            }
        }),
        init: function(b) {
            this.quest = b.quest || null;
            this.index = b.task == void 0 ? -1 : b.task
        },
        start: function() {
            this.index == void 0 || this.index < 0 || sc.quests.resetQuestTask(this.quest, this.index)
        }
    });
    ig.EVENT_STEP.OPEN_QUEST_DIALOG = ig.EventStepBase.extend({
        quest: null,
        acceptVar: null,
        npc: null,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "Quest",
                    _info: "The quest to open",
                    _ignoreSubs: true
                },
                npc: {
                    _type: "Character",
                    _info: "Character to use as quest giver, override default and can be used in event triggers.",
                    _optional: true
                },
                map: {
                    _type: "Maps",
                    _info: "Map to show instead of the automated one",
                    _optional: true
                }
            },
            branchLabel: function(b) {
                switch (b) {
                    case "accepted":
                        return "on accept";
                    case "declined":
                        return "on decline";
                    case "_end":
                        return "end quest dialog"
                }
                return "???"
            }
        }),
        _characterName: null,
        _mapName: null,
        init: function(b) {
            this.quest = sc.quests.staticQuests[b.quest];
            this.npc = b.npc || null;
            this.map = b.map || null
        },
        getBranchNames: function() {
            return ["accepted", "declined"]
        },
        start: function(b, a) {
            this._characterName = this.npc || a.data.character ||
                null;
            if (this.map) this._mapName = this.map || a.data.mapName || null;
            b.done = false;
            b._stashedPersons = sc.model.message.hasPerson();
            b._timer = b._stashedPersons ? 0.2 : 0;
            b._stashedPersons && sc.model.message.stashPersons()
        },
        run: function(b) {
            if (b._timer >= 0) {
                b._timer = b._timer - ig.system.actualTick;
                if (b._timer < 0) {
                    sc.model.stopSkip();
                    sc.model.skipBlock = true;
                    var a = new sc.QuestDialogWrapper(this.quest, function(a) {
                        b.accepted = a;
                        b.done = true
                    }.bind(this), false, this._characterName, this._mapName);
                    ig.gui.addGuiElement(a)
                }
            }
            if (b.done) {
                sc.model.skipBlock =
                    false;
                b._stashedPersons && sc.model.message.showStashedPersons()
            }
            return b.done
        },
        getNext: function(b) {
            return b.accepted ? this.branches.accepted || this._nextStep : this.branches.declined || this._nextStep
        }
    });
    ig.EVENT_STEP.FINISH_STATIC_QUEST = ig.EventStepBase.extend({
        quest: null,
        _wm: new ig.Config({
            attributes: {
                quest: {
                    _type: "QuestNameSelect",
                    _info: "The label to set to solve"
                }
            },
            label: function() {
                return "<b style='color: limegreen'> OPEN QUEST DIALOG </b> <i>" + this.quest + "</i> "
            }
        }),
        init: function(b) {
            this.quest = sc.quests.staticQuests[b.quest]
        },
        start: function() {
            sc.quests.setQuestFinished(this.quest)
        }
    });
    ig.EVENT_STEP.RESOLVE_FINISHED_QUESTS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(b) {
            b.timer = 0;
            sc.model.stopSkip();
            sc.model.skipBlock = true
        },
        run: function(b) {
            if (!b.timer || ig.vars.get("tmp._questRewardsFinished")) {
                if (b.timer) {
                    b.timer = b.timer - ig.system.tick;
                    if (b.timer <= 0) b.timer = 0;
                    return false
                }
                if (!sc.quests.popInlineSolvedQuest()) {
                    sc.model.skipBlock = false;
                    return true
                }
                b.timer = 0.1
            }
            return false
        }
    })
});
ig.baked = !0;
