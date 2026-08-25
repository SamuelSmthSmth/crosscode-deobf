ig.module("impact.feature.weather.rain").requires("impact.base.game", "impact.base.entity-pool").defines(function() {
    ig.RAIN_STRENGTH = {
        NONE: null,
        DRIZZLE: {
            pattern: 0,
            move: {
                x: 80,
                y: 320
            },
            duration: 0.62,
            wait: 0.25,
            dropsPerSecond: 5,
            fade: 0.3,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        WEAK: {
            pattern: 0,
            move: {
                x: 80,
                y: 320
            },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 15,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        MEDIUM: {
            pattern: 1,
            move: {
                x: 80,
                y: 320
            },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 30,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        STRONG: {
            pattern: 2,
            move: {
                x: 80,
                y: 320
            },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 45,
            sound: new ig.Sound("media/sound/background/rain-strong.ogg", 0.7)
        },
        SNOW_WEAK: {
            pattern: 4,
            move: {
                x: 30,
                y: 75
            },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: null,
            alpha: 0.8,
            fade: 0.1
        },
        SNOW_MEDIUM: {
            pattern: 5,
            move: {
                x: 30,
                y: 75
            },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: null,
            alpha: 0.8,
            fade: 0.1
        },
        SANDSTORM_WEAK: {
            pattern: 3,
            move: {
                x: 320,
                y: 80
            },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: new ig.Sound("media/sound/background/desert/sandstorm-ambient.ogg", 0.6),
            fade: 0.2
        },
        SANDSTORM_NERD: {
            pattern: 3,
            move: {
                x: 256,
                y: 64
            },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: new ig.Sound("media/sound/background/desert/sandstorm-ambient.ogg", 0.6),
            fade: 0.2
        }
    };
    ig.RainDropEntity = ig.AnimatedEntity.extend({
        animSheet: new ig.AnimationSheet({
            sheet: {
                src: "media/map/rain-drop.png",
                width: 8,
                height: 8
            },
            renderMode: "lighter",
            SUB: [{
                name: "default",
                time: 0.05,
                frames: [0, 1, 2, 3],
                repeat: false
            }]
        }),
        init: function(a, b, e, f) {
            this.parent(a,
                b, e, f);
            this._initRainDrop(f)
        },
        reset: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this._initRainDrop(f)
        },
        _initRainDrop: function() {
            this.coll.setSize(8, 8, 0);
            this.coll.type = ig.COLLTYPE.NONE;
            this.animState.alpha = 0.6;
            this.initAnimations();
            this.setCurrentAnim("default", true, null, true, true)
        },
        animationEnded: function() {
            this.kill()
        }
    });
    ig.EntityPool.enableFor(ig.RainDropEntity);
    var b = 0,
        a = 0;
    ig.Rain = ig.Class.extend({
        gfx: new ig.ImagePatternSheet("media/map/rain.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 128, 128),
        strength: ig.RAIN_STRENGTH.NONE,
        entries: [],
        timer: 0,
        dropTimer: 0,
        updateSound: 0,
        currentSound: null,
        soundHandle: null,
        init: function() {},
        setRain: function(a, b) {
            if ((this.currentSound && this.currentSound.group) != (a && a.sound && a.sound.group)) this.updateSound = 3;
            this.strength = a;
            if (b) this.entries.length = 0
        },
        clearRain: function(a) {
            this.setRain(ig.RAIN_STRENGTH.NONE, a);
            this.updateSound = 3
        },
        onReset: function() {
            this.updateSound = 0;
            this.soundHandle && this.soundHandle.stop();
            this.currentSound = this.soundHandle = null
        },
        update: function() {
            if (sc.options.get("weather")) {
                if (ig.ready &&
                    this.updateSound) {
                    this.updateSound--;
                    if (!this.updateSound) {
                        this.soundHandle && this.soundHandle.stop();
                        this.soundHandle = (this.currentSound = this.strength && this.strength.sound) && this.currentSound.play(true)
                    }
                }
                if (this.strength) {
                    for (this.timer = this.timer + ig.system.tick; this.timer > this.strength.wait;) {
                        this.spawnRain();
                        this.timer = this.timer - this.strength.wait
                    }
                    if (this.strength.dropsPerSecond) {
                        this.dropTimer = this.dropTimer + ig.system.tick;
                        for (var a = 1 / this.strength.dropsPerSecond; this.dropTimer > a;) {
                            this.dropTimer =
                                this.dropTimer - a;
                            this.spawnRainDrop()
                        }
                    }
                }
                this.moveRain()
            } else if (this.currentSound) {
                this.currentSound = null;
                this.soundHandle && this.soundHandle.stop();
                this.updateSound = 1
            }
        },
        spawnRain: function() {
            var d = Math.random() * 0.75 + 0.25;
            b = b + d * 128;
            a = a + (1 - d) * 128;
            this.entries.push({
                timer: this.strength.duration,
                maxTime: this.strength.duration,
                pos: {
                    x: b,
                    y: a
                },
                move: this.strength.move,
                alpha: this.strength.alpha || 0.2,
                fade: this.strength.fade || 0.025,
                pattern: this.strength.pattern
            })
        },
        spawnRainDrop: function() {
            if (ig.perf.weather &&
                sc.options.get("weather")) {
                var a = 10;
                do {
                    for (var b = ig.game.screen.x + Math.random() * ig.system.width, e = ig.game.screen.y + Math.random() * ig.system.height, f = ig.game.maxLevel; f--;) {
                        var g = ig.game.levels[f];
                        if (g.collision && g.collision.isTileGround(b, e)) {
                            a = g.height;
                            g = g.collision.tilesize;
                            b = b + (-(b % g) + Math.random() * (g - 8));
                            e = e + (-(e % g) + Math.random() * (g - 8));
                            e = e + a;
                            ig.game.spawnEntity(ig.RainDropEntity, b, e, a, {});
                            return
                        }
                    }
                    a--
                } while (a)
            }
        },
        moveRain: function() {
            for (var a = this.entries.length; a--;) {
                var b = this.entries[a];
                b.timer =
                    b.timer - ig.system.tick;
                b.timer <= 0 ? this.entries.splice(a, 1) : Vec2.addMulF(b.pos, b.move, ig.system.tick)
            }
        },
        draw: function() {
            if (ig.perf.weather && sc.options.get("weather")) {
                var a = ig.system.context.globalAlpha;
                ig.system.context.globalCompositeOperation = "lighter";
                for (var b = this.entries.length; b--;) {
                    var e = this.entries[b],
                        f = this.gfx.getPattern(e.pattern),
                        g = 1;
                    e.timer < e.fade ? g = e.timer / e.fade : e.timer > e.maxTime - e.fade && (g = (e.maxTime - e.timer) / e.fade);
                    g = g * e.alpha;
                    ig.system.context.globalAlpha = a * g;
                    f.draw(0, 0, -e.pos.x +
                        ig.game.screen.x, -e.pos.y + ig.game.screen.y, ig.system.width, ig.system.height)
                }
                ig.system.context.globalAlpha = a;
                ig.system.context.globalCompositeOperation = "source-over"
            }
        }
    })
});
ig.baked = !0;
