ig.module("game.feature.auto-control.auto-control-steps").requires("impact.base.event", "game.feature.auto-control.auto-control").defines(function() {
    ig.EVENT_STEP.START_AUTO_CTRL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(b, a) {
            sc.model.enterGame();
            a.pauseParallel = true;
            a.runType = ig.EventRunType.PARALLEL;
            sc.autoControl.setActive(true)
        }
    });
    ig.EVENT_STEP.END_AUTO_CTRL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(b,
            a) {
            a.pauseParallel = false;
            a.runType = ig.EventRunType.BLOCKING;
            sc.autoControl.setActive(false);
            sc.model.enterCutscene()
        }
    });
    ig.EVENT_STEP.SET_AUTO_CTRL_MOUSE = ig.EventStepBase.extend({
        pos: Vec2.create(),
        duration: 0,
        _wm: new ig.Config({
            attributes: {
                pos: {
                    _type: "Vec2",
                    _info: "Position of mouse in screen pixels. 0,0 = top left"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration to move mouse to this position"
                }
            }
        }),
        init: function(b) {
            Vec2.assign(this.pos, b.pos);
            this.duration = b.duration || 0
        },
        start: function() {
            if (!sc.autoControl.isActive()) throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && sc.autoControl.setMouse(this.pos.x, this.pos.y, this.duration)
        }
    });
    ig.EVENT_STEP.SET_AUTO_CTRL_STICK = ig.EventStepBase.extend({
        stick: null,
        value: Vec2.create(),
        duration: 0,
        _wm: new ig.Config({
            attributes: {
                stick: {
                    _type: "String",
                    _info: "Type of Stick",
                    _select: sc.AUTO_CTRL_AXIS
                },
                value: {
                    _type: "Vec2",
                    _info: "Type of value for the axis"
                },
                duration: {
                    _type: "Number",
                    _info: "Time in seconds to hold the stick in that direction. If 0 = hold forever."
                }
            }
        }),
        init: function(b) {
            this.stick =
                b.stick || "left";
            Vec2.assign(this.value, b.value);
            this.duration = b.duration || 0
        },
        start: function() {
            if (!sc.autoControl.isActive()) throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.autoControl.setStick(this.stick, this.value.x, this.value.y, this.duration)
        }
    });
    ig.EVENT_STEP.SET_AUTO_CTRL_ACTION = ig.EventStepBase.extend({
        action: null,
        value: null,
        hold: false,
        deviceFilter: null,
        _wm: new ig.Config({
            attributes: {
                action: {
                    _type: "String",
                    _info: "Kind of action",
                    _select: sc.AUTO_CTRL_ACTION
                },
                value: {
                    _type: "Number",
                    _info: "Value for action. 1 usually makes sense",
                    _default: 1
                },
                hold: {
                    _type: "Boolean",
                    _info: "True if action should be hold"
                },
                deviceFilter: {
                    _type: "String",
                    _info: "Only do action for a specific device",
                    _select: sc.AUTO_INPUT_DEVICE,
                    _withNull: true
                }
            }
        }),
        init: function(b) {
            this.action = b.action || null;
            this.value = b.value || 0;
            this.hold = b.hold || false;
            this.deviceFilter = sc.AUTO_INPUT_DEVICE[b.deviceFilter] || null
        },
        start: function() {
            if (!sc.autoControl.isActive()) throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            this.deviceFilter && ig.input.currentDevice != this.deviceFilter || sc.autoControl.setAction(this.action, this.value, this.hold)
        }
    });
    ig.EVENT_STEP.CLEAR_AUTO_CTRL_ACTION = ig.EventStepBase.extend({
        action: null,
        deviceFilter: null,
        _wm: new ig.Config({
            attributes: {
                action: {
                    _type: "String",
                    _info: "Kind of action",
                    _select: sc.AUTO_CTRL_ACTION
                },
                deviceFilter: {
                    _type: "String",
                    _info: "Only do action for a specific device",
                    _filter: sc.AUTO_INPUT_DEVICE,
                    _withNull: true
                }
            }
        }),
        init: function(b) {
            this.action = b.action || null;
            this.deviceFilter =
                sc.AUTO_INPUT_DEVICE[b.deviceFilter] || null
        },
        start: function() {
            if (!sc.autoControl.isActive()) throw Error("Use Auto ntrl Step outside of 'AUTO_CONTROL' event");
            this.deviceFilter && ig.input.currentDevice != this.deviceFilter || sc.autoControl.clearAction(this.action)
        }
    })
});
ig.baked = !0;
