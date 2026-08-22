/**
 * game.feature.combat.combat-stun
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-stun")`.
 *
 * Stun hit-reaction behaviors: `sc.CombatStun` base plus `sc.COMBAT_STUN.*`
 * variants (start/end lock, block xy/fall, pull, z-pull, force position,
 * z velocity/bounciness, set face).
 */
ig.module("game.feature.combat.combat-stun")
    .requires("impact.base.entity", "impact.base.actor-entity")
    .defines(function () {

    sc.COMBAT_STUN = {};

    sc.CombatStun = ig.Class.extend({
        preHit: null,
        start: null,
        run: function () {
            return true
        }
    });

    sc.COMBAT_STUN = {};

    var distScratch = Vec2.create(),
        faceScratch = Vec2.create(),
        posScratch = Vec3.create();

    sc.COMBAT_STUN.START_LOCK = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        preHit: function (combatant, lockTime) {
            combatant.params && combatant.params.startLock(lockTime)
        }
    });

    sc.COMBAT_STUN.END_LOCK = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        preHit: function (combatant, lockTime) {
            combatant.params && combatant.params.endLock(lockTime)
        }
    });

    sc.COMBAT_STUN.BLOCK_XY = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        run: function (combatant) {
            combatant.coll.vel.x = 0;
            combatant.coll.vel.y = 0
        }
    });

    sc.COMBAT_STUN.BLOCK_FALL = sc.CombatStun.extend({
        maxTime: 0,

        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Time how long fall should be blocked"
                }
            }
        }),

        init: function (settings) {
            this.maxTime = settings.maxTime
        },

        run: function (combatant) {
            if (combatant.coll.vel.z < 0) combatant.coll.vel.z = 0;
            return this.maxTime && combatant.stepTimer >= this.maxTime
        }
    });

    sc.COMBAT_STUN.PULL = sc.CombatStun.extend({
        speed: 0,
        distance: 0,
        maxTime: 0,

        _wm: new ig.Config({
            attributes: {
                distance: {
                    _type: "Number",
                    _info: "Distance to be pulled to"
                },
                speed: {
                    _type: "Number",
                    _info: "Speed with which victim will be pulled toward attacker"
                },
                maxTime: {
                    _type: "Number",
                    _info: "How long victim will be pulled toward attacker. 0=until stun over"
                }
            }
        }),

        init: function (settings) {
            this.distance = settings.distance;
            this.speed = settings.speed || 300;
            this.maxTime = settings.maxTime || 0
        },

        start: function () {},

        run: function (combatant, attacker) {
            if (!attacker || combatant.coll.groundConnect || combatant.coll.weight == -1) return this.maxTime;
            var distVec = ig.CollTools.getDistVec2(combatant.coll, attacker.coll, distScratch);
            if (Vec2.length(distVec) - combatant.coll.size.x / 2 - attacker.coll.size.x / 2 > this.distance) {
                Vec2.length(distVec, this.speed);
                Vec2.assign(combatant.coll.vel, distVec);
                return this.maxTime && combatant.stepTimer >= this.maxTime
            }
            if (!this.maxTime) {
                var speed = Math.max(0, Vec2.length(combatant.coll.vel) - ig.system.tick * 5 * this.speed);
                Vec2.length(combatant.coll.vel, speed)
            }
            return this.maxTime
        }
    });

    sc.COMBAT_STUN.Z_PULL = sc.CombatStun.extend({
        maxSpeed: 0,
        accel: 1,
        offZ: 1,

        _wm: new ig.Config({
            attributes: {
                accel: {
                    _type: "Number",
                    _info: "Acceleration with which victom will be pulled to same z height"
                },
                offZ: {
                    _type: "Number",
                    _info: "Z Offset to attacker position to which victim will be pulled"
                },
                maxTime: {
                    _type: "Number",
                    _info: "How long victim will be pulled toward attacker. 0=until stun over"
                },
                maxSpeed: {
                    _type: "Number",
                    _info: "Maximum Speed for Z movement. Default is 300",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.maxSpeed = settings.maxSpeed || 300;
            this.accel = settings.accel || 1;
            this.offZ = settings.offZ || 0;
            this.maxTime = settings.maxTime || 0
        },

        start: function () {},

        run: function (combatant, attacker) {
            if (!combatant.coll.groundConnect && attacker) {
                var zVel = ((attacker.coll.pos.z - combatant.coll.pos.z + this.offZ) * 10 * this.accel).limit(-this.maxSpeed, this.maxSpeed);
                combatant.coll.vel.z = zVel
            }
            return this.maxTime && combatant.stepTimer >= this.maxTime
        }
    });

    sc.COMBAT_STUN.FORCE_POS = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {
                align: {
                    _type: "String",
                    _info: "Alignment of to target",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to attack position",
                    _optional: true
                },
                maxTime: {
                    _type: "Number",
                    _info: "How long victim will be pulled toward attacker. 0=until stun over"
                },
                interpolateFactor: {
                    _type: "Number",
                    _info: "Factor to interpolate between positions over time, the higher, the faster",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = settings.offset || null;
            this.maxTime = settings.maxTime || 0;
            this.interpolateFactor = settings.interpolateFactor || 0
        },

        start: function () {},

        run: function (combatant, attacker) {
            if (!combatant.coll.groundConnect && attacker) {
                var pos = attacker.getAlignedPos(this.align, posScratch);
                this.offset && Vec3.add(pos, this.offset);
                Vec2.addMulF(pos, combatant.coll.size, -0.5);
                if (this.interpolateFactor) {
                    var stepFactor = ig.system.tick * 60,
                        progress = combatant.stepTimer / 0.3,
                        factor = this.interpolateFactor;
                    progress < 1 && (factor = 1 - progress + factor * progress);
                    factor = Math.pow(factor, stepFactor);
                    pos = Vec3.lerp(pos, combatant.coll.pos, factor, pos)
                }
                combatant.setPos(pos.x, pos.y, pos.z)
            }
            return this.maxTime && combatant.stepTimer >= this.maxTime
        }
    });

    sc.COMBAT_STUN.Z_VEL = sc.CombatStun.extend({
        value: 0,

        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Value to set z velocity to."
                }
            }
        }),

        init: function (settings) {
            this.value = settings.value || 0
        },

        start: function (combatant) {
            if (!combatant.coll.groundConnect) combatant.coll.vel.z = this.value
        }
    });

    sc.COMBAT_STUN.Z_BOUNCINESS = sc.CombatStun.extend({
        value: 0,

        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Value to set Z bounciness to"
                }
            }
        }),

        init: function (settings) {
            this.value = settings.value || 0
        },

        start: function (combatant) {
            combatant.coll.zBounciness = this.value
        }
    });

    sc.COMBAT_STUN.SET_FACE = sc.CombatStun.extend({
        value: 0,

        _wm: new ig.Config({
            attributes: {
                faces: {
                    _type: "Array",
                    _info: "Face direction options. By default, will choose one looking at target",
                    _sub: {
                        _type: "Face",
                        _select: ig.ActorEntity.FACE8
                    }
                },
                invert: {
                    _type: "Boolean",
                    _info: "If true: will select face that looks furthest away from target."
                }
            }
        }),

        init: function (settings) {
            this.faces = settings.faces;
            this.invert = settings.invert || false
        },

        start: function (combatant, attacker) {
            if (attacker) {
                var distVec = ig.CollTools.getDistVec2(combatant.coll, attacker.coll, distScratch);
                this.invert && Vec2.flip(distVec);
                var bestFace = null,
                    bestAngle = -1;
                for (var index = this.faces.length; index--;) {
                    var faceVec = ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.faces[index]], faceScratch),
                        angle = Vec2.angle(faceVec, distVec);
                    if (bestAngle == -1 || angle < bestAngle) {
                        bestAngle = angle;
                        bestFace = this.faces[index]
                    }
                }
                var faceVec = ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[bestFace], faceScratch);
                Vec2.assign(combatant.face, faceVec)
            }
        }
    })
});
ig.baked = !0;
