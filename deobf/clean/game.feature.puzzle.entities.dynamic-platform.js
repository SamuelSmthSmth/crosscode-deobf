ig.module("game.feature.puzzle.entities.dynamic-platform").requires("impact.base.actor-entity", "impact.base.entity").defines(function() {
    var tmpVec = Vec3.createC(0, 0, 0);
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.skipWaitForAction = settings.skipWait;
            var type = sc.DYNAMIC_PLATFORM_TYPES[settings.platformType];
            Vec3.assign(this.coll.size, type.size);
            this.terrain = type.terrain;
            var anims = type.anims;
            if (type.styleKey) {
                var mapStyle = ig.mapStyle.get(type.styleKey);
                if (mapStyle) {
                    anims = ig.copy(type.anims);
                    anims.sheet.src = mapStyle.sheet;
                    anims.sheet.offX = mapStyle.x;
                    anims.sheet.offY = mapStyle.y;
                    anims.sheet.xCount = mapStyle.xCount;
                }
            }
            if (type.fx)
                for (var fxKey in type.fx) this.fx[fxKey] = new ig.EffectHandle(type.fx[fxKey]);
            this.animSheet = new ig.AnimationSheet(anims);
            for (var walkAnimKey in type.walkAnims) this.storeWalkAnims(walkAnimKey, type.walkAnims[walkAnimKey]);
            var shadowSize = 32;
            if (type.shadowSize !== void 0) shadowSize = type.shadowSize;
            this.baseConfig = new ig.ActorConfig({
                collType: ig.COLLTYPE.BLOCK,
                walkAnims: walkAnimKey,
                zGravityFactor: 0,
                weight: -1,
                maxVel: 180,
                relativeVel: 1,
                accelSpeed: 1.5,
                friction: 1.6,
                airFriction: 0.7,
                shadow: shadowSize,
                shadowType: ig.COLL_SHADOW_TYPE.STATIC_SIZE
            });
            this.pauseCondition = new ig.VarCondition(settings.pauseCondition);
            this.pauseAnimation = settings.pauseAnimation;
            var bottomPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec),
                states = settings.states;
            if (states)
                for (var i = 0; i < states.length; i++) {
                    var stateSettings = states[i],
                        targetPos = stateSettings.useAbsolute ? stateSettings.position : Vec3.add(stateSettings.position, bottomPos, Vec3.create()),
                        actions = [{
                            type: "INTERPOLATE_POSITION",
                            newPos: targetPos,
                            keySpline: stateSettings.keySpline,
                            duration: stateSettings.duration || 0
                        }],
                        config = new ig.ActorConfig({
                            walkAnims: stateSettings.animation
                        }, this.baseConfig);
                    this.states.push({
                        action: stateSettings.action ? new ig.Action(null, stateSettings.action) : null,
                        condition: new ig.VarCondition(stateSettings.condition),
                        config: config,
                        pos: targetPos,
                        startAction: new ig.Action(null, actions),
                        startDuration: stateSettings.duration || 0,
                        playOnce: stateSettings.playOnce || false
                    });
                }
            if (window.wm) {
                if (this.states.length > 0) this.setDefaultConfig(this.states[0].config);
            } else {
                this.updateStates(true);
                this.updatePause();
            }
            this.initAnimations();
        },
        show: function(show) {
            this.parent(show);
            if (this.fxHideHandle) {
                this.fxHideHandle.stop();
                this.fxHideHandle = null;
            }
            if (!show) {
                this.animState.alpha = 0;
                if (this.fx.show) this.fx.show.spawnOnTarget(this, {});
                else ig.game.effects.teleport.spawnOnTarget("showQuick", this, {});
            }
        },
        onHideRequest: function() {
            if (this.fx.hide) this.fxHideHandle = this.fx.hide.spawnOnTarget(this, {
                callback: this
            });
            else ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect == this.fxHideHandle && effect.isDone()) {
                this.fxHideHandle = null;
                this.hide();
            }
        },
        update: function() {
            this.parent();
        },
        postActionUpdate: function() {
            if (!this.hasAction() && !this.paused)
                if (this._switchState) {
                    this.playCurrentState();
                    this._switchState = false;
                } else {
                    if (!this.currentState.playOnce || !this._stateReached) this.setAction(this.currentState.action);
                    this._stateReached = true;
                }
        },
        onKill: function(entity) {
            this.parent(entity);
            this.animSheet.clearCached();
            for (var fxKey in this.fx) this.fx[fxKey].clearCached();
        },
        updateStates: function(instant) {
            var state = null,
                found = null;
            for (var i = this.states.length; i--;) {
                state = this.states[i];
                if (state.condition.evaluate()) {
                    found = state;
                    break;
                }
            }
            if (found != this.currentState) {
                this.currentState = found;
                this.currentState.played = false;
                if (instant || this.skipWaitForAction || !this._stateReached) this.playCurrentState(instant);
                else {
                    this._stateReached = false;
                    this._switchState = true;
                }
            }
        },
        playCurrentState: function(instant) {
            this.setDefaultConfig(this.currentState.config);
            if (instant) {
                this.setPos(this.currentState.pos.x - this.coll.size.x / 2, this.currentState.pos.y - this.coll.size.y / 2, this.currentState.pos.z);
                this._switchState = false;
            } else if (this.currentState.startDuration != 0) this.setAction(this.currentState.startAction);
            else {
                this.setAction(this.currentState.action);
                this._stateReached = true;
            }
        },
        varsChanged: function() {
            this.updateStates();
            this.updatePause();
        },
        updatePause: function() {
            var shouldPause = this.pauseCondition && this.pauseCondition.evaluate();
            if (shouldPause != this.paused)
                if (this.paused = shouldPause) {
                    this.stashAction();
                    if (this.pauseAnimation) {
                        this.setCurrentAnim(this.pauseAnimation, true, null, true);
                        this.animationFixed = true;
                    }
                    Vec2.assignC(this.coll.accelDir, 0, 0);
                    Vec2.assignC(this.coll.vel, 0, 0);
                } else {
                    this.animationFixed = false;
                    this.resumeStashedAction();
                }
        }
    });
    sc.DYNAMIC_PLATFORM_TYPES.DefaultSmall = {
        size: { x: 32, y: 32, z: 2 },
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
            on: { idle: "on" },
            off: { idle: "off" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.DefaultMedium = {
        size: { x: 32, y: 32, z: 2 },
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
            on: { idle: "on" },
            off: { idle: "off" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Small = {
        size: { x: 16, y: 16, z: 16 },
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
            "default": { idle: "default", move: "move" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Large = {
        size: { x: 32, y: 32, z: 32 },
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
            "default": { idle: "default", move: "move" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.RhombusMedium = {
        size: { x: 32, y: 32, z: 32 },
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
            greenOn: { idle: "greenOn" },
            greenOff: { idle: "greenOff" },
            redOn: { idle: "redOn" },
            redOff: { idle: "redOff" },
            blueOn: { idle: "blueOn" },
            blueOff: { idle: "blueOff" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.Floating = {
        size: { x: 32, y: 32, z: 0 },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/dynamic-blocks.png",
                width: 32,
                height: 36
            },
            shapeType: "Z_EXPAND",
            offset: { x: 0, y: 0, z: -4 },
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
            greenOn: { idle: "greenOn" },
            greenOff: { idle: "greenOff" },
            redOn: { idle: "redOn" },
            redOff: { idle: "redOff" },
            blueOn: { idle: "blueOn" },
            blueOff: { idle: "blueOff" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.FloatingBig = {
        size: { x: 64, y: 64, z: 0 },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/dynamic-blocks.png",
                width: 64,
                height: 68,
                offY: 40
            },
            shapeType: "Z_EXPAND",
            offset: { x: 0, y: 0, z: -4 },
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
            blueOn: { idle: "blueOn" },
            blueOff: { idle: "blueOff" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.AridBig = {
        size: { x: 80, y: 72, z: 2 },
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
            "default": { idle: "default" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.ArWallH = {
        size: { x: 32, y: 8, z: 24 },
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
                frames: [0, 0],
                framesAlpha: [1, 0.8],
                repeat: true
            }]
        },
        walkAnims: {
            on: { idle: "default" }
        },
        fx: {
            show: { sheet: "teleport", name: "barrierShow" },
            hide: { sheet: "teleport", name: "barrierHide" }
        }
    };
    sc.DYNAMIC_PLATFORM_TYPES.ArWallV = {
        size: { x: 8, y: 32, z: 24 },
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
            on: { idle: "default" }
        },
        fx: {
            show: { sheet: "teleport", name: "barrierShow" },
            hide: { sheet: "teleport", name: "barrierHide" }
        }
    };
});
ig.baked = !0;
