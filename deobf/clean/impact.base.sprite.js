/**
 * impact.base.sprite
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.sprite")`.
 *
 * `ig.CubeSprite` is a pooled draw descriptor for one entity's cube (position,
 * size, source rect, shadow, overlays, transform). `ig.SpritePool` recycles
 * instances. Sprites are filled from entity data each frame by the renderer.
 */
ig.module("impact.base.sprite").requires("impact.base.image").defines(function () {

    ig.CubeSprite = ig.Class.extend({
        pos: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 0, z: 0 },
        shadow: { x: 0, y: 0, z: 0, diameter: 0, scaleY: 1 },
        gfxOffset: { x: 0, y: 0 },
        gfxCut: { top: 0, bottom: 0, left: 0, right: 0 },
        tmpOffset: { x: 0, y: 0, z: 0 },
        wallY: 0,
        image: null,
        src: { x: 0, y: 0 },
        alpha: 1,
        flip: { x: false, y: false },
        scale: { x: 1, y: 1 },
        rotate: 0,
        pivot: { x: 0, y: 0 },
        overlay: { color: null, alpha: 0 },
        lighterOverlay: { color: null, alpha: 0 },
        aboveZ: 0,
        mergeTop: false,
        renderData: {},
        gui: false,
        renderMode: null,
        alwaysRender: false,
        noOverlapSolving: false,

        init: function (gui) {
            this.gui = gui;
        },

        clear: function (gui) {
            this.gui = gui;
            this.image = null;
            this.shadow.x = this.shadow.y = this.shadow.z = this.shadow.diameter = 0;
            this.shadow.type = ig.COLL_SHADOW_TYPE.DEFAULT;
            this.gfxOffset.x = this.gfxOffset.y = 0;
            this.wallY = this.tmpOffset.x = this.tmpOffset.y = this.tmpOffset.z = 0;
            this.src.x = this.src.y = 0;
            this.alpha = 1;
            this.flip.x = this.flip.y = false;
            this.scale.x = this.scale.y = 1;
            this.rotate = 0;
            this.pivot.x = this.pivot.y = 0;
            this.overlay.color = null;
            this.overlay.alpha = 0;
            this.lighterOverlay.color = null;
            this.lighterOverlay.alpha = 0;
            this.renderMode = null;
            this.mergeTop = false;
            this.gfxCut.top = this.gfxCut.bottom = 0;
            this.gfxCut.left = this.gfxCut.right = 0;
            this.noOverlapSolving = this.alwaysRender = false;
        },

        kill: function () {
            this.renderData = {};
            ig.spritePool.sprites.push(this);
        },

        setPos: function (x, y, z) {
            this.pos.x = x;
            this.pos.y = y;
            this.pos.z = z;
        },

        setGfxOffset: function (x, y) {
            this.gfxOffset.x = x;
            this.gfxOffset.y = y;
        },

        setGfxCut: function (top, bottom, left, right) {
            this.gfxCut.top = top || 0;
            this.gfxCut.bottom = bottom || 0;
            this.gfxCut.left = left || 0;
            this.gfxCut.right = right || 0;
        },

        setShadow: function (x, y, z, diameter, type, scaleY) {
            this.shadow.x = x;
            this.shadow.y = y;
            this.shadow.z = z;
            this.shadow.scaleY = scaleY || 1;
            this.shadow.diameter = diameter;
            this.shadow.type = type || ig.COLL_SHADOW_TYPE.DEFAULT;
        },

        setSize: function (x, y, z, wallY) {
            this.size.x = x;
            this.size.y = y;
            this.size.z = z;
            this.wallY = wallY || 0;
        },

        setImageSrc: function (image, srcX, srcY) {
            this.image = image;
            this.src.x = srcX || 0;
            this.src.y = srcY || 0;
        },

        setFlip: function (flipX, flipY) {
            this.flip.x = flipX || false;
            this.flip.y = flipY || false;
        },

        setPivot: function (x, y) {
            this.pivot.x = x;
            this.pivot.y = y;
        },

        setTransform: function (scaleX, scaleY, rotate) {
            this.scale.x = scaleX;
            this.scale.y = scaleY;
            this.rotate = rotate;
        },

        setAlpha: function (alpha) {
            this.alpha = alpha;
        },

        setOverlayColor: function (color, alpha) {
            this.overlay.color = color;
            this.overlay.alpha = alpha;
        },

        setLighterOverlayColor: function (color, alpha) {
            this.lighterOverlay.color = color;
            this.lighterOverlay.alpha = alpha;
        },

        setInvisible: function () {
            this.image = null;
            this.setShadow(0, 0, 0, 0);
        },

        /**
         * Derive the sprite's box size from an entity's collision box and the
         * animation's target height + shape type.
         * @param {Object} entity
         * @param {number} sizeX target width
         * @param {number} height target total height
         * @param {number} shapeType ig.ANIM_SHAPE_TYPE.*
         * @param {number} [wallYRatio]
         */
        setSizeFromEntity: function (entity, sizeX, height, shapeType, wallYRatio) {
            var coll = entity.coll;
            var collY = coll.size.y;
            var collZ = coll.size.z;
            this.mergeTop = false;

            if (shapeType == ig.ANIM_SHAPE_TYPE.Y_FLAT) {
                if (height < collZ) collZ = height;
                collY = height - collZ;
                this.mergeTop = true;
            } else if (shapeType == ig.ANIM_SHAPE_TYPE.Z_FLAT) {
                collY = height;
                collZ = 0;
            } else {
                var remaining = height - collY - collZ;
                if (remaining > 0) {
                    switch (shapeType) {
                        case ig.ANIM_SHAPE_TYPE.Z_EXPAND:
                            collZ = collZ + remaining;
                            break;
                        case ig.ANIM_SHAPE_TYPE.Y_EXPAND:
                            collY = collY + remaining;
                            break;
                        case ig.ANIM_SHAPE_TYPE.YZ_EXPAND:
                            collY = collY + Math.floor(remaining / 2);
                            collZ = collZ + Math.ceil(remaining / 2);
                    }
                } else if (remaining < 0) {
                    if (collY + remaining >= 0) collY = collY + remaining;
                    else {
                        collZ = collZ + (remaining + collY);
                        collY = 0;
                    }
                }
            }
            this.setSize(sizeX, collY, collZ, Math.round((wallYRatio || 0) * collY));
        },

        setImageSrcFromEntity: function (entity, sizeX, height, image, srcX, srcY) {
            if (this.size.y + this.size.z < height) srcY = srcY + (height - this.size.y - this.size.z);
            this.setImageSrc(image, srcX, srcY);
        },

        setShadowFromEntity: function (entity) {
            var coll = entity.coll;
            this.setShadow(
                coll.pos.x + coll.size.x / 2,
                coll.pos.y + coll.size.y / 2,
                coll.baseZPos,
                coll.shadow.size,
                coll.shadow.type,
                coll.shadow.scaleY
            );
        },

        /**
         * Derive the sprite's position from the entity's collision box.
         * @param {Object} entity
         * @param {Vec3} [offset]
         * @param {number} [_unused] present in the original signature, unused
         * @param {number} [alignY] 0 = top-aligned, 1 = bottom-aligned
         */
        setPosFromEntity: function (entity, offset, _unused, alignY) {
            var coll = entity.coll;
            var x = coll.pos.x - (this.size.x - coll.size.x) / 2;
            var y = coll.pos.y;
            var z = coll.pos.z;

            if (this.size.y < coll.size.y) {
                y = y + (coll.size.y - this.size.y);
            } else if (this.size.y > coll.size.y) {
                y = y - Math.round((1 - (alignY || 0)) * (this.size.y - coll.size.y));
            }

            if (offset) {
                x = x + offset.x;
                y = y + offset.y;
                z = z + offset.z;
            }
            this.setPos(x, y, z);
        },

        centerPivot: function (entity) {
            var offsetY = this.pos.y - this.size.z + this.pivot.y - entity.coll.pos.y;
            this.gfxOffset.x = this.gfxOffset.x - (this.pos.x + this.pivot.x - entity.coll.pos.x);
            this.gfxOffset.y = this.gfxOffset.y - offsetY;
        },

        /**
         * Fill the sprite with all defaults derived from an entity + animation.
         */
        setEntityDefault: function (entity, sizeX, height, shapeType, wallYRatio, offset, image, srcX, srcY) {
            shapeType = shapeType || ig.ANIM_SHAPE_TYPE.NO_EXPAND;
            this.setSizeFromEntity(entity, sizeX, height, shapeType, wallYRatio);
            this.setImageSrcFromEntity(entity, sizeX, height, image, srcX, srcY);
            this.setShadowFromEntity(entity);
            this.setPosFromEntity(entity, offset, shapeType, wallYRatio);
        },

        assign: function (other) {
            Vec3.assign(this.pos, other.pos);
            Vec3.assign(this.size, other.size);
            this.image = other.image;
            Vec3.assign(this.shadow, other.shadow);
            this.shadow.diameter = other.shadow.diameter;
            this.shadow.yScale = other.shadow.yScale;
            Vec2.assign(this.gfxOffset, other.gfxOffset);
            Vec3.assign(this.tmpOffset, other.tmpOffset);
            this.wallY = other.wallY;
            Vec2.assign(this.src, other.src);
            this.alpha = other.alpha;
            Vec2.assign(this.flip, other.flip);
            Vec2.assign(this.scale, other.scale);
            this.rotate = other.rotate;
            Vec2.assign(this.pivot, other.pivot);
            this.overlay.color = other.overlay.color;
            this.overlay.alpha = other.overlay.alpha;
            this.lighterOverlay.color = other.lighterOverlay.color;
            this.lighterOverlay.alpha = other.lighterOverlay.alpha;
            this.renderMode = other.renderMode;
            this.gfxCut.top = other.gfxCut.top;
            this.gfxCut.bottom = other.gfxCut.bottom;
            this.gfxCut.left = other.gfxCut.left;
            this.gfxCut.right = other.gfxCut.right;
            this.mergeTop = other.mergeTop;
        },
    });

    ig.SpritePool = ig.Class.extend({
        sprites: [],
        get: function (gui) {
            if (this.sprites.length) {
                var sprite = this.sprites.pop();
                sprite.clear(gui);
                return sprite;
            }
            return new ig.CubeSprite(gui);
        },
    });
    ig.spritePool = new ig.SpritePool();
});
