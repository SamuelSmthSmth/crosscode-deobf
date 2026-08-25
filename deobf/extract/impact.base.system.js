ig.module("impact.base.system").requires("impact.base.timer", "impact.base.image", "impact.base.vars").defines(function() {
        function a() {
            b =
                b + 1;
            if (b % ig.system.frameSkip == 0) {
                ig.Timer.step();
                ig.system.rawTick = ig.system.actualTick = Math.min(ig.Timer.maxStep, ig.system.clock.tick()) * ig.system.totalTimeFactor;
                if (ig.system.hasFocusLost()) ig.system.actualTick = 0;
                ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
                var d = ig.soundManager.context.getCurrentTimeRaw();
                ig.soundManager.context.timeOffset = d == c ? ig.soundManager.context.timeOffset + ig.system.rawTick : 0;
                c = d;
                if (ig.system.skipMode) {
                    ig.system.tick = ig.system.tick * 8;
                    ig.system.actualTick = ig.system.actualTick *
                        8
                }
                ig.system.hasFocusLost() && (ig.system.cancelFocusLostCallback && ig.system.cancelFocusLostCallback()) && ig.system.regainFocus();
                ig.system.delegate.run();
                if (ig.system.newGameClass) {
                    ig.system.setGameNow(ig.system.newGameClass);
                    ig.system.newGameClass = null
                }
            }
            ig.system.fps >= 60 && window.requestAnimationFrame && window.requestAnimationFrame(ig.system.run.bind(ig.system), ig.system.canvas)
        }
        var b = 0;
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
            zoomFocus: {
                x: 0,
                y: 0
            },
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
            init: function(a, b, c, d, e, f) {
                this.fps = c;
                this.clock = new ig.Timer;
                this.canvas = ig.$(a);
                this.context = this.canvas.getContext("2d");
                if (this.context.imageSmoothingEnabled) this.imageSmoothingKey = "imageSmoothingEnabled";
                else if (this.context.webkitImageSmoothingEnabled) this.imageSmoothingKey = "webkitImageSmoothingEnabled";
                else if (this.context.mozImageSmoothingEnabled) this.imageSmoothingKey = "mozImageSmoothingEnabled";
                this.imageSmoothingDisabled = !!this.imageSmoothingKey;
                this.inputDom = b ? ig.$(b) : document;
                this.resize(d,
                    e, f);
                this.limitSoundUse = ig.browser == "Chrome" && ig.browserVersion * 1 <= 25;
                if (!ig.vars) ig.vars = ig.vars = new ig.Vars;
                ig.vars.registerVarAccessor("system", this, "SystemVarEditor");
                ig.vars.registerVarAccessor("extension", this, "VarExtensionEditor")
            },
            onVarAccess: function(a, b) {
                if (b[0] == "system") {
                    if (b[1] == "debug") return !!window.IG_GAME_DEBUG;
                    if (b[1] == "lang") return ig.currentLang
                } else if (b[0] == "extension") {
                    var c = b[1];
                    if (b[2] == "active") return ig.extensions.hasExtension(c)
                }
            },
            resize: function(a, b, c) {
                c = c || 1;
                this.width =
                    a;
                this.height = b;
                if (this.imageSmoothingDisabled) {
                    this.scale = 1;
                    this.contextScale = c || 1
                } else {
                    this.scale = c;
                    this.contextScale = 1
                }
                this.contextWidth = this.width * this.scale;
                this.contextHeight = this.height * this.scale;
                this.realWidth = this.width * c;
                this.realHeight = this.height * c;
                this.canvas.width = this.width * c;
                this.canvas.height = this.height * c;
                this.zoomFocus.x = window.wm && wm.mapConfig && wm.mapConfig.settingsWidth ? (a - wm.mapConfig.settingsWidth) / 2 : a / 2;
                this.zoomFocus.y = b / 2;
                this.screenWidth = this.canvas.style.width.replace("px",
                    "") * 1 || this.canvas.width;
                this.screenHeight = this.canvas.style.height.replace("px", "") * 1 || this.canvas.height;
                this.imageSmoothingDisabled && (this.context[this.imageSmoothingKey] = false);
                this.contextScale != 1 && this.context.scale(this.contextScale, this.contextScale);
                this.updateCursorClass()
            },
            setGame: function(a) {
                this.running ? this.newGameClass = a : this.setGameNow(a)
            },
            setGameNow: function(a) {
                ig.game = new a
            },
            setDelegate: function(a) {
                if (typeof a.run == "function") {
                    this.delegate = a;
                    if (this.delegate.onGameLoopStart) this.delegate.onGameLoopStart();
                    this.startRunLoop()
                } else ig.system.error(Error("System.setDelegate: No run() function in object"))
            },
            setZoom: function(a) {
                this.zoom = a
            },
            setZoomFocus: function(a, b) {
                this.zoomFocus.x = Math.round(a.limit(0, this.width));
                this.zoomFocus.y = Math.round(b.limit(0, this.height))
            },
            stopRunLoop: function() {
                clearInterval(this.intervalId);
                this.running = false
            },
            startRunLoop: function() {
                this.stopRunLoop();
                window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
                    window.msRequestAnimationFrame;
                this.fps >= 60 && window.requestAnimationFrame ? window.requestAnimationFrame(this.run.bind(this), this.canvas) : this.intervalId = setInterval(this.run.bind(this), 1E3 / this.fps);
                this.running = true
            },
            getZoomMinOffset: function(a) {
                if (this.zoom == 1) a.x = a.y = 0;
                else {
                    a.x = (this.width - this.width / this.zoom) * (this.zoomFocus.x / this.width);
                    a.y = (this.height - this.height / this.zoom) * (this.zoomFocus.y / this.height)
                }
                return a
            },
            getScreenFromMapPos: function(a, b, c) {
                a.x = (b - ig.game.screen.x - this.zoomFocus.x) *
                    this.zoom + this.zoomFocus.x;
                a.y = (c - ig.game.screen.y - this.zoomFocus.y) * this.zoom + this.zoomFocus.y;
                return a
            },
            getMapFromScreenPos: function(a, b, c) {
                a.x = (b - this.zoomFocus.x) / this.zoom + this.zoomFocus.x + ig.game.screen.x;
                a.y = (c - this.zoomFocus.y) / this.zoom + this.zoomFocus.y + ig.game.screen.y;
                return a
            },
            getMapFromScrollPos: function(a, b, c, d) {
                a.x = (b - this.zoomFocus.x) / this.zoom + this.zoomFocus.x + d.x;
                a.y = (c - this.zoomFocus.y) / this.zoom + this.zoomFocus.y + d.y;
                return a
            },
            clear: function(a) {
                this.context.fillStyle = a;
                this.context.fillRect(0,
                    0, this.contextWidth, this.contextHeight)
            },
            startZoomedDraw: function() {
                if (this.zoom != 1) {
                    this.context.save();
                    this.context.translate(this.zoomFocus.x, this.zoomFocus.y);
                    this.context.scale(this.zoom, this.zoom);
                    this.context.translate(-this.zoomFocus.x, -this.zoomFocus.y);
                    this.smoothPositioning = false
                }
            },
            endZoomedDraw: function() {
                if (this.zoom != 1) {
                    this.context.restore();
                    this.smoothPositioning = true
                }
            },
            setTimeFactor: function(a) {
                this.timeFactor = a;
                this.ingameTick = this.tick = this.actualTick * this.timeFactor
            },
            run: function() {
                if (window.IG_GAME_DEBUG) a();
                else try {
                    a()
                } catch (b) {
                    ig.system.error(b)
                }
            },
            getBufferContext: function(a) {
                a = a.getContext("2d");
                this.imageSmoothingDisabled && (a[this.imageSmoothingKey] = false);
                return a
            },
            error: function(a) {
                this.crashed = true;
                var b = {};
                if (ig.game) {
                    b.map = ig.game.mapName || "NO MAP";
                    b.version = ig.game.getVersion()
                } else {
                    b.map = "GAME INIT";
                    b.version = "---"
                }
                b.platform = ig.getPlatformName(ig.platform);
                b.OS = ig.OS;
                b.browser = ig.browser;
                b.browserVersion = ig.browserVersion;
                b.nwjsVersion = ig.nwjsVersion && ig.nwjsVersion[0];
                b["64bit"] = ig.nwjs64;
                b.webAudio = ig.webAudioActive;
                b.sampleRate = ig.soundManager.getSampleRate();
                var c = {};
                ig.game && ig.game.getErrorData(c);
                window.GAME_ERROR_CALLBACK && window.GAME_ERROR_CALLBACK(a, b, c);
                throw a;
            },
            hasFocusLost: function() {
                return this.focusLost || this.windowFocusLost
            },
            getDrawPos: function(a) {
                return this.smoothPositioning ? Math.round(a * this.scale * this.contextScale) / this.contextScale : Math.round(a) * this.scale
            },
            createImageBuffer: function(a, b, c) {
                var d = ig.$new("canvas");
                d.width = a * ig.system.scale;
                d.height = b * ig.system.scale;
                a = this.context;
                this.context = this.getBufferContext(d);
                c();
                this.context = a;
                return d
            },
            setWindowFocus: function(a) {
                this.windowFocusLost = a;
                if (ig.music) {
                    if (a) {
                        ig.music.onWindowFocusLost();
                        ig.soundManager.onWindowFocusLost()
                    } else {
                        ig.music.onWindowFocusGained();
                        ig.soundManager.onWindowFocusGained()
                    }
                    ig.game && ig.game.setWindowFocus && ig.game.setWindowFocus(this.windowFocusLost)
                }
            },
            callFocusListeners: function() {
                for (var a = 0; a < this.focusListeners.length; ++a) this.focusListeners[a](this.focusLost)
            },
            clearCursorType: function() {
                this.cursorType =
                    null;
                this.updateCursorClass()
            },
            setCursorType: function(a) {
                if (a != this.cursorType) {
                    this.cursorType = a;
                    this.updateCursorClass()
                }
            },
            updateCursorClass: function() {
                if (this.cursorType) {
                    var a = "cursorSize" + Math.round(this.screenWidth / this.width).limit(1, 8),
                        a = a + (" " + this.cursorType);
                    this.inputDom.className = a
                } else this.inputDom.className = ""
            },
            setCanvasSize: function(a, b, c) {
                this.canvas.style.width = a + "px";
                this.canvas.style.height = b + "px";
                this.canvas.className = c ? "borderHidden" : "";
                this.screenWidth = a;
                this.screenHeight =
                    b;
                this.updateCursorClass()
            },
            setFocusLost: function() {
                this.focusLost = true
            },
            regainFocus: function() {
                this.focusLost = false;
                this.callFocusListeners()
            },
            addFocusListener: function(a) {
                this.focusListeners.push(a)
            },
            removeFocusListener: function(a) {
                this.focusListeners.erase(a)
            },
            setMasterVolume: function(a) {
                ig.soundManager.setMasterVolume(a)
            },
            setSoundVolume: function(a) {
                ig.soundManager.volume = a;
                ig.soundManager.setSoundVolume(a)
            },
            setMusicVolume: function(a) {
                ig.music.volume = a;
                ig.soundManager.setMusicVolume(a)
            }
        });
        var c =
            0
    });
    ig.baked = !0;
    