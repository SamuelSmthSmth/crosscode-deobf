/**
 * @module game.feature.gui.hud.sp-mini-hud
 * @description sc.SpMiniHudGui: the tiny SP bar (max 4 pips) shown above the
 *   player, hiding when SP reaches zero.
 */
ig.module("game.feature.gui.hud.sp-mini-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers").defines(function() {
	sc.SpMiniHudGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					scaleY: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		gfx: new ig.Image("media/gui/status-gui.png"),
		params: null,
		targetSp: 0,
		init: function(params) {
			this.parent();
			this.setSize(22, 3);
			this.params = params;
			sc.Model.addObserver(params, this)
		},
		onDetach: function() {
			sc.Model.removeObserver(this.params, this)
		},
		update: function() {
			this.targetSp = this.params.currentSp
		},
		updateDrawables: function(drawables) {
			for (var maxSp = this.params.maxSp, current = Math.floor(this.targetSp), showPips = maxSp > 8, offsetX = 0, width, i = 0; i < maxSp; i = i + 4)
				if (showPips && i + 4 < current) {
					drawables.addGfx(this.gfx, offsetX, 0, 104, 164, 4, 3);
					offsetX = offsetX + 5
				} else if (showPips && i >= current) {
					drawables.addGfx(this.gfx, offsetX, 0, 104, 160, 4, 3);
					offsetX = offsetX + 5
				} else {
					var remaining = (current - i).limit(0, 4);
					if (remaining) {
						width = remaining * 2;
						drawables.addGfx(this.gfx, offsetX, 0, 108, 164, width, 3);
						offsetX = offsetX + width
					}
					if (remaining < 4) {
						width = (4 - remaining) * 2;
						drawables.addGfx(this.gfx, offsetX, 0, 108, 160, width, 3);
						offsetX = offsetX + width
					}
					showPips || (offsetX = offsetX + 1)
				}
		},
		modelChanged: function(model, msg) {
			if (msg == sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED && sc.model.player.params.maxSp == 0) this.targetSp = 0
		}
	})
});
ig.baked = !0;
