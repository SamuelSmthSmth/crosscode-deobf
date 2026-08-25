ig.module("impact.base.font").requires("impact.base.image").defines(function() {
        function a(b) {
            for (var c = 0; c < b.length; ++c) b[c].onIconChange()
        }
        var b = {},
            c = ig.$new("canvas").getContext("2d");
        ig.LANG_LATIN_END =
            591;
        ig.TextCommands = {
            register: function(a, c, d) {
                if (b[a]) throw Error("Text command for key '" + a + "' is already assigned");
                b[a] = {
                    argument: c,
                    apply: d
                }
            }
        };
        ig.TextCommands.register(".", false, function(a, b) {
            b.push({
                index: a,
                command: {
                    brake: 0.2
                }
            })
        });
        ig.TextCommands.register("!", false, function(a, b) {
            b.push({
                index: a,
                command: {
                    brake: 0.4
                }
            })
        });
        ig.TextCommands.register("\\", false, function() {
            return "\\"
        });
        ig.TextCommands.register("c", true, function(a, b, c) {
            c.push({
                index: b,
                command: {
                    color: a
                }
            })
        });
        ig.TextCommands.register("s",
            true,
            function(a, b, c) {
                if (d[a] === void 0) throw Error("Unsupported \\s argument: '" + a + "'. Only support values from 0-7");
                c.push({
                    index: b,
                    command: {
                        speed: d[a]
                    }
                })
            });
        ig.TextCommands.register("v", true, function(a) {
            return ig.vars.get(a)
        });
        ig.TextCommands.register("i", true, function(a, b, c, d) {
            a = d ? d.indexMapping.indexOf(a) : 0;
            if (a != -1) return String.fromCharCode(ig.MultiFont.ICON_START + a)
        });
        ig.Font = ig.Image.extend({
            cacheType: "Font",
            widthMap: [],
            indicesX: [],
            indicesY: [],
            firstChar: 32,
            charHeight: 0,
            sizeIndex: 0,
            color: null,
            init: function(a, b, c, d, e) {
                this.firstChar = c == void 0 ? 32 : c;
                this.charHeight = b;
                this.sizeIndex = d;
                this.color = e || "white";
                this.parent(a)
            },
            onload: function(a) {
                this._loadMetrics(this.data);
                this.parent(a)
            },
            widthForString: function(a) {
                for (var b = 0, c = 0; c < a.length; c++) b = b + (this.widthMap[a.charCodeAt(c) - this.firstChar] + 1 || 0);
                return b
            },
            draw: function() {
                throw "LOL NOPE!";
            },
            getSystemFont: function(a) {
                return ig.SYSTEM_FONT_METRICS.size[this.sizeIndex] * ig.system.systemFontScale + (a || 0) + "px " + ig.Font.systemFont
            },
            _drawChar: function(a,
                b, c, d) {
                if (!this.loaded || a < 0 || a >= this.indicesX.length) return 0;
                var e = ig.system.scale,
                    f = (this.widthMap[a] + 1) * e,
                    g = this.charHeight * e;
                ig.system.context.drawImage(d != void 0 ? d : this.data, this.indicesX[a] * e, this.indicesY[a] * e, f, g, ig.system.getDrawPos(b), ig.system.getDrawPos(c), f, g);
                return this.widthMap[a] + 1
            },
            _drawSystemChar: function(a, b, c, d) {
                var e = ig.system.context,
                    a = String.fromCharCode(a);
                if (a == "\n" || a == "\r") return 0;
                e.font = this.getSystemFont();
                e.fillStyle = "black";
                e[ig.system.imageSmoothingKey] = false;
                var f =
                    ig.system.systemFontScale,
                    g = 1 / f,
                    h = ig.SYSTEM_FONT_METRICS.baseLine[this.sizeIndex];
                e.save();
                e.translate(ig.system.getDrawPos(b), ig.system.getDrawPos(c) + h);
                f != 1 && e.scale(g, g);
                e.fillText(a, 0, f);
                e.fillText(a, f, 0);
                e.fillStyle = d;
                e.fillText(a, 0, 0);
                e.restore();
                return this.getSystemCharWidth(a)
            },
            getSystemCharWidth: function(a) {
                c.font = this.getSystemFont();
                a = c.measureText(a);
                return Math.ceil(a.width / ig.system.systemFontScale)
            },
            _loadMetrics: function(a) {
                if (!this.charHeight) this.charHeight = a.height - 1;
                this.widthMap = [];
                this.indicesX = [];
                this.indicesY = [];
                var b = ig.$new("canvas");
                b.width = a.width;
                b.height = a.height;
                b = b.getContext("2d");
                b.drawImage(a, 0, 0);
                for (var c = 0, d = 0; c + this.charHeight < a.height;) {
                    for (var e = 0, f = b.getImageData(0, c + this.charHeight, a.width, 1), g = 0; g < a.width; g++) {
                        var h = g * 4 + 3;
                        if (f.data[h] != 0) e++;
                        else if (f.data[h] == 0 && e) {
                            this.widthMap.push(e);
                            this.indicesX.push(g - e);
                            this.indicesY.push(c);
                            d++;
                            e = 0
                        }
                    }
                    if (e) {
                        this.widthMap.push(e);
                        this.indicesX.push(a.width - e);
                        this.indicesY.push(c)
                    }
                    c = c + (this.charHeight + 1)
                }
            }
        });
        ig.Font.ALIGN = {
            LEFT: 0,
            RIGHT: 1,
            CENTER: 2
        };
        ig.Font.systemFont = false;
        ig.MultiFont = ig.Font.extend({
            cacheType: "MultiFont",
            fontStyles: [],
            iconSets: [],
            mapping: {},
            indexMapping: [],
            iconChangeListeners: [],
            colorSets: [],
            init: function(a, b, c, d) {
                this.parent(a, b, void 0, c, d);
                this.fontStyles = []
            },
            pushIconSet: function(b) {
                this.iconSets.push(b);
                a(this.iconChangeListeners)
            },
            setIconSet: function(b, c) {
                this.iconSets[c] = b;
                a(this.iconChangeListeners)
            },
            addIconChangeListener: function(a) {
                this.iconChangeListeners.indexOf(a) == -1 && this.iconChangeListeners.push(a)
            },
            removeIconChangeListener: function(a) {
                this.iconChangeListeners.erase(a)
            },
            callChangeListeners: function() {
                a(this.iconChangeListeners)
            },
            setMapping: function(b) {
                for (var c in b) {
                    this.mapping[c] = b[c];
                    this.indexMapping.indexOf(c) == -1 && this.indexMapping.push(c)
                }
                a(this.iconChangeListeners)
            },
            pushColorSet: function(a, b, c) {
                b && !(a && a < 0) && (this.colorSets[a] = {
                    img: b,
                    color: c
                })
            },
            _getActualIndex: function(a) {
                return a = this.mapping[this.indexMapping[a]]
            },
            getLineWidth: function(a, b, c) {
                for (var d = 0, e = 0; e + 1 < b.lineIdx.length &&
                    b.lineIdx[e + 1] <= c;) e++;
                for (b = b.lineIdx[e]; b < c; b++) d = d + this.getCharWidth(a.charCodeAt(b));
                return d
            },
            getTextDimensions: function(a, b) {
                for (var c = 0, d = 0, b = b != void 0 ? b : 1, e = this.charHeight + b, f = [], g = [0], h = 0; h < a.length; h++)
                    if (a.charAt(h) == "\n") {
                        c = Math.max(c, d);
                        f.push(d);
                        g.push(h + 1);
                        d = 0;
                        e = e + (this.charHeight + b)
                    } else d = d + this.getCharWidth(a.charCodeAt(h));
                b < 0 && (e = e + -b);
                g.push(a.length);
                f.push(d);
                c = Math.max(c, d);
                return {
                    x: c,
                    y: e,
                    lines: f,
                    lineIdx: g
                }
            },
            wrapText: function(a, b, c, d, e) {
                for (var f = null, g = -1, h = d ? 8 : 1, i = [], j =
                        b * 0.75 / (h - 1), m = ig.LANG_DETAILS[ig.currentLang] || {}; h--;) {
                    for (var n = a, k = [], l = [], o = [], p = 0, r = 0, s = 0, v = -1, q = false, z = 0, y = false, t = 0; t < n.length; t++) {
                        var u = n.charAt(t),
                            T = n.charCodeAt(t),
                            S = this.getCharWidth(T),
                            p = p + S;
                        if (t > 0 && m.newlineAfter && m.newlineAfter.indexOf(u) != -1) y = true;
                        else if (t > 0 && T > ig.LANG_LATIN_END && m.newlineAnywhere && (!m.newlineException || m.newlineException.indexOf(u) == -1)) {
                            v = t;
                            z = p - S;
                            q = true;
                            y = false
                        } else if (u.match(/\s/g)) {
                            v = t;
                            z = p - S;
                            y = q = false
                        } else if (y) {
                            y = false;
                            v = t;
                            z = p - S;
                            q = true
                        }
                        if ((u = n.charAt(t) ==
                                "\n") || p > b && v != -1) {
                            t = u ? t : v;
                            k.push(n.substr(0, t));
                            p = u ? p : z;
                            r = Math.max(r, p);
                            u && (q = false);
                            l.push(p);
                            s = s + t;
                            if (q) {
                                o.push(s);
                                s = s + 1
                            }
                            n = n.substr(t + (q ? 0 : 1));
                            t = -1;
                            p = 0;
                            v = -1;
                            y = q = false;
                            z = 0
                        }
                    }
                    k.push(n);
                    l.push(p);
                    r = Math.max(r, p);
                    if (d) {
                        s = n = 0;
                        t = d * (k.length * this.charHeight + (k.length - 1) * c);
                        n = Math.abs(t - r) / t * 50;
                        t * 0.5 > r ? n = n + (1E3 + t / r * 200) : t * 1.5 < r && (n = n + (1E3 + r / t * 200));
                        for (t = k.length; t--;) {
                            q = l[t] / r;
                            q < 0.7 && (s = s + (t < k.length - 1 ? 200 : 100) * (1 - q * q))
                        }
                        l = s + n;
                        b = b - j;
                        if (g == -1 || g > l) {
                            g = l;
                            f = k.join("\n");
                            i = o
                        }
                    } else {
                        f = k.join("\n");
                        i = o
                    }
                }
                a = e.length -
                    1;
                for (t = i.length; t--;) {
                    b = i[t];
                    for (c = t + 1; a >= 0 && e[a].index >= b;) {
                        e[a].index = e[a].index + c;
                        a--
                    }
                }
                return f
            },
            drawLines: function(a, b, c, d, e, f) {
                var g = this.data,
                    h = this.color,
                    f = f != void 0 ? f : 1;
                typeof a != "string" && (a = a.toString());
                var i = null;
                if (d == ig.Font.ALIGN.RIGHT || d == ig.Font.ALIGN.CENTER) i = this.getTextDimensions(a);
                for (var j = 0, m = d == ig.Font.ALIGN.LEFT ? b : b - (d == ig.Font.ALIGN.CENTER ? Math.floor(i.lines[j] / 2) : i.lines[j]), n = 0, k = 0; k < a.length; k++) {
                    var l = a.charCodeAt(k);
                    if (l == 10) {
                        j++;
                        m = d == ig.Font.ALIGN.LEFT ? b : b - (d == ig.Font.ALIGN.CENTER ?
                            Math.floor(i.lines[j] / 2) : i.lines[j]);
                        c = c + (this.charHeight + f)
                    }
                    for (; n < e.length && e[n].index == k; ++n)
                        if (e[n].command.color != void 0) {
                            var o = e[n].command.color;
                            if (o >= 0)
                                if (o == 0 || !this.colorSets[o]) {
                                    g = this.data;
                                    h = this.color
                                } else {
                                    g = this.colorSets[o].img.data;
                                    h = this.colorSets[o].color
                                }
                        } if (l >= ig.MultiFont.ICON_START && l < ig.MultiFont.ICON_END && this.iconSets.length > 0) {
                        l = this._getActualIndex(l - ig.MultiFont.ICON_START);
                        m = m + this.iconSets[l[0]]._drawChar(l[1], m, c)
                    } else m = ig.Font.systemFont ? m + this._drawSystemChar(l, m,
                        c, h) : m + this._drawChar(l - this.firstChar, m, c, g)
                }
                ig.Image.drawCount = ig.Image.drawCount + a.length
            },
            getCharWidth: function(a) {
                if (a >= ig.MultiFont.ICON_START && a < ig.MultiFont.ICON_END && this.iconSets.length > 0) {
                    a = this._getActualIndex(a - ig.MultiFont.ICON_START);
                    return this.iconSets[a[0]].widthMap[a[1]] + 1 || 0
                }
                return ig.Font.systemFont ? this.getSystemCharWidth(String.fromCharCode(a)) : this.widthMap[a - this.firstChar] + 1 || 0
            }
        });
        ig.MultiFont.ICON_START = 2E3;
        ig.MultiFont.ICON_END = 3E3;
        ig.TextBlock = ig.Class.extend({
            font: null,
            maxWidth: 0,
            parsedText: "",
            commands: [],
            speed: 0,
            padding: 0,
            align: ig.Font.ALIGN.LEFT,
            size: {
                x: 0,
                y: 0,
                lines: []
            },
            currentLine: 0,
            currentIndex: 0,
            currentCmd: 0,
            currentSpeed: 0,
            timer: 0,
            onFinish: null,
            prerendered: false,
            drawCallback: null,
            init: function(a, b, c) {
                this.font = a;
                this.speed = c.speed || 0;
                this.align = c.textAlign || ig.Font.ALIGN.LEFT;
                this.maxWidth = c.maxWidth;
                this.bestRatio = c.bestRatio;
                if (ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth) this.bestRatio = 0;
                this.linePadding = c.linePadding != void 0 ?
                    c.linePadding : 1;
                this.setText(b);
                this.reset()
            },
            setText: function(a) {
                this.clearPrerendered();
                a = a || "";
                typeof a == "object" && (a = a.toString());
                a = a.trim();
                this.commands.length = 0;
                this.parsedText = ig.TextParser.parse(a || "", this.commands, this.font);
                if (this.maxWidth) this.parsedText = this.font.wrapText(this.parsedText, this.maxWidth, this.linePadding, this.bestRatio, this.commands);
                this.size = this.font.getTextDimensions(this.parsedText, this.linePadding);
                this.reset()
            },
            setDrawCallback: function(a) {
                this.drawCallback = a;
                if (this.prerendered) {
                    this.clearPrerendered();
                    this.prerender()
                }
            },
            prerender: function() {
                if (!this.prerendered) {
                    this.prerendered = true;
                    this.buffer = ig.imageAtlas.getFragment(this.size.x, this.size.y, function() {
                        this.font.drawLines(this.parsedText, this.align == ig.Font.ALIGN.LEFT ? 0 : this.align == ig.Font.ALIGN.CENTER ? Math.floor(this.size.x / 2) : this.size.x, 0, this.align, this.commands, this.linePadding);
                        this.drawCallback && this.drawCallback(this.size.x, this.size.y)
                    }.bind(this));
                    this.font.addIconChangeListener(this)
                }
            },
            clearPrerendered: function() {
                if (this.prerendered) {
                    this.buffer.release();
                    this.buffer = null;
                    this.prerendered = false;
                    this.font.removeIconChangeListener(this)
                }
            },
            reset: function() {
                if (this.speed) {
                    this.currentLine = this.currentIndex = this.currentCmd = this.timer = 0;
                    this.currentSpeed = this.speed;
                    this._updateCommands()
                } else {
                    this.currentLine = this.size.lines.length;
                    this.currentIndex = this.parsedText.length;
                    this.timer = 1
                }
            },
            getState: function() {
                return [this.currentLine, this.currentIndex, this.currentCmd, this.currentSpeed]
            },
            setState: function(a) {
                this.currentLine = a[0];
                this.currentIndex = a[1];
                this.currentCmd =
                    a[2];
                this.currentSpeed = a[3]
            },
            setSpeed: function(a) {
                this.currentSpeed = this.speed = a
            },
            finish: function() {
                this.currentIndex = this.parsedText.length;
                this.timer = this.currentSpeed + 0.001;
                this.currentLine = this.size.lines.length;
                if (this.onFinish) this.onFinish()
            },
            isFinished: function() {
                return this.currentIndex == this.parsedText.length && this.timer > this.currentSpeed
            },
            _updateCommands: function() {
                for (; this.currentCmd < this.commands.length && this.commands[this.currentCmd].index == this.currentIndex; ++this.currentCmd) {
                    var a =
                        this.commands[this.currentCmd].command;
                    if (a.brake) this.timer = this.timer - a.brake;
                    if (a.speed !== void 0) this.currentSpeed = a.speed
                }
            },
            update: function() {
                if (!this.isFinished()) {
                    for (this.timer = this.timer + ig.system.actualTick; this.timer > this.currentSpeed && this.currentIndex < this.parsedText.length;) {
                        this.currentIndex++;
                        this.size.lineIdx[this.currentLine + 1] == this.currentIndex && this.currentLine++;
                        this._updateCommands();
                        this.timer = this.timer - this.currentSpeed
                    }
                    if (this.onFinish && this.isFinished()) this.onFinish()
                }
            },
            draw: function(a, b) {
                a = a || 0;
                b = b || 0;
                if (this.size.x)
                    if (this.prerendered) {
                        var c = this.currentLine * (this.font.charHeight + this.linePadding);
                        this.linePadding < 0 && (c = c + -this.linePadding);
                        this.currentLine && this.buffer.draw(a, b, 0, 0, this.size.x, c);
                        if (this.currentLine < this.size.lines.length) {
                            var d = this.font.getLineWidth(this.parsedText, this.size, this.currentIndex);
                            this.align == ig.Font.ALIGN.CENTER ? d = d + (this.size.x - this.size.lines[this.currentLine]) / 2 : this.align == ig.Font.ALIGN.RIGHT && (d = d + (this.size.x - this.size.lines[this.currentLine]));
                            if (d) {
                                var e = Math.max(this.font.charHeight, this.font.charHeight + this.linePadding);
                                this.buffer.draw(a, b + c, 0, c, d, e)
                            }
                        }
                    } else {
                        a = this.align == ig.Font.ALIGN.LEFT ? a : this.align == ig.Font.ALIGN.CENTER ? a + this.size.x / 2 : a + this.size.x;
                        this.font.drawLines(this.parsedText.substr(0, this.currentIndex), a, b, this.align, this.commands, this.linePadding)
                    }
            },
            onIconChange: function() {
                this.buffer && this.buffer.invalidate()
            }
        });
        ig.TextParser = {
            bakeVars: function(a) {
                return this.parse(a, null, null, true)
            },
            parse: function(a, c, d, e) {
                for (var f =
                        "", g = 0, h = -1;
                    (h = a.indexOf("\\", g)) != -1;) {
                    var f = f + a.substring(g, h),
                        g = h + 1,
                        i = a.indexOf("[", h),
                        j = a.indexOf("]", h),
                        m = null,
                        n = null;
                    if (i != -1) {
                        m = a.substring(h + 1, i);
                        n = b[m]
                    }
                    if (!n) {
                        m = a.charAt(h + 1);
                        n = b[m]
                    }
                    e && n != b.v && (n = null);
                    if (n)
                        if (n.character) {
                            f = f + n.character;
                            g = g + m[1]
                        } else {
                            if (n.argument) {
                                if (i != h + m.length + 1 || j == -1) {
                                    f = f + a.charAt(h);
                                    ig.warn("Invalid Text command argument format for commant '" + m + "'");
                                    continue
                                }
                                h = a.substring(i + 1, j);
                                g = j + 1;
                                j = n.apply(h, f.length, c, d)
                            } else {
                                g = g + m.length;
                                j = n.apply(f.length, c, d)
                            }
                            j !== void 0 &&
                                j !== null && (f = f + this.parse("" + j, c, d, e))
                        }
                    else f = f + a.charAt(h)
                }
                return f = f + a.substring(g)
            }
        };
        ig.TextBlock.SPEED = {
            SLOWEST: 0.1,
            SLOWER: 0.05,
            SLOW: 0.03,
            NORMAL: 0.02,
            FAST: 0.015,
            FASTER: 0.01,
            FASTEST: 0.0075,
            IMMEDIATE: 0
        };
        var d = [ig.TextBlock.SPEED.IMMEDIATE, ig.TextBlock.SPEED.FASTEST, ig.TextBlock.SPEED.FASTER, ig.TextBlock.SPEED.FAST, ig.TextBlock.SPEED.NORMAL, ig.TextBlock.SPEED.SLOW, ig.TextBlock.SPEED.SLOWER, ig.TextBlock.SPEED.SLOWEST]
    });
    ig.baked = !0;
    