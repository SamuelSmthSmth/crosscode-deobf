/**
 * game.feature.menu.gui.quests.quest-details
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.quests.quest-details")`.
 *
 * The quest detail view:
 *  - `sc.QuestDetailTasks`: the scrollable task list (one `sc.TaskEntry`
 *    per task, plus lang-edit hooks).
 *  - `sc.QuestDetailsSolved`: the solved-quest end description panel.
 *  - `sc.QuestCharacterView`: the small NPC portrait box for the quest
 *    owner (with NPC centering and background toggle).
 *  - `sc.QuestDetailsView`: the full detail box — title, type/level
 *    markers, location, owner, rewards (exp/money/CP/items with element
 *    icons), solved/elite styling and the task-switch hotkey.
 */
ig.module("game.feature.menu.gui.quests.quest-details")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.interact.button-group", "game.feature.menu.gui.quests.quest-entries", "game.feature.menu.gui.quests.quest-misc", "game.feature.npc.gui.npc-display-gui")
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

    sc.QuestDetailTasks = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 4,
            height: 8,
            left: 6,
            top: 8,
            right: 6,
            bottom: 8,
            offsets: {
                "default": {
                    x: 472,
                    y: 80
                },
                solved: {
                    x: 488,
                    y: 80
                },
                elite: {
                    x: 504,
                    y: 80
                }
            }
        }),
        container: null,
        content: null,

        init: function () {
            this.parent(270, 186);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPivot(270, 186);
            this.setPos(1, 1);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.content",
                    description: "sc.gui.menu.help.quest.description.content2"
                },
                offset: {
                    x: -2,
                    y: -2
                },
                size: {
                    x: 272,
                    y: 188
                },
                index: {
                    x: 1,
                    y: 1
                }
            };
            this.content = new ig.GuiElementBase;
            this.container = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.container.showTopBar = false;
            this.container.showBottomBar = false;
            this.container.setSize(268, 186);
            this.container.setPos(1, 0);
            this.addChildGui(this.container);
            this.container.setContent(this.content)
        },

        scroll: function (amount, animated) {
            this.container.scrollY(amount, animated, 0.05)
        },

        show: function (quest, animate, keepContent) {
            var taskCount = sc.quests.getCurrentTask(quest, true) + 1,
                entry = null,
                content = this.content,
                y = 5;
            if (!(content.hook.children.length >= 1 && keepContent)) {
                content.removeAllChildren();
                for (var i = 0; i < taskCount; i++) {
                    entry = new sc.TaskEntry(i, quest, false, true);
                    entry.doStateTransition("DEFAULT", true);
                    entry.setPos(4, y);
                    y = y + (entry.hook.size.y + 5);
                    ig.langEdit && ig.langEdit.submitCustomFile("Quest Task [" + (i + 1) + "]: " + quest.name, quest.tasks[i].task, "data/database.json");
                    content.addChildGui(entry)
                }
                content.setSize(266, y);
                this.container.recalculateScrollBars(true);
                this.container.setScrollY(0, true)
            }
            this.doStateTransition("DEFAULT", !animate)
        },

        hide: function () {
            this.doStateTransition("HIDDEN", true)
        }
    });

    sc.QuestDetailsSolved = ig.GuiElementBase.extend({
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
        endDescription: null,

        init: function () {
            this.parent();
            this.setSize(254, 186);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(11, 1);
            var solvedLine = new sc.SolvedLine;
            solvedLine.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            solvedLine.setPos(1, 2);
            solvedLine.setSize(249, 13);
            this.addChildGui(solvedLine);
            this.endDescription = new sc.TextGui("", {
                font: sc.fontsystem.smallFont,
                linePadding: 0,
                maxWidth: 254
            });
            this.endDescription.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.endDescription.setPos(0, 19);
            this.addChildGui(this.endDescription);
            this.hide()
        },

        show: function (quest) {
            this.endDescription.setText(quest.endDescription);
            this.doStateTransition("DEFAULT", true)
        },

        hide: function () {
            this.doStateTransition("HIDDEN", true)
        }
    });

    sc.QuestCharacterView = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 488,
                    y: 16
                },
                solved: {
                    x: 500,
                    y: 16
                },
                elite: {
                    x: 501,
                    y: 32
                }
            }
        }),
        display: null,
        container: null,
        hideBackground: false,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            }
        },

        init: function () {
            this.parent(31, 42);
            this.container = new ig.GuiElementBase;
            this.container.setSize(31, 42);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },

        setCharacter: function (character, immediate) {
            if (character) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (character) {
                    this.display = new sc.NPCDisplayGui(character, true, null, this.centerNPC.bind(this));
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                if (this.display) {
                    immediate ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true);
                    this.display = null
                }
                this.doStateTransition("HIDDEN", true)
            }
        },

        centerNPC: function (display) {
            if (display.npc) {
                this.hideBackground = display.hideBackground;
                display.setPos(this.container.hook.size.x / 2 - display.hook.size.x / 2 - 1 + display.displayOffset.x, this.container.hook.size.y / 2 - display.hook.size.y / 2 + display.displayOffset.y)
            }
        },

        updateDrawables: function (renderer) {
            this.hideBackground || this.parent(renderer)
        }
    });

    sc.QuestDetailsView = sc.QuestBaseBox.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.3
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        titleGui: null,
        descriptionGui: null,
        locationArea: null,
        locationMap: null,
        personTextGui: null,
        personCharGui: null,
        expGui: null,
        moneyGui: null,
        cpGui: null,
        itemsGui: null,
        atCurLevelGui: null,
        activeView: null,
        solvedView: null,
        buttongroup: null,
        taskButton: null,
        taskSwitch: null,
        lines: [],
        currentQuest: null,
        submitSound: null,

        init: function (taskButton) {
            this.parent(453, 265);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, 2);
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.type",
                    description: "sc.gui.menu.help.quest.description.type"
                },
                offset: {
                    x: 3,
                    y: 1
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
                    x: 428,
                    y: 1
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
                    title: "sc.gui.menu.help.quest.titles.location",
                    description: "sc.gui.menu.help.quest.description.location"
                },
                offset: {
                    x: 3,
                    y: 23
                },
                size: {
                    x: 32,
                    y: 20
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.annotation[3] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.owner",
                    description: "sc.gui.menu.help.quest.description.owner"
                },
                offset: {
                    x: 3,
                    y: 82
                },
                size: {
                    x: 32,
                    y: 20
                },
                index: {
                    x: 0,
                    y: 2
                }
            };
            this.annotation[4] = {
                content: {
                    title: "sc.gui.menu.help.quest.titles.rewards",
                    description: "sc.gui.menu.help.quest.description.rewards"
                },
                offset: {
                    x: 3,
                    y: 142
                },
                size: {
                    x: 32,
                    y: 20
                },
                index: {
                    x: 0,
                    y: 3
                }
            };
            this.taskButton = taskButton || null;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.doButtonTraversal = this.doButtonTraversal.bind(this);
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
            this.descriptionGui.setPos(188, 24);
            this.addChildGui(this.descriptionGui);
            this.personTextGui = new sc.TextGui("Ice Cream Dealer", {
                font: sc.fontsystem.smallFont
            });
            this.personTextGui.setPos(20, 102);
            this.addChildGui(this.personTextGui);
            this.atCurLevelGui = new sc.TextGui(ig.lang.get("sc.gui.menu.quests.atCurLvl"), {
                font: sc.fontsystem.tinyFont
            });
            this.atCurLevelGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.atCurLevelGui.setPos(275, 3);
            this.atCurLevelGui.hook.transitions = {
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
            this.addChildGui(this.atCurLevelGui);
            this.atCurLevelGui.doStateTransition("HIDDEN", true);
            var y = 160;
            this.expGui = new sc.TextGui("");
            this.expGui.setPos(20, y);
            this.addChildGui(this.expGui);
            y = y + 16;
            this.moneyGui = new sc.TextGui("");
            this.moneyGui.setPos(20, y);
            this.addChildGui(this.moneyGui);
            y = y + 16;
            this.cpGui = new sc.TextGui("");
            this.cpGui.setPos(20, y);
            this.addChildGui(this.cpGui);
            y = y + 16;
            this.itemsGui = new ig.GuiElementBase;
            this.itemsGui.setPos(20, y);
            this.addChildGui(this.itemsGui);
            var gfx = new ig.ImageGui(this.gfx, 418, 33, 12, 18);
            gfx.setPos(7, 25);
            this.addChildGui(gfx);
            gfx = new ig.ColorGui("#545454", 155, 1);
            gfx.setPos(20, 39);
            this.addChildGui(gfx);
            this.lines.push(gfx);
            gfx = new ig.ImageGui(this.gfx, 440, 64, 8, 8);
            gfx.setPos(21, 62);
            this.addChildGui(gfx);
            gfx = new ig.ImageGui(this.gfx, 433, 34, 22, 16);
            gfx.setPos(8, 85);
            this.addChildGui(gfx);
            gfx = new ig.ColorGui("#545454", 156, 1);
            gfx.setPos(19, 97);
            this.addChildGui(gfx);
            this.lines.push(gfx);
            gfx = new ig.ImageGui(this.gfx, 457, 37, 14, 10);
            gfx.setPos(8, 148);
            this.addChildGui(gfx);
            gfx = new ig.ColorGui("#545454", 152, 1);
            gfx.setPos(23, 154);
            this.addChildGui(gfx);
            this.lines.push(gfx);
            this.personCharGui = new sc.QuestCharacterView;
            this.personCharGui.setPos(143, 105);
            this.addChildGui(this.personCharGui);
            this.locationArea = new sc.TextGui("Rookie Harbor");
            this.locationArea.setPos(20, 43);
            this.addChildGui(this.locationArea);
            this.locationMap = new sc.TextGui("Marketplace");
            this.locationMap.setPos(32, 60);
            this.addChildGui(this.locationMap);
            this.solvedView = new sc.QuestDetailsSolved;
            this.addChildGui(this.solvedView);
            this.activeView = new sc.QuestDetailTasks;
            this.addChildGui(this.activeView);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            if (!ig.interact.isBlocked() && this.buttongroup.isActive() && this.activeView.isVisible()) {
                sc.control.menuScrollUp() ? this.activeView.scroll(-20) : sc.control.menuScrollDown() && this.activeView.scroll(20);
                sc.control.downDown() ? this.activeView.scroll(200 * ig.system.tick) : sc.control.upDown() && this.activeView.scroll(-200 * ig.system.tick)
            }
        },

        checkTaskSwitch: function () {
            this.submitSound && this.submitSound.play();
            (this.taskSwitch = !this.taskSwitch) ? this.activeView.show(this.currentQuest, false, true) : this.activeView.hide()
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function (quest) {
            this.personCharGui.setCharacter(null, true);
            this.taskButton.setText("\\i[help2]" + ig.lang.get("sc.gui.menu.quests.tasks"));
            this._setQuest(quest);
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.menu.updateHotkeys();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.currentQuest = null;
            this.taskSwitch = false;
            this.taskButton.setText("\\i[help2]" + ig.lang.get("sc.gui.menu.quests.fav"));
            this.taskButton.setActive(true);
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            sc.menu.updateHotkeys();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("HIDDEN", false, false, function () {
                this.personCharGui.setCharacter(null, true)
            }.bind(this))
        },

        _setQuest: function (quest) {
            this.currentQuest = quest;
            this.titleGui.setText(quest.name);
            this.descriptionGui.setText(quest.description);
            this.locationArea.setText(quest.location.area);
            this.locationMap.setText(quest.location.map);
            this.personCharGui.setCharacter(quest.character);
            this.setLevel(quest.level);
            var solved = sc.quests.isQuestSolved(quest.id),
                y = 160,
                line = null;
            this.setElite(quest.elite, solved);
            var hideRewards = quest.hideRewards & !solved;
            this.personTextGui.setText(solved ? quest.personAfter || quest.person || "???" : quest.person || "???");
            this.activeView.content.removeAllChildren();
            if (solved) {
                this.currentTileOffset = this.personCharGui.currentTileOffset = "solved";
                this.activeView.currentTileOffset = "solved";
                for (line = this.lines.length; line--;) this.lines[line].color = "#008277";
                this.taskButton.setActive(true)
            } else {
                if (quest.elite) {
                    this.currentTileOffset = this.personCharGui.currentTileOffset = "elite";
                    this.activeView.currentTileOffset = "elite"
                } else {
                    this.currentTileOffset = this.personCharGui.currentTileOffset = "default";
                    this.activeView.currentTileOffset = "default"
                }
                for (line = this.lines.length; line--;) this.lines[line].color = quest.elite ? "#8d0000" : "#545454";
                this.taskButton.setActive(false)
            }
            if (hideRewards) {
                if (quest.rewards.exp) {
                    this.expGui.setText("\\i[exp]????");
                    y = y + 16
                } else this.expGui.setText("");
                this.atCurLevelGui.doStateTransition("HIDDEN");
                if (quest.rewards.money) {
                    this.moneyGui.setText("\\i[credit]????????");
                    y = y + 16
                } else this.moneyGui.setText("");
                if (quest.rewards.cp) {
                    this.cpGui.setText("\\i[cp]????????");
                    y = y + 16
                } else this.cpGui.setText("")
            } else {
                if (quest.rewards.exp) {
                    line = "\\i[exp]" + (sc.model.player.getRawExpGain(quest.rewards.exp.exp, quest.level, sc.LEVEL_CURVES.QUEST) + "* ");
                    line = line + (quest.rewards.exp.bonus ? "+" + quest.rewards.exp.bonus : "");
                    this.expGui.setText(line);
                    this.expGui.hook.pos.y = y;
                    y = y + 16;
                    this.atCurLevelGui.doStateTransition("DEFAULT", true)
                } else {
                    this.expGui.setText("");
                    this.atCurLevelGui.doStateTransition("HIDDEN", true)
                }
                if (quest.rewards.money) {
                    this.moneyGui.setText("\\i[credit]" + (quest.rewards.money || 0));
                    this.moneyGui.hook.pos.y = y;
                    y = y + 16
                } else this.moneyGui.setText("");
                if (quest.rewards.cp) {
                    quest.rewards.cp.amount == 1 ? this.cpGui.setText("\\i[cp]" + getElementIcons(quest.rewards.cp.element)) : this.cpGui.setText("\\i[cp]" + getElementIcons(quest.rewards.cp.element) + "x " + (quest.rewards.cp.amount || 0));
                    this.cpGui.hook.pos.y = y;
                    y = y + 16
                } else this.cpGui.setText("")
            }
            this.itemsGui.removeAllChildren();
            if (quest.rewards.items) {
                this.itemsGui.hook.pos.y = y;
                for (var itemsGui = this.itemsGui, items = quest.rewards.items, gfx = this.gfx, itemY = 0, i = 0; i < items.length; i++) {
                    var amount = items[i].amount,
                        item = sc.inventory.getItem(items[i].id),
                        label = "\\i[" + (item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) || "item-default") + "]",
                        label = hideRewards ? label + "?????????????" : label + ig.LangLabel.getText(item.name);
                    amount > 1 && (label = label + (" x " + amount));
                    var level = 0;
                    item.type == sc.ITEMS_TYPES.EQUIP && (level = item.level || 0);
                    var textGui = new sc.TextGui(label);
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
            if (solved) {
                this.activeView.hide();
                this.solvedView.show(quest)
            } else {
                this.solvedView.hide();
                this.activeView.show(quest)
            }
        },

        doButtonTraversal: function () {
            sc.control.menuBack() && this.buttongroup.invokeBackButton()
        },

        onBackButtonPress: function () {
            this.hide();
            sc.menu.popBackCallback();
            sc.menu.leaveQuestDetails()
        },

        modelChanged: function (model, event, data) {
            model == sc.menu && event == sc.MENU_EVENT.QUEST_ENTER_DEAILS && this.show(data)
        }
    })
});
ig.baked = !0;
