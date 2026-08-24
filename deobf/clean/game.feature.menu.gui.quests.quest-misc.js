/**
 * game.feature.menu.gui.quests.quest-misc
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.quests.quest-misc")`.
 *
 * Quest log / dialog widgets:
 *  - `sc.SolvedLine`: the "Solved" banner line.
 *  - `sc.QuestBaseBox`: base quest box (tile offsets, level gui, elite
 *    marker) with solved/elite/dialog tile variants.
 *  - `sc.QuestInfoBoxActive` / `sc.QuestInfoBoxSolved`: the info-box
 *    task list and solved description panels.
 *  - `sc.QuestInfoBox`: the quest info box (title, description, tasks,
 *    location bar, solved/elite styling).
 *  - `sc.QuestDialog`: the accept/solved quest dialog box with rewards.
 *  - `sc.QuestDialogWrapper`: the full-screen wrapper with accept/decline
 *    buttons, the accept animation and sub-quest chaining; `ig.GUI.
 *    QuestSolvedDialog` is the solved variant. `sc.QuestStartDialogButtonBox`:
 *    the accept/decline (or collect) button pair.
 */
ig.module("game.feature.menu.gui.quests.quest-misc")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.interact.button-group", "game.feature.menu.gui.quests.quest-entries")
    .defines(function () {

    function getElementIcons(element) {
        switch (element) {
            case "ALL":
                return "\\i[element-neutral]\\i[element-heat]\\i[element-cold]\\i[element-shock]\\i[element-wave]";
            case "ALL_ELEMENTS":
                return "\\i[element-heat]\\i[element-cold]\\i[element-shock]\\i[element-wave]";
            case "NEUTRAL":
                return "\\i[element-neutral]";
            case "HEAT":
                return "\\i[element-heat]";
            case "COLD":
                return "\\i[element-cold]";
            case "SHOCK":
                return "\\i[element-shock]";
            case "WAVE":
                return "\\i[element-wave]"
        }
    }

    var questSolvedSound = new ig.Sound("media/sound/hud/quest-solved.ogg", 0.6);

    sc.SolvedLine = ig.SimpleGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 6,
            top: 13,
            right: 6,
            bottom: 0,
            offsets: {
                "default": {
                    x: 473,
                    y: 17
                }
            }
        }),
        textGui: null,

        init: function () {
            this.parent();
            this.textGui = new sc.TextGui(ig.lang.get("sc.gui.menu.quests.solved"), {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.textGui.setPos(0, 0);
            this.addChildGui(this.textGui);
            this.setSize(105, 13)
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.setPivot(width / 2, height / 2)
        },

        updateDrawables: function (renderer) {
            renderer.addColor("#008277", 0, 6, this.hook.size.x, 1);
            this.ninepatch.draw(renderer, 95, 13, "default", this.hook.size.x / 2 - 47.5, 0)
        }
    });

    sc.QuestBaseBox = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 8,
            left: 27,
            top: 21,
            right: 27,
            bottom: 3,
            offsets: {
                "default": {
                    x: 416,
                    y: 0
                },
                dialog: {
                    x: 416,
                    y: 80
                },
                solved: {
                    x: 456,
                    y: 48
                },
                overlay: {
                    x: 416,
                    y: 112
                },
                "dialog-solved": {
                    x: 416,
                    y: 112
                },
                elite: {
                    x: 616,
                    y: 64
                },
                "elite-darker": {
                    x: 616,
                    y: 96
                }
            }
        }),
        levelGui: null,
        elite: 0,

        init: function (width, height, level) {
            this.parent(56, 32);
            this.setSize(width || 56, height || 32);
            this.levelGui = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.levelGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.levelGui.setNumber(level != void 0 ? level : 0);
            this.levelGui.setPos(5, 11);
            this.addChildGui(this.levelGui)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            this.elite != 0 && renderer.addGfx(this.ninepatch.gfx, 6, 3, this.elite == 1 ? 608 : 624, 0, 16, 16)
        },

        setLevel: function (level) {
            this.levelGui.setNumber(level || 0, true)
        },

        setElite: function (elite, solved) {
            this.elite = elite ? solved ? 2 : 1 : 0
        }
    });

    var taskContainerHeight = 0;

    sc.QuestInfoBoxActive = ig.SimpleGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        lineGui: null,
        taskContainer: null,

        init: function () {
            this.parent();
            this.setSize(281, 164);
            this.lineGui = new ig.ColorGui("#545454", 257, 1);
            this.lineGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.lineGui.setPos(0, 0);
            this.addChildGui(this.lineGui);
            this.taskContainer = new ig.GuiElementBase;
            this.taskContainer.setSize(257, 173);
            this.taskContainer.setPos(12, 2);
            this.addChildGui(this.taskContainer);
            this.hide(true)
        },

        setTasks: function (quest, currentTask) {
            this.taskContainer.removeAllChildren();
            this.lineGui.color = quest.elite ? "#8d0000" : "#545454";
            for (var i = currentTask + 1, y = 10; i--;) {
                y = this._addTask(i, quest, y);
                if (y >= 163) {
                    var arrow = new ig.ImageGui(this.gfx, 434, 56, 14, 4);
                    arrow.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    arrow.setPos(0, 4);
                    this.taskContainer.addChildGui(arrow);
                    taskContainerHeight = taskContainerHeight + 5;
                    break
                } else taskContainerHeight = y
            }
            this.taskContainer.setSize(257, taskContainerHeight)
        },

        _addTask: function (taskIndex, quest, y) {
            var entry = new sc.TaskEntry(taskIndex, quest, false, true);
            entry.doStateTransition("DEFAULT", true);
            entry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            entry.setPos(1, y);
            y = y + (entry.hook.size.y + 3);
            ig.langEdit && ig.langEdit.submitCustomFile("Quest Task [" + (taskIndex + 1) + "]: " + quest.name, quest.tasks[taskIndex].task, "data/database.json");
            if (y <= 163) {
                this.taskContainer.addChildGui(entry);
                return y
            }
            taskContainerHeight = y - entry.hook.size.y;
            return y
        }
    });

    sc.QuestInfoBoxSolved = ig.SimpleGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        solvedGui: null,
        endDescription: null,

        init: function () {
            this.parent();
            this.setSize(281, 186);
            this.solvedGui = new sc.SolvedLine;
            this.solvedGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.solvedGui.setSize(257, 13);
            this.solvedGui.setPos(0, 0);
            this.addChildGui(this.solvedGui);
            this.endDescription = new sc.TextGui("", {
                font: sc.fontsystem.smallFont,
                linePadding: 0,
                maxWidth: 254
            });
            this.endDescription.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.endDescription.setPos(13, 17);
            this.addChildGui(this.endDescription);
            this.hide(true)
        }
    });

    sc.QuestInfoBox = sc.QuestBaseBox.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        titleGui: null,
        descriptionGui: null,
        locationGui: null,
        locationText: null,
        lineGui: null,
        activeView: null,
        solvedView: null,

        init: function () {
            this.parent(281, 265);
            this.setPivot(0, 265);
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.type",
                    description: "sc.gui.menu.help.quest.description.type"
                },
                offset: {
                    x: 3,
                    y: 2
                },
                size: {
                    x: 21,
                    y: 19
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.annotation[1] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.level",
                    description: "sc.gui.menu.help.quest.description.level"
                },
                offset: {
                    x: 257,
                    y: 2
                },
                size: {
                    x: 21,
                    y: 19
                },
                index: {
                    x: 1,
                    y: 0
                }
            };
            this.annotation[2] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.content",
                    description: "sc.gui.menu.help.quest.description.content"
                },
                offset: {
                    x: 3,
                    y: 24
                },
                size: {
                    x: 275,
                    y: 217
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.annotation[3] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.location",
                    description: "sc.gui.menu.help.quest.description.location"
                },
                offset: {
                    x: 3,
                    y: 243
                },
                size: {
                    x: 19,
                    y: 22
                },
                index: {
                    x: 0,
                    y: 2
                }
            };
            this.titleGui = new sc.TextGui("");
            this.titleGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.titleGui.setPos(0, 4);
            this.addChildGui(this.titleGui);
            this.descriptionGui = new sc.TextGui("", {
                font: sc.fontsystem.smallFont,
                linePadding: 0,
                maxWidth: 254
            });
            this.descriptionGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.descriptionGui.setPos(13, 24);
            this.addChildGui(this.descriptionGui);
            this.locationGui = new ig.ColorGui("#545454", 277, 19);
            this.locationGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.locationGui.setPos(0, 2);
            this.addChildGui(this.locationGui);
            this.locationText = new sc.TextGui("");
            this.locationText.setPos(22, 2);
            this.locationGui.addChildGui(this.locationText);
            var marker = new ig.ImageGui(this.gfx, 418, 33, 12, 18);
            marker.setPos(5, 1);
            this.locationGui.addChildGui(marker);
            this.activeView = new sc.QuestInfoBoxActive;
            this.activeView.setPos(0, 80);
            this.addChildGui(this.activeView);
            this.solvedView = new sc.QuestInfoBoxSolved;
            this.solvedView.setPos(0, 80);
            this.addChildGui(this.solvedView);
            this.setQuest(null)
        },

        setQuest: function (quest) {
            if (quest) {
                this.activeView.hide(true);
                this.solvedView.hide(true);
                this.titleGui.setText(quest.name);
                this.descriptionGui.setText(quest.description);
                this.setLevel(quest.level);
                this.setElite(quest.elite, sc.quests.isQuestSolved(quest.id));
                this.locationText.setText(quest.location.area + " - " + quest.location.map);
                if (ig.langEdit) {
                    var label = "Quest Name: " + quest.name;
                    ig.langEdit.submitCustomFile(label, quest.name, "data/database.json");
                    label = "Quest Description: " + quest.name;
                    ig.langEdit.submitCustomFile(label, quest.description, "data/database.json")
                }
                if (sc.quests.isQuestSolved(quest.id)) {
                    this.currentTileOffset = "solved";
                    this.locationGui.color = "#008277";
                    this.solvedView.show(true);
                    this.solvedView.endDescription.setText(quest.endDescription);
                    if (ig.langEdit) {
                        label = "Quest End Description: " + quest.name;
                        ig.langEdit.submitCustomFile(label, quest.endDescription, "data/database.json")
                    }
                } else {
                    this.currentTileOffset = quest.elite ? "elite" : "default";
                    this.locationGui.color = quest.elite ? "#8d0000" : "#545454";
                    this.activeView.show(true);
                    this.activeView.setTasks(quest, sc.quests.getCurrentTask(quest, true))
                }
            } else {
                this.currentTileOffset = "default";
                this.locationGui.color = "#545454";
                this.activeView.hide(true);
                this.solvedView.hide(true);
                this.locationText.setText("");
                this.titleGui.setText(ig.lang.get("sc.gui.menu.quests.noquest"));
                this.descriptionGui.setText("");
                this.setLevel(0);
                this.setElite(false);
                this.currentTileOffset = "default"
            }
        },

        show: function () {
            this.doStateTransition("DEFAULT")
        },

        hide: function (immediate) {
            this.doStateTransition("HIDDEN", immediate)
        }
    });

    sc.QuestDialog = sc.QuestBaseBox.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            SMALLER: {
                state: {
                    scaleX: 0.9,
                    scaleY: 0.9
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        titleGui: null,
        descriptionGui: null,
        endDescriptionGui: null,
        firstTaskGui: null,
        expGui: null,
        creditGui: null,
        cpGui: null,
        itemsGui: null,
        solvedGui: null,
        quest: null,

        init: function (quest, solved) {
            this.parent(281, solved ? 239 : 218);
            this.currentTileOffset = solved ? "dialog-solved" : quest.elite ? "elite-darker" : "dialog";
            this.quest = quest;
            this.setLevel(this.quest.level);
            this.setElite(this.quest.elite, solved);
            this.titleGui = new sc.TextGui(this.quest.name);
            this.titleGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.titleGui.setPos(0, 4);
            this.addChildGui(this.titleGui);
            this.descriptionGui = new sc.TextGui(this.quest.description, {
                font: sc.fontsystem.smallFont,
                linePadding: 0,
                maxWidth: 254
            });
            this.descriptionGui.setPos(13, 24);
            this.addChildGui(this.descriptionGui);
            var line = null;
            if (solved) {
                this.solvedGui = new sc.SolvedLine;
                this.solvedGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.solvedGui.setSize(257, 13);
                this.solvedGui.setPos(0, 79);
                this.addChildGui(this.solvedGui);
                this.endDescriptionGui = new sc.TextGui(this.quest.endDescription, {
                    font: sc.fontsystem.smallFont,
                    linePadding: 0,
                    maxWidth: 254
                });
                this.endDescriptionGui.setPos(13, 95);
                this.addChildGui(this.endDescriptionGui)
            } else {
                line = new ig.ColorGui(quest.elite ? "#8d0000" : "#545454", 257, 1);
                line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                line.setPos(0, 78);
                this.addChildGui(line);
                this.firstTaskGui = new sc.TaskEntry(0, quest, false, true);
                this.firstTaskGui.setPos(13, 83);
                this.addChildGui(this.firstTaskGui);
                this.firstTaskGui.doStateTransition("DEFAULT", true)
            }
            line = new ig.ImageGui(this.gfx, 457, 37, 14, 9);
            line.setPos(12, solved ? 175 : 152);
            this.addChildGui(line);
            line = new ig.ColorGui(solved ? "#008277" : quest.elite ? "#8d0000" : "#545454", 242, 1);
            line.setPos(27, solved ? 180 : 157);
            this.addChildGui(line);
            var hideRewards = quest.hideRewards && !solved;
            this.expGui = new sc.TextGui("");
            this.creditGui = new sc.TextGui("");
            this.cpGui = new sc.TextGui("");
            this.addChildGui(this.expGui);
            this.addChildGui(this.creditGui);
            this.addChildGui(this.cpGui);
            this.itemsGui = new ig.GuiElementBase;
            this.itemsGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.itemsGui.setPos(11, solved ? 181 : 158);
            this.itemsGui.setSize(146, 48);
            this.addChildGui(this.itemsGui);
            this.setQuestRewards(quest, hideRewards, solved)
        },

        setQuest: function (quest) {
            this.quest = quest || null;
            this.titleGui.setText(this.quest.name);
            this.descriptionGui.setText(this.quest.description);
            this.firstTaskGui.setTask(0, this.quest, false, true);
            this.setElite(this.quest.elite, false);
            this.currentTileOffset = this.quest.elite ? "elite-darker" : "dialog";
            var hideRewards = this.quest.hideRewards;
            this.expGui.setText("");
            this.creditGui.setText("");
            this.cpGui.setText("");
            this.setQuestRewards(quest, hideRewards, false)
        },

        setQuestRewards: function (quest, hideRewards, solved) {
            var y = solved ? 181 : 158,
                label = null;
            if (quest.rewards.exp) {
                var expText = "\\i[exp]",
                    rawExp = false;
                if (hideRewards) expText = expText + "????";
                else {
                    rawExp = sc.model.player.getRawExpGain(quest.rewards.exp.exp, quest.level, sc.LEVEL_CURVES.QUEST);
                    expText = expText + (rawExp + "* ") + (quest.rewards.exp.bonus ? "+" + quest.rewards.exp.bonus : "")
                }
                this.expGui.setText(expText);
                this.expGui.setPos(31, y);
                y = y + 14;
                if (!hideRewards && !rawExp) {
                    label = new sc.TextGui(ig.lang.get("sc.gui.menu.quests.atCurLvl"), {
                        font: sc.fontsystem.tinyFont
                    });
                    label.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                    label.setPos(32, 4);
                    this.addChildGui(label)
                }
            }
            if (quest.rewards.money) {
                hideRewards ? this.creditGui.setText("\\i[credit]????????") : this.creditGui.setText("\\i[credit]" + (quest.rewards.money || 0));
                this.creditGui.setPos(31, y);
                y = y + 14
            }
            if (quest.rewards.cp) {
                hideRewards ? this.cpGui.setText("\\i[cp]????????") : quest.rewards.cp.amount == 1 ? this.cpGui.setText("\\i[cp]" + getElementIcons(quest.rewards.cp.element)) : this.cpGui.setText("\\i[cp]" + getElementIcons(quest.rewards.cp.element) + "x " + (quest.rewards.cp.amount || 0));
                this.cpGui.setPos(31, y)
            }
            this.itemsGui.removeAllChildren();
            if (quest.rewards.items)
                for (var itemsGui = this.itemsGui, items = quest.rewards.items, gfx = this.gfx, itemY = 0, i = 0; i < items.length; i++) {
                    var amount = items[i].amount,
                        item = sc.inventory.getItem(items[i].id),
                        text = "\\i[" + (item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) || "item-default") + "]",
                        text = hideRewards ? text + "?????????????" : text + ig.LangLabel.getText(item.name);
                    amount > 1 && (text = text + (" x " + amount));
                    var level = 0;
                    item.type == sc.ITEMS_TYPES.EQUIP && (level = item.level || 0);
                    var textGui = new sc.TextGui(text);
                    textGui.setPos(0, itemY);
                    textGui.level = level;
                    textGui.numberGfx = gfx;
                    level > 0 && !hideRewards && textGui.setDrawCallback(function (renderer, offset) {
                        sc.MenuHelper.drawLevel(this.level, renderer, offset, this.numberGfx, item.isScalable)
                    }.bind(textGui));
                    itemsGui.addChildGui(textGui);
                    itemY = itemY + 17
                }
        }
    });

    sc.QuestDialogWrapper = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    angle: 0.3
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        screenInteract: null,
        buttonInteract: null,
        buttonGroup: null,
        callback: null,
        quest: null,
        questBox: null,
        buttons: null,
        acceptText: null,
        overlay: null,
        finished: false,
        firstQuest: null,
        subQuests: null,
        next: 0,
        _characterName: null,
        _mapName: null,

        init: function (quest, callback, finished, characterName, mapName) {
            this.parent();
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this._characterName = characterName || null;
            this._mapName = mapName || null;
            this.firstQuest = quest;
            this.finished = finished || false;
            this.callback = callback;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.questBox = new sc.QuestDialog(quest, finished);
            this.questBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.questBox.setPos(0, finished ? -11 : -22);
            this.addChildGui(this.questBox);
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addPressCallback(this.onButtonPress.bind(this));
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.buttons = new sc.QuestStartDialogButtonBox(this.buttonGroup, finished, quest.mandatory, quest.parentQuest ? true : false);
            this.buttons.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.buttons.setPos(0, finished ? 24 : 25);
            this.addChildGui(this.buttons);
            if (!this.finished) {
                this.overlay = new ig.GuiElementBase;
                this.overlay.setSize(281, 218);
                this.overlay.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.overlay.updateDrawables = function (renderer) {
                    this.questBox.ninepatch.drawComposite(renderer, 281, 218, this.questBox.elite ? "elite" : "default", "darker");
                    this.questBox.elite && renderer.addGfx(this.questBox.ninepatch.gfx, 6, 3, this.questBox.elite == 1 ? 608 : 624, 0, 16, 16)
                }.bind(this);
                this.overlay.doStateTransition("HIDDEN", true);
                this.questBox.addChildGui(this.overlay);
                this.questBox.removeChildGui(this.questBox.levelGui);
                this.questBox.addChildGui(this.questBox.levelGui);
                this.acceptText = new sc.TextGui("\\c[3]" + ig.lang.get("sc.gui.menu.quests.accepted-large") + "\\c[0]");
                this.acceptText.hook.transitions = {
                    DEFAULT: {
                        state: {
                            scaleX: 2,
                            scaleY: 2,
                            angle: 0.3
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    WAIT: {
                        state: {
                            scaleX: 2,
                            scaleY: 2,
                            angle: 0.3
                        },
                        time: 0.1,
                        timeFunction: KEY_SPLINES.EASE_IN
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0,
                            scaleX: 4,
                            scaleY: 4,
                            angle: 0.5
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    SMALLER: {
                        state: {
                            scaleX: 1.8,
                            scaleY: 1.8,
                            angle: 0.3
                        },
                        time: 0.1,
                        timeFunction: KEY_SPLINES.EASE_OUT
                    }
                };
                this.acceptText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.acceptText.setPos(0, -22);
                this.acceptText.doStateTransition("HIDDEN", true);
                this.addChildGui(this.acceptText)
            }
            ig.interact.addEntry(this.buttonInteract);
            finished && questSolvedSound.play(false, {
                startTime: 0.1
            });
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },

        onDetach: function () {
            ig.interact.removeEntry(this.buttonInteract)
        },

        onButtonPress: function (button) {
            if (this.finished) {
                ig.interact.setBlockDelay(0.22);
                this._close(false)
            } else {
                ig.interact.setBlockDelay(1.4);
                if (button.data == 1) {
                    sc.BUTTON_SOUND.quest_accept.play();
                    this.acceptText.doStateTransition("DEFAULT", false, false, function () {
                        this.acceptText.doStateTransition("SMALLER");
                        this.overlay.doStateTransition("DEFAULT");
                        this.questBox.doStateTransition("SMALLER", false, false, function () {
                            this.questBox.doStateTransition("DEFAULT");
                            this.acceptText.doStateTransition("WAIT", false, false, function () {
                                this._close(true)
                            }.bind(this))
                        }.bind(this))
                    }.bind(this))
                } else button.data == 2 && this._close(false)
            }
        },

        _close: function (accepted) {
            accepted ? this.doStateTransition("HIDDEN", false, false, function () {
                this.questBox.quest.elite && !ig.vars.get("tutorials.questElite") && ig.vars.set("tutorials.questElite", true);
                var quest = sc.quests.activateStaticQuest(this.questBox.quest.id, this._characterName, this._mapName);
                if (quest) {
                    if (!this.subQuests) this.subQuests = sc.quests.getSubQuests(quest.quest);
                    if (this.subQuests && this.next < this.subQuests.length) {
                        var subQuest = sc.quests.getStaticQuest(this.subQuests[this.next]);
                        this.acceptText.doStateTransition("HIDDEN", true);
                        this.overlay.doStateTransition("HIDDEN", true);
                        this.questBox.setQuest(subQuest);
                        this.questBox.hook.pos.y = -11;
                        this.buttons.hook.pos.y = 24;
                        this.buttons.setAcceptMode(this.buttonGroup);
                        ig.interact.setBlockDelay(0.2);
                        if (this.buttonInteract.mouseOverGui) this.buttonInteract.mouseOverGui = null;
                        this.doStateTransition("DEFAULT");
                        this.next++
                    } else {
                        if (this.subQuests) {
                            for (var i = 0, j = this.subQuests.length; j--;) {
                                sc.quests.updateTimeStamp(sc.quests.getStaticQuest(this.subQuests[j]), i);
                                i = i + 0.1
                            }
                            sc.quests.updateTimeStamp(this.firstQuest, i)
                        }
                        ig.interact.removeEntry(this.buttonInteract);
                        this.callback && this.callback(true, this.firstQuest)
                    }
                } else {
                    ig.interact.removeEntry(this.buttonInteract);
                    this.callback && this.callback(false, this.questBox.quest);
                    ig.warn("Something went wrong!")
                }
            }.bind(this), accepted ? 0.3 : 0) :
                this.doStateTransition("HIDDEN", false, true, function () {
                    ig.interact.removeEntry(this.buttonInteract);
                    this.callback && this.callback(false, this.questBox.quest)
                }.bind(this), accepted ? 0.3 : 0)
        }
    });

    ig.GUI.QuestSolvedDialog = sc.QuestDialogWrapper.extend({
        init: function (data) {
            this.parent(data.quest, this.onCollectRewards.bind(this), true);
            ig.vars.set("tmp._questRewardsFinished", false)
        },

        onCollectRewards: function () {
            sc.quests.finishUpQuest(this.questBox.quest);
            ig.vars.set("tmp._questRewardsFinished", true)
        }
    });

    ig.GUI.QuestSolvedDialog._noGuiSave = true;

    sc.QuestStartDialogButtonBox = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 480,
                    y: 304
                }
            }
        }),
        acceptButton: null,
        declineButton: null,
        acceptMode: false,

        init: function (buttongroup, solved, mandatory, isSubQuest) {
            this.parent();
            this.setSize(142, solved || mandatory ? 25 : 45);
            var label = solved ? isSubQuest ? ig.lang.get("sc.gui.menu.quests.collectSubQuest") : ig.lang.get("sc.gui.menu.quests.collect") : ig.lang.get("sc.gui.menu.quests.accept");
            this.acceptButton = new sc.ButtonGui(label, 136, true, sc.BUTTON_TYPE.ITEM);
            this.acceptButton.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.acceptButton.textChild.setPos(0, 0);
            this.acceptButton.setPos(3, 3);
            this.acceptButton.setData(1);
            this.addChildGui(this.acceptButton);
            this.declineButton = new sc.ButtonGui(ig.lang.get("sc.gui.menu.quests.decline"), 136, true, sc.BUTTON_TYPE.ITEM);
            this.declineButton.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.declineButton.textChild.setPos(0, 0);
            this.declineButton.setPos(3, 23);
            this.declineButton.setData(2);
            !solved && !mandatory && this.addChildGui(this.declineButton);
            buttongroup.addFocusGui(this.acceptButton, 0, 0);
            !solved && !mandatory && buttongroup.addFocusGui(this.declineButton, 0, 1)
        },

        setAcceptMode: function (buttongroup) {
            buttongroup.unfocusCurrentButton();
            if (!this.acceptMode) {
                this.removeChildGui(this.declineButton);
                buttongroup.removeFocusGui(0, 1);
                ig.input.mouseGuiActive ? buttongroup.setCurrentFocus(0, 0) : buttongroup.focusCurrentButton(0, 0, true, true, true);
                this.hook.size.y = 25;
                this.acceptMode = true
            }
        }
    })
});
ig.baked = !0;
