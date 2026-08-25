ig.module("impact.base.collision-map").requires("impact.base.map", "game.config").defines(function() {
    function b(a) {
        return a < 4 ? a % 3 : a - 12 >> 2
    }

    function a(a) {
        return a < 4 ? a == 3 ? 0 : 1 : 2 + a % 4
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
            _alphaEntities: 0
        }),
        init: function(a, b) {
            this.parent(a, b)
        },
        prepare: function(a, b) {
            for (var e = 0; e < this.height; e++)
                for (var f = 0; f < this.width; f++) {
                    var g;
                    a && (g = a.data[e + b] ? a.data[e + b][f] % 32 : 2);
                    this.data[e][f] = ig.CollMapTools.prepareSingleTile(f, e, this.data[e][f], g, b)
                }
        },
        isTileGround: function(a, b) {
            var e = this.getTile(a, b);
            return ig.CollMapTools.isTileFullGround(e)
        },
        isTileAreaBlocked: function(b, c, e, f) {
            for (var g = Math.floor(b / this.tilesize), h = Math.floor(Math.ceil(b + e - 1) / this.tilesize),
                    i = Math.floor(c / this.tilesize), j = Math.floor(Math.ceil(c + f - 1) / this.tilesize), i = Math.max(i, 0), j = Math.min(j, this.height - 1), g = Math.max(g, 0), h = Math.min(h, this.width - 1), j = j + 1; j-- > i;)
                for (var k = h + 1; k-- > g;) {
                    var l = this.getGridTile(k, j);
                    if (ig.CollMapTools.isTileBlocked(l)) {
                        l = a(l);
                        if (l == 1 || l >= 2 && ig.CollMapTools.isTriangleOverlap((k + 0.5) * this.tilesize, (j + 0.5) * this.tilesize, l, b, c, e, f)) return true
                    }
                }
            return false
        },
        isGridHole: function(d, c) {
            var e = this.getGridTile(d, c),
                f = b(e),
                e = a(e);
            return f == 3 || f == 1 && e == 1
        },
        isOverHole: function(d,
            c, e, f, g) {
            for (var h = Math.floor(d / this.tilesize), i = Math.floor(Math.ceil(d + e - 1) / this.tilesize), j = Math.floor(c / this.tilesize), k = Math.floor(Math.ceil(c + f - 1) / this.tilesize), j = Math.max(j, 0), k = Math.min(k, this.height - 1), h = Math.max(h, 0), i = Math.min(i, this.width - 1), l = 0, o = 0, m = k + 1; m-- > j;)
                for (var n = i + 1; n-- > h;) {
                    ++o;
                    var p = this.data[m] && this.data[m][n],
                        p = p % 32,
                        r = a(p),
                        t = b(p),
                        p = 0;
                    if (t == 3) p = 1;
                    else if (t == 1)
                        if (r == 1) p = 1;
                        else if (r > 1) {
                        var t = (n + 0.5) * this.tilesize,
                            q = (m + 0.5) * this.tilesize;
                        r == 2 && n == i && m == j ? d + e - t - (c - q) <= 0.01 &&
                            (p = 1) : r == 2 && n == h && m == k ? -(d - t) + (c + f - q) > 0.01 && (p = 0.5) : r == 3 && n == i && m == k ? d + e - t + (c + f - q) <= 0.01 && (p = 1) : r == 3 && n == h && m == j ? -(d - t) - (c - q) > 0.01 && (p = 0.5) : r == 4 && n == h && m == k ? -(d - t) + (c + f - q) <= 0.01 && (p = 1) : r == 4 && n == i && m == j ? d + e - t - (c - q) > 0.01 && (p = 0.5) : r == 5 && n == h && m == j ? -(d - t) - (c - q) <= 0.01 && (p = 1) : r == 5 && n == i && m == k ? d + e - t + (c + f - q) > 0.01 && (p = 0.5) : p = 0.5
                    }
                    if (p != 1 && !g) return 0;
                    if (p != 0 && g) {
                        g.x = g.x + (n == h ? -1 : n == i ? 1 : 0);
                        g.y = g.y + (m == j ? -1 : m == k ? 1 : 0)
                    }
                    l = l + p
                }
            return l == o ? 2 : l > 0 ? 1 : 0
        },
        trace: function(d, c, e, f, g, h, i, j, k) {
            var l = Math.floor((c + (f < 0 ? f : 0)) /
                    this.tilesize),
                o = Math.floor(Math.ceil(c + h - 1 + (f > 0 ? f : 0)) / this.tilesize),
                m = Math.floor((e + (g < 0 ? g : 0)) / this.tilesize),
                n = Math.floor(Math.ceil(e + i - 1 + (g > 0 ? g : 0)) / this.tilesize),
                p, r, t, q;
            if (f != 0 && g != 0) {
                var s;
                s = c + f + (f < 0 ? h : 0) - (f < 0 ? o : l + 1) * this.tilesize;
                var v = e + g + (g > 0 ? i : 0) - (g > 0 ? n : m + 1) * this.tilesize;
                if (v && v * g >= 0 && s * f >= 0 && Math.abs(s) < Math.abs(f) && Math.abs(v) < Math.abs(g) && Math.abs(f / g) < Math.abs(s / v)) {
                    p = f < 0 ? o : l;
                    r = g > 0 ? n : m
                }
                v = e + g + (g < 0 ? i : 0) - (g < 0 ? n : m + 1) * this.tilesize;
                if ((s = c + f + (f > 0 ? h : 0) - (f > 0 ? o : l + 1) * this.tilesize) && v * g >= 0 &&
                    s * f >= 0 && Math.abs(s) < Math.abs(f) && Math.abs(v) < Math.abs(g) && Math.abs(g / f) < Math.abs(v / s)) {
                    t = f > 0 ? o : l;
                    q = g < 0 ? n : m
                }
            }
            s = false;
            m = Math.max(m, 0);
            n = Math.min(n, this.height - 1);
            l = Math.max(l, 0);
            o = Math.min(o, this.width - 1);
            for (n = n + 1; n-- > m;)
                for (v = o + 1; v-- > l;)
                    if ((v != p || n != r) && (v != t || n != q)) {
                        var y = this.data[n] && this.data[n][v],
                            y = y % 32,
                            u = a(y),
                            y = b(y);
                        if (k) y == 1 ? u = u > 1 ? u % 4 + 2 : u ? 0 : 1 : y != 3 && (u = 1);
                        else {
                            if (j && y == 1) continue;
                            !j && y == 3 && (u = 1)
                        }
                        u > 1 ? s = ig.MAP.Collision.solveBlockCollision(d, c, e, f, g, h, i, v * this.tilesize, n * this.tilesize, this.tilesize,
                            this.tilesize, (u - 2) % 4) || s : u && (s = ig.MAP.Collision.solveBlockCollision(d, c, e, f, g, h, i, v * this.tilesize, n * this.tilesize, this.tilesize, this.tilesize) || s)
                    } return s
        }
    });
    ig.MAP.Collision.levelKey = "collision";
    ig.CollMapTools = {
        isTileBlocked: function(a) {
            a = b(a);
            return a == 2 || a == 3
        },
        isTileFullGround: function(d) {
            var c = b(d),
                d = a(d);
            return c != 1 && c != 3 && d == 0
        },
        isTilePartlyGround: function(d) {
            var c = b(d),
                d = a(d);
            return c == 3 || c == 2 || c == 1 && d == 1 ? false : true
        },
        getRealCollValue: function(a, b, e, f, g, h) {
            var i = e > h ? 1 : -1,
                j = g[e].height,
                k = j -
                g[h].height,
                l;
            for (l = f[h] ? this.prepareSingleTile(a, b, f[h].getTile(a, b + k)) : 3; h != e;) {
                h = h + i;
                k = j - g[h].height;
                l = f[h] ? this.prepareSingleTile(a, b, f[h].getTile(a, b + k), l, i) : 3
            }
            return l
        },
        prepareSingleTile: function(d, c, e, f, g) {
            c = d = e;
            d = d % 32;
            c = c - d;
            if (d > 0 && d < 4 || d >= 16) return e;
            if (f === void 0) c = d == 0 || d >= 12 ? c + 3 : c + (d + 12);
            else {
                var e = a(f),
                    h = b(f);
                if (g > 0)
                    if (d == 0) c = h == 2 || h == 3 ? c + (e == 1 ? 3 : e % 4 + 16) : c + 1;
                    else {
                        f = 2 + d % 4;
                        c = e != f && (h == 2 || h == 3) ? c + (d >= 12 ? 3 : d + 12) : c + (d >= 12 ? f % 4 + 16 : d >= 8 ? d + 16 : 1)
                    }
                else if (d == 0) c = h == 1 ? c + (e == 1 ? 3 : e % 4 + 20) : h == 3 ? c + (f -
                    4) : c + 2;
                else {
                    f = 2 + d % 4;
                    h == 3 && (e = 2 + e % 4);
                    c = e != f && (h == 1 || h == 3) ? c + (d >= 12 ? 3 : d + 12) : c + (d >= 12 ? f % 4 + 20 : d >= 8 ? 2 : f % 4 + 24)
                }
            }
            return c
        },
        isTriangleOverlap: function(a, b, e, f, g, h, i) {
            Math.abs(h / i);
            var j, k;
            if (e == 2) {
                j = 1;
                k = -1
            } else if (e == 3) k = j = 1;
            else if (e == 4) {
                j = -1;
                k = 1
            } else if (e == 5) k = j = -1;
            return j * ((j > 0 ? f : f + h) - a) + k * ((k > 0 ? g : g + i) - b) < 0
        }
    };
    ig.MAP.Collision.staticNoCollision = {
        isOverHole: function() {
            return 0
        },
        isTileGround: function() {
            return false
        },
        isTileAreaBlocked: function() {
            return false
        },
        trace: function() {
            return false
        },
        prepare: function() {}
    };
    ig.COLLISION = {};
    ig.COLLISION.EPS = 1E-5;
    ig.COLLISION.SLIP_PIXELS = 8;
    ig.COLLISION.HEIGHT_TOLERATE = 4;
    ig.MAP.Collision.solveBlockCollision = function(a, b, e, f, g, h, i, j, k, l, o, m) {
        var n = false;
        if (m != void 0) {
            var p = 0,
                r = 0,
                t = j + l / 2,
                q = k + o / 2;
            switch (m) {
                case 0:
                    p = -t + q - (-b + e + i);
                    r = -f + g;
                    break;
                case 1:
                    p = -t - q - (-b - e);
                    r = -f - g;
                    break;
                case 2:
                    p = t - q - (b + h - e);
                    r = f - g;
                    break;
                case 3:
                    p = t + q - (b + h + e + i);
                    r = f + g
            }
            if ((n = p + 0.1 >= 0) && r > 0) {
                p = Math.max(0, p / r - ig.COLLISION.EPS);
                if (p - ig.COLLISION.EPS < a.dist) {
                    n = 0;
                    switch (m) {
                        case 0:
                            n = b + p * f - t + (e + p * g + i - q);
                            break;
                        case 1:
                            n =
                                b + p * f - t - (e + p * g - q);
                            break;
                        case 2:
                            n = b + p * f + h - t + (e + p * g - q);
                            break;
                        case 3:
                            n = b + p * f + h - t - (e + p * g + i - q)
                    }
                    if (Math.abs(n) > l + 0.1) n = false;
                    else {
                        g = f = 0;
                        a.dist = p;
                        a.dir.x = (m < 2 ? -1 : 1) * Math.SQRT1_2;
                        a.dir.y = (m == 0 || m == 3 ? 1 : -1) * Math.SQRT1_2;
                        return true
                    }
                }
            }
        }
        if (!n) {
            m = f == 0 ? -1 : (j + (f > 0 ? -h : l) - b) / f;
            t = g == 0 ? -1 : (k + (g > 0 ? -i : o) - e) / g;
            q = Math.min(m, t);
            p = Math.max(m, t);
            if (q + ig.COLLISION.EPS >= 0 && p < 1) {
                if (p < a.dist) {
                    if (a.slipX != void 0) a.slipX = a.dir.x ? f > 0 ? 1E3 : -1E3 : 0;
                    if (a.slipY != void 0) a.slipY = a.dir.y ? g > 0 ? 1E3 : -1E3 : 0;
                    a.dist = p;
                    a.dir.x = p == m ? f > 0 ? 1 : -1 : 0;
                    a.dir.y =
                        p == t ? g > 0 ? 1 : -1 : 0;
                    if (p == m && p == t) {
                        a.dir.x = a.dir.x * Math.SQRT1_2;
                        a.dir.y = a.dir.y * Math.SQRT1_2
                    }
                    return true
                }
            } else {
                if (m + ig.COLLISION.EPS >= 0 && m - ig.COLLISION.EPS <= a.dist) {
                    g = e + i - ig.COLLISION.SLIP_PIXELS < k || e + ig.COLLISION.SLIP_PIXELS > k + o ? k - e > e + i - k - o ? k - e - i : k + o - e : 0;
                    a.slipY = a.slipY != void 0 && m + ig.COLLISION.EPS >= a.dist ? a.slipY * g <= 0 ? 0 : a.slipY : g;
                    a.dist = Math.max(0, m - ig.COLLISION.EPS);
                    a.dir.x = f > 0 ? 1 : -1;
                    a.dir.y = 0;
                    return true
                }
                if (t + ig.COLLISION.EPS >= 0 && t - ig.COLLISION.EPS <= a.dist) {
                    f = b + h - ig.COLLISION.SLIP_PIXELS < j || b + ig.COLLISION.SLIP_PIXELS >
                        j + l ? j - b > b + h - j - l ? j - b - h : j + l - b : 0;
                    a.slipX = a.slipX != void 0 && t + ig.COLLISION.EPS >= a.dist ? a.slipX * f <= 0 ? 0 : a.slipX : f;
                    a.dist = Math.max(0, t - ig.COLLISION.EPS);
                    a.dir.x = 0;
                    a.dir.y = g > 0 ? 1 : -1;
                    return true
                }
            }
        }
        return false
    }
});
ig.baked = !0;
