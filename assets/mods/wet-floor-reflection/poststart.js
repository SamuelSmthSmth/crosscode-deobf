"use strict";
/* =============================================================================
 * wet-floor-reflection  v0.3.0
 * ===============================
 * True reflections for wet outdoor floors (Basin Keep / rainy jungle-city plaza).
 *
 * v0.3.0 abandons the whole-frame "band mirror" (it read as floor-reflecting-floor
 * and tore the screen). TRUE floor mirrors reflect EACH OBJECT at its own base:
 * for every actor we draw its LIVE sprite flipped vertically beneath its ground
 * contact, foreshortened and faint — a dynamic per-entity mirror. The base wet
 * tint stays so empty floor reads as damp glass; an optional global band mirror
 * (`cfg.band`) is available but OFF by default.
 *
 * It reuses the proven seam from real-shadows (ig.CubeSprite.setShadowFromEntity
 * marks actors; ig.Renderer2d.SpriteDrawSlot.draw draws the mirror), so it
 * coexists with (or supersedes) the silhouette shadows.
 *
 * Tune live (sc.wetFloor):
 *   sc.wetFloor.enabled  = false            // master off
 *   sc.wetFloor.entities = true             // per-entity mirrors
 *   sc.wetFloor.band     = false            // optional whole-frame floor mirror
 *   sc.wetFloor.alpha    = 0.5              // mirror opacity
 *   sc.wetFloor.proj     = 0.55             // vertical foreshorten of each mirror
 *   sc.wetFloor.tint     = [10,20,48,0.3]   // wet sheen (null = none)
 *   sc.wetFloor.horizon  = 0.30             // used for band + tint region
 *   sc.wetFloor.force    = true             // any map
 *   sc.wetFloor.showBand = true             // magenta debug fill over band region
 *   sc.wetFloor.ripple   = true             // only affects the (off) band mirror
 *   sc.wetFloor.setMap('jungle.city.x')     // add a map whose floor reflects
 * =========================================================================== */
(function () {
    if (window.__wetFloorReflectionInstalled) return;

    var cfg = sc.wetFloor = sc.wetFloor || {
        enabled:    true,
        entities:   true,
        band:       false,
        alpha:      0.5,
        proj:       0.55,
        widthK:     1.0,
        tint:       [10, 20, 48, 0.3],
        horizon:    0.30,
        bandAlpha:  0.6,
        bandFade:   0.5,
        ripple:     true,
        rippleAmp:  3,
        every:      1,
        force:      false,
        showBand:   false,
        maps: ['jungle-city.', 'jungle.dng.', 'rhombus-sqr.central'],
        exclude: ['jungle-city.interior.', 'jungle-city.special.',
                  'jungle-city.halloween.', 'jungle.dng.lou-office']
    };
    cfg.path = function () {
        try { return sc.map && sc.map.currentArea && sc.map.currentArea.path || null; }
        catch (e) { return null; }
    };
    cfg.setMap = function (p) { if (p && cfg.maps.indexOf(p) === -1) cfg.maps.push(p); return cfg.maps; };
    cfg.debug = function () {
        console.log('[wet-floor] area =', cfg.path(), '| active =', _isReflective());
        return cfg;
    };
    cfg.toggle = function (on) {
        cfg.enabled = (on === undefined) ? !cfg.enabled : on;
        console.log('[wet-floor]', cfg.enabled ? 'ON' : 'OFF');
        return cfg.enabled;
    };
    function _match(p, list) {
        if (!p) return false;
        for (var i = 0; i < list.length; i++) if (p === list[i] || p.indexOf(list[i]) === 0) return true;
        return false;
    }
    function _isReflective() {
        if (cfg.force) return true;
        var p = cfg.path();
        return _match(p, cfg.maps) && !_match(p, cfg.exclude);
    }

    // =========================================================================
    // PER-ENTITY TRUE MIRRORS — draw each actor's live sprite flipped below it.
    // =========================================================================
    // Cleaner, single-purpose mirror transform (replaces the scratch above).
    function drawMirror(ctx, s) {
        var img = s.image;
        if (!img || !img.draw || !s.shadow || s.shadow.size <= 0) return;
        var w = s.size.x || 12;
        var h = (s.size.y + s.size.z) || 24;
        if (!(w > 0 && h > 0)) return;
        var bx = s.shadow.x - ig.game.screen.x;
        var by = (s.shadow.y - s.shadow.z) - ig.game.screen.y;
        var rise = Math.max(0, (s.pos.z + s.tmpOffset.z) - (s.shadow.z || 0));
        var k = Math.max(0.2, Math.min(1, 1 - rise / 64));
        var kProj = cfg.proj * k;
        var kWidth = cfg.widthK * k;
        if (bx + kWidth * w / 2 < -10 || bx - kWidth * w / 2 > ig.system.width + 10) return;

        var prevAlpha = ctx.globalAlpha, prevFilter = ctx.filter;
        ctx.filter = '';
        ctx.globalAlpha = prevAlpha * s.alpha * cfg.alpha * k;
        ctx.save();
        ctx.translate(ig.system.getDrawPos(bx), ig.system.getDrawPos(by + kProj * h));
        ctx.scale(kWidth, -kProj);
        img.draw(-w / 2, 0, s.src.x, s.src.y, w, h, s.flip.x, s.flip.y);
        ctx.restore();
        ctx.filter = prevFilter;
        ctx.globalAlpha = prevAlpha;
    }

    // ---- engine seams ------------------------------------------------------
    function patchSprites() {
        ig.CubeSprite.inject({
            setShadowFromEntity: function (entity) {
                this.parent(entity);
                this._wetRefl = !!(entity && entity instanceof sc.ActorEntity);
            }
        });
        ig.Renderer2d.SpriteDrawSlot.inject({
            draw: function (zMin, zMax) {
                var s = this.cubeSprite;
                if (s && s._wetRefl && this.ground && cfg.enabled && cfg.entities && _isReflective()) {
                    drawMirror(ig.system.context, s);
                }
                this.parent(zMin, zMax);
            }
        });
    }

    // =========================================================================
    // OPTIONAL WHOLE-FRAME BAND MIRROR (off by default) + wet sheen
    // =========================================================================
    var _frame = 0, _fb = null, _refl = null;
    function ensureCanvas(which, W, H) {
        if (!_fb || _fb.w !== W || _fb.h !== H) {
            var c = document.createElement('canvas');
            c.width = W; c.height = H;
            _fb = { canvas: c, ctx: c.getContext('2d'), w: W, h: H };
        }
        if (!_refl || _refl.w !== W || _refl.h !== H) {
            var c2 = document.createElement('canvas');
            c2.width = W; c2.height = H;
            _refl = { canvas: c2, ctx: c2.getContext('2d'), w: W, h: H };
        }
        return (which === 'fb') ? _fb : _refl;
    }

    function addon() {
        if (ig.WetFloorReflectionAddon) return;
        ig.WetFloorReflectionAddon = ig.GameAddon.extend({
            postDrawOrder: 300,
            onLevelLoaded: function () {
                _frame = 0;
                var p = cfg.path();
                if (p) console.log('[wet-floor] area: ' + p +
                    (_isReflective() ? '  · reflections active ✓' :
                     '  · not active (sc.wetFloor.force=true to force any map)'));
            },
            onPostDraw: function () {
                var sys = ig.system;
                if (!sys || !sys.context) return;
                // Wet sheen: subtle cool tint over the floor band so it reads damp.
                if (!cfg.enabled) { _frame = 0; return; }
                if (!_isReflective()) { _frame = 0; return; }
                var W = sys.realWidth || sys.width;
                var H = sys.realHeight || sys.height;
                var s = W / sys.width;
                var h = Math.round((cfg.horizon || 0.3) * sys.height * s);
                if (!(h > 0 && h < H - 2)) return;
                var ctx = sys.context;
                ctx.save();
                ctx.resetTransform();
                if (cfg.showBand) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#ff00c8'; ctx.fillRect(0, h, W, H - h); ctx.globalAlpha = 1; }
                if (cfg.tint) this._drawWetTint(ctx, W, H, h, cfg.tint);
                ctx.restore();
            },
            _drawWetTint: function (ctx, W, H, h, tint) {
                var g = ctx.createLinearGradient(0, h, 0, H);
                g.addColorStop(0, 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + (tint[3] * 0.4).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + tint[3].toFixed(3) + ')');
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = g;
                ctx.fillRect(0, h, W, H - h);
                ctx.globalCompositeOperation = 'source-over';
            }
        });
        var a = new ig.WetFloorReflectionAddon();
        ig.game.addons.all.push(a);
        ig.game.addons.postDraw.push(a);
        ig.game.addons.postDraw.sort(function (x, y) { return (x.postDrawOrder || 0) - (y.postDrawOrder || 0); });
        ig.game.addons.levelLoaded.push(a);
        ig.game.addons.levelLoaded.sort(function (x, y) { return (x.levelLoadedOrder || 0) - (y.levelLoadedOrder || 0); });
    }

    function boot() {
        if (!window.ig || !ig.CubeSprite || !ig.Renderer2d || !ig.Renderer2d.SpriteDrawSlot ||
            !ig.GameAddon || !ig.game || !ig.game.addons || !ig.game.addons.postDraw) {
            setTimeout(boot, 100); return;
        }
        if (window.__wetFloorReflectionInstalled) return;
        window.__wetFloorReflectionInstalled = true;
        try { patchSprites(); addon(); }
        catch (e) { window.__wetFloorReflectionInstalled = false; console.warn('[wet-floor] init failed', e); setTimeout(boot, 200); return; }
        console.log('[wet-floor] v0.3.0 — per-entity true reflections. sc.wetFloor to tune; sc.wetFloor.force=true reflects any map.');
    }
    boot();
})();
