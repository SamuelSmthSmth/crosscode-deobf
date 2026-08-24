/**
 * @module game.feature.gui.widget.skip-scene
 * @description sc.SkipSceneGui: the "skip?" prompt that appears in the top
 *   right corner while a cutscene can be skipped.
 */
ig.module("game.feature.gui.widget.skip-scene").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui").defines(function() {
	sc.SkipSceneGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		textGui: null,
		timer: 0,
		init: function() {
			this.parent();
			this.hook.zIndex = 60;
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setPos(2, 1);
			sc.Model.addObserver(sc.model, this);
			this.textGui = new sc.TextGui(ig.lang.get("sc.gui.dialogs.skipAsk"));
			this.addChildGui(this.textGui);
			this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y);
			this.doStateTransition("HIDDEN", true)
		},
		modelChanged: function(model, msg, data) {
			msg == sc.GAME_MODEL_MSG.CUTSCENE_SKIP ? data ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN") : msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && sc.model.isReset() && this.doStateTransition("HIDDEN")
		}
	})
});
ig.baked = !0;
