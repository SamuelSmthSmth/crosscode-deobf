/**
 * impact.feature.map-content.entities.stair-door
 * ==============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.stair-door")`.
 *
 * `ig.ENTITY.TeleportStairs`: a staircase exit tile that walks the player up
 * or down stairs (via MOVE_TO_POINT steps through `getEnterActionData`) and
 * then teleports to `map` > `marker`. The stair sprite comes from the map
 * style's `stairDoor` entry.
 */
ig.module("impact.feature.map-content.entities.stair-door")
    .requires(
        "impact.base.entity",
        "impact.base.actor-entity",
        "impact.feature.map-content.entities.hidden-block",
        "impact.feature.base.entities.object-layer-view"
    )
    .defines(function () {

    /** Stair orientation: which way (and flipped or not) the stairs go. */
    var stairType = {
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
    };

    var scratchVec3a = Vec3.create(),
        scratchVec3b = Vec3.create(),
        scratchVec2a = Vec2.create(),
        scratchVec2b = Vec2.create();

    /** Transition style: regular fade vs. inter-area white flash. */
    var transitionType = {
        REGULAR: 1,
        INTER_AREA: 2
    };

    ig.ENTITY.TeleportStairs = ig.Entity.extend({
        gfx: null,
        map: "",
        marker: "",
        stairType: stairType.UPWARDS_EAST,
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
                    _select: stairType
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
                    _select: transitionType
                }
            },
            label: function () {
                return this.map + " > " + this.marker + "\n\n\n";
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)",
            frontColor: "rgba(120,120,0, 0.8)",
            alwaysRecreate: true
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(32, 16, 48);
            this.transitionType = transitionType[settings.transitionType] || transitionType.REGULAR;
            this.map = settings.map;
            this.marker = settings.marker;
            this.stairType = stairType[settings.stairType] || stairType.UPWARDS_EAST;
            if (x = settings.layer) this.objMaps = ig.game.getObjectMaps(x);
            if ((x = ig.mapStyle.get("map")) && x.stairDoor) this.gfx = new ig.Image(x.sheet);
            this.npcRunnerProb = settings.npcRunnerProb || 0;
            if (settings.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: settings.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(settings.blockEventCondition || "true");
            }
        },

        onKill: function (entity) {
            this.parent(entity);
            this.gfx && this.gfx.decreaseRef();
        },

        initSprites: function () {
            var spriteCount = 1;
            Vec3.assign(scratchVec3a, this.coll.pos);
            scratchVec3a.x = scratchVec3a.x - 16;
            Vec3.assignC(scratchVec3b, 64, 16, 64);
            this.objMaps && (spriteCount = spriteCount + ig.ObjectLayerTools.getSpriteCount(this, this.objMaps, scratchVec3a, scratchVec3b));
            this.setSpriteCount(spriteCount);
        },

        updateSprites: function () {
            if (!this.spritesInitialized) {
                Vec3.assign(scratchVec3a, this.coll.pos);
                scratchVec3a.x = scratchVec3a.x - 16;
                Vec3.assignC(scratchVec3b, 64, 16, 64);
                if (!this.objMaps || ig.ObjectLayerTools.updateSprites(this, this.objMaps, 0, null, scratchVec3a, scratchVec3b)) {
                    this.spritesInitialized = true;
                    var style = ig.mapStyle.get("map");
                    if (style && style.stairDoor) {
                        var sprite = this.sprites.last();
                        sprite.setEntityDefault(this, 32, 48, ig.ANIM_SHAPE_TYPE.Z_FLAT, 0, null, this.gfx, style.stairDoor.x + (this.stairType.down ? 32 : 0), style.stairDoor.y);
                        sprite.setFlip(this.stairType.flip, false);
                    }
                }
            }
        },

        collideWith: function (other, response) {
            if (this.map && ig.game.isPlayerTouch(this, other, response) && ig.game.isInterruptible() &&
                other.coll.pos.z == this.coll.pos.z) {
                if (this.blockEvent && this.blockEventCondition.evaluate()) {
                    sc.Cutscene.startCutscene(this.blockEvent);
                } else {
                    this.coll.ignoreCollision = true;
                    if (this.transitionType == transitionType.INTER_AREA) {
                        ig.game.setTeleportColor(255, 255, 255, false);
                        ig.game.setTeleportTime(1, 1);
                        sc.combat.forceEnd();
                        ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW");
                    }
                    var actionData = this.getEnterActionData(other),
                        event = new ig.Event({
                            steps: [{
                                type: "DO_ACTION",
                                entity: other,
                                action: actionData
                            }, {
                                type: "WAIT",
                                time: 0.4
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

        /** Walk up/down the stairs: two MOVE_TO_POINT legs with a face change. */
        getEnterActionData: function (entity) {
            var steps = [{
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
                target: this.getStartPoint(entity)
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
            }];
            var face, speed1, speed2;
            if (this.stairType.up) {
                scratchVec2a.y = -16;
                scratchVec2a.x = 8;
                scratchVec2b.y = -40;
                scratchVec2b.x = 24;
                face = this.stairType.flip ? "NORTH_WEST" : "NORTH_EAST";
                speed1 = speed2 = 0.4;
            } else {
                scratchVec2a.y = -8;
                scratchVec2a.x = 8;
                scratchVec2b.y = -4;
                scratchVec2b.x = 24;
                speed1 = 0.2;
                speed2 = 0.3;
                face = this.stairType.flip ? "NORTH_WEST" : "NORTH_EAST";
            }
            if (this.stairType.flip) {
                scratchVec2a.x = -scratchVec2a.x;
                scratchVec2b.x = -scratchVec2b.x;
            }
            var point1 = Vec2.add(this.getCenter(), scratchVec2a),
                point2 = Vec2.add(this.getCenter(), scratchVec2b);
            steps.push.apply(steps, [{
                type: "SET_RELATIVE_SPEED",
                value: speed1
            }, {
                type: "MOVE_TO_POINT",
                target: point1
            }, {
                type: "SET_RELATIVE_SPEED",
                value: speed2
            }, {
                type: "SET_FACE",
                value: 0.2,
                face: face
            }, {
                type: "MOVE_TO_POINT",
                target: point2
            }, {
                type: "WAIT",
                time: 1
            }]);
            return steps;
        },

        getStartPoint: function (entity) {
            var point = this.getCenter();
            point.y = point.y + (this.coll.size.y / 2 - entity.coll.size.y / 2 + 4);
            return point;
        },

        applyMarkerPosition: function (entity) {
            var coll = this.coll;
            entity.coll.level = coll.level;
            entity.coll.baseZPos = coll.baseZPos;
            entity.coll.pos.z = coll.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, entity.face);
            Vec2.flip(entity.face);
            var x = coll.pos.x + coll.size.x / 2 - entity.coll.size.x / 2,
                y = coll.pos.y + coll.size.y / 2 - entity.coll.size.y / 2,
                y = y + (coll.size.y / 2 + 16);
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
        }
    });
});
ig.baked = !0;
