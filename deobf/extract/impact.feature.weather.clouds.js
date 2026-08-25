ig.module("impact.feature.weather.clouds").requires("impact.base.game").defines(function() {
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
        init: function() {},
        clearClouds: function(b) {
            if (b) {
                this.currentClouds = [];
                ig.light.removeShadowProvider(this)
            } else
                for (b = this.currentClouds.length; b--;) this.currentClouds[b].timer = -2;
            this.density = 0
        },
        setClouds: function(b, a, d, c) {
            this.clearClouds(c);
            this.density = b;
            Vec2.assign(this.vel, a);
            this.alpha = d || 0.7;
            this.cloudRange.x = Math.floor(this.gfx.width / Math.sqrt(b));
            this.cloudRange.y = Math.floor(this.gfx.height / Math.sqrt(b));
            this.maxTime = (a = Math.abs(this.vel.x) > Math.abs(this.vel.y)) ? this.cloudRange.x / Math.abs(this.vel.x) : this.cloudRange.y / Math.abs(this.vel.y);
            b = c ? 0 : this.currentClouds.length;
            for (a = (a ? Math.ceil(ig.game.size.x / this.cloudRange.x) : Math.ceil(ig.game.size.y / this.cloudRange.y)) + 1; a--;) {
                d = Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y));
                this.moveClouds(this.cloudRange.x * this.vel.x / d, this.cloudRange.y * this.vel.y / d, b, !c);
                this.spawnCloudLine(c)
            }
            ig.light.addShadowProvider(this)
        },
        spawnCloudLine: function(b) {
            var a, d, c, e, f, g = Math.abs(this.vel.x) > Math.abs(this.vel.y);
            if (g) {
                c = this.vel.x;
                a = ig.game.size.x;
                e = this.vel.y;
                d = ig.game.size.y;
                f = this.cloudRange.y
            } else {
                c = this.vel.y;
                a = ig.game.size.y;
                e = this.vel.x;
                d = ig.game.size.x;
                f = this.cloudRange.x
            }
            for (a = -a * Math.abs(e) / Math.abs(c); a < d; a = a + f) this.addCloud(g ? -this.cloudRange.x : a, g ? a : -this.cloudRange.y, b)
        },
        addCloud: function(b, a, d) {
            b = this.vel.x > 0 ? b : ig.game.size.x - b - this.cloudRange.x;
            a = this.vel.y > 0 ? a : ig.game.size.y - a - this.cloudRange.y;
            d = {
                x: 0,
                y: 0,
                flipx: Math.random() > 0.5,
                flipY: Math.random() > 0.5,
                timer: d ? 0 : 2
            };
            d.x = b + Math.random() * (this.cloudRange.x - this.gfx.width);
            d.y = a + Math.random() * (this.cloudRange.y - this.gfx.height);
            this.currentClouds.push(d)
        },
        moveClouds: function(b, a, d, c) {
            for (var e = this.currentClouds.length; e--;) {
                if (d && e < d) break;
                var f = this.currentClouds[e];
                f.x = f.x + b;
                f.y = f.y + a;
                if (!c)
                    if (f.timer > 0) {
                        f.timer =
                            f.timer - ig.system.tick;
                        if (f.timer < 0) f.timer = 0
                    } else if (f.timer < 0) {
                    f.timer = f.timer + ig.system.tick;
                    if (f.timer >= 0) {
                        this.currentClouds.splice(e, 1);
                        continue
                    }
                }(this.vel.x <= 0 && f.x > ig.game.size.x || this.vel.x <= 0 && f.x < this.gfx.width || this.vel.y >= 0 && f.y > ig.game.size.y || this.vel.y <= 0 && f.y < this.gfx.height) && this.currentClouds.splice(e, 1)
            }
            this.currentClouds.length == 0 && ig.light.removeShadowProvider(this)
        },
        update: function() {
            if (this.currentClouds.length != 0) {
                this.moveClouds(this.vel.x * ig.system.tick, this.vel.y * ig.system.tick);
                if (this.density > 0) {
                    this.timer = this.timer + ig.system.tick;
                    if (this.timer >= this.maxTime) {
                        this.spawnCloudLine();
                        this.timer = this.timer - this.maxTime
                    }
                }
            }
        },
        drawShadows: function() {
            if (this.currentClouds.length != 0) {
                var b = ig.system.context.globalAlpha,
                    a = b * this.alpha;
                ig.system.context.globalAlpha = a;
                for (var d = this.currentClouds.length, c = ig.game.screen.x, e = ig.game.screen.y, f = ig.system.width, g = ig.system.height, h = this.gfx.width, i = this.gfx.height; d--;) {
                    var j = this.currentClouds[d];
                    if (!(j.x > c + f || j.x + h < c || j.y > e + g || j.y +
                            i < e)) {
                        if (j.timer) ig.system.context.globalAlpha = ig.system.context.globalAlpha * (j.timer > 0 ? 1 - j.timer / 2 : -j.timer / 2);
                        this.gfx.draw(j.x - c, j.y - e, 0, 0, void 0, void 0, j.flipX, j.flipY);
                        if (j.timer) ig.system.context.globalAlpha = a
                    }
                }
                ig.system.context.globalAlpha = b
            }
        }
    })
});
ig.baked = !0;
