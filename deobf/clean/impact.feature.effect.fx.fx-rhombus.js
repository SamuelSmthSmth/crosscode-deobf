/**
 * impact.feature.effect.fx.fx-rhombus
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-rhombus")`.
 *
 * Defines:
 *   ig.EFFECT_ENTRY.PARTICLE_RHOMBUS — spawns RhombusParticles that trace the
 *                                      perimeter of a diamond/rhombus shape around the target.
 *
 * RhombusParticle takes a `startFactor` (0–1 position along the rhombus perimeter)
 * and a `moveFactor` (fraction of full perimeter to travel), allowing particles to
 * slide around the shape's outline.
 */

ig.module("impact.feature.effect.fx.fx-rhombus")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- module-scoped scratch ------------------------------------------------
    var _spawnPos  = Vec3.create(); // per-particle spawn offset
    var _pSettings = {};            // reused particle-settings object

    // =========================================================================
    // ig.EFFECT_ENTRY.PARTICLE_RHOMBUS
    // =========================================================================
    /**
     * Covers the perimeter of a rhombus (diamond) centred on the target entity
     * with OffsetParticle-like RhombusParticles.
     *
     * The rhombus has a radius equal to `target.coll.size.x / 2 * scale - radiusSub`.
     * Particles are placed at random positions along the perimeter and move along it
     * by `moveDistance` pixels.
     *
     * Step config fields (in addition to particle-state fields):
     *   numParticles   {number}   particles per 32px of perimeter per second
     *   duration       {number}   time over which to spread spawning
     *   scale          {number}   fraction of entity half-width used as rhombus radius
     *   radiusSub      {number}   pixels subtracted from the computed radius
     *   moveDistance   {number}   pixels each particle travels along the perimeter
     *   moveVariance   {number}   ± pixel variance added to moveDistance
     *   randomDirFlip  {boolean}  randomly negate moveFactor so particles go either way
     *   zRange         {number}   random Z offset added at spawn
     *   keySpline      {KEY_SPLINES key}  movement easing
     *   alongZ         {boolean}  move particles along Z instead of Y (source note: reads `Boolean` key)
     *   offset         {Offset}   positional offset (optional)
     */
    ig.EFFECT_ENTRY.PARTICLE_RHOMBUS = ig.EffectStepBase.extend({
        particleData:  null,
        duration:      0,
        numParticles:  0,
        scale:         0,
        radiusSub:     0,
        offset:        { x: 0, y: 0, z: 0 },
        moveDistance:  0,
        moveVariance:  0,
        randomDirFlip: false,
        keySpline:     null,
        alongZ:        false,
        zRange:        0,

        _wm: new ig.EffectConfig({
            particleType: "RhombusParticle",
            attributes: {
                numParticles:  { _type: "Number",  _info: "Amount of particles to spawn per 32 pixel line length and second", _default: 1 },
                duration:      { _type: "Number",  _info: "Duration in which to spawn particles" },
                scale:         { _type: "Number",  _info: "How much of the entity bounds should be covered. 0.5=half, 1.0=all", _optional: true },
                radiusSub:     { _type: "Number",  _info: "Number of pixels subtracted from radius", _optional: true },
                moveDistance:  { _type: "Number",  _info: "Move distance of particles in pixels" },
                moveVariance:  { _type: "Number",  _info: "Move variance in pixels. Added +/- to distance", _optional: true },
                randomDirFlip: { _type: "Boolean", _info: "If true, randomly flip direction of particle", _optional: true },
                zRange:        { _type: "Number",  _info: "zRange randomly added to zPos when spawning", _optional: true },
                keySpline:     { _type: "String",  _info: "Keyspline of particle movement", _select: KEY_SPLINES },
                alongZ:        { _type: "Boolean", _info: "If true, move particles along z instead of y", _optional: true },
                offset:        { _type: "Offset",  _info: "Offset to effect center", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData  = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            this.duration      = cfg.duration      || 0;
            this.scale         = cfg.scale         || 0;
            this.radiusSub     = cfg.radiusSub     || 0;
            if (cfg.offset) Vec3.assign(this.offset, cfg.offset);
            this.numParticles  = cfg.numParticles  || 2;
            this.moveDistance  = cfg.moveDistance  || 1;
            this.moveVariance  = cfg.moveVariance  || 0;
            this.keySpline     = KEY_SPLINES[cfg.keySpline] || null;
            // NOTE: the original source erroneously reads cfg.Boolean instead of cfg.alongZ
            // Preserved verbatim to match runtime behaviour.
            this.alongZ        = cfg.Boolean       || false;
            this.randomDirFlip = cfg.randomDirFlip || false;
            this.zRange        = cfg.zRange        || 0;
        },

        getDuration: function () {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        /**
         * Returns the runner-data object for the particle runner.
         * The total particle count is proportional to the perimeter length and duration.
         */
        start: function (effectEntity) {
            if (!effectEntity.target) return;
            var halfWidth = effectEntity.target.coll.size.x;
            if (halfWidth < 0) return;

            var radius    = halfWidth / 2 * this.scale - this.radiusSub;
            // rhombus perimeter = 4 × side, side = sqrt(r² + r²) = r√2, total = 4r√2
            var perimeter = 4 * Math.sqrt(radius * radius + radius * radius);

            return {
                duration:        this.duration,
                particles:       Math.round(this.numParticles * perimeter / 32 * this.duration),
                radius:          radius,
                rhombusLength:   perimeter
            };
        },

        update: function (effectEntity, from, to, runnerData) {
            _pSettings.data      = this.particleData;
            _pSettings.radius    = runnerData.radius;
            _pSettings.alongZ    = this.alongZ;
            _pSettings.keySpline = this.keySpline;

            for (var i = from; i < to; ++i) {
                var spawnOffset = Vec3.assign(_spawnPos, this.offset);
                // random Z jitter
                spawnOffset.z += Math.floor(this.zRange * Math.random());

                // random start position on the perimeter (0–1)
                _pSettings.startFactor = Math.random();

                // random distance to travel along perimeter (with optional direction flip)
                var moveFactor = (this.moveDistance + (2 * Math.random() - 1) * this.moveVariance)
                    / runnerData.rhombusLength;
                if (this.randomDirFlip && Math.random() >= 0.5) moveFactor = -moveFactor;
                _pSettings.moveFactor = moveFactor;

                effectEntity.spawnParticle(ig.ENTITY.RhombusParticle, spawnOffset, _pSettings);
            }
        }
    });

});
