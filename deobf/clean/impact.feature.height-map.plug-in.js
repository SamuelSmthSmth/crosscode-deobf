/**
 * impact.feature.height-map.plug-in
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.height-map.plug-in")`.
 *
 * The plug-in entry point for the height-map subsystem.
 * Pulls in the height-map core and the WorldMap editor chipset configs via
 * `requires`.
 */
ig.module("impact.feature.height-map.plug-in")
    .requires(
        "impact.feature.height-map.height-map",
        "impact.feature.height-map.height-map-config"
    )
    .defines(function () {});
