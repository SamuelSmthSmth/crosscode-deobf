/**
 * @module game.feature.arena.arena-loadable
 *
 * Loadable/cacheable assets for the arena feature. ArenaCache triggers
 * loading of all cup data when the arena is entered. CupAsset is a
 * JSON loadable that fetches individual cup configuration files from
 * data/arena/.
 */
ig.module("game.feature.arena.arena-loadable").requires("impact.base.game", "impact.base.loader").defines(function() {
    sc.ArenaCache = ig.Cacheable.extend({
        cacheType: "ARENA_CACHE",
        init: function() {
            this.parent();
            sc.arena.loadCache()
        },
        onCacheCleared: function() {
            sc.arena.clearCache()
        },
        getCacheKey: function() {
            return "arenaCacheKey"
        }
    });
    sc.CupAsset = ig.Loadable.extend({
        cacheType: "CupAsset",
        data: null,
        key: null,
        init: function(cupKey, path) {
            this.key = cupKey;
            this.parent(path)
        },
        loadInternal: function(path) {
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(ig.root + path.toPath("data/arena/", ".json") + ig.getCacheSuffix()),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.data = null;
            this.loadingFinished(false)
        },
        onload: function(loadedData) {
            this.data = loadedData;
            this.loadingFinished(true)
        }
    })
});
ig.baked = !0;