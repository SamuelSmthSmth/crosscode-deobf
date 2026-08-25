/**
 * game.feature.npc.entities.npc-waypoint
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.entities.npc-waypoint")`.
 *
 * NPC waypoint graph: `sc.WPConnection` wraps an entity as a graph node,
 * `sc.NpcWayPointSearcher` runs A* over those nodes to find a path between
 * two waypoint-endowed entities (used by NPC runners), and
 * `ig.ENTITY.NPCWaypoint` is the map-placed waypoint entity that builds
 * the graph connections.
 */
ig.module("game.feature.npc.entities.npc-waypoint").requires(
    "impact.base.actor-entity"
).defines(function () {

    /**
     * A graph node backed by an entity. Connections are other entities
     * that also `getWPConnect()`. Lazily resolves the connection list
     * from entity references on first access.
     */
    sc.WPConnection = ig.Class.extend({
        owner: null,
        connections: null,
        initialized: false,
        connectedWPs: [],
        middle: false,
        searchData: {
            idx: 0,
            cameFrom: null,
            gScore: -1,
            fScore: -1,
            closed: null
        },

        /** @param {ig.Entity} owner */
        /** @param {Array} [connections] entity refs (names/ids) */
        init: function (owner, connections) {
            this.owner = owner;
            this.connections = connections || [];
            this.middle = owner instanceof ig.ENTITY.NPCWaypoint;
        },

        /** Lazy-resolve connections from entity references. */
        _initWaypoints: function () {
            if (!this.initialized) {
                this.initialized = true;
                for (var i = 0; i < this.connections.length; ++i) {
                    var entity = ig.Event.getEntity(this.connections[i]);
                    entity && this.connectedWPs.push(entity.getWPConnect());
                }
                for (i = this.connectedWPs.length; i--;) {
                    this.connectedWPs[i].addWayPoint(this);
                }
            }
        },

        /** Bidirectionally link `other` into this node. */
        /** @param {sc.WPConnection} other */
        addWayPoint: function (other) {
            this._initWaypoints();
            this.connectedWPs.indexOf(other) == -1 && this.connectedWPs.push(other);
        },

        /** @param {sc.WPConnection} other */
        /** @returns {number} ground distance between the two owner colliders */
        getDistance: function (other) {
            return ig.CollTools.getGroundDistance(this.owner.coll, other.owner.coll);
        },

        getWayPointConnections: function () {
            this._initWaypoints();
            return this.connectedWPs;
        },

        /**
         * Return (and lazily reset) the search-scratch data for a given
         * search index so the same searcher can re-use the same node
         * structures across calls.
         */
        getSearchData: function (searchIndex) {
            if (searchIndex != this.searchData.idx) {
                this.searchData.idx = searchIndex;
                this.searchData.cameFrom = null;
                this.searchData.gScore = -1;
                this.searchData.fScore = -1;
                this.searchData.closed = false;
            }
            return this.searchData;
        }
    });

    /**
     * A* pathfinder over `sc.WPConnection` nodes. Paths go through
     * intermediate waypoint nodes (`middle === true`); the start node
     * and goal node are usually destination entities.
     */
    sc.NpcWayPointSearcher = {
        searchIndex: 0,

        resetIndex: function () {
            this.searchIndex = 0;
        },

        /**
         * @param {sc.WPConnection} start
         * @param {sc.WPConnection} goal
         * @returns {Array<ig.Entity>|null} ordered list of waypoint owners
         *         from start to goal (exclusive of both), or null.
         */
        searchConnection: function (start, goal) {
            this.searchIndex++;
            var openList = [start];
            var startData = start.getSearchData(this.searchIndex);
            startData.gScore = 0;
            startData.fScore = start.getDistance(goal);

            while (openList.length > 0) {
                var current = openList.pop();
                var currentData = current.getSearchData(this.searchIndex);

                if (current == goal) return this._reconstructPath(start, goal);

                currentData.closed = true;
                var neighbors = current.getWayPointConnections();

                for (var k = neighbors.length; k--;) {
                    var neighbor = neighbors[k];
                    var neighborData = neighbor.getSearchData(this.searchIndex);
                    var tentativeGScore = currentData.gScore + neighbor.getDistance(current);
                    var existingGScore = neighborData.gScore;

                    // Only intermediate nodes or the goal itself are traversable.
                    if (neighbor.middle || neighbor == goal) {
                        if (!(neighborData.closed && tentativeGScore >= existingGScore)) {
                            if (existingGScore == -1 || tentativeGScore < existingGScore) {
                                existingGScore != -1 && openList.erase(neighbor);
                                neighborData.cameFrom = current;
                                neighborData.gScore = tentativeGScore;
                                var fScore = tentativeGScore + neighbor.getDistance(goal);
                                neighborData.fScore = fScore;

                                // Insert-sort by fScore (descending, so pop() gives lowest).
                                for (var ins = openList.length;
                                    ins && openList[ins - 1].getSearchData(this.searchIndex).fScore < fScore;
                                    ins--);
                                openList.splice(ins, 0, neighbor);
                            }
                        }
                    }
                }
            }
            return null;
        },

        /** @private */
        _reconstructPath: function (start, goal) {
            var path = [];
            for (var current = goal; current != start;) {
                current != goal && path.unshift(current.owner);
                current = current.getSearchData(this.searchIndex).cameFrom;
            }
            return path;
        }
    };

    /**
     * Map-placed waypoint entity. Connects to other NPCWaypoints or
     * destination entities (doors, etc.) that implement `getWPConnect()`.
     */
    ig.ENTITY.NPCWaypoint = ig.Entity.extend({
        name: "",
        wpConnection: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                connections: {
                    _type: "Array",
                    _info: "Connections to other stuff",
                    _sub: {
                        _type: "EntitySelect",
                        _filter: function (entity) {
                            return entity.getWPConnect;
                        }
                    }
                }
            },
            scalableX: true,
            scalableY: true,
            label: function () {
                return "";
            },
            drawBox: true,
            boxColor: "rgba(120,120,255, 0.25)"
        }),
        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            this.wpConnection = new sc.WPConnection(this, settings.connections);
        },
        /** Resolve all waypoint graph connections (called on level load). */
        initWayPoints: function () {
            this.wpConnection._initWaypoints();
        },
        getWPConnect: function () {
            return this.wpConnection;
        }
    });
});
ig.baked = !0;