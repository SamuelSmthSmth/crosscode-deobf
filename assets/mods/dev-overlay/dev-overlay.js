"use strict";

// =============================================================================
// dev-overlay.js  v1.6.0
// ======================
// F3            — toggle the entire overlay on / off
// 1 (numpad ok) — toggle wireframes          (default ON)
// 2             — toggle water masks          (default ON)
// 3             — toggle velocity vectors     (default ON)
// 4             — toggle zebra stripes        (default ON)
// 5             — toggle WASM lighting self-test (default ON)
// 6             — unlock ALL elements + ALL skill nodes (works even while F3 is closed)
// W             — run the WASM self-test now (logs verdict to console)
//
// Visual hierarchy
// ----------------
//   Player      thick cyan box + "PLAYER" label
//   Actors      normal-weight box, entity class name label, z-coded color
//   Other ents  thin box, faded (alpha 0.25), no label
//   Vel vector  orange arrow, only entities > 300 px/s
//   Water mask  cyan fill on every tile whose terrain is WATER / SHALLOW_WATER /
//               BEACH_WATER (ig.terrain.getTerrainOfMapTile)
//   Zebra       yellow/black hatch on regions that are darker than the rest of the
//               scene (sampled from the real game canvas every N frames). Local
//               shadows pop in bright maps; a uniformly dark room stays clear.
//
// Panel columns
//   Left  — metric label (blue)
//   Right — live value (white)
//   Bottom — active-toggle indicator + z-color legend
//
// APIs (verified against deobf/clean/):
//   impact.base.game            ig.game.addons, shownEntities, screen, maps,
//                               playerEntity
//   impact.base.system          ig.system.actualTick, tick, width, height,
//                               contextWidth, contextHeight, zoom, scale,
//                               getScreenFromMapPos
//   impact.base.system          ig.system.canvas / getImageData (zebra samples this)
//   impact.base.tile-info       ig.TileInfo.getAnimTiles   (line 63)
// =============================================================================

(function () {
    var MOD_VERSION = '1.6.0';

    // -------------------------------------------------------------------------
    // Sub-toggle state  (all start ON so the user sees everything immediately)
    // -------------------------------------------------------------------------
    var panelOpen   = false;
    var showWires   = true;
    var showWater   = true;
    var showVel     = true;
    var showZebra   = true;
    var showWasm    = true;  // WASM lighting self-test panel (needs lighting-wasm)
    var wasmTick    = 0;     // countdown to re-run the WASM self-test while open

    var cheatAll        = false;  // [6] unlock all elements + all skill nodes
    var cheatElemSaved  = null;   // snapshot of element core flags (for revert)
    var cheatSkillsAdded= null;   // { uid: true } for the nodes we added (to remove on revert)

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------
    var PANEL_X      = 6;
    var PANEL_Y      = 6;
    var PANEL_LINE_H = 11;
    var PANEL_PAD_X  = 6;
    var PANEL_PAD_Y  = 6;
    var PANEL_WIDTH  = 192;

    var ZEBRA_ALPHA     = 0.30;
    var ZEBRA_TILE      = 12;          // per-cell stripes are tiny, so tiles shrink to match
    var ZEBRA_SAMPLE_EVERY = 8;        // frames between canvas reads (getImageData is not free)
    var ZEBRA_GRID_W    = 128;         // downscale grid — smaller cells = more detail
    var ZEBRA_GRID_H    = 72;           // (~4.4 logical px/cell). Cost scales with flagged cells,
                                        // not grid size, so it's fine to push higher if needed.
    var ZEBRA_REL       = 0.55;        // flag cells darker than this fraction of the scene median luma
    var ZEBRA_ABS       = 26;          // always flag cells darker than this (clips / true black), 0..255
    var PANEL_EXCL_W    = 235;         // logical px of the panel region to exempt from zebra
    var PANEL_EXCL_H    = 115;

    var VEL_THRESHOLD = 10;   // px/s
    var VEL_SCALE     = 0.22;
    var VEL_ARROW     = 7;     // arrowhead px

    var WATER_ALPHA = 0.18;

    // -------------------------------------------------------------------------
    // Cached state
    // -------------------------------------------------------------------------
    var stripePattern = null;
    var waterRects    = [];   // [{layer, x, y, tileSize}] REAL terrain-WATER
    var decoRects     = [];   // decorative water: animated tiles whose terrain ISN'T water
    var zebraDarkness = 0;    // sampled [0..1] avg darkness of the scene (panel display)
    var zebraFlags    = null;  // Uint8Array(W*H): 1 = draw stripes on that cell
    var zebraFrame    = 0;
    var zebraSampleCv = null;

    // -------------------------------------------------------------------------
    // Colour helpers
    // -------------------------------------------------------------------------

    /** Green → yellow → red mapped to z height 0 → 80. */
    function zToColor(z) {
        var t = Math.min(1, (z || 0) / 80);
        var r, g, b;
        if (t < 0.5) {
            r = Math.round(60  + (220 - 60)  * (t * 2));
            g = Math.round(220 + (220 - 220) * (t * 2));
            b = Math.round(60  + (40  - 60)  * (t * 2));
        } else {
            r = Math.round(220 + (220 - 220) * ((t - 0.5) * 2));
            g = Math.round(220 + (60  - 220) * ((t - 0.5) * 2));
            b = Math.round(40  + (60  - 40)  * ((t - 0.5) * 2));
        }
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function fmt(v, dec) {
        return (v === undefined || v === null || isNaN(v))
            ? '\u2014'
            : v.toFixed(dec !== undefined ? dec : 0);
    }

    // -------------------------------------------------------------------------
    // WASM lighting diagnostics — reads ig.LightingEngine if the lighting-wasm
    // mod is loaded; returns panel rows, or null when that mod isn't active.
    // -------------------------------------------------------------------------
    function collectWasmRows() {
        var LE = (ig && ig.LightingEngine) || null;
        if (!LE || !LE._diag) return null;
        var d = LE._diag;
        var rows = [
            { l: 'WASM', v: '' },
            { l: 'SAB', v: (d.sab ? 'ON' : 'OFF') + '  cores:' + (d.hw || 1) }
        ];
        if (d.wasm === null) {
            rows.push({ l: 'Build', v: d.ready ? 'warming up…' : 'checking…' });
            return rows;
        }
        rows.push({ l: 'Build', v: d.wasm ? 'compiled' : 'JS fallback' });
        var par = d.wasm ? (d.parallelism + (d.parallelism >= 2 ? ' OK' : ' (1)')) : 'n/a';
        rows.push({ l: 'Thrds', v: par });
        rows.push({ l: 'Test', v: d.lastTest
            ? (d.lastTest.verdict ? 'PASS' : 'FAIL') + '  ' + fmt(d.lastTest.ms, 1) + 'ms'
            : '…' });
        return rows;
    }

    // While the panel is open, re-run the WASM self-test roughly every 2s so the
    // numbers stay live. Harmless when the lighting mod isn't loaded.
    function maybeRunWasmDiag() {
        if (!ig || !ig.LightingEngine) return;
        if (--wasmTick <= 0) {
            wasmTick = 120;
            ig.LightingEngine.diag(function () {});
        }
    }

    // -------------------------------------------------------------------------
    // [6] Unlock-all cheat (all elements + every skill node), fully revertible
    // -------------------------------------------------------------------------
    // Granting every element is trivial (set the core flags). Reverting cleanly
    // is what needs care: we snapshot the element core flags and remember exactly
    // which skill nodes we added, so toggling back off restores the prior state
    // instead of blanket-wiping the tree (which resetSkillTree would do).
    function cheatUnlock() {
        var pm = sc.model.player;
        if (!pm || !sc.PLAYER_CORE || !sc.skilltree) return;

        // 1) Snapshot the six element core flags so we can restore them on revert.
        var cores = {};
        ['ELEMENT_NEUTRAL', 'ELEMENT_HEAT', 'ELEMENT_COLD',
         'ELEMENT_SHOCK',   'ELEMENT_WAVE', 'ELEMENT_CHANGE'].forEach(function (k) {
            cores[k] = !!pm.core[sc.PLAYER_CORE[k]];
        });
        cheatElemSaved = cores;

        // 2) Turn every element on, plus the switch between them.
        pm.setCore(sc.PLAYER_CORE.ELEMENT_NEUTRAL, true);
        pm.setCore(sc.PLAYER_CORE.ELEMENT_HEAT,    true);
        pm.setCore(sc.PLAYER_CORE.ELEMENT_COLD,    true);
        pm.setCore(sc.PLAYER_CORE.ELEMENT_SHOCK,   true);
        pm.setCore(sc.PLAYER_CORE.ELEMENT_WAVE,    true);
        pm.setCore(sc.PLAYER_CORE.ELEMENT_CHANGE,  true);

        // 3) Unlock every node in the skill tree (all elements). Same assignment
        //    the engine's learnSkill() performs; spare per-node stat/observer spam
        //    and notify once at the end.
        var added = {};
        var tree  = sc.skilltree.skills;
        for (var i = 0; i < tree.length; i++) {
            if (!tree[i]) continue;
            if (!pm.skills[i]) added[i] = true;
            pm.skills[i] = tree[i];
        }
        cheatSkillsAdded = added;

        pm.updateStats();
        sc.Model.notifyObserver(pm, sc.PLAYER_MSG.SKILL_CHANGED);
    }

    function cheatLock() {
        var pm = sc.model.player;
        if (!pm) return;

        // Restore the element core flags we captured when the cheat was enabled.
        if (cheatElemSaved) {
            for (var k in cheatElemSaved) {
                if (sc.PLAYER_CORE[k] !== undefined) pm.setCore(sc.PLAYER_CORE[k], cheatElemSaved[k]);
            }
        }
        // Remove only the nodes WE added; leave pre-existing skills untouched.
        if (cheatSkillsAdded) {
            for (var uid in cheatSkillsAdded) pm.skills[uid] = null;
        }

        cheatElemSaved   = null;
        cheatSkillsAdded = null;

        pm.updateStats();
        sc.Model.notifyObserver(pm, sc.PLAYER_MSG.SKILL_CHANGED);
    }

    function toggleCheat() {
        if (!window.sc || !sc.model || !sc.model.player || !sc.skilltree) {
            console.warn('[dev-overlay] [6] cheat: player model not ready yet');
            return;
        }
        cheatAll = !cheatAll;
        if (cheatAll) cheatUnlock(); else cheatLock();
        console.log('[dev-overlay] [6] all elements + skills: ' + (cheatAll ? 'ON' : 'OFF'));
    }

    // -------------------------------------------------------------------------
    // Entity classification
    // -------------------------------------------------------------------------

    /**
     * Returns a display label for an entity:
     *   "PLAYER" for the player entity;
     *   entity.name (uppercased) for any entity explicitly named in the map;
     *   '' for everything else (triggers, decoration, unnamed props).
     *
     * In CrossCode, ig.Game.spawnEntity sets .name from the map JSON only for
     * entities the level designer explicitly named. Decoration and trigger
     * volumes are almost always unnamed, so this avoids the "NPC everywhere"
     * false-positive explosion.
     */
    function entityLabel(entity) {
        if (ig.game.playerEntity && entity === ig.game.playerEntity) return 'PLAYER';
        if (entity.name && typeof entity.name === 'string' && entity.name.length > 0) {
            return entity.name.toUpperCase();
        }
        return '';
    }

    // Kept for potential future use but no longer called from entityLabel.
    function getTypeName(entity) {
        var n = entity.constructor && entity.constructor.name;
        if (!n || n === 'b' || n.length < 3) {
            if (entity.params && entity.params.hp !== undefined) return 'ENEMY';
            return 'ACTOR';
        }
        return n.replace(/^(sc\.|ig\.ENTITY\.)/, '').toUpperCase();
    }

    // -------------------------------------------------------------------------
    // Zebra stripe canvas (built once, lazily)
    // -------------------------------------------------------------------------

    function ensureStripes(ctx) {
        if (stripePattern) return;
        var t   = ZEBRA_TILE;
        var off = document.createElement('canvas');
        off.width  = t * 2;
        off.height = t * 2;
        var g = off.getContext('2d');
        g.fillStyle = '#111';
        g.fillRect(0, 0, t * 2, t * 2);
        g.fillStyle = '#ffd600';
        g.beginPath();
        g.moveTo(0, t);   g.lineTo(t,     0);
        g.lineTo(t * 2, 0); g.lineTo(t * 2, t);
        g.lineTo(t,   t * 2); g.lineTo(0, t * 2);
        g.closePath();
        g.fill();
        stripePattern = ctx.createPattern(off, 'repeat');
    }

    // -------------------------------------------------------------------------
    // Water layer detection
    // -------------------------------------------------------------------------

    function scanWaterTiles() {
        waterRects = [];
        decoRects  = [];
        if (!ig.game || !ig.game.maps || !ig.terrain || !ig.TERRAIN) return;
        var maps = ig.game.maps;
        for (var m = 0; m < maps.length; m++) {
            var layer = maps[m];
            // real water lives on background maps (which own a tileInfo for animations)
            if (!layer.data || !layer.tilesize || layer.type === 'Collision') continue;
            var ts  = layer.tilesize;
            var data = layer.data;
            var H = layer.height || data.length;
            var W = layer.width  || (data[0] ? data[0].length : 0);
            var tileInfo = layer.tileInfo;
            for (var y = 0; y < H; y++) {
                if (!data[y]) continue;
                for (var x = 0; x < W; x++) {
                    var idx = data[y][x];
                    if (!idx) continue;
                    // terrain.json stores non-zero terrains as strings ('6'), and
                    // getTerrainOfMapTile returns them raw; the engine coerces with
                    // `* 1` in Terrain._checkMaps. Without it, '6' === 6 is never true.
                    var t = ig.terrain.getTerrainOfMapTile(layer, idx) * 1;
                    if (t === ig.TERRAIN.WATER || t === ig.TERRAIN.SHALLOW_WATER || t === ig.TERRAIN.BEACH_WATER) {
                        waterRects.push({ layer: layer, x: x, y: y, tileSize: ts });
                        continue;
                    }
                    // Decorative water: animated tile whose terrain is NOT water.
                    // In rookie-harbor.png the flowing canal tiles are animated but
                    // have terrain 0 (NOTHING), unlike Autumn where they're terrain 6.
                    // ig.TileInfo maps every anim frame to itself, so getAnimTiles()
                    // returns the frame array for ANY frame of the loop.
                    if (tileInfo && tileInfo.getAnimTiles && tileInfo.getAnimTiles(idx)) {
                        decoRects.push({ layer: layer, x: x, y: y, tileSize: ts });
                    }
                }
            }
        }
        console.log('[dev-overlay] water scan: ' + maps.length + ' map(s), real=' +
            waterRects.length + ', decorative=' + decoRects.length +
            ', types=(' + maps.map(function (m) { return m.type; }).join(',') + ')');
    }

    // -------------------------------------------------------------------------
    // Zebra shadow/exposure sampler
    // -------------------------------------------------------------------------
    // We want to flag *shadows*: dark patches that stand out against the rest of a
    // scene. Sampling the real rendered canvas, we downscale once every few frames
    // to a small grid, compute each cell's luma, and flag any cell that is markedly
    // darker than the scene median. That highlights isolated shadows in bright maps
    // while leaving a uniformly dark room (whole-screen ambient darkness) mostly
    // unstriped. getImageData is read-only and ignores the context transform, so it
    // returns physical backing-store pixels regardless of zoom / contextScale.
    function sampleZebraExposure() {
        if (!ig.system || !ig.system.canvas) return;
        var w = ZEBRA_GRID_W, h = ZEBRA_GRID_H;
        if (!zebraSampleCv) {
            zebraSampleCv = document.createElement('canvas');
            zebraSampleCv.width  = w;
            zebraSampleCv.height = h;
        }
        var sctx = zebraSampleCv.getContext('2d');
        sctx.clearRect(0, 0, w, h);
        sctx.drawImage(ig.system.canvas, 0, 0, w, h);
        var px = sctx.getImageData(0, 0, w, h).data;
        var n  = w * h;
        var luma = new Uint8Array(n);
        var vals = new Array(n);
        var sum = 0;
        for (var k = 0, i = 0; i < px.length; i += 4, k++) {
            var L = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
            luma[k] = L;
            vals[k] = L;
            sum += L;
        }
        vals.sort(function (a, b) { return a - b; });
        var median = vals[(n / 2) | 0];
        var rel = median * ZEBRA_REL;
        var flags = new Uint8Array(n);
        for (k = 0; k < n; k++) {
            if (luma[k] < rel || luma[k] < ZEBRA_ABS) flags[k] = 1;
        }
        zebraFlags    = flags;
        zebraDarkness = (255 - median) / 255;
    }

    function countFlags() {
        if (!zebraFlags) return 0;
        var c = 0;
        for (var i = 0; i < zebraFlags.length; i++) c += zebraFlags[i];
        return c;
    }

    // -------------------------------------------------------------------------
    // Arrowhead
    // -------------------------------------------------------------------------

    function drawArrow(ctx, tipX, tipY, angle) {
        var s = VEL_ARROW;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - s * Math.cos(angle - 0.4), tipY - s * Math.sin(angle - 0.4));
        ctx.lineTo(tipX - s * Math.cos(angle + 0.4), tipY - s * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
    }

    // =========================================================================
    // The addon
    // =========================================================================

    function defineAddon() {
        if (ig.DevOverlayAddon) return;

        ig.DevOverlayAddon = ig.GameAddon.extend({
            postDrawOrder:    600,   // above ig.gui (500)
            levelLoadedOrder: 0,

            onLevelLoaded: function () { scanWaterTiles(); },

            onPostDraw: function () {
                if (!panelOpen) return;
                if (!ig.system || !ig.system.context) return;

                var ctx   = ig.system.context;
                var scale = ig.system.scale || 1;

                if (showWasm) maybeRunWasmDiag();

                ctx.save();
                // Do NOT resetTransform() here. The context already holds the base
                // contextScale (for high-DPI rendering). We simply draw in the logical 
                // screen space scaled by ig.system.scale, and contextScale handles the rest.

                var cw = ig.system.width  * scale;
                var ch = ig.system.height * scale;

                if (showZebra)  this._drawZebra(ctx, cw, ch, scale);
                if (showWater)  this._drawWater(ctx, scale, cw, ch);
                if (showWires)  this._drawWires(ctx, scale);
                if (showVel)    this._drawVel(ctx, scale);
                                this._drawPanel(ctx, scale);

                ctx.restore();
            },

            // ------------------------------------------------------------------
            // 1. Zebra stripes — exposure warning
            // ------------------------------------------------------------------
            _drawZebra: function (ctx, cw, ch, scale) {
                if (++zebraFrame % ZEBRA_SAMPLE_EVERY === 0) sampleZebraExposure();
                if (!zebraFlags) return;
                ensureStripes(ctx);
                if (!stripePattern) return;
                var w  = ZEBRA_GRID_W, h = ZEBRA_GRID_H;
                var cw2 = cw / w, ch2 = ch / h;
                var panelW = PANEL_EXCL_W * (scale || 1);
                var panelH = PANEL_EXCL_H * (scale || 1);
                ctx.globalAlpha = ZEBRA_ALPHA;
                ctx.fillStyle   = stripePattern;
                for (var j = 0; j < h; j++) {
                    var y0 = j * ch2;
                    for (var i = 0; i < w; i++) {
                        if (!zebraFlags[j * w + i]) continue;
                        var x0 = i * cw2;
                        if (x0 + cw2 <= panelW && y0 + ch2 <= panelH) continue; // panel area
                        ctx.fillRect(x0, y0, cw2 + 0.5, ch2 + 0.5);
                    }
                }
                ctx.globalAlpha = 1;
            },

            // ------------------------------------------------------------------
            // 2. Depth wireframes
            // ------------------------------------------------------------------
            _drawWires: function (ctx, scale) {
                if (!ig.game || !ig.game.shownEntities) return;
                var entities = ig.game.shownEntities;
                var out  = { x: 0, y: 0 };
                var zoom = ig.system.zoom || 1;

                for (var i = 0; i < entities.length; i++) {
                    var entity = entities[i];
                    if (!entity || !entity.coll) continue;
                    var pos  = entity.coll.pos;
                    var size = entity.coll.size;
                    if (!pos || !size) continue;

                    var isPlayer = (ig.game.playerEntity && entity === ig.game.playerEntity);
                    var label    = entityLabel(entity);
                    var isActor  = label !== '';

                    // Project ground-level top-left corner
                    ig.system.getScreenFromMapPos(out, pos.x, pos.y);
                    var sx = out.x  * scale;
                    var sy = out.y  * scale;
                    var sw = size.x * zoom * scale;
                    var sh = size.y * zoom * scale;
                    var z  = pos.z || 0;

                    // --- Player: thick cyan ---
                    if (isPlayer) {
                        ctx.globalAlpha = 1;
                        ctx.strokeStyle = '#00ffff';
                        ctx.lineWidth   = 3;
                    // --- Actors: normal weight, z-coded ---
                    } else if (isActor) {
                        ctx.globalAlpha = 0.82;
                        ctx.strokeStyle = zToColor(z);
                        ctx.lineWidth   = 1.5;
                    // --- Decoration / props: dim & thin ---
                    } else {
                        ctx.globalAlpha = 0.25;
                        ctx.strokeStyle = zToColor(z);
                        ctx.lineWidth   = 1;
                    }

                    // Ground footprint
                    ctx.strokeRect(sx, sy, sw, sh);

                    // tx/ty = the "top face" screen position.
                    // Initialise to the ground position so that when z ≤ 0.5 (entity
                    // is on the floor), labels and pillars still use valid coordinates
                    // instead of leaking stale values from the previous loop iteration
                    // (JS var is function-scoped, not block-scoped).
                    var tx = sx;
                    var ty = sy;

                    // Elevated box + pillars
                    if (z > 0.5) {
                        ig.system.getScreenFromMapPos(out, pos.x, pos.y - z);
                        tx = out.x * scale;
                        ty = out.y * scale;
                        ctx.strokeRect(tx, ty, sw, sh);
                        if (isPlayer || isActor) {
                            ctx.beginPath();
                            ctx.moveTo(sx,      sy);      ctx.lineTo(tx,      ty);
                            ctx.moveTo(sx + sw, sy);      ctx.lineTo(tx + sw, ty);
                            ctx.moveTo(sx,      sy + sh); ctx.lineTo(tx,      ty + sh);
                            ctx.moveTo(sx + sw, sy + sh); ctx.lineTo(tx + sw, ty + sh);
                            ctx.stroke();
                        }
                    }

                    // Label (player + named entities only)
                    if (label) {
                        // tx/ty is now always valid (defaults to sx/sy when z ≤ 0.5)
                        var fs = Math.round((isPlayer ? 11 : 9) * scale);
                        ctx.font        = 'bold ' + fs + 'px monospace';
                        ctx.globalAlpha = 1;
                        // Shadow
                        ctx.fillStyle   = 'rgba(0,0,0,0.8)';
                        ctx.fillText(label, tx + scale, ty - 2 * scale + scale);
                        // Text
                        ctx.fillStyle   = isPlayer ? '#00ffff' : '#ffffff';
                        ctx.fillText(label, tx, ty - 2 * scale);
                    }
                }

                ctx.globalAlpha = 1;
                ctx.lineWidth   = 1;
            },

            // ------------------------------------------------------------------
            // 3. Water masks
            // ------------------------------------------------------------------
            _drawWater: function (ctx, scale, cw, ch) {
                var self = this;
                if (waterRects.length)
                    this._drawWaterLayer(ctx, scale, cw, ch, waterRects,
                        'rgba(0,220,255,' + WATER_ALPHA + ')', 'rgba(0,180,255,0.55)');
                // Decorative water is drawn a distinct colour so it can be told apart
                // from genuine terrain-WATER tiles (which the ship/lethality uses).
                if (decoRects.length)
                    this._drawWaterLayer(ctx, scale, cw, ch, decoRects,
                        'rgba(255,0,220,' + WATER_ALPHA + ')', 'rgba(255,0,180,0.55)');
            },

            // Shared rect draw: avoids duplicating the scroll + culling math.
            _drawWaterLayer: function (ctx, scale, cw, ch, rects, fillStyle, strokeStyle) {
                ctx.fillStyle   = fillStyle;
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth   = 1;
                ctx.globalAlpha = 1;
                for (var i = 0; i < rects.length; i++) {
                    var wr = rects[i];
                    var lyr = wr.layer;
                    var ts  = wr.tileSize;
                    var scrollX = (lyr.scroll && lyr.scroll.x) ? lyr.scroll.x : 0;
                    var scrollY = (lyr.scroll && lyr.scroll.y) ? lyr.scroll.y : 0;
                    var sx = (wr.x * ts - scrollX) * scale;
                    var sy = (wr.y * ts - scrollY) * scale;
                    var sw = ts * scale;
                    var sh = ts * scale;
                    if (sx + sw < 0 || sy + sh < 0 || sx > cw || sy > ch) continue;
                    ctx.fillRect(sx, sy, sw, sh);
                    ctx.strokeRect(sx, sy, sw, sh);
                }
            },

            // ------------------------------------------------------------------
            // 4. Velocity vectors
            // ------------------------------------------------------------------
            _drawVel: function (ctx, scale) {
                if (!ig.game || !ig.game.shownEntities) return;
                var entities = ig.game.shownEntities;
                var out  = { x: 0, y: 0 };
                var zoom = ig.system.zoom || 1;
                for (var i = 0; i < entities.length; i++) {
                    var entity = entities[i];
                    if (!entity || !entity.coll || !entity.coll.vel) continue;
                    var vel   = entity.coll.vel;
                    var pos   = entity.coll.pos;
                    var size  = entity.coll.size;
                    var speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
                    if (speed < VEL_THRESHOLD) continue;

                    ig.system.getScreenFromMapPos(out,
                        pos.x + size.x / 2,
                        pos.y + size.y / 2 - (pos.z || 0));
                    var cx = out.x * scale;
                    var cy = out.y * scale;
                    var dx = vel.x * VEL_SCALE * zoom;
                    var dy = vel.y * VEL_SCALE * zoom;
                    var tipX = cx + dx;
                    var tipY = cy + dy;

                    var t = Math.min(1, speed / 800);
                    var r = Math.round(200 + 55 * t);
                    var g = Math.round(80  - 60 * t);
                    var color = 'rgb(' + r + ',' + g + ',0)';

                    ctx.strokeStyle = color;
                    ctx.fillStyle   = color;
                    ctx.lineWidth   = 2;
                    ctx.globalAlpha = 0.88;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(tipX, tipY);
                    ctx.stroke();
                    drawArrow(ctx, tipX, tipY, Math.atan2(dy, dx));

                    // Speed label
                    var fs = Math.round(9 * scale);
                    ctx.font        = fs + 'px monospace';
                    ctx.fillStyle   = '#fff';
                    ctx.globalAlpha = 0.72;
                    ctx.fillText(Math.round(speed) + ' px/s', cx + 4, cy - 4);
                }
                ctx.globalAlpha = 1;
                ctx.lineWidth   = 1;
            },

            // ------------------------------------------------------------------
            // 5. Metric panel
            // ------------------------------------------------------------------
            _drawPanel: function (ctx, scale) {
                var logW = ig.system.width;
                var logH = ig.system.height;
                var ctxW = ig.system.canvas ? ig.system.canvas.width : (logW * scale);
                var ctxH = ig.system.canvas ? ig.system.canvas.height : (logH * scale);
                var scrX = ig.game.screen ? ig.game.screen.x : 0;
                var scrY = ig.game.screen ? ig.game.screen.y : 0;
                // Camera center derived from screen origin (ig.camera writes _currentPos
                // to ig.game.screen; _currentPos is private — derive it back)
                var camX = fmt(scrX + logW / 2, 1);
                var camY = fmt(scrY + logH / 2, 1);
                var fps  = ig.system.actualTick > 0 ? Math.round(1 / ig.system.actualTick) : 0;
                var spd  = ig.system.actualTick > 0 ? ig.system.tick / ig.system.actualTick : 1;
                var zoom = fmt(ig.system.zoom, 2);
                var plx = '\u2014', ply = '\u2014', plz = '\u2014';
                var pvx = '\u2014', pvy = '\u2014', pvz = '\u2014';
                var player = ig.game.playerEntity;
                if (player && player.coll) {
                    if (player.coll.pos) {
                        plx = fmt(player.coll.pos.x, 1);
                        ply = fmt(player.coll.pos.y, 1);
                        plz = fmt(player.coll.pos.z, 1);
                    }
                    if (player.coll.vel) {
                        pvx = fmt(player.coll.vel.x, 1);
                        pvy = fmt(player.coll.vel.y, 1);
                        pvz = fmt(player.coll.vel.z, 1);
                    }
                }

                var metrics = [
                    { l: 'FPS',    v: fps + '   \u00d7' + fmt(spd, 2) + ' speed' },
                    { l: 'Logic',  v: logW + '\u00d7' + logH },
                    { l: 'Canvas', v: ctxW + '\u00d7' + ctxH },
                    { l: 'Zoom',   v: zoom + '   scale:' + scale },
                    { l: 'Screen', v: 'x:' + fmt(scrX, 1) + '  y:' + fmt(scrY, 1) },
                    { l: 'Cam',    v: 'x:' + camX + '  y:' + camY },
                    { l: 'Zebra',  v: 'f:' + countFlags() + ' dk:' + fmt(zebraDarkness, 2) },
                    { l: 'Water', v: 'real:' + waterRects.length + ' deco:' + decoRects.length },
                    { l: 'Pl.pos', v: 'x:' + plx + '  y:' + ply + '  z:' + plz },
                    { l: 'Pl.vel', v: 'x:' + pvx + '  y:' + pvy + '  z:' + pvz },
                ];

                if (showWasm && ig.LightingEngine) {
                    var wasmRows = collectWasmRows();
                    if (wasmRows) metrics = metrics.concat(wasmRows);
                }

                // Toggle row  — shows which sub-overlays are currently active
                var toggleStr1 = '[1]Wires:' + (showWires ? 'ON ' : 'OFF') + ' [2]Water:' + (showWater ? 'ON ' : 'OFF');
                var toggleStr2 = '[3]Vel:' + (showVel ? 'ON ' : 'OFF') + '   [4]Zebra:' + (showZebra ? 'ON' : 'OFF') + '  [5]Wasm:' + (showWasm ? 'ON' : 'OFF');
                var toggleStr3 = '[6]UnlockAll: ' + (cheatAll ? 'ON' : 'OFF');

                // z-legend row
                var legendLabel = 'z-clr';
                var legendSwatches = [
                    { t: 0,   c: zToColor(0)  },
                    { t: 0.5, c: zToColor(40) },
                    { t: 1,   c: zToColor(80) },
                ];

                var lineCount  = metrics.length + 5;  // +header +3 toggles +legend
                var fs         = Math.round(9 * scale);
                var lh         = Math.round(PANEL_LINE_H * scale);
                var padX       = Math.round(PANEL_PAD_X * scale);
                var padY       = Math.round(PANEL_PAD_Y * scale);
                var panelW     = Math.round(PANEL_WIDTH * scale);
                var panelH     = padY * 2 + (lineCount) * lh + Math.round(4 * scale);
                var px         = Math.round(PANEL_X * scale);
                var py         = Math.round(PANEL_Y * scale);

                // Background with rounded corners
                ctx.fillStyle = 'rgba(0,0,0,0.66)';
                var r = Math.round(4 * scale);
                ctx.beginPath();
                ctx.moveTo(px + r, py);
                ctx.lineTo(px + panelW - r, py);
                ctx.arcTo(px + panelW, py, px + panelW, py + r, r);
                ctx.lineTo(px + panelW, py + panelH - r);
                ctx.arcTo(px + panelW, py + panelH, px + panelW - r, py + panelH, r);
                ctx.lineTo(px + r, py + panelH);
                ctx.arcTo(px, py + panelH, px, py + panelH - r, r);
                ctx.lineTo(px, py + r);
                ctx.arcTo(px, py, px + r, py, r);
                ctx.closePath();
                ctx.fill();

                ctx.font = 'bold ' + fs + 'px "Courier New", monospace';
                ctx.globalAlpha = 1;
                var bx  = px + padX;
                var by  = py + padY + fs;
                var lbW = Math.round(42 * scale);  // label column width

                // Header
                ctx.fillStyle = '#aaff88';
                ctx.fillText('[ DEV OVERLAY  F3 ] v' + MOD_VERSION, bx, by);

                // Metric rows
                ctx.font = fs + 'px "Courier New", monospace';
                for (var i = 0; i < metrics.length; i++) {
                    var ry = by + (i + 1) * lh;
                    // Shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillText(metrics[i].l, bx + 1,       ry + 1);
                    ctx.fillText(metrics[i].v, bx + lbW + 1, ry + 1);
                    // Label
                    ctx.fillStyle = '#8ecfff';
                    ctx.fillText(metrics[i].l, bx, ry);
                    // Value
                    ctx.fillStyle = '#e8e8e8';
                    ctx.fillText(metrics[i].v, bx + lbW, ry);
                }

                // Toggle rows
                var tsy1 = by + (metrics.length + 1) * lh;
                var tsy2 = by + (metrics.length + 2) * lh;
                var tsy3 = by + (metrics.length + 3) * lh;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillText(toggleStr1, bx + 1, tsy1 + 1);
                ctx.fillText(toggleStr2, bx + 1, tsy2 + 1);
                ctx.fillText(toggleStr3, bx + 1, tsy3 + 1);
                ctx.fillStyle = '#cccccc';
                ctx.fillText(toggleStr1, bx, tsy1);
                ctx.fillText(toggleStr2, bx, tsy2);
                ctx.fillText(toggleStr3, bx, tsy3);

                // z-color legend
                var lgy = by + (metrics.length + 4) * lh;
                ctx.fillStyle = '#8ecfff';
                ctx.fillText(legendLabel, bx, lgy);
                var swX = bx + lbW;
                var swSz = Math.round(8 * scale);
                var labels = ['z=0', 'z=40', 'z=80'];
                for (var j = 0; j < legendSwatches.length; j++) {
                    var swXj = swX + j * Math.round(42 * scale);
                    ctx.fillStyle   = legendSwatches[j].c;
                    ctx.globalAlpha = 0.9;
                    ctx.fillRect(swXj, lgy - swSz + Math.round(1 * scale), swSz, swSz);
                    ctx.globalAlpha = 1;
                    ctx.fillStyle   = '#e8e8e8';
                    ctx.fillText(labels[j], swXj + swSz + Math.round(3 * scale), lgy);
                }
            }
        });
    }

    // =========================================================================
    // Boot
    // =========================================================================

    function boot() {
        if (!window.ig || !ig.GameAddon || !ig.game ||
            !ig.game.addons || !ig.game.addons.all || !ig.game.addons.postDraw) {
            console.warn('[dev-overlay] ig.game not ready — retrying...');
            setTimeout(boot, 100);
            return;
        }
        if (ig.devOverlayAddon) return;

        defineAddon();

        var addon = ig.devOverlayAddon = new ig.DevOverlayAddon();

        ig.game.addons.all.push(addon);

        ig.game.addons.postDraw.push(addon);
        ig.game.addons.postDraw.sort(function (a, b) {
            return (a.postDrawOrder || 0) - (b.postDrawOrder || 0);
        });

        ig.game.addons.levelLoaded.push(addon);
        ig.game.addons.levelLoaded.sort(function (a, b) {
            return (a.levelLoadedOrder || 0) - (b.levelLoadedOrder || 0);
        });

        if (ig.game.maps && ig.game.maps.length > 0) scanWaterTiles();

        document.addEventListener('keydown', function (e) {
            var k = (e.key || '').toLowerCase();

            if (k === 'f3') {
                e.preventDefault();
                panelOpen = !panelOpen;
                if (!panelOpen) stripePattern = null;
                console.log('[dev-overlay] ' + (panelOpen ? 'ON' : 'OFF'));
                return;
            }

                if (k === '6') { toggleCheat(); return; }

            if (!panelOpen) return;   // sub-toggles only matter while open

            if (k === '1') { showWires = !showWires;  console.log('[dev-overlay] wireframes ' + (showWires ? 'ON' : 'OFF')); }
            if (k === '2') { showWater = !showWater;  console.log('[dev-overlay] water masks ' + (showWater ? 'ON' : 'OFF')); }
            if (k === '3') { showVel   = !showVel;    console.log('[dev-overlay] vel vectors ' + (showVel   ? 'ON' : 'OFF')); }
            if (k === '4') { showZebra = !showZebra;  stripePattern = null; console.log('[dev-overlay] zebra ' + (showZebra ? 'ON' : 'OFF')); }
            if (k === '5') { showWasm = !showWasm;  wasmTick = 0; console.log('[dev-overlay] wasm self-test ' + (showWasm ? 'ON' : 'OFF')); }
            if (k === 'w') { if (ig.LightingEngine) ig.LightingEngine.diag(function (d) { console.log('[dev-overlay] WASM self-test:', d); }); }
        });

        console.log('[dev-overlay] v' + MOD_VERSION +
            ' loaded — F3 to toggle, then 1/2/3/4/5 for sub-overlays (W = WASM self-test).');
    }

    boot();

})();
