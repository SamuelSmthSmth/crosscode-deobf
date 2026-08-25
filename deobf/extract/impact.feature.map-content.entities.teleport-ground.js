ig.module("impact.feature.map-content.entities.teleport-ground").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.map-content.entities.hidden-block", "impact.feature.base.entities.object-layer-view", "game.feature.npc.entities.npc-waypoint").defines(function() {
    var b = {
        REGULAR: 1,
        INTER_AREA: 2
    };
    ig.ENTITY.TeleportGround = ig.Entity.extend({
        map: "",
        marker: "",
        dir: "SOUTH",
        blockEvent: null,
        blockEventCondition: null,
        spawnDistance: 0,
        transitionType: 0,
        npcRunnerProb: 0,
        centerWalkThrough: false,
        wpConnection: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                zHeight: {
                    _type: "Number",
                    _default: 64
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
                    _context: "Map"
                },
                marker: {
                    _type: "Marker",
                    _info: "Marker on map to teleport player to"
                },
                spawnDistance: {
                    _type: "Number",
                    _info: "Distance to place player away from teleportGround when spawning",
                    _default: 48
                },
                blockEvent: {
                    _type: "Event",
                    _info: "Event to be performed when entering the teleport ground",
                    _popup: true,
                    _optional: true
                },
                blockEventCondition: {
                    _type: "VarCondition",
                    _info: "Condition to show the block event when entering this teleport ground",
                    _popup: true
                },
                transitionType: {
                    _type: "String",
                    _info: "Type of transition.",
                    _select: b
                },
                npcRunnerProb: {
                    _type: "Number",
                    _info: "Probability that NPCs will enter and leave through this exit"
                },
                centerWalkThrough: {
                    _type: "Boolean",
                    _info: "If entity should always walk through the center of this opening"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for teleporter to appear",
                    _popup: true
                }
            },
            scalableX: true,
            scalableY: true,
            label: function() {
                return this.map + " > " + this.marker
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)"
        }),
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.BLOCK;
            e.size ? this.coll.size.z = e.zHeight : this.coll.setSize(8, 8, e.zHeight || 64);
            this.map = e.map;
            this.marker = e.marker;
            this.dir = e.dir || "SOUTH";
            this.spawnDistance = e.spawnDistance || 48;
            this.transitionType = b[e.transitionType] || b.REGULAR;
            this.centerWalkThrough = e.centerWalkThrough ||
                false;
            this.npcRunnerProb = e.npcRunnerProb || 0;
            if (e.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: e.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(e.blockEventCondition || "true")
            }
            this.wpConnection = new sc.WPConnection(this)
        },
        collideWith: function(a, d) {
            if (this.map && ig.game.isPlayerTouch(this, a, d) && ig.game.isInterruptible() && !sc.model.isMapLeaveBlocked() && a.coll.pos.z == this.coll.pos.z)
                if (this.blockEvent && this.blockEventCondition.evaluate()) sc.Cutscene.startCutscene(this.blockEvent);
                else {
                    if (this.transitionType == b.INTER_AREA) {
                        ig.game.setTeleportColor(255, 255, 255, false);
                        ig.game.setTeleportTime(1, 1);
                        sc.combat.forceEnd();
                        ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW")
                    }
                    this.coll.ignoreCollision = true;
                    var c = this.getEnterActionData(a),
                        c = new ig.Event({
                            steps: [{
                                type: "DO_ACTION",
                                entity: a,
                                action: c
                            }, {
                                type: "TELEPORT",
                                map: this.map,
                                marker: this.marker
                            }]
                        });
                    ig.game.events.callEvent(c, ig.EventRunType.BLOCKING)
                }
        },
        enterEntity: function(a) {
            var b = this.getEnterActionData(a, true),
                b = new ig.Action("doorAction",
                    b);
            a.setAction(b)
        },
        leaveEntity: function() {},
        getEnterActionData: function() {
            var a = [{
                type: "SET_SLIP_THROUGH",
                value: true
            }, {
                type: "SET_WALK_ANIMS",
                config: "normal"
            }, {
                type: "SET_FACE_FIX",
                value: true
            }, {
                type: "SET_FACE",
                face: this.dir
            }, {
                type: "SET_Z_GRAVITY_FACTOR",
                value: 0
            }, {
                type: "SET_JUMPING",
                value: false
            }, {
                type: "MOVE_FORWARD",
                time: 2
            }, {
                type: "WAIT",
                time: -1
            }];
            if (this.centerWalkThrough) {
                a.splice(0, 0, {
                    type: "SET_RELATIVE_SPEED",
                    value: 0.5
                });
                a.splice(4, 0, {
                    type: "MOVE_TO_POINT",
                    target: this.getCenter()
                })
            }
            return a
        },
        applyMarkerPosition: function(a) {
            var b =
                this.coll;
            a.coll.level = b.level;
            a.coll.baseZPos = b.baseZPos;
            a.coll.pos.z = b.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, a.face);
            Vec2.flip(a.face);
            var c = b.pos.x + b.size.x / 2 - a.coll.size.x / 2,
                e = b.pos.y + b.size.y / 2 - a.coll.size.y / 2;
            switch (this.dir) {
                case "NORTH":
                    e = e + (b.size.y / 2 + this.spawnDistance);
                    break;
                case "SOUTH":
                    e = e - (b.size.y / 2 + this.spawnDistance);
                    break;
                case "WEST":
                    c = c + (b.size.x / 2 + this.spawnDistance);
                    break;
                case "EAST":
                    c = c - (b.size.x / 2 + this.spawnDistance)
            }
            a.setPos(c, e)
        },
        getRunnerDestination: function() {
            return !this.npcRunnerProb ||
                !this.map ? null : {
                    entries: [{
                        entity: this,
                        dir: this.dir,
                        type: sc.NPC_RUNNER_DEST_TYPE.ENTER_EXIT,
                        posType: sc.NPC_RUNNER_DEST_POS_TYPE.SIDE
                    }],
                    enterProb: this.npcRunnerProb,
                    exitProb: this.npcRunnerProb,
                    map: this.map
                }
        },
        getWPConnect: function() {
            return this.wpConnection
        }
    })
});
ig.baked = !0;
