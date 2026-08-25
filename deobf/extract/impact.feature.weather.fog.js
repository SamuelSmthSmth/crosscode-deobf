ig.module("impact.feature.weather.fog").requires("impact.base.game").defines(function() {
    var b = Vec2.create();
    ig.Fog = ig.Class.extend({
        patterns: new ig.ImagePatternSheet("media/map/fog2.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 512, 512, 0, 0, 1, 1),
        vel: Vec2.create(),
        scroll: Vec2.create(),
        alpha: 0,
        prevAlpha: 0,
        timer: 0,
        shadowOrder: 1,
        zoom: 0,
        init: function() {
            this.zoom = 1.4
        },
        clearFog: function(a) {
            this.setFog(0, null, this.zoom, a)
        },
        setFog: function(a, b, c, e) {
            c = c || 1.4;
            if (c != this.zoom) {
                this.scroll.x = this.scroll.x + ig.game.screen.x *
                    this.zoom - ig.game.screen.x * c;
                this.scroll.y = this.scroll.y + ig.game.screen.y * this.zoom - ig.game.screen.y * c;
                this.zoom = c
            }
            if (e) {
                this.alpha = a;
                this.timer = 0;
                a == 0 ? ig.light.removeShadowProvider(this) : ig.light.addShadowProvider(this)
            } else if (this.alpha != a) {
                this.prevAlpha = this.alpha;
                this.alpha = a;
                this.timer = 2;
                a > 0 && ig.light.addShadowProvider(this)
            }
            b && Vec2.assign(this.vel, b)
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.alpha == 0 && ig.light.removeShadowProvider(this)
                }
            }
            Vec2.addMulF(this.scroll,
                this.vel, ig.system.tick)
        },
        drawShadows: function() {
            var a = this.alpha;
            this.timer > 0 && (a = this.alpha + (this.prevAlpha - this.alpha) * (this.timer / 2));
            var d = ig.system.context.globalAlpha;
            ig.system.context.globalAlpha = a;
            var a = this.patterns.getPattern(0),
                c = 0,
                e = 0,
                f = 0,
                g = 0;
            if (this.zoom != 1) {
                e = ig.system.getMapFromScreenPos(b, ig.system.width / 2, ig.system.height / 2);
                c = ig.game.screen.x + ig.system.width / 2 - e.x;
                e = ig.game.screen.y + ig.system.height / 2 - e.y
            }
            f = (ig.game.screen.x - c) * this.zoom + c;
            g = (ig.game.screen.y - e) * this.zoom + e;
            a.draw(0,
                0, Math.round(-this.scroll.x + f), Math.round(-this.scroll.y + g), ig.system.width, ig.system.height);
            ig.system.context.globalAlpha = d
        }
    })
});
ig.baked = !0;
