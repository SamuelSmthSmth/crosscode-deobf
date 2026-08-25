ig.module("game.feature.game-sense.controllers.hp-controller").requires("impact.base.game", "game.feature.model.base-model", "game.feature.game-sense.game-sense-model").defines(function() {
    sc.GameSenseHPController = sc.GameSenseControllerBase.extend({
        init: function() {
            sc.Model.addObserver(sc.model.player.params, this);
            sc.Model.addObserver(sc.model.player, this)
        },
        bindHandler: function() {
            var b = {
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
            sc.gamesense.bindEventHandler(b, function() {}.bind(this))
        },
        onHeartBeat: function() {
            this.updateHpValue()
        },
        updateHpValue: function() {
            if (this.isActive) {
                var b = sc.model.player.params,
                    b = Math.round(b.currentHp / b.getStat("hp") * 100).limit(0, 100);
                sc.gamesense.sendSimpleEventUpdate("HEALTH_BAR",
                    b)
            }
        },
        modelChanged: function(b, a) {
            b == sc.model.player.params ? (a == sc.COMBAT_PARAM_MSG.HP_CHANGED || a == sc.COMBAT_PARAM_MSG.STATS_CHANGED || a == sc.COMBAT_PARAM_MSG.RESET_STATS) && this.updateHpValue() : b == sc.model.player && (a == sc.PLAYER_MSG.SET_PARAMS || a == sc.PLAYER_MSG.CONFIG_CHANGED) && this.updateHpValue()
        }
    })
});
ig.baked = !0;
