ig.module("game.feature.menu.gui.help.help-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.help.help-misc").defines(function() {
    var b = {
        x: 1E5,
        y: 1E5
    };
    sc.HelpScreen = ig.GuiElementBase.extend({
        hotkeyHelp: null,
        hotkeyBack: null,
        topBar: null,
        bottomBar: null,
        box: null,
        color: null,
        content: null,
        info: null,
        buttonInteract: null,
        buttonGroup: null,
        backCallback: null,
        manualTitle: null,
        manualContent: null,
        manualGui: null,
        base: null,
        addons: [],
        fillEmptySpaces: false,
        init: function(a, b, c, e, f) {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.fillEmptySpaces = f || false;
            this.base = a;
            this.manualTitle = b;
            this.manualContent = c;
            this.backCallback = e || null;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addSelectionCallback(function(a) {
                if (a.data)
                    if (a.data.annotation) {
                        var b = a.data.annotation.content;
                        this.info.show(a, b.title, b.description, b, a.data.annotation.descType)
                    } else this.info.hide();
                else this.info.hide()
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function() {
                this.info.hide()
            }.bind(this));
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.color = new ig.ColorGui("#000", ig.system.width, ig.system.height);
            this.color.hook.transitions = {
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
            };
            this.color.hook.localAlpha =
                0.5;
            this.color.doStateTransition("HIDDEN", true);
            this.addChildGui(this.color);
            this.topBar = new ig.ColorGui("#151515", this.hook.size.x, 22);
            this.topBar.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetY: -23
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.topBar.doStateTransition("HIDDEN", true);
            this.addChildGui(this.topBar);
            a = new sc.TextGui("\\i[help-icon]" + ig.lang.get("sc.gui.menu.menu-titles.help"));
            a.setPos(2, 3);
            this.topBar.addChildGui(a);
            this.bottomBar =
                new ig.ColorGui("#151515", this.hook.size.x, 1);
            this.bottomBar.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetY: -1
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.bottomBar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bottomBar.doStateTransition("HIDDEN", true);
            this.addChildGui(this.bottomBar);
            this.box = new sc.HelpScreenBorder;
            this.addChildGui(this.box);
            this.content = new ig.GuiElementBase;
            this.content.setSize(ig.system.width, ig.system.height);
            this.content.hook.transitions = {
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
            };
            this.content.doStateTransition("HIDDEN", true);
            this.addChildGui(this.content);
            this.info = new sc.HelpInfoBox;
            this.addChildGui(this.info);
            this.hotkeyBack = new sc.ButtonGui("\\i[back]" + ig.lang.get("sc.gui.menu.back"), sc.BUTTON_TOP_MENU_WIDTH, true, sc.BUTTON_TYPE.SMALL, sc.BUTTON_SOUND.back);
            this.hotkeyBack.keepMouseFocus = true;
            this.hotkeyBack.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyBack.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyBack.onButtonPress = this.onBackButtonPressed.bind(this);
            this.hotkeyBack.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hotkeyBack.setData(ig.lang.get("sc.gui.menu.description.back"));
            this.hotkeyBack.doStateTransition("HIDDEN", true);
            this.addChildGui(this.hotkeyBack);
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.manual"),
                void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyHelp.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
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
            this.hotkeyHelp.keepMouseFocus = true;
            this.hotkeyHelp.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hotkeyHelp.setPos(this.hotkeyBack.hook.size.x + 7, 0);
            this.hotkeyHelp.doStateTransition("HIDDEN", true);
            this.addChildGui(this.hotkeyHelp);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        openMenu: function(a) {
            this.addObservers();
            sc.menu.helpMenuOpen = true;
            ig.interact.addEntry(this.buttonInteract);
            this.hotkeyHelp.doStateTransition("DEFAULT", false, false, null, 0.2);
            this.hotkeyBack.doStateTransition("DEFAULT", true);
            Vec2.assignC(b, 1E5, 1E5);
            this.buttonGroup.clear();
            this.content.removeAllChildren();
            this.createAnnotationsRec(this.base.hook,
                0, 0, 0);
            for (var d = 0; d < this.addons.length; d++) this.createAnnotationsRec(this.addons[d].hook, 0, 0, 0);
            !a && this.fillEmptySpaces && this.buttonGroup.fillEmptySpace();
            this.buttonGroup.setCurrentFocus(b.x, b.y);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content.doStateTransition("DEFAULT");
            this.color.doStateTransition("DEFAULT");
            this.topBar.doStateTransition("DEFAULT");
            this.bottomBar.doStateTransition("DEFAULT");
            this.box.show();
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys()
        },
        exitMenu: function() {
            this.removeObservers();
            sc.menu.helpMenuOpen = false;
            this.color.doStateTransition("HIDDEN");
            this.topBar.doStateTransition("HIDDEN");
            this.bottomBar.doStateTransition("HIDDEN");
            this.box.hide();
            this.content.doStateTransition("HIDDEN");
            this.hotkeyHelp.doStateTransition("HIDDEN", false, false, function() {
                this.hotkeyBack.doStateTransition("HIDDEN", true)
            }.bind(this));
            this.info.hide();
            this.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            this.buttonInteract.removeGlobalButton(this.hotkeyBack);
            this.buttonInteract.removeButtonGroup(this.buttonGroup);
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.backCallback && this.backCallback()
        },
        createAnnotationsRec: function(a, b, c, e) {
            var f = a.children;
            e++;
            if (!(f.length == 0 || e >= 5))
                for (var g = 0; g < f.length; g++) {
                    var h = f[g];
                    if ((!h.gui.isHelpVisible || h.gui.isHelpVisible()) && h._visible) {
                        switch (h.align.x) {
                            case ig.GUI_ALIGN.X_LEFT:
                                b = b + h.pos.x;
                                break;
                            case ig.GUI_ALIGN.X_CENTER:
                                b = b + (h.pos.x + Math.floor(a.size.x / 2) - Math.floor(h.size.x / 2));
                                break;
                            case ig.GUI_ALIGN.X_RIGHT:
                                b = b + (a.size.x - h.size.x -
                                    h.pos.x)
                        }
                        switch (h.align.y) {
                            case ig.GUI_ALIGN.Y_TOP:
                                c = c + h.pos.y;
                                break;
                            case ig.GUI_ALIGN.Y_CENTER:
                                c = c + (h.pos.y + Math.floor(a.size.y / 2) - Math.floor(h.size.y / 2));
                                break;
                            case ig.GUI_ALIGN.Y_BOTTOM:
                                c = c + (a.size.y - h.size.y - h.pos.y)
                        }
                        if (h.gui.annotation) {
                            var i = h.gui.annotation;
                            if (i.condition && !i.condition()) continue;
                            if (i instanceof Array)
                                for (var j = 0; j < i.length; j++) this.createGUI(h, i[j], b, c);
                            else this.createGUI(h, i, b, c)
                        }
                        this.createAnnotationsRec(h, b, c, e);
                        switch (h.align.x) {
                            case ig.GUI_ALIGN.X_LEFT:
                                b = b - h.pos.x;
                                break;
                            case ig.GUI_ALIGN.X_CENTER:
                                b = b - (h.pos.x + Math.floor(a.size.x / 2) - Math.floor(h.size.x / 2));
                                break;
                            case ig.GUI_ALIGN.X_RIGHT:
                                b = b - (a.size.x - h.size.x - h.pos.x)
                        }
                        switch (h.align.y) {
                            case ig.GUI_ALIGN.Y_TOP:
                                c = c - h.pos.y;
                                break;
                            case ig.GUI_ALIGN.Y_CENTER:
                                c = c - (h.pos.y + Math.floor(a.size.y / 2) - Math.floor(h.size.y / 2));
                                break;
                            case ig.GUI_ALIGN.Y_BOTTOM:
                                c = c - (a.size.y - h.size.y - h.pos.y)
                        }
                    }
                }
        },
        createGUI: function(a, b, c, e) {
            var f = new sc.HELP_ANNO_TYPE[b.type || "INFO"](b);
            f.data = {
                annotation: b
            };
            b.offset ? f.setPos(c + b.offset.x, e + b.offset.y) :
                f.setPos(c, e);
            if (b.size) {
                var g = b.size.x,
                    h = b.size.y;
                b.size.x == "dyn" && (g = a.size.x + (b.size.offX || 0));
                b.size.y == "dyn" && (h = a.size.y + (b.size.offY || 0));
                f.setSize(g, h)
            }
            this.content.addChildGui(f);
            a = Math.floor(c);
            e = Math.floor(e);
            if (b.index) {
                a = b.index.x == void 0 ? a : b.index.x;
                e = b.index.y == "last" ? this.buttonGroup.elements[a] ? this.buttonGroup.elements[a].length : 0 : b.index.y == void 0 ? e : b.index.y
            }
            this.addToButtonGroup(f, a, e)
        },
        addToButtonGroup: function(a, d, c) {
            this.buttonGroup.addFocusGui(a, d, c);
            b.x = Math.min(b.x, d);
            b.y =
                Math.min(b.y, c)
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            if (!this.manualGui) {
                this.manualGui = new sc.MultiPageBoxGui;
                this.manualGui.setDefaultHeaderText(this.manualTitle);
                this.manualGui.addPages(this.manualContent);
                this.manualGui.hook.zIndex = 2E5;
                this.manualGui.hook.pauseGui = true
            }
            ig.gui.addGuiElement(this.manualGui);
            this.manualGui.openMenu()
        },
        onHotkeyBackCheck: function() {
            return sc.control.menuBack()
        },
        onBackButtonPressed: function() {
            this.exitMenu()
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.MultiPageBoxGui;
                this.helpGui.setDefaultHeaderText(ig.lang.get("sc.gui.menu.help-texts.save.title"));
                this.helpGui.addPages(ig.lang.get("sc.gui.menu.help-texts.save.pages"));
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function() {
            this.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.buttonInteract.addGlobalButton(this.hotkeyBack, this.onHotkeyBackCheck.bind(this))
        },
        modelChanged: function() {}
    });
    sc.HelpScreenBorder = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 10,
            height: 10,
            left: 9,
            top: 9,
            right: 9,
            bottom: 9,
            offsets: {
                "default": {
                    x: 642,
                    y: 185
                }
            }
        }),
        box: null,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.box = new ig.BoxGui(ig.system.width + 18, ig.system.height + 4 + 18, false, this.ninepatch);
            this.box.setPos(-9, -11);
            this.addChildGui(this.box)
        },
        update: function() {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var a = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    a = this.sizeTransition.timeFunction.get(a);
                this.box.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - a) + this.sizeTransition.width * a);
                this.box.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - a) + this.sizeTransition.height * a);
                if (a == 1) this.sizeTransition = null
            }
        },
        show: function() {
            this.box.doPosTranstition(0, 22, 0.2, KEY_SPLINES.LINEAR);
            this.doSizeTransition(ig.system.width, ig.system.height - 23, 0.2)
        },
        hide: function() {
            this.box.doPosTranstition(-9,
                -11, 0.2, KEY_SPLINES.LINEAR);
            this.doSizeTransition(ig.system.width + 18, ig.system.height + 4 + 18, 0.2)
        },
        doSizeTransition: function(a, b, c, e, f) {
            if (c) this.sizeTransition = {
                startWidth: this.box.hook.size.x,
                width: a || 0,
                startHeight: this.box.hook.size.y,
                height: b || 0,
                time: c,
                timeFunction: e || KEY_SPLINES.LINEAR,
                timer: 0 - (f || 0)
            };
            else {
                this.box.hook.size.x = a;
                this.box.hook.size.y = b
            }
        }
    })
});
ig.baked = !0;
