/**
 * @module game.feature.gui.hud.task-hud
 * @description sc.TaskHudBox: the in-game task/objective HUD box that shows
 *   the current or permanent task (with a timeout for transient tasks).
 */
ig.module("game.feature.gui.hud.task-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
	sc.TaskHudBox = sc.RightHudBoxGui.extend({
		contentGui: null,
		addedSum: 0,
		timer: 0,
		init: function() {
			this.parent(ig.lang.get("sc.gui.task-hud.title"));
			this.contentGui = new sc.TextGui("", {
				bestRatio: 12,
				maxWidth: 240
			});
			this.pushContent(this.contentGui);
			sc.Model.addObserver(sc.model, this)
		},
		update: function() {
			if (!ig.game.paused && !this.hidden && !sc.model.keepTaskDisplayed && this.timer > 0) {
				this.timer = this.timer - ig.system.actualTick;
				this.timer <= 0 && this.hide()
			}
		},
		modelChanged: function(model, msg) {
			if (model == sc.model) {
				var task = model.currentTask || model.permaTask || "";
				if (msg == sc.GAME_MODEL_MSG.TASK_CHANGED) {
					model.currentTask && !this.hidden && this.hide(true);
					if (model.currentTask) {
						this.contentGui.setText(task);
						this.replaceContent(0, this.contentGui);
						this.show();
						this.timer = model.taskTimer != void 0 && model.taskTimer >= 0 ? model.taskTimer : 7;
						this.timer <= 0 && this.hide()
					} else {
						this.timer = 0;
						this.hide()
					}
				} else if (msg == sc.GAME_MODEL_MSG.PERMA_TASK_CHANGED) {
					this.contentGui.setText(task);
					this.replaceContent(0, this.contentGui)
				} else if (msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)
					if (model.isPaused() && task) {
						this.contentGui.setText(task);
						this.replaceContent(0, this.contentGui);
						this.show()
					} else if ((model.isMenu() || model.isQuickMenu()) && task) this.hide();
				else if (!model.keepTaskDisplayed && model.isCutscene()) this.hide();
				else if (task && (this.timer > 0 || model.keepTaskDisplayed)) {
					this.contentGui.setText(task);
					this.replaceContent(0, this.contentGui);
					this.show()
				} else this.hide();
				else if (msg == sc.GAME_MODEL_MSG.STATE_CHANGED && model.isTitle()) this.timer = 0
			}
		}
	})
});
ig.baked = !0;
