/**
 * impact.feature.bgm.plug-in
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.bgm.plug-in")`.
 *
 * The plug-in entry point for the background-music subsystem.
 * Pulls in the BGM add-on and its steps, and — inside the WorldMap editor —
 * registers the `bgm` map attribute for choosing a map's default track set.
 */
ig.module("impact.feature.bgm.plug-in")
    .requires("impact.feature.bgm.bgm", "impact.feature.bgm.bgm-steps")
    .defines(function () {
    if (window.wm && wm.mapAttribs) {
        wm.mapAttribs.bgm = {
            _type: "String",
            _select: ig.BGM_DEFAULT_TRACKS,
            _info: "Music set to be played on this map.",
            _withNull: true
        };
    }
});
ig.baked = !0;
