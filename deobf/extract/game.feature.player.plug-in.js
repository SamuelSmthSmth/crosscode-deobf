ig.module("game.feature.player.plug-in").requires("game.feature.player.entities.crosshair", "game.feature.player.entities.player", "game.feature.player.player-steps", "game.feature.player.crosshair-steps", "game.feature.player.player-model", "game.feature.player.modifiers", "game.feature.player.player-skin").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.player.editors.player-editors")
});
ig.baked = !0;
