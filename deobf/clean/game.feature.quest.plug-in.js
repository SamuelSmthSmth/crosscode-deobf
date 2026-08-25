/**
 * @module game.feature.quest.plug-in
 *
 * Module loader for the quest feature. Aggregates quest types, event
 * steps, and the quest model. In the Weltmeister editor, registers
 * quest and quest-hub editor panels and step coloring rules.
 */
ig.module("game.feature.quest.plug-in").requires("game.feature.quest.quest-types", "game.feature.quest.quest-steps", "game.feature.quest.quest-model").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.quest.editors.quest-editors");
        wm.postLoadModules.push("game.feature.quest.editors.quest-hub-editors");
        wm.addStepColorRule(/QUEST/, "limegreen")
    }
});
ig.baked = !0;