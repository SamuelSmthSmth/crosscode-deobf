ig.module("game.feature.menu.gui.base-menu").requires("impact.feature.gui.gui").defines(function() {
    sc.BaseMenu = ig.GuiElementBase.extend({
        visible: false,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.hook.pauseGui = true;
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {},
        removeObservers: function() {},
        showMenu: function() {},
        hideMenu: function() {},
        exitMenu: function() {}
    });
    sc.ListInfoMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeySort: null,
        helpGui: null,
        list: null,
        info: null,
        sortMenu: null,
        init: function(b, a, d) {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            if (b) {
                this.list = b;
                this.list.setPos(8, 29);
                this.addChildGui(this.list);
                this.list.doStateTransition("HIDDEN", true)
            }
            if (a) {
                this.info = a;
                this.info.setPos(8, 29);
                this.addChildGui(this.info);
                this.info.doStateTransition("HIDDEN", true)
            }
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"),
                void 0, true, sc.BUTTON_TYPE.SMALL);
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
            if (!d) {
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
                this.sortMenu = new sc.SortMenu(this.onExecuteSort.bind(this))
            }
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.list && this.list.addObservers && this.list.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.list &&
                this.list.removeObservers && this.list.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this.list && this.list.show();
            this.info && this.info.show();
            this.onAddHotkeys()
        },
        hideMenu: function() {
            this.removeObservers();
            this.exitMenu()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            this.sortMenu && sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort);
            this.list && this.list.hide();
            this.info && this.info.hide();
            this.helpGui = null;
            this.sortMenu && this.sortMenu.hideSortMenu()
        },
        updateSortMenuButton: function(b) {
            if (this.sortMenu) {
                var a = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
                this.hotkeySort.setText(a + ("\\c[3]" + b + "\\c[0]"));
                sc.menu.updateHotkeys()
            }
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            if (this.helpGui) {
                ig.gui.addGuiElement(this.helpGui);
                this.helpGui.openMenu && this.helpGui.openMenu()
            }
        },
        onHotkeySortCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onSortButtonPress: function() {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu && this.sortMenu.showSortMenu(this.hotkeySort)
            }
        },
        onExecuteSort: function(b) {
            if (b.data) {
                this.sortMenu && this.sortMenu.hideSortMenu();
                sc.menu.sortList(b)
            }
        },
        createHelpGui: function() {},
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp,
                this.onHotkeyHelpCheck.bind(this));
            this.sortMenu && sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
            this.sortMenu && sc.menu.addHotkey(function() {
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
        modelChanged: function() {}
    })
});
ig.baked = !0;
