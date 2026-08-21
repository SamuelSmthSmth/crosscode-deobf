/**
 * impact.feature.camera.camera-steps
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.camera.camera-steps")`.
 *
 * Registers all camera event/action steps:
 *   - Event steps: `SET_CAMERA_TARGET`, `SET_CAMERA_POS`, `SET_CAMERA_BETWEEN`,
 *     `RESET_CAMERA`, `UNDO_CAMERA`, `SET_CAMERA_ZOOM`.
 *   - Action steps: `FOCUS_CAMERA`, `RESET_CAMERA`, `SET_CAMERA_ZOOM`.
 * Each pushes/removes an `ig.Camera.TargetHandle` on the `ig.camera` stack,
 * with speed, transition spline, optional zoom and optional persistent name.
 */
ig.module("impact.feature.camera.camera-steps")
    .requires("impact.base.action", "impact.base.event", "impact.feature.camera.camera")
    .defines(function () {

    /** Target selector functions for FOCUS_CAMERA (key → function(action)). */
    var targetSelectors = {
        SELF: function (action) {
            return action;
        },
        TARGET: function (action) {
            return action.getTarget(true);
        }
    };

    /** Focus modes for FOCUS_CAMERA. */
    var focusTypes = {
        SELF: 0,
        BETWEEN_TARGET: 1,
        KEEP_TARGET_IN_SCREEN: 2
    };

    /** Event step: focus the camera on an entity. */
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

        init: function (params) {
            assertContent(params, "entity");
            this.lockZ = params.lockZ || false;
            this.entity = params.entity;
            this.offsetX = params.offsetX || 0;
            this.offsetY = params.offsetY || 0;
            this.speed = params.speed || 0;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.zoom = params.zoom || 1;
            this.name = params.name || null;
        },

        start: function (event, eventParams) {
            var targetEntity = ig.Event.getEntity(this.entity, eventParams),
                handle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(targetEntity, this.lockZ), this.offsetX, this.offsetY);
            handle.setZoom(this.zoom);
            ig.camera.pushTarget(handle, this.speed, this.transition, this.name);
            this.name || event.addEventAttached(handle);
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Event step: focus the camera on a fixed position. */
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

        init: function (params) {
            assertContent(params, "pos");
            this.pos = params.pos;
            this.speed = params.speed || 0;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.zoom = params.zoom || 1;
            this.name = params.name || null;
        },

        start: function (event, eventParams) {
            var handle = new ig.Camera.TargetHandle(new ig.Camera.PosTarget(ig.Event.getVec2(this.pos, Vec2.create())), 0, 0);
            handle.setZoom(this.zoom);
            ig.camera.pushTarget(handle, this.speed, this.transition, this.name);
            this.name || event.addEventAttached(handle);
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Event step: focus the camera between two entities (average position). */
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

        init: function (params) {
            this.entity1 = params.entity1;
            this.entity2 = params.entity2;
            this.speed = params.speed || 0;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.zoom = params.zoom || 1;
            this.name = params.name || null;
        },

        start: function (event, eventParams) {
            var entity1 = ig.Event.getEntity(this.entity1, eventParams),
                entity2 = ig.Event.getEntity(this.entity2, eventParams),
                handle = new ig.Camera.TargetHandle(new ig.Camera.MultiEntityTarget([entity1, entity2]), 0, 0);
            handle.setZoom(this.zoom);
            ig.camera.pushTarget(handle, this.speed, this.transition, this.name);
            this.name || event.addEventAttached(handle);
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Event step: remove camera targets (all, or the named one). */
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

        init: function (params) {
            this.speed = params.speed || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.name = params.name || null;
        },

        start: function (event, eventParams) {
            if (this.name) {
                ig.camera.removeNamedTarget(this.name, this.speed, this.transition);
            } else {
                var attached = eventParams.eventAttached;
                for (var i = attached.length; i--;) {
                    if (attached[i] instanceof ig.Camera.TargetHandle) {
                        ig.camera.removeTarget(attached[i], this.speed, this.transition);
                        attached.splice(i, 1);
                    }
                }
            }
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Event step: undo the event's own camera target. */
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

        init: function (params) {
            this.speed = params.speed || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
        },

        start: function (event, eventParams) {
            var attached = eventParams.eventAttached;
            for (var i = attached.length; i--;) {
                if (attached[i] instanceof ig.Camera.TargetHandle) {
                    ig.camera.removeTarget(attached[i], this.speed, this.transition);
                    attached.splice(i, 1);
                    break;
                }
            }
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Event step: zoom the camera (applies to the active target handle). */
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

        init: function (params) {
            this.zoom = params.zoom || 1;
            this.duration = params.duration || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
        },

        start: function (event, eventParams) {
            var attached = eventParams.eventAttached;
            for (var i = attached.length; i--;) {
                if (attached[i] instanceof ig.Camera.TargetHandle) {
                    attached[i].setZoom(this.zoom, this.duration, this.transition);
                    break;
                }
            }
        },

        run: function () {
            return true;
        }
    });

    /** Action step: focus the camera on the action's target (or self). */
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
                    _select: targetSelectors,
                    _optional: true
                },
                focusType: {
                    _type: "String",
                    _info: "How camera is focused exactly",
                    _select: focusTypes
                },
                keepPlayerOffset: {
                    _type: "Number",
                    _info: "If defined: Keep offset of Player Camera multiplied with given weight. ",
                    _optional: true
                }
            }
        }),

        init: function (params) {
            this.offsetX = params.offsetX || 0;
            this.offsetY = params.offsetY || 0;
            this.speed = params.speed || 0;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
            this.zoom = params.zoom || 1;
            this.target = targetSelectors[params.target] || targetSelectors.SELF;
            this.focusType = focusTypes[params.focusType] || focusTypes.SELF;
            this.keepPlayerOffset = params.keepPlayerOffset || 0;
        },

        start: function (action) {
            var handle;
            if (this.focusType && action.getTarget(true)) {
                var targetEntity = action.getTarget(true);
                if (action.party == sc.COMBATANT_PARTY.ENEMY && targetEntity instanceof sc.PartyMemberEntity) {
                    targetEntity = ig.game.playerEntity;
                }
                handle = this.focusType == focusTypes.BETWEEN_TARGET ?
                    new ig.Camera.MultiEntityTarget([action, targetEntity]) :
                    new ig.Camera.MultiEntityTarget([targetEntity, action], true);
                handle = new ig.Camera.TargetHandle(handle, this.offsetX, this.offsetY);
            } else {
                handle = this.target(action) || action;
                handle = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(handle), this.offsetX, this.offsetY);
            }
            handle.setZoom(this.zoom);
            if (this.keepPlayerOffset && action.isPlayer) {
                var playerHandle = action.cameraHandle;
                handle.setOffset(
                    playerHandle.offset.x * this.keepPlayerOffset,
                    playerHandle.offset.y * this.keepPlayerOffset,
                    0,
                    playerHandle.zoomOffset.x * this.keepPlayerOffset,
                    playerHandle.zoomOffset.y * this.keepPlayerOffset,
                    true
                );
                handle.keepZoomFocusAligned = true;
            }
            ig.camera.pushTarget(handle, this.speed, this.transition);
            action.addActionAttached(handle);
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Action step: remove the action's camera target. */
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

        init: function (params) {
            this.speed = params.speed || 0;
            this.wait = params.wait || false;
            this.waitSkip = params.waitSkip || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
        },

        start: function (action) {
            var attached = action.actionAttached;
            for (var i = attached.length; i--;) {
                if (attached[i] instanceof ig.Camera.TargetHandle) {
                    ig.camera.removeTarget(attached[i], this.speed, this.transition);
                    attached.splice(i, 1);
                }
            }
        },

        run: function () {
            return this.wait ? ig.camera.getTimeUntilTargetReached() <= this.waitSkip : true;
        }
    });

    /** Action step: zoom the camera (applies to the action's target handle). */
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

        init: function (params) {
            this.zoom = params.zoom || 1;
            this.duration = params.duration || 0;
            this.transition = typeof params.transition == "string" ? KEY_SPLINES[params.transition] : params.transition;
        },

        start: function (action) {
            var attached = action.actionAttached;
            for (var i = attached.length; i--;) {
                if (attached[i] instanceof ig.Camera.TargetHandle) {
                    attached[i].setZoom(this.zoom, this.duration, this.transition);
                    break;
                }
            }
        },

        run: function () {
            return true;
        }
    });
});
ig.baked = !0;
