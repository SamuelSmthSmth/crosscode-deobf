/**
 * game.feature.combat.entities.respawn-blocker
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.respawn-blocker")`.
 *
 * `ig.ENTITY.RespawnBlocker`: an invisible map entity that, when placed in a
 * level, registers itself with `sc.combat` so enemies inside its area won't
 * respawn.
 */
ig.module("game.feature.combat.entities.respawn-blocker")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.RespawnBlocker = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {},
            label: function () {
                return "RespawnBlocker"
            },
            scalableX: true,
            scalableY: true,
            drawBox: true,
            boxColor: "rgba(0,255,255, 0.3)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            settings.size || this.coll.setSize(32, 32, 0);
            sc.combat.addRespawnBlocker(this)
        }
    })
});
ig.baked = !0;
