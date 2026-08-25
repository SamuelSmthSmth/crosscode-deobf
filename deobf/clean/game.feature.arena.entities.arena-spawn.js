/**
 * @module game.feature.arena.entities.arena-spawn
 *
 * ArenaSpawn entity placed in maps to mark enemy spawn positions for
 * arena rounds. Supports alignment configuration (left/center/right,
 * top/center/bottom) per spawn point. Rendered as a labeled box in
 * the Weltmeister editor.
 */
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.size.z = 0;
            this.text = settings.text || ""
        }
    })
});
ig.baked = !0;