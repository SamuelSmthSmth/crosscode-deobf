ig.module("game.feature.trade.gui.trade-menu").requires("game.feature.trade.trade-model", "impact.base.image", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc", "game.feature.trade.gui.trade-dialog", "game.feature.trade.gui.equip-toggle-stats").defines(function() {
    sc.TradeMenu = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        info: null,
        buffInfo: null,
        topbar: null,
        back: null,
        help: null,
        toggleEquip: null,
        helpGui: null,
        tradeDialog: null,
        tradeOffer: null,
        tradeStats: null,
        tradeContent: null,
        money: null,
        moneyValue: null,
        init: function(trader) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.hook.zIndex = 1180;
            this.hook.pauseGui = true;
            this.tradeContent = trader.options || null;
            this.tradeDialog = new sc.TradeDialogMenu;
            this.addChildGui(this.tradeDialog);
            this.tradeOffer = new sc.TradeOfferDisplay;
            this.addChildGui(this.tradeOffer);
            this.tradeStats = new sc.TradeToggleStats;
            this.addChildGui(this.tradeStats);
            this.info = new sc.InfoBar;
            this.info.alpha = 1;
            this.info.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -21
                    },
                    time: 0.3,
                    timeFunction: KEY_SPLINES.EASE_IN
                }
            };
            this.info.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.info);
            this.topbar = new ig.ColorGui("#000000", ig.system.width, 21);
            this.topbar.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -21
                    },
                    time: 0.3,
                    timeFunction: KEY_SPLINES.EASE_IN
                }
            };
            this.topbar.doStateTransition("HIDDEN", true);
            this.addChildGui(this.topbar);
            this.money = new ig.GuiElementBase;
            this.money.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -21
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.money.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.money.setSize(125, 21);
            this.money.setPos(144, 0);
            this.moneyValue = new sc.NumberGui(99999999, {
                transitionTime: 0.2
            });
            this.moneyValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.moneyValue.setNumber(sc.model.player.credit, true);
            this.moneyValue.setPos(14, 7);
            this.money.addChildGui(this.moneyValue);
            trader = new sc.TextGui(ig.lang.get("sc.gui.trade.credits"), {
                font: sc.fontsystem.tinyFont
            });
            trader.setPos(0, 7);
            this.money.addChildGui(trader);
            trader = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
            trader.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            trader.setPos(0, 6);
            this.money.addChildGui(trader);
            this.addChildGui(this.money);
            this.money.doStateTransition("HIDDEN",
                true);
            this.buffInfo = new sc.BuffInfo;
            this.info.addChildGui(this.buffInfo);
            this.buffInfo.text.annotation.offset.x = -1;
            this.buffInfo.text.annotation.offset.y = -4;
            this.buffInfo.text.isHelpVisible = function() {
                return sc.trade.buffText
            };
            trader = new sc.ButtonGui("\\i[back]" + ig.lang.get("sc.gui.menu.back"), sc.BUTTON_TOP_MENU_WIDTH, true, sc.BUTTON_TYPE.SMALL, sc.BUTTON_SOUND.back);
            trader.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetX: -sc.BUTTON_TOP_MENU_WIDTH
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            trader.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            trader.onButtonPress = function() {
                this._exitMenu()
            }.bind(this);
            trader.setData({
                description: ig.lang.get("sc.gui.trade.end")
            });
            trader.doStateTransition("HIDDEN", true);
            this.backButton = trader;
            this.addChildGui(this.backButton);
            trader = new sc.ButtonGui("\\i[help4]" + ig.lang.get("sc.gui.trade.toggle"), null, true, sc.BUTTON_TYPE.SMALL);
            trader.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -sc.BUTTON_TYPE.SMALL.height
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            trader.submitSound = null;
            trader.onButtonPress = function() {
                if (sc.trade.equipID >= 0) {
                    sc.BUTTON_SOUND.submit.play();
                    sc.trade.toggleCompareMode()
                }
            }.bind(this);
            trader.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            trader.keepMouseFocus = true;
            trader.setPos(73, 0);
            trader.setData({
                description: ig.lang.get("sc.gui.trade.toggleDes")
            });
            trader.doStateTransition("HIDDEN", true);
            this.toggleEquip = trader;
            trader = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
            trader.keepMouseFocus = true;
            trader.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -trader.hook.size.x
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            trader.onButtonPress = this._onHelpButtonPressed.bind(this);
            trader.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            trader.setPos(73, 0);
            trader.doStateTransition("HIDDEN", true);
            this.help = trader;
            this.addChildGui(this.help);
            this.money.setPos(this.help.hook.size.x + this.backButton.hook.size.x + 12, 0)
        },
        enterTrade: function() {
            sc.Model.removeObserver(sc.trade, this);
            sc.Model.addObserver(sc.trade, this);
            sc.trade.enterTrade(this.tradeContent);
            sc.trade.buttonInteract.clearAllButtons();
            sc.trade.buttonInteract.addGlobalButton(this.backButton, this._onBackButtonCheck.bind(this));
            sc.trade.buttonInteract.addGlobalButton(this.help, this._onHelpButtonCheck.bind(this));
            sc.trade.buttonInteract.addGlobalButton(this.toggleEquip, this._onToggleButtonCheck.bind(this));
            this.tradeDialog.showMenu();
            this.tradeOffer.showMenu();
            this.tradeStats.showMenu();
            this.buffInfo.setText("");
            this.doStateTransition("DEFAULT", true);
            this.info.doStateTransition("DEFAULT");
            this.topbar.doStateTransition("DEFAULT");
            this.backButton.doStateTransition("DEFAULT");
            this.help.doStateTransition("DEFAULT");
            this.money.doStateTransition("DEFAULT");
            var firstItem = sc.trade.getCurrentOffer().get[0];
            if (sc.inventory.isEquipID(firstItem.id)) {
                sc.trade.setEquipID(firstItem.id);
                sc.trade.setBuffText("", false)
            }
        },
        _onHelpButtonCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        _onHelpButtonPressed: function() {
            this.help.doStateTransition("HIDDEN");
            this.money.doStateTransition("HIDDEN");
            this._createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },
        _onBackButtonCheck: function() {
            return sc.control.menuBack()
        },
        _onToggleButtonCheck: function() {
            return sc.control.menuHotkeyHelp4()
        },
        _createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.trade.title"), ig.lang.get("sc.gui.menu.help-texts.trade.pages"), function() {
                    this.help.doStateTransition("DEFAULT", false, false, null, 0.2);
                    this.money.doStateTransition("DEFAULT", false, false, null, 0.2)
                }.bind(this));
                this.helpGui.hook.zIndex =
                    15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        _exitMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            this.tradeDialog.hideMenu();
            this.tradeOffer.hideMenu();
            this.tradeStats.hideMenu();
            sc.model.enterRunning();
            sc.trade.buttonInteract.clearAllButtons();
            sc.trade.exitTrade();
            this.helpGui = null;
            ig.interact.setBlockDelay(0.2);
            this.backButton.doStateTransition("HIDDEN");
            this.help.doStateTransition("HIDDEN");
            this.info.doStateTransition("HIDDEN");
            this.topbar.doStateTransition("HIDDEN");
            this.money.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true)
        },
        modelChanged: function(model, msg, data) {
            model == sc.trade && (msg == sc.TRADE_MODEL_EVENT.INFO_TEXT_CHANGED ? this.info.setText(sc.trade.infoText, data ? 0.5 : 0) : msg == sc.TRADE_MODEL_EVENT.BUFF_TEXT_CHANGED ? this.buffInfo.setText(sc.trade.buffText, data ? 0.5 : 0) : msg == sc.TRADE_MODEL_EVENT.TRADED && this.moneyValue.setNumber(sc.model.player.credit))
        }
    })
});
ig.baked = !0;
