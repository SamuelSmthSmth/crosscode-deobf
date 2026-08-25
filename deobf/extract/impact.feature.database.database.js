ig.module("impact.feature.database.database").requires("impact.base.loader", "game.config").defines(function() {
    ig.Database = ig.SingleLoadable.extend({
        cacheType: "Database",
        data: null,
        entries: {},
        init: function() {
            if (!ig.TERRAIN) return ig.warn("No DATABASE specified. Please create ig.DATABASE in game.config");
            if (!ig.TERRAIN_FILE) return ig.warn("Can't initialize database because no ig.DATABASE_FILE was provided");
            this.parent()
        },
        register: function(b, a, d, c) {
            this.entries[b] = {
                editor: a,
                displayName: d || b
            };
            if (c) this.entries[b].external = {
                path: c.path || null,
                data: c.data
            }
        },
        get: function(b) {
            return this.data[b]
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.DATABASE_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function(b) {
            this.data = {
                error: b
            };
            this.loadingFinished(true)
        },
        onload: function(b) {
            this.data = b;
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Database: \n%O", "color:#149AEB", "", b)
        }
    });
    ig.database = new ig.Database
});
ig.baked = !0;
