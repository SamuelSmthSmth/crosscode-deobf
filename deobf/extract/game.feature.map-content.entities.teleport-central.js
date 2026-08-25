ig.module("game.feature.map-content.entities.teleport-central").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet", "game.feature.interact.map-interact", "game.feature.npc.entities.npc-waypoint").defines(function() {
    function b(a, b, c, d) {
        var e = c.coll.pos.z + 200 * d,
            f = c.getCenter();
        f.y = f.y - (c.coll.pos.z + Constants.BALL_HEIGHT + 8);
        c = Vec2.create(f);
        c.y = c.y - 64 * d;
        a.push({
            type: "SET_CAMERA_POS",
            pos: f,
            speed: "NORMAL",
            transition: "EASE_IN_OUT",
            zoom: 1
        });
        a.push({
            type: "DO_ACTION",
            entity: b,
            action: [{
                type: "SET_FLOAT_HEIGHT",
                value: 8
            }, {
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "puzzle.wave-teleport",
                    name: "panelFloat" + (d > 0 ? "Up" : "Down")
                },
                duration: -1,
                actionDetached: true
            }, {
                type: "WAIT",
                time: 0.25
            }],
            wait: true,
            keepState: true
        });
        a.push({
            time: 0.1,
            ignoreSlowDown: false,
            type: "WAIT"
        });
        a.push({
            color: "white",
            alpha: 1,
            time: 0.6,
            lighter: true,
            type: "SET_OVERLAY"
        });
        a.push({
            type: "DO_ACTION",
            entity: b,
            action: [{
                type: "SET_SLIP_THROUGH",
                value: true
            }, {
                type: "Z_INTERPOLATE",
                newZPos: e,
                duration: 0.6,
                keySpline: "EASE_IN"
            }, {
                type: "SET_Z_GRAVITY_FACTOR",
                value: 0
            }],
            wait: false,
            keepState: true
        });
        a.push({
            type: "SET_SCREEN_BLUR",
            alpha: 0.3
        });
        a.push({
            type: "SET_CAMERA_POS",
            pos: c,
            speed: 0.6,
            transition: "EASE_IN",
            zoom: 1
        });
        a.push({
            time: 0.6,
            ignoreSlowDown: false,
            type: "WAIT"
        });
        a.push({
            type: "CLEAR_SCREEN_BLUR"
        })
    }
    sc.TeleportCentralMap = {
        fields: {},
        registerField: function(a, b) {
            if (a) {
                this.fields[a] || (this.fields[a] = []);
                this.fields[a].push(b)
            }
        },
        unregisterField: function(a, b) {
            if (a) {
                var c = this.fields[a];
                if (c) {
                    c.erase(b);
                    c.length == 0 && delete this.fields[a]
                }
            }
        },
        getField: function(a,
            b) {
            var c = this.fields[a];
            if (!c) return null;
            for (var d = c.length, d = 0; d < c.length; ++d) {
                var e = c[d];
                if (e.isExit == b) return e
            }
            return c[0]
        },
        getFields: function(a) {
            if (a) return this.fields[a]
        }
    };
    var a = {
            CIRCLE: {
                check: function(a) {
                    var b = ig.game.playerEntity.coll,
                        c = b.pos.x + b.size.x - (a.pos.x + a.size.x / 2),
                        a = b.pos.y + b.size.y - (a.pos.y + a.size.y / 2);
                    return c * c + a * a < d * d
                },
                draw: function(a) {
                    ig.debugView.addMapPoint(a.pos.x + a.size.x / 2, a.pos.y + a.size.y / 2, 0, d, d, "green", 86400, true)
                }
            },
            RECT_OVERLAP: {
                check: function(a) {
                    var b = ig.game.playerEntity.coll,
                        d = a.pos.x - c,
                        f = a.pos.y - e,
                        k = a.pos.y + a.size.y + e;
                    return b.pos.x < a.pos.x + a.size.x + c && b.pos.x + b.size.x > d && b.pos.y < k && b.pos.y + b.size.y > f
                },
                draw: function(a) {
                    var b = a.size.x + c * 2,
                        d = a.size.y + e * 2;
                    ig.debugView.addMapPoint(a.pos.x - c + b / 2, a.pos.y - e + d / 2, 0, b, d, "green", 86400)
                }
            }
        },
        d = 112,
        c = 112,
        e = 64;
    ig.ENTITY.TeleportCentral = ig.Entity.extend({
        map: "",
        marker: "",
        effects: new ig.EffectSheet("puzzle"),
        fxHandle: null,
        npcRunnerEnterProb: 0,
        npcRunnerExitProb: 0,
        landmark: null,
        landmarkTarget: null,
        landmarkCondition: null,
        landmarkDetectDelay: 3,
        hasEffects: true,
        detectType: "RECT_OVERLAP",
        wpConnection: null,
        closePlayerState: {
            isHealing: false,
            isTeleport: false,
            fxHandles: []
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                npcRunnerEnterProb: {
                    _type: "Number",
                    _info: "Probability that NPCs will enter through this exit"
                },
                npcRunnerExitProb: {
                    _type: "Number",
                    _info: "Probability that NPCs will exit through this exit"
                },
                effects: {
                    _type: "Boolean",
                    _info: "True if ground effects should be displayed",
                    _default: true
                },
                landmark: {
                    _type: "Landmarks",
                    _info: "landmark to activate",
                    _mapArea: true,
                    _optional: true
                },
                target: {
                    _type: "Entity",
                    _info: "Optional target to focus when landmark is activated",
                    _optional: true
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for the landmark to activate",
                    _popup: true,
                    _optional: true
                },
                detectType: {
                    _type: "String",
                    _info: "Type of detection",
                    _select: a,
                    _default: "RECT_OVERLAP",
                    _optional: true
                }
            },
            scalableX: true,
            scalableY: true,
            label: function() {
                return this.landmark ? this.landmark + " > " + this.detectType : ""
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)"
        }),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.NONE;
            d.size || this.coll.setSize(32, 32, 0);
            this.dir = d.dir || "SOUTH";
            this.npcRunnerEnterProb = d.npcRunnerEnterProb || 0;
            this.npcRunnerExitProb = d.npcRunnerExitProb || 0;
            this.hasEffects = d.effects === void 0 ? true : d.effects;
            if (d.landmark) {
                this.landmark = d.landmark;
                this.landmarkCondition = new ig.VarCondition(d.condition || "");
                this.detectType = d.detectType || "RECT_OVERLAP";
                this.landmarkTarget = d.target || null
            }
            this.wpConnection = new sc.WPConnection(this)
        },
        update: function() {
            this.parent();
            if (this.landmark && !sc.map.isLandmarkActive(this.landmark, null, true))
                if (this.landmarkDetectDelay > 0) this.landmarkDetectDelay--;
                else if (!sc.model.isCutscene() && (this.landmarkCondition.evaluate() && !sc.pvp.isActive()) && a[this.detectType].check(this.coll)) {
                var b = ig.Event.getEntity(this.landmarkTarget);
                sc.map.addLandmark(this.landmark, null, b ? b : this)
            }
            if (this.detectClosePlayer()) {
                b = ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) <= 160 && !sc.model.isCombatMode();
                if (sc.newgame.get("waypoints-heals")) {
                    for (var c = ig.game.playerEntity.params.getHpFactor() < 1, d = sc.party.getPartySize(); d--;) sc.party.getPartyMemberModelByIndex(d).params.getHpFactor() < 1 && (c = true);
                    c = b && c;
                    if (c !== this.closePlayerState.isHealing)
                        if (this.closePlayerState.isHealing = c) {
                            c = {
                                target2: this,
                                duration: -1
                            };
                            this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine", ig.game.playerEntity, c));
                            sc.party.getPartySize() >= 1 && this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine",
                                sc.party.getPartyMemberEntityByIndex(0), c));
                            sc.party.getPartySize() >= 2 && this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine", sc.party.getPartyMemberEntityByIndex(1), c));
                            ig.game.playerEntity.atLandmarkHeal = ig.game.playerEntity.atLandmarkHeal + 1;
                            ig.game.playerEntity.params.hpHealTimer = 1
                        } else {
                            ig.game.playerEntity.atLandmarkHeal = ig.game.playerEntity.atLandmarkHeal - 1;
                            for (c = this.closePlayerState.fxHandles.length; c--;) this.closePlayerState.fxHandles[c].stop();
                            this.closePlayerState.fxHandles.length =
                                0
                        }
                }
                if (sc.newgame.get("waypoints-teleport") && b !== this.closePlayerState.isTeleport)
                    if (this.closePlayerState.isTeleport = b) {
                        b = new ig.GUI.ARBox(ig.game.playerEntity, "Teleport ready!", 0, sc.AR_BOX_MODE.NO_LINE, this.color);
                        ig.gui.addGuiElement(b);
                        this.closePlayerState.arGui = b;
                        ig.game.playerEntity.atLandmarkTeleport = ig.game.playerEntity.atLandmarkTeleport + 1
                    } else {
                        this.closePlayerState.arGui.remove();
                        ig.game.playerEntity.atLandmarkTeleport = ig.game.playerEntity.atLandmarkTeleport - 1
                    }
            }
        },
        detectClosePlayer: function() {
            return sc.newgame.get("waypoints-heals") ||
                sc.newgame.get("waypoints-teleport")
        },
        onKill: function(a) {
            this.parent(a);
            this.fxHandle && this.fxHandle.stop()
        },
        show: function(a) {
            this.parent(a);
            if (!window.wm && this.hasEffects) this.fxHandle = this.effects.spawnOnTarget("teleportEffect", this, {
                duration: -1
            })
        },
        enterEntity: function() {},
        leaveEntity: function() {},
        applyMarkerPosition: function(a) {
            var b = sc.TeleportCentralMap.getField(this.name, false);
            if (b) b.applyMarkerPosition(a);
            else {
                b = this.coll;
                a.coll.level = b.level;
                a.coll.baseZPos = b.baseZPos;
                a.coll.pos.z = b.pos.z;
                ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8.SOUTH || 0, a.face);
                a.setPos(b.pos.x + b.size.x / 2 - a.coll.size.x / 2, b.pos.y + b.size.y / 2 - a.coll.size.y / 2)
            }
        },
        getRunnerDestination: function() {
            if (!this.npcRunnerEnterProb && !this.npcRunnerExitProb) return null;
            for (var a = sc.TeleportCentralMap.getFields(this.name), b = a.length, c = [], d = null; b--;) {
                var e = a[b];
                if (!e._hidden) {
                    c.push({
                        entity: e,
                        dir: e.dir,
                        type: e.isExit ? sc.NPC_RUNNER_DEST_TYPE.EXIT : sc.NPC_RUNNER_DEST_TYPE.ENTER,
                        posType: sc.NPC_RUNNER_DEST_POS_TYPE.CENTER,
                        waiting: true
                    });
                    d = d || e.map
                }
            }
            return {
                entries: c,
                enterProb: this.npcRunnerEnterProb,
                exitProb: this.npcRunnerExitProb,
                map: d
            }
        },
        getWPConnect: function() {
            return this.wpConnection
        }
    });
    var f = {
        SOLID: {
            gfx: function(a, b, c, d) {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: a,
                        width: 32,
                        height: 32,
                        xCount: b,
                        offX: c,
                        offY: d
                    },
                    SUB: [{
                        name: "inactive",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "active",
                        time: 1,
                        frames: [1],
                        repeat: false
                    }, {
                        name: "red",
                        time: 1,
                        frames: [2],
                        repeat: false
                    }]
                }
            }
        },
        AR: {
            gfx: function() {
                return {
                    offset: {
                        x: 0,
                        y: 5,
                        z: 0
                    },
                    SUB: [{
                        shapeType: "Z_FLAT",
                        sheet: {
                            src: "media/entity/objects/upgrade-symbol.png",
                            width: 32,
                            height: 32,
                            xCount: 2,
                            offX: 160,
                            offY: 0
                        },
                        frames: [0, 0, 0, 1, 2, 3, 4, 5],
                        time: 0.07,
                        repeat: true,
                        SUB: [{
                            name: "inactive"
                        }, {
                            name: "active"
                        }, {
                            name: "red"
                        }]
                    }, {
                        renderMode: "lighter",
                        sheet: {
                            src: "media/entity/objects/upgrade-symbol.png",
                            width: 32,
                            height: 40,
                            xCount: 1,
                            offX: 224
                        },
                        wallY: 1,
                        shapeType: "Z_EXPAND",
                        frames: [0, 1, 2],
                        time: 0.1,
                        repeat: true,
                        SUB: [{
                            name: "inactive"
                        }, {
                            name: "active"
                        }, {
                            name: "red"
                        }]
                    }]
                }
            }
        },
        AR_FINAL: {
            gfx: function() {
                return {
                    offset: {
                        x: 0,
                        y: 5,
                        z: 0
                    },
                    SUB: [{
                        shapeType: "Z_FLAT",
                        sheet: {
                            src: "media/entity/objects/upgrade-symbol.png",
                            width: 32,
                            height: 32,
                            xCount: 2,
                            offX: 32,
                            offY: 64
                        },
                        frames: [0],
                        time: 0.07,
                        repeat: true,
                        SUB: [{
                            name: "inactive"
                        }, {
                            name: "active"
                        }, {
                            name: "red"
                        }]
                    }, {
                        renderMode: "lighter",
                        sheet: {
                            src: "media/entity/objects/upgrade-symbol.png",
                            width: 32,
                            height: 40,
                            xCount: 1,
                            offX: 224
                        },
                        wallY: 1,
                        shapeType: "Z_EXPAND",
                        frames: [0, 1, 2],
                        time: 0.1,
                        repeat: true,
                        SUB: [{
                            name: "inactive"
                        }, {
                            name: "active"
                        }, {
                            name: "red"
                        }]
                    }]
                }
            },
            hideFx: {
                sheet: "scene.final-teleport",
                name: "symbolHideFinal"
            },
            glowFx: {
                sheet: "scene.final-teleport",
                name: "symbolFinalGlow"
            }
        },
        RHOMBUS_SQR_LEFT: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/rhombus-outside.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 480,
                        offY: 0
                    },
                    time: 1,
                    frames: [0],
                    repeat: false,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active"
                    }, {
                        name: "red"
                    }]
                }
            }
        },
        RHOMBUS_SQR_RIGHT: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 1,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/rhombus-outside.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 480,
                        offY: 0
                    },
                    time: 1,
                    frames: [0],
                    repeat: false,
                    flipX: true,
                    SUB: [{
                            name: "inactive"
                        },
                        {
                            name: "active"
                        }, {
                            name: "red"
                        }
                    ]
                }
            }
        },
        BERGEN_LEFT: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/bergen-trail.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 256,
                        offY: 576
                    },
                    time: 1,
                    frames: [0],
                    repeat: false,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active"
                    }, {
                        name: "red"
                    }]
                }
            }
        },
        HEAT_RIGHT: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/heat-area.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 64,
                        offY: 688
                    },
                    time: 1,
                    frames: [0],
                    repeat: false,
                    SUB: [{
                            name: "inactive"
                        }, {
                            name: "active"
                        },
                        {
                            name: "red"
                        }
                    ]
                }
            }
        },
        WAVE_UP: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    renderMode: "lighter",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/entity/objects/upgrade-symbol.png",
                        width: 32,
                        height: 32,
                        xCount: 4,
                        offX: 0,
                        offY: 96
                    },
                    time: 0.2,
                    frames: [0, 1, 2, 3],
                    repeat: true,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active"
                    }, {
                        name: "red"
                    }]
                }
            },
            steps: function(a, c, d) {
                b(a, c, d, 1)
            },
            glowFx: {
                sheet: "puzzle.wave-teleport",
                name: "panelGlowUp"
            }
        },
        WAVE_DOWN: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    renderMode: "lighter",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/entity/objects/upgrade-symbol.png",
                        width: 32,
                        height: 32,
                        xCount: 4,
                        offX: 0,
                        offY: 96
                    },
                    time: 0.2,
                    frames: [3, 2, 1, 0],
                    repeat: true,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active"
                    }, {
                        name: "red"
                    }]
                }
            },
            steps: function(a, c, d) {
                b(a, c, d, -1)
            },
            glowFx: {
                sheet: "puzzle.wave-teleport",
                name: "panelGlowDown"
            }
        },
        RHOMBUS_SQR_STATION: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/rhombus-outside.png",
                        width: 32,
                        height: 32,
                        xCount: 2,
                        offX: 416,
                        offY: 0
                    },
                    time: 1,
                    repeat: false,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active",
                        frames: [1]
                    }, {
                        name: "red",
                        frames: [0]
                    }]
                }
            },
            enterSteps: function(a,
                b) {
                var c = a instanceof sc.PlayerBaseEntity ? 160 : 480;
                a instanceof sc.PartyMemberEntity && (c = c + (sc.party.getCurrentPartyIndex(a.model.name) + 1) * 48);
                var d = a.isPlayer ? "" : "NPC";
                return [{
                    type: "ADD_Z_POS_DELTA",
                    zDelta: c
                }, {
                    type: "SET_Z_VEL",
                    value: -400
                }, {
                    type: "SET_Z_GRAVITY_FACTOR",
                    value: 0
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "idle"
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainTrail" + d
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainCubeNoStart" + d
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "Z_INTERPOLATE",
                    duration: c / 300,
                    newZPos: a.coll.pos.z,
                    keySpline: "EASE_OUT"
                }]
            },
            exitSteps: function(a, b, c) {
                if (!(a instanceof ig.ENTITY.Combatant)) a.target = c;
                a = a.isPlayer ? "" : "NPC";
                return [{
                        type: "SHOW_EFFECT",
                        effect: {
                            sheet: b.cacheFx[0],
                            name: "trainCube" + a
                        },
                        duration: -1,
                        actionDetached: false
                    }, {
                        type: "SHOW_ANIMATION",
                        anim: "idle"
                    }, {
                        type: "WAIT",
                        time: 0.25
                    }, {
                        type: "SHOW_EFFECT",
                        effect: {
                            sheet: b.cacheFx[0],
                            name: "trainTrail" + a
                        },
                        duration: -1,
                        actionDetached: false
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 1
                    },
                    {
                        type: "SET_TEMP_TARGET",
                        kind: "NAMED_ENTITY",
                        key: c.name
                    }, {
                        type: "SET_FACE_FIX",
                        value: true
                    }, {
                        type: "SET_SPEED",
                        value: 50
                    }, {
                        type: "STICKY_CIRCLE_AROUND",
                        target: "TARGET",
                        distance: 48,
                        duration: 0.1,
                        ccw: true,
                        distAdjustSpeed: 100,
                        zDistance: 1500
                    }, {
                        type: "SET_SPEED",
                        value: 100
                    }, {
                        type: "STICKY_CIRCLE_AROUND",
                        target: "TARGET",
                        distance: 48,
                        duration: 0.1,
                        ccw: true,
                        distAdjustSpeed: 200,
                        zDistance: 1500
                    }, {
                        type: "SET_SPEED",
                        value: 200
                    }, {
                        type: "STICKY_CIRCLE_AROUND",
                        target: "TARGET",
                        distance: 48,
                        duration: 0.8,
                        ccw: true,
                        distAdjustSpeed: 300,
                        zDistance: 1500
                    }
                ]
            },
            steps: function(a, b, c) {
                b = c.getCenter();
                b.y = b.y - (c.coll.pos.z + Constants.BALL_HEIGHT + 8);
                c = Vec2.create(b);
                c.y = c.y - 160;
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: b,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: c,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "CLEAR_SCREEN_BLUR"
                })
            },
            longSteps: function(a, b, c) {
                ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW");
                b = c.getCenter();
                b.y = b.y - (c.coll.pos.z + Constants.BALL_HEIGHT + 8);
                c = Vec2.create(b);
                c.y = c.y - 160;
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: b,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: c,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "CLEAR_SCREEN_BLUR"
                })
            },
            cacheFx: ["map.rhombus-sqr"]
        },
        RHOMBUS_SQR_STATION_START: {
            gfx: function() {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: "media/map/rhombus-outside.png",
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: 416,
                        offY: 32
                    },
                    time: 1,
                    repeat: false,
                    SUB: [{
                        name: "inactive"
                    }, {
                        name: "active",
                        frames: [0]
                    }, {
                        name: "red",
                        frames: [1]
                    }]
                }
            },
            enterSteps: function(a, b, c) {
                var d = a instanceof sc.PlayerBaseEntity ? 160 : 320;
                a instanceof sc.PartyMemberEntity && (d = d + (sc.party.getCurrentPartyIndex(a.model.name) + 1) * 48);
                var c = "tmp._skyRail." + c.name + ".enter",
                    e = b.getAlignedPos(ig.ENTITY_ALIGN.TOP),
                    f = Vec3.addC(e, 0, d, 0, Vec3.create()),
                    a = a.isPlayer ? "" : "NPC";
                return [{
                    type: "SET_POS",
                    newPos: f
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: c,
                    changeType: "add",
                    value: 1
                }, {
                    type: "SET_Z_GRAVITY_FACTOR",
                    value: 0
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "idle"
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainTrail" + a
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainCubeNoStart" + a
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "INTERPOLATE_POSITION",
                    duration: d / 300,
                    newPos: e,
                    keySpline: "EASE_OUT"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: c,
                    changeType: "sub",
                    value: 1
                }]
            },
            exitSteps: function(a, b, c) {
                if (!(a instanceof ig.ENTITY.Combatant)) a.target = c;
                var a = a.isPlayer ? "" : "NPC",
                    d = b.getAlignedPos(ig.ENTITY_ALIGN.TOP);
                Vec3.addC(d, 0, 320, 0);
                c = "tmp._skyRail." +
                    c.name + ".exit";
                return [{
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainCube" + a
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "idle"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: c,
                    changeType: "add",
                    value: 1
                }, {
                    type: "WAIT",
                    time: 0.25
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: b.cacheFx[0],
                        name: "trainTrail" + a
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SET_RELATIVE_SPEED",
                    value: 1
                }, {
                    type: "SET_Z_GRAVITY_FACTOR",
                    value: 0
                }, {
                    type: "SET_FACE_FIX",
                    value: true
                }, {
                    type: "INTERPOLATE_POSITION",
                    duration: 1,
                    newPos: d,
                    keySpline: "EASE_IN"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: c,
                    changeType: "sub",
                    value: 1
                }, {
                    type: "WAIT",
                    time: 1
                }]
            },
            steps: function(a, b, c) {
                b = c.getCenter();
                b.y = b.y - (c.coll.pos.z + Constants.BALL_HEIGHT + 8);
                c = Vec2.create(b);
                c.y = c.y + 160;
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: b,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                a.push({
                    type: "SET_CAMERA_POS",
                    pos: c,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                a.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                a.push({
                    type: "CLEAR_SCREEN_BLUR"
                })
            },
            cacheFx: ["map.rhombus-sqr"]
        }
    };
    ig.LANG_CONTEXT.TeleportField = function(a) {
        return "TeleportField[" + (a.settings.name || "") + "]"
    };
    ig.ENTITY.TeleportField = ig.AnimatedEntity.extend({
        centralName: null,
        map: null,
        marker: null,
        dir: "SOUTH",
        glowHandle: null,
        glowFxReplace: null,
        hideFxReplace: null,
        initialized: false,
        longTelCond: null,
        teleportIcon: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png",
            40, 48, 160, 168), {
            FOCUS: [1],
            NEAR: [0]
        }, 0.1),
        interactEntry: null,
        effects: {
            upgrade: new ig.EffectSheet("scene.upgrade"),
            puzzle: new ig.EffectSheet("puzzle"),
            teleport: new ig.EffectSheet("teleport"),
            hideHandle: null
        },
        blockEvent: null,
        blockEventCondition: null,
        gfxType: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                central: {
                    _type: "Entity",
                    _info: "Central Entity the field belongs to",
                    _filterClass: "TeleportCentral",
                    _optional: true
                },
                dir: {
                    _type: "String",
                    _info: "View direction of teleport ground.",
                    _select: ig.ActorEntity.FACE4,
                    _default: "SOUTH"
                },
                map: {
                    _type: "Maps",
                    _info: "Map to be loaded",
                    _context: "Map",
                    _optional: true
                },
                marker: {
                    _type: "Marker",
                    _info: "Marker on map to teleport player to"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for teleporter to appear",
                    _popup: true
                },
                teleportLabel: {
                    _type: "LangLabel",
                    _info: "Label displayed for teleporter"
                },
                longTelCond: {
                    _type: "VarCondition",
                    _info: "Condition for a long teleport sequence",
                    _default: "false"
                },
                pseudoExit: {
                    _type: "Boolean",
                    _info: "If true, show exit graphics and behave like exit even without map defined"
                },
                blockEvent: {
                    _type: "Event",
                    _info: "Event to be performed when entering the teleport ground",
                    _popup: true,
                    _optional: true
                },
                blockEventCondition: {
                    _type: "VarCondition",
                    _info: "Condition to show the block event when entering this teleport ground"
                },
                gfxType: {
                    _type: "String",
                    _info: "Graphical appearance of teleporter.",
                    _select: f
                }
            },
            label: function() {
                return !this.map ? "" : this.map + " > " + this.marker
            },
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)"
        }),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type =
                ig.COLLTYPE.BLOCK;
            this.centralName = d.central && d.central.name;
            sc.TeleportCentralMap.registerField(this.centralName, this);
            this.map = d.map;
            this.marker = d.marker;
            this.dir = d.dir;
            this.isExit = d.map || d.pseudoExit;
            this.longTelCond = new ig.VarCondition(d.longTelCond);
            var a = ig.mapStyle.get("map"),
                c = b = 0,
                e = void 0,
                l = 1;
            if (a.teleportField) {
                b = a.teleportField.x;
                c = a.teleportField.y;
                e = a.teleportField.xCount;
                l = a.zHeight || 1
            }
            this.coll.setSize(24, 24, l);
            this.gfxType = f[d.gfxType] || f.SOLID;
            if (this.gfxType.glowFx) this.glowFxReplace =
                new ig.EffectHandle(this.gfxType.glowFx);
            if (this.gfxType.hideFx) this.hideFxReplace = new ig.EffectHandle(this.gfxType.hideFx);
            if (this.gfxType.cacheFx) {
                this.cacheFx = [];
                for (l = 0; l < this.gfxType.cacheFx.length; ++l) this.cacheFx[l] = new ig.EffectSheet(this.gfxType.cacheFx[l])
            }
            this.initAnimations(this.gfxType.gfx(a.sheet, e, b, c));
            if (d.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: d.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(d.blockEventCondition || "true")
            }
            if (this.hasInteract()) {
                this.interactEntry =
                    new sc.MapInteractEntry(this, this, this.teleportIcon, sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, true);
                d = new sc.IconHoverTextGui(new ig.LangLabel(d.teleportLabel), 24, true);
                this.interactEntry.setSubGui(d);
                this.interactEntry.setOffset(1, 0)
            }
            this.setCurrentAnim(this.isExit ? "red" : "active")
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            this.hasInteract() && sc.mapInteract.addEntry(this.interactEntry);
            if (!a) {
                this.animState.alpha = 0;
                this.effects.upgrade.spawnOnTarget("symbolAppear",
                    this, {})
            }
        },
        onHideRequest: function() {
            if (this.glowHandle) {
                this.glowHandle.stop();
                this.glowHandle = null
            }
            this.hasInteract() && sc.mapInteract.removeEntry(this.interactEntry);
            this.effects.hideHandle = this.hideFxReplace ? this.hideFxReplace.spawnOnTarget(this, {
                callback: this
            }) : this.effects.upgrade.spawnOnTarget("symbolHide2", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        onKill: function(a) {
            this.parent(a);
            this.hasInteract() && sc.mapInteract.removeEntry(this.interactEntry);
            this.glowFxReplace && this.glowFxReplace.clearCached();
            this.hideFxReplace && this.hideFxReplace.clearCached();
            if (this.cacheFx)
                for (a = this.cacheFx.length; a--;) this.cacheFx[a].decreaseRef();
            sc.TeleportCentralMap.unregisterField(this.centralName, this)
        },
        hasInteract: function() {
            return this.map || this.blockEvent
        },
        collideWith: function(a) {
            !a instanceof ig.ActorEntity || this.effects.hideHandle || this.glowHandle || this.startGlow()
        },
        update: function() {
            if (this.glowHandle) {
                for (var a = ig.game.getEntitiesOnTop(this), b = false,
                        c = a.length; c--;)
                    if (a[c] instanceof ig.ActorEntity) {
                        b = true;
                        break
                    } if (this.glowHandle && !b) {
                    this.glowHandle.stop();
                    this.glowHandle = null;
                    this.setCurrentAnim(this.isExit ? "red" : "active")
                }
            }
            if (!this.initialized) {
                this.recheckGlowStart();
                this.initialized = true
            }
            this.parent()
        },
        recheckGlowStart: function() {
            if (!this.glowHandle && !this.effects.hideHandle) {
                var a = ig.game.getEntitiesOnTop(this);
                if (a.length > 0) {
                    for (var b = a.length, c = false; b--;) c = c || a[b] instanceof ig.ActorEntity;
                    c && this.startGlow()
                }
            }
        },
        startGlow: function() {
            if (!this.glowHandle) this.glowHandle =
                this.glowFxReplace ? this.glowFxReplace.spawnOnTarget(this, {
                    duration: -1
                }) : this.effects.puzzle.spawnOnTarget("teleportBlock", this, {
                    duration: -1
                })
        },
        enterEntity: function(a) {
            var b = this.getEnterActionData(a, !this.gfxType.exitSteps);
            this.gfxType.exitSteps && b.push.apply(b, this.gfxType.exitSteps(a, this, ig.game.namedEntities[this.centralName]));
            b = new ig.Action("doorAction", b);
            a.setAction(b, true)
        },
        leaveEntity: function(a) {
            ig.EffectTools.clearEffects(a);
            this.effects.teleport.spawnOnTarget(a.soundType == "none" ? "showDefaultSilent" :
                "showDefault", a, {});
            if (this.gfxType.enterSteps) {
                a = this.gfxType.enterSteps(a, this, ig.game.namedEntities[this.centralName]);
                return new ig.Action("doorAction", a)
            }
            return null
        },
        getEnterActionData: function(a, b) {
            var c = a.soundType == "none",
                d = [{
                        type: "SET_WALK_ANIMS",
                        config: "normal"
                    }, {
                        type: "SET_FACE_FIX",
                        value: false
                    }, {
                        type: "SET_COLL_TYPE",
                        value: "IGNORE"
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 1
                    }, {
                        type: "NAVIGATE_TO_POINT",
                        target: this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM),
                        distance: 32
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 0.5
                    },
                    {
                        type: "SET_COLL_TYPE",
                        value: "TRIGGER"
                    }, {
                        type: "NAVIGATE_TO_POINT",
                        target: this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM),
                        precise: true
                    }, {
                        type: "STOP_XY"
                    }, {
                        type: "SET_FACE",
                        face: this.dir,
                        rotate: true
                    }
                ];
            b && d.push({
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "teleport",
                    name: c ? "hideDefaultSilent" : "hideDefault"
                },
                duration: 0,
                wait: true,
                actionDetached: true
            });
            return d
        },
        _addMoveEvent: function(a, b, c, d) {
            if (b)
                if (c) {
                    var e = sc.TeleportCentralMap.getFields(this.centralName);
                    if (e && !(e.length <= c.length))
                        for (var f = e.length; f--;)
                            if (e[f].isExit &&
                                c.indexOf(e[f]) == -1) {
                                e[f]._addMoveEvent(a, b, null, d);
                                c.push(e[f]);
                                break
                            }
                } else {
                    c = this.getEnterActionData(b, false);
                    !d && this.gfxType.exitSteps && c.push.apply(c, this.gfxType.exitSteps(b, this, ig.game.namedEntities[this.centralName]));
                    a.push({
                        type: "DO_ACTION",
                        entity: b,
                        action: c,
                        wait: d
                    });
                    if (d && this.gfxType.exitSteps) {
                        c = this.gfxType.exitSteps(b, this, ig.game.namedEntities[this.centralName]);
                        a.push({
                            type: "DO_ACTION",
                            entity: b,
                            action: c,
                            wait: false
                        })
                    }
                }
        },
        onInteraction: function() {
            if (this.blockEvent && this.blockEventCondition.evaluate()) {
                sc.Cutscene.startCutscene(this.blockEvent);
                return true
            }
            var a = ig.game.playerEntity,
                b = [],
                c = [this];
            sc.party.getPartySize() >= 1 && this._addMoveEvent(b, sc.party.getPartyMemberEntityByIndex(0), c, false);
            sc.party.getPartySize() >= 2 && this._addMoveEvent(b, sc.party.getPartyMemberEntityByIndex(1), c, false);
            this._addMoveEvent(b, a, null, true);
            b.push({
                type: "SET_TELEPORT_COLOR",
                lighter: true,
                color: "white"
            });
            if (c = this.longTelCond.evaluate())
                if (this.gfxType.longSteps) this.gfxType.longSteps(b, a, this);
                else {
                    b.push({
                        type: "SET_CAMERA_TARGET",
                        entity: a,
                        speed: "NORMAL",
                        transition: "EASE_IN_OUT",
                        zoom: 1
                    });
                    b.push({
                        type: "SHOW_EFFECT",
                        entity: a,
                        effect: {
                            sheet: "teleport",
                            name: "hideSlow"
                        }
                    });
                    b.push({
                        time: 0.2,
                        ignoreSlowDown: false,
                        type: "WAIT"
                    });
                    b.push({
                        type: "SET_CAMERA_ZOOM",
                        zoom: 3,
                        duration: 4,
                        transition: "EASE_IN"
                    });
                    b.push({
                        color: "white",
                        alpha: 1,
                        time: 3,
                        lighter: true,
                        type: "SET_OVERLAY"
                    });
                    b.push({
                        zoomType: "LIGHT",
                        fadeIn: 0.5,
                        duration: 4,
                        fadeOut: 1,
                        type: "SET_ZOOM_BLUR",
                        name: null
                    });
                    b.push({
                        time: 4,
                        ignoreSlowDown: false,
                        type: "WAIT"
                    })
                }
            else if (this.gfxType.steps) this.gfxType.steps(b, a, this);
            else {
                b.push({
                    type: "SET_CAMERA_TARGET",
                    entity: a,
                    speed: "FAST",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                b.push({
                    time: 0.1,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                b.push({
                    color: "white",
                    alpha: 1,
                    time: 1,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                b.push({
                    type: "SET_CAMERA_ZOOM",
                    zoom: 1.5,
                    duration: 1,
                    transition: "EASE_IN"
                });
                b.push({
                    type: "SHOW_EFFECT",
                    entity: a,
                    effect: {
                        sheet: "teleport",
                        name: "hideDefault"
                    }
                });
                b.push({
                    time: 1.2,
                    ignoreSlowDown: false,
                    type: "WAIT"
                })
            }
            b.push({
                type: "TELEPORT",
                map: this.map,
                marker: this.marker
            });
            b.push({
                time: 3,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            a = new ig.Event({
                steps: b
            });
            c ? sc.Cutscene.startCutscene(a) : ig.game.events.callEvent(a, ig.EventRunType.BLOCKING);
            return true
        },
        varsChanged: function() {
            this.initialized = false
        },
        applyMarkerPosition: function(a) {
            var b = this.coll;
            a.coll.level = b.level;
            a.coll.baseZPos = b.baseZPos;
            a.coll.pos.z = b.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, a.face);
            a.setPos(b.pos.x + b.size.x / 2 - a.coll.size.x / 2, b.pos.y + b.size.y / 2 - a.coll.size.y / 2);
            if (a.isPlayer && this.gfxType.enterSteps) ig.game.postPlacementAction = this
        },
        onPostPlacementAction: function(a) {
            if (this.gfxType.enterSteps) {
                var b =
                    this.gfxType.enterSteps(a, this, ig.game.namedEntities[this.centralName]),
                    b = new ig.Action("doorAction", b);
                b.eventAction = true;
                a.setAction(b)
            }
            a = [this];
            sc.party.getPartySize() >= 1 && this._addPartyEnterSteps(sc.party.getPartyMemberEntityByIndex(0), a);
            sc.party.getPartySize() >= 2 && this._addPartyEnterSteps(sc.party.getPartyMemberEntityByIndex(1), a)
        },
        _addPartyEnterSteps: function(a, b) {
            if (a) {
                var c = sc.TeleportCentralMap.getFields(this.centralName);
                if (c && !(c.length <= b.length))
                    for (var d = c.length; d--;)
                        if (!c[d].isExit &&
                            b.indexOf(c[d]) == -1) {
                            c[d].applyMarkerPosition(a);
                            c[d]._addEnterSteps(a);
                            b.push(c[d]);
                            break
                        }
            }
        },
        _addEnterSteps: function(a) {
            if (this.gfxType.enterSteps) {
                var b = this.gfxType.enterSteps(a, this, ig.game.namedEntities[this.centralName]),
                    b = new ig.Action("doorAction", b);
                b.eventAction = true;
                a.setAction(b)
            }
        },
        isRunnerDestBlocked: function() {
            return !!this.glowHandle
        }
    })
});
ig.baked = !0;
