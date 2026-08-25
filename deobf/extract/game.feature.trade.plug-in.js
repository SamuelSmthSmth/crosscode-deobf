ig.module("game.feature.trade.plug-in").requires("game.feature.trade.gui.trade-menu", "game.feature.trade.gui.trade-icon", "game.feature.trade.trade-steps").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.trade.editors.trade-editor")
});
ig.baked = !0;
