/**
 * @module game.feature.timers.timers-steps
 *
 * Event steps to add, remove, reset, pause, and resume named timers through
 * the timers model.
 */
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
        init: function(settings) {
            this.name = settings.name;
            this.mode = sc.TIMER_TYPES[settings.mode] || 0;
            this.duration = settings.duration || 0;
            this.area = settings.area || null;
            this.temp = settings.temp || null;
            this.showGui = settings.gui || false;
            this.millis = settings.millis != void 0 ? settings.millis : true;
            this.quest =
                settings.quest || null;
            this.assist = settings.assist || false
        },
        start: function() {
            var duration = ig.Event.getExpressionValue(this.duration);
            this.assist && (duration = duration / (sc.options.get("assist-puzzle-speed") || 1));
            sc.timers.addTimer(this.name, this.mode, duration, this.area, this.temp, this.showGui, this.millis, this.quest)
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
        init: function(settings) {
            this.name = settings.name
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
        init: function(settings) {
            this.name = settings.name;
            this.mode = settings.mode ? sc.TIMER_TYPES[settings.mode] : void 0;
            this.duration = settings.duration || void 0
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
        init: function(settings) {
            this.name = settings.name
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
        init: function(settings) {
            this.name = settings.name
        },
        start: function() {
            sc.timers.resumeTimer(this.name)
        }
    })
});
ig.baked = !0;
