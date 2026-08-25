ig.module("game.feature.menu.gui.help-boxes").requires("impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.HelpScrollContainer = ig.GuiElementBase.extend({
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
    var b = -1;
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
        init: function(a) {
            this.parent();
            this.setSize(a, 8);
            this.count = new sc.NumberGui(9);
            this.count.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.count.setPos(a / 2 - 13, 0);
            this.max = new sc.NumberGui(9);
            this.max.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.max.setPos(a / 2 + 5, 0);
            var b = new ig.ImageGui(this.gfx, 96, 0, 8, 8);
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            b.setPos(a / 2 - 4, 0);
            this.addChildGui(this.count);
            this.addChildGui(this.max);
            this.addChildGui(b)
        },
        setCount: function(a) {
            this.count.setNumber(a,
                true)
        },
        setMax: function(a) {
            this.max.setNumber(a, true)
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
        init: function(a, b) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.localAlpha = 0.8;
            a = a || 300;
            b = b || 240;
            this._width = a;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content = new ig.GuiElementBase;
            this.content.setSize(a, b);
            this._createInitContent(a);
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.msgBox.setPos(0,
                0);
            this.addChildGui(this.msgBox);
            this.turnLeft = new sc.ButtonGui("\\i[arrow-left]");
            this.turnLeft.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.turnLeft.setPos(-(a / 2 + this.turnLeft.hook.size.x + 4), 0);
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
            this.turnLeft.onButtonPress = function() {
                var a = this.curPage;
                this.curPage--;
                if (this.curPage <= 0) this.curPage = 0;
                a != this.curPage && this._setPage(this.curPage)
            }.bind(this);
            this.turnLeft.doStateTransition("HIDDEN", true);
            this.addChildGui(this.turnLeft);
            this.turnRight = new sc.ButtonGui("\\i[arrow-right]");
            this.turnRight.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.turnRight.setPos(a / 2 + this.turnRight.hook.size.x + 4, 0);
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
            this.turnRight.onButtonPress = function() {
                var a = this.curPage;
                this.curPage++;
                if (this.curPage >=
                    this.pages.length - 1) this.curPage = this.pages.length - 1;
                a != this.curPage && this._setPage(this.curPage)
            }.bind(this);
            this.turnRight.doStateTransition("HIDDEN", true);
            this.addChildGui(this.turnRight);
            this.backSound = sc.BUTTON_SOUND.back;
            this.doStateTransition("HIDDEN", true)
        },
        openMenu: function() {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.buttonInteract.clearAllButtons();
            this.msgBox.doStateTransition("DEFAULT");
            this.turnLeft.doStateTransition("HIDDEN", true);
            this.turnRight.doStateTransition("HIDDEN",
                true);
            this.curPage = 0;
            this.pages.length > 0 && this._setPage(0);
            this.pages.length > 1 ? this.pageCounter.doStateTransition("DEFAULT", true) : this.pageCounter.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        closeMenu: function() {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true)
        },
        addPage: function(a, b, c) {
            this.pages.push({
                header: a || null,
                content: b || null,
                isList: c || false
            });
            this.pageCounter.setMax(this.pages.length)
        },
        addPages: function(a) {
            var b = new ig.VarCondition;
            if (a && a != "UNKNOWN LABEL")
                for (var c = 0; c < a.length; c++) {
                    if (a[c].condition) {
                        b.setCondition(a[c].condition);
                        if (!b.evaluate()) continue
                    }
                    this.addPage(a[c].title, a[c].content, a[c].content instanceof Array)
                }
        },
        setDefaultHeaderText: function(a) {
            this.defaultHeaderText = a || "DEFAULT";
            this.header.setText(this.defaultHeaderText)
        },
        _setPage: function(a) {
            var d = new ig.GuiElementBase;
            d.hook.size.x = 296;
            var c = this.pages[a];
            this.header.setText(c.header || this.defaultHeaderText);
            var e = 2;
            b = -1;
            if (c.content)
                if (c.isList)
                    for (var c = c.content, f = 0; f < c.length; f++) e = this.addListEntry(c[f], d, e);
                else e = this.addListEntry(c.content, d, e);
            d.hook.size.y = e;
            this.scrollContainer.setElement(d);
            this.pageCounter.setCount(a + 1);
            if (this.curPage >= this.pages.length - 1) {
                this.turnRight.unsetFocus();
                this.buttonInteract.removeGlobalButton(this.turnRight);
                this.turnRight.doStateTransition("HIDDEN", true)
            } else if (this.pages.length > 1) {
                this.buttonInteract.addGlobalButton(this.turnRight, this.onTurnRightCheck.bind(this),
                    true);
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
        addListEntry: function(a, d, c) {
            var a = ig.LangLabel.getText(a),
                e = null;
            if (a.indexOf("!!min=") == 0) b = a.substring(6) * 1;
            else if (a.indexOf("--") ==
                0) {
                var e = a.substring(2),
                    f = e.indexOf("--");
                if (f == -1) {
                    e = new sc.TextGui("\\i[li]" + e, {
                        maxWidth: this._width - 8
                    });
                    e.setPos(0, c);
                    c = c + (e.hook.size.y + this.listPadding);
                    d.addChildGui(e)
                } else {
                    e = new sc.TextGui("\\i[li]" + (f != -1 ? e.substring(0, f) : ""));
                    e.setPos(0, c);
                    f != -1 && d.addChildGui(e);
                    f = f == -1 ? 2 : f + 4;
                    a = new sc.TextGui(a.substring(f), {
                        maxWidth: this._width - (b == -1 ? e.hook.size.x - 8 : b + 8)
                    });
                    a.setPos(f == 2 ? 9 : b == -1 ? e.hook.size.x + 4 : b, c);
                    c = c + (a.hook.size.y + this.listPadding);
                    d.addChildGui(a)
                }
            } else if (a.indexOf("!!====") == 0) {
                e =
                    new ig.ColorGui("#7E7E7E", 296, 1);
                e.setPos(0, c);
                d.addChildGui(e);
                c = c + 3
            } else if (a.indexOf("......") == 0) c = c + 4;
            else if (a.indexOf("....") == 0) c = c + 2;
            else if (a.indexOf("..") == 0) c = c + 1;
            else {
                if (a.indexOf("__") == 0) {
                    e = new sc.TextGui(a.substring(2), {
                        maxWidth: this._width - 4
                    });
                    e.setPos(0, c);
                    e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
                } else {
                    e = new sc.TextGui(a, {
                        maxWidth: this._width - 4
                    });
                    e.setPos(0, c)
                }
                d.addChildGui(e);
                c = c + (e.hook.size.y + this.linePadding)
            }
            return c
        },
        _createInitContent: function(a) {
            var b = 2;
            this.header =
                new sc.TextGui(this.defaultHeaderText);
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.header.setPos(0, b);
            this.content.addChildGui(this.header);
            var b = b + (this.header.hook.size.y + 2),
                c = new sc.LineGui(300);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, b);
            this.content.addChildGui(c);
            b = b + 1;
            this.scrollContainer = new sc.HelpScrollContainer;
            this.scrollContainer.setPos(0, b);
            this.scrollContainer.setSize(301, 208);
            b = b + this.scrollContainer.hook.size.y;
            c = new sc.LineGui(300);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, b);
            this.content.addChildGui(c);
            this.content.addChildGui(this.scrollContainer);
            b = b + 4;
            this.pageCounter = new sc.MultiPagePageCounter(a);
            this.pageCounter.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.pageCounter.setPos(0, b);
            this.pageCounter.doStateTransition("HIDDEN", true);
            this.content.addChildGui(this.pageCounter)
        },
        onTurnLeftCheck: function() {
            return sc.control.menuCircleLeft() || sc.control.leftPressed()
        },
        onTurnRightCheck: function() {
            return sc.control.menuCircleRight() ||
                sc.control.rightPressed()
        },
        update: function() {
            if (!ig.interact.isBlocked()) {
                sc.control.menuScrollUp() ? this.scrollContainer.scroll(-20) : sc.control.menuScrollDown() && this.scrollContainer.scroll(20);
                sc.control.downDown() ? this.scrollContainer.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scrollContainer.scroll(-200 * ig.system.tick);
                sc.control.menuBack() && this.closeMenu()
            }
        },
        updateDrawables: function(a) {
            a.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        }
    })
});
ig.baked = !0;
