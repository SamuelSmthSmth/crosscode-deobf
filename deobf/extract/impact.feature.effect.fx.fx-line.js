ig.module("impact.feature.effect.fx.fx-line").requires("impact.feature.effect.effect-sheet").defines(function() {
    ig.EFFECT_ENTRY.COPY_SPRITE = ig.EffectStepBase.extend({
        particleData: null,
        color: null,
        colorAlpha: 1,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        _wm: new ig.EffectConfig({
            particleType: "CopyParticle",
            attributes: {
                color: {
                    _type: "String",
                    _info: "Color to combine with sprite copy.",
                    _optional: true
                },
                colorAlpha: {
                    _type: "String",
                    _info: "Alpha of pverlay color",
                    _optional: true
                },
                fadeColor: {
                    _type: "String",
                    _info: "Sprite color will fade to this color towards end of display",
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "offset of particle to target",
                    _optional: true
                },
                noLighter: {
                    _type: "Boolean",
                    _info: "If true, don't apply lighter color but regular color overlay"
                }
            }
        }),
        init: function(b, a) {
            this.particleData = ig.EffectConfig.loadParticleData(null, a, b && b.cacheKey);
            this.particleData.particleDuration = this.particleData.particleDuration || 1;
            this.color = a.color || null;
            this.colorAlpha = a.colorAlpha || 1;
            this.fadeColor = a.fadeColor || null;
            this.offset = a.offset || this.offset;
            this.noLighter = a.noLighter ||
                false
        },
        start: function(b) {
            b.spawnParticle(ig.ENTITY.CopyParticle, null, {
                entity: b.target,
                color: this.color,
                fadeColor: this.fadeColor,
                colorAlpha: this.colorAlpha,
                data: this.particleData,
                offset: this.offset,
                spriteFilter: b.spriteFilter,
                noLighter: this.noLighter
            })
        }
    });
    ig.EFFECT_ENTRY.LASER_SPRITE = ig.EffectStepBase.extend({
        particleData: null,
        _wm: new ig.EffectConfig({
            particleType: "LaserParticle",
            attributes: {
                pattern: {
                    _type: "TileSheet",
                    _info: "Pattern to be used for animation. Will be repeated in y direction",
                    _popup: true
                },
                patternYCount: {
                    _type: "Integer",
                    _info: "How many tiles in y dimension",
                    _default: 1
                },
                animFrames: {
                    _type: "AnimFrames",
                    _info: "Frames of sheet animation",
                    _optional: true
                },
                frameTime: {
                    _type: "Number",
                    _info: "Time per frame (in seconds)"
                },
                shiftSpeed: {
                    _type: "Number",
                    _info: "Speed by which gfx will be shifted along laser direction (pixels per second)"
                },
                offset: {
                    _type: "Offset",
                    _info: "offset of particle to target",
                    _optional: true
                },
                guiSprites: {
                    _type: "Boolean",
                    _info: "If true, display laser as gui sprite"
                },
                renderMode: {
                    _type: "String",
                    _info: "Render mode of Sprite",
                    _optional: true,
                    _select: ["source-over", "lighter"],
                    optional: true
                }
            }
        }),
        init: function(b, a) {
            this.particleData = ig.EffectConfig.loadParticleData(null, a, b && b.cacheKey);
            this.particleData.particleDuration = this.particleData.particleDuration || 1;
            this.patternSheet = new ig.ImagePatternSheet(a.pattern.src, ig.ImagePattern.OPT.REPEAT_Y, a.pattern.width, a.pattern.height, a.pattern.offX, a.pattern.offY, a.pattern.xCount || 1, a.patternYCount || 1);
            this.animFrames = a.animFrames || [0];
            this.frameTime = a.frameTime ||
                0.1;
            this.shiftSpeed = a.shiftSpeed || 0;
            this.offset = a.offset || null;
            this.guiSprites = a.guiSprites;
            this.renderMode = a.renderMode
        },
        clearCached: function() {
            this.patternSheet && this.patternSheet.decreaseRef()
        },
        start: function(b) {
            b.spawnParticle(ig.ENTITY.LaserParticle, null, {
                data: this.particleData,
                ownerEffect: b,
                patternSheet: this.patternSheet,
                animFrames: this.animFrames,
                frameTime: this.frameTime,
                shiftSpeed: this.shiftSpeed,
                offset: this.offset,
                guiSprites: this.guiSprites,
                renderMode: this.renderMode
            })
        }
    })
});
ig.baked = !0;
