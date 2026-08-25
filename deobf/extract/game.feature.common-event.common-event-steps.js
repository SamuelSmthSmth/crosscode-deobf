ig.module("game.feature.common-event.common-event-steps").requires("game.feature.common-event.common-event", "impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.TRIGGER_COMMON_EVENTS = ig.EventStepBase.extend({
        commonEventType: null,
        _wm: new ig.Config({
            attributes: {
                commonEventType: {
                    _type: "String",
                    _info: "Type of Common Event",
                    _select: sc.COMMON_EVENT_TYPE
                }
            }
        }),
        init: function(b) {
            this.commonEventType = b.commonEventType
        },
        start: function() {
            sc.commonEvents.triggerEvent(this.commonEventType, {})
        }
    });
    ig.EVENT_STEP.CALL_EVENT = ig.EventStepBase.extend({
        callEvent: null,
        _wm: new ig.Config({
            attributes: {
                callEvent: {
                    _type: "CallEvent",
                    _info: "Call event that will be called."
                }
            }
        }),
        init: function(b) {
            this.callEvent = b.callEvent
        },
        start: function() {
            sc.commonEvents.startCallEvent(this.callEvent)
        }
    });
    ig.EVENT_STEP.CALL_EVENT_INLINE = ig.EventStepBase.extend({
        callEvent: null,
        _wm: new ig.Config({
            attributes: {
                callEvent: {
                    _type: "CallEvent",
                    _info: "Call event that will be called."
                }
            }
        }),
        init: function(b) {
            this.callEvent = b.callEvent
        },
        getInlineEvent: function() {
            return sc.commonEvents.getInlineCallEvent(this.callEvent)
        },
        getInlineEventInput: function() {
            return sc.commonEvents.getInlineCallData(this.callEvent)
        }
    });
    ig.EVENT_STEP.CANCEL_COMMON_EVENTS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                commonEventType: {
                    _type: "String",
                    _info: "Type of Common Event to cancel",
                    _select: sc.COMMON_EVENT_TYPE
                }
            }
        }),
        init: function(b) {
            this.commonEventType = b.commonEventType
        },
        start: function() {
            sc.commonEvents.cancelEvent(this.commonEventType)
        }
    })
});
ig.baked = !0;
