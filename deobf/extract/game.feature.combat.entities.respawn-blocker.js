ig.module("game.feature.combat.entities.respawn-blocker").requires("impact.base.entity").defines(function() {
    ig.ENTITY.RespawnBlocker = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {},
            label: function() {
                return "RespawnBlocker"
            },
            scalableX: true,
            scalableY: true,
            drawBox: true,
            boxColor: "rgba(0,255,255, 0.3)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            c.size || this.coll.setSize(32, 32, 0);
            sc.combat.addRespawnBlocker(this)
        }
    })
});
ig.baked = !0;
