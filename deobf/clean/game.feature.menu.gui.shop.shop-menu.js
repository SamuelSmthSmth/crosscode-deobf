/**
 * game.feature.menu.gui.shop.shop-menu
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.shop.shop-menu")`.
 *
 * `sc.ShopMenu`: the shop submenu container (`sc.BaseMenu`) — wires the
 * buy/sell state machine (start chooser → list/page/stats/cart), the
 * sort menu + hotkeys (help / sort / compare-switch), the quantity
 * selector popup, and the buy/sell confirm dialog with credit/coin
 * transactions.
 */
ig.module("game.feature.menu.gui.shop.shop-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.shop.shop-start", "game.feature.menu.gui.shop.shop-list", "game.feature.menu.gui.shop.shop-stats", "game.feature.menu.gui.shop.shop-cart", "game.feature.menu.gui.shop.shop-quantity", "game.feature.menu.gui.shop.shop-confirm", "game.feature.control.control")
    .defines(function () {

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

        init: function () {
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
            this.hotkeySwitch.onButtonPress = function () {
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
            this.sortMenu.addButton("auto", sc.SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("name", sc.SORT_TYPE.NAME, 1);
            this.sortMenu.addButton("rarity", sc.SORT_TYPE.RARITY, 2);
            this.doStateTransition("DEFAULT")
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            if (sc.menu.shopCoinMode) {
                sc.arena._validateCoins();
                sc.menu.shopState = sc.MENU_SHOP_STATE.BUY;
                this.resolveStateChange(null, true)
            } else {
                this.start.show();
                this.shopName.show()
            }
            this.updateSortMenuButton(ig.lang.get("sc.gui.menu.sort.auto"));
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys()
        },

        hideMenu: function () {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },

        exitMenu: function () {
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

        openQuantitySelect: function (button) {
            this.hotkeySort.setActive(false);
            this.cart.setCheckout(false);
            ig.gui.addGuiElement(this.quantity);
            var screen = button.hook.screenCoords,
                x = screen.x,
                y = screen.y + screen.h - 2,
                hook = this.quantity.hook;
            if (y + hook.size.y > ig.system.height - 28) {
                y = screen.y - hook.size.y + 1;
                this.quantity.setPivot(hook.size.x / 2, hook.size.y)
            } else this.quantity.setPivot(hook.size.x / 2, 0);
            button.keepButtonPressed();
            this.quantity.show(button, x, y)
        },

        updateSortMenuButton: function (sortName) {
            var label = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
            this.hotkeySort.setText(label + ("\\c[3]" + sortName + "\\c[0]"));
            sc.menu.updateHotkeys()
        },

        resolveStateChange: function (state, immediate) {
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
                    this.start.hide(true, immediate);
                    this.shopName.hide(true, immediate);
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

        onConfirm: function () {
            var needsRefresh = sc.menu.shopSellMode ? this.sellItems() : this.buyItems();
            sc.menu.shopCart.length = 0;
            needsRefresh ? this.shopList.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, this.shopList._prevSortType) : this.shopList.updateListEntries(true);
            this.cart.resetNumbers()
        },

        buyItems: function () {
            var totalCost = sc.menu.getTotalCost(),
                player = sc.model.player;
            sc.menu.shopCoinMode ? sc.arena.removeArenaCoins(totalCost) : player.removeCredit(totalCost, true);
            for (var cart = sc.menu.shopCart, i = cart.length; i--;) {
                player.addItem(cart[i].id, cart[i].amount, true);
                sc.stats.addMap("items", "buy", cart[i].amount)
            }
            return false
        },

        sellItems: function () {
            var totalCost = sc.menu.getTotalCost(),
                player = sc.model.player;
            player.addCredit(totalCost, true);
            for (var cart = sc.menu.shopCart, i = cart.length, emptied = false; i--;) {
                player.removeItem(cart[i].id, cart[i].amount);
                sc.stats.addMap("items", "sell", cart[i].amount);
                player.getItemAmount(cart[i].id) <= 0 && !emptied && (emptied = true)
            }
            return emptied
        },

        onQuantitySubmit: function (button, amount) {
            sc.menu.updateCart(button.data.id, amount, button.price);
            this.onQuantityBack(button);
            this.cart.setCheckout(true);
            this.shopList.updateListEntries()
        },

        onQuantityBack: function (button) {
            this.cart.setCheckout(true);
            this.hotkeySort.setActive(true);
            button.unPressButton()
        },

        onHotkeyHelpCheck: function () {
            return sc.control.menuHotkeyHelp()
        },

        onHelpButtonPressed: function () {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },

        onHotkeySortCheck: function () {
            return sc.control.menuHotkeyHelp3()
        },

        onHotkeySwitchCheck: function () {
            return sc.control.menuHotkeyHelp4()
        },

        onSortButtonPress: function () {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu.showSortMenu(this.hotkeySort)
            }
        },

        onExecuteSort: function (button) {
            if (button.data) {
                this.sortMenu.hideSortMenu();
                sc.menu.sortList(button)
            }
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.shop.title"), ig.lang.get("sc.gui.menu.help-texts.shop.pages"), function () {
                    this.commitHotKeysToTopBar(true);
                    if (sc.menu.shopState == sc.MENU_SHOP_STATE.START) {
                        this.hotkeySort.startHidden = true;
                        this.hotkeySort.doStateTransition("HIDDEN", true)
                    } else this.hotkeySort.startHidden = false
                }.bind(this));
                this.helpGui.addons.push(sc.menu.guiReference.buffInfo);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        onAddHotkeys: function (commitToTopBar) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.commitHotKeysToTopBar(commitToTopBar);
            this.hotkeySort.doStateTransition("HIDDEN", true)
        },

        commitHotKeysToTopBar: function (commitToTopBar) {
            sc.menu.addHotkey(function () {
                return this.hotkeySort
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(commitToTopBar)
        },

        onBackButtonPress: function () {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu)
                if (event == sc.MENU_EVENT.SHOP_STATE_CHANGED) this.resolveStateChange(data);
                else if (event == sc.MENU_EVENT.SORT_LIST) {
                this.updateSortMenuButton(data.text);
                this.shopList.updateShopPage(data.data.sortType)
            } else if (event == sc.MENU_EVENT.SHOP_PAGE_CHANGED) {
                this.updateSortMenuButton(ig.lang.get("sc.gui.menu.sort.auto"));
                this.shopList.updateShopPage()
            } else if (event == sc.MENU_EVENT.ITEM_INFO_CHANGED) {
                sc.trade.setEquipID(data);
                this.stats.updateStatsView()
            } else if (event == sc.MENU_EVENT.ITEM_RESET_INFO) {
                sc.trade.setEquipID(-1);
                this.stats.reset()
            } else if (event == sc.MENU_EVENT.SHOP_OPEN_QUANTITY) this.openQuantitySelect(data);
            else if (event == sc.MENU_EVENT.SHOP_CART_CHANGED) this.cart.updateValue(data);
            else if (event == sc.MENU_EVENT.SHOP_OPEN_CHECKOUT) {
                ig.gui.addGuiElement(this.confirmDialog);
                this.confirmDialog.show()
            }
        }
    })
});
ig.baked = !0;
