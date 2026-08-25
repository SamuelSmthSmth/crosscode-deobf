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
        startMoveSound: function(a) {
            this.sound && this.endMoveSound();
            this.sound = a.clone();
            a = this.sound.play(true);
            ig.soundManager.addNamedSound("_elevatorMoving", a)
        },
        endMoveSound: function(a) {
            if (this.sound) {
                this.sound.clearCached();
                this.sound = null;
                ig.soundManager.stopNamedSounds("_elevatorMoving");
                a && a.play()
            }
        },
        onStoragePreLoad: function() {
            this.endMoveSound()
        },
        onVarAccess: function(a, b) {
            var c = b[1],
                e = ig.game.namedEntities[c];
            e || console.warn("Non-Existant Elevator: " + c);
            e instanceof ig.ENTITY.Elevator || console.warn("Entity of this name is not an elevator: " + c);
            if (b[2] === "dest") return e.getCurrentDest();
            console.warn("Unknown Elevator option:" + b[2])
        }
    });
    ig.addGameAddon(function() {
        return sc.elevatorModel = new sc.ElevatorModel
    });
    ig.LANG_CONTEXT.Elevator = function() {
        return "ELEVATOR"
    };
    var b = Vec2.create();
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
            init: function(a, b, c, e) {
                this.parent(a, b, c, e);
                this.coll.type = ig.COLLTYPE.BLOCK;
                this.coll.zGravityFactor = 0;
                this.map = e.map || null;
                this.marker = e.marker;
                this.startZ = this.coll.pos.z;
                this.moveHeight = e.moveHeight;
                this.sounds.start = new ig.Sound("media/sound/misc/elevator-loop.ogg", 0.7);
                this.sounds.end = new ig.Sound("media/sound/misc/elevator-end.ogg",
                    0.7);
                this.faceDir = e.faceDir || null;
                if (a = sc.ELEVATOR_TYPE[e.elevatorType]) {
                    this.elevatorData = a;
                    this.markerDir = this.faceDir || a.markerDir;
                    ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.markerDir] || 0, this.markerFaceDir);
                    this.ground = a.ground;
                    this.groundGfx = new ig.Image(a.ground.gfx);
                    Vec3.assign(this.coll.size, a.size)
                }
                this.initDestinatins(e.destinations);
                this.condition = new ig.VarCondition(e.condition);
                if (ig.game.marker === this.name)
                    if (a = ig.vars.get("_system.elevator.exitVel")) {
                        this.targetZ = this.coll.pos.z;
                        this.elevatorVel = a;
                        b = this.elevatorData.startDelta || 32;
                        this.setZPos(this.coll.pos.z + (a > 0 ? -b : b));
                        this.stopDelay = 3
                    } if (e.blockEvent) {
                    this.blockEvent = new ig.Event({
                        name: "DOOR BLOCK EVENT",
                        steps: e.blockEvent
                    });
                    this.blockEventCondition = new ig.VarCondition(e.blockEventCondition || "true")
                }
            },
            initDestinatins: function(a) {
                if (a)
                    for (var b = 0; b < a.length; ++b) {
                        var c = a[b];
                        this.destinations.push({
                            label: c.label,
                            height: this.coll.pos.z + c.zMoveOffset,
                            teleportMap: c.teleportMap,
                            teleportMarker: c.teleportMarker,
                            activeCondition: c.activeCondition,
                            showCondition: c.showCondition,
                            addedSteps: c.addedSteps
                        });
                        ig.langEdit && ig.langEdit.submitMap("Elevator " + b, new ig.LangLabel(c.label))
                    }
            },
            initSprites: function() {
                this.setSpriteCount(1)
            },
            onKill: function(a) {
                this.parent(a);
                this.sounds.start.clearCached();
                this.sounds.end.clearCached();
                this.groundGfx && this.groundGfx.decreaseRef()
            },
            getCurrentDest: function() {
                if (this.targetZ !== null) return -1;
                for (var a = this.destinations.length; a--;)
                    if (this.destinations[a].height === this.coll.pos.z) return a;
                return -1
            },
            show: function(a) {
                this.parent(a);
                if (this.elevatorData) {
                    var b = this.elevatorData.switchEntry;
                    this.switchEntity = ig.game.spawnEntity(sc.ElevatorSwitchEntity, this.coll.pos.x + b.pos.x, this.coll.pos.y + b.pos.y, this.coll.pos.z + b.pos.z, {
                        data: b,
                        ground: this
                    });
                    this.switchEntity.setActive(this.condition.evaluate(), true)
                }
                if (!a) {
                    ig.game.effects.npc.spawnOnTarget("appear", this);
                    for (var a = this.destinations.length, c = b = -1; a--;) this.destinations[a].height === this.coll.pos.z ? c = a : b = a;
                    if (b != -1 && c != -1) {
                        this.setZPos(this.destinations[b].height);
                        this.moveToDestination(c)
                    }
                }
            },
            pressSwitch: function() {
                this.blockEvent && this.blockEventCondition.evaluate() ? sc.Cutscene.startCutscene(this.blockEvent) : this.showElevatorOptions()
            },
            moveToDestination: function(a) {
                sc.model.message.clearSide(sc.MESSAGE_SIDES_OR_ALL.ALL);
                if (a = this.destinations[a]) {
                    if (Math.abs(a.height - this.coll.pos.z) < ig.COLLISION.EPS) return;
                    sc.elevatorModel.startMoveSound(this.sounds.start);
                    this.targetZ = a.height;
                    var b = this.elevatorData.speed || 80;
                    this.elevatorVel = this.targetZ < this.coll.pos.z ? -b : b;
                    if (Math.random() <= this.elevatorData.stuckProbility) {
                        this.stuckTimer =
                            0.1 + 0.2;
                        this.coll.vel.z = this.elevatorVel / 4
                    }
                    this.switchEntity.setMoving(true);
                    a.teleportMap && this.performTeleport(a);
                    if (this.elevatorData.closeFrontDoor) {
                        a = ig.game.getEntitiesInRectangle(this.coll.pos.x, this.coll.pos.y + this.coll.size.y, this.coll.pos.z, this.coll.size.x, 16, 4, this);
                        for (b = a.length; b--;) a[b] instanceof ig.ENTITY.Door && a[b].close()
                    }
                }
                ig.game.varsChangedDeferred()
            },
            performTeleport: function(a) {
                var b = [ig.game.playerEntity];
                if (!this.elevatorData.singlePerson) {
                    sc.party.getPartyMemberEntityByIndex(0) &&
                        b.push(sc.party.getPartyMemberEntityByIndex(0));
                    sc.party.getPartyMemberEntityByIndex(1) && b.push(sc.party.getPartyMemberEntityByIndex(1))
                }
                for (var c = [], e = b.length; e--;) c.push({
                    type: "DO_ACTION",
                    entity: b[e],
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
                a.addedSteps && c.push.apply(c, a.addedSteps);
                b = this.getCenter();
                b.y = b.y - (this.coll.pos.z + this.coll.size.z);
                b.y = b.y - 1.25 * this.elevatorVel;
                c.push({
                    type: "SET_CAMERA_POS",
                    pos: b,
                    speed: 1,
                    transition: "EASE_IN"
                });
                c.push({
                    type: "WAIT",
                    time: 0.5
                });
                if (a.teleportMap) {
                    c.push({
                        type: "TELEPORT",
                        map: a.teleportMap,
                        marker: a.teleportMarker
                    });
                    c.push({
                        type: "WAIT",
                        time: 10
                    });
                    this.doTeleport = true
                }
                a = new ig.Event({
                    steps: c
                });
                ig.game.events.callEvent(a, ig.EventRunType.PARALLEL);
                ig.vars.set("_system.elevator.exitVel", this.elevatorVel)
            },
            _addMoveEvent: function(a, b, c, e, f) {
                if (b) {
                    var g = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
                    g.x = g.x + c;
                    g.y = g.y + e;
                    this.elevatorData.posOffset && Vec2.add(g, this.elevatorData.posOffset);
                    c = [{
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
                        target: g,
                        precise: false,
                        distance: 32,
                        teleportOnFail: true,
                        maxTime: 1
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 0.5
                    }, {
                        type: "NAVIGATE_TO_POINT",
                        target: g,
                        precise: true,
                        teleportOnFail: true,
                        maxTime: 0.5
                    }, {
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    }];
                    !b.isPlayer && this.elevatorData.singlePerson ? c.push({
                        type: "SET_FACE_TO_ENTITY",
                        entity: ig.game.playerEntity,
                        rotate: true
                    }) : c.push({
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    });
                    a.push({
                        type: "DO_ACTION",
                        entity: b,
                        wait: f,
                        action: c
                    })
                }
            },
            showElevatorOptions: function() {
                for (var a = 0, b = 0, c = false, e = this.destinations.length; e--;) {
                    var f = this.destinations[e];
                    if (f.height !== this.coll.pos.z) {
                        b = e;
                        a++;
                        c = c || !!f.teleportMap
                    }
                }
                if (a) {
                    var g = a === 1 && !c,
                        e = ig.game.playerEntity,
                        h = [];
                    sc.party.getPartySize() >= 1 && (this.elevatorData.partyOffset ? this._addMoveEvent(h, sc.party.getPartyMemberEntityByIndex(0), this.elevatorData.partyOffset[0].x, this.elevatorData.partyOffset[0].y, false) :
                        this._addMoveEvent(h, sc.party.getPartyMemberEntityByIndex(0), 16, 8, false));
                    sc.party.getPartySize() >= 2 && (this.elevatorData.partyOffset ? this._addMoveEvent(h, sc.party.getPartyMemberEntityByIndex(1), this.elevatorData.partyOffset[1].x, this.elevatorData.partyOffset[1].y, false) : this._addMoveEvent(h, sc.party.getPartyMemberEntityByIndex(1), -16, 8, false));
                    this._addMoveEvent(h, e, 0, 0, true);
                    if (a > 1) {
                        h.push({
                            type: "ADD_MSG_PERSON",
                            person: {
                                person: sc.model.player.character.name,
                                expression: sc.model.player.getOptionFace()
                            },
                            side: "RIGHT",
                            order: 0,
                            clearSide: false
                        });
                        a = {
                            type: "SHOW_CHOICE",
                            person: {
                                person: sc.model.player.character.name,
                                expression: sc.model.player.getOptionFace()
                            },
                            options: []
                        };
                        for (e = b = 0; e < this.destinations.length; ++e) {
                            f = this.destinations[e];
                            a.options.push({
                                label: f.label,
                                activeCondition: f.activeCondition,
                                showCondition: f.showCondition
                            });
                            c = [];
                            this._addWaitSteps(c);
                            c.push({
                                type: "MOVE_ELEVATOR",
                                entity: this,
                                floorOption: e,
                                wait: !!f.teleportMap
                            });
                            a[b] = c;
                            b++
                        }
                        a.options.push({
                            label: ig.lang.get("sc.map-content.elevator.cancel")
                        });
                        a[b] = [];
                        h.push(a)
                    } else {
                        g || h.push({
                            type: "WAIT",
                            time: 0.1
                        });
                        this._addWaitSteps(h);
                        h.push({
                            type: "MOVE_ELEVATOR",
                            entity: this,
                            floorOption: b,
                            wait: c
                        })
                    }
                    h = new ig.Event({
                        steps: h
                    });
                    g ? ig.game.events.callEvent(h, ig.EventRunType.PARALLEL) : sc.Cutscene.startCutscene(h)
                }
            },
            _addWaitSteps: function(a) {
                var b = sc.party.getPartyMemberEntityByIndex(0);
                b && a.push({
                    type: "WAIT_UNTIL_ACTION_DONE",
                    entity: b
                });
                (b = sc.party.getPartyMemberEntityByIndex(1)) && a.push({
                    type: "WAIT_UNTIL_ACTION_DONE",
                    entity: b
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
                    var a = (this.targetZ - this.coll.pos.z) * 10;
                    this.coll.vel.z = this.elevatorVel > 0 ? this.coll.vel.z.limit(10, Math.min(a, this.elevatorVel)) : this.coll.vel.z.limit(Math.max(a, this.elevatorVel), -10)
                }
                if (this.stuckTimer > 0) {
                    a = this.stuckTimer;
                    this.stuckTimer = this.stuckTimer - ig.system.tick;
                    if (a > 0.2 && this.stuckTimer <=
                        0.2) {
                        a = new ig.Rumble.RumbleHandle("RANDOM", "WEAK", "FAST", 0.2, false, true);
                        ig.rumble.addRumble(a)
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
                    var a = new ig.Rumble.RumbleHandle("HORIZONTAL", "WEAKEST", "FAST", 0.3, true);
                    ig.rumble.addRumble(a)
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
                var a = this.sprites[0];
                a.setEntityDefault(this, this.ground.w, this.ground.h, ig.ANIM_SHAPE_TYPE.Z_EXPAND, 1, this.ground.offset, this.groundGfx, this.ground.x, this.ground.y);
                a.setFlip(this.ground.flipX, false)
            },
            applyMarkerPosition: function(a) {
                this.placeEntity(a);
                if (a.isPlayer && this.elevatorData.partyOffset) ig.game.postPlacementAction = this
            },
            onPostPlacementAction: function() {
                sc.party.getPartySize() >= 1 && this.placeEntity(sc.party.getPartyMemberEntityByIndex(0), this.elevatorData.partyOffset[0],
                    this.elevatorData.singlePerson);
                sc.party.getPartySize() >= 2 && this.placeEntity(sc.party.getPartyMemberEntityByIndex(1), this.elevatorData.partyOffset[1], this.elevatorData.singlePerson);
                ig.game.playerEntity.skin.pet && this.placeEntity(ig.game.playerEntity.skin.pet, this.elevatorData.partyOffset[2])
            },
            placeEntity: function(a, d, c) {
                if (a) {
                    var e = this.coll.pos.z + this.coll.size.z,
                        f = this.coll.level;
                    if (c) {
                        e = this.startZ;
                        f = ig.game.getLevelIdx(e)
                    }
                    a.coll.level = f;
                    a.coll.baseZPos = e;
                    a.coll.pos.z = e;
                    a.face.x = this.markerFaceDir.x;
                    a.face.y = this.markerFaceDir.y;
                    c = this.getCenter(b);
                    d && Vec2.add(c, d);
                    this.elevatorData.posOffset && Vec2.add(c, this.elevatorData.posOffset);
                    Vec2.addMulF(c, a.coll.size, -0.5);
                    a.setPos(c.x, c.y)
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.groundEntity = e.ground;
            a = this.interactIcons.down;
            b = this.groundEntity.destinations;
            for (c = b.length; c--;)
                if (b[c].height > this.coll.pos.z) {
                    a = this.interactIcons.up;
                    break
                } e = e.data;
            Vec3.assign(this.coll.size, e.size);
            this.initAnimations(e.anims);
            this.setCurrentAnim("active");
            e.collType && this.coll.setType(e.collType);
            if (e.showFx) this.showFx = new ig.EffectHandle(e.showFx);
            if (e.hideFx) this.hideFx = new ig.EffectHandle(e.hideFx);
            this.interactEntry = new sc.MapInteractEntry(this, this, a, sc.INTERACT_Z_CONDITION.SAME_Z, true);
            this._updateState()
        },
        setActive: function(a, b) {
            if (this.active != a && !b) {
                a && this.showFx && this.showFx.spawnOnTarget(this);
                !a && this.hideFx && this.hideFx.spawnOnTarget(this)
            }
            this.active = a;
            this._updateState()
        },
        setMoving: function(a) {
            this.moving = a;
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
        onKill: function(a) {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.showFx && this.showFx.clearCached();
            this.hideFx && this.hideFx.clearCached();
            this.parent(a)
        }
    })
});
ig.baked = !0;
