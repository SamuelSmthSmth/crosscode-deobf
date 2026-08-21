/**
 * impact.feature.weather.rain
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.rain")`.
 *
 * Rain / snow / sandstorm rendering:
 *   - `ig.RAIN_STRENGTH` — named presets (drizzle … sandstorm) with pattern,
 *     drift speed, drop timing and ambient sound.
 *   - `ig.RainDropEntity` — a pooled animated splash entity spawned on the
 *     ground (only over ground tiles).
 *   - `ig.Rain` — the `ig.weather.rain` object: spawns moving rain-band
 *     entries (pattern strips) and splash drops, plays the matching ambient
 *     sound, and draws everything additively.
 */
ig.module("impact.feature.weather.rain")
    .requires("impact.base.game", "impact.base.entity-pool")
    .defines(function () {

    ig.RAIN_STRENGTH = {
        NONE: null,
        DRIZZLE: {
            pattern: 0,
            move: { x: 80, y: 320 },
            duration: 0.62,
            wait: 0.25,
            dropsPerSecond: 5,
            fade: 0.3,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        WEAK: {
            pattern: 0,
            move: { x: 80, y: 320 },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 15,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        MEDIUM: {
            pattern: 1,
            move: { x: 80, y: 320 },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 30,
            sound: new ig.Sound("media/sound/background/rain.ogg", 0.7)
        },
        STRONG: {
            pattern: 2,
            move: { x: 80, y: 320 },
            duration: 0.35,
            wait: 0.15,
            dropsPerSecond: 45,
            sound: new ig.Sound("media/sound/background/rain-strong.ogg", 0.7)
        },
        SNOW_WEAK: {
            pattern: 4,
            move: { x: 30, y: 75 },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: null,
            alpha: 0.8,
            fade: 0.1
        },
        SNOW_MEDIUM: {
            pattern: 5,
            move: { x: 30, y: 75 },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: null,
            alpha: 0.8,
            fade: 0.1
        },
        SANDSTORM_WEAK: {
            pattern: 3,
            move: { x: 320, y: 80 },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: new ig.Sound("media/sound/background/desert/sandstorm-ambient.ogg", 0.6),
            fade: 0.2
        },
        SANDSTORM_NERD: {
            pattern: 3,
            move: { x: 256, y: 64 },
            duration: 0.5,
            wait: 0.2,
            dropsPerSecond: 0,
            sound: new ig.Sound("media/sound/background/desert/sandstorm-ambient.ogg", 0.6),
            fade: 0.2
        }
    };

    /** A pooled splash animation entity spawned where a drop hits the ground. */
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initRainDrop();
        },

        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initRainDrop();
        },

        _initRainDrop: function () {
            this.coll.setSize(8, 8, 0);
            this.coll.type = ig.COLLTYPE.NONE;
            this.animState.alpha = 0.6;
            this.initAnimations();
            this.setCurrentAnim("default", true, null, true, true);
        },

        animationEnded: function () {
            this.kill();
        }
    });

    ig.EntityPool.enableFor(ig.RainDropEntity);

    /** Rain-band spawn cursor (advances diagonally across the screen). */
    var spawnCursorX = 0,
        spawnCursorY = 0;

    ig.Rain = ig.Class.extend({
        gfx: new ig.ImagePatternSheet("media/map/rain.png", ig.ImagePattern.OPT.REPEAT_X_AND_Y, 128, 128),
        strength: ig.RAIN_STRENGTH.NONE,
        entries: [],
        timer: 0,
        dropTimer: 0,
        updateSound: 0,
        currentSound: null,
        soundHandle: null,

        init: function () {},

        setRain: function (strength, immediately) {
            if ((this.currentSound && this.currentSound.group) != (strength && strength.sound && strength.sound.group)) {
                this.updateSound = 3;
            }
            this.strength = strength;
            if (immediately) this.entries.length = 0;
        },

        clearRain: function (immediately) {
            this.setRain(ig.RAIN_STRENGTH.NONE, immediately);
            this.updateSound = 3;
        },

        onReset: function () {
            this.updateSound = 0;
            this.soundHandle && this.soundHandle.stop();
            this.currentSound = this.soundHandle = null;
        },

        /** Spawn rain bands/drops to schedule, switch the ambient sound, move bands. */
        update: function () {
            if (sc.options.get("weather")) {
                if (ig.ready && this.updateSound) {
                    this.updateSound--;
                    if (!this.updateSound) {
                        this.soundHandle && this.soundHandle.stop();
                        this.soundHandle = (this.currentSound = this.strength && this.strength.sound) && this.currentSound.play(true);
                    }
                }
                if (this.strength) {
                    for (this.timer = this.timer + ig.system.tick; this.timer > this.strength.wait;) {
                        this.spawnRain();
                        this.timer = this.timer - this.strength.wait;
                    }
                    if (this.strength.dropsPerSecond) {
                        this.dropTimer = this.dropTimer + ig.system.tick;
                        for (var dropInterval = 1 / this.strength.dropsPerSecond; this.dropTimer > dropInterval;) {
                            this.dropTimer = this.dropTimer - dropInterval;
                            this.spawnRainDrop();
                        }
                    }
                }
                this.moveRain();
            } else if (this.currentSound) {
                this.currentSound = null;
                this.soundHandle && this.soundHandle.stop();
                this.updateSound = 1;
            }
        },

        /** Add one rain-band entry at the next cursor position. */
        spawnRain: function () {
            var fraction = Math.random() * 0.75 + 0.25;
            spawnCursorX = spawnCursorX + fraction * 128;
            spawnCursorY = spawnCursorY + (1 - fraction) * 128;
            this.entries.push({
                timer: this.strength.duration,
                maxTime: this.strength.duration,
                pos: { x: spawnCursorX, y: spawnCursorY },
                move: this.strength.move,
                alpha: this.strength.alpha || 0.2,
                fade: this.strength.fade || 0.025,
                pattern: this.strength.pattern
            });
        },

        /** Spawn a splash drop on the ground, searching a random column downward. */
        spawnRainDrop: function () {
            if (ig.perf.weather && sc.options.get("weather")) {
                var attempts = 10;
                do {
                    for (var x = ig.game.screen.x + Math.random() * ig.system.width,
                            y = ig.game.screen.y + Math.random() * ig.system.height,
                            levelIndex = ig.game.maxLevel; levelIndex--;) {
                        var level = ig.game.levels[levelIndex];
                        if (level.collision && level.collision.isTileGround(x, y)) {
                            attempts = level.height;
                            level = level.collision.tilesize;
                            x = x + (-(x % level) + Math.random() * (level - 8));
                            y = y + (-(y % level) + Math.random() * (level - 8));
                            y = y + attempts;
                            ig.game.spawnEntity(ig.RainDropEntity, x, y, attempts, {});
                            return;
                        }
                    }
                    attempts--;
                } while (attempts);
            }
        },

        /** Drift all rain bands; remove expired ones. */
        moveRain: function () {
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i];
                entry.timer = entry.timer - ig.system.tick;
                entry.timer <= 0 ? this.entries.splice(i, 1) : Vec2.addMulF(entry.pos, entry.move, ig.system.tick);
            }
        },

        /** Draw every rain band additively with fade-in/out alpha. */
        draw: function () {
            if (ig.perf.weather && sc.options.get("weather")) {
                var prevAlpha = ig.system.context.globalAlpha;
                ig.system.context.globalCompositeOperation = "lighter";
                for (var i = this.entries.length; i--;) {
                    var entry = this.entries[i],
                        pattern = this.gfx.getPattern(entry.pattern),
                        alpha = 1;
                    entry.timer < entry.fade ? alpha = entry.timer / entry.fade :
                        entry.timer > entry.maxTime - entry.fade && (alpha = (entry.maxTime - entry.timer) / entry.fade);
                    alpha = alpha * entry.alpha;
                    ig.system.context.globalAlpha = prevAlpha * alpha;
                    pattern.draw(0, 0, -entry.pos.x + ig.game.screen.x, -entry.pos.y + ig.game.screen.y, ig.system.width, ig.system.height);
                }
                ig.system.context.globalAlpha = prevAlpha;
                ig.system.context.globalCompositeOperation = "source-over";
            }
        }
    });
});
ig.baked = !0;
