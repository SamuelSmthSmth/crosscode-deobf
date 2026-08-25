ig.module("game.feature.menu.gui.shop.shop-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "impact.feature.interact.press-repeater", "game.feature.gui.base.boxes", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.shop.shop-misc").defines(function() {
    sc.ShopListMenu = sc.MenuPanel.extend({
        buttongroup: null,
        pagesCache: [],
        list: null,
        repeater: null,
        _prevSortType: sc.SORT_TYPE.ORDER,
        _amp: 0,
        _ampTimer: 0,
        _ampDir: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.setSize(252, 241);
            this.setPos(5, 14);
            this.setPivot(126, 0);
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        alpha: 1
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -257
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.list = new sc.ItemListBox(1);
            this.list.quantity.setText(ig.lang.get("sc.gui.shop.cost"));
            this.list.quantity.setPos(60, 0);
            this.list.setSize(252, 230);
            this.list.setPos(0, 3);
            this.buttongroup = this.list.list.buttonGroup;
            this.buttongroup.addSelectionCallback(function(a) {
                if (a.data && a.data != 1) {
                    sc.menu.setInfoText(a.data.description ? a.data.description : a.data);
                    if (a.data.id) {
                        var b = sc.inventory.getItem(a.data.id);
                        b.equipType != void 0 ? sc.menu.setItemInfo(a.data.id) : sc.menu.resetItemInfo();
                        b.isBuff ? sc.menu.setBuffText(sc.inventory.getBuffString(a.data.id), false, a.data.id) : sc.menu.setBuffText("", false)
                    } else sc.menu.resetItemInfo()
                }
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("",
                    true);
                sc.menu.setBuffText("", true);
                sc.menu.resetItemInfo()
            }.bind(this));
            this.buttongroup.addPressCallback(this.onPressCallback.bind(this));
            this.buttongroup.isNonMouseMenuInput = function() {
                return sc.control.menuConfirm() || sc.control.downDown() || sc.control.upDown()
            }.bind(this);
            this.addChildGui(this.list);
            var b = new sc.TextGui(ig.lang.get("sc.gui.shop.owned"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(5, 0);
            this.list.addChildGui(b);
            this.repeater = new ig.PressRepeater;
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.buttongroup.isActive() && !ig.interact.isBlocked()) {
                if (this._ampTimer > 0) {
                    this._ampTimer = this._ampTimer - ig.system.actualTick;
                    if (this._ampTimer <= 0) this._amp = this._ampTimer = 0
                }
                switch (this.getRepeaterValue()) {
                    case "right":
                        this.stepRight();
                        break;
                    case "left":
                        this.stepLeft()
                }
            }
        },
        show: function() {
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.menu.shopSellMode ? this.list.quantity.setText(ig.lang.get("sc.gui.shop.price")) :
                this.list.quantity.setText(ig.lang.get("sc.gui.shop.cost"));
            sc.menu.shopPage = 0;
            this.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, sc.SORT_TYPE.ORDER);
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },
        getRepeaterValue: function() {
            sc.control.rightDown() ? this.repeater.setDown("right") : sc.control.leftDown() && this.repeater.setDown("left");
            return this.repeater.getPressed()
        },
        getActiveElement: function() {
            return ig.input.mouseGuiActive ? sc.menu.buttonInteract.mouseOverGui : this.buttongroup.getCurrentElement()
        },
        stepRight: function() {
            this.changeCount(1)
        },
        stepLeft: function() {
            this.changeCount(-1)
        },
        changeCount: function(b) {
            var a = this.getActiveElement();
            if (a && a.active && a.data && a.data.id) {
                var d = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99,
                    c = a.data.id,
                    e = a.price,
                    f = sc.menu.getItemQuantity(c, e),
                    d = sc.ShopHelper.getMaxBuyable(c, f, e, d);
                if (!(f == 0 && b == -1) && !(f == d && b == 1)) {
                    this.playSound(b,
                        true);
                    sc.menu.updateCart(c, f + b, e);
                    a.setCountNumber(f + b, f == 0);
                    this.updateListEntries()
                }
            }
        },
        playSound: function(b, a) {
            this._ampTimer = 0.3;
            if (this._ampDir != b) this._amp = 0;
            this._ampDir = b;
            this._amp = Math.min(0.2, this._amp + 0.04);
            b == 1 ? sc.BUTTON_SOUND.shop_up.play(null, {
                speed: 1 + (a ? this._amp : 0)
            }) : sc.BUTTON_SOUND.shop_down.play(null, {
                speed: 1 - (a ? this._amp : 0)
            })
        },
        updateListEntries: function(b) {
            for (var a = sc.model.player, d = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : a.credit, c = sc.menu.getTotalCost(), d = d - c, c = this.list.getChildren(),
                    e = c.length, f = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99; e--;) {
                var g = c[e].gui;
                if (!sc.menu.shopSellMode) {
                    var h = sc.menu.getItemQuantity(g.data.id, g.price);
                    a.getItemAmountWithEquip(g.data.id) >= f ? g.setActive(false) : !h && g.price > d ? g.setActive(false) : g.setActive(true)
                }
                if (b) {
                    g.setCountNumber(0, true);
                    g.owned.setNumber(sc.menu.shopSellMode ? a.getItemAmount(g.data.id) : a.getItemAmountWithEquip(g.data.id))
                }
            }
        },
        updateShopPage: function(b) {
            this.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive,
                b || sc.SORT_TYPE.ORDER)
        },
        createBuyList: function(b, a, d, c) {
            b = b || false;
            a = a || false;
            d = d || false;
            this._prevSortType = c = c || sc.SORT_TYPE.ORDER;
            this.buttongroup.clear();
            this.list.clear(b);
            var e = null,
                e = null;
            if (sc.menu.shopSellMode) {
                e = sc.SELL_PAGES[sc.menu.shopPage];
                e = e.type == "EQUIP" ? sc.model.player.getEquipSubList(e.equipType, false, c) : sc.model.player.getItemSubList(e.type, c)
            } else {
                e = ig.database.get("shops")[sc.menu.shopID].pages;
                e = ig.copy(e[sc.menu.shopPage].content);
                sc.ShopHelper.sortList(e, c)
            }
            sc.menu.shopSellMode ?
                this.scrapSellList(e) : this.scrapBuyList(e);
            if (b) {
                a ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, d);
                this.list.list.scrollToY(0, true)
            }
            this.getRepeaterValue()
        },
        scrapSellList: function(b) {
            for (var a = null, a = null, d = 0, c = 0, e = 0, f = c = 0; f < b.length; f++) {
                var e = b[f],
                    a = sc.inventory.getItem(e),
                    d = sc.model.player.getItemAmount(e),
                    c = Math.floor(a.cost / 2),
                    g = new ig.LangLabel(a.name),
                    g = "\\i[" + (a.icon + sc.inventory.getRaritySuffix(a.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(a.name),
                    h = ig.LangLabel.getText(a.description),
                    i = 0;
                a.type == sc.ITEMS_TYPES.EQUIP && (i = a.level || 1);
                a = new sc.ShopItemButton(g, e, h, d, c, i);
                c == 0 && a.setActive(false);
                c = sc.menu.getItemQuantity(e, c);
                c > 0 && a.setCountNumber(c, true);
                this.list.addButton(a)
            }
            this.getRepeaterValue()
        },
        scrapBuyList: function(b) {
            for (var a = null, d = null, c = 0, e = 0, f = 0, g = 0, h = sc.menu.shopCoinMode, i = (h ? sc.arena.getTotalArenaCoins() : sc.model.player.credit) - sc.menu.getTotalCost(), j = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99, k = 0; k < b.length; k++)
                if (!b[k].condition ||
                    (new ig.VarCondition(b[k].condition)).evaluate()) {
                    f = b[k].item;
                    d = sc.inventory.getItem(f);
                    c = sc.model.player.getItemAmountWithEquip(f);
                    a = 0;
                    d.type == sc.ITEMS_TYPES.EQUIP && (a = d.level || 1);
                    var e = b[k].price || (h ? d.coins : d.cost),
                        g = sc.menu.getItemQuantity(f, e),
                        l = new ig.LangLabel(d.name),
                        l = "\\i[" + (d.icon + sc.inventory.getRaritySuffix(d.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(d.name),
                        d = ig.LangLabel.getText(d.description),
                        a = new sc.ShopItemButton(l, f, d, c, e, a);
                    g > 0 && a.setCountNumber(g, true);
                    ig.database.get("shops")[sc.menu.shopID].maxOwn !=
                        void 0 && (c = sc.stats.getMap("items", f));
                    (i < e && !sc.menu.getItemQuantity(f, e) || c >= j) && a.setActive(false);
                    this.list.addButton(a)
                }
        },
        onPressCallback: function(b) {
            sc.menu.openShopQuantitySelect(b)
        },
        onBackButtonPress: function() {
            sc.menu.shopCart.length >= 1 ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.shop.leaveWithCartItems"), sc.DIALOG_INFO_ICON.WARNING, function(b) {
                b.data == 0 && this.leaveList()
            }.bind(this)) : this.leaveList()
        },
        leaveList: function() {
            sc.menu.popBackCallback();
            sc.menu.shopCart.length = 0;
            sc.menu.setShopState(sc.MENU_SHOP_STATE.START)
        }
    });
    sc.ShopPageCounter = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -257
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        pageText: null,
        cycleLeft: null,
        cycleRight: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(158, 21);
            this.setPos(52, 29);
            this.hook.localAlpha = 0.5;
            this.pageText = new sc.TextGui("");
            this.pageText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.pageText);
            this.cycleLeft = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleLeft.keepMouseFocus = true;
            this.cycleLeft.setPos(-27, 0);
            this.cycleLeft.onButtonPress = function() {
                sc.menu.shopSellMode ? this.cycleSellPages(-1) : this.cycleOffers(-1)
            }.bind(this);
            this.addChildGui(this.cycleLeft);
            this.cycleRight = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleRight.keepMouseFocus = true;
            this.cycleRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cycleRight.setPos(-27,
                0);
            this.cycleRight.onButtonPress = function() {
                sc.menu.shopSellMode ? this.cycleSellPages(1) : this.cycleOffers(1)
            }.bind(this);
            this.addChildGui(this.cycleRight);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            b.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        show: function() {
            sc.menu.buttonInteract.addGlobalButton(this.cycleLeft, this.onLeftPressCheck.bind(this), true);
            sc.menu.buttonInteract.addGlobalButton(this.cycleRight, this.onRightPressCheck.bind(this), true);
            this.doStateTransition("DEFAULT");
            var b = null;
            if (sc.menu.shopSellMode) {
                b = sc.SELL_PAGES;
                this.pageText.setText(ig.lang.get("sc.gui.shop.sellPages." + b[sc.menu.shopPage].lang))
            } else {
                b = ig.database.get("shops")[sc.menu.shopID].pages;
                this.pageText.setText(ig.LangLabel.getText(b[sc.menu.shopPage].title))
            }
            if (b.length == 1) {
                this.cycleLeft.setActive(false);
                this.cycleRight.setActive(false);
                this.cycleLeft.setText("\\i[arrow-left-off]");
                this.cycleRight.setText("\\i[arrow-right-off]")
            } else {
                this.cycleLeft.setActive(true);
                this.cycleRight.setActive(true);
                this.cycleLeft.setText("\\i[arrow-left]");
                this.cycleRight.setText("\\i[arrow-right]")
            }
        },
        hide: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.cycleLeft);
            sc.menu.buttonInteract.removeGlobalButton(this.cycleRight);
            this.doStateTransition("HIDDEN")
        },
        cycleSellPages: function(b) {
            var a = sc.SELL_PAGES,
                d = sc.menu.shopPage + b;
            b < 0 ? d < 0 && (d = a.length - 1) : b > 0 && d >= a.length && (d = 0);
            sc.menu.setShopPage(d);
            this.pageText.setText(ig.lang.get("sc.gui.shop.sellPages." + a[sc.menu.shopPage].lang))
        },
        cycleOffers: function(b) {
            var a =
                ig.database.get("shops")[sc.menu.shopID].pages;
            if (a.length != 1) {
                var d = sc.menu.shopPage + b;
                b < 0 ? d < 0 && (d = a.length - 1) : b > 0 && d >= a.length && (d = 0);
                sc.menu.setShopPage(d);
                this.pageText.setText(ig.LangLabel.getText(a[sc.menu.shopPage].title))
            }
        },
        onLeftPressCheck: function() {
            return sc.control.menuCircleLeft()
        },
        onRightPressCheck: function() {
            return sc.control.menuCircleRight()
        }
    });
    sc.ShopItemButton = sc.ListBoxButton.extend({
        symbolGfx: new ig.Image("media/gui/menu.png"),
        cost: null,
        owned: null,
        count: null,
        symbol: null,
        level: 0,
        init: function(b, a, d, c, e, f) {
            this.parent(b, 142, 106, a, d);
            this.price = e || 0;
            this.level = f || 0;
            this.owned = new sc.NumberGui(99, {
                transitionTime: 0.1
            });
            this.owned.setNumber(c, true);
            this.owned.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.owned.setPos(4, 7);
            this.addChildGui(this.owned);
            this.cost = new sc.NumberGui(999999);
            this.cost.setNumber(e, true);
            this.cost.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cost.setPos(54, 7);
            this.addChildGui(this.cost);
            this.count = new sc.NumberGui(99, {
                noZero: true,
                transitionTime: 0.1
            });
            this.count.setColor(sc.GUI_NUMBER_COLOR.GREEN);
            this.count.setNumber(0, true);
            this.count.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.count.setPos(28, 7);
            this.addChildGui(this.count);
            this.symbol = new ig.ImageGui(this.symbolGfx, 136, 448, 6, 6);
            this.symbol.hook.transitions = {
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
            this.symbol.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.symbol.setPos(46, 8);
            this.addChildGui(this.symbol);
            this.symbol.doStateTransition("HIDDEN", true);
            this.setLevel(f)
        },
        setCountNumber: function(b, a) {
            this.count.setNumber(b, a);
            b >= 1 ? this.symbol.doStateTransition("DEFAULT", true, false) : this.symbol.doStateTransition("HIDDEN", true)
        },
        keepButtonPressed: function() {
            this.keepPressed = true;
            this.setPressed(true);
            this.button.keepPressed = true;
            this.button.setPressed(true)
        },
        unPressButton: function() {
            this.keepPressed = false;
            this.setPressed(false);
            this.button.keepPressed = false;
            this.button.setPressed(false)
        }
    })
});
ig.baked = !0;
