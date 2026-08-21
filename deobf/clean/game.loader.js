/**
 * game.loader
 * ===========
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.loader")`.
 *
 * `sc.StartLoader`: the startup loading screen. Draws a progress bar
 * (with the previously loaded resources shown as a white bar), ticks the
 * timer, and fades out once loading ends.
 */
ig.module("game.loader")
    .requires("impact.base.timer", "impact.base.loader")
    .defines(function () {

    sc.StartLoader = ig.Loader.extend({
        timer: new ig.Timer,
        endTimer: 0,

        draw: function () {
            this._drawStatus = this._drawStatus + (this.status - this._drawStatus) / 5;
            var barWidth = ig.system.width * 0.6,
                barY = ig.system.height * 0.5 - 4,
                barX = ig.system.width * 0.5 - barWidth / 2;
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
            this._drawBar(barX, barY, barWidth, 8, this._drawStatus, this.prevResourcesCnt);
            if (window.IG_GAME_DEBUG) {
                ig.system.context.fillStyle = "#fff";
                ig.system.context.fillText(this.lastPath, ig.system.width / 2 - ig.system.context.measureText(this.lastPath).width / 2, barY + 20)
            }
            ig.Timer.step();
            var delta = this.timer.tick();
            if (this.endTimer > 0) {
                this.endTimer = this.endTimer - delta;
                ig.system.context.fillStyle = "#000";
                ig.system.context.globalAlpha = Math.min(1, 1 - this.endTimer / 0.3);
                ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
                ig.system.context.globalAlpha = 1;
                this.endTimer <= 0 && this.finalize()
            }
        },

        /** Draw a single progress bar (with optional "previously loaded" full bar). */
        _drawBar: function (x, y, width, height, progress, hasPrevResources) {
            var scale = ig.system.scale;
            ig.system.context.fillStyle = "#56607b";
            ig.system.context.fillRect(x * scale, y * scale, width * scale, height * scale);
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(x * scale + scale, y * scale + scale, width * scale - scale - scale, height * scale - scale - scale);
            ig.system.context.fillStyle = "#aaf";
            if (hasPrevResources) {
                ig.system.context.fillRect((x + 2) * scale, (y + 2) * scale, (width - 4) * scale, (height - 4) * scale);
                ig.system.context.fillStyle = "#fff"
            }
            ig.system.context.fillRect((x + 2) * scale, (y + 2) * scale, (width - 4) * scale * progress, (height - 4) * scale)
        },

        onEnd: function () {
            this.gameObjectCreated ? this.endTimer = 0.3 : this.finalize()
        }
    })
});
ig.baked = !0;
