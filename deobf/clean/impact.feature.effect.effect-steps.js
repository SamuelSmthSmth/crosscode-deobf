/**
 * impact.feature.effect.effect-steps
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.effect-steps")`.
 *
 * Defines the ACTION_STEP and EVENT_STEP entries that hook the effect system
 * into the game's action/event scripting framework.
 *
 * Defines:
 *   ig.FX_FIRST_TARGET_OPTION    — enum of strategies for selecting the primary effect target
 *   ig.FX_SECOND_TARGET_OPTION   — enum of strategies for selecting the secondary effect target
 *
 *   ig.ACTION_STEP.SHOW_EFFECT   — show an effect on the action's entity (or a redirected target)
 *   ig.ACTION_STEP.CLEAR_EFFECTS — stop all (or grouped) effects attached to the action's entity
 *
 *   ig.EVENT_STEP.SHOW_EFFECT    — show an effect on a named-entity from an event
 *   ig.EVENT_STEP.CLEAR_EFFECTS  — stop all (or grouped) effects on a named-entity from an event
 */

ig.module("impact.feature.effect.effect-steps")
    .requires(
        "impact.base.action",
        "impact.base.event",
        "impact.base.entity"
    )
    .defines(function () {

    // -- shared scratch / helpers --------------------------------------------

    /** Scratch Vec3 used in SHOW_EFFECT.start for fixPos spawning. @private */
    var _fixedSpawnPos = Vec3.create();

    /**
     * Callback object placed on ig.Event / ig.ActionStepData.
     * Sets `this.effect = null` when the running effect reaches ENDED.
     * @private
     */
    var _effectDoneCallback = {
        onEffectEvent: function (effectEntity) {
            if (effectEntity.isDone()) this.effect = null;
        }
    };

    // =========================================================================
    // ig.FX_FIRST_TARGET_OPTION
    // =========================================================================
    /**
     * Strategies for mapping the action/event's "owner" entity to a primary
     * effect target.
     *
     * Each value is a function: `(actionOrEventEntity) → ig.Entity`
     *
     * @enum {function}
     */
    ig.FX_FIRST_TARGET_OPTION = {};

    /** Use the action/event's own entity as the effect target. */
    ig.FX_FIRST_TARGET_OPTION.SELF   = function (entity) { return entity; };

    /** Use the action/event's current combat/scripted target. */
    ig.FX_FIRST_TARGET_OPTION.TARGET = function (entity) { return entity.getTarget(); };

    // =========================================================================
    // ig.FX_SECOND_TARGET_OPTION
    // =========================================================================
    /**
     * Strategies for populating the secondary target fields of the spawn opts
     * object (the `opts` passed to ig.EffectHandle.spawnOnTarget).
     *
     * Each value is a function: `(opts, entity, extraKey) → void`
     *
     * @enum {function}
     */
    ig.FX_SECOND_TARGET_OPTION = {};

    /** Use the action/event's own entity as the secondary entity target. */
    ig.FX_SECOND_TARGET_OPTION.SELF = function (opts, entity) {
        opts.target2 = entity;
    };

    /**
     * Read an entity from the action/event entity's attribute map.
     * `extraKey` is the attribute name to look up.
     */
    ig.FX_SECOND_TARGET_OPTION.ATTRIB_ENTITY = function (opts, entity, extraKey) {
        opts.target2 = entity.getAttribute(extraKey);
    };

    /**
     * Read a world-position Vec3 from the action/event entity's attribute map.
     * `extraKey` is the attribute name to look up.
     */
    ig.FX_SECOND_TARGET_OPTION.ATTRIB_POINT = function (opts, entity, extraKey) {
        opts.target2Point = entity.getAttribVec3(extraKey);
    };

    /** Use the action/event entity's current combat/scripted target as target2. */
    ig.FX_SECOND_TARGET_OPTION.TARGET = function (opts, entity) {
        opts.target2 = entity.getTarget();
    };

    // =========================================================================
    // ig.ACTION_STEP.SHOW_EFFECT
    // =========================================================================
    /**
     * Action step: spawn an effect on the action's entity (or redirected target).
     *
     * Config fields
     * -------------
     *   effect          {Effect ref}          effect to play
     *   duration        {number}              0 = one-shot, -1 = forever
     *   offset          {Offset}              positional offset on target
     *   rotOffset       {Vec2}                offset rotated with face direction
     *   target          {FX_FIRST_TARGET_OPTION}  which entity to use (default = SELF)
     *   align           {ENTITY_ALIGN}        alignment on target
     *   rotateFace      {number}              0 = no rotation, n = snap to n dirs, -1 = exact
     *   flipLeftFace    {boolean}             flip horizontally when angle > π
     *   wait            {boolean}             block action until effect finishes
     *   waitSkip        {number}              skip last N seconds of wait
     *   actionDetached  {boolean}             keep effect after action finishes/cancels
     *   group           {string}              tag for CLEAR_EFFECTS
     *   partName        {string}              spawn on a named sub-entity part
     *   target2         {FX_SECOND_TARGET_OPTION}  secondary target strategy
     *   target2Key      {string}              attribute key for ATTRIB_ENTITY/POINT
     *   target2Offset   {Offset}
     *   target2Align    {ENTITY_ALIGN}
     *   noMultiGroup    {boolean}             don't propagate to multi-group parts
     *   fixPos          {boolean}             spawn at fixed world position instead of following
     *   spriteFilter    {number[]}            restrict to sprite indices
     *   ignoreSlowMo    {boolean}             ignore slow-motion time scaling
     *
     * @extends ig.ActionStepBase
     */
    ig.ACTION_STEP.SHOW_EFFECT = ig.ActionStepBase.extend({
        effect:          null,  // ig.EffectHandle
        duration:        0,
        offset:          null,
        rotOffset:       null,
        align:           0,
        rotateFace:      0,
        flipLeftFace:    false,
        wait:            false,
        waitSkip:        0,
        actionDetached:  false,
        group:           null,
        partName:        null,
        target:          null,  // ig.FX_FIRST_TARGET_OPTION value
        target2:         null,  // ig.FX_SECOND_TARGET_OPTION value
        target2Align:    null,
        target2Key:      null,
        target2Offset:   null,
        noMultiGroup:    false,
        fixPos:          false,
        spriteFilter:    null,
        ignoreSlowMo:    false,

        _wm: new ig.Config({
            attributes: {
                effect:         { _type: "Effect",   _info: "Effect to play" },
                duration:       { _type: "Number",   _info: "Amount of time to play animation.<br /> 0 = actual length of animation, -1 = forever until stopped." },
                offset:         { _type: "Offset",   _info: "Offset to entity position" },
                rotOffset:      { _type: "Vec2",     _info: "X and Y offset that is rotated with face direction. Specified is vector for NORTH viewing direction", _optional: true },
                target:         { _type: "String",   _info: "If not defined: use same target", _optional: true, _select: ig.FX_FIRST_TARGET_OPTION },
                align:          { _type: "String",   _info: "Alignment of Animation relative to target", _select: ig.ENTITY_ALIGN },
                rotateFace:     { _type: "Number",   _info: "If number is provided: rotate effect to match entity face, number matching possible face directions. -1 = take precise face rotation" },
                flipLeftFace:   { _type: "Boolean",  _info: "Flip the animation if rotation is negative." },
                wait:           { _type: "Boolean",  _info: "Wait until effect is over" },
                waitSkip:       { _type: "Number",   _info: "The amount of seconds to skip waiting before effect is over" },
                actionDetached: { _type: "Boolean",  _info: "If true, keep Effect even after action is finished or canceled" },
                group:          { _type: "String",   _info: "A string identifying the effect. Optional. Name can be used with CLEAR_EFFECT to clear only certain effects", _optional: true },
                partName:       { _type: "String",   _info: "Entity part on which to show animation", _optional: true },
                target2:        { _type: "String",   _info: "Secondary effect target options.", _optional: true, _select: ig.FX_SECOND_TARGET_OPTION },
                target2Key:     { _type: "String",   _info: "Additional key value to determine second target (e.g. for attribute name)", _optional: true },
                target2Offset:  { _type: "Offset",   _info: "Offset to entity position", _optional: true },
                target2Align:   { _type: "String",   _info: "Alignment of Animation relative to target", _select: ig.ENTITY_ALIGN, _optional: true },
                noMultiGroup:   { _type: "Boolean",  _info: "If true: Do not transfer effect to all parts of the same group.", _optional: true },
                fixPos:         { _type: "Boolean",  _info: "If true: show effect fixed at current entity pos" },
                spriteFilter:   { _type: "Array",    _info: "Only apply filter on list of sprites (by index)", _sub: { _type: "Integer" }, _optional: true },
                ignoreSlowMo:   { _type: "Boolean",  _info: "If true: ignore slow motion for this effect", _optional: true }
            }
        }),

        init: function (cfg) {
            assertContent(cfg, "effect");
            this.effect          = new ig.EffectHandle(cfg.effect);
            this.duration        = cfg.duration        || 0;
            this.offset          = cfg.offset          || 0;
            this.rotOffset       = cfg.rotOffset       || null;
            this.align           = ig.ENTITY_ALIGN[cfg.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.wait            = cfg.wait            || false;
            this.waitSkip        = cfg.waitSkip        || 0;
            this.actionDetached  = cfg.actionDetached  || false;
            this.rotateFace      = cfg.rotateFace      || 0;
            this.flipLeftFace    = cfg.flipLeftFace    || false;
            this.group           = cfg.group           || false;
            this.partName        = cfg.partName        || null;
            this.target          = ig.FX_FIRST_TARGET_OPTION[cfg.target]   || null;
            this.target2         = ig.FX_SECOND_TARGET_OPTION[cfg.target2] || null;
            this.target2Align    = ig.ENTITY_ALIGN[cfg.target2Align]       || ig.ENTITY_ALIGN.BOTTOM;
            this.noMultiGroup    = cfg.noMultiGroup    || false;
            this.target2Offset   = cfg.target2Offset   || null;
            this.target2Key      = cfg.target2Key      || null;
            this.fixPos          = cfg.fixPos          || false;
            this.spriteFilter    = cfg.spriteFilter    || null;
            this.ignoreSlowMo    = cfg.ignoreSlowMo    || false;
        },

        clearCached: function () {
            this.effect.clearCached();
        },

        start: function (actionEntity) {
            var spawnOpts = {
                duration:        this.duration,
                offset:          this.offset,
                rotOffset:       this.rotOffset,
                align:           this.align,
                group:           this.group,
                rotateFace:      this.rotateFace,
                flipLeftFace:    this.flipLeftFace,
                callback:        null,
                target2:         null,
                target2Point:    null,
                target2Align:    this.target2Align,
                target2Offset:   this.target2Offset,
                noMultiGroup:    this.noMultiGroup,
                spriteFilter:    this.spriteFilter
            };

            // populate secondary target
            if (this.target2) this.target2(spawnOpts, actionEntity, this.target2Key);

            // wire up the "wait" callback (stored on stepData so run() can query it)
            if (this.wait) {
                actionEntity.stepData.onEffectEvent = _effectDoneCallback.onEffectEvent;
                spawnOpts.callback = actionEntity.stepData;
            }

            // resolve primary target entity
            var targetEntity = actionEntity;
            if (this.target) targetEntity = this.target(actionEntity) || actionEntity;

            // optionally narrow to a named sub-entity part
            if (this.partName) {
                var subColls = targetEntity.coll.subColls;
                targetEntity = null;
                for (var k = subColls.length; k--;) {
                    if (subColls[k].entity.partName === this.partName) {
                        targetEntity = subColls[k].entity;
                        break;
                    }
                }
            }

            var effectEntity;
            if (this.fixPos) {
                // spawn at a fixed world position (target aligned, not tracked)
                var fixedPos = targetEntity.getAlignedPos(this.align, _fixedSpawnPos);
                if (spawnOpts.offset) Vec3.add(fixedPos, spawnOpts.offset);
                effectEntity = this.effect.spawnFixed(
                    fixedPos.x, fixedPos.y, fixedPos.z, actionEntity, spawnOpts
                );
            } else {
                effectEntity = this.effect.spawnOnTarget(targetEntity, spawnOpts);
            }

            if (effectEntity) {
                // route time-scaling through the original action entity
                effectEntity.setTimeEntity(actionEntity);

                // attach to action (so the effect stops when the action ends)
                if (!this.actionDetached) effectEntity.attachToAction(actionEntity);

                if (this.ignoreSlowMo) effectEntity.setIgnoreSlowdown();

                if (this.wait) actionEntity.stepData.effect = effectEntity;
            }
        },

        /**
         * Called each tick while the action is waiting.
         * @returns {boolean} true when done waiting (effect finished or time skipped)
         */
        run: function (actionEntity) {
            return !this.wait ||
                !actionEntity.stepData.effect ||
                actionEntity.stepData.effect.getRemainingTime() <= this.waitSkip;
        }
    });

    // =========================================================================
    // ig.ACTION_STEP.CLEAR_EFFECTS
    // =========================================================================
    /**
     * Action step: immediately stop and remove effects attached to an entity.
     *
     * Config fields
     * -------------
     *   entity  {FX_SECOND_TARGET_OPTION}  which entity to clear (default = action's entity)
     *   group   {string|null}              if provided, only clear effects with this group tag
     *
     * @extends ig.ActionStepBase
     */
    ig.ACTION_STEP.CLEAR_EFFECTS = ig.ActionStepBase.extend({
        entity: null,
        group:  null,

        _wm: new ig.Config({
            attributes: {
                entity: { _type: "String", _info: "Secondary effect target.", _optional: true, _select: ig.FX_SECOND_TARGET_OPTION },
                group:  { _type: "String", _info: "If provided: only clear effects attached under specified group", _optional: true }
            }
        }),

        init: function (cfg) {
            this.entity = ig.FX_SECOND_TARGET_OPTION[cfg.entity] || null;
            this.group  = cfg.group || null;
        },

        /** @private */
        _matchesEntityAttached: function (attached) {
            return attached instanceof ig.ENTITY.Effect &&
                (!this.group || this.group === attached.attachGroup);
        },

        /** @private */
        _matchesActionAttached: function (attached) {
            return attached instanceof ig.ENTITY.Effect;
        },

        run: function (actionEntity) {
            if (this.entity) {
                // clear effects on a different entity (target2-style lookup)
                var opts = {};
                this.entity(opts, actionEntity);
                opts.target2.clearEntityAttached(this._matchesEntityAttached.bind(this));
            } else if (this.group) {
                // clear only matching group on this entity
                actionEntity.clearEntityAttached(this._matchesEntityAttached.bind(this));
            } else {
                // clear all action-attached effects
                actionEntity.clearActionAttached(this._matchesActionAttached.bind(this));
            }
            return true;
        }
    });

    // =========================================================================
    // ig.EVENT_STEP.SHOW_EFFECT
    // =========================================================================
    /**
     * Event step: spawn an effect on a named entity from a cutscene/event.
     *
     * Config fields
     * -------------
     *   entity          {Entity ref}          entity to apply effect on
     *   effect          {Effect ref}          effect to play
     *   duration        {number}              0 = one-shot, -1 = forever
     *   offset          {Offset}
     *   align           {ENTITY_ALIGN}
     *   group           {string}              tag for CLEAR_EFFECTS
     *   wait            {boolean}             block event until effect finishes
     *   waitSkip        {number}
     *   target2         {Entity ref}          secondary target entity
     *   target2Offset   {Offset}
     *   target2Align    {ENTITY_ALIGN}
     *   ignoreSlowMo    {boolean}
     *
     * @extends ig.EventStepBase
     */
    ig.EVENT_STEP.SHOW_EFFECT = ig.EventStepBase.extend({
        entity:        null,
        effect:        null,
        duration:      0,
        offset:        null,
        group:         null,
        wait:          false,
        waitSkip:      0,
        target2:       null,
        target2Offset: null,
        target2Align:  null,
        ignoreSlowMo:  false,

        _wm: new ig.Config({
            attributes: {
                entity:        { _type: "Entity",  _info: "Entity to apply effect on" },
                effect:        { _type: "Effect",  _info: "Effect to play" },
                duration:      { _type: "Number",  _info: "Amount of time to play animation.<br /> 0 = actual length of animation, -1 = forever until stopped." },
                offset:        { _type: "Offset",  _info: "Offset to entity position" },
                align:         { _type: "String",  _info: "Alignment of Animation relative to target", _select: ig.ENTITY_ALIGN },
                group:         { _type: "String",  _info: "A string identifying the effect. Optional. Name can be used with CLEAR_EFFECT to clear only certain effects" },
                wait:          { _type: "Boolean", _info: "Wait until effect is over" },
                waitSkip:      { _type: "Number",  _info: "The amount of seconds to skip waiting before effect is over" },
                target2:       { _type: "Entity",  _info: "Alternative target for homing particles", _optional: true },
                target2Offset: { _type: "Offset",  _info: "Offset to entity position", _optional: true },
                target2Align:  { _type: "String",  _info: "Alignment of Animation relative to target", _select: ig.ENTITY_ALIGN, _optional: true },
                ignoreSlowMo:  { _type: "Boolean", _info: "If true: ignore slow motion for this effect", _optional: true }
            }
        }),

        init: function (cfg) {
            assertContent(cfg, "effect");
            this.entity        = cfg.entity;
            this.effect        = new ig.EffectHandle(cfg.effect);
            this.duration      = cfg.duration      || 0;
            this.offset        = cfg.offset        || null;
            this.align         = ig.ENTITY_ALIGN[cfg.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.group         = cfg.group         || null;
            this.wait          = cfg.wait          || false;
            this.waitSkip      = cfg.waitSkip      || 0;
            this.target2       = cfg.target2       || null;
            this.target2Align  = ig.ENTITY_ALIGN[cfg.target2Align] || ig.ENTITY_ALIGN.BOTTOM;
            this.target2Offset = cfg.target2Offset || null;
            this.ignoreSlowMo  = cfg.ignoreSlowMo  || false;
        },

        clearCached: function () {
            this.effect.clearCached();
        },

        start: function (eventData, eventContext) {
            var targetEntity = ig.Event.getEntity(this.entity, eventContext);
            var target2Entity = this.target2 ? ig.Event.getEntity(this.target2, eventContext) : null;

            var spawnOpts = {
                duration:      this.duration,
                offset:        this.offset,
                align:         this.align,
                group:         this.group,
                target2:       target2Entity,
                target2Align:  this.target2Align,
                target2Offset: this.target2Offset
            };

            if (this.wait) {
                // set callback on eventData so run() can check it
                spawnOpts.callback = eventData;
                eventData.onEffectEvent = _effectDoneCallback.onEffectEvent;
            }

            eventData.effect = this.effect.spawnOnTarget(targetEntity, spawnOpts);
            if (this.ignoreSlowMo) eventData.effect.setIgnoreSlowdown();
        },

        /**
         * @returns {boolean} true when done waiting
         */
        run: function (eventData) {
            if (!this.wait || !eventData.effect ||
                eventData.effect.getRemainingTime() <= this.waitSkip) {
                eventData.effect = null;
                return true;
            }
            return false;
        }
    });

    // =========================================================================
    // ig.EVENT_STEP.CLEAR_EFFECTS
    // =========================================================================
    /**
     * Event step: stop all (or grouped) effects on a named entity.
     *
     * Config fields
     * -------------
     *   entity  {Entity ref}   entity to clear effects from
     *   group   {string|null}  if provided, only clear effects with this group tag
     *
     * @extends ig.EventStepBase
     */
    ig.EVENT_STEP.CLEAR_EFFECTS = ig.EventStepBase.extend({
        entity: null,
        group:  null,

        _wm: new ig.Config({
            attributes: {
                entity: { _type: "Entity", _info: "Entity to clear effects from" },
                group:  { _type: "String", _info: "if provided: only clear effects attached under specified group", _optional: true }
            }
        }),

        init: function (cfg) {
            this.entity = cfg.entity;
            this.group  = cfg.group || null;
        },

        /** @private */
        _matchesEntityAttached: function (attached) {
            return attached instanceof ig.ENTITY.Effect &&
                (!this.group || this.group === attached.attachGroup);
        },

        start: function (eventData, eventContext) {
            var targetEntity = ig.Event.getEntity(this.entity, eventContext);
            if (targetEntity) {
                targetEntity.clearEntityAttached(this._matchesEntityAttached.bind(this));
            }
        }
    });

});
