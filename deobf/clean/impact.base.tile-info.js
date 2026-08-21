/**
 * impact.base.tile-info
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.tile-info")`.
 *
 * Loads `data/tile-infos.json` (via `ig.TILEINFO_FILE`) and maps animated tile
 * indices to their animation frames. `ig.TileInfo` is created per tileset key and
 * lets the renderer know which tiles are animated and how fast.
 */
ig.module("impact.base.tile-info").defines(function () {

    ig.TileInfoList = ig.SingleLoadable.extend({
        tiledata: null,

        init: function () {
            this.parent();
        },

        loadInternal: function () {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.TILEINFO_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this),
            });
        },

        onerror: function () {
            this.tiledata = {};
            this.loadingFinished(true);
        },

        onload: function (data) {
            this.tiledata = data;
            this.loadingFinished(true);
        },
    });
    ig.tileInfoList = new ig.TileInfoList();

    ig.TileInfo = ig.Class.extend({
        animatedTiles: {}, // tile index -> animation frames array
        animSpeed: 0.2,

        /**
         * @param {string} key tileset key into tile-infos.json
         */
        init: function (key) {
            if (ig.tileInfoList.tiledata[key]) {
                var data = ig.tileInfoList.tiledata[key];
                for (var i = data.animations.length; i--;) {
                    var anim = data.animations[i];
                    for (var j = anim.length; j--;) this.animatedTiles[anim[j]] = anim;
                }
                if (data.settings) this.animSpeed = data.settings.tileAnimSpeed || 0.2;
            }
        },

        /**
         * @returns {number[]|null} animation frames for a tile index, or null if static.
         */
        getAnimTiles: function (tileIndex) {
            return this.animatedTiles[tileIndex] || null;
        },
    });
});
