ig.module("game.feature.base.action-steps").requires("impact.base.action", "impact.base.actor-entity", "game.feature.npc.entities.sc-actor").defines(function() {
    var b = Vec3.create(),
        a = Vec2.create(),
        d = Vec3.create(),
        c = Vec2.create();
    ig.ACTION_STEP.SET_SOUNDTYPE = ig.ActionStepBase.extend({
        value: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "New Soundtype",
                    _select: sc.ACTOR_SOUND
                }
            }
        }),
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.soundType = this.value;
            return true
        }
    });
    ig.ACTION_STEP.CHANGE_STAT_MAP_NUMBER =
        ig.ActionStepBase.extend({
            map: "",
            stat: "",
            changeType: null,
            value: 0,
            _wm: new ig.Config({
                attributes: {
                    map: {
                        _type: "String",
                        _info: "The map."
                    },
                    stat: {
                        _type: "String",
                        _info: "The stat."
                    },
                    changeType: {
                        _type: "String",
                        _info: "Type of modification",
                        _select: {
                            set: 1,
                            add: 1,
                            sub: 1
                        }
                    },
                    value: {
                        _type: "Number",
                        _info: "Number"
                    }
                },
                label: function() {
                    return "<i style='color: orange'>SET STAT MAP</i>: " + this.map + "." + this.stat
                }
            }),
            init: function(a) {
                this.map = a.map;
                this.stat = a.stat;
                this.changeType = a.changeType;
                this.value = a.value
            },
            start: function() {
                this.value &&
                    (this.changeType == "set" ? sc.stats.setMap(this.map, this.stat, this.value) : this.changeType == "add" ? sc.stats.addMap(this.map, this.stat, this.value) : this.changeType == "sub" && sc.stats.subMap(this.map, this.stat, this.value))
            }
        });
    ig.ACTION_STEP.CIRCLE_ENTITY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to focus camera on"
                },
                distance: {
                    _type: "Number",
                    _info: "Distance to target",
                    _default: 32,
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of rotating movement"
                },
                ccw: {
                    _type: "Boolean",
                    _info: "If true, rotate counterclockwise"
                },
                rotateTime: {
                    _type: "Number",
                    _info: "Seconds for one full rotation. If not defined used current speed to determine rotation speed",
                    _optional: true
                },
                distAdjustSpeed: {
                    _type: "Number",
                    _info: "Speed with which projectile adjust distance to target (pixel per seconds)"
                },
                zDistance: {
                    _type: "Number",
                    _info: "If defined: Interpolate to this z Distance (with same speed as dist interpolation)",
                    _optional: true
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: continue spinning until condition evaluates to true. Duration is minimum wait",
                    _optional: true
                },
                waitTargetAlign: {
                    _type: "Boolean",
                    _info: "If true: keep rotating until rotate velocity roughly matches direction to target"
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity;
            this.distance = a.distance === void 0 ? null : a.distance;
            this.duration = a.duration || 0;
            this.rotateTime = a.rotateTime || 0;
            this.distAdjustSpeed = a.distAdjustSpeed || 0;
            this.ccw = a.ccw || false;
            this.zDistance = a.zDistance === void 0 ? null : a.zDistance;
            this.waitUntil = new ig.VarCondition(a.waitUntil);
            this.waitTargetAlign = a.waitTargetAlign || false
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            if (c) {
                a.stepTimer = this.duration;
                a.stepData.target = c;
                a.stepData.lastPos = Vec3.create(c.coll.pos)
            }
        },
        run: function(e) {
            var f = e.stepData.target;
            if (!f) return true;
            var g = e.coll.maxVel * e.coll.relativeVel,
                h = e.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b),
                i = Vec3.assign(d, f.coll.pos);
            Vec3.sub(i, e.stepData.lastPos);
            this.zDistance !== null ? Vec3.add(h, i) : Vec2.add(h, i);
            Vec3.assign(e.stepData.lastPos, f.coll.pos);
            var j = f.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d),
                f = Vec2.sub(h,
                    j, a);
            Vec2.isZero(f) && Vec2.assignC(f, 0, -1);
            var k = Vec2.length(f),
                i = this.distAdjustSpeed || g;
            if (this.distance !== null) {
                if (k < this.distance) {
                    k = k + ig.system.tick * i;
                    if (k > this.distance) k = this.distance
                } else if (k > this.distance) {
                    k = k - ig.system.tick * i;
                    if (k < this.distance) k = this.distance
                }
                Vec2.length(f, k)
            }
            k = k * 2 * Math.PI;
            g = this.rotateTime ? 1 / this.rotateTime : g / k;
            g = g * ig.system.tick * Math.PI * 2;
            e.stepTimer < 0 && (this.waitUntil.evaluate() && !this.waitTargetAlign) && (g = g * (1 + e.stepTimer / ig.system.tick));
            this.ccw || (g = -g);
            Vec2.rotate(f,
                g);
            Vec2.assign(h, j);
            Vec2.add(h, f);
            if (this.zDistance !== null) {
                g = j.z + this.zDistance;
                if (h.z > g) {
                    h.z = h.z - ig.system.tick * i;
                    if (h.z < g) h.z = g
                } else if (h.z < g) {
                    h.z = h.z + ig.system.tick * i;
                    if (h.z > g) h.z = g
                }
            }
            h.x = h.x - e.coll.size.x / 2;
            h.y = h.y - e.coll.size.y / 2;
            this.ccw ? Vec2.rotate90CW(f) : Vec2.rotate90CCW(f);
            e.setPos(h.x, h.y, h.z);
            e.faceDirFixed || Vec2.assign(e.face, f);
            if (!this.waitUntil.evaluate()) return false;
            if (e.stepTimer <= 0 && this.waitTargetAlign) {
                h = ig.CollTools.getDistVec2(e.coll, e.getTarget().coll, c);
                if (Vec2.angle(h, f) >
                    Math.PI / 2 * 0.125) return false
            }
            return e.stepTimer <= 0
        }
    })
});
ig.baked = !0;
