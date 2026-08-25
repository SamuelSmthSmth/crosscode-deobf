ig.module("game.feature.puzzle.entities.glowing-line").requires("impact.base.entity").defines(function() {
    ig.ENTITY.GlowingLine = ig.Entity.extend({
        patterns: null,
        timer: 0,
        glowing: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition on which the line will glow"
                }
            },
            scalableX: true,
            scalableY: true,
            scalableStep: 16,
            label: function() {
                return ""
            }
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.time.globalStatic = true;
            c.size || this.coll.setSize(8,
                8, 0);
            b = ig.mapStyle.get("puzzle");
            this.patterns = new ig.ImagePatternSheet(b.sheet, ig.ImagePattern.OPT.REPEAT_X_OR_Y, 16, 16, 176, 80, 4, 1);
            this.condition = new ig.VarCondition(c.condition);
            this.glowing = this.condition.evaluate()
        },
        initSprites: function() {
            this.setSpriteCount(1)
        },
        update: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        },
        updateSprites: function() {
            var b = this.glowing ? 3 : 0;
            this.timer > 0 && (b = b - Math.min(2, Math.floor(this.timer / 0.05)));
            var a = this.coll,
                d = this.sprites[0];
            d.setPos(a.pos.x, a.pos.y,
                a.pos.z);
            d.setSize(a.size.x, a.size.y, a.size.z);
            d.setImageSrc(this.patterns.getPattern(b), 0, 0)
        },
        varsChanged: function() {
            var b = this.condition && this.condition.evaluate();
            if (b && !this.glowing) {
                this.glowing = true;
                this.timer = 0.25
            } else if (!b && this.glowing) {
                this.glowing = false;
                this.timer = 0
            }
        }
    })
});
ig.baked = !0;
