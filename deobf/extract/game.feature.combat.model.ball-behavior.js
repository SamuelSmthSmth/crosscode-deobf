ig.module("game.feature.combat.model.ball-behavior").defines(function() {
    sc.BallBehavior = ig.Class.extend({
        onInit: function() {},
        onUpdate: function() {}
    });
    sc.BALL_BEHAVIOR = {};
    var b = Vec2.create(),
        a = Vec2.create();
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
        init: function(a) {
            this.steerDegree = a.steerDegree || 1;
            this.adjustTime = a.adjustTime || 0
        },
        onUpdate: function(a) {
            var b = a.getTarget();
            b && sc.BallTools.adjustDirection(a, b, a.maxTime - a.timer, this.adjustTime, this.steerDegree)
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
        init: function(a) {
            this.distance = a.distance || 1
        },
        onUpdate: function(a) {
            var b = a.getTarget();
            b && ig.CollTools.getGroundDistance(a.coll,
                b.coll) < this.distance && a.destroy()
        }
    });
    var d = Vec2.create();
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
        init: function(a) {
            this.relWirl = a.relWirl || 0.2;
            this.wirlTime = a.wirlTime || 0.5;
            this.delay = a.delay || 0
        },
        onUpdate: function(a) {
            var b =
                a.maxTime - a.timer;
            if (!(b < this.delay)) {
                var b = b - this.delay,
                    b = Math.sin(Math.PI * 2 * b / this.wirlTime + Math.PI * 0.52) * this.relWirl * ig.system.tick * 60,
                    f = Vec2.assign(d, a.coll.vel);
                Vec2.rotate90CW(f);
                Vec2.mulF(f, b);
                Vec2.add(a.coll.vel, f)
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
        init: function(a) {
            this.speedFactor = a.speedFactor || 0.05;
            this.startWait = a.startWait || 0;
            this.fadeOut = a.fadeOut || 0;
            this.fadeOutVary = a.fadeOutVary || 0;
            this.pause = a.pause || 0;
            this.pauseVary = a.pauseVary || 0;
            this.fadeIn = a.fadeIn || 0
        },
        onInit: function(a) {
            var b = Math.random();
            a.behaviorData.fadeOutTime = this.fadeOut + (0.5 - b) * 2 * this.fadeOutVary;
            a.behaviorData.pauseTime = this.pause + (0.5 - b) * 2 * this.pauseVary
        },
        onUpdate: function(a) {
            var b = a.behaviorData.fadeOutTime,
                d = a.behaviorData.pauseTime,
                g = a.maxTime - a.timer,
                g = g - this.startWait,
                h = 1;
            g >= 0 && (g < b ? h = 1 - g / b : g < b + d ? h = 0 : g < b + d + this.fadeIn &&
                (h = h * ((g - d - b) / this.fadeIn)));
            Vec2.length(a.coll.vel, a.speed * (h + (1 - h) * this.speedFactor))
        }
    });
    sc.BallTools = {};
    sc.BallTools.adjustDirection = function(c, d, f, g, h) {
        f = f < g ? h * f / g : h;
        d = d.getCenter(b);
        g = c.getCenter(a);
        d = Vec2.sub(d, g);
        g = Vec2.length(c.coll.vel);
        Vec2.rotateToward(c.coll.vel, d, Math.PI * 2 * f * ig.system.tick);
        Vec2.length(c.coll.vel, g)
    }
});
ig.baked = !0;
