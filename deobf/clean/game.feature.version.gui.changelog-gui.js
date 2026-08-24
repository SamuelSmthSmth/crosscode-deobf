ig.module("game.feature.version.gui.changelog-gui").requires("impact.base.image", "impact.base.event", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.button-interact", "game.feature.control.control", "game.feature.gui.base.button", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc").defines(function() {
    function getChangeColor(text) {
        return text.indexOf("+") == 0 ? 0 : text.indexOf("~") == 0 ? 3 : text.indexOf("-") == 0 ? 6 : 9
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
        setElement: function(element) {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true);
            this.content.addChildGui(element);
            this._updateContentHeight()
        },
        scroll: function(amount, time) {
            this.scrollPane.scrollY(amount, time, 0.05)
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
        setSize: function(width, height) {
            this.parent(width, height);
            this.scrollPane.setSize(width, height)
        },
        _updateContentHeight: function() {
            var children = this.content.hook.children,
                children = children[children.length - 1];
            this.content.hook.size.y = children.pos.y + children.size.y;
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
        init: function(text, icon, iconRight) {
            this.parent();
            this.icon = new sc.TextGui(icon);
            this.text = new sc.TextGui(text, {
                font: sc.fontsystem.tinyFont
            });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN_Y.BOTTOM);
            this.icon.setPos(iconRight ? this.text.hook.size.x + 2 : 0, 0);
            this.text.setPos(iconRight ? 0 : this.icon.hook.size.x, 2);
            this.setSize(this.icon.hook.size.x +
                this.text.hook.size.x + (iconRight ? 2 : 0), 17);
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
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.CENTER);
            this.msgBox.setPos(0, -10);
            this.addChildGui(this.msgBox);
            this.back = new sc.ButtonGui("\\i[back]Back", sc.BUTTON_DEFAULT_WIDTH);
            this.back.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.CENTER);
            this.back.setPos(sc.BUTTON_DEFAULT_WIDTH / 2 + 4, 122 + this.back.hook.size.y - 10);
            this.back.submitSound = sc.BUTTON_SOUND.back;
            this.back.onButtonPress = function() {
                this.hideLog()
            }.bind(this);
            this.addChildGui(this.back);
            this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
            this.compiledButton = new sc.ButtonGui("\\i[help]Show Newest",
                sc.BUTTON_DEFAULT_WIDTH);
            this.compiledButton.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.CENTER);
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
        setHeaderText: function(name, version) {
            this.compiledMode ? this.header.setText("Updates since last Login - " + version) : this.header.setText("v" + version + " [" + name + "]")
        },
        update: function() {
            if (!ig.interact.isBlocked()) {
                sc.control.menuScrollUp() ?
                    this.scrollContainer.scroll(-20) : sc.control.menuScrollDown() && this.scrollContainer.scroll(20);
                sc.control.downDown() ? this.scrollContainer.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scrollContainer.scroll(-200 * ig.system.tick)
            }
        },
        updateDrawables: function(drawables) {
            drawables.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
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
            var oldIndex = this.currentIndex;
            this.currentIndex++;
            if (this.currentIndex >= this.logs.length - 1) this.currentIndex = this.logs.length - 1;
            oldIndex != this.currentIndex &&
                this.setLogEntry(this.logs[this.currentIndex])
        },
        onRightPressed: function() {
            var oldIndex = this.currentIndex;
            this.currentIndex--;
            if (this.currentIndex <= 0) this.currentIndex = 0;
            oldIndex != this.currentIndex && this.setLogEntry(this.logs[this.currentIndex])
        },
        setCompiledList: function() {
            var logs = sc.version.getLogsBetweenVersions(this.compileList);
            if (!this.compileEntry) {
                var entry = {};
                if (logs.length == 0) {
                    logs.push(sc.version.changelog[0]);
                    entry.version = "[v" + logs[0].version + "]"
                } else entry.version = logs.length == 1 ? "[v" + logs[0].version + "]" : "[v" + logs[logs.length - 1].version +
                    " - v" + logs[0].version + "]";
                entry.fixes = [];
                entry.changes = [];
                for (var fixes = null, i = 0, j = 0, j = 0; j < logs.length; j++) {
                    if (fixes = logs[j].fixes)
                        for (i = 0; i < fixes.length; i++) entry.fixes.push(fixes[i]);
                    if (fixes = logs[j].changes)
                        for (i = 0; i < fixes.length; i++) entry.changes.push(fixes[i])
                }
                entry.changes.length == 0 ? entry.changes = null : entry.changes.sort(function(a, c) {
                    return getChangeColor(a) - getChangeColor(c)
                }.bind(this));
                this.compileEntry = entry
            }
            this.setLogEntry(this.compileEntry)
        },
        setLogEntry: function(entry) {
            if (entry) {
                var container = new ig.GuiElementBase;
                container.hook.size.x = 296;
                var list = null,
                    offsetY = 0,
                    i = 0;
                this.setHeaderText(entry.name, entry.version);
                if (entry.fixes) {
                    offsetY =
                        this.createHeaderEntry(container, offsetY, "Bug Fixes", sc.FONT_COLORS.RED);
                    list = entry.fixes;
                    for (i = 0; i < list.length; i++) offsetY = this.createTextEntry(container, offsetY, list[i], true)
                }
                if (entry.changes) {
                    offsetY = this.createHeaderEntry(container, offsetY, "Changes", sc.FONT_COLORS.PURPLE);
                    list = entry.changes;
                    for (i = 0; i < list.length; i++) offsetY = this.createTextEntry(container, offsetY, list[i])
                }
                container.hook.size.y = offsetY;
                this.scrollContainer.setElement(container);
                this.currentIndex >= this.logs.length - 1 ? this.browseLeft.doStateTransition("HIDDEN", true) : this.browseLeft.doStateTransition("DEFAULT", true);
                this.currentIndex == 0 ? this.browserRight.doStateTransition("HIDDEN",
                    true) : this.browserRight.doStateTransition("DEFAULT", true)
            }
        },
        createHeaderEntry: function(container, offsetY, text, color, centered) {
            text = new sc.TextGui("\\c[" + color + "]" + text + "\\c[0]");
            centered && text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.TOP);
            centered = new ig.ColorGui("#7E7E7E", 296, 1);
            text.setPos(2, offsetY);
            offsetY = offsetY + (text.hook.size.y + 2 - 2);
            centered.setPos(0, offsetY);
            offsetY = offsetY + 3;
            container.addChildGui(text);
            container.addChildGui(centered);
            return offsetY
        },
        createTextEntry: function(container, offsetY, text, isFix) {
            var color = 0,
                prefix = "+";
            if (isFix) prefix = "~";
            else if (text.indexOf("+") == 0) color = sc.FONT_COLORS.GREEN;
            else if (text.indexOf("~") == 0) {
                prefix = "~";
                color = sc.FONT_COLORS.PURPLE
            } else if (text.indexOf("-") ==
                0) {
                prefix = "-";
                color = sc.FONT_COLORS.RED
            } else {
                isFix = true;
                prefix = "~"
            }
            prefix = new sc.TextGui("\\c[" + color + "]" + prefix + "\\c[0]");
            prefix.setPos(4, offsetY);
            text = new sc.TextGui("\\c[" + color + "]" + (isFix ? text : text.substring(2)) + "\\c[0]", {
                maxWidth: 280
            });
            text.setPos(15, offsetY);
            container.addChildGui(prefix);
            container.addChildGui(text);
            return offsetY = offsetY + text.hook.size.y
        },
        createLogEntries: function() {
            this.currentIndex = 0;
            this.setLogEntry(this.logs[0])
        },
        createContent: function() {
            var offsetY = 2;
            this.logs = sc.version.changelog;
            this.header = new sc.TextGui("Changelog - " + sc.version.toString());
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN_Y.TOP);
            this.header.setPos(0, offsetY);
            this.content.addChildGui(this.header);
            var offsetY = offsetY + (this.header.hook.size.y + 2),
                line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.TOP);
            line.setPos(0, offsetY);
            this.content.addChildGui(line);
            offsetY = offsetY + 1;
            this.browseLeft = new sc.PrevNextText("Previous Log", "\\i[circle-left]", false);
            this.browseLeft.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN_Y.BOTTOM);
            this.browseLeft.setPos(-2, -2);
            this.browseLeft.doStateTransition("HIDDEN", true);
            this.browseLeft.invokeButtonPress = this.onLeftPressed.bind(this);
            this.content.addChildGui(this.browseLeft);
            this.browserRight = new sc.PrevNextText("Next Log", "\\i[circle-right]", true);
            this.browserRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
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
            this.scrollContainer.setPos(0, offsetY);
            this.scrollContainer.setSize(301, 202);
            offsetY = offsetY + this.scrollContainer.hook.size.y;
            line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.TOP);
            line.setPos(0, offsetY);
            this.content.addChildGui(line);
            this.content.addChildGui(this.scrollContainer)
        }
    })
});
ig.baked = !0;
