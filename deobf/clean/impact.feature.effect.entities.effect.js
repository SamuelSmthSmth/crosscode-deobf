/**
 * impact.feature.effect.entities.effect
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.entities.effect")`.
 *
 * Defines:
 *   ig.EFFECT_STATE         — enum: RUNNING / POST_LOOP / ENDED
 *   ig.ENTITY.Effect        — pooled entity that drives an ig.Effect timeline
 *   ig.EffectTools          — static helpers: clearEffects, getFirstEffect
 */

ig.module("impact.feature.effect.entities.effect")
    .requires(
        "impact.base.entity",
        "impact.base.entity-pool"
    )
    .defines(function () {

    // -------------------------------------------------------------------------
    // Scratch vectors (module-private)
    // -------------------------------------------------------------------------
    var _v3 = Vec3.create(); // scratch Vec3 for deferredUpdate position math
    var _v2 = Vec2.create(); // scratch Vec2 for rotOffset / rotateFace math

    // =========================================================================
    // ig.EFFECT_STATE
    // =========================================================================
    /**
     * Lifecycle states for a running effect.
     * @enum {number}
     */
    ig.EFFECT_STATE = {
        RUNNING:   0, // timeline still advancing through the loop region
        POST_LOOP: 1, // loop ended, playing post-loop section
        ENDED:     2  // effect is fully finished, entity will be killed
    };

    // =========================================================================
    // ig.ENTITY.Effect
    // =========================================================================
    /**
     * The entity that owns and drives a single running ig.Effect.
     *
     * An Effect entity is invisible (zero collision size, no sprites of its
     * own). Its deferredUpdate() advances the ig.Effect timeline, positions
     * itself to follow its `target`, and manages the particle and runner arrays.
     *
     * Lifecycle
     * ---------
     *   spawnEntity(ig.ENTITY.Effect, x, y, z, opts)  ← spawned by EffectSheet
     *   → _initEffect(opts)                            ← configures the entity
     *   → deferredUpdate() every tick                  ← drives timeline & particles
     *   → this.kill()                                  ← automatic when effect finishes
     *
     * Key opts fields
     * ---------------
     *   effect          {ig.Effect}         compiled effect definition
     *   target          {ig.Entity|null}    entity the effect tracks
     *   target2         {ig.Entity|null}    secondary target for homing / laser
     *   target2Point    {Vec3|null}         fixed-point secondary target
     *   target2Align    {ig.ENTITY_ALIGN}
     *   target2Offset   {Vec3|null}
     *   noMultiGroup    {boolean}
     *   spriteFilter    {number[]|null}     only apply to sprite indices listed
     *   angle           {number}            base rotation angle (radians)
     *   flipX           {boolean}
     *   duration        {number}            0 = play once; -1 = loop forever
     *   offset          {Vec3}              spawn offset from aligned position
     *   rotOffset       {Vec2|null}         offset rotated with effect angle
     *   rotateFace      {number}            # of face directions, or -1 for exact
     *   flipLeftFace    {boolean}           flip when angle > π
     *   align           {ig.ENTITY_ALIGN}   alignment on target
     *   group           {string|null}       attach-group tag (used by clearEffects)
     *   callback        {object|null}       receives onEffectEvent(effectEntity)
     *
     * @extends ig.Entity
     */
    ig.ENTITY.Effect = ig.Entity.extend({

        // -- instance fields --------------------------------------------------
        offset:    { x: 0, y: 0, z: 0 },
        rotOffset: null,
        angle:     0,
        flipX:     false,
        duration:  0,

        state:   ig.EFFECT_STATE.RUNNING,
        effect:  null,
        target:  null,
        spriteFilter: null,

        timelineIndex: 0,
        timer:  0,
        looped: false,

        particles: [], // [ig.ParticleHandle]
        runners:   [], // [ig.EffectTimeRunner | ig.EffectParticleRunner]

        align: ig.ENTITY_ALIGN.BOTTOM,

        /** Secondary target info (homing particles, laser, etc.) */
        target2: {
            point:  null,
            entity: null,
            align:  null,
            offset: Vec3.create()
        },

        attachGroup: null,  // string tag for selective clearEffects()
        callback:    null,  // {onEffectEvent(effectEntity)} — POST_LOOP / ENDED

        rotateFace:   0,
        flipLeftFace: false,

        // -- lifecycle --------------------------------------------------------

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initEffect(settings);
        },

        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initEffect(settings);
        },

        /**
         * Shared init/reset logic.
         * @param {object} s - spawn settings (see opts table above)
         */
        _initEffect: function (s) {
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);

            this.state         = ig.EFFECT_STATE.RUNNING;
            this.effect        = s.effect;
            this.target        = s.target  || null;
            this.target2.point  = s.target2Point  || null;
            this.target2.entity = s.target2        || null;
            this.target2.align  = s.target2Align   || null;
            this.noMultiGroup   = s.noMultiGroup    || false;

            s.target2Offset
                ? Vec3.assign(this.target2.offset, s.target2Offset)
                : Vec3.assignC(this.target2.offset, 0, 0, 0);

            this.spriteFilter = (s.spriteFilter === undefined) ? null : s.spriteFilter;
            this.angle        = s.angle  || 0;
            this.flipX        = s.flipX  || false;
            this.duration     = s.duration || this.effect.loopEndTime;

            s.offset
                ? Vec3.assign(this.offset, s.offset)
                : Vec3.assignC(this.offset, 0, 0, 0);
            Vec3.add(this.coll.pos, this.offset);

            // rotated offset (e.g. a sword handle relative to the facing angle)
            if ((this.rotOffset = s.rotOffset || null)) {
                var rotated = Vec2.rotate(this.rotOffset, -this.angle, _v2);
                Vec2.add(this.coll.pos, rotated);
            }

            this.rotateFace   = s.rotateFace;
            this.flipLeftFace = s.flipLeftFace;
            this.attachGroup  = s.group    || null;
            this.align        = (typeof s.align === "string"
                                    ? ig.ENTITY_ALIGN[s.align]
                                    : s.align) || 0;

            this.timer         = 0;
            this.timelineIndex = 0;
            this.looped        = false;
            this.particles.length = 0;
            this.runners.length   = 0;
            this.callback = s.callback;

            // time parent (for slowdown / stop)
            this.coll.time.parent            = null;
            this.coll.time.parentAnimToGlobal = false;

            if (this.target) {
                this.target.addEntityAttached(this);
                if (this.target.coll.parentColl) {
                    this.target.coll.parentColl.entity.addEntityAttached(this);
                }
                this.coll.time.parent            = this.target.coll;
                this.coll.time.parentAnimToGlobal = true;
            }

            if (this.target2 && this.target2.entity && this.target2.entity !== this.target) {
                this.target2.entity.addEntityAttached(this);
                if (this.target2.entity.coll.parentColl) {
                    this.target2.entity.coll.parentColl.entity.addEntityAttached(this);
                }
            }

            this.actionTarget = null;
        },

        // -- public API -------------------------------------------------------

        /**
         * Register this effect as attached to an action entity.
         * The effect will be stopped when the action ends.
         * @param {ig.ActionEntity} actionEntity
         */
        attachToAction: function (actionEntity) {
            this.actionTarget = actionEntity;
            actionEntity.addActionAttached(this);
            if (this.actionTarget !== this.target && this.actionTarget !== this.target2) {
                actionEntity.addEntityAttached(this);
            }
        },

        /**
         * Override the time parent for this effect (used by SHOW_EFFECT when the
         * time entity differs from the target).
         * @param {ig.Entity|null} entity
         */
        setTimeEntity: function (entity) {
            this.coll.time.parent = (entity && entity.coll) || null;
        },

        /**
         * Make this effect immune to slowdown (e.g. for UI effects).
         */
        setIgnoreSlowdown: function () {
            this.coll.time.parent       = null;
            this.coll.time.globalStatic = true;
        },

        /**
         * Compute the world position of the secondary target into `out`.
         * @param {Vec3} out
         * @returns {Vec3} out (same reference)
         */
        getTarget2Pos: function (out) {
            if (this.target2.point) {
                Vec3.assign(out, this.target2.point);
            } else if (this.target2.entity) {
                this.target2.entity.getAlignedPos(this.target2.align, out);
            }
            if (this.target2.offset) Vec3.add(out, this.target2.offset);
            return out;
        },

        /**
         * Signal this effect to end its looping section on the next update.
         */
        stop: function () {
            this.duration = 0;
        },

        /**
         * @returns {boolean} true when state == ENDED
         */
        isDone: function () {
            return this.state === ig.EFFECT_STATE.ENDED;
        },

        /**
         * @returns {number} estimated seconds until the effect fully disappears
         */
        getRemainingTime: function () {
            return this.effect.getRemainingTime(this);
        },

        /**
         * Replace the callback (called at state transitions).
         * @param {object} cb
         */
        setCallback: function (cb) {
            this.callback = cb;
        },

        // -- entity attachment callbacks --------------------------------------

        onActionEndDetach: function () { this.stop(); },
        onEntityKillDetach: function () { this.stop(); },

        // -- particle spawning ------------------------------------------------

        /**
         * Spawn a new particle entity and register its handle in this.particles[].
         * Called by ig.EFFECT_ENTRY step objects during timeline execution.
         *
         * @param {function} ParticleClass   entity constructor (e.g. ig.ENTITY.Particle)
         * @param {Vec3|null} offset          offset from effect/target position
         * @param {object} settings           forwarded to the particle entity's init
         * @param {boolean} [fromTarget]      if true, offset from target pos instead of effect pos
         */
        spawnParticle: function (ParticleClass, offset, settings, fromTarget) {
            if (this._killed) throw new Error("Spawned Particle after effect has been killed!");

            var baseColl = (fromTarget && this.target) ? this.target.coll : this.coll;
            var spawnX = baseColl.pos.x + (offset && offset.x || 0);
            var spawnY = baseColl.pos.y + (offset && offset.y || 0);
            var spawnZ = baseColl.pos.z + (offset && offset.z || 0);

            settings.ownerEffect = this;
            var particle = ig.game.spawnEntity(ParticleClass, spawnX, spawnY, spawnZ, settings);
            particle.coll.time.parent = this.coll;

            if (particle.face && this.target && this.target.face) {
                Vec2.assign(particle.face, this.target.face);
                particle.updateAnim();
            }

            if (!particle.handle) throw new Error("Particle has no handle!");
            this.particles.push(particle.handle);
        },

        // -- update -----------------------------------------------------------

        /** Effects have no base update — all work is done in deferredUpdate. */
        update: function () {},

        /**
         * Called after all regular entity updates each tick.
         * Advances the timeline, positions this entity to its aligned target,
         * moves particles that follow the target, and kills the entity when done.
         */
        deferredUpdate: function () {
            var coll = this.coll;

            // --- face-direction tracking for rotateFace ---
            var faceDirX, faceDirY;
            if (this.target && this.target.face && this.rotateFace) {
                var faceVec;
                if (this.rotateFace > 0) {
                    faceVec = ig.getRoundedFaceDir(this.target.face.x, this.target.face.y, this.rotateFace, _v2);
                } else {
                    faceVec = this.target.face;
                }
                this.angle = Vec2.clockangle(faceVec);
                if (this.flipLeftFace && this.angle > Math.PI) this.flipX = true;
            }

            // --- follow target alignment ---
            var dx = 0, dy = 0, dz = 0;
            if (this.target && this.align) {
                var alignedPos = this.target.getAlignedPos(this.align, _v3);
                Vec3.add(alignedPos, this.offset);
                if (this.rotOffset) {
                    var rot = Vec2.rotate(this.rotOffset, -this.angle, _v2);
                    Vec2.add(alignedPos, rot);
                }
                dx = alignedPos.x - coll.pos.x;
                dy = alignedPos.y - coll.pos.y;
                dz = alignedPos.z - coll.pos.z;
                coll.pos.x += dx;
                coll.pos.y += dy;
                coll.pos.z += dz;
            }

            // --- particle maintenance ---
            var isEnding = this.effect.isEnding(this);
            for (var p = this.particles.length; p--;) {
                var handle = this.particles[p];
                var particleColl = handle.entity.coll;
                var shouldMove = handle.moveWithTarget &&
                    (handle.maxTime < 0 || handle.moveWithTarget >= handle.timer / handle.maxTime);

                // cancel particles when effect is ending if they are cancelable
                if (isEnding && (handle.maxTime < 0 || (shouldMove && handle.cancelable))) {
                    handle.cancelable = false;
                    handle.cancel();
                }

                // kill finished particles
                if (handle.maxTime >= 0 && handle.timer >= handle.maxTime) {
                    handle.entity.kill();
                    this.particles.splice(p, 1);
                } else if (this.target) {
                    // move particle with target if it's in the moveWithTarget window
                    if (shouldMove && !handle.entity.autoTargetStuck) {
                        particleColl.pos.x += dx;
                        particleColl.pos.y += dy;
                        particleColl.pos.z += dz;
                    } else if (coll.time.parent && coll.time.parent.time.factor < 1) {
                        particleColl.time.parent = null;
                    }
                    if (this.target.face && handle.syncFace) {
                        Vec2.assign(handle.entity.face, this.target.face);
                    }
                }
            }

            // --- advance timeline ---
            this.effect.update(this);

            // --- auto-kill when fully done ---
            if (this.effect.isDone(this) &&
                this.particles.length === 0 &&
                this.runners.length  === 0) {
                this.kill();
            }
        },

        // -- runner management ------------------------------------------------

        updateRunners: function () {
            for (var r = this.runners.length; r--;) {
                if (this.runners[r].update(this)) this.runners.splice(r, 1);
            }
        },

        cancelRunners: function (onlyPermanent) {
            for (var r = this.runners.length; r--;) {
                if (this.runners[r].cancel(this, onlyPermanent)) this.runners.splice(r, 1);
            }
        },

        // -- on-kill cleanup --------------------------------------------------

        onKill: function (a) {
            if (this.target) {
                this.target.removeEntityAttached(this);
                if (this.target.removeActionAttached) this.target.removeActionAttached(this);
                if (this.target.coll.parentColl) {
                    var parentEntity = this.target.coll.parentColl.entity;
                    parentEntity.removeEntityAttached(this);
                    if (parentEntity.removeActionAttached) parentEntity.removeActionAttached(this);
                }
            }
            if (this.target2.entity && this.target2.entity !== this.target) {
                this.target2.entity.removeEntityAttached(this);
                if (this.target2.entity.coll.parentColl) {
                    this.target2.entity.coll.parentColl.entity.removeEntityAttached(this);
                }
            }
            if (this.actionTarget) {
                this.actionTarget.removeActionAttached(this);
                if (this.actionTarget !== this.target && this.actionTarget !== this.target2) {
                    this.actionTarget.removeEntityAttached(this);
                }
            }
            this.parent(a);
        }
    });

    ig.EntityPool.enableFor(ig.ENTITY.Effect);

    // =========================================================================
    // ig.EffectTools
    // =========================================================================
    /**
     * Static utility functions for managing effects attached to entities.
     */
    ig.EffectTools = {};

    /**
     * Kill all Effect entities attached to `entity`, optionally filtered by group.
     * @param {ig.Entity} entity
     * @param {string|null} [group]   if provided, only clear effects with this attachGroup
     */
    ig.EffectTools.clearEffects = function (entity, group) {
        entity.clearEntityAttached(function (attached) {
            return attached instanceof ig.ENTITY.Effect && (!group || group === attached.attachGroup);
        });
    };

    /**
     * Return the first Effect attached to `entity` with the given group, or null.
     * @param {ig.Entity} entity
     * @param {string} group
     * @returns {ig.ENTITY.Effect|null}
     */
    ig.EffectTools.getFirstEffect = function (entity, group) {
        var list = entity.entityAttached;
        for (var i = list.length; i--;) {
            var ent = list[i];
            if (ent instanceof ig.ENTITY.Effect && group === ent.attachGroup) return ent;
        }
        return null;
    };

});
