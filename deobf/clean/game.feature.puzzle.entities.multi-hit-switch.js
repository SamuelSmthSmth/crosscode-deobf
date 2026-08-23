/**
 * game.feature.puzzle.entities.multi-hit-switch
 * =============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.multi-hit-switch")`.
 *
 * `ig.ENTITY.MultiHitSwitch`: a switch that requires several hits
 * (`hitCount`) within a timeout; hits decay after `decreaseDelay` until only
 * `decreaseRepeat`-spaced steps remain. Once fully hit it stays on, sets the
 * variable and increments `addValue`. Three variants: "default",
 * "arSwitch" (uses AR effect handles) and "old" (switch2.png sheet).
 */
ig.module("game.feature.puzzle.entities.multi-hit-switch")
    .requires("impact.base.entity")
    .defines(function () {

    sc.MULTI_HIT_SWTICH_TYPE = {};

    ig.ENTITY.MultiHitSwitch = ig.AnimatedEntity.extend({
        hitCondition: null,
        ballDestroyer: true,
        activeZHeight: 0,
        variable: "",
        isOn: false,
        hitsToActive: 0,
        currentHits: 0,
        decreaseDelay: 0,
        decreaseRepeat: 0,
        timerUntilDecrease: 0,
        timerDecreaseStep: 0,
        hitSound: new ig.Sound("media/sound/battle/hit-7.ogg", 0.4),
        countSound: new ig.Sound("media/sound/puzzle/counter.ogg", 1),
        activateSound: new ig.Sound("media/sound/puzzle/switch-activate-2.ogg", 1),
        fx: {},
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                switchType: {
                    _type: "String",
                    _info: "Type of Switch",
                    _select: sc.MULTI_HIT_SWTICH_TYPE
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be se to true when switch is activated"
                },
                addValue: {
                    _type: "VarName",
                    _info: "Variable to increase by one when switch is activated"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true,
                    _optional: true
                }
            },
            label: function () {
                return "Hits: " + this.hitsToActive + " [ " + this.variable + " ]\n" + this.addValue + "++"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.time.globalStatic = true;
            var typeData = sc.MULTI_HIT_SWTICH_TYPE[settings.switchType];
            if (typeData) {
                Vec3.assign(this.coll.size, typeData.size);
                Vec2.assign(this.coll.padding, typeData.padding);
                this.hitCondition = typeData.hitCondition;
                this.hitsToActive = typeData.hitCount;
                this.activeZHeight = typeData.activeZHeight;
                this.decreaseDelay = typeData.decreaseDelay;
                this.decreaseRepeat = typeData.decreaseRepeat;
                if (typeData.useStyleSheet) {
                    var puzzleStyle = ig.mapStyle.get("puzzle");
                    typeData.anims.sheet.src = puzzleStyle.sheet
                }
                if (typeData.fx)
                    for (var fxKey in typeData.fx) this.fx[fxKey] = new ig.EffectHandle(typeData.fx[fxKey]);
                this.initAnimations(typeData.anims)
            }
            this.variable = settings.variable;
            this.addValue = settings.addValue;
            ig.vars.setDefault(this.variable, 0);
            ig.vars.setDefault(this.addValue, 0);
            if (this.isOn = ig.vars.get(this.variable)) this.coll.size.z = this.activeZHeight;
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },

        show: function (show) {
            this.parent(show);
            if (this.fxHideHandle) {
                this.fxHideHandle.stop();
                this.fxHideHandle = null
            }
            if (!show) {
                this.animState.alpha = 0;
                this.fx.show ? this.fx.show.spawnOnTarget(this, {}) : ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
            }
        },

        onHideRequest: function () {
            this.fx.hide ? this.fxHideHandle = this.fx.hide.spawnOnTarget(this, {
                callback: this
            }) : ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect == this.fxHideHandle && effect.isDone()) {
                this.fxHideHandle = null;
                this.hide()
            }
        },

        onKill: function (parent) {
            for (var fxKey in this.fx) this.fx[fxKey].clearCached();
            this.parent(parent)
        },

        update: function () {
            this.parent();
            if (!(this.isOn || this.currentHits <= 0))
                if (this.timerUntilDecrease <= 0)
                    if (this.timerDecreaseStep <= 0) {
                        this.currentHits--;
                        this.timerDecreaseStep = this.decreaseRepeat;
                        this._setAnimation()
                    } else this.timerDecreaseStep = this.timerDecreaseStep - ig.system.tick;
                else this.timerUntilDecrease = this.timerUntilDecrease - ig.system.tick
        },

        ballHit: function (ball) {
            if (!this.isOn && this.hitCondition(this, ball)) {
                this.timerUntilDecrease = this.decreaseDelay;
                this.timerDecreaseStep = this.decreaseRepeat;
                this.currentHits++;
                ig.SoundHelper.playAtEntity(this.hitSound, this);
                if (this.currentHits >= this.hitsToActive) {
                    this.isOn = true;
                    this.setCurrentAnim("switch", true, null, true, true);
                    sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE, ball.getElement(), false, false, true);
                    ig.SoundHelper.playAtEntity(this.activateSound, this);
                    ig.vars.set(this.variable, true);
                    ig.vars.add(this.addValue, 1)
                } else {
                    this._setAnimation();
                    ig.SoundHelper.playAtEntity(this.countSound, this);
                    sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.LIGHT, ball.getElement(), false, false, true)
                }
            } else sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            return true
        },

        animationEnded: function (animName) {
            if (animName == "switch") {
                this.coll.size.z = this.activeZHeight;
                this.setCurrentAnim("switch_end", true, "on")
            }
        },

        _setAnimation: function () {
            this.setCurrentAnim(this.currentHits ? "step" + this.currentHits : "off")
        }
    });

    sc.MULTI_HIT_SWTICH_TYPE["default"] = {
        size: {
            x: 16,
            y: 16,
            z: 17
        },
        padding: {
            x: 4,
            y: 4
        },
        activeZHeight: 0,
        hitCount: 5,
        decreaseDelay: 0.3,
        decreaseRepeat: 0.05,
        useStyleSheet: true,
        anims: {
            offset: {
                x: 0,
                y: 0,
                z: 0
            },
            sheet: {
                src: null,
                width: 16,
                height: 32,
                offY: 32
            },
            SUB: [{
                name: "off",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "switch",
                time: 0.05,
                frames: [5, 6, 7, 8, 9, 5, 6, 7, 8, 9, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 12],
                repeat: false
            }, {
                name: "switch_end",
                time: 0.03,
                frames: [13],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [13],
                repeat: false
            }, {
                name: "step1",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "step2",
                time: 1,
                frames: [2],
                repeat: false
            }, {
                name: "step3",
                time: 1,
                frames: [3],
                repeat: false
            }, {
                name: "step4",
                time: 1,
                frames: [4],
                repeat: false
            }]
        },
        hitCondition: function (switchEntity, ball) {
            return ball.party == sc.COMBATANT_PARTY.PLAYER
        }
    };

    sc.MULTI_HIT_SWTICH_TYPE.arSwitch = {
        size: {
            x: 16,
            y: 16,
            z: 17
        },
        padding: {
            x: 4,
            y: 4
        },
        activeZHeight: 0,
        hitCount: 5,
        decreaseDelay: 0.3,
        decreaseRepeat: 0.05,
        useStyleSheet: false,
        anims: {
            offset: {
                x: 0,
                y: 0,
                z: 0
            },
            sheet: {
                src: "media/entity/objects/dungeon-ar.png",
                width: 16,
                height: 32,
                offY: 256
            },
            renderMode: "lighter",
            SUB: [{
                    name: "off",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "switch",
                    time: 0.05,
                    frames: [5, 6, 7, 8, 9, 5, 6, 7, 8, 9, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 12],
                    repeat: false
                }, {
                    name: "switch_end",
                    time: 0.03,
                    frames: [13],
                    repeat: false
                }, {
                    name: "on",
                    time: 1,
                    frames: [13],
                    repeat: false
                },
                {
                    name: "step1",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "step2",
                    time: 1,
                    frames: [2],
                    repeat: false
                }, {
                    name: "step3",
                    time: 1,
                    frames: [3],
                    repeat: false
                }, {
                    name: "step4",
                    time: 1,
                    frames: [4],
                    repeat: false
                }
            ]
        },
        fx: {
            show: {
                sheet: "ar",
                name: "arSwitchShow"
            },
            hide: {
                sheet: "ar",
                name: "arSwitchHide"
            }
        },
        hitCondition: function (switchEntity, ball) {
            return ball.party == sc.COMBATANT_PARTY.PLAYER
        }
    };

    sc.MULTI_HIT_SWTICH_TYPE.old = {
        size: {
            x: 16,
            y: 16,
            z: 17
        },
        activeZHeight: 0,
        hitCount: 4,
        decreaseDelay: 0.3,
        decreaseRepeat: 0.05,
        anims: {
            offset: {
                x: -1,
                y: 1,
                z: 0
            },
            sheet: {
                src: "media/entity/objects/switch2.png",
                width: 16,
                height: 32
            },
            SUB: [{
                name: "off",
                time: 1,
                frames: [16],
                repeat: false
            }, {
                name: "switch",
                time: 0.03,
                frames: [4, 5, 6, 7, 4, 5, 6, 7, 4, 5, 6, 7, 4, 5, 6, 7, 4, 5, 6, 6, 7, 7, 7, 4, 4, 4, 4, 4, 8, 9],
                repeat: false
            }, {
                name: "switch_end",
                time: 0.03,
                frames: [10, 11, 12, 13, 14, 15],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [15],
                repeat: false
            }, {
                name: "step1",
                time: 1,
                frames: [17],
                repeat: false
            }, {
                name: "step2",
                time: 1,
                frames: [18],
                repeat: false
            }, {
                name: "step3",
                time: 1,
                frames: [19],
                repeat: false
            }]
        },
        hitCondition: function (switchEntity, ball) {
            return ball.party == sc.COMBATANT_PARTY.PLAYER
        }
    }
});
ig.baked = !0;