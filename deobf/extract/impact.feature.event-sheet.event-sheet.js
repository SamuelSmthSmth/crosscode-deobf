ig.module("impact.feature.event-sheet.event-sheet").requires("impact.base.event").defines(function() {
    ig.EventSheet = ig.JsonLoadable.extend({
        cacheType: "EventSheet",
        events: {},
        onCacheCleared: function() {
            for (var b in this.events) this.events[b].clearCached()
        },
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/events/", ".json") + ig.getCacheSuffix()
        },
        onload: function(b) {
            for (var a in b.events) {
                var d = b.events[a];
                this.events[a] = new ig.Event({
                    name: a,
                    input: d.input,
                    steps: d.steps
                })
            }
        },
        getEvent: function(b) {
            return this.events[b] ||
                null
        }
    })
});
ig.baked = !0;
