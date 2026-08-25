ig.module("game.feature.menu.gui.synop.synop-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.help-boxes", "game.feature.menu.gui.synop.synop-misc").defines(function() {
    var b = [43, 73, 103, 133, 163, 193, 223, 253, 283];
    sc.SynopsisMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        temp_button_group: null,
        helpGui: null,
        buttonGroup: null,
        buttons: {
            map: null,
            lore: null,
            trophies: null,
            records: null,
            trade: null,
            enemies: null,
            botanics: null,
            newgame: null
        },
        infoTask: null,
        infoQuest: null,
        infoLogs: null,
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
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addSelectionCallback(function(a) {
                a.data && (a.active ? sc.menu.setInfoText(a.data) : sc.menu.setInfoText("???"))
            });
            this.buttonGroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            });
            var a = sc.model.player;
            this.buttons.trade = this._createButton("trade", 0, sc.MENU_SUBMENU.TRADE, !a.hasItem(135) || !sc.trade.hasAnyTraderFound());
            this.buttons.botanics = this._createButton("botanics", 1, sc.MENU_SUBMENU.BOTANICS, !a.hasItem(285) || !sc.menu.hasAnyDropFound());
            this.buttons.enemies = this._createButton("enemies", 2, sc.MENU_SUBMENU.ENEMY, !a.hasItem(135));
            this.buttons.map = this._createButton("map", 3, sc.MENU_SUBMENU.MAP);
            this.buttons.lore = this._createButton("lore", 4, sc.MENU_SUBMENU.LORE, !a.hasItem(135), true);
            this.buttons.trophies = this._createButton("trophies", 5, sc.MENU_SUBMENU.TROPHY, false, true);
            this.buttons.records = this._createButton("records", 6, sc.MENU_SUBMENU.STATS, !a.hasItem(135));
            if (sc.newgame.active) {
                this.buttons.newgame = this._createButton("newgame", 7, sc.MENU_SUBMENU.NEW_GAME);
                this.buttons.newgame.onButtonPress = function() {
                    sc.menu.newGameViewMode = true;
                    sc.menu.pushMenu(sc.MENU_SUBMENU.NEW_GAME)
                }.bind(this)
            }
            this.buttons.lore.setActive(a.hasItem(135));
            this.buttons.records.setActive(a.hasItem(135));
            this.buttons.trade.setActive(a.hasItem(135) && sc.trade.hasAnyTraderFound());
            this.buttons.enemies.setActive(a.hasItem(135));
            this.buttons.botanics.setActive(a.hasItem(285) && sc.menu.hasAnyDropFound());
            this.buttons.newgame && this.buttons.newgame.setActive(sc.newgame.active);
            for (var b in this.buttons) this.buttons[b] &&
                this.addChildGui(this.buttons[b]);
            this.buttonGroup.addFocusGui(this.buttons.trade, 0, 0);
            this.buttonGroup.addFocusGui(this.buttons.botanics, 0, 1);
            this.buttonGroup.addFocusGui(this.buttons.enemies, 0, 2);
            this.buttonGroup.addFocusGui(this.buttons.map, 0, 3);
            this.buttonGroup.addFocusGui(this.buttons.lore, 0, 4);
            this.buttonGroup.addFocusGui(this.buttons.trophies, 0, 5);
            this.buttonGroup.addFocusGui(this.buttons.records, 0, 6);
            this.buttons.newgame && this.buttonGroup.addFocusGui(this.buttons.newgame, 0, 7);
            this.infoTask =
                new sc.SynopsisTaskDisplay;
            this.addChildGui(this.infoTask);
            this.infoLogs = new sc.SynopsisLogDisplay;
            this.addChildGui(this.infoLogs);
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
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
            sc.menu.previousMenu == sc.MENU_SUBMENU.START && sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0,
                0, sc.MENU_LEA_STATE.HIDDEN);
            this.buttons.lore.active ? sc.menu.hasNewUnlock(sc.MENU_SUBMENU.LORE) ? this.buttons.lore.activateNewOverlay(true) : this.buttons.lore.deactivateNewOverlay() : this.buttons.lore.deactivateNewOverlay();
            this.buttons.trophies.active ? sc.menu.hasNewUnlock(sc.MENU_SUBMENU.TROPHY) ? this.buttons.trophies.activateNewOverlay(true) : this.buttons.trophies.deactivateNewOverlay() : this.buttons.trophies.deactivateNewOverlay();
            (!sc.model.isSaveAllowed() || sc.model.isTeleportBlocked()) && !sc.autoControl.isActive() ?
                this.buttons.map.setActive(false) : this.buttons.map.setActive(true);
            this.buttons.trade.doStateTransition("DEFAULT", false, false, null, 0.032);
            this.buttons.botanics.doStateTransition("DEFAULT", false, false, null, 0.016);
            this.buttons.enemies.doStateTransition("DEFAULT", false, false, null, 0);
            this.buttons.map.doStateTransition("DEFAULT", false, false, null, 0);
            this.buttons.lore.doStateTransition("DEFAULT", false, false, null, 0);
            this.buttons.trophies.doStateTransition("DEFAULT", false, false, null, 0);
            this.buttons.records.doStateTransition("DEFAULT",
                false, false, null, 0.016);
            this.buttons.newgame && this.buttons.newgame.doStateTransition("DEFAULT", false, false, null, 0.032);
            this.infoTask.show();
            this.infoLogs.show();
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys()
        },
        hideMenu: function() {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            for (var a in this.buttons) {
                var b = this.buttons[a];
                b && b.doStateTransition("HIDDEN")
            }
            this.infoTask.hide();
            this.infoLogs.hide();
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },
        _createButton: function(a, d, c, e, f) {
            var g = null,
                g = f ? new sc.NewUnlockButton(e ? "???" : ig.lang.get("sc.gui.menu.synopsis-menu." + a), sc.BUTTON_MENU_WIDTH) : new sc.ButtonGui(e ? "???" : ig.lang.get("sc.gui.menu.synopsis-menu." + a), sc.BUTTON_MENU_WIDTH);
            g.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            g.setPos(10, b[d] + 0);
            g.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetX: -(sc.BUTTON_MENU_WIDTH + 10)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            g.setData(ig.lang.get("sc.gui.menu.synopsis-menu.descriptions." + a));
            g.menu = c;
            g.onButtonPress = function() {
                this.menu && sc.menu.pushMenu(this.menu)
            };
            g.doStateTransition("HIDDEN", true);
            return g
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
                this.helpGui = new sc.HelpScreen(this,
                    ig.lang.get("sc.gui.menu.help-texts.synopsis.title"), ig.lang.get("sc.gui.menu.help-texts.synopsis.pages"),
                    function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(a) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.commitHotKeysToTopBar(a)
        },
        commitHotKeysToTopBar: function(a) {
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(a)
        },
        onBackButtonPress: function() {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },
        modelChanged: function() {}
    })
});
ig.baked = !0;
