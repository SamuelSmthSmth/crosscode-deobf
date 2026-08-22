/**
 * game.feature.combat.model.ball-behavior
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.ball-behavior")`.
 *
 * Ball steering behaviors: `sc.BallBehavior` base plus the
 * `sc.BALL_BEHAVIOR.*` variants (FOLLOW_TARGET, CLOSE_SELF_DESTRUCT,
 * WIRL_SIDEWAYS, SLOW_DOWN) and `sc.BallTools.adjustDirection`, which steers
 * a ball toward its target.
 */
ig.module("game.feature.combat.model.ball-behavior")
    .defines(function () {

    sc.BallBehavior = ig.Class.extend({
        onInit: function () {},
        onUpdate: function () {}
    });

    sc.BALL_BEHAVIOR = {};

    var targetPosScratch = Vec2.create(),
        selfPosScratch = Vec2.create();

    sc.BALL_BEHAVIOR.FOLLOW_TARGET = sc.BallBehavior.extend({
        steerDegree: 0,
        adjustTime: 0,

        _wm: new ig.Config({
            attributes: {
                steerDegree: {
                    _type: "Number",
                    _info: "How much does the entity steer in per second? 0 = not at all, 1 = a full circle"
                },
                adjustTime: {
                    _type: "Number",
                    _info: "steerDegree is linearly scaled from 0 to max during adjustTime at beginning"
                }
            }
        }),

        init: function (settings) {
            this.steerDegree = settings.steerDegree || 1;
            this.adjustTime = settings.adjustTime || 0
        },

        onUpdate: function (ball) {
            var target = ball.getTarget();
            target && sc.BallTools.adjustDirection(ball, target, ball.maxTime - ball.timer, this.adjustTime, this.steerDegree)
        }
    });

    sc.BALL_BEHAVIOR.CLOSE_SELF_DESTRUCT = sc.BallBehavior.extend({
        distance: 0,

        _wm: new ig.Config({
            attributes: {
                distance: {
                    _type: "Number",
                    _info: "Min Distance to target when to self destruct"
                }
            }
        }),

        init: function (settings) {
            this.distance = settings.distance || 1
        },

        onUpdate: function (ball) {
            var target = ball.getTarget();
            target && ig.CollTools.getGroundDistance(ball.coll, target.coll) < this.distance && ball.destroy()
        }
    });

    var sideVelScratch = Vec2.create();

    sc.BALL_BEHAVIOR.WIRL_SIDEWAYS = sc.BallBehavior.extend({
        relWirl: 0.2,
        wirlTime: 0.5,
        delay: 0,

        _wm: new ig.Config({
            attributes: {
                relWirl: {
                    _type: "Number",
                    _info: "How much to wirl sideways",
                    _default: 0.2
                },
                wirlTime: {
                    _type: "Number",
                    _info: "How long one whirling takes",
                    _default: 0.5
                },
                delay: {
                    _type: "Number",
                    _info: "Delay before wirling starts",
                    _default: 0
                }
            }
        }),

        init: function (settings) {
            this.relWirl = settings.relWirl || 0.2;
            this.wirlTime = settings.wirlTime || 0.5;
            this.delay = settings.delay || 0
        },

        onUpdate: function (ball) {
            var time = ball.maxTime - ball.timer;
            if (!(time < this.delay)) {
                var lateral = time - this.delay;
                lateral = Math.sin(Math.PI * 2 * lateral / this.wirlTime + Math.PI * 0.52) * this.relWirl * ig.system.tick * 60;
                var sideVel = Vec2.assign(sideVelScratch, ball.coll.vel);
                Vec2.rotate90CW(sideVel);
                Vec2.mulF(sideVel, lateral);
                Vec2.add(ball.coll.vel, sideVel)
            }
        }
    });

    sc.BALL_BEHAVIOR.SLOW_DOWN = sc.BallBehavior.extend({
        speedFactor: 0,
        startWait: 0,
        fadeOut: 0,
        fadeOutVary: 0,
        pause: 0,
        fadeIn: 0,

        _wm: new ig.Config({
            attributes: {
                speedFactor: {
                    _type: "Number",
                    _info: "How much to slowdown",
                    _default: 0.05
                },
                startWait: {
                    _type: "Number",
                    _info: "How long to wait at before slowdown",
                    _default: 0
                },
                fadeOut: {
                    _type: "Number",
                    _info: "How quickly speed will be faded out.",
                    _default: 0
                },
                fadeOutVary: {
                    _type: "Number",
                    _info: "Variation added to fadeOut. Total = fadeOut +- fadeOutVary",
                    _default: 0
                },
                pause: {
                    _type: "Number",
                    _info: "How long slow down stays after fadeOut",
                    _default: 0
                },
                pauseVary: {
                    _type: "Number",
                    _info: "Variation to pause. Total = pause +- pauseVary",
                    _default: 0
                },
                fadeIn: {
                    _type: "Number",
                    _info: "fadeIn time after slowdown.",
                    _default: 0
                }
            }
        }),

        init: function (settings) {
            this.speedFactor = settings.speedFactor || 0.05;
            this.startWait = settings.startWait || 0;
            this.fadeOut = settings.fadeOut || 0;
            this.fadeOutVary = settings.fadeOutVary || 0;
            this.pause = settings.pause || 0;
            this.pauseVary = settings.pauseVary || 0;
            this.fadeIn = settings.fadeIn || 0
        },

        onInit: function (ball) {
            var random = Math.random();
            ball.behaviorData.fadeOutTime = this.fadeOut + (0.5 - random) * 2 * this.fadeOutVary;
            ball.behaviorData.pauseTime = this.pause + (0.5 - random) * 2 * this.pauseVary
        },

        onUpdate: function (ball) {
            var fadeOutTime = ball.behaviorData.fadeOutTime,
                pauseTime = ball.behaviorData.pauseTime,
                elapsed = ball.maxTime - ball.timer,
                speedScale = 1;
            elapsed = elapsed - this.startWait;
            elapsed >= 0 && (elapsed < fadeOutTime ? speedScale = 1 - elapsed / fadeOutTime : elapsed < fadeOutTime + pauseTime ? speedScale = 0 : elapsed < fadeOutTime + pauseTime + this.fadeIn && (speedScale = speedScale * ((elapsed - pauseTime - fadeOutTime) / this.fadeIn)));
            Vec2.length(ball.coll.vel, ball.speed * (speedScale + (1 - speedScale) * this.speedFactor))
        }
    });

    sc.BallTools = {};

    sc.BallTools.adjustDirection = function (ball, target, remainingTime, adjustTime, steerDegree) {
        var steer = remainingTime < adjustTime ? steerDegree * remainingTime / adjustTime : steerDegree;
        var targetPos = target.getCenter(targetPosScratch);
        var selfPos = ball.getCenter(selfPosScratch);
        var direction = Vec2.sub(targetPos, selfPos);
        var speed = Vec2.length(ball.coll.vel);
        Vec2.rotateToward(ball.coll.vel, direction, Math.PI * 2 * steer * ig.system.tick);
        Vec2.length(ball.coll.vel, speed)
    }
});
ig.baked = !0;
