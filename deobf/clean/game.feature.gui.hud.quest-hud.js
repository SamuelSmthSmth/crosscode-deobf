/**
 * @module game.feature.gui.hud.quest-hud
 * @description sc.QuestUpdateHud: right-HUD box announcing quest task progress
 *   updates, and sc.FavQuestHud: the pinned/favourite quest tracker box.
 */
ig.module("game.feature.gui.hud.quest-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.gui.quests.quest-entries").defines(function() {
	var colorRegex = /\\c\[\d\]/g;
	sc.QuestUpdateEntry = ig.GuiElementBase.extend({
		timer: 0,
		id: null,
		textGui: null,
		init: function(id, task) {
			this.parent();
			this.id = id || null;
			this.timer = 5;
			var taskText = task.task.toString().replace(colorRegex, ""),
				text = null,
				text = sc.options.get("quest-show-current") ? ": \\c[3]" + taskText + "\\c[0]" + ig.lang.get("sc.gui.quest-hud.taskDone2") + "!" : ig.lang.get("sc.gui.quest-hud.nextTask") + ": \\c[3]" + taskText + "\\c[0]";
			this.textGui = new sc.TextGui(text, {
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
		addEntry: function(state, quest) {
			var entry = null;
			if ((entry = this._isInEntries(quest.id)) != null) entry.timer = 5;
			else {
				entry = Math.max(0, state.currentTask - (sc.options.get("quest-show-current") ? 1 : 0));
				entry = new sc.QuestUpdateEntry(quest.id + entry, quest.tasks[entry]);
				this.contentEntries.length >= 3 ? this.delayedStack.push(entry) : this.pushContent(entry, !sc.model.isCutscene());
				this.hidden && !sc.model.isCutscene() && this.show()
			}
		},
		_isInEntries: function(id) {
			for (var i = this.contentEntries.length; i--;)
				if (this.contentEntries[i].subGui.id == id) return this.contentEntries[i].subGui;
			for (i = this.delayedStack.length; i--;)
				if (this.delayedStack[i].id == id) return this.delayedStack[i];
			return null
		},
		_popDelayed: function() {
			if (this.delayedStack.length != 0) {
				var entry = this.delayedStack.splice(0, 1)[0];
				this.pushContent(entry, true)
			}
		},
		update: function() {
			if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
				for (var i = this.contentEntries.length, entry = null; i--;) {
					entry = this.contentEntries[i].subGui;
					entry.updateTimer();
					if (entry.timer <= 0) {
						entry = this.removeContent(i);
						if (i == 0 && this.contentEntries.length == 0) entry.hook.pivot.y = entry.hook.size.y / 2;
						else {
							entry.hook.pivot.y = 0;
							entry.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT
						}
						this._popDelayed()
					}
				}!this.hidden && this.contentEntries.length == 0 && this.hide()
			}
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model)
				if (model.isReset()) {
					this.clearContent();
					this.hide()
				} else model.isCutscene() || model.isMenu() || model.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() || model.isForceCombat() ? this.hide() : !model.isCutscene() && (!model.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
			else model == sc.quests && (msg == sc.QUEST_MODEL_EVENT.TASK_DONE && sc.options.get("update-quest-style") == sc.UPDATE_QUEST_STYLE.SMALL && data && data.state && !data.state.skipPreviousTask()) && this.addEntry(data.state, data.quest)
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
		setFavQuest: function(focusQuest) {
			if (focusQuest == -1 || sc.quests.isMarkedQuestDone()) this.hide();
			else {
				var minQuest = sc.options.get("min-quest");
				this.task.setTask(sc.quests.getCurrentMarkedQuestTaskIndex(), sc.quests.getMarkedQuest(), false, false, minQuest);
				this.task.hook.align.x = minQuest ? ig.GUI_ALIGN.X_LEFT : ig.GUI_ALIGN.X_RIGHT;
				this.contentEntries[0].setSize(this.task.hook.size.x + 4 + (minQuest ? 5 : 0), this.task.hook.size.y + 1);
				this.rearrangeContent();
				this._isVisible() && this.show(false, 0)
			}
		},
		_isVisible: function() {
			return !sc.model.isCutscene() && !sc.model.isHUDBlocked() && !sc.model.isForceCombat() && !sc.quests.hasQuestSolvedDialogs()
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model) {
				if ((msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || msg == sc.GAME_MODEL_MSG.STATE_CHANGED) && !model.isTeleport() && !model.isLoading())
					if (model.isReset()) {
						this.setFavQuest(-1);
						this.hide()
					} else !this._isVisible() || model.isMenu() ? this.hide() : sc.quests.focusQuest != -1 && !sc.quests.isMarkedQuestDone() && this.show(false, 0.2)
			} else model == sc.quests ? msg == sc.QUEST_MODEL_EVENT.FAV_QUEST_CHANGED || msg == sc.QUEST_MODEL_EVENT.FINISHED ? data != sc.quests.focusQuest && this.setFavQuest(sc.quests.focusQuest) : (msg == sc.QUEST_MODEL_EVENT.UPDATE || msg == sc.QUEST_MODEL_EVENT.TASK_DONE || msg == sc.QUEST_MODEL_EVENT.TASK_UNDONE) && this.setFavQuest(sc.quests.focusQuest) : model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED && this.setFavQuest(sc.quests.focusQuest)
		}
	})
});
ig.baked = !0;
