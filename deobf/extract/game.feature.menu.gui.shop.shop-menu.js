ig.module("game.feature.menu.gui.shop.shop-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.shop.shop-start", "game.feature.menu.gui.shop.shop-list", "game.feature.menu.gui.shop.shop-stats", "game.feature.menu.gui.shop.shop-cart", "game.feature.menu.gui.shop.shop-quantity", "game.feature.menu.gui.shop.shop-confirm", "game.feature.control.control").defines(function() {
    sc.ShopMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeySort: null,
        hotkeySwitch: null,
        shopName: null,
        start: null,
        shopList: null,
        pageView: null,
        stats: null,
        cart: null,
        quantity: null,
        confirmDialog: null,
        sortMenu: null,
        helpGui: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyHelp.keepMouseFocus = true;
            this.hotkeyHelp.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyHelp.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyHelp.onButtonPress = this.onHelpButtonPressed.bind(this);
            this.hotkeySort = new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeySort.keepMouseFocus = true;
            this.hotkeySort.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeySort.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeySort.onButtonPress = this.onSortButtonPress.bind(this);
            this.hotkeySwitch = new sc.ButtonGui("", null, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeySwitch.keepMouseFocus = true;
            this.hotkeySwitch.submitSound = null;
            this.hotkeySwitch.onButtonPress = function() {
                if (sc.trade.equipID >= 0) {
                    sc.BUTTON_SOUND.submit.play();
                    sc.trade.toggleCompareMode();
                    this.stats.updateStatsView()
                }
            }.bind(this);
            this.shopName = new sc.ShopStartTitle;
            this.addChildGui(this.shopName);
            this.start = new sc.ShopStartMenu;
            this.addChildGui(this.start);
            this.shopList = new sc.ShopListMenu;
            this.addChildGui(this.shopList);
            this.pageView = new sc.ShopPageCounter;
            this.addChildGui(this.pageView);
            this.stats = new sc.ShopEquipStats;
            this.addChildGui(this.stats);
            this.cart = new sc.ShopCart;
            this.addChildGui(this.cart);
            this.quantity = new sc.ShopQuantitySelect(this.onQuantitySubmit.bind(this), this.onQuantityBack.bind(this));
            this.confirmDialog = new sc.ShopConfirmDialog(this.onConfirm.bind(this));
            this.sortMenu = new sc.SortMenu(this.onExecuteSort.bind(this));
            this.sortMenu.addButton("auto",
                sc.SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("name", sc.SORT_TYPE.NAME, 1);
            this.sortMenu.addButton("rarity", sc.SORT_TYPE.RARITY, 2);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            if (sc.menu.shopCoinMode) {
                sc.arena._validateCoins();
                sc.menu.shopState =
                    sc.MENU_SHOP_STATE.BUY;
                this.resolveStateChange(null, true)
            } else {
                this.start.show();
                this.shopName.show()
            }
            this.updateSortMenuButton(ig.lang.get("sc.gui.menu.sort.auto"));
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys()
        },
        hideMenu: function() {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySwitch);
            this.helpGui = null;
            this.start.hide();
            this.shopName.hide();
            this.shopList.hide();
            this.stats.hide();
            this.cart.hide();
            sc.trade.compareMode = sc.TRADE_COMPARE_MODE.EQUIP;
            sc.party.updateEquipment();
            this.sortMenu.active && this.sortMenu.hideSortMenu();
            this.quantity.active && this.quantity.hide()
        },
        openQuantitySelect: function(b) {
            this.hotkeySort.setActive(false);
            this.cart.setCheckout(false);
            ig.gui.addGuiElement(this.quantity);
            var a = b.hook.screenCoords,
                d = a.x,
                c = a.y + a.h - 2,
                e = this.quantity.hook;
            if (c + e.size.y > ig.system.height -
                28) {
                c = a.y - e.size.y + 1;
                this.quantity.setPivot(e.size.x / 2, e.size.y)
            } else this.quantity.setPivot(e.size.x / 2, 0);
            b.keepButtonPressed();
            this.quantity.show(b, d, c)
        },
        updateSortMenuButton: function(b) {
            var a = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
            this.hotkeySort.setText(a + ("\\c[3]" + b + "\\c[0]"));
            sc.menu.updateHotkeys()
        },
        resolveStateChange: function(b, a) {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySwitch);
            this.hotkeySort.doStateTransition("HIDDEN");
            sc.menu.shopSellMode = false;
            switch (sc.menu.shopState) {
                case sc.MENU_SHOP_STATE.START:
                    this.pageView.hide();
                    this.shopList.hide();
                    this.cart.hide();
                    this.stats.hide();
                    this.start.show();
                    this.shopName.show();
                    break;
                case sc.MENU_SHOP_STATE.BUY:
                    sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this), true);
                    sc.menu.buttonInteract.addGlobalButton(this.hotkeySwitch, this.onHotkeySwitchCheck.bind(this), true);
                    this.hotkeySort.doStateTransition("DEFAULT");
                    this.start.hide(true, a);
                    this.shopName.hide(true,
                        a);
                    this.shopList.show();
                    this.pageView.show();
                    this.stats.show();
                    this.cart.show();
                    break;
                case sc.MENU_SHOP_STATE.SELL:
                    sc.menu.shopSellMode = true;
                    sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this), true);
                    sc.menu.buttonInteract.addGlobalButton(this.hotkeySwitch, this.onHotkeySwitchCheck.bind(this), true);
                    this.hotkeySort.doStateTransition("DEFAULT");
                    this.start.hide(true);
                    this.shopName.hide(true);
                    this.shopList.show();
                    this.pageView.show();
                    this.stats.show();
                    this.cart.show()
            }
        },
        onConfirm: function() {
            var b = sc.menu.shopSellMode ? this.sellItems() : this.buyItems();
            sc.menu.shopCart.length = 0;
            b ? this.shopList.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, this.shopList._prevSortType) : this.shopList.updateListEntries(true);
            this.cart.resetNumbers()
        },
        buyItems: function() {
            var b = sc.menu.getTotalCost(),
                a = sc.model.player;
            sc.menu.shopCoinMode ? sc.arena.removeArenaCoins(b) : a.removeCredit(b, true);
            for (var b = sc.menu.shopCart, d = b.length; d--;) {
                a.addItem(b[d].id, b[d].amount, true);
                sc.stats.addMap("items", "buy", b[d].amount)
            }
            return false
        },
        sellItems: function() {
            var b = sc.menu.getTotalCost(),
                a = sc.model.player;
            a.addCredit(b, true);
            for (var b = sc.menu.shopCart, d = b.length, c = false; d--;) {
                a.removeItem(b[d].id, b[d].amount);
                sc.stats.addMap("items", "sell", b[d].amount);
                a.getItemAmount(b[d].id) <= 0 && !c && (c = true)
            }
            return c
        },
        onQuantitySubmit: function(b, a) {
            sc.menu.updateCart(b.data.id, a, b.price);
            this.onQuantityBack(b);
            this.cart.setCheckout(true);
            this.shopList.updateListEntries()
        },
        onQuantityBack: function(b) {
            this.cart.setCheckout(true);
            this.hotkeySort.setActive(true);
            b.unPressButton()
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },
        onHotkeySortCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onHotkeySwitchCheck: function() {
            return sc.control.menuHotkeyHelp4()
        },
        onSortButtonPress: function() {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu.showSortMenu(this.hotkeySort)
            }
        },
        onExecuteSort: function(b) {
            if (b.data) {
                this.sortMenu.hideSortMenu();
                sc.menu.sortList(b)
            }
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.shop.title"), ig.lang.get("sc.gui.menu.help-texts.shop.pages"), function() {
                    this.commitHotKeysToTopBar(true);
                    if (sc.menu.shopState == sc.MENU_SHOP_STATE.START) {
                        this.hotkeySort.startHidden = true;
                        this.hotkeySort.doStateTransition("HIDDEN", true)
                    } else this.hotkeySort.startHidden =
                        false
                }.bind(this));
                this.helpGui.addons.push(sc.menu.guiReference.buffInfo);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.commitHotKeysToTopBar(b);
            this.hotkeySort.doStateTransition("HIDDEN", true)
        },
        commitHotKeysToTopBar: function(b) {
            sc.menu.addHotkey(function() {
                return this.hotkeySort
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(b)
        },
        onBackButtonPress: function() {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.SHOP_STATE_CHANGED) this.resolveStateChange(d);
                else if (a == sc.MENU_EVENT.SORT_LIST) {
                this.updateSortMenuButton(d.text);
                this.shopList.updateShopPage(d.data.sortType)
            } else if (a == sc.MENU_EVENT.SHOP_PAGE_CHANGED) {
                this.updateSortMenuButton(ig.lang.get("sc.gui.menu.sort.auto"));
                this.shopList.updateShopPage()
            } else if (a == sc.MENU_EVENT.ITEM_INFO_CHANGED) {
                sc.trade.setEquipID(d);
                this.stats.updateStatsView()
            } else if (a == sc.MENU_EVENT.ITEM_RESET_INFO) {
                sc.trade.setEquipID(-1);
                this.stats.reset()
            } else if (a == sc.MENU_EVENT.SHOP_OPEN_QUANTITY) this.openQuantitySelect(d);
            else if (a == sc.MENU_EVENT.SHOP_CART_CHANGED) this.cart.updateValue(d);
            else if (a == sc.MENU_EVENT.SHOP_OPEN_CHECKOUT) {
                ig.gui.addGuiElement(this.confirmDialog);
                this.confirmDialog.show()
            }
        }
    })
});
ig.baked = !0;
