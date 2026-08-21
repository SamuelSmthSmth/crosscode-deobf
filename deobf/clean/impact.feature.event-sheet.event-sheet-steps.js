/**
 * impact.feature.event-sheet.event-sheet-steps
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.event-sheet.event-sheet-steps")`.
 *
 * Registers the `CALL_EVENT_FROM_SHEET` event step: runs a named event from an
 * event sheet inside another event's flow.
 */
ig.module("impact.feature.event-sheet.event-sheet-steps")
    .requires("impact.base.action", "impact.base.event")
    .defines(function () {

    /**
     * Calls the event `name` from the sheet at `path` (see `eventCall` config),
     * feeding it the given input. The sheet reference is held until the cache
     * is cleared.
     */
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

        /**
         * @param {Object} params - must contain `eventCall: { path, name, input }`
         */
        init: function (params) {
            assertContent(params, "eventCall");
            params = params.eventCall;
            this.eventSheet = new ig.EventSheet(params.path);
            this.eventName = params.name;
            this.eventInput = params.input;
        },

        clearCached: function () {
            this.eventSheet.decreaseRef();
        },

        getInlineEvent: function () {
            return this.eventSheet.getEvent(this.eventName);
        },

        getInlineEventInput: function () {
            return this.eventInput;
        }
    });
});
