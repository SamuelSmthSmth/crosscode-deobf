ig.module("game.feature.timers.timers-steps").requires("impact.base.action", "impact.base.entity", "impact.base.event", "game.feature.timers.timers-model").defines(function() {
    ig.EVENT_STEP.ADD_TIMER = ig.EventStepBase.extend({
        name: null,
        mode: null,
        duration: 0,
        area: null,
        temp: null,
        showGui: false,
        millis: true,
        quest: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "Timer",
                    _info: "Name of the timer to access it. Must be unique"
                },
                mode: {
                    _type: "Select",
                    _info: "Mode the timer should use",
                    _select: sc.TIMER_TYPES
                },
                millis: {
                    _type: "Boolean",
                    _info: "Set false if millis should be shown",
                    _default: true
                },
                gui: {
                    _type: "Boolean",
                    _info: "True if a gui should be added to the top-right",
                    _optional: true,
                    _default: true
                },
                duration: {
                    _type: "NumberExpression",
                    _info: "Time in seconds the timer should update. Only applicable for COUNTDOWN mode.",
                    _optional: true
                },
                area: {
                    _type: "String",
                    _info: "Only update timer when inside this area.",
                    _select: "areas",
                    _optional: true
                },
                temp: {
                    _type: "Boolean",
                    _info: "True if the timer should be deleted once a map has been switched",
                    _optional: true,
                    _default: true
                },
                quest: {
                    _type: "QuestResetSelect",
                    _info: "If the timer hits the duration on COUNTDOWN mode or your leave the map and the temp property is set to true.",
                    _optional: true
                },
                assist: {
                    _type: "Boolean",
                    _info: "If true: scale time with puzzle speed assist parameter",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.mode = sc.TIMER_TYPES[b.mode] || 0;
            this.duration = b.duration || 0;
            this.area = b.area || null;
            this.temp = b.temp || null;
            this.showGui = b.gui || false;
            this.millis = b.millis != void 0 ? b.millis : true;
            this.quest =
                b.quest || null;
            this.assist = b.assist || false
        },
        start: function() {
            var b = ig.Event.getExpressionValue(this.duration);
            this.assist && (b = b / (sc.options.get("assist-puzzle-speed") || 1));
            sc.timers.addTimer(this.name, this.mode, b, this.area, this.temp, this.showGui, this.millis, this.quest)
        }
    });
    ig.EVENT_STEP.REMOVE_TIMER = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "Timer",
                    _info: "Name of the timer to remove."
                }
            }
        }),
        init: function(b) {
            this.name = b.name
        },
        start: function() {
            sc.timers.removeTimer(this.name)
        }
    });
    ig.EVENT_STEP.RESET_TIMER = ig.EventStepBase.extend({
        name: null,
        mode: null,
        duration: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "Timer",
                    _info: "Name of the timer to access it. Must be unique"
                },
                mode: {
                    _type: "Select",
                    _info: "New timer mode",
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "New duration time if any. Only valid when timer is COUNTDOWN",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.mode = b.mode ? sc.TIMER_TYPES[b.mode] : void 0;
            this.duration = b.duration || void 0
        },
        start: function() {
            sc.timers.resetTimer(this.name,
                this.mode, this.duration)
        }
    });
    ig.EVENT_STEP.PAUSE_TIMER = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "Timer",
                    _info: "Name of the timer to pause."
                }
            }
        }),
        init: function(b) {
            this.name = b.name
        },
        start: function() {
            sc.timers.stopTimer(this.name)
        }
    });
    ig.EVENT_STEP.RESUME_TIMER = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "Timer",
                    _info: "Name of the timer to pause."
                }
            }
        }),
        init: function(b) {
            this.name = b.name
        },
        start: function() {
            sc.timers.resumeTimer(this.name)
        }
    })
});
ig.baked = !0;
