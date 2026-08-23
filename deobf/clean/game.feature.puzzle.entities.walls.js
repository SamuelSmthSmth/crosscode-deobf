/**
 * game.feature.puzzle.entities.walls
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.walls")`.
 *
 * Variable walls: `ig.ENTITY.WallBase` is the base class gated by a
 * `VarCondition`. `WallHorizontal` / `WallVertical` render tiled barrier
 * lines with optional end caps (STOP/CORNER_LEFT/CORNER_RIGHT).
 * `ig.ENTITY.WallBlocker` is the colour-animated barrier segment: it
 * raises/lowers with a glow effect and supports three collision types
 * (BLOCK/block+projectile, PBLOCK/push-pull only, NPBLOCK/ignore projectiles).
 */
ig.module("game.feature.puzzle.entities.walls")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    sc.WALL_COLL_TYPES = {
        BLOCK: 0,
        PBLOCK: 1,
        NPBLOCK: 2
    };

    sc.WALL_HORIZONTAL_ENDS = {
        CONTINUE: 0,
        STOP: 1
    };

    sc.WALL_VERTICAL_ENDS = {
        CONTINUE: 0,
        STOP: 1,
        CORNER_LEFT: 2,
        CORNER_RIGHT: 3
    };

    ig.ENTITY.WallBase = ig.Entity.extend({
        condition: null,
        active: false,
        wallCollType: 0,
        wallZHeight: 0,
        wallBlockers: [],
        skipRender: false,
        noNavMapBlock: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.size.z = 1;
            if (!settings.size) {
                this.coll.size.x = 8;
                this.coll.size.y = 8
            }
            this.noNavMapBlock = settings.noNavMapBlock || false;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic = true;
            this.wallCollType = settings.collType || "BLOCK";
            this.wallZHeight = settings.wallZHeight || 32;
            this.condition = new ig.VarCondition(settings.condition);
            this.skipRender = settings.skipRender || false;
            this.active = this.condition.evaluate()
        },

        onKill: function (parent) {
            this.parent(parent)
        },

        updateWallBlockers: function (instant) {
            for (var i = 0; i < this.wallBlockers.length; ++i) this.wallBlockers[i].setActive(this.active, instant)
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            if (this.active != active) {
                this.active = active;
                this.updateWallBlockers()
            }
        }
    });

    var tileScratch = {};

    ig.ENTITY.WallHorizontal = ig.ENTITY.WallBase.extend({
        gfx: null,
        patterns: null,
        leftEnd: 0,
        rightEnd: 0,
        _wm: new ig.Config({
            spawnable: true,
            scalableX: true,
            attributes: {
                skipRender: {
                    _type: "Boolean",
                    _info: "True if the wall should be invisible",
                    _default: false
                },
                leftEnd: {
                    _type: "String",
                    _info: "Left End Type",
                    _select: sc.WALL_HORIZONTAL_ENDS
                },
                rightEnd: {
                    _type: "String",
                    _info: "Right End Type",
                    _select: sc.WALL_HORIZONTAL_ENDS
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for wall to be active",
                    _popup: true
                },
                collType: {
                    _type: "String",
                    _info: "Collision Types of Wall. BLOCK - Blocks all, PBLOCK - Blocks only projectiles, NPBLOCK - Blocks only non projectiles",
                    _select: sc.WALL_COLL_TYPES
                },
                wallZHeight: {
                    _type: "Number",
                    _info: "Total height of the wall, when active",
                    _default: 32
                },
                noNavMapBlock: {
                    _type: "Boolean",
                    _info: "If true: do not block nav map"
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.gfx = new ig.Image(puzzleStyle.sheet);
            this.patterns = new ig.ImagePatternSheet(puzzleStyle.sheet, ig.ImagePattern.OPT.REPEAT_X, 8, 16, 176, 64, 1, 1);
            this.leftEnd = sc.WALL_HORIZONTAL_ENDS[settings.leftEnd] || sc.WALL_HORIZONTAL_ENDS.CONTINUE;
            this.rightEnd = sc.WALL_HORIZONTAL_ENDS[settings.rightEnd] || sc.WALL_HORIZONTAL_ENDS.CONTINUE
        },

        show: function (show) {
            this.parent(show);
            this.wallBlockers.push(ig.game.spawnEntity("WallBlocker", this.coll.pos.x, this.coll.pos.y, this.coll.pos.z + this.coll.size.z, {
                size: {
                    x: this.coll.size.x - 0 - 0,
                    y: 8,
                    z: this.wallZHeight
                },
                collType: this.wallCollType,
                skipRender: this.skipRender,
                noNavMapBlock: this.noNavMapBlock
            }));
            this.updateWallBlockers(true)
        },

        initSprites: function () {
            this.setSpriteCount(1 + (this.leftEnd ? 1 : 0) + (this.rightEnd ? 1 : 0))
        },

        update: function () {
            this.parent()
        },

        updateSprites: function () {
            if (!this.skipRender) {
                var coll = this.coll,
                    leftPad = this.leftEnd ? 8 : 0,
                    midWidth = coll.size.x - (this.leftEnd ? 8 : 0) - (this.rightEnd ? 8 : 0),
                    spriteIndex = 0;
                if (midWidth > 0) {
                    this.sprites[spriteIndex].setPos(coll.pos.x + leftPad, coll.pos.y, coll.pos.z);
                    this.sprites[spriteIndex].setSize(midWidth, coll.size.y, coll.size.z, coll.size.y);
                    this.sprites[spriteIndex].setImageSrc(this.patterns.getPattern(0), 0, 0);
                    spriteIndex++
                }
                if (this.leftEnd) {
                    this.sprites[spriteIndex].setPos(coll.pos.x, coll.pos.y, coll.pos.z);
                    this.sprites[spriteIndex].setSize(8, coll.size.y, coll.size.z, coll.size.y);
                    var tile = this.gfx.getTileSrc(tileScratch, 2, 8, 16, 176, 64);
                    this.sprites[spriteIndex].setImageSrc(this.gfx, tile.x, tile.y);
                    spriteIndex++
                }
                if (this.rightEnd) {
                    this.sprites[spriteIndex].setPos(coll.pos.x + midWidth + leftPad, coll.pos.y, coll.pos.z);
                    this.sprites[spriteIndex].setSize(8, coll.size.y, coll.size.z, coll.size.y);
                    tile = this.gfx.getTileSrc(tileScratch, 3, 8, 16, 176, 64);
                    this.sprites[spriteIndex].setImageSrc(this.gfx, tile.x, tile.y)
                }
            }
        }
    });

    ig.ENTITY.WallVertical = ig.ENTITY.WallBase.extend({
        gfx: null,
        patterns: null,
        topEnd: 0,
        bottomEnd: 0,
        _wm: new ig.Config({
            spawnable: true,
            scalableY: true,
            attributes: {
                skipRender: {
                    _type: "Boolean",
                    _info: "True if the wall should be invisible",
                    _default: false
                },
                topEnd: {
                    _type: "String",
                    _info: "Top End Type",
                    _select: sc.WALL_VERTICAL_ENDS
                },
                bottomEnd: {
                    _type: "String",
                    _info: "Bottom End Type",
                    _select: sc.WALL_VERTICAL_ENDS
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for wall to be active",
                    _popup: true
                },
                collType: {
                    _type: "String",
                    _info: "Collision Types of Wall. BLOCK - Blocks all, PBLOCK - Blocks only projectiles, NPBLOCK - Blocks only non projectiles",
                    _select: sc.WALL_COLL_TYPES
                },
                wallZHeight: {
                    _type: "Number",
                    _info: "Total height of the wall, when active",
                    _default: 32
                },
                noNavMapBlock: {
                    _type: "Boolean",
                    _info: "If true: do not block nav map"
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.gfx = new ig.Image(puzzleStyle.sheet);
            this.patterns = new ig.ImagePatternSheet(puzzleStyle.sheet, ig.ImagePattern.OPT.REPEAT_Y, 8, 16, 184, 64, 1, 1);
            this.topEnd = sc.WALL_VERTICAL_ENDS[settings.topEnd] || sc.WALL_VERTICAL_ENDS.CONTINUE;
            this.bottomEnd = sc.WALL_VERTICAL_ENDS[settings.bottomEnd] || sc.WALL_VERTICAL_ENDS.CONTINUE
        },

        show: function (show) {
            this.parent(show);
            this.wallBlockers.push(ig.game.spawnEntity("WallBlocker", this.coll.pos.x + 0, this.coll.pos.y + 0, this.coll.pos.z + this.coll.size.z, {
                size: {
                    x: 8,
                    y: this.coll.size.y - 0 - 0,
                    z: this.wallZHeight
                },
                collType: this.wallCollType,
                skipRender: this.skipRender,
                noNavMapBlock: this.noNavMapBlock
            }));
            this.updateWallBlockers(true)
        },

        initSprites: function () {
            this.setSpriteCount(1 + (this.topEnd ? 1 : 0) + (this.bottomEnd ? 1 : 0))
        },

        update: function () {
            this.parent()
        },

        updateSprites: function () {
            if (!this.skipRender) {
                var coll = this.coll,
                    topPad = this.topEnd ? 9 : 1,
                    midHeight = coll.size.y - (this.topEnd ? 8 : 0) - (this.bottomEnd ? 8 : 0),
                    spriteIndex = 0;
                if (midHeight > 0) {
                    this.sprites[spriteIndex].setPos(coll.pos.x, coll.pos.y + topPad, coll.pos.z);
                    this.sprites[spriteIndex].setSize(coll.size.x, midHeight, coll.size.z, 0);
                    this.sprites[spriteIndex].setImageSrc(this.patterns.getPattern(0), 0, 0);
                    spriteIndex++
                }
                if (this.topEnd) {
                    var tileOffset = 0;
                    switch (this.topEnd) {
                        case sc.WALL_VERTICAL_ENDS.STOP:
                            tileOffset = tileOffset + 5;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_LEFT:
                            tileOffset = tileOffset + 4;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_RIGHT:
                            tileOffset = tileOffset + 6
                    }
                    var tile = this.gfx.getTileSrc(tileScratch, tileOffset, 8, 16, 176, 64);
                    this.sprites[spriteIndex].setPos(coll.pos.x, coll.pos.y, coll.pos.z);
                    this.sprites[spriteIndex].setSize(coll.size.x, 8, coll.size.z, 8);
                    this.sprites[spriteIndex].setImageSrc(this.gfx, tile.x, tile.y);
                    spriteIndex++
                }
                if (this.bottomEnd) {
                    tileOffset = 0;
                    switch (this.bottomEnd) {
                        case sc.WALL_VERTICAL_ENDS.STOP:
                            tileOffset = tileOffset + 8;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_LEFT:
                            tileOffset = tileOffset + 7;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_RIGHT:
                            tileOffset = tileOffset + 9
                    }
                    tile = this.gfx.getTileSrc(tileScratch, tileOffset, 8, 16, 176, 64);
                    this.sprites[spriteIndex].setPos(coll.pos.x, coll.pos.y + midHeight + topPad, coll.pos.z);
                    this.sprites[spriteIndex].setSize(coll.size.x, 8, coll.size.z, 8);
                    this.sprites[spriteIndex].setImageSrc(this.gfx, tile.x, tile.y)
                }
            }
        }
    });

    ig.ENTITY.WallBlocker = ig.Entity.extend({
        maxHeight: 0,
        colorGfx: null,
        maxAlpha: 0.76,
        timer: 0,
        MOVE_TIME: 0.3,
        GLOW_TIME: 0.1,
        skipRender: false,
        navBlocker: null,
        noNavMapBlock: false,
        effectPattern: null,
        _wm: new ig.Config({
            spawnable: false,
            attributes: {
                collType: {
                    _type: "String",
                    _info: "Top End Type",
                    _select: ig.COLLTYPE
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic = true;
            this.noNavMapBlock = settings.noNavMapBlock;
            if (!ig.system.limitSoundUse) this.sounds = {
                goUp: new ig.Sound("media/sound/puzzle/barrier-up.ogg", 0.9, false),
                goDown: new ig.Sound("media/sound/puzzle/barrier-down.ogg", 0.9, false)
            };
            this.skipRender = settings.skipRender || false;
            this.coll.type = ig.COLLTYPE[settings.collType];
            var colors = ig.mapStyle.get("walls").colors,
                topColor = "#fff",
                frontColor = "#fff";
            switch (settings.collType) {
                case "BLOCK":
                    frontColor = colors.blockFront;
                    topColor = colors.blockTop;
                    this.coll.type = ig.COLLTYPE.FENCE;
                    break;
                case "PBLOCK":
                    frontColor = colors.pBlockFront;
                    topColor = colors.pBlockTop;
                    break;
                case "NPBLOCK":
                    frontColor = colors.npBlockFront;
                    topColor = colors.npBlockTop;
                    this.coll.type = ig.COLLTYPE.NPFENCE
            }
            this.colorGfx = new ig.DoubleColor(new ig.TransitionColor(topColor, "white"), new ig.TransitionColor(frontColor, "white"));
            this.maxAlpha = ig.mapStyle.get("walls").alpha || 0.76;
            this.effectPattern = new ig.ImagePatternSheet("media/entity/objects/object-effects.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 16, 16, 176, 0, 1, 1);
            this.maxHeight = this.coll.size.z
        },

        onKill: function (parent) {
            this.navBlocker && this.navBlocker.remove();
            this.effectPattern.decreaseRef();
            this.parent(parent)
        },

        initSprites: function () {
            this.setSpriteCount(2)
        },

        update: function () {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        },

        updateSprites: function () {
            if (!this.skipRender) {
                var coll = this.coll,
                    sprite1 = this.sprites[0],
                    sprite2 = this.sprites[1];
                if (coll.size.z == 0 && this.timer <= 0) {
                    sprite1.setImageSrc(null);
                    sprite2.setImageSrc(null)
                } else {
                    var moveProgress = 0,
                        glowProgress = 0;
                    if (this.timer > 0) {
                        moveProgress = ((this.timer - (coll.size.z ? this.GLOW_TIME : 0)) / this.MOVE_TIME).limit(0, 1);
                        moveProgress = KEY_SPLINES[coll.size.z ? "EASE_IN" : "EASE_OUT"].get(moveProgress);
                        glowProgress = ((this.timer - (coll.size.z ? 0 : this.MOVE_TIME)) / this.GLOW_TIME).limit(0, 1);
                        coll.size.z || (glowProgress = 1 - glowProgress)
                    }
                    this.colorGfx.color1.setColorBWeight(glowProgress);
                    this.colorGfx.color2.setColorBWeight(glowProgress);
                    var height = coll.size.z ? (1 - moveProgress) * this.maxHeight : moveProgress * this.maxHeight,
                        alpha = (coll.size.z ? 1 - moveProgress : moveProgress) * this.maxAlpha;
                    sprite1.setPos(coll.pos.x, coll.pos.y, coll.pos.z);
                    sprite1.setSize(coll.size.x, coll.size.y, height);
                    sprite1.setImageSrc(this.colorGfx);
                    sprite1.aboveZ = 1;
                    sprite1.setAlpha(alpha);
                    sprite2.setPos(coll.pos.x, coll.pos.y, coll.pos.z);
                    sprite2.setSize(coll.size.x, coll.size.y, height);
                    sprite2.setAlpha(alpha);
                    sprite2.aboveZ = 1;
                    sprite2.renderMode = "lighter";
                    var texX = coll.pos.x + ig.game.backgroundAnimTimer * 16,
                        texY = coll.pos.y - coll.pos.z - coll.size.z + ig.game.backgroundAnimTimer * 16;
                    sprite2.setImageSrc(this.effectPattern.getPattern(0), texX, texY)
                }
            }
        },

        setActive: function (active, instant) {
            this.setSize(this.coll.size.x, this.coll.size.y, active ? this.maxHeight : 0);
            if (active && !this.navBlocker && !this.noNavMapBlock) this.navBlocker = ig.navigation.getNavBlock(this);
            else if (!active && this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null
            }
            if (!instant) {
                this.timer = this.GLOW_TIME + this.MOVE_TIME;
                this.sounds && (active ? ig.SoundHelper.playAtEntity(this.sounds.goUp, this) : ig.SoundHelper.playAtEntity(this.sounds.goDown, this))
            }
        }
    })
});
ig.baked = !0;