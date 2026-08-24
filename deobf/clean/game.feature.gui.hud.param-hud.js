/**
 * @module game.feature.gui.hud.param-hud
 * @description sc.ParamHudGui: the level + parameter boxes (HP/ATK/DEF/FOC)
 *   shown in the HUD while in the menu or combat, with element-factor pies.
 */
ig.module("game.feature.gui.hud.param-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box").defines(function() {
	sc.ParamHudGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		level: null,
		hp: null,
		atk: null,
		def: null,
		foc: null,
		_isOut: false,
		init: function() {
			this.parent();
			this.level = new sc.ParamHudGui.Level;
			this.level.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(this.level);
			this.hp = new sc.ParamHudGui.Param("maxhp", "hp", 62, 9999, 0);
			this.hp.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.hp.setPos(52, 0);
			this.addChildGui(this.hp);
			this.atk = new sc.ParamHudGui.Param("atk", "attack", 54, 999, 1);
			this.atk.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.atk.setPos(100, 0);
			this.addChildGui(this.atk);
			this.def = new sc.ParamHudGui.Param("def", "defense", 54, 999, 2);
			this.def.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.def.setPos(140, 0);
			this.addChildGui(this.def);
			this.foc = new sc.ParamHudGui.Param("foc", "focus", 54, 999, 3);
			this.foc.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.foc.setPos(180, 0);
			this.addChildGui(this.foc);
			this.hideParams(true);
			this.doStateTransition("DEFAULT")
		},
		showParams: function(big) {
			big ? this.hasTransition() || this._isOut ? this.doPosTranstition(54, 26, 0.2, KEY_SPLINES.EASE) : this.setPos(54, 26) : this.hasTransition() || this._isOut ? this.doPosTranstition(52, 5, 0.2, KEY_SPLINES.LINEAR) : this.setPos(52, 5);
			this._isOut = true;
			this.level.doStateTransition("DEFAULT", false, false, null, 0.048);
			this.hp.doStateTransition("DEFAULT", false, false, null, 0.048);
			this.atk.doStateTransition("DEFAULT", false, false, null, 0.048);
			this.def.doStateTransition("DEFAULT", false, false, null, 0.048);
			this.foc.doStateTransition("DEFAULT", false, false, null, 0.048)
		},
		hideParams: function(instant) {
			instant = instant != void 0 ? instant : false;
			this.level.doStateTransition("HIDDEN", instant);
			this.hp.doStateTransition("HIDDEN", instant);
			this.atk.doStateTransition("HIDDEN", instant);
			this.def.doStateTransition("HIDDEN", instant);
			this.foc.doStateTransition("HIDDEN", instant);
			this._isOut = false
		}
	});
	sc.ParamHudGui.Pie = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		param: "",
		offsetX: 0,
		offsetY: 0,
		_timer: 0,
		_targetValue: 1,
		_startValue: 1,
		init: function(param) {
			this.parent();
			this.param = param;
			this.setSize(8, 8);
			sc.Model.addObserver(sc.model.player, this);
			this._timer = 0.2;
			this._calcOffset(1)
		},
		update: function() {
			if (this._timer < 0.2) {
				this._timer = this._timer + ig.system.actualTick;
				if (this._timer >= 0.2) this._timer = 0.2;
				this._calcOffset(this._getCurrentValue())
			}
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 1 + this.offsetX, 146 + this.offsetY, this.hook.size.x, this.hook.size.y)
		},
		_getCurrentValue: function() {
			if (this._timer >= 0.2) return this._targetValue;
			var progress = this._timer / 0.2;
			return (1 - progress) * this._startValue + progress * this._targetValue
		},
		_calcOffset: function(value) {
			var normalized = value < 1 ? (value - 1) * -1 + 1 : value,
				mod = (Math.abs(normalized) - 1) * 10 % 6;
			this.offsetX = (value < 1 ? Math.ceil(mod) : Math.floor(mod)) * 9;
			this.offsetY = (value < 1 ? 18 : 0) + (Math.abs(normalized) - 1 >= 0.6 ? 9 : 0)
		},
		modelChanged: function(model, msg) {
			if (model == sc.model.player && (msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE || msg == sc.PLAYER_MSG.LEVEL_CHANGE || msg == sc.PLAYER_MSG.SKILL_CHANGED)) {
				var factor = sc.model.player.getCurrentElementMode().getParamFactor(this.param);
				if (this._targetValue != factor) {
					this._timer = 0;
					this._startValue = this._targetValue;
					this._targetValue = factor
				}
			}
		}
	});
	sc.ParamHudGui.Param = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
			width: 3,
			height: 0,
			left: 17,
			top: 17,
			right: 17,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 128
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					scaleY: 0,
					alpha: 0,
					scaleX: 0.8
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		_pie: null,
		_text: null,
		_number: null,
		_param: "",
		init: function(labelKey, param, width, maxNumber, pieIndex) {
			this.parent(width, 17);
			this.hook.pivot.x = 0;
			this.hook.pivot.y = 0;
			this._param = param;
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.model.player.params, this);
			this._text = new sc.TextGui(ig.lang.get("sc.gui.status-hud." + labelKey), {
				speed: ig.TextBlock.SPEED.IMMEDIATE,
				font: sc.fontsystem.tinyFont
			});
			this._text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this._text.setPos(19, 0);
			this.addChildGui(this._text);
			this._pie = new ig.ImageGui(this.ninepatch.gfx, pieIndex * 8, 232, 8, 8);
			this._pie.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this._pie.setPos(9, 0);
			this.addChildGui(this._pie);
			this._number = new sc.NumberGui(maxNumber, {
				signed: true,
				transitionTime: 0.2
			});
			this._number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this._number.setPos(10, 1);
			this._setNumber(true);
			this.addChildGui(this._number);
			this.doStateTransition("HIDDEN", true)
		},
		_setNumber: function(instant) {
			var value = sc.model.player.params.getStat(this._param);
			this._number.setNumber(value, instant);
			instant = sc.model.player.params.getStatBuffFactor(this._param);
			value = sc.GUI_NUMBER_COLOR.WHITE;
			if (instant < 1) value = sc.GUI_NUMBER_COLOR.RED;
			if (instant > 1) value = sc.GUI_NUMBER_COLOR.GREEN;
			this._number.setColor(value)
		},
		modelChanged: function(model, msg) {
			model == sc.model.player ? msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE || msg == sc.PLAYER_MSG.LEVEL_CHANGE ? this._setNumber() : (msg == sc.PLAYER_MSG.EQUIP_CHANGE || msg == sc.PLAYER_MSG.RESET_PLAYER || msg == sc.PLAYER_MSG.CONFIG_CHANGED || msg == sc.PLAYER_MSG.SET_PARAMS || msg == sc.PLAYER_MSG.SKILL_CHANGED) && this._setNumber(!this.isVisible()) :
				model == sc.model.player.params && msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED && this._setNumber(!this.isVisible())
		}
	});
	sc.ParamHudGui.Level = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
			width: 3,
			height: 0,
			left: 17,
			top: 17,
			right: 17,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 128
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					scaleY: 0,
					alpha: 0,
					scaleX: 0.8
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		_text: null,
		_level: null,
		init: function() {
			this.parent(66, 17);
			this.hook.pivot.x = 0;
			this.hook.pivot.y = 0;
			sc.Model.addObserver(sc.model.player, this);
			this._text = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
				speed: ig.TextBlock.SPEED.IMMEDIATE,
				font: sc.fontsystem.tinyFont
			});
			this._text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this._text.setPos(10, 1);
			this.addChildGui(this._text);
			this._level = new sc.NumberGui(99, {
				signed: true,
				transitionTime: 0.2,
				size: sc.NUMBER_SIZE.LARGE
			});
			this._level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this._level.setPos(17, 1);
			this._level.setNumber(sc.model.player.level, true);
			this.addChildGui(this._level);
			this.doStateTransition("HIDDEN", true)
		},
		modelChanged: function(model, msg) {
			model == sc.model.player && (msg == sc.PLAYER_MSG.LEVEL_CHANGE ? this._level.setNumber(sc.model.player.level) : msg == sc.PLAYER_MSG.SET_PARAMS && this._level.setNumber(sc.model.player.level, true))
		}
	})
});
ig.baked = !0;
