ig.module("game.feature.puzzle.entities.bounce-switch").requires("impact.base.entity", "impact.base.game", "impact.feature.effect.effect-sheet").defines(function() {
    sc.BounceSwitchGroups = ig.GameAddon.extend({
        groups: {},
        effects: new ig.EffectSheet("puzzle"),
        init: function() {
            this.parent("BounceSwitchGroups");
        },
        registerSwitch: function(endSwitch, variable) {
            var group = this.getGroup(endSwitch.group);
            group.endSwitch = endSwitch;
            group.variable = variable;
            ig.vars.setDefault(group.variable, false);
            if (this.isGroupResolved(endSwitch.group))
                for (var i = group.blocks.length; i--;) group.blocks[i].onGroupResolve(true);
        },
        registerBlock: function(block) {
            this.getGroup(block.group).blocks.push(block);
        },
        evaluateGroup: function(name) {
            var group = this.getGroup(name);
            this.resetCamera(name);
            if (group.cameraHandle) ig.camera.removeTarget(group.cameraHandle, "NORMAL", KEY_SPLINES.EASE_IN_OUT);
            if (group.finalHit && group.blockHitCount == group.blocks.length) this.resolveGroup(name);
            else this.resetGroup(name);
        },
        resetGroup: function(name) {
            var group = this.getGroup(name);
            for (var i = group.blocks.length; i--;) group.blocks[i].onGroupReset();
            group.endSwitch.onGroupReset();
            group.finalHit = false;
            group.blockHitCount = 0;
        },
        resolveGroup: function(name) {
            var group = this.getGroup(name);
            ig.vars.set(group.variable, true);
            for (var i = group.blocks.length; i--;) group.blocks[i].onGroupResolve(false);
            group.endSwitch.onGroupResolve();
        },
        setCameraBall: function(name, ball) {
            this.resetCamera(name);
            var group = this.groups[name];
            group.overrideHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([ball, ig.game.playerEntity]), 0, 0);
            ig.camera.pushTarget(group.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT);
        },
        setCameraPos: function(name, pos) {
            this.resetCamera(name);
            var group = this.groups[name];
            group.overrideHandle = new ig.Camera.TargetHandle(new ig.Camera.PosTarget(pos), 0, 0);
            ig.camera.pushTarget(group.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT);
        },
        resetCamera: function(name) {
            var group = this.groups[name];
            if (group.overrideHandle) ig.camera.removeTarget(group.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT);
        },
        isGroupBallConflict: function(name, ball) {
            var group = this.getGroup(name);
            return group.currentBall && group.currentBall != ball;
        },
        isGroupResolved: function(name) {
            var group = this.getGroup(name);
            return group && ig.vars.get(group.variable);
        },
        isBallOfAnyGroup: function(ball) {
            for (var name in this.groups)
                if (this.groups[name] && this.groups[name].currentBall == ball) return true;
            return false;
        },
        getEndSwitch: function(name) {
            return this.getGroup(name).endSwitch;
        },
        getHitCount: function(name) {
            return this.getGroup(name).blockHitCount;
        },
        onBlockHit: function(block, ball) {
            var group = this.getGroup(block.group);
            if (group.currentBall && group.currentBall != ball) return false;
            if (!group.currentBall) {
                group.currentBall = ball;
                this.effects.spawnOnTarget("bounceTrail", ball, {
                    duration: -1,
                    align: ig.ENTITY_ALIGN.CENTER
                });
                ball.changeSpeed(0.75);
            }
            group.blockHitCount++;
            return group.blockHitCount;
        },
        onSwitchHit: function(endSwitch, ball) {
            var group = this.getGroup(endSwitch.group);
            if (group.currentBall && group.currentBall != ball) return false;
            group.currentBall = ball;
            group.finalHit = true;
            return group.blockHitCount == group.blocks.length ? true : false;
        },
        onDeferredUpdate: function() {
            for (var name in this.groups) {
                var group = this.groups[name];
                if (group.currentBall && group.currentBall._killed) {
                    group.currentBall = null;
                    this.evaluateGroup(name);
                }
            }
        },
        onReset: function() {
            this.groups = {};
        },
        onLevelLoadStart: function() {
            this.groups = {};
        },
        getGroup: function(name) {
            if (!this.groups[name]) this.groups[name] = {
                endSwitch: null,
                variable: null,
                blocks: [],
                blockHitCount: 0,
                finalHit: false,
                currentBall: null,
                cameraHandle: null,
                overrideHandle: null
            };
            return this.groups[name];
        }
    });
    ig.addGameAddon(function() {
        return sc.bounceSwitchGroups = new sc.BounceSwitchGroups;
    });
    ig.ENTITY.BounceSwitch = ig.AnimatedEntity.extend({
        ballDestroyer: true,
        variable: null,
        group: null,
        isOn: false,
        effects: new ig.EffectSheet("puzzle"),
        sounds: {
            hit: new ig.Sound("media/sound/puzzle/highlight-switch-1.ogg", 1),
            bing: new ig.Sound("media/sound/puzzle/highlight-switch-2.ogg", 1),
            fail: new ig.Sound("media/sound/puzzle/highlight-switch-3.ogg", 1)
        },
        timer: 0,
        cameraHandle: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                variable: {
                    _type: "VarName",
                    _info: "Variable to be se to true when switch is activated"
                },
                group: {
                    _type: "String",
                    _info: "Group Name to assign bouncing blocks to switch"
                }
            },
            label: function() {
                return "<" + this.group + ">\n[ " + this.variable + " ]";
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.time.globalStatic = true;
            Vec3.assignC(this.coll.size, 24, 24, 24);
            this.group = settings.group;
            this.variable = settings.variable;
            if (!window.wm) sc.bounceSwitchGroups.registerSwitch(this, settings.variable);
            var mapStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                namedSheets: {
                    base: {
                        src: mapStyle.sheet,
                        width: 24,
                        height: 28,
                        offX: 168,
                        xCount: 2
                    },
                    cube: {
                        src: mapStyle.sheet,
                        width: 16,
                        height: 24,
                        offX: 224,
                        xCount: 2
                    },
                    top: {
                        src: mapStyle.sheet,
                        width: 8,
                        height: 8,
                        offX: 216,
                        offY: 48
                    }
                },
                SUB: [{
                    size: { x: 24, y: 26, z: 0 },
                    offset: { y: 0 },
                    sheet: "base",
                    SUB: [{
                        name: "off",
                        time: 0.1,
                        frames: [0]
                    }, {
                        name: "rolling",
                        time: 0.1,
                        frames: [0]
                    }, {
                        name: "rollingEnd",
                        time: 0.1,
                        frames: [0]
                    }, {
                        name: "flyDown",
                        time: 0.033,
                        frames: [0, 0, 1]
                    }, {
                        name: "impact",
                        time: 0.05,
                        frames: [2]
                    }, {
                        name: "on",
                        time: 0.1,
                        frames: [3]
                    }]
                }, {
                    size: { x: 16, y: 16, z: 8 },
                    offset: { z: 12, y: -4 },
                    sheet: "cube",
                    repeat: true,
                    SUB: [{
                        name: "off",
                        time: 0.1,
                        frames: [0, 1, 2, 3]
                    }, {
                        name: "rolling",
                        time: 0.03,
                        frames: [0, 1, 2, 3]
                    }, {
                        name: "rollingEnd",
                        time: 0.06,
                        frames: [0, 1, 2, 3, 3, 0, 0, 0],
                        repeat: false
                    }, {
                        name: "flyDown",
                        time: 0.033,
                        frames: [0, 0, -1],
                        repeat: false,
                        framesGfxOffset: [0, 2, 0, 6, 0, 0]
                    }]
                }, {
                    size: { x: 8, y: 8, z: 0 },
                    offset: { z: 20, y: -8 },
                    sheet: "top",
                    repeat: true,
                    frames: [0],
                    time: 0.05,
                    SUB: [{
                        name: "off"
                    }, {
                        name: "rolling",
                        frames: [0, 1, 2, 3, 4]
                    }, {
                        name: "rollingEnd",
                        frames: [0, 1, 2, 3, 4]
                    }]
                }]
            });
            if (this.isOn = sc.bounceSwitchGroups.isGroupResolved(this.group)) this.coll.size.z = 0;
            this.setCurrentAnim(this.isOn ? "on" : "off");
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.setCurrentAnim("rollingEnd", true, null, true, true);
                    this.timer = 0;
                }
            }
            this.parent();
        },
        ballHit: function(ball) {
            if (this.isOn || !ball.isBall || sc.bounceSwitchGroups.isGroupBallConflict(this.group, ball)) {
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
                return true;
            }
            if (!this.isOn) {
                this.isOn = true;
                this.setCurrentAnim("rolling");
                if (sc.bounceSwitchGroups.onSwitchHit(this, ball)) {
                    sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE, ball.getElement(), false, false, true);
                    this.effects.spawnOnTarget("bounceFinal", this);
                    ig.SoundHelper.playAtEntity(this.sounds.hit, this);
                } else {
                    sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
                    ig.SoundHelper.playAtEntity(this.sounds.fail, this);
                }
            }
            return true;
        },
        animationEnded: function(animName) {
            if (animName == "rollingEnd") this.setCurrentAnim("flyDown", true, null, true, true);
            else if (animName == "flyDown") {
                this.coll.size.z = 0;
                if (this.cameraHandle) {
                    ig.camera.removeTarget(this.cameraHandle, "NORMAL", KEY_SPLINES.EASE_IN_OUT);
                    this.cameraHandle = null;
                }
                this.effects.spawnOnTarget("bounceHit", this, {
                    offset: { z: 4 }
                });
                this.setCurrentAnim("impact", true, "on");
                ig.SoundHelper.playAtEntity(this.sounds.bing, this);
            }
        },
        onGroupReset: function() {
            this.effects.spawnOnTarget("bounceDenied", this);
            this.isOn = false;
            this.setCurrentAnim("off");
        },
        onGroupResolve: function() {
            this.timer = 0.5;
            this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this), 0, 0);
            ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_OUT);
            var rumble = new ig.Rumble.RumbleHandle("RANDOM", "STRONGER", "FASTER", 0.3, true);
            ig.rumble.addRumble(rumble);
        }
    });
    sc.BOUNCE_BLOCK_TYPE = {};
    ig.ENTITY.BounceBlock = ig.AnimatedEntity.extend({
        group: null,
        blockState: 0,
        maxZHeight: 0,
        timer: null,
        cameraAction: null,
        effects: new ig.EffectSheet("puzzle"),
        ballTime: 0,
        sounds: {
            bing: new ig.Sound("media/sound/puzzle/highlight-block.ogg", 0.8)
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                blockType: {
                    _type: "String",
                    _info: "Type of Switch",
                    _select: sc.BOUNCE_BLOCK_TYPE
                },
                group: {
                    _type: "String",
                    _info: "Group of bounce switch this block belongs to"
                },
                action: {
                    _type: "BounceAction",
                    _info: "Action to perform when block is hit",
                    _popup: true,
                    _optional: true
                },
                ballTime: {
                    _type: "Number",
                    _info: "How long the ball will be alive after bouncing with this block. (default=0.5)",
                    _optional: true
                }
            },
            label: function() {
                return "[ " + this.variable + " ]\n";
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic = true;
            this.coll.weight = -1;
            this.coll.zGravityFactor = 1E3;
            Vec3.assignC(this.coll.size, 16, 16, 24);
            this.timer = new ig.WeightTimer;
            this.group = settings.group;
            this.ballTime = settings.ballTime || 0.5;
            if (!window.wm) sc.bounceSwitchGroups.registerBlock(this);
            if (settings.action) {
                var actionSettings = settings.action;
                this.action = {
                    minHit: actionSettings.minHit,
                    camera: actionSettings.camera
                };
            }
            var blockType = sc.BOUNCE_BLOCK_TYPE[settings.blockType];
            if (blockType) {
                Vec3.assign(this.coll.size, blockType.size);
                this.coll.shape = blockType.shape;
                var mapStyle = ig.mapStyle.get("puzzle2");
                blockType.anims.namedSheets.block.src = mapStyle.sheet;
                if (blockType.anims.namedSheets.ground) blockType.anims.namedSheets.ground.src = mapStyle.sheet;
                this.initAnimations(blockType.anims);
            }
            this.maxZHeight = this.coll.size.z;
            if (sc.bounceSwitchGroups.isGroupResolved(this.group)) this.onGroupResolve(true);
            else this.blockState = 0;
            this.setCurrentAnim(this.blockState ? "on" : "off");
        },
        ballHit: function(ball, other) {
            if (!ball.isBall || sc.bounceSwitchGroups.isGroupBallConflict(this.group, ball)) {
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
                return true;
            }
            if (!other || Vec2.isZero(other)) return false;
            if (!this.blockState) {
                this.blockState = 1;
                var group = sc.bounceSwitchGroups.getGroup(this.group);
                ig.SoundHelper.playAtEntity(this.sounds.bing, this, false, {
                    speed: 1 - (group.blocks.length + 2 - group.blockHitCount) * 0.03
                });
                ball.resetBounceCount();
                ball.resetTime(this.ballTime / ball.speedFactor);
                ball.cleanDirection(0.025);
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.HEAVY, ball.getElement(), false, false, true);
                this.effects.spawnOnTarget("bounceHit", this);
                this.setCurrentAnim("on");
                var hitCount = sc.bounceSwitchGroups.onBlockHit(this, ball);
                if (this.action && this.action.minHit <= hitCount) {
                    var cameraType = this.action.camera.type;
                    if (cameraType == "reset") sc.bounceSwitchGroups.resetCamera(this.group);
                    else if (cameraType == "ball") sc.bounceSwitchGroups.setCameraBall(this.group, ball);
                    else if (cameraType == "fixed") sc.bounceSwitchGroups.setCameraPos(this.group, this.action.camera.value);
                }
            }
            return false;
        },
        onGroupResolve: function(instant) {
            this.blockState = 2;
            if (instant) this.coll.setSize(this.coll.size.x, this.coll.size.y, 0);
            else this.timer.set(1, ig.TIMER_MODE.ONCE);
            this.setCurrentAnim("on");
        },
        onGroupReset: function() {
            if (this.blockState == 0) this.effects.spawnOnTarget("bounceDenied", this);
            this.blockState = 0;
            this.setCurrentAnim("off");
        },
        update: function() {
            if (!this.timer.done()) {
                this.timer.tick();
                var progress = KEY_SPLINES.EASE_IN_OUT.get(this.timer.get());
                if (this.blockState == 2) progress = 1 - progress;
                progress = Math.round(this.maxZHeight * progress);
                this.coll.setSize(this.coll.size.x, this.coll.size.y, progress);
            }
            this.parent();
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length) this.sprites[0].src.y = this.sprites[0].src.y - (this.maxZHeight - this.coll.size.z);
        }
    });
    sc.BOUNCE_BLOCK_TYPE["default"] = {
        size: { x: 24, y: 24, z: 23 },
        shape: ig.COLLSHAPE.RECTANGLE,
        anims: {
            namedSheets: {
                block: {
                    src: null,
                    width: 24,
                    height: 48
                }
            },
            sheet: "block",
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
        }
    };
    sc.BOUNCE_BLOCK_TYPE.slopeNE = {
        size: { x: 24, y: 24, z: 23 },
        shape: ig.COLLSHAPE.SLOPE_NE,
        anims: {
            namedSheets: {
                block: {
                    src: null,
                    width: 24,
                    height: 48,
                    offX: 48
                },
                ground: {
                    src: null,
                    width: 24,
                    height: 24,
                    offX: 144
                }
            },
            SUB: [{
                sheet: "block",
                aboveZ: 1,
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
            }, {
                sheet: "ground",
                size: { x: 24, y: 24, z: 0 },
                frames: [0],
                SUB: [{
                    name: "off"
                }, {
                    name: "on"
                }]
            }]
        }
    };
    sc.BOUNCE_BLOCK_TYPE.slopeSE = {
        size: { x: 24, y: 24, z: 23 },
        shape: ig.COLLSHAPE.SLOPE_SE,
        anims: {
            namedSheets: {
                block: {
                    src: null,
                    width: 24,
                    height: 48,
                    offX: 96
                },
                ground: {
                    src: null,
                    width: 24,
                    height: 24,
                    offX: 144,
                    offY: 24
                }
            },
            SUB: [{
                sheet: "block",
                wallY: 1,
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
            }, {
                sheet: "ground",
                size: { x: 24, y: 23, z: 1 },
                frames: [0],
                wallY: 1,
                SUB: [{
                    name: "off"
                }, {
                    name: "on"
                }]
            }]
        }
    };
    sc.BOUNCE_BLOCK_TYPE.slopeSW = {
        size: { x: 24, y: 24, z: 23 },
        shape: ig.COLLSHAPE.SLOPE_SW,
        anims: {
            namedSheets: {
                block: {
                    src: null,
                    width: 24,
                    height: 48,
                    offX: 96
                },
                ground: {
                    src: null,
                    width: 24,
                    height: 24,
                    offX: 144,
                    offY: 24
                }
            },
            flipX: true,
            SUB: [{
                sheet: "block",
                wallY: 1,
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
            }, {
                sheet: "ground",
                size: { x: 24, y: 23, z: 1 },
                frames: [0],
                wallY: 1,
                SUB: [{
                    name: "off"
                }, {
                    name: "on"
                }]
            }]
        }
    };
    sc.BOUNCE_BLOCK_TYPE.slopeNW = {
        size: { x: 24, y: 24, z: 23 },
        shape: ig.COLLSHAPE.SLOPE_NW,
        anims: {
            namedSheets: {
                block: {
                    src: null,
                    width: 24,
                    height: 48,
                    offX: 48
                },
                ground: {
                    src: null,
                    width: 24,
                    height: 24,
                    offX: 144
                }
            },
            flipX: true,
            SUB: [{
                sheet: "block",
                aboveZ: 1,
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
            }, {
                sheet: "ground",
                size: { x: 24, y: 24, z: 0 },
                frames: [0],
                SUB: [{
                    name: "off"
                }, {
                    name: "on"
                }]
            }]
        }
    };
});
ig.baked = !0;
