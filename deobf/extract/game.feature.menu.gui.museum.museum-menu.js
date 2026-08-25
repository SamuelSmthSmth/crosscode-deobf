ig.module("game.feature.menu.gui.museum.museum-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.MuseumMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        temp_button_group: null,
        helpGui: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
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
            this.temp_button_group = new sc.ButtonGroup;
            this.temp_button_group.addSelectionCallback(function(b) {
                b.data && sc.menu.setInfoText(b.data.description)
            });
            this.temp_button_group.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            });
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
            sc.menu.buttonInteract.pushButtonGroup(this.temp_button_group);
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
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
            sc.menu.buttonInteract.removeButtonGroup(this.temp_button_group);
            this.helpGui = null
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.MultiPageBoxGui;
                this.helpGui.setDefaultHeaderText(ig.lang.get("sc.gui.menu.help-texts.save.title"));
                this.helpGui.addPages(ig.lang.get("sc.gui.menu.help-texts.save.pages"));
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function() {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys()
        },
        onBackButtonPress: function() {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },
        modelChanged: function() {}
    })
});
ig.baked = !0;
