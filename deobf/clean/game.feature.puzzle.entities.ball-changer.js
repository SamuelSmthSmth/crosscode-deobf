/**
 * game.feature.puzzle.entities.ball-changer
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.ball-changer")`.
 *
 * `ig.ENTITY.BallChanger`: a pad that modifies a passing ball. The
 * `sc.BALL_CHANGER_TYPE` table defines the behaviours: CHANGE_DIR
 * (redirect 8-way), CHANGE_SPEED (speed up/down), RESET_SPEED and
 * CHANGE_ELEMENT (convert to another element ball). Gated by a
 * `VarCondition`.
 */
ig.module("game.feature.puzzle.entities.ball-changer")
    .requires("impact.base.actor-entity", "impact.base.entity", "impact.base.game", "game.feature.combat.model.combat-params", "impact.feature.effect.effect-sheet")
    .defines(function () {

    var grabPos = Vec3.create();

    ig.ENTITY.BallChanger = ig.AnimatedEntity.extend({
        isOn: false,
        condition: null,
        changerType: null,
        disableTimer: 0,
        disableBall: null,
        ballTime: 0,
        resetBounce: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                changerType: {
                    _type: "BallChangerType",
                    _info: "Type of BallChanger",
                    _popup: true
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for BallChanger to be active"
                },
                ballTime: {
                    _type: "Number",
                    _info: "How long the ball will be alive after bouncing with this block. (default=0.5)",
                    _optional: true,
                    _default: 0.5
                },
                resetBounce: {
                    _type: "Boolean",
                    _info: "If true, bounces are reset when this changer is hit",
                    _optional: true,
                    _default: true
                }
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),
        fx: {
            sheet: new ig.EffectSheet("puzzle.ball-changer")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.weight = -1;
            this.coll.zGravityFactor = 1E3;
            Vec3.assignC(this.coll.size, 24, 24, 24);
            this.condition = new ig.VarCondition(settings.condition);
            this.ballTime = settings.ballTime || 0;
            this.resetBounce = settings.resetBounce || false;
            if (settings.changerType) {
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false
                }
                var typeSettings = settings.changerType;
                this.changerType = new sc.BALL_CHANGER_TYPE[typeSettings.type](typeSettings.settings);
                var puzzleStyle = ig.mapStyle.get("puzzle2"),
                    icon = this.changerType.icon;
                this.initAnimations({
                    namedSheets: {
                        base: {
                            src: puzzleStyle.sheet,
                            width: 16,
                            height: 16,
                            offX: 144,
                            offY: 64
                        },
                        sphere: {
                            src: puzzleStyle.sheet,
                            width: 16,
                            height: 16,
                            offX: 192,
                            offY: 64,
                            xCount: 4
                        },
                        icon: {
                            src: puzzleStyle.sheet,
                            width: 16,
                            height: 16,
                            offX: 144,
                            offY: 80,
                            xCount: 3
                        }
                    },
                    SUB: [{
                        size: {
                            x: 16,
                            y: 16,
                            z: 0
                        },
                        offset: {
                            y: -4
                        },
                        sheet: "base",
                        SUB: [{
                            name: "off",
                            time: 1,
                            frames: [0]
                        }, {
                            name: "on",
                            time: 1,
                            frames: [2]
                        }, {
                            name: "show",
                            time: 0.06,
                            frames: [1, 2]
                        }, {
                            name: "hide",
                            time: 0.06,
                            frames: [1, 0]
                        }, {
                            name: "used",
                            time: 0.15,
                            frames: [1, 2, 1, 0],
                            repeat: true
                        }]
                    }, {
                        size: {
                            x: 16,
                            y: 0,
                            z: 16
                        },
                        offset: {
                            z: 12,
                            y: -5
                        },
                        renderMode: "lighter",
                        sheet: "sphere",
                        SUB: [{
                            name: "on",
                            time: 0.15,
                            frames: [0, 1, 2, 3, 0, 1, 2, 3],
                            repeat: true,
                            tileOffset: 4 + this.changerType.sphereColor * 4,
                            framesGfxOffset: [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, -1, 0, -1, 0, -1]
                        }, {
                            name: "show",
                            time: 0.03,
                            frames: [0, 1, 2, 3]
                        }, {
                            name: "hide",
                            time: 0.03,
                            frames: [3, 2, 1, 0]
                        }]
                    }, {
                        size: {
                            x: 16,
                            y: 0,
                            z: 16
                        },
                        offset: {
                            z: 13,
                            y: -4
                        },
                        sheet: "icon",
                        frames: [icon, icon, icon, icon, icon, icon, icon, icon],
                        flipX: this.changerType.flipX,
                        flipY: this.changerType.flipY,
                        framesGfxOffset: [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, -1, 0, -1, 0, -1],
                        time: 0.15,
                        repeat: true,
                        SUB: [{
                            name: "on"
                        }]
                    }]
                });
                this.isOn = this.condition.evaluate();
                this.setCurrentAnim(this.isOn ? "on" : "off")
            }
        },

        update: function () {
            if (this.disableBall && this.disableBall._killed) {
                this.isOn && this.setCurrentAnim("show", true, "on", true);
                this.disableBall = null
            }
            if (this.disableTimer > 0) {
                this.disableTimer = this.disableTimer - ig.system.tick;
                if (this.disableTimer <= 0) {
                    this.isOn && this.setCurrentAnim("show", true, "on", true);
                    this.disableTimer = 0
                }
            }
            this.parent()
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            if (active != this.isOn) {
                this.isOn = active;
                this.fx.sheet.spawnOnTarget("appear", this);
                this.setCurrentAnim(this.isOn ? "show" : "hide", true, this.isOn ? "on" : "off", true)
            }
        },

        ballHit: function (ball) {
            if (!ball.isBall || this.disableBall || ball.attackInfo && ball.attackInfo.hasHint("NO_PUZZLE") || !this.condition.evaluate()) return false;
            this.ballTime && ball && ball.resetTime(this.ballTime / ball.speedFactor);
            this.resetBounce && ball && ball.resetBounceCount();
            if (!this.changerType.onBallTouch(ball, this)) return false;
            this.setCurrentAnim("hide", true, "used", true);
            if (this.changerType.centerBall) {
                var pos = ig.CollTools.getCenterXYAlignedPos(grabPos, ball.coll, this.coll);
                ball.grabPoint(pos)
            }
            ball.addIgnore(this);
            this.changerType.waitForBallKill ? this.disableBall = ball : this.disableTimer = 0.2;
            return false
        }
    });

    sc.BallChangerType = ig.Class.extend({
        icon: 0,
        sphereColor: 0,
        flipX: false,
        flipY: false,
        centerBall: false,
        waitForBallKill: false,
        onBallTouch: function () {}
    });

    sc.BALL_CHANGER_TYPE = {};

    sc.BALL_CHANGER_TYPE.CHANGE_DIR = sc.BallChangerType.extend({
        _wm: new ig.Config({
            attributes: {
                dir: {
                    _type: "Face",
                    _info: "Direction to face",
                    _select: ig.ActorEntity.FACE8
                }
            }
        }),
        dir: Vec2.create(),
        sound: new ig.Sound("media/sound/puzzle/redirect.ogg", 1),

        init: function (settings) {
            this.centerBall = true;
            var face = ig.ActorEntity.FACE8[settings.dir];
            ig.ActorEntity.getFaceVec(face, this.dir);
            switch (face) {
                case ig.ActorEntity.FACE8.NORTH:
                    this.icon = 0;
                    break;
                case ig.ActorEntity.FACE8.EAST:
                    this.icon = 1;
                    break;
                case ig.ActorEntity.FACE8.SOUTH:
                    this.icon = 0;
                    this.flipY = true;
                    break;
                case ig.ActorEntity.FACE8.WEST:
                    this.icon = 1;
                    this.flipX = true;
                    break;
                case ig.ActorEntity.FACE8.NORTH_EAST:
                    this.icon = 2;
                    break;
                case ig.ActorEntity.FACE8.SOUTH_EAST:
                    this.icon = 2;
                    this.flipY = true;
                    break;
                case ig.ActorEntity.FACE8.SOUTH_WEST:
                    this.icon = 2;
                    this.flipX = this.flipY = true;
                    break;
                case ig.ActorEntity.FACE8.NORTH_WEST:
                    this.icon = 2;
                    this.flipX = true
            }
        },

        onBallTouch: function (ball) {
            if (ball.totalTimer < 0.07) return false;
            ig.SoundHelper.playAtEntity(this.sound, ball);
            ball.clearIgnored();
            ball.changeDirection(this.dir);
            return true
        }
    });

    sc.BALL_CHANGER_TYPE.CHANGE_SPEED = sc.BallChangerType.extend({
        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "Relative speed factor",
                    _default: 0.5
                }
            }
        }),
        factor: null,
        waitForBallKill: true,
        sound: {
            speedUp: new ig.Sound("media/sound/puzzle/speed-up.ogg", 1),
            slowDown: new ig.Sound("media/sound/puzzle/slow-down.ogg", 1)
        },

        init: function (settings) {
            this.factor = settings.factor || 0.5;
            this.icon = 3
        },

        onBallTouch: function (ball) {
            var assistFactor = sc.options.get("assist-puzzle-speed");
            if (this.factor > 1) {
                ig.SoundHelper.playAtEntity(this.sound.speedUp, ball);
                assistFactor = 1 / assistFactor
            } else this.factor < 1 && ig.SoundHelper.playAtEntity(this.sound.slowDown, ball);
            ball.resetTime();
            ball.changeSpeed(this.factor * assistFactor, true);
            return true
        }
    });

    sc.BALL_CHANGER_TYPE.RESET_SPEED = sc.BallChangerType.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        factor: null,
        sound: {
            reset: new ig.Sound("media/sound/puzzle/reset.ogg", 1),
            speedUp: new ig.Sound("media/sound/puzzle/speed-up.ogg", 1),
            slowDown: new ig.Sound("media/sound/puzzle/slow-down.ogg", 1)
        },

        init: function () {
            this.icon = 4
        },

        onBallTouch: function (ball) {
            var speedFactor = ball.speedFactor;
            ball.resetSpeed() && (speedFactor > 1 ? ig.SoundHelper.playAtEntity(this.sound.slowDown, ball) : speedFactor < 1 ? ig.SoundHelper.playAtEntity(this.sound.speedUp, ball) : ig.SoundHelper.playAtEntity(this.sound.reset, ball));
            return true
        }
    });

    sc.BALL_CHANGER_TYPE.CHANGE_ELEMENT = sc.BallChangerType.extend({
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element to change to",
                    _select: ["HEAT", "COLD", "SHOCK", "WAVE"]
                }
            }
        }),
        element: null,
        effects: new ig.EffectSheet("puzzle.ball-changer"),
        fxKey: null,

        init: function (settings) {
            this.element = sc.ELEMENT[settings.element];
            switch (this.element) {
                case sc.ELEMENT.HEAT:
                    this.icon = 5;
                    this.sphereColor = 1;
                    this.fxKey = "heatConvert";
                    break;
                case sc.ELEMENT.COLD:
                    this.icon = 6;
                    this.sphereColor = 2;
                    this.fxKey = "coldConvert";
                    break;
                case sc.ELEMENT.SHOCK:
                    this.icon = 7;
                    this.sphereColor = 3;
                    this.fxKey = "shockConvert";
                    break;
                case sc.ELEMENT.WAVE:
                    this.icon = 8;
                    this.sphereColor = 4;
                    this.fxKey = "waveConvert"
            }
        },

        onBallTouch: function (ball, changer) {
            var root = ball.getCombatantRoot();
            if (root.isPlayer) {
                var charged = ball.attackInfo.hasHint("CHARGED");
                if (root = sc.PlayerConfig.getElementBall(root, this.element, charged)) {
                    this.effects.spawnOnTarget(this.fxKey, changer, {
                        align: ig.ENTITY_ALIGN.BOTTOM,
                        offset: {
                            z: 12
                        }
                    });
                    ball.setBallInfo(root.data, true)
                }
            }
            return true
        }
    })
});
ig.baked = !0;