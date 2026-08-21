/**
 * impact.feature.terrain.terrain
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.terrain.terrain")`.
 *
 * `ig.Terrain` (singleton `ig.terrain`) — the terrain system. Loads a JSON
 * mapping tileset id → terrain type (from `ig.TERRAIN_FILE`), maps terrain
 * names ↔ ids (via `ig.TERRAIN` from `game.config`), and answers queries like
 * "what terrain is under this entity / at this map position", honouring
 * per-entity terrain overrides and danger/fall terrains.
 */
ig.module("impact.feature.terrain.terrain")
    .requires("impact.base.loader", "game.config")
    .defines(function () {

    var scratchVec = Vec2.create();

    ig.Terrain = ig.SingleLoadable.extend({
        cacheType: "Terrain",
        idToName: {},
        nameToId: {},
        tilesetIds: {},
        dangerTerrains: [],
        fallTerrain: [],

        init: function () {
            if (!ig.TERRAIN) return ig.warn("No TERRAIN specified. Please create ig.TERRAIN in game.config");
            if (!ig.TERRAIN_FILE) return ig.warn("Can't initialize terrain because no ig.TERRAIN_FILE was provided");
            ig.TERRAIN.undefined = 0;
            this.nameToId = ig.TERRAIN;
            for (var name in ig.TERRAIN) this.idToName[ig.TERRAIN[name]] = name;
            this.parent();
        },

        /** Mark `terrain` as dangerous; with `isFall`, entities fall through it. */
        registerDangerTerrain: function (terrain, isFall) {
            this.dangerTerrains.push(terrain);
            isFall && this.fallTerrain.push(terrain);
        },

        isDangerTerrain: function (terrain) {
            return this.dangerTerrains.indexOf(terrain) != -1;
        },

        isFallTerrain: function (terrain) {
            return this.fallTerrain.indexOf(terrain) != -1;
        },

        /**
         * Terrain under an entity (centre). Prefers the entity's standing
         * ground entry; otherwise checks the map tile, optionally scanning
         * lower levels until a non-default terrain is found.
         */
        getTerrain: function (entity, useEntitySize, checkLowerLevels) {
            if (!entity) return 0;
            var pos = entity.getCenter(scratchVec);
            if (entity._collData && entity._collData.groundEntry && entity._collData.groundEntry.entity.terrain) {
                return entity._collData.groundEntry.entity.terrain * 1;
            }
            var terrain = 0,
                level = entity.level,
                levelHeight = ig.game.getLevelHeight(level);
            do {
                terrain = ig.game.getLevelHeight(level);
                terrain = this.getMapTerrain(
                    pos.x, pos.y + terrain - levelHeight, level,
                    useEntitySize ? entity.size.x : 0,
                    useEntitySize ? entity.size.y : 0
                );
                level--;
            } while (checkLowerLevels && !terrain && level >= 0);
            return terrain || ig.TERRAIN_DEFAULT;
        },

        /**
         * Terrain at a world position on `level`, preferring the topmost
         * entity with a terrain that reaches that height.
         */
        getPointTerrain: function (x, y, level, width, height) {
            var levelIdx = ig.game.getLevelIdx(level),
                levelHeight = ig.game.getLevelHeight(levelIdx),
                entities = ig.game.getEntitiesInRectangle(x - width / 2, y - height / 2, levelHeight, width, height, level - levelHeight),
                i = entities.length,
                terrain = 0;
            for (; i--;) {
                var entity = entities[i],
                    coll = entity.coll,
                    topZ = coll.pos.z + coll.size.z;
                if (entity.terrain && topZ <= level && topZ >= levelHeight) {
                    terrain = entity.terrain;
                    levelHeight = topZ;
                }
            }
            return terrain ? terrain : this.getMapTerrain(x, y, levelIdx, width, height);
        },

        /** Terrain of the map tile at the given position on `levelIdx`. */
        getMapTerrain: function (x, y, levelIdx, width, height) {
            if (!ig.game.levels[levelIdx]) return 0;
            y = y - ig.game.levels[levelIdx].height;
            var maps = ig.game.levels[levelIdx].maps,
                terrain;
            if (terrain = this._checkMaps(maps, x, y)) return terrain;
            if (width || height) {
                if (terrain = this._checkMaps(maps, x - width / 2, y)) return terrain;
                if (terrain = this._checkMaps(maps, x + width / 2, y)) return terrain;
                if (terrain = this._checkMaps(maps, x, y - height / 2)) return terrain;
                if (terrain = this._checkMaps(maps, x, y + height / 2)) return terrain;
            }
            return 0;
        },

        /** Terrain of the tile under (x, y) across all background maps. */
        _checkMaps: function (maps, x, y) {
            for (var i = maps.length; i--;) {
                var tileset = this.tilesetIds[maps[i].tilesetName];
                if (maps[i] instanceof ig.MAP.Background && tileset) {
                    var tile = maps[i].getTile(x, y);
                    if (tile && tileset[tile - 1]) return tileset[tile - 1] * 1;
                }
            }
            return 0;
        },

        /** Terrain type of a specific tile id on a map's tileset. */
        getTerrainOfMapTile: function (map, tileIndex) {
            var tileset = this.tilesetIds[map.tilesetName];
            return !tileset ? ig.TERRAIN_DEFAULT : tileset[tileIndex - 1];
        },

        loadInternal: function () {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.TERRAIN_FILE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            });
        },

        onerror: function () {
            this.tilesetIds = {};
            this.loadingFinished(true);
        },

        onload: function (data) {
            this.tilesetIds = data;
            this.loadingFinished(true);
        }
    });

    ig.terrain = new ig.Terrain();
});
ig.baked = !0;
