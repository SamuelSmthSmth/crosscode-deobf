ig.module("impact.feature.camera.camera-steps").requires("impact.base.action", "impact.base.event", "impact.feature.camera.camera").defines(function() {
    ig.EVENT_STEP.SET_CAMERA_TARGET = ig.EventStepBase.extend({
        entity: null,
        offsetX: 0,
        offsetY: 0,
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        zoom: 1,
        lockZ: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to focus camera on"
                },
                offsetX: {
                    _type: "Number",
                    _info: "x offset to target entity"
                },
                offsetY: {
                    _type: "Number",
                    _info: "y offset to target entity"
                },
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                },
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                name: {
                    _type: "String",
                    _info: "If set, camera target will remain even after event is done and can only be removed explictly via its name.",
                    _optional: true
                },
                lockZ: {
                    _type: "Boolean",
                    _info: "if true, do not move change cam if entity moves along Z axis.",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity");
            this.lockZ = a.lockZ || false;
            this.entity = a.entity;
            this.offsetX = a.offsetX || 0;
            this.offsetY = a.offsetY || 0;
            this.speed = a.speed || 0;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition;
            this.zoom = a.zoom || 1;
            this.name = a.name || null
        },
        start: function(a, b) {
            var e = ig.Event.getEntity(this.entity,
                    b),
                e = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(e, this.lockZ), this.offsetX, this.offsetY);
            e.setZoom(this.zoom);
            ig.camera.pushTarget(e, this.speed, this.transition, this.name);
            this.name || b.addEventAttached(e)
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    ig.EVENT_STEP.SET_CAMERA_POS = ig.EventStepBase.extend({
        pos: null,
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        zoom: 1,
        _wm: new ig.Config({
            attributes: {
                pos: {
                    _type: "Vec2",
                    _info: "Position to focus camera on",
                    _visualize: true,
                    _pointSelect: true
                },
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                },
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                name: {
                    _type: "String",
                    _info: "If set, camera target will remain even after event is done and can only be removed explictly via its name.",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "pos");
            this.pos = a.pos;
            this.speed = a.speed || 0;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition;
            this.zoom = a.zoom || 1;
            this.name = a.name || null
        },
        start: function(a, b) {
            var e = new ig.Camera.TargetHandle(new ig.Camera.PosTarget(ig.Event.getVec2(this.pos, Vec2.create())), 0, 0);
            e.setZoom(this.zoom);
            ig.camera.pushTarget(e, this.speed, this.transition, this.name);
            this.name || b.addEventAttached(e)
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    Vec3.create();
    ig.EVENT_STEP.SET_CAMERA_BETWEEN = ig.EventStepBase.extend({
        entity1: null,
        entity2: null,
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        zoom: 1,
        _wm: new ig.Config({
            attributes: {
                entity1: {
                    _type: "Entity",
                    _info: "First entity"
                },
                entity2: {
                    _type: "Entity",
                    _info: "Second entity"
                },
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                },
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                name: {
                    _type: "String",
                    _info: "If set, camera target will remain even after event is done and can only be removed explictly via its name.",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.entity1 = a.entity1;
            this.entity2 = a.entity2;
            this.speed = a.speed || 0;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition;
            this.zoom = a.zoom || 1;
            this.name = a.name || null
        },
        start: function(a, b) {
            var e = ig.Event.getEntity(this.entity1, b),
                f = ig.Event.getEntity(this.entity2, b),
                e = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([e, f]), 0, 0);
            e.setZoom(this.zoom);
            ig.camera.pushTarget(e, this.speed, this.transition, this.name);
            this.name || b.addEventAttached(e)
        },
        run: function() {
            return this.wait ?
                ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    ig.EVENT_STEP.RESET_CAMERA = ig.EventStepBase.extend({
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        name: null,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                },
                name: {
                    _type: "String",
                    _info: "If defined: only remove camera target of given name",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.speed = a.speed || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.name = a.name || null
        },
        start: function(a, b) {
            if (this.name) ig.camera.removeNamedTarget(this.name, this.speed, this.transition);
            else
                for (var e = b.eventAttached, f = e.length; f--;)
                    if (e[f] instanceof ig.Camera.TargetHandle) {
                        ig.camera.removeTarget(e[f],
                            this.speed, this.transition);
                        e.splice(f, 1)
                    }
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    ig.EVENT_STEP.UNDO_CAMERA = ig.EventStepBase.extend({
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                }
            }
        }),
        init: function(a) {
            this.speed = a.speed || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0
        },
        start: function(a, b) {
            for (var e = b.eventAttached, f = e.length; f--;)
                if (e[f] instanceof ig.Camera.TargetHandle) {
                    ig.camera.removeTarget(e[f], this.speed, this.transition);
                    e.splice(f, 1);
                    break
                }
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <=
                this.waitSkip : true
        }
    });
    ig.EVENT_STEP.SET_CAMERA_ZOOM = ig.EventStepBase.extend({
        duration: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        _wm: new ig.Config({
            attributes: {
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of zoom transition"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                }
            }
        }),
        init: function(a) {
            this.zoom = a.zoom || 1;
            this.duration = a.duration || 0;
            this.transition = typeof a.transition == "string" ?
                KEY_SPLINES[a.transition] : a.transition
        },
        start: function(a, b) {
            for (var e = b.eventAttached, f = e.length; f--;)
                if (e[f] instanceof ig.Camera.TargetHandle) {
                    e[f].setZoom(this.zoom, this.duration, this.transition);
                    break
                }
        },
        run: function() {
            return true
        }
    });
    var b = {
            SELF: function(a) {
                return a
            },
            TARGET: function(a) {
                return a.getTarget(true)
            }
        },
        a = {
            SELF: 0,
            BETWEEN_TARGET: 1,
            KEEP_TARGET_IN_SCREEN: 2
        };
    ig.ACTION_STEP.FOCUS_CAMERA = ig.EventStepBase.extend({
        offsetX: 0,
        offsetY: 0,
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        zoom: 1,
        _wm: new ig.Config({
            attributes: {
                offsetX: {
                    _type: "Number",
                    _info: "x offset to target entity"
                },
                offsetY: {
                    _type: "Number",
                    _info: "y offset to target entity"
                },
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                },
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                target: {
                    _type: "String",
                    _info: "Which target to focus with the camera",
                    _select: b,
                    _optional: true
                },
                focusType: {
                    _type: "String",
                    _info: "How camera is focused exactly",
                    _select: a
                },
                keepPlayerOffset: {
                    _type: "Number",
                    _info: "If defined: Keep offset of Player Camera multiplied with given weight. ",
                    _optional: true
                }
            }
        }),
        init: function(d) {
            this.offsetX = d.offsetX || 0;
            this.offsetY = d.offsetY || 0;
            this.speed = d.speed || 0;
            this.wait = d.wait || false;
            this.waitSkip = d.waitSkip ||
                0;
            this.transition = typeof d.transition == "string" ? KEY_SPLINES[d.transition] : d.transition;
            this.zoom = d.zoom || 1;
            this.target = b[d.target] || b.SELF;
            this.focusType = a[d.focusType] || a.SELF;
            this.keepPlayerOffset = d.keepPlayerOffset || 0
        },
        start: function(b) {
            var c;
            if (this.focusType && b.getTarget(true)) {
                c = b.getTarget(true);
                if (b.party == sc.COMBATANT_PARTY.ENEMY && c instanceof sc.PartyMemberEntity) c = ig.game.playerEntity;
                c = this.focusType == a.BETWEEN_TARGET ? new ig.Camera.MultiEntityTarget([b, c]) : new ig.Camera.MultiEntityTarget([c,
                    b
                ], true);
                c = new ig.Camera.TargetHandle(c, this.offsetX, this.offsetY)
            } else {
                c = this.target(b) || b;
                c = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(c), this.offsetX, this.offsetY)
            }
            c.setZoom(this.zoom);
            if (this.keepPlayerOffset && b.isPlayer) {
                var e = b.cameraHandle;
                c.setOffset(e.offset.x * this.keepPlayerOffset, e.offset.y * this.keepPlayerOffset, 0, e.zoomOffset.x * this.keepPlayerOffset, e.zoomOffset.y * this.keepPlayerOffset, true);
                c.keepZoomFocusAligned = true
            }
            ig.camera.pushTarget(c, this.speed, this.transition);
            b.addActionAttached(c)
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    ig.ACTION_STEP.RESET_CAMERA = ig.EventStepBase.extend({
        speed: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _info: "Speed of camera movement"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until camera movement is done"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before target is reached."
                }
            }
        }),
        init: function(a) {
            this.speed = a.speed || 0;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition
        },
        start: function(a) {
            for (var a = a.actionAttached, b = a.length; b--;)
                if (a[b] instanceof ig.Camera.TargetHandle) {
                    ig.camera.removeTarget(a[b], this.speed, this.transition);
                    a.splice(b, 1)
                }
        },
        run: function() {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true
        }
    });
    ig.ACTION_STEP.SET_CAMERA_ZOOM = ig.EventStepBase.extend({
        duration: 0,
        transition: KEY_SPLINES.EASE_IN_OUT,
        wait: false,
        waitSkip: 0,
        _wm: new ig.Config({
            attributes: {
                zoom: {
                    _type: "Number",
                    _info: "Zoom Value. 1=default, 2=twice pixel size",
                    _default: 1
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of zoom transition"
                },
                transition: {
                    _type: "String",
                    _select: KEY_SPLINES,
                    _info: "Transition type"
                }
            }
        }),
        init: function(a) {
            this.zoom = a.zoom || 1;
            this.duration = a.duration || 0;
            this.transition = typeof a.transition == "string" ? KEY_SPLINES[a.transition] : a.transition
        },
        start: function(a) {
            for (var a = a.actionAttached,
                    b = a.length; b--;)
                if (a[b] instanceof ig.Camera.TargetHandle) {
                    a[b].setZoom(this.zoom, this.duration, this.transition);
                    break
                }
        },
        run: function() {
            return true
        }
    })
});
ig.baked = !0;
