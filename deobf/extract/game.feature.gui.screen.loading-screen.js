ig.module("game.feature.gui.screen.loading-screen").requires("impact.feature.gui.gui", "impact.base.image").defines(function() {
    sc.LoadingScreenGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/loading.png"),
        timer: 0,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        textBlock: null,
        init: function() {
            this.parent();
            this.hook.zIndex = 2E3;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y =
                ig.system.height;
            this.textBlock = new ig.TextBlock(sc.fontsystem.font, "", {});
            sc.Model.addObserver(sc.model, this);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            ig.game.hasTeleportMessageShown && this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(b) {
            this.timer = this.timer + ig.system.actualTick;
            b.addGfxTile(this.gfx, ig.system.width - 56, ig.system.height - 56, Math.floor(this.timer / 0.05) % 16, 48);
            if (window.IG_GAME_DEBUG)
                if (ig.game.currentLoadingResource instanceof ig.game.mapLoader || ig.game.currentLoadingResource instanceof ig.Loader) {
                    this.textBlock.setText("LOADING: " + ig.game.currentLoadingResource.lastPath);
                    b.addText(this.textBlock, 5, 5)
                } else if (ig.game.currentLoadingResource != "") {
                this.textBlock.setText(ig.game.currentLoadingResource);
                b.addText(this.textBlock, 5, 5)
            }
        },
        modelChanged: function(b, a) {
            if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) {
                var d = b.isLoading();
                this.doStateTransition(d ? "DEFAULT" : "HIDDEN")
            }
        }
    })
});
ig.baked = !0;
