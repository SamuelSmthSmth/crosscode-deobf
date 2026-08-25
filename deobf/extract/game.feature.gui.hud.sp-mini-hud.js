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
        init: function(b) {
            this.parent();
            this.setSize(22, 3);
            this.params = b;
            sc.Model.addObserver(b, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(this.params,
                this)
        },
        update: function() {
            this.targetSp = this.params.currentSp
        },
        updateDrawables: function(b) {
            for (var a = this.params.maxSp, d = Math.floor(this.targetSp), c = a > 8, e = 0, f, g = 0; g < a; g = g + 4)
                if (c && g + 4 < d) {
                    b.addGfx(this.gfx, e, 0, 104, 164, 4, 3);
                    e = e + 5
                } else if (c && g >= d) {
                b.addGfx(this.gfx, e, 0, 104, 160, 4, 3);
                e = e + 5
            } else {
                var h = (d - g).limit(0, 4);
                if (h) {
                    f = h * 2;
                    b.addGfx(this.gfx, e, 0, 108, 164, f, 3);
                    e = e + f
                }
                if (h < 4) {
                    f = (4 - h) * 2;
                    b.addGfx(this.gfx, e, 0, 108, 160, f, 3);
                    e = e + f
                }
                c || (e = e + 1)
            }
        },
        modelChanged: function(b, a) {
            if (a == sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED &&
                sc.model.player.params.maxSp == 0) this.targetSp = 0
        }
    })
});
ig.baked = !0;
