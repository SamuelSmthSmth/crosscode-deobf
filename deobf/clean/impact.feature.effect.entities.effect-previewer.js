/**
 * impact.feature.effect.entities.effect-previewer
 * ================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.effect.entities.effect-previewer")`.
 *
 * Defines:
 *   ig.ENTITY.EffectPreviewer  — editor-only entity used by the effect editor
 *                                to preview effects on a stand-in actor.
 *
 * Communication protocol (ExternalMessage API)
 * -------------------------------------------
 *   EFFECT_PREVIEWER_APPEARANCE  {size, animSheet, zoom, timeFactor}
 *   UPDATE_EFFECT_SHEET          {string path}  — hot-reload an effect sheet
 *   PLAY_EFFECT                  {name, settings}
 *   STOP_EFFECT                  {}
 *   RELOAD_IMAGE                 {}             — clear image cache
 *
 *   (entity sends READY outward when camera is initialised)
 */

ig.module("impact.feature.effect.entities.effect-previewer")
    .requires("impact.base.actor-entity")
    .defines(function () {

    // =========================================================================
    // ig.ENTITY.EffectPreviewer
    // =========================================================================
    ig.ENTITY.EffectPreviewer = ig.ActorEntity.extend({

        // -- state fields -----------------------------------------------------
        cameraHandle:        null,
        currentEffectSheet:  null,  // ig.EffectSheet currently loaded
        newEffectData:       null,  // pending effect sheet path (applied next loop)
        currentEffectHandle: null,  // running ig.ENTITY.Effect instance
        spawnData:           null,  // pending spawn request {name, settings}
        resetTimer:          0,     // countdown to resetEntity() after effect ends

        // -- WorldMap config --------------------------------------------------
        _wm: new ig.Config({
            spawnable: true,
            attributes: {},
            label: function () { return ""; },
            drawBox:  true,
            boxColor: "rgba(255,0,0, 0.5)"
        }),

        // -- lifecycle --------------------------------------------------------

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.setSize(24, 24, 24);
            this.animSheet = new ig.AnimationSheet("player");
            this.initAnimations();
        },

        update: function () {
            // tick down the reset delay
            if (this.resetTimer > 0) {
                this.resetTimer -= ig.system.tick;
                if (this.resetTimer < 0) this.resetEntity();
            }

            // push camera target on first frame
            if (!this.cameraHandle) {
                this.cameraHandle = new ig.Camera.TargetHandle(
                    new ig.Camera.EntityTarget(this), 0, 0
                );
                ig.camera.pushTarget(this.cameraHandle);
                this.cameraHandle.setZoom(2, 0.2);
                ig.game.sendExternalMessage("READY", null);
            }

            // auto-restart effect when it finishes
            if (!this.currentEffectHandle || this.currentEffectHandle.isDone()) {

                if (this.currentEffectHandle) {
                    this.resetTimer         = 1;
                    this.currentEffectHandle = null;
                }

                // load pending effect sheet
                if (this.newEffectData) {
                    if (this.currentEffectSheet) this.currentEffectSheet.decreaseRef();
                    this.currentEffectSheet = null;
                    try {
                        this.currentEffectSheet = new ig.EffectSheet(this.newEffectData);
                        this.newEffectData = null;
                    } catch (err) {
                        console.log("EFFECT SHEET ERROR: ", err);
                    }
                }

                // spawn pending effect
                if (this.spawnData && this.currentEffectSheet) {
                    this.currentEffectHandle = this.currentEffectSheet.spawnOnTarget(
                        this.spawnData.name, this, this.spawnData.settings
                    );
                    this.spawnData = null;
                }
            }

            this.parent();
        },

        // -- helpers ----------------------------------------------------------

        stopCurrentEffect: function () {
            if (this.currentEffectHandle) {
                this.currentEffectHandle.stop();
                this.currentEffectHandle = null;
                this.resetTimer = 1;
            }
        },

        /** Reset visual state of the previewer entity after an effect finishes. */
        resetEntity: function () {
            this.resetTimer          = 0;
            this.animState.alpha     = 1;
            this.animState.angle     = 0;
            this.animState.scaleX    = 1;
            this.animState.scaleY    = 1;
            ig.EntityTools.clearEntitySpriteCut(this);
            ig.EntityTools.clearEntitySpriteOffset(this);
        },

        // -- external message handler -----------------------------------------

        onExternalMessage: function (type, data) {
            switch (type) {
                case "EFFECT_PREVIEWER_APPEARANCE":
                    this.setSize(data.size.x, data.size.y, data.size.z);
                    this.animSheet = new ig.AnimationSheet(data.animSheet);
                    this.animSheet.addLoadListener(this);
                    this.cameraHandle.setZoom(data.zoom || 1, 0.2, KEY_SPLINES.EASE_IN_OUT);
                    ig.system.totalTimeFactor = data.timeFactor || 1;
                    break;

                case "UPDATE_EFFECT_SHEET":
                    this.newEffectData = data;
                    break;

                case "PLAY_EFFECT":
                    this.stopCurrentEffect();
                    this.resetEntity();
                    this.spawnData = data;
                    // wire up a named "target2" entity if the map has one
                    this.spawnData.settings.target2      = ig.game.namedEntities.target2;
                    this.spawnData.settings.target2Align = ig.ENTITY_ALIGN.CENTER;
                    break;

                case "STOP_EFFECT":
                    this.stopCurrentEffect();
                    this.spawnRepeat = false;
                    break;

                case "RELOAD_IMAGE":
                    ig.Image.reloadCache();
                    break;
            }
        },

        onLoadableComplete: function (success, loadable) {
            if (loadable === this.animSheet) {
                // play whichever anim the sheet exposes first
                var firstAnimName;
                for (firstAnimName in this.animSheet.anims) break;
                this.setCurrentAnim(firstAnimName);
                this.animationFixed = true;
            }
        }
    });

});
