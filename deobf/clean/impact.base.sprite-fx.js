/**
 * impact.base.sprite-fx
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.sprite-fx")`.
 *
 * Sprite effects applied over time to an animation frame. Registered in
 * `ig.SPRITE_FX`. Two built-ins: `SLIDE` (slides a face of the sprite's box) and
 * `MOVE_XYZ` (translates the sprite's position).
 */
ig.module("impact.base.sprite-fx").requires("impact.base.image").defines(function () {

    ig.SpriteEffectBase = ig.Class.extend({
        delay: 0,
        duration: 0,

        init: function (settings) {
            this.delay = settings.delay || 0;
            this.duration = settings.duration || 0;
        },

        /**
         * @param {Object} sprite the sprite being affected
         * @param {number} time elapsed since the animation started
         * @param {number} fallbackDuration used if no explicit duration was set
         */
        updateSprite: function (sprite, time, fallbackDuration) {
            if (time < this.delay) return;
            this.apply(sprite, (time - this.delay) / (this.duration || fallbackDuration));
        },

        apply: function () {},
    });

    ig.SPRITE_FX = {};

    /** Slides one face of the sprite's box, revealing/covering it. */
    ig.SPRITE_FX.SLIDE = ig.SpriteEffectBase.extend({
        dir: null,
        start: 0,
        end: 0,
        keySpline: null,

        init: function (settings) {
            this.parent(settings);
            this.dir = ig.ActorEntity.FACE4[settings.dir];
            if (this.dir == undefined) this.dir = ig.ActorEntity.FACE4.EAST;
            this.start = settings.start || 0;
            this.end = settings.end || 0;
            this.keySpline = KEY_SPLINES[settings.keySpline] || KEY_SPLINES.EASE_IN_OUT;
        },

        apply: function (sprite, weight) {
            weight = Math.min(weight, 1);
            weight = this.keySpline.get(weight);
            var slideAmount = (1 - weight) * this.start + weight * this.end;

            if (this.dir == ig.ActorEntity.FACE4.EAST) {
                slideAmount = Math.round(sprite.size.x * slideAmount);
                sprite.size.x = sprite.size.x - slideAmount;
                sprite.pos.x = sprite.pos.x + slideAmount;
            } else if (this.dir == ig.ActorEntity.FACE4.WEST) {
                slideAmount = Math.round(sprite.size.x * slideAmount);
                sprite.size.x = sprite.size.x - slideAmount;
                sprite.src.x = sprite.src.x + slideAmount;
            } else if (this.dir == ig.ActorEntity.FACE4.SOUTH) {
                slideAmount = Math.round((sprite.size.y + sprite.size.z) * slideAmount);
                if (sprite.size.y >= slideAmount) {
                    sprite.size.y = sprite.size.y - slideAmount;
                    sprite.pos.y = sprite.pos.y + slideAmount;
                } else {
                    slideAmount = slideAmount - sprite.size.y;
                    sprite.pos.y = sprite.pos.y - sprite.size.y;
                    sprite.size.y = 0;
                    sprite.size.z = sprite.size.z - slideAmount;
                }
            } else if (this.dir == ig.ActorEntity.FACE4.NORTH) {
                slideAmount = Math.round((sprite.size.y + sprite.size.z) * slideAmount);
                sprite.src.y = sprite.src.y + slideAmount;
                if (sprite.size.y >= slideAmount) {
                    sprite.size.y = sprite.size.y - slideAmount;
                } else {
                    slideAmount = slideAmount - sprite.size.y;
                    sprite.size.y = 0;
                    sprite.size.z = sprite.size.z - slideAmount;
                    sprite.pos.z = sprite.pos.z + slideAmount;
                }
            }
        },
    });

    /** Moves the sprite's position along an offset vector over time. */
    ig.SPRITE_FX.MOVE_XYZ = ig.SpriteEffectBase.extend({
        offset: null,
        start: 0,
        end: 0,
        keySpline: null,

        init: function (settings) {
            this.parent(settings);
            this.offset = settings.offset;
            this.start = settings.start || 0;
            this.end = settings.end || 0;
            this.keySpline = KEY_SPLINES[settings.keySpline] || KEY_SPLINES.EASE_IN_OUT;
        },

        apply: function (sprite, weight) {
            weight = Math.min(weight, 1);
            weight = this.keySpline.get(weight);
            Vec3.addMulF(sprite.pos, this.offset, (1 - weight) * this.start + weight * this.end);
        },
    });
});
