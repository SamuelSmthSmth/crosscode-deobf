/**
 * @module game.feature.interact.screen-interact
 *
 * A screen-level interact entry that triggers a callback object's
 * `onInteraction` when the interact/escape key is pressed.
 */
ig.module("game.feature.interact.screen-interact").requires("impact.feature.interact.interact").defines(function() {
    sc.ScreenInteractEntry = ig.InteractEntry.extend({
        callbackObject: null,
        withEscape: false,
        autoCtrlIgnore: false,
        init: function(callbackObject, withEscape) {
            this.callbackObject = callbackObject;
            this.withEscape = withEscape ? withEscape : false
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
