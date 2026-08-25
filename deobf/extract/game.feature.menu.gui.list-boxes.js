ig.module("game.feature.menu.gui.list-boxes").requires("impact.feature.gui.gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.LIST_COLUMNS = {
        ONE: 1,
        TWO: 2
    };
    sc.ButtonListBox = sc.ScrollPane.extend({
        buttonGroup: null,
        contentPane: null,
        paddingTop: 0,
        paddingBetween: 0,
        columnPadding: 0,
        buttonWidth: 0,
        useShoulderScroll: false,
        forceLastScroll: false,
        buttonInteract: null,
        pageSize: 0,
        offsets: {
            x: 0,
            y: 0
        },
        columns: sc.LIST_COLUMNS.ONE,
        _prevIndex: 0,
        _skipFirst: false,
        _prevScrollBarHeight: 0,
        init: function(b, a, d, c, e, f, g) {
            this.parent(sc.ScrollType.Y_ONLY);
            this.buttonInteract = g || sc.menu.buttonInteract;
            this.contentPane = new ig.GuiElementBase;
            this.setContent(this.contentPane);
            this.paddingTop = b || 0;
            this.paddingBetween = a || 0;
            this.pageSize = d || 0;
            this.columns = c || sc.LIST_COLUMNS.ONE;
            this.columnPadding = this.columns > 1 ? e || 0 : 0;
            this.buttonWidth = this.columns > 1 ? f || 0 : 0;
            this.buttonGroup = new sc.ButtonGroup(false, this.columns > 1 ? ig.BUTTON_GROUP_SELECT_TYPE.ALL : ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.addSelectionCallback(this.onSelectionChange.bind(this))
        },
        setButtonGroup: function(b) {
            if (b) {
                if (this.buttonGroup.isActive()) {
                    sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
                    this.buttonGroup.clear();
                    this.buttonGroup.clearSelectionCallbacks()
                }
                this.buttonGroup = b;
                this.buttonGroup.addSelectionCallback(this.onSelectionChange.bind(this))
            }
        },
        activate: function(b) {
            b ? b.pushButtonGroup(this.buttonGroup) : sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },
        deactivate: function(b) {
            b ? b.removeButtonGroup(this.buttonGroup) : sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },
        addSelectionCallback: function(b) {
            b && this.buttonGroup.addSelectionCallback(b)
        },
        updateContentHeight: function() {
            this._setContentHeight(this._getContentHeight())
        },
        addButton: function(b, a, d, c) {
            var e = this.contentPane.hook.children.length,
                f = this._getContentHeight(e % this.columns != 0),
                g = e % this.columns,
                h = Math.floor(e / this.columns);
            b.setPos(e % this.columns * this.buttonWidth + this.columnPadding + (d || 0), f + this.paddingBetween + (c || 0));
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            a || this.buttonGroup.addFocusGui(b, g, h + this.offsets.y);
            this.contentPane.addChildGui(b);
            this._setContentHeight(this._getContentHeight())
        },
        addGui: function(b) {
            var a = this._getContentHeight(this.contentPane.hook.children.length %
                this.columns != 0) + this.paddingBetween;
            b.setPos(0, a)
        },
        insertButton: function(b, a, d, c, e, f) {
            this.contentPane.insertChildGui(b, a);
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            var g = a % this.columns,
                a = Math.floor(a / this.columns);
            e || this.buttonGroup.insertFocusGui(b, g, a);
            this._repositionButtons(d, c, void 0, f)
        },
        removeButton: function(b, a, d, c, e) {
            a ? this.contentPane.getChildGuiByIndex(b).doStateTransition(a, false, true) : this.contentPane.removeChildGuiByIndex(b);
            var a = b % this.columns,
                f = Math.floor(b / this.columns);
            e || this.buttonGroup.removeFocusGui(a, f);
            this._repositionButtons(d, c, b)
        },
        moveButton: function(b, a, d, c, e, f) {
            if (b != a) {
                var g = this.contentPane.hook.children,
                    h = null,
                    i = g[b],
                    j = 0;
                if (b > a)
                    for (j = a; j < b; j++) {
                        h = g[j];
                        h.doPosTranstition(i.pos.x, h.pos.y + i.size.y, d, c || KEY_SPLINES.EASE, 0, true);
                        f && f(h.gui, 1)
                    } else if (b < a)
                        for (j = b; j < a; j++) {
                            h = g[j];
                            h.doPosTranstition(i.pos.x, h.pos.y - i.size.y, d, c || KEY_SPLINES.EASE, 0, true);
                            f && f(h.gui, -1)
                        }
                i.doPosTranstition(0, g[a].pos.y, d, c || KEY_SPLINES.EASE, 0, true, function() {
                    var c = this.contentPane.removeChildGuiByIndex(b);
                    this.contentPane.insertChildGui(c, a)
                }.bind(this));
                if (!e) {
                    d = b % this.columns;
                    c = Math.floor(b / this.columns);
                    e = this.buttonGroup.removeFocusGui(d, c);
                    d = a % this.columns;
                    c = Math.floor(a / this.columns);
                    this.buttonGroup.insertFocusGui(e, d, c)
                }
            }
        },
        getIndex: function(b) {
            if (!b) return -1;
            for (var a = this.contentPane.hook.children, d = a.length, b = b.hook; d--;)
                if (b == a[d]) return d;
            return -1
        },
        getChildren: function() {
            return this.contentPane.hook.children
        },
        onGetHeightAtIndex: null,
        getHeightAtIndex: function(b, a) {
            if (!a && this.onGetHeightAtIndex) return this.onGetHeightAtIndex(this,
                b);
            if (this.columns >= 2) {
                for (var d = this.contentPane.hook.children, c = Math.min(b + 1, d.length), e = 0; c--;) e = e + (d[c].size.y + this.paddingBetween);
                return e + this.paddingTop
            }
            d = this.contentPane.hook.children;
            c = d[b] ? d[b].pos.y + d[b].size.y : this.paddingTop;
            this.forceLastScroll && b == d.length - 1 && (c = c + 200);
            return c
        },
        getScrollYAtIndex: function(b) {
            b = this.getHeightAtIndex(b);
            return Math.max(b - (this.box.hook.size.y + this.box.hook.scroll.y * -1), 0)
        },
        setScrollAtCurrentYIndex: function() {
            var b = this.getHeightAtIndex(this.buttonGroup.current.y -
                1) - this.paddingTop;
            this.setScrollY(b, true, true)
        },
        clear: function(b) {
            this._prevIndex = 0;
            this._skipFirst = b || false;
            this.contentPane.removeAllChildren();
            this.contentPane.hook.size.y = 0;
            this.box.doScrollTransition(0, 0, 0);
            this.recalculateScrollBars()
        },
        scrollToY: function(b, a) {
            this._skipFirst = false;
            this.box.doScrollTransition(0, 0, 0);
            this.scrollY(b, a)
        },
        setScrollY: function(b, a, d) {
            this._skipFirst = false;
            d || this.box.doScrollTransition(0, 0, 0);
            this.parent(b, a)
        },
        update: function() {
            this.parent();
            this.buttonInteract.isActive() &&
                this.buttonGroup.isActive() && (sc.control.menuScrollUp() ? this.scrollY(-this.pageSize) : sc.control.menuScrollDown() && this.scrollY(this.pageSize))
        },
        onSelectionChange: function() {
            var b = this.buttonGroup.getCurrentY();
            if (ig.input.mouseGuiActive) this._prevIndex = -1;
            else {
                var a = this._prevIndex;
                if (a < b) {
                    var a = this.getHeightAtIndex(b),
                        d = this.box.hook.size.y + this.box.hook.scroll.y * -1,
                        d = Math.max(a - d, 0);
                    if (d > 0) this.scrollY(d, this._skipFirst);
                    else {
                        d = this.box.hook.scroll.y * -1;
                        if (a <= d) {
                            a = this.getHeightAtIndex(b - 1) - this.paddingTop;
                            this.scrollY(-(d - a), this._skipFirst)
                        }
                    }
                } else if (a > b) {
                    a = this.getHeightAtIndex(b - 1) - this.paddingTop;
                    d = this.box.hook.scroll.y * -1;
                    d = Math.max(d - a, 0);
                    if (d > 0) this.scrollY(-d, this._skipFirst);
                    else {
                        d = this.box.hook.size.y + this.box.hook.scroll.y * -1;
                        a = this.getHeightAtIndex(b);
                        d <= a && this.scrollY(a - d, this._skipFirst)
                    }
                }
                this._skipFirst = false;
                this._prevIndex = b
            }
        },
        _repositionButtons: function(b, a, d, c) {
            for (var e = this.contentPane.hook.children, f = 0, g = this.paddingTop, h = null, i = 0; i < e.length; i++)
                if (!(d != void 0 && d == i)) {
                    h = e[i];
                    f = i % this.columns * this.buttonWidth + this.columnPadding;
                    if (b) h.doPosTranstition(f, g, b, a || KEY_SPLINES.EASE, 0, true);
                    else {
                        if (!c) h.pos.x = f;
                        h.pos.y = g
                    }(i + 1) % this.columns == 0 && (g = g + (h.size.y + this.paddingBetween))
                } this._setContentHeight(g)
        },
        _getContentHeight: function(b) {
            var a = this.contentPane.hook.children;
            if (this.columns >= 2) {
                var d = a.length;
                b && (d = d - 1);
                for (b = 0; d--;) {
                    b = b + (a[d].size.y + this.paddingBetween);
                    d = d - (this.columns - 1);
                    if (d < 0) break
                }
                return b + this.paddingTop
            }
            if (a.length == 0) return this.paddingTop;
            a = a[a.length -
                1];
            return b = a.pos.y + a.size.y
        },
        _setContentHeight: function(b) {
            this.contentPane.hook.size.y = b;
            this.recalculateScrollBars()
        }
    });
    sc.ItemListBox = ig.GuiElementBase.extend({
        list: null,
        select: null,
        quantity: null,
        bg: null,
        init: function(b, a, d) {
            this.parent();
            this.bg = new sc.MenuScanLines;
            this.bg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bg.hook.size.x = this.hook.size.x;
            this.list = new sc.ButtonListBox(b, 0, 20, void 0, void 0, void 0, d);
            this.list.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.list.hook.size.x =
                this.hook.size.x;
            this.addChildGui(this.bg);
            if (!a) {
                this.quantity = new sc.TextGui(ig.lang.get("sc.gui.menu.quantity"), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                this.quantity.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.quantity.setPos(1, 0);
                this.addChildGui(this.quantity)
            }
            this.addChildGui(this.list)
        },
        setSize: function(b, a) {
            this.parent(b, a);
            this.bg.hook.size.x = this.hook.size.x;
            this.bg.hook.size.y = this.hook.size.y - 7;
            this.list.setSize(this.hook.size.x, this.hook.size.y - 7)
        },
        clear: function(b) {
            this.list.clear(b)
        },
        addButton: function(b) {
            this.list.addButton(b)
        },
        getChildren: function() {
            return this.list.getChildren()
        }
    });
    sc.MultiColumnItemListBox = ig.GuiElementBase.extend({
        list: null,
        selects: [],
        quantities: [],
        bg: null,
        columns: sc.LIST_COLUMNS.ONE,
        init: function(b, a, d, c) {
            this.parent();
            this.columns = d || sc.LIST_COLUMNS.ONE;
            this.bg = new sc.MenuScanLines;
            this.bg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bg.hook.size.x = this.hook.size.x;
            this.addChildGui(this.bg);
            for (var e, a =
                    a || 0, c = c || 0, f = a + c, g = 0, h = 0; h < this.columns; h++) {
                e = new sc.TextGui(ig.lang.get("sc.gui.menu.select"), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                e.setPos(7 + h * f, 0);
                e.hook.transitions = {
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
                this.selects[h] = e;
                this.addChildGui(e);
                g = this.columns * f - (h + 1) * f;
                e = new sc.TextGui(ig.lang.get("sc.gui.menu.quantity"), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                e.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                e.setPos(g + 4, 0);
                e.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.1,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0,
                            offsetX: 4
                        },
                        time: 0.1,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.quantities[h] = e;
                this.addChildGui(e)
            }
            this.list = new sc.ButtonListBox(b, 0, 20, d, c, a);
            this.list.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.list.hook.size.x = this.hook.size.x;
            this.addChildGui(this.list)
        },
        addButton: function(b, a) {
            this.list.addButton(b, a)
        },
        clear: function(b) {
            this.list.clear(b)
        },
        scrollToY: function(b, a) {
            this.list.scrollY(b, a)
        },
        setSelectState: function(b, a) {
            for (var d = this.selects.length; d--;) this.selects[d].doStateTransition(b, a)
        },
        setQuantityState: function(b, a) {
            for (var d = this.quantities.length; d--;) this.quantities[d].doStateTransition(b, a)
        },
        buttonGroup: function() {
            return this.list.buttonGroup
        },
        activate: function() {
            sc.menu.buttonInteract.pushButtonGroup(this.list.buttonGroup)
        },
        deactivate: function() {
            sc.menu.buttonInteract.removeButtonGroup(this.list.buttonGroup)
        },
        setSize: function(b,
            a) {
            this.parent(b, a);
            this.bg.hook.size.x = this.hook.size.x;
            this.bg.hook.size.y = this.hook.size.y - 7;
            this.list.setSize(this.hook.size.x, this.hook.size.y - 7)
        }
    })
});
ig.baked = !0;
