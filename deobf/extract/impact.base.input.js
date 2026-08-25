ig.module("impact.base.input").defines(function() {
        ig.KEY = {
            MOUSE1: -1,
            MOUSE2: -3,
            MWHEEL_UP: -4,
            MWHEEL_DOWN: -5,
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            PAUSE: 19,
            CAPS: 20,
            ESC: 27,
            SPACE: 32,
            PAGE_UP: 33,
            PAGE_DOWN: 34,
            END: 35,
            HOME: 36,
            LEFT_ARROW: 37,
            UP_ARROW: 38,
            RIGHT_ARROW: 39,
            DOWN_ARROW: 40,
            INSERT: 45,
            DELETE: 46,
            _0: 48,
            _1: 49,
            _2: 50,
            _3: 51,
            _4: 52,
            _5: 53,
            _6: 54,
            _7: 55,
            _8: 56,
            _9: 57,
            A: 65,
            B: 66,
            C: 67,
            D: 68,
            E: 69,
            F: 70,
            G: 71,
            H: 72,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            M: 77,
            N: 78,
            O: 79,
            P: 80,
            Q: 81,
            R: 82,
            S: 83,
            T: 84,
            U: 85,
            V: 86,
            W: 87,
            X: 88,
            Y: 89,
            Z: 90,
            NUMPAD_0: 96,
            NUMPAD_1: 97,
            NUMPAD_2: 98,
            NUMPAD_3: 99,
            NUMPAD_4: 100,
            NUMPAD_5: 101,
            NUMPAD_6: 102,
            NUMPAD_7: 103,
            NUMPAD_8: 104,
            NUMPAD_9: 105,
            MULTIPLY: 106,
            ADD: 107,
            SUBSTRACT: 109,
            DECIMAL: 110,
            DIVIDE: 111,
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            EQUAL: 187,
            PLUS: 187,
            COMMA: 188,
            MINUS: 189,
            PERIOD: 190,
            SEMICOLON: 186,
            UE: 186,
            GRAVE_ACCENT: 192,
            OE: 192,
            SLASH: 191,
            HASH: 191,
            BRACKET_OPEN: 219,
            SZ: 219,
            BACKSLASH: 220,
            BRACKET_CLOSE: 221,
            SINGLE_QUOTE: 222,
            AE: 222
        };
        ig.INPUT_DEVICES = {
            KEYBOARD_AND_MOUSE: 1,
            GAMEPAD: 2
        };
        ig.Input = ig.Class.extend({
            bindings: {},
            actions: {},
            presses: {},
            keyups: {},
            locks: {},
            delayedKeyup: [],
            currentDevice: null,
            isUsingMouse: false,
            isUsingKeyboard: false,
            isUsingAccelerometer: false,
            mouse: {
                x: 0,
                y: 0
            },
            accel: {
                x: 0,
                y: 0,
                z: 0
            },
            mouseGuiActive: true,
            lastMousePos: {
                x: 0,
                y: 0
            },
            ignoreKeyboard: false,
            init: function() {},
            initMouse: function() {
                if (!this.isUsingMouse) {
                    this.isUsingMouse = true;
                    window.addEventListener("DOMMouseScroll", this.mousewheel.bind(this), false);
                    window.addEventListener("mousewheel", this.mousewheel.bind(this),
                        false);
                    ig.system.inputDom.addEventListener("contextmenu", this.contextmenu.bind(this), false);
                    ig.system.inputDom.addEventListener("mousedown", this.keydown.bind(this), false);
                    window.addEventListener("mouseup", this.keyup.bind(this), false);
                    document.addEventListener("mousemove", this.mousemove.bind(this), false);
                    document.addEventListener("mouseout", this.mouseout.bind(this), false);
                    window.addEventListener("blur", this.blur.bind(this), false);
                    window.addEventListener("focus", this.focus.bind(this), false);
                    document.addEventListener("drop",
                        function(a) {
                            a.preventDefault();
                            return false
                        }, false);
                    document.addEventListener("dragover", function(a) {
                        a.preventDefault();
                        return false
                    }, false);
                    ig.system.inputDom.addEventListener("touchstart", this.keydown.bind(this), false);
                    ig.system.inputDom.addEventListener("touchend", this.keyup.bind(this), false);
                    ig.system.inputDom.addEventListener("touchmove", this.mousemove.bind(this), false);
                    ig.vars.set("mouse.active", true)
                }
            },
            initKeyboard: function() {
                if (!this.isUsingKeyboard) {
                    this.isUsingKeyboard = true;
                    window.addEventListener("keydown",
                        this.keydown.bind(this), false);
                    window.addEventListener("keyup", this.keyup.bind(this), false)
                }
            },
            initAccelerometer: function() {
                this.isUsingAccelerometer || window.addEventListener("devicemotion", this.devicemotion.bind(this), false)
            },
            mousewheel: function(a) {
                if (!ig.system.crashed && !ig.system.focusLost) {
                    var b = this.bindings[(a.wheelDelta ? a.wheelDelta / 60 : -a.detail / 2) > 0 ? ig.KEY.MWHEEL_UP : ig.KEY.MWHEEL_DOWN];
                    if (b) {
                        this.actions[b] = true;
                        this.presses[b] = true;
                        this.keyups[b] = true;
                        if (this.isInIframe()) {
                            a.stopPropagation();
                            a.preventDefault()
                        }
                        this.delayedKeyup.push(b)
                    }
                    this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE
                }
            },
            mousemove: function(a) {
                this.mouseIsOut = false;
                ig.Input.getMouseCoords(this.mouse, a, ig.system.canvas);
                this.mouse.x = this.mouse.x * (ig.system.width / ig.system.screenWidth);
                this.mouse.y = this.mouse.y * (ig.system.height / ig.system.screenHeight);
                if (!this.mouseGuiActive && !e.equal(this.lastMousePos, this.mouse)) {
                    this.mouseGuiActive = true;
                    e.assign(this.lastMousePos, this.mouse)
                }
            },
            mouseout: function() {
                this.mouseIsOut =
                    true
            },
            mouseOutOfScreen: function() {
                return this.mouseIsOut
            },
            contextmenu: function(a) {
                if (this.bindings[ig.KEY.MOUSE2]) {
                    a.stopPropagation();
                    a.preventDefault()
                }
            },
            isInIframe: function() {
                return window.parent != window
            },
            isInIframeAndUnfocused: function() {
                return this.isInIframe() && !document.hasFocus()
            },
            keydown: function(a) {
                if (!ig.system.crashed && !this.isInIframeAndUnfocused() && !(this.ignoreKeyboard && a.type != "mousedown"))
                    if (ig.system.hasFocusLost()) a.type == "mousedown" && ig.system.regainFocus();
                    else {
                        if (a.type == "mousedown") this.mouseGuiActive =
                            true;
                        this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
                        if (a.target.type != "text") {
                            var b = a.type == "keydown" ? a.keyCode : a.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1;
                            (a.type == "touchstart" || a.type == "mousedown") && this.mousemove(a);
                            if (b = this.bindings[b]) {
                                this.actions[b] = true;
                                if (!this.locks[b]) {
                                    this.presses[b] = true;
                                    this.locks[b] = true
                                }
                                a.stopPropagation();
                                a.preventDefault()
                            }
                        }
                    }
            },
            keyup: function(a) {
                if (!ig.system.crashed && !this.isInIframeAndUnfocused() && !(this.ignoreKeyboard && a.type != "mouseup") && a.target.type != "text" &&
                    !(ig.system.hasFocusLost() && a.type == "mouseup")) {
                    this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
                    var b = this.bindings[a.type == "keyup" ? a.keyCode : a.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1];
                    if (b) {
                        this.keyups[b] = true;
                        this.delayedKeyup.push(b);
                        a.stopPropagation();
                        a.preventDefault()
                    }
                }
            },
            blur: function(a) {
                window.IG_KEEP_WINDOW_FOCUS || ig.system.setWindowFocus(true);
                for (var b in this.actions)
                    if (this.actions[b] == true) {
                        this.keyups[b] = true;
                        this.delayedKeyup.push(b);
                        a.stopPropagation();
                        a.preventDefault()
                    }
            },
            focus: function() {
                window.IG_KEEP_WINDOW_FOCUS ||
                    ig.system.setWindowFocus(false)
            },
            devicemotion: function(a) {
                this.accel = a.accelerationIncludingGravity
            },
            bind: function(a, b) {
                a < 0 ? this.initMouse() : a > 0 && this.initKeyboard();
                this.bindings[a] = b
            },
            bindTouch: function(a, b) {
                var c = ig.$(a),
                    d = this;
                c.addEventListener("touchstart", function(a) {
                    d.touchStart(a, b)
                }, false);
                c.addEventListener("touchend", function(a) {
                    d.touchEnd(a, b)
                }, false)
            },
            unbind: function(a) {
                this.bindings[a] = null
            },
            unbindAll: function() {
                this.bindings = []
            },
            state: function(a) {
                return this.actions[a]
            },
            pressed: function(a) {
                return ig.game.firstUpdateLoop ?
                    this.presses[a] : false
            },
            keyupd: function(a) {
                return ig.game.firstUpdateLoop ? this.keyups[a] : false
            },
            clearPressed: function() {
                for (var a = 0; a < this.delayedKeyup.length; a++) {
                    var b = this.delayedKeyup[a];
                    this.actions[b] = false;
                    this.locks[b] = false
                }
                this.delayedKeyup = [];
                this.presses = {};
                this.keyups = {}
            },
            touchStart: function(a, b) {
                this.actions[b] = true;
                this.presses[b] = true;
                a.stopPropagation();
                a.preventDefault();
                return false
            },
            touchEnd: function(a, b) {
                this.delayedKeyup.push(b);
                a.stopPropagation();
                a.preventDefault();
                return false
            }
        });
        ig.Input.getMouseCoords = function(a, b, c) {
            for (var d = c, e = c = 0; d != null;) {
                c = c + d.offsetLeft;
                e = e + d.offsetTop;
                d = d.offsetParent
            }
            var d = b.pageX,
                f = b.pageY;
            if (b.touches) {
                d = b.touches[0].clientX;
                f = b.touches[0].clientY
            }
            a.x = d - c;
            a.y = f - e
        }
    });
    ig.baked = !0;
    