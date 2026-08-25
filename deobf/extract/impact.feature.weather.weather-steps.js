ig.module("impact.feature.weather.weather-steps").requires("impact.feature.weather.weather", "impact.base.action", "impact.base.event").defines(function() {
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
        init: function(b) {
            this.weather = new ig.WeatherInstance(b.weather || "NONE");
            this.immediately =
                b.immediately
        },
        clearCached: function() {
            this.weather.decreaseRef()
        },
        start: function() {
            ig.weather.setWeather(this.weather, this.immediately)
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
        init: function(b) {
            this.immediately = b.immediately || false
        },
        start: function() {
            ig.weather.restoreParticles(this.immediately)
        }
    })
});
ig.baked = !0;
