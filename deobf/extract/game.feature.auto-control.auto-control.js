ig.module("game.feature.auto-control.auto-control").requires("impact.base.game").defines(function() {
    sc.AUTO_CTRL_AXIS = ["left", "right"];
    sc.AUTO_INPUT_DEVICE = {
        MOUSE: ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE,
        GAMEPAD: ig.INPUT_DEVICES.GAMEPAD
    };
    sc.AUTO_CTRL_ACTION = ["menu", "quickmenu", "menuConfirm", "menuBack", "menuDown", "menuUp", "menuLeft", "menuRight", "rightPressed", "menuHotkeyHelp", "menuHotkeyHelp2", "menuHotkeyHelp3", "menuCircleLeft", "menuCircleRight", "questCircleLeft", "questCircleRight", "heatMode", "coldMode",
        "shockMode", "waveMode", "moveDirX", "moveDirY", "aiming", "thrown", "charge", "melee", "dashing", "guarding"
    ];
    sc.AutoControl = ig.GameAddon.extend({
        mouse: {
            current: Vec2.create(),
            start: Vec2.create(),
            target: Vec2.create(),
            timer: 0,
            duration: 0
        },
        axis: {
            left: {
                x: 0,
                y: 0,
                timer: 0
            },
            right: {
                x: 0,
                y: 0,
                timer: 0
            }
        },
        actions: {},
        init: function() {
            this.parent("AutoControl")
        },
        get: function(b) {
            return b == "mouseX" ? this.mouse.current.x : b == "mouseY" ? this.mouse.current.y : b == "axisLeftX" ? this.axis.left.x : b == "axisLeftY" ? this.axis.left.y : b == "axisRightX" ?
                this.axis.right.x : b == "axisRightY" ? this.axis.right.y : b == "leftStickDown" ? this.axis.left.x || this.axis.left.y : b == "rightStickDown" ? this.axis.right.x || this.axis.right.y : !this.actions[b] ? false : this.actions[b].value
        },
        isActive: function() {
            return this.active
        },
        setActive: function(b) {
            if (this.active = b) {
                sc.control.setAutoControl(this);
                sc.model.resetMenuState();
                Vec2.assign(this.mouse.current, ig.input.mouse)
            } else {
                sc.control.setAutoControl(null);
                this.actions = {};
                this.setStick("left", 0, 0, 0);
                this.setStick("right", 0, 0,
                    0)
            }
        },
        preUpdateOrder: 0,
        onPreUpdate: function() {
            if (this.active) {
                if (this.mouse.timer) {
                    this.mouse.timer = this.mouse.timer - ig.system.actualTick;
                    if (this.mouse.timer < 0) this.mouse.timer = 0;
                    var b = 1 - this.mouse.timer / this.mouse.duration,
                        b = KEY_SPLINES.EASE_IN_OUT.get(b);
                    Vec2.lerp(this.mouse.start, this.mouse.target, b, this.mouse.current)
                }
                for (var a in this.actions) {
                    b = this.actions[a];
                    if (b.target) {
                        b.value = b.target;
                        b.target = null
                    } else b.hold || delete this.actions[a]
                }
                for (a in this.axis) {
                    b = this.axis[a];
                    if (b.timer) {
                        b.timer =
                            b.timer - ig.system.actualTick;
                        if (b.timer <= 0) {
                            b.timer = 0;
                            b.x = b.y = 0
                        }
                    }
                }
            }
        },
        setMouse: function(b, a, d) {
            if (d) {
                Vec2.assign(this.mouse.start, this.mouse.current);
                Vec2.assignC(this.mouse.target, b, a)
            } else Vec2.assignC(this.mouse.current, b, a);
            this.mouse.duration = d;
            this.mouse.timer = d
        },
        setStick: function(b, a, d, c) {
            this.axis[b].x = a;
            this.axis[b].y = d;
            this.axis[b].timer = c
        },
        setAction: function(b, a, d) {
            this.actions[b] = {
                target: a,
                value: null,
                hold: d || false
            }
        },
        clearAction: function(b) {
            delete this.actions[b]
        }
    });
    ig.addGameAddon(function() {
        return sc.autoControl =
            new sc.AutoControl
    })
});
ig.baked = !0;
