/**
 * impact.feature.dream-fx.plug-in
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.dream-fx.plug-in")`.
 *
 * Subsystem entry point; in the editor it colors DREAM steps in the event
 * editor.
 */
ig.module("impact.feature.dream-fx.plug-in")
    .requires("impact.feature.dream-fx.dream-fx", "impact.feature.dream-fx.dream-fx-steps")
    .defines(function () {
    if (window.wm) {
        wm.addStepColorRule(/DREAM_MSG/, "red");
        wm.addStepColorRule(/DREAM/, "yellow");
    }
});
ig.baked = !0;
