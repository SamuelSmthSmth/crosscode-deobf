/**
 * game.feature.menu.gui.list-boxes
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.list-boxes")`.
 *
 * Scrollable button lists used by nearly every menu:
 * - `sc.ButtonListBox`: a Y-scrolling pane of `sc.ButtonGui`-style focus
 *   GUIs laid out in 1 or 2 columns, with a `sc.ButtonGroup` for keyboard/
 *   gamepad navigation, scroll-on-selection, insert/remove/move of buttons,
 *   and scrollbar recalculations.
 * - `sc.ItemListBox`: list box plus a scan-lines background and an optional
 *   "Quantity" header label.
 * - `sc.MultiColumnItemListBox`: multi-column variant with per-column
 *   "Select"/"Quantity" header labels.
 */
ig.module("game.feature.menu.gui.list-boxes")
    .requires("impact.feature.gui.gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

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

        init: function (paddingTop, paddingBetween, pageSize, columns, columnPadding, buttonWidth, buttonInteract) {
            this.parent(sc.ScrollType.Y_ONLY);
            this.buttonInteract = buttonInteract || sc.menu.buttonInteract;
            this.contentPane = new ig.GuiElementBase;
            this.setContent(this.contentPane);
            this.paddingTop = paddingTop || 0;
            this.paddingBetween = paddingBetween || 0;
            this.pageSize = pageSize || 0;
            this.columns = columns || sc.LIST_COLUMNS.ONE;
            this.columnPadding = this.columns > 1 ? columnPadding || 0 : 0;
            this.buttonWidth = this.columns > 1 ? buttonWidth || 0 : 0;
            this.buttonGroup = new sc.ButtonGroup(false, this.columns > 1 ? ig.BUTTON_GROUP_SELECT_TYPE.ALL : ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.addSelectionCallback(this.onSelectionChange.bind(this))
        },

        setButtonGroup: function (buttonGroup) {
            if (buttonGroup) {
                if (this.buttonGroup.isActive()) {
                    sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
                    this.buttonGroup.clear();
                    this.buttonGroup.clearSelectionCallbacks()
                }
                this.buttonGroup = buttonGroup;
                this.buttonGroup.addSelectionCallback(this.onSelectionChange.bind(this))
            }
        },

        activate: function (buttonInteract) {
            buttonInteract ? buttonInteract.pushButtonGroup(this.buttonGroup) : sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },

        deactivate: function (buttonInteract) {
            buttonInteract ? buttonInteract.removeButtonGroup(this.buttonGroup) : sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },

        addSelectionCallback: function (callback) {
            if (callback) this.buttonGroup.addSelectionCallback(callback)
        },

        updateContentHeight: function () {
            this._setContentHeight(this._getContentHeight())
        },

        addButton: function (button, noFocus, offsetX, offsetY) {
            var index = this.contentPane.hook.children.length,
                posY = this._getContentHeight(index % this.columns != 0),
                column = index % this.columns,
                row = Math.floor(index / this.columns);
            button.setPos(index % this.columns * this.buttonWidth + this.columnPadding + (offsetX || 0), posY + this.paddingBetween + (offsetY || 0));
            button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            if (!noFocus) this.buttonGroup.addFocusGui(button, column, row + this.offsets.y);
            this.contentPane.addChildGui(button);
            this._setContentHeight(this._getContentHeight())
        },

        addGui: function (gui) {
            var posY = this._getContentHeight(this.contentPane.hook.children.length % this.columns != 0) + this.paddingBetween;
            gui.setPos(0, posY)
        },

        insertButton: function (button, index, transition, transitionTime, noFocus, skipReposition) {
            this.contentPane.insertChildGui(button, index);
            button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            var column = index % this.columns,
                row = Math.floor(index / this.columns);
            if (!noFocus) this.buttonGroup.insertFocusGui(button, column, row);
            this._repositionButtons(transition, transitionTime, void 0, skipReposition)
        },

        removeButton: function (index, transition, transitionTime, noFocus) {
            if (transition) this.contentPane.getChildGuiByIndex(index).doStateTransition(transition, false, true);
            else this.contentPane.removeChildGuiByIndex(index);
            var column = index % this.columns,
                row = Math.floor(index / this.columns);
            if (!noFocus) this.buttonGroup.removeFocusGui(column, row);
            this._repositionButtons(transition, transitionTime, index)
        },

        moveButton: function (fromIndex, toIndex, transition, transitionTime, noFocus, onMove) {
            if (fromIndex != toIndex) {
                var children = this.contentPane.hook.children,
                    other = null,
                    moving = children[fromIndex],
                    i = 0;
                if (fromIndex > toIndex)
                    for (i = toIndex; i < fromIndex; i++) {
                        other = children[i];
                        other.doPosTranstition(moving.pos.x, other.pos.y + moving.size.y, transition, transitionTime || KEY_SPLINES.EASE, 0, true);
                        if (onMove) onMove(other.gui, 1)
                    }
                else if (fromIndex < toIndex)
                    for (i = fromIndex; i < toIndex; i++) {
                        other = children[i];
                        other.doPosTranstition(moving.pos.x, other.pos.y - moving.size.y, transition, transitionTime || KEY_SPLINES.EASE, 0, true);
                        if (onMove) onMove(other.gui, -1)
                    }
                moving.doPosTranstition(0, children[toIndex].pos.y, transition, transitionTime || KEY_SPLINES.EASE, 0, true, function () {
                    var moved = this.contentPane.removeChildGuiByIndex(fromIndex);
                    this.contentPane.insertChildGui(moved, toIndex)
                }.bind(this));
                if (!noFocus) {
                    var fromColumn = fromIndex % this.columns,
                        fromRow = Math.floor(fromIndex / this.columns),
                        focusGui = this.buttonGroup.removeFocusGui(fromColumn, fromRow),
                        toColumn = toIndex % this.columns,
                        toRow = Math.floor(toIndex / this.columns);
                    this.buttonGroup.insertFocusGui(focusGui, toColumn, toRow)
                }
            }
        },

        getIndex: function (gui) {
            if (!gui) return -1;
            for (var children = this.contentPane.hook.children, i = children.length, hook = gui.hook; i--;)
                if (hook == children[i]) return i;
            return -1
        },

        getChildren: function () {
            return this.contentPane.hook.children
        },

        onGetHeightAtIndex: null,

        getHeightAtIndex: function (index, noCallback) {
            if (!noCallback && this.onGetHeightAtIndex) return this.onGetHeightAtIndex(this, index);
            if (this.columns >= 2) {
                for (var children = this.contentPane.hook.children, count = Math.min(index + 1, children.length), height = 0; count--;) height = height + (children[count].size.y + this.paddingBetween);
                return height + this.paddingTop
            }
            children = this.contentPane.hook.children;
            var height = children[index] ? children[index].pos.y + children[index].size.y : this.paddingTop;
            if (this.forceLastScroll && index == children.length - 1) height = height + 200;
            return height
        },

        getScrollYAtIndex: function (index) {
            index = this.getHeightAtIndex(index);
            return Math.max(index - (this.box.hook.size.y + this.box.hook.scroll.y * -1), 0)
        },

        setScrollAtCurrentYIndex: function () {
            var scrollY = this.getHeightAtIndex(this.buttonGroup.current.y - 1) - this.paddingTop;
            this.setScrollY(scrollY, true, true)
        },

        clear: function (skipFirst) {
            this._prevIndex = 0;
            this._skipFirst = skipFirst || false;
            this.contentPane.removeAllChildren();
            this.contentPane.hook.size.y = 0;
            this.box.doScrollTransition(0, 0, 0);
            this.recalculateScrollBars()
        },

        scrollToY: function (scrollY, time) {
            this._skipFirst = false;
            this.box.doScrollTransition(0, 0, 0);
            this.scrollY(scrollY, time)
        },

        setScrollY: function (scrollY, time, skipScrollTransition) {
            this._skipFirst = false;
            if (!skipScrollTransition) this.box.doScrollTransition(0, 0, 0);
            this.parent(scrollY, time)
        },

        update: function () {
            this.parent();
            if (this.buttonInteract.isActive() && this.buttonGroup.isActive())
                if (sc.control.menuScrollUp()) this.scrollY(-this.pageSize);
                else if (sc.control.menuScrollDown()) this.scrollY(this.pageSize)
        },

        onSelectionChange: function () {
            var currentY = this.buttonGroup.getCurrentY();
            if (ig.input.mouseGuiActive) this._prevIndex = -1;
            else {
                var prevIndex = this._prevIndex;
                if (prevIndex < currentY) {
                    var height = this.getHeightAtIndex(currentY),
                        viewBottom = this.box.hook.size.y + this.box.hook.scroll.y * -1,
                        delta = Math.max(height - viewBottom, 0);
                    if (delta > 0) this.scrollY(delta, this._skipFirst);
                    else {
                        var scrollTop = this.box.hook.scroll.y * -1;
                        if (height <= scrollTop) {
                            height = this.getHeightAtIndex(currentY - 1) - this.paddingTop;
                            this.scrollY(-(scrollTop - height), this._skipFirst)
                        }
                    }
                } else if (prevIndex > currentY) {
                    height = this.getHeightAtIndex(currentY - 1) - this.paddingTop;
                    var scrollTop = this.box.hook.scroll.y * -1,
                        delta = Math.max(scrollTop - height, 0);
                    if (delta > 0) this.scrollY(-delta, this._skipFirst);
                    else {
                        scrollTop = this.box.hook.size.y + this.box.hook.scroll.y * -1;
                        height = this.getHeightAtIndex(currentY);
                        if (scrollTop <= height) this.scrollY(height - scrollTop, this._skipFirst)
                    }
                }
                this._skipFirst = false;
                this._prevIndex = currentY
            }
        },

        _repositionButtons: function (transition, transitionTime, skipIndex, noPosX) {
            for (var children = this.contentPane.hook.children, posX = 0, posY = this.paddingTop, child = null, i = 0; i < children.length; i++)
                if (!(skipIndex != void 0 && skipIndex == i)) {
                    child = children[i];
                    posX = i % this.columns * this.buttonWidth + this.columnPadding;
                    if (transition) child.doPosTranstition(posX, posY, transition, transitionTime || KEY_SPLINES.EASE, 0, true);
                    else {
                        if (!noPosX) child.pos.x = posX;
                        child.pos.y = posY
                    }
                    if ((i + 1) % this.columns == 0) posY = posY + (child.size.y + this.paddingBetween)
                }
            this._setContentHeight(posY)
        },

        _getContentHeight: function (noLastRow) {
            var children = this.contentPane.hook.children;
            if (this.columns >= 2) {
                var count = children.length;
                if (noLastRow) count = count - 1;
                var height = 0;
                for (; count--;) {
                    height = height + (children[count].size.y + this.paddingBetween);
                    count = count - (this.columns - 1);
                    if (count < 0) break
                }
                return height + this.paddingTop
            }
            if (children.length == 0) return this.paddingTop;
            var last = children[children.length - 1];
            return noLastRow = last.pos.y + last.size.y
        },

        _setContentHeight: function (height) {
            this.contentPane.hook.size.y = height;
            this.recalculateScrollBars()
        }
    });

    sc.ItemListBox = ig.GuiElementBase.extend({
        list: null,
        select: null,
        quantity: null,
        bg: null,

        init: function (paddingTop, noQuantity, buttonInteract) {
            this.parent();
            this.bg = new sc.MenuScanLines;
            this.bg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bg.hook.size.x = this.hook.size.x;
            this.list = new sc.ButtonListBox(paddingTop, 0, 20, void 0, void 0, void 0, buttonInteract);
            this.list.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.list.hook.size.x = this.hook.size.x;
            this.addChildGui(this.bg);
            if (!noQuantity) {
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

        setSize: function (width, height) {
            this.parent(width, height);
            this.bg.hook.size.x = this.hook.size.x;
            this.bg.hook.size.y = this.hook.size.y - 7;
            this.list.setSize(this.hook.size.x, this.hook.size.y - 7)
        },

        clear: function (skipFirst) {
            this.list.clear(skipFirst)
        },

        addButton: function (button) {
            this.list.addButton(button)
        },

        getChildren: function () {
            return this.list.getChildren()
        }
    });

    sc.MultiColumnItemListBox = ig.GuiElementBase.extend({
        list: null,
        selects: [],
        quantities: [],
        bg: null,
        columns: sc.LIST_COLUMNS.ONE,

        init: function (paddingTop, columnPadding, columns, buttonWidth) {
            this.parent();
            this.columns = columns || sc.LIST_COLUMNS.ONE;
            this.bg = new sc.MenuScanLines;
            this.bg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bg.hook.size.x = this.hook.size.x;
            this.addChildGui(this.bg);
            for (var label, columnPadding = columnPadding || 0, buttonWidth = buttonWidth || 0, columnWidth = columnPadding + buttonWidth, offsetX = 0, i = 0; i < this.columns; i++) {
                label = new sc.TextGui(ig.lang.get("sc.gui.menu.select"), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                label.setPos(7 + i * columnWidth, 0);
                label.hook.transitions = {
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
                this.selects[i] = label;
                this.addChildGui(label);
                offsetX = this.columns * columnWidth - (i + 1) * columnWidth;
                label = new sc.TextGui(ig.lang.get("sc.gui.menu.quantity"), {
                    speed: ig.TextBlock.SPEED.IMMEDIATE,
                    font: sc.fontsystem.tinyFont
                });
                label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                label.setPos(offsetX + 4, 0);
                label.hook.transitions = {
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
                this.quantities[i] = label;
                this.addChildGui(label)
            }
            this.list = new sc.ButtonListBox(paddingTop, 0, 20, columns, buttonWidth, columnPadding);
            this.list.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.list.hook.size.x = this.hook.size.x;
            this.addChildGui(this.list)
        },

        addButton: function (button, noFocus) {
            this.list.addButton(button, noFocus)
        },

        clear: function (skipFirst) {
            this.list.clear(skipFirst)
        },

        scrollToY: function (scrollY, time) {
            this.list.scrollY(scrollY, time)
        },

        setSelectState: function (transition, skipSounds) {
            for (var i = this.selects.length; i--;) this.selects[i].doStateTransition(transition, skipSounds)
        },

        setQuantityState: function (transition, skipSounds) {
            for (var i = this.quantities.length; i--;) this.quantities[i].doStateTransition(transition, skipSounds)
        },

        buttonGroup: function () {
            return this.list.buttonGroup
        },

        activate: function () {
            sc.menu.buttonInteract.pushButtonGroup(this.list.buttonGroup)
        },

        deactivate: function () {
            sc.menu.buttonInteract.removeButtonGroup(this.list.buttonGroup)
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.bg.hook.size.x = this.hook.size.x;
            this.bg.hook.size.y = this.hook.size.y - 7;
            this.list.setSize(this.hook.size.x, this.hook.size.y - 7)
        }
    })
});
ig.baked = !0;
