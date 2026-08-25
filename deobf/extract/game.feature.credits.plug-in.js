ig.module("game.feature.credits.plug-in").requires("game.feature.credits.credit-loadable", "game.feature.credits.gui.credits-gui", "game.feature.credits.credits-steps").defines(function() {
    if (window.wm) {
        wm.addStepColorRule(/CREDIT/, "pink");
        wm.addStepColorRule(/CREDITS/, "pink");
        wm.postLoadModules.push("game.feature.credits.editors.credits-editors")
    }
});
ig.baked = !0;
