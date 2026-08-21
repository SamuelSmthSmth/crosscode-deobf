/**
 * impact.feature.interact.plug-in
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.interact.plug-in")`.
 *
 * The plug-in entry point for the interaction subsystem.
 * Pulls in the interact manager, button groups, press repeater and the focus
 * GUI base class via `requires`.
 */
ig.module("impact.feature.interact.plug-in")
    .requires(
        "impact.feature.interact.interact",
        "impact.feature.interact.button-interact",
        "impact.feature.interact.press-repeater",
        "impact.feature.interact.gui.focus-gui"
    )
    .defines(function () {});
