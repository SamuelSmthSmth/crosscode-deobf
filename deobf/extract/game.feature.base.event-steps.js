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
        init: function(a) {
            this.color = new ig.RGBColor(a.color);
            this.lighter = a.lighter || false
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
        init: function(a) {
            this.fadeIn = a.fadeIn || 0;
            this.fadeOut = a.fadeOut || 0
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
        init: function(a) {
            this.marker = a.marker
        },
        start: function(a, b) {
            var c = null,
                e = ig.Event.getEntity(this.marker, b);
            e && e.name && (c = new ig.TeleportPosition(e.name));
            ig.storage.saveCheckpoint(void 0, c)
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
        init: function(a) {
            this.amount = a.amount || 0
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
        init: function(a) {
            this.amount = a.amount || 0
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
        init: function(a) {
            this.entity = a.entity || null;
            this.item = a.item || 0;
            this.amount = a.amount || 1
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            sc.ItemDropEntity.spawnDrops(c, ig.ENTITY_ALIGN.CENTER, ig.game.playerEntity, this.item, this.amount, sc.ITEM_DROP_TYPE.EVENT_PROP)
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
        init: function(a) {
            this.item = a.item || 0;
            this.amount = a.amount || 1;
            this.skip = a.skip || false
        },
        start: function() {
            var a = ig.Event.getExpressionValue(this.amount);
            sc.model.player.addItem(this.item,
                a, this.skip)
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
        init: function(a) {
            this.element = sc.ELEMENT[a.element] || sc.ELEMENT.NEUTRAL;
            this.amount = a.amount || 1
        },
        start: function() {
            var a = ig.Event.getExpressionValue(this.amount);
            sc.model.player.addSkillPoints(a, this.element, false, true)
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
        init: function(a) {
            this.item = a.item || 0;
            this.amount = a.amount || 1;
            this.unequip = a.unequip || false
        },
        start: function() {
            var a = ig.Event.getExpressionValue(this.amount);
            sc.model.player.removeItem(this.item, a, false, this.unequip)
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
        init: function(a) {
            this.item = a.item || 0
        },
        start: function() {
            var a = sc.model.player.getToggleSet(this.item);
            a &&
                sc.model.player.toggleItem(this.item, a)
        }
    });
    var b = {
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
                    _select: b
                }
            }
        }),
        init: function(a) {
            this.varName = a.varName;
            this.entity = a.entity;
            this.stat = b[a.stat] || b.RELATIVE_HP
        },
        start: function(a,
            d) {
            var c = ig.Event.getVarName(this.varName);
            if (c) {
                var e = ig.Event.getEntity(this.entity, d);
                if (e) {
                    var f;
                    this.stat == b.BOTTOM_POS ? f = e.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM) : this.stat == b.JUMPING ? f = e.jumping || false : this.stat == b.SIZE ? f = ig.copy(e.coll.size) : this.stat == b.VELOCITY && (f = ig.copy(e.coll.vel));
                    ig.vars.set(c, f)
                }
            } else ig.log("SET_VAR_ENTITY_STAT: Variable Name is not a String!")
        }
    })
});
ig.baked = !0;
