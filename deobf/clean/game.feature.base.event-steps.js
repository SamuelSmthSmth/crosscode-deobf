/**
 * @module game.feature.base.event-steps
 *
 * Base event steps: teleport color/time, checkpoint load/save, title screen,
 * money and item manipulation (add/remove/drop/toggle), CP granting, and
 * storing an entity stat into a variable.
 */
ig.module("game.feature.base.event-steps").requires("impact.base.utils", "impact.base.event", "impact.base.action").defines(function() {
    ig.EVENT_STEP.SET_TELEPORT_COLOR = ig.EventStepBase.extend({
        color: null,
        lighter: false,
        _wm: new ig.Config({
            attributes: {
                color: {
                    _type: "Color",
                    _info: "Color of overlay"
                },
                lighter: {
                    _type: "Boolean",
                    _info: "Apply color in lighter mode"
                }
            }
        }),
        init: function(settings) {
            this.color = new ig.RGBColor(settings.color);
            this.lighter = settings.lighter || false
        },
        start: function() {
            ig.game.setTeleportColor(this.color.r, this.color.g,
                this.color.b, this.lighter)
        }
    });
    ig.EVENT_STEP.SET_TELEPORT_TIME = ig.EventStepBase.extend({
        color: null,
        lighter: false,
        _wm: new ig.Config({
            attributes: {
                fadeIn: {
                    _type: "Number",
                    _info: "Color fade in time in seconds"
                },
                fadeOut: {
                    _type: "Number",
                    _info: "Color fade out time in seconds"
                }
            }
        }),
        init: function(settings) {
            this.fadeIn = settings.fadeIn || 0;
            this.fadeOut = settings.fadeOut || 0
        },
        start: function() {
            ig.game.setTeleportTime(this.fadeIn, this.fadeOut)
        }
    });
    ig.EVENT_STEP.LOAD = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            ig.storage.loadCheckpoint()
        }
    });
    ig.EVENT_STEP.SAVE = ig.EventStepBase.extend({
        marker: null,
        _wm: new ig.Config({
            attributes: {
                marker: {
                    _type: "Entity",
                    _info: "Marker to place entity at",
                    _optional: true
                }
            }
        }),
        init: function(settings) {
            this.marker = settings.marker
        },
        start: function(stepState, eventContext) {
            var teleportPos = null,
                markerEntity = ig.Event.getEntity(this.marker, eventContext);
            markerEntity && markerEntity.name && (teleportPos = new ig.TeleportPosition(markerEntity.name));
            ig.storage.saveCheckpoint(void 0, teleportPos)
        }
    });
    ig.EVENT_STEP.GOTO_TITLE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            ig.game.gotoTitle()
        }
    });
    ig.EVENT_STEP.ADD_MONEY = ig.EventStepBase.extend({
        amount: 0,
        _wm: new ig.Config({
            attributes: {
                amount: {
                    _type: "Number",
                    _info: "Amount to add",
                    _default: 0
                }
            },
            label: function() {
                return "<b>ADD MONEY: </b> <em>" + this.amount + "</em>"
            }
        }),
        init: function(settings) {
            this.amount = settings.amount || 0
        },
        start: function() {
            this.amount > 0 && sc.model.player.addCredit(this.amount)
        }
    });
    ig.EVENT_STEP.REMOVE_MONEY = ig.EventStepBase.extend({
        amount: 0,
        _wm: new ig.Config({
            attributes: {
                amount: {
                    _type: "Number",
                    _info: "Amount to remove",
                    _default: 0
                }
            },
            label: function() {
                return "<b>REMOVE MONEY: </b> <em>" +
                    this.amount + "</em>"
            }
        }),
        init: function(settings) {
            this.amount = settings.amount || 0
        },
        start: function() {
            this.amount > 0 && sc.model.player.removeCredit(this.amount)
        }
    });
    ig.EVENT_STEP.DROP_ITEM_ENTITY = ig.EventStepBase.extend({
        entity: null,
        item: 0,
        amount: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "the entity to spawn the drop from"
                },
                item: {
                    _type: "Item",
                    _info: "The item to spawn."
                },
                amount: {
                    _type: "Number",
                    _info: "Amount of the given item. 0 = 1.",
                    _default: 1
                }
            },
            label: function() {
                return "<b>DROP ITEM: </b> " + wmPrint("Entity",
                    this.entity) + " <em>" + wmPrint("Item", this.item) + "</em> x" + this.amount
            }
        }),
        init: function(settings) {
            this.entity = settings.entity || null;
            this.item = settings.item || 0;
            this.amount = settings.amount || 1
        },
        start: function(stepState, eventContext) {
            var sourceEntity = ig.Event.getEntity(this.entity, eventContext);
            sc.ItemDropEntity.spawnDrops(sourceEntity, ig.ENTITY_ALIGN.CENTER, ig.game.playerEntity, this.item, this.amount, sc.ITEM_DROP_TYPE.EVENT_PROP)
        }
    });
    ig.EVENT_STEP.GIVE_ITEM = ig.EventStepBase.extend({
        item: 0,
        amount: 0,
        skip: false,
        _wm: new ig.Config({
            attributes: {
                item: {
                    _type: "Item",
                    _info: "The item to spawn."
                },
                amount: {
                    _type: "NumberExpression",
                    _info: "Amount of the given item. 0 = 1.",
                    _default: 1
                },
                skip: {
                    _type: "Boolean",
                    _info: "True if the side gui should hide the obtained item",
                    _default: false
                }
            },
            label: function() {
                return "<b>GIVE ITEM: </b> <em>" + wmPrint("Item", this.item) + "</em> x" + this.amount + (this.skip ? "  <i>+ Skip Display</i>" : "")
            }
        }),
        init: function(settings) {
            this.item = settings.item || 0;
            this.amount = settings.amount || 1;
            this.skip = settings.skip || false
        },
        start: function() {
            var amount = ig.Event.getExpressionValue(this.amount);
            sc.model.player.addItem(this.item,
                amount, this.skip)
        }
    });
    ig.EVENT_STEP.ADD_CP = ig.EventStepBase.extend({
        element: null,
        amount: 0,
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element that gets the CP",
                    _select: sc.ELEMENT
                },
                amount: {
                    _type: "NumberExpression",
                    _info: "Amount of CP to give.",
                    _default: 1
                }
            },
            label: function() {
                return "<b>ADD CP: </b> <em>" + wmPrint("Element", this.element) + "</em> x" + this.amount
            }
        }),
        init: function(settings) {
            this.element = sc.ELEMENT[settings.element] || sc.ELEMENT.NEUTRAL;
            this.amount = settings.amount || 1
        },
        start: function() {
            var amount = ig.Event.getExpressionValue(this.amount);
            sc.model.player.addSkillPoints(amount, this.element, false, true)
        }
    });
    ig.EVENT_STEP.REMOVE_ITEM = ig.EventStepBase.extend({
        item: 0,
        amount: 0,
        unequip: false,
        _wm: new ig.Config({
            attributes: {
                item: {
                    _type: "Item",
                    _info: "The item to spawn."
                },
                amount: {
                    _type: "NumberExpression",
                    _info: "Amount of the given item. 0 = 1.",
                    _default: 1
                },
                unequip: {
                    _type: "Boolean",
                    _info: "If true, unequip the item, if it is equipped",
                    _optional: true,
                    _default: true
                }
            },
            label: function() {
                return "<b>REMOVE ITEM: </b> <em>" + wmPrint("Item", this.item) + "</em> x" +
                    this.amount + (this.unequip ? " [UNEQUIP]" : "")
            }
        }),
        init: function(settings) {
            this.item = settings.item || 0;
            this.amount = settings.amount || 1;
            this.unequip = settings.unequip || false
        },
        start: function() {
            var amount = ig.Event.getExpressionValue(this.amount);
            sc.model.player.removeItem(this.item, amount, false, this.unequip)
        }
    });
    ig.EVENT_STEP.TOGGLE_ITEM = ig.EventStepBase.extend({
        item: 0,
        _wm: new ig.Config({
            attributes: {
                item: {
                    _type: "Item",
                    _info: "Item to toggle"
                }
            }
        }),
        init: function(settings) {
            this.item = settings.item || 0
        },
        start: function() {
            var toggleSet = sc.model.player.getToggleSet(this.item);
            toggleSet &&
                sc.model.player.toggleItem(this.item, toggleSet)
        }
    });
    var ENTITY_STAT_TYPES = {
        BOTTOM_POS: 1,
        JUMPING: 2,
        SIZE: 3,
        VELOCITY: 4
    };
    ig.EVENT_STEP.SET_VAR_ENTITY_STAT = ig.EventStepBase.extend({
        varName: null,
        stat: null,
        entity: null,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to store stat"
                },
                entity: {
                    _type: "Entity",
                    _info: "Entity of which to fetch stat"
                },
                stat: {
                    _type: "String",
                    _info: "Type of Stat",
                    _select: ENTITY_STAT_TYPES
                }
            }
        }),
        init: function(settings) {
            this.varName = settings.varName;
            this.entity = settings.entity;
            this.stat = ENTITY_STAT_TYPES[settings.stat] || ENTITY_STAT_TYPES.RELATIVE_HP
        },
        start: function(stepState,
            eventContext) {
            var varName = ig.Event.getVarName(this.varName);
            if (varName) {
                var entity = ig.Event.getEntity(this.entity, eventContext);
                if (entity) {
                    var statValue;
                    this.stat == ENTITY_STAT_TYPES.BOTTOM_POS ? statValue = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM) : this.stat == ENTITY_STAT_TYPES.JUMPING ? statValue = entity.jumping || false : this.stat == ENTITY_STAT_TYPES.SIZE ? statValue = ig.copy(entity.coll.size) : this.stat == ENTITY_STAT_TYPES.VELOCITY && (statValue = ig.copy(entity.coll.vel));
                    ig.vars.set(varName, statValue)
                }
            } else ig.log("SET_VAR_ENTITY_STAT: Variable Name is not a String!")
        }
    })
});
ig.baked = !0;
