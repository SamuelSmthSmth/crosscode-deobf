/**
 * @module game.feature.gui.widget.level-up-hud
 * @description ig.GUI.LevelUpHud: the level-up overlay that counts up the
 *   gained stat deltas (level/cp/hp/attack/defense/focus) one by one.
 */
ig.module("game.feature.gui.widget.level-up-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "impact.base.image").defines(function() {
	var statKeys = ["level", "cp", "hp", "attack", "defense", "focus"];
	sc.LevelUpContentGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		arrowTimer: 0,
		init: function() {
			this.parent();
			this.setSize(136, 20)
		},
		update: function() {
			if (this.arrowTimer < 1.5) {
				this.arrowTimer = this.arrowTimer + ig.system.actualTick;
				if (this.arrowTimer > 1.5) this.arrowTimer = 1.5
			}
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 1, 0, 0, 192, 112, 20);
			var progress = this.arrowTimer / 1.5,
				progress = KEY_SPLINES.EASE_OUT.get(progress),
				progress = progress * 12 % 1,
				offsetY = 0,
				offsetY = 0,
				height = 20,
				offsetY = Math.round(progress * 20);
			(height = height - offsetY) && drawables.addGfx(this.gfx, 113, 0, 112, 192 + offsetY, 23, height);
			height = 20;
			offsetY = Math.round((1 - progress) * 20);
			(height = height - offsetY) && drawables.addGfx(this.gfx, 113, offsetY, 112, 192, 23, height)
		}
	});
	sc.LevelUpSideStatsGui = sc.SideBoxGui.extend({
		deltaValues: null,
		init: function(settings) {
			this.parent(true, ig.lang.get("sc.gui.levelup.title"));
			this.hook.zIndex = 99;
			this.hook.pauseGui = true;
			this.deltaValues = settings.deltaValues;
			for (var y = 178, i = statKeys.length; i--;) this.deltaValues[statKeys[i]] || (y = y + 22);
			this.setPos(0, y);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.show()
		},
		addDeltaEntry: function(key) {
			if (!this.deltaValues[key]) return false;
			var label = ig.lang.get("sc.gui.levelup." + key),
				time = Math.min(0.5, this.deltaValues[key] * 0.07),
				label = new sc.LabeledNumberGuy(label, 60, 9999, {
					signed: true,
					showPlus: true,
					transitionTime: time
				});
			label.setNumber(this.deltaValues[key], false);
			this.pushContent(label, true);
			return true
		}
	});
	ig.GUI.LevelUpHud = ig.SimpleGui.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.5,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 1
				},
				time: 0.5,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		screenInteract: null,
		currentEntry: 0,
		timer: 0,
		sideStatGui: null,
		lineBox: null,
		init: function(settings) {
			this.parent(true, ig.lang.get("sc.gui.levelup.title"));
			this.setSize(ig.system.width, ig.system.height);
			this.sideStatGui = new sc.LevelUpSideStatsGui(settings);
			this.addChildGui(this.sideStatGui);
			settings = new sc.LevelUpContentGui;
			this.lineBox = new sc.LineBoxGui(settings, 32);
			this.lineBox.setPos(0, 100);
			this.addChildGui(this.lineBox);
			this.screenInteract = new sc.ScreenInteractEntry(this);
			ig.interact.addEntry(this.screenInteract);
			ig.vars.set("tmp._levelUpFinished", false)
		},
		update: function() {
			if (this.currentEntry < statKeys.length) {
				this.timer = this.timer - ig.system.actualTick;
				if (this.timer <= 0) {
					do {
						var added = this.sideStatGui.addDeltaEntry(statKeys[this.currentEntry]);
						this.currentEntry++
					} while (this.currentEntry < statKeys.length && !added);
					this.timer = 0.5
				}
			}
		},
		onInteraction: function() {
			if (this.currentEntry < statKeys.length) this.timer = 0;
			else {
				ig.vars.set("tmp._levelUpFinished", true);
				ig.interact.removeEntry(this.screenInteract);
				this.remove()
			}
		},
		remove: function() {
			this.lineBox.doStateTransition("HIDDEN", false, true);
			this.sideStatGui.remove();
			this.doStateTransition("HIDDEN", false, true)
		}
	})
});
ig.baked = !0;
