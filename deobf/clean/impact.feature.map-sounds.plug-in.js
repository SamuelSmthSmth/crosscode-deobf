/**
 * impact.feature.map-sounds.plug-in
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-sounds.plug-in")`.
 *
 * Subsystem entry point; in the editor it registers the map's "map-sounds"
 * attribute.
 */
ig.module("impact.feature.map-sounds.plug-in")
    .requires("impact.feature.map-sounds.map-sounds", "impact.feature.map-sounds.map-sounds-steps")
    .defines(function () {
    window.wm && wm.mapAttribs && (wm.mapAttribs["map-sounds"] = {
        _type: "String",
        _select: ig.MAP_SOUNDS,
        _info: "Map sounds to be played in the background",
        _withNull: true
    });
});
ig.baked = !0;
