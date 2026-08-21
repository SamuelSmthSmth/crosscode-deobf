/*
 * impact.base.animation
 * ---------------------
 * The animation system: `ig.TileSheet` (sprite sheets), `ig.Animation` (a
 * single frame sequence), direction-aware animation sets, `ig.AnimationState`
 * (the per-entity animation player), `ig.AnimationSheet` (JSON-driven multi-
 * sheet definitions), plus the direction-index/velocity helpers used across
 * the game for face directions.
 *
 * Original: deobf/extract/impact.base.animation.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.animation").requires("impact.base.loader", "impact.base.timer", "impact.base.image", "impact.base.sprite-fx").defines(function () {
    /** Blend `color` (at `alpha`) into an accumulating overlay color. */
    function blendOverlayColor(overlay, color, alpha) {
        alpha = alpha * (1 - overlay.colorAlpha);
        overlay.colorAlpha = overlay.colorAlpha + alpha;
        overlay.color.addColor(color, alpha / overlay.colorAlpha);
    }

    /** Resolve a JSON `namedSheets` map into real `ig.TileSheet` objects. */
    function resolveNamedSheets(sheet, json) {
        if (json.namedSheets) {
            for (var name in json.namedSheets) {
                var tileSheet = json.namedSheets[name];
                if (!(tileSheet instanceof ig.TileSheet)) {
                    tileSheet = ig.TileSheet.createFromJson(json.namedSheets[name]);
                    sheet.createdSheets.push(tileSheet);
                }
                sheet.namedSheets[name] = tileSheet;
            }
        }
    }

    /**
     * Recursively load one animation definition (including `SUB` sub-animations)
     * into an animation sheet, via the provided `makeSet` builder.
     */
    function loadAnimationDef(sheet, def, makeSet, inherited) {
        var opts = inherited || {};
        var resolvedSheet = def.sheet;
        opts = ig.merge({}, opts, true);
        ig.merge(opts, def, true);
        if (opts.sheet && typeof opts.sheet == "object" && !(opts.sheet instanceof ig.TileSheet)) {
            resolvedSheet = ig.TileSheet.createFromJson(opts.sheet);
            sheet.createdSheets.push(resolvedSheet);
            opts.sheet = resolvedSheet;
        }
        if (def.name) {
            if ((resolvedSheet = sheet._getSheet(opts.sheet))) {
                resolvedSheet = makeSet(sheet._getSheet(opts.sheet), opts);
                sheet.addAnimationSet(def.name, resolvedSheet);
            }
        }
        if (def.SUB) {
            def = def.SUB;
            for (resolvedSheet = 0; resolvedSheet < def.length; ++resolvedSheet) loadAnimationDef(sheet, def[resolvedSheet], makeSet, opts);
        }
    }

    function makeSingleDirSet(sheet, def) {
        return new ig.SingleDirAnimationSet(new ig.Animation(sheet, def));
    }

    function makeMultiDirSet(sheet, def) {
        var set = new ig.MultiDirAnimationSet(def);
        if (def.frames) {
            set.setAnimations(sheet, def);
        } else if (def.dirFrames) {
            for (var i = 0; i < def.dirFrames.length; i++) {
                var dirDef = ig.merge({}, def, true);
                dirDef.frames = def.dirFrames[i];
                dirDef.flipX = (def.flipX && def.flipX[i]) || false;
                set.addAnimation(new ig.Animation(sheet, dirDef));
            }
        }
        return set;
    }

    ig.TileSheet = ig.Class.extend({
        width: 8,
        height: 8,
        offX: 0,
        offY: 0,
        xCount: 0,
        image: null,

        init: function (path, width, height, offX, offY, xCount) {
            this.width = width;
            this.height = height;
            this.offX = offX || 0;
            this.offY = offY || 0;
            this.xCount = xCount || 0;
            this.image = new ig.Image(path);
        },

        generateHit: function () {
            this.image.addFiltered("damage", "MONOCHROME", {
                factorRed: 1,
                factorGreen: 1.2,
                factorBlue: 2,
                colorAdd: 64
            });
        },

        getTileSrc: function (coord, tileIndex) {
            return this.image.getTileSrc(coord, tileIndex, this.width, this.height, this.offX, this.offY, this.xCount);
        },

        clearCached: function () {
            this.image.decreaseRef();
        }
    });

    ig.TileSheet.createFromJson = function (json) {
        return new ig.TileSheet(json.src, json.width, json.height, json.offX, json.offY, json.xCount);
    };

    ig.ANIM_SHAPE_TYPE = {
        NO_EXPAND: 1,
        Y_EXPAND: 2,
        Z_EXPAND: 3,
        YZ_EXPAND: 4,
        Y_FLAT: 5,
        Z_FLAT: 6
    };

    var animScratchVec = Vec3.create();

    ig.Animation = ig.Class.extend({
        sheet: null,
        shapeType: ig.ANIM_SHAPE_TYPE.NO_EXPAND,
        frameTime: 0,
        stop: false,
        flip: { x: false, y: false },
        pivot: { x: 0, y: 0 },
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

        init: function (sheet, def) {
            if (!(sheet instanceof ig.TileSheet)) throw Error("Tried to initiale Animation without ig.TileSheet object");
            this.sheet = sheet;
            if (def.shapeType) this.shapeType = ig.ANIM_SHAPE_TYPE[def.shapeType];
            this.pivot = def.pivot ? { x: def.pivot.x, y: def.pivot.y } : { x: this.sheet.width / 2, y: this.sheet.height / 2 };
            this.flip.x = def.flipX || false;
            this.flip.y = def.flipY || false;
            this.offset = def.offset || null;
            this.angle = def.angle || 0;
            this.size = def.size || null;
            this.gfxOffset = def.gfxOffset || null;
            this.centerPivot = def.centerPivot || false;
            this.guiSprites = def.guiSprites || false;
            this.wallY = def.wallY || 0;
            if (def.aboveZ) this.aboveZ = def.aboveZ;
            this.renderMode = def.renderMode || null;
            this.globalTiming = def.globalTiming || false;
            this.faceRotate = def.faceRotate || false;
            this.frameTime = def.time || 0.1;
            this.sequence = ig.copy(def.frames);
            if (def.tileOffset) {
                for (var i = 0; i < this.sequence.length; i++) this.sequence[i] = this.sequence[i] == -1 ? -1 : this.sequence[i] + def.tileOffset;
            }
            if (def.fx) {
                var fxDefs = def.fx;
                this.fx = [];
                for (i = 0; i < fxDefs.length; ++i) {
                    var fxDef = fxDefs[i];
                    this.fx.push(new ig.SPRITE_FX[fxDef.type](fxDef));
                }
            }
            this.sequenceSpriteOff = def.framesSpriteOffset || null;
            this.framesGfxOffset = def.framesGfxOffset || null;
            this.framesAlpha = def.framesAlpha || null;
            this.framesAngle = def.framesAngle || null;
            this.framesFlipX = def.framesFlipX || null;
            this.stop = !def.repeat;
        },

        getDuration: function () {
            return this.frameTime * this.sequence.length;
        },

        getFrameCount: function () {
            return this.sequence.length;
        },

        onAnimationStart: null,
        onUpdate: null,

        updateSprite: function (entity, sprite, animState, spriteIdx) {
            var timer = this.globalTiming ? ig.game.backgroundAnimTimer : animState.timer;
            var frameCount = this.sequence.length;
            if (frameCount) {
                var frameIdx = Math.floor(timer / this.frameTime);
                frameIdx = this.stop ? Math.min(frameIdx, frameCount - 1) : frameIdx % frameCount;
                var sheet = this.sheet;
                var image = this.sheet.image;
                var scratch;
                this.size ? sprite.setSize(this.size.x, this.size.y, this.size.z, this.size.y * (this.wallY || 0)) : sprite.setSizeFromEntity(entity, sheet.width, sheet.height, this.shapeType, this.wallY);
                Vec3.assignC(animScratchVec, 0, 0, 0);
                this.offset && Vec3.add(animScratchVec, this.offset);
                var spriteOff;
                if ((spriteOff = this.sequenceSpriteOff)) {
                    scratch = frameIdx * 3;
                    Vec3.addC(animScratchVec, (animState.flipX ? -1 : 1) * spriteOff[scratch], spriteOff[scratch + 1], spriteOff[scratch + 2]);
                }
                sprite.setPosFromEntity(entity, animScratchVec, this.shapeType, this.wallY);
                var tileIndex = this.sequence[frameIdx];
                if (tileIndex == -1) {
                    sprite.setInvisible();
                } else {
                    for (scratch = animState.animMods.length; scratch--;) {
                        var mod = animState.animMods[scratch];
                        mod.spriteIdx == spriteIdx && (tileIndex = tileIndex + mod.tileOffset);
                    }
                    var srcCoords = sheet.getTileSrc(tileSrcScratch, tileIndex);
                    sprite.setImageSrcFromEntity(entity, sheet.width, sheet.height, image, srcCoords.x, srcCoords.y);
                    spriteIdx == 0 ? sprite.setShadowFromEntity(entity) : sprite.setShadow(0, 0, 0, 0);
                    var gfxOffsetX = 0;
                    var gfxOffsetY = 0;
                    if (this.gfxOffset) {
                        gfxOffsetX = (animState.flipX ? -1 : 1) * this.gfxOffset.x;
                        gfxOffsetY = this.gfxOffset.y;
                    }
                    if (this.framesGfxOffset) {
                        scratch = frameIdx * 2;
                        gfxOffsetX = gfxOffsetX + (animState.flipX ? -1 : 1) * (this.framesGfxOffset[scratch] || 0);
                        gfxOffsetY = gfxOffsetY + (this.framesGfxOffset[scratch + 1] || 0);
                    }
                    var alpha = animState.alpha;
                    this.framesAlpha && (alpha = alpha * this.framesAlpha[frameIdx]);
                    var angle = animState.angle + (this.angle * Math.PI * 2 / 360);
                    this.faceRotate && entity.face && (angle = angle + Vec2.clockangle(entity.face));
                    this.framesAngle && (angle = angle + (animState.flipX ? -1 : 1) * this.framesAngle[frameIdx] * Math.PI * 2 / 360);
                    var flipX = animState.flipX ? !this.flip.x : this.flip.x;
                    this.framesFlipX && this.framesFlipX[frameIdx] && (flipX = !flipX);
                    sprite.setAlpha(alpha);
                    sprite.setTransform(animState.scaleX, animState.scaleY, angle);
                    sprite.aboveZ = this.aboveZ;
                    sprite.setGfxOffset(gfxOffsetX, gfxOffsetY);
                    sprite.setFlip(flipX, this.flip.y);
                    sprite.setPivot(this.pivot.x, this.pivot.y);
                    this.centerPivot && sprite.centerPivot(entity);
                    sprite.renderMode = this.renderMode;
                    if (this.fx) {
                        var duration = this.frameTime * this.sequence.length;
                        for (scratch = 0; scratch < this.fx.length; ++scratch) this.fx[scratch].updateSprite(sprite, timer, duration);
                    }
                }
            } else {
                sprite.setInvisible();
            }
        }
    });

    ig.MultiEntityAnimationPart = ig.Class.extend({
        name: null,
        group: null,
        persistAnim: null,
        collType: 0,
        heightShape: 0,
        padding: Vec2.create(),
        size: { x: 0, y: 0, z: 0 },
        pos: { x: 0, y: 0, z: 0 },
        animSheet: null,
        synced: false,

        init: function (name, namedSheets, def) {
            this.name = name;
            this.group = def.group;
            this.persistAnim = def.persistAnim;
            this.collType = ig.COLLTYPE[def.collType || "BLOCK"];
            this.heightShape = ig.COLL_HEIGHT_SHAPE[def.heightShape || "NONE"];
            Vec3.assign(this.size, def.size);
            def.padding && Vec2.assign(this.padding, def.padding);
            Vec3.assign(this.pos, def.pos);
            name = def.anims;
            name.namedSheets = namedSheets;
            this.animSheet = new ig.AnimationSheet(name);
        },

        createSubEntity: function (entity, baseSize) {
            var pos = entity.getCenter(multiEntityScratchA);
            pos.z = entity.coll.pos.z;
            pos.x = pos.x - baseSize.x / 2;
            pos.y = pos.y - baseSize.y / 2;
            Vec3.add(pos, this.pos);
            var partClass = entity.getAnimPartyEntityClass ? entity.getAnimPartyEntityClass() : ig.AnimationPartEntity;
            return ig.game.spawnEntity(partClass, pos.x, pos.y, pos.z, {
                owner: entity,
                size: this.size,
                padding: this.padding,
                partName: this.name,
                group: this.group,
                persistAnim: this.persistAnim,
                animSheet: this.animSheet,
                collType: this.collType,
                heightShape: this.heightShape
            });
        }
    });

    var multiEntityScratchA = Vec3.create();
    var multiEntityScratchB = Vec3.create();

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

        init: function (baseSize, parts, def) {
            Vec3.assign(this.baseSize, baseSize);
            this.parts = parts;
            this.frameTime = def.time;
            this.frameCount = def.frameCount;
            this.stop = !def.repeat;
            this.anchor = def.anchor || null;
            this.flipDir = ig.MULTI_ANIM_FLIP[def.flipDir] || ig.MULTI_ANIM_FLIP.NONE;
            var partAnimDefs = def.partAnims;
            var name;
            for (name in partAnimDefs) this.partAnims[name] = {
                anim: partAnimDefs[name].anim,
                posFrames: partAnimDefs[name].posFrames,
                reset: partAnimDefs[name].reset,
                collType: ig.COLLTYPE[partAnimDefs[name].collType] || null
            };
        },

        getAnchorOffset: function (faceX) {
            if (!this.anchor) return null;
            var offset = Vec3.create(this.anchor);
            if (this.flipDir && ((this.flipDir == ig.MULTI_ANIM_FLIP.LEFT && faceX < 0) || (this.flipDir == ig.MULTI_ANIM_FLIP.RIGHT && faceX >= 0))) offset.x = -offset.x;
            return offset;
        },

        getDuration: function () {
            return this.frameTime * this.frameCount;
        },

        getFrameCount: function () {
            return this.frameCount;
        },

        onAnimationStart: function (entity) {
            var coll = entity.coll;
            coll.subColls.length == 0 && ig.MultiEntityAnimation.initSubEntities(entity, this.parts, this.baseSize);
            entity.animState.rewind();
            var subColls = coll.subColls;
            var count = subColls.length;
            subColls = coll.subColls;
            count = subColls.length;
            for (; count--;) {
                var partColl = subColls[count];
                var partEntity = partColl.entity;
                var partAnim = this.partAnims[partEntity.partName];
                if (partAnim) {
                    if (partEntity._hidden) {
                        partEntity.show(true);
                        partEntity.justAdded = true;
                    }
                    partEntity.coll.setType(partAnim.collType || partEntity.defaultCollType);
                    if (!partEntity.persistAnim || window.wm) {
                        partEntity.setCurrentAnim(partAnim.anim, partAnim.reset);
                        partAnim.reset && partEntity.animState.rewind();
                        partEntity.synced = partAnim.reset;
                        partEntity.updateAnim();
                    }
                } else {
                    partEntity._hidden || partEntity.hide();
                }
            }
        },

        onUpdate: function (entity, animState) {
            var coll = entity.coll;
            coll.subColls.length == 0 && this.initSubEntities(entity);
            var origin = coll.getCenter(multiEntityScratchA);
            origin.z = coll.pos.z;
            origin.x = origin.x - this.baseSize.x / 2;
            origin.y = origin.y - this.baseSize.y / 2;
            var flipped = false;
            if (this.flipDir && entity.face && ((this.flipDir == ig.MULTI_ANIM_FLIP.LEFT && entity.face.x < 0) || (this.flipDir == ig.MULTI_ANIM_FLIP.RIGHT && entity.face.x >= 0))) flipped = true;
            var frameCount = this.frameCount;
            var frameIdx = Math.floor(animState.timer / this.frameTime);
            frameIdx = ((this.stop ? Math.min(frameIdx, frameCount - 1) : frameIdx % frameCount) * 3);
            coll = coll.subColls;
            frameCount = coll.length;
            for (; frameCount--;) {
                var subColl = coll[frameCount];
                var partEntity = subColl.entity;
                var partAnim = this.partAnims[partEntity.partName];
                var part = this.parts[partEntity.partName];
                if (partAnim) {
                    var animStateRef = partEntity.animState;
                    if (partEntity.synced) animStateRef.timer = animState.timer - ig.system.tick;
                    animStateRef.flipX = flipped;
                    animStateRef.alpha = animState.alpha;
                    animStateRef.scaleX = animState.scaleX;
                    animStateRef.scaleY = animState.scaleY;
                    var posFrames = partAnim.posFrames;
                    var pos = Vec3.assign(multiEntityScratchB, part.pos);
                    Vec3.addC(pos, posFrames[frameIdx], posFrames[frameIdx + 1], posFrames[frameIdx + 2]);
                    if (flipped) pos.x = this.baseSize.x - pos.x - subColl.size.x;
                    Vec3.add(pos, origin);
                    subColl.setPos(pos.x, pos.y, pos.z, !partEntity.justAdded);
                    partEntity.justAdded = false;
                }
            }
        },

        updateSprite: function (entity, sprite, animState) {
            sprite.setImageSrc(null);
            sprite.setSize(this.baseSize.x, this.baseSize.y, 0);
            sprite.setPosFromEntity(entity);
            sprite.setShadowFromEntity(entity);
            sprite.setAlpha(animState.alpha);
        }
    });

    ig.MultiEntityAnimation.initSubEntities = function (entity, parts, baseSize) {
        var coll = entity.coll;
        coll.setSize(baseSize.x, baseSize.y, baseSize.z);
        coll.type = ig.COLLTYPE.IGNORE;
        coll.setSize(baseSize.x, baseSize.y, baseSize.z);
        for (var name in parts) {
            var part = parts[name].createSubEntity(entity, baseSize);
            part.animState.alpha = entity.animState.alpha;
            coll.addSubCollEntry(part.coll);
            part.initAnimations();
        }
    };

    var tileSrcScratch = {};

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

        init: function () {
            this.timer = 0;
        },

        reset: function () {
            this.timer = 0;
            var proto = this.constructor.prototype;
            this.animations = proto.animations;
            this.followUp = proto.followUp;
            this.loopCount = proto.loopCount;
            this.alpha = proto.alpha;
            this.angle = proto.angle;
            this.scaleX = proto.scaleX;
            this.scaleY = proto.scaleY;
            this.colorOverlays.length = 0;
        },

        shuffleTime: function () {
            var anim = this.animations[0];
            if (anim) this.timer = anim.getDuration() * Math.random();
        },

        hasAnimations: function () {
            return !!this.animations;
        },

        setAnimation: function (entity, animations) {
            if (animations && this.animations != animations) {
                this.animations = animations;
                for (var i = this.animations.length; i--;) {
                    var anim = animations[i];
                    window.wm || (anim.onAnimationStart && anim.onAnimationStart(entity));
                }
            }
        },

        addColorOverlay: function (overlay) {
            this.colorOverlays.push(overlay);
        },

        getFrame: function () {
            if (!this.animations) return 0;
            var anim = this.animations[0];
            if (!anim) return 0;
            var frameCount = anim.getFrameCount();
            var frameIdx = Math.floor(this.timer / anim.frameTime);
            return anim.stop ? Math.min(frameIdx, frameCount - 1) : frameIdx % frameCount;
        },

        isStatic: function () {
            if (!this.animations) return true;
            for (var i = this.animations.length; i--;) {
                if (this.animations[i].getFrameCount() > 1) return false;
            }
            return true;
        },

        isRepeat: function () {
            return !this.animations ? false : !this.animations[0].stop;
        },

        hasStopped: function () {
            if (!this.animations) return false;
            var anim = this.animations[0];
            var frameIdx = Math.floor(this.timer / anim.frameTime);
            return anim.stop && frameIdx >= anim.getFrameCount();
        },

        rewind: function () {
            this.loopCount = this.timer = 0;
            return this;
        },

        update: function (entity, speedFactor) {
            this.timer = this.timer + ig.system.tick * speedFactor;
            var count = this.animations.length;
            for (this.loopCount = -1; count--;) {
                var anim = this.animations[count];
                var loops = Math.floor(this.timer / anim.getDuration());
                this.loopCount = this.loopCount == -1 ? loops : Math.min(this.loopCount, loops);
                anim.onUpdate && anim.onUpdate(entity, this, speedFactor);
            }
        },

        updateSprite: function (entity) {
            if (this.animations) {
                entity.setSpriteCount(this.animations.length, this.animations.length > 0 && this.animations[0].guiSprites);
                for (var i = this.animations.length; i--;) {
                    var anim = this.animations[i];
                    var sprite = entity.sprites[i];
                    !anim || (anim.sheet && !anim.sheet.image.loaded) ? sprite.setInvisible() : anim.updateSprite(entity, sprite, this, i);
                }
                this.updateSpriteColor(entity);
            } else {
                entity.setSpriteCount(0);
            }
        },

        updateSpriteColor: function (entity) {
            var normalAccum = overlayScratchNormal;
            var lighterAccum = overlayScratchLighter;
            normalAccum.color = null;
            normalAccum.colorAlpha = 0;
            lighterAccum.color = null;
            lighterAccum.colorAlpha = 0;
            var perSprite = null;
            for (var i = this.colorOverlays.length; i--;) {
                var overlay = this.colorOverlays[i];
                var target = overlay.lighter ? lighterAccum : normalAccum;
                if (overlay.color) {
                    if (overlay.spriteFilter !== null) {
                        perSprite || (perSprite = []);
                        perSprite[overlay.spriteFilter] || (perSprite[overlay.spriteFilter] = {
                            normal: { color: null, colorAlpha: 0 },
                            lighter: { color: null, colorAlpha: 0 }
                        });
                        target = overlay.lighter ? perSprite[overlay.spriteFilter].lighter : perSprite[overlay.spriteFilter].normal;
                    }
                    if (target.color) {
                        blendOverlayColor(target, overlay.color, overlay.alpha);
                    } else {
                        target.color = new ig.RGBColor(overlay.color);
                        target.colorAlpha = overlay.alpha;
                    }
                } else {
                    this.colorOverlays.splice(i, 1);
                }
            }
            for (i = entity.sprites.length; i--;) {
                var spriteFilter = perSprite && perSprite[i];
                if (spriteFilter && spriteFilter.normal.color) {
                    normalAccum.color && blendOverlayColor(spriteFilter.normal, normalAccum.color, normalAccum.colorAlpha);
                    entity.sprites[i].setOverlayColor(spriteFilter.normal.color.toRGB(), spriteFilter.normal.colorAlpha);
                } else {
                    entity.sprites[i].setOverlayColor(normalAccum.color ? normalAccum.color.toRGB() : null, normalAccum.colorAlpha);
                }
                if (spriteFilter && spriteFilter.lighter.color) {
                    lighterAccum.color && blendOverlayColor(spriteFilter.lighter, lighterAccum.color, lighterAccum.colorAlpha);
                    entity.sprites[i].setLighterOverlayColor(spriteFilter.lighter.color.toRGB(), spriteFilter.lighter.colorAlpha);
                } else {
                    entity.sprites[i].setLighterOverlayColor(lighterAccum.color ? lighterAccum.color.toRGB() : null, lighterAccum.colorAlpha);
                }
            }
        }
    });

    ig.AnimModification = ig.Class.extend({
        entity: null,
        name: null,
        spriteIdx: 0,
        tileOffset: 0,

        init: function (entity, spriteIdx, name) {
            this.entity = entity;
            this.spriteIdx = spriteIdx;
            (this.name = name) && ig.AnimModification.removeMods(entity, name);
            entity.animState.animMods.push(this);
        },

        remove: function () {
            this.entity.animState.animMods.erase(this);
        },

        onActionEndDetach: function () {
            this.remove();
        }
    });

    ig.AnimModification.removeMods = function (entity, name) {
        for (var i = entity.animState.animMods.length; i--;) {
            (!name || entity.animState.animMods[i].name == name) && entity.animState.animMods[i].remove();
        }
    };

    var overlayScratchNormal = {};
    var overlayScratchLighter = {};

    ig.ColorOverlay = ig.Class.extend({
        color: null,
        alpha: null,
        spriteFilter: null,
        lighter: false,

        init: function (color, alpha, spriteFilter, lighter) {
            this.color = new ig.RGBColor(color);
            this.alpha = alpha;
            if (spriteFilter !== void 0) this.spriteFilter = spriteFilter;
            this.lighter = lighter;
        },

        clear: function () {
            this.color = null;
        }
    });

    ig.SingleDirAnimationSet = ig.Class.extend({
        animations: [],

        init: function (animation) {
            this.animations.push(animation);
        },

        getAnimations: function () {
            return this.animations;
        },

        getAnchorOffset: function (faceX, faceY) {
            var anim = this.animations[0];
            return anim && anim.getAnchorOffset ? anim.getAnchorOffset(faceX, faceY) : null;
        },

        getDuration: function () {
            for (var duration = 0, i = this.animations.length; i--;) duration = Math.max(this.animations[i].getDuration(), duration);
            return duration;
        },

        merge: function (other) {
            this.animations.push.apply(this.animations, other.animations);
        }
    });

    ig.MultiDirAnimationSet = ig.Class.extend({
        numDirs: 0,
        animations: [],
        anchorOffsetX: null,
        anchorOffsetY: null,
        anchorOffsetZ: null,

        init: function (def) {
            this.numDirs = def.dirs * 1;
            this.anchorOffsetX = def.anchorOffsetX;
            this.anchorOffsetY = def.anchorOffsetY;
            this.anchorOffsetZ = def.anchorOffsetZ;
        },

        setAnimations: function (sheet, def) {
            var tileOffsets = def.tileOffsets;
            var flipXList = def.flipX;
            var baseOffset = def.offset;
            var dirOffsets = def.dirOffsets;
            var dirAngles = def.dirAngles;
            var allDirFlipX = def.allDirFlipX || false;
            def.angle = 0;
            this.numDirs = def.tileOffsets.length;
            this.animations = [];
            for (var i = 0; i < this.numDirs; i++) {
                var dir = allDirFlipX ? (this.numDirs - i) % this.numDirs : i;
                def.tileOffset = tileOffsets[dir];
                def.flipX = (flipXList && flipXList[dir]) || 0;
                allDirFlipX && (def.flipX = !def.flipX);
                if (dirOffsets) {
                    var offset = Vec3.create();
                    baseOffset && Vec3.add(offset, baseOffset);
                    offset.x = offset.x + ((dirOffsets[dir] && dirOffsets[dir][0]) || 0) * (allDirFlipX ? -1 : 1);
                    offset.y = offset.y + ((dirOffsets[dir] && dirOffsets[dir][1]) || 0);
                    offset.z = offset.z + ((dirOffsets[dir] && dirOffsets[dir][2]) || 0);
                    def.offset = offset;
                }
                dirAngles && (def.angle = dirAngles[dir]);
                this.animations[i] = [new ig.Animation(sheet, def)];
            }
        },

        addAnimation: function (animation) {
            this.animations.push([animation]);
        },

        merge: function (other) {
            if (this.numDirs != other.numDirs) throw Error("Tried to merge Multi Dir Anims with different number of directions. Not supported.");
            for (var i = 0; i < this.numDirs; ++i) {
                var dirAnims = this.animations[i];
                dirAnims.push.apply(dirAnims, other.animations[i]);
            }
        },

        getAnchorOffset: function (faceX, faceY) {
            if (!this.anchorOffsetX && !this.anchorOffsetY && !this.anchorOffsetZ) return null;
            var dir = ig.getDirectionIndex(faceX, faceY, this.numDirs);
            return {
                x: (this.anchorOffsetX && (this.anchorOffsetX.length ? this.anchorOffsetX[dir] : this.anchorOffsetX)) || 0,
                y: (this.anchorOffsetY && (this.anchorOffsetY.length ? this.anchorOffsetY[dir] : this.anchorOffsetY)) || 0,
                z: (this.anchorOffsetZ && (this.anchorOffsetZ.length ? this.anchorOffsetZ[dir] : this.anchorOffsetZ)) || 0
            };
        },

        getAnimations: function (entity) {
            entity = ig.getDirectionIndex(entity.face.x, entity.face.y, this.numDirs);
            return this.animations[entity];
        },

        getDuration: function () {
            for (var duration = 0, dirAnims = this.animations[0], i = dirAnims.length; i--;) duration = Math.max(dirAnims[i].getDuration(), duration);
            return duration;
        }
    });

    /** Convert a face (x, y) direction vector into an index for `numDirs` directions. */
    ig.getDirectionIndex = function (faceX, faceY, numDirs) {
        switch (numDirs) {
            case 1:
                return 0;
            case 2:
                return faceX >= 0 ? 0 : 1;
            case 4:
                return Math.abs(faceY) > Math.abs(faceX) ? (faceY < 0 ? 0 : 2) : faceX > 0 ? 1 : 3;
            case 6:
                return faceX >= 0 ? faceY <= 0 ? 0 + (57 * faceX > -100 * faceY) : 1 + (57 * faceX < 100 * faceY) : faceY <= 0 ? 4 + (-57 * faceX < -100 * faceY) : 3 + (-57 * faceX > 100 * faceY);
            case 8:
                return Math.abs(faceY) > 2.414 * Math.abs(faceX) ? (faceY < 0 ? 0 : 4) : Math.abs(faceX) > 2.414 * Math.abs(faceY) ? (faceX > 0 ? 2 : 6) : faceX > 0 ? (faceY < 0 ? 1 : 3) : faceY > 0 ? 5 : 7;
            case 16:
                var ax = Math.abs(faceX);
                var ay = Math.abs(faceY);
                return ay > 5.0273 * ax ? (faceY < 0 ? 0 : 8) : ay < 0.1989 * ax ? (faceX > 0 ? 4 : 12) : ay > 1.4966 * ax ? (faceX > 0 ? (faceY < 0 ? 1 : 7) : (faceY > 0 ? 9 : 15)) : ay > 0.6682 * ax ? (faceX > 0 ? (faceY < 0 ? 2 : 6) : (faceY > 0 ? 10 : 14)) : faceX > 0 ? (faceY < 0 ? 3 : 5) : faceY > 0 ? 11 : 13;
        }
    };

    /** Convert a direction index (for `numDirs`) into a unit direction vector. */
    ig.getDirectionVel = function (dirIdx, numDirs, out) {
        out = out || Vec2.create();
        switch (numDirs) {
            case 1:
                Vec2.assignC(out, 0, 1);
                break;
            case 2:
                switch (dirIdx) {
                    case 0: Vec2.assignC(out, 1, 0); break;
                    case 1: Vec2.assignC(out, -1, 0); break;
                }
                break;
            case 4:
                switch (dirIdx) {
                    case 0: Vec2.assignC(out, 0, -1); break;
                    case 1: Vec2.assignC(out, 1, 0); break;
                    case 2: Vec2.assignC(out, 0, 1); break;
                    case 3: Vec2.assignC(out, -1, 0); break;
                }
                break;
            case 6:
                switch (dirIdx) {
                    case 0: Vec2.assignC(out, 0.5, -0.866); break;
                    case 1: Vec2.assignC(out, 1, 0); break;
                    case 2: Vec2.assignC(out, 0.5, 0.866); break;
                    case 3: Vec2.assignC(out, -0.5, 0.866); break;
                    case 4: Vec2.assignC(out, -1, 0); break;
                    case 5: Vec2.assignC(out, -0.5, -0.866); break;
                }
                break;
            case 8:
                switch (dirIdx) {
                    case 0: Vec2.assignC(out, 0, -1); break;
                    case 1: Vec2.assignC(out, 1, -1); break;
                    case 2: Vec2.assignC(out, 1, 0); break;
                    case 3: Vec2.assignC(out, 1, 1); break;
                    case 4: Vec2.assignC(out, 0, 1); break;
                    case 5: Vec2.assignC(out, -1, 1); break;
                    case 6: Vec2.assignC(out, -1, 0); break;
                    case 7: Vec2.assignC(out, -1, -1); break;
                }
                break;
            case 16:
                switch (dirIdx) {
                    case 0: Vec2.assignC(out, 0, -1); break;
                    case 1: Vec2.assignC(out, 0.38268, -0.92387); break;
                    case 2: Vec2.assignC(out, 1, -1); break;
                    case 3: Vec2.assignC(out, 0.92387, -0.38268); break;
                    case 4: Vec2.assignC(out, 1, 0); break;
                    case 5: Vec2.assignC(out, 0.92387, 0.38268); break;
                    case 6: Vec2.assignC(out, 1, 1); break;
                    case 7: Vec2.assignC(out, 0.38268, 0.92387); break;
                    case 8: Vec2.assignC(out, 0, 1); break;
                    case 9: Vec2.assignC(out, -0.38268, 0.92387); break;
                    case 10: Vec2.assignC(out, -1, 1); break;
                    case 11: Vec2.assignC(out, -0.92387, 0.38268); break;
                    case 12: Vec2.assignC(out, -1, 0); break;
                    case 13: Vec2.assignC(out, -0.92387, -0.38268); break;
                    case 14: Vec2.assignC(out, -1, -1); break;
                    case 15: Vec2.assignC(out, -0.38268, -0.92387); break;
                }
                break;
            default:
                throw Error("Does not support Direction Vel for numDirs: " + numDirs);
        }
        return out;
    };

    ig.getRoundedFaceDir = function (faceX, faceY, numDirs, out) {
        faceX = ig.getDirectionIndex(faceX, faceY, numDirs);
        return ig.getDirectionVel(faceX, numDirs, out);
    };

    var faceHalfScratch = Vec2.create();

    ig.isFaceLeftHalf = function (entity, numDirs) {
        return ig.getRoundedFaceDir(entity.face.x, entity.face.y, numDirs, faceHalfScratch).x < 0;
    };

    ig.AnimationSheet = ig.JsonLoadable.extend({
        cacheType: "AnimationSheet",
        namedSheets: {},
        createdSheets: [],
        anims: {},
        sharedAnimData: null,

        replaceAnimationSet: function (name, set) {
            this.anims[name] = set;
        },

        removeAnimSet: function (name) {
            delete this.anims[name];
        },

        hasAnimation: function (name) {
            return !!this.anims[name];
        },

        addAnimationSet: function (name, set) {
            this.anims[name] ? this.anims[name].merge(set) : (this.anims[name] = set);
        },

        clearCached: function () {
            for (var i = 0; i < this.createdSheets.length; ++i) this.createdSheets[i].clearCached();
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/animations/", ".json") + ig.getCacheSuffix();
        },

        onload: function (data) {
            if (data) {
                if (data.DOCTYPE == "MULTI_DIR_ANIMATION") {
                    resolveNamedSheets(this, data);
                    loadAnimationDef(this, data, makeMultiDirSet);
                } else if (data.DOCTYPE == "MULTI_ENTITY_ANIMATION") {
                    resolveNamedSheets(this, data);
                    var parts = {};
                    var name;
                    for (name in data.parts) parts[name] = new ig.MultiEntityAnimationPart(name, this.namedSheets, data.parts[name]);
                    var baseSize = data.baseSize;
                    this.sharedAnimData = {
                        baseSize: baseSize,
                        parts: parts
                    };
                    for (name in data.anims) {
                        var anim = new ig.MultiEntityAnimation(baseSize, parts, data.anims[name]);
                        this.addAnimationSet(name, new ig.SingleDirAnimationSet(anim));
                    }
                } else {
                    resolveNamedSheets(this, data);
                    loadAnimationDef(this, data, makeSingleDirSet);
                }
            }
        },

        _getSheet: function (sheetRef) {
            var sheet;
            (sheet = typeof sheetRef == "string" ? this.namedSheets[sheetRef] : sheetRef) || ig.warn("Sheet '" + sheetRef + "' not found in AnimationSheet: " + this.path);
            return sheet;
        }
    });
});
ig.baked = !0;
