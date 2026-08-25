ig.module("game.feature.puzzle.components.push-pullable").requires("impact.base.entity", "game.feature.interact.map-interact").defines(function() {
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec3.create(),
        c = {};
    sc.PUSH_PULL_DIRECTION = {
        ALL: 0,
        LEFT_RIGHT: 1,
        UP_DOWN: 2
    };
    sc.PushPullSounds = {};
    sc.PushPullSounds.Start = new ig.Sound("media/sound/puzzle/push-start.ogg", 1);
    sc.PushPullSounds.Loop = new ig.Sound("media/sound/puzzle/push-loop.ogg", 1);
    sc.PushPullable = ig.Class.extend({
        entity: null,
        active: false,
        gripDir: null,
        deferredRelease: false,
        interactEntry: null,
        interactIcons: {
            vertical: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [40, 41, 42, 41],
                NEAR: [43],
                RUNNING: [46, 47]
            }, 0.2),
            horizontal: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [40, 41, 42, 41],
                NEAR: [43],
                RUNNING: [44, 45]
            }, 0.2)
        },
        coordDelta: Vec2.create(),
        targetPos: Vec2.create(),
        dragState: 0,
        dragSpeed: 100,
        speedTimer: 0,
        dustTimer: 0,
        rumbleHandle: null,
        gripCancelTimer: 0,
        soundHandle: null,
        navBlocker: null,
        magnetJustEnded: 0,
        init: function(a) {
            this.entity =
                a;
            this.startPos = Vec3.create(this.entity.coll.pos);
            this.active = false;
            this.interactEntry = new sc.MapInteractEntry(a, this, this.interactIcons.horizontal, sc.INTERACT_Z_CONDITION.SAME_Z, false);
            this.rumbleHandle = new ig.Rumble.RumbleHandle("RANDOM", "WEAKEST", "FAST", -1, 0, null);
            this.interactEntry.setOffset(0, -8);
            this.navBlocker = ig.navigation.getNavBlock(this.entity)
        },
        setActive: function(a) {
            (this.active = a) ? sc.mapInteract.addEntry(this.interactEntry): sc.mapInteract.removeEntry(this.interactEntry)
        },
        isActive: function() {
            return this.active
        },
        onInteraction: function() {
            if (this.dragState == 0) {
                var a = ig.game.playerEntity;
                a.interactObject = this;
                this.gripCancelTimer = 0;
                var b = this.getMovePlayerToPushableInteractibleEntityBoxThingeeAndSetGripDir();
                a.setAction(b, true)
            }
        },
        onInteractionEnd: function() {
            if (this.gripDir) this.deferredRelease = true
        },
        isInteractionBlocked: function() {
            if (this.gripDir) return false;
            var a = ig.game.playerEntity,
                f = this.getGripPosAndFace(d),
                g = a.getCenter(b),
                g = Vec2.sub(d, g),
                h = ig.game.physics.initTraceResult(c);
            return this.entity.pushPullDirection ==
                sc.PUSH_PULL_DIRECTION.LEFT_RIGHT && (f == "NORTH" || f == "SOUTH") || this.entity.pushPullDirection == sc.PUSH_PULL_DIRECTION.UP_DOWN && (f == "WEST" || f == "EAST") ? true : ig.game.traceEntity(h, a, g.x, g.y, 0, 0, ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.VIRTUAL)
        },
        resetPos: function(a, b) {
            if (this.active && !this.gripDir) {
                if (a) {
                    Vec3.assign(this.startPos, a);
                    this.startPos.x = this.startPos.x - this.entity.coll.size.x / 2;
                    this.startPos.y = this.startPos.y - this.entity.coll.size.y / 2
                }
                if (!Vec3.equal(this.entity.coll.pos, this.startPos)) {
                    if (!b) {
                        var c =
                            this.entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                        ig.game.effects.death.spawnFixed("hole_fall", c.x, c.y, c.z)
                    }
                    this.entity.setPos(this.startPos.x, this.startPos.y, this.startPos.z);
                    Vec3.assignC(this.entity.coll.vel, 0, 0, 0);
                    if (!b) {
                        this.entity.animState.alpha = 0;
                        ig.game.effects.teleport.spawnOnTarget("showQuick", this.entity)
                    }
                    for (var c = ig.game.getEntitiesOnTop(this.entity), h = c.length; h--;) {
                        var i = c[h];
                        if (i.isPlayer) i.quickFall(ig.TERRAIN.HOLE);
                        else {
                            var j = i.coll._collData.groundEntryOffset;
                            i.setPos(this.startPos.x +
                                j.x, this.startPos.y + j.y, this.startPos.z + this.entity.coll.size.z);
                            i.coll.setGroundEntry(null);
                            if (!b) {
                                if (i.animState) i.animState.alpha = 0;
                                ig.game.effects.teleport.spawnOnTarget("showQuick", i)
                            }
                        }
                    }
                }
            }
        },
        onUpdate: function() {
            if (this.magnetJustEnded) {
                this.magnetJustEnded--;
                this.magnetJustEnded == 0 && this.checkLockIn()
            }
            var c = this.entity.coll;
            if (this.active) {
                var d = 0;
                c.pos.z == c.baseZPos && !this.magnetJustEnded && (d = ig.terrain.getTerrain(this.entity.coll, false));
                (c.pos.z < ig.game.minLevelZ || ig.terrain.isFallTerrain(d)) &&
                this.resetPos()
            }
            var d = ig.game.playerEntity,
                g = this.dragState;
            if (this.dragState == 2 || this.dragState == 3 || this.dragState == 4) {
                var h = Vec2.assign(a, this.targetPos),
                    i = this.entity.coll.pos;
                Vec2.sub(a, i);
                var j = this.dragSpeed;
                this.dustTimer = this.dustTimer + ig.system.tick;
                if (this.speedTimer < 0.3) {
                    this.speedTimer = this.speedTimer + ig.system.tick;
                    j = j * (this.speedTimer / 0.3).limit(0, 1)
                }
                j = ig.system.tick * j;
                if (Vec2.length(h) > j) {
                    Vec2.length(h, j);
                    this.entity.setPos(i.x + h.x, i.y + h.y)
                } else {
                    this.entity.setPos(this.targetPos.x,
                        this.targetPos.y);
                    this.navBlocker && this.navBlocker.update();
                    if (this.dragState == 4) {
                        (h = ig.EntityTools.getGroundEntity(this.entity)) && h.onPushPullablePlaced(this.entity);
                        this.dragState = 0
                    } else {
                        this.dragState = this.gripDir ? 1 : 0;
                        this.entity.setCurrentAnim("default");
                        this.checkLockIn()
                    }
                }
            }
            if (this.active && (this.dragState == 0 || this.dragState == 1)) {
                if (!this.gripDir) {
                    this.dragState = 0;
                    this.stopSound();
                    return
                }
                if (d.hasAction()) {
                    this.dragState = 0;
                    this.gripCancelTimer = this.gripCancelTimer + ig.system.tick;
                    if (this.gripCancelTimer >
                        0.3) {
                        d.cancelAction();
                        this.cancelGrip();
                        this.deferredRelease = false
                    }
                    this.stopSound();
                    return
                }
                c = this.entity.coll;
                if (c.pos.z != c.baseZPos || d.coll.pos.z - d.coll.baseZPos > ig.COLLISION.HEIGHT_TOLERATE || this.deferredRelease) {
                    this.deferredRelease = false;
                    this.dragState = 0;
                    this.cancelGrip();
                    this.stopSound();
                    return
                }
                if (this.dragState == 0) {
                    this.dragState = 1;
                    Vec2.assign(this.coordDelta, d.coll.pos);
                    Vec2.sub(this.coordDelta, this.entity.coll.pos)
                }
                h = a;
                sc.control.moveDir(h, 1);
                Vec2.assign(b, this.entity.coll.pos);
                Vec2.add(b,
                    this.coordDelta);
                d.setPos(b.x, b.y, this.entity.coll.pos.z);
                if ((this.gripDir == "EAST" || this.gripDir == "WEST") && h.x) this.moveBox(h.x < 0 ? -4 : 4, 0);
                else if ((this.gripDir == "NORTH" || this.gripDir == "SOUTH") && h.y) this.moveBox(0, h.y < 0 ? -4 : 4)
            }
            if (this.dragState && this.gripDir) {
                Vec2.assign(b, this.entity.coll.pos);
                Vec2.add(b, this.coordDelta);
                d.setPos(b.x, b.y);
                d.coll.ignoreCollision = true;
                c.groundSlip = true;
                d.animationFixed = true;
                this.dragState == 1 ? d.setCurrentAnim("gripStand") : this.dragState == 2 ? d.setCurrentAnim("gripPull") :
                    this.dragState == 3 && d.setCurrentAnim("gripPush")
            }
            if (this.dragState != g) this.speedTimer = this.dustTimer = 0;
            (this.dragState == 0 || this.dragState == 1) && this.stopSound()
        },
        checkLockIn: function() {
            var a = ig.EntityTools.getGroundEntity(this.entity);
            if (a && a.onPushPullableDetect && a.onPushPullableDetect(this.entity, d)) {
                Vec2.assign(this.targetPos, d);
                this.setActive(false);
                this.gripDir && this.cancelGrip();
                this.dragState = 4
            }
        },
        onKill: function() {
            this.navBlocker && this.navBlocker.remove()
        },
        onDeferredUpdate: function() {
            var a = ig.game.playerEntity;
            this.dragState && this.gripDir && a.setPos(void 0, void 0, this.entity.coll.pos.z)
        },
        updateStateFromIdle: function() {},
        stopSound: function() {
            if (this.soundHandle) {
                this.soundHandle.stop();
                this.soundHandle = null
            }
        },
        cancelGrip: function() {
            var a = ig.game.playerEntity;
            a.coll.ignoreCollision = false;
            a.coll.pos.z - a.coll.baseZPos <= 1 && a.setPos(void 0, void 0, a.coll.baseZPos);
            a.animationFixed = false;
            this.entity.coll.groundSlip = false;
            a.cancelInteract();
            this.gripDir = null;
            sc.party.keepDistance = false
        },
        onInteractObjectDrop: function() {
            this.cancelGrip()
        },
        getGripPosAndFace: function(a) {
            var c = ig.game.playerEntity;
            this.entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
            var d = c.getCenter(b),
                d = Vec2.sub(d, a);
            if (Math.abs(d.x) > Math.abs(d.y)) {
                c = this.entity.coll.size.x / 2 + c.coll.size.x / 2;
                if (d.x < 0) {
                    a.x = a.x - c;
                    a = "EAST"
                } else {
                    a.x = a.x + c;
                    a = "WEST"
                }
            } else {
                c = this.entity.coll.size.y / 2 + c.coll.size.y / 2;
                if (d.y < 0) {
                    a.y = a.y - c;
                    a = "SOUTH"
                } else {
                    a.y = a.y + c;
                    a = "NORTH"
                }
            }
            return a
        },
        getMovePlayerToPushableInteractibleEntityBoxThingeeAndSetGripDir: function() {
            var a = Vec3.create(),
                b = this.getGripPosAndFace(a);
            b == "WEST" || b == "EAST" ? this.interactEntry.setIcon(this.interactIcons.horizontal) : this.interactEntry.setIcon(this.interactIcons.vertical);
            this.gripDir = b;
            sc.party.keepDistance = true;
            this.dustTimer = this.speedTimer = 0;
            return new ig.Action("gripStart", [{
                type: "MOVE_TO_POINT",
                target: a,
                precise: false
            }, {
                type: "SET_FACE",
                face: b
            }, {
                type: "SHOW_ANIMATION",
                anim: "gripStand"
            }, {
                type: "ALIGN_PUSH_PULL_POS",
                component: this,
                duration: 0.05
            }])
        },
        moveBox: function(a, b) {
            var d = ig.game.playerEntity,
                h;
            a ? h = this.gripDir == "EAST" && a < 0 || this.gripDir ==
                "WEST" && a > 0 : b && (h = this.gripDir == "NORTH" && b > 0 || this.gripDir == "SOUTH" && b < 0);
            var i = ig.game.physics.initTraceResult(c);
            if (!ig.game.traceEntity(i, this.entity, a, b, 0, 0, 1, ig.COLLTYPE.BLOCK, null, d) && (!h || !ig.game.traceEntity(i, d, a, b, 0, 0, ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.BLOCK, null, d))) {
                if (!this.soundHandle) this.soundHandle = sc.PushPullSounds.Loop.play(true);
                this.entity.setCurrentAnim(a ? "moveH" : "moveV");
                if (this.dustTimer >= 0.13) {
                    this.dustTimer = this.dustTimer - 0.13;
                    var j;
                    a ? j = a > 0 ? "boxMediumEast" : "boxMediumWest" :
                        b && (j = b > 0 ? "boxMediumSouth" : "boxMediumNorth");
                    ig.game.effects.dust.spawnOnTarget(j, this.entity)
                }
                this.dragState = h ? 2 : 3;
                Vec2.assign(this.targetPos, this.entity.coll.pos);
                Vec2.addC(this.targetPos, a, b);
                this.targetPos.x = Math.round(this.targetPos.x / 4) * 4;
                this.targetPos.y = Math.round(this.targetPos.y / 4) * 4
            }
        },
        onMagnetEnd: function() {
            this.magnetJustEnded = 2;
            if (this.entity.coll._collData) this.entity.coll._collData.zBaseUncertain = true;
            this.entity.coll.setType(ig.COLLTYPE.BLOCK);
            this.setActive(true);
            this.checkLockIn()
        }
    })
});
ig.baked = !0;
