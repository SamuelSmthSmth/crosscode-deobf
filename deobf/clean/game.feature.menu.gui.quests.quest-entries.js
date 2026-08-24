/**
 * game.feature.menu.gui.quests.quest-entries
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.quests.quest-entries")`.
 *
 * Quest log entries:
 *  - `sc.SubTaskEntryBase`: one sub-task row; `sc.SubTaskEntry.COLLECT`
 *    (item count), `.LANDMARK` (landmarks found), `.KILL` (enemy kills),
 *    `.CONDITION` (label solved) and `.QUEST` (other quest solved).
 *  - `sc.TaskEntry`: one task row with its sub-task list and a done icon,
 *    plus a percent-complete variant used by the sidequest/task list.
 */
ig.module("game.feature.menu.gui.quests.quest-entries")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui")
    .defines(function () {

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

        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(150, 13);
            this.setPivot(75, 6.5);
            this.quest = quest || null;
            this.taskIndex = taskIndex || 0;
            this.textGui = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setPos(6, -1);
            this.addChildGui(this.textGui);
            this.createUI && this.createUI();
            this.setSubTask(subTaskIndex, subTask)
        },

        setSubTask: function (subTaskIndex, subTask) {
            this.subTaskIndex = subTaskIndex;
            (this.subTask = subTask) && this.onSubTaskChange && this.onSubTaskChange()
        },

        getState: function () {
            return sc.quests.getSubTaskState(this.quest, this.taskIndex, this.subTaskIndex)
        }
    });

    sc.SubTaskEntry = {};

    sc.SubTaskEntry.COLLECT = sc.SubTaskEntryBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        numberGui: null,
        maxNumberGui: null,
        _done: false,

        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(quest, taskIndex, subTaskIndex, subTask)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },

        onSubTaskChange: function () {
            var owned = sc.model.player.getItemAmount(this.subTask.item),
                amount = this.subTask.amount;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || owned >= amount;
            var item = sc.inventory.getItem(this.subTask.item || 0),
                icon = this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]",
                text = this.subTask.hideName && !this.done ? owned >= 1 ? icon + ig.LangLabel.getText(item.name) : icon + "???????????????" : icon + ig.LangLabel.getText(item.name);
            this.textGui.setText(text);
            this.numberGui.setNumber(this.done ? amount : Math.min(owned, amount));
            this.maxNumberGui.setNumber(amount);
            if (this.subTask.hideMax && !this.done) {
                this.maxNumberGui.setNumber(99);
                this.maxNumberGui.scramble = true
            } else this.maxNumberGui.scramble = false
        },

        createUI: function () {
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

    sc.SubTaskEntry.LANDMARK = sc.SubTaskEntryBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        numberGui: null,
        maxNumberGui: null,
        _done: false,

        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(quest, taskIndex, subTaskIndex, subTask)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },

        onSubTaskChange: function () {
            var found = sc.map.getTotalLandmarksFoundInArea(this.subTask.area),
                amount = this.subTask.amount;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || found >= amount;
            var areaName = sc.map.getAreaName(this.subTask.area);
            this.textGui.setText((this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + areaName);
            this.numberGui.setNumber(this.done ? amount : Math.min(found, amount));
            this.maxNumberGui.setNumber(amount)
        },

        createUI: function () {
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

        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(quest, taskIndex, subTaskIndex, subTask)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addGfx(this.gfx, this.hook.size.x - 21, 2, 73, 56, 4, 8)
        },

        onSubTaskChange: function () {
            var killed = this.getState().killed,
                amount = this.subTask.amount,
                enemy = this.subTask.enemy;
            this.done = sc.quests.isQuestSolved(this.quest.id) || sc.quests.isTaskDone(this.quest, this.taskIndex) || killed >= amount;
            this.textGui.setText((this.done ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + sc.combat.getEnemyName(enemy));
            this.numberGui.setNumber(this.done ? amount : killed);
            this.maxNumberGui.setNumber(amount)
        },

        createUI: function () {
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
        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(quest, taskIndex, subTaskIndex, subTask)
        },

        onSubTaskChange: function () {
            var solved = sc.quests.isQuestLabelSolved(this.quest, this.subTask.label);
            this.done = solved;
            var text = "",
                text = this.hook.size.x < 240 && this.subTask.short ? this.subTask.short : this.subTask.text;
            this.textGui.setText((solved ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + text)
        }
    });

    sc.SubTaskEntry.QUEST = sc.SubTaskEntryBase.extend({
        init: function (quest, taskIndex, subTaskIndex, subTask) {
            this.parent(quest, taskIndex, subTaskIndex, subTask)
        },

        onSubTaskChange: function () {
            var solved = sc.quests.isQuestSolved(this.subTask.quest);
            this.done = solved;
            var text = "",
                text = this.hook.size.x < 240 && this.subTask.short ? this.subTask.short : this.subTask.text;
            this.textGui.setText((solved ? "\\i[quest-mini-ok]" : "\\i[quest-mini-no]") + text)
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

        init: function (taskIndex, quest, hidden, isSmall) {
            this.parent();
            this.taskDoneIcon = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.taskText = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.taskText.setPos(17, 0);
            this.setTask(taskIndex, quest, hidden, isSmall);
            this.doStateTransition("HIDDEN", true)
        },

        setTask: function (taskIndex, quest, hidden, isSmall, showProgress) {
            this.taskIndex = taskIndex != void 0 ? taskIndex : void 0;
            this.quest = quest || null;
            this.removeAllChildren();
            this._subtasks.length = 0;
            if (taskIndex != void 0) {
                var task = this.quest.tasks[this.taskIndex];
                this.addChildGui(this.taskDoneIcon);
                this.addChildGui(this.taskText);
                if (task.subTasks.length != 0) {
                    if (showProgress) {
                        this.taskText.setMaxWidth(260);
                        for (var total = 0, done = 0, i = 0; i < quest.tasks.length; i++)
                            for (var j = 0; j < quest.tasks[i].subTasks.length; j++) {
                                sc.quests.isSubTaskDone(quest, i, j) && done++;
                                total++
                            }
                        this.taskText.setText(quest.name.toString() + " - " + Math.floor(done / total * 100) + "%")
                    } else {
                        this.taskText.setMaxWidth(isSmall ? 240 : 150);
                        this.taskText.setText(task.task)
                    }
                    var y = this.taskText.hook.size.y + 1;
                    var subTask = null;
                    var subTasks = task.subTasks;
                    var allDone = true;
                    if (subTasks.length == 1 && subTasks[0].type == "CONDITION") allDone = sc.quests.isQuestLabelSolved(quest, subTasks[0].label);
                    else if (subTasks.length == 1 && subTasks[0].type == "QUEST") allDone = sc.quests.isQuestSolved(subTasks[0].quest);
                    else
                        for (i = 0; i < subTasks.length; i++) {
                            subTask = new sc.SubTaskEntry[subTasks[i].type](quest, this.taskIndex, i);
                            subTask.setPos(15, y);
                            isSmall && subTask.setSize(240, 13);
                            subTask.setSubTask(i, subTasks[i]);
                            subTask.done || (allDone = false);
                            hidden && subTask.doStateTransition("HIDDEN", true);
                            if (!showProgress) {
                                y = y + 14;
                                this.addChildGui(subTask);
                                this._subtasks.push(subTask)
                            }
                        }
                    this.taskDoneIcon.setText(allDone ? "\\i[quest-ok]" : "\\i[quest-no]");
                    this.setSize(isSmall ? 260 : 165, y - 13 + 15)
                }
            }
        },

        show: function (animate, delay) {
            for (var d = delay || 0, i = 0; i < this._subtasks.length; i++) {
                this._subtasks[i].doStateTransition("DEFAULT", false, false, null, d);
                animate && (d = d + 0.016)
            }
        },

        _addSubTaskTask: function () {}
    })
});
ig.baked = !0;
