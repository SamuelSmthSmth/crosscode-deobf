/**
 * @module game.feature.map-content.entities.elevator
 *
 * Elevator system: per-area elevator type configs (size, ground sprite,
 * switch/button placement, sound/effects, stuck probability, party offsets),
 * the Elevator entity (moves vertically between configured destinations,
 * optionally teleporting to another map, with a block event and rumble
 * feedback), the elevator model (move sound handling + var accessor), and
 * the interactive switch entity.
 */
ig.module("game.feature.map-content.entities.elevator").requires("impact.base.entity", "game.feature.interact.map-interact", "impact.base.actor-entity").defines(function() {
    sc.ELEVATOR_TYPE = {};
    sc.ELEVATOR_TYPE.cargoShip = {
        size: {
            x: 64,
            y: 48,
            z: 4
        },
        ground: {
            gfx: "media/entity/objects/elevator.png",
            x: 0,
            y: 24,
            w: 64,
            h: 64,
            flipX: false
        },
        markerDir: "SOUTH",
        stuckProbility: 0.5,
        switchEntry: {
            pos: {
                x: 26,
                y: 2,
                z: 4
            },
            size: {
                x: 10,
                y: 10,
                z: 9
            },
            anims: {
                sheet: {
                    src: "media/entity/objects/elevator.png",
                    width: 16,
                    height: 24
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        }
    };
    sc.ELEVATOR_TYPE.coldDng = {
        size: {
            x: 96,
            y: 64,
            z: 2
        },
        ground: {
            gfx: "media/map/cold-dng.png",
            x: 400,
            y: 304,
            w: 96,
            h: 80,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: -1
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0.5,
        switchEntry: {
            pos: {
                x: 43,
                y: 0,
                z: 2
            },
            size: {
                x: 10,
                y: 6,
                z: 16
            },
            anims: {
                sheet: {
                    src: "media/map/cold-dng.png",
                    width: 16,
                    height: 16,
                    offX: 448,
                    offY: 256,
                    xCount: 1
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        }
    };
    sc.ELEVATOR_TYPE.lab = {
        size: {
            x: 96,
            y: 64,
            z: 2
        },
        ground: {
            gfx: "media/map/lab.png",
            x: 416,
            y: 560,
            w: 96,
            h: 80,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: -1
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 32,
                y: 0,
                z: 2
            },
            size: {
                x: 32,
                y: 3,
                z: 13
            },
            anims: {
                sheet: {
                    src: "media/map/lab.png",
                    width: 32,
                    height: 16,
                    offX: 448,
                    offY: 528,
                    xCount: 1
                },
                offset: {
                    x: 0,
                    y: 0,
                    z: 3
                },
                renderMode: "lighter",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            },
            showFx: {
                sheet: "map.lab-entrance",
                name: "elevatorOn"
            },
            hideFx: {
                sheet: "map.lab-entrance",
                name: "elevatorOff"
            }
        }
    };
    sc.ELEVATOR_TYPE.labSmall = {
        size: {
            x: 32,
            y: 28,
            z: 2
        },
        ground: {
            gfx: "media/map/lab.png",
            x: 464,
            y: 640,
            w: 32,
            h: 32,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        noEndRunble: true,
        speed: 170,
        switchEntry: {
            pos: {
                x: 8,
                y: 0,
                z: 2
            },
            size: {
                x: 16,
                y: 2,
                z: 20
            },
            collType: ig.COLLTYPE.IGNORE,
            anims: {
                sheet: {
                    src: "media/map/lab.png",
                    width: 16,
                    height: 16,
                    offX: 496,
                    offY: 640,
                    xCount: 1
                },
                renderMode: "lighter",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            },
            showFx: {
                sheet: "map.lab-entrance",
                name: "elevatorOnSmall"
            },
            hideFx: {
                sheet: "map.lab-entrance",
                name: "elevatorOffSmall"
            }
        },
        partyOffset: [{
            x: 24,
            y: 0
        }, {
            x: -24,
            y: 0
        }, {
            x: 0,
            y: 4
        }],
        singlePerson: true
    };
    sc.ELEVATOR_TYPE.labSmallOutside = {
        size: {
            x: 32,
            y: 28,
            z: 2
        },
        ground: {
            gfx: "media/map/lab-entrance.png",
            x: 32,
            y: 64,
            w: 32,
            h: 32,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        noEndRunble: true,
        speed: 170,
        switchEntry: {
            pos: {
                x: 8,
                y: 0,
                z: 2
            },
            size: {
                x: 16,
                y: 2,
                z: 20
            },
            collType: ig.COLLTYPE.IGNORE,
            anims: {
                sheet: {
                    src: "media/map/lab-entrance.png",
                    width: 16,
                    height: 16,
                    offX: 32,
                    offY: 96,
                    xCount: 1
                },
                renderMode: "lighter",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        },
        partyOffset: [{
            x: 24,
            y: 0
        }, {
            x: -24,
            y: 0
        }, {
            x: 0,
            y: 4
        }],
        singlePerson: true
    };
    sc.ELEVATOR_TYPE.aridInner = {
        size: {
            x: 64,
            y: 48,
            z: 4
        },
        ground: {
            gfx: "media/map/arid-interior.png",
            x: 384,
            y: 368,
            w: 64,
            h: 56,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        markerDir: "NORTH",
        stuckProbility: 0.5,
        switchEntry: {
            pos: {
                x: 24,
                y: 0,
                z: 4
            },
            size: {
                x: 16,
                y: 8,
                z: 16
            },
            collType: ig.COLLTYPE.IGNORE,
            anims: {
                sheet: {
                    src: "media/map/arid-interior.png",
                    width: 16,
                    height: 24,
                    offX: 448,
                    offY: 368,
                    xCount: 1
                },
                renderMode: "lighter",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [-1]
                }]
            }
        }
    };
    sc.ELEVATOR_TYPE.aridInnerHuge = {
        size: {
            x: 448,
            y: 256,
            z: 4
        },
        ground: {
            gfx: "media/map/arid-interior-elevator.png",
            x: 0,
            y: 0,
            w: 448,
            h: 260,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        markerDir: "NORTH",
        stuckProbility: 0,
        speed: 120,
        startDelta: 64,
        switchEntry: {
            pos: {
                x: 216,
                y: 96,
                z: 4
            },
            size: {
                x: 16,
                y: 8,
                z: 16
            },
            collType: ig.COLLTYPE.IGNORE,
            anims: {
                sheet: {
                    src: "media/map/arid-interior.png",
                    width: 16,
                    height: 24,
                    offX: 448,
                    offY: 368,
                    xCount: 1
                },
                renderMode: "lighter",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [-1]
                }]
            },
            showFx: {
                sheet: "area.arid",
                name: "elevatorAppear"
            },
            hideFx: {
                sheet: "area.arid",
                name: "elevatorDisappear"
            }
        }
    };
    sc.ELEVATOR_TYPE.aridDngWeird = {
        size: {
            x: 64,
            y: 13,
            z: 4
        },
        ground: {
            gfx: "media/map/arid-scaffolding.png",
            x: 416,
            y: 352,
            w: 64,
            h: 32,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 16,
                y: 0,
                z: 4
            },
            size: {
                x: 16,
                y: 2,
                z: 14
            },
            collType: ig.COLLTYPE.IGNORE,
            anims: {
                sheet: {
                    src: "media/map/arid-scaffolding.png",
                    width: 16,
                    height: 16,
                    offX: 480,
                    offY: 352,
                    xCount: 1
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        }
    };
    sc.ELEVATOR_TYPE.aridDngOutside = {
        size: {
            x: 48,
            y: 32,
            z: 4
        },
        ground: {
            gfx: "media/map/arid-dng-outside.png",
            x: 304,
            y: 24,
            w: 48,
            h: 56,
            flipX: false
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 19,
                y: 0,
                z: 4
            },
            size: {
                x: 10,
                y: 8,
                z: 12
            },
            anims: {
                sheet: {
                    src: "media/map/arid-dng-outside.png",
                    width: 16,
                    height: 24,
                    offX: 352,
                    offY: 32
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        }
    };
    sc.ELEVATOR_TYPE.basinKeep = {
        size: {
            x: 32,
            y: 48,
            z: 1
        },
        ground: {
            gfx: "media/map/jungle-interior.png",
            x: 480,
            y: 416,
            w: 32,
            h: 96,
            flipX: false
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 16,
                y: 0,
                z: 0
            },
            size: {
                x: 16,
                y: 0,
                z: 36
            },
            anims: {
                sheet: {
                    src: "media/map/jungle-interior.png",
                    width: 16,
                    height: 16,
                    offX: 464,
                    offY: 416
                },
                offset: {
                    z: 16
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [0]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            }
        },
        posOffset: {
            x: 0,
            y: -16
        },
        partyOffset: [{
            x: 8,
            y: 12
        }, {
            x: -8,
            y: 24
        }, {
            x: 0,
            y: 16
        }],
        closeFrontDoor: true
    };
    sc.ELEVATOR_TYPE.finalDngMedium = {
        size: {
            x: 64,
            y: 48,
            z: 1
        },
        ground: {
            gfx: "media/map/final-dungeon-elevator.png",
            x: 128,
            y: 0,
            w: 64,
            h: 72,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: -2
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 24,
                y: 1,
                z: 1
            },
            size: {
                x: 16,
                y: 4,
                z: 20
            },
            anims: {
                sheet: {
                    src: "media/map/final-dungeon-elevator.png",
                    width: 16,
                    height: 24,
                    offX: 128,
                    offY: 72,
                    xCount: 2
                },
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            },
            showFx: {
                sheet: "area.final",
                name: "elevatorOn"
            },
            hideFx: {
                sheet: "area.final",
                name: "elevatorOff"
            }
        }
    };
    sc.ELEVATOR_TYPE.finalDngLarge = {
        size: {
            x: 128,
            y: 80,
            z: 1
        },
        ground: {
            gfx: "media/map/final-dungeon-elevator.png",
            x: 0,
            y: 0,
            w: 128,
            h: 112,
            flipX: false,
            offset: {
                x: 0,
                y: 0,
                z: -2
            }
        },
        markerDir: "SOUTH",
        stuckProbility: 0,
        switchEntry: {
            pos: {
                x: 56,
                y: 1,
                z: 1
            },
            size: {
                x: 16,
                y: 4,
                z: 20
            },
            anims: {
                sheet: {
                    src: "media/map/final-dungeon-elevator.png",
                    width: 16,
                    height: 24,
                    offX: 128,
                    offY: 72,
                    xCount: 2
                },
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [1]
                }, {
                    name: "disabled",
                    time: 1,
                    frames: [0]
                }]
            },
            showFx: {
                sheet: "area.final",
                name: "elevatorOn"
            },
            hideFx: {
                sheet: "area.final",
                name: "elevatorOff"
            }
        },
        posOffset: {
            x: 0,
            y: -16
        }
    };
    sc.ElevatorModel = ig.GameAddon.extend({
        sound: null,
        soundHandle: null,
        init: function() {
            this.parent("Elevator");
            ig.storage.register(this);
            ig.vars.registerVarAccessor("elevator", this)
        },
        startMoveSound: function(sound) {
            this.sound && this.endMoveSound();
            this.sound = sound.clone();
            sound = this.sound.play(true);
            ig.soundManager.addNamedSound("_elevatorMoving", sound)
        },
        endMoveSound: function(endSound) {
            if (this.sound) {
                this.sound.clearCached();
                this.sound = null;
                ig.soundManager.stopNamedSounds("_elevatorMoving");
                endSound && endSound.play()
            }
        },
        onStoragePreLoad: function() {
            this.endMoveSound()
        },
        onVarAccess: function(path, parts) {
            var name = parts[1],
                elevator = ig.game.namedEntities[name];
            elevator || console.warn("Non-Existant Elevator: " + name);
            elevator instanceof ig.ENTITY.Elevator || console.warn("Entity of this name is not an elevator: " + name);
            if (parts[2] === "dest") return elevator.getCurrentDest();
            console.warn("Unknown Elevator option:" + parts[2])
        }
    });
    ig.addGameAddon(function() {
        return sc.elevatorModel = new sc.ElevatorModel
    });
    ig.LANG_CONTEXT.Elevator = function() {
        return "ELEVATOR"
    };
    var CENTER_POS = Vec2.create();
    ig.ENTITY.Elevator =
        ig.Entity.extend({
            markerDir: null,
            markerFaceDir: Vec2.create(),
            elevatorData: null,
            ground: null,
            groundGfx: null,
            condition: null,
            startZ: 0,
            targetZ: null,
            stopDelay: 0,
            elevatorVel: 0,
            destinations: [],
            stuckTimer: 0,
            blockEvent: null,
            blockEventCondition: null,
            switchEntity: null,
            sounds: {},
            doTeleport: false,
            _wm: new ig.Config({
                spawnable: true,
                attributes: {
                    name: {
                        _type: "String",
                        _info: "Name of the elevator. Used to teleport back to this elevator"
                    },
                    condition: {
                        _type: "VarCondition",
                        _info: "Condition for the elevator to be active",
                        _popup: true
                    },
                    spawnCondition: {
                        _type: "VarCondition",
                        _info: "Condition for the elevator be there!",
                        _popup: true
                    },
                    elevatorType: {
                        _type: "String",
                        _info: "Type of elevator",
                        _select: sc.ELEVATOR_TYPE
                    },
                    destinations: {
                        _type: "ElevatorDests",
                        _info: "Destinations of Elevator",
                        _popup: true
                    },
                    blockEvent: {
                        _type: "Event",
                        _info: "Event to be performed when using the elevator",
                        _popup: true,
                        _optional: true
                    },
                    blockEventCondition: {
                        _type: "VarCondition",
                        _info: "Condition to show the block event when using the elevator"
                    },
                    faceDir: {
                        _type: "String",
                        _info: "If defined: override face dir of marker",
                        _select: ig.ActorEntity.FACE8,
                        _optional: true
                    }
                },
                label: function() {
                    return "[ " + this.condition + " ]\n" + this.map + " > " + this.marker
                }
            }),
            init: function(x, y, settings, extraSettings) {
                this.parent(x, y, settings, extraSettings);
                this.coll.type = ig.COLLTYPE.BLOCK;
                this.coll.zGravityFactor = 0;
                this.map = extraSettings.map || null;
                this.marker = extraSettings.marker;
                this.startZ = this.coll.pos.z;
                this.moveHeight = extraSettings.moveHeight;
                this.sounds.start = new ig.Sound("media/sound/misc/elevator-loop.ogg", 0.7);
                this.sounds.end = new ig.Sound("media/sound/misc/elevator-end.ogg",
                    0.7);
                this.faceDir = extraSettings.faceDir || null;
                if (elevatorData = sc.ELEVATOR_TYPE[extraSettings.elevatorType]) {
                    this.elevatorData = elevatorData;
                    this.markerDir = this.faceDir || elevatorData.markerDir;
                    ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.markerDir] || 0, this.markerFaceDir);
                    this.ground = elevatorData.ground;
                    this.groundGfx = new ig.Image(elevatorData.ground.gfx);
                    Vec3.assign(this.coll.size, elevatorData.size)
                }
                this.initDestinatins(extraSettings.destinations);
                this.condition = new ig.VarCondition(extraSettings.condition);
                if (ig.game.marker === this.name)
                    if (elevatorData = ig.vars.get("_system.elevator.exitVel")) {
                        this.targetZ = this.coll.pos.z;
                        this.elevatorVel = elevatorData;
                        var startDelta = this.elevatorData.startDelta || 32;
                        this.setZPos(this.coll.pos.z + (elevatorData > 0 ? -startDelta : startDelta));
                        this.stopDelay = 3
                    } if (extraSettings.blockEvent) {
                    this.blockEvent = new ig.Event({
                        name: "DOOR BLOCK EVENT",
                        steps: extraSettings.blockEvent
                    });
                    this.blockEventCondition = new ig.VarCondition(extraSettings.blockEventCondition || "true")
                }
            },
            initDestinatins: function(destinations) {
                if (destinations)
                    for (var i = 0; i < destinations.length; ++i) {
                        var dest = destinations[i];
                        this.destinations.push({
                            label: dest.label,
                            height: this.coll.pos.z + dest.zMoveOffset,
                            teleportMap: dest.teleportMap,
                            teleportMarker: dest.teleportMarker,
                            activeCondition: dest.activeCondition,
                            showCondition: dest.showCondition,
                            addedSteps: dest.addedSteps
                        });
                        ig.langEdit && ig.langEdit.submitMap("Elevator " + i, new ig.LangLabel(dest.label))
                    }
            },
            initSprites: function() {
                this.setSpriteCount(1)
            },
            onKill: function(silent) {
                this.parent(silent);
                this.sounds.start.clearCached();
                this.sounds.end.clearCached();
                this.groundGfx && this.groundGfx.decreaseRef()
            },
            getCurrentDest: function() {
                if (this.targetZ !== null) return -1;
                for (var i = this.destinations.length; i--;)
                    if (this.destinations[i].height === this.coll.pos.z) return i;
                return -1
            },
            show: function(silent) {
                this.parent(silent);
                if (this.elevatorData) {
                    var switchData = this.elevatorData.switchEntry;
                    this.switchEntity = ig.game.spawnEntity(sc.ElevatorSwitchEntity, this.coll.pos.x + switchData.pos.x, this.coll.pos.y + switchData.pos.y, this.coll.pos.z + switchData.pos.z, {
                        data: switchData,
                        ground: this
                    });
                    this.switchEntity.setActive(this.condition.evaluate(), true)
                }
                if (!silent) {
                    ig.game.effects.npc.spawnOnTarget("appear", this);
                    for (var i = this.destinations.length, currentDest = -1, otherDest = -1; i--;) this.destinations[i].height === this.coll.pos.z ? currentDest = i : otherDest = i;
                    if (otherDest != -1 && currentDest != -1) {
                        this.setZPos(this.destinations[otherDest].height);
                        this.moveToDestination(currentDest)
                    }
                }
            },
            pressSwitch: function() {
                this.blockEvent && this.blockEventCondition.evaluate() ? sc.Cutscene.startCutscene(this.blockEvent) : this.showElevatorOptions()
            },
            moveToDestination: function(destIndex) {
                sc.model.message.clearSide(sc.MESSAGE_SIDES_OR_ALL.ALL);
                if (dest = this.destinations[destIndex]) {
                    if (Math.abs(dest.height - this.coll.pos.z) < ig.COLLISION.EPS) return;
                    sc.elevatorModel.startMoveSound(this.sounds.start);
                    this.targetZ = dest.height;
                    var speed = this.elevatorData.speed || 80;
                    this.elevatorVel = this.targetZ < this.coll.pos.z ? -speed : speed;
                    if (Math.random() <= this.elevatorData.stuckProbility) {
                        this.stuckTimer =
                            0.1 + 0.2;
                        this.coll.vel.z = this.elevatorVel / 4
                    }
                    this.switchEntity.setMoving(true);
                    dest.teleportMap && this.performTeleport(dest);
                    if (this.elevatorData.closeFrontDoor) {
                        dest = ig.game.getEntitiesInRectangle(this.coll.pos.x, this.coll.pos.y + this.coll.size.y, this.coll.pos.z, this.coll.size.x, 16, 4, this);
                        for (speed = dest.length; speed--;) dest[speed] instanceof ig.ENTITY.Door && dest[speed].close()
                    }
                }
                ig.game.varsChangedDeferred()
            },
            performTeleport: function(dest) {
                var entities = [ig.game.playerEntity];
                if (!this.elevatorData.singlePerson) {
                    sc.party.getPartyMemberEntityByIndex(0) &&
                        entities.push(sc.party.getPartyMemberEntityByIndex(0));
                    sc.party.getPartyMemberEntityByIndex(1) && entities.push(sc.party.getPartyMemberEntityByIndex(1))
                }
                for (var steps = [], i = entities.length; i--;) steps.push({
                    type: "DO_ACTION",
                    entity: entities[i],
                    action: [{
                        type: "WAIT_RANDOM",
                        minTime: 0.15,
                        maxTime: 0.25
                    }, {
                        type: "SET_FACE",
                        face: this.markerDir,
                        rotate: true
                    }, {
                        type: "WAIT",
                        time: 2
                    }]
                });
                dest.addedSteps && steps.push.apply(steps, dest.addedSteps);
                var cameraPos = this.getCenter();
                cameraPos.y = cameraPos.y - (this.coll.pos.z + this.coll.size.z);
                cameraPos.y = cameraPos.y - 1.25 * this.elevatorVel;
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: cameraPos,
                    speed: 1,
                    transition: "EASE_IN"
                });
                steps.push({
                    type: "WAIT",
                    time: 0.5
                });
                if (dest.teleportMap) {
                    steps.push({
                        type: "TELEPORT",
                        map: dest.teleportMap,
                        marker: dest.teleportMarker
                    });
                    steps.push({
                        type: "WAIT",
                        time: 10
                    });
                    this.doTeleport = true
                }
                dest = new ig.Event({
                    steps: steps
                });
                ig.game.events.callEvent(dest, ig.EventRunType.PARALLEL);
                ig.vars.set("_system.elevator.exitVel", this.elevatorVel)
            },
            _addMoveEvent: function(steps, entity, xOffset, yOffset, wait) {
                if (entity) {
                    var targetPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
                    targetPos.x = targetPos.x + xOffset;
                    targetPos.y = targetPos.y + yOffset;
                    this.elevatorData.posOffset && Vec2.add(targetPos, this.elevatorData.posOffset);
                    var actionSteps = [{
                        type: "SET_WALK_ANIMS",
                        config: "normal"
                    }, {
                        type: "SET_COLL_TYPE",
                        value: "IGNORE"
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 1
                    }, {
                        type: "NAVIGATE_TO_POINT",
                        target: targetPos,
                        precise: false,
                        distance: 32,
                        teleportOnFail: true,
                        maxTime: 1
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 0.5
                    }, {
                        type: "NAVIGATE_TO_POINT",
                        target: targetPos,
                        precise: true,
                        teleportOnFail: true,
                        maxTime: 0.5
                    }, {
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    }];
                    !entity.isPlayer && this.elevatorData.singlePerson ? actionSteps.push({
                        type: "SET_FACE_TO_ENTITY",
                        entity: ig.game.playerEntity,
                        rotate: true
                    }) : actionSteps.push({
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    });
                    steps.push({
                        type: "DO_ACTION",
                        entity: entity,
                        wait: wait,
                        action: actionSteps
                    })
                }
            },
            showElevatorOptions: function() {
                for (var destCount = 0, singleDest = 0, hasTeleport = false, i = this.destinations.length; i--;) {
                    var dest = this.destinations[i];
                    if (dest.height !== this.coll.pos.z) {
                        singleDest = i;
                        destCount++;
                        hasTeleport = hasTeleport || !!dest.teleportMap
                    }
                }
                if (destCount) {
                    var instantMove = destCount === 1 && !hasTeleport,
                        player = ig.game.playerEntity,
                        steps = [];
                    sc.party.getPartySize() >= 1 && (this.elevatorData.partyOffset ? this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(0), this.elevatorData.partyOffset[0].x, this.elevatorData.partyOffset[0].y, false) :
                        this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(0), 16, 8, false));
                    sc.party.getPartySize() >= 2 && (this.elevatorData.partyOffset ? this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(1), this.elevatorData.partyOffset[1].x, this.elevatorData.partyOffset[1].y, false) : this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(1), -16, 8, false));
                    this._addMoveEvent(steps, player, 0, 0, true);
                    if (destCount > 1) {
                        steps.push({
                            type: "ADD_MSG_PERSON",
                            person: {
                                person: sc.model.player.character.name,
                                expression: sc.model.player.getOptionFace()
                            },
                            side: "RIGHT",
                            order: 0,
                            clearSide: false
                        });
                        var choiceStep = {
                            type: "SHOW_CHOICE",
                            person: {
                                person: sc.model.player.character.name,
                                expression: sc.model.player.getOptionFace()
                            },
                            options: []
                        };
                        for (i = singleDest = 0; i < this.destinations.length; ++i) {
                            dest = this.destinations[i];
                            choiceStep.options.push({
                                label: dest.label,
                                activeCondition: dest.activeCondition,
                                showCondition: dest.showCondition
                            });
                            var destSteps = [];
                            this._addWaitSteps(destSteps);
                            destSteps.push({
                                type: "MOVE_ELEVATOR",
                                entity: this,
                                floorOption: i,
                                wait: !!dest.teleportMap
                            });
                            choiceStep[singleDest] = destSteps;
                            singleDest++
                        }
                        choiceStep.options.push({
                            label: ig.lang.get("sc.map-content.elevator.cancel")
                        });
                        choiceStep[singleDest] = [];
                        steps.push(choiceStep)
                    } else {
                        instantMove || steps.push({
                            type: "WAIT",
                            time: 0.1
                        });
                        this._addWaitSteps(steps);
                        steps.push({
                            type: "MOVE_ELEVATOR",
                            entity: this,
                            floorOption: singleDest,
                            wait: hasTeleport
                        })
                    }
                    steps = new ig.Event({
                        steps: steps
                    });
                    instantMove ? ig.game.events.callEvent(steps, ig.EventRunType.PARALLEL) : sc.Cutscene.startCutscene(steps)
                }
            },
            _addWaitSteps: function(steps) {
                var partyEntity = sc.party.getPartyMemberEntityByIndex(0);
                partyEntity && steps.push({
                    type: "WAIT_UNTIL_ACTION_DONE",
                    entity: partyEntity
                });
                (partyEntity = sc.party.getPartyMemberEntityByIndex(1)) && steps.push({
                    type: "WAIT_UNTIL_ACTION_DONE",
                    entity: partyEntity
                })
            },
            update: function() {
                if (this.stopDelay >
                    0) {
                    this.stopDelay = this.stopDelay - 1;
                    if (this.stopDelay <= 0) {
                        this.stopDelay = 0;
                        this.coll.vel.z = this.elevatorVel
                    }
                } else if (this.targetZ !== null) {
                    this.coll.vel.z = this.coll.vel.z + this.elevatorVel * 2 * ig.system.tick;
                    var speedLimit = (this.targetZ - this.coll.pos.z) * 10;
                    this.coll.vel.z = this.elevatorVel > 0 ? this.coll.vel.z.limit(10, Math.min(speedLimit, this.elevatorVel)) : this.coll.vel.z.limit(Math.max(speedLimit, this.elevatorVel), -10)
                }
                if (this.stuckTimer > 0) {
                    speedLimit = this.stuckTimer;
                    this.stuckTimer = this.stuckTimer - ig.system.tick;
                    if (speedLimit > 0.2 && this.stuckTimer <=
                        0.2) {
                        speedLimit = new ig.Rumble.RumbleHandle("RANDOM", "WEAK", "FAST", 0.2, false, true);
                        ig.rumble.addRumble(speedLimit)
                    }
                    if (this.stuckTimer <= 0.2) this.coll.vel.z = 0;
                    if (this.stuckTimer <= 0) this.stuckTimer = 0
                }
                this.doTeleport || (this.targetZ !== null && Math.abs(this.targetZ - this.coll.pos.z) < 1 ? this.setArrived() : this.targetZ !== null && Math.abs(this.targetZ - this.coll.pos.z) < 4 && sc.elevatorModel.endMoveSound(this.sounds.end));
                this.setPos(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z + this.coll.vel.z * ig.system.tick, true);
                this.parent()
            },
            setArrived: function() {
                sc.elevatorModel.endMoveSound(this.sounds.end);
                if (!this.elevatorData.noEndRunble) {
                    var rumble = new ig.Rumble.RumbleHandle("HORIZONTAL", "WEAKEST", "FAST", 0.3, true);
                    ig.rumble.addRumble(rumble)
                }
                this.setZPos(this.targetZ);
                ig.game.playerEntity.mapStartPos.z = this.coll.pos.z + this.coll.size.z;
                this.coll.vel.z = 0;
                this.targetZ = null;
                this.switchEntity.setMoving(false);
                ig.game.varsChangedDeferred()
            },
            deferredUpdate: function() {
                this.switchEntity.setZPos(this.coll.pos.z + this.coll.size.z)
            },
            varsChanged: function() {
                this.switchEntity && this.switchEntity.setActive(this.condition.evaluate())
            },
            updateSprites: function() {
                var sprite = this.sprites[0];
                sprite.setEntityDefault(this, this.ground.w, this.ground.h, ig.ANIM_SHAPE_TYPE.Z_EXPAND, 1, this.ground.offset, this.groundGfx, this.ground.x, this.ground.y);
                sprite.setFlip(this.ground.flipX, false)
            },
            applyMarkerPosition: function(entity) {
                this.placeEntity(entity);
                if (entity.isPlayer && this.elevatorData.partyOffset) ig.game.postPlacementAction = this
            },
            onPostPlacementAction: function() {
                sc.party.getPartySize() >= 1 && this.placeEntity(sc.party.getPartyMemberEntityByIndex(0), this.elevatorData.partyOffset[0],
                    this.elevatorData.singlePerson);
                sc.party.getPartySize() >= 2 && this.placeEntity(sc.party.getPartyMemberEntityByIndex(1), this.elevatorData.partyOffset[1], this.elevatorData.singlePerson);
                ig.game.playerEntity.skin.pet && this.placeEntity(ig.game.playerEntity.skin.pet, this.elevatorData.partyOffset[2])
            },
            placeEntity: function(entity, offset, useStartZ) {
                if (entity) {
                    var zPos = this.coll.pos.z + this.coll.size.z,
                        level = this.coll.level;
                    if (useStartZ) {
                        zPos = this.startZ;
                        level = ig.game.getLevelIdx(zPos)
                    }
                    entity.coll.level = level;
                    entity.coll.baseZPos = zPos;
                    entity.coll.pos.z = zPos;
                    entity.face.x = this.markerFaceDir.x;
                    entity.face.y = this.markerFaceDir.y;
                    var centerPos = this.getCenter(CENTER_POS);
                    offset && Vec2.add(centerPos, offset);
                    this.elevatorData.posOffset && Vec2.add(centerPos, this.elevatorData.posOffset);
                    Vec2.addMulF(centerPos, entity.coll.size, -0.5);
                    entity.setPos(centerPos.x, centerPos.y)
                }
            }
        });
    sc.ElevatorSwitchEntity = ig.AnimatedEntity.extend({
        groundEntity: null,
        interactEntry: null,
        moving: false,
        active: false,
        interactIcons: {
            up: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [22, 23, 24, 0, 20, 21],
                NEAR: [25]
            }, 0.15),
            down: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png",
                24, 24), {
                FOCUS: [30, 31, 32, 33, 34, 0, 0],
                NEAR: [35]
            }, 0.15)
        },
        showFx: null,
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.groundEntity = extraSettings.ground;
            var icon = this.interactIcons.down;
            var destinations = this.groundEntity.destinations;
            for (var i = destinations.length; i--;)
                if (destinations[i].height > this.coll.pos.z) {
                    icon = this.interactIcons.up;
                    break
                } var switchData = extraSettings.data;
            Vec3.assign(this.coll.size, switchData.size);
            this.initAnimations(switchData.anims);
            this.setCurrentAnim("active");
            switchData.collType && this.coll.setType(switchData.collType);
            if (switchData.showFx) this.showFx = new ig.EffectHandle(switchData.showFx);
            if (switchData.hideFx) this.hideFx = new ig.EffectHandle(switchData.hideFx);
            this.interactEntry = new sc.MapInteractEntry(this, this, icon, sc.INTERACT_Z_CONDITION.SAME_Z, true);
            this._updateState()
        },
        setActive: function(active, force) {
            if (this.active != active && !force) {
                active && this.showFx && this.showFx.spawnOnTarget(this);
                !active && this.hideFx && this.hideFx.spawnOnTarget(this)
            }
            this.active = active;
            this._updateState()
        },
        setMoving: function(moving) {
            this.moving = moving;
            this._updateState()
        },
        _updateState: function() {
            this.setCurrentAnim(this.active ? "active" : "disabled");
            !this.active || this.moving ?
                sc.mapInteract.removeEntry(this.interactEntry) : sc.mapInteract.addEntry(this.interactEntry)
        },
        onInteraction: function() {
            this.groundEntity.pressSwitch()
        },
        onKill: function(silent) {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.showFx && this.showFx.clearCached();
            this.hideFx && this.hideFx.clearCached();
            this.parent(silent)
        }
    })
});
ig.baked = !0;
