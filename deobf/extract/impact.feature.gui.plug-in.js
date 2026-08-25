ig.module("impact.feature.gui.plug-in").requires("impact.feature.gui.gui", "impact.feature.gui.gui-images", "impact.feature.gui.gui-steps", "impact.feature.gui.base.box").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("impact.feature.gui.editors.gui-editor");
        wm.addStepColorRule(/GUI/, "orange")
    }
});
ig.baked = !0;
