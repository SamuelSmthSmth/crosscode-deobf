/**
 * impact.feature.map-content.entities.hidden-block
 * ================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.hidden-block")`.
 *
 * A solid block that only appears when its spawn condition is met
 * (`ig.ENTITY.HiddenBlock`), and a variant that is only rendered during
 * gameplay (not in the editor), `ig.ENTITY.HiddenSkyBlock`.
 */
ig.module("impact.feature.map-content.entities.hidden-block")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.HiddenBlock = ig.Entity.extend({
        terrain: 0,

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                shape: {
                    _type: "String",
                    _info: "XY-Shape of Block Entity",
                    _select: ig.COLLSHAPE
                },
                heightShape: {
                    _type: "String",
                    _info: "Height-Shape of Block Entity",
                    _select: ig.COLL_HEIGHT_SHAPE
                },
                zHeight: {
                    _type: "Number"
                },
                terrain: {
                    _type: "String",
                    _info: "Terrain of prop",
                    _select: ig.TERRAIN,
                    _withNull: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                collType: {
                    _type: "String",
                    _info: "Default is BLOCK",
                    _optional: true,
                    _select: ig.COLLTYPE
                },
                blockNavMap: {
                    _type: "Boolean",
                    __info: "If true, block path map and update when destroyed",
                    _optional: true
                }
            },
            label: function () {
                return "";
            },
            drawBox: true,
            scalableX: true,
            scalableY: true,
            boxColor: "rgba(0,255,255, 0.5)",
            frontColor: "rgba(0,120,120, 0.8)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE[settings.collType] || ig.COLLTYPE.BLOCK;
            settings.size || this.coll.setSize(32, 32, 0);
            this.coll.shape = ig.COLLSHAPE[settings.shape || "RECTANGLE"];
            this.coll.heightShape = ig.COLL_HEIGHT_SHAPE[settings.heightShape] || 0;
            this.terrain = ig.TERRAIN[settings.terrain] || null;
            this.coll.size.z = settings.zHeight || 0;
            this.blockNavMap = settings.blockNavMap;
        },

        show: function (value) {
            this.parent(value);
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
        },

        onHideRequest: function () {
            if (this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null;
            }
            this.hide();
        }
    });

    ig.ENTITY.HiddenSkyBlock = ig.Entity.extend({
        terrain: 0,

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                shape: {
                    _type: "String",
                    _info: "XY-Shape of Block Entity",
                    _select: ig.COLLSHAPE
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                collType: {
                    _type: "String",
                    _info: "Default is BLOCK",
                    _select: ig.COLLTYPE,
                    _default: "NPBLOCK"
                }
            },
            label: function () {
                return "";
            },
            drawBox: true,
            scalableX: true,
            scalableY: true,
            boxColor: "rgba(0,255,255, 0.9)",
            frontColor: "rgba(0,120,120, 0.8)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE[settings.collType] || ig.COLLTYPE.BLOCK;
            this.coll.shape = ig.COLLSHAPE[settings.shape || "RECTANGLE"];
            settings.size || this.coll.setSize(32, 32, 0);
            if (!window.wm) {
                // In-game only: reach far above the level so it blocks air jumps.
                this.coll.pos.z = this.coll.pos.z - 1E3;
                this.coll.size.z = 2E3;
            }
        }
    });
});
ig.baked = !0;
