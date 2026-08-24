/**
 * @module game.feature.gui.hud.status-hud
 * @description sc.StatusHudGui: the master player status HUD (element mode
 *   circle, params, HP/SP/EXP, party, key counter) that rearranges itself
 *   between game/quick-menu/menu layouts, plus the elemental overload overlay
 *   and battle-mode background/symbol pieces.
 */
ig.module("game.feature.gui.hud.status-hud").requires("impact.feature.gui.gui", "game.feature.gui.hud.hp-hud", "game.feature.gui.hud.sp-hud", "game.feature.gui.hud.param-hud", "game.feature.gui.hud.buff-hud", "game.feature.gui.hud.item-timer-hud", "game.feature.model.options-model", "game.feature.gui.hud.key-hud").defines(function() {
	var modeOffsets = [{
			x: 20,
			y: 20
		}, {
			x: 20,
			y: 44
		}, {
			x: 20,
			y: -4
		}, {
			x: 44,
			y: 20
		}, {
			x: -4,
			y: 20
		}],
		screenCurve = [{
			x: [220, 289],
			y: [11, 34]
		}, {
			x: [90, 141],
			y: [19, 42]
		}, {
			x: [20, 42],
			y: [36, 83]
		}];
	sc.StatusHudGui = ig.GuiElementBase.extend({
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
		battleBgGui: null,
		battleSymbolGui: null,
		upperGui: null,
		lowerGui: null,
		elementBgGui: null,
		elementModeGui: null,
		paramGui: null,
		partyGui: null,
		keyHud: null,
		elementSwitchTimer: 0,
		menuMode: false,
		init: function() {
			this.parent();
			this.hook.zIndex = 1201;
			this.hook.pauseGui = true;
			this.elementBgGui = new sc.StatusElementBgGui;
			this.elementBgGui.setPos(3, 3);
			this.addChildGui(this.elementBgGui);
			this.elementModeGui = new sc.StatusElementModeGui;
			this.elementModeGui.setPos(0, 0);
			this.addChildGui(this.elementModeGui);
			this.paramGui = new sc.ParamHudGui;
			this.paramGui.setPos(54, 26);
			this.addChildGui(this.paramGui);
			this.lowerGui = new sc.StatusLowerGui;
			this.lowerGui.setPos(29, 21);
			this.addChildGui(this.lowerGui);
			this.upperGui = new sc.StatusUpperGui;
			this.upperGui.setPos(24, 3);
			this.addChildGui(this.upperGui);
			this.partyGui = new sc.PartyHudGui;
			this.partyGui.setPos(2, 39);
			this.addChildGui(this.partyGui);
			this.keyHud = new sc.KeyHudGui;
			this.keyHud.setPos(0, 53);
			this.addChildGui(this.keyHud);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.model.menu, this);
			sc.Model.addObserver(sc.quickmodel, this);
			this.doStateTransition("HIDDEN", true)
		},
		update: function() {
			if (this.elementSwitchTimer > 0 && !sc.model.isLevelUp() && !sc.model.isQuickMenu() && !sc.autoControl.isActive()) {
				this.elementSwitchTimer = this.elementSwitchTimer - ig.system.actualTick;
				this.elementSwitchTimer <= 0 && this._minimizeDisplay()
			}
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model) {
				if (msg == sc.GAME_MODEL_MSG.STATE_CHANGED || msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)
					if (sc.model.isLevelUp()) this.elementSwitchDisplay();
					else if (sc.model.isQuickMenu()) this._enterQuickMenuMode();
				else if (sc.model.isMenu()) {
					this.menuMode = true;
					sc.menu.directMode && sc.menu.directMenu ? this._changeMenuModeVisibility(sc.menu.directMenu) : this._changeMenuModeVisibility(sc.menu.currentMenu)
				} else {
					if (this.menuMode) {
						this._minimizeDisplay();
						this.menuMode = false
					}
					this._updateVisibility()
				}
			} else if (model == sc.menu)(msg == sc.MENU_EVENT.ENTER_MENU || msg == sc.MENU_EVENT.LEAVE_MENU) && this._changeMenuModeVisibility(sc.menu.currentMenu);
			else if (model == sc.model.player)
				if (msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) this.elementSwitchDisplay();
				else if (msg == sc.PLAYER_MSG.ITEM_CONSUME_START) this.elementSwitchTimer = 100;
			else {
				if (msg == sc.PLAYER_MSG.ITEM_CONSUME_END) this.elementSwitchTimer = data ? 1.5 : 1E-4
			} else model == sc.quickmodel && msg == sc.QUICK_MODEL_EVENT.SWITCH_STATE && (sc.quickmodel.isQuickCheck() ? this.doStateTransition("HIDDEN") : this.doStateTransition("DEFAULT"))
		},
		varsChanged: function() {
			this._updateVisibility()
		},
		_updateVisibility: function() {
			if (!sc.model.isQuickMenu() && !sc.model.isMenu() && !sc.model.isLevelUp() && !sc.model.isQuickMenu()) {
				var hidden = ig.vars.get("playerVar.statusHidden"),
					visible = sc.options.get("hud-display"),
					hidden = !hidden && sc.model.isGame() && sc.model.isRunning() && visible;
				if (!hidden && this.elementSwitchTimer > 0) {
					this.elementSwitchTimer = 0;
					this._minimizeDisplay()
				}
				this.doStateTransition(hidden ? "DEFAULT" : "HIDDEN")
			}
		},
		_minimizeDisplay: function() {
			this.elementSwitchTimer = 0;
			this.elementModeGui.doPosTranstition(0, 0, 0.3, KEY_SPLINES.EASE_IN_OUT);
			this.elementModeGui.selectBg = false;
			this.elementBgGui.doStateTransition("HIDDEN");
			this.upperGui.doPosTranstition(24, 3, 0.3, KEY_SPLINES.EASE_IN_OUT);
			this.lowerGui.doPosTranstition(29, 21, 0.3, KEY_SPLINES.EASE_IN_OUT);
			this.partyGui.doPosTranstition(2, 39, 0.3, KEY_SPLINES.EASE_IN_OUT);
			this.keyHud.doPosTranstition(0, 53, 0.3, KEY_SPLINES.EASE_IN_OUT);
			this.paramGui.hideParams();
			this.doStateTransition("DEFAULT")
		},
		_minimizeDisplayFast: function() {
			this.elementSwitchTimer = 0;
			this.elementModeGui.doPosTranstition(0, 0, 0.2, KEY_SPLINES.EASE_IN_OUT);
			this.elementModeGui.selectBg = false;
			this.elementBgGui.doStateTransition("HIDDEN_MENU");
			this.upperGui.doPosTranstition(24, 3, 0.2, KEY_SPLINES.EASE_IN_OUT);
			this.lowerGui.doPosTranstition(29, 21, 0.2, KEY_SPLINES.EASE_IN_OUT);
			this.partyGui.doPosTranstition(2, 39, 0.2, KEY_SPLINES.EASE_IN_OUT);
			this.keyHud.doPosTranstition(0, 53, 0.2, KEY_SPLINES.EASE_IN_OUT);
			this.paramGui.hideParams();
			this.doStateTransition("DEFAULT");
			this._updateVisibility()
		},
		_enterQuickMenuMode: function() {
			this.elementSwitchTimer = 0.1;
			var mode = sc.model.player.currentElementMode;
			this.elementBgGui.doStateTransition("QUICKMENU");
			mode = modeOffsets[mode];
			this.elementModeGui.doPosTranstition(mode.x + 3, mode.y + 3, 0.2, KEY_SPLINES.EASE);
			this.elementModeGui.doStateTransition("QUICKMENU");
			this.elementModeGui.selectBg = true;
			this.upperGui.doPosTranstition(73, 26, 0.2, KEY_SPLINES.EASE);
			this.lowerGui.doPosTranstition(78, 44, 0.2, KEY_SPLINES.EASE);
			this.partyGui.doPosTranstition(2, 88, 0.2, KEY_SPLINES.EASE);
			this.keyHud.doPosTranstition(0, 80, 0.2, KEY_SPLINES.EASE);
			this.paramGui.showParams(false);
			this.doStateTransition("DEFAULT")
		},
		_enterMenuMode: function() {
			this.elementSwitchTimer = 0;
			var mode = sc.model.player.currentElementMode;
			this.elementBgGui.doStateTransition("MENU");
			mode = modeOffsets[mode];
			this.elementModeGui.doPosTranstition(mode.x + 3 + 2, mode.y + 3 + 21, 0.2, KEY_SPLINES.EASE);
			this.elementModeGui.doStateTransition("MENU");
			this.elementModeGui.selectBg = true;
			this.upperGui.doPosTranstition(75, 47, 0.2, KEY_SPLINES.EASE);
			this.lowerGui.doPosTranstition(80, 65, 0.2, KEY_SPLINES.EASE);
			this.partyGui.doPosTranstition(2, 109, 0.2, KEY_SPLINES.EASE);
			this.keyHud.doPosTranstition(0, 110, 0.2, KEY_SPLINES.EASE);
			this.paramGui.showParams(true);
			this.doStateTransition("DEFAULT")
		},
		_changeMenuModeVisibility: function(menu) {
			switch (menu) {
				case sc.MENU_SUBMENU.START:
					this.doStateTransition("DEFAULT");
					this._enterMenuMode();
					break;
				default:
					this._minimizeDisplayFast();
					this.doStateTransition("HIDDEN")
			}
		},
		elementSwitchDisplay: function() {
			var mode = sc.model.player.currentElementMode;
			this.elementSwitchTimer = sc.model.isLevelUp() || sc.model.isQuickMenu() ? 0.1 : 2;
			this.elementBgGui.doStateTransition("DEFAULT");
			mode = modeOffsets[mode];
			this.elementModeGui.setPos(mode.x + 3, mode.y + 3);
			this.elementModeGui.doStateTransition("ZOOM", true);
			this.elementModeGui.doStateTransition("DEFAULT");
			this.elementModeGui.selectBg = true;
			this.upperGui.doPosTranstition(73, 26, 0.1, KEY_SPLINES.LINEAR);
			this.lowerGui.doPosTranstition(78, 44, 0.1, KEY_SPLINES.LINEAR);
			this.partyGui.doPosTranstition(2, 88, 0.1, KEY_SPLINES.LINEAR);
			this.keyHud.doPosTranstition(0, 80, 0.1, KEY_SPLINES.LINEAR);
			this.paramGui.showParams(false)
		},
		getFreeScreenMinY: function(width) {
			var progress = this.elementBgGui.hook.getStateTransitionProgress();
			this.elementBgGui.hook.currentStateName == "HIDDEN" && (progress = 1 - progress);
			for (var i = screenCurve.length, lastX = 0, lastY = 0; i--;) {
				var point = screenCurve[i],
					x = point.x[0] * (1 - progress) + point.x[1] * progress,
					point = point.y[0] * (1 - progress) + point.y[1] * progress;
				if (width <= x) return Math.max(point, lastY - (width - lastX));
				lastX = x;
				lastY = point
			}
			return Math.max(0, lastY - (width - lastX))
		}
	});
	sc.StatusUpperGui = ig.GuiElementBase.extend({
		init: function() {
			this.parent();
			var gui = new sc.HpHudGui;
			this.addChildGui(gui);
			gui = new sc.SpHudGui;
			this.addChildGui(gui);
			gui.setPos(55, 0);
			gui = new sc.ExpHudGui;
			gui.setPos(63, 8);
			this.addChildGui(gui)
		}
	});
	sc.StatusLowerGui = ig.GuiElementBase.extend({
		buffGui: null,
		itemTimerGui: null,
		init: function() {
			this.parent();
			sc.Model.addObserver(sc.model.player, this);
			this.buffGui = new sc.BuffHudGui;
			this.addChildGui(this.buffGui);
			this.itemTimerGui = new sc.ItemTimerHudGui;
			this.itemTimerGui.setPos(0, 0);
			this.addChildGui(this.itemTimerGui)
		},
		modelChanged: function(model, msg) {
			model == sc.model.player && (msg == sc.PLAYER_MSG.ITEM_USED ? this.moveSubGui(true) : msg == sc.PLAYER_MSG.ITEM_BLOCK_FINISH ? this.moveSubGui(false) : msg == sc.PLAYER_MSG.RESET_PLAYER && this.moveSubGui(false))
		},
		moveSubGui: function(shifted) {
			this.buffGui.doPosTranstition(shifted ? 32 : 0, 0, 0.2, KEY_SPLINES.EASE_IN_OUT)
		}
	});
	var warnModes = [{
		above: 0,
		interval: 0.5,
		minAlpha: 0,
		maxAlpha: 0
	}, {
		above: 0.25,
		interval: 1,
		minAlpha: 0.1,
		maxAlpha: 0.2
	}, {
		above: 0.5,
		interval: 0.5,
		minAlpha: 0.2,
		maxAlpha: 0.5
	}, {
		above: 0.75,
		interval: 0.25,
		minAlpha: 0,
		maxAlpha: 1
	}, {
		above: 1,
		interval: 0.125,
		minAlpha: 0,
		maxAlpha: 1
	}];
	sc.ElementalLoadOverlayGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/overload-overlay.png"),
		alphaHandler: null,
		currentWarnMode: -1,
		init: function() {
			this.parent();
			this.hook.zIndex = -40;
			this.setSize(ig.system.width, ig.system.height);
			this.alphaHandler = new ig.AlphaTransitionHandler(true)
		},
		update: function() {
			var load = sc.model.player.elementLoad;
			sc.model.player.hasOverload && (load = 1);
			for (var i = warnModes.length; i--;)
				if (load >= warnModes[i].above) break;
			if (i != this.currentWarnMode) {
				this.currentWarnMode = i;
				load = warnModes[i];
				this.alphaHandler.set(load.minAlpha, load.interval, load.maxAlpha)
			}
			if (!this.alphaHandler.update()) this.hook.localAlpha = this.alphaHandler.getAlpha()
		},
		updateDrawables: function(drawables) {
			if (sc.options.get("element-overload")) {
				var srcX = sc.model.player.hasOverload || sc.model.player.elementLoad < 0.1 ? 160 : 0;
				drawables.addGfx(this.gfx, 0, 0, srcX, 0, 160, 160, false, false).setCompositionMode("lighter");
				drawables.addGfx(this.gfx, ig.system.width - 160, 0, srcX, 0, 160, 160, true, false).setCompositionMode("lighter");
				drawables.addGfx(this.gfx, ig.system.width - 160, ig.system.height - 160, srcX, 0, 160, 160, true, true).setCompositionMode("lighter");
				drawables.addGfx(this.gfx, 0, ig.system.height - 160, srcX, 0, 160, 160, false, true).setCompositionMode("lighter")
			}
		}
	});
	sc.StatusElementModeGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		timer: 0,
		selectBg: false,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.15,
				timeFunction: KEY_SPLINES.LINEAR
			},
			QUICKMENU: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			MENU: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			ZOOM: {
				state: {
					scaleX: 0.25,
					scaleY: 0.25
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		init: function() {
			this.parent();
			this.setSize(40, 40);
			this.setPivot(20, 20)
		},
		update: function() {
			this.timer = (this.timer + ig.system.actualTick) % 2
		},
		updateDrawables: function(drawables) {
			var mode = sc.model.player.currentElementMode,
				load = sc.model.player.elementLoad,
				loadBar = Math.ceil(load * (this.hook.size.y - 7)),
				interval = 2;
			load >= 0.9 ? interval = 0.25 : load >= 0.75 ? interval = 0.5 : load >= 0.5 && (interval = 1);
			load = this.timer % interval / interval;
			load = load < 0.5 ? load * 2 : (1 - load) * 2;
			drawables.addGfx(this.gfx, 0, 0, 64, 32 + this.hook.size.x * (this.selectBg ? 0 : 1), this.hook.size.x, this.hook.size.y);
			if (loadBar && load) {
				loadBar = loadBar + 4;
				drawables.addGfx(this.gfx, 0, this.hook.size.x - loadBar, 64, 32 + this.hook.size.x * 3 - loadBar, this.hook.size.x, loadBar).setAlpha(load)
			}
			drawables.addGfx(this.gfx, 8, 8, 104, 32 + mode * 24, 24, 24)
		}
	});
	var bgIconPos = [{
		x: 32,
		y: 32
	}, {
		x: 32,
		y: 56
	}, {
		x: 32,
		y: 8
	}, {
		x: 56,
		y: 32
	}, {
		x: 8,
		y: 32
	}];
	sc.StatusElementBgGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			QUICKMENU: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			MENU: {
				state: {
					offsetY: 21,
					offsetX: 2
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN_MENU: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		init: function() {
			this.parent();
			this.setSize(80, 80);
			this.setPivot(10, 10);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 136, 0, 80, 80);
			for (var mode = sc.model.player.currentElementMode, i = 0; i < bgIconPos.length; ++i)
				if (i != mode) {
					var pos = bgIconPos[i],
						srcX = (i ? i - 1 : mode - 1) * 16,
						srcY = i ? 96 : 64;
					ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && (srcY = srcY + 16);
					!sc.model.player.getCore(i + 8) && i && (srcY = srcY - 32);
					drawables.addGfx(this.gfx, pos.x, pos.y, srcX, srcY, 16, 16)
				}
		}
	});
	sc.BattleModeBgGui = ig.ImageGui.extend({
		bgImage: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {
					offsetX: -23,
					offsetY: -23,
					alpha: 0.6
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			MAXIMIZED: {
				state: {
					alpha: 0.6
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					offsetX: -44,
					offsetY: -44,
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		init: function() {
			this.parent(this.bgImage, 128, 80, 88, 88)
		}
	});
	sc.BattleModeSymbolGui = ig.ImageGui.extend({
		bgImage: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {
					offsetX: 0,
					offsetY: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			MAXIMIZED: {
				state: {
					offsetX: 6,
					offsetY: 6
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					offsetX: -16,
					offsetY: -16,
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		init: function() {
			this.parent(this.bgImage, 216, 80, 16, 16)
		}
	})
});
ig.baked = !0;
