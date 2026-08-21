/**
 * impact.feature.map-content.entities.door
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.door")`.
 *
 * `ig.ENTITY.Door`: an exit/entry door that opens when its `condition` is
 * met. Door frames come from the map style (front or side view, optional
 * glow), and crossing a door with a `map`/`marker` plays a walk-through
 * action and then teleports. `ig.DoorMat` renders the glowing floor mat
 * in front of active doors.
 */
ig.module("impact.feature.map-content.entities.door")
    .requires(
        "impact.base.entity",
        "impact.base.actor-entity",
        "impact.feature.map-content.entities.hidden-block",
        "impact.feature.base.entities.object-layer-view",
        "impact.feature.effect.effect-sheet"
    )
    .defines(function () {

    ig.DOOR_TYPE = {};
    ig.DOOR_TYPE.DEFAULT = {
        anims: null,
        preWait: 0,
        size: {
            x: 32,
            y: 16,
            z: 48
        }
    };

    /** Transition style: regular fade vs. inter-area white flash. */
    var transitionType = {
        REGULAR: 1,
        INTER_AREA: 2
    };

    ig.DOOR_OPEN_SOUND = {
        NORMAL: new ig.Sound("media/sound/puzzle/door-open.mp3"),
        STONE: new ig.Sound("media/sound/environment/stone-door-small.mp3"),
        CLOTH: new ig.Sound("media/sound/environment/cloth-door.ogg", 0.6),
        EVO: new ig.Sound("media/sound/environment/evo-village-door.ogg")
    };

    ig.ENTITY.Door = ig.AnimatedEntity.extend({
        doorType: null,
        condition: null,
        map: "",
        marker: "",
        dir: "SOUTH",
        doorMat: null,
        active: false,
        openTimer: 0,
        hasDoorMat: false,
        hasDoorGlow: false,
        hideManager: null,
        blockEvent: null,
        blockEventCondition: null,
        openEffect: null,
        sounds: {
            activate: new ig.Sound("media/sound/puzzle/door-activate-2.mp3"),
            deactivate: new ig.Sound("media/sound/puzzle/door-deactivate.ogg")
        },
        fx: {
            sheet: new ig.EffectSheet("map.door")
        },
        openSound: null,

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                doorType: {
                    _type: "String",
                    _info: "Type of door",
                    _select: ig.DOOR_TYPE
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for the door to open",
                    _popup: true
                },
                dir: {
                    _type: "String",
                    _info: "View direction of door.",
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
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _popup: true
                },
                blockEvent: {
                    _type: "Event",
                    _info: "Event to be performed when entering the door",
                    _popup: true,
                    _optional: true
                },
                blockEventCondition: {
                    _type: "VarCondition",
                    _info: "Condition to show the block event when entering this door",
                    _popup: true
                },
                variation: {
                    _type: "DoorVariations",
                    _info: "Variation of door"
                },
                transitionType: {
                    _type: "String",
                    _info: "Type of transition.",
                    _select: transitionType
                },
                narrow: {
                    _type: "Boolean",
                    _info: "If true: spawn player and party more narrow",
                    _optional: true
                }
            },
            label: function () {
                return "[ " + this.condition + " ]\n" + this.map + " > " + this.marker;
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.doorType = ig.DOOR_TYPE[settings.doorType] || ig.DOOR_TYPE.DEFAULT;
            this.transitionType = transitionType[settings.transitionType] || transitionType.REGULAR;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(this.doorType.size.x, this.doorType.size.y, this.doorType.size.z);
            this.coll.time.globalStatic = true;
            this.narrow = settings.narrow;
            if (this.doorType.openEffect) {
                var openEffect = this.doorType.openEffect;
                if (this.transitionType == transitionType.REGULAR && this.doorType.openEffectFast) {
                    openEffect = this.doorType.openEffectFast;
                }
                this.openEffect = new ig.EffectHandle(openEffect);
            }
            this.map = settings.map;
            this.marker = settings.marker;
            this.dir = settings.dir || "SOUTH";
            var coll = this.coll;
            if (this.doorType.anims) {
                this.hasDoorMat = false;
                this.dir = "SOUTH";
                this.initAnimations(this.doorType.anims);
            } else {
                var style = ig.mapStyle.get("map"),
                    tileOffset = this.dir == "NORTH" ? 4 : 0,
                    variation = style.doorVariations && style.doorVariations[settings.variation],
                    isSideways = this.dir == "EAST" || this.dir == "WEST";
                this.hasDoorMat = style.hasDoorMat && this.map;
                this.hasDoorGlow = !!style.doorGlow;
                this.openSound = ig.DOOR_OPEN_SOUND[style.doorSound] || ig.DOOR_OPEN_SOUND.NORMAL;
                var variationX = 0,
                    variationY = 0;
                if (variation) {
                    variationX = variation.x || 0;
                    variationY = variation.y || 0;
                    this.hasDoorMat = (variation.doorMat != void 0 ? variation.doorMat : this.hasDoorMat) && this.map;
                }
                if (isSideways) {
                    var animConfig = {
                        shapeType: "Y_FLAT",
                        offset: {
                            x: this.dir == "WEST" ? -8 : 8,
                            y: 0,
                            z: 0
                        },
                        namedSheets: {
                            door: {
                                src: style.sheet,
                                width: 16,
                                height: 96,
                                offX: variationX + 128,
                                offY: variationY,
                                xCount: 1
                            }
                        },
                        sheet: "door",
                        tileOffset: tileOffset,
                        flipX: this.dir == "EAST",
                        SUB: [{
                            name: "idle",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }, {
                            name: "open",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }, {
                            name: "close",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }]
                    };
                    if (style.doorGlow) {
                        animConfig.namedSheets.glow = {
                            src: style.sheet,
                            width: 16,
                            height: 96,
                            xCount: 1,
                            offX: style.doorGlow.sideX,
                            offY: style.doorGlow.sideY
                        };
                        animConfig.SUB.push({
                            time: 1,
                            frames: [0],
                            tileOffset: 0,
                            sheet: "glow",
                            SUB: [{
                                name: "idle"
                            }, {
                                name: "open"
                            }, {
                                name: "close"
                            }]
                        });
                    }
                } else {
                    var animConfig = {
                        shapeType: "Y_FLAT",
                        offset: {
                            x: 0,
                            y: this.dir == "NORTH" ? -15 : 0,
                            z: 0
                        },
                        namedSheets: {
                            door: {
                                src: style.sheet,
                                width: 32,
                                height: 48,
                                xCount: 4,
                                offX: variationX,
                                offY: variationY
                            }
                        },
                        sheet: "door",
                        tileOffset: tileOffset,
                        SUB: [{
                            name: "idle",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }, {
                            name: "open",
                            time: 0.04,
                            frames: [1, 2, 3],
                            repeat: false
                        }, {
                            name: "close",
                            time: 0.04,
                            frames: [2, 1],
                            repeat: false
                        }]
                    };
                    if (style.doorGlow) {
                        var glow = style.doorGlow;
                        if (variation && variation.doorGlow) glow = variation.doorGlow;
                        animConfig.namedSheets.glow = {
                            src: style.sheet,
                            width: 32,
                            height: 48,
                            xCount: glow.xCount,
                            offX: glow.x,
                            offY: glow.y
                        };
                        animConfig.SUB.push({
                            name: "idle",
                            time: 1,
                            frames: [this.dir == "NORTH" ? 1 : 0],
                            tileOffset: 0,
                            sheet: "glow"
                        });
                    }
                }
                this.initAnimations(animConfig);
                switch (this.dir) {
                    case "NORTH":
                        this.animState.alpha = 0.8;
                        break;
                    case "WEST":
                        coll.size.x = 16;
                        coll.size.y = 32;
                        break;
                    case "EAST":
                        coll.size.x = 16;
                        coll.size.y = 32;
                }
            }
            this.condition = new ig.VarCondition(settings.condition);
            this.active = this.condition.evaluate();
            if (settings.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: settings.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(settings.blockEventCondition || "true");
            }
            this.setCurrentAnim("idle");
            if (settings.hideCondition) this.hideManager = new ig.EntityHideManager(settings.hideCondition);
        },

        onKill: function (entity) {
            this.parent(entity);
            this.openEffect && this.openEffect.clearCached();
        },

        show: function (value) {
            this.parent(value);
            var coll = this.coll;
            if (this.hasDoorMat) {
                var x = coll.pos.x,
                    y = coll.pos.y;
                switch (this.dir) {
                    case "NORTH":
                        y = y - coll.size.y;
                        break;
                    case "WEST":
                        x = x - coll.size.x;
                }
                this.doorMat = ig.game.spawnEntity(ig.DoorMat, x, y, coll.pos.z, {
                    dir: this.dir,
                    active: this.active
                });
            }
            if (!this.map) {
                if (this.dir == "NORTH" || this.dir == "SOUTH") {
                    ig.game.spawnEntity("HiddenBlock", coll.pos.x, coll.pos.y, coll.pos.z, {
                        size: { x: 4, y: coll.size.y },
                        zHeight: coll.size.z
                    });
                    ig.game.spawnEntity("HiddenBlock", coll.pos.x + coll.size.x - 4, coll.pos.y, coll.pos.z, {
                        size: { x: 4, y: coll.size.y },
                        zHeight: coll.size.z
                    });
                } else {
                    ig.game.spawnEntity("HiddenBlock", coll.pos.x, coll.pos.y, coll.pos.z, {
                        size: { x: coll.size.x, y: 4 },
                        zHeight: coll.size.z
                    });
                    ig.game.spawnEntity("HiddenBlock", coll.pos.x, coll.pos.y + coll.size.y - 4, coll.pos.z, {
                        size: { x: coll.size.x, y: 4 },
                        zHeight: coll.size.z
                    });
                }
            }
        },

        update: function () {
            this.hideManager && this.hideManager.update(this);
            if (this.hasDoorGlow && this.sprites.length > 1) {
                var glowSprite = this.sprites[1];
                glowSprite.setGfxCut(!this.active ? glowSprite.size.y + glowSprite.size.z : 0, 0);
            }
            if (this.openTimer) {
                if (this.getOverlappingEntities(true).length > (this.map ? 0 : 2)) this.openTimer = 1;
                this.openTimer = this.openTimer - ig.system.tick;
                this.openTimer <= 0 && this.close();
            }
            this.parent();
        },

        close: function () {
            this.openTimer = 0;
            this.setCurrentAnim("close", true, "idle");
            this.map || this.coll.setType(ig.COLLTYPE.BLOCK);
        },

        open: function (value, openTime) {
            if (!this.openTimer) {
                !this.openEffect && this.openSound && (value ? this.openSound.play() : ig.SoundHelper.playAtEntity(this.openSound, this));
                this.animSheet.hasAnimation("openFast") && this.transitionType == transitionType.REGULAR ?
                    this.setCurrentAnim("openFast", true) : this.setCurrentAnim("open", true);
                this.map || this.coll.setType(ig.COLLTYPE.TRIGGER);
            }
            this.openTimer = openTime ? openTime : 1 + this.doorType.preWait;
            this.openEffect && this.openEffect.spawnOnTarget(this);
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            if (this.active != active) {
                this.active = active;
                this.doorMat && this.doorMat.setActive(this.active);
                if (this.hasDoorGlow && this.active) {
                    this.fx.sheet.spawnOnTarget("doorActivateGlow", this, {
                        spriteFilter: [1]
                    });
                    var glowSprite = this.sprites[1];
                    glowSprite && glowSprite.setGfxCut(0, 0);
                }
                if (this.active) {
                    this.sounds.activate.play();
                } else {
                    this.sounds.deactivate.play();
                    this.openTimer && this.close();
                }
            }
        },

        collideWith: function (other, response) {
            var dist = Vec2.sub(other.getCenter(), this.getCenter()),
                coll = this.coll;
            if (this.dir == "SOUTH" && Math.abs(dist.x) < coll.size.x / 2 ||
                this.dir == "NORTH" && Math.abs(dist.x) < coll.size.x / 2 ||
                this.dir == "EAST" && Math.abs(dist.y) < coll.size.y / 2 ||
                this.dir == "WEST" && Math.abs(dist.y) < coll.size.y / 2) {
                if (this.active && !this.map && other instanceof ig.ActorEntity) {
                    this.open();
                } else if (this.map && ig.game.isPlayerTouch(this, other, response) && ig.game.isInterruptible() &&
                    !sc.model.isMapLeaveBlocked() && other.coll.pos.z == this.coll.pos.z) {
                    if (this.blockEvent && this.blockEventCondition.evaluate()) {
                        sc.Cutscene.startCutscene(this.blockEvent);
                    } else if (this.active) {
                        if (this.transitionType == transitionType.INTER_AREA) {
                            ig.game.setTeleportColor(255, 255, 255, false);
                            ig.game.setTeleportTime(1, 1);
                            sc.combat.forceEnd();
                            ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW");
                        }
                        this.coll.ignoreCollision = true;
                        this.open(true);
                        dist = this.getEnterEventData(other);
                        dist.steps.push({
                            type: "TELEPORT",
                            map: this.map,
                            marker: this.marker
                        });
                        dist = new ig.Event(dist);
                        ig.game.events.callEvent(dist, ig.EventRunType.BLOCKING);
                    }
                }
            }
        },

        enterEntity: function (entity) {
            this.open();
            var actionData = this.getEnterActionData(entity),
                action = new ig.Action("doorAction", actionData);
            entity.setAction(action);
        },

        leaveEntity: function () {
            this.open();
        },

        /** Walk-through steps: slip through, move to the start/end point, wait. */
        getEnterActionData: function (entity) {
            var steps = [{
                type: "SET_TERRAIN_FRICTION_IGNORE",
                value: true
            }, {
                type: "SET_SLIP_THROUGH",
                value: true
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
                type: "MOVE_TO_POINT",
                target: this.getEndPoint(entity)
            }, {
                type: "WAIT",
                time: 1
            }];
            entity instanceof ig.ENTITY.Combatant && steps.unshift({
                type: "SET_WALK_ANIMS",
                config: "normal"
            });
            return steps;
        },

        /** Event data: enter action, optional pre-walk to the door face, then teleport. */
        getEnterEventData: function (entity) {
            var data = {
                steps: [{
                    type: "DO_ACTION",
                    entity: entity,
                    action: this.getEnterActionData(entity)
                }]
            };
            if (this.doorType.preWait) {
                data.steps.unshift({
                    type: "WAIT",
                    time: !this.doorType.preWaitFast || this.transitionType == transitionType.INTER_AREA ?
                        this.doorType.preWait : this.doorType.preWaitFast
                });
                var point = this.getCenter();
                point.y = point.y + (this.coll.size.y / 2 + entity.coll.size.y / 2 + 8);
                data.steps.unshift({
                    type: "DO_ACTION",
                    entity: entity,
                    action: [{
                        type: "SET_TERRAIN_FRICTION_IGNORE",
                        value: true
                    }, {
                        type: "SET_SLIP_THROUGH",
                        value: true
                    }, {
                        type: "SET_WALK_ANIMS",
                        config: "normal"
                    }, {
                        type: "SET_FACE_TO_ENTITY",
                        entity: this,
                        rotate: true
                    }, {
                        type: "SET_FACE_FIX",
                        value: true
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: 0.5
                    }, {
                        type: "MOVE_TO_POINT",
                        target: point,
                        precise: true
                    }, {
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    }]
                });
            }
            return data;
        },

        getStartPoint: function (entity) {
            var point = this.getCenter(),
                coll = this.coll,
                entityColl = entity.coll;
            switch (this.dir) {
                case "NORTH":
                    point.y = point.y - (coll.size.y / 2 - entityColl.size.y / 2);
                    break;
                case "SOUTH":
                    point.y = point.y + (coll.size.y / 2 - entityColl.size.y / 2);
                    break;
                case "EAST":
                    point.x = point.x + (coll.size.x / 2 - entityColl.size.x / 2);
                    break;
                case "WEST":
                    point.x = point.x - (coll.size.x / 2 - entityColl.size.x / 2);
            }
            return point;
        },

        getEndPoint: function () {
            var point = this.getCenter(),
                coll = this.coll;
            switch (this.dir) {
                case "NORTH":
                    point.y = point.y + coll.size.y / 2;
                    break;
                case "SOUTH":
                    point.y = point.y - coll.size.y / 2;
                    break;
                case "EAST":
                    point.x = point.x - coll.size.x / 2;
                    break;
                case "WEST":
                    point.x = point.x + coll.size.x / 2;
            }
            return point;
        },

        /** Place `entity` in front of the door, facing it. */
        applyMarkerPosition: function (entity) {
            var coll = this.coll;
            entity.coll.level = coll.level;
            entity.coll.baseZPos = coll.baseZPos;
            entity.coll.pos.z = coll.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, entity.face);
            var x = coll.pos.x + coll.size.x / 2 - entity.coll.size.x / 2,
                y = coll.pos.y + coll.size.y / 2 - entity.coll.size.y / 2,
                offset = this.narrow ? 48 : 16;
            switch (this.dir) {
                case "NORTH":
                    y = y - (coll.size.y / 2 + offset);
                    break;
                case "SOUTH":
                    y = y + (coll.size.y / 2 + offset);
                    break;
                case "WEST":
                    x = x - (coll.size.x / 2 + offset);
                    break;
                case "EAST":
                    x = x + (coll.size.x / 2 + offset);
            }
            entity.setPos(x, y);
        }
    });

    /** The glowing floor mat in front of an active door. */
    ig.DoorMat = ig.AnimatedEntity.extend({
        dir: "SOUTH",
        isActive: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.coll.time.globalStatic = true;
            this.dir = settings.dir;
            this.isActive = settings.active || false;
            var style = ig.mapStyle.get("map");
            this.initAnimations({
                sheet: {
                    src: style.sheet,
                    width: 32,
                    height: 32,
                    offY: 96,
                    xCount: 5
                },
                tileOffset: this.dir == "EAST" || this.dir == "WEST" ? 0 : 5,
                flipX: this.dir == "EAST",
                flipY: this.dir == "NORTH",
                SUB: [{
                    name: "active",
                    time: 1,
                    frames: [4],
                    repeat: false
                }, {
                    name: "inactive",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "activate",
                    time: 0.06,
                    frames: [1, 2, 3, 3, 3],
                    repeat: false
                }, {
                    name: "deactivate",
                    time: 0.06,
                    frames: [3, 2, 1],
                    repeat: false
                }]
            });
            this.setCurrentAnim(this.isActive ? "active" : "inactive");
        },

        setActive: function (active) {
            if (active != this.isActive) {
                (this.isActive = active) ? this.setCurrentAnim("activate", true, "active") : this.setCurrentAnim("deactivate", true, "inactive");
            }
        }
    });
});
ig.baked = !0;
