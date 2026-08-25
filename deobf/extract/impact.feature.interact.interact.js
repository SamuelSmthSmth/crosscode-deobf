ig.module("impact.feature.interact.interact").requires("impact.base.game").defines(function() {
    ig.InteractEntry = ig.Class.extend({
        isActive: function() {
            return ig.interact.entries[ig.interact.entries.length - 1] == this
        },
        onConnect: function() {},
        onDisconnect: function() {},
        update: function() {}
    });
    ig.InteractManager = ig.GameAddon.extend({
        blockTimer: 0,
        entries: [],
        init: function() {
            this.parent("Interact")
        },
        addEntry: function(b) {
            if (this.entries.indexOf(b) == -1) {
                this.entries.push(b);
                b.onConnect()
            }
        },
        removeEntry: function(b) {
            var a = this.entries.indexOf(b);
            if (a != -1) {
                this.entries.splice(a, 1);
                b.onDisconnect()
            }
        },
        setBlockDelay: function(b) {
            this.blockTimer = b === void 0 ? 0.2 : b
        },
        isBlocked: function() {
            return this.blockTimer > 0
        },
        deferredUpdateOrder: 0,
        onDeferredUpdate: function() {
            if (this.blockTimer > 0) {
                this.blockTimer = this.blockTimer - ig.system.actualTick;
                if (this.blockTimer < 0) this.blockTimer = 0;
                else return
            }
            this.entries.length > 0 && this.entries[this.entries.length - 1].update()
        }
    });
    ig.addGameAddon(function() {
        return ig.interact = new ig.InteractManager
    })
});
ig.baked = !0;
