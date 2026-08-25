ig.module("game.feature.quick-menu.plug-in").requires("game.feature.quick-menu.quick-menu-model", "game.feature.quick-menu.gui.quick-menu", "game.feature.quick-menu.gui.circle-menu", "game.feature.quick-menu.gui.quick-item-menu", "game.feature.quick-menu.entities.analyzable").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.quick-menu.editors.quick-menu-editors")
});
ig.baked = !0;
