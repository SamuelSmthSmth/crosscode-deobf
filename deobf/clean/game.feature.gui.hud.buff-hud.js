/**
 * @module game.feature.gui.hud.buff-hud
 * @description sc.BuffHudGui: the status-buff icon row below the player, and
 *   sc.BuffHudEntry: a single buff icon with its remaining-time bar.
 */
ig.module("game.feature.gui.hud.buff-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui").defines(function() {
	sc.BuffHudEntry = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
			width: 2,
			height: 0,
			left: 2,
			top: 10,
			right: 2,
			bottom: 0,
			offsets: {
				"default": {
					x: 241,
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
					alpha: 0,
					offsetX: 20
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			REMOVE: {
				state: {
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			SCALED: {
				state: {
					scaleX: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			}
		},
		buff: null,
		id: 0,
		init: function(buff, id, x) {
			this.parent(10, 10);
			this.buff = buff;
			this.id = id || 0;
			buff = new sc.TextGui(buff.iconString, {
				font: sc.fontsystem.tinyFont,
				speed: ig.TextBlock.SPEED.IMMEDIATE
			});
			buff.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			buff.setPos(1, 1);
			this.addChildGui(buff);
			this.setSize(buff.hook.size.x + 5 + 1, 10);
			this.setPos(x, 0);
			this.setPivot(0, this.hook.size.y / 2);
			this.doStateTransition(id == 0 ? "HIDDEN" : "SCALED", true)
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			if (this.buff.hasTimer) {
				var height = Math.ceil(this.buff.getTimeFactor() * 8);
				drawables.addGfx(this.ninepatch.gfx, this.hook.size.x - 4, 1, 249, 129, 2, 8);
				height > 0 && drawables.addGfx(this.ninepatch.gfx, this.hook.size.x - 4, this.hook.size.y - 1 - height, 252, 129 + (8 - height), 2, height)
			}
		}
	});
	sc.BuffHudGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		startPiece: null,
		endPiece: null,
		buffSlots: [],
		init: function() {
			this.parent();
			sc.Model.addObserver(sc.model.player.params, this);
			this.startPiece = new ig.ImageGui(this.gfx, 216, 128, 10, 10);
			this.startPiece.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 20
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				REMOVE: {
					state: {
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.startPiece.doStateTransition("REMOVE", true);
			this.addChildGui(this.startPiece);
			this.endPiece = new ig.ImageGui(this.gfx, 230, 129, 10, 10);
			this.endPiece.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 20
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				REMOVE: {
					state: {
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.endPiece.doStateTransition("REMOVE", true);
			this.addChildGui(this.endPiece)
		},
		update: function() {
			for (var i = this.buffSlots.length, removed = false; i--;)
				if (this.buffSlots[i] && this.buffSlots[i].buff.getTimeFactor() <= 0) {
					i == 0 && !this.buffSlots[i + 1] ? this.buffSlots[i].doStateTransition("REMOVE", false, true) : this.buffSlots[i].doStateTransition("SCALED", false, true);
					this.buffSlots.splice(i, 1);
					removed = true
				} if (removed && this.sortSlots()) {
				this.startPiece.doStateTransition("REMOVE");
				this.endPiece.doStateTransition("REMOVE")
			}
		},
		sortSlots: function() {
			for (var x = 10, empty = true, slot = null, i = 0; i < this.buffSlots.length; i++)
				if (slot = this.buffSlots[i]) {
					empty = false;
					slot.doPosTranstition(x, 0, 0.2, KEY_SPLINES.EASE);
					slot.id = i;
					x = x + slot.hook.size.x
				} empty || this.endPiece.doPosTranstition(x, 0, 0.2, KEY_SPLINES.EASE);
			return empty
		},
		addBuff: function(buff) {
			for (var x = 10, index = 0, i = 0; i < this.buffSlots.length; i++)
				if (this.buffSlots[i]) {
					x = x + this.buffSlots[i].hook.size.x;
					index++
				} buff = new sc.BuffHudEntry(buff, index, x);
			buff.doStateTransition("DEFAULT");
			this.addChildGui(buff);
			this.buffSlots[index] = buff;
			if (index == 0) {
				this.startPiece.doStateTransition("HIDDEN", true);
				this.endPiece.doStateTransition("HIDDEN", true);
				this.endPiece.setPos(x + buff.hook.size.x, 0)
			} else this.endPiece.doPosTranstition(x + buff.hook.size.x, 0, 0.2, KEY_SPLINES.EASE);
			this.startPiece.doStateTransition("DEFAULT");
			this.endPiece.doStateTransition("DEFAULT")
		},
		removeAll: function() {
			this.hook.removeAllChildren();
			for (var i = 0; i < this.buffSlots.length; i++) this.buffSlots[i] && this.buffSlots[i].doStateTransition("REMOVE", true, true);
			this.buffSlots.length = 0;
			this.startPiece.doStateTransition("REMOVE", true);
			this.endPiece.doStateTransition("REMOVE", true);
			this.addChildGui(this.startPiece);
			this.addChildGui(this.endPiece)
		},
		modelChanged: function(model, msg, data) {
			msg == sc.COMBAT_PARAM_MSG.BUFF_ADDED ? this.addBuff(data) : (msg == sc.COMBAT_PARAM_MSG.RESET_STATS || msg == sc.COMBAT_PARAM_MSG.BUFFS_CLEARED) && this.removeAll()
		}
	})
});
ig.baked = !0;
