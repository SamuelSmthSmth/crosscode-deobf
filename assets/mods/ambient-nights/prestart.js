// Ambient Nights — options registration (runs before the engine loads).
// Options are registered through ccmodmanager; `Opts` holds the live values
// (e.g. Opts.timeRatio is the float 1.0, not an index). changeEvent hooks
// re-apply settings immediately when the player changes them in the menu.
const Opts = (typeof modmanager !== 'undefined' && modmanager.registerAndGetModOptions) ? modmanager.registerAndGetModOptions(
    {
        modId: 'ambient-nights',
        title: 'Ambient Nights',
    },
    {
        general: {
            settings: {
                title: 'General Settings',
                tabIcon: 'general',
            },
            headers: {
                'Gameplay Options': {
                    timeRatio: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 0.1,
                        max: 10,
                        step: 0.1,
                        fill: true,
                        showPercentage: false,
                        name: 'Time Ratio',
                        description: 'Adjusts how fast time passes. (Default: 1.0x = a full day in 20 minutes)',
                        customNumberDisplay(index) {
                            const num = this.min + (this.step * index);
                            return num.toFixed(1) + 'x';
                        },
                        changeEvent() {
                            if (window.__ambientApplySettings) window.__ambientApplySettings();
                        }
                    },
                    weatherMode: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 1,
                        max: 9,
                        step: 1,
                        fill: true,
                        showPercentage: false,
                        name: 'Weather Mode',
                        description: '1: Auto, 2: Dynamic, 3: Clear, 4: Clouds, 5: Fog, 6: Rain, 7: Heavy Rain, 8: Snow, 9: Sandstorm',
                        customNumberDisplay(index) {
                            const labels = ['Auto', 'Dynamic', 'Clear', 'Clouds', 'Fog', 'Rain', 'Heavy Rain', 'Snow', 'Sandstorm'];
                            const num = this.min + index;
                            return num + ': ' + (labels[index] || num);
                        },
                        changeEvent() {
                            if (window.__ambientApplySettings) window.__ambientApplySettings();
                        }
                    },
                    darknessIntensity: {
                        type: 'OBJECT_SLIDER',
                        init: 0.7,
                        min: 0.0,
                        max: 1.0,
                        step: 0.1,
                        fill: true,
                        name: 'Darkness Intensity',
                        description: 'How dark the night gets. (Default: 0.7)',
                        customNumberDisplay(index) {
                            const num = this.min + (this.step * index);
                            return num.toFixed(1);
                        },
                        changeEvent() {
                            if (window.__ambientApplySettings) window.__ambientApplySettings();
                        }
                    },
                    lockdown: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Night Lockdown',
                        description: 'Blocks fast-travel during the night.',
                        changeEvent() {
                            if (window.__ambientApplySettings) window.__ambientApplySettings();
                        }
                    }
                }
            }
        }
    }
) : null;

window.AmbientOpts = Opts;
