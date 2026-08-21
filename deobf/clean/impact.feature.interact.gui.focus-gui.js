/**
 * impact.feature.interact.gui.focus-gui
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.interact.gui.focus-gui")`.
 *
 * `ig.FocusGui` — the base class for GUI elements that can receive keyboard /
 * mouse focus inside a button group. Tracks focus state and pressed state,
 * routes mouse interaction up to its owning `ig.ButtonGroup`, and exposes the
 * hooks subclasses use for focus/press behaviour.
 */
ig.module("impact.feature.interact.gui.focus-gui")
    .requires("impact.feature.gui.gui")
    .defines(function () {

    ig.FocusGui = ig.GuiElementBase.extend({
        focus: false,
        buttonGroup: null,
        buttonInteract: null,
        active: true,
        keepPressed: false,
        pressed: false,
        keepMouseFocus: false,

        /**
         * @param {boolean} active - whether the element can be interacted with
         * @param {boolean} keepPressed - keep the pressed state after releasing
         */
        init: function (active, keepPressed) {
            this.parent();
            this.hook.setMouseRecord(true);
            this.active = active == void 0 ? true : active;
            this.keepPressed = keepPressed == void 0 ? false : keepPressed;
        },

        /** Route mouse-over to the owning button group / interact entry. */
        onMouseInteract: function (isMouseOver) {
            isMouseOver && (this.buttonGroup && this.buttonGroup.buttonInteract ?
                this.buttonGroup.buttonInteract.setMouseOverGui(this) :
                this.buttonInteract && this.buttonInteract.setMouseOverGui(this));
        },

        focusGained: function () {
            this.focus = true;
        },

        focusLost: function () {
            this.focus = false;
        },

        invokeButtonPress: function () {
            this.onButtonPress();
        },

        onButtonPress: function () {},

        canPlayFocusSounds: function () {
            return true;
        },

        canLeaveFocus: function () {
            return true;
        },

        setPressed: function (pressed) {
            this.pressed = pressed;
        },

        setActive: function (active) {
            this.active = active;
        },

        isSameAs: function (other) {
            return this == other;
        }
    });
});
ig.baked = !0;
