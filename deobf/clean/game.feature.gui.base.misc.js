/**
 * @module game.feature.gui.base.misc
 * @description Small shared GUI pieces: sc.DebugFocusGui, the animated
 *   sc.SlopeLine (diagonal map-slot divider) and sc.LabeledNumberGuy.
 */
ig.module("game.feature.gui.base.misc").requires("impact.feature.interact.gui.focus-gui", "impact.feature.gui.gui").defines(function() {
	sc.DebugFocusGui = ig.FocusGui.extend({
		color: "#00FF00",
		overColor: "#FF0000",
		focusColor: "#0000FF",
		init: function(width, height) {
			this.parent();
			this.hook.size.x = width || 20;
			this.hook.size.y = height || 20;
			this.hook.pivot.x = this.hook.size.x / 2;
			this.hook.pivot.y = this.hook.size.y / 2
		},
		updateDrawables: function(drawables) {
			var color = null,
				color = this.focus ? this.focusColor : this.hook.mouseOver ? this.overColor : this.color;
			drawables.addColor(color, 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.5)
		}
	});
	sc.SlopeLine_Color = {
		WHITE: {
			x: 88,
			y: 458
		},
		BLUE: {
			x: 105,
			y: 458
		},
		ORANGE: {
			x: 122,
			y: 458
		},
		GREY: {
			x: 576,
			y: 0
		},
		DARK_GREY: {
			x: 592,
			y: 0
		}
	};
	sc.SlopeLine = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		pixel: 0,
		right: true,
		down: true,
		height: 0,
		timer: 0,
		time: 0,
		visible: true,
		_tempPixel: 0,
		_animating: 0,
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
		init: function(pixel, right, down, color) {
			this.parent();
			this.color = color || sc.SlopeLine_Color.WHITE;
			this._tempPixel = this.pixel = pixel;
			this.right = right != void 0 ? right : true;
			this.down = down != void 0 ? down : true
		},
		update: function() {
			if (this.timer < this.time) {
				this.timer = this.timer + ig.system.actualTick;
				if (this.timer >= this.time) {
					this.timer = this.time;
					if (this._animating == 2) this.visible = false;
					this._animating = 0
				}
			}
			if (this._animating == 0) this._tempPixel = this.pixel;
			else if (this._animating == 1) this._tempPixel = Math.ceil(Math.max(0, this.timer) / this.time * this.pixel);
			else if (this._animating == 2) this._tempPixel = Math.ceil((1 - Math.max(0, this.timer) / this.time) * this.pixel)
		},
		updateDrawables: function(drawables) {
			if (this.visible) {
				var x = 0,
					count = Math.ceil(Math.abs(this._tempPixel) / 16),
					remaining = this._tempPixel,
					size = 16;
				if (!this.right || !this.down) drawables.addTransform().setScale(this.right ? 1 : -1, this.down ? 1 : -1);
				for (; count--;) {
					remaining < 16 && (size = remaining);
					drawables.addGfx(this.gfx, x, x, this.color.x, this.color.y, size, size);
					x = x + 16;
					remaining = Math.max(0, remaining - 16)
				}(!this.right || !this.down) && drawables.undoTransform()
			}
		},
		show: function(time, delay) {
			if (time) {
				this.timer = 0 - (delay || 0);
				this.time = time || 0.3
			} else this.time = this.timer = 0.1;
			this._animating = 1;
			this.visible = true
		},
		hide: function(time, delay) {
			if (time) {
				this.timer = 0 - (delay || 0);
				this.time = time || 0.3;
				this._animating = 2
			} else {
				this.timer = this.time = 0;
				this.visible = false;
				this._animating = 0
			}
		}
	});
	sc.LabeledNumberGuy = ig.GuiElementBase.extend({
		numberGui: null,
		init: function(label, offsetX, maxNumber, settings) {
			this.parent();
			label = new sc.TextGui(label);
			this.addChildGui(label);
			this.numberGui = new sc.NumberGui(maxNumber, settings);
			this.numberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.numberGui.setPos(0, 3);
			this.addChildGui(this.numberGui);
			this.setSize(offsetX + this.numberGui.hook.size.x, Math.max(label.hook.size.y, this.numberGui.hook.size.y))
		},
		setNumber: function(number, instant) {
			this.numberGui.setNumber(number, instant)
		}
	})
});
ig.baked = !0;
