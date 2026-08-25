ig.module("game.feature.menu.gui.synop.synop-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.quests.quest-entries").defines(function() {
    sc.LOG_GUI_TYPE = {};
    sc.LogGuiTypeBase = ig.GuiElementBase.extend({
        iconGui: null,
        textGui: null,
        type: null,
        init: function(b) {
            this.parent();
            this.setSize(376, 18);
            this.type = b.type || sc.LOG_TYPES.STORY;
            this.iconGui = new sc.TextGui("\\i[logs-" + this.type + "]");
            this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.iconGui);
            this.textGui = new sc.TextGui("");
            this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.textGui.setPos(14, 0);
            this.addChildGui(this.textGui)
        }
    });
    sc.LOG_GUI_TYPE.LANDMARK = sc.LogGuiTypeBase.extend({
        init: function(b) {
            this.parent(b);
            var a = ig.lang.get("sc.gui.menu.synopsis-menu.types.landmark"),
                a = a + ("\\c[3]" + sc.map.getLandmarkName(b.landmark, b.area) + "\\c[0]");
            this.textGui.setText(a);
            this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_TOP);
            a = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.lm") + sc.map.getAreaName(b.area);
            this.areaGui = new sc.TextGui(a, {
                font: sc.fontsystem.smallFont
            });
            this.areaGui.setPos(6, 16);
            this.addChildGui(this.areaGui);
            this.setSize(376, 28)
        }
    });
    sc.LOG_GUI_TYPE.TRADER = sc.LogGuiTypeBase.extend({
        init: function(b) {
            this.parent(b);
            var a = null,
                a = b.isUpdate ? ig.lang.get("sc.gui.menu.synopsis-menu.types.traderUpdate") : ig.lang.get("sc.gui.menu.synopsis-menu.types.trader"),
                a = a + ("\\c[3]" + sc.trade.getTraderName(b.trader) +
                    "\\c[0]");
            this.textGui.setText(a);
            this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            b = sc.trade.getFoundTrader(b.trader);
            a = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.lm") + b.area.toString() + " - " + b.map.toString();
            this.areaGui = new sc.TextGui(a, {
                font: sc.fontsystem.smallFont
            });
            this.areaGui.setPos(6, 16);
            this.addChildGui(this.areaGui);
            this.setSize(376, 28)
        }
    });
    sc.LOG_GUI_TYPE.TRADER.isAvailable = function(b) {
        return sc.trade.getTrader(b.trader)
    };
    sc.LOG_GUI_TYPE.LORE = sc.LogGuiTypeBase.extend({
        init: function(b) {
            this.parent(b);
            this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.textGui.setMaxWidth(360);
            var a = "",
                a = b.update ? ig.lang.get("sc.gui.menu.synopsis-menu.types.loreUpdated") : ig.lang.get("sc.gui.menu.synopsis-menu.types.lore"),
                a = (b = sc.lore.getLore(b.lore)) ? a + ("\\c[3]" + ig.LangLabel.getText(b.title) + "\\c[0]") : a + "\\c[3]???\\c[0]";
            this.textGui.setText(a);
            this.setSize(376, Math.max(18, this.textGui.hook.size.y + 2))
        }
    });
    sc.LOG_GUI_TYPE.TROPHY =
        sc.LogGuiTypeBase.extend({
            init: function(b) {
                this.parent(b);
                var a = ig.lang.get("sc.gui.menu.synopsis-menu.types.trophy"),
                    a = a + (" \\c[3]" + sc.trophies.getTrophyName(b.trophy) + "\\c[0]");
                this.textGui.setText(a)
            }
        });
    sc.LOG_GUI_TYPE.DROP = sc.LogGuiTypeBase.extend({
        init: function(b) {
            this.parent(b);
            var a = ig.lang.get("sc.gui.menu.synopsis-menu.types.dropCompleted"),
                a = a + ("\\c[3]" + sc.menu.getDropName(b.drop) + "\\c[0]");
            this.textGui.setText(a)
        }
    });
    sc.LOG_GUI_TYPE.QUEST = sc.LogGuiTypeBase.extend({
        init: function(b) {
            this.parent(b);
            var a = "";
            if (b.task != void 0) {
                a = ig.lang.get("sc.gui.menu.synopsis-menu.types.questTask");
                this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                var d = sc.quests.getQuestTask(b.quest, b.task),
                    a = a + ("\\c[3]" + sc.quests.getQuestName(b.quest) + "\\c[0]");
                this.textGui.setText(a);
                a = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.qtm");
                b = new sc.TextGui(a, {
                    font: sc.fontsystem.smallFont
                });
                b.setPos(6, 16);
                this.addChildGui(b);
                a = Math.max(72,
                    b.hook.size.x + 8);
                d = new sc.TextGui(d.task, {
                    font: sc.fontsystem.smallFont,
                    maxWidth: 360 - b.hook.size.x - 2
                });
                d.setPos(a, 16);
                this.addChildGui(d);
                this.setSize(376, 14 + d.hook.size.y)
            } else if (b.finish) {
                a = ig.lang.get("sc.gui.menu.synopsis-menu.types.questFinish");
                d = sc.quests.getStaticQuest(b.quest);
                a = a + ("\\c[3]" + (d ? d.name : "????") + "\\c[0]");
                this.textGui.setText(a)
            } else if (b.accept) {
                a = ig.lang.get("sc.gui.menu.synopsis-menu.types.questStart");
                d = sc.quests.getStaticQuest(b.quest);
                a = a + ("\\c[3]" + (d ? d.name : "????") + "\\c[0]");
                this.textGui.setText(a)
            }
        }
    });
    sc.SynopsisLogDisplay = sc.HeaderMenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -204.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        content: null,
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.log"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(384, 206);
            this.setPos(25, 85);
            this.content = new ig.GuiElementBase;
            this.content.setPos(4, 9);
            this.content.setSize(376, 195);
            this.addChildGui(this.content);
            this.header.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.synopsis.titles.activity",
                    description: "sc.gui.menu.help.synopsis.description.activity"
                },
                offset: {
                    x: -3,
                    y: -2
                },
                size: {
                    x: "dyn",
                    y: 11,
                    offX: 6
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.doStateTransition("DEFAULT");
            this.content.removeAllChildren();
            this.setPos(25, 80);
            this.setSize(384, 206);
            for (var b = sc.menu.logEntries, a = b.length, d = null, c = 1, e = this.hook.size.y - 10; a--;) {
                d = b[a];
                if ((sc.model.player.hasItem(135) ||
                        d.type != "LORE") && (!sc.LOG_GUI_TYPE[d.type].isAvailable || sc.LOG_GUI_TYPE[d.type].isAvailable(d))) {
                    d = new sc.LOG_GUI_TYPE[d.type](d);
                    d.setPos(0, c);
                    c = c + d.hook.size.y;
                    e = e - d.hook.size.y;
                    if (e > 0) this.content.addChildGui(d);
                    else break
                }
            }
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    });
    sc.SynopsisTaskDisplay = sc.HeaderMenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -204.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        task: null,
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.task"),
                sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(384, 46);
            this.setPos(25, 29);
            this.task = new sc.TextGui(ig.lang.get("sc.gui.menu.synopsis-menu.notask"), {
                maxWidth: 374
            });
            this.task.setPos(5, 11);
            this.addChildGui(this.task);
            this.header.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.synopsis.titles.objective",
                    description: "sc.gui.menu.help.synopsis.description.objective"
                },
                offset: {
                    x: -3,
                    y: -2
                },
                size: {
                    x: "dyn",
                    y: 11,
                    offX: 6
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            var b = sc.model.currentTask ||
                sc.model.permaTask;
            if (b) {
                this.task.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                this.task.hook.pos.y = 11
            } else {
                this.task.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.task.hook.pos.y = 5
            }
            this.task.setText(b || ig.lang.get("sc.gui.menu.synopsis-menu.notask"));
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    });
    sc.SynopsisQuestDisplay = sc.HeaderMenuPanel.extend({
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
                    offsetX: -204.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        questNameGui: null,
        taskGUI: null,
        quest: null,
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.favquest"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(384, 109);
            this.setPos(25, 80);
            this.questNameGui = new sc.TextGui("");
            this.addChildGui(this.questNameGui);
            this.taskGUI = new sc.TaskEntry;
            this.taskGUI.setPos(30, 34);
            this.addChildGui(this.taskGUI);
            this.header.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.synopsis.titles.quest",
                    description: "sc.gui.menu.help.synopsis.description.quest"
                },
                offset: {
                    x: -3,
                    y: -2
                },
                size: {
                    x: "dyn",
                    y: 11,
                    offX: 6
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        setQuest: function(b) {
            if (b) {
                this.quest = b;
                this.taskGUI.doStateTransition("DEFAULT", true);
                this.questNameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                this.questNameGui.setPos(4, 11);
                this.questNameGui.setText("\\i[quest-fav]" + b.name);
                this.taskGUI.setTask(sc.quests.getCurrentMarkedQuestTaskIndex(), this.quest, true, true);
                this.taskGUI.show(true,
                    0.1);
                this.setSize(384, 34 + this.taskGUI.hook.size.y)
            } else {
                this.quest = null;
                this.questNameGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.questNameGui.setPos(4, 11);
                this.questNameGui.setText(ig.lang.get("sc.gui.menu.synopsis-menu.noquest"));
                this.taskGUI.doStateTransition("HIDDEN", true);
                this.setSize(384, 30)
            }
        },
        updateDrawables: function(b) {
            this.parent(b);
            this.quest && b.addGfx(this.gfx, 10, 30, 416, 53, 17, 16)
        },
        show: function() {
            this.setQuest(sc.quests.getMarkedQuest());
            this.doStateTransition("DEFAULT")
        },
        hide: function(b) {
            this.doStateTransition("HIDDEN", b)
        }
    })
});
ig.baked = !0;
