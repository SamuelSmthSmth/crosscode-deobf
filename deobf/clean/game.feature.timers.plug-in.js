/**
 * @module game.feature.timers.plug-in
 *
 * Module loader for the timers feature. Aggregates the timers steps, HUD,
 * and model. In the Weltmeister editor, registers the timers editors and
 * colors timer steps cyan.
 */
ig.module("game.feature.timers.plug-in").requires("game.feature.timers.timers-steps", "game.feature.timers.gui.timers-hud", "game.feature.timers.timers-model").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.timers.editors.timers-editors");
        wm.addStepColorRule(/TIMER/, "cyan")
    }
});
ig.baked = !0;
