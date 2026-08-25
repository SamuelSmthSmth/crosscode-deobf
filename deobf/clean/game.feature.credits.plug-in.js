/**
 * game.feature.credits.plug-in
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.credits.plug-in")`.
 *
 * Credits subsystem entry point. Registers weltmeister step colour rules
 * and the credits editor module.
 */
ig.module("game.feature.credits.plug-in").requires(
    "game.feature.credits.credit-loadable",
    "game.feature.credits.gui.credits-gui",
    "game.feature.credits.credits-steps"
).defines(function () {
    if (window.wm) {
        wm.addStepColorRule(/CREDIT/, "pink");
        wm.addStepColorRule(/CREDITS/, "pink");
        wm.postLoadModules.push("game.feature.credits.editors.credits-editors");
    }
});
ig.baked = !0;