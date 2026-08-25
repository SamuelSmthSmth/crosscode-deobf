ig.module("impact.feature.navigation.navigation").requires("impact.base.game").defines(function() {
    function b(a, b, c, d, e, f) {
        for (var g = false, h = ig.game.getLevelIdx(b + 4); h >= 0; --h) {
            var i = ig.game.levels[h];
            if (i && i.navigation && !(i.height + 16 < a)) {
                var j = Math.abs(i.height - b) <= 4 ? ig.NAV_ENTITY_FLAG.GROUND : ig.NAV_ENTITY_FLAG.BLOCK;
                if (!(f && j == ig.NAV_ENTITY_FLAG.GROUND)) {
                    for (var g = i.navigation, k = Math.floor(c.x / g.tilesize), m = Math.floor((c.x + d.x - 1) / g.tilesize), w = Math.floor((c.y - i.height) / g.tilesize), i = Math.floor((c.y +
                            d.y - i.height - 1) / g.tilesize), l = w; l <= i; l++)
                        for (var n = k; n <= m; n++) switch (e) {
                            case r.INCREASE:
                                g.increaseEntityFlagValue(n, l, j);
                                break;
                            case r.DECREASE:
                                g.decreaseEntityFlagValue(n, l, j)
                        }
                    g.reparse(h, k, m, w, i);
                    g = true
                }
            }
        }
        return g
    }

    function a(a, b) {
        var c = ig.game.getLevelIdx((b !== void 0 ? b : a.z) || 0),
            d = (c = f(c)) && c.zHeight;
        return c && c.getNode(a.x, a.y - d)
    }

    function d(b, c, d, e) {
        for (var g = ig.navigation.tilesize, h = (d - 1) / 2, i = null, j = 0; j < d; ++j)
            for (var k = 0; k < d; ++k) {
                var m = Vec2.assign(B, b);
                m.z = c !== void 0 ? c : b.z;
                m.x = (Math.floor(m.x / g -
                    h + j) + 0.5) * g;
                m.y = (Math.floor(m.y / g - h + k) + 0.5) * g;
                if (e) a: {
                    for (var w = ig.game.getLevelIdx(m.z || 0); w >= 0;) {
                        var l = f(w),
                            n = l && l.zHeight;
                        if (l = l && l.getNode(m.x, m.y - n)) {
                            m = l;
                            break a
                        }
                        w--
                    }
                    m = null
                }
                else m = a(m);
                if (!m || m.airNode || i && m.height != i.height) return null;
                i = m
            }
        b.x = (Math.floor(b.x / g - h) + d / 2) * g;
        b.y = (Math.floor(b.y / g - h) + d / 2) * g;
        return i
    }

    function c(a) {
        var b = a.jumping ? a.coll.pos.z : a.coll.baseZPos,
            b = b + 8,
            c = ig.game.getLevelIdx(b),
            d = f(c);
        if (!d) {
            c = ig.game.getLevelIdx(b + 16);
            d = f(c);
            if (!d) return null
        }
        a.getCenter(H);
        b = d.zHeight;
        d = e(a, H, d, b);
        if (!d) {
            var g = ig.game.levels[c + 1] && ig.game.levels[c + 1].height;
            if (g && g - a.coll.pos.z < a.coll.pos.z - b) {
                c = c + 1;
                d = f(c);
                if (!d) return null;
                b = ig.game.levels[c].height;
                d = e(a, H, d, b)
            }
        }
        return d
    }

    function e(a, b, c, d) {
        var a = a.coll,
            e;
        if ((e = c.getNode(b.x, b.y - d)) && !e.airNode || (e = c.getNode(a.pos.x, a.pos.y - d)) && !e.airNode || (e = c.getNode(a.pos.x + a.size.x, a.pos.y - d)) && !e.airNode || (e = c.getNode(a.pos.x, a.pos.y + a.size.y - d)) && !e.airNode || (e = c.getNode(a.pos.x + a.size.x, a.pos.y + a.size.y - d)) && !e.airNode || (e = c.getNode(a.pos.x -
                8, b.y - d)) && !e.airNode || (e = c.getNode(a.pos.x + a.size.x + 8, b.y - d)) && !e.airNode || (e = c.getNode(b.x, a.pos.y - 8 - d)) && !e.airNode) return e;
        return e = c.getNode(b.x, a.pos.y + a.size.y + 8 - d)
    }

    function f(a) {
        for (; ig.game.levels[a] && !ig.game.levels[a].navigation;) a--;
        return ig.game.levels[a] && ig.game.levels[a].navigation
    }

    function g(a, b, c, d, e, f) {
        if (!a || !b) return false;
        if (a == b) return true;
        if (a.height != b.height || a.airNode || b.airNode) return false;
        var g = ig.CONFIG.DEFAULT_TILE_SIZE;
        Vec2.assign(t, c);
        t.y = t.y - a.height;
        Vec2.mulF(t,
            1 / g);
        Vec2.assign(q, d);
        q.y = q.y - a.height;
        Vec2.mulF(q, 1 / g);
        f = (f || 4) / g;
        Vec2.assign(s, t);
        for (var c = a, h = []; c && c != b;) {
            var i;
            a: {
                i = c;
                for (var j = t, k = q, m = s, w = h, l = f, n = i.neighbours.length, o = null; n--;) {
                    var x = i.neighbours[n];
                    if (w.indexOf(x.node) == -1 && !(x.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL || x.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_FLY || x.shared.type == ig.NAV_CONNECTION_TYPE.UPPER_STAIRS))
                        for (var p = x.shared.edges, z = 0; z < p.length; ++z) {
                            var r = p[z];
                            if (Line2.intersectMinRange(r.min, r.max, j, k, l, m, r.block))
                                if (x.node.airNode ||
                                    x.shared.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL) o = x;
                                else {
                                    i = x;
                                    break a
                                }
                        }
                }
                i = o
            }
            if (!i || i.airNode || i.shared.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL) {
                if (!e) return false;
                Vec2.assign(v, s);
                Vec2.mulF(v, g);
                v.z = a.height;
                v.y = v.y + a.height;
                ig.game.physics.initTraceResult(y);
                return ig.game.trace(y, v.x - 4, v.y - 4, v.z + 12, d.x - v.x, d.y - v.y, 8, 8, 8, ig.COLLTYPE.PROJECTILE) ? false : true
            }
            h.push(c);
            c = i.node
        }
        return c == b
    }

    function h(a, b, c, d, e) {
        if (a == b) return true;
        if (a.height != b.height) return false;
        for (var e = e || 0, f = ig.CONFIG.DEFAULT_TILE_SIZE,
                g = a.neighbours.length; g--;) {
            var h = a.neighbours[g];
            if (h.node == b) {
                b = h.shared.edges;
                for (g = 0; g < b.length; ++g) {
                    h = b[g];
                    Vec2.assign(t, h.min);
                    Vec2.mulF(t, f);
                    t.y = t.y + a.height;
                    Vec2.assign(q, h.max);
                    Vec2.mulF(q, f);
                    q.y = q.y + a.height;
                    if (Line2.intersectMinRange(t, q, c, d, e, null, h.block)) return true
                }
                break
            }
        }
        return false
    }

    function i(b, d, e, f) {
        b.z = e.coll.pos.z;
        e.getCenter(b);
        var h = c(e);
        if (f.posOffset) {
            f = f.posOffset;
            e = ig.CollTools.getDistVec2(d.coll, e.coll, w);
            d = Vec3.assign(x, b);
            if (Math.abs(e.x) > Math.abs(e.y)) {
                d.y = d.y + f.x;
                d.x = d.x + (e.x > 0 ? f.y : -f.y)
            } else {
                d.x = d.x + f.x;
                d.y = d.y + (e.y > 0 ? f.y : -f.y)
            }
            if ((f = a(d)) && !f.airNode && (!h || h.height == f.height) && g(h, f, b, d, false)) {
                Vec3.assign(b, d);
                h = f
            }
        }
        return h
    }

    function j(a, b, c, d, e) {
        var f;
        f = I = I % 1E7 + 1;
        var g = [];
        if (!b || b.airNode || !c) return {
            nodes: []
        };
        if (b == c) return {
            nodes: [{
                node: b,
                connection: null
            }]
        };
        if (c.airNode) return null;
        var h = Math.max(a.coll.size.x, a.coll.size.y);
        do {
            var i = null,
                j, k, m;
            if (g.length == 0) {
                j = b;
                m = d;
                k = 0
            } else {
                var i = g.pop(),
                    w = i.getSearchData(f);
                m = w.pos;
                k = w.gScore;
                j = w.toNode;
                w.closed = true
            }
            if (j ==
                c) {
                a = f;
                d = [{
                    node: c,
                    connection: null
                }];
                e = i;
                f = false;
                for (g = 0; c != b;) {
                    h = e.getSearchData(a);
                    f = f || c.height != b.height;
                    c = h.fromNode;
                    e.jumpInfo && g++;
                    d.push({
                        node: c,
                        connection: e
                    });
                    e = h.fromEdge
                }
                return {
                    nodes: d,
                    distance: i.getSearchData(a).fScore,
                    multiLevel: f,
                    jumpCount: g
                }
            }
            for (w = j.neighbours.length; w--;) {
                var l = j.neighbours[w],
                    n = l.node,
                    l = l.shared;
                if (!(i && l == i)) {
                    var o = l.getSearchData(f);
                    if (!n.airNode && !(l.type != ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && l.maxEdgeLength < h) && (!(l.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP ||
                            l.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL) || a.jumpingEnabled))
                        if (!a.coll.groundConnect || !(a.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT && l.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL))
                            if ((a.fly.height || l.type != ig.NAV_CONNECTION_TYPE.UPPER_FLY) && !(l.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && l.jumpInfo.jumpDist > 1600) && !ig.NavExternalBlockers.check(l, a)) {
                                var x = l.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP ? 1.2 : 1,
                                    s = 0;
                                l.type == ig.NAV_CONNECTION_TYPE.UPPER_LEVEL && (s = s + 100);
                                Line2.closestEntry(J,
                                    l.waypointMin, l.waypointMax, j.height, 1, m, e, 0, 0);
                                var p = J,
                                    x = k + Vec2.distance(m, p) * x + (n.height > j.height ? n.height - j.height : 0) * 2 + s,
                                    s = o.gScore;
                                if (!o.closed || !(x >= s || o.fromNode != j))
                                    if (s == -1 || x < s) {
                                        s != -1 && g.erase(l);
                                        o.fromNode = j;
                                        o.toNode = n;
                                        o.fromEdge = i;
                                        o.gScore = x;
                                        Vec2.assign(o.pos, p);
                                        n = x + Vec2.distance(p, e);
                                        o.fScore = n;
                                        for (o = g.length; o && g[o - 1].getSearchData(f).fScore < n;) o--;
                                        g.splice(o, 0, l)
                                    }
                            }
                }
            }
        } while (g.length > 0);
        return null
    }

    function k(a, b, c, d, e, f, g, h) {
        Line2.horizontal(c.min, c.max) ? a.y = a.y + (c.min.y * e + d.height >
            b.y ? g * (f.coll.size.y + h) : -g * (f.coll.size.y + h)) : a.x = a.x + (c.min.x * e > b.x ? g * (f.coll.size.x + h) : -g * (f.coll.size.x + h))
    }
    var l = Vec2.create(),
        o = Vec2.create(),
        m = Vec2.create(),
        n = Vec2.create(),
        p = Vec2.create();
    ig.NAV_DODGE_TYPE = {
        NEUTRAL: {
            deltas: [-1, -4, -1, -1, -4],
            start: 0
        },
        PASSIVE: {
            deltas: [1, 1, 2, 1, 1, -3],
            start: 0
        },
        GET_AWAY: {
            deltas: [-1, 2, -3, 4, -5, 6],
            start: 3
        },
        AGGRESSIVE: {
            deltas: [-2, 3, -4, 5, -6, 7, -8, 9, -10],
            start: -2
        }
    };
    ig.NAV_CLOSE_POINT_SEARCH = {
        RANDOM: function(a) {
            Vec2.rotate(a, Math.random() * Math.PI * 2)
        },
        BEHIND: function() {},
        FRONT: function(a) {
            Vec2.flip(a)
        },
        BEHIND_FACE: function(a, b) {
            if (b) {
                Vec2.assign(a, b.face);
                Vec2.flip(a)
            }
        },
        FRONT_FACE: function(a, b) {
            b && Vec2.assign(a, b.face)
        }
    };
    ig.perf.navigationMarker = false;
    ig.Navigation = ig.GameAddon.extend({
        tilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
        dodgeEntities: [],
        cachedFailure: {},
        mapVersion: 0,
        empty: true,
        influencers: [],
        init: function() {
            this.parent("Navigation")
        },
        isTargetReachable: function(a, b, d, e) {
            var f = a.getCenter(l),
                h = b.getCenter(o);
            if (Vec2.distance(f, h) > d) return false;
            if (this.empty) return true;
            if (b.jumping) return false;
            a = c(a);
            b = c(b);
            return !a || !b ? true : g(a, b, f, h, e, 4)
        },
        isPathAvailable: function(a, b) {
            var d = a.getCenter(l),
                e = b.getCenter(o),
                f = c(a),
                g = c(b);
            return (d = j(a, f, g, d, e)) && d.nodes.length > 0 ? true : false
        },
        isSearcherOnNode: function(a) {
            return !!c(a)
        },
        isEntityReached: function(a, b) {
            var d = c(a),
                e = c(b);
            return h(d, e, a.getCenter(), b.getCenter())
        },
        isPointReached: function(b, d) {
            var e = c(b),
                f = a(d);
            return h(e, f, b.getCenter(), d, b.coll.size.x)
        },
        isPositionFree: function(b, d, e, f) {
            var h, i, j = 0;
            h = e.getCenter(l);
            i = c(e);
            j = e.coll.baseZPos;
            d = d.coll.size;
            e = a(b, j);
            return g(i, e, h, b, f, 0) && !ig.game.isAreaBlocked(b.x - d.x / 2, b.y - d.y / 2, j, d.x, d.y, d.z, true) ? true : false
        },
        getClosePosition: function(b, d, e, f, h, i, j, k, m, w) {
            var n, x = 0,
                j = j || 0.5,
                k = k || 0;
            if (h) {
                n = Vec2.assign(l, h);
                x = h.z;
                h = a(n, x)
            } else {
                n = f.getCenter(l);
                h = c(f);
                x = f.coll.baseZPos
            }
            for (var s = ig.navigation.tilesize, p = s * 1.5; i >= 0;) {
                var z = Vec2.sub(n, d, C);
                m && m(z, f);
                Vec2.rotate(z, k * Math.PI * 2);
                Vec2.length(z, i);
                for (var v = Math.ceil(i * Math.PI * 2 * j / p), q = Math.PI * 2 * j / v, r = 1, y = 0; v--;) {
                    var u = Vec2.add(n,
                        z, o);
                    u.x = (Math.floor(u.x / s) + 0.5) * s;
                    u.y = (Math.floor(u.y / s) + 0.5) * s;
                    var E = a(u, x);
                    if (g(h, E, n, u, w, 0))
                        if (ig.game.isAreaBlocked(u.x - e.x / 2, u.y - e.y / 2, x, e.x, e.y, e.z, true)) ig.perf.navigationMarker && ig.debugView.addMapPoint(u.x, u.y, x, 8, 8, "violet", 2);
                        else {
                            ig.perf.navigationMarker && ig.debugView.addMapPoint(u.x, u.y, x, 8, 8, "blue", 2);
                            Vec3.assignC(b, u.x, u.y, x);
                            return true
                        }
                    else ig.perf.navigationMarker && ig.debugView.addMapPoint(u.x, u.y, x, 8, 8, "red", 2);
                    y = y + q;
                    r = r * 1;
                    Vec2.rotate(z, y * r)
                }
                i = i - p
            }
            Vec3.assignC(b, n.x, n.y, x);
            return false
        },
        getDodgePosition: function(a, b, e, f, h) {
            var h = h || ig.NAV_DODGE_TYPE.NEUTRAL,
                i = b.coll.pos.z,
                j = b.coll.size.x + 8,
                k = b.getCenter(l),
                w = e.getCenter(o),
                x = c(b),
                s = Vec2.sub(k, w, n),
                e = Vec2.assign(p, e.coll.vel);
            Vec2.isZero(e) && Vec2.assign(e, s);
            var z = Math.PI * 2 / 12;
            Vec2.rotate90CCW(e);
            if (Vec2.dot(s, e) < 0) {
                Vec2.flip(e);
                z = -z
            }
            h.start && Vec2.rotate(e, z * h.start);
            s = ig.navigation.tilesize;
            b = Math.ceil(Math.max(b.coll.size.x, b.coll.size.y) / s);
            Vec2.length(e, f);
            f = h.deltas;
            for (h = 0; h < f.length + 1; ++h) {
                var v = Vec2.add(h >= 6 ? w : k, e, m);
                v.x =
                    (Math.floor(v.x / s) + 0.5) * s;
                v.y = (Math.floor(v.y / s) + 0.5) * s;
                var q = d(v, i, b);
                ig.perf.navigationMarker && ig.debugView.addMapPoint(v.x, v.y, i, 8, 8, "violet", 2);
                if (g(x, q, k, v, false, j)) {
                    Vec3.assignC(a, v.x, v.y, i);
                    return true
                }
                h < f.length && Vec2.rotate(e, z * f[h])
            }
            return false
        },
        clearCachedFailures: function() {
            this.cachedFailure = {}
        },
        addCachedFailure: function(a, b, c) {
            a && b && (this.cachedFailure[this._getCacheKey(a, b, c)] = true)
        },
        isCachedFailure: function(a, b, c) {
            return !a || !b ? false : this.cachedFailure[this._getCacheKey(a, b, c)]
        },
        _getCacheKey: function(a,
            b, c) {
            a = a.id + "|" + a.height + ">" + b.id + "|" + b.height;
            b = Math.max(c.coll.size.x, c.coll.size.y);
            return a = a + ("[" + b + "|" + c.jumpingEnabled + "|" + c.coll.groundConnect + "|" + !!c.fly.height + "]")
        },
        getNavPath: function(a) {
            return new ig.NavPath(a)
        },
        onLevelLoadStart: function() {
            this.influencers.length = 0
        },
        onLevelLoaded: function() {
            this.dodgeEntities = [];
            this.empty = true;
            for (var a in ig.game.levels) {
                var b = ig.game.levels[a];
                if (b.navigation) {
                    b.navigation.levelInit(a);
                    this.empty = false
                }
            }
            this.connectAirNodes()
        },
        connectAirNodes: function() {
            for (var a =
                    ig.game.maxLevel; a--;) {
                var b = ig.game.levels[a];
                b.navigation && b.navigation.connectAirNodes(a)
            }
            this.applyInfluencers();
            this.mapVersion++;
            this.clearCachedFailures()
        },
        getNavBlock: function(a) {
            return new ig.NavBlocker(a)
        },
        registerInfluencer: function(a) {
            this.influencers.indexOf(a) == -1 && this.influencers.push(a)
        },
        applyInfluencers: function() {
            for (var a = this.influencers.length; a--;) this.influencers[a].onNavMapInfluence()
        },
        getNodeConnection: function(b, c, d) {
            b = a(b);
            if ((c = a(c)) && c.airNode)
                for (f = c.neighbours.length; f--;) {
                    var e =
                        c.neighbours[f];
                    if (e.node != b && !e.node.airNode) {
                        c = e.node;
                        break
                    }
                }
            if (b && c)
                for (var f = b.neighbours.length; f--;) {
                    e = b.neighbours[f];
                    if (!(d !== void 0 && e.shared.type != d) && e.node == c) return e.shared
                }
        }
    });
    ig.NAV_BLOCKER_TYPE = {
        REGULAR: 0,
        NO_BLOCK: 1,
        NO_TOP: 2
    };
    ig.NavBlocker = ig.Class.extend({
        entity: null,
        pos: Vec3.create(),
        size: Vec3.create(),
        blockType: 0,
        init: function(a, b) {
            this.entity = a;
            this.blockType = b || 0;
            this.embedInNavMap()
        },
        update: function(a) {
            this.removeFromNavMap();
            this.blockType = a || 0;
            this.embedInNavMap()
        },
        embedInNavMap: function() {
            var a =
                this.entity.coll;
            Vec3.assign(this.pos, a.pos);
            Vec3.assign(this.size, a.size);
            this.blockType != ig.NAV_BLOCKER_TYPE.NO_BLOCK && b(this.pos.z, this.pos.z + this.size.z, this.pos, this.size, r.INCREASE, this.blockType == ig.NAV_BLOCKER_TYPE.NO_TOP) && ig.navigation.connectAirNodes()
        },
        removeFromNavMap: function() {
            this.blockType != ig.NAV_BLOCKER_TYPE.NO_BLOCK && b(this.pos.z, this.pos.z + this.size.z, this.pos, this.size, r.DECREASE, this.blockType == ig.NAV_BLOCKER_TYPE.NO_TOP) && ig.navigation.connectAirNodes()
        },
        remove: function() {
            this.removeFromNavMap();
            this.entity = null
        }
    });
    var r = {
        INCREASE: 0,
        DECREASE: 1,
        SET: 2
    };
    ig.addGameAddon(function() {
        return ig.navigation = new ig.Navigation
    });
    var t = Vec2.create(),
        q = Vec2.create(),
        s = Vec2.create(),
        v = Vec3.create(),
        y = {},
        u = Vec2.create(),
        z = Vec2.create(),
        D = Vec2.create(),
        C = Vec2.create();
    Vec2.create();
    var A = Vec3.create(),
        B = Vec3.create();
    Vec3.create();
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
        init: function(a) {
            this.searcher = a
        },
        toEntity: function(a, b, c, d) {
            this.targetEntity = a;
            a.getCenter(this.targetPos);
            this.maxDistance = b || 0;
            this.options = c || {};
            this.precise = d || false;
            this.firstMovement = !this.precise;
            this.startRelativeVel = this.searcher.coll.relativeVel;
            this.searcher.faceDirFixed = false;
            this.redoPath()
        },
        toPoint: function(a, b, c) {
            this.targetEntity = null;
            Vec3.assign(this.targetPos, a);
            this.maxDistance = b || 0;
            this.precise = c || false;
            this.startRelativeVel = this.searcher.coll.relativeVel;
            this.searcher.faceDirFixed = false;
            this.redoPath()
        },
        redoPathDeferred: function() {
            this.mapVersion = -1
        },
        sideways: function(a, b, d, e, f, g,
            h, i) {
            var j = c(a),
                k = this.searcher.getCenter(l),
                a = a.getCenter(o),
                m = Vec2.distance(k, a);
            g && m < g && (m = g);
            h && m > h && (m = h);
            this._moveCircle(j, k, a, m, e, b - d, b + d, f, i)
        },
        dodge: function(a, b, c) {
            ig.navigation.getDodgePosition(A, this.searcher, a, b, c) ? this.toPoint(A, 0, false) : this.runAway(a, b, false)
        },
        moveRange: function(a, b, e, f, h, i) {
            var j = c(a);
            if (!j) return false;
            var k = this.searcher.getCenter(l),
                a = a.getCenter(o),
                m = Vec2.distance(k, a),
                w = h ? j.height : this.searcher.coll.pos.z,
                n = ig.navigation.tilesize,
                n = Math.ceil(Math.max(this.searcher.coll.size.x,
                    this.searcher.coll.size.y) / n),
                x = b;
            if (i && Math.abs(m - f) < b) {
                x = Math.abs(m - f);
                x < e && (x = e)
            }
            do {
                i = b = 0;
                if (m + x <= f) b = 0.5;
                else if (m - x < f) {
                    b = Math.pow(x, 2) + Math.pow(m, 2) - Math.pow(f, 2);
                    b = Math.acos(b / (2 * x * m)) / Math.PI / 2;
                    i = 1
                }
                var s = Vec2.sub(a, k, C),
                    p = 0,
                    z = 32 / (Math.PI * 2 * x),
                    v = 1,
                    q = Math.ceil(0.75 / z);
                if (Vec2.areClockwise(s, this.lastSideWayDir)) {
                    b = b * -1;
                    v = v * -1
                }
                for (; q--;) {
                    s = Vec2.sub(a, k, C);
                    Vec2.length(s, x);
                    Vec2.rotate(s, b * Math.PI * 2);
                    s = Vec2.add(k, s, A);
                    s.z = w;
                    Math.abs(Vec2.distance(s, a) - f);
                    var r = d(s, void 0, n, true);
                    if (r && (!h || g(r,
                            j, s, a, true))) {
                        s.z = r.height;
                        this.toPoint(s, this.searcher.coll.size.x / 2, false);
                        if (this.path) {
                            Vec2.assign(this.lastSideWayDir, s);
                            Vec2.sub(this.lastSideWayDir, k);
                            ig.perf.navigationMarker && ig.debugView.addMapPoint(s.x, s.y, s.z, 8, 8, "blue", 2);
                            return true
                        }
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(s.x, s.y, s.z, 8, 8, "green", 2)
                    } else ig.perf.navigationMarker && ig.debugView.addMapPoint(s.x, s.y, s.z, 8, 8, r ? "orange" : "red", 2);
                    if (i) {
                        i = i === 1 ? 2 : 1;
                        b = b * -1
                    }
                    if (i < 2) {
                        do {
                            p = p + z;
                            v = v * -1;
                            b = b + p * v
                        } while (i && (b < -z / 2 || b > 0.5 + z / 2))
                    }
                }
                x = x > e ? Math.max(e, x - 32) : -1
            } while (x >= e);
            return false
        },
        runAway: function(a, b, d) {
            for (var e = c(a), f = this.searcher.getCenter(l), a = a.getCenter(o), g = b; g > 0.5 * b;) {
                if (this._moveCircle(e, f, a, g, d)) break;
                g = g - b / 8
            }
        },
        runToFace: function(a, b, e, f, h) {
            var i = c(a);
            this.searcher.getCenter(l);
            var j = a.getCenter(o),
                k = ig.navigation.tilesize,
                k = Math.ceil(Math.max(this.searcher.coll.size.x, this.searcher.coll.size.y) / k),
                a = Vec2.assign(C, a.face);
            Vec2.rotate(a, b * Math.PI * 2);
            for (b = e; b < f;) {
                Vec2.length(a, b);
                e = Vec2.add(j, a, A);
                e.z = this.searcher.coll.pos.z;
                var m = d(e, void 0, k, true);
                if (m && (!h || g(m, i, e, j, true))) {
                    e.z = m.height;
                    this.toPoint(e, this.searcher.coll.size.x / 2, false);
                    if (this.path) return true
                }
                b = b + 16
            }
            return false
        },
        _moveCircle: function(a, b, c, e, f, h, i, j, k) {
            if (!a) return false;
            var m = f ? a.height : this.searcher.coll.pos.z,
                w = ig.navigation.tilesize,
                l = Vec2.sub(b, c, C);
            Vec2.length(C, e);
            var n = Math.random() > 0.5 ? 1 : -1,
                o = 0,
                e = 32 / (Math.PI * 2 * e),
                s = Math.ceil(1 / e),
                n = Vec2.areClockwise(l, this.lastSideWayDir) ? 1 : -1;
            if (h) {
                o = e * (h / 32);
                Vec2.rotate(l, Math.PI * 2 * o * -n);
                o = j ? e : o * 2
            }
            w = Math.ceil(Math.max(this.searcher.coll.size.x,
                this.searcher.coll.size.y) / w);
            if (i) {
                s = Math.ceil((i - (h || 0)) / 32 * 2).limit(1, s);
                j && (s = Math.ceil(s / 2))
            }
            for (h = null; s--;) {
                i = Vec2.add(c, l, A);
                i.z = m;
                var x = d(i, void 0, w, true);
                if (x && (!f || g(x, a, i, c, true))) {
                    h = i;
                    h.z = x.height;
                    this.toPoint(h, this.searcher.coll.size.x / 2, k || false);
                    if (this.path) {
                        ig.perf.navigationMarker && ig.debugView.addMapPoint(i.x, i.y, i.z, 8, 8, "blue", 2);
                        Vec2.assign(this.lastSideWayDir, h);
                        Vec2.sub(this.lastSideWayDir, b);
                        return true
                    }
                    ig.perf.navigationMarker && ig.debugView.addMapPoint(i.x, i.y, i.z, 8, 8, "green",
                        2)
                } else ig.perf.navigationMarker && ig.debugView.addMapPoint(i.x, i.y, i.z, 8, 8, x ? "orange" : "red", 2);
                if (!j) {
                    o = o + e;
                    n = n * -1
                }
                Vec2.rotate(l, Math.PI * 2 * o * -n)
            }
            return false
        },
        getDistance: function() {
            return this.path && this.path.distance || 0
        },
        getJumpCount: function() {
            return this.path && this.path.jumpCount || 0
        },
        isDestReachable: function() {
            return !!this.path
        },
        redoPath: function(b, d) {
            this.mapVersion = ig.navigation.mapVersion;
            this.retargetNode = null;
            var e = c(this.searcher),
                f, g;
            if (b) {
                f = b;
                Vec3.assign(this.targetPos, d);
                g = false
            } else {
                f =
                    this.targetEntity ? i(this.targetPos, this.searcher, this.targetEntity, this.options) : a(this.targetPos);
                g = this.targetEntity && this.targetEntity.jumping
            }
            this.pathIdx = -1;
            if (g || ig.navigation.isCachedFailure(e, f, this.searcher)) this.path = null;
            else {
                this.searcher.getCenter(H);
                (this.path = j(this.searcher, e, f, H, this.targetPos)) || ig.navigation.addCachedFailure(e, f, this.searcher)
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
            Vec2.assignC(this.avoidTarget2, 0, 0)
        },
        interrupt: function() {
            this.searcher.coll.relativeVel = this.startRelativeVel;
            this.searcher.fly.minHeight = 0;
            this.searcher.faceDirFixed = false
        },
        isCurrentNodeInvalid: function() {
            var a = c(this.searcher);
            return a && !a.airNode && (!this.path.nodes[this.pathIdx] || a != this.path.nodes[this.pathIdx].node) && (!this.path.nodes[this.pathIdx - 1] || a != this.path.nodes[this.pathIdx -
                1].node) && (!this.path.nodes[this.pathIdx + 1] || a != this.path.nodes[this.pathIdx + 1].node) ? true : false
        },
        moveEntity: function() {
            var b = !this.searcher.jumping && (this.searcher.coll.float.height || this.searcher.coll.pos.z == this.searcher.coll.baseZPos),
                d = this.mapVersion != ig.navigation.mapVersion;
            if (!d && b && this.path && this.pathIdx != -1 && !this.pathComplete)
                if (this.isCurrentNodeInvalid()) {
                    this.wrongNodeTimer = this.wrongNodeTimer + ig.system.tick;
                    this.wrongNodeTimer >= 0.3 && (d = true)
                } else this.wrongNodeTimer = 0;
            else this.wrongNodeTimer =
                0;
            if (d && !this.targetEntity) {
                Vec3.assign(this.retargetPos, this.targetPos);
                this.retargetNode = a(this.targetPos)
            }
            if (this.targetEntity && !this.targetEntity.jumping) {
                var e = i(A, this.searcher, this.targetEntity, this.options);
                if (e && !e.airNode) {
                    Vec3.assign(this.retargetPos, A);
                    this.retargetNode = e
                }
            }
            if (this.retargetNode && b) {
                Vec3.assign(this.targetPos, this.retargetPos);
                (d || !this.path || this.path.nodes.length == 0 || this.path.nodes[0].node != this.retargetNode) && this.redoPath(this.retargetNode, this.retargetPos);
                this.retargetNode =
                    null
            }
            if (this.searcher.coll.partlyBlockTimer > 0.5)
                if (this.overNodePass && !this.triedNodePassChange) {
                    this.triedNodePassChange = true;
                    this.overNodePass = 0
                } else if (this.triedRandom == -1) {
                Vec2.assignC(this.avoidTarget, 0, 0);
                Vec2.assignC(this.avoidTarget2, 0, 0);
                ig.navigation.dodgeEntities.erase(this.searcher);
                this.searcher.faceDirFixed = true;
                this.doBackUp = false;
                this.triedRandom = 0.3;
                Vec2.rotate(this.targetDir, (Math.random() - 0.5) * Math.PI);
                this.searcher.coll.partlyBlockTimer = 0
            } else this.redoPath();
            if (this.triedRandom >
                0) {
                this.triedRandom = this.triedRandom - ig.system.tick;
                if (this.triedRandom < 0) {
                    this.triedRandom = 0;
                    this.searcher.faceDirFixed = false
                }
                this.doBackUp && this.triedRandom < 0.5 ? Vec2.assignC(this.searcher.coll.accelDir, 0, 0) : Vec2.assign(this.searcher.coll.accelDir, this.targetDir);
                return false
            }
            this.searcher.getCenter(H);
            if (Vec2.isZero(this.avoidTarget)) {
                ig.navigation.dodgeEntities.erase(this.searcher);
                if (!this.path) return true;
                if (this.pathComplete && this.targetEntity && this.pathIdx == 1 && c(this.searcher) == this.path.nodes[1].node &&
                    !h(this.path.nodes[1].node, this.path.nodes[0].node, H, this.targetPos, this.searcher.coll.size.x)) this.pathComplete = false;
                this.pathComplete || this.runPath();
                if (this.pathComplete) {
                    Vec2.assign(this.targetDir, this.targetPos);
                    Vec2.sub(this.targetDir, H);
                    this.targetDist = Vec2.length(this.targetDir);
                    if (this.targetDist <= Math.max(this.precise ? 2 : 8, this.maxDistance + (this.firstMovement ? 16 : 0))) {
                        Vec2.assignC(this.targetDir, 0, 0);
                        this.searcher.jumping && Vec2.assignC(this.searcher.coll.vel, 0, 0);
                        Vec2.targetDist = 0;
                        this.searcher.coll.relativeVel =
                            this.startRelativeVel;
                        this.searcher.fly.minHeight = 0;
                        Vec2.assignC(this.searcher.coll.accelDir, 0, 0);
                        return !this.searcher.jumping
                    }
                    if (this.precise && this.searcher.coll.maxVel * this.searcher.coll.relativeVel > this.targetDist * 10) this.searcher.coll.relativeVel = this.targetDist / this.searcher.coll.maxVel * 10
                }
                this.firstMovement = false;
                this.avoidEntities();
                Vec2.assign(this.searcher.coll.accelDir, this.targetDir);
                return false
            }
            Vec2.assign(this.searcher.coll.accelDir, this.avoidTarget);
            Vec2.sub(this.searcher.coll.accelDir,
                H);
            if (Vec2.length(this.searcher.coll.accelDir) < 4)
                if (Vec2.isZero(this.avoidTarget2)) {
                    Vec2.assignC(this.avoidTarget, 0, 0);
                    this.redoPath()
                } else {
                    Vec2.assign(this.avoidTarget, this.avoidTarget2);
                    Vec2.assignC(this.avoidTarget2, 0, 0)
                }
        },
        avoidEntities: function() {
            if (!(this.searcher.coll.type == ig.COLLTYPE.IGNORE || this.searcher.coll.ignoreCollision || this.searcher.coll.type == ig.COLLTYPE.TRIGGER)) {
                if (!this.targetEntity) {
                    ig.game.physics.initTraceResult(y);
                    Vec2.assign(u, this.targetDir);
                    this.targetDist > 48 && Vec2.length(u,
                        48);
                    var a = [],
                        b = this.searcher.coll;
                    if (ig.game.traceEntity(y, this.searcher, u.x, u.y, 0, 0, 0, ig.COLLTYPE.BLOCK, a)) {
                        var c;
                        Vec2.normalize(u);
                        if (Math.abs(Vec2.dot(u, y.dir)) < 0.8 || a.length == 0) return;
                        for (var d = a.length; d--;) {
                            var e = a[d].entity;
                            if (e instanceof ig.ActorEntity && ig.navigation.dodgeEntities.indexOf(e) == -1) {
                                if (Vec2.isZero(e.coll.accelDir)) {
                                    c = e;
                                    break
                                }
                                Vec2.normalize(e.coll.accelDir, C)
                            }
                        }
                        if (!c) return;
                        a = c.coll;
                        c.getCenter(z);
                        this.searcher.getCenter(D);
                        Vec2.sub(z, D, C);
                        if (Vec2.dot(C, u) <= 0) return;
                        Vec2.sub(z,
                            this.targetPos, C);
                        if (Math.abs(C.x) < a.size.x / 2 + b.size.x / 2 && Math.abs(C.y) < a.size.y / 2 + b.size.y / 2) return;
                        c = (a.size.x + 4) / 2;
                        b = (b.size.x + 4) / 2;
                        a = Vec2.assign(L, u);
                        Vec2.normalize(a);
                        d = Vec2.assign(M, u);
                        Vec2.rotate90CW(d);
                        Vec2.length(d, c + b);
                        e = Vec2.sub(z, D, C);
                        Vec2.dot(d, e) > 0 && Vec2.flip(d);
                        Vec2.addMulF(z, a, -c - b);
                        Vec2.add(z, d);
                        Vec2.assign(D, z);
                        Vec2.addMulF(D, d, -2);
                        Vec2.assign(u, a);
                        Vec2.length(u, c * 2 + b * 2);
                        Vec2.sub(z, H, C);
                        ig.game.physics.initTraceResult(y);
                        if (!ig.game.traceEntity(y, this.searcher, C.x, C.y, 0, 0, 0, null)) {
                            Vec2.sub(this.targetPos,
                                z, L);
                            Vec2.length(L) < Vec2.length(u) && Vec2.assign(u, L);
                            ig.game.physics.initTraceResult(y);
                            if (!ig.game.traceEntity(y, this.searcher, u.x, u.y, C.x, C.y, 0, null)) {
                                Vec2.assign(this.avoidTarget, z);
                                Vec2.assign(this.avoidTarget2, z);
                                Vec2.add(this.avoidTarget2, u)
                            }
                        }
                        if (Vec2.isZero(this.avoidTarget)) {
                            Vec2.sub(D, H, C);
                            y.dist = 1;
                            if (!ig.game.traceEntity(y, this.searcher, C.x, C.y, 0, 0, 0, null)) {
                                Vec2.sub(this.targetPos, D, L);
                                Vec2.length(L) < Vec2.length(u) && Vec2.assign(u, L);
                                y.dist = 1;
                                if (!ig.game.traceEntity(y, this.searcher, u.x, u.y,
                                        C.x, C.y, 0, null)) {
                                    Vec2.assign(this.avoidTarget, D);
                                    Vec2.assign(this.avoidTarget2, D);
                                    Vec2.add(this.avoidTarget2, u)
                                }
                            }
                        }
                    }
                }
                Vec2.isZero(this.avoidTarget) || ig.navigation.dodgeEntities.push(this.searcher)
            }
        },
        runPath: function() {
            if (this.path.nodes.length <= 1) this.pathComplete = true;
            else {
                if (this.pathIdx == -1) {
                    this.pathIdx = this.path.nodes.length - 1;
                    this.overNodePass = 0;
                    this.triedNodePassChange = false;
                    this.triedRandom = -1;
                    this.selectNextTargetPos()
                }
                if (!this.nextNodeData.jump && this.pathIdx == 1 && h(this.path.nodes[1].node,
                        this.path.nodes[0].node, H, this.targetPos, this.searcher.coll.size.x)) {
                    this.searcher.coll.relativeVel = this.startRelativeVel;
                    this.pathComplete = true
                } else {
                    Vec2.assign(this.targetDir, this.overNodePass ? this.nextNodeData.endPos : this.nextNodeData.startPos);
                    Vec2.sub(this.targetDir, H);
                    this.targetDist = Vec2.length(this.targetDir);
                    this.searcher.coll.relativeVel = this.nextNodeData.jump && this.overNodePass ? 1 : this.startRelativeVel;
                    if (this.searcher.fly.height) this.searcher.fly.minHeight = this.nextNodeData.height;
                    if (this.targetDist <
                        8)
                        if (this.nextNodeData.jump && !this.overNodePass && this.searcher.jumping) {
                            Vec2.sub(this.targetDir, 0, 0);
                            Vec2.assignC(this.searcher.coll.vel, 0, 0);
                            this.targetDist = 0
                        } else {
                            this.overNodePass = this.overNodePass ? 0 : 1;
                            if (!this.overNodePass) {
                                this.pathIdx--;
                                if (this.pathIdx == 0) {
                                    this.searcher.coll.relativeVel = this.startRelativeVel;
                                    this.pathComplete = true;
                                    this.nextNodeData.jump = false
                                } else {
                                    this.triedNodePassChange = false;
                                    this.selectNextTargetPos()
                                }
                            }
                        }
                    else this.nextNodeData.jump && (this.overNodePass && !this.searcher.jumping &&
                        this.isCurrentNodeInvalid()) && this.redoPath()
                }
            }
        },
        selectNextTargetPos: function() {
            var a = this.nextNodeData,
                b = this.path.nodes,
                c = this.pathIdx,
                d = this.searcher,
                e = this.targetPos,
                f = b[c].node,
                g = b[c].connection,
                h = g.edges,
                i = ig.navigation.tilesize,
                j = d.coll.size.x / 2;
            g.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP && (j = 8);
            var m = j + F;
            d.getCenter(H);
            var w = e;
            a.height = f.height;
            if (c > 1) {
                w = b[c - 1].connection;
                a.height = b[c - 1].node.height;
                Line2.closestEntry(J, w.waypointMin, w.waypointMax, a.height, 1, H, e, j, m);
                w = J
            }
            for (var l = h.length,
                    n = void 0, o, b = -1, c = null, s = false; l--;) {
                var x = h[l],
                    p = s || !x.block[0] && !x.block[1] ? 4 : j;
                o = Line2.closestEntry(K, x.min, x.max, f.height, i, H, w, p, m, N);
                if (o !== false && (n === void 0 || n > o)) {
                    n = o;
                    c = x;
                    b = o == 0 && !N.closeToEdge ? -1 : N.finalWeight < 0.5 ? 0 : 1;
                    k(K, f.center, x, f, i, d, -0.5, O * 2);
                    Vec2.assign(a.startPos, K);
                    if (g.type != ig.NAV_CONNECTION_TYPE.SAME_LEVEL_JUMP) {
                        a.jump = false;
                        k(K, f.center, x, f, i, d, 1, O * 2 + (g.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL ? 16 : 0))
                    } else {
                        a.jump = true;
                        o = g.jumpInfo.destEdge;
                        Line2.closestEntry(K, o.min, o.max, f.height,
                            i, H, e, p, m);
                        k(K, a.startPos, o, f, i, d, 0.5, O * 2)
                    }
                    Vec2.assign(a.endPos, K)
                }
                if (!l && !c && !s) {
                    s = true;
                    l = h.length
                }
            }(e = g.type == ig.NAV_CONNECTION_TYPE.SAME_LEVEL || g.type == ig.NAV_CONNECTION_TYPE.LOWER_LEVEL || g.type == ig.NAV_CONNECTION_TYPE.LOWER_STAIRS) && b != -1 && c.block[b] && (e = false);
            if (e) {
                f = Vec2.lerp(a.startPos, a.endPos, 0.5, M);
                w = Vec2.assign(L, w);
                Vec2.sub(w, f);
                f = Vec2.sub(f, H);
                Vec2.angle(f, w) > Math.PI * 0.4 && (e = false)
            }!e && !a.jump && !d.jumping && Vec2.distance(H, a.startPos) < 4 && (e = true);
            if (e) {
                this.overNodePass = 2;
                Vec2.lerp(this.nextNodeData.endPos,
                    this.nextNodeData.startPos, 0.5, this.nextNodeData.endPos);
                if (ig.perf.navigationMarker) {
                    a = this.nextNodeData.endPos;
                    ig.debugView.addMapPoint(a.x, a.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "green", 2)
                }
            } else {
                if (!this.nextNodeData.jump || !this.searcher.jumping) {
                    Vec2.assign(E, this.nextNodeData.endPos);
                    Vec2.sub(E, this.nextNodeData.startPos);
                    Vec2.assign(G, this.nextNodeData.startPos);
                    Vec2.sub(G, H);
                    if (Vec2.dot(E, G) <= 0) {
                        Vec2.assign(E, this.nextNodeData.endPos);
                        Vec2.sub(E, this.nextNodeData.startPos);
                        Vec2.normalize(E);
                        Vec2.assign(G, H);
                        Vec2.sub(G, this.nextNodeData.startPos);
                        Vec2.mulF(E, Vec2.dot(E, G));
                        Vec2.sub(G, E);
                        if (Vec2.length(G) < this.searcher.coll.size.x) this.overNodePass = 1
                    }
                }
                if (ig.perf.navigationMarker) {
                    a = this.nextNodeData.startPos;
                    ig.debugView.addMapPoint(a.x, a.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "yellow", 2);
                    a = this.nextNodeData.endPos;
                    ig.debugView.addMapPoint(a.x, a.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "yellow",
                        2)
                }
            }
            if (this.nextNodeData.jump && ig.perf.navigationMarker) {
                a = this.nextNodeData.startPos;
                ig.debugView.addMapPoint(a.x, a.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "red", 2);
                a = this.nextNodeData.endPos;
                ig.debugView.addMapPoint(a.x, a.y, this.searcher.coll.pos.z, this.searcher.coll.size.x, this.searcher.coll.size.y, "blue", 2)
            }
        }
    });
    var w = Vec2.create(),
        x = Vec3.create(),
        E = Vec2.create(),
        G = Vec2.create(),
        J = Vec2.create(),
        I = 0,
        K = Vec2.create(),
        H = Vec2.create(),
        M = Vec2.create(),
        L = Vec2.create(),
        N = {},
        F = 0,
        O = 4;
    ig.NavExternalBlockers = {
        blockers: [],
        register: function(a) {
            this.blockers.push(a)
        },
        check: function(a, b) {
            for (var c = this.blockers.length; c--;)
                if (this.blockers[c](a, b)) return true;
            return false
        }
    }
});
ig.baked = !0;
