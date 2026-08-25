ig.module("impact.feature.map-image.map-image").requires("impact.base.game", "game.config", "impact.base.entity").defines(function() {
    ig.MapImageManager = ig.GameAddon.extend({
        images: {},
        init: function() {
            this.parent("MapImage")
        },
        showMapImage: function(a, b) {
            this.removeMapImage(a);
            var c = ig.game.spawnEntity(ig.MapImageEntity, 0, 0, 0, b);
            this.images[a] = c
        },
        removeMapImage: function(a) {
            var b = this.images[a];
            delete this.images[a];
            b && b.remove()
        }
    });
    ig.addGameAddon(function() {
        return ig.mapImage = new ig.MapImageManager
    });
    var b = Vec3.create();
    ig.MapImageEntity = ig.AnimatedEntity.extend({
        img: null,
        _wm: new ig.Config({
            spawnable: false
        }),
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.NONE;
            this.tileSheet = e.tileSheet;
            this.guiSprite = e.guiSprite;
            this.wallY = 0;
            e.size ? this.coll.setSize(e.size.x, e.size.y, e.size.z) : this.coll.setSize(this.tileSheet.width, 0, this.tileSheet.height);
            a = ig.Event.getVec3(e.position, b);
            this.coll.setPos(a.x - this.coll.size.x / 2, a.y - this.coll.size.y / 2, a.z)
        },
        remove: function() {
            this.kill()
        },
        initSprites: function() {
            this.setSpriteCount(1, this.guiSprite);
            this.sprites[0].setEntityDefault(this, this.tileSheet.width, this.tileSheet.height, "NO_EXPAND", this.wallY, null, this.tileSheet.image, this.tileSheet.offX, this.tileSheet.offY)
        },
        updateSprites: function() {
            this.sprites[0].setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this)
        }
    })
});
ig.baked = !0;
