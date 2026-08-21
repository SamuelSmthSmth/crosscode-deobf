/**
 * impact.feature.map-content.entities.glowing-ground
 * ==================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.glowing-ground")`.
 *
 * A non-colliding rectangle whose color oscillates back and forth between
 * `color1` and `color2` over `duration` seconds.
 */
ig.module("impact.feature.map-content.entities.glowing-ground")
    .requires("impact.base.entity")
    .defines(function () {

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
            label: function () {
                return "";
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            settings.size || this.coll.setSize(32, 32, 0);
            this.color1 = settings.color1;
            this.color2 = settings.color2;
            this.duration = settings.duration ? settings.duration : 1;
            this.colorGfx = new ig.TransitionColor(this.color1, this.color2);
        },

        initSprites: function () {
            this.setSpriteCount(1);
        },

        update: function () {
            this.timer = this.timer + ig.system.tick;
            this.timer = this.timer % this.duration;
        },

        updateSprites: function () {
            var progress = this.timer / this.duration;
            this.colorGfx.setColorBWeight(progress < 0.5 ? progress * 2 : (1 - progress) * 2);
            var coll = this.coll;
            this.sprites[0].setPos(coll.pos.x, coll.pos.y, coll.pos.z);
            this.sprites[0].setSize(coll.size.x, coll.size.y, coll.size.z);
            this.sprites[0].setImageSrc(this.colorGfx, 0, 0);
        }
    });
});
ig.baked = !0;
