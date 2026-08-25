ig.module("game.feature.menu.gui.stats.stats-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-list").defines(function() {
    sc.StatsMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        buttongroup: null,
        helpGui: null,
        list: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
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
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.addSelectionCallback(function(b) {
                b.data && sc.menu.setInfoText(b.data.description)
            });
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("",
                    true)
            });
            this.buttongroup.onButtonTraversal = this.onButtonTraversal.bind(this);
            this.list = new sc.StatsListBox(this.buttongroup);
            this.addChildGui(this.list);
            this.doStateTransition("DEFAULT")
        },
        update: function() {
            if (this.buttongroup && this.buttongroup.isActive() && ig.input.mouseGuiActive) this.onButtonTraversal()
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.menu, this.list)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.menu,
                this.list)
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            this.list.show();
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
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            this.list.hide();
            this.helpGui = null
        },
        onButtonTraversal: function() {
            var b = -1;
            sc.control.menuCircleRight() ? b = 1 : sc.control.menuCircleLeft() && (b = 0);
            this.list.switchTab(b)
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
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.stats.title"), ig.lang.get("sc.gui.menu.help-texts.stats.pages"),
                    function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
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
