ig.module("game.feature.arena.gui.arena-start-gui").requires("impact.feature.rumble.rumble", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.hud.right-hud", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-misc").defines(function() {
    sc.ArenaRoundStartHud = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0.2
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        timer: 0,
        done: false,
        round: null,
        name: null,
        container: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.CENTER);
            this.setSize(ig.system.width, 40);
            this.setPivot(0, this.hook.size.y / 2);
            this.setPos(0, -80);
            this.hook.zIndex = 99;
            this.timer = 2;
            var roundNumber = sc.arena.runtime.currentRound,
                roundData = sc.arena.getCurrentRound(),
                roundText = ig.lang.get("sc.gui.arena.round"),
                roundText = roundText.replace("[!]", roundNumber + 1);
            this.round = new sc.TextGui(roundText);
            this.round.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            this.round.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: 5
                    },
                    time: 2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                CENTER: {
                    state: {
                        offsetX: -5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -100
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                AWAY: {
                    state: {
                        alpha: 0,
                        offsetX: 100
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.round.doStateTransition("HIDDEN", true);
            this.round.setPos(0, 4);
            this.addChildGui(this.round);
            roundNumber = sc.arena.runtime.challengeMods;
            this.container = new ig.GuiElementBase;
            this.container.setAlign(ig.GUI_ALIGN_X.LEFT,
                ig.GUI_ALIGN_Y.CENTER);
            this.container.setPos(10, 0);
            var posX = roundText = 0,
                posY = 0,
                count;
            for (count in roundNumber) {
                var entry = new sc.ArenaRoundStartHud.ChallengeEntry(count, roundNumber[count].global);
                entry.setPos(roundText, posX);
                roundText = roundText + 19;
                posY++;
                if (posY >= 10) {
                    posX = posX + 19;
                    roundText = 0
                }
                this.container.addChildGui(entry)
            }
            this.container.setSize(190, 18 * (~~(posY / 10) + 1));
            this.addChildGui(this.container);
            this.name = new sc.TextGui(ig.LangLabel.getText(roundData.name));
            this.name.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.BOTTOM);
            this.name.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: -5
                    },
                    time: 2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                CENTER: {
                    state: {
                        offsetX: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 100
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                AWAY: {
                    state: {
                        alpha: 0,
                        offsetX: -100
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.name.doStateTransition("HIDDEN", true);
            this.name.setPos(0, 4);
            this.addChildGui(this.name);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            this.round.doStateTransition("CENTER", false, false, function() {
                this.round.doStateTransition("DEFAULT", false, false,
                    function() {
                        this.round.doStateTransition("AWAY")
                    }.bind(this))
            }.bind(this));
            this.name.doStateTransition("CENTER", false, false, function() {
                this.name.doStateTransition("DEFAULT", false, false, function() {
                    this.name.doStateTransition("AWAY")
                }.bind(this))
            }.bind(this))
        },
        updateDrawables: function(drawables) {
            var size = this.hook.size;
            drawables.addColor("#000", 0, 0, size.x, size.y).setAlpha(0.5);
            drawables.addColor("#FFF", 0, 1, size.x, 1).setAlpha(0.5);
            drawables.addColor("#FFF", 0, size.y - 2, size.x, 1).setAlpha(0.5)
        },
        update: function() {
            if (this.timer >= 0 && !this.hasTransition()) {
                this.timer =
                    this.timer - ig.system.tick;
                this.timer <= 0 && this.doStateTransition("HIDDEN", false, true, function() {
                    this.done = true
                }.bind(this))
            }
        }
    });
    sc.ArenaRoundStartHud.ChallengeEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/arena-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        icon: 0,
        challenge: null,
        global: false,
        init: function(key, isGlobal) {
            this.parent();
            this.setSize(18, 18);
            this.global = isGlobal || false;
            this.challenge = sc.ARENA_CHALLENGES[key ||
                "NO_MELEE"];
            this.icon = this.challenge.icon || 1
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, 0, 0, 256 + this.icon % 6 * 18, ~~(this.icon / 6) * 18, 18, 18);
            this.global && drawables.addGfx(this.gfx, 0, 0, 128, 48, 18, 18)
        }
    })
});
ig.baked = !0;
