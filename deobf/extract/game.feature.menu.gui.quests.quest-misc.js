ig.module("game.feature.menu.gui.quests.quest-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.interact.button-group", "game.feature.menu.gui.quests.quest-entries").defines(function() {
    function b(a) {
        switch (a) {
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
    var a = new ig.Sound("media/sound/hud/quest-solved.ogg", 0.6);
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
        init: function() {
            this.parent();
            this.textGui = new sc.TextGui(ig.lang.get("sc.gui.menu.quests.solved"), {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.textGui.setPos(0, 0);
            this.addChildGui(this.textGui);
            this.setSize(105, 13)
        },
        setSize: function(a, b) {
            this.parent(a, b);
            this.setPivot(a / 2, b / 2)
        },
        updateDrawables: function(a) {
            a.addColor("#008277", 0, 6, this.hook.size.x, 1);
            this.ninepatch.draw(a, 95, 13, "default", this.hook.size.x / 2 - 47.5, 0)
        }
    });
    sc.QuestBaseBox =
        ig.BoxGui.extend({
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
            init: function(a, b, d) {
                this.parent(56, 32);
                this.setSize(a || 56, b || 32);
                this.levelGui = new sc.NumberGui(99, {
                    leadingZeros: 2
                });
                this.levelGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.levelGui.setNumber(d !=
                    void 0 ? d : 0);
                this.levelGui.setPos(5, 11);
                this.addChildGui(this.levelGui)
            },
            updateDrawables: function(a) {
                this.parent(a);
                this.elite != 0 && a.addGfx(this.ninepatch.gfx, 6, 3, this.elite == 1 ? 608 : 624, 0, 16, 16)
            },
            setLevel: function(a) {
                this.levelGui.setNumber(a || 0, true)
            },
            setElite: function(a, b) {
                this.elite = a ? b ? 2 : 1 : 0
            }
        });
    var d = 0;
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
        init: function() {
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
        setTasks: function(a, b) {
            this.taskContainer.removeAllChildren();
            this.lineGui.color = a.elite ?
                "#8d0000" : "#545454";
            for (var f = b + 1, g = 10; f--;) {
                g = this._addTask(f, a, g);
                if (g >= 163) {
                    f = new ig.ImageGui(this.gfx, 434, 56, 14, 4);
                    f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    f.setPos(0, 4);
                    this.taskContainer.addChildGui(f);
                    d = d + 5;
                    break
                } else d = g
            }
            this.taskContainer.setSize(257, d)
        },
        _addTask: function(a, b, f) {
            var g = new sc.TaskEntry(a, b, false, true);
            g.doStateTransition("DEFAULT", true);
            g.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            g.setPos(1, f);
            f = f + (g.hook.size.y + 3);
            ig.langEdit && ig.langEdit.submitCustomFile("Quest Task [" +
                (a + 1) + "]: " + b.name, b.tasks[a].task, "data/database.json");
            if (f <= 163) {
                this.taskContainer.addChildGui(g);
                return f
            }
            d = f - g.hook.size.y;
            return f
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
        init: function() {
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
        init: function() {
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
            var a = new ig.ImageGui(this.gfx,
                418, 33, 12, 18);
            a.setPos(5, 1);
            this.locationGui.addChildGui(a);
            this.activeView = new sc.QuestInfoBoxActive;
            this.activeView.setPos(0, 80);
            this.addChildGui(this.activeView);
            this.solvedView = new sc.QuestInfoBoxSolved;
            this.solvedView.setPos(0, 80);
            this.addChildGui(this.solvedView);
            this.setQuest(null)
        },
        setQuest: function(a) {
            if (a) {
                this.activeView.hide(true);
                this.solvedView.hide(true);
                this.titleGui.setText(a.name);
                this.descriptionGui.setText(a.description);
                this.setLevel(a.level);
                this.setElite(a.elite, sc.quests.isQuestSolved(a.id));
                this.locationText.setText(a.location.area + " - " + a.location.map);
                if (ig.langEdit) {
                    var b = "Quest Name: " + a.name;
                    ig.langEdit.submitCustomFile(b, a.name, "data/database.json");
                    b = "Quest Description: " + a.name;
                    ig.langEdit.submitCustomFile(b, a.description, "data/database.json")
                }
                if (sc.quests.isQuestSolved(a.id)) {
                    this.currentTileOffset = "solved";
                    this.locationGui.color = "#008277";
                    this.solvedView.show(true);
                    this.solvedView.endDescription.setText(a.endDescription);
                    if (ig.langEdit) {
                        b = "Quest End Description: " + a.name;
                        ig.langEdit.submitCustomFile(b,
                            a.endDescription, "data/database.json")
                    }
                } else {
                    this.currentTileOffset = a.elite ? "elite" : "default";
                    this.locationGui.color = a.elite ? "#8d0000" : "#545454";
                    this.activeView.show(true);
                    this.activeView.setTasks(a, sc.quests.getCurrentTask(a, true))
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
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
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
        init: function(a, b) {
            this.parent(281, b ? 239 : 218);
            this.currentTileOffset = b ? "dialog-solved" : a.elite ? "elite-darker" : "dialog";
            this.quest = a;
            this.setLevel(this.quest.level);
            this.setElite(this.quest.elite, b);
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
            var d = null;
            if (b) {
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
                d =
                    new ig.ColorGui(a.elite ? "#8d0000" : "#545454", 257, 1);
                d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                d.setPos(0, 78);
                this.addChildGui(d);
                this.firstTaskGui = new sc.TaskEntry(0, a, false, true);
                this.firstTaskGui.setPos(13, 83);
                this.addChildGui(this.firstTaskGui);
                this.firstTaskGui.doStateTransition("DEFAULT", true)
            }
            d = new ig.ImageGui(this.gfx, 457, 37, 14, 9);
            d.setPos(12, b ? 175 : 152);
            this.addChildGui(d);
            d = new ig.ColorGui(b ? "#008277" : a.elite ? "#8d0000" : "#545454", 242, 1);
            d.setPos(27, b ? 180 : 157);
            this.addChildGui(d);
            d = a.hideRewards && !b;
            this.expGui = new sc.TextGui("");
            this.creditGui = new sc.TextGui("");
            this.cpGui = new sc.TextGui("");
            this.addChildGui(this.expGui);
            this.addChildGui(this.creditGui);
            this.addChildGui(this.cpGui);
            this.itemsGui = new ig.GuiElementBase;
            this.itemsGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.itemsGui.setPos(11, b ? 181 : 158);
            this.itemsGui.setSize(146, 48);
            this.addChildGui(this.itemsGui);
            this.setQuestRewards(a, d, b)
        },
        setQuest: function(a) {
            this.quest = a || null;
            this.titleGui.setText(this.quest.name);
            this.descriptionGui.setText(this.quest.description);
            this.firstTaskGui.setTask(0, this.quest, false, true);
            this.setElite(this.quest.elite, false);
            this.currentTileOffset = this.quest.elite ? "elite-darker" : "dialog";
            var b = this.quest.hideRewards;
            this.expGui.setText("");
            this.creditGui.setText("");
            this.cpGui.setText("");
            this.setQuestRewards(a, b, false)
        },
        setQuestRewards: function(a, d, f) {
            var f = f ? 181 : 158,
                g = null;
            if (a.rewards.exp) {
                var g = "\\i[exp]",
                    h = false;
                if (d) g = g + "????";
                else {
                    h = sc.model.player.getRawExpGain(a.rewards.exp.exp,
                        a.level, sc.LEVEL_CURVES.QUEST);
                    g = g + (h + "* ") + (a.rewards.exp.bonus ? "+" + a.rewards.exp.bonus : "")
                }
                this.expGui.setText(g);
                this.expGui.setPos(31, f);
                f = f + 14;
                if (!d && !h) {
                    g = new sc.TextGui(ig.lang.get("sc.gui.menu.quests.atCurLvl"), {
                        font: sc.fontsystem.tinyFont
                    });
                    g.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                    g.setPos(32, 4);
                    this.addChildGui(g)
                }
            }
            if (a.rewards.money) {
                d ? this.creditGui.setText("\\i[credit]????????") : this.creditGui.setText("\\i[credit]" + (a.rewards.money || 0));
                this.creditGui.setPos(31, f);
                f = f + 14
            }
            if (a.rewards.cp) {
                d ?
                    this.cpGui.setText("\\i[cp]????????") : a.rewards.cp.amount == 1 ? this.cpGui.setText("\\i[cp]" + b(a.rewards.cp.element)) : this.cpGui.setText("\\i[cp]" + b(a.rewards.cp.element) + "x " + (a.rewards.cp.amount || 0));
                this.cpGui.setPos(31, f)
            }
            this.itemsGui.removeAllChildren();
            if (a.rewards.items)
                for (var f = this.itemsGui, a = a.rewards.items, g = this.gfx, i = h = 0; i < a.length; i++) {
                    var j = a[i].amount,
                        k = sc.inventory.getItem(a[i].id),
                        l = "\\i[" + (k.icon + sc.inventory.getRaritySuffix(k.rarity || 0) || "item-default") + "]",
                        l = d ? l + "?????????????" :
                        l + ig.LangLabel.getText(k.name);
                    j > 1 && (l = l + (" x " + j));
                    j = 0;
                    k.type == sc.ITEMS_TYPES.EQUIP && (j = k.level || 0);
                    l = new sc.TextGui(l);
                    l.setPos(0, h);
                    l.level = j;
                    l.numberGfx = g;
                    j > 0 && !d && l.setDrawCallback(function(a, b) {
                        sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx, k.isScalable)
                    }.bind(l));
                    f.addChildGui(l);
                    h = h + 17
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
        init: function(b, d, f, g, h) {
            this.parent();
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this._characterName = g || null;
            this._mapName = h || null;
            this.firstQuest = b;
            this.finished =
                f || false;
            this.callback = d;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.questBox = new sc.QuestDialog(b, f);
            this.questBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.questBox.setPos(0, f ? -11 : -22);
            this.addChildGui(this.questBox);
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addPressCallback(this.onButtonPress.bind(this));
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.buttons = new sc.QuestStartDialogButtonBox(this.buttonGroup,
                f, b.mandatory, b.parentQuest ? true : false);
            this.buttons.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.buttons.setPos(0, f ? 24 : 25);
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
                this.overlay.updateDrawables = function(a) {
                    this.questBox.ninepatch.drawComposite(a, 281, 218, this.questBox.elite ?
                        "elite" : "default", "darker");
                    this.questBox.elite && a.addGfx(this.questBox.ninepatch.gfx, 6, 3, this.questBox.elite == 1 ? 608 : 624, 0, 16, 16)
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
            f && a.play(false, {
                startTime: 0.1
            });
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        onDetach: function() {
            ig.interact.removeEntry(this.buttonInteract)
        },
        onButtonPress: function(a) {
            if (this.finished) {
                ig.interact.setBlockDelay(0.22);
                this._close(false)
            } else {
                ig.interact.setBlockDelay(1.4);
                if (a.data == 1) {
                    sc.BUTTON_SOUND.quest_accept.play();
                    this.acceptText.doStateTransition("DEFAULT", false, false, function() {
                        this.acceptText.doStateTransition("SMALLER");
                        this.overlay.doStateTransition("DEFAULT");
                        this.questBox.doStateTransition("SMALLER", false, false, function() {
                            this.questBox.doStateTransition("DEFAULT");
                            this.acceptText.doStateTransition("WAIT", false, false, function() {
                                this._close(true)
                            }.bind(this))
                        }.bind(this))
                    }.bind(this))
                } else a.data == 2 && this._close(false)
            }
        },
        _close: function(a) {
            a ? this.doStateTransition("HIDDEN", false, false, function() {
                    this.questBox.quest.elite && !ig.vars.get("tutorials.questElite") && ig.vars.set("tutorials.questElite", true);
                    var a = sc.quests.activateStaticQuest(this.questBox.quest.id,
                        this._characterName, this._mapName);
                    if (a) {
                        if (!this.subQuests) this.subQuests = sc.quests.getSubQuests(a.quest);
                        if (this.subQuests && this.next < this.subQuests.length) {
                            a = sc.quests.getStaticQuest(this.subQuests[this.next]);
                            this.acceptText.doStateTransition("HIDDEN", true);
                            this.overlay.doStateTransition("HIDDEN", true);
                            this.questBox.setQuest(a);
                            this.questBox.hook.pos.y = -11;
                            this.buttons.hook.pos.y = 24;
                            this.buttons.setAcceptMode(this.buttonGroup);
                            ig.interact.setBlockDelay(0.2);
                            if (this.buttonInteract.mouseOverGui) this.buttonInteract.mouseOverGui =
                                null;
                            this.doStateTransition("DEFAULT");
                            this.next++
                        } else {
                            if (this.subQuests) {
                                for (var a = 0, b = this.subQuests.length; b--;) {
                                    sc.quests.updateTimeStamp(sc.quests.getStaticQuest(this.subQuests[b]), a);
                                    a = a + 0.1
                                }
                                sc.quests.updateTimeStamp(this.firstQuest, a)
                            }
                            ig.interact.removeEntry(this.buttonInteract);
                            this.callback && this.callback(true, this.firstQuest)
                        }
                    } else {
                        ig.interact.removeEntry(this.buttonInteract);
                        this.callback && this.callback(false, this.questBox.quest);
                        ig.warn("Something went wrong!")
                    }
                }.bind(this), a ? 0.3 : 0) :
                this.doStateTransition("HIDDEN", false, true, function() {
                    ig.interact.removeEntry(this.buttonInteract);
                    this.callback && this.callback(false, this.questBox.quest)
                }.bind(this), a ? 0.3 : 0)
        }
    });
    ig.GUI.QuestSolvedDialog = sc.QuestDialogWrapper.extend({
        init: function(a) {
            this.parent(a.quest, this.onCollectRewards.bind(this), true);
            ig.vars.set("tmp._questRewardsFinished", false)
        },
        onCollectRewards: function() {
            sc.quests.finishUpQuest(this.questBox.quest);
            ig.vars.set("tmp._questRewardsFinished", true)
        }
    });
    ig.GUI.QuestSolvedDialog._noGuiSave =
        true;
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
        init: function(a, b, d, g) {
            this.parent();
            this.setSize(142, b || d ? 25 : 45);
            g = b ? g ? ig.lang.get("sc.gui.menu.quests.collectSubQuest") : ig.lang.get("sc.gui.menu.quests.collect") :
                ig.lang.get("sc.gui.menu.quests.accept");
            this.acceptButton = new sc.ButtonGui(g, 136, true, sc.BUTTON_TYPE.ITEM);
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
            !b && !d && this.addChildGui(this.declineButton);
            a.addFocusGui(this.acceptButton, 0, 0);
            !b && !d && a.addFocusGui(this.declineButton, 0, 1)
        },
        setAcceptMode: function(a) {
            a.unfocusCurrentButton();
            if (!this.acceptMode) {
                this.removeChildGui(this.declineButton);
                a.removeFocusGui(0, 1);
                ig.input.mouseGuiActive ? a.setCurrentFocus(0, 0) : a.focusCurrentButton(0, 0, true, true, true);
                this.hook.size.y = 25;
                this.acceptMode = true
            }
        }
    })
});
ig.baked = !0;
