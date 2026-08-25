ig.module("game.feature.model.model-steps").requires("impact.base.action", "impact.base.event", "game.feature.player.player-model", "game.feature.model.game-model").defines(function() {
    ig.EVENT_STEP.START_DEMO_HIGHSCORE_TIMER = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            sc.model.startHighScoreTimer()
        }
    });
    ig.EVENT_STEP.STOP_DEMO_HIGHSCORE_TIMER = ig.EventStepBase.extend({
        observatory: false,
        _wm: new ig.Config({
            attributes: {
                observatory: {
                    _type: "Boolean",
                    _info: "True if this is for the observatory challenge.",
                    _default: false
                }
            }
        }),
        init: function(b) {
            this.observatory = b.observatory || false
        },
        start: function() {
            sc.model.stopHighScoreTimer(this.observatory)
        }
    });
    ig.EVENT_STEP.SET_TASK = ig.EventStepBase.extend({
        task: null,
        keepDisplayed: false,
        _wm: new ig.Config({
            attributes: {
                task: {
                    _type: "LangLabel",
                    _info: "Current task of the game.",
                    _large: true
                },
                keepDisplayed: {
                    _type: "Boolean",
                    _info: "Keep Task displayed all the time"
                }
            },
            width: 500
        }),
        init: function(b) {
            this.task = new ig.LangLabel(b.task);
            this.keepDisplayed = b.keepDisplayed
        },
        start: function() {
            sc.model.setTask(this.task,
                this.keepDisplayed)
        }
    });
    ig.EVENT_STEP.SET_PERMA_TASK = ig.EventStepBase.extend({
        task: null,
        _wm: new ig.Config({
            attributes: {
                task: {
                    _type: "LangLabel",
                    _info: "Current perma task of the game. Displayed in Synopsis",
                    _large: true
                }
            },
            width: 500
        }),
        init: function(b) {
            this.task = new ig.LangLabel(b.task)
        },
        start: function() {
            sc.model.setPermaTask(this.task)
        }
    });
    ig.EVENT_STEP.SET_PAUSE_MUSIC_STOP = ig.EventStepBase.extend({
        stop: false,
        _wm: new ig.Config({
            attributes: {
                stop: {
                    _type: "Boolean",
                    _info: "If true: stop music in pause menu."
                }
            },
            width: 500
        }),
        init: function(b) {
            this.stop = b.stop || false
        },
        start: function() {
            sc.model.pauseMusicStop = this.stop
        }
    });
    ig.EVENT_STEP.SET_MOBILITY_BLOCK = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "Type of Mobility block. SAVE also blocks teleport",
                    _select: sc.GAME_MOBILITY_BLOCK
                }
            }
        }),
        init: function(b) {
            this.value = b.value
        },
        start: function() {
            sc.model.setMobilityBlock(this.value)
        }
    });
    ig.EVENT_STEP.ACTIVATE_CANCEL_BUTTON = ig.EventStepBase.extend({
        text: null,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "If defined: enable cancel button with this text. If undefined: disable cancel button"
                }
            },
            width: 500
        }),
        init: function(b) {
            if (b.text) this.text = new ig.LangLabel(b.text)
        },
        start: function() {
            sc.model.setCancelButton(this.text)
        }
    });
    ig.EVENT_STEP.CLEAR_CANCEL_BUTTON = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            width: 500
        }),
        init: function() {},
        start: function() {
            sc.model.setCancelButton()
        }
    });
    ig.EVENT_STEP.SET_FORCE_COMBAT = ig.EventStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "True if combat should remain active."
                }
            }
        }),
        init: function(b) {
            this.value = b.value || false
        },
        start: function() {
            sc.model.setCombatMode(this.value, true)
        }
    });
    ig.EVENT_STEP.FORCE_START_S_RANK = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.forceStartSRank()
        }
    });
    ig.EVENT_STEP.INCREASE_COMBAT_RANK = ig.EventStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Increase Combat Rank by this weight. 1=one enemy"
                }
            }
        }),
        init: function(b) {
            this.value =
                b.value
        },
        start: function() {
            sc.model.increaseCombatRank(this.value)
        }
    });
    ig.EVENT_STEP.CLEAR_TASK = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.setTask(null, false)
        }
    });
    ig.EVENT_STEP.SET_PLAYER_CORE = ig.EventStepBase.extend({
        core: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                core: {
                    _type: "String",
                    _info: "Type of Core.",
                    _select: sc.PLAYER_CORE
                },
                value: {
                    _type: "Boolean",
                    _info: "True to activate core."
                }
            }
        }),
        init: function(b) {
            this.core = sc.PLAYER_CORE[b.core];
            this.value = b.value
        },
        start: function() {
            sc.model.player.setCore(this.core, this.value)
        }
    });
    ig.EVENT_STEP.SET_PLAYER_SP_LEVEL = ig.EventStepBase.extend({
        level: null,
        _wm: new ig.Config({
            attributes: {
                level: {
                    _type: "String",
                    _info: "Type of Core.",
                    _select: {
                        "0": "0 SP",
                        1: "4 SP",
                        2: "8 SP",
                        3: "12 SP",
                        4: "16 SP"
                    }
                }
            }
        }),
        init: function(b) {
            this.level = b.level
        },
        start: function() {
            sc.model.player.setSpLevel(this.level)
        }
    });
    ig.EVENT_STEP.INCREASE_PLAYER_SP_LEVEL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.player.setSpLevel(sc.model.player.spLevel + 1)
        }
    });
    ig.EVENT_STEP.ADD_PLAYER_EXP = ig.EventStepBase.extend({
        exp: 0,
        level: 0,
        _wm: new ig.Config({
            attributes: {
                exp: {
                    _type: "NumberExpression",
                    _info: "Experience count."
                },
                level: {
                    _type: "Number",
                    _info: "Level of experience",
                    _optional: true
                }
            }
        }),
        init: function(b) {
            this.exp = b.exp;
            this.level = b.level || 0
        },
        start: function() {
            var b = this.level || sc.model.player.level,
                a = ig.Event.getExpressionValue(this.exp),
                b = sc.model.player.addExperience(a, b, void 0, void 0,
                    sc.LEVEL_CURVES.STATIC_REGULAR);
            sc.stats.addMap("player", "expOther", b)
        }
    });
    ig.EVENT_STEP.SET_PLAYER_LEVEL_DEBUG = ig.EventStepBase.extend({
        level: null,
        _wm: new ig.Config({
            attributes: {
                level: {
                    _type: "Number",
                    _info: "New Level of Player"
                }
            }
        }),
        init: function(b) {
            this.level = b.level
        },
        start: function() {
            var b = Math.max(sc.model.player.level, this.level);
            sc.model.player.setLevel(b, true);
            sc.PlayerLevelTools.autoequip(sc.model.player, sc.model.player.config.autoequip, 0, b, true, true)
        }
    });
    ig.EVENT_STEP.SET_ALL_PLAYER_CORE = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "True to activate core."
                }
            }
        }),
        init: function(b) {
            this.value = b.value
        },
        start: function() {
            sc.model.player.setCoreAll(this.value)
        }
    })
});
ig.baked = !0;
