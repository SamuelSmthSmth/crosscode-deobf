/**
 * @module game.feature.gui.widget.tutorial-marker
 * @description sc.TutorialMarkerGui: the tutorial highlight — a shadowed
 *   cutout over an area with a pointing box + arrow, dismissed on interaction.
 */
ig.module("game.feature.gui.widget.tutorial-marker").requires("impact.base.image", "game.feature.gui.base.boxes").defines(function() {
	sc.TUT_BOX_POINTING_DIR = {
		BOTTOM_RIGHT: {
			alignX: ig.GUI_ALIGN.X_LEFT,
			alignY: ig.GUI_ALIGN.Y_TOP,
			flipped: false,
			scaleX: 1,
			scaleY: 1
		},
		BOTTOM_LEFT: {
			alignX: ig.GUI_ALIGN.X_RIGHT,
			alignY: ig.GUI_ALIGN.Y_TOP,
			flipped: true,
			scaleX: -1,
			scaleY: 1
		},
		TOP_RIGHT: {
			alignX: ig.GUI_ALIGN.X_LEFT,
			alignY: ig.GUI_ALIGN.Y_BOTTOM,
			flipped: true,
			scaleX: 1,
			scaleY: -1
		},
		TOP_LEFT: {
			alignX: ig.GUI_ALIGN.X_RIGHT,
			alignY: ig.GUI_ALIGN.Y_BOTTOM,
			flipped: false,
			scaleX: -1,
			scaleY: -1
		}
	};
	sc.TutorialPointingGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/message.png"),
		init: function(direction, text) {
			this.parent();
			var direction = direction || sc.TUT_BOX_POINTING_DIR.TOP_LEFT,
				box = new sc.RegularBoxGui(direction.flipped),
				text = new sc.TextGui(text, {
					maxWidth: 200
				});
			box.setContent(text);
			box.setAlign(direction.alignX, direction.alignY);
			box.setPos(18, 18);
			this.addChildGui(box);
			var arrow = new ig.ImageGui(this.gfx, 56, 64, 32, 32);
			arrow.hook.setScale(direction.scaleX, direction.scaleY);
			arrow.setAlign(direction.alignX, direction.alignY);
			this.addChildGui(arrow);
			this.setSize(box.hook.size.x + 18, box.hook.size.y + 18);
			this.setPivot(this.hook.size.x * (1 - (direction.scaleX + 1) / 2), this.hook.size.y * (1 - (direction.scaleY + 1) / 2));
			this.doStateTransition("HIDDEN", true)
		}
	});
	sc.TutorialShadowGui = ig.GuiElementBase.extend({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		transitions: {
			DEFAULT: {
				state: {
					alpha: 0.7
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 1,
					scaleY: 1
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		init: function(x, y, width, height) {
			this.parent();
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.setSize(ig.system.width, ig.system.height);
			this.setPivot(this.x + this.width / 2, this.y + this.height / 2);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			var width = this.hook.size.x,
				height = this.hook.size.y;
			drawables.addColor("black", 0, 0, width, this.y);
			drawables.addColor("black", 0, this.y, this.x, this.height);
			drawables.addColor("black", this.x + this.width, this.y, width - this.x - this.width, this.height);
			drawables.addColor("black", 0, this.y + this.height, width, height - this.y - this.height)
		}
	});
	sc.TutorialMarkerGui = ig.GuiElementBase.extend({
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
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		shadowGui: null,
		highlightGui: null,
		pointerGui: null,
		callback: null,
		screenInteract: null,
		sounds: {
			start: new ig.Sound("media/sound/hud/popup-2.ogg", 1)
		},
		init: function(x, y, width, height, text, direction, pivotFactor, stopTime, callback) {
			this.parent();
			this.hook.pauseGui = true;
			this.setSize(ig.system.width, ig.system.height);
			this.hook.zIndex = 2E3;
			this.stopTime = stopTime;
			stopTime = new sc.TutorialShadowGui(x, y, width, height);
			this.addChildGui(stopTime);
			this.shadowGui = stopTime;
			var highlight = new sc.WhiteLineBox(width + 2, height + 2);
			highlight.setPos(x - 1, y - 1);
			highlight.doStateTransition("HIDDEN", true);
			this.addChildGui(highlight);
			this.highlightGui = highlight;
			direction = new sc.TutorialPointingGui(direction, text);
			x = x + width * pivotFactor;
			y = direction.scaleY == 1 ? y + height : y - direction.hook.size.y;
			direction.scaleX == -1 && (x = x - direction.hook.size.x);
			direction.setPos(x, y);
			this.addChildGui(direction);
			this.pointerGui = direction;
			stopTime.doStateTransition("DEFAULT");
			highlight.doStateTransition("DEFAULT");
			direction.doStateTransition("DEFAULT", false, false, null, 0.1);
			if (this.stopTime) {
				ig.slowMotion.add(0, 0, "tutorialMsg");
				ig.soundManager.pushPaused();
				this.sounds.start.play()
			}
			this.callback = callback;
			this.screenInteract = new sc.ScreenInteractEntry(this);
			this.screenInteract.autoCtrlIgnore = true;
			ig.interact.addEntry(this.screenInteract)
		},
		onInteraction: function() {
			ig.interact.removeEntry(this.screenInteract);
			this._close()
		},
		_close: function() {
			this.shadowGui.doStateTransition("HIDDEN");
			this.highlightGui.doStateTransition("HIDDEN");
			this.pointerGui.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			if (this.stopTime) {
				ig.soundManager.popPaused();
				ig.slowMotion.clearNamed("tutorialMsg", 0)
			}
			this.callback && this.callback()
		}
	})
});
ig.baked = !0;
