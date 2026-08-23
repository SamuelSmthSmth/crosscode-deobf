/**
 * game.feature.puzzle.entities.water-block
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.water-block")`.
 *
 * `ig.ENTITY.WaterBlock`: a block of water that can be frozen into ice
 * (COLD), melted back to water (HEAT), or turned into steam (HEAT on a
 * bubbling block). Steam applies a `CircleHitForce`; the block reforms after
 * `changeDuration`. Five shape variants (SQUARE + 4 corners) in
 * `sc.BLOCKER_TYPE`-style `WATER_BLOCK_TYPES` data.
 */
ig.module("game.feature.puzzle.entities.water-block")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    var WATER_BLOCK_TYPES = {
            SQUARE: {
                shape: ig.COLLSHAPE.RECTANGLE,
                offY: 128,
                flipX: false,
                wallY: 0
            },
            CORNER_NE: {
                shape: ig.COLLSHAPE.SLOPE_NE,
                offY: 64,
                flipX: false,
                wallY: 0
            },
            CORNER_SE: {
                shape: ig.COLLSHAPE.SLOPE_SE,
                offY: 0,
                flipX: false,
                wallY: 1
            },
            CORNER_SW: {
                shape: ig.COLLSHAPE.SLOPE_SW,
                offY: 0,
                flipX: true,
                wallY: 1
            },
            CORNER_NW: {
                shape: ig.COLLSHAPE.SLOPE_NW,
                offY: 64,
                flipX: true,
                wallY: 0
            }
        },
        hitVelScratch = Vec2.create();

    ig.ENTITY.WaterBlock = ig.AnimatedEntity.extend({
        blockType: 0,
        state: 1,
        changeDuration: 0,
        timer: 0,
        compressorSlow: 0.5,
        effects: {
            sheet: new ig.EffectSheet("puzzle.water-bubble"),
            handle: null,
            hitHandle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                blockType: {
                    _type: "String",
                    _info: "Type of block",
                    _select: WATER_BLOCK_TYPES
                },
                changeDuration: {
                    _type: "Number",
                    _info: "Number of seconds for steam or ice state to persist",
                    _default: 5
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(32, 32, 32);
            this.blockType = WATER_BLOCK_TYPES[settings.blockType] || WATER_BLOCK_TYPES.SQUARE;
            this.coll.shape = this.blockType.shape;
            this.changeDuration = settings.changeDuration || 5;
            this.navBlocker = ig.navigation.getNavBlock(this, ig.NAV_BLOCKER_TYPE.NO_TOP);
            var waterblockStyle = ig.mapStyle.get("waterblock");
            if (waterblockStyle) this.initAnimations({
                namedSheets: {
                    block: {
                        src: waterblockStyle.sheet,
                        width: 32,
                        height: 64,
                        xCount: 4,
                        offX: waterblockStyle.x,
                        offY: waterblockStyle.y + this.blockType.offY
                    },
                    puddle: {
                        src: waterblockStyle.sheet,
                        width: 32,
                        height: 32,
                        xCount: 1,
                        offX: waterblockStyle.puddleX,
                        offY: waterblockStyle.puddleY
                    }
                },
                sheet: "block",
                flipX: this.blockType.flipX,
                wallY: this.blockType.wallY,
                pivot: {
                    x: 16,
                    y: 52
                },
                size: {
                    x: 32,
                    y: 32,
                    z: 32
                },
                SUB: [{
                    name: "water",
                    time: 0.2,
                    frames: [0, 1, 2],
                    repeat: true,
                    framesAlpha: [0.7, 0.7, 0.7]
                }, {
                    name: "frozen",
                    time: 0.2,
                    frames: [3],
                    repeat: true
                }, {
                    name: "melting",
                    time: 0.2,
                    frames: [0, 1, 2],
                    repeat: true
                }, {
                    name: "melting",
                    time: 0.2,
                    frames: [3],
                    repeat: true,
                    aboveZ: 1
                }, {
                    sheet: "puddle",
                    size: {
                        x: 32,
                        y: 32,
                        z: 0
                    },
                    pivot: {
                        x: 16,
                        y: 16
                    },
                    wallY: 1,
                    time: 1,
                    frames: [0],
                    repeat: false,
                    SUB: [{
                        name: "puddle"
                    }, {
                        name: "regen"
                    }]
                }, {
                    name: "regen",
                    time: 1,
                    frames: [0],
                    repeat: false
                }]
            });
            this.terrain = ig.TERRAIN.WATER;
            this.setCurrentAnim("water")
        },

        onKill: function (parent) {
            this.parent(parent);
            this.navBlocker && this.navBlocker.remove();
            this.navBlocker = null
        },

        steam: function (hitVel, combatant) {
            if (this.state != 3) {
                this.coll.size.z = 0;
                this.state = 3;
                this.terrain = 0;
                this.effects.sheet.spawnOnTarget("blockSteam", this, {
                    align: "CENTER"
                });
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                if (combatant) {
                    var force = new sc.CircleHitForce(combatant, {
                        attack: {
                            type: "MASSIVE",
                            element: "HEAT",
                            damageFactor: 2,
                            spFactor: 0,
                            hints: ["STEAM"]
                        },
                        pos: pos,
                        radius: 8,
                        zHeight: 24,
                        duration: 0.1,
                        expandRadius: 32,
                        alwaysFull: true,
                        party: "OTHER",
                        centralAngle: 1
                    });
                    sc.combat.addCombatForce(force)
                }
                this.timer = this.changeDuration / sc.options.get("assist-puzzle-speed");
                this.navBlocker.update(ig.NAV_BLOCKER_TYPE.NO_BLOCK);
                this.effects.handle = this.effects.sheet.spawnOnTarget("blockRecharge", this, {
                    align: "CENTER",
                    duration: -1
                });
                this.setCurrentAnim("puddle")
            }
        },

        isFrozen: function () {
            return this.state == 2
        },

        turnIce: function () {
            if (this.state != 2) {
                this.navBlocker.update(ig.NAV_BLOCKER_TYPE.REGULAR);
                this.state = 2;
                this.setCurrentAnim("frozen");
                this.terrain = ig.TERRAIN.ICE;
                this.effects.sheet.spawnOnTarget("blockFreeze", this, {});
                this.timer = this.changeDuration / sc.options.get("assist-puzzle-speed")
            }
        },

        melt: function () {
            this.state = 1;
            this.navBlocker.update(ig.NAV_BLOCKER_TYPE.NO_TOP);
            this.setCurrentAnim("melting");
            this.effects.sheet.spawnOnTarget("blockMelt", this, {
                spriteFilter: [1],
                callback: this
            });
            this.terrain = ig.TERRAIN.WATER;
            this.timer = 0
        },

        onEffectEvent: function (effect) {
            if (effect.state == ig.EFFECT_STATE.ENDED) effect == this.effects.hitHandle ? this.effects.hitHandle = null : this.currentAnim == "melting" && this.setCurrentAnim("water")
        },

        reform: function () {
            this.coll.setType(ig.COLLTYPE.BLOCK);
            this.state = 1;
            this.coll.size.z = 32;
            this.navBlocker.update(ig.NAV_BLOCKER_TYPE.NO_TOP);
            this.terrain = ig.TERRAIN.WATER;
            this.setCurrentAnim("water");
            this.effects.handle && this.effects.handle.stop();
            this.effects.handle = null;
            this.effects.sheet.spawnOnTarget("blockAppear", this, {
                align: "CENTER"
            })
        },

        bounce: function () {
            this.effects.hitHandle && this.effects.hitHandle.stop();
            this.effects.hitHandle = this.effects.sheet.spawnOnTarget("blockHit", this, {
                callback: this
            })
        },

        collideWith: function (entity, hitVel) {
            if (this.state == 1 && hitVel && !Vec2.isZero(hitVel)) {
                entity instanceof sc.IceDiskEntity && this.turnIce();
                if (entity instanceof ig.ENTITY.Combatant) {
                    this.bounce();
                    Vec2.assign(hitVelScratch, hitVel);
                    Vec2.flip(hitVelScratch);
                    sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.NEUTRAL, false, false, true);
                    entity.cancelAction();
                    var attackType = entity.hasStun() ? "LIGHT" : "MEDIUM",
                        damageTime = entity.doDamageMovement(hitVelScratch, attackType, false, false);
                    entity.coll.vel.z = 100;
                    entity.damageTimer = Math.max(entity.damageTimer, damageTime)
                }
            }
        },

        onGroundAdd: function (entity) {
            if (entity instanceof sc.IceDiskEntity && this.state == 1) {
                this.turnIce();
                entity.iceBreak()
            }
        },

        ballHit: function (ball) {
            if (this.state == 3) return false;
            var hitCenter = ball.getHitCenter(this),
                hitVel = ball.getHitVel(this, hitVelScratch);
            if (ball.attackInfo && ball.attackInfo.hasHint("STEAM")) return false;
            var element = ball.getElement();
            if (this.state == 2 && element != sc.ELEMENT.HEAT) return false;
            element == sc.ELEMENT.HEAT ? this.state == 2 ? this.melt() : this.steam(hitVel, ball.getCombatantRoot()) : element == sc.ELEMENT.COLD ? this.turnIce(hitVel) : this.bounce();
            var attackType = sc.ATTACK_TYPE.LIGHT;
            if (!ball.isBall || ball.attackInfo.hasHint("CHARGED")) attackType = sc.ATTACK_TYPE.MEDIUM;
            sc.combat.showHitEffect(this, hitCenter, attackType, ball.getElement(), false, false, true);
            return true
        },

        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.state == 2 ? this.melt() : this.reform()
                }
            }
            if (this.state == 3) {
                var scale = 1 - (this.timer / (this.changeDuration / sc.options.get("assist-puzzle-speed"))).limit(0, 1);
                this.animState.scaleX = scale;
                this.animState.scaleY = scale
            } else {
                this.animState.scaleX = 1;
                this.animState.scaleY = 1
            }
            this.parent()
        }
    })
});
ig.baked = !0;