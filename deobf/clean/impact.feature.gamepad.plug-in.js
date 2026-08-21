/**
 * impact.feature.gamepad.plug-in
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gamepad.plug-in")`.
 *
 * The plug-in entry point for the gamepad subsystem.
 * Pulls in the gamepad manager and both platform handlers (HTML5 and NWF)
 * via `requires`.
 */
ig.module("impact.feature.gamepad.plug-in")
    .requires(
        "impact.feature.gamepad.gamepad",
        "impact.feature.gamepad.html5-gamepad",
        "impact.feature.gamepad.nwf-gamepad"
    )
    .defines(function () {});
