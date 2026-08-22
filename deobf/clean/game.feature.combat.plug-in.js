/**
 * game.feature.combat.plug-in
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.plug-in")`.
 *
 * Combat subsystem entry point: requires every combat module and, in the
 * editor (window.wm), registers the combat editors and step color rules.
 */
ig.module("game.feature.combat.plug-in")
    .requires("game.feature.combat.combat", "game.feature.combat.pvp", "game.feature.combat.combat-shield", "game.feature.combat.combat-force", "game.feature.combat.combat-stun", "game.feature.combat.combat-assault", "game.feature.combat.combat-poi", "game.feature.combat.combat-charge", "game.feature.combat.combat-sweep", "game.feature.combat.stat-change", "game.feature.combat.entities.combatant-marble", "game.feature.combat.entities.ball", "game.feature.combat.entities.combatant",
        "game.feature.combat.entities.food-icon", "game.feature.combat.entities.drop", "game.feature.combat.entities.item-drop", "game.feature.combat.entities.enemy", "game.feature.combat.entities.enemy-spawner", "game.feature.combat.entities.respawn-blocker", "game.feature.combat.entities.hit-number", "game.feature.combat.entities.burst-spawner", "game.feature.combat.entities.stone", "game.feature.combat.gui.status-bar", "game.feature.combat.gui.pvp-gui", "game.feature.combat.gui.hp-bar-boss", "game.feature.combat.gui.enemy-display-gui",
        "game.feature.combat.model.combat-condition", "game.feature.combat.model.combat-params", "game.feature.combat.model.combat-status", "game.feature.combat.model.enemy-type", "game.feature.combat.model.enemy-reaction", "game.feature.combat.model.enemy-collab", "game.feature.combat.model.enemy-level-scaling", "game.feature.combat.model.enemy-tracker", "game.feature.combat.model.enemy-booster", "game.feature.combat.combat-action-steps", "game.feature.combat.combat-event-steps", "game.feature.combat.enemy-steps",
        "game.feature.combat.stat-change")
    .defines(function () {

    if (window.wm) {
        wm.postLoadModules.push("game.feature.combat.editors.enemy-editor");
        wm.postLoadModules.push("game.feature.combat.editors.combat-condition-edit");
        wm.postLoadModules.push("game.feature.combat.editors.enemy-choice-edit");
        wm.postLoadModules.push("game.feature.combat.editors.combat-edit");
        wm.postLoadModules.push("game.feature.combat.editors.pvp-edit");
        wm.postLoadModules.push("game.feature.combat.editors.proxy-edit");
        wm.addStepColorRule(/DIRECT_HIT/, "red");
        wm.addStepColorRule(/CIRCLE_ATTACK/, "red");
        wm.addStepColorRule(/TACKLE/, "red");
        wm.addStepColorRule(/COMBAT/, "violet");
        wm.addStepColorRule(/ANNOTATION/, "orange")
    }
});
ig.baked = !0;
