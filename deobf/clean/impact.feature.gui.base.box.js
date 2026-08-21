/**
 * impact.feature.gui.base.box
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.base.box")`.
 *
 * Provides 9-patch ("NinePatch") rendering for scalable bordered boxes:
 *   - `ig.NinePatch` — renders an image as a resizable 9-slice box (corners fixed,
 *                      edges and center tiled). Supports multiple named offset variants
 *                      (e.g. different colour themes) and optional skipped slices
 *                      for zero-size borders.
 *   - `ig.BoxGui`    — a `GuiElementBase` wrapper around an `ig.NinePatch`.
 *
 * Slice layout (3×3 grid, indexed 0-8 left-to-right, top-to-bottom):
 *
 *   [0] top-left corner  |  [1] top edge (tiled X)   |  [2] top-right corner
 *   [3] left edge (Y)    |  [4] center (tiled XY)    |  [5] right edge (Y)
 *   [6] bottom-left      |  [7] bottom edge (X)      |  [8] bottom-right corner
 */
ig.module("impact.feature.gui.base.box").requires(
    "impact.feature.gui.gui"
).defines(function () {

    // -------------------------------------------------------------------------
    // ig.NinePatch
    // -------------------------------------------------------------------------

    ig.NinePatch = ig.Class.extend({
        /**
         * Tile descriptor.
         * `width`/`height` are the stretchable center dimensions in the source image.
         * `top`/`bottom`/`left`/`right` are the fixed border widths in the source image.
         * `offsets` maps variant name → {x, y} pixel offset within the source image.
         *
         * @type {{
         *   width: number, height: number,
         *   top: number, bottom: number, left: number, right: number,
         *   offsets: Object.<string, {x:number, y:number}>
         * }}
         */
        tile: {
            width: 0, height: 0,
            top: 0, bottom: 0, left: 0, right: 0,
            offsets: { "default": { x: 0, y: 0 } }
        },

        /**
         * Sparse set of slice indices (0-8) that should not be drawn.
         * Populated in `initPattern()` from zero-size border values.
         * @type {Object.<number, number>}
         */
        skipTile: {},

        /**
         * Per-variant, per-edge `ig.ImagePattern` instances for the tiled slices.
         * Keyed by variant name, then by "top"/"bottom"/"left"/"right"/"center".
         * @type {Object.<string, Object.<string, ig.ImagePattern>>}
         */
        pattern: {},

        /** @type {ig.Image} The source sprite sheet. */
        gfx: null,

        /**
         * @param {string} imagePath  path passed to `new ig.Image()`
         * @param {Object} tileDesc   tile descriptor (see `this.tile`)
         */
        init: function (imagePath, tileDesc) {
            this.tile = tileDesc;
            this.gfx  = new ig.Image(imagePath);
            if (this.gfx.loaded) {
                this.initPattern();
            } else {
                this.gfx.addCallback(this.initPattern.bind(this));
            }
        },

        /**
         * Build `ig.ImagePattern` instances for every tiled edge/center slice,
         * for every variant defined in `tile.offsets`.
         * Also populates `skipTile` for any zero-width/height border.
         */
        initPattern: function () {
            var tile = this.tile;

            // Determine which slices to skip based on zero-size borders.
            if (tile.top    == 0) this.skipTile[0] = this.skipTile[1] = this.skipTile[2] = 1;
            if (tile.bottom == 0) this.skipTile[6] = this.skipTile[7] = this.skipTile[8] = 1;
            if (tile.left   == 0) this.skipTile[0] = this.skipTile[3] = this.skipTile[6] = 1;
            if (tile.right  == 0) this.skipTile[2] = this.skipTile[5] = this.skipTile[8] = 1;
            if (tile.width  == 0) this.skipTile[1] = this.skipTile[4] = this.skipTile[7] = 1;
            if (tile.height == 0) this.skipTile[3] = this.skipTile[4] = this.skipTile[5] = 1;

            for (var variantName in tile.offsets) {
                this.pattern[variantName] = {};
                var offsetX = tile.offsets[variantName].x;
                var offsetY = tile.offsets[variantName].y;

                if (tile.top    > 0 && tile.width  > 0)
                    this.pattern[variantName].top    = this.gfx.createPattern(offsetX + tile.left, offsetY, tile.width, tile.top, ig.ImagePattern.OPT.REPEAT_X);
                if (tile.bottom > 0 && tile.width  > 0)
                    this.pattern[variantName].bottom = this.gfx.createPattern(offsetX + tile.left, offsetY + tile.top + tile.height, tile.width, tile.bottom, ig.ImagePattern.OPT.REPEAT_X);
                if (tile.left   > 0 && tile.height > 0)
                    this.pattern[variantName].left   = this.gfx.createPattern(offsetX, offsetY + tile.top, tile.left, tile.height, ig.ImagePattern.OPT.REPEAT_Y);
                if (tile.right  > 0 && tile.height > 0)
                    this.pattern[variantName].right  = this.gfx.createPattern(offsetX + tile.left + tile.width, offsetY + tile.top, tile.right, tile.height, ig.ImagePattern.OPT.REPEAT_Y);
                if (tile.width  > 0 && tile.height > 0)
                    this.pattern[variantName].center = this.gfx.createPattern(offsetX + tile.left, offsetY + tile.top, tile.width, tile.height, ig.ImagePattern.OPT.REPEAT_X_AND_Y);
            }
        },

        /**
         * Draw the 9-patch at a given size using a `GuiRenderer`.
         *
         * @param {GuiRenderer} renderer
         * @param {number}      drawW       target width in pixels
         * @param {number}      drawH       target height in pixels
         * @param {string}      variantName key into `tile.offsets` / `pattern`
         * @param {number}      [posX=0]    draw X offset within the parent element
         * @param {number}      [posY=0]    draw Y offset within the parent element
         */
        draw: function (renderer, drawW, drawH, variantName, posX, posY) {
            var tile     = this.tile;
            var offsetX  = tile.offsets[variantName].x;
            var offsetY  = tile.offsets[variantName].y;
            var patterns = this.pattern[variantName];
            // The top-border draw height is clamped so it never overlaps the bottom border.
            var topH     = Math.min(tile.top, drawH - tile.bottom);
            posX = posX || 0;
            posY = posY || 0;

            // Corners.
            this.skipTile[0] || renderer.addGfx(this.gfx, posX,                    posY,                       offsetX,                         offsetY,                          tile.left,  topH);
            this.skipTile[2] || renderer.addGfx(this.gfx, posX + drawW - tile.right, posY,                     offsetX + tile.left + tile.width,  offsetY,                          tile.right, topH);
            this.skipTile[6] || renderer.addGfx(this.gfx, posX,                    posY + drawH - tile.bottom, offsetX,                          offsetY + tile.top + tile.height,  tile.left,  tile.bottom);
            this.skipTile[8] || renderer.addGfx(this.gfx, posX + drawW - tile.right, posY + drawH - tile.bottom, offsetX + tile.left + tile.width, offsetY + tile.top + tile.height, tile.right, tile.bottom);

            // Tiled edges.
            this.skipTile[1] || renderer.addPattern(patterns.top,    posX + tile.left,            posY,                       0, 0, drawW - tile.left - tile.right, topH);
            this.skipTile[7] || renderer.addPattern(patterns.bottom, posX + tile.left,            posY + drawH - tile.bottom, 0, 0, drawW - tile.left - tile.right, tile.bottom);
            this.skipTile[3] || renderer.addPattern(patterns.left,   posX,                        posY + topH,                0, 0, tile.left,  drawH - topH - tile.bottom);
            this.skipTile[5] || renderer.addPattern(patterns.right,  posX + drawW - tile.right,   posY + topH,                0, 0, tile.right, drawH - topH - tile.bottom);

            // Tiled center.
            this.skipTile[4] || renderer.addPattern(patterns.center, posX + tile.left,            posY + topH,                0, 0, drawW - tile.left - tile.right, drawH - topH - tile.bottom);
        },

        /**
         * Same as `draw()` but applies a composite/blend mode to every slice.
         *
         * @param {GuiRenderer} renderer
         * @param {number}      drawW
         * @param {number}      drawH
         * @param {string}      variantName
         * @param {string}      [compositeOp="source-over"]
         * @param {number}      [posX=0]
         * @param {number}      [posY=0]
         */
        drawComposite: function (renderer, drawW, drawH, variantName, compositeOp, posX, posY) {
            var tile     = this.tile;
            var offsetX  = tile.offsets[variantName].x;
            var offsetY  = tile.offsets[variantName].y;
            var patterns = this.pattern[variantName];
            var topH     = Math.min(tile.top, drawH - tile.bottom);
            posX = posX || 0;
            posY = posY || 0;
            compositeOp = compositeOp || "source-over";

            this.skipTile[0] || renderer.addGfx(this.gfx, posX,                    posY,                       offsetX,                          offsetY,                          tile.left,  topH       ).setCompositionMode(compositeOp);
            this.skipTile[2] || renderer.addGfx(this.gfx, posX + drawW - tile.right, posY,                     offsetX + tile.left + tile.width,  offsetY,                          tile.right, topH       ).setCompositionMode(compositeOp);
            this.skipTile[6] || renderer.addGfx(this.gfx, posX,                    posY + drawH - tile.bottom, offsetX,                          offsetY + tile.top + tile.height,  tile.left,  tile.bottom).setCompositionMode(compositeOp);
            this.skipTile[8] || renderer.addGfx(this.gfx, posX + drawW - tile.right, posY + drawH - tile.bottom, offsetX + tile.left + tile.width, offsetY + tile.top + tile.height, tile.right, tile.bottom).setCompositionMode(compositeOp);

            this.skipTile[1] || renderer.addPattern(patterns.top,    posX + tile.left,           posY,                       0, 0, drawW - tile.left - tile.right, topH        ).setCompositionMode(compositeOp);
            this.skipTile[7] || renderer.addPattern(patterns.bottom, posX + tile.left,           posY + drawH - tile.bottom, 0, 0, drawW - tile.left - tile.right, tile.bottom ).setCompositionMode(compositeOp);
            this.skipTile[3] || renderer.addPattern(patterns.left,   posX,                       posY + topH,                0, 0, tile.left,  drawH - topH - tile.bottom).setCompositionMode(compositeOp);
            this.skipTile[5] || renderer.addPattern(patterns.right,  posX + drawW - tile.right,  posY + topH,                0, 0, tile.right, drawH - topH - tile.bottom).setCompositionMode(compositeOp);
            this.skipTile[4] || renderer.addPattern(patterns.center, posX + tile.left,           posY + topH,                0, 0, drawW - tile.left - tile.right, drawH - topH - tile.bottom).setCompositionMode(compositeOp);
        }
    });

    // -------------------------------------------------------------------------
    // ig.BoxGui
    // -------------------------------------------------------------------------

    /**
     * A GUI element that renders a resizable 9-patch box.
     * Supports optional horizontal (flipped) or vertical (flippedY) mirroring.
     */
    ig.BoxGui = ig.GuiElementBase.extend({
        /** @type {Object}      cached gfx reference (unused directly; ninepatch holds its own) */
        gfx: {},
        /** @type {ig.NinePatch} */
        ninepatch: null,
        /** The active variant name used when calling ninepatch.draw(). */
        currentTileOffset: "",
        skipTile: {},
        /** If true, draw the box mirrored horizontally (scale X flip). */
        flipped:  false,
        /** If true, draw the box mirrored vertically (scale Y flip). */
        flippedY: false,

        /**
         * @param {number}      width
         * @param {number}      height
         * @param {boolean}     [flipped]    horizontal mirror
         * @param {ig.NinePatch} [ninepatch]  override the prototype ninepatch
         */
        init: function (width, height, flipped, ninepatch) {
            this.parent();
            this.setSize(width, height);
            this.flipped = flipped || false;
            if (ninepatch) this.ninepatch = ninepatch;
            // Pick the first variant name as the default.
            for (var variantName in this.ninepatch.tile.offsets) {
                this.currentTileOffset = variantName;
                break;
            }
        },

        /**
         * Resize the box and recenter its pivot.
         * @param {number} width
         * @param {number} height
         */
        setSize: function (width, height) {
            this.hook.size.x  = width;
            this.hook.size.y  = height;
            this.hook.pivot.x = width  / 2;
            this.hook.pivot.y = height / 2;
        },

        /**
         * Queue the 9-patch draw commands, applying a flip transform if needed.
         * @param {GuiRenderer} renderer
         */
        updateDrawables: function (renderer) {
            if (this.flipped) {
                renderer.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x, 0);
            } else if (this.flippedY) {
                renderer.addTransform().setScale(1, -1).setTranslate(0, this.hook.size.y);
            }

            this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.currentTileOffset);

            if (this.flipped) {
                renderer.undoTransform();
            } else if (this.flippedY) {
                renderer.undoTransform();
            }
        }
    });
});
