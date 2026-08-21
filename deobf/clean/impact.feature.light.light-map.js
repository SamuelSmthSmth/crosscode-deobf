/**
 * impact.feature.light.light-map
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.light.light-map")`.
 *
 * `ig.MAP.Light` — the "Light" map layer. Its tile data encodes light sources:
 * each tile id carries a light metric index, a source type and a directional
 * offset (so a light source can span several tiles). On load, the layer
 * registers itself as a shadow provider with `ig.light`; the per-chunk
 * pre-render bakes the lightmap sprites, and `drawShadows` / `drawGlow`
 * produce the shadow + glow passes.
 */
ig.module("impact.feature.light.light-map")
    .requires(
        "impact.feature.light.light",
        "impact.base.map",
        "impact.base.game",
        "impact.base.image",
        "game.config"
    )
    .defines(function () {

    ig.MAP.Light = ig.ChunkedMap.extend({
        lightmapGfx: new ig.Image("media/map/lightmap.png"),

        _wm: new ig.Config({
            _label: "Light",
            _fixSize: ig.CONFIG.DISABLE_LAYER_SIZE,
            _noRepeat: true,
            _noMoveSpeed: true,
            _noDistance: ig.CONFIG.DISABLE_LAYER_DISTANCE,
            _fixTilesize: ig.CONFIG.DEFAULT_TILE_SIZE,
            _fixTileset: "media/map/lightmap-tiles.png",
            _fixLevel: "last",
            _icon: "impact/feature/light/editors/layer-icon.png",
            _alphaActive: 1,
            _alphaInactive: 0.4,
            _alphaEntities: 0.5
        }),

        lightSources: [],
        glowSources: [],
        noMerge: true,
        lightCanvas: null,
        shadowOrder: 3,

        /**
         * Decode the tile data into light/glow source entries.
         * @param {Object} mapData - map layer data (tiles etc.)
         * @param {number} zHeight - layer height offset
         */
        init: function (mapData, zHeight) {
            this.parent(mapData, zHeight);
            for (var row = 0; row < this.height; ++row) {
                for (var col = 0; col < this.width; ++col) {
                    if (this.data[row][col]) {
                        var offsetX = 0,
                            offsetY = 0,
                            tileId = this.data[row][col],
                            metricIndex = (tileId - 1) % 32 % 5 + 1,
                            sourceType = Math.floor((tileId - 1) % 32 / 5);
                        switch (Math.floor((tileId - 1) / 32)) {
                            case 1: offsetY = -8; break; // north
                            case 2: offsetX = 8; break;  // east
                            case 3: offsetY = 8; break;  // south
                            case 4: offsetX = -8; break; // west
                            case 5: offsetX = 8; offsetY = -8; break; // north-east
                        }
                        if (sourceType != 4) {
                            var metric = ig.LIGHT_METRIC[metricIndex],
                                x = (col + 0.5) * this.tilesize + offsetX - metric.w / 2,
                                y = (row + 0.5) * this.tilesize + offsetY - metric.h / 2;
                            this.lightSources.push({
                                x: x,
                                y: y,
                                tX: metric.x,
                                tY: metric.y,
                                width: metric.w,
                                height: metric.h
                            });
                        }
                        if (sourceType > 0) {
                            metric = ig.LIGHT_METRIC[sourceType == 4 ? metricIndex : metricIndex + sourceType - 1];
                            x = (col + 0.5) * this.tilesize + offsetX - metric.w / 2;
                            y = (row + 0.5) * this.tilesize + offsetY - metric.h / 2;
                            this.glowSources.push({
                                x: x,
                                y: y,
                                tX: metric.x,
                                tY: metric.y,
                                width: metric.w,
                                height: metric.h
                            });
                        }
                    }
                }
            }
            ig.light.addShadowProvider(this);
        },

        clear: function () {
            ig.light.removeShadowProvider(this);
            this.parent();
        },

        /** Bake the lightmap sprites for one chunk into its offscreen buffer. */
        preRenderChunk: function (col, row, chunkWidth, chunkHeight, chunk) {
            var startCol = Math.floor(col * this.chunkSizeX / this.tilesize / ig.system.scale),
                startRow = Math.floor(row * this.chunkSizeY / this.tilesize / ig.system.scale),
                prevContext = ig.system.context;
            (ig.system.context = ig.system.getBufferContext(chunk)).globalAlpha = 1;
            startCol = startCol * this.tilesize;
            startRow = startRow * this.tilesize;
            for (var i = 0; i < this.lightSources.length; i++) {
                var source = this.lightSources[i];
                if (!(source.x > startCol + chunkWidth / ig.system.scale ||
                    source.x + source.width < startCol ||
                    source.y > startRow + chunkHeight / ig.system.scale ||
                    source.y + source.height < startRow)) {
                    this.lightmapGfx.draw(
                        source.x - startCol, source.y - startRow,
                        source.tX, source.tY, source.width, source.height
                    );
                }
            }
            ig.system.context = prevContext;
        },

        /** Darken the whole screen, then cut light-shaped holes out of the darkness. */
        drawShadows: function () {
            if (this.preRenderedChunks && this.preRenderedChunks.length) {
                var context = ig.system.context,
                    darkness = ig.light.lightMapDarkness;
                if (darkness > 0) {
                    context.globalAlpha = darkness;
                    context.globalCompositeOperation = "source-over";
                    context.fillStyle = ig.game.clearColor;
                    context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                }
                context.globalCompositeOperation = "destination-out";
                context.globalAlpha = ig.light.lightMapBrightness;
                this._draw();
            }
        },

        /** Draw all glow sources additively on top of the world. */
        drawGlow: function () {
            var context = ig.system.context,
                i = this.glowSources.length,
                glowGfx = ig.light.getMainGlowGfx();
            if (glowGfx) {
                for (; i--;) {
                    var source = this.glowSources[i],
                        x = source.x - ig.game.screen.x,
                        y = source.y - ig.game.screen.y;
                    if (!(x + source.width < 0 || y + source.height < 0 || x > ig.system.width || y > ig.system.height)) {
                        context.globalCompositeOperation = "lighter";
                        glowGfx.draw(x, y, source.tX, source.tY, source.width, source.height);
                    }
                }
            }
        },

        draw: function () {},
        drawTiled: function () {}
    });
});
ig.baked = !0;
