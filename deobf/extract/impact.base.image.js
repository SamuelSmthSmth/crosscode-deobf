ig.module("impact.base.image").requires("impact.base.worker", "impact.base.loader").defines(function() {
        ig.Image = ig.Loadable.extend({
            cacheType: "Image",
            data: null,
            filtered: {},
            width: 0,
            height: 0,
            toBeFiltered: {},
            additionalCallbacks: [],
            init: function(a) {
                sc.playerSkins &&
                    (a = sc.playerSkins.replaceImg(a));
                this.parent(a)
            },
            loadInternal: function() {
                this.data = new Image;
                this.data.onload = this.onload.bind(this);
                this.data.onerror = this.onerror.bind(this);
                this.data.src = ig.getFilePath(ig.root + this.path + ig.getCacheSuffix())
            },
            onCacheCleared: function() {
                this.data = null
            },
            addCallback: function(a) {
                this.additionalCallbacks.push(a)
            },
            addFiltered: function(a, b, c) {
                !this.filtered[a] && !this.toBeFiltered[a] && (this.loaded ? this._createFiltered(a, b, c) : this.toBeFiltered[a] = {
                    operator: b,
                    config: c
                })
            },
            hasFiltered: function(a) {
                return this.filtered[a] !=
                    void 0
            },
            _createFiltered: function(a, b, c) {
                var d = ig.$new("canvas");
                d.width = this.data.width;
                d.height = this.data.height;
                this.data.getContext || this.resize(1);
                var e = d.getContext("2d").getImageData(0, 0, this.data.width, this.data.height),
                    f = this.data.getContext("2d").getImageData(0, 0, this.data.width, this.data.height);
                c.src = f;
                c.dest = e;
                c.hint = a;
                this.filtered[a] = d;
                ig.Image.worker.doTask(b, c, this.onfiltered.bind(this))
            },
            reload: function() {
                this.loaded = false;
                this.data = new Image;
                this.data.onload = this.onload.bind(this);
                this.data.src = ig.root + this.path + "?" + Date.now()
            },
            onload: function() {
                this.width = this.data.width;
                this.height = this.data.height;
                if (ig.system.scale != 1) this.resize(ig.system.scale);
                else this.onresized()
            },
            onresized: function(a) {
                a && this.data.getContext("2d").putImageData(a.result, 0, 0);
                var a = false,
                    b;
                for (b in this.toBeFiltered) {
                    a = true;
                    this._createFiltered(b, this.toBeFiltered[b].operator, this.toBeFiltered[b].config)
                }
                if (!a) this.onfiltered()
            },
            onfiltered: function(a) {
                if (a) {
                    var b = a.hint;
                    this.filtered[b].getContext("2d").putImageData(a.result,
                        0, 0);
                    delete this.toBeFiltered[b]
                }
                var a = true,
                    c;
                for (c in this.toBeFiltered) {
                    a = false;
                    break
                }
                if (a) {
                    this.loadingFinished(true);
                    for (c = this.additionalCallbacks.length; c--;) this.additionalCallbacks[c]()
                }
            },
            onerror: function() {
                this.loadingFinished(false)
            },
            getTileSrc: function(a, b, c, d, e, f, g) {
                e = e || 0;
                a.x = e + Math.floor(b * c) % (g ? g * c : this.width - e);
                a.y = (f || 0) + Math.floor(b * c / (g ? g * c : this.width - e)) * (d || c);
                return a
            },
            resize: function(a) {
                var b = this.width * a,
                    c = this.height * a,
                    d = ig.$new("canvas");
                d.width = this.width;
                d.height = this.height;
                d = ig.system.getBufferContext(d);
                d.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
                var d = d.getImageData(0, 0, this.width, this.height),
                    e = ig.$new("canvas");
                e.width = b;
                e.height = c;
                b = e.getContext("2d").getImageData(0, 0, b, c);
                this.data = e;
                ig.Image.worker.doTask("SCALE", {
                    src: d,
                    dest: b,
                    scale: a
                }, this.onresized.bind(this))
            },
            draw: function(a, b, c, d, e, f, g, h, i, j, m, n) {
                e = e !== void 0 ? e : this.width;
                f = f !== void 0 ? f : this.height;
                j = j || 0;
                i = i || null;
                if (this.loaded && !(e > this.width || f > this.height)) {
                    var k = ig.system.scale,
                        c = c ? c * k : 0,
                        d = d ? d * k : 0,
                        e = e * k,
                        f = f * k;
                    if (!(e <= 0 || f <= 0)) {
                        var k = g ? -1 : 1,
                            l = h ? -1 : 1,
                            m = this.filtered[m] ? this.filtered[m] : this.data;
                        if (g || h) {
                            ig.system.context.save();
                            ig.system.context.scale(k, l)
                        }
                        if (n) {
                            a = a * ig.system.scale;
                            b = b * ig.system.scale
                        } else {
                            a = ig.system.getDrawPos(a);
                            b = ig.system.getDrawPos(b)
                        }
                        a = a * k - (g ? e : 0);
                        b = b * l - (h ? f : 0);
                        if (j < 1) {
                            ig.system.context.drawImage(m, c, d, e, f, a, b, e, f);
                            ig.Image.drawCount++
                        }
                        if (i) {
                            ig.system.context.globalAlpha = ig.system.context.globalAlpha * j;
                            i.draw(a, b, f);
                            ig.system.context.globalAlpha = ig.system.context.globalAlpha /
                                j
                        }(g || h) && ig.system.context.restore()
                    }
                }
            },
            drawCheck: function(a, b, c, d, e, f, g, h, i, j, m) {
                a > ig.system.width || (b > ig.system.height || a + e < 0 || b + f < 0) || this.draw(a, b, c, d, e, f, g, h, i, j, m)
            },
            drawTileCheck: function(a, b, c, d, e, f, g, h, i, j, m, n) {
                if (!(a > ig.system.width || b > ig.system.height || a + d < 0 || b + e < 0)) {
                    e = e ? e : d;
                    this.draw(a, b, Math.floor(c * d) % this.width, Math.floor(c * d / this.width) * e, d, e, f, g, h, i, j, m, n)
                }
            },
            drawTile: function(a, b, c, d, e, f, g, h, i, j, m) {
                var e = e ? e : d,
                    n = Math.floor(c * d / this.width) * e;
                if (n > this.height && window.wm) {
                    a = ig.system.getDrawPos(a);
                    b = ig.system.getDrawPos(b);
                    ig.system.context.fillStyle = "magenta";
                    ig.system.context.fillRect(a, b, d * ig.system.scale, d * ig.system.scale)
                }
                this.draw(a, b, Math.floor(c * d) % this.width, n, d, e, f, g, h, i, j, m)
            },
            createPattern: function(a, b, c, d, e) {
                return new ig.ImagePattern(this, a, b, c, d, e)
            },
            getTileModFragment: function(a, b, c, d) {
                c = c ? c : b;
                return new ig.ImageModFragment(this, Math.floor(a * b) % this.width, Math.floor(a * b / this.width) * c, b, c, d)
            },
            getMaxTileIdx: function(a, b) {
                return this.width / a * (this.height / (b || a))
            }
        });
        ig.ImageCanvasWrapper =
            ig.Class.extend({
                data: null,
                width: 0,
                height: 0,
                loaded: true,
                filtered: {},
                init: function(a) {
                    this.data = a;
                    this.width = a.width / ig.system.scale;
                    this.height = a.height / ig.system.scale
                },
                draw: ig.Image.prototype.draw
            });
        ig.Image.drawCount = 0;
        ig.Image.reloadCache = function() {
            if (ig.Image.cache)
                for (var a in ig.Image.cache) ig.Image.cache[a] && ig.Image.cache[a].reload()
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
            init: function(a, b, c, d, e, f) {
                a = a instanceof ig.Image ? a : new ig.Image(a);
                this.sourceX = b;
                this.sourceY = c;
                this.width = d;
                this.height = e;
                this.optMode = f || 0;
                this.sourceImage = a;
                a.loaded ? this.initBuffer() : a.addCallback(this.initBuffer.bind(this))
            },
            initBuffer: function() {
                var a = ig.system.scale;
                this.sourceX = this.sourceX ? this.sourceX * a : 0;
                this.sourceY = this.sourceY ? this.sourceY * a : 0;
                this.width = (this.width ? this.width : this.sourceImage.width) * a;
                this.height = (this.height ? this.height : this.sourceImage.height) *
                    a;
                var a = ig.ImagePattern.OPT,
                    b = this.optMode == a.NONE || this.optMode == a.REPEAT_X ? 1 : 256,
                    c = Math.ceil((this.optMode == a.NONE || this.optMode == a.REPEAT_Y ? 1 : 256) / this.width),
                    b = Math.ceil(b / this.height),
                    d = c * this.width,
                    e = b * this.height;
                if (this.usePatternDraw) {
                    var f = ig.$new("canvas");
                    f.width = this.width;
                    f.height = this.height;
                    var g = ig.system.getBufferContext(f);
                    g.drawImage(this.sourceImage.data, this.sourceX, this.sourceY, this.width, this.height, 0, 0, this.width, this.height);
                    this.pattern = ig.system.context.createPattern(f,
                        "repeat")
                } else {
                    f = ig.$new("canvas");
                    f.width = d;
                    f.height = this.optMode == a.REPEAT_X_OR_Y ? this.height : e;
                    for (var g = ig.system.getBufferContext(f), h = 0; h < (this.optMode == a.REPEAT_X_OR_Y ? 1 : b); ++h)
                        for (var i = 0; i < c; ++i) {
                            g.drawImage(this.sourceImage.data, this.sourceX, this.sourceY, this.width, this.height, i * this.width, h * this.height, this.width, this.height);
                            ig.Image.drawCount++
                        }
                    this.image1 = f;
                    if (this.optMode == a.REPEAT_X_OR_Y) {
                        f = ig.$new("canvas");
                        f.width = this.width;
                        f.height = e;
                        g = ig.system.getBufferContext(f);
                        for (h = 0; h < b; ++h) {
                            g.drawImage(this.sourceImage.data,
                                this.sourceX, this.sourceY, this.width, this.height, 0, h * this.height, this.width, this.height);
                            ig.Image.drawCount++
                        }
                        this.image2 = f
                    }
                    this.totalWidth = d;
                    this.totalHeight = e
                }
            },
            clearCached: function() {
                if (this.image1) {
                    this.image1.width = this.image1.height = 0;
                    this.image1 = null
                }
                if (this.image2) {
                    this.image2.width = this.image2.height = 0;
                    this.image2 = null
                }
            },
            draw: function(a, b, c, d, e, f, g) {
                g = g || ig.system.scale;
                c = c < 0 ? c % this.width + this.width : c % this.width;
                d = d < 0 ? d % this.height + this.height : d % this.height;
                c = ig.system.getDrawPos(c || 0);
                d =
                    ig.system.getDrawPos(d || 0);
                e = e * g;
                f = f * g;
                a = ig.system.getDrawPos(a);
                b = ig.system.getDrawPos(b);
                if (this.pattern) {
                    ig.system.context.fillStyle = this.pattern;
                    var g = a % this.width,
                        h = b % this.height;
                    ig.system.context.translate(g - c, h - d);
                    ig.system.context.fillRect(a - g + c, b - h + d, e, f);
                    ig.system.context.translate(-g + c, -h + d);
                    ig.Image.drawCount++
                } else {
                    var g = this.image1,
                        h = this.totalWidth,
                        i = this.totalHeight;
                    if (this.optMode == ig.ImagePattern.OPT.REPEAT_X_OR_Y)
                        if (e <= this.width) {
                            g = this.image2;
                            h = this.width
                        } else i = this.height;
                    for (var a =
                            a - c, b = b - d, f = f + d, e = e + c, j = 0; j < f; j = j + i)
                        for (var m = 0; m < e; m = m + h) {
                            var n = m ? 0 : c,
                                k = j ? 0 : d,
                                l = Math.min(h, e - m) - n,
                                o = Math.min(i, f - j) - k;
                            if (l && o) {
                                ig.system.context.drawImage(g, n, k, l, o, a + m + n, b + j + k, l, o);
                                ig.Image.drawCount++
                            }
                        }
                }
            }
        });
        ig.SimpleColor = ig.Class.extend({
            color: null,
            init: function(a) {
                this.color = a
            },
            draw: function(a, b, c, d) {
                a = ig.system.getDrawPos(a);
                b = ig.system.getDrawPos(b);
                c = c * ig.system.scale;
                d = d * ig.system.scale;
                ig.system.context.fillStyle = this.color;
                ig.system.context.fillRect(a, b, c, d)
            }
        });
        ig.ComplexLineCircleBox =
            ig.Class.extend({
                color: null,
                circleColor: null,
                target: {
                    x: 0,
                    y: 0
                },
                radius: 10,
                init: function(a, b, c, d, e) {
                    this.color = a;
                    this.circleColor = b;
                    this.radius = e || 10;
                    this.target.x = c;
                    this.target.y = d
                },
                draw: function(a, b, c, d) {
                    var a = ig.system.getDrawPos(a),
                        b = ig.system.getDrawPos(b),
                        c = c * ig.system.scale,
                        d = d * ig.system.scale,
                        e = ig.system.context;
                    e.fillStyle = this.color;
                    e.fillRect(a, b, c, d);
                    if (ig.game._hideCircles != void 0 && !ig.game._hideCircles) {
                        e.fillStyle = this.circleColor;
                        e.beginPath();
                        e.arc(a, b, this.radius, 0, 2 * Math.PI);
                        e.fill();
                        e.strokeStyle = this.color;
                        e.stroke()
                    }
                    e.strokeStyle = this.color;
                    e.beginPath();
                    e.moveTo(a + c / 2, b + d / 2);
                    e.lineTo(this.target.x - ig.game.screen.x, this.target.y - ig.game.screen.y);
                    e.stroke()
                }
            });
        ig.SimpleCircle = ig.Class.extend({
            color: null,
            borderColor: null,
            radius: 20,
            init: function(a, b, c) {
                this.color = a;
                this.borderColor = b || "black";
                this.radius = c || 20
            },
            draw: function(a, b, c, d) {
                var a = ig.system.getDrawPos(a),
                    b = ig.system.getDrawPos(b),
                    c = c * ig.system.scale,
                    d = d * ig.system.scale,
                    e = ig.system.context;
                e.fillStyle = this.borderColor;
                e.fillRect(a - Math.floor(c / 2), b - Math.floor(d / 2), c, d);
                if (ig.game._hideCircles != void 0 && !ig.game._hideCircles) {
                    e.fillStyle = this.color;
                    e.beginPath();
                    e.arc(a, b, this.radius, 0, 2 * Math.PI);
                    e.fill();
                    e.strokeStyle = this.borderColor;
                    e.stroke()
                }
            }
        });
        ig.TransitionColor = ig.Class.extend({
            colorA: null,
            colorB: null,
            colorBWeight: 0,
            init: function(a, b, c) {
                this.colorA = a;
                this.colorB = b || b;
                this.colorBWeight = c || 0
            },
            setColorBWeight: function(a) {
                this.colorBWeight = a
            },
            draw: function(a, b, c, d) {
                a = ig.system.getDrawPos(a);
                b = ig.system.getDrawPos(b);
                c = c * ig.system.scale;
                d = d * ig.system.scale;
                ig.system.context.fillStyle = this.colorA;
                ig.system.context.fillRect(a, b, c, d);
                var e = ig.system.context.globalAlpha;
                ig.system.context.globalAlpha = ig.system.context.globalAlpha * this.colorBWeight;
                ig.system.context.fillStyle = this.colorB;
                ig.system.context.fillRect(a, b, c, d);
                ig.system.context.globalAlpha = e
            }
        });
        ig.DoubleColor = ig.Class.extend({
            color1: null,
            color2: null,
            init: function(a, b) {
                this.color1 = a;
                this.color2 = b || a
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
            init: function(a, b, c, d, e, f, g, h) {
                this.parent();
                this.patternTileWidth = c;
                this.patternTileHeight = d || c;
                this.offX = e || 0;
                this.offY = f || 0;
                this.xCount = g || 0;
                this.yCount = h || 0;
                this.optimization = b || ig.ImagePattern.OPT.NONE;
                this.image = new ig.Image(a);
                if (this.image.loaded) this.onImageLoaded();
                else this.image.addCallback(this.onImageLoaded.bind(this))
            },
            getCacheKey: function(a, b, c, d, e, f, g, h) {
                return a + "|" + c + "|" + (d || c) + "|" + (e || 0) + "|" + (f || 0) + "|" + (g || 0) + "|" + (h || 0) + "|" + b
            },
            onCacheCleared: function() {
                this.image.decreaseRef();
                for (var a = this.patterns.length; a--;) this.patterns[a] && this.patterns[a].clearCached();
                this.patterns.length = 0
            },
            onImageLoaded: function() {
                for (var a = this.xCount || Math.floor((this.image.width - this.offX) / this.patternTileWidth), b = this.yCount || Math.floor((this.image.height - this.offY) / this.patternTileWidth), c = 0; c < b; ++c)
                    for (var d = 0; d < a; ++d) this.patterns[c *
                        a + d] = this.image.createPattern(this.offX + d * this.patternTileWidth, this.offY + c * this.patternTileHeight, this.patternTileWidth, this.patternTileHeight, this.optimization)
            },
            getPattern: function(a) {
                return this.patterns[a]
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
            init: function(a, b, c, d, e, f) {
                this.image = a;
                this.sourceX = b * ig.system.scale;
                this.sourceY = c * ig.system.scale;
                this.width = d * ig.system.scale;
                this.height = e * ig.system.scale;
                this.color = f;
                ig.ImageModFragment.list.push(this)
            },
            prepare: function(a, b) {
                if (this.image && this.height && this.width) {
                    var c = ig.system.getBufferContext(ig.ImageModFragment.buffer);
                    c.globalCompositeOperation = "source-over";
                    c.globalAlpha = 1;
                    if (this.image instanceof ig.ImagePattern) {
                        var d = ig.system.context;
                        ig.system.context = c;
                        this.image.draw(a, b, this.sourceX, this.sourceY, this.width, this.height, 1);
                        ig.system.context = d
                    } else if (this.image.data) {
                        c.drawImage(this.image.data, this.sourceX, this.sourceY, this.width, this.height, a, b, this.width, this.height);
                        ig.Image.drawCount++
                    }
                    c.globalCompositeOperation =
                        "source-atop";
                    c.fillStyle = this.color;
                    c.fillRect(a, b, this.width, this.height);
                    this.resX = a;
                    this.resY = b
                }
            },
            draw: function(a, b, c, d, e, f, g, h) {
                if (this.resX != -1) {
                    if (this.resX == -2) throw Error("Error: Tried to draw ImageModFragment twice");
                    var i = ig.system.scale,
                        e = e * i,
                        f = f * i,
                        j = g ? -1 : 1,
                        m = h ? -1 : 1;
                    if (g || h) {
                        ig.system.context.save();
                        ig.system.context.scale(j, m)
                    }
                    a = ig.system.getDrawPos(a) * j - (g ? e : 0);
                    b = ig.system.getDrawPos(b) * m - (h ? f : 0);
                    ig.system.context.drawImage(ig.ImageModFragment.buffer, this.resX + c * i, this.resY + d * i, e, f,
                        a, b, e, f);
                    ig.Image.drawCount++;
                    (g || h) && ig.system.context.restore()
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
        ig.ImageModFragment.prepare = function() {
            if (!(this.prepared || this.list.length == 0)) {
                ig.system.getBufferContext(this.buffer).clearRect(0,
                    0, this.BUFFER_WIDTH, this.BUFFER_HEIGHT);
                for (var a = 0, b = 0, c = 0, d = 0; d < this.list.length; d++) {
                    var e = this.list[d];
                    if (!(e.width > this.BUFFER_WIDTH)) {
                        if (a + e.width > this.BUFFER_WIDTH) {
                            a = 0;
                            b = c
                        }
                        if (!(b + e.height > this.BUFFER_HEIGHT)) {
                            e.prepare(a, b);
                            c = Math.max(c, b + e.height);
                            a = a + e.width
                        }
                    }
                }
                this.prepared = true
            }
        };
        ig.ImageModFragment.clear = function() {
            for (var a = 0; a < this.oldList.length; ++a) this.oldList[a].resX = -2;
            this.oldList = this.list;
            this.list = [];
            this.prepared = false
        };
        ig.ImageAtlas = ig.Class.extend({
            buffers: [],
            debugActive: false,
            lines: [],
            scale: 1,
            init: function() {},
            getFragment: function(a, b, c) {
                if (ig.perf.showImageAtlas != this.debugActive) {
                    this.debugActive = ig.perf.showImageAtlas;
                    for (var d = this.buffers.length; d--;) this.debugActive ? document.body.appendChild(this.buffers[d]) : document.body.removeChild(this.buffers[d])
                }
                a = a * ig.system.scale * this.scale;
                b = b * ig.system.scale * this.scale;
                return this._getFragment(a, b, c)
            },
            fillFragments: function() {
                for (var a = 0; a < this.lines.length; ++a)
                    for (var b = this.lines[a].entries, c = 0; c < b.length; ++c) b[c].fragment &&
                        !b[c].fragment.filled && b[c].fragment._fill()
            },
            defragment: function(a) {
                var b = 0,
                    c = 0;
                if (a = a || window.IG_GAME_DEBUG)
                    for (var d = 0; d < this.buffers.length; ++d) this.buffers[d].getContext("2d").clearRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
                for (d = 0; d < this.lines.length;) {
                    var e = this.lines[d];
                    if (b + e.height > this.buffers[c].height) {
                        b = 0;
                        c = c + 1
                    }
                    e.offY = b;
                    e.buffer = this.buffers[c];
                    for (var f = e.entries, g = 0, h, i = 0; i < f.length;)
                        if (h = f[i].fragment) {
                            f[i].offX = g;
                            if (a || h.offX != g || h.offY != b || h.buffer != e.buffer) {
                                h.offX =
                                    g;
                                h.offY = b;
                                h.buffer = e.buffer;
                                h.lineIdx = d;
                                f[i].fragment.filled = false
                            }
                            g = g + f[i].width;
                            ++i
                        } else if (i != f.length - 1) f.splice(i, 1);
                    else {
                        f[i].offX = g;
                        g = g + f[i].width;
                        ++i
                    }
                    if (g < e.buffer.width) f[f.length - 1].fragment ? f.push({
                        offX: g,
                        width: e.buffer.width - g,
                        fragment: null
                    }) : f[f.length - 1].width = f[f.length - 1].width + (e.buffer.width - g);
                    if (e.entries.length == 1 && !e.entries[0].fragment) this.lines.splice(d, 1);
                    else {
                        b = b + e.height;
                        ++d
                    }
                }
                for (; c + 1 < this.buffers.length;) {
                    a = this.buffers.pop();
                    this.debugActive && document.body.removeChild(a)
                }
            },
            release: function(a) {
                for (var b = this.lines[a.lineIdx].entries, c = 0; c < b.length; ++c)
                    if (b[c].fragment == a) {
                        b[c].fragment = null;
                        if (c + 1 < b.length && !b[c + 1].fragment) {
                            b[c].width = b[c].width + b[c + 1].width;
                            b.splice(c + 1, 1)
                        }
                        if (c > 0 && !b[c - 1].fragment) {
                            b[c].width = b[c].width + b[c - 1].width;
                            b[c].offX = b[c - 1].offX;
                            b.splice(c - 1, 1)
                        }
                        return
                    } for (var d; this.lines.length > 0 && (d = this.lines[this.lines - 1]) && d.entries.length == 1 && d.entries[0].fragment;) this.lines.pop()
            },
            _getFragment: function(a, b, c) {
                for (var d, e, f, g = 0; !f && g < this.lines.length; ++g)
                    if (this.lines[g].height >=
                        b && b / this.lines[g].height > 0.5)
                        for (var h = this.lines[g].entries, i = 0; !f && i < h.length; ++i)
                            if (!h[i].fragment && h[i].width >= a) {
                                f = this._splitEntry(h, i, a);
                                e = this.lines[g];
                                d = g
                            } if (!f) {
                    e = this._createLine(b);
                    d = this.lines.length - 1;
                    f = this._splitEntry(e.entries, 0, a)
                }
                f.fragment = new ig.ImageAtlasFragment(e.buffer, f.offX, e.offY, a, b, d, c);
                return f.fragment
            },
            _createLine: function(a) {
                var b = null,
                    c = 0;
                if (this.lines.length > 0) {
                    var d = this.lines[this.lines.length - 1];
                    if (d.buffer.height - d.offY - d.height < a) b = this._createBuffer();
                    else {
                        b =
                            d.buffer;
                        c = d.offY + d.height
                    }
                } else b = this.buffers.length > 0 ? this.buffers[0] : this._createBuffer();
                a = {
                    offY: c,
                    height: a,
                    buffer: b,
                    entries: [{
                        offX: 0,
                        width: b.width,
                        fragment: null
                    }]
                };
                this.lines.push(a);
                return a
            },
            _createBuffer: function() {
                var a = ig.$new("canvas");
                a.width = ig.system.contextWidth * this.scale;
                a.height = ig.system.contextHeight * this.scale;
                this.buffers.push(a);
                this.debugActive && document.body.appendChild(a);
                return a
            },
            _splitEntry: function(a, b, c) {
                var d = a[b];
                if (c == d.width) return d;
                var e = {
                    offX: d.offX + c,
                    width: d.width -
                        c,
                    fragment: null
                };
                d.width = c;
                a.splice(b + 1, 0, e);
                return d
            }
        });
        ig.imageAtlas = new ig.ImageAtlas;
        ig.ImageAtlasFragment = ig.Class.extend({
            buffer: null,
            offX: 0,
            offY: 0,
            width: 0,
            height: 0,
            fillCallback: null,
            filled: false,
            lineIdx: 0,
            init: function(a, b, c, d, e, f, g) {
                this.buffer = a;
                this.offX = b;
                this.offY = c;
                this.width = d / ig.system.scale / ig.imageAtlas.scale;
                this.height = e / ig.system.scale / ig.imageAtlas.scale;
                this.lineIdx = f;
                this.fillCallback = g
            },
            invalidate: function() {
                this.filled = false
            },
            release: function() {
                ig.imageAtlas.release(this)
            },
            draw: function(a, b, c, d, e, f, g, h) {
                var i = ig.system.scale,
                    e = (e || this.width) * i,
                    f = (f || this.height) * i,
                    d = d * i,
                    i = g ? -1 : 1,
                    j = h ? -1 : 1;
                if (g || h) {
                    ig.system.context.save();
                    ig.system.context.scale(i, j)
                }
                a = ig.system.getDrawPos(a) * i - (g ? e : 0);
                b = ig.system.getDrawPos(b) * j - (h ? f : 0);
                i = ig.imageAtlas.scale;
                ig.system.context.drawImage(this.buffer, this.offX + c * i, this.offY + d * i, e * i, f * i, a, b, e, f);
                ig.Image.drawCount++;
                (g || h) && ig.system.context.restore()
            },
            _fill: function() {
                this.filled = true;
                var a = ig.system.context,
                    b = ig.system.scale * ig.imageAtlas.scale,
                    c = ig.system.scale,
                    d = ig.system.context = ig.system.getBufferContext(this.buffer);
                d.clearRect(this.offX, this.offY, this.width * b, this.height * b);
                d.save();
                d.translate(this.offX, this.offY);
                d.beginPath();
                d.scale(ig.imageAtlas.scale, ig.imageAtlas.scale);
                d.rect(0, 0, this.width * c, this.height * c);
                d.clip();
                this.fillCallback();
                d.restore();
                ig.system.context = a
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
            updateDimensions: function() {
                var a = ig.CONFIG.DEFAULT_TILE_SIZE,
                    b = ig.system.width / ig.system.zoom,
                    c = ig.system.height / ig.system.zoom,
                    b = Math.min(1024, b),
                    c = Math.min(1024, c);
                this.paddingX = Math.ceil(Math.max(b - ig.system.width, 0) / 2 / a) + 2;
                this.paddingY = Math.ceil(Math.max(c - ig.system.height, 0) / 2 / a) + 2;
                this.width = (Math.ceil(ig.system.width / a) + this.paddingX * 2) * a;
                this.height = (Math.ceil(ig.system.height / a) + this.paddingY * 2) * a
            },
            get: function() {
                if (this.freeBuffers.length) return this.freeBuffers.pop();
                this.width || this.updateDimensions();
                var a = ig.$new("canvas");
                a.width = this.width * ig.system.scale;
                a.height = this.height * ig.system.scale;
                return a
            },
            addHandle: function(a) {
                this.handleList.push(a)
            },
            removeHandle: function(a) {
                this.handleList.erase(a)
            },
            free: function(a) {
                a && this.freeBuffers.push(a)
            },
            clearBuffers: function() {
                for (var a = this.handleList.length; a--;) this.handleList[a].resetBuffer();
                this.reduceFreeBuffers(0);
                this.updateDimensions()
            },
            reduceFreeBuffers: function(a) {
                for (var b = this.freeBuffers.length; b-- > a;) this.freeBuffers[b].width = 0;
                this.freeBuffers.length =
                    Math.min(this.freeBuffers.length, a)
            }
        };
        ig.ScreenBuffer = ig.Class.extend({
            width: 0,
            height: 0,
            buffer: null,
            scroll: {
                x: 0,
                y: 0
            },
            off: {
                x: 0,
                y: 0
            },
            shift: {
                x: 0,
                y: 0,
                full: false
            },
            redrawFull: false,
            ownerMap: null,
            init: function(a) {
                this.ownerMap = a;
                this.redrawFull = true;
                this.fetchBuffer();
                ig.ScreenBufferPool.addHandle(this)
            },
            clearCached: function() {
                if (this.buffer) {
                    ig.ScreenBufferPool.free(this.buffer);
                    ig.ScreenBufferPool.removeHandle(this);
                    this.ownerMap = this.buffer = null
                }
            },
            resetBuffer: function() {
                ig.ScreenBufferPool.free(this.buffer);
                this.buffer = null;
                this.redrawFull = true
            },
            fetchBuffer: function() {
                this.buffer = ig.ScreenBufferPool.get();
                this.width = ig.ScreenBufferPool.width;
                this.height = ig.ScreenBufferPool.height
            },
            update: function(a) {
                if (a.readyToDraw()) {
                    this.buffer || this.fetchBuffer();
                    var b = ig.CONFIG.DEFAULT_TILE_SIZE;
                    if (a == this.ownerMap) {
                        var c = Math.round(a.scroll.x) - ig.ScreenBufferPool.paddingX * b,
                            d = Math.round(a.scroll.y) - ig.ScreenBufferPool.paddingY * b,
                            e = c - this.scroll.x,
                            f = d - this.scroll.y;
                        this.shift.x = 0;
                        this.shift.y = 0;
                        this.shift.full =
                            false;
                        if (Math.abs(e) > b) {
                            this.shift.x = (e > 0 ? Math.floor(e / b) : Math.ceil(e / b)) * b;
                            this.scroll.x = this.scroll.x + this.shift.x;
                            this.off.x = this.off.x + this.shift.x;
                            this.off.x = (this.off.x + this.width) % this.width
                        }
                        if (Math.abs(f) > b) {
                            this.shift.y = (f > 0 ? Math.floor(f / b) : Math.ceil(f / b)) * b;
                            this.scroll.y = this.scroll.y + this.shift.y;
                            this.off.y = this.off.y + this.shift.y;
                            this.off.y = (this.off.y + this.height) % this.height
                        }
                        if (this.redrawFull || Math.abs(this.shift.x) >= this.width || Math.abs(this.shift.y) >= this.height) {
                            this.scroll.x = Math.round(c /
                                b) * b;
                            this.scroll.y = Math.round(d / b) * b;
                            this.off.x = 0;
                            this.off.y = 0;
                            this.shift.full = true;
                            this.redrawFull = false;
                            b = this.buffer;
                            ig.system.getBufferContext(b).clearRect(0, 0, b.width, b.height)
                        }
                    }
                    this.shift.full ? this._redrawFull(a) : this._redrawShift(a)
                }
            },
            draw: function(a, b, c, d, e, f) {
                if (c < this.scroll.x) {
                    a = a + (this.scroll.x - c);
                    e = e - (this.scroll.x - c);
                    c = this.scroll.x
                }
                if (d < this.scroll.y) {
                    b = b + (this.scroll.y - d);
                    e = e - (this.scroll.y - d);
                    d = this.scroll.y
                }
                if (this.ownerMap && this.ownerMap.lighter) ig.system.context.globalCompositeOperation =
                    "lighter";
                c = c - this.scroll.x + this.off.x;
                d = d - this.scroll.y + this.off.y;
                if (e > this.width) e = this.width;
                if (f > this.height) f = this.height;
                c >= this.width && (c = c - this.width);
                d >= this.height && (d = d - this.height);
                var g = this.buffer,
                    h, i;
                if (c + e > this.width) {
                    h = c + e - this.width;
                    e = e - h
                }
                if (d + f > this.height) {
                    i = d + f - this.height;
                    f = f - i
                }
                e && f && ig.system.context.drawImage(g, c, d, e, f, a, b, e, f);
                h && f && ig.system.context.drawImage(g, 0, d, h, f, a + e, b, h, f);
                e && i && ig.system.context.drawImage(g, c, 0, e, i, a, b + f, e, i);
                h && i && ig.system.context.drawImage(g,
                    0, 0, h, i, a + e, b + f, h, i);
                if (this.ownerMap && this.ownerMap.lighter) ig.system.context.globalCompositeOperation = "source-over"
            },
            setGridTile: function(a, b, c, d) {
                var e = ig.CONFIG.DEFAULT_TILE_SIZE,
                    a = a * e - this.scroll.x,
                    b = b * e - this.scroll.y;
                if (!(a < 0 || a >= this.width || b < 0 || b >= this.height)) {
                    var a = (a + this.off.x) % this.width,
                        b = (b + this.off.y) % this.height,
                        f = ig.system.context;
                    ig.system.context = ig.system.getBufferContext(this.buffer);
                    ig.system.context.clearRect(a, b, e, e);
                    c && d.tiles && d.tiles.drawTile(a, b, c - 1, e);
                    ig.system.context =
                        f
                }
            },
            _redrawFull: function(a) {
                var b = this.scroll.x,
                    c = this.scroll.y,
                    d = this.width,
                    e = this.height,
                    f = ig.system.getBufferContext(this.buffer);
                a.preRenderScreen(f, 0, 0, b, c, d, e)
            },
            _redrawShift: function(a) {
                if (this.shift.y) {
                    var b = this.shift.y > 0 ? this.off.y - this.shift.y : this.off.y,
                        c = this.off.x,
                        d = Math.abs(this.shift.y),
                        e = this.width,
                        f = this.scroll.y + (this.shift.y > 0 ? this.height - this.shift.y : 0),
                        g = this.scroll.x;
                    if (this.shift.x) {
                        e = e - Math.abs(this.shift.x);
                        if (this.shift.x < 0) {
                            c = c - this.shift.x;
                            g = g - this.shift.x
                        }
                    }
                    this._splitDraw(a,
                        c, b, g, f, e, d)
                }
                if (this.shift.x) {
                    c = this.shift.x > 0 ? this.off.x - this.shift.x : this.off.x;
                    b = this.off.y;
                    e = Math.abs(this.shift.x);
                    d = this.height;
                    g = this.scroll.x + (this.shift.x > 0 ? this.width - this.shift.x : 0);
                    f = this.scroll.y;
                    this._splitDraw(a, c, b, g, f, e, d)
                }
            },
            _splitDraw: function(a, b, c, d, e, f, g) {
                b < 0 && (b = b + this.width);
                c < 0 && (c = c + this.height);
                var h = ig.system.getBufferContext(this.buffer),
                    i, j;
                if (b + f > this.width) {
                    i = b + f - this.width;
                    f = f - i
                }
                if (c + g > this.height) {
                    j = c + g - this.height;
                    g = g - j
                }
                if (f && g) {
                    a == this.ownerMap && h.clearRect(b, c,
                        f, g);
                    a.preRenderScreen(h, b, c, d, e, f, g)
                }
                if (f && j) {
                    a == this.ownerMap && h.clearRect(b, 0, f, j);
                    a.preRenderScreen(h, b, 0, d, e + g, f, j)
                }
                if (i && g) {
                    a == this.ownerMap && h.clearRect(0, c, i, g);
                    a.preRenderScreen(h, 0, c, d + f, e, i, g)
                }
                if (i && j) {
                    a == this.ownerMap && h.clearRect(0, 0, i, j);
                    a.preRenderScreen(h, 0, 0, d + f, e + g, i, j)
                }
            }
        })
    });
    ig.baked = !0;
    