/*
 * impact.base.font
 * ----------------
 * Text rendering: `ig.Font` (bitmap glyph metrics), `ig.MultiFont` (the
 * composite font with icon sets, color sets, and text wrapping), plus
 * `ig.TextBlock` (typewriter-style text display) and `ig.TextParser`
 * (the `\c`, `\s`, `\v`, `\i`, etc. inline commands).
 *
 * Original: deobf/extract/impact.base.font.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.font").requires("impact.base.image").defines(function () {
    /** Notify all registered icon-change listeners. */
    function notifyIconChange(listeners) {
        for (var i = 0; i < listeners.length; ++i) listeners[i].onIconChange();
    }

    var textCommands = {};
    var measureContext = ig.$new("canvas").getContext("2d");
    ig.LANG_LATIN_END = 591;

    /** Registry of the inline text commands parsed by `ig.TextParser`. */
    ig.TextCommands = {
        register: function (key, hasArgument, apply) {
            if (textCommands[key]) throw Error("Text command for key '" + key + "' is already assigned");
            textCommands[key] = {
                argument: hasArgument,
                apply: apply
            };
        }
    };

    ig.TextCommands.register(".", false, function (index, commands) {
        commands.push({ index: index, command: { brake: 0.2 } });
    });

    ig.TextCommands.register("!", false, function (index, commands) {
        commands.push({ index: index, command: { brake: 0.4 } });
    });

    ig.TextCommands.register("\\", false, function () {
        return "\\";
    });

    ig.TextCommands.register("c", true, function (arg, index, commands) {
        commands.push({ index: index, command: { color: arg } });
    });

    ig.TextCommands.register("s", true, function (arg, index, commands) {
        if (speedLevels[arg] === void 0) throw Error("Unsupported \\s argument: '" + arg + "'. Only support values from 0-7");
        commands.push({ index: index, command: { speed: speedLevels[arg] } });
    });

    ig.TextCommands.register("v", true, function (arg) {
        return ig.vars.get(arg);
    });

    ig.TextCommands.register("i", true, function (arg, index, commands, font) {
        arg = font ? font.indexMapping.indexOf(arg) : 0;
        if (arg != -1) return String.fromCharCode(ig.MultiFont.ICON_START + arg);
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

        init: function (path, charHeight, firstChar, sizeIndex, color) {
            this.firstChar = firstChar == void 0 ? 32 : firstChar;
            this.charHeight = charHeight;
            this.sizeIndex = sizeIndex;
            this.color = color || "white";
            this.parent(path);
        },

        onload: function (data) {
            this._loadMetrics(this.data);
            this.parent(data);
        },

        widthForString: function (text) {
            for (var width = 0, i = 0; i < text.length; i++) width = width + (this.widthMap[text.charCodeAt(i) - this.firstChar] + 1 || 0);
            return width;
        },

        draw: function () {
            throw "LOL NOPE!";
        },

        getSystemFont: function (extraSize) {
            return ig.SYSTEM_FONT_METRICS.size[this.sizeIndex] * ig.system.systemFontScale + (extraSize || 0) + "px " + ig.Font.systemFont;
        },

        _drawChar: function (charIndex, x, y, image) {
            if (!this.loaded || charIndex < 0 || charIndex >= this.indicesX.length) return 0;
            var scale = ig.system.scale;
            var width = (this.widthMap[charIndex] + 1) * scale;
            var height = this.charHeight * scale;
            ig.system.context.drawImage(image != void 0 ? image : this.data, this.indicesX[charIndex] * scale, this.indicesY[charIndex] * scale, width, height, ig.system.getDrawPos(x), ig.system.getDrawPos(y), width, height);
            return this.widthMap[charIndex] + 1;
        },

        _drawSystemChar: function (charCode, x, y, color) {
            var ctx = ig.system.context;
            var charStr = String.fromCharCode(charCode);
            if (charStr == "\n" || charStr == "\r") return 0;
            ctx.font = this.getSystemFont();
            ctx.fillStyle = "black";
            ctx[ig.system.imageSmoothingKey] = false;
            var fontScale = ig.system.systemFontScale;
            var invScale = 1 / fontScale;
            var baseLine = ig.SYSTEM_FONT_METRICS.baseLine[this.sizeIndex];
            ctx.save();
            ctx.translate(ig.system.getDrawPos(x), ig.system.getDrawPos(y) + baseLine);
            fontScale != 1 && ctx.scale(invScale, invScale);
            ctx.fillText(charStr, 0, fontScale);
            ctx.fillText(charStr, fontScale, 0);
            ctx.fillStyle = color;
            ctx.fillText(charStr, 0, 0);
            ctx.restore();
            return this.getSystemCharWidth(charStr);
        },

        getSystemCharWidth: function (charStr) {
            measureContext.font = this.getSystemFont();
            charStr = measureContext.measureText(charStr);
            return Math.ceil(charStr.width / ig.system.systemFontScale);
        },

        _loadMetrics: function (data) {
            if (!this.charHeight) this.charHeight = data.height - 1;
            this.widthMap = [];
            this.indicesX = [];
            this.indicesY = [];
            var canvas = ig.$new("canvas");
            canvas.width = data.width;
            canvas.height = data.height;
            canvas = canvas.getContext("2d");
            canvas.drawImage(data, 0, 0);
            for (var row = 0, count = 0; row + this.charHeight < data.height;) {
                for (var run = 0, rowData = canvas.getImageData(0, row + this.charHeight, data.width, 1), col = 0; col < data.width; col++) {
                    var alphaIdx = col * 4 + 3;
                    if (rowData.data[alphaIdx] != 0) {
                        run++;
                    } else if (rowData.data[alphaIdx] == 0 && run) {
                        this.widthMap.push(run);
                        this.indicesX.push(col - run);
                        this.indicesY.push(row);
                        count++;
                        run = 0;
                    }
                }
                if (run) {
                    this.widthMap.push(run);
                    this.indicesX.push(data.width - run);
                    this.indicesY.push(row);
                }
                row = row + (this.charHeight + 1);
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

        init: function (path, charHeight, sizeIndex, color) {
            this.parent(path, charHeight, void 0, sizeIndex, color);
            this.fontStyles = [];
        },

        pushIconSet: function (font) {
            this.iconSets.push(font);
            notifyIconChange(this.iconChangeListeners);
        },

        setIconSet: function (font, index) {
            this.iconSets[index] = font;
            notifyIconChange(this.iconChangeListeners);
        },

        addIconChangeListener: function (listener) {
            this.iconChangeListeners.indexOf(listener) == -1 && this.iconChangeListeners.push(listener);
        },

        removeIconChangeListener: function (listener) {
            this.iconChangeListeners.erase(listener);
        },

        callChangeListeners: function () {
            notifyIconChange(this.iconChangeListeners);
        },

        setMapping: function (mapping) {
            for (var key in mapping) {
                this.mapping[key] = mapping[key];
                this.indexMapping.indexOf(key) == -1 && this.indexMapping.push(key);
            }
            notifyIconChange(this.iconChangeListeners);
        },

        pushColorSet: function (index, image, color) {
            image && !(index && index < 0) && (this.colorSets[index] = {
                img: image,
                color: color
            });
        },

        _getActualIndex: function (index) {
            return (index = this.mapping[this.indexMapping[index]]);
        },

        getLineWidth: function (text, dimensions, charIndex) {
            for (var width = 0, line = 0; line + 1 < dimensions.lineIdx.length && dimensions.lineIdx[line + 1] <= charIndex;) line++;
            for (dimensions = dimensions.lineIdx[line]; dimensions < charIndex; dimensions++) width = width + this.getCharWidth(text.charCodeAt(dimensions));
            return width;
        },

        getTextDimensions: function (text, linePadding) {
            for (var maxWidth = 0, width = 0, padding = linePadding != void 0 ? linePadding : 1, height = this.charHeight + padding, lineWidths = [], lineIdx = [0], i = 0; i < text.length; i++) {
                if (text.charAt(i) == "\n") {
                    maxWidth = Math.max(maxWidth, width);
                    lineWidths.push(width);
                    lineIdx.push(i + 1);
                    width = 0;
                    height = height + (this.charHeight + padding);
                } else {
                    width = width + this.getCharWidth(text.charCodeAt(i));
                }
            }
            padding < 0 && (height = height + -padding);
            lineIdx.push(text.length);
            lineWidths.push(width);
            maxWidth = Math.max(maxWidth, width);
            return {
                x: maxWidth,
                y: height,
                lines: lineWidths,
                lineIdx: lineIdx
            };
        },

        wrapText: function (text, maxWidth, linePadding, bestRatio, commands) {
            for (var bestWrapped = null, bestScore = -1, stepCount = bestRatio ? 8 : 1, wrappedLines = [], stepWidth = maxWidth * 0.75 / (stepCount - 1), langDetails = ig.LANG_DETAILS[ig.currentLang] || {}; stepCount--;) {
                for (var remaining = text, lines = [], lineWidths = [], softIndices = [], width = 0, maxLineWidth = 0, offset = 0, breakIdx = -1, atLatinBoundary = false, beforeBreakWidth = 0, newlineAfter = false, i = 0; i < remaining.length; i++) {
                    var char = remaining.charAt(i);
                    var charCode = remaining.charCodeAt(i);
                    var charWidth = this.getCharWidth(charCode);
                    width = width + charWidth;
                    if (i > 0 && langDetails.newlineAfter && langDetails.newlineAfter.indexOf(char) != -1) {
                        newlineAfter = true;
                    } else if (i > 0 && charCode > ig.LANG_LATIN_END && langDetails.newlineAnywhere && (!langDetails.newlineException || langDetails.newlineException.indexOf(char) == -1)) {
                        breakIdx = i;
                        beforeBreakWidth = width - charWidth;
                        atLatinBoundary = true;
                        newlineAfter = false;
                    } else if (char.match(/\s/g)) {
                        breakIdx = i;
                        beforeBreakWidth = width - charWidth;
                        newlineAfter = atLatinBoundary = false;
                    } else if (newlineAfter) {
                        newlineAfter = false;
                        breakIdx = i;
                        beforeBreakWidth = width - charWidth;
                        atLatinBoundary = true;
                    }
                    if ((char = remaining.charAt(i) == "\n") || (width > maxWidth && breakIdx != -1)) {
                        i = char ? i : breakIdx;
                        lines.push(remaining.substr(0, i));
                        width = char ? width : beforeBreakWidth;
                        maxLineWidth = Math.max(maxLineWidth, width);
                        char && (atLatinBoundary = false);
                        lineWidths.push(width);
                        offset = offset + i;
                        if (atLatinBoundary) {
                            softIndices.push(offset);
                            offset = offset + 1;
                        }
                        remaining = remaining.substr(i + (atLatinBoundary ? 0 : 1));
                        i = -1;
                        width = 0;
                        breakIdx = -1;
                        newlineAfter = atLatinBoundary = false;
                        beforeBreakWidth = 0;
                    }
                }
                lines.push(remaining);
                lineWidths.push(width);
                maxLineWidth = Math.max(maxLineWidth, width);
                if (bestRatio) {
                    var penalty = 0;
                    var lineTotal = 0;
                    var targetHeight = bestRatio * (lines.length * this.charHeight + (lines.length - 1) * linePadding);
                    lineTotal = Math.abs(targetHeight - maxLineWidth) / targetHeight * 50;
                    targetHeight * 0.5 > maxLineWidth ? (lineTotal = lineTotal + (1e3 + targetHeight / maxLineWidth * 200)) : targetHeight * 1.5 < maxLineWidth && (lineTotal = lineTotal + (1e3 + maxLineWidth / targetHeight * 200));
                    for (targetHeight = lines.length; targetHeight--;) {
                        var ratio = lineWidths[targetHeight] / maxLineWidth;
                        ratio < 0.7 && (penalty = penalty + (targetHeight < lines.length - 1 ? 200 : 100) * (1 - ratio * ratio));
                    }
                    var score = penalty + lineTotal;
                    maxWidth = maxWidth - stepWidth;
                    if (bestScore == -1 || bestScore > score) {
                        bestScore = score;
                        bestWrapped = lines.join("\n");
                        wrappedLines = softIndices;
                    }
                } else {
                    bestWrapped = lines.join("\n");
                    wrappedLines = softIndices;
                }
            }
            // Adjust command indices for the soft line breaks we inserted.
            var cmdCount = commands.length - 1;
            for (i = wrappedLines.length; i--;) {
                var softIndex = wrappedLines[i];
                for (var j = i + 1; cmdCount >= 0 && commands[cmdCount].index >= softIndex;) {
                    commands[cmdCount].index = commands[cmdCount].index + j;
                    cmdCount--;
                }
            }
            return bestWrapped;
        },

        drawLines: function (text, x, y, align, commands, linePadding) {
            var image = this.data;
            var color = this.color;
            linePadding = linePadding != void 0 ? linePadding : 1;
            typeof text != "string" && (text = text.toString());
            var dimensions = null;
            if (align == ig.Font.ALIGN.RIGHT || align == ig.Font.ALIGN.CENTER) dimensions = this.getTextDimensions(text);
            for (var line = 0, xPos = align == ig.Font.ALIGN.LEFT ? x : x - (align == ig.Font.ALIGN.CENTER ? Math.floor(dimensions.lines[line] / 2) : dimensions.lines[line]), cmdIdx = 0, i = 0; i < text.length; i++) {
                var charCode = text.charCodeAt(i);
                if (charCode == 10) {
                    line++;
                    xPos = align == ig.Font.ALIGN.LEFT ? x : x - (align == ig.Font.ALIGN.CENTER ? Math.floor(dimensions.lines[line] / 2) : dimensions.lines[line]);
                    y = y + (this.charHeight + linePadding);
                }
                for (; cmdIdx < commands.length && commands[cmdIdx].index == i; ++cmdIdx) {
                    if (commands[cmdIdx].command.color != void 0) {
                        var colorIdx = commands[cmdIdx].command.color;
                        if (colorIdx >= 0) {
                            if (colorIdx == 0 || !this.colorSets[colorIdx]) {
                                image = this.data;
                                color = this.color;
                            } else {
                                image = this.colorSets[colorIdx].img.data;
                                color = this.colorSets[colorIdx].color;
                            }
                        }
                    }
                }
                if (charCode >= ig.MultiFont.ICON_START && charCode < ig.MultiFont.ICON_END && this.iconSets.length > 0) {
                    charCode = this._getActualIndex(charCode - ig.MultiFont.ICON_START);
                    xPos = xPos + this.iconSets[charCode[0]]._drawChar(charCode[1], xPos, y);
                } else {
                    xPos = ig.Font.systemFont ? xPos + this._drawSystemChar(charCode, xPos, y, color) : xPos + this._drawChar(charCode - this.firstChar, xPos, y, image);
                }
            }
            ig.Image.drawCount = ig.Image.drawCount + text.length;
        },

        getCharWidth: function (charCode) {
            if (charCode >= ig.MultiFont.ICON_START && charCode < ig.MultiFont.ICON_END && this.iconSets.length > 0) {
                charCode = this._getActualIndex(charCode - ig.MultiFont.ICON_START);
                return this.iconSets[charCode[0]].widthMap[charCode[1]] + 1 || 0;
            }
            return ig.Font.systemFont ? this.getSystemCharWidth(String.fromCharCode(charCode)) : this.widthMap[charCode - this.firstChar] + 1 || 0;
        }
    });

    ig.MultiFont.ICON_START = 2e3;
    ig.MultiFont.ICON_END = 3e3;

    ig.TextBlock = ig.Class.extend({
        font: null,
        maxWidth: 0,
        parsedText: "",
        commands: [],
        speed: 0,
        padding: 0,
        align: ig.Font.ALIGN.LEFT,
        size: { x: 0, y: 0, lines: [] },
        currentLine: 0,
        currentIndex: 0,
        currentCmd: 0,
        currentSpeed: 0,
        timer: 0,
        onFinish: null,
        prerendered: false,
        drawCallback: null,

        init: function (font, text, settings) {
            this.font = font;
            this.speed = settings.speed || 0;
            this.align = settings.textAlign || ig.Font.ALIGN.LEFT;
            this.maxWidth = settings.maxWidth;
            this.bestRatio = settings.bestRatio;
            if (ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth) this.bestRatio = 0;
            this.linePadding = settings.linePadding != void 0 ? settings.linePadding : 1;
            this.setText(text);
            this.reset();
        },

        setText: function (text) {
            this.clearPrerendered();
            text = text || "";
            typeof text == "object" && (text = text.toString());
            text = text.trim();
            this.commands.length = 0;
            this.parsedText = ig.TextParser.parse(text || "", this.commands, this.font);
            if (this.maxWidth) this.parsedText = this.font.wrapText(this.parsedText, this.maxWidth, this.linePadding, this.bestRatio, this.commands);
            this.size = this.font.getTextDimensions(this.parsedText, this.linePadding);
            this.reset();
        },

        setDrawCallback: function (callback) {
            this.drawCallback = callback;
            if (this.prerendered) {
                this.clearPrerendered();
                this.prerender();
            }
        },

        prerender: function () {
            if (!this.prerendered) {
                this.prerendered = true;
                this.buffer = ig.imageAtlas.getFragment(this.size.x, this.size.y, function () {
                    this.font.drawLines(this.parsedText, this.align == ig.Font.ALIGN.LEFT ? 0 : this.align == ig.Font.ALIGN.CENTER ? Math.floor(this.size.x / 2) : this.size.x, 0, this.align, this.commands, this.linePadding);
                    this.drawCallback && this.drawCallback(this.size.x, this.size.y);
                }.bind(this));
                this.font.addIconChangeListener(this);
            }
        },

        clearPrerendered: function () {
            if (this.prerendered) {
                this.buffer.release();
                this.buffer = null;
                this.prerendered = false;
                this.font.removeIconChangeListener(this);
            }
        },

        reset: function () {
            if (this.speed) {
                this.currentLine = this.currentIndex = this.currentCmd = this.timer = 0;
                this.currentSpeed = this.speed;
                this._updateCommands();
            } else {
                this.currentLine = this.size.lines.length;
                this.currentIndex = this.parsedText.length;
                this.timer = 1;
            }
        },

        getState: function () {
            return [this.currentLine, this.currentIndex, this.currentCmd, this.currentSpeed];
        },

        setState: function (state) {
            this.currentLine = state[0];
            this.currentIndex = state[1];
            this.currentCmd = state[2];
            this.currentSpeed = state[3];
        },

        setSpeed: function (speed) {
            this.currentSpeed = this.speed = speed;
        },

        finish: function () {
            this.currentIndex = this.parsedText.length;
            this.timer = this.currentSpeed + 0.001;
            this.currentLine = this.size.lines.length;
            if (this.onFinish) this.onFinish();
        },

        isFinished: function () {
            return this.currentIndex == this.parsedText.length && this.timer > this.currentSpeed;
        },

        _updateCommands: function () {
            for (; this.currentCmd < this.commands.length && this.commands[this.currentCmd].index == this.currentIndex; ++this.currentCmd) {
                var command = this.commands[this.currentCmd].command;
                if (command.brake) this.timer = this.timer - command.brake;
                if (command.speed !== void 0) this.currentSpeed = command.speed;
            }
        },

        update: function () {
            if (!this.isFinished()) {
                for (this.timer = this.timer + ig.system.actualTick; this.timer > this.currentSpeed && this.currentIndex < this.parsedText.length;) {
                    this.currentIndex++;
                    this.size.lineIdx[this.currentLine + 1] == this.currentIndex && this.currentLine++;
                    this._updateCommands();
                    this.timer = this.timer - this.currentSpeed;
                }
                if (this.onFinish && this.isFinished()) this.onFinish();
            }
        },

        draw: function (x, y) {
            x = x || 0;
            y = y || 0;
            if (this.size.x) {
                if (this.prerendered) {
                    var lineHeight = this.currentLine * (this.font.charHeight + this.linePadding);
                    this.linePadding < 0 && (lineHeight = lineHeight + -this.linePadding);
                    this.currentLine && this.buffer.draw(x, y, 0, 0, this.size.x, lineHeight);
                    if (this.currentLine < this.size.lines.length) {
                        var partialWidth = this.font.getLineWidth(this.parsedText, this.size, this.currentIndex);
                        this.align == ig.Font.ALIGN.CENTER ? (partialWidth = partialWidth + (this.size.x - this.size.lines[this.currentLine]) / 2) : this.align == ig.Font.ALIGN.RIGHT && (partialWidth = partialWidth + (this.size.x - this.size.lines[this.currentLine]));
                        if (partialWidth) {
                            var charBlock = Math.max(this.font.charHeight, this.font.charHeight + this.linePadding);
                            this.buffer.draw(x, y + lineHeight, 0, lineHeight, partialWidth, charBlock);
                        }
                    }
                } else {
                    x = this.align == ig.Font.ALIGN.LEFT ? x : this.align == ig.Font.ALIGN.CENTER ? x + this.size.x / 2 : x + this.size.x;
                    this.font.drawLines(this.parsedText.substr(0, this.currentIndex), x, y, this.align, this.commands, this.linePadding);
                }
            }
        },

        onIconChange: function () {
            this.buffer && this.buffer.invalidate();
        }
    });

    ig.TextParser = {
        bakeVars: function (text) {
            return this.parse(text, null, null, true);
        },

        parse: function (text, commands, font, bakeVarsOnly) {
            for (var result = "", start = 0, cmdIdx = -1; (cmdIdx = text.indexOf("\\", start)) != -1;) {
                result = result + text.substring(start, cmdIdx);
                start = cmdIdx + 1;
                var bracketOpen = text.indexOf("[", cmdIdx);
                var bracketClose = text.indexOf("]", cmdIdx);
                var commandName = null;
                var command = null;
                if (bracketOpen != -1) {
                    commandName = text.substring(cmdIdx + 1, bracketOpen);
                    command = textCommands[commandName];
                }
                if (!command) {
                    commandName = text.charAt(cmdIdx + 1);
                    command = textCommands[commandName];
                }
                bakeVarsOnly && command != textCommands.v && (command = null);
                if (command) {
                    if (command.character) {
                        result = result + command.character;
                        start = start + commandName[1];
                    } else {
                        if (command.argument) {
                            if (bracketOpen != cmdIdx + commandName.length + 1 || bracketClose == -1) {
                                result = result + text.charAt(cmdIdx);
                                ig.warn("Invalid Text command argument format for commant '" + commandName + "'");
                                continue;
                            }
                            cmdIdx = text.substring(bracketOpen + 1, bracketClose);
                            start = bracketClose + 1;
                            bracketClose = command.apply(cmdIdx, result.length, commands, font);
                        } else {
                            start = start + commandName.length;
                            bracketClose = command.apply(result.length, commands, font);
                        }
                        bracketClose !== void 0 && bracketClose !== null && (result = result + this.parse("" + bracketClose, commands, font, bakeVarsOnly));
                    }
                } else {
                    result = result + text.charAt(cmdIdx);
                }
            }
            return (result = result + text.substring(start));
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

    var speedLevels = [
        ig.TextBlock.SPEED.IMMEDIATE,
        ig.TextBlock.SPEED.FASTEST,
        ig.TextBlock.SPEED.FASTER,
        ig.TextBlock.SPEED.FAST,
        ig.TextBlock.SPEED.NORMAL,
        ig.TextBlock.SPEED.SLOW,
        ig.TextBlock.SPEED.SLOWER,
        ig.TextBlock.SPEED.SLOWEST
    ];
});
ig.baked = !0;
