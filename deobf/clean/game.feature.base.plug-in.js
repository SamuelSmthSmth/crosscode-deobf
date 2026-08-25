/**
 * @module game.feature.base.plug-in
 *
 * Module loader for the base feature. Aggregates the action-steps and
 * event-steps modules, which provide the core reusable step actions used
 * throughout the game's event system.
 */
ig.module("game.feature.base.plug-in").requires("game.feature.base.action-steps", "game.feature.base.event-steps").defines(function() {});
ig.baked = !0;
