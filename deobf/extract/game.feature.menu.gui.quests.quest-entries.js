ig.module("game.feature.menu.gui.quests.quest-entries").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
    sc.SubTaskEntryBase = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 4,
            top: 13,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 488,
                    y: 0
                }
            }
        }),
        quest: null,
        taskIndex: null,
        subTaskIndex: null,
        subTask: null,
        textGui: null,
        done: false,
        init: function(b, a, d, c) {
            this.parent(150, 13);
            this.setPivot(75, 6.5);
            this.quest = b || null;
            this.taskIndex = a || 0;
            this.textGui = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setPos(6, -1);
            this.addChildGui(this.textGui);
            this.createUI && this.createUI();
            this.setSubTask(d, c)
        },
        setSubTask: function(b, a) {
            this.subTaskIndex = b;
            (this.subTask = a) && this.onSubTaskChange && this.onSubTaskChange()
        },
        getState: function() {
            return sc.quests.getSubTaskState(this.quest, this.taskIndex, this.subTaskIndex)
        }
    });
    sc.SubTaskEntry = {};
    sc.SubTaskEntry.COLLECT = sc.SubTaskEntryBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        numberGui: null,
        maxNumberGui: null,
        _done: false,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },
        onSubTaskChange: function() {
            var b = sc.model.player.getItemAmount(this.subTask.item),
                a = this.subTask.amount;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || b >=
                a;
            var d = sc.inventory.getItem(this.subTask.item || 0),
                c = this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]",
                c = this.subTask.hideName && !this.done ? b >= 1 ? c + ig.LangLabel.getText(d.name) : c + "???????????????" : c + ig.LangLabel.getText(d.name);
            this.textGui.setText(c);
            this.numberGui.setNumber(this.done ? a : Math.min(b, a));
            this.maxNumberGui.setNumber(a);
            if (this.subTask.hideMax && !this.done) {
                this.maxNumberGui.setNumber(99);
                this.maxNumberGui.scramble = true
            } else this.maxNumberGui.scramble = false
        },
        createUI: function() {
            this.numberGui =
                new sc.NumberGui(99, {
                    size: sc.NUMBER_SIZE.SMALL
                });
            this.numberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.numberGui.setPos(22, 2);
            this.addChildGui(this.numberGui);
            this.maxNumberGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL
            });
            this.maxNumberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxNumberGui.setPos(4, 2);
            this.addChildGui(this.maxNumberGui)
        }
    });
    sc.SubTaskEntry.LANDMARK = sc.SubTaskEntryBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        numberGui: null,
        maxNumberGui: null,
        _done: false,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },
        onSubTaskChange: function() {
            var b = sc.map.getTotalLandmarksFoundInArea(this.subTask.area),
                a = this.subTask.amount;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || b >= a;
            var d = sc.map.getAreaName(this.subTask.area);
            this.textGui.setText((this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + d);
            this.numberGui.setNumber(this.done ?
                a : Math.min(b, a));
            this.maxNumberGui.setNumber(a)
        },
        createUI: function() {
            this.numberGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL
            });
            this.numberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.numberGui.setPos(22, 2);
            this.addChildGui(this.numberGui);
            this.maxNumberGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL
            });
            this.maxNumberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxNumberGui.setPos(4, 2);
            this.addChildGui(this.maxNumberGui)
        }
    });
    sc.SubTaskEntry.KILL = sc.SubTaskEntryBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        numberGui: null,
        maxNumberGui: null,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },
        onSubTaskChange: function() {
            var b = this.getState().killed,
                a = this.subTask.amount,
                d = this.subTask.enemy;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || b >= a;
            this.textGui.setText((this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + sc.combat.getEnemyName(d));
            this.numberGui.setNumber(this.done ?
                a : b);
            this.maxNumberGui.setNumber(a)
        },
        createUI: function() {
            this.numberGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL
            });
            this.numberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.numberGui.setPos(22, 2);
            this.addChildGui(this.numberGui);
            this.maxNumberGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL
            });
            this.maxNumberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxNumberGui.setPos(4, 2);
            this.addChildGui(this.maxNumberGui)
        }
    });
    sc.SubTaskEntry.CONDITION = sc.SubTaskEntryBase.extend({
        init: function(b,
            a, d, c) {
            this.parent(b, a, d, c)
        },
        onSubTaskChange: function() {
            var b = sc.quests.isQuestLabelSolved(this.quest, this.subTask.label);
            this.done = b;
            var a = "",
                a = this.hook.size.x < 240 && this.subTask.short ? this.subTask.short : this.subTask.text;
            this.textGui.setText((b ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + a)
        }
    });
    sc.SubTaskEntry.QUEST = sc.SubTaskEntryBase.extend({
        init: function(b, a, d, c) {
            this.parent(b, a, d, c)
        },
        onSubTaskChange: function() {
            var b = sc.quests.isQuestSolved(this.subTask.quest);
            this.done = b;
            var a = "",
                a = this.hook.size.x <
                240 && this.subTask.short ? this.subTask.short : this.subTask.text;
            this.textGui.setText((b ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + a)
        }
    });
    sc.TaskEntry = ig.GuiElementBase.extend({
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
        taskIndex: null,
        quest: null,
        taskText: null,
        taskDoneIcon: null,
        _subtasks: [],
        init: function(b, a, d, c) {
            this.parent();
            this.taskDoneIcon = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.taskText =
                new sc.TextGui("", {
                    font: sc.fontsystem.smallFont
                });
            this.taskText.setPos(17, 0);
            this.setTask(b, a, d, c);
            this.doStateTransition("HIDDEN", true)
        },
        setTask: function(b, a, d, c, e) {
            this.taskIndex = b != void 0 ? b : void 0;
            this.quest = a || null;
            this.removeAllChildren();
            this._subtasks.length = 0;
            if (b != void 0) {
                var f = this.quest.tasks[this.taskIndex];
                this.addChildGui(this.taskDoneIcon);
                this.addChildGui(this.taskText);
                if (f.subTasks.length != 0) {
                    if (e) {
                        this.taskText.setMaxWidth(260);
                        for (var g = 0, h = 0, b = 0; b < a.tasks.length; b++)
                            for (var i =
                                    0; i < a.tasks[b].subTasks.length; i++) {
                                sc.quests.isSubTaskDone(a, b, i) && h++;
                                g++
                            }
                        this.taskText.setText(a.name.toString() + " - " + Math.floor(h / g * 100) + "%")
                    } else {
                        this.taskText.setMaxWidth(c ? 240 : 150);
                        this.taskText.setText(f.task)
                    }
                    g = this.taskText.hook.size.y + 1;
                    h = null;
                    f = f.subTasks;
                    i = true;
                    if (f.length == 1 && f[0].type == "CONDITION") i = sc.quests.isQuestLabelSolved(a, f[0].label);
                    else if (f.length == 1 && f[0].type == "QUEST") i = sc.quests.isQuestSolved(f[0].quest);
                    else
                        for (b = 0; b < f.length; b++) {
                            h = new sc.SubTaskEntry[f[b].type](a,
                                this.taskIndex, b);
                            h.setPos(15, g);
                            c && h.setSize(240, 13);
                            h.setSubTask(b, f[b]);
                            h.done || (i = false);
                            d && h.doStateTransition("HIDDEN", true);
                            if (!e) {
                                g = g + 14;
                                this.addChildGui(h);
                                this._subtasks.push(h)
                            }
                        }
                    this.taskDoneIcon.setText(i ? "\\i[quest-ok]" : "\\i[quest-no]");
                    this.setSize(c ? 260 : 165, g - 13 + 15)
                }
            }
        },
        show: function(b, a) {
            for (var d = a || 0, c = 0; c < this._subtasks.length; c++) {
                this._subtasks[c].doStateTransition("DEFAULT", false, false, null, d);
                b && (d = d + 0.016)
            }
        },
        _addSubTaskTask: function() {}
    })
});
ig.baked = !0;
