/*
 * impact.base.coll-entry
 * ----------------------
 * The `ig.CollEntry` class — the physics/collision volume attached to every
 * entity — plus the `ig.CollTools` distance/overlap/edge helpers.
 *
 * Original: deobf/extract/impact.base.coll-entry.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.coll-entry").defines(function () {
    ig.COLL_UPDATE_TYPE = {
        STATIC: 0,
        ON_SCREEN: 1,
        DYNAMIC: 2
    };

    ig.COLL_HEIGHT_SHAPE = {
        NONE: 0,
        NORTH_UP: 1,
        EAST_UP: 2,
        WEST_UP: 3,
        SOUTH_UP: 4
    };

    ig.COLL_SHADOW_TYPE = {
        DEFAULT: 0,
        STATIC_SIZE: 1,
        RECTANGULAR: 2
    };

    ig.COLL_GROUND_CONNECT = {
        LOOSE: 0,
        FIXED: 1,
        IN_EARTH: 2,
        STRONG_FLIGHT: 3
    };

    var traceResultTemplate = {};

    ig.CollEntry = ig.Class.extend({
        entity: null,
        _active: false,
        _inCollisionMap: false,
        _killed: false,
        type: 0,
        updateType: ig.COLL_UPDATE_TYPE.DYNAMIC,
        shape: 1,
        heightShape: ig.COLL_HEIGHT_SHAPE.NONE,
        size: { x: 0, y: 0, z: 0 },
        alwaysRender: false,
        padding: { x: 0, y: 0 },
        ignoreCollision: false,
        groundConnect: ig.COLL_GROUND_CONNECT.LOOSE,
        groundSlip: false,
        edgeSlipInward: false,
        weight: -1,
        friction: {
            ground: 1,
            air: 1,
            terrain: 1,
            ignoreTerrain: false
        },
        accelSpeed: 1,
        maxVel: 100,
        maxZVel: 1e3,
        relativeVel: 1,
        bounciness: 0,
        zBounciness: 0.2,
        minBounceVelocity: 40,
        zGravityFactor: 0,
        "float": {
            height: 0,
            variance: 1,
            maxSpeed: 300,
            accel: 1
        },
        time: {
            factor: 1,
            logicFactor: 1,
            moveXYFactor: 1,
            globalStatic: false,
            animStatic: false,
            parent: null,
            parentAnimToGlobal: false
        },
        pos: Vec3.create(),
        level: 0,
        baseZPos: 0,
        shadow: {
            type: ig.COLL_SHADOW_TYPE.DEFAULT,
            size: 0,
            scaleY: 1,
            offset: Vec2.create()
        },
        vel: Vec3.create(),
        pushVel: Vec2.create(),
        accelDir: Vec2.create(),
        parentColl: null,
        parentGroup: null,
        subColls: [],
        totalBlockTimer: 0,
        partlyBlockTimer: 0,
        updated: 0,
        _collData: null,
        _collisionList: [],
        _collisionListData: [],

        init: function (entity) {
            this.entity = entity;
            this.reset();
        },

        initCollData: function () {
            if (this._collData) return false;
            this._collData = {
                collided: false,
                frameVel: Vec3.create(),
                blockDir: Vec2.create(),
                slipped: false,
                zBaseUncertain: true,
                zPush: false,
                skipPhysics: false,
                forceMoveFrameVel: false,
                pushColl: null,
                groundEntry: null,
                groundEntryOffset: Vec2.create(),
                overlapEntry: null,
                ceilingEntry: null,
                overlapEntryFactor: 1,
                noSlipping: false,
                holeInfo: {
                    mapRes: 0,
                    mapDir: Vec2.create(),
                    entryDir: Vec2.create(),
                    entryZ: 0,
                    entryDist: 0,
                    entryDanger: false
                }
            };
            return true;
        },

        reset: function () {
            var proto = this.constructor.prototype;
            this._active = proto.active;
            this._inCollisionMap = proto._inCollisionMap;
            this._killed = proto._killed;
            this.time.globalStatic = proto.time.globalStatic;
            this.time.animStatic = proto.time.animStatic;
            this.time.factor = proto.time.factor;
            this.time.logicFactor = proto.time.logicFactor;
            this.type = proto.type;
            this.updateType = proto.updateType;
            this.shape = proto.shape;
            this.heightShape = proto.heightShape;
            Vec3.assign(this.size, proto.size);
            Vec2.assign(this.padding, proto.padding);
            this.ignoreCollision = proto.ignoreCollision;
            this.groundConnect = proto.groundConnect;
            this.groundSlip = proto.groundSlip;
            this.weight = proto.weight;
            this.friction.ground = proto.friction.ground;
            this.friction.terrain = proto.friction.terrain;
            this.friction.air = proto.friction.air;
            this.friction.ignoreTerrain = proto.friction.ignoreTerrain;
            this.accelSpeed = proto.accelSpeed;
            this.maxVel = proto.maxVel;
            this.noSlipping = proto.noSlipping;
            this.relativeVel = proto.relativeVel;
            this.bounciness = proto.bounciness;
            this.zBounciness = proto.zBounciness;
            this.minBounceVelocity = proto.minBounceVelocity;
            this.zGravityFactor = proto.zGravityFactor;
            this.float.height = proto.float.height;
            this.float.variance = proto.float.variance;
            this.float.maxSpeed = proto.float.maxSpeed;
            this.float.accel = proto.float.accel;
            Vec3.assign(this.pos, proto.pos);
            this.level = proto.level;
            this.baseZPos = proto.baseZPos;
            this.shadow.size = proto.shadow.size;
            this.shadow.scaleY = proto.shadow.scaleY;
            this.shadow.type = proto.shadow.type;
            this.shadow.offset.x = proto.shadow.offset.x;
            this.shadow.offset.y = proto.shadow.offset.y;
            Vec3.assign(this.vel, proto.vel);
            Vec2.assign(this.pushVel, proto.pushVel);
            Vec3.assign(this.accelDir, proto.accelDir);
            this.parentColl = proto.parentColl;
            this.parentGroup = proto.parentGroup;
            this.subColls.length = 0;
            this.totalBlockTimer = proto.totalBlockTimer;
            this.partlyBlockTimer = proto.partlyBlockTimer;
            this.updated = proto.updated;
            this._collData = proto._collData;
            this._collisionList.length = 0;
            this._collisionListData.length = 0;
            this.alwaysRender = proto.alwaysRender;
            this.edgeSlipInward = proto.edgeSlipInward;
        },

        setPos: function (x, y, z, force) {
            var dx = 0;
            var dy = 0;
            var dz = 0;
            var movedXY = !isNaN(x) || !isNaN(y);
            if (movedXY && force && this._collData) {
                this._collData.frameVel.x = x - this.pos.x;
                this._collData.frameVel.y = y - this.pos.y;
                this._collData.frameVel.z = z - this.pos.z;
                this._collData.forceMoveFrameVel = true;
            } else {
                (force = movedXY && this._inCollisionMap) && ig.game.physics.removeFromCollMap(this);
                if (!isNaN(x)) {
                    dx = x - this.pos.x;
                    this.pos.x = x;
                }
                if (!isNaN(y)) {
                    dy = y - this.pos.y;
                    this.pos.y = y;
                }
                force && ig.game.physics.addToCollMap(this);
                if (!isNaN(z)) {
                    dz = z - this.pos.z;
                    this.pos.z = z;
                    this.level = ig.game.getLevelIdx(this.pos.z);
                    this.baseZPos = Math.min(this.baseZPos, this.pos.z);
                    this._collData && (this._collData.zBaseUncertain = true);
                }
                if (this._collData) {
                    if (!this._collData.skipPhysics) {
                        this._collData.skipPhysics = true;
                        this._collData.frameVel.x = this._collData.frameVel.y = this._collData.frameVel.z = 0;
                    }
                    this._collData.frameVel.x = this._collData.frameVel.x + dx;
                    this._collData.frameVel.y = this._collData.frameVel.y + dy;
                    this._collData.frameVel.z = dz;
                    if (this._collData.groundEntry) {
                        this._collData.groundEntryOffset.x = this._collData.groundEntryOffset.x + dx;
                        this._collData.groundEntryOffset.y = this._collData.groundEntryOffset.y + dy;
                    }
                }
                if (isNaN(this.pos.x) || isNaN(this.pos.y) || isNaN(this.pos.z)) throw Error("Position update leads to NaN coordinate!");
            }
        },

        setType: function (type) {
            var active = type != ig.COLLTYPE.PASSIVE && type != ig.COLLTYPE.NONE;
            this.type = type;
            ig.game.physics && !this.entity._hidden && (this._inCollisionMap && !active ? ig.game.physics.removeFromCollMap(this) : !this._inCollisionMap && active && ig.game.physics.addToCollMap(this));
        },

        setUpdateType: function (type) {
            if (this.updateType != type) {
                var prevType = this.updateType;
                this.updateType = type;
                this._active && prevType == ig.COLL_UPDATE_TYPE.STATIC && ig.game.physics.addToUpdateList(this);
            }
        },

        setSize: function (x, y, z, center, resolveCollision) {
            if (!(x == this.size.x && y == this.size.y && z == this.size.z)) {
                var wasInMap = this._inCollisionMap;
                wasInMap && ig.game.physics.removeFromCollMap(this);
                if (center) {
                    var halfDx = (x - this.size.x) / 2;
                    var halfDy = (y - this.size.y) / 2;
                    if (resolveCollision) {
                        var shiftX = 0;
                        var shiftY = 0;
                        var result = null;
                        if (halfDx > 0) {
                            result = ig.game.physics.initTraceResult(traceResultTemplate);
                            ig.game.traceEntity(result, this.entity, halfDx, 0, 0, 0, 0) && (shiftX = -Math.ceil((1 - result.dist) * halfDx));
                            result = ig.game.physics.initTraceResult(traceResultTemplate);
                            ig.game.traceEntity(result, this.entity, -halfDx, 0, 0, 0, 0) && (shiftX = shiftX ? 0 : Math.ceil((1 - result.dist) * halfDx));
                        }
                        if (halfDy > 0) {
                            result = ig.game.physics.initTraceResult(traceResultTemplate);
                            ig.game.traceEntity(result, this.entity, 0, halfDy, 0, 0, 0) && (shiftY = -Math.ceil((1 - result.dist) * halfDy));
                            result = ig.game.physics.initTraceResult(traceResultTemplate);
                            ig.game.traceEntity(result, this.entity, 0, -halfDy, 0, 0, 0) && (shiftY = shiftY ? 0 : Math.ceil((1 - result.dist) * halfDy));
                        }
                        halfDx = halfDx - shiftX;
                        halfDy = halfDy - shiftY;
                    }
                    this.pos.x = this.pos.x - halfDx;
                    this.pos.y = this.pos.y - halfDy;
                    if (this._collData && this._collData.groundEntry) {
                        this._collData.groundEntryOffset.x = this._collData.groundEntryOffset.x - halfDx;
                        this._collData.groundEntryOffset.y = this._collData.groundEntryOffset.y - halfDy;
                    }
                }
                this.size.x = x;
                this.size.y = y;
                this.size.z = z;
                wasInMap && ig.game.physics.addToCollMap(this);
            }
        },

        setPadding: function (x, y) {
            var wasInMap = this._inCollisionMap;
            wasInMap && ig.game.physics.removeFromCollMap(this);
            this.padding.x = x;
            this.padding.y = y;
            wasInMap && ig.game.physics.addToCollMap(this);
        },

        getCenter: function (out) {
            out = out || Vec2.create();
            Vec2.assignC(out, this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
            return out;
        },

        addSubCollEntry: function (entry) {
            this.subColls.push(entry);
            entry.parentColl = this;
        },

        getTick: function (isAnimation, useLogicTick) {
            if (this.time.parent) return this.time.parent.getTick(this.time.parentAnimToGlobal || isAnimation, useLogicTick);
            var staticTick = this.time.globalStatic;
            !staticTick && (isAnimation && this.time.animStatic) && (staticTick = true);
            staticTick = staticTick ? ig.system.actualTick : ig.system.ingameTick;
            staticTick = staticTick * this.time.factor;
            useLogicTick || (staticTick = staticTick * this.time.logicFactor);
            return staticTick;
        },

        update: function () {
            var terrainFriction = this.friction.ignoreTerrain ? 1 : this.friction.terrain;
            var friction = this.pos.z > this.baseZPos || this.vel.z > 0 ? this.friction.air : this.friction.ground * terrainFriction;
            if (Math.abs(this.vel.x) < 2 && this.accelDir.x == 0) this.vel.x = 0;
            if (Math.abs(this.vel.y) < 2 && this.accelDir.y == 0) this.vel.y = 0;
            var maxVel = this.maxVel * this.relativeVel * this.time.moveXYFactor;
            var frictionVel = Vec2.mulF(this.vel, friction * 12 * ig.system.tick, scratchVec2A);
            if (this.accelDir.x || this.accelDir.y) {
                Vec2.normalize(this.accelDir);
                var speed = Vec2.length(this.vel);
                if (speed <= maxVel + ig.COLLISION.EPS) {
                    // Note: `speed` is overwritten with `maxVel` here, so the
                    // limit below clamps to maxVel when within tolerance.
                    speed = maxVel;
                    var accelDot = Vec2.dot(this.accelDir, frictionVel);
                    accelDot >= 0 && Vec2.sub(frictionVel, Vec2.mulF(this.accelDir, accelDot, scratchVec2B));
                }
                friction = Vec2.mulF(this.accelDir, maxVel * 10 * friction * this.accelSpeed, scratchVec2B);
                this.vel.x = this.vel.x + friction.x * ig.system.tick;
                this.vel.y = this.vel.y + friction.y * ig.system.tick;
                Vec2.limit(this.vel, 0, Math.max(speed, maxVel));
            }
            this.vel.x = this.vel.x - frictionVel.x;
            this.vel.y = this.vel.y - frictionVel.y;
        },

        contains: function (x, y, includeZ) {
            return !(this.pos.x > x || this.pos.x + this.size.x < x || this.pos.y - this.pos.z - (includeZ ? this.size.z : 0) > y || this.pos.y - this.pos.z + this.size.y < y);
        },

        intersectsWith: function (x, y, z, sizeX, sizeY, sizeZ, forceCheck, shape, checkZ) {
            if ((forceCheck = (forceCheck || !this.ignoreCollision) && !(this.pos.x - this.padding.x >= x + sizeX || this.pos.x + this.padding.x + this.size.x <= x || this.pos.y - this.padding.y >= y + sizeY || this.pos.y + this.padding.y + this.size.y <= y || this.pos.z > z + sizeZ || z > this.pos.z + this.size.z)) && checkZ && (this.pos.z >= z + sizeZ || z >= this.pos.z + this.size.z)) return false;
            if (forceCheck && shape && shape != ig.COLLSHAPE.RECTANGLE) {
                var slopeValue;
                x = x + sizeX / 2;
                y = y + sizeY / 2;
                switch (shape) {
                    case ig.COLLSHAPE.SLOPE_NE:
                        slopeValue = this.pos.x - x - (this.pos.y + this.size.y - y);
                        break;
                    case ig.COLLSHAPE.SLOPE_SE:
                        slopeValue = this.pos.x - x + (this.pos.y - y);
                        break;
                    case ig.COLLSHAPE.SLOPE_SW:
                        slopeValue = -(this.pos.x + this.size.x - x) + (this.pos.y - y);
                        break;
                    case ig.COLLSHAPE.SLOPE_NW:
                        slopeValue = -(this.pos.x + this.size.x - x) - (this.pos.y + this.size.y - y);
                }
                slopeValue >= -ig.COLLISION.EPS && (forceCheck = false);
            }
            return forceCheck;
        },

        trace: function (result, x, y, z, velX, velY, sizeX, sizeY, height, tolerateHeight) {
            if (this.ignoreCollision) return false;
            var rightOf = x + (velX < 0 ? velX : 0) >= this.pos.x + this.size.x;
            var leftOf = x + sizeX + (velX > 0 ? velX : 0) <= this.pos.x;
            var below = y + (velY < 0 ? velY : 0) >= this.pos.y + this.size.y;
            var above = y + sizeY + (velY > 0 ? velY : 0) <= this.pos.y;
            var zCheck = z + height <= this.pos.z;
            var zOverlap = this.pos.z + this.getOverlapHeight(x, y, sizeX, sizeY, true) <= z + (tolerateHeight ? ig.COLLISION.HEIGHT_TOLERATE : 0);
            if (rightOf || leftOf || below || above || zCheck || zOverlap) return false;
            if (this.heightShape && !(x >= this.pos.x + this.size.x || x + sizeX <= this.pos.x || y >= this.pos.y + this.size.y || y + sizeY <= this.pos.y)) {
                Vec2.assignC(scratchVec2B, 0, 0);
                switch (this.heightShape) {
                    case ig.COLL_HEIGHT_SHAPE.NORTH_UP:
                        scratchVec2B.y = -1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.EAST_UP:
                        scratchVec2B.x = 1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.SOUTH_UP:
                        scratchVec2B.y = 1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.WEST_UP:
                        scratchVec2B.x = -1;
                }
                if (scratchVec2B.x * velX + scratchVec2B.y * velY > 0) {
                    result.dist = 0;
                    result.dir.x = scratchVec2B.x;
                    result.dir.y = scratchVec2B.y;
                    return true;
                }
            }
            if (velX != 0 && velY != 0) {
                rightOf = x + velX + (velX < 0 ? sizeX : 0) - (this.pos.x + (velX > 0 ? this.size.x : 0));
                below = y + velY + (velY > 0 ? sizeY : 0) - (this.pos.y + (velY < 0 ? this.size.y : 0));
                if (rightOf * velX >= 0 && below * velY >= 0 && Math.abs(rightOf) < Math.abs(velX) && Math.abs(below) < Math.abs(velY) && Math.abs(rightOf / below) > Math.abs(velX / velY)) return false;
                below = y + velY + (velY < 0 ? sizeY : 0) - (this.pos.y + (velY > 0 ? this.size.y : 0));
                rightOf = x + velX + (velX > 0 ? sizeX : 0) - (this.pos.x + (velX < 0 ? this.size.x : 0));
                if (rightOf * velX >= 0 && below * velY >= 0 && Math.abs(rightOf) < Math.abs(velX) && Math.abs(below) < Math.abs(velY) && Math.abs(below / rightOf) > Math.abs(velY / velX)) return false;
            }
            return this.shape == ig.COLLSHAPE.RECTANGLE ? ig.MAP.Collision.solveBlockCollision(result, x, y, velX, velY, sizeX, sizeY, this.pos.x, this.pos.y, this.size.x, this.size.y) : ig.MAP.Collision.solveBlockCollision(result, x, y, velX, velY, sizeX, sizeY, this.pos.x, this.pos.y, this.size.x, this.size.y, this.shape - 2);
        },

        getOverlapCenterCoords: function (other, out) {
            var coord = out || {};
            coord.x = (Math.max(this.pos.x, other.pos.x) + Math.min(this.pos.x + this.size.x, other.pos.x + other.size.x)) / 2;
            coord.y = (Math.max(this.pos.y, other.pos.y) + Math.min(this.pos.y + this.size.y, other.pos.y + other.size.y)) / 2;
            coord.z = (Math.max(this.pos.z, other.pos.z) + Math.min(this.pos.z + this.size.z, other.pos.z + other.size.z)) / 2;
            coord.x = coord.x.limit(this.pos.x, this.pos.x + this.size.x);
            coord.y = coord.y.limit(this.pos.y, this.pos.y + this.size.y);
            return coord;
        },

        setGroundEntry: function (entry) {
            if (this._collData) {
                var changed = entry != this._collData.groundEntry;
                if (changed && this._collData.groundEntry && this._collData.groundEntry.entity.onGroundRemove) this._collData.groundEntry.entity.onGroundRemove(this.entity);
                if ((this._collData.groundEntry = entry)) {
                    this._collData.groundEntryOffset.x = this.pos.x - entry.pos.x;
                    this._collData.groundEntryOffset.y = this.pos.y - entry.pos.y;
                    if (changed && entry.entity.onGroundAdd) entry.entity.onGroundAdd(this.entity);
                }
            }
        },

        getOverlapHeight: function (x, y, sizeX, sizeY, ignoreRatio) {
            switch (this.heightShape) {
                case ig.COLL_HEIGHT_SHAPE.NONE:
                    return this.size.z;
                case ig.COLL_HEIGHT_SHAPE.NORTH_UP:
                    return ignoreRatio && this.size.z / this.size.y > 4 ? this.size.z : (-(y - this.pos.y - this.size.y) / this.size.y).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.EAST_UP:
                    return ignoreRatio && this.size.z / this.size.x > 4 ? this.size.z : ((x + sizeX - this.pos.x) / this.size.x).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.SOUTH_UP:
                    return ignoreRatio && this.size.z / this.size.y > 4 ? this.size.z : ((y + sizeY - this.pos.y) / this.size.y).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.WEST_UP:
                    return ignoreRatio && this.size.z / this.size.x > 4 ? this.size.z : (-(x - this.pos.x - this.size.x) / this.size.x).limit(0, 1) * this.size.z;
            }
        },

        handleMovementTrace: function (result) {
            if (result.collided) {
                if (this.bounciness > 0 && Math.abs(this.vel.y) + Math.abs(this.vel.x) > this.minBounceVelocity) {
                    var bounceDot = this.vel.x * result.blockDir.x + this.vel.y * result.blockDir.y;
                    this.vel.x = this.vel.x - 2 * bounceDot * result.blockDir.x;
                    this.vel.y = this.vel.y - 2 * bounceDot * result.blockDir.y;
                    this.vel.x = this.vel.x * this.bounciness;
                    this.vel.y = this.vel.y * this.bounciness;
                } else if (!result.slipped) {
                    if (result.frameVel.x == 0 && result.blockDir.x * this.vel.x >= 0) this.vel.x = 0;
                    if (result.frameVel.y == 0 && result.blockDir.y * this.vel.y >= 0) this.vel.y = 0;
                }
            }
        }
    });

    ig.CollTools = {
        getNamedSubCollEntity: function (coll, name) {
            for (var subColls = coll.subColls, i = subColls.length; i--;) {
                if (subColls[i].entity.partName == name) return subColls[i].entity;
            }
        },

        isInScreen: function (coll, marginX, marginY) {
            marginX === void 0 && (marginX = 0);
            marginY === void 0 && (marginY = marginX);
            return coll.pos.x + coll.size.x + marginX < ig.game.screen.x || coll.pos.x - marginX > ig.game.screen.x + ig.system.width || coll.pos.y - coll.pos.z + coll.size.y + marginY < ig.game.screen.y || coll.pos.y - coll.pos.z - coll.size.z - marginY > ig.game.screen.y + ig.system.height ? false : true;
        },

        getDistVec2: function (a, b, out) {
            out.x = b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2);
            out.y = b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2);
            return out;
        },

        getDistVec3: function (a, b, out) {
            out.x = b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2);
            out.y = b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2);
            out.z = b.pos.z - a.pos.z;
            return out;
        },

        getGroundDistance: function (a, b) {
            var dx = a.pos.x + a.size.x / 2 - (b.pos.x + b.size.x / 2);
            var dy = a.pos.y + a.size.y / 2 - (b.pos.y + b.size.y / 2);
            return Math.sqrt(dx * dx + dy * dy);
        },

        getScreenDistance: function (a, b) {
            var dx = a.pos.x + a.size.x / 2 - (b.pos.x + b.size.x / 2);
            var dy = a.pos.y - a.pos.z + a.size.y / 2 - a.size.z / 2 - (b.pos.y - b.pos.z + b.size.y / 2 - -b.size.z / 2);
            return Math.sqrt(dx * dx + dy * dy);
        },

        getAngle: function (a, b) {
            return Math.atan2(b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2), b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2));
        },

        isCloseToEdge: function (coll) {
            coll = coll._collData;
            return !coll ? false : coll.holeInfo.mapRes != 0 || (coll.groundEntry && !coll.groundEntry.entity.respawnOkay) || coll.overlapEntry;
        },

        intersect: function (a, b, checkZ) {
            return !checkZ && a.pos.z >= b.pos.z + b.size.z || b.pos.z >= a.pos.z + a.size.z || a.pos.x >= b.pos.x + b.size.x || b.pos.x >= a.pos.x + a.size.x || a.pos.y >= b.pos.y + b.size.y || b.pos.y >= a.pos.y + a.size.y ? false : true;
        },

        getCenterXYAlignedPos: function (out, a, b, offset) {
            var pos = b.pos;
            var aSize = a.size;
            var bSize = b.size;
            Vec3.assignC(out, pos.x + bSize.x / 2 - aSize.x / 2 + (offset && offset.x || 0), pos.y + bSize.y / 2 - aSize.y / 2 + (offset && offset.y || 0), a.pos.z + (offset && offset.z || 0));
            return out;
        },

        getOverlapArea: function (a, x, y, sizeX, sizeY) {
            return (Math.max(a.pos.x, x) - Math.min(a.pos.x + a.size.x, x + sizeX)) * (Math.max(a.pos.y, y) - Math.min(a.pos.y + a.size.y, y + sizeY));
        },

        isMinOverlap: function (a, b, minX, minY) {
            return a.pos.x + a.size.x - b.pos.x < minX || b.pos.x + b.size.x - a.pos.x < minX || a.pos.y + a.size.y - b.pos.y < minY || b.pos.y + b.size.y - a.pos.y < minY ? false : true;
        },

        isPostMoveOverHole: function (coll, type) {
            var dir = Vec2.assign(scratchVec2A, coll.accelDir);
            Vec2.length(dir, Math.max(ig.system.tick * 3 * Vec2.length(coll.vel), coll.size.x * 0.75));
            return ig.game.isOverHole(coll.pos.x + dir.x, coll.pos.y + dir.y, coll.pos.z, coll.size.x, coll.size.y, type, true);
        },

        getJumpDuration: function (coll, targetZ, startZVel) {
            var zVel = coll.vel.z;
            var gravity = coll.zGravityFactor * -ig.game.gravity;
            var startZ = coll.pos.z;
            startZVel !== void 0 && (zVel = startZVel);
            if (gravity == 0) return (targetZ - startZ) / zVel;
            targetZ = zVel * zVel - 2 * gravity * (startZ - targetZ);
            if (targetZ < 0) return -1;
            targetZ = Math.sqrt(targetZ);
            return Math.max((-zVel - targetZ) / gravity, (-zVel + targetZ) / gravity);
        },

        getJumpSpeedForDuration: function (coll, targetZ, duration) {
            var gravity = coll.zGravityFactor * -ig.game.gravity;
            return gravity == 0 ? 1 : (targetZ - coll.pos.z) / duration - gravity * duration / 2;
        },

        getJumpZenitDuration: function (coll) {
            return -coll.vel.z / (coll.zGravityFactor * -ig.game.gravity);
        },

        getJumpSpeedToHeight: function (coll, height) {
            return coll.pos.z < height ? Math.sqrt((coll.pos.z - height) * 2 * coll.zGravityFactor * -ig.game.gravity) : 0;
        },

        getMaxDistMoveFactor: function (coll, target, distance) {
            var distVec = this.getDistVec2(target, coll, scratchVec2A);
            var dir = Vec2.assign(scratchVec2B, coll.accelDir);
            Vec2.length(dir, coll.maxVel * coll.relativeVel * ig.system.tick);
            coll = Vec2.dot(dir, dir);
            dir = Vec2.dot(distVec, dir);
            distance = Vec2.dot(distVec, distVec) - distance * distance;
            distance = dir * dir - coll * distance;
            if (distance < 0) return -1;
            distance = Math.sqrt(distance);
            return (-dir + distance) / coll;
        },

        hasWallCollide: function (coll, angleFactor) {
            return !(coll.totalBlockTimer > 0 || coll.partlyBlockTimer > 0) ? false : !angleFactor ? true : Vec2.angle(coll.vel, coll._collData.blockDir) < Math.PI * 2 * angleFactor;
        }
    };

    var scratchVec2A = Vec2.create();
    var scratchVec2B = Vec2.create();
});
ig.baked = !0;
