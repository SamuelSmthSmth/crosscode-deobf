ig.module("impact.feature.height-map.height-map").requires("impact.base.map", "impact.base.game", "impact.base.image", "game.config").defines(function() {
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
        init: function(a, b) {
            this.parent(a, b)
        },
        draw: function() {},
        drawTiled: function() {}
    });
    ig.MAP.HeightMap.levelKey = "heightMap";
    if (window.wm) {
        wm.CHIPSET_CONFIG = {};
        var b = {
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
            a = {};
        a[b.SOUTH] = {
            wall: b.WALL_SOUTH,
            base: b.WALL_SOUTH_BASE
        };
        a[b.DIAGONAL_SW] = {
            wall: b.WALL_SW,
            base: b.WALL_SW_BASE
        };
        a[b.DIAGONAL_SE] = {
            wall: b.WALL_SE,
            base: b.WALL_SE_BASE
        };
        a[b.SQUARE_SW] = {
            wall: b.WALL_SQR_SW,
            base: b.WALL_SQR_SW_BASE
        };
        a[b.SQUARE_SE] = {
            wall: b.WALL_SQR_SE,
            base: b.WALL_SQR_SE_BASE
        };
        a[b.CORNER_SW] = {
            shadowOnly: true,
            wall: b.WALL_END_WEST,
            base: b.WALL_END_WEST_BASE
        };
        a[b.CORNER_SE] = {
            shadowOnly: true,
            wall: b.WALL_END_EAST,
            base: b.WALL_END_EAST_BASE
        };
        a[b.NORTH] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: b.WALL_SOUTH,
            base: b.WALL_SOUTH_BASE
        };
        a[b.DIAGONAL_NE] = {
            shadowOnly: true,
            toMaster: true,
            wall: b.WALL_SW,
            base: b.WALL_SW_BASE
        };
        a[b.DIAGONAL_NW] = {
            shadowOnly: true,
            toMaster: true,
            wall: b.WALL_SE,
            base: b.WALL_SE_BASE
        };
        a[b.SQUARE_NE] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: b.WALL_SOUTH,
            base: b.WALL_SOUTH_BASE
        };
        a[b.SQUARE_NW] = {
            shadowOnly: true,
            toMaster: true,
            deltaY: -1,
            wall: b.WALL_SOUTH,
            base: b.WALL_SOUTH_BASE
        };
        var d = {};
        d[2] = b.DIAGONAL_NE;
        d[3] = b.DIAGONAL_SE;
        d[4] = b.DIAGONAL_SW;
        d[5] = b.DIAGONAL_NW;
        var c = [{
                dir1: "NORTH",
                dir2: "EAST",
                gfx: b.SQUARE_NE
            }, {
                dir1: "NORTH",
                dir2: "WEST",
                gfx: b.SQUARE_NW
            }, {
                dir1: "SOUTH",
                dir2: "EAST",
                gfx: b.SQUARE_SE
            }, {
                dir1: "SOUTH",
                dir2: "WEST",
                gfx: b.SQUARE_SW
            }],
            e = {
                NORTH: {
                    dx: 0,
                    dy: -1,
                    blockType1: 3,
                    blockType2: 4,
                    gfx: b.NORTH,
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
                    gfx: b.EAST,
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
                    gfx: b.SOUTH,
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
                    gfx: b.WEST,
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
                    gfx: b.CORNER_NE
                },
                SE: {
                    dx: 1,
                    dy: 1,
                    blockType1: 5,
                    blockType2: 5,
                    gfx: b.CORNER_SE
                },
                SW: {
                    dx: -1,
                    dy: 1,
                    blockType1: 2,
                    blockType2: 2,
                    gfx: b.CORNER_SW
                },
                NW: {
                    dx: -1,
                    dy: -1,
                    blockType1: 3,
                    blockType2: 3,
                    gfx: b.CORNER_NW
                }
            },
            f = [],
            g;
        for (g in e) f.push(g);
        var h = {};
        h[2] = [e.NORTH, e.EAST, e.NE];
        h[3] = [e.SOUTH, e.EAST, e.SE];
        h[4] = [e.SOUTH, e.WEST, e.SW];
        h[5] = [e.NORTH, e.WEST, e.NW];
        var i = {};
        i[b.CORNER_NE] = {
            test: b.EAST,
            set: b.FILL
        };
        i[b.CORNER_NW] = {
            test: b.WEST,
            set: b.FILL
        };
        i[b.EAST] = {
            test: b.DIAGONAL_NE,
            set: b.CORNER_NE
        };
        i[b.WEST] = {
            test: b.DIAGONAL_NW,
            set: b.CORNER_NW
        };
        var j = {
            start: 0,
            end: 0
        };
        wm.HeightMapConverter = {
            data: null,
            lastData: null,
            minLayer: 0,
            maxLevel: 0,
            width: 0,
            height: 0,
            onMapLoad: function(a) {
                this._storeTileData(a.data);
                this._convertRoundTiles();
                this._setGfxType();
                this.lastData = this.data;
                this.data = null
            },
            apply: function(a, b) {
                this._storeTileData(a.data);
                this._convertRoundTiles();
                this._setGfxType();
                this._applyOnLayers(b);
                this.lastData = this.data
            },
            _storeTileData: function(a) {
                this.data = [];
                var b = a[0].length,
                    c = a.length;
                this.minLevel = 1E3;
                this.maxLevel = 0;
                this.width = b;
                this.height = c;
                for (var d = 0; d < c; ++d) {
                    this.data[d] = [];
                    for (var e = 0; e < b; ++e) {
                        var f = a[d][e] - 1;
                        if (f == -1) this.data[d][e] = null;
                        else {
                            var g = Math.floor(f / 128),
                                f = f % 128,
                                f = {
                                    level: Math.floor(f / 8) || -1,
                                    fill: f % 8,
                                    terrain: g,
                                    gfx: 0,
                                    lowerLevel: 0,
                                    lowerTerrain: 0,
                                    upperLevel: 0,
                                    terrainBorder: -1
                                };
                            this.minLevel = Math.min(f.level, this.minLevel);
                            this.maxLevel = Math.max(f.level, this.maxLevel);
                            this.data[d][e] = f
                        }
                    }
                }
            },
            _convertRoundTiles: function() {
                for (var a = this.maxLevel; a >= this.minLevel; a--)
                    for (var b =
                            0; b < this.height; ++b)
                        for (var c = 0; c < this.width; ++c) {
                            var d = this.data[b][c];
                            if (d && d.level == a && d.fill == 0) d.fill = this._getRoundTileReplace(c, b, d.level)
                        }
            },
            _setGfxType: function() {
                for (var a = 0; a < this.height; ++a)
                    for (var b = 0; b < this.width; ++b) {
                        var c = this.data[a][b];
                        c && (c.fill == 1 ? this._setSquareGfx(b, a, c) : this._setDiagonalGfx(b, a, c))
                    }
            },
            _applyOnLayers: function(a) {
                var b = ig.editor.undo;
                b.beginMapDraw();
                for (var c = ig.editor.layers, d = c.length, e = -1, f = 0; f < d; ++f) {
                    var g = c[f];
                    if (!(g.level == "first" || g.level == "last" || g.level ==
                            "light" || g.level == "postlight" || g.level.indexOf("object") != -1) && g.distance == 1)
                        if (g.type == "Background" && wm.CHIPSET_CONFIG[g.tilesetName] && e != g.level) {
                            e = g.level;
                            this._applyOnBackground(g, a)
                        } else g.type == "Collision" && this._applyOnCollision(g, a)
                }
                b.endMapDraw()
            },
            _getLevelHeight: function(a, b) {
                a < 1 && (a = 1);
                var c = ig.editor.levels,
                    d = c[a - 1];
                return d ? d.height / b.tilesize : c[c.length - 1].height / b.tilesize + (a - c.length) * 2
            },
            _getLevelDistance: function(a, b, c) {
                return this._getLevelHeight(b, c) - this._getLevelHeight(a, c)
            },
            _applyOnBackground: function(c, d) {
                var e = wm.CHIPSET_CONFIG[c.tilesetName];
                if (e) {
                    for (var e = new p(e), f = [], g = ig.editor.levels, h = g[c.level], k = g[c.level * 1 + 1], m = g.length, g = (h.height - g[ig.editor.masterLevel].height) / c.tilesize, h = k ? (k.height - h.height) / c.tilesize : 0, k = c.level * 1 + 1, n = ig.editor.masterLevel * 1 + 1, o = 0; o < this.height; ++o)
                        for (var A = 0; A < this.width; ++A) {
                            var B = this.data[o][A];
                            if (B) {
                                var w = e.hasShadow() && B.level > m && B.lowerLevel <= m,
                                    x = a[B.gfx];
                                if (x && x.shadowOnly && (!w || k < n)) x = null;
                                if (B.level == k) {
                                    if (d || this._hasTileAreaChanged(A,
                                            o)) {
                                        var E = null;
                                        if (e.hasFloorChasm(B.terrain) && (B.gfx == b.DIAGONAL_SE || B.gfx == b.DIAGONAL_SW) && B.level == n && B.lowerLevel == -1) E = "CHASM_FLOOR";
                                        var G = e.getGfx(B.gfx, A, o - g, E, B.terrain, B.terrainBorder);
                                        this._setLayerTile(c, A, o - g, G, f)
                                    }
                                } else if (x && x.toMaster && n <= k && k < B.lowerLevel) {
                                    var J = h,
                                        w = x.deltaY || 0;
                                    if (d || this._hasTileLineChanged(A, o, J)) {
                                        j.start = this._getLevelDistance(n, k, c);
                                        j.end = this._getLevelDistance(k, B.lowerLevel, c) - 1;
                                        for (var I = 0; I < J; ++I) {
                                            G = I == 0 && n == k ? x.base : x.wall;
                                            G = e.getGfx(G, A, o - g - I + w, "BACK_WALL",
                                                B.lowerTerrain, -1, j);
                                            this._setLayerTile(c, A, o - g - I + w, G, f);
                                            j.start++;
                                            j.end--
                                        }
                                        if (w) {
                                            G = e.getGfx(b.FILL, A, o - g, "SHADOW", B.lowerTerrain);
                                            this._setLayerTile(c, A, o - g, G, f)
                                        }
                                    }
                                } else if (x && !x.toMaster && (B.lowerLevel <= k || w && k == n) && B.level > k) {
                                    var K = !x.shadowOnly && e.hasChasm() && B.lowerLevel == -1 && k < n,
                                        J = h,
                                        H = 0,
                                        M = false,
                                        L = e.getChasmHeight(B.terrain),
                                        I = e.getChasmTileAdd(B.terrain);
                                    if (K) H = this._getLevelDistance(k, n, c) - L - I;
                                    else if (w && k == n) {
                                        J = this._getLevelDistance(k, B.level, c);
                                        M = true;
                                        H = this._getLevelDistance(k, B.lowerLevel,
                                            c)
                                    }
                                    if (d || this._hasTileLineChanged(A, o, J)) {
                                        var N = B.lowerLevel == -1 || e.isWallTerrainFromTop(B.lowerTerrain, B.terrain) ? B.terrain : B.lowerTerrain;
                                        if (w && k > n) {
                                            G = e.getGfx(b.INVISIBLE_WALL, A, o - g, "SHADOW", N);
                                            this._setLayerTile(c, A, o - g, G, f)
                                        } else {
                                            j.start = this._getLevelDistance(B.lowerLevel, k, c);
                                            j.end = this._getLevelDistance(k, B.level, c) - 1 - H;
                                            if (K) j.start = Math.max(-H, 0);
                                            if (H && M) j.start = 0;
                                            for (I = 0; I < J; ++I) {
                                                E = null;
                                                if (I < H) {
                                                    G = 0;
                                                    w && (G = e.getGfx(b.FILL, A, o - g, "SHADOW", B.lowerTerrain));
                                                    this._setLayerTile(c, A, o - g - I, G, f)
                                                } else {
                                                    if (I ==
                                                        0 && B.lowerLevel == k) G = x.base;
                                                    else if (M && I == H) G = x.base;
                                                    else if (I == 0 && e.hasFloorChasm(N) && B.lowerLevel == -1 && k == n) {
                                                        G = x.base;
                                                        if (B.gfx == b.DIAGONAL_SE || B.gfx == b.DIAGONAL_SW) E = "CHASM"
                                                    } else {
                                                        G = x.wall;
                                                        M && J - I == 1 && (E = "SHADOW")
                                                    }
                                                    x.shadowOnly && (E = "SHADOW");
                                                    K && I - H < L && (E = e.hasFloorChasm(N) && B.level == n ? "CHASM_FLOOR" : "CHASM");
                                                    if (G) {
                                                        G = e.getGfx(G, A, o - g - I, E, N, -1, j);
                                                        this._setLayerTile(c, A, o - g - I, G, f)
                                                    }
                                                    j.start++;
                                                    j.end--
                                                }
                                            }
                                            if (x.wall && M) {
                                                G = e.getGfx(B.gfx, A, o - g - J, "SHADOW", N);
                                                this._setLayerTile(c, A, o - g - J, G, f)
                                            }
                                        }
                                    }
                                } else if (B.lowerLevel ==
                                    k) {
                                    if (d || this._hasTileChanged(A, o)) {
                                        if (e.hasShadow())
                                            if (c.level > ig.editor.masterLevel) G = l[B.gfx] ? e.getGfx(l[B.gfx], A, o - g, "BACK_WALL", B.lowerTerrain) : e.getGfx(b.INVISIBLE_WALL, A, o - g, "SHADOW", B.lowerTerrain);
                                            else {
                                                G = e.getGfx(B.gfx, A, o - g, "SHADOW", B.lowerTerrain);
                                                if (!e.hasShadowSide(B.lowerTerrain) && i[B.gfx])(x = this.data[o - 1] && this.data[o - 1][A]) && i[B.gfx].test == x.gfx && (G = e.getGfx(i[B.gfx].set, A, o - g, "SHADOW", B.lowerTerrain))
                                            }
                                        else G = e.getGfx(b.FILL, A, o - g, null, B.lowerTerrain);
                                        this._setLayerTile(c, A, o - g, G,
                                            f)
                                    }
                                } else if (d || this._hasTileLineShadowChanged(A, o, c)) {
                                    G = 0;
                                    e.hasShadow() && (c.level == ig.editor.masterLevel && B.level > k) && (G = w && B.lowerLevel && B.lowerLevel < n ? e.getGfx(B.gfx, A, o - g, "DARK_WALL", B.lowerTerrain) : e.getGfx(b.FILL, A, o - g, "SHADOW", B.lowerTerrain));
                                    this._setLayerTile(c, A, o - g, G, f)
                                }
                            }
                        }
                    ig.game.autoTiles.resolveAutoTileList(f, c, ig.editor.undo)
                }
            },
            _applyOnCollision: function(a, b) {
                for (var c = ig.editor.levels, c = (c[a.level].height - c[ig.editor.masterLevel].height) / a.tilesize, d = a.level * 1 + 1, e = a.level <= ig.editor.masterLevel,
                        f = a.level < ig.editor.masterLevel, g = 0; g < this.height; ++g)
                    for (var h = 0; h < this.width; ++h)
                        if (b || this._hasTileChanged(h, g)) {
                            var i = this.data[g][h];
                            if (i) {
                                var j = 0;
                                i.level < d ? j = e ? m[1] : 0 : i.fill == 1 ? !f && i.level > d && (j = o[i.fill]) : !f && i.lowerLevel > d ? j = o[1] : i.level > d ? i.lowerLevel < d && e ? j = f ? m[i.fill] : n[i.fill] : f || (j = o[i.fill]) : i.level == d && e && (j = m[i.fill]);
                                this._setLayerTile(a, h, g - c, j)
                            }
                        }
            },
            _hasTileAreaChanged: function(a, b) {
                if (this._hasTileChanged(a, b)) return true;
                for (var c = f.length; c--;) {
                    var d = e[f[c]];
                    if (this._hasTileChanged(a +
                            d.dx, b + d.dy)) return true
                }
                return false
            },
            _hasTileLineChanged: function(a, b, c) {
                for (c = c + 1; c--;)
                    if (this._hasTileChanged(a, b - c)) return true;
                return false
            },
            _hasTileLineShadowChanged: function(a, b, c) {
                for (var d = 11, e = ig.editor.levels; d--;)
                    if (this._hasTileChanged(a, b + d)) {
                        if (!d) return true;
                        var f = this.data[b + d][a];
                        if (f.level > e.length) {
                            var g = this._getLevelDistance(ig.editor.masterLevel + 1, e.length, c),
                                g = g + (f.level - e.length) * 2;
                            if (d <= g) return true
                        }
                    } return false
            },
            _hasTileChanged: function(a, b) {
                if (!this.lastData) return true;
                var c = this.lastData[b] && this.lastData[b][a],
                    d = this.data[b] && this.data[b][a];
                return !c && d || c && !d ? true : !c && !d ? false : c.level != d.level || c.fill != d.fill || c.gfx != d.gfx || c.lowerLevel != d.lowerLevel || c.terrain != d.terrain || c.lowerTerrain != d.lowerTerrain || c.terrainBorder != d.terrainBorder
            },
            _setLayerTile: function(a, b, c, d, e) {
                if (!(c < 0 || c >= this.height)) {
                    e && ig.game.autoTiles.addAutoTileList(e, a, b, c);
                    var e = ig.editor.undo,
                        d = ig.game.autoTiles.getActualTile(a, b, c, d),
                        f = a.data[c][b];
                    if (f != d) {
                        e.pushMapDraw(a, b * a.tilesize,
                            c * a.tilesize, f, d);
                        a.setGridTile(b, c, d)
                    }
                }
            },
            _writeTilesBack: function(a) {
                var b = ig.editor.undo;
                b.beginMapDraw();
                for (var c = 0; c < this.height; ++c)
                    for (var d = 0; d < this.width; ++d) {
                        var e = this.data[c][d],
                            e = (e.level - 1) * 8 + e.fill + 1;
                        b.pushMapDraw(a, d * 16, c * 16, a.data[c][d], e);
                        a.setGridTile(d, c, e)
                    }
                b.endMapDraw()
            },
            _getRoundTileReplace: function(a, b, c) {
                var d = this._getOtherLevel(a, b, c, e.NORTH),
                    f = this._getOtherLevel(a, b, c, e.EAST),
                    g = this._getOtherLevel(a, b, c, e.WEST),
                    a = this._getOtherLevel(a, b, c, e.SOUTH);
                return d && f && (!a || a >=
                    d) && (!g || g >= d) && d == f ? 2 : (!d || d >= f) && f && a && (!g || g >= f) && f == a ? 3 : (!d || d >= g) && (!f || f >= g) && a && g && a == g ? 4 : d && (!f || f >= d) && (!a || a >= d) && g && d == g ? 5 : 1
            },
            _setSquareGfx: function(a, d, g) {
                var h = g.level;
                g.gfx = null;
                for (var i = 0; i < c.length; ++i) {
                    var j = c[i],
                        k = e[j.dir1],
                        m = e[j.dir2],
                        l = this._getOtherLevel(a, d, h, k),
                        m = this._getOtherLevel(a, d, h, m);
                    if (l && m && l < h && m < h) {
                        g.lowerLevel = l;
                        g.lowerTerrain = this._getTerrain(a, d, k) || 0;
                        g.gfx = j.gfx;
                        g.terrainBorder = -1;
                        return
                    }
                }
                for (i = 0; i < f.length; ++i) {
                    j = e[f[i]];
                    if ((k = this._getOtherLevel(a, d, h, j)) &&
                        k < h) {
                        g.lowerLevel = k;
                        g.lowerTerrain = this._getTerrain(a, d, j) || 0;
                        g.gfx = j.gfx;
                        g.terrainBorder = this._getTerrainBorder(a, d, j, g.terrain, h);
                        return
                    }
                }
                if (!g.gfx) g.gfx = b.FILL
            },
            _setDiagonalGfx: function(a, b, c) {
                for (var e = h[c.fill], f = e.length, g = [], i = []; f--;) {
                    var j = this._getOtherLevel(a, b, c.level, e[f]);
                    g[f] = j;
                    i[f] = this._getTerrain(a, b, e[f]) || 0
                }
                if (g[0]) {
                    a = g[0];
                    i = i[0]
                } else if (g[1]) {
                    a = g[1];
                    i = i[1]
                } else {
                    a = g[2];
                    i = i[2]
                }
                if (a > c.level) {
                    c.fill = c.fill > 3 ? c.fill - 2 : c.fill + 2;
                    c.lowerLevel = c.level;
                    c.lowerTerrain = c.terrain;
                    c.level =
                        a;
                    c.terrain = i
                } else {
                    c.lowerLevel = a;
                    c.lowerTerrain = i
                }
                c.gfx = d[c.fill]
            },
            _getOtherLevel: function(a, b, c, d) {
                b = b + d.dy;
                a = a + d.dx;
                a = this.data[b] && this.data[b][a];
                if (!a) return 0;
                d = a.fill == d.blockType1 || a.fill == d.blockType2;
                return a.level == c ? d ? a.level : 0 : !d ? a.level : 0
            },
            _getTerrain: function(a, b, c) {
                b = b + c.dy;
                a = a + c.dx;
                a = this.data[b] && this.data[b][a];
                return !a ? false : a.terrain
            },
            _getOtherTerrain: function(a, b, c, d) {
                b = b + c.dy;
                a = a + c.dx;
                a = this.data[b] && this.data[b][a];
                return !a || a.level != d ? false : a.terrain
            },
            _getTerrainBorder: function(a,
                b, c, d, e) {
                if (!d || !c.terrainBorder) return -1;
                for (var f = c.terrainBorder.length; f--;) {
                    var g = this._getOtherTerrain(a, b, c.terrainBorder[f], e);
                    if (g !== false && g < d) return f
                }
                return -1
            }
        };
        var k = {
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
        g = k.TYPE1;
        g.hasShadowSide = true;
        g.chasmTileAdd = 1;
        g.BASE[b.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        g.BASE[b.EAST] = [
            [3, 1],
            [3, 2]
        ];
        g.BASE[b.SOUTH] = [
            [2, 3],
            [3, 3]
        ];
        g.BASE[b.WEST] = [
            [2, 1],
            [2, 2]
        ];
        g.BASE[b.DIAGONAL_NE] = [
            [4,
                0
            ],
            [5, 1]
        ];
        g.BASE[b.DIAGONAL_SE] = [
            [4, 3],
            [5, 2]
        ];
        g.BASE[b.DIAGONAL_SW] = [
            [0, 2],
            [1, 3]
        ];
        g.BASE[b.DIAGONAL_NW] = [
            [0, 1],
            [1, 0]
        ];
        g.BASE[b.CORNER_NE] = [
            [4, 1]
        ];
        g.BASE[b.CORNER_SE] = [
            [4, 2]
        ];
        g.BASE[b.CORNER_SW] = [
            [1, 2]
        ];
        g.BASE[b.CORNER_NW] = [
            [1, 1]
        ];
        g.BASE[b.WALL_SOUTH] = [
            [3, 4],
            [2, 4]
        ];
        g.BASE[b.WALL_SE] = [
            [5, 3],
            [4, 4]
        ];
        g.BASE[b.WALL_SW] = [
            [1, 4],
            [0, 3]
        ];
        g.BASE[b.WALL_SOUTH_BASE] = [
            [2, 5],
            [3, 5]
        ];
        g.BASE[b.WALL_SE_BASE] = [
            [4, 5],
            [5, 4]
        ];
        g.BASE[b.WALL_SW_BASE] = [
            [0, 4],
            [1, 5]
        ];
        g.BASE[b.WALL_END_WEST] = [
            [0, 6],
            [0, 7]
        ];
        g.BASE[b.WALL_END_WEST_BASE] = [
            [0, 6],
            [0, 7]
        ];
        g.BASE[b.WALL_END_EAST] = [
            [5, 6],
            [5, 7]
        ];
        g.BASE[b.WALL_END_EAST_BASE] = [
            [5, 6],
            [5, 7]
        ];
        g.ALT.offset = {
            x: 0,
            y: 6
        };
        g.ALT[b.WALL_SOUTH] = [
            [3, 0],
            [2, 0]
        ];
        g.ALT[b.WALL_SE] = [
            [5, 0],
            [4, 0]
        ];
        g.ALT[b.WALL_SW] = [
            [1, 0],
            [0, 0]
        ];
        g.SHADOW.offset = {
            x: 0,
            y: 0
        };
        g.SHADOW[b.FILL] = [
            [0, 0]
        ];
        g.SHADOW[b.INVISIBLE_WALL] = [
            [5, 0]
        ];
        g.CHASM.offset = {
            x: 0,
            y: 1
        };
        g.CHASM.wallYVariance = {};
        g.CHASM.wallYVariance[b.WALL_SOUTH] = {
            start: [1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SE] = {
            start: [1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SW] = {
            start: [1, 0]
        };
        g.DARK_WALL.offset = {
            x: 0,
            y: 7
        };
        g.BACK_WALL.offset = {
            x: 0,
            y: 7
        };
        g.BACK_WALL[b.EAST] = [
            [3, 3],
            [4, 2]
        ];
        g.BACK_WALL[b.WEST] = [
            [1, 2],
            [2, 3]
        ];
        g.SUB.ignoreTerrain = [b.WALL_SOUTH, b.WALL_SE, b.WALL_SW];
        g.SUB.BASE[b.WALL_SOUTH_BASE] = [
            [2, 4],
            [3, 4]
        ];
        g.SUB.BASE[b.WALL_SE_BASE] = [
            [4, 4],
            [5, 3]
        ];
        g.SUB.BASE[b.WALL_SW_BASE] = [
            [0, 3],
            [1, 4]
        ];
        g.SUB.SHADOW.offset = {
            x: 0,
            y: 5
        };
        g.SUB.SHADOW[b.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        g.SUB.SHADOW[b.DIAGONAL_NW] = [
            [0, 0],
            [1, 0]
        ];
        g.SUB.SHADOW[b.DIAGONAL_NE] = [
            [4, 0],
            [5, 0]
        ];
        g.SUB.SHADOW[b.WEST] = [
            [0, 1],
            [1, 1]
        ];
        g.SUB.SHADOW[b.EAST] = [
            [5, 1],
            [4, 1]
        ];
        g.SUB.BACK_WALL.offset = {
            x: 0,
            y: 7
        };
        g.SUB.BACK_WALL[b.NORTH] = [
            [2, 0],
            [3, 0]
        ];
        g.SUB.BACK_WALL[b.DIAGONAL_NW] = [
            [0, 0],
            [1, 0]
        ];
        g.SUB.BACK_WALL[b.DIAGONAL_NE] = [
            [4, 0],
            [5, 0]
        ];
        g.SUB.BACK_WALL[b.WEST] = [
            [0, 1],
            [1, 1]
        ];
        g.SUB.BACK_WALL[b.EAST] = [
            [5, 1],
            [4, 1]
        ];
        g.SUB.BORDER[b.NORTH] = [
            [
                [2, 5]
            ],
            [
                [3, 5]
            ]
        ];
        g.SUB.BORDER[b.EAST] = [
            [
                [4, 5]
            ],
            [
                [4, 6]
            ]
        ];
        g.SUB.BORDER[b.SOUTH] = [
            [
                [2, 6]
            ],
            [
                [3, 6]
            ]
        ];
        g.SUB.BORDER[b.WEST] = [
            [
                [1, 5]
            ],
            [
                [1, 6]
            ]
        ];
        k.TYPE2 = {
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
        g = k.TYPE2;
        g.hasShadowSide = false;
        g.chasmTileAdd = 0;
        g.BASE[b.NORTH] = [
            [1, 0]
        ];
        g.BASE[b.EAST] = [
            [4, 1]
        ];
        g.BASE[b.SOUTH] = [
            [1, 3]
        ];
        g.BASE[b.WEST] = [
            [3, 1]
        ];
        g.BASE[b.DIAGONAL_NE] = [
            [2, 0]
        ];
        g.BASE[b.DIAGONAL_SE] = [
            [2, 3]
        ];
        g.BASE[b.DIAGONAL_SW] = [
            [0, 3]
        ];
        g.BASE[b.DIAGONAL_NW] = [
            [0, 0]
        ];
        g.BASE[b.SQUARE_NE] = [
            [4, 0]
        ];
        g.BASE[b.SQUARE_SE] = [
            [4, 2]
        ];
        g.BASE[b.SQUARE_SW] = [
            [3, 2]
        ];
        g.BASE[b.SQUARE_NW] = [
            [3, 0]
        ];
        g.BASE[b.CORNER_NE] = [
            [2, 1]
        ];
        g.BASE[b.CORNER_SE] = [
            [2, 2]
        ];
        g.BASE[b.CORNER_SW] = [
            [0, 2]
        ];
        g.BASE[b.CORNER_NW] = [
            [0, 1]
        ];
        g.BASE[b.WALL_SOUTH] = [
            [1, 4]
        ];
        g.BASE[b.WALL_SOUTH_BASE] = [
            [1, 7]
        ];
        g.BASE[b.WALL_SE] = [
            [2, 4]
        ];
        g.BASE[b.WALL_SE_BASE] = [
            [2, 7]
        ];
        g.BASE[b.WALL_SW] = [
            [0, 4]
        ];
        g.BASE[b.WALL_SW_BASE] = [
            [0, 7]
        ];
        g.BASE[b.WALL_SQR_SE] = [
            [4, 3]
        ];
        g.BASE[b.WALL_SQR_SE_BASE] = [
            [4, 6]
        ];
        g.BASE[b.WALL_SQR_SW] = [
            [3, 3]
        ];
        g.BASE[b.WALL_SQR_SW_BASE] = [
            [3, 6]
        ];
        g.BASE[b.WALL_END_WEST] = [
            [3, 0]
        ];
        g.BASE[b.WALL_END_WEST_BASE] = [
            [3, 1]
        ];
        g.BASE[b.WALL_END_EAST] = [
            [4, 0]
        ];
        g.BASE[b.WALL_END_EAST_BASE] = [
            [4, 1]
        ];
        g.BASE.wallYVariance = {};
        g.BASE.wallYVariance[b.WALL_SOUTH] = {
            loop: [1, 2],
            end: [0]
        };
        g.BASE.wallYVariance[b.WALL_SE] = {
            loop: [1, 2],
            end: [0]
        };
        g.BASE.wallYVariance[b.WALL_SW] = {
            loop: [1, 2],
            end: [0]
        };
        g.BASE.wallYVariance[b.WALL_SQR_SE] = {
            loop: [1, 2],
            end: [0]
        };
        g.BASE.wallYVariance[b.WALL_SQR_SW] = {
            loop: [1, 2],
            end: [0]
        };
        g.SHADOW.offset = {
            x: 0,
            y: 0
        };
        g.SHADOW[b.FILL] = [
            [1, 1]
        ];
        g.SHADOW[b.INVISIBLE_WALL] = [
            [1, 2]
        ];
        g.SHADOW[b.EAST] = [
            [1, 1]
        ];
        g.SHADOW[b.WEST] = [
            [1, 1]
        ];
        g.SHADOW.wallYVariance = {};
        g.CHASM.offset = {
            x: 0,
            y: 8
        };
        g.CHASM[b.WALL_SE_BASE] = [
            [3, 2]
        ];
        g.CHASM[b.WALL_SW_BASE] = [
            [4, 2]
        ];
        g.CHASM[b.WALL_SOUTH] = [
            [1, 2]
        ];
        g.CHASM[b.WALL_SQR_SW] = [
            [0, 2]
        ];
        g.CHASM[b.WALL_SQR_SE] = [
            [2, 2]
        ];
        g.CHASM[b.WALL_SE] = [
            [3, 3]
        ];
        g.CHASM[b.WALL_SW] = [
            [4, 3]
        ];
        g.CHASM.wallYVariance = {};
        g.CHASM.wallYVariance[b.WALL_SOUTH] = {
            start: [2, 1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SE] = {
            start: [2, 1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SW] = {
            start: [2, 1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SQR_SE] = {
            start: [2, 1, 0]
        };
        g.CHASM.wallYVariance[b.WALL_SQR_SW] = {
            start: [2, 1, 0]
        };
        g.CHASM_FLOOR.offset = {
            x: 0,
            y: 8
        };
        g.CHASM_FLOOR[b.DIAGONAL_SE] = [
            [3, 0]
        ];
        g.CHASM_FLOOR[b.DIAGONAL_SW] = [
            [4, 0]
        ];
        g.CHASM_FLOOR[b.WALL_SOUTH] = [
            [1, 1]
        ];
        g.CHASM_FLOOR[b.WALL_SQR_SW] = [
            [0, 1]
        ];
        g.CHASM_FLOOR[b.WALL_SQR_SE] = [
            [2, 1]
        ];
        g.CHASM_FLOOR[b.WALL_SE] = [
            [3, 1]
        ];
        g.CHASM_FLOOR[b.WALL_SW] = [
            [4, 1]
        ];
        g.CHASM_FLOOR.wallYVariance = {};
        g.CHASM_FLOOR.wallYVariance[b.WALL_SOUTH] = {
            start: [3, 2, 0]
        };
        g.CHASM_FLOOR.wallYVariance[b.WALL_SE] = {
            start: [4, 3, 0]
        };
        g.CHASM_FLOOR.wallYVariance[b.WALL_SW] = {
            start: [4, 3, 0]
        };
        g.CHASM_FLOOR.wallYVariance[b.WALL_SQR_SE] = {
            start: [3, 2, 0]
        };
        g.CHASM_FLOOR.wallYVariance[b.WALL_SQR_SW] = {
            start: [3, 2, 0]
        };
        g.DARK_WALL.offset = {
            x: 0,
            y: 13
        };
        g.DARK_WALL[b.NORTH] = [
            [3, 1]
        ];
        g.DARK_WALL[b.DIAGONAL_NE] = [
            [1, 0]
        ];
        g.DARK_WALL[b.DIAGONAL_NW] = [
            [0, 0]
        ];
        g.DARK_WALL[b.SQUARE_NW] = [
            [2, 1]
        ];
        g.DARK_WALL[b.SQUARE_NE] = [
            [4, 1]
        ];
        g.DARK_WALL[b.DIAGONAL_NW] = [
            [0, 0]
        ];
        g.DARK_WALL[b.CORNER_NE] = [
            [2, 0]
        ];
        g.DARK_WALL[b.CORNER_NW] = [
            [2, 0]
        ];
        g.DARK_WALL[b.WEST] = [
            [0, 1]
        ];
        g.DARK_WALL[b.EAST] = [
            [1, 1]
        ];
        g.BACK_WALL.offset = {
            x: 0,
            y: 2
        };
        g.BACK_WALL[b.WALL_SOUTH_BASE] = [
            [1, 6]
        ];
        g.BACK_WALL[b.WALL_SE_BASE] = [
            [2, 6]
        ];
        g.BACK_WALL[b.WALL_SW_BASE] = [
            [0, 6]
        ];
        g.BACK_WALL[b.WALL_SQR_SE_BASE] = [
            [4, 5]
        ];
        g.BACK_WALL[b.WALL_SQR_SW_BASE] = [
            [3, 5]
        ];
        g.BACK_WALL[b.EAST] = [
            [1, 0]
        ];
        g.BACK_WALL[b.WEST] = [
            [1, 0]
        ];
        g.BACK_WALL.wallYVariance = {};
        g.BACK_WALL.wallYVariance[b.WALL_SOUTH] = {
            loop: [1],
            end: [0]
        };
        g.BACK_WALL.wallYVariance[b.WALL_SE] = {
            loop: [1],
            end: [0]
        };
        g.BACK_WALL.wallYVariance[b.WALL_SW] = {
            loop: [1],
            end: [0]
        };
        g.BACK_WALL.wallYVariance[b.WALL_SQR_SE] = {
            loop: [1],
            end: [0]
        };
        g.BACK_WALL.wallYVariance[b.WALL_SQR_SW] = {
            loop: [1],
            end: [0]
        };
        g.SUB.ignoreTerrain = [b.WALL_SOUTH, b.WALL_SOUTH_BASE, b.WALL_SE, b.WALL_SW, b.WALL_SQR_SE,
            b.WALL_SQR_SE_BASE, b.WALL_SQR_SW, b.WALL_SQR_SW_BASE
        ];
        g.SUB.ignoreTerrainKeepWallBase = [b.WALL_SOUTH, b.WALL_SE, b.WALL_SW, b.WALL_SQR_SE, b.WALL_SQR_SW];
        g.SUB.BASE[b.WALL_SE_BASE] = [
            [2, 4]
        ];
        g.SUB.BASE[b.WALL_SW_BASE] = [
            [0, 4]
        ];
        g.SUB.BASE[b.WALL_SOUTH_BASE] = [
            [1, 4]
        ];
        g.SUB.BASE[b.WALL_SQR_SE_BASE] = [
            [1, 2]
        ];
        g.SUB.BASE[b.WALL_SQR_SW_BASE] = [
            [1, 1]
        ];
        g.SUB.SHADOW.offset = {
            x: 0,
            y: 0
        };
        g.SUB.SHADOW[b.DIAGONAL_NW] = [
            [3, 3]
        ];
        g.SUB.SHADOW[b.DIAGONAL_NE] = [
            [4, 3]
        ];
        g.SUB.BACK_WALL.offset = {
            x: 0,
            y: 0
        };
        g.SUB.BACK_WALL[b.DIAGONAL_SE] = [
            [3,
                4
            ]
        ];
        g.SUB.BACK_WALL[b.DIAGONAL_SW] = [
            [4, 4]
        ];
        g.SUB.BORDER[b.NORTH] = [
            [
                [2, 5]
            ],
            [
                [3, 5]
            ]
        ];
        g.SUB.BORDER[b.EAST] = [
            [
                [4, 5]
            ],
            [
                [4, 6]
            ]
        ];
        g.SUB.BORDER[b.SOUTH] = [
            [
                [2, 6]
            ],
            [
                [3, 6]
            ]
        ];
        g.SUB.BORDER[b.WEST] = [
            [
                [1, 5]
            ],
            [
                [1, 6]
            ]
        ];
        g.SUB.CHASM_FLOOR[b.DIAGONAL_SE] = [
            [0, 5]
        ];
        g.SUB.CHASM_FLOOR[b.DIAGONAL_SW] = [
            [0, 6]
        ];
        var l = {};
        l[b.WEST] = b.WEST;
        l[b.EAST] = b.EAST;
        l[b.DIAGONAL_NW] = b.DIAGONAL_SE;
        l[b.DIAGONAL_NE] = b.DIAGONAL_SW;
        var o = {
                1: 2,
                2: 8,
                3: 9,
                4: 10,
                5: 11
            },
            m = {
                1: 1,
                2: 6,
                3: 7,
                4: 4,
                5: 5
            },
            n = {
                1: 2,
                2: 24,
                3: 25,
                4: 26,
                5: 27
            },
            p = ig.Class.extend({
                tileCountX: 0,
                base: null,
                terrains: [],
                init: function(a) {
                    this.tileCountX = a.tileCountX;
                    this.base = this._copySettings(a.base);
                    if (a.terrains)
                        for (var b = 0; b < a.terrains.length; ++b) this.terrains[b] = this._copySettings(a.terrains[b])
                },
                _copySettings: function(a) {
                    var c = ig.copy(a);
                    c.mapping = k[a.mappingType] || null;
                    if (a.blockTypes) {
                        c.blockedTypes = [];
                        for (var d = a.blockedTypes.length; d--;) c.blockedTypes.push(b[a.blockedTypes[d]])
                    }
                    return c
                },
                _getMappingMain: function(a) {
                    if (a && this.terrains[a - 1]) {
                        a = this.terrains[a - 1];
                        if (a.mapping) return a;
                        if (a.baseTerrain) return this.terrains[a.baseTerrain - 1]
                    }
                    return this.base
                },
                hasShadowSide: function(a) {
                    return this._getMappingMain(a).mapping.hasShadowSide
                },
                getChasmHeight: function(a) {
                    var a = this._getMappingMain(a),
                        c = 1;
                    if (a.mapping.CHASM.wallYVariance) c = a.mapping.CHASM.wallYVariance[b.WALL_SOUTH].start.length;
                    return c
                },
                getChasmTileAdd: function(a) {
                    return this._getMappingMain(a).mapping.chasmTileAdd || 0
                },
                hasFloorChasm: function(a) {
                    return this.hasChasm() && this.getChasmTileAdd(a) == 0
                },
                hasShadow: function() {
                    return this.base.shadow &&
                        !this.base.chasmOnly
                },
                hasChasm: function() {
                    return this.base.shadow
                },
                isFill: function(a, c) {
                    return a == b.FILL || (c && this.terrains[c - 1].blockedTypes ? this.terrains[c - 1].blockedTypes.indexOf(a) != -1 : this.base.blockedTypes && this.base.blockedTypes.indexOf(a) != -1)
                },
                isWallTerrainFromTop: function(a, b) {
                    var c = a && this.terrains[a - 1] || this.base,
                        d = b && this.terrains[b - 1] || this.base;
                    return (d && d.wallTerrainPrio || 0) > (c && c.wallTerrainPrio || 0)
                },
                getGfx: function(a, b, c, d, e, f, g) {
                    e && !this.terrains[e - 1] && (e = 0);
                    var h = this.base,
                        i = null;
                    if (e && this.terrains[e - 1].mapping) h = this.terrains[e - 1];
                    else if (e)(i = this.terrains[e - 1]) && i.baseTerrain && (h = this.terrains[i.baseTerrain - 1]);
                    var j = null,
                        k = h.mapping,
                        m = k.BASE[a],
                        w = h.ground,
                        l = h.cliff,
                        o = k.BASE.wallYVariance,
                        n = i && i.overrideWallBase ? k.SUB.ignoreTerrainKeepWallBase : k.SUB.ignoreTerrain;
                    i && n.indexOf(a) != -1 && (i = null);
                    if (d) {
                        j = k[d].offset;
                        m = k[d][a] || m;
                        o = k[d].wallYVariance || o;
                        w = null;
                        l = h.shadow
                    } else if (h.cliffAlt && k.ALT[a] && Math.random() < 0.5) {
                        j = k.ALT.offset;
                        m = k.ALT[a]
                    }
                    h = false;
                    if (i)
                        if ((n = d && k.SUB[d]) &&
                            n[a]) {
                            l = i.cliff;
                            j = n.offset;
                            m = n[a]
                        } else if (!d) {
                        w = i.ground;
                        l = i.cliff;
                        m = k.SUB.BASE[a] || m;
                        h = i.border
                    }
                    d = j && j.y || 0;
                    if (this.isFill(a)) return w ? this._getTile(w.x, w.y) : m ? this._getMappingTile(l, m, b, c, d) : 0;
                    if (g && o && o[a]) {
                        w = o[a];
                        w.end && g.end < w.end.length ? d = d + w.end[g.end] : w.start && g.start < w.start.length ? d = d + w.start[g.start] : w.loop && (d = d + w.loop[g.start % w.loop.length])
                    }
                    h && (e && f != -1 && k.SUB.BORDER[a]) && (m = k.SUB.BORDER[a][f]);
                    return !m || m.length == 0 ? 0 : this._getMappingTile(l, m, b, c, d)
                },
                _getMappingTile: function(a, b, c, d,
                    e) {
                    b = b.length > 1 && this._getVariation(c, d) ? b[1] : b[0];
                    return this._getTile(a.x + b[0], a.y + b[1] + (e || 0))
                },
                _getTile: function(a, b) {
                    return b * this.tileCountX + a + 1
                },
                _getVariation: function(a, b) {
                    return (a + b) % 2
                }
            })
    }
});
ig.baked = !0;
