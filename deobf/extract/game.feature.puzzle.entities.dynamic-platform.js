ig.module("game.feature.puzzle.entities.dynamic-platform").requires("impact.base.actor-entity", "impact.base.entity").defines(function() {
    var b = Vec3.createC(0, 0, 0);
    sc.DYNAMIC_PLATFORM_TYPES = {};
    ig.ENTITY.DynamicPlatform = ig.ActorEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                platformType: {
                    _type: "String",
                    _info: "Type of extractable platform",
                    _select: sc.DYNAMIC_PLATFORM_TYPES
                },
                states: {
                    _type: "DynamicPlatformDests",
                    _info: "the states to iterate. ",
                    _popup: true
                },
                pauseCondition: {
                    _type: "VarCondition",
                    _info: "Condition to pause the platform to move.",
                    _popup: true,
                    _default: "false"
                },
                pauseAnimation: {
                    _type: "EntityAnim",
                    _info: "Animation to be played on pause",
                    _optional: true
                },
                skipWait: {
                    _type: "Boolean",
                    _info: "True if actions should be interrupted when switching states.",
                    _default: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true,
                    _optional: true
                }
            }
        }),
        currentState: null,
        states: [],
        pauseCondition: null,
        pauseAnimation: null,
        baseConfig: null,
        paused: false,
        skipWaitForAction: false,
        _switchState: false,
        _stateReached: false,
        fx: {},
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.skipWaitForAction = e.skipWait;
            a = sc.DYNAMIC_PLATFORM_TYPES[e.platformType];
            Vec3.assign(this.coll.size, a.size);
            this.terrain = a.terrain;
            d = a.anims;
            if (a.styleKey)
                if (c = ig.mapStyle.get(a.styleKey)) {
                    d = ig.copy(a.anims);
                    d.sheet.src = c.sheet;
                    d.sheet.offX = c.x;
                    d.sheet.offY = c.y;
                    d.sheet.xCount = c.xCount
                } if (a.fx)
                for (var f in a.fx) this.fx[f] = new ig.EffectHandle(a.fx[f]);
            this.animSheet = new ig.AnimationSheet(d);
            for (var g in a.walkAnims) this.storeWalkAnims(g,
                a.walkAnims[g]);
            f = 32;
            if (a.shadowSize !== void 0) f = a.shadowSize;
            this.baseConfig = new ig.ActorConfig({
                collType: ig.COLLTYPE.BLOCK,
                walkAnims: g,
                zGravityFactor: 0,
                weight: -1,
                maxVel: 180,
                relativeVel: 1,
                accelSpeed: 1.5,
                friction: 1.6,
                airFriction: 0.7,
                shadow: f,
                shadowType: ig.COLL_SHADOW_TYPE.STATIC_SIZE
            });
            this.pauseCondition = new ig.VarCondition(e.pauseCondition);
            this.pauseAnimation = e.pauseAnimation;
            g = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b);
            e = e.states;
            f = null;
            if (e)
                for (a = 0; a < e.length; a++) {
                    f = e[a];
                    var d = f.useAbsolute ?
                        f.position : Vec3.add(f.position, g, Vec3.create()),
                        c = [{
                            type: "INTERPOLATE_POSITION",
                            newPos: d,
                            keySpline: f.keySpline,
                            duration: f.duration || 0
                        }],
                        h = new ig.ActorConfig({
                            walkAnims: f.animation
                        }, this.baseConfig);
                    this.states.push({
                        action: f.action ? new ig.Action(null, f.action) : null,
                        condition: new ig.VarCondition(f.condition),
                        config: h,
                        pos: d,
                        startAction: new ig.Action(null, c),
                        startDuration: f.duration || 0,
                        playOnce: f.playOnce || false
                    })
                }
            if (window.wm) this.states.length > 0 && this.setDefaultConfig(this.states[0].config);
            else {
                this.updateStates(true);
                this.updatePause()
            }
            this.initAnimations()
        },
        show: function(a) {
            this.parent(a);
            if (this.fxHideHandle) {
                this.fxHideHandle.stop();
                this.fxHideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                this.fx.show ? this.fx.show.spawnOnTarget(this, {}) : ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
            }
        },
        onHideRequest: function() {
            this.fx.hide ? this.fxHideHandle = this.fx.hide.spawnOnTarget(this, {
                callback: this
            }) : ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a == this.fxHideHandle &&
                a.isDone()) {
                this.fxHideHandle = null;
                this.hide()
            }
        },
        update: function() {
            this.parent()
        },
        postActionUpdate: function() {
            if (!this.hasAction() && !this.paused)
                if (this._switchState) {
                    this.playCurrentState();
                    this._switchState = false
                } else {
                    (!this.currentState.playOnce || !this._stateReached) && this.setAction(this.currentState.action);
                    this._stateReached = true
                }
        },
        onKill: function(a) {
            this.parent(a);
            this.animSheet.clearCached();
            for (var b in this.fx) this.fx[b].clearCached()
        },
        updateStates: function(a) {
            for (var b = this.states.length,
                    c = null, e = null; b--;) {
                c = this.states[b];
                if (c.condition.evaluate()) {
                    e = c;
                    break
                }
            }
            if (e != this.currentState) {
                this.currentState = e;
                this.currentState.played = false;
                if (a || this.skipWaitForAction || !this._stateReached) this.playCurrentState(a);
                else {
                    this._stateReached = false;
                    this._switchState = true
                }
            }
        },
        playCurrentState: function(a) {
            this.setDefaultConfig(this.currentState.config);
            if (a) {
                this.setPos(this.currentState.pos.x - this.coll.size.x / 2, this.currentState.pos.y - this.coll.size.y / 2, this.currentState.pos.z);
                this._switchState =
                    false
            } else if (this.currentState.startDuration != 0) this.setAction(this.currentState.startAction);
            else {
                this.setAction(this.currentState.action);
                this._stateReached = true
            }
        },
        varsChanged: function() {
            this.updateStates();
            this.updatePause()
        },
        updatePause: function() {
            var a = this.pauseCondition && this.pauseCondition.evaluate();
            if (a != this.paused)
                if (this.paused = a) {
                    this.stashAction();
                    if (this.pauseAnimation) {
                        this.setCurrentAnim(this.pauseAnimation, true, null, true);
                        this.animationFixed = true
                    }
                    Vec2.assignC(this.coll.accelDir,
                        0, 0);
                    Vec2.assignC(this.coll.vel, 0, 0)
                } else {
                    this.animationFixed = false;
                    this.resumeStashedAction()
                }
        }
    });
    sc.DYNAMIC_PLATFORM_TYPES.DefaultSmall = {
        size: {
            x: 32,
            y: 32,
            z: 2
        },
        styleKey: "dynPlatformSmall",
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 32,
                offX: 0,
                offY: 0
            },
            SUB: [{
                name: "on",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "off",
                time: 1,
                frames: [1],
                repeat: false
            }]
        },
        walkAnims: {
            on: {
                idle: "on"
            },
            off: {
                idle: "off"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.DefaultMedium = {
        size: {
            x: 32,
            y: 32,
            z: 2
        },
        styleKey: "dynPlatformMedium",
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 32,
                offX: 0,
                offY: 0
            },
            SUB: [{
                name: "on",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "off",
                time: 1,
                frames: [1],
                repeat: false
            }]
        },
        walkAnims: {
            on: {
                idle: "on"
            },
            off: {
                idle: "off"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Small = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 16,
                height: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "move",
                time: 0.05,
                frames: [0, 1, 2, 1],
                repeat: true
            }]
        },
        walkAnims: {
            "default": {
                idle: "default",
                move: "move"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Large = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 32,
                height: 64,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "move",
                time: 0.05,
                frames: [0, 1, 2, 1],
                repeat: true
            }]
        },
        walkAnims: {
            "default": {
                idle: "default",
                move: "move"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.RhombusMedium = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/dynamic-blocks.png",
                width: 32,
                height: 64
            },
            SUB: [{
                name: "redOn",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "redOff",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "greenOn",
                time: 1,
                frames: [2],
                repeat: false
            }, {
                name: "greenOff",
                time: 1,
                frames: [3],
                repeat: false
            }, {
                name: "blueOn",
                time: 1,
                frames: [4],
                repeat: false
            }, {
                name: "blueOff",
                time: 1,
                frames: [5],
                repeat: false
            }]
        },
        walkAnims: {
            greenOn: {
                idle: "greenOn"
            },
            greenOff: {
                idle: "greenOff"
            },
            redOn: {
                idle: "redOn"
            },
            redOff: {
                idle: "redOff"
            },
            blueOn: {
                idle: "blueOn"
            },
            blueOff: {
                idle: "blueOff"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Floating = {
        size: {
            x: 32,
            y: 32,
            z: 0
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/dynamic-blocks.png",
                width: 32,
                height: 36
            },
            shapeType: "Z_EXPAND",
            offset: {
                x: 0,
                y: 0,
                z: -4
            },
            SUB: [{
                name: "redOn",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "redOff",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "greenOn",
                time: 1,
                frames: [2],
                repeat: false
            }, {
                name: "greenOff",
                time: 1,
                frames: [3],
                repeat: false
            }, {
                name: "blueOn",
                time: 1,
                frames: [4],
                repeat: false
            }, {
                name: "blueOff",
                time: 1,
                frames: [5],
                repeat: false
            }]
        },
        walkAnims: {
            greenOn: {
                idle: "greenOn"
            },
            greenOff: {
                idle: "greenOff"
            },
            redOn: {
                idle: "redOn"
            },
            redOff: {
                idle: "redOff"
            },
            blueOn: {
                idle: "blueOn"
            },
            blueOff: {
                idle: "blueOff"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.FloatingBig = {
        size: {
            x: 64,
            y: 64,
            z: 0
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/dynamic-blocks.png",
                width: 64,
                height: 68,
                offY: 40
            },
            shapeType: "Z_EXPAND",
            offset: {
                x: 0,
                y: 0,
                z: -4
            },
            SUB: [{
                name: "blueOn",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "blueOff",
                time: 1,
                frames: [1],
                repeat: false
            }]
        },
        walkAnims: {
            blueOn: {
                idle: "blueOn"
            },
            blueOff: {
                idle: "blueOff"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.AridBig = {
        size: {
            x: 80,
            y: 72,
            z: 2
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/map/arid-interior.png",
                width: 80,
                height: 72,
                offX: 336,
                offY: 672
            },
            shapeType: "Z_EXPAND",
            wallY: 1,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }]
        },
        walkAnims: {
            "default": {
                idle: "default"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.ArWallH = {
        size: {
            x: 32,
            y: 8,
            z: 24
        },
        shadowSize: 0,
        terrain: ig.TERRAIN.LASER,
        anims: {
            sheet: {
                src: "media/entity/objects/dungeon-ar.png",
                width: 32,
                height: 32,
                offX: 56,
                offY: 144
            },
            renderMode: "lighter",
            SUB: [{
                name: "default",
                time: 0.05,
                frames: [0,
                    0
                ],
                framesAlpha: [1, 0.8],
                repeat: true
            }]
        },
        walkAnims: {
            on: {
                idle: "default"
            }
        },
        fx: {
            show: {
                sheet: "teleport",
                name: "barrierShow"
            },
            hide: {
                sheet: "teleport",
                name: "barrierHide"
            }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.ArWallV = {
        size: {
            x: 8,
            y: 32,
            z: 24
        },
        shadowSize: 0,
        terrain: ig.TERRAIN.LASER,
        anims: {
            sheet: {
                src: "media/entity/objects/dungeon-ar.png",
                width: 8,
                height: 56,
                offX: 24,
                offY: 176
            },
            renderMode: "lighter",
            SUB: [{
                name: "default",
                time: 0.05,
                frames: [0, 0],
                framesAlpha: [1, 0.8],
                repeat: true
            }]
        },
        walkAnims: {
            on: {
                idle: "default"
            }
        },
        fx: {
            show: {
                sheet: "teleport",
                name: "barrierShow"
            },
            hide: {
                sheet: "teleport",
                name: "barrierHide"
            }
        }
    }
});
ig.baked = !0;
