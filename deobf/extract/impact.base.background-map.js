ig.module("impact.base.background-map").requires("impact.base.map", "impact.base.image", "impact.base.tile-info", "game.config").defines(function() {
    var b = Vec2.create();
    ig.MAP.Background = ig.ChunkedMap.extend({
        tiles: null,
        tilesetName: "",
        tileInfo: null,
        hasAnimatedTiles: false,
        screenRender: true,
        lighter: false,
        _wm: new ig.Config({
            _label: "Background",
            _fixSize: ig.CONFIG.DISABLE_LAYER_SIZE,
            _noRepeat: true,
            _noDistance: ig.CONFIG.DISABLE_LAYER_DISTANCE,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _noMoveSpeed: true,
            _objectLayerSupport: true,
            _lighter: true,
            _icon: "weltmeister/lib/map/img/layer-background-icon.png"
        }),
        init: function(a, b) {
            this.parent(a, b);
            this.setTileset(a.tilesetName);
            this.lighter = a.lighter || false;
            this.checkAnimatedTiles()
        },
        clearCached: function() {
            this.tiles && this.tiles.decreaseRef()
        },
        readyToDraw: function() {
            return this.tiles.loaded
        },
        checkAnimatedTiles: function() {
            this.hasAnimatedTiles = false;
            for (var a = 0; a < this.width; a++)
                for (var b = 0; b < this.height; b++)
                    if (this.tileInfo.getAnimTiles(this.data[b][a])) {
                        this.hasAnimatedTiles = true;
                        return
                    }
        },
        setTileset: function(a) {
            this.tilesetName = a instanceof ig.Image ? a.path : a;
            this.tileInfo = new ig.TileInfo(this.tilesetName);
            this.tiles = new ig.Image(this.tilesetName);
            this.preRenderedChunks = null
        },
        preRenderChunk: function(a, b, c, e, f) {
            var c = c / this.tilesize / ig.system.scale + 1,
                e = e / this.tilesize / ig.system.scale + 1,
                g = a * this.chunkSizeX / ig.system.scale % this.tilesize,
                h = b * this.chunkSizeY / ig.system.scale % this.tilesize,
                a = Math.floor(a * this.chunkSizeX / this.tilesize / ig.system.scale),
                b = Math.floor(b * this.chunkSizeY / this.tilesize /
                    ig.system.scale),
                i = ig.system.context;
            ig.system.context = ig.system.getBufferContext(f);
            if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";
            for (var j = 0; j < c; j++)
                for (var k = 0; k < e; k++)
                    if (j + a < this.width && k + b < this.height) {
                        var l = this.data[k + b][j + a];
                        l && this.tiles.drawTile(j * this.tilesize - g, k * this.tilesize - h, l - 1, this.tilesize)
                    } if (this.lighter) ig.system.context.globalCompositeOperation = "source-over";
            ig.system.context = i;
            return f
        },
        preRenderScreen: function(a, b, c, e, f, g, h) {
            var i = this.tilesize,
                j = ig.system.context;
            ig.system.context = a;
            if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";
            a = e / i;
            f = f / i;
            g = g / i;
            h = h / i;
            for (e = 0; e < g; ++e)
                for (var k = 0; k < h; ++k) {
                    var l = a + e,
                        o = f + k;
                    if (o >= this.height || o < 0) {
                        if (!this.repeat) continue;
                        o = o > 0 ? o % this.height : (o + 1) % this.height + this.height - 1
                    }
                    if (l >= this.width || l < 0) {
                        if (!this.repeat) continue;
                        l = l > 0 ? l % this.width : (l + 1) % this.width + this.width - 1
                    }
                    if (l = this.data[o][l]) {
                        o = this.tileInfo.getAnimTiles(l);
                        (window.wm || !o) && this.tiles.drawTile(e * i + b, k * i + c, l - 1, i)
                    }
                }
            if (this.lighter) ig.system.context.globalCompositeOperation =
                "source-over";
            ig.system.context = j
        },
        drawAnimated: function(a, d, c, e) {
            if (this.hasAnimatedTiles)
                for (var f = ig.system.getZoomMinOffset(b), a = a == void 0 ? this.scroll.x + f.x : a, d = d == void 0 ? this.scroll.y + f.y : d, c = c == void 0 ? ig.system.width / ig.system.zoom : c, e = e == void 0 ? ig.system.height / ig.system.zoom : e, f = Math.floor(ig.game.backgroundAnimTimer / this.tileInfo.animSpeed) % 4, g = Math.floor(a / this.tilesize), h = Math.floor(d / this.tilesize), a = Math.ceil((a + c) / this.tilesize), d = Math.ceil((d + e) / this.tilesize), e = ig.perf.smoothMapRendering &&
                        this.distance && this.distance != 1; h < d; ++h)
                    for (c = g; c < a; ++c) {
                        var i = this.getGridTile(c, h);
                        (i = this.tileInfo.getAnimTiles(i)) && this.tiles.drawTile(c * this.tilesize - this.scroll.x, h * this.tilesize - this.scroll.y, i[f] - 1, this.tilesize, this.tilesize, false, false, null, null, null, e)
                    }
        },
        redrawChunkTile: function(a, b, c, e) {
            var f = ig.system.context;
            ig.system.context = ig.system.getBufferContext(a);
            a = ig.system.scale;
            ig.system.context.clearRect(b, c, this.tilesize * a, this.tilesize * a);
            e && this.tiles.drawTile(b / a, c / a, e - 1, this.tilesize);
            ig.system.context = f
        },
        drawTiled: function(a, b, c, e) {
            for (var f = 0, g = (a / this.tilesize).toInt(), h = (b / this.tilesize).toInt(), a = a % this.tilesize, i = b % this.tilesize, b = -a - this.tilesize, f = -i - this.tilesize, c = c + this.tilesize - a, e = e + this.tilesize - i, a = this.tiles.getMaxTileIdx(this.tilesize), i = -1, j = f; j < e; i++, j = j + this.tilesize) {
                var k = i + h;
                if (k >= this.height || k < 0) {
                    if (!this.repeat) continue;
                    k = k > 0 ? k % this.height : (k + 1) % this.height + this.height - 1
                }
                for (var l = -1, o = b; o < c; l++, o = o + this.tilesize) {
                    f = l + g;
                    if (f >= this.width || f < 0) {
                        if (!this.repeat) continue;
                        f = f > 0 ? f % this.width : (f + 1) % this.width + this.width - 1
                    }
                    if (f = this.data[k][f])
                        if (f - 1 < a) this.tiles.drawTile(o, j, f - 1, this.tilesize);
                        else {
                            ig.system.context.fillStyle = "pink";
                            ig.system.context.fillRect(ig.system.getDrawPos(o), ig.system.getDrawPos(j), ig.system.scale * this.tilesize, ig.system.scale * this.tilesize)
                        }
                }
            }
        }
    });
    ig.MAP.MovingParallax = ig.MAP.Background.extend({
        _wm: new ig.Config({
            _label: "MovingParallax",
            _fixSize: false,
            _noRepeat: true,
            _noMoveSpeed: false,
            _noDistance: false,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _objectLayerSupport: false,
            _lighter: true,
            _icon: "weltmeister/lib/map/img/layer-background-icon.png"
        }),
        moveTimer: 0,
        stopped: false,
        init: function(a, b) {
            this.parent(a, b);
            this.repeat = true
        },
        setStopped: function(a) {
            this.stopped = a
        },
        update: function() {
            if (!this.stopped) this.moveTimer = this.moveTimer + ig.system.tick
        },
        setScreenPos: function(a, b) {
            a = a - this.moveTimer * this.moveSpeed.x;
            b = b - this.moveTimer * this.moveSpeed.y;
            this.parent(a, b)
        }
    })
});
ig.baked = !0;
