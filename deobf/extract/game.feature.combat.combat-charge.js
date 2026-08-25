ig.module("game.feature.combat.combat-charge").requires("game.feature.combat.model.combat-params", "game.feature.combat.entities.ball").defines(function() {
    var b = [new ig.Sound("media/sound/battle/charge-01-short.mp3", 0.7), new ig.Sound("media/sound/battle/charge-02-short.mp3", 0.7), new ig.Sound("media/sound/battle/charge-03-short.mp3", 0.7), new ig.Sound("media/sound/battle/charge-04.mp3", 0.7)],
        a = [0.4, 0.5, 0.6];
    sc.CombatCharge = ig.Class.extend({
        fx: null,
        darkness: null,
        soundHandle: null,
        init: function(a, b, e, f) {
            this.entity =
                a;
            this.entity.addEntityAttached(this);
            this.stereo = b;
            this.slowmo = e;
            this.camera = f
        },
        charge: function(d, c, e) {
            if (!e) {
                if (!this.darkness) {
                    this.darkness = new ig.DarknessHandle;
                    ig.light.addDarknessHandle(this.darkness)
                }
                this.darkness.setTemporary(this.entity, a[c - 1], -1, 0.05, 0.5);
                this.soundHandle && this.soundHandle.stop();
                this.soundHandle = b[c - 1].play()
            }
            this.fx && this.fx.stop();
            this.fx = sc.combat.showCharge(this.entity, c, d);
            this.fx.setIgnoreSlowdown();
            if (this.slowmo && !this.slowmoHandle) {
                this.slowmoHandle = ig.slowMotion.add(0.1,
                    0.2, null);
                this.entity.coll.time.animStatic = true
            }
            if (this.camera) {
                d = 1 + c * 0.5 / 3;
                if (this.cameraHandle) this.cameraHandle.setZoom(d, 0.5, KEY_SPLINES.JUMPY);
                else {
                    this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this.entity), 0, 0);
                    this.cameraHandle.setZoom(d);
                    ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_OUT)
                }
            }
        },
        stop: function() {
            if (this.darkness) {
                this.darkness.stop();
                this.darkness = null
            }
            if (this.soundHandle) {
                this.soundHandle.stop();
                this.soundHandle = null;
                b[3].play()
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
        onActionEndDetach: function() {
            this.stop()
        },
        onEntityKillDetach: function() {
            this.stop()
        }
    })
});
ig.baked = !0;
