ig.module("game.feature.menu.gui.item.item-status-trade").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default").defines(function() {
    sc.ItemStatusTrade = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        content: null,
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.item.availability"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(136, 264);
            this.setPos(sc.options.hdMode ? 25 : 2, 28);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(136 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.annotation = {
                size: {
                    x: this.hook.size.x + 2,
                    y: this.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.avail",
                    description: "sc.gui.menu.help.item.description.avail"
                },
                index: {
                    x: 0,
                    y: 3
                }
            };
            this.content = new ig.GuiElementBase;
            this.content.setSize(124, 140);
            this.content.setPos(1, 10);
            this.addChildGui(this.content);
            this.doStateTransition("HIDDEN",
                true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TRADE && this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(a, b, e) {
            a == sc.menu && (b == sc.MENU_EVENT.ITEM_CHANGED_TAB ? sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TRADE ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN") : b == sc.MENU_EVENT.ITEM_INFO_CHANGED ?
                this._setTradeInfo(e) : b == sc.MENU_EVENT.INFO_TEXT_CHANGED && (a.infoText || this._setTradeInfo()))
        },
        _setTradeInfo: function(a) {
            this.content.removeAllChildren();
            if (a) {
                var c = sc.inventory.getItem(a).sources;
                if (c && c.length != 0)
                    for (var e = 0, f = 0; f < c.length; f++) {
                        var g = c[f],
                            g = b[g.type] ? new b[g.type](g, a) : new sc.ItemStatusTrade.BaseEntryType(g, a);
                        g.setPos(0, e);
                        e = e + (g.hook.size.y + 1);
                        this.content.addChildGui(g)
                    }
            }
        }
    });
    var b = {},
        a = {
            ENEMY: 0,
            TRADER: 1,
            PLANT: 2,
            QUEST: 3,
            CHEST: 5,
            OTHER: 4
        };
    sc.ItemStatusTrade.BaseEntryType = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        tradeGfx: new ig.Image("media/gui/trade-types.png"),
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
        type: null,
        itemID: null,
        textEntry: null,
        subEntry: null,
        tradeIcon: null,
        init: function(b, c, e, f) {
            this.parent();
            this.setSize(134, 18);
            this.type = b.type || "NONE";
            this.itemID = c || 0;
            this.tradeIcon = new ig.ImageGui(this.tradeGfx, a[this.type] * 28, 0, 28, 18);
            this.addChildGui(this.tradeIcon);
            b = new ig.ImageGui(this.gfx, 81, 389, 95, 1);
            b.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(47, 0);
            this.addChildGui(b);
            b = new ig.ColorGui("#C7C7C7", 19, 1);
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(28, 0);
            this.addChildGui(b);
            this.textEntry = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont,
                maxWidth: f ? 0 : 103
            });
            this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.textEntry.setPos(30, 0);
            this.addChildGui(this.textEntry);
            this.subEntry = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont
            });
            this.subEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.subEntry.setPos(43, 9);
            this.addChildGui(this.subEntry);
            e && this.addArrow()
        },
        addArrow: function() {
            var a = new ig.ImageGui(this.gfx, 530, 210, 9, 8);
            a.setPos(32, 8);
            this.addChildGui(a)
        },
        setIcon: function(b) {
            this.tradeIcon.setImage(this.tradeGfx, a[b] * 28, 0, 28, 18)
        }
    });
    b.ENEMY = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a, b) {
            this.parent(a, b, true);
            var e = a.value,
                f = sc.stats.getMap("combat", "kill" + e);
            this.textEntry.setText(f >= 1 ? sc.combat.getEnemyName(e) : "???");
            this.subEntry.setText(f >= 1 ? sc.combat.getEnemyArea(e,
                true) : "???")
        }
    });
    b.TRADER = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a, b) {
            this.parent(a, b, true);
            var e = a.value,
                f = sc.trade.getFoundTrader(e);
            this.textEntry.setText(f ? sc.trade.getTraderName(e) : "???");
            this.subEntry.setText(f ? sc.trade.getTraderAreaName(e, true) : "???")
        }
    });
    b.PLANT = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a, b) {
            this.parent(a, b, true, true);
            var e = a.value,
                f = sc.menu.getFoundDrop(e);
            this.textEntry.setText(f ? sc.menu.getDropName(e) : "???");
            this.subEntry.setText(f ? sc.menu.getDropArea(e) :
                "???")
        }
    });
    b.QUEST = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a, b) {
            this.parent(a, b);
            this.textEntry.setText(sc.quests.getQuestName(a.value));
            this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
        }
    });
    b.CHEST = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a, b) {
            this.parent(a, b);
            var e = sc.map.getVisitedArea(a.value) || false;
            this.textEntry.setText(e ? sc.map.getAreaName(a.value) : "???");
            this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
        }
    });
    b.OTHER = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function(a,
            b) {
            this.parent(a, b);
            var e = a.value;
            this.textEntry.setText(ig.LangLabel.getText(e.text));
            e.icon && this.setIcon(e.icon);
            e.subText ? this.subEntry.setText(ig.LangLabel.getText(e.subText)) : this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            e.arrow && this.addArrow()
        }
    })
});
ig.baked = !0;
