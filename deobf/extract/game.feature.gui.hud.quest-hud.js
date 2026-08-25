ig.module("game.feature.gui.hud.quest-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.gui.quests.quest-entries").defines(function() {
    var b = /\\c\[\d\]/g;
    sc.QuestUpdateEntry = ig.GuiElementBase.extend({
        timer: 0,
        id: null,
        textGui: null,
        init: function(a, d) {
            this.parent();
            this.id = a || null;
            this.timer = 5;
            var c = d.task.toString().replace(b, ""),
                e = null,
                e = sc.options.get("quest-show-current") ? ": \\c[3]" + c + "\\c[0]" + ig.lang.get("sc.gui.quest-hud.taskDone2") + "!" : ig.lang.get("sc.gui.quest-hud.nextTask") + ": \\c[3]" +
                c + "\\c[0]";
            this.textGui = new sc.TextGui(e, {
                font: sc.fontsystem.tinyFont,
                maxWidth: 150
            });
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
        },
        updateTimer: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        }
    });
    sc.QuestUpdateHud = sc.RightHudBoxGui.extend({
        delayedStack: [],
        init: function() {
            this.parent(ig.lang.get("sc.gui.quest-hud.taskUpdated"));
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.quests, this)
        },
        addEntry: function(a, b) {
            var c = null;
            if ((c = this._isInEntries(b.id)) != null) c.timer = 5;
            else {
                c = Math.max(0, a.currentTask - (sc.options.get("quest-show-current") ? 1 : 0));
                c = new sc.QuestUpdateEntry(b.id + c, b.tasks[c]);
                this.contentEntries.length >= 3 ? this.delayedStack.push(c) : this.pushContent(c, !sc.model.isCutscene());
                this.hidden && !sc.model.isCutscene() && this.show()
            }
        },
        _isInEntries: function(a) {
            for (var b = this.contentEntries.length; b--;)
                if (this.contentEntries[b].subGui.id == a) return this.contentEntries[b].subGui;
            for (b = this.delayedStack.length; b--;)
                if (this.delayedStack[b].id ==
                    a) return this.delayedStack[b];
            return null
        },
        _popDelayed: function() {
            if (this.delayedStack.length != 0) {
                var a = this.delayedStack.splice(0, 1)[0];
                this.pushContent(a, true)
            }
        },
        update: function() {
            if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
                for (var a = this.contentEntries.length, b = null; a--;) {
                    b = this.contentEntries[a].subGui;
                    b.updateTimer();
                    if (b.timer <= 0) {
                        b = this.removeContent(a);
                        if (a == 0 && this.contentEntries.length == 0) b.hook.pivot.y = b.hook.size.y / 2;
                        else {
                            b.hook.pivot.y = 0;
                            b.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT
                        }
                        this._popDelayed()
                    }
                }!this.hidden &&
                    this.contentEntries.length == 0 && this.hide()
            }
        },
        modelChanged: function(a, b, c) {
            if (a == sc.model)
                if (a.isReset()) {
                    this.clearContent();
                    this.hide()
                } else a.isCutscene() || a.isMenu() || a.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() || a.isForceCombat() ? this.hide() : !a.isCutscene() && (!a.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
            else a == sc.quests && (b == sc.QUEST_MODEL_EVENT.TASK_DONE && sc.options.get("update-quest-style") == sc.UPDATE_QUEST_STYLE.SMALL && c && c.state &&
                !c.state.skipPreviousTask()) && this.addEntry(c.state, c.quest)
        }
    });
    sc.FavQuestHud = sc.RightHudBoxGui.extend({
        task: null,
        init: function() {
            this.parent(ig.lang.get("sc.gui.quest-hud.title"));
            this.task = new sc.TaskEntry;
            this.task.doStateTransition("DEFAULT", true);
            this.task.setPos(40, 3);
            this.pushContent(this.task, false);
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.quests, this);
            sc.Model.addObserver(sc.options, this)
        },
        setFavQuest: function(a) {
            if (a == -1 || sc.quests.isMarkedQuestDone()) this.hide();
            else {
                a =
                    sc.options.get("min-quest");
                this.task.setTask(sc.quests.getCurrentMarkedQuestTaskIndex(), sc.quests.getMarkedQuest(), false, false, a);
                this.task.hook.align.x = a ? ig.GUI_ALIGN.X_LEFT : ig.GUI_ALIGN.X_RIGHT;
                this.contentEntries[0].setSize(this.task.hook.size.x + 4 + (a ? 5 : 0), this.task.hook.size.y + 1);
                this.rearrangeContent();
                this._isVisible() && this.show(false, 0)
            }
        },
        _isVisible: function() {
            return !sc.model.isCutscene() && !sc.model.isHUDBlocked() && !sc.model.isForceCombat() && !sc.quests.hasQuestSolvedDialogs()
        },
        modelChanged: function(a,
            b, c) {
            if (a == sc.model) {
                if ((b == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || b == sc.GAME_MODEL_MSG.STATE_CHANGED) && !a.isTeleport() && !a.isLoading())
                    if (a.isReset()) {
                        this.setFavQuest(-1);
                        this.hide()
                    } else !this._isVisible() || a.isMenu() ? this.hide() : sc.quests.focusQuest != -1 && !sc.quests.isMarkedQuestDone() && this.show(false, 0.2)
            } else a == sc.quests ? b == sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED || b == sc.QUEST_MODEL_EVENT.FINISHED ? c != sc.quests.focusQuest && this.setFavQuest(sc.quests.focusQuest) : (b == sc.QUEST_MODEL_EVENT.UPDATE || b ==
                sc.QUEST_MODEL_EVENT.TASK_DONE || b == sc.QUEST_MODEL_EVENT.TASK_UNDONE) && this.setFavQuest(sc.quests.focusQuest) : a == sc.options && b == sc.OPTIONS_EVENT.OPTION_CHANGED && this.setFavQuest(sc.quests.focusQuest)
        }
    })
});
ig.baked = !0;
