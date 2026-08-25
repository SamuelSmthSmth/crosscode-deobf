ig.module("game.feature.credits.credits-steps").requires("impact.base.action", "impact.base.event", "game.feature.credits.credit-loadable").defines(function() {
    ig.EVENT_STEP.SHOW_CREDIT_SECTION = ig.EventStepBase.extend({
        name: null,
        credits: null,
        guiElement: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the section. MUST BE GIVEN"
                },
                credits: {
                    _type: "Select",
                    _info: "Credit Section to show",
                    _select: "credits"
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            if (!this.name) throw Error("No name for credits entry!");
            if (!window.wm) this.credits = new sc.CreditSectionLoadable(b.credits)
        },
        start: function() {
            if (this.name) {
                var b = ig.gui.namedGuiElements[this.name];
                b && b.remove()
            }
            this.guiElement = ig.gui.createEventGui(this.name, "CreditSection", this.credits);
            ig.gui.spawnEventGui(this.guiElement)
        },
        clearCached: function() {
            this.guiElement && ig.gui.freeEventGui(this.guiElement);
            this.credits && this.credits.decreaseRef()
        }
    });
    ig.EVENT_STEP.SET_CREDITS_SPEED = ig.EventStepBase.extend({
        value: 1,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Credit speed scaling. Default is 1.",
                    _default: 1
                }
            }
        }),
        init: function(b) {
            this.value = b.value
        },
        start: function() {
            sc.credits.speed = this.value
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_CREDIT_TRIGGER = ig.EventStepBase.extend({
        credits: null,
        trigger: null,
        _wm: new ig.Config({
            attributes: {
                credits: {
                    _type: "String",
                    _info: "Name of the credit section gui which contains the trigger"
                },
                trigger: {
                    _type: "CreditsTriggerSelect",
                    _info: "Name of the trigger"
                }
            }
        }),
        init: function(b) {
            assertContent(b, "trigger", "credits");
            this.trigger = b.trigger.trigger;
            this.credits = b.credits
        },
        start: function(b) {
            var a = ig.gui.namedGuiElements[this.credits];
            if (a) b._gui = a
        },
        run: function(b) {
            return !b._gui ? true : b._gui && !b._gui.triggers[this.trigger] ? false : true
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_CREDIT_SECTION_DONE = ig.EventStepBase.extend({
        name: null,
        offscreen: false,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the section. MUST BE GIVEN"
                },
                offscreen: {
                    _type: "Boolean",
                    _info: "If true, waits until credits entry is really offscreen",
                    _default: false
                }
            }
        }),
        init: function(b) {
            assertContent(b,
                "name");
            this.name = b.name;
            this.offscreen = b.offscreen || false
        },
        start: function(b) {
            var a = ig.gui.namedGuiElements[this.name];
            if (a) b._gui = a
        },
        run: function(b) {
            return !b._gui ? true : b._gui && (this.offscreen ? !b._gui.isOffscreen : !b._gui.finished) ? false : true
        }
    })
});
ig.baked = !0;
