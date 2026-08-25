/**
 * @module game.feature.game-sense.plug-in
 *
 * Module loader for the game-sense feature. Aggregates the game-sense
 * model and its HP/element controller modules. No editor-specific
 * registrations are needed.
 */
ig.module("game.feature.game-sense.plug-in").requires("game.feature.game-sense.game-sense-model", "game.feature.game-sense.controllers.hp-controller", "game.feature.game-sense.controllers.element-controller").defines(function() {});
ig.baked = !0;