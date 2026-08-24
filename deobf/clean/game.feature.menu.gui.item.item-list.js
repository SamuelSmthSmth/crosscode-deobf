/**
 * game.feature.menu.gui.item.item-list
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-list")`.
 *
 * `sc.ItemTabbedBox`: the item list with its tab bar (NEW, consumables, the
 * four equip types, trade, keys and optionally toggles). Handles tab
 * switching, per-tab sort types, cursor memory per tab, equip/favorite
 * overlays and the toggle-item set view. `sc.ItemTabbedBox.TabButton` is a
 * single tab that expands to show its icon + label when pressed.
 */
ig.module("game.feature.menu.gui.item.item-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-sort-menu")
    .defines(function () {

    sc.ItemTabbedBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        list: null,
        tabs: {
            news: null,
            items: null,
            arms: null,
            head: null,
            torso: null,
            feet: null,
            trade: null,
            keys: null
        },
        sortTypes: {},
        tabArray: [],
        buttonGroup: null,
        tabGroup: null,
        submitSound: null,
        favSound: null,
        errorSound: null,
        toggleOnSound: null,
        toggleOffSound: null,
        _prevPressed: null,
        _refocusFromCycle: -1,
        _lastCursorPos: [],
        _bgRev: null,
        _curElement: -1,

        init: function () {
            this.parent();
            this.setSize(340, 260);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(sc.options.hdMode ? 25 : 2, 27);
            this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
            this.errorSound = sc.BUTTON_SOUND.denied;
            this.toggleOnSound = sc.BUTTON_SOUND.toggle_on;
            this.toggleOffSound = sc.BUTTON_SOUND.toggle_off;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(340 / 3 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.tabGroup = new sc.ButtonGroup;
            this.tabGroup.addPressCallback(function (tab) {
                if (this._prevPressed != tab) {
                    this.submitSound.play();
                    this._prevPressed = tab;
                    tab.setPressed(true);
                    this._resetButtons(tab);
                    this._rearrangeTabs();
                    sc.menu.itemLastButtonData = tab.data;
                    for (var index = this.tabArray.length; index--;) {
                        if (tab == this.tabArray[index]) {
                            sc.menu.setItemTab(index);
                            break
                        }
                    }
                }
            }.bind(this));
            this.tabGroup.addSelectionCallback(function () {
                sc.menu.setInfoText("");
                sc.menu.setBuffText("", true)
            });
            this.tabGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true)
            });
            var panel = new sc.MenuPanel;
            panel.setSize(340, 244);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            this.list = new sc.MultiColumnItemListBox(1, 168, sc.LIST_COLUMNS.TWO, 1);
            this.list.setPos(0, 29);
            this.list.setSize(340, 230);
            this.list.setSelectState("HIDDEN", true);
            this.list.list.onGetHeightAtIndex = this.onGetHeightAtIndex.bind(this);
            this.addChildGui(this.list);
            this._bgRev = this.list.buttonGroup();
            this._bgRev.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
            this._bgRev.addSelectionCallback(function (entry) {
                if (entry.data) {
                    this._curElement = entry;
                    sc.menu.setInfoText(entry.data.description ? entry.data.description : entry.data);
                    if (entry.data.id) {
                        sc.menu.setItemInfo(entry.data.id);
                        var fileName = sc.inventory.getItemName(entry.data.id) + " [Description]";
                        ig.langEdit.submitCustomFile(fileName, new ig.LangLabel(sc.inventory.getItem(entry.data.id).description), "data/item-database.json", true);
                        sc.inventory.isBuffID(entry.data.id) ? sc.menu.setBuffText(sc.inventory.getBuffString(entry.data.id), false, entry.data.id) : sc.menu.setBuffText("", false)
                    }
                }
            }.bind(this));
            this._bgRev.addPressCallback(this.onItemButtonPressed.bind(this));
            this._bgRev.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true);
                this._curElement = null
            }.bind(this));
            this._bgRev.onButtonTraversal = this.onButtonTraversal.bind(this);
            panel = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            panel = new ig.ColorGui("#FF6D00", 335, 1);
            panel.setPos(5, 21);
            this.addChildGui(panel);
            this.tabs.news = this._createTabButton("news", "item-news", 0, "NEW");
            this.tabs.items = this._createTabButton("items", "item-items", 1, sc.ITEMS_TYPES.CONS);
            this.tabs.arms = this._createTabButton("arms", "item-sword", 2, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.ARM);
            this.tabs.head = this._createTabButton("head", "item-helm", 3, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.HEAD);
            this.tabs.torso = this._createTabButton("torso", "item-belt", 4, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.TORSO);
            this.tabs.feet = this._createTabButton("feet", "item-shoe", 5, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.FEET);
            this.tabs.trade = this._createTabButton("trade", "item-trade", 6, sc.ITEMS_TYPES.TRADE);
            this.tabs.keys = this._createTabButton("keys", "item-key", 7, sc.ITEMS_TYPES.KEY);
            if (sc.model.player.hasAnyToggleItems()) {
                this.tabs.toggle = this._createTabButton("toggle", "item-toggle", 8, sc.ITEMS_TYPES.TOGGLE)
            }
            sc.menu.itemLastButtonData = this.tabs.items.data;
            for (var index = 0; index < this.tabArray.length; index++) {
                this._lastCursorPos[index] = {
                    x: 0,
                    y: 0,
                    scroll: 0
                }
            }
            this.tabGroup.setCurrentFocus(1, 0);
            this.tabs.items.setPressed(true);
            this._prevPressed = this.tabs.items;
            this._rearrangeTabs();
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            this._refocusFromCycle = -1;
            ig.interact.setBlockDelay(0.2);
            var tabData = sc.menu.itemLastButtonData;
            if (tabData) {
                this._refocusFromCycle = sc.menu.itemCurrentTab;
                this._createList(tabData.type, tabData.subType, true, ig.input.mouseGuiActive, true)
            }
            this.list.activate();
            this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            var tab = sc.menu.itemCurrentTab;
            this._lastCursorPos[tab].x = this._bgRev.current.x;
            this._lastCursorPos[tab].y = this._bgRev.current.y;
            this._lastCursorPos[tab].scroll = this.list.list.box.hook.scroll.y;
            this.list.deactivate();
            sc.menu.setInfoText("", false);
            sc.menu.setBuffText("", false);
            this.doStateTransition("HIDDEN")
        },

        setFavorite: function () {
            if (this._curElement && sc.menu.itemCurrentTab == 1) {
                if (sc.model.player.canAddFavorite() || sc.model.player.isFavorite(this._curElement.data.id)) {
                    this.favSound && this.favSound.play();
                    sc.model.player.updateFavorite(this._curElement.data.id) ? this._addFavoriteOverlay(this._curElement) : this._removeFavoriteOverlay(this._curElement)
                } else {
                    this.errorSound.play()
                }
            } else {
                this.submitSound.play();
                var message = ig.lang.get("sc.gui.menu.help-texts.inventory.title-2") + "\n\n" + ig.lang.get("sc.gui.menu.help-texts.inventory.text-2"),
                    msgBox = new sc.CenterMsgBoxGui(message, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                msgBox.hook.zIndex = 15E4;
                msgBox.hook.pauseGui = true;
                ig.gui.addGuiElement(msgBox)
            }
        },

        onGetHeightAtIndex: function (list, index) {
            if (sc.menu.itemCurrentTab != 8) return list.getHeightAtIndex(index, true);
            var element = this._bgRev.getYElementAt(index);
            element || (element = this._bgRev.getElementAt(this._bgRev.current.x - 1, index));
            var height = 0;
            index >= 0 && element && (height = height + (element.setGui.hook.pos.y + element.hook.pos.y + element.hook.size.y));
            return height
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },

        onButtonTraversal: function () {
            if (sc.menu.itemCurrentTab == -1) {
                sc.menu.itemCurrentTab = 1
            }
            var tab = sc.menu.itemCurrentTab,
                tabButton = this.tabArray[tab],
                direction = -1;
            sc.control.menuCircleRight() ? direction = 1 : sc.control.menuCircleLeft() && (direction = 0);
            if (direction >= 0) {
                this.submitSound.play();
                tabButton.setPressed(false);
                this._lastCursorPos[tab].x = this._bgRev.current.x;
                this._lastCursorPos[tab].y = this._bgRev.current.y;
                this._lastCursorPos[tab].scroll = this.list.list.box.hook.scroll.y;
                if (direction == 1) {
                    tab++;
                    tab >= this.tabArray.length && (tab = 0)
                } else {
                    tab--;
                    tab < 0 && (tab = this.tabArray.length - 1)
                }
                this._refocusFromCycle = tab;
                this._prevPressed = tabButton = this.tabArray[tab];
                tabButton.setPressed(true);
                this._resetButtons(tabButton, true);
                this._rearrangeTabs();
                sc.menu.itemLastButtonData = tabButton.data;
                sc.menu.setItemTab(tab)
            }
        },

        onItemButtonPressed: function (entry) {
            if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TOGGLE) {
                var turnedOn = sc.model.player.toggleItem(entry.data.id, entry.set);
                turnedOn ? this.toggleOnSound.play() : this.toggleOffSound.play();
                turnedOn ? entry.setGui.updateTogglesStates(entry) : entry.setGui.updateTogglesStates()
            }
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    var tabData = sc.menu.itemLastButtonData;
                    this._createList(tabData.type, tabData.subType, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive)
                } else if (event == sc.MENU_EVENT.SORT_LIST) {
                    tabData = sc.menu.itemLastButtonData;
                    this._createList(tabData.type, tabData.subType, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, data.data.sortType)
                }
            }
        },

        getCurrentSortText: function () {
            var text = "auto";
            switch (this.sortTypes[sc.menu.itemLastButtonData.subType || sc.menu.itemLastButtonData.type] || sc.SORT_TYPE.ORDER) {
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
                    text = "rarity"
            }
            return ig.lang.get("sc.gui.menu.sort." + text)
        },

        _createList: function (type, subType, focus, setFocus, callRefocus, sortType) {
            focus = focus || false;
            setFocus = setFocus || false;
            callRefocus = callRefocus || false;
            if (this.sortTypes[subType || type] != void 0) {
                if (sortType == void 0) {
                    sortType = this.sortTypes[subType || type]
                } else {
                    this.sortTypes[subType || type] = sortType
                }
            } else {
                this.sortTypes[subType || type] = sortType || sc.SORT_TYPE.ORDER
            }
            var focusIndex = 0,
                scrollPos = 0,
                player = sc.model.player;
            this._bgRev.clear();
            this.list.clear(focus);
            var items = null,
                equipID = -1,
                equipID2 = -1;
            if (type == "NEW") {
                items = player.getNewItemList()
            } else if (subType) {
                if (type == sc.ITEMS_TYPES.EQUIP) {
                    items = player.getEquipSubList(subType, true, sortType || sc.SORT_TYPE.ORDER);
                    switch (subType) {
                        case sc.ITEMS_EQUIP_TYPES.HEAD:
                            equipID = player.equip.head;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.ARM:
                            equipID = player.equip.leftArm;
                            equipID2 = player.equip.rightArm;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.TORSO:
                            equipID = player.equip.torso;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.FEET:
                            equipID = player.equip.feet
                    }
                } else {
                    throw Error("Only equip can have a subType! [type: " + type + ", subType: " + subType + "]")
                }
            } else {
                items = player.getItemSubList(type, sortType || sc.SORT_TYPE.ORDER)
            }
            var item = null,
                button = null,
                counter = 0,
                isToggle = type == sc.ITEMS_TYPES.TOGGLE;
            if (isToggle) {
                this.list.setQuantityState("HIDDEN");
                type = player.toggleSets;
                this.list.list.columns = 1;
                this.list.list.paddingTop = 1;
                var rowIndex = 0,
                    toggleState = {
                        counter: 0
                    },
                    setKey;
                for (setKey in type) {
                    var toggleSet = type[setKey];
                    toggleState.counter = 0;
                    if (player.hasAnySetItem(toggleSet)) {
                        toggleSet = new sc.ToggleSet(toggleSet, this.list, rowIndex, toggleState);
                        this.list.addButton(toggleSet, true);
                        rowIndex = rowIndex + Math.ceil(toggleState.counter / 2)
                    }
                }
                this.list.list.paddingTop = 1;
                this.list.list.columns = 2;
                this._bgRev.fillEmptySpace()
            } else {
                this.list.setQuantityState("DEFAULT");
                for (var index = 0; index < items.length; index++) {
                    var amount = player.items[items[index]] || 0,
                        itemData = sc.inventory.getItem(items[index]),
                        label = new ig.LangLabel(itemData.name),
                        label = isToggle ? "\\i[" + (player.getToggleItemState(items[index]) ? "toggle-item-on" : "toggle-item-off") + "]" : "\\i[" + (itemData.icon + sc.inventory.getRaritySuffix(itemData.rarity || 0) || "item-default") + "]",
                        label = label + ig.LangLabel.getText(itemData.name),
                        description = ig.LangLabel.getText(itemData.description),
                        level = 0;
                    type == sc.ITEMS_TYPES.EQUIP && (level = itemData.level || 1);
                    equipID == items[index] && (amount = amount + 1);
                    equipID2 == items[index] && (amount = amount + 1);
                    button = isToggle ? new sc.ItemBoxButton(label, 142, 24, -1, items[index], description, true, void 0, void 0, void 0, level) : new sc.ItemBoxButton(label, 142, 26, amount, items[index], description, void 0, void 0, void 0, void 0, level);
                    if (amount == 0 && type == "NEW" && itemData.equipType && player.isEquipped(items[index])) {
                        amount = player.getItemAmountWithEquip(items[index]);
                        button.amount.setNumber(amount, true);
                        this._addEquipOverlay(button, 1)
                    }
                    amount == 0 && button.setActive(false);
                    button.button.submitSound = null;
                    if (items[index] == equipID || items[index] == equipID2) {
                        this._addEquipOverlay(button, equipID);
                        this._addEquipOverlay(button, equipID2)
                    }
                    player.isFavorite(items[index]) && this._addFavoriteOverlay(button);
                    this.list.addButton(button)
                }
            }
            if (focus) {
                var startIndex = 0;
                if (sortType == void 0) {
                    if (this._refocusFromCycle >= 0) {
                        sortType = this._lastCursorPos[this._refocusFromCycle];
                        this._refocusFromCycle = -1;
                        if (this._bgRev.isPositionValid(sortType.x, sortType.y)) {
                            startIndex = sortType.x;
                            focusIndex = sortType.y;
                            scrollPos = -sortType.scroll
                        } else {
                            scrollPos = focusIndex = startIndex = 0
                        }
                    }
                } else {
                    scrollPos = focusIndex = 0
                }
                this.list.list._prevIndex = focusIndex;
                setFocus ? this._bgRev.setCurrentFocus(startIndex, focusIndex) : this._bgRev.focusCurrentButton(startIndex, focusIndex, false, callRefocus);
                this.list.scrollToY(scrollPos, true)
            }
        },

        addEmpty: function () {},

        _createTabButton: function (key, icon, index, type, subType) {
            var tab = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.item." + key), icon);
            tab.setPos(0, 2);
            tab.setData({
                type: type,
                subType: subType || null,
                description: null
            });
            this.addChildGui(tab);
            this.tabGroup.addFocusGui(tab, index, 0);
            return this.tabArray[index] = tab
        },

        _resetButtons: function (keepPressed, clearFocus) {
            for (var index = 0; index < this.tabArray.length; index++) {
                keepPressed != this.tabArray[index] && this.tabArray[index].setPressed(false);
                if (clearFocus) {
                    this.tabArray[index].focus = false
                }
            }
        },

        _rearrangeTabs: function () {
            for (var posX = 8, tab = null, index = 0; index < this.tabArray.length; index++) {
                tab = this.tabArray[index];
                tab.hook.pos.x = posX;
                posX = posX + tab.hook.size.x
            }
        },

        _addEquipOverlay: function (button, equipID) {
            if (equipID >= 0) {
                var overlay = new ig.ImageGui(this.gfx, 112, 480, 19, 16);
                button.addChildGui(overlay)
            }
        },

        _addFavoriteOverlay: function (button) {
            var overlay = new ig.ImageGui(this.gfx, 256, 480, 19, 17);
            overlay.setPos(0, 0);
            button.addChildGui(overlay)
        },

        _removeFavoriteOverlay: function (button) {
            button.removeChildGuiByIndex(button.hook.children.length - 1)
        }
    });

    sc.ItemTabbedBox.TabButton = ig.FocusGui.extend({
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 15,
            height: 0,
            left: 9,
            top: 20,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 92
                },
                focus: {
                    x: 32,
                    y: 92
                },
                pressed: {
                    x: 64,
                    y: 92
                }
            }
        }),
        text: "",
        icon: "item-default",
        data: null,
        noIcon: false,
        textChild: null,
        iconChild: null,
        _smallWidth: 28,
        _largeWidth: 106,

        init: function (text, icon, largeWidth, smallWidth, noIcon) {
            this.parent(true, true);
            this._smallWidth = smallWidth || 28;
            this._largeWidth = largeWidth || 106;
            this.setSize(this._smallWidth, 20);
            this.text = text || "";
            this.icon = icon || "item-default";
            this.noIcon = noIcon || false;
            this.textChild = new sc.TextGui(this.getButtonText(), {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.textChild.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.textChild.setPos(8, 0);
            this.addChildGui(this.textChild)
        },

        setData: function (data) {
            if (data != void 0) {
                this.data = data
            }
        },

        getButtonText: function () {
            return this.pressed ? this.noIcon ? this.text : "\\i[" + this.icon + "]" + this.text : this.noIcon ? this.icon : "\\i[" + this.icon + "]"
        },

        setText: function (text) {
            this.text = text;
            this.textChild.setText(text)
        },

        setWidthToTextSize: function () {
            this._largeWidth = this.textChild.hook.size.x + 16;
            this.hook.size.x = this.pressed ? this._largeWidth : this._smallWidth
        },

        updateDrawables: function (drawables) {
            var state = "default";
            this.keepPressed && this.pressed ? state = "pressed" : this.focus && (state = "focus");
            this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, state)
        },

        setPressed: function (pressed) {
            var wasPressed = this.pressed;
            this.parent(pressed);
            if (wasPressed != this.pressed) {
                this.textChild.setText(this.getButtonText());
                this.hook.size.x = this.pressed ? this._largeWidth : this._smallWidth;
                this.onPressedChange(this.pressed)
            }
        },

        onPressedChange: function () {}
    })
});
ig.baked = !0;
