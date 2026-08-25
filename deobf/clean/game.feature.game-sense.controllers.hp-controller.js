/**
 * @module game.feature.game-sense.controllers.hp-controller
 *
 * GameSense controller for Logitech RGB keyboard that maps the
 * player's current HP percentage to the function key row. Green
 * when HP is above 33%, red when below (with a flashing effect).
 * Updates on HP change, stats change, params change, or config change.
 */
ig.module("game.feature.game-sense.controllers.hp-controller").requires("impact.base.game", "game.feature.model.base-model", "game.feature.game-sense.game-sense-model").defines(function() {
    sc.GameSenseHPController = sc.GameSenseControllerBase.extend({
        init: function() {
            sc.Model.addObserver(sc.model.player.params, this);
            sc.Model.addObserver(sc.model.player, this)
        },
        bindHandler: function() {
            var hpHandler = {
                game: sc.GAME_SENSE_GAME,
                event: "HEALTH_BAR",
                min_value: 0,
                max_value: 100,
                icon_id: 1,
                handlers: [{
                    "device-type": sc.GAME_SENSE_DEVICE.KEYBOARD,
                    zone: sc.GAME_SENSE_ZONE.FUNCTION_KEYS,
                    color: [{
                        low: 0,
                        high: 33,
                        color: sc.GSHelper.color(255, 0, 0)
                    }, {
                        low: 34,
                        high: 100,
                        color: sc.GSHelper.color(0, 255, 0)
                    }],
                    mode: sc.GAME_SENSE_MODE.PERCENT,
                    rate: {
                        frequency: [{
                            low: 0,
                            high: 33,
                            frequency: 5
                        }]
                    }
                }]
            };
            sc.gamesense.bindEventHandler(hpHandler, function() {}.bind(this))
        },
        onHeartBeat: function() {
            this.updateHpValue()
        },
        updateHpValue: function() {
            if (this.isActive) {
                var params = sc.model.player.params;
                var hpPercent = Math.round(params.currentHp / params.getStat("hp") * 100).limit(0, 100);
                sc.gamesense.sendSimpleEventUpdate("HEALTH_BAR", hpPercent)
            }
        },
        modelChanged: function(model, msg) {
            model == sc.model.player.params ? (msg == sc.COMBAT_PARAM_MSG.HP_CHANGED || msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED || msg == sc.COMBAT_PARAM_MSG.RESET_STATS) && this.updateHpValue() : model == sc.model.player && (msg == sc.PLAYER_MSG.SET_PARAMS || msg == sc.PLAYER_MSG.CONFIG_CHANGED) && this.updateHpValue()
        }
    })
});
ig.baked = !0;