/**
 * impact.feature.navigation.nav-map
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.navigation.nav-map")`.
 *
 * The navigation graph layer. `ig.MAP.Navigation` scans the collision map for
 * walkable areas, creates one `ig.PathNode` per contiguous region (flood-fill
 * expansion in `ig.PathNode.init`), records the edges between neighbouring
 * regions, and connects nodes between levels via "air" nodes (holes). Node
 * ids, area flags and build flags are packed into the layer's grid tiles.
 */
ig.module("impact.feature.navigation.nav-map")
    .requires("impact.base.map", "impact.base.image", "game.config")
    .defines(function () {

    /** Debug-draw one connection edge (optionally with an arrow toward the node). */
    function drawEdge(color, edge, node, levelHeight, tilesize, offset, drawArrow, width) {
        var offsetX = 0,
            offsetY = 0;
        if (edge.min.x - edge.max.x) {
            offsetY = edge.min.y * tilesize + levelHeight < node.center.y ? offset : -offset;
        } else {
            offsetX = edge.min.x * tilesize < node.center.x ? offset : -offset;
        }
        var x1 = edge.min.x * tilesize + offsetX + Math.abs(offsetY),
            y1 = edge.min.y * tilesize + offsetY + Math.abs(offsetX),
            x2 = edge.max.x * tilesize + offsetX - Math.abs(offsetY),
            y2 = edge.max.y * tilesize + offsetY - Math.abs(offsetX);
        ig.Debug.drawLine(color, x1, y1, x2, y2, width || 2);
        edge.block[0] && ig.Debug.drawCircle("red", x1, y1, 4);
        edge.block[1] && ig.Debug.drawCircle("red", x2, y2, 4);
        if (drawArrow) {
            var mid = Vec2.mulF(Vec2.lerp(edge.min, edge.max, 0.5, scratchVec2a), tilesize),
                arrowEnd = Vec2.lerp(mid, node.center, 0.75, scratchVec2b);
            ig.Debug.drawLine(color, mid.x + offsetX, mid.y + offsetY, arrowEnd.x, arrowEnd.y - levelHeight * 0.75, width || 2);
        }
    }

    /**
     * Scan the grid (optionally only `rect`) and create an `ig.PathNode` for
     * every cell whose area flag marks walkable ground (1..8) that isn't
     * already part of a node.
     */
    function createNodes(navMap, collisionMap, zHeight, rect) {
        var startX, endX, startY, endY;
        if (rect) {
            startX = rect.minX;
            endX = rect.maxX + 1;
            startY = rect.minY;
            endY = rect.maxY + 1;
        } else {
            startX = 0;
            endX = navMap.width;
            startY = 0;
            endY = navMap.height;
        }
        for (; startY < endY; ++startY) {
            for (var x = startX; x < endX; ++x) {
                var areaFlag = getAreaFlag(navMap, collisionMap, x, startY);
                if (areaFlag && areaFlag < minSpecialAreaFlag && !navMap.getGridNodeId(x, startY)) {
                    var map = navMap,
                        nodeId = map.nodes.length + 1;
                    map.freeNodeIds.length > 0 && (nodeId = map.freeNodeIds.pop());
                    if (nodeId >= 2048) {
                        throw Error("Exceeded NavMap id range of 2048! Simplify Nav Map of height " + map.zHeight / 16);
                    }
                    map = nodeId;
                    nodeId = new ig.PathNode(map, navMap, collisionMap, x, startY, zHeight);
                    navMap.nodes[map - 1] = nodeId;
                }
            }
        }
    }

    /** (Re)initialize the per-search cached fields of `node` for `searchId`. */
    function ensureSearchData(node, searchId) {
        if (node.tmpSearchId != searchId) {
            node.tmpSearchId = searchId;
            node.tmpCameFromNode = null;
            node.tmpCameFromNeighbour = null;
            node.tmpClosed = false;
            node.tmpGScore = -1;
            node.tmpFScore = -1;
        }
    }

    /** Remove `otherNode` from `node`'s neighbour (and air neighbour) lists. */
    function removeNeighbour(node, otherNode) {
        node.airConnected = false;
        for (var i = node.neighbours.length; i--;)
            if (node.neighbours[i].node == otherNode) {
                node.neighbours.splice(i, 1);
                return;
            }
        for (i = node.airNeighbours.length; i--;)
            if (node.airNeighbours[i].node == otherNode) {
                node.airNeighbours.splice(i, 1);
                break;
            }
    }

    /** Recursively clear `node`'s id from the grid and track the erased bounds. */
    function eraseGridNode(navMap, node, x, y, rect) {
        if (navMap.getGridNodeId(x, y) == node.id) {
            navMap.setGridNodeId(x, y, 0);
            navMap.clearGridBuildFlags(x, y);
            rect.minX = Math.min(rect.minX, x);
            rect.maxX = Math.max(rect.maxX, x);
            rect.minY = Math.min(rect.minY, y);
            rect.maxY = Math.max(rect.maxY, y);
            for (var i = 0; i < DIRECTION_TABLE.length; ++i) {
                var dir = DIRECTION_TABLE[i];
                eraseGridNode(navMap, node, x + dir.x, y + dir.y, rect);
            }
        }
    }

    /**
     * Raw area flag of a grid cell; 0 if the tile is blocked or flagged BLOCK
     * (and the flag is outside the special area range).
     */
    function getAreaFlag(navMap, collisionMap, x, y) {
        var areaFlag = navMap.getGridAreaFlag(x, y);
        if (areaFlag < minSpecialAreaFlag || areaFlag > maxSpecialAreaFlag) {
            if (ig.CollMapTools.isTileBlocked(collisionMap.getGridTile(x, y)) ||
                navMap.getEntityFlagValue(x, y, ig.NAV_ENTITY_FLAG.BLOCK)) {
                return 0;
            }
        }
        return areaFlag;
    }

    /** Area flag plus the hole flag for walkable cells sitting over a grid hole. */
    function getWalkableValue(navMap, collisionMap, x, y) {
        var areaFlag = getAreaFlag(navMap, collisionMap, x, y);
        areaFlag != areaFlags.FENCE &&
            (!navMap.getGridForceGround(x, y) &&
                !navMap.getEntityFlagValue(x, y, ig.NAV_ENTITY_FLAG.GROUND) &&
                collisionMap && collisionMap.isGridHole(x, y)) && (areaFlag = areaFlag + HOLE_FLAG);
        return areaFlag;
    }

    /** Mark which of the edge's two ends are blocked (used for jump detection). */
    function markBlockedEdges(node, navMap, collisionMap) {
        node.block = [0, 0];
        if (collisionMap) {
            if (node.min.x != node.max.x) {
                if (!getWalkableValue(navMap, collisionMap, node.min.x - 1, node.min.y - 1) ||
                    !getWalkableValue(navMap, collisionMap, node.min.x - 1, node.min.y)) {
                    node.block[0] = 1;
                }
                if (!getWalkableValue(navMap, collisionMap, node.max.x, node.min.y - 1) ||
                    !getWalkableValue(navMap, collisionMap, node.max.x, node.min.y)) {
                    node.block[1] = 1;
                }
            } else {
                if (!getWalkableValue(navMap, collisionMap, node.min.x - 1, node.min.y - 1) ||
                    !getWalkableValue(navMap, collisionMap, node.min.x, node.min.y - 1)) {
                    node.block[0] = 1;
                }
                if (!getWalkableValue(navMap, collisionMap, node.min.x - 1, node.max.y) ||
                    !getWalkableValue(navMap, collisionMap, node.min.x, node.max.y)) {
                    node.block[1] = 1;
                }
            }
        }
    }

    /**
     * Connect `node` to the nodes of the other levels' nav maps by walking the
     * given edge list and grouping consecutive cells that land on the same
     * foreign node into one connection edge.
     */
    function connectLevels(navMap, node, edges, otherMaps, heightOffsets, connType, reverseType, bidirectional) {
        for (var i = 0; i < edges.length; ++i) {
            var edge = edges[i],
                offsetX = 0,
                offsetY = 0,
                stepX = 0,
                stepY = 0,
                length = 0;
            if (edge.min.x - edge.max.x) {
                stepX = 1;
                length = edge.max.x - edge.min.x;
                offsetY = navMap.getGridNodeId(edge.min.x, edge.min.y) == node.id ? -1 : 0;
            } else {
                stepY = 1;
                length = edge.max.y - edge.min.y;
                offsetX = navMap.getGridNodeId(edge.min.x, edge.min.y) == node.id ? -1 : 0;
            }
            for (var otherNode = null, runX = edge.min.x, runY = edge.min.y, step = 0, curX = edge.min.x, curY = edge.min.y;
                step < length; ++step, curX = curX + stepX, curY = curY + stepY) {
                for (var foreignNode = null, j = 0; !foreignNode && j < otherMaps.length; ++j) {
                    foreignNode = otherMaps[j].getGridNode(curX + offsetX, curY + offsetY + heightOffsets[j]);
                }
                if (foreignNode != otherNode) {
                    if (otherNode) {
                        var rect = {
                            min: { x: runX, y: runY },
                            max: { x: curX, y: curY }
                        };
                        markBlockedEdges(rect, navMap);
                        connectEdge(navMap, node, otherNode, rect, connType, reverseType, bidirectional);
                    }
                    otherNode = foreignNode;
                    runX = curX;
                    runY = curY;
                }
            }
            if (otherNode) {
                var rect = {
                    min: { x: runX, y: runY },
                    max: { x: curX, y: curY }
                };
                markBlockedEdges(rect, navMap);
                connectEdge(navMap, node, otherNode, rect, connType, reverseType, bidirectional);
            }
        }
    }

    /**
     * Add `edgeRect` as a connection between `fromNode` and `toNode` of type
     * `connType`; when `reverseType` is set, also create the reverse
     * connection of that type.
     */
    function connectEdge(navMap, fromNode, toNode, edgeRect, connType, reverseType, bidirectional) {
        if (bidirectional && (toNode.edges.up.length > 0 || toNode.edges.upStairs.length > 0)) {
            toNode.airConnected = false;
        }
        for (var i = fromNode.neighbours.length; i--;) {
            var neighbour = fromNode.neighbours[i];
            if (neighbour.node == toNode && neighbour.shared.type == connType) {
                neighbour.shared.edges.push(edgeRect);
                reverseType && neighbour.shared.reverse && neighbour.shared.reverse.edges.push(reverseEdge(navMap, fromNode, toNode, edgeRect));
                return;
            }
        }
        var connect = new ig.PathNodeConnect(connType);
        connect.edges.push(edgeRect);
        fromNode.neighbours.push({ node: toNode, shared: connect });
        toNode.airNeighbours.push({ node: fromNode, shared: connect });
        if (reverseType) {
            var reverse = new ig.PathNodeConnect(reverseType);
            reverse.edges.push(reverseEdge(navMap, fromNode, toNode, edgeRect));
            connect.reverse = reverse;
            toNode.neighbours.push({ node: fromNode, shared: reverse });
            fromNode.airNeighbours.push({ node: toNode, shared: reverse });
        }
    }

    /** Copy `edge` shifted down by the height difference between the two nodes. */
    function reverseEdge(navMap, fromNode, toNode, edge) {
        edge = ig.copy(edge);
        var heightDiff = (toNode.height - fromNode.height) / navMap.tilesize;
        edge.min.y = edge.min.y - heightDiff;
        edge.max.y = edge.max.y - heightDiff;
        return edge;
    }

    var nodeColors = ["red", "blue", "green", "yellow", "pink", "orange", "violet", "brown"],
        scratchVec2a = Vec2.create(),
        scratchVec2b = Vec2.create(),
        scratchVec2c = Vec2.create(),
        scratchVec2d = Vec2.create(),
        areaFlagMask = { bitOffset: 0, map: 31 },
        forceGroundMask = { bitOffset: 5, map: 1 },
        buildFlagsMask = { bitOffset: 8, map: 15 },
        nodeIdMask = { bitOffset: 12, map: 2047 };

    ig.NAV_ENTITY_FLAG = {
        BLOCK: { bitOffset: 23, map: 7 },
        GROUND: { bitOffset: 26, map: 7 }
    };

    /** Written (but not read) list of ground nodes processed in `connectAirNodes`. */
    var airNodes = [];

    ig.MAP.Navigation = ig.Map.extend({
        nodes: [],
        freeNodeIds: [],
        initialized: false,

        _wm: new ig.Config({
            _label: "Navigation",
            _fixSize: ig.CONFIG.DISABLE_LAYER_SIZE,
            _noRepeat: true,
            _noMoveSpeed: true,
            _noDistance: ig.CONFIG.DISABLE_LAYER_DISTANCE,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _fixTileset: "media/map/pathmap-tiles.png",
            _icon: "impact/feature/navigation/editors/layer-icon.png",
            _alphaActive: 0.6,
            _alphaInactive: 0,
            _alphaEntities: 0
        }),

        init: function (tilesize, data) {
            this.parent(tilesize, data);
        },

        /** Build the node graph for `levelIdx` from its collision map. */
        levelInit: function (levelIdx) {
            createNodes(this, ig.game.levels[levelIdx].collision, this.zHeight);
            this.initialized = true;
        },

        /** Rebuild nodes within the given tile rect after the map was edited. */
        reparse: function (levelIdx, minX, maxX, minY, maxY) {
            if (this.initialized) {
                var rect = { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
                for (var y = minY - 1; y <= maxY + 1; ++y) {
                    for (var x = minX - 1; x <= maxX + 1; ++x) {
                        if (!(x == minX - 1 || x == maxX + 1) || !(y == minY - 1 || y == maxY + 1)) {
                            var node = this.getGridNode(x, y);
                            if (node) {
                                node.erase(this, x, y, rect);
                                this.nodes[node.id - 1] = null;
                                this.freeNodeIds.push(node.id);
                            }
                        }
                    }
                }
                createNodes(this, ig.game.levels[levelIdx].collision, this.zHeight, rect);
            }
        },

        /**
         * Link this level's nodes to the levels below (down edges) and above
         * (up/upStairs edges), and bridge jump connections between ground nodes
         * that share an air node.
         */
        connectAirNodes: function (levelIdx) {
            var downLevels = [],
                downOffsets = [],
                levelHeight = ig.game.levels[levelIdx].height;
            for (var i = levelIdx; --i >= 0;)
                if (ig.game.levels[i].navigation) {
                    downLevels.push(ig.game.levels[i].navigation);
                    downOffsets.push((levelHeight - ig.game.levels[i].height) / this.tilesize);
                }
            var upLevels = [],
                upOffsets = [];
            for (i = levelIdx; ++i < ig.game.maxLevel;)
                if (ig.game.levels[i].navigation) {
                    upLevels.push(ig.game.levels[i].navigation);
                    upOffsets.push((levelHeight - ig.game.levels[i].height) / this.tilesize);
                }
            for (i = airNodes.length = 0; i < this.nodes.length; ++i) {
                var node = this.nodes[i];
                if (node && !node.airNode && !node.airConnected) {
                    node.airConnected = true;
                    downLevels.length && connectLevels(this, node, node.edges.down, downLevels, downOffsets, CONNECTION_TYPE.LOWER_LEVEL, CONNECTION_TYPE.UPPER_FLY, true);
                    if (upLevels.length) {
                        connectLevels(this, node, node.edges.up, upLevels, upOffsets, CONNECTION_TYPE.UPPER_LEVEL);
                        connectLevels(this, node, node.edges.upStairs, upLevels, upOffsets, CONNECTION_TYPE.UPPER_STAIRS, CONNECTION_TYPE.LOWER_STAIRS);
                    }
                    // Air nodes bridge jump connections between the ground nodes around them.
                    for (var k = 0; k < node.neighbours.length; ++k) {
                        var neighbour = node.neighbours[k],
                            airNode = neighbour.node;
                        if (airNode.airNode && neighbour.shared.type == CONNECTION_TYPE.SAME_LEVEL) {
                            if (!airNode.airConnected) {
                                airNode.airConnected = true;
                                downLevels.length && connectLevels(this, airNode, airNode.edges.down, downLevels, downOffsets, CONNECTION_TYPE.LOWER_LEVEL);
                            }
                            for (var otherIdx = 0; otherIdx < airNode.neighbours.length; ++otherIdx) {
                                var other = airNode.neighbours[otherIdx],
                                    otherType = other.shared.type;
                                if (!(otherType == CONNECTION_TYPE.UPPER_FLY || otherType == CONNECTION_TYPE.UPPER_LEVEL) &&
                                    other.node != node && !other.node.airNode) {
                                    // Reuse an existing SAME_LEVEL_JUMP connection if there is one.
                                    var existing = null;
                                    for (var z = node.neighbours.length; z--;)
                                        if (node.neighbours[z].node == other.node) {
                                            existing = node.neighbours[z];
                                            break;
                                        }
                                    if (!(existing && existing.shared.type != CONNECTION_TYPE.SAME_LEVEL_JUMP)) {
                                        // Pick the edge pair with the longest shared span, tie-broken by distance.
                                        var bestDist = void 0,
                                            bestLen = void 0,
                                            bestEdge = void 0,
                                            bestDestEdge = void 0;
                                        for (var t = 0; t < neighbour.shared.edges.length; ++t) {
                                            for (var q = 0; q < other.shared.edges.length; ++q) {
                                                var edgeLen = Vec2.distance(other.shared.edges[q].min, other.shared.edges[q].max),
                                                    minLen = Math.min(edgeLen, Vec2.distance(neighbour.shared.edges[t].min, neighbour.shared.edges[t].max)),
                                                    lineDist = Line2.distanceLineToLine(neighbour.shared.edges[t].min, neighbour.shared.edges[t].max, other.shared.edges[q].min, other.shared.edges[q].max);
                                                if (bestDist == void 0 || minLen > bestLen || minLen == bestLen && lineDist < bestDist) {
                                                    bestDist = lineDist;
                                                    bestLen = minLen;
                                                    bestEdge = neighbour.shared.edges[t];
                                                    bestDestEdge = other.shared.edges[q];
                                                }
                                            }
                                        }
                                        var jumpDist = bestDist * this.tilesize;
                                        if (existing) {
                                            if (existing.shared.jumpInfo.jumpDist > jumpDist) {
                                                existing.shared.edges = [bestEdge];
                                                existing.shared.jumpInfo.jumpDist = jumpDist;
                                            }
                                        } else {
                                            var jumpConnect = new ig.PathNodeConnect(CONNECTION_TYPE.SAME_LEVEL_JUMP);
                                            jumpConnect.edges.push(bestEdge);
                                            jumpConnect.jumpInfo = { jumpDist: jumpDist, destEdge: bestDestEdge };
                                            node.neighbours.push({ node: other.node, shared: jumpConnect });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    airNodes.push(node);
                    // Compute waypoints and the max edge length for every connection.
                    for (var c = node.neighbours.length; c--;) {
                        var shared = node.neighbours[c].shared,
                            waypointMin = shared.waypointMin,
                            waypointMax = shared.waypointMax,
                            edgeList = shared.jumpInfo ? [shared.jumpInfo.destEdge] : shared.edges,
                            maxLen = 0,
                            first = true;
                        for (var n = 0; n < edgeList.length; ++n) {
                            maxLen = Math.max(maxLen, Vec2.distance(edgeList[n].min, edgeList[n].max) * this.tilesize);
                            if (!edgeList[n].block[0] || !edgeList[n].block[1]) {
                                maxLen = Math.max(maxLen, 64);
                            }
                            if (first) {
                                first = false;
                                Vec2.assign(waypointMin, edgeList[n].min);
                                Vec2.assign(waypointMax, edgeList[n].max);
                            } else {
                                Vec2.min(waypointMin, edgeList[n].min);
                                Vec2.max(waypointMax, edgeList[n].max);
                            }
                        }
                        Vec2.mulF(waypointMin, this.tilesize);
                        Vec2.mulF(waypointMax, this.tilesize);
                        shared.maxEdgeLength = maxLen;
                        if (shared.reverse) {
                            shared.reverse.maxEdgeLength = maxLen;
                            Vec2.assign(shared.reverse.waypointMin, waypointMin);
                            Vec2.assign(shared.reverse.waypointMax, waypointMax);
                        }
                    }
                }
            }
        },

        /** Debug-render the whole graph. */
        draw: function (levelHeight) {
            ig.system.context.font = "bold 8px Arial, sans-serif";
            ig.system.context.globalAlpha = 1;
            ig.system.context.save();
            for (var i = 0; i < this.nodes.length; ++i) {
                var node = this.nodes[i];
                if (node) {
                    var color = nodeColors[node.id % 8];
                    for (var n = 0; n < node.neighbours.length; ++n) {
                        if (!node.neighbours[n].node.airNode) {
                            var edges = node.neighbours[n].shared.edges;
                            for (var e = 0; e < edges.length; ++e) {
                                drawEdge(color, edges[e], node, levelHeight, this.tilesize, 1, false);
                            }
                            var mid = Vec2.lerp(node.neighbours[n].shared.waypointMin, node.neighbours[n].shared.waypointMax, 0.5, scratchVec2c),
                                arrowEnd = Vec2.lerp(mid, node.center, 0.75, scratchVec2d);
                            ig.Debug.drawLine(color, mid.x, mid.y, arrowEnd.x, arrowEnd.y - levelHeight * 0.75, 1);
                        }
                    }
                    for (var b = 0; b < node.edges.block.length; ++b) {
                        drawEdge("red", node.edges.block[b], node, levelHeight, this.tilesize, -2, false, 2);
                    }
                    for (b = 0; b < node.edges.airBlock.length; ++b) {
                        drawEdge("blue", node.edges.airBlock[b], node, levelHeight, this.tilesize, -2, false, 2);
                    }
                    for (b = 0; b < node.edges.down.length; ++b) {
                        drawEdge("white", node.edges.down[b], node, levelHeight, this.tilesize, -2, false, 2);
                    }
                    for (b = 0; b < node.edges.up.length; ++b) {
                        drawEdge("white", node.edges.up[b], node, levelHeight, this.tilesize, -2, false, 2);
                    }
                    for (b = 0; b < node.edges.upStairs.length; ++b) {
                        drawEdge("yellow", node.edges.upStairs[b], node, levelHeight, this.tilesize, -2, false, 2);
                    }
                    ig.Debug.fillRect(node.airNode ? "white" : "black", node.center.x - 8, node.center.y - levelHeight - 4, 12, 7);
                    ig.Debug.drawText(i + 1 < 10 ? "0" + (i + 1) : i + 1, color, node.center.x - 6, node.center.y - levelHeight + 2);
                }
            }
            ig.system.context.restore();
        },

        _getGridValue: function (x, y, mask) {
            return this.getGridTile(x, y) >> mask.bitOffset & mask.map;
        },

        _setGridValue: function (x, y, mask, value) {
            var bits = (value & mask.map) << mask.bitOffset,
                tile = this.getGridTile(x, y);
            this.setGridTile(x, y, tile & ~(mask.map << mask.bitOffset) | bits);
        },

        _setGridFlag: function (x, y, mask, value) {
            var bits = value << mask.bitOffset,
                tile = this.getGridTile(x, y);
            this.setGridTile(x, y, tile | bits);
        },

        _clearGridFlag: function (x, y, mask, value) {
            var bits = value << mask.bitOffset,
                tile = this.getGridTile(x, y);
            this.setGridTile(x, y, tile & ~bits);
        },

        getEntityFlagValue: function (x, y, mask) {
            return this._getGridValue(x, y, mask);
        },

        setEntityFlagValue: function (x, y, mask, value) {
            this._setGridValue(x, y, mask, value);
        },

        increaseEntityFlagValue: function (x, y, mask) {
            var value = this.getEntityFlagValue(x, y, mask);
            return this.setEntityFlagValue(x, y, mask, value + 1);
        },

        decreaseEntityFlagValue: function (x, y, mask) {
            var value = this.getEntityFlagValue(x, y, mask);
            this.setEntityFlagValue(x, y, mask, value - 1);
        },

        getGridAreaFlag: function (x, y) {
            return this._getGridValue(x, y, areaFlagMask);
        },

        getGridForceGround: function (x, y) {
            return this._getGridValue(x, y, forceGroundMask);
        },

        getGridNode: function (x, y) {
            var id = this.getGridNodeId(x, y);
            return id && this.nodes[id - 1];
        },

        getGridNodeId: function (x, y) {
            return this._getGridValue(x, y, nodeIdMask);
        },

        setGridNodeId: function (x, y, id) {
            return this._setGridValue(x, y, nodeIdMask, id);
        },

        getGridBuildFlags: function (x, y) {
            return this._getGridValue(x, y, buildFlagsMask);
        },

        setGridBuildFlag: function (x, y, flag) {
            return this._setGridFlag(x, y, buildFlagsMask, flag);
        },

        clearGridBuildFlags: function (x, y) {
            return this._setGridValue(x, y, buildFlagsMask, 0);
        },

        /** Node covering the world position (x, y). */
        getNode: function (x, y) {
            x = Math.floor(x / this.tilesize);
            y = Math.floor(y / this.tilesize);
            return this.getGridNode(x, y);
        }
    });

    ig.MAP.Navigation.levelKey = "navigation";

    var HOLE_FLAG = 256,
        areaFlags = {
            JUMP: 9,
            JUMP_N: 10,
            JUMP_E: 11,
            JUMP_S: 12,
            JUMP_W: 13,
            STAIRS: 14,
            STAIRS_N: 15,
            STAIRS_E: 16,
            STAIRS_S: 17,
            STAIRS_W: 18,
            FENCE: 19
        },
        minSpecialAreaFlag = areaFlags.JUMP,
        maxSpecialAreaFlag = areaFlags.FENCE;

    /**
     * One contiguous walkable region of the nav map. The constructor
     * flood-fills from the seed cell, records edges to neighbouring nodes and
     * classifies them (block / airBlock / up / upStairs / down / level edges).
     */
    ig.PathNode = ig.Class.extend({
        id: 0,
        height: 0,
        min: Vec2.create(),
        max: Vec2.create(),
        center: Vec2.create(),
        neighbours: [],
        airNeighbours: [],
        airNode: false,
        airConnected: false,
        edges: {
            north: [],
            east: [],
            south: [],
            west: [],
            down: [],
            up: [],
            upStairs: [],
            block: [],
            airBlock: []
        },
        tmpSearchId: 0,
        tmpCameFromNode: null,
        tmpCameFromPos: Vec2.create(),
        tmpCameFromNeighbour: null,
        tmpClosed: false,
        tmpGScore: 0,
        tmpFScore: 0,

        init: function (id, navMap, collisionMap, gridX, gridY, zHeight) {
            this.id = id;
            this.height = zHeight;
            Vec2.assignC(this.min, gridX * navMap.tilesize, gridY * navMap.tilesize + zHeight);
            Vec2.assignC(this.max, (gridX + 1) * navMap.tilesize, (gridY + 1) * navMap.tilesize + zHeight);
            this.airNode = !navMap.getGridForceGround(gridX, gridY) &&
                !navMap.getEntityFlagValue(gridX, gridY, ig.NAV_ENTITY_FLAG.GROUND) &&
                collisionMap && collisionMap.isGridHole(gridX, gridY);
            var x = gridX;
            expandStack.length = 0;
            navMap.setGridNodeId(x, gridY, this.id);
            for (expandStack.push({ x: x, y: gridY }); expandStack.length > 0;) {
                gridY = expandStack.pop();
                x = gridY.x;
                gridY = gridY.y;
                Vec2.minC(this.min, x * navMap.tilesize, gridY * navMap.tilesize + zHeight);
                Vec2.maxC(this.max, (x + 1) * navMap.tilesize, (gridY + 1) * navMap.tilesize + zHeight);
                var cellValue = getWalkableValue(navMap, collisionMap, x, gridY);
                if (!cellValue) {
                    throw Error("Tried to expand to field with 0 source value");
                }
                for (var dirIdx = 0; dirIdx < DIRECTION_TABLE.length; ++dirIdx) {
                    var dir = DIRECTION_TABLE[dirIdx];
                    if (!(navMap.getGridBuildFlags(x, gridY) & dir.flag)) {
                        var nx = x + dir.x,
                            ny = gridY + dir.y,
                            neighbourValue = getWalkableValue(navMap, collisionMap, nx, ny);
                        if (cellValue == neighbourValue) {
                            navMap.setGridBuildFlag(x, gridY, dir.flag);
                            if (!navMap.getGridNodeId(nx, ny)) {
                                navMap.setGridNodeId(nx, ny, this.id);
                                expandStack.push({ x: nx, y: ny });
                            }
                        } else {
                            var map = navMap,
                                collision = collisionMap,
                                cx = x,
                                cy = gridY,
                                srcValue = cellValue,
                                dstValue = neighbourValue,
                                otherId = map.getGridNodeId(cx + dir.x, cy + dir.y),
                                isHole = dstValue & HOLE_FLAG;
                            if (otherId) {
                                // Attach to the neighbouring node's existing edge.
                                otherNodeSearch: {
                                    for (var otherNode = map.nodes[otherId - 1],
                                            edgeX = cx + (dir.x > 0 ? 1 : 0) + (dir.y ? 0.5 : 0),
                                            edgeY = cy + (dir.y > 0 ? 1 : 0) + (dir.x ? 0.5 : 0),
                                            srcEdges = otherNode.edges[dir.edgeSrc], edgeIdx = srcEdges.length; edgeIdx--;) {
                                        var edge = srcEdges[edgeIdx];
                                        if (edgeY >= edge.min.y && edgeY <= edge.max.y && edgeX >= edge.min.x && edgeX <= edge.max.x) {
                                            isHole && !this.airNode && this.edges.down.push(edge);
                                            this.edges[dir.edgeDest].push(edge);
                                            if (dir.x) {
                                                for (var flagY = edge.min.y; flagY < edge.max.y; ++flagY) {
                                                    map.setGridBuildFlag(cx, flagY, dir.flag);
                                                }
                                            } else {
                                                for (var flagX = edge.min.x; flagX < edge.max.x; ++flagX) {
                                                    map.setGridBuildFlag(flagX, cy, dir.flag);
                                                }
                                            }
                                            for (var nn = this.neighbours.length; nn--;)
                                                if (this.neighbours[nn].node == otherNode) {
                                                    this.neighbours[nn].shared.edges.push(edge);
                                                    break otherNodeSearch;
                                                }
                                            var connect = new ig.PathNodeConnect(CONNECTION_TYPE.SAME_LEVEL);
                                            connect.edges.push(edge);
                                            this.neighbours.push({ node: otherNode, shared: connect });
                                            otherNode.neighbours.push({ node: this, shared: connect });
                                            break otherNodeSearch;
                                        }
                                    }
                                    throw Error("Didn't find any edge when something should have been found");
                                }
                            } else {
                                // Grow a new edge along the boundary between the two values.
                                var edgeX = cx,
                                    edgeY = cy;
                                for (; getWalkableValue(map, collision, edgeX, edgeY) == srcValue &&
                                    getWalkableValue(map, collision, edgeX + dir.x, edgeY + dir.y) == dstValue;) {
                                    map.setGridBuildFlag(edgeX, edgeY, dir.flag);
                                    edgeX = edgeX + dir.y;
                                    edgeY = edgeY + dir.x;
                                }
                                edgeX = edgeX - dir.y;
                                edgeY = edgeY - dir.x;
                                var backX = cx - dir.y,
                                    backY = cy - dir.x;
                                for (; getWalkableValue(map, collision, backX, backY) == srcValue &&
                                    getWalkableValue(map, collision, backX + dir.x, backY + dir.y) == dstValue;) {
                                    map.setGridBuildFlag(backX, backY, dir.flag);
                                    backX = backX - dir.y;
                                    backY = backY - dir.x;
                                }
                                backX = backX + dir.y;
                                backY = backY + dir.x;
                                var minX = Math.min(edgeX, backX) + (dir.x > 0 ? 1 : 0),
                                    minY = Math.min(edgeY, backY) + (dir.y > 0 ? 1 : 0),
                                    maxX = Math.max(edgeX, backX) + (dir.x > 0 ? 1 : 0) + (dir.y ? 1 : 0),
                                    maxY = Math.max(edgeY, backY) + (dir.y > 0 ? 1 : 0) + (dir.x ? 1 : 0),
                                    edgeRect = {
                                        min: { x: minX, y: minY },
                                        max: { x: maxX, y: maxY }
                                    };
                                markBlockedEdges(edgeRect, map, collision);
                                isHole && this.edges.down.push(edgeRect);
                                var areaValue = dstValue % HOLE_FLAG;
                                if (areaValue == areaFlags.JUMP || areaValue == dir.upValue) {
                                    this.airNode || this.edges.up.push(edgeRect);
                                } else if (areaValue == areaFlags.STAIRS || areaValue == dir.stairValue) {
                                    this.airNode || this.edges.upStairs.push(edgeRect);
                                } else if (!areaValue || areaValue >= minSpecialAreaFlag && areaValue <= maxSpecialAreaFlag) {
                                    isHole && !this.airNode ? this.edges.airBlock.push(edgeRect) : this.edges.block.push(edgeRect);
                                } else {
                                    areaValue && this.edges[dir.edgeDest].push(edgeRect);
                                }
                            }
                        }
                    }
                }
            }
            Vec2.lerp(this.min, this.max, 0.5, this.center);
        },

        /** Detach the node from all neighbours and clear its grid cells. */
        erase: function (navMap, x, y, rect) {
            for (var i = this.neighbours.length; i--;) {
                removeNeighbour(this.neighbours[i].node, this);
            }
            for (i = this.airNeighbours.length; i--;) {
                removeNeighbour(this.airNeighbours[i].node, this);
            }
            eraseGridNode(navMap, this, x, y, rect);
        },

        isClosed: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpClosed;
        },

        setClosed: function (searchId, closed) {
            ensureSearchData(this, searchId);
            this.tmpClosed = closed;
        },

        getCameFromNode: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpCameFromNode;
        },

        getCameFromNeighbour: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpCameFromNeighbour;
        },

        getCameFromPos: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpCameFromPos;
        },

        setCameFrom: function (searchId, fromNode, fromNeighbour, fromPos) {
            ensureSearchData(this, searchId);
            this.tmpCameFromNode = fromNode;
            this.tmpCameFromNeighbour = fromNeighbour;
            Vec2.assign(this.tmpCameFromPos, fromPos);
        },

        getGScore: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpGScore;
        },

        setGScore: function (searchId, gScore) {
            ensureSearchData(this, searchId);
            this.tmpGScore = gScore;
        },

        getFScore: function (searchId) {
            ensureSearchData(this, searchId);
            return this.tmpFScore;
        },

        setFScore: function (searchId, fScore) {
            ensureSearchData(this, searchId);
            this.tmpFScore = fScore;
        },

        hasGScore: function () {
            return this.getGScore() != -1;
        }
    });

    /** A connection between two `ig.PathNode`s, shared by both directions. */
    ig.PathNodeConnect = ig.Class.extend({
        edges: [],
        waypointMin: Vec2.create(),
        waypointMax: Vec2.create(),
        maxEdgeLength: 0,
        type: 0,
        jumpInfo: null,
        reverse: null,
        externalData: {},
        searchData: {
            idx: 0,
            pos: Vec2.create(),
            fromEdge: null,
            fromNode: null,
            toNode: null,
            gScore: -1,
            fScore: -1,
            closed: false
        },

        init: function (type) {
            this.type = type;
        },

        getSearchData: function (searchId) {
            if (this.searchData.idx != searchId) {
                this.searchData.idx = searchId;
                Vec2.assignC(this.searchData.pos, 0, 0);
                this.searchData.fromNode = null;
                this.searchData.toNode = null;
                this.searchData.fromEdge = null;
                this.searchData.gScore = -1;
                this.searchData.fScore = -1;
                this.searchData.closed = false;
            }
            return this.searchData;
        },

        setExternalData: function (key, value) {
            this.externalData[key] = value;
            ig.navigation.clearCachedFailures();
        }
    });

    /** The four walk directions: step, build flag, edge slots and jump/stair values. */
    var DIRECTION_TABLE = [
        { x: 0, y: -1, flag: 1, edgeDest: "north", edgeSrc: "south", upValue: areaFlags.JUMP_S, stairValue: areaFlags.STAIRS_S },
        { x: 1, y: 0, flag: 2, edgeDest: "east", edgeSrc: "west", upValue: areaFlags.JUMP_W, stairValue: areaFlags.STAIRS_W },
        { x: 0, y: 1, flag: 4, edgeDest: "south", edgeSrc: "north", upValue: areaFlags.JUMP_N, stairValue: areaFlags.STAIRS_N },
        { x: -1, y: 0, flag: 8, edgeDest: "west", edgeSrc: "east", upValue: areaFlags.JUMP_E, stairValue: areaFlags.STAIRS_E }
    ];

    var CONNECTION_TYPE = ig.NAV_CONNECTION_TYPE = {
        SAME_LEVEL: 0,
        LOWER_LEVEL: 1,
        UPPER_LEVEL: 2,
        LOWER_STAIRS: 3,
        UPPER_STAIRS: 4,
        UPPER_FLY: 5,
        SAME_LEVEL_JUMP: 6
    };
    ig.NAV_CONNECTION_TYPE = CONNECTION_TYPE;

    /** Flood-fill stack used while expanding a node's region. */
    var expandStack = [];
    Vec2.create();
});
ig.baked = !0;
