/**
 * @module game.feature.new-game.plug-in
 *
 * Module loader for the new-game feature. Aggregates the new-game
 * model and event steps. In the Weltmeister editor, registers
 * new-game editor panels.
 */
ig.module("game.feature.new-game.plug-in").requires("game.feature.new-game.new-game-model", "game.feature.new-game.new-game-steps").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.new-game.editors.new-game-editors")
});
ig.baked = !0;