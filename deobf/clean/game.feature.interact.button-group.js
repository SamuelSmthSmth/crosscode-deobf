/**
 * @module game.feature.interact.button-group
 *
 * Button group variants for menus: mouse-only traversal, keyboard/gamepad
 * traversal with press-repeating, and a row-based grid group with left/right
 * stepping within rows.
 */
ig.module("game.feature.interact.button-group").requires("impact.feature.interact.button-interact").defines(function() {
    sc.MouseButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        _counter: 0,
        init: function() {
            this.parent()
        },
        addFocusGui: function(gui) {
            this.parent(gui, 0, this._counter);
            gui.focusCount = this._counter;
            this._counter++
        },
        clear: function() {
            this._counter = 0;
            this.parent()
        },
        onButtonTraversal: null,
        doButtonTraversal: function(isButtonRelease) {
            sc.control.menuBack() && this.invokeBackButton();
            this.onButtonTraversal && this.onButtonTraversal(isButtonRelease)
        },
        isNonMouseMenuInput: function() {
            return false
        }
    });
    sc.ButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        repeater: null,
        init: function(noSound, x, y) {
            this.parent(x, y);
            if (noSound) this.sounds.focus = null;
            this.repeater = new ig.PressRepeater
        },
        setRegainFocus: function() {
            this.setCurrentFocus(this.current.x, this.current.y)
        },
        regainCurrentFocus: function(isRelease, isMouse, isKeyboard) {
            this.focusCurrentButton(this.current.x, this.current.y, isRelease, isMouse, isKeyboard)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() ||
                sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown()
        },
        onButtonTraversal: null,
        doButtonTraversal: function(isButtonRelease) {
            sc.control.menuBack() && this.invokeBackButton();
            var direction = this.getRepeaterValue();
            if (!isButtonRelease) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                switch (direction) {
                    case "right":
                        this.stepRight();
                        break;
                    case "left":
                        this.stepLeft();
                        break;
                    case "up":
                        this.stepUp();
                        break;
                    case "down":
                        this.stepDown()
                }
            }
            if (this.onButtonTraversal) this.onButtonTraversal(isButtonRelease)
        },
        getRepeaterValue: function() {
            sc.control.rightDown() ?
                this.repeater.setDown("right") : sc.control.leftDown() ? this.repeater.setDown("left") : sc.control.downDown() ? this.repeater.setDown("down") : sc.control.upDown() && this.repeater.setDown("up");
            return this.repeater.getPressed()
        },
        activate: function() {
            this.parent();
            this.getRepeaterValue()
        }
    });
    sc.RowButtonGroup = sc.ButtonGroup.extend({
        rowIndex: [],
        currentRow: -1,
        usePrevRowIndex: false,
        _lastRowIndex: 0,
        leftRightCallback: null,
        init: function() {
            this.parent()
        },
        addFocusGui: function(gui, column, row) {
            if (!this.elements[row]) {
                this.elements[row] = [];
                this.rowIndex[row] = 0
            }
            if (this.currentRow == -1) {
                this.currentRow = row;
                this.current.x = row
            }
            this.elements[row][column] = gui;
            gui.buttonGroup = this;
            gui.buttonInteract = null
        },
        addEmptyRow: function(row) {
            if (!this.elements[row]) {
                this.elements[row] = [];
                this.rowIndex[row] = 0
            }
        },
        setLeftRightCallback: function(callback) {
            if (callback) this.leftRightCallback = callback
        },
        getCurrentCellIndex: function() {
            return this.rowIndex[this.currentRow]
        },
        regainCurrentFocus: function(isRelease, isMouse, isKeyboard) {
            this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], isRelease, isMouse, isKeyboard)
        },
        setCurrentRowIndexes: function(row,
            index, focus, isRelease, isMouse, isKeyboard) {
            if (this.elements[row].length == 0) {
                for (var nextRow = row; this.elements[nextRow].length == 0;) nextRow = (nextRow + 1) % this.elements.length;
                this.currentRow = nextRow = nextRow % this.elements.length
            } else this.currentRow = row;
            this.rowIndex[row] = index;
            focus && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], isRelease, isMouse, isKeyboard)
        },
        isPositionValid: function(row, column) {
            return this.elements[row] && this.elements[row][column] != void 0
        },
        clear: function() {
            this.parent();
            this.rowIndex.length = 0;
            this.currentRow = -1
        },
        stepRight: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var column =
                    this.rowIndex[this.currentRow] + 1;
                if (column >= this.elements[this.currentRow].length) column = this.elements[this.currentRow].length - 1;
                else
                    for (var i = column; i < this.elements[this.currentRow].length; i++)
                        if (this.elements[this.currentRow][i] !== void 0) {
                            column = i;
                            break
                        } this._lastRowIndex = column = column % this.elements[this.currentRow].length;
                this.rowIndex[this.currentRow] = column;
                this.leftRightCallback && this.leftRightCallback(true, this.currentRow) && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepLeft: function() {
            if (!(this.isEmpty() ||
                    this.currentRow == -1)) {
                var column = this.rowIndex[this.currentRow] - 1;
                if (column < 0) column = 0;
                else
                    for (var i = column; i >= 0; i--)
                        if (this.elements[this.currentRow][i] !== void 0) {
                            column = i;
                            break
                        } this._lastRowIndex = column = column % this.elements[this.currentRow].length;
                this.rowIndex[this.currentRow] = column;
                this.leftRightCallback && this.leftRightCallback(false, this.currentRow) && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepDown: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var row = this.current.x + 1;
                for (row >=
                    this.elements.length && (row = 0); !this.elements[row] || this.elements[row].length == 0;) {
                    row++;
                    row >= this.elements.length && (row = 0)
                }
                this.currentRow = row = row % this.elements.length;
                this.focusCurrentButton(this.currentRow, this.usePrevRowIndex ? this._lastRowIndex : this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepUp: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var row = this.current.x - 1;
                for (row < 0 && (row = this.elements.length - 1); !this.elements[row] || this.elements[row].length == 0;) {
                    row--;
                    row < 0 && (row = this.elements.length - 1)
                }
                this.currentRow =
                    row = row % this.elements.length;
                this.focusCurrentButton(this.currentRow, this.usePrevRowIndex ? this._lastRowIndex : this.rowIndex[this.currentRow], false, false, true)
            }
        },
        getCurrentElement: function() {
            return this.elements[this.currentRow] && this.elements[this.currentRow][this.rowIndex[this.currentRow]]
        },
        getCurrentX: function() {
            return this.rowIndex[this.currentRow]
        },
        getCurrentY: function() {
            return this.currentRow
        }
    })
});
ig.baked = !0;
