/**
 * @module game.feature.gui.hud.lore-hud
 * @description sc.LoreUpdateHud: a right-HUD box listing lore entries as they
 *   are unlocked or updated, auto-hiding after their timer runs out.
 */
ig.module("game.feature.gui.hud.lore-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.lore-model").defines(function() {
	sc.LoreUpdateEntry = ig.GuiElementBase.extend({
		timer: 0,
		textGui: null,
		init: function(data) {
			this.parent();
			this.timer = 5;
			var text = "\\c[3]" + sc.lore.getLoreTitle(data.lore) + "\\c[0] ",
				text = data.updated ? text + ig.lang.get("sc.gui.lore-hud.updated") : text + ig.lang.get("sc.gui.lore-hud.unlocked");
			this.textGui = new sc.TextGui(text, {
				font: sc.fontsystem.tinyFont
			});
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
		},
		updateTimer: function() {
			if (this.timer > 0) this.timer = this.timer - ig.system.tick
		}
	});
	sc.LoreUpdateHud = sc.RightHudBoxGui.extend({
		delayedStack: [],
		init: function() {
			this.parent(ig.lang.get("sc.gui.lore-hud.title"));
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.lore, this)
		},
		addEntry: function(data) {
			data = new sc.LoreUpdateEntry(data);
			this.contentEntries.length >= 3 ? this.delayedStack.push(data) : this.pushContent(data, !sc.model.isCutscene());
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
			else model == sc.lore && (msg == sc.LORE_EVENT.UNLOCKED && sc.options.get("update-lore-style") == sc.UPDATE_LORE_STYLE.SMALL && data) && this.addEntry(data)
		}
	})
});
ig.baked = !0;
