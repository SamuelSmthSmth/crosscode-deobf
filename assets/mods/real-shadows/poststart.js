/* =============================================================================
 * real-shadows  v1.0.0
 * =====================
 * Replaces the flat blurry "blob" shadow that sits under characters with a
 * soft projected **silhouette** shadow (the character's own sprite drawn dark
 * and flattened against the ground, offset by the scene light).
 *
 * How it works (verified against assets/js/game.compiled.pretty.js):
 *   - ig.CubeSprite is the pooled per-frame sprite; it gets a `shadow`
 *     record (x,y -> ground pos, diameter -> footprint) via setShadowFromEntity.
 *     We patch that method: when the owning entity is an actor (anything
 *     instanceof sc.ActorEntity — player, NPCs, party, pets, combatants),
 *     we remember the footprint and zero the blob diameter so the engine's
 *     blurry shadow pass skips it, and mark the sprite `realShadow = true`.
 *   - We then patch ig.Renderer2d.SpriteDrawSlot.draw to draw the character's
 *     own current frame tinted black (ctx.filter grayscale+brightness 0),
 *     squashed flat and planted at the ground position, right before the
 *     character itself is drawn (so depth ordering stays correct).
 *
 * Tune it live from the browser console:
 *   sc.realShadows.enabled     = false   // revert to original blob shadows
 *   sc.realShadows.alpha       = 0.45    // shadow opacity
 *   sc.realShadows.projection  = 0.55    // vertical squash (how flat)
 *   sc.realShadows.footprint   = 0.9     // silhouette width vs the old blob
 *   sc.realShadows.offsetX     = 2       // cast direction (world pixels)
 *   sc.realShadows.offsetY     = 5
 *   sc.realShadows.lightSource = null    // override cast dir from light pos
 * =========================================================================== */
"use strict";

(function () {
    if (window.__realShadowsInstalled) return;
    var ig_ = false, sc_ = false;
    function ready() {
        return (typeof ig !== "undefined" && ig.CubeSprite &&
                typeof ig.CubeSprite.inject === "function" &&
                ig.Renderer2d && ig.Renderer2d.SpriteDrawSlot &&
                ig.Renderer2d.SpriteDrawSlot.inject === "function" &&
                typeof sc !== "undefined" && sc.ActorEntity);
    }
    if (!ready()) return; // engine not up yet; poststart normally guarantees this

    window.__realShadowsInstalled = true;

    // ---- config (tweakable at runtime) -------------------------------------
    var cfg = sc.realShadows = sc.realShadows || {
        enabled:      true,
        alpha:        0.45,
        projection:   0.55,
        footprint:    0.9,
        offsetX:      2,
        offsetY:      5,
        lightSource:  null,          // optional {x,y,z} world point the cast comes from
        minFootprint: 0.4
    };
    cfg.toggle = function (on) {
        cfg.enabled = on === undefined ? !cfg.enabled : on;
        console.log("[real-shadows] " + (cfg.enabled ? "ON" : "OFF"));
        return cfg.enabled;
    };

    // How far the character is above its own shadow footpoint (float height).
    function rise(s) {
        var zOff = s.pos.z + s.tmpOffset.z - s.shadow.z;
        if (s.shadow.type === ig.COLL_SHADOW_TYPE.STATIC_SIZE) zOff = 0;
        return Math.max(0, zOff);
    }

    // Cast offset: prefer an explicit light source, otherwise a gentle default
    // (light from above-left => shadow drifts toward bottom-right).
    function cast(s) {
        var o = cfg.lightSource;
        if (o && typeof o.x === "number" && typeof o.z === "number") {
            var dx = s.shadow.x - o.x, dz = s.shadow.z - o.z, d = Math.hypot(dx, dz) || 1;
            var k = 0.12;
            return { x: (dx / d) * k * 10, y: (dz / d) * k * 10 };
        }
        return { x: cfg.offsetX, y: cfg.offsetY };
    }

    // Draw one silhouette shadow into the current context.
    function drawProjected(ctx, sprite) {
        var img = sprite.image;
        if (!img || typeof img.draw !== "function") return;
        var game = ig.game;
        var blob = sprite._blobDiameter || sprite.shadow.diameter || 16;
        var w = sprite.size.x || 12;
        var h = (sprite.size.y + sprite.size.z) || 24;

        // Shrink as the character floats above the ground (mirrors the blob).
        var r = rise(sprite);
        var k = (blob - r / 8) / blob;
        if (k < cfg.minFootprint) k = cfg.minFootprint;
        var scaleK = cfg.footprint * k;

        var c = cast(sprite);
        var sx = Math.round(sprite.shadow.x + c.x) - game.screen.x;
        var sy = Math.round((sprite.shadow.y - sprite.shadow.z) + c.y) - game.screen.y;

        var half = (w * scaleK) / 2;
        if (!(half > 0 && sy - half <= ig.system.height && sy + half >= 0 &&
              sx - half <= ig.system.width && sx + half >= 0)) return;

        var prevAlpha = ctx.globalAlpha;
        var prevFilter = ctx.filter;
        ctx.globalAlpha = prevAlpha * sprite.alpha * cfg.alpha;
        ctx.save();
        ctx.filter = "grayscale(1) brightness(0)";
        ctx.translate(ig.system.getDrawPos(sx), ig.system.getDrawPos(sy));
        ctx.scale(scaleK, scaleK * cfg.projection);
        img.draw(-w / 2, -h, sprite.src.x, sprite.src.y, w, h, sprite.flip.x, sprite.flip.y);
        ctx.restore();
        ctx.filter = prevFilter;
        ctx.globalAlpha = prevAlpha;
    }

    // 1) Mark real characters at sprite-build time + suppress the blob shadow.
    try {
        ig.CubeSprite.inject({
            setShadowFromEntity: function (entity) {
                this.parent(entity);
                this.realShadow = false;
                this._blobDiameter = 0;
                if (entity && entity instanceof sc.ActorEntity) {
                    var cs = entity.coll && entity.coll.shadow;
                    if (cs && cs.size > 0) {
                        this.realShadow = true;
                        this._blobDiameter = cs.size;
                        this.shadow.diameter = 0; // engine skips the blurry blob
                    }
                }
            }
        });
    } catch (e) {
        console.warn("[real-shadows] could not patch sprite shadows", e);
        return;
    }

    // 2) Draw the projected silhouette right before each character is drawn.
    try {
        ig.Renderer2d.SpriteDrawSlot.inject({
            draw: function (zMin, zMax) {
                var s = this.cubeSprite;
                if (s && s.realShadow && this.ground && cfg.enabled) {
                    drawProjected(ig.system.context, s);
                }
                this.parent(zMin, zMax);
            }
        });
    } catch (e) {
        console.warn("[real-shadows] could not patch renderer", e);
    }

    console.log("[real-shadows] active (player/NPC/pet/combatant silhouette shadows; " +
        "sc.realShadows to tune)");
})();
