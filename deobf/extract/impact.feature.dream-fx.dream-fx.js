ig.module("impact.feature.dream-fx.dream-fx").requires("impact.base.event", "impact.base.game", "impact.feature.gui.gui", "impact.base.utils").defines(function() {
    ig.perf.overlay = true;
    ig.DreamAssets = ig.Class.extend({
        shadowGfx: null,
        sideGfx: null,
        edgeGfx: null,
        dotGfx: null,
        init: function() {
            this.shadowGfx = new ig.Image("media/pics/dream/shadow-circle.png");
            this.sideGfx = new ig.Image("media/pics/dream/side-line.png");
            this.edgeGfx = new ig.Image("media/pics/dream/edge.png");
            this.dotGfx = new ig.Image("media/pics/dream/dot.png")
        },
        clone: function() {
            return new ig.DreamAssets
        },
        clearCached: function() {
            this.shadowGfx.decreaseRef();
            this.sideGfx.decreaseRef();
            this.edgeGfx.decreaseRef();
            this.dotGfx.decreaseRef()
        }
    });
    var b = new ig.RGBColor;
    ig.DreamCircleShadowGui = ig.GuiElementBase.extend({
        assets: null,
        centerColor: {
            old: new ig.RGBColor,
            "new": new ig.RGBColor
        },
        borderColor: {
            old: new ig.RGBColor,
            "new": new ig.RGBColor
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
        init: function() {
            this.parent();
            this.hook.zIndex = -21;
            this.setSize(ig.system.width, ig.system.height)
        },
        setColors: function(a, b, c) {
            this._getCurrentColor(this.centerColor.old, this.centerColor);
            this._getCurrentColor(this.borderColor.old, this.borderColor);
            this.centerColor.new.assign(a);
            this.borderColor.new.assign(b);
            this.colorDuration = c;
            this.colorTimer = 0
        },
        _getCurrentColor: function(a, b) {
            ig.RGBColor.interpolate(b.old,
                b.new, this.colorDuration ? this.colorTimer / this.colorDuration : 1, a);
            return a
        },
        _getCurrentSize: function() {
            var a = this.circleSize.duration ? this.circleSize.timer / this.circleSize.duration : 1;
            a != 1 && (a = KEY_SPLINES.EASE_IN_OUT.get(a));
            return this.circleSize.old * (1 - a) + this.circleSize.new * a
        },
        setCircleSize: function(a, b) {
            this.circleSize.old = this._getCurrentSize();
            this.circleSize.new = a;
            this.circleSize.duration = b;
            this.circleSize.timer = 0
        },
        update: function() {
            if (this.circleSize.duration) {
                this.circleSize.timer = this.circleSize.timer +
                    ig.system.actualTick;
                if (this.circleSize.timer >= this.circleSize.duration) this.circleSize.duration = 0
            }
            this.wobbleTimer = this.wobbleTimer + ig.system.actualTick;
            if (this.colorDuration) {
                this.colorTimer = this.colorTimer + ig.system.actualTick;
                if (this.colorTimer >= this.colorDuration) this.colorDuration = 0
            }
        },
        updateDrawables: function(a) {
            if (this.assets) {
                a.addColor("black", 0, 0, ig.system.width, ig.system.height).setAlpha(0.5);
                var d = this._getCurrentColor(b, this.centerColor).toRGB();
                a.addColor(d, 0, 0, ig.system.width, ig.system.height).setCompositionMode("lighter");
                var d = this._getCurrentSize(),
                    c = this.wobbleTimer * Math.PI * 1,
                    d = d + 0.015 * Math.sin(c);
                if (d = Math.max(0, d)) {
                    a.addTransform().setScale(d, d);
                    var e = this.assets.shadowGfx,
                        f = e.width,
                        g = e.height,
                        h = (ig.system.width / d - f) / 2,
                        i = (ig.system.height / d - g) / 2;
                    a.addGfx(e, h, i, 0, 0, f, g, false, false);
                    a.undoTransform();
                    h = h * d;
                    f = f * d;
                    i = i * d;
                    g = g * d;
                    if (i >= 0) {
                        a.addColor("#161616", 0, 0, Math.ceil(ig.system.width), Math.ceil(i + 2));
                        a.addColor("#161616", 0, Math.floor(i + g - 2), Math.ceil(ig.system.width), Math.ceil(i + 4))
                    }
                    if (h >= 0) {
                        a.addColor("#161616",
                            0, Math.floor(i - 2), Math.ceil(h + 4), Math.ceil(g + 4));
                        a.addColor("#161616", Math.floor(h + f - 2), Math.floor(i - 4), Math.ceil(h + 4), Math.ceil(g + 4))
                    }
                } else a.addColor("#161616", 0, 0, ig.system.width, ig.system.height);
                d = this._getCurrentColor(b, this.borderColor).toRGB();
                a.addColor(d, 0, 0, ig.system.width, ig.system.height).setCompositionMode("lighter");
                c = 0.05 * Math.sin(c * 0.25);
                a.addTransform().setScale(1.1, 1.1).setRotate(c).setPivot(ig.system.width / 2, ig.system.height / 2);
                c = this.assets.edgeGfx;
                d = c.width;
                a.addGfx(c, 0, 0, 0,
                    0, d, this.hook.size.y, false, false).setCompositionMode("lighter");
                a.addGfx(c, this.hook.size.x - d, 0, 0, 0, d, this.hook.size.y, true, false).setCompositionMode("lighter");
                a.undoTransform()
            }
        }
    });
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
        init: function() {
            this.parent();
            this.hook.zIndex = -15
        },
        update: function() {
            this.spawnTimer = this.spawnTimer - ig.system.actualTick;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = this.spawnTimer + 0.15;
                this.spawnParticle()
            }
            for (var a = this.particles.length; a--;) {
                var b = this.particles[a];
                b.timer = b.timer + ig.system.actualTick;
                b.y = b.y + ig.system.actualTick * b.speedY;
                b.timer >= b.duration && this.particles.splice(a, 1)
            }
        },
        updateDrawables: function(a) {
            if (this.assets)
                for (var b = this.assets.sideGfx, c = b.width, e = b.height, f = this.particles.length, g = ig.system.height / 2; f--;) {
                    var h =
                        this.particles[f],
                        i = 1;
                    h.timer < 0.4 ? i = h.timer / 0.4 : h.timer > h.duration - 0.4 && (i = (h.duration - h.timer) / 0.4);
                    var j = (g - (h.y - e / 2)) / g,
                        j = (1 - j * j) * 64;
                    a.addGfx(b, h.right ? ig.system.width - c + j : -j, h.y - e / 2, 0, 0, c, e, h.right, false).setAlpha(i).setCompositionMode("lighter")
                }
        },
        spawnParticle: function() {
            var a = (this.lastRight ? this.rng.left.get() : this.rng.right.get()) * ig.system.height,
                b = (Math.random() - 0.5) * 12,
                a = {
                    duration: 2.5,
                    timer: 0,
                    right: this.lastRight,
                    y: a,
                    speedY: b
                };
            this.lastRight = !this.lastRight;
            this.particles.push(a)
        }
    });
    ig.DreamDotGui =
        ig.GuiElementBase.extend({
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
            init: function() {
                this.parent();
                this.hook.zIndex = -14
            },
            update: function() {
                this.rotate = this.rotate + ig.system.actualTick * 0.02;
                if (this.rotate >= 1) this.rotate = this.rotate - 1;
                this.spawnTimer = this.spawnTimer - ig.system.actualTick;
                if (this.spawnTimer <= 0) {
                    this.spawnTimer = this.spawnTimer +
                        0.15;
                    this.spawnParticle()
                }
                for (var a = this.particles.length; a--;) {
                    var b = this.particles[a];
                    b.timer = b.timer + ig.system.actualTick;
                    b.timer >= b.duration && this.particles.splice(a, 1)
                }
            },
            updateDrawables: function(a) {
                if (this.assets) {
                    var b = this.assets.dotGfx,
                        c = b.width,
                        e = b.height,
                        f = this.particles.length;
                    a.addTransform().setRotate(this.rotate * Math.PI * 2).setPivot(ig.system.width / 2, ig.system.height / 2);
                    for (var g = ig.system.width / 2 - 160, h = ig.system.height / 2 - 160; f--;) {
                        var i = this.particles[f],
                            j = Math.sin(Math.PI * i.timer / i.duration),
                            k = j,
                            l = g + i.x,
                            o = h + i.y,
                            i = i.maxSize / 2 + i.maxSize / 2 * j;
                        a.addTransform().setScale(i, i).setPivot(l, o);
                        a.addGfx(b, l - c / 2, o - e / 2, 0, 0, c, e, false, false).setAlpha(k).setCompositionMode("lighter");
                        a.undoTransform()
                    }
                    a.undoTransform()
                }
            },
            spawnParticle: function() {
                var a = Math.floor(this.rng.get() * 36),
                    b = Math.floor(a / 6),
                    c = 320 / 6,
                    a = (a % 6 + 0.5) * c + (Math.random() - 0.5) * c,
                    b = {
                        duration: 2.5,
                        timer: 0,
                        y: (b + 0.5) * c + (Math.random() - 0.5) * c,
                        x: a,
                        maxSize: 0.5 + Math.random() * 0.5
                    };
                this.particles.push(b)
            }
        });
    ig.OVERLAY_CORNER = {
        WHITE: 0,
        RED: 1,
        BLACK: 2
    };
    ig.DreamFx = ig.GameAddon.extend({
        assets: null,
        circleShadowGui: null,
        sideGui: null,
        dotGui: null,
        init: function() {
            this.parent("Overlay");
            this.circleShadowGui = new ig.DreamCircleShadowGui;
            this.sideGui = new ig.DreamSideGui;
            this.dotGui = new ig.DreamDotGui
        },
        onReset: function() {
            this.clear()
        },
        start: function(a, b) {
            if (!this.assets) {
                this.assets = a.clone();
                this.circleShadowGui.assets = a;
                this.sideGui.assets = a;
                this.dotGui.assets = a;
                ig.gui.addGuiElement(this.circleShadowGui);
                ig.gui.addGuiElement(this.sideGui);
                ig.gui.addGuiElement(this.dotGui);
                sc.model.notifyDreamFxChange();
                if (b) {
                    this.circleShadowGui.doStateTransition("HIDDEN", true);
                    this.circleShadowGui.doStateTransition("DEFAULT");
                    this.sideGui.doStateTransition("HIDDEN", true);
                    this.sideGui.doStateTransition("DEFAULT");
                    this.dotGui.doStateTransition("HIDDEN", true);
                    this.dotGui.doStateTransition("DEFAULT")
                }
            }
        },
        clear: function() {
            if (this.assets) {
                this.assets.clearCached();
                this.assets = null;
                this.circleShadowGui.assets = null;
                this.sideGui.assets = null;
                this.dotGui.assets = null;
                ig.gui.removeGuiElement(this.circleShadowGui);
                ig.gui.removeGuiElement(this.sideGui);
                ig.gui.removeGuiElement(this.dotGui);
                sc.model.notifyDreamFxChange()
            }
        },
        setColors: function(a, b, c) {
            this.circleShadowGui.setColors(a, b, c)
        },
        setCircleSize: function(a, b) {
            this.circleShadowGui.setCircleSize(a, b)
        },
        isActive: function() {
            return !!this.assets
        }
    });
    ig.addGameAddon(function() {
        return ig.dreamFx = new ig.DreamFx
    })
});
ig.baked = !0;
