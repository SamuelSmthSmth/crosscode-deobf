ig.module("impact.feature.terrain.terrain").requires("impact.base.loader", "game.config").defines(function() {
    var b = Vec2.create();
    ig.Terrain = ig.SingleLoadable.extend({
        cacheType: "Terrain",
        idToName: {},
        nameToId: {},
        tilesetIds: {},
        dangerTerrains: [],
        fallTerrain: [],
        init: function() {
            if (!ig.TERRAIN) return ig.warn("No TERRAIN specified. Please create ig.TERRAIN in game.config");
            if (!ig.TERRAIN_FILE) return ig.warn("Can't initialize terrain because no ig.TERRAIN_FILE was provided");
            ig.TERRAIN.undefined = 0;
            this.nameToId =
                ig.TERRAIN;
            for (var a in ig.TERRAIN) this.idToName[ig.TERRAIN[a]] = a;
            this.parent()
        },
        registerDangerTerrain: function(a, b) {
            this.dangerTerrains.push(a);
            b && this.fallTerrain.push(a)
        },
        isDangerTerrain: function(a) {
            return this.dangerTerrains.indexOf(a) != -1
        },
        isFallTerrain: function(a) {
            return this.fallTerrain.indexOf(a) != -1
        },
        getTerrain: function(a, d, c) {
            if (!a) return 0;
            var e = a.getCenter(b);
            if (a._collData && a._collData.groundEntry && a._collData.groundEntry.entity.terrain) return a._collData.groundEntry.entity.terrain * 1;
            var f = 0,
                g = a.level,
                h = ig.game.getLevelHeight(g);
            do {
                f = ig.game.getLevelHeight(g);
                f = this.getMapTerrain(e.x, e.y + f - h, g, d ? a.size.x : 0, d ? a.size.y : 0);
                g--
            } while (c && !f && g >= 0);
            return f || ig.TERRAIN_DEFAULT
        },
        getPointTerrain: function(a, b, c, e, f) {
            for (var g = ig.game.getLevelIdx(c), h = ig.game.getLevelHeight(g), i = ig.game.getEntitiesInRectangle(a - e / 2, b - f / 2, h, e, f, c - h), j = i.length, k = 0; j--;) {
                var l = i[j],
                    o = l.coll,
                    o = o.pos.z + o.size.z;
                if (l.terrain && o <= c && o >= h) {
                    k = l.terrain;
                    h = o
                }
            }
            return k ? k : this.getMapTerrain(a, b, g, e, f)
        },
        getMapTerrain: function(a,
            b, c, e, f) {
            if (!ig.game.levels[c]) return 0;
            var b = b - ig.game.levels[c].height,
                c = ig.game.levels[c].maps,
                g;
            if (g = this._checkMaps(c, a, b)) return g;
            if (e || f) {
                if (g = this._checkMaps(c, a - e / 2, b)) return g;
                if (g = this._checkMaps(c, a + e / 2, b)) return g;
                if (g = this._checkMaps(c, a, b - f / 2)) return g;
                if (g = this._checkMaps(c, a, b + f / 2)) return g
            }
            return 0
        },
        _checkMaps: function(a, b, c) {
            for (var e = a.length; e--;) {
                var f = this.tilesetIds[a[e].tilesetName];
                if (a[e] instanceof ig.MAP.Background && f) {
                    var g = a[e].getTile(b, c);
                    if (g && f[g - 1]) return f[g - 1] *
                        1
                }
            }
            return 0
        },
        getTerrainOfMapTile: function(a, b) {
            var c = this.tilesetIds[a.tilesetName];
            return !c ? ig.TERRAIN_DEFAULT : c[b - 1]
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.TERRAIN_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.tilesetIds = {};
            this.loadingFinished(true)
        },
        onload: function(a) {
            this.tilesetIds = a;
            this.loadingFinished(true)
        }
    });
    ig.terrain = new ig.Terrain
});
ig.baked = !0;
