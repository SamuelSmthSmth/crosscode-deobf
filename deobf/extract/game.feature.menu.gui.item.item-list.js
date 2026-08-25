ig.module("game.feature.menu.gui.item.item-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-sort-menu").defines(function() {
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
        init: function() {
            this.parent();
            this.setSize(340, 260);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(sc.options.hdMode ? 25 : 2, 27);
            this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
            this.errorSound = sc.BUTTON_SOUND.denied;
            this.toggleOnSound = sc.BUTTON_SOUND.toggle_on;
            this.toggleOffSound =
                sc.BUTTON_SOUND.toggle_off;
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
            this.tabGroup.addPressCallback(function(a) {
                if (this._prevPressed != a) {
                    this.submitSound.play();
                    this._prevPressed = a;
                    a.setPressed(true);
                    this._resetButtons(a);
                    this._rearrangeTabs();
                    sc.menu.itemLastButtonData = a.data;
                    for (var b = this.tabArray.length; b--;)
                        if (a ==
                            this.tabArray[b]) {
                            sc.menu.setItemTab(b);
                            break
                        }
                }
            }.bind(this));
            this.tabGroup.addSelectionCallback(function() {
                sc.menu.setInfoText("");
                sc.menu.setBuffText("", true)
            });
            this.tabGroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true)
            });
            var b = new sc.MenuPanel;
            b.setSize(340, 244);
            b.setPos(0, 21);
            this.addChildGui(b);
            this.list = new sc.MultiColumnItemListBox(1, 168, sc.LIST_COLUMNS.TWO, 1);
            this.list.setPos(0, 29);
            this.list.setSize(340, 230);
            this.list.setSelectState("HIDDEN",
                true);
            this.list.list.onGetHeightAtIndex = this.onGetHeightAtIndex.bind(this);
            this.addChildGui(this.list);
            this._bgRev = this.list.buttonGroup();
            this._bgRev.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
            this._bgRev.addSelectionCallback(function(a) {
                if (a.data) {
                    this._curElement = a;
                    sc.menu.setInfoText(a.data.description ? a.data.description : a.data);
                    if (a.data.id) {
                        sc.menu.setItemInfo(a.data.id);
                        var b = sc.inventory.getItemName(a.data.id) + " [Description]";
                        ig.langEdit.submitCustomFile(b, new ig.LangLabel(sc.inventory.getItem(a.data.id).description),
                            "data/item-database.json", true);
                        sc.inventory.isBuffID(a.data.id) ? sc.menu.setBuffText(sc.inventory.getBuffString(a.data.id), false, a.data.id) : sc.menu.setBuffText("", false)
                    }
                }
            }.bind(this));
            this._bgRev.addPressCallback(this.onItemButtonPressed.bind(this));
            this._bgRev.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true);
                this._curElement = null
            }.bind(this));
            this._bgRev.onButtonTraversal = this.onButtonTraversal.bind(this);
            b = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            b.setPos(0,
                21);
            this.addChildGui(b);
            b = new ig.ColorGui("#FF6D00", 335, 1);
            b.setPos(5, 21);
            this.addChildGui(b);
            this.tabs.news = this._createTabButton("news", "item-news", 0, "NEW");
            this.tabs.items = this._createTabButton("items", "item-items", 1, sc.ITEMS_TYPES.CONS);
            this.tabs.arms = this._createTabButton("arms", "item-sword", 2, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.ARM);
            this.tabs.head = this._createTabButton("head", "item-helm", 3, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.HEAD);
            this.tabs.torso = this._createTabButton("torso", "item-belt",
                4, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.TORSO);
            this.tabs.feet = this._createTabButton("feet", "item-shoe", 5, sc.ITEMS_TYPES.EQUIP, sc.ITEMS_EQUIP_TYPES.FEET);
            this.tabs.trade = this._createTabButton("trade", "item-trade", 6, sc.ITEMS_TYPES.TRADE);
            this.tabs.keys = this._createTabButton("keys", "item-key", 7, sc.ITEMS_TYPES.KEY);
            if (sc.model.player.hasAnyToggleItems()) this.tabs.toggle = this._createTabButton("toggle", "item-toggle", 8, sc.ITEMS_TYPES.TOGGLE);
            sc.menu.itemLastButtonData = this.tabs.items.data;
            for (b = 0; b <
                this.tabArray.length; b++) this._lastCursorPos[b] = {
                x: 0,
                y: 0,
                scroll: 0
            };
            this.tabGroup.setCurrentFocus(1, 0);
            this.tabs.items.setPressed(true);
            this._prevPressed = this.tabs.items;
            this._rearrangeTabs();
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            this._refocusFromCycle = -1;
            ig.interact.setBlockDelay(0.2);
            var b = sc.menu.itemLastButtonData;
            if (b) {
                this._refocusFromCycle = sc.menu.itemCurrentTab;
                this._createList(b.type, b.subType, true, ig.input.mouseGuiActive, true)
            }
            this.list.activate();
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            var b = sc.menu.itemCurrentTab;
            this._lastCursorPos[b].x = this._bgRev.current.x;
            this._lastCursorPos[b].y = this._bgRev.current.y;
            this._lastCursorPos[b].scroll = this.list.list.box.hook.scroll.y;
            this.list.deactivate();
            sc.menu.setInfoText("", false);
            sc.menu.setBuffText("",
                false);
            this.doStateTransition("HIDDEN")
        },
        setFavorite: function() {
            if (this._curElement && sc.menu.itemCurrentTab == 1)
                if (sc.model.player.canAddFavorite() || sc.model.player.isFavorite(this._curElement.data.id)) {
                    this.favSound && this.favSound.play();
                    sc.model.player.updateFavorite(this._curElement.data.id) ? this._addFavoriteOverlay(this._curElement) : this._removeFavoriteOverlay(this._curElement)
                } else this.errorSound.play();
            else {
                this.submitSound.play();
                var b = ig.lang.get("sc.gui.menu.help-texts.inventory.title-2") +
                    "\n\n" + ig.lang.get("sc.gui.menu.help-texts.inventory.text-2"),
                    b = new sc.CenterMsgBoxGui(b, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                b.hook.zIndex = 15E4;
                b.hook.pauseGui = true;
                ig.gui.addGuiElement(b)
            }
        },
        onGetHeightAtIndex: function(b, a) {
            if (sc.menu.itemCurrentTab != 8) return b.getHeightAtIndex(a, true);
            var d = this._bgRev.getYElementAt(a);
            d || (d = this._bgRev.getElementAt(this._bgRev.current.x - 1, a));
            var c = 0;
            a >= 0 && d && (c = c + (d.setGui.hook.pos.y + d.hook.pos.y + d.hook.size.y));
            return c
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() ||
                sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },
        onButtonTraversal: function() {
            if (sc.menu.itemCurrentTab == -1) sc.menu.itemCurrentTab = 1;
            var b = sc.menu.itemCurrentTab,
                a = this.tabArray[b],
                d = -1;
            sc.control.menuCircleRight() ? d = 1 : sc.control.menuCircleLeft() && (d = 0);
            if (d >= 0) {
                this.submitSound.play();
                a.setPressed(false);
                this._lastCursorPos[b].x = this._bgRev.current.x;
                this._lastCursorPos[b].y = this._bgRev.current.y;
                this._lastCursorPos[b].scroll = this.list.list.box.hook.scroll.y;
                if (d == 1) {
                    b++;
                    b >= this.tabArray.length && (b = 0)
                } else {
                    b--;
                    b < 0 && (b = this.tabArray.length - 1)
                }
                this._refocusFromCycle = b;
                this._prevPressed = a = this.tabArray[b];
                a.setPressed(true);
                this._resetButtons(a, true);
                this._rearrangeTabs();
                sc.menu.itemLastButtonData = a.data;
                sc.menu.setItemTab(b)
            }
        },
        onItemButtonPressed: function(b) {
            if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.TOGGLE) {
                var a = sc.model.player.toggleItem(b.data.id, b.set);
                a ? this.toggleOnSound.play() :
                    this.toggleOffSound.play();
                a ? b.setGui.updateTogglesStates(b) : b.setGui.updateTogglesStates()
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    b = sc.menu.itemLastButtonData;
                    this._createList(b.type, b.subType, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive)
                } else if (a == sc.MENU_EVENT.SORT_LIST) {
                b = sc.menu.itemLastButtonData;
                this._createList(b.type, b.subType, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, d.data.sortType)
            }
        },
        getCurrentSortText: function() {
            var b =
                "auto";
            switch (this.sortTypes[sc.menu.itemLastButtonData.subType || sc.menu.itemLastButtonData.type] || sc.SORT_TYPE.ORDER) {
                case sc.SORT_TYPE.ORDER:
                    b = "auto";
                    break;
                case sc.SORT_TYPE.NAME:
                    b = "name";
                    break;
                case sc.SORT_TYPE.AMOUNT:
                    b = "amount";
                    break;
                case sc.SORT_TYPE.RARITY:
                    b = "rarity"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
        },
        _createList: function(b, a, d, c, e, f) {
            d = d || false;
            c = c || false;
            e = e || false;
            this.sortTypes[a || b] != void 0 ? f == void 0 ? f = this.sortTypes[a || b] : this.sortTypes[a || b] = f : this.sortTypes[a || b] = f || sc.SORT_TYPE.ORDER;
            var g = 0,
                h = 0,
                i = sc.model.player;
            this._bgRev.clear();
            this.list.clear(d);
            var j = null,
                k = -1,
                l = -1;
            if (b == "NEW") j = i.getNewItemList();
            else if (a)
                if (b == sc.ITEMS_TYPES.EQUIP) {
                    j = i.getEquipSubList(a, true, f || sc.SORT_TYPE.ORDER);
                    switch (a) {
                        case sc.ITEMS_EQUIP_TYPES.HEAD:
                            k = i.equip.head;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.ARM:
                            k = i.equip.leftArm;
                            l = i.equip.rightArm;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.TORSO:
                            k = i.equip.torso;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.FEET:
                            k = i.equip.feet
                    }
                } else throw Error("Only equip can have a subType! [type: " +
                    b + ", subType: " + a + "]");
            else j = i.getItemSubList(b, f || sc.SORT_TYPE.ORDER);
            var o = null,
                a = null,
                m = 0,
                n = b == sc.ITEMS_TYPES.TOGGLE;
            if (n) {
                this.list.setQuantityState("HIDDEN");
                b = i.toggleSets;
                this.list.list.columns = 1;
                this.list.list.paddingTop = 1;
                var j = 0,
                    k = {
                        counter: 0
                    },
                    p;
                for (p in b) {
                    l = b[p];
                    k.counter = 0;
                    if (i.hasAnySetItem(l)) {
                        l = new sc.ToggleSet(l, this.list, j, k);
                        this.list.addButton(l, true);
                        j = j + Math.ceil(k.counter / 2)
                    }
                }
                this.list.list.paddingTop = 1;
                this.list.list.columns = 2;
                this._bgRev.fillEmptySpace()
            } else {
                this.list.setQuantityState("DEFAULT");
                for (p = 0; p < j.length; p++) {
                    var m = i.items[j[p]] || 0,
                        a = sc.inventory.getItem(j[p]),
                        o = new ig.LangLabel(a.name),
                        o = n ? "\\i[" + (i.getToggleItemState(j[p]) ? "toggle-item-on" : "toggle-item-off") + "]" : "\\i[" + (a.icon + sc.inventory.getRaritySuffix(a.rarity || 0) || "item-default") + "]",
                        o = o + ig.LangLabel.getText(a.name),
                        r = ig.LangLabel.getText(a.description),
                        t = 0;
                    b == sc.ITEMS_TYPES.EQUIP && (t = a.level || 1);
                    k == j[p] && (m = m + 1);
                    l == j[p] && (m = m + 1);
                    o = n ? new sc.ItemBoxButton(o, 142, 24, -1, j[p], r, true, void 0, void 0, void 0, t) : new sc.ItemBoxButton(o,
                        142, 26, m, j[p], r, void 0, void 0, void 0, void 0, t);
                    if (m == 0 && b == "NEW" && a.equipType && i.isEquipped(j[p])) {
                        m = i.getItemAmountWithEquip(j[p]);
                        o.amount.setNumber(m, true);
                        this._addEquipOverlay(o, 1)
                    }
                    m == 0 && o.setActive(false);
                    o.button.submitSound = null;
                    if (j[p] == k || j[p] == l) {
                        this._addEquipOverlay(o, k);
                        this._addEquipOverlay(o, l)
                    }
                    i.isFavorite(j[p]) && this._addFavoriteOverlay(o);
                    this.list.addButton(o)
                }
            }
            if (d) {
                d = 0;
                if (f == void 0) {
                    if (this._refocusFromCycle >= 0) {
                        f = this._lastCursorPos[this._refocusFromCycle];
                        this._refocusFromCycle = -1;
                        if (this._bgRev.isPositionValid(f.x, f.y)) {
                            d = f.x;
                            g = f.y;
                            h = -f.scroll
                        } else h = g = d = 0
                    }
                } else h = g = 0;
                this.list.list._prevIndex = g;
                c ? this._bgRev.setCurrentFocus(d, g) : this._bgRev.focusCurrentButton(d, g, false, e);
                this.list.scrollToY(h, true)
            }
        },
        addEmpty: function() {},
        _createTabButton: function(b, a, d, c, e) {
            b = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.item." + b), a);
            b.setPos(0, 2);
            b.setData({
                type: c,
                subType: e || null,
                description: null
            });
            this.addChildGui(b);
            this.tabGroup.addFocusGui(b, d, 0);
            return this.tabArray[d] =
                b
        },
        _resetButtons: function(b, a) {
            for (var d = 0; d < this.tabArray.length; d++) {
                b != this.tabArray[d] && this.tabArray[d].setPressed(false);
                if (a) this.tabArray[d].focus = false
            }
        },
        _rearrangeTabs: function() {
            for (var b = 8, a = null, d = 0; d < this.tabArray.length; d++) {
                a = this.tabArray[d];
                a.hook.pos.x = b;
                b = b + a.hook.size.x
            }
        },
        _addEquipOverlay: function(b, a) {
            if (a >= 0) {
                var d = new ig.ImageGui(this.gfx, 112, 480, 19, 16);
                b.addChildGui(d)
            }
        },
        _addFavoriteOverlay: function(b) {
            var a = new ig.ImageGui(this.gfx, 256, 480, 19, 17);
            a.setPos(0, 0);
            b.addChildGui(a)
        },
        _removeFavoriteOverlay: function(b) {
            b.removeChildGuiByIndex(b.hook.children.length - 1)
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
        init: function(b, a, d, c, e) {
            this.parent(true, true);
            this._smallWidth = c || 28;
            this._largeWidth =
                d || 106;
            this.setSize(this._smallWidth, 20);
            this.text = b || "";
            this.icon = a || "item-default";
            this.noIcon = e || false;
            this.textChild = new sc.TextGui(this.getButtonText(), {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.textChild.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.textChild.setPos(8, 0);
            this.addChildGui(this.textChild)
        },
        setData: function(b) {
            if (b != void 0) this.data = b
        },
        getButtonText: function() {
            return this.pressed ? this.noIcon ? this.text : "\\i[" + this.icon + "]" + this.text : this.noIcon ? this.icon : "\\i[" + this.icon +
                "]"
        },
        setText: function(b) {
            this.text = b;
            this.textChild.setText(b)
        },
        setWidthToTextSize: function() {
            this._largeWidth = this.textChild.hook.size.x + 16;
            this.hook.size.x = this.pressed ? this._largeWidth : this._smallWidth
        },
        updateDrawables: function(b) {
            var a = "default";
            this.keepPressed && this.pressed ? a = "pressed" : this.focus && (a = "focus");
            this.ninepatch.draw(b, this.hook.size.x, this.hook.size.y, a)
        },
        setPressed: function(b) {
            var a = this.pressed;
            this.parent(b);
            if (a != this.pressed) {
                this.textChild.setText(this.getButtonText());
                this.hook.size.x =
                    this.pressed ? this._largeWidth : this._smallWidth;
                this.onPressedChange(this.pressed)
            }
        },
        onPressedChange: function() {}
    })
});
ig.baked = !0;
