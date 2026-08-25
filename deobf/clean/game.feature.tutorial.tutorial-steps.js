/**
 * game.feature.tutorial.tutorial-steps
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.tutorial.tutorial-steps")`.
 *
 * Tutorial event steps:
 *   - START_FORCE_INPUT — show the input-forcer overlay (blocks game
 *     until the player performs the required input)
 *   - CLEAR_FORCE_INPUT — dismiss the input-forcer
 */
ig.module("game.feature.tutorial.tutorial-steps").requires(
    "impact.base.action",
    "game.feature.tutorial.input-forcer"
).defines(function () {

    ig.EVENT_STEP.START_FORCE_INPUT = ig.EventStepBase.extend({
        inputEntry: null, title: null, textKeyboard: null, textGamepad: null,
        _wm: new ig.Config({
            attributes: {
                inputEntry: { _type: "String", _info: "Name of player config", _select: sc.INPUT_FORCER_ENTRIES },
                title: { _type: "LangLabel", _info: "Title of input forcer" },
                textKeyboard: { _type: "LangLabel", _info: "Text for Keyboard" },
                textGamepad: { _type: "LangLabel", _info: "Text for Gamepad" }
            }
        }),
        init: function (data) {
            this.inputEntry = data.inputEntry;
            this.title = data.title;
            this.textKeyboard = data.textKeyboard;
            this.textGamepad = data.textGamepad;
        },
        start: function () {
            sc.inputForcer.setEntry(this.inputEntry, this.title, this.textKeyboard, this.textGamepad);
        },
        run: function () { return !sc.inputForcer.isBlocking(); }
    });

    ig.EVENT_STEP.CLEAR_FORCE_INPUT = ig.EventStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),
        init: function () {},
        start: function () { sc.inputForcer.clearEntry(); }
    });
});
ig.baked = !0;