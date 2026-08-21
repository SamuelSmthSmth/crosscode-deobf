/**
 * impact.feature.storage.plug-in
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.storage.plug-in")`.
 *
 * The plug-in entry point for the save-storage subsystem.
 * Pulls in the storage add-on and — inside the WorldMap editor — registers the
 * `saveMode` map attribute (Enabled = save anywhere, Disabled = save points only).
 */
ig.module("impact.feature.storage.plug-in")
    .requires("impact.feature.storage.storage")
    .defines(function () {
    if (window.wm && wm.mapAttribs) {
        wm.mapAttribs.saveMode = {
            _type: "String",
            _select: ig.SAVE_MODE,
            _info: "Save Mode of the map (Enabled = can save at any time, disable = only on savepoints)",
            _withNull: true
        };
    }
});
ig.baked = !0;
