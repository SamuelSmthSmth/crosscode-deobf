ig.module("impact.feature.map-content.entities.hidden-block").requires("impact.base.entity").defines(function() {
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
            label: function() {
                return ""
            },
            drawBox: true,
            scalableX: true,
            scalableY: true,
            boxColor: "rgba(0,255,255, 0.5)",
            frontColor: "rgba(0,120,120, 0.8)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE[c.collType] || ig.COLLTYPE.BLOCK;
            c.size || this.coll.setSize(32,
                32, 0);
            this.coll.shape = ig.COLLSHAPE[c.shape || "RECTANGLE"];
            this.coll.heightShape = ig.COLL_HEIGHT_SHAPE[c.heightShape] || 0;
            this.terrain = ig.TERRAIN[c.terrain] || null;
            this.coll.size.z = c.zHeight || 0;
            this.blockNavMap = c.blockNavMap
        },
        show: function(b) {
            this.parent(b);
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this)
        },
        onHideRequest: function() {
            if (this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null
            }
            this.hide()
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
            label: function() {
                return ""
            },
            drawBox: true,
            scalableX: true,
            scalableY: true,
            boxColor: "rgba(0,255,255, 0.9)",
            frontColor: "rgba(0,120,120, 0.8)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE[c.collType] || ig.COLLTYPE.BLOCK;
            this.coll.shape = ig.COLLSHAPE[c.shape || "RECTANGLE"];
            c.size || this.coll.setSize(32, 32, 0);
            if (!window.wm) {
                this.coll.pos.z = this.coll.pos.z - 1E3;
                this.coll.size.z = 2E3
            }
        }
    })
});
ig.baked = !0;
