/**
 * impact.feature.light.entities.cond-light
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.light.entities.cond-light")`.
 *
 * `ig.ENTITY.ConditionalLight` — a static, non-colliding entity that registers
 * a light + optional glow with `ig.light`, gated behind a variable condition
 * (e.g. only visible during rain or a specific quest state). The glow colour
 * can come from the entity settings, from a weather definition, or default to
 * the global main glow colour.
 */
ig.module("impact.feature.light.entities.cond-light")
    .requires("impact.base.actor-entity", "impact.feature.weather.weather", "impact.feature.light.light")
    .defines(function () {

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

        /**
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {Object} settings - { condition, lightSize, glowSize, weather, glowColor }
         */
        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(8, 8, 0);
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);

            var condition = new ig.VarCondition(settings.condition),
                pos = Vec2.createC(
                    this.coll.pos.x + this.coll.size.x / 2,
                    this.coll.pos.y - this.coll.pos.z + this.coll.size.y / 2
                ),
                lightSize = ig.LIGHT_SIZE[settings.lightSize] || null,
                glowSize = ig.LIGHT_SIZE[settings.glowSize] || null;

            if (settings.glowColor) {
                this.glowColor = new ig.GlowColor(settings.glowColor);
            } else if (settings.weather) {
                var weatherColor = (settings = ig.WEATHER_TYPES[settings.weather]) && settings.glowColor;
                if (weatherColor) this.glowColor = new ig.GlowColor(weatherColor);
            }

            ig.light.addCondLight(condition, pos, lightSize, glowSize, this.glowColor);
        },

        onKill: function (settings) {
            this.glowColor && this.glowColor.decreaseRef();
            this.parent(settings);
        },

        update: function () {}
    });
});
ig.baked = !0;
