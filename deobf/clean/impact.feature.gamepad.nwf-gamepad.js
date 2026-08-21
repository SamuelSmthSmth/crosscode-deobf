/**
 * impact.feature.gamepad.nwf-gamepad
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gamepad.nwf-gamepad")`.
 *
 * NWF (Wii U GamePad) handler for `ig.GamepadManager`. Wraps the single
 * `window.nwf.input.WiiUGamePad` controller, mapping its native buttons and
 * both sticks onto `ig.BUTTONS` / `ig.AXES`. Only registered when `window.nwf`
 * exists (i.e. on the Wii U / NWF runtime).
 */
ig.module("impact.feature.gamepad.nwf-gamepad")
    .requires("impact.feature.gamepad.gamepad")
    .defines(function () {

    /** `ig.BUTTONS` key → NWF `ControllerButton` constant. */
    var buttonMap = {};

    ig.NWFGamepadHandler = ig.Class.extend({
        mainGamepad: null,

        init: function () {
            this.mainGamepad = window.nwf.input.WiiUGamePad.getController();
            var controllerButton = window.nwf.input.ControllerButton;
            buttonMap[ig.BUTTONS.FACE0] = controllerButton.GAMEPAD_B;
            buttonMap[ig.BUTTONS.FACE1] = controllerButton.GAMEPAD_A;
            buttonMap[ig.BUTTONS.FACE2] = controllerButton.GAMEPAD_Y;
            buttonMap[ig.BUTTONS.FACE3] = controllerButton.GAMEPAD_X;
            buttonMap[ig.BUTTONS.LEFT_SHOULDER] = controllerButton.GAMEPAD_L;
            buttonMap[ig.BUTTONS.RIGHT_SHOULDER] = controllerButton.GAMEPAD_R;
            buttonMap[ig.BUTTONS.LEFT_TRIGGER] = controllerButton.GAMEPAD_ZL;
            buttonMap[ig.BUTTONS.RIGHT_TRIGGER] = controllerButton.GAMEPAD_ZR;
            buttonMap[ig.BUTTONS.SELECT] = controllerButton.GAMEPAD_MINUS;
            buttonMap[ig.BUTTONS.START] = controllerButton.GAMEPAD_PLUS;
            buttonMap[ig.BUTTONS.LEFT_STICK] = controllerButton.GAMEPAD_L_STICK;
            buttonMap[ig.BUTTONS.RIGHT_STICK] = controllerButton.GAMEPAD_R_STICK;
            buttonMap[ig.BUTTONS.DPAD_UP] = controllerButton.GAMEPAD_UP;
            buttonMap[ig.BUTTONS.DPAD_DOWN] = controllerButton.GAMEPAD_DOWN;
            buttonMap[ig.BUTTONS.DPAD_LEFT] = controllerButton.GAMEPAD_LEFT;
            buttonMap[ig.BUTTONS.DPAD_RIGHT] = controllerButton.GAMEPAD_RIGHT;
        },

        /**
         * Sync the Wii U GamePad's buttons and both sticks into the manager's
         * `gamepads` map under the `wiiUMain` key.
         * @param {Object} gamepads - the manager's `gamepads` map
         */
        update: function (gamepads) {
            if (!gamepads.wiiUMain) {
                var wiiUGamepad = new ig.Gamepad();
                wiiUGamepad.buttonDeadzones[ig.BUTTONS.LEFT_TRIGGER] = 30 / 255;
                wiiUGamepad.buttonDeadzones[ig.BUTTONS.RIGHT_TRIGGER] = 30 / 255;
                wiiUGamepad.axesDeadzones[ig.AXES.LEFT_STICK_X] = 7849 / 32767;
                wiiUGamepad.axesDeadzones[ig.AXES.LEFT_STICK_Y] = 7849 / 32767;
                wiiUGamepad.axesDeadzones[ig.AXES.RIGHT_STICK_X] = 8689 / 32767;
                wiiUGamepad.axesDeadzones[ig.AXES.RIGHT_STICK_Y] = 8689 / 32767;
                gamepads.wiiUMain = wiiUGamepad;
            }
            var gamepad = gamepads.wiiUMain,
                mainGamepad = this.mainGamepad,
                buttons = mainGamepad.buttons,
                buttonName;
            for (buttonName in buttonMap) {
                var isPressed = buttons.isButtonPressed(buttonMap[buttonName]);
                gamepad.updateButton(buttonName, isPressed);
            }
            var leftStick = mainGamepad.leftStick;
            gamepad.updateAxes(ig.AXES.LEFT_STICK_X, leftStick.movementX);
            gamepad.updateAxes(ig.AXES.LEFT_STICK_Y, leftStick.movementY);
            var rightStick = mainGamepad.rightStick;
            gamepad.updateAxes(ig.AXES.RIGHT_STICK_X, rightStick.movementX);
            gamepad.updateAxes(ig.AXES.RIGHT_STICK_Y, rightStick.movementY);
        }
    });

    ig.GamepadManager.addHandlerCheck(function () {
        if (window.nwf) return new ig.NWFGamepadHandler();
    });
});
ig.baked = !0;
