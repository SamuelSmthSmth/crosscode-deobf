ig.module("impact.feature.dream-fx.plug-in").requires("impact.feature.dream-fx.dream-fx", "impact.feature.dream-fx.dream-fx-steps").defines(function() {
    if (window.wm) {
        wm.addStepColorRule(/DREAM_MSG/, "red");
        wm.addStepColorRule(/DREAM/, "yellow")
    }
});
ig.baked = !0;
