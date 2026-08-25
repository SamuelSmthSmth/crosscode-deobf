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
                this.buttons = new sc.ArenaRoundEndButtons(function(a, b) {
                    if (a)
                        if (b == 0) {
                            sc.arena.restartCup();
                            this.hide();
                            sc.commonEvents.startCallEvent("arena-teleport")
                        } else {
                            if (b == 1) {
                                sc.arena.prepareLobbyReturn();
                                this.hide();
                                sc.commonEvents.startCallEvent("arena-end-cup")
                            }
                        }
                    else if (b == 0) {
                        sc.arena.startNextRound(false);
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-teleport")
                    } else if (b == 1) {
                        this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                            this.overview = null
                        }.bind(this), true);
                        ig.gui.addGuiElement(this.overview);
                        this.overview.show()
                    } else if (b == 2) {
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
            this.buttons = new sc.ArenaRoundEndButtons(function(a, b, c) {
                if (a)
                    if (c)
                        if (b == 0) {
                            ig.bgm.pause("FAST_OUT");
                            sc.arena.restartCup();
                            this.hide();
                            sc.commonEvents.startCallEvent("arena-teleport")
                        } else if (b == 1) {
                    this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                        this.overview = null
                    }.bind(this), true);
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show()
                } else {
                    if (b == 2) {
                        sc.arena.prepareLobbyReturn();
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-end-cup")
                    }
                } else if (b == 0) {
                    sc.arena.startNextRound(b == 0);
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else if (b == 1) {
                    ig.bgm.pause("FAST_OUT");
                    sc.arena.restartCup();
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else {
                    if (b == 2) {
                        sc.arena.prepareLobbyReturn();
                        this.hide();
                        sc.commonEvents.startCallEvent("arena-end-cup")
                    }
                } else if (b <= 1) {
                    sc.arena.startNextRound(b == 0);
                    this.hide();
                    sc.commonEvents.startCallEvent("arena-teleport")
                } else if (b ==
                    2) {
                    this.overview = new sc.ArenaCupOverview(sc.arena.runtime.cup, function() {
                        this.overview = null
                    }.bind(this), true);
                    ig.gui.addGuiElement(this.overview);
                    this.overview.show()
                } else if (b == 3) {
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
                    var a = sc.arena.saveRushScore();
                    this.overview = new sc.ArenaRushOverview(function() {
                        this.coins && this.coins.addRushCoins();
                        this.state = a ? 3 : 2;
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
                var a = new sc.SmallEntityBox(ig.game.playerEntity, ig.lang.get("sc.gui.arena.newRecord"), 3, null, 10);
                a.hideSmall = true;
                a.stopRumble();
                this.addChildGui(a)
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
            var a = sc.arena.runtime;
            if (a.rush && a.chain > 1) {
                a.chainGui.doPosTranstition(0, 40, 0.2, KEY_SPLINES.EASE);
                this.rushChain.show();
                this.rushChain.animateChainNumber(0, a.rushChain, 0.4)
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
    var b = {
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
        init: function(a) {
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
                ig.GUI_ALIGN_Y.CENTER);
            this.panel.setPos(0, 0);
            this.addChildGui(this.panel);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.arena." + (a ? "rushChain" : "chain")));
            this.text.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.CENTER);
            this.text.setPos(4, 0);
            this.panel.addChildGui(this.text);
            this.panel.setSize(4 + this.text.hook.size.x + 24, 12);
            this.number = new sc.ArenaChainHud.Number(a);
            this.number.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.number.setPos(4 + this.text.hook.size.x + 1, 1);
            this.addChildGui(this.number);
            this.hide(true)
        },
        update: function() {
            if (this.animating) {
                this.timer && this.timer.tick();
                var a = this._getCurrentNumber();
                this.number.setChainNumber(a);
                if (this.timer.done()) this.animating = false
            }
        },
        show: function() {
            this.panel.doStateTransition("DEFAULT");
            this.number.doStateTransition("DEFAULT", true)
        },
        hide: function(a) {
            this.panel.doStateTransition("HIDDEN", a);
            this.number.doStateTransition("HIDDEN", a)
        },
        animateChainNumber: function(a, b, c) {
            if (!this.timer) this.timer = new ig.WeightTimer(true);
            this.animating = true;
            this.timer.set(c ||
                0.2);
            this.initNumber = a || 0;
            this.targetNumber = b || 0
        },
        setChainNumber: function(a, b) {
            if (a >= 2) {
                this.show();
                this.number.setChainNumber(a);
                var c = 0.9 + Math.min(5, a) / 5 * 0.7;
                this.chainSound.play(false, {
                    speed: c
                })
            } else {
                this.pulsing = false;
                this.number.setPulse(false);
                this.hide(b)
            }
        },
        setPulse: function(a) {
            this.pulsing = a || false;
            this.number.setPulse(a)
        },
        rumble: function() {
            this.number.rumble()
        },
        _getCurrentNumber: function() {
            if (this.timer.done()) return this.targetNumber;
            var a = this.timer.get();
            return Math.floor((1 - a) * this.initNumber +
                a * this.targetNumber)
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
        init: function(a) {
            this.parent();
            this.setSize(39, 15);
            this.one = new sc.ArenaChainHud.Digit(a);
            this.one.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.addChildGui(this.one);
            this.ten = new sc.ArenaChainHud.Digit(a);
            this.ten.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.ten.setPos(13, 0);
            this.addChildGui(this.ten);
            this.hun = new sc.ArenaChainHud.Digit(a);
            this.hun.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.TOP);
            this.hun.setPos(26, 0);
            this.addChildGui(this.hun);
            this.setChainNumber(-1)
        },
        setChainNumber: function(a) {
            var b = Math.floor(a / 10) % 10;
            b <= 0 && (b = -1);
            var c = Math.floor(a / 100) % 10;
            c <= 0 && (c = -1);
            this.one.setDigit(a % 10);
            this.ten.setDigit(b);
            this.hun.setDigit(c)
        },
        setPulse: function(a) {
            this.one.setPulse(a);
            this.ten.setPulse(a);
            this.hun.setPulse(a)
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
        init: function(a) {
            this.parent();
            this.setSize(14, 15);
            this.setPivot(7, 7.5);
            this.rush =
                a || false
        },
        setDigit: function(a, b) {
            this.digit = a;
            if (this.digit < 0) {
                this.timer = 0;
                this.doStateTransition("HIDDEN", b)
            } else if (b) {
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
        setPulse: function(a) {
            this.pulsing = a || false;
            if (this.rumbleHandle && a) this.pulseAfter = true;
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
                var a = this.alphaTimer / 1,
                    a = KEY_SPLINES.EASE_IN_OUT.get(1 - (a > 0.5 ? 1 - (a - 0.5) * 2 : a * 2));
                this.alpha = a * 0.5
            }
            this.rumbleHandle && this.rumbleHandle.update();
            if (this.rumbleHandle && this.rumbleHandle.isDone()) {
                this.rumbleHandle = null;
                this.pulseAfter && this.setPulse(this.pulsing)
            }
        },
        updateDrawables: function(a) {
            if (this.digit >= 0) {
                var d = this.rumbleHandle ? this.rumbleHandle.offset : b;
                a.addGfx(this.gfx, d.x, d.y, this.digit * 13, this.rush ? 141 : 96, 13, 15);
                this.pulsing && a.addGfx(this.gfx, d.x, d.y, this.digit * 13, 126, 13, 15).setAlpha(this.alpha);
                this.timer > 0 && a.addGfx(this.gfx, d.x, d.y, this.digit * 13, 111, 13, 15).setAlpha(this.timer / 0.2)
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
        setChallengeMods: function(a) {
            this.hide(true);
            this.clearContent();
            var b = 0,
                c = new ig.GuiElementBase,
                e;
            for (e in a) {
                a = new sc.ArenaChallengeEntry(e, 260);
                if (b) {
                    var f = new ig.ColorGui("#545454", 270, 1);
                    f.setPos(-2, -3);
                    a.addChildGui(f)
                }
                a.setPos(0, b);
                c.addChildGui(a);
                b = b + a.hook.size.y
            }
            c.setSize(260, b - 4);
            this.pushContent(c)
        }
    })
});
ig.baked = !0;
