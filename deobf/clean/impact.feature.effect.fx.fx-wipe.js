/**
 * impact.feature.effect.fx.fx-wipe
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-wipe")`.
 *
 * Defines effect steps that animate the *position* and *clipping* of the target entity's
 * sprites — useful for reveal / concealment transitions.
 *
 * Defines:
 *   ig.EFFECT_ENTRY.MOVE_OFFSET   — interpolate a positional offset on the target's sprites
 *   ig.EFFECT_ENTRY.WIPE          — clip the target's sprites along a NORTH/SOUTH edge
 *   ig.EFFECT_ENTRY.WIPE_PARTICLES — emit OffsetParticles along a wipe front
 */

ig.module("impact.feature.effect.fx.fx-wipe")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- module-scoped scratch ------------------------------------------------
    var _lerpScratch = Vec3.create(); // scratch for Vec3.lerp in MOVE_OFFSET.update
    var _boundsA     = {};            // scratch for ig.EntityTools.getSpriteBounds in WIPE_PARTICLES
    var _pSettings   = {};            // reused particle-settings for WIPE_PARTICLES
    var _spawnPos    = Vec3.create(); // per-particle spawn position

    // =========================================================================
    // ig.EFFECT_ENTRY.MOVE_OFFSET
    // =========================================================================
    /**
     * Smoothly translates all sprites of the target entity from `start` to `end`
     * over `duration` seconds by writing to each sprite's `tmpOffset` Vec3.
     *
     * If `relative` is true the offsets are multiplied component-wise by the
     * entity's collision size, so values can be expressed as fractions (e.g.
     * 0.5 = half the entity width).
     *
     * The optional `spriteFilter` array on the effect entity restricts which
     * sprite indices receive the offset.
     *
     * Step config fields:
     *   start     {Offset}          Vec3 offset at t=0
     *   end       {Offset}          Vec3 offset at t=duration
     *   relative  {boolean}         multiply by entity size if true
     *   duration  {number}          transition time in seconds
     *   keySpline {KEY_SPLINES key} easing curve (default EASE_IN_OUT)
     */
    ig.EFFECT_ENTRY.MOVE_OFFSET = ig.EffectStepBase.extend({
        startValue: null,
        endValue:   null,
        relative:   false,
        duration:   0,
        keySpline:  null,

        _wm: new ig.Config({
            attributes: {
                start:    { _type: "Offset", _info: "Offset at start" },
                end:      { _type: "Offset", _info: "Offset at end" },
                relative: { _type: "Boolean", _info: "If true, multiply each offset with size of entity" },
                duration: { _type: "Number",  _info: "Duration of wipe." },
                keySpline:{ _type: "String",  _info: "Keyspline of movement", _select: KEY_SPLINES }
            }
        }),

        init: function (sheet, cfg) {
            this.startValue = cfg.start;
            this.endValue   = cfg.end;
            this.relative   = cfg.relative || false;
            this.duration   = cfg.duration || 0;
            this.keySpline  = KEY_SPLINES[cfg.keySpline] || KEY_SPLINES.EASE_IN_OUT;
        },

        getDuration: function () { return this.duration; },

        start: function (effectEntity) {
            if (!effectEntity.target) return;
            return { duration: this.duration };
        },

        update: function (effectEntity, timer, duration) {
            if (!effectEntity.target) return;
            var t      = this.keySpline.get(Math.min(1, timer / duration));
            var offset = Vec3.lerp(this.startValue, this.endValue, t, _lerpScratch);
            if (this.relative) Vec3.mul(offset, effectEntity.target.coll.size);
            this._setEntityOffset(effectEntity.target, offset, effectEntity.spriteFilter);
        },

        finish: function () {},

        /**
         * Apply `offset` to every sprite's `tmpOffset` field, respecting the filter list.
         * Recurses into sub-colls.
         * @param {ig.Entity} entity
         * @param {Vec3}      offset
         * @param {number[]}  spriteFilter  null or array of allowed sprite indices
         * @private
         */
        _setEntityOffset: function (entity, offset, spriteFilter) {
            var sprites = entity.sprites;
            for (var i = sprites.length; i--;) {
                var sprite = sprites[i];
                // skip if not in filter (null filter = all sprites)
                if (spriteFilter !== null && spriteFilter.indexOf(i) === -1) continue;
                Vec3.assign(sprite.tmpOffset, offset);
            }
            var subColls = entity.coll.subColls;
            if (subColls.length > 0) {
                for (var s = subColls.length; s--;) {
                    this._setEntityOffset(subColls[s].entity, offset, spriteFilter);
                }
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.WIPE
    // =========================================================================
    /**
     * Clips the top or bottom rows of pixels from the target entity's sprites,
     * creating a "wipe" reveal or conceal effect.
     *
     * Each sprite's `gfxCut` (top/bottom pixel offsets) is updated every frame.
     *
     * Step config fields:
     *   dir           {WIPE_DIRECTION key}  NORTH = wipe from top, SOUTH = wipe from bottom
     *   startValue    {number}              initial wipe position (0=none, 1=fully wiped)
     *   endValue      {number}              final wipe position
     *   duration      {number}              transition time in seconds
     *   setOnlyOneSide {boolean}            only set clipping for the active side, allowing
     *                                       two WIPE steps to run in parallel from different ends
     */
    ig.EFFECT_ENTRY.WIPE = ig.EffectStepBase.extend({
        dir:            0,
        startValue:     0,
        endValue:       0,
        duration:       0,
        setOnlyOneSide: false,

        _wm: new ig.Config({
            attributes: {
                dir:            { _type: "String",  _info: "Wipe direction", _select: ig.WIPE_DIRECTION },
                startValue:     { _type: "Number",  _info: "Start wipe position (0-1). 1=all wiped away." },
                endValue:       { _type: "Number",  _info: "End wipe position (0-1). 1=all wiped away." },
                duration:       { _type: "Number",  _info: "Duration of wipe." },
                setOnlyOneSide: { _type: "Boolean", _info: "If true, do not set clipping for any other side. This allows running wipes in parallel." }
            }
        }),

        init: function (sheet, cfg) {
            this.dir            = ig.WIPE_DIRECTION[cfg.dir] || ig.WIPE_DIRECTION.NORTH;
            this.startValue     = cfg.startValue     || 0;
            this.endValue       = cfg.endValue       || 0;
            this.duration       = cfg.duration       || 0;
            this.setOnlyOneSide = cfg.setOnlyOneSide || 0;
        },

        getDuration: function () { return this.duration; },

        start: function (effectEntity) {
            if (!effectEntity.target) return;
            var bounds = {
                duration: 0,
                left:     -1e3,
                right:    -1e3,
                top:      -1e3,
                bottom:   -1e3
            };
            ig.EntityTools.getSpriteBounds(bounds, effectEntity.target);
            bounds.duration = this.duration;
            return bounds;
        },

        update: function (effectEntity, timer, duration, runnerData) {
            if (!effectEntity.target) return;

            var coll    = effectEntity.target.coll;
            // world-space sprite bounding box corners
            var worldLeft   = coll.pos.x - runnerData.left;
            var worldRight  = coll.pos.x + runnerData.right;
            var worldTop    = coll.pos.y - coll.pos.z - runnerData.top;
            var worldBottom = coll.pos.y - coll.pos.z + runnerData.bottom;

            var t     = Math.min(1, timer / duration);
            var wipeT = this.startValue + t * (this.endValue - this.startValue);

            switch (this.dir) {
                case ig.WIPE_DIRECTION.NORTH:
                    worldTop = worldTop + wipeT * (worldBottom - worldTop);
                    break;
                case ig.WIPE_DIRECTION.SOUTH:
                    worldBottom = worldBottom - wipeT * (worldBottom - worldTop);
                    break;
            }

            var onlyDir = this.setOnlyOneSide ? this.dir : null;
            this._setEntityClipping(
                effectEntity.target,
                worldLeft, worldRight, worldTop, worldBottom,
                effectEntity.spriteFilter,
                onlyDir
            );
        },

        finish: function (effectEntity) {
            // if ending fully un-wiped, clear clipping so sprites render normally
            if (this.endValue === 0) {
                ig.EntityTools.clearEntitySpriteCut(
                    effectEntity.target,
                    this.setOnlyOneSide ? this.dir : null
                );
            }
        },

        /**
         * Write gfxCut values to every sprite on `entity` (and its sub-entities).
         * @private
         */
        _setEntityClipping: function (entity, worldLeft, worldRight, worldTop, worldBottom, spriteFilter, onlyDir) {
            var sprites = entity.sprites;
            for (var i = sprites.length; i--;) {
                var sprite = sprites[i];
                // skip if not in the allowed filter
                if (spriteFilter !== null && spriteFilter.indexOf(i) === -1) continue;

                var cutTop    = Math.round(Math.max(0, worldTop    - (sprite.pos.y - sprite.pos.z - sprite.size.z)));
                var cutBottom = Math.round(Math.max(0, sprite.pos.y - sprite.pos.z + sprite.size.y - worldBottom));

                if (onlyDir) {
                    // parallel wipe mode: only update the side that this step owns
                    if (onlyDir !== ig.WIPE_DIRECTION.NORTH)  cutTop    = sprite.gfxCut.top;
                    if (onlyDir !== ig.WIPE_DIRECTION.SOUTH)  cutBottom = sprite.gfxCut.bottom;
                }

                sprite.setGfxCut(cutTop, cutBottom);
            }

            var subColls = entity.coll.subColls;
            if (subColls.length > 0) {
                for (var s = subColls.length; s--;) {
                    this._setEntityClipping(subColls[s].entity, worldLeft, worldRight, worldTop, worldBottom, spriteFilter, onlyDir);
                }
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.WIPE_PARTICLES
    // =========================================================================
    /**
     * Emits OffsetParticles evenly distributed along the current wipe boundary,
     * creating a "sparkling edge" effect that tracks the wipe front.
     *
     * The wipe position progresses from `startValue` to `endValue` over `duration`
     * seconds, and particles are emitted from the corresponding height of the
     * target entity's sprite bounds.
     *
     * Step config fields (in addition to particle-state fields):
     *   dir         {WIPE_DIRECTION key}   NORTH or SOUTH wipe direction
     *   startValue  {number}               initial wipe position (0–1)
     *   endValue    {number}               final wipe position (0–1)
     *   duration    {number}               total wipe time
     *   numParticles {number}              particles per second per 32px of target width
     *   moveOffset  {Vec2}                 OffsetParticle move vector
     *   inverse     {boolean}              if true, particle moves in reverse (starts at top)
     *   xScale      {number}               fraction of entity width to cover (default 0.8)
     *   keySpline   {KEY_SPLINES key}      easing for moveOffset (optional)
     *   offset      {Offset}               additional positional offset (optional)
     */
    ig.EFFECT_ENTRY.WIPE_PARTICLES = ig.EffectStepBase.extend({
        particleData: null,
        dir:          0,
        startValue:   0,
        endValue:     0,
        duration:     0,
        numParticles: 0,
        moveOffset:   Vec2.create(),
        keySpline:    null,
        inverse:      false,
        xScale:       0.8,
        offset:       null,

        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                dir:          { _type: "String",  _info: "Wipe direction", _select: ig.WIPE_DIRECTION },
                startValue:   { _type: "Number",  _info: "Start wipe position (0-1). 1=all wiped away." },
                endValue:     { _type: "Number",  _info: "End wipe position (0-1). 1=all wiped away." },
                duration:     { _type: "Number",  _info: "Duration of wipe." },
                numParticles: { _type: "Integer", _info: "Number of particles spawned per second and 32 pixel target width" },
                moveOffset:   { _type: "Vec2",    _info: "Move offset of individual particles", _optional: true },
                inverse:      { _type: "Boolean", _info: "True if particle should move in reverse", _optional: true },
                xScale:       { _type: "Number",  _info: "How much of the x dimension should be covered. 1=full", _optional: true },
                keySpline:    { _type: "String",  _info: "KeySpline for moveOffset movement.", _select: KEY_SPLINES, _optional: true },
                offset:       { _type: "Offset",  _info: "Offset to position", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            this.dir          = ig.WIPE_DIRECTION[cfg.dir] || ig.WIPE_DIRECTION.NORTH;
            this.startValue   = cfg.startValue   || 0;
            this.endValue     = cfg.endValue     || 0;
            this.duration     = cfg.duration     || 0;
            this.xScale       = (cfg.xScale === undefined) ? 0.8 : cfg.xScale;
            this.offset       = cfg.offset;
            this.numParticles = cfg.numParticles || 2;
            if (cfg.moveOffset) Vec2.assign(this.moveOffset, cfg.moveOffset);
            this.keySpline    = KEY_SPLINES[cfg.keySpline] || null;
            this.inverse      = cfg.inverse      || false;
        },

        getDuration: function () {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        start: function (effectEntity) {
            if (!effectEntity.target) return;
            ig.EntityTools.getSpriteBounds(_boundsA, effectEntity.target);
            var totalWidth = _boundsA.left + _boundsA.right;
            return {
                duration:  this.duration,
                particles: this.numParticles * totalWidth / 32 * this.duration,
                offX:      -_boundsA.left,
                offY:       _boundsA.bottom,
                width:     totalWidth,
                height:    _boundsA.top + _boundsA.bottom
            };
        },

        update: function (effectEntity, from, to, runnerData) {
            _pSettings.data       = this.particleData;
            _pSettings.keySpline  = this.keySpline;
            _pSettings.inverse    = this.inverse;
            _pSettings.alongZ     = true;
            _pSettings.moveOffset = this.moveOffset;

            for (var i = from; i < to; ++i) {
                // interpolate this particle's wipe height fraction
                var factor = (runnerData.particles > 1) ? i / (runnerData.particles - 1) : 0;
                var wipeT  = this.startValue + factor * (this.endValue - this.startValue);

                // NORTH wipe: wipeT=0 at top → invert so particles start at the front
                if (this.dir === ig.WIPE_DIRECTION.NORTH) wipeT = 1 - wipeT;

                var spawnOffset = Vec3.assignC(_spawnPos, 0, 0, 0);

                if (this.inverse) {
                    // when inverse=true, particle will travel upward by its full lifetime height
                    var particleDuration = ig.EffectConfig.getParticleDuration(this.particleData);
                    spawnOffset.z += runnerData.height * particleDuration / this.duration;
                }

                // random X within the covered width, fixed Y at sprite bottom
                spawnOffset.x += runnerData.offX
                    + runnerData.width * (0.5 - this.xScale / 2)
                    + Math.random() * runnerData.width * this.xScale;
                spawnOffset.y += runnerData.offY;
                spawnOffset.z += wipeT * runnerData.height;

                if (this.offset) Vec3.add(spawnOffset, this.offset);

                effectEntity.spawnParticle(ig.ENTITY.OffsetParticle, spawnOffset, _pSettings, true);
            }
        }
    });

});
