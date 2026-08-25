ig.module("impact.feature.storage.plug-in").requires("impact.feature.storage.storage").defines(function() {
    window.wm && wm.mapAttribs && (wm.mapAttribs.saveMode = {
        _type: "String",
        _select: ig.SAVE_MODE,
        _info: "Save Mode of the map (Enabled = can save at any time, disable = only on savepoints)",
        _withNull: true
    })
});
ig.baked = !0;
