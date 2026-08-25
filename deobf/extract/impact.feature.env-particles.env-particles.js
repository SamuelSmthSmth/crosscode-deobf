ig.module("impact.feature.env-particles.env-particles").requires("impact.base.game", "impact.base.loader").defines(function() {
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
    var b = Vec2.create();
    ig.EnvParticleSpawner = ig.Cacheable.extend({
        cacheType: "EnvParticleSpawner",
        name: null,
        animSheet: null,
        config: null,
        levels: [],
        init: function(a) {
            this.parent();
            this.name = a;
            var b = ig.ENV_PARTICLES[a];
            b || ig.warn("Unknown environment particles '" + a + "'");
            if (this.config = b) {
                this.animSheet = new ig.AnimationSheet(b.animSheet);
                this._initLevels()
            }
        },
        getCacheKey: function(a) {
            return a
        },
        onCacheCleared: function() {
            this.animSheet &&
                this.animSheet.clearCached()
        },
        _initLevels: function() {
            if (this.config)
                for (var a = this.config.levels, b = 0; b < a.length; ++b) {
                    var d = a[b];
                    this.levels.push({
                        scale: d.scale,
                        anim: d.anim,
                        spawnInterval: 0,
                        spawnTimer: 0,
                        particles: []
                    })
                }
        },
        setQuantity: function(a, b) {
            if (this.config) {
                for (var d = 0, g = 0; g < this.levels.length; ++g) d = d + 1 / this.levels[g].scale;
                for (g = 0; g < this.levels.length; ++g) {
                    var h = this.levels[g],
                        i = a * (1 / h.scale) / d;
                    h.spawnInterval = this.config.time / i;
                    h.spawnTimer = Math.random() * h.spawnInterval;
                    if (b)
                        for (var j = h.particles.length =
                                0; j < i; ++j) {
                            this.updateParticles(h, h.spawnInterval);
                            this.spawnParticle(h)
                        }
                }
            }
        },
        update: function() {
            if (this.config) {
                for (var a = true, b = this.levels.length; b--;) {
                    var d = this.levels[b],
                        g = this.getTick();
                    this.updateParticles(d, g);
                    if (d.spawnInterval) {
                        a = false;
                        for (d.spawnTimer = d.spawnTimer + g; d.spawnTimer >= d.spawnInterval;) {
                            d.spawnTimer = d.spawnTimer - d.spawnInterval;
                            this.spawnParticle(d)
                        }
                    } else d.particles.length > 0 && (a = false)
                }
                return a
            }
        },
        getTick: function() {
            return this.config.ignoreSlowdown ? ig.system.actualTick : ig.system.tick
        },
        spawnParticle: function(a) {
            if (this.config) {
                var b = this.config.time + (Math.random() - 0.5) * 2 * this.config.timeVariance,
                    d = Vec2.createC(ig.envParticles.width, ig.envParticles.height);
                Vec2.mulC(d, Math.random(), Math.random());
                var g = Vec2.create(this.config.dir);
                if (this.config.randomFlip.x && Math.random() >= 0.5) g.x = g.x * -1;
                if (this.config.randomFlip.y && Math.random() >= 0.5) g.y = g.y * -1;
                if (this.config.randomRotate > 0) {
                    var h = (Math.random() - 0.5) * this.config.randomRotate * 2 * Math.PI;
                    Vec2.rotate(g, h)
                }
                h = this.config.speed + (Math.random() -
                    0.5) * 2 * this.config.speedVariance * a.scale;
                Vec2.length(g, h);
                a.particles.push({
                    duration: b,
                    timer: 0,
                    hideTimer: 0,
                    pos: d,
                    vel: g,
                    roughDisplayPos: -1
                })
            }
        },
        updateParticles: function(b, d) {
            for (var f = b.particles, g = f.length; g--;) {
                var h = f[g];
                h.timer = h.timer + d;
                if (h.timer >= h.duration) f.splice(g, 1);
                else {
                    if (this.config.sineRotateTime) {
                        var i = Math.sin(Math.PI * 2 * h.timer / this.config.sineRotateTime + Math.PI * 0.52) * this.config.sineRotate * this.getTick() * 22 / this.config.sineRotateTime,
                            j = Vec2.assign(a, h.vel),
                            k = Vec2.length(h.vel);
                        Vec2.rotate90CW(j);
                        Vec2.mulF(j, i);
                        Vec2.add(h.vel, j);
                        Vec2.length(h.vel, k)
                    }
                    Vec2.addMulF(h.pos, h.vel, d)
                }
            }
        },
        draw: function() {
            if (this.config)
                for (var a = this.levels.length; a--;) this.drawLevel(this.levels[a])
        },
        drawLevel: function(a) {
            var e = ig.game.renderer,
                f = this.animSheet.anims[a.anim].getAnimations(),
                g = a.particles,
                h = g.length,
                i = 0,
                j = a.scale,
                a = (j - 1) * (ig.system.zoom - 1),
                k = 0,
                l = 0;
            if (j != 1) var o = ig.system.getMapFromScreenPos(b, ig.system.width / 2, ig.system.height / 2),
                k = ig.game.screen.x + ig.system.width / 2 - o.x,
                l = ig.game.screen.y + ig.system.height /
                2 - o.y;
            for (var o = ig.envParticles.width, m = ig.envParticles.height, k = (ig.game.screen.x - k) * j + k, j = (ig.game.screen.y - l) * j + l, l = this.config.fadeTime; h--;) {
                var n = g[h],
                    p = n.pos.x - (this.config.renderInScreen ? 0 : k),
                    r = n.pos.y - (this.config.renderInScreen ? 0 : j),
                    p = (p % o + o) % o,
                    r = (r % m + m) % m,
                    p = p - d,
                    r = r - d,
                    t = (p > o / 2 ? 1 : 0) + (r > m / 2 ? 2 : 0),
                    q = t != n.roughDisplayPos;
                n.roughDisplayPos = t;
                if (a) {
                    p = p + (p - o / 2) * a;
                    r = r + (r - m / 2) * a
                }
                if (!ig.weather.outside && ig.game.isMapTileEmpty(p + ig.game.screen.x, r + ig.game.screen.y)) n.hideTimer = q ? 0.3 : Math.min(0.3, n.hideTimer +
                    this.getTick());
                else if (n.hideTimer > 0) n.hideTimer = q ? 0 : Math.max(0, n.hideTimer - this.getTick());
                if (!(n.hideTimer >= 0.3)) {
                    this.config.rotateToDir != void 0 && (i = Vec2.clockangle(n.vel) - this.config.rotateToDir * 2 * Math.PI);
                    this.config.timeRotate && (i = this.config.timeRotate * n.timer * 2 * Math.PI);
                    t = 1 - n.hideTimer / 0.3;
                    n.timer < l ? t = t * (n.timer / l) : n.timer > n.duration - l && (t = t * ((n.duration - n.timer) / l));
                    for (q = f.length; q--;) e.drawAnimation(f[q], p, r, n.timer, t, i)
                }
            }
        }
    });
    var a = Vec2.create(),
        d = 32;
    ig.EnvParticles = ig.GameAddon.extend({
        activeSpawners: [],
        width: 0,
        height: 0,
        init: function() {
            this.parent("EnvParticles");
            this.width = ig.system.width + d * 2;
            this.height = ig.system.height + d * 2
        },
        addSpawner: function(a, b, d) {
            this.activeSpawners.indexOf(a) == -1 && b > 0 && this.activeSpawners.push(a);
            a.setQuantity(b, d)
        },
        clear: function(a) {
            for (var b = this.activeSpawners.length; b--;) this.activeSpawners[b].setQuantity(0, a);
            if (a) this.activeSpawners.length = 0
        },
        deferredUpdateOrder: 0,
        onDeferredUpdate: function() {
            if (!ig.game.paused)
                for (var a = this.activeSpawners.length; a--;) this.activeSpawners[a].update() &&
                    this.activeSpawners.splice(a, 1)
        },
        midDrawOrder: 101,
        onMidDraw: function() {
            if (ig.perf.envParticles && sc.options.get("env-particles")) {
                for (var a = this.activeSpawners.length; a--;) this.activeSpawners[a].draw();
                ig.system.context.globalCompositeOperation = "source-over"
            }
        }
    });
    ig.addGameAddon(function() {
        return ig.envParticles = new ig.EnvParticles
    })
});
ig.baked = !0;
