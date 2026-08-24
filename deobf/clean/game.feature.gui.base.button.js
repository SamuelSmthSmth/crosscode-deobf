/**
 * @module game.feature.gui.base.button
 * @description sc.ButtonGui: the standard menu button (background ninepatch,
 *   animated focus highlight, sounds) with its BUTTON_TYPE registry and the
 *   sc.CheckboxGui variant.
 */
ig.module("game.feature.gui.base.button").requires("impact.feature.gui.base.box", "game.feature.gui.base.text", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
	sc.BUTTON_DEFAULT_WIDTH = 144;
	sc.BUTTON_MENU_WIDTH = 128;
	sc.BUTTON_TOP_MENU_WIDTH = 66;
	sc.BUTTON_TYPE = {};
	sc.BUTTON_SOUND = {
		submit: new ig.Sound("media/sound/menu/menu-submit.ogg"),
		back: new ig.Sound("media/sound/menu/menu-cancel.ogg"),
		equip: new ig.Sound("media/sound/menu/equip-sound.ogg", 0.8),
		denied: new ig.Sound("media/sound/menu/menu-blocked.ogg", 0.9),
		quickAppear: new ig.Sound("media/sound/menu/quick-menu-appear.ogg", 0.8),
		quickHide: new ig.Sound("media/sound/menu/quick-menu-hide.ogg", 0.8),
		shop_up: new ig.Sound("media/sound/menu/shop/shop-menu-up.ogg", 1),
		shop_down: new ig.Sound("media/sound/menu/shop/shop-menu-down.ogg", 1),
		shop_cash: new ig.Sound("media/sound/menu/shop/shop-kashing.ogg", 0.8),
		quest_accept: new ig.Sound("media/sound/menu/stamp-scifi.ogg", 1),
		toggle_on: new ig.Sound("media/sound/menu/item-toggle-on.ogg", 0.8),
		toggle_off: new ig.Sound("media/sound/menu/item-toggle-off.ogg", 0.8)
	};
	sc.ButtonBgGui = ig.BoxGui.extend({
		init: function(width, buttonType) {
			this.parent(width, buttonType.height, false, buttonType.ninepatch)
		}
	});
	sc.ButtonHighlightGui = ig.GuiElementBase.extend({
		focusWeight: null,
		gfx: null,
		pattern: null,
		flipped: false,
		highlight: null,
		init: function(width, buttonType) {
			this.parent();
			this.hook.size.x = width;
			this.hook.size.y = buttonType.height;
			this.highlight = buttonType.highlight;
			this.pattern = buttonType.highlight.pattern;
			this.gfx = buttonType.highlight.gfx
		},
		updateDrawables: function(drawables) {
			if (this.focusWeight > 0) {
				this.flipped && drawables.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x, 0);
				var highlight = this.highlight,
					offsetY = this.highlight.offsetY,
					leftWidth = highlight.leftWidth,
					rightWidth = highlight.rightWidth;
				if (this.focusWeight >= 1) drawables.addPattern(this.pattern, leftWidth, 0, 0, 0, this.hook.size.x - rightWidth - leftWidth, this.hook.size.y);
				else {
					var halfWidth = Math.floor(this.focusWeight * this.hook.size.x / 2),
						leftWidth = Math.min(leftWidth, halfWidth),
						rightWidth = Math.min(rightWidth, halfWidth);
					halfWidth > leftWidth && drawables.addPattern(this.pattern, leftWidth, 0, 0, 0, halfWidth - leftWidth, this.hook.size.y);
					halfWidth > rightWidth && drawables.addPattern(this.pattern, this.hook.size.x - halfWidth, 0, 0, 0, halfWidth - rightWidth, this.hook.size.y)
				}
				drawables.addGfx(this.gfx, 0, 0, highlight.startX, offsetY, leftWidth, this.hook.size.y);
				drawables.addGfx(this.gfx, this.hook.size.x - rightWidth, 0, highlight.endX - rightWidth, offsetY, rightWidth, this.hook.size.y);
				this.flipped && drawables.undoTransform()
			}
		}
	});
	sc.ButtonGui = ig.FocusGui.extend({
		text: null,
		bgGui: null,
		highlightGui: null,
		gfx: new ig.Image("media/gui/buttons.png"),
		focusTimer: 0,
		alphaTimer: 0,
		buttonType: null,
		submitSound: null,
		blockedSound: null,
		data: null,
		noFocusOnPressed: false,
		animateOnPress: false,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		textChild: null,
		init: function(text, width, focusable, buttonType, submitSound, hasFocus, blockedSound) {
			this.parent(focusable, hasFocus);
			this.buttonType = buttonType || sc.BUTTON_TYPE.DEFAULT;
			this.setSize(0, 24);
			this.setPivot(72, 14);
			this.hook.size.y = this.buttonType.height;
			this.text = text;
			this.submitSound = submitSound || sc.BUTTON_SOUND.submit;
			this.blockedSound = blockedSound || sc.BUTTON_SOUND.denied;
			this.textChild = new sc.TextGui(this.getButtonText(), {
				speed: ig.TextBlock.SPEED.IMMEDIATE
			});
			this.textChild.setAlign(this.buttonType.alignX || ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.textChild.setPos(this.buttonType.alignXPadding || 0, 0);
			this.hook.size.x = Math.ceil(width / 2) * 2 || Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;
			this.bgGui = new sc.ButtonBgGui(this.hook.size.x, this.buttonType);
			this.addChildGui(this.bgGui);
			if (this.buttonType.highlight) {
				this.highlightGui = new sc.ButtonHighlightGui(this.hook.size.x, this.buttonType);
				this.addChildGui(this.highlightGui)
			}
			this.addChildGui(this.textChild)
		},
		invokeButtonPress: function(data) {
			this.submitSound && this.submitSound.play();
			this.onButtonPress(data)
		},
		setData: function(data) {
			if (data != void 0) this.data = data
		},
		setWidth: function(width) {
			this.hook.size.x = width;
			this.hook.pivot.x = width / 2;
			this.bgGui.hook.size.x = width;
			if (this.highlightGui) this.highlightGui.hook.size.x = width
		},
		setHeight: function(height) {
			this.hook.size.y = height;
			this.hook.pivot.y = height / 2;
			this.bgGui.hook.size.y = height;
			if (this.highlightGui) this.highlightGui.hook.size.y = height
		},
		setText: function(text, keepSize) {
			this.text = text;
			this.textChild.setText(text);
			if (!keepSize) {
				var width = Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;
				this.hook.size.x = width;
				this.hook.pivot.x = width / 2;
				this.bgGui.hook.size.x = width;
				if (this.highlightGui) this.highlightGui.hook.size.x = width
			}
		},
		resetText: function() {
			this.textChild.setText(this.getButtonText());
			var width = Math.ceil(this.textChild.hook.size.x / 2 + 12) * 2;
			this.hook.size.x = width;
			this.hook.pivot.x = width / 2;
			this.bgGui.hook.size.x = width;
			if (this.highlightGui) this.highlightGui.hook.size.x = width
		},
		unsetFocus: function() {
			this.focus = false;
			if (this.highlightGui) {
				this.highlightGui.hook.localAlpha = 1;
				this.highlightGui.focusWeight = 0
			}
			this.focusTimer = this.alphaTimer = 0
		},
		update: function() {
			this.parent();
			if (this.keepPressed && this.pressed && this.animateOnPress)
				if (this.focus) this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
				else {
					this.alphaTimer = 0;
					this.focusTimer = 0.1
				}
			else if (this.keepPressed && this.pressed && !this.noFocusOnPressed) {
				this.focusTimer = this.focusTimer + ig.system.actualTick;
				if (this.focusTimer > 0.1) this.focusTimer = 0.1;
				this.alphaTimer = 0
			} else if (this.focus && this.focusTimer < 0.1) {
				this.focusTimer = this.focusTimer + ig.system.actualTick;
				this.alphaTimer = 0
			} else if (!this.focus && this.focusTimer > 0) {
				this.focusTimer = this.focusTimer - ig.system.actualTick;
				this.alphaTimer = 0
			} else this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
			this.focusTimer.limit(0, 0.1);
			this.bgGui.currentTileOffset = this.keepPressed && this.pressed ? "pressed" : this.focus ? "focus" : "default";
			if (this.highlightGui) {
				this.highlightGui.focusWeight = this.focusTimer / 0.1;
				var progress = this.alphaTimer / 1,
					progress = KEY_SPLINES.EASE_IN_OUT.get(1 - (progress > 0.5 ? 1 - (progress - 0.5) * 2 : progress * 2)),
					progress = 0.8 * progress + 0.2;
				this.active || (progress = progress * 0.5);
				this.highlightGui.hook.localAlpha = progress
			}
		},
		getButtonText: function() {
			return this.active ? "\\c[0]" + this.text : "\\c[" + sc.FONT_COLORS.GREY + "]" + this.text
		},
		setActive: function(active) {
			this.parent(active);
			this.textChild.setText(this.getButtonText())
		}
	});
	var checkboxTiles = {
		"default": {
			x: 160,
			y: 0
		},
		pressed: {
			x: 180,
			y: 0
		}
	};
	sc.CheckboxGui = sc.ButtonGui.extend({
		hookGui: null,
		init: function(checked, width, focusable) {
			this.parent("", width, focusable, sc.BUTTON_TYPE.OPTION, null, false);
			width = (checked = checked == void 0 ? false : checked) ? "pressed" : "default";
			this.hookGui = new ig.ImageGui(this.gfx, checkboxTiles[width].x, checkboxTiles[width].y, 20, 18);
			this.hookGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.insertChildGui(this.hookGui, this.hook.children.length - 2);
			this.setPressed(checked)
		},
		setPressed: function(checked) {
			this.parent(checked);
			checked = checked ? "pressed" : "default";
			this.hookGui.offsetX = checkboxTiles[checked].x;
			this.hookGui.offsetY = checkboxTiles[checked].y
		},
		invokeButtonPress: function() {
			this.submitSound && this.submitSound.play();
			this.setPressed(!this.pressed);
			this.onButtonPress()
		}
	});
	sc.BUTTON_TYPE.DEFAULT = {
		height: 24,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 16,
			height: 0,
			left: 8,
			top: 24,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 0
				},
				focus: {
					x: 32,
					y: 0
				},
				pressed: {
					x: 32,
					y: 0
				}
			}
		}),
		highlight: {
			startX: 64,
			endX: 96,
			leftWidth: 9,
			rightWidth: 8,
			offsetY: 0,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 73, 0, 15, 24, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.SMALL = {
		height: 21,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 16,
			height: 0,
			left: 8,
			top: 21,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 24
				},
				focus: {
					x: 32,
					y: 24
				},
				pressed: {
					x: 32,
					y: 24
				}
			}
		}),
		highlight: {
			startX: 64,
			endX: 96,
			leftWidth: 9,
			rightWidth: 8,
			offsetY: 24,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 73, 24, 15, 21, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.EQUIP = {
		height: 39,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 13,
			height: 6,
			left: 9,
			top: 9,
			right: 9,
			bottom: 9,
			offsets: {
				"default": {
					x: 0,
					y: 65
				},
				focus: {
					x: 32,
					y: 65
				},
				pressed: {
					x: 32,
					y: 65
				}
			}
		}),
		highlight: null
	};
	sc.BUTTON_TYPE.ITEM = {
		height: 20,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 2,
			height: 0,
			left: 8,
			top: 20,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 45
				},
				focus: {
					x: 44,
					y: 45
				},
				pressed: {
					x: 44,
					y: 45
				}
			}
		}),
		highlight: null,
		alignX: ig.GUI_ALIGN.X_LEFT,
		alignXPadding: 5
	};
	sc.BUTTON_TYPE.OPTION = {
		height: 21,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 16,
			height: 0,
			left: 8,
			top: 21,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 96,
					y: 0
				},
				focus: {
					x: 96,
					y: 0
				},
				pressed: {
					x: 96,
					y: 0
				}
			}
		}),
		highlight: {
			startX: 128,
			endX: 160,
			leftWidth: 9,
			rightWidth: 8,
			offsetY: 0,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 137, 0, 15, 21, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.GROUP = {
		height: 21,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 8,
			height: 0,
			left: 4,
			top: 21,
			right: 4,
			bottom: 0,
			offsets: {
				"default": {
					x: 184,
					y: 24
				},
				focus: {
					x: 184,
					y: 24
				},
				pressed: {
					x: 168,
					y: 24
				}
			}
		}),
		highlight: {
			startX: 200,
			endX: 216,
			leftWidth: 4,
			rightWidth: 4,
			offsetY: 24,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 204, 24, 8, 21, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.GROUP_LEFT = {
		height: 21,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 8,
			height: 0,
			left: 8,
			top: 21,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 120,
					y: 24
				},
				focus: {
					x: 120,
					y: 24
				},
				pressed: {
					x: 96,
					y: 24
				}
			}
		}),
		highlight: {
			startX: 144,
			endX: 168,
			leftWidth: 9,
			rightWidth: 4,
			offsetY: 24,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 153, 24, 11, 21, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.GROUP_RIGHT = {
		height: 21,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 8,
			height: 0,
			left: 8,
			top: 21,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 120,
					y: 48
				},
				focus: {
					x: 120,
					y: 48
				},
				pressed: {
					x: 96,
					y: 48
				}
			}
		}),
		highlight: {
			startX: 144,
			endX: 168,
			leftWidth: 4,
			rightWidth: 9,
			offsetY: 48,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 147, 48, 13, 21, ig.ImagePattern.OPT.REPEAT_X)
		}
	};
	sc.BUTTON_TYPE.START = {
		height: 115,
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 8,
			height: 4,
			left: 4,
			top: 8,
			right: 4,
			bottom: 9,
			offsets: {
				"default": {
					x: 184,
					y: 24
				},
				focus: {
					x: 184,
					y: 24
				},
				pressed: {
					x: 168,
					y: 24
				}
			}
		}),
		highlight: {
			startX: 224,
			endX: 240,
			leftWidth: 4,
			rightWidth: 4,
			offsetY: 112,
			gfx: new ig.Image("media/gui/buttons.png"),
			pattern: new ig.ImagePattern("media/gui/buttons.png", 228, 112, 8, 115, ig.ImagePattern.OPT.REPEAT_X)
		}
	}
});
ig.baked = !0;
