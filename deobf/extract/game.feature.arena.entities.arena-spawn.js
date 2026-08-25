ig.module("game.feature.arena.entities.arena-spawn").requires("impact.base.entity").defines(function() {
    sc.ARENA_ALIGN_X = {
        CENTER: 0,
        LEFT: 1,
        RIGHT: 2
    };
    sc.ARENA_ALIGN_Y = {
        CENTER: 0,
        TOP: 1,
        BOTTOM: 2
    };
    ig.ENTITY.ArenaSpawn = ig.Entity.extend({
        text: "",
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                text: {
                    _type: "String",
                    _info: "Text to display in information.",
                    _large: true
                }
            },
            scalableX: true,
            scalableY: true,
            drawBox: true,
            label: function() {
                return "\n" + this.text
            },
            boxColor: "rgba(30, 30, 30, 0.5)",
            frontColor: "rgba(0, 0, 0, 0.5)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.size.z = 0;
            this.text = c.text || ""
        }
    })
});
ig.baked = !0;
