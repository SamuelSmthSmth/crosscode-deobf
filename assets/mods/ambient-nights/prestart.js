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
                        description: 'Adjusts how fast time passes. (Default: 1.0x)',
                        customNumberDisplay(index) {
                            const num = this.min + (this.step * index);
                            return num.toFixed(1) + 'x';
                        }
                    },
                    weatherMode: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 1,
                        max: 4,
                        step: 1,
                        fill: true,
                        showPercentage: false,
                        name: 'Weather Mode',
                        description: '1: Auto, 2: Random, 3: Rain, 4: Snow',
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
                    },
                    tiltShift: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Tilt Shift',
                        description: 'Enable Tilt Shift at night.',
                    },
                    lockdown: {
                        type: 'CHECKBOX',
                        init: true,
                        name: 'Night Lockdown',
                        description: 'Enforce survival mechanics at night.',
                    }
                }
            }
        }
    }
) : null;

window.AmbientOpts = Opts;
