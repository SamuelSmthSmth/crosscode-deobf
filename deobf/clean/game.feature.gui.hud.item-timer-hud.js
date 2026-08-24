/**
 * @module game.feature.gui.hud.item-timer-hud
 * @description sc.ItemTimerHudGui: the small countdown that shows how long
 *   item use remains blocked (after using an item in combat).
 */
ig.module("game.feature.gui.hud.item-timer-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
	sc.ItemTimerHudGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		numberGui: null,
		player: null,
		maxTime: null,
		init: function() {
			this.parent();
			this.setSize(44, 10);
			this.setPivot(0, 5);
			sc.Model.addObserver(sc.model.player, this);
			this.player = sc.model.player;
			this.numberGui = new sc.NumberGui(60, {
				leadingZeros: 2,
				size: sc.NUMBER_SIZE.TINY,
				color: sc.GUI_NUMBER_COLOR.WHITE
			});
			this.numberGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.numberGui.setNumber(0);
			this.numberGui.setPos(18, 0);
			this.addChildGui(this.numberGui);
			this.doStateTransition("HIDDEN", true)
		},
		update: function() {
			this.isVisible() && this.numberGui.setNumber(Math.ceil(this.player.itemBlockTimer))
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 216, 160, this.hook.size.x, this.hook.size.y);
			drawables.addColor("white", 16, 8, Math.ceil(this.player.itemBlockTimer / this.maxTime * 13), 1)
		},
		modelChanged: function(model, msg) {
			if (model == sc.model.player)
				if (msg == sc.PLAYER_MSG.ITEM_USED)
					if (this.player.itemBlockTimer > 0) {
						this.maxTime = this.player.itemBlockTimer;
						this.numberGui.setNumber(this.player.itemBlockTimer);
						this.doStateTransition("DEFAULT")
					} else this.doStateTransition("HIDDEN");
			else msg == sc.PLAYER_MSG.ITEM_BLOCK_FINISH ? this.doStateTransition("HIDDEN") : msg == sc.PLAYER_MSG.RESET_PLAYER && this.doStateTransition("HIDDEN", true)
		}
	})
});
ig.baked = !0;
