ig.module("game.feature.player.player-level-notifier").defines(function() {
    sc.PlayerLevelNotifier = ig.Class.extend({
        levelUpSound: new ig.Sound("media/sound/battle/level-up.ogg"),
        init: function() {},
        runLevelUpScene: function(b, a, d) {
            b = this.getLevelUpEvent(b, a);
            a.clearLevelUp();
            ig.game.events.callEvent(b, d ? ig.EventRunType.PARALLEL : ig.EventRunType.BLOCKING, this.onLevelUpEventStart.bind(this), this.onLevelUpEventEnd.bind(this))
        },
        onLevelUpEventStart: function() {
            sc.model.enterLevelUp()
        },
        onLevelUpEventEnd: function() {
            sc.model.enterRunning();
            sc.commonEvents.triggerEvent("LEVEL_UP", {
                level: sc.model.player.level
            })
        },
        getLevelUpEvent: function(b, a) {
            var d = {
                steps: [{
                    type: "PLAY_SOUND",
                    sound: "media/sound/battle/level-up.ogg",
                    volume: 1
                }, {
                    type: "DO_ACTION",
                    entity: b,
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
                    entity: b,
                    value: true,
                    global: true
                }, {
                    type: "DO_ACTION",
                    entity: b,
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
                    entity: b,
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
                            deltaValues: ig.copy(a.levelUpDelta)
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
                    entity: b,
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
                    entity: b,
                    value: false,
                    global: true
                }]
            };
            return new ig.Event(d)
        }
    })
});
ig.baked = !0;
