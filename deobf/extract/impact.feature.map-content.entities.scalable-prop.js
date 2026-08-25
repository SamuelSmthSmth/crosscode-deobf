ig.module("impact.feature.map-content.entities.scalable-prop").requires("impact.base.entity").defines(function() {
    ig.ScalePropSheet = ig.JsonLoadable.extend({
        cacheType: "ScalablePropSheet",
        entries: {},
        onCacheCleared: function() {},
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/scale-props/", ".json") + ig.getCacheSuffix()
        },
        onload: function(a) {
            if (a.DOCTYPE != "SCALABLE_PROP_SHEET") throw Error("Invalid JSON Format for ScalablePropSheet");
            this.entries = a.entries
        },
        getScalableProp: function(a) {
            return this.entries[a]
        }
    });
    var b = {
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
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.NONE;
            this.touchVar = e.touchVar || null;
            e.size ? this.hasSize = true : this.coll.setSize(32, 32, 0);
            e.patternOffset && Vec2.assign(this.patternOffset, e.patternOffset);
            this.timer = e.timeOffset || 0;
            this.blockNavMap = e.blockNavMap;
            e.hideCondition ? this.hideManager = new ig.EntityHideManager(e.hideCondition) :
                this.varsChanged = null;
            if (e.propConfig && e.propConfig.name && e.propConfig.sheet) {
                this.propConfig = e.propConfig;
                this.scalePropSheet = new ig.ScalePropSheet(e.propConfig.sheet);
                this.scalePropSheet.addLoadListener(this)
            }
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            this._triggered = this.coll.ignoreCollision = false;
            if (!a && this.effects.sheet) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget(this.effects.show, this, {})
            }
            if (this.blockNavMap) this.navBlocker =
                ig.navigation.getNavBlock(this);
            this.skyBlock && !this.skyBlockEntity && this.createSkyBlock()
        },
        createSkyBlock: function() {
            var a = this.coll;
            this.skyBlockEntity = ig.game.spawnEntity(ig.ENTITY.HiddenSkyBlock, a.pos.x, a.pos.y, a.pos.z, {
                size: Vec2.create(this.coll.size)
            });
            this.skyBlockEntity.coll.setType(this.coll.type)
        },
        onHideRequest: function() {
            this.navBlocker && this.navBlocker.remove();
            this.navBlocker = null;
            this.coll.ignoreCollision = true;
            if (this.skyBlockEntity) {
                this.skyBlockEntity.kill();
                this.skyBlockEntity = null
            }
            if (this.effects.sheet) {
                this.effects.hideHandle =
                    this.effects.sheet.spawnOnTarget(this.effects.hide, this, {
                        callback: this
                    });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            } else this.hide()
        },
        onLoadableComplete: function(a) {
            if (!a) throw Error("Loading Failed!");
            var d = this.coll;
            if (a = this.scalePropSheet.getScalableProp(this.propConfig.name)) {
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                    this._wm.scalableX = a.scalableX;
                    this._wm.scalableY = a.scalableY;
                    this._wm.scalableStep = a.scalableStep
                }
                if (this.hasSize) {
                    if (!a.scalableX && d.size.x != a.baseSize.x ||
                        (d.size.x - a.baseSize.x) % a.scalableStep != 0) {
                        d.size.x = a.baseSize.x;
                        d.size.y = a.baseSize.y
                    }
                    if (!a.scalableY && d.size.y != a.baseSize.y || (d.size.y - a.baseSize.y) % a.scalableStep != 0) {
                        d.size.x = a.baseSize.x;
                        d.size.y = a.baseSize.y
                    }
                } else Vec2.assign(d.size, a.baseSize);
                if (a.ballKill) this.ballKill = {
                    fx: a.ballKill.fx ? new ig.EffectHandle(a.ballKill.fx) : null
                };
                d.size.z = a.baseSize.z;
                this.coll.setType(ig.COLLTYPE[a.collType] || this.coll.type);
                this.wallY = a.wallY || 0;
                this.terrain = ig.TERRAIN[a.terrain] || 0;
                this.renderHeight = d.size.z;
                if (a.renderHeight != void 0) this.renderHeight = a.renderHeight;
                this.renderMode = a.renderMode;
                this.animFrames = a.animFrames || null;
                this.animTime = a.animTime || 0.1;
                this.timePadding = a.timePadding || null;
                if (a.effects) {
                    this.effects.sheet = new ig.EffectSheet(a.effects.sheet);
                    this.effects.hide = a.effects.hide;
                    this.effects.show = a.effects.show
                }
                this.pivot = a.pivot || null;
                this.skyBlock = a.skyBlock;
                var c = a.patterns,
                    d = a.gfxBaseX || 0,
                    e = a.gfxBaseY || 0;
                this.patternSheet = new ig.ImagePatternSheet(a.gfx, a.scalableX ? a.scalableY ? ig.ImagePattern.OPT.REPEAT_X_AND_Y :
                    ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y, c.w, c.h, d + (c.x || 0), e + (c.y || 0), c.xCount || 1, c.yCount || 1);
                this.gfx = new ig.Image(a.gfx);
                if (c = this.propConfig.ends)
                    for (var f in a.gfxEnds) {
                        var g = a.gfxEnds[f][c[f]];
                        if (g) {
                            g = {
                                x: g.x,
                                y: g.y,
                                w: g.w,
                                h: g.h,
                                zHeight: g.zHeight == void 0 ? this.renderHeight : g.zHeight,
                                offX: g.offX,
                                offY: g.offY,
                                flipX: g.flipX || false,
                                flipY: g.flipY || false,
                                animFrames: g.animFrames || null,
                                renderMode: g.renderMode || null,
                                fullBack: g.fullBack || false
                            };
                            ig.merge(g, b[f]);
                            g.x = g.x + d;
                            g.y = g.y + e;
                            this.gfxEnds.push(g)
                        }
                    }
                this.setSpriteCount(1 +
                    this.gfxEnds.length);
                if (!this.animFrames && !this.animTime && !this.timePadding) {
                    if (this.hideManager) this.hideManager.efficientMode = true;
                    this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
                }
            }
        },
        initSprites: function() {
            this.setSpriteCount(1 + this.gfxEnds.length)
        },
        onKill: function(a) {
            this.navBlocker && this.navBlocker.remove();
            this.parent(a);
            this.scalePropSheet && this.scalePropSheet.decreaseRef();
            this.patternSheet && this.patternSheet.decreaseRef();
            this.effects.sheet && this.effects.sheet.decreaseRef();
            this.ballKill &&
                this.ballKill.fx && this.ballKill.fx.clearCached();
            this.gfx && this.gfx.decreaseRef()
        },
        update: function() {
            this.skyBlock && (!this.skyBlockEntity && !this.effects.hideHandle) && this.createSkyBlock();
            this.hideManager && this.hideManager.update(this);
            this.parent();
            if (this.animFrames || this.timePadding) this.timer = this.timer + ig.system.tick
        },
        onEffectEvent: function(a) {
            if (a == this.effects.hideHandle && a.isDone()) {
                this.effects.hideHandle = null;
                !this.animFrames && (!this.animTime && !this.timePadding) && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                this.hide()
            }
        },
        updateSprites: function() {
            var a = this.coll;
            if (this.patternSheet) {
                var b = 0,
                    c = 0,
                    e = 0;
                if (this.animFrames) var f = this.animFrames.length * this.animTime,
                    f = Math.floor(this.timer % f / this.animTime),
                    b = this.animFrames[f];
                for (var g = a.pos.x, h = a.pos.y, i = 0, j = 0, k = a.size.x, l = a.size.y, o = false, m = 0; m < this.gfxEnds.length; ++m) {
                    var n = this.gfxEnds[m],
                        p = a.pos.z,
                        r = n.zHeight;
                    if (n.top && !n.fullBack) {
                        p = p + this.renderHeight;
                        r = r - this.renderHeight
                    }
                    var t = n.h - r;
                    this.sprites[m].setPos(a.pos.x + (n.right ? a.size.x - n.w : 0), a.pos.y +
                        (n.bottom ? a.size.y - t : 0), p);
                    this.sprites[m].setSize(n.w, t, r, Math.round(this.wallY) * t);
                    this.sprites[m].setPivot(n.w / 2, (t + r) / 2);
                    p = n.x;
                    r = n.y;
                    f = b;
                    if (n.animFrames) {
                        f = n.animFrames.length * this.animTime;
                        f = Math.floor(this.timer % f / this.animTime);
                        f = n.animFrames[f]
                    }
                    if (f) var q = n.xCount || 100,
                        p = p + f % q * n.w,
                        r = r + Math.floor(f / q) * n.h;
                    this.sprites[m].setImageSrc(this.gfx, p, r);
                    this.sprites[m].setFlip(n.flipX, n.flipY);
                    n.xAdd && (i = i + n.w);
                    n.yAdd && (j = j + t);
                    n.wSub && (k = k - n.w);
                    n.hSub && (l = l - t);
                    this.sprites[m].renderMode = n.renderMode ||
                        this.renderMode;
                    this.sprites[m].setAlpha(this.animState.alpha);
                    this.sprites[m].setGfxOffset(n.offX || 0, n.offY || 0);
                    this.sprites[m].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle);
                    o = n.bottom || o
                }
                if (this.timePadding) {
                    c = Math.floor(this.timer * this.timePadding.x);
                    e = Math.floor(this.timer * this.timePadding.y)
                }
                a = this.renderHeight;
                n = this.coll.pos.z;
                if (this.gfxEnds && o) {
                    n = n + a;
                    a = 0
                }
                this.sprites[m].setPos(g + i, h + j, n);
                if (k > 0 && l > 0) {
                    this.sprites[m].setSize(k, l, a, Math.round(this.wallY) * l);
                    this.sprites[m].setPivot(k * (this.pivot ? this.pivot.x : 0.5), (l + a) * (this.pivot ? this.pivot.y : 0.5));
                    this.sprites[m].setImageSrc(this.patternSheet.getPattern(b), this.patternOffset.x + c, this.patternOffset.y + e);
                    this.sprites[m].renderMode = this.renderMode;
                    this.sprites[m].setAlpha(this.animState.alpha);
                    this.sprites[m].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle)
                } else this.sprites[m].setInvisible();
                this.animState.updateSpriteColor(this)
            } else
                for (m = 0; m < this.sprites.length; ++m) this.sprites[m].setInvisible()
        },
        collideWith: function(a) {
            if (this.touchVar && a == ig.game.playerEntity && !this._triggered) {
                this._triggered = true;
                ig.vars.set(this.touchVar, true)
            }
        },
        varsChanged: function() {
            this.hideManager && this.hideManager.varsChanged(this)
        },
        ballHit: function(a) {
            if (!this.ballKill || !a.isBall) return false;
            this.ballKill.fx && this.ballKill.fx.spawnOnTarget(this, {});
            var b = a.getHitCenter(this);
            sc.combat.showHitEffect(this, b, sc.ATTACK_TYPE.NONE, a.getElement(), false, false, false);
            return true
        }
    });
    ig.ENTITY.ScalableProp.staticNavBlock =
        true
});
ig.baked = !0;
