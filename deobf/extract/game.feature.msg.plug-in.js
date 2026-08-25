ig.module("game.feature.msg.plug-in").requires("game.feature.msg.entities.event-trigger", "game.feature.msg.gui.message-box", "game.feature.msg.gui.dream-msg", "game.feature.msg.gui.message-overlay", "game.feature.msg.gui.message-board", "game.feature.msg.gui.side-message-hud", "game.feature.msg.message-model", "game.feature.msg.msg-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("game.feature.msg.editors.msg-editor");
        wm.addStepColorRule(/MSG/, "red");
        wm.addStepColorRule(/SHOW_CHOICE/, "red")
    }
});
ig.baked = !0;
