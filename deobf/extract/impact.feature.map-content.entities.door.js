ig.module("impact.feature.map-content.entities.door").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.map-content.entities.hidden-block", "impact.feature.base.entities.object-layer-view", "impact.feature.effect.effect-sheet").defines(function() {
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
    var b = {
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
                    _select: b
                },
                narrow: {
                    _type: "Boolean",
                    _info: "If true: spawn player and party more narrow",
                    _optional: true
                }
            },
            label: function() {
                return "[ " + this.condition + " ]\n" + this.map + " > " + this.marker
            }
        }),
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.doorType = ig.DOOR_TYPE[e.doorType] || ig.DOOR_TYPE.DEFAULT;
            this.transitionType = b[e.transitionType] || b.REGULAR;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(this.doorType.size.x, this.doorType.size.y, this.doorType.size.z);
            this.coll.time.globalStatic = true;
            this.narrow = e.narrow;
            if (this.doorType.openEffect) {
                a = this.doorType.openEffect;
                if (this.transitionType == b.REGULAR && this.doorType.openEffectFast) a =
                    this.doorType.openEffectFast;
                this.openEffect = new ig.EffectHandle(a)
            }
            this.map = e.map;
            this.marker = e.marker;
            this.dir = e.dir || "SOUTH";
            a = this.coll;
            if (this.doorType.anims) {
                this.hasDoorMat = false;
                this.dir = "SOUTH";
                this.initAnimations(this.doorType.anims)
            } else {
                var d = ig.mapStyle.get("map"),
                    f = this.dir == "NORTH" ? 4 : 0,
                    c = d.doorVariations && d.doorVariations[e.variation],
                    g = this.dir == "EAST" || this.dir == "WEST";
                this.hasDoorMat = d.hasDoorMat && this.map;
                this.hasDoorGlow = !!d.doorGlow;
                this.openSound = ig.DOOR_OPEN_SOUND[d.doorSound] ||
                    ig.DOOR_OPEN_SOUND.NORMAL;
                var h = 0,
                    i = 0;
                if (c) {
                    h = c.x || 0;
                    i = c.y || 0;
                    this.hasDoorMat = (c.doorMat != void 0 ? c.doorMat : this.hasDoorMat) && this.map
                }
                if (g) {
                    f = {
                        shapeType: "Y_FLAT",
                        offset: {
                            x: this.dir == "WEST" ? -8 : 8,
                            y: 0,
                            z: 0
                        },
                        namedSheets: {
                            door: {
                                src: d.sheet,
                                width: 16,
                                height: 96,
                                offX: h + 128,
                                offY: i,
                                xCount: 1
                            }
                        },
                        sheet: "door",
                        tileOffset: f,
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
                    if (d.doorGlow) {
                        f.namedSheets.glow = {
                            src: d.sheet,
                            width: 16,
                            height: 96,
                            xCount: 1,
                            offX: d.doorGlow.sideX,
                            offY: d.doorGlow.sideY
                        };
                        f.SUB.push({
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
                        })
                    }
                } else {
                    f = {
                        shapeType: "Y_FLAT",
                        offset: {
                            x: 0,
                            y: this.dir == "NORTH" ? -15 : 0,
                            z: 0
                        },
                        namedSheets: {
                            door: {
                                src: d.sheet,
                                width: 32,
                                height: 48,
                                xCount: 4,
                                offX: h,
                                offY: i
                            }
                        },
                        sheet: "door",
                        tileOffset: f,
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
                            frames: [2,
                                1
                            ],
                            repeat: false
                        }]
                    };
                    if (d.doorGlow) {
                        g = d.doorGlow;
                        if (c && c.doorGlow) g = c.doorGlow;
                        f.namedSheets.glow = {
                            src: d.sheet,
                            width: 32,
                            height: 48,
                            xCount: g.xCount,
                            offX: g.x,
                            offY: g.y
                        };
                        f.SUB.push({
                            name: "idle",
                            time: 1,
                            frames: [this.dir == "NORTH" ? 1 : 0],
                            tileOffset: 0,
                            sheet: "glow"
                        })
                    }
                }
                this.initAnimations(f);
                switch (this.dir) {
                    case "NORTH":
                        this.animState.alpha = 0.8;
                        break;
                    case "WEST":
                        a.size.x = 16;
                        a.size.y = 32;
                        break;
                    case "EAST":
                        a.size.x = 16;
                        a.size.y = 32
                }
            }
            this.condition = new ig.VarCondition(e.condition);
            this.active = this.condition.evaluate();
            if (e.blockEvent) {
                this.blockEvent = new ig.Event({
                    name: "DOOR BLOCK EVENT",
                    steps: e.blockEvent
                });
                this.blockEventCondition = new ig.VarCondition(e.blockEventCondition || "true")
            }
            this.setCurrentAnim("idle");
            if (e.hideCondition) this.hideManager = new ig.EntityHideManager(e.hideCondition)
        },
        onKill: function(a) {
            this.parent(a);
            this.openEffect && this.openEffect.clearCached()
        },
        show: function(a) {
            this.parent(a);
            a = this.coll;
            if (this.hasDoorMat) {
                var b = a.pos.x,
                    c = a.pos.y;
                switch (this.dir) {
                    case "NORTH":
                        c = c - a.size.y;
                        break;
                    case "WEST":
                        b =
                            b - a.size.x
                }
                this.doorMat = ig.game.spawnEntity(ig.DoorMat, b, c, a.pos.z, {
                    dir: this.dir,
                    active: this.active
                })
            }
            if (!this.map)
                if (this.dir == "NORTH" || this.dir == "SOUTH") {
                    ig.game.spawnEntity("HiddenBlock", a.pos.x, a.pos.y, a.pos.z, {
                        size: {
                            x: 4,
                            y: a.size.y
                        },
                        zHeight: a.size.z
                    });
                    ig.game.spawnEntity("HiddenBlock", a.pos.x + a.size.x - 4, a.pos.y, a.pos.z, {
                        size: {
                            x: 4,
                            y: a.size.y
                        },
                        zHeight: a.size.z
                    })
                } else {
                    ig.game.spawnEntity("HiddenBlock", a.pos.x, a.pos.y, a.pos.z, {
                        size: {
                            x: a.size.x,
                            y: 4
                        },
                        zHeight: a.size.z
                    });
                    ig.game.spawnEntity("HiddenBlock",
                        a.pos.x, a.pos.y + a.size.y - 4, a.pos.z, {
                            size: {
                                x: a.size.x,
                                y: 4
                            },
                            zHeight: a.size.z
                        })
                }
        },
        update: function() {
            this.hideManager && this.hideManager.update(this);
            if (this.hasDoorGlow && this.sprites.length > 1) {
                var a = this.sprites[1];
                a.setGfxCut(!this.active ? a.size.y + a.size.z : 0, 0)
            }
            if (this.openTimer) {
                if (this.getOverlappingEntities(true).length > (this.map ? 0 : 2)) this.openTimer = 1;
                this.openTimer = this.openTimer - ig.system.tick;
                this.openTimer <= 0 && this.close()
            }
            this.parent()
        },
        close: function() {
            this.openTimer = 0;
            this.setCurrentAnim("close",
                true, "idle");
            this.map || this.coll.setType(ig.COLLTYPE.BLOCK)
        },
        open: function(a, d) {
            if (!this.openTimer) {
                !this.openEffect && this.openSound && (a ? this.openSound.play() : ig.SoundHelper.playAtEntity(this.openSound, this));
                this.animSheet.hasAnimation("openFast") && this.transitionType == b.REGULAR ? this.setCurrentAnim("openFast", true) : this.setCurrentAnim("open", true);
                this.map || this.coll.setType(ig.COLLTYPE.TRIGGER)
            }
            this.openTimer = d ? d : 1 + this.doorType.preWait;
            this.openEffect && this.openEffect.spawnOnTarget(this)
        },
        varsChanged: function() {
            var a =
                this.condition.evaluate();
            if (this.active != a) {
                this.active = a;
                this.doorMat && this.doorMat.setActive(this.active);
                if (this.hasDoorGlow && this.active) {
                    this.fx.sheet.spawnOnTarget("doorActivateGlow", this, {
                        spriteFilter: [1]
                    });
                    (a = this.sprites[1]) && a.setGfxCut(0, 0)
                }
                if (this.active) this.sounds.activate.play();
                else {
                    this.sounds.deactivate.play();
                    this.openTimer && this.close()
                }
            }
        },
        collideWith: function(a, d) {
            var c = Vec2.sub(a.getCenter(), this.getCenter()),
                e = this.coll;
            if (this.dir == "SOUTH" && Math.abs(c.x) < e.size.x / 2 || this.dir ==
                "NORTH" && Math.abs(c.x) < e.size.x / 2 || this.dir == "EAST" && Math.abs(c.y) < e.size.y / 2 || this.dir == "WEST" && Math.abs(c.y) < e.size.y / 2)
                if (this.active && !this.map && a instanceof ig.ActorEntity) this.open();
                else if (this.map && ig.game.isPlayerTouch(this, a, d) && ig.game.isInterruptible() && !sc.model.isMapLeaveBlocked() && a.coll.pos.z == this.coll.pos.z)
                if (this.blockEvent && this.blockEventCondition.evaluate()) sc.Cutscene.startCutscene(this.blockEvent);
                else if (this.active) {
                if (this.transitionType == b.INTER_AREA) {
                    ig.game.setTeleportColor(255,
                        255, 255, false);
                    ig.game.setTeleportTime(1, 1);
                    sc.combat.forceEnd();
                    ig.bgm.isPlayingDefault() && ig.bgm.pause("SLOW")
                }
                this.coll.ignoreCollision = true;
                this.open(true);
                c = this.getEnterEventData(a);
                c.steps.push({
                    type: "TELEPORT",
                    map: this.map,
                    marker: this.marker
                });
                c = new ig.Event(c);
                ig.game.events.callEvent(c, ig.EventRunType.BLOCKING)
            }
        },
        enterEntity: function(a) {
            this.open();
            var b = this.getEnterActionData(a),
                b = new ig.Action("doorAction", b);
            a.setAction(b)
        },
        leaveEntity: function() {
            this.open()
        },
        getEnterActionData: function(a) {
            var b = [{
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
                target: this.getStartPoint(a)
            }, {
                type: "MOVE_TO_POINT",
                target: this.getEndPoint(a)
            }, {
                type: "WAIT",
                time: 1
            }];
            a instanceof ig.ENTITY.Combatant && b.unshift({
                type: "SET_WALK_ANIMS",
                config: "normal"
            });
            return b
        },
        getEnterEventData: function(a) {
            var d = {
                steps: [{
                    type: "DO_ACTION",
                    entity: a,
                    action: this.getEnterActionData(a)
                }]
            };
            if (this.doorType.preWait) {
                d.steps.unshift({
                    type: "WAIT",
                    time: !this.doorType.preWaitFast || this.transitionType == b.INTER_AREA ? this.doorType.preWait : this.doorType.preWaitFast
                });
                var c = this.getCenter();
                c.y = c.y + (this.coll.size.y / 2 + a.coll.size.y / 2 + 8);
                d.steps.unshift({
                    type: "DO_ACTION",
                    entity: a,
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
                        target: c,
                        precise: true
                    }, {
                        type: "SET_FACE",
                        face: "NORTH",
                        rotate: true
                    }]
                })
            }
            return d
        },
        getStartPoint: function(a) {
            var b = this.getCenter(),
                c = this.coll,
                a = a.coll;
            switch (this.dir) {
                case "NORTH":
                    b.y = b.y - (c.size.y / 2 - a.size.y / 2);
                    break;
                case "SOUTH":
                    b.y = b.y + (c.size.y / 2 - a.size.y / 2);
                    break;
                case "EAST":
                    b.x = b.x + (c.size.x / 2 - a.size.x / 2);
                    break;
                case "WEST":
                    b.x = b.x - (c.size.x / 2 - a.size.x / 2)
            }
            return b
        },
        getEndPoint: function() {
            var a = this.getCenter(),
                b = this.coll;
            switch (this.dir) {
                case "NORTH":
                    a.y = a.y + b.size.y / 2;
                    break;
                case "SOUTH":
                    a.y =
                        a.y - b.size.y / 2;
                    break;
                case "EAST":
                    a.x = a.x - b.size.x / 2;
                    break;
                case "WEST":
                    a.x = a.x + b.size.x / 2
            }
            return a
        },
        applyMarkerPosition: function(a) {
            var b = this.coll;
            a.coll.level = b.level;
            a.coll.baseZPos = b.baseZPos;
            a.coll.pos.z = b.pos.z;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.dir] || 0, a.face);
            var c = b.pos.x + b.size.x / 2 - a.coll.size.x / 2,
                e = b.pos.y + b.size.y / 2 - a.coll.size.y / 2,
                f = this.narrow ? 48 : 16;
            switch (this.dir) {
                case "NORTH":
                    e = e - (b.size.y / 2 + f);
                    break;
                case "SOUTH":
                    e = e + (b.size.y / 2 + f);
                    break;
                case "WEST":
                    c = c - (b.size.x /
                        2 + f);
                    break;
                case "EAST":
                    c = c + (b.size.x / 2 + f)
            }
            a.setPos(c, e)
        }
    });
    ig.DoorMat = ig.AnimatedEntity.extend({
        dir: "SOUTH",
        isActive: false,
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.coll.time.globalStatic = true;
            this.dir = e.dir;
            this.isActive = e.active || false;
            a = ig.mapStyle.get("map");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
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
            this.setCurrentAnim(this.isActive ? "active" : "inactive")
        },
        setActive: function(a) {
            if (a != this.isActive)(this.isActive = a) ? this.setCurrentAnim("activate", true, "active") : this.setCurrentAnim("deactivate", true, "inactive")
        }
    })
});
ig.baked = !0;
