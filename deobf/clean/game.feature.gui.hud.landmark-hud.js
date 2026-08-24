/**
 * @module game.feature.gui.hud.landmark-hud
 * @description sc.LandmarkHud: a right-HUD box announcing newly unlocked
 *   landmarks as they are discovered, auto-hiding after a short timer.
 */
ig.module("game.feature.gui.hud.landmark-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.gui.quests.quest-entries", "game.feature.model.options-model").defines(function() {
	sc.LandmarkEntry = ig.GuiElementBase.extend({
		timer: 0,
		id: null,
		textGui: null,
		init: function(id, area) {
			this.parent();
			this.id = id || null;
			this.timer = 5;
			var text = ig.lang.get("sc.gui.landmark-hud.landmark") + " \\c[3]" + sc.map.getLandmarkName(id, area) + "\\c[0] " + ig.lang.get("sc.gui.landmark-hud.unlocked") + "!";
			this.textGui = new sc.TextGui(text, {
				font: sc.fontsystem.tinyFont,
				maxWidth: 180
			});
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
		},
		updateTimer: function() {
			if (this.timer > 0) this.timer = this.timer - ig.system.tick
		}
	});
	sc.LandmarkHud = sc.RightHudBoxGui.extend({
		delayedStack: [],
		init: function() {
			this.parent(ig.lang.get("sc.gui.landmark-hud.title"));
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.map, this)
		},
		addEntry: function(id, area) {
			var entry = null;
			if ((entry = this._isInEntries(id)) != null) entry.timer = 5;
			else {
				entry = new sc.LandmarkEntry(id, area);
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
				} else model.isCutscene() || model.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !model.isCutscene() && (!model.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
			else model == sc.map && msg == sc.MAP_EVENT.LANDMARK_ADDED && data && data.landmark && data.area && sc.options.get("update-landmark-style") == sc.UPDATE_LANDMARK_STYLE.SMALL && this.addEntry(data.landmark, data.area)
		}
	})
});
ig.baked = !0;
