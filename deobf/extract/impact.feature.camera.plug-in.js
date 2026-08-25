ig.module("impact.feature.camera.plug-in").requires("impact.feature.camera.camera", "impact.feature.camera.camera-steps").defines(function() {
    if (window.wm) {
        wm.addStepColorRule(/CAMERA/, "yellow");
        wm.mapAttribs && (wm.mapAttribs.cameraInBounds = {
            _type: "Boolean",
            _info: "Set true to not move camera outside of map bounds"
        })
    }
});
ig.baked = !0;
