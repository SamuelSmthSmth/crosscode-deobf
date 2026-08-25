ig.module("game.feature.version.gui.changelog-gui").requires("impact.base.image", "impact.base.event", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.button-interact", "game.feature.control.control", "game.feature.gui.base.button", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc").defines(function() {
    function b(a) {
        return a.indexOf("+") == 0 ? 0 : a.indexOf("~") == 0 ? 3 : a.indexOf("-") == 0 ? 6 : 9
    }
    sc.ChangeLogScrollContainer = ig.GuiElementBase.extend({
        scrollPane: null,
        content: null,
        init: function() {
            this.parent();
            this.content = new ig.GuiElementBase;
            this.scrollPane = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollPane.setContent(this.content);
            this.scrollPane.showTopBar = false;
            this.scrollPane.showBottomBar = false;
            this.addChildGui(this.scrollPane)
        },
        setElement: function(a) {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true);
            this.content.addChildGui(a);
            this._updateContentHeight()
        },
        scroll: function(a, b) {
            this.scrollPane.scrollY(a, b, 0.05)
        },
        getScrollY: function() {
            return this.scrollPane.getScrollY()
        },
        clear: function() {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true)
        },
        setSize: function(a, b) {
            this.parent(a, b);
            this.scrollPane.setSize(a, b)
        },
        _updateContentHeight: function() {
            var a = this.content.hook.children,
                a = a[a.length - 1];
            this.content.hook.size.y = a.pos.y + a.size.y;
            this.scrollPane.recalculateScrollBars()
        }
    });
    sc.PrevNextText = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
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
        },
        icon: null,
        text: null,
        active: true,
        init: function(a, b, c) {
            this.parent();
            this.icon = new sc.TextGui(b);
            this.text = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont
            });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.icon.setPos(c ? this.text.hook.size.x + 2 : 0, 0);
            this.text.setPos(c ? 0 : this.icon.hook.size.x, 2);
            this.setSize(this.icon.hook.size.x +
                this.text.hook.size.x + (c ? 2 : 0), 17);
            this.addChildGui(this.icon);
            this.addChildGui(this.text)
        }
    });
    sc.ChangelogGui = ig.GuiElementBase.extend({
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
        content: null,
        back: null,
        browseLeft: null,
        browserRight: null,
        scrollContainer: null,
        header: null,
        compiledButton: null,
        buttonInteract: null,
        buttonGroup: null,
        compiledMode: false,
        compileList: [],
        compileEntry: null,
        logs: [],
        currentIndex: null,
        init: function() {
            this.parent();
            this.hook.localAlpha = 0.8;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content = new ig.GuiElementBase;
            this.content.setSize(300, 240);
            this.createContent();
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.msgBox.setPos(0, -10);
            this.addChildGui(this.msgBox);
            this.back = new sc.ButtonGui("\\i[back]Back", sc.BUTTON_DEFAULT_WIDTH);
            this.back.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.back.setPos(sc.BUTTON_DEFAULT_WIDTH / 2 + 4, 122 + this.back.hook.size.y - 10);
            this.back.submitSound = sc.BUTTON_SOUND.back;
            this.back.onButtonPress = function() {
                this.hideLog()
            }.bind(this);
            this.addChildGui(this.back);
            this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
            this.compiledButton = new sc.ButtonGui("\\i[help]Show Newest",
                sc.BUTTON_DEFAULT_WIDTH);
            this.compiledButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.compiledButton.setPos(-sc.BUTTON_DEFAULT_WIDTH / 2 - 4, 122 + this.back.hook.size.y - 10);
            this.compiledButton.onButtonPress = function() {
                this.onToggleCompileMode()
            }.bind(this);
            this.addChildGui(this.compiledButton);
            this.buttonInteract.addGlobalButton(this.compiledButton, this.onCompileButtonCheck.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        showLog: function() {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.compiledMode = false;
            this.createLogEntries();
            this.doStateTransition("DEFAULT")
        },
        hideLog: function() {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("HIDDEN")
        },
        clearLogs: function() {
            this.compileEntry = null;
            this.scrollContainer.clear()
        },
        setHeaderText: function(a, b) {
            this.compiledMode ? this.header.setText("Updates since last Login - " + b) : this.header.setText("v" + b + " [" + a + "]")
        },
        update: function() {
            if (!ig.interact.isBlocked()) {
                sc.control.menuScrollUp() ?
                    this.scrollContainer.scroll(-20) : sc.control.menuScrollDown() && this.scrollContainer.scroll(20);
                sc.control.downDown() ? this.scrollContainer.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scrollContainer.scroll(-200 * ig.system.tick)
            }
        },
        updateDrawables: function(a) {
            a.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        onBackButtonCheck: function() {
            return sc.control.menuBack()
        },
        onCompileButtonCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onToggleCompileMode: function() {
            if (this.compiledMode) {
                this.compiledMode =
                    false;
                this.compiledButton.textChild.setText("\\i[help]Show Newest");
                this.currentIndex = 0;
                this.setLogEntry(this.logs[0])
            } else {
                this.compiledButton.textChild.setText("\\i[help]Show History");
                this.compiledMode = true;
                this.setCompiledList();
                this.browseLeft.doStateTransition("HIDDEN", true);
                this.browserRight.doStateTransition("HIDDEN", true)
            }
        },
        onLeftPressed: function() {
            var a = this.currentIndex;
            this.currentIndex++;
            if (this.currentIndex >= this.logs.length - 1) this.currentIndex = this.logs.length - 1;
            a != this.currentIndex &&
                this.setLogEntry(this.logs[this.currentIndex])
        },
        onRightPressed: function() {
            var a = this.currentIndex;
            this.currentIndex--;
            if (this.currentIndex <= 0) this.currentIndex = 0;
            a != this.currentIndex && this.setLogEntry(this.logs[this.currentIndex])
        },
        setCompiledList: function() {
            var a = sc.version.getLogsBetweenVersions(this.compileList);
            if (!this.compileEntry) {
                var d = {};
                if (a.length == 0) {
                    a.push(sc.version.changelog[0]);
                    d.version = "[v" + a[0].version + "]"
                } else d.version = a.length == 1 ? "[v" + a[0].version + "]" : "[v" + a[a.length - 1].version +
                    " - v" + a[0].version + "]";
                d.fixes = [];
                d.changes = [];
                for (var c = null, e = 0, f = 0, f = 0; f < a.length; f++) {
                    if (c = a[f].fixes)
                        for (e = 0; e < c.length; e++) d.fixes.push(c[e]);
                    if (c = a[f].changes)
                        for (e = 0; e < c.length; e++) d.changes.push(c[e])
                }
                d.changes.length == 0 ? d.changes = null : d.changes.sort(function(a, c) {
                    return b(a) - b(c)
                }.bind(this));
                this.compileEntry = d
            }
            this.setLogEntry(this.compileEntry)
        },
        setLogEntry: function(a) {
            if (a) {
                var b = new ig.GuiElementBase;
                b.hook.size.x = 296;
                var c = null,
                    e = 0,
                    f = 0;
                this.setHeaderText(a.name, a.version);
                if (a.fixes) {
                    e =
                        this.createHeaderEntry(b, e, "Bug Fixes", sc.FONT_COLORS.RED);
                    c = a.fixes;
                    for (f = 0; f < c.length; f++) e = this.createTextEntry(b, e, c[f], true)
                }
                if (a.changes) {
                    e = this.createHeaderEntry(b, e, "Changes", sc.FONT_COLORS.PURPLE);
                    c = a.changes;
                    for (f = 0; f < c.length; f++) e = this.createTextEntry(b, e, c[f])
                }
                b.hook.size.y = e;
                this.scrollContainer.setElement(b);
                this.currentIndex >= this.logs.length - 1 ? this.browseLeft.doStateTransition("HIDDEN", true) : this.browseLeft.doStateTransition("DEFAULT", true);
                this.currentIndex == 0 ? this.browserRight.doStateTransition("HIDDEN",
                    true) : this.browserRight.doStateTransition("DEFAULT", true)
            }
        },
        createHeaderEntry: function(a, b, c, e, f) {
            c = new sc.TextGui("\\c[" + e + "]" + c + "\\c[0]");
            f && c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            f = new ig.ColorGui("#7E7E7E", 296, 1);
            c.setPos(2, b);
            b = b + (c.hook.size.y + 2 - 2);
            f.setPos(0, b);
            b = b + 3;
            a.addChildGui(c);
            a.addChildGui(f);
            return b
        },
        createTextEntry: function(a, b, c, e) {
            var f = 0,
                g = "+";
            if (e) g = "~";
            else if (c.indexOf("+") == 0) f = sc.FONT_COLORS.GREEN;
            else if (c.indexOf("~") == 0) {
                g = "~";
                f = sc.FONT_COLORS.PURPLE
            } else if (c.indexOf("-") ==
                0) {
                g = "-";
                f = sc.FONT_COLORS.RED
            } else {
                e = true;
                g = "~"
            }
            g = new sc.TextGui("\\c[" + f + "]" + g + "\\c[0]");
            g.setPos(4, b);
            c = new sc.TextGui("\\c[" + f + "]" + (e ? c : c.substring(2)) + "\\c[0]", {
                maxWidth: 280
            });
            c.setPos(15, b);
            a.addChildGui(g);
            a.addChildGui(c);
            return b = b + c.hook.size.y
        },
        createLogEntries: function() {
            this.currentIndex = 0;
            this.setLogEntry(this.logs[0])
        },
        createContent: function() {
            var a = 2;
            this.logs = sc.version.changelog;
            this.header = new sc.TextGui("Changelog - " + sc.version.toString());
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_TOP);
            this.header.setPos(0, a);
            this.content.addChildGui(this.header);
            var a = a + (this.header.hook.size.y + 2),
                b = new sc.LineGui(300);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, a);
            this.content.addChildGui(b);
            a = a + 1;
            this.browseLeft = new sc.PrevNextText("Previous Log", "\\i[circle-left]", false);
            this.browseLeft.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.browseLeft.setPos(-2, -2);
            this.browseLeft.doStateTransition("HIDDEN", true);
            this.browseLeft.invokeButtonPress = this.onLeftPressed.bind(this);
            this.content.addChildGui(this.browseLeft);
            this.browserRight = new sc.PrevNextText("Next Log", "\\i[circle-right]", true);
            this.browserRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.browserRight.setPos(-4, -2);
            this.browserRight.doStateTransition("HIDDEN", true);
            this.browserRight.invokeButtonPress = this.onRightPressed.bind(this);
            this.content.addChildGui(this.browserRight);
            this.buttonInteract.addGlobalButton(this.browseLeft, function() {
                return sc.control.menuCircleLeft()
            });
            this.buttonInteract.addGlobalButton(this.browserRight,
                function() {
                    return sc.control.menuCircleRight()
                });
            this.scrollContainer = new sc.ChangeLogScrollContainer;
            this.scrollContainer.setPos(0, a);
            this.scrollContainer.setSize(301, 202);
            a = a + this.scrollContainer.hook.size.y;
            b = new sc.LineGui(300);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, a);
            this.content.addChildGui(b);
            this.content.addChildGui(this.scrollContainer)
        }
    })
});
ig.baked = !0;
