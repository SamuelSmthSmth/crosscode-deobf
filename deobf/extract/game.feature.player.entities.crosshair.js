ig.module("game.feature.player.entities.crosshair").requires("impact.base.entity").defines(function() {
    var b = Vec2.create();
    Vec2.create();
    var a = Vec3.create(),
        d = Vec2.create(),
        c = Vec2.create(),
        e = Vec2.create(),
        f = Vec2.create(),
        g = Vec2.create(),
        h = Vec3.create(),
        i = Vec3.create(),
        j = {},
        k = {};
    ig.ENTITY.Crosshair = ig.Entity.extend({
        offset: {
            x: 8,
            y: 8,
            z: 0
        },
        tileSheet: new ig.TileSheet("media/entity/map-gui/crosshair.png", 32, 32),
        thrower: null,
        controller: null,
        rangeStart: Math.PI / 2,
        aimTime: 0.5,
        maxAngleMove: Math.PI / 128,
        chargeActive: false,
        rangeCurrent: 0,
        currentCharge: 0,
        speedFactor: 1,
        baseSpeedFactor: 1,
        doBlink: true,
        gamepadMode: false,
        active: false,
        special: false,
        circleGlow: 0,
        _lastDir: Vec2.createC(0, 1),
        _aimDir: Vec2.createC(0, 1),
        _dots: [],
        _currentDot: 0,
        sounds: {
            charged: new ig.Sound("media/sound/move/targeting-charged.mp3", 0.4)
        },
        soundTimer: 0,
        dirHelperDrawInfo: [{
            x: 0,
            y: -100,
            tile: 3,
            flipX: 0,
            flipY: 0
        }, {
            x: 70,
            y: -70,
            tile: 4,
            flipX: 0,
            flipY: 0
        }, {
            x: 100,
            y: 0,
            tile: 5,
            flipX: 0,
            flipY: 0
        }, {
            x: 70,
            y: 70,
            tile: 4,
            flipX: 0,
            flipY: 1
        }, {
            x: 0,
            y: 100,
            tile: 3,
            flipX: 0,
            flipY: 1
        }, {
            x: -70,
            y: 70,
            tile: 4,
            flipX: 1,
            flipY: 1
        }, {
            x: -100,
            y: 0,
            tile: 5,
            flipX: 1,
            flipY: 0
        }, {
            x: -70,
            y: -70,
            tile: 4,
            flipX: 1,
            flipY: 0
        }],
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.setSize(0, 0, 0);
            this.currentCharge = this.aimTime;
            Vec2.assignC(this.coll.pos, ig.system.width / 2, ig.system.height / 2);
            this.thrower = d.thrower;
            this.controller = d.controller;
            this.coll.time.parent = this.thrower.coll;
            for (a = 0; a < 12; a++) this._dots.push(ig.game.spawnEntity(ig.ENTITY.CrosshairDot, -1E3,
                -1E3, 0))
        },
        initSprites: function() {
            this.setSpriteCount(1, true)
        },
        getDir: function(a) {
            return Vec2.assign(a, this._aimDir)
        },
        getThrowDir: function(a) {
            var a = Vec2.assign(a, this._aimDir),
                b = this.rangeCurrent * (0.5 - Math.random());
            Vec2.rotate(a, b);
            return a
        },
        isThrowCharged: function() {
            return window.IG_GAME_DEBUG && ig.game.supercharge || this.special ? true : this.chargeActive && !this.rangeCurrent && this.controller.isAiming(this) && this.currentCharge > this.aimTime
        },
        setThrown: function() {
            this.doBlink = true;
            return this.currentCharge =
                0
        },
        setBaseSpeedFactor: function(a) {
            this.baseSpeedFactor = a
        },
        setSpeedFactor: function(a) {
            this.speedFactor = a
        },
        setCircleGlow: function() {
            this.circleGlow = 0.2
        },
        reducePrecision: function(a) {
            var b = this.thrower.params ? this.thrower.params.getModifier("AIM_STABILITY") : 0,
                a = a * Math.max(0, 1 - b);
            this.rangeCurrent = Math.min(this.rangeStart, this.rangeCurrent + this.rangeStart * a);
            this.doBlink = this.doBlink || this.rangeCurrent > this.rangeStart / 2 * this.speedFactor * this.baseSpeedFactor
        },
        setSpecial: function(a) {
            this.special = a
        },
        setActive: function(a) {
            if (this.active !=
                a) {
                this.active = a;
                this.controller.onActiveChange(this);
                if (this.active) this.rangeCurrent = this.rangeStart * 0.75;
                else {
                    this.doBlink = true;
                    a = sc.model.currentState == sc.GAME_MODEL_STATE.CUTSCENE ? 2 : 1;
                    this.thrower.cameraHandle && this.thrower.cameraHandle.setOffset(0, 0, a)
                }
            }
        },
        deferredUpdate: function() {
            this.controller.updatePos(this);
            var a = Vec2.flip(Vec2.sub(this._getThrowerPos(e), this.coll.pos));
            if (Vec2.isZero(a)) a.y = 1;
            var b = Vec2.angle(a, this._lastDir),
                c = this.maxAngleMove;
            if (!this.special && b > 2 * c) {
                c = this.thrower.params ?
                    this.thrower.params.getModifier("AIM_STABILITY") : 0;
                this.rangeCurrent = this.rangeCurrent + b / 2 * Math.max(0, 1 - c);
                if (this.rangeCurrent > this.rangeStart) this.rangeCurrent = this.rangeStart;
                this.doBlink = this.doBlink || this.rangeCurrent > this.rangeStart / 2 * this.speedFactor * this.baseSpeedFactor
            }
            Vec2.assign(this._lastDir, a);
            Vec2.assign(this._aimDir, a);
            if (this.circleGlow > 0) this.circleGlow = this.circleGlow - ig.system.actualTick;
            if (!this.active) this.currentCharge = this.aimTime;
            if (!this.active || ig.system.timeFactor <= 0 && !sc.autoControl.isActive())
                for (a =
                    0; a < this._dots.length; ++a) {
                    this._dots[a].setCurrentAnim("normal", true);
                    this._dots[a].setPos(-1E3, -1E3)
                } else {
                    if (this.special) this.currentCharge = this.aimTime;
                    this.currentCharge = this.currentCharge + ig.system.tick;
                    if (this.rangeCurrent > 0) {
                        if (this.special) this.rangeCurrent = this.rangeCurrent - ig.system.actualTick / this.aimTime * this.rangeStart * 2;
                        else {
                            c = this.speedFactor * this.baseSpeedFactor;
                            this.rangeCurrent = this.rangeCurrent - ig.system.tick / this.aimTime * this.rangeStart * c
                        }
                        if (this.rangeCurrent < 0) {
                            this.rangeCurrent =
                                0;
                            if (this.currentCharge > this.aimTime) this.currentCharge = this.aimTime
                        }
                    }
                    this.isThrowCharged();
                    b = this.controller.gamepadMode ? Vec2.assign(f, a) : Vec2.assignC(f, this.coll.pos.x - ig.game.screen.x - ig.system.width / 2, this.coll.pos.y - ig.game.screen.y - ig.system.height / 2);
                    c = this.controller.getAimingDistance(a, b);
                    if (this.controller.isAiming(this) && this.thrower.cameraHandle) {
                        c = ((c - 104) / 40).limit(0, 1);
                        c = c * c;
                        this.thrower.cameraTargets.length > 0 && (c = c * 0.5);
                        if (c > 0) {
                            Vec2.length(b, 72 * c);
                            Vec2.distance(b, this.thrower.cameraHandle.offset) >
                                2 && this.thrower.cameraHandle.setOffset(b.x, b.y, 0, this._aimDir.x, this._aimDir.y)
                        } else this.thrower.cameraHandle.setOffset(0, 0, 0, this._aimDir.x, this._aimDir.y)
                    }
                    b = this.rangeCurrent / 2;
                    if (this.isThrowCharged()) {
                        if (this.soundTimer <= 0) this.soundTimer = 0.1;
                        this.soundTimer = this.soundTimer - ig.system.tick
                    } else this.soundTimer = 0;
                    c = Vec2.assign(h, this.thrower.coll.pos);
                    c.x = c.x + (this.thrower.coll.size.x / 2 - Constants.BALL_SIZE / 2);
                    c.y = c.y + (this.thrower.coll.size.y / 2 - Constants.BALL_SIZE / 2);
                    c.z = this.thrower.coll.pos.z;
                    if (this.thrower.maxJumpHeight !== void 0 && this.thrower.maxJumpHeight >= 0) c.z = Math.min(this.thrower.coll.pos.z, this.thrower.maxJumpHeight);
                    c.z = c.z + Constants.BALL_HEIGHT;
                    var d;
                    if (!b && this.isThrowCharged()) {
                        d = this.doBlink ? "chargedBlink" : "charged";
                        if (this.doBlink) {
                            this.doBlink = false;
                            this.sounds.charged.play()
                        }
                    } else d = "normal";
                    var g = this.special || this.controller.isAiming(this) ? 1 : 0.4,
                        k = this.rangeCurrent || !this.chargeActive ? 0 : Math.floor((this.currentCharge - 2 * this.aimTime) / 0.05).limit(0, 10),
                        j = b ? 6 : 12;
                    this._currentDot =
                        0;
                    Vec2.rotate(a, b);
                    var q = Vec3.assignC(i, Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT);
                    this._updateCrossHair(c, a, q, g, d, k, j, 3);
                    if (b) {
                        Vec2.rotate(a, -2 * b);
                        this._updateCrossHair(c, a, q, g, d, k, j, 3)
                    }
                    for (; this._currentDot < this._dots.length; ++this._currentDot) {
                        this._dots[this._currentDot].setCurrentAnim("normal", true);
                        this._dots[this._currentDot].setPos(-1E3, -1E3)
                    }
                }
        },
        updateSprites: function() {
            var a = this.sprites[0];
            if (!this.active || ig.system.timeFactor <= 0 && !sc.autoControl.isActive())
                if (this.circleGlow >
                    0) {
                    var b = this._getThrowerPos(e);
                    b.x = b.x + -sc.ATTACK_INPUT_DISTANCE;
                    b.y = b.y + +sc.ATTACK_INPUT_DISTANCE;
                    a.renderMode = "lighter";
                    a.setPos(b.x, b.y, 0);
                    a.setSize(sc.ATTACK_INPUT_DISTANCE * 2, 0, sc.ATTACK_INPUT_DISTANCE * 2, 0);
                    a.setImageSrc(this.tileSheet.image, 0, 64);
                    a.setAlpha(this.circleGlow / 0.2)
                } else a.setAlpha(0);
            else {
                var c = this.isThrowCharged(),
                    b = this.controller.isAiming() ? 1 : 0.4,
                    d = 0;
                this.rangeCurrent == 0 && c && (d = 4 + Math.floor(Math.min(2, (this.currentCharge - this.aimTime) / 0.1)));
                var c = this.coll.pos.x - 16,
                    f = this.coll.pos.y -
                    this.coll.pos.z + 16;
                a.renderMode = "source-over";
                a.setPos(c, f, 0);
                a.setSize(32, 0, 32, 0);
                d = this.tileSheet.getTileSrc(j, d);
                a.setImageSrc(this.tileSheet.image, d.x, d.y);
                a.setAlpha(b)
            }
        },
        onKill: function(a) {
            for (var b = 0; b < this._dots.length; b++) this._dots[b].kill();
            this.parent(a)
        },
        _updateCrossHair: function(b, e, g, h, i, j, t, q, s) {
            var v = 12;
            Vec2.length(e, 24 * v);
            var y = this.isThrowCharged(),
                u = ig.game.physics.initTraceResult(k),
                z = [];
            ig.game.physics._trackEntityTouch = true;
            var D = ig.game.trace(u, b.x, b.y, b.z, e.x, e.y, g.x, g.y,
                    g.z, ig.COLLTYPE.PROJECTILE, null, z),
                C = ig.game.physics._trackEntityTouch = false,
                A = null,
                B = -1;
            Vec2.assign(a, e);
            Vec2.mulF(a, u.dist);
            Vec2.add(a, b);
            a.z = b.z;
            for (var w = 0; w < z.length; ++w) {
                var x = z[w].entity;
                if (x != s) {
                    var E = x.ballDestroyer || x.isBallDestroyer && x.isBallDestroyer(a, u, y),
                        G = !this.rangeCurrent && x.isBallAdjust && x.isBallAdjust(y),
                        J = false;
                    if (E || G)
                        if (x.coll.type == ig.COLLTYPE.BLOCK) J = B == -1;
                        else {
                            var I = x.getCenter(d),
                                K = Vec2.distance(b, I);
                            if (B == -1 || K < B) {
                                B = K;
                                Vec2.assign(c, I);
                                J = true
                            }
                        } if (J) {
                        C = false;
                        A = null;
                        E ? C = true :
                            G && (A = x)
                    }
                }
            }
            if (B != -1) {
                w = Vec2.sub(c, b);
                u.dist = Vec2.dot(w, e) / Vec2.dot(e, e)
            }
            v = v * Math.max(0, u.dist);
            Vec2.length(e, 24);
            s = false;
            for (w = 1; w < v + 0.8; w++) {
                s = Math.round(b.x) + e.x * (w > v - 0.2 ? v - 0.1 : w);
                y = Math.round(b.y) + e.y * (w > v - 0.2 ? v - 0.1 : w);
                if (this._dots[this._currentDot]) {
                    this._dots[this._currentDot].setPos(s + g.x / 2 - Constants.BALL_SIZE / 2, y + g.y / 2 - Constants.BALL_SIZE / 2);
                    this._dots[this._currentDot].coll.pos.z = b.z;
                    this._dots[this._currentDot].coll.level = ig.game.getLevelIdx(b.z);
                    this._dots[this._currentDot].setCurrentAnim(i,
                        true, i == "chargedBlink" ? "charged" : null);
                    this._dots[this._currentDot].animState.alpha = h;
                    this._dots[this._currentDot].coll.shadow.size = i == "charged" ? 4 : 0;
                    ++this._currentDot
                } else return;
                s = true;
                if (!--t) return
            }
            if (s || --t)
                if (A || D && !C && j && q) {
                    q = q - 1;
                    Vec2.length(e, 24 * v);
                    Vec2.add(b, e);
                    if (A) {
                        b.x = b.x + g.x / 2;
                        b.y = b.y + g.x / 2;
                        q = A.doBallAdjust(b, e, g, q);
                        b.x = b.x - g.x / 2;
                        b.y = b.y - g.x / 2;
                        j = t
                    } else {
                        v = Vec2.dot(e, u.dir);
                        Vec2.sub(e, Vec2.mulF(u.dir, 2 * v, f));
                        j = Math.min(t, j)
                    }
                    this._updateCrossHair(b, e, g, Math.max(0.25, h * 0.75), i, j, j, q, A)
                }
        },
        _getThrowerPos: function(a) {
            Vec2.assign(a, this.thrower.coll.pos);
            a.x = Math.round(a.x) + this.thrower.coll.size.x / 2;
            a.y = Math.round(a.y - this.thrower.coll.pos.z) + this.thrower.coll.size.y / 2 - Constants.BALL_HEIGHT - Constants.BALL_SIZE / 2;
            return a
        }
    });
    ig.ENTITY.CrosshairDot = ig.AnimatedEntity.extend({
        blocks: {},
        tileSheet: new ig.TileSheet("media/entity/map-gui/crosshair.png", 8, 8, 32, 0),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(Constants.BALL_SIZE, Constants.BALL_SIZE,
                Constants.BALL_Z_HEIGHT);
            this.coll.time.globalStatic = true;
            this.initAnimations({
                offset: {
                    x: 0,
                    y: 0,
                    z: (16 - Constants.BALL_SIZE) / 2
                },
                sheet: this.tileSheet,
                SUB: [{
                    name: "normal",
                    time: 1,
                    frames: [0]
                }, {
                    name: "charged",
                    time: 0.07,
                    frames: [1],
                    repeat: false
                }, {
                    name: "chargedBlink",
                    time: 0.07,
                    frames: [2, 3, 1],
                    repeat: false
                }]
            })
        },
        update: function() {
            this.animState.alpha = ig.system.timeFactor <= 0 && !sc.autoControl.isActive() ? 0 : 1;
            this.parent()
        }
    });
    sc.PlayerCrossHairController = ig.Class.extend({
        gamepadMode: false,
        isAiming: function() {
            return sc.control.aiming()
        },
        getAimingDistance: function(a, b) {
            var c = this.gamepadMode ? a : Vec2.mulC(b, ig.system.height / ig.system.width, 1, g);
            return Vec2.length(c)
        },
        onActiveChange: function(a) {
            if (a.active) this.gamepadMode = sc.control.isRightStickDown()
        },
        updatePos: function(a) {
            if (this.gamepadMode) {
                if (sc.control.isRightStickDown()) {
                    var c = Vec2.flip(Vec2.sub(a._getThrowerPos(e), a.coll.pos)),
                        d = Vec2.assignC(b, sc.control.getAxesValue(ig.AXES.RIGHT_STICK_X) * ig.system.height * 0.6, sc.control.getAxesValue(ig.AXES.RIGHT_STICK_Y) * ig.system.height *
                            0.6);
                    Vec2.lerp(c, d, ig.system.actualTick * 18);
                    a._getThrowerPos(a.coll.pos);
                    a.coll.pos.x = a.coll.pos.x + c.x;
                    a.coll.pos.y = a.coll.pos.y + c.y
                }
            } else ig.system.getMapFromScreenPos(a.coll.pos, sc.control.getMouseX(), sc.control.getMouseY())
        }
    });
    sc.EventCrossHairController = ig.Class.extend({
        targetPos: Vec2.create(),
        gamepadMode: false,
        isAiming: function() {
            return true
        },
        getAimingDistance: function() {
            return 0
        },
        onActiveChange: function() {},
        updatePos: function(a) {
            Vec2.assign(a.coll.pos, this.targetPos)
        }
    })
});
ig.baked = !0;
