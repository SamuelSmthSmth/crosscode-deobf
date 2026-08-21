/**
 * impact.base.background-map
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.background-map")`.
 *
 * Background/parallax tile layers. `ig.MAP.Background` renders a tileset image
 * with pre-rendered chunks and animated-tile support; `ig.MAP.MovingParallax`
 * adds an auto-scrolling background layer.
 */
ig.module("impact.base.background-map")
    .requires("impact.base.map", "impact.base.image", "impact.base.tile-info", "game.config")
    .defines(function () {

        var scratch = Vec2.create();

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
                _icon: "weltmeister/lib/map/img/layer-background-icon.png",
            }),

            init: function (mapData, zHeight) {
                this.parent(mapData, zHeight);
                this.setTileset(mapData.tilesetName);
                this.lighter = mapData.lighter || false;
                this.checkAnimatedTiles();
            },

            clearCached: function () {
                if (this.tiles) this.tiles.decreaseRef();
            },

            readyToDraw: function () {
                return this.tiles.loaded;
            },

            checkAnimatedTiles: function () {
                this.hasAnimatedTiles = false;
                for (var col = 0; col < this.width; col++) {
                    for (var row = 0; row < this.height; row++) {
                        if (this.tileInfo.getAnimTiles(this.data[row][col])) {
                            this.hasAnimatedTiles = true;
                            return;
                        }
                    }
                }
            },

            setTileset: function (tileset) {
                this.tilesetName = tileset instanceof ig.Image ? tileset.path : tileset;
                this.tileInfo = new ig.TileInfo(this.tilesetName);
                this.tiles = new ig.Image(this.tilesetName);
                this.preRenderedChunks = null;
            },

            /**
             * Render the visible part of one chunk's tile grid into a chunk canvas.
             * @returns {HTMLCanvasElement} the chunk
             */
            preRenderChunk: function (col, row, chunkWidth, chunkHeight, chunk) {
                var cols = chunkWidth / this.tilesize / ig.system.scale + 1;
                var rows = chunkHeight / this.tilesize / ig.system.scale + 1;
                var offsetX = col * this.chunkSizeX / ig.system.scale % this.tilesize;
                var offsetY = row * this.chunkSizeY / ig.system.scale % this.tilesize;
                var startCol = Math.floor(col * this.chunkSizeX / this.tilesize / ig.system.scale);
                var startRow = Math.floor(row * this.chunkSizeY / this.tilesize / ig.system.scale);
                var prevContext = ig.system.context;
                ig.system.context = ig.system.getBufferContext(chunk);
                if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";
                for (var j = 0; j < cols; j++) {
                    for (var k = 0; k < rows; k++) {
                        if (j + startCol < this.width && k + startRow < this.height) {
                            var tile = this.data[k + startRow][j + startCol];
                            if (tile) this.tiles.drawTile(j * this.tilesize - offsetX, k * this.tilesize - offsetY, tile - 1, this.tilesize);
                        }
                    }
                }
                if (this.lighter) ig.system.context.globalCompositeOperation = "source-over";
                ig.system.context = prevContext;
                return chunk;
            },

            /**
             * Render a screen-space region of tiles directly (non-chunked path).
             */
            preRenderScreen: function (context, offsetX, offsetY, x, y, width, height) {
                var tilesize = this.tilesize;
                var prevContext = ig.system.context;
                ig.system.context = context;
                if (this.lighter) ig.system.context.globalCompositeOperation = "lighter";
                var startCol = x / tilesize;
                var startRow = y / tilesize;
                var cols = width / tilesize;
                var rows = height / tilesize;
                for (var c = 0; c < cols; ++c) {
                    for (var r = 0; r < rows; ++r) {
                        var col = startCol + c;
                        var row = startRow + r;
                        if (row >= this.height || row < 0) {
                            if (!this.repeat) continue;
                            row = row > 0 ? row % this.height : (row + 1) % this.height + this.height - 1;
                        }
                        if (col >= this.width || col < 0) {
                            if (!this.repeat) continue;
                            col = col > 0 ? col % this.width : (col + 1) % this.width + this.width - 1;
                        }
                        var tile = this.data[row][col];
                        if (tile) {
                            var anim = this.tileInfo.getAnimTiles(tile);
                            if (window.wm || !anim) this.tiles.drawTile(c * tilesize + offsetX, r * tilesize + offsetY, tile - 1, tilesize);
                        }
                    }
                }
                if (this.lighter) ig.system.context.globalCompositeOperation = "source-over";
                ig.system.context = prevContext;
            },

            /**
             * Draw the animated-tile overlay for the visible region.
             */
            drawAnimated: function (x, y, width, height) {
                if (this.hasAnimatedTiles) {
                    var zoomMinOffset = ig.system.getZoomMinOffset(scratch);
                    x = x == undefined ? this.scroll.x + zoomMinOffset.x : x;
                    y = y == undefined ? this.scroll.y + zoomMinOffset.y : y;
                    width = width == undefined ? ig.system.width / ig.system.zoom : width;
                    height = height == undefined ? ig.system.height / ig.system.zoom : height;
                    var frame = Math.floor(ig.game.backgroundAnimTimer / this.tileInfo.animSpeed) % 4;
                    var startCol = Math.floor(x / this.tilesize);
                    var startRow = Math.floor(y / this.tilesize);
                    var endCol = Math.ceil((x + width) / this.tilesize);
                    var endRow = Math.ceil((y + height) / this.tilesize);
                    var smooth = ig.perf.smoothMapRendering && this.distance && this.distance != 1;
                    for (var row = startRow; row < endRow; ++row) {
                        for (var col = startCol; col < endCol; ++col) {
                            var tile = this.getGridTile(col, row);
                            var anim = this.tileInfo.getAnimTiles(tile);
                            if (anim) {
                                this.tiles.drawTile(col * this.tilesize - this.scroll.x, row * this.tilesize - this.scroll.y,
                                    anim[frame] - 1, this.tilesize, this.tilesize, false, false, null, null, null, smooth);
                            }
                        }
                    }
                }
            },

            redrawChunkTile: function (chunk, x, y, tileId) {
                var prevContext = ig.system.context;
                ig.system.context = ig.system.getBufferContext(chunk);
                var scale = ig.system.scale;
                ig.system.context.clearRect(x, y, this.tilesize * scale, this.tilesize * scale);
                if (tileId) this.tiles.drawTile(x / scale, y / scale, tileId - 1, this.tilesize);
                ig.system.context = prevContext;
            },

            drawTiled: function (x, y, width, height) {
                var startCol = (x / this.tilesize).toInt();
                var startRow = (y / this.tilesize).toInt();
                var offsetX = x % this.tilesize;
                var offsetY = y % this.tilesize;
                var drawX = -offsetX - this.tilesize;
                var drawY = -offsetY - this.tilesize;
                var endX = width + this.tilesize - offsetX;
                var endY = height + this.tilesize - offsetY;
                var maxTileIdx = this.tiles.getMaxTileIdx(this.tilesize);
                var row = -1;
                for (var py = drawY; py < endY; row++, py = py + this.tilesize) {
                    var tileRow = row + startRow;
                    if (tileRow >= this.height || tileRow < 0) {
                        if (!this.repeat) continue;
                        tileRow = tileRow > 0 ? tileRow % this.height : (tileRow + 1) % this.height + this.height - 1;
                    }
                    var col = -1;
                    for (var px = drawX; px < endX; col++, px = px + this.tilesize) {
                        var tileCol = col + startCol;
                        if (tileCol >= this.width || tileCol < 0) {
                            if (!this.repeat) continue;
                            tileCol = tileCol > 0 ? tileCol % this.width : (tileCol + 1) % this.width + this.width - 1;
                        }
                        var tile = this.data[tileRow][tileCol];
                        if (tile) {
                            if (tile - 1 < maxTileIdx) {
                                this.tiles.drawTile(px, py, tile - 1, this.tilesize);
                            } else {
                                // Missing/out-of-range tile — draw a pink placeholder.
                                ig.system.context.fillStyle = "pink";
                                ig.system.context.fillRect(
                                    ig.system.getDrawPos(px), ig.system.getDrawPos(py),
                                    ig.system.scale * this.tilesize, ig.system.scale * this.tilesize
                                );
                            }
                        }
                    }
                }
            },
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
                _icon: "weltmeister/lib/map/img/layer-background-icon.png",
            }),
            moveTimer: 0,
            stopped: false,

            init: function (mapData, zHeight) {
                this.parent(mapData, zHeight);
                this.repeat = true;
            },

            setStopped: function (stopped) {
                this.stopped = stopped;
            },

            update: function () {
                if (!this.stopped) this.moveTimer = this.moveTimer + ig.system.tick;
            },

            setScreenPos: function (x, y) {
                x = x - this.moveTimer * this.moveSpeed.x;
                y = y - this.moveTimer * this.moveSpeed.y;
                this.parent(x, y);
            },
        });
    });
