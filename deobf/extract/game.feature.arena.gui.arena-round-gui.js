ig.module("game.feature.arena.gui.arena-round-gui").requires("impact.feature.rumble.rumble", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.hud.right-hud", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-misc", "game.feature.arena.gui.arena-effect-display").defines(function() {
    var b = {
            buttons: [{
                x: 4,
                y: -29,
                label: "nextRound",
                delay: 0
            }, {
                x: 12,
                y: -0,
                label: "restart",
                delay: 0
            }, {
                x: 4,
                y: 29,
                label: "giveUp",
                delay: 0
            }],
            deathButtons: [{
                x: 4,
                y: -16,
                label: "restart",
                delay: 0
            }, {
                x: 4,
                y: 16,
                label: "giveUp",
                delay: 0
            }],
            end: [{
                x: 4,
                y: -29,
                label: "restart",
                delay: 0
            }, {
                x: 12,
                y: 0,
                label: "summary",
                delay: 0.016
            }, {
                x: 4,
                y: 29,
                label: "return",
                delay: 0
            }]
        },
        a = {
            buttons: [{
                x: 4,
                y: -45,
                label: "nextRound",
                delay: 0
            }, {
                x: 12,
                y: -16,
                label: "repeat",
                delay: 0.016
            }, {
                x: 12,
                y: 16,
                label: "summary",
                delay: 0.016
            }, {
                x: 4,
                y: 45,
                label: "return",
                delay: 0
            }],
            deathButtons: [{
                x: 4,
                y: -29,
                label: "repeat",
                delay: 0
            }, {
                x: 12,
                y: 0,
                label: "summary",
                delay: 0.016
            }, {
                x: 4,
                y: 29,
                label: "return",
                delay: 0
            }],
            end: [{
                x: 4,
                y: -45,
                label: "nextRound",
                delay: 0
            }, {
                x: 12,
                y: -16,
                label: "repeat",
                delay: 0.016
            }, {
                x: 12,
                y: 16,
                label: "summary",
                delay: 0.016
            }, {
                x: 4,
                y: 45,
                label: "return",
                delay: 0
            }]
        };
    sc.ArenaRoundEndButtons = ig.GuiElementBase.extend({
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
        callback: null,
        buttonInteract: null,
        buttonGroup: null,
        background: null,
        buttons: [],
        info: null,
        dialogBlock: false,
        _playerDeath: false,
        _isLastRound: false,
        confirm: new ig.Sound("media/sound/arena/arena-cup-select.ogg", 0.8),
        init: function(c, d, f) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.CENTER);
            this.setSize(88, 176);
            this.callback = c;
            this.info = d;
            this._playerDeath = f || false;
            this._isLastRound = sc.arena.isCurrentRoundLast();
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL, true);
            this.buttonGroup.addPressCallback(this.onButtonPressed.bind(this));
            this.buttonGroup.addSelectionCallback(this.onButtonSelect.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(this.onMouseFocusLost.bind(this));
            this.background = new ig.ImageGui(this.gfx, 160, 32, 88, 176);
            this.background.hook.localAlpha = 0.5;
            this.background.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -44
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.background.doStateTransition("HIDDEN", true);
            this.addChildGui(this.background);
            c = sc.arena.runtime.rush ?
                b : a;
            f = f ? c.deathButtons : sc.arena.isCurrentRoundLast() ? c.end : c.buttons;
            for (c = 0; c < f.length; c++) {
                var d = f[c],
                    g = new sc.ButtonGui(ig.lang.get("sc.gui.arena.buttons.names." + d.label), 120);
                g.submitSound = null;
                g.blockedSound = null;
                g.bgGui.flipped = true;
                g.highlightGui.flipped = true;
                g.setData({
                    delay: d.delay,
                    description: ig.lang.get("sc.gui.arena.buttons.description." + d.label),
                    id: c
                });
                g.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.2,
                        timeFunction: KEY_SPLINES.EASE
                    },
                    HIDDEN: {
                        state: {
                            offsetX: -(130 + d.x)
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                g.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.CENTER);
                g.setPos(d.x, d.y);
                g.doStateTransition("HIDDEN", true);
                this.addChildGui(g);
                this.buttonGroup.addFocusGui(g, 0, c);
                this.buttons.push(g)
            }
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.doStateTransition("HIDDEN", true)
        },
        handleRushMode: function(a) {
            if (sc.options.get("arena-confirm")) {
                sc.BUTTON_SOUND.submit.play();
                var b = this.getDialogText(true, a);
                if (b) {
                    this.dialogBlock = true;
                    sc.Dialogs.showYesNoDialog(b, sc.DIALOG_INFO_ICON.QUESTION, function(b) {
                        this.dialogBlock =
                            false;
                        if (b.data == 0) {
                            this.confirm.play();
                            this.callback(true, a, this._isLastRound)
                        } else b.data == 1 && sc.BUTTON_SOUND.submit.play()
                    }.bind(this), true)
                } else this.callback(true, a, this._isLastRound)
            } else {
                this.confirm.play();
                this.callback(true, a, this._isLastRound)
            }
        },
        handleDefaultMode: function(a) {
            if (sc.options.get("arena-confirm")) {
                sc.BUTTON_SOUND.submit.play();
                var b = this.getDialogText(false, a);
                if (b) {
                    this.dialogBlock = true;
                    sc.Dialogs.showYesNoDialog(b, sc.DIALOG_INFO_ICON.QUESTION, function(b) {
                        this.dialogBlock =
                            false;
                        if (b.data == 0) {
                            this.confirm.play();
                            this.callback(false, a, this._isLastRound)
                        } else b.data == 1 && sc.BUTTON_SOUND.submit.play()
                    }.bind(this), true)
                } else this.callback(false, a, this._isLastRound)
            } else {
                this.confirm.play();
                this.callback(false, a, this._isLastRound)
            }
        },
        getDialogText: function(a, b) {
            if (a)
                if (this._playerDeath) {
                    if (b == 0) return ig.lang.get("sc.gui.arena.dialogs.restart");
                    if (b == 1) return ig.lang.get("sc.gui.arena.dialogs.giveUp")
                } else if (this._isLastRound) {
                if (b == 0) return ig.lang.get("sc.gui.arena.dialogs.restart");
                if (b == 1) return null;
                if (b == 2) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            } else {
                if (b == 0) return ig.lang.get("sc.gui.arena.dialogs.next");
                if (b == 1) return ig.lang.get("sc.gui.arena.dialogs.restart");
                if (b == 2) return ig.lang.get("sc.gui.arena.dialogs.giveUp")
            } else if (this._playerDeath) {
                if (b == 0) return ig.lang.get("sc.gui.arena.dialogs.repeat");
                if (b == 1) return null;
                if (b == 2) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            } else {
                if (b == 0) return ig.lang.get("sc.gui.arena.dialogs.next");
                if (b == 1) return ig.lang.get("sc.gui.arena.dialogs.repeat");
                if (b == 2) return null;
                if (b == 3) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            }
        },
        onButtonPressed: function(a) {
            sc.arena.runtime.rush ? this.handleRushMode(a.data.id) : this.handleDefaultMode(a.data.id)
        },
        onButtonSelect: function(a) {
            a.data ? this.info.setText(a.data.description) : this.info.setText("", 0.5)
        },
        onMouseFocusLost: function() {
            this.info.setText("", 0.5)
        },
        show: function() {
            this.doStateTransition("DEFAULT", true);
            this.background.doStateTransition("DEFAULT");
            for (var a = this.buttons.length; a--;) this.buttons[a].doStateTransition("DEFAULT",
                false, false, null, this.buttons[a].data.delay + 0.032);
            a = sc.arena.runtime;
            !a.rush && !this._playerDeath && a.currentRound == a.rounds.length - 1 && this.buttons[0].setActive(false);
            ig.interact.addEntry(this.buttonInteract)
        },
        hide: function() {
            this.background.doStateTransition("HIDDEN");
            for (var a = this.buttons.length; a--;) this.buttons[a].doStateTransition("HIDDEN");
            ig.interact.removeEntry(this.buttonInteract)
        }
    });
    sc.ArenaCoinsHud = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/arena-gui.png", {
            width: 18,
            height: 0,
            left: 14,
            top: 14,
            right: 0,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 34
                }
            }
        }),
        panel: null,
        number: null,
        coins: null,
        add: 0,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
            this.setPivot(0, 7);
            this.setPos(0, 70);
            this.panel = new ig.BoxGui(120, 14, false, this.ninepatch);
            this.panel.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.panel.hook.localAlpha = 0.5;
            this.panel.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -d / 2,
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.panel.doStateTransition("HIDDEN", true);
            this.addChildGui(this.panel);
            this.coins = new ig.ImageGui(this.ninepatch.gfx, 135, 66, 18, 18);
            this.coins.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.coins.setPos(5, 0);
            this.panel.addChildGui(this.coins);
            this.number = new sc.MoneyTextGui(false, true);
            this.number.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.number.setPos(this.coins.hook.size.x + 5 + 3, 0);
            this.panel.addChildGui(this.number);
            this.setSize(this.number.hook.pos.x + this.number.hook.size.x + 5, 14);
            this.panel.setSize(this.hook.size.x, this.hook.size.y)
        },
        addRushCoins: function() {
            var a = sc.arena.runtime;
            this.add = sc.arena.getArenaCoinsObtainedInRound(a.cup, -1, a.prevMedal);
            this.number.number.setNumber(this.add)
        },
        show: function() {
            this.panel.doStateTransition("HIDDEN", true);
            var a = sc.arena.runtime;
            this.add = sc.arena.getArenaCoinsObtainedInRound(a.cup, a.currentRound, a.prevMedal);
            this.add > 0 && this.panel.doStateTransition("DEFAULT", false, false,
                function() {
                    this.number.number.setNumber(this.add)
                }.bind(this), 0.1)
        },
        hide: function() {
            this.panel.doStateTransition("HIDDEN")
        }
    });
    var d = 134;
    sc.ArenaMedalHud = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/arena-gui.png", {
            width: 18,
            height: 0,
            left: 14,
            top: 14,
            right: 0,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 34
                }
            }
        }),
        panel: null,
        text: null,
        medal: null,
        effect: null,
        callback: null,
        init: function(a) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
            this.setSize(d, 32);
            this.setPivot(0, 16);
            this.setPos(0, 96);
            this.callback = a;
            this.panel = new ig.BoxGui(d, 13, false, this.ninepatch);
            this.panel.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.panel.hook.localAlpha = 0.5;
            this.panel.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -d / 2,
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.panel.doStateTransition("HIDDEN", true);
            this.addChildGui(this.panel);
            this.text = new sc.TextGui("Bronze");
            this.text.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 15
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_IN_OUT
                }
            };
            this.text.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.text.setPos(58, -2);
            this.panel.addChildGui(this.text);
            this.medal = new ig.GuiElementBase;
            this.medal.setSize(32, 32);
            this.medal.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.medal.setPos(13, 0);
            this.addChildGui(this.medal);
            this.effect = new sc.ArenaMedalEffect;
            this.effect.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.CENTER);
            this.medal.addChildGui(this.effect)
        },
        show: function(a) {
            this.panel.doStateTransition("HIDDEN", true);
            this.text.doStateTransition("HIDDEN", true);
            var b = ig.lang.get("sc.gui.arena.medals")[Math.max(0, Math.min(4, a - 1))];
            this.text.setText(b);
            this.panel.doStateTransition("DEFAULT", false, false, function() {
                this.text.doStateTransition("DEFAULT", false, false, function() {
                    this.callback && this.callback()
                }.bind(this), 0.2)
            }.bind(this), 0.1);
            this.effect.show(a, false)
        },
        hide: function() {
            this.panel.doStateTransition("HIDDEN");
            this.effect.hide()
        }
    });
    sc.ArenaRoundEndHeader = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/arena-gui.png", {
            width: 16,
            height: 0,
            left: 66,
            top: 15,
            right: 66,
            bottom: 0,
            offsets: {
                "default": {
                    x: 82,
                    y: 1
                },
                white: {
                    x: 82,
                    y: 17
                }
            }
        }),
        text: null,
        init: function() {
            this.parent(262, 15);
            this.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            this.setPivot(131, 0);
            this.setPos(0,
                32);
            this.text = new sc.TextGui("");
            this.text.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            this.text.setPos(0, -2);
            this.addChildGui(this.text);
            this.overlay = new ig.BoxGui(262, 15, false, this.ninepatch);
            this.overlay.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.25,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.25,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.overlay.currentTileOffset = "white";
            this.overlay.doStateTransition("HIDDEN", true);
            this.addChildGui(this.overlay);
            this.doStateTransition("HIDDEN",
                true)
        },
        show: function(a, b) {
            b = b || ig.lang.get("sc.gui.arena.roundClear").replace("[!]", sc.arena.runtime.currentRound + 1);
            this.text.setText(b);
            this.overlay.doStateTransition("DEFAULT", false, false, function() {
                this.overlay.doStateTransition("HIDDEN", false, false, null, 0.2)
            }.bind(this));
            this.doStateTransition("DEFAULT", false, false, a)
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    });
    sc.ArenaSummary = sc.RightHudBoxGui.extend({
        summaryContent: null,
        scrollPanel: null,
        container: null,
        total: null,
        totalOverlay: null,
        entries: [],
        currentIndex: 0,
        timer: 0,
        totalValue: 0,
        addEntries: false,
        containerHeight: 0,
        done: false,
        callback: null,
        scoreCountSound: new ig.Sound("media/sound/arena/arena-score-count.ogg", 1, 0.1),
        scoreDotSound: new ig.Sound("media/sound/arena/score-dot.ogg", 0.8),
        scoreDotPitch: 0.8,
        init: function(a) {
            this.parent(ig.lang.get("sc.gui.arena.summary"));
            this.callback = a || null;
            var b = sc.options.get("min-sidebar") && sc.options.get("pixel-size") == sc.PIXEL_SIZE.TWO;
            this.summaryContent = new ig.GuiElementBase;
            this.summaryContent.setSize(220,
                117 + (b ? 152 : 0));
            a = -2;
            this.scrollPanel = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollPanel.showTopBar = false;
            this.scrollPanel.showBottomBar = false;
            this.scrollPanel.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.scrollPanel.setSize(218, 101 * (b ? 2.5 : 1));
            this.scrollPanel.setPos(-1, a);
            this.summaryContent.addChildGui(this.scrollPanel);
            a = a + this.scrollPanel.hook.size.y;
            b = new sc.LineGui(220);
            b.setPos(0, a);
            this.summaryContent.addChildGui(b);
            this.container = new ig.GuiElementBase;
            this.scrollPanel.setContent(this.container);
            this.total = new sc.STATS_ENTRY_TYPE.KeyValue("total", {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                numberSize: sc.NUMBER_SIZE.TEXT,
                transitionTime: 0.2
            }, 226);
            this.total.keyGui.setText(ig.lang.get("sc.gui.arena.total") + ":");
            this.total.setPos(-3, a);
            this.total.setValueAsNumber(0, true);
            this.summaryContent.addChildGui(this.total);
            this.totalOverlay = new sc.NumberGui(999999999, {
                size: sc.NUMBER_SIZE.TEXT,
                dots: true,
                transitionTime: 0.2,
                color: sc.GUI_NUMBER_COLOR.NO_SHADOW
            });
            this.totalOverlay.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.totalOverlay.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.totalOverlay.setPos(5, 0);
            this.totalOverlay.doStateTransition("HIDDEN", true);
            this.total.addChildGui(this.totalOverlay);
            this.pushContent(this.summaryContent, false, 2, 2);
            this.contentEntries[0].hook.localAlpha = 0.5
        },
        update: function() {
            if (this.addEntries) {
                if (this.currentIndex > 0) {
                    if (this.scoreDotPitch < 1.5) this.scoreDotPitch =
                        this.scoreDotPitch + 0.6 * ig.system.tick;
                    this.scoreDotSound.play(false, {
                        speed: this.scoreDotPitch
                    })
                }
                if (this.timer <= 0)
                    if (this.currentIndex == -1) {
                        this.timer = 0.1;
                        this.currentIndex = 0
                    } else {
                        var a = this.entries[this.currentIndex],
                            b = null,
                            b = a.separator ? this._addSeparator(a.text) : a.data ? this._addBonusEntry(a.type, a.data, a.points) : this._addEntry(a.key, a.stats);
                        this.currentIndex++;
                        this.container.hook.size.y = this.container.hook.size.y + (b.hook.size.y + 0);
                        this.scrollPanel.recalculateScrollBars(true);
                        this.scrollPanel.setScrollY(this.container.hook.size.y,
                            false, 0.1, KEY_SPLINES.LINEAR);
                        this.timer = 0.1;
                        if (this.currentIndex >= this.entries.length) {
                            this.addEntries = false;
                            this.done = true;
                            this.timer = 0.2
                        }
                    }
                else this.timer = this.timer - ig.system.tick
            } else if (this.done && this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.scoreDotPitch < 1.5) this.scoreDotPitch = this.scoreDotPitch + 0.6 * ig.system.tick;
                this.scoreDotSound.play(false, {
                    speed: this.scoreDotPitch
                });
                if (this.timer <= 0) {
                    this.totalOverlay.setMaxNumber(Math.max(0, this.totalValue));
                    this.totalOverlay.setNumber(Math.max(0,
                        this.totalValue), true);
                    this.totalOverlay.doStateTransition("DEFAULT", false, false, function() {
                        this.totalOverlay.doStateTransition("HIDDEN")
                    }.bind(this));
                    this.scoreCountSound.play();
                    this.callback && this.callback()
                }
            }
        },
        updateScroll: function() {
            if (this.done) {
                sc.control.menuScrollUp() ? this.scrollPanel.scrollY(-14) : sc.control.menuScrollDown() && this.scrollPanel.scrollY(14);
                sc.control.arenaScrollDown() ? this.scrollPanel.scrollY(140 * ig.system.tick) : sc.control.arenaScrollUp() && this.scrollPanel.scrollY(-140 * ig.system.tick)
            }
        },
        skip: function() {
            if (!this.done) {
                this.addEntries = false;
                for (var a = this.currentIndex; a < this.entries.length; a++) {
                    var b = this.entries[this.currentIndex],
                        d = null,
                        d = b.separator ? this._addSeparator(b.text, true) : b.data ? this._addBonusEntry(b.type, b.data, b.points, true) : this._addEntry(b.key, b.stats, true);
                    this.currentIndex++;
                    this.container.hook.size.y = this.container.hook.size.y + (d.hook.size.y + 0)
                }
                this.scrollPanel.recalculateScrollBars(true);
                this.scrollPanel.setScrollY(this.container.hook.size.y, false, 0.1, KEY_SPLINES.LINEAR);
                this.totalOverlay.setMaxNumber(Math.max(0, this.totalValue));
                this.totalOverlay.setNumber(Math.max(0, this.totalValue), true);
                this.totalOverlay.doStateTransition("DEFAULT", false, false, function() {
                    this.totalOverlay.doStateTransition("HIDDEN")
                }.bind(this));
                this.scoreCountSound.play();
                this.timer = 0;
                this.done = true
            }
        },
        show: function() {
            this.parent();
            var a = sc.arena.runtime.scoreStats,
                b;
            for (b in a) this.entries.push({
                key: b,
                stats: a[b]
            });
            this.entries.sort(function(a, b) {
                return sc.ARENA_SCORE_TYPES[a.key].order - sc.ARENA_SCORE_TYPES[b.key].order
            });
            b = sc.arena.runtime.bonusObjectives;
            for (var a = [], d = b.length; d--;) {
                var g = b[d];
                (ig.perf.grantArenaBonus || sc.ARENA_BONUS_OBJECTIVE[g.type].check(g.data)) && a.push(b[d])
            }
            if (a.length > 0) {
                a.sort(function(a, b) {
                    return sc.ARENA_BONUS_OBJECTIVE[a.type].order - sc.ARENA_BONUS_OBJECTIVE[b.type].order
                });
                this.entries.push({
                    separator: true,
                    text: ig.lang.get("sc.gui.arena.menu.bonuses")
                });
                for (b = 0; b < a.length; b++) this.entries.push(a[b])
            }
            this.totalValue = 0;
            this.addEntries = true;
            this.currentIndex = -1;
            this.timer = 0.2
        },
        _addSeparator: function(a,
            b) {
            var d = new sc.TextGui("\\c[3]" + a + "\\c[0]", {
                font: sc.fontsystem.smallFont
            });
            d.hook.transitions = {
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
            };
            d.hook.size.y = 14;
            d.setPos(0, this.container.hook.size.y);
            d.doStateTransition("HIDDEN", true);
            d.doStateTransition("DEFAULT", b);
            this.container.addChildGui(d);
            return d
        },
        _addBonusEntry: function(a, b, d, g) {
            d = sc.ARENA_BONUS_OBJECTIVE[a].getPoints ? sc.ARENA_BONUS_OBJECTIVE[a].getPoints(b, d) :
                d;
            this.totalValue = this.totalValue + d;
            this.total.setValueAsNumber(Math.max(0, this.totalValue));
            a = "\\i[insetArrow]" + sc.ARENA_BONUS_OBJECTIVE[a].getText(ig.lang.get("sc.gui.arena.bonuses." + a), b, true);
            d = new sc.ArenaSummary.Entry(a, d, d, 0, true, false, sc.GUI_NUMBER_COLOR.WHITE, g);
            d.setPos(0, this.container.hook.size.y);
            this.container.addChildGui(d);
            return d
        },
        _addEntry: function(a, b, d) {
            var g = sc.ARENA_SCORE_TYPES[a],
                h = 0,
                i = 0;
            if (g["static"]) {
                h = i = b.value;
                a = ig.lang.get("sc.gui.arena.scoreTypes." + a);
                if (g.staticMultiplier &&
                    !sc.arena.hasChallenge("PVP_BATTLE")) {
                    a = g.asMali ? a + "\\i[timesRed]" : a + "\\i[times]";
                    a = a + g.staticMultiplier
                }
            } else {
                h = b.value;
                i = b.count * g.points
            }
            this.totalValue = this.totalValue + h;
            this.total.setValueAsNumber(Math.max(0, this.totalValue));
            a = new sc.ArenaSummary.Entry(a, h, i, b.count, g["static"], g.asBonus, g.asMali, d);
            a.setPos(0, this.container.hook.size.y);
            this.container.addChildGui(a);
            return a
        }
    });
    sc.ArenaSummary.Entry = ig.SimpleGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
        keyGui: null,
        valueGui: null,
        extraKey: null,
        extraValue: null,
        init: function(a, b, d, g, h, i, j, k) {
            this.parent();
            this.setSize(213, 14);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X);
            var l = "",
                l = !h && sc.ARENA_SCORE_TYPES[a].getName ? sc.ARENA_SCORE_TYPES[a].getName() || "MISSING SCORE TYPE NAME" : h ? a : ig.lang.get("sc.gui.arena.scoreTypes." +
                    a) + (j ? "\\i[timesRed]" : "\\i[times]") + g;
            i ? l = "\\i[insetArrow]\\c[2]" + l + "\\c[0]" : j && (l = "\\c[1]" + l + "\\c[0]");
            this.keyGui = new sc.TextGui(l, {
                font: sc.fontsystem.smallFont
            });
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.NumberGui(Math.abs(d), {
                size: sc.NUMBER_SIZE.SMALL,
                transitionTime: 0.2,
                showPlus: i,
                signed: j
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.valueGui.setPos(0, 3);
            i ? this.valueGui.setColor(sc.GUI_NUMBER_COLOR.GREEN) : j && this.valueGui.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.addChildGui(this.valueGui);
            if (!h && b > d) {
                this.valueGui.setNumber(d, k);
                this.hook.size.y = this.hook.size.y + 14;
                a = b - d;
                this.extraKey = new sc.TextGui("\\i[insetArrow]\\c[" + (a > 0 ? 2 : 1) + "]" + ig.lang.get("sc.gui.arena." + (a > 0 ? "chainBonus" : "dimReturns")) + "\\c[0]", {
                    font: sc.fontsystem.smallFont
                });
                this.extraKey.setPos(0, 14);
                this.addChildGui(this.extraKey);
                this.extraValue = new sc.NumberGui(Math.abs(a), {
                    size: sc.NUMBER_SIZE.SMALL,
                    transitionTime: 0.2,
                    signed: true,
                    showPlus: true
                });
                this.extraValue.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.extraValue.setColor(a > 0 ? sc.GUI_NUMBER_COLOR.GREEN : sc.GUI_NUMBER_COLOR.RED);
                this.extraValue.setPos(0, 17);
                this.extraValue.setNumber(a, k);
                this.addChildGui(this.extraValue)
            } else this.valueGui.setNumber(b, k);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", k)
        },
        updateDrawables: function(a) {
            if (this.keyGui && this.valueGui) {
                var b = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    d = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    d = Math.floor(d /
                        3) * 3;
                a.addPattern(this.constructor.PATTERN, b, 9, 0, 0, d, 4);
                if (this.extraKey) {
                    b = this.extraKey.hook.size.x + this.extraKey.hook.pos.x + 1;
                    d = this.hook.size.x - this.extraKey.hook.size.x - this.extraValue.hook.size.x - 1;
                    d = Math.floor(d / 3) * 3;
                    a.addPattern(this.constructor.PATTERN, b, 23, 0, 0, d, 4)
                }
            }
        }
    })
});
ig.baked = !0;
