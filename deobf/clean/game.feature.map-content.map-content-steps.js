/**
 * @module game.feature.map-content.map-content-steps
 *
 * Event steps for map content: opening the rhombus fast-travel map (with
 * teleport + camera focus), moving elevators, and untriggering props.
 */
ig.module("game.feature.map-content.map-content-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.OPEN_RHOMBUS_MAP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        _characterName: null,
        _mapName: null,
        init: function(settings) {
            this.quest = sc.quests.staticQuests[settings.quest];
            this.npc = settings.npc || null;
            this.map = settings.map || null
        },
        start: function(stepState, eventContext) {
            stepState.done = false;
            sc.model.stopSkip();
            sc.model.skipBlock = true;
            var rhombusMenu = new sc.RhombusMapMenu(function(mapName, marker, entity) {
                stepState.done = true;
                sc.model.skipBlock =
                    false;
                ig.game.teleport(mapName, marker ? new ig.TeleportPosition(marker) : null);
                mapName = new ig.Camera.TargetHandle(new ig.Camera.EntityTarget(entity), 0, 0);
                mapName.setZoom(1.5);
                ig.camera.pushTarget(mapName, 0.5, KEY_SPLINES.EASE_IN, null);
                eventContext.addEventAttached(mapName)
            }.bind(this));
            ig.gui.addGuiElement(rhombusMenu)
        },
        run: function(stepState) {
            return stepState.done
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
        init: function(settings) {
            this.entity = settings.entity;
            this.floorOption = settings.floorOption;
            this.wait = settings.wait
        },
        start: function(stepState, eventContext) {
            var elevator = ig.Event.getEntity(this.entity, eventContext);
            elevator && elevator instanceof ig.ENTITY.Elevator && elevator.moveToDestination(this.floorOption)
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
        init: function(settings) {
            this.entity = settings.entity;
            this.floorOption = settings.floorOption;
            this.wait = settings.wait
        },
        start: function(stepState, eventContext) {
            var elevator = ig.Event.getEntity(this.entity, eventContext);
            elevator && elevator instanceof ig.ENTITY.Elevator && elevator.moveToDestination(this.floorOption)
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
        init: function(settings) {
            this.entity = settings.entity
        },
        start: function(stepState, eventContext) {
            var prop = ig.Event.getEntity(this.entity,
                eventContext);
            prop && prop instanceof ig.ENTITY.Prop && prop.untriggerProp()
        }
    })
});
ig.baked = !0;
