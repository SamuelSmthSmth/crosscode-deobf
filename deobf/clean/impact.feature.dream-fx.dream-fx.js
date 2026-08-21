/**
 * impact.feature.dream-fx.dream-fx
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.dream-fx.dream-fx")`.
 *
 * The dream-world overlay (`ig.dreamFx`): a shrinking/colored circle shadow
 * in the center, drifting side lines and floating dots, all rendered as GUI
 * elements above the game world.
 */
ig.module("impact.feature.dream-fx.dream-fx")
    .requires("impact.base.event", "impact.base.game", "impact.feature.gui.gui", "impact.base.utils")
    .defines(function () {

    ig.perf.overlay = true;

    /** Loads (and reference-counts) the dream overlay images. */
    ig.DreamAssets = ig.Class.extend({
        shadowGfx: null,
        sideGfx: null,
        edgeGfx: null,
        dotGfx: null,

        init: function () {
            this.shadowGfx = new ig.Image("media/pics/dream/shadow-circle.png");
            this.sideGfx = new ig.Image("media/pics/dream/side-line.png");
            this.edgeGfx = new ig.Image("media/pics/dream/edge.png");
            this.dotGfx = new ig.Image("media/pics/dream/dot.png");
        },

        clone: function () {
            return new ig.DreamAssets();
        },

        clearCached: function () {
            this.shadowGfx.decreaseRef();
            this.sideGfx.decreaseRef();
            this.edgeGfx.decreaseRef();
            this.dotGfx.decreaseRef();
        }
    });

    var scratchColor = new ig.RGBColor();

    /** The central dark circle with a colored glow border, wobbling slightly. */
    ig.DreamCircleShadowGui = ig.GuiElementBase.extend({
        assets: null,
        centerColor: {
            old: new ig.RGBColor(),
            "new": new ig.RGBColor()
        },
        borderColor: {
            old: new ig.RGBColor(),
            "new": new ig.RGBColor()
        },
        colorTimer: 0,
        colorDuration: 0,
        circleSize: {
            old: 1,
            "new": 1,
            timer: 0,
            duration: 0
        },
        wobbleTimer: 0,
        transitions: {
            DEFAULT: {
                state: {},
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        init: function () {
            this.parent();
            this.hook.zIndex = -21;
            this.setSize(ig.system.width, ig.system.height);
        },

        setColors: function (center, border, duration) {
            this._getCurrentColor(this.centerColor.old, this.centerColor);
            this._getCurrentColor(this.borderColor.old, this.borderColor);
            this.centerColor.new.assign(center);
            this.borderColor.new.assign(border);
            this.colorDuration = duration;
            this.colorTimer = 0;
        },

        _getCurrentColor: function (out, color) {
            ig.RGBColor.interpolate(color.old, color.new, this.colorDuration ? this.colorTimer / this.colorDuration : 1, out);
            return out;
        },

        _getCurrentSize: function () {
            var t = this.circleSize.duration ? this.circleSize.timer / this.circleSize.duration : 1;
            t != 1 && (t = KEY_SPLINES.EASE_IN_OUT.get(t));
            return this.circleSize.old * (1 - t) + this.circleSize.new * t;
        },

        setCircleSize: function (size, duration) {
            this.circleSize.old = this._getCurrentSize();
            this.circleSize.new = size;
            this.circleSize.duration = duration;
            this.circleSize.timer = 0;
        },

        update: function () {
            if (this.circleSize.duration) {
                this.circleSize.timer = this.circleSize.timer + ig.system.actualTick;
                if (this.circleSize.timer >= this.circleSize.duration) this.circleSize.duration = 0;
            }
            this.wobbleTimer = this.wobbleTimer + ig.system.actualTick;
            if (this.colorDuration) {
                this.colorTimer = this.colorTimer + ig.system.actualTick;
                if (this.colorTimer >= this.colorDuration) this.colorDuration = 0;
            }
        },

        updateDrawables: function (drawables) {
            if (this.assets) {
                drawables.addColor("black", 0, 0, ig.system.width, ig.system.height).setAlpha(0.5);
                var color = this._getCurrentColor(scratchColor, this.centerColor).toRGB();
                drawables.addColor(color, 0, 0, ig.system.width, ig.system.height).setCompositionMode("lighter");
                var size = this._getCurrentSize(),
                    wobble = this.wobbleTimer * Math.PI * 1,
                    size = size + 0.015 * Math.sin(wobble);
                if (size = Math.max(0, size)) {
                    drawables.addTransform().setScale(size, size);
                    var shadow = this.assets.shadowGfx,
                        w = shadow.width,
                        h = shadow.height,
                        x = (ig.system.width / size - w) / 2,
                        y = (ig.system.height / size - h) / 2;
                    drawables.addGfx(shadow, x, y, 0, 0, w, h, false, false);
                    drawables.undoTransform();
                    x = x * size;
                    w = w * size;
                    y = y * size;
                    h = h * size;
                    if (y >= 0) {
                        drawables.addColor("#161616", 0, 0, Math.ceil(ig.system.width), Math.ceil(y + 2));
                        drawables.addColor("#161616", 0, Math.floor(y + h - 2), Math.ceil(ig.system.width), Math.ceil(y + 4));
                    }
                    if (x >= 0) {
                        drawables.addColor("#161616", 0, Math.floor(y - 2), Math.ceil(x + 4), Math.ceil(h + 4));
                        drawables.addColor("#161616", Math.floor(x + w - 2), Math.floor(y - 4), Math.ceil(x + 4), Math.ceil(h + 4));
                    }
                } else {
                    drawables.addColor("#161616", 0, 0, ig.system.width, ig.system.height);
                }
                var border = this._getCurrentColor(scratchColor, this.borderColor).toRGB();
                drawables.addColor(border, 0, 0, ig.system.width, ig.system.height).setCompositionMode("lighter");
                wobble = 0.05 * Math.sin(wobble * 0.25);
                drawables.addTransform().setScale(1.1, 1.1).setRotate(wobble).setPivot(ig.system.width / 2, ig.system.height / 2);
                var edge = this.assets.edgeGfx,
                    edgeW = edge.width;
                drawables.addGfx(edge, 0, 0, 0, 0, edgeW, this.hook.size.y, false, false).setCompositionMode("lighter");
                drawables.addGfx(edge, this.hook.size.x - edgeW, 0, 0, 0, edgeW, this.hook.size.y, true, false).setCompositionMode("lighter");
                drawables.undoTransform();
            }
        }
    });

    /** Lines drifting along the left/right screen edges. */
    ig.DreamSideGui = ig.GuiElementBase.extend({
        assets: null,
        particles: [],
        spawnTimer: 0,
        lastRight: false,
        rng: {
            left: new ig.UniformRNG(12, true),
            right: new ig.UniformRNG(12, true)
        },
        transitions: {
            DEFAULT: {
                state: {},
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        init: function () {
            this.parent();
            this.hook.zIndex = -15;
        },

        update: function () {
            this.spawnTimer = this.spawnTimer - ig.system.actualTick;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = this.spawnTimer + 0.15;
                this.spawnParticle();
            }
            for (var i = this.particles.length; i--;) {
                var particle = this.particles[i];
                particle.timer = particle.timer + ig.system.actualTick;
                particle.y = particle.y + ig.system.actualTick * particle.speedY;
                particle.timer >= particle.duration && this.particles.splice(i, 1);
            }
        },

        updateDrawables: function (drawables) {
            if (this.assets) {
                for (var side = this.assets.sideGfx, w = side.width, h = side.height, i = this.particles.length, midY = ig.system.height / 2; i--;) {
                    var particle = this.particles[i],
                        alpha = 1;
                    particle.timer < 0.4 ? alpha = particle.timer / 0.4 :
                        particle.timer > particle.duration - 0.4 && (alpha = (particle.duration - particle.timer) / 0.4);
                    var dist = (midY - (particle.y - h / 2)) / midY,
                        dist = (1 - dist * dist) * 64;
                    drawables.addGfx(side, particle.right ? ig.system.width - w + dist : -dist, particle.y - h / 2, 0, 0, w, h, particle.right, false).setAlpha(alpha).setCompositionMode("lighter");
                }
            }
        },

        spawnParticle: function () {
            var y = (this.lastRight ? this.rng.left.get() : this.rng.right.get()) * ig.system.height,
                speedY = (Math.random() - 0.5) * 12,
                particle = {
                    duration: 2.5,
                    timer: 0,
                    right: this.lastRight,
                    y: y,
                    speedY: speedY
                };
            this.lastRight = !this.lastRight;
            this.particles.push(particle);
        }
    });

    /** Dots slowly rotating around the center of the screen. */
    ig.DreamDotGui = ig.GuiElementBase.extend({
        assets: null,
        particles: [],
        spawnTimer: 0,
        rng: new ig.UniformRNG(36, false),
        rotate: 0,
        transitions: {
            DEFAULT: {
                state: {},
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        init: function () {
            this.parent();
            this.hook.zIndex = -14;
        },

        update: function () {
            this.rotate = this.rotate + ig.system.actualTick * 0.02;
            if (this.rotate >= 1) this.rotate = this.rotate - 1;
            this.spawnTimer = this.spawnTimer - ig.system.actualTick;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = this.spawnTimer + 0.15;
                this.spawnParticle();
            }
            for (var i = this.particles.length; i--;) {
                var particle = this.particles[i];
                particle.timer = particle.timer + ig.system.actualTick;
                particle.timer >= particle.duration && this.particles.splice(i, 1);
            }
        },

        updateDrawables: function (drawables) {
            if (this.assets) {
                var dot = this.assets.dotGfx,
                    w = dot.width,
                    h = dot.height,
                    count = this.particles.length;
                drawables.addTransform().setRotate(this.rotate * Math.PI * 2).setPivot(ig.system.width / 2, ig.system.height / 2);
                for (var originX = ig.system.width / 2 - 160, originY = ig.system.height / 2 - 160; count--;) {
                    var particle = this.particles[count],
                        alpha = Math.sin(Math.PI * particle.timer / particle.duration),
                        size = alpha,
                        x = originX + particle.x,
                        y = originY + particle.y,
                        size = particle.maxSize / 2 + particle.maxSize / 2 * alpha;
                    drawables.addTransform().setScale(size, size).setPivot(x, y);
                    drawables.addGfx(dot, x - w / 2, y - h / 2, 0, 0, w, h, false, false).setAlpha(alpha).setCompositionMode("lighter");
                    drawables.undoTransform();
                }
                drawables.undoTransform();
            }
        },

        spawnParticle: function () {
            var index = Math.floor(this.rng.get() * 36),
                row = Math.floor(index / 6),
                cellSize = 320 / 6,
                x = (index % 6 + 0.5) * cellSize + (Math.random() - 0.5) * cellSize,
                particle = {
                    duration: 2.5,
                    timer: 0,
                    y: (row + 0.5) * cellSize + (Math.random() - 0.5) * cellSize,
                    x: x,
                    maxSize: 0.5 + Math.random() * 0.5
                };
            this.particles.push(particle);
        }
    });

    ig.OVERLAY_CORNER = {
        WHITE: 0,
        RED: 1,
        BLACK: 2
    };

    /** The dream overlay add-on (`ig.dreamFx`). */
    ig.DreamFx = ig.GameAddon.extend({
        assets: null,
        circleShadowGui: null,
        sideGui: null,
        dotGui: null,

        init: function () {
            this.parent("Overlay");
            this.circleShadowGui = new ig.DreamCircleShadowGui();
            this.sideGui = new ig.DreamSideGui();
            this.dotGui = new ig.DreamDotGui();
        },

        onReset: function () {
            this.clear();
        },

        start: function (assets, transition) {
            if (!this.assets) {
                this.assets = assets.clone();
                this.circleShadowGui.assets = assets;
                this.sideGui.assets = assets;
                this.dotGui.assets = assets;
                ig.gui.addGuiElement(this.circleShadowGui);
                ig.gui.addGuiElement(this.sideGui);
                ig.gui.addGuiElement(this.dotGui);
                sc.model.notifyDreamFxChange();
                if (transition) {
                    this.circleShadowGui.doStateTransition("HIDDEN", true);
                    this.circleShadowGui.doStateTransition("DEFAULT");
                    this.sideGui.doStateTransition("HIDDEN", true);
                    this.sideGui.doStateTransition("DEFAULT");
                    this.dotGui.doStateTransition("HIDDEN", true);
                    this.dotGui.doStateTransition("DEFAULT");
                }
            }
        },

        clear: function () {
            if (this.assets) {
                this.assets.clearCached();
                this.assets = null;
                this.circleShadowGui.assets = null;
                this.sideGui.assets = null;
                this.dotGui.assets = null;
                ig.gui.removeGuiElement(this.circleShadowGui);
                ig.gui.removeGuiElement(this.sideGui);
                ig.gui.removeGuiElement(this.dotGui);
                sc.model.notifyDreamFxChange();
            }
        },

        setColors: function (center, border, duration) {
            this.circleShadowGui.setColors(center, border, duration);
        },

        setCircleSize: function (size, duration) {
            this.circleShadowGui.setCircleSize(size, duration);
        },

        isActive: function () {
            return !!this.assets;
        }
    });

    ig.addGameAddon(function () {
        return ig.dreamFx = new ig.DreamFx();
    });
});
ig.baked = !0;
