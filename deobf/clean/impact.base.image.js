/*
 * impact.base.image
 * -----------------
 * Image loading and drawing: `ig.Image` (async-loaded images with worker-based
 * filtering/resizing), tiled drawing, patterns, the image atlas (for text and
 * prerendered fragments), and the screen-buffer pool used by scrolling maps.
 *
 * Original: deobf/extract/impact.base.image.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.image").requires("impact.base.worker", "impact.base.loader").defines(function () {
    ig.Image = ig.Loadable.extend({
        cacheType: "Image",
        data: null,
        filtered: {},
        width: 0,
        height: 0,
        toBeFiltered: {},
        additionalCallbacks: [],

        init: function (path) {
            sc.playerSkins && (path = sc.playerSkins.replaceImg(path));
            this.parent(path);
        },

        loadInternal: function () {
            this.data = new Image();
            this.data.onload = this.onload.bind(this);
            this.data.onerror = this.onerror.bind(this);
            this.data.src = ig.getFilePath(ig.root + this.path + ig.getCacheSuffix());
        },

        onCacheCleared: function () {
            this.data = null;
        },

        addCallback: function (callback) {
            this.additionalCallbacks.push(callback);
        },

        addFiltered: function (name, operator, config) {
            !this.filtered[name] && !this.toBeFiltered[name] && (this.loaded ? this._createFiltered(name, operator, config) : (this.toBeFiltered[name] = {
                operator: operator,
                config: config
            }));
        },

        hasFiltered: function (name) {
            return this.filtered[name] != void 0;
        },

        _createFiltered: function (name, operator, config) {
            var canvas = ig.$new("canvas");
            canvas.width = this.data.width;
            canvas.height = this.data.height;
            this.data.getContext || this.resize(1);
            var destData = canvas.getContext("2d").getImageData(0, 0, this.data.width, this.data.height);
            var srcData = this.data.getContext("2d").getImageData(0, 0, this.data.width, this.data.height);
            config.src = srcData;
            config.dest = destData;
            config.hint = name;
            this.filtered[name] = canvas;
            ig.Image.worker.doTask(operator, config, this.onfiltered.bind(this));
        },

        reload: function () {
            this.loaded = false;
            this.data = new Image();
            this.data.onload = this.onload.bind(this);
            this.data.src = ig.root + this.path + "?" + Date.now();
        },

        onload: function () {
            this.width = this.data.width;
            this.height = this.data.height;
            if (ig.system.scale != 1) this.resize(ig.system.scale);
            else this.onresized();
        },

        onresized: function (result) {
            result && this.data.getContext("2d").putImageData(result.result, 0, 0);
            var hadFiltered = false;
            var name;
            for (name in this.toBeFiltered) {
                hadFiltered = true;
                this._createFiltered(name, this.toBeFiltered[name].operator, this.toBeFiltered[name].config);
            }
            if (!hadFiltered) this.onfiltered();
        },

        onfiltered: function (result) {
            if (result) {
                var hint = result.hint;
                this.filtered[hint].getContext("2d").putImageData(result.result, 0, 0);
                delete this.toBeFiltered[hint];
            }
            var allDone = true;
            var name;
            for (name in this.toBeFiltered) {
                allDone = false;
                break;
            }
            if (allDone) {
                this.loadingFinished(true);
                for (name = this.additionalCallbacks.length; name--;) this.additionalCallbacks[name]();
            }
        },

        onerror: function () {
            this.loadingFinished(false);
        },

        getTileSrc: function (coord, tileIndex, tileWidth, tileHeight, offX, offY, xCount) {
            offX = offX || 0;
            coord.x = offX + Math.floor(tileIndex * tileWidth) % (xCount ? xCount * tileWidth : this.width - offX);
            coord.y = (offY || 0) + Math.floor(tileIndex * tileWidth / (xCount ? xCount * tileWidth : this.width - offX)) * (tileHeight || tileWidth);
            return coord;
        },

        resize: function (scale) {
            var newWidth = this.width * scale;
            var newHeight = this.height * scale;
            var srcCanvas = ig.$new("canvas");
            srcCanvas.width = this.width;
            srcCanvas.height = this.height;
            srcCanvas = ig.system.getBufferContext(srcCanvas);
            srcCanvas.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
            var srcData = srcCanvas.getImageData(0, 0, this.width, this.height);
            var destCanvas = ig.$new("canvas");
            destCanvas.width = newWidth;
            destCanvas.height = newHeight;
            newWidth = destCanvas.getContext("2d").getImageData(0, 0, newWidth, newHeight);
            this.data = destCanvas;
            ig.Image.worker.doTask("SCALE", {
                src: srcData,
                dest: newWidth,
                scale: scale
            }, this.onresized.bind(this));
        },

        draw: function (destX, destY, srcX, srcY, width, height, flipX, flipY, alpha, overlayImage, filterKey, scaled) {
            width = width !== void 0 ? width : this.width;
            height = height !== void 0 ? height : this.height;
            alpha = alpha || 0;
            overlayImage = overlayImage || null;
            if (this.loaded && !(width > this.width || height > this.height)) {
                var scale = ig.system.scale;
                srcX = srcX ? srcX * scale : 0;
                srcY = srcY ? srcY * scale : 0;
                width = width * scale;
                height = height * scale;
                if (!(width <= 0 || height <= 0)) {
                    var flipSignX = flipX ? -1 : 1;
                    var flipSignY = flipY ? -1 : 1;
                    var image = this.filtered[filterKey] ? this.filtered[filterKey] : this.data;
                    if (flipX || flipY) {
                        ig.system.context.save();
                        ig.system.context.scale(flipSignX, flipSignY);
                    }
                    if (scaled) {
                        destX = destX * ig.system.scale;
                        destY = destY * ig.system.scale;
                    } else {
                        destX = ig.system.getDrawPos(destX);
                        destY = ig.system.getDrawPos(destY);
                    }
                    destX = destX * flipSignX - (flipX ? width : 0);
                    destY = destY * flipSignY - (flipY ? height : 0);
                    if (alpha < 1) {
                        ig.system.context.drawImage(image, srcX, srcY, width, height, destX, destY, width, height);
                        ig.Image.drawCount++;
                    }
                    if (overlayImage) {
                        ig.system.context.globalAlpha = ig.system.context.globalAlpha * alpha;
                        overlayImage.draw(destX, destY, height);
                        ig.system.context.globalAlpha = ig.system.context.globalAlpha / alpha;
                    }
                    (flipX || flipY) && ig.system.context.restore();
                }
            }
        },

        drawCheck: function (destX, destY, srcX, srcY, width, height, flipX, flipY, alpha, overlayImage, filterKey) {
            destX > ig.system.width || (destY > ig.system.height || destX + width < 0 || destY + height < 0) || this.draw(destX, destY, srcX, srcY, width, height, flipX, flipY, alpha, overlayImage, filterKey);
        },

        drawTileCheck: function (destX, destY, tileIndex, tileWidth, tileHeight, flipX, flipY, alpha, overlayImage, filterKey, scaled) {
            if (!(destX > ig.system.width || destY > ig.system.height || destX + tileWidth < 0 || destY + tileHeight < 0)) {
                tileHeight = tileHeight ? tileHeight : tileWidth;
                this.draw(destX, destY, Math.floor(tileIndex * tileWidth) % this.width, Math.floor(tileIndex * tileWidth / this.width) * tileHeight, tileWidth, tileHeight, flipX, flipY, alpha, overlayImage, filterKey, scaled);
            }
        },

        drawTile: function (destX, destY, tileIndex, tileWidth, tileHeight, flipX, flipY, alpha, overlayImage, filterKey, scaled) {
            var srcY;
            tileHeight = tileHeight ? tileHeight : tileWidth;
            srcY = Math.floor(tileIndex * tileWidth / this.width) * tileHeight;
            if (srcY > this.height && window.wm) {
                destX = ig.system.getDrawPos(destX);
                destY = ig.system.getDrawPos(destY);
                ig.system.context.fillStyle = "magenta";
                ig.system.context.fillRect(destX, destY, tileWidth * ig.system.scale, tileWidth * ig.system.scale);
            }
            this.draw(destX, destY, Math.floor(tileIndex * tileWidth) % this.width, srcY, tileWidth, tileHeight, flipX, flipY, alpha, overlayImage, filterKey, scaled);
        },

        createPattern: function (sourceX, sourceY, width, height, optimization) {
            return new ig.ImagePattern(this, sourceX, sourceY, width, height, optimization);
        },

        getTileModFragment: function (tileIndex, tileWidth, tileHeight, color) {
            tileHeight = tileHeight ? tileHeight : tileWidth;
            return new ig.ImageModFragment(this, Math.floor(tileIndex * tileWidth) % this.width, Math.floor(tileIndex * tileWidth / this.width) * tileHeight, tileWidth, tileHeight, color);
        },

        getMaxTileIdx: function (tileWidth, tileHeight) {
            return this.width / tileWidth * (this.height / (tileHeight || tileWidth));
        }
    });

    ig.ImageCanvasWrapper = ig.Class.extend({
        data: null,
        width: 0,
        height: 0,
        loaded: true,
        filtered: {},

        init: function (canvas) {
            this.data = canvas;
            this.width = canvas.width / ig.system.scale;
            this.height = canvas.height / ig.system.scale;
        },

        draw: ig.Image.prototype.draw
    });

    ig.Image.drawCount = 0;

    ig.Image.reloadCache = function () {
        if (ig.Image.cache) {
            for (var key in ig.Image.cache) ig.Image.cache[key] && ig.Image.cache[key].reload();
        }
    };

    ig.ImagePattern = ig.Class.extend({
        image1: null,
        image2: null,
        pattern: null,
        sourceImage: null,
        optMode: 0,
        sourceX: 0,
        sourceY: 0,
        width: 0,
        height: 0,
        totalWidth: 0,
        totalHeight: 0,
        usePatternDraw: false,

        init: function (image, sourceX, sourceY, width, height, optMode) {
            image = image instanceof ig.Image ? image : new ig.Image(image);
            this.sourceX = sourceX;
            this.sourceY = sourceY;
            this.width = width;
            this.height = height;
            this.optMode = optMode || 0;
            this.sourceImage = image;
            image.loaded ? this.initBuffer() : image.addCallback(this.initBuffer.bind(this));
        },

        initBuffer: function () {
            var scale = ig.system.scale;
            this.sourceX = this.sourceX ? this.sourceX * scale : 0;
            this.sourceY = this.sourceY ? this.sourceY * scale : 0;
            this.width = (this.width ? this.width : this.sourceImage.width) * scale;
            this.height = (this.height ? this.height : this.sourceImage.height) * scale;
            var opt = ig.ImagePattern.OPT;
            var rows = this.optMode == opt.NONE || this.optMode == opt.REPEAT_X ? 1 : 256;
            var cols = Math.ceil((this.optMode == opt.NONE || this.optMode == opt.REPEAT_Y ? 1 : 256) / this.width);
            rows = Math.ceil(rows / this.height);
            var totalWidth = cols * this.width;
            var totalHeight = rows * this.height;
            if (this.usePatternDraw) {
                var patternCanvas = ig.$new("canvas");
                patternCanvas.width = this.width;
                patternCanvas.height = this.height;
                var patternCtx = ig.system.getBufferContext(patternCanvas);
                patternCtx.drawImage(this.sourceImage.data, this.sourceX, this.sourceY, this.width, this.height, 0, 0, this.width, this.height);
                this.pattern = ig.system.context.createPattern(patternCanvas, "repeat");
            } else {
                var canvas = ig.$new("canvas");
                canvas.width = totalWidth;
                canvas.height = this.optMode == opt.REPEAT_X_OR_Y ? this.height : totalHeight;
                var ctx = ig.system.getBufferContext(canvas);
                var row;
                for (row = 0; row < (this.optMode == opt.REPEAT_X_OR_Y ? 1 : rows); ++row) {
                    for (var col = 0; col < cols; ++col) {
                        ctx.drawImage(this.sourceImage.data, this.sourceX, this.sourceY, this.width, this.height, col * this.width, row * this.height, this.width, this.height);
                        ig.Image.drawCount++;
                    }
                }
                this.image1 = canvas;
                if (this.optMode == opt.REPEAT_X_OR_Y) {
                    canvas = ig.$new("canvas");
                    canvas.width = this.width;
                    canvas.height = totalHeight;
                    ctx = ig.system.getBufferContext(canvas);
                    for (row = 0; row < rows; ++row) {
                        ctx.drawImage(this.sourceImage.data, this.sourceX, this.sourceY, this.width, this.height, 0, row * this.height, this.width, this.height);
                        ig.Image.drawCount++;
                    }
                    this.image2 = canvas;
                }
                this.totalWidth = totalWidth;
                this.totalHeight = totalHeight;
            }
        },

        clearCached: function () {
            if (this.image1) {
                this.image1.width = this.image1.height = 0;
                this.image1 = null;
            }
            if (this.image2) {
                this.image2.width = this.image2.height = 0;
                this.image2 = null;
            }
        },

        draw: function (destX, destY, sourceX, sourceY, width, height, scale) {
            scale = scale || ig.system.scale;
            sourceX = sourceX < 0 ? sourceX % this.width + this.width : sourceX % this.width;
            sourceY = sourceY < 0 ? sourceY % this.height + this.height : sourceY % this.height;
            sourceX = ig.system.getDrawPos(sourceX || 0);
            sourceY = ig.system.getDrawPos(sourceY || 0);
            width = width * scale;
            height = height * scale;
            destX = ig.system.getDrawPos(destX);
            destY = ig.system.getDrawPos(destY);
            if (this.pattern) {
                ig.system.context.fillStyle = this.pattern;
                var offsetX = destX % this.width;
                var offsetY = destY % this.height;
                ig.system.context.translate(offsetX - sourceX, offsetY - sourceY);
                ig.system.context.fillRect(destX - offsetX + sourceX, destY - offsetY + sourceY, width, height);
                ig.system.context.translate(-offsetX + sourceX, -offsetY + sourceY);
                ig.Image.drawCount++;
            } else {
                var image = this.image1;
                var imgWidth = this.totalWidth;
                var imgHeight = this.totalHeight;
                if (this.optMode == ig.ImagePattern.OPT.REPEAT_X_OR_Y) {
                    if (width <= this.width) {
                        image = this.image2;
                        imgWidth = this.width;
                    } else {
                        imgHeight = this.height;
                    }
                }
                var drawX = destX - sourceX;
                var drawY = destY - sourceY;
                var endY = height + sourceY;
                var endX = width + sourceX;
                for (var y = 0; y < endY; y = y + imgHeight) {
                    for (var x = 0; x < endX; x = x + imgWidth) {
                        var sx = x ? 0 : sourceX;
                        var sy = y ? 0 : sourceY;
                        var w = Math.min(imgWidth, endX - x) - sx;
                        var h = Math.min(imgHeight, endY - y) - sy;
                        if (w && h) {
                            ig.system.context.drawImage(image, sx, sy, w, h, drawX + x + sx, drawY + y + sy, w, h);
                            ig.Image.drawCount++;
                        }
                    }
                }
            }
        }
    });

    ig.SimpleColor = ig.Class.extend({
        color: null,

        init: function (color) {
            this.color = color;
        },

        draw: function (x, y, width, height) {
            x = ig.system.getDrawPos(x);
            y = ig.system.getDrawPos(y);
            width = width * ig.system.scale;
            height = height * ig.system.scale;
            ig.system.context.fillStyle = this.color;
            ig.system.context.fillRect(x, y, width, height);
        }
    });

    ig.ComplexLineCircleBox = ig.Class.extend({
        color: null,
        circleColor: null,
        target: { x: 0, y: 0 },
        radius: 10,

        init: function (color, circleColor, targetX, targetY, radius) {
            this.color = color;
            this.circleColor = circleColor;
            this.radius = radius || 10;
            this.target.x = targetX;
            this.target.y = targetY;
        },

        draw: function (x, y, width, height) {
            x = ig.system.getDrawPos(x);
            y = ig.system.getDrawPos(y);
            width = width * ig.system.scale;
            height = height * ig.system.scale;
            var ctx = ig.system.context;
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y, width, height);
            if (ig.game._hideCircles != void 0 && !ig.game._hideCircles) {
                ctx.fillStyle = this.circleColor;
                ctx.beginPath();
                ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = this.color;
                ctx.stroke();
            }
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y + height / 2);
            ctx.lineTo(this.target.x - ig.game.screen.x, this.target.y - ig.game.screen.y);
            ctx.stroke();
        }
    });

    ig.SimpleCircle = ig.Class.extend({
        color: null,
        borderColor: null,
        radius: 20,

        init: function (color, borderColor, radius) {
            this.color = color;
            this.borderColor = borderColor || "black";
            this.radius = radius || 20;
        },

        draw: function (x, y, width, height) {
            x = ig.system.getDrawPos(x);
            y = ig.system.getDrawPos(y);
            width = width * ig.system.scale;
            height = height * ig.system.scale;
            var ctx = ig.system.context;
            ctx.fillStyle = this.borderColor;
            ctx.fillRect(x - Math.floor(width / 2), y - Math.floor(height / 2), width, height);
            if (ig.game._hideCircles != void 0 && !ig.game._hideCircles) {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = this.borderColor;
                ctx.stroke();
            }
        }
    });

    ig.TransitionColor = ig.Class.extend({
        colorA: null,
        colorB: null,
        colorBWeight: 0,

        init: function (colorA, colorB, colorBWeight) {
            this.colorA = colorA;
            this.colorB = colorB || colorB;
            this.colorBWeight = colorBWeight || 0;
        },

        setColorBWeight: function (weight) {
            this.colorBWeight = weight;
        },

        draw: function (x, y, width, height) {
            x = ig.system.getDrawPos(x);
            y = ig.system.getDrawPos(y);
            width = width * ig.system.scale;
            height = height * ig.system.scale;
            ig.system.context.fillStyle = this.colorA;
            ig.system.context.fillRect(x, y, width, height);
            var prevAlpha = ig.system.context.globalAlpha;
            ig.system.context.globalAlpha = ig.system.context.globalAlpha * this.colorBWeight;
            ig.system.context.fillStyle = this.colorB;
            ig.system.context.fillRect(x, y, width, height);
            ig.system.context.globalAlpha = prevAlpha;
        }
    });

    ig.DoubleColor = ig.Class.extend({
        color1: null,
        color2: null,

        init: function (color1, color2) {
            this.color1 = color1;
            this.color2 = color2 || color1;
        }
    });

    ig.ImagePattern.OPT = {
        NONE: 0,
        REPEAT_X: 1,
        REPEAT_Y: 2,
        REPEAT_X_OR_Y: 3,
        REPEAT_X_AND_Y: 4
    };

    ig.ImagePatternSheet = ig.Cacheable.extend({
        cacheType: "ImagePatternSheet",
        image: null,
        patternTileWidth: 0,
        patternTileHeight: 0,
        offX: 0,
        offY: 0,
        xCount: 0,
        yCount: 0,
        optimization: ig.ImagePattern.OPT.NONE,
        patterns: [],

        init: function (path, optimization, patternTileWidth, patternTileHeight, offX, offY, xCount, yCount) {
            this.parent();
            this.patternTileWidth = patternTileWidth;
            this.patternTileHeight = patternTileHeight || patternTileWidth;
            this.offX = offX || 0;
            this.offY = offY || 0;
            this.xCount = xCount || 0;
            this.yCount = yCount || 0;
            this.optimization = optimization || ig.ImagePattern.OPT.NONE;
            this.image = new ig.Image(path);
            if (this.image.loaded) this.onImageLoaded();
            else this.image.addCallback(this.onImageLoaded.bind(this));
        },

        getCacheKey: function (path, optimization, patternTileWidth, patternTileHeight, offX, offY, xCount, yCount) {
            return path + "|" + patternTileWidth + "|" + (patternTileHeight || patternTileWidth) + "|" + (offX || 0) + "|" + (offY || 0) + "|" + (xCount || 0) + "|" + (yCount || 0) + "|" + optimization;
        },

        onCacheCleared: function () {
            this.image.decreaseRef();
            for (var i = this.patterns.length; i--;) this.patterns[i] && this.patterns[i].clearCached();
            this.patterns.length = 0;
        },

        onImageLoaded: function () {
            for (var cols = this.xCount || Math.floor((this.image.width - this.offX) / this.patternTileWidth), rows = this.yCount || Math.floor((this.image.height - this.offY) / this.patternTileWidth), y = 0; y < rows; ++y) {
                for (var x = 0; x < cols; ++x) this.patterns[y * cols + x] = this.image.createPattern(this.offX + x * this.patternTileWidth, this.offY + y * this.patternTileHeight, this.patternTileWidth, this.patternTileHeight, this.optimization);
            }
        },

        getPattern: function (index) {
            return this.patterns[index];
        }
    });

    ig.ImageModFragment = ig.Class.extend({
        image: 0,
        sourceX: 0,
        sourceY: 0,
        width: 0,
        height: 0,
        resX: -1,
        resY: -1,

        init: function (image, sourceX, sourceY, width, height, color) {
            this.image = image;
            this.sourceX = sourceX * ig.system.scale;
            this.sourceY = sourceY * ig.system.scale;
            this.width = width * ig.system.scale;
            this.height = height * ig.system.scale;
            this.color = color;
            ig.ImageModFragment.list.push(this);
        },

        prepare: function (destX, destY) {
            if (this.image && this.height && this.width) {
                var ctx = ig.system.getBufferContext(ig.ImageModFragment.buffer);
                ctx.globalCompositeOperation = "source-over";
                ctx.globalAlpha = 1;
                if (this.image instanceof ig.ImagePattern) {
                    var prevContext = ig.system.context;
                    ig.system.context = ctx;
                    this.image.draw(destX, destY, this.sourceX, this.sourceY, this.width, this.height, 1);
                    ig.system.context = prevContext;
                } else if (this.image.data) {
                    ctx.drawImage(this.image.data, this.sourceX, this.sourceY, this.width, this.height, destX, destY, this.width, this.height);
                    ig.Image.drawCount++;
                }
                ctx.globalCompositeOperation = "source-atop";
                ctx.fillStyle = this.color;
                ctx.fillRect(destX, destY, this.width, this.height);
                this.resX = destX;
                this.resY = destY;
            }
        },

        draw: function (destX, destY, sourceX, sourceY, width, height, flipX, flipY) {
            if (this.resX != -1) {
                if (this.resX == -2) throw Error("Error: Tried to draw ImageModFragment twice");
                var scale = ig.system.scale;
                width = width * scale;
                height = height * scale;
                var flipSignX = flipX ? -1 : 1;
                var flipSignY = flipY ? -1 : 1;
                if (flipX || flipY) {
                    ig.system.context.save();
                    ig.system.context.scale(flipSignX, flipSignY);
                }
                destX = ig.system.getDrawPos(destX) * flipSignX - (flipX ? width : 0);
                destY = ig.system.getDrawPos(destY) * flipSignY - (flipY ? height : 0);
                ig.system.context.drawImage(ig.ImageModFragment.buffer, this.resX + sourceX * scale, this.resY + sourceY * scale, width, height, destX, destY, width, height);
                ig.Image.drawCount++;
                (flipX || flipY) && ig.system.context.restore();
            }
        }
    });

    ig.ImageModFragment.BUFFER_WIDTH = 1024;
    ig.ImageModFragment.BUFFER_HEIGHT = 1024;
    ig.ImageModFragment.buffer = ig.$new("canvas");
    ig.ImageModFragment.buffer.width = ig.ImageModFragment.BUFFER_WIDTH;
    ig.ImageModFragment.buffer.height = ig.ImageModFragment.BUFFER_HEIGHT;
    ig.ImageModFragment.list = [];
    ig.ImageModFragment.oldList = [];
    ig.ImageModFragment.prepared = false;

    ig.ImageModFragment.prepare = function () {
        if (!(this.prepared || this.list.length == 0)) {
            ig.system.getBufferContext(this.buffer).clearRect(0, 0, this.BUFFER_WIDTH, this.BUFFER_HEIGHT);
            for (var x = 0, y = 0, rowHeight = 0, i = 0; i < this.list.length; i++) {
                var fragment = this.list[i];
                if (!(fragment.width > this.BUFFER_WIDTH)) {
                    if (x + fragment.width > this.BUFFER_WIDTH) {
                        x = 0;
                        y = rowHeight;
                    }
                    if (!(y + fragment.height > this.BUFFER_HEIGHT)) {
                        fragment.prepare(x, y);
                        rowHeight = Math.max(rowHeight, y + fragment.height);
                        x = x + fragment.width;
                    }
                }
            }
            this.prepared = true;
        }
    };

    ig.ImageModFragment.clear = function () {
        for (var i = 0; i < this.oldList.length; ++i) this.oldList[i].resX = -2;
        this.oldList = this.list;
        this.list = [];
        this.prepared = false;
    };

    ig.ImageAtlas = ig.Class.extend({
        buffers: [],
        debugActive: false,
        lines: [],
        scale: 1,

        init: function () {},

        getFragment: function (width, height, fillCallback) {
            if (ig.perf.showImageAtlas != this.debugActive) {
                this.debugActive = ig.perf.showImageAtlas;
                for (var i = this.buffers.length; i--;) this.debugActive ? document.body.appendChild(this.buffers[i]) : document.body.removeChild(this.buffers[i]);
            }
            width = width * ig.system.scale * this.scale;
            height = height * ig.system.scale * this.scale;
            return this._getFragment(width, height, fillCallback);
        },

        fillFragments: function () {
            for (var i = 0; i < this.lines.length; ++i) {
                for (var entries = this.lines[i].entries, j = 0; j < entries.length; ++j) entries[j].fragment && !entries[j].fragment.filled && entries[j].fragment._fill();
            }
        },

        defragment: function (clear) {
            var y = 0;
            var bufferIdx = 0;
            if ((clear = clear || window.IG_GAME_DEBUG)) {
                for (var i = 0; i < this.buffers.length; ++i) this.buffers[i].getContext("2d").clearRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
            }
            for (i = 0; i < this.lines.length;) {
                var line = this.lines[i];
                if (y + line.height > this.buffers[bufferIdx].height) {
                    y = 0;
                    bufferIdx = bufferIdx + 1;
                }
                line.offY = y;
                line.buffer = this.buffers[bufferIdx];
                var entries = line.entries;
                var x = 0;
                var entry;
                var j = 0;
                for (; j < entries.length;) {
                    if ((entry = entries[j].fragment)) {
                        entries[j].offX = x;
                        if (clear || entry.offX != x || entry.offY != y || entry.buffer != line.buffer) {
                            entry.offX = x;
                            entry.offY = y;
                            entry.buffer = line.buffer;
                            entry.lineIdx = i;
                            entries[j].fragment.filled = false;
                        }
                        x = x + entries[j].width;
                        ++j;
                    } else if (j != entries.length - 1) {
                        entries.splice(j, 1);
                    } else {
                        entries[j].offX = x;
                        x = x + entries[j].width;
                        ++j;
                    }
                }
                if (x < line.buffer.width) {
                    entries[entries.length - 1].fragment ? entries.push({ offX: x, width: line.buffer.width - x, fragment: null }) : (entries[entries.length - 1].width = entries[entries.length - 1].width + (line.buffer.width - x));
                }
                if (line.entries.length == 1 && !line.entries[0].fragment) {
                    this.lines.splice(i, 1);
                } else {
                    y = y + line.height;
                    ++i;
                }
            }
            for (; bufferIdx + 1 < this.buffers.length;) {
                clear = this.buffers.pop();
                this.debugActive && document.body.removeChild(clear);
            }
        },

        release: function (fragment) {
            for (var entries = this.lines[fragment.lineIdx].entries, i = 0; i < entries.length; ++i) {
                if (entries[i].fragment == fragment) {
                    entries[i].fragment = null;
                    if (i + 1 < entries.length && !entries[i + 1].fragment) {
                        entries[i].width = entries[i].width + entries[i + 1].width;
                        entries.splice(i + 1, 1);
                    }
                    if (i > 0 && !entries[i - 1].fragment) {
                        entries[i].width = entries[i].width + entries[i - 1].width;
                        entries[i].offX = entries[i - 1].offX;
                        entries.splice(i - 1, 1);
                    }
                    return;
                }
            }
            for (var line; this.lines.length > 0 && (line = this.lines[this.lines.length - 1]) && line.entries.length == 1 && line.entries[0].fragment;) this.lines.pop();
        },

        _getFragment: function (width, height, fillCallback) {
            var lineIdx;
            var line;
            var entry;
            var found;
            for (lineIdx = 0; !found && lineIdx < this.lines.length; ++lineIdx) {
                if (this.lines[lineIdx].height >= height && height / this.lines[lineIdx].height > 0.5) {
                    for (var entries = this.lines[lineIdx].entries, i = 0; !found && i < entries.length; ++i) {
                        if (!entries[i].fragment && entries[i].width >= width) {
                            found = this._splitEntry(entries, i, width);
                            line = this.lines[lineIdx];
                            lineIdx = lineIdx;
                        }
                    }
                }
            }
            if (!found) {
                line = this._createLine(height);
                lineIdx = this.lines.length - 1;
                found = this._splitEntry(line.entries, 0, width);
            }
            found.fragment = new ig.ImageAtlasFragment(line.buffer, found.offX, line.offY, width, height, lineIdx, fillCallback);
            return found.fragment;
        },

        _createLine: function (height) {
            var buffer = null;
            var offY = 0;
            if (this.lines.length > 0) {
                var lastLine = this.lines[this.lines.length - 1];
                if (lastLine.buffer.height - lastLine.offY - lastLine.height < height) {
                    buffer = this._createBuffer();
                } else {
                    buffer = lastLine.buffer;
                    offY = lastLine.offY + lastLine.height;
                }
            } else {
                buffer = this.buffers.length > 0 ? this.buffers[0] : this._createBuffer();
            }
            var line = {
                offY: offY,
                height: height,
                buffer: buffer,
                entries: [{ offX: 0, width: buffer.width, fragment: null }]
            };
            this.lines.push(line);
            return line;
        },

        _createBuffer: function () {
            var buffer = ig.$new("canvas");
            buffer.width = ig.system.contextWidth * this.scale;
            buffer.height = ig.system.contextHeight * this.scale;
            this.buffers.push(buffer);
            this.debugActive && document.body.appendChild(buffer);
            return buffer;
        },

        _splitEntry: function (entries, index, width) {
            var entry = entries[index];
            if (width == entry.width) return entry;
            var rest = {
                offX: entry.offX + width,
                width: entry.width - width,
                fragment: null
            };
            entry.width = width;
            entries.splice(index + 1, 0, rest);
            return entry;
        }
    });

    ig.imageAtlas = new ig.ImageAtlas();

    ig.ImageAtlasFragment = ig.Class.extend({
        buffer: null,
        offX: 0,
        offY: 0,
        width: 0,
        height: 0,
        fillCallback: null,
        filled: false,
        lineIdx: 0,

        init: function (buffer, offX, offY, width, height, lineIdx, fillCallback) {
            this.buffer = buffer;
            this.offX = offX;
            this.offY = offY;
            this.width = width / ig.system.scale / ig.imageAtlas.scale;
            this.height = height / ig.system.scale / ig.imageAtlas.scale;
            this.lineIdx = lineIdx;
            this.fillCallback = fillCallback;
        },

        invalidate: function () {
            this.filled = false;
        },

        release: function () {
            ig.imageAtlas.release(this);
        },

        draw: function (destX, destY, sourceX, sourceY, width, height, flipX, flipY) {
            var scale = ig.system.scale;
            width = (width || this.width) * scale;
            height = (height || this.height) * scale;
            sourceY = sourceY * scale;
            var flipSignX = flipX ? -1 : 1;
            var flipSignY = flipY ? -1 : 1;
            if (flipX || flipY) {
                ig.system.context.save();
                ig.system.context.scale(flipSignX, flipSignY);
            }
            destX = ig.system.getDrawPos(destX) * flipSignX - (flipX ? width : 0);
            destY = ig.system.getDrawPos(destY) * flipSignY - (flipY ? height : 0);
            var atlasScale = ig.imageAtlas.scale;
            ig.system.context.drawImage(this.buffer, this.offX + sourceX * atlasScale, this.offY + sourceY * atlasScale, width * atlasScale, height * atlasScale, destX, destY, width, height);
            ig.Image.drawCount++;
            (flipX || flipY) && ig.system.context.restore();
        },

        _fill: function () {
            this.filled = true;
            var prevContext = ig.system.context;
            var bufferScale = ig.system.scale * ig.imageAtlas.scale;
            var ctxScale = ig.system.scale;
            var bufferContext = (ig.system.context = ig.system.getBufferContext(this.buffer));
            bufferContext.clearRect(this.offX, this.offY, this.width * bufferScale, this.height * bufferScale);
            bufferContext.save();
            bufferContext.translate(this.offX, this.offY);
            bufferContext.beginPath();
            bufferContext.scale(ig.imageAtlas.scale, ig.imageAtlas.scale);
            bufferContext.rect(0, 0, this.width * ctxScale, this.height * ctxScale);
            bufferContext.clip();
            this.fillCallback();
            bufferContext.restore();
            ig.system.context = prevContext;
        }
    });

    ig.Image.worker = new ig.Worker("impact/webworker/image-tasks.js", "IMAGE");

    ig.ScreenBufferPool = {
        handleList: [],
        freeBuffers: [],
        paddingX: 0,
        paddingY: 0,
        width: 0,
        height: 0,

        updateDimensions: function () {
            var tileSize = ig.CONFIG.DEFAULT_TILE_SIZE;
            var zoomWidth = ig.system.width / ig.system.zoom;
            var zoomHeight = ig.system.height / ig.system.zoom;
            zoomWidth = Math.min(1024, zoomWidth);
            zoomHeight = Math.min(1024, zoomHeight);
            this.paddingX = Math.ceil(Math.max(zoomWidth - ig.system.width, 0) / 2 / tileSize) + 2;
            this.paddingY = Math.ceil(Math.max(zoomHeight - ig.system.height, 0) / 2 / tileSize) + 2;
            this.width = (Math.ceil(ig.system.width / tileSize) + this.paddingX * 2) * tileSize;
            this.height = (Math.ceil(ig.system.height / tileSize) + this.paddingY * 2) * tileSize;
        },

        get: function () {
            if (this.freeBuffers.length) return this.freeBuffers.pop();
            this.width || this.updateDimensions();
            var buffer = ig.$new("canvas");
            buffer.width = this.width * ig.system.scale;
            buffer.height = this.height * ig.system.scale;
            return buffer;
        },

        addHandle: function (handle) {
            this.handleList.push(handle);
        },

        removeHandle: function (handle) {
            this.handleList.erase(handle);
        },

        free: function (buffer) {
            buffer && this.freeBuffers.push(buffer);
        },

        clearBuffers: function () {
            for (var i = this.handleList.length; i--;) this.handleList[i].resetBuffer();
            this.reduceFreeBuffers(0);
            this.updateDimensions();
        },

        reduceFreeBuffers: function (count) {
            for (var i = this.freeBuffers.length; i-- > count;) this.freeBuffers[i].width = 0;
            this.freeBuffers.length = Math.min(this.freeBuffers.length, count);
        }
    };

    ig.ScreenBuffer = ig.Class.extend({
        width: 0,
        height: 0,
        buffer: null,
        scroll: { x: 0, y: 0 },
        off: { x: 0, y: 0 },
        shift: { x: 0, y: 0, full: false },
        redrawFull: false,
        ownerMap: null,

        init: function (map) {
            this.ownerMap = map;
            this.redrawFull = true;
            this.fetchBuffer();
            ig.ScreenBufferPool.addHandle(this);
        },

        clearCached: function () {
            if (this.buffer) {
                ig.ScreenBufferPool.free(this.buffer);
                ig.ScreenBufferPool.removeHandle(this);
                this.ownerMap = this.buffer = null;
            }
        },

        resetBuffer: function () {
            ig.ScreenBufferPool.free(this.buffer);
            this.buffer = null;
            this.redrawFull = true;
        },

        fetchBuffer: function () {
            this.buffer = ig.ScreenBufferPool.get();
            this.width = ig.ScreenBufferPool.width;
            this.height = ig.ScreenBufferPool.height;
        },

        update: function (map) {
            if (map.readyToDraw()) {
                this.buffer || this.fetchBuffer();
                var tileSize = ig.CONFIG.DEFAULT_TILE_SIZE;
                if (map == this.ownerMap) {
                    var targetX = Math.round(map.scroll.x) - ig.ScreenBufferPool.paddingX * tileSize;
                    var targetY = Math.round(map.scroll.y) - ig.ScreenBufferPool.paddingY * tileSize;
                    var deltaX = targetX - this.scroll.x;
                    var deltaY = targetY - this.scroll.y;
                    this.shift.x = 0;
                    this.shift.y = 0;
                    this.shift.full = false;
                    if (Math.abs(deltaX) > tileSize) {
                        this.shift.x = (deltaX > 0 ? Math.floor(deltaX / tileSize) : Math.ceil(deltaX / tileSize)) * tileSize;
                        this.scroll.x = this.scroll.x + this.shift.x;
                        this.off.x = this.off.x + this.shift.x;
                        this.off.x = (this.off.x + this.width) % this.width;
                    }
                    if (Math.abs(deltaY) > tileSize) {
                        this.shift.y = (deltaY > 0 ? Math.floor(deltaY / tileSize) : Math.ceil(deltaY / tileSize)) * tileSize;
                        this.scroll.y = this.scroll.y + this.shift.y;
                        this.off.y = this.off.y + this.shift.y;
                        this.off.y = (this.off.y + this.height) % this.height;
                    }
                    if (this.redrawFull || Math.abs(this.shift.x) >= this.width || Math.abs(this.shift.y) >= this.height) {
                        this.scroll.x = Math.round(targetX / tileSize) * tileSize;
                        this.scroll.y = Math.round(targetY / tileSize) * tileSize;
                        this.off.x = 0;
                        this.off.y = 0;
                        this.shift.full = true;
                        this.redrawFull = false;
                        var buffer = this.buffer;
                        ig.system.getBufferContext(buffer).clearRect(0, 0, buffer.width, buffer.height);
                    }
                }
                this.shift.full ? this._redrawFull(map) : this._redrawShift(map);
            }
        },

        draw: function (destX, destY, sourceX, sourceY, width, height) {
            if (sourceX < this.scroll.x) {
                destX = destX + (this.scroll.x - sourceX);
                width = width - (this.scroll.x - sourceX);
                sourceX = this.scroll.x;
            }
            if (sourceY < this.scroll.y) {
                destY = destY + (this.scroll.y - sourceY);
                width = width - (this.scroll.y - sourceY);
                sourceY = this.scroll.y;
            }
            if (this.ownerMap && this.ownerMap.lighter) ig.system.context.globalCompositeOperation = "lighter";
            sourceX = sourceX - this.scroll.x + this.off.x;
            sourceY = sourceY - this.scroll.y + this.off.y;
            if (width > this.width) width = this.width;
            if (height > this.height) height = this.height;
            sourceX >= this.width && (sourceX = sourceX - this.width);
            sourceY >= this.height && (sourceY = sourceY - this.height);
            var buffer = this.buffer;
            var wrapX;
            var wrapY;
            if (sourceX + width > this.width) {
                wrapX = sourceX + width - this.width;
                width = width - wrapX;
            }
            if (sourceY + height > this.height) {
                wrapY = sourceY + height - this.height;
                height = height - wrapY;
            }
            width && height && ig.system.context.drawImage(buffer, sourceX, sourceY, width, height, destX, destY, width, height);
            wrapX && height && ig.system.context.drawImage(buffer, 0, sourceY, wrapX, height, destX + width, destY, wrapX, height);
            width && wrapY && ig.system.context.drawImage(buffer, sourceX, 0, width, wrapY, destX, destY + height, width, wrapY);
            wrapX && wrapY && ig.system.context.drawImage(buffer, 0, 0, wrapX, wrapY, destX + width, destY + height, wrapX, wrapY);
            if (this.ownerMap && this.ownerMap.lighter) ig.system.context.globalCompositeOperation = "source-over";
        },

        setGridTile: function (gridX, gridY, tileIndex, tileMap) {
            var tileSize = ig.CONFIG.DEFAULT_TILE_SIZE;
            var x = gridX * tileSize - this.scroll.x;
            var y = gridY * tileSize - this.scroll.y;
            if (!(x < 0 || x >= this.width || y < 0 || y >= this.height)) {
                x = (x + this.off.x) % this.width;
                y = (y + this.off.y) % this.height;
                var prevContext = ig.system.context;
                ig.system.context = ig.system.getBufferContext(this.buffer);
                ig.system.context.clearRect(x, y, tileSize, tileSize);
                tileIndex && tileMap.tiles && tileMap.tiles.drawTile(x, y, tileIndex - 1, tileSize);
                ig.system.context = prevContext;
            }
        },

        _redrawFull: function (map) {
            var scrollX = this.scroll.x;
            var scrollY = this.scroll.y;
            var width = this.width;
            var height = this.height;
            var ctx = ig.system.getBufferContext(this.buffer);
            map.preRenderScreen(ctx, 0, 0, scrollX, scrollY, width, height);
        },

        _redrawShift: function (map) {
            if (this.shift.y) {
                var offY = this.shift.y > 0 ? this.off.y - this.shift.y : this.off.y;
                var offX = this.off.x;
                var shiftH = Math.abs(this.shift.y);
                var width = this.width;
                var targetY = this.scroll.y + (this.shift.y > 0 ? this.height - this.shift.y : 0);
                var targetX = this.scroll.x;
                if (this.shift.x) {
                    width = width - Math.abs(this.shift.x);
                    if (this.shift.x < 0) {
                        offX = offX - this.shift.x;
                        targetX = targetX - this.shift.x;
                    }
                }
                this._splitDraw(map, offX, offY, targetX, targetY, width, shiftH);
            }
            if (this.shift.x) {
                offX = this.shift.x > 0 ? this.off.x - this.shift.x : this.off.x;
                offY = this.off.y;
                width = Math.abs(this.shift.x);
                shiftH = this.height;
                targetX = this.scroll.x + (this.shift.x > 0 ? this.width - this.shift.x : 0);
                targetY = this.scroll.y;
                this._splitDraw(map, offX, offY, targetX, targetY, width, shiftH);
            }
        },

        _splitDraw: function (map, offX, offY, scrollX, scrollY, width, height) {
            offX < 0 && (offX = offX + this.width);
            offY < 0 && (offY = offY + this.height);
            var ctx = ig.system.getBufferContext(this.buffer);
            var wrapX;
            var wrapY;
            if (offX + width > this.width) {
                wrapX = offX + width - this.width;
                width = width - wrapX;
            }
            if (offY + height > this.height) {
                wrapY = offY + height - this.height;
                height = height - wrapY;
            }
            if (width && height) {
                map == this.ownerMap && ctx.clearRect(offX, offY, width, height);
                map.preRenderScreen(ctx, offX, offY, scrollX, scrollY, width, height);
            }
            if (width && wrapY) {
                map == this.ownerMap && ctx.clearRect(offX, 0, width, wrapY);
                map.preRenderScreen(ctx, offX, 0, scrollX, scrollY + height, width, wrapY);
            }
            if (wrapX && height) {
                map == this.ownerMap && ctx.clearRect(0, offY, wrapX, height);
                map.preRenderScreen(ctx, 0, offY, scrollX + width, scrollY, wrapX, height);
            }
            if (wrapX && wrapY) {
                map == this.ownerMap && ctx.clearRect(0, 0, wrapX, wrapY);
                map.preRenderScreen(ctx, 0, 0, scrollX + width, scrollY + height, wrapX, wrapY);
            }
        }
    });
});
ig.baked = !0;
