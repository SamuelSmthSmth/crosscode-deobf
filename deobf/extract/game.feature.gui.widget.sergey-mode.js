ig.module("game.feature.gui.widget.sergey-mode").requires("impact.feature.gui.gui").defines(function() {
    ig.GUI.SergeyMode = ig.GuiElementBase.extend({
        _wm: new ig.Config({
            width: 100,
            attributes: {}
        }),
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
        cornerImage: null,
        patternSheet: null,
        startSound: null,
        endSound: null,
        scroll: 0,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.zIndex = 49;
            this.hook.localAlpha = 0.4;
            this.cornerImage = new ig.Image("media/gui/sergey-mode-corner.png");
            this.patternSheet = new ig.ImagePatternSheet("media/gui/sergey-mode-corner.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 64, 64, 64, 0, 1, 1);
            this.startSound = new ig.Sound("media/sound/scenes/sergey-mode-start.ogg", 0.8);
            this.endSound = new ig.Sound("media/sound/scenes/sergey-mode-end.ogg", 0.8)
        },
        clearCached: function() {
            this.cornerImage.decreaseRef();
            this.patternSheet.decreaseRef()
        },
        onAttach: function() {
            this.doStateTransition("HIDDEN",
                true);
            this.doStateTransition("DEFAULT");
            ig.soundManager.pushPaused();
            this.startSound.play()
        },
        update: function() {
            this.scroll = this.scroll - ig.system.actualTick * 32
        },
        updateDrawables: function(b) {
            b.addPattern(this.patternSheet.getPattern(0), 0, 0, this.scroll, this.scroll, ig.system.width, ig.system.height).setCompositionMode("lighter");
            b.addGfx(this.cornerImage, 0, 20, 0, 0, 64, 64, false, false).setCompositionMode("lighter");
            b.addGfx(this.cornerImage, ig.system.width - 64, 20, 0, 0, 64, 64, true, false).setCompositionMode("lighter");
            b.addGfx(this.cornerImage, ig.system.width - 64, ig.system.height - 64 - 20, 0, 0, 64, 64, true, true).setCompositionMode("lighter");
            b.addGfx(this.cornerImage, 0, ig.system.height - 64 - 20, 0, 0, 64, 64, false, true).setCompositionMode("lighter")
        },
        remove: function() {
            this.endSound.play();
            ig.soundManager.popPaused();
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;
