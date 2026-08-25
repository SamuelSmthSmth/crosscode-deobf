ig.module("game.feature.inventory.plug-in").requires("game.feature.inventory.inventory", "game.feature.inventory.detectors", "game.feature.inventory.item-level-scaling").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.inventory.editors.item-editors")
});
ig.baked = !0;
