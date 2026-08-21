/**
 * impact.feature.parallax.parallax-steps
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.parallax.parallax-steps")`.
 *
 * Registers the `SHOW_PARALLAX` event step: spawns the named parallax GUI
 * (created on demand, not inside the WorldMap editor) and runs its sequence
 * until it ends.
 */
ig.module("impact.feature.parallax.parallax-steps")
    .requires("impact.feature.parallax.parallax", "impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.SHOW_PARALLAX = ig.EventStepBase.extend({
        parallaxGui: null,

        _wm: new ig.Config({
            attributes: {
                parallax: {
                    _type: "String",
                    _info: "Parallax to show",
                    _select: "parallax"
                }
            }
        }),

        init: function (params) {
            if (!window.wm) {
                this.parallaxGui = ig.gui.createEventGui("__parallaxGui__", "Parallax", {
                    parallax: params.parallax
                });
            }
        },

        clearCached: function () {
            ig.gui.freeEventGui(this.parallaxGui);
        },

        start: function () {
            ig.gui.spawnEventGui(this.parallaxGui);
            this.parallaxGui.start();
        },

        run: function () {
            return this.parallaxGui.hasEnded();
        }
    });
});
ig.baked = !0;
