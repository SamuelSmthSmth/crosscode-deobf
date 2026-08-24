/**
 * game.feature.menu.gui.equip.equip-bodypart
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.equip.equip-bodypart")`.
 *
 * The right-hand side of the equip menu. `sc.EquipRightContainer` hosts the
 * `sc.EquipBodyPartContainer` (the five body-part buttons: head, arms, torso,
 * feet) and the `sc.ItemListBox` with the items equippable for the currently
 * selected body part. `sc.EquipBodyPartContainer.Entry` is a single body-part
 * button that slides up to the top when its part is selected and shows the
 * currently equipped item's name/level.
 */
ig.module("game.feature.menu.gui.equip.equip-bodypart")
    .requires("impact.feature.gui.gui", "game.feature.gui.plug-in", "game.feature.menu.gui.equip.equip-misc", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.EquipRightContainer = sc.MenuPanel.extend({
        partChooser: null,
        itemList: null,
        sortTypes: [],
        _itemListActive: false,
        _lastEquipState: false,
        _globalButtons: null,
        _refocusFromCycle: false,

        init: function (globalButtons) {
            this.parent();
            this.setSize(170, 264);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(sc.options.hdMode ? 25 : 2, 28);
            this._globalButtons = globalButtons;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(170 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.partChooser = new sc.EquipBodyPartContainer(globalButtons);
            this.addChildGui(this.partChooser);
            this.itemList = new sc.ItemListBox(1);
            this.itemList.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 170 + (sc.options.hdMode ? 25 : 3)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.itemList.setSize(170, 210);
            this.itemList.setPos(0, 44);
            this.itemList.doStateTransition("HIDDEN", true);
            this.itemList.list.buttonGroup.addSelectionCallback(function (entry) {
                if (entry.data) {
                    sc.menu.setInfoText(entry.data.description ? entry.data.description : entry.data);
                    if (entry.data.id) {
                        ig.input.mouseGuiActive || sc.menu.ensureCurrentValues();
                        sc.menu.setItemInfo(entry.data.id)
                    }
                }
            }.bind(this));
            this.itemList.list.buttonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            this.itemList.list.buttonGroup.addPressCallback(function (entry, press) {
                if (entry.data && entry.data.id) {
                    ig.input.mouseGuiActive || sc.menu.ensureCurrentValues();
                    this._equipItem(entry.data.id, press) && sc.BUTTON_SOUND.equip.play();
                    ig.input.mouseGuiActive ? sc.menu.changeEquipOnCurrentBodypart(entry.data.id) : this.partChooser._setText(entry.data.id)
                }
            }.bind(this));
            this.addChildGui(this.itemList);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            this.parent();
            this._updateItemList()
        },

        _equipItem: function (itemID, unFocus) {
            var result = sc.model.player.setEquipment(sc.menu.currentBodyPart, itemID);
            this._makeList(true, unFocus, itemID);
            return result
        },

        setCurrentBodypartPressed: function () {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var bodyPart in this._globalButtons) {
                        this.buttons[bodyPart] && this.buttons[bodyPart].setPressedAndUnFocus(false)
                    }
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this._globalButtons.head.setPressedAndUnFocus(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this._globalButtons.rightArm.setPressedAndUnFocus(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this._globalButtons.leftArm.setPressedAndUnFocus(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this._globalButtons.torso.setPressedAndUnFocus(true);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this._globalButtons.feet.setPressedAndUnFocus(true)
            }
        },

        setCurrentBodypartUnpressed: function () {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var bodyPart in this._globalButtons) {
                        this.buttons[bodyPart] && this.buttons[bodyPart].setPressedAndUnFocus(false)
                    }
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this._globalButtons.head.setPressedAndUnFocus(false);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this._globalButtons.rightArm.setPressedAndUnFocus(false);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this._globalButtons.leftArm.setPressedAndUnFocus(false);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this._globalButtons.torso.setPressedAndUnFocus(false);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this._globalButtons.feet.setPressedAndUnFocus(false)
            }
        },

        _updateItemList: function () {
            if (this._itemListActive && this.itemList.list.buttonGroup.isActive()) {
                if (sc.control.rightPressed()) {
                    this.itemList.list.buttonGroup.stepDown(10);
                    this.itemList.list.setScrollAtCurrentYIndex()
                } else if (sc.control.leftPressed()) {
                    this.itemList.list.buttonGroup.stepUp(9);
                    this.itemList.list.setScrollAtCurrentYIndex()
                }
                if (sc.control.menuCircleLeft()) {
                    this._refocusFromCycle = true;
                    this.setCurrentBodypartUnpressed();
                    sc.menu.cycleBodyPartLeft();
                    this.setCurrentBodypartPressed()
                } else if (sc.control.menuCircleRight()) {
                    this._refocusFromCycle = true;
                    this.setCurrentBodypartUnpressed();
                    sc.menu.cycleBodyPartRight();
                    this.setCurrentBodypartPressed()
                }
            }
        },

        _activateItemList: function () {
            if (this._itemListActive) {
                ig.interact.setBlockDelay(0.2);
                this._makeList(false)
            } else {
                this._itemListActive = true;
                sc.menu.pushBackCallback(this._exitItemList.bind(this));
                this._makeList(false);
                sc.menu.buttonInteract.pushButtonGroup(this.itemList.list.buttonGroup);
                this.itemList.list.buttonGroup.mouseOverGui = this.partChooser.buttonGroup.mouseOverGui;
                ig.interact.setBlockDelay(0.2);
                this.itemList.doStateTransition("DEFAULT")
            }
        },

        _deactivateItemList: function (instant) {
            if (this._itemListActive) {
                this._itemListActive = false;
                instant || sc.menu.popBackCallback();
                this.itemList.doStateTransition("HIDDEN", instant);
                sc.menu.buttonInteract.removeButtonGroup(this.itemList.list.buttonGroup)
            }
        },

        _exitItemList: function () {
            sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.NONE);
            ig.input.mouseGuiActive || this.partChooser.refocusOnBack()
        },

        _makeList: function (focus, setFocus, equippedItemID, callRefocus, sortType) {
            focus = focus || this._refocusFromCycle || false;
            setFocus = setFocus || false;
            callRefocus = callRefocus || false;
            if (this.sortTypes[sc.menu.currentBodyPart] != void 0) {
                if (sortType == void 0) {
                    sortType = this.sortTypes[sc.menu.currentBodyPart]
                } else {
                    this.sortTypes[sc.menu.currentBodyPart] = sortType
                }
            } else {
                this.sortTypes[sc.menu.currentBodyPart] = sortType || sc.SORT_TYPE.ORDER
            }
            var focusIndex = 0,
                scrollPos = 0;
            if (focus && !this._refocusFromCycle) {
                focusIndex = this.itemList.list.buttonGroup.current.y;
                scrollPos = -this.itemList.list.box.hook.scroll.y
            }
            this._refocusFromCycle = false;
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(focus);
            var hasEquipped = false,
                subList = null,
                player = sc.model.player;
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    subList = player.getEquipSubList(sc.ITEMS_EQUIP_TYPES.HEAD, null, sortType || sc.SORT_TYPE.ORDER);
                    player.equip.head > 0 && (hasEquipped = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    subList = player.getEquipSubList(sc.ITEMS_EQUIP_TYPES.ARM, null, sortType || sc.SORT_TYPE.ORDER);
                    player.equip.leftArm > 0 && (hasEquipped = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    subList = player.getEquipSubList(sc.ITEMS_EQUIP_TYPES.ARM, null, sortType || sc.SORT_TYPE.ORDER);
                    player.equip.rightArm > 0 && (hasEquipped = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    subList = player.getEquipSubList(sc.ITEMS_EQUIP_TYPES.TORSO, null, sortType || sc.SORT_TYPE.ORDER);
                    player.equip.torso > 0 && (hasEquipped = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    subList = player.getEquipSubList(sc.ITEMS_EQUIP_TYPES.FEET, null, sortType || sc.SORT_TYPE.ORDER);
                    player.equip.feet > 0 && (hasEquipped = true)
            }
            var button = null,
                itemCount = 0,
                amount = 0;
            if (hasEquipped) {
                button = new sc.ItemBoxButton(ig.lang.get("sc.gui.menu.equip.unequip-name"), 140, 26, -1, -1E3, ig.lang.get("sc.gui.menu.equip.unequip-des"), true, true, null);
                button.button.submitSound = null;
                this.itemList.list.addButton(button)
            }
            for (var index = 0; index < subList.length; index++) {
                amount = player.items[subList[index]] || 0;
                button = sc.inventory.getItem(subList[index]);
                itemCount++;
                var label = "\\i[" + (button.icon + sc.inventory.getRaritySuffix(button.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(button.name),
                    description = ig.LangLabel.getText(button.description),
                    itemButton = new sc.ItemBoxButton(label, 141, 26, amount, subList[index], description, void 0, void 0, null, 99, button.level || 86);
                itemButton.button.submitSound = null;
                this.isIDEquipped(subList[index]) && itemButton.setActive(false);
                this.itemList.list.addButton(itemButton)
            }
            if (focus) {
                this.itemList.list._prevIndex = focusIndex;
                if (sortType) {
                    scrollPos = focusIndex = 0
                } else if (!this._lastEquipState && hasEquipped && equippedItemID != void 0 && player.items[equippedItemID] && player.items[equippedItemID] > 0) {
                    focusIndex = Math.min(focusIndex, itemCount - 1);
                    scrollPos = scrollPos + this.itemList.list.pageSize
                }
                setFocus ? this.itemList.list.buttonGroup.setCurrentFocus(0, focusIndex) : this.itemList.list.buttonGroup.focusCurrentButton(0, focusIndex, false, callRefocus);
                this.itemList.list.scrollToY(scrollPos, true)
            }
            this._lastEquipState = hasEquipped
        },

        isIDEquipped: function (itemID) {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    return sc.model.player.equip.head == itemID;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    return sc.model.player.equip.leftArm == itemID;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    return sc.model.player.equip.rightArm == itemID;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    return sc.model.player.equip.torso == itemID;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    return sc.model.player.equip.feet == itemID
            }
        },

        getCurrentSortText: function () {
            var text = "auto";
            switch (this.sortTypes[sc.menu.currentBodyPart] || sc.SORT_TYPE.ORDER) {
                case sc.SORT_TYPE.ORDER:
                    text = "auto";
                    break;
                case sc.SORT_TYPE.NAME:
                    text = "name";
                    break;
                case sc.SORT_TYPE.AMOUNT:
                    text = "amount";
                    break;
                case sc.SORT_TYPE.RARITY:
                    text = "rarity";
                    break;
                case sc.SORT_TYPE.LEVEL:
                    text = "level";
                    break;
                case sc.SORT_TYPE.HP:
                    text = "hp";
                    break;
                case sc.SORT_TYPE.ATTACK:
                    text = "attack";
                    break;
                case sc.SORT_TYPE.DEFENSE:
                    text = "defense";
                    break;
                case sc.SORT_TYPE.FOCUS:
                    text = "focus"
            }
            return ig.lang.get("sc.gui.menu.sort." + text)
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SELECTED_BODYPART) {
                    if (menu.previousBodyPart != menu.currentBodyPart) {
                        menu.currentBodyPart == sc.MENU_EQUIP_BODYPART.NONE ? this._deactivateItemList() : this._activateItemList()
                    }
                } else if (event == sc.MENU_EVENT.SORT_LIST) {
                    this._makeList(true, ig.input.mouseGuiActive, null, !ig.input.mouseGuiActive, data.data.sortType)
                }
            }
        },

        showMenu: function () {
            this._deactivateItemList(true);
            this.partChooser.showMenu();
            this.doStateTransition("DEFAULT")
        },

        hideMenu: function () {
            this._deactivateItemList();
            this.partChooser.hideMenu();
            this.doStateTransition("HIDDEN")
        },

        tempShowMenu: function () {
            sc.menu.currentBodyPart == 0 && !this.partChooser.buttonGroup.isActive() ? this.partChooser.showMenu() : sc.menu.currentBodyPart != 0 && sc.menu.pushBackCallback(this._exitItemList.bind(this));
            this.doStateTransition("DEFAULT")
        },

        tempHideMenu: function () {
            this.doStateTransition("HIDDEN")
        }
    });

    sc.EquipBodyPartContainer = ig.GuiElementBase.extend({
        buttonGroup: null,
        buttons: {
            head: null,
            rightArm: null,
            leftArm: null,
            torso: null,
            feet: null
        },

        init: function (globalButtons) {
            this.parent();
            this.setSize(169, 264);
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttonGroup.addSelectionCallback(function (entry) {
                sc.menu.setInfoText(entry.data)
            });
            this.buttonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            var posY = 36,
                equip = sc.model.player.equip;
            this.buttons.head = this._createButton("head", equip.head, 9, posY, globalButtons.head.button, 0, 33, function () {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.HEAD)
            }.bind(this));
            this.addChildGui(this.buttons.head);
            posY = posY + 38;
            this.buttons.rightArm = this._createButton("rightarm", equip.rightArm, 9, posY, globalButtons.rightArm.button, 1, 71, function () {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.RIGHT_ARM)
            }.bind(this));
            this.addChildGui(this.buttons.rightArm);
            posY = posY + 38;
            this.buttons.leftArm = this._createButton("leftarm", equip.leftArm, 9, posY, globalButtons.leftArm.button, 2, 109, function () {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.LEFT_ARM)
            }.bind(this));
            this.addChildGui(this.buttons.leftArm);
            posY = posY + 38;
            this.buttons.torso = this._createButton("torso", equip.torso, 9, posY, globalButtons.torso.button, 3, 147, function () {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.TORSO)
            }.bind(this));
            this.addChildGui(this.buttons.torso);
            this.buttons.feet = this._createButton("feet", equip.feet, 9, posY + 38, globalButtons.feet.button, 4, 185, function () {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.FEET)
            }.bind(this));
            this.addChildGui(this.buttons.feet)
        },

        showMenu: function () {
            for (var bodyPart in this.buttons) {
                this.buttons[bodyPart] && this.buttons[bodyPart].reset()
            }
            ig.interact.setBlockDelay(0.2);
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },

        hideMenu: function () {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },

        refocusOnBack: function () {
            switch (sc.menu.previousBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    ig.debug("Whoops, Why is this happening?");
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this.buttonGroup.focusCurrentButton(0, 0, false, true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this.buttonGroup.focusCurrentButton(0, 1, false, true);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this.buttonGroup.focusCurrentButton(0, 2, false, true);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this.buttonGroup.focusCurrentButton(0, 3, false, true);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this.buttonGroup.focusCurrentButton(0, 4, false, true)
            }
        },

        _createButton: function (name, itemID, x, y, button, focusIndex, topY, onButtonPress) {
            name = ig.lang.get("sc.gui.menu.equip." + name);
            var item = sc.inventory.getItem(itemID);
            var entry = new sc.EquipBodyPartContainer.Entry(name, item, x, y, button, topY);
            entry.button.onButtonPress = onButtonPress;
            button.onButtonPress = onButtonPress;
            this.buttonGroup.addFocusGui(entry.button, 0, focusIndex);
            return entry
        },

        _moveButtons: function (bodyPart) {
            switch (bodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var name in this.buttons) {
                        this.buttons[name] && this.buttons[name].moveToNormal()
                    }
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this._pullInAllButtons(this.buttons.head);
                    this.buttons.head.moveToTop();
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this._pullInAllButtons(this.buttons.rightArm);
                    this.buttons.rightArm.moveToTop();
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this._pullInAllButtons(this.buttons.leftArm);
                    this.buttons.leftArm.moveToTop();
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this._pullInAllButtons(this.buttons.torso);
                    this.buttons.torso.moveToTop();
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this._pullInAllButtons(this.buttons.feet);
                    this.buttons.feet.moveToTop()
            }
        },

        _pullInAllButtons: function (keepButton) {
            var other = null;
            for (var name in this.buttons) {
                (other = this.buttons[name]) && other != keepButton && other.hideButton()
            }
        },

        _setText: function (itemID) {
            var text = ig.lang.get("sc.gui.menu.equip.nothing"),
                description = "",
                level = -1,
                isScalable = false;
            if (itemID > 0) {
                var item = sc.inventory.getItem(itemID);
                var icon = (item.icon || "item-default") + sc.inventory.getRaritySuffix(item.rarity || 0);
                text = "\\i[" + icon + "]" + ig.LangLabel.getText(item.name);
                description = new ig.LangLabel(item.description);
                level = item.level || 1;
                isScalable = item.isScalable || false
            }
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this.buttons.head.setData(text, description, level, isScalable);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this.buttons.rightArm.setData(text, description, level, isScalable);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this.buttons.leftArm.setData(text, description, level, isScalable);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this.buttons.torso.setData(text, description, level, isScalable);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this.buttons.feet.setData(text, description, level, isScalable)
            }
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SELECTED_BODYPART) {
                    if (menu.currentBodyPart != menu.previousBodyPart) {
                        ig.interact.setBlockDelay(0.2);
                        this._moveButtons(menu.currentBodyPart)
                    }
                } else if (event == sc.MENU_EVENT.EQUIP_CHANGED) {
                    this._setText(data)
                }
            }
        }
    });

    sc.EquipBodyPartContainer.Entry = ig.GuiElementBase.extend({
        numberGfx: new ig.Image("media/gui/menu.png"),
        text: null,
        button: null,
        defaultPosition: Vec2.createC(0, 0),
        _isActiveTop: false,
        _hidden: false,
        topY: 1,
        bottomY: 1,
        level: -1,
        isScalable: false,

        init: function (name, item, x, y, button, topY) {
            this.parent();
            this.setSize(150, 33);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.defaultPosition.x = x;
            this.defaultPosition.y = y;
            this.topY = topY || 1;
            this.setPos(this.defaultPosition.x, this.defaultPosition.y);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(160 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            var iconLabel = null;
            if (item) {
                iconLabel = "\\i[" + ((item.icon || "item-default") + sc.inventory.getRaritySuffix(item.rarity || 0)) + "]" + ig.LangLabel.getText(item.name);
                this.level = item.level || 1;
                this.isScalable = item.isScalable || false
            } else {
                iconLabel = ig.lang.get("sc.gui.menu.equip.nothing");
                this.level = -1;
                this.isScalable = false
            }
            this.text = new sc.TextGui(name, {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            this.text.setPos(2, 0);
            this.addChildGui(this.text);
            this.button = new sc.BodyPartButton(iconLabel, 150, sc.BUTTON_TYPE.DEFAULT, button, true);
            this.button.textChild.setDrawCallback(function (x, y) {
                this.level <= 0 || sc.MenuHelper.drawLevel(this.level, x, y, this.numberGfx, this.isScalable)
            }.bind(this));
            this.button.callback = button.callback;
            button.otherButton = this.button;
            this.button.setPos(0, 10);
            this.addChildGui(this.button);
            this.bottomY = this.hook.pos.y;
            item && this.button.setData(new ig.LangLabel(item.description));
            this.doStateTransition("DEFAULT", true)
        },

        setData: function (name, description, level, isScalable) {
            this.level = level;
            this.isScalable = isScalable;
            this.button.textChild.setText(name);
            this.button.setData(description)
        },

        moveToNormal: function () {
            this._isActiveTop = false;
            if (this._hidden) {
                this.setPos(this.hook.pos.x, this.bottomY);
                this.doStateTransition("DEFAULT");
                this._hidden = false
            } else {
                this.doPosTranstition(this.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.EASE)
            }
            this.button.setPressed(false)
        },

        moveToBottom: function () {
            if (this._isActiveTop) {
                this._isActiveTop = false;
                if (this._hidden) {
                    this.setPos(this.hook.pos.x, this.bottomY);
                    this.doStateTransition("DEFAULT");
                    this._hidden = false
                } else {
                    this.doPosTranstition(this.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.EASE)
                }
            }
        },

        moveToTop: function () {
            if (!this._isActiveTop) {
                this._isActiveTop = true;
                if (this._hidden) {
                    this.setPos(this.hook.pos.x, this.bottomY - this.topY);
                    this.doStateTransition("DEFAULT");
                    this._hidden = false
                } else {
                    this.doPosTranstition(this.hook.pos.x, this.hook.pos.y - this.topY, 0.1, KEY_SPLINES.EASE)
                }
            }
        },

        reset: function () {
            this.doStateTransition("DEFAULT", true);
            this._isActiveTop = this._hidden = false;
            this.setPos(this.hook.pos.x, this.bottomY);
            this.button.setPressed(false)
        },

        hideButton: function () {
            this.doStateTransition("HIDDEN");
            this._hidden = true;
            this._isActiveTop = false;
            this.button.setPressed(false)
        },

        showButton: function () {
            this.doStateTransition("DEFAULT");
            this._hidden = false
        }
    })
});
ig.baked = !0;
