/**
 * @module game.feature.base.action-steps
 *
 * Base action steps: set an actor's sound type, modify a stat map entry,
 * and circle an entity (orbital camera-style movement around a target with
 * distance/rotation control).
 */
ig.module("game.feature.base.action-steps").requires("impact.base.action", "impact.base.actor-entity", "game.feature.npc.entities.sc-actor").defines(function() {
    var BOTTOM_POS = Vec3.create(),
        DIST_VEC = Vec2.create(),
        TARGET_POS = Vec3.create(),
        FACE_VEC = Vec2.create();
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
        init: function(settings) {
            this.value = settings.value
        },
        run: function(actor) {
            actor.soundType = this.value;
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
            init: function(settings) {
                this.map = settings.map;
                this.stat = settings.stat;
                this.changeType = settings.changeType;
                this.value = settings.value
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
        init: function(settings) {
            this.entity = settings.entity;
            this.distance = settings.distance === void 0 ? null : settings.distance;
            this.duration = settings.duration || 0;
            this.rotateTime = settings.rotateTime || 0;
            this.distAdjustSpeed = settings.distAdjustSpeed || 0;
            this.ccw = settings.ccw || false;
            this.zDistance = settings.zDistance === void 0 ? null : settings.zDistance;
            this.waitUntil = new ig.VarCondition(settings.waitUntil);
            this.waitTargetAlign = settings.waitTargetAlign || false
        },
        start: function(actor, eventContext) {
            var target = ig.Event.getEntity(this.entity, eventContext);
            if (target) {
                actor.stepTimer = this.duration;
                actor.stepData.target = target;
                actor.stepData.lastPos = Vec3.create(target.coll.pos)
            }
        },
        run: function(actor) {
            var target = actor.stepData.target;
            if (!target) return true;
            var speed = actor.coll.maxVel * actor.coll.relativeVel,
                actorBottom = actor.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, BOTTOM_POS),
                targetDelta = Vec3.assign(TARGET_POS, target.coll.pos);
            Vec3.sub(targetDelta, actor.stepData.lastPos);
            this.zDistance !== null ? Vec3.add(actorBottom, targetDelta) : Vec2.add(actorBottom, targetDelta);
            Vec3.assign(actor.stepData.lastPos, target.coll.pos);
            var targetBottom = target.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, TARGET_POS),
                target = Vec2.sub(actorBottom,
                    targetBottom, DIST_VEC);
            Vec2.isZero(target) && Vec2.assignC(target, 0, -1);
            var distance = Vec2.length(target),
                adjustSpeed = this.distAdjustSpeed || speed;
            if (this.distance !== null) {
                if (distance < this.distance) {
                    distance = distance + ig.system.tick * adjustSpeed;
                    if (distance > this.distance) distance = this.distance
                } else if (distance > this.distance) {
                    distance = distance - ig.system.tick * adjustSpeed;
                    if (distance < this.distance) distance = this.distance
                }
                Vec2.length(target, distance)
            }
            distance = distance * 2 * Math.PI;
            speed = this.rotateTime ? 1 / this.rotateTime : speed / distance;
            speed = speed * ig.system.tick * Math.PI * 2;
            actor.stepTimer < 0 && (this.waitUntil.evaluate() && !this.waitTargetAlign) && (speed = speed * (1 + actor.stepTimer / ig.system.tick));
            this.ccw || (speed = -speed);
            Vec2.rotate(target,
                speed);
            Vec2.assign(actorBottom, targetBottom);
            Vec2.add(actorBottom, target);
            if (this.zDistance !== null) {
                speed = targetBottom.z + this.zDistance;
                if (actorBottom.z > speed) {
                    actorBottom.z = actorBottom.z - ig.system.tick * adjustSpeed;
                    if (actorBottom.z < speed) actorBottom.z = speed
                } else if (actorBottom.z < speed) {
                    actorBottom.z = actorBottom.z + ig.system.tick * adjustSpeed;
                    if (actorBottom.z > speed) actorBottom.z = speed
                }
            }
            actorBottom.x = actorBottom.x - actor.coll.size.x / 2;
            actorBottom.y = actorBottom.y - actor.coll.size.y / 2;
            this.ccw ? Vec2.rotate90CW(target) : Vec2.rotate90CCW(target);
            actor.setPos(actorBottom.x, actorBottom.y, actorBottom.z);
            actor.faceDirFixed || Vec2.assign(actor.face, target);
            if (!this.waitUntil.evaluate()) return false;
            if (actor.stepTimer <= 0 && this.waitTargetAlign) {
                actorBottom = ig.CollTools.getDistVec2(actor.coll, actor.getTarget().coll, FACE_VEC);
                if (Vec2.angle(actorBottom, target) >
                    Math.PI / 2 * 0.125) return false
            }
            return actor.stepTimer <= 0
        }
    })
});
ig.baked = !0;
