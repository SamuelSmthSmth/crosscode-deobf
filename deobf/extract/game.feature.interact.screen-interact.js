ig.module("game.feature.interact.screen-interact").requires("impact.feature.interact.interact").defines(function() {
    sc.ScreenInteractEntry = ig.InteractEntry.extend({
        callbackObject: null,
        withEscape: false,
        autoCtrlIgnore: false,
        init: function(b, a) {
            this.callbackObject = b;
            this.withEscape = a ? a : false
        },
        update: function() {
            if (sc.control.interactPressed(this.withEscape, this.autoCtrlIgnore)) {
                ig.interact.setBlockDelay();
                this.callbackObject.onInteraction()
            }
        }
    })
});
ig.baked = !0;
