/**
 * impact.feature.gui.plug-in
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.plug-in")`.
 *
 * The plug-in entry point for the entire `impact.feature.gui.*` subsystem.
 * Its only runtime responsibility is to pull in all GUI modules as dependencies.
 *
 * When running in the World Map editor (`window.wm` is truthy), it also:
 *   - Queues the GUI editor module for post-load.
 *   - Registers a colour rule so event steps whose name matches /GUI/ are highlighted orange.
 */
ig.module("impact.feature.gui.plug-in").requires(
    "impact.feature.gui.gui",
    "impact.feature.gui.gui-images",
    "impact.feature.gui.gui-steps",
    "impact.feature.gui.base.box"
).defines(function () {
    if (window.wm) {
        // Editor-only: load the GUI editor panel and apply a step colour rule.
        wm.postLoadModules.push("impact.feature.gui.editors.gui-editor");
        wm.addStepColorRule(/GUI/, "orange");
    }
});
