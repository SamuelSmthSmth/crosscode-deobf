/**
 * @module game.feature.gui.base.boxes
 * @description The shared box GUIs built on message.png: RegularBoxGui,
 *   WhiteLineBox, ArrowBoxGui/PointingBoxGui, LineGui, black/white variants,
 *   SideBoxGui (title + stacked content), CenterBoxGui and SmallEntityBox.
 */
ig.module("game.feature.gui.base.boxes").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
	sc.RegularBoxGui = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 16,
			left: 8,
			top: 16,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 0,
					y: 0
				}
			}
		}),
		PADDING_X: 8,
		PADDING_Y: 4,
		init: function(flipped) {
			this.parent(0, 0, flipped, this.ninepatch);
			this.hook.pivot.x = this.hook.size.x / 2;
			this.hook.pivot.y = this.hook.size.y / 2
		},
		setContent: function(content) {
			this.setSize(content.hook.size.x + this.PADDING_X * 2, content.hook.size.y + this.PADDING_Y * 2);
			this.addChildGui(content);
			content.setPos(this.PADDING_X, this.PADDING_Y)
		}
	});
	sc.WhiteLineBox = ig.BoxGui.extend({
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
					scaleX: 1.5,
					scaleY: 1.5
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 14,
			height: 14,
			left: 1,
			top: 1,
			right: 1,
			bottom: 1,
			offsets: {
				"default": {
					x: 16,
					y: 96
				}
			}
		}),
		init: function(width, height) {
			this.parent(width, height, false, this.ninepatch);
			this.ninepatch.skipTile[0] = this.ninepatch.skipTile[2] = 1;
			this.ninepatch.skipTile[4] = 1;
			this.ninepatch.skipTile[6] = this.ninepatch.skipTile[8] = 1;
			this.hook.pivot.x = this.hook.size.x / 2;
			this.hook.pivot.y = this.hook.size.y / 2
		}
	});
	var paddingOptions = [{
		x: 8,
		y: 4
	}, {
		x: 10,
		y: 6
	}];
	sc.ArrowBoxGui = ig.BoxGui.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 0.8
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		gfx: new ig.Image("media/gui/message.png"),
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 16,
			left: 8,
			top: 16,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 0,
					y: 0
				},
				dream: {
					x: 224,
					y: 0
				}
			}
		}),
		PADDING_X: 8,
		PADDING_Y: 4,
		PADDING_POINTER: 8,
		pointerType: 0,
		init: function(width, height, pointerType) {
			var padding = paddingOptions[sc.options.get("message-padding")];
			this.PADDING_X = padding.x;
			this.PADDING_Y = padding.y;
			this.parent(width + this.PADDING_X * 2, height + this.PADDING_Y * 2, false, this.ninepatch);
			if (ig.dreamFx.isActive()) {
				this.currentTileOffset = "dream";
				this.hook.localAlpha = 0.5
			}
			if (this.hook.size.x % 2 == 1) this.hook.size.x = this.hook.size.x + 1;
			this.pointerType = pointerType || sc.ArrowBoxGui.POINTER.NONE;
			this.hook.pivot.x = this.pointerType > 2 ? this.hook.size.x : 0;
			this.hook.pivot.y = this.hook.size.y
		},
		resize: function(width, height) {
			this.setSize(width + this.PADDING_X * 2, height + this.PADDING_Y * 2)
		},
		setPointerDown: function() {
			if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_LEFT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_LEFT;
			else if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_RIGHT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_RIGHT
		},
		updateDrawables: function(drawables) {
			this.ninepatch.skipTile[0] = this.pointerType;
			this.pointerType > 2 && drawables.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x, 0);
			this.parent(drawables);
			if (this.pointerType) {
				var srcX = ig.dreamFx.isActive() ? 224 : 0,
					pointerHeight = Math.min(this.ninepatch.tile.top, this.hook.size.y - this.ninepatch.tile.bottom);
				drawables.addGfx(this.gfx, -8, 0, srcX + (this.pointerType % 2 == 0 ? 16 : 0), 40, 16, pointerHeight)
			}
			this.pointerType > 2 && drawables.undoTransform()
		}
	});
	sc.ArrowBoxGui.POINTER = {
		NONE: 0,
		TOP_LEFT: 1,
		BOTTOM_LEFT: 2,
		TOP_RIGHT: 3,
		BOTTOM_RIGHT: 4
	};
	sc.PointingBoxGui = ig.BoxGui.extend({
		transitions: {
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0,
				timeFunction: KEY_SPLINES.EASE_IN
			},
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0,
				timeFunction: KEY_SPLINES.EASE_OUT
			}
		},
		gfx: new ig.Image("media/gui/message.png"),
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 16,
			left: 8,
			top: 16,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 0,
					y: 0
				}
			}
		}),
		direction: 0,
		init: function() {
			this.parent(width + this.PADDING_X * 2, height + this.PADDING_Y * 2, false, this.ninepatch);
			if (this.hook.size.x % 2 == 1) this.hook.size.x = this.hook.size.x + 1;
			this.pointerType = pointerType || ig.BoxGui.POINTER.NONE;
			this.hook.pivot.x = this.pointerType > 2 ? this.hook.size.x : 0;
			this.hook.pivot.y = this.hook.size.y
		},
		setPointerDown: function() {
			if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_LEFT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_LEFT;
			else if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_RIGHT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_RIGHT
		},
		updateDrawables: function(drawables) {
			this.ninepatch.skipTile[0] = this.pointerType;
			this.pointerType > 2 && drawables.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x, 0);
			this.parent(drawables);
			if (this.pointerType) {
				var pointerHeight = Math.min(this.ninepatch.tile.top, this.hook.size.y - this.ninepatch.tile.bottom);
				drawables.addGfx(this.gfx, -8, 0, this.pointerType % 2 == 0 ? 16 : 0, 40, 16, pointerHeight)
			}
			this.pointerType > 2 && drawables.undoTransform()
		}
	});
	sc.LineGui = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 12,
			height: 2,
			left: 2,
			top: 0,
			right: 0,
			bottom: 0,
			offsets: {
				"default": {
					x: 0,
					y: 80
				}
			}
		}),
		init: function(width) {
			this.parent(width, 2, false, this.ninepatch)
		}
	});
	sc.BlackGrayBox = ig.BoxGui.extend({
		text: null,
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 16,
			left: 8,
			top: 16,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 0,
					y: 0
				}
			}
		}),
		init: function(width, height, flipped) {
			this.parent(width, height, flipped)
		}
	});
	sc.BlackWhiteBox = ig.BoxGui.extend({
		text: null,
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 22,
			height: 22,
			left: 5,
			top: 5,
			right: 5,
			bottom: 5,
			offsets: {
				"default": {
					x: 48,
					y: 0
				}
			}
		}),
		init: function(width, height, flipped) {
			this.parent(width, height, flipped);
			this.hook.localAlpha = 0.8
		}
	});
	sc.SideBorderBox = ig.BoxGui.extend({
		text: null,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			},
			FLIPPED: {
				state: {
					scaleX: -1,
					scaleY: -1
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 12,
			height: 20,
			left: 0,
			top: 7,
			right: 0,
			bottom: 5,
			offsets: {
				"default": {
					x: 32,
					y: 0
				}
			}
		}),
		init: function(height, flipped) {
			this.parent(12, height, false);
			flipped && this.doStateTransition("FLIPPED", true)
		},
		setHeight: function(height) {
			this.setSize(12, height)
		}
	});
	sc.SideBoxGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		titleGui: null,
		contentEntries: [],
		right: false,
		init: function(right, title) {
			this.parent();
			this.hook.localAlpha = 1;
			this.right = right;
			this.titleGui = new sc.SlickTitleGui(title, right, 75);
			this.titleGui.hook.localAlpha = this.hook.localAlpha;
			this.titleGui.setAlign(this.right ? ig.GUI_ALIGN.X_RIGHT : ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.titleGui.doStateTransition("HIDDEN", true);
			this.addChildGui(this.titleGui);
			this.setSize(this.titleGui.hook.size.x, this.titleGui.hook.size.y)
		},
		pushContent: function(content, show, paddingX, paddingY) {
			content = new sc.SlickBoxGui(content, this.right, paddingX || 8, paddingY || 2, 80);
			this.right && content.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.contentEntries.push(content);
			content.doStateTransition("HIDDEN", true);
			show && content.doStateTransition("DEFAULT");
			this.addChildGui(content);
			this.rearrangeContent(content)
		},
		replaceContent: function(index, content) {
			this.contentEntries[index].setContent(content);
			this.rearrangeContent()
		},
		removeContent: function(index) {
			index = this.contentEntries.splice(index, 1)[0];
			index.doStateTransition("HIDDEN", false, true);
			this.rearrangeContent();
			return index
		},
		clearContent: function() {
			for (; this.contentEntries.length;) this.contentEntries.pop().doStateTransition("HIDDEN", false, true)
		},
		popContent: function() {
			this.contentEntries.pop().doStateTransition("HIDDEN", false, true);
			this.rearrangeContent()
		},
		rearrangeContent: function(highlight) {
			for (var width = this.titleGui.hook.size.x, y = this.titleGui.hook.size.y, i = 0; i < this.contentEntries.length; ++i) {
				var entry = this.contentEntries[i];
				i && (y = y + 1);
				entry == highlight ? entry.setPos(0, y) : entry.doPosTranstition(0, y, 0.3, KEY_SPLINES.EASE_OUT);
				y = y + entry.hook.size.y;
				width = Math.max(width, entry.hook.size.x)
			}
			this.setSize(width, y)
		},
		hide: function(instant, callback) {
			if (!this.hook.removeAfterTransition) {
				this.titleGui.doStateTransition("HIDDEN", instant);
				for (var i = 0; i < this.contentEntries.length; ++i) this.contentEntries[i].doStateTransition("HIDDEN", instant);
				this.doStateTransition("HIDDEN", false, false, callback)
			}
		},
		show: function(instant, delay) {
			if (!this.hook.removeAfterTransition) {
				this.titleGui.doStateTransition("DEFAULT", instant, false, null, delay || 0);
				for (var i = 0; i < this.contentEntries.length; ++i) this.contentEntries[i].doStateTransition("DEFAULT", instant, false, null, delay || 0);
				this.doStateTransition("DEFAULT")
			}
		},
		remove: function() {
			this.titleGui.doStateTransition("HIDDEN");
			for (var i = 0; i < this.contentEntries.length; ++i) this.contentEntries[i].doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true)
		}
	});
	sc.CenterBoxGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0.5,
					scaleX: 1,
					scaleY: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		iconGfx: new ig.Image("media/gui/message.png"),
		msgContent: null,
		centerBox: null,
		borderLeftGui: null,
		borderRightGui: null,
		init: function(content, instant) {
			this.parent();
			this.msgContent = content;
			this.centerBox = new sc.BlackWhiteBox(content.hook.size.x + 16, content.hook.size.y + 10);
			this.addChildGui(this.centerBox);
			this.centerBox.setPos(5, 3);
			this.setSize(this.centerBox.hook.size.x + 10, this.centerBox.hook.size.y + 6);
			this.hook.pivot.x = this.hook.size.x / 2;
			this.hook.pivot.y = this.hook.size.y / 2;
			this.addChildGui(this.msgContent);
			this.msgContent.setPos(13, 8);
			this.borderLeftGui = new sc.SideBorderBox(this.hook.size.y - 1);
			this.borderLeftGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.addChildGui(this.borderLeftGui);
			this.borderRightGui = new sc.SideBorderBox(this.hook.size.y - 1, true);
			this.borderRightGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(this.borderRightGui);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT", instant)
		},
		remove: function() {
			this.doStateTransition("HIDDEN", false, true)
		},
		resize: function() {
			var content = this.msgContent;
			this.centerBox.setSize(content.hook.size.x + 16, content.hook.size.y + 10);
			this.setSize(this.centerBox.hook.size.x + 10, this.centerBox.hook.size.y + 6);
			this.hook.pivot.x = this.hook.size.x / 2;
			this.hook.pivot.y = this.hook.size.y / 2;
			this.borderLeftGui.setHeight(this.hook.size.y - 1);
			this.borderRightGui.setHeight(this.hook.size.y - 1)
		}
	});
	var centerPos = Vec2.create(),
		rumbleInterval = 2 / 60;
	sc.SMALL_BOX_ALIGN = {
		BOTTOM: function(pos, coll) {
			pos.x = coll.size.x / 2;
			pos.y = coll.size.y
		},
		CENTER: function(pos, coll) {
			pos.x = coll.size.x / 2;
			pos.y = coll.size.y / 2 - coll.size.z / 2
		},
		TOP: function(pos, coll) {
			pos.x = coll.size.x / 2;
			pos.y = -coll.size.z
		}
	};
	sc.SmallEntityBox = ig.GuiElementBase.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 0,
			left: 16,
			top: 11,
			right: 16,
			bottom: 0,
			offsets: {
				"default": {
					x: 96,
					y: 64
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			START: {
				state: {
					alpha: 0.5,
					scaleX: 0.8,
					scaleY: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0.5,
					scaleX: 2,
					scaleY: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN_SMALL: {
				state: {
					alpha: 0.5,
					scaleX: 1,
					scaleY: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		entity: null,
		textGui: null,
		timer: 0,
		rumbleTime: 0,
		finished: false,
		entityOff: Vec2.create(),
		offY: 0,
		fixedPos: null,
		hideSmall: false,
		init: function(entity, text, time, align, offY) {
			this.parent();
			this.entity = entity;
			this.textGui = new sc.TextGui(text, {
				font: sc.fontsystem.smallFont
			});
			this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.textGui.setPos(0, 1);
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x + 16, 11);
			this.hook.localAlpha = 0.5;
			this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
			this.doStateTransition("START", true);
			this.doStateTransition("DEFAULT");
			this.timer = time;
			this.rumbleTime = time / 2;
			align = align || sc.SMALL_BOX_ALIGN.TOP;
			align(this.entityOff, entity.coll);
			this.offY = offY || 0
		},
		setFixedPos: function() {
			this.fixedPos = Vec3.create();
			Vec3.assign(this.fixedPos, this.entity.coll.pos)
		},
		stopRumble: function() {
			this.rumbleTime = this.timer
		},
		update: function() {
			this._updatePos();
			this.timer = this.timer - ig.system.actualTick;
			this.timer <= 0 && this.remove()
		},
		updateDrawables: function(drawables) {
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, "default")
		},
		_updatePos: function() {
			if (this.entity) {
				var coll = this.entity.coll,
					coll = this.fixedPos || coll.pos;
				ig.system.getScreenFromMapPos(centerPos, Math.round(coll.x + this.entityOff.x), Math.round(coll.y - coll.z + this.entityOff.y - this.offY));
				coll = 0;
				if (this.timer > this.rumbleTime) {
					var step = Math.floor(this.timer / rumbleInterval);
					step % 4 == 1 && (coll = 2);
					step % 4 == 3 && (coll = -2)
				}
				this.hook.pos.x = centerPos.x - this.hook.size.x / 2 + coll;
				this.hook.pos.y = centerPos.y - this.hook.size.y / 2 - 4 + 0
			}
		},
		remove: function() {
			this.finished = true;
			this.doStateTransition(this.hideSmall ? "HIDDEN_SMALL" : "HIDDEN", false, true)
		},
		isFinished: function() {
			return this.finished
		}
	});
	sc.LineBoxGui = ig.GuiElementBase.extend({
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 16,
			height: 0,
			left: 16,
			top: 26,
			right: 16,
			bottom: 0,
			offsets: {
				"default": {
					x: 48,
					y: 32
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0.5,
					scaleX: 1,
					scaleY: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		content: null,
		paddingX: 0,
		init: function(content, paddingX) {
			this.parent();
			this.content = content;
			this.paddingX = paddingX || 16;
			this.hook.localAlpha = 0.8;
			this.addChildGui(this.content);
			this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.setSize(ig.system.width, 26);
			this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT")
		},
		updateDrawables: function(drawables) {
			var width = this.content.hook.size.x + this.paddingX * 2,
				offsetX = ig.system.width / 2 - width / 2;
			this.ninepatch.draw(drawables, width, this.hook.size.y, "default", offsetX, 0);
			drawables.addColor("black", 0, 12, offsetX, 2);
			drawables.addColor("black", offsetX + width, 12, offsetX, 2)
		}
	});
	sc.SmallBlackBoxGui = ig.BoxGui.extend({
		text: null,
		transitions: {
			DEFAULT: {
				state: {
					alpha: 0.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 8,
			height: 0,
			left: 4,
			top: 15,
			right: 4,
			bottom: 0,
			offsets: {
				"default": {
					x: 24,
					y: 80
				}
			}
		}),
		init: function(width) {
			this.parent(width, 15, false)
		}
	})
});
ig.baked = !0;
