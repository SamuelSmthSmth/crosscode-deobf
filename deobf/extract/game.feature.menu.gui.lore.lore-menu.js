ig.module("game.feature.menu.gui.lore.lore-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.control.control", "game.feature.menu.gui.lore.lore-list").defines(function() {
    sc.LoreMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeySort: null,
        helpGui: null,
        list: null,
        info: null,
        sortMenu: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.list = new sc.LoreListBoxNew;
            this.list.setPos(8, 29);
            this.addChildGui(this.list);
            this.list.doStateTransition("HIDDEN", true);
            this.info = new sc.LoreInfoBox;
            this.info.setPos(8, 29);
            this.addChildGui(this.info);
            this.info.doStateTransition("HIDDEN", true);
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
            this.sortMenu = new sc.SortMenu(this.onExecuteSort.bind(this));
            this.sortMenu.addButton("auto", sc.LORE_SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("name", sc.LORE_SORT_TYPE.NAME, 1);
            this.sortMenu.addButton("unlocked", sc.LORE_SORT_TYPE.UNLOCKED, 2);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.list.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.list.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.setSynopInfo(null,
                false);
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this.updateSortMenuButton(this.list.getCurrentSortText());
            this.list.show();
            this.info.show();
            this.info.setCategory(this.list.getCurrentTabKey());
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
            this.list.hide();
            this.info.hide();
            this.helpGui = null;
            this.sortMenu.active && this.sortMenu.hideSortMenu();
            ig.cleanCache()
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
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.lore.title"), ig.lang.get("sc.gui.menu.help-texts.lore.pages"), function() {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp,
                this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this));
            this.commitHotKeysToTopBar(b)
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
        updateSortMenuButton: function(b) {
            var a = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") +
                ": ";
            this.hotkeySort.setText(a + ("\\c[3]" + b + "\\c[0]"));
            sc.menu.updateHotkeys()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(d.text);
                else if (a == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                this.info.clearFocus();
                this.sortMenu.active && this.sortMenu.hideSortMenu();
                this.info.setCategory(this.list.getCurrentTabKey());
                this.updateSortMenuButton(this.list.getCurrentSortText())
            } else a == sc.MENU_EVENT.SYNOP_FOCUS ? this.info.setFocus(d) : a == sc.MENU_EVENT.SYNOP_SET_INFO &&
                this.info.setLore(sc.menu.synopInfo)
        }
    })
});
ig.baked = !0;
