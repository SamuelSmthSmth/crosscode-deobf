ig.module("game.feature.quest.plug-in").requires("game.feature.quest.quest-types", "game.feature.quest.quest-steps", "game.feature.quest.quest-model").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.quest.editors.quest-editors");
        wm.postLoadModules.push("game.feature.quest.editors.quest-hub-editors");
        wm.addStepColorRule(/QUEST/, "limegreen")
    }
});
ig.baked = !0;
