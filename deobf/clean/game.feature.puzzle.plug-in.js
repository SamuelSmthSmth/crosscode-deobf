/**
 * game.feature.puzzle.plug-in
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.plug-in")`.
 *
 * Puzzle subsystem entry point: requires every puzzle component, entity and
 * step module, and (in the editor) registers the puzzle editors post-load
 * module.
 */
ig.module("game.feature.puzzle.plug-in")
    .requires(
        "game.feature.puzzle.components.push-pullable",
        "game.feature.puzzle.entities.block",
        "game.feature.puzzle.entities.blockers",
        "game.feature.puzzle.entities.bomb",
        "game.feature.puzzle.entities.water-bubble",
        "game.feature.puzzle.entities.compressor",
        "game.feature.puzzle.entities.water-block",
        "game.feature.puzzle.entities.ice-disk",
        "game.feature.puzzle.entities.key-panel",
        "game.feature.puzzle.entities.ball-changer",
        "game.feature.puzzle.entities.walls",
        "game.feature.puzzle.entities.glowing-line",
        "game.feature.puzzle.entities.lorry",
        "game.feature.puzzle.entities.ferro",
        "game.feature.puzzle.entities.one-time-switch",
        "game.feature.puzzle.entities.element-shield",
        "game.feature.puzzle.entities.floor-switch",
        "game.feature.puzzle.entities.magnet",
        "game.feature.puzzle.entities.multi-hit-switch",
        "game.feature.puzzle.entities.bounce-switch",
        "game.feature.puzzle.entities.thermo-pole",
        "game.feature.puzzle.entities.push-pull-block",
        "game.feature.puzzle.entities.push-pull-dest",
        "game.feature.puzzle.entities.sliding-block",
        "game.feature.puzzle.entities.switch",
        "game.feature.puzzle.entities.destructible",
        "game.feature.puzzle.entities.item-destruct",
        "game.feature.puzzle.entities.regen-destruct",
        "game.feature.puzzle.entities.extract-platform",
        "game.feature.puzzle.entities.dynamic-platform",
        "game.feature.puzzle.entities.ol-platform",
        "game.feature.puzzle.entities.enemy-counter",
        "game.feature.puzzle.entities.group-switch",
        "game.feature.puzzle.entities.chest",
        "game.feature.puzzle.entities.quick-sand",
        "game.feature.puzzle.entities.spiderweb",
        "game.feature.puzzle.entities.steam-pipes",
        "game.feature.puzzle.entities.tesla-coil",
        "game.feature.puzzle.entities.wave-teleport",
        "game.feature.puzzle.puzzle-steps",
        "game.feature.puzzle.entities.rotate-blocker",
        "game.feature.puzzle.entities.boss-platform"
    )
    .defines(function () {
    window.wm && wm.postLoadModules.push("game.feature.puzzle.editors.puzzle-editors")
});
ig.baked = !0;
