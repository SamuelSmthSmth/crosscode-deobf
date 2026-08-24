/**
 * game.feature.menu.gui.help.help-menu
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.help.help-menu")`.
 *
 * `sc.HelpScreen`: the contextual help overlay — walks the base menu's
 * GUI tree, creates an annotation button for every annotated element
 * (with help info popups), plus the manual (multi-page help) and back
 * hotkeys. `sc.HelpScreenBorder`: the resizing border frame around the
 * help content area.
 */
ig.module("game.feature.menu.gui.help.help-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.help.help-misc")
    .defines(function () {

    var minFocusPos = {
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

        init: function (base, manualTitle, manualContent, backCallback, fillEmptySpaces) {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.fillEmptySpaces = fillEmptySpaces || false;
            this.base = base;
            this.manualTitle = manualTitle;
            this.manualContent = manualContent;
            this.backCallback = backCallback || null;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addSelectionCallback(function (button) {
                if (button.data)
                    if (button.data.annotation) {
                        var annotation = button.data.annotation.content;
                        this.info.show(button, annotation.title, annotation.description, annotation, button.data.annotation.descType)
                    } else this.info.hide();
                else this.info.hide()
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function () {
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
            this.color.hook.localAlpha = 0.5;
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
            var title = new sc.TextGui("\\i[help-icon]" + ig.lang.get("sc.gui.menu.menu-titles.help"));
            title.setPos(2, 3);
            this.topBar.addChildGui(title);
            this.bottomBar = new ig.ColorGui("#151515", this.hook.size.x, 1);
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
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.manual"), void 0, true, sc.BUTTON_TYPE.SMALL);
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

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        openMenu: function (skipFillEmpty) {
            this.addObservers();
            sc.menu.helpMenuOpen = true;
            ig.interact.addEntry(this.buttonInteract);
            this.hotkeyHelp.doStateTransition("DEFAULT", false, false, null, 0.2);
            this.hotkeyBack.doStateTransition("DEFAULT", true);
            Vec2.assignC(minFocusPos, 1E5, 1E5);
            this.buttonGroup.clear();
            this.content.removeAllChildren();
            this.createAnnotationsRec(this.base.hook, 0, 0, 0);
            for (var i = 0; i < this.addons.length; i++) this.createAnnotationsRec(this.addons[i].hook, 0, 0, 0);
            !skipFillEmpty && this.fillEmptySpaces && this.buttonGroup.fillEmptySpace();
            this.buttonGroup.setCurrentFocus(minFocusPos.x, minFocusPos.y);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content.doStateTransition("DEFAULT");
            this.color.doStateTransition("DEFAULT");
            this.topBar.doStateTransition("DEFAULT");
            this.bottomBar.doStateTransition("DEFAULT");
            this.box.show();
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys()
        },

        exitMenu: function () {
            this.removeObservers();
            sc.menu.helpMenuOpen = false;
            this.color.doStateTransition("HIDDEN");
            this.topBar.doStateTransition("HIDDEN");
            this.bottomBar.doStateTransition("HIDDEN");
            this.box.hide();
            this.content.doStateTransition("HIDDEN");
            this.hotkeyHelp.doStateTransition("HIDDEN", false, false, function () {
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

        createAnnotationsRec: function (hook, x, y, depth) {
            var children = hook.children;
            depth++;
            if (!(children.length == 0 || depth >= 5))
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if ((!child.gui.isHelpVisible || child.gui.isHelpVisible()) && child._visible) {
                        switch (child.align.x) {
                            case ig.GUI_ALIGN.X_LEFT:
                                x = x + child.pos.x;
                                break;
                            case ig.GUI_ALIGN.X_CENTER:
                                x = x + (child.pos.x + Math.floor(hook.size.x / 2) - Math.floor(child.size.x / 2));
                                break;
                            case ig.GUI_ALIGN.X_RIGHT:
                                x = x + (hook.size.x - child.size.x - child.pos.x)
                        }
                        switch (child.align.y) {
                            case ig.GUI_ALIGN.Y_TOP:
                                y = y + child.pos.y;
                                break;
                            case ig.GUI_ALIGN.Y_CENTER:
                                y = y + (child.pos.y + Math.floor(hook.size.y / 2) - Math.floor(child.size.y / 2));
                                break;
                            case ig.GUI_ALIGN.Y_BOTTOM:
                                y = y + (hook.size.y - child.size.y - child.pos.y)
                        }
                        if (child.gui.annotation) {
                            var annotation = child.gui.annotation;
                            if (annotation.condition && !annotation.condition()) continue;
                            if (annotation instanceof Array)
                                for (var j = 0; j < annotation.length; j++) this.createGUI(child, annotation[j], x, y);
                            else this.createGUI(child, annotation, x, y)
                        }
                        this.createAnnotationsRec(child, x, y, depth);
                        switch (child.align.x) {
                            case ig.GUI_ALIGN.X_LEFT:
                                x = x - child.pos.x;
                                break;
                            case ig.GUI_ALIGN.X_CENTER:
                                x = x - (child.pos.x + Math.floor(hook.size.x / 2) - Math.floor(child.size.x / 2));
                                break;
                            case ig.GUI_ALIGN.X_RIGHT:
                                x = x - (hook.size.x - child.size.x - child.pos.x)
                        }
                        switch (child.align.y) {
                            case ig.GUI_ALIGN.Y_TOP:
                                y = y - child.pos.y;
                                break;
                            case ig.GUI_ALIGN.Y_CENTER:
                                y = y - (child.pos.y + Math.floor(hook.size.y / 2) - Math.floor(child.size.y / 2));
                                break;
                            case ig.GUI_ALIGN.Y_BOTTOM:
                                y = y - (hook.size.y - child.size.y - child.pos.y)
                        }
                    }
                }
        },

        createGUI: function (child, annotation, x, y) {
            var gui = new sc.HELP_ANNO_TYPE[annotation.type || "INFO"](annotation);
            gui.data = {
                annotation: annotation
            };
            annotation.offset ? gui.setPos(x + annotation.offset.x, y + annotation.offset.y) : gui.setPos(x, y);
            if (annotation.size) {
                var width = annotation.size.x,
                    height = annotation.size.y;
                annotation.size.x == "dyn" && (width = child.size.x + (annotation.size.offX || 0));
                annotation.size.y == "dyn" && (height = child.size.y + (annotation.size.offY || 0));
                gui.setSize(width, height)
            }
            this.content.addChildGui(gui);
            x = Math.floor(x);
            y = Math.floor(y);
            if (annotation.index) {
                x = annotation.index.x == void 0 ? x : annotation.index.x;
                y = annotation.index.y == "last" ? this.buttonGroup.elements[x] ? this.buttonGroup.elements[x].length : 0 : annotation.index.y == void 0 ? y : annotation.index.y
            }
            this.addToButtonGroup(gui, x, y)
        },

        addToButtonGroup: function (gui, x, y) {
            this.buttonGroup.addFocusGui(gui, x, y);
            minFocusPos.x = Math.min(minFocusPos.x, x);
            minFocusPos.y = Math.min(minFocusPos.y, y)
        },

        onHotkeyHelpCheck: function () {
            return sc.control.menuHotkeyHelp()
        },

        onHelpButtonPressed: function () {
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

        onHotkeyBackCheck: function () {
            return sc.control.menuBack()
        },

        onBackButtonPressed: function () {
            this.exitMenu()
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.MultiPageBoxGui;
                this.helpGui.setDefaultHeaderText(ig.lang.get("sc.gui.menu.help-texts.save.title"));
                this.helpGui.addPages(ig.lang.get("sc.gui.menu.help-texts.save.pages"));
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        onAddHotkeys: function () {
            this.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            this.buttonInteract.addGlobalButton(this.hotkeyBack, this.onHotkeyBackCheck.bind(this))
        },

        modelChanged: function () {}
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

        init: function () {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.box = new ig.BoxGui(ig.system.width + 18, ig.system.height + 4 + 18, false, this.ninepatch);
            this.box.setPos(-9, -11);
            this.addChildGui(this.box)
        },

        update: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var t = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    t = this.sizeTransition.timeFunction.get(t);
                this.box.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - t) + this.sizeTransition.width * t);
                this.box.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - t) + this.sizeTransition.height * t);
                if (t == 1) this.sizeTransition = null
            }
        },

        show: function () {
            this.box.doPosTranstition(0, 22, 0.2, KEY_SPLINES.LINEAR);
            this.doSizeTransition(ig.system.width, ig.system.height - 23, 0.2)
        },

        hide: function () {
            this.box.doPosTranstition(-9, -11, 0.2, KEY_SPLINES.LINEAR);
            this.doSizeTransition(ig.system.width + 18, ig.system.height + 4 + 18, 0.2)
        },

        doSizeTransition: function (width, height, time, timeFunction, delay) {
            if (time) this.sizeTransition = {
                startWidth: this.box.hook.size.x,
                width: width || 0,
                startHeight: this.box.hook.size.y,
                height: height || 0,
                time: time,
                timeFunction: timeFunction || KEY_SPLINES.LINEAR,
                timer: 0 - (delay || 0)
            };
            else {
                this.box.hook.size.x = width;
                this.box.hook.size.y = height
            }
        }
    })
});
ig.baked = !0;
