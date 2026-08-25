ig.module("game.feature.puzzle.entities.ferro").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    function b(a, b) {
        for (var c = a.coll, c = ig.game.getEntitiesInRectangle(c.pos.x - 2, c.pos.y - 2, c.pos.z - 0, c.size.x + 4, c.size.y + 4, 2, this), d = c.length; d--;) {
            var e = c[d];
            (e instanceof ig.ENTITY.FerroLine || e instanceof ig.ENTITY.FerroRespawner) && (!e.spot && !e.spotSetting) && e.assignFerroSpot(b)
        }
    }
    var a = Vec2.create(),
        d = Vec3.create(),
        c = null,
        e = null,
        f = null;
    ig.ENTITY.FerroSpot =
        ig.AnimatedEntity.extend({
            state: 0,
            reached: false,
            source: false,
            ferro: null,
            searched: false,
            effects: {
                sheet: new ig.EffectSheet("puzzle.ferro"),
                handle: null
            },
            _wm: new ig.Config({
                spawnable: true,
                attributes: {
                    source: {
                        _type: "Boolean",
                        _info: "If true: is source of Ferro"
                    },
                    variable: {
                        _type: "VarName",
                        _info: "Variable set to true when spot is reached by ferro element. When source: Only spawn if variable is set to true.",
                        _optional: true
                    },
                    activeCondition: {
                        _type: "VarCondition",
                        _info: "Condition for FerroSpot to be active. Source spot disabled: will temporary disable all spots but keep reach state. Other spots disabled: will set reached to false ",
                        _popup: true
                    }
                }
            }),
            init: function(a, b, c, d) {
                this.parent(a, b, c, d);
                this.coll.type = ig.COLLTYPE.TRIGGER;
                this.coll.setSize(32, 32, 24);
                this.source = d.source;
                this.variable = d.variable;
                this.activeCondition = new ig.VarCondition(d.activeCondition);
                if (this.source && !window.wm) e ? this.source = false : e = this;
                this.reached = this.variable ? ig.vars.get(this.variable) : this.source;
                a = ig.mapStyle.get("ferro");
                b = 0;
                a && a.space && (b = 72);
                this.initAnimations({
                    namedSheets: {
                        floor: {
                            src: "media/entity/objects/ferro.png",
                            width: 32,
                            height: 32,
                            xCount: 3,
                            offX: 0,
                            offY: 280 + b
                        },
                        glow: {
                            src: "media/entity/objects/ferro.png",
                            width: 24,
                            height: 24,
                            xCount: 2,
                            offX: 96,
                            offY: 328
                        }
                    },
                    repeat: true,
                    SUB: [{
                        sheet: "floor",
                        frames: [0],
                        time: 0.2,
                        tileOffset: 0,
                        size: {
                            x: 32,
                            y: 32,
                            z: 0
                        },
                        wallY: 0,
                        SUB: [{
                            name: "off"
                        }, {
                            name: "on",
                            tileOffset: 2
                        }, {
                            name: "respawn",
                            tileOffset: 2
                        }, {
                            name: "standby",
                            tileOffset: 1
                        }]
                    }, {
                        sheet: "glow",
                        frames: [0],
                        time: 0.2,
                        tileOffset: 0,
                        renderMode: "lighter",
                        SUB: [{
                            name: "on",
                            tileOffset: 0,
                            offset: {
                                y: -6
                            },
                            size: {
                                x: 24,
                                y: 0,
                                z: 24
                            }
                        }, {
                            name: "on",
                            tileOffset: 1,
                            offset: {
                                y: -16
                            },
                            size: {
                                x: 24,
                                y: 8,
                                z: 16
                            },
                            wallY: 1
                        }]
                    }]
                });
                this.isActive() && (this.source ? this.setCarry(true) : this.setStandby(true))
            },
            show: function(a) {
                this.parent(a);
                if (!a) {
                    this.animState.alpha = 0;
                    ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
                }
                this.source && this.state === 1 && (c || this.spawnFerro(a))
            },
            onKill: function(a) {
                e === this && (e = null);
                f == this && (f = null);
                this.parent(a)
            },
            spawnFerro: function(b) {
                var c = this.getCenter(a);
                this.ferro = ig.game.spawnEntity(sc.FerroEntity, c.x - 8, c.y - 8, this.coll.pos.z + 12, {
                    spot: this
                });
                this.showPermaFx();
                b || this.effects.sheet.spawnOnTarget("appear",
                    this.ferro, {})
            },
            isActive: function() {
                return !this.reached || this.source && !this.activeCondition.evaluate() || !this.source && e && !e.isActive() ? false : true
            },
            showPermaFx: function() {
                this.clearPermaFx();
                this.effects.handle = this.effects.sheet.spawnOnTarget("spotActive", this, {
                    duration: -1
                })
            },
            clearPermaFx: function() {
                if (this.effects.handle) {
                    this.effects.handle.stop();
                    this.effects.handle = null
                }
            },
            setOff: function() {
                this.state = 0;
                this.setCurrentAnim("off")
            },
            setCarry: function(a) {
                this.variable && !ig.vars.get(this.variable) &&
                    ig.vars.set(this.variable, true);
                this.reached = true;
                a || this.effects.sheet.spawnOnTarget(this.state == 0 ? "spotActivate" : "spotTouch", this);
                this.state = 1;
                this.setCurrentAnim("on")
            },
            setStandby: function(a) {
                a || this.effects.sheet.spawnOnTarget("spotRelease", this);
                this.reached = true;
                this.state = 2;
                this.setCurrentAnim("standby");
                this.checkNonSourceInactive()
            },
            setRespawn: function() {
                this.state = 3;
                this.setCurrentAnim("respawn")
            },
            update: function() {
                if (!this.searched) {
                    b(this, this);
                    this.searched = true
                }
                if (this.state == 1 && this.ferro) {
                    var c =
                        ig.CollTools.getDistVec2(this.coll, this.ferro.coll, a);
                    if (Math.abs(c.x) > 28 || Math.abs(c.y) > 28) {
                        this.setStandby();
                        this.ferro = null
                    }
                }
                this.parent()
            },
            ballHit: function(b) {
                if (this.state != 1 && b instanceof sc.FerroEntity) {
                    if (b.state == k.RESPAWN && b.lastSpot != this) return false;
                    var c = ig.CollTools.getDistVec2(b.coll, this.coll, a);
                    if (Vec2.dot(c, b.coll.vel) < 0) return false;
                    if (this.state == 0) b.ignoreTimer = 0.5;
                    this.setCarry();
                    this.ferro = b;
                    b.assignSpot(this);
                    return true
                }
                return false
            },
            varsChanged: function() {
                if (this.isActive() &&
                    this.state === 0)
                    if (this.source) {
                        var a = f || this;
                        a.setCarry();
                        a.spawnFerro();
                        a !== this && this.setStandby()
                    } else this.setStandby();
                else if (!this.isActive() && this.state !== 0) {
                    this.setOff();
                    this.source && c && c.remove()
                }
                this.checkNonSourceInactive()
            },
            checkNonSourceInactive: function() {
                if (!this.source && !this.activeCondition.evaluate() && this.state !== 1) {
                    this.state === 2 && this.setOff();
                    f === this && (f = e);
                    c && c.lastSpot == this && c.assignSpot(e);
                    this.reached = false
                }
            }
        });
    var g = [0],
        h = [1, 2, 3, 4],
        i = [5, 6, 7],
        j = [1];
    ig.ENTITY.FerroLine =
        ig.Entity.extend({
            patterns: null,
            spotSetting: null,
            spot: null,
            state: null,
            timer: 0,
            currentAnim: g,
            _wm: new ig.Config({
                spawnable: true,
                attributes: {
                    spot: {
                        _type: "Entity",
                        _info: "FerroSpot connected to line",
                        _optional: true
                    }
                },
                scalableX: true,
                scalableY: true,
                scalableStep: 8,
                label: function() {
                    return ""
                }
            }),
            init: function(a, b, c, d) {
                this.parent(a, b, c, d);
                this.coll.type = ig.COLLTYPE.TRIGGER;
                this.coll.time.globalStatic = true;
                d.size || this.coll.setSize(8, 8, 0);
                this.spotSetting = d.spot;
                this.patterns = new ig.ImagePatternSheet("media/entity/objects/ferro.png",
                    ig.ImagePattern.OPT.REPEAT_X_OR_Y, 8, 8, 96, 280, 4, 2)
            },
            initSprites: function() {
                this.setSpriteCount(1)
            },
            assignFerroSpot: function(a) {
                this.spot = a;
                this.state = this.spot.state;
                this.updateAnim(true);
                b(this, a)
            },
            update: function() {
                this.spotSetting && !this.spot && this.assignFerroSpot(ig.Event.getEntity(this.spotSetting));
                if (this.spot && this.spot.state != this.state) {
                    this.state = this.spot.state;
                    this.updateAnim(false)
                }
                this.timer = this.timer + ig.system.tick
            },
            updateAnim: function(a) {
                if (this.state == 0) this.currentAnim = g;
                else if (this.state ==
                    1) this.currentAnim = h;
                else if (this.state == 2) this.currentAnim = i;
                else if (this.state == 3) this.currentAnim = j;
                this.timer = a ? this.currentAnim.length * 0.05 : 0
            },
            updateSprites: function() {
                var a = Math.floor(this.timer / 0.05).limit(0, this.currentAnim.length - 1),
                    a = this.currentAnim[a],
                    b = this.coll,
                    c = this.sprites[0];
                c.setPos(b.pos.x, b.pos.y, b.pos.z);
                c.setSize(b.size.x, b.size.y, b.size.z);
                c.setImageSrc(this.patterns.getPattern(a), 0, 0)
            }
        });
    ig.ENTITY.FerroRespawner = ig.AnimatedEntity.extend({
        state: 0,
        hits: 0,
        timer: 0,
        hitSound: new ig.Sound("media/sound/puzzle/ferro-switch-hit.ogg",
            0.9),
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spot: {
                    _type: "Entity",
                    _info: "FerroSpot connected to line",
                    _optional: true
                }
            }
        }),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.spotSetting = d.spot;
            this.initAnimations({
                namedSheets: {
                    floor: {
                        src: "media/entity/objects/ferro.png",
                        width: 16,
                        height: 16,
                        xCount: 3,
                        offX: 0,
                        offY: 312
                    },
                    pole: {
                        src: "media/entity/objects/ferro.png",
                        width: 16,
                        height: 24,
                        xCount: 6,
                        offX: 0,
                        offY: 328
                    }
                },
                repeat: true,
                SUB: [{
                    sheet: "floor",
                    frames: [0],
                    time: 0.033,
                    tileOffset: 0,
                    size: {
                        x: 16,
                        y: 16,
                        z: 0
                    },
                    wallY: 0,
                    SUB: [{
                        name: "off"
                    }, {
                        name: "on",
                        tileOffset: 2
                    }, {
                        name: "poleUp",
                        tileOffset: 2
                    }, {
                        name: "poleDown",
                        tileOffset: 2
                    }, {
                        name: "pole0",
                        tileOffset: 1
                    }, {
                        name: "pole1",
                        tileOffset: 1
                    }, {
                        name: "pole2",
                        tileOffset: 1
                    }, {
                        name: "pole3",
                        tileOffset: 2
                    }, {
                        name: "respawn",
                        tileOffset: 1
                    }]
                }, {
                    sheet: "pole",
                    time: 0.033,
                    tileOffset: 0,
                    size: {
                        x: 16,
                        y: 0,
                        z: 24
                    },
                    repeat: false,
                    offset: {
                        y: -4
                    },
                    SUB: [{
                        name: "poleUp",
                        frames: [5, 4, 3, 2, 1]
                    }, {
                        name: "poleDown",
                        frames: [3, 4, 5]
                    }, {
                        name: "pole0",
                        frames: [0]
                    }, {
                        name: "pole1",
                        frames: [1]
                    }, {
                        name: "pole2",
                        frames: [2]
                    }, {
                        name: "pole3",
                        frames: [3]
                    }, {
                        name: "respawn",
                        frames: [0, 1, 2]
                    }]
                }]
            })
        },
        assignFerroSpot: function(a) {
            this.spot = a;
            this.updateState(true);
            b(this, a)
        },
        updateState: function(a) {
            var b = this.state;
            this.state = this.spot.state;
            this.hits = 0;
            if (this.state == 2) {
                this.coll.setType(ig.COLLTYPE.VIRTUAL);
                a ? this.setCurrentAnim("pole0") : this.setCurrentAnim("poleUp", true, "pole0", true)
            } else if (this.state == 0) {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                b == 2 && !a ? this.setCurrentAnim("poleDown", true, "off",
                    true) : this.setCurrentAnim("off")
            } else if (this.state == 1) {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                b != 0 && !a ? this.setCurrentAnim("poleDown", true, "on", true) : this.setCurrentAnim("on")
            } else if (this.state == 3) {
                this.coll.setType(ig.COLLTYPE.VIRTUAL);
                this.setCurrentAnim("respawn", true, "pole3")
            }
        },
        update: function() {
            this.spotSetting && !this.spot && this.assignFerroSpot(ig.Event.getEntity(this.spotSetting));
            if (this.hits) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.hits--;
                    this.timer = 0.05;
                    this.updateHitAnim()
                }
            }
            this.spot &&
                this.spot.state != this.state && this.updateState(false);
            this.parent()
        },
        ballHit: function(a) {
            if (this.state != 2) return false;
            this.hits++;
            this.timer = 0.3;
            ig.SoundHelper.playAtEntity(this.hitSound, this, false, {
                speed: this.hits * 0.05 + 1 - 3 * 0.05
            });
            this.updateHitAnim();
            if (this.hits < 3) sc.combat.showHitEffect(this, a.getHitCenter(this, d), sc.ATTACK_TYPE.LIGHT, a.getElement(), false, false, true, [1]);
            else {
                sc.combat.showHitEffect(this, a.getHitCenter(this, d), sc.ATTACK_TYPE.MASSIVE, a.getElement(), false, false, true, [1]);
                c.respawn(this.spot)
            }
            return true
        },
        updateHitAnim: function() {
            this.setCurrentAnim("pole" + this.hits, true)
        }
    });
    var k = {
            IDLE: {
                start: function(a) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("idle"));
                    a.resetColl()
                },
                update: function() {
                    return false
                },
                onQuickStop: function(a) {
                    Vec2.mulF(a.coll.vel, 0.5)
                }
            },
            RESPAWN: {
                noInterrupt: true,
                noMerge: true,
                start: function(a) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    Vec3.assign(a.mergeStartPos, a.coll.pos);
                    var b = a.distanceTo(a.lastSpot);
                    a.mergeTimer = (b / 640).limit(0.3, 1);
                    a.timer = a.mergeTimer;
                    a.lastSpot.setRespawn();
                    a.effects.handle = a.effects.sheet.spawnOnTarget("respawn", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    })
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    var b = KEY_SPLINES.EASE_IN.get(Math.max(0, a.timer / a.mergeTimer)),
                        c = a.lastSpot.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                    Vec3.addC(c, -8, -8, 12);
                    b = Vec3.lerp(c, a.mergeStartPos, b, d);
                    a.setPos(b.x, b.y, b.z, true);
                    if (a.timer <= 0) {
                        a.startZ = b.z;
                        a.setState(k.IDLE);
                        Vec3.assignC(a.coll.vel, 0, 0)
                    }
                }
            },
            DELETE: {
                noInterrupt: true,
                noMerge: true,
                start: function(a) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    Vec3.assign(a.mergeStartPos, a.coll.pos);
                    var b = a.distanceTo(a.lastSpot);
                    a.mergeTimer = (b / 640).limit(0.1, 1);
                    a.timer = a.mergeTimer;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("delete", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    })
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    var b = KEY_SPLINES.EASE_IN.get(Math.max(0, a.timer / a.mergeTimer)),
                        c = a.lastSpot.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                    Vec3.addC(c, -8, -8, 12);
                    b = Vec3.lerp(c, a.mergeStartPos, b, d);
                    a.setPos(b.x, b.y, b.z, true);
                    a.timer <= 0 && a.kill()
                }
            },
            GATE_ABSORB: {
                noInterrupt: true,
                noMerge: true,
                start: function(a) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.timer = 0.3;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("delete", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    ig.vars.set("tmp.ferroGateAbsorb", true)
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    a.timer <= 0 && a.kill()
                }
            },
            BARRIER_BREAK: {
                start: function(a) {
                    a.resetColl();
                    a.coll.bounciness = 0.001;
                    a.coll.friction.air = 0.4;
                    a.timer = 0.1;
                    Vec2.length(a.coll.vel, 200);
                    Vec2.assign(a.coll.accelDir, a.coll.vel);
                    a.coll.maxVel = 200
                },
                update: function(a) {
                    Vec2.assign(a.coll.vel,
                        a.coll.accelDir);
                    Vec2.length(a.coll.vel, 200);
                    a.timer = a.timer - ig.system.tick;
                    a.timer <= 0 && a.setState(k.IDLE)
                }
            },
            NEUTRAL: {
                start: function(a, b, c) {
                    a.coll.bounciness = 0;
                    a.coll.friction.air = 0.4;
                    a.coll.float.height = 12;
                    a.effects.sheet.spawnOnTarget("hit", a, {
                        duration: 0,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.setCurrentAnim(a.getAbsorbAnim("bounce"), true, a.getAbsorbAnim("idle"), true);
                    Vec2.assign(a.coll.vel, b);
                    Vec2.length(a.coll.vel, c.isBall ? 300 : 250);
                    return true
                },
                update: function(a) {
                    a.setState(k.IDLE)
                }
            },
            BOUNCE_BACK: {
                start: function(a,
                    b) {
                    a.coll.bounciness = 0;
                    a.coll.friction.air = 0.4;
                    a.coll.float.height = 12;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("bounceAway", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.setCurrentAnim(a.getAbsorbAnim("bounce"), true, a.getAbsorbAnim("idle"), true);
                    Vec2.assign(a.coll.vel, b);
                    Vec2.rotate(a.coll.vel, (Math.random() > 0.5 ? 0.25 : -0.25) * 2 * Math.PI);
                    Vec2.length(a.coll.vel, 700);
                    a.coll.bounciness = 1;
                    a.coll.friction.air = 0;
                    a.coll.float.variance = 2;
                    a.coll.float.maxSpeed = 400;
                    a.coll.float.accel = 10;
                    a.timer = 0.25;
                    return true
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    if (a.timer <= 0) {
                        a.timer = 0;
                        Vec2.mulF(a.coll.vel, 0.3);
                        a.setState(k.IDLE)
                    }
                }
            },
            BOUNCE_BACK_BORDER: {
                start: function(a, b) {
                    a.coll.bounciness = 0;
                    a.coll.friction.air = 0.4;
                    a.coll.float.height = 12;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("bounceAway", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.setCurrentAnim(a.getAbsorbAnim("bounce"), true, a.getAbsorbAnim("idle"), true);
                    Vec2.assign(a.coll.vel, b);
                    Vec2.length(a.coll.vel, 400);
                    a.coll.bounciness = 1;
                    a.coll.friction.air = 0;
                    a.coll.float.variance = 2;
                    a.coll.float.maxSpeed = 400;
                    a.coll.float.accel = 10;
                    a.timer = 0.2;
                    return true
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    if (a.timer <= 0) {
                        a.timer = 0;
                        Vec2.mulF(a.coll.vel, 0.3);
                        a.setState(k.IDLE)
                    }
                }
            },
            BOUNCE_BACK_SMALL: {
                start: function(a, b) {
                    a.coll.bounciness = 0;
                    a.coll.friction.air = 0.4;
                    a.coll.float.height = 12;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("bounceAway", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.setCurrentAnim(a.getAbsorbAnim("bounce"), true, a.getAbsorbAnim("idle"), true);
                    Vec2.assign(a.coll.vel, b);
                    Vec2.rotate(a.coll.vel, (Math.random() > 0.5 ? 0.1 : -0.1) * 2 * Math.PI);
                    Vec2.length(a.coll.vel, 350);
                    a.coll.bounciness = 1;
                    a.coll.friction.air = 0;
                    a.coll.float.variance = 2;
                    a.coll.float.maxSpeed = 400;
                    a.coll.float.accel = 10;
                    a.timer = 0.25;
                    return true
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    if (a.timer <= 0) {
                        a.timer = 0;
                        Vec2.mulF(a.coll.vel, 0.3);
                        a.setState(k.IDLE)
                    }
                }
            },
            HEAT: {
                start: function(a, b, c) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("heat"), true, null, true);
                    Vec2.assign(a.coll.vel,
                        b);
                    Vec2.round(a.coll.vel, Math.PI * 0.03);
                    b = c.attackInfo && c.attackInfo.hasHint("CHARGED");
                    a.timer = c.isBall && !b ? 0.2 : 0.4;
                    Vec2.length(a.coll.vel, 400);
                    a.effects.handle = a.effects.sheet.spawnOnTarget("heatHit", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        },
                        rotateFace: -1
                    });
                    a.coll.bounciness = 0;
                    a.coll.friction.air = 0;
                    a.coll.float.height = 12;
                    a.coll.float.variance = 2;
                    a.coll.float.maxSpeed = 400;
                    a.coll.float.accel = 10;
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.HEAT,
                        hints: ["FERRO"]
                    });
                    return true
                },
                update: function(a) {
                    a.coll.bounciness = 1;
                    a.animState.angle = Vec2.clockangle(a.coll.vel);
                    a.timer = a.timer - ig.system.tick;
                    if (a.timer <= 0)
                        if (a.effects.handle) {
                            a.setCurrentAnim(a.getAbsorbAnim("idle"));
                            Vec2.mulF(a.coll.vel, 0.6);
                            a.resetColl(true);
                            a.timer = 0.3
                        } else {
                            a.timer = 0;
                            a.setState(k.IDLE)
                        }
                },
                onQuickStop: function(a) {
                    Vec2.mulF(a.coll.vel, 0.5);
                    a.timer = 0
                }
            },
            COLD: {
                start: function(a, b) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("cold"), true, null, true);
                    Vec2.assign(a.coll.vel, b);
                    a.timer = 0.7;
                    a.coll.bounciness = 0;
                    a.coll.zBounciness = 0.7;
                    a.coll.friction.ground = 0.4;
                    a.coll.friction.air = 0.05;
                    Vec2.length(a.coll.vel, 350);
                    var c = Math.min(120, Math.max(0, ig.CollTools.getJumpSpeedToHeight(a.coll, a.startZ + 16)));
                    a.coll.vel.z = c;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("coldHit", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.COLD,
                        hints: ["FERRO"]
                    });
                    a.coll.float.height = 0;
                    return true
                },
                update: function(a) {
                    a.timer = a.timer - ig.system.tick;
                    if (a.effects.handle) {
                        a.animState.angle = a.animState.angle + ig.system.tick * 3;
                        a.timer <= 0 && a.coll.pos.z == a.coll.baseZPos ? this.breakIce(a) : a.coll.pos.z == a.coll.baseZPos && Vec2.length(a.coll.vel) < 25 && this.breakIce(a)
                    } else a.timer <= 0 && a.setState(k.IDLE)
                },
                breakIce: function(a) {
                    a.overlapActivateCheck();
                    a.timer = 0;
                    Vec2.mulF(a.coll.vel, 0.5);
                    a.startZ = a.coll.baseZPos + 12;
                    a.resetColl(true);
                    a.setCurrentAnim(a.getAbsorbAnim("idle"));
                    a.timer = 0.3
                },
                onTouchGround: function(a, b) {
                    a.effects.sheet.spawnOnTarget("coldLand", a, {
                        duration: 0,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    (b < -200 || a.timer <= 0) && this.breakIce(a)
                },
                onQuickStop: function(a) {
                    Vec2.mulF(a.coll.vel, 0.15);
                    a.timer = 0
                }
            },
            SHOCK: {
                noBarrierStop: true,
                start: function(a, b, c) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("shock"), true, null, true);
                    b = c.attackInfo && c.attackInfo.hasHint("CHARGED");
                    a.timer = c.isBall && !b ? 0.25 : 0.5;
                    a.effects.handle = a.effects.sheet.spawnOnTarget("shockHit", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        },
                        target2: ig.game.playerEntity
                    });
                    a.coll.bounciness = 0;
                    a.coll.friction.air =
                        0;
                    a.coll.float.height = 12;
                    a.coll.float.variance = 2;
                    a.coll.float.maxSpeed = 400;
                    a.coll.float.accel = 10;
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.SHOCK,
                        hints: ["FERRO"]
                    });
                    return true
                },
                update: function(b) {
                    b.timer = b.timer - ig.system.tick;
                    if (b.effects.handle) {
                        var c = ig.CollTools.getDistVec2(b.coll, ig.game.playerEntity.coll, a);
                        if (Vec2.length(c) < 32) {
                            Vec2.mulF(b.coll.vel, 0.1);
                            b.resetColl(true);
                            b.setCurrentAnim(b.getAbsorbAnim("idle"));
                            b.timer = 0.3
                        } else if (b.timer <= 0) {
                            Vec2.mulF(b.coll.vel,
                                0.6);
                            b.setCurrentAnim(b.getAbsorbAnim("idle"));
                            b.resetColl(true);
                            b.timer = 0.3
                        } else {
                            Vec2.assign(b.coll.vel, c);
                            Vec2.length(b.coll.vel, 400)
                        }
                    } else if (b.timer <= 0) {
                        b.timer = 0;
                        b.setState(k.IDLE)
                    }
                },
                onQuickStop: function(a) {
                    Vec2.mulF(a.coll.vel, 0.5);
                    a.timer = 0
                }
            },
            WAVE: {
                start: function(a, b, c) {
                    if (c.isBall && c.attackInfo && c.attackInfo.hasHint("CHARGED")) {
                        a.coll.setType(ig.COLLTYPE.IGNORE);
                        a.setTeleportBall(c);
                        a.setCurrentAnim(a.getAbsorbAnim("wave"), true, null, true);
                        a.effects.sheet.spawnOnTarget("waveHit", a, {
                            duration: -1,
                            offset: {
                                x: 0,
                                y: 0,
                                z: 4
                            },
                            target2: c
                        })
                    } else a.setState(k.IDLE);
                    return false
                },
                update: function() {}
            },
            BOMB_FLY: {
                noInterrupt: true,
                start: function(a, b) {
                    var c = a.coll;
                    c.maxVel = 400;
                    c.weight = 2E3;
                    Vec2.assign(c.accelDir, b);
                    Vec2.assign(c.vel, b);
                    Vec2.length(c.vel, 400);
                    a.timer = 2;
                    a.effects.handle = a.effects.bomb.spawnOnTarget("bombHeatTrail", a, {
                        duration: -1,
                        angle: Vec2.clockangle(b),
                        offset: {
                            z: 2
                        }
                    })
                },
                update: function(a) {
                    if (a.coll.totalBlockTimer > 0 || a.coll.partlyBlockTimer > 0) this.explode(a);
                    else {
                        a.timer = a.timer - ig.system.tick;
                        a.timer <= 0 && this.explode(a)
                    }
                },
                explode: function(a) {
                    var b = a.getAlignedPos(ig.ENTITY_ALIGN.CENTER, Vec3.create());
                    a.effects.bomb.spawnFixed("explosion", b.x, b.y, b.z);
                    b.z = b.z - 24;
                    a.panel && a.panel.onBombExplode();
                    b = new sc.CircleHitForce(ig.game.playerEntity, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 2,
                            spFactor: 0,
                            hints: ["BOMB", "FERRO_IGNORE"],
                            noHack: true
                        },
                        pos: b,
                        radius: 8,
                        zHeight: 40,
                        duration: 0.1,
                        expandRadius: 40,
                        alwaysFull: true,
                        party: "OTHER"
                    });
                    Vec2.assignC(a.coll.vel, 0, 0);
                    Vec2.assignC(a.coll.accelDir,
                        0, 0);
                    sc.combat.addCombatForce(b);
                    a.clearAbsorbState();
                    a.setState(k.IDLE)
                }
            },
            ICEDISK: {
                start: function(a) {
                    a.setCurrentAnim("icedisk", true, null, true);
                    var b = a.coll;
                    b.float.height = 0;
                    b.weight = 2E5;
                    b.friction.air = 0.2;
                    Vec3.assignC(b.vel, 0, 0, 150);
                    b.zBounciness = 0;
                    b.bounciness = 1;
                    a.mergeEntity = null;
                    a.effects.bubble.spawnOnTarget("iceAppear", a, {})
                },
                update: function() {},
                ballHit: function(a, b, c, d) {
                    if (c.isBall && c.attackInfo && !c.attackInfo.hasHint("CHARGED")) return true;
                    if (d === sc.ELEMENT.HEAT) {
                        a.panel && a.panel.onBubbleBurst();
                        a.resetColl();
                        a.clearAbsorbState();
                        a.setState(k.IDLE);
                        a.effects.bubble.spawnOnTarget("iceMeltFerror", a, {})
                    } else a.setState(k.ICEDISK_SLIDE, b, c);
                    return true
                },
                onTouchGround: function(a, b) {
                    a.overlapActivateCheck();
                    var c = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                    b < -30 && a.effects.bubble.spawnFixed("iceLand", c.x, c.y, c.z, null, {})
                }
            },
            ICEDISK_SLIDE: {
                noInterrupt: true,
                start: function(a, b) {
                    var c = a.coll;
                    c.setType(ig.COLLTYPE.IGNORE);
                    c.friction.ground = 0;
                    c.friction.air = 0;
                    c.maxVel = 400;
                    c.weight = 9001;
                    c.noSlipping = true;
                    c.zBounciness = 0;
                    c.bounciness = 1;
                    Vec2.assign(c.vel, b);
                    Vec2.length(c.vel, 400);
                    a.timer = 1.5;
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.COLD,
                        hints: ["ICE_DISK", "FERRO"]
                    });
                    a.remainingHits = 5;
                    a.effects.handle = a.effects.bubble.spawnOnTarget("iceTrail", a, {
                        duration: -1,
                        angle: Vec2.clockangle(b),
                        offset: {
                            z: 2
                        }
                    })
                },
                update: function() {},
                onMoveTrace: function(a, b) {
                    if (b.collided) {
                        var c = a.getCenter();
                        c.x = c.x + b.blockDir.x * a.coll.size.x / 2.05;
                        c.y = c.y + b.blockDir.y * a.coll.size.y / 2.05;
                        if (a.remainingHits) {
                            a.remainingHits--;
                            a.effects.bubble.spawnFixed("iceBounce", c.x, c.y, a.coll.pos.z, null, {
                                angle: Vec2.clockangle(b.blockDir)
                            })
                        } else this.iceBreak(a)
                    }
                },
                iceBreak: function(a) {
                    var b = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                    a.effects.bubble.spawnFixed("iceBreak", b.x, b.y, b.z, null, {});
                    a.startZ = a.coll.baseZPos + 12;
                    a.panel && a.panel.onBubbleBurst();
                    a.resetColl();
                    a.clearAbsorbState();
                    a.setState(k.IDLE);
                    a.effects.sheet.spawnOnTarget("absorbRegen", a)
                },
                onAttackHit: function(a) {
                    this.iceBreak(a)
                },
                ballHitFilter: function(a) {
                    return a instanceof
                    ig.ENTITY.RegenDestruct
                },
                onOtherBallHit: function(a) {
                    a.consume()
                }
            },
            WAVE_COMPRESSOR: {
                noInterrupt: true,
                start: function(a, b, c) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("waveCompressor"), true, null, true);
                    a.element = sc.ELEMENT.WAVE;
                    a.timer = -0.4;
                    a.fastMode = c.fastMode;
                    a.phaseMode = false;
                    a.phaseTraveled = 0;
                    a.wallKillTimer = 0;
                    a.enterWall.timer = 0;
                    a.speedFactor = c.speedFactor;
                    Vec2.assignC(a.enterWall.dir, 0, 0);
                    a.setMergeEntity(c);
                    a.coll.float.height = 0;
                    a.coll.zGravityFactor = 0;
                    a.coll.vel.z = 0;
                    a.coll.accelSpeed = 0;
                    a.coll.friction.air = 0;
                    a.coll.friction.ground = 0;
                    a.coll.bounciness = 1;
                    Vec2.assign(a.savedDir, b);
                    a.animState.angle = Vec3.clockangle(a.coll.vel);
                    a.effects.perma = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("ballWave", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("chargeFinalWave", a, {
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.WAVE,
                        hints: ["COMPRESSED", "FERRO"]
                    })
                },
                update: function(a) {
                    if (a.timer <
                        0) {
                        a.timer = a.timer + ig.system.tick;
                        Vec2.assignC(a.coll.vel, 0, 0);
                        if (a.timer >= 0) {
                            a.timer = 10;
                            Vec2.assign(a.coll.vel, a.savedDir);
                            Vec2.length(a.coll.vel, 400);
                            a.effects.trail = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("trailWave", a, {
                                duration: -1,
                                offset: {
                                    x: 0,
                                    y: 0,
                                    z: 4
                                }
                            })
                        }
                    }
                    if (a.timer > 0) {
                        sc.COMPRESSOR_MOVE.waveUpdate(a);
                        a.timer = a.timer - ig.system.tick * a._getAssistFactor();
                        if (a.timer <= 0) {
                            a.timer = 0;
                            a.onCompressorMoveEnd(a.phaseMode)
                        }
                    }
                },
                onMoveTrace: function(a, b) {
                    sc.COMPRESSOR_MOVE.waveMoveTrace(a, b)
                },
                onCollideWith: function(a,
                    b, c) {
                    sc.COMPRESSOR_MOVE.waveCollide(a, b, c)
                },
                onOtherBallHit: function(a, b) {
                    sc.COMPRESSOR_MOVE.waveBallHit(a, b);
                    if (b instanceof ig.ENTITY.WaveTeleport) this.onCompressorMoveEnd()
                }
            },
            SHOCK_COMPRESSOR: {
                noInterrupt: true,
                start: function(a, b, c) {
                    a.coll.setType(ig.COLLTYPE.IGNORE);
                    a.setCurrentAnim(a.getAbsorbAnim("shockCompressor"), true, null, true);
                    a.element = sc.ELEMENT.SHOCK;
                    a.timer = -0.4;
                    a.fastMode = c.fastMode;
                    Vec2.assign(a.slidingWall, c.slidingWall);
                    a.blockCheck = c.blockCheck;
                    a.turnSoundTimer = c.turnSoundTimer;
                    a.wallBounces =
                        c.wallBounces;
                    a.speedFactor = c.speedFactor;
                    a.setMergeEntity(c);
                    a.coll.float.height = 0;
                    a.coll.zGravityFactor = 0;
                    a.coll.vel.z = 0;
                    a.coll.accelSpeed = 0;
                    a.coll.friction.air = 0;
                    a.coll.friction.ground = 0;
                    a.coll.bounciness = 1;
                    Vec2.assign(a.savedDir, c.coll.vel);
                    a.animState.angle = Vec3.clockangle(a.coll.vel);
                    a.effects.handle = a.effects.sheet.spawnOnTarget("shockCompressor", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.effects.perma = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("ballShock", a, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("chargeFinalShock", a, {
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    a.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                        element: sc.ELEMENT.SHOCK,
                        hints: ["COMPRESSED", "FERRO"]
                    })
                },
                update: function(a) {
                    a.killCloseRegenDestruct(24);
                    if (a.timer < 0) {
                        Vec2.assignC(a.coll.vel, 0, 0);
                        a.timer = a.timer + ig.system.tick;
                        if (a.timer >= 0) {
                            a.timer = 10 / a.speedFactor;
                            Vec2.assign(a.coll.vel, a.savedDir);
                            a.effects.trail = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("trailShock", a, {
                                duration: -1,
                                offset: {
                                    x: 0,
                                    y: 0,
                                    z: 4
                                }
                            })
                        }
                    }
                    if (a.timer > 0) {
                        sc.COMPRESSOR_MOVE.shockUpdate(a);
                        a.timer = a.timer - ig.system.tick * a._getAssistFactor();
                        if (a.timer <= 0) {
                            a.timer = 0;
                            a.onCompressorMoveEnd(false)
                        }
                    }
                },
                onMoveTrace: function(a, b) {
                    sc.COMPRESSOR_MOVE.shockMoveTrace(a, b)
                },
                shootFromWall: function(a, b, c) {
                    sc.COMPRESSOR_MOVE.shootFromWall(a, b, c)
                },
                onOtherBallHit: function() {}
            }
        },
        l = {
            anims: {
                idle: "bomb",
                bounce: "bomb",
                shock: "bombShock"
            },
            start: function() {},
            elementReact: [sc.ELEMENT.HEAT],
            ballHit: function(a, b, c) {
                a.resetColl();
                a.setState(k.BOMB_FLY,
                    b, c);
                return true
            },
            onReset: function(a) {
                a.panel && a.panel.onBombExplode()
            }
        },
        o = {
            anims: {
                idle: "bubble",
                bounce: "bubble",
                shock: "bubble"
            },
            start: function() {},
            elementReact: [sc.ELEMENT.HEAT, sc.ELEMENT.COLD],
            ballHit: function(a, b, c, d) {
                d == sc.ELEMENT.HEAT && this.steam(a, b, c.getCombatantRoot());
                if (d == sc.ELEMENT.COLD) {
                    a.resetColl();
                    a.setState(k.ICEDISK, b, c)
                }
                return true
            },
            steam: function(a, b, c) {
                var d = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                a.effects.bubble.spawnFixed("steamExplosion", d.x, d.y, d.z, null, {
                    angle: Vec2.clockangle(b)
                });
                d.z = d.z - 8;
                a.panel && a.panel.onBubbleBurst();
                c = new sc.CircleHitForce(c, {
                    attack: {
                        type: "MASSIVE",
                        element: "HEAT",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["STEAM", "FERRO_IGNORE"],
                        noHack: true
                    },
                    pos: d,
                    radius: 8,
                    zHeight: 16,
                    duration: 0.2,
                    expandRadius: 60,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 0.3,
                    dir: ig.copy(b)
                });
                sc.combat.addCombatForce(c);
                a.resetColl();
                a.clearAbsorbState();
                a.setState(k.IDLE);
                Vec2.assign(a.coll.vel, b);
                Vec2.length(a.coll.vel, 120);
                Vec2.flip(a.coll.vel);
                a.effects.sheet.spawnOnTarget("absorbRegen", a)
            },
            onReset: function(a) {
                a.panel && a.panel.onBubbleBurst()
            }
        };
    sc.FerroEntity = ig.AnimatedEntity.extend({
        state: null,
        absorbState: null,
        timer: 0,
        ignoreTimer: 0,
        startZ: 0,
        teleportBall: null,
        panel: null,
        mergeTimer: 0,
        mergeEntity: null,
        mergeStartPos: Vec3.create(),
        attackInfo: null,
        savedDir: Vec2.create(),
        element: null,
        combatant: null,
        collisionList: [],
        collReleaseTimer: 0,
        collReleaseTimeList: [],
        fastMode: false,
        speedFactor: 1,
        phaseMode: false,
        phaseTraveled: 0,
        wallKillTimer: 0,
        enterWall: {
            timer: 0,
            dir: Vec2.create()
        },
        slidingWall: Vec2.create(),
        blockCheck: 0,
        turnSoundTimer: 0,
        wallBounces: 0,
        startCollType: ig.COLLTYPE.IGNORE,
        lastSpot: null,
        effects: {
            sheet: new ig.EffectSheet("puzzle.ferro"),
            bomb: new ig.EffectSheet("puzzle.bomb"),
            bubble: new ig.EffectSheet("puzzle.water-bubble"),
            handle: null,
            hitHandle: null,
            perma: null,
            trail: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                }
            }
        }),
        init: function(a, b, d, e) {
            this.parent(a, b, d, e);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16,
                16, 24);
            this.startZ = d;
            this.coll.setPadding(2, 2);
            this.state = k.IDLE;
            this.lastSpot = e.spot || null;
            a = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
            a.setOffset(0, 4, 0);
            ig.light.addLightHandle(a);
            this.initAnimations({
                shapeType: "Y_FLAT",
                wallY: 0,
                sheet: {
                    src: "media/entity/objects/ferro.png",
                    width: 32,
                    height: 40,
                    xCount: 8,
                    offX: 0,
                    offY: 0
                },
                repeat: true,
                offset: {
                    x: 0,
                    y: 0,
                    z: -6
                },
                SUB: [{
                        name: "idle",
                        frames: [0, 1, 2, 3],
                        time: 0.2,
                        tileOffset: 0
                    }, {
                        name: "bounce",
                        frames: [2, 2, 3, 0, 1, 1, 0],
                        time: 0.05,
                        tileOffset: 4,
                        repeat: false
                    },
                    {
                        name: "bomb",
                        frames: [0, 1, 2, 3],
                        time: 0.1,
                        tileOffset: 16
                    }, {
                        name: "bombShock",
                        frames: [0, 1, 2, 3],
                        time: 0.1,
                        tileOffset: 16
                    }, {
                        name: "heat",
                        frames: [0, 1, 2, 3],
                        time: 0.05,
                        tileOffset: 20
                    }, {
                        name: "bubble",
                        frames: [0, 1, 2, 3],
                        time: 0.1,
                        tileOffset: 24
                    }, {
                        name: "icedisk",
                        frames: [0, 1, 2, 3],
                        time: 0.1,
                        tileOffset: 28,
                        repeat: false
                    }, {
                        name: "cold",
                        frames: [0, 1, 2, 3],
                        time: 0.0833,
                        tileOffset: 32,
                        repeat: false
                    }, {
                        name: "shock",
                        frames: [0, 1, 2, 3],
                        time: 0.05,
                        tileOffset: 40
                    }, {
                        name: "shockCompressor",
                        frames: [-1],
                        time: 0.05,
                        tileOffset: 40,
                        offset: {
                            y: 6,
                            z: 0
                        }
                    }, {
                        name: "bombShock",
                        frames: [0, 1, 2, 3],
                        time: 0.05,
                        tileOffset: 40
                    }, {
                        name: "wave",
                        frames: [0, 1, 2, 3],
                        time: 0.05,
                        tileOffset: 52
                    }, {
                        name: "waveCompressor",
                        frames: [0, 1, 2, 3],
                        time: 0.05,
                        tileOffset: 60,
                        offset: {
                            y: 6,
                            z: 0
                        }
                    }
                ]
            });
            this.setCurrentAnim("idle");
            this.resetColl();
            c = this;
            f = null
        },
        remove: function(a) {
            this.lastSpot.clearPermaFx();
            f = this.lastSpot;
            c = null;
            if (this.absorbState) {
                this.absorbState.onReset(this);
                this.clearAbsorbState()
            }
            this.resetColl();
            a ? this.setState(k.GATE_ABSORB) : this.setState(k.DELETE)
        },
        respawn: function(a) {
            a && this.assignSpot(a);
            if (this.absorbState) {
                this.absorbState.onReset(this);
                this.clearAbsorbState()
            }
            this.resetColl();
            this.setState(k.RESPAWN)
        },
        isRespawning: function() {
            return this.state == k.RESPAWN
        },
        assignSpot: function(a) {
            if (this.lastSpot != a) {
                this.lastSpot && this.lastSpot.clearPermaFx();
                this.lastSpot = a;
                a.showPermaFx()
            }
        },
        resetColl: function(a) {
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.coll.zGravityFactor = 1;
            this.coll.float.height = 12;
            this.coll.float.variance = 2;
            this.coll.float.accel = 2;
            this.coll.relativeVel = 1;
            this.coll.maxVel = 200;
            this.coll.shadow.size = 16;
            this.coll.zBounciness = 0.5;
            this.coll.bounciness = 0;
            this.coll.accelSpeed = 1;
            this.coll.friction.ground = 0.4;
            this.coll.friction.air = 0.4;
            this.coll.weight = 200;
            this.animState.angle = 0;
            this.coll.noSlipping = false;
            this.speedFactor = 1;
            Vec2.assignC(this.coll.accelDir, 0, 0);
            this.clearTeleportBall();
            if (this.effects.perma) {
                this.effects.perma.stop();
                this.effects.perma = null
            }
            if (this.effects.trail) {
                this.effects.trail.stop();
                this.effects.trail = null
            }
            if (this.effects.handle) {
                this.effects.handle.stop();
                this.effects.handle = null
            }
            if (!a) this.attackInfo = null
        },
        getAbsorbAnim: function(a) {
            return !this.absorbState ? a : this.absorbState.anims[a] || a
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this, {})
            }
        },
        onKill: function(a) {
            c === this && (c = null);
            this.parent(a)
        },
        update: function() {
            var a = this.coll;
            if (this.ignoreTimer) {
                this.ignoreTimer = this.ignoreTimer - ig.system.tick;
                if (this.ignoreTimer <= 0) this.ignoreTimer = 0
            }
            if (a.pos.z < ig.game.minLevelZ) this.respawn();
            else if (a.pos.z == a.baseZPos) {
                a = ig.terrain.getTerrain(this.coll, true);
                ig.terrain.isFallTerrain(a) && this.respawn()
            }
            this.collReleaseTimer = this.collReleaseTimer + ig.system.tick;
            if (this.collReleaseTimeList.length > 0 && this.collReleaseTimeList[0] <= this.collReleaseTimer) {
                this.collisionList.shift();
                this.collReleaseTimeList.shift()
            }
            this.handleSurrounding();
            if (this.mergeEntity) {
                ig.CollTools.getDistVec2(this.coll, this.mergeEntity.coll, this.coll.vel);
                Vec2.mulF(this.coll.vel, 8);
                this.mergeTimer = this.mergeTimer - ig.system.tick;
                a = Math.max(0, this.mergeTimer / 0.1);
                a = Vec3.lerp(this.mergeEntity.coll.pos, this.mergeStartPos, a, d);
                this.setPos(a.x, a.y, this.coll.pos.z, true);
                if (this.mergeTimer <= 0) {
                    this.mergeTimer = 0;
                    this.mergeEntity = null
                }
            }
            this.state.update(this);
            if (this.coll.float.height) {
                this.updateStartZ();
                this.coll.float.height = Math.max(12, this.startZ - this.coll.baseZPos)
            }
            this.parent()
        },
        handleSurrounding: function() {
            var a = this.coll;
            if (this.state == k.IDLE) {
                for (var b = -2, b = ig.game.getEntitiesInRectangle(a.pos.x - b, a.pos.y - b, a.pos.z - 14, a.size.x +
                        b * 2, a.size.y + b * 2, 32, this), c = b.length, d = 0, e = null; c--;) {
                    var f = b[c];
                    if (f instanceof ig.ActorEntity) {
                        var g = ig.CollTools.getGroundDistance(f.coll, this.coll);
                        if (!e || g < d) {
                            d = g;
                            e = f
                        }
                    }
                }
                if (e) {
                    ig.CollTools.getDistVec2(e.coll, this.coll, this.coll.accelDir);
                    this.coll.maxVel = 200;
                    this.coll.relativeVel = 0.15
                } else {
                    b = 2;
                    b = ig.game.getEntitiesInRectangle(a.pos.x - b, a.pos.y - b, a.pos.z - 14, a.size.x + b * 2, a.size.y + b * 2, 32, this);
                    c = b.length;
                    d = 0;
                    for (e = null; c--;) {
                        f = b[c];
                        if (this.isCloseInEntity(f)) {
                            g = ig.CollTools.getGroundDistance(f.coll,
                                this.coll);
                            if (!e || g < d) {
                                d = g;
                                e = f
                            }
                        }
                    }
                    if (e) {
                        ig.CollTools.getDistVec2(this.coll, e.coll, this.coll.accelDir);
                        this.coll.maxVel = 200;
                        this.coll.relativeVel = Math.min(0.25, d / 80)
                    } else Vec2.assignC(this.coll.accelDir, 0, 0)
                }
            }
        },
        isCloseInEntity: function(a) {
            return a instanceof ig.ENTITY.FerroSpot || a instanceof ig.ENTITY.OneTimeSwitch && a.isOn && a.activeTime ? true : false
        },
        updateStartZ: function() {
            if (this.coll.baseZPos > this.startZ) this.startZ = this.coll.baseZPos + 12
        },
        setState: function(a, b, c) {
            this.state = a;
            return this.state.start(this,
                b, c)
        },
        setAbsorbState: function(a, b, c) {
            this.effects.sheet.spawnOnTarget("absorb", this, {
                target2Point: b.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
            });
            b.absorbFerro(this);
            this.absorbState = a;
            this.absorbState.start(this, b);
            this.setMergeEntity(b);
            this.panel = c;
            this.setState(k.IDLE)
        },
        setMergeEntity: function(a) {
            this.mergeEntity = a;
            this.mergeTimer = 0.1;
            Vec3.assign(this.mergeStartPos, this.coll.pos)
        },
        clearAbsorbState: function() {
            this.absorbState = this.panel = null
        },
        ballHit: function(b) {
            if (!this.teleportBall && !this.state.noInterrupt &&
                !this.ignoreTimer) {
                var c = b.getHitCenter(this),
                    d = b.getElement(),
                    e = b.getCombatant().getCombatantRoot();
                if (b.attackInfo && b.attackInfo.hasHint("FERRO_IGNORE") || b instanceof sc.FerroWaveAttack || sc.bounceSwitchGroups.isBallOfAnyGroup(b)) return false;
                this.combatant = e;
                e = b.getHitVel(this, a);
                if (b.attackInfo && b.attackInfo.hasHint("FERRO_BOUNCE")) {
                    this.resetColl();
                    return this.setState(k.BOUNCE_BACK, e, b)
                }
                if (b.attackInfo && b.attackInfo.hasHint("FERRO_BOUNCE")) {
                    this.resetColl();
                    return this.setState(k.BOUNCE_BACK,
                        e, b)
                }
                if (b.attackInfo && b.attackInfo.hasHint("FERRO_BOUNCE_BORDER")) {
                    this.resetColl();
                    return this.setState(k.BOUNCE_BACK_BORDER, e, b)
                }
                if (b.attackInfo && b.attackInfo.hasHint("FERRO_BOUNCE_SMALL")) {
                    if (this.state == k.IDLE) {
                        this.resetColl();
                        return this.setState(k.BOUNCE_BACK_SMALL, e, b)
                    }
                } else {
                    if (this.state.ballHit) return this.state.ballHit(this, e, b, d);
                    if (this.absorbState && this.absorbState.elementReact.indexOf(d) !== -1) return this.absorbState.ballHit(this, e, b, d);
                    this.updateStartZ();
                    this.resetColl();
                    var f = k.NEUTRAL;
                    if (b instanceof sc.CompressedWaveEntity) {
                        b.destroy();
                        f = k.WAVE_COMPRESSOR
                    } else if (b instanceof sc.CompressedShockEntity) {
                        b.destroy();
                        f = k.SHOCK_COMPRESSOR
                    } else if (d == sc.ELEMENT.HEAT) f = k.HEAT;
                    else if (d == sc.ELEMENT.COLD) f = k.COLD;
                    else if (d == sc.ELEMENT.SHOCK) f = k.SHOCK;
                    else if (d == sc.ELEMENT.WAVE) f = k.WAVE;
                    sc.combat.showHitEffect(this, c, sc.ATTACK_TYPE.LIGHT, d, false, false, true);
                    return this.setState(f, e, b)
                }
            }
        },
        collideWith: function(a, b) {
            if (this.state != k.DELETE && this.state != k.GATE_ABSORB) {
                if (this.state.onCollideWith) this.state.onCollideWith(this,
                    a, b);
                if (this.collisionList.indexOf(a) == -1)
                    if (a.name == "ferroGate") this.remove(true);
                    else {
                        if (!this.absorbState && !this.state.noMerge) {
                            if (a instanceof sc.BombEntity) {
                                this.setAbsorbState(l, a, a.panel);
                                return
                            }
                            if (a instanceof sc.WaterBubbleEntity) {
                                this.setAbsorbState(o, a, a.panel);
                                return
                            }
                            if (a instanceof sc.IceDiskEntity) {
                                this.setAbsorbState(o, a, a.panel);
                                this.setState(k.ICEDISK, b, null);
                                return
                            }
                        }
                        if (this.attackInfo && (a.damage && a.party != sc.COMBATANT_PARTY.PLAYER) && a.damage(this, this.attackInfo)) {
                            this.collisionList.push(a);
                            this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                            if (this.state.onAttackHit) this.state.onAttackHit(this, a)
                        } else if (a instanceof ig.ENTITY.RegenDestruct && !this.state.noInterrupt)
                            if (this.attackInfo && a.ballHit(this)) {
                                this.collisionList.push(a);
                                this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                                this.killCloseRegenDestruct(32, a);
                                !this.mergeEntity && !this.state.noBarrierStop && this.setState(k.BARRIER_BREAK)
                            } else {
                                if (this.state != k.BARRIER_BREAK && !this.state.noBarrierStop) {
                                    this.setState(k.IDLE);
                                    Vec2.length(this.coll.vel);
                                    ig.CollTools.getDistVec2(a.coll, this.coll, this.coll.vel);
                                    Vec2.length(this.coll.vel, 100)
                                }
                            }
                        else if (a instanceof ig.ENTITY.FerroSpot || a instanceof ig.ENTITY.OneTimeSwitch && a.switchType == "ferroSwitch") {
                            if (!(a instanceof ig.ENTITY.FerroSpot && a.state != 0 && sc.model.isCombatActive())) {
                                var c = a instanceof ig.ENTITY.FerroSpot || !a.hasOverlap && a.activeTime && a.timer + 0.05 < a.activeTime;
                                if (a.ballHit(this) && c && this.state.onQuickStop) this.state.onQuickStop(this, a instanceof ig.ENTITY.FerroSpot)
                            }
                        } else if (a.ballHit &&
                            this.state.onOtherBallHit && (!this.state.ballHitFilter || this.state.ballHitFilter(a)) && a.ballHit(this)) {
                            if (this.state.onOtherBallHit) this.state.onOtherBallHit(this, a, b);
                            this.collisionList.push(a);
                            this.collReleaseTimeList.push(this.collReleaseTimer + 0.5)
                        }
                    }
            }
        },
        overlapActivateCheck: function() {
            for (var a = ig.game.getOverlapEntities(this), b = a.length; b--;) this.collideWith(a[b], null)
        },
        killCloseRegenDestruct: function(a, b) {
            for (var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d), c = ig.game.getEntitiesInCircle(c, a,
                    1, 4, null, null, null, b), e = c.length; e--;) {
                var f = c[e];
                f instanceof ig.ENTITY.RegenDestruct && f.ballHit(this)
            }
        },
        onPhysicsSquish: function() {
            this.respawn()
        },
        onTouchGround: function(a) {
            if (this.state.onTouchGround) this.state.onTouchGround(this, a)
        },
        handleMovementTrace: function(a) {
            if (this.state.onMoveTrace) this.state.onMoveTrace(this, a);
            this.parent(a)
        },
        setTeleportBall: function(a) {
            this.teleportBall = a;
            a.addEntityAttached(this)
        },
        clearTeleportBall: function() {
            if (this.teleportBall) {
                this.teleportBall.removeEntityAttached(this);
                this.teleportBall = null
            }
        },
        onEntityKillDetach: function() {
            this.teleportBall = null;
            this.setState(k.IDLE)
        },
        doTeleport: function() {
            this.teleportBall = null;
            this.startZ = this.coll.pos.z;
            this.setState(k.IDLE)
        },
        onTeleportStart: function(a) {
            ig.game.spawnEntity(sc.FerroWaveAttack, this.coll.pos.x - 16, this.coll.pos.y - 16, this.coll.pos.z, {
                waveTeleporter: a
            })
        },
        getTeleportZOffset: function() {
            return 12
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a, b)
        },
        getHitVel: function(a, b) {
            var c = b || {};
            Vec2.assign(c, this.coll.vel);
            return c
        },
        getElement: function() {
            return this.attackInfo.element
        },
        getCombatant: function() {
            return ig.game.playerEntity
        },
        getCombatantRoot: function() {
            return ig.game.playerEntity
        },
        getAttackInfo: function() {
            return this.attackInfo
        },
        isWaterBubble: function() {
            return this.absorbState == o && !(this.state == k.ICEDISK || this.state == k.ICEDISK_SLIDE)
        },
        isIceDisk: function() {
            return this.state == k.ICEDISK_SLIDE
        },
        steam: function(a, b) {
            o.steam(this, a, b)
        },
        isCompressor: function() {
            return this.state == k.WAVE_COMPRESSOR || this.state ==
                k.SHOCK_COMPRESSOR
        },
        consume: function() {
            this.panel && this.panel.onBubbleBurst();
            this.resetColl();
            this.clearAbsorbState();
            this.setState(k.IDLE);
            this.startZ = this.coll.baseZPos + 12;
            this.effects.sheet.spawnOnTarget("absorbRegen", this);
            Vec2.mulF(this.coll.vel, -0.2)
        },
        onCompressorMoveEnd: function(a) {
            if (a) this.respawn();
            else {
                this.resetColl();
                Vec2.length(this.coll.vel, 150);
                this.setState(k.IDLE)
            }
        },
        _getAssistFactor: function() {
            return this.fastMode ? 1 : sc.options.get("assist-puzzle-speed")
        },
        isBallAdjust: function() {
            return sc.model.player.currentElementMode ==
                sc.ELEMENT.WAVE ? false : true
        },
        doBallAdjust: function(a, b, c) {
            this.getCenter(a);
            Vec3.assign(c, this.coll.size);
            if (this.state == k.ICEDISK) return 5;
            sc.model.player.currentElementMode == sc.ELEMENT.SHOCK && ig.CollTools.getDistVec2(this.coll, ig.game.playerEntity.coll, b);
            return sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? 5 : 0
        },
        isBallDestroyer: function() {
            return this.state == k.ICEDISK && sc.model.player.currentElementMode == sc.ELEMENT.HEAT || this.absorbState == o && (sc.model.player.currentElementMode == sc.ELEMENT.HEAT ||
                sc.model.player.currentElementMode == sc.ELEMENT.COLD) ? true : false
        },
        shootFromWall: function(a, b) {
            this.state.shootFromWall && this.state.shootFromWall(this, a, b)
        }
    });
    sc.FerroWaveAttack = ig.Entity.extend({
        startPos: Vec3.create(),
        targetPos: Vec3.create(),
        combatant: null,
        attackInfo: null,
        collisionList: [],
        timer: 0,
        startedMove: false,
        effects: {
            sheet: new ig.EffectSheet("puzzle.ferro"),
            handle: null
        },
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(48, 48, 24);
            this.coll.zGravityFactor =
                0;
            d.waveTeleporter.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, this.targetPos);
            this.targetPos.z = this.targetPos.z + 8;
            this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, this.startPos);
            this.combatant = ig.game.playerEntity;
            this.party = this.combatant.party;
            this.attackInfo = new sc.AttackInfo(this.combatant.params, {
                element: sc.ELEMENT.WAVE,
                hints: ["COMPRESSED", "FERRO"]
            });
            this.timer = 0.5;
            this.effects.sheet.spawnFixed("waveConnect", this.startPos.x, this.startPos.y, this.startPos.z + 4, this, {
                duration: 0.4,
                target2Point: this.targetPos,
                target2Offset: {
                    x: 0,
                    y: 0,
                    z: 8
                }
            })
        },
        update: function() {
            this.timer = this.timer - ig.system.tick;
            if (this.timer < 0.2) {
                if (!this.startedMove) {
                    this.startedMove = true;
                    var a = Vec3.clockangle(Vec3.sub(this.targetPos, this.startPos, d));
                    this.effects.sheet.spawnOnTarget("waveBall", this, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        }
                    });
                    this.effects.sheet.spawnOnTarget("waveBallTrail", this, {
                        duration: -1,
                        offset: {
                            x: 0,
                            y: 0,
                            z: 4
                        },
                        angle: a
                    })
                }
                a = Math.min(1, 1 - this.timer / 0.2);
                a = Vec3.lerp(this.startPos, this.targetPos, a, d);
                this.setPos(a.x - this.coll.size.x /
                    2, a.y - this.coll.size.y / 2, a.z, true)
            }
            if (this.timer <= 0) {
                this.timer = 0;
                this.kill()
            } else this.parent()
        },
        collideWith: function(a) {
            if (this.attackInfo && (a.damage || a.ballHit) && this.collisionList.indexOf(a) == -1 && !(a instanceof sc.FerroEntity)) a.damage && a.party != this.combatant.party ? a.damage(this, this.attackInfo) && this.collisionList.push(a) : a.ballHit && a.ballHit(this) && (this._killed || this.collisionList.push(a))
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a, b)
        },
        getHitVel: function(a, b) {
            var c = b || {};
            Vec2.assign(c, this.coll.vel);
            return c
        },
        getElement: function() {
            return this.attackInfo.element
        },
        getCombatant: function() {
            return this.combatant
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot()
        },
        getAttackInfo: function() {
            return this.attackInfo
        }
    })
});
ig.baked = !0;
