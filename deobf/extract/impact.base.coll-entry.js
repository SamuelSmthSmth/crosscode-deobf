ig.module("impact.base.coll-entry").defines(function() {
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
    var b = {};
    ig.CollEntry = ig.Class.extend({
        entity: null,
        _active: false,
        _inCollisionMap: false,
        _killed: false,
        type: 0,
        updateType: ig.COLL_UPDATE_TYPE.DYNAMIC,
        shape: 1,
        heightShape: ig.COLL_HEIGHT_SHAPE.NONE,
        size: {
            x: 0,
            y: 0,
            z: 0
        },
        alwaysRender: false,
        padding: {
            x: 0,
            y: 0
        },
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
        maxZVel: 1E3,
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
        init: function(a) {
            this.entity = a;
            this.reset()
        },
        initCollData: function() {
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
            return true
        },
        reset: function() {
            var a = this.constructor.prototype;
            this._active = a.active;
            this._inCollisionMap = a._inCollisionMap;
            this._killed = a._killed;
            this.time.globalStatic = a.time.globalStatic;
            this.time.animStatic = a.time.animStatic;
            this.time.factor = a.time.factor;
            this.time.logicFactor = a.time.logicFactor;
            this.type = a.type;
            this.updateType = a.updateType;
            this.shape = a.shape;
            this.heightShape = a.heightShape;
            Vec3.assign(this.size, a.size);
            Vec2.assign(this.padding, a.padding);
            this.ignoreCollision = a.ignoreCollision;
            this.groundConnect = a.groundConnect;
            this.groundSlip = a.groundSlip;
            this.weight = a.weight;
            this.friction.ground = a.friction.ground;
            this.friction.terrain = a.friction.terrain;
            this.friction.air = a.friction.air;
            this.friction.ignoreTerrain = a.friction.ignoreTerrain;
            this.accelSpeed = a.accelSpeed;
            this.maxVel = a.maxVel;
            this.noSlipping = a.noSlipping;
            this.relativeVel = a.relativeVel;
            this.bounciness = a.bounciness;
            this.zBounciness = a.zBounciness;
            this.minBounceVelocity = a.minBounceVelocity;
            this.zGravityFactor = a.zGravityFactor;
            this.float.height = a.float.height;
            this.float.variance = a.float.variance;
            this.float.maxSpeed = a.float.maxSpeed;
            this.float.accel = a.float.accel;
            Vec3.assign(this.pos, a.pos);
            this.level = a.level;
            this.baseZPos =
                a.baseZPos;
            this.shadow.size = a.shadow.size;
            this.shadow.scaleY = a.shadow.scaleY;
            this.shadow.type = a.shadow.type;
            this.shadow.offset.x = a.shadow.offset.x;
            this.shadow.offset.y = a.shadow.offset.y;
            Vec3.assign(this.vel, a.vel);
            Vec2.assign(this.pushVel, a.pushVel);
            Vec3.assign(this.accelDir, a.accelDir);
            this.parentColl = a.parentColl;
            this.parentGroup = a.parentGroup;
            this.subColls.length = 0;
            this.totalBlockTimer = a.totalBlockTimer;
            this.partlyBlockTimer = a.partlyBlockTimer;
            this.updated = a.updated;
            this._collData = a._collData;
            this._collisionList.length = 0;
            this._collisionListData.length = 0;
            this.alwaysRender = a.alwaysRender;
            this.edgeSlipInward = a.edgeSlipInward
        },
        setPos: function(a, b, d, g) {
            var h = 0,
                i = 0,
                j = 0,
                k = !isNaN(a) || !isNaN(b);
            if (k && g && this._collData) {
                this._collData.frameVel.x = a - this.pos.x;
                this._collData.frameVel.y = b - this.pos.y;
                this._collData.frameVel.z = d - this.pos.z;
                this._collData.forceMoveFrameVel = true
            } else {
                (g = k && this._inCollisionMap) && ig.game.physics.removeFromCollMap(this);
                if (!isNaN(a)) {
                    h = a - this.pos.x;
                    this.pos.x = a
                }
                if (!isNaN(b)) {
                    i =
                        b - this.pos.y;
                    this.pos.y = b
                }
                g && ig.game.physics.addToCollMap(this);
                if (!isNaN(d)) {
                    j = d - this.pos.z;
                    this.pos.z = d;
                    this.level = ig.game.getLevelIdx(this.pos.z);
                    this.baseZPos = Math.min(this.baseZPos, this.pos.z);
                    this._collData && (this._collData.zBaseUncertain = true)
                }
                if (this._collData) {
                    if (!this._collData.skipPhysics) {
                        this._collData.skipPhysics = true;
                        this._collData.frameVel.x = this._collData.frameVel.y = this._collData.frameVel.z = 0
                    }
                    this._collData.frameVel.x = this._collData.frameVel.x + h;
                    this._collData.frameVel.y = this._collData.frameVel.y +
                        i;
                    this._collData.frameVel.z = j;
                    if (this._collData.groundEntry) {
                        this._collData.groundEntryOffset.x = this._collData.groundEntryOffset.x + h;
                        this._collData.groundEntryOffset.y = this._collData.groundEntryOffset.y + i
                    }
                }
                if (isNaN(this.pos.x) || isNaN(this.pos.y) || isNaN(this.pos.z)) throw Error("Position update leads to NaN coordinate!");
            }
        },
        setType: function(a) {
            var b = a != ig.COLLTYPE.PASSIVE && a != ig.COLLTYPE.NONE;
            this.type = a;
            ig.game.physics && !this.entity._hidden && (this._inCollisionMap && !b ? ig.game.physics.removeFromCollMap(this) :
                !this._inCollisionMap && b && ig.game.physics.addToCollMap(this))
        },
        setUpdateType: function(a) {
            if (this.updateType != a) {
                var b = this.updateType;
                this.updateType = a;
                this._active && b == ig.COLL_UPDATE_TYPE.STATIC && ig.game.physics.addToUpdateList(this)
            }
        },
        setSize: function(a, d, f, g, h) {
            if (!(a == this.size.x && d == this.size.y && f == this.size.z)) {
                var i = this._inCollisionMap;
                i && ig.game.physics.removeFromCollMap(this);
                if (g) {
                    var g = (a - this.size.x) / 2,
                        j = (d - this.size.y) / 2;
                    if (h) {
                        var k = h = 0,
                            l = null;
                        if (g > 0) {
                            l = ig.game.physics.initTraceResult(b);
                            ig.game.traceEntity(l, this.entity, g, 0, 0, 0, 0) && (h = -Math.ceil((1 - l.dist) * g));
                            l = ig.game.physics.initTraceResult(b);
                            ig.game.traceEntity(l, this.entity, -g, 0, 0, 0, 0) && (h = h ? 0 : Math.ceil((1 - l.dist) * g))
                        }
                        if (j > 0) {
                            l = ig.game.physics.initTraceResult(b);
                            ig.game.traceEntity(l, this.entity, 0, j, 0, 0, 0) && (k = -Math.ceil((1 - l.dist) * j));
                            l = ig.game.physics.initTraceResult(b);
                            ig.game.traceEntity(l, this.entity, 0, -j, 0, 0, 0) && (k = k ? 0 : Math.ceil((1 - l.dist) * j))
                        }
                        g = g - h;
                        j = j - k
                    }
                    this.pos.x = this.pos.x - g;
                    this.pos.y = this.pos.y - j;
                    if (this._collData &&
                        this._collData.groundEntry) {
                        this._collData.groundEntryOffset.x = this._collData.groundEntryOffset.x - g;
                        this._collData.groundEntryOffset.y = this._collData.groundEntryOffset.y - j
                    }
                }
                this.size.x = a;
                this.size.y = d;
                this.size.z = f;
                i && ig.game.physics.addToCollMap(this)
            }
        },
        setPadding: function(a, b) {
            var d = this._inCollisionMap;
            d && ig.game.physics.removeFromCollMap(this);
            this.padding.x = a;
            this.padding.y = b;
            d && ig.game.physics.addToCollMap(this)
        },
        getCenter: function(a) {
            a = a || Vec2.create();
            Vec2.assignC(a, this.pos.x + this.size.x /
                2, this.pos.y + this.size.y / 2);
            return a
        },
        addSubCollEntry: function(a) {
            this.subColls.push(a);
            a.parentColl = this
        },
        getTick: function(a, b) {
            if (this.time.parent) return this.time.parent.getTick(this.time.parentAnimToGlobal || a, b);
            var d = this.time.globalStatic;
            !d && (a && this.time.animStatic) && (d = true);
            d = d ? ig.system.actualTick : ig.system.ingameTick;
            d = d * this.time.factor;
            b || (d = d * this.time.logicFactor);
            return d
        },
        update: function() {
            var b = this.friction.ignoreTerrain ? 1 : this.friction.terrain,
                e = this.pos.z > this.baseZPos || this.vel.z >
                0 ? this.friction.air : this.friction.ground * b;
            if (Math.abs(this.vel.x) < 2 && this.accelDir.x == 0) this.vel.x = 0;
            if (Math.abs(this.vel.y) < 2 && this.accelDir.y == 0) this.vel.y = 0;
            var b = this.maxVel * this.relativeVel * this.time.moveXYFactor,
                f = Vec2.mulF(this.vel, e * 12 * ig.system.tick, d);
            if (this.accelDir.x || this.accelDir.y) {
                Vec2.normalize(this.accelDir);
                var g = Vec2.length(this.vel);
                if (g <= b + ig.COLLISION.EPS) {
                    var g = b,
                        h = Vec2.dot(this.accelDir, f);
                    h >= 0 && Vec2.sub(f, Vec2.mulF(this.accelDir, h, a))
                }
                e = Vec2.mulF(this.accelDir, b * 10 * e * this.accelSpeed,
                    a);
                this.vel.x = this.vel.x + e.x * ig.system.tick;
                this.vel.y = this.vel.y + e.y * ig.system.tick;
                Vec2.limit(this.vel, 0, Math.max(g, b))
            }
            this.vel.x = this.vel.x - f.x;
            this.vel.y = this.vel.y - f.y
        },
        contains: function(a, b, d) {
            return !(this.pos.x > a || this.pos.x + this.size.x < a || this.pos.y - this.pos.z - (d ? this.size.z : 0) > b || this.pos.y - this.pos.z + this.size.y < b)
        },
        intersectsWith: function(a, b, d, g, h, i, j, k, l) {
            if ((j = (j || !this.ignoreCollision) && !(this.pos.x - this.padding.x >= a + g || this.pos.x + this.padding.x + this.size.x <= a || this.pos.y - this.padding.y >=
                    b + h || this.pos.y + this.padding.y + this.size.y <= b || this.pos.z > d + i || d > this.pos.z + this.size.z)) && l && (this.pos.z >= d + i || d >= this.pos.z + this.size.z)) return false;
            if (j && k && k != ig.COLLSHAPE.RECTANGLE) {
                var o, a = a + g / 2,
                    b = b + h / 2;
                switch (k) {
                    case ig.COLLSHAPE.SLOPE_NE:
                        o = this.pos.x - a - (this.pos.y + this.size.y - b);
                        break;
                    case ig.COLLSHAPE.SLOPE_SE:
                        o = this.pos.x - a + (this.pos.y - b);
                        break;
                    case ig.COLLSHAPE.SLOPE_SW:
                        o = -(this.pos.x + this.size.x - a) + (this.pos.y - b);
                        break;
                    case ig.COLLSHAPE.SLOPE_NW:
                        o = -(this.pos.x + this.size.x - a) - (this.pos.y +
                            this.size.y - b)
                }
                o >= -ig.COLLISION.EPS && (j = false)
            }
            return j
        },
        trace: function(b, d, f, g, h, i, j, k, l, o) {
            if (this.ignoreCollision) return false;
            var m = d + (h < 0 ? h : 0) >= this.pos.x + this.size.x,
                n = d + j + (h > 0 ? h : 0) <= this.pos.x,
                p = f + (i < 0 ? i : 0) >= this.pos.y + this.size.y,
                r = f + k + (i > 0 ? i : 0) <= this.pos.y,
                l = g + l <= this.pos.z,
                g = this.pos.z + this.getOverlapHeight(d, f, j, k, true) <= g + (o ? ig.COLLISION.HEIGHT_TOLERATE : 0);
            if (m || n || p || r || l || g) return false;
            if (this.heightShape && !(d >= this.pos.x + this.size.x || d + j <= this.pos.x || f >= this.pos.y + this.size.y || f + k <=
                    this.pos.y)) {
                Vec2.assignC(a, 0, 0);
                switch (this.heightShape) {
                    case ig.COLL_HEIGHT_SHAPE.NORTH_UP:
                        a.y = -1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.EAST_UP:
                        a.x = 1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.SOUTH_UP:
                        a.y = 1;
                        break;
                    case ig.COLL_HEIGHT_SHAPE.WEST_UP:
                        a.x = -1
                }
                if (a.x * h + a.y * i > 0) {
                    b.dist = 0;
                    b.dir.x = a.x;
                    b.dir.y = a.y;
                    return true
                }
            }
            if (h != 0 && i != 0) {
                m = d + h + (h < 0 ? j : 0) - (this.pos.x + (h > 0 ? this.size.x : 0));
                n = f + i + (i > 0 ? k : 0) - (this.pos.y + (i < 0 ? this.size.y : 0));
                if (m * h >= 0 && n * i >= 0 && Math.abs(m) < Math.abs(h) && Math.abs(n) < Math.abs(i) && Math.abs(m / n) > Math.abs(h /
                        i)) return false;
                n = f + i + (i < 0 ? k : 0) - (this.pos.y + (i > 0 ? this.size.y : 0));
                m = d + h + (h > 0 ? j : 0) - (this.pos.x + (h < 0 ? this.size.x : 0));
                if (m * h >= 0 && n * i >= 0 && Math.abs(m) < Math.abs(h) && Math.abs(n) < Math.abs(i) && Math.abs(n / m) > Math.abs(i / h)) return false
            }
            return this.shape == ig.COLLSHAPE.RECTANGLE ? ig.MAP.Collision.solveBlockCollision(b, d, f, h, i, j, k, this.pos.x, this.pos.y, this.size.x, this.size.y) : ig.MAP.Collision.solveBlockCollision(b, d, f, h, i, j, k, this.pos.x, this.pos.y, this.size.x, this.size.y, this.shape - 2)
        },
        getOverlapCenterCoords: function(a,
            b) {
            var d = b || {};
            d.x = (Math.max(this.pos.x, a.pos.x) + Math.min(this.pos.x + this.size.x, a.pos.x + a.size.x)) / 2;
            d.y = (Math.max(this.pos.y, a.pos.y) + Math.min(this.pos.y + this.size.y, a.pos.y + a.size.y)) / 2;
            d.z = (Math.max(this.pos.z, a.pos.z) + Math.min(this.pos.z + this.size.z, a.pos.z + a.size.z)) / 2;
            d.x = d.x.limit(this.pos.x, this.pos.x + this.size.x);
            d.y = d.y.limit(this.pos.y, this.pos.y + this.size.y);
            return d
        },
        setGroundEntry: function(a) {
            if (this._collData) {
                var b = a != this._collData.groundEntry;
                if (b && this._collData.groundEntry && this._collData.groundEntry.entity.onGroundRemove) this._collData.groundEntry.entity.onGroundRemove(this.entity);
                if (this._collData.groundEntry = a) {
                    this._collData.groundEntryOffset.x = this.pos.x - a.pos.x;
                    this._collData.groundEntryOffset.y = this.pos.y - a.pos.y;
                    if (b && a.entity.onGroundAdd) a.entity.onGroundAdd(this.entity)
                }
            }
        },
        getOverlapHeight: function(a, b, d, g, h) {
            switch (this.heightShape) {
                case ig.COLL_HEIGHT_SHAPE.NONE:
                    return this.size.z;
                case ig.COLL_HEIGHT_SHAPE.NORTH_UP:
                    return h && this.size.z / this.size.y > 4 ? this.size.z : (-(b - this.pos.y - this.size.y) / this.size.y).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.EAST_UP:
                    return h &&
                        this.size.z / this.size.x > 4 ? this.size.z : ((a + d - this.pos.x) / this.size.x).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.SOUTH_UP:
                    return h && this.size.z / this.size.y > 4 ? this.size.z : ((b + g - this.pos.y) / this.size.y).limit(0, 1) * this.size.z;
                case ig.COLL_HEIGHT_SHAPE.WEST_UP:
                    return h && this.size.z / this.size.x > 4 ? this.size.z : (-(a - this.pos.x - this.size.x) / this.size.x).limit(0, 1) * this.size.z
            }
        },
        handleMovementTrace: function(a) {
            if (a.collided)
                if (this.bounciness > 0 && Math.abs(this.vel.y) + Math.abs(this.vel.x) > this.minBounceVelocity) {
                    var b =
                        this.vel.x * a.blockDir.x + this.vel.y * a.blockDir.y;
                    this.vel.x = this.vel.x - 2 * b * a.blockDir.x;
                    this.vel.y = this.vel.y - 2 * b * a.blockDir.y;
                    this.vel.x = this.vel.x * this.bounciness;
                    this.vel.y = this.vel.y * this.bounciness
                } else if (!a.slipped) {
                if (a.frameVel.x == 0 && a.blockDir.x * this.vel.x >= 0) this.vel.x = 0;
                if (a.frameVel.y == 0 && a.blockDir.y * this.vel.y >= 0) this.vel.y = 0
            }
        }
    });
    ig.CollTools = {
        getNamedSubCollEntity: function(a, b) {
            for (var d = a.subColls, g = d.length; g--;)
                if (d[g].entity.partName == b) return d[g].entity
        },
        isInScreen: function(a,
            b, d) {
            b === void 0 && (b = 0);
            d === void 0 && (d = b);
            return a.pos.x + a.size.x + b < ig.game.screen.x || a.pos.x - b > ig.game.screen.x + ig.system.width || a.pos.y - a.pos.z + a.size.y + d < ig.game.screen.y || a.pos.y - a.pos.z - a.size.z - d > ig.game.screen.y + ig.system.height ? false : true
        },
        getDistVec2: function(a, b, d) {
            d.x = b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2);
            d.y = b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2);
            return d
        },
        getDistVec3: function(a, b, d) {
            d.x = b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2);
            d.y = b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2);
            d.z = b.pos.z -
                a.pos.z;
            return d
        },
        getGroundDistance: function(a, b) {
            var d = a.pos.x + a.size.x / 2 - (b.pos.x + b.size.x / 2),
                g = a.pos.y + a.size.y / 2 - (b.pos.y + b.size.y / 2);
            return Math.sqrt(d * d + g * g)
        },
        getScreenDistance: function(a, b) {
            var d = a.pos.x + a.size.x / 2 - (b.pos.x + b.size.x / 2),
                g = a.pos.y - a.pos.z + a.size.y / 2 - a.size.z / 2 - (b.pos.y - b.pos.z + b.size.y / 2 - -b.size.z / 2);
            return Math.sqrt(d * d + g * g)
        },
        getAngle: function(a, b) {
            return Math.atan2(b.pos.y + b.size.y / 2 - (a.pos.y + a.size.y / 2), b.pos.x + b.size.x / 2 - (a.pos.x + a.size.x / 2))
        },
        isCloseToEdge: function(a) {
            a =
                a._collData;
            return !a ? false : a.holeInfo.mapRes != 0 || a.groundEntry && !a.groundEntry.entity.respawnOkay || a.overlapEntry
        },
        intersect: function(a, b, d) {
            return !d && a.pos.z >= b.pos.z + b.size.z || b.pos.z >= a.pos.z + a.size.z || a.pos.x >= b.pos.x + b.size.x || b.pos.x >= a.pos.x + a.size.x || a.pos.y >= b.pos.y + b.size.y || b.pos.y >= a.pos.y + a.size.y ? false : true
        },
        getCenterXYAlignedPos: function(a, b, d, g) {
            var h = d.pos,
                i = b.size,
                d = d.size;
            Vec3.assignC(a, h.x + d.x / 2 - i.x / 2 + (g && g.x || 0), h.y + d.y / 2 - i.y / 2 + (g && g.y || 0), b.pos.z + (g && g.z || 0));
            return a
        },
        getOverlapArea: function(a,
            b, d, g, h) {
            return (Math.max(a.pos.x, b) - Math.min(a.pos.x + a.size.x, b + g)) * (Math.max(a.pos.y, d) - Math.min(a.pos.y + a.size.y, d + h))
        },
        isMinOverlap: function(a, b, d, g) {
            return a.pos.x + a.size.x - b.pos.x < d || b.pos.x + b.size.x - a.pos.x < d || a.pos.y + a.size.y - b.pos.y < g || b.pos.y + b.size.y - a.pos.y < g ? false : true
        },
        isPostMoveOverHole: function(b, d) {
            var f = Vec2.assign(a, b.accelDir);
            Vec2.length(f, Math.max(ig.system.tick * 3 * Vec2.length(b.vel), b.size.x * 0.75));
            return ig.game.isOverHole(b.pos.x + f.x, b.pos.y + f.y, b.pos.z, b.size.x, b.size.y, d,
                true)
        },
        getJumpDuration: function(a, b, d) {
            var g = a.vel.z,
                h = a.zGravityFactor * -ig.game.gravity,
                a = a.pos.z;
            d !== void 0 && (g = d);
            if (h == 0) return (b - a) / g;
            b = g * g - 2 * h * (a - b);
            if (b < 0) return -1;
            b = Math.sqrt(b);
            return Math.max((-g - b) / h, (-g + b) / h)
        },
        getJumpSpeedForDuration: function(a, b, d) {
            var g = a.zGravityFactor * -ig.game.gravity;
            return g == 0 ? 1 : (b - a.pos.z) / d - g * d / 2
        },
        getJumpZenitDuration: function(a) {
            return -a.vel.z / (a.zGravityFactor * -ig.game.gravity)
        },
        getJumpSpeedToHeight: function(a, b) {
            return a.pos.z < b ? Math.sqrt((a.pos.z - b) * 2 * a.zGravityFactor *
                -ig.game.gravity) : 0
        },
        getMaxDistMoveFactor: function(b, e, f) {
            var e = this.getDistVec2(e, b, a),
                g = Vec2.assign(d, b.accelDir);
            Vec2.length(g, b.maxVel * b.relativeVel * ig.system.tick);
            b = Vec2.dot(g, g);
            g = Vec2.dot(e, g);
            f = Vec2.dot(e, e) - f * f;
            f = g * g - b * f;
            if (f < 0) return -1;
            f = Math.sqrt(f);
            return (-g + f) / b
        },
        hasWallCollide: function(a, b) {
            return !(a.totalBlockTimer > 0 || a.partlyBlockTimer > 0) ? false : !b ? true : Vec2.angle(a.vel, a._collData.blockDir) < Math.PI * 2 * b
        }
    };
    var a = Vec2.create(),
        d = Vec2.create()
});
ig.baked = !0;
