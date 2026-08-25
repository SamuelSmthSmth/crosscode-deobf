ig.module("impact.feature.map-content.map-content-steps").requires("impact.base.action", "impact.base.event").defines(function() {
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
        init: function(b) {
            assertContent(b, "prop");
            this.prop = b.prop;
            this.playSound = b.playSound || false
        },
        start: function(b,
            a) {
            var d = ig.Event.getEntity(this.prop, a);
            d.nudge && d.nudge(this.playSound)
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
        init: function(b) {
            this.door = b.door;
            this.openTime = b.openTime
        },
        start: function() {
            var b = ig.Event.getEntity(this.door);
            b && b.open && b.open(false, this.openTime)
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
        init: function(b) {
            this.door = b.door
        },
        start: function() {
            var b = ig.Event.getEntity(this.door);
            b && b.close && b.close()
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
        init: function(b) {
            assertContent(b, "door");
            this.door = b.door
        },
        run: function(b) {
            var a = ig.Event.getEntity(this.door);
            a && a.enterEntity && a.enterEntity(b);
            return true
        }
    })
});
ig.baked = !0;
