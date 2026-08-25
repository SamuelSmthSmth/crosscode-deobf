/**
 * @module game.feature.arena.plug-in
 *
 * Module loader for the arena feature. Aggregates the arena system,
 * spawn entity, GUI components, and event steps. In the Weltmeister
 * editor, registers arena editor panels and step coloring rules.
 */
ig.module("game.feature.arena.plug-in").requires("game.feature.arena.arena", "game.feature.arena.entities.arena-spawn", "game.feature.arena.gui.arena-gui", "game.feature.arena.arena-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.arena.editors.arena-editors");
        wm.addStepColorRule(/ARENA/, "orange")
    }
});
ig.baked = !0;