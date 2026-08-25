ig.module("impact.feature.light.light-map").requires("impact.feature.light.light", "impact.base.map", "impact.base.game", "impact.base.image", "game.config").defines(function() {
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
        init: function(b, a) {
            this.parent(b, a);
            for (var d = 0; d < this.height; ++d)
                for (var c = 0; c < this.width; ++c)
                    if (this.data[d][c]) {
                        var e = 0,
                            f = 0,
                            g = this.data[d][c],
                            h = (g - 1) % 32 % 5 + 1,
                            i = Math.floor((g - 1) % 32 / 5);
                        switch (Math.floor((g - 1) / 32)) {
                            case 1:
                                f = -8;
                                break;
                            case 2:
                                e = 8;
                                break;
                            case 3:
                                f = 8;
                                break;
                            case 4:
                                e = -8;
                                break;
                            case 5:
                                e = 8;
                                f = -8
                        }
                        if (i != 4) {
                            var g = ig.LIGHT_METRIC[h],
                                j = (c + 0.5) * this.tilesize + e - g.w / 2,
                                k = (d + 0.5) * this.tilesize + f - g.h / 2;
                            this.lightSources.push({
                                x: j,
                                y: k,
                                tX: g.x,
                                tY: g.y,
                                width: g.w,
                                height: g.h
                            })
                        }
                        if (i > 0) {
                            g = ig.LIGHT_METRIC[i == 4 ? h : h + i - 1];
                            j = (c + 0.5) * this.tilesize + e - g.w / 2;
                            k = (d + 0.5) * this.tilesize + f - g.h / 2;
                            this.glowSources.push({
                                x: j,
                                y: k,
                                tX: g.x,
                                tY: g.y,
                                width: g.w,
                                height: g.h
                            })
                        }
                    } ig.light.addShadowProvider(this)
        },
        clear: function() {
            ig.light.removeShadowProvider(this);
            this.parent()
        },
        preRenderChunk: function(b, a, d, c, e) {
            var b = Math.floor(b * this.chunkSizeX / this.tilesize / ig.system.scale),
                a = Math.floor(a * this.chunkSizeY / this.tilesize / ig.system.scale),
                f = ig.system.context;
            (ig.system.context = ig.system.getBufferContext(e)).globalAlpha = 1;
            b = b * this.tilesize;
            a = a * this.tilesize;
            for (e = 0; e < this.lightSources.length; e++) {
                var g = this.lightSources[e];
                g.x > b + d / ig.system.scale || (g.x + g.width < b || g.y > a + c / ig.system.scale || g.y + g.height < a) || this.lightmapGfx.draw(g.x - b, g.y - a, g.tX, g.tY, g.width, g.height)
            }
            ig.system.context = f
        },
        drawShadows: function() {
            if (this.preRenderedChunks && this.preRenderedChunks.length) {
                var b =
                    ig.system.context,
                    a = ig.light.lightMapDarkness;
                if (a > 0) {
                    b.globalAlpha = a;
                    b.globalCompositeOperation = "source-over";
                    b.fillStyle = ig.game.clearColor;
                    b.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight)
                }
                b.globalCompositeOperation = "destination-out";
                b.globalAlpha = ig.light.lightMapBrightness;
                this._draw()
            }
        },
        drawGlow: function() {
            var b = ig.system.context,
                a = this.glowSources.length,
                d = ig.light.getMainGlowGfx();
            if (d)
                for (; a--;) {
                    var c = this.glowSources[a],
                        e = c.x - ig.game.screen.x,
                        f = c.y - ig.game.screen.y;
                    if (!(e + c.width <
                            0 || f + c.height < 0 || e > ig.system.width || f > ig.system.height)) {
                        b.globalCompositeOperation = "lighter";
                        d.draw(e, f, c.tX, c.tY, c.width, c.height)
                    }
                }
        },
        draw: function() {},
        drawTiled: function() {}
    })
});
ig.baked = !0;
