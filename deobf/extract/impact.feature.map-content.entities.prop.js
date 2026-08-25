ig.module("impact.feature.map-content.entities.prop").requires("impact.base.entity").defines(function() {
    ig.PropSheet = ig.JsonLoadable.extend({
        cacheType: "PropSheet",
        props: {},
        onCacheCleared: function() {},
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/props/", ".json") + ig.getCacheSuffix()
        },
        onload: function(b) {
            if (b.DOCTYPE != "PROP_SHEET") throw Error("Invalid JSON Format for PropSheet");
            for (var b = b.props, a = 0; a < b.length; ++a) this.handlePropEntry(b[a])
        },
        handlePropEntry: function(b) {
            if (b.name) {
                var a =
                    b.name;
                delete b.name;
                this.props[a] = b
            } else if (b.sequence) {
                var a = b.sequence,
                    d = a.entries,
                    c = a.sheet;
                delete b.sequence;
                for (var e = 0; e < d.length; ++e) {
                    var f = d[e],
                        g = {},
                        a = f.name;
                    delete f.name;
                    ig.merge(g, b);
                    ig.merge(g, f);
                    g.fix = {
                        gfx: c.gfx,
                        x: c.x + c.w * e,
                        y: c.y,
                        w: c.w,
                        h: c.h,
                        flipX: false
                    };
                    this.props[a] = g
                }
            }
        },
        getProp: function(b) {
            return this.props[b]
        }
    });
    sc.PropCollideSounds = {};
    sc.PropCollideSounds.PLANT = new ig.Sound("media/sound/environment/plant-shake.ogg", 0.7, 0.2);
    ig.PROP_INTERACT_CLASS = null;
    ig.LANG_CONTEXT.Prop = function(b) {
        var a =
            "PROP[";
        b.settings.propType && (a = a + b.settings.propType.name);
        return a + "]"
    };
    ig.ENTITY.Prop = ig.AnimatedEntity.extend({
        terrain: 0,
        face: Vec2.create(),
        propSet: null,
        propName: null,
        propAnim: null,
        nudging: {
            active: false,
            timer: 0,
            variance: 0.01,
            onFall: false
        },
        collideSound: null,
        condAnims: null,
        touchVar: null,
        _triggered: false,
        shuffleAnims: false,
        interact: null,
        currentInteract: null,
        ballKill: null,
        effects: {
            initPerma: false,
            sheet: null,
            show: null,
            hide: null,
            hideHandle: null,
            showOverload: null,
            hideOverload: null,
            permaEffect: null,
            permaHandle: null,
            interactPermaHandle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                propType: {
                    _type: "PropType",
                    _info: "Type of prop"
                },
                propAnim: {
                    _type: "EntityAnim",
                    _info: "Animation of prop"
                },
                condAnims: {
                    _type: "CondAnims",
                    _info: "Animations shown by conditions"
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
                interact: {
                    _type: "PropInteract",
                    _info: "Interaction for this property",
                    _popup: true,
                    _optional: true
                },
                showEffect: {
                    _type: "Effect",
                    _info: "Effect to show when showing entity",
                    _optional: true
                },
                hideEffect: {
                    _type: "Effect",
                    _info: "Effect to show when hiding entity",
                    _optional: true
                },
                permaEffect: {
                    _type: "Effect",
                    _info: "Effect to be shown permanently",
                    _optional: true
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
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type =
                ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.touchVar = c.touchVar || null;
            this.propAnim = c.propAnim || "default";
            b = c.condAnims;
            this.effects.showOverload = c.showEffect ? new ig.EffectHandle(c.showEffect) : null;
            this.effects.hideOverload = c.hideEffect ? new ig.EffectHandle(c.hideEffect) : null;
            this.effects.permaEffect = c.permaEffect ? new ig.EffectHandle(c.permaEffect) : null;
            if (c.hideCondition) this.hideManager = new ig.EntityHideManager(c.hideCondition);
            if (b && b.length > 0) {
                this.condAnims = [];
                for (a = 0; a < b.length; ++a) {
                    d = null;
                    b[a].interact && ig.PROP_INTERACT_CLASS && (d = new ig.PROP_INTERACT_CLASS(this, b[a].interact));
                    this.condAnims.push({
                        condition: new ig.VarCondition(b[a].condition),
                        anim: b[a].anim,
                        interact: d
                    })
                }
            } else if (!this.hideManager) this.varsChanged = null;
            if (c.interact && ig.PROP_INTERACT_CLASS) this.interact = new ig.PROP_INTERACT_CLASS(this, c.interact);
            if (c.propType && c.propType.name && c.propType.sheet) {
                this.propName = c.propType.name;
                if (window.IS_IT_CUBAUM && c.propType.sheet == "autumn" && this.propName.indexOf("tree") != -1) this.propName =
                    "cubaum";
                this.propSheet = new ig.PropSheet(c.propType.sheet);
                this.propSheet.addLoadListener(this)
            }
        },
        show: function(b) {
            this.parent(b);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (this.effects.permaEffect) this.effects.initPerma = true;
            if (this.currentInteract && this.currentInteract.onShow()) this.effects.initPerma = true;
            this.effects.initPerma && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            this._triggered = false;
            if (!b && (this.effects.sheet || this.effects.showOverload)) {
                this.animState.alpha =
                    0;
                this.effects.showOverload ? this.effects.showOverload.spawnOnTarget(this, {}) : this.effects.sheet.spawnOnTarget(this.effects.show, this, {})
            }
        },
        initPermaEffects: function() {
            this.effects.initPerma = false;
            if (this.effects.permaEffect) this.effects.permaHandle = this.effects.permaEffect.spawnOnTarget(this, {
                duration: -1
            });
            this.currentInteract && this.currentInteract.onPermaUpdate()
        },
        onHideRequest: function() {
            this.currentInteract && this.currentInteract.onHide();
            this.effects.permaHandle && this.effects.permaHandle.stop();
            this.effects.permaHandle = null;
            if (this.effects.sheet || this.effects.hideOverload) {
                this.effects.hideHandle = this.effects.hideOverload ? this.effects.hideOverload.spawnOnTarget(this, {
                    callback: this
                }) : this.effects.sheet.spawnOnTarget(this.effects.hide, this, {
                    callback: this
                });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            } else this.hide()
        },
        initSprites: function() {
            this.setSpriteCount(1)
        },
        onLoadableComplete: function(b) {
            if (!b) throw Error("Loading Failed!");
            if (b = this.propSheet.getProp(this.propName)) {
                if (window.wm) {
                    this._wm =
                        this._wm.copy();
                    this._wm.drawBox = false
                }
                Vec3.assign(this.coll.size, b.size);
                this.coll.type = ig.COLLTYPE[b.collType] || this.coll.type;
                this.coll.shape = ig.COLLSHAPE[b.shapeType] || ig.COLLSHAPE.RECTANGLE;
                this.coll.shadow.size = b.shadow || 0;
                this.shuffleAnims = b.shuffleAnims || false;
                if (b.ballKill) this.ballKill = {
                    fx: b.ballKill.fx ? new ig.EffectHandle(b.ballKill.fx) : null
                };
                if (b.nudging) {
                    this.nudging.active = true;
                    this.nudging.variance = Math.PI * 2 * (b["nudge-variance"] ? b["nudge-variance"] : 0.015);
                    this.nudging.timer = new ig.WeightTimer(false);
                    if (this.coll.type != ig.COLLTYPE.BLOCK) this.coll.type = ig.COLLTYPE.TRIGGER;
                    this.collideSound = b.collideSound || sc.PropCollideSounds.PLANT
                }
                if (b.floatHeight) this.coll.float.height = b.floatHeight;
                if (b.floatVariance) this.coll.float.height = b.floatVariance;
                if (b.effects) {
                    this.effects.sheet = new ig.EffectSheet(b.effects.sheet);
                    this.effects.hide = b.effects.hide;
                    this.effects.show = b.effects.show
                }
                this.terrain = ig.TERRAIN[b.terrain] || 0;
                this.coll.zGravityFactor = b.zGravityFactor || 0;
                if (b.anims) this.initAnimations(b.anims);
                else {
                    if (this.hideManager) this.hideManager.efficientMode = true;
                    this.effects.initPerma || this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                    this.fixDraw = {
                        image: new ig.Image(b.fix.gfx),
                        x: b.fix.x,
                        y: b.fix.y,
                        w: b.fix.w,
                        h: b.fix.h,
                        flipX: b.fix.flipX,
                        flipY: b.fix.flipY,
                        wallY: b.fix.wallY,
                        aboveZ: b.fix.aboveZ || 0,
                        shape: ig.ANIM_SHAPE_TYPE[b.fix.shape || "NO_EXPAND"],
                        pivot: {
                            x: b.fix.pivotX,
                            y: b.fix.pivotY
                        },
                        offX: b.fix.offX || 0,
                        offY: b.fix.offY || 0,
                        renderMode: b.fix.renderMode || null
                    };
                    if (this.fixDraw.pivot.x === void 0) this.fixDraw.pivot.x =
                        this.fixDraw.w / 2;
                    if (this.fixDraw.pivot.y === void 0) this.fixDraw.pivot.y = this.fixDraw.h / 2
                }
                this._updateAnimations()
            }
        },
        setCurrentAnim: function(b, a, d, c, e) {
            this.fixDraw || this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            ig.AnimatedEntity.prototype.setCurrentAnim.call(this, b, a, d, c, e)
        },
        onKill: function(b) {
            this.parent(b);
            this.propSheet && this.propSheet.decreaseRef();
            this.fixDraw && this.fixDraw.image.decreaseRef();
            this.interact && this.interact.onKill();
            this.effects.sheet && this.effects.sheet.decreaseRef();
            this.effects.showOverload &&
                this.effects.showOverload.clearCached();
            this.effects.hideOverload && this.effects.hideOverload.clearCached();
            this.effects.permaEffect && this.effects.permaEffect.clearCached();
            this.ballKill && this.ballKill.fx && this.ballKill.fx.clearCached();
            if (this.condAnims)
                for (b = this.condAnims.length; b--;) this.condAnims[b].interact && this.condAnims[b].interact.onKill()
        },
        update: function() {
            if (this.effects.initPerma) {
                this.initPermaEffects();
                this.fixDraw && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
            }
            this.hideManager &&
                this.hideManager.update(this);
            if (this.nudging.timer && !this.nudging.timer.done()) {
                this.nudging.timer.tick();
                if (this.nudging.timer.repeatCount >= 1) {
                    this.nudging.timer.set(0);
                    this.fixDraw && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
                }
            }
            this.parent();
            if (!this.fixDraw && !this.nudging.timer && (!this.hideManager || !this.hideManager.isBusy()) && this.animState.isStatic()) {
                if (this.hideManager) this.hideManager.efficientMode = true;
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
            }
        },
        onEffectEvent: function(b) {
            if (b ==
                this.effects.hideHandle && b.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        updateSprites: function() {
            var b = 0,
                a = 0;
            if (this.nudging.timer && !this.nudging.timer.done()) {
                b = this.nudging.timer.get();
                if (this.nudging.onFall) {
                    a = Math.sin(Math.PI * b) * 2;
                    b = this.nudging.variance * Math.sin(Math.PI * b)
                } else b = this.nudging.variance * b
            }
            if (this.animSheet) {
                this.animState.angle = b;
                ig.AnimatedEntity.prototype.updateSprites.call(this)
            } else if (this.fixDraw) {
                var d = this.sprites[0];
                d.setEntityDefault(this, this.fixDraw.w, this.fixDraw.h,
                    this.fixDraw.shape || "NO_EXPAND", this.fixDraw.wallY, null, this.fixDraw.image, this.fixDraw.x, this.fixDraw.y);
                d.aboveZ = this.fixDraw.aboveZ || 0;
                d.setFlip(this.fixDraw.flipX, this.fixDraw.flipY);
                d.setPivot(this.fixDraw.pivot.x, this.fixDraw.pivot.y);
                if (this.fixDraw.renderMode) d.renderMode = this.fixDraw.renderMode;
                d.setTransform(this.animState.scaleX, this.animState.scaleY, b);
                d.setAlpha(this.animState.alpha);
                d.setGfxOffset(this.fixDraw.offX, this.fixDraw.offY + a);
                this.animState.updateSpriteColor(this)
            } else this.sprites[0].setInvisible()
        },
        collideWith: function(b) {
            if (this.touchVar && b == ig.game.playerEntity && !this._triggered) {
                this._triggered = true;
                ig.vars.set(this.touchVar, true)
            }
            this.nudging && (b.coll.type == ig.COLLTYPE.PROJECTILE || this.coll.type == ig.COLLTYPE.BLOCK || this.nudge(b == ig.game.playerEntity))
        },
        onGroundAdd: function(b) {
            this.nudge(b == ig.game.playerEntity, true)
        },
        nudge: function(b, a) {
            if (this.nudging.timer && this.nudging.timer.done()) {
                b && this.collideSound && ig.SoundHelper.playAtEntity(this.collideSound, this, false, {
                    fadeDuration: 0.25
                });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                this.nudging.onFall = a || false;
                a ? this.nudging.timer.set(0.15, ig.TIMER_MODE.ONCE) : this.nudging.timer.set(0.3, ig.TIMER_MODE.SINUS_RND)
            }
        },
        untriggerProp: function() {
            this._triggered = false
        },
        varsChanged: function() {
            this.hideManager && this.hideManager.varsChanged(this);
            this._updateAnimations()
        },
        changeInteract: function(b) {
            if (this.currentInteract != b) {
                if (!this._hidden && this.currentInteract) this.currentInteract.onHide();
                this.currentInteract = b;
                if (!this._hidden && this.currentInteract && this.currentInteract.onShow()) {
                    this.effects.initPerma =
                        true;
                    this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
                }
            }
        },
        ballHit: function(b) {
            if (!this.ballKill || !b.isBall) return false;
            this.ballKill.fx && this.ballKill.fx.spawnOnTarget(this, {});
            var a = b.getHitCenter(this);
            sc.combat.showHitEffect(this, a, sc.ATTACK_TYPE.NONE, b.getElement(), false, false, false);
            return true
        },
        _updateAnimations: function() {
            if (this.condAnims)
                for (var b = this.condAnims.length; b--;) {
                    var a = this.condAnims[b];
                    if (a.condition.evaluate()) {
                        if (!this.fixDraw) {
                            this.setCurrentAnim(a.anim, true, null, true);
                            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
                        }
                        this.changeInteract(a.interact || this.interact);
                        this.shuffleAnims && this.animState.shuffleTime();
                        return
                    }
                }
            this.changeInteract(this.interact);
            if (!this.fixDraw) {
                this.setCurrentAnim(this.propAnim);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            }
            this.shuffleAnims && this.animState.shuffleTime()
        }
    });
    ig.ENTITY.Prop.staticNavBlock = true
});
ig.baked = !0;
