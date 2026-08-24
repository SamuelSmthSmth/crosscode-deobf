/**
 * @module game.feature.gui.base.slick-box
 * @description Slick "message.png"-styled boxes: sc.SlickTitleGui,
 *   sc.SlickBoxRawGui, the content-wrapper sc.SlickBoxGui and the side bars
 *   (sc.SlickBigSideGui / sc.SlickSmallSideGui).
 */
ig.module("game.feature.gui.base.slick-box").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
	sc.SlickTitleGui = ig.BoxGui.extend({
		text: null,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleY: 1,
					offsetX: -32
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 9,
			left: 0,
			top: 0,
			right: 8,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 64
				}
			}
		}),
		init: function(title, flipped, width) {
			title = new sc.TextGui(title, {
				font: sc.fontsystem.tinyFont
			});
			width = width || title.hook.size.x + this.tile.right + 8;
			this.parent(width, 9, flipped);
			this.hook.pivot.y = this.hook.size.y;
			title.setPos(!flipped ? 2 : 1, 0);
			flipped && title.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(title)
		}
	});
	sc.SlickBoxRawGui = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 12,
			height: 12,
			left: 0,
			top: 4,
			right: 4,
			bottom: 0,
			offsets: {
				"default": {
					x: 24,
					y: 64
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0.5,
					scaleX: 1,
					scaleY: 0,
					offsetX: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		init: function(width, height, flipped) {
			this.parent(width, height, flipped);
			this.hook.localAlpha = 0.5
		}
	});
	sc.SlickBoxGui = sc.SlickBoxRawGui.extend({
		paddingX: 0,
		paddingY: 0,
		minWidth: 0,
		subGui: null,
		init: function(content, flipped, paddingX, paddingY, minWidth) {
			this.paddingX = paddingX || 0;
			this.paddingY = paddingY || 0;
			this.minWidth = minWidth || 0;
			this.parent(0, 0, flipped);
			this.setContent(content)
		},
		setContent: function(content) {
			this.subGui = content;
			content.hook.align.x = this.flipped ? ig.GUI_ALIGN.X_RIGHT : ig.GUI_ALIGN.X_LEFT;
			content.setPos(2, this.paddingY);
			var width = content.hook.size.x + this.paddingX + 2;
			if (this.minWidth && width < this.minWidth) width = this.minWidth;
			this.setSize(width, content.hook.size.y + this.paddingY * 2);
			this.removeAllChildren();
			this.addChildGui(content)
		}
	});
	sc.SlickBigSideGui = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 16,
			left: 0,
			top: 16,
			right: 0,
			bottom: 16,
			offsets: {
				"default": {
					x: 40,
					y: 64
				}
			}
		}),
		init: function(height, flipped) {
			this.parent(16, height, flipped);
			this.hook.localAlpha = 0.5
		}
	});
	sc.SlickSmallSideGui = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 8,
			height: 32,
			left: 0,
			top: 8,
			right: 0,
			bottom: 8,
			offsets: {
				"default": {
					x: 40,
					y: 64
				}
			}
		}),
		init: function(height, flipped) {
			this.parent(8, height, flipped);
			this.hook.localAlpha = 0.5
		}
	})
});
ig.baked = !0;
