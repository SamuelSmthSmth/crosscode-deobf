/**
 * impact.feature.light.plug-in
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.light.plug-in")`.
 *
 * The plug-in entry point for the lighting subsystem.
 * Pulls in the light add-on, the step definitions, the light map layer and the
 * conditional-light entity via `requires`.
 */
ig.module("impact.feature.light.plug-in")
    .requires(
        "impact.feature.light.light",
        "impact.feature.light.light-steps",
        "impact.feature.light.light-map",
        "impact.feature.light.entities.cond-light"
    )
    .defines(function () {});
