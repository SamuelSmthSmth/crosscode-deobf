ig.module("game.feature.puzzle.entities.walls").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.size.z =
                1;
            if (!e.size) {
                this.coll.size.x = 8;
                this.coll.size.y = 8
            }
            this.noNavMapBlock = e.noNavMapBlock || false;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic = true;
            this.wallCollType = e.collType || "BLOCK";
            this.wallZHeight = e.wallZHeight || 32;
            this.condition = new ig.VarCondition(e.condition);
            this.skipRender = e.skipRender || false;
            this.active = this.condition.evaluate()
        },
        onKill: function(a) {
            this.parent(a)
        },
        updateWallBlockers: function(a) {
            for (var b = 0; b < this.wallBlockers.length; ++b) this.wallBlockers[b].setActive(this.active,
                a)
        },
        varsChanged: function() {
            var a = this.condition.evaluate();
            if (this.active != a) {
                this.active = a;
                this.updateWallBlockers()
            }
        }
    });
    var b = {};
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            a =
                ig.mapStyle.get("puzzle");
            this.gfx = new ig.Image(a.sheet);
            this.patterns = new ig.ImagePatternSheet(a.sheet, ig.ImagePattern.OPT.REPEAT_X, 8, 16, 176, 64, 1, 1);
            this.leftEnd = sc.WALL_HORIZONTAL_ENDS[e.leftEnd] || sc.WALL_HORIZONTAL_ENDS.CONTINUE;
            this.rightEnd = sc.WALL_HORIZONTAL_ENDS[e.rightEnd] || sc.WALL_HORIZONTAL_ENDS.CONTINUE
        },
        show: function(a) {
            this.parent(a);
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
        initSprites: function() {
            this.setSpriteCount(1 + (this.leftEnd ? 1 : 0) + (this.rightEnd ? 1 : 0))
        },
        update: function() {
            this.parent()
        },
        updateSprites: function() {
            if (!this.skipRender) {
                var a = this.coll,
                    d = this.leftEnd ? 8 : 0,
                    c = a.size.x - (this.leftEnd ? 8 : 0) - (this.rightEnd ? 8 : 0),
                    e = 0;
                if (c > 0) {
                    this.sprites[e].setPos(a.pos.x + d, a.pos.y, a.pos.z);
                    this.sprites[e].setSize(c, a.size.y, a.size.z,
                        a.size.y);
                    this.sprites[e].setImageSrc(this.patterns.getPattern(0), 0, 0);
                    e++
                }
                if (this.leftEnd) {
                    this.sprites[e].setPos(a.pos.x, a.pos.y, a.pos.z);
                    this.sprites[e].setSize(8, a.size.y, a.size.z, a.size.y);
                    var f = this.gfx.getTileSrc(b, 2, 8, 16, 176, 64);
                    this.sprites[e].setImageSrc(this.gfx, f.x, f.y);
                    e++
                }
                if (this.rightEnd) {
                    this.sprites[e].setPos(a.pos.x + c + d, a.pos.y, a.pos.z);
                    this.sprites[e].setSize(8, a.size.y, a.size.z, a.size.y);
                    f = this.gfx.getTileSrc(b, 3, 8, 16, 176, 64);
                    this.sprites[e].setImageSrc(this.gfx, f.x, f.y)
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            a = ig.mapStyle.get("puzzle");
            this.gfx = new ig.Image(a.sheet);
            this.patterns = new ig.ImagePatternSheet(a.sheet, ig.ImagePattern.OPT.REPEAT_Y, 8, 16, 184,
                64, 1, 1);
            this.topEnd = sc.WALL_VERTICAL_ENDS[e.topEnd] || sc.WALL_VERTICAL_ENDS.CONTINUE;
            this.bottomEnd = sc.WALL_VERTICAL_ENDS[e.bottomEnd] || sc.WALL_VERTICAL_ENDS.CONTINUE
        },
        show: function(a) {
            this.parent(a);
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
        initSprites: function() {
            this.setSpriteCount(1 +
                (this.topEnd ? 1 : 0) + (this.bottomEnd ? 1 : 0))
        },
        update: function() {
            this.parent()
        },
        updateSprites: function() {
            if (!this.skipRender) {
                var a = this.coll,
                    d = this.topEnd ? 9 : 1,
                    c = a.size.y - (this.topEnd ? 8 : 0) - (this.bottomEnd ? 8 : 0),
                    e = 0;
                if (c > 0) {
                    this.sprites[e].setPos(a.pos.x, a.pos.y + d, a.pos.z);
                    this.sprites[e].setSize(a.size.x, c, a.size.z, 0);
                    this.sprites[e].setImageSrc(this.patterns.getPattern(0), 0, 0);
                    e++
                }
                if (this.topEnd) {
                    var f = 0;
                    switch (this.topEnd) {
                        case sc.WALL_VERTICAL_ENDS.STOP:
                            f = f + 5;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_LEFT:
                            f =
                                f + 4;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_RIGHT:
                            f = f + 6
                    }
                    f = this.gfx.getTileSrc(b, f, 8, 16, 176, 64);
                    this.sprites[e].setPos(a.pos.x, a.pos.y, a.pos.z);
                    this.sprites[e].setSize(a.size.x, 8, a.size.z, 8);
                    this.sprites[e].setImageSrc(this.gfx, f.x, f.y);
                    e++
                }
                if (this.bottomEnd) {
                    f = 0;
                    switch (this.bottomEnd) {
                        case sc.WALL_VERTICAL_ENDS.STOP:
                            f = f + 8;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_LEFT:
                            f = f + 7;
                            break;
                        case sc.WALL_VERTICAL_ENDS.CORNER_RIGHT:
                            f = f + 9
                    }
                    f = this.gfx.getTileSrc(b, f, 8, 16, 176, 64);
                    this.sprites[e].setPos(a.pos.x, a.pos.y +
                        c + d, a.pos.z);
                    this.sprites[e].setSize(a.size.x, 8, a.size.z, 8);
                    this.sprites[e].setImageSrc(this.gfx, f.x, f.y)
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic =
                true;
            this.noNavMapBlock = e.noNavMapBlock;
            if (!ig.system.limitSoundUse) this.sounds = {
                goUp: new ig.Sound("media/sound/puzzle/barrier-up.ogg", 0.9, false),
                goDown: new ig.Sound("media/sound/puzzle/barrier-down.ogg", 0.9, false)
            };
            this.skipRender = e.skipRender || false;
            this.coll.type = ig.COLLTYPE[e.collType];
            a = ig.mapStyle.get("walls").colors;
            c = b = "#fff";
            switch (e.collType) {
                case "BLOCK":
                    c = a.blockFront;
                    b = a.blockTop;
                    this.coll.type = ig.COLLTYPE.FENCE;
                    break;
                case "PBLOCK":
                    c = a.pBlockFront;
                    b = a.pBlockTop;
                    break;
                case "NPBLOCK":
                    c =
                        a.npBlockFront;
                    b = a.npBlockTop;
                    this.coll.type = ig.COLLTYPE.NPFENCE
            }
            this.colorGfx = new ig.DoubleColor(new ig.TransitionColor(b, "white"), new ig.TransitionColor(c, "white"));
            this.maxAlpha = ig.mapStyle.get("walls").alpha || 0.76;
            this.effectPattern = new ig.ImagePatternSheet("media/entity/objects/object-effects.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 16, 16, 176, 0, 1, 1);
            this.maxHeight = this.coll.size.z
        },
        onKill: function(a) {
            this.navBlocker && this.navBlocker.remove();
            this.effectPattern.decreaseRef();
            this.parent(a)
        },
        initSprites: function() {
            this.setSpriteCount(2)
        },
        update: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        },
        updateSprites: function() {
            if (!this.skipRender) {
                var a = this.coll,
                    b = this.sprites[0],
                    c = this.sprites[1];
                if (a.size.z == 0 && this.timer <= 0) {
                    b.setImageSrc(null);
                    c.setImageSrc(null)
                } else {
                    var e = 0,
                        f = 0;
                    if (this.timer > 0) {
                        e = ((this.timer - (a.size.z ? this.GLOW_TIME : 0)) / this.MOVE_TIME).limit(0, 1);
                        e = KEY_SPLINES[a.size.z ? "EASE_IN" : "EASE_OUT"].get(e);
                        f = ((this.timer - (a.size.z ? 0 : this.MOVE_TIME)) / this.GLOW_TIME).limit(0, 1);
                        a.size.z || (f = 1 - f)
                    }
                    this.colorGfx.color1.setColorBWeight(f);
                    this.colorGfx.color2.setColorBWeight(f);
                    f = a.size.z ? (1 - e) * this.maxHeight : e * this.maxHeight;
                    e = (a.size.z ? 1 - e : e) * this.maxAlpha;
                    b.setPos(a.pos.x, a.pos.y, a.pos.z);
                    b.setSize(a.size.x, a.size.y, f);
                    b.setImageSrc(this.colorGfx);
                    b.aboveZ = 1;
                    b.setAlpha(e);
                    c.setPos(a.pos.x, a.pos.y, a.pos.z);
                    c.setSize(a.size.x, a.size.y, f);
                    c.setAlpha(e);
                    c.aboveZ = 1;
                    c.renderMode = "lighter";
                    b = a.pos.x + ig.game.backgroundAnimTimer * 16;
                    a = a.pos.y - a.pos.z - a.size.z + ig.game.backgroundAnimTimer * 16;
                    c.setImageSrc(this.effectPattern.getPattern(0), b,
                        a)
                }
            }
        },
        setActive: function(a, b) {
            this.setSize(this.coll.size.x, this.coll.size.y, a ? this.maxHeight : 0);
            if (a && !this.navBlocker && !this.noNavMapBlock) this.navBlocker = ig.navigation.getNavBlock(this);
            else if (!a && this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null
            }
            if (!b) {
                this.timer = this.GLOW_TIME + this.MOVE_TIME;
                this.sounds && (a ? ig.SoundHelper.playAtEntity(this.sounds.goUp, this) : ig.SoundHelper.playAtEntity(this.sounds.goDown, this))
            }
        }
    })
});
ig.baked = !0;
