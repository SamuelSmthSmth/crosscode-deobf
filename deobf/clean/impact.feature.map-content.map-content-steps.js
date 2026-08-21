/**
 * impact.feature.map-content.map-content-steps
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.map-content-steps")`.
 *
 * Steps to nudge props and open/close/enter doors.
 */
ig.module("impact.feature.map-content.map-content-steps")
    .requires("impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.NUDGE_PROP = ig.EventStepBase.extend({
        prop: null,
        playSound: false,

        _wm: new ig.Config({
            attributes: {
                prop: {
                    _type: "Entity",
                    _info: "Prop Entity",
                    _filterClass: "Prop",
                    _visualize: true
                },
                playSound: {
                    _type: "Boolean",
                    _info: "True if the nudge sound should be played"
                }
            }
        }),

        init: function (settings) {
            assertContent(settings, "prop");
            this.prop = settings.prop;
            this.playSound = settings.playSound || false;
        },

        start: function (entity, other) {
            var prop = ig.Event.getEntity(this.prop, other);
            prop.nudge && prop.nudge(this.playSound);
        }
    });

    ig.EVENT_STEP.OPEN_DOOR = ig.EventStepBase.extend({
        door: null,

        _wm: new ig.Config({
            attributes: {
                door: {
                    _type: "Entity",
                    _info: "Door Entity to enter"
                },
                openTime: {
                    _type: "Number",
                    _info: "Time in seconds to leave the door open",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.door = settings.door;
            this.openTime = settings.openTime;
        },

        start: function () {
            var door = ig.Event.getEntity(this.door);
            door && door.open && door.open(false, this.openTime);
        }
    });

    ig.EVENT_STEP.CLOSE_DOOR = ig.EventStepBase.extend({
        door: null,

        _wm: new ig.Config({
            attributes: {
                door: {
                    _type: "Entity",
                    _info: "Door Entity to close"
                }
            }
        }),

        init: function (settings) {
            this.door = settings.door;
        },

        start: function () {
            var door = ig.Event.getEntity(this.door);
            door && door.close && door.close();
        }
    });

    ig.ACTION_STEP.ENTER_DOOR = ig.ActionStepBase.extend({
        door: null,

        _wm: new ig.Config({
            attributes: {
                door: {
                    _type: "Entity",
                    _info: "Door Entity to enter"
                }
            }
        }),

        init: function (settings) {
            assertContent(settings, "door");
            this.door = settings.door;
        },

        run: function (entity) {
            var door = ig.Event.getEntity(this.door);
            door && door.enterEntity && door.enterEntity(entity);
            return true;
        }
    });
});
ig.baked = !0;
