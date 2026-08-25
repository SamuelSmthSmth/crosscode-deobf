ig.module("impact.feature.gamepad.nwf-gamepad").requires("impact.feature.gamepad.gamepad").defines(function() {
    ig.NWFGamepadHandler = ig.Class.extend({
        mainGamepad: null,
        init: function() {
            this.mainGamepad = window.nwf.input.WiiUGamePad.getController();
            var a = window.nwf.input.ControllerButton;
            b[ig.BUTTONS.FACE0] = a.GAMEPAD_B;
            b[ig.BUTTONS.FACE1] = a.GAMEPAD_A;
            b[ig.BUTTONS.FACE2] = a.GAMEPAD_Y;
            b[ig.BUTTONS.FACE3] = a.GAMEPAD_X;
            b[ig.BUTTONS.LEFT_SHOULDER] = a.GAMEPAD_L;
            b[ig.BUTTONS.RIGHT_SHOULDER] = a.GAMEPAD_R;
            b[ig.BUTTONS.LEFT_TRIGGER] =
                a.GAMEPAD_ZL;
            b[ig.BUTTONS.RIGHT_TRIGGER] = a.GAMEPAD_ZR;
            b[ig.BUTTONS.SELECT] = a.GAMEPAD_MINUS;
            b[ig.BUTTONS.START] = a.GAMEPAD_PLUS;
            b[ig.BUTTONS.LEFT_STICK] = a.GAMEPAD_L_STICK;
            b[ig.BUTTONS.RIGHT_STICK] = a.GAMEPAD_R_STICK;
            b[ig.BUTTONS.DPAD_UP] = a.GAMEPAD_UP;
            b[ig.BUTTONS.DPAD_DOWN] = a.GAMEPAD_DOWN;
            b[ig.BUTTONS.DPAD_LEFT] = a.GAMEPAD_LEFT;
            b[ig.BUTTONS.DPAD_RIGHT] = a.GAMEPAD_RIGHT
        },
        update: function(a) {
            if (!a.wiiUMain) {
                var d = new ig.Gamepad;
                d.buttonDeadzones[ig.BUTTONS.LEFT_TRIGGER] = 30 / 255;
                d.buttonDeadzones[ig.BUTTONS.RIGHT_TRIGGER] =
                    30 / 255;
                d.axesDeadzones[ig.AXES.LEFT_STICK_X] = 7849 / 32767;
                d.axesDeadzones[ig.AXES.LEFT_STICK_Y] = 7849 / 32767;
                d.axesDeadzones[ig.AXES.RIGHT_STICK_X] = 8689 / 32767;
                d.axesDeadzones[ig.AXES.RIGHT_STICK_Y] = 8689 / 32767;
                a.wiiUMain = d
            }
            var a = a.wiiUMain,
                d = this.mainGamepad,
                c = d.buttons,
                e;
            for (e in b) {
                var f = c.isButtonPressed(b[e]);
                a.updateButton(e, f)
            }
            e = d.leftStick;
            a.updateAxes(ig.AXES.LEFT_STICK_X, e.movementX);
            a.updateAxes(ig.AXES.LEFT_STICK_Y, e.movementY);
            e = d.rightStick;
            a.updateAxes(ig.AXES.RIGHT_STICK_X, e.movementX);
            a.updateAxes(ig.AXES.RIGHT_STICK_Y, e.movementY)
        }
    });
    var b = {};
    ig.GamepadManager.addHandlerCheck(function() {
        if (window.nwf) return new ig.NWFGamepadHandler
    })
});
ig.baked = !0;
