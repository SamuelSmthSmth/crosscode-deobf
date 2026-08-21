/**
 * impact.feature.effect.fx.fx-box
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-box")`.
 *
 * Defines:
 *   ig.BOX_PARTICLE_SIDE          — bitmask enum for which sides of a bounding box to spawn on
 *   ig.EFFECT_ENTRY.PARTICLE_BOX  — spawns particles along the edges of the target entity's box
 */

ig.module("impact.feature.effect.fx.fx-box")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- module-scoped scratch vectors ----------------------------------------
    var _lineStart  = Vec2.create(); // start position of the current box edge
    var _spawnPos   = Vec3.create(); // scratch for per-particle world position
    var _centerOff  = Vec2.create(); // scratch for center-relative position (used for velocity / flipX)
    var _moveVec    = Vec2.create(); // scratch for OffsetParticle moveOffset
    var _settings   = {};            // reused particle-settings object

    // =========================================================================
    // ig.BOX_PARTICLE_SIDE
    // =========================================================================
    /**
     * Bitmask selecting which edges of the entity bounding box to emit particles on.
     *
     * Values can be combined with bitwise OR, e.g. NORTH | EAST, or used
     * via the named aggregate presets (NO_NORTH etc.).
     *
     * @enum {number}
     */
    ig.BOX_PARTICLE_SIDE = {
        ALL:      15, // NORTH | EAST | SOUTH | WEST
        NORTH:     1,
        EAST:      2,
        SOUTH:     4,
        WEST:      8,
        NO_NORTH: 14, // EAST | SOUTH | WEST
        NO_EAST:  13, // NORTH | SOUTH | WEST
        NO_SOUTH: 11, // NORTH | EAST | WEST
        NO_WEST:   7  // NORTH | EAST | SOUTH
    };

    /**
     * Descriptor table for the four box sides.
     * Each entry contains the UV-space parameters for computing the edge:
     *   x / y  — starting corner (0 or 1 in box-UV space)
     *   w / h  — direction flags: 1 if the edge extends in that dimension
     *   flag   — the corresponding ig.BOX_PARTICLE_SIDE bit
     * @private
     */
    var _BOX_SIDES = [
        { x: 0, y: 0, w: 1, h: 0, flag: 1 }, // NORTH  (top edge)
        { x: 1, y: 0, w: 0, h: 1, flag: 2 }, // EAST   (right edge)
        { x: 0, y: 1, w: 1, h: 0, flag: 4 }, // SOUTH  (bottom edge)
        { x: 0, y: 0, w: 0, h: 1, flag: 8 }  // WEST   (left edge)
    ];

    // =========================================================================
    // ig.EFFECT_ENTRY.PARTICLE_BOX
    // =========================================================================
    /**
     * Spawns particles evenly spaced along the edges of the target entity's
     * collision bounding box.
     *
     * If `moveZ` is set, spawns OffsetParticles that drift upward.
     * Otherwise spawns plain Particles launched radially outward from the box centre.
     *
     * Step config fields (in addition to particle-state fields):
     *   boxSide             {BOX_PARTICLE_SIDE key}  which edges to use (default ALL)
     *   padding             {Vec2}   inflate (or deflate if negative) the box bounds
     *   numParticles        {number} particles per 32px of edge length
     *   random              {number} 0–1 positional jitter along the edge
     *   flipRightParticles  {boolean} horizontally flip particles on the right side
     *   minSpeed / maxSpeed {number}  launch speed range (only when moveZ = 0)
     *   moveZ               {number}  upward Z displacement for OffsetParticle
     *   moveZVariance       {number}  variance on moveZ
     *   collision           {boolean} enable collision on the particle
     */
    ig.EFFECT_ENTRY.PARTICLE_BOX = ig.EffectStepBase.extend({
        particleData:       null,
        padding:            { x: 0, y: 0 },
        boxSide:            0,
        numParticles:       4,
        flipRightParticles: false,
        minSpeed:           50,
        maxSpeed:           100,
        collision:          false,
        random:             0,
        moveZ:              0,
        moveZVariance:      0,

        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                boxSide:            { _type: "String",  _info: "Which side of the box to spawn particles on", _select: ig.BOX_PARTICLE_SIDE },
                padding:            { _type: "Vec2",    _info: "Padding around target bounds. Can also be negative" },
                collision:          { _type: "Boolean", _info: "Whether particles should collide." },
                numParticles:       { _type: "Integer", _info: "Amount of particles", _default: 1 },
                random:             { _type: "Number",  _info: "Randomness of particle spawning from 0 to 1", _optional: true },
                flipRightParticles: { _type: "Boolean", _info: "Flip particles spawned on the right side", _optional: true },
                minSpeed:           { _type: "Number",  _info: "Minimum Speed of particles", _optional: true },
                maxSpeed:           { _type: "Number",  _info: "Maximum Speed of particles", _optional: true },
                moveZ:              { _type: "Number",  _info: "Move particles upwards by given pixels. (won't move away in this case)", _optional: true },
                moveZVariance:      { _type: "Number",  _info: "Z Distance Variance.", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData       = ig.EffectConfig.loadParticleData(sheet.animSheet, cfg, sheet && sheet.cacheKey);
            if (cfg.padding) Vec2.assign(this.padding, cfg.padding);
            this.boxSide            = ig.BOX_PARTICLE_SIDE[cfg.boxSide || "ALL"];
            this.numParticles       = cfg.numParticles;
            this.flipRightParticles = cfg.flipRightParticles || false;
            this.minSpeed           = cfg.minSpeed           || 0;
            this.maxSpeed           = cfg.maxSpeed           || 0;
            this.collision          = cfg.collision          || false;
            this.random             = cfg.random             || 0;
            this.moveZ              = cfg.moveZ              || 0;
            this.moveZVariance      = cfg.moveZVariance      || 0;
        },

        getDuration: function () {
            return ig.EffectConfig.getParticleBlockTime(this.particleData);
        },

        start: function (effectEntity) {
            if (!effectEntity.target) return;
            var coll = effectEntity.target.coll;
            for (var s = _BOX_SIDES.length; s--;) {
                if (this.boxSide & _BOX_SIDES[s].flag) {
                    this._spawnBoxLine(effectEntity, coll, _BOX_SIDES[s]);
                }
            }
        },

        /**
         * Spawn particles along one edge of the bounding box.
         * @param {ig.ENTITY.Effect} effectEntity
         * @param {ig.Coll} coll                 target's collision object
         * @param {object}  side                 entry from _BOX_SIDES
         * @private
         */
        _spawnBoxLine: function (effectEntity, coll, side) {
            // compute edge start (relative to target origin, offset by padding)
            var edgeStartX = side.x ? coll.size.x + this.padding.x : -this.padding.x;
            var edgeStartY = side.y ? coll.size.y + this.padding.y : -this.padding.y;

            // compute edge length in each axis
            var edgeLenX = side.w ? coll.size.x + this.padding.x * 2 : 0;
            var edgeLenY = side.h ? coll.size.y + this.padding.y * 2 : 0;

            Vec2.assignC(_lineStart, 0, 0);
            Vec2.addC(_lineStart, edgeStartX, edgeStartY);

            // number of particles along this edge
            var n    = Math.max(1, this.numParticles * (edgeLenX + edgeLenY) / 32 | 0);
            var stepX = edgeLenX / n;
            var stepY = edgeLenY / n;

            _settings.data      = this.particleData;
            _settings.friction  = 0.8;
            _settings.collision = this.collision;

            for (var k = 0; k < n; k++) {
                var pPos = Vec3.assignC(_spawnPos, _lineStart.x, _lineStart.y, 0);
                pPos.x += (0.5 + k + (Math.random() - 0.5) * this.random) * stepX;
                pPos.y += (0.5 + k + (Math.random() - 0.5) * this.random) * stepY;

                // centre-relative direction (for velocity / flipX decisions)
                var centreOff = Vec2.assignC(_centerOff, pPos.x, pPos.y);
                Vec2.subC(centreOff, coll.size.x / 2, coll.size.y / 2);

                _settings.flipX = this.flipRightParticles && centreOff.x < 0;

                if (this.moveZ) {
                    // spawn OffsetParticle that drifts upward
                    var zDist = this.moveZ + (Math.random() - 0.5) * 2 * this.moveZVariance;
                    _settings.alongZ    = true;
                    _settings.moveOffset = Vec2.assignC(_moveVec, 0, zDist);
                    _settings.keySpline  = KEY_SPLINES.EASE_OUT;
                    effectEntity.spawnParticle(ig.ENTITY.OffsetParticle, pPos, _settings, true);
                } else {
                    // spawn Particle launched radially
                    Vec2.length(centreOff, this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed));
                    _settings.vel = centreOff;
                    effectEntity.spawnParticle(ig.ENTITY.Particle, pPos, _settings, true);
                }
            }
        }
    });

});
