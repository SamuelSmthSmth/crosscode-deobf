/**
 * game.feature.puzzle.entities.bomb
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.bomb")`.
 *
 * `ig.ENTITY.BombPanel` + `sc.BombEntity`: a ground panel that spawns bombs
 * (3-second fuse after first hit). The bomb ticks down, flashes in the last
 * 0.75 s, then creates a `CircleHitForce` explosion. HEAT (uncharged) enters
 * "heat mode" — the bomb rockets forward for 2 s and explodes on wall hit.
 * Also usable by the ferro entity as `BOMB_FLY` state.
 */
ig.module("game.feature.puzzle.entities.bomb")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    var centerScratch = Vec2.create();
    Vec3.create();

    ig.ENTITY.BombPanel = ig.AnimatedEntity.extend({
        respawnTimer: 0,
        bomb: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                noHeatFocus: {
                    _type: "Boolean",
                    _info: "No camera-follow with heat"
                }
            }
        }),
        effects: {
            bomb: new ig.EffectSheet("puzzle.bomb")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.noHeatFocus = settings.noHeatFocus;
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(24, 24, 1);
            this.coll.zGravityFactor = 1;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
                    width: 24,
                    height: 24,
                    xCount: 2,
                    offX: 0,
                    offY: 88
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
                    time: 0.04,
                    frames: [1, 1, 1, 1, 1, 1, 1, 1],
                    framesAlpha: [0, 0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2],
                    repeat: true
                }]
            });
            this.setCurrentAnim("on")
        },

        show: function (show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {})
            }
            this.spawnBomb(show)
        },

        onHideRequest: function () {
            if (this.bomb) {
                this.bomb.destroy();
                this.bomb = null
            }
            this.respawnTimer = 0;
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },

        update: function () {
            if (this.respawnTimer) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                this.respawnTimer <= 0 && this.spawnBomb()
            }
            this.parent()
        },

        spawnBomb: function (show) {
            this.respawnTimer = 0;
            this.setCurrentAnim("on");
            var center = this.getCenter(centerScratch);
            this.bomb = ig.game.spawnEntity(sc.BombEntity, center.x, center.y, this.coll.pos.z + this.coll.size.z, {
                panel: this
            });
            this.bomb.noHeatFocus = this.noHeatFocus;
            show || this.effects.bomb.spawnOnTarget("appear", this.bomb, {})
        },

        hasBomb: function () {
            return !!this.bomb
        },

        onBombStart: function () {
            this.bomb = null;
            this.setCurrentAnim("off")
        },

        onBombExplode: function () {
            this.setCurrentAnim("blink");
            this.respawnTimer = 1.5
        }
    });

    sc.BombEntity = ig.AnimatedEntity.extend({
        panel: null,
        timer: 0,
        combatant: null,
        heatMode: false,
        effects: {
            bomb: new ig.EffectSheet("puzzle.bomb")
        },
        cameraHandle: null,
        noHeatFocus: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.coll.setSize(20, 20, 16);
            this.coll.friction.air = 0.06;
            this.coll.shadow.size = 20;
            this.coll.edgeSlipInward = true;
            this.coll.setPos(x - this.coll.size.x / 2, y - this.coll.size.y / 2, z);
            this.panel = settings.panel || null;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: -3,
                    z: 0
                },
                sheet: {
                    src: puzzleStyle.sheet,
                    width: 24,
                    height: 24,
                    xCount: 5,
                    offX: 0,
                    offY: 64
                },
                SUB: [{
                        name: "off",
                        time: 1,
                        frames: [0],
                        repeat: false
                    }, {
                        name: "ticking",
                        time: 0.1,
                        frames: [2, 1, 0, 1],
                        repeat: true
                    }, {
                        name: "ticking",
                        time: 1,
                        frames: [3],
                        repeat: false
                    }, {
                        name: "ticking",
                        time: 1,
                        frames: [4],
                        repeat: false
                    }, {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [0, 0, 2, 2],
                        repeat: true
                    },
                    {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [3, 3, 3, 3],
                        framesAlpha: [0, 0, 1, 1],
                        repeat: true
                    }, {
                        name: "tickingEnd",
                        time: 0.03,
                        frames: [4, 4, 4, 4],
                        framesAlpha: [0, 0, 1, 1],
                        repeat: true
                    }
                ]
            });
            this.setCurrentAnim("off")
        },

        destroy: function () {
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect.isDone()) {
                this.effects.hideHandle = null;
                this.kill()
            }
        },

        start: function (hitVel, combatant, speed, zVel) {
            if (!this.timer) {
                this.setCurrentAnim("ticking");
                this.timer = 3 / sc.options.get("assist-puzzle-speed");
                this.panel && this.panel.onBombStart();
                Vec2.assign(this.coll.vel, hitVel);
                Vec2.length(this.coll.vel, speed || 180);
                this.coll.vel.z = zVel || 200;
                this.combatant = combatant;
                this.fxHandle = this.effects.bomb.spawnOnTarget("active", this, {
                    duration: -1
                })
            }
        },

        setLastSecond: function () {
            this.timer = 0.75;
            this.setCurrentAnim("tickingEnd");
            if (this.sprites.length > 1) {
                this.sprites[1].setGfxCut(0, 0);
                this.sprites[2].setGfxCut(0, 0)
            }
            this.fxHandle && this.fxHandle.stop();
            this.fxHandle = this.effects.bomb.spawnOnTarget("almost", this, {
                duration: -1
            })
        },

        explode: function () {
            if (!this._killed) {
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, Vec3.create());
                this.effects.bomb.spawnFixed("explosion", pos.x, pos.y, pos.z);
                pos.z = pos.z - 24;
                this.panel && this.panel.onBombExplode();
                if (this.combatant) {
                    var force = new sc.CircleHitForce(this.combatant, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 2,
                            spFactor: 0,
                            hints: ["BOMB"],
                            noHack: true
                        },
                        pos: pos,
                        radius: 8,
                        zHeight: 40,
                        duration: 0.1,
                        expandRadius: 40,
                        alwaysFull: true,
                        party: "OTHER"
                    });
                    sc.combat.addCombatForce(force)
                }
                this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
                this.kill()
            }
        },

        enterHeatMode: function (hitVel, combatant) {
            if (!this._killed && !this.heatMode) {
                this.heatMode = true;
                var coll = this.coll;
                this.coll.edgeSlipInward = false;
                Vec2.assign(coll.accelDir, hitVel);
                coll.maxVel = 400;
                coll.weight = 2E3;
                Vec2.assign(coll.vel, hitVel);
                Vec2.length(coll.vel, 400);
                this.timer = 2;
                this.combatant = combatant;
                this.fxHandle && this.fxHandle.stop();
                if (!this.noHeatFocus) {
                    this.cameraHandle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([this, ig.game.playerEntity]), 0, 0);
                    ig.camera.pushTarget(this.cameraHandle, "FAST", KEY_SPLINES.EASE_IN_OUT)
                }
                this.effects.bomb.spawnOnTarget("bombHeatTrail", this, {
                    duration: -1,
                    angle: Vec2.clockangle(hitVel),
                    offset: {
                        z: 6
                    }
                })
            }
        },

        update: function () {
            this.coll.pos.z < ig.game.minLevelZ && this.explode();
            if (this.heatMode) {
                (this.coll.totalBlockTimer > 0 || this.coll.partlyBlockTimer > 0) && this.explode();
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && this.explode()
            } else if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && this.explode();
                this.currentAnim == "ticking" && this.timer <= 0.75 && this.setLastSecond()
            }
            if (this.currentAnim == "ticking" && this.sprites.length > 1) {
                var sprite1 = this.sprites[1],
                    sprite2 = this.sprites[2],
                    fullHeight = sprite1.size.y + sprite1.size.z,
                    progress = (this.timer - 0.75) / (3 / sc.options.get("assist-puzzle-speed") - 0.75 - 1.5),
                    progress = progress.limit(0, 1),
                    cut = Math.ceil(8 * (1 - progress));
                sprite1.setGfxCut(fullHeight - 1 - cut, 1);
                sprite2.setGfxCut(fullHeight - 7 - cut, 7)
            }
            var coll = this.coll;
            coll.friction.terrain = ig.terrain.getTerrain(coll, true) == ig.TERRAIN.ICE ? 0.02 : 1;
            this.parent()
        },

        absorbFerro: function () {
            this.cameraHandle && ig.camera.removeTarget(this.cameraHandle, "SLOW", KEY_SPLINES.EASE_IN_OUT);
            this.kill()
        },

        ballHit: function (ball) {
            if (this.heatMode) return false;
            var hitCenter = ball.getHitCenter(this),
                hitVel = ball.getHitVel(this, centerScratch),
                unchargedHeat = ball.isBall && !ball.attackInfo.hasHint("CHARGED") && ball.attackInfo.element == sc.ELEMENT.HEAT;
            if (!ball.attackInfo.hasHint("DEEP_FLAME") && ball.isBall && !ball.attackInfo.hasHint("CHARGED") && (!this.timer || !unchargedHeat)) {
                sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), true, false, true);
                return true
            }
            sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.MEDIUM, ball.getElement(), false, false, true);
            if (ball.attackInfo.hasHint("DEEP_FLAME")) {
                var targetVec = ball.getCombatantRoot();
                targetVec.target && ig.CollTools.getDistVec2(this.coll, targetVec.target.coll, hitVel);
                this.enterHeatMode(hitVel, ball.getCombatantRoot())
            } else !unchargedHeat && ball.attackInfo.element == sc.ELEMENT.HEAT ? this.enterHeatMode(hitVel, ball.getCombatantRoot()) : this.timer ? this.explode() : this.start(hitVel, ball.getCombatantRoot());
            return true
        },

        onTouchGround: function (impactVelocity) {
            if (this.coll.pos.z >= -1 && !this.coll.ignoreCollision) {
                var center = this.getCenter();
                impactVelocity < -50 && ig.game.effects.dust.spawnFixed("medium", center.x, center.y, this.coll.pos.z);
                if ((impactVelocity = ig.EntityTools.getGroundEntity(this)) && impactVelocity.bombSnap) this.coll.vel.z = 0
            }
        },

        isBallAdjust: function () {
            return true
        },

        doBallAdjust: function (pos, other, size) {
            this.getCenter(pos);
            Vec3.assign(size, this.coll.size);
            return 0
        },

        isBallDestroyer: function (entity, other, ignore) {
            return this.heatMode || !ignore || this.timer && !sc.model.player.currentElementMode == sc.ELEMENT.HEAT ? true : false
        }
    });

    sc.COMBAT_POI.BOMB_PANEL = {
        _wm: {
            attributes: {
                ready: {
                    _type: "Boolean",
                    _info: "If true: Bomb panel has to include a bomb "
                }
            }
        },
        filterEntities: function (out, entities, params) {
            for (var mustBeReady = params.ready, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.BombPanel && (!mustBeReady || entity.hasBomb()) && out.push(entity)
            }
            return out
        }
    }
});
ig.baked = !0;