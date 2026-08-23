/**
 * game.feature.puzzle.entities.blockers
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.blockers")`.
 *
 * `ig.ENTITY.Blocker`: a variable-controlled barrier that toggles between
 * "on" and "off" animations and heights. Four diagonal slope variants
 * (diagonalNW/NE/SE/SW) are defined in `sc.BLOCKER_TYPE`.
 */
ig.module("game.feature.puzzle.entities.blockers")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    sc.BLOCKER_TYPE = {};

    ig.ENTITY.Blocker = ig.AnimatedEntity.extend({
        active: false,
        maxHeight: 0,
        minHeight: 0,
        variable: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                blockerType: {
                    _type: "String",
                    _info: "Type of blocking object",
                    _select: sc.BLOCKER_TYPE,
                    _withNull: true
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for blocker to be active",
                    _popup: true
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.condition = new ig.VarCondition(settings.condition);
            this.active = this.condition.evaluate();
            var type = sc.BLOCKER_TYPE[settings.blockerType];
            if (type) {
                this.setSize(type.size.x, type.size.y, type.size.z);
                this.coll.shape = type.collShape;
                this.minHeight = type.minHeight;
                this.maxHeight = this.coll.size.z;
                var puzzleStyle = ig.mapStyle.get("puzzle");
                type.anims.sheet.src = puzzleStyle.sheet;
                this.initAnimations(type.anims);
                if (this.active) {
                    this.setCurrentAnim("on");
                    this.setSize(this.coll.size.x, this.coll.size.y, this.maxHeight)
                } else {
                    this.setCurrentAnim("off");
                    this.setSize(this.coll.size.x, this.coll.size.y, this.minHeight)
                }
            } else this.coll.setSize(32, 32, 0)
        },

        update: function () {
            this.parent()
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            if (this.active != active)
                if (this.active = active) {
                    this.setSize(this.coll.size.x, this.coll.size.y, this.maxHeight);
                    this.setCurrentAnim("goOn", true, "on")
                } else this.setCurrentAnim("goOff", true, "off", false, true)
        },

        animationEnded: function () {
            this.setSize(this.coll.size.x, this.coll.size.y, this.minHeight)
        }
    });

    sc.BLOCKER_TYPE.diagonalNW = {
        size: {
            x: 32,
            y: 32,
            z: 24
        },
        collShape: ig.COLLSHAPE.SLOPE_NW,
        minHeight: 2,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 64,
                offY: 128
            },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "on",
                time: 0.02,
                frames: [5, 6],
                repeat: true
            }, {
                name: "goOn",
                time: 0.05,
                frames: [1, 2, 3, 4],
                repeat: false
            }, {
                name: "goOff",
                time: 0.05,
                frames: [4, 3, 2, 1],
                repeat: false
            }]
        }
    };

    sc.BLOCKER_TYPE.diagonalNE = {
        size: {
            x: 32,
            y: 32,
            z: 24
        },
        collShape: ig.COLLSHAPE.SLOPE_NE,
        minHeight: 2,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 64,
                offY: 128
            },
            flipX: true,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "on",
                time: 0.02,
                frames: [5, 6],
                repeat: true
            }, {
                name: "goOn",
                time: 0.05,
                frames: [1, 2, 3, 4],
                repeat: false
            }, {
                name: "goOff",
                time: 0.05,
                frames: [4, 3, 2, 1],
                repeat: false
            }]
        }
    };

    sc.BLOCKER_TYPE.diagonalSE = {
        size: {
            x: 32,
            y: 32,
            z: 24
        },
        collShape: ig.COLLSHAPE.SLOPE_SE,
        minHeight: 2,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 64,
                offY: 192
            },
            flipX: true,
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "on",
                time: 0.02,
                frames: [5, 6],
                repeat: true
            }, {
                name: "goOn",
                time: 0.05,
                frames: [1, 2, 3, 4],
                repeat: false
            }, {
                name: "goOff",
                time: 0.05,
                frames: [4, 3, 2, 1],
                repeat: false
            }]
        }
    };

    sc.BLOCKER_TYPE.diagonalSW = {
        size: {
            x: 32,
            y: 32,
            z: 24
        },
        collShape: ig.COLLSHAPE.SLOPE_SW,
        minHeight: 2,
        anims: {
            sheet: {
                src: "media/entity/objects/blockers.png",
                width: 32,
                height: 64,
                offY: 192
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "on",
                time: 0.02,
                frames: [5, 6],
                repeat: true
            }, {
                name: "goOn",
                time: 0.05,
                frames: [1, 2, 3, 4],
                repeat: false
            }, {
                name: "goOff",
                time: 0.05,
                frames: [4, 3, 2, 1],
                repeat: false
            }]
        }
    }
});
ig.baked = !0;