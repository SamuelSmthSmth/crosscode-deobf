/**
 * game.feature.npc.npc-steps
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.npc-steps")`.
 *
 * Event and action step classes for NPC control:
 *   - DO_THE_SHAKE, RESET_NPC, SET_NPC_RUNNERS, RESET_NPC_RUNNERS,
 *     SET_NPC_CONFIG (event steps)
 *   - RESET_NPC, APPLY_NPC_CONFIG (action steps)
 */
ig.module("game.feature.npc.npc-steps").requires(
    "impact.base.action",
    "impact.base.event",
    "game.feature.npc.npc-runners"
).defines(function () {

    /**
     * Event step that makes an NPC "do the shake" — shows a randomly
     * composed silly message to the player through an NPC.
     */
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
            label: function () {
                return "<em style='color: greenyellow'>DO THE SHAKE</em>";
            }
        }),
        init: function (data) {
            if (data.person && data.person.person) {
                this.person = data.person.person;
                this.charExpression = new sc.CharacterExpression(
                    data.person.person,
                    data.person.expression
                );
            } else {
                this.person = data.person;
            }
        },
        clearCached: function () {
            this.charExpression && this.charExpression.decreaseRef();
        },
        start: function () {
            this.charExpression && sc.model.message.setExpression(
                this.person, this.charExpression
            );
            var firstParts = ig.lang.get("sc.gui.shakeit.first");
            this.message = ig.lang.get("sc.gui.shakeit.start") + " ";
            this.message += firstParts[Math.floor(Math.random() * (firstParts.length - 1))] + " ";
            var secondParts = ig.lang.get("sc.gui.shakeit.second");
            this.message += secondParts[Math.floor(Math.random() * (secondParts.length - 1))] + " ";
            var thirdParts = ig.lang.get("sc.gui.shakeit.third");
            this.message += thirdParts[Math.floor(Math.random() * (thirdParts.length - 1))] + "!";
            sc.model.message.showMessage(this.person, this.message, false);
        },
        run: function () {
            return !sc.model.message.isBlocking();
        }
    });

    /**
     * Event step: cancel an NPC's current action and reset its state
     * (condition re-evaluation, reappearance, etc.).
     */
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
        init: function (data) {
            this.npc = data.npc;
        },
        start: function (data, entity) {
            var npc = ig.Event.getEntity(this.npc, entity);
            if (npc && npc instanceof ig.ENTITY.NPC) {
                npc.cancelAction();
                npc.resetNpcState();
            }
        }
    });

    /**
     * Event step: change the NPC runner frequency group.
     */
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
        init: function (data) {
            this.frequency = data.frequency;
        },
        start: function () {
            sc.npcRunner.setGroup(
                sc.NPC_RUNNER_GROUP[this.frequency] || null
            );
        }
    });

    /**
     * Event step: restore NPC runners to the map's default group.
     */
    ig.EVENT_STEP.RESET_NPC_RUNNERS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            sc.npcRunner.resetToMapGroup();
        }
    });

    /**
     * Event step: apply a named config (from the character definition)
     * to an NPC.
     */
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
        init: function (data) {
            this.npc = data.npc;
            this.config = data.config;
        },
        start: function (data, entity) {
            var npc = ig.Event.getEntity(this.npc, entity);
            npc && npc instanceof ig.ENTITY.NPC && npc.setConfig(this.config);
        }
    });

    /**
     * Action step: reset an NPC's state when a movement action finishes.
     */
    ig.ACTION_STEP.RESET_NPC = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity instanceof ig.ENTITY.NPC && entity.resetNpcState();
            return true;
        }
    });

    /**
     * Action step: apply an actor config to an entity by name.
     */
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
        init: function (data) {
            this.config = data.config;
        },
        run: function (entity) {
            var cfg = entity.configs[this.config];
            cfg && cfg.apply(entity);
            return true;
        }
    });
});
ig.baked = !0;