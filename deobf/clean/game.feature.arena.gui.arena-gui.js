ig.module("game.feature.arena.gui.arena-gui").requires("impact.feature.rumble.rumble", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.boxes", "game.feature.arena.arena", "game.feature.gui.hud.right-hud", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-misc", "game.feature.arena.gui.arena-effect-display", "game.feature.arena.gui.arena-round-gui", "game.feature.arena.gui.arena-trophy-gui", "game.feature.arena.gui.arena-rush-gui").defines(function() {
    sc.ArenaPlayerDeathOverlay =
        ig.GuiElementBase.extend({
            transitions: {
                DEFAULT: {
                    state: {},
                    time: 0.5,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {},
                    time: 0.3,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            },
            done: false,
            init: function() {
                this.parent();
                this.setSize(ig.system.width, ig.system.height);
                this.hook.zIndex = 98;
                this.header = new sc.ArenaRoundEndHeader;
                this.addChildGui(this.header);
                this.info = new sc.InfoBar(null, null, true);
                this.info.setAlign(ig.GUI_ALIGN_X.LEFT, ig.GUI_ALIGN_Y.BOTTOM);
                this.info.setPos(0, 1);
                this.info.doStateTransition("DEFAULT");
                this.addChildGui(this.info);
                this.buttons = new sc.ArenaRoundEndButtons(function(canContinue, button) {
                    if (canContinue)
                        if (button == 0) {
                            sc.arena.restartCup();
                            this.hide();
                            sc.commonEvents.startCallEvent("arena-teleport")
                        } else {
                            if (button == 1) {
                                sc.arena.prepareLobbyReturn();
                                this.hide();
                                sc.commonEvents.startCallEvent("arena-end-cup")
                            }
                        }
                    else if (button == 0) {
                        sc.arena.startNextRound(false);
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-teleport")
                    } else if (button == 1) {
                        this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                            this.overview = null
                        }.bind(this), true);
                        ig.gui.addGuiElement(this.overview);
                        this.overview.show()
                    } else if (button == 2) {
                        sc.arena.prepareLobbyReturn();
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-end-cup")
                    }
                }.bind(this), this.info, true);
                this.addChildGui(this.buttons)
            },
            show: function() {
                this.header.show(function() {
                    this.buttons.show()
                }.bind(this), ig.lang.get("sc.gui.arena.roundFail"));
                this.doStateTransition("DEFAULT", true)
            },
            hide: function() {
                this.buttons.hide();
                this.header.hide();
                this.doStateTransition("HIDDEN", false, true)
            }
        });
    sc.ArenaRoundEndOverlay = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        interact: null,
        header: null,
        summary: null,
        medal: null,
        coins: null,
        buttons: null,
        info: null,
        rushChain: null,
        overview: null,
        done: false,
        state: 0,
        waitTimer: 0,
        initTimer: 0,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.zIndex = 102;
            this.interact = new sc.ScreenInteractEntry(this, false);
            this.header = new sc.ArenaRoundEndHeader;
            this.addChildGui(this.header);
            this.rushChain = new sc.ArenaChainHud(true);
            this.addChildGui(this.rushChain);
            this.summary = new sc.ArenaSummary(function() {
                if (this.state == 0) {
                    this.state = 1;
                    this.waitTimer = 0.4;
                    this.checkNewRecord()
                }
            }.bind(this));
            if (!sc.arena.isCupCustom(sc.arena.runtime.cup)) {
                this.coins = new sc.ArenaCoinsHud;
                this.addChildGui(this.coins)
            }
            this.medal = new sc.ArenaMedalHud(function() {
                if (this.state == 1) {
                    this.state = 2;
                    this.waitTimer = 0.2;
                    this.saveScore();
                    this.coins && this.coins.show()
                }
            }.bind(this));
            this.addChildGui(this.medal);
            this.info = new sc.InfoBar(null, null, true);
            this.info.setAlign(ig.GUI_ALIGN_X.LEFT,
                ig.GUI_ALIGN_Y.BOTTOM);
            this.info.setPos(0, 1);
            this.info.doStateTransition("DEFAULT");
            this.addChildGui(this.info);
            this.buttons = new sc.ArenaRoundEndButtons(function(isRoundEnd, button, canContinue) {
                if (isRoundEnd)
                    if (canContinue)
                        if (button == 0) {
                            ig.bgm.pause("FAST_OUT");
                            sc.arena.restartCup();
                            this.hide();
                            sc.commonEvents.startCallEvent("arena-teleport")
                        } else if (button == 1) {
                    this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                        this.overview = null
                    }.bind(this), true);
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show()
                } else {
                    if (button == 2) {
                        sc.arena.prepareLobbyReturn();
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-end-cup")
                    }
                } else if (button == 0) {
                    sc.arena.startNextRound(button == 0);
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else if (button == 1) {
                    ig.bgm.pause("FAST_OUT");
                    sc.arena.restartCup();
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else {
                    if (button == 2) {
                        sc.arena.prepareLobbyReturn();
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-end-cup")
                    }
                } else if (button <= 1) {
                    sc.arena.startNextRound(button == 0);
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else if (button ==
                    2) {
                    this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                        this.overview = null
                    }.bind(this), true);
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show()
                } else if (button == 3) {
                    sc.arena.prepareLobbyReturn();
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-end-cup")
                }
            }.bind(this), this.info);
            this.addChildGui(this.buttons);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            !this.overview && !this.buttons.dialogBlock && this.summary && this.summary.updateScroll();
            if (this.initTimer > 0) this.initTimer =
                this.initTimer - ig.system.tick;
            if (this.waitTimer > 0) {
                this.waitTimer = this.waitTimer - ig.system.rawTick;
                if (this.waitTimer <= 0)
                    if (this.state == 1) this.medal.show(sc.arena.getMedalForCurrentRound(this.summary.totalValue));
                    else if (this.state == 2) this.buttons.show();
                else if (this.state == 3) {
                    this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                        this.state = 2;
                        this.waitTimer = 0.2;
                        this.overview = null
                    }.bind(this));
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show(ig.lang.get("sc.gui.arena.newTrophy"))
                } else if (this.state ==
                    4) {
                    var isNewRushRecord = sc.arena.saveRushScore();
                    this.overview = new sc.ArenaRushOverview(function() {
                        this.coins && this.coins.addRushCoins();
                        this.state = isNewRushRecord ? 3 : 2;
                        this.waitTimer = 0.2;
                        this.overview = null
                    }.bind(this));
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show()
                }
            }
        },
        checkNewRecord: function() {
            if (sc.arena.isScoreNewRecord(this.summary.totalValue)) {
                sc.commonEvents.startCallEvent("arena-new-record");
                var box = new sc.SmallEntityBox(ig.game.playerEntity, ig.lang.get("sc.gui.arena.newRecord"), 3, null, 10);
                box.hideSmall = true;
                box.stopRumble();
                this.addChildGui(box)
            }
        },
        saveScore: function() {
            if (sc.arena.saveScore(this.summary.totalValue) && !sc.arena.runtime.rush) this.state = 3;
            if (sc.arena.runtime.rush && sc.arena.isCurrentRoundLast()) this.state = 4
        },
        onInteraction: function() {
            if (!(this.waitTimer > 0 || this.initTimer > 0))
                if (this.state == 0) {
                    this.summary.skip();
                    this.state = 1;
                    this.waitTimer = 0.2;
                    this.checkNewRecord()
                } else if (this.state == 1) {
                this.state = 2;
                this.waitTimer = 0.2;
                this.saveScore();
                this.coins && this.coins.show(true)
            }
        },
        show: function() {
            this.initTimer = 0.8;
            ig.interact.addEntry(this.interact);
            sc.gui.rightHudPanel.addHudBoxBefore(this.summary, sc.gui.moneyHud);
            this.header.show(function() {
                this.summary.show()
            }.bind(this));
            var runtime = sc.arena.runtime;
            if (runtime.rush && runtime.chain > 1) {
                runtime.chainGui.doPosTranstition(0, 40, 0.2, KEY_SPLINES.EASE);
                this.rushChain.show();
                this.rushChain.animateChainNumber(0, runtime.rushChain, 0.4)
            }
            this.doStateTransition("DEFAULT", true)
        },
        hide: function() {
            this.buttons.hide();
            this.medal.hide();
            this.coins && this.coins.hide();
            this.summary.remove();
            this.header.hide();
            this.info.setText("", 0.1);
            this.rushChain.hide();
            ig.interact.removeEntry(this.interact);
            this.doStateTransition("HIDDEN", false, true)
        }
    });
    var zeroVec = {
        x: 0,
        y: 0
    };
    sc.ArenaChainHud = ig.GuiElementBase.extend({
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
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 12,
            height: 0,
            left: 12,
            top: 12,
            right: 0,
            bottom: 0,
            offsets: {
                "default": {
                    x: 49,
                    y: 32
                }
            }
        }),
        panel: null,
        text: null,
        number: null,
        pulsing: false,
        timer: null,
        initNumber: null,
        targetNumber: null,
        done: null,
        chainSound: new ig.Sound("media/sound/arena/chain-counter.ogg", 0.7),
        init: function(isRush) {
            this.parent();
            this.setSize(58, 18);
            this.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
            this.setPos(0, 22);
            this.hook.zIndex = 99;
            this.panel = new ig.BoxGui(58, 12, false, this.ninepatch);
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
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.panel.setAlign(ig.GUI_ALIGN_X.RIGHT,
                ig.GUI_ALIGN.Y_CENTER);
            this.panel.setPos(0, 0);
            this.addChildGui(this.panel);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.arena." + (isRush ? "rushChain" : "chain")));
            this.text.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(4, 0);
            this.panel.addChildGui(this.text);
            this.panel.setSize(4 + this.text.hook.size.x + 24, 12);
            this.number = new sc.ArenaChainHud.Number(isRush);
            this.number.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(4 + this.text.hook.size.x + 1, 1);
            this.addChildGui(this.number);
            this.hide(true)
        },
        update: function() {
            if (this.animating) {
                this.timer && this.timer.tick();
                var number = this._getCurrentNumber();
                this.number.setChainNumber(number);
                if (this.timer.done()) this.animating = false
            }
        },
        show: function() {
            this.panel.doStateTransition("DEFAULT");
            this.number.doStateTransition("DEFAULT", true)
        },
        hide: function(instant) {
            this.panel.doStateTransition("HIDDEN", instant);
            this.number.doStateTransition("HIDDEN", instant)
        },
        animateChainNumber: function(from, to, time) {
            if (!this.timer) this.timer = new ig.WeightTimer(true);
            this.animating = true;
            this.timer.set(time ||
                0.2);
            this.initNumber = from || 0;
            this.targetNumber = to || 0
        },
        setChainNumber: function(number, instant) {
            if (number >= 2) {
                this.show();
                this.number.setChainNumber(number);
                var pitch = 0.9 + Math.min(5, number) / 5 * 0.7;
                this.chainSound.play(false, {
                    speed: pitch
                })
            } else {
                this.pulsing = false;
                this.number.setPulse(false);
                this.hide(instant)
            }
        },
        setPulse: function(pulse) {
            this.pulsing = pulse || false;
            this.number.setPulse(pulse)
        },
        rumble: function() {
            this.number.rumble()
        },
        _getCurrentNumber: function() {
            if (this.timer.done()) return this.targetNumber;
            var progress = this.timer.get();
            return Math.floor((1 - progress) * this.initNumber +
                progress * this.targetNumber)
        }
    });
    sc.ArenaChainHud.Number = ig.GuiElementBase.extend({
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
        one: null,
        ten: null,
        hun: null,
        init: function(isRush) {
            this.parent();
            this.setSize(39, 15);
            this.one = new sc.ArenaChainHud.Digit(isRush);
            this.one.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.addChildGui(this.one);
            this.ten = new sc.ArenaChainHud.Digit(isRush);
            this.ten.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.ten.setPos(13, 0);
            this.addChildGui(this.ten);
            this.hun = new sc.ArenaChainHud.Digit(isRush);
            this.hun.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.hun.setPos(26, 0);
            this.addChildGui(this.hun);
            this.setChainNumber(-1)
        },
        setChainNumber: function(number) {
            var tens = Math.floor(number / 10) % 10;
            tens <= 0 && (tens = -1);
            var hundreds = Math.floor(number / 100) % 10;
            hundreds <= 0 && (hundreds = -1);
            this.one.setDigit(number % 10);
            this.ten.setDigit(tens);
            this.hun.setDigit(hundreds)
        },
        setPulse: function(pulse) {
            this.one.setPulse(pulse);
            this.ten.setPulse(pulse);
            this.hun.setPulse(pulse)
        },
        rumble: function() {
            this.one.rumble();
            this.ten.rumble();
            this.hun.rumble()
        }
    });
    sc.ArenaChainHud.Digit = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
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
            },
            LIT: {
                state: {
                    scaleX: 1.3,
                    scaleY: 1.3
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        digit: -1,
        timer: 0,
        rumbleHandle: 0,
        pulsing: false,
        pulseAfter: false,
        rush: false,
        init: function(isRush) {
            this.parent();
            this.setSize(14, 15);
            this.setPivot(7, 7.5);
            this.rush =
                isRush || false
        },
        setDigit: function(digit, instant) {
            this.digit = digit;
            if (this.digit < 0) {
                this.timer = 0;
                this.doStateTransition("HIDDEN", instant)
            } else if (instant) {
                this.timer = 0;
                this.doStateTransition("DEFAULT")
            } else {
                this.timer = 0.2;
                this.doStateTransition("DEFAULT", true);
                this.doStateTransition("LIT", false, false, function() {
                    this.doStateTransition("DEFAULT")
                }.bind(this))
            }
        },
        setPulse: function(pulse) {
            this.pulsing = pulse || false;
            if (this.rumbleHandle && pulse) this.pulseAfter = true;
            else if (this.pulsing) {
                this.rumbleHandle = new ig.Rumble.RumbleHandle("RANDOM", "WEAKESTEST",
                    "FASTEST", -1);
                this.alphaTimer = 1;
                this.alpha = 0
            } else this.rumbleHandle = null
        },
        rumble: function() {
            this.rumbleHandle = new ig.Rumble.RumbleHandle("RANDOM", "WEAKER", "FASTEST", 0.2);
            this.timer = 0.2
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer < 0) this.timer = 0
            }
            if (this.pulsing) {
                this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
                var progress = this.alphaTimer / 1,
                    progress = KEY_SPLINES.EASE_IN_OUT.get(1 - (progress > 0.5 ? 1 - (progress - 0.5) * 2 : progress * 2));
                this.alpha = progress * 0.5
            }
            this.rumbleHandle && this.rumbleHandle.update();
            if (this.rumbleHandle && this.rumbleHandle.isDone()) {
                this.rumbleHandle = null;
                this.pulseAfter && this.setPulse(this.pulsing)
            }
        },
        updateDrawables: function(drawables) {
            if (this.digit >= 0) {
                var offset = this.rumbleHandle ? this.rumbleHandle.offset : zeroVec;
                drawables.addGfx(this.gfx, offset.x, offset.y, this.digit * 13, this.rush ? 141 : 96, 13, 15);
                this.pulsing && drawables.addGfx(this.gfx, offset.x, offset.y, this.digit * 13, 126, 13, 15).setAlpha(this.alpha);
                this.timer > 0 && drawables.addGfx(this.gfx, offset.x, offset.y, this.digit * 13, 111, 13, 15).setAlpha(this.timer / 0.2)
            }
        }
    });
    sc.ArenaChallengeOverlay = sc.SideBoxGui.extend({
        init: function() {
            this.parent(false,
                ig.lang.get("sc.gui.arena.menu.challenges"));
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(0, 2);
            this.hook.pauseGui = true;
            this.hook.zIndex = 101;
            this.doStateTransition("HIDDEN")
        },
        setChallengeMods: function(mods) {
            this.hide(true);
            this.clearContent();
            var offsetY = 0,
                container = new ig.GuiElementBase,
                key;
            for (key in mods) {
                mods = new sc.ArenaChallengeEntry(key, 260);
                if (offsetY) {
                    var divider = new ig.ColorGui("#545454", 270, 1);
                    divider.setPos(-2, -3);
                    mods.addChildGui(divider)
                }
                mods.setPos(0, offsetY);
                container.addChildGui(mods);
                offsetY = offsetY + mods.hook.size.y
            }
            container.setSize(260, offsetY - 4);
            this.pushContent(container)
        }
    })
});
ig.baked = !0;
