/**
 * impact.base.collision-map
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.collision-map")`.
 *
 * The collision tile layer. Tiles encode a "height level" (full/partial ground)
 * and a "slope type" (flat, half, or one of four diagonal triangles). `ig.MAP.Collision`
 * provides ground/hole/block queries and swept AABB tracing (`trace`), and
 * `ig.CollMapTools` + `ig.MAP.Collision.solveBlockCollision` implement the tile
 * decoding and the actual box-vs-tile collision math.
 */
ig.module("impact.base.collision-map").requires("impact.base.map", "game.config").defines(function () {

    /**
     * Decode a collision tile id into a height level (0..3):
     * how much of the tile is "filled" vertically.
     */
    function getHeightLevel(tile) {
        return tile < 4 ? tile % 3 : (tile - 12) >> 2;
    }

    /**
     * Decode a collision tile id into a slope type:
     *   0 = hole, 1 = half/one-way, 2..5 = diagonal triangle (direction).
     */
    function getSlopeType(tile) {
        return tile < 4 ? (tile == 3 ? 0 : 1) : 2 + tile % 4;
    }

    ig.MAP.Collision = ig.Map.extend({
        _wm: new ig.Config({
            _label: "Collision",
            _fixSize: ig.CONFIG.DISABLE_LAYER_SIZE,
            _noRepeat: true,
            _noMoveSpeed: true,
            _noDistance: ig.CONFIG.DISABLE_LAYER_DISTANCE,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _fixTileset: ig.CONFIG.COLLISION_TILESET,
            _noFirstLastLayer: true,
            _icon: "weltmeister/lib/map/img/layer-collision-icon.png",
            _alphaActive: 0.6,
            _alphaInactive: 0,
            _alphaEntities: 0,
        }),

        init: function (mapData, zHeight) {
            this.parent(mapData, zHeight);
        },

        /**
         * Prepare collision tiles, optionally merging with a source map's tiles
         * (used for level-merged collision).
         * @param {Object} [sourceMap]
         * @param {number} [zOffset]
         */
        prepare: function (sourceMap, zOffset) {
            for (var row = 0; row < this.height; row++) {
                for (var col = 0; col < this.width; col++) {
                    var sourceTile;
                    if (sourceMap) sourceTile = sourceMap.data[row + zOffset] ? sourceMap.data[row + zOffset][col] % 32 : 2;
                    this.data[row][col] = ig.CollMapTools.prepareSingleTile(col, row, this.data[row][col], sourceTile, zOffset);
                }
            }
        },

        isTileGround: function (x, y) {
            var tile = this.getTile(x, y);
            return ig.CollMapTools.isTileFullGround(tile);
        },

        /** @returns {boolean} whether the given AABB overlaps a blocking tile. */
        isTileAreaBlocked: function (x, y, width, height) {
            var startCol = Math.floor(x / this.tilesize);
            var endCol = Math.floor(Math.ceil(x + width - 1) / this.tilesize);
            var startRow = Math.floor(y / this.tilesize);
            var endRow = Math.floor(Math.ceil(y + height - 1) / this.tilesize);
            startRow = Math.max(startRow, 0);
            endRow = Math.min(endRow, this.height - 1);
            startCol = Math.max(startCol, 0);
            endCol = Math.min(endCol, this.width - 1);

            for (endRow = endRow + 1; endRow-- > startRow;) {
                for (var col = endCol + 1; col-- > startCol;) {
                    var tile = this.getGridTile(col, endRow);
                    if (ig.CollMapTools.isTileBlocked(tile)) {
                        var slopeType = getSlopeType(tile);
                        if (slopeType == 1 ||
                            (slopeType >= 2 && ig.CollMapTools.isTriangleOverlap(
                                (col + 0.5) * this.tilesize, (endRow + 0.5) * this.tilesize, slopeType, x, y, width, height))) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        isGridHole: function (col, row) {
            var tile = this.getGridTile(col, row);
            var heightLevel = getHeightLevel(tile);
            var slopeType = getSlopeType(tile);
            return heightLevel == 3 || (heightLevel == 1 && slopeType == 1);
        },

        /**
         * Test whether the AABB is over a hole. Returns a "coverage" value:
         *   2 = fully over holes, 1 = partly, 0 = none.
         * @param {Object} [out] if given, accumulates a push direction
         */
        isOverHole: function (x, y, width, height, out) {
            var startCol = Math.floor(x / this.tilesize);
            var endCol = Math.floor(Math.ceil(x + width - 1) / this.tilesize);
            var startRow = Math.floor(y / this.tilesize);
            var endRow = Math.floor(Math.ceil(y + height - 1) / this.tilesize);
            startRow = Math.max(startRow, 0);
            endRow = Math.min(endRow, this.height - 1);
            startCol = Math.max(startCol, 0);
            endCol = Math.min(endCol, this.width - 1);

            var holeCount = 0;
            var tileCount = 0;
            for (var row = endRow + 1; row-- > startRow;) {
                for (var col = endCol + 1; col-- > startCol;) {
                    ++tileCount;
                    var tile = this.data[row] && this.data[row][col];
                    tile = tile % 32;
                    var slopeType = getSlopeType(tile);
                    var heightLevel = getHeightLevel(tile);
                    var isHole = 0;

                    if (heightLevel == 3) {
                        isHole = 1;
                    } else if (heightLevel == 1) {
                        if (slopeType == 1) {
                            isHole = 1;
                        } else if (slopeType > 1) {
                            var tileCenterX = (col + 0.5) * this.tilesize;
                            var tileCenterY = (row + 0.5) * this.tilesize;
                            if (slopeType == 2 && col == endCol && row == startRow) {
                                if (x + width - tileCenterX - (y - tileCenterY) <= 0.01) isHole = 1;
                            } else if (slopeType == 2 && col == startCol && row == endRow) {
                                if (-(x - tileCenterX) + (y + height - tileCenterY) > 0.01) isHole = 0.5;
                            } else if (slopeType == 3 && col == endCol && row == endRow) {
                                if (x + width - tileCenterX + (y + height - tileCenterY) <= 0.01) isHole = 1;
                            } else if (slopeType == 3 && col == startCol && row == startRow) {
                                if (-(x - tileCenterX) - (y - tileCenterY) > 0.01) isHole = 0.5;
                            } else if (slopeType == 4 && col == startCol && row == endRow) {
                                if (-(x - tileCenterX) + (y + height - tileCenterY) <= 0.01) isHole = 1;
                            } else if (slopeType == 4 && col == endCol && row == startRow) {
                                if (x + width - tileCenterX - (y - tileCenterY) > 0.01) isHole = 0.5;
                            } else if (slopeType == 5 && col == startCol && row == startRow) {
                                if (-(x - tileCenterX) - (y - tileCenterY) <= 0.01) isHole = 1;
                            } else if (slopeType == 5 && col == endCol && row == endRow) {
                                if (x + width - tileCenterX + (y + height - tileCenterY) > 0.01) isHole = 0.5;
                            } else {
                                isHole = 0.5;
                            }
                        }
                    }

                    if (isHole != 1 && !out) return 0;
                    if (isHole != 0 && out) {
                        out.x = out.x + (col == startCol ? -1 : col == endCol ? 1 : 0);
                        out.y = out.y + (row == startRow ? -1 : row == endRow ? 1 : 0);
                    }
                    holeCount = holeCount + isHole;
                }
            }
            return holeCount == tileCount ? 2 : holeCount > 0 ? 1 : 0;
        },

        /**
         * Swept AABB trace against collision tiles. Returns the resolved result in
         * `result` (dist + dir).
         * @param {Object} result
         * @param {number} x
         * @param {number} y
         * @param {number} velX
         * @param {number} velY
         * @param {number} sizeX
         * @param {number} sizeY
         * @param {boolean} oneWay skip one-way (half-ground) tiles
         * @param {boolean} [solidSlopes] treat slopes as solid blocks
         */
        trace: function (result, x, y, velX, velY, sizeX, sizeY, oneWay, solidSlopes) {
            var startRow = Math.floor((y + (velY < 0 ? velY : 0)) / this.tilesize);
            var endRow = Math.floor(Math.ceil(y + sizeY - 1 + (velY > 0 ? velY : 0)) / this.tilesize);
            var startCol = Math.floor((x + (velX < 0 ? velX : 0)) / this.tilesize);
            var endCol = Math.floor(Math.ceil(x + sizeX - 1 + (velX > 0 ? velX : 0)) / this.tilesize);
            var diagonalCol, diagonalRow, diagonalCol2, diagonalRow2;

            if (velX != 0 && velY != 0) {
                // Corner-crossing pre-check: if the move cuts exactly through a tile
                // corner, only test that corner tile (avoid double-collision).
                var cornerOffsetX;
                cornerOffsetX = x + velX + (velX < 0 ? sizeX : 0) - (velX < 0 ? endRow : startRow + 1) * this.tilesize;
                var cornerOffsetY = y + velY + (velY > 0 ? sizeY : 0) - (velY > 0 ? endCol : startCol + 1) * this.tilesize;
                if (cornerOffsetY && cornerOffsetY * velY >= 0 && cornerOffsetX * velX >= 0 &&
                    Math.abs(cornerOffsetX) < Math.abs(velX) && Math.abs(cornerOffsetY) < Math.abs(velY) &&
                    Math.abs(velX / velY) < Math.abs(cornerOffsetX / cornerOffsetY)) {
                    diagonalCol = velX < 0 ? endRow : startRow;
                    diagonalRow = velY > 0 ? endCol : startCol;
                }
                cornerOffsetY = y + velY + (velY < 0 ? sizeY : 0) - (velY < 0 ? endCol : startCol + 1) * this.tilesize;
                if ((cornerOffsetX = x + velX + (velX > 0 ? sizeX : 0) - (velX > 0 ? endRow : startRow + 1) * this.tilesize) &&
                    cornerOffsetY * velY >= 0 && cornerOffsetX * velX >= 0 &&
                    Math.abs(cornerOffsetX) < Math.abs(velX) && Math.abs(cornerOffsetY) < Math.abs(velY) &&
                    Math.abs(velY / velX) < Math.abs(cornerOffsetY / cornerOffsetX)) {
                    diagonalCol2 = velX > 0 ? endRow : startRow;
                    diagonalRow2 = velY < 0 ? endCol : startCol;
                }
            }

            var hit = false;
            startCol = Math.max(startCol, 0);
            endCol = Math.min(endCol, this.height - 1);
            startRow = Math.max(startRow, 0);
            endRow = Math.min(endRow, this.width - 1);

            for (endCol = endCol + 1; endCol-- > startCol;) {
                for (var col = endRow + 1; col-- > startRow;) {
                    if ((col != diagonalCol || endCol != diagonalRow) && (col != diagonalCol2 || endCol != diagonalRow2)) {
                        var tile = this.data[endCol] && this.data[endCol][col];
                        tile = tile % 32;
                        var slopeType = getSlopeType(tile);
                        var heightLevel = getHeightLevel(tile);

                        if (solidSlopes) {
                            if (heightLevel == 1) slopeType = slopeType > 1 ? slopeType % 4 + 2 : (slopeType ? 0 : 1);
                            else if (heightLevel != 3) slopeType = 1;
                        } else {
                            if (oneWay && heightLevel == 1) continue;
                            if (!oneWay && heightLevel == 3) slopeType = 1;
                        }

                        if (slopeType > 1) {
                            hit = ig.MAP.Collision.solveBlockCollision(
                                result, x, y, velX, velY, sizeX, sizeY,
                                col * this.tilesize, endCol * this.tilesize, this.tilesize, this.tilesize,
                                (slopeType - 2) % 4) || hit;
                        } else if (slopeType) {
                            hit = ig.MAP.Collision.solveBlockCollision(
                                result, x, y, velX, velY, sizeX, sizeY,
                                col * this.tilesize, endCol * this.tilesize, this.tilesize, this.tilesize) || hit;
                        }
                    }
                }
            }
            return hit;
        },
    });

    ig.MAP.Collision.levelKey = "collision";

    ig.CollMapTools = {
        isTileBlocked: function (tile) {
            var heightLevel = getHeightLevel(tile);
            return heightLevel == 2 || heightLevel == 3;
        },

        isTileFullGround: function (tile) {
            var heightLevel = getHeightLevel(tile);
            var slopeType = getSlopeType(tile);
            return heightLevel != 1 && heightLevel != 3 && slopeType == 0;
        },

        isTilePartlyGround: function (tile) {
            var heightLevel = getHeightLevel(tile);
            var slopeType = getSlopeType(tile);
            return heightLevel == 3 || heightLevel == 2 || (heightLevel == 1 && slopeType == 1) ? false : true;
        },

        /**
         * Combine the collision values across multiple z-levels into one tile value.
         */
        getRealCollValue: function (col, row, targetLevel, levels, levelHeight, otherLevel) {
            var step = targetLevel > otherLevel ? 1 : -1;
            var targetHeight = levels[targetLevel].height;
            var rowOffset = targetHeight - levels[otherLevel].height;
            var value;
            for (value = levels[otherLevel] ? this.prepareSingleTile(col, row, levels[otherLevel].getTile(col, row + rowOffset)) : 3;
                 otherLevel != targetLevel;) {
                otherLevel = otherLevel + step;
                rowOffset = targetHeight - levels[otherLevel].height;
                value = levels[otherLevel] ? this.prepareSingleTile(col, row, levels[otherLevel].getTile(col, row + rowOffset), value, step) : 3;
            }
            return value;
        },

        /**
         * Compute a single collision tile value, optionally merging the tile below/above.
         * @param {number} col
         * @param {number} row
         * @param {number} tile
         * @param {number} [belowTile]
         * @param {number} [dir] +1 = below, -1 = above
         */
        prepareSingleTile: function (col, row, tile, belowTile, dir) {
            var result = tile;
            var baseTile = result % 32;
            var base = result - baseTile;

            if ((baseTile > 0 && baseTile < 4) || baseTile >= 16) return tile;

            if (belowTile === undefined) {
                result = baseTile == 0 || baseTile >= 12 ? base + 3 : base + (baseTile + 12);
            } else {
                var belowSlope = getSlopeType(belowTile);
                var belowHeight = getHeightLevel(belowTile);
                if (dir > 0) {
                    if (baseTile == 0) {
                        result = (belowHeight == 2 || belowHeight == 3)
                            ? base + (belowSlope == 1 ? 3 : belowSlope % 4 + 16)
                            : base + 1;
                    } else {
                        var slopeDir = 2 + baseTile % 4;
                        result = (belowSlope != slopeDir && (belowHeight == 2 || belowHeight == 3))
                            ? base + (baseTile >= 12 ? 3 : baseTile + 12)
                            : base + (baseTile >= 12 ? slopeDir % 4 + 16 : baseTile >= 8 ? baseTile + 16 : 1);
                    }
                } else if (baseTile == 0) {
                    result = belowHeight == 1 ? base + (belowSlope == 1 ? 3 : belowSlope % 4 + 20)
                        : belowHeight == 3 ? base + (belowTile - 4) : base + 2;
                } else {
                    var slopeDir2 = 2 + baseTile % 4;
                    if (belowHeight == 3) belowSlope = 2 + belowSlope % 4;
                    result = (belowSlope != slopeDir2 && (belowHeight == 1 || belowHeight == 3))
                        ? base + (baseTile >= 12 ? 3 : baseTile + 12)
                        : base + (baseTile >= 12 ? slopeDir2 % 4 + 20 : baseTile >= 8 ? 2 : slopeDir2 % 4 + 24);
                }
            }
            return result;
        },

        /**
         * Test overlap between an AABB and a triangular slope tile.
         * @param {number} tileCenterX
         * @param {number} tileCenterY
         * @param {number} slopeType 2..5
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */
        isTriangleOverlap: function (tileCenterX, tileCenterY, slopeType, x, y, width, height) {
            Math.abs(height / width); // (unused — likely a warm-up/leftover)
            var dirX, dirY;
            if (slopeType == 2) { dirX = 1; dirY = -1; }
            else if (slopeType == 3) { dirY = dirX = 1; }
            else if (slopeType == 4) { dirX = -1; dirY = 1; }
            else if (slopeType == 5) { dirY = dirX = -1; }
            return dirX * ((dirX > 0 ? x : x + width) - tileCenterX) +
                dirY * ((dirY > 0 ? y : y + height) - tileCenterY) < 0;
        },
    };

    // A "no collision" stub used by ig.Map.levels for empty layers.
    ig.MAP.Collision.staticNoCollision = {
        isOverHole: function () { return 0; },
        isTileGround: function () { return false; },
        isTileAreaBlocked: function () { return false; },
        trace: function () { return false; },
        prepare: function () {},
    };

    ig.COLLISION = {};
    ig.COLLISION.EPS = 1e-5;
    ig.COLLISION.SLIP_PIXELS = 8;
    ig.COLLISION.HEIGHT_TOLERATE = 4;

    /**
     * Solve collision of a moving AABB against a single (possibly sloped) block.
     * Writes the resolved distance + direction into `result`.
     * @param {Object} result has dist, dir, slipX, slipY
     * @param {number} x
     * @param {number} y
     * @param {number} velX
     * @param {number} velY
     * @param {number} sizeX
     * @param {number} sizeY
     * @param {number} blockX
     * @param {number} blockY
     * @param {number} blockWidth
     * @param {number} blockHeight
     * @param {number} [slopeType] if set, treat the block as a diagonal slope
     */
    ig.MAP.Collision.solveBlockCollision = function (result, x, y, velX, velY, sizeX, sizeY, blockX, blockY, blockWidth, blockHeight, slopeType) {
        var hit = false;

        if (slopeType != undefined) {
            // --- slope collision (diagonal half-plane test) ---
            var slopeP = 0;
            var slopeR = 0;
            var blockCenterX = blockX + blockWidth / 2;
            var blockCenterY = blockY + blockHeight / 2;
            switch (slopeType) {
                case 0: slopeP = -blockCenterX + blockCenterY - (-y + x + sizeY); slopeR = -velX + velY; break;
                case 1: slopeP = -blockCenterX - blockCenterY - (-y - x); slopeR = -velX - velY; break;
                case 2: slopeP = blockCenterX - blockCenterY - (x + sizeX - y); slopeR = velX - velY; break;
                case 3: slopeP = blockCenterX + blockCenterY - (x + sizeX + y + sizeY); slopeR = velX + velY;
            }

            if ((hit = slopeP + 0.1 >= 0) && slopeR > 0) {
                slopeP = Math.max(0, slopeP / slopeR - ig.COLLISION.EPS);
                if (slopeP - ig.COLLISION.EPS < result.dist) {
                    var overlap = 0;
                    switch (slopeType) {
                        case 0: overlap = x + slopeP * velX - blockCenterX + (y + slopeP * velY + sizeY - blockCenterY); break;
                        case 1: overlap = x + slopeP * velX - blockCenterX - (y + slopeP * velY - blockCenterY); break;
                        case 2: overlap = x + slopeP * velX + sizeX - blockCenterX + (y + slopeP * velY - blockCenterY); break;
                        case 3: overlap = x + slopeP * velX + sizeX - blockCenterX - (y + slopeP * velY + sizeY - blockCenterY);
                    }
                    if (Math.abs(overlap) > blockWidth + 0.1) {
                        hit = false;
                    } else {
                        velY = velX = 0;
                        result.dist = slopeP;
                        result.dir.x = (slopeType < 2 ? -1 : 1) * Math.SQRT1_2;
                        result.dir.y = (slopeType == 0 || slopeType == 3 ? 1 : -1) * Math.SQRT1_2;
                        return true;
                    }
                }
            }
        }

        if (!hit) {
            // --- axis-aligned box collision ---
            var timeX = velX == 0 ? -1 : (blockX + (velX > 0 ? -sizeX : blockWidth) - x) / velX;
            var timeY = velY == 0 ? -1 : (blockY + (velY > 0 ? -sizeY : blockHeight) - y) / velY;
            var minTime = Math.min(timeX, timeY);
            var maxTime = Math.max(timeX, timeY);

            if (minTime + ig.COLLISION.EPS >= 0 && maxTime < 1) {
                if (maxTime < result.dist) {
                    if (result.slipX != undefined) result.slipX = result.dir.x ? (velX > 0 ? 1e3 : -1e3) : 0;
                    if (result.slipY != undefined) result.slipY = result.dir.y ? (velY > 0 ? 1e3 : -1e3) : 0;
                    result.dist = maxTime;
                    result.dir.x = maxTime == timeX ? (velX > 0 ? 1 : -1) : 0;
                    result.dir.y = maxTime == timeY ? (velY > 0 ? 1 : -1) : 0;
                    if (maxTime == timeX && maxTime == timeY) {
                        result.dir.x = result.dir.x * Math.SQRT1_2;
                        result.dir.y = result.dir.y * Math.SQRT1_2;
                    }
                    return true;
                }
            } else {
                if (timeX + ig.COLLISION.EPS >= 0 && timeX - ig.COLLISION.EPS <= result.dist) {
                    var slipY = (y + sizeY - ig.COLLISION.SLIP_PIXELS < blockY || y + ig.COLLISION.SLIP_PIXELS > blockY + blockHeight)
                        ? (blockY - y > y + sizeY - blockY - blockHeight ? blockY - y - sizeY : blockY + blockHeight - y)
                        : 0;
                    result.slipY = (result.slipY != undefined && timeX + ig.COLLISION.EPS >= result.dist)
                        ? (result.slipY * slipY <= 0 ? 0 : result.slipY)
                        : slipY;
                    result.dist = Math.max(0, timeX - ig.COLLISION.EPS);
                    result.dir.x = velX > 0 ? 1 : -1;
                    result.dir.y = 0;
                    return true;
                }
                if (timeY + ig.COLLISION.EPS >= 0 && timeY - ig.COLLISION.EPS <= result.dist) {
                    var slipX = (x + sizeX - ig.COLLISION.SLIP_PIXELS < blockX || x + ig.COLLISION.SLIP_PIXELS > blockX + blockWidth)
                        ? (blockX - x > x + sizeX - blockX - blockWidth ? blockX - x - sizeX : blockX + blockWidth - x)
                        : 0;
                    result.slipX = (result.slipX != undefined && timeY + ig.COLLISION.EPS >= result.dist)
                        ? (result.slipX * slipX <= 0 ? 0 : result.slipX)
                        : slipX;
                    result.dist = Math.max(0, timeY - ig.COLLISION.EPS);
                    result.dir.x = 0;
                    result.dir.y = velY > 0 ? 1 : -1;
                    return true;
                }
            }
        }
        return false;
    };
});
