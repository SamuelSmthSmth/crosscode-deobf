ig.module("impact.feature.gamepad.html5-gamepad").requires("impact.feature.gamepad.gamepad").defines(function() {
    ig.Html5GamepadHandler = ig.Class.extend({
        init: function() {},
        update: function(d) {
            var c = navigator.getGamepads && navigator.getGamepads() || navigator.webkitGetGamepads && navigator.webkitGetGamepads() || navigator.webkitGamepads;
            if (c)
                for (var e = 0; e < c.length; e++) {
                    var f;
                    c[e] && (f = c[e]);
                    var g = "html5Pad" + e;
                    if (f) {
                        if (!d[g]) {
                            var h = d,
                                i = g,
                                j = new ig.Gamepad;
                            j.buttonDeadzones[ig.BUTTONS.LEFT_TRIGGER] = 30 / 255;
                            j.buttonDeadzones[ig.BUTTONS.RIGHT_TRIGGER] =
                                30 / 255;
                            j.axesDeadzones[ig.AXES.LEFT_STICK_X] = 7849 / 32767;
                            j.axesDeadzones[ig.AXES.LEFT_STICK_Y] = 7849 / 32767;
                            j.axesDeadzones[ig.AXES.RIGHT_STICK_X] = 8689 / 32767;
                            j.axesDeadzones[ig.AXES.RIGHT_STICK_Y] = 8689 / 32767;
                            h[i] = j
                        }
                        g = d[g];
                        h = f;
                        j = void 0;
                        for (j in b) {
                            i = h.buttons[b[j]];
                            i instanceof Object ? g.updateButton(j, i.value) : g.updateButton(j, i)
                        }
                        j = void 0;
                        for (j in a) {
                            i = h.axes[a[j]];
                            g.updateAxes(j, i)
                        }
                    } else delete d[g]
                }
        }
    });
    var b = {},
        a = {};
    b[ig.BUTTONS.FACE0] = 0;
    b[ig.BUTTONS.FACE1] = 1;
    b[ig.BUTTONS.FACE2] = 2;
    b[ig.BUTTONS.FACE3] =
        3;
    b[ig.BUTTONS.LEFT_SHOULDER] = 4;
    b[ig.BUTTONS.RIGHT_SHOULDER] = 5;
    b[ig.BUTTONS.LEFT_TRIGGER] = 6;
    b[ig.BUTTONS.RIGHT_TRIGGER] = 7;
    b[ig.BUTTONS.SELECT] = 8;
    b[ig.BUTTONS.START] = 9;
    b[ig.BUTTONS.LEFT_STICK] = 10;
    b[ig.BUTTONS.RIGHT_STICK] = 11;
    b[ig.BUTTONS.DPAD_UP] = 12;
    b[ig.BUTTONS.DPAD_DOWN] = 13;
    b[ig.BUTTONS.DPAD_LEFT] = 14;
    b[ig.BUTTONS.DPAD_RIGHT] = 15;
    a[ig.AXES.LEFT_STICK_X] = 0;
    a[ig.AXES.LEFT_STICK_Y] = 1;
    a[ig.AXES.RIGHT_STICK_X] = 2;
    a[ig.AXES.RIGHT_STICK_Y] = 3;
    ig.GamepadManager.addHandlerCheck(function() {
        if (typeof navigator.webkitGamepads !=
            "undefined" || typeof navigator.webkitGetGamepads != "undefined" || typeof navigator.getGamepads != "undefined") return new ig.Html5GamepadHandler
    })
});
ig.baked = !0;
