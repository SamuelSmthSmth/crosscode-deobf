/**
 * @module game.feature.gui.widget.bar-widget
 * @description ig.GUI.BarWidget: a config-driven HUD bar (editor widget) that
 *   reads a variable and displays it against a max value with optional splits.
 */
ig.module("game.feature.gui.widget.bar-widget").requires("game.feature.gui.base.boxes", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "impact.base.lang", "game.feature.gui.base.boxes", "game.feature.combat.gui.hp-bar-boss").defines(function() {
	var barTypes = {
			FILL: 1,
			EMPTY: 2
		},
		barColors = {
			RED: {
				upper: "#ff7a7a",
				lower: "#d71112"
			},
			GREEN: {
				upper: "#96f766",
				lower: "#25b000"
			},
			BLUE: {
				upper: "#66bef7",
				lower: "#0057b0"
			}
		};
	ig.GUI.BarWidget = sc.BigGenericBar.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.25,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			CUTSCENE: {
				state: {
					offsetY: 20
				},
				time: 0.25,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					scaleX: 1,
					scaleY: 0
				},
				time: 0.25,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		_wm: new ig.Config({
			width: 500,
			attributes: {
				text: {
					_type: "LangLabel",
					_info: "Text to display infront of widget.",
					_large: true
				},
				variable: {
					_type: "VarName",
					_info: "Variable from which to fetch the value"
				},
				maxValue: {
					_type: "Number",
					_info: "Maximum value of bar"
				},
				barType: {
					_type: "String",
					_info: "Type of Bar. EMPTY => is empty when value=maxValue",
					_select: barTypes
				},
				color: {
					_type: "String",
					_info: "Color of Bar",
					_select: barColors
				},
				position: {
					_type: "Number",
					_info: "Position of bar. 0 = bottom most bar. 1= one bar above",
					_default: 0
				},
				splits: {
					_type: "NumberArray",
					_info: "Splits added to the bar. Each value a number between 0-1.",
					_optional: true
				},
				hideWhite: {
					_type: "Boolean",
					_info: "True if the bar should not have the white total damage bar",
					_optional: true
				},
				instant: {
					_type: "Boolean",
					_info: "True if the value should be the max value immediately",
					_optional: true
				}
			}
		}),
		labelGui: null,
		variable: null,
		barType: null,
		prevValue: -1,
		hideWhite: false,
		init: function(settings) {
			var label = new ig.LangLabel(settings.text);
			this.labelGui = new sc.TextGui(label.toString(), {
				font: sc.fontsystem.tinyFont
			});
			this.labelGui.setPos(12, 2);
			label = barColors[settings.color] || barColors.RED;
			this.parent(this.labelGui.hook.size.x + 4, label.upper, label.lower);
			this.addChildGui(this.labelGui);
			this.setSize(ig.system.width / 2, 11);
			this.setPivot(this.hook.size.x / 2, 5.5);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.setPos(2, 4 + 16 * (settings.position || 0));
			this.variable = settings.variable;
			this.barType = barTypes[settings.barType];
			this.hideWhite = settings.hideWhite || false;
			if (settings.splits) this.splits = settings.splits;
			this.setMaxValue(settings.maxValue);
			settings.instant && this.setValue(settings.maxValue, true)
		},
		onAttach: function() {
			sc.Model.addObserver(sc.model, this);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition(sc.model.isCutscene() ? "CUTSCENE" : "DEFAULT");
			this.updateValue(true)
		},
		onDetach: function() {
			sc.Model.removeObserver(sc.model, this)
		},
		modelChanged: function(model, msg) {
			model instanceof sc.GameModel && msg == sc.GAME_MODEL_MSG.STATE_CHANGED && (model.isCutscene() ? this.doStateTransition("CUTSCENE") : this.doStateTransition("DEFAULT"))
		},
		updateValue: function(instant, force) {
			var value = ig.vars.get(this.variable);
			if (value != this.prevValue) {
				this.prevValue = value;
				this.barType == barTypes.EMPTY && (value = this.maxValue - value);
				this.setValue(value, instant, force)
			}
		},
		varsChanged: function() {
			this.updateValue(this.hideWhite, this.hideWhite)
		},
		remove: function() {
			this.doStateTransition("HIDDEN", false, true)
		}
	})
});
ig.baked = !0;
