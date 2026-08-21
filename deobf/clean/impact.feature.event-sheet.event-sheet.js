/**
 * impact.feature.event-sheet.event-sheet
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.event-sheet.event-sheet")`.
 *
 * `ig.EventSheet` — a cacheable loader for named event sheets stored as JSON
 * files under `data/events/`. Each sheet contains a map of named events; an
 * event is an `ig.Event` built from `{ name, input, steps }`.
 */
ig.module("impact.feature.event-sheet.event-sheet")
    .requires("impact.base.event")
    .defines(function () {

    /**
     * Loads and caches event sheets (`data/events/*.json`).
     * Each sheet's JSON has an `events` map: name → { input, steps }.
     */
    ig.EventSheet = ig.JsonLoadable.extend({
        cacheType: "EventSheet",
        events: {},

        /** Drop the cached `ig.Event` instances (used when the JSON cache is cleared). */
        onCacheCleared: function () {
            for (var eventName in this.events) {
                this.events[eventName].clearCached();
            }
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/events/", ".json") + ig.getCacheSuffix();
        },

        /**
         * Build an `ig.Event` for every entry in the sheet's `events` map.
         * @param {Object} data - parsed JSON: { events: { name: { input, steps } } }
         */
        onload: function (data) {
            for (var eventName in data.events) {
                var eventData = data.events[eventName];
                this.events[eventName] = new ig.Event({
                    name: eventName,
                    input: eventData.input,
                    steps: eventData.steps
                });
            }
        },

        /** Look up a named event (returns `null` when the name is unknown). */
        getEvent: function (eventName) {
            return this.events[eventName] || null;
        }
    });
});
