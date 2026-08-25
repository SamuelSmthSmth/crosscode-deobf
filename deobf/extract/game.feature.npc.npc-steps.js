ig.module("game.feature.npc.npc-steps").requires("impact.base.action", "impact.base.event", "game.feature.npc.npc-runners").defines(function() {
    ig.EVENT_STEP.DO_THE_SHAKE = ig.EventStepBase.extend({
        person: null,
        expression: null,
        message: null,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Talking person"
                }
            },
            label: function() {
                return "<em style='color: greenyellow'>DO THE SHAKE</em>"
            }
        }),
        init: function(b) {
            if (b.person && b.person.person) {
                this.person = b.person.person;
                this.charExpression = new sc.CharacterExpression(b.person.person,
                    b.person.expression)
            } else this.person = b.person
        },
        clearCached: function() {
            this.charExpression && this.charExpression.decreaseRef()
        },
        start: function() {
            this.charExpression && sc.model.message.setExpression(this.person, this.charExpression);
            var b = ig.lang.get("sc.gui.shakeit.first");
            this.message = ig.lang.get("sc.gui.shakeit.start") + " ";
            this.message = this.message + (b[Math.floor(Math.random() * (b.length - 1))] + " ");
            b = ig.lang.get("sc.gui.shakeit.second");
            this.message = this.message + (b[Math.floor(Math.random() * (b.length -
                1))] + " ");
            b = ig.lang.get("sc.gui.shakeit.third");
            this.message = this.message + (b[Math.floor(Math.random() * (b.length - 1))] + "!");
            sc.model.message.showMessage(this.person, this.message, false)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.EVENT_STEP.RESET_NPC = ig.EventStepBase.extend({
        npc: null,
        _wm: new ig.Config({
            attributes: {
                npc: {
                    _type: "Entity",
                    _info: "NPC to reset"
                }
            }
        }),
        init: function(b) {
            this.npc = b.npc
        },
        start: function(b, a) {
            var d = ig.Event.getEntity(this.npc, a);
            if (d && d instanceof ig.ENTITY.NPC) {
                d.cancelAction();
                d.resetNpcState()
            }
        }
    });
    ig.EVENT_STEP.SET_NPC_RUNNERS = ig.EventStepBase.extend({
        frequency: null,
        _wm: new ig.Config({
            attributes: {
                frequency: {
                    _type: "String",
                    _info: "Frequency of NPC Runners. Null = no NPC runners",
                    _select: sc.NPC_RUNNER_GROUP,
                    _withNull: true
                }
            }
        }),
        init: function(b) {
            this.frequency = b.frequency
        },
        start: function() {
            sc.npcRunner.setGroup(sc.NPC_RUNNER_GROUP[this.frequency] || null)
        }
    });
    ig.EVENT_STEP.RESET_NPC_RUNNERS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.npcRunner.resetToMapGroup()
        }
    });
    ig.EVENT_STEP.SET_NPC_CONFIG = ig.EventStepBase.extend({
        npc: null,
        config: null,
        _wm: new ig.Config({
            attributes: {
                npc: {
                    _type: "NPC",
                    _info: "NPC to change"
                },
                config: {
                    _type: "String",
                    _info: "Config name to apply"
                }
            }
        }),
        init: function(b) {
            this.npc = b.npc;
            this.config = b.config
        },
        start: function(b, a) {
            var d = ig.Event.getEntity(this.npc, a);
            d && d instanceof ig.ENTITY.NPC && d.setConfig(this.config)
        }
    });
    ig.ACTION_STEP.RESET_NPC = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(b) {
            b instanceof
            ig.ENTITY.NPC && b.resetNpcState();
            return true
        }
    });
    ig.ACTION_STEP.APPLY_NPC_CONFIG = ig.EventStepBase.extend({
        config: null,
        _wm: new ig.Config({
            attributes: {
                config: {
                    _type: "String",
                    _info: "Config name to apply"
                }
            }
        }),
        init: function(b) {
            this.config = b.config
        },
        run: function(b) {
            var a = b.configs[this.config];
            a && a.apply(b);
            return true
        }
    })
});
ig.baked = !0;
