/**
 * impact.base.system
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.system")`.
 *
 * `ig.System` is the game loop core: canvas setup, the requestAnimationFrame
 * / setInterval run loop, the clock tick, zoom, focus handling, crash reporting,
 * and the buffer-context helpers used by the renderer.
 */
ig.module("impact.base.system").requires("impact.base.timer", "impact.base.image", "impact.base.vars").defines(function () {

    /**
     * One frame step. Advances the clock (with frame-skip), runs the delegate,
     * and schedules the next frame.
     */
    function runFrame() {
        frameCounter = frameCounter + 1;
        if (frameCounter % ig.system.frameSkip == 0) {
            ig.Timer.step();
            ig.system.rawTick = ig.system.actualTick =
                Math.min(ig.Timer.maxStep, ig.system.clock.tick()) * ig.system.totalTimeFactor;
            if (ig.system.hasFocusLost()) ig.system.actualTick = 0;
            ig.system.tick = ig.system.actualTick * ig.system.timeFactor;

            var currentAudioTime = ig.soundManager.context.getCurrentTimeRaw();
            ig.soundManager.context.timeOffset = (currentAudioTime == lastAudioTime)
                ? ig.soundManager.context.timeOffset + ig.system.rawTick
                : 0;
            lastAudioTime = currentAudioTime;

            if (ig.system.skipMode) {
                ig.system.tick = ig.system.tick * 8;
                ig.system.actualTick = ig.system.actualTick * 8;
            }
            if (ig.system.hasFocusLost() && ig.system.cancelFocusLostCallback && ig.system.cancelFocusLostCallback()) {
                ig.system.regainFocus();
            }

            ig.system.delegate.run();

            if (ig.system.newGameClass) {
                ig.system.setGameNow(ig.system.newGameClass);
                ig.system.newGameClass = null;
            }
        }
        if (ig.system.fps >= 60 && window.requestAnimationFrame) {
            window.requestAnimationFrame(ig.system.run.bind(ig.system), ig.system.canvas);
        }
    }

    var frameCounter = 0;

    ig.System = ig.Class.extend({
        fps: 60,
        frameSkip: 1,
        width: 320,
        height: 240,
        contextWidth: 320,
        contextHeight: 240,
        realWidth: 320,
        realHeight: 240,
        screenWidth: 320,
        screenHeight: 240,
        zoomFocus: { x: 0, y: 0 },
        zoom: 1,
        scale: 1,
        contextScale: 1,
        systemFontScale: 2,
        focusLost: false,
        focusListeners: [],
        windowFocusLost: false,
        imageSmoothingKey: null,
        imageSmoothingDisabled: false,
        crashed: false,
        cursorType: null,
        skipMode: false,
        timeFactor: 1,
        totalTimeFactor: 1,
        rawTick: 0,
        tick: 0,
        actualTick: 0,
        ingameTick: 0,
        intervalId: 0,
        newGameClass: null,
        running: false,
        delegate: null,
        clock: null,
        inputDom: null,
        canvas: null,
        context: null,
        smoothPositioning: true,
        cancelFocusLostCallback: null,

        /**
         * @param {string} canvasSelector
         * @param {string} inputDomSelector (or falsy for document)
         * @param {number} fps
         * @param {number} width
         * @param {number} height
         * @param {number} scale
         */
        init: function (canvasSelector, inputDomSelector, fps, width, height, scale) {
            this.fps = fps;
            this.clock = new ig.Timer();
            this.canvas = ig.$(canvasSelector);
            this.context = this.canvas.getContext("2d");

            if (this.context.imageSmoothingEnabled) this.imageSmoothingKey = "imageSmoothingEnabled";
            else if (this.context.webkitImageSmoothingEnabled) this.imageSmoothingKey = "webkitImageSmoothingEnabled";
            else if (this.context.mozImageSmoothingEnabled) this.imageSmoothingKey = "mozImageSmoothingEnabled";
            this.imageSmoothingDisabled = !!this.imageSmoothingKey;

            this.inputDom = inputDomSelector ? ig.$(inputDomSelector) : document;
            this.resize(width, height, scale);
            this.limitSoundUse = ig.browser == "Chrome" && ig.browserVersion * 1 <= 25;

            if (!ig.vars) ig.vars = new ig.Vars();
            ig.vars.registerVarAccessor("system", this, "SystemVarEditor");
            ig.vars.registerVarAccessor("extension", this, "VarExtensionEditor");
        },

        /** Variable accessor for the "system.*" and "extension.*" var namespaces. */
        onVarAccess: function (unused, path) {
            if (path[0] == "system") {
                if (path[1] == "debug") return !!window.IG_GAME_DEBUG;
                if (path[1] == "lang") return ig.currentLang;
            } else if (path[0] == "extension") {
                var extensionName = path[1];
                if (path[2] == "active") return ig.extensions.hasExtension(extensionName);
            }
        },

        resize: function (width, height, scale) {
            scale = scale || 1;
            this.width = width;
            this.height = height;

            if (this.imageSmoothingDisabled) {
                this.scale = 1;
                this.contextScale = scale || 1;
            } else {
                this.scale = scale;
                this.contextScale = 1;
            }

            this.contextWidth = this.width * this.scale;
            this.contextHeight = this.height * this.scale;
            this.realWidth = this.width * scale;
            this.realHeight = this.height * scale;
            this.canvas.width = this.width * scale;
            this.canvas.height = this.height * scale;

            this.zoomFocus.x = window.wm && wm.mapConfig && wm.mapConfig.settingsWidth
                ? (width - wm.mapConfig.settingsWidth) / 2 : width / 2;
            this.zoomFocus.y = height / 2;

            this.screenWidth = this.canvas.style.width.replace("px", "") * 1 || this.canvas.width;
            this.screenHeight = this.canvas.style.height.replace("px", "") * 1 || this.canvas.height;

            if (this.imageSmoothingDisabled) this.context[this.imageSmoothingKey] = false;
            if (this.contextScale != 1) this.context.scale(this.contextScale, this.contextScale);
            this.updateCursorClass();
        },

        setGame: function (gameClass) {
            if (this.running) this.newGameClass = gameClass;
            else this.setGameNow(gameClass);
        },

        setGameNow: function (gameClass) {
            ig.game = new gameClass();
        },

        setDelegate: function (delegate) {
            if (typeof delegate.run == "function") {
                this.delegate = delegate;
                if (this.delegate.onGameLoopStart) this.delegate.onGameLoopStart();
                this.startRunLoop();
            } else {
                ig.system.error(Error("System.setDelegate: No run() function in object"));
            }
        },

        setZoom: function (zoom) {
            this.zoom = zoom;
        },

        setZoomFocus: function (x, y) {
            this.zoomFocus.x = Math.round(x.limit(0, this.width));
            this.zoomFocus.y = Math.round(y.limit(0, this.height));
        },

        stopRunLoop: function () {
            clearInterval(this.intervalId);
            this.running = false;
        },

        startRunLoop: function () {
            this.stopRunLoop();
            window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
            if (this.fps >= 60 && window.requestAnimationFrame) {
                window.requestAnimationFrame(this.run.bind(this), this.canvas);
            } else {
                this.intervalId = setInterval(this.run.bind(this), 1000 / this.fps);
            }
            this.running = true;
        },

        /** Write the zoom-min offset (for map scrolling) into `out`. */
        getZoomMinOffset: function (out) {
            if (this.zoom == 1) {
                out.x = out.y = 0;
            } else {
                out.x = (this.width - this.width / this.zoom) * (this.zoomFocus.x / this.width);
                out.y = (this.height - this.height / this.zoom) * (this.zoomFocus.y / this.height);
            }
            return out;
        },

        getScreenFromMapPos: function (out, mapX, mapY) {
            out.x = (mapX - ig.game.screen.x - this.zoomFocus.x) * this.zoom + this.zoomFocus.x;
            out.y = (mapY - ig.game.screen.y - this.zoomFocus.y) * this.zoom + this.zoomFocus.y;
            return out;
        },

        getMapFromScreenPos: function (out, screenX, screenY) {
            out.x = (screenX - this.zoomFocus.x) / this.zoom + this.zoomFocus.x + ig.game.screen.x;
            out.y = (screenY - this.zoomFocus.y) / this.zoom + this.zoomFocus.y + ig.game.screen.y;
            return out;
        },

        getMapFromScrollPos: function (out, x, y, scroll) {
            out.x = (x - this.zoomFocus.x) / this.zoom + this.zoomFocus.x + scroll.x;
            out.y = (y - this.zoomFocus.y) / this.zoom + this.zoomFocus.y + scroll.y;
            return out;
        },

        clear: function (color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.contextWidth, this.contextHeight);
        },

        startZoomedDraw: function () {
            if (this.zoom != 1) {
                this.context.save();
                this.context.translate(this.zoomFocus.x, this.zoomFocus.y);
                this.context.scale(this.zoom, this.zoom);
                this.context.translate(-this.zoomFocus.x, -this.zoomFocus.y);
                this.smoothPositioning = false;
            }
        },

        endZoomedDraw: function () {
            if (this.zoom != 1) {
                this.context.restore();
                this.smoothPositioning = true;
            }
        },

        setTimeFactor: function (factor) {
            this.timeFactor = factor;
            this.ingameTick = this.tick = this.actualTick * this.timeFactor;
        },

        run: function () {
            if (window.IG_GAME_DEBUG) {
                runFrame();
            } else {
                try {
                    runFrame();
                } catch (err) {
                    ig.system.error(err);
                }
            }
        },

        getBufferContext: function (canvas) {
            var ctx = canvas.getContext("2d");
            if (this.imageSmoothingDisabled) ctx[this.imageSmoothingKey] = false;
            return ctx;
        },

        error: function (err) {
            this.crashed = true;
            var info = {};
            if (ig.game) {
                info.map = ig.game.mapName || "NO MAP";
                info.version = ig.game.getVersion();
            } else {
                info.map = "GAME INIT";
                info.version = "---";
            }
            info.platform = ig.getPlatformName(ig.platform);
            info.OS = ig.OS;
            info.browser = ig.browser;
            info.browserVersion = ig.browserVersion;
            info.nwjsVersion = ig.nwjsVersion && ig.nwjsVersion[0];
            info["64bit"] = ig.nwjs64;
            info.webAudio = ig.webAudioActive;
            info.sampleRate = ig.soundManager.getSampleRate();
            var extraData = {};
            if (ig.game) ig.game.getErrorData(extraData);
            if (window.GAME_ERROR_CALLBACK) window.GAME_ERROR_CALLBACK(err, info, extraData);
            throw err;
        },

        hasFocusLost: function () {
            return this.focusLost || this.windowFocusLost;
        },

        getDrawPos: function (pos) {
            return this.smoothPositioning
                ? Math.round(pos * this.scale * this.contextScale) / this.contextScale
                : Math.round(pos) * this.scale;
        },

        /** Create an offscreen buffer canvas, run `draw` on it, return the canvas. */
        createImageBuffer: function (width, height, draw) {
            var buffer = ig.$new("canvas");
            buffer.width = width * ig.system.scale;
            buffer.height = height * ig.system.scale;
            var prevContext = this.context;
            this.context = this.getBufferContext(buffer);
            draw();
            this.context = prevContext;
            return buffer;
        },

        setWindowFocus: function (focusLost) {
            this.windowFocusLost = focusLost;
            if (ig.music) {
                if (focusLost) {
                    ig.music.onWindowFocusLost();
                    ig.soundManager.onWindowFocusLost();
                } else {
                    ig.music.onWindowFocusGained();
                    ig.soundManager.onWindowFocusGained();
                }
                if (ig.game && ig.game.setWindowFocus) ig.game.setWindowFocus(this.windowFocusLost);
            }
        },

        callFocusListeners: function () {
            for (var i = 0; i < this.focusListeners.length; ++i) this.focusListeners[i](this.focusLost);
        },

        clearCursorType: function () {
            this.cursorType = null;
            this.updateCursorClass();
        },

        setCursorType: function (type) {
            if (type != this.cursorType) {
                this.cursorType = type;
                this.updateCursorClass();
            }
        },

        updateCursorClass: function () {
            if (this.cursorType) {
                var className = "cursorSize" + Math.round(this.screenWidth / this.width).limit(1, 8);
                className = className + (" " + this.cursorType);
                this.inputDom.className = className;
            } else {
                this.inputDom.className = "";
            }
        },

        setCanvasSize: function (width, height, hideBorder) {
            this.canvas.style.width = width + "px";
            this.canvas.style.height = height + "px";
            this.canvas.className = hideBorder ? "borderHidden" : "";
            this.screenWidth = width;
            this.screenHeight = height;
            this.updateCursorClass();
        },

        setFocusLost: function () {
            this.focusLost = true;
        },

        regainFocus: function () {
            this.focusLost = false;
            this.callFocusListeners();
        },

        addFocusListener: function (listener) {
            this.focusListeners.push(listener);
        },

        removeFocusListener: function (listener) {
            this.focusListeners.erase(listener);
        },

        setMasterVolume: function (volume) {
            ig.soundManager.setMasterVolume(volume);
        },

        setSoundVolume: function (volume) {
            ig.soundManager.volume = volume;
            ig.soundManager.setSoundVolume(volume);
        },

        setMusicVolume: function (volume) {
            ig.music.volume = volume;
            ig.soundManager.setMusicVolume(volume);
        },
    });

    var lastAudioTime = 0;
});
