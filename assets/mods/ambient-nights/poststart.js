"use strict";

console.log("!!! AMBIENT NIGHTS POSTSTART EXECUTED !!!");

// Inject the custom CrossCode font
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

// Inject the image and text container in the top right (hidden by default)
const uiHtml = `
  <div id="ambient-ui-container" style="position:fixed; top:20px; right:30px; display:flex; align-items:center; gap:10px; z-index:999999; pointer-events:none; font-family:'PixelHallfetica', sans-serif; color:white; text-shadow:2px 2px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black, 1px 1px 0px black; opacity:0; transition:opacity 0.5s ease-in-out;">
    <div id="ambient-ui-text" style="font-size:16px;">Weather</div>
    <img id="ambient-ui-icon" src="" style="width:48px; height:48px; image-rendering:pixelated;" />
  </div>
`;
document.body.insertAdjacentHTML('beforeend', uiHtml);

// Global notification state
let ambientNotificationTimeout = null;
let lastNotifiedState = "";

function triggerAmbientNotification(text, iconPath) {
  const container = document.getElementById('ambient-ui-container');
  const textEl = document.getElementById('ambient-ui-text');
  const iconEl = document.getElementById('ambient-ui-icon');
  
  if (!container || !textEl || !iconEl) return;

  textEl.innerText = text;
  iconEl.src = `/assets/mods/ambient-nights/assets/media/${iconPath}`;
  iconEl.onerror = function() {
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
// 1. THE CORE ADDON LOGIC
// ===========================================================================
ig.AmbienceAddon = ig.GameAddon.extend({
  name: 'AmbienceAddon',
  timeOfDay: 0.5,
  currentPhase: 'DAY',
  weatherTimer: 0,
  isIndoors: false,
  activeWeatherTarget: null,

  init: function() {
    this.parent(this.name);
    this._patchNightLockdownMechanics();
  },

  onLevelLoadStart: function(data) {
    this.parent(data);
    this.isIndoors = this._checkIfIndoors(data);

    if (this.isIndoors && ig.weather) {
      ig.weather.change(ig.WEATHER_TYPES.CLEAR, 0.0);
      this.activeWeatherTarget = ig.WEATHER_TYPES.CLEAR;
    }
  },

  preUpdate: function() {
    const timeRatios = [0.5, 1.0, 2.0, 4.0];
    const timeRatioIndex = (window.AmbientOpts && window.AmbientOpts.timeRatio !== undefined) ? window.AmbientOpts.timeRatio : 1;
    const timeRatioMultiplier = timeRatios[timeRatioIndex];
    const weatherModeIndex = (window.AmbientOpts && window.AmbientOpts.weatherMode !== undefined) ? window.AmbientOpts.weatherMode : 1;

    let oldPhase = this.currentPhase;
    let oldWeather = this.activeWeatherTarget;

    this._updateTime(timeRatioMultiplier);

    if (!this.isIndoors) {
      if (weatherModeIndex === 1) {
        this.weatherTimer += ig.system.tick * 1.5;
        if (this.weatherTimer > 100) {
          this.weatherTimer = 0;
          this._rollWeather();
        }
      } else if (weatherModeIndex > 1) {
        this._applyForcedWeather(weatherModeIndex);
      }
    }

    // Check for changes to trigger notification
    if (this.currentPhase !== oldPhase || this.activeWeatherTarget !== oldWeather) {
      let weatherType = "fine";
      let weatherStr = "Clear";
      if (this.activeWeatherTarget === ig.WEATHER_TYPES.RAIN) {
        weatherType = "rain";
        weatherStr = "Rain";
      } else if (this.activeWeatherTarget === ig.WEATHER_TYPES.FOG) {
        weatherType = "clouds";
        weatherStr = "Clouds";
      } else if (this.activeWeatherTarget === ig.WEATHER_TYPES.SNOW) {
        weatherType = "overcast";
        weatherStr = "Overcast";
      }

      let phaseType = this.currentPhase.toLowerCase(); // "day", "night", "sunrise", "sunset"
      if (phaseType === "sunrise") phaseType = "dawn";

      let iconPath = `${weatherType}_${phaseType}.png`;
      let text = `${this.currentPhase} | ${weatherStr}`;

      let currentState = `${this.currentPhase}_${this.activeWeatherTarget}`;
      if (currentState !== lastNotifiedState) {
        triggerAmbientNotification(text, iconPath);
        lastNotifiedState = currentState;
      }
    }
  },

  postDraw: function() {
    const maxDarkness = (window.AmbientOpts && window.AmbientOpts.darknessIntensity !== undefined) ? window.AmbientOpts.darknessIntensity : 0.7;
    let currentDarkness = this._calculateDarkness(maxDarkness);

    if (this.isIndoors) {
      currentDarkness *= 0.2;
    }

    if (currentDarkness > 0 && ig.system.context) {
      const ctx = ig.system.context;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(5, 5, 20, ${currentDarkness})`;
      ctx.fillRect(0, 0, ig.system.width, ig.system.height);
      ctx.restore();
    }
  },

  _updateTime: function(multiplier) {
    this.timeOfDay += ig.system.tick * multiplier * 0.005;
    if (this.timeOfDay > 1.0) this.timeOfDay = 0.0;

    if (this.timeOfDay >= 0.25 && this.timeOfDay < 0.35) {
      this.currentPhase = 'SUNRISE';
    } else if (this.timeOfDay >= 0.35 && this.timeOfDay < 0.75) {
      this.currentPhase = 'DAY';
    } else if (this.timeOfDay >= 0.75 && this.timeOfDay < 0.85) {
      this.currentPhase = 'SUNSET';
    } else {
      this.currentPhase = 'NIGHT';
    }
  },

  _calculateDarkness: function(maxIntensity) {
    if (this.currentPhase === 'DAY') return 0;
    if (this.currentPhase === 'NIGHT') return maxIntensity;

    if (this.currentPhase === 'SUNSET') {
      let progress = (this.timeOfDay - 0.75) / 0.10;
      let smoothProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
      return maxIntensity * smoothProgress;
    }
    if (this.currentPhase === 'SUNRISE') {
      let progress = (this.timeOfDay - 0.25) / 0.10;
      let smoothProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
      return maxIntensity * (1.0 - smoothProgress);
    }
    return 0;
  },

  _rollWeather: function() {
    const roll = Math.random();
    let targetWeather = ig.WEATHER_TYPES.CLEAR;

    if (this.currentPhase === 'NIGHT') {
      if (roll > 0.8) targetWeather = ig.WEATHER_TYPES.FOG;
      else if (roll > 0.5) targetWeather = ig.WEATHER_TYPES.RAIN;
    } else if (this.currentPhase === 'SUNSET' || this.currentPhase === 'SUNRISE') {
      if (roll > 0.8) targetWeather = ig.WEATHER_TYPES.FOG;
      else if (roll > 0.6) targetWeather = ig.WEATHER_TYPES.RAIN;
    } else {
      if (roll > 0.95) targetWeather = ig.WEATHER_TYPES.FOG;
      else if (roll > 0.8) targetWeather = ig.WEATHER_TYPES.RAIN;
    }

    if (this.activeWeatherTarget !== targetWeather && ig.weather) {
      this.activeWeatherTarget = targetWeather;
      ig.weather.change(targetWeather, 2.0);
    }
  },

  _applyForcedWeather: function(index) {
    let targetWeather;
    if (index === 2) targetWeather = ig.WEATHER_TYPES.RAIN;
    else if (index === 3) targetWeather = ig.WEATHER_TYPES.FOG;
    else if (index === 4) targetWeather = ig.WEATHER_TYPES.SNOW;
    else return;

    if (this.activeWeatherTarget !== targetWeather && ig.weather) {
      this.activeWeatherTarget = targetWeather;
      ig.weather.change(targetWeather, 2.0);
    }
  },

  _checkIfIndoors: function(mapData) {
    if (mapData && mapData.attributes && mapData.attributes.indoor) return true;
    return false;
  },

  _patchNightLockdownMechanics: function() {
    const self = this;

    ig.ENTITY.NPC.inject({
      init: function(x, y, z, settings) {
        this.parent(x, y, z, settings);
        const isLockdown = (window.AmbientOpts && window.AmbientOpts.lockdown !== undefined) ? window.AmbientOpts.lockdown : true;
        if (self.currentPhase === 'NIGHT' && isLockdown) {
          // Setting standard civilans invisible placeholder
        }
      }
    });

    if (sc.MapModel) {
      sc.MapModel.inject({
        executeTeleport: function(teleportData) {
          const isLockdown = (window.AmbientOpts && window.AmbientOpts.lockdown !== undefined) ? window.AmbientOpts.lockdown : true;
          if (self.currentPhase === 'NIGHT' && isLockdown) return;
          this.parent(teleportData);
        }
      });
    }

    if (sc.Combat) {
      sc.Combat.inject({
        escapeRun: function() {
          const isLockdown = (window.AmbientOpts && window.AmbientOpts.lockdown !== undefined) ? window.AmbientOpts.lockdown : true;
          if (self.currentPhase === 'NIGHT' && isLockdown) return false;
          return this.parent();
        }
      });
    }
  }
});

// Register Addon Engine
ig.ambienceAddon = new ig.AmbienceAddon();
if (ig.game && ig.game.addons) {
  ig.game.addons.push(ig.ambienceAddon);
}
ig.addGameAddon(function() {
  return ig.ambienceAddon;
});



