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
        init: function(b, a) {
            this.key = b;
            this.parent(a)
        },
        loadInternal: function(b) {
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(ig.root +
                    b.toPath("data/arena/", ".json") + ig.getCacheSuffix()),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.data = null;
            this.loadingFinished(false)
        },
        onload: function(b) {
            this.data = b;
            this.loadingFinished(true)
        }
    })
});
ig.baked = !0;
