/**
 * impact.feature.effect.fx.fx-light
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-light")`.
 *
 * Defines effect steps that interact with the game's global lighting / darkness system
 * (ig.light) rather than spawning any particle entities.
 *
 * Defines:
 *   ig.EFFECT_ENTRY.LIGHT              — add a dynamic point light to the scene
 *   ig.EFFECT_ENTRY.CLEAR_LIGHT        — remove all light handles attached to the effect entity
 *   ig.EFFECT_ENTRY.DARKNESS           — apply a temporary darkness overlay
 *   ig.EFFECT_ENTRY.CLEAR_DARKNESS     — remove all darkness handles attached to the effect entity
 *   ig.EFFECT_ENTRY.SCREEN_FLASH       — apply a full-screen colour flash
 *   ig.EFFECT_ENTRY.CLEAR_SCREEN_FLASH — remove all screen-flash handles attached to the effect entity
 */

ig.module("impact.feature.effect.fx.fx-light")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // -- type-check predicates used by clearEntityAttached() ------------------
    /** @private */
    function _isLightHandle(attached)       { return attached instanceof ig.LightHandle; }
    /** @private */
    function _isDarknessHandle(attached)    { return attached instanceof ig.DarknessHandle; }
    /** @private */
    function _isScreenFlashHandle(attached) { return attached instanceof ig.ScreenFlashHandle; }

    // =========================================================================
    // ig.EFFECT_ENTRY.LIGHT
    // =========================================================================
    /**
     * Creates a dynamic point-light on the effect entity.
     *
     * The light is automatically attached to the effect entity (via ig.LightHandle)
     * and will fade in / fade out as specified.  It is added to the global
     * ig.light system via ig.light.addLightHandle().
     *
     * Step config fields:
     *   size      {LIGHT_SIZE key}  radius category of the light (default XS)
     *   fadeIn    {number}          seconds to fade light in
     *   fadeOut   {number}          seconds to fade light out
     *   duration  {number}          hold time at full intensity; -1 = forever
     *   maxAlpha  {number}          peak light intensity / alpha (0–1, default 1)
     *   glow      {boolean}         additionally render with "lighter" blending
     *   offset    {Offset}          positional offset for the light (optional)
     */
    ig.EFFECT_ENTRY.LIGHT = ig.EffectStepBase.extend({
        size:     null,
        fadeIn:   0,
        fadeOut:  0,
        duration: 0,
        maxAlpha: 1,
        glow:     undefined,
        offset:   null,

        _wm: new ig.Config({
            attributes: {
                size:     { _type: "String",  _info: "Size of emitting light", _select: ig.LIGHT_SIZE },
                fadeIn:   { _type: "Number",  _info: "Fade in time of light" },
                fadeOut:  { _type: "Number",  _info: "Fade out time of light" },
                duration: { _type: "Number",  _info: "Duration of light source. -1=forever" },
                maxAlpha: { _type: "Number",  _info: "Max alpha intensity of light", _optional: true },
                glow:     { _type: "Boolean", _info: "True if light should additionally glow (lighter rendering addition)" },
                offset:   { _type: "Offset",  _info: "Offset for light position", _optional: true }
            }
        }),

        init: function (sheet, cfg) {
            this.size     = ig.LIGHT_SIZE[cfg.size || "XS"];
            this.fadeIn   = cfg.fadeIn   || 0;
            this.fadeOut  = cfg.fadeOut  || 0;
            this.duration = cfg.duration || 0;
            this.maxAlpha = cfg.maxAlpha || 1;
            this.offset   = cfg.offset   || null;
            this.glow     = cfg.glow;
        },

        getDuration: function () {
            return this.duration >= 0
                ? this.duration + this.fadeIn + this.fadeOut
                : 0; // -1 = forever → no blocking duration
        },

        start: function (effectEntity) {
            var handle = new ig.LightHandle(
                effectEntity,
                this.size,
                this.fadeIn,
                this.fadeOut,
                this.duration,
                this.maxAlpha,
                this.glow
            );
            if (this.offset) handle.setOffset(this.offset.x, this.offset.y, this.offset.z);
            ig.light.addLightHandle(handle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.CLEAR_LIGHT
    // =========================================================================
    /**
     * Removes all ig.LightHandle instances attached to the effect entity
     * (previously added by LIGHT steps).
     */
    ig.EFFECT_ENTRY.CLEAR_LIGHT = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),

        init:        function () {},
        getDuration: function () { return 0; },

        start: function (effectEntity) {
            effectEntity.clearEntityAttached(_isLightHandle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.DARKNESS
    // =========================================================================
    /**
     * Applies a temporary darkness overlay to the scene.
     *
     * Uses ig.DarknessHandle.setTemporary() which registers the handle with
     * the effect entity and fades in/out automatically.
     *
     * Step config fields:
     *   fadeIn    {number}   seconds to fade the darkness in
     *   fadeOut   {number}   seconds to fade the darkness out
     *   duration  {number}   hold time at full intensity; -1 = forever
     *   intensity {number}   darkness intensity (0–1, default 1)
     */
    ig.EFFECT_ENTRY.DARKNESS = ig.EffectStepBase.extend({
        fadeIn:    0,
        fadeOut:   0,
        duration:  0,
        intensity: 1,

        _wm: new ig.Config({
            attributes: {
                fadeIn:    { _type: "Number", _info: "Fade in time of darkness" },
                fadeOut:   { _type: "Number", _info: "Fade out time of darkness" },
                duration:  { _type: "Number", _info: "Duration of darkness. -1=forever" },
                intensity: { _type: "Number", _info: "Intensity of darkness" }
            }
        }),

        init: function (sheet, cfg) {
            this.fadeIn    = cfg.fadeIn    || 0;
            this.fadeOut   = cfg.fadeOut   || 0;
            this.duration  = cfg.duration  || 0;
            this.intensity = cfg.intensity || 1;
        },

        getDuration: function () {
            return this.duration >= 0
                ? this.duration + this.fadeIn + this.fadeOut
                : 0;
        },

        start: function (effectEntity) {
            var handle = new ig.DarknessHandle();
            handle.setTemporary(effectEntity, this.intensity, this.duration, this.fadeIn, this.fadeOut);
            ig.light.addDarknessHandle(handle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.CLEAR_DARKNESS
    // =========================================================================
    /**
     * Removes all ig.DarknessHandle instances attached to the effect entity.
     */
    ig.EFFECT_ENTRY.CLEAR_DARKNESS = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),

        init:        function () {},
        getDuration: function () { return 0; },

        start: function (effectEntity) {
            effectEntity.clearEntityAttached(_isDarknessHandle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.SCREEN_FLASH
    // =========================================================================
    /**
     * Applies a full-screen colour flash via ig.ScreenFlashHandle.
     *
     * Step config fields:
     *   color     {string}   CSS colour string
     *   fadeIn    {number}   seconds to fade the flash in
     *   fadeOut   {number}   seconds to fade the flash out
     *   duration  {number}   hold time at full intensity; -1 = forever
     */
    ig.EFFECT_ENTRY.SCREEN_FLASH = ig.EffectStepBase.extend({
        color:    null,
        fadeIn:   0,
        fadeOut:  0,
        duration: 0,

        _wm: new ig.Config({
            attributes: {
                color:    { _type: "String", _info: "Color of screenflash" },
                fadeIn:   { _type: "Number", _info: "Fade in time of flash" },
                fadeOut:  { _type: "Number", _info: "Fade out time of flash" },
                duration: { _type: "Number", _info: "Duration of flash. -1=forever" }
            }
        }),

        init: function (sheet, cfg) {
            this.color    = cfg.color    || null;
            this.fadeIn   = cfg.fadeIn   || 0;
            this.fadeOut  = cfg.fadeOut  || 0;
            this.duration = cfg.duration || 0;
        },

        getDuration: function () {
            return this.duration >= 0
                ? this.duration + this.fadeIn + this.fadeOut
                : 0;
        },

        start: function (effectEntity) {
            var handle = new ig.ScreenFlashHandle(
                effectEntity,
                this.color,
                this.fadeIn,
                this.fadeOut,
                this.duration
            );
            ig.light.addScreenFlashHandle(handle);
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.CLEAR_SCREEN_FLASH
    // =========================================================================
    /**
     * Removes all ig.ScreenFlashHandle instances attached to the effect entity.
     */
    ig.EFFECT_ENTRY.CLEAR_SCREEN_FLASH = ig.EffectStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),

        init:        function () {},
        getDuration: function () { return 0; },

        start: function (effectEntity) {
            effectEntity.clearEntityAttached(_isScreenFlashHandle);
        }
    });

});
