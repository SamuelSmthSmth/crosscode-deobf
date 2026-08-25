ig.module("impact.feature.effect.plug-in").requires("impact.feature.effect.entities.effect-previewer", "impact.feature.effect.effect-sheet", "impact.feature.effect.effect-steps", "impact.feature.effect.fx.fx-basic", "impact.feature.effect.fx.fx-box", "impact.feature.effect.fx.fx-color", "impact.feature.effect.fx.fx-circle", "impact.feature.effect.fx.fx-homing", "impact.feature.effect.fx.fx-light", "impact.feature.effect.fx.fx-line", "impact.feature.effect.fx.fx-rhombus", "impact.feature.effect.fx.fx-wipe").defines(function() {
    window.wm &&
        wm.postLoadModules.push("impact.feature.effect.editors.effect-editor")
});
ig.baked = !0;
