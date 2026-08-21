/**
 * impact.feature.effect.fx.fx-homing
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-homing")`.
 *
 * Defines:
 *   sc.HOMING_ROTATE_TYPE              — enum for how HomingParticles orient themselves
 *   ig.EFFECT_ENTRY.SHOOT_HOMING_PARTICLE — spawns HomingParticles that fly between two targets
 */

ig.module("impact.feature.effect.fx.fx-homing")
    .requires(
        "impact.feature.effect.effect-sheet",
        "impact.feature.effect.entities.effect-particle"
    )
    .defines(function () {

    // -- scratch for arc-normal angle jitter ----------------------------------
    var _normalDir = Vec2.create();

    // =========================================================================
    // sc.HOMING_ROTATE_TYPE
    // =========================================================================
    /**
     * Controls how a HomingParticle's sprite is rotated in flight.
     * @enum {number}
     */
    sc.HOMING_ROTATE_TYPE = {
        NONE:      0, // sprite is not rotated
        MOVE_DIR:  1, // sprite points along the current frame-to-frame movement delta
        AT_TARGET: 2  // sprite always points toward the destination target
    };

    // =========================================================================
    // ig.EFFECT_ENTRY.SHOOT_HOMING_PARTICLE
    // =========================================================================
    /**
     * Spawns one or more HomingParticles that fly in a curve between the
     * effect's primary position and its secondary target.
     *
     * See ig.FX_HOMING_FLY_TYPE (effect-particle.js) for the available flight
     * curve families (FLY_ARC, EXPAND_DASH, etc.).
     *
     * Step config fields (in addition to particle-state fields):
     *   duration         {number}   time over which to spread particle spawning (0 = instant)
     *   numParticles     {number}   how many homing particles to spawn
     *   flyType          {string}   key of ig.FX_HOMING_FLY_TYPE
     *   inverse          {boolean}  if true: fly source→target instead of target→source
     *   offsetRadius     {NumberVary} arc bulge radius in pixels (± half of this is chosen at random)
     *   offRadiusZScale  {number}   scale factor applied to the radius in the Z direction (default 1)
     *   offsetAngle      {NumberVary} random rotation applied to the arc normal (full turns: 1 = 180°)
     *   target1Vary      {number}   radial scatter radius around source position
     *   target2Vary      {number}   radial scatter radius around destination position
     *   phaseDurations   {number[]} fraction of total flight time for each flyType phase (must sum ≤ 1)
     *   rotateMoveDir    {string}   key of sc.HOMING_ROTATE_TYPE (default NONE)
     *
     * @extends ig.EffectStepBase
     */
    ig.EFFECT_ENTRY.SHOOT_HOMING_PARTICLE = ig.EffectStepBase.extend({
        particleData:    null,
        duration:        0,
        numParticles:    1,
        flyType:         null,
        inverse:         false,
        offsetRadius:    0,
        offRadiusZScale: 1,
        offsetAngle:     0,
        phaseDurations:  null,
        rotateMoveDir:   sc.HOMING_ROTATE_TYPE.NONE,
        target1Vary:     undefined,
        target2Vary:     undefined,

        _wm: new ig.EffectConfig({
            particleType: "Particle",
            attributes: {
                duration:        { _type: "Number",      _info: "Time over which to spawn particles" },
                numParticles:    { _type: "Number",      _info: "How many homing particles to spawn" },
                flyType:         { _type: "String",      _info: "How particle should fly between targets", _select: ig.FX_HOMING_FLY_TYPE },
                inverse:         { _type: "Boolean",     _info: "If true, fly target1→target2. Otherwise fly target2→target1" },
                offsetRadius:    { _type: "NumberVary",  _info: "How far particle should fly in normal xy direction" },
                offRadiusZScale: { _type: "Number",      _info: "How to scale radius along Z direction. 1=normal length", _default: 1 },
                offsetAngle:     { _type: "NumberVary",  _info: "Angle variance relative to radius pointing upwards. 1 = offset radius will be along half circle" },
                target1Vary:     { _type: "Number",      _info: "Random radial offset from target1 pos in x/y coords", _optional: true },
                target2Vary:     { _type: "Number",      _info: "Random radial offset from target2 pos in x/y coords", _optional: true },
                phaseDurations:  { _type: "NumberArray", _info: "Relative duration for each phase of the fly type. Values must add to 1" },
                rotateMoveDir:   { _type: "String",      _info: "How particles should be rotated", _select: sc.HOMING_ROTATE_TYPE }
            }
        }),

        init: function (sheet, cfg) {
            this.duration        = cfg.duration        || 0;
            this.particleData    = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            this.numParticles    = cfg.numParticles    || 1;
            this.flyType         = cfg.flyType;
            this.inverse         = cfg.inverse         || false;
            this.offsetRadius    = cfg.offsetRadius    || 0;
            this.offRadiusZScale = cfg.offRadiusZScale || 0;
            this.offsetAngle     = cfg.offsetAngle     || 0;
            this.phaseDurations  = cfg.phaseDurations;
            this.rotateMoveDir   = sc.HOMING_ROTATE_TYPE[cfg.rotateMoveDir] || sc.HOMING_ROTATE_TYPE.NONE;
            this.target1Vary     = cfg.target1Vary;
            this.target2Vary     = cfg.target2Vary;
        },

        getDuration: function () {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        start: function (effectEntity) {
            if (this.duration) {
                return { duration: this.duration, particles: this.numParticles };
            }
            this._spawnParticles(effectEntity, 0, this.numParticles);
        },

        update: function (effectEntity, from, to) {
            this._spawnParticles(effectEntity, from, to);
        },

        /**
         * Spawn homing particles in the index range [from, to).
         * @param {ig.ENTITY.Effect} effectEntity
         * @param {number} from  first particle index
         * @param {number} to    last particle index (exclusive)
         * @private
         */
        _spawnParticles: function (effectEntity, from, to) {
            var particleSettings = {
                data:           this.particleData,
                ownerEffect:    effectEntity,
                normalXY:       0,
                normalZ:        0,
                phaseDurations: this.phaseDurations,
                flyType:        this.flyType,
                inverse:        this.inverse,
                rotateMoveDir:  this.rotateMoveDir,
                target1Vary:    this.target1Vary,
                target2Vary:    this.target2Vary
            };

            for (var i = from; i < to; i++) {
                // compute per-particle arc normal direction
                // _normalDir starts pointing "up" and is randomly rotated within offsetAngle
                Vec2.assignC(_normalDir, 0, 1);
                Vec2.rotate(_normalDir, (Math.random() - 0.5) * Math.PI * this.offsetAngle);

                var radius = ig.Event.getNumberVary(this.offsetRadius);
                particleSettings.normalXY = radius * _normalDir.x;
                particleSettings.normalZ  = radius * _normalDir.y * this.offRadiusZScale;

                effectEntity.spawnParticle(ig.ENTITY.HomingParticle, null, particleSettings);
            }
        }
    });

});
