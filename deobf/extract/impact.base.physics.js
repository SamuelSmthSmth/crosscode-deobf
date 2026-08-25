ig.module("impact.base.physics").requires("impact.base.entity", "impact.base.coll-entry").defines(function() {
    function b(a, b) {
        a.pos.z = b;
        a.level = ig.game.getLevelIdx(a.pos.z)
    }
    var a = Vec2.create(),
        d = Vec2.create(),
        c = Vec2.create(),
        e = {},
        f = {},
        g = [],
        h = [];
    Vec2.create();
    var i = Vec2.create();
    ig.Physics = ig.Class.extend({
        cellSize: 64,
        collUpdateList: [],
        collOutOfScreenList: [],
        collEntryMap: [],
        _updateCount: 0,
        _trackEntityTouch: false,
        mapCleared: function() {
            this.collEntryMap.length = 0;
            this.collUpdateList.length = 0
        },
        mapLoaded: function() {
            var a =
                ig.game.size.y;
            this.collEntryMap.width = Math.ceil(ig.game.size.x / this.cellSize);
            this.collEntryMap.height = Math.ceil(a / this.cellSize) + 16;
            for (a = 0; a < this.collEntryMap.width; ++a) {
                this.collEntryMap[a] = [];
                for (var b = 0; b < this.collEntryMap.height; ++b) this.collEntryMap[a][b] = []
            }
            this.collUpdateList.length = 0
        },
        update: function() {
            this._updateCount = this._updateCount % 100;
            this._updateCount++;
            for (var a = [], b = this.collOutOfScreenList.length; b--;) {
                var c = this.collOutOfScreenList[b];
                if (c.updateType == ig.COLL_UPDATE_TYPE.STATIC) this.collOutOfScreenList.splice(b,
                    1);
                else if (c.updateType == ig.COLL_UPDATE_TYPE.DYNAMIC || c.updateType == ig.COLL_UPDATE_TYPE.ON_SCREEN && ig.CollTools.isInScreen(c, 16)) {
                    this.collOutOfScreenList.splice(b, 1);
                    this.collUpdateList.push(c)
                }
            }
            for (b = this.collUpdateList.length; b--;) {
                c = this.collUpdateList[b];
                this.updateCollEntry(c, a);
                if (c.updateType == ig.COLL_UPDATE_TYPE.STATIC) this.collUpdateList.splice(b, 1);
                else if (c.updateType == ig.COLL_UPDATE_TYPE.ON_SCREEN && !ig.CollTools.isInScreen(c, 16)) {
                    this.collUpdateList.splice(b, 1);
                    this.collOutOfScreenList.push(c)
                }
            }
            for (b =
                a.length; b--;) {
                for (var c = a[b], d = c._collisionList.length; d--;) {
                    var e = c._collisionList[d],
                        f = c._collisionListData[d];
                    if (!c._killed && !e._killed) {
                        if (c.weight >= 0 && f && f.dot) {
                            var g = e.weight == -1 || c.weight == 0 ? 1 : Math.min(1, e.weight / c.weight * 0.5);
                            c.pushVel.x = f.x * f.dot / ig.system.actualTick * g;
                            c.pushVel.y = f.y * f.dot / ig.system.actualTick * g;
                            e._collData.pushColl = c
                        }
                        c.entity.collideWith(e.entity, f || null)
                    }
                }
                c._collisionList.length = 0;
                c._collisionListData.length = 0
            }
            ig.system.ingameTick = ig.system.tick;
            a = this.collUpdateList;
            for (b = 0; b < a.length; b++) {
                d = a[b];
                if (c = d.entity)
                    if (d = d._collData) {
                        ig.system.tick = c.coll.getTick(false);
                        c.handleMovementTrace(d)
                    }
            }
            ig.system.tick = ig.system.ingameTick
        },
        updateCollEntry: function(a, b) {
            if (a._active && a.updated != this._updateCount) {
                a.updated = this._updateCount;
                ig.profile.updateEntity++;
                if (!a._killed) {
                    ig.vars.pushEntityAccessor(a.entity);
                    a.parentColl && this.updateCollEntry(a.parentColl, b);
                    a._collData && a._collData.groundEntry && this.updateCollEntry(a._collData.groundEntry, b);
                    if (a._collData && a._collData.pushColl) {
                        this.updateCollEntry(a._collData.pushColl,
                            b);
                        a._collData.pushColl = null
                    }
                    ig.system.ingameTick = ig.system.tick;
                    var c = a.getTick(false),
                        d = a.getTick(false, true),
                        e = a.entity,
                        f = 0;
                    e.animState && e.animState.hasAnimations() && (f = a.getTick(true));
                    if (c || d || f) {
                        ig.system.tick = c;
                        e.update();
                        ig.system.tick = d;
                        this.moveEntity(a, b)
                    }
                    if (f) {
                        ig.system.tick = f;
                        e.animState.update(e, e.animSpeedFactor)
                    }
                    ig.system.tick = ig.system.ingameTick;
                    ig.vars.popEntityAccessor(a.entity)
                }
            }
        },
        getEntitiesInRectangle: function(a, b, c, d, e, f, g, h, i) {
            var q = Math.floor(a / this.cellSize).limit(0, this.collEntryMap.width),
                s = Math.floor(b / this.cellSize).limit(0, this.collEntryMap.height),
                v = (Math.floor((a + d) / this.cellSize) + 1).limit(0, this.collEntryMap.width),
                y = (Math.floor((b + e) / this.cellSize) + 1).limit(0, this.collEntryMap.height),
                u = [];
            if (!this.collEntryMap.length) return u;
            for (; q < v; q++)
                for (var z = s; z < y; z++)
                    for (var D = this.collEntryMap[q][z], C = D.length; C--;) {
                        var A = D[C],
                            B = A.entity;
                        if (!(A.subColls.length > 0)) {
                            var w = A.parentColl && A.parentColl.entity;
                            B && (!g || B != g) && (!h || h.indexOf(B) == -1) && (!w || (!w || w != g) && (!h || h.indexOf(w) == -1)) &&
                                u.indexOf(B) == -1 && A.intersectsWith(a, b, c, d, e, f, false, null, i) && u.push(B)
                        }
                    }
            return u
        },
        getEntitiesInCircle: function(a, b, d, f, g, h, i, r, t, q, s) {
            Vec2.assign(c, a);
            for (var r = this.getEntitiesInRectangle(a.x - b, a.y - d * b, a.z, b * 2, d * b * 2, f, r, t), t = [], v = a.z, f = a.z + f, y = r.length; y--;) {
                var u = r[y],
                    z = u.coll;
                if (!(z.pos.z >= f || z.pos.z + z.size.z <= v)) {
                    Vec2.assign(c, z.pos);
                    c.x = c.x - z.padding.x <= a.x && c.x + z.padding.x + z.size.x >= a.x ? a.x : c.x + z.padding.x + z.size.x < a.x ? c.x + (z.size.x + z.padding.x) : c.x - z.padding.x;
                    if (c.y - z.padding.y <= a.y && c.y +
                        z.padding.y + z.size.y >= a.y) c.y = a.y;
                    else if (c.y + z.padding.y + z.size.y < a.y) c.y = c.y + (z.padding.y + z.size.y);
                    Vec2.sub(c, a);
                    c.y = c.y / d;
                    var D = Vec2.length(c);
                    if (q || !(D > b)) {
                        c.y = c.y * d;
                        if (!g || Vec2.isAngleInRange(c, g, h, i)) {
                            if (s) {
                                var C = ig.game.physics.initTraceResult(e);
                                if (z.padding.x || z.padding.y) {
                                    if (c.x) c.x = c.x + (c.x > 0 ? 1 : -1) * z.padding.x;
                                    if (c.y) c.y = c.y + (c.y > 0 ? 1 : -1) * z.padding.y;
                                    D = Vec2.length(c)
                                }
                                this.trace(C, a.x - 1, a.y - 1, Math.max(a.z, z.pos.z), c.x, c.y, 2, 2, 2, ig.COLLTYPE.IGNORE, z);
                                if (D * (1 - C.dist) > 8) continue
                            }
                            t.push(u)
                        }
                    }
                }
            }
            return t
        },
        initTraceResult: function(a) {
            if (!a.dir) a.dir = Vec2.create();
            Vec2.assignC(a.dir, 0, 0);
            a.dist = 1;
            a.levelUp = false;
            a.forcePushEntries = null;
            a.forcePushDirs = null;
            return a
        },
        trace: function(a, b, c, d, e, f, g, h, i, q, s, v, y) {
            for (var u = ig.game, z = u.maxLevel - 1; z && u.levels[z].height > d;) --z;
            for (var D = z + 1 < u.maxLevel && d + i > u.levels[z + 1].height, C = s && s._collData && s._collData.forceMoveFrameVel, A = Math.max(1, Math.ceil(Math.max(Math.abs(e), Math.abs(f)) / 16)), B = s && s.type == ig.COLLTYPE.TRIGGER, w = A, e = e / A, f = f / A, x = false, E = y && D && u.levels[z +
                    1].height - d <= ig.COLLISION.HEIGHT_TOLERATE, w = 0; w < A; w++) {
                var G = -1;
                if (!C && !B) {
                    if (!a.levelUp)
                        if ((x = u.levels[z].collision.trace(a, b, c - u.levels[z].height, e, f, g, h, true)) && E) {
                            x = false;
                            G = a.dist;
                            a.dist = 1
                        } D && (x = u.levels[z + 1].collision.trace(a, b, c - u.levels[z + 1].height, e, f, g, h, true, G == -1) || x)
                }
                x = this.traceOnEntryMap(a, b, c, d, e, f, g, h, i, q, s, v, y) || x;
                if (G != -1) a.levelUp = a.levelUp || a.dist > G;
                if (x) {
                    a.dist = (w + a.dist) / A;
                    return true
                }
                a.dist = 1;
                b = b + e;
                c = c + f
            }
            a.dist = 1;
            return false
        },
        addCollEntry: function(a) {
            a._active = true;
            this.addToUpdateList(a);
            this.addToCollMap(a)
        },
        removeCollEntry: function(a) {
            a._active = false;
            this.removeFromUpdateList(a);
            this.removeFromCollMap(a)
        },
        addToUpdateList: function(a) {
            this.collUpdateList.push(a)
        },
        removeFromUpdateList: function(a) {
            this.collUpdateList.erase(a)
        },
        addToCollMap: function(a) {
            if (!a._inCollisionMap && !(a.type == ig.COLLTYPE.NONE || a.type == ig.COLLTYPE.PASSIVE)) {
                a._inCollisionMap = true;
                for (var b = Math.max(0, Math.floor((a.pos.x - a.padding.x * 2) / this.cellSize)), c = Math.max(0, Math.floor((a.pos.y - a.padding.y * 2) / this.cellSize)),
                        d = Math.min(this.collEntryMap.width, Math.floor((a.pos.x + a.size.x + a.padding.x * 2) / this.cellSize) + 1), e = Math.min(this.collEntryMap.height, Math.floor((a.pos.y + a.size.y + a.padding.y * 2) / this.cellSize) + 1); d-- > b;)
                    for (var f = e; f-- > c;) this.collEntryMap[d][f].indexOf(a) == -1 && this.collEntryMap[d][f].push(a)
            }
        },
        removeFromCollMap: function(a) {
            if (a._inCollisionMap) {
                a._inCollisionMap = false;
                for (var b = Math.max(0, Math.floor((a.pos.x - a.padding.x * 2) / this.cellSize)), c = Math.max(0, Math.floor((a.pos.y - a.padding.y * 2) / this.cellSize)),
                        d = Math.min(this.collEntryMap.width, Math.floor((a.pos.x + a.size.x + a.padding.x * 2) / this.cellSize) + 1), e = Math.min(this.collEntryMap.height, Math.floor((a.pos.y + a.size.y + a.padding.y * 2) / this.cellSize) + 1); d-- > b;)
                    for (var f = e; f-- > c;) {
                        var g = this.collEntryMap[d][f].indexOf(a);
                        g != -1 && this.collEntryMap[d][f].splice(g, 1)
                    }
            }
        },
        moveEntity: function(c, f) {
            var l = !c.type && !c.shadow && !c.zGravityFactor;
            ig.profile.moveEntity++;
            var o = c.initCollData(),
                m = c._collData;
            m.collided = false;
            m.slipped = false;
            if (m.skipPhysics) {
                m.skipPhysics =
                    false;
                Vec2.assignC(i, 0, 0);
                o = Math.abs(c.pos.z - c.baseZPos) < ig.COLLISION.EPS;
                this.updateGroundEntity(c, i, o, 0, false);
                m.forceMoveFrameVel = false
            } else {
                if (ig.game.firstUpdateLoop) m.zPush = false;
                if (!m.forceMoveFrameVel) {
                    m.frameVel.x = 0;
                    m.frameVel.y = 0;
                    m.frameVel.z = 0
                }
                var n = c.pos.x,
                    p = c.pos.y,
                    r;
                r = m.forceMoveFrameVel ? Vec2.assign(i, m.frameVel) : Vec2.mulF(Vec2.add(c.vel, c.pushVel, i), ig.system.tick);
                var t = r.x != 0 || r.y != 0;
                if (isNaN(r.x) || isNaN(r.y)) throw Error("NaN!");
                if (!o && !m.forceMoveFrameVel && r.x == 0 && r.y == 0 && c.vel.z ==
                    0 && c.zGravityFactor == 0 && c.shadow == 0) m.forceMoveFrameVel = false;
                else {
                    c.pushVel.x = 0;
                    c.pushVel.y = 0;
                    if (m.groundEntry) {
                        var q = m.groundEntry;
                        if (q.heightShape && q.pos.z + q.size.z >= c.pos.z && c.vel.z <= 0)
                            if (q.heightShape == ig.COLL_HEIGHT_SHAPE.EAST_UP || q.heightShape == ig.COLL_HEIGHT_SHAPE.WEST_UP) {
                                r.x = r.x / (1 + q.size.z / q.size.x / 2);
                                if (q.size.z / q.size.x > 4) c.pushVel.x = c.pushVel.x + 200 * (q.heightShape == ig.COLL_HEIGHT_SHAPE.EAST_UP ? -1 : 1)
                            } else if (q.heightShape == ig.COLL_HEIGHT_SHAPE.NORTH_UP || q.heightShape == ig.COLL_HEIGHT_SHAPE.SOUTH_UP) {
                            r.y =
                                r.y / (1 + q.size.z / q.size.y / 2);
                            if (q.size.z / q.size.y > 4) c.pushVel.y = c.pushVel.y + 200 * (q.heightShape == ig.COLL_HEIGHT_SHAPE.SOUTH_UP ? -1 : 1)
                        }
                        if (!c.groundSlip && !c.float.height) {
                            if (!t) {
                                m.groundEntryOffset.x = Math.round(m.groundEntryOffset.x);
                                m.groundEntryOffset.y = Math.round(m.groundEntryOffset.y)
                            }
                            r.x = r.x + (q.pos.x + m.groundEntryOffset.x - n);
                            r.y = r.y + (q.pos.y + m.groundEntryOffset.y - p)
                        }
                        if (q._collData) {
                            c.baseZPos = c.baseZPos + q._collData.frameVel.z;
                            n = c.pos.z + q._collData.frameVel.z;
                            if (q._collData.frameVel.z < 0 && m.holeInfo.mapRes !=
                                2 && c.level >= 0) {
                                p = ig.game.levels[c.level].height;
                                if (n < p) {
                                    n = p;
                                    c.baseZPos = p
                                }
                            }
                            m.frameVel.z = n - c.pos.z;
                            b(c, n);
                            m.holeInfo.entryZ = m.holeInfo.entryZ + q._collData.frameVel.z
                        }
                    }
                    if ((q = m.overlapEntry) && c.weight != -1 && q.pos.z + q.size.z > c.pos.z) {
                        if (q.parentColl) q = q.parentColl;
                        if (!q.ignoreCollision) {
                            n = ig.CollTools.getDistVec2(q, c, d);
                            p = null;
                            if (!Vec2.isZero(q.accelDir) && Vec2.isZero(c.accelDir)) {
                                p = Vec2.assign(a, q.accelDir);
                                Vec2.rotate90CW(p);
                                Vec2.dot(n, p) < 0 && Vec2.flip(p)
                            }
                            if ((n.x > 0 ? q.pos.x + q.size.x - c.pos.x : c.pos.x + c.size.x -
                                    q.pos.x) > (n.y > 0 ? q.pos.y + q.size.y - c.pos.y : c.pos.y + c.size.y - q.pos.y)) {
                                n.x = 0;
                                if (!n.y) n.y = 1
                            } else {
                                n.y = 0;
                                if (!n.x) n.x = 1
                            }
                            if (q.type == ig.COLLTYPE.BLOCK) r.x = r.y = 0;
                            var s = Vec2.length(n) - q.size.y / 2,
                                s = s <= 0 ? 1 : Math.max(0.1, 1 - 0.9 * s / c.size.y),
                                s = s * m.overlapEntryFactor;
                            p && (n = p);
                            Vec2.length(n, ig.system.tick * 128 * s);
                            if (!Vec2.isZero(q.accelDir) || Vec2.dot(c.accelDir, n) >= 0 || q.type == ig.COLLTYPE.BLOCK) {
                                t = true;
                                Vec2.add(r, n)
                            }
                        }
                    }
                    if (!m.skipXYPhysics && !m.forceMoveFrameVel && !o && r.x == 0 && r.y == 0 && !c.vel.z && (l || c.pos.z == c.baseZPos && !m.zBaseUncertain &&
                            !m.groundEntry && !m.holeInfo.mapRes && !c.float.height && !m.overlapEntry)) {
                        c.totalBlockTimer = 0;
                        c.partlyBlockTimer = 0
                    } else {
                        q = c.vel.z;
                        o = Math.abs(c.pos.z - c.baseZPos) < ig.COLLISION.EPS;
                        t = this.moveEntityZ(c, r, o) || t;
                        l = this.initTraceResult(e);
                        l.forcePushEntries = g;
                        l.forcePushEntries.length = 0;
                        l.forcePushDirs = h;
                        l.forcePushDirs.length = 0;
                        m.skipXYPhysics ? m.skipXYPhysics = false : this.moveEntityXY(l, c, r, f);
                        this.updateGroundEntity(c, r, o, q, t);
                        this.addToCollMap(c);
                        if (l.forcePushEntries.length > 0)
                            for (r = l.forcePushEntries.length; r--;) this.forcePushEntry(l.forcePushEntries[r],
                                c, l.forcePushDirs[r]);
                        m.forceMoveFrameVel = false
                    }
                }
            }
        },
        moveEntityXY: function(a, c, e, f, g) {
            var h = c._collData;
            if (e.x == 0 && e.y == 0) {
                c.totalBlockTimer = 0;
                c.partlyBlockTimer = 0;
                if (!g) {
                    h.frameVel.x = 0;
                    h.frameVel.y = 0
                }
                return false
            }
            var i = c.pos.x,
                r = c.pos.y,
                t = Math.sqrt(e.x * e.x + e.y * e.y);
            this.removeFromCollMap(c);
            var q = c.pos.z - c.baseZPos < ig.COLLISION.EPS;
            if (c.type) {
                var s = false,
                    v = c.bounciness ? 1 : 3,
                    y = true;
                do {
                    v--;
                    if (!c.ignoreCollision && (!c.parentColl || !c.parentColl.ignoreCollision)) {
                        this._trackEntityTouch = true;
                        s = this.trace(a,
                            i, r, c.pos.z, e.x, e.y, c.size.x, c.size.y, c.size.z, c.type, c, f, q);
                        this._trackEntityTouch = false;
                        if (!s && y) {
                            c.totalBlockTimer = 0;
                            c.partlyBlockTimer = 0
                        }
                        y = false
                    } else {
                        c.totalBlockTimer = 0;
                        c.partlyBlockTimer = 0
                    }
                    if (a.dist > 0 && Math.abs(c.accelDir.x * a.dir.x + c.accelDir.y * a.dir.y) < 0.8) c.totalBlockTimer = 0;
                    if (a.levelUp) {
                        b(c, ig.game.levels[c.level + 1].height);
                        a.levelUp = false
                    }
                    if (s && v) {
                        if (!g) h.collided = h.collided || s;
                        var u = a.dir.y * e.x - a.dir.x * e.y,
                            i = i + a.dist * e.x,
                            r = r + a.dist * e.y,
                            t = t * (1 - a.dist);
                        e.x = (1 - a.dist) * a.dir.y * u;
                        e.y = (1 - a.dist) *
                            -a.dir.x * u;
                        a.dist = 1;
                        if (a.slipX || a.slipY) {
                            u = Vec2.assignC(d, a.slipX, a.slipY);
                            if (Vec2.isZero(c.accelDir) || Vec2.angle(c.accelDir, u) <= Math.PI * 0.6) {
                                Vec2.length(u, t - Math.sqrt(e.x * e.x + e.y * e.y));
                                e.x = e.x + u.x;
                                e.y = e.y + u.y;
                                u = 1;
                                a.slipX > 0 && e.x > a.slipX ? u = Math.min(u, a.slipX / e.x) : a.slipX < 0 && e.x < a.slipX && (u = Math.min(u, a.slipX / e.x));
                                a.slipY > 0 && e.y > a.slipY ? u = Math.min(u, a.slipY / e.y) : a.slipY < 0 && e.y < a.slipY && (u = Math.min(u, a.slipY / e.y));
                                if (u < 1) {
                                    e.x = e.x * u;
                                    e.y = e.y * u
                                }
                                if (!g) h.slipped = true
                            }
                        }
                        delete a.slipX;
                        delete a.slipY
                    }
                } while (s &&
                    v && (e.x != 0 || e.y != 0));
                if (!g) {
                    h.collided = h.collided || s;
                    h.blockDir.x = a.dir.x;
                    h.blockDir.y = a.dir.y
                }
            } else {
                c.totalBlockTimer = 0;
                c.partlyBlockTimer = 0
            }
            if (c.partlyBlockTimer < 0) c.partlyBlockTimer = 0;
            window.checkPlayerPos("");
            i = i + a.dist * e.x;
            r = r + a.dist * e.y;
            i = Math.round(i * 100) / 100;
            r = Math.round(r * 100) / 100;
            if (!g) {
                h.frameVel.x = i - c.pos.x;
                h.frameVel.y = r - c.pos.y
            }
            if (isNaN(i) || isNaN(r)) throw Error("NaN!");
            c.pos.x = i;
            c.pos.y = r;
            return s
        },
        isGroundDanger: function(a) {
            return this.groundDangerCallback ? this.groundDangerCallback(a) :
                false
        },
        isGroundEntityDanger: function(a) {
            return this.groundEntityDangerCallback ? this.groundEntityDangerCallback(a) : false
        },
        groundDangerCallback: null,
        groundEntityDangerCallback: null,
        moveEntityZ: function(d, e, f) {
            var g = false,
                h = d.pos.x,
                i = d.pos.y,
                p = d._collData,
                r = ig.game.levels[d.level] || ig.game.levels[0];
            if (f && (d.zGravityFactor > 0 && !d.noSlipping && !p.forceMoveFrameVel) && (p.holeInfo.mapRes == 1 || p.groundEntry)) {
                var f = Vec2.assignC(a, 0, 0),
                    t = h + d.size.x * 0.9 / 2,
                    q = i + d.size.y * 0.9 / 2,
                    s = d.size.x * 0.1,
                    v = d.size.y * 0.1,
                    y = d.pos.z -
                    r.height,
                    u = 1E3;
                p.holeInfo.mapRes == 2 && (y = y + 16);
                this.isGroundDanger(d) && (y = y + 16);
                if (p.holeInfo.mapRes == 1 && r.collision.isOverHole(t, q - r.height, s, v)) {
                    r = Vec2.assign(c, p.holeInfo.mapDir);
                    d.edgeSlipInward && Vec2.flip(r);
                    Vec2.dot(d.accelDir, r) >= 0 && Vec2.add(f, r);
                    if (p.groundEntry || !this.getGroundEntry(t, q, s, v, d.size.z, d.pos.z, d.pos.z - ig.COLLISION.HEIGHT_TOLERATE, d)) y = y + 16
                }
                if (p.groundEntry) {
                    var r = p.groundEntry.heightShape ? p.groundEntry.pos.z : d.pos.z,
                        z = p.groundEntry.pos.x + p.groundEntryOffset.x - h,
                        D = p.groundEntry.pos.y +
                        p.groundEntryOffset.y - i;
                    if (!p.groundEntry.heightShape && !this.getGroundEntry(t + z, q + D, s, v, d.size.z, d.pos.z, r - ig.COLLISION.HEIGHT_TOLERATE, d)) {
                        r = Vec2.assign(c, p.holeInfo.entryDir);
                        d.edgeSlipInward && Vec2.flip(r);
                        Vec2.dot(d.accelDir, r) >= 0 && Vec2.add(f, r);
                        u = Math.min(u, p.holeInfo.entryDist)
                    } else y = 0
                }
                if ((f.x != 0 || f.y != 0) && !p.overlapEntry && y > ig.COLLISION.HEIGHT_TOLERATE && Vec2.dot(d.accelDir, f) >= 0) {
                    if (d.onFallFromEdge) d.onFallFromEdge(f);
                    if (d.vel.z <= 0) {
                        Vec2.length(f, Math.min(u, 32 * ig.system.tick));
                        g = true;
                        e.x =
                            e.x + f.x;
                        e.y = e.y + f.y;
                        if (Math.sqrt(e.x * e.x + e.y * e.y) > u && d.accelDir.x == 0 && d.accelDir.y == 0) {
                            e.x = f.x;
                            e.y = f.y
                        }
                    }
                }
            }
            t = -ig.game.gravity * d.zGravityFactor;
            e = d.maxZVel;
            f = -d.maxZVel;
            if (d.float.height) {
                q = ig.game.gravity / 5 * d.float.accel;
                s = ig.game.gravity * 4 * d.float.accel;
                e = Math.max(d.vel.z, d.float.maxSpeed);
                f = Math.min(d.vel.z, -d.float.maxSpeed);
                y = d.float.variance;
                v = d.float.height + d.baseZPos - d.pos.z;
                Math.abs(v) <= y * 2 && (q = q / 6);
                u = d.vel.z * d.vel.z;
                if (y == 0 && Math.abs(v) < 1 && Math.abs(d.vel.z) < 50) {
                    t = 0;
                    d.vel.z = 0
                } else if (!(v - y <
                        0 && d.vel.z < 0) && (v >= 0 || v + y > 0 && d.vel.z > 0)) {
                    t = 0.5 * u / (v + y);
                    t = d.vel.z > 0 && (t >= q || v <= 0) ? -t.limit(q / 4, s) : q
                } else if (v < 0 || v - y < 0 && d.vel.z < 0) {
                    t = 0.5 * u / (-v + y);
                    t = d.vel.z < 0 && (t >= q || v >= 0) ? t.limit(q / 4, s) : -q
                }
            }
            if (!p.zBaseUncertain && (p.forceMoveFrameVel || d.pos.z > d.baseZPos || d.vel.z != 0 || t > 0)) {
                q = p.forceMoveFrameVel ? d.pos.z + p.frameVel.z : d.pos.z + d.vel.z * ig.system.tick + t * ig.system.tick * ig.system.tick * 0.5;
                if (!p.forceMoveFrameVel && d.vel.z > 0 && !d.ignoreCollision) {
                    if (d.level + 1 < ig.game.maxLevel && q + d.size.z > ig.game.levels[d.level +
                            1].height - 1 && !ig.game.levels[d.level + 1].collision.isOverHole(h, i - ig.game.levels[d.level + 1].height, d.size.x, d.size.y)) {
                        q = ig.game.levels[d.level + 1].height - 1 - d.size.z;
                        d.vel.z = 0
                    }
                    if (p.ceilingEntry && q + d.size.z > p.ceilingEntry.pos.z) {
                        q = p.ceilingEntry.pos.z - d.size.z;
                        d.vel.z = 0
                    }
                }
                if (!p.forceMoveFrameVel && q <= d.baseZPos) {
                    d.vel.z = d.pos.z > d.baseZPos && -d.vel.z > d.minBounceVelocity ? d.vel.z * -d.zBounciness : 0;
                    q = d.baseZPos
                }
                if (!p.forceMoveFrameVel) p.frameVel.z = p.frameVel.z + (q - d.pos.z);
                b(d, q);
                d.vel.z = d.vel.z + t * ig.system.tick;
                if (d.vel.z > e) d.vel.z = e;
                if (d.vel.z < f) d.vel.z = f
            }
            if (d.accelDir.x || d.accelDir.y) {
                d.totalBlockTimer = d.totalBlockTimer + ig.system.tick;
                d.partlyBlockTimer = d.partlyBlockTimer + ig.system.tick
            } else {
                d.totalBlockTimer = 0;
                d.partlyBlockTimer = 0
            }
            return g
        },
        forcePushEntry: function(a, b, c, d) {
            var e = Vec2.assignC(i, 0, 0);
            if (c.x > 0) e.x = Math.max(0, b.pos.x + b.size.x - a.pos.x);
            else if (c.x < 0) e.x = Math.min(0, b.pos.x - a.pos.x - a.size.x);
            if (c.y > 0) e.y = Math.max(0, b.pos.y + b.size.y - a.pos.y);
            else if (c.y < 0) e.y = Math.min(0, b.pos.y - a.pos.y - a.size.y);
            if (!(e.x == 0 && e.y == 0)) {
                a.initCollData();
                if (!a._collData.groundEntry || !(a._collData.groundEntry.parentColl && a._collData.groundEntry.parentColl == b.parentColl)) {
                    var g = this.initTraceResult(f),
                        c = a.totalBlockTimer,
                        h = a.partlyBlockTimer,
                        d = this.moveEntityXY(g, a, e, d, true);
                    a.totalBlockTimer = c;
                    a.partlyBlockTimer = h;
                    c = Math.abs(a.pos.z - a.baseZPos) < ig.COLLISION.EPS;
                    this.updateGroundEntity(a, e, c, a.vel.z, true);
                    this.addToCollMap(a);
                    if (d && a.entity.onPhysicsSquish) a.entity.onPhysicsSquish(b.entity)
                }
            }
        },
        updateGroundEntity: function(a,
            c, d, e, f) {
            var g = a._collData,
                h = a.baseZPos,
                i = !d && a.pos.z == a.baseZPos,
                t = this.updateBaseZPos(a, a.pos.x, a.pos.y, g);
            if (a.zGravityFactor && a.pos.z < a.baseZPos) {
                g.frameVel.z = g.frameVel.z + (a.baseZPos - a.pos.z);
                b(a, a.baseZPos);
                g.zPush = true
            }
            var q = t || g.groundEntry,
                c = q && q.heightShape ? Math.max(Math.abs(c.x), Math.abs(c.y)) + 2 : ig.COLLISION.HEIGHT_TOLERATE;
            if (!g.forceMoveFrameVel && a.zGravityFactor) {
                q = a.pos.z - a.baseZPos < ig.COLLISION.EPS;
                if (!q && i && a.pos.z - a.baseZPos < c) {
                    q = true;
                    b(a, a.baseZPos)
                }
                if (d && a.vel.z <= 0)
                    if (q) {
                        if (g.holeInfo.entryDanger &&
                            a.entity.onFallFromEdge) a.entity.onFallFromEdge()
                    } else if (a.pos.z - a.baseZPos > c || this.isGroundDanger(a)) {
                    if (a.entity.onFallFromEdge) a.entity.onFallFromEdge()
                } else {
                    b(a, a.baseZPos);
                    g.zPush = true
                } else if (a.float.height && h - a.baseZPos > ig.COLLISION.HEIGHT_TOLERATE && a.pos.z - h < a.float.height + a.float.variance) {
                    if (a.entity.onFallFromEdge) a.entity.onFallFromEdge()
                } else if (!d && q && a.entity.onTouchGround) a.entity.onTouchGround(e)
            } else t = null;
            (g.groundEntry != t || f || g.collided) && a.setGroundEntry(t)
        },
        updateBaseZPos: function(a,
            b, c, d) {
            var e = ig.game.levels[a.level] || ig.game.levels[0];
            a.baseZPos = a.level >= 0 ? e.height : -1E3;
            Vec2.assignC(d.holeInfo.mapDir, 0, 0);
            d.holeInfo.mapRes = e.collision.isOverHole(b, c - e.height, a.size.x, a.size.y, d.holeInfo.mapDir);
            e = a.level;
            if (e >= 0 && d.holeInfo.mapRes == 2)
                for (--e; e >= 0 && ig.game.levels[e].collision.isOverHole(b, c - ig.game.levels[e].height, a.size.x, a.size.y);) --e;
            a.baseZPos = e >= 0 ? ig.game.levels[e].height : -1E3;
            d.zBaseUncertain = false;
            Vec2.assignC(d.holeInfo.entryDir, 0, 0);
            d.holeInfo.entryZ = 0;
            d.holeInfo.entryDist =
                1E4;
            d.overlapEntry = null;
            d.ceilingEntry = null;
            d.holeInfo.entryDanger = false;
            if (b = this.getGroundEntry(b, c, a.size.x, a.size.y, a.size.z, a.pos.z, a.baseZPos, a, d)) {
                c = b.heightShape ? 32 : ig.COLLISION.HEIGHT_TOLERATE;
                e = this.isGroundEntityDanger(b);
                if (a.baseZPos == a.pos.z && a.baseZPos == d.holeInfo.entryZ && e) b = null;
                else {
                    if (a.baseZPos < d.holeInfo.entryZ) a.baseZPos = d.holeInfo.entryZ;
                    a.zGravityFactor && a.pos.z - a.baseZPos <= c ? d.holeInfo.entryDanger = e : a.float.height || (b = null)
                }
            }
            return b
        },
        getBaseZPos: function(a, b, c, d, e) {
            for (var f =
                    ig.game.getLevelIdx(c); f >= 0 && ig.game.levels[f].collision.isOverHole(a, b - ig.game.levels[f].height, d, e);) --f;
            f = f >= 0 ? ig.game.levels[f].height : -1E3;
            return (a = this.getGroundEntry(a, b, d, e, 8, c, f)) ? a.pos.z + a.size.z : f
        },
        traceOnEntryMap: function(a, b, c, d, e, f, g, h, i, q, s, v, y) {
            for (var u = [], z = [], D = false, C = Math.max(0, Math.floor((b + (e < 0 ? e : 0)) / this.cellSize)), A = Math.max(0, Math.floor((c + (f < 0 ? f : 0)) / this.cellSize)), B = Math.min(this.collEntryMap.width, Math.floor((b + (e > 0 ? e : 0) + g) / this.cellSize) + 1), w = Math.min(this.collEntryMap.height,
                    Math.floor((c + (f > 0 ? f : 0) + h) / this.cellSize) + 1), x = [], E = [], G = 1, D = false, J = s && s._collData && s._collData.forceMoveFrameVel, I = J || s && (q == ig.COLLTYPE.BLOCK || q == ig.COLLTYPE.FENCE) && s.weight == -1, K = s && s.parentColl ? s.parentColl : s, H = s && s.shape != ig.COLLSHAPE.RECTANGLE, M = C; M < B; M++)
                for (var L = A; L < w; L++)
                    for (var N = this.collEntryMap[M][L], C = N.length; C--;) {
                        var F = N[C];
                        if (F._inCollisionMap) {
                            if (u.indexOf(F) == -1 && F != K && (!F.parentColl || F.parentColl != K)) {
                                u.push(F);
                                if (F.ignoreCollision || F.parentColl && F.parentColl.ignoreCollision ||
                                    !ig.Entity.COLLISION_MAP[q][F.type]) z.push(F);
                                else {
                                    var O = a.dist,
                                        P;
                                    if (H)(P = s.trace(a, F.pos.x, F.pos.y, F.pos.z, -e, -f, F.size.x, F.size.y, F.size.z, y)) && Vec2.flip(a.dir);
                                    else P = F.trace(a, b, c, d, e, f, g, h, i, y);
                                    if (P) {
                                        if (a.forcePushEntries && I && F.type != ig.COLLTYPE.BLOCK && (F.weight != -1 || F.type == ig.COLLTYPE.PROJECTILE)) {
                                            a.dist = O;
                                            a.forcePushEntries.push(F);
                                            a.forcePushDirs.push(ig.copy(a.dir))
                                        } else if (J) a.dist = O;
                                        else {
                                            if (G > a.dist) {
                                                G = a.dist;
                                                x = [];
                                                E = []
                                            }
                                            D = true
                                        }
                                        x.push(F);
                                        E.push({
                                            x: a.dir.x,
                                            y: a.dir.y
                                        })
                                    } else if (F.intersectsWith(b,
                                            c, d, g, h, i)) {
                                        x.push(F);
                                        E.push({
                                            x: 0,
                                            y: 0
                                        })
                                    }
                                }
                            }
                        } else N.splice(C, 1)
                    }
            if (v) {
                a = false;
                for (C = x.length; C--;) {
                    F = x[C];
                    q = E[C];
                    v.indexOf(F) == -1 && v.push(F);
                    if (s && this._trackEntityTouch) {
                        a = true;
                        u = F._collisionList.indexOf(s);
                        if (u == -1) {
                            u = F._collisionList.length;
                            F._collisionList.push(s)
                        }
                        if (!F._collisionListData[u]) {
                            q.dot = q.x * e + q.y * f;
                            F._collisionListData[u] = q
                        }
                        s._collisionList.indexOf(F) == -1 && s._collisionList.push(F)
                    }
                }
                if (this._trackEntityTouch) {
                    x = {
                        dist: 1,
                        dir: {
                            x: 0,
                            y: 0
                        }
                    };
                    for (C = z.length; C--;) {
                        F = z[C];
                        x.dist = G;
                        if (F.trace(x,
                                b, c, d, e, f, g, h, i, y) || F.intersectsWith(b, c, d, g, h, i)) {
                            v.indexOf(F) == -1 && v.push(F);
                            if (s) {
                                a = true;
                                F._collisionList.indexOf(s) == -1 && F._collisionList.push(s);
                                s._collisionList.indexOf(F) == -1 && s._collisionList.push(F)
                            }
                        }
                    }
                    s && (a && v.indexOf(s) == -1) && v.push(s)
                }
            }
            return D
        },
        getGroundEntry: function(a, b, c, d, e, f, g, h, i) {
            for (var q = i && i.holeInfo, s = false, v = 0, y = Math.max(0, Math.floor(a / this.cellSize)), u = Math.max(0, Math.floor(b / this.cellSize)), z = Math.min(this.collEntryMap.width, Math.floor((a + c) / this.cellSize) + 1), D = Math.min(this.collEntryMap.height,
                    Math.floor((b + d) / this.cellSize) + 1), C = h && h.type == ig.COLLTYPE.SEMI_IGNORE; y < z; y++)
                for (var A = u; A < D; A++)
                    for (var B = this.collEntryMap[y][A].length; B--;) {
                        var w = this.collEntryMap[y][A][B],
                            x = w.parentColl || w;
                        if (w != h && !x.ignoreCollision && (!h || w.parentColl != h) && (w.type == ig.COLLTYPE.NPBLOCK || w.type == ig.COLLTYPE.BLOCK || w.type == ig.COLLTYPE.FENCE || w.type == ig.COLLTYPE.NPFENCE || !C && w.type == ig.COLLTYPE.VIRTUAL || C && w.type == ig.COLLTYPE.SEMI_IGNORE)) {
                            var x = w.pos.x + w.size.x - a,
                                E = a + c - w.pos.x,
                                G = w.pos.y + w.size.y - b,
                                J = b + d - w.pos.y,
                                I = Math.min(Math.min(x, E), Math.min(J, G)),
                                K = 1;
                            if (I > 0) {
                                var H = w.pos.z + w.getOverlapHeight(a, b, c, d);
                                if (f + e - ig.COLLISION.EPS > w.pos.z && H >= g) {
                                    if (C && w.type == ig.COLLTYPE.SEMI_IGNORE)
                                        if (I < h.size.x / 4) continue;
                                        else K = 0.2;
                                    var M = w._collData;
                                    if (!w.heightShape && H - ig.COLLISION.EPS > f + ig.COLLISION.HEIGHT_TOLERATE) {
                                        if ((w.shape == ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(w.pos.x + w.size.x / 2, w.pos.y + w.size.y / 2, w.shape, a, b, c, d)) && (q && h && !h.heightShape && h.shape == ig.COLLSHAPE.RECTANGLE && !h.ignoreCollision && !w.ignoreCollision &&
                                                (h.type == ig.COLLTYPE.BLOCK || h.type == ig.COLLTYPE.NPBLOCK || h.type == ig.COLLTYPE.VIRTUAL || C)) && !(M && M.groundEntry == h)) {
                                            if (!i.overlapEntry || i.overlapEntry.size.x < w.size.x) {
                                                i.overlapEntryFactor = K;
                                                i.overlapEntry = w
                                            }
                                            if (M && (!M.overlapEntry || M.overlapEntry.size.x < h.size.x)) {
                                                M.overlapEntry = h;
                                                M.overlapEntryFactor = K
                                            }
                                        }
                                    } else if (w.type == ig.COLLTYPE.BLOCK || w.type == ig.COLLTYPE.NPBLOCK) {
                                        var L = 0,
                                            N = K = 0,
                                            F = I;
                                        if (w.shape != ig.COLLSHAPE.RECTANGLE) {
                                            var O = w.pos.x + w.size.x / 2,
                                                P = w.pos.y + w.size.y / 2;
                                            switch (w.shape) {
                                                case ig.COLLSHAPE.SLOPE_NE:
                                                    L =
                                                        a - O - (b + d - P);
                                                    K = 1;
                                                    N = -1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_SE:
                                                    L = a - O + (b - P);
                                                    N = K = 1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_SW:
                                                    L = -(a + c - O) + (b - P);
                                                    K = -1;
                                                    N = 1;
                                                    break;
                                                case ig.COLLSHAPE.SLOPE_NW:
                                                    L = -(a + c - O) - (b + d - P);
                                                    N = K = -1
                                            }
                                            if (L >= -ig.COLLISION.EPS) continue;
                                            L = L * -Math.SQRT1_2;
                                            F = Math.min(F, L)
                                        }
                                        if (q) {
                                            L = ig.CollTools.getOverlapArea(w, a, b, c, d);
                                            if (H > g) {
                                                g = H;
                                                q.entryDir.x = 0;
                                                q.entryDir.y = 0;
                                                q.entryDist = 1E5
                                            } else if (s && L < v) continue;
                                            v = L;
                                            if (I == F)
                                                if (I == G) {
                                                    K = 0;
                                                    N = 1
                                                } else if (I == J) {
                                                K = 0;
                                                N = -1
                                            } else if (I == x) {
                                                K = 1;
                                                N = 0
                                            } else if (I == E) {
                                                K = -1;
                                                N = 0
                                            }
                                            if (F < q.entryDist)
                                                if (q.entryDir.x *
                                                    K + q.entryDir.y * N < 0) {
                                                    q.entryDir.x = 0;
                                                    q.entryDir.y = 0;
                                                    q.entryDist = 0
                                                } else {
                                                    q.entryDir.x = K;
                                                    q.entryDir.y = N;
                                                    q.entryDist = F
                                                } q.entryZ = H;
                                            s = w
                                        } else return w
                                    }
                                } else if (f + e <= w.pos.z && (w.type == ig.COLLTYPE.BLOCK || w.type == ig.COLLTYPE.NPBLOCK))
                                    if (i && M && M.groundEntry != h && (!i.ceilingEntry || i.ceilingEntry.pos.z < w.pos.z)) i.ceilingEntry = w
                            }
                        }
                    }
            return s
        }
    })
});
ig.baked = !0;
