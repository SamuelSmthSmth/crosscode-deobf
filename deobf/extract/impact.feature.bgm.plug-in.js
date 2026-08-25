ig.module("impact.feature.bgm.plug-in").requires("impact.feature.bgm.bgm", "impact.feature.bgm.bgm-steps").defines(function() {
    window.wm && wm.mapAttribs && (wm.mapAttribs.bgm = {
        _type: "String",
        _select: ig.BGM_DEFAULT_TRACKS,
        _info: "Music set to be played on this map.",
        _withNull: true
    })
});
ig.baked = !0;
