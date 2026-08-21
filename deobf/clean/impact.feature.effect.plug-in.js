/**
 * impact.feature.effect.plug-in
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.plug-in")`.
 *
 * The entry-point module for the entire effect subsystem.
 * Pulls in all sub-modules via `requires` and, if running inside the WorldMap
 * editor (window.wm exists), defers loading the effect editor UI.
 */

ig.module("impact.feature.effect.plug-in")
    .requires(
        // editor entity (only used by the WorldMap effect preview tool)
        "impact.feature.effect.entities.effect-previewer",

        // core data / timeline layer
        "impact.feature.effect.effect-sheet",

        // action / event step hooks
        "impact.feature.effect.effect-steps",

        // step type registrations (each fx-*.js adds entries to ig.EFFECT_ENTRY)
        "impact.feature.effect.fx.fx-basic",
        "impact.feature.effect.fx.fx-box",
        "impact.feature.effect.fx.fx-color",
        "impact.feature.effect.fx.fx-circle",
        "impact.feature.effect.fx.fx-homing",
        "impact.feature.effect.fx.fx-light",
        "impact.feature.effect.fx.fx-line",
        "impact.feature.effect.fx.fx-rhombus",
        "impact.feature.effect.fx.fx-wipe"
    )
    .defines(function () {

    /**
     * When running inside the WorldMap editor, lazily load the effect editor UI
     * after all modules have finished loading.
     * In the shipped game `window.wm` is undefined, so this branch is never hit.
     */
    if (window.wm) {
        wm.postLoadModules.push("impact.feature.effect.editors.effect-editor");
    }

});
