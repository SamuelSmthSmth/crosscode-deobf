/**
 * impact.feature.database.database
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.database.database")`.
 *
 * `ig.database`: loads the game database JSON (ig.DATABASE_FILE) and exposes
 * `ig.database.get(key)` plus `ig.database.register(...)` for editor entry
 * types.
 */
ig.module("impact.feature.database.database")
    .requires("impact.base.loader", "game.config")
    .defines(function () {

    ig.Database = ig.SingleLoadable.extend({
        cacheType: "Database",
        data: null,
        entries: {},

        init: function () {
            if (!ig.TERRAIN) return ig.warn("No DATABASE specified. Please create ig.DATABASE in game.config");
            if (!ig.TERRAIN_FILE) return ig.warn("Can't initialize database because no ig.DATABASE_FILE was provided");
            this.parent();
        },

        /** Register an editor type: name -> { editor, displayName, external? }. */
        register: function (name, editor, displayName, external) {
            this.entries[name] = {
                editor: editor,
                displayName: displayName || name
            };
            if (external) {
                this.entries[name].external = {
                    path: external.path || null,
                    data: external.data
                };
            }
        },

        get: function (key) {
            return this.data[key];
        },

        loadInternal: function () {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.DATABASE_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            });
        },

        onerror: function (error) {
            this.data = {
                error: error
            };
            this.loadingFinished(true);
        },

        onload: function (data) {
            this.data = data;
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Database: \n%O", "color:#149AEB", "", data);
        }
    });

    ig.database = new ig.Database();
});
ig.baked = !0;
