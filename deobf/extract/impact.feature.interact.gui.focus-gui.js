ig.module("impact.feature.interact.gui.focus-gui").requires("impact.feature.gui.gui").defines(function() {
    ig.FocusGui = ig.GuiElementBase.extend({
        focus: false,
        buttonGroup: null,
        buttonInteract: null,
        active: true,
        keepPressed: false,
        pressed: false,
        keepMouseFocus: false,
        init: function(b, a) {
            this.parent();
            this.hook.setMouseRecord(true);
            this.active = b == void 0 ? true : b;
            this.keepPressed = a == void 0 ? false : a
        },
        onMouseInteract: function(b) {
            b && (this.buttonGroup && this.buttonGroup.buttonInteract ? this.buttonGroup.buttonInteract.setMouseOverGui(this) :
                this.buttonInteract && this.buttonInteract.setMouseOverGui(this))
        },
        focusGained: function() {
            this.focus = true
        },
        focusLost: function() {
            this.focus = false
        },
        invokeButtonPress: function() {
            this.onButtonPress()
        },
        onButtonPress: function() {},
        canPlayFocusSounds: function() {
            return true
        },
        canLeaveFocus: function() {
            return true
        },
        setPressed: function(b) {
            this.pressed = b
        },
        setActive: function(b) {
            this.active = b
        },
        isSameAs: function(b) {
            return this == b
        }
    })
});
ig.baked = !0;
