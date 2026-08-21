/**
 * impact.feature.map-image.map-image-steps
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-image.map-image-steps")`.
 *
 * Event steps to show and remove named map images.
 */
ig.module("impact.feature.map-image.map-image-steps")
    .requires("impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.SHOW_MAP_IMAGE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of image"
                },
                tileSheet: {
                    _type: "TileSheet",
                    _info: "Image to be displayed",
                    _popup: true
                },
                position: {
                    _type: "Vec3",
                    _info: "Point where to spawn image",
                    _visualize: true,
                    _pointSelect: true
                },
                guiSprite: {
                    _type: "Boolean",
                    _info: "If true: Show sprite as GUI Sprite"
                },
                size: {
                    _type: "Offset",
                    _info: "Optional: Size of entity. If not specified will match image dimensions to x and z size, y always 0",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.name = settings.name;
            this.settings = ig.copy(settings);
            delete this.settings.name;
            this.settings.tileSheet = new ig.TileSheet.createFromJson(settings.tileSheet);
        },

        start: function () {
            ig.mapImage.showMapImage(this.name, this.settings);
        },

        clearCached: function () {
            this.settings.tileSheet.clearCached();
        }
    });

    ig.EVENT_STEP.REMOVE_MAP_IMAGE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of image"
                }
            }
        }),

        init: function (settings) {
            this.name = settings.name;
        },

        start: function () {
            ig.mapImage.removeMapImage(this.name);
        }
    });
});
ig.baked = !0;
