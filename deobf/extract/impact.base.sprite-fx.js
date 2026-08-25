ig.module("impact.base.sprite-fx").requires("impact.base.image").defines(function() {
    ig.SpriteEffectBase = ig.Class.extend({
        delay: 0,
        duration: 0,
        init: function(b) {
            this.delay = b.delay || 0;
            this.duration = b.duration || 0
        },
        updateSprite: function(b, a, d) {
            a < this.delay || this.apply(b, (a - this.delay) / (this.duration || d))
        },
        apply: function() {}
    });
    ig.SPRITE_FX = {};
    ig.SPRITE_FX.SLIDE = ig.SpriteEffectBase.extend({
        dir: null,
        start: 0,
        end: 0,
        keySpline: null,
        init: function(b) {
            this.parent(b);
            this.dir = ig.ActorEntity.FACE4[b.dir];
            if (this.dir ==
                void 0) this.dir = ig.ActorEntity.FACE4.EAST;
            this.start = b.start || 0;
            this.end = b.end || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || KEY_SPLINES.EASE_IN_OUT
        },
        apply: function(b, a) {
            var a = Math.min(a, 1),
                a = this.keySpline.get(a),
                d = (1 - a) * this.start + a * this.end;
            if (this.dir == ig.ActorEntity.FACE4.EAST) {
                d = Math.round(b.size.x * d);
                b.size.x = b.size.x - d;
                b.pos.x = b.pos.x + d
            } else if (this.dir == ig.ActorEntity.FACE4.WEST) {
                d = Math.round(b.size.x * d);
                b.size.x = b.size.x - d;
                b.src.x = b.src.x + d
            } else if (this.dir == ig.ActorEntity.FACE4.SOUTH) {
                d =
                    Math.round((b.size.y + b.size.z) * d);
                if (b.size.y >= d) {
                    b.size.y = b.size.y - d;
                    b.pos.y = b.pos.y + d
                } else {
                    d = d - b.size.y;
                    b.pos.y = b.pos.y - b.size.y;
                    b.size.y = 0;
                    b.size.z = b.size.z - d
                }
            } else if (this.dir == ig.ActorEntity.FACE4.NORTH) {
                d = Math.round((b.size.y + b.size.z) * d);
                b.src.y = b.src.y + d;
                if (b.size.y >= d) b.size.y = b.size.y - d;
                else {
                    d = d - b.size.y;
                    b.size.y = 0;
                    b.size.z = b.size.z - d;
                    b.pos.z = b.pos.z + d
                }
            }
        }
    });
    ig.SPRITE_FX.MOVE_XYZ = ig.SpriteEffectBase.extend({
        offset: null,
        start: 0,
        end: 0,
        keySpline: null,
        init: function(b) {
            this.parent(b);
            this.offset =
                b.offset;
            this.start = b.start || 0;
            this.end = b.end || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || KEY_SPLINES.EASE_IN_OUT
        },
        apply: function(b, a) {
            a = Math.min(a, 1);
            a = this.keySpline.get(a);
            Vec3.addMulF(b.pos, this.offset, (1 - a) * this.start + a * this.end)
        }
    })
});
ig.baked = !0;
