/**
 * game.feature.combat.gui.pvp-gui
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.gui.pvp-gui")`.
 *
 * PvP round/ko popups: `sc.PvpRoundGui` announces the round number with an
 * optional countdown, and `sc.PvpKoGui` shows the KO splash. Both are
 * transient center-screen banners.
 */
ig.module("game.feature.combat.gui.pvp-gui")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.box")
    .defines(function () {

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

        init: function (round, countdown) {
            this.parent();
            this.setSize(64, 64);
            this.setPivot(32, 32);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, -80);

            var label = new sc.TextGui("Round", {});
            label.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            label.setPos(0, -5);
            this.addChildGui(label);

            var number = new sc.NumberGui(9, {
                size: sc.NUMBER_SIZE.LARGE
            });
            number.setNumber(round);
            number.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            number.setPos(0, 9);
            this.addChildGui(number);

            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            if (countdown) this.timer = 1
        },

        update: function () {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    sc.pvp.finalizeRoundStart();
                    this.remove()
                }
            }
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 0, 0, 64, 64)
        },

        remove: function () {
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

        init: function () {
            this.parent();
            this.setSize(64, 64);
            this.setPivot(32, 32);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, 0);
            this.doStateTransition("START", true);
            this.doStateTransition("DEFAULT");
            this.timer = 1
        },

        update: function () {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                this.timer <= 0 && this.remove()
            }
        },

        remove: function () {
            this.timer = 0;
            this.doStateTransition("HIDDEN", false, true)
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 64, 0, 64, 64).setCompositionMode("lighter");
            renderer.addGfx(this.gfx, 0, 0, 128, 0, 64, 64)
        }
    })
});
ig.baked = !0;
