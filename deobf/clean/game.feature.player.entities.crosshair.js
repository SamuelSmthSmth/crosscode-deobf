/**
 * game.feature.player.entities.crosshair
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.entities.crosshair")`.
 *
 * `ig.ENTITY.Crosshair`: the aiming reticle for throws — follows the aim
 * direction, grows a precision/reduction range when the aim is moved too
 * fast, draws the ball trajectory preview dots (with bounces and ball
 * adjusters), plays the charged sound, and reads out the throw direction.
 * Plus `ig.ENTITY.CrosshairDot` (one trajectory dot) and the player/event
 * controllers that drive the reticle position.
 */
ig.module("game.feature.player.entities.crosshair")
    .requires("impact.base.entity")
    .defines(function () {

    var stickDir = Vec2.create();
    Vec2.create();
    var tmpVec3 = Vec3.create(),
        centerVec = Vec2.create(),
        hitCenter = Vec2.create(),
        throwerPos = Vec2.create(),
        reflectVec = Vec2.create(),
        scaledVec = Vec2.create(),
        ballPos = Vec3.create(),
        ballSizeVec = Vec3.create(),
        tileSrcScratch = {},
        traceScratch = {};

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.setSize(0, 0, 0);
            this.currentCharge = this.aimTime;
            Vec2.assignC(this.coll.pos, ig.system.width / 2, ig.system.height / 2);
            this.thrower = settings.thrower;
            this.controller = settings.controller;
            this.coll.time.parent = this.thrower.coll;
            for (var index = 0; index < 12; index++) this._dots.push(ig.game.spawnEntity(ig.ENTITY.CrosshairDot, -1E3, -1E3, 0))
        },

        initSprites: function () {
            this.setSpriteCount(1, true)
        },

        getDir: function (outVec) {
            return Vec2.assign(outVec, this._aimDir)
        },

        /** Current aim direction with a random inaccuracy based on the reduction range. */
        getThrowDir: function (outVec) {
            var outVec = Vec2.assign(outVec, this._aimDir),
                randomAngle = this.rangeCurrent * (0.5 - Math.random());
            Vec2.rotate(outVec, randomAngle);
            return outVec
        },

        isThrowCharged: function () {
            return window.IG_GAME_DEBUG && ig.game.supercharge || this.special ? true : this.chargeActive && !this.rangeCurrent && this.controller.isAiming(this) && this.currentCharge > this.aimTime
        },

        setThrown: function () {
            this.doBlink = true;
            return this.currentCharge = 0
        },

        setBaseSpeedFactor: function (factor) {
            this.baseSpeedFactor = factor
        },

        setSpeedFactor: function (factor) {
            this.speedFactor = factor
        },

        setCircleGlow: function () {
            this.circleGlow = 0.2
        },

        /** Add precision loss; reduced by the AIM_STABILITY modifier. */
        reducePrecision: function (amount) {
            var stability = this.thrower.params ? this.thrower.params.getModifier("AIM_STABILITY") : 0,
                amount = amount * Math.max(0, 1 - stability);
            this.rangeCurrent = Math.min(this.rangeStart, this.rangeCurrent + this.rangeStart * amount);
            this.doBlink = this.doBlink || this.rangeCurrent > this.rangeStart / 2 * this.speedFactor * this.baseSpeedFactor
        },

        setSpecial: function (special) {
            this.special = special
        },

        setActive: function (active) {
            if (this.active != active) {
                this.active = active;
                this.controller.onActiveChange(this);
                if (this.active) this.rangeCurrent = this.rangeStart * 0.75;
                else {
                    this.doBlink = true;
                    var cameraZoom = sc.model.currentState == sc.GAME_MODEL_STATE.CUTSCENE ? 2 : 1;
                    this.thrower.cameraHandle && this.thrower.cameraHandle.setOffset(0, 0, cameraZoom)
                }
            }
        },

        /** Update aim direction, range/precision, charge and the trajectory preview dots. */
        deferredUpdate: function () {
            this.controller.updatePos(this);
            var dirToThrower = Vec2.flip(Vec2.sub(this._getThrowerPos(throwerPos), this.coll.pos));
            if (Vec2.isZero(dirToThrower)) dirToThrower.y = 1;
            var angleDiff = Vec2.angle(dirToThrower, this._lastDir),
                maxMove = this.maxAngleMove;
            if (!this.special && angleDiff > 2 * maxMove) {
                var stability = this.thrower.params ? this.thrower.params.getModifier("AIM_STABILITY") : 0;
                this.rangeCurrent = this.rangeCurrent + angleDiff / 2 * Math.max(0, 1 - stability);
                if (this.rangeCurrent > this.rangeStart) this.rangeCurrent = this.rangeStart;
                this.doBlink = this.doBlink || this.rangeCurrent > this.rangeStart / 2 * this.speedFactor * this.baseSpeedFactor
            }
            Vec2.assign(this._lastDir, dirToThrower);
            Vec2.assign(this._aimDir, dirToThrower);
            if (this.circleGlow > 0) this.circleGlow = this.circleGlow - ig.system.actualTick;
            if (!this.active) this.currentCharge = this.aimTime;
            if (!this.active || ig.system.timeFactor <= 0 && !sc.autoControl.isActive())
                for (var index = 0; index < this._dots.length; ++index) {
                    this._dots[index].setCurrentAnim("normal", true);
                    this._dots[index].setPos(-1E3, -1E3)
                } else {
                if (this.special) this.currentCharge = this.aimTime;
                this.currentCharge = this.currentCharge + ig.system.tick;
                if (this.rangeCurrent > 0) {
                    if (this.special) this.rangeCurrent = this.rangeCurrent - ig.system.actualTick / this.aimTime * this.rangeStart * 2;
                    else {
                        var speedFactor = this.speedFactor * this.baseSpeedFactor;
                        this.rangeCurrent = this.rangeCurrent - ig.system.tick / this.aimTime * this.rangeStart * speedFactor
                    }
                    if (this.rangeCurrent < 0) {
                        this.rangeCurrent = 0;
                        if (this.currentCharge > this.aimTime) this.currentCharge = this.aimTime
                    }
                }
                this.isThrowCharged();
                var aimDir = this.controller.gamepadMode ? Vec2.assign(reflectVec, dirToThrower) : Vec2.assignC(reflectVec, this.coll.pos.x - ig.game.screen.x - ig.system.width / 2, this.coll.pos.y - ig.game.screen.y - ig.system.height / 2);
                var aimDistance = this.controller.getAimingDistance(dirToThrower, aimDir);
                if (this.controller.isAiming(this) && this.thrower.cameraHandle) {
                    var cameraOffsetFactor = ((aimDistance - 104) / 40).limit(0, 1);
                    cameraOffsetFactor = cameraOffsetFactor * cameraOffsetFactor;
                    this.thrower.cameraTargets.length > 0 && (cameraOffsetFactor = cameraOffsetFactor * 0.5);
                    if (cameraOffsetFactor > 0) {
                        Vec2.length(aimDir, 72 * cameraOffsetFactor);
                        Vec2.distance(aimDir, this.thrower.cameraHandle.offset) > 2 && this.thrower.cameraHandle.setOffset(aimDir.x, aimDir.y, 0, this._aimDir.x, this._aimDir.y)
                    } else this.thrower.cameraHandle.setOffset(0, 0, 0, this._aimDir.x, this._aimDir.y)
                }
                var halfRange = this.rangeCurrent / 2;
                if (this.isThrowCharged()) {
                    if (this.soundTimer <= 0) this.soundTimer = 0.1;
                    this.soundTimer = this.soundTimer - ig.system.tick
                } else this.soundTimer = 0;
                var throwBallPos = Vec2.assign(ballPos, this.thrower.coll.pos);
                throwBallPos.x = throwBallPos.x + (this.thrower.coll.size.x / 2 - Constants.BALL_SIZE / 2);
                throwBallPos.y = throwBallPos.y + (this.thrower.coll.size.y / 2 - Constants.BALL_SIZE / 2);
                throwBallPos.z = this.thrower.coll.pos.z;
                if (this.thrower.maxJumpHeight !== void 0 && this.thrower.maxJumpHeight >= 0) throwBallPos.z = Math.min(this.thrower.coll.pos.z, this.thrower.maxJumpHeight);
                throwBallPos.z = throwBallPos.z + Constants.BALL_HEIGHT;
                var animKey;
                if (!halfRange && this.isThrowCharged()) {
                    animKey = this.doBlink ? "chargedBlink" : "charged";
                    if (this.doBlink) {
                        this.doBlink = false;
                        this.sounds.charged.play()
                    }
                } else animKey = "normal";
                var alpha = this.special || this.controller.isAiming(this) ? 1 : 0.4,
                    chargeDots = this.rangeCurrent || !this.chargeActive ? 0 : Math.floor((this.currentCharge - 2 * this.aimTime) / 0.05).limit(0, 10),
                    dotCount = halfRange ? 6 : 12;
                this._currentDot = 0;
                Vec2.rotate(dirToThrower, halfRange);
                var ballSize = Vec3.assignC(ballSizeVec, Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT);
                this._updateCrossHair(throwBallPos, dirToThrower, ballSize, alpha, animKey, chargeDots, dotCount, 3);
                if (halfRange) {
                    Vec2.rotate(dirToThrower, -2 * halfRange);
                    this._updateCrossHair(throwBallPos, dirToThrower, ballSize, alpha, animKey, chargeDots, dotCount, 3)
                }
                for (; this._currentDot < this._dots.length; ++this._currentDot) {
                    this._dots[this._currentDot].setCurrentAnim("normal", true);
                    this._dots[this._currentDot].setPos(-1E3, -1E3)
                }
            }
        },

        updateSprites: function () {
            var sprite = this.sprites[0];
            if (!this.active || ig.system.timeFactor <= 0 && !sc.autoControl.isActive())
                if (this.circleGlow > 0) {
                    var glowPos = this._getThrowerPos(throwerPos);
                    glowPos.x = glowPos.x + -sc.ATTACK_INPUT_DISTANCE;
                    glowPos.y = glowPos.y + +sc.ATTACK_INPUT_DISTANCE;
                    sprite.renderMode = "lighter";
                    sprite.setPos(glowPos.x, glowPos.y, 0);
                    sprite.setSize(sc.ATTACK_INPUT_DISTANCE * 2, 0, sc.ATTACK_INPUT_DISTANCE * 2, 0);
                    sprite.setImageSrc(this.tileSheet.image, 0, 64);
                    sprite.setAlpha(this.circleGlow / 0.2)
                } else sprite.setAlpha(0);
            else {
                var charged = this.isThrowCharged(),
                    alpha = this.controller.isAiming() ? 1 : 0.4,
                    chargeTiles = 0;
                this.rangeCurrent == 0 && charged && (chargeTiles = 4 + Math.floor(Math.min(2, (this.currentCharge - this.aimTime) / 0.1)));
                var spriteX = this.coll.pos.x - 16,
                    spriteY = this.coll.pos.y - this.coll.pos.z + 16;
                sprite.renderMode = "source-over";
                sprite.setPos(spriteX, spriteY, 0);
                sprite.setSize(32, 0, 32, 0);
                var tileSrc = this.tileSheet.getTileSrc(tileSrcScratch, chargeTiles);
                sprite.setImageSrc(this.tileSheet.image, tileSrc.x, tileSrc.y);
                sprite.setAlpha(alpha)
            }
        },

        onKill: function (reason) {
            for (var index = 0; index < this._dots.length; index++) this._dots[index].kill();
            this.parent(reason)
        },

        /** Trace the ball path and place trajectory dots; recurse on bounces/ball adjusters. */
        _updateCrossHair: function (startPos, dir, ballSize, alpha, animKey, dotCount, maxDots, bounces, adjustedEntity) {
            var maxDist = 12;
            Vec2.length(dir, 24 * maxDist);
            var charged = this.isThrowCharged(),
                traceResult = ig.game.physics.initTraceResult(traceScratch),
                touchEntities = [];
            ig.game.physics._trackEntityTouch = true;
            var trace = ig.game.trace(traceResult, startPos.x, startPos.y, startPos.z, dir.x, dir.y, ballSize.x, ballSize.y,
                    ballSize.z, ig.COLLTYPE.PROJECTILE, null, touchEntities),
                trackEntityTouch = ig.game.physics._trackEntityTouch = false,
                hitEntity = null,
                nearestDist = -1;
            Vec2.assign(tmpVec3, dir);
            Vec2.mulF(tmpVec3, traceResult.dist);
            Vec2.add(tmpVec3, startPos);
            tmpVec3.z = startPos.z;
            for (var index = 0; index < touchEntities.length; ++index) {
                var entity = touchEntities[index].entity;
                if (entity != adjustedEntity) {
                    var destroysBall = entity.ballDestroyer || entity.isBallDestroyer && entity.isBallDestroyer(tmpVec3, traceResult, charged),
                        adjustsBall = !this.rangeCurrent && entity.isBallAdjust && entity.isBallAdjust(charged),
                        isHit = false;
                    if (destroysBall || adjustsBall)
                        if (entity.coll.type == ig.COLLTYPE.BLOCK) isHit = nearestDist == -1;
                        else {
                            var entityCenter = entity.getCenter(centerVec),
                                dist = Vec2.distance(startPos, entityCenter);
                            if (nearestDist == -1 || dist < nearestDist) {
                                nearestDist = dist;
                                Vec2.assign(hitCenter, entityCenter);
                                isHit = true
                            }
                        }
                    if (isHit) {
                        trackEntityTouch = false;
                        hitEntity = null;
                        destroysBall ? trackEntityTouch = true :
                            adjustsBall && (hitEntity = entity)
                    }
                }
            }
            if (nearestDist != -1) {
                var toHit = Vec2.sub(hitCenter, startPos);
                traceResult.dist = Vec2.dot(toHit, dir) / Vec2.dot(dir, dir)
            }
            maxDist = maxDist * Math.max(0, traceResult.dist);
            Vec2.length(dir, 24);
            var didIterate = false;
            for (index = 1; index < maxDist + 0.8; index++) {
                var dotX = Math.round(startPos.x) + dir.x * (index > maxDist - 0.2 ? maxDist - 0.1 : index);
                var dotY = Math.round(startPos.y) + dir.y * (index > maxDist - 0.2 ? maxDist - 0.1 : index);
                if (this._dots[this._currentDot]) {
                    this._dots[this._currentDot].setPos(dotX + ballSize.x / 2 - Constants.BALL_SIZE / 2, dotY + ballSize.y / 2 - Constants.BALL_SIZE / 2);
                    this._dots[this._currentDot].coll.pos.z = startPos.z;
                    this._dots[this._currentDot].coll.level = ig.game.getLevelIdx(startPos.z);
                    this._dots[this._currentDot].setCurrentAnim(animKey, true, animKey == "chargedBlink" ? "charged" : null);
                    this._dots[this._currentDot].animState.alpha = alpha;
                    this._dots[this._currentDot].coll.shadow.size = animKey == "charged" ? 4 : 0;
                    ++this._currentDot
                } else return;
                didIterate = true;
                if (!--maxDots) return
            }
            if (didIterate || --maxDots)
                if (adjustedEntity || trace && !trackEntityTouch && dotCount && bounces) {
                    bounces = bounces - 1;
                    Vec2.length(dir, 24 * maxDist);
                    Vec2.add(startPos, dir);
                    if (adjustedEntity) {
                        startPos.x = startPos.x + ballSize.x / 2;
                        startPos.y = startPos.y + ballSize.x / 2;
                        bounces = adjustedEntity.doBallAdjust(startPos, dir, ballSize, bounces);
                        startPos.x = startPos.x - ballSize.x / 2;
                        startPos.y = startPos.y - ballSize.x / 2;
                        dotCount = maxDots
                    } else {
                        var reflectDot = Vec2.dot(dir, traceResult.dir);
                        Vec2.sub(dir, Vec2.mulF(traceResult.dir, 2 * reflectDot, reflectVec));
                        dotCount = Math.min(maxDots, dotCount)
                    }
                    this._updateCrossHair(startPos, dir, ballSize, Math.max(0.25, alpha * 0.75), animKey, dotCount, dotCount, bounces, adjustedEntity)
                }
        },

        _getThrowerPos: function (outVec) {
            Vec2.assign(outVec, this.thrower.coll.pos);
            outVec.x = Math.round(outVec.x) + this.thrower.coll.size.x / 2;
            outVec.y = Math.round(outVec.y - this.thrower.coll.pos.z) + this.thrower.coll.size.y / 2 - Constants.BALL_HEIGHT - Constants.BALL_SIZE / 2;
            return outVec
        }
    });

    ig.ENTITY.CrosshairDot = ig.AnimatedEntity.extend({
        blocks: {},
        tileSheet: new ig.TileSheet("media/entity/map-gui/crosshair.png", 8, 8, 32, 0),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT);
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

        update: function () {
            this.animState.alpha = ig.system.timeFactor <= 0 && !sc.autoControl.isActive() ? 0 : 1;
            this.parent()
        }
    });

    sc.PlayerCrossHairController = ig.Class.extend({
        gamepadMode: false,

        isAiming: function () {
            return sc.control.aiming()
        },

        getAimingDistance: function (aimDir, screenPos) {
            var aimVec = this.gamepadMode ? aimDir : Vec2.mulC(screenPos, ig.system.height / ig.system.width, 1, scaledVec);
            return Vec2.length(aimVec)
        },

        onActiveChange: function (crosshair) {
            if (crosshair.active) this.gamepadMode = sc.control.isRightStickDown()
        },

        updatePos: function (crosshair) {
            if (this.gamepadMode) {
                if (sc.control.isRightStickDown()) {
                    var moveDir = Vec2.flip(Vec2.sub(crosshair._getThrowerPos(throwerPos), crosshair.coll.pos)),
                        stickVec = Vec2.assignC(stickDir, sc.control.getAxesValue(ig.AXES.RIGHT_STICK_X) * ig.system.height * 0.6, sc.control.getAxesValue(ig.AXES.RIGHT_STICK_Y) * ig.system.height * 0.6);
                    Vec2.lerp(moveDir, stickVec, ig.system.actualTick * 18);
                    crosshair._getThrowerPos(crosshair.coll.pos);
                    crosshair.coll.pos.x = crosshair.coll.pos.x + moveDir.x;
                    crosshair.coll.pos.y = crosshair.coll.pos.y + moveDir.y
                }
            } else ig.system.getMapFromScreenPos(crosshair.coll.pos, sc.control.getMouseX(), sc.control.getMouseY())
        }
    });

    sc.EventCrossHairController = ig.Class.extend({
        targetPos: Vec2.create(),
        gamepadMode: false,

        isAiming: function () {
            return true
        },

        getAimingDistance: function () {
            return 0
        },

        onActiveChange: function () {},

        updatePos: function (crosshair) {
            Vec2.assign(crosshair.coll.pos, this.targetPos)
        }
    })
});
ig.baked = !0;
