/**
 * impact.feature.screen-blur.plug-in
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.screen-blur.plug-in")`.
 *
 * Subsystem entry point; in the editor it colors SCREEN_BLUR steps in yellow.
 */
ig.module("impact.feature.screen-blur.plug-in")
    .requires("impact.feature.screen-blur.screen-blur", "impact.feature.screen-blur.screen-blur-steps")
    .defines(function () {
    window.wm && wm.addStepColorRule(/SCREEN_BLUR/, "yellow");
});
ig.baked = !0;
