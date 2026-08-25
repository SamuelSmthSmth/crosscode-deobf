ig.module("game.feature.beta.beta-controls").requires("impact.base.game").defines(function() {
    sc.BetaControls = ig.GameAddon.extend({
        init: function() {
            this.parent("BetaControls")
        },
        postUpdateOrder: 9E3,
        onPostUpdate: function() {
            ig.input.pressed("langedit") && ig.langEdit && ig.langEdit.showMask();
            ig.input.pressed("savedialog") && window.SHOW_SAVE_DIALOG(ig.storage.getLastSlotData())
        }
    });
    sc.submitSaveImport = function(b) {
        b && ig.storage.pushSlotData(b)
    };
    ig.addGameAddon(function() {
        return sc.betaControls = new sc.BetaControls
    })
});
ig.baked = !0;
