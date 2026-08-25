ig.module("game.feature.puzzle.entities.steam-pipes").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.STEAM_PIPE_TYPES = {};
    var b = 4 / 220,
        a = Vec2.create(),
        d = Vec2.create(),
        c = Vec3.create();
    sc.SteamTools = {
        propagateSteam: function(b, c, d, h) {
            for (var c = this.getGlobalPoint(a, b, c), i = ig.game.getEntitiesInRectangle(c.x - 1, c.y - 1, b.coll.pos.z - 1, 4, 4, 4, b), j = i.length; j--;) {
                var k = i[j];
                if (k.receiveSteam && k.receiveSteam(c, d, h)) return true
            }
            h && h.stop(c, b.coll.pos.z);
            return false
        },
        getClosestPoint: function(a,
            b, c, h) {
            var i = this.getGlobalPoint(d, a, b[0]),
                j = Vec2.distance(i, c),
                i = this.getGlobalPoint(d, a, b[1]),
                a = Vec2.distance(i, c);
            return h && Math.min(j, a) > h ? -1 : j < a ? 0 : 1
        },
        getGlobalPoint: function(a, b, c) {
            a = Vec2.assign(a, c);
            Vec2.mul(a, b.coll.size);
            Vec2.add(a, b.coll.pos);
            return a
        }
    };
    sc.SteamGlowEntity = ig.Entity.extend({
        lightHandle: null,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.setSize(0, 0, 0);
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.S, 0.1, 0.3, -1, 1, true);
            ig.light.addLightHandle(this.lightHandle)
        },
        stop: function(a,
            b) {
            var c = new sc.CircleHitForce(ig.game.playerEntity, {
                attack: {
                    type: "MASSIVE",
                    element: "HEAT",
                    damageFactor: 0,
                    spFactor: 0,
                    hints: ["STEAM_PIPE"]
                },
                pos: Vec3.createC(a.x, a.y, b),
                radius: 4,
                zHeight: 4,
                duration: 0.1,
                expandRadius: 0,
                alwaysFull: true,
                party: "OTHER",
                centralAngle: 1
            });
            sc.combat.addCombatForce(c);
            this.lightHandle.stop();
            this.kill()
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.BLOCK;
            a = ig.mapStyle.get("pipes");
            d = this.pipeType = sc.STEAM_PIPE_TYPES[d.pipeType] || sc.STEAM_PIPE_TYPES.HORIZONTAL;
            if (a && d) {
                if (!d.scaleX || this.coll.size.x % 16 != 0) this.coll.size.x = d.size.x;
                if (!d.scaleY || this.coll.size.y % 16 != 0) this.coll.size.y = d.size.y;
                this.coll.size.z = d.size.z;
                if (d.scaleX || d.scaleY) {
                    if (window.wm) {
                        this._wm = this._wm.copy();
                        this._wm.scalableX = d.scaleX;
                        this._wm.scalableY = d.scaleY;
                        this._wm.scalableStep = 16
                    }
                    b = d.scaleX ? ig.ImagePattern.OPT.REPEAT_X : ig.ImagePattern.OPT.REPEAT_Y;
                    this.gfx = {
                        pattern: new ig.ImagePatternSheet(a.sheet, b, d.gfx.w || 16, d.gfx.h | 16, a.x + d.gfx.x, a.y + d.gfx.y, 1, 1),
                        glowPattern: new ig.ImagePatternSheet(a.sheet, b, d.gfx.w || 16, d.gfx.h | 16, a.x + d.gfx.x, a.y + d.gfx.y + 32, 1, 1)
                    }
                } else this.gfx = {
                    sheet: new ig.Image(a.sheet),
                    x: a.x + d.gfx.x,
                    y: a.y + d.gfx.y
                }
            } else this.coll.setSize(16, 16, 6)
        },
        onKill: function(a) {
            if (this.gfx) {
                this.gfx.pattern &&
                    this.gfx.pattern.decreaseRef();
                this.gfx.glowPattern && this.gfx.glowPattern.decreaseRef();
                this.gfx.sheet && this.gfx.sheet.decreaseRef()
            }
            this.parent(a)
        },
        initSprites: function() {
            this.setSpriteCount(4);
            for (var a = this.coll, b = this.sprites.length; b--;) {
                var c = this.sprites[b];
                c.setSize(a.size.x, a.size.y, this.pipeType.renderHeight, a.size.y);
                c.setPosFromEntity(this, null, null, 0)
            }
        },
        update: function() {
            if (this.steam.duration) {
                if (!this.steam.propagated) {
                    this.steam.startTimer = this.steam.startTimer + ig.system.tick;
                    if (this.steam.startTimer >=
                        this.steam.duration) {
                        var b = this.pipeType.points[1 - this.steam.startPoint];
                        sc.SteamTools.propagateSteam(this, b, this.steam.fastMode, this.steam.glowEntity);
                        this.steam.propagated = true
                    }
                }
                this.steam.lightTimer = this.steam.lightTimer + ig.system.tick;
                if (this.steam.glowEntity && this.steam.lightTimer >= this.steam.duration) this.steam.glowEntity = null;
                if (this.steam.glowEntity && this.steam.lightTimer >= 0) {
                    var c = this.pipeType.points[this.steam.startPoint],
                        b = this.pipeType.points[1 - this.steam.startPoint],
                        b = Vec2.lerp(c, b,
                            this.steam.lightTimer / this.steam.duration, a),
                        b = sc.SteamTools.getGlobalPoint(d, this, b),
                        c = Math.round(this.steam.glowEntity.coll.pos.z * 0.8 + (this.coll.pos.z + (this.coll.size.z == 32 ? 17 : 2)) * 0.2);
                    this.steam.glowEntity.setPos(b.x, b.y, c)
                }
                this.steam.endTimer = this.steam.endTimer + ig.system.tick;
                if (this.steam.endTimer >= this.steam.duration) this.steam.duration = 0
            }
            this.parent()
        },
        updateSprites: function() {
            var a = this.sprites[0];
            this.gfx.pattern ? a.setImageSrc(this.gfx.pattern.getPattern(0), 0, 0) : a.setImageSrc(this.gfx.sheet,
                this.gfx.x, this.gfx.y);
            for (var a = 3, c = b / (this.steam.fastMode ? 1 : sc.options.get("assist-puzzle-speed")); a--;) {
                var d = this.sprites[a + 1];
                if (this.steam.duration) {
                    this.gfx.pattern ? d.setImageSrc(this.gfx.glowPattern.getPattern(0), 0, 0) : d.setImageSrc(this.gfx.sheet, this.gfx.x, this.gfx.y + 32);
                    d.setGfxCut(0, 0, 0, 0);
                    d.renderMode = "lighter";
                    var h = this.pipeType.points[this.steam.startPoint],
                        i = (1 - this.steam.startTimer / this.steam.duration).limit(0, 1);
                    this._cutSprite(d, h, i);
                    h = this.pipeType.points[1 - this.steam.startPoint];
                    i = ((this.steam.endTimer + a * c) / this.steam.duration).limit(0, 1);
                    this._cutSprite(d, h, i)
                } else d.setInvisible()
            }
        },
        _cutSprite: function(a, b, c) {
            if (b.y == 0.5) {
                c = Math.round(a.size.x * c);
                b.x == 1 ? a.gfxCut.left = c : a.gfxCut.right = c
            } else {
                c = Math.round((a.size.y + a.size.z) * c);
                b.y == 1 ? a.gfxCut.top = c : a.gfxCut.bottom = c
            }
        },
        receiveSteam: function(a, b, c) {
            a = sc.SteamTools.getClosestPoint(this, this.pipeType.points, a, 4);
            if (a == -1) return false;
            this.steam.startPoint = a;
            var d = this.pipeType.scaleX ? this.coll.size.x : this.pipeType.scaleY ? this.coll.size.y :
                16;
            this.steam.fastMode = b;
            b = 220 * (b ? 1 : sc.options.get("assist-puzzle-speed"));
            this.steam.duration = d / b;
            this.steam.startTimer = 0;
            this.steam.endTimer = -40 / b;
            this.steam.lightTimer = -8 / b;
            this.steam.propagated = false;
            c || (c = ig.game.spawnEntity(sc.SteamGlowEntity, a.x, a.y, this.coll.pos.z, {}));
            this.steam.glowEntity = c;
            this.steam.lightHandle = null;
            return true
        }
    });
    sc.STEAM_PIPE_TYPES.HORIZONTAL = {
        gfx: {
            x: 32,
            y: 0
        },
        scaleX: true,
        size: {
            x: 16,
            y: 12,
            z: 5
        },
        renderHeight: 4,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_PIPE_TYPES.VERTICAL = {
        gfx: {
            x: 32,
            y: 16
        },
        scaleY: true,
        size: {
            x: 16,
            y: 16,
            z: 5
        },
        renderHeight: 0,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_SE = {
        gfx: {
            x: 0,
            y: 0
        },
        size: {
            x: 16,
            y: 12,
            z: 5
        },
        renderHeight: 4,
        points: [{
            x: 1,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_SW = {
        gfx: {
            x: 16,
            y: 0
        },
        size: {
            x: 16,
            y: 12,
            z: 5
        },
        renderHeight: 4,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_NE = {
        gfx: {
            x: 0,
            y: 16
        },
        size: {
            x: 16,
            y: 16,
            z: 5
        },
        renderHeight: 0,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_PIPE_TYPES.CURVE_NW = {
        gfx: {
            x: 16,
            y: 16
        },
        size: {
            x: 16,
            y: 16,
            z: 5
        },
        renderHeight: 0,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0,
            y: 0.5
        }]
    };
    sc.STEAM_PIPE_TYPES.END_NORTH = {
        gfx: {
            x: 48,
            y: 6
        },
        size: {
            x: 16,
            y: 16,
            z: 5
        },
        renderHeight: 10,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_PIPE_TYPES.OVEN_EAST = {
        gfx: {
            x: 64,
            y: 0
        },
        size: {
            x: 16,
            y: 12,
            z: 32
        },
        renderHeight: 20,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_PIPE_TYPES.OVEN_WEST = {
        gfx: {
            x: 80,
            y: 0
        },
        size: {
            x: 16,
            y: 12,
            z: 32
        },
        renderHeight: 20,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_PIPE_TYPES.UPPER_PIPE = {
        gfx: {
            x: 96,
            y: 0,
            w: 16,
            h: 32
        },
        size: {
            x: 16,
            y: 12,
            z: 32
        },
        renderHeight: 20,
        scaleX: true,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 10);
            a = ig.mapStyle.get("pipes");
            b = sc.STEAM_TURNOUT_TYPES[d.turnDefault] || sc.STEAM_TURNOUT_TYPES.CURVE_NE;
            c = sc.STEAM_TURNOUT_TYPES[d.turnAlt] || sc.STEAM_TURNOUT_TYPES.CURVE_NE;
            this.points.push(b.points);
            this.points.push(c.points);
            this.initAnimations({
                shapeType: "XY_EXPAND",
                wallY: 1,
                sheet: {
                    src: a.sheet,
                    width: 16,
                    height: 24,
                    xCount: 3,
                    offX: a.x,
                    offY: a.y + 64
                },
                SUB: [{
                    name: "off",
                    time: 0.1,
                    frames: [b.tile],
                    repeat: true
                }, {
                    name: "on",
                    time: 0.1,
                    frames: [c.tile],
                    repeat: true
                }]
            });
            this.condition = new ig.VarCondition(d.condition);
            this.isOn = this.condition.evaluate();
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        receiveSteam: function(a, b, c) {
            this.effects.sheet.spawnOnTarget("steamTurnout", this);
            var d = this.points[this.isOn ? 1 : 0],
                i = sc.SteamTools.getClosestPoint(this, d, a, 4);
            i == -1 ? c.stop(a, this.coll.pos.z) : sc.SteamTools.propagateSteam(this, d[1 - i], b, c);
            return true
        },
        varsChanged: function() {
            var a = this.condition.evaluate();
            if (this.isOn != a) {
                this.isOn = a;
                this.effects.sheet.spawnOnTarget("turnoutChange", this);
                this.setCurrentAnim(this.isOn ? "on" : "off", true)
            }
        }
    });
    sc.STEAM_TURNOUT_TYPES.HORIZONTAL = {
        tile: 2,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_TURNOUT_TYPES.VERTICAL = {
        tile: 5,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_SE = {
        tile: 0,
        points: [{
            x: 1,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_SW = {
        tile: 1,
        points: [{
            x: 0,
            y: 0.5
        }, {
            x: 0.5,
            y: 1
        }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_NE = {
        tile: 3,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 1,
            y: 0.5
        }]
    };
    sc.STEAM_TURNOUT_TYPES.CURVE_NW = {
        tile: 4,
        points: [{
            x: 0.5,
            y: 0
        }, {
            x: 0,
            y: 0.5
        }]
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 32);
            a = ig.mapStyle.get("pipes");
            this.fastMode = d.fastMode;
            this.initAnimations({
                namedSheets: {
                    floor: {
                        src: a.sheet,
                        width: 16,
                        height: 16,
                        xCount: 1,
                        offX: a.x + 80,
                        offY: a.y + 64
                    },
                    top: {
                        src: a.sheet,
                        width: 16,
                        height: 32,
                        xCount: 1,
                        offX: a.x + 64,
                        offY: a.y + 64
                    }
                },
                SUB: [{
                    name: "default",
                    sheet: "floor",
                    time: 0.2,
                    frames: [0, 1, 2, 1],
                    repeat: true,
                    size: {
                        x: 16,
                        y: 16,
                        z: 0
                    }
                }, {
                    name: "default",
                    sheet: "top",
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    size: {
                        x: 16,
                        y: 16,
                        z: 16
                    },
                    offset: {
                        x: 0,
                        y: 0,
                        z: 12
                    }
                }]
            });
            this.setCurrentAnim("default");
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0, 0.2, -1, 1, true);
            this.lightHandle.setOffset(0, 0, -16);
            ig.light.addLightHandle(this.lightHandle)
        },
        collideWith: function(a, b) {
            if (b && !Vec2.isZero(b) && a.isIceDisk && a.isIceDisk() && a.coll.pos.z == this.coll.pos.z) {
                this.startSteam();
                var d = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c);
                a.consume(d)
            }
        },
        startSteam: function() {
            this.effects.sheet.spawnOnTarget("ovenActivate", this);
            sc.SteamTools.propagateSteam(this, {
                x: 0,
                y: 0.5
            }, this.fastMode);
            sc.SteamTools.propagateSteam(this, {
                x: 1,
                y: 0.5
            }, this.fastMode)
        }
    })
});
ig.baked = !0;
