/**
 * game.feature.combat.combat-charge
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-charge")`.
 *
 * `sc.CombatCharge`: the ambient charge-up effect attached to a charging
 * combatant — darkness dimming, a per-level charge sound, the charge visual,
 * optional slow-motion and camera zoom. Released (or detached) on `stop`.
 */
ig.module("game.feature.combat.combat-charge")
    .requires("game.feature.combat.model.combat-params", "game.feature.combat.entities.ball")
    .defines(function () {

    var chargeSounds = [
            new ig.Sound("media/sound/battle/charge-01-short.mp3", 0.7),
            new ig.Sound("media/sound/battle/charge-02-short.mp3", 0.7),
            new ig.Sound("media/sound/battle/charge-03-short.mp3", 0.7),
            new ig.Sound("media/sound/battle/charge-04.mp3", 0.7)
        ],
        darknessValues = [0.4, 0.5, 0.6];

    sc.CombatCharge = ig.Class.extend({
        fx: null,
        darkness: null,
        soundHandle: null,

        init: function (entity, stereo, slowmo, camera) {
            this.entity = entity;
            this.entity.addEntityAttached(this);
            this.stereo = stereo;
            this.slowmo = slowmo;
            this.camera = camera
        },

        charge: function (color, level, skipAmbience) {
            if (!skipAmbience) {
                if (!this.darkness) {
                    this.darkness = new ig.DarknessHandle;
                    ig.light.addDarknessHandle(this.darkness)
                }
                this.darkness.setTemporary(this.entity, darknessValues[level - 1], -1, 0.05, 0.5);
                this.soundHandle && this.soundHandle.stop();
                this.soundHandle = chargeSounds[level - 1].play()
            }
            this.fx && this.fx.stop();
            this.fx = sc.combat.showCharge(this.entity, level, color);
            this.fx.setIgnoreSlowdown();
            if (this.slowmo && !this.slowmoHandle) {
                this.slowmoHandle = ig.slowMotion.add(0.1, 0.2, null);
                this.entity.coll.time.animStatic = true
            }
            if (this.camera) {
                var zoom = 1 + level * 0.5 / 3;
                if (this.cameraHandle) this.cameraHandle.setZoom(zoom, 0.5, KEY_SPLINES.JUMPY);
                else {
                    this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this.entity), 0, 0);
                    this.cameraHandle.setZoom(zoom);
                    ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_OUT)
                }
            }
        },

        stop: function () {
            if (this.darkness) {
                this.darkness.stop();
                this.darkness = null
            }
            if (this.soundHandle) {
                this.soundHandle.stop();
                this.soundHandle = null;
                chargeSounds[3].play()
            }
            if (this.fx) {
                this.fx.stop();
                this.fx = null
            }
            if (this.slowmoHandle) {
                this.slowmoHandle.clear(0);
                this.slowmoHandle = null;
                this.entity.coll.time.animStatic = false
            }
            if (this.cameraHandle) {
                ig.camera.removeTarget(this.cameraHandle, "NORMAL", KEY_SPLINES.EASE_OUT);
                this.cameraHandle = null
            }
            this.entity.removeEntityAttached(this)
        },

        onActionEndDetach: function () {
            this.stop()
        },

        onEntityKillDetach: function () {
            this.stop()
        }
    })
});
ig.baked = !0;
