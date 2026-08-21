/**
 * impact.feature.interact.press-repeater
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.interact.press-repeater")`.
 *
 * `ig.PressRepeater` — turns a held input into repeat presses: the first
 * repeat fires after `firstDelay`, subsequent ones every `repeatDelay`.
 * Switching inputs resets the delay.
 */
ig.module("impact.feature.interact.press-repeater")
    .defines(function () {

    ig.PressRepeater = ig.Class.extend({
        currentPressed: null,
        lastPressed: null,
        timer: 0,
        firstDelay: 0.3,
        repeatDelay: 0.1,

        init: function (firstDelay, repeatDelay) {
            this.firstDelay = firstDelay || 0.3;
            this.repeatDelay = repeatDelay || 0.1;
        },

        setDown: function (pressed) {
            this.currentPressed = pressed;
        },

        /**
         * @returns {*} the input value when a (re)press should fire, else null
         */
        getPressed: function () {
            var pressed = this.currentPressed;
            this.currentPressed = null;
            if (pressed != this.lastPressed) {
                this.timer = this.firstDelay;
                return this.lastPressed = pressed;
            }
            if (pressed) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.timer = this.repeatDelay;
                    return pressed;
                }
            }
            return null;
        }
    });
});
ig.baked = !0;
