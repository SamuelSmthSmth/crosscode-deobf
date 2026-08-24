/**
 * @module game.feature.gui.widget.counter-hud
 * @description ig.GUI.CounterHud / ig.GUI.ScoreHud: config-driven right-HUD
 *   boxes showing a count toward a max (counter) or a score value (score).
 */
ig.module("game.feature.gui.widget.counter-hud").requires("game.feature.gui.hud.right-hud", "impact.feature.gui.base.basic-gui", "impact.base.image").defines(function() {
	ig.GUI.CounterHud = sc.RightHudBoxGui.extend({
		maxCount: 0,
		currentCount: 0,
		variable: null,
		zIndex: 101,
		_wm: new ig.Config({
			width: 500,
			attributes: {
				taskTitle: {
					_type: "LangLabel",
					_info: "Text to describe task"
				},
				maxCount: {
					_type: "NumberExpression",
					_info: "Maximum count to reach"
				},
				variable: {
					_type: "VarName",
					_info: "Variable that stores current hit count"
				}
			}
		}),
		maxNumberGui: null,
		init: function(settings) {
			this.parent(new ig.LangLabel(settings.taskTitle));
			this.maxCount = settings.maxCount;
			this.variable = settings.variable;
			this.currentCount = ig.vars.get(this.variable);
			this.maxNumberGui = new sc.MaxNumberGui(ig.Event.getExpressionValue(this.maxCount), 0);
			this.maxNumberGui.setNumber(this.currentCount);
			this.pushContent(this.maxNumberGui, true)
		},
		varsChanged: function() {
			this.updateNumber()
		},
		updateNumber: function() {
			var max = ig.Event.getExpressionValue(this.maxCount);
			max != this.maxNumberGui.getMaxNumber && this.maxNumberGui.setMaxNumber(max);
			if (max > 0) {
				max = ig.vars.get(this.variable);
				if (max != this.currentCount) {
					this.currentCount = max;
					this.maxNumberGui.setNumber(this.currentCount)
				}
			}
		},
		remove: function() {
			sc.Model.removeObserver(sc.model, this);
			this.parent()
		},
		modelChanged: function(model, msg) {
			if (msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || msg == sc.GAME_MODEL_MSG.STATE_CHANGED) model.isQuickMenu() || model.isCutscene() ? this.hide() : this.show()
		},
		onSpawn: function() {
			sc.Model.addObserver(sc.model, this);
			this.updateNumber()
		}
	});
	ig.GUI.CounterHud.spawnHandler = function(gui) {
		sc.gui.rightHudPanel.addHudBoxBefore(gui, sc.gui.moneyHud);
		gui.onSpawn && gui.onSpawn();
		gui.show()
	};
	ig.GUI.ScoreHud = sc.RightHudBoxGui.extend({
		currentCount: 0,
		variable: null,
		zIndex: 101,
		_wm: new ig.Config({
			width: 500,
			attributes: {
				taskTitle: {
					_type: "LangLabel",
					_info: "Text to describe score"
				},
				variable: {
					_type: "VarName",
					_info: "Variable that stores value"
				},
				maxValue: {
					_type: "Number",
					_info: "Max Number to display (value can still be higher)"
				},
				time: {
					_type: "Number",
					_info: "Transition time for the score value when counting up and down",
					_optional: true,
					_default: 0.2
				},
				signed: {
					_type: "Boolean",
					_info: "If true, also allow negative numbers",
					_optional: true,
					_default: true
				},
				useDots: {
					_type: "Boolean",
					_info: "If true, use dots every 3 digits of the number",
					_optional: true,
					_default: true
				}
			}
		}),
		numberGui: null,
		_cutscene: false,
		init: function(settings) {
			this.parent(new ig.LangLabel(settings.taskTitle));
			this.variable = settings.variable;
			this._cutscene = settings.cutsceneOkay || false;
			this.currentCount = ig.vars.get(this.variable);
			this.numberGui = new sc.NumberGui(settings.maxValue || 9999999, {
				transitionTime: settings.time || 0,
				signed: settings.signed || false,
				dots: settings.useDots || false
			});
			this.numberGui.setNumber(this.currentCount);
			this.pushContent(this.numberGui, true)
		},
		varsChanged: function() {
			var value = ig.vars.get(this.variable);
			if (value != this.currentCount) {
				this.currentCount = value;
				this.numberGui.setNumber(this.currentCount)
			}
		},
		remove: function() {
			sc.Model.removeObserver(sc.model, this);
			this.parent()
		},
		modelChanged: function(model, msg) {
			if (msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || msg == sc.GAME_MODEL_MSG.STATE_CHANGED) model.isQuickMenu() || model.isCutscene() ? this._cutscene ? this.show() : this.hide() : this.show()
		},
		onSpawn: function() {
			sc.Model.addObserver(sc.model, this)
		}
	});
	ig.GUI.ScoreHud.spawnHandler = function(gui) {
		sc.gui.rightHudPanel.addHudBoxBefore(gui, sc.gui.moneyHud);
		gui.onSpawn && gui.onSpawn();
		gui.show()
	}
});
ig.baked = !0;
