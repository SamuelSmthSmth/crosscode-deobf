/**
 * game.feature.beta.beta-controls
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.beta.beta-controls")`.
 *
 * Debug/beta keyboard shortcuts: F7 opens the language editor overlay,
 * F10 opens the save-dialog import helper. Also defines `sc.submitSaveImport`
 * for externally pushing save data into the game.
 */
ig.module("game.feature.beta.beta-controls").requires(
    "impact.base.game"
).defines(function () {

    sc.BetaControls = ig.GameAddon.extend({
        init: function () {
            this.parent("BetaControls");
        },
        postUpdateOrder: 9000,
        onPostUpdate: function () {
            ig.input.pressed("langedit") && ig.langEdit && ig.langEdit.showMask();
            ig.input.pressed("savedialog") && window.SHOW_SAVE_DIALOG(
                ig.storage.getLastSlotData()
            );
        }
    });

    /** @param {object} [data] save-slot data to push into storage */
    sc.submitSaveImport = function (data) {
        data && ig.storage.pushSlotData(data);
    };

    ig.addGameAddon(function () {
        return sc.betaControls = new sc.BetaControls;
    });
});
ig.baked = !0;