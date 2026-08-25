ig.module("impact.feature.camera.camera").requires("impact.base.event", "impact.base.game").defines(function() {
    function b(a, b, c) {
        if (a._zSlow || b) {
            a._zSlow = true;
            b = c - a._currentZ;
            if (Math.abs(b) <= 1) {
                a._zSlow = false;
                a._currentZ = c
            } else a._currentZ = a._currentZ + b * ig.system.actualTick * 7
        } else a._currentZ = c
    }
    var a = Vec2.create(),
        d = Vec2.create(),
        c = Vec2.create();
    ig.Camera = ig.GameAddon.extend({
        targets: [],
        namedTargets: {},
        _currentPos: Vec2.create(),
        _currentZ: 0,
        _currentZoom: 1,
        _currentZoomPos: Vec2.create(),
        _zSlow: false,
        _lastPos: Vec2.create(),
        _lastZoom: 1,
        _lastZoomPos: Vec2.create(),
        _duration: 0,
        _time: 0,
        _transitionFunction: null,
        _cameraInBounds: false,
        init: function() {
            this.parent("Camera")
        },
        postUpdateOrder: 100,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused) {
                for (var b = this.targets.length; b--;) this.targets[b].update();
                this._time = this._time + ig.system.actualTick;
                var f;
                if (this._time < this._duration) {
                    f = this._time / this._duration;
                    f = this._transitionFunction.get(f)
                }
                this._currentZoom = this._getNewZoom();
                if (this._time < this._duration) this._currentZoom =
                    this._lastZoom + (this._currentZoom - this._lastZoom) * f;
                ig.system.setZoom(this._currentZoom);
                b = this._getNewPos(a, d, c);
                if (this._time >= this._duration) {
                    Vec2.assign(this._currentPos, b);
                    Vec2.assign(this._currentZoomPos, c)
                } else {
                    Vec2.lerp(this._lastPos, b, f, this._currentPos);
                    Vec2.lerp(this._lastPos, d, f, d);
                    Vec2.lerp(this._lastZoomPos, c, f, this._currentZoomPos);
                    this._cameraInBounds && this._limitPos(this._currentPos, this._currentZoomPos, true)
                }
                ig.game.screen.x = this._currentPos.x - ig.system.width / 2;
                ig.game.screen.y =
                    this._currentPos.y - ig.system.height / 2;
                ig.game.soundPos.x = d.x;
                ig.game.soundPos.y = d.y;
                ig.system.setZoomFocus(this._currentZoomPos.x - ig.game.screen.x, this._currentZoomPos.y - ig.game.screen.y)
            }
        },
        levelLoadStartOrder: 100,
        onLevelLoadStart: function(a) {
            this._cameraInBounds = a.attributes && a.attributes.cameraInBounds;
            for (var b in this.namedTargets) this.removeTarget(this.namedTargets[b], 0);
            this.namedTargets = {}
        },
        pushTarget: function(a, b, c, d) {
            if (d) {
                this.namedTargets[d] && this.removeTarget(this.namedTargets[d], "IMMEDIATELY");
                this.namedTargets[d] = a
            }
            this._saveLastPos();
            this.targets.push(a);
            a.target.start();
            this._duration = this._getDuration(b);
            this._transitionFunction = c || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0;
            this._duration || this._applyFinalState()
        },
        removeNamedTarget: function(a, b, c) {
            var d = this.namedTargets[a];
            if (d) {
                delete this.namedTargets[a];
                this.removeTarget(d, b, c)
            }
        },
        removeTarget: function(a, b, c) {
            a = this.targets.indexOf(a);
            a != -1 && (a == this.targets.length - 1 ? this.popTarget(b, c) : this.targets.splice(a, 1))
        },
        popTarget: function(a,
            b) {
            this._saveLastPos();
            this.targets.pop();
            this._duration = this._getDuration(a);
            this._transitionFunction = b || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0;
            this._duration || this._applyFinalState()
        },
        replaceTarget: function(a, b, c, d) {
            a = this.targets.indexOf(a);
            if (a == -1) return this.pushTarget(b, c, d);
            this.targets.splice(a, 1, b);
            this.isActiveTarget(b) && this.retarget(c, d)
        },
        getTargetCount: function() {
            return this.targets.length
        },
        isTargetReached: function() {
            return this._time >= this._duration
        },
        retarget: function(a, b) {
            this._saveLastPos();
            this._duration = this._getDuration(a);
            this._transitionFunction = b || KEY_SPLINES.EASE_IN_OUT;
            this._time = 0
        },
        isActiveTarget: function(a) {
            return this.targets[this.targets.length - 1] == a
        },
        getTimeUntilTargetReached: function() {
            return this._time >= this._duration ? 0 : this._duration - this._time
        },
        _limitPos: function(a, b, c) {
            var d = ig.system.width,
                i = ig.system.height,
                j = a.x.limit(ig.system.width / 2, ig.game.size.x - ig.system.width / 2),
                k = a.y.limit(ig.system.height / 2, ig.game.size.y - ig.system.height / 2);
            if (c) {
                var c = (b.x - (j - d / 2)) / d,
                    l = (b.y - (k - i / 2)) / i,
                    d = d - d / ig.system.zoom,
                    i = i - i / ig.system.zoom,
                    o = 0,
                    m = 0;
                if (j > a.x) var n = j - a.x - d * (0.5 - c),
                    o = -Math.min(d * c, n);
                else if (j < a.x) {
                    n = a.x - j - d * (c - 0.5);
                    o = Math.min(d * (1 - c), n)
                }
                if (k > a.y) {
                    n = k - a.y - i * (0.5 - l);
                    m = -Math.min(i * l, n)
                } else if (k < a.y) {
                    n = a.y - k - i * (l - 0.5);
                    m = Math.min(i * (1 - l), n)
                }
                a.y = k + m;
                a.x = j + o;
                b.x = b.x + o;
                b.y = b.y + m
            } else {
                a.x = j;
                a.y = k
            }
        },
        _applyFinalState: function() {
            this._currentZoom = this._getNewZoom();
            ig.system.setZoom(this._currentZoom);
            var b = this._getNewPos(a, null, c);
            Vec2.assign(this._currentPos, b);
            Vec2.assign(this._currentZoomPos,
                c)
        },
        _saveLastPos: function() {
            this._lastZoom = this._currentZoom;
            Vec2.assign(this._lastPos, this._currentPos);
            Vec2.assign(this._lastZoomPos, this._currentZoomPos);
            this._resetLastZoomPos = true
        },
        _getNewZoom: function() {
            return this.targets.length > 0 ? this.targets[this.targets.length - 1].getZoom() : 1
        },
        _getNewPos: function(a, b, c) {
            var d = false;
            if (this.targets.length > 0) {
                d = this.targets[this.targets.length - 1];
                d.target.getPos(a);
                if (c) {
                    c.x = a.x + Math.round(d._currentZoomOffset.x);
                    c.y = a.y + Math.round(d._currentZoomOffset.y)
                }
                a.x =
                    a.x + Math.round(d._currentOffset.x);
                a.y = a.y + Math.round(d._currentOffset.y);
                d = d.keepZoomFocusAligned || false
            }
            if (b) {
                b.x = a.x;
                b.y = a.y
            }
            if (this._cameraInBounds) {
                b = d ? 1 : ig.system.zoom;
                a.x = a.x.limit(ig.system.width / 2 / b, ig.game.size.x - ig.system.width / 2 / b);
                a.y = a.y.limit(ig.system.height / 2 / b, ig.game.size.y - ig.system.height / 2 / b)
            }!d && c && Vec2.assign(c, a);
            return a
        },
        _getDuration: function(b) {
            if (typeof b == "string") {
                var f = Vec2.length(Vec2.sub(this._getNewPos(a, d, c), this._lastPos)) + 32,
                    f = Math.sqrt(f);
                if (ig.Camera.SPEED_OPTIONS[b]) f =
                    f * ig.Camera.SPEED_OPTIONS[b];
                else throw Error("Unknown Camera Speed Type: " + b);
                return f
            }
            return b || 0
        }
    });
    ig.addGameAddon(function() {
        return ig.camera = new ig.Camera
    });
    ig.Camera.SPEED_OPTIONS = {
        NORMAL: 0.1,
        FAST: 0.05,
        FASTER: 0.0375,
        FASTEST: 0.025,
        FASTESTEST: 0.0175,
        SLOW: 0.15,
        SLOWER: 0.2,
        SLOWEST: 0.3,
        SLOWESTEST: 0.5,
        SLOWEST_DREAM: 1,
        IMMEDIATELY: 1E-6
    };
    ig.Camera.PosTarget = ig.Class.extend({
        pos: null,
        init: function(a) {
            this.pos = a
        },
        start: function() {},
        getPos: function(a) {
            Vec2.assign(a, this.pos)
        }
    });
    ig.Camera.EntityTarget = ig.Class.extend({
        entity: null,
        _zSlow: false,
        _currentZ: 0,
        _lockZ: false,
        init: function(a, b) {
            this.entity = a;
            this._lockZ = b || false
        },
        start: function() {
            this._currentZ = this.entity.coll.pos.z
        },
        getPos: function(a) {
            this._lockZ || b(this, this.entity && (this.entity.jumping || this.entity.coll._collData && this.entity.coll._collData.zPush), this.entity.coll.pos.z + (this.entity.cameraZFocus || 0));
            a.x = Math.round(this.entity.coll.pos.x) + this.entity.coll.size.x / 2;
            a.y = Math.round(this.entity.coll.pos.y - this._currentZ) + this.entity.coll.size.y / 2 - Constants.BALL_HEIGHT
        }
    });
    ig.Camera.MultiEntityTarget = ig.Class.extend({
        entities: null,
        _zSlow: false,
        _prevFloat: false,
        _currentZ: 0,
        keepFirstTarget: false,
        init: function(a, b) {
            this.entities = a;
            this.keepFirstTarget = b || false
        },
        start: function() {
            this._currentZ = this._getEntitiesZ()
        },
        _getEntitiesZ: function() {
            return this.entities[0].coll.pos.z + (this.entities[0].cameraZFocus || 0)
        },
        getPos: function(a) {
            for (var c = this.entities, d = c.length, h = false, i = 0, j = 0, k = this._getEntitiesZ(), l = 0; d--;) {
                var o = c[d],
                    m = o.coll,
                    h = h || o && (o.jumping || o.coll._collData && o.coll._collData.zPush),
                    i = i + (m.pos.x + m.size.x / 2),
                    j = j + (m.pos.y + m.size.y / 2);
                if (m.float.height) {
                    h = true;
                    l = l + (m.pos.z - k);
                    this._prevFloat = true
                }
            }
            if (!h && this._prevFloat) {
                h = true;
                this._prevFloat = false
            }
            l = l / c.length;
            i = i / c.length;
            j = j / c.length;
            b(this, h, k + l);
            if (this.keepFirstTarget) {
                d = c[0].coll;
                c = d.pos.x + d.size.x / 2;
                d = d.pos.y + d.size.y / 2;
                i < c - 200 ? i = c - 200 : i > c + 200 && (i = c + 200);
                j < d - 100 ? j = d - 100 : j > d + 100 && (j = d + 100)
            }
            j = j - this._currentZ;
            a.x = Math.round(i);
            a.y = Math.round(j) - Constants.BALL_HEIGHT
        }
    });
    ig.Camera.TargetHandle = ig.Class.extend({
        target: null,
        offset: null,
        zoomOffset: null,
        keepZoomFocusAligned: false,
        _offsetDuration: 0,
        _offsetTime: 0,
        _currentOffset: Vec2.create(),
        _currentZoomOffset: Vec2.create(),
        _lastOffset: Vec2.create(),
        _lastZoomOffset: Vec2.create(),
        zoomTimer: null,
        oldZoom: 1,
        targetZoom: 1,
        keyspline: null,
        lockZ: false,
        init: function(a, b, c) {
            this.target = a;
            this.offset = Vec2.createC(b, c);
            this.zoomOffset = Vec2.createC(b, c);
            this.zoomTimer = new ig.WeightTimer(true);
            Vec2.assign(this._currentOffset, this.offset);
            Vec2.assign(this._lastOffset, this.offset);
            Vec2.assign(this._currentZoomOffset,
                this.zoomOffset);
            Vec2.assign(this._lastZoomOffset, this.zoomOffset)
        },
        setOffset: function(a, b, c, d, i, j) {
            this.offset.x = a;
            this.offset.y = b;
            this.zoomOffset.x = d === void 0 ? a : d;
            this.zoomOffset.y = i === void 0 ? b : i;
            this._offsetDuration = c || 0;
            this._offsetTime = 0;
            if (this._offsetDuration) {
                Vec2.assign(this._lastOffset, this._currentOffset);
                Vec2.assign(this._lastZoomOffset, this._currentZoomOffset)
            }
            if (j) {
                Vec2.assign(this._currentOffset, this.offset);
                Vec2.assign(this._currentZoomOffset, this.zoomOffset)
            }
        },
        setZoomFocus: function() {},
        setZoom: function(a, b, c) {
            this.oldZoom = this.getZoom();
            this.targetZoom = a;
            this.keyspline = c || null;
            this.zoomTimer.set(b, ig.TIMER_MODE.ONCE)
        },
        update: function() {
            this.zoomTimer.tick();
            this._offsetTime = this._offsetTime + ig.system.actualTick;
            if (ig.game.firstUpdateLoop)
                if (this._offsetTime >= this._offsetDuration) {
                    Vec2.mulF(this._currentOffset, 23);
                    Vec2.add(this._currentOffset, this.offset);
                    Vec2.mulF(this._currentOffset, 1 / 24);
                    Vec2.mulF(this._currentZoomOffset, 23);
                    Vec2.add(this._currentZoomOffset, this.zoomOffset);
                    Vec2.mulF(this._currentZoomOffset,
                        1 / 24)
                } else {
                    var a = Math.min(1, this._offsetTime / this._offsetDuration),
                        a = KEY_SPLINES.EASE_IN_OUT.get(a);
                    Vec2.lerp(this._lastOffset, this.offset, a, this._currentOffset);
                    Vec2.lerp(this._lastZoomOffset, this.zoomOffset, a, this._currentZoomOffset)
                }
        },
        getZoom: function() {
            var a = this.zoomTimer.get();
            this.keyspline && a < 1 && (a = this.keyspline.get(a));
            return this.oldZoom + (this.targetZoom - this.oldZoom) * a
        },
        onEventEndDetach: function() {
            ig.camera.removeTarget(this, "FAST")
        },
        onActionEndDetach: function() {
            ig.camera.removeTarget(this,
                "FAST")
        }
    })
});
ig.baked = !0;
