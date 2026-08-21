/**
 * impact.feature.effect.effect-sheet
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.effect-sheet")`.
 *
 * The core data layer for the effect system.  Defines:
 *
 *   ig.EffectConfig            — Config subclass; builds WM attribute schema for effect steps
 *   ig.EffectConfig (static)   — loadParticleData / getParticleBlockTime / getParticleDuration
 *   ig.ParticleState           — per-particle alpha / scale / rotation animator
 *   ig.EffectSheet             — JsonLoadable; loads a data/effects/*.json and owns ig.Effect instances
 *   ig.FX_RUNNER_CANCEL        — enum used by ig.Effect.update to signal cancel mode
 *   ig.Effect                  — compiled effect timeline (read from JSON, drives ig.ENTITY.Effect)
 *   ig.EffectStepBase          — base class for all ig.EFFECT_ENTRY step types
 *   ig.EffectHandle            — thin wrapper around (EffectSheet + name), with spawn helpers
 *   ig.EffectTimeRunner        — runs a time-based step for a duration
 *   ig.EffectParticleRunner    — runs a particle-batch step, metering particles over time
 *   ig.EFFECT_ENTRY            — registry object where all step types register themselves
 */

ig.module("impact.feature.effect.effect-sheet")
    .requires(
        "impact.base.loader",
        "impact.base.animation",
        "impact.feature.effect.entities.effect",
        "impact.feature.effect.entities.effect-particle"
    )
    .defines(function () {

    // =========================================================================
    // ig.EffectConfig
    // =========================================================================

    /**
     * WM attribute schema fragment appended when a step has a particle animation.
     * (Applies to PLAY_ANIM, PLAY_FACE_ANIM, etc. — any particleType ≠ CopyParticle/LaserParticle)
     * @private
     */
    var _animAttributes = {
        anim: {
            _type: "EffectAnim",
            _info: "Animation of particle"
        },
        followUpAnim: {
            _type: "EffectAnim",
            _info: "Animation of particle to be played before anim",
            _optional: true
        },
        postAnim: {
            _type: "EffectAnim",
            _info: "Animation of particle to be played when particle disappears",
            _optional: true
        }
    };

    /**
     * WM attribute schema fragment appended to all steps that spawn particles.
     * @private
     */
    var _particleStateAttributes = {
        pAlpha: {
            _type: "ParticleState",
            _info: "Alpha state of particle",
            _subType: "Number",
            _subDefault: 1,
            _optional: true
        },
        pScale: {
            _type: "ParticleState",
            _info: "Scale state of particle",
            _subType: "Vec2",
            _subDefault: { x: 1, y: 1 },
            _optional: true
        },
        pRotate: {
            _type: "ParticleState",
            _info: "Rotation state of particle",
            _subType: "Number",
            _subDefault: 0,
            _optional: true
        },
        angleVary: {
            _type: "Number",
            _info: "If defined, randomly vary angle centered around start angle with given circular angle range",
            _optional: true
        },
        randFlip: {
            _type: "Boolean",
            _info: "If true: randomly flip particle horizontally",
            _optional: true
        },
        moveWithTarget: {
            _type: "Number",
            _info: "Whether particle should move with target. 0=not at all. 0.5=over half the time, 1=entirely",
            _optional: true
        },
        pLight: {
            _type: "String",
            _info: "If defined: emit light of given size for each particle",
            _select: ig.LIGHT_SIZE,
            _optional: true
        },
        particleDuration: {
            _type: "Number",
            _info: "Duration of particle. 0=animation length. -1=forever. -2=length of effect. Does NOT include time of post animation / transitions",
            _optional: true
        },
        particleDurVariance: {
            _type: "Number",
            _info: "Variance to duration. Value will be added or subtracted from duration",
            _optional: true
        },
        cancelable: {
            _type: "Boolean",
            _info: "If true, then particle is killed when effect is stopped.",
            _optional: true
        }
    };

    /**
     * Config subclass used by effect step WM descriptors.
     * Automatically merges the animation / particle-state attribute schemas
     * based on the particleType field of the config options.
     *
     * @param {object} opts
     * @param {string} [opts.particleType]   e.g. "Particle", "FaceParticle", "CopyParticle", "LaserParticle"
     * @param {object} [opts.attributes]     step-specific attributes
     * @extends ig.Config
     */
    ig.EffectConfig = ig.Config.extend({
        init: function (opts) {
            var merged = { attributes: {} };
            // inject anim attributes for normal particle types
            if (opts.particleType &&
                opts.particleType !== "CopyParticle" &&
                opts.particleType !== "LaserParticle") {
                ig.merge(merged.attributes, _animAttributes);
            }
            ig.merge(merged.attributes, opts.attributes);
            // inject particle-state attributes for any particle type
            if (opts.particleType) {
                ig.merge(merged.attributes, _particleStateAttributes);
            }
            this.parent(merged);
        }
    });

    // -- static effect config helpers -----------------------------------------

    /** Name of the effect currently being parsed (used for error messages). @private */
    var _currentEffectName = null;

    /**
     * Load and cache per-particle runtime data from an effect step config.
     *
     * @param {ig.AnimationSheet|null} animSheet  effect's animation sheet
     * @param {object} stepCfg                    raw JSON step config object
     * @param {string} cacheKey                   key for error messages
     * @returns {{
     *   anim, followUpAnim, postAnim,
     *   state: ig.ParticleState,
     *   moveWithTarget, particleDuration, particleDurVariance,
     *   angleVary, randFlip, cancelable, light
     * }}
     */
    ig.EffectConfig.loadParticleData = function (animSheet, stepCfg, cacheKey) {
        var pd = {};
        pd.anim          = animSheet && stepCfg.anim          && animSheet.anims[stepCfg.anim]          || null;
        pd.followUpAnim  = animSheet && stepCfg.followUpAnim  && animSheet.anims[stepCfg.followUpAnim]  || null;
        pd.postAnim      = animSheet && stepCfg.postAnim      && animSheet.anims[stepCfg.postAnim]      || null;
        pd.state         = new ig.ParticleState(stepCfg);
        pd.moveWithTarget       = stepCfg.moveWithTarget       || 0;
        pd.particleDuration     = stepCfg.particleDuration     || 0;
        pd.particleDurVariance  = stepCfg.particleDurVariance  || 0;
        pd.angleVary            = stepCfg.angleVary            || 0;
        pd.randFlip             = stepCfg.randFlip             || false;
        pd.cancelable           = stepCfg.cancelable           || false;
        pd.light                = ig.LIGHT_SIZE[stepCfg.pLight] || 0;

        if (animSheet && !pd.anim) {
            ig.log("EFFECT ERROR - No Animation of name '" + stepCfg.anim +
                   "' in '" + cacheKey + "' available. Used by '" + _currentEffectName + "'");
        }
        return pd;
    };

    /**
     * Returns how long ig.Effect.update should block new timeline steps while
     * a cancelable moveWithTarget particle is alive.
     * @param {object} particleData
     * @returns {number} seconds (0 if not applicable)
     */
    ig.EffectConfig.getParticleBlockTime = function (particleData) {
        return particleData.cancelable
            ? (particleData.particleDuration || particleData.anim.getDuration()) * particleData.moveWithTarget
            : 0;
    };

    /**
     * Returns the effective duration of a single particle instance.
     * @param {object} particleData
     * @returns {number} seconds
     */
    ig.EffectConfig.getParticleDuration = function (particleData) {
        return particleData.particleDuration || particleData.anim.getDuration();
    };

    // =========================================================================
    // ig.ParticleState
    // =========================================================================
    /**
     * Stores and evaluates the alpha / scale / rotation animation curves for a
     * particle.  Curves are piecewise-linear segments with optional KEY_SPLINES
     * easing, structured as:
     *   { valStart, valMiddle, valEnd, start:{time,spline}, end:{time,spline} }
     *
     * Entry data in the JSON:
     *   pAlpha  / pScale / pRotate: { init, start:{time,value,spline}, end:{time,value,spline} }
     */
    ig.ParticleState = ig.Class.extend({
        alpha:  null, // processed alpha curve or null
        scale:  null, // processed scale (Vec2-valued) curve or null
        rotate: null, // processed rotate curve or null

        /** Scratch Vec2 for getScale (avoids allocation). @private */

        init: function (cfg) {
            if (cfg.pAlpha)  this.alpha  = this._convertEntry(cfg.pAlpha);
            if (cfg.pScale)  this.scale  = this._convertEntry(cfg.pScale);
            if (cfg.pRotate) this.rotate = this._convertEntry(cfg.pRotate, 2 * Math.PI);
        },

        /**
         * Normalise a raw pXxx config entry into the internal curve format.
         * @param {object} raw   { init, start:{time,value,spline}, end:{time,value,spline} }
         * @param {number} [multiplier]  scale all values by this (used for rotate → radians)
         * @returns {object} normalised curve descriptor
         * @private
         */
        _convertEntry: function (raw, multiplier) {
            var curve = {
                start:     ig.copy(raw.start),
                end:       ig.copy(raw.end),
                valStart:  raw.init,
                valMiddle: raw.start ? raw.start.value : raw.init,
                valEnd:    raw.end   ? raw.end.value   : (raw.start ? raw.start.value : raw.init)
            };
            if (multiplier) {
                curve.valStart  *= multiplier;
                curve.valMiddle *= multiplier;
                curve.valEnd    *= multiplier;
            }
            if (curve.start) curve.start.spline = KEY_SPLINES[curve.start.spline] || null;
            if (curve.end)   curve.end.spline   = KEY_SPLINES[curve.end.spline]   || null;
            return curve;
        },

        /**
         * Get the latest time at which any end transition completes.
         * @param {number} [acc=0]
         * @returns {number}
         */
        getMaxEndTime: function (acc) {
            acc = acc || 0;
            if (this.alpha  && this.alpha.end)  acc = Math.max(acc, this.alpha.end.time  || 0);
            if (this.scale  && this.scale.end)  acc = Math.max(acc, this.scale.end.time  || 0);
            if (this.rotate && this.rotate.end) acc = Math.max(acc, this.rotate.end.time || 0);
            return acc;
        },

        /**
         * Compute the alpha value at the given time point.
         * @param {number} timer         current time elapsed
         * @param {number} maxTime       total particle duration
         * @param {number} postAnimTime  duration of post animation
         * @returns {number|false} alpha value, or false if no alpha curve
         */
        getAlpha: function (timer, maxTime, postAnimTime) {
            if (this.alpha) {
                var w = this._getEntryWeight(this.alpha, timer, maxTime, postAnimTime);
                if (w === 0) return this.alpha.valMiddle;
                var from, to;
                if (w < 0) { from = this.alpha.valStart;  to = this.alpha.valMiddle; w += 100; }
                else        { from = this.alpha.valMiddle; to = this.alpha.valEnd; }
                return from + w * (to - from);
            }
            return false;
        },

        /**
         * Compute the scale Vec2 at the given time point.
         * Writes into `out` in place.
         * @param {Vec2} out
         * @param {number} timer / maxTime / postAnimTime
         * @param {boolean} flipX  if true, negate out.x
         */
        getScale: function (out, timer, maxTime, postAnimTime, flipX) {
            if (this.scale) {
                var w = this._getEntryWeight(this.scale, timer, maxTime, postAnimTime);
                var from, to;
                if (w === 0) {
                    out.x = this.scale.valMiddle.x;
                    out.y = this.scale.valMiddle.y;
                } else {
                    if (w < 0) { from = this.scale.valStart;  to = this.scale.valMiddle; w += 100; }
                    else        { from = this.scale.valMiddle; to = this.scale.valEnd; }
                    out.x = from.x + w * (to.x - from.x);
                    out.y = from.y + w * (to.y - from.y);
                }
                if (flipX) out.x = -out.x;
            }
        },

        /**
         * Compute the rotation angle at the given time point.
         * @returns {number} angle in radians added to baseAngle
         */
        getRotate: function (timer, maxTime, postAnimTime, baseAngle, flipX) {
            if (this.rotate) {
                var w = this._getEntryWeight(this.rotate, timer, maxTime, postAnimTime);
                var angle = 0;
                if (w === 0) {
                    angle = this.rotate.valMiddle;
                } else {
                    var from, to;
                    if (w < 0) { from = this.rotate.valStart;  to = this.rotate.valMiddle; w += 100; }
                    else        { from = this.rotate.valMiddle; to = this.rotate.valEnd; }
                    angle = from + w * (to - from);
                }
                if (flipX) angle = -angle;
                return baseAngle + angle;
            }
        },

        // -- AnimState helpers ------------------------------------------------

        initAnimState: function (state, startAngle, flipX) {
            state.alpha  = this.alpha  ? this.alpha.valStart  : 1;
            state.angle  = startAngle + (this.rotate ? (flipX ? -this.rotate.valStart : this.rotate.valStart) : 0);
            state.scaleX = this.scale  ? this.scale.valStart.x : 1;
            state.scaleY = this.scale  ? this.scale.valStart.y : 1;
            if (flipX) state.scaleX = -state.scaleX;
        },

        updateAnimState: function (state, timer, maxTime, postAnimTime, startAngle, flipX, angleSync) {
            if (this.alpha) state.alpha = this.getAlpha(timer, maxTime, postAnimTime);
            if (this.scale) {
                // use a local scratch (defined below) to avoid allocation
                this.getScale(_scaleVec, timer, maxTime, postAnimTime, flipX);
                state.scaleX = _scaleVec.x;
                state.scaleY = _scaleVec.y;
            }
            if (this.rotate && (this.rotate.start || this.rotate.end)) {
                state.angle = this.getRotate(timer, maxTime, postAnimTime, startAngle, flipX);
            } else if (angleSync) {
                state.angle = this.rotate
                    ? startAngle + (flipX ? -this.rotate.valStart : this.rotate.valStart)
                    : startAngle;
            }
        },

        // -- Sprite helpers ---------------------------------------------------

        initSprite: function (sprite, startAngle, flipX) {
            sprite.setAlpha(this.alpha ? this.alpha.valStart : 1);
            if (this.scale) {
                sprite.scale.x = this.scale ? this.scale.valStart.x : 1;
                sprite.scale.y = this.scale ? this.scale.valStart.y : 1;
            }
            if (flipX) sprite.scale.y = -sprite.scale.y;
            if (this.rotate) {
                sprite.rotate = startAngle + (this.rotate
                    ? (flipX ? -this.rotate.valStart : this.rotate.valStart)
                    : 0);
            }
        },

        updateSprite: function (sprite, timer, maxTime, postAnimTime, startAngle, flipX, angleSync) {
            if (this.alpha) sprite.setAlpha(this.getAlpha(timer, maxTime, postAnimTime));
            if (this.scale) this.getScale(sprite.scale, timer, maxTime, postAnimTime, flipX);
            if (this.rotate && (this.rotate.start || this.rotate.end)) {
                sprite.rotate = this.getRotate(timer, maxTime, postAnimTime, startAngle, flipX);
            } else if (angleSync) {
                sprite.rotate = this.rotate
                    ? startAngle + (flipX ? -this.rotate.valStart : this.rotate.valStart)
                    : startAngle;
            }
        },

        // -- private ----------------------------------------------------------

        /**
         * Compute a blending weight from the current time within the particle's life.
         *
         * Returns a value in [-100, 0, 100]:
         *   negative → in the "start" fade-in  phase (mapped to 0–1 by adding 100)
         *   zero     → at the stable middle value
         *   positive → in the "end"   fade-out phase (0–1)
         *
         * @param {object} curve   normalised curve descriptor
         * @param {number} timer
         * @param {number} maxTime
         * @param {number} postAnimTime
         * @returns {number}
         * @private
         */
        _getEntryWeight: function (curve, timer, maxTime, postAnimTime) {
            var endDur   = curve.end   ? (curve.end.time   || postAnimTime) : 0;
            var startDur = curve.start ? (curve.start.time || maxTime - endDur) : 0;
            var weight   = 0;

            if (timer < startDur) {
                weight = (timer / startDur).limit(0, 1);
                if (curve.start.spline) weight = curve.start.spline.get(weight);
                weight = weight - 100; // negative → in start phase
            } else if (maxTime > 0 && curve.end && maxTime - timer < endDur) {
                weight = (1 - (maxTime - timer) / endDur).limit(0, 1);
                if (curve.end.spline) weight = curve.end.spline.get(weight);
                // positive → in end phase
            }
            return weight;
        }
    });

    /** Scratch Vec2 for ParticleState.updateAnimState / getScale. @private */
    var _scaleVec = Vec2.create();

    // =========================================================================
    // ig.EffectSheet
    // =========================================================================
    /**
     * Loads a `data/effects/<path>.json` file and creates ig.Effect instances
     * from the EFFECTS map within it.
     *
     * JSON structure:
     * ```json
     * {
     *   "name": "...",
     *   "ANIMS": { ... ig.AnimationSheet config ... },
     *   "FACEANIMS": { ... },
     *   "EFFECTS": {
     *     "effectName": [
     *       { "type": "PLAY_ANIM", ... },
     *       { "type": "WAIT", "time": 0.5 },
     *       ...
     *     ]
     *   }
     * }
     * ```
     * @extends ig.JsonLoadable
     */
    ig.EffectSheet = ig.JsonLoadable.extend({
        cacheType:    "EffectSheet",
        animSheet:    null,      // ig.AnimationSheet for particle sprite anims
        faceAnimSheet: null,     // ig.AnimationSheet for face-direction anims
        effects:       {},       // { [name]: ig.Effect }
        debugReload:   true,

        onCacheCleared: function () {
            if (this.animSheet)     this.animSheet.clearCached();
            if (this.faceAnimSheet) this.faceAnimSheet.clearCached();
            for (var name in this.effects) this.effects[name].clearCached();
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/effects/", ".json") + ig.getCacheSuffix();
        },

        onload: function (json) {
            this.name = json.name;

            if (json.ANIMS) {
                json.ANIMS.shapeType   = json.ANIMS.shapeType   || "YZ_EXPAND";
                if (json.ANIMS.wallY        === undefined) json.ANIMS.wallY        = 1;
                if (json.ANIMS.centerPivot  === undefined) json.ANIMS.centerPivot  = true;
                this.animSheet = new ig.AnimationSheet(json.ANIMS);
            }

            if (json.FACEANIMS) {
                json.FACEANIMS.DOCTYPE = json.FACEANIMS.DOCTYPE || "MULTI_DIR_ANIMATION";
                this.faceAnimSheet = new ig.AnimationSheet(json.FACEANIMS);
            }

            for (var name in json.EFFECTS) {
                this.effects[name] = new ig.Effect(this, name, json.EFFECTS[name]);
            }
        },

        /**
         * @param {string} name
         * @returns {boolean}
         */
        hasEffect: function (name) {
            return !!this.effects[name];
        },

        /**
         * Spawn the named effect centred on an entity.
         * @param {string} name
         * @param {ig.Entity} target
         * @param {object} [opts]  see ig.ENTITY.Effect opts table
         * @returns {ig.ENTITY.Effect|null}
         */
        spawnOnTarget: function (name, target, opts) {
            if (!this.loaded) return null;
            if (!this.effects[name]) {
                ig.warn("Could not span effect '" + name + "' of sheet '" + this.path + "'");
                return null;
            }
            if (!target) return null;
            opts = opts || {};
            var center = target.getCenter();
            return ig.game.spawnEntity(ig.ENTITY.Effect, center.x, center.y, target.coll.pos.z, {
                effect:         this.effects[name],
                target:         target,
                target2:        opts.target2,
                target2Point:   opts.target2Point,
                target2Align:   opts.target2Align,
                target2Offset:  opts.target2Offset,
                noMultiGroup:   opts.noMultiGroup,
                spriteFilter:   opts.spriteFilter,
                offset:         opts.offset,
                rotOffset:      opts.rotOffset,
                align:          opts.align  || ig.ENTITY_ALIGN.BOTTOM,
                angle:          opts.angle  || 0,
                flipX:          opts.flipX  || false,
                rotateFace:     opts.rotateFace    || 0,
                flipLeftFace:   opts.flipLeftFace  || false,
                duration:       opts.duration      || 0,
                group:          opts.group         || null,
                callback:       opts.callback
            });
        },

        /**
         * Spawn the named effect at a fixed world position.
         * @param {string} name
         * @param {number} x / y / z — world coordinates
         * @param {ig.Entity|null} optTarget   optional entity for time-parent
         * @param {object} [opts]
         * @returns {ig.ENTITY.Effect|null}
         */
        spawnFixed: function (name, x, y, z, optTarget, opts) {
            if (!this.loaded) return null;
            if (!this.effects[name]) {
                ig.warn("Could not span effect '" + name + "' of sheet '" + this.path + "'");
                return null;
            }
            opts = opts || {};
            return ig.game.spawnEntity(ig.ENTITY.Effect, x, y, z, {
                effect:        this.effects[name],
                target:        optTarget,
                target2:       opts.target2,
                target2Point:  opts.target2Point,
                target2Align:  opts.target2Align,
                target2Offset: opts.target2Offset,
                noMultiGroup:  opts.noMultiGroup,
                spriteFilter:  opts.spriteFilter,
                align:         0,                 // fixed position → no alignment
                flipX:         opts.flipX         || false,
                rotateFace:    opts.rotateFace    || 0,
                flipLeftFace:  opts.flipLeftFace  || false,
                angle:         opts.angle         || 0,
                duration:      opts.duration      || 0,
                group:         opts.group         || null,
                callback:      opts.callback
            });
        }
    });

    // =========================================================================
    // ig.FX_RUNNER_CANCEL
    // =========================================================================
    /**
     * Signals used by ig.Effect.update to tell ig.ENTITY.Effect.cancelRunners
     * how aggressively to cancel active runners when the loop section ends.
     * @enum {number}
     */
    ig.FX_RUNNER_CANCEL = {
        NONE:       0, // don't cancel anything
        ALL:        1, // cancel all runners (looping → post-loop)
        ONLY_PERMA: 2  // cancel only "forever" (duration=-1) runners
    };

    // =========================================================================
    // ig.Effect
    // =========================================================================
    /**
     * A compiled, immutable effect timeline loaded from an ig.EffectSheet.
     * Instances are shared across all running copies of the same effect.
     *
     * The timeline is driven externally by ig.ENTITY.Effect.deferredUpdate()
     * which calls ig.Effect.update(effectEntity) each tick.
     *
     * Timeline structure
     * ------------------
     *   steps[]  — array of ig.EffectStepBase subclass instances, each with a .time
     *   Loop region: [loopStartIdx, loopEndIdx) / [loopStartTime, loopEndTime)
     *   Post-loop:   steps after loopEndIdx, played once after duration expires
     */
    ig.Effect = ig.Class.extend({
        id:          null, // "<sheet.path>/<effectName>"
        steps:       [],
        loopStartIdx:  0,
        loopStartTime: 0,
        loopEndIdx:   -1,
        loopEndTime:  -1,
        maxTime:       0,

        /**
         * @param {ig.EffectSheet} sheet
         * @param {string} effectName
         * @param {object[]} stepConfigs   raw JSON step array
         */
        init: function (sheet, effectName, stepConfigs) {
            this.id   = sheet.path + "/" + effectName;
            var timer = 0;
            _currentEffectName = effectName;

            for (var i = 0; i < stepConfigs.length; ++i) {
                var cfg  = stepConfigs[i];
                var type = cfg.type;
                var step;

                if (type === "WAIT") {
                    timer += cfg.time;
                    this.maxTime = Math.max(this.maxTime, timer);
                    step = new ig.EffectStepBase();
                } else if (type === "LOOP_START") {
                    this.loopStartIdx  = this.steps.length;
                    this.loopStartTime = timer;
                    step = new ig.EffectStepBase();
                } else if (type === "LOOP_END") {
                    this.loopEndIdx  = this.steps.length;
                    this.loopEndTime = timer;
                    this.maxTime     = this.loopEndTime;
                    step = new ig.EffectStepBase();
                } else {
                    step = new ig.EFFECT_ENTRY[type](sheet, cfg);
                }

                step.time = timer;
                this.steps.push(step);

                var dur = step.getDuration ? step.getDuration() : 0;
                if (!dur || dur < 0) dur = 0;
                this.maxTime = Math.max(this.maxTime, timer + dur);
            }

            // default loop region = entire timeline
            if (this.loopEndIdx === -1) {
                this.loopEndIdx  = this.steps.length;
                this.loopEndTime = this.maxTime;
            }

            // avoid a zero-length loop region (causes divide-by-zero)
            if (this.loopEndTime - this.loopStartTime === 0 &&
                this.loopEndIdx >= this.steps.length - 1) {
                this.loopEndTime += 0.1;
                this.maxTime = Math.max(this.maxTime, this.loopEndTime);
            }
        },

        clearCached: function () {
            for (var i = 0; i < this.steps.length; ++i) {
                if (this.steps[i].clearCached) this.steps[i].clearCached();
            }
        },

        /**
         * Advance the effect timeline by one tick.
         * Called by ig.ENTITY.Effect.deferredUpdate.
         * @param {ig.ENTITY.Effect} entity
         */
        update: function (entity) {
            entity.timer += ig.system.tick;
            var wasInfinite = entity.duration === 0;

            if (entity.duration > 0) {
                entity.duration -= ig.system.tick;
                if (entity.duration <= ig.COLLISION.EPS) entity.duration = 0;
            }

            entity.updateRunners();

            var steps  = this.steps;
            var cancel = ig.FX_RUNNER_CANCEL.NONE;

            // if duration ran out while we're still in the loop region,
            // fast-forward the timer to the loop end
            if (entity.timelineIndex < this.loopEndIdx && !entity.duration) {
                entity.timer = this.loopEndTime;
                if (wasInfinite || entity.looped) entity.timelineIndex = this.loopEndIdx;
            }

            if (!entity.duration) {
                if (entity.state === ig.EFFECT_STATE.RUNNING && entity.timer >= this.loopEndTime) {
                    cancel       = ig.FX_RUNNER_CANCEL.ALL;
                    entity.state = ig.EFFECT_STATE.POST_LOOP;
                    if (entity.callback) entity.callback.onEffectEvent(entity);
                }
                if (entity.state === ig.EFFECT_STATE.POST_LOOP && entity.timer >= this.maxTime) {
                    cancel       = cancel || ig.FX_RUNNER_CANCEL.ONLY_PERMA;
                    entity.state = ig.EFFECT_STATE.ENDED;
                    if (entity.callback) entity.callback.onEffectEvent(entity);
                }
            }

            if (entity.timelineIndex >= this.loopEndIdx && cancel) {
                entity.cancelRunners(cancel === ig.FX_RUNNER_CANCEL.ONLY_PERMA);
                cancel = null;
            }

            // process steps whose time has been reached
            while (entity.timelineIndex < steps.length &&
                   steps[entity.timelineIndex].time <= entity.timer) {

                var step   = steps[entity.timelineIndex];
                var result = step.start(entity);

                if (result) {
                    var runner = result.particles
                        ? new ig.EffectParticleRunner(step, result)
                        : new ig.EffectTimeRunner(step, result);
                    if (!runner.update(entity)) entity.runners.push(runner);
                }

                entity.timelineIndex++;

                // reached the loop end → wrap back to loop start
                if (entity.timelineIndex === this.loopEndIdx) {
                    if (cancel) {
                        entity.cancelRunners(cancel === ig.FX_RUNNER_CANCEL.ONLY_PERMA);
                        cancel = 0;
                    }
                    var loopDuration = this.loopEndTime - this.loopStartTime;
                    if (loopDuration <= 0 || !entity.duration) break;
                    entity.looped         = true;
                    entity.timer         -= loopDuration;
                    entity.timelineIndex  = this.loopStartIdx;
                }
            }
        },

        /** @returns {boolean} true when the loop region has been passed */
        isEnding: function (entity) {
            return entity.timer >= this.loopEndTime;
        },

        /** @returns {boolean} true when the post-loop section has also finished */
        isDone: function (entity) {
            return entity.timer >= this.maxTime;
        },

        /**
         * @param {ig.ENTITY.Effect} entity
         * @returns {number} estimated seconds remaining
         */
        getRemainingTime: function (entity) {
            return entity.duration >= 0
                ? entity.duration + (this.maxTime - this.loopEndTime)
                : this.maxTime;
        }
    });

    // =========================================================================
    // ig.EffectStepBase
    // =========================================================================
    /**
     * Base class for all ig.EFFECT_ENTRY step types.
     * Also used as a no-op placeholder for WAIT / LOOP_START / LOOP_END.
     */
    ig.EffectStepBase = ig.Class.extend({
        time: 0,

        /** Called when the step's time is reached.  May return runner data. */
        start:       function () {},

        /** @returns {number} how long this step's runner should live (0 = instant) */
        getDuration: function () { return 0; }
    });

    // =========================================================================
    // ig.EffectHandle
    // =========================================================================
    /**
     * A thin named reference to an effect within an ig.EffectSheet.
     * Created by ACTION_STEP.SHOW_EFFECT and EVENT_STEP.SHOW_EFFECT during init.
     *
     * @param {object} cfg
     * @param {string|ig.EffectSheet} cfg.sheet  path string or existing sheet instance
     * @param {string} cfg.name                  effect name within the sheet
     */
    ig.EffectHandle = ig.Class.extend({
        effectSheet:   null,
        name:          null,
        externalSheet: false, // if true, sheet was passed in — don't decreaseRef on clearCached

        init: function (cfg) {
            if (cfg.sheet instanceof ig.EffectSheet) {
                this.effectSheet   = cfg.sheet;
                this.externalSheet = true;
            } else {
                this.effectSheet = new ig.EffectSheet(cfg.sheet);
            }
            this.name = cfg.name;
        },

        clearCached: function () {
            if (!this.externalSheet && this.effectSheet) this.effectSheet.decreaseRef();
        },

        spawnOnTarget: function (target, opts) {
            return this.effectSheet.spawnOnTarget(this.name, target, opts);
        },

        spawnFixed: function (x, y, z, optTarget, opts) {
            return this.effectSheet.spawnFixed(this.name, x, y, z, optTarget, opts);
        }
    });

    // =========================================================================
    // ig.EffectTimeRunner
    // =========================================================================
    /**
     * Drives a step that runs for a fixed duration.
     * Created by ig.Effect.update when a step.start() returns a non-particle result.
     */
    ig.EffectTimeRunner = ig.Class.extend({
        step:     null,
        data:     null,
        duration: 0,
        _timer:   0,

        init: function (step, data) {
            this.step     = step;
            this.data     = data;
            this.duration = data.duration;
        },

        /**
         * @param {ig.ENTITY.Effect} entity
         * @returns {boolean} true when done (runner should be removed)
         */
        update: function (entity) {
            this._timer += ig.system.tick;
            this.step.update(entity, this._timer, this.duration, this.data);
            var done = this.duration >= 0 && this._timer > this.duration;
            if (done && this.step.finish) this.step.finish(entity, this.data);
            return done;
        },

        /**
         * @param {ig.ENTITY.Effect} entity
         * @param {boolean} onlyPermanent  if true, skip finite-duration runners
         * @returns {boolean} true when runner is fully cancelled
         */
        cancel: function (entity, onlyPermanent) {
            if (onlyPermanent && this.duration >= 0) return false; // skip finite
            var fadeTime = 0;
            if (this.duration < 0) {
                fadeTime = this.step.cancel && this.step.cancel(entity, this._timer, this.data);
            }
            if (fadeTime > 0) {
                this.duration = fadeTime; // let it fade out over fadeTime seconds
            } else {
                if (this.step.finish) this.step.finish(entity, this.data);
                return true;
            }
            return false;
        }
    });

    // =========================================================================
    // ig.EffectParticleRunner
    // =========================================================================
    /**
     * Drives a step that emits a batch of particles metered over a duration.
     * Created by ig.Effect.update when step.start() returns an object with a
     * `particles` field.
     */
    ig.EffectParticleRunner = ig.Class.extend({
        step:            null,
        data:            null,
        totalParticles:  0,
        currentParticle: 0,
        duration:        0,
        _timer:          0,

        init: function (step, data) {
            this.step           = step;
            this.data           = data;
            this.totalParticles = data.particles;
            this.keySpline      = data.keySpline;
            this.duration       = data.duration;
        },

        /**
         * Spawn any particles that should exist by now.
         * @returns {boolean} true when all particles have been spawned
         */
        update: function (entity) {
            var prevCount = this.currentParticle;
            this._timer += ig.system.tick;

            var t = Math.min(1, this._timer / this.duration);
            if (this.keySpline) t = this.keySpline.get(t);
            var targetCount = Math.ceil(t * this.totalParticles);
            this.currentParticle = Math.min(targetCount, this.totalParticles);

            this.step.update(entity, prevCount, this.currentParticle, this.data);
            return this.currentParticle === this.totalParticles;
        },

        cancel: function (entity) {
            if (this.step.finish) this.step.finish(entity, this.data);
            return true;
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY
    // =========================================================================
    /**
     * Registry for all effect step types.
     * Entries are added by the fx-*.js modules:
     *   ig.EFFECT_ENTRY.PLAY_ANIM = ...
     *   ig.EFFECT_ENTRY.PLAY_SOUND = ...
     *   etc.
     */
    ig.EFFECT_ENTRY = {};

});
