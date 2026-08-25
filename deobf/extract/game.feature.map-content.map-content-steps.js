ig.module("game.feature.map-content.map-content-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.OPEN_RHOMBUS_MAP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        _characterName: null,
        _mapName: null,
        init: function(b) {
            this.quest = sc.quests.staticQuests[b.quest];
            this.npc = b.npc || null;
            this.map = b.map || null
        },
        start: function(b, a) {
            b.done = false;
            sc.model.stopSkip();
            sc.model.skipBlock = true;
            var d = new sc.RhombusMapMenu(function(c, d, f) {
                b.done = true;
                sc.model.skipBlock =
                    false;
                ig.game.teleport(c, d ? new ig.TeleportPosition(d) : null);
                c = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(f), 0, 0);
                c.setZoom(1.5);
                ig.camera.pushTarget(c, 0.5, KEY_SPLINES.EASE_IN, null);
                a.addEventAttached(c)
            }.bind(this));
            ig.gui.addGuiElement(d)
        },
        run: function(b) {
            return b.done
        }
    });
    ig.EVENT_STEP.MOVE_ELEVATOR = ig.EventStepBase.extend({
        entity: null,
        floorOption: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Elevator Entity",
                    _filterClass: "Elevator"
                },
                floorOption: {
                    _type: "Number",
                    _info: "The number of the floor option to use."
                },
                wait: {
                    _type: "Boolean",
                    _info: "If true, wait until teleported"
                }
            }
        }),
        init: function(b) {
            this.entity = b.entity;
            this.floorOption = b.floorOption;
            this.wait = b.wait
        },
        start: function(b, a) {
            var d = ig.Event.getEntity(this.entity, a);
            d && d instanceof ig.ENTITY.Elevator && d.moveToDestination(this.floorOption)
        },
        run: function() {
            return !this.wait
        }
    });
    ig.EVENT_STEP.MOVE_ELEVATOR_START = ig.EventStepBase.extend({
        entity: null,
        floorOption: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Elevator Entity",
                    _filterClass: "Elevator"
                }
            }
        }),
        init: function(b) {
            this.entity = b.entity;
            this.floorOption = b.floorOption;
            this.wait = b.wait
        },
        start: function(b, a) {
            var d = ig.Event.getEntity(this.entity, a);
            d && d instanceof ig.ENTITY.Elevator && d.moveToDestination(this.floorOption)
        },
        run: function() {
            return !this.wait
        }
    });
    ig.EVENT_STEP.UNTRIGGER_PROP = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Prop entity",
                    _filterClass: "Prop"
                }
            }
        }),
        init: function(b) {
            this.entity = b.entity
        },
        start: function(b, a) {
            var d = ig.Event.getEntity(this.entity,
                a);
            d && d instanceof ig.ENTITY.Prop && d.untriggerProp()
        }
    })
});
ig.baked = !0;
