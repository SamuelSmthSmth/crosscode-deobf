/**
 * game.feature.menu.gui.save.save-list
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.save.save-list")`.
 *
 * `sc.SaveAutoSaveSlot`: the placeholder box shown above the slot list in save
 * mode ("your auto save will appear here soon").
 * `sc.SaveList`: the scrollable list of save slots (plus the "new game" /
 * auto-save pseudo-slots), wired to the save/load/new-game/delete dialogs and
 * slot insertion/deletion animations.
 */
ig.module("game.feature.menu.gui.save.save-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.save.save-misc")
    .defines(function () {

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

        init: function () {
            this.parent();
            var hint = new sc.TextGui("- This is where you will find your auto save soon -", {
                font: sc.fontsystem.tinyFont
            });
            hint.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            hint.setPos(0, 1);
            this.addChildGui(hint)
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

        init: function () {
            this.parent();
            var loadMode = sc.menu.loadMode;
            this.setSize(452, 246);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(0, loadMode ? 0 : 2);
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
            if (!loadMode) {
                this.autoSlot = new sc.SaveAutoSaveSlot;
                this.autoSlot.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.autoSlot.setSize(448, 41);
                this.autoSlot.setPos(0, -2);
                this.addChildGui(this.autoSlot);
                var autoButton = new sc.SaveSlotButton(ig.storage.autoSlot ? ig.storage.autoSlot.getData() : null, -2);
                autoButton.setPos(0, 1);
                this.autoSlot.addChildGui(autoButton)
            }
            var listHeight = 203 + (loadMode ? 40 : 0),
                scanLines = new sc.MenuScanLines;
            scanLines.setSize(452, listHeight);
            scanLines.setPos(0, 45 - (loadMode ? 40 : 0));
            this.addChildGui(scanLines);
            this.list = new sc.ButtonListBox(1, 0, 40);
            this.list.setSize(452, listHeight);
            this.list.setPos(0, 45 - (loadMode ? 40 : 0));
            this.addChildGui(this.list);
            this.buttongroup = this.list.buttonGroup;
            this.buttongroup.addSelectionCallback(function (button) {
                this.selectedSlot = button.slot != void 0 && button.slot >= 0 ? button : null;
                button.data && sc.menu.setInfoText(button.data)
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function () {
                this.selectedSlot = null;
                sc.menu.loadClearFilesOnly ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-newgame")) : sc.menu.loadMode ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-load")) : sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-save"))
            }.bind(this));
            this.buttongroup.addPressCallback(function (button) {
                if (button.slot != void 0 && button.slot >= -2) {
                    this.submitSound.play();
                    if (button.slot == -1)
                        if (ig.storage.slots.length >= 99) sc.Dialogs.showErrorDialog(ig.lang.get("sc.gui.dialogs.slotsOverflow"), false);
                        else this.onNewSlotPressed();
                    else sc.menu.loadClearFilesOnly ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.loadNewGameConfirm"), sc.DIALOG_INFO_ICON.QUESTION, function (result) {
                        if (result.data == 0) this.onSlotNewGamePressed(button)
                    }.bind(this)) : sc.menu.loadMode ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.loadConfirm"), null, function (result) {
                        if (result.data == 0) this.onSlotLoadPressed(button)
                    }.bind(this)) :
                    sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.overrideConfirm"), null, function (result) {
                        if (result.data == 0) this.onSlotPressed(button)
                    }.bind(this))
                }
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this.loadSlots();
            this.list.activate();
            sc.menu.loadClearFilesOnly ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-newgame")) : sc.menu.loadMode ? sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-load")) :
                sc.menu.setInfoText(ig.lang.get("sc.gui.menu.save-menu.description-save"));
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, this.buttongroup.current.y) : this.buttongroup.focusCurrentButton(0, this.buttongroup.current.y, false, true);
            this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.list.deactivate();
            sc.menu.setInfoText("", true);
            this.doStateTransition("HIDDEN")
        },

        onNewSlotPressed: function () {
            sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.newConfirm"), null, function (result) {
                result.data == 0 && sc.menu.newSlot()
            })
        },

        onSlotPressed: function (slot) {
            sc.stats.addMap("player", "saves", 1);
            ig.storage.save(slot.slot);
            this.slots.splice(slot.slot, 1);
            this.slots.unshift(slot);
            if (slot.slot != 0) {
                slot.setSlotOver(0);
                this.list.moveButton(slot.slot + 1, 1, 0.2, null, false, function (button, offset) {
                    button.setSlot(button.slot + offset)
                }.bind(this));
                slot.setSlot(0);
                slot.doUpdateEffect(ig.storage.getSlot(0).getData(), 0.1)
            } else slot.doUpdateEffect(ig.storage.getSlot(0).getData());
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

        onSlotLoadPressed: function (slot) {
            sc.menu.loadSlot(slot.slot == -2 ? -1 : slot.slot);
            sc.model.enterPrevSubState()
        },

        onSlotNewGamePressed: function (slot) {
            sc.newgame.setActive(true);
            var data = ig.storage.getSlot(slot.slot).getData();
            sc.newgame.storeSaveData(data);
            sc.newgame.applyData(data);
            sc.model.enterPrevSubState()
        },

        onDeleteSlot: function () {
            if (this.selectedSlot && this.selectedSlot.slot >= 0) sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.deleteConfirm"), null, function (result) {
                if (result.data == 0) {
                    sc.menu.deleteSlot(this.selectedSlot.slot);
                    this.deleteSlot(this.selectedSlot)
                }
            }.bind(this));
            else {
                var message = ig.lang.get("sc.gui.menu.save-menu.delete-info-title") + "\n\n" + ig.lang.get("sc.gui.menu.save-menu.delete-info-content");
                var msgBox = new sc.CenterMsgBoxGui(message, {
                    maxWidth: 300,
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                }, "black", 0.9);
                msgBox.hook.zIndex = 15E4;
                msgBox.hook.pauseGui = true;
                ig.gui.addGuiElement(msgBox)
            }
        },

        loadSlots: function (keepIndex, instant) {
            var mouseActive = ig.input.mouseGuiActive,
                focusIndex = keepIndex ? 1 : this.buttongroup.current.y || 1,
                scrollY = keepIndex ? 0 : -this.list.box.hook.scroll.y || 0;
            this.slots.length = 0;
            this.buttongroup.clear();
            this.list.clear();
            var storageSlots = ig.storage.slots,
                slotButton = null;
            if (sc.menu.loadMode) {
                if (ig.storage.autoSlot && !sc.menu.loadClearFilesOnly) {
                    slotButton = new sc.SaveSlotButton(ig.storage.autoSlot.getData(), -2);
                    this.list.addButton(slotButton)
                }
            } else {
                slotButton = new sc.SaveSlotNewButton(-1);
                this.list.addButton(slotButton)
            }
            for (var i = 0; i < storageSlots.length; i++) {
                var slotData = storageSlots[i].getData();
                if (!sc.menu.loadClearFilesOnly || !slotData.vars || !slotData.vars.storage || !(slotData.vars.storage.plot && (slotData.vars.storage.plot.metaSpace || 0) < 1)) {
                    slotButton = new sc.SaveSlotButton(slotData, i);
                    this.list.addButton(slotButton, false);
                    this.slots[i] = slotButton
                }
            }
            focusIndex = Math.max(0, Math.min(focusIndex, this.list.getChildren().length));
            this.list._prevIndex = focusIndex;
            mouseActive ? this.buttongroup.setCurrentFocus(0, focusIndex) : this.buttongroup.focusCurrentButton(0, focusIndex, false, true);
            this.list.scrollToY(scrollY, !instant)
        },

        insertNewSlot: function () {
            var slot = new sc.SaveSlotButton(ig.storage.slots[0].getData(), 0);
            this.list.insertButton(slot, 1, 0.2);
            this.slots.splice(0, 0, slot);
            for (var i = 0; i < this.slots.length; i++) this.slots[i].setSlot(i);
            this.list._prevIndex = 1;
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, 1) : this.buttongroup.focusCurrentButton(0, 1, false, true);
            this.list.setScrollY(0, false);
            ig.interact.setBlockDelay(ig.input.mouseGuiActive ? 0.5 : 1)
        },

        deleteSlot: function (slot, animate) {
            var focusIndex = this.buttongroup.current.y || 0,
                scrollY = -this.list.box.hook.scroll.y || 0;
            this.list.removeButton(slot.slot + 1, animate ? "MOVE" : "DELETE", 0.2);
            this.slots.splice(slot.slot, 1);
            for (var i = 0; i < this.slots.length; i++) this.slots[i].setSlot(i);
            focusIndex = focusIndex + 1 >= this.list.getChildren().length ? focusIndex - 1 : Math.max(0, Math.min(focusIndex, this.list.getChildren().length - 1));
            this.list._prevIndex = focusIndex;
            if (slot == this.selectedSlot) this.selectedSlot = null;
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, focusIndex) : this.buttongroup.focusCurrentButton(0, focusIndex, false, true, false, true);
            var height = this.list.getHeightAtIndex(focusIndex);
            -scrollY != height - 1 ? this.list.setScrollY(scrollY, false, true) : this.list.setScrollY(height - 1, false, true);
            ig.interact.setBlockDelay(0.2)
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu && event == sc.MENU_EVENT.SAVE_NEW_SLOT) {
                this.insertNewSlot();
                this.slots[0].doNewEffect()
            }
        }
    })
});
ig.baked = !0;
