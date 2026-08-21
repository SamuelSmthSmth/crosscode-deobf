/**
 * impact.feature.map-content.entities.prop
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.prop")`.
 *
 * `ig.ENTITY.Prop`: a map prop loaded from a "prop sheet" JSON (collision,
 * fix-draw sprite, nudging, effects, conditional animations, interaction).
 * `ig.PropSheet` parses the sheet data (named entries and sequences).
 */
ig.module("impact.feature.map-content.entities.prop")
    .requires("impact.base.entity")
    .defines(function () {

    /** Loads and caches a props/<name>.json sheet (list of prop definitions). */
    ig.PropSheet = ig.JsonLoadable.extend({
        cacheType: "PropSheet",
        props: {},

        onCacheCleared: function () {},

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/props/", ".json") + ig.getCacheSuffix();
        },

        onload: function (data) {
            if (data.DOCTYPE != "PROP_SHEET") throw Error("Invalid JSON Format for PropSheet");
            for (var data = data.props, i = 0; i < data.length; ++i) this.handlePropEntry(data[i]);
        },

        /** Register a single named prop, or expand a `sequence` into per-frame props. */
        handlePropEntry: function (entry) {
            if (entry.name) {
                var name = entry.name;
                delete entry.name;
                this.props[name] = entry;
            } else if (entry.sequence) {
                var sequence = entry.sequence,
                    entries = sequence.entries,
                    sheet = sequence.sheet;
                delete entry.sequence;
                for (var i = 0; i < entries.length; ++i) {
                    var frame = entries[i],
                        prop = {},
                        name = frame.name;
                    delete frame.name;
                    ig.merge(prop, entry);
                    ig.merge(prop, frame);
                    prop.fix = {
                        gfx: sheet.gfx,
                        x: sheet.x + sheet.w * i,
                        y: sheet.y,
                        w: sheet.w,
                        h: sheet.h,
                        flipX: false
                    };
                    this.props[name] = prop;
                }
            }
        },

        getProp: function (name) {
            return this.props[name];
        }
    });

    sc.PropCollideSounds = {};
    sc.PropCollideSounds.PLANT = new ig.Sound("media/sound/environment/plant-shake.ogg", 0.7, 0.2);

    /** Overridden by the interact feature to hook props into interactions. */
    ig.PROP_INTERACT_CLASS = null;

    ig.LANG_CONTEXT.Prop = function (entity) {
        var text = "PROP[";
        entity.settings.propType && (text = text + entity.settings.propType.name);
        return text + "]";
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
            label: function () {
                return "";
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.touchVar = settings.touchVar || null;
            this.propAnim = settings.propAnim || "default";
            var condAnimsData = settings.condAnims;
            this.effects.showOverload = settings.showEffect ? new ig.EffectHandle(settings.showEffect) : null;
            this.effects.hideOverload = settings.hideEffect ? new ig.EffectHandle(settings.hideEffect) : null;
            this.effects.permaEffect = settings.permaEffect ? new ig.EffectHandle(settings.permaEffect) : null;
            if (settings.hideCondition) this.hideManager = new ig.EntityHideManager(settings.hideCondition);
            if (condAnimsData && condAnimsData.length > 0) {
                this.condAnims = [];
                for (var i = 0; i < condAnimsData.length; ++i) {
                    var interact = null;
                    condAnimsData[i].interact && ig.PROP_INTERACT_CLASS && (interact = new ig.PROP_INTERACT_CLASS(this, condAnimsData[i].interact));
                    this.condAnims.push({
                        condition: new ig.VarCondition(condAnimsData[i].condition),
                        anim: condAnimsData[i].anim,
                        interact: interact
                    });
                }
            } else if (!this.hideManager) {
                this.varsChanged = null;
            }
            if (settings.interact && ig.PROP_INTERACT_CLASS) {
                this.interact = new ig.PROP_INTERACT_CLASS(this, settings.interact);
            }
            if (settings.propType && settings.propType.name && settings.propType.sheet) {
                this.propName = settings.propType.name;
                if (window.IS_IT_CUBAUM && settings.propType.sheet == "autumn" && this.propName.indexOf("tree") != -1) {
                    this.propName = "cubaum";
                }
                this.propSheet = new ig.PropSheet(settings.propType.sheet);
                this.propSheet.addLoadListener(this);
            }
        },

        show: function (value) {
            this.parent(value);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null;
            }
            if (this.effects.permaEffect) this.effects.initPerma = true;
            if (this.currentInteract && this.currentInteract.onShow()) this.effects.initPerma = true;
            this.effects.initPerma && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            this._triggered = false;
            if (!value && (this.effects.sheet || this.effects.showOverload)) {
                this.animState.alpha = 0;
                this.effects.showOverload ? this.effects.showOverload.spawnOnTarget(this, {}) : this.effects.sheet.spawnOnTarget(this.effects.show, this, {});
            }
        },

        initPermaEffects: function () {
            this.effects.initPerma = false;
            if (this.effects.permaEffect) {
                this.effects.permaHandle = this.effects.permaEffect.spawnOnTarget(this, { duration: -1 });
            }
            this.currentInteract && this.currentInteract.onPermaUpdate();
        },

        onHideRequest: function () {
            this.currentInteract && this.currentInteract.onHide();
            this.effects.permaHandle && this.effects.permaHandle.stop();
            this.effects.permaHandle = null;
            if (this.effects.sheet || this.effects.hideOverload) {
                this.effects.hideHandle = this.effects.hideOverload ?
                    this.effects.hideOverload.spawnOnTarget(this, { callback: this }) :
                    this.effects.sheet.spawnOnTarget(this.effects.hide, this, { callback: this });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            } else {
                this.hide();
            }
        },

        initSprites: function () {
            this.setSpriteCount(1);
        },

        /** Apply the loaded prop sheet entry (collision, fix-draw, anims, nudging). */
        onLoadableComplete: function (prop) {
            if (!prop) throw Error("Loading Failed!");
            if (prop = this.propSheet.getProp(this.propName)) {
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                }
                Vec3.assign(this.coll.size, prop.size);
                this.coll.type = ig.COLLTYPE[prop.collType] || this.coll.type;
                this.coll.shape = ig.COLLSHAPE[prop.shapeType] || ig.COLLSHAPE.RECTANGLE;
                this.coll.shadow.size = prop.shadow || 0;
                this.shuffleAnims = prop.shuffleAnims || false;
                if (prop.ballKill) {
                    this.ballKill = {
                        fx: prop.ballKill.fx ? new ig.EffectHandle(prop.ballKill.fx) : null
                    };
                }
                if (prop.nudging) {
                    this.nudging.active = true;
                    this.nudging.variance = Math.PI * 2 * (prop["nudge-variance"] ? prop["nudge-variance"] : 0.015);
                    this.nudging.timer = new ig.WeightTimer(false);
                    if (this.coll.type != ig.COLLTYPE.BLOCK) this.coll.type = ig.COLLTYPE.TRIGGER;
                    this.collideSound = prop.collideSound || sc.PropCollideSounds.PLANT;
                }
                if (prop.floatHeight) this.coll.float.height = prop.floatHeight;
                if (prop.floatVariance) this.coll.float.height = prop.floatVariance;
                if (prop.effects) {
                    this.effects.sheet = new ig.EffectSheet(prop.effects.sheet);
                    this.effects.hide = prop.effects.hide;
                    this.effects.show = prop.effects.show;
                }
                this.terrain = ig.TERRAIN[prop.terrain] || 0;
                this.coll.zGravityFactor = prop.zGravityFactor || 0;
                if (prop.anims) {
                    this.initAnimations(prop.anims);
                } else {
                    if (this.hideManager) this.hideManager.efficientMode = true;
                    this.effects.initPerma || this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                    this.fixDraw = {
                        image: new ig.Image(prop.fix.gfx),
                        x: prop.fix.x,
                        y: prop.fix.y,
                        w: prop.fix.w,
                        h: prop.fix.h,
                        flipX: prop.fix.flipX,
                        flipY: prop.fix.flipY,
                        wallY: prop.fix.wallY,
                        aboveZ: prop.fix.aboveZ || 0,
                        shape: ig.ANIM_SHAPE_TYPE[prop.fix.shape || "NO_EXPAND"],
                        pivot: {
                            x: prop.fix.pivotX,
                            y: prop.fix.pivotY
                        },
                        offX: prop.fix.offX || 0,
                        offY: prop.fix.offY || 0,
                        renderMode: prop.fix.renderMode || null
                    };
                    if (this.fixDraw.pivot.x === void 0) this.fixDraw.pivot.x = this.fixDraw.w / 2;
                    if (this.fixDraw.pivot.y === void 0) this.fixDraw.pivot.y = this.fixDraw.h / 2;
                }
                this._updateAnimations();
            }
        },

        setCurrentAnim: function (anim, force, seek, update, reset) {
            this.fixDraw || this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            ig.AnimatedEntity.prototype.setCurrentAnim.call(this, anim, force, seek, update, reset);
        },

        onKill: function (entity) {
            this.parent(entity);
            this.propSheet && this.propSheet.decreaseRef();
            this.fixDraw && this.fixDraw.image.decreaseRef();
            this.interact && this.interact.onKill();
            this.effects.sheet && this.effects.sheet.decreaseRef();
            this.effects.showOverload && this.effects.showOverload.clearCached();
            this.effects.hideOverload && this.effects.hideOverload.clearCached();
            this.effects.permaEffect && this.effects.permaEffect.clearCached();
            this.ballKill && this.ballKill.fx && this.ballKill.fx.clearCached();
            if (this.condAnims) {
                for (var i = this.condAnims.length; i--;) {
                    this.condAnims[i].interact && this.condAnims[i].interact.onKill();
                }
            }
        },

        update: function () {
            if (this.effects.initPerma) {
                this.initPermaEffects();
                this.fixDraw && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            }
            this.hideManager && this.hideManager.update(this);
            if (this.nudging.timer && !this.nudging.timer.done()) {
                this.nudging.timer.tick();
                if (this.nudging.timer.repeatCount >= 1) {
                    this.nudging.timer.set(0);
                    this.fixDraw && this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                }
            }
            this.parent();
            if (!this.fixDraw && !this.nudging.timer &&
                (!this.hideManager || !this.hideManager.isBusy()) && this.animState.isStatic()) {
                if (this.hideManager) this.hideManager.efficientMode = true;
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            }
        },

        onEffectEvent: function (effect) {
            if (effect == this.effects.hideHandle && effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide();
            }
        },

        updateSprites: function () {
            var angle = 0,
                offsetY = 0;
            if (this.nudging.timer && !this.nudging.timer.done()) {
                angle = this.nudging.timer.get();
                if (this.nudging.onFall) {
                    offsetY = Math.sin(Math.PI * angle) * 2;
                    angle = this.nudging.variance * Math.sin(Math.PI * angle);
                } else {
                    angle = this.nudging.variance * angle;
                }
            }
            if (this.animSheet) {
                this.animState.angle = angle;
                ig.AnimatedEntity.prototype.updateSprites.call(this);
            } else if (this.fixDraw) {
                var sprite = this.sprites[0];
                sprite.setEntityDefault(this, this.fixDraw.w, this.fixDraw.h,
                    this.fixDraw.shape || "NO_EXPAND", this.fixDraw.wallY, null, this.fixDraw.image, this.fixDraw.x, this.fixDraw.y);
                sprite.aboveZ = this.fixDraw.aboveZ || 0;
                sprite.setFlip(this.fixDraw.flipX, this.fixDraw.flipY);
                sprite.setPivot(this.fixDraw.pivot.x, this.fixDraw.pivot.y);
                if (this.fixDraw.renderMode) sprite.renderMode = this.fixDraw.renderMode;
                sprite.setTransform(this.animState.scaleX, this.animState.scaleY, angle);
                sprite.setAlpha(this.animState.alpha);
                sprite.setGfxOffset(this.fixDraw.offX, this.fixDraw.offY + offsetY);
                this.animState.updateSpriteColor(this);
            } else {
                this.sprites[0].setInvisible();
            }
        },

        collideWith: function (other) {
            if (this.touchVar && other == ig.game.playerEntity && !this._triggered) {
                this._triggered = true;
                ig.vars.set(this.touchVar, true);
            }
            this.nudging && (other.coll.type == ig.COLLTYPE.PROJECTILE ||
                this.coll.type == ig.COLLTYPE.BLOCK || this.nudge(other == ig.game.playerEntity));
        },

        onGroundAdd: function (value) {
            this.nudge(value == ig.game.playerEntity, true);
        },

        nudge: function (isPlayer, onFall) {
            if (this.nudging.timer && this.nudging.timer.done()) {
                isPlayer && this.collideSound && ig.SoundHelper.playAtEntity(this.collideSound, this, false, {
                    fadeDuration: 0.25
                });
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                this.nudging.onFall = onFall || false;
                onFall ? this.nudging.timer.set(0.15, ig.TIMER_MODE.ONCE) : this.nudging.timer.set(0.3, ig.TIMER_MODE.SINUS_RND);
            }
        },

        untriggerProp: function () {
            this._triggered = false;
        },

        varsChanged: function () {
            this.hideManager && this.hideManager.varsChanged(this);
            this._updateAnimations();
        },

        changeInteract: function (interact) {
            if (this.currentInteract != interact) {
                if (!this._hidden && this.currentInteract) this.currentInteract.onHide();
                this.currentInteract = interact;
                if (!this._hidden && this.currentInteract && this.currentInteract.onShow()) {
                    this.effects.initPerma = true;
                    this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                }
            }
        },

        ballHit: function (ball) {
            if (!this.ballKill || !ball.isBall) return false;
            this.ballKill.fx && this.ballKill.fx.spawnOnTarget(this, {});
            var hitPos = ball.getHitCenter(this);
            sc.combat.showHitEffect(this, hitPos, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, false);
            return true;
        },

        /** Pick the first matching conditional animation; else the default. */
        _updateAnimations: function () {
            if (this.condAnims) {
                for (var i = this.condAnims.length; i--;) {
                    var entry = this.condAnims[i];
                    if (entry.condition.evaluate()) {
                        if (!this.fixDraw) {
                            this.setCurrentAnim(entry.anim, true, null, true);
                            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                        }
                        this.changeInteract(entry.interact || this.interact);
                        this.shuffleAnims && this.animState.shuffleTime();
                        return;
                    }
                }
            }
            this.changeInteract(this.interact);
            if (!this.fixDraw) {
                this.setCurrentAnim(this.propAnim);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            }
            this.shuffleAnims && this.animState.shuffleTime();
        }
    });

    ig.ENTITY.Prop.staticNavBlock = true;
});
ig.baked = !0;
