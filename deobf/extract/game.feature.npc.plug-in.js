ig.module("game.feature.npc.plug-in").requires("game.feature.npc.entities.sc-actor", "game.feature.npc.entities.npc-entity", "game.feature.npc.entities.npc-runner-entity", "game.feature.npc.entities.npc-waypoint", "game.feature.npc.npc-runners", "game.feature.npc.npc-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.npc.editors.npc-editor");
        wm.mapAttribs && (wm.mapAttribs.npcRunners = {
            _type: "String",
            _select: sc.NPC_RUNNER_GROUP,
            _info: "What kind of NPCs will be running around this map",
            _withNull: true
        })
    }
});
ig.baked = !0;
