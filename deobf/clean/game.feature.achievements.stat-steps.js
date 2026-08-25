/**
 * @module game.feature.achievements.stat-steps
 *
 * Event steps for the stats and trophy system. Provides steps to
 * enable/disable stat tracking, unlock trophies, and manipulate
 * stat map values (add or set numeric stat entries).
 */
ig.module("game.feature.achievements.stat-steps").requires("impact.base.action", "impact.base.entity").defines(function() {
    ig.EVENT_STEP.ENABLED_STATS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            label: function() {
                return "<i style='color: orange'>ENABLED STATS</i>"
            }
        }),
        init: function() {},
        start: function() {
            sc.stats.setActive(true)
        }
    });
    ig.EVENT_STEP.DISABLE_STATS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            label: function() {
                return "<i style='color: orange'>DISABLE STATS</i>"
            }
        }),
        init: function() {},
        start: function() {
            sc.stats.setActive(false)
        }
    });
    ig.EVENT_STEP.UNLOCK_TROPHY = ig.EventStepBase.extend({
        trophy: null,
        _wm: new ig.Config({
            attributes: {
                trophy: {
                    _type: "TrophySelect",
                    _info: "The Trophy to unlock, if already unlocked, nothing will happen."
                }
            }
        }),
        init: function(settings) {
            this.trophy = settings.trophy || null
        },
        start: function() {
            this.trophy && sc.trophies.triggerTrophy(this.trophy)
        }
    });
    ig.EVENT_STEP.ADD_STAT_MAP_NUMBER = ig.EventStepBase.extend({
        map: null,
        stat: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                map: {
                    _type: "String",
                    _info: "The map of the stat."
                },
                stat: {
                    _type: "String",
                    _info: "The stat name"
                },
                value: {
                    _type: "Number",
                    _info: "The number to add"
                }
            }
        }),
        init: function(settings) {
            this.map = settings.map || null;
            this.stat = settings.stat || null;
            this.value = settings.value || 0
        },
        start: function() {
            this.map && this.stat && sc.stats.addMap(this.map, this.stat, this.value)
        }
    });
    ig.EVENT_STEP.SET_STAT_MAP_NUMBER = ig.EventStepBase.extend({
        map: null,
        stat: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                map: {
                    _type: "String",
                    _info: "The map of the stat."
                },
                stat: {
                    _type: "String",
                    _info: "The stat name"
                },
                value: {
                    _type: "NumberExpression",
                    _info: "The number to add"
                }
            }
        }),
        init: function(settings) {
            this.map = settings.map || null;
            this.stat = settings.stat || null;
            this.value = settings.value || 0
        },
        start: function() {
            this.map && this.stat && sc.stats.setMap(this.map, this.stat, ig.Event.getExpressionValue(this.value))
        }
    })
});
ig.baked = !0;