/**
 * game.feature.menu.gui.help-boxes
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.help-boxes")`.
 *
 * Multi-page help/message boxes used by the help menu and various dialogs:
 * - `sc.HelpScrollContainer`: a Y-scrolling pane holding one content GUI.
 * - `sc.MultiPagePageCounter`: "page / max" counter with a slash icon.
 * - `sc.MultiPageBoxGui`: a centered message box that can hold multiple
 *   pages of text/list content with left/right turn buttons; list entries
 *   support the mini-markup (!!min=, --, !!====, ......, ...., .., __).
 */
ig.module("game.feature.menu.gui.help-boxes")
    .requires("impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.HelpScrollContainer = ig.GuiElementBase.extend({
        scrollPane: null,
        content: null,

        init: function () {
            this.parent();
            this.content = new ig.GuiElementBase;
            this.scrollPane = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollPane.setContent(this.content);
            this.scrollPane.showTopBar = false;
            this.scrollPane.showBottomBar = false;
            this.addChildGui(this.scrollPane)
        },

        setElement: function (element) {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true);
            this.content.addChildGui(element);
            this._updateContentHeight()
        },

        scroll: function (delta, skipSounds) {
            this.scrollPane.scrollY(delta, skipSounds, 0.05)
        },

        getScrollY: function () {
            return this.scrollPane.getScrollY()
        },

        clear: function () {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true)
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.scrollPane.setSize(width, height)
        },

        _updateContentHeight: function () {
            var children = this.content.hook.children,
                lastChild = children[children.length - 1];
            this.content.hook.size.y = lastChild.pos.y + lastChild.size.y;
            this.scrollPane.recalculateScrollBars()
        }
    });

    var minWidth = -1;

    sc.MultiPagePageCounter = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
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
        count: null,
        max: null,

        init: function (width) {
            this.parent();
            this.setSize(width, 8);
            this.count = new sc.NumberGui(9);
            this.count.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.count.setPos(width / 2 - 13, 0);
            this.max = new sc.NumberGui(9);
            this.max.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.max.setPos(width / 2 + 5, 0);
            var slash = new ig.ImageGui(this.gfx, 96, 0, 8, 8);
            slash.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            slash.setPos(width / 2 - 4, 0);
            this.addChildGui(this.count);
            this.addChildGui(this.max);
            this.addChildGui(slash)
        },

        setCount: function (count) {
            this.count.setNumber(count, true)
        },

        setMax: function (max) {
            this.max.setNumber(max, true)
        }
    });

    sc.MultiPageBoxGui = ig.GuiElementBase.extend({
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
        header: null,
        buttonInteract: null,
        buttonGroup: null,
        defaultHeaderText: "Default",
        linePadding: 2,
        listPadding: 2,
        turnLeft: null,
        turnRight: null,
        pageCounter: null,
        pages: [],
        curPage: 0,
        backSound: null,
        _width: 300,

        init: function (width, height) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.localAlpha = 0.8;
            width = width || 300;
            height = height || 240;
            this._width = width;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content = new ig.GuiElementBase;
            this.content.setSize(width, height);
            this._createInitContent(width);
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.msgBox.setPos(0, 0);
            this.addChildGui(this.msgBox);
            this.turnLeft = new sc.ButtonGui("\\i[arrow-left]");
            this.turnLeft.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.turnLeft.setPos(-(width / 2 + this.turnLeft.hook.size.x + 4), 0);
            this.turnLeft.hook.transitions = {
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
            };
            this.turnLeft.onButtonPress = function () {
                var prevPage = this.curPage;
                this.curPage--;
                if (this.curPage <= 0) this.curPage = 0;
                if (prevPage != this.curPage) this._setPage(this.curPage)
            }.bind(this);
            this.turnLeft.doStateTransition("HIDDEN", true);
            this.addChildGui(this.turnLeft);
            this.turnRight = new sc.ButtonGui("\\i[arrow-right]");
            this.turnRight.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.turnRight.setPos(width / 2 + this.turnRight.hook.size.x + 4, 0);
            this.turnRight.hook.transitions = {
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
            };
            this.turnRight.onButtonPress = function () {
                var prevPage = this.curPage;
                this.curPage++;
                if (this.curPage >= this.pages.length - 1) this.curPage = this.pages.length - 1;
                if (prevPage != this.curPage) this._setPage(this.curPage)
            }.bind(this);
            this.turnRight.doStateTransition("HIDDEN", true);
            this.addChildGui(this.turnRight);
            this.backSound = sc.BUTTON_SOUND.back;
            this.doStateTransition("HIDDEN", true)
        },

        openMenu: function () {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.buttonInteract.clearAllButtons();
            this.msgBox.doStateTransition("DEFAULT");
            this.turnLeft.doStateTransition("HIDDEN", true);
            this.turnRight.doStateTransition("HIDDEN", true);
            this.curPage = 0;
            if (this.pages.length > 0) this._setPage(0);
            if (this.pages.length > 1) this.pageCounter.doStateTransition("DEFAULT", true);
            else this.pageCounter.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },

        closeMenu: function () {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true)
        },

        addPage: function (header, content, isList) {
            this.pages.push({
                header: header || null,
                content: content || null,
                isList: isList || false
            });
            this.pageCounter.setMax(this.pages.length)
        },

        addPages: function (pages) {
            var condition = new ig.VarCondition;
            if (pages && pages != "UNKNOWN LABEL")
                for (var i = 0; i < pages.length; i++) {
                    if (pages[i].condition) {
                        condition.setCondition(pages[i].condition);
                        if (!condition.evaluate()) continue
                    }
                    this.addPage(pages[i].title, pages[i].content, pages[i].content instanceof Array)
                }
        },

        setDefaultHeaderText: function (text) {
            this.defaultHeaderText = text || "DEFAULT";
            this.header.setText(this.defaultHeaderText)
        },

        _setPage: function (index) {
            var pageContent = new ig.GuiElementBase;
            pageContent.hook.size.x = 296;
            var page = this.pages[index];
            this.header.setText(page.header || this.defaultHeaderText);
            var posY = 2;
            minWidth = -1;
            if (page.content)
                if (page.isList)
                    for (var entries = page.content, i = 0; i < entries.length; i++) posY = this.addListEntry(entries[i], pageContent, posY);
                else posY = this.addListEntry(page.content, pageContent, posY);
            pageContent.hook.size.y = posY;
            this.scrollContainer.setElement(pageContent);
            this.pageCounter.setCount(index + 1);
            if (this.curPage >= this.pages.length - 1) {
                this.turnRight.unsetFocus();
                this.buttonInteract.removeGlobalButton(this.turnRight);
                this.turnRight.doStateTransition("HIDDEN", true)
            } else if (this.pages.length > 1) {
                this.buttonInteract.addGlobalButton(this.turnRight, this.onTurnRightCheck.bind(this), true);
                this.turnRight.doStateTransition("DEFAULT", true)
            }
            if (this.curPage == 0) {
                this.buttonInteract.removeGlobalButton(this.turnLeft);
                this.turnLeft.unsetFocus();
                this.turnLeft.doStateTransition("HIDDEN", true)
            } else if (this.pages.length > 1) {
                this.buttonInteract.addGlobalButton(this.turnLeft, this.onTurnLeftCheck.bind(this), true);
                this.turnLeft.doStateTransition("DEFAULT", true)
            }
        },

        addListEntry: function (text, parentGui, posY) {
            var text = ig.LangLabel.getText(text),
                gui = null;
            if (text.indexOf("!!min=") == 0) minWidth = text.substring(6) * 1;
            else if (text.indexOf("--") == 0) {
                var entryText = text.substring(2),
                    splitIndex = entryText.indexOf("--");
                if (splitIndex == -1) {
                    gui = new sc.TextGui("\\i[li]" + entryText, {
                        maxWidth: this._width - 8
                    });
                    gui.setPos(0, posY);
                    posY = posY + (gui.hook.size.y + this.listPadding);
                    parentGui.addChildGui(gui)
                } else {
                    gui = new sc.TextGui("\\i[li]" + (splitIndex != -1 ? entryText.substring(0, splitIndex) : ""));
                    gui.setPos(0, posY);
                    if (splitIndex != -1) parentGui.addChildGui(gui);
                    splitIndex = splitIndex == -1 ? 2 : splitIndex + 4;
                    text = new sc.TextGui(text.substring(splitIndex), {
                        maxWidth: this._width - (minWidth == -1 ? gui.hook.size.x - 8 : minWidth + 8)
                    });
                    text.setPos(splitIndex == 2 ? 9 : minWidth == -1 ? gui.hook.size.x + 4 : minWidth, posY);
                    posY = posY + (text.hook.size.y + this.listPadding);
                    parentGui.addChildGui(text)
                }
            } else if (text.indexOf("!!====") == 0) {
                gui = new ig.ColorGui("#7E7E7E", 296, 1);
                gui.setPos(0, posY);
                parentGui.addChildGui(gui);
                posY = posY + 3
            } else if (text.indexOf("......") == 0) posY = posY + 4;
            else if (text.indexOf("....") == 0) posY = posY + 2;
            else if (text.indexOf("..") == 0) posY = posY + 1;
            else {
                if (text.indexOf("__") == 0) {
                    gui = new sc.TextGui(text.substring(2), {
                        maxWidth: this._width - 4
                    });
                    gui.setPos(0, posY);
                    gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
                } else {
                    gui = new sc.TextGui(text, {
                        maxWidth: this._width - 4
                    });
                    gui.setPos(0, posY)
                }
                parentGui.addChildGui(gui);
                posY = posY + (gui.hook.size.y + this.linePadding)
            }
            return posY
        },

        _createInitContent: function (width) {
            var posY = 2;
            this.header = new sc.TextGui(this.defaultHeaderText);
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.header.setPos(0, posY);
            this.content.addChildGui(this.header);
            var posY = posY + (this.header.hook.size.y + 2),
                line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, posY);
            this.content.addChildGui(line);
            posY = posY + 1;
            this.scrollContainer = new sc.HelpScrollContainer;
            this.scrollContainer.setPos(0, posY);
            this.scrollContainer.setSize(301, 208);
            posY = posY + this.scrollContainer.hook.size.y;
            line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, posY);
            this.content.addChildGui(line);
            this.content.addChildGui(this.scrollContainer);
            posY = posY + 4;
            this.pageCounter = new sc.MultiPagePageCounter(width);
            this.pageCounter.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.pageCounter.setPos(0, posY);
            this.pageCounter.doStateTransition("HIDDEN", true);
            this.content.addChildGui(this.pageCounter)
        },

        onTurnLeftCheck: function () {
            return sc.control.menuCircleLeft() || sc.control.leftPressed()
        },

        onTurnRightCheck: function () {
            return sc.control.menuCircleRight() || sc.control.rightPressed()
        },

        update: function () {
            if (!ig.interact.isBlocked()) {
                if (sc.control.menuScrollUp()) this.scrollContainer.scroll(-20);
                else if (sc.control.menuScrollDown()) this.scrollContainer.scroll(20);
                if (sc.control.downDown()) this.scrollContainer.scroll(200 * ig.system.tick);
                else if (sc.control.upDown()) this.scrollContainer.scroll(-200 * ig.system.tick);
                if (sc.control.menuBack()) this.closeMenu()
            }
        },

        updateDrawables: function (ctx) {
            ctx.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        }
    })
});
ig.baked = !0;
