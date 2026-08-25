ig.module("game.feature.npc.entities.npc-waypoint").requires("impact.base.actor-entity").defines(function() {
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
        init: function(b, a) {
            this.owner = b;
            this.connections = a || [];
            this.middle = b instanceof ig.ENTITY.NPCWaypoint
        },
        _initWaypoints: function() {
            if (!this.initialized) {
                this.initialized = true;
                for (var b = 0; b < this.connections.length; ++b) {
                    var a =
                        ig.Event.getEntity(this.connections[b]);
                    a && this.connectedWPs.push(a.getWPConnect())
                }
                for (b = this.connectedWPs.length; b--;) this.connectedWPs[b].addWayPoint(this)
            }
        },
        addWayPoint: function(b) {
            this._initWaypoints();
            this.connectedWPs.indexOf(b) == -1 && this.connectedWPs.push(b)
        },
        getDistance: function(b) {
            return ig.CollTools.getGroundDistance(this.owner.coll, b.owner.coll)
        },
        getWayPointConnections: function() {
            this._initWaypoints();
            return this.connectedWPs
        },
        getSearchData: function(b) {
            if (b != this.searchData.idx) {
                this.searchData.idx =
                    b;
                this.searchData.cameFrom = null;
                this.searchData.gScore = -1;
                this.searchData.fScore = -1;
                this.searchData.closed = false
            }
            return this.searchData
        }
    });
    sc.NpcWayPointSearcher = {
        searchIndex: 0,
        resetIndex: function() {
            this.searchIndex = 0
        },
        searchConnection: function(b, a) {
            this.searchIndex++;
            var d = [b],
                c = b.getSearchData(this.searchIndex);
            c.gScore = 0;
            for (c.fScore = b.getDistance(a); d.length > 0;) {
                var c = d.pop(),
                    e = c.getSearchData(this.searchIndex);
                if (c == a) return this._reconstructPath(b, a);
                e.closed = true;
                for (var f = c.getWayPointConnections(),
                        g = f.length; g--;) {
                    var h = f[g],
                        i = h.getSearchData(this.searchIndex),
                        j = e.gScore + h.getDistance(c),
                        k = i.gScore;
                    if (h.middle || h == a)
                        if (!(i.closed && j >= k) && (k == -1 || j < k)) {
                            k != -1 && d.erase(h);
                            i.cameFrom = c;
                            i.gScore = j;
                            j = j + h.getDistance(a);
                            i.fScore = j;
                            for (i = d.length; i && d[i - 1].getSearchData(this.searchIndex).fScore < j;) i--;
                            d.splice(i, 0, h)
                        }
                }
            }
            return null
        },
        _reconstructPath: function(b, a) {
            for (var d = [], c = a; c != b;) {
                c != a && d.unshift(c.owner);
                c = c.getSearchData(this.searchIndex).cameFrom
            }
            return d
        }
    };
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
                        _filter: function(b) {
                            return b.getWPConnect
                        }
                    }
                }
            },
            scalableX: true,
            scalableY: true,
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(120,120,255, 0.25)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            this.wpConnection = new sc.WPConnection(this, c.connections)
        },
        initWayPoints: function() {
            this.wpConnection._initWaypoints()
        },
        getWPConnect: function() {
            return this.wpConnection
        }
    })
});
ig.baked = !0;
