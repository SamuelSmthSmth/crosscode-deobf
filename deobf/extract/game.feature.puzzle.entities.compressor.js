ig.module("game.feature.puzzle.entities.compressor").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec2.create(),
        c = Vec2.create(),
        e = Vec2.create(),
        f = Vec3.create(),
        g = [0, 3, 6, 10],
        h = {
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
        init: function(a,
            b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            this.followCamera = d.followCamera || false;
            this.ballSpeed = d.ballSpeed || 1;
            this.fastMode = d.fastMode || false;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                shapeType: "Z_FLAT",
                wallY: 1,
                SUB: [{
                        sheet: {
                            src: a.sheet,
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
                    },
                    {
                        offset: {
                            x: 0,
                            y: 0,
                            z: 6
                        },
                        sheet: {
                            src: a.sheet,
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
                    }
                ]
            });
            this.setCurrentAnim("off");
            o = 0
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            this.resetCharge();
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a == this.effects.hideHandle && a.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        createCompressorBall: function() {
            var a = this.getCenter();
            if (this.currentElement == sc.ELEMENT.SHOCK) this.compressorBall = ig.game.spawnEntity(sc.CompressedShockEntity, a.x, a.y, this.coll.pos.z + 12, {
                speed: this.ballSpeed,
                fastMode: this.fastMode
            });
            else if (this.currentElement ==
                sc.ELEMENT.WAVE) this.compressorBall = ig.game.spawnEntity(sc.CompressedWaveEntity, a.x, a.y, this.coll.pos.z + 12, {
                speed: this.ballSpeed,
                fastMode: this.fastMode
            })
        },
        update: function() {
            if (this.chargeState) {
                this.dischargeTimer = this.dischargeTimer - ig.system.tick;
                if (this.dischargeTimer <= 0) {
                    this.compressorBall && this.compressorBall.destroy();
                    this.compressorBall = null;
                    this.chargeState--;
                    if (this.chargeState) this.dischargeTimer = 0.4;
                    else {
                        this.currentElement = 0;
                        this.setCurrentAnim("off")
                    }
                }
            }
            var a = g[this.chargeState] || 0;
            if (this.ballHeight >
                a) {
                this.ballHeight = this.ballHeight - ig.system.tick * (this.ballHeight - a > 3 ? 40 : 7.5);
                if (this.ballHeight < a) this.ballHeight = a
            } else if (this.ballHeight < a) {
                this.ballHeight = this.ballHeight + ig.system.tick * 40;
                if (this.ballHeight > a) this.ballHeight = a
            }
            this.parent()
        },
        resetCharge: function() {
            this.currentElement = this.chargeState = this.dischargeTimer = this.ballHeight = 0;
            if (this.compressorBall) {
                this.compressorBall.destroy();
                this.compressorBall = null
            }
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.ballHeight) this.sprites[1].pos.z = this.sprites[1].pos.z + Math.round(this.ballHeight)
        },
        ballHit: function(a) {
            if (this.effects.hideHandle) return false;
            var c = a.getHitCenter(this),
                d = a.getElement();
            if (a.getCombatant().party != sc.COMBATANT_PARTY.PLAYER || a instanceof sc.CompressedBaseEntity) return false;
            var e = !a.isBall || a.attackInfo && a.attackInfo.hasHint("CHARGED"),
                f = sc.ATTACK_TYPE.NONE;
            if (d == sc.ELEMENT.WAVE || d == sc.ELEMENT.SHOCK) {
                d == sc.ELEMENT.WAVE && this.setCurrentAnim("wave", true, null, true);
                d == sc.ELEMENT.SHOCK &&
                    this.setCurrentAnim("shock", true, null, true);
                if (d != this.currentElement) {
                    this.compressorBall && this.compressorBall.destroy();
                    this.compressorBall = null;
                    this.currentElement = d;
                    this.chargeState = 0
                }
                if (!this.compressorBall && this.chargeState < 3) {
                    this.chargeState = Math.min(3, this.chargeState + 1);
                    if (this.chargeState >= 3) {
                        this.effects.sheet.spawnOnTarget("chargeFinal" + h[d], this, {
                            offset: {
                                x: 0,
                                y: 0,
                                z: 16
                            }
                        });
                        this.dischargeTimer = 5 / sc.options.get("assist-puzzle-speed");
                        this.createCompressorBall()
                    } else {
                        ig.SoundHelper.playAtEntity(this.sounds.charge,
                            this, false, {
                                speed: 1 + (this.chargeState - 1) * 0.2
                            });
                        this.effects.sheet.spawnOnTarget("charge" + h[d], this, {
                            offset: {
                                x: 0,
                                y: 0,
                                z: 6 + g[this.chargeState]
                            }
                        });
                        this.dischargeTimer = 0.4
                    }
                }
                sc.combat.showHitEffect(this, c, f, a.getElement(), false, false, true)
            } else sc.combat.showHitEffect(this, c, sc.ATTACK_TYPE.NONE, a.getElement(), false, false, true);
            if (this.compressorBall) {
                c = a.getHitVel(this, b);
                if (e) {
                    this.effects.sheet.spawnOnTarget("shoot" + h[this.currentElement], this, {
                        offset: {
                            x: 0,
                            y: 0,
                            z: 16
                        }
                    });
                    this.compressorBall.shoot(c, a.getCombatantRoot(),
                        this.followCamera);
                    this.compressorBall = null;
                    this.dischargeTimer = this.chargeState = 0;
                    this.setCurrentAnim("off", true, null, true)
                } else this.compressorBall.nudge(c)
            }
            return true
        },
        isBallAdjust: function() {
            return true
        },
        doBallAdjust: function(a, b, c) {
            this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
            a.z = a.z + 12;
            this.compressorBall && Vec3.assign(c, this.compressorBall.coll.size);
            return 1
        },
        isBallDestroyer: function(a, b, c) {
            return !this.compressorBall || !c ? true : false
        }
    });
    var i = {};
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.globalCount = ++o;
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.setSize(16, 16, 16);
            this.coll.pos.x = this.coll.pos.x - this.coll.size.x / 2;
            this.coll.pos.y = this.coll.pos.y - this.coll.size.y / 2;
            this.coll.zGravityFactor = 0;
            this.coll.accelSpeed =
                0;
            this.coll.friction.air = 0;
            this.coll.friction.ground = 0;
            this.coll.bounciness = 1;
            Vec2.assign(this.startPos, this.coll.pos);
            this.speedFactor = d.speed || 1;
            this.fastMode = d.fastMode || false
        },
        _getAssistFactor: function() {
            return this.fastMode ? 1 : sc.options.get("assist-puzzle-speed")
        },
        onKill: function(a) {
            this.parent(a);
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "NORMAL", KEY_SPLINES.EASE_IN_OUT);
            this.collisionList.length = 0
        },
        nudge: function(a) {
            Vec2.assign(this.nudgeDir, a);
            Vec2.length(this.nudgeDir, 8);
            this.nudgeTimer = 0.1
        },
        shoot: function(a, b, c) {
            this.coll.vel.x = a.x;
            this.coll.vel.y = a.y;
            Vec2.length(this.coll.vel, 400);
            this.animState.angle = Vec3.clockangle(this.coll.vel);
            this.combatant = b;
            this.effects.trail = this.effects.sheet.spawnOnTarget("trail" + h[this.element], this, {
                duration: -1,
                offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            });
            this.killTimer = 10;
            this.attackInfo = new sc.AttackInfo(b.params, {
                element: this.element,
                hints: ["COMPRESSED"]
            });
            if (c) {
                this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([this, ig.game.playerEntity],
                    true), 0, 0);
                ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
            }
        },
        destroy: function() {
            this.kill()
        },
        update: function() {
            this.collReleaseTimer = this.collReleaseTimer + ig.system.tick;
            if (this.collReleaseTimeList.length > 0 && this.collReleaseTimeList[0] <= this.collReleaseTimer) {
                this.collisionList.shift();
                this.collReleaseTimeList.shift()
            }
            if (this.nudgeTimer) {
                this.nudgeTimer = this.nudgeTimer - ig.system.tick;
                if (this.nudgeTimer <= 0) {
                    this.coll.setPos(this.startPos.x, this.startPos.y, this.coll.pos.z);
                    this.nudgeTimer =
                        0
                } else {
                    var a = KEY_SPLINES.EASE_OUT.get(1 - this.nudgeTimer / 0.1),
                        a = Math.sin(a * Math.PI);
                    Vec2.assign(b, this.startPos);
                    Vec2.addMulF(b, this.nudgeDir, a);
                    this.coll.setPos(b.x, b.y, this.coll.pos.z)
                }
            }
            if (this.killTimer) {
                this.killTimer = this.killTimer - ig.system.tick;
                this.killTimer <= 0 && this.kill()
            }
            o >= this.globalCount + 4 && this.kill();
            this.parent()
        },
        collideWith: function(a) {
            if (this.attackInfo && (a.damage || a.ballHit) && this.collisionList.indexOf(a) == -1)
                if (a.damage && a.party != this.combatant.party) {
                    if (a.damage(this, this.attackInfo)) {
                        this.collisionList.push(a);
                        this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                        (a.coll.type == ig.COLLTYPE.BLOCK || a.coll.type == ig.COLLTYPE.FENCE) && this.destroy()
                    }
                } else if (a.ballHit && a.ballHit(this)) {
                this.onBallHit && this.onBallHit(a);
                a instanceof ig.ENTITY.WaveTeleport && this.destroy();
                if (!this._killed) {
                    this.collisionList.push(a);
                    this.collReleaseTimeList.push(this.collReleaseTimer + 0.5)
                }
            }
        },
        onCollision: function() {
            return false
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a, b)
        },
        getHitVel: function(a, b) {
            var c =
                b || {};
            Vec2.assign(c, this.coll.vel);
            return c
        },
        getElement: function() {
            return this.element
        },
        getCombatant: function() {
            return this.combatant
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot()
        },
        getAttackInfo: function() {
            return this.attackInfo
        },
        ballHit: function(a) {
            if (!this.attackInfo) return false;
            if (a.attackInfo && a.attackInfo.hasHint("ANTI_COMPRESSOR")) {
                var b = "suck" + (this.element == sc.ELEMENT.SHOCK ? "Shock" : "Wave"),
                    c = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                this.effects.sheet.spawnOnTarget(b,
                    a.getCombatant(), {
                        target2Point: c
                    });
                this.destroy();
                return true
            }
            return false
        },
        onCompressorMoveEnd: function() {
            this.destroy()
        },
        isCompressor: function() {
            return true
        }
    });
    sc.COMPRESSOR_MOVE = {
        effects: {
            sheet: new ig.EffectSheet("puzzle.compressor")
        },
        waveUpdate: function(a) {
            var c = a.getCenter(b);
            if (c.x <= 0 || c.x >= ig.game.size.x || c.y <= 0 || c.y >= ig.game.size.y) a.onCompressorMoveEnd(true);
            if (a.enterWall.timer) {
                a.enterWall.timer = a.enterWall.timer - ig.system.tick;
                if (a.enterWall.timer <= 0) {
                    a.enterWall.timer = 0;
                    Vec2.assign(a.coll.vel,
                        a.enterWall.dir);
                    Vec2.length(a.coll.vel, 200 * a.speedFactor * a._getAssistFactor())
                }
            }
            if (a.phaseMode && !a.enterWall.timer) {
                a.wallKillTimer = a.wallKillTimer + ig.system.tick * a._getAssistFactor();
                if (a.wallKillTimer > j) a.onCompressorMoveEnd(true);
                else if (a.phaseTraveled > 4) {
                    if (!ig.game.isAreaBlocked(c.x - 8, c.y - 8, a.coll.pos.z, 16, 16, a.coll.size.z, true)) {
                        a.phaseMode = false;
                        a.effects.perma.stop();
                        a.effects.perma = this.effects.sheet.spawnOnTarget("ballWave", a, {
                            duration: -1,
                            offset: {
                                x: 0,
                                y: 0,
                                z: 4
                            }
                        });
                        a.effects.trail = this.effects.sheet.spawnOnTarget("trailWave",
                            a, {
                                duration: -1,
                                offset: {
                                    x: 0,
                                    y: 0,
                                    z: 4
                                }
                            });
                        var c = a.coll,
                            d = a.getCenter(b);
                        d.x = d.x - c.vel.x * a.coll.size.x / 2.05;
                        d.y = d.y - c.vel.y * a.coll.size.y / 2.05;
                        this.effects.sheet.spawnFixed("waveWallLeave", d.x, d.y, a.coll.pos.z, null, {
                            angle: Math.PI + Vec2.clockangle(c.vel)
                        });
                        Vec2.length(a.coll.vel, 400);
                        a.coll.setType(a.startCollType);
                        a.animState.angle = Vec3.clockangle(a.coll.vel)
                    }
                } else a.phaseTraveled = a.phaseTraveled + ig.system.tick * 200 * a._getAssistFactor()
            } else a.wallKillTimer = 0
        },
        waveMoveTrace: function(a, c) {
            if (!a._killed &&
                !a.phaseMode && c.collided) {
                var d = ig.game.physics.initTraceResult(i),
                    e = a.coll,
                    f = Vec2.assign(b, e.vel);
                Vec2.length(f, a.coll.size.x + ig.system.tick * 2);
                d = ig.game.trace(d, e.pos.x + e.size.x / 2 - 1, e.pos.y + e.size.y / 2 - 1, e.pos.z, f.x, f.y, 2, 2, e.size.z, a.startCollType) ? d.dir : c.blockDir;
                Vec2.assign(a.enterWall.dir, d);
                Vec2.assignC(e.vel, 0, 0);
                a.enterWall.timer = k;
                e = a.getCenter(b);
                e.x = e.x + d.x * a.coll.size.x / 2.05;
                e.y = e.y + d.y * a.coll.size.y / 2.05;
                this.effects.sheet.spawnFixed("waveWallOrth", e.x, e.y, a.coll.pos.z, null, {
                    angle: Math.PI +
                        Vec2.clockangle(d)
                });
                a.animState.angle = Vec3.clockangle(a.coll.vel);
                a.coll.setType(ig.COLLTYPE.TRIGGER);
                a.phaseMode = true;
                a.phaseTraveled = 0;
                a.effects.perma.stop();
                if (a.effects.trail) {
                    a.effects.trail.stop();
                    a.effects.trail = null
                }
                a.effects.perma = this.effects.sheet.spawnOnTarget("ballWaveAlt", a, {
                    duration: -1,
                    offset: {
                        x: 0,
                        y: 0,
                        z: 4
                    }
                })
            }
        },
        waveCollide: function(c, e) {
            var f = c.coll._collData;
            if (f && f.collided && !c.phaseMode && this.isAlignCenter(e)) {
                var g = ig.CollTools.getDistVec2(e.coll, c.coll, b),
                    h = Vec2.assign(a, f.blockDir);
                Vec2.mulF(h, Vec2.dot(g, f.blockDir));
                f = e.getCenter(d);
                Vec2.add(f, h);
                Vec2.subC(f, c.coll.size.x / 2, c.coll.size.y / 2);
                c.coll.setPos(f.x, f.y);
                c.coll._collData.skipPhysics = false
            }
        },
        waveBallHit: function(a, c) {
            if (c instanceof ig.ENTITY.RegenDestruct) {
                var d = a.getCenter(b),
                    d = new sc.CircleHitForce(a.combatant, {
                        attack: {
                            type: "MEDIUM",
                            element: "WAVE",
                            damageFactor: 0,
                            spFactor: 0,
                            hints: ["COMPRESSED"]
                        },
                        pos: Vec3.createC(d.x, d.y, a.coll.pos.z),
                        radius: 32,
                        zHeight: 4,
                        duration: 0.1,
                        expandRadius: 0,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 1
                    });
                sc.combat.addCombatForce(d)
            }
        },
        isAlignCenter: function(a) {
            return a instanceof ig.ENTITY.RotateBlocker || a instanceof ig.ENTITY.OneTimeSwitch && a.switchType == "waveSwitch" ? true : false
        },
        shockUpdate: function(f) {
            if (f.turnSoundTimer) {
                f.turnSoundTimer = f.turnSoundTimer - ig.system.tick;
                if (f.turnSoundTimer < 0) f.turnSoundTimer = 0
            }
            if (!Vec2.isZero(f.slidingWall)) {
                var g = Vec2.assign(b, f.coll.vel);
                Vec2.mulF(g, ig.system.tick);
                if (f.blockCheck > 0) {
                    f.blockCheck = f.blockCheck - Vec2.length(g);
                    if (f.blockCheck <= 0) f.blockCheck = 0
                } else {
                    var h =
                        ig.game.physics.initTraceResult(i);
                    if (!ig.game.traceEntity(h, f, g.x, g.y, 0, 0, 0, f.coll.type, null, null)) {
                        var j = null,
                            h = ig.game.physics.initTraceResult(i),
                            k = [],
                            o = ig.game.traceEntity(h, f, f.slidingWall.x * 4, f.slidingWall.y * 4, g.x, g.y, 0, f.coll.type, k, null);
                        if (o && !Vec2.equal(h.dir, f.slidingWall) && Vec2.dot(f.coll.vel, h.dir) < 0) {
                            Vec2.addMulF(g, f.slidingWall, 4 * h.dist);
                            Vec2.addMulF(g, h.dir, -1);
                            j = h.dir
                        } else if (!o) {
                            var s = Vec2.assign(a, g);
                            Vec2.mulF(s, -3);
                            Vec2.addMulF(g, f.slidingWall, 4);
                            h = ig.game.physics.initTraceResult(i);
                            if (o = ig.game.traceEntity(h, f, s.x, s.y, g.x, g.y, 0, f.coll.type, null, null)) {
                                Vec2.addMulF(g, s, h.dist);
                                Vec2.addMulF(g, h.dir, -1);
                                j = h.dir
                            } else this.clearWallSliding(f)
                        }
                        if (!j && o) {
                            h = f._getAssistFactor();
                            for (o = k.length; o--;) k[o].entity.compressorSlow ? Vec2.length(f.coll.vel, 200 * k[o].entity.compressorSlow * f.speedFactor * h) : Vec2.length(f.coll.vel, 200 * f.speedFactor * h)
                        }
                        if (j) {
                            if (!f.turnSoundTimer) {
                                this.effects.sheet.spawnOnTarget("shockWallTurn", f);
                                f.turnSoundTimer = l
                            }
                            k = Vec2.assign(c, j);
                            Vec2.rotate90CW(k);
                            Vec2.dot(k,
                                f.slidingWall) > 0 && Vec2.flip(k);
                            h = Vec2.assign(a, 0, 0);
                            Vec2.addMulF(h, f.coll.vel, -0.5);
                            o = Vec2.addMulF(g, k, 128, e);
                            Line2.intersect(h, f.coll.vel, g, o, d) && f.coll.setPos(f.coll.pos.x + d.x, f.coll.pos.y + d.y);
                            Vec2.flip(k);
                            Vec2.assign(f.slidingWall, j);
                            Vec2.assign(f.coll.vel, k);
                            Vec2.length(f.coll.vel, 200 * f.speedFactor * f._getAssistFactor());
                            f.animState.angle = Vec3.clockangle(f.coll.vel);
                            f.blockCheck = 2
                        }
                    }
                }
            }
        },
        shockMoveTrace: function(a, c) {
            if (c.collided) {
                if (Vec2.isZero(a.slidingWall)) {
                    this.effects.sheet.spawnOnTarget("shockWallConnect",
                        a);
                    a.killTimer = a.killTimer / (0.5 * a.speedFactor * a._getAssistFactor())
                } else if (!a.turnSoundTimer) {
                    this.effects.sheet.spawnOnTarget("shockWallTurn", a);
                    a.turnSoundTimer = l
                }
                Vec2.assign(b, c.blockDir);
                Vec2.flip(b);
                Vec2.length(b, 1);
                a.coll.setPos(a.coll.pos.x + b.x, a.coll.pos.y + b.y);
                a.coll._collData.skipPhysics = false;
                Vec2.rotate90CW(b);
                (Vec2.isZero(a.slidingWall) ? Vec2.dot(b, a.coll.vel) : -Vec2.dot(b, a.slidingWall)) < 0 && Vec2.flip(b);
                Vec2.assign(a.slidingWall, c.blockDir);
                Vec2.assign(a.coll.vel, b);
                Vec2.length(a.coll.vel,
                    200 * a.speedFactor * a._getAssistFactor());
                a.animState.angle = Vec3.clockangle(a.coll.vel)
            }
        },
        clearWallSliding: function(a) {
            if (!Vec2.isZero(a.slidingWall)) {
                Vec3.assignC(a.slidingWall, 0, 0);
                Vec2.length(a.coll.vel, 400);
                a.killTimer = a.killTimer * 0.5 * a.speedFactor
            }
        },
        shootFromWall: function(a, c, d) {
            this.clearWallSliding(a);
            c = ig.CollTools.getCenterXYAlignedPos(f, a.coll, c.coll);
            a.setPos(c.x, c.y, c.z);
            Vec2.assign(b, d);
            Vec2.length(b, 400);
            Vec2.length(a.coll.vel, 4);
            Vec2.add(b, a.coll.vel);
            Vec2.assign(a.coll.vel, b);
            Vec2.length(a.coll.vel,
                400);
            a.wallBounces++
        }
    };
    var j = 1.5,
        k = 0.2;
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.element = sc.ELEMENT.WAVE;
            this.effects.perma = this.effects.sheet.spawnOnTarget("ballWave", this, {
                duration: -1,
                offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            })
        },
        update: function() {
            sc.COMPRESSOR_MOVE.waveUpdate(this);
            this.parent()
        },
        onBallHit: function(a) {
            if (a instanceof ig.ENTITY.RegenDestruct) {
                a = this.getCenter(b);
                a = new sc.CircleHitForce(this.combatant, {
                    attack: {
                        type: "MEDIUM",
                        element: "WAVE",
                        damageFactor: 0,
                        spFactor: 0,
                        hints: ["COMPRESSED"]
                    },
                    pos: Vec3.createC(a.x, a.y, this.coll.pos.z),
                    radius: 32,
                    zHeight: 4,
                    duration: 0.1,
                    expandRadius: 0,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 1
                });
                sc.combat.addCombatForce(a)
            }
        },
        collideWith: function(a, b) {
            sc.COMPRESSOR_MOVE.waveCollide(this, a, b);
            this.parent(a, b)
        },
        handleMovementTrace: function(a) {
            sc.COMPRESSOR_MOVE.waveMoveTrace(this,
                a)
        }
    });
    var l = 0.1,
        o = 0;
    sc.CompressedShockEntity = sc.CompressedBaseEntity.extend({
        _wm: new ig.Config({
            spawnable: false,
            attributes: {}
        }),
        slidingWall: Vec2.create(),
        blockCheck: 0,
        turnSoundTimer: 0,
        wallBounces: 0,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.element = sc.ELEMENT.SHOCK;
            this.effects.perma = this.effects.sheet.spawnOnTarget("ballShock", this, {
                duration: -1,
                offset: {
                    x: 0,
                    y: 0,
                    z: 4
                }
            })
        },
        update: function() {
            sc.COMPRESSOR_MOVE.shockUpdate(this);
            this.parent()
        },
        handleMovementTrace: function(a) {
            sc.COMPRESSOR_MOVE.shockMoveTrace(this,
                a)
        },
        shootFromWall: function(a, b) {
            sc.COMPRESSOR_MOVE.shootFromWall(this, a, b)
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            (a = ig.mapStyle.get("anticompressor")) &&
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 16,
                    height: 16,
                    xCount: 1,
                    offX: a.x,
                    offY: a.y
                },
                SUB: [{
                    size: {
                        x: 16,
                        y: 16,
                        z: 0
                    },
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
            this.setCurrentAnim("idle")
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        ballHit: function(a) {
            if (a && a.isCompressor && a.isCompressor()) {
                var b = "suck" + (a.element == sc.ELEMENT.SHOCK ? "Shock" : "Wave"),
                    c = a.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                this.effects.sheet.spawnOnTarget(b, this, {
                    target2Point: c
                });
                a.onCompressorMoveEnd();
                return true
            }
            return false
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type =
                ig.COLLTYPE.TRIGGER;
            this.coll.setSize(8, 8, 24);
            this.coll.zGravityFactor = 1E3;
            this.condition = new ig.VarCondition(d.condition);
            this.dir = ig.ActorEntity.FACE4[d.dir] || ig.ActorEntity.FACE4.NORTH;
            ig.ActorEntity.getFaceVec(this.dir, this.face);
            (a = ig.mapStyle.get("bouncer")) && this.initAnimations({
                DOCTYPE: "MULTI_DIR_ANIMATION",
                sheet: {
                    src: a.sheet,
                    width: 16,
                    height: 32,
                    offX: a.x,
                    offY: a.y,
                    xCount: 4
                },
                dirs: 4,
                flipX: [0, 0, 0, 1],
                tileOffsets: [0, 4, 8, 4],
                size: {
                    x: 16,
                    y: 0,
                    z: 32
                },
                wallY: 0,
                offset: {
                    y: 4
                },
                SUB: [{
                    name: "off",
                    time: 0.1,
                    frames: [0],
                    repeat: false,
                    wallY: 1,
                    offset: {
                        y: -4
                    },
                    size: {
                        x: 16,
                        y: 16,
                        z: 0
                    }
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
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        ballHit: function(a) {
            if (!this.isOn) return false;
            if (a.shootFromWall) {
                a.shootFromWall(this, this.face);
                return true
            }
            return false
        },
        varsChanged: function() {
            var a = this.condition.evaluate();
            if (a != this.isOn)(this.isOn = a) ? this.setCurrentAnim("turnOn", true, "on", true) : this.setCurrentAnim("turnOff", true, "off", true)
        }
    })
});
ig.baked = !0;
