ig.module("impact.feature.map-content.entities.glowing-ground").requires("impact.base.entity").defines(function() {
    ig.ENTITY.GlowingGround = ig.Entity.extend({
        color1: "",
        color2: "",
        duration: 1,
        timer: 0,
        colorGfx: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                color1: {
                    _type: "String",
                    _info: "First color of interpolation"
                },
                color2: {
                    _type: "String",
                    _info: "Second color of interpolation"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of color interpolation (back and forth)"
                }
            },
            scalableX: true,
            scalableY: true,
            label: function() {
                return ""
            }
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            c.size || this.coll.setSize(32, 32, 0);
            this.color1 = c.color1;
            this.color2 = c.color2;
            this.duration = c.duration ? c.duration : 1;
            this.colorGfx = new ig.TransitionColor(this.color1, this.color2)
        },
        initSprites: function() {
            this.setSpriteCount(1)
        },
        update: function() {
            this.timer = this.timer + ig.system.tick;
            this.timer = this.timer % this.duration
        },
        updateSprites: function() {
            var b = this.timer / this.duration;
            this.colorGfx.setColorBWeight(b < 0.5 ? b * 2 : (1 - b) * 2);
            b = this.coll;
            this.sprites[0].setPos(b.pos.x, b.pos.y, b.pos.z);
            this.sprites[0].setSize(b.size.x, b.size.y, b.size.z);
            this.sprites[0].setImageSrc(this.colorGfx, 0, 0)
        }
    })
});
ig.baked = !0;
