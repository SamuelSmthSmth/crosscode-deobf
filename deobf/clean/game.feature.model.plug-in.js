/**
 * game.feature.model.plug-in
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.model.plug-in")`.
 *
 * Model subsystem entry point: requires all model modules and registers
 * editor color rules for TASK/CORE steps in the level editor.
 */
ig.module("game.feature.model.plug-in")
    .requires(
        "game.feature.model.base-model",
        "game.feature.model.game-model",
        "game.feature.model.model-steps",
        "game.feature.model.options-model"
    )
    .defines(function () {
    if (window.wm) {
        wm.addStepColorRule(/TASK/, "violet");
        wm.addStepColorRule(/CORE/, "violet");
        wm.postLoadModules.push("game.feature.model.editors.options-editors")
    }
});
ig.baked = !0;
