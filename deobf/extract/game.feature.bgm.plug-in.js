ig.module("game.feature.bgm.plug-in").requires("game.feature.bgm.playlist", "game.feature.bgm.volume-map").defines(function() {
    window.wm && wm.mapAttribs && (wm.mapAttribs.volume = {
        _type: "Number",
        _info: "Volume modifier for BGM",
        _default: 1
    })
});
ig.baked = !0;
