/**
 * impact.feature.effect.fx.fx-line
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.fx.fx-line")`.
 *
 * Defines effect steps that spawn specialised "line-based" particle types:
 *
 *   ig.EFFECT_ENTRY.COPY_SPRITE  — copies the target entity's sprite into a CopyParticle
 *   ig.EFFECT_ENTRY.LASER_SPRITE — spawns a LaserParticle stretched between the
 *                                  effect's two target points
 */

ig.module("impact.feature.effect.fx.fx-line")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

    // =========================================================================
    // ig.EFFECT_ENTRY.COPY_SPRITE
    // =========================================================================
    /**
     * Spawns a CopyParticle that captures the current frame of the target entity's
     * sprite and displays it as an independently-living particle (e.g. for ghost /
     * afterimage effects).
     *
     * Uses a `null` animSheet (no animation frames of its own); the particle reads
     * the sprite from the target entity directly.
     *
     * Step config fields (in addition to particle-state fields):
     *   color        {string}   CSS colour to tint over the copy (optional)
     *   colorAlpha   {number}   alpha of the colour tint (default 1)
     *   fadeColor    {string}   CSS colour that the sprite fades toward at end of life (optional)
     *   offset       {Offset}   positional offset relative to target (optional)
     *   noLighter    {boolean}  use "source-over" blending instead of "lighter"
     */
    ig.EFFECT_ENTRY.COPY_SPRITE = ig.EffectStepBase.extend({
        particleData: null,
        color:        null,
        colorAlpha:   1,
        fadeColor:    null,
        offset:       { x: 0, y: 0, z: 0 },
        noLighter:    false,

        _wm: new ig.EffectConfig({
            particleType: "CopyParticle",
            attributes: {
                color:      { _type: "String",  _info: "Color to combine with sprite copy.", _optional: true },
                colorAlpha: { _type: "String",  _info: "Alpha of overlay color", _optional: true },
                fadeColor:  { _type: "String",  _info: "Sprite color will fade to this color towards end of display", _optional: true },
                offset:     { _type: "Offset",  _info: "Offset of particle to target", _optional: true },
                noLighter:  { _type: "Boolean", _info: "If true, don't apply lighter color but regular color overlay" }
            }
        }),

        init: function (sheet, cfg) {
            // note: animSheet is null — CopyParticle reads the target entity's sprite
            this.particleData = ig.EffectConfig.loadParticleData(null, cfg, sheet && sheet.cacheKey);
            // ensure at least 1 second display time if not specified
            this.particleData.particleDuration = this.particleData.particleDuration || 1;
            this.color      = cfg.color      || null;
            this.colorAlpha = cfg.colorAlpha || 1;
            this.fadeColor  = cfg.fadeColor  || null;
            this.offset     = cfg.offset     || this.offset;
            this.noLighter  = cfg.noLighter  || false;
        },

        start: function (effectEntity) {
            effectEntity.spawnParticle(ig.ENTITY.CopyParticle, null, {
                entity:       effectEntity.target,
                color:        this.color,
                fadeColor:    this.fadeColor,
                colorAlpha:   this.colorAlpha,
                data:         this.particleData,
                offset:       this.offset,
                spriteFilter: effectEntity.spriteFilter,
                noLighter:    this.noLighter
            });
        }
    });

    // =========================================================================
    // ig.EFFECT_ENTRY.LASER_SPRITE
    // =========================================================================
    /**
     * Spawns a LaserParticle — a stretched, scrolling sprite rendered between
     * the effect entity's primary position and its secondary target point.
     *
     * The sprite pattern is defined as a TileSheet that gets tiled along the
     * laser's length in the Y direction.
     *
     * Step config fields (in addition to particle-state fields):
     *   pattern       {TileSheet}      tile image + dimensions for the laser body
     *   patternYCount {number}         number of tiles in the Y dimension (default 1)
     *   animFrames    {number[]}       frame indices for sprite animation (default [0])
     *   frameTime     {number}         seconds per animation frame (default 0.1)
     *   shiftSpeed    {number}         pixels/sec the pattern scrolls along the laser axis
     *   offset        {Offset}         positional offset relative to the effect origin (optional)
     *   guiSprites    {boolean}        render the laser as GUI / overlay sprites
     *   renderMode    {string}         "source-over" or "lighter" (optional)
     */
    ig.EFFECT_ENTRY.LASER_SPRITE = ig.EffectStepBase.extend({
        particleData: null,
        patternSheet: null,
        animFrames:   null,
        frameTime:    0.1,
        shiftSpeed:   0,
        offset:       null,
        guiSprites:   false,
        renderMode:   undefined,

        _wm: new ig.EffectConfig({
            particleType: "LaserParticle",
            attributes: {
                pattern:       { _type: "TileSheet", _info: "Pattern to be used for animation. Will be repeated in y direction", _popup: true },
                patternYCount: { _type: "Integer",   _info: "How many tiles in y dimension", _default: 1 },
                animFrames:    { _type: "AnimFrames", _info: "Frames of sheet animation", _optional: true },
                frameTime:     { _type: "Number",    _info: "Time per frame (in seconds)" },
                shiftSpeed:    { _type: "Number",    _info: "Speed by which gfx will be shifted along laser direction (pixels per second)" },
                offset:        { _type: "Offset",    _info: "Offset of particle to target", _optional: true },
                guiSprites:    { _type: "Boolean",   _info: "If true, display laser as gui sprite" },
                renderMode:    { _type: "String",    _info: "Render mode of Sprite", _optional: true, _select: ["source-over", "lighter"] }
            }
        }),

        init: function (sheet, cfg) {
            this.particleData = ig.EffectConfig.loadParticleData(null, cfg, sheet && sheet.cacheKey);
            this.particleData.particleDuration = this.particleData.particleDuration || 1;

            // build a repeating image pattern from the TileSheet config
            this.patternSheet = new ig.ImagePatternSheet(
                cfg.pattern.src,
                ig.ImagePattern.OPT.REPEAT_Y,
                cfg.pattern.width,
                cfg.pattern.height,
                cfg.pattern.offX,
                cfg.pattern.offY,
                cfg.pattern.xCount  || 1,
                cfg.patternYCount   || 1
            );

            this.animFrames  = cfg.animFrames || [0];
            this.frameTime   = cfg.frameTime  || 0.1;
            this.shiftSpeed  = cfg.shiftSpeed || 0;
            this.offset      = cfg.offset     || null;
            this.guiSprites  = cfg.guiSprites;
            this.renderMode  = cfg.renderMode;
        },

        clearCached: function () {
            if (this.patternSheet) this.patternSheet.decreaseRef();
        },

        start: function (effectEntity) {
            effectEntity.spawnParticle(ig.ENTITY.LaserParticle, null, {
                data:         this.particleData,
                ownerEffect:  effectEntity,
                patternSheet: this.patternSheet,
                animFrames:   this.animFrames,
                frameTime:    this.frameTime,
                shiftSpeed:   this.shiftSpeed,
                offset:       this.offset,
                guiSprites:   this.guiSprites,
                renderMode:   this.renderMode
            });
        }
    });

});
