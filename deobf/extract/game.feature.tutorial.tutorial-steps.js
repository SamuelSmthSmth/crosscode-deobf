ig.module("game.feature.tutorial.tutorial-steps").requires("impact.base.action", "game.feature.tutorial.input-forcer").defines(function() {
    ig.EVENT_STEP.START_FORCE_INPUT = ig.EventStepBase.extend({
        inputEntry: null,
        title: null,
        textKeyboard: null,
        textGamepad: null,
        _wm: new ig.Config({
            attributes: {
                inputEntry: {
                    _type: "String",
                    _info: "Name of player config",
                    _select: sc.INPUT_FORCER_ENTRIES
                },
                title: {
                    _type: "LangLabel",
                    _info: "Title of input forcer"
                },
                textKeyboard: {
                    _type: "LangLabel",
                    _info: "Text for Keyboard"
                },
                textGamepad: {
                    _type: "LangLabel",
                    _info: "Text for Gamepad"
                }
            }
        }),
        init: function(b) {
            this.inputEntry = b.inputEntry;
            this.title = b.title;
            this.textKeyboard = b.textKeyboard;
            this.textGamepad = b.textGamepad
        },
        start: function() {
            sc.inputForcer.setEntry(this.inputEntry, this.title, this.textKeyboard, this.textGamepad)
        },
        run: function() {
            return !sc.inputForcer.isBlocking()
        }
    });
    ig.EVENT_STEP.CLEAR_FORCE_INPUT = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.inputForcer.clearEntry()
        }
    })
});
ig.baked = !0;
