ig.module("game.feature.common-event.plug-in").requires("game.feature.common-event.common-event", "game.feature.common-event.common-event-steps").defines(function() {
    window.wm && wm.postLoadModules.push("game.feature.common-event.editors.common-event-editors")
});
ig.baked = !0;
