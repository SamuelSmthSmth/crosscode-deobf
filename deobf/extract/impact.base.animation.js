ig.module("impact.base.animation").requires("impact.base.loader", "impact.base.timer", "impact.base.image", "impact.base.sprite-fx").defines(function() {
    function b(a, b, c) {
        c = c * (1 - a.colorAlpha);
        a.colorAlpha = a.colorAlpha + c;
        a.color.addColor(b, c / a.colorAlpha)
    }

    function a(a, b) {
        if (b.namedSheets)
            for (var c in b.namedSheets) {
                var d = b.namedSheets[c];
                if (!(d instanceof ig.TileSheet)) {
                    d = ig.TileSheet.createFromJson(b.namedSheets[c]);
                    a.createdSheets.push(d)
                }
                a.namedSheets[c] = d
            }
    }

    function d(a, b, c, e) {
        var e = e || {},
            f = b.sheet,
            e = ig.merge({}, e, true);
        ig.merge(e, b, true);
        if (e.sheet && typeof e.sheet == "object" && !(e.sheet instanceof ig.TileSheet)) {
            f = ig.TileSheet.createFromJson(e.sheet);
            a.createdSheets.push(f);
            e.sheet = f
        }
        if (b.name)
            if (f = a._getSheet(e.sheet)) {
                f = c(a._getSheet(e.sheet), e);
                a.addAnimationSet(b.name, f)
            } if (b.SUB) {
            b = b.SUB;
            for (f = 0; f < b.length; ++f) d(a, b[f], c, e)
        }
    }

    function c(a, b) {
        return new ig.SingleDirAnimationSet(new ig.Animation(a, b))
    }

    function e(a, b) {
        var c = new ig.MultiDirAnimationSet(b);
        if (b.frames) c.setAnimations(a, b);
        else if (b.dirFrames)
            for (var d =
                    0; d < b.dirFrames.length; d++) {
                var e = ig.merge({}, b, true);
                e.frames = b.dirFrames[d];
                e.flipX = b.flipX && b.flipX[d] || false;
                c.addAnimation(new ig.Animation(a, e))
            }
        return c
    }
    ig.TileSheet = ig.Class.extend({
        width: 8,
        height: 8,
        offX: 0,
        offY: 0,
        xCount: 0,
        image: null,
        init: function(a, b, c, d, e, f) {
            this.width = b;
            this.height = c;
            this.offX = d || 0;
            this.offY = e || 0;
            this.xCount = f || 0;
            this.image = new ig.Image(a)
        },
        generateHit: function() {
            this.image.addFiltered("damage", "MONOCHROME", {
                factorRed: 1,
                factorGreen: 1.2,
                factorBlue: 2,
                colorAdd: 64
            })
        },
        getTileSrc: function(a,
            b) {
            return this.image.getTileSrc(a, b, this.width, this.height, this.offX, this.offY, this.xCount)
        },
        clearCached: function() {
            this.image.decreaseRef()
        }
    });
    ig.TileSheet.createFromJson = function(a) {
        return new ig.TileSheet(a.src, a.width, a.height, a.offX, a.offY, a.xCount)
    };
    ig.ANIM_SHAPE_TYPE = {
        NO_EXPAND: 1,
        Y_EXPAND: 2,
        Z_EXPAND: 3,
        YZ_EXPAND: 4,
        Y_FLAT: 5,
        Z_FLAT: 6
    };
    var f = Vec3.create();
    ig.Animation = ig.Class.extend({
        sheet: null,
        shapeType: ig.ANIM_SHAPE_TYPE.NO_EXPAND,
        frameTime: 0,
        stop: false,
        flip: {
            x: false,
            y: false
        },
        pivot: {
            x: 0,
            y: 0
        },
        centerPivot: false,
        wallY: 0,
        aboveZ: 0,
        sequence: [],
        sequenceSpriteOff: null,
        framesGfxOffset: null,
        framesAlpha: null,
        framesAngle: null,
        framesFlipX: null,
        angle: 0,
        offset: null,
        gfxOffset: null,
        size: null,
        renderMode: null,
        guiSprites: false,
        globalTiming: false,
        fx: null,
        init: function(a, b) {
            if (!a instanceof ig.TileSheet) throw Error("Tried to initiale Animation without ig.TileSheet object");
            this.sheet = a;
            if (b.shapeType) this.shapeType = ig.ANIM_SHAPE_TYPE[b.shapeType];
            this.pivot = b.pivot ? {
                x: b.pivot.x,
                y: b.pivot.y
            } : {
                x: this.sheet.width /
                    2,
                y: this.sheet.height / 2
            };
            this.flip.x = b.flipX || false;
            this.flip.y = b.flipY || false;
            this.offset = b.offset || null;
            this.angle = b.angle || 0;
            this.size = b.size || null;
            this.gfxOffset = b.gfxOffset || null;
            this.centerPivot = b.centerPivot || false;
            this.guiSprites = b.guiSprites || false;
            this.wallY = b.wallY || 0;
            if (b.aboveZ) this.aboveZ = b.aboveZ;
            this.renderMode = b.renderMode || null;
            this.globalTiming = b.globalTiming || false;
            this.faceRotate = b.faceRotate || false;
            this.frameTime = b.time || 0.1;
            this.sequence = ig.copy(b.frames);
            if (b.tileOffset)
                for (var c =
                        0; c < this.sequence.length; c++) this.sequence[c] = this.sequence[c] == -1 ? -1 : this.sequence[c] + b.tileOffset;
            if (b.fx) {
                var d = b.fx;
                this.fx = [];
                for (c = 0; c < d.length; ++c) {
                    var e = d[c];
                    this.fx.push(new ig.SPRITE_FX[e.type](e))
                }
            }
            this.sequenceSpriteOff = b.framesSpriteOffset || null;
            this.framesGfxOffset = b.framesGfxOffset || null;
            this.framesAlpha = b.framesAlpha || null;
            this.framesAngle = b.framesAngle || null;
            this.framesFlipX = b.framesFlipX || null;
            this.stop = !b.repeat
        },
        getDuration: function() {
            return this.frameTime * this.sequence.length
        },
        getFrameCount: function() {
            return this.sequence.length
        },
        onAnimationStart: null,
        onUpdate: null,
        updateSprite: function(a, b, c, d) {
            var e = this.globalTiming ? ig.game.backgroundAnimTimer : c.timer,
                g = this.sequence.length;
            if (g) {
                var h = Math.floor(e / this.frameTime),
                    g = this.stop ? Math.min(h, g - 1) : h % g,
                    h = this.sheet,
                    j = this.sheet.image,
                    k;
                this.size ? b.setSize(this.size.x, this.size.y, this.size.z, this.size.y * (this.wallY || 0)) : b.setSizeFromEntity(a, h.width, h.height, this.shapeType, this.wallY);
                Vec3.assignC(f, 0, 0, 0);
                this.offset && Vec3.add(f,
                    this.offset);
                var l;
                if (l = this.sequenceSpriteOff) {
                    k = g * 3;
                    Vec3.addC(f, (c.flipX ? -1 : 1) * l[k], l[k + 1], l[k + 2])
                }
                b.setPosFromEntity(a, f, this.shapeType, this.wallY);
                l = this.sequence[g];
                if (l == -1) b.setInvisible();
                else {
                    for (k = c.animMods.length; k--;) {
                        var u = c.animMods[k];
                        u.spriteIdx == d && (l = l + u.tileOffset)
                    }
                    k = h.getTileSrc(i, l);
                    b.setImageSrcFromEntity(a, h.width, h.height, j, k.x, k.y);
                    d == 0 ? b.setShadowFromEntity(a) : b.setShadow(0, 0, 0, 0);
                    h = d = 0;
                    if (this.gfxOffset) {
                        d = (c.flipX ? -1 : 1) * this.gfxOffset.x;
                        h = this.gfxOffset.y
                    }
                    if (this.framesGfxOffset) {
                        k =
                            g * 2;
                        d = d + (c.flipX ? -1 : 1) * (this.framesGfxOffset[k] || 0);
                        h = h + (this.framesGfxOffset[k + 1] || 0)
                    }
                    j = c.alpha;
                    this.framesAlpha && (j = j * this.framesAlpha[g]);
                    k = c.angle + this.angle * Math.PI * 2 / 360;
                    this.faceRotate && a.face && (k = k + Vec2.clockangle(a.face));
                    this.framesAngle && (k = k + (c.flipX ? -1 : 1) * this.framesAngle[g] * Math.PI * 2 / 360);
                    l = c.flipX ? !this.flip.x : this.flip.x;
                    this.framesFlipX && this.framesFlipX[g] && (l = !l);
                    b.setAlpha(j);
                    b.setTransform(c.scaleX, c.scaleY, k);
                    b.aboveZ = this.aboveZ;
                    b.setGfxOffset(d, h);
                    b.setFlip(l, this.flip.y);
                    b.setPivot(this.pivot.x, this.pivot.y);
                    this.centerPivot && b.centerPivot(a);
                    b.renderMode = this.renderMode;
                    if (this.fx) {
                        a = this.frameTime * this.sequence.length;
                        for (k = 0; k < this.fx.length; ++k) this.fx[k].updateSprite(b, e, a)
                    }
                }
            } else b.setInvisible()
        }
    });
    ig.MultiEntityAnimationPart = ig.Class.extend({
        name: null,
        group: null,
        persistAnim: null,
        collType: 0,
        heightShape: 0,
        padding: Vec2.create(),
        size: {
            x: 0,
            y: 0,
            z: 0
        },
        pos: {
            x: 0,
            y: 0,
            z: 0
        },
        animSheet: null,
        synced: false,
        init: function(a, b, c) {
            this.name = a;
            this.group = c.group;
            this.persistAnim =
                c.persistAnim;
            this.collType = ig.COLLTYPE[c.collType || "BLOCK"];
            this.heightShape = ig.COLL_HEIGHT_SHAPE[c.heightShape || "NONE"];
            Vec3.assign(this.size, c.size);
            c.padding && Vec2.assign(this.padding, c.padding);
            Vec3.assign(this.pos, c.pos);
            a = c.anims;
            a.namedSheets = b;
            this.animSheet = new ig.AnimationSheet(a)
        },
        createSubEntity: function(a, b) {
            var c = a.getCenter(g);
            c.z = a.coll.pos.z;
            c.x = c.x - b.x / 2;
            c.y = c.y - b.y / 2;
            Vec3.add(c, this.pos);
            var d = a.getAnimPartyEntityClass ? a.getAnimPartyEntityClass() : ig.AnimationPartEntity;
            return ig.game.spawnEntity(d,
                c.x, c.y, c.z, {
                    owner: a,
                    size: this.size,
                    padding: this.padding,
                    partName: this.name,
                    group: this.group,
                    persistAnim: this.persistAnim,
                    animSheet: this.animSheet,
                    collType: this.collType,
                    heightShape: this.heightShape
                })
        }
    });
    var g = Vec3.create(),
        h = Vec3.create();
    ig.MULTI_ANIM_FLIP = {
        NONE: 0,
        LEFT: 1,
        RIGHT: 2
    };
    ig.MultiEntityAnimation = ig.Class.extend({
        parts: null,
        baseSize: Vec3.create(),
        anchor: null,
        frameTime: 0,
        frameCount: 0,
        stop: false,
        flipDir: false,
        partAnims: {},
        init: function(a, b, c) {
            Vec3.assign(this.baseSize, a);
            this.parts = b;
            this.frameTime =
                c.time;
            this.frameCount = c.frameCount;
            this.stop = !c.repeat;
            this.anchor = c.anchor || null;
            this.flipDir = ig.MULTI_ANIM_FLIP[c.flipDir] || ig.MULTI_ANIM_FLIP.NONE;
            var a = c.partAnims,
                d;
            for (d in a) this.partAnims[d] = {
                anim: a[d].anim,
                posFrames: a[d].posFrames,
                reset: a[d].reset,
                collType: ig.COLLTYPE[a[d].collType] || null
            }
        },
        getAnchorOffset: function(a) {
            if (!this.anchor) return null;
            var b = Vec3.create(this.anchor);
            if (this.flipDir && (this.flipDir == ig.MULTI_ANIM_FLIP.LEFT && a < 0 || this.flipDir == ig.MULTI_ANIM_FLIP.RIGHT && a >= 0)) b.x = -b.x;
            return b
        },
        getDuration: function() {
            return this.frameTime * this.frameCount
        },
        getFrameCount: function() {
            return this.frameCount
        },
        onAnimationStart: function(a) {
            var b = a.coll;
            b.subColls.length == 0 && ig.MultiEntityAnimation.initSubEntities(a, this.parts, this.baseSize);
            a.animState.rewind();
            for (var a = b.subColls, c = a.length, a = b.subColls, c = a.length; c--;) {
                var b = a[c].entity,
                    d = this.partAnims[b.partName];
                if (d) {
                    if (b._hidden) {
                        b.show(true);
                        b.justAdded = true
                    }
                    b.coll.setType(d.collType || b.defaultCollType);
                    if (!b.persistAnim ||
                        window.wm) {
                        b.setCurrentAnim(d.anim, d.reset);
                        d.reset && b.animState.rewind();
                        b.synced = d.reset;
                        b.updateAnim()
                    }
                } else b._hidden || b.hide()
            }
        },
        onUpdate: function(a, b) {
            var c = a.coll;
            c.subColls.length == 0 && this.initSubEntities(a);
            var d = c.getCenter(g);
            d.z = c.pos.z;
            d.x = d.x - this.baseSize.x / 2;
            d.y = d.y - this.baseSize.y / 2;
            var e = false;
            if (this.flipDir && a.face && (this.flipDir == ig.MULTI_ANIM_FLIP.LEFT && a.face.x < 0 || this.flipDir == ig.MULTI_ANIM_FLIP.RIGHT && a.face.x >= 0)) e = true;
            for (var f = this.frameCount, i = Math.floor(b.timer / this.frameTime),
                    f = (this.stop ? Math.min(i, f - 1) : i % f) * 3, c = c.subColls, i = c.length; i--;) {
                var j = c[i],
                    k = j.entity,
                    l = this.partAnims[k.partName],
                    u = this.parts[k.partName];
                if (l) {
                    var z = k.animState;
                    if (k.synced) z.timer = b.timer - ig.system.tick;
                    z.flipX = e;
                    z.alpha = b.alpha;
                    z.scaleX = b.scaleX;
                    z.scaleY = b.scaleY;
                    l = l.posFrames;
                    u = Vec3.assign(h, u.pos);
                    Vec3.addC(u, l[f], l[f + 1], l[f + 2]);
                    if (e) u.x = this.baseSize.x - u.x - j.size.x;
                    Vec3.add(u, d);
                    j.setPos(u.x, u.y, u.z, !k.justAdded);
                    k.justAdded = false
                }
            }
        },
        updateSprite: function(a, b, c) {
            b.setImageSrc(null);
            b.setSize(this.baseSize.x,
                this.baseSize.y, 0);
            b.setPosFromEntity(a);
            b.setShadowFromEntity(a);
            b.setAlpha(c.alpha)
        }
    });
    ig.MultiEntityAnimation.initSubEntities = function(a, b, c) {
        var d = a.coll;
        d.setSize(c.x, c.y, c.z);
        d.type = ig.COLLTYPE.IGNORE;
        d.setSize(c.x, c.y, c.z);
        for (var e in b) {
            var f = b[e].createSubEntity(a, c);
            f.animState.alpha = a.animState.alpha;
            d.addSubCollEntry(f.coll);
            f.initAnimations()
        }
    };
    var i = {};
    ig.AnimationState = ig.Class.extend({
        animations: null,
        followUp: null,
        timer: 0,
        loopCount: 0,
        alpha: 1,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        colorOverlays: [],
        animMods: [],
        init: function() {
            this.timer = 0
        },
        reset: function() {
            this.timer = 0;
            var a = this.constructor.prototype;
            this.animations = a.animations;
            this.followUp = a.followUp;
            this.loopCount = a.loopCount;
            this.alpha = a.alpha;
            this.angle = a.angle;
            this.scaleX = a.scaleX;
            this.scaleY = a.scaleY;
            this.colorOverlays.length = 0
        },
        shuffleTime: function() {
            var a = this.animations[0];
            if (a) this.timer = a.getDuration() * Math.random()
        },
        hasAnimations: function() {
            return !!this.animations
        },
        setAnimation: function(a, b) {
            if (b && this.animations !=
                b) {
                this.animations = b;
                for (var c = this.animations.length; c--;) {
                    var d = b[c];
                    window.wm || d.onAnimationStart && d.onAnimationStart(a)
                }
            }
        },
        addColorOverlay: function(a) {
            this.colorOverlays.push(a)
        },
        getFrame: function() {
            if (!this.animations) return 0;
            var a = this.animations[0];
            if (!a) return 0;
            var b = a.getFrameCount(),
                c = Math.floor(this.timer / a.frameTime);
            return a.stop ? Math.min(c, b - 1) : c % b
        },
        isStatic: function() {
            if (!this.animations) return true;
            for (var a = this.animations.length; a--;)
                if (this.animations[a].getFrameCount() > 1) return false;
            return true
        },
        isRepeat: function() {
            return !this.animations ? false : !this.animations[0].stop
        },
        hasStopped: function() {
            if (!this.animations) return false;
            var a = this.animations[0],
                b = Math.floor(this.timer / a.frameTime);
            return a.stop && b >= a.getFrameCount()
        },
        rewind: function() {
            this.loopCount = this.timer = 0;
            return this
        },
        update: function(a, b) {
            this.timer = this.timer + ig.system.tick * b;
            var c = this.animations.length;
            for (this.loopCount = -1; c--;) {
                var d = this.animations[c],
                    e = Math.floor(this.timer / d.getDuration());
                this.loopCount = this.loopCount ==
                    -1 ? e : Math.min(this.loopCount, e);
                d.onUpdate && d.onUpdate(a, this, b)
            }
        },
        updateSprite: function(a) {
            if (this.animations) {
                a.setSpriteCount(this.animations.length, this.animations.length > 0 && this.animations[0].guiSprites);
                for (var b = this.animations.length; b--;) {
                    var c = this.animations[b],
                        d = a.sprites[b];
                    !c || c.sheet && !c.sheet.image.loaded ? d.setInvisible() : c.updateSprite(a, d, this, b)
                }
                this.updateSpriteColor(a)
            } else a.setSpriteCount(0)
        },
        updateSpriteColor: function(a) {
            var c = j,
                d = k;
            c.color = null;
            c.colorAlpha = 0;
            d.color = null;
            d.colorAlpha = 0;
            for (var e = this.colorOverlays.length, f = null; e--;) {
                var g = this.colorOverlays[e],
                    h = g.lighter ? d : c;
                if (g.color) {
                    if (g.spriteFilter !== null) {
                        f || (f = []);
                        f[g.spriteFilter] || (f[g.spriteFilter] = {
                            normal: {
                                color: null,
                                colorAlpha: 0
                            },
                            lighter: {
                                color: null,
                                colorAlpha: 0
                            }
                        });
                        h = g.lighter ? f[g.spriteFilter].lighter : f[g.spriteFilter].normal
                    }
                    if (h.color) b(h, g.color, g.alpha);
                    else {
                        h.color = new ig.RGBColor(g.color);
                        h.colorAlpha = g.alpha
                    }
                } else this.colorOverlays.splice(e, 1)
            }
            for (e = a.sprites.length; e--;) {
                if ((g = f && f[e]) && g.normal.color) {
                    c.color &&
                        b(g.normal, c.color, c.colorAlpha);
                    a.sprites[e].setOverlayColor(g.normal.color.toRGB(), g.normal.colorAlpha)
                } else a.sprites[e].setOverlayColor(c.color ? c.color.toRGB() : null, c.colorAlpha);
                if (g && g.lighter.color) {
                    d.color && b(g.lighter, d.color, d.colorAlpha);
                    a.sprites[e].setLighterOverlayColor(g.lighter.color.toRGB(), g.lighter.colorAlpha)
                } else a.sprites[e].setLighterOverlayColor(d.color ? d.color.toRGB() : null, d.colorAlpha)
            }
        }
    });
    ig.AnimModification = ig.Class.extend({
        entity: null,
        name: null,
        spriteIdx: 0,
        tileOffset: 0,
        init: function(a, b, c) {
            this.entity = a;
            this.spriteIdx = b;
            (this.name = c) && ig.AnimModification.removeMods(a, c);
            a.animState.animMods.push(this)
        },
        remove: function() {
            this.entity.animState.animMods.erase(this)
        },
        onActionEndDetach: function() {
            this.remove()
        }
    });
    ig.AnimModification.removeMods = function(a, b) {
        for (var c = a.animState.animMods.length; c--;)(!b || a.animState.animMods[c].name == b) && a.animState.animMods[c].remove()
    };
    var j = {},
        k = {};
    ig.ColorOverlay = ig.Class.extend({
        color: null,
        alpha: null,
        spriteFilter: null,
        lighter: false,
        init: function(a, b, c, d) {
            this.color = new ig.RGBColor(a);
            this.alpha = b;
            if (c !== void 0) this.spriteFilter = c;
            this.lighter = d
        },
        clear: function() {
            this.color = null
        }
    });
    ig.SingleDirAnimationSet = ig.Class.extend({
        animations: [],
        init: function(a) {
            this.animations.push(a)
        },
        getAnimations: function() {
            return this.animations
        },
        getAnchorOffset: function(a, b) {
            var c = this.animations[0];
            return c && c.getAnchorOffset ? c.getAnchorOffset(a, b) : null
        },
        getDuration: function() {
            for (var a = 0, b = this.animations.length; b--;) a = Math.max(this.animations[b].getDuration(),
                a);
            return a
        },
        merge: function(a) {
            this.animations.push.apply(this.animations, a.animations)
        }
    });
    ig.MultiDirAnimationSet = ig.Class.extend({
        numDirs: 0,
        animations: [],
        anchorOffsetX: null,
        anchorOffsetY: null,
        anchorOffsetZ: null,
        init: function(a) {
            this.numDirs = a.dirs * 1;
            this.anchorOffsetX = a.anchorOffsetX;
            this.anchorOffsetY = a.anchorOffsetY;
            this.anchorOffsetZ = a.anchorOffsetZ
        },
        setAnimations: function(a, b) {
            var c = b.tileOffsets,
                d = b.flipX,
                e = b.offset,
                f = b.dirOffsets,
                g = b.dirAngles,
                h = b.allDirFlipX || false;
            b.angle = 0;
            this.numDirs =
                b.tileOffsets.length;
            this.animations = [];
            for (var i = 0; i < this.numDirs; i++) {
                var j = h ? (this.numDirs - i) % this.numDirs : i;
                b.tileOffset = c[j];
                b.flipX = d && d[j] || 0;
                h && (b.flipX = !b.flipX);
                if (f) {
                    var k = Vec3.create();
                    e && Vec3.add(k, e);
                    k.x = k.x + (f[j] && f[j][0] || 0) * (h ? -1 : 1);
                    k.y = k.y + (f[j] && f[j][1] || 0);
                    k.z = k.z + (f[j] && f[j][2] || 0);
                    b.offset = k
                }
                g && (b.angle = g[j]);
                this.animations[i] = [new ig.Animation(a, b)]
            }
        },
        addAnimation: function(a) {
            this.animations.push([a])
        },
        merge: function(a) {
            if (this.numDirs != a.numDirs) throw Error("Tried to merge Multi Dir Anims with different number of directions. Not supported.");
            for (var b = 0; b < this.numDirs; ++b) {
                var c = this.animations[b];
                c.push.apply(c, a.animations[b])
            }
        },
        getAnchorOffset: function(a, b) {
            if (!this.anchorOffsetX && !this.anchorOffsetY && !this.anchorOffsetZ) return null;
            var c = ig.getDirectionIndex(a, b, this.numDirs);
            return {
                x: this.anchorOffsetX && (this.anchorOffsetX.length ? this.anchorOffsetX[c] : this.anchorOffsetX) || 0,
                y: this.anchorOffsetY && (this.anchorOffsetY.length ? this.anchorOffsetY[c] : this.anchorOffsetY) || 0,
                z: this.anchorOffsetZ && (this.anchorOffsetZ.length ? this.anchorOffsetZ[c] :
                    this.anchorOffsetZ) || 0
            }
        },
        getAnimations: function(a) {
            a = ig.getDirectionIndex(a.face.x, a.face.y, this.numDirs);
            return this.animations[a]
        },
        getDuration: function() {
            for (var a = 0, b = this.animations[0], c = b.length; c--;) a = Math.max(b[c].getDuration(), a);
            return a
        }
    });
    ig.getDirectionIndex = function(a, b, c) {
        switch (c) {
            case 1:
                return 0;
            case 2:
                return a >= 0 ? 0 : 1;
            case 4:
                return Math.abs(b) > Math.abs(a) ? b < 0 ? 0 : 2 : a > 0 ? 1 : 3;
            case 6:
                return a >= 0 ? b <= 0 ? 0 + (57 * a > -100 * b) : 1 + (57 * a < 100 * b) : b <= 0 ? 4 + (-57 * a < -100 * b) : 3 + (-57 * a > 100 * b);
            case 8:
                return Math.abs(b) >
                    2.414 * Math.abs(a) ? b < 0 ? 0 : 4 : Math.abs(a) > 2.414 * Math.abs(b) ? a > 0 ? 2 : 6 : a > 0 ? b < 0 ? 1 : 3 : b > 0 ? 5 : 7;
            case 16:
                var c = Math.abs(a),
                    d = Math.abs(b);
                return d > 5.0273 * c ? b < 0 ? 0 : 8 : d < 0.1989 * c ? a > 0 ? 4 : 12 : d > 1.4966 * c ? a > 0 ? b < 0 ? 1 : 7 : b > 0 ? 9 : 15 : d > 0.6682 * c ? a > 0 ? b < 0 ? 2 : 6 : b > 0 ? 10 : 14 : a > 0 ? b < 0 ? 3 : 5 : b > 0 ? 11 : 13
        }
    };
    ig.getDirectionVel = function(a, b, c) {
        c = c || Vec2.create();
        switch (b) {
            case 1:
                Vec2.assignC(c, 0, 1);
                break;
            case 2:
                switch (a) {
                    case 0:
                        Vec2.assignC(c, 1, 0);
                        break;
                    case 1:
                        Vec2.assignC(c, -1, 0)
                }
                break;
            case 4:
                switch (a) {
                    case 0:
                        Vec2.assignC(c, 0, -1);
                        break;
                    case 1:
                        Vec2.assignC(c,
                            1, 0);
                        break;
                    case 2:
                        Vec2.assignC(c, 0, 1);
                        break;
                    case 3:
                        Vec2.assignC(c, -1, 0)
                }
                break;
            case 6:
                switch (a) {
                    case 0:
                        Vec2.assignC(c, 0.5, -0.866);
                        break;
                    case 1:
                        Vec2.assignC(c, 1, 0);
                        break;
                    case 2:
                        Vec2.assignC(c, 0.5, 0.866);
                        break;
                    case 3:
                        Vec2.assignC(c, -0.5, 0.866);
                        break;
                    case 4:
                        Vec2.assignC(c, -1, 0);
                        break;
                    case 5:
                        Vec2.assignC(c, -0.5, -0.866)
                }
                break;
            case 8:
                switch (a) {
                    case 0:
                        Vec2.assignC(c, 0, -1);
                        break;
                    case 1:
                        Vec2.assignC(c, 1, -1);
                        break;
                    case 2:
                        Vec2.assignC(c, 1, 0);
                        break;
                    case 3:
                        Vec2.assignC(c, 1, 1);
                        break;
                    case 4:
                        Vec2.assignC(c, 0, 1);
                        break;
                    case 5:
                        Vec2.assignC(c, -1, 1);
                        break;
                    case 6:
                        Vec2.assignC(c, -1, 0);
                        break;
                    case 7:
                        Vec2.assignC(c, -1, -1)
                }
                break;
            case 16:
                switch (a) {
                    case 0:
                        Vec2.assignC(c, 0, -1);
                        break;
                    case 1:
                        Vec2.assignC(c, 0.38268, -0.92387);
                        break;
                    case 2:
                        Vec2.assignC(c, 1, -1);
                        break;
                    case 3:
                        Vec2.assignC(c, 0.92387, -0.38268);
                        break;
                    case 4:
                        Vec2.assignC(c, 1, 0);
                        break;
                    case 5:
                        Vec2.assignC(c, 0.92387, 0.38268);
                        break;
                    case 6:
                        Vec2.assignC(c, 1, 1);
                        break;
                    case 7:
                        Vec2.assignC(c, 0.38268, 0.92387);
                        break;
                    case 8:
                        Vec2.assignC(c, 0, 1);
                        break;
                    case 9:
                        Vec2.assignC(c, -0.38268,
                            0.92387);
                        break;
                    case 10:
                        Vec2.assignC(c, -1, 1);
                        break;
                    case 11:
                        Vec2.assignC(c, -0.92387, 0.38268);
                        break;
                    case 12:
                        Vec2.assignC(c, -1, 0);
                        break;
                    case 13:
                        Vec2.assignC(c, -0.92387, -0.38268);
                        break;
                    case 14:
                        Vec2.assignC(c, -1, -1);
                        break;
                    case 15:
                        Vec2.assignC(c, -0.38268, -0.92387)
                }
                break;
            default:
                throw Error("Does not support Direction Vel for numDirs: " + b);
        }
        return c
    };
    ig.getRoundedFaceDir = function(a, b, c, d) {
        a = ig.getDirectionIndex(a, b, c);
        return ig.getDirectionVel(a, c, d)
    };
    var l = Vec2.create();
    ig.isFaceLeftHalf = function(a, b) {
        return ig.getRoundedFaceDir(a.face.x,
            a.face.y, b, l).x < 0
    };
    ig.AnimationSheet = ig.JsonLoadable.extend({
        cacheType: "AnimationSheet",
        namedSheets: {},
        createdSheets: [],
        anims: {},
        sharedAnimData: null,
        replaceAnimationSet: function(a, b) {
            this.anims[a] = b
        },
        removeAnimSet: function(a) {
            delete this.anims[a]
        },
        hasAnimation: function(a) {
            return !!this.anims[a]
        },
        addAnimationSet: function(a, b) {
            this.anims[a] ? this.anims[a].merge(b) : this.anims[a] = b
        },
        clearCached: function() {
            for (var a = 0; a < this.createdSheets.length; ++a) this.createdSheets[a].clearCached()
        },
        getJsonPath: function() {
            return ig.root +
                this.path.toPath("data/animations/", ".json") + ig.getCacheSuffix()
        },
        onload: function(b) {
            if (b)
                if (b.DOCTYPE == "MULTI_DIR_ANIMATION") {
                    a(this, b);
                    d(this, b, e)
                } else if (b.DOCTYPE == "MULTI_ENTITY_ANIMATION") {
                a(this, b);
                var f = {},
                    g;
                for (g in b.parts) f[g] = new ig.MultiEntityAnimationPart(g, this.namedSheets, b.parts[g]);
                var h = b.baseSize;
                this.sharedAnimData = {
                    baseSize: h,
                    parts: f
                };
                for (g in b.anims) {
                    var i = new ig.MultiEntityAnimation(h, f, b.anims[g]);
                    this.addAnimationSet(g, new ig.SingleDirAnimationSet(i))
                }
            } else {
                a(this, b);
                d(this,
                    b, c)
            }
        },
        _getSheet: function(a) {
            var b;
            (b = typeof a == "string" ? this.namedSheets[a] : a) || ig.warn("Sheet '" + a + "' not found in AnimationSheet: " + this.path);
            return b
        }
    })
});
ig.baked = !0;
