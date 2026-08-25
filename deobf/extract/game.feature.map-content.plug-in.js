ig.module("game.feature.map-content.plug-in").requires("game.feature.map-content.entities.elevator", "game.feature.map-content.map-content-steps", "game.feature.map-content.gui.icon-hover-text", "game.feature.map-content.map-style", "game.feature.map-content.sc-doors", "game.feature.map-content.prop-interact", "game.feature.map-content.entities.jump-panel", "game.feature.map-content.entities.teleport-central", "game.feature.map-content.entities.rhombus-point").defines(function() {
    ig.langFileList.push("sc.map-content");
    window.wm && wm.postLoadModules.push("game.feature.map-content.editors.map-content-editor")
});
ig.baked = !0;
