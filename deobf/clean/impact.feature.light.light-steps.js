/**
 * impact.feature.light.light-steps
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.light.light-steps")`.
 *
 * Registers the two lighting action steps:
 *   - `ADD_DARKNESS`   — darken the screen to a given intensity, with fade
 *                        in/out and an optional duration (-1 = continuous).
 *   - `CLEAR_DARKNESS` — stop the first darkness handle attached to the
 *                        running action.
 */
ig.module("impact.feature.light.light-steps")
    .requires("impact.base.action", "impact.base.event")
    .defines(function () {
    Vec3.create();

    ig.ACTION_STEP.ADD_DARKNESS = ig.EventStepBase.extend({
        intensity: 0,
        duration: 0,
        fadeIn: 0,
        fadeOut: 0,

        _wm: new ig.Config({
            attributes: {
                intensity: {
                    _type: "Number",
                    _info: "Intensity of darkness"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of darkness effect. -1 for continuous effect"
                },
                fadeIn: {
                    _type: "Number",
                    _info: "fadeIn duration"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "fadeOut duration"
                }
            }
        }),

        init: function (params) {
            this.intensity = params.intensity || 0;
            this.duration = params.duration || 0;
            this.fadeIn = params.fadeIn || 0;
            this.fadeOut = params.fadeOut || 0;
        },

        start: function (action) {
            var handle = new ig.DarknessHandle();
            handle.setTemporary(action, this.intensity, this.duration, this.fadeIn, this.fadeOut);
            ig.light.addDarknessHandle(handle);
            action.addActionAttached(handle);
        }
    });

    ig.ACTION_STEP.CLEAR_DARKNESS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        /** Stop the first `ig.DarknessHandle` among the action's attached items. */
        start: function (action) {
            var attached = action.actionAttached;
            for (var i = attached.length; i--;) {
                if (attached[i] instanceof ig.DarknessHandle) {
                    attached[i].stop();
                    attached.splice(i, 1);
                    break;
                }
            }
        }
    });
});
ig.baked = !0;
