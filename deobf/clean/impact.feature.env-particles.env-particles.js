/**
 * impact.feature.env-particles.env-particles
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.env-particles.env-particles")`.
 *
 * The environment-particles subsystem: `ig.ENV_PARTICLES` particle-type definitions
 * (dust, leaves, snow, ...), the `ig.EnvParticleSpawner` that spawns, animates and
 * draws particles per level, and the `ig.envParticles` game add-on that owns all
 * active spawners and renders them mid-draw.
 */

ig.module("impact.feature.env-particles.env-particles").requires("impact.base.game", "impact.base.loader").defines(function () {

    ig.perf.envParticles = true;
    ig.ENV_PARTICLES = {};
    ig.ENV_PARTICLES.WHITE_DUST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 0
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 30,
        speedVariance: 5,
        dir: {
            x: 1,
            y: 0
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0.2,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.DARK_DUST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 8
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 30,
        speedVariance: 5,
        dir: {
            x: 1,
            y: 0
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0.2,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
                scale: 1,
                anim: "small"
            }, {
                scale: 1.2,
                anim: "medium"
            },
            {
                scale: 1.5,
                anim: "big"
            }
        ]
    };
    ig.ENV_PARTICLES.LEAVES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 24
            },
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 90,
        speedVariance: 20,
        dir: {
            x: 1,
            y: 0.8
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        rotateToDir: 0.375,
        sineRotate: 0.1,
        sineRotateTime: 1.3,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.GREEN_LEAVES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 24,
                offY: 8
            },
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 90,
        speedVariance: 20,
        dir: {
            x: 1,
            y: 0.8
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        rotateToDir: 0.375,
        sineRotate: 0.1,
        sineRotateTime: 1.3,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.JUNGLE_LEAVES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 24,
                offY: 32
            },
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 90,
        speedVariance: 20,
        dir: {
            x: 1,
            y: 0.8
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        rotateToDir: 0.375,
        sineRotate: 0.1,
        sineRotateTime: 1.3,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.BLUE_SQUARES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 48
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 30,
        speedVariance: 10,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        time: 2,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.RED_SQUARES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 72
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 80,
        speedVariance: 20,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        time: 1.2,
        timeVariance: 0.3,
        fadeTime: 0.3,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.SNOW_FLAKES = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 96
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 120,
        speedVariance: 20,
        dir: {
            x: 0.4,
            y: 1
        },
        randomFlip: {
            x: false,
            y: false
        },
        sineRotate: 0.05,
        sineRotateTime: 0.5,
        time: 2.5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.COLD_CRYSTALS = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 96,
                offY: 8
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 30,
        speedVariance: 5,
        dir: {
            x: 1,
            y: 0
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0.2,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.SAND_OUTSIDE = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 24
            },
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 160,
        speedVariance: 20,
        dir: {
            x: 1,
            y: 0.2
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        sineRotate: 0.05,
        sineRotateTime: 4,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.SANDSTORM = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 24
            },
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 320,
        speedVariance: 20,
        dir: {
            x: 1,
            y: 0.2
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        sineRotate: 0.05,
        sineRotateTime: 4,
        time: 2,
        timeVariance: 0.5,
        fadeTime: 0.2,
        levels: [{
                scale: 1,
                anim: "small"
            }, {
                scale: 1.2,
                anim: "medium"
            },
            {
                scale: 1.5,
                anim: "big"
            }
        ]
    };
    ig.ENV_PARTICLES.BEACH_GLOW = {
        animSheet: {
            renderMode: "lighter",
            SUB: [{
                name: "big",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 32,
                    height: 32,
                    offX: 24,
                    offY: 144
                }
            }, {
                name: "medium",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 24,
                    height: 24,
                    offX: 0,
                    offY: 144
                }
            }, {
                name: "small",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 16,
                    height: 16,
                    offX: 40,
                    offY: 128
                }
            }, {
                name: "tiny",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 16,
                    height: 16,
                    offX: 24,
                    offY: 128
                }
            }]
        },
        speed: 10,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        rotateToDir: 0.25,
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 1,
        timeRotate: 0.07,
        time: 3,
        timeVariance: 2,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "tiny"
        }, {
            scale: 1.25,
            anim: "small"
        }, {
            scale: 1.5,
            anim: "medium"
        }]
    };
    ig.ENV_PARTICLES.BEACH_GLOW_BIG = {
        animSheet: {
            renderMode: "lighter",
            SUB: [{
                name: "big",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 32,
                    height: 32,
                    offX: 24,
                    offY: 144
                }
            }, {
                name: "medium",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 24,
                    height: 24,
                    offX: 0,
                    offY: 144
                }
            }, {
                name: "small",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 16,
                    height: 16,
                    offX: 40,
                    offY: 128
                }
            }, {
                name: "tiny",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 16,
                    height: 16,
                    offX: 24,
                    offY: 128
                }
            }]
        },
        speed: 10,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        rotateToDir: 0.25,
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 1,
        timeRotate: 0.07,
        time: 3,
        timeVariance: 2,
        fadeTime: 0.5,
        levels: [{
            scale: 1.25,
            anim: "big"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.FINAL_GLOW = {
        animSheet: {
            renderMode: "lighter",
            SUB: [{
                name: "big",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 32,
                    height: 32,
                    offX: 96,
                    offY: 56
                }
            }, {
                name: "medium",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 24,
                    height: 24,
                    offX: 72,
                    offY: 56
                }
            }, {
                name: "small",
                frames: [0],
                time: 0.2,
                sheet: {
                    src: "media/env/particle.png",
                    width: 24,
                    height: 24,
                    offX: 112,
                    offY: 40
                }
            }]
        },
        speed: 10,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        rotateToDir: 0.25,
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 1,
        timeRotate: 0.25,
        time: 3,
        timeVariance: 0,
        fadeTime: 0.5,
        levels: [{
                scale: 1.25,
                anim: "medium"
            },
            {
                scale: 1.5,
                anim: "big"
            }
        ]
    };
    ig.ENV_PARTICLES.FINAL_WHIRL = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 80,
                offY: 88
            },
            renderMode: "lighter",
            SUB: [{
                name: "big",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.2
            }, {
                name: "medium",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.2,
                tileOffset: 6
            }, {
                name: "small",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.2,
                tileOffset: 12
            }]
        },
        speed: 10,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        rotateToDir: 0.25,
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0.1,
        time: 1.2,
        timeVariance: 0,
        fadeTime: 0.1,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.FINAL_WHIRL_FAST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offX: 80,
                offY: 88
            },
            renderMode: "lighter",
            SUB: [{
                name: "big",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.1
            }, {
                name: "medium",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.1,
                tileOffset: 6
            }, {
                name: "small",
                frames: [0, 1, 2, 3, 4, 5],
                time: 0.1,
                tileOffset: 12
            }]
        },
        speed: 80,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        rotateToDir: 0.25,
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0.1,
        time: 0.6,
        timeVariance: 0,
        fadeTime: 0.1,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.COAL_SPARKS = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 24
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 120,
        speedVariance: 20,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        sineRotate: 0.05,
        sineRotateTime: 4,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.COAL_SPARKS_FAST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 24,
                offX: 24
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 240,
        speedVariance: 40,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0.1,
        sineRotate: 0.05,
        sineRotateTime: 4,
        time: 2,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
                scale: 1,
                anim: "small"
            }, {
                scale: 1.2,
                anim: "medium"
            },
            {
                scale: 1.5,
                anim: "big"
            }
        ]
    };
    ig.ENV_PARTICLES.INFESTED_DUST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 48
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 20,
        speedVariance: 5,
        dir: {
            x: 0,
            y: 1
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 1,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.WAVE_DUST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 24,
                offX: 48
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 20,
        speedVariance: 5,
        dir: {
            x: 0,
            y: 1
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 1,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.SPOOKY_DUST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 72
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 20,
        speedVariance: 5,
        dir: {
            x: 0,
            y: 1
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 1,
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.ARID_DUST_1 = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 96
            },
            renderMode: "lighter",
            repeat: true,
            SUB: [{
                name: "small",
                frames: [0, 1, 2, 3],
                time: 0.2
            }, {
                name: "medium",
                frames: [4,
                    5, 6, 7
                ],
                time: 0.2
            }, {
                name: "big",
                frames: [8, 9, 10, 11],
                time: 0.2
            }]
        },
        speed: 10,
        speedVariance: 2,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0,
        sineRotate: 0,
        sineRotateTime: 2,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.ARID_DUST_FAST = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 96
            },
            renderMode: "lighter",
            repeat: true,
            SUB: [{
                name: "small",
                frames: [0, 1, 2, 3],
                time: 0.2
            }, {
                name: "medium",
                frames: [4, 5, 6, 7],
                time: 0.2
            }, {
                name: "big",
                frames: [8, 9, 10, 11],
                time: 0.2
            }]
        },
        speed: 100,
        speedVariance: 2,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0,
        sineRotate: 0,
        sineRotateTime: 2,
        time: 5,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.ARID_DUST_ELEVATOR_UP = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 96
            },
            renderMode: "lighter",
            repeat: true,
            SUB: [{
                    name: "small",
                    frames: [0, 1, 2, 3],
                    time: 0.2
                },
                {
                    name: "medium",
                    frames: [4, 5, 6, 7],
                    time: 0.2
                }, {
                    name: "big",
                    frames: [8, 9, 10, 11],
                    time: 0.2
                }
            ]
        },
        speed: 350,
        speedVariance: 2,
        dir: {
            x: 0,
            y: 1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0,
        sineRotate: 0,
        sineRotateTime: 2,
        time: 0.5,
        timeVariance: 0.2,
        fadeTime: 0.2,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.ARID_DUST_ELEVATOR_DOWN = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 8,
                height: 8,
                offY: 16,
                offX: 96
            },
            renderMode: "lighter",
            repeat: true,
            SUB: [{
                name: "small",
                frames: [0,
                    1, 2, 3
                ],
                time: 0.2
            }, {
                name: "medium",
                frames: [4, 5, 6, 7],
                time: 0.2
            }, {
                name: "big",
                frames: [8, 9, 10, 11],
                time: 0.2
            }]
        },
        speed: -350,
        speedVariance: 2,
        dir: {
            x: 0,
            y: 1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0,
        sineRotate: 0,
        sineRotateTime: 2,
        time: 0.5,
        timeVariance: 0.2,
        fadeTime: 0.2,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.RHOMBUS = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 16,
                height: 16,
                offY: 40,
                offX: 0
            },
            renderMode: "lighter",
            SUB: [{
                    name: "small",
                    frames: [0],
                    time: 0.1
                },
                {
                    name: "medium",
                    frames: [1],
                    time: 0.1
                }, {
                    name: "big",
                    frames: [2],
                    time: 0.1
                }
            ]
        },
        speed: 20,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        time: 3,
        timeVariance: 0.5,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.HACKING = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 16,
                height: 16,
                offY: 40,
                offX: 48
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 120,
        speedVariance: 5,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 1,
        time: 0.7,
        timeVariance: 0.2,
        fadeTime: 0.2,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.STARS = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 24,
                height: 24,
                offY: 56,
                offX: 0
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [2],
                time: 0.1
            }]
        },
        speed: 160,
        speedVariance: 20,
        dir: {
            x: 0.5,
            y: -1
        },
        randomFlip: {
            x: false,
            y: false
        },
        randomRotate: 0,
        timeRotate: 0.5,
        time: 2,
        timeVariance: 0.2,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1.2,
            anim: "medium"
        }, {
            scale: 1.5,
            anim: "big"
        }]
    };
    ig.ENV_PARTICLES.SLOWDOWN = {
        animSheet: {
            sheet: {
                src: "media/env/particle.png",
                width: 29,
                height: 29,
                offY: 88,
                offX: 0
            },
            renderMode: "lighter",
            SUB: [{
                name: "small",
                frames: [0],
                time: 0.1
            }, {
                name: "medium",
                frames: [1],
                time: 0.1
            }, {
                name: "big",
                frames: [0],
                time: 0.1
            }]
        },
        speed: 80,
        speedVariance: 20,
        dir: {
            x: 0,
            y: -1
        },
        randomFlip: {
            x: true,
            y: false
        },
        randomRotate: 0,
        timeRotate: 0.1,
        time: 1,
        timeVariance: 0.2,
        fadeTime: 0.5,
        levels: [{
            scale: 1,
            anim: "small"
        }, {
            scale: 1,
            anim: "medium"
        }],
        ignoreSlowdown: true,
        renderInScreen: true
    };

    var mapPosVec = Vec2.create();

    ig.EnvParticleSpawner = ig.Cacheable.extend({
        cacheType: "EnvParticleSpawner",
        name: null,
        animSheet: null,
        config: null,
        levels: [],

        /**
         * @param {string} name - key into `ig.ENV_PARTICLES` (e.g. "LEAVES")
         */
        init: function (name) {
            this.parent();
            this.name = name;
            var config = ig.ENV_PARTICLES[name];
            config || ig.warn("Unknown environment particles '" + name + "'");
            if (this.config = config) {
                this.animSheet = new ig.AnimationSheet(config.animSheet);
                this._initLevels();
            }
        },

        getCacheKey: function (name) {
            return name;
        },

        onCacheCleared: function () {
            this.animSheet && this.animSheet.clearCached();
        },

        /** Build one per-level state entry (spawn timing + live particles). */
        _initLevels: function () {
            if (this.config) {
                for (var i = this.config.levels, j = 0; j < i.length; ++j) {
                    var levelData = i[j];
                    this.levels.push({
                        scale: levelData.scale,
                        anim: levelData.anim,
                        spawnInterval: 0,
                        spawnTimer: 0,
                        particles: []
                    });
                }
            }
        },

        /**
         * Distribute `quantity` particles across the levels, weighted by
         * inverse scale (small levels get proportionally more). When
         * `immediately` is set, pre-fill each level with its full budget.
         */
        setQuantity: function (quantity, immediately) {
            if (this.config) {
                for (var scaleWeightSum = 0, i = 0; i < this.levels.length; ++i) {
                    scaleWeightSum = scaleWeightSum + 1 / this.levels[i].scale;
                }
                for (i = 0; i < this.levels.length; ++i) {
                    var level = this.levels[i],
                        levelQuantity = quantity * (1 / level.scale) / scaleWeightSum;
                    level.spawnInterval = this.config.time / levelQuantity;
                    level.spawnTimer = Math.random() * level.spawnInterval;
                    if (immediately) {
                        for (var j = level.particles.length = 0; j < levelQuantity; ++j) {
                            this.updateParticles(level, level.spawnInterval);
                            this.spawnParticle(level);
                        }
                    }
                }
            }
        },

        /**
         * Advance every level by one tick; returns true when no level still
         * has pending particles or spawn timers (i.e. the spawner is spent).
         */
        update: function () {
            if (this.config) {
                for (var allDone = true, i = this.levels.length; i--;) {
                    var level = this.levels[i],
                        tick = this.getTick();
                    this.updateParticles(level, tick);
                    if (level.spawnInterval) {
                        allDone = false;
                        for (level.spawnTimer = level.spawnTimer + tick; level.spawnTimer >= level.spawnInterval;) {
                            level.spawnTimer = level.spawnTimer - level.spawnInterval;
                            this.spawnParticle(level);
                        }
                    } else {
                        level.particles.length > 0 && (allDone = false);
                    }
                }
                return allDone;
            }
        },

        /** Real frame time when the config ignores slow-motion, else game time. */
        getTick: function () {
            return this.config.ignoreSlowdown ? ig.system.actualTick : ig.system.tick;
        },

        /**
         * Create one particle on `level`: random position across the field,
         * direction from the config (optionally flipped / rotated), a speed
         * with variance, and a lifetime with variance.
         */
        spawnParticle: function (level) {
            if (this.config) {
                var duration = this.config.time + (Math.random() - 0.5) * 2 * this.config.timeVariance,
                    pos = Vec2.createC(ig.envParticles.width, ig.envParticles.height);
                Vec2.mulC(pos, Math.random(), Math.random());
                var vel = Vec2.create(this.config.dir);
                if (this.config.randomFlip.x && Math.random() >= 0.5) vel.x = vel.x * -1;
                if (this.config.randomFlip.y && Math.random() >= 0.5) vel.y = vel.y * -1;
                if (this.config.randomRotate > 0) {
                    var rotation = (Math.random() - 0.5) * this.config.randomRotate * 2 * Math.PI;
                    Vec2.rotate(vel, rotation);
                }
                rotation = this.config.speed + (Math.random() - 0.5) * 2 * this.config.speedVariance * level.scale;
                Vec2.length(vel, rotation);
                level.particles.push({
                    duration: duration,
                    timer: 0,
                    hideTimer: 0,
                    pos: pos,
                    vel: vel,
                    roughDisplayPos: -1
                });
            }
        },

        /**
         * Age all particles of `level` by `tick`, removing expired ones.
         * When the config enables sinusoidal rotation, adds a perpendicular
         * sway to each particle's velocity while preserving its length.
         */
        updateParticles: function (level, tick) {
            for (var particles = level.particles, i = particles.length; i--;) {
                var particle = particles[i];
                particle.timer = particle.timer + tick;
                if (particle.timer >= particle.duration) {
                    particles.splice(i, 1);
                } else {
                    if (this.config.sineRotateTime) {
                        var swayAmount = Math.sin(Math.PI * 2 * particle.timer / this.config.sineRotateTime + Math.PI * 0.52) *
                                this.config.sineRotate * this.getTick() * 22 / this.config.sineRotateTime,
                            swayVec = Vec2.assign(scratchVec, particle.vel),
                            velLength = Vec2.length(particle.vel);
                        Vec2.rotate90CW(swayVec);
                        Vec2.mulF(swayVec, swayAmount);
                        Vec2.add(particle.vel, swayVec);
                        Vec2.length(particle.vel, velLength);
                    }
                    Vec2.addMulF(particle.pos, particle.vel, tick);
                }
            }
        },

        draw: function () {
            if (this.config) {
                for (var i = this.levels.length; i--;) this.drawLevel(this.levels[i]);
            }
        },

        /**
         * Draw one level's particles, wrapping them around the field edges and
         * (unless `renderInScreen`) scrolling them with the map. Non-scale-1
         * levels are inset so particles stay centred on screen. Fade in/out
         * near spawn and expiry; hide particles inside solid map tiles.
         */
        drawLevel: function (level) {
            var renderer = ig.game.renderer,
                animations = this.animSheet.anims[level.anim].getAnimations(),
                particles = level.particles,
                particleCount = particles.length,
                rotation = 0,
                scale = level.scale,
                scaleOffset = (scale - 1) * (ig.system.zoom - 1),
                offsetX = 0,
                offsetY = 0;
            if (scale != 1) {
                var mapPos = ig.system.getMapFromScreenPos(mapPosVec, ig.system.width / 2, ig.system.height / 2);
                offsetX = ig.game.screen.x + ig.system.width / 2 - mapPos.x;
                offsetY = ig.game.screen.y + ig.system.height / 2 - mapPos.y;
            }
            var fieldWidth = ig.envParticles.width,
                fieldHeight = ig.envParticles.height;
            offsetX = (ig.game.screen.x - offsetX) * scale + offsetX;
            offsetY = (ig.game.screen.y - offsetY) * scale + offsetY;
            var fadeTime = this.config.fadeTime;
            for (; particleCount--;) {
                var particle = particles[particleCount],
                    posX = particle.pos.x - (this.config.renderInScreen ? 0 : offsetX),
                    posY = particle.pos.y - (this.config.renderInScreen ? 0 : offsetY);
                posX = (posX % fieldWidth + fieldWidth) % fieldWidth;
                posY = (posY % fieldHeight + fieldHeight) % fieldHeight;
                posX = posX - margin;
                posY = posY - margin;
                var quadrant = (posX > fieldWidth / 2 ? 1 : 0) + (posY > fieldHeight / 2 ? 2 : 0),
                    quadrantChanged = quadrant != particle.roughDisplayPos;
                particle.roughDisplayPos = quadrant;
                if (scaleOffset) {
                    posX = posX + (posX - fieldWidth / 2) * scaleOffset;
                    posY = posY + (posY - fieldHeight / 2) * scaleOffset;
                }
                if (!ig.weather.outside && ig.game.isMapTileEmpty(posX + ig.game.screen.x, posY + ig.game.screen.y)) {
                    particle.hideTimer = quadrantChanged ? 0.3 : Math.min(0.3, particle.hideTimer + this.getTick());
                } else if (particle.hideTimer > 0) {
                    particle.hideTimer = quadrantChanged ? 0 : Math.max(0, particle.hideTimer - this.getTick());
                }
                if (!(particle.hideTimer >= 0.3)) {
                    this.config.rotateToDir != void 0 && (rotation = Vec2.clockangle(particle.vel) - this.config.rotateToDir * 2 * Math.PI);
                    this.config.timeRotate && (rotation = this.config.timeRotate * particle.timer * 2 * Math.PI);
                    var alpha = 1 - particle.hideTimer / 0.3;
                    particle.timer < fadeTime ? alpha = alpha * (particle.timer / fadeTime) :
                        particle.timer > particle.duration - fadeTime && (alpha = alpha * ((particle.duration - particle.timer) / fadeTime));
                    for (var animIndex = animations.length; animIndex--;) {
                        renderer.drawAnimation(animations[animIndex], posX, posY, particle.timer, alpha, rotation);
                    }
                }
            }
        }
    });

    var scratchVec = Vec2.create(),
        margin = 32;

    /** Owns all active spawners and draws them once per frame mid-draw. */
    ig.EnvParticles = ig.GameAddon.extend({
        activeSpawners: [],
        width: 0,
        height: 0,

        init: function () {
            this.parent("EnvParticles");
            this.width = ig.system.width + margin * 2;
            this.height = ig.system.height + margin * 2;
        },

        /**
         * Activate `spawner` (unless it is already active or `quantity` is 0)
         * and set its particle budget.
         */
        addSpawner: function (spawner, quantity, immediately) {
            this.activeSpawners.indexOf(spawner) == -1 && quantity > 0 && this.activeSpawners.push(spawner);
            spawner.setQuantity(quantity, immediately);
        },

        /** Clear every active spawner; with `immediately`, drop them all now. */
        clear: function (immediately) {
            for (var i = this.activeSpawners.length; i--;) {
                this.activeSpawners[i].setQuantity(0, immediately);
            }
            if (immediately) this.activeSpawners.length = 0;
        },

        deferredUpdateOrder: 0,

        /** Update all spawners; remove the ones that have run out of particles. */
        onDeferredUpdate: function () {
            if (!ig.game.paused) {
                for (var i = this.activeSpawners.length; i--;) {
                    this.activeSpawners[i].update() && this.activeSpawners.splice(i, 1);
                }
            }
        },

        midDrawOrder: 101,

        /** Draw all active spawners (when enabled in options) and reset blending. */
        onMidDraw: function () {
            if (ig.perf.envParticles && sc.options.get("env-particles")) {
                for (var i = this.activeSpawners.length; i--;) this.activeSpawners[i].draw();
                ig.system.context.globalCompositeOperation = "source-over";
            }
        }
    });

    ig.addGameAddon(function () {
        return ig.envParticles = new ig.EnvParticles();
    })

});
ig.baked = !0;
