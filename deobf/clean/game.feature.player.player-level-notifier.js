/**
 * game.feature.player.player-level-notifier
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-level-notifier")`.
 *
 * `sc.PlayerLevelNotifier`: plays the level-up cutscene — sound, slow-motion,
 * level-up HUD with stat deltas, the jump, and the LEVEL_UP common event.
 */
ig.module("game.feature.player.player-level-notifier").defines(function () {

    sc.PlayerLevelNotifier = ig.Class.extend({
        levelUpSound: new ig.Sound("media/sound/battle/level-up.ogg"),

        init: function () {},

        runLevelUpScene: function (player, playerModel, parallel) {
            var event = this.getLevelUpEvent(player, playerModel);
            playerModel.clearLevelUp();
            ig.game.events.callEvent(event, parallel ? ig.EventRunType.PARALLEL : ig.EventRunType.BLOCKING, this.onLevelUpEventStart.bind(this), this.onLevelUpEventEnd.bind(this))
        },

        onLevelUpEventStart: function () {
            sc.model.enterLevelUp()
        },

        onLevelUpEventEnd: function () {
            sc.model.enterRunning();
            sc.commonEvents.triggerEvent("LEVEL_UP", {
                level: sc.model.player.level
            })
        },

        getLevelUpEvent: function (player, playerModel) {
            var eventData = {
                steps: [{
                    type: "PLAY_SOUND",
                    sound: "media/sound/battle/level-up.ogg",
                    volume: 1
                }, {
                    type: "DO_ACTION",
                    entity: player,
                    action: [{
                        type: "WAIT",
                        time: -1
                    }]
                }, {
                    type: "ADD_SLOW_MOTION",
                    name: "levelUp",
                    factor: 0,
                    time: 0.5
                }, {
                    type: "WAIT",
                    time: 0.1,
                    ignoreSlowDown: true
                }, {
                    type: "SET_ENTITY_STATIC_TIME",
                    entity: player,
                    value: true,
                    global: true
                }, {
                    type: "DO_ACTION",
                    entity: player,
                    keepState: true,
                    action: [{
                            type: "SHOW_ANIMATION",
                            anim: "levelUpPre",
                            followUp: "levelUpStand"
                        },
                        {
                            type: "WAIT",
                            time: -1
                        }
                    ]
                }, {
                    type: "SET_CAMERA_TARGET",
                    entity: player,
                    speed: 0.6,
                    transition: "EASE_IN_OUT",
                    wait: true,
                    zoom: 1.5,
                    waitSkip: 0.2
                }, {
                    type: "ADD_GUI",
                    name: null,
                    guiInfo: {
                        type: "LevelUpHud",
                        settings: {
                            deltaValues: ig.copy(playerModel.levelUpDelta)
                        }
                    }
                }, {
                    type: "SET_ZOOM_BLUR",
                    zoomType: "MEDIUM",
                    fadeIn: 0.1,
                    duration: 0.2,
                    fadeOut: 0.5
                }, {
                    type: "WAIT_UNTIL_TRUE",
                    condition: "tmp._levelUpFinished"
                }, {
                    type: "DO_ACTION",
                    entity: player,
                    action: [{
                            type: "SHOW_ANIMATION",
                            anim: "levelUpPreJump"
                        }, {
                            type: "WAIT",
                            time: 0.2
                        }, {
                            type: "SHOW_ANIMATION",
                            anim: "levelUpJump"
                        },
                        {
                            type: "JUMP",
                            jumpHeight: "M",
                            wait: true,
                            ignoreSounds: true
                        }
                    ]
                }, {
                    type: "WAIT",
                    time: 0.5,
                    ignoreSlowDown: true
                }, {
                    type: "CLEAR_SLOW_MOTION",
                    name: "levelUp",
                    time: 0.1
                }, {
                    type: "SET_ENTITY_STATIC_TIME",
                    entity: player,
                    value: false,
                    global: true
                }]
            };
            return new ig.Event(eventData)
        }
    })
});
ig.baked = !0;
