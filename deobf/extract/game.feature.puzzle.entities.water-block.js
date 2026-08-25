ig.module("game.feature.puzzle.entities.water-block").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = {
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
        a = Vec2.create();
    ig.ENTITY.WaterBlock =
        ig.AnimatedEntity.extend({
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
                        _select: b
                    },
                    changeDuration: {
                        _type: "Number",
                        _info: "Number of seconds for steam or ice state to persist",
                        _default: 5
                    }
                }
            }),
            init: function(a, c, e, f) {
                this.parent(a, c, e, f);
                this.coll.type = ig.COLLTYPE.BLOCK;
                this.coll.setSize(32, 32, 32);
                this.blockType =
                    b[f.blockType] || b.SQUARE;
                this.coll.shape = this.blockType.shape;
                this.changeDuration = f.changeDuration || 5;
                this.navBlocker = ig.navigation.getNavBlock(this, ig.NAV_BLOCKER_TYPE.NO_TOP);
                (a = ig.mapStyle.get("waterblock")) && this.initAnimations({
                    namedSheets: {
                        block: {
                            src: a.sheet,
                            width: 32,
                            height: 64,
                            xCount: 4,
                            offX: a.x,
                            offY: a.y + this.blockType.offY
                        },
                        puddle: {
                            src: a.sheet,
                            width: 32,
                            height: 32,
                            xCount: 1,
                            offX: a.puddleX,
                            offY: a.puddleY
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
            onKill: function(a) {
                this.parent(a);
                this.navBlocker && this.navBlocker.remove();
                this.navBlocker = null
            },
            steam: function(a, b) {
                if (this.state != 3) {
                    this.coll.size.z = 0;
                    this.state = 3;
                    this.terrain = 0;
                    this.effects.sheet.spawnOnTarget("blockSteam", this, {
                        align: "CENTER"
                    });
                    var e = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, Vec3.create());
                    if (b) {
                        e = new sc.CircleHitForce(b, {
                            attack: {
                                type: "MASSIVE",
                                element: "HEAT",
                                damageFactor: 2,
                                spFactor: 0,
                                hints: ["STEAM"]
                            },
                            pos: e,
                            radius: 8,
                            zHeight: 24,
                            duration: 0.1,
                            expandRadius: 32,
                            alwaysFull: true,
                            party: "OTHER",
                            centralAngle: 1
                        });
                        sc.combat.addCombatForce(e)
                    }
                    this.timer =
                        this.changeDuration / sc.options.get("assist-puzzle-speed");
                    this.navBlocker.update(ig.NAV_BLOCKER_TYPE.NO_BLOCK);
                    this.effects.handle = this.effects.sheet.spawnOnTarget("blockRecharge", this, {
                        align: "CENTER",
                        duration: -1
                    });
                    this.setCurrentAnim("puddle")
                }
            },
            isFrozen: function() {
                return this.state == 2
            },
            turnIce: function() {
                if (this.state != 2) {
                    this.navBlocker.update(ig.NAV_BLOCKER_TYPE.REGULAR);
                    this.state = 2;
                    this.setCurrentAnim("frozen");
                    this.terrain = ig.TERRAIN.ICE;
                    this.effects.sheet.spawnOnTarget("blockFreeze", this, {});
                    this.timer = this.changeDuration / sc.options.get("assist-puzzle-speed")
                }
            },
            melt: function() {
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
            onEffectEvent: function(a) {
                if (a.state == ig.EFFECT_STATE.ENDED) a == this.effects.hitHandle ? this.effects.hitHandle = null : this.currentAnim == "melting" && this.setCurrentAnim("water")
            },
            reform: function() {
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
            bounce: function() {
                this.effects.hitHandle && this.effects.hitHandle.stop();
                this.effects.hitHandle = this.effects.sheet.spawnOnTarget("blockHit", this, {
                    callback: this
                })
            },
            collideWith: function(b, c) {
                if (this.state == 1 && c && !Vec2.isZero(c)) {
                    b instanceof
                    sc.IceDiskEntity && this.turnIce();
                    if (b instanceof ig.ENTITY.Combatant) {
                        this.bounce();
                        Vec2.assign(a, c);
                        Vec2.flip(a);
                        sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.NEUTRAL, false, false, true);
                        b.cancelAction();
                        var e = b.hasStun() ? "LIGHT" : "MEDIUM",
                            e = b.doDamageMovement(a, e, false, false);
                        b.coll.vel.z = 100;
                        b.damageTimer = Math.max(b.damageTimer, e)
                    }
                }
            },
            onGroundAdd: function(a) {
                if (a instanceof sc.IceDiskEntity && this.state == 1) {
                    this.turnIce();
                    a.iceBreak()
                }
            },
            ballHit: function(b) {
                if (this.state ==
                    3) return false;
                var c = b.getHitCenter(this),
                    e = b.getHitVel(this, a);
                if (b.attackInfo && b.attackInfo.hasHint("STEAM")) return false;
                var f = b.getElement();
                if (this.state == 2 && f != sc.ELEMENT.HEAT) return false;
                f == sc.ELEMENT.HEAT ? this.state == 2 ? this.melt() : this.steam(e, b.getCombatantRoot()) : f == sc.ELEMENT.COLD ? this.turnIce(e) : this.bounce();
                e = sc.ATTACK_TYPE.LIGHT;
                if (!b.isBall || b.attackInfo.hasHint("CHARGED")) e = sc.ATTACK_TYPE.MEDIUM;
                sc.combat.showHitEffect(this, c, e, b.getElement(), false, false, true);
                return true
            },
            update: function() {
                if (this.timer >
                    0) {
                    this.timer = this.timer - ig.system.tick;
                    if (this.timer <= 0) {
                        this.timer = 0;
                        this.state == 2 ? this.melt() : this.reform()
                    }
                }
                if (this.state == 3) {
                    var a = 1 - (this.timer / (this.changeDuration / sc.options.get("assist-puzzle-speed"))).limit(0, 1);
                    this.animState.scaleX = a;
                    this.animState.scaleY = a
                } else {
                    this.animState.scaleX = 1;
                    this.animState.scaleY = 1
                }
                this.parent()
            }
        })
});
ig.baked = !0;
