ig.module("impact.feature.map-content.entities.stair-door").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.map-content.entities.hidden-block", "impact.feature.base.entities.object-layer-view").defines(function() {
    var b = {
            UPWARDS_EAST: {
                up: true,
                flip: false
            },
            UPWARDS_WEST: {
                up: true,
                flip: true
            },
            DOWNWARDS_EAST: {
                down: true,
                flip: false
            },
            DOWNWARDS_WEST: {
                down: true,
                flip: true
            }
        },
        a = Vec3.create(),
        d = Vec3.create(),
        c = Vec2.create(),
        e = Vec2.create(),
        f = {
            REGULAR: 1,
            INTER_AREA: 2
        };
    ig.ENTITY.TeleportStairs =
        ig.Entity.extend({
            gfx: null,
            map: "",
            marker: "",
            stairType: b.UPWARDS_EAST,
            blockEvent: null,
            blockEventCondition: null,
            spawnDistance: 0,
            transitionType: 0,
            npcRunnerProb: 0,
            centerWalkThrough: false,
            objMaps: null,
            _wm: new ig.Config({
                spawnable: true,
                attributes: {
                    stairType: {
                        _type: "String",
                        _info: "View direction of teleport ground.",
                        _select: b
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
                    npcRunnerProb: {
                        _type: "Number",
                        _info: "Probability that NPCs will enter and leave through this exit"
                    },
                    layer: {
                        _type: "String",
                        _info: "Object layer from which to display surrounding stuff",
                        _select: {
                            object1: 1,
                            object2: 1,
                            object3: 1
                        },
                        _withNull: true
                    },
                    transitionType: {
                        _type: "String",
                        _info: "Type of transition.",
                        _select: f
                    }
                },
                label: function() {
                    return this.map + " > " + this.marker +
                        "\n\n\n"
                },
                drawBox: true,
                boxColor: "rgba(255,255,0, 0.5)",
                frontColor: "rgba(120,120,0, 0.8)",
                alwaysRecreate: true
            }),
            init: function(a, c, d, e) {
                this.parent(a, c, d, e);
                this.coll.type = ig.COLLTYPE.BLOCK;
                this.coll.setSize(32, 16, 48);
                this.transitionType = f[e.transitionType] || f.REGULAR;
                this.map = e.map;
                this.marker = e.marker;
                this.stairType = b[e.stairType] || b.UPWARDS_EAST;
                if (a = e.layer) this.objMaps = ig.game.getObjectMaps(a);
                if ((a = ig.mapStyle.get("map")) && a.stairDoor) this.gfx = new ig.Image(a.sheet);
                this.npcRunnerProb = e.npcRunnerProb ||
                    0;
                if (e.blockEvent) {
                    this.blockEvent = new ig.Event({
                        name: "DOOR BLOCK EVENT",
                        steps: e.blockEvent
                    });
                    this.blockEventCondition = new ig.VarCondition(e.blockEventCondition || "true")
                }
            },
            onKill: function(a) {
                this.parent(a);
                this.gfx && this.gfx.decreaseRef()
            },
            initSprites: function() {
                var b = 1;
                Vec3.assign(a, this.coll.pos);
                a.x = a.x - 16;
                Vec3.assignC(d, 64, 16, 64);
                this.objMaps && (b = b + ig.ObjectLayerTools.getSpriteCount(this, this.objMaps, a, d));
                this.setSpriteCount(b)
            },
            updateSprites: function() {
                if (!this.spritesInitialized) {
                    Vec3.assign(a,
                        this.coll.pos);
                    a.x = a.x - 16;
                    Vec3.assignC(d, 64, 16, 64);
                    if (!this.objMaps || ig.ObjectLayerTools.updateSprites(this, this.objMaps, 0, null, a, d)) {
                        this.spritesInitialized = true;
                        var b = ig.mapStyle.get("map");
                        if (b && b.stairDoor) {
                            var c = this.sprites.last();
                            c.setEntityDefault(this, 32, 48, ig.ANIM_SHAPE_TYPE.Z_FLAT, 0, null, this.gfx, b.stairDoor.x + (this.stairType.down ? 32 : 0), b.stairDoor.y);
                            c.setFlip(this.stairType.flip, false)
                        }
                    }
                }
            },
            collideWith: function(a, b) {
                if (this.map && ig.game.isPlayerTouch(this, a, b) && ig.game.isInterruptible() &&
                    a.coll.pos.z == this.coll.pos.z)
                    if (this.blockEvent && this.blockEventCondition.evaluate()) sc.Cutscene.startCutscene(this.blockEvent);
                    else {
                        this.coll.ignoreCollision = true;
                        if (this.transitionType == f.INTER_AREA) {
                            ig.game.setTeleportColor(255, 255, 255, false);
                            ig.game.setTeleportTime(1, 1);
                            sc.combat.forceEnd();
                            ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW")
                        }
                        var c = this.getEnterActionData(a),
                            c = new ig.Event({
                                steps: [{
                                    type: "DO_ACTION",
                                    entity: a,
                                    action: c
                                }, {
                                    type: "WAIT",
                                    time: 0.4
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
                    b = new ig.Action("doorAction", b);
                a.setAction(b)
            },
            leaveEntity: function() {},
            getEnterActionData: function(a) {
                var a = [{
                        type: "SET_TERRAIN_FRICTION_IGNORE",
                        value: true
                    }, {
                        type: "SET_SLIP_THROUGH",
                        value: true
                    }, {
                        type: "SET_WALK_ANIMS",
                        config: "normal"
                    }, {
                        type: "SET_FACE_FIX",
                        value: false
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 0.5
                    }, {
                        type: "MOVE_TO_POINT",
                        target: this.getStartPoint(a)
                    }, {
                        type: "SHOW_ANIMATION",
                        anim: "move",
                        viaWalkConfig: true
                    }, {
                        type: "SET_FACE",
                        value: 0.2,
                        face: "NORTH"
                    }, {
                        type: "SET_FACE_FIX",
                        value: true
                    }],
                    b, d, f;
                if (this.stairType.up) {
                    c.y = -16;
                    c.x = 8;
                    e.y = -40;
                    e.x = 24;
                    b = this.stairType.flip ? "NORTH_WEST" : "NORTH_EAST";
                    f = d = 0.4
                } else {
                    c.y = -8;
                    c.x = 8;
                    e.y = -4;
                    e.x = 24;
                    d = 0.2;
                    f = 0.3;
                    b = this.stairType.flip ? "NORTH_WEST" : "NORTH_EAST"
                }
                if (this.stairType.flip) {
                    c.x = -c.x;
                    e.x = -e.x
                }
                var k = Vec2.add(this.getCenter(), c),
                    l = Vec2.add(this.getCenter(), e);
                a.push.apply(a, [{
                    type: "SET_RELATIVE_SPEED",
                    value: d
                }, {
                    type: "MOVE_TO_POINT",
                    target: k
                }, {
                    type: "SET_RELATIVE_SPEED",
                    value: f
                }, {
                    type: "SET_FACE",
                    value: 0.2,
                    face: b
                }, {
                    type: "MOVE_TO_POINT",
                    target: l
                }, {
                    type: "WAIT",
                    time: 1
                }]);
                return a
            },
            getStartPoint: function(a) {
                var b = this.getCenter();
                b.y = b.y + (this.coll.size.y / 2 - a.coll.size.y / 2 + 4);
                return b
            },
            applyMarkerPosition: function(a) {
                var b = this.coll;
                a.coll.level = b.level;
                a.coll.baseZPos = b.baseZPos;
                a.coll.pos.z = b.pos.z;
                ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, a.face);
                Vec2.flip(a.face);
                var c = b.pos.x + b.size.x / 2 - a.coll.size.x / 2,
                    d = b.pos.y + b.size.y / 2 - a.coll.size.y / 2,
                    d = d + (b.size.y /
                        2 + 16);
                a.setPos(c, d)
            },
            getRunnerDestination: function() {
                return !this.npcRunnerProb || !this.map ? null : {
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
            }
        })
});
ig.baked = !0;
