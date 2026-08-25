ig.module("impact.feature.weather.plug-in").requires("impact.feature.weather.weather", "impact.feature.weather.weather-steps").defines(function() {
    window.wm && wm.mapAttribs && (wm.mapAttribs.weather = {
        _type: "String",
        _select: ig.WEATHER_TYPES,
        _info: "Weather to be displayed"
    })
});
ig.baked = !0;
