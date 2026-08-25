ig.module("impact.feature.gui.base.box").requires("impact.feature.gui.gui").defines(function() {
    ig.NinePatch = ig.Class.extend({
        tile: {
            width: 0,
            height: 0,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 0
                }
            }
        },
        skipTile: {},
        pattern: {},
        gfx: null,
        init: function(b, a) {
            this.tile = a;
            this.gfx = new ig.Image(b);
            this.gfx.loaded ? this.initPattern() : this.gfx.addCallback(this.initPattern.bind(this))
        },
        initPattern: function() {
            var b = this.tile;
            b.top == 0 && (this.skipTile[0] = this.skipTile[1] = this.skipTile[2] = 1);
            b.bottom == 0 && (this.skipTile[6] =
                this.skipTile[7] = this.skipTile[8] = 1);
            b.left == 0 && (this.skipTile[0] = this.skipTile[3] = this.skipTile[6] = 1);
            b.right == 0 && (this.skipTile[2] = this.skipTile[5] = this.skipTile[8] = 1);
            b.width == 0 && (this.skipTile[1] = this.skipTile[4] = this.skipTile[7] = 1);
            b.height == 0 && (this.skipTile[3] = this.skipTile[4] = this.skipTile[5] = 1);
            for (var a in this.tile.offsets) {
                this.pattern[a] = {};
                var d = this.tile.offsets[a].x,
                    c = this.tile.offsets[a].y;
                if (b.top > 0 && b.width > 0) this.pattern[a].top = this.gfx.createPattern(d + b.left, c, b.width, b.top, ig.ImagePattern.OPT.REPEAT_X);
                if (b.bottom > 0 && b.width > 0) this.pattern[a].bottom = this.gfx.createPattern(d + b.left, c + b.top + b.height, b.width, b.bottom, ig.ImagePattern.OPT.REPEAT_X);
                if (b.left > 0 && b.height > 0) this.pattern[a].left = this.gfx.createPattern(d, c + b.top, b.left, b.height, ig.ImagePattern.OPT.REPEAT_Y);
                if (b.right > 0 && b.height > 0) this.pattern[a].right = this.gfx.createPattern(d + b.left + b.width, c + b.top, b.right, b.height, ig.ImagePattern.OPT.REPEAT_Y);
                if (b.width > 0 && b.height > 0) this.pattern[a].center = this.gfx.createPattern(d + b.left, c + b.top, b.width,
                    b.height, ig.ImagePattern.OPT.REPEAT_X_AND_Y)
            }
        },
        draw: function(b, a, d, c, e, f) {
            var g = this.tile,
                h = g.offsets[c].x,
                i = g.offsets[c].y,
                c = this.pattern[c],
                j = Math.min(g.top, d - g.bottom),
                e = e || 0,
                f = f || 0;
            this.skipTile[0] || b.addGfx(this.gfx, e, f, h, i, g.left, j);
            this.skipTile[2] || b.addGfx(this.gfx, e + a - g.right, f, h + g.left + g.width, i, g.right, j);
            this.skipTile[6] || b.addGfx(this.gfx, e, f + d - g.bottom, h, i + g.top + g.height, g.left, g.bottom);
            this.skipTile[8] || b.addGfx(this.gfx, e + a - g.right, f + d - g.bottom, h + g.left + g.width, i + g.top + g.height,
                g.right, g.bottom);
            this.skipTile[1] || b.addPattern(c.top, e + g.left, f, 0, 0, a - g.left - g.right, j);
            this.skipTile[7] || b.addPattern(c.bottom, e + g.left, f + d - g.bottom, 0, 0, a - g.left - g.right, g.bottom);
            this.skipTile[3] || b.addPattern(c.left, e, f + j, 0, 0, g.left, d - j - g.bottom);
            this.skipTile[5] || b.addPattern(c.right, e + a - g.right, f + j, 0, 0, g.right, d - j - g.bottom);
            this.skipTile[4] || b.addPattern(c.center, e + g.left, f + j, 0, 0, a - g.left - g.right, d - j - g.bottom)
        },
        drawComposite: function(b, a, d, c, e, f, g) {
            var h = this.tile,
                i = h.offsets[c].x,
                j = h.offsets[c].y,
                c = this.pattern[c],
                k = Math.min(h.top, d - h.bottom),
                f = f || 0,
                g = g || 0,
                e = e || "source-over";
            this.skipTile[0] || b.addGfx(this.gfx, f, g, i, j, h.left, k).setCompositionMode(e);
            this.skipTile[2] || b.addGfx(this.gfx, f + a - h.right, g, i + h.left + h.width, j, h.right, k).setCompositionMode(e);
            this.skipTile[6] || b.addGfx(this.gfx, f, g + d - h.bottom, i, j + h.top + h.height, h.left, h.bottom).setCompositionMode(e);
            this.skipTile[8] || b.addGfx(this.gfx, f + a - h.right, g + d - h.bottom, i + h.left + h.width, j + h.top + h.height, h.right, h.bottom).setCompositionMode(e);
            this.skipTile[1] || b.addPattern(c.top, f + h.left, g, 0, 0, a - h.left - h.right, k).setCompositionMode(e);
            this.skipTile[7] || b.addPattern(c.bottom, f + h.left, g + d - h.bottom, 0, 0, a - h.left - h.right, h.bottom).setCompositionMode(e);
            this.skipTile[3] || b.addPattern(c.left, f, g + k, 0, 0, h.left, d - k - h.bottom).setCompositionMode(e);
            this.skipTile[5] || b.addPattern(c.right, f + a - h.right, g + k, 0, 0, h.right, d - k - h.bottom).setCompositionMode(e);
            this.skipTile[4] || b.addPattern(c.center, f + h.left, g + k, 0, 0, a - h.left - h.right, d - k - h.bottom).setCompositionMode(e)
        }
    });
    ig.BoxGui = ig.GuiElementBase.extend({
        gfx: {},
        ninepatch: null,
        currentTileOffset: "",
        skipTile: {},
        flipped: false,
        flippedY: false,
        init: function(b, a, d, c) {
            this.parent();
            this.setSize(b, a);
            this.flipped = d || false;
            if (c) this.ninepatch = c;
            for (var e in this.ninepatch.tile.offsets) {
                this.currentTileOffset = e;
                break
            }
        },
        setSize: function(b, a) {
            this.hook.size.x = b;
            this.hook.size.y = a;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        updateDrawables: function(b) {
            this.flipped ? b.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x,
                0) : this.flippedY && b.addTransform().setScale(1, -1).setTranslate(0, this.hook.size.y);
            this.ninepatch.draw(b, this.hook.size.x, this.hook.size.y, this.currentTileOffset);
            this.flipped ? b.undoTransform() : this.flippedY && b.undoTransform()
        }
    })
});
ig.baked = !0;
