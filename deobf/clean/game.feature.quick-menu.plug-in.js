/**
 * @module game.feature.quick-menu.plug-in
 *
 * Module loader for the quick-menu feature. Aggregates the quick-menu model,
 * its GUI components, and the analyzable entity. In the Weltmeister editor,
 * registers the quick-menu editor panels.
 */
ig.module("game.feature.quick-menu.plug-in").requires("game.feature.quick-menu.quick-menu-model", "game.feature.quick-menu.gui.quick-menu", "game.feature.quick-menu.gui.circle-menu", "game.feature.quick-menu.gui.quick-item-menu", "game.feature.quick-menu.entities.analyzable").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.quick-menu.editors.quick-menu-editors")
});
ig.baked = !0;
