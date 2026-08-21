/**
 * impact.feature.gamepad.gamepad
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gamepad.gamepad")`.
 *
 * Core gamepad subsystem: platform enums, button/axis constants, the
 * `ig.Gamepad` state holder and the `ig.GamepadManager` game add-on that polls
 * every registered handler each pre-update and exposes query helpers
 * (pressed / released / down / axes). Registered as the `ig.gamepad` singleton.
 */
ig.module("impact.feature.gamepad.gamepad")
    .requires("impact.base.game", "impact.base.vars")
    .defines(function () {

    ig.GamepadPlatform = {
        NWF: "nwf",
        WEBKIT: "webkit",
        unsupported: "nope"
    };

    ig.GamepadType = {
        NWF: "nwf",
        XBOX: "xbox",
        UNSUPPORTED: "nope"
    };

    ig.BUTTONS = {
        FACE0: 0,
        FACE1: 1,
        FACE2: 2,
        FACE3: 3,
        LEFT_SHOULDER: 4,
        RIGHT_SHOULDER: 5,
        LEFT_TRIGGER: 6,
        RIGHT_TRIGGER: 7,
        SELECT: 8,
        START: 9,
        LEFT_STICK: 10,
        RIGHT_STICK: 11,
        DPAD_UP: 12,
        DPAD_DOWN: 13,
        DPAD_LEFT: 14,
        DPAD_RIGHT: 15
    };

    ig.AXES = {
        LEFT_STICK_X: 0,
        LEFT_STICK_Y: 1,
        RIGHT_STICK_X: 2,
        RIGHT_STICK_Y: 3
    };

    /** Handlers registered via `ig.GamepadManager.addHandlerCheck`. */
    var handlerChecks = [];

    ig.GamepadManager = ig.GameAddon.extend({
        gamepads: {},
        activeGamepads: [],
        handlers: [],

        /** Instantiate every registered handler. */
        init: function () {
            this.parent("Gamepads");
            for (var i = 0; i < handlerChecks.length; ++i) {
                var handler = handlerChecks[i]();
                handler && this.handlers.push(handler);
            }
        },

        preUpdateOrder: 0,

        /** Poll all handlers, refresh the active-gamepad list and update input device state. */
        onPreUpdate: function () {
            if (!this.isSupported() || !this.handlers.length) return false;
            this.activeGamepads = [];
            for (var i = this.handlers.length; i--;) {
                this.handlers[i].update(this.gamepads);
            }
            for (var gamepadKey in this.gamepads) {
                this.activeGamepads.push(this.gamepads[gamepadKey]);
            }
            if (this.isLeftStickDown() || this.isRightStickDown()) {
                ig.input.mouseGuiActive = false;
                ig.input.currentDevice = ig.INPUT_DEVICES.GAMEPAD;
            }
            ig.vars.set("gamepad.active", ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD);
        },

        deferredUpdateOrder: 9001,
        onDeferredUpdate: function () {
            this.isSupported();
        },

        /** True while any active gamepad reports `buttonIndex` pressed this frame. */
        isButtonPressed: function (buttonIndex) {
            if (!ig.game.firstUpdateLoop) return false;
            for (var i = this.activeGamepads.length; i--;) {
                if (this.activeGamepads[i].pressedStates[buttonIndex]) return true;
            }
            return false;
        },

        /** True while any active gamepad reports `buttonIndex` released this frame. */
        isButtonReleased: function (buttonIndex) {
            if (!ig.game.firstUpdateLoop) return false;
            for (var i = this.activeGamepads.length; i--;) {
                if (this.activeGamepads[i].releasedStates[buttonIndex]) return true;
            }
            return false;
        },

        /** True while any active gamepad's `buttonIndex` value exceeds its deadzone. */
        isButtonDown: function (buttonIndex) {
            for (var i = this.activeGamepads.length; i--;) {
                var gamepad = this.activeGamepads[i];
                if (gamepad.buttonStates[buttonIndex] > (gamepad.buttonDeadzones[buttonIndex] || 0.5)) {
                    return true;
                }
            }
            return false;
        },

        /** The largest non-zero value reported for `buttonIndex` across active gamepads. */
        getButtonValue: function (buttonIndex) {
            for (var i = this.activeGamepads.length; i--;) {
                var value = this.activeGamepads[i].buttonStates[buttonIndex];
                if (value) return value;
            }
            return 0;
        },

        /**
         * The axis value with the largest magnitude across active gamepads.
         * @param {number} axesIndex - one of `ig.AXES`
         * @param {boolean} applyDeadzone - skip values inside the axis deadzone
         */
        getAxesValue: function (axesIndex, applyDeadzone) {
            for (var i = this.activeGamepads.length, value = 0; i--;) {
                var gamepad = this.activeGamepads[i],
                    axesValue = gamepad.axesStates[axesIndex];
                if (axesValue) {
                    if (applyDeadzone) {
                        gamepad = gamepad.axesDeadzones[axesIndex] || 0.1;
                        if (Math.abs(axesValue) <= gamepad) continue;
                    }
                    Math.abs(value) < Math.abs(axesValue) && (value = axesValue);
                }
            }
            return value;
        },

        /** True while any active gamepad's `axesIndex` exceeds its deadzone. */
        isAxesDown: function (axesIndex) {
            for (var i = this.activeGamepads.length; i--;) {
                var gamepad = this.activeGamepads[i],
                    deadzone = gamepad.axesDeadzones[axesIndex] || 0.1;
                if (Math.abs(gamepad.axesStates[axesIndex]) > deadzone) return true;
            }
            return false;
        },

        isLeftStickDown: function () {
            return this.isAxesDown(ig.AXES.LEFT_STICK_X) || this.isAxesDown(ig.AXES.LEFT_STICK_Y);
        },

        isRightStickDown: function () {
            return this.isAxesDown(ig.AXES.RIGHT_STICK_X) || this.isAxesDown(ig.AXES.RIGHT_STICK_Y);
        },

        isSupported: function () {
            return this.handlers.length > 0;
        }
    });

    /** Register a handler factory; called once at startup for each platform. */
    ig.GamepadManager.addHandlerCheck = function (handlerCheck) {
        handlerChecks.push(handlerCheck);
    };

    /** Per-gamepad button/axis state, fed by a platform handler each frame. */
    ig.Gamepad = ig.Class.extend({
        buttonDeadzones: [],
        axesDeadzones: [],
        buttonStates: [],
        axesStates: [],
        pressedStates: [],
        releasedStates: [],

        init: function () {},

        /**
         * Record `value` for `buttonIndex` and derive pressed/released edges.
         * @param {number} buttonIndex - one of `ig.BUTTONS`
         * @param {number|boolean} value - the raw button value
         */
        updateButton: function (buttonIndex, value) {
            var deadzone = this.buttonDeadzones[buttonIndex] || 0.5,
                wasDown = this.buttonStates[buttonIndex] > deadzone,
                isDown = value > deadzone;
            this.pressedStates[buttonIndex] = this.releasedStates[buttonIndex] = false;
            !wasDown && isDown ? this.pressedStates[buttonIndex] = true : wasDown && !isDown && (this.releasedStates[buttonIndex] = true);
            this.buttonStates[buttonIndex] = value;
            if (isDown) {
                ig.input.mouseGuiActive = false;
                ig.input.currentDevice = ig.INPUT_DEVICES.GAMEPAD;
            }
        },

        /** Record `value` for `axesIndex`. */
        updateAxes: function (axesIndex, value) {
            this.axesStates[axesIndex] = value;
        }
    });

    ig.addGameAddon(function () {
        return ig.gamepad = new ig.GamepadManager();
    });
});
ig.baked = !0;
