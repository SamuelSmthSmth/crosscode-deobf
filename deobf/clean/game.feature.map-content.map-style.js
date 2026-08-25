/**
 * @module game.feature.map-content.map-style
 *
 * Map style registrations: which sprite sheets, door mats, teleport field
 * tiles, door variations, and special object tiles each area style uses.
 * All data, no logic.
 */
ig.module("game.feature.map-content.map-style").requires("impact.feature.map-content.map-style").defines(function() {
    ig.MapStyle.registerStyle("default", "map", {
        sheet: "media/entity/style/default-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("default", "puzzle", {
        sheet: "media/entity/style/default-puzzle.png"
    });
    ig.MapStyle.registerStyle("default", "puzzle2", {
        sheet: "media/entity/style/default-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("default", "destruct", {
        sheet: "media/entity/style/default-destruct.png"
    });
    ig.MapStyle.registerStyle("default", "walls", {
        colors: {
            blockFront: "#475ae2",
            blockTop: "#e6e9ff",
            pBlockFront: "#80ff83",
            pBlockTop: "#b3c9ff",
            npBlockFront: "#eb8835",
            npBlockTop: "#ffe2ca"
        }
    });
    ig.MapStyle.registerStyle("cargo-hold", "map", {
        sheet: "media/entity/style/cargo-hold-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("cargo-ship-outer", "map", {
        sheet: "media/entity/style/cargo-outer-map.png",
        hasDoorMat: false
    });
    ig.MapStyle.registerStyle("cargo-ship-bridge", "map", {
        sheet: "media/entity/style/cargo-bridge-map.png",
        hasDoorMat: false
    });
    ig.MapStyle.registerStyle("rhombus-puzzle", "map", {
        sheet: "media/entity/style/rhombus-dng-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("rhombus-puzzle", "puzzle", {
        sheet: "media/entity/style/rhombus-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("rhombus-puzzle", "walls", {
        colors: {
            blockFront: "#71a3ff",
            blockTop: "#b6dcff",
            pBlockFront: "#80ff83",
            pBlockTop: "#b3c9ff",
            npBlockFront: "#ffba80",
            npBlockTop: "#ffd6b3"
        }
    });
    ig.MapStyle.registerStyle("rhombus-outside", "map", {
        sheet: "media/entity/style/rhombus-outside-map.png",
        hasDoorMat: false,
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        },
        teleportField: {
            x: 0,
            y: 96,
            xCount: 3,
            zHeight: 0
        },
        doorVariations: {
            glass: {
                x: 160,
                y: 0,
                doorMat: false
            }
        }
    });
    ig.MapStyle.registerStyle("evo-outside", "map", {
        sheet: "media/entity/style/evo-village-map.png",
        hasDoorMat: false,
        doorSound: "EVO",
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        },
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        },
        doorVariations: {
            bright: {
                x: 160,
                y: 0,
                doorMat: false
            },
            transparent: {
                x: 160,
                y: 48,
                doorMat: false
            }
        }
    });
    ig.MapStyle.registerStyle("evo-inner", "map", {
        sheet: "media/entity/style/evo-village-inner-map.png",
        hasDoorMat: false,
        doorSound: "EVO",
        doorVariations: {
            brick: {
                x: 160,
                y: 0
            }
        },
        stairDoor: {
            x: 160,
            y: 48
        }
    });
    ig.MapStyle.registerStyle("rhombus-interior", "map", {
        sheet: "media/entity/style/rhombus-interior-map.png",
        hasDoorMat: true,
        doorGlow: {
            x: 144,
            y: 0,
            xCount: 1,
            sideX: 160,
            sideY: 96
        },
        stairDoor: {
            x: 176,
            y: 48
        }
    });
    ig.MapStyle.registerStyle("rookie-harbor-outer",
        "map", {
            sheet: "media/entity/style/rh-outer-map.png",
            hasDoorMat: false,
            teleportField: {
                x: 0,
                y: 48,
                xCount: 3,
                zHeight: 0
            }
        });
    ig.MapStyle.registerStyle("rookie-harbor-interior", "map", {
        sheet: "media/entity/style/rh-interior-map.png",
        hasDoorMat: true,
        doorVariations: {
            wood: {
                x: 160,
                y: 0
            }
        },
        stairDoor: {
            x: 160,
            y: 48
        }
    });
    ig.MapStyle.registerStyle("hideout-outer", "map", {
        sheet: "media/entity/style/hideout-outer-map.png",
        hasDoorMat: false,
        teleportField: {
            x: 0,
            y: 96,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("hideout-inner", "map", {
        sheet: "media/entity/style/hideout-inner-map.png",
        hasDoorMat: false,
        doorVariations: {
            dark: {
                x: 160,
                y: 0
            }
        },
        stairDoor: {
            x: 160,
            y: 48
        }
    });
    ig.MapStyle.registerStyle("autumn", "map", {
        sheet: "media/entity/style/autumn-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("autumn", "puzzle", {
        sheet: "media/entity/style/autumn-puzzle.png"
    });
    ig.MapStyle.registerStyle("cave", "map", {
        sheet: "media/entity/style/cave.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("cave", "effect", {
        sheet: "area.cold-dng"
    });
    ig.MapStyle.registerStyle("cave", "destruct", {
        sheet: "media/entity/style/cave-destruct.png"
    });
    ig.MapStyle.registerStyle("cave", "waterblock", {
        sheet: "media/map/heat-dng.png",
        x: 384,
        y: 304,
        puddleX: 352,
        puddleY: 448
    });
    ig.MapStyle.registerStyle("christmas", "map", {
        sheet: "media/entity/style/cargo-hold-map.png",
        hasDoorMat: true
    });
    ig.MapStyle.registerStyle("christmas", "destruct", {
        sheet: "media/entity/style/christmas-destruct.png"
    });
    ig.MapStyle.registerStyle("bergen-outer",
        "map", {
            sheet: "media/entity/style/bergen-map.png",
            hasDoorMat: false,
            teleportField: {
                x: 0,
                y: 48,
                xCount: 3,
                zHeight: 0
            }
        });
    ig.MapStyle.registerStyle("bergen-outer", "destruct", {
        sheet: "media/entity/style/cold-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("bergen-inner", "map", {
        sheet: "media/entity/style/bergen-inner-map.png",
        hasDoorMat: true,
        stairDoor: {
            x: 160,
            y: 48
        },
        teleportField: {
            x: 0,
            y: 48,
            xCount: 3,
            zHeight: 0
        },
        doorVariations: {
            wood: {
                x: 160,
                y: 0,
                doorMat: false
            }
        }
    });
    ig.MapStyle.registerStyle("bergen-inner", "destruct", {
        sheet: "media/entity/style/cold-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("bergen-inner", "puzzle", {
        sheet: "media/entity/style/bergen-inner-puzzle.png"
    });
    ig.MapStyle.registerStyle("cold-dng", "map", {
        sheet: "media/entity/style/cold-dng-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("cold-dng", "puzzle", {
        sheet: "media/entity/style/cold-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("cold-dng", "puzzle2", {
        sheet: "media/entity/style/cold-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("cold-dng", "walls", {
        colors: {
            blockFront: "#71a3ff",
            blockTop: "#b6dcff",
            pBlockFront: "#80ff83",
            pBlockTop: "#b3c9ff",
            npBlockFront: "#ffba80",
            npBlockTop: "#ffd6b3"
        }
    });
    ig.MapStyle.registerStyle("cold-dng", "lorry", {
        sheet: "media/map/cold-dng.png",
        railX: 176,
        railY: 256,
        lorryX: 128,
        lorryY: 272
    });
    ig.MapStyle.registerStyle("cold-dng", "effect", {
        sheet: "area.cold-dng"
    });
    ig.MapStyle.registerStyle("cold-dng", "destruct", {
        sheet: "media/entity/style/cold-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("heat-outer", "map", {
        sheet: "media/entity/style/heat-map.png",
        hasDoorMat: false,
        doorSound: "STONE",
        teleportField: {
            x: 0,
            y: 48,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("heat-outer", "destruct", {
        sheet: "media/entity/style/heat-destruct.png"
    });
    ig.MapStyle.registerStyle("heat-outer", "quicksand", {
        sheet: "media/map/heat-area-hax.png",
        x: 128,
        y: 48
    });
    ig.MapStyle.registerStyle("heat-inner", "map", {
        sheet: "media/entity/style/heat-interior-map.png",
        hasDoorMat: false,
        doorSound: "STONE",
        stairDoor: {
            x: 160,
            y: 0
        }
    });
    ig.MapStyle.registerStyle("heat-inner", "puzzle", {
        sheet: "media/entity/style/heat-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("heat-inner", "puzzle2", {
        sheet: "media/entity/style/heat-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("heat-inner", "destruct", {
        sheet: "media/entity/style/heat-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("heat-dng", "map", {
        sheet: "media/entity/style/heat-dng-map.png",
        hasDoorMat: true,
        doorSound: "STONE",
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        },
        stairDoor: {
            x: 160,
            y: 0
        }
    });
    ig.MapStyle.registerStyle("heat-dng", "puzzle", {
        sheet: "media/entity/style/heat-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("heat-dng",
        "puzzle2", {
            sheet: "media/entity/style/heat-dng-puzzle-2.png"
        });
    ig.MapStyle.registerStyle("heat-dng", "destruct", {
        sheet: "media/entity/style/heat-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("heat-dng", "waterblock", {
        sheet: "media/map/heat-dng.png",
        x: 384,
        y: 304,
        puddleX: 352,
        puddleY: 448
    });
    ig.MapStyle.registerStyle("heat-dng", "pipes", {
        sheet: "media/map/heat-dng.png",
        x: 320,
        y: 144
    });
    ig.MapStyle.registerStyle("heat-dng", "quicksand", {
        sheet: "media/map/heat-dng.png",
        x: 160,
        y: 272
    });
    ig.MapStyle.registerStyle("heat-dng",
        "walls", {
            colors: {
                blockFront: "#5e5aac",
                blockTop: "#d6d4f6",
                pBlockFront: "#80ff83",
                pBlockTop: "#b3c9ff",
                npBlockFront: "#d95c3b",
                npBlockTop: "#e58c61"
            }
        });
    ig.MapStyle.registerStyle("heat-dng", "lorry", {
        sheet: "media/map/heat-dng.png",
        railX: 176,
        railY: 304,
        lorryX: 128,
        lorryY: 304
    });
    ig.MapStyle.registerStyle("heat-dng", "coals", {
        sheet: "media/map/heat-dng.png",
        x: 432,
        y: 144
    });
    ig.MapStyle.registerStyle("arid-outer", "map", {
        sheet: "media/entity/style/arid-map.png",
        hasDoorMat: false,
        teleportField: {
            x: 0,
            y: 48,
            xCount: 3,
            zHeight: 0
        },
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        }
    });
    ig.MapStyle.registerStyle("arid-outer", "puzzle", {
        sheet: "media/entity/style/arid-puzzle.png"
    });
    ig.MapStyle.registerStyle("arid-outer", "puzzle2", {
        sheet: "media/entity/style/arid-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("unknown-interior", "map", {
        sheet: "media/entity/style/unknown-interior-map.png",
        hasDoorMat: true,
        doorGlow: {
            x: 144,
            y: 0,
            xCount: 1,
            sideX: 160,
            sideY: 96
        }
    });
    ig.MapStyle.registerStyle("unknown-interior", "puzzle", {
        sheet: "media/entity/style/unknown-interior-puzzle.png"
    });
    ig.MapStyle.registerStyle("unknown-interior", "puzzle2", {
        sheet: "media/entity/style/unknown-interior-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("unknown-interior", "pipes", {
        sheet: "media/map/arid-interior.png",
        x: 176,
        y: 368
    });
    ig.MapStyle.registerStyle("unknown-interior", "pipeSwitch", {
        sheet: "media/map/arid-interior.png",
        x: 224,
        y: 432
    });
    ig.MapStyle.registerStyle("unknown-interior", "propeller", {
        sheet: "media/map/arid-interior.png",
        x: 192,
        y: 480
    });
    ig.MapStyle.registerStyle("unknown-interior", "destruct", {
        sheet: "media/entity/style/unknown-interior-destruct.png"
    });
    ig.MapStyle.registerStyle("unknown-interior", "magnet", {
        sheet: "media/map/arid-interior.png",
        x: 256,
        y: 512
    });
    ig.MapStyle.registerStyle("unknown-interior", "tesla", {
        sheet: "media/map/arid-interior.png",
        x: 288,
        y: 544
    });
    ig.MapStyle.registerStyle("unknown-interior", "teslaSwitch", {
        sheet: "media/map/arid-interior.png",
        x: 256,
        y: 544
    });
    ig.MapStyle.registerStyle("unknown-interior", "anticompressor", {
        sheet: "media/map/arid-interior.png",
        x: 288,
        y: 592
    });
    ig.MapStyle.registerStyle("unknown-interior", "dynPlatformSmall", {
        sheet: "media/map/arid-interior.png",
        x: 416,
        y: 624
    });
    ig.MapStyle.registerStyle("unknown-interior", "dynPlatformMedium", {
        sheet: "media/map/arid-interior.png",
        x: 368,
        y: 624
    });
    ig.MapStyle.registerStyle("unknown-interior", "effect", {
        sheet: "area.cold-dng"
    });
    ig.MapStyle.registerStyle("unknown-interior", "rotateBlocker", {
        sheet: "media/map/arid-interior.png",
        x: 208,
        y: 656
    });
    ig.MapStyle.registerStyle("unknown-interior", "waveSwitch", {
        sheet: "media/map/arid-interior.png",
        x: 224,
        y: 736
    });
    ig.MapStyle.registerStyle("unknown-interior", "waveblock", {
        sheet: "media/map/arid-interior.png",
        x: 304,
        y: 656
    });
    ig.MapStyle.registerStyle("unknown-interior", "waterblock", {
        sheet: "media/map/arid-interior.png",
        x: 0,
        y: 784,
        puddleX: 144,
        puddleY: 720
    });
    ig.MapStyle.registerStyle("unknown-interior", "bouncer", {
        sheet: "media/map/arid-interior.png",
        x: 128,
        y: 880
    });
    ig.MapStyle.registerStyle("jungle-outer", "map", {
        sheet: "media/entity/style/jungle-map.png",
        hasDoorMat: false,
        doorSound: "CLOTH",
        teleportField: {
            x: 0,
            y: 96,
            xCount: 3,
            zHeight: 0
        },
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        },
        doorVariations: {
            blue: {
                x: 160,
                y: 0,
                doorMat: false,
                doorGlow: {
                    x: 288,
                    y: 0,
                    xCount: 1
                }
            }
        }
    });
    ig.MapStyle.registerStyle("jungle-outer", "destruct", {
        sheet: "media/entity/style/jungle-destruct.png"
    });
    ig.MapStyle.registerStyle("jungle-outer", "puzzle", {
        sheet: "media/entity/style/shockwave-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("jungle-outer", "puzzle2", {
        sheet: "media/entity/style/shockwave-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("jungle-outer", "magnet", {
        sheet: "media/map/shockwave-dng.png",
        x: 160,
        y: 272
    });
    ig.MapStyle.registerStyle("tree-inner", "map", {
        sheet: "media/entity/style/jungle-map.png",
        hasDoorMat: false,
        doorSound: "CLOTH",
        teleportField: {
            x: 0,
            y: 96,
            xCount: 3,
            zHeight: 0
        },
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        },
        doorVariations: {
            blue: {
                x: 160,
                y: 0,
                doorMat: false,
                doorGlow: {
                    x: 288,
                    y: 0,
                    xCount: 1
                }
            }
        }
    });
    ig.MapStyle.registerStyle("jungle-city", "map", {
        sheet: "media/entity/style/jungle-city-map.png",
        hasDoorMat: false,
        doorGlow: {
            x: 128,
            y: 0,
            xCount: 1
        },
        teleportField: {
            x: 0,
            y: 48,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("jungle-city", "destruct", {
        sheet: "media/entity/style/jungle-destruct.png"
    });
    ig.MapStyle.registerStyle("jungle-city",
        "puzzle", {
            sheet: "media/entity/style/jungle-city-puzzle.png"
        });
    ig.MapStyle.registerStyle("jungle-city", "puzzle2", {
        sheet: "media/entity/style/shockwave-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("jungle-city", "magnet", {
        sheet: "media/map/shockwave-dng.png",
        x: 160,
        y: 272
    });
    ig.MapStyle.registerStyle("jungle-city", "waveblock", {
        sheet: "media/entity/objects/cargoCrateTeleport.png",
        x: 0,
        y: 0
    });
    ig.MapStyle.registerStyle("jungle-city-inner", "map", {
        sheet: "media/entity/style/jungle-interior-map.png",
        hasDoorMat: true,
        stairDoor: {
            x: 160,
            y: 0
        },
        doorVariations: {
            metal: {
                x: 160,
                y: 48
            },
            elevator: {
                x: 160,
                y: 96
            }
        }
    });
    ig.MapStyle.registerStyle("jungle-city-inner", "puzzle", {
        sheet: "media/entity/style/jungle-city-puzzle.png"
    });
    ig.MapStyle.registerStyle("jungle-city-inner", "magnet", {
        sheet: "media/map/shockwave-dng.png",
        x: 160,
        y: 272
    });
    ig.MapStyle.registerStyle("jungle-city-inner", "waveblock", {
        sheet: "media/entity/objects/cargoCrateTeleport.png",
        x: 0,
        y: 0
    });
    ig.MapStyle.registerStyle("shockwave-dng", "map", {
        sheet: "media/entity/style/shockwave-dng-map.png",
        hasDoorMat: true,
        doorSound: "STONE",
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        },
        stairDoor: {
            x: 160,
            y: 0
        }
    });
    ig.MapStyle.registerStyle("shockwave-dng", "puzzle", {
        sheet: "media/entity/style/shockwave-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("shockwave-dng", "puzzle2", {
        sheet: "media/entity/style/shockwave-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("shockwave-dng", "magnet", {
        sheet: "media/map/shockwave-dng.png",
        x: 160,
        y: 272
    });
    ig.MapStyle.registerStyle("shockwave-dng", "bouncer", {
        sheet: "media/map/shockwave-dng-props.png",
        x: 0,
        y: 0
    });
    ig.MapStyle.registerStyle("shockwave-dng", "waterblock", {
        sheet: "media/map/shockwave-dng.png",
        x: 384,
        y: 304,
        puddleX: 352,
        puddleY: 448
    });
    ig.MapStyle.registerStyle("shockwave-dng", "waveblock", {
        sheet: "media/map/shockwave-dng.png",
        x: 96,
        y: 480
    });
    ig.MapStyle.registerStyle("shockwave-dng", "tesla", {
        sheet: "media/map/shockwave-dng.png",
        x: 240,
        y: 352
    });
    ig.MapStyle.registerStyle("shockwave-dng", "waveSwitch", {
        sheet: "media/map/shockwave-dng.png",
        x: 16,
        y: 696
    });
    ig.MapStyle.registerStyle("shockwave-dng", "anticompressor", {
        sheet: "media/map/shockwave-dng.png",
        x: 240,
        y: 400
    });
    ig.MapStyle.registerStyle("shockwave-dng", "dynPlatformSmall", {
        sheet: "media/map/shockwave-dng.png",
        x: 48,
        y: 640
    });
    ig.MapStyle.registerStyle("shockwave-dng", "dynPlatformMedium", {
        sheet: "media/map/shockwave-dng.png",
        x: 0,
        y: 640
    });
    ig.MapStyle.registerStyle("shockwave-dng", "lorry", {
        sheet: "media/map/shockwave-dng.png",
        railX: 176,
        railY: 304,
        lorryX: 128,
        lorryY: 304
    });
    ig.MapStyle.registerStyle("shockwave-dng", "rotateBlocker", {
        sheet: "media/map/shockwave-dng.png",
        x: 256,
        y: 720
    });
    ig.MapStyle.registerStyle("shockwave-dng", "destruct", {
        sheet: "media/entity/style/shockwave-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("lab", "map", {
        sheet: "media/entity/style/lab-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        }
    });
    ig.MapStyle.registerStyle("lab", "puzzle", {
        sheet: "media/entity/style/lab-interior-puzzle.png"
    });
    ig.MapStyle.registerStyle("lab", "puzzle2", {
        sheet: "media/entity/style/lab-interior-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("lab", "pipes", {
        sheet: "media/map/lab.png",
        x: 0,
        y: 576
    });
    ig.MapStyle.registerStyle("lab", "pipeSwitch", {
        sheet: "media/map/lab.png",
        x: 48,
        y: 640
    });
    ig.MapStyle.registerStyle("lab", "propeller", {
        sheet: "media/map/lab.png",
        x: 0,
        y: 688
    });
    ig.MapStyle.registerStyle("lab", "destruct", {
        sheet: "media/entity/style/lab-interior-destruct.png"
    });
    ig.MapStyle.registerStyle("lab", "magnet", {
        sheet: "media/map/lab.png",
        x: 112,
        y: 576
    });
    ig.MapStyle.registerStyle("lab", "tesla", {
        sheet: "media/map/lab.png",
        x: 144,
        y: 608
    });
    ig.MapStyle.registerStyle("lab", "teslaSwitch", {
        sheet: "media/map/lab.png",
        x: 112,
        y: 608
    });
    ig.MapStyle.registerStyle("lab", "anticompressor", {
        sheet: "media/map/lab.png",
        x: 144,
        y: 656
    });
    ig.MapStyle.registerStyle("lab", "dynPlatformSmall", {
        sheet: "media/map/lab.png",
        x: 408,
        y: 672
    });
    ig.MapStyle.registerStyle("lab", "dynPlatformMedium", {
        sheet: "media/map/lab.png",
        x: 360,
        y: 672
    });
    ig.MapStyle.registerStyle("lab", "effect", {
        sheet: "area.cold-dng"
    });
    ig.MapStyle.registerStyle("lab", "rotateBlocker", {
        sheet: "media/map/lab.png",
        x: 192,
        y: 608
    });
    ig.MapStyle.registerStyle("lab", "waveSwitch", {
        sheet: "media/map/lab.png",
        x: 192,
        y: 672
    });
    ig.MapStyle.registerStyle("lab", "waveblock", {
        sheet: "media/map/lab.png",
        x: 288,
        y: 608
    });
    ig.MapStyle.registerStyle("lab", "bouncer", {
        sheet: "media/map/lab.png",
        x: 320,
        y: 576
    });
    ig.MapStyle.registerStyle("lab", "coals", {
        sheet: "media/map/lab.png",
        x: 448,
        y: 176
    });
    ig.MapStyle.registerStyle("final-dng-inner", "walls", {
        colors: {
            blockFront: "#475ae2",
            blockTop: "#d9eeff",
            pBlockFront: "#80ff83",
            pBlockTop: "#b3c9ff",
            npBlockFront: "#eb8835",
            npBlockTop: "#fff7e5"
        },
        alpha: 0.55
    });
    ig.MapStyle.registerStyle("final-dng-inner",
        "map", {
            sheet: "media/entity/style/final-dng-map.png",
            hasDoorMat: true,
            teleportField: {
                x: 0,
                y: 160,
                xCount: 3,
                zHeight: 0
            },
            doorGlow: {
                x: 144,
                y: 0,
                xCount: 1,
                sideX: 160,
                sideY: 96
            }
        });
    ig.MapStyle.registerStyle("final-dng-inner", "puzzle", {
        sheet: "media/entity/style/final-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("final-dng-inner", "puzzle2", {
        sheet: "media/entity/style/final-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("final-dng-inner", "destruct", {
        sheet: "media/entity/style/final-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("final-dng-inner",
        "pipes", {
            sheet: "media/map/final-dungeon-inner.png",
            x: 64,
            y: 368
        });
    ig.MapStyle.registerStyle("final-dng-inner", "pipeSwitch", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 112,
        y: 432
    });
    ig.MapStyle.registerStyle("final-dng-inner", "propeller", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 64,
        y: 480
    });
    ig.MapStyle.registerStyle("final-dng-inner", "magnet", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 176,
        y: 368
    });
    ig.MapStyle.registerStyle("final-dng-inner", "tesla", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 208,
        y: 400
    });
    ig.MapStyle.registerStyle("final-dng-inner", "teslaSwitch", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 176,
        y: 400
    });
    ig.MapStyle.registerStyle("final-dng-inner", "anticompressor", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 208,
        y: 448
    });
    ig.MapStyle.registerStyle("final-dng-inner", "dynPlatformSmall", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 32,
        y: 480
    });
    ig.MapStyle.registerStyle("final-dng-inner", "dynPlatformMedium", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 424,
        y: 464
    });
    ig.MapStyle.registerStyle("final-dng-inner",
        "effect", {
            sheet: "area.cold-dng"
        });
    ig.MapStyle.registerStyle("final-dng-inner", "rotateBlocker", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 256,
        y: 400
    });
    ig.MapStyle.registerStyle("final-dng-inner", "waveSwitch", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 256,
        y: 464
    });
    ig.MapStyle.registerStyle("final-dng-inner", "waveblock", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 352,
        y: 400
    });
    ig.MapStyle.registerStyle("final-dng-inner", "bouncer", {
        sheet: "media/map/final-dungeon-inner.png",
        x: 384,
        y: 368
    });
    ig.MapStyle.registerStyle("final-dng-inner",
        "lorry", {
            sheet: "media/map/final-dungeon-inner.png",
            railX: 304,
            railY: 256,
            lorryX: 464,
            lorryY: 320
        });
    ig.MapStyle.registerStyle("final-dng-outer", "map", {
        sheet: "media/entity/style/final-dng-outer-map.png",
        hasDoorMat: true,
        teleportField: {
            x: 0,
            y: 160,
            xCount: 3,
            zHeight: 0
        },
        doorGlow: {
            x: 144,
            y: 0,
            xCount: 1,
            sideX: 160,
            sideY: 96
        }
    });
    ig.MapStyle.registerStyle("final-dng-outer", "puzzle", {
        sheet: "media/entity/style/final-dng-puzzle.png"
    });
    ig.MapStyle.registerStyle("final-dng-outer", "puzzle2", {
        sheet: "media/entity/style/final-dng-puzzle-2.png"
    });
    ig.MapStyle.registerStyle("final-dng-outer", "destruct", {
        sheet: "media/entity/style/final-dng-destruct.png"
    });
    ig.MapStyle.registerStyle("final-dng-space", "ferro", {
        space: true
    });
    ig.MapStyle.registerStyle("office", "map", {
        sheet: "media/entity/style/office-map.png",
        hasDoorMat: false,
        doorSound: "EVO"
    })
});
ig.baked = !0;
