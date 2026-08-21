/**
 * impact.feature.height-map.height-map
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.height-map.height-map")`.
 *
 * WorldMap-editor-only module that builds height-map terrain on map layers:
 *   - `ig.MAP.HeightMap`      — the "HeightMap" layer type (a no-op render layer).
 *   - `wm.HeightMapConverter` — decodes height-map tile data and paints the
 *                               resulting walls / shadows / chasms onto
 *                               Background and Collision layers.
 *   - `ChipsetSettings`       — per-tileset lookup that maps height-map tile
 *                               types to actual tile coordinates.
 * Everything below `if (window.wm)` only exists inside the editor.
 */

ig.module("impact.feature.height-map.height-map").requires("impact.base.map", "impact.base.game", "impact.base.image", "game.config").defines(function () {
    /**
     * The "HeightMap" layer type. It holds the raw height-map tile data
     * (one tile per cell, encoding level/fill/terrain) and renders nothing —
     * the converter below paints the derived terrain onto other layers.
     */
    ig.MAP.HeightMap = ig.Map.extend({
        _wm: new ig.Config({
            _label: "HeightMap",
            _fixSize: ig.CONFIG.DISABLE_LAYER_SIZE,
            _noRepeat: true,
            _noMoveSpeed: true,
            _noDistance: ig.CONFIG.DISABLE_LAYER_DISTANCE,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _fixTileset: "media/map/heightmap-tiles.png",
            _fixLevel: "postlight",
            _icon: "impact/feature/height-map/editors/layer-icon.png",
            _alphaActive: 1,
            _alphaInactive: 0,
            _alphaEntities: 0
        }),
        noMerge: true,

        init: function (mapData, zHeight) {
            this.parent(mapData, zHeight)
        },
        draw: function () {},
        drawTiled: function () {}
    });
    ig.MAP.HeightMap.levelKey = "heightMap";

    if (window.wm) {
        wm.CHIPSET_CONFIG = {};

        // --- tile-type constants --------------------------------------------------
        // Each height-map tile cell ends up with one of these "gfx types"; the
        // keys and values are identical strings (enum-style constants).
        var GFX = {
                FILL: "FILL",
                DIAGONAL_NE: "DIAGONAL_NE",
                DIAGONAL_SE: "DIAGONAL_SE",
                DIAGONAL_SW: "DIAGONAL_SW",
                DIAGONAL_NW: "DIAGONAL_NW",
                SQUARE_NE: "SQUARE_NE",
                SQUARE_SE: "SQUARE_SE",
                SQUARE_SW: "SQUARE_SW",
                SQUARE_NW: "SQUARE_NW",
                NORTH: "NORTH",
                EAST: "EAST",
                SOUTH: "SOUTH",
                WEST: "WEST",
                CORNER_NE: "CORNER_NE",
                CORNER_SE: "CORNER_SE",
                CORNER_SW: "CORNER_SW",
                CORNER_NW: "CORNER_NW",
                WALL_SOUTH: "WALL_SOUTH",
                WALL_SOUTH_BASE: "WALL_SOUTH_BASE",
                WALL_SE: "WALL_SE",
                WALL_SE_BASE: "WALL_SE_BASE",
                WALL_SW: "WALL_SW",
                WALL_SW_BASE: "WALL_SW_BASE",
                WALL_SQR_SW: "WALL_SQR_SW",
                WALL_SQR_SW_BASE: "WALL_SQR_SW_BASE",
                WALL_SQR_SE: "WALL_SQR_SE",
                WALL_SQR_SE_BASE: "WALL_SQR_SE_BASE",
                WALL_END_WEST: "WALL_END_WEST",
                WALL_END_WEST_BASE: "WALL_END_WEST_BASE",
                WALL_END_EAST: "WALL_END_EAST",
                WALL_END_EAST_BASE: "WALL_END_EAST_BASE",
                INVISIBLE_WALL: "INVISIBLE_WALL"
            },
            // For each gfx type: which wall/base tiles to paint, and how the
            // tile participates in the master-level shadow pass.
            wallConfigByType = {};
        wallConfigByType[GFX.SOUTH] = {
            wall: GFX.WALL_SOUTH,
            base: GFX.WALL_SOUTH_BASE
        };
        wallConfigByType[GFX.DIAGONAL_SW] = {
            wall: GFX.WALL_SW,
            base: GFX.WALL_SW_BASE
        };
        wallConfigByType[GFX.DIAGONAL_SE] = {
            wall: GFX.WALL_SE,
            base: GFX.WALL_SE_BASE
        };
        wallConfigByType[GFX.SQUARE_SW] = {
            wall: GFX.WALL_SQR_SW,
            base: GFX.WALL_SQR_SW_BASE
        };
        wallConfigByType[GFX.SQUARE_SE] = {
            wall: GFX.WALL_SQR_SE,
            base: GFX.WALL_SQR_SE_BASE
        };
        wallConfigByType[GFX.CORNER_SW] = {
            shadowOnly: true,
            wall: GFX.WALL_END_WEST,
            base: GFX.WALL_END_WEST_BASE
        };
        wallConfigByType[GFX.CORNER_SE] = {
            shadowOnly: true,
            wall: GFX.WALL_END_EAST,
            base: GFX.WALL_END_EAST_BASE
        };
        wallConfigByType[GFX.NORTH] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: GFX.WALL_SOUTH,
            base: GFX.WALL_SOUTH_BASE
        };
        wallConfigByType[GFX.DIAGONAL_NE] = {
            shadowOnly: true,
            toMaster: true,
            wall: GFX.WALL_SW,
            base: GFX.WALL_SW_BASE
        };
        wallConfigByType[GFX.DIAGONAL_NW] = {
            shadowOnly: true,
            toMaster: true,
            wall: GFX.WALL_SE,
            base: GFX.WALL_SE_BASE
        };
        wallConfigByType[GFX.SQUARE_NE] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: GFX.WALL_SOUTH,
            base: GFX.WALL_SOUTH_BASE
        };
        wallConfigByType[GFX.SQUARE_NW] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: GFX.WALL_SOUTH,
            base: GFX.WALL_SOUTH_BASE
        };

        // Diagonal gfx type for each "fill" value (2..5).
        var diagonalByBlockType = {};
        diagonalByBlockType[2] = GFX.DIAGONAL_NE;
        diagonalByBlockType[3] = GFX.DIAGONAL_SE;
        diagonalByBlockType[4] = GFX.DIAGONAL_SW;
        diagonalByBlockType[5] = GFX.DIAGONAL_NW;

        // Two adjacent cardinal directions that make a square corner.
        var squareCombos = [{
                dir1: "NORTH",
                dir2: "EAST",
                gfx: GFX.SQUARE_NE
            }, {
                dir1: "NORTH",
                dir2: "WEST",
                gfx: GFX.SQUARE_NW
            }, {
                dir1: "SOUTH",
                dir2: "EAST",
                gfx: GFX.SQUARE_SE
            }, {
                dir1: "SOUTH",
                dir2: "WEST",
                gfx: GFX.SQUARE_SW
            }],
            // Neighbour offsets, block-type tests and gfx type per direction.
            directions = {
                NORTH: {
                    dx: 0,
                    dy: -1,
                    blockType1: 3,
                    blockType2: 4,
                    gfx: GFX.NORTH,
                    terrainBorder: [{
                        dx: -1,
                        dy: 0
                    }, {
                        dx: 1,
                        dy: 0
                    }]
                },
                EAST: {
                    dx: 1,
                    dy: 0,
                    blockType1: 4,
                    blockType2: 5,
                    gfx: GFX.EAST,
                    terrainBorder: [{
                        dx: 0,
                        dy: -1
                    }, {
                        dx: 0,
                        dy: 1
                    }]
                },
                SOUTH: {
                    dx: 0,
                    dy: 1,
                    blockType1: 2,
                    blockType2: 5,
                    gfx: GFX.SOUTH,
                    terrainBorder: [{
                        dx: -1,
                        dy: 0
                    }, {
                        dx: 1,
                        dy: 0
                    }]
                },
                WEST: {
                    dx: -1,
                    dy: 0,
                    blockType1: 2,
                    blockType2: 3,
                    gfx: GFX.WEST,
                    terrainBorder: [{
                        dx: 0,
                        dy: -1
                    }, {
                        dx: 0,
                        dy: 1
                    }]
                },
                NE: {
                    dx: 1,
                    dy: -1,
                    blockType1: 4,
                    blockType2: 4,
                    gfx: GFX.CORNER_NE
                },
                SE: {
                    dx: 1,
                    dy: 1,
                    blockType1: 5,
                    blockType2: 5,
                    gfx: GFX.CORNER_SE
                },
                SW: {
                    dx: -1,
                    dy: 1,
                    blockType1: 2,
                    blockType2: 2,
                    gfx: GFX.CORNER_SW
                },
                NW: {
                    dx: -1,
                    dy: -1,
                    blockType1: 3,
                    blockType2: 3,
                    gfx: GFX.CORNER_NW
                }
            },
            directionKeys = [];
        for (var dirKey in directions) directionKeys.push(dirKey);

        // Which directions surround a tile of each "fill" value (2..5).
        var directionsByBlockType = {};
        directionsByBlockType[2] = [directions.NORTH, directions.EAST, directions.NE];
        directionsByBlockType[3] = [directions.SOUTH, directions.EAST, directions.SE];
        directionsByBlockType[4] = [directions.SOUTH, directions.WEST, directions.SW];
        directionsByBlockType[5] = [directions.NORTH, directions.WEST, directions.NW];

        // Shadow-side fixes: when a corner/edge tile lacks a shadow side, swap in
        // the neighbouring tile's fill type.
        var cornerReplacements = {};
        cornerReplacements[GFX.CORNER_NE] = {
            test: GFX.EAST,
            set: GFX.FILL
        };
        cornerReplacements[GFX.CORNER_NW] = {
            test: GFX.WEST,
            set: GFX.FILL
        };
        cornerReplacements[GFX.EAST] = {
            test: GFX.DIAGONAL_NE,
            set: GFX.CORNER_NE
        };
        cornerReplacements[GFX.WEST] = {
            test: GFX.DIAGONAL_NW,
            set: GFX.CORNER_NW
        };

        // Shared scratch range used while painting wall lines.
        var lineRange = {
            start: 0,
            end: 0
        };

        /**
         * Converts the raw height-map layer into walls/shadows/chasms painted
         * onto the map's Background and Collision layers.
         */
        wm.HeightMapConverter = {
            data: null,     // decoded tile grid (per cell: level/fill/terrain/…)
            lastData: null, // previous decode, used to only repaint changed tiles
            minLayer: 0,    // (declared but unused in the original)
            maxLevel: 0,
            width: 0,
            height: 0,

            /**
             * Decode a freshly loaded map's height-map layer without applying
             * anything (the editor just stores the derived data).
             */
            onMapLoad: function (map) {
                this._storeTileData(map.data);
                this._convertRoundTiles();
                this._setGfxType();
                this.lastData = this.data;
                this.data = null
            },

            /**
             * Decode the height-map layer and paint the derived terrain onto
             * every affected editor layer.
             * @param {Object} map the height-map layer
             * @param {boolean} force repaint all tiles (vs. only changed ones)
             */
            apply: function (map, force) {
                this._storeTileData(map.data);
                this._convertRoundTiles();
                this._setGfxType();
                this._applyOnLayers(force);
                this.lastData = this.data
            },

            /**
             * Unpack the raw tile ids into structured per-cell objects.
             * Encoding: terrain = id / 128; level = (id % 128) / 8; fill = id % 8.
             */
            _storeTileData: function (tileData) {
                this.data = [];
                var width = tileData[0].length,
                    height = tileData.length;
                this.minLevel = 1E3;
                this.maxLevel = 0;
                this.width = width;
                this.height = height;
                for (var y = 0; y < height; ++y) {
                    this.data[y] = [];
                    for (var x = 0; x < width; ++x) {
                        var raw = tileData[y][x] - 1;
                        if (raw == -1) this.data[y][x] = null;
                        else {
                            var terrain = Math.floor(raw / 128),
                                raw = raw % 128,
                                tile = {
                                    level: Math.floor(raw / 8) || -1,
                                    fill: raw % 8,
                                    terrain: terrain,
                                    gfx: 0,
                                    lowerLevel: 0,
                                    lowerTerrain: 0,
                                    upperLevel: 0,
                                    terrainBorder: -1
                                };
                            this.minLevel = Math.min(tile.level, this.minLevel);
                            this.maxLevel = Math.max(tile.level, this.maxLevel);
                            this.data[y][x] = tile
                        }
                    }
                }
            },

            /**
             * Round "pillar" tiles (fill 0) get converted to the diagonal fill
             * that best matches their neighbours, top level first.
             */
            _convertRoundTiles: function () {
                for (var level = this.maxLevel; level >= this.minLevel; level--)
                    for (var y = 0; y < this.height; ++y)
                        for (var x = 0; x < this.width; ++x) {
                            var tile = this.data[y][x];
                            if (tile && tile.level == level && tile.fill == 0) tile.fill = this._getRoundTileReplace(x, y, tile.level)
                        }
            },

            /** Assign each tile its gfx type: square (fill 1) or diagonal. */
            _setGfxType: function () {
                for (var y = 0; y < this.height; ++y)
                    for (var x = 0; x < this.width; ++x) {
                        var tile = this.data[y][x];
                        tile && (tile.fill == 1 ? this._setSquareGfx(x, y, tile) : this._setDiagonalGfx(x, y, tile))
                    }
            },

            /**
             * Walk every editor layer (skipping fixed/light/object layers and
             * non-distance-1 layers) and repaint those that have height-map content.
             */
            _applyOnLayers: function (force) {
                var undo = ig.editor.undo;
                undo.beginMapDraw();
                for (var layers = ig.editor.layers, layerCount = layers.length, lastBackgroundLevel = -1, i = 0; i < layerCount; ++i) {
                    var layer = layers[i];
                    if (!(layer.level == "first" || layer.level == "last" || layer.level ==
                            "light" || layer.level == "postlight" || layer.level.indexOf("object") != -1) && layer.distance == 1)
                        if (layer.type == "Background" && wm.CHIPSET_CONFIG[layer.tilesetName] && lastBackgroundLevel != layer.level) {
                            lastBackgroundLevel = layer.level;
                            this._applyOnBackground(layer, force)
                        } else layer.type == "Collision" && this._applyOnCollision(layer, force)
                }
                undo.endMapDraw()
            },

            /** Height (in tiles) of a level stack index. */
            _getLevelHeight: function (level, layer) {
                level < 1 && (level = 1);
                var levels = ig.editor.levels,
                    levelData = levels[level - 1];
                return levelData ? levelData.height / layer.tilesize : levels[levels.length - 1].height / layer.tilesize + (level - levels.length) * 2
            },

            /** Vertical distance (in tiles) between two level indices. */
            _getLevelDistance: function (fromLevel, toLevel, layer) {
                return this._getLevelHeight(toLevel, layer) - this._getLevelHeight(fromLevel, layer)
            },

            /**
             * Paint the height-map onto one Background layer: walls, wall bases,
             * shadows and chasms, resolved through the layer's chipset config.
             */
            _applyOnBackground: function (layer, force) {
                var config = wm.CHIPSET_CONFIG[layer.tilesetName];
                if (config) {
                    for (var settings = new ChipsetSettings(config),
                            autoTileList = [],
                            levels = ig.editor.levels,
                            levelData = levels[layer.level],
                            nextLevelData = levels[layer.level * 1 + 1],
                            levelCount = levels.length,
                            masterOffset = (levelData.height - levels[ig.editor.masterLevel].height) / layer.tilesize,
                            nextLevelOffset = nextLevelData ? (nextLevelData.height - levelData.height) / layer.tilesize : 0,
                            currentLevel = layer.level * 1 + 1,
                            masterPlusOne = ig.editor.masterLevel * 1 + 1,
                            y = 0; y < this.height; ++y)
                        for (var x = 0; x < this.width; ++x) {
                            var tile = this.data[y][x];
                            if (tile) {
                                var hasShadowAbove = settings.hasShadow() && tile.level > levelCount && tile.lowerLevel <= levelCount,
                                    wallCfg = wallConfigByType[tile.gfx],
                                    tileAbove;
                                if (wallCfg && wallCfg.shadowOnly && (!hasShadowAbove || currentLevel < masterPlusOne)) wallCfg = null;
                                if (tile.level == currentLevel) {
                                    // Tile sits exactly on this layer.
                                    if (force || this._hasTileAreaChanged(x, y)) {
                                        var shadeType = null;
                                        if (settings.hasFloorChasm(tile.terrain) && (tile.gfx == GFX.DIAGONAL_SE || tile.gfx == GFX.DIAGONAL_SW) && tile.level == masterPlusOne && tile.lowerLevel == -1) shadeType = "CHASM_FLOOR";
                                        var tileId = settings.getGfx(tile.gfx, x, y - masterOffset, shadeType, tile.terrain, tile.terrainBorder);
                                        this._setLayerTile(layer, x, y - masterOffset, tileId, autoTileList)
                                    }
                                } else if (wallCfg && wallCfg.toMaster && masterPlusOne <= currentLevel && currentLevel < tile.lowerLevel) {
                                    // Shadow wall rising to the master level.
                                    var height = nextLevelOffset,
                                        deltaY = wallCfg.deltaY || 0;
                                    if (force || this._hasTileLineChanged(x, y, height)) {
                                        lineRange.start = this._getLevelDistance(masterPlusOne, currentLevel, layer);
                                        lineRange.end = this._getLevelDistance(currentLevel, tile.lowerLevel, layer) - 1;
                                        for (var i = 0; i < height; ++i) {
                                            tileId = i == 0 && masterPlusOne == currentLevel ? wallCfg.base : wallCfg.wall;
                                            tileId = settings.getGfx(tileId, x, y - masterOffset - i + deltaY, "BACK_WALL", tile.lowerTerrain, -1, lineRange);
                                            this._setLayerTile(layer, x, y - masterOffset - i + deltaY, tileId, autoTileList);
                                            lineRange.start++;
                                            lineRange.end--
                                        }
                                        if (deltaY) {
                                            tileId = settings.getGfx(GFX.FILL, x, y - masterOffset, "SHADOW", tile.lowerTerrain);
                                            this._setLayerTile(layer, x, y - masterOffset, tileId, autoTileList)
                                        }
                                    }
                                } else if (wallCfg && !wallCfg.toMaster && (tile.lowerLevel <= currentLevel || hasShadowAbove && currentLevel == masterPlusOne) && tile.level > currentLevel) {
                                    // Wall hanging over this layer, with optional chasm below.
                                    var isChasmAbove = !wallCfg.shadowOnly && settings.hasChasm() && tile.lowerLevel == -1 && currentLevel < masterPlusOne,
                                        height = nextLevelOffset,
                                        chasmOffset = 0,
                                        isShadowLine = false,
                                        chasmHeight = settings.getChasmHeight(tile.terrain),
                                        chasmTileAdd = settings.getChasmTileAdd(tile.terrain),
                                        terrain;
                                    if (isChasmAbove) chasmOffset = this._getLevelDistance(currentLevel, masterPlusOne, layer) - chasmHeight - chasmTileAdd;
                                    else if (hasShadowAbove && currentLevel == masterPlusOne) {
                                        height = this._getLevelDistance(currentLevel, tile.level, layer);
                                        isShadowLine = true;
                                        chasmOffset = this._getLevelDistance(currentLevel, tile.lowerLevel, layer)
                                    }
                                    if (force || this._hasTileLineChanged(x, y, height)) {
                                        terrain = tile.lowerLevel == -1 || settings.isWallTerrainFromTop(tile.lowerTerrain, tile.terrain) ? tile.terrain : tile.lowerTerrain;
                                        if (hasShadowAbove && currentLevel > masterPlusOne) {
                                            tileId = settings.getGfx(GFX.INVISIBLE_WALL, x, y - masterOffset, "SHADOW", terrain);
                                            this._setLayerTile(layer, x, y - masterOffset, tileId, autoTileList)
                                        } else {
                                            lineRange.start = this._getLevelDistance(tile.lowerLevel, currentLevel, layer);
                                            lineRange.end = this._getLevelDistance(currentLevel, tile.level, layer) - 1 - chasmOffset;
                                            if (isChasmAbove) lineRange.start = Math.max(-chasmOffset, 0);
                                            if (chasmOffset && isShadowLine) lineRange.start = 0;
                                            for (i = 0; i < height; ++i) {
                                                shadeType = null;
                                                if (i < chasmOffset) {
                                                    tileId = 0;
                                                    hasShadowAbove && (tileId = settings.getGfx(GFX.FILL, x, y - masterOffset, "SHADOW", tile.lowerTerrain));
                                                    this._setLayerTile(layer, x, y - masterOffset - i, tileId, autoTileList)
                                                } else {
                                                    if (i == 0 && tile.lowerLevel == currentLevel) tileId = wallCfg.base;
                                                    else if (isShadowLine && i == chasmOffset) tileId = wallCfg.base;
                                                    else if (i == 0 && settings.hasFloorChasm(terrain) && tile.lowerLevel == -1 && currentLevel == masterPlusOne) {
                                                        tileId = wallCfg.base;
                                                        if (tile.gfx == GFX.DIAGONAL_SE || tile.gfx == GFX.DIAGONAL_SW) shadeType = "CHASM"
                                                    } else {
                                                        tileId = wallCfg.wall;
                                                        isShadowLine && height - i == 1 && (shadeType = "SHADOW")
                                                    }
                                                    wallCfg.shadowOnly && (shadeType = "SHADOW");
                                                    isChasmAbove && i - chasmOffset < chasmHeight && (shadeType = settings.hasFloorChasm(terrain) && tile.level == masterPlusOne ? "CHASM_FLOOR" : "CHASM");
                                                    if (tileId) {
                                                        tileId = settings.getGfx(tileId, x, y - masterOffset - i, shadeType, terrain, -1, lineRange);
                                                        this._setLayerTile(layer, x, y - masterOffset - i, tileId, autoTileList)
                                                    }
                                                    lineRange.start++;
                                                    lineRange.end--
                                                }
                                            }
                                            if (wallCfg.wall && isShadowLine) {
                                                tileId = settings.getGfx(tile.gfx, x, y - masterOffset - height, "SHADOW", terrain);
                                                this._setLayerTile(layer, x, y - masterOffset - height, tileId, autoTileList)
                                            }
                                        }
                                    }
                                } else if (tile.lowerLevel == currentLevel) {
                                    // The layer directly below this tile: shadow/back-wall pass.
                                    if (force || this._hasTileChanged(x, y)) {
                                        if (settings.hasShadow())
                                            if (layer.level > ig.editor.masterLevel) tileId = shadowFlipMap[tile.gfx] ? settings.getGfx(shadowFlipMap[tile.gfx], x, y - masterOffset, "BACK_WALL", tile.lowerTerrain) : settings.getGfx(GFX.INVISIBLE_WALL, x, y - masterOffset, "SHADOW", tile.lowerTerrain);
                                            else {
                                                tileId = settings.getGfx(tile.gfx, x, y - masterOffset, "SHADOW", tile.lowerTerrain);
                                                if (!settings.hasShadowSide(tile.lowerTerrain) && cornerReplacements[tile.gfx]) (tileAbove = this.data[y - 1] && this.data[y - 1][x]) && cornerReplacements[tile.gfx].test == tileAbove.gfx && (tileId = settings.getGfx(cornerReplacements[tile.gfx].set, x, y - masterOffset, "SHADOW", tile.lowerTerrain))
                                            }
                                        else tileId = settings.getGfx(GFX.FILL, x, y - masterOffset, null, tile.lowerTerrain);
                                        this._setLayerTile(layer, x, y - masterOffset, tileId, autoTileList)
                                    }
                                } else if (force || this._hasTileLineShadowChanged(x, y, layer)) {
                                    // Layer in the tile's shadow line.
                                    tileId = 0;
                                    settings.hasShadow() && (layer.level == ig.editor.masterLevel && tile.level > currentLevel) && (tileId = hasShadowAbove && tile.lowerLevel && tile.lowerLevel < masterPlusOne ? settings.getGfx(tile.gfx, x, y - masterOffset, "DARK_WALL", tile.lowerTerrain) : settings.getGfx(GFX.FILL, x, y - masterOffset, "SHADOW", tile.lowerTerrain));
                                    this._setLayerTile(layer, x, y - masterOffset, tileId, autoTileList)
                                }
                            }
                        }
                    ig.game.autoTiles.resolveAutoTileList(autoTileList, layer, ig.editor.undo)
                }
            },

            /** Paint the height-map onto one Collision layer. */
            _applyOnCollision: function (layer, force) {
                for (var levels = ig.editor.levels,
                        masterOffset = (levels[layer.level].height - levels[ig.editor.masterLevel].height) / layer.tilesize,
                        currentLevel = layer.level * 1 + 1,
                        isAtOrBelowMaster = layer.level <= ig.editor.masterLevel,
                        isBelowMaster = layer.level < ig.editor.masterLevel,
                        y = 0; y < this.height; ++y)
                    for (var x = 0; x < this.width; ++x)
                        if (force || this._hasTileChanged(x, y)) {
                            var tile = this.data[y][x];
                            if (tile) {
                                var tileId = 0;
                                tile.level < currentLevel ? tileId = isAtOrBelowMaster ? tilesAtLevel[1] : 0 : tile.fill == 1 ? !isBelowMaster && tile.level > currentLevel && (tileId = tilesAbove[tile.fill]) : !isBelowMaster && tile.lowerLevel > currentLevel ? tileId = tilesAbove[1] : tile.level > currentLevel ? tile.lowerLevel < currentLevel && isAtOrBelowMaster ? tileId = isBelowMaster ? tilesAtLevel[tile.fill] : tilesAtMaster[tile.fill] : isBelowMaster || (tileId = tilesAbove[tile.fill]) : tile.level == currentLevel && isAtOrBelowMaster && (tileId = tilesAtLevel[tile.fill]);
                                this._setLayerTile(layer, x, y - masterOffset, tileId)
                            }
                        }
            },

            /** True if the tile or any of its neighbours changed. */
            _hasTileAreaChanged: function (x, y) {
                if (this._hasTileChanged(x, y)) return true;
                for (var i = directionKeys.length; i--;) {
                    var dir = directions[directionKeys[i]];
                    if (this._hasTileChanged(x + dir.dx, y + dir.dy)) return true
                }
                return false
            },

            /** True if any tile in the vertical line above (x, y) changed. */
            _hasTileLineChanged: function (x, y, height) {
                for (height = height + 1; height--;)
                    if (this._hasTileChanged(x, y - height)) return true;
                return false
            },

            /** True if the tile's shadow line above (x, y) changed. */
            _hasTileLineShadowChanged: function (x, y, layer) {
                for (var i = 11, levels = ig.editor.levels; i--;)
                    if (this._hasTileChanged(x, y + i)) {
                        if (!i) return true;
                        var tile = this.data[y + i][x];
                        if (tile.level > levels.length) {
                            var shadowHeight = this._getLevelDistance(ig.editor.masterLevel + 1, levels.length, layer),
                                shadowHeight = shadowHeight + (tile.level - levels.length) * 2;
                            if (i <= shadowHeight) return true
                        }
                    } return false
            },

            /** True if the tile at (x, y) differs between the old and new data. */
            _hasTileChanged: function (x, y) {
                if (!this.lastData) return true;
                var oldTile = this.lastData[y] && this.lastData[y][x],
                    newTile = this.data[y] && this.data[y][x];
                return !oldTile && newTile || oldTile && !newTile ? true : !oldTile && !newTile ? false : oldTile.level != newTile.level || oldTile.fill != newTile.fill || oldTile.gfx != newTile.gfx || oldTile.lowerLevel != newTile.lowerLevel || oldTile.terrain != newTile.terrain || oldTile.lowerTerrain != newTile.lowerTerrain || oldTile.terrainBorder != newTile.terrainBorder
            },

            /**
             * Write one tile to a layer, recording it in the undo stack.
             * @param {Array} [autoTileList] collects auto-tiles to resolve afterwards
             */
            _setLayerTile: function (layer, x, y, tileId, autoTileList) {
                if (!(y < 0 || y >= this.height)) {
                    autoTileList && ig.game.autoTiles.addAutoTileList(autoTileList, layer, x, y);
                    var undo = ig.editor.undo,
                        actualTile = ig.game.autoTiles.getActualTile(layer, x, y, tileId),
                        oldTile = layer.data[y][x];
                    if (oldTile != actualTile) {
                        undo.pushMapDraw(layer, x * layer.tilesize, y * layer.tilesize, oldTile, actualTile);
                        layer.setGridTile(x, y, actualTile)
                    }
                }
            },

            /** Re-encode the decoded grid back into raw tile ids (16px tiles). */
            _writeTilesBack: function (layer) {
                var undo = ig.editor.undo;
                undo.beginMapDraw();
                for (var y = 0; y < this.height; ++y)
                    for (var x = 0; x < this.width; ++x) {
                        var tile = this.data[y][x],
                            encoded = (tile.level - 1) * 8 + tile.fill + 1;
                        undo.pushMapDraw(layer, x * 16, y * 16, layer.data[y][x], encoded);
                        layer.setGridTile(x, y, encoded)
                    }
                undo.endMapDraw()
            },

            /**
             * Convert a round (fill 0) tile into the diagonal fill (2..5) that
             * best matches its neighbours' levels.
             */
            _getRoundTileReplace: function (x, y, level) {
                var north = this._getOtherLevel(x, y, level, directions.NORTH),
                    east = this._getOtherLevel(x, y, level, directions.EAST),
                    west = this._getOtherLevel(x, y, level, directions.WEST),
                    south = this._getOtherLevel(x, y, level, directions.SOUTH);
                return north && east && (!south || south >= north) && (!west || west >= north) && north == east ? 2 : (!north || north >= east) && east && south && (!west || west >= east) && east == south ? 3 : (!north || north >= west) && (!east || east >= west) && south && west && south == west ? 4 : north && (!east || east >= north) && (!south || south >= north) && west && north == west ? 5 : 1
            },

            /**
             * Resolve the gfx type of a square tile (fill 1): a lower neighbour
             * below the tile's level determines the wall direction.
             */
            _setSquareGfx: function (x, y, tile) {
                var level = tile.level;
                tile.gfx = null;
                for (var i = 0; i < squareCombos.length; ++i) {
                    var combo = squareCombos[i],
                        dir1 = directions[combo.dir1],
                        dir2 = directions[combo.dir2],
                        lower1 = this._getOtherLevel(x, y, level, dir1),
                        lower2 = this._getOtherLevel(x, y, level, dir2);
                    if (lower1 && lower2 && lower1 < level && lower2 < level) {
                        tile.lowerLevel = lower1;
                        tile.lowerTerrain = this._getTerrain(x, y, dir1) || 0;
                        tile.gfx = combo.gfx;
                        tile.terrainBorder = -1;
                        return
                    }
                }
                for (i = 0; i < directionKeys.length; ++i) {
                    var dir = directions[directionKeys[i]],
                        otherLevel = this._getOtherLevel(x, y, level, dir);
                    if (otherLevel && otherLevel < level) {
                        tile.lowerLevel = otherLevel;
                        tile.lowerTerrain = this._getTerrain(x, y, dir) || 0;
                        tile.gfx = dir.gfx;
                        tile.terrainBorder = this._getTerrainBorder(x, y, dir, tile.terrain, level);
                        return
                    }
                }
                if (!tile.gfx) tile.gfx = GFX.FILL
            },

            /**
             * Resolve the gfx type of a diagonal tile (fill 2..5) from the level
             * of the surrounding tiles; flips the fill when the tile is above
             * its neighbours.
             */
            _setDiagonalGfx: function (x, y, tile) {
                for (var dirs = directionsByBlockType[tile.fill], count = dirs.length, levels = [], terrains = []; count--;) {
                    var otherLevel = this._getOtherLevel(x, y, tile.level, dirs[count]);
                    levels[count] = otherLevel;
                    terrains[count] = this._getTerrain(x, y, dirs[count]) || 0
                }
                var chosenLevel, chosenTerrain;
                if (levels[0]) {
                    chosenLevel = levels[0];
                    chosenTerrain = terrains[0]
                } else if (levels[1]) {
                    chosenLevel = levels[1];
                    chosenTerrain = terrains[1]
                } else {
                    chosenLevel = levels[2];
                    chosenTerrain = terrains[2]
                }
                if (chosenLevel > tile.level) {
                    tile.fill = tile.fill > 3 ? tile.fill - 2 : tile.fill + 2;
                    tile.lowerLevel = tile.level;
                    tile.lowerTerrain = tile.terrain;
                    tile.level = chosenLevel;
                    tile.terrain = chosenTerrain
                } else {
                    tile.lowerLevel = chosenLevel;
                    tile.lowerTerrain = chosenTerrain
                }
                tile.gfx = diagonalByBlockType[tile.fill]
            },

            /** Level of the neighbour in `dir`, or 0 when it doesn't match. */
            _getOtherLevel: function (x, y, level, dir) {
                y = y + dir.dy;
                x = x + dir.dx;
                var other = this.data[y] && this.data[y][x];
                if (!other) return 0;
                var matchesBlockType = other.fill == dir.blockType1 || other.fill == dir.blockType2;
                return other.level == level ? matchesBlockType ? other.level : 0 : !matchesBlockType ? other.level : 0
            },

            /** Terrain id of the neighbour in `dir` (false when empty). */
            _getTerrain: function (x, y, dir) {
                y = y + dir.dy;
                x = x + dir.dx;
                var other = this.data[y] && this.data[y][x];
                return !other ? false : other.terrain
            },

            /** Terrain id of the neighbour in `dir` when it sits on `level`. */
            _getOtherTerrain: function (x, y, dir, level) {
                y = y + dir.dy;
                x = x + dir.dx;
                var other = this.data[y] && this.data[y][x];
                return !other || other.level != level ? false : other.terrain
            },

            /**
             * Which terrain-border index the tile should use, based on the
             * terrain of its neighbours on `level`.
             */
            _getTerrainBorder: function (x, y, dir, terrain, level) {
                if (!terrain || !dir.terrainBorder) return -1;
                for (var i = dir.terrainBorder.length; i--;) {
                    var otherTerrain = this._getOtherTerrain(x, y, dir.terrainBorder[i], level);
                    if (otherTerrain !== false && otherTerrain < terrain) return i
                }
                return -1
            }
        };

        // --- per-tileset tile mappings --------------------------------------------
        // Maps each height-map gfx type to the actual tile coordinates used for
        // that tileset. TYPE1 / TYPE2 are the two tile-layout families.
        var chipsetMappings = {
            TYPE1: {
                BASE: {},
                ALT: {},
                SHADOW: {},
                CHASM: {},
                DARK_WALL: {},
                CHASM_FLOOR: {},
                BACK_WALL: {},
                SUB: {
                    BASE: {},
                    SHADOW: {},
                    BACK_WALL: {},
                    BORDER: {}
                }
            }
        };
        var mapping = chipsetMappings.TYPE1;
        mapping.hasShadowSide = true;
        mapping.chasmTileAdd = 1;
        mapping.BASE[GFX.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        mapping.BASE[GFX.EAST] = [
            [3, 1],
            [3, 2]
        ];
        mapping.BASE[GFX.SOUTH] = [
            [2, 3],
            [3, 3]
        ];
        mapping.BASE[GFX.WEST] = [
            [2, 1],
            [2, 2]
        ];
        mapping.BASE[GFX.DIAGONAL_NE] = [
            [4, 0],
            [5, 1]
        ];
        mapping.BASE[GFX.DIAGONAL_SE] = [
            [4, 3],
            [5, 2]
        ];
        mapping.BASE[GFX.DIAGONAL_SW] = [
            [0, 2],
            [1, 3]
        ];
        mapping.BASE[GFX.DIAGONAL_NW] = [
            [0, 1],
            [1, 0]
        ];
        mapping.BASE[GFX.CORNER_NE] = [
            [4, 1]
        ];
        mapping.BASE[GFX.CORNER_SE] = [
            [4, 2]
        ];
        mapping.BASE[GFX.CORNER_SW] = [
            [1, 2]
        ];
        mapping.BASE[GFX.CORNER_NW] = [
            [1, 1]
        ];
        mapping.BASE[GFX.WALL_SOUTH] = [
            [3, 4],
            [2, 4]
        ];
        mapping.BASE[GFX.WALL_SE] = [
            [5, 3],
            [4, 4]
        ];
        mapping.BASE[GFX.WALL_SW] = [
            [1, 4],
            [0, 3]
        ];
        mapping.BASE[GFX.WALL_SOUTH_BASE] = [
            [2, 5],
            [3, 5]
        ];
        mapping.BASE[GFX.WALL_SE_BASE] = [
            [4, 5],
            [5, 4]
        ];
        mapping.BASE[GFX.WALL_SW_BASE] = [
            [0, 4],
            [1, 5]
        ];
        mapping.BASE[GFX.WALL_END_WEST] = [
            [0, 6],
            [0, 7]
        ];
        mapping.BASE[GFX.WALL_END_WEST_BASE] = [
            [0, 6],
            [0, 7]
        ];
        mapping.BASE[GFX.WALL_END_EAST] = [
            [5, 6],
            [5, 7]
        ];
        mapping.BASE[GFX.WALL_END_EAST_BASE] = [
            [5, 6],
            [5, 7]
        ];
        mapping.ALT.offset = {
            x: 0,
            y: 6
        };
        mapping.ALT[GFX.WALL_SOUTH] = [
            [3, 0],
            [2, 0]
        ];
        mapping.ALT[GFX.WALL_SE] = [
            [5, 0],
            [4, 0]
        ];
        mapping.ALT[GFX.WALL_SW] = [
            [1, 0],
            [0, 0]
        ];
        mapping.SHADOW.offset = {
            x: 0,
            y: 0
        };
        mapping.SHADOW[GFX.FILL] = [
            [0, 0]
        ];
        mapping.SHADOW[GFX.INVISIBLE_WALL] = [
            [5, 0]
        ];
        mapping.CHASM.offset = {
            x: 0,
            y: 1
        };
        mapping.CHASM.wallYVariance = {};
        mapping.CHASM.wallYVariance[GFX.WALL_SOUTH] = {
            start: [1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SE] = {
            start: [1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SW] = {
            start: [1, 0]
        };
        mapping.DARK_WALL.offset = {
            x: 0,
            y: 7
        };
        mapping.BACK_WALL.offset = {
            x: 0,
            y: 7
        };
        mapping.BACK_WALL[GFX.EAST] = [
            [3, 3],
            [4, 2]
        ];
        mapping.BACK_WALL[GFX.WEST] = [
            [1, 2],
            [2, 3]
        ];
        mapping.SUB.ignoreTerrain = [GFX.WALL_SOUTH, GFX.WALL_SE, GFX.WALL_SW];
        mapping.SUB.BASE[GFX.WALL_SOUTH_BASE] = [
            [2, 4],
            [3, 4]
        ];
        mapping.SUB.BASE[GFX.WALL_SE_BASE] = [
            [4, 4],
            [5, 3]
        ];
        mapping.SUB.BASE[GFX.WALL_SW_BASE] = [
            [0, 3],
            [1, 4]
        ];
        mapping.SUB.SHADOW.offset = {
            x: 0,
            y: 5
        };
        mapping.SUB.SHADOW[GFX.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        mapping.SUB.SHADOW[GFX.DIAGONAL_NW] = [
            [0, 0],
            [1, 0]
        ];
        mapping.SUB.SHADOW[GFX.DIAGONAL_NE] = [
            [4, 0],
            [5, 0]
        ];
        mapping.SUB.SHADOW[GFX.WEST] = [
            [0, 1],
            [1, 1]
        ];
        mapping.SUB.SHADOW[GFX.EAST] = [
            [5, 1],
            [4, 1]
        ];
        mapping.SUB.BACK_WALL.offset = {
            x: 0,
            y: 7
        };
        mapping.SUB.BACK_WALL[GFX.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        mapping.SUB.BACK_WALL[GFX.DIAGONAL_NW] = [
            [0, 0],
            [1, 0]
        ];
        mapping.SUB.BACK_WALL[GFX.DIAGONAL_NE] = [
            [4, 0],
            [5, 0]
        ];
        mapping.SUB.BACK_WALL[GFX.WEST] = [
            [0, 1],
            [1, 1]
        ];
        mapping.SUB.BACK_WALL[GFX.EAST] = [
            [5, 1],
            [4, 1]
        ];
        mapping.SUB.BORDER[GFX.NORTH] = [
            [
                [2, 5]
            ],
            [
                [3, 5]
            ]
        ];
        mapping.SUB.BORDER[GFX.EAST] = [
            [
                [4, 5]
            ],
            [
                [4, 6]
            ]
        ];
        mapping.SUB.BORDER[GFX.SOUTH] = [
            [
                [2, 6]
            ],
            [
                [3, 6]
            ]
        ];
        mapping.SUB.BORDER[GFX.WEST] = [
            [
                [1, 5]
            ],
            [
                [1, 6]
            ]
        ];

        chipsetMappings.TYPE2 = {
            BASE: {},
            ALT: {},
            SHADOW: {},
            CHASM: {},
            CHASM_FLOOR: {},
            DARK_WALL: {},
            BACK_WALL: {},
            SUB: {
                BASE: {},
                SHADOW: {},
                CHASM_FLOOR: {},
                BACK_WALL: {},
                BORDER: {}
            }
        };
        mapping = chipsetMappings.TYPE2;
        mapping.hasShadowSide = false;
        mapping.chasmTileAdd = 0;
        mapping.BASE[GFX.NORTH] = [
            [1, 0]
        ];
        mapping.BASE[GFX.EAST] = [
            [4, 1]
        ];
        mapping.BASE[GFX.SOUTH] = [
            [1, 3]
        ];
        mapping.BASE[GFX.WEST] = [
            [3, 1]
        ];
        mapping.BASE[GFX.DIAGONAL_NE] = [
            [2, 0]
        ];
        mapping.BASE[GFX.DIAGONAL_SE] = [
            [2, 3]
        ];
        mapping.BASE[GFX.DIAGONAL_SW] = [
            [0, 3]
        ];
        mapping.BASE[GFX.DIAGONAL_NW] = [
            [0, 0]
        ];
        mapping.BASE[GFX.SQUARE_NE] = [
            [4, 0]
        ];
        mapping.BASE[GFX.SQUARE_SE] = [
            [4, 2]
        ];
        mapping.BASE[GFX.SQUARE_SW] = [
            [3, 2]
        ];
        mapping.BASE[GFX.SQUARE_NW] = [
            [3, 0]
        ];
        mapping.BASE[GFX.CORNER_NE] = [
            [2, 1]
        ];
        mapping.BASE[GFX.CORNER_SE] = [
            [2, 2]
        ];
        mapping.BASE[GFX.CORNER_SW] = [
            [0, 2]
        ];
        mapping.BASE[GFX.CORNER_NW] = [
            [0, 1]
        ];
        mapping.BASE[GFX.WALL_SOUTH] = [
            [1, 4]
        ];
        mapping.BASE[GFX.WALL_SOUTH_BASE] = [
            [1, 7]
        ];
        mapping.BASE[GFX.WALL_SE] = [
            [2, 4]
        ];
        mapping.BASE[GFX.WALL_SE_BASE] = [
            [2, 7]
        ];
        mapping.BASE[GFX.WALL_SW] = [
            [0, 4]
        ];
        mapping.BASE[GFX.WALL_SW_BASE] = [
            [0, 7]
        ];
        mapping.BASE[GFX.WALL_SQR_SE] = [
            [4, 3]
        ];
        mapping.BASE[GFX.WALL_SQR_SE_BASE] = [
            [4, 6]
        ];
        mapping.BASE[GFX.WALL_SQR_SW] = [
            [3, 3]
        ];
        mapping.BASE[GFX.WALL_SQR_SW_BASE] = [
            [3, 6]
        ];
        mapping.BASE[GFX.WALL_END_WEST] = [
            [3, 0]
        ];
        mapping.BASE[GFX.WALL_END_WEST_BASE] = [
            [3, 1]
        ];
        mapping.BASE[GFX.WALL_END_EAST] = [
            [4, 0]
        ];
        mapping.BASE[GFX.WALL_END_EAST_BASE] = [
            [4, 1]
        ];
        mapping.BASE.wallYVariance = {};
        mapping.BASE.wallYVariance[GFX.WALL_SOUTH] = {
            loop: [1, 2],
            end: [0]
        };
        mapping.BASE.wallYVariance[GFX.WALL_SE] = {
            loop: [1, 2],
            end: [0]
        };
        mapping.BASE.wallYVariance[GFX.WALL_SW] = {
            loop: [1, 2],
            end: [0]
        };
        mapping.BASE.wallYVariance[GFX.WALL_SQR_SE] = {
            loop: [1, 2],
            end: [0]
        };
        mapping.BASE.wallYVariance[GFX.WALL_SQR_SW] = {
            loop: [1, 2],
            end: [0]
        };
        mapping.SHADOW.offset = {
            x: 0,
            y: 0
        };
        mapping.SHADOW[GFX.FILL] = [
            [1, 1]
        ];
        mapping.SHADOW[GFX.INVISIBLE_WALL] = [
            [1, 2]
        ];
        mapping.SHADOW[GFX.EAST] = [
            [1, 1]
        ];
        mapping.SHADOW[GFX.WEST] = [
            [1, 1]
        ];
        mapping.SHADOW.wallYVariance = {};
        mapping.CHASM.offset = {
            x: 0,
            y: 8
        };
        mapping.CHASM[GFX.WALL_SE_BASE] = [
            [3, 2]
        ];
        mapping.CHASM[GFX.WALL_SW_BASE] = [
            [4, 2]
        ];
        mapping.CHASM[GFX.WALL_SOUTH] = [
            [1, 2]
        ];
        mapping.CHASM[GFX.WALL_SQR_SW] = [
            [0, 2]
        ];
        mapping.CHASM[GFX.WALL_SQR_SE] = [
            [2, 2]
        ];
        mapping.CHASM[GFX.WALL_SE] = [
            [3, 3]
        ];
        mapping.CHASM[GFX.WALL_SW] = [
            [4, 3]
        ];
        mapping.CHASM.wallYVariance = {};
        mapping.CHASM.wallYVariance[GFX.WALL_SOUTH] = {
            start: [2, 1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SE] = {
            start: [2, 1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SW] = {
            start: [2, 1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SQR_SE] = {
            start: [2, 1, 0]
        };
        mapping.CHASM.wallYVariance[GFX.WALL_SQR_SW] = {
            start: [2, 1, 0]
        };
        mapping.CHASM_FLOOR.offset = {
            x: 0,
            y: 8
        };
        mapping.CHASM_FLOOR[GFX.DIAGONAL_SE] = [
            [3, 0]
        ];
        mapping.CHASM_FLOOR[GFX.DIAGONAL_SW] = [
            [4, 0]
        ];
        mapping.CHASM_FLOOR[GFX.WALL_SOUTH] = [
            [1, 1]
        ];
        mapping.CHASM_FLOOR[GFX.WALL_SQR_SW] = [
            [0, 1]
        ];
        mapping.CHASM_FLOOR[GFX.WALL_SQR_SE] = [
            [2, 1]
        ];
        mapping.CHASM_FLOOR[GFX.WALL_SE] = [
            [3, 1]
        ];
        mapping.CHASM_FLOOR[GFX.WALL_SW] = [
            [4, 1]
        ];
        mapping.CHASM_FLOOR.wallYVariance = {};
        mapping.CHASM_FLOOR.wallYVariance[GFX.WALL_SOUTH] = {
            start: [3, 2, 0]
        };
        mapping.CHASM_FLOOR.wallYVariance[GFX.WALL_SE] = {
            start: [4, 3, 0]
        };
        mapping.CHASM_FLOOR.wallYVariance[GFX.WALL_SW] = {
            start: [4, 3, 0]
        };
        mapping.CHASM_FLOOR.wallYVariance[GFX.WALL_SQR_SE] = {
            start: [3, 2, 0]
        };
        mapping.CHASM_FLOOR.wallYVariance[GFX.WALL_SQR_SW] = {
            start: [3, 2, 0]
        };
        mapping.DARK_WALL.offset = {
            x: 0,
            y: 13
        };
        mapping.DARK_WALL[GFX.NORTH] = [
            [3, 1]
        ];
        mapping.DARK_WALL[GFX.DIAGONAL_NE] = [
            [1, 0]
        ];
        mapping.DARK_WALL[GFX.DIAGONAL_NW] = [
            [0, 0]
        ];
        mapping.DARK_WALL[GFX.SQUARE_NW] = [
            [2, 1]
        ];
        mapping.DARK_WALL[GFX.SQUARE_NE] = [
            [4, 1]
        ];
        mapping.DARK_WALL[GFX.DIAGONAL_NW] = [
            [0, 0]
        ];
        mapping.DARK_WALL[GFX.CORNER_NE] = [
            [2, 0]
        ];
        mapping.DARK_WALL[GFX.CORNER_NW] = [
            [2, 0]
        ];
        mapping.DARK_WALL[GFX.WEST] = [
            [0, 1]
        ];
        mapping.DARK_WALL[GFX.EAST] = [
            [1, 1]
        ];
        mapping.BACK_WALL.offset = {
            x: 0,
            y: 2
        };
        mapping.BACK_WALL[GFX.WALL_SOUTH_BASE] = [
            [1, 6]
        ];
        mapping.BACK_WALL[GFX.WALL_SE_BASE] = [
            [2, 6]
        ];
        mapping.BACK_WALL[GFX.WALL_SW_BASE] = [
            [0, 6]
        ];
        mapping.BACK_WALL[GFX.WALL_SQR_SE_BASE] = [
            [4, 5]
        ];
        mapping.BACK_WALL[GFX.WALL_SQR_SW_BASE] = [
            [3, 5]
        ];
        mapping.BACK_WALL[GFX.EAST] = [
            [1, 0]
        ];
        mapping.BACK_WALL[GFX.WEST] = [
            [1, 0]
        ];
        mapping.BACK_WALL.wallYVariance = {};
        mapping.BACK_WALL.wallYVariance[GFX.WALL_SOUTH] = {
            loop: [1],
            end: [0]
        };
        mapping.BACK_WALL.wallYVariance[GFX.WALL_SE] = {
            loop: [1],
            end: [0]
        };
        mapping.BACK_WALL.wallYVariance[GFX.WALL_SW] = {
            loop: [1],
            end: [0]
        };
        mapping.BACK_WALL.wallYVariance[GFX.WALL_SQR_SE] = {
            loop: [1],
            end: [0]
        };
        mapping.BACK_WALL.wallYVariance[GFX.WALL_SQR_SW] = {
            loop: [1],
            end: [0]
        };
        mapping.SUB.ignoreTerrain = [GFX.WALL_SOUTH, GFX.WALL_SOUTH_BASE, GFX.WALL_SE, GFX.WALL_SW, GFX.WALL_SQR_SE,
            GFX.WALL_SQR_SE_BASE, GFX.WALL_SQR_SW, GFX.WALL_SQR_SW_BASE
        ];
        mapping.SUB.ignoreTerrainKeepWallBase = [GFX.WALL_SOUTH, GFX.WALL_SE, GFX.WALL_SW, GFX.WALL_SQR_SE, GFX.WALL_SQR_SW];
        mapping.SUB.BASE[GFX.WALL_SE_BASE] = [
            [2, 4]
        ];
        mapping.SUB.BASE[GFX.WALL_SW_BASE] = [
            [0, 4]
        ];
        mapping.SUB.BASE[GFX.WALL_SOUTH_BASE] = [
            [1, 4]
        ];
        mapping.SUB.BASE[GFX.WALL_SQR_SE_BASE] = [
            [1, 2]
        ];
        mapping.SUB.BASE[GFX.WALL_SQR_SW_BASE] = [
            [1, 1]
        ];
        mapping.SUB.SHADOW.offset = {
            x: 0,
            y: 0
        };
        mapping.SUB.SHADOW[GFX.DIAGONAL_NW] = [
            [3, 3]
        ];
        mapping.SUB.SHADOW[GFX.DIAGONAL_NE] = [
            [4, 3]
        ];
        mapping.SUB.BACK_WALL.offset = {
            x: 0,
            y: 0
        };
        mapping.SUB.BACK_WALL[GFX.DIAGONAL_SE] = [
            [3, 4]
        ];
        mapping.SUB.BACK_WALL[GFX.DIAGONAL_SW] = [
            [4, 4]
        ];
        mapping.SUB.BORDER[GFX.NORTH] = [
            [
                [2, 5]
            ],
            [
                [3, 5]
            ]
        ];
        mapping.SUB.BORDER[GFX.EAST] = [
            [
                [4, 5]
            ],
            [
                [4, 6]
            ]
        ];
        mapping.SUB.BORDER[GFX.SOUTH] = [
            [
                [2, 6]
            ],
            [
                [3, 6]
            ]
        ];
        mapping.SUB.BORDER[GFX.WEST] = [
            [
                [1, 5]
            ],
            [
                [1, 6]
            ]
        ];
        mapping.SUB.CHASM_FLOOR[GFX.DIAGONAL_SE] = [
            [0, 5]
        ];
        mapping.SUB.CHASM_FLOOR[GFX.DIAGONAL_SW] = [
            [0, 6]
        ];

        // Mirrored gfx types used for back walls on the shadow pass.
        var shadowFlipMap = {};
        shadowFlipMap[GFX.WEST] = GFX.WEST;
        shadowFlipMap[GFX.EAST] = GFX.EAST;
        shadowFlipMap[GFX.DIAGONAL_NW] = GFX.DIAGONAL_SE;
        shadowFlipMap[GFX.DIAGONAL_NE] = GFX.DIAGONAL_SW;

        // Collision tile ids per fill type, for each collision scenario.
        var tilesAbove = {
                1: 2,
                2: 8,
                3: 9,
                4: 10,
                5: 11
            },
            tilesAtLevel = {
                1: 1,
                2: 6,
                3: 7,
                4: 4,
                5: 5
            },
            tilesAtMaster = {
                1: 2,
                2: 24,
                3: 25,
                4: 26,
                5: 27
            };

        /**
         * Resolves a height-map gfx type (plus terrain/shade context) to the
         * actual tile id for the tileset defined by `settings`.
         */
        var ChipsetSettings = ig.Class.extend({
            tileCountX: 0,
            base: null,
            terrains: [],

            /**
             * @param {Object} settings raw `wm.CHIPSET_CONFIG` entry (base +
             *        terrains, each with ground/cliff coordinates and mapping type)
             */
            init: function (settings) {
                this.tileCountX = settings.tileCountX;
                this.base = this._copySettings(settings.base);
                if (settings.terrains)
                    for (var i = 0; i < settings.terrains.length; ++i) this.terrains[i] = this._copySettings(settings.terrains[i])
            },

            _copySettings: function (settings) {
                var copy = ig.copy(settings);
                copy.mapping = chipsetMappings[settings.mappingType] || null;
                // Note: the original tests `blockTypes` here but reads `blockedTypes`
                // — preserved verbatim (no shipped config sets `blockTypes`, so this
                // branch never runs).
                if (settings.blockTypes) {
                    copy.blockedTypes = [];
                    for (var i = settings.blockedTypes.length; i--;) copy.blockedTypes.push(GFX[settings.blockedTypes[i]])
                }
                return copy
            },

            /** The settings that own the mapping used for `terrainIndex`. */
            _getMappingMain: function (terrainIndex) {
                if (terrainIndex && this.terrains[terrainIndex - 1]) {
                    var settings = this.terrains[terrainIndex - 1];
                    if (settings.mapping) return settings;
                    if (settings.baseTerrain) return this.terrains[settings.baseTerrain - 1]
                }
                return this.base
            },

            hasShadowSide: function (terrainIndex) {
                return this._getMappingMain(terrainIndex).mapping.hasShadowSide
            },

            /** How many tiles tall the chasm walls are for this terrain. */
            getChasmHeight: function (terrainIndex) {
                var settings = this._getMappingMain(terrainIndex),
                    height = 1;
                if (settings.mapping.CHASM.wallYVariance) height = settings.mapping.CHASM.wallYVariance[GFX.WALL_SOUTH].start.length;
                return height
            },

            getChasmTileAdd: function (terrainIndex) {
                return this._getMappingMain(terrainIndex).mapping.chasmTileAdd || 0
            },

            /** True when this terrain has floor-level chasm tiles. */
            hasFloorChasm: function (terrainIndex) {
                return this.hasChasm() && this.getChasmTileAdd(terrainIndex) == 0
            },

            hasShadow: function () {
                return this.base.shadow &&
                    !this.base.chasmOnly
            },

            hasChasm: function () {
                return this.base.shadow
            },

            /** True when the gfx type is a fill or a blocked tile of the terrain. */
            isFill: function (gfxType, terrain) {
                return gfxType == GFX.FILL || (terrain && this.terrains[terrain - 1].blockedTypes ? this.terrains[terrain - 1].blockedTypes.indexOf(gfxType) != -1 : this.base.blockedTypes && this.base.blockedTypes.indexOf(gfxType) != -1)
            },

            /** True when the upper terrain draws a wall over the lower terrain. */
            isWallTerrainFromTop: function (lowerTerrain, terrain) {
                var lowerSettings = lowerTerrain && this.terrains[lowerTerrain - 1] || this.base,
                    upperSettings = terrain && this.terrains[terrain - 1] || this.base;
                return (upperSettings && upperSettings.wallTerrainPrio || 0) > (lowerSettings && lowerSettings.wallTerrainPrio || 0)
            },

            /**
             * Resolve the tile id for a height-map tile.
             * @param {string} gfxType height-map tile type (GFX.*)
             * @param {number} x tile x on the layer
             * @param {number} y tile y on the layer
             * @param {string} [shadeType] "SHADOW"/"CHASM"/"BACK_WALL"/… pass
             * @param {number} [terrain] terrain index (1-based), 0 for base
             * @param {number} [terrainBorder] terrain-border index
             * @param {Object} [lineRange] start/end range for wall-line variance
             */
            getGfx: function (gfxType, x, y, shadeType, terrain, terrainBorder, lineRange) {
                terrain && !this.terrains[terrain - 1] && (terrain = 0);
                var baseSettings = this.base,
                    terrainSettings = null;
                if (terrain && this.terrains[terrain - 1].mapping) baseSettings = this.terrains[terrain - 1];
                else if (terrain) (terrainSettings = this.terrains[terrain - 1]) && terrainSettings.baseTerrain && (baseSettings = this.terrains[terrainSettings.baseTerrain - 1]);
                var offset = null,
                    mapping = baseSettings.mapping,
                    tiles = mapping.BASE[gfxType],
                    ground = baseSettings.ground,
                    cliff = baseSettings.cliff,
                    wallYVariance = mapping.BASE.wallYVariance,
                    ignoreTerrain = terrainSettings && terrainSettings.overrideWallBase ? mapping.SUB.ignoreTerrainKeepWallBase : mapping.SUB.ignoreTerrain;
                terrainSettings && ignoreTerrain.indexOf(gfxType) != -1 && (terrainSettings = null);
                if (shadeType) {
                    offset = mapping[shadeType].offset;
                    tiles = mapping[shadeType][gfxType] || tiles;
                    wallYVariance = mapping[shadeType].wallYVariance || wallYVariance;
                    ground = null;
                    cliff = baseSettings.shadow
                } else if (baseSettings.cliffAlt && mapping.ALT[gfxType] && Math.random() < 0.5) {
                    offset = mapping.ALT.offset;
                    tiles = mapping.ALT[gfxType]
                }
                var useBorder = false,
                    subMapping;
                if (terrainSettings)
                    if ((subMapping = shadeType && mapping.SUB[shadeType]) &&
                        subMapping[gfxType]) {
                        cliff = terrainSettings.cliff;
                        offset = subMapping.offset;
                        tiles = subMapping[gfxType]
                    } else if (!shadeType) {
                        ground = terrainSettings.ground;
                        cliff = terrainSettings.cliff;
                        tiles = mapping.SUB.BASE[gfxType] || tiles;
                        useBorder = terrainSettings.border
                    }
                var offsetY = offset && offset.y || 0;
                if (this.isFill(gfxType)) return ground ? this._getTile(ground.x, ground.y) : tiles ? this._getMappingTile(cliff, tiles, x, y, offsetY) : 0;
                if (lineRange && wallYVariance && wallYVariance[gfxType]) {
                    var variance = wallYVariance[gfxType];
                    variance.end && lineRange.end < variance.end.length ? offsetY = offsetY + variance.end[lineRange.end] : variance.start && lineRange.start < variance.start.length ? offsetY = offsetY + variance.start[lineRange.start] : variance.loop && (offsetY = offsetY + variance.loop[lineRange.start % variance.loop.length])
                }
                useBorder && (terrain && terrainBorder != -1 && mapping.SUB.BORDER[gfxType]) && (tiles = mapping.SUB.BORDER[gfxType][terrainBorder]);
                return !tiles || tiles.length == 0 ? 0 : this._getMappingTile(cliff, tiles, x, y, offsetY)
            },

            /** Pick the variation of a 2-tile mapping and return the tile id. */
            _getMappingTile: function (cliff, tiles, x, y, offsetY) {
                tiles = tiles.length > 1 && this._getVariation(x, y) ? tiles[1] : tiles[0];
                return this._getTile(cliff.x + tiles[0], cliff.y + tiles[1] + (offsetY || 0))
            },

            _getTile: function (x, y) {
                return y * this.tileCountX + x + 1
            },

            /** Checkerboard variation: alternates with x + y parity. */
            _getVariation: function (x, y) {
                return (x + y) % 2
            }
        })
    }
});
ig.baked = !0;
