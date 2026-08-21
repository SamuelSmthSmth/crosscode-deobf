/**
 * game.feature.player.plug-in
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.plug-in")`.
 *
 * Player subsystem entry point: requires the player entities, steps, model,
 * modifiers and skin modules.
 */
ig.module("game.feature.player.plug-in")
    .requires(
        "game.feature.player.entities.crosshair",
        "game.feature.player.entities.player",
        "game.feature.player.player-steps",
        "game.feature.player.crosshair-steps",
        "game.feature.player.player-model",
        "game.feature.player.modifiers",
        "game.feature.player.player-skin"
    )
    .defines(function () {
    window.wm && wm.postLoadModules.push("game.feature.player.editors.player-editors")
});
ig.baked = !0;
