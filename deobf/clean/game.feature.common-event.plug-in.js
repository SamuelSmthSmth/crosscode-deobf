/**
 * game.feature.common-event.plug-in
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.common-event.plug-in")`.
 *
 * Common-event subsystem entry point. Registers the Weltmeister editor
 * module for common events.
 */
ig.module("game.feature.common-event.plug-in").requires(
    "game.feature.common-event.common-event",
    "game.feature.common-event.common-event-steps"
).defines(function () {
    window.wm && wm.postLoadModules.push(
        "game.feature.common-event.editors.common-event-editors"
    );
});
ig.baked = !0;