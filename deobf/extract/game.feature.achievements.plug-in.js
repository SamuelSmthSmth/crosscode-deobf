ig.module("game.feature.achievements.plug-in").requires("game.feature.achievements.achievements", "game.feature.achievements.stats-model", "game.feature.achievements.stat-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.achievements.editors.feat-editors");
        wm.addStepColorRule(/STAT/, "orange");
        wm.addStepColorRule(/TROPHY/, "orange")
    }
});
ig.baked = !0;
