/**
 * @module game.feature.arena.arena-steps
 *
 * Event and action steps for the arena feature. Provides steps to
 * control arena rounds (start, end, spawn waves), manipulate score
 * tracking (add/remove score ignores, add scores), control the chain
 * counter, open the arena menu, and manage arena enemy ignore lists.
 */
ig.module("game.feature.arena.arena-steps").requires("impact.base.action", "impact.base.entity", "impact.feature.camera.camera", "game.feature.arena.arena", "game.feature.arena.gui.arena-gui", "game.feature.arena.gui.arena-start-gui").defines(function() {
    ig.EVENT_STEP.RESET_ARENA_CHAIN = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            sc.arena.active && sc.arena.resetChain()
        }
    });
    ig.EVENT_STEP.INCREASE_ARENA_CHAIN = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                amount: {
                    _type: "Integer",
                    _info: "Increases the chain by the given amount",
                    _default: 1
                }
            }
        }),
        amount: 0,
        init: function(settings) {
            this.amount = settings.amount || 1
        },
        start: function() {
            sc.arena.active && sc.arena.increaseChain(this.amount)
        }
    });
    ig.EVENT_STEP.ADD_ARENA_SCORE_IGNORE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                scoreType: {
                    _type: "Select",
                    _info: "Score type to ignore, gets reset every round.",
                    _select: sc.ARENA_SCORE_TYPES
                }
            }
        }),
        scoreType: null,
        init: function(settings) {
            this.scoreType = settings.scoreType || null
        },
        start: function() {
            this.scoreType && sc.arena.addScoreIgnore(this.scoreType)
        }
    });
    ig.EVENT_STEP.REMOVE_ARENA_SCORE_IGNORE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                scoreType: {
                    _type: "Select",
                    _info: "Score type to remove, gets reset every round.",
                    _select: sc.ARENA_SCORE_TYPES
                }
            }
        }),
        scoreType: null,
        init: function(settings) {
            this.scoreType = settings.scoreType || null
        },
        start: function() {
            this.scoreType && sc.arena.removeScoreIgnore(this.scoreType)
        }
    });
    ig.EVENT_STEP.CLEAR_ARENA_SCORE_IGNORE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            sc.arena.clearScoreIgnore()
        }
    });
    ig.EVENT_STEP.ADD_ARENA_IGNORE_TYPE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "EnemySearch",
                    _info: "Enemy to ignore. Will be cleared each round."
                }
            }
        }),
        enemy: null,
        init: function(settings) {
            this.enemy = settings.enemy || null
        },
        start: function() {
            this.enemy && sc.arena.addEnemyIgnore(this.enemy)
        }
    });
    ig.EVENT_STEP.ADD_ARENA_SCORE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                type: {
                    _type: "Select",
                    _info: "Type of the score. This is used to for the list at the end of the round.",
                    _select: sc.ARENA_SCORE_TYPES,
                    _default: "KILL"
                }
            }
        }),
        type: null,
        init: function(settings) {
            this.type = settings.type || null
        },
        start: function() {
            this.type && this.arena.addScore(this.type)
        }
    });
    ig.EVENT_STEP.OPEN_ARENA_MENU = ig.EventStepBase.extend({
        arenaCache: null,
        custom: false,
        noWait: false,
        _wm: new ig.Config({
            attributes: {
                custom: {
                    _type: "Boolean",
                    _info: "If true, open menu for custom cups."
                },
                noWait: {
                    _type: "Boolean",
                    _info: "If true, do not wait for menu to be closed in order to continue events",
                    _optional: true
                }
            }
        }),
        init: function(settings) {
            this.custom = settings.custom || false;
            this.noWait = settings.noWait || false;
            this.arenaCache = new sc.ArenaCache
        },
        start: function() {
            sc.menu.arenaCustomMode = this.custom;
            sc.menu.setDirectMode(true, sc.MENU_SUBMENU.ARENA);
            sc.model.enterMenu(true);
            sc.model.prevSubState = sc.GAME_MODEL_SUBSTATE.RUNNING
        },
        run: function() {
            return this.noWait ? true : !sc.menu.menuEntered
        },
        clearCached: function() {
            this.arenaCache.decreaseRef()
        }
    });
    ig.EVENT_STEP.START_ARENA_CUP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            if (sc.arena.active) {
                var runtime = sc.arena.runtime;
                if (runtime) {
                    sc.arena.isCupSolo(runtime.cup) && sc.arena.stashPartyMembers();
                    var round = runtime.rounds[runtime.currentRound];
                    ig.game.teleport(round.map, round.spawn ? new ig.TeleportPosition(round.spawn) : null)
                }
            }
        }
    });
    ig.EVENT_STEP.END_ARENA_CUP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.arena.active && sc.arena.exitArenaMode()
        }
    });
    ig.EVENT_STEP.CLEAR_ARENA_END_FLAG = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.arena.clearEndFlag()
        }
    });
    ig.EVENT_STEP.SPAWN_ARENA_WAVE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                silent: {
                    _type: "Boolean",
                    _info: "If true, do now show any effects",
                    _default: false
                },
                increase: {
                    _type: "Boolean",
                    _info: "If true, increase the current wave counter before spawning the wave",
                    _default: false
                },
                focusPlayer: {
                    _type: "Boolean",
                    _info: "If true, enemies will focus the player. Only if this is true the dramatic effect is auto set",
                    _default: true
                }
            }
        }),
        init: function(settings) {
            this.silent = settings.silent || false;
            this.increase = settings.increase || false;
            this.focusPlayer = settings.focusPlayer || false
        },
        start: function() {
            sc.arena.active && sc.arena.spawnCurrentWave(this.silent, this.increase, this.focusPlayer)
        }
    });
    ig.EVENT_STEP.START_ARENA_ROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                scoreGui: {
                    _type: "Boolean",
                    _info: "Enable/Disable ScoreGui. Default is true",
                    _optional: true,
                    _default: true
                },
                timeGui: {
                    _type: "Boolean",
                    _info: "Enable/Disable Timer Gui. Default is true",
                    _optional: true,
                    _default: true
                }
            }
        }),
        score: true,
        time: true,
        init: function(settings) {
            this.score = settings.scoreGui != void 0 ? settings.scoreGui : true;
            this.time = settings.timeGui != void 0 ? settings.timeGui : true
        },
        start: function() {
            sc.arena.active && sc.arena.startRound(this.score, this.time)
        }
    });
    ig.EVENT_STEP.TP_TO_CUR_ARENA_ROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.arena.active && sc.arena.teleportToCurrentRound()
        }
    });
    ig.EVENT_STEP.PREP_ARENA_ROUND_END = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            if (sc.arena.active) sc.arena.runtime.roundEndPre = true
        }
    });
    ig.EVENT_STEP.END_ARENA_ROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                onDeath: {
                    _type: "Boolean",
                    _info: "If true, round was ended through player death",
                    _optional: true,
                    _default: true
                }
            }
        }),
        onDeath: false,
        init: function(settings) {
            this.onDeath = settings.onDeath || false
        },
        start: function() {
            sc.arena.active && (this.onDeath ? sc.arena.endRoundDeath() : sc.arena.endRound())
        },
        run: function() {
            return sc.arena._endRoundDone
        }
    });
    ig.EVENT_STEP.SHOW_ARENA_ROUND_GUI = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                wait: {
                    _type: "Boolean",
                    _info: "If true, wait until the gui has finished animating."
                }
            }
        }),
        init: function(settings) {
            this.wait = settings.wait || false
        },
        start: function(eventData) {
            var hud = new sc.ArenaRoundStartHud;
            ig.gui.addGuiElement(hud);
            if (this.wait) eventData._gui = hud
        },
        run: function(eventData) {
            return this.wait ? eventData._gui.done : true
        }
    });
    ig.ACTION_STEP.ADD_ARENA_IGNORE_TYPE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "EnemySearch",
                    _info: "Enemy to ignore. Will be cleared each round."
                }
            }
        }),
        enemy: null,
        init: function(settings) {
            this.enemy = settings.enemy || null
        },
        start: function() {
            this.enemy && sc.arena.addEnemyIgnore(this.enemy)
        }
    })
});
ig.baked = !0;