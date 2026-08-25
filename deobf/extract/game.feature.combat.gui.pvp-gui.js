ig.module("game.feature.combat.gui.pvp-gui").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
    sc.PvpRoundGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 3,
                    scaleY: 0
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/pvp.png"),
        timer: 0,
        init: function(b, a) {
            this.parent();
            this.setSize(64, 64);
            this.setPivot(32, 32);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, -80);
            var d = new sc.TextGui("Round", {});
            d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            d.setPos(0, -5);
            this.addChildGui(d);
            d = new sc.NumberGui(9, {
                size: sc.NUMBER_SIZE.LARGE
            });
            d.setNumber(b);
            d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            d.setPos(0, 9);
            this.addChildGui(d);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            if (a) this.timer = 1
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    sc.pvp.finalizeRoundStart();
                    this.remove()
                }
            }
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 0, 0, 64, 64)
        },
        remove: function() {
            this.timer = 0;
            this.doStateTransition("HIDDEN", false, true)
        }
    });
    sc.PvpKoGui = ig.GuiElementBase.extend({
        transitions: {
            START: {
                state: {
                    scaleX: 3,
                    scaleY: 3
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 3,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/pvp.png"),
        timer: 0,
        init: function() {
            this.parent();
            this.setSize(64, 64);
            this.setPivot(32, 32);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, 0);
            this.doStateTransition("START", true);
            this.doStateTransition("DEFAULT");
            this.timer = 1
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                this.timer <= 0 && this.remove()
            }
        },
        remove: function() {
            this.timer = 0;
            this.doStateTransition("HIDDEN", false, true)
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 64, 0, 64, 64).setCompositionMode("lighter");
            b.addGfx(this.gfx, 0, 0, 128,
                0, 64, 64)
        }
    })
});
ig.baked = !0;
