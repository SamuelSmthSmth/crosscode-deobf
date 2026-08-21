/**
 * impact.base.map
 * ================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.map")`.
 *
 * Map data structures. `ig.Map` holds a 2D grid of tile ids; `ig.ChunkedMap`
 * adds scrolling, parallax distance, and pre-rendering of the grid into offscreen
 * canvas chunks for fast drawing.
 */
ig.module("impact.base.map").defines(function () {

    var scratch = Vec2.create();

    ig.Map = ig.Class.extend({
        tilesize: 8,
        width: 1,
        height: 1,
        data: [[]],
        zHeight: 0,
        zTileOff: 0,
        moveSpeed: { x: 0, y: 0 },

        /**
         * @param {Object} mapData map JSON (tilesize, data, repeat, distance, moveSpeed…)
         * @param {number} zHeight the layer's z height (for 3D offset)
         */
        init: function (mapData, zHeight) {
            this.tilesize = mapData.tilesize;
            var data = mapData.data;
            this.height = (this.data = data) && data.length;
            this.width = data && data[0].length;
            this.repeat = mapData.repeat;
            this.distance = mapData.distance;
            this.yDistance = mapData.yDistance || 0;
            this.zHeight = zHeight;
            this.zTileOff = this.zHeight / this.tilesize;
            this.moveSpeed = (mapData && mapData.moveSpeed) || this.moveSpeed;
        },

        copy: function (other) {
            this.tilesize = other.tilesize;
            this.data = [];
            for (var i = 0; i < other.data.length; ++i) this.data.push(other.data[i].slice());
            this.height = other.height;
            this.width = other.width;
            this.repeat = other.repeat;
            this.distance = other.distance;
            this.yDistance = other.yDistance || 0;
            this.zHeight = other.zHeight;
            this.zTileOff = other.zTileOff;
        },

        clear: function () {
            this.data.length = 0;
        },

        /** Get the tile at world pixel coordinates (x, y). */
        getTile: function (x, y) {
            var tileX = Math.floor(x / this.tilesize);
            var tileY = Math.floor(y / this.tilesize);
            return tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height
                ? this.data[tileY][tileX] : 0;
        },

        /** Get the tile at grid coordinates (col, row). */
        getGridTile: function (col, row) {
            return (this.data[row] && this.data[row][col]) || 0;
        },

        setTile: function (x, y, tileId) {
            return this.setGridTile(Math.floor(x / this.tilesize), Math.floor(y / this.tilesize), tileId);
        },

        setGridTile: function (col, row, tileId) {
            if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
                if (this.data[row][col] == tileId) return false;
                this.data[row][col] = tileId;
                return true;
            }
            return false;
        },
    });

    ig.ChunkedMap = ig.Map.extend({
        scroll: { x: 0, y: 0 },
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

        init: function (mapData, zHeight) {
            this.parent(mapData, zHeight);
        },

        clear: function () {
            this.parent();
            if (this.screenBuffer) {
                this.screenBuffer.clearCached();
                this.screenBuffer = null;
            }
            this.clearPreRenderedChunks();
        },

        clearPreRenderedChunks: function () {
            if (this.preRenderedChunks) {
                for (var i = 0; i < this.preRenderedChunks.length; ++i) {
                    for (var j = 0; j < this.preRenderedChunks[i].length; ++j) {
                        var chunk = this.preRenderedChunks[i][j];
                        chunk.width = 0;
                        chunk.height = 0;
                    }
                    this.preRenderedChunks[i].length = 0;
                }
                this.preRenderedChunks.length = 0;
                this.preRenderedChunks = null;
            }
        },

        setScreenPos: function (x, y) {
            var centerOffsetX = 0;
            var centerOffsetY = 0;
            var distanceY = this.yDistance || this.distance;
            if (this.distance) {
                var centerMapPos = ig.system.getMapFromScreenPos(scratch, ig.system.width / 2, ig.system.height / 2);
                centerOffsetX = ig.game.screen.x + ig.system.width / 2 - centerMapPos.x;
                centerOffsetY = ig.game.screen.y + ig.system.height / 2 - centerMapPos.y;
            }
            this.scroll.x = (x - centerOffsetX) / this.distance + centerOffsetX;
            this.scroll.y = (y - centerOffsetY) / distanceY + centerOffsetY;
            if (this.distance && this.distance < 1) this.scroll.x = this.scroll.x + 16;
            if (distanceY && distanceY < 1) this.scroll.y = this.scroll.y + 16;
            if (this.screenBuffer) this.screenBuffer.update(this);
        },

        setGridTile: function (col, row, tileId) {
            var changed = this.parent(col, row, tileId);
            if (changed && this.preRenderedChunks) {
                this.redrawChunkTile(
                    this.preRenderedChunks[Math.floor(this.tilesize * row * ig.system.scale / this.chunkSizeY)][Math.floor(this.tilesize * col * ig.system.scale / this.chunkSizeX)],
                    this.tilesize * col * ig.system.scale % this.chunkSizeX,
                    this.tilesize * row * ig.system.scale % this.chunkSizeY,
                    tileId
                );
            }
            if (changed && this.screenBuffer) this.screenBuffer.setGridTile(col, row, tileId, this);
        },

        /**
         * Pre-render the whole map into offscreen chunk canvases.
         * @param {Array} [existingChunks] optional chunk grid to merge into
         */
        preRenderMapToChunks: function (existingChunks) {
            var mapWidthPx = this.width * this.tilesize * ig.system.scale;
            var mapHeightPx = this.height * this.tilesize * ig.system.scale;
            var cols = Math.ceil(mapWidthPx / this.chunkSizeX);
            var rows = Math.ceil(mapHeightPx / this.chunkSizeY);
            this.preRenderedChunks = [];
            for (var row = 0; row < rows; row++) {
                this.preRenderedChunks[row] = [];
                for (var col = 0; col < cols; col++) {
                    var chunkWidth = col == cols - 1 ? mapWidthPx - col * this.chunkSizeX : this.chunkSizeX;
                    var chunkHeight = row == rows - 1 ? mapHeightPx - row * this.chunkSizeY : this.chunkSizeY;
                    var chunk = null;
                    if (existingChunks) {
                        chunk = existingChunks[row][col];
                        this.preRenderChunk(col, row, chunkWidth, chunkHeight, chunk, true);
                    } else {
                        chunk = ig.$new("canvas");
                        chunk.width = chunkWidth;
                        chunk.height = chunkHeight;
                        this.preRenderedChunks[row][col] = chunk;
                        ig.system.getBufferContext(chunk).clearRect(0, 0, chunkWidth, chunkHeight);
                        this.preRenderChunk(col, row, chunkWidth, chunkHeight, chunk, false);
                    }
                }
            }
            if (existingChunks) this.merged = true;
            return existingChunks || this.preRenderedChunks;
        },

        readyToDraw: function () {
            return false;
        },

        preRenderChunk: function () {
            return null;
        },
        preRenderScreen: function () {},
        redrawChunkTile: function () {},

        _draw: function (x, y, width, height) {
            if (!this.merged && !(this.screenBuffer && this.screenBuffer.ownerMap != this)) {
                var zoomMinOffset = ig.system.getZoomMinOffset(scratch);
                x = x == undefined ? this.scroll.x + zoomMinOffset.x - 1 : x;
                y = y == undefined ? this.scroll.y + zoomMinOffset.y - 1 : y;
                width = width == undefined ? Math.ceil(ig.system.width / ig.system.zoom) + 2 : width;
                height = height == undefined ? Math.ceil(ig.system.height / ig.system.zoom) + 2 : height;
                if (this.enabled) {
                    if (this.screenBuffer) this.drawFromScreenBuffer(x, y, width, height);
                    else if (this.preRender) this.drawPreRendered(x, y, width, height);
                    else this.drawTiled(x, y, width, height);
                }
            }
        },

        draw: function (x, y, width, height) {
            this._draw(x, y, width, height);
        },

        drawAnimated: null,

        drawFromScreenBuffer: function (x, y, width, height) {
            if (this.screenBuffer.redrawFull) {
                if (!this.readyToDraw()) return;
                this.screenBuffer.update();
            }
            var drawX = ig.system.getDrawPos(x);
            var drawY = ig.system.getDrawPos(y);
            var bufferX = drawX - this.scroll.x * ig.system.scale;
            var bufferY = drawY - this.scroll.y * ig.system.scale;
            if (!ig.perf.smoothMapRendering || !this.distance || this.distance == 1) {
                bufferX = Math.round(bufferX * ig.system.scale) / ig.system.scale;
                bufferY = Math.round(bufferY * ig.system.scale) / ig.system.scale;
            }
            width = width * ig.system.scale;
            height = height * ig.system.scale;
            this.screenBuffer.draw(bufferX, bufferY, drawX, drawY, width, height);
        },

        drawPreRendered: function (x, y, width, height) {
            if (!this.preRenderedChunks) {
                if (!this.readyToDraw()) return;
                this.preRenderMapToChunks();
            }
            if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";

            var drawX = ig.system.getDrawPos(x);
            var drawY = ig.system.getDrawPos(y);
            var bufferX = drawX - this.scroll.x * ig.system.scale;
            var bufferY = drawY - this.scroll.y * ig.system.scale;
            if (!ig.perf.smoothMapRendering || !this.distance || this.distance == 1) {
                bufferX = Math.round(bufferX * ig.system.scale) / ig.system.scale;
                bufferY = Math.round(bufferY * ig.system.scale) / ig.system.scale;
            }

            width = width * ig.system.scale;
            height = height * ig.system.scale;
            var mapWidthPx = this.width * this.tilesize * ig.system.scale;
            var mapHeightPx = this.height * this.tilesize * ig.system.scale;

            if (this.repeat) {
                drawX = (drawX % mapWidthPx + mapWidthPx) % mapWidthPx;
                drawY = (drawY % mapHeightPx + mapHeightPx) % mapHeightPx;
            } else {
                if (drawX + width > mapWidthPx) width = mapWidthPx - drawX;
                if (drawY + height > mapHeightPx) height = mapHeightPx - drawY;
            }

            var startCol = Math.max(Math.floor(drawX / this.chunkSizeX), 0);
            var startRow = Math.max(Math.floor(drawY / this.chunkSizeY), 0);
            var colCount = this.preRenderedChunks[0].length;
            var rowCount = this.preRenderedChunks.length;
            var chunkY = drawY - startRow * this.chunkSizeY;
            var yOffset = 0;
            var srcW, srcH;

            while (yOffset < height) {
                var xOffset = 0;
                var chunkX = drawX - startCol * this.chunkSizeX;
                var col = startCol;
                while (xOffset < width) {
                    var chunk = this.preRenderedChunks[startRow][col];
                    var destX = bufferX + xOffset;
                    var destY = bufferY + yOffset;
                    srcW = Math.min(chunk.width - chunkX, width - xOffset);
                    srcH = Math.min(chunk.height - chunkY, height - yOffset);
                    if (srcW && srcH) {
                        ig.system.context.drawImage(chunk, chunkX, chunkY, srcW, srcH, destX, destY, srcW, srcH);
                        ig.Image.drawCount++;
                    }
                    if (this.debugDraw) {
                        ig.system.context.strokeStyle = "#f0f";
                        ig.system.context.strokeRect(destX, destY, srcW, srcH);
                    }
                    chunkX = 0;
                    xOffset = xOffset + srcW;
                    col = (col + 1) % colCount;
                }
                chunkY = 0;
                yOffset = yOffset + srcH;
                startRow = (startRow + 1) % rowCount;
            }

            if (this.lighter) ig.system.context.globalCompositeOperation = "source-over";
        },

        drawTiled: function () {},
    });

    ig.MAP = {};
});
