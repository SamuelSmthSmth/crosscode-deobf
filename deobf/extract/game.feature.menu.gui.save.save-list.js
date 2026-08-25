ig.module("game.feature.menu.gui.save.save-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.save.save-misc").defines(function() {
    sc.SaveAutoSaveSlot = ig.BoxGui.extend({
        transitions: {
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
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 10,
            height: 7,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 545,
                    y: 441
                }
            }
        }),
        button: null,
        init: function() {
            this.parent();
            var b = new sc.TextGui("- This is where you will find your auto save soon -", {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            b.setPos(0, 1);
            this.addChildGui(b)
        }
    });
    sc.SaveList = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        list: null,
        buttongroup: null,
        slots: [],
        submitSound: null,
        selectedSlot: null,
        autoSlot: null,
        init: function() {
            this.parent();
            var b = sc.menu.loadMode;
            this.setSize(452, 246);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, b ? 0 : 2);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 226
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.submitSound = sc.BUTTON_SOUND.submit;
            if (!b) {
                this.autoSlot = new sc.SaveAutoSaveSlot;
                this.autoSlot.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.autoSlot.setSize(448, 41);
                this.autoSlot.setPos(0, -2);
                this.addChildGui(this.autoSlot);
                var a = new sc.SaveSlotButton(ig.storage.autoSlot ? ig.storage.autoSlot.getData() : null, -2);
                a.setPos(0, 1);
                this.autoSlot.addChildGui(a)
            }
            var a = 203 + (b ? 40 : 0),
                d = new sc.MenuScanLines;
            d.setSize(452, a);
            d.setPos(0, 45 - (b ? 40 : 0));
            this.addChildGui(d);
            this.list = new sc.ButtonListBox(1, 0, 40);
            this.list.setSize(452, a);
            this.list.setPos(0, 45 - (b ? 40 : 0));
            this.addChildGui(this.list);
            this.buttongroup = this.list.buttonGroup;
            this.buttongroup.addSelectionCallback(function(a) {
                this.selectedSlot = a.slot != void 0 && a.slot >= 0 ? a : null;
                a.data &&
                    sc.menu.setInfoText(a.data)
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                this.selectedSlot = null;
                sc.menu.loadClearFilesOnly ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-newgame")) : sc.menu.loadMode ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-load")) : sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-save"))
            }.bind(this));
            this.buttongroup.addPressCallback(function(a) {
                if (a.slot != void 0 && a.slot >= -2) {
                    this.submitSound.play();
                    if (a.slot == -1)
                        if (ig.storage.slots.length >= 99) sc.Dialogs.showErrorDialog(ig.lang.get("sc.gui.dialogs.slotsOverflow"), false);
                        else this.onNewSlotPressed();
                    else sc.menu.loadClearFilesOnly ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.loadNewGameConfirm"), sc.DIALOG_INFO_ICON.QUESTION, function(b) {
                            if (b.data == 0) this.onSlotNewGamePressed(a)
                        }.bind(this)) : sc.menu.loadMode ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.loadConfirm"), null, function(b) {
                            if (b.data == 0) this.onSlotLoadPressed(a)
                        }.bind(this)) :
                        sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.overrideConfirm"), null, function(b) {
                            if (b.data == 0) this.onSlotPressed(a)
                        }.bind(this))
                }
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            this.loadSlots();
            this.list.activate();
            sc.menu.loadClearFilesOnly ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-newgame")) : sc.menu.loadMode ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-load")) :
                sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-save"));
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, this.buttongroup.current.y) : this.buttongroup.focusCurrentButton(0, this.buttongroup.current.y, false, true);
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.list.deactivate();
            sc.menu.setInfoText("", true);
            this.doStateTransition("HIDDEN")
        },
        onNewSlotPressed: function() {
            sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.newConfirm"), null, function(b) {
                b.data ==
                    0 && sc.menu.newSlot()
            })
        },
        onSlotPressed: function(b) {
            sc.stats.addMap("player", "saves", 1);
            ig.storage.save(b.slot);
            this.slots.splice(b.slot, 1);
            this.slots.unshift(b);
            if (b.slot != 0) {
                b.setSlotOver(0);
                this.list.moveButton(b.slot + 1, 1, 0.2, null, false, function(a, b) {
                    a.setSlot(a.slot + b)
                }.bind(this));
                b.setSlot(0);
                b.doUpdateEffect(ig.storage.getSlot(0).getData(), 0.1)
            } else b.doUpdateEffect(ig.storage.getSlot(0).getData());
            this.list._prevIndex = 1;
            if (ig.input.mouseGuiActive) {
                if (this.buttongroup.buttonInteract.mouseOverGui) {
                    this.buttongroup.buttonInteract.mouseOverGui.focusLost();
                    this.buttongroup.buttonInteract.mouseOverGui = null
                }
                this.buttongroup.setCurrentFocus(0, 1)
            } else this.buttongroup.focusCurrentButton(0, 1, false, true);
            this.list.setScrollY(0, false, true);
            ig.interact.setBlockDelay(ig.input.mouseGuiActive ? 0.2 : 0.4)
        },
        onSlotLoadPressed: function(b) {
            sc.menu.loadSlot(b.slot == -2 ? -1 : b.slot);
            sc.model.enterPrevSubState()
        },
        onSlotNewGamePressed: function(b) {
            sc.newgame.setActive(true);
            b = ig.storage.getSlot(b.slot).getData();
            sc.newgame.storeSaveData(b);
            sc.newgame.applyData(b);
            sc.model.enterPrevSubState()
        },
        onDeleteSlot: function() {
            if (this.selectedSlot && this.selectedSlot.slot >= 0) sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.deleteConfirm"), null, function(a) {
                if (a.data == 0) {
                    sc.menu.deleteSlot(this.selectedSlot.slot);
                    this.deleteSlot(this.selectedSlot)
                }
            }.bind(this));
            else {
                var b = ig.lang.get("sc.gui.menu.save-menu.delete-info-title") + "\n\n" + ig.lang.get("sc.gui.menu.save-menu.delete-info-content"),
                    b = new sc.CenterMsgBoxGui(b, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                b.hook.zIndex = 15E4;
                b.hook.pauseGui = true;
                ig.gui.addGuiElement(b)
            }
        },
        loadSlots: function(b, a) {
            var d = ig.input.mouseGuiActive,
                c = b ? 1 : this.buttongroup.current.y || 1,
                e = b ? 0 : -this.list.box.hook.scroll.y || 0;
            this.slots.length = 0;
            this.buttongroup.clear();
            this.list.clear();
            var f = ig.storage.slots,
                g = null;
            if (sc.menu.loadMode) {
                if (ig.storage.autoSlot && !sc.menu.loadClearFilesOnly) {
                    g = new sc.SaveSlotButton(ig.storage.autoSlot.getData(), -2);
                    this.list.addButton(g)
                }
            } else {
                g = new sc.SaveSlotNewButton(-1);
                this.list.addButton(g)
            }
            for (var h = 0; h < f.length; h++) {
                g =
                    f[h].getData();
                if (!sc.menu.loadClearFilesOnly || !g.vars || !g.vars.storage || !(g.vars.storage.plot && (g.vars.storage.plot.metaSpace || 0) < 1)) {
                    g = new sc.SaveSlotButton(g, h);
                    this.list.addButton(g, false);
                    this.slots[h] = g
                }
            }
            c = Math.max(0, Math.min(c, this.list.getChildren().length));
            this.list._prevIndex = c;
            d ? this.buttongroup.setCurrentFocus(0, c) : this.buttongroup.focusCurrentButton(0, c, false, true);
            this.list.scrollToY(e, !a)
        },
        insertNewSlot: function() {
            var b = new sc.SaveSlotButton(ig.storage.slots[0].getData(), 0);
            this.list.insertButton(b,
                1, 0.2);
            this.slots.splice(0, 0, b);
            for (b = 0; b < this.slots.length; b++) this.slots[b].setSlot(b);
            this.list._prevIndex = 1;
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, 1) : this.buttongroup.focusCurrentButton(0, 1, false, true);
            this.list.setScrollY(0, false);
            ig.interact.setBlockDelay(ig.input.mouseGuiActive ? 0.5 : 1)
        },
        deleteSlot: function(b, a) {
            var d = this.buttongroup.current.y || 0,
                c = -this.list.box.hook.scroll.y || 0;
            this.list.removeButton(b.slot + 1, a ? "MOVE" : "DELETE", 0.2);
            this.slots.splice(b.slot, 1);
            for (var e =
                    0; e < this.slots.length; e++) this.slots[e].setSlot(e);
            d = d + 1 >= this.list.getChildren().length ? d - 1 : Math.max(0, Math.min(d, this.list.getChildren().length - 1));
            this.list._prevIndex = d;
            if (b == this.selectedSlot) this.selectedSlot = null;
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, d) : this.buttongroup.focusCurrentButton(0, d, false, true, false, true);
            d = this.list.getHeightAtIndex(d); - c != d - 1 ? this.list.setScrollY(c, false, true) : this.list.setScrollY(d - 1, false, true);
            ig.interact.setBlockDelay(0.2)
        },
        modelChanged: function(b,
            a) {
            if (b == sc.menu && a == sc.MENU_EVENT.SAVE_NEW_SLOT) {
                this.insertNewSlot();
                this.slots[0].doNewEffect()
            }
        }
    })
});
ig.baked = !0;
