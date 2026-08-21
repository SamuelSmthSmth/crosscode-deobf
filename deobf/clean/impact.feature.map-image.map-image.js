/**
 * impact.feature.map-image.map-image
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-image.map-image")`.
 *
 * `ig.mapImage` add-on: spawns named `ig.MapImageEntity` instances (tilesheet
 * images placed in the level) so event steps can show/remove them by name.
 */
ig.module("impact.feature.map-image.map-image")
    .requires("impact.base.game", "game.config", "impact.base.entity")
    .defines(function () {

    ig.MapImageManager = ig.GameAddon.extend({
        images: {},

        init: function () {
            this.parent("MapImage");
        },

        showMapImage: function (name, settings) {
            this.removeMapImage(name);
            var entity = ig.game.spawnEntity(ig.MapImageEntity, 0, 0, 0, settings);
            this.images[name] = entity;
        },

        removeMapImage: function (name) {
            var entity = this.images[name];
            delete this.images[name];
            entity && entity.remove();
        }
    });

    ig.addGameAddon(function () {
        return ig.mapImage = new ig.MapImageManager();
    });

    var scratchVec3 = Vec3.create();

    /** A non-colliding image placed in the level (shown as GUI sprite or tile). */
    ig.MapImageEntity = ig.AnimatedEntity.extend({
        img: null,

        _wm: new ig.Config({
            spawnable: false
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.tileSheet = settings.tileSheet;
            this.guiSprite = settings.guiSprite;
            this.wallY = 0;
            settings.size ? this.coll.setSize(settings.size.x, settings.size.y, settings.size.z) :
                this.coll.setSize(this.tileSheet.width, 0, this.tileSheet.height);
            var pos = ig.Event.getVec3(settings.position, scratchVec3);
            this.coll.setPos(pos.x - this.coll.size.x / 2, pos.y - this.coll.size.y / 2, pos.z);
        },

        remove: function () {
            this.kill();
        },

        initSprites: function () {
            this.setSpriteCount(1, this.guiSprite);
            this.sprites[0].setEntityDefault(this, this.tileSheet.width, this.tileSheet.height, "NO_EXPAND", this.wallY, null, this.tileSheet.image, this.tileSheet.offX, this.tileSheet.offY);
        },

        updateSprites: function () {
            this.sprites[0].setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this);
        }
    });
});
ig.baked = !0;
