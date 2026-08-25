ig.module("impact.feature.gamepad.gamepad").requires("impact.base.game", "impact.base.vars").defines(function() {
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
    ig.GamepadManager = ig.GameAddon.extend({
        gamepads: {},
        activeGamepads: [],
        handlers: [],
        init: function() {
            this.parent("Gamepads");
            for (var a = 0; a < b.length; ++a) {
                var d = b[a]();
                d && this.handlers.push(d)
            }
        },
        preUpdateOrder: 0,
        onPreUpdate: function() {
            if (!this.isSupported() || !this.handlers.length) return false;
            this.activeGamepads = [];
            for (var a = this.handlers.length; a--;) this.handlers[a].update(this.gamepads);
            for (var b in this.gamepads) this.activeGamepads.push(this.gamepads[b]);
            if (this.isLeftStickDown() || this.isRightStickDown()) {
                ig.input.mouseGuiActive =
                    false;
                ig.input.currentDevice = ig.INPUT_DEVICES.GAMEPAD
            }
            ig.vars.set("gamepad.active", ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD)
        },
        deferredUpdateOrder: 9001,
        onDeferredUpdate: function() {
            this.isSupported()
        },
        isButtonPressed: function(a) {
            if (!ig.game.firstUpdateLoop) return false;
            for (var b = this.activeGamepads.length; b--;)
                if (this.activeGamepads[b].pressedStates[a]) return true;
            return false
        },
        isButtonReleased: function(a) {
            if (!ig.game.firstUpdateLoop) return false;
            for (var b = this.activeGamepads.length; b--;)
                if (this.activeGamepads[b].releasedStates[a]) return true;
            return false
        },
        isButtonDown: function(a) {
            for (var b = this.activeGamepads.length; b--;) {
                var c = this.activeGamepads[b];
                if (c.buttonStates[a] > (c.buttonDeadzones[a] || 0.5)) return true
            }
            return false
        },
        getButtonValue: function(a) {
            for (var b = this.activeGamepads.length; b--;) {
                var c = this.activeGamepads[b].buttonStates[a];
                if (c) return c
            }
            return 0
        },
        getAxesValue: function(a, b) {
            for (var c = this.activeGamepads.length, e = 0; c--;) {
                var f = this.activeGamepads[c],
                    g = f.axesStates[a];
                if (g) {
                    if (b) {
                        f = f.axesDeadzones[a] || 0.1;
                        if (Math.abs(g) <= f) continue
                    }
                    Math.abs(e) <
                        Math.abs(g) && (e = g)
                }
            }
            return e
        },
        isAxesDown: function(a) {
            for (var b = this.activeGamepads.length; b--;) {
                var c = this.activeGamepads[b],
                    e = c.axesDeadzones[a] || 0.1;
                if (Math.abs(c.axesStates[a]) > e) return true
            }
            return false
        },
        isLeftStickDown: function() {
            return this.isAxesDown(ig.AXES.LEFT_STICK_X) || this.isAxesDown(ig.AXES.LEFT_STICK_Y)
        },
        isRightStickDown: function() {
            return this.isAxesDown(ig.AXES.RIGHT_STICK_X) || this.isAxesDown(ig.AXES.RIGHT_STICK_Y)
        },
        isSupported: function() {
            return this.handlers.length > 0
        }
    });
    var b = [];
    ig.GamepadManager.addHandlerCheck =
        function(a) {
            b.push(a)
        };
    ig.Gamepad = ig.Class.extend({
        buttonDeadzones: [],
        axesDeadzones: [],
        buttonStates: [],
        axesStates: [],
        pressedStates: [],
        releasedStates: [],
        init: function() {},
        updateButton: function(a, b) {
            var c = this.buttonDeadzones[a] || 0.5,
                e = this.buttonStates[a] > c,
                c = b > c;
            this.pressedStates[a] = this.releasedStates[a] = false;
            !e && c ? this.pressedStates[a] = true : e && !c && (this.releasedStates[a] = true);
            this.buttonStates[a] = b;
            if (c) {
                ig.input.mouseGuiActive = false;
                ig.input.currentDevice = ig.INPUT_DEVICES.GAMEPAD
            }
        },
        updateAxes: function(a,
            b) {
            this.axesStates[a] = b
        }
    });
    ig.addGameAddon(function() {
        return ig.gamepad = new ig.GamepadManager
    })
});
ig.baked = !0;
