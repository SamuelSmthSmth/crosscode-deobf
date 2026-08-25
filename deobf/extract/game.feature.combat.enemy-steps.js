ig.module("game.feature.combat.enemy-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.enemy").defines(function() {
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
        init: function(b) {
            this.active = b.active ? sc.ENEMY_ANNO_ACTIVE[b.active] || 0 : null;
            this.passive = b.passive ? sc.ENEMY_ANNO_PASSIVE[b.passive] || 0 : null;
            this.weapon = b.weapon ? sc.ENEMY_ANNO_WEAPON[b.weapon] ||
                0 : null;
            var a = b.extra;
            if (a)
                for (var d = this.extra = 0; d < a.length; ++d) this.extra = this.extra | sc.ENEMY_ANNO_EXTRA[a[d]];
            else this.extra = null;
            this.element = b.element ? sc.ELEMENT[b.element] || 0 : null
        },
        run: function(b) {
            if (this.active != null) b.annotate.active = this.active;
            if (this.passive != null) b.annotate.passive = this.passive;
            if (this.weapon != null) b.annotate.weapon = this.weapon;
            if (this.extra != null) b.annotate.extra = this.extra;
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
        init: function(b) {
            this.actionName = b.actionName;
            this.noStateReset = b.noStateReset || false
        },
        run: function(b) {
            b.doEnemyAction(this.actionName, this.noStateReset);
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
        init: function(b) {
            this.actionName = b.actionName;
            this.stateReset = b.stateReset
        },
        run: function(b) {
            if (b.doEnemyAction) b.doEnemyAction(this.actionName, !this.stateReset, true);
            else {
                var a = b.getCombatantRoot();
                a.getEnemyAction && b.pushInlineAction(a.getEnemyAction(this.actionName))
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
        init: function(b) {
            this.value = sc.ENEMY_AGGRESSION[b.value]
        },
        run: function(b) {
            b.aggression = this.value;
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
        init: function(b) {
            this.element = sc.ELEMENT[b.element];
            this.skipEffect = b.skipEffect || false
        },
        start: function(b) {
            !b instanceof
            ig.ENTITY.Enemy || b.setElementMode(this.element, this.skipEffect)
        }
    })
});
ig.baked = !0;
