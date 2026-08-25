/**
 * game.feature.credits.credits-steps
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.credits.credits-steps")`.
 *
 * Credits event steps:
 *   - SHOW_CREDIT_SECTION — spawns a named credit scroll section
 *   - SET_CREDITS_SPEED — adjusts scroll speed multiplier
 *   - WAIT_UNTIL_CREDIT_TRIGGER — pauses until a named trigger fires
 *   - WAIT_UNTIL_CREDIT_SECTION_DONE — pauses until section finishes/offscreens
 */
ig.module("game.feature.credits.credits-steps").requires(
    "impact.base.action",
    "impact.base.event",
    "game.feature.credits.credit-loadable"
).defines(function () {

    ig.EVENT_STEP.SHOW_CREDIT_SECTION = ig.EventStepBase.extend({
        name: null, credits: null, guiElement: null,
        _wm: new ig.Config({
            attributes: {
                name: { _type: "String", _info: "Name of the section. MUST BE GIVEN" },
                credits: { _type: "Select", _info: "Credit Section to show", _select: "credits" }
            }
        }),
        init: function (data) {
            this.name = data.name;
            if (!this.name) throw Error("No name for credits entry!");
            if (!window.wm) this.credits = new sc.CreditSectionLoadable(data.credits);
        },
        start: function () {
            if (this.name) {
                var existing = ig.gui.namedGuiElements[this.name];
                existing && existing.remove();
            }
            this.guiElement = ig.gui.createEventGui(this.name, "CreditSection", this.credits);
            ig.gui.spawnEventGui(this.guiElement);
        },
        clearCached: function () {
            this.guiElement && ig.gui.freeEventGui(this.guiElement);
            this.credits && this.credits.decreaseRef();
        }
    });

    ig.EVENT_STEP.SET_CREDITS_SPEED = ig.EventStepBase.extend({
        value: 1,
        _wm: new ig.Config({
            attributes: { value: { _type: "Number", _info: "Credit speed scaling. Default 1.", _default: 1 } }
        }),
        init: function (data) { this.value = data.value; },
        start: function () { sc.credits.speed = this.value; }
    });

    ig.EVENT_STEP.WAIT_UNTIL_CREDIT_TRIGGER = ig.EventStepBase.extend({
        credits: null, trigger: null,
        _wm: new ig.Config({
            attributes: {
                credits: { _type: "String", _info: "Name of credit section GUI with the trigger" },
                trigger: { _type: "CreditsTriggerSelect", _info: "Name of the trigger" }
            }
        }),
        init: function (data) {
            assertContent(data, "trigger", "credits");
            this.trigger = data.trigger.trigger;
            this.credits = data.credits;
        },
        start: function (event) {
            var gui = ig.gui.namedGuiElements[this.credits];
            if (gui) event._gui = gui;
        },
        run: function (event) {
            return !event._gui ? true
                : event._gui && !event._gui.triggers[this.trigger] ? false
                : true;
        }
    });

    ig.EVENT_STEP.WAIT_UNTIL_CREDIT_SECTION_DONE = ig.EventStepBase.extend({
        name: null, offscreen: false,
        _wm: new ig.Config({
            attributes: {
                name: { _type: "String", _info: "Name of the section. MUST BE GIVEN" },
                offscreen: { _type: "Boolean", _info: "If true, wait until completely offscreen", _default: false }
            }
        }),
        init: function (data) {
            assertContent(data, "name");
            this.name = data.name;
            this.offscreen = data.offscreen || false;
        },
        start: function (event) {
            var gui = ig.gui.namedGuiElements[this.name];
            if (gui) event._gui = gui;
        },
        run: function (event) {
            return !event._gui ? true
                : event._gui && (this.offscreen ? !event._gui.isOffscreen : !event._gui.finished) ? false
                : true;
        }
    });
});
ig.baked = !0;