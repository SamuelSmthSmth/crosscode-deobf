/**
 * impact.feature.effect.entities.effect-particle
 * ================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.entities.effect-particle")`.
 *
 * Defines all particle entity types used by the effect system, plus the
 * shared ig.ParticleHandle that manages per-particle animation state.
 *
 * Particle types
 * --------------
 *   ig.ParticleHandle     — shared animation-state driver (not an entity)
 *   ig.ENTITY.Particle          — basic animated particle
 *   ig.ENTITY.FaceParticle      — face-direction sprite particle
 *   ig.ENTITY.CopyParticle      — copies the owner entity's sprites with a tint
 *   ig.ENTITY.DebrisParticle    — physics debris with gravity / bounce
 *   ig.ENTITY.OffsetParticle    — extends Particle with a programmed move path
 *   ig.ENTITY.RhombusParticle   — extends Particle with rhombus-orbit motion
 *   ig.ENTITY.HomingParticle    — extends Particle with interpolated homing flight
 *   ig.ENTITY.LaserParticle     — renders a tiled texture laser beam between two points
 *
 *   ig.FX_HOMING_FLY_TYPE       — enum of homing flight curve families
 */

ig.module("impact.feature.effect.entities.effect-particle")
    .requires(
        "impact.base.entity",
        "impact.base.entity-pool"
    )
    .defines(function () {

    // =========================================================================
    // ig.ParticleHandle
    // =========================================================================
    /**
     * Manages per-particle animation state (alpha, scale, rotation) and lifetime.
     * Attached to every particle entity as `entity.handle`.
     *
     * Particle data fields (from ig.EffectConfig.loadParticleData)
     * -----------------------------------------------------------
     *   anim            {ig.AnimSheet anim|null}
     *   followUpAnim    {ig.AnimSheet anim|null}  played before main anim
     *   postAnim        {ig.AnimSheet anim|null}  played when particle ending
     *   state           {ig.ParticleState}
     *   moveWithTarget  {number}  0=never, 1=always track target
     *   particleDuration {number} 0=anim length, -1=forever, -2=effect duration
     *   particleDurVariance {number}
     *   angleVary       {number}  random angle range (in full turns, 0–1)
     *   randFlip        {boolean}
     *   cancelable      {boolean}
     *   light           {number}  ig.LIGHT_SIZE value (0 = none)
     */
    ig.ParticleHandle = ig.Class.extend({

        entity:         null,   // owning particle entity
        syncFace:       false,  // if true, sync face direction from owner effect
        timer:          0,
        maxTime:        0,
        postAnimTime:   0,
        pData:          null,   // raw particle data object
        particleState:  null,   // ig.ParticleState
        startAngle:     0,
        angleSync:      null,   // effect entity providing live angle sync
        flipX:          0,
        moveWithTarget: 0,
        cancelable:     false,

        init: function (entity, syncFace) {
            this.entity   = entity;
            this.syncFace = syncFace || false;
        },

        /**
         * Trigger end-of-life animation on a cancelable or infinite-duration particle.
         * Sets timer so the post/end animations can play.
         */
        cancel: function () {
            if (this.maxTime < 0) {
                this.maxTime = 100;
                this.timer   = this.maxTime - this.particleState.getMaxEndTime(this.postAnimTime);
            } else {
                this.timer = Math.max(this.timer,
                    this.maxTime - this.particleState.getMaxEndTime(this.postAnimTime));
            }
        },

        /**
         * Configure this handle from a spawn-data block.
         * Called by particle entity _init functions.
         * @param {object} spawnData  includes {data, ownerEffect, angle, flipX, angleSync}
         */
        setData: function (spawnData) {
            var pd = spawnData.data;
            this.pData         = pd;
            this.particleState = pd.state;

            this.maxTime = pd.particleDuration;
            if (this.maxTime === -2) this.maxTime = spawnData.ownerEffect.duration;
            if (!this.maxTime)      this.maxTime = (pd.anim && pd.anim.getDuration()) || 0;
            if (pd.particleDurVariance) {
                this.maxTime += (Math.random() * 2 - 1) * pd.particleDurVariance;
            }

            this.postAnimTime   = (pd.postAnim && pd.postAnim.getDuration()) || 0;
            this.timer          = 0;
            this.moveWithTarget = pd.moveWithTarget;
            this.cancelable     = pd.cancelable;
            this.flipX          = spawnData.flipX  || false;
            this.startAngle     = spawnData.angle  || 0;

            if (pd.angleVary) {
                this.startAngle += (Math.random() - 0.5) * pd.angleVary * Math.PI * 2;
            }
            if (pd.randFlip && Math.random() < 0.5) this.flipX = !this.flipX;

            this.angleSync = spawnData.angleSync || null;

            // emit light if configured
            if (pd.light) {
                var fadeTime = 0.05, duration = -1;
                if (this.maxTime > 0) { fadeTime = duration = this.maxTime / 2; }
                this.lightHandle = new ig.LightHandle(this.entity, pd.light, 0, fadeTime, duration, 1, false);
                ig.light.addLightHandle(this.lightHandle);
            }
        },

        /** Called each tick by the owning particle entity. */
        onUpdate: function () {
            if (this.angleSync) this.startAngle = this.angleSync.angle;
            this.timer += ig.system.tick;
            // trigger post-anim when approaching end
            if (this.postAnimTime &&
                this.maxTime > 0 &&
                this.maxTime - this.timer < this.postAnimTime) {
                this.entity.setCurrentAnim("post", true);
            }
        },

        // -- animation-state bridge methods -----------------------------------

        initSprite:      function (sprite) { this.particleState.initSprite(sprite, this.startAngle, this.flipX); },
        updateSprite:    function (sprite) { this.particleState.updateSprite(sprite, this.timer, this.maxTime, this.postAnimTime, this.startAngle, this.flipX, this.angleSync); },
        initAnimState:   function (state)  { this.particleState.initAnimState(state, this.startAngle, this.flipX); },
        updateAnimState: function (state)  { this.particleState.updateAnimState(state, this.timer, this.maxTime, this.postAnimTime, this.startAngle, this.flipX, this.angleSync); },

        /** Set up animation sets on the provided AnimationSheet. */
        initAnimations: function (animSheet) {
            var pd = this.pData;
            animSheet.replaceAnimationSet("default", pd.anim);
            if (pd.followUpAnim) {
                animSheet.replaceAnimationSet("followUp", pd.followUpAnim);
                this.entity.setCurrentAnim("default", true, "followUp", true);
            } else {
                animSheet.removeAnimSet("followUp");
                this.entity.setCurrentAnim("default", true, null, true);
            }
            if (pd.postAnim) {
                animSheet.replaceAnimationSet("post", pd.postAnim);
            } else {
                animSheet.removeAnimSet("post");
            }
        }
    });

    // =========================================================================
    // ig.ENTITY.Particle
    // =========================================================================
    /**
     * The most common particle type — a plain animated sprite.
     *
     * Spawn settings (in addition to ParticleHandle.setData fields):
     *   vel       {Vec2}    initial XY velocity
     *   friction  {number}  ground/air friction
     *   collision {boolean} enable passive collision
     * @extends ig.AnimatedEntity
     */
    ig.ENTITY.Particle = ig.AnimatedEntity.extend({
        handle: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.animSheet = new ig.AnimationSheet();
            this.handle    = new ig.ParticleHandle(this);
            this._initParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initParticle(settings);
        },
        _initParticle: function (s) {
            this.handle.setData(s);
            this.coll.type         = s.collision ? ig.COLLTYPE.PASSIVE : ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);
            this.coll.alwaysRender = true;
            if (s.vel) Vec2.assign(this.coll.vel, s.vel);
            this.coll.friction.ground = s.friction || 0;
            this.coll.friction.air    = this.coll.friction.ground;
            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState);
        },
        update: function () {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent();
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.Particle);

    // =========================================================================
    // ig.ENTITY.FaceParticle
    // =========================================================================
    /**
     * A particle that renders in the face-direction animation sheet of the
     * effect's target, and always moves with it (moveWithTarget = 1).
     *
     * Spawn settings:
     *   size  {Vec3|null}  collision size matching target
     * @extends ig.AnimatedEntity
     */
    ig.ENTITY.FaceParticle = ig.AnimatedEntity.extend({
        handle: null,
        face:   { x: 0, y: 0 },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.animSheet = new ig.AnimationSheet();
            this.handle    = new ig.ParticleHandle(this, true); // syncFace = true
            this._initFaceParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.face.x = this.face.y = 0;
            this._initFaceParticle(settings);
        },
        _initFaceParticle: function (s) {
            this.handle.setData(s);
            this.handle.moveWithTarget = 1; // always follows target
            this.coll.type = ig.COLLTYPE.NONE;
            if (s.size) {
                this.coll.setSize(s.size.x, s.size.y, s.size.z);
            } else {
                this.coll.setSize(0, 0, 0);
            }
            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState);
        },
        update: function () {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent();
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.FaceParticle);

    // =========================================================================
    // ig.ENTITY.CopyParticle
    // =========================================================================
    /**
     * Copies the target entity's sprites and applies a colour tint/fade.
     * Used for ghost/afterimage effects.
     *
     * Spawn settings:
     *   entity      {ig.Entity}    entity whose sprites to copy
     *   color       {string|null}  initial CSS colour overlay
     *   fadeColor   {string|null}  overlay colour at end-of-life
     *   colorAlpha  {number}       overlay alpha (0–1)
     *   noLighter   {boolean}      use regular overlay instead of lighter blending
     *   spriteFilter {number[]|null} which sprite indices to copy
     *   offset      {Vec3|null}    positional offset applied to copied sprites
     * @extends ig.Entity
     */
    ig.ENTITY.CopyParticle = ig.Entity.extend({
        handle:    null,
        color:     null,
        colorAlpha: null,
        noLighter: false,
        oldPos:    Vec3.create(),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.handle = new ig.ParticleHandle(this);
            this._initCopyParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initCopyParticle(settings);
        },
        _initCopyParticle: function (s) {
            this.handle.setData(s);
            this.coll.type            = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.color      = s.color      || null;
            this.fadeColor  = s.fadeColor  || null;
            this.colorAlpha = s.colorAlpha || 1;
            this.noLighter  = s.noLighter  || false;

            var spriteFilter = s.spriteFilter;
            var srcEntity    = s.entity;
            var isGui = srcEntity.sprites.length && srcEntity.sprites[0].gui || false;
            var destIdx = 0;
            for (var k = srcEntity.sprites.length; k--;) {
                if (!spriteFilter || spriteFilter.indexOf(k) !== -1) {
                    this.setSpriteCount(destIdx + 1, isGui);
                    var destSprite = this.sprites[destIdx];
                    destSprite.assign(srcEntity.sprites[k]);
                    destSprite.setShadow(0, 0, 0, 0);
                    destSprite.pos.y       -= 1;
                    destSprite.gfxOffset.y += 1;
                    if (s.offset) Vec3.add(destSprite.pos, s.offset);
                    this.handle.initSprite(destSprite);
                    destIdx++;
                }
            }
            Vec3.assign(this.oldPos, this.coll.pos);
        },

        initSprites: function () {}, // overridden — sprites set up in _initCopyParticle

        update: function () {
            this.handle.onUpdate();
            this.parent();
        },

        updateSprites: function () {
            // compute delta movement since last frame
            var delta = Vec3.sub(this.coll.pos, this.oldPos, _scratchDelta);
            Vec3.assign(this.oldPos, this.coll.pos);

            // compute blended colour for this frame
            var color = this.color;
            if (this.fadeColor) {
                var t    = this.handle.timer / this.handle.maxTime;
                var from = new ig.RGBColor(this.color);
                var to   = new ig.RGBColor(this.fadeColor);
                ig.RGBColor.interpolate(from, to, t, from);
                color = from.toRGB();
            }

            for (var i = this.sprites.length; i--;) {
                Vec3.add(this.sprites[i].pos, delta);
                if (this.noLighter) {
                    this.sprites[i].setOverlayColor(color, this.colorAlpha);
                } else {
                    this.sprites[i].setLighterOverlayColor(color, this.colorAlpha);
                }
                this.handle.updateSprite(this.sprites[i]);
            }
        }
    });
    // scratch Vec3 for CopyParticle.updateSprites delta
    var _scratchDelta = Vec3.create();
    ig.EntityPool.enableFor(ig.ENTITY.CopyParticle);

    // =========================================================================
    // ig.ENTITY.DebrisParticle
    // =========================================================================
    /**
     * Animated particle with full physics: gravity, z-bounce, shadow.
     *
     * Extra spawn settings:
     *   debrisSize      {Vec3}   collision box size (default 8×8×8)
     *   zGravityFactor  {number} gravity multiplier (default 1)
     *   zBounciness     {number} z-axis bounce coefficient (default 0.9)
     *   zVel            {number} initial upward z velocity
     *   minZVel         {number} minimum z vel on each bounce (prevents tiny hops)
     *   shadowSize      {number}
     * @extends ig.AnimatedEntity
     */
    ig.ENTITY.DebrisParticle = ig.AnimatedEntity.extend({
        handle:  null,
        minZVel: 8,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.animSheet = new ig.AnimationSheet();
            this.handle    = new ig.ParticleHandle(this);
            this._initDebrisParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initDebrisParticle(settings);
        },
        _initDebrisParticle: function (s) {
            this.handle.setData(s);
            this.coll.type = ig.COLLTYPE.PASSIVE;
            var sz = s.debrisSize;
            if (sz) this.coll.setSize(sz.x, sz.y, sz.z);
            else    this.coll.setSize(8, 8, 8);

            this.coll.zGravityFactor = (s.zGravityFactor === undefined) ? 1    : s.zGravityFactor;
            this.coll.zBounciness    = (s.zBounciness    === undefined) ? 0.9  : s.zBounciness;
            this.coll.bounciness     = 1;
            this.coll.friction.ground = 1;
            this.coll.friction.air    = 0;
            this.coll.shadow.size     = s.shadowSize;

            // centre collision box on spawn point
            this.coll.setPos(
                this.coll.pos.x - this.coll.size.x / 2,
                this.coll.pos.y - this.coll.size.y / 2,
                this.coll.pos.z
            );
            if (s.vel) Vec2.assign(this.coll.vel, s.vel);
            this.coll.vel.z = s.zVel    || 0;
            this.minZVel    = s.minZVel || 0;

            this.handle.initAnimations(this.animSheet);
            this.handle.initAnimState(this.animState);
        },
        update: function () {
            this.handle.onUpdate();
            this.handle.updateAnimState(this.animState);
            this.parent();
        },
        /** Enforce a minimum z-velocity on each ground bounce. */
        onTouchGround: function () {
            if (this.minZVel && this.coll.vel.z < this.minZVel) {
                this.coll.vel.z = this.minZVel;
            }
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.DebrisParticle);

    // -- scratch vecs for OffsetParticle / RhombusParticle movement logic -----
    var _opPrev = Vec2.create(); // previous weighted offset
    var _opCurr = Vec2.create(); // current weighted offset

    // =========================================================================
    // ig.ENTITY.OffsetParticle
    // =========================================================================
    /**
     * A Particle that moves along a programmed Vec2 offset path.
     *
     * Extra spawn settings:
     *   moveOffset      {Vec2}   total XY (or XZ if alongZ) displacement
     *   startFactor     {number} fraction of moveOffset applied at spawn (0–1)
     *   moveDuration    {number} override duration (0 = use particleDuration)
     *   keySpline       {object} ig.KeySpline easing
     *   alongZ          {boolean} move along Z instead of Y
     *   inverse         {boolean} reverse direction
     *   moveRotate      {number} rotate moveOffset while moving (full turns)
     *   rotateWithTime  {boolean} rotate proportional to time vs. distance
     *   rotateGfx       {boolean} also rotate the sprite's angle
     *   normalMoveDist  {number} distance in perpendicular direction
     * @extends ig.ENTITY.Particle
     */
    ig.ENTITY.OffsetParticle = ig.ENTITY.Particle.extend({
        startFactor:    0,
        moveOffset:     Vec2.createC(0, 0),
        alongZ:         false,
        keySpline:      null,
        inverse:        false,
        moveRotate:     0,
        rotateWithTime: false,
        rotateGfx:      false,
        normalMoveDist: 0,
        moveDuration:   0,
        prevWeight:     0,
        moveTimer:      0,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        _initOffsetParticle: function (s) {
            this.coll.type      = ig.COLLTYPE.NONE;
            this.startFactor    = s.startFactor    || 0;
            Vec2.assign(this.moveOffset, s.moveOffset);
            this.alongZ         = s.alongZ         || false;
            this.keySpline      = s.keySpline      || KEY_SPLINES.LINEAR;
            this.inverse        = s.inverse        || false;
            this.moveDuration   = s.moveDuration   || 0;
            this.moveRotate     = s.moveRotate     || 0;
            this.rotateWithTime = s.rotateWithTime || false;
            this.rotateGfx      = s.rotateGfx      || false;
            this.normalMoveDist = s.normalMoveDist || 0;
            this.moveTimer      = 0;
            this.prevWeight     = -1; // sentinel: first frame
            this._updatePos();
        },

        _updatePos: function () {
            // "previous" offset (where we were last frame)
            var prevFactor = this.prevWeight === -1
                ? 0
                : this.startFactor + this.prevWeight * (1 - this.startFactor);
            if (this.prevWeight === -1) this.prevWeight = 0;
            Vec2.mulF(this.moveOffset, prevFactor, _opPrev);

            // advance timer
            var duration = this.moveDuration || this.handle.maxTime;
            this.moveTimer += ig.system.tick;
            if (this.moveTimer > duration) this.moveTimer = duration;
            var t = this.keySpline.get(this.moveTimer / duration);
            if (this.inverse) t = 1 - t;

            // "current" offset
            var currFactor = this.startFactor + t * (1 - this.startFactor);

            // apply rotation of the offset direction
            if (this.moveRotate) {
                var rotAmt = (this.rotateWithTime
                    ? ig.system.tick / duration
                    : t - this.prevWeight
                ) * this.moveRotate * Math.PI * 2;
                if (this.inverse) rotAmt = -rotAmt;
                Vec2.rotate(this.moveOffset, this.alongZ ? rotAmt : -rotAmt);
                if (this.rotateGfx) this.animState.angle += rotAmt;
            }

            // perpendicular movement component
            var normDist = this.normalMoveDist
                ? this.normalMoveDist * (ig.system.tick / duration)
                : 0;

            Vec2.mulF(this.moveOffset, currFactor, _opCurr);
            Vec2.sub(_opCurr, _opPrev); // delta = curr - prev

            this.setPos(
                this.coll.pos.x + _opCurr.x,
                this.coll.pos.y + (this.alongZ ? normDist  : _opCurr.y),
                this.coll.pos.z + (this.alongZ ? _opCurr.y : normDist)
            );
            this.prevWeight = t;
        },

        update: function () {
            this.parent();
            this._updatePos();
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.OffsetParticle);

    // =========================================================================
    // ig.ENTITY.RhombusParticle
    // =========================================================================
    /**
     * A Particle that orbits along a diamond (rhombus) path.
     *
     * Extra spawn settings:
     *   startFactor {number}  initial position along the rhombus (0–1)
     *   moveFactor  {number}  how much of the rhombus to traverse
     *   radius      {number}  half-width of the rhombus in pixels
     *   alongZ      {boolean} move along Z instead of Y
     *   keySpline   {object}  ig.KeySpline easing
     * @extends ig.ENTITY.Particle
     */
    ig.ENTITY.RhombusParticle = ig.ENTITY.Particle.extend({
        startFactor: 0,
        moveFactor:  0,
        radius:      100,
        alongZ:      false,
        keySpline:   null,
        prevWeight:  0,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        _initOffsetParticle: function (s) {
            this.coll.type   = ig.COLLTYPE.NONE;
            this.startFactor = s.startFactor || 0;
            this.moveFactor  = s.moveFactor  || 0;
            this.radius      = s.radius      || 0;
            this.alongZ      = s.alongZ      || false;
            this.keySpline   = s.keySpline   || KEY_SPLINES.LINEAR;
            this.prevWeight  = this.startFactor;

            // position at startFactor
            var startOff = this._getRhombusOffset(_opPrev, this.startFactor, this.radius);
            this.setPos(
                this.coll.pos.x + startOff.x,
                this.coll.pos.y + (this.alongZ ? 0         : startOff.y),
                this.coll.pos.z + (this.alongZ ? startOff.y : 0)
            );
        },

        _updatePos: function () {
            var from = this._getRhombusOffset(_opPrev, this.prevWeight, this.radius);
            this.prevWeight = this.startFactor +
                (this.handle.timer / this.handle.maxTime) * this.moveFactor;
            var to    = this._getRhombusOffset(_opCurr, this.prevWeight, this.radius);
            var delta = Vec2.sub(to, from); // reuses _opCurr
            this.setPos(
                this.coll.pos.x + delta.x,
                this.coll.pos.y + (this.alongZ ? 0       : delta.y),
                this.coll.pos.z + (this.alongZ ? delta.y : 0)
            );
        },

        /**
         * Compute the XY position on the rhombus for a given factor (0–1).
         * The rhombus has half-width = half-height = radius.
         * @param {Vec2} out
         * @param {number} t  position along perimeter (wraps at 1)
         * @param {number} r  radius
         * @returns {Vec2} out
         */
        _getRhombusOffset: function (out, t, r) {
            t = ((t % 1) + 1) % 1; // normalise to [0,1)
            out.x = r * (Math.abs(Math.abs(3 - 4 * t) - 2) - 1);
            out.y = r * (2 * Math.abs(1 - 2 * t) - 1);
            return out;
        },

        update: function () {
            this.parent();
            this._updatePos();
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.RhombusParticle);

    // -- scratch vecs for homing / laser calculation --------------------------
    var _hPos1 = Vec3.create(); // source position
    var _hPos2 = Vec3.create(); // destination position
    var _hMid  = Vec3.create(); // interpolated mid-point
    var _hNorm = Vec2.create(); // normal direction scratch

    // =========================================================================
    // ig.FX_HOMING_FLY_TYPE
    // =========================================================================
    /**
     * Defines trajectory curves for HomingParticle.
     * Each entry is an array of phase objects with `dist(t)` and `normal(t)` functions.
     *
     * FLY_ARC        — simple parabolic arc
     * EXPAND_DASH    — two-phase: expand then dash to target
     * @enum {Array<{dist:function, normal:function}>}
     */
    ig.FX_HOMING_FLY_TYPE = {
        FLY_ARC: [{
            dist:   function (t) { return t; },
            normal: function (t) { return 1 - (2 * t - 1) * (2 * t - 1); }
        }],
        EXPAND_DASH: [
            {
                dist:   function ()  { return 0; },
                normal: function (t) { return KEY_SPLINES.EASE_OUT.get(t); }
            },
            {
                dist:   function (t) { return t; },
                normal: function (t) { return 1 - t; }
            }
        ]
    };

    // =========================================================================
    // ig.ENTITY.HomingParticle
    // =========================================================================
    /**
     * Particle that interpolates between the owner effect's position and its
     * secondary target, following a curve defined by ig.FX_HOMING_FLY_TYPE.
     *
     * Extra spawn settings:
     *   ownerEffect     {ig.ENTITY.Effect}
     *   flyType         {string}  key of ig.FX_HOMING_FLY_TYPE
     *   inverse         {boolean} fly target→source instead of source→target
     *   normalXY        {number}  XY arc bulge in pixels
     *   normalZ         {number}  Z arc bulge in pixels
     *   phaseDurations  {number[]} relative duration of each flyType phase
     *   rotateMoveDir   {sc.HOMING_ROTATE_TYPE}
     *   target1Vary     {number}  random radial spread around source
     *   target2Vary     {number}  random radial spread around destination
     * @extends ig.ENTITY.Particle
     */
    ig.ENTITY.HomingParticle = ig.ENTITY.Particle.extend({
        inverse:        false,
        flyType:        null,
        ownerEffect:    null,
        normalXY:       0,
        normalZ:        0,
        moveTimer:      0,
        phaseDurations: null,
        autoTargetStuck: true, // prevents target-delta movement in Effect.deferredUpdate

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initOffsetParticle(settings);
        },
        _initOffsetParticle: function (s) {
            this.coll.type      = ig.COLLTYPE.NONE;
            this.flyType        = ig.FX_HOMING_FLY_TYPE[s.flyType] || ig.FX_HOMING_FLY_TYPE.FLY_ARC;
            this.inverse        = s.inverse   || false;
            this.ownerEffect    = s.ownerEffect;
            this.normalXY       = s.normalXY;
            this.normalZ        = s.normalZ;
            this.phaseDurations = s.phaseDurations || [];
            this.rotateMoveDir  = s.rotateMoveDir  || false;
            this.autoTargetStuck = true;
            this.moveTimer = 0;

            // optional position scatter
            var seed = Math.random();
            if (s.target1Vary) {
                this.target1Vary = Vec2.createC(0, s.target1Vary * Math.sqrt(Math.random()));
                Vec2.rotate(this.target1Vary, seed * 2 * Math.PI);
            } else { this.target1Vary = null; }
            if (s.target2Vary) {
                this.target2Vary = Vec2.createC(0, s.target2Vary * Math.sqrt(Math.random()));
                Vec2.rotate(this.target2Vary, seed * 2 * Math.PI);
            } else { this.target2Vary = null; }

            this._updatePos(true); // initial placement
        },

        _updatePos: function (isFirst) {
            if (this.moveTimer > this.handle.maxTime) this.moveTimer = this.handle.maxTime;
            var globalT = this.moveTimer / this.handle.maxTime;
            if (globalT > 1) globalT = 1;

            // find which phase we are in
            var phaseIdx = 0, remaining = 1;
            while (phaseIdx < this.flyType.length - 1 &&
                   (this.phaseDurations[phaseIdx] || 0) <= globalT) {
                var phaseDur = this.phaseDurations[phaseIdx] || 0;
                globalT  -= phaseDur;
                remaining -= phaseDur;
                phaseIdx++;
            }
            var phase      = this.flyType[phaseIdx];
            var isLastPhase = phaseIdx === this.flyType.length - 1;
            var phaseT     = globalT / (isLastPhase ? remaining : (this.phaseDurations[phaseIdx] || 0));

            var distWeight   = phase.dist(phaseT);
            var normalWeight = phase.normal(phaseT);

            // source and destination world positions
            var src  = Vec3.assign(_hPos1, this.ownerEffect.coll.pos);
            var dest = this.ownerEffect.getTarget2Pos(_hPos2);
            if (this.target1Vary) Vec2.add(src,  this.target1Vary);
            if (this.target2Vary) Vec2.add(dest, this.target2Vary);

            // interpolate: inverse → src→dest, default → dest→src
            var pos = this.inverse
                ? Vec3.lerp(src, dest, distWeight, _hMid)
                : Vec3.lerp(dest, src, distWeight, _hMid);

            // add normal (arc bulge)
            if (normalWeight && this.normalXY) {
                var perpXY = Vec2.sub(dest, src, _hNorm);
                if (this.normalXY < 0) Vec2.rotate90CCW(perpXY);
                else                  Vec2.rotate90CW(perpXY);
                Vec2.length(perpXY, Math.abs(this.normalXY) * normalWeight);
                Vec2.add(pos, perpXY);
            }
            pos.z += this.normalZ * normalWeight;

            // rotate particle sprite to face movement direction
            if (this.rotateMoveDir) {
                var dir;
                if (isFirst || this.rotateMoveDir === sc.HOMING_ROTATE_TYPE.AT_TARGET) {
                    dir = Vec3.sub(dest, pos, _hPos2);
                } else {
                    dir = Vec3.sub(pos, this.coll.pos, _hPos2);
                }
                dir.y = dir.y - dir.z;
                this.animState.angle = Vec2.clockangle(dir);
            }

            this.setPos(pos.x, pos.y, pos.z);
        },

        update: function () {
            this.parent();
            this.moveTimer += ig.system.tick;
            this._updatePos();
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.HomingParticle);

    // =========================================================================
    // ig.ENTITY.LaserParticle
    // =========================================================================
    /**
     * Renders a tiled, repeating texture laser beam from the owner effect's
     * position to its secondary target position.  The beam sprite is resized
     * and rotated each frame to always match the current distance and direction.
     *
     * Extra spawn settings:
     *   ownerEffect  {ig.ENTITY.Effect}
     *   patternSheet {ig.ImagePatternSheet}  the repeating tile texture
     *   animFrames   {number[]}              frame indices for sheet animation
     *   frameTime    {number}                seconds per frame
     *   shiftSpeed   {number}                pixels/sec the pattern scrolls along beam
     *   offset       {Vec3|null}             positional offset on source end
     *   guiSprites   {boolean}               render as GUI sprite
     *   renderMode   {string|null}           "source-over" | "lighter"
     * @extends ig.Entity
     */
    ig.ENTITY.LaserParticle = ig.Entity.extend({
        handle: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.handle = new ig.ParticleHandle(this);
            this._initLaserParticle(settings);
        },
        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initLaserParticle(settings);
        },
        _initLaserParticle: function (s) {
            this.handle.setData(s);
            this.coll.type         = ig.COLLTYPE.NONE;
            this.coll.setSize(0, 0, 0);
            this.coll.alwaysRender = true;
            this.ownerEffect  = s.ownerEffect;
            this.patternSheet = s.patternSheet;
            this.animFrames   = s.animFrames;
            this.frameTime    = s.frameTime  || 0.1;
            this.shiftSpeed   = s.shiftSpeed || 0;
            this.animTimer    = 0;
            this.offset       = s.offset     || null;
            this.guiSprites   = s.guiSprites || false;
            this.renderMode   = s.renderMode;
        },

        initSprites: function () {
            this.setSpriteCount(1, this.guiSprites);
            this.handle.initSprite(this.sprites[0]);
        },

        update: function () {
            this.handle.onUpdate();
            this.animTimer += ig.system.tick;
            this.parent();
        },

        updateSprites: function () {
            var sprite  = this.sprites[0];
            var srcPos  = Vec3.assign(_hPos1, this.ownerEffect.coll.pos);
            var destPos = this.ownerEffect.getTarget2Pos(_hPos2);
            if (this.offset) Vec3.add(srcPos, this.offset);

            // project destination to screen-space (y - z)
            var screenDest = Vec2.assignC(_hNorm, destPos.x, destPos.y - destPos.z);
            Vec2.subC(screenDest, srcPos.x, srcPos.y - srcPos.z);

            var tileW  = this.patternSheet.patternTileWidth;
            var length = Math.round(Vec2.length(screenDest));

            sprite.setSize(tileW, length, 0, 0);
            sprite.setPos(srcPos.x - tileW / 2, srcPos.y - length, srcPos.z);
            sprite.setPivot(tileW / 2, length);
            if (this.renderMode) sprite.renderMode = this.renderMode;

            var shiftY    = Math.round(-this.shiftSpeed * this.animTimer);
            var frameIdx  = Math.floor(this.animTimer / this.frameTime) % this.animFrames.length;
            var pattern   = this.patternSheet.getPattern(this.animFrames[frameIdx]);
            sprite.setImageSrc(pattern, 0, shiftY);

            this.handle.updateSprite(sprite);
            sprite.rotate      = Vec2.clockangle(screenDest);
            sprite.alwaysRender = true;
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.LaserParticle);

});
