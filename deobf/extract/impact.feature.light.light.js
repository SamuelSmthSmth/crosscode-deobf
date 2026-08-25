ig.module("impact.feature.light.light").requires("impact.base.game", "game.config").defines(function() {
    ig.LIGHT_SIZE = {
        XXXXL: 1,
        XXXL: 2,
        XXL: 3,
        XL: 4,
        L: 5,
        M: 6,
        S: 7,
        XS: 8,
        NONE: 9
    };
    var b = {};
    b[ig.LIGHT_SIZE.XXXXL] = {
        x: 0,
        y: 0,
        w: 384,
        h: 384
    };
    b[ig.LIGHT_SIZE.XXXL] = {
        x: 384,
        y: 0,
        w: 256,
        h: 256
    };
    b[ig.LIGHT_SIZE.XXL] = {
        x: 448,
        y: 256,
        w: 192,
        h: 192
    };
    b[ig.LIGHT_SIZE.XL] = {
        x: 0,
        y: 384,
        w: 128,
        h: 128
    };
    b[ig.LIGHT_SIZE.L] = {
        x: 128,
        y: 448,
        w: 64,
        h: 64
    };
    b[ig.LIGHT_SIZE.M] = {
        x: 192,
        y: 464,
        w: 48,
        h: 48
    };
    b[ig.LIGHT_SIZE.S] = {
        x: 240,
        y: 480,
        w: 32,
        h: 32
    };
    b[ig.LIGHT_SIZE.XS] = {
        x: 272,
        y: 480,
        w: 32,
        h: 32
    };
    b[ig.LIGHT_SIZE.NONE] = {
        x: 272,
        y: 480,
        w: 32,
        h: 32
    };
    ig.LIGHT_METRIC = b;
    Vec3.create();
    ig.perf.lighting = true;
    ig.LightHandle = ig.Class.extend({
        targetEntity: null,
        lastPos: Vec3.create(),
        size: null,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        maxAlpha: 0,
        glow: true,
        timer: 0,
        offset: null,
        init: function(a, b, c, e, f, g, h) {
            this.targetEntity = a;
            this.targetEntity.addEntityAttached(this);
            this.size = b || ig.LIGHT_SIZE.XS;
            this.fadeIn = c || 0;
            this.fadeOut = e || 0;
            this.duration = f || 0;
            this.maxAlpha = g || 1;
            this.glow = h !== void 0 ? h : true;
            this.timer =
                this.fadeIn || this.duration || this.fadeOut
        },
        setOffset: function(a, b, c) {
            if (!this.offset) this.offset = Vec3.create();
            Vec3.assignC(this.offset, a, b, c)
        },
        onActionEndDetach: function() {
            this.stop()
        },
        onEntityKillDetach: function() {
            (this.fadeIn || this.duration) && this.stop();
            this.targetEntity && this.targetEntity.removeEntityAttached(this);
            this.targetEntity = null
        },
        stop: function() {
            this.timer = this.fadeOut;
            this.duration = this.fadeIn = 0
        },
        update: function() {
            var a = this.targetEntity ? this.targetEntity.coll.getTick(true) : ig.system.tick;
            this.timer = this.timer - a;
            if (this.timer <= 0)
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut
                } else if (this.duration) {
                if (this.duration > 0) {
                    this.duration = 0;
                    this.timer = this.fadeOut
                }
            } else {
                this.fadeOut = 0;
                this.targetEntity && this.targetEntity.removeEntityAttached(this);
                return true
            }
            return false
        },
        draw: function(a, d) {
            a = a || 1;
            d = d || 0;
            this.targetEntity && this.targetEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, this.lastPos);
            var c = this.lastPos,
                e = c.x - ig.game.screen.x,
                c = c.y - c.z - ig.game.screen.y;
            if (this.offset) {
                e =
                    e + this.offset.x;
                c = c + (this.offset.y - this.offset.z)
            }
            var f = b[this.size + d];
            if (f) {
                var g = f.x,
                    h = f.y,
                    i = f.w,
                    f = f.h;
                if (!(e + i / 2 < 0 || c + f / 2 < 0 || e - i / 2 > ig.system.width || c - f / 2 > ig.system.height)) {
                    var j = 0;
                    this.fadeIn ? j = this.maxAlpha * (1 - this.timer / this.fadeIn) : this.duration ? j = this.maxAlpha : this.fadeOut && (j = this.maxAlpha * (this.timer / this.fadeOut));
                    ig.system.context.globalAlpha = j * a;
                    ig.light.lightmapGfx.draw(e - i / 2, c - f / 2, g, h, i, f)
                }
            }
        }
    });
    ig.DarknessHandle = ig.Class.extend({
        useActualTick: false,
        timer: 0,
        temporary: false,
        entity: null,
        duration: 0,
        fadeIn: 0,
        fadeOut: 0,
        oldIntensity: 0,
        targetIntensity: 0,
        init: function(a) {
            this.useActualTick = a || false
        },
        setIntensity: function(a, b) {
            this.oldIntensity = this.getIntensity();
            this.targetIntensity = a;
            this.timer = this.duration = b;
            this.temporary = false
        },
        setTemporary: function(a, b, c, e, f) {
            this.oldIntensity = this.getIntensity();
            this.targetIntensity = b;
            this.temporary = true;
            (this.entity = a) && this.entity.addEntityAttached(this);
            this.duration = c || 0;
            this.fadeIn = e || 0;
            this.fadeOut = f || 0;
            this.timer = this.fadeIn || this.duration ||
                this.fadeOut
        },
        onActionEndDetach: function() {
            this.stop()
        },
        onEntityKillDetach: function() {
            this.temporary && (this.fadeIn || this.duration) && this.stop();
            this.entity && this.entity.removeEntityAttached(this);
            this.entity = null
        },
        stop: function() {
            this.oldIntensity = this.getIntensity();
            this.timer = this.fadeOut;
            this.targetIntensity = this.duration = this.fadeIn = 0
        },
        update: function() {
            this.timer = this.useActualTick ? this.timer - ig.system.actualTick : this.timer - (this.entity ? this.entity.coll.getTick(true) : ig.system.tick);
            if (this.timer <=
                0 && this.temporary)
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut
                } else if (this.duration) {
                if (this.duration > 0) {
                    this.oldIntensity = this.getIntensity();
                    this.duration = 0;
                    this.timer = this.fadeOut;
                    this.targetIntensity = 0
                }
            } else {
                this.fadeOut = 0;
                this.entity && this.entity.removeEntityAttached(this);
                return true
            }
            return false
        },
        getIntensity: function() {
            return this.oldIntensity + (this.targetIntensity - this.oldIntensity) * (this.temporary ? this.fadeIn ? 1 - this.timer / this.fadeIn : this.duration ? 1 : 1 - this.timer /
                this.fadeOut : this.timer > 0 ? 1 - this.timer / this.duration : 1)
        }
    });
    ig.ScreenFlashHandle = ig.Class.extend({
        targetEntity: null,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        color: null,
        timer: 0,
        init: function(a, b, c, e, f) {
            this.targetEntity = a;
            this.targetEntity.addEntityAttached(this);
            this.color = b || "white";
            this.fadeIn = c || 0;
            this.fadeOut = e || 0;
            this.duration = f || 0;
            this.timer = this.fadeIn || this.duration || this.fadeOut
        },
        onActionEndDetach: function() {
            this.stop()
        },
        onEntityKillDetach: function() {
            (this.fadeIn || this.duration) && this.stop();
            this.targetEntity &&
                this.targetEntity.removeEntityAttached(this);
            this.targetEntity = null
        },
        stop: function() {
            this.timer = this.fadeOut;
            this.duration = this.fadeIn = 0
        },
        update: function() {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0)
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut
                } else if (this.duration) {
                if (this.duration > 0) {
                    this.duration = 0;
                    this.timer = this.fadeOut
                }
            } else {
                this.fadeOut = 0;
                this.targetEntity && this.targetEntity.removeEntityAttached(this);
                return true
            }
            return false
        },
        draw: function() {
            var a =
                0;
            this.fadeIn ? a = 1 - this.timer / this.fadeIn : this.duration ? a = 1 : this.fadeOut && (a = this.timer / this.fadeOut);
            ig.system.context.globalAlpha = a;
            ig.system.context.fillStyle = this.color;
            ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height)
        }
    });
    ig.GlowColor = ig.Cacheable.extend({
        cacheType: "GLOW_COLOR",
        canvas: null,
        gfx: null,
        init: function(a) {
            this.parent(a);
            var b = ig.$new("canvas"),
                c = ig.light.lightmapGfx;
            b.width = c.width * ig.system.scale;
            b.height = c.height * ig.system.scale;
            var e = ig.system.getBufferContext(b);
            e.globalCompositeOperation =
                "source-over";
            e.fillStyle = a;
            e.fillRect(0, 0, b.width, b.height);
            e.globalCompositeOperation = "destination-in";
            e.drawImage(c.data, 0, 0);
            this.canvas = b;
            this.gfx = new ig.ImageCanvasWrapper(b)
        },
        getCacheKey: function(a) {
            return a
        },
        onCacheCleared: function() {
            this.canvas.width = this.canvas.height = 0;
            this.gfx = this.canvas = null
        }
    });
    ig.CondLights = ig.Class.extend({
        condition: null,
        lights: [],
        hasLight: false,
        hasGlow: false,
        isOn: false,
        timer: 0,
        init: function(a) {
            this.condition = a;
            this.isOn = this.condition.evaluate()
        },
        addLight: function(a,
            b, c, e) {
            if (c && !e) e = ig.light.mainGlowColor;
            this.lights.push({
                pos: a,
                lightSize: b,
                glowSize: c,
                glowColor: e
            });
            if (c) this.hasGlow = true;
            if (b) this.hasLight = true
        },
        update: function() {
            var a = this.condition.evaluate();
            if (a != this.isOn) {
                this.isOn = a;
                this.timer = 0.2 - this.timer
            }
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) this.timer = 0
            }
        },
        getAlpha: function() {
            var a = this.timer / 0.2;
            return this.isOn ? 1 - a : a
        },
        drawGlow: function() {
            this.hasGlow && this._draw(true)
        },
        drawLight: function() {
            this.hasLight && this._draw(false)
        },
        _draw: function(a) {
            var d = this.getAlpha();
            if (d) {
                var c = ig.system.context.globalAlpha;
                ig.system.context.globalAlpha = d;
                for (d = this.lights.length; d--;) {
                    var e = this.lights[d],
                        f = e.pos.x - ig.game.screen.x,
                        g = e.pos.y - ig.game.screen.y,
                        h = a ? e.glowSize : e.lightSize;
                    if (h) {
                        var i = b[h];
                        if (i) {
                            var h = i.x,
                                j = i.y,
                                k = i.w,
                                i = i.h;
                            f + k / 2 < 0 || (g + i / 2 < 0 || f - k / 2 > ig.system.width || g - i / 2 > ig.system.height) || (a ? e.glowColor.gfx : ig.light.lightmapGfx).draw(f - k / 2, g - i / 2, h, j, k, i)
                        }
                    }
                }
                ig.system.context.globalAlpha = c
            }
        }
    });
    ig.Light = ig.GameAddon.extend({
        lightCanvas: null,
        lightContext: null,
        shadowProviders: [],
        lightHandles: [],
        darknessHandles: [],
        screenFlashHandles: [],
        hasShadow: false,
        lightMapDarkness: 0.6,
        lightMapBrightness: 1,
        lightmapGfx: new ig.Image("media/map/lightmap.png"),
        mainGlowColor: false,
        condLights: {},
        condLightList: [],
        init: function() {
            this.parent("Light");
            this.lightCanvas = ig.$new("canvas");
            this.lightCanvas.width = ig.system.contextWidth + 1;
            this.lightCanvas.height = ig.system.contextHeight + 1;
            this.lightContext = ig.system.getBufferContext(this.lightCanvas)
        },
        setMainGlowColor: function(a) {
            this.mainGlowColor &&
                this.mainGlowColor.decreaseRef();
            this.mainGlowColor = null;
            if (a) this.mainGlowColor = new ig.GlowColor(a)
        },
        getMainGlowGfx: function() {
            return this.mainGlowColor && this.mainGlowColor.gfx
        },
        addDarknessHandle: function(a) {
            this.darknessHandles.push(a)
        },
        removeDarknessHandle: function(a) {
            this.darknessHandles.erase(a)
        },
        addScreenFlashHandle: function(a) {
            this.screenFlashHandles.push(a)
        },
        removeScreenFlashHandle: function(a) {
            this.screenFlashHandles.erase(a)
        },
        addCondLight: function(a, b, c, e, f) {
            var g = a.toString(),
                h = this.condLights[g];
            if (!h) {
                h = new ig.CondLights(a);
                this.condLightList.push(h);
                this.condLights[g] = h
            }
            h.addLight(b, c, e, f)
        },
        addLightHandle: function(a) {
            this.lightHandles.push(a)
        },
        addShadowProvider: function(a) {
            if (this.shadowProviders.indexOf(a) == -1) {
                this.shadowProviders.push(a);
                this.shadowProviders.sort(function(a, b) {
                    return a.shadowOrder - b.shadowOrder
                })
            }
        },
        removeShadowProvider: function(a) {
            this.shadowProviders.erase(a)
        },
        levelLoadStartOrder: 0,
        onLevelLoadStart: function() {
            this.condLightList.length = 0;
            this.condLights = {}
        },
        onDeferredUpdate: function() {
            for (var a =
                    this.lightHandles.length; a--;) this.lightHandles[a].update() && this.lightHandles.splice(a, 1);
            for (a = this.darknessHandles.length; a--;) this.darknessHandles[a].update() && this.darknessHandles.splice(a, 1);
            for (a = this.screenFlashHandles.length; a--;) this.screenFlashHandles[a].update() && this.screenFlashHandles.splice(a, 1);
            for (a = this.condLightList.length; a--;) this.condLightList[a].update()
        },
        preDrawOrder: 0,
        onPreDraw: function() {
            this.hasShadow = false;
            if (ig.perf.lighting && sc.options.get("lighting")) {
                for (var a = 1, b =
                        this.darknessHandles.length; b--;) a = Math.min(a, 1 - this.darknessHandles[b].getIntensity());
                if (ig.game.hasLightLayer() || !(this.shadowProviders.length == 0 && a == 1)) {
                    if (ig.system.zoom != 1) ig.system.smoothPositioning = false;
                    var c = ig.system.context;
                    ig.system.context = this.lightContext;
                    this.lightContext.globalAlpha = 1;
                    ig.system.context.globalCompositeOperation = "source-over";
                    this.lightContext.clearRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                    for (b = 0; b < this.shadowProviders.length; ++b) this.shadowProviders[b].drawShadows();
                    ig.system.context.globalCompositeOperation = "destination-out";
                    for (b = this.condLightList.length; b--;) this.condLightList[b].drawLight();
                    this.lightContext.globalCompositeOperation = "source-over";
                    ig.game.renderer.drawLight();
                    if (a < 1) {
                        this.lightContext.globalAlpha = 1 - a;
                        this.lightContext.fillStyle = "#000008";
                        this.lightContext.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                        this.lightContext.globalAlpha = 1
                    }
                    this.lightContext.globalCompositeOperation = "destination-out";
                    for (b = this.lightHandles.length; b--;) this.lightHandles[b].draw();
                    if (ig.system.zoom != 1) ig.system.smoothPositioning = true;
                    ig.system.context = c;
                    this.hasShadow = true
                }
            }
        },
        midDrawOrder: 0,
        onMidDraw: function() {
            if (ig.perf.lighting && sc.options.get("lighting")) {
                ig.system.context.globalCompositeOperation = "lighter";
                ig.system.context.globalAlpha = 1;
                for (var a = 0; a < this.shadowProviders.length; ++a) {
                    var b = this.shadowProviders[a];
                    b.drawGlow && b.drawGlow()
                }
                for (a = this.condLightList.length; a--;) this.condLightList[a].drawGlow();
                if (this.hasShadow) {
                    ig.system.context.globalCompositeOperation =
                        "source-over";
                    ig.system.context.globalAlpha = 1;
                    var b = a = 0,
                        c = ig.system.contextScale;
                    if (ig.system.smoothPositioning) {
                        a = Math.round(ig.game.screen.x * c) / c % 1;
                        b = Math.round(ig.game.screen.y * c) / c % 1
                    }
                    ig.system.context.drawImage(this.lightCanvas, -a, -b);
                    ig.system.context.globalCompositeOperation = "lighter"
                }
                if (this.lightHandles.length > 0)
                    for (a = this.lightHandles.length; a--;) this.lightHandles[a].glow && this.lightHandles[a].draw(0.2, 1);
                if (this.screenFlashHandles.length > 0)
                    for (a = this.screenFlashHandles.length; a--;) this.screenFlashHandles[a].draw();
                ig.system.context.globalCompositeOperation = "source-over";
                ig.system.context.globalAlpha = 1
            }
        }
    });
    ig.addGameAddon(function() {
        return ig.light = new ig.Light
    })
});
ig.baked = !0;
