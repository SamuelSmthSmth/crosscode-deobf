/**
 * impact.feature.camera.plug-in
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.camera.plug-in")`.
 *
 * The plug-in entry point for the camera subsystem.
 * Pulls in the camera add-on and its steps, and — inside the WorldMap editor —
 * highlights camera steps and registers the `cameraInBounds` map attribute.
 */
ig.module("impact.feature.camera.plug-in")
    .requires("impact.feature.camera.camera", "impact.feature.camera.camera-steps")
    .defines(function () {
    if (window.wm) {
        wm.addStepColorRule(/CAMERA/, "yellow");
        wm.mapAttribs && (wm.mapAttribs.cameraInBounds = {
            _type: "Boolean",
            _info: "Set true to not move camera outside of map bounds"
        });
    }
});
ig.baked = !0;
