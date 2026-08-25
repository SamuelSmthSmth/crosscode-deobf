/**
 * game.feature.auto-control.auto-control-steps
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.auto-control.auto-control-steps")`.
 *
 * Auto-control event steps:
 *   - START_AUTO_CTRL / END_AUTO_CTRL — toggle script-driven input
 *   - SET_AUTO_CTRL_MOUSE — move virtual mouse
 *   - SET_AUTO_CTRL_STICK — simulate gamepad stick
 *   - SET_AUTO_CTRL_ACTION / CLEAR_AUTO_CTRL_ACTION — toggle a virtual button
 */
ig.module("game.feature.auto-control.auto-control-steps").requires(
    "impact.base.event",
    "game.feature.auto-control.auto-control"
).defines(function () {

    ig.EVENT_STEP.START_AUTO_CTRL = ig.EventStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),
        init: function () {},
        start: function (data, event) {
            sc.model.enterGame();
            event.pauseParallel = true;
            event.runType = ig.EventRunType.PARALLEL;
            sc.autoControl.setActive(true);
        }
    });

    ig.EVENT_STEP.END_AUTO_CTRL = ig.EventStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),
        init: function () {},
        start: function (data, event) {
            event.pauseParallel = false;
            event.runType = ig.EventRunType.BLOCKING;
            sc.autoControl.setActive(false);
            sc.model.enterCutscene();
        }
    });

    ig.EVENT_STEP.SET_AUTO_CTRL_MOUSE = ig.EventStepBase.extend({
        pos: Vec2.create(), duration: 0,
        _wm: new ig.Config({
            attributes: {
                pos: { _type: "Vec2", _info: "Screen position. 0,0 = top left" },
                duration: { _type: "Number", _info: "Duration to move mouse" }
            }
        }),
        init: function (data) {
            Vec2.assign(this.pos, data.pos);
            this.duration = data.duration || 0;
        },
        start: function () {
            if (!sc.autoControl.isActive())
                throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE)
                sc.autoControl.setMouse(this.pos.x, this.pos.y, this.duration);
        }
    });

    ig.EVENT_STEP.SET_AUTO_CTRL_STICK = ig.EventStepBase.extend({
        stick: null, value: Vec2.create(), duration: 0,
        _wm: new ig.Config({
            attributes: {
                stick: { _type: "String", _info: "Type of Stick", _select: sc.AUTO_CTRL_AXIS },
                value: { _type: "Vec2", _info: "Value for the axis" },
                duration: { _type: "Number", _info: "Seconds to hold. 0 = forever." }
            }
        }),
        init: function (data) {
            this.stick = data.stick || "left";
            Vec2.assign(this.value, data.value);
            this.duration = data.duration || 0;
        },
        start: function () {
            if (!sc.autoControl.isActive())
                throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD)
                sc.autoControl.setStick(this.stick, this.value.x, this.value.y, this.duration);
        }
    });

    ig.EVENT_STEP.SET_AUTO_CTRL_ACTION = ig.EventStepBase.extend({
        action: null, value: null, hold: false, deviceFilter: null,
        _wm: new ig.Config({
            attributes: {
                action: { _type: "String", _info: "Kind of action", _select: sc.AUTO_CTRL_ACTION },
                value: { _type: "Number", _info: "Value. 1 usually makes sense", _default: 1 },
                hold: { _type: "Boolean", _info: "True if action should be held" },
                deviceFilter: { _type: "String", _info: "Only for this device", _select: sc.AUTO_INPUT_DEVICE, _withNull: true }
            }
        }),
        init: function (data) {
            this.action = data.action || null;
            this.value = data.value || 0;
            this.hold = data.hold || false;
            this.deviceFilter = sc.AUTO_INPUT_DEVICE[data.deviceFilter] || null;
        },
        start: function () {
            if (!sc.autoControl.isActive())
                throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            if (!this.deviceFilter || ig.input.currentDevice == this.deviceFilter)
                sc.autoControl.setAction(this.action, this.value, this.hold);
        }
    });

    ig.EVENT_STEP.CLEAR_AUTO_CTRL_ACTION = ig.EventStepBase.extend({
        action: null, deviceFilter: null,
        _wm: new ig.Config({
            attributes: {
                action: { _type: "String", _info: "Kind of action", _select: sc.AUTO_CTRL_ACTION },
                deviceFilter: { _type: "String", _info: "Only for this device", _filter: sc.AUTO_INPUT_DEVICE, _withNull: true }
            }
        }),
        init: function (data) {
            this.action = data.action || null;
            this.deviceFilter = sc.AUTO_INPUT_DEVICE[data.deviceFilter] || null;
        },
        start: function () {
            if (!sc.autoControl.isActive())
                throw Error("Use Auto Ctrl Step outside of 'AUTO_CONTROL' event");
            if (!this.deviceFilter || ig.input.currentDevice == this.deviceFilter)
                sc.autoControl.clearAction(this.action);
        }
    });
});
ig.baked = !0;