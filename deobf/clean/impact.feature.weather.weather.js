/**
 * impact.feature.weather.weather
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.weather.weather")`.
 *
 * The weather subsystem core: `ig.WEATHER_TYPES` — the named weather
 * definitions (darkness, clouds, fog, rain, particles, corners, light-map
 * values) — plus `ig.WeatherInstance` (a cacheable weather with its own
 * particle spawners) and the `ig.weather` game add-on that applies a
 * weather to the current level and animates the transitions.
 */

ig.module("impact.feature.weather.weather").requires("impact.base.game", "impact.feature.weather.clouds", "impact.feature.weather.fog", "impact.feature.weather.rain").defines(function () {

    ig.perf.weather = true;
    ig.WEATHER_TYPES = {
        NONE: {
            lightMapDarkness: 0.6
        },
        CARGO_HOLD: {
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }]
        },
        DUSTY: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }],
            glowColor: "#0f0f0f"
        },
        CLOUDY: {
            blackCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            clouds: {
                density: 0.5,
                vel: {
                    x: 60,
                    y: 24
                },
                alpha: 0.4
            }
        },
        BEFORE_RAIN: {
            blackCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.3,
                vel: {
                    x: 100,
                    y: 40
                }
            }
        },
        RAINY_WEAK: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            rain: ig.RAIN_STRENGTH.WEAK,
            fog: {
                alpha: 0.3,
                vel: {
                    x: 100,
                    y: 40
                }
            }
        },
        RAINY_MEDIUM: {
            whiteCorners: {
                alpha: 0.25,
                time: 2,
                blinkAlpha: 0.35
            },
            rain: ig.RAIN_STRENGTH.MEDIUM,
            fog: {
                alpha: 0.4,
                vel: {
                    x: 150,
                    y: 60
                }
            }
        },
        RAINY_STRONG: {
            whiteCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            rain: ig.RAIN_STRENGTH.STRONG,
            fog: {
                alpha: 0.5,
                vel: {
                    x: 225,
                    y: 90
                }
            }
        },
        ROOKIE_HARBOR: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            particles: []
        },
        ROOKIE_HARBOR_INNER: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 3
            }],
            glowColor: "#0f0f0f"
        },
        EVO_VILLAGE_INNER: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 3
            }],
            glowColor: "#1b1c19"
        },
        EXPO_SPACE: {
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 1
            },
            lightMapDarkness: 0.2,
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 15
            }]
        },
        AUTUMN: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            particles: [{
                type: "LEAVES",
                quantity: 6
            }]
        },
        AUTUMN_RAIN_WEAK: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            rain: ig.RAIN_STRENGTH.WEAK,
            fog: {
                alpha: 0.3,
                vel: {
                    x: 100,
                    y: 40
                }
            },
            particles: [{
                type: "LEAVES",
                quantity: 8
            }]
        },
        AUTUMN_RAIN_MEDIUM: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            rain: ig.RAIN_STRENGTH.MEDIUM,
            fog: {
                alpha: 0.4,
                vel: {
                    x: 150,
                    y: 60
                }
            },
            particles: [{
                type: "LEAVES",
                quantity: 12
            }]
        },
        OLD_HIDEOUT_OUTSIDE: {
            whiteCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.2,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#000b2c"
        },
        OLD_HIDEOUT_OUTSIDE_ALT: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.6,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#331251"
        },
        OLD_HIDEOUT_INNER: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }],
            glowColor: "#302313"
        },
        OLD_HIDEOUT_OFFICE: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }],
            glowColor: "#302313"
        },
        RHOMBUS_DNG_TOP: {
            blackCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 10
            }]
        },
        RHOMBUS_DUNGEON: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 10
            }],
            glowColor: "#101112"
        },
        CAVE: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }]
        },
        CAVE_BERGEN: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }]
        },
        BERGEN_SUNNY: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            particles: [{
                type: "GREEN_LEAVES",
                quantity: 6
            }]
        },
        BERGEN_SNOW_START: {
            whiteCorners: {
                alpha: 0.1,
                time: 2,
                blinkAlpha: 0.2
            },
            rain: ig.RAIN_STRENGTH.SNOW_WEAK,
            particles: [{
                type: "GREEN_LEAVES",
                quantity: 2
            }, {
                type: "SNOW_FLAKES",
                quantity: 2
            }]
        },
        BERGEN_SNOW: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            rain: ig.RAIN_STRENGTH.SNOW_MEDIUM,
            particles: [{
                type: "SNOW_FLAKES",
                quantity: 6
            }]
        },
        BERGEN_INNER: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 3
            }],
            glowColor: "#0f0f0f"
        },
        COLD_DUNGEON: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#021116",
            particles: [{
                type: "COLD_CRYSTALS",
                quantity: 6
            }, {
                type: "DARK_DUST",
                quantity: 10
            }]
        },
        COLD_DUNGEON_DARK: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.7,
            glowColor: "#021116",
            particles: [{
                type: "COLD_CRYSTALS",
                quantity: 12
            }, {
                type: "DARK_DUST",
                quantity: 6
            }]
        },
        COLD_DUNGEON_POST_BOSS: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.9,
            glowColor: "#021116",
            particles: [{
                type: "COLD_CRYSTALS",
                quantity: 6
            }, {
                type: "DARK_DUST",
                quantity: 10
            }]
        },
        HEAT_DUSTY: {
            blackCorners: {
                alpha: 0.4,
                time: 2,
                blinkAlpha: 0.6
            },
            particles: [{
                type: "SAND_OUTSIDE",
                quantity: 12
            }]
        },
        HEAT_PARALLAX: {
            blackCorners: {
                alpha: 0.4,
                time: 2,
                blinkAlpha: 0.6
            },
            particles: [{
                type: "SAND_OUTSIDE",
                quantity: 12
            }]
        },
        HEAT_SANDSTORM: {
            blackCorners: {
                alpha: 0.8,
                time: 2,
                blinkAlpha: 0.9
            },
            rain: ig.RAIN_STRENGTH.SANDSTORM_WEAK,
            fog: {
                alpha: 0.3,
                vel: {
                    x: 240,
                    y: 60
                },
                zoom: 1
            },
            particles: [{
                type: "SANDSTORM",
                quantity: 12
            }]
        },
        HEAT_SANDSTORM_LIGHT: {
            blackCorners: {
                alpha: 0.4,
                time: 2,
                blinkAlpha: 0.5
            },
            rain: ig.RAIN_STRENGTH.SANDSTORM_NERD,
            fog: {
                alpha: 0.3,
                vel: {
                    x: 120,
                    y: 45
                },
                zoom: 1
            },
            particles: [{
                type: "SAND_OUTSIDE",
                quantity: 12
            }]
        },
        HEAT_GREEN: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            clouds: {
                density: 0.2,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            particles: [{
                type: "GREEN_LEAVES",
                quantity: 6
            }]
        },
        HEAT_VILLAGE_INNER: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 3
            }],
            glowColor: "#0f0f0f"
        },
        HEAT_VILLAGE_INNER_DUSTY: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 10
            }],
            glowColor: "#0f0f0f"
        },
        HEAT_DUNGEON: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#140e08",
            particles: [{
                type: "SAND",
                quantity: 16
            }]
        },
        HEAT_DUNGEON_MIDBOSS: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            rain: ig.RAIN_STRENGTH.SANDSTORM_NERD,
            fog: {
                alpha: 0.8,
                vel: {
                    x: 120,
                    y: 45
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#140e08",
            particles: [{
                type: "SANDSTORM",
                quantity: 12
            }]
        },
        HEAT_DUNGEON_COAL: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#140e08",
            particles: [{
                type: "COAL_SPARKS",
                quantity: 16
            }]
        },
        HEAT_DUNGEON_BOSS: {
            blackCorners: {
                alpha: 0.2,
                time: 1,
                blinkAlpha: 0.7
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#140e08",
            particles: [{
                type: "COAL_SPARKS_FAST",
                quantity: 30
            }]
        },
        DREAM: {
            whiteCorners: {
                alpha: 1,
                time: 1,
                blinkAlpha: 0.8
            }
        },
        UNKNOWN_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#4c1221"
        },
        OFFICE: {
            lightMapDarkness: 0.6,
            particles: [],
            glowColor: "#0f0f0f"
        },
        LOBBY: {
            lightMapDarkness: 0.8,
            glowColor: "#1e3036"
        },
        LOBBY_DARK: {
            lightMapDarkness: 1,
            glowColor: "#1e3036"
        },
        FLAT: {
            lightMapDarkness: 0.8,
            glowColor: "#43392c"
        },
        FLAT_DARK: {
            lightMapDarkness: 1,
            glowColor: "#43392c"
        },
        JUNGLE_SUNNY: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            particles: [{
                type: "JUNGLE_LEAVES",
                quantity: 10
            }],
            outside: true
        },
        JUNGLE_RAINY_LIGHT: {
            whiteCorners: {
                alpha: 0.16,
                time: 2,
                blinkAlpha: 0.25
            },
            rain: ig.RAIN_STRENGTH.DRIZZLE,
            fog: {
                alpha: 0.2,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            glowColor: "#332a17"
        },
        JUNGLE_RAINY: {
            whiteCorners: {
                alpha: 0.16,
                time: 2,
                blinkAlpha: 0.25
            },
            rain: ig.RAIN_STRENGTH.MEDIUM,
            fog: {
                alpha: 0.2,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            glowColor: "#332a17"
        },
        JUNGLE_INFESTED_PRE: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            lightMapDarkness: 0.5,
            glowColor: "#32133b"
        },
        JUNGLE_INFESTED: {
            fog: {
                alpha: 0.6,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#32133b",
            particles: [{
                type: "INFESTED_DUST",
                quantity: 20
            }]
        },
        CAVE_INFESTED: {
            fog: {
                alpha: 0.6,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 5
            }, {
                type: "INFESTED_DUST",
                quantity: 10
            }],
            glowColor: "#32133b"
        },
        JUNGLE_CITY_PRE: {
            whiteCorners: {
                alpha: 0.16,
                time: 2,
                blinkAlpha: 0.25
            },
            rain: ig.RAIN_STRENGTH.DRIZZLE,
            lightMapDarkness: 0.2,
            fog: {
                alpha: 0.2,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            glowColor: "#332a17"
        },
        JUNGLE_CITY: {
            whiteCorners: {
                alpha: 0.16,
                time: 2,
                blinkAlpha: 0.25
            },
            rain: ig.RAIN_STRENGTH.MEDIUM,
            fog: {
                alpha: 0.4,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            glowColor: "#332a17"
        },
        JUNGLE_CITY_INNER: {
            lightMapDarkness: 0.6,
            particles: [{
                type: "DARK_DUST",
                quantity: 3
            }],
            glowColor: "#2e271a"
        },
        JUNGLE_WAVE_TEMPLE: {
            whiteCorners: {
                alpha: 0.16,
                time: 2,
                blinkAlpha: 0.25
            },
            rain: ig.RAIN_STRENGTH.MEDIUM,
            fog: {
                alpha: 0.4,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            glowColor: "#173133"
        },
        WAVE_DNG_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#0a2f29",
            particles: [{
                type: "WAVE_DUST",
                quantity: 20
            }]
        },
        WAVE_DNG_INNER_FISH: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.8,
            glowColor: "#0a2f29",
            particles: [{
                type: "WAVE_DUST",
                quantity: 20
            }]
        },
        SHOCK_DNG_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#220b28",
            particles: [{
                type: "INFESTED_DUST",
                quantity: 20
            }]
        },
        TREE_DNG_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#0a2f29",
            particles: [{
                type: "WAVE_DUST",
                quantity: 20
            }]
        },
        TREE_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#0a2f29",
            particles: [{
                type: "DARK_DUST",
                quantity: 20
            }]
        },
        TREE_INNER_INFESTED: {
            blackCorners: {
                alpha: 0.4,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#0a2f29",
            particles: [{
                type: "DARK_DUST",
                quantity: 20
            }, {
                type: "INFESTED_DUST",
                quantity: 10
            }, {
                type: "SPOOKY_DUST",
                quantity: 5
            }]
        },
        TREE_DNG_INNER_WAVE: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#0a2f29",
            particles: [{
                type: "WAVE_DUST",
                quantity: 20
            }]
        },
        TREE_DNG_INNER_SHOCK: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#220b28",
            particles: [{
                type: "WAVE_DUST",
                quantity: 20
            }]
        },
        SPOOKY_INNER: {
            fog: {
                alpha: 1,
                vel: {
                    x: 20,
                    y: -100
                },
                zoom: 1
            },
            lightMapDarkness: 0.7,
            lightMapBrightness: 1,
            particles: [{
                type: "SPOOKY_DUST",
                quantity: 20
            }],
            glowColor: "#211f1b"
        },
        CAVE_FOREST: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#20134c"
        },
        CAVE_ARID: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#4c121d"
        },
        CAVE_ARID_CLOSER: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.8,
            particles: [{
                type: "ARID_DUST_1",
                quantity: 20
            }],
            glowColor: "#371008"
        },
        ARID_OUTSIDE: {
            fog: {
                alpha: 0.6,
                vel: {
                    x: 85,
                    y: 30
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#4c121d",
            particles: [{
                type: "ARID_DUST_1",
                quantity: 20
            }]
        },
        ARID_INSIDE: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#4c1221",
            particles: [{
                type: "ARID_DUST_1",
                quantity: 20
            }]
        },
        ARID_ELEVATOR_UP: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.8,
            glowColor: "#4c1221",
            particles: [{
                type: "ARID_DUST_ELEVATOR_UP",
                quantity: 20
            }]
        },
        ARID_ELEVATOR_DOWN: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.8,
            glowColor: "#4c1221",
            particles: [{
                type: "ARID_DUST_ELEVATOR_DOWN",
                quantity: 20
            }]
        },
        ARID_BOSS: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.8,
            glowColor: "#4c1221",
            particles: [{
                type: "ARID_DUST_FAST",
                quantity: 20
            }],
            outside: true
        },
        ARID_END_SCENE: {
            blackCorners: {
                alpha: 0.7,
                time: 2,
                blinkAlpha: 1
            },
            fog: {
                alpha: 1,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.8,
            glowColor: "#4c1221",
            particles: [{
                type: "ARID_DUST_1",
                quantity: 30
            }]
        },
        ARID_BETWEEN: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#4c1221",
            particles: []
        },
        ARID_DNG_OUTSIDE: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#4d4032",
            particles: []
        },
        SAPPHIRE_RIDGE: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.6,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#331251"
        },
        SAPPHIRE_RIDGE_BUILDING: {
            whiteCorners: {
                alpha: 0.2,
                time: 2,
                blinkAlpha: 0.3
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 30,
                    y: 10
                }
            },
            lightMapDarkness: 0.6,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#4c3127"
        },
        SAPPHIRE_RIDGE_INNER: {
            fog: {
                alpha: 0.7,
                vel: {
                    x: 5,
                    y: -30
                }
            },
            lightMapDarkness: 0.65,
            particles: [{
                type: "DARK_DUST",
                quantity: 6
            }],
            glowColor: "#302313"
        },
        FLASHBACK_OFFICE: {
            lightMapDarkness: 1,
            particles: [],
            glowColor: "#0f0f0f",
            subOverlay: {
                brightColor: "#534500",
                darkColor: "rgba(49,0,83,0.4)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 0.9
            }
        },
        FLASHBACK_HIDEOUT: {
            lightMapDarkness: 1,
            particles: [{
                type: "WHITE_DUST",
                quantity: 10
            }],
            glowColor: "#411e61",
            subOverlay: {
                brightColor: "#532500",
                darkColor: "rgba(31,0,81,0.4)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 0.9
            }
        },
        FLASHBACK_HIDEOUT_INNER: {
            lightMapDarkness: 1,
            particles: [],
            glowColor: "#411e61",
            subOverlay: {
                brightColor: "#532500",
                darkColor: "rgba(31,0,81,0.4)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 0.9
            }
        },
        FLASHBACK_ARID: {
            lightMapDarkness: 1,
            particles: [{
                type: "ARID_DUST_1",
                quantity: 20
            }],
            glowColor: "#4c121d",
            subOverlay: {
                brightColor: "#532500",
                darkColor: "rgba(31,0,81,0.4)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 0.9
            }
        },
        FLASHBACK_DIAGRAM: {
            lightMapDarkness: 1,
            particles: [],
            glowColor: "#4c121d",
            subOverlay: {
                brightColor: "#251000",
                darkColor: "rgba(31,0,81,0.2)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 0.9
            }
        },
        TREE_SPACE: {
            blackCorners: {
                alpha: 0.4,
                time: 2,
                blinkAlpha: 0.8
            },
            lightMapDarkness: 0.5,
            glowColor: "#4c1221",
            particles: [{
                type: "RHOMBUS",
                quantity: 20
            }],
            outside: true
        },
        RHOMBUS_SQUARE: {
            blackCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 10
            }]
        },
        RHOMBUS_SQUARE_BEACH: {
            blackCorners: {
                alpha: 0.1,
                time: 4,
                blinkAlpha: 0.2
            },
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.1
            },
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 10
            }]
        },
        RHOMBUS_SQUARE_INNER: {
            lightMapDarkness: 0.8,
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 5
            }],
            glowColor: "#161c24"
        },
        FINAL_BOSS: {
            blackCorners: {
                alpha: 0.5,
                time: 2,
                blinkAlpha: 0.7
            },
            particles: [{
                type: "BLUE_SQUARES",
                quantity: 10
            }],
            outside: true
        },
        GAUTHAM_ROOM: {
            lightMapDarkness: 0.7,
            particles: [],
            fog: {
                alpha: 0.9,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            glowColor: "#360e0f",
            subOverlay: {
                brightColor: "#560202",
                darkColor: "rgba(0,0,0,0.5)"
            },
            blackCorners: {
                alpha: 1,
                time: 2,
                blinkAlpha: 1
            }
        },
        LAB: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#623212",
            particles: [{
                type: "DARK_DUST",
                quantity: 20
            }]
        },
        FINAL_DNG_OUTER: {
            whiteCorners: {
                alpha: 0.45,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.6,
                vel: {
                    x: 0,
                    y: -30
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#294058",
            particles: [{
                type: "FINAL_WHIRL",
                quantity: 15
            }, {
                type: "FINAL_GLOW",
                quantity: 10
            }]
        },
        FINAL_DNG_OUTER_BATTLE: {
            whiteCorners: {
                alpha: 0.45,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.6,
                vel: {
                    x: 0,
                    y: -30
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#294058",
            particles: [{
                type: "FINAL_WHIRL_FAST",
                quantity: 25
            }, {
                type: "FINAL_GLOW",
                quantity: 10
            }]
        },
        FINAL_DNG_INNER: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#373632",
            particles: [{
                type: "FINAL_WHIRL",
                quantity: 15
            }]
        },
        FINAL_DNG_INNER_TELEPORT: {
            whiteCorners: {
                alpha: 0.45,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.6,
                vel: {
                    x: 0,
                    y: -30
                },
                zoom: 1
            },
            lightMapDarkness: 0.5,
            glowColor: "#2c3737",
            particles: [{
                    type: "FINAL_WHIRL",
                    quantity: 15
                },
                {
                    type: "FINAL_GLOW",
                    quantity: 10
                }
            ]
        },
        FINAL_DNG_INNER_BATTLE: {
            blackCorners: {
                alpha: 0.3,
                time: 2,
                blinkAlpha: 0.5
            },
            fog: {
                alpha: 0.8,
                vel: {
                    x: 5,
                    y: -15
                }
            },
            lightMapDarkness: 0.5,
            glowColor: "#373632",
            particles: [{
                type: "FINAL_WHIRL_FAST",
                quantity: 25
            }]
        },
        BEACH_DEFAULT: {
            clouds: {
                density: 0.3,
                vel: {
                    x: 90,
                    y: 36
                },
                alpha: 0.24
            },
            glowColor: "#e9d8a9",
            particles: [{
                type: "FINAL_WHIRL",
                quantity: 10
            }, {
                type: "BEACH_GLOW",
                quantity: 7
            }, {
                type: "BEACH_GLOW_BIG",
                quantity: 3
            }]
        }
    };

    ig.WeatherInstance = ig.Cacheable.extend({
        cacheType: "Weather",
        name: null,
        config: null,
        particleSpawners: [],

        /**
         * @param {string} name - key into `ig.WEATHER_TYPES`
         */
        init: function (name) {
            this.parent();
            this.name = name;
            this.config = ig.WEATHER_TYPES[this.name];
            var particles = this.config.particles;
            if (particles) {
                for (var i = 0; i < particles.length; ++i) {
                    this.particleSpawners.push(new ig.EnvParticleSpawner(particles[i].type));
                }
            }
        },

        getCacheKey: function (name) {
            return name;
        },

        onCacheCleared: function () {
            for (var i = this.particleSpawners.length; i--;) this.particleSpawners[i].decreaseRef();
            this.particleSpawners.length = 0;
        }
    });

    /** The weather game add-on; applies and animates the current weather. */
    ig.Weather = ig.GameAddon.extend({
        levelWeather: null,
        currentWeather: new ig.WeatherInstance("NONE"),
        clouds: new ig.Clouds(),
        fog: new ig.Fog(),
        rain: new ig.Rain(),
        darknessHandle: null,
        outside: false,
        lightMapDarkness: { last: 0, target: 0, timer: 0 },
        subOverlay: null,
        lightMapBrightness: { last: 0, target: 0, timer: 0 },
        extraParticles: [],

        init: function () {
            this.parent("Weather");
            this.darknessHandle = new ig.DarknessHandle();
            ig.light.addDarknessHandle(this.darknessHandle);
        },

        setWeather: function (weather, immediately) {
            this.currentWeather = weather;
            this.updateWeather(immediately);
        },

        addExtraParticles: function (spawner, count) {
            this.removeExtraParticles(spawner, true);
            this.extraParticles.push({ spawner: spawner, count: count });
            ig.envParticles.addSpawner(spawner, count);
        },

        removeExtraParticles: function (spawner, immediately) {
            for (var i = this.extraParticles.length; i--;) {
                this.extraParticles[i].spawner == spawner && this.extraParticles.splice(i, 1);
            }
            immediately || ig.envParticles.addSpawner(spawner, 0);
        },

        levelLoadStartOrder: 100,

        /** Resolve the level's weather attribute and set the main glow colour. */
        onLevelLoadStart: function (levelData) {
            this.levelWeather && this.levelWeather.decreaseRef();
            this.levelWeather = levelData.attributes && levelData.attributes.weather ?
                new ig.WeatherInstance(levelData.attributes.weather || "NONE") :
                new ig.WeatherInstance("NONE");
            this.levelWeather.config.glowColor ?
                ig.light.setMainGlowColor(this.levelWeather.config.glowColor) :
                ig.light.setMainGlowColor(null);
        },

        levelLoadedOrder: 100,
        onLevelLoaded: function () {
            this.setWeather(this.levelWeather, true);
        },

        deferredUpdateOrder: 0,

        /** Animate darkness/brightness transitions and the clouds/fog/rain. */
        onDeferredUpdate: function () {
            if (!ig.game.paused) {
                if (this.lightMapDarkness.timer) {
                    this.lightMapDarkness.timer = this.lightMapDarkness.timer - ig.system.tick;
                    if (this.lightMapDarkness.timer < 0) this.lightMapDarkness.timer = 0;
                    var lightness = this.lightMapDarkness.timer / 2;
                    lightness = lightness * this.lightMapDarkness.last + (1 - lightness) * this.lightMapDarkness.target;
                    ig.light.lightMapDarkness = lightness;
                }
                if (this.lightMapBrightness.timer) {
                    this.lightMapBrightness.timer = this.lightMapBrightness.timer - ig.system.tick;
                    if (this.lightMapBrightness.timer < 0) this.lightMapBrightness.timer = 0;
                    lightness = this.lightMapBrightness.timer / 2;
                    lightness = lightness * this.lightMapBrightness.last + (1 - lightness) * this.lightMapBrightness.target;
                    ig.light.lightMapBrightness = lightness;
                }
                this.clouds.update();
                this.fog.update();
                this.rain.update();
            }
        },

        midDrawOrder: 100,

        /** Draw rain and the optional colour sub-overlay. */
        onMidDraw: function () {
            this.rain.draw();
            if (ig.perf.weather && this.subOverlay) {
                var context = ig.system.context;
                context.globalCompositeOperation = "lighter";
                context.fillStyle = this.subOverlay.brightColor;
                context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
                context.globalCompositeOperation = "source-over";
                context.fillStyle = this.subOverlay.darkColor;
                context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
            }
        },

        onReset: function () {
            this.rain.onReset();
        },

        /**
         * Apply the current weather's config: corners, clouds, fog, rain,
         * darkness, outside flag, light map values and extra particles.
         * @param {boolean} immediately - skip transitions
         */
        updateWeather: function (immediately) {
            var config = this.currentWeather.config;
            if (config.blackCorners) {
                var corner = config.blackCorners;
                ig.overlay.setCorner("BLACK", corner.alpha, corner.time, corner.blinkAlpha);
            } else {
                ig.overlay.setCorner("BLACK", 0, immediately ? 0 : 2);
            }
            if (config.whiteCorners) {
                corner = config.whiteCorners;
                ig.overlay.setCorner("WHITE", corner.alpha, corner.time, corner.blinkAlpha);
            } else {
                ig.overlay.setCorner("WHITE", 0, immediately ? 0 : 2);
            }
            if (config.clouds) {
                corner = config.clouds;
                this.clouds.setClouds(corner.density, corner.vel, corner.alpha, immediately);
            } else {
                this.clouds.clearClouds(immediately);
            }
            if (config.fog) {
                corner = config.fog;
                this.fog.setFog(corner.alpha, corner.vel, corner.zoom, immediately);
            } else {
                this.fog.clearFog(immediately);
            }
            config.rain ? this.rain.setRain(config.rain, immediately) : this.rain.clearRain(immediately);
            config.darkness ?
                this.darknessHandle.setIntensity(config.darkness, immediately ? 0 : 2) :
                this.darknessHandle.setIntensity(0, immediately ? 0 : 2);
            this.outside = config.outside;
            var lightMapDarkness = config.lightMapDarkness,
                lightMapBrightness = config.lightMapBrightness;
            lightMapDarkness == void 0 && (lightMapDarkness = 0.6);
            lightMapBrightness == void 0 && (lightMapBrightness = 1);
            if (immediately) {
                ig.light.lightMapDarkness = lightMapDarkness;
                ig.light.lightMapBrightness = lightMapBrightness;
            } else {
                this.lightMapDarkness.last = ig.light.lightMapDarkness;
                this.lightMapDarkness.target = lightMapDarkness;
                this.lightMapDarkness.timer = 2;
                this.lightMapBrightness.last = ig.light.lightMapBrightness;
                this.lightMapBrightness.target = lightMapBrightness;
                this.lightMapBrightness.timer = 2;
            }
            this.subOverlay = config.subOverlay || null;
            this.restoreParticles(immediately);
        },

        /** Re-apply the weather's particle spawners (and extras). */
        restoreParticles: function (immediately) {
            ig.envParticles.clear(immediately);
            var config = this.currentWeather.config,
                particleSpawners = this.currentWeather.particleSpawners;
            for (var i = particleSpawners.length; i--;) {
                ig.envParticles.addSpawner(particleSpawners[i], config.particles[i].quantity, immediately);
            }
            for (i = this.extraParticles.length; i--;) {
                ig.envParticles.addSpawner(this.extraParticles[i].spawner, this.extraParticles[i].count, immediately);
            }
        }
    });

    ig.addGameAddon(function () {
        return ig.weather = new ig.Weather();
    })

});
ig.baked = !0;
