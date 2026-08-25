ig.module("game.feature.menu.gui.trade.trader-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.trade.trade-misc").defines(function() {
    var b = {
        trader: null,
        offer: void 0,
        index: 0
    };
    sc.TradersListBox = sc.ListTabbedPane.extend({
        submitSound: null,
        init: function() {
            this.parent(true);
            this.setSize(436, 258);
            this.setPivot(436, 258);
            this.setPanelSize(436, 242);
            this.setPos(0, 0);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 218
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.bg.setSize(this.hook.size.x, 222);
            var a = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            a.setPos(2, -8);
            this.bg.addChildGui(a);
            for (var a = sc.map.getUnlockedAreas(), a = sc.map.sortAreaList(a), b = 0, c = 0; c < a.length; c++) sc.trade.hasAreaTraders(a[c]) && sc.trade.hasTraderInArea(a[c]) && this.addTab(a[c], b++, {
                type: a[c]
            })
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function() {
            this.parent();
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.parent();
            this.doStateTransition("HIDDEN")
        },
        getCurrentSortText: function() {
            var a = null,
                a = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.TRADE_SORT_TYPE.ORDER : sc.TRADE_SORT_TYPE.ORDER,
                b = "auto";
            switch (a) {
                case sc.TRADE_SORT_TYPE.ORDER:
                    b = "auto";
                    break;
                case sc.TRADE_SORT_TYPE.FOUND:
                    b = "trader"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
        },
        onLeftRightPress: function(a, b) {
            b != this.currentTabIndex && this.submitSound.play();
            return {
                skipSounds: true
            }
        },
        onTabChanged: function() {
            (ig.input.mouseGuiActive ||
                this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },
        onTabButtonCreation: function(a, b, c) {
            b = sc.map.getAreaName(a, true);
            a = "area-" + a;
            sc.fontsystem.hasIcon(a) || (a = "enemy-abstract");
            a = new sc.ItemTabbedBox.TabButton(b, a, 128);
            a.textChild.setPos(7, 1);
            a.setPos(0, 2);
            a.setData({
                type: c.type
            });
            this.addChildGui(a);
            return a
        },
        onTabPressed: function(a, b) {
            if (!b) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(a));
                for (var c = this.tabArray.length; c--;)
                    if (a == this.tabArray[c]) {
                        sc.menu.setSynoTab(c);
                        break
                    } sc.menu.setSynopInfo(null,
                    true);
                return false
            }
        },
        onTabSelected: function() {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true)
        },
        onCreateListEntries: function(a, b, c, e) {
            var f = null,
                g = null,
                h = -1,
                i = null,
                j = g = null,
                c = sc.trade.getFoundTraders(c, e);
            a.setSize(436, 222);
            a.paddingBetween = 0;
            a.paddingTop = 2;
            a.clear();
            b.clear();
            if (a.traderInfoGui) a.traderInfoGui.removeAllChildren();
            else {
                a.traderInfoGui = new ig.GuiElementBase;
                a.box.insertChildGui(a.traderInfoGui, 0);
                a.forceLastScroll =
                    true
            }
            for (var e = 1, k = 0; k < c.length; k++) {
                i = c[k];
                if (!this.hasAnyUpgrades(i)) {
                    g = sc.trade.getTrader(i);
                    j = g.options;
                    g = new sc.TradeButtonBox(i, b, a.getChildren().length);
                    g.setPos(1, e);
                    a.traderInfoGui.addChildGui(g);
                    for (var l = 0, o = 0; o < j.length; o++) {
                        var m = j[o].get;
                        if (m[0]) {
                            var h = m[0].id,
                                f = m[0].amount,
                                m = sc.inventory.getItem(h),
                                n = sc.model.player.getItemAmountWithEquip(h),
                                p = sc.inventory.getItemNameWithIcon(h),
                                r = sc.inventory.getItemDescription(h),
                                t = 0;
                            m.type == sc.ITEMS_TYPES.EQUIP && (t = m.level || 0);
                            f = new sc.TradeEntryButton(p,
                                i, o, h, r, n, f, t);
                            a.addButton(f);
                            f.hook.pos.x = 234;
                            if (o == 0) f.hook.pos.y = e + 1
                        }
                        l = l + f.hook.size.y
                    }
                    g.hook.size.y = Math.max(l + 1, 44);
                    e = e + (g.hook.size.y + 2);
                    if (k != c.length - 1) {
                        i = new ig.ColorGui("#545454", 433, 1);
                        i.setPos(0, e - 1);
                        a.traderInfoGui.addChildGui(i)
                    } else e = e - 2;
                    e = e + 1
                }
            }
            a.traderInfoGui.hook.size.y = e;
            a.updateContentHeight()
        },
        hasAnyUpgrades: function(a) {
            a = sc.trade.getTrader(a);
            return a.child ? sc.trade.hasTrader(a.child) : false
        },
        onListEntrySelected: function(a) {
            if (a.offer != void 0) {
                if (a.trader) {
                    b.trader = a.trader;
                    b.offer =
                        a.offer;
                    b.index = a.hook.pos.y;
                    sc.menu.setSynopInfo(b)
                }
                a.data && a.data.description ? sc.menu.setInfoText(a.data.description) : sc.menu.setInfoText(null, true);
                sc.inventory.isBuffID(a.data.id) ? sc.menu.setBuffText(sc.inventory.getBuffString(a.data.id)) : sc.menu.setBuffText("", false)
            } else {
                sc.menu.setBuffText("", false);
                sc.menu.setSynopInfo(void 0);
                a.data && (a.data instanceof Object || sc.menu.setInfoText(a.data))
            }
        },
        onListEntryPressed: function(a) {
            if (a.trader && a.offer != void 0 && !sc.menu.tradeToggle) {
                this.submitSound.play();
                sc.menu.enterTradeDetails()
            }
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true);
            sc.menu.setBuffText("", false)
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu && b == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                sc.menu.setBuffText("", false);
                this.sort(c.data.sortType)
            }
        }
    })
});
ig.baked = !0;
