/**
 * @module game.feature.gui.base.compact-choice-box
 * @description sc.CompactChoiceBoxGui: a compact vertical choice box used by
 *   tutorial prompts, with keyboard/gamepad button-group support.
 */
ig.module("game.feature.gui.base.compact-choice-box").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
	sc.CompactChoiceBoxGui = ig.BoxGui.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleY: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 8,
			height: 8,
			left: 8,
			top: 8,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 480,
					y: 304
				}
			}
		}),
		options: null,
		callback: null,
		init: function(options, width, callback) {
			this.parent();
			this.options = options;
			this.callback = callback;
			this.buttonInteract = new ig.ButtonInteractEntry;
			this.buttonGroup = new sc.ButtonGroup;
			this.buttonGroup.addPressCallback(this.onButtonPress.bind(this));
			this.buttonInteract.pushButtonGroup(this.buttonGroup);
			for (var buttonWidth = width - 6, y = 3, i = 0; i < options.length; ++i) {
				var option = options[i],
					button = new sc.ButtonGui(option.label, buttonWidth, true, sc.BUTTON_TYPE.ITEM);
				button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
				button.textChild.setPos(0, 0);
				button.setPos(3, y);
				button.setData(i);
				y = y + 20;
				this.addChildGui(button);
				this.buttonGroup.addFocusGui(button, 0, i, option.backButton || false)
			}
			this.setSize(width, y + 2);
			ig.interact.addEntry(this.buttonInteract);
			sc.model.stopSkip()
		},
		onDetach: function() {
			ig.interact.removeEntry(this.buttonInteract)
		},
		onButtonPress: function(button) {
			button = this.options[button.data];
			this.callback && this.callback(button.key)
		}
	})
});
ig.baked = !0;
