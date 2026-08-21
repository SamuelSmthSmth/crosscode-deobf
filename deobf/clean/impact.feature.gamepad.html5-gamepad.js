/**
 * impact.feature.gamepad.html5-gamepad
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gamepad.html5-gamepad")`.
 *
 * HTML5 Gamepad API handler for `ig.GamepadManager`. Polls
 * `navigator.getGamepads()` (with webkit fallbacks) each frame, maps the
 * browser's button/axis indices onto `ig.BUTTONS` / `ig.AXES`, and feeds every
 * connected gamepad into the manager's `gamepads` map.
 */
ig.module("impact.feature.gamepad.html5-gamepad")
    .requires("impact.feature.gamepad.gamepad")
    .defines(function () {

    /** `ig.BUTTONS` key → HTML5 gamepad button index. */
    var buttonMap = {};

    /** `ig.AXES` key → HTML5 gamepad axes index. */
    var axesMap = {};

    buttonMap[ig.BUTTONS.FACE0] = 0;
    buttonMap[ig.BUTTONS.FACE1] = 1;
    buttonMap[ig.BUTTONS.FACE2] = 2;
    buttonMap[ig.BUTTONS.FACE3] = 3;
    buttonMap[ig.BUTTONS.LEFT_SHOULDER] = 4;
    buttonMap[ig.BUTTONS.RIGHT_SHOULDER] = 5;
    buttonMap[ig.BUTTONS.LEFT_TRIGGER] = 6;
    buttonMap[ig.BUTTONS.RIGHT_TRIGGER] = 7;
    buttonMap[ig.BUTTONS.SELECT] = 8;
    buttonMap[ig.BUTTONS.START] = 9;
    buttonMap[ig.BUTTONS.LEFT_STICK] = 10;
    buttonMap[ig.BUTTONS.RIGHT_STICK] = 11;
    buttonMap[ig.BUTTONS.DPAD_UP] = 12;
    buttonMap[ig.BUTTONS.DPAD_DOWN] = 13;
    buttonMap[ig.BUTTONS.DPAD_LEFT] = 14;
    buttonMap[ig.BUTTONS.DPAD_RIGHT] = 15;

    axesMap[ig.AXES.LEFT_STICK_X] = 0;
    axesMap[ig.AXES.LEFT_STICK_Y] = 1;
    axesMap[ig.AXES.RIGHT_STICK_X] = 2;
    axesMap[ig.AXES.RIGHT_STICK_Y] = 3;

    ig.Html5GamepadHandler = ig.Class.extend({
        init: function () {},

        /**
         * Poll the browser's gamepad list and sync every connected pad into
         * the manager's `gamepads` map (disconnecting pads are removed).
         * @param {Object} gamepads - the manager's `gamepads` map (key → ig.Gamepad)
         */
        update: function (gamepads) {
            var gamepadList = navigator.getGamepads && navigator.getGamepads() ||
                navigator.webkitGetGamepads && navigator.webkitGetGamepads() ||
                navigator.webkitGamepads;
            if (gamepadList) {
                for (var i = 0; i < gamepadList.length; i++) {
                    var html5Gamepad;
                    gamepadList[i] && (html5Gamepad = gamepadList[i]);
                    var key = "html5Pad" + i;
                    if (html5Gamepad) {
                        if (!gamepads[key]) {
                            var gamepad = new ig.Gamepad();
                            gamepad.buttonDeadzones[ig.BUTTONS.LEFT_TRIGGER] = 30 / 255;
                            gamepad.buttonDeadzones[ig.BUTTONS.RIGHT_TRIGGER] = 30 / 255;
                            gamepad.axesDeadzones[ig.AXES.LEFT_STICK_X] = 7849 / 32767;
                            gamepad.axesDeadzones[ig.AXES.LEFT_STICK_Y] = 7849 / 32767;
                            gamepad.axesDeadzones[ig.AXES.RIGHT_STICK_X] = 8689 / 32767;
                            gamepad.axesDeadzones[ig.AXES.RIGHT_STICK_Y] = 8689 / 32767;
                            gamepads[key] = gamepad;
                        }
                        gamepad = gamepads[key];
                        html5Gamepad = html5Gamepad;
                        var buttonName;
                        for (buttonName in buttonMap) {
                            var button = html5Gamepad.buttons[buttonMap[buttonName]];
                            button instanceof Object ?
                                gamepad.updateButton(buttonName, button.value) :
                                gamepad.updateButton(buttonName, button);
                        }
                        buttonName = void 0;
                        for (buttonName in axesMap) {
                            var axisValue = html5Gamepad.axes[axesMap[buttonName]];
                            gamepad.updateAxes(buttonName, axisValue);
                        }
                    } else {
                        delete gamepads[key];
                    }
                }
            }
        }
    });

    ig.GamepadManager.addHandlerCheck(function () {
        if (typeof navigator.webkitGamepads != "undefined" ||
            typeof navigator.webkitGetGamepads != "undefined" ||
            typeof navigator.getGamepads != "undefined") {
            return new ig.Html5GamepadHandler();
        }
    });
});
ig.baked = !0;
