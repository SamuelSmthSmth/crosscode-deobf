/**
 * game.feature.puzzle.entities.one-time-switch
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.one-time-switch")`.
 *
 * `ig.ENTITY.OneTimeSwitch`: a switch that fires once (sets/increments a
 * var, can be timed, can react to being hit as a teslaSwitch).
 * `sc.ONE_TIME_SWTICH_TYPE` is the type table.
 */
ig.module("game.feature.puzzle.entities.one-time-switch").requires("impact.base.entity").defines(function() {
    sc.ONE_TIME_SWTICH_TYPE = {};
    ig.ENTITY.OneTimeSwitch = ig.AnimatedEntity.extend({
        hitCondition: null,
        ballDestroyer: true,
        timer: 0,
        fullZHeight: 0,
        variable: "",
        isOn: false,
        sounds: {
            hit: new ig.Sound("media/sound/battle/hit-7.ogg", 0.4),
            bing: new ig.Sound("media/sound/puzzle/switch-activate-2.ogg", 1)
        },
        switchType: null,
        data: null,
        fx: {},
        fxHandle: null,
        fxHideHandle: null,
        hasOverlap: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                switchType: {
                    _type: "String",
                    _info: "Type of Switch",
                    _select: sc.ONE_TIME_SWTICH_TYPE
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be se to true when switch is activated"
                },
                addValue: {
                    _type: "VarName",
                    _info: "Variable to increase by one when switch is activated"
                },
                activeTime: {
                    _type: "Number",
                    _info: "If >0: only keep switch active for said amount of time"
                },
                fixCount: {
                    _type: "Integer",
                    _info: "If >0: if addValue reached fixCount, remain active permanently"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true,
                    _optional: true
                },
                fastMode: {
                    _type: "Boolean",
                    _info: "Make sure puzzle element is not slowed down by assist mode"
                }
            },
            label: function() {
                return "[ " + this.variable + " ]\m" + this.addValue + "++";
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFacter = 1E3;
            this.switchType = settings.switchType;
            this.fastMode = settings.fastMode || false;
            var switchType = sc.ONE_TIME_SWTICH_TYPE[settings.switchType];
            if (switchType) {
                if (switchType.collType) this.coll.type = switchType.collType;
                Vec3.assign(this.coll.sie, switchType.size);
                Vec2.assign(this.coll.padding, switchType.padding);
                this.hitCondition = switchType.hitCondition;
                this.fullZHeight = this.coll.size.z;
                if (switchType.noBallDestroyer) this.ballDestroyer = false;
                var anims = switchType.anims;
                if (switchType.useStyleSheet) {
                    var mapStyle = ig.mapStyle.get(switchType.useStyleSheet);
                    if (mapStyle) {
                        anims = ig.copy(anims);
                        if (anims.sheet) {
                            anims.sheet.src = mapStyle.sheet;
                            if (mapStyle.x !== void 0) anims.sheet.offX = mapStyle.x;
                            if (mapStyle.y !== void 0) anims.sheet.offY = mapStyle.y;
                        } else if (anims.namedSheets)
                            for (var key in anims.namedSheets) {
                                var sheet = anims.namedSheets[key];
                                sheet.src = mapStyle.sheet;
                                if (mapStyle.x !== void 0) sheet.offX = sheet.offX + mapStyle.x;
                                if (mapStyle.y !== void 0) sheet.offY = sheet.offY + mapStyle.y;
                            }
                    }
                }
                this.initAnimations(anims);
                this.data = switchType;
                if (switchType.fx)
                    for (var fxKey in switchType.fx) this.fx[fxKey] = new ig.EffectHandle(switchType.fx[fxKey]);
            }
            this.variable = settings.variable;
            this.addValue = settings.addValue;
            this.activeTime = settings.activeTime;
            this.fixCount = settings.fixCount || 0;
            if (!this.activeTime) this.coll.time.globalStatic = true;
            ig.vars.setDefault(this.variable, 0);
            ig.vars.setDefault(this.addValue, 0);
            if (this.fixCount && ig.vars.get(this.addValue) >= this.fixCount) {
                this.isOn = true;
                this.activeTime = 0;
            }
            if (this.variable) this.isOn = ig.vars.get(this.variable);
            if (this.isOn) this.coll.size.z = this.data.activeZHeight;
            this.setCurrentAnim(this.isOn ? "on" : this.getOffAnim());
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
            if (this.activeTime && this.isOn) {
                this.timer = 0;
                this.setOff();
            }
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
        onKill: function(entity) {
            if (this.activeTime && this.isOn) this.setOff();
            for (var key in this.fx) this.fx[key].clearCached();
            this.parent(entity);
        },
        update: function() {
            if (this.hasOverlap) {
                var coll = this.coll,
                    pos = coll.pos,
                    size = coll.size,
                    padX = coll.padding.x,
                    padY = coll.padding.y,
                    entities = ig.game.getEntitiesInRectangle(pos.x - padX, pos.y - padY, pos.z, size.x + padX * 2, size.y + padY * 2, size.z, this);
                this.hasOverlap = false;
                for (var i = entities.length; i--;)
                    if (this.data.hitCondition(this, entities[i])) this.hasOverlap = true;
                if (!this.hasOverlap) this.setTempOn();
            }
            if (this.timer && !this.hasOverlap) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.setOff();
                    if (this.fxHandle) this.fxHandle.stop();
                    this.fxHandle = null;
                    if (this.fx.tmpOnEnd) this.fx.tmpOnEnd.spawnOnTarget(this);
                    if (this.animSheet.hasAnimation("tmpOnEnd")) this.setCurrentAnim("tmpOnEnd", true, this.getOffAnim());
                    else this.setCurrentAnim(this.getOffAnim());
                } else if (this.timer < this.data.preStopTime && this.currentAnim != "tmpOnSlow") {
                    if (this.fx.tmpOnSlow) {
                        if (this.fxHandle) this.fxHandle.stop();
                        this.fxHandle = this.fx.tmpOnSlow.spawnOnTarget(this, {
                            duration: -1
                        });
                    }
                    this.setCurrentAnim("tmpOnSlow", true);
                }
            }
            this.parent();
        },
        ballHit: function(ball) {
            if (this.fxHideHandle || (ball.attackInfo && ball.attackInfo.hasHint("NO_PUZZLE")) || this.hasOverlap) return false;
            if (this.hitCondition(this, ball)) {
                if (this.isOn && (!this.activeTime || this.hasOverlap)) return true;
                if (!this.isOn) {
                    ig.vars.set(this.variable, true);
                    ig.vars.add(this.addValue, 1);
                    this.isOn = true;
                }
                if (!this.data.hideHitEffect) sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE, ball.getElement(), false, false, true);
                ig.SoundHelper.playAtEntity(this.sounds.hit, this);
                ig.SoundHelper.playAtEntity(this.sounds.bing, this);
                if (this.activeTime) {
                    this.timer = this.activeTime / (this.fastMode ? 1 : sc.options.get("assist-puzzle-speed"));
                    if (this.data.checkOverlap) this.hasOverlap = true;
                    this.setTempOn(this.hasOverlap);
                } else this.setOn();
            } else {
                if (this.data.ignoreInvalid) return false;
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            }
            return true;
        },
        animationEnded: function(animName) {
            if (animName == "preOn") this.finalizeOn();
        },
        setTempOn: function(overlapping) {
            if (this.fxHandle) this.fxHandle.stop();
            this.fxHandle = overlapping && this.fx.tmpOnOverlap ?
                this.fx.tmpOnOverlap.spawnOnTarget(this, { duration: -1 }) :
                this.fx.tmpOn ? this.fx.tmpOn.spawnOnTarget(this, { duration: -1 }) : null;
            this.setCurrentAnim(overlapping ? "tmpOnOverlap" : "tmpOn", true, null);
        },
        setOn: function() {
            if (this.fxHandle) this.fxHandle.stop();
            this.fxHandle = null;
            if (this.fx.on) this.fx.on.spawnOnTarget(this);
            if (this.animSheet.hasAnimation("preOn")) this.setCurrentAnim("preOn", true, null, true, true);
            else this.finalizeOn();
        },
        finalizeOn: function() {
            this.coll.size.z = this.data.activeZHeight;
            if (this.animSheet.hasAnimation("preOnEnd")) this.setCurrentAnim("preOnEnd", true, "on");
            else this.setCurrentAnim("on", true);
        },
        varsChanged: function() {
            if (this.variable) {
                var isOn = ig.vars.get(this.variable);
                if (this.isOn != isOn) {
                    this.isOn = isOn;
                    this.coll.size.z = this.isOn ? this.activeZHeight : this.fullZHeight;
                    this.setCurrentAnim(this.isOn ? "on" : this.getOffAnim(), true, null, true);
                }
            }
            if (this.activeTime && this.fixCount && ig.vars.get(this.addValue) >= this.fixCount) {
                this.timer = this.activeTime = 0;
                this.setOn();
            }
        },
        getOffAnim: function() {
            return !this.activeTime || !this.animSheet.hasAnimation("tmpOff") ? "off" : "tmpOff";
        },
        setOff: function() {
            this.isOn = false;
            ig.vars.set(this.variable, false);
            ig.vars.sub(this.addValue, 1);
        }
    });
    sc.ONE_TIME_SWTICH_TYPE["default"] = {
        size: { x: 16, y: 16, z: 17 },
        padding: { x: 4, y: 4 },
        activeZHeight: 0,
        useStyleSheet: "puzzle",
        anims: {
            offset: { x: 0, y: 0, z: 0 },
            sheet: {
                src: null,
                width: 16,
                height: 32
            },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0, 1, 2, 3],
                repeat: true
            }, {
                name: "preOn",
                time: 0.03,
                frames: [8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 10, 11, 11, 11, 8, 8, 8, 8, 8, 12, 13],
                repeat: false
            }, {
                name: "preOnEnd",
                time: 0.1,
                frames: [14, 15],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [15],
                repeat: false
            }, {
                name: "tmpOn",
                time: 0.025,
                frames: [4, 5, 6, 7],
                repeat: true
            }, {
                name: "tmpOnSlow",
                time: 0.05,
                frames: [4, 5, 6, 7],
                repeat: true
            }]
        },
        hitCondition: function(switchEntity, source) {
            return source.party == sc.COMBATANT_PARTY.PLAYER;
        }
    };
    sc.ONE_TIME_SWTICH_TYPE["turret-switch"] = {
        size: { x: 24, y: 24, z: 21 },
        padding: { x: 0, y: 0 },
        activeZHeight: 21,
        anims: {
            offset: { x: -1, y: 1, z: 0 },
            sheet: {
                src: "media/entity/objects/switch-special.png",
                width: 24,
                height: 48
            },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "preOn",
                time: 0.03,
                frames: [0, 1, 1, 1, 2],
                repeat: false
            }, {
                name: "preOnEnd",
                time: 0.03,
                frames: [3],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [3],
                repeat: false
            }]
        },
        hitCondition: function(switchEntity, source) {
            return source.party == sc.COMBATANT_PARTY.ENEMY;
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.propeller = {
        size: { x: 16, y: 16, z: 24 },
        padding: { x: 4, y: 4 },
        activeZHeight: 21,
        preStopTime: 1,
        useStyleSheet: "propeller",
        anims: {
            sheet: {
                src: "media/map/heat-dng.png",
                width: 24,
                height: 32,
                offX: 320,
                offY: 256
            },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "tmpOn",
                time: 0.033,
                frames: [3, 4, 5],
                repeat: true
            }, {
                name: "tmpOnSlow",
                time: 0.05,
                frames: [1, 2, 0],
                repeat: true
            }, {
                name: "tmpOnEnd",
                time: 0.05,
                frames: [0, 0, 1, 1, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2],
                repeat: false
            }, {
                name: "on",
                time: 0.033,
                frames: [3, 4, 5],
                repeat: true
            }]
        },
        fx: {
            tmpOn: { sheet: "puzzle.propeller", name: "tmpOn" },
            tmpOnSlow: { sheet: "puzzle.propeller", name: "tmpOnSlow" },
            tmpOnEnd: { sheet: "puzzle.propeller", name: "tmpOnEnd" }
        },
        hitCondition: function(switchEntity, source) {
            return source.attackInfo && source.attackInfo.hasHint("STEAM");
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.steamPipe = {
        collType: ig.COLLTYPE.BLOCK,
        size: { x: 16, y: 16, z: 10 },
        padding: { x: 0, y: 0 },
        activeZHeight: 10,
        preStopTime: 1,
        ignoreInvalid: true,
        hideHitEffect: true,
        useStyleSheet: "pipeSwitch",
        anims: {
            sheet: {
                src: "media/map/heat-dng.png",
                width: 16,
                height: 24,
                offX: 368,
                offY: 208,
                xCount: 1
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "on",
                time: 0.1,
                frames: [1],
                repeat: true
            }, {
                name: "tmpOn",
                time: 0.05,
                frames: [0],
                repeat: true
            }, {
                name: "tmpOn",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 0.75, 0.5, 0.5, 0.75, 1],
                repeat: true
            }, {
                name: "tmpOnSlow",
                time: 0.05,
                frames: [1, 0],
                repeat: true
            }]
        },
        fx: {
            tmpOn: { sheet: "puzzle.water-bubble", name: "steamSwitchTmp" },
            on: { sheet: "puzzle.water-bubble", name: "steamSwitchOn" }
        },
        hitCondition: function(switchEntity, source) {
            return source.attackInfo && source.attackInfo.hasHint("STEAM_PIPE");
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.teslaSwitch = {
        collType: ig.COLLTYPE.VIRTUAL,
        size: { x: 16, y: 16, z: 16 },
        padding: { x: 0, y: 0 },
        activeZHeight: 16,
        preStopTime: 1,
        hideHitEffect: true,
        useStyleSheet: "teslaSwitch",
        anims: {
            sheet: {
                src: "media/map/shockwave-dng.png",
                width: 16,
                height: 32,
                offX: 208,
                offY: 368,
                xCount: 2
            },
            wallY: 0,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "on",
                time: 0.1,
                frames: [1],
                repeat: true
            }, {
                name: "tmpOn",
                time: 0.05,
                frames: [0],
                repeat: true
            }, {
                name: "tmpOn",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 0.75, 0.5, 0.5, 0.75, 1],
                repeat: true
            }, {
                name: "tmpOnSlow",
                time: 0.05,
                frames: [1, 0],
                repeat: true
            }]
        },
        fx: {
            tmpOn: { sheet: "puzzle.tesla", name: "switchOnTmp" },
            on: { sheet: "puzzle.tesla", name: "switchOn" }
        },
        hitCondition: function(switchEntity, source) {
            return source.attackInfo && source.attackInfo.hasHint("LIGHTNING");
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.arSwitch = {
        size: { x: 16, y: 16, z: 17 },
        padding: { x: 4, y: 4 },
        activeZHeight: 0,
        anims: {
            offset: { x: 0, y: 0, z: 0 },
            sheet: {
                src: "media/entity/objects/dungeon-ar.png",
                width: 16,
                height: 32,
                offX: 192,
                offY: 64,
                xCount: 4
            },
            renderMode: "lighter",
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0, 1, 2, 3],
                repeat: true
            }, {
                name: "preOn",
                time: 0.03,
                frames: [8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 10, 11, 11, 11, 8, 8, 8, 8, 8, 12, 13],
                repeat: false
            }, {
                name: "preOnEnd",
                time: 0.1,
                frames: [14, 15],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [15],
                repeat: false
            }, {
                name: "tmpOn",
                time: 0.025,
                frames: [4, 5, 6, 7],
                repeat: true
            }, {
                name: "tmpOnSlow",
                time: 0.05,
                frames: [4, 5, 6, 7],
                repeat: true
            }]
        },
        fx: {
            show: { sheet: "ar", name: "arSwitchShow" },
            hide: { sheet: "ar", name: "arSwitchHide" }
        },
        hitCondition: function(switchEntity, source) {
            return source.party == sc.COMBATANT_PARTY.PLAYER;
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.waveSwitch = {
        collType: ig.COLLTYPE.BLOCK,
        size: { x: 24, y: 24, z: 24 },
        padding: { x: 0, y: 0 },
        activeZHeight: 24,
        preStopTime: 1,
        ignoreInvalid: true,
        hideHitEffect: false,
        useStyleSheet: "waveSwitch",
        anims: {
            namedSheets: {
                box: {
                    src: "media/map/shockwave-dng.png",
                    width: 24,
                    height: 48,
                    offX: 0,
                    offY: 0,
                    xCount: 1
                },
                shck: {
                    src: "media/map/shockwave-dng.png",
                    width: 24,
                    height: 40,
                    offX: 24,
                    offY: 8
                }
            },
            SUB: [{
                wallY: 1,
                sheet: "box",
                SUB: [{
                    name: "on",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }, {
                    name: "off",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }, {
                    name: "tmpOn",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }, {
                    name: "tmpOnSlow",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }, {
                    name: "tmpOnEnd",
                    time: 0.1,
                    frames: [0],
                    repeat: true
                }]
            }, {
                sheet: "shock",
                renderMode: "lighter",
                SUB: [{
                    name: "off",
                    time: 0.05,
                    frames: [0, 1, 2, 3],
                    repeat: true
                }, {
                    name: "tmpOn",
                    time: 0.033,
                    frames: [4, 5, -1, -1, -1, 5],
                    repeat: true
                }, {
                    name: "tmpOnSlow",
                    time: 0.033,
                    frames: [4, 5, -1, 5],
                    repeat: true
                }, {
                    name: "tmpOnEnd",
                    time: 0.066,
                    frames: [5],
                    repeat: true
                }]
            }]
        },
        fx: {
            tmpOn: { sheet: "puzzle.compressor", name: "waveSwitchTmpOn" },
            on: { sheet: "puzzle.compressor", name: "waveSwitchOn" }
        },
        hitCondition: function(switchEntity, source) {
            return source.attackInfo && source.attackInfo.hasHint("COMPRESSED") && source.getElement() == sc.ELEMENT.WAVE;
        }
    };
    sc.ONE_TIME_SWTICH_TYPE.feroSwitch = {
        collType: ig.COLLTYPE.TRIGGER,
        size: { x: 16, y: 16, z: 24 },
        padding: { x: 2, y: 2 },
        activeZHeight: 24,
        preStopTime: 1,
        ignoreInvalid: true,
        hideHitEffect: true,
        checkOverlap: true,
        noBallDestroyer: true,
        anims: {
            namedSheets: {
                ground: {
                    src: "media/entity/objects/fero.png",
                    width: 16,
                    height: 16,
                    offX: 144,
                    offY: 352
                },
                holo: {
                    src: "media/entity/objects/fero.png",
                    width: 16,
                    height: 16,
                    offX: 144,
                    offY: 320,
                    xCount: 6
                }
            },
            SUB: [{
                wallY: 0,
                size: { x: 16, y: 16, z: 0 },
                sheet: "ground",
                time: 0.1,
                repeat: true,
                SUB: [{
                    name: "on",
                    frames: [2]
                }, {
                    name: "off",
                    frames: [1]
                }, {
                    name: "tmpOff",
                    frames: [5]
                }, {
                    name: "tmpOnOverlap",
                    frames: [3]
                }, {
                    name: "tmpOn",
                    time: 0.066,
                    frames: [3, 3, 4, 0, 0, 4],
                    repeat: true
                }, {
                    name: "tmpOnSlow",
                    time: 0.05,
                    frames: [3, 4, 0, 4],
                    repeat: true
                }, {
                    name: "tmpOnEnd",
                    time: 0.1,
                    frames: [3, 0],
                    repeat: true
                }]
            }, {
                sheet: "holo",
                renderMode: "lighter",
                size: { x: 16, y: 0, z: 16 },
                SUB: [{
                    name: "off",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: true,
                    offset: { z: 14 }
                }, {
                    name: "tmpOff",
                    time: 0.1,
                    frames: [6, 7, 8, 9],
                    repeat: true,
                    offset: { z: 14 }
                }, {
                    name: "on",
                    time: 0.1,
                    frames: [4],
                    repeat: true
                }, {
                    name: "on",
                    time: 0.1,
                    frames: [5],
                    repeat: true,
                    offset: { y: -9 }
                }]
            }]
        },
        fx: {
            tmpOn: { sheet: "puzzle.fero", name: "switchTmpOn" },
            tmpOnOverlap: { sheet: "puzzle.fero", name: "switchTmpOverlap" },
            on: { sheet: "puzzle.fero", name: "switchOn" }
        },
        hitCondition: function(switchEntity, source) {
            return source instanceof sc.FerroEntity && !source.isRespawning();
        }
    };
});
ig.baked = !0;