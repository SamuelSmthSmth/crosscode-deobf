/**
 * @module game.feature.party.plug-in
 *
 * Module loader for the party feature. Aggregates the party system, its
 * steps, the party member model, and the party member entity. In the
 * Weltmeister editor, registers the party editor panels.
 */
ig.module("game.feature.party.plug-in").requires("game.feature.party.party", "game.feature.party.party-steps", "game.feature.party.party-member-model", "game.feature.party.entities.party-member-entity").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.party.editors.party-editors")
});
ig.baked = !0;
