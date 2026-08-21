/**
 * impact.feature.event-sheet.plug-in
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.event-sheet.plug-in")`.
 *
 * The plug-in entry point for the event-sheet subsystem.
 * Pulls in the event-sheet loader and the CALL_EVENT_FROM_SHEET step, and —
 * when running inside the WorldMap editor (`window.wm` is truthy) — defers
 * loading the event-sheet editor UI.
 */
ig.module("impact.feature.event-sheet.plug-in")
    .requires(
        "impact.feature.event-sheet.event-sheet",
        "impact.feature.event-sheet.event-sheet-steps"
    )
    .defines(function () {
        if (window.wm) {
            wm.postLoadModules.push("impact.feature.event-sheet.editors.event-sheet-editor");
        }
    });
