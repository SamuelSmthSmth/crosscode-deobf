ig.module("game.feature.arena.gui.arena-round-gui").requires("impact.feature.rumble.rumble", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.hud.right-hud", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-misc", "game.feature.arena.gui.arena-effect-display").defines(function() {
    var buttonLayouts = {
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
        rushButtonLayouts = {
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
        init: function(callback, info, isPlayerDeath) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.CENTER);
            this.setSize(88, 176);
            this.callback = callback;
            this.info = info;
            this._playerDeath = isPlayerDeath || false;
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
            callback = sc.arena.runtime.rush ?
                rushButtonLayouts : buttonLayouts;
            isPlayerDeath = isPlayerDeath ? callback.deathButtons : sc.arena.isCurrentRoundLast() ? callback.end : callback.buttons;
            for (callback = 0; callback < isPlayerDeath.length; callback++) {
                var buttonData = isPlayerDeath[callback],
                    button = new sc.ButtonGui(ig.lang.get("sc.gui.arena.buttons.names." + buttonData.label), 120);
                button.submitSound = null;
                button.blockedSound = null;
                button.bgGui.flipped = true;
                button.highlightGui.flipped = true;
                button.setData({
                    delay: buttonData.delay,
                    description: ig.lang.get("sc.gui.arena.buttons.description." + buttonData.label),
                    id: callback
                });
                button.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.2,
                        timeFunction: KEY_SPLINES.EASE
                    },
                    HIDDEN: {
                        state: {
                            offsetX: -(130 + buttonData.x)
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                button.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.CENTER);
                button.setPos(buttonData.x, buttonData.y);
                button.doStateTransition("HIDDEN", true);
                this.addChildGui(button);
                this.buttonGroup.addFocusGui(button, 0, callback);
                this.buttons.push(button)
            }
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.doStateTransition("HIDDEN", true)
        },
        handleRushMode: function(button) {
            if (sc.options.get("arena-confirm")) {
                sc.BUTTON_SOUND.submit.play();
                var dialogText = this.getDialogText(true, button);
                if (dialogText) {
                    this.dialogBlock = true;
                    sc.Dialogs.showYesNoDialog(dialogText, sc.DIALOG_INFO_ICON.QUESTION, function(result) {
                        this.dialogBlock =
                            false;
                        if (result.data == 0) {
                            this.confirm.play();
                            this.callback(true, button, this._isLastRound)
                        } else result.data == 1 && sc.BUTTON_SOUND.submit.play()
                    }.bind(this), true)
                } else this.callback(true, button, this._isLastRound)
            } else {
                this.confirm.play();
                this.callback(true, button, this._isLastRound)
            }
        },
        handleDefaultMode: function(button) {
            if (sc.options.get("arena-confirm")) {
                sc.BUTTON_SOUND.submit.play();
                var dialogText = this.getDialogText(false, button);
                if (dialogText) {
                    this.dialogBlock = true;
                    sc.Dialogs.showYesNoDialog(dialogText, sc.DIALOG_INFO_ICON.QUESTION, function(result) {
                        this.dialogBlock =
                            false;
                        if (result.data == 0) {
                            this.confirm.play();
                            this.callback(false, button, this._isLastRound)
                        } else result.data == 1 && sc.BUTTON_SOUND.submit.play()
                    }.bind(this), true)
                } else this.callback(false, button, this._isLastRound)
            } else {
                this.confirm.play();
                this.callback(false, button, this._isLastRound)
            }
        },
        getDialogText: function(isRush, button) {
            if (isRush)
                if (this._playerDeath) {
                    if (button == 0) return ig.lang.get("sc.gui.arena.dialogs.restart");
                    if (button == 1) return ig.lang.get("sc.gui.arena.dialogs.giveUp")
                } else if (this._isLastRound) {
                if (button == 0) return ig.lang.get("sc.gui.arena.dialogs.restart");
                if (button == 1) return null;
                if (button == 2) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            } else {
                if (button == 0) return ig.lang.get("sc.gui.arena.dialogs.next");
                if (button == 1) return ig.lang.get("sc.gui.arena.dialogs.restart");
                if (button == 2) return ig.lang.get("sc.gui.arena.dialogs.giveUp")
            } else if (this._playerDeath) {
                if (button == 0) return ig.lang.get("sc.gui.arena.dialogs.repeat");
                if (button == 1) return null;
                if (button == 2) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            } else {
                if (button == 0) return ig.lang.get("sc.gui.arena.dialogs.next");
                if (button == 1) return ig.lang.get("sc.gui.arena.dialogs.repeat");
                if (button == 2) return null;
                if (button == 3) return ig.lang.get("sc.gui.arena.dialogs.lobby")
            }
        },
        onButtonPressed: function(button) {
            sc.arena.runtime.rush ? this.handleRushMode(button.data.id) : this.handleDefaultMode(button.data.id)
        },
        onButtonSelect: function(button) {
            button.data ? this.info.setText(button.data.description) : this.info.setText("", 0.5)
        },
        onMouseFocusLost: function() {
            this.info.setText("", 0.5)
        },
        show: function() {
            this.doStateTransition("DEFAULT", true);
            this.background.doStateTransition("DEFAULT");
            for (var i = this.buttons.length; i--;) this.buttons[i].doStateTransition("DEFAULT",
                false, false, null, this.buttons[i].data.delay + 0.032);
            i = sc.arena.runtime;
            !i.rush && !this._playerDeath && i.currentRound == i.rounds.length - 1 && this.buttons[0].setActive(false);
            ig.interact.addEntry(this.buttonInteract)
        },
        hide: function() {
            this.background.doStateTransition("HIDDEN");
            for (var i = this.buttons.length; i--;) this.buttons[i].doStateTransition("HIDDEN");
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
                        offsetX: -panelWidth / 2,
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
            var runtime = sc.arena.runtime;
            this.add = sc.arena.getArenaCoinsObtainedInRound(runtime.cup, -1, runtime.prevMedal);
            this.number.number.setNumber(this.add)
        },
        show: function() {
            this.panel.doStateTransition("HIDDEN", true);
            var runtime = sc.arena.runtime;
            this.add = sc.arena.getArenaCoinsObtainedInRound(runtime.cup, runtime.currentRound, runtime.prevMedal);
            this.add > 0 && this.panel.doStateTransition("DEFAULT", false, false,
                function() {
                    this.number.number.setNumber(this.add)
                }.bind(this), 0.1)
        },
        hide: function() {
            this.panel.doStateTransition("HIDDEN")
        }
    });
    var panelWidth = 134;
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
        init: function(callback) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
            this.setSize(panelWidth, 32);
            this.setPivot(0, 16);
            this.setPos(0, 96);
            this.callback = callback;
            this.panel = new ig.BoxGui(panelWidth, 13, false, this.ninepatch);
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
                        offsetX: -panelWidth / 2,
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
        show: function(medal) {
            this.panel.doStateTransition("HIDDEN", true);
            this.text.doStateTransition("HIDDEN", true);
            var medalName = ig.lang.get("sc.gui.arena.medals")[Math.max(0, Math.min(4, medal - 1))];
            this.text.setText(medalName);
            this.panel.doStateTransition("DEFAULT", false, false, function() {
                this.text.doStateTransition("DEFAULT", false, false, function() {
                    this.callback && this.callback()
                }.bind(this), 0.2)
            }.bind(this), 0.1);
            this.effect.show(medal, false)
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
        show: function(callback, text) {
            text = text || ig.lang.get("sc.gui.arena.roundClear").replace("[!]", sc.arena.runtime.currentRound + 1);
            this.text.setText(text);
            this.overlay.doStateTransition("DEFAULT", false, false, function() {
                this.overlay.doStateTransition("HIDDEN", false, false, null, 0.2)
            }.bind(this));
            this.doStateTransition("DEFAULT", false, false, callback)
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
        init: function(callback) {
            this.parent(ig.lang.get("sc.gui.arena.summary"));
            this.callback = callback || null;
            var isMinSidebar = sc.options.get("min-sidebar") && sc.options.get("pixel-size") == sc.PIXEL_SIZE.TWO;
            this.summaryContent = new ig.GuiElementBase;
            this.summaryContent.setSize(220,
                117 + (isMinSidebar ? 152 : 0));
            callback = -2;
            this.scrollPanel = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollPanel.showTopBar = false;
            this.scrollPanel.showBottomBar = false;
            this.scrollPanel.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.scrollPanel.setSize(218, 101 * (isMinSidebar ? 2.5 : 1));
            this.scrollPanel.setPos(-1, callback);
            this.summaryContent.addChildGui(this.scrollPanel);
            callback = callback + this.scrollPanel.hook.size.y;
            isMinSidebar = new sc.LineGui(220);
            isMinSidebar.setPos(0, callback);
            this.summaryContent.addChildGui(isMinSidebar);
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
            this.total.setPos(-3, callback);
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
                        var entry = this.entries[this.currentIndex],
                            gui = null,
                            gui = entry.separator ? this._addSeparator(entry.text) : entry.data ? this._addBonusEntry(entry.type, entry.data, entry.points) : this._addEntry(entry.key, entry.stats);
                        this.currentIndex++;
                        this.container.hook.size.y = this.container.hook.size.y + (gui.hook.size.y + 0);
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
                for (var i = this.currentIndex; i < this.entries.length; i++) {
                    var entry = this.entries[this.currentIndex],
                        gui = null,
                        gui = entry.separator ? this._addSeparator(entry.text, true) : entry.data ? this._addBonusEntry(entry.type, entry.data, entry.points, true) : this._addEntry(entry.key, entry.stats, true);
                    this.currentIndex++;
                    this.container.hook.size.y = this.container.hook.size.y + (gui.hook.size.y + 0)
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
            var scoreStats = sc.arena.runtime.scoreStats,
                key;
            for (key in scoreStats) this.entries.push({
                key: key,
                stats: scoreStats[key]
            });
            this.entries.sort(function(a, b) {
                return sc.ARENA_SCORE_TYPES[a.key].order - sc.ARENA_SCORE_TYPES[b.key].order
            });
            key = sc.arena.runtime.bonusObjectives;
            for (var bonusList = [], i = key.length; i--;) {
                var objective = key[i];
                (ig.perf.grantArenaBonus || sc.ARENA_BONUS_OBJECTIVE[objective.type].check(objective.data)) && bonusList.push(key[i])
            }
            if (bonusList.length > 0) {
                bonusList.sort(function(a, b) {
                    return sc.ARENA_BONUS_OBJECTIVE[a.type].order - sc.ARENA_BONUS_OBJECTIVE[b.type].order
                });
                this.entries.push({
                    separator: true,
                    text: ig.lang.get("sc.gui.arena.menu.bonuses")
                });
                for (key = 0; key < bonusList.length; key++) this.entries.push(bonusList[key])
            }
            this.totalValue = 0;
            this.addEntries = true;
            this.currentIndex = -1;
            this.timer = 0.2
        },
        _addSeparator: function(text,
            instant) {
            var gui = new sc.TextGui("\\c[3]" + text + "\\c[0]", {
                font: sc.fontsystem.smallFont
            });
            gui.hook.transitions = {
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
            gui.hook.size.y = 14;
            gui.setPos(0, this.container.hook.size.y);
            gui.doStateTransition("HIDDEN", true);
            gui.doStateTransition("DEFAULT", instant);
            this.container.addChildGui(gui);
            return gui
        },
        _addBonusEntry: function(type, data, points, instant) {
            points = sc.ARENA_BONUS_OBJECTIVE[type].getPoints ? sc.ARENA_BONUS_OBJECTIVE[type].getPoints(data, points) :
                points;
            this.totalValue = this.totalValue + points;
            this.total.setValueAsNumber(Math.max(0, this.totalValue));
            type = "\\i[insetArrow]" + sc.ARENA_BONUS_OBJECTIVE[type].getText(ig.lang.get("sc.gui.arena.bonuses." + type), data, true);
            points = new sc.ArenaSummary.Entry(type, points, points, 0, true, false, sc.GUI_NUMBER_COLOR.WHITE, instant);
            points.setPos(0, this.container.hook.size.y);
            this.container.addChildGui(points);
            return points
        },
        _addEntry: function(key, stats, instant) {
            var type = sc.ARENA_SCORE_TYPES[key],
                value = 0,
                baseValue = 0;
            if (type["static"]) {
                value = baseValue = stats.value;
                key = ig.lang.get("sc.gui.arena.scoreTypes." + key);
                if (type.staticMultiplier &&
                    !sc.arena.hasChallenge("PVP_BATTLE")) {
                    key = type.asMali ? key + "\\i[timesRed]" : key + "\\i[times]";
                    key = key + type.staticMultiplier
                }
            } else {
                value = stats.value;
                baseValue = stats.count * type.points
            }
            this.totalValue = this.totalValue + value;
            this.total.setValueAsNumber(Math.max(0, this.totalValue));
            key = new sc.ArenaSummary.Entry(key, value, baseValue, stats.count, type["static"], type.asBonus, type.asMali, instant);
            key.setPos(0, this.container.hook.size.y);
            this.container.addChildGui(key);
            return key
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
        init: function(key, value, baseValue, count, isStatic, asBonus, asMali, instant) {
            this.parent();
            this.setSize(213, 14);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X);
            var label = "",
                label = !isStatic && sc.ARENA_SCORE_TYPES[key].getName ? sc.ARENA_SCORE_TYPES[key].getName() || "MISSING SCORE TYPE NAME" : isStatic ? key : ig.lang.get("sc.gui.arena.scoreTypes." +
                    key) + (asMali ? "\\i[timesRed]" : "\\i[times]") + count;
            asBonus ? label = "\\i[insetArrow]\\c[2]" + label + "\\c[0]" : asMali && (label = "\\c[1]" + label + "\\c[0]");
            this.keyGui = new sc.TextGui(label, {
                font: sc.fontsystem.smallFont
            });
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.NumberGui(Math.abs(baseValue), {
                size: sc.NUMBER_SIZE.SMALL,
                transitionTime: 0.2,
                showPlus: asBonus,
                signed: asMali
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.valueGui.setPos(0, 3);
            asBonus ? this.valueGui.setColor(sc.GUI_NUMBER_COLOR.GREEN) : asMali && this.valueGui.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.addChildGui(this.valueGui);
            if (!isStatic && value > baseValue) {
                this.valueGui.setNumber(baseValue, instant);
                this.hook.size.y = this.hook.size.y + 14;
                key = value - baseValue;
                this.extraKey = new sc.TextGui("\\i[insetArrow]\\c[" + (key > 0 ? 2 : 1) + "]" + ig.lang.get("sc.gui.arena." + (key > 0 ? "chainBonus" : "dimReturns")) + "\\c[0]", {
                    font: sc.fontsystem.smallFont
                });
                this.extraKey.setPos(0, 14);
                this.addChildGui(this.extraKey);
                this.extraValue = new sc.NumberGui(Math.abs(key), {
                    size: sc.NUMBER_SIZE.SMALL,
                    transitionTime: 0.2,
                    signed: true,
                    showPlus: true
                });
                this.extraValue.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.extraValue.setColor(key > 0 ? sc.GUI_NUMBER_COLOR.GREEN : sc.GUI_NUMBER_COLOR.RED);
                this.extraValue.setPos(0, 17);
                this.extraValue.setNumber(key, instant);
                this.addChildGui(this.extraValue)
            } else this.valueGui.setNumber(value, instant);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", instant)
        },
        updateDrawables: function(drawables) {
            if (this.keyGui && this.valueGui) {
                var dotStart = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    dotWidth = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    dotWidth = Math.floor(dotWidth /
                        3) * 3;
                drawables.addPattern(this.constructor.PATTERN, dotStart, 9, 0, 0, dotWidth, 4);
                if (this.extraKey) {
                    dotStart = this.extraKey.hook.size.x + this.extraKey.hook.pos.x + 1;
                    dotWidth = this.hook.size.x - this.extraKey.hook.size.x - this.extraValue.hook.size.x - 1;
                    dotWidth = Math.floor(dotWidth / 3) * 3;
                    drawables.addPattern(this.constructor.PATTERN, dotStart, 23, 0, 0, dotWidth, 4)
                }
            }
        }
    })
});
ig.baked = !0;
