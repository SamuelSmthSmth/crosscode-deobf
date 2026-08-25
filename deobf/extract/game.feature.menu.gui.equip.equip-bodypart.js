ig.module("game.feature.menu.gui.equip.equip-bodypart").requires("impact.feature.gui.gui", "game.feature.gui.plug-in", "game.feature.menu.gui.equip.equip-misc", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.EquipRightContainer = sc.MenuPanel.extend({
        partChooser: null,
        itemList: null,
        sortTypes: [],
        _itemListActive: false,
        _lastEquipState: false,
        _globalButtons: null,
        _refocusFromCycle: false,
        init: function(b) {
            this.parent();
            this.setSize(170, 264);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(sc.options.hdMode ?
                25 : 2, 28);
            this._globalButtons = b;
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
            this.partChooser = new sc.EquipBodyPartContainer(b);
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
            this.itemList.list.buttonGroup.addSelectionCallback(function(a) {
                if (a.data) {
                    sc.menu.setInfoText(a.data.description ? a.data.description : a.data);
                    if (a.data.id) {
                        ig.input.mouseGuiActive || sc.menu.ensureCurrentValues();
                        sc.menu.setItemInfo(a.data.id)
                    }
                }
            }.bind(this));
            this.itemList.list.buttonGroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            });
            this.itemList.list.buttonGroup.addPressCallback(function(a,
                b) {
                if (a.data && a.data.id) {
                    ig.input.mouseGuiActive || sc.menu.ensureCurrentValues();
                    this._equipItem(a.data.id, b) && sc.BUTTON_SOUND.equip.play();
                    ig.input.mouseGuiActive ? sc.menu.changeEquipOnCurrentBodypart(a.data.id) : this.partChooser._setText(a.data.id)
                }
            }.bind(this));
            this.addChildGui(this.itemList);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            this.parent();
            this._updateItemList()
        },
        _equipItem: function(b, a) {
            var d = sc.model.player.setEquipment(sc.menu.currentBodyPart, b);
            this._makeList(true, a, b);
            return d
        },
        setCurrentBodypartPressed: function() {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var b in this._globalButtons) this.buttons[b] && this.buttons[b].setPressedAndUnFocus(false);
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
        setCurrentBodypartUnpressed: function() {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var b in this._globalButtons) this.buttons[b] && this.buttons[b].setPressedAndUnFocus(false);
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
        _updateItemList: function() {
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
        _activateItemList: function() {
            if (this._itemListActive) {
                ig.interact.setBlockDelay(0.2);
                this._makeList(false)
            } else {
                this._itemListActive =
                    true;
                sc.menu.pushBackCallback(this._exitItemList.bind(this));
                this._makeList(false);
                sc.menu.buttonInteract.pushButtonGroup(this.itemList.list.buttonGroup);
                this.itemList.list.buttonGroup.mouseOverGui = this.partChooser.buttonGroup.mouseOverGui;
                ig.interact.setBlockDelay(0.2);
                this.itemList.doStateTransition("DEFAULT")
            }
        },
        _deactivateItemList: function(b) {
            if (this._itemListActive) {
                this._itemListActive = false;
                b || sc.menu.popBackCallback();
                this.itemList.doStateTransition("HIDDEN", b);
                sc.menu.buttonInteract.removeButtonGroup(this.itemList.list.buttonGroup)
            }
        },
        _exitItemList: function() {
            sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.NONE);
            ig.input.mouseGuiActive || this.partChooser.refocusOnBack()
        },
        _makeList: function(b, a, d, c, e) {
            b = b || this._refocusFromCycle || false;
            a = a || false;
            c = c || false;
            this.sortTypes[sc.menu.currentBodyPart] != void 0 ? e == void 0 ? e = this.sortTypes[sc.menu.currentBodyPart] : this.sortTypes[sc.menu.currentBodyPart] = e : this.sortTypes[sc.menu.currentBodyPart] = e || sc.SORT_TYPE.ORDER;
            var f = 0,
                g = 0;
            if (b && !this._refocusFromCycle) {
                f = this.itemList.list.buttonGroup.current.y;
                g = -this.itemList.list.box.hook.scroll.y
            }
            this._refocusFromCycle = false;
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(b);
            var h = false,
                i = null,
                j = sc.model.player;
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    i = j.getEquipSubList(sc.ITEMS_EQUIP_TYPES.HEAD, null, e || sc.SORT_TYPE.ORDER);
                    j.equip.head > 0 && (h = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    i = j.getEquipSubList(sc.ITEMS_EQUIP_TYPES.ARM, null, e || sc.SORT_TYPE.ORDER);
                    j.equip.leftArm > 0 && (h = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    i =
                        j.getEquipSubList(sc.ITEMS_EQUIP_TYPES.ARM, null, e || sc.SORT_TYPE.ORDER);
                    j.equip.rightArm > 0 && (h = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    i = j.getEquipSubList(sc.ITEMS_EQUIP_TYPES.TORSO, null, e || sc.SORT_TYPE.ORDER);
                    j.equip.torso > 0 && (h = true);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    i = j.getEquipSubList(sc.ITEMS_EQUIP_TYPES.FEET, null, e || sc.SORT_TYPE.ORDER);
                    j.equip.feet > 0 && (h = true)
            }
            var k = null,
                k = null,
                l = 0,
                o = 0;
            if (h) {
                k = new sc.ItemBoxButton(ig.lang.get("sc.gui.menu.equip.unequip-name"), 140, 26, -1, -1E3, ig.lang.get("sc.gui.menu.equip.unequip-des"),
                    true, true, null);
                k.button.submitSound = null;
                this.itemList.list.addButton(k)
            }
            for (var m = 0; m < i.length; m++) {
                o = j.items[i[m]] || 0;
                k = sc.inventory.getItem(i[m]);
                l++;
                var n = new ig.LangLabel(k.name),
                    n = "\\i[" + (k.icon + sc.inventory.getRaritySuffix(k.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(k.name),
                    p = ig.LangLabel.getText(k.description),
                    k = new sc.ItemBoxButton(n, 141, 26, o, i[m], p, void 0, void 0, null, 99, k.level || 86);
                k.button.submitSound = null;
                this.isIDEquipped(i[m]) && k.setActive(false);
                this.itemList.list.addButton(k)
            }
            if (b) {
                this.itemList.list._prevIndex =
                    f;
                if (e) g = f = 0;
                else if (!this._lastEquipState && h && d != void 0 && sc.model.player.items[d] && sc.model.player.items[d] > 0) {
                    f = Math.min(f, l - 1);
                    g = g + this.itemList.list.pageSize
                }
                a ? this.itemList.list.buttonGroup.setCurrentFocus(0, f) : this.itemList.list.buttonGroup.focusCurrentButton(0, f, false, c);
                this.itemList.list.scrollToY(g, true)
            }
            this._lastEquipState = h
        },
        isIDEquipped: function(b) {
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    return sc.model.player.equip.head == b;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    return sc.model.player.equip.leftArm ==
                        b;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    return sc.model.player.equip.rightArm == b;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    return sc.model.player.equip.torso == b;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    return sc.model.player.equip.feet == b
            }
        },
        getCurrentSortText: function() {
            var b = "auto";
            switch (this.sortTypes[sc.menu.currentBodyPart] || sc.SORT_TYPE.ORDER) {
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
                    b = "rarity";
                    break;
                case sc.SORT_TYPE.LEVEL:
                    b =
                        "level";
                    break;
                case sc.SORT_TYPE.HP:
                    b = "hp";
                    break;
                case sc.SORT_TYPE.ATTACK:
                    b = "attack";
                    break;
                case sc.SORT_TYPE.DEFENSE:
                    b = "defense";
                    break;
                case sc.SORT_TYPE.FOCUS:
                    b = "focus"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
        },
        modelChanged: function(b, a, d) {
            b == sc.menu && (a == sc.MENU_EVENT.SELECTED_BODYPART ? b.previousBodyPart != b.currentBodyPart && (b.currentBodyPart == sc.MENU_EQUIP_BODYPART.NONE ? this._deactivateItemList() : this._activateItemList()) : a == sc.MENU_EVENT.SORT_LIST && this._makeList(true, ig.input.mouseGuiActive, null,
                !ig.input.mouseGuiActive, d.data.sortType))
        },
        showMenu: function() {
            this._deactivateItemList(true);
            this.partChooser.showMenu();
            this.doStateTransition("DEFAULT")
        },
        hideMenu: function() {
            this._deactivateItemList();
            this.partChooser.hideMenu();
            this.doStateTransition("HIDDEN")
        },
        tempShowMenu: function() {
            sc.menu.currentBodyPart == 0 && !this.partChooser.buttonGroup.isActive() ? this.partChooser.showMenu() : sc.menu.currentBodyPart != 0 && sc.menu.pushBackCallback(this._exitItemList.bind(this));
            this.doStateTransition("DEFAULT")
        },
        tempHideMenu: function() {
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
        init: function(b) {
            this.parent();
            this.setSize(169, 264);
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttonGroup.addSelectionCallback(function(a) {
                sc.menu.setInfoText(a.data)
            });
            this.buttonGroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            });
            var a =
                36,
                d = sc.model.player.equip;
            this.buttons.head = this._createButton("head", d.head, 9, a, b.head.button, 0, 33, function() {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.HEAD)
            }.bind(this));
            this.addChildGui(this.buttons.head);
            a = a + 38;
            this.buttons.rightArm = this._createButton("rightarm", d.rightArm, 9, a, b.rightArm.button, 1, 71, function() {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.RIGHT_ARM)
            }.bind(this));
            this.addChildGui(this.buttons.rightArm);
            a = a + 38;
            this.buttons.leftArm = this._createButton("leftarm", d.leftArm, 9, a,
                b.leftArm.button, 2, 109,
                function() {
                    sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.LEFT_ARM)
                }.bind(this));
            this.addChildGui(this.buttons.leftArm);
            a = a + 38;
            this.buttons.torso = this._createButton("torso", d.torso, 9, a, b.torso.button, 3, 147, function() {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.TORSO)
            }.bind(this));
            this.addChildGui(this.buttons.torso);
            this.buttons.feet = this._createButton("feet", d.feet, 9, a + 38, b.feet.button, 4, 185, function() {
                sc.menu.selectBodyPart(sc.MENU_EQUIP_BODYPART.FEET)
            }.bind(this));
            this.addChildGui(this.buttons.feet)
        },
        showMenu: function() {
            for (var b in this.buttons) this.buttons[b] && this.buttons[b].reset();
            ig.interact.setBlockDelay(0.2);
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },
        hideMenu: function() {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },
        refocusOnBack: function() {
            switch (sc.menu.previousBodyPart) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    ig.debug("Whoops, Why is this happening?");
                    break;
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this.buttonGroup.focusCurrentButton(0, 0, false, true);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this.buttonGroup.focusCurrentButton(0,
                        1, false, true);
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
        _createButton: function(b, a, d, c, e, f, g, h) {
            b = ig.lang.get("sc.gui.menu.equip." + b);
            a = sc.inventory.getItem(a);
            d = new sc.EquipBodyPartContainer.Entry(b, a, d, c, e, g);
            d.button.onButtonPress = h;
            e.onButtonPress = h;
            this.buttonGroup.addFocusGui(d.button,
                0, f);
            return d
        },
        _moveButtons: function(b) {
            switch (b) {
                case sc.MENU_EQUIP_BODYPART.NONE:
                    for (var a in this.buttons) this.buttons[a] && this.buttons[a].moveToNormal();
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
        _pullInAllButtons: function(b) {
            var a = null,
                d;
            for (d in this.buttons)(a = this.buttons[d]) && a != b && a.hideButton()
        },
        _setText: function(b) {
            var a = ig.lang.get("sc.gui.menu.equip.nothing"),
                d = "",
                c = "item-default",
                c = -1,
                e = false;
            if (b > 0) {
                b = sc.inventory.getItem(b);
                c = (b.icon || "item-default") + sc.inventory.getRaritySuffix(b.rarity ||
                    0);
                a = "\\i[" + c + "]" + ig.LangLabel.getText(b.name);
                d = new ig.LangLabel(b.description);
                c = b.level || 1;
                e = b.isScalable || false
            }
            switch (sc.menu.currentBodyPart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    this.buttons.head.setData(a, d, c, e);
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    this.buttons.rightArm.setData(a, d, c, e);
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    this.buttons.leftArm.setData(a, d, c, e);
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    this.buttons.torso.setData(a, d, c, e);
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    this.buttons.feet.setData(a,
                        d, c, e)
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.SELECTED_BODYPART) {
                    if (b.currentBodyPart != b.previousBodyPart) {
                        ig.interact.setBlockDelay(0.2);
                        this._moveButtons(b.currentBodyPart)
                    }
                } else a == sc.MENU_EVENT.EQUIP_CHANGED && this._setText(d)
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
        init: function(b,
            a, d, c, e, f) {
            this.parent();
            this.setSize(150, 33);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.defaultPosition.x = d;
            this.defaultPosition.y = c;
            this.topY = f || 1;
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
            d = null;
            if (a) {
                d = "\\i[" + ((a.icon || "item-default") + sc.inventory.getRaritySuffix(a.rarity ||
                    0)) + "]" + ig.LangLabel.getText(a.name);
                this.level = a.level || 1;
                this.isScalable = a.isScalable || false
            } else {
                d = ig.lang.get("sc.gui.menu.equip.nothing");
                this.level = -1;
                this.isScalable = false
            }
            this.text = new sc.TextGui(b, {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            this.text.setPos(2, 0);
            this.addChildGui(this.text);
            this.button = new sc.BodyPartButton(d, 150, sc.BUTTON_TYPE.DEFAULT, e, true);
            this.button.textChild.setDrawCallback(function(a, b) {
                this.level <= 0 || sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx,
                    this.isScalable)
            }.bind(this));
            this.button.callback = e.callback;
            e.otherButton = this.button;
            this.button.setPos(0, 10);
            this.addChildGui(this.button);
            this.bottomY = this.hook.pos.y;
            a && this.button.setData(new ig.LangLabel(a.description));
            this.doStateTransition("DEFAULT", true)
        },
        setData: function(b, a, d, c) {
            this.level = d;
            this.isScalable = c;
            this.button.textChild.setText(b);
            this.button.setData(a)
        },
        moveToNormal: function() {
            this._isActiveTop = false;
            if (this._hidden) {
                this.setPos(this.hook.pos.x, this.bottomY);
                this.doStateTransition("DEFAULT");
                this._hidden = false
            } else this.doPosTranstition(this.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.EASE);
            this.button.setPressed(false)
        },
        moveToBottom: function() {
            if (this._isActiveTop) {
                this._isActiveTop = false;
                if (this._hidden) {
                    this.setPos(this.hook.pos.x, this.bottomY);
                    this.doStateTransition("DEFAULT");
                    this._hidden = false
                } else this.doPosTranstition(this.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.EASE)
            }
        },
        moveToTop: function() {
            if (!this._isActiveTop) {
                this._isActiveTop = true;
                if (this._hidden) {
                    this.setPos(this.hook.pos.x,
                        this.bottomY - this.topY);
                    this.doStateTransition("DEFAULT");
                    this._hidden = false
                } else this.doPosTranstition(this.hook.pos.x, this.hook.pos.y - this.topY, 0.1, KEY_SPLINES.EASE)
            }
        },
        reset: function() {
            this.doStateTransition("DEFAULT", true);
            this._isActiveTop = this._hidden = false;
            this.setPos(this.hook.pos.x, this.bottomY);
            this.button.setPressed(false)
        },
        hideButton: function() {
            this.doStateTransition("HIDDEN");
            this._hidden = true;
            this._isActiveTop = false;
            this.button.setPressed(false)
        },
        showButton: function() {
            this.doStateTransition("DEFAULT");
            this._hidden = false
        }
    })
});
ig.baked = !0;
