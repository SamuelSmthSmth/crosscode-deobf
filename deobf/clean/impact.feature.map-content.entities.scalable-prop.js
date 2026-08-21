/**
 * impact.feature.map-content.entities.scalable-prop
 * =================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.scalable-prop")`.
 *
 * `ig.ENTITY.ScalableProp`: a prop whose size is set in the editor and drawn
 * as a repeating pattern plus optional "end" pieces (west/east/north/south)
 * from a scale-props sheet, with optional animation frames.
 */
ig.module("impact.feature.map-content.entities.scalable-prop")
    .requires("impact.base.entity")
    .defines(function () {

    /** Loads and caches a scale-props/<name>.json sheet. */
    ig.ScalePropSheet = ig.JsonLoadable.extend({
        cacheType: "ScalablePropSheet",
        entries: {},

        onCacheCleared: function () {},

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/scale-props/", ".json") + ig.getCacheSuffix();
        },

        onload: function (data) {
            if (data.DOCTYPE != "SCALABLE_PROP_SHEET") throw Error("Invalid JSON Format for ScalablePropSheet");
            this.entries = data.entries;
        },

        getScalableProp: function (name) {
            return this.entries[name];
        }
    });

    /** How each end piece eats into the pattern's remaining size / offset. */
    var endConfig = {
        west: {
            xAdd: true,
            wSub: true
        },
        east: {
            wSub: true,
            right: true
        },
        north: {
            yAdd: true,
            hSub: true,
            top: true
        },
        south: {
            hSub: true,
            bottom: true
        }
    };

    ig.ENTITY.ScalableProp = ig.AnimatedEntity.extend({
        terrain: 0,
        propConfig: null,
        scalePropSheet: null,
        hasSize: false,
        gfx: null,
        patternSheet: null,
        patternOffset: {
            x: 0,
            y: 0
        },
        pivot: null,
        wallY: 0,
        renderHeight: 0,
        renderMode: null,
        gfxEnds: [],
        animFrames: null,
        animTime: null,
        timePadding: 0,
        timer: 0,
        touchVar: null,
        _triggered: false,
        effects: {
            sheet: null,
            show: null,
            hide: null,
            hideHandle: null
        },

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                propConfig: {
                    _type: "ScalablePropConfig",
                    _info: "Type of Scalable Prop"
                },
                patternOffset: {
                    _type: "Vec2",
                    _info: "Start offset of the repeating pattern in pixels"
                },
                timeOffset: {
                    _type: "Number",
                    _info: "Time offset of the animation"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                touchVar: {
                    _type: "VarName",
                    _info: "Variable to be changed when prop is touched",
                    _optional: true
                },
                blockNavMap: {
                    _type: "Boolean",
                    __info: "If true, block path map and update when destroyed"
                },
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _optional: true
                }
            },
            label: function () {
                return "";
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.touchVar = settings.touchVar || null;
            settings.size ? this.hasSize = true : this.coll.setSize(32, 32, 0);
            settings.patternOffset && Vec2.assign(this.patternOffset, settings.patternOffset);
            this.timer = settings.timeOffset || 0;
            this.blockNavMap = settings.blockNavMap;
            settings.hideCondition ? this.hideManager = new ig.EntityHideManager(settings.hideCondition) :
                this.varsChanged = null;
            if (settings.propConfig && settings.propConfig.name && settings.propConfig.sheet) {
                this.propConfig = settings.propConfig;
                this.scalePropSheet = new ig.ScalePropSheet(settings.propConfig.sheet);
                this.scalePropSheet.addLoadListener(this);
            }
        },

        show: function (value) {
            this.parent(value);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null;
            }
            this._triggered = this.coll.ignoreCollision = false;
            if (!value && this.effects.sheet) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget(this.effects.show, this, {});
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
            this.skyBlock && !this.skyBlockEntity && this.createSkyBlock();
        },

        createSkyBlock: function () {
            var coll = this.coll;
            this.skyBlockEntity = ig.game.spawnEntity(ig.ENTITY.HiddenSkyBlock, coll.pos.x, coll.pos.y, coll.pos.z, {
                size: Vec2.create(this.coll.size)
            });
            this.skyBlockEntity.coll.setType(this.coll.type);
        },

        onHideRequest: function () {
            this.navBlocker && this.navBlocker.remove();
            this.navBlocker = null;
            this.coll.ignoreCollision = true;
            if (this.skyBlockEntity) {
                this.skyBlockEntity.kill();
                this.skyBlockEntity = null;
            }
            if (this.effects.sheet) {
                this.effects.hideHandle = this.effects.sheet.spawnOnTarget(this.effects.hide, this, {
                    callback: this
                });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            } else {
                this.hide();
            }
        },

        /** Apply the loaded sheet entry: size clamping, pattern + end pieces. */
        onLoadableComplete: function (prop) {
            if (!prop) throw Error("Loading Failed!");
            var coll = this.coll;
            if (prop = this.scalePropSheet.getScalableProp(this.propConfig.name)) {
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                    this._wm.scalableX = prop.scalableX;
                    this._wm.scalableY = prop.scalableY;
                    this._wm.scalableStep = prop.scalableStep;
                }
                if (this.hasSize) {
                    if (!prop.scalableX && coll.size.x != prop.baseSize.x ||
                        (coll.size.x - prop.baseSize.x) % prop.scalableStep != 0) {
                        coll.size.x = prop.baseSize.x;
                        coll.size.y = prop.baseSize.y;
                    }
                    if (!prop.scalableY && coll.size.y != prop.baseSize.y || (coll.size.y - prop.baseSize.y) % prop.scalableStep != 0) {
                        coll.size.x = prop.baseSize.x;
                        coll.size.y = prop.baseSize.y;
                    }
                } else {
                    Vec2.assign(coll.size, prop.baseSize);
                }
                if (prop.ballKill) {
                    this.ballKill = {
                        fx: prop.ballKill.fx ? new ig.EffectHandle(prop.ballKill.fx) : null
                    };
                }
                coll.size.z = prop.baseSize.z;
                this.coll.setType(ig.COLLTYPE[prop.collType] || this.coll.type);
                this.wallY = prop.wallY || 0;
                this.terrain = ig.TERRAIN[prop.terrain] || 0;
                this.renderHeight = coll.size.z;
                if (prop.renderHeight != void 0) this.renderHeight = prop.renderHeight;
                this.renderMode = prop.renderMode;
                this.animFrames = prop.animFrames || null;
                this.animTime = prop.animTime || 0.1;
                this.timePadding = prop.timePadding || null;
                if (prop.effects) {
                    this.effects.sheet = new ig.EffectSheet(prop.effects.sheet);
                    this.effects.hide = prop.effects.hide;
                    this.effects.show = prop.effects.show;
                }
                this.pivot = prop.pivot || null;
                this.skyBlock = prop.skyBlock;
                var patterns = prop.patterns,
                    gfxBaseX = prop.gfxBaseX || 0,
                    gfxBaseY = prop.gfxBaseY || 0;
                this.patternSheet = new ig.ImagePatternSheet(prop.gfx,
                    prop.scalableX ? prop.scalableY ? ig.ImagePattern.OPT.REPEAT_X_AND_Y : ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y,
                    patterns.w, patterns.h, gfxBaseX + (patterns.x || 0), gfxBaseY + (patterns.y || 0), patterns.xCount || 1, patterns.yCount || 1);
                this.gfx = new ig.Image(prop.gfx);
                if (patterns = this.propConfig.ends) {
                    for (var dir in prop.gfxEnds) {
                        var end = prop.gfxEnds[dir][patterns[dir]];
                        if (end) {
                            end = {
                                x: end.x,
                                y: end.y,
                                w: end.w,
                                h: end.h,
                                zHeight: end.zHeight == void 0 ? this.renderHeight : end.zHeight,
                                offX: end.offX,
                                offY: end.offY,
                                flipX: end.flipX || false,
                                flipY: end.flipY || false,
                                animFrames: end.animFrames || null,
                                renderMode: end.renderMode || null,
                                fullBack: end.fullBack || false
                            };
                            ig.merge(end, endConfig[dir]);
                            end.x = end.x + gfxBaseX;
                            end.y = end.y + gfxBaseY;
                            this.gfxEnds.push(end);
                        }
                    }
                }
                this.setSpriteCount(1 + this.gfxEnds.length);
                if (!this.animFrames && !this.animTime && !this.timePadding) {
                    if (this.hideManager) this.hideManager.efficientMode = true;
                    this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                }
            }
        },

        initSprites: function () {
            this.setSpriteCount(1 + this.gfxEnds.length);
        },

        onKill: function (entity) {
            this.navBlocker && this.navBlocker.remove();
            this.parent(entity);
            this.scalePropSheet && this.scalePropSheet.decreaseRef();
            this.patternSheet && this.patternSheet.decreaseRef();
            this.effects.sheet && this.effects.sheet.decreaseRef();
            this.ballKill && this.ballKill.fx && this.ballKill.fx.clearCached();
            this.gfx && this.gfx.decreaseRef();
        },

        update: function () {
            this.skyBlock && (!this.skyBlockEntity && !this.effects.hideHandle) && this.createSkyBlock();
            this.hideManager && this.hideManager.update(this);
            this.parent();
            if (this.animFrames || this.timePadding) this.timer = this.timer + ig.system.tick;
        },

        onEffectEvent: function (effect) {
            if (effect == this.effects.hideHandle && effect.isDone()) {
                this.effects.hideHandle = null;
                !this.animFrames && (!this.animTime && !this.timePadding) && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                this.hide();
            }
        },

        updateSprites: function () {
            var coll = this.coll;
            if (this.patternSheet) {
                var frame = 0,
                    timeX = 0,
                    timeY = 0;
                if (this.animFrames) {
                    var animLen = this.animFrames.length * this.animTime,
                        frame = Math.floor(this.timer % animLen / this.animTime),
                        frame = this.animFrames[frame];
                }
                var baseFrame = frame;
                for (var posX = coll.pos.x, posY = coll.pos.y, offsetX = 0, offsetY = 0, sizeX = coll.size.x, sizeY = coll.size.y, hasBottom = false, m = 0; m < this.gfxEnds.length; ++m) {
                    var end = this.gfxEnds[m],
                        endZ = coll.pos.z,
                        height = end.zHeight;
                    if (end.top && !end.fullBack) {
                        endZ = endZ + this.renderHeight;
                        height = height - this.renderHeight;
                    }
                    var drawHeight = end.h - height;
                    this.sprites[m].setPos(coll.pos.x + (end.right ? coll.size.x - end.w : 0),
                        coll.pos.y + (end.bottom ? coll.size.y - drawHeight : 0), endZ);
                    this.sprites[m].setSize(end.w, drawHeight, height, Math.round(this.wallY) * drawHeight);
                    this.sprites[m].setPivot(end.w / 2, (drawHeight + height) / 2);
                    var gfxX = end.x,
                        gfxY = end.y,
                        frame = baseFrame;
                    if (end.animFrames) {
                        var endAnimLen = end.animFrames.length * this.animTime,
                            frame = Math.floor(this.timer % endAnimLen / this.animTime),
                            frame = end.animFrames[frame];
                    }
                    if (frame) {
                        var xCount = end.xCount || 100,
                            gfxX = gfxX + frame % xCount * end.w,
                            gfxY = gfxY + Math.floor(frame / xCount) * end.h;
                    }
                    this.sprites[m].setImageSrc(this.gfx, gfxX, gfxY);
                    this.sprites[m].setFlip(end.flipX, end.flipY);
                    end.xAdd && (offsetX = offsetX + end.w);
                    end.yAdd && (offsetY = offsetY + drawHeight);
                    end.wSub && (sizeX = sizeX - end.w);
                    end.hSub && (sizeY = sizeY - drawHeight);
                    this.sprites[m].renderMode = end.renderMode || this.renderMode;
                    this.sprites[m].setAlpha(this.animState.alpha);
                    this.sprites[m].setGfxOffset(end.offX || 0, end.offY || 0);
                    this.sprites[m].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle);
                    hasBottom = end.bottom || hasBottom;
                }
                if (this.timePadding) {
                    timeX = Math.floor(this.timer * this.timePadding.x);
                    timeY = Math.floor(this.timer * this.timePadding.y);
                }
                var patternZ = this.renderHeight,
                    patternPosZ = this.coll.pos.z;
                if (this.gfxEnds && hasBottom) {
                    patternPosZ = patternPosZ + patternZ;
                    patternZ = 0;
                }
                this.sprites[m].setPos(posX + offsetX, posY + offsetY, patternPosZ);
                if (sizeX > 0 && sizeY > 0) {
                    this.sprites[m].setSize(sizeX, sizeY, patternZ, Math.round(this.wallY) * sizeY);
                    this.sprites[m].setPivot(sizeX * (this.pivot ? this.pivot.x : 0.5), (sizeY + patternZ) * (this.pivot ? this.pivot.y : 0.5));
                    this.sprites[m].setImageSrc(this.patternSheet.getPattern(baseFrame), this.patternOffset.x + timeX, this.patternOffset.y + timeY);
                    this.sprites[m].renderMode = this.renderMode;
                    this.sprites[m].setAlpha(this.animState.alpha);
                    this.sprites[m].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle);
                } else {
                    this.sprites[m].setInvisible();
                }
                this.animState.updateSpriteColor(this);
            } else {
                for (var m = 0; m < this.sprites.length; ++m) this.sprites[m].setInvisible();
            }
        },

        collideWith: function (other) {
            if (this.touchVar && other == ig.game.playerEntity && !this._triggered) {
                this._triggered = true;
                ig.vars.set(this.touchVar, true);
            }
        },

        varsChanged: function () {
            this.hideManager && this.hideManager.varsChanged(this);
        },

        ballHit: function (ball) {
            if (!this.ballKill || !ball.isBall) return false;
            this.ballKill.fx && this.ballKill.fx.spawnOnTarget(this, {});
            var hitPos = ball.getHitCenter(this);
            sc.combat.showHitEffect(this, hitPos, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, false);
            return true;
        }
    });

    ig.ENTITY.ScalableProp.staticNavBlock = true;
});
ig.baked = !0;
