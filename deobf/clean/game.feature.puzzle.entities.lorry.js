/**
 * game.feature.puzzle.entities.lorry
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.lorry")`.
 *
 * `ig.ENTITY.Lorry`: moving platform that rides a rail
 * (`ig.ENTITY.LorryRail`), with `ig.ENTITY.LorryRespawner` to restore it.
 * `sc.LORRY_TYPES`/`sc.LORRY_MOVE_TYPES`/`sc.LORRY_RAIL_TYPES`/`sc.LORRY_SPEED`
 * are the data tables.
 */
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
    sc.LORRY_SPEED.FASTER = 180;
    sc.LORRY_SPEED.FASTEST = 240;
    var tmpVecA = Vec3.create(),
        tmpVecB = Vec3.create(),
        effects = new ig.EffectSheet("puzzle.lorry");
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.moveType = sc.LORRY_MOVE_TYPES[settings.moveType] || sc.LORRY_MOVE_TYPES.PERMA_MOVE;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE4[settings.initDir], this.initDir);
            this.maxSpeed = sc.LORRY_SPEED[settings.speed] || sc.LORRY_SPEED.DEFAULT;
            this.moveCondition = new ig.VarCondition(settings.moveCondition || null);
            this.fastMode = settings.fastMode || false;
            var mapStyle = ig.mapStyle.get("lorry"),
                lorryType = sc.LORRY_TYPES[settings.lorryType];
            if (this.lorryType = lorryType) {
                this.coll.setSize(lorryType.size.x, lorryType.size.y, lorryType.size.z);
                this.initAnimations({
                    sheet: {
                        src: mapStyle.sheet,
                        width: lorryType.gfx.w,
                        height: lorryType.gfx.h,
                        xCount: lorryType.gfx.xCount,
                        offX: mapStyle.lorryX + lorryType.gfx.x,
                        offY: mapStyle.lorryY + lorryType.gfx.y
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
                });
            }
            if (this.moveType.perma && (!window.wm && this.moveCondition.evaluate())) this.setMove(true, true);
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                effects.spawnOnTarget("lorryAppear", this, {
                    align: "TOP"
                });
            }
        },
        resetPos: function(pos, initDir) {
            var aligned = this.getAlignedPos(ig.ENTITY_ALIGN.TOP, tmpVecA);
            effects.spawnFixed("lorryDisappear", aligned.x, aligned.y, aligned.z);
            this.setPos(pos.x, pos.y, pos.z);
            this.grabRail(initDir);
            this.setMove(false, true);
            this.pauseTimer = this.slowDownAccel = this.currentSpeed = this.animState.alpha = 0;
            effects.spawnOnTarget("lorryAppear", this, {
                align: "TOP"
            });
        },
        setMove: function(moving, silent) {
            this.moving = moving;
            this.setCurrentAnim(this.moving ? "on" : "off");
            if (this.moving && !this.lightHandle) {
                this.fxHandle = effects.spawnOnTarget("lorryRuns", this, {
                    duration: -1
                });
                this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.XL, 0.2, 0.2, -1, 1);
                ig.light.addLightHandle(this.lightHandle);
                if (!silent) effects.spawnOnTarget("lorryActivate", this, {
                    align: "TOP"
                });
            } else if (!this.moving && this.lightHandle) {
                if (this.fxHandle) this.fxHandle.stop();
                this.lightHandle.stop();
                this.lightHandle = null;
                if (!silent) effects.spawnOnTarget("lorryDeactivate", this, {
                    align: "TOP"
                });
            }
        },
        update: function() {
            if (!this.moveDest.currentRail) this.grabRail(this.initDir);
            if (this.moving)
                if (this.pauseTimer > 0) {
                    this.pauseTimer = this.pauseTimer - ig.system.tick;
                    if (this.pauseTimer <= 0) this.pauseTimer = 0;
                    if (this.moveType.onPauseFreeStop) {
                        var entitiesOnTop = ig.game.getEntitiesOnTop(this);
                        if (entitiesOnTop.indexOf(ig.game.playerEntity) == -1) this.setMove(false);
                    }
                } else {
                    this.moveLorry();
                    if (this.moveType.onFreeStop) {
                        var entitiesOnTop = ig.game.getEntitiesOnTop(this);
                        if (entitiesOnTop.indexOf(ig.game.playerEntity) == -1) {
                            this.currentSpeed = 0;
                            this.setMove(false);
                        }
                    }
                }
            this.parent();
        },
        moveLorry: function() {
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVecA),
                dest = this.moveDest;
            var maxSpeed = this.maxSpeed * (this.fastMode ? 1 : sc.options.get("assist-puzzle-speed"));
            var moveDist;
            if (!this.slowDownAccel && this.currentSpeed >= maxSpeed || this.slowDownAccel && this.currentSpeed <= 15) {
                this.currentSpeed = this.currentSpeed.limit(15, maxSpeed);
                moveDist = this.currentSpeed * ig.system.tick;
            } else {
                var accel = this.slowDownAccel ? -this.slowDownAccel : maxSpeed * 2;
                moveDist = this.currentSpeed * ig.system.tick + accel * ig.system.tick * ig.system.tick;
                this.currentSpeed = this.currentSpeed + accel * ig.system.tick;
            }
            var reachedEnd = false;
            while (moveDist) {
                var point = dest.points[dest.pointIdx],
                    toPoint = Vec3.sub(point, pos, tmpVecB),
                    distance = Vec3.length(toPoint);
                if (distance <= moveDist) {
                    moveDist = moveDist - distance;
                    Vec3.assign(pos, point);
                    if (!this.stepPoint()) {
                        moveDist = 0;
                        reachedEnd = true;
                    }
                } else {
                    Vec3.length(toPoint, moveDist);
                    Vec3.add(pos, toPoint);
                    moveDist = 0;
                }
            }
            var coll = this.coll;
            coll.setPos(pos.x - coll.size.x / 2, pos.y - coll.size.y / 2, pos.z, true);
            if (reachedEnd) {
                this.slowDownAccel = 0;
                this.flip();
                this.pauseTimer = 1;
            } else if (!this.slowDownAccel) {
                var brakeDist = this.currentSpeed * 0.5;
                var remaining = dest.currentRail.getGoalDistance(pos, dest.prevRail, brakeDist);
                if (remaining < brakeDist) this.slowDownAccel = 0.5 * this.currentSpeed * this.currentSpeed / remaining;
            }
        },
        collideWith: function(entity) {
            if (this.moveCondition.evaluate() && this.moveType.onTouchStart && entity.isPlayer && !this.moving) {
                this.pauseTimer = 0.4;
                this.setMove(true);
            }
        },
        varsChanged: function() {
            var shouldMove = this.moveCondition.evaluate();
            if (!shouldMove && this.moving) {
                this.currentSpeed = 0;
                this.setMove(false);
            } else if (shouldMove && !this.moving) {
                var entitiesOnTop = ig.game.getEntitiesOnTop(this);
                if (!this.moveType.onTouchStart || entitiesOnTop.indexOf(ig.game.playerEntity) != -1) {
                    this.pauseTimer = 0.4;
                    this.setMove(true);
                }
            }
        },
        stepPoint: function() {
            var dest = this.moveDest;
            if (dest.pointIdx < dest.points.length - 1) {
                dest.pointIdx++;
                return true;
            }
            if (dest.nextRail) {
                var lastPoint = dest.points.last();
                dest.nextRail.getPoints(dest, lastPoint);
                return true;
            }
            return false;
        },
        flip: function() {
            var dest = this.moveDest,
                reversed = [];
            for (var i = dest.points.length; i--;) reversed.push(dest.points[i]);
            dest.points = reversed;
            dest.pointIdx = reversed.length - dest.pointIdx;
            var prevRail = dest.prevRail;
            dest.prevRail = dest.nextRail;
            dest.nextRail = prevRail;
        },
        grabRail: function(initDir) {
            for (var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVecA), rails = ig.game.getEntitiesInRectangle(pos.x - 1, pos.y - 1, pos.z - 1, 2, 2, 2, this), i = rails.length; i--;)
                if (rails[i] instanceof ig.ENTITY.LorryRail) rails[i].getInitialPoints(this.moveDest, pos, initDir);
        },
        applyMarkerPosition: function(marker) {
            marker.coll.level = this.coll.level;
            marker.coll.pos.z = marker.coll.baseZPos = this.coll.baseZPos + this.coll.size.z;
            marker.face.x = this.initDir.x;
            marker.face.y = this.initDir.y;
            marker.setPos(this.coll.pos.x + this.coll.size.x / 2 - marker.coll.size.x / 2, this.coll.pos.y + this.coll.size.y / 2 - marker.coll.size.y / 2);
            this.setMove(true, true);
            this.currentSpeed = this.maxSpeed * (this.fastMode ? 1 : sc.options.get("assist-puzzle-speed"));
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE4[settings.initDir], this.initDir);
            this.lorrySrc = settings.lorryEntity;
            this.lastAlpha = 0;
        },
        fetchLorry: function() {
            if ((this.lorry = ig.Event.getEntity(this.lorrySrc)) && this.lorry.lorryType) {
                var mapStyle = ig.mapStyle.get("lorry"),
                    lorryType = this.lorry.lorryType;
                if (lorryType) {
                    var coll = this.coll,
                        diffX = lorryType.size.x - this.coll.size.x,
                        diffY = lorryType.size.y - this.coll.size.y;
                    coll.setSize(lorryType.size.x, lorryType.size.y, 0);
                    this.initAnimations({
                        sheet: {
                            src: mapStyle.sheet,
                            width: lorryType.gfx.w - 2,
                            height: lorryType.gfx.h - 2,
                            offX: mapStyle.lorryX + lorryType.gfx.x + 1,
                            offY: mapStyle.lorryY + lorryType.gfx.y + 1 + lorryType.gfx.h * 2
                        },
                        renderMode: "lighter",
                        SUB: [{
                            name: "default",
                            time: 1,
                            frames: [0],
                            repeat: false
                        }]
                    });
                    this.setPos(coll.pos.x - diffX / 2, coll.pos.y - diffY / 2, coll.pos.z);
                }
            }
        },
        update: function() {
            if (!this.lorry) this.fetchLorry();
            if (this.lorry) {
                var alpha = 1,
                    player = ig.game.playerEntity;
                if (ig.EntityTools.getGroundEntity(player) == this.lorry) alpha = 0;
                var distance = ig.CollTools.getGroundDistance(this.coll, this.lorry.coll);
                if (!this.lorry.moving && distance > 48) distance = 200;
                if (distance < 48) alpha = 0;
                else if (distance < 200) alpha = alpha * ((distance - 48) / 152);
                alpha = KEY_SPLINES.EASE_OUT.get(alpha);
                var lerpFactor = ig.system.tick * 10;
                this.lastAlpha = lerpFactor * alpha + this.lastAlpha * (1 - lerpFactor);
                this.animState.alpha = this.lastAlpha;
                this.animState.scaleX = this.lastAlpha;
                this.animState.scaleY = this.lastAlpha;
                var playerDist = ig.CollTools.getGroundDistance(player.coll, this.coll);
                if (distance >= 200 && playerDist <= 48) {
                    this.lorry.resetPos(this.coll.pos, this.initDir);
                    var playerColl = player.coll;
                    if (this.lorry.coll.intersectsWith(playerColl.pos.x, playerColl.pos.y, playerColl.pos.z, playerColl.size.x, playerColl.size.y, playerColl.size.z))
                        player.setPos(playerColl.pos.x, playerColl.pos.y, playerColl.pos.z + this.lorry.coll.size.z);
                }
            }
            this.parent();
        }
    });
    sc.LORRY_TYPES.BIG = {
        size: { x: 48, y: 48, z: 2 },
        gfx: { x: 0, y: 0, w: 48, h: 48, xCount: 1 }
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            if (!settings.size) this.coll.setSize(16, 16, 0);
            var railType = sc.LORRY_RAIL_TYPES[settings.railType];
            if (railType && (railType.scaleX || railType.scaleY)) {
                if ((!railType.scaleX && this.coll.size.x != 16 || !railType.scaleY && this.coll.size.y != 16)) this.coll.setSize(16, 16, 0);
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.scalableX = railType.scaleX;
                    this._wm.scalableY = railType.scaleY;
                    this._wm.scalableStep = 16;
                }
            } else this.coll.setSize(railType.gfx.w ? railType.gfx.w : 16, 16, 0);
            this.pushEntry(settings.railType, null);
            if (settings.altTypes) {
                var altTypes = settings.altTypes;
                for (var i = 0; i < altTypes.length; ++i) this.pushEntry(altTypes[i].railType, new ig.VarCondition(altTypes[i].condition));
            }
            this.updateEntry(true);
        },
        initSprites: function() {
            this.setSpriteCount(this.entries.length);
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                effects.spawnOnTarget("railAppear", this);
            }
        },
        connectNeighbours: function() {
            if (!this.connectedNeighbours) {
                for (var i = this.entries.length; i--;) this.connectNeighboursForEntry(this.entries[i]);
                this.connectedNeighbours = true;
            }
        },
        connectNeighboursForEntry: function(entry) {
            if (entry)
                for (var side = 2; side--;) {
                    var point = entry.points[side ? 0 : entry.points.length - 1],
                        found = ig.game.getEntitiesInRectangle(point.x - 1, point.y - 1, point.z - 1, 2, 2, 2, this),
                        neighbour = null;
                    for (var i = found.length; i--;)
                        if (found[i] instanceof ig.ENTITY.LorryRail) neighbour = found[i];
                    entry.neighbours.push(neighbour);
                }
        },
        pushEntry: function(railTypeName, condition) {
            var entry = {
                    condition: condition,
                    sheet: null,
                    patternSheet: null,
                    points: [],
                    neighbours: []
                },
                mapStyle = ig.mapStyle.get("lorry"),
                railType = sc.LORRY_RAIL_TYPES[railTypeName];
            if (mapStyle && railType) {
                if (railType.scaleX || railType.scaleY)
                    entry.patternSheet = new ig.ImagePatternSheet(mapStyle.sheet, railType.scaleX ? ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y, 16, 16, mapStyle.railX + railType.gfx.x, mapStyle.railY + railType.gfx.y, 1, 1);
                else entry.sheet = {
                    gfx: new ig.Image(mapStyle.sheet),
                    x: mapStyle.railX + railType.gfx.x,
                    y: mapStyle.railY + railType.gfx.y,
                    w: railType.gfx.w || 16,
                    h: 16
                };
                var points = railType.points;
                for (var i = 0; i < points.length; ++i) {
                    var point = points[i],
                        entryPoint = Vec3.create(this.coll.pos);
                    entryPoint.x = entryPoint.x + this.coll.size.x * point.x;
                    entryPoint.y = entryPoint.y + this.coll.size.y * point.y;
                    entryPoint.z = entryPoint.z + this.coll.size.z * (point.z || 0);
                    entry.points.push(entryPoint);
                }
            }
            this.entries.push(entry);
        },
        getInitialPoints: function(dest, pos, initDir) {
            this.connectNeighbours();
            var entry = this.currentEntry,
                toFirst = Vec3.sub(entry.points[0], pos, tmpVecA);
            if (Vec2.dot(toFirst, initDir) <= 0) this._transferPoints(dest, entry, false);
            else this._transferPoints(dest, entry, true);
        },
        getGoalDistance: function(pos, fromRail, maxDistance) {
            this.connectNeighbours();
            var entry = this.currentEntry,
                endPoint = null,
                nextRail = null;
            for (var i = -1; i < this.entries.length; ++i) {
                entry = i == -1 ? this.currentEntry : this.entries[i];
                if (i != -1 && entry == this.currentEntry) continue;
                if (entry.neighbours[0] == fromRail) {
                    endPoint = entry.points.last();
                    nextRail = entry.neighbours[1];
                } else if (entry.neighbours[1] == fromRail) {
                    endPoint = entry.points[0];
                    nextRail = entry.neighbours[0];
                }
            }
            if (!endPoint) return 0;
            var distance = Vec3.distance(pos, endPoint);
            return distance < maxDistance && nextRail ? distance + nextRail.getGoalDistance(endPoint, this, maxDistance - distance) : distance;
        },
        getPoints: function(dest, pos) {
            this.connectNeighbours();
            var bestDist = this._getPointsForEntry(dest, this.currentEntry, pos, -1);
            if (bestDist != 0)
                for (var i = this.entries.length; i--;) {
                    bestDist = this._getPointsForEntry(dest, this.entries[i], pos, bestDist);
                    if (bestDist == 0) break;
                }
        },
        _getPointsForEntry: function(dest, entry, pos, bestDist) {
            var distFirst = Vec3.distance(pos, entry.points[0]),
                distLast = Vec3.distance(pos, entry.points.last());
            if (distFirst <= distLast && (bestDist == -1 || distFirst < bestDist)) {
                this._transferPoints(dest, entry, false);
                return distFirst;
            }
            if (distLast < distFirst && (bestDist == -1 || distLast < bestDist)) {
                this._transferPoints(dest, entry, true);
                return distLast;
            }
            return bestDist;
        },
        _transferPoints: function(dest, entry, reversed) {
            dest.currentRail = this;
            dest.pointIdx = 1;
            if (reversed) {
                dest.prevRail = entry.neighbours[1];
                dest.nextRail = entry.neighbours[0];
                dest.points.length = 0;
                for (var i = entry.points.length; i--;) dest.points.push(entry.points[i]);
            } else {
                dest.prevRail = entry.neighbours[0];
                dest.nextRail = entry.neighbours[1];
                dest.points.length = 0;
                dest.points.push.apply(dest.points, entry.points);
            }
        },
        updateEntry: function(instant) {
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i];
                if (!entry.condition || entry.condition.evaluate()) {
                    if (this.currentEntry != entry) {
                        if (!instant) effects.spawnOnTarget("railSwitch", this);
                        this.currentEntry = entry;
                    }
                    break;
                }
            }
        },
        update: function() {
            this.connectNeighbours();
            this.parent();
        },
        onKill: function(entity) {
            this.parent(entity);
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i];
                if (entry.patternSheet) entry.patternSheet.decreaseRef();
                if (entry.sheet) entry.sheet.gfx.decreaseRef();
            }
        },
        setEntrySprite: function(sprite, entry) {
            var coll = this.coll;
            if (entry.sheet) sprite.setEntityDefault(this, entry.sheet.w, entry.sheet.h, "NO_EXPAND", 0, null, entry.sheet.gfx, entry.sheet.x, entry.sheet.y);
            else if (entry.patternSheet) sprite.setEntityDefault(this, coll.size.x, coll.size.y, "NO_EXPAND", 0, null, entry.patternSheet.getPattern(0), 0, 0);
            sprite.setPivot(coll.size.x / 2, coll.size.y / 2);
            sprite.setPivot(coll.size.x / 2, coll.size.y / 2);
            sprite.setTransform(1, 1, this.animState.angle);
            sprite.setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this);
        },
        updateSprites: function() {
            var alpha = 0.4,
                spriteIdx = this.sprites.length - 1,
                entryCount = this.entries.length,
                sprite = this.sprites[spriteIdx--];
            this.setEntrySprite(sprite, this.currentEntry);
            while (entryCount--)
                if (this.entries[entryCount] != this.currentEntry) {
                    sprite = this.sprites[spriteIdx--];
                    this.setEntrySprite(sprite, this.entries[entryCount]);
                    sprite.setAlpha(sprite.alpha * alpha);
                    alpha = alpha * 0.4;
                }
        },
        varsChanged: function() {
            this.updateEntry();
        }
    });
    sc.LORRY_RAIL_TYPES.HORIZONTAL = {
        gfx: { x: 32, y: 0 },
        scaleX: true,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.VERTICAL = {
        gfx: { x: 32, y: 16 },
        scaleY: true,
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SE = {
        gfx: { x: 0, y: 0 },
        points: [{ x: 1, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SW = {
        gfx: { x: 16, y: 16 },
        points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NE = {
        gfx: { x: 0, y: 16 },
        points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NW = {
        gfx: { x: 16, y: 0 },
        points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.DIAG1 = {
        gfx: { x: 0, y: 0, w: 32 },
        points: [{ x: 0.75, y: 0 }, { x: 0.25, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.DIAG2 = {
        gfx: { x: 0, y: 16, w: 32 },
        points: [{ x: 0.25, y: 0 }, { x: 0.75, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.HORIZONTAL_SWITCH = {
        gfx: { x: 32, y: 32 },
        scaleX: true,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.VERTICAL_SWITCH = {
        gfx: { x: 32, y: 48 },
        scaleY: true,
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SE_SWITCH = {
        gfx: { x: 0, y: 32 },
        points: [{ x: 1, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_SW_SWITCH = {
        gfx: { x: 16, y: 32 },
        points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NE_SWITCH = {
        gfx: { x: 0, y: 48 },
        points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.CURVE_NW_SWITCH = {
        gfx: { x: 16, y: 48 },
        points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.STOP_WEST = {
        gfx: { x: 48, y: 0 },
        points: [{ x: 1, y: 0.5 }, { x: 0.5, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.STOP_EAST = {
        gfx: { x: 48, y: 16 },
        points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.STOP_SOUTH = {
        gfx: { x: 48, y: 32 },
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }]
    };
    sc.LORRY_RAIL_TYPES.STOP_NORTH = {
        gfx: { x: 48, y: 48 },
        points: [{ x: 0.5, y: 1 }, { x: 0.5, y: 0.5 }]
    };
});
ig.baked = !0;
