ig.module("game.feature.menu.gui.item.item-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.item.item-status-equip", "game.feature.menu.gui.item.item-status-default", "game.feature.menu.gui.item.item-status-buffs", "game.feature.menu.gui.item.item-status-favs", "game.feature.menu.gui.item.item-status-trade", "game.feature.menu.gui.item.item-list").defines(function() {
    sc.ItemMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeyFav: null,
        hotkeySort: null,
        statusEquipBox: null,
        statusModifierBox: null,
        statusDefaultBox: null,
        statusBuffBox: null,
        statusFavs: null,
        statusTrade: null,
        listBox: null,
        consHelp: null,
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
            this.sortMenu = new sc.ItemSortMenu;
            this.statusEquipBox = new sc.ItemStatusEquip;
            this.addChildGui(this.statusEquipBox);
            this.statusModifierBox = new sc.ItemEquipModifier;
            this.addChildGui(this.statusModifierBox);
            this.statusDefaultBox = new sc.ItemStatusDefault;
            this.addChildGui(this.statusDefaultBox);
            this.statusBuffBox = new sc.ItemStatusBuffs;
            this.addChildGui(this.statusBuffBox);
            this.consHelp = new sc.ItemBuffHelp;
            this.addChildGui(this.consHelp);
            this.statusBuffBox.annotation = {
                size: {
                    x: this.statusBuffBox.hook.size.x +
                        2,
                    y: this.statusBuffBox.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.buffs",
                    description: "sc.gui.menu.help.item.description.buffs"
                },
                index: {
                    x: 0,
                    y: 3
                }
            };
            this.statusFavs = new sc.ItemStatusFavorites;
            this.addChildGui(this.statusFavs);
            this.statusTrade = new sc.ItemStatusTrade;
            this.addChildGui(this.statusTrade);
            this.listBox = new sc.ItemTabbedBox;
            this.addChildGui(this.listBox);
            this.hotkeyFav = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.item.set-fav"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyFav.submitSound = null;
            this.hotkeyFav.keepMouseFocus = true;
            this.hotkeyFav.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyFav.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyFav.onButtonPress = this.onFavButtonPress.bind(this);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.statusEquipBox.addObservers();
            this.statusModifierBox.addObservers();
            this.statusDefaultBox.addObservers();
            this.statusBuffBox.addObservers();
            this.consHelp.addObservers();
            this.statusFavs.addObservers();
            this.statusTrade.addObservers();
            this.listBox.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.statusEquipBox.removeObservers();
            this.statusModifierBox.removeObservers();
            this.statusDefaultBox.removeObservers();
            this.statusBuffBox.removeObservers();
            this.consHelp.removeObservers();
            this.statusFavs.removeObservers();
            this.statusTrade.removeObservers();
            this.listBox.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            this.onAddHotkeys();
            if (sc.menu.itemCurrentTab == -1) sc.menu.itemCurrentTab = 1;
            this._updateSortMenuButton(this.listBox.getCurrentSortText());
            sc.menu.itemCurrentTab == 0 ? this.hotkeySort.setActive(false) : this.hotkeySort.setActive(true);
            this.statusEquipBox.showMenu();
            this.statusModifierBox.showMenu();
            this.statusDefaultBox.showMenu();
            this.statusBuffBox.showMenu();
            this.statusFavs.showMenu();
            this.statusTrade.showMenu();
            this.listBox.showMenu()
        },
        hideMenu: function() {
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            this.removeObservers();
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyFav);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort);
            this.helpGui = null;
            this.sortMenu.active && this.sortMenu.hideSortMenu();
            this.statusEquipBox.exitMenu();
            this.statusModifierBox.exitMenu();
            this.statusDefaultBox.exitMenu();
            this.statusBuffBox.exitMenu();
            this.consHelp.exitMenu();
            this.statusFavs.exitMenu();
            this.statusTrade.exitMenu();
            this.listBox.exitMenu()
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            this.consHelp.exitMenu(true);
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu(sc.menu.itemCurrentTab != 1)
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this,
                    ig.lang.get("sc.gui.menu.help-texts.inventory.title"), ig.lang.get("sc.gui.menu.help-texts.inventory.pages"),
                    function() {
                        this.commitHotKeysToTopBar(true);
                        ig.input.mouseGuiActive ? sc.menu.buttonInteract.mouseOverGui ? this.consHelp.showMenu() : this.consHelp.store = false : this.consHelp.store && this.consHelp.showMenu()
                    }.bind(this), true);
                this.helpGui.addons.push(sc.menu.guiReference.buffInfo);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onHotkeyFavoriteCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onFavButtonPress: function() {
            this.listBox.setFavorite()
        },
        onHotkeySortCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onSortButtonPress: function() {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu.showSortMenu(this.hotkeySort)
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyFav, this.onHotkeyFavoriteCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort,
                this.onHotkeySortCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
            sc.menu.addHotkey(function() {
                return this.hotkeyFav
            }.bind(this));
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
        _updateSortMenuButton: function(b) {
            var a = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
            this.hotkeySort.setText(a +
                ("\\c[3]" + b + "\\c[0]"));
            sc.menu.updateHotkeys()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.SORT_LIST) this._updateSortMenuButton(d.text);
                else if (a == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                this.sortMenu.active && this.sortMenu.hideSortMenu();
                if (d != sc.menu.itemCurrentTab) {
                    this._updateSortMenuButton(this.listBox.getCurrentSortText());
                    sc.menu.itemCurrentTab == 0 ? this.hotkeySort.setActive(false) : this.hotkeySort.setActive(true)
                }
            }
        }
    })
});
ig.baked = !0;
