ig.module("game.feature.player.item-consumption").requires("game.feature.inventory.inventory").defines(function() {
    sc.ItemConsumption = ig.Class.extend({
        sounds: {
            eat: new ig.Sound("media/sound/move/eat.ogg", 1)
        },
        init: function() {},
        runItemUseAction: function(b, a, d) {
            if (d && sc.inventory.getItem(d).type == sc.ITEMS_TYPES.CONS) {
                b = this.getAction(d);
                ig.game.playerEntity.setAction(b)
            }
        },
        activateItemEffect: function(b, a, d) {
            var c = sc.inventory.getItem(d),
                a = c.time || 0;
            c.effect && c.effect.spawnOnTarget && c.effect.spawnOnTarget(b);
            if (c.stats) {
                for (var b = c.stats, c = null, e = b.length, f = false; e--;) {
                    c = sc.STAT_CHANGE_SETTINGS[b[e]];
                    switch (c.change) {
                        case sc.STAT_CHANGE_TYPE.HEAL:
                            this.runHealChange(c);
                            break;
                        case sc.STAT_CHANGE_TYPE.STATS:
                        case sc.STAT_CHANGE_TYPE.MODIFIER:
                            f = true
                    }
                }
                f && this.runStatChange(b, a, d)
            } else throw Error("Use Items must have defined a stats property");
        },
        runHealChange: function(b) {
            var a = ig.game.playerEntity,
                b = b.value - 1,
                b = b * (1 + a.params.getModifier("ITEM_BOOST")),
                b = new sc.HealInfo(a.params, {
                    value: b,
                    absolute: false
                });
            a.heal(b)
        },
        runStatChange: function(b, a, d) {
            sc.model.player.params.addItemBuff(b, a * (sc.newgame.get("double-buff-time") ? 2 : 1), d)
        },
        getAction: function(b) {
            var a = sc.inventory.getItem(b).useSpeed || sc.STAT_USE_SPEED.NORMAL,
                d = sc.inventory.getItem(b).foodSprite || "SANDWICH",
                c = "itemEatFast",
                e = 1,
                f = 1.2;
            if (a == sc.STAT_USE_SPEED.SLOW) {
                c = "itemEatSlow";
                e = 0.6
            } else if (a == sc.STAT_USE_SPEED.FAST) {
                c = "itemEatFastest";
                f = 0.8
            }
            return this.createAction([{
                    type: "START_ITEM_CONSUME"
                }, {
                    type: "FOCUS_CAMERA",
                    speed: f,
                    transition: "EASE_IN_OUT",
                    zoom: 1.5
                },
                {
                    type: "SET_FACE",
                    face: "SOUTH"
                }, {
                    type: "SHOW_FOOD_ICON",
                    icon: d
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "itemFetch",
                    wait: true
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "itemHold"
                }, {
                    type: "WAIT",
                    time: 0.2
                }, {
                    type: "PLAY_SOUND",
                    sound: "media/sound/move/eat.ogg",
                    volume: 1,
                    speed: e
                }, {
                    type: "CHANGE_FOOD_ICON",
                    state: "BUBBLE"
                }, {
                    type: "SHOW_ANIMATION",
                    anim: c,
                    wait: true
                }, {
                    type: "CHANGE_FOOD_ICON",
                    state: "DONE"
                }, {
                    type: "CONSUME_ITEM",
                    item: b
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "itemEffect"
                }, {
                    type: "WAIT",
                    time: 0.4
                }
            ])
        },
        createAction: function(b) {
            sc.model.player.params.getModifier("ITEM_GUARD") &&
                b.unshift({
                    type: "SET_HIT_STABLE",
                    value: "MASSIVE"
                });
            b = new ig.Action("consumeItem", b);
            b.eventAction = true;
            return b
        }
    })
});
ig.baked = !0;
