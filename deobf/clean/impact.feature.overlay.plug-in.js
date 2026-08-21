/**
 * impact.feature.overlay.plug-in
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.overlay.plug-in")`.
 *
 * Subsystem entry point; in the editor it colors OVERLAY steps in yellow.
 */
ig.module("impact.feature.overlay.plug-in")
    .requires("impact.feature.overlay.overlay", "impact.feature.overlay.overlay-steps")
    .defines(function () {
    window.wm && wm.addStepColorRule(/OVERLAY/, "yellow");
});
ig.baked = !0;
