"use strict";

// ===========================================================================
// Ambient Nights v1.4.0 — rebuilt on the deobfuscated engine's own systems.
//
//   * Day/night cycle: a self-contained clock advanced in onDeferredUpdate.
//     Night darkness is layered onto ig.light.lightMapDarkness *after* the
//     weather addon animates it each frame, so the weather's own transitions
//     stay smooth and light sources (lamps, glows) keep shining at night.
//   * Weather control: uses the real ig.WEATHER_TYPES names and the real
//     ig.weather.setWeather(new ig.WeatherInstance(name), immediately) API
//     with smooth 2s transitions, re-applied after every level load (the
//     engine resets to the map's weather in its own onLevelLoaded).
//   * Runs at poststart (after game init), so it wires its addon directly
//     into the live game's sorted addon arrays instead of ig.addGameAddon.
// ===========================================================================

// --- live option access ----------------------------------------------------
// Settings live in the game's own options menu (sc.OPTIONS_DEFINITION entries
// prefixed `ambience-`, registered at boot). Values persist via ig.storage.
const AMBIENT_OPTION_DEFAULTS = {
    'time-ratio': 1,
    'manual-time': false,
    'time-of-day': 12,
    'show-clock': true,
    'weather-mode': 1,
    'persistent-weather': true,
    'darkness-intensity': 0.7,
    'lockdown': false
};

function getOpt(key, fallback) {
    // addon calls use camelCase ('weatherMode'); options are kebab-case
    var optKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (window.sc && sc.options && sc.OPTIONS_DEFINITION && sc.OPTIONS_DEFINITION['ambience-' + optKey]) {
        var v = sc.options.get('ambience-' + optKey);
        if (v !== null && v !== undefined) return v;
    }
    return fallback !== undefined ? fallback : AMBIENT_OPTION_DEFAULTS[optKey];
}

const WEATHER_MODE_LABELS = { 1: 'Auto', 2: 'Dynamic', 3: 'Clear', 4: 'Clouds', 5: 'Fog', 6: 'Rain', 7: 'Heavy Rain', 8: 'Snow', 9: 'Sandstorm' };

/** Format an option value for the game's slider thumb label. */
function formatAmbienceValue(name, v) {
    if (name === 'ambience-time-ratio') return v.toFixed(1) + 'x';
    if (name === 'ambience-time-of-day') {
        var h = Math.floor(v);
        var m = Math.round((v - h) * 60);
        if (m === 60) { h = (h + 1) % 24; m = 0; }
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    if (name === 'ambience-weather-mode') return WEATHER_MODE_LABELS[Math.round(v)] || String(v);
    if (name === 'ambience-darkness-intensity') return v.toFixed(1);
    return String(v);
}

function makeSliderData(values) {
    var d = {};
    for (var i = 0; i < values.length; ++i) d[i] = values[i];
    return d;
}

// Slider value tables (game OBJECT_SLIDER expects an index→value map).
const AMBIENT_TIME_RATIO = makeSliderData([0.5, 1, 1.5, 2, 3, 4, 6, 8, 10]);
const AMBIENT_TIME_OF_DAY = (function () {
    var d = {};
    for (var h = 0, i = 0; h <= 24; h += 0.5, i++) d[i] = h;
    return d;
})();
const AMBIENT_WEATHER_MODE = makeSliderData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const AMBIENT_DARKNESS = makeSliderData([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);

// ===========================================================================
// Notification UI (DOM overlay, top right)
// ===========================================================================
(function () {
    const fontCss = `
  @font-face {
    font-family: 'PixelHallfetica';
    src: url('/assets/impact/page/css/fonts/PixelHallfeticaJP10P-Regular.ttf') format('truetype'),
         url('assets/impact/page/css/fonts/PixelHallfeticaJP10P-Regular.ttf') format('truetype');
  }
`;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = fontCss;
    document.head.appendChild(styleSheet);

    const uiHtml = `
  <div id="ambient-ui-container" style="position:fixed; top:20px; right:30px; display:flex; align-items:center; gap:10px; z-index:999999; pointer-events:none; font-family:'PixelHallfetica', sans-serif; color:white; text-shadow:2px 2px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black, 1px 1px 0px black; opacity:0; transition:opacity 0.5s ease-in-out;">
    <div id="ambient-ui-text" style="font-size:16px;">Weather</div>
    <img id="ambient-ui-icon" src="" style="width:48px; height:48px; image-rendering:pixelated;" />
  </div>
`;
    document.body.insertAdjacentHTML('beforeend', uiHtml);
})();

let ambientNotificationTimeout = null;

function triggerAmbientNotification(text, iconPath) {
    const container = document.getElementById('ambient-ui-container');
    const textEl = document.getElementById('ambient-ui-text');
    const iconEl = document.getElementById('ambient-ui-icon');

    if (!container || !textEl || !iconEl) return;

    textEl.innerText = text;
    iconEl.src = `/assets/mods/ambient-nights/assets/media/${iconPath}`;
    iconEl.onerror = function () {
        this.src = `mods/ambient-nights/assets/media/${iconPath}`;
    };

    container.style.opacity = "1";

    if (ambientNotificationTimeout) {
        clearTimeout(ambientNotificationTimeout);
    }

    ambientNotificationTimeout = setTimeout(() => {
        container.style.opacity = "0";
    }, 3000);
}

// ===========================================================================
// Weather display helpers (real ig.WEATHER_TYPES names)
// ===========================================================================
const WEATHER_LABELS = {
    NONE: 'Clear',
    DUSTY: 'Dusty',
    CLOUDY: 'Cloudy',
    BEFORE_RAIN: 'Overcast',
    RAINY_WEAK: 'Rain',
    RAINY_MEDIUM: 'Rain',
    RAINY_STRONG: 'Heavy Rain',
    BERGEN_SNOW: 'Snow',
    BERGEN_SNOW_START: 'Snow',
    HEAT_SANDSTORM: 'Sandstorm',
    HEAT_SANDSTORM_LIGHT: 'Sandstorm'
};

function weatherCategory(name) {
    if (!name) return 'fine';
    const n = String(name).toUpperCase();
    if (n.indexOf('RAIN') !== -1 || n.indexOf('DRIZZLE') !== -1) return 'rain';
    if (n.indexOf('SNOW') !== -1 || n.indexOf('SANDSTORM') !== -1) return 'overcast';
    if (n.indexOf('CLOUD') !== -1 || n.indexOf('BEFORE_RAIN') !== -1) return 'clouds';
    return 'fine';
}

function weatherLabel(name) {
    return WEATHER_LABELS[name] || 'Clear';
}

// Weather types that describe interiors (caves, buildings, dungeons) with
// their own designed lighting — curated from ig.WEATHER_TYPES. The night
// cycle is skipped on these maps.
const INDOOR_WEATHERS = [
    'CARGO_HOLD', 'DUSTY', 'ROOKIE_HARBOR_INNER', 'EVO_VILLAGE_INNER', 'EXPO_SPACE',
    'OLD_HIDEOUT_INNER', 'OLD_HIDEOUT_OFFICE', 'RHOMBUS_DNG_TOP', 'RHOMBUS_DUNGEON',
    'CAVE', 'CAVE_BERGEN', 'BERGEN_INNER', 'COLD_DUNGEON', 'COLD_DUNGEON_DARK',
    'COLD_DUNGEON_POST_BOSS', 'HEAT_VILLAGE_INNER', 'HEAT_VILLAGE_INNER_DUSTY',
    'HEAT_DUNGEON', 'HEAT_DUNGEON_MIDBOSS', 'HEAT_DUNGEON_COAL', 'HEAT_DUNGEON_BOSS',
    'UNKNOWN_INNER', 'OFFICE', 'LOBBY', 'LOBBY_DARK', 'FLAT', 'FLAT_DARK',
    'JUNGLE_CITY_INNER', 'WAVE_DNG_INNER', 'WAVE_DNG_INNER_FISH', 'SHOCK_DNG_INNER',
    'TREE_DNG_INNER', 'TREE_INNER', 'TREE_INNER_INFESTED', 'TREE_DNG_INNER_WAVE',
    'TREE_DNG_INNER_SHOCK', 'SPOOKY_INNER', 'CAVE_FOREST', 'CAVE_ARID',
    'CAVE_ARID_CLOSER', 'ARID_INSIDE', 'ARID_ELEVATOR_UP', 'ARID_ELEVATOR_DOWN',
    'ARID_END_SCENE', 'ARID_BETWEEN', 'ARID_DNG_OUTSIDE', 'SAPPHIRE_RIDGE_BUILDING',
    'SAPPHIRE_RIDGE_INNER', 'FLASHBACK_OFFICE', 'FLASHBACK_HIDEOUT',
    'FLASHBACK_HIDEOUT_INNER', 'FLASHBACK_ARID', 'FLASHBACK_DIAGRAM',
    'RHOMBUS_SQUARE_INNER', 'FINAL_DNG_INNER', 'FINAL_DNG_INNER_TELEPORT',
    'FINAL_DNG_INNER_BATTLE', 'GAUTHAM_ROOM', 'LAB', 'DREAM'
];

// Weather mode slider: 1 Auto, 2 Dynamic, 3 Clear, 4 Clouds, 5 Fog,
// 6 Rain, 7 Heavy Rain, 8 Snow, 9 Sandstorm.
const MODE_WEATHER = {
    3: 'NONE',
    4: 'CLOUDY',
    5: 'BEFORE_RAIN',
    6: 'RAINY_MEDIUM',
    7: 'RAINY_STRONG',
    8: 'BERGEN_SNOW',
    9: 'HEAT_SANDSTORM'
};

// Weighted weather pools for the Dynamic mode (weights are integers, 0-100).
const DAY_WEATHER_POOL = [
    { n: 'NONE', w: 40 },
    { n: 'CLOUDY', w: 25 },
    { n: 'RAINY_MEDIUM', w: 18 },
    { n: 'RAINY_STRONG', w: 10 },
    { n: 'BERGEN_SNOW', w: 7 }
];
const NIGHT_WEATHER_POOL = [
    { n: 'NONE', w: 30 },
    { n: 'CLOUDY', w: 25 },
    { n: 'BEFORE_RAIN', w: 20 },
    { n: 'RAINY_WEAK', w: 15 },
    { n: 'RAINY_MEDIUM', w: 10 }
];

function smoothstep(p) {
    return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
}

function lerp3(a, b, p) {
    return [
        Math.round(a[0] + (b[0] - a[0]) * p),
        Math.round(a[1] + (b[1] - a[1]) * p),
        Math.round(a[2] + (b[2] - a[2]) * p)
    ];
}

// ===========================================================================
// Register the settings in the game's own options menu (General tab, under
// the "Ambient Nights" header divider). Rows are built live from
// sc.OPTIONS_DEFINITION, so adding entries here is enough; values are seeded
// into sc.options.values (OptionModel.init already ran at game start) and
// persist through the normal storage path.
// ===========================================================================
function registerGameOptions() {
    if (window.__ambientGameOptionsRegistered) return;
    if (!window.sc || !sc.OPTIONS_DEFINITION || !sc.options || !sc.OPTION_CATEGORY || !sc.OPTION_TYPES ||
        !sc.OPTION_GUIS || !sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER]) {
        setTimeout(registerGameOptions, 50);
        return;
    }
    window.__ambientGameOptionsRegistered = true;

    var OPT = sc.OPTIONS_DEFINITION;
    var CAT = sc.OPTION_CATEGORY;

    OPT['ambience-time-ratio'] = { type: 'OBJECT_SLIDER', data: AMBIENT_TIME_RATIO, init: 1, cat: CAT.GENERAL, fill: true, hasDivider: true, header: 'ambient-nights' };
    OPT['ambience-manual-time'] = { type: 'CHECKBOX', init: false, cat: CAT.GENERAL };
    OPT['ambience-time-of-day'] = { type: 'OBJECT_SLIDER', data: AMBIENT_TIME_OF_DAY, init: 12, cat: CAT.GENERAL, fill: true };
    OPT['ambience-show-clock'] = { type: 'CHECKBOX', init: true, cat: CAT.GENERAL };
    OPT['ambience-weather-mode'] = { type: 'OBJECT_SLIDER', data: AMBIENT_WEATHER_MODE, init: 1, cat: CAT.GENERAL, fill: true, hasDivider: true, header: 'ambient-nights' };
    OPT['ambience-persistent-weather'] = { type: 'CHECKBOX', init: true, cat: CAT.GENERAL };
    OPT['ambience-darkness-intensity'] = { type: 'OBJECT_SLIDER', data: AMBIENT_DARKNESS, init: 0.7, cat: CAT.GENERAL, fill: true };
    OPT['ambience-lockdown'] = { type: 'CHECKBOX', init: false, cat: CAT.GENERAL };

    // Seed values — sc.OptionModel.init already ran, so add ours manually.
    for (var key in OPT) {
        if (key.indexOf('ambience-') === 0 && sc.options.values) {
            sc.options.values[key] = OPT[key].init;
        }
    }

    // Re-apply the mod whenever an ambience option changes in the menu.
    sc.OptionModel.inject({
        set: function (key, value, isLocal) {
            this.parent(key, value, isLocal);
            if (key && key.indexOf('ambience-') === 0 && window.__ambientApplySettings) {
                window.__ambientApplySettings();
            }
        }
    });

    // Nicer thumb labels for our sliders (game default shows position numbers).
    sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
        init: function (a, b, d) {
            this.parent(a, b, d);
            var name = a && a.optionName;
            if (name && name.indexOf('ambience-') === 0 && this.slider && this.slider.thumb) {
                if (this.currentNumber && this.currentNumber.remove) this.currentNumber.remove(true);
                this.currentNumber = new sc.TextGui('', { font: sc.fontsystem.tinyFont });
                this.currentNumber.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.slider.thumb.addChildGui(this.currentNumber);
                this._ambienceFormatted = true;
                this.updateNumberDisplay();
            }
        },
        updateNumberDisplay: function () {
            if (this._ambienceFormatted && this.base) {
                var name = this.base.optionName;
                var v = sc.options.get(name, this.base.local);
                this.currentNumber.setText(formatAmbienceValue(name, v));
                return;
            }
            this.parent();
        }
    });
}

// ===========================================================================
// Boot: wait for the engine classes. At poststart the game is already
// running, so ig.GameAddon / ig.Weather / sc.GameModel all exist — the wait
// is just a safety net (e.g. if the mod is ever moved to an earlier hook).
// ===========================================================================
function bootAmbience() {
    if (!window.ig || !ig.GameAddon || !ig.Weather || !window.sc || !sc.GameModel || !ig.WeatherInstance ||
        !ig.GuiElementBase || !sc.TextGui || !sc.fontsystem) {
        setTimeout(bootAmbience, 50);
        return;
    }

    registerGameOptions();

    // ---- Night Lockdown: block fast-travel at night (opt-in) ----
    sc.GameModel.inject({
        isTeleportBlocked: function () {
            if (getOpt('lockdown', false) && ig.ambienceAddon &&
                ig.ambienceAddon.currentPhase === 'NIGHT' && !ig.ambienceAddon.isIndoors) {
                return true;
            }
            return this.parent();
        }
    });

    // =======================================================================
    // 1. CLOCK HUD
    // =======================================================================
    /** Small in-game clock, top-left; hidden in menus/title/cutscenes. */
    ig.AmbienceClockGui = ig.GuiElementBase.extend({
        init: function () {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(8, 8);
            this.hook.zIndex = 999998;
            this.text = new sc.TextGui('', { font: sc.fontsystem.smallFont });
            this.addChildGui(this.text);
        },

        update: function () {
            this.parent();
            var a = ig.ambienceAddon;
            this.hook.localAlpha = (a && a._inGame()) ? 1 : 0;
            if (a) {
                var totalMin = Math.round(a.timeOfDay * 24 * 60);
                var h = Math.floor(totalMin / 60) % 24;
                var m = totalMin % 60;
                this.text.setText((h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m);
            }
        }
    });

    // =======================================================================
    // 2. THE CORE ADDON
    // =======================================================================
    ig.AmbienceAddon = ig.GameAddon.extend({
        name: 'AmbienceAddon',
        registered: false,
        levelLoadedOrder: 101,      // after ig.weather (100) applied the map weather
        deferredUpdateOrder: 1,     // after ig.weather (0) animated the light map
        postDrawOrder: 300,         // between tilt-shift (250) and ig.gui (500)

        timeOfDay: 0.5,             // 0..1, starts mid-day
        currentPhase: 'DAY',
        nightAlpha: 0,              // smoothed toward nightTarget
        nightTarget: 0,
        weatherTimer: 0,
        isIndoors: false,
        activeWeatherName: null,
        _weatherInstances: {},
        _starTime: 0,
        _stars: null,
        _clock: null,

        /** ig.WeatherInstance is ig.Cacheable — the same instance is reused per name. */
        getWeatherInstance: function (name) {
            if (!this._weatherInstances[name]) {
                this._weatherInstances[name] = new ig.WeatherInstance(name);
            }
            return this._weatherInstances[name];
        },

        /** Runs after the map is loaded; ig.weather has resolved levelWeather. */
        onLevelLoaded: function () {
            this.isIndoors = this._detectIndoors();
            this._applyMode(true);
        },

        /** Per-frame: advance the clock, weather rolls, and night darkness. */
        onDeferredUpdate: function () {
            if (!ig.system || !ig.system.tick) return;

            // Manual time applies even while paused, so dragging the slider in
            // the settings menu updates the world live.
            if (getOpt('manualTime', false)) {
                this._syncManualTime();
            } else if (!ig.game.paused && !ig.loading) {
                // --- advance the clock (a full day = 1200s at 1x) ---
                var ratio = Math.max(0.1, getOpt('timeRatio', 1));
                this.timeOfDay = (this.timeOfDay + ig.system.tick * ratio / 1200) % 1;
            }
            if (ig.game.paused || ig.loading) return;

            this._setPhase(this._phaseForTime(this.timeOfDay));

            // --- darkness target (smoothed so dusk/dawn ramp gradually) ---
            if (!getOpt('manualTime', false)) {
                this.nightTarget = this.isIndoors ? 0 : this._darknessForPhase();
                this.nightAlpha += (this.nightTarget - this.nightAlpha) * Math.min(1, ig.system.tick * 2.5);
                if (this.nightAlpha < 0.0005) this.nightAlpha = 0;
            }

            // --- star twinkle clock + clock HUD upkeep ---
            this._starTime += ig.system.tick;
            this._ensureClock();

            // --- weather rolling (Random mode, every ~90-150s) ---
            if (!this.isIndoors && Math.round(getOpt('weatherMode', 1)) === 2) {
                this.weatherTimer += ig.system.tick;
                if (this.weatherTimer > 90 + Math.random() * 60) {
                    this.weatherTimer = 0;
                    this._rollWeather(false);
                }
            }

            // --- layer night darkness onto the weather's light map (secondary) ---
            // Where the engine's light system renders (maps with a light layer),
            // this dims the baked lightmap so lamps keep glowing — the game's own
            // "dark map" look. Reading the weather's *target* (not the live value
            // we just wrote) avoids compounding. Written every frame so the map
            // returns to its base darkness during the day.
            if (!this.isIndoors && ig.light) {
                var base = 0.6;
                if (ig.weather && ig.weather.lightMapDarkness &&
                    typeof ig.weather.lightMapDarkness.target === 'number') {
                    base = ig.weather.lightMapDarkness.target;
                }
                ig.light.lightMapDarkness = base + this.nightAlpha * (1 - base) * 0.5;
            }
        },

        /**
         * The tint color + strength for the current phase:
         *   NIGHT   → blue-black, crossfading from sunset orange just after
         *             dusk and toward light blue just before dawn
         *   SUNSET  → warm orange, fading in with the darkness
         *   SUNRISE → light blue, fading out as the sun rises
         * DAY      → null (no tint)
         * alphaScale keeps dusk/dawn subtler than full night.
         */
        _tint: function () {
            var t = this.timeOfDay;
            var phase = this.currentPhase;
            if (phase === 'DAY') return null;

            var night = [6, 8, 28];
            var sunset = [255, 138, 58];
            var dawn = [125, 172, 255];
            var color = night;
            var alphaScale = 0.7;

            if (phase === 'SUNSET') {
                var p = smoothstep((t - 0.75) / 0.10);
                color = lerp3([255, 236, 210], sunset, p);
                alphaScale = 0.5;
            } else if (phase === 'SUNRISE') {
                var q = smoothstep((t - 0.25) / 0.10);
                color = lerp3(dawn, [255, 244, 232], q);
                alphaScale = 0.5;
            } else if (t >= 0.85 && t < 0.90) {
                // just after dusk: orange → blue-black
                color = lerp3(sunset, night, smoothstep((t - 0.85) / 0.05));
            } else if (t >= 0.20 && t < 0.25) {
                // just before dawn: blue-black → light blue
                color = lerp3(night, dawn, smoothstep((t - 0.20) / 0.05));
            }

            return { color: color, alphaScale: alphaScale };
        },

        /**
         * Guaranteed-visible phase tint, drawn directly on the screen between
         * the world and the HUD (postDraw 300, ig.gui draws at 500). A vertical
         * gradient — heavier toward the sky. Carries the night/dusk/dawn look
         * regardless of the map's light layer / lighting option.
         */
        onPostDraw: function () {
            if (this.isIndoors || this.nightAlpha <= 0.001 || !ig.system || !ig.system.context) return;
            var ctx = ig.system.context;
            var tint = this._tint();
            if (tint) {
                var a = Math.max(0, Math.min(1, this.nightAlpha * tint.alphaScale));
                if (a > 0.001) {
                    var c = tint.color;
                    ctx.save();
                    ctx.globalCompositeOperation = 'source-over';
                    var grad = ctx.createLinearGradient(0, 0, 0, ig.system.height);
                    grad.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')');
                    grad.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.6) + ')');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, ig.system.width, ig.system.height);
                    ctx.restore();
                }
            }
            // twinkling stars once it's dark enough
            if (this.nightAlpha > 0.15) this._drawStars(ctx);
        },

        /** Re-apply the current weather mode (level load or settings change). */
        _applyMode: function (immediately) {
            if (!ig.weather || this.isIndoors) return;
            var mode = Math.round(getOpt('weatherMode', 1));
            if (mode === 1) {
                this._applyWeather(null, immediately);      // Auto: map weather
            } else if (mode === 2) {
                if (getOpt('persistentWeather', true) && this.activeWeatherName) {
                    // keep the rolled weather across map changes
                    this._applyWeather(this.getWeatherInstance(this.activeWeatherName), immediately);
                } else {
                    this._rollWeather(immediately);         // Dynamic: rolling
                }
            } else {
                var name = MODE_WEATHER[mode] || 'NONE';
                this._applyWeather(this.getWeatherInstance(name), immediately);
            }
        },

        /** Called by the settings menu changeEvent handlers. */
        applySettings: function () {
            if (getOpt('manualTime', false)) this._syncManualTime();
            this._ensureClock();
            if (!ig.weather) return;
            this._applyMode(true);
        },

        /** Manual mode: snap the clock to the slider value (works while paused). */
        _syncManualTime: function () {
            var hours = Math.max(0, Math.min(24, getOpt('timeOfDay', 12)));
            this.timeOfDay = (hours / 24) % 1;
            this._setPhase(this._phaseForTime(this.timeOfDay));
            this.nightTarget = this.isIndoors ? 0 : this._darknessForPhase();
            this.nightAlpha = this.nightTarget;
        },

        _setPhase: function (phase) {
            if (phase !== this.currentPhase) {
                this.currentPhase = phase;
                if (!this.isIndoors && this._inGame()) this._notify();
            }
        },

        /** Ensure the clock HUD exists (respects the Show Clock option). */
        _ensureClock: function () {
            if (!ig.gui || !ig.GuiElementBase || !sc.TextGui || !sc.fontsystem) return;
            if (getOpt('showClock', true)) {
                if (!this._clock) {
                    this._clock = new ig.AmbienceClockGui();
                    ig.gui.addGuiElement(this._clock);
                }
            } else if (this._clock) {
                ig.gui.removeGuiElement(this._clock);
                this._clock = null;
            }
        },

        /** Generate the (screen-space) star field once — upper 55% of the screen. */
        _initStars: function () {
            this._stars = [];
            for (var i = 0; i < 70; ++i) {
                this._stars.push({
                    x: Math.random(),
                    y: Math.random() * 0.55,
                    r: 0.6 + Math.random() * 1.1,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.8 + Math.random() * 2.2
                });
            }
        },

        /** Draw twinkling stars once it is dark enough (fade in over 0.15→0.55). */
        _drawStars: function (ctx) {
            if (!this._stars) this._initStars();
            var w = ig.system.width,
                h = ig.system.height;
            var strength = Math.max(0, Math.min(1, (this.nightAlpha - 0.15) / 0.4));
            if (strength <= 0.001) return;
            ctx.save();
            for (var i = 0; i < this._stars.length; ++i) {
                var s = this._stars[i];
                var tw = 0.55 + 0.45 * Math.sin(this._starTime * s.speed + s.phase);
                ctx.globalAlpha = strength * tw * 0.9;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
            }
            ctx.restore();
        },

        /**
         * Apply a weather instance (or null to restore the map's own weather).
         * Uses ig.weather.setWeather with transitions enabled for smooth fades.
         */
        _applyWeather: function (instance, immediately) {
            if (!ig.weather) return;
            var oldName = this.activeWeatherName;
            var newName = oldName;
            if (instance) {
                newName = instance.name;
                if (ig.weather.currentWeather !== instance) {
                    ig.weather.setWeather(instance, !!immediately);
                }
            } else {
                var levelInst = ig.weather.levelWeather;
                newName = levelInst ? levelInst.name : 'NONE';
                if (levelInst && ig.weather.currentWeather !== levelInst) {
                    ig.weather.setWeather(levelInst, !!immediately);
                }
            }
            this.activeWeatherName = newName;
            if (newName !== oldName && !this.isIndoors && this._inGame()) {
                this._notify();
            }
        },

        _rollWeather: function (immediately) {
            var isNight = this.currentPhase === 'NIGHT' || this.currentPhase === 'SUNSET' || this.currentPhase === 'SUNRISE';
            var pool = isNight ? NIGHT_WEATHER_POOL : DAY_WEATHER_POOL;
            var total = 0, i;
            for (i = 0; i < pool.length; ++i) total += pool[i].w;
            var roll = Math.random() * total;
            var name = 'NONE';
            for (i = 0; i < pool.length; ++i) {
                roll -= pool[i].w;
                if (roll <= 0) { name = pool[i].n; break; }
            }
            this._applyWeather(this.getWeatherInstance(name), immediately);
        },

        _phaseForTime: function (t) {
            if (t >= 0.25 && t < 0.35) return 'SUNRISE';
            if (t >= 0.35 && t < 0.75) return 'DAY';
            if (t >= 0.75 && t < 0.85) return 'SUNSET';
            return 'NIGHT';
        },

        _darknessForPhase: function () {
            var max = Math.max(0, Math.min(1, getOpt('darknessIntensity', 0.7)));
            var t = this.timeOfDay;
            if (this.currentPhase === 'DAY') return 0;
            if (this.currentPhase === 'NIGHT') return max;
            if (this.currentPhase === 'SUNSET') {
                return max * smoothstep((t - 0.75) / 0.10);
            }
            if (this.currentPhase === 'SUNRISE') {
                return max * (1 - smoothstep((t - 0.25) / 0.10));
            }
            return 0;
        },

        _detectIndoors: function () {
            var weather = ig.weather;
            if (!weather || !weather.levelWeather) return false;
            var cfg = weather.levelWeather.config;
            if (cfg && cfg.outside) return false;
            return INDOOR_WEATHERS.indexOf(weather.levelWeather.name) !== -1;
        },

        _inGame: function () {
            return window.sc && sc.model && sc.model.isGame && sc.model.isGame();
        },

        _notify: function () {
            var phase = this.currentPhase.toLowerCase();
            if (phase === 'sunrise') phase = 'dawn';
            var name = this.activeWeatherName ||
                (ig.weather && ig.weather.currentWeather ? ig.weather.currentWeather.name : 'NONE');
            var iconPath = weatherCategory(name) + '_' + phase + '.png';
            triggerAmbientNotification(this.currentPhase + ' | ' + weatherLabel(name), iconPath);
        }
    });

    // =======================================================================
    // 2. REGISTRATION — the game is already live, so wire the addon into its
    //    sorted addon arrays directly (ig.addGameAddon is too late here).
    // =======================================================================
    function registerAddon() {
        if (ig.ambienceAddon && ig.ambienceAddon.registered) return;
        if (!ig.ambienceAddon) ig.ambienceAddon = new ig.AmbienceAddon();

        var game = ig.game;
        if (!game || !game.addons || !game.addons.all) {
            setTimeout(registerAddon, 100);
            return;
        }

        var byLevelLoaded = function (a, b) { return a.levelLoadedOrder - b.levelLoadedOrder; };
        var byDeferred = function (a, b) { return a.deferredUpdateOrder - b.deferredUpdateOrder; };
        var byPostDraw = function (a, b) { return a.postDrawOrder - b.postDrawOrder; };

        game.addons.all.push(ig.ambienceAddon);
        game.addons.levelLoaded.push(ig.ambienceAddon);
        game.addons.levelLoaded.sort(byLevelLoaded);
        game.addons.deferredUpdate.push(ig.ambienceAddon);
        game.addons.deferredUpdate.sort(byDeferred);
        game.addons.postDraw.push(ig.ambienceAddon);
        game.addons.postDraw.sort(byPostDraw);

        ig.ambienceAddon.registered = true;
        window.__ambientApplySettings = function () {
            if (ig.ambienceAddon) ig.ambienceAddon.applySettings();
        };

        if (window.console && console.log) {
            console.log('[Ambient Nights] v1.4.0 - addon registered (deferredUpdate 1 / levelLoaded 101 / postDraw 300). Settings in the game Options > General tab (ambience-*).');
        }
    }
    registerAddon();
}

bootAmbience();
