/**
 * @module game.feature.quest.quest-steps
 *
 * Event steps for the quest system: creating quests, starting static quests,
 * solving quest conditions, updating quest locations, resetting quest tasks,
 * opening the quest dialog (accept/decline branches), finishing static
 * quests, and resolving inline-solved quest rewards.
 */
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
        init: function(settings) {
            this.settings = settings
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
        init: function(settings) {
            this.quest = settings.quest || ""
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
        init: function(settings) {
            this.questId = settings.quest.quest;
            this.label = settings.quest.label || null
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
        init: function(settings) {
            this.questId = settings.quest
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
        init: function(settings) {
            this.quest = settings.quest || null;
            this.index = settings.task == void 0 ? -1 : settings.task
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
            branchLabel: function(branchName) {
                switch (branchName) {
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
        init: function(settings) {
            this.quest = sc.quests.staticQuests[settings.quest];
            this.npc = settings.npc || null;
            this.map = settings.map || null
        },
        getBranchNames: function() {
            return ["accepted", "declined"]
        },
        start: function(stepState, eventContext) {
            this._characterName = this.npc || eventContext.data.character ||
                null;
            if (this.map) this._mapName = this.map || eventContext.data.mapName || null;
            stepState.done = false;
            stepState._stashedPersons = sc.model.message.hasPerson();
            stepState._timer = stepState._stashedPersons ? 0.2 : 0;
            stepState._stashedPersons && sc.model.message.stashPersons()
        },
        run: function(stepState) {
            if (stepState._timer >= 0) {
                stepState._timer = stepState._timer - ig.system.actualTick;
                if (stepState._timer < 0) {
                    sc.model.stopSkip();
                    sc.model.skipBlock = true;
                    var questDialog = new sc.QuestDialogWrapper(this.quest, function(accepted) {
                        stepState.accepted = accepted;
                        stepState.done = true
                    }.bind(this), false, this._characterName, this._mapName);
                    ig.gui.addGuiElement(questDialog)
                }
            }
            if (stepState.done) {
                sc.model.skipBlock =
                    false;
                stepState._stashedPersons && sc.model.message.showStashedPersons()
            }
            return stepState.done
        },
        getNext: function(stepState) {
            return stepState.accepted ? this.branches.accepted || this._nextStep : this.branches.declined || this._nextStep
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
        init: function(settings) {
            this.quest = sc.quests.staticQuests[settings.quest]
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
        start: function(stepState) {
            stepState.timer = 0;
            sc.model.stopSkip();
            sc.model.skipBlock = true
        },
        run: function(stepState) {
            if (!stepState.timer || ig.vars.get("tmp._questRewardsFinished")) {
                if (stepState.timer) {
                    stepState.timer = stepState.timer - ig.system.tick;
                    if (stepState.timer <= 0) stepState.timer = 0;
                    return false
                }
                if (!sc.quests.popInlineSolvedQuest()) {
                    sc.model.skipBlock = false;
                    return true
                }
                stepState.timer = 0.1
            }
            return false
        }
    })
});
ig.baked = !0;
