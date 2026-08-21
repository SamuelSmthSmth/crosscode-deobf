/**
 * impact.feature.effect.fx.fx-circle
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-circle")`.
 *
 * Defines three effect steps that spawn particles in a circular / arc pattern:
 *
 *   ig.EFFECT_ENTRY.OFFSET_PARTICLE_CIRCLE — OffsetParticles launched from arc positions
 *   ig.EFFECT_ENTRY.PARTICLE_CIRCLE        — plain Particles launched from arc positions
 *   ig.EFFECT_ENTRY.DEBRIS_CIRCLE          — DebrisParticles (physics) from arc positions
 *
 * All three share a common abstract base class (module-private) that handles
 * angle calculation and particle distribution around the arc.
 */

ig.module("impact.feature.effect.fx.fx-circle")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- module-scoped scratch vectors ----------------------------------------
    var _unitVec    = Vec2.create(); // unit direction along the arc (starts pointing up)
    var _rotScratch = Vec2.create(); // scratch for Vec2.rotate
    var _spawnPos   = Vec3.create(); // spawn offset for each particle
    var _pSettings  = {};            // reused particle-settings object

    // =========================================================================
    // CircleBase  (module-private abstract base)
    // =========================================================================
    /**
     * Abstract base that computes per-particle angles and positions along an arc,
     * then delegates to `this.spawn(effectEntity, offset, settings, direction)` for
     * the concrete particle type.
     *
     * Common config fields used by all circle steps:
     *   numParticles        {number}   total particles to spawn
     *   duration            {number}   over how many seconds to spread spawning (0 = instant)
     *   centralAngle        {number}   arc fraction in full turns (1 = full circle, default 1)
     *   startAngle          {number}   start of arc in full turns from "up" (default = -centralAngle/2)
     *   startDist           {number}   starting radius offset in pixels
     *   clockwise           {boolean}  true = clockwise, false = CCW (default false)
     *   random              {boolean}  fully random angle if true
     *   uniformRandom       {number}   slight jitter within grid positions (0–1)
     *   particleRotate      {boolean}  rotate sprite with movement direction
     *   flipRightParticles  {boolean}  flip particles on the right half of the arc
     *   collision           {boolean}  enable particle collision
     *   alongZ              {boolean}  move particles along Z instead of Y
     *   useTargetAngle      {boolean}  add target's animState.angle to particle angle
     *   offset              {Offset}   offset to effect centre (optional)
     *   rotOffset           {Offset}   offset rotated with effect angle (optional)
     *   circleSpline        {KEY_SPLINES key}  easing for timed spawning
     */
    var CircleBase = ig.EffectStepBase.extend({
        particleData:       null,
        offset:             { x: 0, y: 0, z: 0 },
        duration:           0,
        clockwise:          false,
        rotOffset:          null,
        numParticles:       16,
        centralAngle:       0,
        startAngle:         0,
        random:             false,
        uniformRandom:      0,
        startDist:          0,
        particleRotate:     false,
        flipRightParticles: false,
        collision:          false,
        alongZ:             false,
        useTargetAngle:     false,
        circleSpline:       null,

        init: function (sheet, cfg) {
            this.particleData       = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            if (cfg.offset) this.offset = cfg.offset;
            this.rotOffset          = cfg.rotOffset      || null;
            this.numParticles       = cfg.numParticles;
            this.random             = cfg.random         || false;
            this.uniformRandom      = cfg.uniformRandom  || 0;
            this.centralAngle       = (cfg.centralAngle  || 0) * Math.PI * 2 || Math.PI * 2; // 0 → full circle
            this.startAngle         = cfg.startAngle !== undefined
                ? cfg.startAngle * Math.PI * 2
                : -this.centralAngle / 2;
            this.startDist          = cfg.startDist      || 0;
            this.particleRotate     = cfg.particleRotate || false;
            this.flipRightParticles = cfg.flipRightParticles || false;
            this.collision          = cfg.collision      || false;
            this.alongZ             = cfg.alongZ         || false;
            this.duration           = cfg.duration       || 0;
            this.clockwise          = cfg.clockwise      || false;
            this.useTargetAngle     = cfg.useTargetAngle || false;
            this.circleSpline       = KEY_SPLINES[cfg.circleSpline] || null;
        },

        getDuration: function () {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        start: function (effectEntity) {
            if (this.duration) {
                return {
                    duration:  this.duration,
                    particles: this.numParticles,
                    keySpline: this.circleSpline
                };
            }
            this._spawnParticles(effectEntity, 0, this.numParticles);
        },

        update: function (effectEntity, from, to) {
            this._spawnParticles(effectEntity, from, to);
        },

        /**
         * Spawn particles indexed [from, to) around the arc.
         * @param {ig.ENTITY.Effect} effectEntity
         * @param {number} from  first particle index
         * @param {number} to    last particle index (exclusive)
         * @private
         */
        _spawnParticles: function (effectEntity, from, to) {
            // base direction = pointing up (−Y in screen space)
            Vec2.assignC(_unitVec, 0, -1);

            // denominator for evenly spacing particles (full-circle → use N, arc → use N-1)
            var denom = (this.centralAngle === Math.PI * 2) ? this.numParticles : (this.numParticles - 1);

            _pSettings.data      = this.particleData;
            _pSettings.friction  = 0.8;
            _pSettings.collision = this.collision;
            _pSettings.alongZ    = this.alongZ;

            for (var i = from; i < to; i++) {
                // factor: 0–1 position along arc
                var factor = denom ? i / denom : 0.5;
                if (denom && this.uniformRandom) {
                    factor += (1 / denom) * (Math.random() - 0.5) * this.uniformRandom;
                } else if (this.random) {
                    factor = Math.random();
                }

                // compute absolute angle
                var angle = this.startAngle + factor * this.centralAngle;
                if (!this.clockwise)             angle = -angle;
                if (effectEntity.flipX)          angle = -angle;
                angle += effectEntity.angle;
                if (this.useTargetAngle && effectEntity.target && effectEntity.target.animState) {
                    angle += effectEntity.target.animState.angle;
                }

                // base spawn offset (static + rotated part)
                var offset = Vec3.assignC(_spawnPos, 0, 0, 0);
                if (this.rotOffset) {
                    Vec3.add(offset, this.rotOffset);
                    Vec2.rotate(offset, -effectEntity.angle);
                }
                if (this.offset) Vec3.add(offset, this.offset);

                // direction unit vector at this angle
                var dir = Vec2.rotate(_unitVec, -angle, _rotScratch);

                // flipX for particles on the "right" side of the arc
                var doFlip = this.flipRightParticles && dir.x < 0;
                if (effectEntity.flipX) doFlip = !doFlip;

                _pSettings.angle = this.particleRotate ? angle : 0;
                _pSettings.flipX = doFlip;

                // negate Y in screen-space if moving along Z
                if (this.alongZ) dir.y = -dir.y;

                this.spawn(effectEntity, offset, _pSettings, dir);
            }
        },

        /** Override in subclass to actually spawn the right particle type. */
        spawn: function () {}
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.OFFSET_PARTICLE_CIRCLE
    // =========================================================================
    /**
     * Spawns OffsetParticles that move in a programmed path outward from (or
     * toward, if inverse=true) the circle.
     *
     * Additional step config fields:
     *   moveDist        {number}   total radial move distance in pixels
     *   moveVariance    {number}   ± variance added to moveDist
     *   moveDuration    {number}   override particle move duration
     *   keySpline       {KEY_SPLINES key}  movement easing
     *   moveRotate      {number}   full turns of rotation while moving (0=none)
     *   rotateWithTime  {boolean}  rotate proportional to time not distance
     *   inverse         {boolean}  move toward centre instead of away
     *   normalMoveDist  {number}   movement in perpendicular direction
     */
    ig.EFFECT_ENTRY.OFFSET_PARTICLE_CIRCLE = CircleBase.extend({
        moveDist:        0,
        moveVariance:    0,
        moveDuration:    0,
        keySpline:       null,
        moveRotate:      0,
        rotateWithTime:  false,
        inverse:         false,
        normalMoveDist:  0,

        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                numParticles:        { _type: "Integer", _info: "Number of particles to be spawned" },
                duration:            { _type: "Number",  _info: "Duration of particle spawning" },
                clockwise:           { _type: "Boolean", _info: "true if particles are to move clockwise", _optional: true },
                centralAngle:        { _type: "Number",  _info: "Circle range to spawn. 1=full circle", _default: 1 },
                startAngle:          { _type: "Number",  _info: "Turn angle from which to start relative to view direction. 0.25=quarter turn", _optional: true },
                startDist:           { _type: "Number",  _info: "Start distance away from center" },
                random:              { _type: "Boolean", _info: "If true, spawn particles randomly along circle", _optional: true },
                uniformRandom:       { _type: "Number",  _info: "Only vary slightly along circle. Set intensity between 0-1", _optional: true },
                particleRotate:      { _type: "Boolean", _info: "If true, rotate particle with movement orientation", _optional: true },
                flipRightParticles:  { _type: "Boolean", _info: "If true, flip particles on the right side", _optional: true },
                alongZ:              { _type: "Boolean", _info: "If true, move particles along z instead of y", _optional: true },
                offset:              { _type: "Offset",  _info: "Offset to effect center", _optional: true },
                rotOffset:           { _type: "Offset",  _info: "Offset rotated with effect direction", _optional: true },
                useTargetAngle:      { _type: "Boolean", _info: "Align spawning with rotation of target", _optional: true },
                circleSpline:        { _type: "String",  _info: "Keyspline used for circle spawning speed", _select: KEY_SPLINES, _optional: true },
                moveDist:            { _type: "Number",  _info: "Fixed move distance in pixels away from circle (or towards if inverse=true)" },
                moveVariance:        { _type: "Number",  _info: "Move distance variation in pixels", _optional: true },
                moveDuration:        { _type: "Number",  _info: "Duration of particle motion. If not defined, will use particleDuration", _optional: true },
                keySpline:           { _type: "String",  _info: "Keyspline of particle movement", _select: KEY_SPLINES },
                moveRotate:          { _type: "Number",  _info: "Particles should rotate while moving. 1=full circle rotation", _optional: true },
                rotateWithTime:      { _type: "Boolean", _info: "Set to true if particles should rotate with time rather than move distance", _optional: true },
                inverse:             { _type: "Boolean", _info: "Set to true if particles should move towards center instead of away.", _optional: true },
                normalMoveDist:      { _type: "Number",  _info: "Distance to be moved in orthogonal direction of circle", _optional: true },
                collision:           { _type: "Boolean", _info: "Set to true if particles should collide with environment" }
            }
        }),

        init: function (sheet, cfg) {
            this.parent(sheet, cfg);
            this.moveDist       = cfg.moveDist       || 0;
            this.moveVariance   = cfg.moveVariance   || 0;
            this.moveDuration   = cfg.moveDuration   || 0;
            this.keySpline      = KEY_SPLINES[cfg.keySpline] || null;
            this.moveRotate     = cfg.moveRotate     || 0;
            this.rotateWithTime = cfg.rotateWithTime || false;
            this.inverse        = cfg.inverse        || false;
            this.normalMoveDist = cfg.normalMoveDist || 0;
        },

        spawn: function (effectEntity, offset, settings, dir) {
            var totalDist = this.startDist + this.moveDist + (2 * Math.random() - 1) * this.moveVariance;
            Vec2.length(dir, totalDist);
            settings.startFactor    = this.startDist / totalDist;
            settings.moveOffset     = dir;
            settings.moveDuration   = this.moveDuration;
            settings.keySpline      = this.keySpline;
            settings.moveRotate     = effectEntity.flipX ? -this.moveRotate : this.moveRotate;
            settings.rotateWithTime = this.rotateWithTime;
            settings.rotateGfx      = this.particleRotate;
            settings.inverse        = this.inverse;
            settings.normalMoveDist = this.normalMoveDist;

            effectEntity.spawnParticle(ig.ENTITY.OffsetParticle, offset, settings);

            // clean up per-spawn fields (settings object is shared)
            delete settings.normalMoveDist;
            delete settings.moveOffset;
            delete settings.moveDuration;
            delete settings.keySpline;
            delete settings.moveRotate;
            delete settings.rotateWithTime;
            delete settings.inverse;
        }
    });

    // -- VelocityCircleBase: extends CircleBase with speed-based spawning -----
    /**
     * Intermediate abstract base for PARTICLE_CIRCLE and DEBRIS_CIRCLE.
     * Applies startDist offset to spawn position, computes speed, then delegates
     * to `this.spawnVel(effectEntity, offset, settings)`.
     * @private
     */
    var VelocityCircleBase = CircleBase.extend({
        spawn: function (effectEntity, offset, settings, dir) {
            // offset spawn point outward by startDist
            offset.x += dir.x * this.startDist;
            if (this.alongZ) {
                offset.z += dir.z * this.startDist;
            } else {
                offset.y += dir.y * this.startDist;
            }

            // apply random speed along direction
            var speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
            settings.vel = Vec2.length(dir, speed);
            this.spawnVel(effectEntity, offset, settings);
            delete settings.vel;
        },

        spawnVel: function () {}
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.PARTICLE_CIRCLE
    // =========================================================================
    /**
     * Spawns plain Particles with an initial velocity directed away from the arc centre.
     *
     * Additional step config fields:
     *   minSpeed / maxSpeed {number}  speed range in pixels/sec
     */
    ig.EFFECT_ENTRY.PARTICLE_CIRCLE = VelocityCircleBase.extend({
        minSpeed: 50,
        maxSpeed: 100,

        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                numParticles:       { _type: "Integer", _info: "Number of particles to be spawned" },
                duration:           { _type: "Number",  _info: "Duration of particle spawning" },
                clockwise:          { _type: "Boolean", _info: "true if particles are to move clockwise", _optional: true },
                centralAngle:       { _type: "Number",  _info: "Circle range to spawn. 1=full circle", _default: 1 },
                startAngle:         { _type: "Number",  _info: "Turn angle from which to start. 0.25=quarter turn", _optional: true },
                startDist:          { _type: "Number",  _info: "Start distance away from center" },
                random:             { _type: "Boolean", _info: "If true, spawn particles randomly along circle", _optional: true },
                uniformRandom:      { _type: "Number",  _info: "Only vary slightly along circle. Set intensity between 0-1", _optional: true },
                particleRotate:     { _type: "Boolean", _info: "If true, rotate particle with movement orientation", _optional: true },
                flipRightParticles: { _type: "Boolean", _info: "If true, flip particles on the right side", _optional: true },
                alongZ:             { _type: "Boolean", _info: "If true, move particles along z instead of y", _optional: true },
                offset:             { _type: "Offset",  _info: "Offset to effect center", _optional: true },
                rotOffset:          { _type: "Offset",  _info: "Offset rotated with effect direction", _optional: true },
                useTargetAngle:     { _type: "Boolean", _info: "Align spawning with rotation of target", _optional: true },
                minSpeed:           { _type: "Number",  _info: "Minimum amount of speed", _optional: true },
                maxSpeed:           { _type: "Number",  _info: "Maximum amount of speed", _optional: true },
                collision:          { _type: "Boolean", _info: "Set to true if particles should collide with environment", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.parent(sheet, cfg);
            this.minSpeed = cfg.minSpeed || 0;
            this.maxSpeed = cfg.maxSpeed || 0;
        },

        spawnVel: function (effectEntity, offset, settings) {
            effectEntity.spawnParticle(ig.ENTITY.Particle, offset, settings);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.DEBRIS_CIRCLE
    // =========================================================================
    /**
     * Spawns physics-enabled DebrisParticles from arc positions.
     *
     * Additional step config fields (beyond PARTICLE_CIRCLE):
     *   minZSpeed / maxZSpeed {number}  upward Z launch speed range
     *   zGravityFactor        {number}  gravity multiplier
     *   zBounciness           {number}  Z bounce coefficient
     *   minZVel               {number}  minimum Z vel on each bounce
     *   shadowSize            {number}  shadow radius (default 4)
     */
    ig.EFFECT_ENTRY.DEBRIS_CIRCLE = VelocityCircleBase.extend({
        minSpeed:       50,
        maxSpeed:       100,
        minZSpeed:      50,
        maxZSpeed:      100,
        zGravityFactor: 0,
        zBounciness:    undefined,
        shadowSize:     4,

        _wm: new ig.EffectConfig({
            particleType: "DebrisParticle",
            attributes: {
                numParticles:       { _type: "Integer", _info: "Number of particles to be spawned" },
                duration:           { _type: "Number",  _info: "Duration of particle spawning" },
                clockwise:          { _type: "Boolean", _info: "true if particles are to move clockwise", _optional: true },
                centralAngle:       { _type: "Number",  _info: "Circle range to spawn. 1=full circle", _default: 1 },
                startAngle:         { _type: "Number",  _info: "Turn angle from which to start. 0.25=quarter turn", _optional: true },
                startDist:          { _type: "Number",  _info: "Start distance away from center" },
                random:             { _type: "Boolean", _info: "If true, spawn particles randomly along circle", _optional: true },
                uniformRandom:      { _type: "Number",  _info: "Only vary slightly along circle. Set intensity between 0-1", _optional: true },
                particleRotate:     { _type: "Boolean", _info: "If true, rotate particle with movement orientation", _optional: true },
                flipRightParticles: { _type: "Boolean", _info: "If true, flip particles on the right side", _optional: true },
                alongZ:             { _type: "Boolean", _info: "If true, move particles along z instead of y", _optional: true },
                offset:             { _type: "Offset",  _info: "Offset to effect center", _optional: true },
                rotOffset:          { _type: "Offset",  _info: "Offset rotated with effect direction", _optional: true },
                useTargetAngle:     { _type: "Boolean", _info: "Align spawning with rotation of target", _optional: true },
                shadowSize:         { _type: "Number",  _info: "Size of Shadow", _optional: true },
                minSpeed:           { _type: "Number",  _info: "Minimum amount of speed", _optional: true },
                maxSpeed:           { _type: "Number",  _info: "Maximum amount of speed", _optional: true },
                minZSpeed:          { _type: "Number",  _info: "Minimum amount of z speed", _optional: true },
                maxZSpeed:          { _type: "Number",  _info: "Maximum amount of z speed", _optional: true },
                zGravityFactor:     { _type: "Number",  _info: "Gravity factor of debris", _optional: true },
                zBounciness:        { _type: "Number",  _info: "Z bounciness of debris", _optional: true },
                minZVel:            { _type: "Number",  _info: "minimum zVel when bouncing on Ground", _optional: true },
                collision:          { _type: "Boolean", _info: "Set to true if particles should collide with environment" }
            }
        }),

        init: function (sheet, cfg) {
            this.parent(sheet, cfg);
            this.minSpeed       = cfg.minSpeed       || 0;
            this.maxSpeed       = cfg.maxSpeed       || 0;
            this.minZSpeed      = cfg.minZSpeed      || 0;
            this.maxZSpeed      = cfg.maxZSpeed      || 0;
            this.zGravityFactor = cfg.zGravityFactor || null;
            if (cfg.zBounciness !== undefined) this.zBounciness = cfg.zBounciness;
            this.shadowSize     = (cfg.shadowSize === undefined) ? 4 : cfg.shadowSize;
        },

        spawnVel: function (effectEntity, offset, settings) {
            var t = Math.random();
            settings.zVel           = this.minZSpeed * t + this.maxZSpeed * (1 - t);
            settings.zGravityFactor = this.zGravityFactor;
            settings.zBounciness    = this.zBounciness;
            settings.shadowSize     = this.shadowSize;

            effectEntity.spawnParticle(ig.ENTITY.DebrisParticle, offset, settings);

            delete settings.zVel;
            delete settings.zGravityFactor;
        }
    });

});
