/**
 * game.feature.puzzle.components.push-pullable
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.components.push-pullable")`.
 *
 * `sc.PushPullable`: the shared logic for push/pull blocks. Attached to a
 * block entity (`sc.PushPullBlock`, `sc.WavePushPullBlock`), it handles the
 * player grip (push/pull dragging in 4-pixel steps), interaction icons,
 * locking into `PushPullDest`s, magnet interplay, falling into holes
 * (resetPos), and navigation blocking.
 */
ig.module("game.feature.puzzle.components.push-pullable")
    .requires("impact.base.entity", "game.feature.interact.map-interact")
    .defines(function () {

    var scratchVec2 = Vec2.create(),
        moveVec = Vec2.create(),
        alignedPos = Vec3.create(),
        traceResult = {};

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

        init: function (entity) {
            this.entity = entity;
            this.startPos = Vec3.create(this.entity.coll.pos);
            this.active = false;
            this.interactEntry = new sc.MapInteractEntry(entity, this, this.interactIcons.horizontal, sc.INTERACT_Z_CONDITION.SAME_Z, false);
            this.rumbleHandle = new ig.Rumble.RumbleHandle("RANDOM", "WEAKEST", "FAST", -1, 0, null);
            this.interactEntry.setOffset(0, -8);
            this.navBlocker = ig.navigation.getNavBlock(this.entity)
        },

        setActive: function (active) {
            (this.active = active) ? sc.mapInteract.addEntry(this.interactEntry) : sc.mapInteract.removeEntry(this.interactEntry)
        },

        isActive: function () {
            return this.active
        },

        onInteraction: function () {
            if (this.dragState == 0) {
                var player = ig.game.playerEntity;
                player.interactObject = this;
                this.gripCancelTimer = 0;
                var gripAction = this.getMovePlayerToPushableInteractibleEntityBoxThingeeAndSetGripDir();
                player.setAction(gripAction, true)
            }
        },

        onInteractionEnd: function () {
            if (this.gripDir) this.deferredRelease = true
        },

        isInteractionBlocked: function () {
            if (this.gripDir) return false;
            var player = ig.game.playerEntity,
                face = this.getGripPosAndFace(alignedPos),
                playerCenter = player.getCenter(scratchVec2),
                delta = Vec2.sub(alignedPos, playerCenter),
                trace = ig.game.physics.initTraceResult(traceResult);
            return this.entity.pushPullDirection == sc.PUSH_PULL_DIRECTION.LEFT_RIGHT && (face == "NORTH" || face == "SOUTH") || this.entity.pushPullDirection == sc.PUSH_PULL_DIRECTION.UP_DOWN && (face == "WEST" || face == "EAST") ? true : ig.game.traceEntity(trace, player, delta.x, delta.y, 0, 0, ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.VIRTUAL)
        },

        resetPos: function (pos, silent) {
            if (this.active && !this.gripDir) {
                if (pos) {
                    Vec3.assign(this.startPos, pos);
                    this.startPos.x = this.startPos.x - this.entity.coll.size.x / 2;
                    this.startPos.y = this.startPos.y - this.entity.coll.size.y / 2
                }
                if (!Vec3.equal(this.entity.coll.pos, this.startPos)) {
                    if (!silent) {
                        var aligned = this.entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, alignedPos);
                        ig.game.effects.death.spawnFixed("hole_fall", aligned.x, aligned.y, aligned.z)
                    }
                    this.entity.setPos(this.startPos.x, this.startPos.y, this.startPos.z);
                    Vec3.assignC(this.entity.coll.vel, 0, 0, 0);
                    if (!silent) {
                        this.entity.animState.alpha = 0;
                        ig.game.effects.teleport.spawnOnTarget("showQuick", this.entity)
                    }
                    var onTopEntities = ig.game.getEntitiesOnTop(this.entity);
                    for (var i = onTopEntities.length; i--;) {
                        var entity = onTopEntities[i];
                        if (entity.isPlayer) entity.quickFall(ig.TERRAIN.HOLE);
                        else {
                            var groundOffset = entity.coll._collData.groundEntryOffset;
                            entity.setPos(this.startPos.x + groundOffset.x, this.startPos.y + groundOffset.y, this.startPos.z + this.entity.coll.size.z);
                            entity.coll.setGroundEntry(null);
                            if (!silent) {
                                if (entity.animState) entity.animState.alpha = 0;
                                ig.game.effects.teleport.spawnOnTarget("showQuick", entity)
                            }
                        }
                    }
                }
            }
        },

        onUpdate: function () {
            if (this.magnetJustEnded) {
                this.magnetJustEnded--;
                this.magnetJustEnded == 0 && this.checkLockIn()
            }
            var coll = this.entity.coll;
            if (this.active) {
                var terrain = 0;
                coll.pos.z == coll.baseZPos && !this.magnetJustEnded && (terrain = ig.terrain.getTerrain(this.entity.coll, false));
                (coll.pos.z < ig.game.minLevelZ || ig.terrain.isFallTerrain(terrain)) && this.resetPos()
            }
            var player = ig.game.playerEntity,
                oldDragState = this.dragState;
            if (this.dragState == 2 || this.dragState == 3 || this.dragState == 4) {
                var move = Vec2.assign(moveVec, this.targetPos),
                    collPos = this.entity.coll.pos;
                Vec2.sub(moveVec, collPos);
                var speed = this.dragSpeed;
                this.dustTimer = this.dustTimer + ig.system.tick;
                if (this.speedTimer < 0.3) {
                    this.speedTimer = this.speedTimer + ig.system.tick;
                    speed = speed * (this.speedTimer / 0.3).limit(0, 1)
                }
                speed = ig.system.tick * speed;
                if (Vec2.length(move) > speed) {
                    Vec2.length(move, speed);
                    this.entity.setPos(collPos.x + move.x, collPos.y + move.y)
                } else {
                    this.entity.setPos(this.targetPos.x, this.targetPos.y);
                    this.navBlocker && this.navBlocker.update();
                    if (this.dragState == 4) {
                        (move = ig.EntityTools.getGroundEntity(this.entity)) && move.onPushPullablePlaced(this.entity);
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
                if (player.hasAction()) {
                    this.dragState = 0;
                    this.gripCancelTimer = this.gripCancelTimer + ig.system.tick;
                    if (this.gripCancelTimer > 0.3) {
                        player.cancelAction();
                        this.cancelGrip();
                        this.deferredRelease = false
                    }
                    this.stopSound();
                    return
                }
                coll = this.entity.coll;
                if (coll.pos.z != coll.baseZPos || player.coll.pos.z - player.coll.baseZPos > ig.COLLISION.HEIGHT_TOLERATE || this.deferredRelease) {
                    this.deferredRelease = false;
                    this.dragState = 0;
                    this.cancelGrip();
                    this.stopSound();
                    return
                }
                if (this.dragState == 0) {
                    this.dragState = 1;
                    Vec2.assign(this.coordDelta, player.coll.pos);
                    Vec2.sub(this.coordDelta, this.entity.coll.pos)
                }
                move = moveVec;
                sc.control.moveDir(move, 1);
                Vec2.assign(scratchVec2, this.entity.coll.pos);
                Vec2.add(scratchVec2, this.coordDelta);
                player.setPos(scratchVec2.x, scratchVec2.y, this.entity.coll.pos.z);
                if ((this.gripDir == "EAST" || this.gripDir == "WEST") && move.x) this.moveBox(move.x < 0 ? -4 : 4, 0);
                else if ((this.gripDir == "NORTH" || this.gripDir == "SOUTH") && move.y) this.moveBox(0, move.y < 0 ? -4 : 4)
            }
            if (this.dragState && this.gripDir) {
                Vec2.assign(scratchVec2, this.entity.coll.pos);
                Vec2.add(scratchVec2, this.coordDelta);
                player.setPos(scratchVec2.x, scratchVec2.y);
                player.coll.ignoreCollision = true;
                coll.groundSlip = true;
                player.animationFixed = true;
                this.dragState == 1 ? player.setCurrentAnim("gripStand") : this.dragState == 2 ? player.setCurrentAnim("gripPull") : this.dragState == 3 && player.setCurrentAnim("gripPush")
            }
            if (this.dragState != oldDragState) this.speedTimer = this.dustTimer = 0;
            (this.dragState == 0 || this.dragState == 1) && this.stopSound()
        },

        checkLockIn: function () {
            var ground = ig.EntityTools.getGroundEntity(this.entity);
            if (ground && ground.onPushPullableDetect && ground.onPushPullableDetect(this.entity, alignedPos)) {
                Vec2.assign(this.targetPos, alignedPos);
                this.setActive(false);
                this.gripDir && this.cancelGrip();
                this.dragState = 4
            }
        },

        onKill: function () {
            this.navBlocker && this.navBlocker.remove()
        },

        onDeferredUpdate: function () {
            var player = ig.game.playerEntity;
            this.dragState && this.gripDir && player.setPos(void 0, void 0, this.entity.coll.pos.z)
        },

        updateStateFromIdle: function () {},

        stopSound: function () {
            if (this.soundHandle) {
                this.soundHandle.stop();
                this.soundHandle = null
            }
        },

        cancelGrip: function () {
            var player = ig.game.playerEntity;
            player.coll.ignoreCollision = false;
            player.coll.pos.z - player.coll.baseZPos <= 1 && player.setPos(void 0, void 0, player.coll.baseZPos);
            player.animationFixed = false;
            this.entity.coll.groundSlip = false;
            player.cancelInteract();
            this.gripDir = null;
            sc.party.keepDistance = false
        },

        onInteractObjectDrop: function () {
            this.cancelGrip()
        },

        getGripPosAndFace: function (out) {
            var player = ig.game.playerEntity;
            this.entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, out);
            var distVec = player.getCenter(scratchVec2);
            distVec = Vec2.sub(distVec, out);
            if (Math.abs(distVec.x) > Math.abs(distVec.y)) {
                var halfSize = this.entity.coll.size.x / 2 + player.coll.size.x / 2;
                if (distVec.x < 0) {
                    out.x = out.x - halfSize;
                    out = "EAST"
                } else {
                    out.x = out.x + halfSize;
                    out = "WEST"
                }
            } else {
                halfSize = this.entity.coll.size.y / 2 + player.coll.size.y / 2;
                if (distVec.y < 0) {
                    out.y = out.y - halfSize;
                    out = "SOUTH"
                } else {
                    out.y = out.y + halfSize;
                    out = "NORTH"
                }
            }
            return out
        },

        getMovePlayerToPushableInteractibleEntityBoxThingeeAndSetGripDir: function () {
            var gripPos = Vec3.create(),
                face = this.getGripPosAndFace(gripPos);
            face == "WEST" || face == "EAST" ? this.interactEntry.setIcon(this.interactIcons.horizontal) : this.interactEntry.setIcon(this.interactIcons.vertical);
            this.gripDir = face;
            sc.party.keepDistance = true;
            this.dustTimer = this.speedTimer = 0;
            return new ig.Action("gripStart", [{
                type: "MOVE_TO_POINT",
                target: gripPos,
                precise: false
            }, {
                type: "SET_FACE",
                face: face
            }, {
                type: "SHOW_ANIMATION",
                anim: "gripStand"
            }, {
                type: "ALIGN_PUSH_PULL_POS",
                component: this,
                duration: 0.05
            }])
        },

        moveBox: function (dx, dy) {
            var player = ig.game.playerEntity,
                isPushingAway;
            dx ? isPushingAway = this.gripDir == "EAST" && dx < 0 || this.gripDir == "WEST" && dx > 0 : dy && (isPushingAway = this.gripDir == "NORTH" && dy > 0 || this.gripDir == "SOUTH" && dy < 0);
            var trace = ig.game.physics.initTraceResult(traceResult);
            if (!ig.game.traceEntity(trace, this.entity, dx, dy, 0, 0, 1, ig.COLLTYPE.BLOCK, null, player) && (!isPushingAway || !ig.game.traceEntity(trace, player, dx, dy, 0, 0, ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.BLOCK, null, player))) {
                if (!this.soundHandle) this.soundHandle = sc.PushPullSounds.Loop.play(true);
                this.entity.setCurrentAnim(dx ? "moveH" : "moveV");
                if (this.dustTimer >= 0.13) {
                    this.dustTimer = this.dustTimer - 0.13;
                    var dustFx;
                    dx ? dustFx = dx > 0 ? "boxMediumEast" : "boxMediumWest" : dy && (dustFx = dy > 0 ? "boxMediumSouth" : "boxMediumNorth");
                    ig.game.effects.dust.spawnOnTarget(dustFx, this.entity)
                }
                this.dragState = isPushingAway ? 2 : 3;
                Vec2.assign(this.targetPos, this.entity.coll.pos);
                Vec2.addC(this.targetPos, dx, dy);
                this.targetPos.x = Math.round(this.targetPos.x / 4) * 4;
                this.targetPos.y = Math.round(this.targetPos.y / 4) * 4
            }
        },

        onMagnetEnd: function () {
            this.magnetJustEnded = 2;
            if (this.entity.coll._collData) this.entity.coll._collData.zBaseUncertain = true;
            this.entity.coll.setType(ig.COLLTYPE.BLOCK);
            this.setActive(true);
            this.checkLockIn()
        }
    })
});
ig.baked = !0;