/**
 * game.feature.puzzle.entities.ferro
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.ferro")`.
 *
 * Ferro (liquid metal) puzzle: `ig.ENTITY.FerroSpot` sources and
 * `ig.ENTITY.FerroLine` beams connect the chain; `sc.FerroEntity` is the
 * flowing ferro with `sc.FerroWaveAttack`, plus `ig.ENTITY.FerroRespawner`
 * to restore the chain.
 */
ig.module("game.feature.puzzle.entities.ferro").requires("impact.base.entity", "impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    function searchFerroEntities(spot) {
        for (var coll = spot.coll, entities = ig.game.getEntitiesInRectangle(coll.pos.x - 2, coll.pos.y - 2, coll.pos.z - 0, coll.size.x + 4, coll.size.y + 4, 2, this), i = entities.length; i--;) {
            var entity = entities[i];
            if ((entity instanceof ig.ENTITY.FerroLine || entity instanceof ig.ENTITY.FerroRespawner) && (!entity.spot && !entity.spotSetting)) entity.assignFerroSpot(spot);
        }
    }
    var tmpVec2 = Vec2.create(),
        tmpVec3 = Vec3.create(),
        currentFerro = null,
        lastFerroSpot = null,
        spawnSpot = null;
    ig.ENTITY.FerroSpot = ig.AnimatedEntity.extend({
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(32, 32, 24);
            this.source = settings.source;
            this.variable = settings.variable;
            this.activeCondition = new ig.VarCondition(settings.activeCondition);
            if (this.source && !window.wm) {
                if (currentFerro) this.source = false;
                else currentFerro = this;
            }
            this.reached = this.variable ? ig.vars.get(this.variable) : this.source;
            var mapStyle = ig.mapStyle.get("ferro"),
                yOffset = 0;
            if (mapStyle && mapStyle.space) yOffset = 72;
            this.initAnimations({
                namedSheets: {
                    floor: {
                        src: "media/entity/objects/ferro.png",
                        width: 32,
                        height: 32,
                        xCount: 3,
                        offX: 0,
                        offY: 280 + yOffset
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
                    size: { x: 32, y: 32, z: 0 },
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
                        offset: { y: -6 },
                        size: { x: 24, y: 0, z: 24 }
                    }, {
                        name: "on",
                        tileOffset: 1,
                        offset: { y: -16 },
                        size: { x: 24, y: 8, z: 16 },
                        wallY: 1
                    }]
                }]
            });
            if (this.isActive() && (this.source ? this.setCarry(true) : this.setStandby(true))) {}
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this, {});
            }
            if (this.source && this.state === 1 && (!currentFerro || currentFerro == this)) this.spawnFerro(show);
        },
        onKill: function(entity) {
            if (currentFerro === this) currentFerro = null;
            if (spawnSpot == this) spawnSpot = null;
            this.parent(entity);
        },
        spawnFerro: function(alreadyShown) {
            var center = this.getCenter(tmpVec2);
            this.ferro = ig.game.spawnEntity(sc.FerroEntity, center.x - 8, center.y - 8, this.coll.pos.z + 12, {
                spot: this
            });
            this.showPermaFx();
            if (!alreadyShown) this.effects.sheet.spawnOnTarget("appear", this.ferro, {});
        },
        isActive: function() {
            return !this.reached || (this.source && !this.activeCondition.evaluate()) || (!this.source && currentFerro && !currentFerro.isActive()) ? false : true;
        },
        showPermaFx: function() {
            this.clearPermaFx();
            this.effects.handle = this.effects.sheet.spawnOnTarget("spotActive", this, {
                duration: -1
            });
        },
        clearPermaFx: function() {
            if (this.effects.handle) {
                this.effects.handle.stop();
                this.effects.handle = null;
            }
        },
        setOff: function() {
            this.state = 0;
            this.setCurrentAnim("off");
        },
        setCarry: function(silent) {
            if (this.variable && !ig.vars.get(this.variable)) ig.vars.set(this.variable, true);
            this.reached = true;
            if (!silent) this.effects.sheet.spawnOnTarget(this.state == 0 ? "spotActivate" : "spotTouch", this);
            this.state = 1;
            this.setCurrentAnim("on");
        },
        setStandby: function(silent) {
            if (!silent) this.effects.sheet.spawnOnTarget("spotRelease", this);
            this.reached = true;
            this.state = 2;
            this.setCurrentAnim("standby");
            this.checkNonSourceInactive();
        },
        setRespawn: function() {
            this.state = 3;
            this.setCurrentAnim("respawn");
        },
        update: function() {
            if (!this.searched) {
                searchFerroEntities(this);
                this.searched = true;
            }
            if (this.state == 1 && this.ferro) {
                var dist = ig.CollTools.getDistVec2(this.coll, this.ferro.coll, tmpVec2);
                if (Math.abs(dist.x) > 28 || Math.abs(dist.y) > 28) {
                    this.setStandby();
                    this.ferro = null;
                }
            }
            this.parent();
        },
        ballHit: function(ferro) {
            if (this.state != 1 && ferro instanceof sc.FerroEntity) {
                if (ferro.state == FerroState.RESPAWN && ferro.lastSpot != this) return false;
                var dist = ig.CollTools.getDistVec2(ferro.coll, this.coll, tmpVec2);
                if (Vec2.dot(dist, ferro.coll.vel) < 0) return false;
                if (this.state == 0) ferro.ignoreTimer = 0.5;
                this.setCarry();
                this.ferro = ferro;
                ferro.assignSpot(this);
                return true;
            }
            return false;
        },
        varsChanged: function() {
            if (this.isActive() && this.state === 0)
                if (this.source) {
                    var spot = spawnSpot || this;
                    spot.setCarry();
                    spot.spawnFerro();
                    if (spot !== this) this.setStandby();
                } else this.setStandby();
            else if (!this.isActive() && this.state !== 0) {
                this.setOff();
                if (this.source && currentFerro) currentFerro.remove();
            }
            this.checkNonSourceInactive();
        },
        checkNonSourceInactive: function() {
            if (!this.source && !this.activeCondition.evaluate() && this.state !== 1) {
                if (this.state === 2) this.setOff();
                if (spawnSpot === this) spawnSpot = currentFerro;
                if (currentFerro && currentFerro.lastSpot == this) currentFerro.assignSpot(currentFerro);
                this.reached = false;
            }
        }
    });
    var OffPattern = [0],
        OnPattern = [1, 2, 3, 4],
        StandbyPattern = [5, 6, 7],
        RespawnPattern = [1];
    ig.ENTITY.FerroLine = ig.Entity.extend({
        patterns: null,
        spotSetting: null,
        spot: null,
        state: null,
        timer: 0,
        currentAnim: OffPattern,
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
                return "";
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.time.globalStatic = true;
            if (!settings.size) this.coll.setSize(8, 8, 0);
            this.spotSetting = settings.spot;
            this.patterns = new ig.ImagePatternSheet("media/entity/objects/ferro.png", ig.ImagePattern.OPT.REPEAT_X_OR_Y, 8, 8, 96, 280, 4, 2);
        },
        initSprites: function() {
            this.setSpriteCount(1);
        },
        assignFerroSpot: function(spot) {
            this.spot = spot;
            this.state = this.spot.state;
            this.updateAnim(true);
            searchFerroEntities(spot);
        },
        update: function() {
            if (this.spotSetting && !this.spot) this.assignFerroSpot(ig.Event.getEntity(this.spotSetting));
            if (this.spot && this.spot.state != this.state) {
                this.state = this.spot.state;
                this.updateAnim(false);
            }
            this.timer = this.timer + ig.system.tick;
        },
        updateAnim: function(instant) {
            if (this.state == 0) this.currentAnim = OffPattern;
            else if (this.state == 1) this.currentAnim = OnPattern;
            else if (this.state == 2) this.currentAnim = StandbyPattern;
            else if (this.state == 3) this.currentAnim = RespawnPattern;
            this.timer = instant ? this.currentAnim.length * 0.05 : 0;
        },
        updateSprites: function() {
            var frame = Math.floor(this.timer / 0.05).limit(0, this.currentAnim.length - 1),
                frame = this.currentAnim[frame],
                coll = this.coll,
                sprite = this.sprites[0];
            sprite.setPos(coll.pos.x, coll.pos.y, coll.pos.z);
            sprite.setSize(coll.size.x, coll.size.y, coll.size.z);
            sprite.setImageSrc(this.patterns.getPattern(frame), 0, 0);
        }
    });
    ig.ENTITY.FerroRespawner = ig.AnimatedEntity.extend({
        state: 0,
        hits: 0,
        timer: 0,
        hitSound: new ig.Sound("media/sound/puzzle/ferro-switch-hit.ogg", 0.9),
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.spotSetting = settings.spot;
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
                    size: { x: 16, y: 16, z: 0 },
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
                    size: { x: 16, y: 0, z: 24 },
                    repeat: false,
                    offset: { y: -4 },
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
            });
        },
        assignFerroSpot: function(spot) {
            this.spot = spot;
            this.updateState(true);
            searchFerroEntities(spot);
        },
        updateState: function(instant) {
            var prevState = this.state;
            this.state = this.spot.state;
            this.hits = 0;
            if (this.state == 2) {
                this.coll.setType(ig.COLLTYPE.VIRTUAL);
                if (instant) this.setCurrentAnim("pole0");
                else this.setCurrentAnim("poleUp", true, "pole0", true);
            } else if (this.state == 0) {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                if (prevState == 2 && !instant) this.setCurrentAnim("poleDown", true, "off", true);
                else this.setCurrentAnim("off");
            } else if (this.state == 1) {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                if (prevState != 0 && !instant) this.setCurrentAnim("poleDown", true, "on", true);
                else this.setCurrentAnim("on");
            } else if (this.state == 3) {
                this.coll.setType(ig.COLLTYPE.VIRTUAL);
                this.setCurrentAnim("respawn", true, "pole3");
            }
        },
        update: function() {
            if (this.spotSetting && !this.spot) this.assignFerroSpot(ig.Event.getEntity(this.spotSetting));
            if (this.hits) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.hits--;
                    this.timer = 0.05;
                    this.updateHitAnim();
                }
            }
            if (this.spot && this.spot.state != this.state) this.updateState(false);
            this.parent();
        },
        ballHit: function(ball) {
            if (this.state != 2) return false;
            this.hits++;
            this.timer = 0.3;
            ig.SoundHelper.playAtEntity(this.hitSound, this, false, {
                speed: this.hits * 0.05 + 1 - 3 * 0.05
            });
            this.updateHitAnim();
            if (this.hits < 3) sc.combat.showHitEffect(this, ball.getHitCenter(this, tmpVec3), sc.ATTACK_TYPE.LIGHT, ball.getElement(), false, false, true, [1]);
            else {
                sc.combat.showHitEffect(this, ball.getHitCenter(this, tmpVec3), sc.ATTACK_TYPE.MASSIVE, ball.getElement(), false, false, true, [1]);
                currentFerro.respawn(this.spot);
            }
            return true;
        },
        updateHitAnim: function() {
            this.setCurrentAnim("pole" + this.hits, true);
        }
    });
    var FerroState = {
        IDLE: {
            start: function(ferro) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("idle"));
                ferro.resetColl();
            },
            update: function() {
                return false;
            },
            onQuickStop: function(ferro) {
                Vec2.mulF(ferro.coll.vel, 0.5);
            }
        },
        RESPAWN: {
            noInterrupt: true,
            noMerge: true,
            start: function(ferro) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                Vec3.assign(ferro.mergeStartPos, ferro.coll.pos);
                var distance = ferro.distanceTo(ferro.lastSpot);
                ferro.mergeTimer = (distance / 640).limit(0.3, 1);
                ferro.timer = ferro.mergeTimer;
                ferro.lastSpot.setRespawn();
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("respawn", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                var progress = KEY_SPLINES.EASE_IN.get(Math.max(0, ferro.timer / ferro.mergeTimer)),
                    spotPos = ferro.lastSpot.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3);
                Vec3.addC(spotPos, -8, -8, 12);
                progress = Vec3.lerp(spotPos, ferro.mergeStartPos, progress, tmpVec3);
                ferro.setPos(progress.x, progress.y, progress.z, true);
                if (ferro.timer <= 0) {
                    ferro.startZ = progress.z;
                    ferro.setState(FerroState.IDLE);
                    Vec3.assignC(ferro.coll.vel, 0, 0);
                }
            }
        },
        DELETE: {
            noInterrupt: true,
            noMerge: true,
            start: function(ferro) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                Vec3.assign(ferro.mergeStartPos, ferro.coll.pos);
                var distance = ferro.distanceTo(ferro.lastSpot);
                ferro.mergeTimer = (distance / 640).limit(0.1, 1);
                ferro.timer = ferro.mergeTimer;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("delete", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                var progress = KEY_SPLINES.EASE_IN.get(Math.max(0, ferro.timer / ferro.mergeTimer)),
                    spotPos = ferro.lastSpot.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3);
                Vec3.addC(spotPos, -8, -8, 12);
                progress = Vec3.lerp(spotPos, ferro.mergeStartPos, progress, tmpVec3);
                ferro.setPos(progress.x, progress.y, progress.z, true);
                if (ferro.timer <= 0) ferro.kill();
            }
        },
        GATE_ABSORB: {
            noInterrupt: true,
            noMerge: true,
            start: function(ferro) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.timer = 0.3;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("delete", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ig.vars.set("tmp.ferroGateAbsorb", true);
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0) ferro.kill();
            }
        },
        BARRIER_BREAK: {
            start: function(ferro) {
                ferro.resetColl();
                ferro.coll.bounciness = 0.001;
                ferro.coll.friction.air = 0.4;
                ferro.timer = 0.1;
                Vec2.length(ferro.coll.vel, 200);
                Vec2.assign(ferro.coll.accelDir, ferro.coll.vel);
                ferro.coll.maxVel = 200;
            },
            update: function(ferro) {
                Vec2.assign(ferro.coll.vel, ferro.coll.accelDir);
                Vec2.length(ferro.coll.vel, 200);
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0) ferro.setState(FerroState.IDLE);
            }
        },
        NEUTRAL: {
            start: function(ferro, dir, source) {
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0.4;
                ferro.coll.float.height = 12;
                ferro.effects.sheet.spawnOnTarget("hit", ferro, {
                    duration: 0,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.setCurrentAnim(ferro.getAbsorbAnim("bounce"), true, ferro.getAbsorbAnim("idle"), true);
                Vec2.assign(ferro.coll.vel, dir);
                Vec2.length(ferro.coll.vel, source.isBall ? 300 : 250);
                return true;
            },
            update: function(ferro) {
                ferro.setState(FerroState.IDLE);
            }
        },
        BOUNCE_BACK: {
            start: function(ferro, dir) {
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0.4;
                ferro.coll.float.height = 12;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("bounceAway", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.setCurrentAnim(ferro.getAbsorbAnim("bounce"), true, ferro.getAbsorbAnim("idle"), true);
                Vec2.assign(ferro.coll.vel, dir);
                Vec2.rotate(ferro.coll.vel, (Math.random() > 0.5 ? 0.25 : -0.25) * 2 * Math.PI);
                Vec2.length(ferro.coll.vel, 700);
                ferro.coll.bounciness = 1;
                ferro.coll.friction.air = 0;
                ferro.coll.float.variance = 2;
                ferro.coll.float.maxSpeed = 400;
                ferro.coll.float.accel = 10;
                ferro.timer = 0.25;
                return true;
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0) {
                    ferro.timer = 0;
                    Vec2.mulF(ferro.coll.vel, 0.3);
                    ferro.setState(FerroState.IDLE);
                }
            }
        },
        BOUNCE_BACK_BORDER: {
            start: function(ferro, dir) {
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0.4;
                ferro.coll.float.height = 12;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("bounceAway", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.setCurrentAnim(ferro.getAbsorbAnim("bounce"), true, ferro.getAbsorbAnim("idle"), true);
                Vec2.assign(ferro.coll.vel, dir);
                Vec2.length(ferro.coll.vel, 400);
                ferro.coll.bounciness = 1;
                ferro.coll.friction.air = 0;
                ferro.coll.float.variance = 2;
                ferro.coll.float.maxSpeed = 400;
                ferro.coll.float.accel = 10;
                ferro.timer = 0.2;
                return true;
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0) {
                    ferro.timer = 0;
                    Vec2.mulF(ferro.coll.vel, 0.3);
                    ferro.setState(FerroState.IDLE);
                }
            }
        },
        BOUNCE_BACK_SMALL: {
            start: function(ferro, dir) {
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0.4;
                ferro.coll.float.height = 12;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("bounceAway", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.setCurrentAnim(ferro.getAbsorbAnim("bounce"), true, ferro.getAbsorbAnim("idle"), true);
                Vec2.assign(ferro.coll.vel, dir);
                Vec2.rotate(ferro.coll.vel, (Math.random() > 0.5 ? 0.1 : -0.1) * 2 * Math.PI);
                Vec2.length(ferro.coll.vel, 350);
                ferro.coll.bounciness = 1;
                ferro.coll.friction.air = 0;
                ferro.coll.float.variance = 2;
                ferro.coll.float.maxSpeed = 400;
                ferro.coll.float.accel = 10;
                ferro.timer = 0.25;
                return true;
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0) {
                    ferro.timer = 0;
                    Vec2.mulF(ferro.coll.vel, 0.3);
                    ferro.setState(FerroState.IDLE);
                }
            }
        },
        HEAT: {
            start: function(ferro, dir, source) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("heat"), true, null, true);
                Vec2.assign(ferro.coll.vel, dir);
                Vec2.round(ferro.coll.vel, Math.PI * 0.03);
                var isCharged = source.attackInfo && source.attackInfo.hasHint("CHARGED");
                ferro.timer = source.isBall && !isCharged ? 0.2 : 0.4;
                Vec2.length(ferro.coll.vel, 400);
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("heatHit", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 },
                    rotateFace: -1
                });
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0;
                ferro.coll.float.height = 12;
                ferro.coll.float.variance = 2;
                ferro.coll.float.maxSpeed = 400;
                ferro.coll.float.accel = 10;
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.HEAT,
                    hints: ["FERRO"]
                });
                return true;
            },
            update: function(ferro) {
                ferro.coll.bounciness = 1;
                ferro.animState.angle = Vec2.clockangle(ferro.coll.vel);
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.timer <= 0)
                    if (ferro.effects.handle) {
                        ferro.setCurrentAnim(ferro.getAbsorbAnim("idle"));
                        Vec2.mulF(ferro.coll.vel, 0.6);
                        ferro.resetColl(true);
                        ferro.timer = 0.3;
                    } else {
                        ferro.timer = 0;
                        ferro.setState(FerroState.IDLE);
                    }
            },
            onQuickStop: function(ferro) {
                Vec2.mulF(ferro.coll.vel, 0.5);
                ferro.timer = 0;
            }
        },
        COLD: {
            start: function(ferro, dir) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("cold"), true, null, true);
                Vec2.assign(ferro.coll.vel, dir);
                ferro.timer = 0.7;
                ferro.coll.bounciness = 0;
                ferro.coll.zBounciness = 0.7;
                ferro.coll.friction.ground = 0.4;
                ferro.coll.friction.air = 0.05;
                Vec2.length(ferro.coll.vel, 350);
                var jumpSpeed = Math.min(120, Math.max(0, ig.CollTools.getJumpSpeedToHeight(ferro.coll, ferro.startZ + 16)));
                ferro.coll.vel.z = jumpSpeed;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("coldHit", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.COLD,
                    hints: ["FERRO"]
                });
                ferro.coll.float.height = 0;
                return true;
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.effects.handle) {
                    ferro.animState.angle = ferro.animState.angle + ig.system.tick * 3;
                    if (ferro.timer <= 0 && ferro.coll.pos.z == ferro.coll.baseZPos) this.breakIce(ferro);
                    else if (ferro.coll.pos.z == ferro.coll.baseZPos && Vec2.length(ferro.coll.vel) < 25) this.breakIce(ferro);
                } else if (ferro.timer <= 0) ferro.setState(FerroState.IDLE);
            },
            breakIce: function(ferro) {
                ferro.overlapActivateCheck();
                ferro.timer = 0;
                Vec2.mulF(ferro.coll.vel, 0.5);
                ferro.startZ = ferro.coll.baseZPos + 12;
                ferro.resetColl(true);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("idle"));
                ferro.timer = 0.3;
            },
            onTouchGround: function(ferro, velZ) {
                ferro.effects.sheet.spawnOnTarget("coldLand", ferro, {
                    duration: 0,
                    offset: { x: 0, y: 0, z: 4 }
                });
                if (velZ < -200 || ferro.timer <= 0) this.breakIce(ferro);
            },
            onQuickStop: function(ferro) {
                Vec2.mulF(ferro.coll.vel, 0.15);
                ferro.timer = 0;
            }
        },
        SHOCK: {
            noBarrierStop: true,
            start: function(ferro, dir, source) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("shock"), true, null, true);
                var isCharged = source.attackInfo && source.attackInfo.hasHint("CHARGED");
                ferro.timer = source.isBall && !isCharged ? 0.25 : 0.5;
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("shockHit", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 },
                    target2: ig.game.playerEntity
                });
                ferro.coll.bounciness = 0;
                ferro.coll.friction.air = 0;
                ferro.coll.float.height = 12;
                ferro.coll.float.variance = 2;
                ferro.coll.float.maxSpeed = 400;
                ferro.coll.float.accel = 10;
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.SHOCK,
                    hints: ["FERRO"]
                });
                return true;
            },
            update: function(ferro) {
                ferro.timer = ferro.timer - ig.system.tick;
                if (ferro.effects.handle) {
                    var dist = ig.CollTools.getDistVec2(ferro.coll, ig.game.playerEntity.coll, tmpVec2);
                    if (Vec2.length(dist) < 32) {
                        Vec2.mulF(ferro.coll.vel, 0.1);
                        ferro.resetColl(true);
                        ferro.setCurrentAnim(ferro.getAbsorbAnim("idle"));
                        ferro.timer = 0.3;
                    } else if (ferro.timer <= 0) {
                        Vec2.mulF(ferro.coll.vel, 0.6);
                        ferro.setCurrentAnim(ferro.getAbsorbAnim("idle"));
                        ferro.resetColl(true);
                        ferro.timer = 0.3;
                    } else {
                        Vec2.assign(ferro.coll.vel, dist);
                        Vec2.length(ferro.coll.vel, 400);
                    }
                } else if (ferro.timer <= 0) {
                    ferro.timer = 0;
                    ferro.setState(FerroState.IDLE);
                }
            },
            onQuickStop: function(ferro) {
                Vec2.mulF(ferro.coll.vel, 0.5);
                ferro.timer = 0;
            }
        },
        WAVE: {
            start: function(ferro, dir, source) {
                if (source.isBall && source.attackInfo && source.attackInfo.hasHint("CHARGED")) {
                    ferro.coll.setType(ig.COLLTYPE.IGNORE);
                    ferro.setTeleportBall(source);
                    ferro.setCurrentAnim(ferro.getAbsorbAnim("wave"), true, null, true);
                    ferro.effects.sheet.spawnOnTarget("waveHit", ferro, {
                        duration: -1,
                        offset: { x: 0, y: 0, z: 4 },
                        target2: source
                    });
                } else ferro.setState(FerroState.IDLE);
                return false;
            },
            update: function() {}
        },
        BOMB_FLY: {
            noInterrupt: true,
            start: function(ferro, dir) {
                var coll = ferro.coll;
                coll.maxVel = 400;
                coll.weight = 2E3;
                Vec2.assign(coll.accelDir, dir);
                Vec2.assign(coll.vel, dir);
                Vec2.length(coll.vel, 400);
                ferro.timer = 2;
                ferro.effects.handle = ferro.effects.bomb.spawnOnTarget("bombHeatTrail", ferro, {
                    duration: -1,
                    angle: Vec2.clockangle(dir),
                    offset: { z: 2 }
                });
            },
            update: function(ferro) {
                if (ferro.coll.totalBlockTimer > 0 || ferro.coll.partlyBlockTimer > 0) this.explode(ferro);
                else {
                    ferro.timer = ferro.timer - ig.system.tick;
                    if (ferro.timer <= 0) this.explode(ferro);
                }
            },
            explode: function(ferro) {
                var center = ferro.getAlignedPos(ig.ENTITY_ALIGN.CENTER, Vec3.create());
                ferro.effects.bomb.spawnFixed("explosion", center.x, center.y, center.z);
                center.z = center.z - 24;
                if (ferro.panel) ferro.panel.onBombExplode();
                var hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "MASSIVE",
                        element: "HEAT",
                        damageFactor: 2,
                        spFactor: 0,
                        hints: ["BOMB", "FERRO_IGNORE"],
                        noHack: true
                    },
                    pos: center,
                    radius: 8,
                    zHeight: 40,
                    duration: 0.1,
                    expandRadius: 40,
                    alwaysFull: true,
                    party: "OTHER"
                });
                Vec2.assignC(ferro.coll.vel, 0, 0);
                Vec2.assignC(ferro.coll.accelDir, 0, 0);
                sc.combat.addCombatForce(hitForce);
                ferro.clearAbsorbState();
                ferro.setState(FerroState.IDLE);
            }
        },
        ICEDISK: {
            start: function(ferro) {
                ferro.setCurrentAnim("icedisk", true, null, true);
                var coll = ferro.coll;
                coll.float.height = 0;
                coll.weight = 2E5;
                coll.friction.air = 0.2;
                Vec3.assignC(coll.vel, 0, 0, 150);
                coll.zBounciness = 0;
                coll.bounciness = 1;
                ferro.mergeEntity = null;
                ferro.effects.bubble.spawnOnTarget("iceAppear", ferro, {});
            },
            update: function() {},
            ballHit: function(ferro, dir, source, element) {
                if (source.isBall && source.attackInfo && !source.attackInfo.hasHint("CHARGED")) return true;
                if (element === sc.ELEMENT.HEAT) {
                    if (ferro.panel) ferro.panel.onBubbleBurst();
                    ferro.resetColl();
                    ferro.clearAbsorbState();
                    ferro.setState(FerroState.IDLE);
                    ferro.effects.bubble.spawnOnTarget("iceMeltFerror", ferro, {});
                } else ferro.setState(FerroState.ICEDISK_SLIDE, dir, source);
                return true;
            },
            onTouchGround: function(ferro, velZ) {
                ferro.overlapActivateCheck();
                var pos = ferro.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3);
                if (velZ < -30) ferro.effects.bubble.spawnFixed("iceLand", pos.x, pos.y, pos.z, null, {});
            }
        },
        ICEDISK_SLIDE: {
            noInterrupt: true,
            start: function(ferro, dir) {
                var coll = ferro.coll;
                coll.setType(ig.COLLTYPE.IGNORE);
                coll.friction.ground = 0;
                coll.friction.air = 0;
                coll.maxVel = 400;
                coll.weight = 9001;
                coll.noSlipping = true;
                coll.zBounciness = 0;
                coll.bounciness = 1;
                Vec2.assign(coll.vel, dir);
                Vec2.length(coll.vel, 400);
                ferro.timer = 1.5;
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.COLD,
                    hints: ["ICE_DISK", "FERRO"]
                });
                ferro.remainingHits = 5;
                ferro.effects.handle = ferro.effects.bubble.spawnOnTarget("iceTrail", ferro, {
                    duration: -1,
                    angle: Vec2.clockangle(dir),
                    offset: { z: 2 }
                });
            },
            update: function() {},
            onMoveTrace: function(ferro, trace) {
                if (trace.collided) {
                    var center = ferro.getCenter();
                    center.x = center.x + trace.blockDir.x * ferro.coll.size.x / 2.05;
                    center.y = center.y + trace.blockDir.y * ferro.coll.size.y / 2.05;
                    if (ferro.remainingHits) {
                        ferro.remainingHits--;
                        ferro.effects.bubble.spawnFixed("iceBounce", center.x, center.y, ferro.coll.pos.z, null, {
                            angle: Vec2.clockangle(trace.blockDir)
                        });
                    } else this.iceBreak(ferro);
                }
            },
            iceBreak: function(ferro) {
                var pos = ferro.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                ferro.effects.bubble.spawnFixed("iceBreak", pos.x, pos.y, pos.z, null, {});
                ferro.startZ = ferro.coll.baseZPos + 12;
                if (ferro.panel) ferro.panel.onBubbleBurst();
                ferro.resetColl();
                ferro.clearAbsorbState();
                ferro.setState(FerroState.IDLE);
                ferro.effects.sheet.spawnOnTarget("absorbRegen", ferro);
            },
            onAttackHit: function(ferro) {
                this.iceBreak(ferro);
            },
            ballHitFilter: function(entity) {
                return entity instanceof ig.ENTITY.RegenDestruct;
            },
            onOtherBallHit: function(ferro, entity) {
                entity.consume();
            }
        },
        WAVE_COMPRESSOR: {
            noInterrupt: true,
            start: function(ferro, dir, source) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("waveCompressor"), true, null, true);
                ferro.element = sc.ELEMENT.WAVE;
                ferro.timer = -0.4;
                ferro.fastMode = source.fastMode;
                ferro.phaseMode = false;
                ferro.phaseTraveled = 0;
                ferro.wallKillTimer = 0;
                ferro.enterWall.timer = 0;
                ferro.speedFactor = source.speedFactor;
                Vec2.assignC(ferro.enterWall.dir, 0, 0);
                ferro.setMergeEntity(source);
                ferro.coll.float.height = 0;
                ferro.coll.zGravityFactor = 0;
                ferro.coll.vel.z = 0;
                ferro.coll.accelSpeed = 0;
                ferro.coll.friction.air = 0;
                ferro.coll.friction.ground = 0;
                ferro.coll.bounciness = 1;
                Vec2.assign(ferro.savedDir, dir);
                ferro.animState.angle = Vec3.clockangle(ferro.coll.vel);
                ferro.effects.perma = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("ballWave", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("chargeFinalWave", ferro, {
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.WAVE,
                    hints: ["COMPRESSED", "FERRO"]
                });
            },
            update: function(ferro) {
                if (ferro.timer < 0) {
                    ferro.timer = ferro.timer + ig.system.tick;
                    Vec2.assignC(ferro.coll.vel, 0, 0);
                    if (ferro.timer >= 0) {
                        ferro.timer = 10;
                        Vec2.assign(ferro.coll.vel, ferro.savedDir);
                        Vec2.length(ferro.coll.vel, 400);
                        ferro.effects.trail = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("trailWave", ferro, {
                            duration: -1,
                            offset: { x: 0, y: 0, z: 4 }
                        });
                    }
                }
                if (ferro.timer > 0) {
                    sc.COMPRESSOR_MOVE.waveUpdate(ferro);
                    ferro.timer = ferro.timer - ig.system.tick * ferro._getAssistFactor();
                    if (ferro.timer <= 0) {
                        ferro.timer = 0;
                        ferro.onCompressorMoveEnd(ferro.phaseMode);
                    }
                }
            },
            onMoveTrace: function(ferro, trace) {
                sc.COMPRESSOR_MOVE.waveMoveTrace(ferro, trace);
            },
            onCollideWith: function(ferro, other) {
                sc.COMPRESSOR_MOVE.waveCollide(ferro, other);
            },
            onOtherBallHit: function(ferro, other) {
                sc.COMPRESSOR_MOVE.waveBallHit(ferro, other);
                if (other instanceof ig.ENTITY.WaveTeleport) this.onCompressorMoveEnd();
            }
        },
        SHOCK_COMPRESSOR: {
            noInterrupt: true,
            start: function(ferro, dir, source) {
                ferro.coll.setType(ig.COLLTYPE.IGNORE);
                ferro.setCurrentAnim(ferro.getAbsorbAnim("shockCompressor"), true, null, true);
                ferro.element = sc.ELEMENT.SHOCK;
                ferro.timer = -0.4;
                ferro.fastMode = source.fastMode;
                Vec2.assign(ferro.slidingWall, source.slidingWall);
                ferro.blockCheck = source.blockCheck;
                ferro.turnSoundTimer = source.turnSoundTimer;
                ferro.wallBounces = source.wallBounces;
                ferro.speedFactor = source.speedFactor;
                ferro.setMergeEntity(source);
                ferro.coll.float.height = 0;
                ferro.coll.zGravityFactor = 0;
                ferro.coll.vel.z = 0;
                ferro.coll.accelSpeed = 0;
                ferro.coll.friction.air = 0;
                ferro.coll.friction.ground = 0;
                ferro.coll.bounciness = 1;
                Vec2.assign(ferro.savedDir, source.coll.vel);
                ferro.animState.angle = Vec3.clockangle(ferro.coll.vel);
                ferro.effects.handle = ferro.effects.sheet.spawnOnTarget("shockCompressor", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.effects.perma = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("ballShock", ferro, {
                    duration: -1,
                    offset: { x: 0, y: 0, z: 4 }
                });
                sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("chargeFinalShock", ferro, {
                    offset: { x: 0, y: 0, z: 4 }
                });
                ferro.attackInfo = new sc.AttackInfo(ig.game.playerEntity.params, {
                    element: sc.ELEMENT.SHOCK,
                    hints: ["COMPRESSED", "FERRO"]
                });
            },
            update: function(ferro) {
                ferro.killCloseRegenDestruct(24);
                if (ferro.timer < 0) {
                    Vec2.assignC(ferro.coll.vel, 0, 0);
                    ferro.timer = ferro.timer + ig.system.tick;
                    if (ferro.timer >= 0) {
                        ferro.timer = 10 / ferro.speedFactor;
                        Vec2.assign(ferro.coll.vel, ferro.savedDir);
                        ferro.effects.trail = sc.COMPRESSOR_MOVE.effects.sheet.spawnOnTarget("trailShock", ferro, {
                            duration: -1,
                            offset: { x: 0, y: 0, z: 4 }
                        });
                    }
                }
                if (ferro.timer > 0) {
                    sc.COMPRESSOR_MOVE.shockUpdate(ferro);
                    ferro.timer = ferro.timer - ig.system.tick * ferro._getAssistFactor();
                    if (ferro.timer <= 0) {
                        ferro.timer = 0;
                        ferro.onCompressorMoveEnd(false);
                    }
                }
            },
            onMoveTrace: function(ferro, trace) {
                sc.COMPRESSOR_MOVE.shockMoveTrace(ferro, trace);
            },
            shootFromWall: function(ferro, bouncer, dir) {
                sc.COMPRESSOR_MOVE.shootFromWall(ferro, bouncer, dir);
            },
            onOtherBallHit: function() {}
        }
    };
    var BombAbsorb = {
        anims: {
            idle: "bomb",
            bounce: "bomb",
            shock: "bombShock"
        },
        start: function() {},
        elementReact: [sc.ELEMENT.HEAT],
        ballHit: function(ferro, dir, source) {
            ferro.resetColl();
            ferro.setState(FerroState.BOMB_FLY, dir, source);
            return true;
        },
        onReset: function(ferro) {
            if (ferro.panel) ferro.panel.onBombExplode();
        }
    };
    var BubbleAbsorb = {
        anims: {
            idle: "bubble",
            bounce: "bubble",
            shock: "bubble"
        },
        start: function() {},
        elementReact: [sc.ELEMENT.HEAT, sc.ELEMENT.COLD],
        ballHit: function(ferro, dir, source, element) {
            if (element == sc.ELEMENT.HEAT) this.steam(ferro, dir, source.getCombatantRoot());
            if (element == sc.ELEMENT.COLD) {
                ferro.resetColl();
                ferro.setState(FerroState.ICEDISK, dir, source);
            }
            return true;
        },
        steam: function(ferro, dir, combatant) {
            var pos = ferro.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
            ferro.effects.bubble.spawnFixed("steamExplosion", pos.x, pos.y, pos.z, null, {
                angle: Vec2.clockangle(dir)
            });
            pos.z = pos.z - 8;
            if (ferro.panel) ferro.panel.onBubbleBurst();
            var hitForce = new sc.CircleHitForce(combatant, {
                attack: {
                    type: "MASSIVE",
                    element: "HEAT",
                    damageFactor: 1,
                    spFactor: 0,
                    hints: ["STEAM", "FERRO_IGNORE"],
                    noHack: true
                },
                pos: pos,
                radius: 8,
                zHeight: 16,
                duration: 0.2,
                expandRadius: 60,
                alwaysFull: true,
                party: "OTHER",
                centralAngle: 0.3,
                dir: ig.copy(dir)
            });
            sc.combat.addCombatForce(hitForce);
            ferro.resetColl();
            ferro.clearAbsorbState();
            ferro.setState(FerroState.IDLE);
            Vec2.assign(ferro.coll.vel, dir);
            Vec2.length(ferro.coll.vel, 120);
            Vec2.flip(ferro.coll.vel);
            ferro.effects.sheet.spawnOnTarget("absorbRegen", ferro);
        },
        onReset: function(ferro) {
            if (ferro.panel) ferro.panel.onBubbleBurst();
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16, 16, 24);
            this.startZ = z;
            this.coll.setPadding(2, 2);
            this.state = FerroState.IDLE;
            this.lastSpot = settings.spot || null;
            var lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
            lightHandle.setOffset(0, 4, 0);
            ig.light.addLightHandle(lightHandle);
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
                offset: { x: 0, y: 0, z: -6 },
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
                }, {
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
                    offset: { y: 6, z: 0 }
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
                    offset: { y: 6, z: 0 }
                }]
            });
            this.setCurrentAnim("idle");
            this.resetColl();
            currentFerro = this;
            spawnSpot = null;
        },
        remove: function(gateAbsorb) {
            this.lastSpot.clearPermaFx();
            spawnSpot = this.lastSpot;
            currentFerro = null;
            if (this.absorbState) {
                this.absorbState.onReset(this);
                this.clearAbsorbState();
            }
            this.resetColl();
            gateAbsorb ? this.setState(FerroState.GATE_ABSORB) : this.setState(FerroState.DELETE);
        },
        respawn: function(spot) {
            if (spot) this.assignSpot(spot);
            if (this.absorbState) {
                this.absorbState.onReset(this);
                this.clearAbsorbState();
            }
            this.resetColl();
            this.setState(FerroState.RESPAWN);
        },
        isRespawning: function() {
            return this.state == FerroState.RESPAWN;
        },
        assignSpot: function(spot) {
            if (this.lastSpot != spot) {
                if (this.lastSpot) this.lastSpot.clearPermaFx();
                this.lastSpot = spot;
                spot.showPermaFx();
            }
        },
        resetColl: function(keepAttackInfo) {
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
                this.effects.perma = null;
            }
            if (this.effects.trail) {
                this.effects.trail.stop();
                this.effects.trail = null;
            }
            if (this.effects.handle) {
                this.effects.handle.stop();
                this.effects.handle = null;
            }
            if (!keepAttackInfo) this.attackInfo = null;
        },
        getAbsorbAnim: function(animName) {
            return !this.absorbState ? animName : this.absorbState.anims[animName] || animName;
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this, {});
            }
        },
        onKill: function(entity) {
            if (currentFerro === this) currentFerro = null;
            this.parent(entity);
        },
        update: function() {
            var coll = this.coll;
            if (this.ignoreTimer) {
                this.ignoreTimer = this.ignoreTimer - ig.system.tick;
                if (this.ignoreTimer <= 0) this.ignoreTimer = 0;
            }
            if (coll.pos.z < ig.game.minLevelZ) this.respawn();
            else if (coll.pos.z == coll.baseZPos) {
                var terrain = ig.terrain.getTerrain(this.coll, true);
                if (ig.terrain.isFallTerrain(terrain)) this.respawn();
            }
            this.collReleaseTimer = this.collReleaseTimer + ig.system.tick;
            if (this.collReleaseTimeList.length > 0 && this.collReleaseTimeList[0] <= this.collReleaseTimer) {
                this.collisionList.shift();
                this.collReleaseTimeList.shift();
            }
            this.handleSurrounding();
            if (this.mergeEntity) {
                ig.CollTools.getDistVec2(this.coll, this.mergeEntity.coll, this.coll.vel);
                Vec2.mulF(this.coll.vel, 8);
                this.mergeTimer = this.mergeTimer - ig.system.tick;
                var lerped = Math.max(0, this.mergeTimer / 0.1);
                lerped = Vec3.lerp(this.mergeEntity.coll.pos, this.mergeStartPos, lerped, tmpVec3);
                this.setPos(lerped.x, lerped.y, this.coll.pos.z, true);
                if (this.mergeTimer <= 0) {
                    this.mergeTimer = 0;
                    this.mergeEntity = null;
                }
            }
            this.state.update(this);
            if (this.coll.float.height) {
                this.updateStartZ();
                this.coll.float.height = Math.max(12, this.startZ - this.coll.baseZPos);
            }
            this.parent();
        },
        handleSurrounding: function() {
            var coll = this.coll;
            if (this.state == FerroState.IDLE) {
                var padding = -2,
                    entities = ig.game.getEntitiesInRectangle(coll.pos.x - padding, coll.pos.y - padding, coll.pos.z - 14, coll.size.x + padding * 2, coll.size.y + padding * 2, 32, this),
                    closest = null,
                    closestDist = 0;
                for (var i = entities.length; i--;) {
                    var entity = entities[i];
                    if (entity instanceof ig.ActorEntity) {
                        var dist = ig.CollTools.getGroundDistance(entity.coll, this.coll);
                        if (!closest || dist < closestDist) {
                            closestDist = dist;
                            closest = entity;
                        }
                    }
                }
                if (closest) {
                    ig.CollTools.getDistVec2(closest.coll, this.coll, this.coll.accelDir);
                    this.coll.maxVel = 200;
                    this.coll.relativeVel = 0.15;
                } else {
                    padding = 2;
                    entities = ig.game.getEntitiesInRectangle(coll.pos.x - padding, coll.pos.y - padding, coll.pos.z - 14, coll.size.x + padding * 2, coll.size.y + padding * 2, 32, this);
                    closest = null;
                    closestDist = 0;
                    for (i = entities.length; i--;) {
                        entity = entities[i];
                        if (this.isCloseInEntity(entity)) {
                            dist = ig.CollTools.getGroundDistance(entity.coll, this.coll);
                            if (!closest || dist < closestDist) {
                                closestDist = dist;
                                closest = entity;
                            }
                        }
                    }
                    if (closest) {
                        ig.CollTools.getDistVec2(this.coll, closest.coll, this.coll.accelDir);
                        this.coll.maxVel = 200;
                        this.coll.relativeVel = Math.min(0.25, closestDist / 80);
                    } else Vec2.assignC(this.coll.accelDir, 0, 0);
                }
            }
        },
        isCloseInEntity: function(entity) {
            return entity instanceof ig.ENTITY.FerroSpot || (entity instanceof ig.ENTITY.OneTimeSwitch && entity.isOn && entity.activeTime) ? true : false;
        },
        updateStartZ: function() {
            if (this.coll.baseZPos > this.startZ) this.startZ = this.coll.baseZPos + 12;
        },
        setState: function(state, dir, source) {
            this.state = state;
            return this.state.start(this, dir, source);
        },
        setAbsorbState: function(absorbState, entity, panel) {
            this.effects.sheet.spawnOnTarget("absorb", this, {
                target2Point: entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
            });
            entity.absorbFerro(this);
            this.absorbState = absorbState;
            this.absorbState.start(this, entity);
            this.setMergeEntity(entity);
            this.panel = panel;
            this.setState(FerroState.IDLE);
        },
        setMergeEntity: function(entity) {
            this.mergeEntity = entity;
            this.mergeTimer = 0.1;
            Vec3.assign(this.mergeStartPos, this.coll.pos);
        },
        clearAbsorbState: function() {
            this.absorbState = this.panel = null;
        },
        ballHit: function(ball) {
            if (!this.teleportBall && !this.state.noInterrupt && !this.ignoreTimer) {
                var hitCenter = ball.getHitCenter(this),
                    element = ball.getElement(),
                    combatantRoot = ball.getCombatant().getCombatantRoot();
                if ((ball.attackInfo && ball.attackInfo.hasHint("FERRO_IGNORE")) || ball instanceof sc.FerroWaveAttack || sc.bounceSwitchGroups.isBallOfAnyGroup(ball)) return false;
                this.combatant = combatantRoot;
                combatantRoot = ball.getHitVel(this, tmpVec2);
                if (ball.attackInfo && ball.attackInfo.hasHint("FERRO_BOUNCE")) {
                    this.resetColl();
                    return this.setState(FerroState.BOUNCE_BACK, combatantRoot, ball);
                }
                if (ball.attackInfo && ball.attackInfo.hasHint("FERRO_BOUNCE_BORDER")) {
                    this.resetColl();
                    return this.setState(FerroState.BOUNCE_BACK_BORDER, combatantRoot, ball);
                }
                if (ball.attackInfo && ball.attackInfo.hasHint("FERRO_BOUNCE_SMALL")) {
                    if (this.state == FerroState.IDLE) {
                        this.resetColl();
                        return this.setState(FerroState.BOUNCE_BACK_SMALL, combatantRoot, ball);
                    }
                } else {
                    if (this.state.ballHit) return this.state.ballHit(this, combatantRoot, ball, element);
                    if (this.absorbState && this.absorbState.elementReact.indexOf(element) !== -1) return this.absorbState.ballHit(this, combatantRoot, ball, element);
                    this.updateStartZ();
                    this.resetColl();
                    var newState = FerroState.NEUTRAL;
                    if (ball instanceof sc.CompressedWaveEntity) {
                        ball.destroy();
                        newState = FerroState.WAVE_COMPRESSOR;
                    } else if (ball instanceof sc.CompressedShockEntity) {
                        ball.destroy();
                        newState = FerroState.SHOCK_COMPRESSOR;
                    } else if (element == sc.ELEMENT.HEAT) newState = FerroState.HEAT;
                    else if (element == sc.ELEMENT.COLD) newState = FerroState.COLD;
                    else if (element == sc.ELEMENT.SHOCK) newState = FerroState.SHOCK;
                    else if (element == sc.ELEMENT.WAVE) newState = FerroState.WAVE;
                    sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.LIGHT, element, false, false, true);
                    return this.setState(newState, combatantRoot, ball);
                }
            }
        },
        collideWith: function(other, dir) {
            if (this.state != FerroState.DELETE && this.state != FerroState.GATE_ABSORB) {
                if (this.state.onCollideWith) this.state.onCollideWith(this, other, dir);
                if (this.collisionList.indexOf(other) == -1)
                    if (other.name == "ferroGate") this.remove(true);
                    else {
                        if (!this.absorbState && !this.state.noMerge) {
                            if (other instanceof sc.BombEntity) {
                                this.setAbsorbState(BombAbsorb, other, other.panel);
                                return;
                            }
                            if (other instanceof sc.WaterBubbleEntity) {
                                this.setAbsorbState(BubbleAbsorb, other, other.panel);
                                return;
                            }
                            if (other instanceof sc.IceDiskEntity) {
                                this.setAbsorbState(BubbleAbsorb, other, other.panel);
                                this.setState(FerroState.ICEDISK, dir, null);
                                return;
                            }
                        }
                        if (this.attackInfo && other.damage && other.party != sc.COMBATANT_PARTY.PLAYER && other.damage(this, this.attackInfo)) {
                            this.collisionList.push(other);
                            this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                            if (this.state.onAttackHit) this.state.onAttackHit(this, other);
                        } else if (other instanceof ig.ENTITY.RegenDestruct && !this.state.noInterrupt)
                            if (this.attackInfo && other.ballHit(this)) {
                                this.collisionList.push(other);
                                this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                                this.killCloseRegenDestruct(32, other);
                                if (!this.mergeEntity && !this.state.noBarrierStop) this.setState(FerroState.BARRIER_BREAK);
                            } else {
                                if (this.state != FerroState.BARRIER_BREAK && !this.state.noBarrierStop) {
                                    this.setState(FerroState.IDLE);
                                    Vec2.length(this.coll.vel);
                                    ig.CollTools.getDistVec2(other.coll, this.coll, this.coll.vel);
                                    Vec2.length(this.coll.vel, 100);
                                }
                            }
                        else if (other instanceof ig.ENTITY.FerroSpot || (other instanceof ig.ENTITY.OneTimeSwitch && other.switchType == "ferroSwitch")) {
                            if (!(other instanceof ig.ENTITY.FerroSpot && other.state != 0 && sc.model.isCombatActive())) {
                                var isFresh = other instanceof ig.ENTITY.FerroSpot || (!other.hasOverlap && other.activeTime && other.timer + 0.05 < other.activeTime);
                                if (other.ballHit(this) && isFresh && this.state.onQuickStop) this.state.onQuickStop(this, other instanceof ig.ENTITY.FerroSpot);
                            }
                        } else if (other.ballHit && this.state.onOtherBallHit && (!this.state.ballHitFilter || this.state.ballHitFilter(other)) && other.ballHit(this)) {
                            if (this.state.onOtherBallHit) this.state.onOtherBallHit(this, other, dir);
                            this.collisionList.push(other);
                            this.collReleaseTimeList.push(this.collReleaseTimer + 0.5);
                        }
                    }
            }
        },
        overlapActivateCheck: function() {
            for (var entities = ig.game.getOverlapEntities(this), i = entities.length; i--;) this.collideWith(entities[i], null);
        },
        killCloseRegenDestruct: function(radius, excluded) {
            for (var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3), entities = ig.game.getEntitiesInCircle(pos, radius, 1, 4, null, null, null, excluded), i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.RegenDestruct) entity.ballHit(this);
            }
        },
        onPhysicsSquish: function() {
            this.respawn();
        },
        onTouchGround: function(velZ) {
            if (this.state.onTouchGround) this.state.onTouchGround(this, velZ);
        },
        handleMovementTrace: function(trace) {
            if (this.state.onMoveTrace) this.state.onMoveTrace(this, trace);
            this.parent(trace);
        },
        setTeleportBall: function(ball) {
            this.teleportBall = ball;
            ball.addEntityAttached(this);
        },
        clearTeleportBall: function() {
            if (this.teleportBall) {
                this.teleportBall.removeEntityAttached(this);
                this.teleportBall = null;
            }
        },
        onEntityKillDetach: function() {
            this.teleportBall = null;
            this.setState(FerroState.IDLE);
        },
        doTeleport: function() {
            this.teleportBall = null;
            this.startZ = this.coll.pos.z;
            this.setState(FerroState.IDLE);
        },
        onTeleportStart: function(waveTeleporter) {
            ig.game.spawnEntity(sc.FerroWaveAttack, this.coll.pos.x - 16, this.coll.pos.y - 16, this.coll.pos.z, {
                waveTeleporter: waveTeleporter
            });
        },
        getTeleportZOffset: function() {
            return 12;
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
            return this.attackInfo.element;
        },
        getCombatant: function() {
            return ig.game.playerEntity;
        },
        getCombatantRoot: function() {
            return ig.game.playerEntity;
        },
        getAttackInfo: function() {
            return this.attackInfo;
        },
        isWaterBubble: function() {
            return this.absorbState == BubbleAbsorb && !(this.state == FerroState.ICEDISK || this.state == FerroState.ICEDISK_SLIDE);
        },
        isIceDisk: function() {
            return this.state == FerroState.ICEDISK_SLIDE;
        },
        steam: function(dir, combatant) {
            BubbleAbsorb.steam(this, dir, combatant);
        },
        isCompressor: function() {
            return this.state == FerroState.WAVE_COMPRESSOR || this.state == FerroState.SHOCK_COMPRESSOR;
        },
        consume: function() {
            if (this.panel) this.panel.onBubbleBurst();
            this.resetColl();
            this.clearAbsorbState();
            this.setState(FerroState.IDLE);
            this.startZ = this.coll.baseZPos + 12;
            this.effects.sheet.spawnOnTarget("absorbRegen", this);
            Vec2.mulF(this.coll.vel, -0.2);
        },
        onCompressorMoveEnd: function(phaseMode) {
            if (phaseMode) this.respawn();
            else {
                this.resetColl();
                Vec2.length(this.coll.vel, 150);
                this.setState(FerroState.IDLE);
            }
        },
        _getAssistFactor: function() {
            return this.fastMode ? 1 : sc.options.get("assist-puzzle-speed");
        },
        isBallAdjust: function() {
            return sc.model.player.currentElementMode == sc.ELEMENT.WAVE ? false : true;
        },
        doBallAdjust: function(ball, out, collSize) {
            this.getCenter(ball);
            Vec3.assign(collSize, this.coll.size);
            if (this.state == FerroState.ICEDISK) return 5;
            if (sc.model.player.currentElementMode == sc.ELEMENT.SHOCK) ig.CollTools.getDistVec2(this.coll, ig.game.playerEntity.coll, out);
            return sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? 5 : 0;
        },
        isBallDestroyer: function() {
            return (this.state == FerroState.ICEDISK && sc.model.player.currentElementMode == sc.ELEMENT.HEAT) || (this.absorbState == BubbleAbsorb && (sc.model.player.currentElementMode == sc.ELEMENT.HEAT || sc.model.player.currentElementMode == sc.ELEMENT.COLD)) ? true : false;
        },
        shootFromWall: function(bouncer, dir) {
            if (this.state.shootFromWall) this.state.shootFromWall(this, bouncer, dir);
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(48, 48, 24);
            this.coll.zGravityFactor = 0;
            settings.waveTeleporter.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, this.targetPos);
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
                target2Offset: { x: 0, y: 0, z: 8 }
            });
        },
        update: function() {
            this.timer = this.timer - ig.system.tick;
            if (this.timer < 0.2) {
                if (!this.startedMove) {
                    this.startedMove = true;
                    var angle = Vec3.clockangle(Vec3.sub(this.targetPos, this.startPos, tmpVec3));
                    this.effects.sheet.spawnOnTarget("waveBall", this, {
                        duration: -1,
                        offset: { x: 0, y: 0, z: 4 }
                    });
                    this.effects.sheet.spawnOnTarget("waveBallTrail", this, {
                        duration: -1,
                        offset: { x: 0, y: 0, z: 4 },
                        angle: angle
                    });
                }
                var progress = Math.min(1, 1 - this.timer / 0.2);
                progress = Vec3.lerp(this.startPos, this.targetPos, progress, tmpVec3);
                this.setPos(progress.x - this.coll.size.x / 2, progress.y - this.coll.size.y / 2, progress.z, true);
            }
            if (this.timer <= 0) {
                this.timer = 0;
                this.kill();
            } else this.parent();
        },
        collideWith: function(entity) {
            if (this.attackInfo && (entity.damage || entity.ballHit) && this.collisionList.indexOf(entity) == -1 && !(entity instanceof sc.FerroEntity))
                if (entity.damage && entity.party != this.combatant.party) {
                    if (entity.damage(this, this.attackInfo)) this.collisionList.push(entity);
                } else if (entity.ballHit && entity.ballHit(this) && (this._killed || this.collisionList.push(entity))) {}
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
            return this.attackInfo.element;
        },
        getCombatant: function() {
            return this.combatant;
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot();
        },
        getAttackInfo: function() {
            return this.attackInfo;
        }
    });
});
ig.baked = !0;