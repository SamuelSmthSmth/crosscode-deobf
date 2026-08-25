ig.module("impact.base.tile-info").defines(function() {
    ig.TileInfoList = ig.SingleLoadable.extend({
        tiledata: null,
        init: function() {
            this.parent()
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.TILEINFO_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.tiledata = {};
            this.loadingFinished(true)
        },
        onload: function(b) {
            this.tiledata = b;
            this.loadingFinished(true)
        }
    });
    ig.tileInfoList = new ig.TileInfoList;
    ig.TileInfo = ig.Class.extend({
        animatedTiles: {},
        animSpeed: 0.2,
        init: function(b) {
            if (ig.tileInfoList.tiledata[b]) {
                for (var b = ig.tileInfoList.tiledata[b], a = b.animations.length; a--;)
                    for (var d = b.animations[a], c = d.length; c--;) this.animatedTiles[d[c]] = d;
                if (b.settings) this.animSpeed = b.settings.tileAnimSpeed || 0.2
            }
        },
        getAnimTiles: function(b) {
            return this.animatedTiles[b] || null
        }
    })
});
ig.baked = !0;
