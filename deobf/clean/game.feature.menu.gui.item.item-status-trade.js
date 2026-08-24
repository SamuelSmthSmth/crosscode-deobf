/**
 * game.feature.menu.gui.item.item-status-trade
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-status-trade")`.
 *
 * `sc.ItemStatusTrade`: the availability panel of the item menu (trade tab) —
 * lists every source of the hovered item (enemy drops, traders, plants,
 * quests, chests, other). `sc.ItemStatusTrade.BaseEntryType` renders one
 * source row with its trade-type icon; the TRADE_ENTRY_TYPES table maps each
 * source type to its specialized entry class.
 */
ig.module("game.feature.menu.gui.item.item-status-trade")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default")
    .defines(function () {

    sc.ItemStatusTrade = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        content: null,

        init: function () {
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
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TRADE && this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event, itemID) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TRADE ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")
                } else if (event == sc.MENU_EVENT.ITEM_INFO_CHANGED) {
                    this._setTradeInfo(itemID)
                } else if (event == sc.MENU_EVENT.INFO_TEXT_CHANGED) {
                    menu.infoText || this._setTradeInfo()
                }
            }
        },

        _setTradeInfo: function (itemID) {
            this.content.removeAllChildren();
            if (itemID) {
                var sources = sc.inventory.getItem(itemID).sources;
                if (sources && sources.length != 0) {
                    for (var posY = 0, index = 0; index < sources.length; index++) {
                        var source = sources[index],
                            entry = TRADE_ENTRY_TYPES[source.type] ? new TRADE_ENTRY_TYPES[source.type](source, itemID) : new sc.ItemStatusTrade.BaseEntryType(source, itemID);
                        entry.setPos(0, posY);
                        posY = posY + (entry.hook.size.y + 1);
                        this.content.addChildGui(entry)
                    }
                }
            }
        }
    });

    var TRADE_ENTRY_TYPES = {},
        TRADE_TYPE_ICONS = {
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

        init: function (source, itemID, addArrow, fullWidth) {
            this.parent();
            this.setSize(134, 18);
            this.type = source.type || "NONE";
            this.itemID = itemID || 0;
            this.tradeIcon = new ig.ImageGui(this.tradeGfx, TRADE_TYPE_ICONS[this.type] * 28, 0, 28, 18);
            this.addChildGui(this.tradeIcon);
            var gfx = new ig.ImageGui(this.gfx, 81, 389, 95, 1);
            gfx.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            gfx.setPos(47, 0);
            this.addChildGui(gfx);
            gfx = new ig.ColorGui("#C7C7C7", 19, 1);
            gfx.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            gfx.setPos(28, 0);
            this.addChildGui(gfx);
            this.textEntry = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont,
                maxWidth: fullWidth ? 0 : 103
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
            addArrow && this.addArrow()
        },

        addArrow: function () {
            var arrow = new ig.ImageGui(this.gfx, 530, 210, 9, 8);
            arrow.setPos(32, 8);
            this.addChildGui(arrow)
        },

        setIcon: function (type) {
            this.tradeIcon.setImage(this.tradeGfx, TRADE_TYPE_ICONS[type] * 28, 0, 28, 18)
        }
    });

    TRADE_ENTRY_TYPES.ENEMY = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID, true);
            var enemyID = source.value,
                kills = sc.stats.getMap("combat", "kill" + enemyID);
            this.textEntry.setText(kills >= 1 ? sc.combat.getEnemyName(enemyID) : "???");
            this.subEntry.setText(kills >= 1 ? sc.combat.getEnemyArea(enemyID, true) : "???")
        }
    });

    TRADE_ENTRY_TYPES.TRADER = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID, true);
            var traderID = source.value,
                found = sc.trade.getFoundTrader(traderID);
            this.textEntry.setText(found ? sc.trade.getTraderName(traderID) : "???");
            this.subEntry.setText(found ? sc.trade.getTraderAreaName(traderID, true) : "???")
        }
    });

    TRADE_ENTRY_TYPES.PLANT = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID, true, true);
            var plantID = source.value,
                found = sc.menu.getFoundDrop(plantID);
            this.textEntry.setText(found ? sc.menu.getDropName(plantID) : "???");
            this.subEntry.setText(found ? sc.menu.getDropArea(plantID) : "???")
        }
    });

    TRADE_ENTRY_TYPES.QUEST = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID);
            this.textEntry.setText(sc.quests.getQuestName(source.value));
            this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
        }
    });

    TRADE_ENTRY_TYPES.CHEST = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID);
            var visited = sc.map.getVisitedArea(source.value) || false;
            this.textEntry.setText(visited ? sc.map.getAreaName(source.value) : "???");
            this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
        }
    });

    TRADE_ENTRY_TYPES.OTHER = sc.ItemStatusTrade.BaseEntryType.extend({
        init: function (source, itemID) {
            this.parent(source, itemID);
            var data = source.value;
            this.textEntry.setText(ig.LangLabel.getText(data.text));
            data.icon && this.setIcon(data.icon);
            data.subText ? this.subEntry.setText(ig.LangLabel.getText(data.subText)) : this.textEntry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            data.arrow && this.addArrow()
        }
    })
});
ig.baked = !0;
