/**
 * @module game.feature.gui.hud.combat-hud
 * @description sc.CombatHudGui: the top/bottom combat transition bars and the
 *   skip button shown when entering/leaving combat, with the ranked and PvP
 *   sub-HUDs (sc.CombatUpperHud / sc.CombatLowerHud).
 */
ig.module("game.feature.gui.hud.combat-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
	sc.CombatHudGui = ig.GuiElementBase.extend({
		upperGui: null,
		lowerGui: null,
		skipGui: null,
		lineTimer: 0,
		isCombat: false,
		isRanked: false,
		init: function() {
			this.parent();
			this.hook.zIndex = 100;
			this.hook.pauseGui = true;
			this.setSize(ig.system.width, ig.system.height);
			this.upperGui = new sc.CombatUpperHud;
			this.addChildGui(this.upperGui);
			this.lowerGui = new sc.CombatLowerHud;
			this.addChildGui(this.lowerGui);
			this.skipGui = new sc.CombatSkipGui;
			this.addChildGui(this.skipGui);
			sc.Model.addObserver(sc.model, this)
		},
		update: function() {
			if (sc.model.isCombatCooldown() && sc.model.player.getCombatCooldownTime()) this.lineTimer = 0.7 * sc.model.getCombatCooldownFactor();
			else if (this.lineTimer) {
				this.lineTimer = this.lineTimer - ig.system.actualTick;
				if (this.lineTimer <= 0) {
					this.lineTimer = 0;
					if (!this.isCombat) {
						this.progress = 0;
						this.upperGui.doStateTransition("HIDDEN");
						this.lowerGui.doStateTransition("HIDDEN")
					}
				}
			}
		},
		getLineWidth: function() {
			return this.isCombat ? 1 - this.lineTimer / 0.7 : this.lineTimer / 0.7
		},
		modelChanged: function(model, msg) {
			if (msg == sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED) {
				var isActive = sc.model.isCombatActive();
				if (this.isCombat != isActive) {
					this.isCombat = isActive;
					this.isRanked = sc.model.isCombatRankActive();
					isActive = sc.pvp.isActive();
					this.lineTimer = 0.7 - this.lineTimer;
					this.upperGui.combatChanged(this.isCombat, this.isRanked, isActive);
					this.lowerGui.combatChanged(this.isCombat, this.isRanked, isActive)
				}
				if (sc.model.isCombatCooldown()) {
					isActive = this.upperGui.getUpperRightWidth();
					this.skipGui.setPos(isActive, 3);
					this.skipGui.show()
				} else this.skipGui.hide()
			}
		}
	});
	sc.CombatSkipGui = ig.BoxGui.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					scaleY: 0,
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 0,
			left: 16,
			top: 14,
			right: 16,
			bottom: 0,
			offsets: {
				"default": {
					x: 48,
					y: 38
				}
			}
		}),
		init: function() {
			var text = "\\i[menu]" + ig.lang.get("sc.gui.combat-hud.skip"),
				text = new sc.TextGui(text);
			this.parent(text.hook.size.x + 24, 14);
			this.hook.localAlpha = 0.5;
			text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(text);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		}
	});
	sc.CombatUpperHud = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: 16
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		gfx: new ig.Image("media/gui/status-gui.png"),
		ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
			width: 16,
			height: 0,
			left: 16,
			top: 14,
			right: 0,
			bottom: 0,
			offsets: {
				battle: {
					x: 128,
					y: 80
				},
				cooldown: {
					x: 160,
					y: 80
				}
			}
		}),
		sub: {},
		currentSub: null,
		init: function() {
			this.parent();
			this.setSize(ig.system.width, 20);
			this.doStateTransition("HIDDEN", true);
			this.sub.empty = new subGuis.EMPTY;
			this.sub.ranked = new subGuis.RANKED;
			this.sub.pvp = new subGuis.PVP
		},
		updateDrawables: function(drawables) {
			var hook = this.hook,
				combatHud = hook.parentHook.gui;
			if (this.currentSub) {
				var subWidth = this.currentSub.hook.size.x + 13,
					combatHud = Math.ceil(hook.size.x * combatHud.getLineWidth()),
					rightX = hook.size.x - subWidth,
					hook = hook.size.x - combatHud,
					cooldown = !sc.model.isCombatMode() || sc.model.isCombatCooldown(),
					color = cooldown ? "#006d7d" : "#b0001d";
				hook < rightX - 1 && drawables.addColor(color, hook, 0, rightX - 1 - hook, 2).setCompositionMode("lighter");
				hook = Math.max(0, subWidth + 1 - combatHud);
				hook < 13 && drawables.addGfx(this.gfx, rightX - 1 + hook, 0, 128 + (cooldown ? 16 : 0) + hook, 96, 13 - hook, 16).setCompositionMode("lighter");
				var rightWidth = subWidth - 13 + 1,
					hook = Math.max(0, rightWidth - combatHud);
				hook < rightWidth && drawables.addColor(color, rightX - 1 + 13 + hook, 13, rightWidth - hook, 2).setCompositionMode("lighter");
				drawables.addTransform().setAlpha(0.5);
				this.ninepatch.draw(drawables, subWidth, 16, cooldown ? "cooldown" : "battle", rightX, 0);
				drawables.undoTransform()
			}
		},
		updateSubGui: function(ranked, pvp) {
			if (this.currentSub) {
				this.currentSub.end();
				this.removeChildGui(this.currentSub)
			}
			this.currentSub = pvp ? this.sub.pvp : ranked ? this.sub.ranked : this.sub.empty;
			this.addChildGui(this.currentSub);
			this.currentSub.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.currentSub.start()
		},
		combatChanged: function(isCombat, isRanked, isPvp) {
			if (isCombat) {
				this.doStateTransition("DEFAULT");
				this.updateSubGui(isRanked, isPvp)
			}
		},
		getUpperRightWidth: function() {
			return (this.currentSub && this.currentSub.hook.size.x || 0) + 13
		}
	});
	var subGuis = {};
	sc.CombatLowerHud = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		init: function() {
			this.parent();
			this.setSize(ig.system.width, 2);
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			var hook = this.hook,
				width = hook.size.x,
				lineWidth = hook.parentHook.gui.getLineWidth(),
				lineWidth = Math.ceil(width * (1 - lineWidth)),
				color = !sc.model.isCombatMode() || sc.model.isCombatCooldown() ? "#006d7d" : "#b0001d";
			drawables.addColor(color, 0, 0, width - lineWidth, hook.size.y).setCompositionMode("lighter")
		},
		combatChanged: function(isCombat) {
			isCombat && this.doStateTransition("DEFAULT")
		}
	});
	subGuis.EMPTY = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		init: function() {
			this.parent();
			this.setSize(17, 20)
		},
		updateDrawables: function(drawables) {
			var hook = this.hook,
				cooldown = !sc.model.isCombatMode() || sc.model.isCombatCooldown();
			drawables.addGfx(this.gfx, hook.size.x - 18, 0, 160 + (cooldown ? 16 : 0), 96, 13, 13)
		},
		start: function() {},
		end: function() {}
	});
	subGuis.RANKED = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		rankLabel: null,
		rankValue: null,
		progress: 0,
		blinkTimer: 0,
		init: function() {
			this.parent();
			this.setSize(49, 20);
			this.rankLabel = new sc.TextGui("Rank", {
				font: sc.fontsystem.tinyFont
			});
			this.rankLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.rankLabel.setPos(28, 1);
			this.rankValue = new sc.TextGui("A");
			this.rankValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.rankValue.setPos(18, -2);
			this.addChildGui(this.rankLabel);
			this.addChildGui(this.rankValue)
		},
		update: function() {
			var progress = sc.model.getCombatRankProgress();
			if (this.progress != progress)
				if (sc.model.isSRank()) this.progress = progress;
				else {
					this.progress = 0.2 * progress + 0.8 * this.progress;
					if (Math.abs(this.progress - progress) < 0.05) this.progress = progress
				} this.blinkTimer = sc.model.isSRank() ? this.blinkTimer + ig.system.actualTick : 0
		},
		updateDrawables: function(drawables) {
			var hook = this.hook,
				cooldown = !sc.model.isCombatMode() || sc.model.isCombatCooldown();
			drawables.addGfx(this.gfx, hook.size.x - 18, 0, 160 + (cooldown ? 16 : 0), 96, 13, 13);
			var barWidth = this.progress == 1 ? 22 : Math.floor(21 * this.progress);
			drawables.addGfx(this.gfx, hook.size.x - 50, 8, 128, 112, 24, 3);
			var alpha = 1 - Math.abs(Math.sin(this.blinkTimer / 0.2 * Math.PI));
			drawables.addTransform().setAlpha(alpha);
			barWidth && drawables.addGfx(this.gfx, hook.size.x - 50, 8, 128, 112 + (cooldown ? 8 : 4), 1 + barWidth, 3);
			drawables.undoTransform()
		},
		start: function() {
			sc.Model.addObserver(sc.model, this);
			this.rankValue.setText(sc.model.getCombatRankLabel());
			this.progress = 0
		},
		end: function() {
			sc.Model.removeObserver(sc.model, this)
		},
		modelChanged: function(model, msg) {
			if (msg == sc.GAME_MODEL_MSG.COMBAT_RANK_CHANGED) {
				this.progress = 1;
				this.rankValue.setText(sc.model.getCombatRankLabel())
			}
		}
	});
	subGuis.PVP = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		heads: new ig.Image("media/gui/severed-heads.png"),
		init: function() {
			this.parent();
			var width;
			width = 110 + sc.pvp.winPoints * 10;
			width = width + (sc.party.getPartySize() + 1) * 16;
			width = width + sc.pvp.enemies.length * 16;
			this.setSize(width, 20)
		},
		updateDrawables: function(drawables) {
			var centerX = this.hook.size.x / 2;
			drawables.addGfx(this.gfx, centerX - 8, 0, 136, 160, 16, 16);
			var winPoints = sc.pvp.winPoints;
			this._renderPoints(drawables, centerX - 12 - 4, -1, winPoints, sc.pvp.points[sc.COMBATANT_PARTY.PLAYER], 0);
			this._renderPoints(drawables, centerX + 12, 1, winPoints, sc.pvp.points[sc.COMBATANT_PARTY.ENEMY], 8);
			for (var spacing = 12 + winPoints * 5, heads = [0], i = 0; i < sc.party.getPartySize(); ++i) heads.push(sc.party.getPartyMemberModelByIndex(i).getHeadIdx());
			this._renderHeads(drawables, centerX - spacing, true, heads);
			heads = [];
			for (i = 0; i < sc.pvp.enemies.length; ++i) heads.push(sc.pvp.enemies[i].getHeadIdx());
			this._renderHeads(drawables, centerX + spacing, false, heads)
		},
		_renderPoints: function(drawables, x, direction, total, current, srcX) {
			for (var i = 0; i < total; ++i) {
				drawables.addGfx(this.gfx, x, 2, (total - i > current ? 124 : 120) + srcX, 160, 4, 12);
				x = x + 5 * direction
			}
		},
		_renderHeads: function(drawables, x, playerSide, heads) {
			playerSide && (x = x - 24);
			for (var i = 0; i < heads.length; ++i) {
				drawables.addGfx(this.heads, x, -10, heads[i] * 24, 0, 24, 24, playerSide);
				x = x + (playerSide ? -16 : 16)
			}
		},
		start: function() {},
		end: function() {}
	})
});
ig.baked = !0;
