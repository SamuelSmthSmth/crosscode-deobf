ig.module("game.feature.interact.skip-interact").requires("impact.feature.interact.interact").defines(function() {
    function b(a, b) {
        return a.order - b.order
    }
    sc.SKIP_INTERACT_MSG = {
        ENABLED: 1,
        DISABLED: 2,
        SKIPPED: 3
    };
    sc.SkipInteract = ig.GameAddon.extend({
        entries: [],
        init: function() {},
        addEntry: function(a) {
            if (this.entries.indexOf(a) == -1) {
                var d = this.getActiveEntry();
                this.entries.push(a);
                this.entries.sort(b);
                a = this.getActiveEntry();
                if (d != a) {
                    if (d) d.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.DISABLED);
                    a.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.ENABLED)
                }
            }
        },
        removeEntry: function(a) {
            var b = this.getActiveEntry();
            this.entries.erase(a);
            a = this.getActiveEntry();
            if (b != a) {
                if (b) b.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.DISABLED);
                if (a) a.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.ENABLED)
            }
        },
        getActiveEntry: function() {
            return this.entries[0]
        },
        triggerSkip: function() {
            var a = this.getActiveEntry();
            if (a) a.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.SKIPPED)
        }
    });
    sc.SkipInteractEntry = ig.Class.extend({
        handler: null,
        order: 0,
        init: function(a, b) {
            this.handler = a;
            this.order = b
        },
        isActive: function() {
            return sc.skipInteract.getActiveEntry() == this
        }
    });
    ig.addGameAddon(function() {
        return sc.skipInteract = new sc.SkipInteract
    })
});
ig.baked = !0;
