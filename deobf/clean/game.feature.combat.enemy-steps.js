/**
 * game.feature.combat.enemy-steps
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.enemy-steps")`.
 *
 * Enemy-related action steps: `CHANGE_ENEMY_ANNOTATION`, `DO_ENEMY_ACTION`,
 * `DO_ENEMY_ACTION_INLINE`, `SET_AGGRESSION`, and `SET_ENEMY_ELEMENT_MODE`.
 */
ig.module("game.feature.combat.enemy-steps")
    .requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.enemy")
    .defines(function () {

    ig.ACTION_STEP.CHANGE_ENEMY_ANNOTATION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                active: {
                    _type: "String",
                    _info: "The current active state",
                    _select: sc.ENEMY_ANNO_ACTIVE,
                    _optional: true
                },
                passive: {
                    _type: "String",
                    _info: "The current passive state",
                    _select: sc.ENEMY_ANNO_PASSIVE,
                    _optional: true
                },
                weapon: {
                    _type: "String",
                    _info: "What weapon is preferred for the enemy",
                    _select: sc.ENEMY_ANNO_WEAPON,
                    _optional: true
                },
                extra: {
                    _type: "Array",
                    _info: "The current active state",
                    _sub: {
                        _type: "String",
                        _select: sc.ENEMY_ANNO_EXTRA
                    },
                    _optional: true
                },
                element: {
                    _type: "String",
                    _info: "What element should be used",
                    _select: sc.ENEMY_ANNO_ELEMENT,
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.active = settings.active ? sc.ENEMY_ANNO_ACTIVE[settings.active] || 0 : null;
            this.passive = settings.passive ? sc.ENEMY_ANNO_PASSIVE[settings.passive] || 0 : null;
            this.weapon = settings.weapon ? sc.ENEMY_ANNO_WEAPON[settings.weapon] || 0 : null;

            var extraList = settings.extra;
            if (extraList)
                for (var index = this.extra = 0; index < extraList.length; ++index) this.extra = this.extra | sc.ENEMY_ANNO_EXTRA[extraList[index]];
            else this.extra = null;

            this.element = settings.element ? sc.ELEMENT[settings.element] || 0 : null
        },

        run: function (entity) {
            if (this.active != null) entity.annotate.active = this.active;
            if (this.passive != null) entity.annotate.passive = this.passive;
            if (this.weapon != null) entity.annotate.weapon = this.weapon;
            if (this.extra != null) entity.annotate.extra = this.extra;
            return true
        }
    });

    ig.ACTION_STEP.DO_ENEMY_ACTION = ig.ActionStepBase.extend({
        actionName: null,

        _wm: new ig.Config({
            attributes: {
                actionName: {
                    _type: "EnemyActionRef",
                    _info: "Name of action to perform"
                },
                noStateReset: {
                    _type: "Boolean",
                    _info: "If true, do not reset state before switching to action. Also keeps actionAttached!"
                }
            }
        }),

        init: function (settings) {
            this.actionName = settings.actionName;
            this.noStateReset = settings.noStateReset || false
        },

        run: function (entity) {
            entity.doEnemyAction(this.actionName, this.noStateReset);
            return true
        }
    });

    ig.ACTION_STEP.DO_ENEMY_ACTION_INLINE = ig.ActionStepBase.extend({
        actionName: null,

        _wm: new ig.Config({
            attributes: {
                actionName: {
                    _type: "EnemyActionRef",
                    _info: "Name of action to perform"
                },
                stateReset: {
                    _type: "Boolean",
                    _info: "If true, reset state before inline calling action!"
                }
            }
        }),

        init: function (settings) {
            this.actionName = settings.actionName;
            this.stateReset = settings.stateReset
        },

        run: function (entity) {
            if (entity.doEnemyAction) entity.doEnemyAction(this.actionName, !this.stateReset, true);
            else {
                var root = entity.getCombatantRoot();
                root.getEnemyAction && entity.pushInlineAction(root.getEnemyAction(this.actionName))
            }
            return true
        }
    });

    ig.ACTION_STEP.SET_AGGRESSION = ig.ActionStepBase.extend({
        value: false,

        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "Set enemy aggression",
                    _select: sc.ENEMY_AGGRESSION
                }
            }
        }),

        init: function (settings) {
            this.value = sc.ENEMY_AGGRESSION[settings.value]
        },

        run: function (entity) {
            entity.aggression = this.value;
            return true
        }
    });

    ig.ACTION_STEP.SET_ENEMY_ELEMENT_MODE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element to change to",
                    _select: sc.ELEMENT
                },
                skipEffect: {
                    _type: "Boolean",
                    _info: "If true: don't show transition effect"
                }
            }
        }),

        init: function (settings) {
            this.element = sc.ELEMENT[settings.element];
            this.skipEffect = settings.skipEffect || false
        },

        start: function (entity) {
            !entity instanceof ig.ENTITY.Enemy || entity.setElementMode(this.element, this.skipEffect)
        }
    })
});
ig.baked = !0;
