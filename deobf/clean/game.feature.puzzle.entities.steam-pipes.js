ig.module("game.feature.puzzle.entities.steam-pipes").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.STEAM_PIPE_TYPES = {};
    var SPEED_FACTOR = 4 / 220,
        tmpVec2a = Vec2.create(),
        tmpVec2b = Vec2.create(),
        tmpVec3 = Vec3.create();
    sc.SteamTools = {
        propagateSteam: function(pipe, point, fastMode, glowEntity) {
            for (var globalPoint = this.getGlobalPoint(tmpVec2a, pipe, point), entities = ig.game.getEntitiesInRectangle(globalPoint.x - 1, globalPoint.y - 1, pipe.coll.pos.z - 1, 4, 4, 4, pipe), i = entities.length; i--;) {
                var entity = entities[i];
                if (entity.receiveSteam && entity.receiveSteam(globalPoint, fastMode, glowEntity)) return true;
            }
            if (glowEntity) glowEntity.stop(globalPoint, pipe.coll.pos.z);
            return false;
        },
        getClosestPoint: function(pipe, points, pos, maxDistance) {
            var pointA = this.getGlobalPoint(tmpVec2a, pipe, points[0]),
                distA = Vec2.distance(pointA, pos),
                pointB = this.getGlobalPoint(tmpVec2a, pipe, points[1]),
                distB = Vec2.distance(pointB, pos);
            if (maxDistance && Math.min(distA, distB) > maxDistance) return -1;
            return distA < distB ? 0 : 1;
        },
        getGlobalPoint: function(out, pipe, point) {
            out = Vec2.assign(out, point);
            Vec2.mul(out, pipe.coll.size);
            Vec2.add(out, pipe.coll.pos);
            return out;
        }
    };
    sc.SteamGlowEntity = ig.Entity.extend({
        lightHandle: null,
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.setSize(0, 0, 0);
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.S, 0.1, 0.3, -1, 1, true);
            ig.light.addLightHandle(this.lightHandle);
        },
        stop: function(pos, z) {
            var hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                attack: {
                    type: "MASSIVE",
                    element: "HEAT",
                    damageFactor: 0,
                    spFactor: 0,
                    hints: ["STEAM_PIPE"]
                },
                pos: Vec3.createC(pos.x, pos.y, z),
                radius: 4,
                zHeight: 4,
                duration: 0.1,
                expandRadius: 0,
                alwaysFull: true,
                party: "OTHER",
                centralAngle: 1
            });
            sc.combat.addCombatForce(hitForce);
            this.lightHandle.stop();
            this.kill();
        }
    });
    ig.ENTITY.SteamPipe = ig.Entity.extend({
        pipeType: null,
        gfx: null,
        steam: {
            startPoint: 0,
            duration: 0,
            startTimer: 0,
            endTimer: 0,
            lightTimer: 0,
            propagated: false,
            glowEntity: null
        },
        _wm: new ig.Config({
            alwaysRecreate: true,
            spawnable: true,
            attributes: {
                pipeType: {
                    _type: "String",
                    _info: "Type of rail",
                    _select: sc.STEAM_PIPE_TYPES
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            var mapStyle = ig.mapStyle.get("pipes");
            this.pipeType = sc.STEAM_PIPE_TYPES[settings.pipeType] || sc.STEAM_PIPE_TYPES.HORIZONTAL;
            var pipeType = this.pipeType;
            if (mapStyle && pipeType) {
                if (!pipeType.scaleX || this.coll.size.x % 16 != 0) this.coll.size.x = pipeType.size.x;
                if (!pipeType.scaleY || this.coll.size.y % 16 != 0) this.coll.size.y = pipeType.size.y;
                this.coll.size.z = pipeType.size.z;
                if (pipeType.scaleX || pipeType.scaleY) {
                    if (window.wm) {
                        this._wm = this._wm.copy();
                        this._wm.scalableX = pipeType.scaleX;
                        this._wm.scalableY = pipeType.scaleY;
                        this._wm.scalableStep = 16;
                    }
                    var opt = pipeType.scaleX ? ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y;
                    this.gfx = {
                        pattern: new ig.ImagePatternSheet(mapStyle.sheet, opt, pipeType.gfx.w || 16, pipeType.gfx.h | 16, mapStyle.x + pipeType.gfx.x, mapStyle.y + pipeType.gfx.y, 1, 1),
                        glowPattern: new ig.ImagePatternSheet(mapStyle.sheet, opt, pipeType.gfx.w || 16, pipeType.gfx.h | 16, mapStyle.x + pipeType.gfx.x, mapStyle.y + pipeType.gfx.y + 32, 1, 1)
                    };
                } else this.gfx = {
                    sheet: new ig.Image(mapStyle.sheet),
                    x: mapStyle.x + pipeType.gfx.x,
                    y: mapStyle.y + pipeType.gfx.y
                };
            } else this.coll.setSize(16, 16, 6);
        },
        onKill: function(entity) {
            if (this.gfx) {
                if (this.gfx.pattern) this.gfx.pattern.decreaseRef();
                if (this.gfx.glowPattern) this.gfx.glowPattern.decreaseRef();
                if (this.gfx.sheet) this.gfx.sheet.decreaseRef();
            }
            this.parent(entity);
        },
        initSprites: function() {
            this.setSpriteCount(4);
            for (var coll = this.coll, i = this.sprites.length; i--;) {
                var sprite = this.sprites[i];
                sprite.setSize(coll.size.x, coll.size.y, this.pipeType.renderHeight, coll.size.y);
                sprite.setPosFromEntity(this, null, null, 0);
            }
        },
        update: function() {
            if (this.steam.duration) {
                if (!this.steam.propagated) {
                    this.steam.startTimer = this.steam.startTimer + ig.system.tick;
                    if (this.steam.startTimer >= this.steam.duration) {
                        var nextPoint = this.pipeType.points[1 - this.steam.startPoint];
                        sc.SteamTools.propagateSteam(this, nextPoint, this.steam.fastMode, this.steam.glowEntity);
                        this.steam.propagated = true;
                    }
                }
                this.steam.lightTimer = this.steam.lightTimer + ig.system.tick;
                if (this.steam.glowEntity && this.steam.lightTimer >= this.steam.duration) this.steam.glowEntity = null;
                if (this.steam.glowEntity && this.steam.lightTimer >= 0) {
                    var startPoint = this.pipeType.points[this.steam.startPoint],
                        endPoint = this.pipeType.points[1 - this.steam.startPoint],
                        lerped = Vec2.lerp(startPoint, endPoint, this.steam.lightTimer / this.steam.duration, tmpVec2a),
                        globalPoint = sc.SteamTools.getGlobalPoint(tmpVec2b, this, lerped),
                        z = Math.round(this.steam.glowEntity.coll.pos.z * 0.8 + (this.coll.pos.z + (this.coll.size.z == 32 ? 17 : 2)) * 0.2);
                    this.steam.glowEntity.setPos(globalPoint.x, globalPoint.y, z);
                }
                this.steam.endTimer = this.steam.endTimer + ig.system.tick;
                if (this.steam.endTimer >= this.steam.duration) this.steam.duration = 0;
            }
            this.parent();
        },
        updateSprites: function() {
            var sprite = this.sprites[0];
            if (this.gfx.pattern) sprite.setImageSrc(this.gfx.pattern.getPattern(0), 0, 0);
            else sprite.setImageSrc(this.gfx.sheet, this.gfx.x, this.gfx.y);
            for (var i = 3, timeStep = SPEED_FACTOR / (this.steam.fastMode ? 1 : sc.options.get("assist-puzzle-speed")); i--;) {
                var steamSprite = this.sprites[i + 1];
                if (this.steam.duration) {
                    if (this.gfx.pattern) steamSprite.setImageSrc(this.gfx.glowPattern.getPattern(0), 0, 0);
                    else steamSprite.setImageSrc(this.gfx.sheet, this.gfx.x, this.gfx.y + 32);
                    steamSprite.setGfxCut(0, 0, 0, 0);
                    steamSprite.renderMode = "lighter";
                    var startPoint = this.pipeType.points[this.steam.startPoint],
                        progress = (1 - this.steam.startTimer / this.steam.duration).limit(0, 1);
                    this._cutSprite(steamSprite, startPoint, progress);
                    var endPoint = this.pipeType.points[1 - this.steam.startPoint];
                    progress = ((this.steam.endTimer + i * timeStep) / this.steam.duration).limit(0, 1);
                    this._cutSprite(steamSprite, endPoint, progress);
                } else steamSprite.setInvisible();
            }
        },
        _cutSprite: function(sprite, point, progress) {
            if (point.y == 0.5) {
                progress = Math.round(sprite.size.x * progress);
                point.x == 1 ? sprite.gfxCut.left = progress : sprite.gfxCut.right = progress;
            } else {
                progress = Math.round((sprite.size.y + sprite.size.z) * progress);
                point.y == 1 ? sprite.gfxCut.top = progress : sprite.gfxCut.bottom = progress;
            }
        },
        receiveSteam: function(pos, fastMode, glowEntity) {
            var pointIdx = sc.SteamTools.getClosestPoint(this, this.pipeType.points, pos, 4);
            if (pointIdx == -1) return false;
            this.steam.startPoint = pointIdx;
            var length = this.pipeType.scaleX ? this.coll.size.x : this.pipeType.scaleY ? this.coll.size.y : 16;
            this.steam.fastMode = fastMode;
            var speed = 220 * (fastMode ? 1 : sc.options.get("assist-puzzle-speed"));
            this.steam.duration = length / speed;
            this.steam.startTimer = 0;
            this.steam.endTimer = -40 / speed;
            this.steam.lightTimer = -8 / speed;
            this.steam.propagated = false;
            if (!glowEntity) glowEntity = ig.game.spawnEntity(sc.SteamGlowEntity, pos.x, pos.y, this.coll.pos.z, {});
            this.steam.glowEntity = glowEntity;
            this.steam.lightHandle = null;
            return true;
        }
    });
    sc.STEAM_PIPE_TYPES.HORIZONTAL = {
        gfx: { x: 32, y: 0 },
        scaleX: true,
        size: { x: 16, y: 12, z: 5 },
        renderHeight: 4,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_PIPE_TYPES.VERTICAL = {
        gfx: { x: 32, y: 16 },
        scaleY: true,
        size: { x: 16, y: 16, z: 5 },
        renderHeight: 0,
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_SE = {
        gfx: { x: 0, y: 0 },
        size: { x: 16, y: 12, z: 5 },
        renderHeight: 4,
        points: [{ x: 1, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_SW = {
        gfx: { x: 16, y: 0 },
        size: { x: 16, y: 12, z: 5 },
        renderHeight: 4,
        points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_NE = {
        gfx: { x: 0, y: 16 },
        size: { x: 16, y: 16, z: 5 },
        renderHeight: 0,
        points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_NW = {
        gfx: { x: 16, y: 16 },
        size: { x: 16, y: 16, z: 5 },
        renderHeight: 0,
        points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }]
    };
    sc.STEAM_PIPE_TYPES.END_NORTH = {
        gfx: { x: 48, y: 6 },
        size: { x: 16, y: 16, z: 5 },
        renderHeight: 10,
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_PIPE_TYPES.OVEN_EAST = {
        gfx: { x: 64, y: 0 },
        size: { x: 16, y: 12, z: 32 },
        renderHeight: 20,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_PIPE_TYPES.OVEN_WEST = {
        gfx: { x: 80, y: 0 },
        size: { x: 16, y: 12, z: 32 },
        renderHeight: 20,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_PIPE_TYPES.UPPER_PIPE = {
        gfx: { x: 96, y: 0, w: 16, h: 32 },
        size: { x: 16, y: 12, z: 32 },
        renderHeight: 20,
        scaleX: true,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_TURNOUT_TYPES = {};
    ig.ENTITY.SteamTurnout = ig.AnimatedEntity.extend({
        turnDefault: null,
        turnAlt: null,
        condition: null,
        points: [],
        isOn: false,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble")
        },
        _wm: new ig.Config({
            alwaysRecreate: true,
            spawnable: true,
            attributes: {
                turnDefault: {
                    _type: "String",
                    _info: "Default turn of turnout",
                    _select: sc.STEAM_TURNOUT_TYPES
                },
                turnAlt: {
                    _type: "String",
                    _info: "Alternative turn of turnout",
                    _select: sc.STEAM_TURNOUT_TYPES
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition to switch to turnAlt"
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 10);
            var mapStyle = ig.mapStyle.get("pipes"),
                defaultType = sc.STEAM_TURNOUT_TYPES[settings.turnDefault] || sc.STEAM_TURNOUT_TYPES.CURVE_NE,
                altType = sc.STEAM_TURNOUT_TYPES[settings.turnAlt] || sc.STEAM_TURNOUT_TYPES.CURVE_NE;
            this.points.push(defaultType.points);
            this.points.push(altType.points);
            this.initAnimations({
                shapeType: "XY_EXPAND",
                wallY: 1,
                sheet: {
                    src: mapStyle.sheet,
                    width: 16,
                    height: 24,
                    xCount: 3,
                    offX: mapStyle.x,
                    offY: mapStyle.y + 64
                },
                SUB: [{
                    name: "off",
                    time: 0.1,
                    frames: [defaultType.tile],
                    repeat: true
                }, {
                    name: "on",
                    time: 0.1,
                    frames: [altType.tile],
                    repeat: true
                }]
            });
            this.condition = new ig.VarCondition(settings.condition);
            this.isOn = this.condition.evaluate();
            this.setCurrentAnim(this.isOn ? "on" : "off");
        },
        receiveSteam: function(pos, fastMode, glowEntity) {
            this.effects.sheet.spawnOnTarget("steamTurnout", this);
            var points = this.points[this.isOn ? 1 : 0],
                pointIdx = sc.SteamTools.getClosestPoint(this, points, pos, 4);
            if (pointIdx == -1) glowEntity.stop(pos, this.coll.pos.z);
            else sc.SteamTools.propagateSteam(this, points[1 - pointIdx], fastMode, glowEntity);
            return true;
        },
        varsChanged: function() {
            var isOn = this.condition.evaluate();
            if (this.isOn != isOn) {
                this.isOn = isOn;
                this.effects.sheet.spawnOnTarget("turnoutChange", this);
                this.setCurrentAnim(this.isOn ? "on" : "off", true);
            }
        }
    });
    sc.STEAM_TURNOUT_TYPES.HORIZONTAL = {
        tile: 2,
        points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_TURNOUT_TYPES.VERTICAL = {
        tile: 5,
        points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_SE = {
        tile: 0,
        points: [{ x: 1, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_SW = {
        tile: 1,
        points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 1 }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_NE = {
        tile: 3,
        points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_NW = {
        tile: 4,
        points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }]
    };
    ig.ENTITY.SteamOven = ig.AnimatedEntity.extend({
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble"),
            handle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                fastMode: {
                    _type: "Boolean",
                    _info: "Make sure puzzle element is not slowed down by assist mode"
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 32);
            var mapStyle = ig.mapStyle.get("pipes");
            this.fastMode = settings.fastMode;
            this.initAnimations({
                namedSheets: {
                    floor: {
                        src: mapStyle.sheet,
                        width: 16,
                        height: 16,
                        xCount: 1,
                        offX: mapStyle.x + 80,
                        offY: mapStyle.y + 64
                    },
                    top: {
                        src: mapStyle.sheet,
                        width: 16,
                        height: 32,
                        xCount: 1,
                        offX: mapStyle.x + 64,
                        offY: mapStyle.y + 64
                    }
                },
                SUB: [{
                    name: "default",
                    sheet: "floor",
                    time: 0.2,
                    frames: [0, 1, 2, 1],
                    repeat: true,
                    size: { x: 16, y: 16, z: 0 }
                }, {
                    name: "default",
                    sheet: "top",
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    size: { x: 16, y: 16, z: 16 },
                    offset: { x: 0, y: 0, z: 12 }
                }]
            });
            this.setCurrentAnim("default");
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0, 0.2, -1, 1, true);
            this.lightHandle.setOffset(0, 0, -16);
            ig.light.addLightHandle(this.lightHandle);
        },
        collideWith: function(entity, other) {
            if (other && !Vec2.isZero(other) && entity.isIceDisk && entity.isIceDisk() && entity.coll.pos.z == this.coll.pos.z) {
                this.startSteam();
                var alignedPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3);
                entity.consume(alignedPos);
            }
        },
        startSteam: function() {
            this.effects.sheet.spawnOnTarget("ovenActivate", this);
            sc.SteamTools.propagateSteam(this, { x: 0, y: 0.5 }, this.fastMode);
            sc.SteamTools.propagateSteam(this, { x: 1, y: 0.5 }, this.fastMode);
        }
    });
});
ig.baked = !0;
