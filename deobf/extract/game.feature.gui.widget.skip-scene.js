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
        modelChanged: function(b, a, d) {
            a == sc.GAME_MODEL_MSG.CUTSCENE_SKIP ? d ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN") : a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && sc.model.isReset() && this.doStateTransition("HIDDEN")
        }
    })
});
ig.baked = !0;
