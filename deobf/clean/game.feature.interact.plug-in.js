/**
 * @module game.feature.interact.plug-in
 *
 * Module loader for the interact feature. Aggregates the map/screen/skip
 * interaction systems and the interaction GUI.
 */
ig.module("game.feature.interact.plug-in").requires("game.feature.interact.map-interact", "game.feature.interact.gui.interact-gui", "game.feature.interact.screen-interact", "game.feature.interact.skip-interact").defines(function() {});
ig.baked = !0;
