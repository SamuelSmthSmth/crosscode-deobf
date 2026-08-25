ig.module("game.feature.arena.plug-in").requires("game.feature.arena.arena", "game.feature.arena.entities.arena-spawn", "game.feature.arena.gui.arena-gui", "game.feature.arena.arena-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.arena.editors.arena-editors");
        wm.addStepColorRule(/ARENA/, "orange")
    }
});
ig.baked = !0;
