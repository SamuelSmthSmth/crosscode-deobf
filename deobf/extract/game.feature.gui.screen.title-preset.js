ig.module("game.feature.gui.screen.title-preset").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.TitlePresetMenu = sc.HeaderMenuPanel.extend({
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
        backButton: null,
        submitSound: null,
        slots: [],
        _loadCallback: null,
        _removeCallback: null,
        _doLoad: false,
        _loadSlot: -1,
        _firstTime: false,
        init: function(b, a) {
            this.parent(ig.lang.get("sc.gui.title-screen.preset-title"), sc.MenuPanelType.TOP_RIGHT_EDGE_DARK);
            this.setSize(204, 257);
            this.hook.zIndex = 2001;
            this.hook.pauseGui = true;
            this._loadCallback = b;
            this._removeCallback = a;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.backButton = new sc.ButtonGui("\\i[back]" + ig.lang.get("sc.gui.menu.back"), 204, true, sc.BUTTON_TYPE.SMALL);
            this.backButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.backButton.setPos(0, 1);
            this.backButton.submitSound = sc.BUTTON_SOUND.back;
            this.backButton.onButtonPress = function() {
                this.deactivate()
            }.bind(this);
            this.addChildGui(this.backButton);
            this.itemList = new sc.ItemListBox(1, true, this.buttonInteract);
            this.itemList.list.showTopBar = false;
            this.itemList.setSize(204, 231);
            this.itemList.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.itemList.list.buttonGroup.addPressCallback(function(a) {
                if (a.slot >= 0) {
                    this.submitSound.play();
                    this._doLoad = true;
                    this._loadSlot =
                        a.slot
                }
            }.bind(this));
            this.itemList.setPos(0, 2);
            this.addChildGui(this.itemList);
            this.buttonInteract.pushButtonGroup(this.itemList.list.buttonGroup);
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
                this._loadCallback &&
                    this._loadCallback(this._loadSlot)
            }
        },
        setPos: function(b, a) {
            this.parent(b, a);
            this.setStateValue("HIDDEN", "offsetX", -(204 + b));
            this.doStateTransition("DEFAULT", true);
            this.doStateTransition("HIDDEN", true)
        },
        activate: function() {
            ig.canLeavePauseMenu = false;
            ig.interact.addEntry(this.buttonInteract);
            this.createList();
            this.doStateTransition("DEFAULT")
        },
        deactivate: function() {
            this._removeCallback && this._removeCallback();
            ig.canLeavePauseMenu = true;
            ig.interact.removeEntry(this.buttonInteract);
            this.doStateTransition("HIDDEN")
        },
        createList: function() {
            var b = 0,
                a = 0,
                d = ig.input.mouseGuiActive,
                b = this.itemList.list.buttonGroup.current.y,
                a = -this.itemList.list.box.hook.scroll.y;
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(false);
            this.slots.length = 0;
            for (var c = sc.savePreset.slots, e = null, e = null, f = 0; f < c.length; f++)
                if (e = c[f]) {
                    e = new sc.TitlePresetMenu.SaLoButton(f, e);
                    e.setSize(201, 44);
                    this.itemList.addButton(e);
                    this.slots[f] = e
                } b = Math.max(0, Math.min(b, this.itemList.list.getChildren().length));
            this.itemList.list._prevIndex =
                b;
            d ? this.itemList.list.buttonGroup.setCurrentFocus(0, b) : this.itemList.list.buttonGroup.focusCurrentButton(0, b, false, true);
            this.itemList.list.scrollToY(a, true)
        }
    });
    sc.TitlePresetMenu.SaLoButton = ig.FocusGui.extend({
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
        mainText: null,
        position: null,
        slot: -1,
        init: function(b, a) {
            this.parent();
            this.slot = b;
            var d = a.saveSlot.getData();
            if (d) {
                var c = new sc.NumberGui(99, {
                    leadingZeros: 2,
                    size: sc.NUMBER_SIZE.TINY
                });
                c.setNumber(b);
                c.setPos(8, 8);
                this.addChildGui(c);
                d = d.player;
                this.level = new sc.NumberGui(99, {
                    size: sc.NUMBER_SIZE.TEXT
                });
                this.level.setNumber(d.level);
                this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.level.setPos(8, 8);
                this.addChildGui(this.level);
                d = new sc.TextGui("LV: ", {
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                });
                d.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                d.setPos(26, 4);
                this.addChildGui(d);
                this.location = new sc.TextGui(a.sub.toString(), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                this.location.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                this.location.setPos(8, 29);
                this.addChildGui(this.location);
                this.mainText = new sc.TextGui(a.title.toString(), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.smallFont
                });
                this.mainText.setAlign(ig.GUI_ALIGN.X_LEFT,
                    ig.GUI_ALIGN.Y_TOP);
                this.mainText.setPos(8, 16);
                this.addChildGui(this.mainText)
            }
        },
        focusGained: function() {
            this.parent()
        },
        updateDrawables: function(b) {
            this.ninepatch.draw(b, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default")
        }
    })
});
ig.baked = !0;
