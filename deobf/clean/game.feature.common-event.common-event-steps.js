/**
 * game.feature.common-event.common-event-steps
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.common-event.common-event-steps")`.
 *
 * Event steps for the common-event system:
 *   - TRIGGER_COMMON_EVENTS — fire a type-based common event
 *   - CALL_EVENT — call a named common event
 *   - CALL_EVENT_INLINE — inline a common event's steps into the current event flow
 *   - CANCEL_COMMON_EVENTS — cancel pending events of a given type
 */
ig.module("game.feature.common-event.common-event-steps").requires(
    "game.feature.common-event.common-event",
    "impact.base.action",
    "impact.base.event"
).defines(function () {

    /**
     * Trigger common events of a specific type (e.g. ENEMY_DEFEATED,
     * BATTLE_OVER, LEVEL_UP, etc.).
     */
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
        init: function (data) {
            this.commonEventType = data.commonEventType;
        },
        start: function () {
            sc.commonEvents.triggerEvent(this.commonEventType, {});
        }
    });

    /**
     * Call a named common event entry by its database key.
     */
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
        init: function (data) {
            this.callEvent = data.callEvent;
        },
        start: function () {
            sc.commonEvents.startCallEvent(this.callEvent);
        }
    });

    /**
     * Inline a common event into another event flow. Returns the event
     * object itself so the caller can chain it as a sub-event.
     */
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
        init: function (data) {
            this.callEvent = data.callEvent;
        },
        getInlineEvent: function () {
            return sc.commonEvents.getInlineCallEvent(this.callEvent);
        },
        getInlineEventInput: function () {
            return sc.commonEvents.getInlineCallData(this.callEvent);
        }
    });

    /**
     * Cancel pending common events of a specified type (removes them
     * from the delayed trigger stack).
     */
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
        init: function (data) {
            this.commonEventType = data.commonEventType;
        },
        start: function () {
            sc.commonEvents.cancelEvent(this.commonEventType);
        }
    });
});
ig.baked = !0;