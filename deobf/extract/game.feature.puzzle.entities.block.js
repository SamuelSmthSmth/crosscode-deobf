ig.module("game.feature.puzzle.entities.block").requires("impact.base.entity").defines(function() {
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
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 16);
            if (c.style) this.style = c.style;
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
        update: function() {
            this.timer = this.timer - ig.system.tick;
            this.timer <= 0 && this.setCurrentAnim("normal");
            this.parent()
        },
        collideWith: function() {
            this.setCurrentAnim("touched");
            this.timer = 0.2
        }
    })
});
ig.baked = !0;
