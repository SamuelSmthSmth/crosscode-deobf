/**
 * impact.feature.weather.plug-in
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.plug-in")`.
 *
 * The plug-in entry point for the weather subsystem.
 * Pulls in the weather add-on and its steps, and — inside the WorldMap editor —
 * registers a `weather` map attribute so maps can pick a weather type.
 */
ig.module("impact.feature.weather.plug-in")
    .requires("impact.feature.weather.weather", "impact.feature.weather.weather-steps")
    .defines(function () {
    if (window.wm && wm.mapAttribs) {
        wm.mapAttribs.weather = {
            _type: "String",
            _select: ig.WEATHER_TYPES,
            _info: "Weather to be displayed"
        };
    }
});
ig.baked = !0;
