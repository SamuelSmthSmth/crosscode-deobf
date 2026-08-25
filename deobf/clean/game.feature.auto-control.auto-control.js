/**
 * game.feature.auto-control.auto-control
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.auto-control.auto-control")`.
 *
 * `sc.AutoControl` — a game addon that drives player input from scripts
 * (used for automated cutscene sequences). Manages virtual mouse movement
 * (with ease-in-out interpolation), gamepad stick simulation, and
 * per-action toggling so scripts can play out scripted gameplay without
 * actual player input.
 */
ig.module("game.feature.auto-control.auto-control").requires(
    "impact.base.game"
).defines(function () {

    sc.AUTO_CTRL_AXIS = ["left", "right"];

    sc.AUTO_INPUT_DEVICE = {
        MOUSE: ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE,
        GAMEPAD: ig.INPUT_DEVICES.GAMEPAD
    };

    sc.AUTO_CTRL_ACTION = [
        "menu", "quickmenu", "menuConfirm", "menuBack",
        "menuDown", "menuUp", "menuLeft", "menuRight",
        "rightPressed", "menuHotkeyHelp", "menuHotkeyHelp2", "menuHotkeyHelp3",
        "menuCircleLeft", "menuCircleRight",
        "questCircleLeft", "questCircleRight",
        "heatMode", "coldMode", "shockMode", "waveMode",
        "moveDirX", "moveDirY",
        "aiming", "thrown", "charge", "melee", "dashing", "guarding"
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
            left: { x: 0, y: 0, timer: 0 },
            right: { x: 0, y: 0, timer: 0 }
        },
        actions: {},
        init: function () { this.parent("AutoControl"); },

        get: function (name) {
            if (name == "mouseX") return this.mouse.current.x;
            if (name == "mouseY") return this.mouse.current.y;
            if (name == "axisLeftX") return this.axis.left.x;
            if (name == "axisLeftY") return this.axis.left.y;
            if (name == "axisRightX") return this.axis.right.x;
            if (name == "axisRightY") return this.axis.right.y;
            if (name == "leftStickDown") return this.axis.left.x || this.axis.left.y;
            if (name == "rightStickDown") return this.axis.right.x || this.axis.right.y;
            return !this.actions[name] ? false : this.actions[name].value;
        },
        isActive: function () { return this.active; },
        setActive: function (active) {
            if ((this.active = active)) {
                sc.control.setAutoControl(this);
                sc.model.resetMenuState();
                Vec2.assign(this.mouse.current, ig.input.mouse);
            } else {
                sc.control.setAutoControl(null);
                this.actions = {};
                this.setStick("left", 0, 0, 0);
                this.setStick("right", 0, 0, 0);
            }
        },
        preUpdateOrder: 0,
        onPreUpdate: function () {
            if (this.active) {
                if (this.mouse.timer) {
                    this.mouse.timer -= ig.system.actualTick;
                    if (this.mouse.timer < 0) this.mouse.timer = 0;
                    var t = 1 - this.mouse.timer / this.mouse.duration;
                    t = KEY_SPLINES.EASE_IN_OUT.get(t);
                    Vec2.lerp(this.mouse.start, this.mouse.target, t, this.mouse.current);
                }
                for (var action in this.actions) {
                    var entry = this.actions[action];
                    if (entry.target) { entry.value = entry.target; entry.target = null; }
                    else if (!entry.hold) delete this.actions[action];
                }
                for (var axis in this.axis) {
                    var ax = this.axis[axis];
                    if (ax.timer) {
                        ax.timer -= ig.system.actualTick;
                        if (ax.timer <= 0) { ax.timer = 0; ax.x = ax.y = 0; }
                    }
                }
            }
        },
        setMouse: function (x, y, duration) {
            if (duration) {
                Vec2.assign(this.mouse.start, this.mouse.current);
                Vec2.assignC(this.mouse.target, x, y);
            } else Vec2.assignC(this.mouse.current, x, y);
            this.mouse.duration = duration;
            this.mouse.timer = duration;
        },
        setStick: function (stick, x, y, duration) {
            this.axis[stick].x = x;
            this.axis[stick].y = y;
            this.axis[stick].timer = duration;
        },
        setAction: function (action, value, hold) {
            this.actions[action] = { target: value, value: null, hold: hold || false };
        },
        clearAction: function (action) { delete this.actions[action]; }
    });

    ig.addGameAddon(function () { return sc.autoControl = new sc.AutoControl; });
});
ig.baked = !0;