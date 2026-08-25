ig.module("game.feature.new-game.plug-in").requires("game.feature.new-game.new-game-model", "game.feature.new-game.new-game-steps").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.new-game.editors.new-game-editors")
});
ig.baked = !0;
