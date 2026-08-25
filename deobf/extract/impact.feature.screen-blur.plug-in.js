ig.module("impact.feature.screen-blur.plug-in").requires("impact.feature.screen-blur.screen-blur", "impact.feature.screen-blur.screen-blur-steps").defines(function() {
    window.wm && wm.addStepColorRule(/SCREEN_BLUR/, "yellow")
});
ig.baked = !0;
