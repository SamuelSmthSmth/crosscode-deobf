ig.module("game.loader").requires("impact.base.timer", "impact.base.loader").defines(function() {
    sc.StartLoader = ig.Loader.extend({
        timer: new ig.Timer,
        endTimer: 0,
        draw: function() {
            this._drawStatus = this._drawStatus + (this.status - this._drawStatus) / 5;
            var b = ig.system.width * 0.6,
                a = ig.system.height * 0.5 - 4,
                d = ig.system.width * 0.5 - b / 2;
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
            this._drawBar(d, a, b, 8, this._drawStatus, this.prevResourcesCnt);
            if (window.IG_GAME_DEBUG) {
                ig.system.context.fillStyle =
                    "#fff";
                ig.system.context.fillText(this.lastPath, ig.system.width / 2 - ig.system.context.measureText(this.lastPath).width / 2, a + 20)
            }
            ig.Timer.step();
            b = this.timer.tick();
            if (this.endTimer > 0) {
                this.endTimer = this.endTimer - b;
                ig.system.context.fillStyle = "#000";
                ig.system.context.globalAlpha = Math.min(1, 1 - this.endTimer / 0.3);
                ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
                ig.system.context.globalAlpha = 1;
                this.endTimer <= 0 && this.finalize()
            }
        },
        _drawBar: function(b, a, d, c, e, f) {
            var g = ig.system.scale;
            ig.system.context.fillStyle = "#56607b";
            ig.system.context.fillRect(b * g, a * g, d * g, c * g);
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(b * g + g, a * g + g, d * g - g - g, c * g - g - g);
            ig.system.context.fillStyle = "#aaf";
            if (f) {
                ig.system.context.fillRect((b + 2) * g, (a + 2) * g, (d - 4) * g, (c - 4) * g);
                ig.system.context.fillStyle = "#fff"
            }
            ig.system.context.fillRect((b + 2) * g, (a + 2) * g, (d - 4) * g * e, (c - 4) * g)
        },
        onEnd: function() {
            this.gameObjectCreated ? this.endTimer = 0.3 : this.finalize()
        }
    })
});
ig.baked = !0;
