/*
 * impact.base.physics
 * -------------------
 * `ig.Physics` — the collision/physics solver: the spatial hash of
 * `ig.CollEntry` objects, per-frame movement (XY + Z), ground/hole/ceiling
 * detection, entity-vs-entity collision tracing, and push forces.
 *
 * Original: deobf/extract/impact.base.physics.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.physics").requires("impact.base.entity", "impact.base.coll-entry").defines(function () {
    /** Set a coll entry's Z position and update its level index. */
    function setPosZ(coll, z) {
        coll.pos.z = z;
        coll.level = ig.game.getLevelIdx(coll.pos.z);
    }

    var scratchVecA = Vec2.create();
    var scratchVecB = Vec2.create();
    var scratchVecC = Vec2.create();
    var traceTemplateA = {};
    var traceTemplateB = {};
    var forcePushEntries = [];
    var forcePushDirs = [];
    Vec2.create(); // (allocated but unused in the original)
    var scratchVecD = Vec2.create();

    ig.Physics = ig.Class.extend({
        cellSize: 64,
        collUpdateList: [],
        collOutOfScreenList: [],
        collEntryMap: [],
        _updateCount: 0,
        _trackEntityTouch: false,

        mapCleared: function () {
            this.collEntryMap.length = 0;
            this.collUpdateList.length = 0;
        },

        mapLoaded: function () {
            var mapHeight = ig.game.size.y;
            this.collEntryMap.width = Math.ceil(ig.game.size.x / this.cellSize);
            this.collEntryMap.height = Math.ceil(mapHeight / this.cellSize) + 16;
            for (mapHeight = 0; mapHeight < this.collEntryMap.width; ++mapHeight) {
                this.collEntryMap[mapHeight] = [];
                for (var y = 0; y < this.collEntryMap.height; ++y) this.collEntryMap[mapHeight][y] = [];
            }
            this.collUpdateList.length = 0;
        },

        update: function () {
            this._updateCount = this._updateCount % 100;
            this._updateCount++;
            var collided = [];
            // Promote out-of-screen entries back into the active update list.
            for (var i = this.collOutOfScreenList.length; i--;) {
                var coll = this.collOutOfScreenList[i];
                if (coll.updateType == ig.COLL_UPDATE_TYPE.STATIC) {
                    this.collOutOfScreenList.splice(i, 1);
                } else if (coll.updateType == ig.COLL_UPDATE_TYPE.DYNAMIC || (coll.updateType == ig.COLL_UPDATE_TYPE.ON_SCREEN && ig.CollTools.isInScreen(coll, 16))) {
                    this.collOutOfScreenList.splice(i, 1);
                    this.collUpdateList.push(coll);
                }
            }
            for (i = this.collUpdateList.length; i--;) {
                coll = this.collUpdateList[i];
                this.updateCollEntry(coll, collided);
                if (coll.updateType == ig.COLL_UPDATE_TYPE.STATIC) {
                    this.collUpdateList.splice(i, 1);
                } else if (coll.updateType == ig.COLL_UPDATE_TYPE.ON_SCREEN && !ig.CollTools.isInScreen(coll, 16)) {
                    this.collUpdateList.splice(i, 1);
                    this.collOutOfScreenList.push(coll);
                }
            }
            // Resolve the collisions collected during movement.
            for (i = collided.length; i--;) {
                var collEntry = collided[i];
                for (var j = collEntry._collisionList.length; j--;) {
                    var otherEntry = collEntry._collisionList[j];
                    var collisionData = collEntry._collisionListData[j];
                    if (!collEntry._killed && !otherEntry._killed) {
                        if (collEntry.weight >= 0 && collisionData && collisionData.dot) {
                            var pushFactor = otherEntry.weight == -1 || collEntry.weight == 0 ? 1 : Math.min(1, otherEntry.weight / collEntry.weight * 0.5);
                            collEntry.pushVel.x = collisionData.x * collisionData.dot / ig.system.actualTick * pushFactor;
                            collEntry.pushVel.y = collisionData.y * collisionData.dot / ig.system.actualTick * pushFactor;
                            otherEntry._collData.pushColl = collEntry;
                        }
                        collEntry.entity.collideWith(otherEntry.entity, collisionData || null);
                    }
                }
                collEntry._collisionList.length = 0;
                collEntry._collisionListData.length = 0;
            }
            ig.system.ingameTick = ig.system.tick;
            collided = this.collUpdateList;
            for (i = 0; i < collided.length; i++) {
                var entry = collided[i];
                if ((coll = entry.entity)) {
                    if ((entry = entry._collData)) {
                        ig.system.tick = coll.coll.getTick(false);
                        coll.handleMovementTrace(entry);
                    }
                }
            }
            ig.system.tick = ig.system.ingameTick;
        },

        updateCollEntry: function (coll, collided) {
            if (coll._active && coll.updated != this._updateCount) {
                coll.updated = this._updateCount;
                ig.profile.updateEntity++;
                if (!coll._killed) {
                    ig.vars.pushEntityAccessor(coll.entity);
                    coll.parentColl && this.updateCollEntry(coll.parentColl, collided);
                    coll._collData && coll._collData.groundEntry && this.updateCollEntry(coll._collData.groundEntry, collided);
                    if (coll._collData && coll._collData.pushColl) {
                        this.updateCollEntry(coll._collData.pushColl, collided);
                        coll._collData.pushColl = null;
                    }
                    ig.system.ingameTick = ig.system.tick;
                    var logicTick = coll.getTick(false);
                    var moveTick = coll.getTick(false, true);
                    var entity = coll.entity;
                    var animTick = 0;
                    entity.animState && entity.animState.hasAnimations() && (animTick = coll.getTick(true));
                    if (logicTick || moveTick || animTick) {
                        ig.system.tick = logicTick;
                        entity.update();
                        ig.system.tick = moveTick;
                        this.moveEntity(coll, collided);
                    }
                    if (animTick) {
                        ig.system.tick = animTick;
                        entity.animState.update(entity, entity.animSpeedFactor);
                    }
                    ig.system.tick = ig.system.ingameTick;
                    ig.vars.popEntityAccessor(coll.entity);
                }
            }
        },

        getEntitiesInRectangle: function (x, y, z, sizeX, sizeY, sizeZ, ignore, ignoreList, checkZ) {
            var x0 = Math.floor(x / this.cellSize).limit(0, this.collEntryMap.width);
            var y0 = Math.floor(y / this.cellSize).limit(0, this.collEntryMap.height);
            var x1 = (Math.floor((x + sizeX) / this.cellSize) + 1).limit(0, this.collEntryMap.width);
            var y1 = (Math.floor((y + sizeY) / this.cellSize) + 1).limit(0, this.collEntryMap.height);
            var result = [];
            if (!this.collEntryMap.length) return result;
            for (; x0 < x1; x0++) {
                for (var gy = y0; gy < y1; gy++) {
                    for (var cell = this.collEntryMap[x0][gy], n = cell.length; n--;) {
                        var entry = cell[n];
                        var entity = entry.entity;
                        if (!(entry.subColls.length > 0)) {
                            var parentEntity = entry.parentColl && entry.parentColl.entity;
                            entity && (!ignore || entity != ignore) && (!ignoreList || ignoreList.indexOf(entity) == -1) && (!parentEntity || ((!parentEntity || parentEntity != ignore) && (!ignoreList || ignoreList.indexOf(parentEntity) == -1))) && result.indexOf(entity) == -1 && entry.intersectsWith(x, y, z, sizeX, sizeY, sizeZ, false, null, checkZ) && result.push(entity);
                        }
                    }
                }
            }
            return result;
        },

        getEntitiesInCircle: function (x, y, ratio, sizeZ, ignore, angleStart, angleEnd, ignoreCollType, maxCount, sortByDistance, checkOverlap, checkBlocked) {
            Vec2.assign(scratchVecC, x);
            var candidates = this.getEntitiesInRectangle(x.x - ratio, x.y - ratio * y, x.z, ratio * 2, ratio * y * 2, sizeZ, maxCount, ignoreCollType);
            var result = [];
            var minZ = x.z;
            var maxZ = x.z + sizeZ;
            for (var i = candidates.length; i--;) {
                var entity = candidates[i];
                var coll = entity.coll;
                if (!(coll.pos.z >= maxZ || coll.pos.z + coll.size.z <= minZ)) {
                    Vec2.assign(scratchVecC, coll.pos);
                    // Clamp the entry's center point toward the circle center.
                    scratchVecC.x = coll.pos.x - coll.padding.x <= x.x && coll.pos.x + coll.padding.x + coll.size.x >= x.x ? x.x : coll.pos.x + coll.padding.x + coll.size.x < x.x ? coll.pos.x + (coll.size.x + coll.padding.x) : coll.pos.x - coll.padding.x;
                    if (scratchVecC.y - coll.padding.y <= x.y && scratchVecC.y + coll.padding.y + coll.size.y >= x.y) {
                        scratchVecC.y = x.y;
                    } else if (scratchVecC.y + coll.padding.y + coll.size.y < x.y) {
                        scratchVecC.y = scratchVecC.y + (coll.padding.y + coll.size.y);
                    }
                    Vec2.sub(scratchVecC, x);
                    scratchVecC.y = scratchVecC.y / y;
                    var dist = Vec2.length(scratchVecC);
                    if (sortByDistance || !(dist > ratio)) {
                        scratchVecC.y = scratchVecC.y * y;
                        if (!ignore || Vec2.isAngleInRange(scratchVecC, ignore, angleStart, angleEnd)) {
                            if (checkBlocked) {
                                var traceResult = ig.game.physics.initTraceResult(traceTemplateA);
                                if (coll.padding.x || coll.padding.y) {
                                    if (scratchVecC.x) scratchVecC.x = scratchVecC.x + (scratchVecC.x > 0 ? 1 : -1) * coll.padding.x;
                                    if (scratchVecC.y) scratchVecC.y = scratchVecC.y + (scratchVecC.y > 0 ? 1 : -1) * coll.padding.y;
                                    dist = Vec2.length(scratchVecC);
                                }
                                this.trace(traceResult, x.x - 1, x.y - 1, Math.max(x.z, coll.pos.z), scratchVecC.x, scratchVecC.y, 2, 2, 2, ig.COLLTYPE.IGNORE, coll);
                                if (dist * (1 - traceResult.dist) > 8) continue;
                            }
                            result.push(entity);
                        }
                    }
                }
            }
            return result;
        },

        initTraceResult: function (result) {
            if (!result.dir) result.dir = Vec2.create();
            Vec2.assignC(result.dir, 0, 0);
            result.dist = 1;
            result.levelUp = false;
            result.forcePushEntries = null;
            result.forcePushDirs = null;
            return result;
        },

        trace: function (result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, collType, entity, traceResultType, extra) {
            var game = ig.game;
            var level = game.maxLevel - 1;
            for (; level && game.levels[level].height > z;) --level;
            var crossesLevelUp = level + 1 < game.maxLevel && z + sizeZ > game.levels[level + 1].height;
            var forceMove = entity && entity._collData && entity._collData.forceMoveFrameVel;
            var steps = Math.max(1, Math.ceil(Math.max(Math.abs(velX), Math.abs(velY)) / 16));
            var isTrigger = entity && entity.type == ig.COLLTYPE.TRIGGER;
            var stepCount = steps;
            velX = velX / steps;
            velY = velY / steps;
            var collided = false;
            var levelUpPending = extra && crossesLevelUp && game.levels[level + 1].height - z <= ig.COLLISION.HEIGHT_TOLERATE;
            for (stepCount = 0; stepCount < steps; stepCount++) {
                var levelUpDist = -1;
                if (!forceMove && !isTrigger) {
                    if (!result.levelUp) {
                        if ((collided = game.levels[level].collision.trace(result, x, y - game.levels[level].height, velX, velY, sizeX, sizeY, true)) && levelUpPending) {
                            collided = false;
                            levelUpDist = result.dist;
                            result.dist = 1;
                        }
                    }
                    crossesLevelUp && (collided = game.levels[level + 1].collision.trace(result, x, y - game.levels[level + 1].height, velX, velY, sizeX, sizeY, true, levelUpDist == -1) || collided);
                }
                collided = this.traceOnEntryMap(result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, collType, entity, traceResultType, extra) || collided;
                if (levelUpDist != -1) result.levelUp = result.levelUp || result.dist > levelUpDist;
                if (collided) {
                    result.dist = (stepCount + result.dist) / steps;
                    return true;
                }
                result.dist = 1;
                x = x + velX;
                y = y + velY;
            }
            result.dist = 1;
            return false;
        },

        addCollEntry: function (coll) {
            coll._active = true;
            this.addToUpdateList(coll);
            this.addToCollMap(coll);
        },

        removeCollEntry: function (coll) {
            coll._active = false;
            this.removeFromUpdateList(coll);
            this.removeFromCollMap(coll);
        },

        addToUpdateList: function (coll) {
            this.collUpdateList.push(coll);
        },

        removeFromUpdateList: function (coll) {
            this.collUpdateList.erase(coll);
        },

        addToCollMap: function (coll) {
            if (!coll._inCollisionMap && !(coll.type == ig.COLLTYPE.NONE || coll.type == ig.COLLTYPE.PASSIVE)) {
                coll._inCollisionMap = true;
                for (var x0 = Math.max(0, Math.floor((coll.pos.x - coll.padding.x * 2) / this.cellSize)), y0 = Math.max(0, Math.floor((coll.pos.y - coll.padding.y * 2) / this.cellSize)), x1 = Math.min(this.collEntryMap.width, Math.floor((coll.pos.x + coll.size.x + coll.padding.x * 2) / this.cellSize) + 1), y1 = Math.min(this.collEntryMap.height, Math.floor((coll.pos.y + coll.size.y + coll.padding.y * 2) / this.cellSize) + 1); x1-- > x0;) {
                    for (var gy = y1; gy-- > y0;) this.collEntryMap[x1][gy].indexOf(coll) == -1 && this.collEntryMap[x1][gy].push(coll);
                }
            }
        },

        removeFromCollMap: function (coll) {
            if (coll._inCollisionMap) {
                coll._inCollisionMap = false;
                for (var x0 = Math.max(0, Math.floor((coll.pos.x - coll.padding.x * 2) / this.cellSize)), y0 = Math.max(0, Math.floor((coll.pos.y - coll.padding.y * 2) / this.cellSize)), x1 = Math.min(this.collEntryMap.width, Math.floor((coll.pos.x + coll.size.x + coll.padding.x * 2) / this.cellSize) + 1), y1 = Math.min(this.collEntryMap.height, Math.floor((coll.pos.y + coll.size.y + coll.padding.y * 2) / this.cellSize) + 1); x1-- > x0;) {
                    for (var gy = y1; gy-- > y0;) {
                        var idx = this.collEntryMap[x1][gy].indexOf(coll);
                        idx != -1 && this.collEntryMap[x1][gy].splice(idx, 1);
                    }
                }
            }
        },

        moveEntity: function (coll, collided) {
            var noGravity = !coll.type && !coll.shadow && !coll.zGravityFactor;
            ig.profile.moveEntity++;
            var collData = coll.initCollData();
            var data = coll._collData;
            data.collided = false;
            data.slipped = false;
            if (data.skipPhysics) {
                data.skipPhysics = false;
                Vec2.assignC(scratchVecD, 0, 0);
                var wasGrounded = Math.abs(coll.pos.z - coll.baseZPos) < ig.COLLISION.EPS;
                this.updateGroundEntity(coll, scratchVecD, wasGrounded, 0, false);
                data.forceMoveFrameVel = false;
            } else {
                if (ig.game.firstUpdateLoop) data.zPush = false;
                if (!data.forceMoveFrameVel) {
                    data.frameVel.x = 0;
                    data.frameVel.y = 0;
                    data.frameVel.z = 0;
                }
                var startX = coll.pos.x;
                var startY = coll.pos.y;
                var move;
                move = data.forceMoveFrameVel ? Vec2.assign(scratchVecD, data.frameVel) : Vec2.mulF(Vec2.add(coll.vel, coll.pushVel, scratchVecD), ig.system.tick);
                var moved = move.x != 0 || move.y != 0;
                if (isNaN(move.x) || isNaN(move.y)) throw Error("NaN!");
                if (!wasGrounded && !data.forceMoveFrameVel && move.x == 0 && move.y == 0 && coll.vel.z == 0 && coll.zGravityFactor == 0 && coll.shadow == 0) {
                    data.forceMoveFrameVel = false;
                } else {
                    coll.pushVel.x = 0;
                    coll.pushVel.y = 0;
                    if (data.groundEntry) {
                        var ground = data.groundEntry;
                        if (ground.heightShape && ground.pos.z + ground.size.z >= coll.pos.z && coll.vel.z <= 0) {
                            if (ground.heightShape == ig.COLL_HEIGHT_SHAPE.EAST_UP || ground.heightShape == ig.COLL_HEIGHT_SHAPE.WEST_UP) {
                                move.x = move.x / (1 + ground.size.z / ground.size.x / 2);
                                if (ground.size.z / ground.size.x > 4) coll.pushVel.x = coll.pushVel.x + 200 * (ground.heightShape == ig.COLL_HEIGHT_SHAPE.EAST_UP ? -1 : 1);
                            } else if (ground.heightShape == ig.COLL_HEIGHT_SHAPE.NORTH_UP || ground.heightShape == ig.COLL_HEIGHT_SHAPE.SOUTH_UP) {
                                move.y = move.y / (1 + ground.size.z / ground.size.y / 2);
                                if (ground.size.z / ground.size.y > 4) coll.pushVel.y = coll.pushVel.y + 200 * (ground.heightShape == ig.COLL_HEIGHT_SHAPE.SOUTH_UP ? -1 : 1);
                            }
                        }
                        if (!coll.groundSlip && !coll.float.height) {
                            if (!moved) {
                                data.groundEntryOffset.x = Math.round(data.groundEntryOffset.x);
                                data.groundEntryOffset.y = Math.round(data.groundEntryOffset.y);
                            }
                            move.x = move.x + (ground.pos.x + data.groundEntryOffset.x - startX);
                            move.y = move.y + (ground.pos.y + data.groundEntryOffset.y - startY);
                        }
                        if (ground._collData) {
                            coll.baseZPos = coll.baseZPos + ground._collData.frameVel.z;
                            var newZ = coll.pos.z + ground._collData.frameVel.z;
                            if (ground._collData.frameVel.z < 0 && data.holeInfo.mapRes != 2 && coll.level >= 0) {
                                var levelHeight = ig.game.levels[coll.level].height;
                                if (newZ < levelHeight) {
                                    newZ = levelHeight;
                                    coll.baseZPos = levelHeight;
                                }
                            }
                            data.frameVel.z = newZ - coll.pos.z;
                            setPosZ(coll, newZ);
                            data.holeInfo.entryZ = data.holeInfo.entryZ + ground._collData.frameVel.z;
                        }
                    }
                    if ((ground = data.overlapEntry) && coll.weight != -1 && ground.pos.z + ground.size.z > coll.pos.z) {
                        if (ground.parentColl) ground = ground.parentColl;
                        if (!ground.ignoreCollision) {
                            var overlapDir = ig.CollTools.getDistVec2(ground, coll, scratchVecB);
                            var dirOverride = null;
                            if (!Vec2.isZero(ground.accelDir) && Vec2.isZero(coll.accelDir)) {
                                dirOverride = Vec2.assign(scratchVecA, ground.accelDir);
                                Vec2.rotate90CW(dirOverride);
                                Vec2.dot(overlapDir, dirOverride) < 0 && Vec2.flip(dirOverride);
                            }
                            if ((overlapDir.x > 0 ? ground.pos.x + ground.size.x - coll.pos.x : coll.pos.x + coll.size.x - ground.pos.x) > (overlapDir.y > 0 ? ground.pos.y + ground.size.y - coll.pos.y : coll.pos.y + coll.size.y - ground.pos.y)) {
                                overlapDir.x = 0;
                                if (!overlapDir.y) overlapDir.y = 1;
                            } else {
                                overlapDir.y = 0;
                                if (!overlapDir.x) overlapDir.x = 1;
                            }
                            if (ground.type == ig.COLLTYPE.BLOCK) move.x = move.y = 0;
                            var overlapDist = Vec2.length(overlapDir) - ground.size.y / 2;
                            overlapDist = overlapDist <= 0 ? 1 : Math.max(0.1, 1 - 0.9 * overlapDist / coll.size.y);
                            overlapDist = overlapDist * data.overlapEntryFactor;
                            dirOverride && (overlapDir = dirOverride);
                            Vec2.length(overlapDir, ig.system.tick * 128 * overlapDist);
                            if (!Vec2.isZero(ground.accelDir) || Vec2.dot(coll.accelDir, overlapDir) >= 0 || ground.type == ig.COLLTYPE.BLOCK) {
                                moved = true;
                                Vec2.add(move, overlapDir);
                            }
                        }
                    }
                    if (!data.skipXYPhysics && !data.forceMoveFrameVel && !wasGrounded && move.x == 0 && move.y == 0 && !coll.vel.z && (noGravity || (coll.pos.z == coll.baseZPos && !data.zBaseUncertain && !data.groundEntry && !data.holeInfo.mapRes && !coll.float.height && !data.overlapEntry))) {
                        coll.totalBlockTimer = 0;
                        coll.partlyBlockTimer = 0;
                    } else {
                        var prevZVel = coll.vel.z;
                        wasGrounded = Math.abs(coll.pos.z - coll.baseZPos) < ig.COLLISION.EPS;
                        moved = this.moveEntityZ(coll, move, wasGrounded) || moved;
                        var result = this.initTraceResult(traceTemplateA);
                        result.forcePushEntries = forcePushEntries;
                        result.forcePushEntries.length = 0;
                        result.forcePushDirs = forcePushDirs;
                        result.forcePushDirs.length = 0;
                        data.skipXYPhysics ? (data.skipXYPhysics = false) : this.moveEntityXY(result, coll, move, collided);
                        this.updateGroundEntity(coll, move, wasGrounded, prevZVel, moved);
                        this.addToCollMap(coll);
                        if (result.forcePushEntries.length > 0) {
                            for (move = result.forcePushEntries.length; move--;) this.forcePushEntry(result.forcePushEntries[move], coll, result.forcePushDirs[move]);
                        }
                        data.forceMoveFrameVel = false;
                    }
                }
            }
        },

        moveEntityXY: function (result, coll, vel, collided, skipCollide) {
            var data = coll._collData;
            if (vel.x == 0 && vel.y == 0) {
                coll.totalBlockTimer = 0;
                coll.partlyBlockTimer = 0;
                if (!skipCollide) {
                    data.frameVel.x = 0;
                    data.frameVel.y = 0;
                }
                return false;
            }
            var startX = coll.pos.x;
            var startY = coll.pos.y;
            var moveDist = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            this.removeFromCollMap(coll);
            var groundCheck = coll.pos.z - coll.baseZPos < ig.COLLISION.EPS;
            if (coll.type) {
                var collided = false;
                var iterations = coll.bounciness ? 1 : 3;
                var firstIteration = true;
                do {
                    iterations--;
                    if (!coll.ignoreCollision && (!coll.parentColl || !coll.parentColl.ignoreCollision)) {
                        this._trackEntityTouch = true;
                        collided = this.trace(result, startX, startY, coll.pos.z, vel.x, vel.y, coll.size.x, coll.size.y, coll.size.z, coll.type, coll, skipCollide, groundCheck);
                        this._trackEntityTouch = false;
                        if (!collided && firstIteration) {
                            coll.totalBlockTimer = 0;
                            coll.partlyBlockTimer = 0;
                        }
                        firstIteration = false;
                    } else {
                        coll.totalBlockTimer = 0;
                        coll.partlyBlockTimer = 0;
                    }
                    if (result.dist > 0 && Math.abs(coll.accelDir.x * result.dir.x + coll.accelDir.y * result.dir.y) < 0.8) coll.totalBlockTimer = 0;
                    if (result.levelUp) {
                        setPosZ(coll, ig.game.levels[coll.level + 1].height);
                        result.levelUp = false;
                    }
                    if (collided && iterations) {
                        if (!skipCollide) data.collided = data.collided || collided;
                        var cross = result.dir.y * vel.x - result.dir.x * vel.y;
                        startX = startX + result.dist * vel.x;
                        startY = startY + result.dist * vel.y;
                        moveDist = moveDist * (1 - result.dist);
                        vel.x = (1 - result.dist) * result.dir.y * cross;
                        vel.y = (1 - result.dist) * -result.dir.x * cross;
                        result.dist = 1;
                        if (result.slipX || result.slipY) {
                            cross = Vec2.assignC(scratchVecB, result.slipX, result.slipY);
                            if (Vec2.isZero(coll.accelDir) || Vec2.angle(coll.accelDir, cross) <= Math.PI * 0.6) {
                                Vec2.length(cross, moveDist - Math.sqrt(vel.x * vel.x + vel.y * vel.y));
                                vel.x = vel.x + cross.x;
                                vel.y = vel.y + cross.y;
                                cross = 1;
                                result.slipX > 0 && vel.x > result.slipX ? (cross = Math.min(cross, result.slipX / vel.x)) : result.slipX < 0 && vel.x < result.slipX && (cross = Math.min(cross, result.slipX / vel.x));
                                result.slipY > 0 && vel.y > result.slipY ? (cross = Math.min(cross, result.slipY / vel.y)) : result.slipY < 0 && vel.y < result.slipY && (cross = Math.min(cross, result.slipY / vel.y));
                                if (cross < 1) {
                                    vel.x = vel.x * cross;
                                    vel.y = vel.y * cross;
                                }
                                if (!skipCollide) data.slipped = true;
                            }
                        }
                        delete result.slipX;
                        delete result.slipY;
                    }
                } while (collided && iterations && (vel.x != 0 || vel.y != 0));
                if (!skipCollide) {
                    data.collided = data.collided || collided;
                    data.blockDir.x = result.dir.x;
                    data.blockDir.y = result.dir.y;
                }
            } else {
                coll.totalBlockTimer = 0;
                coll.partlyBlockTimer = 0;
            }
            if (coll.partlyBlockTimer < 0) coll.partlyBlockTimer = 0;
            window.checkPlayerPos("");
            startX = startX + result.dist * vel.x;
            startY = startY + result.dist * vel.y;
            startX = Math.round(startX * 100) / 100;
            startY = Math.round(startY * 100) / 100;
            if (!skipCollide) {
                data.frameVel.x = startX - coll.pos.x;
                data.frameVel.y = startY - coll.pos.y;
            }
            if (isNaN(startX) || isNaN(startY)) throw Error("NaN!");
            coll.pos.x = startX;
            coll.pos.y = startY;
            return collided;
        },

        isGroundDanger: function (coll) {
            return this.groundDangerCallback ? this.groundDangerCallback(coll) : false;
        },

        isGroundEntityDanger: function (entry) {
            return this.groundEntityDangerCallback ? this.groundEntityDangerCallback(entry) : false;
        },

        groundDangerCallback: null,
        groundEntityDangerCallback: null,

        moveEntityZ: function (coll, vel, onGround) {
            var moved = false;
            var x = coll.pos.x;
            var y = coll.pos.y;
            var data = coll._collData;
            var levelData = ig.game.levels[coll.level] || ig.game.levels[0];
            if (onGround && (coll.zGravityFactor > 0 && !coll.noSlipping && !data.forceMoveFrameVel) && (data.holeInfo.mapRes == 1 || data.groundEntry)) {
                var edgePush = Vec2.assignC(scratchVecA, 0, 0);
                var checkX = x + coll.size.x * 0.9 / 2;
                var checkY = y + coll.size.y * 0.9 / 2;
                var checkSizeX = coll.size.x * 0.1;
                var checkSizeY = coll.size.y * 0.1;
                var fallHeight = coll.pos.z - levelData.height;
                var slipDist = 1e3;
                data.holeInfo.mapRes == 2 && (fallHeight = fallHeight + 16);
                this.isGroundDanger(coll) && (fallHeight = fallHeight + 16);
                if (data.holeInfo.mapRes == 1 && levelData.collision.isOverHole(checkX, checkY - levelData.height, checkSizeX, checkSizeY)) {
                    var holeDir = Vec2.assign(scratchVecC, data.holeInfo.mapDir);
                    coll.edgeSlipInward && Vec2.flip(holeDir);
                    Vec2.dot(coll.accelDir, holeDir) >= 0 && Vec2.add(edgePush, holeDir);
                    if (data.groundEntry || !this.getGroundEntry(checkX, checkY, checkSizeX, checkSizeY, coll.size.z, coll.pos.z, coll.pos.z - ig.COLLISION.HEIGHT_TOLERATE, coll)) fallHeight = fallHeight + 16;
                }
                if (data.groundEntry) {
                    var groundZ = data.groundEntry.heightShape ? data.groundEntry.pos.z : coll.pos.z;
                    var offsetX = data.groundEntry.pos.x + data.groundEntryOffset.x - x;
                    var offsetY = data.groundEntry.pos.y + data.groundEntryOffset.y - y;
                    if (!data.groundEntry.heightShape && !this.getGroundEntry(checkX + offsetX, checkY + offsetY, checkSizeX, checkSizeY, coll.size.z, coll.pos.z, groundZ - ig.COLLISION.HEIGHT_TOLERATE, coll)) {
                        holeDir = Vec2.assign(scratchVecC, data.holeInfo.entryDir);
                        coll.edgeSlipInward && Vec2.flip(holeDir);
                        Vec2.dot(coll.accelDir, holeDir) >= 0 && Vec2.add(edgePush, holeDir);
                        slipDist = Math.min(slipDist, data.holeInfo.entryDist);
                    } else {
                        fallHeight = 0;
                    }
                }
                if ((edgePush.x != 0 || edgePush.y != 0) && !data.overlapEntry && fallHeight > ig.COLLISION.HEIGHT_TOLERATE && Vec2.dot(coll.accelDir, edgePush) >= 0) {
                    if (coll.onFallFromEdge) coll.onFallFromEdge(edgePush);
                    if (coll.vel.z <= 0) {
                        Vec2.length(edgePush, Math.min(slipDist, 32 * ig.system.tick));
                        moved = true;
                        vel.x = vel.x + edgePush.x;
                        vel.y = vel.y + edgePush.y;
                        if (Math.sqrt(vel.x * vel.x + vel.y * vel.y) > slipDist && coll.accelDir.x == 0 && coll.accelDir.y == 0) {
                            vel.x = edgePush.x;
                            vel.y = edgePush.y;
                        }
                    }
                }
            }
            var gravity = -ig.game.gravity * coll.zGravityFactor;
            var maxZVel = coll.maxZVel;
            var minZVel = -coll.maxZVel;
            if (coll.float.height) {
                var floatAccel = ig.game.gravity / 5 * coll.float.accel;
                var floatMaxAccel = ig.game.gravity * 4 * coll.float.accel;
                maxZVel = Math.max(coll.vel.z, coll.float.maxSpeed);
                minZVel = Math.min(coll.vel.z, -coll.float.maxSpeed);
                var variance = coll.float.variance;
                var floatOffset = coll.float.height + coll.baseZPos - coll.pos.z;
                Math.abs(floatOffset) <= variance * 2 && (floatAccel = floatAccel / 6);
                var velSq = coll.vel.z * coll.vel.z;
                if (variance == 0 && Math.abs(floatOffset) < 1 && Math.abs(coll.vel.z) < 50) {
                    gravity = 0;
                    coll.vel.z = 0;
                } else if (!(floatOffset - variance < 0 && coll.vel.z < 0) && (floatOffset >= 0 || (floatOffset + variance > 0 && coll.vel.z > 0))) {
                    gravity = 0.5 * velSq / (floatOffset + variance);
                    gravity = coll.vel.z > 0 && (gravity >= floatAccel || floatOffset <= 0) ? -gravity.limit(floatAccel / 4, floatMaxAccel) : floatAccel;
                } else if (floatOffset < 0 || (floatOffset - variance < 0 && coll.vel.z < 0)) {
                    gravity = 0.5 * velSq / (-floatOffset + variance);
                    gravity = coll.vel.z < 0 && (gravity >= floatAccel || floatOffset >= 0) ? gravity.limit(floatAccel / 4, floatMaxAccel) : -floatAccel;
                }
            }
            if (!data.zBaseUncertain && (data.forceMoveFrameVel || coll.pos.z > coll.baseZPos || coll.vel.z != 0 || gravity > 0)) {
                var targetZ = data.forceMoveFrameVel ? coll.pos.z + data.frameVel.z : coll.pos.z + coll.vel.z * ig.system.tick + gravity * ig.system.tick * ig.system.tick * 0.5;
                if (!data.forceMoveFrameVel && coll.vel.z > 0 && !coll.ignoreCollision) {
                    if (coll.level + 1 < ig.game.maxLevel && targetZ + coll.size.z > ig.game.levels[coll.level + 1].height - 1 && !ig.game.levels[coll.level + 1].collision.isOverHole(x, y - ig.game.levels[coll.level + 1].height, coll.size.x, coll.size.y)) {
                        targetZ = ig.game.levels[coll.level + 1].height - 1 - coll.size.z;
                        coll.vel.z = 0;
                    }
                    if (data.ceilingEntry && targetZ + coll.size.z > data.ceilingEntry.pos.z) {
                        targetZ = data.ceilingEntry.pos.z - coll.size.z;
                        coll.vel.z = 0;
                    }
                }
                if (!data.forceMoveFrameVel && targetZ <= coll.baseZPos) {
                    coll.vel.z = coll.pos.z > coll.baseZPos && -coll.vel.z > coll.minBounceVelocity ? coll.vel.z * -coll.zBounciness : 0;
                    targetZ = coll.baseZPos;
                }
                if (!data.forceMoveFrameVel) data.frameVel.z = data.frameVel.z + (targetZ - coll.pos.z);
                setPosZ(coll, targetZ);
                coll.vel.z = coll.vel.z + gravity * ig.system.tick;
                if (coll.vel.z > maxZVel) coll.vel.z = maxZVel;
                if (coll.vel.z < minZVel) coll.vel.z = minZVel;
            }
            if (coll.accelDir.x || coll.accelDir.y) {
                coll.totalBlockTimer = coll.totalBlockTimer + ig.system.tick;
                coll.partlyBlockTimer = coll.partlyBlockTimer + ig.system.tick;
            } else {
                coll.totalBlockTimer = 0;
                coll.partlyBlockTimer = 0;
            }
            return moved;
        },

        forcePushEntry: function (entry, mover, dir, skipCollide) {
            var push = Vec2.assignC(scratchVecD, 0, 0);
            if (dir.x > 0) push.x = Math.max(0, mover.pos.x + mover.size.x - entry.pos.x);
            else if (dir.x < 0) push.x = Math.min(0, mover.pos.x - entry.pos.x - entry.size.x);
            if (dir.y > 0) push.y = Math.max(0, mover.pos.y + mover.size.y - entry.pos.y);
            else if (dir.y < 0) push.y = Math.min(0, mover.pos.y - entry.pos.y - entry.size.y);
            if (!(push.x == 0 && push.y == 0)) {
                entry.initCollData();
                if (!entry._collData.groundEntry || !(entry._collData.groundEntry.parentColl && entry._collData.groundEntry.parentColl == mover.parentColl)) {
                    var result = this.initTraceResult(traceTemplateB);
                    var totalBlockTimer = entry.totalBlockTimer;
                    var partlyBlockTimer = entry.partlyBlockTimer;
                    var collided = this.moveEntityXY(result, entry, push, skipCollide, true);
                    entry.totalBlockTimer = totalBlockTimer;
                    entry.partlyBlockTimer = partlyBlockTimer;
                    var onGround = Math.abs(entry.pos.z - entry.baseZPos) < ig.COLLISION.EPS;
                    this.updateGroundEntity(entry, push, onGround, entry.vel.z, true);
                    this.addToCollMap(entry);
                    if (collided && entry.entity.onPhysicsSquish) entry.entity.onPhysicsSquish(mover.entity);
                }
            }
        },

        updateGroundEntity: function (coll, vel, onGround, zVel, force) {
            var data = coll._collData;
            var prevBaseZ = coll.baseZPos;
            var wasGrounded = !onGround && coll.pos.z == coll.baseZPos;
            var ground = this.updateBaseZPos(coll, coll.pos.x, coll.pos.y, data);
            if (coll.zGravityFactor && coll.pos.z < coll.baseZPos) {
                data.frameVel.z = data.frameVel.z + (coll.baseZPos - coll.pos.z);
                setPosZ(coll, coll.baseZPos);
                data.zPush = true;
            }
            var heightTolerance = ground && ground.heightShape ? Math.max(Math.abs(vel.x), Math.abs(vel.y)) + 2 : ig.COLLISION.HEIGHT_TOLERATE;
            if (!data.forceMoveFrameVel && coll.zGravityFactor) {
                var grounded = coll.pos.z - coll.baseZPos < ig.COLLISION.EPS;
                if (!grounded && wasGrounded && coll.pos.z - coll.baseZPos < heightTolerance) {
                    grounded = true;
                    setPosZ(coll, coll.baseZPos);
                }
                if (onGround && coll.vel.z <= 0) {
                    if (grounded) {
                        if (data.holeInfo.entryDanger && coll.entity.onFallFromEdge) coll.entity.onFallFromEdge();
                    } else if (coll.pos.z - coll.baseZPos > heightTolerance || this.isGroundDanger(coll)) {
                        if (coll.entity.onFallFromEdge) coll.entity.onFallFromEdge();
                    } else {
                        setPosZ(coll, coll.baseZPos);
                        data.zPush = true;
                    }
                } else if (coll.float.height && prevBaseZ - coll.baseZPos > ig.COLLISION.HEIGHT_TOLERATE && coll.pos.z - prevBaseZ < coll.float.height + coll.float.variance) {
                    if (coll.entity.onFallFromEdge) coll.entity.onFallFromEdge();
                } else if (!onGround && grounded && coll.entity.onTouchGround) {
                    coll.entity.onTouchGround(zVel);
                }
            } else {
                ground = null;
            }
            (data.groundEntry != ground || force || data.collided) && coll.setGroundEntry(ground);
        },

        updateBaseZPos: function (coll, x, y, data) {
            var levelData = ig.game.levels[coll.level] || ig.game.levels[0];
            coll.baseZPos = coll.level >= 0 ? levelData.height : -1e3;
            Vec2.assignC(data.holeInfo.mapDir, 0, 0);
            data.holeInfo.mapRes = levelData.collision.isOverHole(x, y - levelData.height, coll.size.x, coll.size.y, data.holeInfo.mapDir);
            var level = coll.level;
            if (level >= 0 && data.holeInfo.mapRes == 2) {
                for (--level; level >= 0 && ig.game.levels[level].collision.isOverHole(x, y - ig.game.levels[level].height, coll.size.x, coll.size.y);) --level;
            }
            coll.baseZPos = level >= 0 ? ig.game.levels[level].height : -1e3;
            data.zBaseUncertain = false;
            Vec2.assignC(data.holeInfo.entryDir, 0, 0);
            data.holeInfo.entryZ = 0;
            data.holeInfo.entryDist = 1e4;
            data.overlapEntry = null;
            data.ceilingEntry = null;
            data.holeInfo.entryDanger = false;
            if ((x = this.getGroundEntry(x, y, coll.size.x, coll.size.y, coll.size.z, coll.pos.z, coll.baseZPos, coll, data))) {
                var tolerance = x.heightShape ? 32 : ig.COLLISION.HEIGHT_TOLERATE;
                var danger = this.isGroundEntityDanger(x);
                if (coll.baseZPos == coll.pos.z && coll.baseZPos == data.holeInfo.entryZ && danger) {
                    x = null;
                } else {
                    if (coll.baseZPos < data.holeInfo.entryZ) coll.baseZPos = data.holeInfo.entryZ;
                    coll.zGravityFactor && coll.pos.z - coll.baseZPos <= tolerance ? (data.holeInfo.entryDanger = danger) : (coll.float.height || (x = null));
                }
            }
            return x;
        },

        getBaseZPos: function (x, y, z, sizeX, sizeY) {
            for (var level = ig.game.getLevelIdx(z); level >= 0 && ig.game.levels[level].collision.isOverHole(x, y - ig.game.levels[level].height, sizeX, sizeY);) --level;
            level = level >= 0 ? ig.game.levels[level].height : -1e3;
            return (x = this.getGroundEntry(x, y, sizeX, sizeY, 8, z, level)) ? x.pos.z + x.size.z : level;
        },

        traceOnEntryMap: function (result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, collType, entity, traceResultType, extra) {
            var collided = [];
            var ignoreCollided = [];
            var didCollide = false;
            var x0 = Math.max(0, Math.floor((x + (velX < 0 ? velX : 0)) / this.cellSize));
            var y0 = Math.max(0, Math.floor((y + (velY < 0 ? velY : 0)) / this.cellSize));
            var x1 = Math.min(this.collEntryMap.width, Math.floor((x + (velX > 0 ? velX : 0) + sizeX) / this.cellSize) + 1);
            var y1 = Math.min(this.collEntryMap.height, Math.floor((y + (velY > 0 ? velY : 0) + sizeY) / this.cellSize) + 1);
            var touchedEntries = [];
            var touchedDirs = [];
            var minDist = 1;
            var forceMove = entity && entity._collData && entity._collData.forceMoveFrameVel;
            var heavyPush = forceMove || (entity && (collType == ig.COLLTYPE.BLOCK || collType == ig.COLLTYPE.FENCE) && entity.weight == -1);
            var selfColl = entity && entity.parentColl ? entity.parentColl : entity;
            var shapeTrace = entity && entity.shape != ig.COLLSHAPE.RECTANGLE;
            for (var gx = x0; gx < x1; gx++) {
                for (var gy = y0; gy < y1; gy++) {
                    for (var cell = this.collEntryMap[gx][gy], n = cell.length; n--;) {
                        var entry = cell[n];
                        if (entry._inCollisionMap) {
                            if (collided.indexOf(entry) == -1 && entry != selfColl && (!entry.parentColl || entry.parentColl != selfColl)) {
                                collided.push(entry);
                                if (entry.ignoreCollision || (entry.parentColl && entry.parentColl.ignoreCollision) || !ig.Entity.COLLISION_MAP[collType][entry.type]) {
                                    ignoreCollided.push(entry);
                                } else {
                                    var prevDist = result.dist;
                                    var hit;
                                    if (shapeTrace) {
                                        (hit = entity.trace(result, entry.pos.x, entry.pos.y, entry.pos.z, -velX, -velY, entry.size.x, entry.size.y, entry.size.z, extra)) && Vec2.flip(result.dir);
                                    } else {
                                        hit = entry.trace(result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, extra);
                                    }
                                    if (hit) {
                                        if (result.forcePushEntries && heavyPush && entry.type != ig.COLLTYPE.BLOCK && (entry.weight != -1 || entry.type == ig.COLLTYPE.PROJECTILE)) {
                                            result.dist = prevDist;
                                            result.forcePushEntries.push(entry);
                                            result.forcePushDirs.push(ig.copy(result.dir));
                                        } else if (forceMove) {
                                            result.dist = prevDist;
                                        } else {
                                            if (minDist > result.dist) {
                                                minDist = result.dist;
                                                touchedEntries = [];
                                                touchedDirs = [];
                                            }
                                            didCollide = true;
                                        }
                                        touchedEntries.push(entry);
                                        touchedDirs.push({ x: result.dir.x, y: result.dir.y });
                                    } else if (entry.intersectsWith(x, y, z, sizeX, sizeY, sizeZ)) {
                                        touchedEntries.push(entry);
                                        touchedDirs.push({ x: 0, y: 0 });
                                    }
                                }
                            }
                        } else {
                            cell.splice(n, 1);
                        }
                    }
                }
            }
            if (traceResultType) {
                var addedTouch = false;
                for (var i = touchedEntries.length; i--;) {
                    var touchEntry = touchedEntries[i];
                    var touchDir = touchedDirs[i];
                    traceResultType.indexOf(touchEntry) == -1 && traceResultType.push(touchEntry);
                    if (entity && this._trackEntityTouch) {
                        addedTouch = true;
                        var collListIdx = touchEntry._collisionList.indexOf(entity);
                        if (collListIdx == -1) {
                            collListIdx = touchEntry._collisionList.length;
                            touchEntry._collisionList.push(entity);
                        }
                        if (!touchEntry._collisionListData[collListIdx]) {
                            touchDir.dot = touchDir.x * velX + touchDir.y * velY;
                            touchEntry._collisionListData[collListIdx] = touchDir;
                        }
                        entity._collisionList.indexOf(touchEntry) == -1 && entity._collisionList.push(touchEntry);
                    }
                }
                if (this._trackEntityTouch) {
                    var emptyResult = { dist: 1, dir: { x: 0, y: 0 } };
                    for (i = ignoreCollided.length; i--;) {
                        touchEntry = ignoreCollided[i];
                        emptyResult.dist = minDist;
                        if (touchEntry.trace(emptyResult, x, y, z, velX, velY, sizeX, sizeY, sizeZ, extra) || touchEntry.intersectsWith(x, y, z, sizeX, sizeY, sizeZ)) {
                            traceResultType.indexOf(touchEntry) == -1 && traceResultType.push(touchEntry);
                            if (entity) {
                                addedTouch = true;
                                touchEntry._collisionList.indexOf(entity) == -1 && touchEntry._collisionList.push(entity);
                                entity._collisionList.indexOf(touchEntry) == -1 && entity._collisionList.push(touchEntry);
                            }
                        }
                    }
                    entity && (addedTouch && traceResultType.indexOf(entity) == -1) && traceResultType.push(entity);
                }
            }
            return didCollide;
        },

        getGroundEntry: function (x, y, sizeX, sizeY, sizeZ, z, groundZ, entity, collData) {
            var holeInfo = collData && collData.holeInfo;
            var found = false;
            var bestArea = 0;
            var x0 = Math.max(0, Math.floor(x / this.cellSize));
            var y0 = Math.max(0, Math.floor(y / this.cellSize));
            var x1 = Math.min(this.collEntryMap.width, Math.floor((x + sizeX) / this.cellSize) + 1);
            var y1 = Math.min(this.collEntryMap.height, Math.floor((y + sizeY) / this.cellSize) + 1);
            var semiIgnore = entity && entity.type == ig.COLLTYPE.SEMI_IGNORE;
            for (; x0 < x1; x0++) {
                for (var gy = y0; gy < y1; gy++) {
                    for (var cell = this.collEntryMap[x0][gy].length; cell--;) {
                        var entry = this.collEntryMap[x0][gy][cell];
                        var rootEntry = entry.parentColl || entry;
                        if (entry != entity && !rootEntry.ignoreCollision && (!entity || entry.parentColl != entity) && (entry.type == ig.COLLTYPE.NPBLOCK || entry.type == ig.COLLTYPE.BLOCK || entry.type == ig.COLLTYPE.FENCE || entry.type == ig.COLLTYPE.NPFENCE || (!semiIgnore && entry.type == ig.COLLTYPE.VIRTUAL) || (semiIgnore && entry.type == ig.COLLTYPE.SEMI_IGNORE))) {
                            var rightGap = entry.pos.x + entry.size.x - x;
                            var leftGap = x + sizeX - entry.pos.x;
                            var bottomGap = entry.pos.y + entry.size.y - y;
                            var topGap = y + sizeY - entry.pos.y;
                            var minGap = Math.min(Math.min(rightGap, leftGap), Math.min(topGap, bottomGap));
                            var factor = 1;
                            if (minGap > 0) {
                                var topZ = entry.pos.z + entry.getOverlapHeight(x, y, sizeX, sizeY);
                                if (z + sizeZ - ig.COLLISION.EPS > entry.pos.z && topZ >= groundZ) {
                                    if (semiIgnore && entry.type == ig.COLLTYPE.SEMI_IGNORE) {
                                        if (minGap < entity.size.x / 4) continue;
                                        else factor = 0.2;
                                    }
                                    var entryData = entry._collData;
                                    if (!entry.heightShape && topZ - ig.COLLISION.EPS > z + ig.COLLISION.HEIGHT_TOLERATE) {
                                        if ((entry.shape == ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(entry.pos.x + entry.size.x / 2, entry.pos.y + entry.size.y / 2, entry.shape, x, y, sizeX, sizeY)) && (holeInfo && entity && !entity.heightShape && entity.shape == ig.COLLSHAPE.RECTANGLE && !entity.ignoreCollision && !entry.ignoreCollision && (entity.type == ig.COLLTYPE.BLOCK || entity.type == ig.COLLTYPE.NPBLOCK || entity.type == ig.COLLTYPE.VIRTUAL || semiIgnore)) && !(entryData && entryData.groundEntry == entity)) {
                                            if (!collData.overlapEntry || collData.overlapEntry.size.x < entry.size.x) {
                                                collData.overlapEntryFactor = factor;
                                                collData.overlapEntry = entry;
                                            }
                                            if (entryData && (!entryData.overlapEntry || entryData.overlapEntry.size.x < entity.size.x)) {
                                                entryData.overlapEntry = entity;
                                                entryData.overlapEntryFactor = factor;
                                            }
                                        }
                                    } else if (entry.type == ig.COLLTYPE.BLOCK || entry.type == ig.COLLTYPE.NPBLOCK) {
                                        var slopeVal = 0;
                                        var dirX = 0;
                                        var dirY = 0;
                                        var dist = minGap;
                                        if (entry.shape != ig.COLLSHAPE.RECTANGLE) {
                                            var centerX = entry.pos.x + entry.size.x / 2;
                                            var centerY = entry.pos.y + entry.size.y / 2;
                                            switch (entry.shape) {
                                                case ig.COLLSHAPE.SLOPE_NE:
                                                    slopeVal = x - centerX - (y + sizeY - centerY);
                                                    dirX = 1;
                                                    dirY = -1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_SE:
                                                    slopeVal = x - centerX + (y - centerY);
                                                    dirY = dirX = 1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_SW:
                                                    slopeVal = -(x + sizeX - centerX) + (y - centerY);
                                                    dirX = -1;
                                                    dirY = 1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_NW:
                                                    slopeVal = -(x + sizeX - centerX) - (y + sizeY - centerY);
                                                    dirY = dirX = -1;
                                            }
                                            if (slopeVal >= -ig.COLLISION.EPS) continue;
                                            slopeVal = slopeVal * -Math.SQRT1_2;
                                            dist = Math.min(dist, slopeVal);
                                        }
                                        if (holeInfo) {
                                            var overlapArea = ig.CollTools.getOverlapArea(entry, x, y, sizeX, sizeY);
                                            if (topZ > groundZ) {
                                                groundZ = topZ;
                                                holeInfo.entryDir.x = 0;
                                                holeInfo.entryDir.y = 0;
                                                holeInfo.entryDist = 1e5;
                                            } else if (found && overlapArea < bestArea) {
                                                continue;
                                            }
                                            bestArea = overlapArea;
                                            if (minGap == dist) {
                                                if (minGap == bottomGap) {
                                                    dirX = 0;
                                                    dirY = 1;
                                                } else if (minGap == topGap) {
                                                    dirX = 0;
                                                    dirY = -1;
                                                } else if (minGap == rightGap) {
                                                    dirX = 1;
                                                    dirY = 0;
                                                } else if (minGap == leftGap) {
                                                    dirX = -1;
                                                    dirY = 0;
                                                }
                                            }
                                            if (dist < holeInfo.entryDist) {
                                                if (holeInfo.entryDir.x * dirX + holeInfo.entryDir.y * dirY < 0) {
                                                    holeInfo.entryDir.x = 0;
                                                    holeInfo.entryDir.y = 0;
                                                    holeInfo.entryDist = 0;
                                                } else {
                                                    holeInfo.entryDir.x = dirX;
                                                    holeInfo.entryDir.y = dirY;
                                                    holeInfo.entryDist = dist;
                                                }
                                            }
                                            holeInfo.entryZ = topZ;
                                            found = entry;
                                        } else {
                                            return entry;
                                        }
                                    }
                                } else if (z + sizeZ <= entry.pos.z && (entry.type == ig.COLLTYPE.BLOCK || entry.type == ig.COLLTYPE.NPBLOCK)) {
                                    if (collData && entryData && entryData.groundEntry != entity && (!collData.ceilingEntry || collData.ceilingEntry.pos.z < entry.pos.z)) collData.ceilingEntry = entry;
                                }
                            }
                        }
                    }
                }
            }
            return found;
        }
    });
});
ig.baked = !0;
