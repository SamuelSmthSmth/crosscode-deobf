/**
 * @module game.feature.xeno-dialogs.plug-in
 *
 * Module loader for the xeno-dialogs feature. Aggregates the xeno-dialog
 * entity and its GUI icon. In the Weltmeister editor, registers the
 * xeno-dialog editor panel.
 */
ig.module("game.feature.xeno-dialogs.plug-in").requires("game.feature.xeno-dialogs.entities.xeno-dialog", "game.feature.xeno-dialogs.gui.xeno-icon").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.xeno-dialogs.editors.xeno-dialog-editor")
});
ig.baked = !0;
