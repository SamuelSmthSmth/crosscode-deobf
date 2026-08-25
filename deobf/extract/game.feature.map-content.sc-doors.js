ig.module("game.feature.map-content.sc-doors").requires("impact.feature.map-content.entities.door").defines(function() {
    ig.DOOR_TYPE.COLD_DUNGEON = {
        size: {
            x: 64,
            y: 16,
            z: 64
        },
        preWait: 1.3,
        openEffect: {
            sheet: "area.cold-dng",
            name: "masterDoorOpen"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/cold-dng.png",
                width: 48,
                height: 64,
                xCount: 2,
                offX: 336,
                offY: 576
            },
            SUB: [{
                frames: [0],
                offset: {
                    x: -8,
                    y: -2,
                    z: 0
                },
                SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    },
                    {
                        name: "close",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }
                ]
            }, {
                frames: [1],
                offset: {
                    x: 8,
                    y: -2,
                    z: 0
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "EAST",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    fx: [{
                        type: "SLIDE",
                        dir: "EAST",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }]
        }
    };
    ig.DOOR_TYPE.HEAT_DUNGEON_ENTRANCE = {
        size: {
            x: 56,
            y: 16,
            z: 48
        },
        preWait: 1.3,
        preWaitFast: 0.5,
        openEffect: {
            sheet: "area.heat-dng",
            name: "masterDoorOpen"
        },
        anims: {
            shapeType: "Y_FLAT",
            frames: [0],
            SUB: [{
                    sheet: {
                        src: "media/map/heat-dng-exterior.png",
                        width: 32,
                        height: 28,
                        xCount: 1,
                        offX: 0,
                        offY: 128
                    },
                    offset: {
                        x: -12,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                },
                {
                    sheet: {
                        src: "media/map/heat-dng-exterior.png",
                        width: 32,
                        height: 28,
                        xCount: 1,
                        offX: 32,
                        offY: 128
                    },
                    offset: {
                        x: 12,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/heat-dng-exterior.png",
                        width: 36,
                        height: 28,
                        xCount: 1,
                        offX: 0,
                        offY: 100
                    },
                    offset: {
                        x: -10,
                        y: -2,
                        z: 14
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/heat-dng-exterior.png",
                        width: 28,
                        height: 28,
                        xCount: 1,
                        offX: 36,
                        offY: 100
                    },
                    offset: {
                        x: 14,
                        y: -2,
                        z: 14
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }
            ]
        }
    };
    ig.DOOR_TYPE.HEAT_DUNGEON_MASTER_DOOR = {
        size: {
            x: 64,
            y: 16,
            z: 48
        },
        preWait: 1.3,
        openEffect: {
            sheet: "area.heat-dng",
            name: "masterDoorOpen"
        },
        anims: {
            shapeType: "Y_FLAT",
            frames: [0],
            SUB: [{
                    sheet: {
                        src: "media/map/heat-dng.png",
                        width: 36,
                        height: 28,
                        xCount: 1,
                        offX: 312,
                        offY: 512
                    },
                    offset: {
                        x: -14,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/heat-dng.png",
                        width: 36,
                        height: 28,
                        xCount: 1,
                        offX: 348,
                        offY: 512
                    },
                    offset: {
                        x: 14,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                },
                {
                    sheet: {
                        src: "media/map/heat-dng.png",
                        width: 40,
                        height: 32,
                        xCount: 1,
                        offX: 312,
                        offY: 480
                    },
                    offset: {
                        x: -12,
                        y: -2,
                        z: 14
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/heat-dng.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 352,
                        offY: 480
                    },
                    offset: {
                        x: 16,
                        y: -2,
                        z: 14
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }
            ]
        }
    };
    ig.DOOR_TYPE.SHOCKWAVE_DNG_DOOR = {
        size: {
            x: 64,
            y: 16,
            z: 48
        },
        preWait: 1.3,
        preWaitFast: 0.5,
        openEffect: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpen"
        },
        openEffectFast: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpenFast"
        },
        anims: {
            shapeType: "Y_FLAT",
            frames: [0],
            SUB: [{
                sheet: {
                    src: "media/map/jungle-props.png",
                    width: 36,
                    height: 28,
                    xCount: 1,
                    offX: 440,
                    offY: 464
                },
                offset: {
                    x: -14,
                    y: -2,
                    z: 0
                },
                SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    },
                    {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }
                ]
            }, {
                sheet: {
                    src: "media/map/jungle-props.png",
                    width: 36,
                    height: 28,
                    xCount: 1,
                    offX: 476,
                    offY: 464
                },
                offset: {
                    x: 14,
                    y: -2,
                    z: 0
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "EAST",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 0,
                        end: 1,
                        delay: 0.2,
                        duration: 0.8,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "EAST",
                        start: 0,
                        end: 1,
                        delay: 0.2,
                        duration: 0.8,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "EAST",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }, {
                sheet: {
                    src: "media/map/jungle-props.png",
                    width: 40,
                    height: 32,
                    xCount: 1,
                    offX: 440,
                    offY: 432
                },
                offset: {
                    x: -12,
                    y: -2,
                    z: 14
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "WEST",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 0,
                        end: 1,
                        delay: 0.2,
                        duration: 0.8,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "WEST",
                        start: 0,
                        end: 1,
                        delay: 0.2,
                        duration: 0.8,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }, {
                        type: "SLIDE",
                        dir: "WEST",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }, {
                sheet: {
                    src: "media/map/jungle-props.png",
                    width: 32,
                    height: 32,
                    xCount: 1,
                    offX: 480,
                    offY: 432
                },
                offset: {
                    x: 16,
                    y: -2,
                    z: 14
                },
                SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    },
                    {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }, {
                            type: "SLIDE",
                            dir: "EAST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }
                ]
            }]
        }
    };
    ig.DOOR_TYPE.FINAL_DNG_DOOR = {
        size: {
            x: 64,
            y: 16,
            z: 48
        },
        preWait: 1.3,
        preWaitFast: 0.5,
        openEffect: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpen"
        },
        openEffectFast: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpenFast"
        },
        anims: {
            shapeType: "Y_FLAT",
            frames: [0],
            SUB: [{
                sheet: {
                    src: "media/map/final-dungeon-outer-props.png",
                    width: 24,
                    height: 24,
                    xCount: 3,
                    offX: 0,
                    offY: 480
                },
                offset: {
                    x: 0,
                    y: -3,
                    z: 12
                },
                SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        frames: [1, 2],
                        time: 0.15,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        frames: [1, 2],
                        time: 0.15,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.3,
                            keySpline: "EASE_IN"
                        }]
                    },
                    {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }
                ]
            }, {
                sheet: {
                    src: "media/map/final-dungeon-outer-props.png",
                    width: 32,
                    height: 48,
                    xCount: 1,
                    offX: 0,
                    offY: 432
                },
                offset: {
                    x: -16,
                    y: -2,
                    z: 0
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "WEST",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "WEST",
                        start: 0,
                        end: 1,
                        delay: 0.3,
                        duration: 0.5,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "WEST",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }, {
                sheet: {
                    src: "media/map/final-dungeon-outer-props.png",
                    width: 32,
                    height: 48,
                    xCount: 1,
                    offX: 32,
                    offY: 432
                },
                offset: {
                    x: 16,
                    y: -2,
                    z: 0
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "EAST",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "EAST",
                        start: 0,
                        end: 1,
                        delay: 0.3,
                        duration: 0.5,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "EAST",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }, {
                sheet: {
                    src: "media/map/final-dungeon-outer-props.png",
                    width: 48,
                    height: 24,
                    xCount: 1,
                    offX: 64,
                    offY: 432
                },
                offset: {
                    x: 0,
                    y: -2,
                    z: 24
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 0,
                        end: 1,
                        delay: 0.3,
                        duration: 0.5,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "NORTH",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }, {
                sheet: {
                    src: "media/map/final-dungeon-outer-props.png",
                    width: 48,
                    height: 24,
                    xCount: 1,
                    offX: 64,
                    offY: 456
                },
                offset: {
                    x: 0,
                    y: -2,
                    z: 0
                },
                SUB: [{
                    name: "idle"
                }, {
                    name: "open",
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 0,
                        end: 1,
                        delay: 0.4,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "openFast",
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 0,
                        end: 1,
                        delay: 0.1,
                        duration: 0.6,
                        keySpline: "EASE_IN"
                    }]
                }, {
                    name: "close",
                    time: 1,
                    fx: [{
                        type: "SLIDE",
                        dir: "SOUTH",
                        start: 1,
                        end: 0,
                        duration: 1,
                        keySpline: "EASE_IN"
                    }]
                }]
            }]
        }
    };
    ig.DOOR_TYPE.FINAL_DNG_DOOR_SAPPHIRE = {
        size: {
            x: 112,
            y: 16,
            z: 80
        },
        preWait: 1.3,
        preWaitFast: 0.5,
        openEffect: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpen"
        },
        openEffectFast: {
            sheet: "area.shockwave-dng",
            name: "masterDoorOpenFast"
        },
        anims: {
            shapeType: "Y_FLAT",
            frames: [0],
            SUB: [{
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 80,
                        height: 40,
                        xCount: 1,
                        offX: 288,
                        offY: 208
                    },
                    offset: {
                        x: 0,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 0,
                            end: 1,
                            delay: 0.1,
                            duration: 0.6,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "SOUTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                },
                {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 56,
                        height: 48,
                        xCount: 1,
                        offX: 288,
                        offY: 160
                    },
                    offset: {
                        x: -28,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.3,
                            duration: 0.5,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 56,
                        height: 48,
                        xCount: 1,
                        offX: 344,
                        offY: 160
                    },
                    offset: {
                        x: 28,
                        y: -2,
                        z: 0
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "EAST",
                            start: 0,
                            end: 1,
                            delay: 0.3,
                            duration: 0.5,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "EAST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 368,
                        offY: 208
                    },
                    offset: {
                        x: 0,
                        y: -2,
                        z: 26
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        frames: [0, 0],
                        time: 0.15,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0,
                            duration: 0.8,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        frames: [0, 0],
                        time: 0.15,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.2,
                            duration: 0.3,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 56,
                        height: 32,
                        xCount: 1,
                        offX: 288,
                        offY: 128
                    },
                    offset: {
                        x: -28,
                        y: -2,
                        z: 40
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 0,
                            end: 1,
                            delay: 0.3,
                            duration: 0.5,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "WEST",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }, {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 56,
                        height: 32,
                        xCount: 1,
                        offX: 344,
                        offY: 128
                    },
                    offset: {
                        x: 28,
                        y: -2,
                        z: 40
                    },
                    SUB: [{
                            name: "idle"
                        }, {
                            name: "open",
                            fx: [{
                                type: "SLIDE",
                                dir: "EAST",
                                start: 0,
                                end: 1,
                                delay: 0.4,
                                duration: 1,
                                keySpline: "EASE_IN"
                            }]
                        },
                        {
                            name: "openFast",
                            fx: [{
                                type: "SLIDE",
                                dir: "EAST",
                                start: 0,
                                end: 1,
                                delay: 0.3,
                                duration: 0.5,
                                keySpline: "EASE_IN"
                            }]
                        }, {
                            name: "close",
                            time: 1,
                            fx: [{
                                type: "SLIDE",
                                dir: "EAST",
                                start: 1,
                                end: 0,
                                duration: 1,
                                keySpline: "EASE_IN"
                            }]
                        }
                    ]
                }, {
                    sheet: {
                        src: "media/map/forest-plate.png",
                        width: 64,
                        height: 32,
                        xCount: 1,
                        offX: 288,
                        offY: 96
                    },
                    offset: {
                        x: 0,
                        y: -2,
                        z: 46
                    },
                    SUB: [{
                        name: "idle"
                    }, {
                        name: "open",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.4,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "openFast",
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 0,
                            end: 1,
                            delay: 0.3,
                            duration: 0.5,
                            keySpline: "EASE_IN"
                        }]
                    }, {
                        name: "close",
                        time: 1,
                        fx: [{
                            type: "SLIDE",
                            dir: "NORTH",
                            start: 1,
                            end: 0,
                            duration: 1,
                            keySpline: "EASE_IN"
                        }]
                    }]
                }
            ]
        }
    }
});
ig.baked = !0;
