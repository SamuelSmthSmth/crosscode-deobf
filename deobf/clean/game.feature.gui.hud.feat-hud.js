/**
 * @module game.feature.gui.hud.feat-hud
 * @description sc.FeatHud: a right-HUD box announcing unlocked feats/trophies
 *   as they are triggered, auto-hiding after a short timer.
 */
ig.module("game.feature.gui.hud.feat-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "impact.base.lang", "game.feature.gui.hud.right-hud", "game.feature.achievements.achievements").defines(function() {
	sc.FeatHudEntry = ig.GuiElementBase.extend({
		timer: 0,
		feat: null,
		textGui: null,
		init: function(feat) {
			this.parent();
			this.feat = feat || null;
			this.timer = 3;
			feat = ig.lang.get("sc.gui.feats.unlocked") + " \\c[3]" + new ig.LangLabel(sc.trophies.getTrophyName(feat)) + "\\c[0]";
			this.textGui = new sc.TextGui(feat, {
				font: sc.fontsystem.tinyFont
			});
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
		},
		updateTimer: function() {
			if (this.timer > 0) this.timer = this.timer - ig.system.tick
		}
	});
	sc.FeatHud = sc.RightHudBoxGui.extend({
		delayedStack: [],
		init: function() {
			this.parent(ig.lang.get("sc.gui.feats.hud-title"));
			sc.Model.addObserver(sc.trophies, this);
			sc.Model.addObserver(sc.model, this)
		},
		addEntry: function(feat) {
			feat = new sc.FeatHudEntry(feat);
			this.contentEntries.length >= 3 ? this.delayedStack.push(feat) : this.pushContent(feat, !sc.model.isCutscene());
			this.hidden && !sc.model.isCutscene() && this.show()
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
		_isInEntries: function(feat) {
			for (var i = this.contentEntries.length; i--;)
				if (this.contentEntries[i].subGui.feat == feat) return this.contentEntries[i].subGui;
			for (i = this.delayedStack.length; i--;)
				if (this.delayedStack[i].feat == feat) return this.delayedStack[i];
			return null
		},
		_popDelayed: function() {
			if (this.delayedStack.length != 0) {
				var entry = this.delayedStack.splice(0, 1)[0];
				this.pushContent(entry, true)
			}
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model)
				if (model.isReset()) {
					this.clearContent();
					this.hide()
				} else model.isCutscene() || model.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !model.isCutscene() && (!model.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
			else model == sc.trophies && msg == sc.TROPHY_EVENTS.TRIGGERED && sc.options.get("update-trophy-style") == sc.UPDATE_TROPHY_STYLE.SMALL && this.addEntry(data)
		}
	})
});
ig.baked = !0;
