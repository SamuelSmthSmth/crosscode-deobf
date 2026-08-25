/**
 * @module game.feature.map-content.entities.teleport-central
 *
 * Fast-travel system: TeleportCentral entities register themselves by name
 * (via `sc.TeleportCentralMap`), act as landmarks (with player-proximity
 * detection and healing/teleport-ready AR boxes near the player), and group
 * the TeleportField entities that visually mark each entry/exit. Teleport
 * fields handle the enter/exit animations, glow feedback, camera sequences,
 * party repositioning, and the final map teleport.
 */
ig.module("game.feature.map-content.entities.teleport-central").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet", "game.feature.interact.map-interact", "game.feature.npc.entities.npc-waypoint").defines(function() {
    function addWaveTeleportSteps(steps, entity, central, direction) {
        var targetZ = central.coll.pos.z + 200 * direction,
            cameraTarget = central.getCenter();
        cameraTarget.y = cameraTarget.y - (central.coll.pos.z + Constants.BALL_HEIGHT + 8);
        central = Vec2.create(cameraTarget);
        central.y = central.y - 64 * direction;
        steps.push({
            type: "SET_CAMERA_POS",
            pos: cameraTarget,
            speed: "NORMAL",
            transition: "EASE_IN_OUT",
            zoom: 1
        });
        steps.push({
            type: "DO_ACTION",
            entity: entity,
            action: [{
                type: "SET_FLOAT_HEIGHT",
                value: 8
            }, {
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "puzzle.wave-teleport",
                    name: "panelFloat" + (direction > 0 ? "Up" : "Down")
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
        steps.push({
            time: 0.1,
            ignoreSlowDown: false,
            type: "WAIT"
        });
        steps.push({
            color: "white",
            alpha: 1,
            time: 0.6,
            lighter: true,
            type: "SET_OVERLAY"
        });
        steps.push({
            type: "DO_ACTION",
            entity: entity,
            action: [{
                type: "SET_SLIP_THROUGH",
                value: true
            }, {
                type: "Z_INTERPOLATE",
                newZPos: targetZ,
                duration: 0.6,
                keySpline: "EASE_IN"
            }, {
                type: "SET_Z_GRAVITY_FACTOR",
                value: 0
            }],
            wait: false,
            keepState: true
        });
        steps.push({
            type: "SET_SCREEN_BLUR",
            alpha: 0.3
        });
        steps.push({
            type: "SET_CAMERA_POS",
            pos: central,
            speed: 0.6,
            transition: "EASE_IN",
            zoom: 1
        });
        steps.push({
            time: 0.6,
            ignoreSlowDown: false,
            type: "WAIT"
        });
        steps.push({
            type: "CLEAR_SCREEN_BLUR"
        })
    }
    sc.TeleportCentralMap = {
        fields: {},
        registerField: function(centralName, field) {
            if (centralName) {
                this.fields[centralName] || (this.fields[centralName] = []);
                this.fields[centralName].push(field)
            }
        },
        unregisterField: function(centralName, field) {
            if (centralName) {
                var fields = this.fields[centralName];
                if (fields) {
                    fields.erase(field);
                    fields.length == 0 && delete this.fields[centralName]
                }
            }
        },
        getField: function(centralName,
            isExit) {
            var fields = this.fields[centralName];
            if (!fields) return null;
            for (var i = fields.length, i = 0; i < fields.length; ++i) {
                var field = fields[i];
                if (field.isExit == isExit) return field
            }
            return fields[0]
        },
        getFields: function(centralName) {
            if (centralName) return this.fields[centralName]
        }
    };
    var DETECT_TYPES = {
            CIRCLE: {
                check: function(entity) {
                    var playerColl = ig.game.playerEntity.coll,
                        dx = playerColl.pos.x + playerColl.size.x - (entity.pos.x + entity.size.x / 2),
                        dy = playerColl.pos.y + playerColl.size.y - (entity.pos.y + entity.size.y / 2);
                    return dx * dx + dy * dy < CIRCLE_RADIUS * CIRCLE_RADIUS
                },
                draw: function(entity) {
                    ig.debugView.addMapPoint(entity.pos.x + entity.size.x / 2, entity.pos.y + entity.size.y / 2, 0, CIRCLE_RADIUS, CIRCLE_RADIUS, "green", 86400, true)
                }
            },
            RECT_OVERLAP: {
                check: function(entity) {
                    var playerColl = ig.game.playerEntity.coll,
                        left = entity.pos.x - RECT_PAD_X,
                        top = entity.pos.y - RECT_PAD_Y,
                        bottom = entity.pos.y + entity.size.y + RECT_PAD_Y;
                    return playerColl.pos.x < entity.pos.x + entity.size.x + RECT_PAD_X && playerColl.pos.x + playerColl.size.x > left && playerColl.pos.y < bottom && playerColl.pos.y + playerColl.size.y > top
                },
                draw: function(entity) {
                    var width = entity.size.x + RECT_PAD_X * 2,
                        height = entity.size.y + RECT_PAD_Y * 2;
                    ig.debugView.addMapPoint(entity.pos.x - RECT_PAD_X + width / 2, entity.pos.y - RECT_PAD_Y + height / 2, 0, width, height, "green", 86400)
                }
            }
        },
        CIRCLE_RADIUS = 112,
        RECT_PAD_X = 112,
        RECT_PAD_Y = 64;
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
                    _select: DETECT_TYPES,
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
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.coll.type = ig.COLLTYPE.NONE;
            extraSettings.size || this.coll.setSize(32, 32, 0);
            this.dir = extraSettings.dir || "SOUTH";
            this.npcRunnerEnterProb = extraSettings.npcRunnerEnterProb || 0;
            this.npcRunnerExitProb = extraSettings.npcRunnerExitProb || 0;
            this.hasEffects = extraSettings.effects === void 0 ? true : extraSettings.effects;
            if (extraSettings.landmark) {
                this.landmark = extraSettings.landmark;
                this.landmarkCondition = new ig.VarCondition(extraSettings.condition || "");
                this.detectType = extraSettings.detectType || "RECT_OVERLAP";
                this.landmarkTarget = extraSettings.target || null
            }
            this.wpConnection = new sc.WPConnection(this)
        },
        update: function() {
            this.parent();
            if (this.landmark && !sc.map.isLandmarkActive(this.landmark, null, true))
                if (this.landmarkDetectDelay > 0) this.landmarkDetectDelay--;
                else if (!sc.model.isCutscene() && (this.landmarkCondition.evaluate() && !sc.pvp.isActive()) && DETECT_TYPES[this.detectType].check(this.coll)) {
                var targetEntity = ig.Event.getEntity(this.landmarkTarget);
                sc.map.addLandmark(this.landmark, null, targetEntity ? targetEntity : this)
            }
            if (this.detectClosePlayer()) {
                var nearPlayer = ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) <= 160 && !sc.model.isCombatMode();
                if (sc.newgame.get("waypoints-heals")) {
                    for (var needsHeal = ig.game.playerEntity.params.getHpFactor() < 1, i = sc.party.getPartySize(); i--;) sc.party.getPartyMemberModelByIndex(i).params.getHpFactor() < 1 && (needsHeal = true);
                    needsHeal = nearPlayer && needsHeal;
                    if (needsHeal !== this.closePlayerState.isHealing)
                        if (this.closePlayerState.isHealing = needsHeal) {
                            var fxOptions = {
                                target2: this,
                                duration: -1
                            };
                            this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine", ig.game.playerEntity, fxOptions));
                            sc.party.getPartySize() >= 1 && this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine",
                                sc.party.getPartyMemberEntityByIndex(0), fxOptions));
                            sc.party.getPartySize() >= 2 && this.closePlayerState.fxHandles.push(ig.game.effects.drops.spawnOnTarget("healingLine", sc.party.getPartyMemberEntityByIndex(1), fxOptions));
                            ig.game.playerEntity.atLandmarkHeal = ig.game.playerEntity.atLandmarkHeal + 1;
                            ig.game.playerEntity.params.hpHealTimer = 1
                        } else {
                            ig.game.playerEntity.atLandmarkHeal = ig.game.playerEntity.atLandmarkHeal - 1;
                            for (i = this.closePlayerState.fxHandles.length; i--;) this.closePlayerState.fxHandles[i].stop();
                            this.closePlayerState.fxHandles.length =
                                0
                        }
                }
                if (sc.newgame.get("waypoints-teleport") && nearPlayer !== this.closePlayerState.isTeleport)
                    if (this.closePlayerState.isTeleport = nearPlayer) {
                        nearPlayer = new ig.GUI.ARBox(ig.game.playerEntity, "Teleport ready!", 0, sc.AR_BOX_MODE.NO_LINE, this.color);
                        ig.gui.addGuiElement(nearPlayer);
                        this.closePlayerState.arGui = nearPlayer;
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
        onKill: function(silent) {
            this.parent(silent);
            this.fxHandle && this.fxHandle.stop()
        },
        show: function(silent) {
            this.parent(silent);
            if (!window.wm && this.hasEffects) this.fxHandle = this.effects.spawnOnTarget("teleportEffect", this, {
                duration: -1
            })
        },
        enterEntity: function() {},
        leaveEntity: function() {},
        applyMarkerPosition: function(entity) {
            var field = sc.TeleportCentralMap.getField(this.name, false);
            if (field) field.applyMarkerPosition(entity);
            else {
                field = this.coll;
                entity.coll.level = field.level;
                entity.coll.baseZPos = field.baseZPos;
                entity.coll.pos.z = field.pos.z;
                ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8.SOUTH || 0, entity.face);
                entity.setPos(field.pos.x + field.size.x / 2 - entity.coll.size.x / 2, field.pos.y + field.size.y / 2 - entity.coll.size.y / 2)
            }
        },
        getRunnerDestination: function() {
            if (!this.npcRunnerEnterProb && !this.npcRunnerExitProb) return null;
            for (var fields = sc.TeleportCentralMap.getFields(this.name), i = fields.length, entries = [], mapName = null; i--;) {
                var field = fields[i];
                if (!field._hidden) {
                    entries.push({
                        entity: field,
                        dir: field.dir,
                        type: field.isExit ? sc.NPC_RUNNER_DEST_TYPE.EXIT : sc.NPC_RUNNER_DEST_TYPE.ENTER,
                        posType: sc.NPC_RUNNER_DEST_POS_TYPE.CENTER,
                        waiting: true
                    });
                    mapName = mapName || field.map
                }
            }
            return {
                entries: entries,
                enterProb: this.npcRunnerEnterProb,
                exitProb: this.npcRunnerExitProb,
                map: mapName
            }
        },
        getWPConnect: function() {
            return this.wpConnection
        }
    });
    var FIELD_GFX = {
        SOLID: {
            gfx: function(sheetSrc, xCount, offX, offY) {
                return {
                    shapeType: "Z_FLAT",
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    },
                    sheet: {
                        src: sheetSrc,
                        width: 32,
                        height: 32,
                        xCount: xCount,
                        offX: offX,
                        offY: offY
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
            steps: function(steps, entity, central) {
                addWaveTeleportSteps(steps, entity, central, 1)
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
            steps: function(steps, entity, central) {
                addWaveTeleportSteps(steps, entity, central, -1)
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
            enterSteps: function(entity,
                field) {
                var offset = entity instanceof sc.PlayerBaseEntity ? 160 : 480;
                entity instanceof sc.PartyMemberEntity && (offset = offset + (sc.party.getCurrentPartyIndex(entity.model.name) + 1) * 48);
                var suffix = entity.isPlayer ? "" : "NPC";
                return [{
                    type: "ADD_Z_POS_DELTA",
                    zDelta: offset
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
                        sheet: field.cacheFx[0],
                        name: "trainTrail" + suffix
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: field.cacheFx[0],
                        name: "trainCubeNoStart" + suffix
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "Z_INTERPOLATE",
                    duration: offset / 300,
                    newZPos: entity.coll.pos.z,
                    keySpline: "EASE_OUT"
                }]
            },
            exitSteps: function(entity, field, central) {
                if (!(entity instanceof ig.ENTITY.Combatant)) entity.target = central;
                entity = entity.isPlayer ? "" : "NPC";
                return [{
                        type: "SHOW_EFFECT",
                        effect: {
                            sheet: field.cacheFx[0],
                            name: "trainCube" + entity
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
                            sheet: field.cacheFx[0],
                            name: "trainTrail" + entity
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
                        key: central.name
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
            steps: function(steps, entity, central) {
                central = central.getCenter();
                central.y = central.y - (central.coll.pos.z + Constants.BALL_HEIGHT + 8);
                central = Vec2.create(central);
                central.y = central.y - 160;
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    type: "CLEAR_SCREEN_BLUR"
                })
            },
            longSteps: function(steps, entity, central) {
                ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW");
                central = central.getCenter();
                central.y = central.y - (central.coll.pos.z + Constants.BALL_HEIGHT + 8);
                central = Vec2.create(central);
                central.y = central.y - 160;
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
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
            enterSteps: function(entity, field, central) {
                var offset = entity instanceof sc.PlayerBaseEntity ? 160 : 320;
                entity instanceof sc.PartyMemberEntity && (offset = offset + (sc.party.getCurrentPartyIndex(entity.model.name) + 1) * 48);
                var varName = "tmp._skyRail." + central.name + ".enter",
                    topPos = field.getAlignedPos(ig.ENTITY_ALIGN.TOP),
                    startPos = Vec3.addC(topPos, 0, offset, 0, Vec3.create()),
                    entity = entity.isPlayer ? "" : "NPC";
                return [{
                    type: "SET_POS",
                    newPos: startPos
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: varName,
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
                        sheet: field.cacheFx[0],
                        name: "trainTrail" + entity
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: field.cacheFx[0],
                        name: "trainCubeNoStart" + entity
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "INTERPOLATE_POSITION",
                    duration: offset / 300,
                    newPos: topPos,
                    keySpline: "EASE_OUT"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: varName,
                    changeType: "sub",
                    value: 1
                }]
            },
            exitSteps: function(entity, field, central) {
                if (!(entity instanceof ig.ENTITY.Combatant)) entity.target = central;
                var entity = entity.isPlayer ? "" : "NPC",
                    topPos = field.getAlignedPos(ig.ENTITY_ALIGN.TOP);
                Vec3.addC(topPos, 0, 320, 0);
                central = "tmp._skyRail." +
                    central.name + ".exit";
                return [{
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: field.cacheFx[0],
                        name: "trainCube" + entity
                    },
                    duration: -1,
                    actionDetached: false
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "idle"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: central,
                    changeType: "add",
                    value: 1
                }, {
                    type: "WAIT",
                    time: 0.25
                }, {
                    type: "SHOW_EFFECT",
                    effect: {
                        sheet: field.cacheFx[0],
                        name: "trainTrail" + entity
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
                    newPos: topPos,
                    keySpline: "EASE_IN"
                }, {
                    type: "CHANGE_VAR_NUMBER",
                    varName: central,
                    changeType: "sub",
                    value: 1
                }, {
                    type: "WAIT",
                    time: 1
                }]
            },
            steps: function(steps, entity, central) {
                central = central.getCenter();
                central.y = central.y - (central.coll.pos.z + Constants.BALL_HEIGHT + 8);
                central = Vec2.create(central);
                central.y = central.y + 160;
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    type: "SET_SCREEN_BLUR",
                    alpha: 0.3
                });
                steps.push({
                    type: "SET_CAMERA_POS",
                    pos: central,
                    speed: 1,
                    transition: "EASE_IN",
                    zoom: 1
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    color: "white",
                    alpha: 1,
                    time: 0.3,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                steps.push({
                    time: 0.3,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    type: "CLEAR_SCREEN_BLUR"
                })
            },
            cacheFx: ["map.rhombus-sqr"]
        }
    };
    ig.LANG_CONTEXT.TeleportField = function(entity) {
        return "TeleportField[" + (entity.settings.name || "") + "]"
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
                    _select: FIELD_GFX
                }
            },
            label: function() {
                return !this.map ? "" : this.map + " > " + this.marker
            },
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)"
        }),
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.coll.type =
                ig.COLLTYPE.BLOCK;
            this.centralName = extraSettings.central && extraSettings.central.name;
            sc.TeleportCentralMap.registerField(this.centralName, this);
            this.map = extraSettings.map;
            this.marker = extraSettings.marker;
            this.dir = extraSettings.dir;
            this.isExit = extraSettings.map || extraSettings.pseudoExit;
            this.longTelCond = new ig.VarCondition(extraSettings.longTelCond);
            var mapStyle = ig.mapStyle.get("map"),
                tileX = 0,
                tileY = 0,
                xCount = void 0,
                zHeight = 1;
            if (mapStyle.teleportField) {
                tileX = mapStyle.teleportField.x;
                tileY = mapStyle.teleportField.y;
                xCount = mapStyle.teleportField.xCount;
                zHeight = mapStyle.zHeight || 1
            }
            this.coll.setSize(24, 24, zHeight);
            this.gfxType = FIELD_GFX[extraSettings.gfxType] || FIELD_GFX.SOLID;
            if (this.gfxType.glowFx) this.glowFxReplace =
                new ig.EffectHandle(this.gfxType.glowFx);
            if (this.gfxType.hideFx) this.hideFxReplace = new ig.EffectHandle(this.gfxType.hideFx);
            if (this.gfxType.cacheFx) {
                this.cacheFx = [];
                for (zHeight = 0; zHeight < this.gfxType.cacheFx.length; ++zHeight) this.cacheFx[zHeight] = new ig.EffectSheet(this.gfxType.cacheFx[zHeight])
            }
            this.initAnimations(this.gfxType.gfx(mapStyle.sheet, xCount, tileX, tileY));
            if (extraSettings.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: extraSettings.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(extraSettings.blockEventCondition || "true")
            }
            if (this.hasInteract()) {
                this.interactEntry =
                    new sc.MapInteractEntry(this, this, this.teleportIcon, sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, true);
                var hoverText = new sc.IconHoverTextGui(new ig.LangLabel(extraSettings.teleportLabel), 24, true);
                this.interactEntry.setSubGui(hoverText);
                this.interactEntry.setOffset(1, 0)
            }
            this.setCurrentAnim(this.isExit ? "red" : "active")
        },
        show: function(silent) {
            this.parent(silent);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            this.hasInteract() && sc.mapInteract.addEntry(this.interactEntry);
            if (!silent) {
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
        onEffectEvent: function(effect) {
            if (effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        onKill: function(silent) {
            this.parent(silent);
            this.hasInteract() && sc.mapInteract.removeEntry(this.interactEntry);
            this.glowFxReplace && this.glowFxReplace.clearCached();
            this.hideFxReplace && this.hideFxReplace.clearCached();
            if (this.cacheFx)
                for (silent = this.cacheFx.length; silent--;) this.cacheFx[silent].decreaseRef();
            sc.TeleportCentralMap.unregisterField(this.centralName, this)
        },
        hasInteract: function() {
            return this.map || this.blockEvent
        },
        collideWith: function(entity) {
            !entity instanceof ig.ActorEntity || this.effects.hideHandle || this.glowHandle || this.startGlow()
        },
        update: function() {
            if (this.glowHandle) {
                for (var entitiesOnTop = ig.game.getEntitiesOnTop(this), hasActor = false,
                        i = entitiesOnTop.length; i--;)
                    if (entitiesOnTop[i] instanceof ig.ActorEntity) {
                        hasActor = true;
                        break
                    } if (this.glowHandle && !hasActor) {
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
                var entitiesOnTop = ig.game.getEntitiesOnTop(this);
                if (entitiesOnTop.length > 0) {
                    for (var i = entitiesOnTop.length, hasActor = false; i--;) hasActor = hasActor || entitiesOnTop[i] instanceof ig.ActorEntity;
                    hasActor && this.startGlow()
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
        enterEntity: function(entity) {
            var actionSteps = this.getEnterActionData(entity, !this.gfxType.exitSteps);
            this.gfxType.exitSteps && actionSteps.push.apply(actionSteps, this.gfxType.exitSteps(entity, this, ig.game.namedEntities[this.centralName]));
            actionSteps = new ig.Action("doorAction", actionSteps);
            entity.setAction(actionSteps, true)
        },
        leaveEntity: function(entity) {
            ig.EffectTools.clearEffects(entity);
            this.effects.teleport.spawnOnTarget(entity.soundType == "none" ? "showDefaultSilent" :
                "showDefault", entity, {});
            if (this.gfxType.enterSteps) {
                entity = this.gfxType.enterSteps(entity, this, ig.game.namedEntities[this.centralName]);
                return new ig.Action("doorAction", entity)
            }
            return null
        },
        getEnterActionData: function(entity, withHideEffect) {
            var silent = entity.soundType == "none",
                actionSteps = [{
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
            withHideEffect && actionSteps.push({
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "teleport",
                    name: silent ? "hideDefaultSilent" : "hideDefault"
                },
                duration: 0,
                wait: true,
                actionDetached: true
            });
            return actionSteps
        },
        _addMoveEvent: function(steps, entity, usedFields, wait) {
            if (entity)
                if (usedFields) {
                    var fields = sc.TeleportCentralMap.getFields(this.centralName);
                    if (fields && !(fields.length <= usedFields.length))
                        for (var i = fields.length; i--;)
                            if (fields[i].isExit &&
                                usedFields.indexOf(fields[i]) == -1) {
                                fields[i]._addMoveEvent(steps, entity, null, wait);
                                usedFields.push(fields[i]);
                                break
                            }
                } else {
                    usedFields = this.getEnterActionData(entity, false);
                    !wait && this.gfxType.exitSteps && usedFields.push.apply(usedFields, this.gfxType.exitSteps(entity, this, ig.game.namedEntities[this.centralName]));
                    steps.push({
                        type: "DO_ACTION",
                        entity: entity,
                        action: usedFields,
                        wait: wait
                    });
                    if (wait && this.gfxType.exitSteps) {
                        usedFields = this.gfxType.exitSteps(entity, this, ig.game.namedEntities[this.centralName]);
                        steps.push({
                            type: "DO_ACTION",
                            entity: entity,
                            action: usedFields,
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
            var player = ig.game.playerEntity,
                steps = [],
                usedFields = [this],
                isLongTeleport = false;
            sc.party.getPartySize() >= 1 && this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(0), usedFields, false);
            sc.party.getPartySize() >= 2 && this._addMoveEvent(steps, sc.party.getPartyMemberEntityByIndex(1), usedFields, false);
            this._addMoveEvent(steps, player, null, true);
            steps.push({
                type: "SET_TELEPORT_COLOR",
                lighter: true,
                color: "white"
            });
            if (isLongTeleport = this.longTelCond.evaluate())
                if (this.gfxType.longSteps) this.gfxType.longSteps(steps, player, this);
                else {
                    steps.push({
                        type: "SET_CAMERA_TARGET",
                        entity: player,
                        speed: "NORMAL",
                        transition: "EASE_IN_OUT",
                        zoom: 1
                    });
                    steps.push({
                        type: "SHOW_EFFECT",
                        entity: player,
                        effect: {
                            sheet: "teleport",
                            name: "hideSlow"
                        }
                    });
                    steps.push({
                        time: 0.2,
                        ignoreSlowDown: false,
                        type: "WAIT"
                    });
                    steps.push({
                        type: "SET_CAMERA_ZOOM",
                        zoom: 3,
                        duration: 4,
                        transition: "EASE_IN"
                    });
                    steps.push({
                        color: "white",
                        alpha: 1,
                        time: 3,
                        lighter: true,
                        type: "SET_OVERLAY"
                    });
                    steps.push({
                        zoomType: "LIGHT",
                        fadeIn: 0.5,
                        duration: 4,
                        fadeOut: 1,
                        type: "SET_ZOOM_BLUR",
                        name: null
                    });
                    steps.push({
                        time: 4,
                        ignoreSlowDown: false,
                        type: "WAIT"
                    })
                }
            else if (this.gfxType.steps) this.gfxType.steps(steps, player, this);
            else {
                steps.push({
                    type: "SET_CAMERA_TARGET",
                    entity: player,
                    speed: "FAST",
                    transition: "EASE_IN_OUT",
                    zoom: 1
                });
                steps.push({
                    time: 0.1,
                    ignoreSlowDown: false,
                    type: "WAIT"
                });
                steps.push({
                    color: "white",
                    alpha: 1,
                    time: 1,
                    lighter: true,
                    type: "SET_OVERLAY"
                });
                steps.push({
                    type: "SET_CAMERA_ZOOM",
                    zoom: 1.5,
                    duration: 1,
                    transition: "EASE_IN"
                });
                steps.push({
                    type: "SHOW_EFFECT",
                    entity: player,
                    effect: {
                        sheet: "teleport",
                        name: "hideDefault"
                    }
                });
                steps.push({
                    time: 1.2,
                    ignoreSlowDown: false,
                    type: "WAIT"
                })
            }
            steps.push({
                type: "TELEPORT",
                map: this.map,
                marker: this.marker
            });
            steps.push({
                time: 3,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            player = new ig.Event({
                steps: steps
            });
            isLongTeleport ? sc.Cutscene.startCutscene(player) : ig.game.events.callEvent(player, ig.EventRunType.BLOCKING);
            return true
        },
        varsChanged: function() {
            this.initialized = false
        },
        applyMarkerPosition: function(entity) {
            var coll = this.coll;
            entity.coll.level = coll.level;
            entity.coll.baseZPos = coll.baseZPos;
            entity.coll.pos.z = coll.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, entity.face);
            entity.setPos(coll.pos.x + coll.size.x / 2 - entity.coll.size.x / 2, coll.pos.y + coll.size.y / 2 - entity.coll.size.y / 2);
            if (entity.isPlayer && this.gfxType.enterSteps) ig.game.postPlacementAction = this
        },
        onPostPlacementAction: function(entity) {
            if (this.gfxType.enterSteps) {
                var actionSteps =
                    this.gfxType.enterSteps(entity, this, ig.game.namedEntities[this.centralName]),
                    actionSteps = new ig.Action("doorAction", actionSteps);
                actionSteps.eventAction = true;
                entity.setAction(actionSteps)
            }
            entity = [this];
            sc.party.getPartySize() >= 1 && this._addPartyEnterSteps(sc.party.getPartyMemberEntityByIndex(0), entity);
            sc.party.getPartySize() >= 2 && this._addPartyEnterSteps(sc.party.getPartyMemberEntityByIndex(1), entity)
        },
        _addPartyEnterSteps: function(entity, usedFields) {
            if (entity) {
                var fields = sc.TeleportCentralMap.getFields(this.centralName);
                if (fields && !(fields.length <= usedFields.length))
                    for (var i = fields.length; i--;)
                        if (!fields[i].isExit &&
                            usedFields.indexOf(fields[i]) == -1) {
                            fields[i].applyMarkerPosition(entity);
                            fields[i]._addEnterSteps(entity);
                            usedFields.push(fields[i]);
                            break
                        }
            }
        },
        _addEnterSteps: function(entity) {
            if (this.gfxType.enterSteps) {
                var actionSteps = this.gfxType.enterSteps(entity, this, ig.game.namedEntities[this.centralName]),
                    actionSteps = new ig.Action("doorAction", actionSteps);
                actionSteps.eventAction = true;
                entity.setAction(actionSteps)
            }
        },
        isRunnerDestBlocked: function() {
            return !!this.glowHandle
        }
    })
});
ig.baked = !0;
