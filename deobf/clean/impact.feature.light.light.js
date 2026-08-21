/**
 * impact.feature.light.light
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.light.light")`.
 *
 * The lighting subsystem:
 *   - `ig.LIGHT_SIZE` / `ig.LIGHT_METRIC` — named light sizes mapped to sprite
 *     rectangles in `media/map/lightmap.png`.
 *   - `ig.LightHandle` — a light attached to an entity (fade in/out, duration,
 *     optional glow pass).
 *   - `ig.DarknessHandle` — screen-darkening with intensity interpolation.
 *   - `ig.ScreenFlashHandle` — full-screen colour flash.
 *   - `ig.GlowColor` — a cached colourised copy of the lightmap sprite.
 *   - `ig.CondLights` — lights gated behind a variable condition.
 *   - `ig.Light` — the game add-on (`ig.light`) that owns all handles, renders
 *     shadows/glows on an offscreen canvas each frame, and draws screen flashes.
 */
ig.module("impact.feature.light.light")
    .requires("impact.base.game", "game.config")
    .defines(function () {

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

    /** Light size → sprite rect (x, y, w, h) inside `media/map/lightmap.png`. */
    var lightMetrics = {};
    lightMetrics[ig.LIGHT_SIZE.XXXXL] = { x: 0, y: 0, w: 384, h: 384 };
    lightMetrics[ig.LIGHT_SIZE.XXXL] = { x: 384, y: 0, w: 256, h: 256 };
    lightMetrics[ig.LIGHT_SIZE.XXL] = { x: 448, y: 256, w: 192, h: 192 };
    lightMetrics[ig.LIGHT_SIZE.XL] = { x: 0, y: 384, w: 128, h: 128 };
    lightMetrics[ig.LIGHT_SIZE.L] = { x: 128, y: 448, w: 64, h: 64 };
    lightMetrics[ig.LIGHT_SIZE.M] = { x: 192, y: 464, w: 48, h: 48 };
    lightMetrics[ig.LIGHT_SIZE.S] = { x: 240, y: 480, w: 32, h: 32 };
    lightMetrics[ig.LIGHT_SIZE.XS] = { x: 272, y: 480, w: 32, h: 32 };
    lightMetrics[ig.LIGHT_SIZE.NONE] = { x: 272, y: 480, w: 32, h: 32 };
    ig.LIGHT_METRIC = lightMetrics;

    Vec3.create();
    ig.perf.lighting = true;

    /**
     * A light attached to an entity. `update()` returns true when the light is
     * finished and should be removed; `draw()` renders the lightmap sprite.
     */
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

        /**
         * @param {ig.Entity} targetEntity - entity the light follows
         * @param {number} size - one of `ig.LIGHT_SIZE`
         * @param {number} fadeIn - fade-in duration (seconds)
         * @param {number} fadeOut - fade-out duration (seconds)
         * @param {number} duration - hold duration after fade-in (-1 = forever)
         * @param {number} maxAlpha - peak opacity
         * @param {boolean} glow - whether to also draw the glow pass
         */
        init: function (targetEntity, size, fadeIn, fadeOut, duration, maxAlpha, glow) {
            this.targetEntity = targetEntity;
            this.targetEntity.addEntityAttached(this);
            this.size = size || ig.LIGHT_SIZE.XS;
            this.fadeIn = fadeIn || 0;
            this.fadeOut = fadeOut || 0;
            this.duration = duration || 0;
            this.maxAlpha = maxAlpha || 1;
            this.glow = glow !== void 0 ? glow : true;
            this.timer = this.fadeIn || this.duration || this.fadeOut;
        },

        /** Offset the light from the entity's centre. */
        setOffset: function (x, y, z) {
            if (!this.offset) this.offset = Vec3.create();
            Vec3.assignC(this.offset, x, y, z);
        },

        onActionEndDetach: function () {
            this.stop();
        },

        onEntityKillDetach: function () {
            (this.fadeIn || this.duration) && this.stop();
            this.targetEntity && this.targetEntity.removeEntityAttached(this);
            this.targetEntity = null;
        },

        /** Begin the fade-out; returns after `fadeOut` seconds. */
        stop: function () {
            this.timer = this.fadeOut;
            this.duration = this.fadeIn = 0;
        },

        /** @returns {boolean} true when finished (faded out) */
        update: function () {
            var tick = this.targetEntity ? this.targetEntity.coll.getTick(true) : ig.system.tick;
            this.timer = this.timer - tick;
            if (this.timer <= 0) {
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut;
                } else if (this.duration) {
                    if (this.duration > 0) {
                        this.duration = 0;
                        this.timer = this.fadeOut;
                    }
                } else {
                    this.fadeOut = 0;
                    this.targetEntity && this.targetEntity.removeEntityAttached(this);
                    return true;
                }
            }
            return false;
        },

        /**
         * @param {number} alphaMultiplier - extra alpha scale (used for the glow pass)
         * @param {number} sizeOffset - shifts the sprite rect (glow uses a bigger metric)
         */
        draw: function (alphaMultiplier, sizeOffset) {
            alphaMultiplier = alphaMultiplier || 1;
            sizeOffset = sizeOffset || 0;
            this.targetEntity && this.targetEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, this.lastPos);
            var pos = this.lastPos,
                x = pos.x - ig.game.screen.x,
                y = pos.y - pos.z - ig.game.screen.y;
            if (this.offset) {
                x = x + this.offset.x;
                y = y + (this.offset.y - this.offset.z);
            }
            var metric = lightMetrics[this.size + sizeOffset];
            if (metric) {
                var tX = metric.x,
                    tY = metric.y,
                    width = metric.w,
                    height = metric.h;
                if (!(x + width / 2 < 0 || y + height / 2 < 0 || x - width / 2 > ig.system.width || y - height / 2 > ig.system.height)) {
                    var alpha = 0;
                    this.fadeIn ? alpha = this.maxAlpha * (1 - this.timer / this.fadeIn) :
                        this.duration ? alpha = this.maxAlpha :
                        this.fadeOut && (alpha = this.maxAlpha * (this.timer / this.fadeOut));
                    ig.system.context.globalAlpha = alpha * alphaMultiplier;
                    ig.light.lightmapGfx.draw(x - width / 2, y - height / 2, tX, tY, width, height);
                }
            }
        }
    });

    /**
     * Screen darkness. `getIntensity()` interpolates between the old and target
     * intensities following the current fade phase; the light add-on multiplies
     * all darkness handles to find the darkest (minimum) remaining light.
     */
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

        init: function (useActualTick) {
            this.useActualTick = useActualTick || false;
        },

        /** Ramp to `intensity` over `duration` seconds (non-temporary). */
        setIntensity: function (intensity, duration) {
            this.oldIntensity = this.getIntensity();
            this.targetIntensity = intensity;
            this.timer = this.duration = duration;
            this.temporary = false;
        },

        /**
         * Temporary darkness owned by an action/entity: fades in to
         * `intensity`, holds for `duration`, then fades out.
         */
        setTemporary: function (entity, intensity, duration, fadeIn, fadeOut) {
            this.oldIntensity = this.getIntensity();
            this.targetIntensity = intensity;
            this.temporary = true;
            (this.entity = entity) && this.entity.addEntityAttached(this);
            this.duration = duration || 0;
            this.fadeIn = fadeIn || 0;
            this.fadeOut = fadeOut || 0;
            this.timer = this.fadeIn || this.duration || this.fadeOut;
        },

        onActionEndDetach: function () {
            this.stop();
        },

        onEntityKillDetach: function () {
            this.temporary && (this.fadeIn || this.duration) && this.stop();
            this.entity && this.entity.removeEntityAttached(this);
            this.entity = null;
        },

        stop: function () {
            this.oldIntensity = this.getIntensity();
            this.timer = this.fadeOut;
            this.targetIntensity = this.duration = this.fadeIn = 0;
        },

        /** @returns {boolean} true when finished */
        update: function () {
            this.timer = this.useActualTick ?
                this.timer - ig.system.actualTick :
                this.timer - (this.entity ? this.entity.coll.getTick(true) : ig.system.tick);
            if (this.timer <= 0 && this.temporary) {
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut;
                } else if (this.duration) {
                    if (this.duration > 0) {
                        this.oldIntensity = this.getIntensity();
                        this.duration = 0;
                        this.timer = this.fadeOut;
                        this.targetIntensity = 0;
                    }
                } else {
                    this.fadeOut = 0;
                    this.entity && this.entity.removeEntityAttached(this);
                    return true;
                }
            }
            return false;
        },

        /** Current darkness intensity in [0, 1], interpolated by fade phase. */
        getIntensity: function () {
            return this.oldIntensity + (this.targetIntensity - this.oldIntensity) *
                (this.temporary ?
                    this.fadeIn ? 1 - this.timer / this.fadeIn :
                    this.duration ? 1 :
                    1 - this.timer / this.fadeOut :
                this.timer > 0 ? 1 - this.timer / this.duration : 1);
        }
    });

    /** Full-screen colour flash (fade in, hold, fade out) on the main context. */
    ig.ScreenFlashHandle = ig.Class.extend({
        targetEntity: null,
        fadeIn: 0,
        fadeOut: 0,
        duration: 0,
        color: null,
        timer: 0,

        init: function (targetEntity, color, fadeIn, fadeOut, duration) {
            this.targetEntity = targetEntity;
            this.targetEntity.addEntityAttached(this);
            this.color = color || "white";
            this.fadeIn = fadeIn || 0;
            this.fadeOut = fadeOut || 0;
            this.duration = duration || 0;
            this.timer = this.fadeIn || this.duration || this.fadeOut;
        },

        onActionEndDetach: function () {
            this.stop();
        },

        onEntityKillDetach: function () {
            (this.fadeIn || this.duration) && this.stop();
            this.targetEntity && this.targetEntity.removeEntityAttached(this);
            this.targetEntity = null;
        },

        stop: function () {
            this.timer = this.fadeOut;
            this.duration = this.fadeIn = 0;
        },

        /** @returns {boolean} true when finished */
        update: function () {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0) {
                if (this.fadeIn) {
                    this.fadeIn = 0;
                    this.timer = this.duration || this.fadeOut;
                } else if (this.duration) {
                    if (this.duration > 0) {
                        this.duration = 0;
                        this.timer = this.fadeOut;
                    }
                } else {
                    this.fadeOut = 0;
                    this.targetEntity && this.targetEntity.removeEntityAttached(this);
                    return true;
                }
            }
            return false;
        },

        draw: function () {
            var alpha = 0;
            this.fadeIn ? alpha = 1 - this.timer / this.fadeIn :
                this.duration ? alpha = 1 :
                this.fadeOut && (alpha = this.timer / this.fadeOut);
            ig.system.context.globalAlpha = alpha;
            ig.system.context.fillStyle = this.color;
            ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
        }
    });

    /**
     * A cached colourised copy of the lightmap sprite: fills a canvas with the
     * glow colour and uses the lightmap as its alpha mask.
     */
    ig.GlowColor = ig.Cacheable.extend({
        cacheType: "GLOW_COLOR",
        canvas: null,
        gfx: null,

        init: function (color) {
            this.parent(color);
            var canvas = ig.$new("canvas"),
                lightmapGfx = ig.light.lightmapGfx;
            canvas.width = lightmapGfx.width * ig.system.scale;
            canvas.height = lightmapGfx.height * ig.system.scale;
            var bufferContext = ig.system.getBufferContext(canvas);
            bufferContext.globalCompositeOperation = "source-over";
            bufferContext.fillStyle = color;
            bufferContext.fillRect(0, 0, canvas.width, canvas.height);
            bufferContext.globalCompositeOperation = "destination-in";
            bufferContext.drawImage(lightmapGfx.data, 0, 0);
            this.canvas = canvas;
            this.gfx = new ig.ImageCanvasWrapper(canvas);
        },

        getCacheKey: function (color) {
            return color;
        },

        onCacheCleared: function () {
            this.canvas.width = this.canvas.height = 0;
            this.gfx = this.canvas = null;
        }
    });

    /**
     * A group of lights (light + optional glow) tied to one variable
     * condition. Fades in/out over 0.2 s when the condition's value flips.
     */
    ig.CondLights = ig.Class.extend({
        condition: null,
        lights: [],
        hasLight: false,
        hasGlow: false,
        isOn: false,
        timer: 0,

        init: function (condition) {
            this.condition = condition;
            this.isOn = this.condition.evaluate();
        },

        addLight: function (pos, lightSize, glowSize, glowColor) {
            if (glowSize && !glowColor) glowColor = ig.light.mainGlowColor;
            this.lights.push({
                pos: pos,
                lightSize: lightSize,
                glowSize: glowSize,
                glowColor: glowColor
            });
            if (glowSize) this.hasGlow = true;
            if (lightSize) this.hasLight = true;
        },

        update: function () {
            var isOnNow = this.condition.evaluate();
            if (isOnNow != this.isOn) {
                this.isOn = isOnNow;
                this.timer = 0.2 - this.timer;
            }
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) this.timer = 0;
            }
        },

        /** 0..1 opacity of the group, ramping during the 0.2 s transition. */
        getAlpha: function () {
            var progress = this.timer / 0.2;
            return this.isOn ? 1 - progress : progress;
        },

        drawGlow: function () {
            this.hasGlow && this._draw(true);
        },

        drawLight: function () {
            this.hasLight && this._draw(false);
        },

        /** Draw every light (or glow) of the group with the group's alpha. */
        _draw: function (drawGlow) {
            var alpha = this.getAlpha();
            if (alpha) {
                var prevAlpha = ig.system.context.globalAlpha;
                ig.system.context.globalAlpha = alpha;
                for (alpha = this.lights.length; alpha--;) {
                    var light = this.lights[alpha],
                        x = light.pos.x - ig.game.screen.x,
                        y = light.pos.y - ig.game.screen.y,
                        sizeKey = drawGlow ? light.glowSize : light.lightSize;
                    if (sizeKey) {
                        var metric = lightMetrics[sizeKey];
                        if (metric) {
                            var tX = metric.x,
                                tY = metric.y,
                                width = metric.w,
                                height = metric.h;
                            if (!(x + width / 2 < 0 || y + height / 2 < 0 || x - width / 2 > ig.system.width || y - height / 2 > ig.system.height)) {
                                (drawGlow ? light.glowColor.gfx : ig.light.lightmapGfx)
                                    .draw(x - width / 2, y - height / 2, tX, tY, width, height);
                            }
                        }
                    }
                }
                ig.system.context.globalAlpha = prevAlpha;
            }
        }
    });

    /** The lighting game add-on; owns all handles and renders light/shadow. */
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

        init: function () {
            this.parent("Light");
            this.lightCanvas = ig.$new("canvas");
            this.lightCanvas.width = ig.system.contextWidth + 1;
            this.lightCanvas.height = ig.system.contextHeight + 1;
            this.lightContext = ig.system.getBufferContext(this.lightCanvas);
        },

        setMainGlowColor: function (color) {
            this.mainGlowColor && this.mainGlowColor.decreaseRef();
            this.mainGlowColor = null;
            if (color) this.mainGlowColor = new ig.GlowColor(color);
        },

        getMainGlowGfx: function () {
            return this.mainGlowColor && this.mainGlowColor.gfx;
        },

        addDarknessHandle: function (handle) {
            this.darknessHandles.push(handle);
        },

        removeDarknessHandle: function (handle) {
            this.darknessHandles.erase(handle);
        },

        addScreenFlashHandle: function (handle) {
            this.screenFlashHandles.push(handle);
        },

        removeScreenFlashHandle: function (handle) {
            this.screenFlashHandles.erase(handle);
        },

        /** Register a light (grouped by condition key) with the add-on. */
        addCondLight: function (condition, pos, lightSize, glowSize, glowColor) {
            var key = condition.toString(),
                condLights = this.condLights[key];
            if (!condLights) {
                condLights = new ig.CondLights(condition);
                this.condLightList.push(condLights);
                this.condLights[key] = condLights;
            }
            condLights.addLight(pos, lightSize, glowSize, glowColor);
        },

        addLightHandle: function (handle) {
            this.lightHandles.push(handle);
        },

        addShadowProvider: function (provider) {
            if (this.shadowProviders.indexOf(provider) == -1) {
                this.shadowProviders.push(provider);
                this.shadowProviders.sort(function (a, b) {
                    return a.shadowOrder - b.shadowOrder;
                });
            }
        },

        removeShadowProvider: function (provider) {
            this.shadowProviders.erase(provider);
        },

        levelLoadStartOrder: 0,
        onLevelLoadStart: function () {
            this.condLightList.length = 0;
            this.condLights = {};
        },

        /** Advance every handle; remove the finished ones. */
        onDeferredUpdate: function () {
            for (var i = this.lightHandles.length; i--;) {
                this.lightHandles[i].update() && this.lightHandles.splice(i, 1);
            }
            for (i = this.darknessHandles.length; i--;) {
                this.darknessHandles[i].update() && this.darknessHandles.splice(i, 1);
            }
            for (i = this.screenFlashHandles.length; i--;) {
                this.screenFlashHandles[i].update() && this.screenFlashHandles.splice(i, 1);
            }
            for (i = this.condLightList.length; i--;) this.condLightList[i].update();
        },

        preDrawOrder: 0,

        /** Render the shadow pass onto the offscreen light canvas. */
        onPreDraw: function () {
            this.hasShadow = false;
            if (ig.perf.lighting && sc.options.get("lighting")) {
                for (var minLightness = 1, i = this.darknessHandles.length; i--;) {
                    minLightness = Math.min(minLightness, 1 - this.darknessHandles[i].getIntensity());
                }
                if (ig.game.hasLightLayer() || !(this.shadowProviders.length == 0 && minLightness == 1)) {
                    if (ig.system.zoom != 1) ig.system.smoothPositioning = false;
                    var prevContext = ig.system.context;
                    ig.system.context = this.lightContext;
                    this.lightContext.globalAlpha = 1;
                    ig.system.context.globalCompositeOperation = "source-over";
                    this.lightContext.clearRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                    for (i = 0; i < this.shadowProviders.length; ++i) this.shadowProviders[i].drawShadows();
                    ig.system.context.globalCompositeOperation = "destination-out";
                    for (i = this.condLightList.length; i--;) this.condLightList[i].drawLight();
                    this.lightContext.globalCompositeOperation = "source-over";
                    ig.game.renderer.drawLight();
                    if (minLightness < 1) {
                        this.lightContext.globalAlpha = 1 - minLightness;
                        this.lightContext.fillStyle = "#000008";
                        this.lightContext.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                        this.lightContext.globalAlpha = 1;
                    }
                    this.lightContext.globalCompositeOperation = "destination-out";
                    for (i = this.lightHandles.length; i--;) this.lightHandles[i].draw();
                    if (ig.system.zoom != 1) ig.system.smoothPositioning = true;
                    ig.system.context = prevContext;
                    this.hasShadow = true;
                }
            }
        },

        midDrawOrder: 0,

        /** Composite the light canvas and draw glows + screen flashes. */
        onMidDraw: function () {
            if (ig.perf.lighting && sc.options.get("lighting")) {
                ig.system.context.globalCompositeOperation = "lighter";
                ig.system.context.globalAlpha = 1;
                for (var i = 0; i < this.shadowProviders.length; ++i) {
                    var provider = this.shadowProviders[i];
                    provider.drawGlow && provider.drawGlow();
                }
                for (i = this.condLightList.length; i--;) this.condLightList[i].drawGlow();
                if (this.hasShadow) {
                    ig.system.context.globalCompositeOperation = "source-over";
                    ig.system.context.globalAlpha = 1;
                    var offsetX = 0,
                        offsetY = 0,
                        contextScale = ig.system.contextScale;
                    if (ig.system.smoothPositioning) {
                        offsetX = Math.round(ig.game.screen.x * contextScale) / contextScale % 1;
                        offsetY = Math.round(ig.game.screen.y * contextScale) / contextScale % 1;
                    }
                    ig.system.context.drawImage(this.lightCanvas, -offsetX, -offsetY);
                    ig.system.context.globalCompositeOperation = "lighter";
                }
                if (this.lightHandles.length > 0) {
                    for (i = this.lightHandles.length; i--;) {
                        this.lightHandles[i].glow && this.lightHandles[i].draw(0.2, 1);
                    }
                }
                if (this.screenFlashHandles.length > 0) {
                    for (i = this.screenFlashHandles.length; i--;) this.screenFlashHandles[i].draw();
                }
                ig.system.context.globalCompositeOperation = "source-over";
                ig.system.context.globalAlpha = 1;
            }
        }
    });

    ig.addGameAddon(function () {
        return ig.light = new ig.Light();
    });
});
ig.baked = !0;
