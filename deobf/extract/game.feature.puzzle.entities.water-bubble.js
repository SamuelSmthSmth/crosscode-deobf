ig.module("game.feature.puzzle.entities.water-bubble").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create();
    Vec3.create();
    ig.ENTITY.WaterBubblePanel = ig.AnimatedEntity.extend({
        respawnTimer: 0,
        currentBubble: null,
        active: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                coalCoolTime: {
                    _type: "Number",
                    _info: "Time coal will be cooled by ice disks created from these bubbles",
                    _optional: true
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble")
        },
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(24, 24, 0);
            this.coll.zGravityFactor = 1E3;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 24,
                    height: 24,
                    xCount: 2,
                    offX: 0,
                    offY: 112
                },
                SUB: [{
                    name: "on",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "off",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "blink",
                    time: 0.04,
                    frames: [0],
                    repeat: false
                }, {
                    name: "blink",
                    time: 0.02,
                    frames: [1, 1, 1,
                        1, 1, 1, 1, 1
                    ],
                    framesAlpha: [0, 0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2],
                    repeat: true
                }]
            });
            this.coalCoolTime = e.coalCoolTime;
            this.setCurrentAnim("on")
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {})
            }
            this.coll.zGravityFactor = 1E3;
            this.active = true;
            this.spawnBubble(a)
        },
        onHideRequest: function() {
            this.active = false;
            this.coll.zGravityFactor = 0;
            this.coll.vel.z = 0;
            if (this.currentBubble) {
                this.currentBubble.panel = null;
                this.currentBubble.isIdle() && this.currentBubble.burst()
            }
            ig.game.effects.teleport.spawnOnTarget("hideDefault",
                this, {
                    callback: this
                })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        update: function() {
            if (this.respawnTimer) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                this.respawnTimer <= 0 && this.spawnBubble()
            }
            this.parent()
        },
        spawnBubble: function(a) {
            if (this.active) {
                this.respawnTimer = 0;
                this.setCurrentAnim("on");
                var d = this.getCenter(b),
                    d = ig.game.spawnEntity(sc.WaterBubbleEntity, d.x, d.y, this.coll.pos.z + 8, {
                        panel: this,
                        coalCoolTime: this.coalCoolTime
                    });
                if (!a) {
                    this.effects.sheet.spawnOnTarget("appear", d, {});
                    d.noSteamFrames =
                        2
                }
                this.currentBubble = d
            }
        },
        onBubbleStart: function() {
            this.setCurrentAnim("off")
        },
        onBubbleBurst: function() {
            this.currentBubble = null;
            this.setCurrentAnim("blink");
            this.respawnTimer = 1.5
        }
    });
    Vec2.create();
    sc.WaterBubbleEntity = ig.AnimatedEntity.extend({
        panel: null,
        state: 1,
        timer: 0,
        startZ: 0,
        combatant: null,
        heatMode: false,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble"),
            handle: null,
            hitHandle: null
        },
        cameraHandle: null,
        noHeatFocus: false,
        target: null,
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.coll.bounciness = 0.5;
            this.coll.setSize(20, 20, 16);
            this.coll.friction.air = 0.2;
            this.coll.maxVel = 125;
            this.coll.float.height = 8;
            this.startZ = c;
            this.coll.float.variance = 2;
            this.coll.shadow.size = 16;
            this.coll.setPos(a - this.coll.size.x / 2, b - this.coll.size.y / 2, c);
            this.panel = e.panel || null;
            this.coalCoolTime = e.coalCoolTime;
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: -3,
                    z: 0
                },
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 24,
                    height: 24,
                    xCount: 4,
                    offX: 128,
                    offY: 16
                },
                SUB: [{
                    name: "idle",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: true
                }]
            });
            this.setCurrentAnim("idle");
            if (e.target) {
                this.coll.bounciness = 1;
                this.followTarget(e.target, e.targetTime)
            }
            if (e.combatant) this.combatant = e.combatant
        },
        absorbFerro: function() {
            this.panel && this.panel.onBubbleStart();
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            this.kill()
        },
        isIdle: function() {
            return this.state == 1
        },
        followTarget: function(a, b) {
            this.target = a;
            this.state = 2;
            this.timer = b;
            ig.CollTools.getDistVec2(this.coll,
                this.target.coll, this.coll.accelDir);
            Vec2.assign(this.coll.vel, this.coll.accelDir);
            Vec2.length(this.coll.vel, this.coll.maxVel);
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.effects.sheet.spawnOnTarget("selfExplode", this, {
                duration: -1
            })
        },
        bounce: function(a, b) {
            if (this.state == 1) this.state = 3;
            if (this.coll.baseZPos > this.startZ) this.startZ = this.coll.baseZPos + 8;
            Vec2.assign(this.coll.vel, a);
            Vec2.length(this.coll.vel, b || 180);
            if (!this.timer) {
                this.timer = 10 / sc.options.get("assist-puzzle-speed");
                this.panel && this.panel.onBubbleStart()
            }
            if (this.effects.hitHandle) {
                this.effects.hitHandle.setCallback(null);
                this.effects.hitHandle.stop()
            }
            this.effects.hitHandle = this.effects.sheet.spawnOnTarget("hit", this, {
                callback: this
            })
        },
        setLastSecond: function() {
            this.state = 4;
            this.effects.handle = this.effects.sheet.spawnOnTarget("almostBurst", this, {
                duration: -1
            })
        },
        instantKill: function() {
            if (!(this._killed || this.state == 5)) {
                this.state = 5;
                this.panel && this.panel.onBubbleBurst();
                this.kill()
            }
        },
        burst: function() {
            if (!(this._killed || this.state == 5)) {
                this.state = 5;
                if (this.effects.handle) {
                    this.effects.handle.stop();
                    this.effects.handle =
                        null
                }
                this.effects.sheet.spawnOnTarget("burst", this, {
                    callback: this,
                    align: "CENTER"
                });
                this.panel && this.panel.onBubbleBurst()
            }
        },
        onEffectEvent: function(a) {
            if (!this._killed && a.state == ig.EFFECT_STATE.ENDED) a == this.effects.hitHandle ? this.effects.hitHandle = null : this.kill()
        },
        steam: function(a, b) {
            if (!this._killed) {
                var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                this.effects.sheet.spawnFixed("steamExplosion", c.x, c.y, c.z, null, {
                    angle: Vec2.clockangle(a)
                });
                c.z = c.z - 8;
                this.panel && this.panel.onBubbleBurst();
                if (b) {
                    c = new sc.CircleHitForce(b, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 1,
                            spFactor: 0,
                            hints: ["STEAM"],
                            noHack: true
                        },
                        pos: c,
                        radius: 8,
                        zHeight: 16,
                        duration: 0.2,
                        expandRadius: 60,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 0.3,
                        dir: ig.copy(a)
                    });
                    sc.combat.addCombatForce(c)
                }
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                this.kill()
            }
        },
        circularSteam: function(a) {
            if (!this._killed) {
                var b = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                this.effects.sheet.spawnFixed("steamExplosion2",
                    b.x, b.y, b.z, null, {});
                b.z = b.z - 8;
                this.panel && this.panel.onBubbleBurst();
                if (a = a || this.combatant) {
                    b = new sc.CircleHitForce(a, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 1,
                            spFactor: 0,
                            hints: ["STEAM"],
                            noHack: true
                        },
                        pos: b,
                        radius: 8,
                        zHeight: 16,
                        duration: 0.2,
                        expandRadius: 32,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 1
                    });
                    sc.combat.addCombatForce(b)
                }
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                this.kill()
            }
        },
        turnIce: function() {
            if (!this._killed) {
                this.panel && this.panel.onBubbleStart();
                var a = this.getCenter(b);
                ig.game.spawnEntity(sc.IceDiskEntity, a.x, a.y, this.coll.pos.z + 8, {
                    panel: this.panel,
                    coalCoolTime: this.coalCoolTime
                });
                this.kill()
            }
        },
        update: function() {
            this.noSteamFrames && this.noSteamFrames--;
            if (this.target) {
                ig.CollTools.getDistVec2(this.coll, this.target.coll, b);
                Vec2.rotateToward(this.coll.accelDir, b, Math.PI * 0.5 * ig.system.tick);
                this.coll.float.height = Math.max(8, this.target.coll.pos.z + 12 - this.coll.baseZPos);
                Vec2.length(b) < 48 && this.circularSteam()
            } else if (this.state != 1) this.coll.float.height =
                Math.max(8, this.startZ - this.coll.baseZPos);
            else if (this.panel) this.startZ = this.panel.coll.pos.z + 8;
            if (this.state != 5 && this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && (this.target ? this.circularSteam() : this.burst());
                this.state == 3 && this.timer <= 3 && this.setLastSecond()
            }
            this.parent()
        },
        ballHit: function(a) {
            var d = a.getElement();
            if (d != sc.ELEMENT.HEAT && a.party != sc.COMBATANT_PARTY.PLAYER || this.state == 5) return false;
            var c = a.getHitCenter(this),
                e = a.getHitVel(this, b);
            d == sc.ELEMENT.HEAT ? this.noSteamFrames ?
                this.instantKill() : a.attackInfo && a.attackInfo.hasHint("STEAM") ? this.circularSteam(a.getCombatantRoot()) : this.steam(e, a.getCombatantRoot()) : d == sc.ELEMENT.COLD ? this.turnIce(e) : this.bounce(e, 120);
            d = sc.ATTACK_TYPE.LIGHT;
            if (!a.isBall || a.attackInfo.hasHint("CHARGED")) d = sc.ATTACK_TYPE.MEDIUM;
            sc.combat.showHitEffect(this, c, d, a.getElement(), false, false, true);
            return true
        },
        isWaterBubble: function() {
            return true
        },
        isBallAdjust: function() {
            return true
        },
        doBallAdjust: function(a, b, c) {
            this.getCenter(a);
            Vec3.assign(c,
                this.coll.size);
            return 0
        },
        isBallDestroyer: function() {
            return sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? true : false
        }
    })
});
ig.baked = !0;
