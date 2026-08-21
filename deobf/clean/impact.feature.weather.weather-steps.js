/**
 * impact.feature.weather.weather-steps
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.weather-steps")`.
 *
 * Registers the two weather event steps:
 *   - `SET_WEATHER`             — switch to a weather type (optionally
 *                                 immediately, without the transition).
 *   - `RESTORE_WEATHER_PARTICLES` — re-apply the current weather's particle
 *                                 spawners (e.g. after a level transition).
 */
ig.module("impact.feature.weather.weather-steps")
    .requires("impact.feature.weather.weather", "impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.SET_WEATHER = ig.EventStepBase.extend({
        weather: 0,

        _wm: new ig.Config({
            attributes: {
                weather: {
                    _type: "String",
                    _info: "Type of Weather",
                    _select: ig.WEATHER_TYPES
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true, change weather immediately with no transition"
                }
            }
        }),

        init: function (params) {
            this.weather = new ig.WeatherInstance(params.weather || "NONE");
            this.immediately = params.immediately;
        },

        clearCached: function () {
            this.weather.decreaseRef();
        },

        start: function () {
            ig.weather.setWeather(this.weather, this.immediately);
        }
    });

    ig.EVENT_STEP.RESTORE_WEATHER_PARTICLES = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                immediately: {
                    _type: "Boolean",
                    _info: "If true: make change immediate",
                    _optional: true
                }
            }
        }),

        init: function (params) {
            this.immediately = params.immediately || false;
        },

        start: function () {
            ig.weather.restoreParticles(this.immediately);
        }
    });
});
ig.baked = !0;
