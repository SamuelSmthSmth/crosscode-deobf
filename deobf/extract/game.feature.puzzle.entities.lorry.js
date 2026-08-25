ig.module("game.feature.puzzle.entities.lorry").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "impact.base.actor-entity").defines(function() {
    sc.LORRY_TYPES = {};
    sc.LORRY_MOVE_TYPES = {
        PERMA_MOVE: {
            perma: true
        },
        ON_TOUCH_PERMA_MOVE: {
            onTouchStart: true
        },
        ON_TOUCH_MOVE_ONCE: {
            onTouchStart: true,
            onPauseFreeStop: true
        },
        WHILE_TOUCH_MOVE: {
            onTouchStart: true,
            onFreeStop: true,
            onPauseFreeStop: true
        }
    };
    sc.LORRY_SPEED = {};
    sc.LORRY_SPEED.SLOW = 60;
    sc.LORRY_SPEED.DEFAULT = 90;
    sc.LORRY_SPEED.FAST = 120;
    sc.LORRY_SPEED.FASTER =
        180;
    sc.LORRY_SPEED.FASTEST = 240;
    var b = Vec3.create(),
        a = Vec3.create(),
        d = new ig.EffectSheet("puzzle.lorry");
    ig.ENTITY.Lorry = ig.AnimatedEntity.extend({
        lorryType: null,
        respawnTimer: 0,
        moveType: null,
        initDir: Vec2.create(),
        moving: false,
        maxSpeed: 0,
        currentSpeed: 0,
        slowDownAccel: 0,
        pauseTimer: 0,
        lightHandle: null,
        bombSnap: true,
        fxHandle: null,
        moveDest: {
            prevRail: null,
            currentRail: null,
            nextRail: null,
            points: [],
            pointIdx: 0
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                lorryType: {
                    _type: "String",
                    _info: "Type/Size of the Lorry",
                    _select: sc.LORRY_TYPES
                },
                moveType: {
                    _type: "String",
                    _info: "How the platform moves",
                    _select: sc.LORRY_MOVE_TYPES
                },
                initDir: {
                    _type: "String",
                    _info: "The initial direction of the platform",
                    _select: ig.ActorEntity.FACE4
                },
                speed: {
                    _type: "String",
                    _info: "Speed of lorry",
                    _select: sc.LORRY_SPEED
                },
                moveCondition: {
                    _type: "VarCondition",
                    _info: "Additional condition for lorry to move",
                    _optional: true
                },
                fastMode: {
                    _type: "Boolean",
                    _info: "Make sure puzzle element is not slowed down by assist mode"
                }
            }
        }),
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.moveType = sc.LORRY_MOVE_TYPES[g.moveType] || sc.LORRY_MOVE_TYPES.PERMA_MOVE;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE4[g.initDir], this.initDir);
            this.maxSpeed = sc.LORRY_SPEED[g.speed] || sc.LORRY_SPEED.DEFAULT;
            this.moveCondition = new ig.VarCondition(g.moveCondition || null);
            this.fastMode = g.fastMode || false;
            a = ig.mapStyle.get("lorry");
            if (this.lorryType = g = sc.LORRY_TYPES[g.lorryType]) {
                this.coll.setSize(g.size.x, g.size.y, g.size.z);
                this.initAnimations({
                    sheet: {
                        src: a.sheet,
                        width: g.gfx.w,
                        height: g.gfx.h,
                        xCount: g.gfx.xCount,
                        offX: a.lorryX + g.gfx.x,
                        offY: a.lorryY + g.gfx.y
                    },
                    SUB: [{
                        name: "off",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "on",
                        time: 1,
                        frames: [1],
                        repeat: false
                    }]
                })
            }
            this.moveType.perma && (!window.wm && this.moveCondition.evaluate()) && this.setMove(true, true)
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                d.spawnOnTarget("lorryAppear", this, {
                    align: "TOP"
                })
            }
        },
        resetPos: function(a, e) {
            var f = this.getAlignedPos(ig.ENTITY_ALIGN.TOP,
                b);
            d.spawnFixed("lorryDisappear", f.x, f.y, f.z);
            this.setPos(a.x, a.y, a.z);
            this.grabRail(e);
            this.setMove(false, true);
            this.pauseTimer = this.slowDownAccel = this.currentSpeed = this.animState.alpha = 0;
            d.spawnOnTarget("lorryAppear", this, {
                align: "TOP"
            })
        },
        setMove: function(a, b) {
            this.moving = a;
            this.setCurrentAnim(this.moving ? "on" : "off");
            if (this.moving && !this.lightHandle) {
                this.fxHandle = d.spawnOnTarget("lorryRuns", this, {
                    duration: -1
                });
                this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.XL, 0.2, 0.2, -1, 1);
                ig.light.addLightHandle(this.lightHandle);
                b || d.spawnOnTarget("lorryActivate", this, {
                    align: "TOP"
                })
            } else if (!this.moving && this.lightHandle) {
                this.fxHandle && this.fxHandle.stop();
                this.lightHandle.stop();
                this.lightHandle = null;
                b || d.spawnOnTarget("lorryDeactivate", this, {
                    align: "TOP"
                })
            }
        },
        update: function() {
            this.moveDest.currentRail || this.grabRail(this.initDir);
            if (this.moving)
                if (this.pauseTimer > 0) {
                    this.pauseTimer = this.pauseTimer - ig.system.tick;
                    if (this.pauseTimer <= 0) this.pauseTimer = 0;
                    if (this.moveType.onPauseFreeStop) {
                        var a = ig.game.getEntitiesOnTop(this);
                        a.indexOf(ig.game.playerEntity) == -1 && this.setMove(false)
                    }
                } else {
                    this.moveLorry();
                    if (this.moveType.onFreeStop) {
                        a = ig.game.getEntitiesOnTop(this);
                        if (a.indexOf(ig.game.playerEntity) == -1) {
                            this.currentSpeed = 0;
                            this.setMove(false)
                        }
                    }
                } this.parent()
        },
        moveLorry: function() {
            var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b),
                d = this.moveDest,
                f;
            f = this.maxSpeed * (this.fastMode ? 1 : sc.options.get("assist-puzzle-speed"));
            if (!this.slowDownAccel && this.currentSpeed >= f || this.slowDownAccel && this.currentSpeed <= 15) {
                this.currentSpeed =
                    this.currentSpeed.limit(15, f);
                f = this.currentSpeed * ig.system.tick
            } else {
                var g = this.slowDownAccel ? -this.slowDownAccel : f * 2;
                f = this.currentSpeed * ig.system.tick + g * ig.system.tick * ig.system.tick;
                this.currentSpeed = this.currentSpeed + g * ig.system.tick
            }
            for (g = false; f;) {
                var h = d.points[d.pointIdx],
                    i = Vec3.sub(h, c, a),
                    j = Vec3.length(i);
                if (j <= f) {
                    f = f - j;
                    Vec3.assign(c, h);
                    if (!this.stepPoint()) {
                        f = 0;
                        g = true
                    }
                } else {
                    Vec3.length(i, f);
                    Vec3.add(c, i);
                    f = 0
                }
            }
            f = this.coll;
            f.setPos(c.x - f.size.x / 2, c.y - f.size.y / 2, c.z, true);
            if (g) {
                this.slowDownAccel =
                    0;
                this.flip();
                this.pauseTimer = 1
            } else if (!this.slowDownAccel) {
                f = this.currentSpeed * 0.5;
                c = d.currentRail.getGoalDistance(c, d.prevRail, f);
                if (c < f) this.slowDownAccel = 0.5 * this.currentSpeed * this.currentSpeed / c
            }
        },
        collideWith: function(a) {
            if (this.moveCondition.evaluate() && this.moveType.onTouchStart && a.isPlayer && !this.moving) {
                this.pauseTimer = 0.4;
                this.setMove(true)
            }
        },
        varsChanged: function() {
            var a = this.moveCondition.evaluate();
            if (!a && this.moving) {
                this.currentSpeed = 0;
                this.setMove(false)
            } else if (a && !this.moving) {
                a =
                    ig.game.getEntitiesOnTop(this);
                if (!this.moveType.onTouchStart || a.indexOf(ig.game.playerEntity) != -1) {
                    this.pauseTimer = 0.4;
                    this.setMove(true)
                }
            }
        },
        stepPoint: function() {
            var a = this.moveDest;
            if (a.pointIdx < a.points.length - 1) {
                a.pointIdx++;
                return true
            }
            if (a.nextRail) {
                var b = a.points.last();
                a.nextRail.getPoints(a, b);
                return true
            }
            return false
        },
        flip: function() {
            for (var a = this.moveDest, b = [], d = a.points.length; d--;) b.push(a.points[d]);
            a.points = b;
            a.pointIdx = b.length - a.pointIdx;
            b = a.prevRail;
            a.prevRail = a.nextRail;
            a.nextRail =
                b
        },
        grabRail: function(a) {
            for (var d = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b), f = ig.game.getEntitiesInRectangle(d.x - 1, d.y - 1, d.z - 1, 2, 2, 2, this), g = f.length; g--;) f[g] instanceof ig.ENTITY.LorryRail && f[g].getInitialPoints(this.moveDest, d, a)
        },
        applyMarkerPosition: function(a) {
            a.coll.level = this.coll.level;
            a.coll.pos.z = a.coll.baseZPos = this.coll.baseZPos + this.coll.size.z;
            a.face.x = this.initDir.x;
            a.face.y = this.initDir.y;
            a.setPos(this.coll.pos.x + this.coll.size.x / 2 - a.coll.size.x / 2, this.coll.pos.y + this.coll.size.y /
                2 - a.coll.size.y / 2);
            this.setMove(true, true);
            this.currentSpeed = this.maxSpeed * (this.fastMode ? 1 : sc.options.get("assist-puzzle-speed"))
        }
    });
    ig.ENTITY.LorryRespawner = ig.AnimatedEntity.extend({
        lorrySrc: null,
        lorry: null,
        initDir: Vec2.create(),
        lastAlpha: 0,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                lorryEntity: {
                    _type: "Entity",
                    _info: "The lorry entity to be respawned at this point"
                },
                initDir: {
                    _type: "String",
                    _info: "The initial direction of the platform",
                    _select: ig.ActorEntity.FACE4
                }
            },
            drawBox: true,
            boxColor: "rgba(0,255,255, 0.5)"
        }),
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE4[g.initDir], this.initDir);
            this.lorrySrc = g.lorryEntity;
            this.lastAlpha = 0
        },
        fetchLorry: function() {
            if ((this.lorry = ig.Event.getEntity(this.lorrySrc)) && this.lorry.lorryType) {
                var a = ig.mapStyle.get("lorry"),
                    b = this.lorry.lorryType;
                if (b) {
                    var d = this.coll,
                        g = b.size.x - this.coll.size.x,
                        h = b.size.y -
                        this.coll.size.y;
                    d.setSize(b.size.x, b.size.y, 0);
                    this.initAnimations({
                        sheet: {
                            src: a.sheet,
                            width: b.gfx.w - 2,
                            height: b.gfx.h - 2,
                            offX: a.lorryX + b.gfx.x + 1,
                            offY: a.lorryY + b.gfx.y + 1 + b.gfx.h * 2
                        },
                        renderMode: "lighter",
                        SUB: [{
                            name: "default",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }]
                    });
                    this.setPos(d.pos.x - g / 2, d.pos.y - h / 2, d.pos.z)
                }
            }
        },
        update: function() {
            this.lorry || this.fetchLorry();
            if (this.lorry) {
                var a = 1,
                    b = ig.game.playerEntity;
                ig.EntityTools.getGroundEntity(b) == this.lorry && (a = 0);
                var d = ig.CollTools.getGroundDistance(this.coll, this.lorry.coll);
                !this.lorry.moving && d > 48 && (d = 200);
                d < 48 ? a = 0 : d < 200 && (a = a * ((d - 48) / 152));
                var a = KEY_SPLINES.EASE_OUT.get(a),
                    g = ig.system.tick * 10;
                this.lastAlpha = g * a + this.lastAlpha * (1 - g);
                this.animState.alpha = this.lastAlpha;
                this.animState.scaleX = this.lastAlpha;
                this.animState.scaleY = this.lastAlpha;
                a = ig.CollTools.getGroundDistance(b.coll, this.coll);
                if (d >= 200 && a <= 48) {
                    this.lorry.resetPos(this.coll.pos, this.initDir);
                    d = b.coll;
                    this.lorry.coll.intersectsWith(d.pos.x, d.pos.y, d.pos.z, d.size.x, d.size.y, d.size.z) && b.setPos(d.pos.x, d.pos.y,
                        d.pos.z + this.lorry.coll.size.z)
                }
            }
            this.parent()
        }
    });
    sc.LORRY_TYPES.BIG = {
        size: {
            x: 48,
            y: 48,
            z: 2
        },
        gfx: {
            x: 0,
            y: 0,
            w: 48,
            h: 48,
            xCount: 1
        }
    };
    sc.LORRY_RAIL_TYPES = {};
    ig.ENTITY.LorryRail = ig.AnimatedEntity.extend({
        entries: [],
        currentEntry: null,
        connectedNeighbours: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                railType: {
                    _type: "String",
                    _info: "Type of rail",
                    _select: sc.LORRY_RAIL_TYPES
                },
                altTypes: {
                    _type: "LorryAltTypes",
                    _info: "Other types depending on var conditions",
                    _optional: true
                }
            }
        }),
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            g.size || this.coll.setSize(16, 16, 0);
            if ((a = sc.LORRY_RAIL_TYPES[g.railType]) && (a.scaleX || a.scaleY)) {
                (!a.scaleX && this.coll.size.x != 16 || !a.scaleY && this.coll.size.y != 16) && this.coll.setSize(16, 16, 0);
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.scalableX = a.scaleX;
                    this._wm.scalableY = a.scaleY;
                    this._wm.scalableStep = 16
                }
            } else this.coll.setSize(a.gfx.w ? a.gfx.w : 16, 16, 0);
            this.pushEntry(g.railType, null);
            if (g.altTypes) {
                g =
                    g.altTypes;
                for (a = 0; a < g.length; ++a) this.pushEntry(g[a].railType, new ig.VarCondition(g[a].condition))
            }
            this.updateEntry(true)
        },
        initSprites: function() {
            this.setSpriteCount(this.entries.length)
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                d.spawnOnTarget("railAppear", this)
            }
        },
        connectNeighbours: function() {
            if (!this.connectedNeighbours) {
                for (var a = this.entries.length; a--;) this.connectNeighboursForEntry(this.entries[a]);
                this.connectedNeighbours = true
            }
        },
        connectNeighboursForEntry: function(a) {
            if (a)
                for (var b =
                        2; b--;) {
                    for (var d = a.points[b ? 0 : a.points.length - 1], d = ig.game.getEntitiesInRectangle(d.x - 1, d.y - 1, d.z - 1, 2, 2, 2, this), g = null, h = d.length; h--;) d[h] instanceof ig.ENTITY.LorryRail && (g = d[h]);
                    a.neighbours.push(g)
                }
        },
        pushEntry: function(a, b) {
            var d = {
                    condition: b,
                    sheet: null,
                    patternSheet: null,
                    points: [],
                    neighbours: []
                },
                g = ig.mapStyle.get("lorry"),
                h = sc.LORRY_RAIL_TYPES[a];
            if (g && h) {
                h.scaleX || h.scaleY ? d.patternSheet = new ig.ImagePatternSheet(g.sheet, h.scaleX ? ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y, 16, 16,
                    g.railX + h.gfx.x, g.railY + h.gfx.y, 1, 1) : d.sheet = {
                    gfx: new ig.Image(g.sheet),
                    x: g.railX + h.gfx.x,
                    y: g.railY + h.gfx.y,
                    w: h.gfx.w || 16,
                    h: 16
                };
                g = h.points;
                for (h = 0; h < g.length; ++h) {
                    var i = g[h],
                        j = Vec3.create(this.coll.pos);
                    j.x = j.x + this.coll.size.x * i.x;
                    j.y = j.y + this.coll.size.y * i.y;
                    j.z = j.z + this.coll.size.z * (i.z || 0);
                    d.points.push(j)
                }
            }
            this.entries.push(d)
        },
        getInitialPoints: function(b, d, f) {
            this.connectNeighbours();
            var g = this.currentEntry,
                d = Vec3.sub(g.points[0], d, a);
            Vec2.dot(d, f) <= 0 ? this._transferPoints(b, g, false) : this._transferPoints(b,
                g, true)
        },
        getGoalDistance: function(a, b, d) {
            this.connectNeighbours();
            for (var g = this.currentEntry, h, i, j = -1; j < this.entries.length; ++j) {
                g = j == -1 ? this.currentEntry : this.entries[j];
                if (!(j != -1 && g == this.currentEntry))
                    if (g.neighbours[0] == b) {
                        h = g.points.last();
                        i = g.neighbours[1]
                    } else if (g.neighbours[1] == b) {
                    h = g.points[0];
                    i = g.neighbours[0]
                }
            }
            if (!h) return 0;
            a = Vec3.distance(a, h);
            return a < d && i ? a + i.getGoalDistance(h, this, d - a) : a
        },
        getPoints: function(a, b) {
            this.connectNeighbours();
            var d;
            d = this._getPointsForEntry(a, this.currentEntry,
                b, -1);
            if (d != 0)
                for (var g = this.entries.length; g--;) {
                    d = this._getPointsForEntry(a, this.entries[g], b, d);
                    if (d == 0) break
                }
        },
        _getPointsForEntry: function(a, b, d, g) {
            var h = Vec3.distance(d, b.points[0]),
                d = Vec3.distance(d, b.points.last());
            if (h <= d && (g == -1 || h < g)) {
                this._transferPoints(a, b, false);
                return h
            }
            if (d < h && (g == -1 || d < g)) {
                this._transferPoints(a, b, true);
                return d
            }
            return g
        },
        _transferPoints: function(a, b, d) {
            a.currentRail = this;
            a.pointIdx = 1;
            if (d) {
                a.prevRail = b.neighbours[1];
                a.nextRail = b.neighbours[0];
                a.points.length = 0;
                for (d =
                    b.points.length; d--;) a.points.push(b.points[d])
            } else {
                a.prevRail = b.neighbours[0];
                a.nextRail = b.neighbours[1];
                a.points.length = 0;
                a.points.push.apply(a.points, b.points)
            }
        },
        updateEntry: function(a) {
            for (var b = this.entries.length; b--;) {
                var f = this.entries[b];
                if (!f.condition || f.condition.evaluate()) {
                    if (this.currentEntry != f) {
                        a || d.spawnOnTarget("railSwitch", this);
                        this.currentEntry = f
                    }
                    break
                }
            }
        },
        update: function() {
            this.connectNeighbours();
            this.parent()
        },
        onKill: function(a) {
            this.parent(a);
            for (a = this.entries.length; a--;) {
                var b =
                    this.entries[a];
                b.patternSheet && b.patternSheet.decreaseRef();
                b.sheet && b.sheet.gfx.decreaseRef()
            }
        },
        setEntrySprite: function(a, b) {
            var d = this.coll;
            b.sheet ? a.setEntityDefault(this, b.sheet.w, b.sheet.h, "NO_EXPAND", 0, null, b.sheet.gfx, b.sheet.x, b.sheet.y) : b.patternSheet && a.setEntityDefault(this, d.size.x, d.size.y, "NO_EXPAND", 0, null, b.patternSheet.getPattern(0), 0, 0);
            a.setPivot(d.size.x / 2, d.size.y / 2);
            a.setPivot(d.size.x / 2, d.size.y / 2);
            a.setTransform(1, 1, this.animState.angle);
            a.setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this)
        },
        updateSprites: function() {
            var a = 0.4,
                b = this.sprites.length - 1,
                d = this.entries.length,
                g = this.sprites[b--];
            for (this.setEntrySprite(g, this.currentEntry); d--;)
                if (this.entries[d] != this.currentEntry) {
                    g = this.sprites[b--];
                    this.setEntrySprite(g, this.entries[d]);
                    g.setAlpha(g.alpha * a);
                    a = a * 0.4
                }
        },
        varsChanged: function() {
            this.updateEntry()
        }
    });
    sc.LORRY_RAIL_TYPES.HORIZONTAL = {
        gfx: {
            x: 32,
            y: 0
        },
        scaleX: true,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.VERTICAL = {
        gfx: {
            x: 32,
            y: 16
        },
        scaleY: true,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SE = {
        gfx: {
            x: 0,
            y: 0
        },
        points: [{
            x: 1,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SW = {
        gfx: {
            x: 16,
            y: 16
        },
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NE = {
        gfx: {
            x: 0,
            y: 16
        },
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NW = {
        gfx: {
            x: 16,
            y: 0
        },
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.DIAG1 = {
        gfx: {
            x: 0,
            y: 0,
            w: 32
        },
        points: [{
            x: 0.75,
            y: 0
        }, {
            x: 0.25,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.DIAG2 = {
        gfx: {
            x: 0,
            y: 16,
            w: 32
        },
        points: [{
            x: 0.25,
            y: 0
        }, {
            x: 0.75,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.HORIZONTAL_SWITCH = {
        gfx: {
            x: 32,
            y: 32
        },
        scaleX: true,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.VERTICAL_SWITCH = {
        gfx: {
            x: 32,
            y: 48
        },
        scaleY: true,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SE_SWITCH = {
        gfx: {
            x: 0,
            y: 32
        },
        points: [{
            x: 1,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SW_SWITCH = {
        gfx: {
            x: 16,
            y: 32
        },
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NE_SWITCH = {
        gfx: {
            x: 0,
            y: 48
        },
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NW_SWITCH = {
        gfx: {
            x: 16,
            y: 48
        },
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.STOP_WEST = {
        gfx: {
            x: 48,
            y: 0
        },
        points: [{
            x: 1,
            y: 0.5
        }, {
            x: 0.5,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.STOP_EAST = {
        gfx: {
            x: 48,
            y: 16
        },
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 0.5,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.STOP_SOUTH = {
        gfx: {
            x: 48,
            y: 32
        },
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 0.5
        }]
    };
    sc.LORRY_RAIL_TYPES.STOP_NORTH = {
        gfx: {
            x: 48,
            y: 48
        },
        points: [{
            x: 0.5,
            y: 1
        }, {
            x: 0.5,
            y: 0.5
        }]
    }
});
ig.baked = !0;
