ig.module("impact.feature.overlay.plug-in").requires("impact.feature.overlay.overlay", "impact.feature.overlay.overlay-steps").defines(function() {
    window.wm && wm.addStepColorRule(/OVERLAY/, "yellow")
});
ig.baked = !0;
