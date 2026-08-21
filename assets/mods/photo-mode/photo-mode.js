"use strict";

// ===========================================================================
// Photo Mode v1.0.0
// =================
// Freeze the world and move the camera for clean screenshots.
//
//   F12            toggle photo mode on/off (Esc also exits)
//   WASD / Arrows  pan the camera
//   Q / E          zoom out / in (0.5x - 2.5x)
//   R              reset the camera to the player
//
// How it works (all real engine APIs, verified against deobf/clean/):
//   * Freezing: `ig.game.setPaused(true)` stops the world AND automatically
//     hides the HUD — the gui renderer skips top-level hooks whose `pauseGui`
//     flag is false while the game is paused (impact.feature.gui.gui.js), so
//     the HP bars, minimap, clock, etc. all disappear on their own.
//   * Camera: while paused the ig.Camera addon skips its update, so our addon
//     (postUpdateOrder 101) writes `ig.game.screen.x/y` and `ig.system.zoom`
//     directly, clamped to the map bounds, every frame.
//   * On exit the camera addon resumes chasing the player from where we left.
// ===========================================================================

(function () {
    const MOD_VERSION = '1.0.0';

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2.5;
    const PAN_SPEED = 620; // screen px per second at 1x zoom

    let keys = null; // Set of currently-held key names (lowercase)
    let addon = null;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    // ------------------------------------------------------------------
    // DOM hint overlay (shown while photo mode is active)
    // ------------------------------------------------------------------
    function ensureHint() {
        let el = document.getElementById('photo-mode-hint');
        if (!el) {
            el = document.createElement('div');
            el.id = 'photo-mode-hint';
            el.style.cssText =
                'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); ' +
                'z-index:999999; font-family:sans-serif; font-size:13px; color:#fff; ' +
                'background:rgba(0,0,0,0.55); padding:6px 14px; border-radius:4px; ' +
                'text-shadow:1px 1px 0 #000; pointer-events:none; display:none; ' +
                'white-space:nowrap;';
            document.body.appendChild(el);
        }
        return el;
    }

    function updateHint(show) {
        const el = ensureHint();
        el.style.display = show ? 'block' : 'none';
        if (show) {
            el.innerText =
                'Photo Mode — WASD/Arrows: move · Q/E: zoom · R: reset to player · F12/Esc: exit';
        }
    }

    // ------------------------------------------------------------------
    // The addon
    // ------------------------------------------------------------------
    function defineAddon() {
        if (ig.PhotoModeAddon) return;
        ig.PhotoModeAddon = ig.GameAddon.extend({
            postUpdateOrder: 101, // after the camera addon (100)
            active: false,
            pos: { x: 0, y: 0 },
            zoom: 1,
            prevZoom: 1,

            onPostUpdate: function () {
                if (!this.active) return;

                // A menu opening (pause screen etc.) ends photo mode cleanly.
                if (sc && sc.model && typeof sc.model.isMenu === 'function' && sc.model.isMenu()) {
                    exitPhotoMode(this);
                    return;
                }
                if (!ig.system || !ig.game || !ig.game.size) return;

                const tick = ig.system.actualTick > 0 ? ig.system.actualTick : 1 / 60;
                const speed = PAN_SPEED / this.zoom;
                let dx = 0, dy = 0;
                if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
                if (keys.has('d') || keys.has('arrowright')) dx += 1;
                if (keys.has('w') || keys.has('arrowup')) dy -= 1;
                if (keys.has('s') || keys.has('arrowdown')) dy += 1;
                if (dx !== 0 || dy !== 0) {
                    const len = Math.sqrt(dx * dx + dy * dy);
                    this.pos.x += (dx / len) * speed * tick;
                    this.pos.y += (dy / len) * speed * tick;
                }
                if (keys.has('q')) this.zoom = Math.max(MIN_ZOOM, this.zoom - 1.4 * tick);
                if (keys.has('e')) this.zoom = Math.min(MAX_ZOOM, this.zoom + 1.4 * tick);
                if (keys.has('r')) this.resetToPlayer();

                this.applyCamera();
            },

            resetToPlayer: function () {
                const p = ig.game && ig.game.playerEntity;
                if (p && p.coll) {
                    this.pos.x = p.coll.pos.x + p.coll.size.x / 2;
                    this.pos.y = p.coll.pos.y - (p.coll.pos.z || 0) + p.coll.size.y / 2;
                }
            },

            /** Write the camera position + zoom, clamped to the map bounds. */
            applyCamera: function () {
                const w = ig.system.width,
                    h = ig.system.height,
                    z = this.zoom;
                const maxX = ig.game.size.x,
                    maxY = ig.game.size.y;
                const hw = w / 2 / z,
                    hh = h / 2 / z;
                let cx = this.pos.x,
                    cy = this.pos.y;
                if (maxX <= w / z) cx = maxX / 2;
                else cx = clamp(cx, hw, maxX - hw);
                if (maxY <= h / z) cy = maxY / 2;
                else cy = clamp(cy, hh, maxY - hh);
                this.pos.x = cx;
                this.pos.y = cy;
                ig.system.setZoom(z);
                ig.system.setZoomFocus(w / 2, h / 2);
                ig.game.screen.x = cx - w / 2;
                ig.game.screen.y = cy - h / 2;
            }
        });
    }

    function enterPhotoMode() {
        if (!ig.game || !ig.system || !ig.game.playerEntity) return;
        addon.prevZoom = ig.system.zoom || 1;
        addon.zoom = 1;
        addon.resetToPlayer();
        addon.active = true;
        if (typeof ig.game.setPaused === 'function') ig.game.setPaused(true);
        addon.applyCamera();
        updateHint(true);
        if (window.console && console.log) console.log('[Photo Mode] enabled (world frozen, HUD hidden).');
    }

    function exitPhotoMode(photoAddon) {
        if (!photoAddon || !photoAddon.active) return;
        photoAddon.active = false;
        if (ig.system) {
            ig.system.setZoom(photoAddon.prevZoom || 1);
            ig.system.setZoomFocus(ig.system.width / 2, ig.system.height / 2);
        }
        // Resume the world — unless a menu took over the pause state.
        const inMenu = sc && sc.model && typeof sc.model.isMenu === 'function' && sc.model.isMenu();
        if (ig.game && typeof ig.game.setPaused === 'function' && !inMenu) {
            ig.game.setPaused(false);
        }
        updateHint(false);
        if (window.console && console.log) console.log('[Photo Mode] disabled — camera resumes tracking the player.');
    }

    function togglePhotoMode() {
        if (!addon) return;
        if (ig.loading) return;
        if (!sc || !sc.model || typeof sc.model.isGame !== 'function' || !sc.model.isGame()) return;
        if (addon.active) exitPhotoMode(addon);
        else enterPhotoMode();
    }

    // ------------------------------------------------------------------
    // Key handling (document-level so it works while the game is paused)
    // ------------------------------------------------------------------
    function onKeyDown(e) {
        const k = (e.key || '').toLowerCase();
        keys.add(k);
        if (k === 'f12') {
            e.preventDefault();
            togglePhotoMode();
            return;
        }
        if (addon && addon.active && k === 'escape') {
            e.preventDefault();
            exitPhotoMode(addon);
        }
    }

    function onKeyUp(e) {
        keys.delete((e.key || '').toLowerCase());
    }

    // ------------------------------------------------------------------
    // Boot: wait for the live game, then register the addon
    // ------------------------------------------------------------------
    function boot() {
        if (!window.ig || !ig.GameAddon || !ig.game || !ig.game.addons || !ig.game.addons.all) {
            setTimeout(boot, 100);
            return;
        }
        if (ig.photoModeAddon) return;

        keys = new Set();
        defineAddon();
        addon = ig.photoModeAddon = new ig.PhotoModeAddon();

        const game = ig.game;
        game.addons.all.push(addon);
        game.addons.postUpdate.push(addon);
        game.addons.postUpdate.sort(function (a, b) {
            return (a.postUpdateOrder || 0) - (b.postUpdateOrder || 0);
        });

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        if (window.console && console.log) {
            console.log('[Photo Mode] v' + MOD_VERSION + ' loaded — F12 toggles photo mode (world freezes, HUD hides, free camera).');
        }
    }

    boot();
})();
