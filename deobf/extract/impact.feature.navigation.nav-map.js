ig.module("impact.feature.navigation.nav-map").requires("impact.base.map", "impact.base.image", "game.config").defines(function() {
    function b(a, b, c, d, e, f, g, h) {
        var i = 0,
            j = 0;
        b.min.x - b.max.x ? j = b.min.y * e + d < c.center.y ? f : -f : i = b.min.x * e < c.center.x ? f : -f;
        var f = b.min.x * e + i + Math.abs(j),
            k = b.min.y * e + j + Math.abs(i),
            l = b.max.x * e + i - Math.abs(j),
            n = b.max.y * e + j - Math.abs(i);
        ig.Debug.drawLine(a, f, k, l, n, h || 2);
        b.block[0] && ig.Debug.drawCircle("red", f, k, 4);
        b.block[1] && ig.Debug.drawCircle("red", l, n, 4);
        if (g) {
            b = Vec2.mulF(Vec2.lerp(b.min,
                b.max, 0.5, o), e);
            c = Vec2.lerp(b, c.center, 0.75, m);
            ig.Debug.drawLine(a, b.x + i, b.y + j, c.x, c.y - d * 0.75, h || 2)
        }
    }

    function a(a, b, c, d) {
        var e, g, h;
        if (d) {
            e = d.minX;
            g = d.maxX + 1;
            h = d.minY;
            d = d.maxY + 1
        } else {
            e = 0;
            g = a.width;
            h = 0;
            d = a.height
        }
        for (; h < d; ++h)
            for (var i = e; i < g; ++i) {
                var j = f(a, b, i, h);
                if (j && j < u && !a.getGridNodeId(i, h)) {
                    var j = a,
                        k = j.nodes.length + 1;
                    j.freeNodeIds.length > 0 && (k = j.freeNodeIds.pop());
                    if (k >= 2048) throw Error("Exceeded NavMap id range of 2048! Simplify Nav Map of height " + j.zHeight / 16);
                    j = k;
                    k = new ig.PathNode(j, a, b, i,
                        h, c);
                    a.nodes[j - 1] = k
                }
            }
    }

    function d(a, b) {
        if (a.tmpSearchId != b) {
            a.tmpSearchId = b;
            a.tmpCameFromNode = null;
            a.tmpCameFromNeighbour = null;
            a.tmpClosed = false;
            a.tmpGScore = -1;
            a.tmpFScore = -1
        }
    }

    function c(a, b) {
        a.airConnected = false;
        for (var c = a.neighbours.length; c--;)
            if (a.neighbours[c].node == b) {
                a.neighbours.splice(c, 1);
                return
            } for (c = a.airNeighbours.length; c--;)
            if (a.airNeighbours[c].node == b) {
                a.airNeighbours.splice(c, 1);
                break
            }
    }

    function e(a, b, c, d, f) {
        if (a.getGridNodeId(c, d) == b.id) {
            a.setGridNodeId(c, d, 0);
            a.clearGridBuildFlags(c,
                d);
            f.minX = Math.min(f.minX, c);
            f.maxX = Math.max(f.maxX, c);
            f.minY = Math.min(f.minY, d);
            f.maxY = Math.max(f.maxY, d);
            for (var g = 0; g < D.length; ++g) {
                var h = D[g];
                e(a, b, c + h.x, d + h.y, f)
            }
        }
    }

    function f(a, b, c, d) {
        var e = a.getGridAreaFlag(c, d);
        if (e < u || e > z)
            if (ig.CollMapTools.isTileBlocked(b.getGridTile(c, d)) || a.getEntityFlagValue(c, d, ig.NAV_ENTITY_FLAG.BLOCK)) return 0;
        return e
    }

    function g(a, b, c, d) {
        var e = f(a, b, c, d);
        e != y.FENCE && (!a.getGridForceGround(c, d) && !a.getEntityFlagValue(c, d, ig.NAV_ENTITY_FLAG.GROUND) && b && b.isGridHole(c,
            d)) && (e = e + v);
        return e
    }

    function h(a, b, c) {
        a.block = [0, 0];
        if (c)
            if (a.min.x != a.max.x) {
                if (!g(b, c, a.min.x - 1, a.min.y - 1) || !g(b, c, a.min.x - 1, a.min.y)) a.block[0] = 1;
                if (!g(b, c, a.max.x, a.min.y - 1) || !g(b, c, a.max.x, a.min.y)) a.block[1] = 1
            } else {
                if (!g(b, c, a.min.x - 1, a.min.y - 1) || !g(b, c, a.min.x, a.min.y - 1)) a.block[0] = 1;
                if (!g(b, c, a.min.x - 1, a.max.y) || !g(b, c, a.min.x, a.max.y)) a.block[1] = 1
            }
    }

    function i(a, b, c, d, e, f, g, i) {
        for (var k = 0; k < c.length; ++k) {
            var m = c[k],
                l = 0,
                o = 0,
                n = 0,
                s = 0,
                p = 0;
            if (m.min.x - m.max.x) {
                n = 1;
                p = m.max.x - m.min.x;
                o = a.getGridNodeId(m.min.x,
                    m.min.y) == b.id ? -1 : 0
            } else {
                s = 1;
                p = m.max.y - m.min.y;
                l = a.getGridNodeId(m.min.x, m.min.y) == b.id ? -1 : 0
            }
            for (var z = null, v = m.min.x, q = m.min.y, r = 0, y = m.min.x, u = m.min.y; r < p; ++r, y = y + n, u = u + s) {
                for (var D = null, m = 0; !D && m < d.length; ++m) D = d[m].getGridNode(y + l, u + o + e[m]);
                if (D != z) {
                    if (z) {
                        m = {
                            min: {
                                x: v,
                                y: q
                            },
                            max: {
                                x: y,
                                y: u
                            }
                        };
                        h(m, a);
                        j(a, b, z, m, f, g, i)
                    }
                    z = D;
                    v = y;
                    q = u
                }
            }
            if (z) {
                m = {
                    min: {
                        x: v,
                        y: q
                    },
                    max: {
                        x: y,
                        y: u
                    }
                };
                h(m, a);
                j(a, b, z, m, f, g, i)
            }
        }
    }

    function j(a, b, c, d, e, f, g) {
        if (g && (c.edges.up.length > 0 || c.edges.upStairs.length > 0)) c.airConnected = false;
        for (g = b.neighbours.length; g--;) {
            var h =
                b.neighbours[g];
            if (h.node == c && h.shared.type == e) {
                h.shared.edges.push(d);
                f && h.shared.reverse && h.shared.reverse.edges.push(k(a, b, c, d));
                return
            }
        }
        e = new ig.PathNodeConnect(e);
        e.edges.push(d);
        b.neighbours.push({
            node: c,
            shared: e
        });
        c.airNeighbours.push({
            node: b,
            shared: e
        });
        if (f) {
            f = new ig.PathNodeConnect(f);
            f.edges.push(k(a, b, c, d));
            e.reverse = f;
            c.neighbours.push({
                node: b,
                shared: f
            });
            b.airNeighbours.push({
                node: c,
                shared: f
            })
        }
    }

    function k(a, b, c, d) {
        d = ig.copy(d);
        a = (c.height - b.height) / a.tilesize;
        d.min.y = d.min.y - a;
        d.max.y =
            d.max.y - a;
        return d
    }
    var l = ["red", "blue", "green", "yellow", "pink", "orange", "violet", "brown"],
        o = Vec2.create(),
        m = Vec2.create(),
        n = Vec2.create(),
        p = {
            bitOffset: 0,
            map: 31
        },
        r = {
            bitOffset: 5,
            map: 1
        },
        t = {
            bitOffset: 8,
            map: 15
        },
        q = {
            bitOffset: 12,
            map: 2047
        };
    ig.NAV_ENTITY_FLAG = {
        BLOCK: {
            bitOffset: 23,
            map: 7
        },
        GROUND: {
            bitOffset: 26,
            map: 7
        }
    };
    var s = [];
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
        init: function(a, b) {
            this.parent(a, b)
        },
        levelInit: function(b) {
            a(this, ig.game.levels[b].collision, this.zHeight);
            this.initialized = true
        },
        reparse: function(b, c, d, e, f) {
            if (this.initialized) {
                for (var g = {
                        minX: c,
                        maxX: d,
                        minY: e,
                        maxY: f
                    }, h = e - 1; h <= f + 1; ++h)
                    for (var i = c - 1; i <= d + 1; ++i)
                        if (!(i ==
                                c - 1 || i == d + 1) || !(h == e - 1 || h == f + 1)) {
                            var j = this.getGridNode(i, h);
                            if (j) {
                                j.erase(this, i, h, g);
                                this.nodes[j.id - 1] = null;
                                this.freeNodeIds.push(j.id)
                            }
                        } a(this, ig.game.levels[b].collision, this.zHeight, g)
            }
        },
        connectAirNodes: function(a) {
            for (var b = a, c = [], d = [], e = ig.game.levels[a].height; --b >= 0;)
                if (ig.game.levels[b].navigation) {
                    c.push(ig.game.levels[b].navigation);
                    d.push((e - ig.game.levels[b].height) / this.tilesize)
                } for (var f = a, a = [], b = []; ++f < ig.game.maxLevel;)
                if (ig.game.levels[f].navigation) {
                    a.push(ig.game.levels[f].navigation);
                    b.push((e - ig.game.levels[f].height) / this.tilesize)
                } for (e = s.length = 0; e < this.nodes.length; ++e)
                if ((f = this.nodes[e]) && !f.airNode && !f.airConnected) {
                    f.airConnected = true;
                    c.length && i(this, f, f.edges.down, c, d, C.LOWER_LEVEL, C.UPPER_FLY, true);
                    if (a.length) {
                        i(this, f, f.edges.up, a, b, C.UPPER_LEVEL);
                        i(this, f, f.edges.upStairs, a, b, C.UPPER_STAIRS, C.LOWER_STAIRS)
                    }
                    for (var g = f, h = c, j = d, k = 0; k < g.neighbours.length; ++k) {
                        var m = g.neighbours[k],
                            l = m.node;
                        if (l.airNode && m.shared.type == C.SAME_LEVEL) {
                            if (!l.airConnected) {
                                l.airConnected =
                                    true;
                                h.length && i(this, l, l.edges.down, h, j, C.LOWER_LEVEL)
                            }
                            for (var l = m.node.neighbours, o = 0; o < l.length; ++o) {
                                var n = l[o],
                                    p = n.shared.type;
                                if (!(p == C.UPPER_FLY || p == C.UPPER_LEVEL) && n.node != g && !n.node.airNode) {
                                    for (var p = g, z = p.neighbours, v = z.length, q = null; v--;)
                                        if (z[v].node == n.node) {
                                            q = z[v];
                                            break
                                        } if (!(q && q.shared.type != C.SAME_LEVEL_JUMP)) {
                                        for (var r = z = void 0, y = v = void 0, u = m.shared.edges, D = n.shared.edges, t = 0; t < u.length; ++t)
                                            for (var A = Vec2.distance(u[t].min, u[t].max), Q = 0; Q < D.length; ++Q) {
                                                var R = Vec2.distance(D[Q].min,
                                                        D[Q].max),
                                                    R = Math.min(R, A),
                                                    U = Line2.distanceLineToLine(u[t].min, u[t].max, D[Q].min, D[Q].max);
                                                if (z == void 0 || R > r || R == r && U < z) {
                                                    z = U;
                                                    r = R;
                                                    v = u[t];
                                                    y = D[Q]
                                                }
                                            }
                                        z = z * this.tilesize;
                                        if (q) {
                                            if (q.shared.jumpInfo.jumpDist > z) {
                                                q.shared.edges = [v];
                                                q.shared.jumpInfo.jumpDist = z
                                            }
                                        } else {
                                            q = new ig.PathNodeConnect(C.SAME_LEVEL_JUMP);
                                            q.edges.push(v);
                                            q.jumpInfo = {
                                                jumpDist: z,
                                                destEdge: y
                                            };
                                            q = {
                                                node: n.node,
                                                shared: q
                                            };
                                            p.neighbours.push(q)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    s.push(f);
                    for (g = f.neighbours.length; g--;) {
                        h = f.neighbours[g].shared;
                        j = h.waypointMin;
                        k = h.waypointMax;
                        m =
                            h.jumpInfo ? [h.jumpInfo.destEdge] : h.edges;
                        l = m.length;
                        o = 0;
                        p = true;
                        for (n = 0; n < l; ++n) {
                            o = Math.max(o, Vec2.distance(m[n].min, m[n].max) * this.tilesize);
                            if (!m[n].block[0] || !m[n].block[1]) o = Math.max(o, 64);
                            if (p) {
                                p = false;
                                Vec2.assign(j, m[n].min);
                                Vec2.assign(k, m[n].max)
                            } else {
                                Vec2.min(j, m[n].min);
                                Vec2.max(k, m[n].max)
                            }
                        }
                        Vec2.mulF(j, this.tilesize);
                        Vec2.mulF(k, this.tilesize);
                        h.maxEdgeLength = o;
                        if (h.reverse) {
                            h.reverse.maxEdgeLength = o;
                            Vec2.assign(h.reverse.waypointMin, j);
                            Vec2.assign(h.reverse.waypointMax, k)
                        }
                    }
                }
        },
        draw: function(a) {
            ig.system.context.font =
                "bold 8px Arial, sans-serif";
            ig.system.context.globalAlpha = 1;
            ig.system.context.save();
            for (var c = 0; c < this.nodes.length; ++c) {
                var d = this.nodes[c];
                if (d) {
                    for (var e = l[d.id % 8], f = 0; f < d.neighbours.length; ++f)
                        if (!d.neighbours[f].node.airNode) {
                            for (var g = d.neighbours[f].shared.edges, h = 0; h < g.length; ++h) b(e, g[h], d, a, this.tilesize, 1, false);
                            g = Vec2.lerp(d.neighbours[f].shared.waypointMin, d.neighbours[f].shared.waypointMax, 0.5, n);
                            h = Vec2.lerp(g, d.center, 0.75, o);
                            ig.Debug.drawLine(e, g.x, g.y, h.x, h.y - a * 0.75, 1)
                        } for (f = 0; f <
                        d.edges.block.length; ++f) b("red", d.edges.block[f], d, a, this.tilesize, -2, false, 2);
                    for (f = 0; f < d.edges.airBlock.length; ++f) b("blue", d.edges.airBlock[f], d, a, this.tilesize, -2, false, 2);
                    for (f = 0; f < d.edges.down.length; ++f) b("white", d.edges.down[f], d, a, this.tilesize, -2, false, 2);
                    for (f = 0; f < d.edges.up.length; ++f) b("white", d.edges.up[f], d, a, this.tilesize, -2, false, 2);
                    for (f = 0; f < d.edges.upStairs.length; ++f) b("yellow", d.edges.upStairs[f], d, a, this.tilesize, -2, false, 2);
                    ig.Debug.fillRect(d.airNode ? "white" : "black", d.center.x -
                        8, d.center.y - a - 4, 12, 7);
                    ig.Debug.drawText(c + 1 < 10 ? "0" + (c + 1) : c + 1, e, d.center.x - 6, d.center.y - a + 2)
                }
            }
            ig.system.context.restore()
        },
        _getGridValue: function(a, b, c) {
            return this.getGridTile(a, b) >> c.bitOffset & c.map
        },
        _setGridValue: function(a, b, c, d) {
            var c = (c & d.map) << d.bitOffset,
                e = this.getGridTile(a, b);
            this.setGridTile(a, b, e & ~(d.map << d.bitOffset) | c)
        },
        _setGridFlag: function(a, b, c, d) {
            c = c << d.bitOffset;
            d = this.getGridTile(a, b);
            this.setGridTile(a, b, d | c)
        },
        _clearGridFlag: function(a, b, c, d) {
            c = c << d.bitOffset;
            d = this.getGridTile(a,
                b);
            this.setGridTile(a, b, d & ~c)
        },
        getEntityFlagValue: function(a, b, c) {
            return this._getGridValue(a, b, c)
        },
        setEntityFlagValue: function(a, b, c, d) {
            this._setGridValue(a, b, c, d)
        },
        increaseEntityFlagValue: function(a, b, c) {
            var d = this.getEntityFlagValue(a, b, c);
            return this.setEntityFlagValue(a, b, d + 1, c)
        },
        decreaseEntityFlagValue: function(a, b, c) {
            var d = this.getEntityFlagValue(a, b, c);
            this.setEntityFlagValue(a, b, d - 1, c)
        },
        getGridAreaFlag: function(a, b) {
            return this._getGridValue(a, b, p)
        },
        getGridForceGround: function(a, b) {
            return this._getGridValue(a,
                b, r)
        },
        getGridNode: function(a, b) {
            var c = this.getGridNodeId(a, b);
            return c && this.nodes[c - 1]
        },
        getGridNodeId: function(a, b) {
            return this._getGridValue(a, b, q)
        },
        setGridNodeId: function(a, b, c) {
            return this._setGridValue(a, b, c, q)
        },
        getGridBuildFlags: function(a, b) {
            return this._getGridValue(a, b, t)
        },
        setGridBuildFlag: function(a, b, c) {
            return this._setGridFlag(a, b, c, t)
        },
        clearGridBuildFlags: function(a, b) {
            return this._setGridValue(a, b, 0, t)
        },
        getNode: function(a, b) {
            a = Math.floor(a / this.tilesize);
            b = Math.floor(b / this.tilesize);
            return this.getGridNode(a, b)
        }
    });
    ig.MAP.Navigation.levelKey = "navigation";
    var v = 256,
        y = {
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
        u = y.JUMP,
        z = y.FENCE;
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
        init: function(a, b, c, d, e, f) {
            this.id = a;
            this.height = f;
            Vec2.assignC(this.min, d * b.tilesize, e * b.tilesize + f);
            Vec2.assignC(this.max, (d + 1) * b.tilesize, (e + 1) * b.tilesize + f);
            this.airNode = !b.getGridForceGround(d, e) && !b.getEntityFlagValue(d, e, ig.NAV_ENTITY_FLAG.GROUND) && c && c.isGridHole(d, e);
            a = d;
            A.length = 0;
            b.setGridNodeId(a, e, this.id);
            for (A.push({
                    x: a,
                    y: e
                }); A.length > 0;) {
                e = A.pop();
                a = e.x;
                e = e.y;
                Vec2.minC(this.min, a * b.tilesize,
                    e * b.tilesize + f);
                Vec2.maxC(this.max, (a + 1) * b.tilesize, (e + 1) * b.tilesize + f);
                d = g(b, c, a, e);
                if (!d) throw Error("Tried to expand to field with 0 source value");
                for (var i, j = 0; j < D.length; ++j) {
                    var k = D[j];
                    if (!(b.getGridBuildFlags(a, e) & k.flag)) {
                        var m = a + k.x,
                            l = e + k.y;
                        i = g(b, c, m, l);
                        if (d == i) {
                            b.setGridBuildFlag(a, e, k.flag);
                            if (!b.getGridNodeId(m, l)) {
                                b.setGridNodeId(m, l, this.id);
                                A.push({
                                    x: m,
                                    y: l
                                })
                            }
                        } else {
                            var m = b,
                                o = c,
                                n = a,
                                l = e,
                                s = d,
                                p = i,
                                q = m.getGridNodeId(n + k.x, l + k.y);
                            i = p & v;
                            if (q) a: {
                                for (var o = m.nodes[q - 1], q = n + (k.x > 0 ? 1 : 0) + (k.y ? 0.5 :
                                        0), s = l + (k.y > 0 ? 1 : 0) + (k.x ? 0.5 : 0), r = o.edges[k.edgeSrc], t = r.length; t--;) {
                                    p = r[t];
                                    if (s >= p.min.y && s <= p.max.y && q >= p.min.x && q <= p.max.x) {
                                        i && !this.airNode && this.edges.down.push(p);
                                        this.edges[k.edgeDest].push(p);
                                        if (k.x)
                                            for (i = p.min.y; i < p.max.y; ++i) m.setGridBuildFlag(n, i, k.flag);
                                        else
                                            for (i = p.min.x; i < p.max.x; ++i) m.setGridBuildFlag(i, l, k.flag);
                                        for (m = this.neighbours.length; m--;)
                                            if (this.neighbours[m].node == o) {
                                                this.neighbours[m].shared.edges.push(p);
                                                break a
                                            } m = new ig.PathNodeConnect(C.SAME_LEVEL);
                                        m.edges.push(p);
                                        this.neighbours.push({
                                            node: o,
                                            shared: m
                                        });
                                        o.neighbours.push({
                                            node: this,
                                            shared: m
                                        });
                                        break a
                                    }
                                }
                                throw Error("Didn't find any edge when something should have been found");
                            }
                            else {
                                r = n;
                                for (q = l; g(m, o, r, q) == s && g(m, o, r + k.x, q + k.y) == p;) {
                                    m.setGridBuildFlag(r, q, k.flag);
                                    r = r + k.y;
                                    q = q + k.x
                                }
                                r = r - k.y;
                                q = q - k.x;
                                n = n - k.y;
                                for (l = l - k.x; g(m, o, n, l) == s && g(m, o, n + k.x, l + k.y) == p;) {
                                    m.setGridBuildFlag(n, l, k.flag);
                                    n = n - k.y;
                                    l = l - k.x
                                }
                                n = n + k.y;
                                l = l + k.x;
                                s = Math.min(r, n) + (k.x > 0 ? 1 : 0);
                                t = Math.min(q, l) + (k.y > 0 ? 1 : 0);
                                n = Math.max(r, n) + (k.x > 0 ? 1 : 0) + (k.y ? 1 : 0);
                                l = Math.max(q, l) + (k.y > 0 ? 1 : 0) + (k.x ?
                                    1 : 0);
                                l = {
                                    min: {
                                        x: s,
                                        y: t
                                    },
                                    max: {
                                        x: n,
                                        y: l
                                    }
                                };
                                h(l, m, o);
                                i && this.edges.down.push(l);
                                m = p % v;
                                m == y.JUMP || m == k.upValue ? this.airNode || this.edges.up.push(l) : m == y.STAIRS || m == k.stairValue ? this.airNode || this.edges.upStairs.push(l) : !m || m >= u && m <= z ? i && !this.airNode ? this.edges.airBlock.push(l) : this.edges.block.push(l) : m && this.edges[k.edgeDest].push(l)
                            }
                        }
                    }
                }
            }
            Vec2.lerp(this.min, this.max, 0.5, this.center)
        },
        erase: function(a, b, d, f) {
            for (var g = this.neighbours.length; g--;) c(this.neighbours[g].node, this);
            for (g = this.airNeighbours.length; g--;) c(this.airNeighbours[g].node,
                this);
            e(a, this, b, d, f)
        },
        isClosed: function(a) {
            d(this, a);
            return this.tmpClosed
        },
        setClosed: function(a, b) {
            d(this, a);
            this.tmpClosed = b
        },
        getCameFromNode: function(a) {
            d(this, a);
            return this.tmpCameFromNode
        },
        getCameFromNeighbour: function(a) {
            d(this, a);
            return this.tmpCameFromNeighbour
        },
        getCameFromPos: function(a) {
            d(this, a);
            return this.tmpCameFromPos
        },
        setCameFrom: function(a, b, c, e) {
            d(this, a);
            this.tmpCameFromNode = b;
            this.tmpCameFromNeighbour = c;
            Vec2.assign(this.tmpCameFromPos, e)
        },
        getGScore: function(a) {
            d(this, a);
            return this.tmpGScore
        },
        setGScore: function(a, b) {
            d(this, a);
            this.tmpGScore = b
        },
        getFScore: function(a) {
            d(this, a);
            return this.tmpFScore
        },
        setFScore: function(a, b) {
            d(this, a);
            this.tmpFScore = b
        },
        hasGScore: function() {
            return this.getGScore() != -1
        }
    });
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
        init: function(a) {
            this.type =
                a
        },
        getSearchData: function(a) {
            if (this.searchData.idx != a) {
                this.searchData.idx = a;
                Vec2.assignC(this.searchData.pos, 0, 0);
                this.searchData.fromNode = null;
                this.searchData.toNode = null;
                this.searchData.fromEdge = null;
                this.searchData.gScore = -1;
                this.searchData.fScore = -1;
                this.searchData.closed = false
            }
            return this.searchData
        },
        setExternalData: function(a, b) {
            this.externalData[a] = b;
            ig.navigation.clearCachedFailures()
        }
    });
    var D = [{
            x: 0,
            y: -1,
            flag: 1,
            edgeDest: "north",
            edgeSrc: "south",
            upValue: y.JUMP_S,
            stairValue: y.STAIRS_S
        }, {
            x: 1,
            y: 0,
            flag: 2,
            edgeDest: "east",
            edgeSrc: "west",
            upValue: y.JUMP_W,
            stairValue: y.STAIRS_W
        }, {
            x: 0,
            y: 1,
            flag: 4,
            edgeDest: "south",
            edgeSrc: "north",
            upValue: y.JUMP_N,
            stairValue: y.STAIRS_N
        }, {
            x: -1,
            y: 0,
            flag: 8,
            edgeDest: "west",
            edgeSrc: "east",
            upValue: y.JUMP_E,
            stairValue: y.STAIRS_E
        }],
        C = ig.NAV_CONNECTION_TYPE = {
            SAME_LEVEL: 0,
            LOWER_LEVEL: 1,
            UPPER_LEVEL: 2,
            LOWER_STAIRS: 3,
            UPPER_STAIRS: 4,
            UPPER_FLY: 5,
            SAME_LEVEL_JUMP: 6
        };
    ig.NAV_CONNECTION_TYPE = C;
    var A = [];
    Vec2.create()
});
ig.baked = !0;
