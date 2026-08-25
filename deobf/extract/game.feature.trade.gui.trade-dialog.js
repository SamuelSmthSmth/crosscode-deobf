ig.module("game.feature.trade.gui.trade-dialog").requires("game.feature.trade.trade-model", "impact.base.image", "impact.feature.gui.base.basic-gui", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.TradeItem = sc.ListBoxButton.extend({
        helperGfx: new ig.Image("media/gui/menu.png"),
        requiredGui: null,
        amount: null,
        crossGui: null,
        isTrade: false,
        required: 0,
        init: function(b, a, d, c, e, f, g) {
            this.parent(b, 142, 56, a, d);
            this.blockedSound = null;
            this.button.submitSound = null;
            this.isTrade = f || false;
            this.required = e || 0;
            this.crossGui = new ig.ImageGui(this.helperGfx, 136, 432, 5, 5);
            this.crossGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.crossGui.setPos(48, 9);
            this.addChildGui(this.crossGui);
            this.requiredGui = new sc.NumberGui(99);
            this.requiredGui.setNumber(this.required);
            this.requiredGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.requiredGui.setPos(30, 7);
            this.addChildGui(this.requiredGui);
            b = new ig.ImageGui(this.helperGfx, 136, 416, 3, 9);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(22, 6);
            this.addChildGui(b);
            b = new ig.ImageGui(this.helperGfx, 139, 416, 3, 9);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(1, 6);
            this.addChildGui(b);
            this.amount = new sc.NumberGui(99);
            this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.amount.setPos(5, 7);
            this.addChildGui(this.amount);
            this.updateTradeItem(c, e);
            this.setLevel(g)
        },
        updateTradeItem: function(b) {
            this.amount.setNumber(b || 0);
            if (this.isTrade) {
                if (b >= 99) {
                    this.crossGui.offsetY = 440;
                    this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.RED)
                }
            } else if (b >=
                this.required) {
                this.crossGui.offsetY = 432;
                this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.WHITE)
            } else {
                this.crossGui.offsetY = 440;
                this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.RED);
                this.setActive(false)
            }
        }
    });
    sc.TradeItemBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        dividerColor: null,
        init: function(b, a, d, c, e) {
            this.parent();
            this.hook.size.x = c;
            this.setContent(b, a, d, e)
        },
        updateDrawables: function(b) {
            var a = this.hook.size;
            b.addColor("#000", 0, 0, a.x, a.y);
            b.addColor(this.dividerColor || "#7E7E7E",
                0, 0, a.x, 1);
            b.addColor(this.dividerColor || "#7E7E7E", 0, a.y - 1, a.x, 1)
        },
        setContent: function(b, a, d, c) {
            this.removeAllChildren();
            var e = 2,
                f = 0,
                g = 0,
                h = 0,
                i = f = null,
                j = null,
                k = null,
                l = sc.inventory,
                o = sc.model.player;
            if (b)
                for (var m = 0; m < b.length; m++) {
                    h = b[m].id;
                    if (h != void 0) {
                        i = l.getItem(h);
                        f = b[m].amount || 0;
                        g = o.getItemAmountWithEquip(h);
                        new ig.LangLabel(i.name);
                        var j = "\\i[" + (i.icon + sc.inventory.getRaritySuffix(i.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(i.name),
                            k = ig.LangLabel.getText(i.description),
                            n = 0;
                        i.type ==
                            sc.ITEMS_TYPES.EQUIP && (n = i.level || 1);
                        f = new sc.TradeItem(j, h, k, g, f, c, n);
                        f.setPos(1, e);
                        if (this._isEquipped(h, i.equipType, o)) {
                            g = new ig.ImageGui(this.gfx, 112, 480, 19, 18);
                            f.addChildGui(g);
                            f.equipImage = g;
                            if (!c && o.getItemAmount(h) <= 0) {
                                sc.trade.hasEquippedTrade = true;
                                sc.trade.setEquippedID(h, i.equipType)
                            }
                        }
                        a && a.addFocusGui(f, 0, d);
                        d = d + 1;
                        e = e + (f.hook.size.y + 0);
                        this.addChildGui(f)
                    }
                } else e = 20;
            this.hook.size.y = e + 1;
            return e + 1
        },
        updateTradeItemButtons: function(b) {
            for (var a = this.hook.children, d = a.length, c = null, e = sc.model.player,
                    f = sc.inventory, g = -1; d--;) {
                c = a[d].gui;
                if (c.data && c.data.id != void 0) {
                    g = c.data.id;
                    c.updateTradeItem(e.getItemAmountWithEquip(g));
                    if (this._isEquipped(g, f.getItem(g).equipType, e)) {
                        if (!b && e.getItemAmount(g) <= 0) {
                            sc.trade.hasEquippedTrade = true;
                            sc.trade.setEquippedID(g, f.getItem(g).equipType)
                        }
                    } else if (c.equipImage) {
                        c.removeChildGui(c.equipImage);
                        c.equipImage = null
                    }
                }
            }
        },
        _isEquipped: function(b, a, d) {
            if (!a) return false;
            switch (a) {
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    return b == d.equip.head;
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    return b ==
                        d.equip.leftArm || b == d.equip.rightArm;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    return b == d.equip.torso;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    return b == d.equip.feet
            }
        }
    });
    sc.TradeMoneyGui = ig.GuiElementBase.extend({
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
        content: null,
        money: 0,
        credit: null,
        fee: null,
        current: null,
        dividerColor: null,
        init: function(b, a, d, c) {
            this.parent();
            this.setSize(223, 26 +
                (c ? 11 : 0));
            this.money = 0;
            if (d != void 0) {
                if (d == 0) {
                    this.doStateTransition("HIDDEN", true);
                    return
                }
                this.money = d || 1
            } else if (b) {
                for (d = b.length; d--;) this.money = this.money + sc.inventory.getItem(b[d].id).cost * (b[d].amount || 1);
                this.money = Math.floor((this.money || 1) * (a || 1))
            }
            b = 0;
            c && (b = 11);
            this.content = new ig.GuiElementBase;
            this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.setSize(142, 26 + b);
            this.addChildGui(this.content);
            a = new sc.TextGui(ig.lang.get("sc.gui.trade.fee"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(0, 4 + b);
            this.content.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.trade.rest"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(0, 15 + b);
            this.content.addChildGui(a);
            if (c) {
                a = new sc.TextGui(ig.lang.get("sc.gui.trade.credits"), {
                    font: sc.fontsystem.tinyFont
                });
                a.setPos(0, 4);
                this.content.addChildGui(a)
            }
            this.credit = new sc.NumberGui(99999999, {
                signed: true,
                transitionTime: 0.2
            });
            this.credit.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.credit.setNumber(sc.model.player.credit - this.money, true);
            sc.model.player.credit -
                this.money < 0 && this.credit.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.credit.setPos(14, 15 + b);
            this.content.addChildGui(this.credit);
            this.fee = new sc.NumberGui(99999999, {
                signed: true,
                transitionTime: 0.2
            });
            this.fee.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.fee.setNumber(-this.money, true);
            this.fee.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.fee.setPos(14, 4 + b);
            this.content.addChildGui(this.fee);
            if (c) {
                this.current = new sc.NumberGui(99999999, {
                    signed: true,
                    transitionTime: 0.2
                });
                this.current.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.current.setNumber(sc.model.player.credit, true);
                this.current.setPos(14, 4);
                this.content.addChildGui(this.current)
            }
            a = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(0, 3 + b);
            a = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(0, 14 + b);
            this.content.addChildGui(a);
            if (c) {
                a = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
                a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                a.setPos(0, 3);
                this.content.addChildGui(a)
            }
        },
        setContent: function(b, a, d, c) {
            this.money = 0;
            if (d != void 0) {
                if (d == 0) {
                    this.doStateTransition("HIDDEN", true);
                    return
                }
                this.money = d || 1
            } else {
                for (d = b.length; d--;) this.money = this.money + sc.inventory.getItem(b[d].id).cost * (b[d].amount || 1);
                this.money = (this.money || 1) * (a || 1)
            }
            this.updateValues();
            this.hook.pos.y = c;
            this.current && this.current.setNumber(sc.model.player.credit || 0, true);
            this.doStateTransition("DEFAULT", true)
        },
        updateValues: function() {
            this.credit.setNumber(sc.model.player.credit - this.money);
            sc.model.player.credit -
                this.money < 0 ? this.credit.setColor(sc.GUI_NUMBER_COLOR.RED) : this.credit.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.fee.setNumber(-this.money)
        },
        updateDrawables: function(b) {
            var a = this.hook.size;
            b.addColor("#000", 0, 0, a.x, a.y);
            b.addColor(this.dividerColor || "#7E7E7E", 0, 0, a.x, 1);
            b.addColor(this.dividerColor || "#7E7E7E", 0, a.y - 1, a.x, 1)
        }
    });
    sc.TradeDialogMenu = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -10
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 280
                }
            }
        }),
        buttongroup: null,
        tradeButton: null,
        getItems: null,
        requireItems: null,
        money: null,
        arrow: null,
        forText: null,
        ownedText: null,
        init: function() {
            this.parent(227, 100);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(8, 53);
            this.hook.localAlpha = 0.9;
            this.buttongroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttongroup.addSelectionCallback(this.onSelection.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                var b = sc.trade.getCurrentOffer().get[0];
                if (sc.inventory.isEquipID(b.id)) {
                    sc.trade.setEquipID(b.id);
                    sc.trade.setBuffText("", false);
                    sc.trade.setInfoText("", true)
                } else {
                    sc.trade.setInfoText("", true);
                    sc.trade.setBuffText("", true);
                    sc.trade.setEquipID(-1, true)
                }
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            this.parent(b)
        },
        onSelection: function(b) {
            var a = false;
            if (b.data) {
                if (b.data.id) {
                    if (sc.inventory.isBuffID(b.data.id)) {
                        sc.trade.setEquipID(-1);
                        sc.trade.setBuffText(sc.inventory.getBuffString(b.data.id), false, b.data.id)
                    } else if (sc.inventory.isEquipID(b.data.id)) {
                        sc.trade.setEquipID(b.data.id);
                        a = true
                    } else {
                        sc.trade.setEquipID(-1);
                        sc.trade.setBuffText("", false)
                    }
                    if (!a) {
                        var d = sc.trade.getCurrentOffer().get[0];
                        if (sc.inventory.isEquipID(d.id)) {
                            sc.trade.setEquipID(d.id);
                            sc.trade.setBuffText("", false)
                        }
                    }
                } else {
                    sc.trade.setEquipID(-1);
                    sc.trade.setBuffText("", false)
                }
                if (b.data.description) {
                    if (b.data.key == "trade" && !a) {
                        d = sc.trade.getCurrentOffer().get[0];
                        if (sc.inventory.isEquipID(d.id)) {
                            sc.trade.setEquipID(d.id);
                            sc.trade.setBuffText("", false)
                        }
                    }
                    sc.trade.setInfoText(b.data.description)
                }
            }
        },
        showMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            sc.Model.addObserver(sc.trade, this);
            this._createContent();
            sc.trade.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.trade.buttonInteract.addGlobalButton(this.tradeButton, this._onTradeButtonCheck.bind(this));
            this.arrow.doStateTransition("DEFAULT", false, false, null, 0.1);
            this.doStateTransition("DEFAULT")
        },
        hideMenu: function() {
            sc.Model.removeObserver(sc.trade,
                this);
            sc.trade.buttonInteract.removeButtonGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },
        doTrade: function() {
            if (sc.trade.canTrade())
                if (sc.trade.hasEquippedTrade) {
                    sc.BUTTON_SOUND.submit.play();
                    sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.trade.equipInfo"), sc.DIALOG_INFO_ICON.WARNING, function(b) {
                        if (b.data == 0) {
                            sc.BUTTON_SOUND.shop_cash.play();
                            sc.trade.unequipTradeItems();
                            sc.trade.doTrade(this.money.money);
                            this.requireItems.updateTradeItemButtons();
                            this.getItems.updateTradeItemButtons(true);
                            this.money.updateValues();
                            sc.trade.canTrade() || this.tradeButton.setActive(false)
                        } else sc.BUTTON_SOUND.back.play()
                    }.bind(this), true)
                } else {
                    sc.BUTTON_SOUND.shop_cash.play();
                    sc.trade.doTrade(this.money.money);
                    sc.trade.clearEquippedState();
                    this.requireItems.updateTradeItemButtons();
                    this.getItems.updateTradeItemButtons(true);
                    this.money.updateValues();
                    sc.trade.canTrade() || this.tradeButton.setActive(false)
                }
            else ig.error("Wat.")
        },
        modelChanged: function(b, a) {
            b == sc.trade && a == sc.TRADE_MODEL_EVENT.OFFER_CHANGED &&
                this._setOffer()
        },
        _onTradeButtonCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        _setOffer: function() {
            sc.trade.clearEquippedState();
            this.buttongroup.clear();
            var b = sc.trade.getCurrentOffer();
            this.buttongroup.addFocusGui(this.tradeButton, 0, 0);
            var a = 1,
                d, c = b.get;
            d = 17 + (this.getItems.setContent(c, this.buttongroup, a, true) + 10);
            this.arrow.setPos(6, 44 + (c.length - 1) * 20);
            this.forText.setPos(32, d - 7);
            this.ownedText.setPos(4, d - 7);
            a = a + c.length;
            c = b.require;
            this.requireItems.setPos(25, d);
            d = d + (this.requireItems.setContent(c,
                this.buttongroup, a) + 5);
            this.money.setContent(b.get, b.scale, b.cost, d);
            sc.trade.canTrade() ? this.tradeButton.setActive(true) : this.tradeButton.setActive(false);
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, true);
            this.setSize(227, 216);
            b = sc.trade.getCurrentOffer().get[0];
            if (sc.inventory.isEquipID(b.id)) {
                sc.trade.setEquipID(b.id);
                sc.trade.setBuffText("", false)
            }
            this.arrow.doStateTransition("HIDDEN", true);
            this.arrow.doStateTransition("DEFAULT")
        },
        _createContent: function() {
            var b = 10,
                a = new sc.TextGui(ig.lang.get("sc.gui.trade.trade"), {
                    font: sc.fontsystem.tinyFont
                });
            a.setPos(8, b);
            this.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(26, b);
            this.addChildGui(a);
            var b = b + 7,
                a = sc.trade.options[0],
                d = a.get,
                c = 1;
            this.getItems = new sc.TradeItemBox(d, this.buttongroup, c, 200, true);
            this.getItems.setPos(2, b);
            this.addChildGui(this.getItems);
            c = c + d.length;
            b =
                b + (this.getItems.hook.size.y + 3);
            this.forText = new sc.TextGui(ig.lang.get("sc.gui.trade.for"), {
                font: sc.fontsystem.tinyFont
            });
            this.forText.setPos(32, b);
            this.addChildGui(this.forText);
            this.ownedText = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            this.ownedText.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.ownedText.setPos(4, b);
            this.addChildGui(this.ownedText);
            b = b + 7;
            d = a.require;
            this.requireItems = new sc.TradeItemBox(d, this.buttongroup, c, 200);
            this.requireItems.setPos(25,
                b);
            this.addChildGui(this.requireItems);
            this.arrow = new ig.ImageGui(this.ninepatch.gfx, 432, 256, 16, 17);
            this.arrow.setPos(6, 44 + (a.get.length - 1) * 20);
            this.arrow.setPivot(16, 17);
            this.arrow.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        scaleX: 0.2,
                        scaleY: 0.5,
                        offsetY: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.arrow.doStateTransition("HIDDEN", true);
            this.addChildGui(this.arrow);
            b = b + (this.requireItems.hook.size.y + 5);
            this.money = new sc.TradeMoneyGui(a.get, a.scale ||
                1, a.cost);
            this.money.setPos(2, b);
            this.addChildGui(this.money);
            this.tradeButton = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.trade.trade"));
            this.tradeButton.setData({
                key: "trade",
                description: ig.lang.get("sc.gui.trade.description")
            });
            this.tradeButton.keepMouseFocus = true;
            this.tradeButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.tradeButton.setPos(0, 5);
            this.tradeButton.submitSound = null;
            this.tradeButton.onButtonPress = function() {
                this.doTrade()
            }.bind(this);
            this.addChildGui(this.tradeButton);
            this.buttongroup.addFocusGui(this.tradeButton, 0, 0);
            sc.trade.canTrade() || this.tradeButton.setActive(false);
            b = b + (this.tradeButton.hook.size.y + 5);
            this.setSize(227, 216)
        }
    });
    sc.TradeOfferDisplay = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    offsetY: -48
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        offerText: null,
        cycleLeft: null,
        cycleRight: null,
        offerToken: null,
        init: function() {
            this.parent();
            this.setSize(151, 21);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.setPos(44, 27);
            this.hook.localAlpha = 0.8;
            this.offerToken = ig.lang.get("sc.gui.trade.offer");
            this.offerText = new sc.TextGui("");
            this.offerText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.offerText);
            this.cycleLeft = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleLeft.keepMouseFocus = true;
            this.cycleLeft.setPos(-27, 0);
            this.cycleLeft.onButtonPress = function() {
                this._cycleOffers(-1)
            }.bind(this);
            this.addChildGui(this.cycleLeft);
            this.cycleRight = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleRight.keepMouseFocus = true;
            this.cycleRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cycleRight.setPos(-27, 0);
            this.cycleRight.onButtonPress = function() {
                this._cycleOffers(1)
            }.bind(this);
            this.addChildGui(this.cycleRight);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            b.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        showMenu: function() {
            if (!(sc.trade.options.length < 2)) {
                sc.trade.buttonInteract.addGlobalButton(this.cycleLeft,
                    this.onLeftPressCheck.bind(this));
                sc.trade.buttonInteract.addGlobalButton(this.cycleRight, this.onRightPressCheck.bind(this));
                this.offerText.setText(this.offerToken + " " + (sc.trade.tradeIndex + 1) + " / " + sc.trade.options.length);
                this.doStateTransition("DEFAULT")
            }
        },
        hideMenu: function() {
            sc.trade.options.length < 2 || this.doStateTransition("HIDDEN")
        },
        _cycleOffers: function(b) {
            var a = sc.trade.tradeIndex + b;
            b < 0 ? a < 0 && (a = sc.trade.options.length - 1) : b > 0 && a >= sc.trade.options.length && (a = 0);
            sc.trade.setActiveOffer(a);
            this.offerText.setText(this.offerToken +
                " " + (sc.trade.tradeIndex + 1) + " / " + sc.trade.options.length)
        },
        onLeftPressCheck: function() {
            return sc.control.menuCircleLeft()
        },
        onRightPressCheck: function() {
            return sc.control.menuCircleRight()
        }
    })
});
ig.baked = !0;
