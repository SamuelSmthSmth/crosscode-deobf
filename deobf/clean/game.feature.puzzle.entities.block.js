/**
 * game.feature.puzzle.entities.block
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.block")`.
 *
 * `ig.ENTITY.Block`: a simple solid block with a "normal" and "touched"
 * animation; touching it flashes the "touched" sprite for 0.2 seconds.
 */
ig.module("game.feature.puzzle.entities.block")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.Block = ig.AnimatedEntity.extend({
        tileSheet: new ig.TileSheet("media/entity/objects/block.png", 32, 32),
        timer: 0,
        style: 0,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                style: Number
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 16);
            if (settings.style) this.style = settings.style;
            this.initAnimations({
                sheet: this.tileSheet,
                SUB: [{
                        name: "normal",
                        time: 1,
                        frames: [0]
                    },
                    {
                        name: "touched",
                        time: 1,
                        frames: [1]
                    }
                ]
            })
        },

        update: function () {
            this.timer = this.timer - ig.system.tick;
            this.timer <= 0 && this.setCurrentAnim("normal");
            this.parent()
        },

        collideWith: function () {
            this.setCurrentAnim("touched");
            this.timer = 0.2
        }
    })
});
ig.baked = !0;
