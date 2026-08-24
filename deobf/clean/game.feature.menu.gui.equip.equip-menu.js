/**
 * game.feature.menu.gui.equip.equip-menu
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.equip.equip-menu")`.
 *
 * `sc.EquipMenu`: the equipment submenu. Shows the five body-part mouse
 * buttons (head, arms, torso, feet) with equip icons + selection lines
 * over Lea's sprite, the level overview panel, and the right-side
 * container with the item list (part chooser). Wires hotkeys (help, sort,
 * status, switch view mode) and responds to body-part/equip/sort menu
 * events.
 */
ig.module("game.feature.menu.gui.equip.equip-menu")
    .requires("impact.feature.gui.gui", "game.feature.gui.plug-in", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.main-menu", "game.feature.menu.gui.equip.equip-status", "game.feature.menu.gui.equip.equip-bodypart", "game.feature.inventory.inventory", "game.feature.menu.gui.help.help-menu")
    .defines(function () {

    sc.EquipMenu = sc.BaseMenu.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
        globalButtons: {
            head: null,
            leftArm: null,
            rightArm: null,
            torso: null,
            feet: null
        },
        statusContainer: null,
        rightContainer: null,
        overview: null,
        quickSelectButtonGroup: null,
        hotkeys: {
            help: null,
            status: null,
            sort: null,
            "switch": null
        },
        sortMenu: null,
        helpGui: null,

        init: function () {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.sortMenu = new sc.ItemSortMenu;
            this.sortMenu.addButton("level", sc.SORT_TYPE.LEVEL, 4);
            this.sortMenu.addButton("hp", sc.SORT_TYPE.HP, 5);
            this.sortMenu.addButton("attack", sc.SORT_TYPE.ATTACK, 6);
            this.sortMenu.addButton("defense", sc.SORT_TYPE.DEFENSE, 7);
            this.sortMenu.addButton("focus", sc.SORT_TYPE.FOCUS, 8);
            this.statusContainer = new sc.EquipStatusContainer;
            this.addChildGui(this.statusContainer);
            this.quickSelectButtonGroup = new sc.ButtonGroup;
            this.quickSelectButtonGroup.addSelectionCallback(function (button) {
                sc.menu.setInfoText(button.data)
            });
            this.quickSelectButtonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            this.quickSelectButtonGroup.addPressCallback(function () {
                if (this.sortMenu.active) this.sortMenu.hideSortMenu()
            }.bind(this));
            this.globalButtons.head = new sc.BodyPartMouseButton(false, 17, 9, sc.options.hdMode ? 81 : 59, 33);
            this.globalButtons.head.setPos(sc.options.hdMode ? 264 : 221, 27);
            this.initEquipIcon(this.globalButtons.head, sc.model.player.equip.head);
            this.globalButtons.rightArm = new sc.BodyPartMouseButton(true, 17, 12, sc.options.hdMode ? 121 : 99, 71);
            this.globalButtons.rightArm.setPos(sc.options.hdMode ? 221 : 178, 119);
            this.initEquipIcon(this.globalButtons.rightArm, sc.model.player.equip.rightArm);
            this.globalButtons.leftArm = new sc.BodyPartMouseButton(false, 36, 5, sc.options.hdMode ? 24 : 1, 109, -12);
            this.globalButtons.leftArm.setPos(sc.options.hdMode ? 306 : 263, 119);
            this.initEquipIcon(this.globalButtons.leftArm, sc.model.player.equip.leftArm);
            this.globalButtons.torso = new sc.BodyPartMouseButton(false, 16, 26, sc.options.hdMode ? 65 : 43, 147);
            this.globalButtons.torso.setPos(sc.options.hdMode ? 264 : 221, 124);
            this.initEquipIcon(this.globalButtons.torso, sc.model.player.equip.torso);
            this.globalButtons.feet = new sc.BodyPartMouseButton(true, 16, 35, sc.options.hdMode ? 42 : 20, 185);
            this.globalButtons.feet.setPos(sc.options.hdMode ? 278 : 235, 256);
            this.initEquipIcon(this.globalButtons.feet, sc.model.player.equip.feet);
            this.quickSelectButtonGroup.addFocusGui(this.globalButtons.head.button, 1, 0);
            this.quickSelectButtonGroup.addFocusGui(this.globalButtons.rightArm.button, 0, 1);
            this.quickSelectButtonGroup.addFocusGui(this.globalButtons.torso.button, 1, 1);
            this.quickSelectButtonGroup.addFocusGui(this.globalButtons.leftArm.button, 2, 1);
            this.quickSelectButtonGroup.addFocusGui(this.globalButtons.feet.button, 2, 2);
            this.rightContainer = new sc.EquipRightContainer(this.globalButtons);
            this.addChildGui(this.rightContainer);
            for (var key in this.globalButtons)
                if (this.globalButtons[key]) this.addChildGui(this.globalButtons[key]);
            this.doStateTransition("DEFAULT", true);
            this.overview = new sc.EquipLevelOverview;
            this.addChildGui(this.overview);
            this.hotkeys.help = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeys.help.keepMouseFocus = true;
            this.hotkeys.help.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeys.help.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeys.help.onButtonPress = this._onHelpButtonPressed.bind(this);
            this.hotkeys.sort = new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeys.sort.keepMouseFocus = true;
            this.hotkeys.sort.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeys.sort.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeys.sort.onButtonPress = this.onSortButtonPress.bind(this);
            this.hotkeys.status = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.status"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeys.status.keepMouseFocus = true;
            this.hotkeys.status.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeys.status.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeys.status.onButtonPress = this.onStatusButtonPress.bind(this);
            this.hotkeys.switch = new sc.ButtonGui("", null, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeys.switch.keepMouseFocus = true;
            this.hotkeys.switch.submitSound = null;
            this.hotkeys.switch.onButtonPress = function () {
                var focus = ig.input.mouseGuiActive ? sc.menu.buttonInteract.mouseOverGui : this.rightContainer.itemList.list.buttonGroup.getCurrentElement();
                this.statusContainer.toggleViewMode(focus);
                ig.interact.setBlockDelay(0.2)
            }.bind(this)
        },

        initEquipIcon: function (button, equipId) {
            var rarity = sc.inventory.getItemRarity(equipId),
                subType = sc.inventory.getItemSubType(equipId),
                level = sc.inventory.getItemLevel(equipId);
            button.setEquip(rarity, subType, level, true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.model.menu, this);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.menu, this.statusContainer);
            sc.Model.addObserver(sc.model.menu, this.rightContainer);
            sc.Model.addObserver(sc.model.menu, this.rightContainer.partChooser)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.menu, this);
            sc.Model.removeObserver(sc.model.player, this);
            sc.Model.removeObserver(sc.model.menu, this.statusContainer);
            sc.Model.removeObserver(sc.model.menu, this.rightContainer);
            sc.Model.removeObserver(sc.model.menu, this.rightContainer.partChooser)
        },

        _onHelpButtonCheck: function () {
            return sc.control.menuHotkeyHelp()
        },

        _onHelpButtonPressed: function () {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.equip.title"), ig.lang.get("sc.gui.menu.help-texts.equip.pages"), function () {
                    this._addHotKeys(true)
                }.bind(this));
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        onSortButtonCheck: function () {
            return sc.control.menuHotkeyHelp3()
        },

        onSortButtonPress: function () {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu.showSortMenu(this.hotkeys.sort)
            }
        },

        onStatusButtonCheck: function () {
            return ig.interact.isBlocked() ? false : sc.control.menuHotkeyHelp2()
        },

        onStatusButtonPress: function () {
            if (sc.menu.previousMenu == sc.MENU_SUBMENU.START) {
                if (sc.menu.currentBodyPart != 0) sc.menu.popBackCallback();
                sc.menu.pushMenu(sc.MENU_SUBMENU.STATUS)
            } else if (sc.menu.previousMenu == sc.MENU_SUBMENU.STATUS) {
                if (sc.menu.currentBodyPart != 0) sc.menu.popBackCallback();
                this._exitMenu()
            }
        },

        onHotkeySwitchCheck: function () {
            return sc.control.menuHotkeyHelp4()
        },

        _addHotKeys: function (commitHotkeys) {
            sc.menu.addHotkey(function () {
                return this.hotkeys.status
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeys.sort
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeys.help
            }.bind(this));
            sc.menu.commitHotkeys(commitHotkeys)
        },

        _exitMenu: function () {
            var prevMenu = sc.menu.previousMenu;
            sc.menu.popBackCallback();
            sc.menu.popMenu();
            if (prevMenu == sc.MENU_SUBMENU.STATUS) sc.menu.previousMenu = sc.MENU_SUBMENU.START;
            else sc.menu.exitEquipMenu()
        },

        _moveBodyPartLines: function (bodyPart, skipSounds) {
            switch (bodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var key in this.globalButtons)
                        if (this.globalButtons[key]) this.globalButtons[key].resetLine(skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this._pullInAllButtons(this.globalButtons.head, skipSounds);
                    this.globalButtons.head.showLine(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this._pullInAllButtons(this.globalButtons.rightArm, skipSounds);
                    this.globalButtons.rightArm.showLine(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this._pullInAllButtons(this.globalButtons.leftArm, skipSounds);
                    this.globalButtons.leftArm.showLine(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this._pullInAllButtons(this.globalButtons.torso, skipSounds);
                    this.globalButtons.torso.showLine(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this._pullInAllButtons(this.globalButtons.feet, skipSounds);
                    this.globalButtons.feet.showLine(true)
            }
        },

        _pullInAllButtons: function (active, skipSounds) {
            var button = null,
                key;
            for (key in this.globalButtons) {
                if (button = this.globalButtons[key]) {
                    if (button != active) button.hideLine(skipSounds)
                }
            }
        },

        _updateSortHotkey: function (sortText) {
            var text = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
            this.hotkeys.sort.setText(text + ("\\c[3]" + sortText + "\\c[0]"));
            sc.menu.updateHotkeys()
        },

        _updateMouseButtons: function (equipId, skipSounds) {
            var rarity = equipId.equipID ? sc.inventory.getItemRarity(equipId.equipID) : null,
                subType = equipId.equipID ? sc.inventory.getItemSubType(equipId.equipID) : null,
                level = equipId.equipID ? sc.inventory.getItemLevel(equipId.equipID) : null;
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    this.globalButtons.head.setEquip(rarity, subType, level, skipSounds);
                    this.globalButtons.rightArm.setEquip(rarity, subType, level, skipSounds);
                    this.globalButtons.leftArm.setEquip(rarity, subType, level, skipSounds);
                    this.globalButtons.torso.setEquip(rarity, subType, level, skipSounds);
                    this.globalButtons.feet.setEquip(rarity, subType, level, skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this.globalButtons.head.setEquip(rarity, subType, level, skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this.globalButtons.rightArm.setEquip(rarity, subType, level, skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this.globalButtons.leftArm.setEquip(rarity, subType, level, skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this.globalButtons.torso.setEquip(rarity, subType, level, skipSounds);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this.globalButtons.feet.setEquip(rarity, subType, level, skipSounds)
            }
        },

        modelChanged: function (model, msg, params) {
            if (model == sc.menu)
                if (msg == sc.MENU_EVENT.SELECTED_BODYPART) {
                    if (model.currentBodyPart != model.previousBodyPart) {
                        if (model.currentBodyPart == sc.MENU_EQUIP_BODYPART.NONE) this.hotkeys.sort.setActive(false);
                        else {
                            this._updateSortHotkey(this.rightContainer.getCurrentSortText());
                            this.hotkeys.sort.setActive(true)
                        }
                        this._moveBodyPartLines(model.currentBodyPart)
                    }
                } else if (msg == sc.MENU_EVENT.SORT_LIST) this._updateSortHotkey(params.text);
            else if (model == sc.model.player && msg == sc.PLAYER_MSG.EQUIP_CHANGE) {
                this.overview.updateNumbers();
                this._updateMouseButtons(params, false)
            }
        },

        showMenu: function (previousMenu, prevMenuId) {
            this.addObservers();
            if (sc.menu.menuHost == 0) sc.menu.setHost(sc.MENU_SUBMENU.EQUIPMENT);
            this.statusContainer.showMenu();
            this.overview.show();
            if (sc.menu.menuHost == sc.MENU_SUBMENU.EQUIPMENT)
                if (prevMenuId == sc.MENU_SUBMENU.STATUS) {
                    if (sc.menu.statusPage != sc.MENU_STATUS_PAGES.MAIN) sc.menu.moveLeaSprite(0, -101, sc.MENU_LEA_STATE.SMALL, true);
                    this.rightContainer.tempShowMenu()
                } else {
                    this._updateSortHotkey(ig.lang.get("sc.gui.menu.sort.auto"));
                    this.hotkeys.sort.setActive(false);
                    sc.menu.pushBackCallback(this._exitMenu.bind(this));
                    this.rightContainer.showMenu()
                }
            else {
                sc.menu.pushBackCallback(this._exitMenu.bind(this));
                sc.menu.moveLeaSprite(0, -101, sc.MENU_LEA_STATE.SMALL, true);
                if (sc.menu.currentBodyPart == 0 && !this.rightContainer.partChooser.buttonGroup.isActive()) {
                    this._updateSortHotkey(ig.lang.get("sc.gui.menu.sort.auto"));
                    this.hotkeys.sort.setActive(false);
                    this.rightContainer.showMenu()
                } else this.rightContainer.tempShowMenu()
            }
            for (var key in this.globalButtons)
                if (this.globalButtons[key]) this.globalButtons[key].showButton();
            if (sc.menu.currentBodyPart != 0 && prevMenuId == sc.MENU_SUBMENU.STATUS) this._moveBodyPartLines(sc.menu.currentBodyPart, true);
            ig.interact.setBlockDelay(0.2);
            sc.menu.buttonInteract.addParallelGroup(this.quickSelectButtonGroup);
            sc.menu.buttonInteract.addGlobalButton(this.hotkeys.help, this._onHelpButtonCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeys.status, this.onStatusButtonCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeys.sort, this.onSortButtonCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeys.switch, this.onHotkeySwitchCheck.bind(this));
            this._addHotKeys();
            if (prevMenuId != null && prevMenuId == 0) {
                this._updateSortHotkey(ig.lang.get("sc.gui.menu.sort.auto"));
                this.hotkeys.sort.setActive(false);
                sc.menu.moveLeaSprite(sc.options.hdMode ? 0 : 1, -101, sc.MENU_LEA_STATE.SMALL)
            }
        },

        hideMenu: function (nextMenu, nextMenuId) {
            if (nextMenuId != sc.MENU_SUBMENU.STATUS) sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu(nextMenuId)
        },

        exitMenu: function (nextMenuId) {
            this.removeObservers();
            this.statusContainer.doStateTransition("HIDDEN");
            this.overview.hide();
            if (nextMenuId == sc.MENU_SUBMENU.STATUS) this.rightContainer.tempHideMenu();
            else {
                this.rightContainer.hideMenu();
                sc.menu.menuHost = 0
            }
            if (this.helpGui) ig.gui.removeGuiElement(this.helpGui);
            this.helpGui = null;
            sc.menu.buttonInteract.removeParallelGroup(this.quickSelectButtonGroup);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeys.help);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeys.sort);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeys.status);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeys.switch);
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            for (var key in this.globalButtons)
                if (this.globalButtons[key]) this.globalButtons[key].hideButton()
        }
    })
});
ig.baked = !0;
