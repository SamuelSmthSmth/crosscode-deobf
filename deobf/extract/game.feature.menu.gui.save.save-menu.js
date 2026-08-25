ig.module("game.feature.menu.gui.save.save-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.widget.modal-dialog", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.control.control", "game.feature.menu.gui.save.save-list").defines(function() {
    function b(a, b) {
        var c = "0000" + Math.floor(a);
        return c.length >= 4 + b ? Math.floor(a) : c.substr(c.length - b)
    }
    sc.SaveMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeyDelete: null,
        hotkeyNew: null,
        helpGui: null,
        list: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.list = new sc.SaveList;
            this.addChildGui(this.list);
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
            this.hotkeyDelete = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.deleteSlot"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyDelete.keepMouseFocus = true;
            this.hotkeyDelete.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyDelete.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyDelete.onButtonPress = this.onDeleteButtonPressed.bind(this);
            this.hotkeyNew =
                new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.hotkeys.newSlot"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyNew.keepMouseFocus = true;
            this.hotkeyNew.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyNew.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyNew.onButtonPress = this.onNewButtonPressed.bind(this);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.list.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.list.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this.list.showMenu();
            this.onAddHotkeys()
        },
        hideMenu: function() {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyDelete);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyNew);
            this.list.exitMenu();
            this.helpGui = null
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
        onHotkeyDeleteCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onDeleteButtonPressed: function() {
            this.list.onDeleteSlot()
        },
        onHotkeyNewCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onNewButtonPressed: function() {
            ig.storage.slots.length >= 100 ? sc.Dialogs.showErrorDialog(ig.lang.get("sc.gui.dialogs.slotsOverflow"), false) : sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.newConfirm"), null, function(a) {
                a.data == 0 && sc.menu.newSlot()
            })
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = sc.menu.loadMode ? new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.load.title"), ig.lang.get("sc.gui.menu.help-texts.load.pages"), function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this),
                    true) : new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.save.title"), ig.lang.get("sc.gui.menu.help-texts.save.pages"), function() {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(a) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.loadClearFilesOnly || sc.menu.buttonInteract.addGlobalButton(this.hotkeyDelete, this.onHotkeyDeleteCheck.bind(this));
            sc.menu.loadMode ||
                sc.menu.buttonInteract.addGlobalButton(this.hotkeyNew, this.onHotkeyNewCheck.bind(this));
            this.commitHotKeysToTopBar(a)
        },
        commitHotKeysToTopBar: function(a) {
            sc.menu.loadMode || sc.menu.addHotkey(function() {
                return this.hotkeyNew
            }.bind(this));
            sc.menu.loadClearFilesOnly || sc.menu.addHotkey(function() {
                return this.hotkeyDelete
            }.bind(this));
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
    });
    sc.DebugSaveLoadPanel = sc.HeaderMenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    offsetX: -204
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        buttonInteract: null,
        itemList: null,
        newButton: null,
        deleteButton: null,
        backButton: null,
        load: false,
        submitSound: null,
        slots: [],
        _redBackground: null,
        _deleteMode: false,
        _loadCallback: null,
        _removeCallback: null,
        _doLoad: false,
        _loadSlot: -1,
        _firstTime: false,
        init: function(a, b, c) {
            this.parent(a ? ig.lang.get("sc.gui.menu.save-menu.load") :
                ig.lang.get("sc.gui.menu.save-menu.save"), sc.MenuPanelType.TOP_RIGHT_EDGE_DARK);
            this.setSize(204, 283);
            this.hook.zIndex = 2001;
            this.hook.pauseGui = true;
            this.load = a || false;
            this._loadCallback = b;
            this._removeCallback = c;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this._redBackground = new ig.ColorGui("red", 204, 273);
            this._redBackground.setPos(0, 9);
            this._redBackground.hook.transitions = {
                DEFAULT: {
                    state: {
                        alpha: 0.5
                    },
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
            this._redBackground.doStateTransition("HIDDEN", true);
            this.addChildGui(this._redBackground);
            this.deleteButton = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.save-menu.delete"), !a ? 101 : 204, true, sc.BUTTON_TYPE.SMALL);
            this.deleteButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.deleteButton.setPos(!a ? 102 : 0, 12);
            this.deleteButton.onButtonPress = function() {
                this.toggleDeleteMode()
            }.bind(this);
            this.addChildGui(this.deleteButton);
            this.backButton = new sc.ButtonGui("\\i[back]" +
                ig.lang.get("sc.gui.menu.back"), 204, true, sc.BUTTON_TYPE.SMALL);
            this.backButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.backButton.setPos(0, 1);
            this.backButton.submitSound = sc.BUTTON_SOUND.back;
            this.backButton.onButtonPress = function() {
                this.deactivate()
            }.bind(this);
            this.addChildGui(this.backButton);
            if (!a) {
                this.newButton = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.save-menu.new-save"), 101, true, sc.BUTTON_TYPE.SMALL);
                this.newButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                this.newButton.setPos(0, 12);
                this.newButton.onButtonPress = function() {
                    this._deleteMode && this.toggleDeleteMode();
                    ig.storage.save(ig.storage.slots.length);
                    this.loadSlots(true, true)
                }.bind(this);
                this.addChildGui(this.newButton)
            }
            this.itemList = new sc.ItemListBox(1, true, this.buttonInteract);
            this.itemList.setSize(204, 230);
            this.itemList.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.itemList.list.buttonGroup.addPressCallback(function(a) {
                if (a.slot != void 0 && a.slot >= 0) {
                    this.submitSound.play();
                    if (this._deleteMode) sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.deleteConfirm"),
                        null,
                        function(b) {
                            if (b.data == 0) {
                                ig.storage.deleteSlot(a.slot);
                                this.loadSlots(true, null, ig.input.mouseGuiActive)
                            }
                        }.bind(this));
                    else if (this.load) {
                        this._doLoad = true;
                        this._loadSlot = a.slot
                    } else sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.overrideConfirm"), null, function(b) {
                        if (b.data == 0) {
                            ig.storage.save(a.slot);
                            a.saved();
                            for (b = this.slots.length; b--;) a == this.slots[b] && this.slots[b].updateInfo()
                        }
                    }.bind(this))
                }
            }.bind(this));
            this.itemList.setPos(0, 28);
            this.addChildGui(this.itemList);
            this.buttonInteract.pushButtonGroup(this.itemList.list.buttonGroup);
            a || this.buttonInteract.addGlobalButton(this.newButton, function() {
                return sc.control.menuHotkeyHelp2()
            }.bind(this));
            this.buttonInteract.addGlobalButton(this.deleteButton, function() {
                return sc.control.menuHotkeyHelp()
            }.bind(this));
            this.buttonInteract.addGlobalButton(this.backButton, function() {
                return sc.control.menuBack()
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.isVisible() && (!ig.interact.isBlocked() && !ig.canLeavePauseMenu) && sc.control.menuBack()) {
                sc.BUTTON_SOUND.back.play();
                this.deactivate()
            }
            if (this._doLoad) {
                this._doLoad = false;
                this._loadCallback && this._loadCallback(this._loadSlot)
            }
        },
        setPos: function(a, b) {
            this.parent(a, b);
            this.setStateValue("HIDDEN", "offsetX", -(204 + a));
            this.doStateTransition("DEFAULT", true);
            this.doStateTransition("HIDDEN", true)
        },
        toggleDeleteMode: function() {
            if (this._deleteMode = !this._deleteMode) {
                this.deleteButton.textChild.setText("\\i[help]" + ig.lang.get("sc.gui.menu.save-menu.exit-del"));
                this._redBackground.doStateTransition("DEFAULT")
            } else {
                this.deleteButton.textChild.setText("\\i[help]" +
                    ig.lang.get("sc.gui.menu.save-menu.delete"));
                this._redBackground.doStateTransition("HIDDEN")
            }
            for (var a = this.slots.length; a--;) this.slots[a].deleteMode = this._deleteMode
        },
        activate: function() {
            ig.canLeavePauseMenu = false;
            ig.interact.addEntry(this.buttonInteract);
            this.deleteButton.textChild.setText("\\i[help]" + ig.lang.get("sc.gui.menu.save-menu.delete"));
            this.loadSlots(true, false, ig.input.mouseGuiActive);
            this.doStateTransition("DEFAULT")
        },
        deactivate: function() {
            this._removeCallback && this._removeCallback();
            ig.canLeavePauseMenu = true;
            ig.interact.removeEntry(this.buttonInteract);
            this._deleteMode = false;
            this._redBackground.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN")
        },
        loadSlots: function(a, b, c) {
            var e = 0,
                f = 0;
            if (a) {
                e = this.itemList.list.buttonGroup.current.y;
                f = -this.itemList.list.box.hook.scroll.y
            }
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(false);
            this.slots.length = 0;
            for (var g = ig.storage.slots, h = null, i = null, j = 0; j < g.length; j++)
                if (i = g[j].getData()) {
                    h = new sc.DebugSaveLoadPanel.SaLoButton(j,
                        this._deleteMode);
                    h.setSize(201, 44);
                    this.itemList.addButton(h);
                    this.slots[j] = h
                } if (a) {
                if (this._firstTime) e = Math.max(0, Math.min(e, this.itemList.list.getChildren().length));
                else {
                    e = Math.max(0, Math.min(ig.storage.lastUsedSlot, this.itemList.list.getChildren().length));
                    f = this.itemList.list.getScrollYAtIndex(e);
                    this._firstTime = true
                }
                this.itemList.list._prevIndex = e;
                c ? this.itemList.list.buttonGroup.setCurrentFocus(0, e) : this.itemList.list.buttonGroup.focusCurrentButton(0, e, false, true);
                this.itemList.list.scrollToY(f,
                    true)
            }
            b && h.saved()
        }
    });
    sc.DebugSaveLoadPanel.SaLoButton = ig.FocusGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 13,
            height: 6,
            left: 9,
            top: 9,
            right: 9,
            bottom: 9,
            offsets: {
                "default": {
                    x: 0,
                    y: 65
                },
                focus: {
                    x: 32,
                    y: 65
                },
                "delete": {
                    x: 64,
                    y: 65
                }
            }
        }),
        level: null,
        location: null,
        playtime: null,
        position: null,
        slot: -1,
        deleteMode: false,
        init: function(a, d) {
            this.parent();
            this.slot =
                a == void 0 ? -1 : a;
            this.deleteMode = d || false;
            if (this.slot >= 0) {
                var c = ig.storage.getSlot(this.slot).getData();
                if (c) {
                    var e = new sc.NumberGui(99, {
                        leadingZeros: 2,
                        size: sc.NUMBER_SIZE.TINY
                    });
                    e.setNumber(a);
                    e.setPos(8, 8);
                    this.addChildGui(e);
                    e = c.player;
                    this.level = new sc.NumberGui(99, {
                        size: sc.NUMBER_SIZE.TEXT
                    });
                    this.level.setNumber(e.level);
                    this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                    this.level.setPos(8, 8);
                    this.addChildGui(this.level);
                    e = new sc.TextGui("LV: ", {
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    });
                    e.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                    e.setPos(26, 4);
                    this.addChildGui(e);
                    e = null;
                    e = c.specialMap ? c.area + " - " + c.specialMap : c.area + (c.floor ? " - " + c.floor : "");
                    this.location = new sc.TextGui(e, {
                        speed: ig.TextBlock.SPEED.IMMEDIATE,
                        font: sc.fontsystem.tinyFont
                    });
                    this.location.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    this.location.setPos(8, 28);
                    this.addChildGui(this.location);
                    e = this._getVersionText(c);
                    this.version = new sc.TextGui(e, {
                        speed: ig.TextBlock.SPEED.IMMEDIATE,
                        font: sc.fontsystem.tinyFont
                    });
                    this.version.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    this.version.setPos(28, 7);
                    this.addChildGui(this.version);
                    c = c.playtime;
                    e = ig.lang.get("sc.gui.menu.save-menu.time") + ": " + b(c / 60 / 60, 3) + ":" + b(Math.floor(c / 60) % 60, 2) + ":" + b(Math.floor(c) % 60, 2);
                    this.playtime = new sc.TextGui(e, {
                        speed: ig.TextBlock.SPEED.IMMEDIATE,
                        font: sc.fontsystem.smallFont
                    });
                    this.playtime.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    this.playtime.setPos(8, 16);
                    this.addChildGui(this.playtime);
                    this.savedNote = new sc.TextGui(" - Saved!", {
                        speed: ig.TextBlock.SPEED.IMMEDIATE,
                        font: sc.fontsystem.tinyFont
                    });
                    this.savedNote.setPos(76, 7);
                    this.savedNote.hook.transitions = {
                        DEFAULT: {
                            state: {},
                            time: 0.2,
                            timeFunction: KEY_SPLINES.LINEAR
                        },
                        HIDDEN: {
                            state: {
                                alpha: 0
                            },
                            time: 0.5,
                            timeFunction: KEY_SPLINES.LINEAR
                        }
                    };
                    this.savedNote.doStateTransition("HIDDEN", true);
                    this.addChildGui(this.savedNote)
                }
            }
        },
        focusGained: function() {
            this.parent()
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? this.deleteMode ? "delete" : "focus" :
                "default")
        },
        saved: function() {
            this.savedNote.doStateTransition("DEFAULT", true, false, function() {
                this.savedNote.doStateTransition("HIDDEN", false, false, null, 0.1)
            }.bind(this))
        },
        updateInfo: function() {
            var a = ig.storage.getSlot(this.slot).getData();
            this.level.setNumber(a.player.level);
            var d = null,
                d = a.specialMap ? a.area + " - " + a.specialMap : a.area + (a.floor ? " - " + a.floor : "");
            this.location.setText(d);
            d = a.playtime;
            d = ig.lang.get("sc.gui.menu.save-menu.time") + ": " + b(d / 60 / 60, 3) + ":" + b(Math.floor(d / 60) % 60, 2) + ":" + b(Math.floor(d) %
                60, 2);
            this.playtime.setText(d);
            d = this._getVersionText(a);
            this.version.setText(d)
        },
        _getVersionText: function(a) {
            var b = a.version || "V0.2.2";
            if ((a.saveVersion || 0) < sc.version.saveVersion) b = "\\c[1]" + b;
            return b
        }
    })
});
ig.baked = !0;
