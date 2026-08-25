ig.module("impact.feature.event-sheet.event-sheet-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.CALL_EVENT_FROM_SHEET = ig.EventStepBase.extend({
        eventSheet: null,
        eventName: null,
        eventInput: null,
        _wm: new ig.Config({
            attributes: {
                eventCall: {
                    _type: "EventSheetCall",
                    _info: "The event to be called",
                    _popup: true
                }
            },
            width: 600
        }),
        init: function(b) {
            assertContent(b, "eventCall");
            b = b.eventCall;
            this.eventSheet = new ig.EventSheet(b.path);
            this.eventName = b.name;
            this.eventInput = b.input
        },
        clearCached: function() {
            this.eventSheet.decreaseRef()
        },
        getInlineEvent: function() {
            return this.eventSheet.getEvent(this.eventName)
        },
        getInlineEventInput: function() {
            return this.eventInput
        }
    })
});
ig.baked = !0;
