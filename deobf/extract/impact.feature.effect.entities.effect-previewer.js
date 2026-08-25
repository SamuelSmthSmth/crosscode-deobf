ig.module("impact.feature.effect.entities.effect-previewer").requires("impact.base.actor-entity").defines(function() {
    Vec3.create();
    ig.ENTITY.EffectPreviewer = ig.ActorEntity.extend({
        cameraHandle: null,
        currentEffectSheet: null,
        newEffectData: null,
        currentEffectHandle: null,
        spawnData: null,
        resetTimer: 0,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {},
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,0,0, 0.5)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.setSize(24, 24, 24);
            this.animSheet = new ig.AnimationSheet("player");
            this.initAnimations()
        },
        update: function() {
            if (this.resetTimer > 0) {
                this.resetTimer = this.resetTimer - ig.system.tick;
                this.resetTimer < 0 && this.resetEntity()
            }
            if (!this.cameraHandle) {
                this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this), 0, 0);
                ig.camera.pushTarget(this.cameraHandle);
                this.cameraHandle.setZoom(2, 0.2);
                ig.game.sendExternalMessage("READY", null)
            }
            if (!this.currentEffectHandle || this.currentEffectHandle.isDone()) {
                if (this.currentEffectHandle) {
                    this.resetTimer = 1;
                    this.currentEffectHandle =
                        null
                }
                if (this.newEffectData) {
                    this.currentEffectSheet && this.currentEffectSheet.decreaseRef();
                    this.currentEffectSheet = null;
                    try {
                        this.currentEffectSheet = new ig.EffectSheet(this.newEffectData);
                        this.newEffectData = null
                    } catch (b) {
                        console.log("EFFECT SHEET ERROR: ", b)
                    }
                }
                if (this.spawnData && this.currentEffectSheet) {
                    this.currentEffectHandle = this.currentEffectSheet.spawnOnTarget(this.spawnData.name, this, this.spawnData.settings);
                    this.spawnData = null
                }
            }
            this.parent()
        },
        stopCurrentEffect: function() {
            if (this.currentEffectHandle) {
                this.currentEffectHandle.stop();
                this.currentEffectHandle = null;
                this.resetTimer = 1
            }
        },
        resetEntity: function() {
            this.resetTimer = 0;
            this.animState.alpha = 1;
            this.animState.angle = 0;
            this.animState.scaleX = 1;
            this.animState.scaleY = 1;
            ig.EntityTools.clearEntitySpriteCut(this);
            ig.EntityTools.clearEntitySpriteOffset(this)
        },
        onExternalMessage: function(b, a) {
            if (b == "EFFECT_PREVIEWER_APPEARANCE") {
                this.setSize(a.size.x, a.size.y, a.size.z);
                this.animSheet = new ig.AnimationSheet(a.animSheet);
                this.animSheet.addLoadListener(this);
                this.cameraHandle.setZoom(a.zoom ||
                    1, 0.2, KEY_SPLINES.EASE_IN_OUT);
                ig.system.totalTimeFactor = a.timeFactor || 1
            } else if (b == "UPDATE_EFFECT_SHEET") this.newEffectData = a;
            else if (b == "PLAY_EFFECT") {
                this.stopCurrentEffect();
                this.resetEntity();
                this.spawnData = a;
                this.spawnData.settings.target2 = ig.game.namedEntities.target2;
                this.spawnData.settings.target2Align = ig.ENTITY_ALIGN.CENTER
            } else if (b == "STOP_EFFECT") {
                this.stopCurrentEffect();
                this.spawnRepeat = false
            } else b == "RELOAD_IMAGE" && ig.Image.reloadCache()
        },
        onLoadableComplete: function(b, a) {
            if (a == this.animSheet) {
                for (var d in this.animSheet.anims) break;
                this.setCurrentAnim(d);
                this.animationFixed = true
            }
        }
    })
});
ig.baked = !0;
