/**
 * impact.feature.map-content.entities.teleport-ground
 * ===================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.teleport-ground")`.
 *
 * The classic exit tile: when the player touches it (same z level), an
 * optional block event runs, otherwise the player is walked through the
 * opening ("enter action") and then teleported to `map` > `marker`.
 */
ig.module("impact.feature.map-content.entities.teleport-ground")
    .requires(
        "impact.base.entity",
        "impact.base.actor-entity",
        "impact.feature.map-content.entities.hidden-block",
        "impact.feature.base.entities.object-layer-view",
        "game.feature.npc.entities.npc-waypoint"
    )
    .defines(function () {

    /** Transition style: regular fade vs. inter-area white flash. */
    var transitionType = {
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
                    _select: transitionType
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
            label: function () {
                return this.map + " > " + this.marker;
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            settings.size ? this.coll.size.z = settings.zHeight : this.coll.setSize(8, 8, settings.zHeight || 64);
            this.map = settings.map;
            this.marker = settings.marker;
            this.dir = settings.dir || "SOUTH";
            this.spawnDistance = settings.spawnDistance || 48;
            this.transitionType = transitionType[settings.transitionType] || transitionType.REGULAR;
            this.centerWalkThrough = settings.centerWalkThrough || false;
            this.npcRunnerProb = settings.npcRunnerProb || 0;
            if (settings.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: settings.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(settings.blockEventCondition || "true");
            }
            this.wpConnection = new sc.WPConnection(this);
        },

        collideWith: function (other, response) {
            if (this.map && ig.game.isPlayerTouch(this, other, response) && ig.game.isInterruptible() &&
                !sc.model.isMapLeaveBlocked() && other.coll.pos.z == this.coll.pos.z) {
                if (this.blockEvent && this.blockEventCondition.evaluate()) {
                    sc.Cutscene.startCutscene(this.blockEvent);
                } else {
                    if (this.transitionType == transitionType.INTER_AREA) {
                        ig.game.setTeleportColor(255, 255, 255, false);
                        ig.game.setTeleportTime(1, 1);
                        sc.combat.forceEnd();
                        ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW");
                    }
                    this.coll.ignoreCollision = true;
                    var actionData = this.getEnterActionData(other),
                        event = new ig.Event({
                            steps: [{
                                type: "DO_ACTION",
                                entity: other,
                                action: actionData
                            }, {
                                type: "TELEPORT",
                                map: this.map,
                                marker: this.marker
                            }]
                        });
                    ig.game.events.callEvent(event, ig.EventRunType.BLOCKING);
                }
            }
        },

        enterEntity: function (entity) {
            var actionData = this.getEnterActionData(entity, true),
                action = new ig.Action("doorAction", actionData);
            entity.setAction(action);
        },

        leaveEntity: function () {},

        /** Walk-through steps: slip through, face `dir`, glide forward, wait. */
        getEnterActionData: function () {
            var steps = [{
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
                steps.splice(0, 0, {
                    type: "SET_RELATIVE_SPEED",
                    value: 0.5
                });
                steps.splice(4, 0, {
                    type: "MOVE_TO_POINT",
                    target: this.getCenter()
                });
            }
            return steps;
        },

        /** Place `entity` at the exit opening, facing away from it. */
        applyMarkerPosition: function (entity) {
            var coll = this.coll;
            entity.coll.level = coll.level;
            entity.coll.baseZPos = coll.baseZPos;
            entity.coll.pos.z = coll.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, entity.face);
            Vec2.flip(entity.face);
            var x = coll.pos.x + coll.size.x / 2 - entity.coll.size.x / 2,
                y = coll.pos.y + coll.size.y / 2 - entity.coll.size.y / 2;
            switch (this.dir) {
                case "NORTH":
                    y = y + (coll.size.y / 2 + this.spawnDistance);
                    break;
                case "SOUTH":
                    y = y - (coll.size.y / 2 + this.spawnDistance);
                    break;
                case "WEST":
                    x = x + (coll.size.x / 2 + this.spawnDistance);
                    break;
                case "EAST":
                    x = x - (coll.size.x / 2 + this.spawnDistance);
            }
            entity.setPos(x, y);
        },

        getRunnerDestination: function () {
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
            };
        },

        getWPConnect: function () {
            return this.wpConnection;
        }
    });
});
ig.baked = !0;
