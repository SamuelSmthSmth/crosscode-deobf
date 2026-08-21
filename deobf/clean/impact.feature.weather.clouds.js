/**
 * impact.feature.weather.clouds
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.clouds")`.
 *
 * `ig.Clouds` — a shadow provider that spawns a grid of cloud sprites drifting
 * across the screen at a configurable density, speed and alpha. Clouds fade in
 * when spawned and fade out when cleared; the whole layer is removed as a
 * shadow provider once the last cloud is gone.
 */
ig.module("impact.feature.weather.clouds")
    .requires("impact.base.game")
    .defines(function () {

    ig.Clouds = ig.Class.extend({
        gfx: new ig.Image("media/map/cloud.png"),
        currentClouds: [],
        density: 0,
        vel: Vec2.create(),
        cloudRange: Vec2.create(),
        timer: 0,
        maxTime: 0,
        alpha: 0,
        shadowOrder: 0,

        init: function () {},

        /**
         * Remove all clouds; with `immediately` the shadow provider is
         * unregistered right away, otherwise clouds fade out over 2 s.
         */
        clearClouds: function (immediately) {
            if (immediately) {
                this.currentClouds = [];
                ig.light.removeShadowProvider(this);
            } else {
                for (immediately = this.currentClouds.length; immediately--;) {
                    this.currentClouds[immediately].timer = -2;
                }
            }
            this.density = 0;
        },

        /**
         * Spawn a full screen-filling grid of clouds.
         * @param {number} density - target cloud count
         * @param {Vec2} vel - drift velocity
         * @param {number} alpha - cloud opacity
         * @param {boolean} immediately - skip the fade-in
         */
        setClouds: function (density, vel, alpha, immediately) {
            this.clearClouds(immediately);
            this.density = density;
            Vec2.assign(this.vel, vel);
            this.alpha = alpha || 0.7;
            this.cloudRange.x = Math.floor(this.gfx.width / Math.sqrt(density));
            this.cloudRange.y = Math.floor(this.gfx.height / Math.sqrt(density));
            this.maxTime = (vel = Math.abs(this.vel.x) > Math.abs(this.vel.y)) ?
                this.cloudRange.x / Math.abs(this.vel.x) :
                this.cloudRange.y / Math.abs(this.vel.y);
            density = immediately ? 0 : this.currentClouds.length;
            for (vel = (vel ? Math.ceil(ig.game.size.x / this.cloudRange.x) : Math.ceil(ig.game.size.y / this.cloudRange.y)) + 1; vel--;) {
                alpha = Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y));
                this.moveClouds(
                    this.cloudRange.x * this.vel.x / alpha,
                    this.cloudRange.y * this.vel.y / alpha,
                    density,
                    !immediately
                );
                this.spawnCloudLine(immediately);
            }
            ig.light.addShadowProvider(this);
        },

        /** Spawn one line of clouds across the screen, perpendicular to the drift. */
        spawnCloudLine: function (immediately) {
            var start, sizeX, moveX, sizeY, range, isHorizontal = Math.abs(this.vel.x) > Math.abs(this.vel.y);
            if (isHorizontal) {
                moveX = this.vel.x;
                start = ig.game.size.x;
                sizeX = this.vel.y;
                sizeY = ig.game.size.y;
                range = this.cloudRange.y;
            } else {
                moveX = this.vel.y;
                start = ig.game.size.y;
                sizeX = this.vel.x;
                sizeY = ig.game.size.x;
                range = this.cloudRange.x;
            }
            for (start = -start * Math.abs(sizeX) / Math.abs(moveX); start < sizeY; start = start + range) {
                this.addCloud(isHorizontal ? -this.cloudRange.x : start, isHorizontal ? start : -this.cloudRange.y, immediately);
            }
        },

        /** Add one cloud at `x`, `y` (mirrored when the drift is negative). */
        addCloud: function (x, y, immediately) {
            x = this.vel.x > 0 ? x : ig.game.size.x - x - this.cloudRange.x;
            y = this.vel.y > 0 ? y : ig.game.size.y - y - this.cloudRange.y;
            var cloud = {
                x: 0,
                y: 0,
                flipx: Math.random() > 0.5,
                flipY: Math.random() > 0.5,
                timer: immediately ? 0 : 2
            };
            cloud.x = x + Math.random() * (this.cloudRange.x - this.gfx.width);
            cloud.y = y + Math.random() * (this.cloudRange.y - this.gfx.height);
            this.currentClouds.push(cloud);
        },

        /**
         * Drift clouds by `moveX`/`moveY`; clouds below `minIndex` (fading out
         * after a clear) are left alone. Unless `skipTimers`, advance each
         * cloud's fade timer and cull out-of-bounds clouds.
         */
        moveClouds: function (moveX, moveY, minIndex, skipTimers) {
            for (var i = this.currentClouds.length; i--;) {
                if (minIndex && i < minIndex) break;
                var cloud = this.currentClouds[i];
                cloud.x = cloud.x + moveX;
                cloud.y = cloud.y + moveY;
                if (!skipTimers) {
                    if (cloud.timer > 0) {
                        cloud.timer = cloud.timer - ig.system.tick;
                        if (cloud.timer < 0) cloud.timer = 0;
                    } else if (cloud.timer < 0) {
                        cloud.timer = cloud.timer + ig.system.tick;
                        if (cloud.timer >= 0) {
                            this.currentClouds.splice(i, 1);
                            continue;
                        }
                    }
                }
                if (this.vel.x <= 0 && cloud.x > ig.game.size.x ||
                    this.vel.x <= 0 && cloud.x < this.gfx.width ||
                    this.vel.y >= 0 && cloud.y > ig.game.size.y ||
                    this.vel.y <= 0 && cloud.y < this.gfx.height) {
                    this.currentClouds.splice(i, 1);
                }
            }
            this.currentClouds.length == 0 && ig.light.removeShadowProvider(this);
        },

        /** Drift all clouds; periodically spawn a new line to keep the sky full. */
        update: function () {
            if (this.currentClouds.length != 0) {
                this.moveClouds(this.vel.x * ig.system.tick, this.vel.y * ig.system.tick);
                if (this.density > 0) {
                    this.timer = this.timer + ig.system.tick;
                    if (this.timer >= this.maxTime) {
                        this.spawnCloudLine();
                        this.timer = this.timer - this.maxTime;
                    }
                }
            }
        },

        /** Draw every visible cloud as a shadow (with fade-in/out alpha). */
        drawShadows: function () {
            if (this.currentClouds.length != 0) {
                var prevAlpha = ig.system.context.globalAlpha,
                    alpha = prevAlpha * this.alpha;
                ig.system.context.globalAlpha = alpha;
                for (var i = this.currentClouds.length, screenX = ig.game.screen.x, screenY = ig.game.screen.y, screenWidth = ig.system.width, screenHeight = ig.system.height, gfxWidth = this.gfx.width, gfxHeight = this.gfx.height; i--;) {
                    var cloud = this.currentClouds[i];
                    if (!(cloud.x > screenX + screenWidth || cloud.x + gfxWidth < screenX || cloud.y > screenY + screenHeight || cloud.y + gfxHeight < screenY)) {
                        if (cloud.timer) {
                            ig.system.context.globalAlpha = ig.system.context.globalAlpha * (cloud.timer > 0 ? 1 - cloud.timer / 2 : -cloud.timer / 2);
                        }
                        this.gfx.draw(cloud.x - screenX, cloud.y - screenY, 0, 0, void 0, void 0, cloud.flipX, cloud.flipY);
                        if (cloud.timer) ig.system.context.globalAlpha = alpha;
                    }
                }
                ig.system.context.globalAlpha = prevAlpha;
            }
        }
    });
});
ig.baked = !0;
