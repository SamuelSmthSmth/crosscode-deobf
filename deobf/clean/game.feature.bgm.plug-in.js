/**
 * game.feature.bgm.plug-in
 * ========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.bgm.plug-in")`.
 *
 * BGM subsystem entry point. Registers the `volume` map attribute for
 * weltmeister (per-map BGM volume modifier).
 */
ig.module("game.feature.bgm.plug-in").requires(
    "game.feature.bgm.playlist",
    "game.feature.bgm.volume-map"
).defines(function () {
    window.wm && wm.mapAttribs && (wm.mapAttribs.volume = {
        _type: "Number",
        _info: "Volume modifier for BGM",
        _default: 1
    });
});
ig.baked = !0;