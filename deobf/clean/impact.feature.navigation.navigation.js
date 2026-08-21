/**
 * impact.feature.navigation.navigation
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.navigation.navigation")`.
 *
 * The navigation / pathfinding subsystem:
 *   - `ig.Navigation` (`ig.navigation`) — the game add-on that queries the nav
 *     map (reachability, free positions, close/dodge positions) and runs the
 *     A* search (`findPath`).
 *   - `ig.NavBlocker` — embeds an entity as a temporary obstacle in the nav map.
 *   - `ig.NavPath` — a path finder for one searcher entity: computes a path to
 *     an entity or point and steers the searcher along it each frame, dodging
 *     other entities and retrying when blocked.
 *   - `ig.NavExternalBlockers` — global registry of custom connection blockers.
 *
 * Module helpers (bottom of the defines block):
 *   `getNavMapForLevel`, `getNodeAtPos`, `getNodeForArea`, `getEntityNode`,
 *   `findGroundNode`, `embedNavBlocker`, `isNavLineClear`, `isNodeReached`,
 *   `getTargetNode`, `findPath`, `offsetPosFromEdge` — plus scratch vectors
 *   shared by the hot paths.
 */
ig.module("impact.feature.navigation.navigation")
    .requires("impact.base.game")
    .defines(function () {

    /**
     * Raise/lower the nav-map flags for every tile an entity's AABB covers,
     * across all levels whose nav map it touches. Returns true when at least
     * one level was modified.
     * @param {number} z - bottom of the entity (world z)
     * @param {number} zMax - top of the entity
     * @param {Vec3} pos - entity position
     * @param {Vec3} size - entity size
     * @param {number} flagOp - r.INCREASE / r.DECREASE
     * @param {boolean} noTopFlag - use the GROUND flag instead of BLOCK
     */
    function embedNavBlocker(z, zMax, pos, size, flagOp, noTopFlag) {
        var changed = false;
        for (var levelIdx = ig.game.getLevelIdx(z + 4); levelIdx >= 0; --levelIdx) {
            var level = ig.game.levels[levelIdx];
            if (level && level.navigation && !(level.height + 16 < z)) {
                var flag = Math.abs(level.height - z) <= 4 ?
                    ig.NAV_ENTITY_FLAG.GROUND :
                    ig.NAV_ENTITY_FLAG.BLOCK;
                if (!(noTopFlag && flag == ig.NAV_ENTITY_FLAG.GROUND)) {
                    var navMap = level.navigation,
                        minCol = Math.floor(pos.x / navMap.tilesize),
                        maxCol = Math.floor((pos.x + size.x - 1) / navMap.tilesize),
                        minRow = Math.floor((pos.y - level.height) / navMap.tilesize),
                        maxRow = Math.floor((pos.y + size.y - level.height - 1) / navMap.tilesize);
                    for (var row = minRow; row <= maxRow; row++) {
                        for (var col = minCol; col <= maxCol; col++) {
                            switch (flagOp) {
                                case flagOps.INCREASE:
                                    navMap.increaseEntityFlagValue(col, row, flag);
                                    break;
                                case flagOps.DECREASE:
                                    navMap.decreaseEntityFlagValue(col, row, flag);
                            }
                        }
                    }
                    navMap.reparse(levelIdx, minCol, maxCol, minRow, maxRow);
                    changed = true;
                }
            }
        }
        return changed;
    }

    /** The nav-map node at `pos` on the level `z` falls into (or `pos.z`). */
    function getNodeAtPos(pos, z) {
        var levelIdx = ig.game.getLevelIdx((z !== void 0 ? z : pos.z) || 0),
            navMap = (levelIdx = getNavMapForLevel(levelIdx)) && levelIdx.zHeight;
        return levelIdx && levelIdx.getNode(pos.x, pos.y - navMap);
    }

    /**
     * The node covering the `size`×`size` tile area around `pos` on level `z`.
     * All covered tiles must resolve to the same (non-air) node. When
     * `checkAirNodes` is set, walks down levels to find any node.
     */
    function getNodeForArea(pos, z, size, checkAirNodes) {
        var tilesize = ig.navigation.tilesize,
            half = (size - 1) / 2,
            firstNode = null;
        for (var row = 0; row < size; ++row) {
            for (var col = 0; col < size; ++col) {
                var nodePos = Vec2.assign(scratchVec3d1, pos);
                nodePos.z = z !== void 0 ? z : pos.z;
                nodePos.x = (Math.floor(nodePos.x / tilesize - half + col) + 0.5) * tilesize;
                nodePos.y = (Math.floor(nodePos.y / tilesize - half + row) + 0.5) * tilesize;
                var node;
                if (checkAirNodes) {
                    found: {
                        for (var levelIdx = ig.game.getLevelIdx(nodePos.z || 0); levelIdx >= 0;) {
                            var navMap = getNavMapForLevel(levelIdx),
                                zHeight = navMap && navMap.zHeight;
                            if (navMap = navMap && navMap.getNode(nodePos.x, nodePos.y - zHeight)) {
                                nodePos = navMap;
                                break found;
                            }
                            levelIdx--;
                        }
                        nodePos = null;
                    }
                } else {
                    nodePos = getNodeAtPos(nodePos);
                }
                if (!nodePos || nodePos.airNode || firstNode && nodePos.height != firstNode.height) return null;
                firstNode = nodePos;
            }
        }
        pos.x = (Math.floor(pos.x / tilesize - half) + size / 2) * tilesize;
        pos.y = (Math.floor(pos.y / tilesize - half) + size / 2) * tilesize;
        return firstNode;
    }

    /** The node the entity is currently standing on (null when off the nav map). */
    function getEntityNode(entity) {
        var z = entity.jumping ? entity.coll.pos.z : entity.coll.baseZPos,
            z = z + 8,
            levelIdx = ig.game.getLevelIdx(z),
            navMap = getNavMapForLevel(levelIdx);
        if (!navMap) {
            levelIdx = ig.game.getLevelIdx(z + 16);
            navMap = getNavMapForLevel(levelIdx);
            if (!navMap) return null;
        }
        entity.getCenter(searcherCenterVec);
        z = navMap.zHeight;
        var node = findGroundNode(entity, searcherCenterVec, navMap, z);
        if (!node) {
            var nextLevelHeight = ig.game.levels[levelIdx + 1] && ig.game.levels[levelIdx + 1].height;
            if (nextLevelHeight && nextLevelHeight - entity.coll.pos.z < entity.coll.pos.z - z) {
                levelIdx = levelIdx + 1;
                navMap = getNavMapForLevel(levelIdx);
                if (!navMap) return null;
                z = ig.game.levels[levelIdx].height;
                node = findGroundNode(entity, searcherCenterVec, navMap, z);
            }
        }
        return node;
    }

    /**
     * Find a non-air node under the entity by checking its centre, corners and
     * edges (plus a small overhang) against the nav map.
     */
    function findGroundNode(entity, center, navMap, zHeight) {
        var coll = entity.coll,
            node;
        if ((node = navMap.getNode(center.x, center.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x, coll.pos.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x + coll.size.x, coll.pos.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x, coll.pos.y + coll.size.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x + coll.size.x, coll.pos.y + coll.size.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x - 8, center.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(coll.pos.x + coll.size.x + 8, center.y - zHeight)) && !node.airNode ||
            (node = navMap.getNode(center.x, coll.pos.y - 8 - zHeight)) && !node.airNode) return node;
        return node = navMap.getNode(center.x, coll.pos.y + coll.size.y + 8 - zHeight);
    }

    /** The nav map of the highest level at or below `levelIdx` that has one. */
    function getNavMapForLevel(levelIdx) {
        for (; ig.game.levels[levelIdx] && !ig.game.levels[levelIdx].navigation;) levelIdx--;
        return ig.game.levels[levelIdx] && ig.game.levels[levelIdx].navigation;
    }

    /**
     * True when the segment from `fromPos` to `toPos` between two same-height,
     * non-air nodes is clear (optionally verified with a physics trace).
     */
    function isNavLineClear(fromNode, toNode, fromPos, toPos, checkPhysics, clearance) {
        if (!fromNode || !toNode) return false;
        if (fromNode == toNode) return true;
        if (fromNode.height != toNode.height || fromNode.airNode || toNode.airNode) return false;
        var tilesize = ig.CONFIG.DEFAULT_TILE_SIZE;
        Vec2.assign(losStartVec, fromPos);
        losStartVec.y = losStartVec.y - fromNode.height;
        Vec2.mulF(losStartVec, 1 / tilesize);
        Vec2.assign(losEndVec, toPos);
        losEndVec.y = losEndVec.y - fromNode.height;
        Vec2.mulF(losEndVec, 1 / tilesize);
        clearance = (clearance || 4) / tilesize;
        Vec2.assign(losIterVec, losStartVec);
        for (var current = fromNode, visited = []; current && current != toNode;) {
            var nextNode;
            found: {
                nextNode = current;
                for (var i = current.neighbours.length, fallback = null; i--;) {
                    var connection = current.neighbours[i];
                    if (visited.indexOf(connection.node) == -1 &&
                        !(connection.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL ||
                            connection.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_FLY ||
                            connection.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_STAIRS)) {
                        for (var edges = connection.shared.edges, j = 0; j < edges.length; ++j) {
                            var edge = edges[j];
                            if (Line2.intersectMinRange(edge.min, edge.max, losStartVec, losEndVec, clearance, losIterVec, edge.block)) {
                                if (connection.node.airNode || connection.shared.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL) {
                                    fallback = connection;
                                } else {
                                    nextNode = connection;
                                    break found;
                                }
                            }
                        }
                    }
                }
                nextNode = fallback;
            }
            if (!nextNode || nextNode.airNode || nextNode.shared.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL) {
                if (!checkPhysics) return false;
                Vec2.assign(physicsPosVec, losIterVec);
                Vec2.mulF(physicsPosVec, tilesize);
                physicsPosVec.z = fromNode.height;
                physicsPosVec.y = physicsPosVec.y + fromNode.height;
                ig.game.physics.initTraceResult(traceResult);
                return ig.game.trace(traceResult, physicsPosVec.x - 4, physicsPosVec.y - 4, physicsPosVec.z + 12, toPos.x - physicsPosVec.x, toPos.y - physicsPosVec.y, 8, 8, 8, ig.COLLTYPE.PROJECTILE) ? false : true;
            }
            visited.push(current);
            current = nextNode.node;
        }
        return current == toNode;
    }

    /**
     * True when the segment from `fromPos` to `toPos` crosses the edge between
     * `fromNode` and `toNode` (both on the same height). Used to detect that
     * the searcher has actually reached the target node.
     */
    function isNodeReached(fromNode, toNode, fromPos, toPos, clearance) {
        if (fromNode == toNode) return true;
        if (fromNode.height != toNode.height) return false;
        for (var clearance = clearance || 0, tilesize = ig.CONFIG.DEFAULT_TILE_SIZE,
                i = fromNode.neighbours.length; i--;) {
            var connection = fromNode.neighbours[i];
            if (connection.node == toNode) {
                var edges = connection.shared.edges;
                for (i = 0; i < edges.length; ++i) {
                    connection = edges[i];
                    Vec2.assign(losStartVec, connection.min);
                    Vec2.mulF(losStartVec, tilesize);
                    losStartVec.y = losStartVec.y + fromNode.height;
                    Vec2.assign(losEndVec, connection.max);
                    Vec2.mulF(losEndVec, tilesize);
                    losEndVec.y = losEndVec.y + fromNode.height;
                    if (Line2.intersectMinRange(losStartVec, losEndVec, fromPos, toPos, clearance, null, connection.block)) return true;
                }
                break;
            }
        }
        return false;
    }

    /**
     * Resolve the searcher's current target node when chasing `targetEntity`,
     * honouring the `posOffset` option (pick a node offset around the target
     * that is reachable and on the same height).
     */
    function getTargetNode(outPos, searcher, targetEntity, options) {
        outPos.z = targetEntity.coll.pos.z;
        targetEntity.getCenter(outPos);
        var node = getEntityNode(targetEntity);
        if (options.posOffset) {
            options = options.posOffset;
            var distVec = ig.CollTools.getDistVec2(searcher.coll, targetEntity.coll, offsetVec2);
            var candidatePos = Vec3.assign(scratchVec3d2, outPos);
            if (Math.abs(distVec.x) > Math.abs(distVec.y)) {
                candidatePos.y = candidatePos.y + options.x;
                candidatePos.x = candidatePos.x + (distVec.x > 0 ? options.y : -options.y);
            } else {
                candidatePos.x = candidatePos.x + options.x;
                candidatePos.y = candidatePos.y + (distVec.y > 0 ? options.y : -options.y);
            }
            var candidateNode = getNodeAtPos(candidatePos);
            if (candidateNode && !candidateNode.airNode &&
                (!node || node.height == candidateNode.height) &&
                isNavLineClear(node, candidateNode, outPos, candidatePos, false)) {
                Vec3.assign(outPos, candidatePos);
                node = candidateNode;
            }
        }
        return node;
    }

    /**
     * A* search over the nav map from `fromNode` to `toNode`.
     * Returns `{ nodes, distance, multiLevel, jumpCount }` or null when the
     * target is unreachable.
     */
    function findPath(searcher, fromNode, toNode, fromPos, toPos) {
        var searchId;
        searchId = pathSearchId = pathSearchId % 1E7 + 1;
        var openSet = [];
        if (!fromNode || fromNode.airNode || !toNode) return { nodes: [] };
        if (fromNode == toNode) {
            return {
                nodes: [{ node: fromNode, connection: null }]
            };
        }
        if (toNode.airNode) return null;
        var maxEntitySize = Math.max(searcher.coll.size.x, searcher.coll.size.y);
        do {
            var current = null,
                currentNode, currentPos, currentG;
            if (openSet.length == 0) {
                currentNode = fromNode;
                currentPos = fromPos;
                currentG = 0;
            } else {
                current = openSet.pop();
                var searchData = current.getSearchData(searchId);
                currentPos = searchData.pos;
                currentG = searchData.gScore;
                currentNode = searchData.toNode;
                searchData.closed = true;
            }
            if (currentNode == toNode) {
                var nodes = [{ node: toNode, connection: null }],
                    multiLevel = false,
                    jumpCount = 0,
                    goalConnection = current,
                    distance = goalConnection ? goalConnection.getSearchData(searchId).fScore : 0;
                for (var i = 0; currentNode != fromNode;) {
                    searchData = current.getSearchData(searchId);
                    multiLevel = multiLevel || currentNode.height != fromNode.height;
                    currentNode = searchData.fromNode;
                    current.jumpInfo && jumpCount++;
                    nodes.push({ node: currentNode, connection: current });
                    current = searchData.fromEdge;
                }
                return {
                    nodes: nodes,
                    distance: distance,
                    multiLevel: multiLevel,
                    jumpCount: jumpCount
                };
            }
            for (var neighbourIdx = currentNode.neighbours.length; neighbourIdx--;) {
                var connection = currentNode.neighbours[neighbourIdx],
                    neighbourNode = connection.node,
                    shared = connection.shared;
                if (!(current && shared == current)) {
                    var neighbourData = shared.getSearchData(searchId);
                    if (!neighbourNode.airNode &&
                        !(shared.type != ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && shared.maxEdgeLength < maxEntitySize) &&
                        (!(shared.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP ||
                                shared.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL) ||
                            searcher.jumpingEnabled)) {
                        if (!searcher.coll.groundConnect ||
                            !(searcher.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT &&
                                shared.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL)) {
                            if ((searcher.fly.height || shared.type != ig.NAV_CONNECTION_TYPE.UPPER_FLY) &&
                                !(shared.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && shared.jumpInfo.jumpDist > 1600) &&
                                !ig.NavExternalBlockers.check(shared, searcher)) {
                                var speedFactor = shared.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP ? 1.2 : 1,
                                    extraCost = 0;
                                shared.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL && (extraCost = extraCost + 100);
                                Line2.closestEntry(closestEntryVec1, shared.waypointMin, shared.waypointMax, currentNode.height, 1, currentPos, toPos, 0, 0);
                                var entryPos = closestEntryVec1,
                                    gScore = currentG + Vec2.distance(currentPos, entryPos) * speedFactor +
                                        (neighbourNode.height > currentNode.height ? neighbourNode.height - currentNode.height : 0) * 2 + extraCost,
                                    oldG = neighbourData.gScore;
                                if (!neighbourData.closed || !(gScore >= oldG || neighbourData.fromNode != currentNode)) {
                                    if (oldG == -1 || gScore < oldG) {
                                        oldG != -1 && openSet.erase(shared);
                                        neighbourData.fromNode = currentNode;
                                        neighbourData.toNode = neighbourNode;
                                        neighbourData.fromEdge = current;
                                        neighbourData.gScore = gScore;
                                        Vec2.assign(neighbourData.pos, entryPos);
                                        var fScore = gScore + Vec2.distance(entryPos, toPos);
                                        neighbourData.fScore = fScore;
                                        for (var insertIdx = openSet.length;
                                                insertIdx && openSet[insertIdx - 1].getSearchData(searchId).fScore < fScore;) {
                                            insertIdx--;
                                        }
                                        openSet.splice(insertIdx, 0, shared);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } while (openSet.length > 0);
        return null;
    }

    /**
     * Push `pos` away from the edge when it would be crossed: for a horizontal
     * edge adjust y, for a vertical edge adjust x, by the searcher's half-size
     * plus clearance in the given direction.
     */
    function offsetPosFromEdge(pos, nodeCenter, edge, node, tilesize, searcher, dir, clearance) {
        Line2.horizontal(edge.min, edge.max) ?
            pos.y = pos.y + (edge.min.y * tilesize + node.height > nodeCenter.y ?
                dir * (searcher.coll.size.y + clearance) :
                -dir * (searcher.coll.size.y + clearance)) :
            pos.x = pos.x + (edge.min.x * tilesize > nodeCenter.x ?
                dir * (searcher.coll.size.x + clearance) :
                -dir * (searcher.coll.size.x + clearance));
    }

    var centerAVec = Vec2.create(),
        centerBVec = Vec2.create(),
        scratchVec2d1 = Vec2.create(),
        scratchVec2d2 = Vec2.create(),
        scratchVec2d3 = Vec2.create();

    ig.NAV_DODGE_TYPE = {
        NEUTRAL: { deltas: [-1, -4, -1, -1, -4], start: 0 },
        PASSIVE: { deltas: [1, 1, 2, 1, 1, -3], start: 0 },
        GET_AWAY: { deltas: [-1, 2, -3, 4, -5, 6], start: 3 },
        AGGRESSIVE: { deltas: [-2, 3, -4, 5, -6, 7, -8, 9, -10], start: -2 }
    };

    ig.NAV_CLOSE_POINT_SEARCH = {
        RANDOM: function (dir) {
            Vec2.rotate(dir, Math.random() * Math.PI * 2);
        },
        BEHIND: function () {},
        FRONT: function (dir) {
            Vec2.flip(dir);
        },
        BEHIND_FACE: function (dir, entity) {
            if (entity) {
                Vec2.assign(dir, entity.face);
                Vec2.flip(dir);
            }
        },
        FRONT_FACE: function (dir, entity) {
            entity && Vec2.assign(dir, entity.face);
        }
    };

    ig.perf.navigationMarker = false;

    /** The navigation game add-on; owns the nav-map queries and path search. */
    ig.Navigation = ig.GameAddon.extend({
        tilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
        dodgeEntities: [],
        cachedFailure: {},
        mapVersion: 0,
        empty: true,
        influencers: [],

        init: function () {
            this.parent("Navigation");
        },

        /** True when `b` (a target entity) is within `distance` and line-of-sight. */
        isTargetReachable: function (searcher, target, distance, checkPhysics) {
            var fromPos = searcher.getCenter(centerAVec),
                toPos = target.getCenter(centerBVec);
            if (Vec2.distance(fromPos, toPos) > distance) return false;
            if (this.empty) return true;
            if (target.jumping) return false;
            var fromNode = getEntityNode(searcher),
                toNode = getEntityNode(target);
            return !fromNode || !toNode ? true : isNavLineClear(fromNode, toNode, fromPos, toPos, checkPhysics, 4);
        },

        isPathAvailable: function (searcher, target) {
            var fromPos = searcher.getCenter(centerAVec),
                toPos = target.getCenter(centerBVec),
                fromNode = getEntityNode(searcher),
                toNode = getEntityNode(target);
            return (fromPos = findPath(searcher, fromNode, toNode, fromPos, toPos)) && fromPos.nodes.length > 0 ? true : false;
        },

        isSearcherOnNode: function (searcher) {
            return !!getEntityNode(searcher);
        },

        isEntityReached: function (searcher, target) {
            var fromNode = getEntityNode(searcher),
                toNode = getEntityNode(target);
            return isNodeReached(fromNode, toNode, searcher.getCenter(), target.getCenter());
        },

        isPointReached: function (searcher, point) {
            var fromNode = getEntityNode(searcher),
                toNode = getNodeAtPos(point);
            return isNodeReached(fromNode, toNode, searcher.getCenter(), point, searcher.coll.size.x);
        },

        /** True when `pos` is reachable and not inside a blocked area. */
        isPositionFree: function (pos, targetSize, searcher, checkPhysics) {
            var node, posZ = 0;
            var fromPos = searcher.getCenter(centerAVec);
            node = getEntityNode(searcher);
            posZ = searcher.coll.baseZPos;
            targetSize = targetSize.coll.size;
            var toNode = getNodeAtPos(pos, posZ);
            return isNavLineClear(node, toNode, fromPos, pos, checkPhysics, 0) &&
                !ig.game.isAreaBlocked(pos.x - targetSize.x / 2, pos.y - targetSize.y / 2, posZ, targetSize.x, targetSize.y, targetSize.z, true) ? true : false;
        },

        /**
         * Search for a free position near `targetPos` reachable from `searcher`,
         * spiralling outward by one tile ring at a time (up to `maxRadius`).
         * Fills `out` on success.
         */
        getClosePosition: function (out, targetPos, size, searcher, fromPos, maxRadius, searchType, angle, searchFunc, checkPhysics) {
            var node, posZ = 0,
                searchType = searchType || 0.5,
                angle = angle || 0;
            if (fromPos) {
                var centerPos = Vec2.assign(centerAVec, fromPos);
                posZ = fromPos.z;
                fromPos = getNodeAtPos(centerPos, posZ);
            } else {
                centerPos = searcher.getCenter(centerAVec);
                fromPos = getEntityNode(searcher);
                posZ = searcher.coll.baseZPos;
            }
            for (var tilesize = ig.navigation.tilesize, ringStep = tilesize * 1.5; maxRadius >= 0;) {
                var dir = Vec2.sub(centerPos, targetPos, tempVec2d4);
                searchFunc && searchFunc(dir, searcher);
                Vec2.rotate(dir, angle * Math.PI * 2);
                Vec2.length(dir, maxRadius);
                for (var stepCount = Math.ceil(maxRadius * Math.PI * 2 * searchType / ringStep),
                        stepAngle = Math.PI * 2 * searchType / stepCount,
                        angleAccum = 1,
                        rotation = 0; stepCount--;) {
                    var candidate = Vec2.add(centerPos, dir, centerBVec);
                    candidate.x = (Math.floor(candidate.x / tilesize) + 0.5) * tilesize;
                    candidate.y = (Math.floor(candidate.y / tilesize) + 0.5) * tilesize;
                    var candidateNode = getNodeAtPos(candidate, posZ);
                    if (isNavLineClear(fromPos, candidateNode, centerPos, candidate, checkPhysics, 0)) {
                        if (ig.game.isAreaBlocked(candidate.x - size.x / 2, candidate.y - size.y / 2, posZ, size.x, size.y, size.z, true)) {
                            ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, posZ, 8, 8, "violet", 2);
                        } else {
                            ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, posZ, 8, 8, "blue", 2);
                            Vec3.assignC(out, candidate.x, candidate.y, posZ);
                            return true;
                        }
                    } else {
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, posZ, 8, 8, "red", 2);
                    }
                    rotation = rotation + stepAngle;
                    angleAccum = angleAccum * 1;
                    Vec2.rotate(dir, rotation * angleAccum);
                }
                maxRadius = maxRadius - ringStep;
            }
            Vec3.assignC(out, centerPos.x, centerPos.y, posZ);
            return false;
        },

        /**
         * Find a dodge position: pick a direction perpendicular to the threat's
         * velocity (towards the side the searcher is on) and step through the
         * dodge type's delta angles, snapping each candidate to the nav grid.
         */
        getDodgePosition: function (out, searcher, threat, distance, dodgeType) {
            var dodgeType = dodgeType || ig.NAV_DODGE_TYPE.NEUTRAL,
                posZ = searcher.coll.pos.z,
                gridSize = searcher.coll.size.x + 8,
                searcherPos = searcher.getCenter(centerAVec),
                threatPos = threat.getCenter(centerBVec),
                fromNode = getEntityNode(searcher),
                dir = Vec2.sub(searcherPos, threatPos, scratchVec2d2),
                threatVel = Vec2.assign(scratchVec2d3, threat.coll.vel);
            Vec2.isZero(threatVel) && Vec2.assign(threatVel, dir);
            var step = Math.PI * 2 / 12;
            Vec2.rotate90CCW(threatVel);
            if (Vec2.dot(dir, threatVel) < 0) {
                Vec2.flip(threatVel);
                step = -step;
            }
            dodgeType.start && Vec2.rotate(threatVel, step * dodgeType.start);
            var tilesize = ig.navigation.tilesize;
            gridSize = Math.ceil(Math.max(searcher.coll.size.x, searcher.coll.size.y) / tilesize);
            Vec2.length(threatVel, distance);
            var deltas = dodgeType.deltas;
            for (dodgeType = 0; dodgeType < deltas.length + 1; ++dodgeType) {
                var candidate = Vec2.add(dodgeType >= 6 ? threatPos : searcherPos, threatVel, scratchVec2d1);
                candidate.x = (Math.floor(candidate.x / tilesize) + 0.5) * tilesize;
                candidate.y = (Math.floor(candidate.y / tilesize) + 0.5) * tilesize;
                var node = getNodeForArea(candidate, posZ, gridSize);
                ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, posZ, 8, 8, "violet", 2);
                if (isNavLineClear(fromNode, node, searcherPos, candidate, false, searcher.coll.size.x + 8)) {
                    Vec3.assignC(out, candidate.x, candidate.y, posZ);
                    return true;
                }
                dodgeType < deltas.length && Vec2.rotate(threatVel, step * deltas[dodgeType]);
            }
            return false;
        },

        clearCachedFailures: function () {
            this.cachedFailure = {};
        },

        addCachedFailure: function (fromNode, toNode, searcher) {
            fromNode && toNode && (this.cachedFailure[this._getCacheKey(fromNode, toNode, searcher)] = true);
        },

        isCachedFailure: function (fromNode, toNode, searcher) {
            return !fromNode || !toNode ? false : this.cachedFailure[this._getCacheKey(fromNode, toNode, searcher)];
        },

        _getCacheKey: function (fromNode, toNode, searcher) {
            var key = fromNode.id + "|" + fromNode.height + ">" + toNode.id + "|" + toNode.height;
            var size = Math.max(searcher.coll.size.x, searcher.coll.size.y);
            return key = key + ("[" + size + "|" + searcher.jumpingEnabled + "|" + searcher.coll.groundConnect + "|" + !!searcher.fly.height + "]");
        },

        getNavPath: function (searcher) {
            return new ig.NavPath(searcher);
        },

        onLevelLoadStart: function () {
            this.influencers.length = 0;
        },

        /** Initialise every level's nav map and connect air nodes. */
        onLevelLoaded: function () {
            this.dodgeEntities = [];
            this.empty = true;
            for (var i in ig.game.levels) {
                var level = ig.game.levels[i];
                if (level.navigation) {
                    level.navigation.levelInit(i);
                    this.empty = false;
                }
            }
            this.connectAirNodes();
        },

        connectAirNodes: function () {
            for (var levelIdx = ig.game.maxLevel; levelIdx--;) {
                var level = ig.game.levels[levelIdx];
                level.navigation && level.navigation.connectAirNodes(levelIdx);
            }
            this.applyInfluencers();
            this.mapVersion++;
            this.clearCachedFailures();
        },

        getNavBlock: function (entity) {
            return new ig.NavBlocker(entity);
        },

        registerInfluencer: function (influencer) {
            this.influencers.indexOf(influencer) == -1 && this.influencers.push(influencer);
        },

        applyInfluencers: function () {
            for (var i = this.influencers.length; i--;) this.influencers[i].onNavMapInfluence();
        },

        /** The shared connection data between the nodes at `posA` and `posB`. */
        getNodeConnection: function (posA, posB, type) {
            var nodeA = getNodeAtPos(posA);
            if ((posB = getNodeAtPos(posB)) && posB.airNode) {
                for (var i = posB.neighbours.length; i--;) {
                    var connection = posB.neighbours[i];
                    if (connection.node != nodeA && !connection.node.airNode) {
                        posB = connection.node;
                        break;
                    }
                }
            }
            if (nodeA && posB) {
                for (i = nodeA.neighbours.length; i--;) {
                    connection = nodeA.neighbours[i];
                    if (!(type !== void 0 && connection.shared.type != type) && connection.node == posB) return connection.shared;
                }
            }
        }
    });

    ig.NAV_BLOCKER_TYPE = {
        REGULAR: 0,
        NO_BLOCK: 1,
        NO_TOP: 2
    };

    /** A temporary obstacle embedded into the nav map. */
    ig.NavBlocker = ig.Class.extend({
        entity: null,
        pos: Vec3.create(),
        size: Vec3.create(),
        blockType: 0,

        init: function (entity, blockType) {
            this.entity = entity;
            this.blockType = blockType || 0;
            this.embedInNavMap();
        },

        update: function (blockType) {
            this.removeFromNavMap();
            this.blockType = blockType || 0;
            this.embedInNavMap();
        },

        embedInNavMap: function () {
            var coll = this.entity.coll;
            Vec3.assign(this.pos, coll.pos);
            Vec3.assign(this.size, coll.size);
            this.blockType != ig.NAV_BLOCKER_TYPE.NO_BLOCK &&
                embedNavBlocker(this.pos.z, this.pos.z + this.size.z, this.pos, this.size, flagOps.INCREASE, this.blockType == ig.NAV_BLOCKER_TYPE.NO_TOP) &&
                ig.navigation.connectAirNodes();
        },

        removeFromNavMap: function () {
            this.blockType != ig.NAV_BLOCKER_TYPE.NO_BLOCK &&
                embedNavBlocker(this.pos.z, this.pos.z + this.size.z, this.pos, this.size, flagOps.DECREASE, this.blockType == ig.NAV_BLOCKER_TYPE.NO_TOP) &&
                ig.navigation.connectAirNodes();
        },

        remove: function () {
            this.removeFromNavMap();
            this.entity = null;
        }
    });

    /** Nav-flag operations used by `embedNavBlocker`. */
    var flagOps = {
        INCREASE: 0,
        DECREASE: 1,
        SET: 2
    };

    ig.addGameAddon(function () {
        return ig.navigation = new ig.Navigation();
    });

    var losStartVec = Vec2.create(),
        losEndVec = Vec2.create(),
        losIterVec = Vec2.create(),
        physicsPosVec = Vec3.create(),
        traceResult = {},
        offsetVec2 = Vec2.create(),
        scratchVec3d1 = Vec3.create(),
        tempVec2d4 = Vec2.create(),
        tempVec2d5 = Vec2.create();
    Vec2.create();
    var scratchVec3d2 = Vec3.create(),
        scratchVec3d3 = Vec3.create();
    Vec3.create();

    /** Path finder steering one searcher entity toward a target. */
    ig.NavPath = ig.Class.extend({
        mapVersion: 0,
        searcher: null,
        startRelativeVel: 0,
        targetEntity: null,
        targetPos: Vec3.create(),
        retargetPos: Vec3.create(),
        retargetNode: null,
        maxDistance: 0,
        precise: false,
        options: null,
        path: null,
        pathIdx: -1,
        pathLength: 0,
        nextNodeData: {
            startPos: Vec2.create(),
            endPos: Vec2.create(),
            jump: false,
            height: 0
        },
        overNodePass: false,
        pathComplete: false,
        triedNodePassChange: false,
        triedRandom: -1,
        doBackUp: false,
        triedBackUp: -1,
        avoidTarget: Vec2.create(),
        avoidTarget2: Vec2.create(),
        firstMovement: false,
        targetDir: Vec2.create(),
        targetDist: 0,
        failCount: 0,
        wrongNodeTimer: 0,
        lastSideWayDir: Vec2.create(),

        init: function (searcher) {
            this.searcher = searcher;
        },

        /** Follow `target` until within `maxDistance` (optionally precise). */
        toEntity: function (target, maxDistance, options, precise) {
            this.targetEntity = target;
            target.getCenter(this.targetPos);
            this.maxDistance = maxDistance || 0;
            this.options = options || {};
            this.precise = precise || false;
            this.firstMovement = !this.precise;
            this.startRelativeVel = this.searcher.coll.relativeVel;
            this.searcher.faceDirFixed = false;
            this.redoPath();
        },

        toPoint: function (point, maxDistance, precise) {
            this.targetEntity = null;
            Vec3.assign(this.targetPos, point);
            this.maxDistance = maxDistance || 0;
            this.precise = precise || false;
            this.startRelativeVel = this.searcher.coll.relativeVel;
            this.searcher.faceDirFixed = false;
            this.redoPath();
        },

        redoPathDeferred: function () {
            this.mapVersion = -1;
        },

        /** Move sideways around `target` at radius `radius` (±`range`). */
        sideways: function (target, targetRadius, range, throwing, keepDirection, minRadius, maxRadius, precise) {
            var targetNode = getEntityNode(target),
                searcherPos = this.searcher.getCenter(centerAVec),
                targetPos = target.getCenter(centerBVec),
                distance = Vec2.distance(searcherPos, targetPos);
            minRadius && distance < minRadius && (distance = minRadius);
            maxRadius && distance > maxRadius && (distance = maxRadius);
            this._moveCircle(targetNode, searcherPos, targetPos, distance, throwing, targetRadius - range, targetRadius + range, keepDirection, precise);
        },

        dodge: function (threat, distance, dodgeType) {
            ig.navigation.getDodgePosition(scratchVec3d2, this.searcher, threat, distance, dodgeType) ?
                this.toPoint(scratchVec3d2, 0, false) :
                this.runAway(threat, distance, false);
        },

        /**
         * Move toward `target` but stop at radius `f` around it; when `h` is
         * set, keep the target's node height.
         */
        moveRange: function (target, range, maxRange, targetRadius, keepHeight, shrinkStep) {
            var targetNode = getEntityNode(target);
            if (!targetNode) return false;
            var searcherPos = this.searcher.getCenter(centerAVec),
                targetPos = target.getCenter(centerBVec),
                distance = Vec2.distance(searcherPos, targetPos),
                targetZ = keepHeight ? targetNode.height : this.searcher.coll.pos.z,
                gridSize = ig.navigation.tilesize,
                gridSize = Math.ceil(Math.max(this.searcher.coll.size.x, this.searcher.coll.size.y) / gridSize),
                step = range;
            if (shrinkStep && Math.abs(distance - targetRadius) < range) {
                step = Math.abs(distance - targetRadius);
                step < maxRange && (step = maxRange);
            }
            do {
                var mode = 0,
                    angle = 0;
                if (distance + step <= targetRadius) {
                    angle = 0.5;
                } else if (distance - step < targetRadius) {
                    angle = Math.pow(step, 2) + Math.pow(distance, 2) - Math.pow(targetRadius, 2);
                    angle = Math.acos(angle / (2 * step * distance)) / Math.PI / 2;
                    mode = 1;
                }
                var dir = Vec2.sub(targetPos, searcherPos, tempVec2d4),
                    accum = 0,
                    stepAngle = 32 / (Math.PI * 2 * step),
                    sign = 1,
                    steps = Math.ceil(0.75 / stepAngle);
                if (Vec2.areClockwise(dir, this.lastSideWayDir)) {
                    angle = angle * -1;
                    sign = sign * -1;
                }
                for (; steps--;) {
                    dir = Vec2.sub(targetPos, searcherPos, tempVec2d4);
                    Vec2.length(dir, step);
                    Vec2.rotate(dir, angle * Math.PI * 2);
                    var candidate = Vec2.add(searcherPos, dir, scratchVec3d2);
                    candidate.z = targetZ;
                    var node = getNodeForArea(candidate, void 0, gridSize, true);
                    if (node && (!keepHeight || isNavLineClear(node, targetNode, candidate, targetPos, true))) {
                        candidate.z = node.height;
                        this.toPoint(candidate, this.searcher.coll.size.x / 2, false);
                        if (this.path) {
                            Vec2.assign(this.lastSideWayDir, candidate);
                            Vec2.sub(this.lastSideWayDir, searcherPos);
                            ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, "blue", 2);
                            return true;
                        }
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, "green", 2);
                    } else {
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, node ? "orange" : "red", 2);
                    }
                    if (mode) {
                        mode = mode === 1 ? 2 : 1;
                        angle = angle * -1;
                    }
                    if (mode < 2) {
                        do {
                            accum = accum + stepAngle;
                            sign = sign * -1;
                            angle = angle + accum * sign;
                        } while (mode && (angle < -stepAngle / 2 || angle > 0.5 + stepAngle / 2));
                    }
                }
                step = step > maxRange ? Math.max(maxRange, step - 32) : -1;
            } while (step >= maxRange);
            return false;
        },

        /** Back away from `threat` by repeatedly trying `distance`, shrinking. */
        runAway: function (threat, distance, precise) {
            for (var threatNode = getEntityNode(threat), searcherPos = this.searcher.getCenter(centerAVec), threatPos = threat.getCenter(centerBVec), radius = distance; radius > 0.5 * distance;) {
                if (this._moveCircle(threatNode, searcherPos, threatPos, radius, precise)) break;
                radius = radius - distance / 8;
            }
        },

        /** Run toward a point offset along `entity`'s facing direction. */
        runToFace: function (entity, angle, minDist, maxDist, checkPhysics) {
            var entityNode = getEntityNode(entity);
            this.searcher.getCenter(centerAVec);
            var entityPos = entity.getCenter(centerBVec),
                gridSize = ig.navigation.tilesize,
                gridSize = Math.ceil(Math.max(this.searcher.coll.size.x, this.searcher.coll.size.y) / gridSize),
                dir = Vec2.assign(tempVec2d4, entity.face);
            Vec2.rotate(dir, angle * Math.PI * 2);
            for (var dist = minDist; dist < maxDist;) {
                Vec2.length(dir, dist);
                var candidate = Vec2.add(entityPos, dir, scratchVec3d2);
                candidate.z = this.searcher.coll.pos.z;
                var node = getNodeForArea(candidate, void 0, gridSize, true);
                if (node && (!checkPhysics || isNavLineClear(node, entityNode, candidate, entityPos, true))) {
                    candidate.z = node.height;
                    this.toPoint(candidate, this.searcher.coll.size.x / 2, false);
                    if (this.path) return true;
                }
                dist = dist + 16;
            }
            return false;
        },

        /**
         * Step around `targetPos` at radius `radius` within `minAngle`..`maxAngle`
         * of the current position; find a clear spot and move to it.
         */
        _moveCircle: function (targetNode, searcherPos, targetPos, radius, throwing, minAngle, maxAngle, keepDirection, precise) {
            if (!targetNode) return false;
            var targetZ = throwing ? targetNode.height : this.searcher.coll.pos.z,
                gridSize = ig.navigation.tilesize,
                dir = Vec2.sub(searcherPos, targetPos, tempVec2d4);
            Vec2.length(tempVec2d4, radius);
            var startAngle = Math.random() > 0.5 ? 1 : -1,
                angle = 0,
                stepAngle = 32 / (Math.PI * 2 * radius),
                steps = Math.ceil(1 / stepAngle),
                startAngle = Vec2.areClockwise(dir, this.lastSideWayDir) ? 1 : -1;
            if (minAngle) {
                angle = stepAngle * (minAngle / 32);
                Vec2.rotate(dir, Math.PI * 2 * angle * -startAngle);
                angle = keepDirection ? stepAngle : angle * 2;
            }
            gridSize = Math.ceil(Math.max(this.searcher.coll.size.x, this.searcher.coll.size.y) / gridSize);
            if (maxAngle) {
                steps = Math.ceil((maxAngle - (minAngle || 0)) / 32 * 2).limit(1, steps);
                keepDirection && (steps = Math.ceil(steps / 2));
            }
            for (var best = null; steps--;) {
                var candidate = Vec2.add(targetPos, dir, scratchVec3d2);
                candidate.z = targetZ;
                var node = getNodeForArea(candidate, void 0, gridSize, true);
                if (node && (!throwing || isNavLineClear(node, targetNode, candidate, targetPos, true))) {
                    best = candidate;
                    best.z = node.height;
                    this.toPoint(best, this.searcher.coll.size.x / 2, precise || false);
                    if (this.path) {
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, "blue", 2);
                        Vec2.assign(this.lastSideWayDir, best);
                        Vec2.sub(this.lastSideWayDir, searcherPos);
                        return true;
                    }
                    ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, "green", 2);
                } else {
                    ig.perf.navigationMarker && ig.debugView.addMapPoint(candidate.x, candidate.y, candidate.z, 8, 8, node ? "orange" : "red", 2);
                }
                if (!keepDirection) {
                    angle = angle + stepAngle;
                    startAngle = startAngle * -1;
                }
                Vec2.rotate(dir, Math.PI * 2 * angle * -startAngle);
            }
            return false;
        },

        getDistance: function () {
            return this.path && this.path.distance || 0;
        },

        getJumpCount: function () {
            return this.path && this.path.jumpCount || 0;
        },

        isDestReachable: function () {
            return !!this.path;
        },

        /** Recompute the path to the current target (or a fixed node). */
        redoPath: function (targetNode, targetPos) {
            this.mapVersion = ig.navigation.mapVersion;
            this.retargetNode = null;
            var fromNode = getEntityNode(this.searcher),
                toNode, targetJumping;
            if (targetNode) {
                toNode = targetNode;
                Vec3.assign(this.targetPos, targetPos);
                targetJumping = false;
            } else {
                toNode = this.targetEntity ?
                    getTargetNode(this.targetPos, this.searcher, this.targetEntity, this.options) :
                    getNodeAtPos(this.targetPos);
                targetJumping = this.targetEntity && this.targetEntity.jumping;
            }
            this.pathIdx = -1;
            if (targetJumping || ig.navigation.isCachedFailure(fromNode, toNode, this.searcher)) {
                this.path = null;
            } else {
                this.searcher.getCenter(searcherCenterVec);
                (this.path = findPath(this.searcher, fromNode, toNode, searcherCenterVec, this.targetPos)) ||
                    ig.navigation.addCachedFailure(fromNode, toNode, this.searcher);
            }
            this.path ? this.failCount = 0 : this.failCount++;
            this.overNodePass = 0;
            this.pathComplete = false;
            this.triedRandom = -1;
            this.nextNodeData.jump = false;
            this.wrongNodeTimer = 0;
            this.searcher.cancelJump();
            this.searcher.faceDirFixed = false;
            Vec2.assignC(this.avoidTarget, 0, 0);
            Vec2.assignC(this.avoidTarget2, 0, 0);
        },

        interrupt: function () {
            this.searcher.coll.relativeVel = this.startRelativeVel;
            this.searcher.fly.minHeight = 0;
            this.searcher.faceDirFixed = false;
        },

        /** True when the searcher is on a node the current path does not expect. */
        isCurrentNodeInvalid: function () {
            var node = getEntityNode(this.searcher);
            return node && !node.airNode &&
                (!this.path.nodes[this.pathIdx] || node != this.path.nodes[this.pathIdx].node) &&
                (!this.path.nodes[this.pathIdx - 1] || node != this.path.nodes[this.pathIdx - 1].node) &&
                (!this.path.nodes[this.pathIdx + 1] || node != this.path.nodes[this.pathIdx + 1].node) ? true : false;
        },

        /**
         * Steer the searcher along the path: advance nodes, handle wrong-node
         * detours, random re-route when stuck, and (when finished) decelerate
         * to the target.
         */
        moveEntity: function () {
            var grounded = !this.searcher.jumping && (this.searcher.coll.float.height || this.searcher.coll.pos.z == this.searcher.coll.baseZPos),
                retry = this.mapVersion != ig.navigation.mapVersion;
            if (!retry && grounded && this.path && this.pathIdx != -1 && !this.pathComplete) {
                if (this.isCurrentNodeInvalid()) {
                    this.wrongNodeTimer = this.wrongNodeTimer + ig.system.tick;
                    this.wrongNodeTimer >= 0.3 && (retry = true);
                } else {
                    this.wrongNodeTimer = 0;
                }
            } else {
                this.wrongNodeTimer = 0;
            }
            if (retry && !this.targetEntity) {
                Vec3.assign(this.retargetPos, this.targetPos);
                this.retargetNode = getNodeAtPos(this.targetPos);
            }
            if (this.targetEntity && !this.targetEntity.jumping) {
                var node = getTargetNode(scratchVec3d2, this.searcher, this.targetEntity, this.options);
                if (node && !node.airNode) {
                    Vec3.assign(this.retargetPos, scratchVec3d2);
                    this.retargetNode = node;
                }
            }
            if (this.retargetNode && grounded) {
                Vec3.assign(this.targetPos, this.retargetPos);
                (retry || !this.path || this.path.nodes.length == 0 || this.path.nodes[0].node != this.retargetNode) &&
                    this.redoPath(this.retargetNode, this.retargetPos);
                this.retargetNode = null;
            }
            if (this.searcher.coll.partlyBlockTimer > 0.5) {
                if (this.overNodePass && !this.triedNodePassChange) {
                    this.triedNodePassChange = true;
                    this.overNodePass = 0;
                } else if (this.triedRandom == -1) {
                    Vec2.assignC(this.avoidTarget, 0, 0);
                    Vec2.assignC(this.avoidTarget2, 0, 0);
                    ig.navigation.dodgeEntities.erase(this.searcher);
                    this.searcher.faceDirFixed = true;
                    this.doBackUp = false;
                    this.triedRandom = 0.3;
                    Vec2.rotate(this.targetDir, (Math.random() - 0.5) * Math.PI);
                    this.searcher.coll.partlyBlockTimer = 0;
                } else {
                    this.redoPath();
                }
            }
            if (this.triedRandom > 0) {
                this.triedRandom = this.triedRandom - ig.system.tick;
                if (this.triedRandom < 0) {
                    this.triedRandom = 0;
                    this.searcher.faceDirFixed = false;
                }
                this.doBackUp && this.triedRandom < 0.5 ?
                    Vec2.assignC(this.searcher.coll.accelDir, 0, 0) :
                    Vec2.assign(this.searcher.coll.accelDir, this.targetDir);
                return false;
            }
            this.searcher.getCenter(searcherCenterVec);
            if (Vec2.isZero(this.avoidTarget)) {
                ig.navigation.dodgeEntities.erase(this.searcher);
                if (!this.path) return true;
                if (this.pathComplete && this.targetEntity && this.pathIdx == 1 &&
                    getEntityNode(this.searcher) == this.path.nodes[1].node &&
                    !isNodeReached(this.path.nodes[1].node, this.path.nodes[0].node, searcherCenterVec, this.targetPos, this.searcher.coll.size.x)) {
                    this.pathComplete = false;
                }
                this.pathComplete || this.runPath();
                if (this.pathComplete) {
                    Vec2.assign(this.targetDir, this.targetPos);
                    Vec2.sub(this.targetDir, searcherCenterVec);
                    this.targetDist = Vec2.length(this.targetDir);
                    if (this.targetDist <= Math.max(this.precise ? 2 : 8, this.maxDistance + (this.firstMovement ? 16 : 0))) {
                        Vec2.assignC(this.targetDir, 0, 0);
                        this.searcher.jumping && Vec2.assignC(this.searcher.coll.vel, 0, 0);
                        Vec2.targetDist = 0;
                        this.searcher.coll.relativeVel = this.startRelativeVel;
                        this.searcher.fly.minHeight = 0;
                        Vec2.assignC(this.searcher.coll.accelDir, 0, 0);
                        return !this.searcher.jumping;
                    }
                    if (this.precise && this.searcher.coll.maxVel * this.searcher.coll.relativeVel > this.targetDist * 10) {
                        this.searcher.coll.relativeVel = this.targetDist / this.searcher.coll.maxVel * 10;
                    }
                }
                this.firstMovement = false;
                this.avoidEntities();
                Vec2.assign(this.searcher.coll.accelDir, this.targetDir);
                return false;
            }
            Vec2.assign(this.searcher.coll.accelDir, this.avoidTarget);
            Vec2.sub(this.searcher.coll.accelDir, searcherCenterVec);
            if (Vec2.length(this.searcher.coll.accelDir) < 4) {
                if (Vec2.isZero(this.avoidTarget2)) {
                    Vec2.assignC(this.avoidTarget, 0, 0);
                    this.redoPath();
                } else {
                    Vec2.assign(this.avoidTarget, this.avoidTarget2);
                    Vec2.assignC(this.avoidTarget2, 0, 0);
                }
            }
        },

        /** Steer around a blocking entity in the path. */
        avoidEntities: function () {
            if (!(this.searcher.coll.type == ig.COLLTYPE.IGNORE || this.searcher.coll.ignoreCollision || this.searcher.coll.type == ig.COLLTYPE.TRIGGER)) {
                if (!this.targetEntity) {
                    ig.game.physics.initTraceResult(traceResult);
                    Vec2.assign(traceDirVec, this.targetDir);
                    this.targetDist > 48 && Vec2.length(traceDirVec, 48);
                    var hits = [],
                        searcherColl = this.searcher.coll;
                    if (ig.game.traceEntity(traceResult, this.searcher, traceDirVec.x, traceDirVec.y, 0, 0, 0, ig.COLLTYPE.BLOCK, hits)) {
                        var blocker;
                        Vec2.normalize(traceDirVec);
                        if (Math.abs(Vec2.dot(traceDirVec, traceResult.dir)) < 0.8 || hits.length == 0) return;
                        for (var i = hits.length; i--;) {
                            var hitEntity = hits[i].entity;
                            if (hitEntity instanceof ig.ActorEntity && ig.navigation.dodgeEntities.indexOf(hitEntity) == -1) {
                                if (Vec2.isZero(hitEntity.coll.accelDir)) {
                                    blocker = hitEntity;
                                    break;
                                }
                                Vec2.normalize(hitEntity.coll.accelDir, tempVec2d4);
                            }
                        }
                        if (!blocker) return;
                        var blockerColl = blocker.coll;
                        blocker.getCenter(centerBVec);
                        this.searcher.getCenter(searcherCenterVec);
                        Vec2.sub(centerBVec, searcherCenterVec, tempVec2d4);
                        if (Vec2.dot(tempVec2d4, traceDirVec) <= 0) return;
                        Vec2.sub(centerBVec, this.targetPos, tempVec2d4);
                        if (Math.abs(tempVec2d4.x) < blockerColl.size.x / 2 + searcherColl.size.x / 2 &&
                            Math.abs(tempVec2d4.y) < blockerColl.size.y / 2 + searcherColl.size.y / 2) return;
                        var blockerRadius = (blockerColl.size.x + 4) / 2,
                            searcherRadius = (searcherColl.size.x + 4) / 2,
                            moveDir = Vec2.assign(pathVec1, traceDirVec);
                        Vec2.normalize(moveDir);
                        var sideDir = Vec2.assign(pathVec2, traceDirVec);
                        Vec2.rotate90CW(sideDir);
                        Vec2.length(sideDir, blockerRadius + searcherRadius);
                        var toBlocker = Vec2.sub(centerBVec, searcherCenterVec, tempVec2d4);
                        Vec2.dot(sideDir, toBlocker) > 0 && Vec2.flip(sideDir);
                        Vec2.addMulF(centerBVec, moveDir, -blockerRadius - searcherRadius);
                        Vec2.add(centerBVec, sideDir);
                        Vec2.assign(searcherCenterVec, centerBVec);
                        Vec2.addMulF(searcherCenterVec, sideDir, -2);
                        Vec2.assign(traceDirVec, moveDir);
                        Vec2.length(traceDirVec, blockerRadius * 2 + searcherRadius * 2);
                        Vec2.sub(centerBVec, searcherCenterVec, tempVec2d4);
                        ig.game.physics.initTraceResult(traceResult);
                        if (!ig.game.traceEntity(traceResult, this.searcher, tempVec2d4.x, tempVec2d4.y, 0, 0, 0, null)) {
                            Vec2.sub(this.targetPos, centerBVec, pathVec3);
                            Vec2.length(pathVec3) < Vec2.length(traceDirVec) && Vec2.assign(traceDirVec, pathVec3);
                            ig.game.physics.initTraceResult(traceResult);
                            if (!ig.game.traceEntity(traceResult, this.searcher, traceDirVec.x, traceDirVec.y, tempVec2d4.x, tempVec2d4.y, 0, null)) {
                                Vec2.assign(this.avoidTarget, centerBVec);
                                Vec2.assign(this.avoidTarget2, centerBVec);
                                Vec2.add(this.avoidTarget2, traceDirVec);
                            }
                        }
                        if (Vec2.isZero(this.avoidTarget)) {
                            Vec2.sub(searcherCenterVec, searcherCenterVec, tempVec2d4);
                            traceResult.dist = 1;
                            if (!ig.game.traceEntity(traceResult, this.searcher, tempVec2d4.x, tempVec2d4.y, 0, 0, 0, null)) {
                                Vec2.sub(this.targetPos, searcherCenterVec, pathVec3);
                                Vec2.length(pathVec3) < Vec2.length(traceDirVec) && Vec2.assign(traceDirVec, pathVec3);
                                traceResult.dist = 1;
                                if (!ig.game.traceEntity(traceResult, this.searcher, traceDirVec.x, traceDirVec.y, tempVec2d4.x, tempVec2d4.y, 0, null)) {
                                    Vec2.assign(this.avoidTarget, searcherCenterVec);
                                    Vec2.assign(this.avoidTarget2, searcherCenterVec);
                                    Vec2.add(this.avoidTarget2, traceDirVec);
                                }
                            }
                        }
                    }
                }
                Vec2.isZero(this.avoidTarget) || ig.navigation.dodgeEntities.push(this.searcher);
            }
        },

        /** Advance along the path: move to the next node's waypoint when close. */
        runPath: function () {
            if (this.path.nodes.length <= 1) {
                this.pathComplete = true;
            } else {
                if (this.pathIdx == -1) {
                    this.pathIdx = this.path.nodes.length - 1;
                    this.overNodePass = 0;
                    this.triedNodePassChange = false;
                    this.triedRandom = -1;
                    this.selectNextTargetPos();
                }
                if (!this.nextNodeData.jump && this.pathIdx == 1 &&
                    isNodeReached(this.path.nodes[1].node, this.path.nodes[0].node, searcherCenterVec, this.targetPos, this.searcher.coll.size.x)) {
                    this.searcher.coll.relativeVel = this.startRelativeVel;
                    this.pathComplete = true;
                } else {
                    Vec2.assign(this.targetDir, this.overNodePass ? this.nextNodeData.endPos : this.nextNodeData.startPos);
                    Vec2.sub(this.targetDir, searcherCenterVec);
                    this.targetDist = Vec2.length(this.targetDir);
                    this.searcher.coll.relativeVel = this.nextNodeData.jump && this.overNodePass ? 1 : this.startRelativeVel;
                    if (this.searcher.fly.height) this.searcher.fly.minHeight = this.nextNodeData.height;
                    if (this.targetDist < 8) {
                        if (this.nextNodeData.jump && !this.overNodePass && this.searcher.jumping) {
                            Vec2.sub(this.targetDir, 0, 0);
                            Vec2.assignC(this.searcher.coll.vel, 0, 0);
                            this.targetDist = 0;
                        } else {
                            this.overNodePass = this.overNodePass ? 0 : 1;
                            if (!this.overNodePass) {
                                this.pathIdx--;
                                if (this.pathIdx == 0) {
                                    this.searcher.coll.relativeVel = this.startRelativeVel;
                                    this.pathComplete = true;
                                    this.nextNodeData.jump = false;
                                } else {
                                    this.triedNodePassChange = false;
                                    this.selectNextTargetPos();
                                }
                            }
                        }
                    } else {
                        this.nextNodeData.jump && (this.overNodePass && !this.searcher.jumping && this.isCurrentNodeInvalid()) && this.redoPath();
                    }
                }
            }
        },

        /** Pick the start/end waypoint of the current node connection to steer to. */
        selectNextTargetPos: function () {
            var nodeData = this.nextNodeData,
                nodes = this.path.nodes,
                pathIdx = this.pathIdx,
                searcher = this.searcher,
                targetPos = this.targetPos,
                node = nodes[pathIdx].node,
                connection = nodes[pathIdx].connection,
                edges = connection.edges,
                tilesize = ig.navigation.tilesize,
                clearance = searcher.coll.size.x / 2;
            connection.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && (clearance = 8);
            var maxClearance = clearance + baseClearance;
            searcher.getCenter(searcherCenterVec);
            var target = targetPos;
            nodeData.height = node.height;
            if (pathIdx > 1) {
                target = nodes[pathIdx - 1].connection;
                nodeData.height = nodes[pathIdx - 1].node.height;
                Line2.closestEntry(closestEntryVec1, target.waypointMin, target.waypointMax, nodeData.height, 1, searcherCenterVec, targetPos, clearance, maxClearance);
                target = closestEntryVec1;
            }
            for (var i = edges.length,
                    bestDist = void 0,
                    best, bestEdge = -1,
                    bestBlock = null,
                    retry = false; i--;) {
                var edge = edges[i],
                    edgeClearance = retry || !edge.block[0] && !edge.block[1] ? 4 : clearance;
                var dist = Line2.closestEntry(closestEntryVec2, edge.min, edge.max, node.height, tilesize, searcherCenterVec, target, edgeClearance, maxClearance, lineResult);
                if (dist !== false && (bestDist === void 0 || bestDist > dist)) {
                    bestDist = dist;
                    bestBlock = edge;
                    bestEdge = dist == 0 && !lineResult.closeToEdge ? -1 :
                        lineResult.finalWeight < 0.5 ? 0 : 1;
                    offsetPosFromEdge(closestEntryVec2, node.center, edge, node, tilesize, searcher, -0.5, jumpClearance * 2);
                    Vec2.assign(nodeData.startPos, closestEntryVec2);
                    if (connection.type != ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP) {
                        nodeData.jump = false;
                        offsetPosFromEdge(closestEntryVec2, node.center, edge, node, tilesize, searcher, 1, jumpClearance * 2 + (connection.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL ? 16 : 0));
                    } else {
                        nodeData.jump = true;
                        var destEdge = connection.jumpInfo.destEdge;
                        Line2.closestEntry(closestEntryVec2, destEdge.min, destEdge.max, node.height, tilesize, searcherCenterVec, targetPos, edgeClearance, maxClearance);
                        offsetPosFromEdge(closestEntryVec2, nodeData.startPos, destEdge, node, tilesize, searcher, 0.5, jumpClearance * 2);
                    }
                    Vec2.assign(nodeData.endPos, closestEntryVec2);
                }
                if (!i && !bestBlock && !retry) {
                    retry = true;
                    i = edges.length;
                }
            }
            var midReachable = connection.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL ||
                connection.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL ||
                connection.type == ig.NAV_CONNECTION_TYPE.LOWER_STAIRS;
            midReachable && bestEdge != -1 && bestBlock.block[bestEdge] && (midReachable = false);
            if (midReachable) {
                var midPoint = Vec2.lerp(nodeData.startPos, nodeData.endPos, 0.5, midVec),
                    dirToMid = Vec2.assign(pathVec3, target);
                Vec2.sub(dirToMid, midPoint);
                midPoint = Vec2.sub(midPoint, searcherCenterVec);
                Vec2.angle(midPoint, dirToMid) > Math.PI * 0.4 && (midReachable = false);
            }
            !midReachable && !nodeData.jump && !searcher.jumping && Vec2.distance(searcherCenterVec, nodeData.startPos) < 4 && (midReachable = true);
            if (midReachable) {
                this.overNodePass = 2;
                Vec2.lerp(this.nextNodeData.endPos, this.nextNodeData.startPos, 0.5, this.nextNodeData.endPos);
                if (ig.perf.navigationMarker) {
                    var pos = this.nextNodeData.endPos;
                    ig.debugView.addMapPoint(pos.x, pos.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "green", 2);
                }
            } else {
                if (!this.nextNodeData.jump || !this.searcher.jumping) {
                    var edgeVec = Vec2.assign(edgeFromVec, this.nextNodeData.endPos);
                    Vec2.sub(edgeVec, this.nextNodeData.startPos);
                    var toStart = Vec2.assign(edgeToVec, this.nextNodeData.startPos);
                    Vec2.sub(toStart, searcherCenterVec);
                    if (Vec2.dot(edgeVec, toStart) <= 0) {
                        Vec2.assign(edgeVec, this.nextNodeData.endPos);
                        Vec2.sub(edgeVec, this.nextNodeData.startPos);
                        Vec2.normalize(edgeVec);
                        Vec2.assign(toStart, searcherCenterVec);
                        Vec2.sub(toStart, this.nextNodeData.startPos);
                        Vec2.mulF(edgeVec, Vec2.dot(edgeVec, toStart));
                        Vec2.sub(toStart, edgeVec);
                        if (Vec2.length(toStart) < this.searcher.coll.size.x) this.overNodePass = 1;
                    }
                }
                if (ig.perf.navigationMarker) {
                    pos = this.nextNodeData.startPos;
                    ig.debugView.addMapPoint(pos.x, pos.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "yellow", 2);
                    pos = this.nextNodeData.endPos;
                    ig.debugView.addMapPoint(pos.x, pos.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "yellow", 2);
                }
            }
            if (this.nextNodeData.jump && ig.perf.navigationMarker) {
                pos = this.nextNodeData.startPos;
                ig.debugView.addMapPoint(pos.x, pos.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "red", 2);
                pos = this.nextNodeData.endPos;
                ig.debugView.addMapPoint(pos.x, pos.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "blue", 2);
            }
        }
    });

    var offsetVec3 = Vec3.create(),
        edgeFromVec = Vec2.create(),
        edgeToVec = Vec2.create(),
        closestEntryVec1 = Vec2.create(),
        pathSearchId = 0,
        closestEntryVec2 = Vec2.create(),
        searcherCenterVec = Vec2.create(),
        midVec = Vec2.create(),
        pathVec1 = Vec2.create(),
        pathVec2 = Vec2.create(),
        pathVec3 = Vec2.create(),
        lineResult = {},
        baseClearance = 0,
        jumpClearance = 4;

    ig.NavExternalBlockers = {
        blockers: [],

        register: function (check) {
            this.blockers.push(check);
        },

        check: function (connection, searcher) {
            for (var i = this.blockers.length; i--;) {
                if (this.blockers[i](connection, searcher)) return true;
            }
            return false;
        }
    };
});
ig.baked = !0;
