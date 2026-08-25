/**
 * game.feature.game-code.plug-in
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.game-code.plug-in")`.
 *
 * Game-code plug-in entry point. Adds the "sc.gimmick" language file
 * used by the game-code system's cheat-code messages.
 */
ig.module("game.feature.game-code.plug-in").requires(
    "game.feature.game-code.game-code"
).defines(function () {
    ig.langFileList.push("sc.gimmick");
});
ig.baked = !0;