/**
 * impact.base.input
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.input")`.
 *
 * Keyboard/mouse/touch input. `ig.KEY` maps key names to key codes;
 * `ig.Input` binds keys to named actions and tracks their state (held / pressed
 * this frame / released this frame). Mouse wheel is mapped to MWHEEL_UP/DOWN.
 */
ig.module("impact.base.input").defines(function () {

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
        _0: 48, _1: 49, _2: 50, _3: 51, _4: 52, _5: 53, _6: 54, _7: 55, _8: 56, _9: 57,
        A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74,
        K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84,
        U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
        NUMPAD_0: 96, NUMPAD_1: 97, NUMPAD_2: 98, NUMPAD_3: 99, NUMPAD_4: 100,
        NUMPAD_5: 101, NUMPAD_6: 102, NUMPAD_7: 103, NUMPAD_8: 104, NUMPAD_9: 105,
        MULTIPLY: 106, ADD: 107, SUBSTRACT: 109, DECIMAL: 110, DIVIDE: 111,
        F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119,
        F9: 120, F10: 121, F11: 122, F12: 123,
        SHIFT: 16, CTRL: 17, ALT: 18,
        EQUAL: 187, PLUS: 187, COMMA: 188, MINUS: 189, PERIOD: 190, SEMICOLON: 186,
        UE: 186, GRAVE_ACCENT: 192, OE: 192, SLASH: 191, HASH: 191, BRACKET_OPEN: 219,
        SZ: 219, BACKSLASH: 220, BRACKET_CLOSE: 221, SINGLE_QUOTE: 222, AE: 222,
    };

    ig.INPUT_DEVICES = {
        KEYBOARD_AND_MOUSE: 1,
        GAMEPAD: 2,
    };

    ig.Input = ig.Class.extend({
        bindings: {},
        actions: {},   // action -> currently held
        presses: {},   // action -> pressed this frame
        keyups: {},    // action -> released this frame
        locks: {},     // action -> key-down lock (prevents repeat)
        delayedKeyup: [],
        currentDevice: null,
        isUsingMouse: false,
        isUsingKeyboard: false,
        isUsingAccelerometer: false,
        mouse: { x: 0, y: 0 },
        accel: { x: 0, y: 0, z: 0 },
        mouseGuiActive: true,
        lastMousePos: { x: 0, y: 0 },
        ignoreKeyboard: false,

        init: function () {},

        initMouse: function () {
            if (!this.isUsingMouse) {
                this.isUsingMouse = true;
                window.addEventListener("DOMMouseScroll", this.mousewheel.bind(this), false);
                window.addEventListener("mousewheel", this.mousewheel.bind(this), false);
                ig.system.inputDom.addEventListener("contextmenu", this.contextmenu.bind(this), false);
                ig.system.inputDom.addEventListener("mousedown", this.keydown.bind(this), false);
                window.addEventListener("mouseup", this.keyup.bind(this), false);
                document.addEventListener("mousemove", this.mousemove.bind(this), false);
                document.addEventListener("mouseout", this.mouseout.bind(this), false);
                window.addEventListener("blur", this.blur.bind(this), false);
                window.addEventListener("focus", this.focus.bind(this), false);
                document.addEventListener("drop", function (event) {
                    event.preventDefault();
                    return false;
                }, false);
                document.addEventListener("dragover", function (event) {
                    event.preventDefault();
                    return false;
                }, false);
                ig.system.inputDom.addEventListener("touchstart", this.keydown.bind(this), false);
                ig.system.inputDom.addEventListener("touchend", this.keyup.bind(this), false);
                ig.system.inputDom.addEventListener("touchmove", this.mousemove.bind(this), false);
                ig.vars.set("mouse.active", true);
            }
        },

        initKeyboard: function () {
            if (!this.isUsingKeyboard) {
                this.isUsingKeyboard = true;
                window.addEventListener("keydown", this.keydown.bind(this), false);
                window.addEventListener("keyup", this.keyup.bind(this), false);
            }
        },

        initAccelerometer: function () {
            if (!this.isUsingAccelerometer) {
                window.addEventListener("devicemotion", this.devicemotion.bind(this), false);
            }
        },

        mousewheel: function (event) {
            if (!ig.system.crashed && !ig.system.focusLost) {
                var action = this.bindings[(event.wheelDelta ? event.wheelDelta / 60 : -event.detail / 2) > 0
                    ? ig.KEY.MWHEEL_UP : ig.KEY.MWHEEL_DOWN];
                if (action) {
                    this.actions[action] = true;
                    this.presses[action] = true;
                    this.keyups[action] = true;
                    if (this.isInIframe()) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                    this.delayedKeyup.push(action);
                }
                this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
            }
        },

        mousemove: function (event) {
            this.mouseIsOut = false;
            ig.Input.getMouseCoords(this.mouse, event, ig.system.canvas);
            this.mouse.x = this.mouse.x * (ig.system.width / ig.system.screenWidth);
            this.mouse.y = this.mouse.y * (ig.system.height / ig.system.screenHeight);
            if (!this.mouseGuiActive && !Vec2.equal(this.lastMousePos, this.mouse)) {
                this.mouseGuiActive = true;
                Vec2.assign(this.lastMousePos, this.mouse);
            }
        },

        mouseout: function () {
            this.mouseIsOut = true;
        },

        mouseOutOfScreen: function () {
            return this.mouseIsOut;
        },

        contextmenu: function (event) {
            if (this.bindings[ig.KEY.MOUSE2]) {
                event.stopPropagation();
                event.preventDefault();
            }
        },

        isInIframe: function () {
            return window.parent != window;
        },

        isInIframeAndUnfocused: function () {
            return this.isInIframe() && !document.hasFocus();
        },

        keydown: function (event) {
            if (!ig.system.crashed && !this.isInIframeAndUnfocused() &&
                !(this.ignoreKeyboard && event.type != "mousedown")) {
                if (ig.system.hasFocusLost()) {
                    if (event.type == "mousedown") ig.system.regainFocus();
                } else {
                    if (event.type == "mousedown") this.mouseGuiActive = true;
                    this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
                    if (event.target.type != "text") {
                        var action = event.type == "keydown" ? event.keyCode
                            : event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1;
                        if (event.type == "touchstart" || event.type == "mousedown") this.mousemove(event);
                        if (action = this.bindings[action]) {
                            this.actions[action] = true;
                            if (!this.locks[action]) {
                                this.presses[action] = true;
                                this.locks[action] = true;
                            }
                            event.stopPropagation();
                            event.preventDefault();
                        }
                    }
                }
            }
        },

        keyup: function (event) {
            if (!ig.system.crashed && !this.isInIframeAndUnfocused() &&
                !(this.ignoreKeyboard && event.type != "mouseup") && event.target.type != "text" &&
                !(ig.system.hasFocusLost() && event.type == "mouseup")) {
                this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
                var action = this.bindings[event.type == "keyup" ? event.keyCode
                    : event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1];
                if (action) {
                    this.keyups[action] = true;
                    this.delayedKeyup.push(action);
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        },

        blur: function (event) {
            if (!window.IG_KEEP_WINDOW_FOCUS) ig.system.setWindowFocus(true);
            for (var action in this.actions) {
                if (this.actions[action] == true) {
                    this.keyups[action] = true;
                    this.delayedKeyup.push(action);
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        },

        focus: function () {
            if (!window.IG_KEEP_WINDOW_FOCUS) ig.system.setWindowFocus(false);
        },

        devicemotion: function (event) {
            this.accel = event.accelerationIncludingGravity;
        },

        /** Bind a key code (negative = mouse button) to an action name. */
        bind: function (key, action) {
            if (key < 0) this.initMouse();
            else if (key > 0) this.initKeyboard();
            this.bindings[key] = action;
        },

        bindTouch: function (selector, action) {
            var el = ig.$(selector);
            var self = this;
            el.addEventListener("touchstart", function (event) {
                self.touchStart(event, action);
            }, false);
            el.addEventListener("touchend", function (event) {
                self.touchEnd(event, action);
            }, false);
        },

        unbind: function (key) {
            this.bindings[key] = null;
        },

        unbindAll: function () {
            this.bindings = [];
        },

        /** @returns {boolean} whether the action is currently held. */
        state: function (action) {
            return this.actions[action];
        },

        /** @returns {boolean} whether the action was pressed this frame. */
        pressed: function (action) {
            return ig.game.firstUpdateLoop ? this.presses[action] : false;
        },

        /** @returns {boolean} whether the action was released this frame. */
        keyupd: function (action) {
            return ig.game.firstUpdateLoop ? this.keyups[action] : false;
        },

        clearPressed: function () {
            for (var i = 0; i < this.delayedKeyup.length; i++) {
                var action = this.delayedKeyup[i];
                this.actions[action] = false;
                this.locks[action] = false;
            }
            this.delayedKeyup = [];
            this.presses = {};
            this.keyups = {};
        },

        touchStart: function (event, action) {
            this.actions[action] = true;
            this.presses[action] = true;
            event.stopPropagation();
            event.preventDefault();
            return false;
        },

        touchEnd: function (event, action) {
            this.delayedKeyup.push(action);
            event.stopPropagation();
            event.preventDefault();
            return false;
        },
    });

    /**
     * Compute canvas-relative mouse coordinates (handles touch + element offsets).
     * @param {Object} out receives {x, y}
     * @param {Event} event
     * @param {HTMLElement} canvas
     */
    ig.Input.getMouseCoords = function (out, event, canvas) {
        var el = canvas;
        var top = 0;
        var left = 0;
        while (el != null) {
            left = left + el.offsetLeft;
            top = top + el.offsetTop;
            el = el.offsetParent;
        }
        var pageX = event.pageX;
        var pageY = event.pageY;
        if (event.touches) {
            pageX = event.touches[0].clientX;
            pageY = event.touches[0].clientY;
        }
        out.x = pageX - left;
        out.y = pageY - top;
    };
});
