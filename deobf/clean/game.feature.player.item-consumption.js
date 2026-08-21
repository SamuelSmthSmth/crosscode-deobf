/**
 * game.feature.player.item-consumption
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.item-consumption")`.
 *
 * `sc.ItemConsumption`: runs the eat-an-item sequence — the consumption
 * action (item-in-hand animation steps), the effect activation (heal /
 * stat-change buffs), and the eat sound.
 */
ig.module("game.feature.player.item-consumption")
    .requires("game.feature.inventory.inventory")
    .defines(function () {

    sc.ItemConsumption = ig.Class.extend({
        sounds: {
            eat: new ig.Sound("media/sound/move/eat.ogg", 1)
        },

        init: function () {},

        /** Start the consumption action on the player if the item is consumable. */
        runItemUseAction: function (player, playerModel, itemId) {
            if (itemId && sc.inventory.getItem(itemId).type == sc.ITEMS_TYPES.CONS) {
                var action = this.getAction(itemId);
                ig.game.playerEntity.setAction(action)
            }
        },

        /** Apply the item's effect: heal and/or stat changes (item buffs). */
        activateItemEffect: function (player, time, itemId) {
            var item = sc.inventory.getItem(itemId),
                time = item.time || 0;
            item.effect && item.effect.spawnOnTarget && item.effect.spawnOnTarget(player);
            if (item.stats) {
                for (var stats = item.stats, statSettings = null, index = stats.length, hasStatChange = false; index--;) {
                    statSettings = sc.STAT_CHANGE_SETTINGS[stats[index]];
                    switch (statSettings.change) {
                        case sc.STAT_CHANGE_TYPE.HEAL:
                            this.runHealChange(statSettings);
                            break;
                        case sc.STAT_CHANGE_TYPE.STATS:
                        case sc.STAT_CHANGE_TYPE.MODIFIER:
                            hasStatChange = true
                    }
                }
                hasStatChange && this.runStatChange(stats, time, itemId)
            } else throw Error("Use Items must have defined a stats property");
        },

        runHealChange: function (change) {
            var player = ig.game.playerEntity,
                healValue = change.value - 1,
                healValue = healValue * (1 + player.params.getModifier("ITEM_BOOST")),
                healValue = new sc.HealInfo(player.params, {
                    value: healValue,
                    absolute: false
                });
            player.heal(healValue)
        },

        runStatChange: function (stats, time, itemId) {
            sc.model.player.params.addItemBuff(stats, time * (sc.newgame.get("double-buff-time") ? 2 : 1), itemId)
        },

        /** Build the eat action steps for the item's use speed. */
        getAction: function (itemId) {
            var useSpeed = sc.inventory.getItem(itemId).useSpeed || sc.STAT_USE_SPEED.NORMAL,
                foodSprite = sc.inventory.getItem(itemId).foodSprite || "SANDWICH",
                animName = "itemEatFast",
                soundSpeed = 1,
                cameraSpeed = 1.2;
            if (useSpeed == sc.STAT_USE_SPEED.SLOW) {
                animName = "itemEatSlow";
                soundSpeed = 0.6
            } else if (useSpeed == sc.STAT_USE_SPEED.FAST) {
                animName = "itemEatFastest";
                cameraSpeed = 0.8
            }
            return this.createAction([{
                    type: "START_ITEM_CONSUME"
                }, {
                    type: "FOCUS_CAMERA",
                    speed: cameraSpeed,
                    transition: "EASE_IN_OUT",
                    zoom: 1.5
                },
                {
                    type: "SET_FACE",
                    face: "SOUTH"
                }, {
                    type: "SHOW_FOOD_ICON",
                    icon: foodSprite
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
                    speed: soundSpeed
                }, {
                    type: "CHANGE_FOOD_ICON",
                    state: "BUBBLE"
                }, {
                    type: "SHOW_ANIMATION",
                    anim: animName,
                    wait: true
                }, {
                    type: "CHANGE_FOOD_ICON",
                    state: "DONE"
                }, {
                    type: "CONSUME_ITEM",
                    item: itemId
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "itemEffect"
                }, {
                    type: "WAIT",
                    time: 0.4
                }
            ])
        },

        createAction: function (steps) {
            sc.model.player.params.getModifier("ITEM_GUARD") &&
                steps.unshift({
                    type: "SET_HIT_STABLE",
                    value: "MASSIVE"
                });
            var action = new ig.Action("consumeItem", steps);
            action.eventAction = true;
            return action
        }
    })
});
ig.baked = !0;
