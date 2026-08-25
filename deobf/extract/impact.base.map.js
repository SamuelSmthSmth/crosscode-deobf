ig.module("impact.base.map").defines(function() {
    var b = Vec2.create();
    ig.Map = ig.Class.extend({
        tilesize: 8,
        width: 1,
        height: 1,
        data: [
            []
        ],
        zHeight: 0,
        zTileOff: 0,
        moveSpeed: {
            x: 0,
            y: 0
        },
        init: function(a, b) {
            this.tilesize = a.tilesize;
            var c = a.data;
            this.height = (this.data = c) && c.length;
            this.width = c && c[0].length;
            this.repeat = a.repeat;
            this.distance = a.distance;
            this.yDistance = a.yDistance || 0;
            this.zHeight = b;
            this.zTileOff = this.zHeight / this.tilesize;
            this.moveSpeed = a && a.moveSpeed || this.moveSpeed
        },
        copy: function(a) {
            this.tilesize = a.tilesize;
            this.data = [];
            for (var b = 0; b < a.data.length; ++b) this.data.push(a.data[b].slice());
            this.height = a.height;
            this.width = a.width;
            this.repeat = a.repeat;
            this.distance = a.distance;
            this.yDistance = a.yDistance || 0;
            this.zHeight = a.zHeight;
            this.zTileOff = a.zTileOff
        },
        clear: function() {
            this.data.length = 0
        },
        getTile: function(a, b) {
            var c = Math.floor(a / this.tilesize),
                e = Math.floor(b / this.tilesize);
            return c >= 0 && c < this.width && e >= 0 && e < this.height ? this.data[e][c] : 0
        },
        getGridTile: function(a, b) {
            return this.data[b] && this.data[b][a] || 0
        },
        setTile: function(a,
            b, c) {
            return this.setGridTile(Math.floor(a / this.tilesize), Math.floor(b / this.tilesize), c)
        },
        setGridTile: function(a, b, c) {
            if (a >= 0 && a < this.width && b >= 0 && b < this.height) {
                if (this.data[b][a] == c) return false;
                this.data[b][a] = c;
                return true
            }
            return false
        }
    });
    ig.ChunkedMap = ig.Map.extend({
        scroll: {
            x: 0,
            y: 0
        },
        distance: 1,
        yDistance: 0,
        repeat: false,
        enabled: true,
        preRender: true,
        screenRender: false,
        screenBuffer: false,
        preRenderedChunks: null,
        chunkSizeX: 512,
        chunkSizeY: 512,
        debugDraw: false,
        lighter: false,
        merged: false,
        init: function(a,
            b) {
            this.parent(a, b)
        },
        clear: function() {
            this.parent();
            if (this.screenBuffer) {
                this.screenBuffer.clearCached();
                this.screenBuffer = null
            }
            this.clearPreRenderedChunks()
        },
        clearPreRenderedChunks: function() {
            if (this.preRenderedChunks) {
                for (var a = 0; a < this.preRenderedChunks.length; ++a) {
                    for (var b = 0; b < this.preRenderedChunks[a].length; ++b) {
                        var c = this.preRenderedChunks[a][b];
                        c.width = 0;
                        c.height = 0
                    }
                    this.preRenderedChunks[a].length = 0
                }
                this.preRenderedChunks.length = 0;
                this.preRenderedChunks = null
            }
        },
        setScreenPos: function(a, d) {
            var c =
                0,
                e = 0,
                f = this.yDistance || this.distance;
            if (this.distance) {
                e = ig.system.getMapFromScreenPos(b, ig.system.width / 2, ig.system.height / 2);
                c = ig.game.screen.x + ig.system.width / 2 - e.x;
                e = ig.game.screen.y + ig.system.height / 2 - e.y
            }
            this.scroll.x = (a - c) / this.distance + c;
            this.scroll.y = (d - e) / f + e;
            if (this.distance && this.distance < 1) this.scroll.x = this.scroll.x + 16;
            if (f && f < 1) this.scroll.y = this.scroll.y + 16;
            this.screenBuffer && this.screenBuffer.update(this)
        },
        setGridTile: function(a, b, c) {
            var e = this.parent(a, b, c);
            e && this.preRenderedChunks &&
                this.redrawChunkTile(this.preRenderedChunks[Math.floor(this.tilesize * b * ig.system.scale / this.chunkSizeY)][Math.floor(this.tilesize * a * ig.system.scale / this.chunkSizeX)], this.tilesize * a * ig.system.scale % this.chunkSizeX, this.tilesize * b * ig.system.scale % this.chunkSizeY, c);
            e && this.screenBuffer && this.screenBuffer.setGridTile(a, b, c, this)
        },
        preRenderMapToChunks: function(a) {
            var b = this.width * this.tilesize * ig.system.scale,
                c = this.height * this.tilesize * ig.system.scale,
                e = Math.ceil(b / this.chunkSizeX),
                f = Math.ceil(c / this.chunkSizeY);
            this.preRenderedChunks = [];
            for (var g = 0; g < f; g++) {
                this.preRenderedChunks[g] = [];
                for (var h = 0; h < e; h++) {
                    var i = h == e - 1 ? b - h * this.chunkSizeX : this.chunkSizeX,
                        j = g == f - 1 ? c - g * this.chunkSizeY : this.chunkSizeY,
                        k = null;
                    if (a) {
                        k = a[g][h];
                        this.preRenderChunk(h, g, i, j, k, true)
                    } else {
                        k = ig.$new("canvas");
                        k.width = i;
                        k.height = j;
                        this.preRenderedChunks[g][h] = k;
                        ig.system.getBufferContext(k).clearRect(0, 0, i, j);
                        this.preRenderChunk(h, g, i, j, k, false)
                    }
                }
            }
            if (a) this.merged = true;
            return a || this.preRenderedChunks
        },
        readyToDraw: function() {
            return false
        },
        preRenderChunk: function() {
            return null
        },
        preRenderScreen: function() {},
        redrawChunkTile: function() {},
        _draw: function(a, d, c, e) {
            if (!this.merged && !(this.screenBuffer && this.screenBuffer.ownerMap != this)) {
                var f = ig.system.getZoomMinOffset(b),
                    a = a == void 0 ? this.scroll.x + f.x - 1 : a,
                    d = d == void 0 ? this.scroll.y + f.y - 1 : d,
                    c = c == void 0 ? Math.ceil(ig.system.width / ig.system.zoom) + 2 : c,
                    e = e == void 0 ? Math.ceil(ig.system.height / ig.system.zoom) + 2 : e;
                this.enabled && (this.screenBuffer ? this.drawFromScreenBuffer(a, d, c, e) : this.preRender ? this.drawPreRendered(a,
                    d, c, e) : this.drawTiled(a, d, c, e))
            }
        },
        draw: function(a, b, c, e) {
            this._draw(a, b, c, e)
        },
        drawAnimated: null,
        drawFromScreenBuffer: function(a, b, c, e) {
            if (this.screenBuffer.redrawFull) {
                if (!this.readyToDraw()) return;
                this.screenBuffer.update()
            }
            var a = ig.system.getDrawPos(a),
                b = ig.system.getDrawPos(b),
                f = a - this.scroll.x * ig.system.scale,
                g = b - this.scroll.y * ig.system.scale;
            if (!ig.perf.smoothMapRendering || !this.distance || this.distance == 1) {
                f = Math.round(f * ig.system.scale) / ig.system.scale;
                g = Math.round(g * ig.system.scale) / ig.system.scale
            }
            c =
                c * ig.system.scale;
            e = e * ig.system.scale;
            this.screenBuffer.draw(f, g, a, b, c, e)
        },
        drawPreRendered: function(a, b, c, e) {
            if (!this.preRenderedChunks) {
                if (!this.readyToDraw()) return;
                this.preRenderMapToChunks()
            }
            if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";
            var a = ig.system.getDrawPos(a),
                f = ig.system.getDrawPos(b),
                b = a - this.scroll.x * ig.system.scale,
                g = f - this.scroll.y * ig.system.scale;
            if (!ig.perf.smoothMapRendering || !this.distance || this.distance == 1) {
                b = Math.round(b * ig.system.scale) / ig.system.scale;
                g = Math.round(g * ig.system.scale) / ig.system.scale
            }
            var c = c * ig.system.scale,
                e = e * ig.system.scale,
                h = this.width * this.tilesize * ig.system.scale,
                i = this.height * this.tilesize * ig.system.scale;
            if (this.repeat) {
                a = (a % h + h) % h;
                f = (f % i + i) % i
            } else {
                a + c > h && (c = h - a);
                f + e > i && (e = i - f)
            }
            for (var h = Math.max(Math.floor(a / this.chunkSizeX), 0), j = Math.max(Math.floor(f / this.chunkSizeY), 0), i = this.preRenderedChunks[0].length, k = this.preRenderedChunks.length, f = f - j * this.chunkSizeY, l = 0, o, m; l < e;) {
                for (var n = 0, p = a - h * this.chunkSizeX, r = h; n < c;) {
                    var t =
                        this.preRenderedChunks[j][r],
                        q = b + n,
                        s = g + l;
                    o = Math.min(t.width - p, c - n);
                    m = Math.min(t.height - f, e - l);
                    if (o && m) {
                        ig.system.context.drawImage(t, p, f, o, m, q, s, o, m);
                        ig.Image.drawCount++
                    }
                    if (this.debugDraw) {
                        ig.system.context.strokeStyle = "#f0f";
                        ig.system.context.strokeRect(q, s, o, m)
                    }
                    p = 0;
                    n = n + o;
                    r = (r + 1) % i
                }
                f = 0;
                l = l + m;
                j = (j + 1) % k
            }
            if (this.lighter) ig.system.context.globalCompositeOperation = "source-over"
        },
        drawTiled: function() {}
    });
    ig.MAP = {}
});
ig.baked = !0;
