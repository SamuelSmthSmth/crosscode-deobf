/**
 * @module game.feature.version.plug-in
 *
 * Module loader for the version feature. Aggregates the version info system
 * and the changelog/DLC GUIs. In the Weltmeister editor, registers the
 * changelog editor panel.
 */
ig.module("game.feature.version.plug-in").requires("game.feature.version.version", "game.feature.version.gui.changelog-gui", "game.feature.version.gui.dlc-gui").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.version.editors.changelog-editor")
});
ig.baked = !0;
