/**
 * impact.feature.weather.fog
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.fog")`.
 *
 * `ig.Fog` — a shadow provider that covers the screen with a scrolling fog
 * pattern. Supports alpha transitions (over 2 s), a configurable scroll
 * velocity and a zoom factor that keeps the pattern anchored to the map.
 */
ig.module("impact.feature.weather.fog")
    .requires("impact.base.game")
    .defines(function () {

    var mapPosVec = Vec2.create();

    ig.Fog = ig.Class.extend({
        patterns: new ig.ImagePatternSheet("media/map/fog2.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 512, 512, 0, 0, 1, 1),
        vel: Vec2.create(),
        scroll: Vec2.create(),
        alpha: 0,
        prevAlpha: 0,
        timer: 0,
        shadowOrder: 1,
        zoom: 0,

        init: function () {
            this.zoom = 1.4;
        },

        clearFog: function (immediately) {
            this.setFog(0, null, this.zoom, immediately);
        },

        /**
         * @param {number} alpha - target fog opacity
         * @param {Vec2} vel - scroll velocity (null keeps the current one)
         * @param {number} zoom - pattern zoom (anchors to the map)
         * @param {boolean} immediately - skip the 2 s alpha transition
         */
        setFog: function (alpha, vel, zoom, immediately) {
            zoom = zoom || 1.4;
            if (zoom != this.zoom) {
                this.scroll.x = this.scroll.x + ig.game.screen.x * this.zoom - ig.game.screen.x * zoom;
                this.scroll.y = this.scroll.y + ig.game.screen.y * this.zoom - ig.game.screen.y * zoom;
                this.zoom = zoom;
            }
            if (immediately) {
                this.alpha = alpha;
                this.timer = 0;
                alpha == 0 ? ig.light.removeShadowProvider(this) : ig.light.addShadowProvider(this);
            } else if (this.alpha != alpha) {
                this.prevAlpha = this.alpha;
                this.alpha = alpha;
                this.timer = 2;
                alpha > 0 && ig.light.addShadowProvider(this);
            }
            vel && Vec2.assign(this.vel, vel);
        },

        /** Advance the transition timer and scroll offset. */
        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.alpha == 0 && ig.light.removeShadowProvider(this);
                }
            }
            Vec2.addMulF(this.scroll, this.vel, ig.system.tick);
        },

        /** Draw the fog pattern across the whole screen. */
        drawShadows: function () {
            var alpha = this.alpha;
            this.timer > 0 && (alpha = this.alpha + (this.prevAlpha - this.alpha) * (this.timer / 2));
            var prevGlobalAlpha = ig.system.context.globalAlpha;
            ig.system.context.globalAlpha = alpha;
            var pattern = this.patterns.getPattern(0),
                offsetX = 0,
                offsetY = 0,
                drawX = 0,
                drawY = 0;
            if (this.zoom != 1) {
                var mapPos = ig.system.getMapFromScreenPos(mapPosVec, ig.system.width / 2, ig.system.height / 2);
                offsetX = ig.game.screen.x + ig.system.width / 2 - mapPos.x;
                offsetY = ig.game.screen.y + ig.system.height / 2 - mapPos.y;
            }
            drawX = (ig.game.screen.x - offsetX) * this.zoom + offsetX;
            drawY = (ig.game.screen.y - offsetY) * this.zoom + offsetY;
            pattern.draw(0, 0, Math.round(-this.scroll.x + drawX), Math.round(-this.scroll.y + drawY), ig.system.width, ig.system.height);
            ig.system.context.globalAlpha = prevGlobalAlpha;
        }
    });
});
ig.baked = !0;
