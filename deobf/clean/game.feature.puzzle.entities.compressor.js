/**
 * game.feature.puzzle.entities.compressor
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.compressor")`.
 *
 * Compressed-ball puzzle elements: `ig.ENTITY.Compressor` (and
 * `AntiCompressor`/`CompressorBouncer`) squash the player ball into
 * `sc.CompressedBaseEntity`/`sc.CompressedShockEntity`/`sc.CompressedWaveEntity`
 * states that then burst out.
 */
ig.module("game.feature.puzzle.entities.compressor").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    var tmpVec2a = Vec2.create(),
        tmpVec2b = Vec2.create(),
        tmpVec2c = Vec2.create(),
        tmpVec2d = Vec2.create(),
        tmpVec2e = Vec2.create(),
        tmpVec3 = Vec3.create(),
        chargeHeights = [0, 3, 6, 10],
        elementNames = {
            3: "Shock",
            4: "Wave"
        };
    ig.ENTITY.Compressor = ig.AnimatedEntity.extend({
        chargeState: 0,
        dischargeTimer: 0,
        currentElement: 0,
        compressorBall: null,
        ballHeight: 0,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                followCamera: {
                    _type: "Boolean",
                    _info: "If true follow compressor ball with camera"
                },
                ballSpeed: {
                    _type: "Number",
                    _info: "Additional factor to slow down ball speed when going along or through walls",
                    _optional: true
                },
                fastMode: {
                    _type: "Boolean",
                    _info: "Make sure puzzle element is not slowed down by assist mode"
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor"),
            hideHandle: null
        },
        sounds: {
            charge: new ig.Sound("media/sound/puzzle/wave-charge.ogg", 0.5, 0)
        },
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            this.followCamera = settings.followCamera || false;
            this.ballSpeed = settings.ballSpeed || 1;
            this.fastMode = settings.fastMode || false;
            var mapStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                shapeType: "Z_FLAT",
                wallY: 1,
                SUB: [{
                    sheet: {
                        src: mapStyle.sheet,
                        width: 16,
                        height: 16,
                        xCount: 3,
                        offX: 208,
                        offY: 176
                    },
                    SUB: [{
                        name: "off",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "shock",
                        time: 1,
                        frames: [1],
                        repeat: false
                    }, {
                        name: "wave",
                        time: 1,
                        frames: [2],
                        repeat: false
                    }]
                }, {
                    offset: { x: 0, y: 0, z: 6 },
                    sheet: {
                        src: mapStyle.sheet,
                        width: 16,
                        height: 16,
                        xCount: 3,
                        offX: 208,
                        offY: 160
                    },
                    SUB: [{
                        name: "off",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "shock",
                        time: 0.05,
                        frames: [1, 0, 1, 0, 1, 0, 1, 0],
                        repeat: false
                    }, {
                        name: "wave",
                        time: 0.05,
                        frames: [2, 0, 2, 0, 2, 0, 2, 0],
                        repeat: false
                    }]
                }]
            });
            this.setCurrentAnim("off");
            ballCounter = 0;
        },
        show: function(show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null;
            }
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
        },
        onHideRequest: function() {
            this.resetCharge();
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect == this.effects.hideHandle && effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide();
            }
        },
        createCompressorBall: function() {
            var center = this.getCenter();
            if (this.currentElement == sc.ELEMENT.SHOCK) this.compressorBall = ig.game.spawnEntity(sc.CompressedShockEntity, center.x, center.y, this.coll.pos.z + 12, {
                speed: this.ballSpeed,
                fastMode: this.fastMode
            });
            else if (this.currentElement == sc.ELEMENT.WAVE) this.compressorBall = ig.game.spawnEntity(sc.CompressedWaveEntity, center.x, center.y, this.coll.pos.z + 12, {
                speed: this.ballSpeed,
                fastMode: this.fastMode
            });
        },
        update: function() {
            if (this.chargeState) {
                this.dischargeTimer = this.dischargeTimer - ig.system.tick;
                if (this.dischargeTimer <= 0) {
                    if (this.compressorBall) this.compressorBall.destroy();
                    this.compressorBall = null;
                    this.chargeState--;
                    if (this.chargeState) this.dischargeTimer = 0.4;
                    else {
                        this.currentElement = 0;
                        this.setCurrentAnim("off");
                    }
                }
            }
            var targetHeight = chargeHeights[this.chargeState] || 0;
            if (this.ballHeight > targetHeight) {
                this.ballHeight = this.ballHeight - ig.system.tick * (this.ballHeight - targetHeight > 3 ? 40 : 7.5);
                if (this.ballHeight < targetHeight) this.ballHeight = targetHeight;
            } else if (this.ballHeight < targetHeight) {
                this.ballHeight = this.ballHeight + ig.system.tick * 40;
                if (this.ballHeight > targetHeight) this.ballHeight = targetHeight;
            }
            this.parent();
        },
        resetCharge: function() {
            this.currentElement = this.chargeState = this.dischargeTimer = this.ballHeight = 0;
            if (this.compressorBall) {
                this.compressorBall.destroy();
                this.compressorBall = null;
            }
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.ballHeight) this.sprites[1].pos.z = this.sprites[1].pos.z + Math.round(this.ballHeight);
        },
        ballHit: function(ball) {
            if (this.effects.hideHandle) return false;
            var hitCenter = ball.getHitCenter(this),
                element = ball.getElement();
            if (ball.getCombatant().party != sc.COMBATANT_PARTY.PLAYER || ball instanceof sc.CompressedBaseEntity) return false;
            var isCharged = !ball.isBall || (ball.attackInfo && ball.attackInfo.hasHint("CHARGED")),
                attackType = sc.ATTACK_TYPE.NONE;
            if (element == sc.ELEMENT.WAVE || element == sc.ELEMENT.SHOCK) {
                if (element == sc.ELEMENT.WAVE) this.setCurrentAnim("wave", true, null, true);
                if (element == sc.ELEMENT.SHOCK) this.setCurrentAnim("shock", true, null, true);
                if (element != this.currentElement) {
                    if (this.compressorBall) this.compressorBall.destroy();
                    this.compressorBall = null;
                    this.currentElement = element;
                    this.chargeState = 0;
                }
                if (!this.compressorBall && this.chargeState < 3) {
                    this.chargeState = Math.min(3, this.chargeState + 1);
                    if (this.chargeState >= 3) {
                        this.effects.sheet.spawnOnTarget("chargeFinal" + elementNames[element], this, {
                            offset: { x: 0, y: 0, z: 16 }
                        });
                        this.dischargeTimer = 5 / sc.options.get("assist-puzzle-speed");
                        this.createCompressorBall();
                    } else {
                        ig.SoundHelper.playAtEntity(this.sounds.charge, this, false, {
                            speed: 1 + (this.chargeState - 1) * 0.2
                        });
                        this.effects.sheet.spawnOnTarget("charge" + elementNames[element], this, {
                            offset: { x: 0, y: 0, z: 6 + chargeHeights[this.chargeState] }
                        });
                        this.dischargeTimer = 0.4;
                    }
                }
                sc.combat.showHitEffect(this, hitCenter, attackType, ball.getElement(), false, false, true);
            } else sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            if (this.compressorBall) {
                var hitVel = ball.getHitVel(this, tmpVec2a);
                if (isCharged) {
                    this.effects.sheet.spawnOnTarget("shoot" + elementNames[this.currentElement], this, {
                        offset: { x: 0, y: 0, z: 16 }
                    });
                    this.compressorBall.shoot(hitVel, ball.getCombatantRoot(), this.followCamera);
                    this.compressorBall = null;
                    this.dischargeTimer = this.chargeState = 0;
                    this.setCurrentAnim("off", true, null, true);
                } else this.compressorBall.nudge(hitVel);
            }
            return true;
        },
        isBallAdjust: function() {
            return true;
        },
        doBallAdjust: function(ball, x, z) {
            this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, ball);
            ball.z = ball.z + 12;
            if (this.compressorBall) Vec3.assign(z, this.compressorBall.coll.size);
            return 1;
        },
        isBallDestroyer: function(ball, x, z) {
            return !this.compressorBall || !z ? true : false;
        }
    });
    var traceResult = {};
    sc.CompressedBaseEntity = ig.AnimatedEntity.extend({
        element: null,
        startPos: Vec2.create(),
        nudgeDir: Vec2.create(),
        nudgeTimer: 0,
        killTimer: 0,
        collisionList: [],
        collReleaseTimer: 0,
        collReleaseTimeList: [],
        globalCount: 0,
        speedFactor: 1,
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor"),
            perma: null,
            trail: null
        },
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.globalCount = ++ballCounter;
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.setSize(16, 16, 16);
            this.coll.pos.x = this.coll.pos.x - this.coll.size.x / 2;
            this.coll.pos.y = this.coll.pos.y - this.coll.size.y / 2;
            this.coll.zGravityFactor = 0;
            this.coll.accelSpeed = 0;
            this.coll.friction.air = 0;
            this.coll.friction.ground = 0;
            this.coll.bounciness = 1;
            Vec2.assign(this.startPos, this.coll.pos);
            this.speedFactor = settings.speed || 1;
            this.fastMode = settings.fastMode || false;
        },
        _getAssistFactor: function() {
            return this.fastMode ? 1 : sc.options.get("assist-puzzle-speed");
        },
        onKill: function(entity) {
            this.parent(entity);
            if (this.cameraHandle) ig.camera.removeTarget(this.cameraHandle, "NORMAL", KEY_SPLINES.EASE_IN_OUT);
            this.collisionList.length = 0;
        },
        nudge: function(dir) {
            Vec2.assign(this.nudgeDir, dir);
            Vec2.length(this.nudgeDir, 8);
            this.nudgeTimer = 0.1;
        },
        shoot: function(dir, combatant, followCamera) {
            this.coll.vel.x = dir.x;
            this.coll.vel.y = dir.y;
            Vec2.length(this.coll.vel, 400);
            this.animState.angle = Vec3.clockangle(this.coll.vel);
            this.combatant = combatant;
            this.effects.trail = this.effects.sheet.spawnOnTarget("trail" + elementNames[this.element], this, {
                duration: -1,
                offset: { x: 0, y: 0, z: 4 }
            });
            this.killTimer = 10;
            this.attackInfo = new sc.AttackInfo(combatant.params, {
                element: this.element,
                hints: ["COMPRESSED"]
            });
            if (followCamera) {
                this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([this, ig.game.playerEntity], true), 0, 0);
                ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_IN_OUT);
            }
        },
        destroy: function() {
            this.kill();
        },
        update: function() {
            this.collReleaseTimer = this.collReleaseTimer + ig.system.tick;
            if (this.collReleaseTimeList.length > 0 && this.collReleaseTimeList[0] <= this.collReleaseTimer) {
                this.collisionList.shift();
                this.collReleaseTimeList.shift();
            }
            if (this.nudgeTimer) {
                this.nudgeTimer = this.nudgeTimer - ig.system.tick;
                if (this.nudgeTimer <= 0) {
                    this.coll.setPos(this.startPos.x, this.startPos.y, this.coll.pos.z);
                    this.nudgeTimer = 0;
                } else {
                    var progress = KEY_SPLINES.EASE_OUT.get(1 - this.nudgeTimer / 0.1),
                        progress = Math.sin(progress * Math.PI);
                    Vec2.assign(tmpVec2a, this.startPos);
                    Vec2.addMulF(tmpVec2a, this.nudgeDir, progress);
                    this.coll.setPos(tmpVec2a.x, tmpVec2a.y, this.coll.pos.z);
                }
            }
            if (this.killTimer) {
                this.killTimer = this.killTimer - ig.system.tick;
                if (this.killTimer <= 0) this.kill();
            }
            if (ballCounter >= this.globalCount + 4) this.kill();
            this.parent();
        },
        collideWith: function(entity) {
            if (this.attackInfo && (entity.damage || entity.ballHit) && this.collisionList.indexOf(entity) == -1)
                if (entity.damage && entity.party != this.combatant.party) {
                    if (entity.damage(this, this.attackInfo)) {
                        this.collisionList.push(entity);
                        this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                        if (entity.coll.type == ig.COLLTYPE.BLOCK || entity.coll.type == ig.COLLTYPE.FENCE) this.destroy();
                    }
                } else if (entity.ballHit && entity.ballHit(this)) {
                    if (this.onBallHit) this.onBallHit(entity);
                    if (entity instanceof ig.ENTITY.WaveTeleport) this.destroy();
                    if (!this._killed) {
                        this.collisionList.push(entity);
                        this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                    }
                }
        },
        onCollision: function() {
            return false;
        },
        getHitCenter: function(other, out) {
            return this.getOverlapCenterCoords(other, out);
        },
        getHitVel: function(other, out) {
            var result = out || {};
            Vec2.assign(result, this.coll.vel);
            return result;
        },
        getElement: function() {
            return this.element;
        },
        getCombatant: function() {
            return this.combatant;
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot();
        },
        getAttackInfo: function() {
            return this.attackInfo;
        },
        ballHit: function(ball) {
            if (!this.attackInfo) return false;
            if (ball.attackInfo && ball.attackInfo.hasHint("ANTI_COMPRESSOR")) {
                var effectName = "suck" + (this.element == sc.ELEMENT.SHOCK ? "Shock" : "Wave"),
                    center = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                this.effects.sheet.spawnOnTarget(effectName, ball.getCombatant(), {
                    target2Point: center
                });
                this.destroy();
                return true;
            }
            return false;
        },
        onCompressorMoveEnd: function() {
            this.destroy();
        },
        isCompressor: function() {
            return true;
        }
    });
    sc.COMPRESSOR_MOVE = {
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor")
        },
        waveUpdate: function(ball) {
            var center = ball.getCenter(tmpVec2a);
            if (center.x <= 0 || center.x >= ig.game.size.x || center.y <= 0 || center.y >= ig.game.size.y) ball.onCompressorMoveEnd(true);
            if (ball.enterWall.timer) {
                ball.enterWall.timer = ball.enterWall.timer - ig.system.tick;
                if (ball.enterWall.timer <= 0) {
                    ball.enterWall.timer = 0;
                    Vec2.assign(ball.coll.vel, ball.enterWall.dir);
                    Vec2.length(ball.coll.vel, 200 * ball.speedFactor * ball._getAssistFactor());
                }
            }
            if (ball.phaseMode && !ball.enterWall.timer) {
                ball.wallKillTimer = ball.wallKillTimer + ig.system.tick * ball._getAssistFactor();
                if (ball.wallKillTimer > WALL_KILL_TIME) ball.onCompressorMoveEnd(true);
                else if (ball.phaseTraveled > 4) {
                    if (!ig.game.isAreaBlocked(center.x - 8, center.y - 8, ball.coll.pos.z, 16, 16, ball.coll.size.z, true)) {
                        ball.phaseMode = false;
                        ball.effects.perma.stop();
                        ball.effects.perma = this.effects.sheet.spawnOnTarget("ballWave", ball, {
                            duration: -1,
                            offset: { x: 0, y: 0, z: 4 }
                        });
                        ball.effects.trail = this.effects.sheet.spawnOnTarget("trailWave", ball, {
                            duration: -1,
                            offset: { x: 0, y: 0, z: 4 }
                        });
                        var coll = ball.coll,
                            leaveCenter = ball.getCenter(tmpVec2b);
                        leaveCenter.x = leaveCenter.x - coll.vel.x * ball.coll.size.x / 2.05;
                        leaveCenter.y = leaveCenter.y - coll.vel.y * ball.coll.size.y / 2.05;
                        this.effects.sheet.spawnFixed("waveWallLeave", leaveCenter.x, leaveCenter.y, ball.coll.pos.z, null, {
                            angle: Math.PI + Vec2.clockangle(coll.vel)
                        });
                        Vec2.length(ball.coll.vel, 400);
                        ball.coll.setType(ball.startCollType);
                        ball.animState.angle = Vec3.clockangle(ball.coll.vel);
                    }
                } else ball.phaseTraveled = ball.phaseTraveled + ig.system.tick * 200 * ball._getAssistFactor();
            } else ball.wallKillTimer = 0;
        },
        waveMoveTrace: function(ball, trace) {
            if (!ball._killed && !ball.phaseMode && trace.collided) {
                var result = ig.game.physics.initTraceResult(traceResult),
                    coll = ball.coll,
                    vel = Vec2.assign(tmpVec2a, coll.vel);
                Vec2.length(vel, ball.coll.size.x + ig.system.tick * 2);
                var dir = ig.game.trace(result, coll.pos.x + coll.size.x / 2 - 1, coll.pos.y + coll.size.y / 2 - 1, coll.pos.z, vel.x, vel.y, 2, 2, coll.size.z, ball.startCollType) ? result.dir : trace.blockDir;
                Vec2.assign(ball.enterWall.dir, dir);
                Vec2.assignC(coll.vel, 0, 0);
                ball.enterWall.timer = ENTER_WALL_TIME;
                var center = ball.getCenter(tmpVec2b);
                center.x = center.x + dir.x * ball.coll.size.x / 2.05;
                center.y = center.y + dir.y * ball.coll.size.y / 2.05;
                this.effects.sheet.spawnFixed("waveWallOrth", center.x, center.y, ball.coll.pos.z, null, {
                    angle: Math.PI + Vec2.clockangle(dir)
                });
                ball.animState.angle = Vec3.clockangle(ball.coll.vel);
                ball.coll.setType(ig.COLLTYPE.TRIGGER);
                ball.phaseMode = true;
                ball.phaseTraveled = 0;
                ball.effects.perma.stop();
                if (ball.effects.trail) {
                    ball.effects.trail.stop();
                    ball.effects.trail = null;
                }
                ball.effects.perma = this.effects.sheet.spawnOnTarget("ballWaveAlt", ball, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
            }
        },
        waveCollide: function(ball, other) {
            var collData = ball.coll._collData;
            if (collData && collData.collided && !ball.phaseMode && this.isAlignCenter(other)) {
                var dist = ig.CollTools.getDistVec2(other.coll, ball.coll, tmpVec2a),
                    blockDir = Vec2.assign(tmpVec2b, collData.blockDir);
                Vec2.mulF(blockDir, Vec2.dot(dist, collData.blockDir));
                var center = other.getCenter(tmpVec2c);
                Vec2.add(center, blockDir);
                Vec2.subC(center, ball.coll.size.x / 2, ball.coll.size.y / 2);
                ball.coll.setPos(center.x, center.y);
                ball.coll._collData.skipPhysics = false;
            }
        },
        waveBallHit: function(ball, entity) {
            if (entity instanceof ig.ENTITY.RegenDestruct) {
                var center = ball.getCenter(tmpVec2a),
                    hitForce = new sc.CircleHitForce(ball.combatant, {
                        attack: {
                            type: "MEDIUM",
                            element: "WAVE",
                            damageFactor: 0,
                            spFactor: 0,
                            hints: ["COMPRESSED"]
                        },
                        pos: Vec3.createC(center.x, center.y, ball.coll.pos.z),
                        radius: 32,
                        zHeight: 4,
                        duration: 0.1,
                        expandRadius: 0,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 1
                    });
                sc.combat.addCombatForce(hitForce);
            }
        },
        isAlignCenter: function(entity) {
            return entity instanceof ig.ENTITY.RotateBlocker || (entity instanceof ig.ENTITY.OneTimeSwitch && entity.switchType == "waveSwitch") ? true : false;
        },
        shockUpdate: function(ball) {
            if (ball.turnSoundTimer) {
                ball.turnSoundTimer = ball.turnSoundTimer - ig.system.tick;
                if (ball.turnSoundTimer < 0) ball.turnSoundTimer = 0;
            }
            if (!Vec2.isZero(ball.slidingWall)) {
                var move = Vec2.assign(tmpVec2a, ball.coll.vel);
                Vec2.mulF(move, ig.system.tick);
                if (ball.blockCheck > 0) {
                    ball.blockCheck = ball.blockCheck - Vec2.length(move);
                    if (ball.blockCheck <= 0) ball.blockCheck = 0;
                } else {
                    var result = ig.game.physics.initTraceResult(traceResult);
                    if (!ig.game.traceEntity(result, ball, move.x, move.y, 0, 0, 0, ball.coll.type, null, null)) {
                        var turnDir = null,
                            result = ig.game.physics.initTraceResult(traceResult),
                            blockers = [],
                            hit = ig.game.traceEntity(result, ball, ball.slidingWall.x * 4, ball.slidingWall.y * 4, move.x, move.y, 0, ball.coll.type, blockers, null);
                        if (hit && !Vec2.equal(result.dir, ball.slidingWall) && Vec2.dot(ball.coll.vel, result.dir) < 0) {
                            Vec2.addMulF(move, ball.slidingWall, 4 * result.dist);
                            Vec2.addMulF(move, result.dir, -1);
                            turnDir = result.dir;
                        } else if (!hit) {
                            var backMove = Vec2.assign(tmpVec2b, move);
                            Vec2.mulF(backMove, -3);
                            Vec2.addMulF(move, ball.slidingWall, 4);
                            result = ig.game.physics.initTraceResult(traceResult);
                            if (hit = ig.game.traceEntity(result, ball, backMove.x, backMove.y, move.x, move.y, 0, ball.coll.type, null, null)) {
                                Vec2.addMulF(move, backMove, result.dist);
                                Vec2.addMulF(move, result.dir, -1);
                                turnDir = result.dir;
                            } else this.clearWallSliding(ball);
                        }
                        if (!turnDir && hit) {
                            var assistFactor = ball._getAssistFactor();
                            for (var i = blockers.length; i--;)
                                if (blockers[i].entity.compressorSlow) Vec2.length(ball.coll.vel, 200 * blockers[i].entity.compressorSlow * ball.speedFactor * assistFactor);
                                else Vec2.length(ball.coll.vel, 200 * ball.speedFactor * assistFactor);
                        }
                        if (turnDir) {
                            if (!ball.turnSoundTimer) {
                                this.effects.sheet.spawnOnTarget("shockWallTurn", ball);
                                ball.turnSoundTimer = TURN_SOUND_TIME;
                            }
                            var newDir = Vec2.assign(tmpVec2c, turnDir);
                            Vec2.rotate90CW(newDir);
                            if (Vec2.dot(newDir, ball.slidingWall) > 0) Vec2.flip(newDir);
                            var lineStart = Vec2.assign(tmpVec2a, 0, 0);
                            Vec2.addMulF(lineStart, ball.coll.vel, -0.5);
                            var lineEnd = Vec2.addMulF(move, newDir, 128, tmpVec2e),
                                intersect = tmpVec2d;
                            if (Line2.intersect(lineStart, ball.coll.vel, move, lineEnd, intersect)) ball.coll.setPos(ball.coll.pos.x + intersect.x, ball.coll.pos.y + intersect.y);
                            Vec2.flip(newDir);
                            Vec2.assign(ball.slidingWall, turnDir);
                            Vec2.assign(ball.coll.vel, newDir);
                            Vec2.length(ball.coll.vel, 200 * ball.speedFactor * ball._getAssistFactor());
                            ball.animState.angle = Vec3.clockangle(ball.coll.vel);
                            ball.blockCheck = 2;
                        }
                    }
                }
            }
        },
        shockMoveTrace: function(ball, trace) {
            if (trace.collided) {
                if (Vec2.isZero(ball.slidingWall)) {
                    this.effects.sheet.spawnOnTarget("shockWallConnect", ball);
                    ball.killTimer = ball.killTimer / (0.5 * ball.speedFactor * ball._getAssistFactor());
                } else if (!ball.turnSoundTimer) {
                    this.effects.sheet.spawnOnTarget("shockWallTurn", ball);
                    ball.turnSoundTimer = TURN_SOUND_TIME;
                }
                var wallDir = Vec2.assign(tmpVec2a, trace.blockDir);
                Vec2.flip(wallDir);
                Vec2.length(wallDir, 1);
                ball.coll.setPos(ball.coll.pos.x + wallDir.x, ball.coll.pos.y + wallDir.y);
                ball.coll._collData.skipPhysics = false;
                Vec2.rotate90CW(wallDir);
                if ((Vec2.isZero(ball.slidingWall) ? Vec2.dot(wallDir, ball.coll.vel) : -Vec2.dot(wallDir, ball.slidingWall)) < 0) Vec2.flip(wallDir);
                Vec2.assign(ball.slidingWall, trace.blockDir);
                Vec2.assign(ball.coll.vel, wallDir);
                Vec2.length(ball.coll.vel, 200 * ball.speedFactor * ball._getAssistFactor());
                ball.animState.angle = Vec3.clockangle(ball.coll.vel);
            }
        },
        clearWallSliding: function(ball) {
            if (!Vec2.isZero(ball.slidingWall)) {
                Vec3.assignC(ball.slidingWall, 0, 0);
                Vec2.length(ball.coll.vel, 400);
                ball.killTimer = ball.killTimer * 0.5 * ball.speedFactor;
            }
        },
        shootFromWall: function(ball, bouncer, other) {
            this.clearWallSliding(ball);
            var center = ig.CollTools.getCenterXYAlignedPos(tmpVec3, ball.coll, bouncer.coll);
            ball.setPos(center.x, center.y, center.z);
            Vec2.assign(tmpVec2a, other);
            Vec2.length(tmpVec2a, 400);
            Vec2.length(ball.coll.vel, 4);
            Vec2.add(tmpVec2a, ball.coll.vel);
            Vec2.assign(ball.coll.vel, tmpVec2a);
            Vec2.length(ball.coll.vel, 400);
            ball.wallBounces++;
        }
    };
    var WALL_KILL_TIME = 1.5,
        ENTER_WALL_TIME = 0.2;
    sc.CompressedWaveEntity = sc.CompressedBaseEntity.extend({
        _wm: new ig.Config({
            spawnable: false,
            attributes: {}
        }),
        phaseMode: false,
        phaseTraveled: 0,
        wallKillTimer: 0,
        startCollType: ig.COLLTYPE.PROJECTILE,
        enterWall: {
            timer: 0,
            dir: Vec2.create()
        },
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.element = sc.ELEMENT.WAVE;
            this.effects.perma = this.effects.sheet.spawnOnTarget("ballWave", this, {
                duration: -1,
                offset: { x: 0, y: 0, z: 4 }
            });
        },
        update: function() {
            sc.COMPRESSOR_MOVE.waveUpdate(this);
            this.parent();
        },
        onBallHit: function(entity) {
            if (entity instanceof ig.ENTITY.RegenDestruct) {
                var center = this.getCenter(tmpVec2a),
                    hitForce = new sc.CircleHitForce(this.combatant, {
                        attack: {
                            type: "MEDIUM",
                            element: "WAVE",
                            damageFactor: 0,
                            spFactor: 0,
                            hints: ["COMPRESSED"]
                        },
                        pos: Vec3.createC(center.x, center.y, this.coll.pos.z),
                        radius: 32,
                        zHeight: 4,
                        duration: 0.1,
                        expandRadius: 0,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 1
                    });
                sc.combat.addCombatForce(hitForce);
            }
        },
        collideWith: function(entity, other) {
            sc.COMPRESSOR_MOVE.waveCollide(this, entity, other);
            this.parent(entity, other);
        },
        handleMovementTrace: function(trace) {
            sc.COMPRESSOR_MOVE.waveMoveTrace(this, trace);
        }
    });
    var TURN_SOUND_TIME = 0.1,
        ballCounter = 0;
    sc.CompressedShockEntity = sc.CompressedBaseEntity.extend({
        _wm: new ig.Config({
            spawnable: false,
            attributes: {}
        }),
        slidingWall: Vec2.create(),
        blockCheck: 0,
        turnSoundTimer: 0,
        wallBounces: 0,
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.element = sc.ELEMENT.SHOCK;
            this.effects.perma = this.effects.sheet.spawnOnTarget("ballShock", this, {
                duration: -1,
                offset: { x: 0, y: 0, z: 4 }
            });
        },
        update: function() {
            sc.COMPRESSOR_MOVE.shockUpdate(this);
            this.parent();
        },
        handleMovementTrace: function(trace) {
            sc.COMPRESSOR_MOVE.shockMoveTrace(this, trace);
        },
        shootFromWall: function(bouncer, dir) {
            sc.COMPRESSOR_MOVE.shootFromWall(this, bouncer, dir);
        }
    });
    ig.ENTITY.AntiCompressor = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Anti Compressor to spawn",
                    _popup: true,
                    _optional: true
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor")
        },
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            var mapStyle = ig.mapStyle.get("anticompressor");
            if (mapStyle) this.initAnimations({
                sheet: {
                    src: mapStyle.sheet,
                    width: 16,
                    height: 16,
                    xCount: 1,
                    offX: mapStyle.x,
                    offY: mapStyle.y
                },
                SUB: [{
                    size: { x: 16, y: 16, z: 0 },
                    SUB: [{
                        name: "idle",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "suck",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }]
                }, {
                    shapeType: "Y_FLAT",
                    renderMode: "lighter",
                    SUB: [{
                        name: "idle",
                        time: 0.05,
                        frames: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        framesGfxOffset: [0, 0, 0, 0, 0, -6, 0, -5, 0, -4, 0, -3, 0, -2, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
                        framesAlpha: [0, 0, 0.2, 0.4, 0.6, 0.8, 1, 1, 0.8, 0.6, 0.4, 0.2],
                        repeat: true
                    }]
                }]
            });
            this.setCurrentAnim("idle");
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect.isDone()) this.hide();
        },
        ballHit: function(ball) {
            if (ball && ball.isCompressor && ball.isCompressor()) {
                var effectName = "suck" + (ball.element == sc.ELEMENT.SHOCK ? "Shock" : "Wave"),
                    center = ball.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                this.effects.sheet.spawnOnTarget(effectName, this, {
                    target2Point: center
                });
                ball.onCompressorMoveEnd();
                return true;
            }
            return false;
        }
    });
    ig.ENTITY.CompressorBouncer = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Bouncer to spawn",
                    _popup: true,
                    _optional: true
                },
                dir: {
                    _type: "Face",
                    _info: "Direction to face",
                    _select: ig.ActorEntity.FACE4
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for bouncer to be active",
                    _popup: true
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor")
        },
        face: Vec2.create(),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(8, 8, 24);
            this.coll.zGravityFactor = 1E3;
            this.condition = new ig.VarCondition(settings.condition);
            this.dir = ig.ActorEntity.FACE4[settings.dir] || ig.ActorEntity.FACE4.NORTH;
            ig.ActorEntity.getFaceVec(this.dir, this.face);
            var mapStyle = ig.mapStyle.get("bouncer");
            if (mapStyle) this.initAnimations({
                DOCTYPE: "MULTI_DIR_ANIMATION",
                sheet: {
                    src: mapStyle.sheet,
                    width: 16,
                    height: 32,
                    offX: mapStyle.x,
                    offY: mapStyle.y,
                    xCount: 4
                },
                dirs: 4,
                flipX: [0, 0, 0, 1],
                tileOffsets: [0, 4, 8, 4],
                size: { x: 16, y: 0, z: 32 },
                wallY: 0,
                offset: { y: 4 },
                SUB: [{
                    name: "off",
                    time: 0.1,
                    frames: [0],
                    repeat: false,
                    wallY: 1,
                    offset: { y: -4 },
                    size: { x: 16, y: 16, z: 0 }
                }, {
                    name: "turnOn",
                    time: 0.05,
                    frames: [1, 2],
                    repeat: false
                }, {
                    name: "on",
                    time: 0.05,
                    frames: [3],
                    repeat: false
                }, {
                    name: "turnOff",
                    time: 0.05,
                    frames: [2, 1],
                    repeat: false
                }]
            });
            this.isOn = this.condition.evaluate();
            this.setCurrentAnim(this.isOn ? "on" : "off");
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect.isDone()) this.hide();
        },
        ballHit: function(ball) {
            if (!this.isOn) return false;
            if (ball.shootFromWall) {
                ball.shootFromWall(this, this.face);
                return true;
            }
            return false;
        },
        varsChanged: function() {
            var isOn = this.condition.evaluate();
            if (isOn != this.isOn)
                (this.isOn = isOn) ? this.setCurrentAnim("turnOn", true, "on", true) : this.setCurrentAnim("turnOff", true, "off", true);
        }
    });
});
ig.baked = !0;
