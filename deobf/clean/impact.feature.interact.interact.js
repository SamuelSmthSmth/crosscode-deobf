/**
 * impact.feature.interact.interact
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.interact.interact")`.
 *
 * The interaction subsystem core: `ig.InteractEntry` (base class for things
 * that can take over the controls, e.g. menu button groups) and
 * `ig.InteractManager` (`ig.interact`) — the game add-on that keeps a stack
 * of entries, updates only the top one, and supports a short block delay
 * after an entry is removed.
 */
ig.module("impact.feature.interact.interact")
    .requires("impact.base.game")
    .defines(function () {

    /** Base class for interact entries (only the top stack entry is updated). */
    ig.InteractEntry = ig.Class.extend({
        isActive: function () {
            return ig.interact.entries[ig.interact.entries.length - 1] == this;
        },

        onConnect: function () {},
        onDisconnect: function () {},
        update: function () {}
    });

    /** Manages the stack of interact entries and the input block timer. */
    ig.InteractManager = ig.GameAddon.extend({
        blockTimer: 0,
        entries: [],

        init: function () {
            this.parent("Interact");
        },

        addEntry: function (entry) {
            if (this.entries.indexOf(entry) == -1) {
                this.entries.push(entry);
                entry.onConnect();
            }
        },

        removeEntry: function (entry) {
            var index = this.entries.indexOf(entry);
            if (index != -1) {
                this.entries.splice(index, 1);
                entry.onDisconnect();
            }
        },

        /** Block input for `delay` seconds after an entry is removed (default 0.2). */
        setBlockDelay: function (delay) {
            this.blockTimer = delay === void 0 ? 0.2 : delay;
        },

        isBlocked: function () {
            return this.blockTimer > 0;
        },

        deferredUpdateOrder: 0,

        /** Count down the block timer, then update the top entry. */
        onDeferredUpdate: function () {
            if (this.blockTimer > 0) {
                this.blockTimer = this.blockTimer - ig.system.actualTick;
                if (this.blockTimer < 0) {
                    this.blockTimer = 0;
                } else {
                    return;
                }
            }
            this.entries.length > 0 && this.entries[this.entries.length - 1].update();
        }
    });

    ig.addGameAddon(function () {
        return ig.interact = new ig.InteractManager();
    });
});
ig.baked = !0;
