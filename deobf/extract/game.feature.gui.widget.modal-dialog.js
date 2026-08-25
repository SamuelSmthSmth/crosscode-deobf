ig.module("game.feature.gui.widget.modal-dialog").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
    sc.DIALOG_INFO_ICON = {};
    sc.DIALOG_INFO_ICON.NONE = 0;
    sc.DIALOG_INFO_ICON.INFO = 1;
    sc.DIALOG_INFO_ICON.WARNING = 2;
    sc.DIALOG_INFO_ICON.ERROR = 3;
    sc.DIALOG_INFO_ICON.QUESTION = 4;
    sc.ModalScreenInteract = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        msgBox: null,
        textGui: null,
        textDone: false,
        icon: 0,
        screenInteract: null,
        callback: null,
        init: function(b, a, d, c) {
            this.parent();
            this.hook.zIndex = 9999999;
            this.hook.localAlpha = 0.8;
            this.hook.temporary = true;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = c;
            this.icon = a || sc.DIALOG_INFO_ICON.NONE;
            this.textGui = new sc.TextGui(b, {
                maxWidth: 300 + (!d ? 15 :
                    0)
            });
            b = new ig.GuiElementBase;
            b.addChildGui(this.textGui);
            if (d) {
                a = Math.max(16, this.textGui.hook.size.y);
                if (this.icon) {
                    c = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
                    b.addChildGui(c);
                    d = Math.max(16, this.textGui.hook.size.x + 15 + 4);
                    c.setPos(0, 1);
                    this.textGui.setPos(19, 0)
                } else d = Math.max(16, this.textGui.hook.size.x)
            } else {
                d = Math.max(16, this.textGui.hook.size.x);
                if (this.icon) {
                    c = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
                    b.addChildGui(c);
                    a = Math.max(16, this.textGui.hook.size.y + 15 + 4);
                    c.setPos(d / 2 - 7.5, 2);
                    this.textGui.setPos(0, 19)
                } else a = Math.max(16, this.textGui.hook.size.y)
            }
            b.setSize(d, a);
            this.msgBox = new sc.CenterBoxGui(b);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            this.textGui.textBlock.onFinish = this._onTextFinish.bind(this);
            this.textDone = this.textGui.textBlock.isFinished();
            this.screenInteract = new sc.ScreenInteractEntry(this);
            ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
        },
        update: function() {
            !this.hook.removeAfterTransition && (this.textDone && ig.system.skipMode) && this._close();
            this.parent()
        },
        updateDrawables: function(b) {
            b.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        _onTextFinish: function() {
            this.textDone = true
        },
        _close: function() {
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.callback && this.callback()
        },
        onInteraction: function() {
            if (this.textDone) {
                ig.interact.removeEntry(this.screenInteract);
                this._close()
            } else this.textGui.finish()
        }
    });
    sc.ModalButtonInteract = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        msgBox: null,
        textGui: null,
        content: null,
        buttons: [],
        icon: 0,
        buttonInteract: null,
        buttongroup: null,
        callback: null,
        back: null,
        keepOpen: false,
        init: function(b, a, d, c, e) {
            this.parent();
            this.hook.zIndex = 9999999;
            this.hook.localAlpha = 0.8;
            this.hook.temporary = true;
            this.hook.pauseGui =
                true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = c;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttongroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttongroup);
            this.buttongroup.addPressCallback(function(a) {
                this.keepOpen || this.hide();
                this.callback && a.data != void 0 && this.callback(a, this)
            }.bind(this));
            this.back = new sc.ButtonGui("", sc.BUTTON_DEFAULT_WIDTH);
            this.back.data = -1;
            this.back.submitSound = sc.BUTTON_SOUND.back;
            this.back.onButtonPress =
                function() {
                    this.hide();
                    this.callback && this.callback(this.back)
                }.bind(this);
            this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
            this.icon = a || sc.DIALOG_INFO_ICON.NONE;
            this.textGui = new sc.TextGui(b, {
                maxWidth: 315
            });
            this.content = new ig.GuiElementBase;
            this.content.addChildGui(this.textGui);
            a = b = 0;
            c = null;
            if (d) {
                var f = new ig.GuiElementBase;
                f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                for (var g = d.length >= 4, h = 0; h < d.length; h++) {
                    c = new sc.ButtonGui(d[h], sc.BUTTON_TOP_MENU_WIDTH,
                        true, sc.BUTTON_TYPE.SMALL);
                    if (e) c.submitSound = null;
                    if (g) {
                        c.setPos(0, a);
                        a = a + (sc.BUTTON_TYPE.SMALL + 1);
                        if (c.hook.size.x > b) b = c.hook.size.x;
                        this.buttongroup.addFocusGui(c, 0, h)
                    } else {
                        c.setPos(b, 0);
                        b = b + (c.hook.size.x + 1);
                        if (c.hook.size.y > a) a = c.hook.size.y;
                        this.buttongroup.addFocusGui(c, h, 0)
                    }
                    c.data = h;
                    this.buttons.push(c);
                    f.addChildGui(c)
                }
                f.setSize(b, a);
                this.content.addChildGui(f)
            }
            if (this.icon) {
                e = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
                this.content.addChildGui(e);
                d = Math.max(16, this.textGui.hook.size.x +
                    15 + 4);
                e.setPos(0, 1);
                this.textGui.setPos(19, 0)
            } else d = Math.max(16, this.textGui.hook.size.x);
            if (b > d) {
                d = b;
                this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
            }
            e = Math.max(16, this.textGui.hook.size.y + a + 4);
            this.content.setSize(d, e);
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            b.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        show: function() {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("DEFAULT");
            this.doStateTransition("DEFAULT");
            this.buttons.length > 1 && sc.model.addChoiceGui(this)
        },
        hide: function() {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            sc.model.removeChoiceGui(this)
        },
        onBackButtonCheck: function() {
            return sc.control.menuBack()
        },
        onDetach: function() {}
    });
    sc.Dialogs = {
        showDialog: function(b, a, d, c) {
            b = new sc.ModalScreenInteract(b, a, d, c);
            ig.gui.addGuiElement(b)
        },
        showInfoDialog: function(b, a, d) {
            this.showDialog(b, sc.DIALOG_INFO_ICON.INFO, a, d)
        },
        showWarningDialog: function(b, a, d) {
            this.showDialog(b, sc.DIALOG_INFO_ICON.WARNING, a, d)
        },
        showErrorDialog: function(b, a, d) {
            this.showDialog(b, sc.DIALOG_INFO_ICON.ERROR, a, d)
        },
        showQuestionDialog: function(b, a, d) {
            this.showDialog(b, sc.DIALOG_INFO_ICON.QUESTION, a, d)
        },
        showChoiceDialog: function(b, a, d, c, e) {
            if (!(d instanceof Array)) throw Error("options must be an array!");
            b = new sc.ModalButtonInteract(b, a, d, c, e);
            ig.gui.addGuiElement(b);
            b.show()
        },
        showConformationDialog: function(b, a, d, c) {
            this.showChoiceDialog(b, a, [d], c)
        },
        showYesNoDialog: function(b, a, d, c) {
            this.showChoiceDialog(b, a, [ig.lang.get("sc.gui.dialogs.yes"), ig.lang.get("sc.gui.dialogs.no")], d, c)
        }
    }
});
ig.baked = !0;
