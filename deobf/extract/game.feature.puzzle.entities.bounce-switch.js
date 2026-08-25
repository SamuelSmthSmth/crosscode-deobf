ig.module("game.feature.puzzle.entities.bounce-switch").requires("impact.base.entity", "impact.base.game", "impact.feature.effect.effect-sheet").defines(function() {
    sc.BounceSwitchGroups = ig.GameAddon.extend({
        groups: {},
        effects: new ig.EffectSheet("puzzle"),
        init: function() {
            this.parent("BounceSwitchGroups")
        },
        registerSwitch: function(b, a) {
            var d = this.getGroup(b.group);
            d.endSwitch = b;
            d.variable = a;
            ig.vars.setDefault(d.variable, false);
            if (this.isGroupResolved(b.group))
                for (var c = d.blocks.length; c--;) d.blocks[c].onGroupResolve(true)
        },
        registerBlock: function(b) {
            this.getGroup(b.group).blocks.push(b)
        },
        evaluateGroup: function(b) {
            var a = this.getGroup(b);
            this.resetCamera(b);
            a.cameraHandle && ig.camera.removeTarget(a.cameraHandle, "NORMAL", KEY_SPLINES.EASE_IN_OUT);
            a.finalHit && a.blockHitCount == a.blocks.length ? this.resolveGroup(b) : this.resetGroup(b)
        },
        resetGroup: function(b) {
            for (var b = this.getGroup(b), a = b.blocks.length; a--;) b.blocks[a].onGroupReset();
            b.endSwitch.onGroupReset();
            b.finalHit = false;
            b.blockHitCount = 0
        },
        resolveGroup: function(b) {
            b = this.getGroup(b);
            ig.vars.set(b.variable, true);
            for (var a = b.blocks.length; a--;) b.blocks[a].onGroupResolve(false);
            b.endSwitch.onGroupResolve()
        },
        setCameraBall: function(b, a) {
            this.resetCamera(b);
            var d = this.groups[b];
            d.overrideHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([a, ig.game.playerEntity]), 0, 0);
            ig.camera.pushTarget(d.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
        },
        setCameraPos: function(b, a) {
            this.resetCamera(b);
            var d = this.groups[b];
            d.overrideHandle = new ig.Camera.TargetHandle(new ig.Camera.PosTarget(a), 0, 0);
            ig.camera.pushTarget(d.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
        },
        resetCamera: function(b) {
            b =
                this.groups[b];
            b.overrideHandle && ig.camera.removeTarget(b.overrideHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
        },
        isGroupBallConflict: function(b, a) {
            b = this.getGroup(b);
            return b.currentBall && b.currentBall != a
        },
        isGroupResolved: function(b) {
            return (b = this.getGroup(b)) && ig.vars.get(b.variable)
        },
        isBallOfAnyGroup: function(b) {
            for (var a in this.groups)
                if (this.groups[a] && this.groups[a].currentBall == b) return true;
            return false
        },
        getEndSwitch: function(b) {
            return this.getGroup(b).endSwitch
        },
        getHitCount: function(b) {
            return this.getGroup(b).blockHitCount
        },
        onBlockHit: function(b, a) {
            var d = this.getGroup(b.group);
            if (d.currentBall && d.currentBall != a) return false;
            if (!d.currentBall) {
                d.currentBall = a;
                this.effects.spawnOnTarget("bounceTrail", a, {
                    duration: -1,
                    align: ig.ENTITY_ALIGN.CENTER
                });
                a.changeSpeed(0.75)
            }
            d.blockHitCount++;
            return d.blockHitCount
        },
        onSwitchHit: function(b, a) {
            var d = this.getGroup(b.group);
            if (d.currentBall && d.currentBall != a) return false;
            d.currentBall = a;
            d.finalHit = true;
            return d.blockHitCount == d.blocks.length ? true : false
        },
        onDeferredUpdate: function() {
            for (var b in this.groups) {
                var a =
                    this.groups[b];
                if (a.currentBall && a.currentBall._killed) {
                    a.currentBall = null;
                    this.evaluateGroup(b)
                }
            }
        },
        onReset: function() {
            this.groups = {}
        },
        onLevelLoadStart: function() {
            this.groups = {}
        },
        getGroup: function(b) {
            this.groups[b] || (this.groups[b] = {
                endSwitch: null,
                variable: null,
                blocks: [],
                blockHitCount: 0,
                finalHit: false,
                currentBall: null,
                cameraHandle: null,
                overrideHandle: null
            });
            return this.groups[b]
        }
    });
    ig.addGameAddon(function() {
        return sc.bounceSwitchGroups = new sc.BounceSwitchGroups
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
                return "<" + this.group + ">\n[ " + this.variable + " ]"
            }
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.time.globalStatic = true;
            Vec3.assignC(this.coll.size, 24, 24, 24);
            this.group = c.group;
            this.variable = c.variable;
            window.wm || sc.bounceSwitchGroups.registerSwitch(this, c.variable);
            b = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                namedSheets: {
                    base: {
                        src: b.sheet,
                        width: 24,
                        height: 28,
                        offX: 168,
                        xCount: 2
                    },
                    cube: {
                        src: b.sheet,
                        width: 16,
                        height: 24,
                        offX: 224,
                        xCount: 2
                    },
                    top: {
                        src: b.sheet,
                        width: 8,
                        height: 8,
                        offX: 216,
                        offY: 48
                    }
                },
                SUB: [{
                    size: {
                        x: 24,
                        y: 26,
                        z: 0
                    },
                    offset: {
                        y: 0
                    },
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
                    size: {
                        x: 16,
                        y: 16,
                        z: 8
                    },
                    offset: {
                        z: 12,
                        y: -4
                    },
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
                    size: {
                        x: 8,
                        y: 8,
                        z: 0
                    },
                    offset: {
                        z: 20,
                        y: -8
                    },
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
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer -
                    ig.system.tick;
                if (this.timer <= 0) {
                    this.setCurrentAnim("rollingEnd", true, null, true, true);
                    this.timer = 0
                }
            }
            this.parent()
        },
        ballHit: function(b) {
            if (this.isOn || !b.isBall || sc.bounceSwitchGroups.isGroupBallConflict(this.group, b)) {
                sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.NONE, b.getElement(), false, false, true);
                return true
            }
            if (!this.isOn) {
                this.isOn = true;
                this.setCurrentAnim("rolling");
                if (sc.bounceSwitchGroups.onSwitchHit(this, b)) {
                    sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE,
                        b.getElement(), false, false, true);
                    this.effects.spawnOnTarget("bounceFinal", this);
                    ig.SoundHelper.playAtEntity(this.sounds.hit, this)
                } else {
                    sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.NONE, b.getElement(), false, false, true);
                    ig.SoundHelper.playAtEntity(this.sounds.fail, this)
                }
            }
            return true
        },
        animationEnded: function(b) {
            if (b == "rollingEnd") this.setCurrentAnim("flyDown", true, null, true, true);
            else if (b == "flyDown") {
                this.coll.size.z = 0;
                if (this.cameraHandle) {
                    ig.camera.removeTarget(this.cameraHandle,
                        "NORMAL", KEY_SPLINES.EASE_IN_OUT);
                    this.cameraHandle = null
                }
                this.effects.spawnOnTarget("bounceHit", this, {
                    offset: {
                        z: 4
                    }
                });
                this.setCurrentAnim("impact", true, "on");
                ig.SoundHelper.playAtEntity(this.sounds.bing, this)
            }
        },
        onGroupReset: function() {
            this.effects.spawnOnTarget("bounceDenied", this);
            this.isOn = false;
            this.setCurrentAnim("off")
        },
        onGroupResolve: function() {
            this.timer = 0.5;
            this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(this), 0, 0);
            ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_OUT);
            var b = new ig.Rumble.RumbleHandle("RANDOM", "STRONGER", "FASTER", 0.3, true);
            ig.rumble.addRumble(b)
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
                return "[ " + this.variable + " ]\n"
            }
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.time.globalStatic = true;
            this.coll.weight = -1;
            this.coll.zGravityFactor = 1E3;
            Vec3.assignC(this.coll.size,
                16, 16, 24);
            this.timer = new ig.WeightTimer;
            this.group = c.group;
            this.ballTime = c.ballTime || 0.5;
            window.wm || sc.bounceSwitchGroups.registerBlock(this);
            if (c.action) {
                b = c.action;
                this.action = {
                    minHit: b.minHit,
                    camera: b.camera
                }
            }
            if (c = sc.BOUNCE_BLOCK_TYPE[c.blockType]) {
                Vec3.assign(this.coll.size, c.size);
                this.coll.shape = c.shape;
                b = ig.mapStyle.get("puzzle2");
                c.anims.namedSheets.block.src = b.sheet;
                if (c.anims.namedSheets.ground) c.anims.namedSheets.ground.src = b.sheet;
                this.initAnimations(c.anims)
            }
            this.maxZHeight = this.coll.size.z;
            if (sc.bounceSwitchGroups.isGroupResolved(this.group)) this.onGroupResolve(true);
            else this.blockState = 0;
            this.setCurrentAnim(this.blockState ? "on" : "off")
        },
        ballHit: function(b, a) {
            if (!b.isBall || sc.bounceSwitchGroups.isGroupBallConflict(this.group, b)) {
                sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.NONE, b.getElement(), false, false, true);
                return true
            }
            if (!a || Vec2.isZero(a)) return false;
            if (!this.blockState) {
                this.blockState = 1;
                var d = sc.bounceSwitchGroups.getGroup(this.group);
                ig.SoundHelper.playAtEntity(this.sounds.bing,
                    this, false, {
                        speed: 1 - (d.blocks.length + 2 - d.blockHitCount) * 0.03
                    });
                b.resetBounceCount();
                b.resetTime(this.ballTime / b.speedFactor);
                b.cleanDirection(0.025);
                sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.HEAVY, b.getElement(), false, false, true);
                this.effects.spawnOnTarget("bounceHit", this);
                this.setCurrentAnim("on");
                d = sc.bounceSwitchGroups.onBlockHit(this, b);
                if (this.action && this.action.minHit <= d) {
                    d = this.action.camera.type;
                    d == "reset" ? sc.bounceSwitchGroups.resetCamera(this.group) : d == "ball" ? sc.bounceSwitchGroups.setCameraBall(this.group,
                        b) : d == "fixed" && sc.bounceSwitchGroups.setCameraPos(this.group, this.action.camera.value)
                }
            }
            return false
        },
        onGroupResolve: function(b) {
            this.blockState = 2;
            b ? this.coll.setSize(this.coll.size.x, this.coll.size.y, 0) : this.timer.set(1, ig.TIMER_MODE.ONCE);
            this.setCurrentAnim("on")
        },
        onGroupReset: function() {
            this.blockState == 0 && this.effects.spawnOnTarget("bounceDenied", this);
            this.blockState = 0;
            this.setCurrentAnim("off")
        },
        update: function() {
            if (!this.timer.done()) {
                this.timer.tick();
                var b = KEY_SPLINES.EASE_IN_OUT.get(this.timer.get());
                this.blockState == 2 && (b = 1 - b);
                b = Math.round(this.maxZHeight * b);
                this.coll.setSize(this.coll.size.x, this.coll.size.y, b)
            }
            this.parent()
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.sprites.length) this.sprites[0].src.y = this.sprites[0].src.y - (this.maxZHeight - this.coll.size.z)
        }
    });
    sc.BOUNCE_BLOCK_TYPE["default"] = {
        size: {
            x: 24,
            y: 24,
            z: 23
        },
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
        size: {
            x: 24,
            y: 24,
            z: 23
        },
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
                size: {
                    x: 24,
                    y: 24,
                    z: 0
                },
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
        size: {
            x: 24,
            y: 24,
            z: 23
        },
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
                size: {
                    x: 24,
                    y: 23,
                    z: 1
                },
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
        size: {
            x: 24,
            y: 24,
            z: 23
        },
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
                size: {
                    x: 24,
                    y: 23,
                    z: 1
                },
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
        size: {
            x: 24,
            y: 24,
            z: 23
        },
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
                size: {
                    x: 24,
                    y: 24,
                    z: 0
                },
                frames: [0],
                SUB: [{
                    name: "off"
                }, {
                    name: "on"
                }]
            }]
        }
    }
});
ig.baked = !0;
