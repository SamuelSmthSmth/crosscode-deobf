ig.module("impact.feature.light.entities.cond-light").requires("impact.base.actor-entity", "impact.feature.weather.weather", "impact.feature.light.light").defines(function() {
    ig.ENTITY.ConditionalLight = ig.Entity.extend({
        glowColor: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for light to appear"
                },
                lightSize: {
                    _type: "String",
                    _info: "If defined: reduce shadow with provided size",
                    _select: ig.LIGHT_SIZE,
                    _withNull: true
                },
                glowSize: {
                    _type: "String",
                    _info: "If defined: glow with provided size",
                    _select: ig.LIGHT_SIZE,
                    _withNull: true
                },
                weather: {
                    _type: "String",
                    _info: "If defined, take glow color from weather definition",
                    _select: ig.WEATHER_TYPES,
                    _withNull: true
                },
                glowColor: {
                    _type: "String",
                    _info: "Override glow color (ignores weather color)",
                    _optional: true
                }
            },
            drawBox: true,
            boxColor: "rgba(255,255,125, 0.8)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(8, 8, 0);
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            var b = new ig.VarCondition(c.condition),
                a =
                Vec2.createC(this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y - this.coll.pos.z + this.coll.size.y / 2),
                d = ig.LIGHT_SIZE[c.lightSize] || null,
                e = ig.LIGHT_SIZE[c.glowSize] || null;
            if (c.glowColor) this.glowColor = new ig.GlowColor(c.glowColor);
            else if (c.weather)
                if (c = (c = ig.WEATHER_TYPES[c.weather]) && c.glowColor) this.glowColor = new ig.GlowColor(c);
            ig.light.addCondLight(b, a, d, e, this.glowColor)
        },
        onKill: function(b) {
            this.glowColor && this.glowColor.decreaseRef();
            this.parent(b)
        },
        update: function() {}
    })
});
ig.baked = !0;
