/**
 * impact.feature.effect.fx.fx-basic
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-basic")`.
 *
 * Registers the most common ig.EFFECT_ENTRY step types used in almost every
 * effect sheet.
 *
 * Defines
 * -------
 *   ig.EFFECT_ENTRY.WAIT                — no-op time-gap placeholder (handled by ig.Effect.init)
 *   ig.EFFECT_ENTRY.LOOP_START          — marks the beginning of the loop region
 *   ig.EFFECT_ENTRY.LOOP_END            — marks the end of the loop region
 *
 *   ig.EFFECT_ENTRY.PLAY_ANIM           — spawn a plain Particle at the effect position
 *   ig.EFFECT_ENTRY.PLAY_FACE_ANIM      — spawn a FaceParticle that covers the target entity
 *   ig.EFFECT_ENTRY.PLAY_ANIM_RANGE     — scatter N particles within a radius around the effect
 *   ig.EFFECT_ENTRY.PLAY_ANIMS_OVER_ENTITY — cover a target entity's bounding box with particles
 *   ig.EFFECT_ENTRY.DEBRIS_OVER_ENTITY  — scatter physics-debris particles over a target
 *
 *   ig.EFFECT_ENTRY.PLAY_SOUND         — play a sound (optional: looping, spatialised)
 *   ig.EFFECT_ENTRY.PLAY_RANDOM_SOUND  — pick one sound from a list and play it
 *   ig.EFFECT_ENTRY.STOP_SOUNDS        — stop all sound handles attached to the effect entity
 */

ig.module("impact.feature.effect.fx.fx-basic")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- module-scoped scratch vectors ----------------------------------------
    var _v3a = Vec3.create(); // general scratch
    var _v2a = Vec2.create(); // general scratch
    var _v2b = Vec2.create(); // second Vec2 scratch (DEBRIS_OVER_ENTITY)
    var _spriteBounds    = {}; // reused by PLAY_ANIMS_OVER_ENTITY and DEBRIS_OVER_ENTITY
    var _particleSettings = {}; // reused particle-settings object for update() calls

    // =========================================================================
    // Control-flow placeholders (ig.Effect.init handles them specially)
    // =========================================================================

    ig.EFFECT_ENTRY.WAIT = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: { time: { _type: "Number", _info: "Time to wait" } } })
    });

    ig.EFFECT_ENTRY.LOOP_START = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} })
    });

    ig.EFFECT_ENTRY.LOOP_END = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} })
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_ANIM
    // =========================================================================
    /**
     * Spawns a single Particle at the effect's current position.
     * Supports an optional static or rotation-relative offset.
     *
     * Step config fields
     * ------------------
     *   anim            {string}   animation name in the effect sheet's ANIMS section
     *   followUpAnim    {string}   played before main anim (optional)
     *   postAnim        {string}   played at end of life (optional)
     *   offset          {Offset}   fixed positional offset (optional)
     *   rotOffset       {Offset}   positional offset rotated with the effect's angle (optional)
     *   useTargetAngle  {boolean}  add the target entity's animState.angle to the particle angle
     *   keepAngleSync   {boolean}  keep updating angle each frame to match the effect's live angle
     *   ... + all ig.EffectConfig particle-state fields (pAlpha, pScale, pRotate, etc.)
     */
    ig.EFFECT_ENTRY.PLAY_ANIM = ig.EffectStepBase.extend({
        particleData:   null,
        offset:         { x: 0, y: 0, z: 0 },
        rotOffset:      null,
        useTargetAngle: false,
        keepAngleSync:  false,

        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                useTargetAngle: { _type: "Boolean", _info: "Align animation with effect rotation" },
                keepAngleSync:  { _type: "Boolean", _info: "If true: Keep target angle synchronized while particle is visible" },
                offset:         { _type: "Offset",  _info: "Offset to effect center", _optional: true },
                rotOffset:      { _type: "Offset",  _info: "Offset rotated with effect direction", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData   = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            if (cfg.offset) this.offset = cfg.offset;
            this.rotOffset      = cfg.rotOffset      || null;
            this.useTargetAngle = cfg.useTargetAngle || false;
            this.keepAngleSync  = cfg.keepAngleSync  || false;
        },

        start: function (effectEntity) {
            // compute particle angle
            var angle = effectEntity.angle;
            if (this.useTargetAngle && effectEntity.target && effectEntity.target.animState) {
                angle += effectEntity.target.animState.angle;
            }

            // sync source: live angle updates from effect entity each frame
            var angleSync = this.keepAngleSync ? effectEntity : null;

            // compute offset (rotate rotOffset into effect angle, then add static offset)
            var offset = Vec3.assignC(_v3a, 0, 0, 0);
            if (this.rotOffset) {
                Vec3.add(offset, this.rotOffset);
                Vec2.rotate(offset, -effectEntity.angle);
            }
            Vec3.add(offset, this.offset);

            effectEntity.spawnParticle(ig.ENTITY.Particle, offset, {
                data:      this.particleData,
                angle:     angle,
                flipX:     effectEntity.flipX,
                angleSync: angleSync
            });
        },

        getDuration: function () {
            return ig.EffectConfig.getParticleBlockTime(this.particleData);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_FACE_ANIM
    // =========================================================================
    /**
     * Spawns a FaceParticle at the effect position, sized to match the target entity.
     * Uses the effect sheet's FACEANIMS section instead of ANIMS.
     *
     * Step config fields (in addition to particle-state fields):
     *   anim    {string}   animation name in the FACEANIMS section
     *   offset  {Offset}   positional offset (optional)
     */
    ig.EFFECT_ENTRY.PLAY_FACE_ANIM = ig.EffectStepBase.extend({
        particleData: null,
        offset: { x: 0, y: 0, z: 0 },

        _wm: new ig.EffectConfig({
            particleType: "FaceParticle",
            attributes: {
                offset: { _type: "Offset", _info: "Offset to effect center", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData = ig.EffectConfig.loadParticleData(sheet.faceAnimSheet, cfg, sheet && sheet.cacheKey);
            if (cfg.offset) this.offset = cfg.offset;
        },

        start: function (effectEntity) {
            // face particles occupy the full collision box of the target
            var offset = Vec3.assign(_v3a, this.offset);
            if (effectEntity.target) {
                offset.x -= effectEntity.target.coll.size.x / 2;
                offset.y -= effectEntity.target.coll.size.y / 2;
            }
            effectEntity.spawnParticle(ig.ENTITY.FaceParticle, offset, {
                data: this.particleData,
                size: effectEntity.target && effectEntity.target.coll.size
            });
        },

        getDuration: function () {
            return ig.EffectConfig.getParticleBlockTime(this.particleData);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_ANIM_RANGE
    // =========================================================================
    /**
     * Spawns `numParticles` Particles (or OffsetParticles if moveZDist is set)
     * scattered randomly within a circle of the given `radius` over `duration` seconds.
     *
     * Step config fields:
     *   radius         {number}   circle radius in pixels
     *   numParticles   {number}   total particles to spawn
     *   duration       {number}   time over which to spread spawning
     *   offset         {Offset}   centre offset (optional)
     *   alongY         {boolean}  scatter along Y instead of Z
     *   moveZDist      {number}   Z movement distance (spawns OffsetParticle if set)
     *   keySpline      {KEY_SPLINES key}  easing for Z movement (optional)
     *   useTargetAngle {boolean}  inherit target's animState.angle
     */
    ig.EFFECT_ENTRY.PLAY_ANIM_RANGE = ig.EffectStepBase.extend({
        particleData:   null,
        offset:         { x: 0, y: 0, z: 0 },
        radius:         0,
        duration:       0,
        numParticles:   2,
        useTargetAngle: false,
        alongY:         false,
        moveZDist:      0,
        keySpline:      null,

        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                radius:         { _type: "Number",  _info: "Radius in which animation is played" },
                useTargetAngle: { _type: "Boolean", _info: "Align animation with effect rotation" },
                numParticles:   { _type: "Number",  _info: "Amount of particles", _default: 1 },
                duration:       { _type: "Number",  _info: "Duration in which to spawn particles" },
                offset:         { _type: "Offset",  _info: "Offset to effect center", _optional: true },
                alongY:         { _type: "Boolean", _info: "If true: distribute animation along Y coordinate instead of Z" },
                moveZDist:      { _type: "Number",  _info: "Distance that entities should move upward (or downward if negative)", _optional: true },
                keySpline:      { _type: "String",  _info: "Keyspline of particle z movement", _select: KEY_SPLINES, _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData   = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            if (cfg.offset) this.offset = cfg.offset;
            this.radius         = cfg.radius         || 0;
            this.duration       = cfg.duration       || 0;
            this.numParticles   = cfg.numParticles   || 1;
            this.useTargetAngle = cfg.useTargetAngle || false;
            this.alongY         = cfg.alongY         || false;
            this.moveZDist      = cfg.moveZDist      || 0;
            this.keySpline      = KEY_SPLINES[cfg.keySpline] || null;
        },

        getDuration: function () { return this.duration; },

        start: function () {
            return { duration: this.duration, particles: this.numParticles };
        },

        /**
         * Called by ig.EffectParticleRunner.update each tick.
         * @param {ig.ENTITY.Effect} effectEntity
         * @param {number} from   first particle index to spawn this tick
         * @param {number} to     last particle index (exclusive) to spawn this tick
         */
        update: function (effectEntity, from, to) {
            var angle = effectEntity.angle;
            if (this.useTargetAngle && effectEntity.target && effectEntity.target.animState) {
                angle += effectEntity.target.animState.angle;
            }

            var particleSettings = { data: this.particleData, angle: angle };
            if (this.moveZDist) {
                particleSettings.moveOffset = Vec2.createC(0, this.moveZDist);
                particleSettings.alongZ     = true;
                particleSettings.keySpline  = this.keySpline;
            }

            for (var i = from; i < to; ++i) {
                // copy offset and add random polar scatter within radius
                var spawnOffset = ig.copy(this.offset);
                var scatter     = this.radius * Math.sqrt(Math.random());
                var dir         = Vec2.assignC(_v2a, Math.random() - 0.5, Math.random() - 0.5);
                Vec2.length(dir, scatter);
                spawnOffset.x  = (spawnOffset.x || 0) + dir.x;
                if (this.alongY) spawnOffset.y = (spawnOffset.y || 0) + dir.y;
                else             spawnOffset.z = (spawnOffset.z || 0) + dir.y;

                var ParticleClass = this.moveZDist ? ig.ENTITY.OffsetParticle : ig.ENTITY.Particle;
                effectEntity.spawnParticle(ParticleClass, spawnOffset, particleSettings);
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_ANIMS_OVER_ENTITY
    // =========================================================================
    /**
     * Covers the target entity's bounding box with `numParticles` particles
     * spawned uniformly (or circularly) across it over `duration` seconds.
     *
     * Step config fields:
     *   numParticles   {number}   base particle count (scaled by area / 32x32)
     *   duration       {number}   time over which to spread spawning
     *   circular       {boolean}  restrict spawn positions to a circle
     *   xScale         {number}   fraction of entity width to cover (default 1)
     *   yScale         {number}   fraction of entity height to cover (default 1)
     *   moveZDist      {number}   upward Z movement distance (spawns OffsetParticle)
     *   keySpline      {KEY_SPLINES key}  easing for Z movement
     *   offset         {Offset}   additional offset
     */
    ig.EFFECT_ENTRY.PLAY_ANIMS_OVER_ENTITY = ig.EffectStepBase.extend({
        particleData: null,
        duration:     0,
        xScale:       1,
        yScale:       1,
        circular:     false,
        offset:       { x: 0, y: 0, z: 0 },
        numParticles: 0,
        moveZDist:    0,
        keySpline:    null,

        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                numParticles: { _type: "Integer", _info: "Amount of particles to spawn", _default: 1 },
                duration:     { _type: "Number",  _info: "Duration in which to spawn particles" },
                circular:     { _type: "Boolean", _info: "True if particles should be spawned circular (instead of rectangular)." },
                xScale:       { _type: "Number",  _info: "How much of the x dimension should be covered. 1=full", _optional: true },
                yScale:       { _type: "Number",  _info: "How much of the y dimension should be covered. 1=full", _optional: true },
                moveZDist:    { _type: "Number",  _info: "Distance that entities should move upward (or downward if negative)", _optional: true },
                keySpline:    { _type: "String",  _info: "Keyspline of particle z movement", _select: KEY_SPLINES, _optional: true },
                offset:       { _type: "Offset",  _info: "Offset to effect center", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            this.duration     = cfg.duration     || 0;
            this.xScale       = cfg.xScale       || 1;
            this.yScale       = cfg.yScale       || 1;
            this.circular     = cfg.circular     || false;
            this.moveZDist    = cfg.moveZDist    || 0;
            this.keySpline    = KEY_SPLINES[cfg.keySpline] || null;
            if (cfg.offset) Vec3.assign(this.offset, cfg.offset);
            this.numParticles = cfg.numParticles || 2;
        },

        start: function (effectEntity) {
            if (!effectEntity.target) return;
            ig.EntityTools.getSpriteBounds(_spriteBounds, effectEntity.target);
            var width  = _spriteBounds.left + _spriteBounds.right;
            var height = _spriteBounds.top  + _spriteBounds.bottom;
            if (width < 0 || height < 0) return;

            return {
                duration:    this.duration,
                particles:   this.numParticles * width / 32 * height / 32 * this.xScale * this.yScale * this.duration,
                offX:        (-_spriteBounds.left + _spriteBounds.right) / 2,
                offY:        _spriteBounds.bottom,
                offZ:        height / 2,
                radius:      width / 2,
                aspectRatio: height / width
            };
        },

        getDuration: function () {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        update: function (effectEntity, from, to, runnerData) {
            _particleSettings.data = this.particleData;
            if (this.moveZDist) {
                _particleSettings.moveOffset = Vec2.createC(0, this.moveZDist);
                _particleSettings.alongZ     = true;
                _particleSettings.keySpline  = this.keySpline;
            }

            for (var i = from; i < to; ++i) {
                var spawnPos = Vec3.assignC(_v3a, 0, 0, 0);
                var scatter  = Vec2.assignC(_v2a, Math.random() - 0.5, Math.random() - 0.5);

                if (this.circular) {
                    var r = runnerData.radius * Math.sqrt(Math.random());
                    Vec2.length(scatter, r);
                } else {
                    scatter.x *= runnerData.radius * 2;
                    scatter.y *= runnerData.radius * 2;
                }

                spawnPos.x = runnerData.offX + scatter.x * this.xScale       + this.offset.x;
                spawnPos.y = runnerData.offY                                   + this.offset.y;
                spawnPos.z = runnerData.offZ + scatter.y * this.yScale * runnerData.aspectRatio + this.offset.z;

                var ParticleClass = this.moveZDist ? ig.ENTITY.OffsetParticle : ig.ENTITY.Particle;
                effectEntity.spawnParticle(ParticleClass, spawnPos, _particleSettings, true);
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.DEBRIS_OVER_ENTITY
    // =========================================================================
    /**
     * Scatters physics-based DebrisParticles across the target entity's
     * bounding box in a grid pattern.
     *
     * Step config fields:
     *   numParticles    {number}   particles per 16×16 tile
     *   circular        {boolean}  restrict to a circular region
     *   xScale          {number}   fraction of entity width
     *   yScale          {number}   fraction of entity height
     *   minSpeed        {number}   minimum XY launch speed
     *   maxSpeed        {number}   maximum XY launch speed
     *   minZSpeed       {number}   minimum upward Z launch speed
     *   maxZSpeed       {number}   maximum upward Z launch speed
     *   debrisSize      {Offset}   collision box size for each debris piece
     *   zGravityFactor  {number}   gravity multiplier
     *   zBounciness     {number}   Z bounce coefficient
     *   minZVel         {number}   minimum Z velocity on each bounce
     *   offset          {Offset}   positional offset
     */
    ig.EFFECT_ENTRY.DEBRIS_OVER_ENTITY = ig.EffectStepBase.extend({
        particleData: null,
        xScale:       1,
        yScale:       1,
        circular:     false,
        offset:       { x: 0, y: 0, z: 0 },
        numParticles: 0,
        minSpeed:     0,
        maxSpeed:     0,
        minZSpeed:    0,
        maxZSpeed:    0,
        zGravityFactor: null,
        zBounciness:  undefined,
        debrisSize:   undefined,

        _wm: new ig.EffectConfig({
            particleType: "DebrisParticle",  // note: extracted src has a typo "DeprisParticle" here
            attributes: {
                numParticles:   { _type: "Integer", _info: "Amount of particles per tile", _default: 1 },
                circular:       { _type: "Boolean", _info: "True if particles should be spawned circular (instead of rectangular)." },
                xScale:         { _type: "Number",  _info: "How much of the x dimension should be covered. 1=full", _optional: true },
                yScale:         { _type: "Number",  _info: "How much of the y dimension should be covered. 1=full", _optional: true },
                minSpeed:       { _type: "Number",  _info: "Minimum amount of speed", _optional: true },
                maxSpeed:       { _type: "Number",  _info: "Maximum amount of speed", _optional: true },
                minZSpeed:      { _type: "Number",  _info: "Minimum amount of z speed" },
                maxZSpeed:      { _type: "Number",  _info: "Maximum amount of z speed" },
                debrisSize:     { _type: "Offset",  _info: "Collision size of debris", _optional: true },
                zGravityFactor: { _type: "Number",  _info: "Gravity factor of debris", _optional: true },
                zBounciness:    { _type: "Number",  _info: "Z bounciness of debris", _optional: true },
                minZVel:        { _type: "Number",  _info: "minimum zVel when bouncing on Ground", _optional: true },
                offset:         { _type: "Offset",  _info: "Offset to effect center", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData   = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            this.xScale         = cfg.xScale         || 1;
            this.yScale         = cfg.yScale         || 1;
            this.circular       = cfg.circular       || false;
            if (cfg.offset) Vec3.assign(this.offset, cfg.offset);
            this.minSpeed       = cfg.minSpeed       || 0;
            this.maxSpeed       = cfg.maxSpeed       || 0;
            this.minZSpeed      = cfg.minZSpeed      || 0;
            this.maxZSpeed      = cfg.maxZSpeed      || 0;
            this.zGravityFactor = cfg.zGravityFactor || null;
            if (cfg.zBounciness !== undefined) this.zBounciness = cfg.zBounciness;
            this.debrisSize     = cfg.debrisSize     || undefined;
            this.numParticles   = cfg.numParticles   || 2;
        },

        start: function (effectEntity) {
            if (!effectEntity.target) return;

            ig.EntityTools.getSpriteBounds(_spriteBounds, effectEntity.target);
            var totalW = _spriteBounds.left + _spriteBounds.right;
            var totalH = _spriteBounds.top  + _spriteBounds.bottom;
            var covW   = Math.round(totalW * this.xScale);
            var covH   = Math.round(totalH * this.yScale);
            var offX   = -_spriteBounds.left + (totalW - covW) / 2;
            var offY   = -_spriteBounds.top  + (totalH - covH) / 2;
            var nX     = Math.round(this.numParticles * covW / 16);
            var nY     = Math.round(this.numParticles * covH / 16);

            // shared debris settings (mutated per spawn below)
            var debrisSettings = {
                data:           this.particleData,
                zGravityFactor: this.zGravityFactor,
                zBounciness:    this.zBounciness,
                debrisSize:     this.debrisSize
            };

            for (var row = 0; row < nX; ++row) {
                for (var col = 0; col < nY; ++col) {
                    // grid position
                    var gridX = covW * row / (nX - 1);
                    var gridY = covH * col / (nY - 1);

                    // direction vector for XY launch (from centre)
                    var launchDir  = Vec2.assignC(_v2a, gridX - covW / 2, gridY - covH / 2);
                    var spawnWorld = Vec2.assignC(_v2b, offX + gridX, offY + gridY);

                    if (this.circular) {
                        // reject outside circle (compensate for aspect ratio)
                        launchDir.x *= covH / covW;
                        if (Vec2.length(launchDir) > covH / 2) continue;
                        launchDir.x *= covW / covH;
                    }

                    var spawnPos = Vec3.assignC(_v3a, 0, 0, 0);
                    spawnPos.x = this.offset.x + spawnWorld.x;
                    spawnPos.y = this.offset.y + spawnWorld.y;
                    spawnPos.z = this.offset.z + spawnWorld.z;

                    var t = Math.random();
                    debrisSettings.zVel = this.minZSpeed * t + this.maxZSpeed * (1 - t);
                    debrisSettings.vel  = Vec2.length(
                        launchDir,
                        this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed)
                    );

                    effectEntity.spawnParticle(ig.ENTITY.DebrisParticle, spawnPos, debrisSettings, true);
                }
            }
        },

        getDuration: function () {
            return ig.EffectConfig.getParticleBlockTime(this.particleData);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_SOUND
    // =========================================================================
    /**
     * Plays a sound when this step fires.  Supports spatialised, looping, or
     * one-shot playback.  Looping sounds are attached to the effect entity so
     * they stop automatically when the entity is killed.
     *
     * Step config fields:
     *   sound         {SoundT}    URL / sound config
     *   group         {string}    interrupt group tag (optional)
     *   volume        {number}    0–1 (default 1)
     *   global        {boolean}   play at full volume everywhere (default false)
     *   loop          {boolean}   loop until the effect ends (default false)
     *   variance      {number}    random pitch variance (optional)
     *   speed         {number}    playback speed multiplier (default 1)
     *   fadeDuration  {number}    fade-out time when canceled (optional)
     *   radius        {number}    spatialised attenuation radius (optional)
     *   attachHandle  {boolean}   track even non-looping handle for manual stop
     */
    ig.EFFECT_ENTRY.PLAY_SOUND = ig.EffectStepBase.extend({
        sound:        null,
        global:       false,
        loop:         false,
        radius:       0,
        attachHandle: false,
        settings:     null,

        _wm: new ig.Config({
            attributes: {
                sound:        { _type: "SoundT",  _info: "URL of sound." },
                group:        { _type: "String",  _info: "Group of sounds. Sounds of same group will interrupt each other", _optional: true },
                volume:       { _type: "Number",  _info: "Volume of sound", _default: 1 },
                global:       { _type: "Boolean", _info: "Play sound globally if true" },
                loop:         { _type: "Boolean", _info: "Loop sound if true" },
                variance:     { _type: "Number",  _info: "Speed playback variance.", _optional: true },
                speed:        { _type: "Number",  _info: "Playback speed. 1=default speed. 0.5=half speed.", _optional: true },
                fadeDuration: { _type: "Number",  _info: "Fade duration of sound when canceled. Increase in case of sound artifacts", _optional: true },
                radius:       { _type: "Number",  _info: "Radius up to which you can hear the sound", _optional: true },
                attachHandle: { _type: "Boolean", _info: "Attach the sound handle so even non-looped sounds can be stopped.", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            if (cfg.sound) {
                this.sound = new ig.Sound(cfg.sound, cfg.volume || 1, cfg.variance || 0, cfg.group);
            }
            this.global       = cfg.global       || false;
            this.loop         = cfg.loop         || false;
            this.radius       = cfg.radius       || 0;
            this.attachHandle = cfg.attachHandle || false;
            this.settings     = {
                speed:        cfg.speed        || 1,
                fadeDuration: cfg.fadeDuration || 0
            };
        },

        clearCached: function () {
            if (this.sound) this.sound.clearCached();
        },

        start: function (effectEntity) {
            if (!this.sound) return;
            var handle = this.global
                ? this.sound.play(this.loop, this.settings)
                : ig.SoundHelper.playAtEntity(this.sound, effectEntity, this.loop, this.settings, this.radius);

            // loop handles must be attached so they get killed with the effect
            if (this.loop || this.attachHandle) {
                effectEntity.addEntityAttached(handle);
            }
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PLAY_RANDOM_SOUND
    // =========================================================================
    /**
     * Randomly picks one sound from a list and plays it.
     *
     * Step config fields:
     *   sounds        {SoundConfig[]}  array of {sound, volume, variance}
     *   global        {boolean}
     *   loop          {boolean}
     *   speed         {number}
     *   fadeDuration  {number}
     *   radius        {number}
     */
    ig.EFFECT_ENTRY.PLAY_RANDOM_SOUND = ig.EffectStepBase.extend({
        sounds:   [],
        global:   false,
        loop:     false,
        radius:   0,
        settings: null,

        _wm: new ig.Config({
            attributes: {
                sounds:       { _type: "Array",   _info: "Sound to be played random", _sub: { _type: "SoundConfig" } },
                global:       { _type: "Boolean", _info: "Play sound globally if true" },
                loop:         { _type: "Boolean", _info: "Loop sound if true" },
                speed:        { _type: "Number",  _info: "Playback speed. 1=default speed. 0.5=half speed.", _optional: true },
                fadeDuration: { _type: "Number",  _info: "Fade duration of sound when canceled. Increase in case of sound artifacts", _optional: true },
                radius:       { _type: "Number",  _info: "Radius up to which you can hear the sound", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.sounds = [];
            for (var i = 0; i < cfg.sounds.length; ++i) {
                var s = cfg.sounds[i];
                this.sounds.push(new ig.Sound(s.sound, s.volume || 1, s.variance || 0));
            }
            this.global   = cfg.global   || false;
            this.loop     = cfg.loop     || false;
            this.radius   = cfg.radius   || 0;
            this.settings = {
                speed:        cfg.speed        || 1,
                fadeDuration: cfg.fadeDuration || 0
            };
        },

        clearCached: function () {
            for (var i = this.sounds.length; i--;) this.sounds[i].clearCached();
        },

        start: function (effectEntity) {
            var sound  = this.sounds.random();
            var handle = this.global
                ? sound.play(this.loop, this.settings)
                : ig.SoundHelper.playAtEntity(sound, effectEntity, this.loop, this.settings, this.radius);

            if (this.loop) effectEntity.addEntityAttached(handle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.STOP_SOUNDS
    // =========================================================================
    /**
     * Stops all ig.SoundHandle instances currently attached to the effect entity.
     * (Covers both looping sounds attached by PLAY_SOUND / PLAY_RANDOM_SOUND.)
     */
    ig.EFFECT_ENTRY.STOP_SOUNDS = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),

        init: function () {},

        start: function (effectEntity) {
            effectEntity.clearEntityAttached(function (attached) {
                return attached instanceof ig.SoundHandle;
            });
        }
    });

});
