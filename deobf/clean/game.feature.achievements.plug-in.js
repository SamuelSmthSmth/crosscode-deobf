/**
 * @module game.feature.achievements.plug-in
 *
 * Module loader for the achievements feature. Aggregates the achievements
 * system, stats model, and stat event steps. In the Weltmeister editor,
 * registers achievement-related editor panels and step coloring rules.
 */
ig.module("game.feature.achievements.plug-in").requires("game.feature.achievements.achievements", "game.feature.achievements.stats-model", "game.feature.achievements.stat-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.achievements.editors.feat-editors");
        wm.addStepColorRule(/STAT/, "orange");
        wm.addStepColorRule(/TROPHY/, "orange")
    }
});
ig.baked = !0;