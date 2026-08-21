/**
 * impact.feature.base.plug-in
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.base.plug-in")`.
 *
 * Subsystem entry point for the base feature: action/event steps, base
 * entities, and the editor color rules.
 */
ig.module("impact.feature.base.plug-in")
    .requires(
        "impact.feature.base.action-steps",
        "impact.feature.base.event-steps",
        "impact.feature.base.entities.marker",
        "impact.feature.base.entities.object-layer-view",
        "impact.feature.base.entities.touch-trigger",
        "impact.feature.base.entities.sound-entities"
    )
    .defines(function () {
    if (window.wm) {
        wm.addStepColorRule(/ACTION/, "green");
        wm.addStepColorRule(/ANIM/, "green");
        wm.addStepColorRule(/WAIT/, "gray");
        wm.addStepColorRule(/VAR/, "violet");
        wm.addStepColorRule(/LABEL/, "extremeRed");
    }
    window.wm && wm.postLoadModules.push("impact.feature.base.editors.base-editor");
});
ig.baked = !0;
