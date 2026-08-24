/**
 * @module game.feature.gui.hud.drop-hud
 * @description sc.DropUpdateHud: a right-HUD box listing completed botanics
 *   drops as they happen, auto-hiding after a short timer.
 */
ig.module("game.feature.gui.hud.drop-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
	sc.DropUpdateEntry = ig.GuiElementBase.extend({
		timer: 0,
		textGui: null,
		init: function(drop) {
			this.parent();
			this.timer = 5;
			drop = "\\c[3]" + sc.menu.getDropName(drop) + "\\c[0] ";
			drop = drop + ig.lang.get("sc.gui.drop-hud.completed");
			this.textGui = new sc.TextGui(drop, {
				font: sc.fontsystem.tinyFont
			});
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
		},
		updateTimer: function() {
			if (this.timer > 0) this.timer = this.timer - ig.system.tick
		}
	});
	sc.DropUpdateHud = sc.RightHudBoxGui.extend({
		delayedStack: [],
		init: function() {
			this.parent(ig.lang.get("sc.gui.drop-hud.title"));
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.menu, this)
		},
		addEntry: function(drop) {
			drop = new sc.DropUpdateEntry(drop);
			this.contentEntries.length >= 3 ? this.delayedStack.push(drop) : this.pushContent(drop, !sc.model.isCutscene());
			this.hidden && !sc.model.isCutscene() && this.show()
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
				} else model.isCutscene() || model.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !model.isCutscene() && (!model.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
			else model == sc.menu && (sc.model.player.getCore("MENU_BOTANICS") ? msg == sc.MENU_EVENT.DROP_COMPLETED && sc.options.get("update-drop-style") == sc.UPDATE_DROP_STYLE.SMALL && data && this.addEntry(data) : this.hide())
		}
	})
});
ig.baked = !0;
