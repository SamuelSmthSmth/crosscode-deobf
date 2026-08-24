/**
 * game.feature.menu.gui.options.options-menu
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.options.options-menu")`.
 *
 * `sc.OptionsMenu`: the options submenu container (`sc.BaseMenu`) — hosts
 * the `sc.OptionsTabBox` list, the help / reset-default hotkey buttons,
 * the language popup backdrop (`sc.OptionLangPopUp`), and the help screen.
 */
ig.module("game.feature.menu.gui.options.options-menu")
    .requires("impact.feature.gui.gui", "game.feature.menu.gui.options.options-list")
    .defines(function () {

    sc.OptionsMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeyDefault: null,
        listBox: null,
        helpGui: null,
        blackBox: null,
        langGui: null,

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
            this.hotkeyDefault = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.reset-default"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyDefault.keepMouseFocus = true;
            this.hotkeyDefault.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyDefault.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyDefault.onButtonPress = this.onDefaultButtonPressed.bind(this);
            this.listBox = new sc.OptionsTabBox(sc.menu.optionsLocalMode);
            this.addChildGui(this.listBox);
            this.blackBox = new ig.ColorGui("black", 433, 196);
            this.blackBox.hook.transitions = {
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
            };
            this.blackBox.hook.localAlpha = 0.8;
            this.blackBox.setPos(-1, 29);
            this.blackBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.blackBox.doStateTransition("HIDDEN", true);
            this.addChildGui(this.blackBox);
            this.langGui = new sc.OptionLangPopUp;
            this.addChildGui(this.langGui);
            this.doStateTransition("DEFAULT", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            this.listBox.addObservers()
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            this.listBox.removeObservers()
        },

        showMenu: function () {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            this.onAddHotkeys();
            this.listBox.showMenu()
        },

        hideMenu: function () {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },

        exitMenu: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyDefault);
            this.helpGui = null;
            this.langGui.hide();
            this.blackBox.doStateTransition("HIDDEN");
            this.listBox.exitMenu()
        },

        onHotkeyDefaultCheck: function () {
            return sc.control.menuHotkeyHelp2()
        },

        onDefaultButtonPressed: function () {
            sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.resetAsk"), sc.DIALOG_INFO_ICON.WARNING, function (result) {
                result.data == 0 && sc.options.resetDefaultValues()
            }.bind(this))
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

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.options.title"), ig.lang.get("sc.gui.menu.help-texts.options.pages"), function () {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        onAddHotkeys: function (commitToTopBar) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyDefault, this.onHotkeyDefaultCheck.bind(this));
            this.commitHotKeysToTopBar(commitToTopBar)
        },

        commitHotKeysToTopBar: function (commitToTopBar) {
            sc.menu.addHotkey(function () {
                return this.hotkeyDefault
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

        onLangPopUpClose: function () {
            this.blackBox.doStateTransition("HIDDEN")
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu)
                if (event == sc.MENU_EVENT.OPTION_LANG_POP_UP) {
                    this.langGui.show(data, this.onLangPopUpClose.bind(this));
                    this.blackBox.doStateTransition("DEFAULT")
                } else if (event == sc.MENU_EVENT.OPTION_CHANGED_TAB) {
                this.langGui.hide();
                this.blackBox.doStateTransition("HIDDEN")
            }
        }
    })
});
ig.baked = !0;
