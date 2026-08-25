ig.module("game.feature.party.plug-in").requires("game.feature.party.party", "game.feature.party.party-steps", "game.feature.party.party-member-model", "game.feature.party.entities.party-member-entity").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.party.editors.party-editors")
});
ig.baked = !0;
