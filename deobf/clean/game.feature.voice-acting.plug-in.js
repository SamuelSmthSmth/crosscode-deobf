/**
 * @module game.feature.voice-acting.plug-in
 *
 * Module loader for the voice-acting feature. Aggregates the voice-acting
 * system and its voice actor configuration data.
 */
ig.module("game.feature.voice-acting.plug-in").requires("game.feature.voice-acting.voice-acting", "game.feature.voice-acting.va-config").defines(function() {});
ig.baked = !0;
