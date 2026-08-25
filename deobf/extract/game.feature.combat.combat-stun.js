ig.module("game.feature.combat.combat-stun").requires("impact.base.entity", "impact.base.actor-entity").defines(function() {
    sc.COMBAT_STUN = {};
    sc.CombatStun = ig.Class.extend({
        preHit: null,
        start: null,
        run: function() {
            return true
        }
    });
    sc.COMBAT_STUN = {};
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec3.create();
    sc.COMBAT_STUN.START_LOCK = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        preHit: function(a, b) {
            a.params && a.params.startLock(b)
        }
    });
    sc.COMBAT_STUN.END_LOCK = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        preHit: function(a, b) {
            a.params && a.params.endLock(b)
        }
    });
    sc.COMBAT_STUN.BLOCK_XY = sc.CombatStun.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.coll.vel.x = 0;
            a.coll.vel.y = 0
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
        init: function(a) {
            this.maxTime = a.maxTime
        },
        run: function(a) {
            if (a.coll.vel.z < 0) a.coll.vel.z = 0;
            return this.maxTime && a.stepTimer >= this.maxTime
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
        init: function(a) {
            this.distance = a.distance;
            this.speed = a.speed || 300;
            this.maxTime = a.maxTime || 0
        },
        start: function() {},
        run: function(a, d) {
            if (!d || a.coll.groundConnect ||
                a.coll.weight == -1) return this.maxTime;
            var f = ig.CollTools.getDistVec2(a.coll, d.coll, b);
            if (Vec2.length(f) - a.coll.size.x / 2 - d.coll.size.x / 2 > this.distance) {
                Vec2.length(f, this.speed);
                Vec2.assign(a.coll.vel, f);
                return this.maxTime && a.stepTimer >= this.maxTime
            }
            if (!this.maxTime) {
                f = Math.max(0, Vec2.length(a.coll.vel) - ig.system.tick * 5 * this.speed);
                Vec2.length(a.coll.vel, f)
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
        init: function(a) {
            this.maxSpeed = a.maxSpeed || 300;
            this.accel = a.accel || 1;
            this.offZ = a.offZ || 0;
            this.maxTime = a.maxTime || 0
        },
        start: function() {},
        run: function(a,
            b) {
            if (!a.coll.groundConnect && b) {
                var d = ((b.coll.pos.z - a.coll.pos.z + this.offZ) * 10 * this.accel).limit(-this.maxSpeed, this.maxSpeed);
                a.coll.vel.z = d
            }
            return this.maxTime && a.stepTimer >= this.maxTime
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
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = a.offset || null;
            this.maxTime = a.maxTime || 0;
            this.interpolateFactor = a.interpolateFactor || 0
        },
        start: function() {},
        run: function(a, b) {
            if (!a.coll.groundConnect && b) {
                var f = b.getAlignedPos(this.align, d);
                this.offset && Vec3.add(f, this.offset);
                Vec2.addMulF(f, a.coll.size, -0.5);
                if (this.interpolateFactor) {
                    var g =
                        ig.system.tick * 60,
                        h = a.stepTimer / 0.3,
                        i = this.interpolateFactor;
                    h < 1 && (i = 1 - h + i * h);
                    i = Math.pow(i, g);
                    f = Vec3.lerp(f, a.coll.pos, i, f)
                }
                a.setPos(f.x, f.y, f.z)
            }
            return this.maxTime && a.stepTimer >= this.maxTime
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
        init: function(a) {
            this.value = a.value || 0
        },
        start: function(a) {
            if (!a.coll.groundConnect) a.coll.vel.z = this.value
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
        init: function(a) {
            this.value = a.value || 0
        },
        start: function(a) {
            a.coll.zBounciness = this.value
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
        init: function(a) {
            this.faces = a.faces;
            this.invert = a.invert || false
        },
        start: function(c, d) {
            if (d) {
                var f = ig.CollTools.getDistVec2(c.coll, d.coll, b);
                this.invert && Vec2.flip(f);
                for (var g = null, h = -1, i = this.faces.length; i--;) {
                    var j = ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[this.faces[i]], a),
                        j = Vec2.angle(j, f);
                    if (h == -1 || j < h) {
                        h = j;
                        g = this.faces[i]
                    }
                }
                j = ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[g], a);
                Vec2.assign(c.face, j)
            }
        }
    })
});
ig.baked = !0;
