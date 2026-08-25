/**
 * @module game.feature.interact.skip-interact
 *
 * Skip-interact system: a prioritized stack of entries that can request to
 * skip cutscenes/dialogs. Only the top-priority active entry receives skip
 * events; entries get ENABLED/DISABLED notifications when the active entry
 * changes.
 */
ig.module("game.feature.interact.skip-interact").requires("impact.feature.interact.interact").defines(function() {
    function compareOrder(a, b) {
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
        addEntry: function(entry) {
            if (this.entries.indexOf(entry) == -1) {
                var previousActive = this.getActiveEntry();
                this.entries.push(entry);
                this.entries.sort(compareOrder);
                entry = this.getActiveEntry();
                if (previousActive != entry) {
                    if (previousActive) previousActive.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.DISABLED);
                    entry.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.ENABLED)
                }
            }
        },
        removeEntry: function(entry) {
            var previousActive = this.getActiveEntry();
            this.entries.erase(entry);
            entry = this.getActiveEntry();
            if (previousActive != entry) {
                if (previousActive) previousActive.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.DISABLED);
                if (entry) entry.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.ENABLED)
            }
        },
        getActiveEntry: function() {
            return this.entries[0]
        },
        triggerSkip: function() {
            var activeEntry = this.getActiveEntry();
            if (activeEntry) activeEntry.handler.onSkipInteract(sc.SKIP_INTERACT_MSG.SKIPPED)
        }
    });
    sc.SkipInteractEntry = ig.Class.extend({
        handler: null,
        order: 0,
        init: function(handler, order) {
            this.handler = handler;
            this.order = order
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
