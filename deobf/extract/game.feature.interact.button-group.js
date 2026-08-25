ig.module("game.feature.interact.button-group").requires("impact.feature.interact.button-interact").defines(function() {
    sc.MouseButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        _counter: 0,
        init: function() {
            this.parent()
        },
        addFocusGui: function(b) {
            this.parent(b, 0, this._counter);
            b.focusCount = this._counter;
            this._counter++
        },
        clear: function() {
            this._counter = 0;
            this.parent()
        },
        onButtonTraversal: null,
        doButtonTraversal: function(b) {
            sc.control.menuBack() && this.invokeBackButton();
            this.onButtonTraversal && this.onButtonTraversal(b)
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
        init: function(b, a, d) {
            this.parent(a, d);
            if (b) this.sounds.focus = null;
            this.repeater = new ig.PressRepeater
        },
        setRegainFocus: function() {
            this.setCurrentFocus(this.current.x, this.current.y)
        },
        regainCurrentFocus: function(b, a, d) {
            this.focusCurrentButton(this.current.x, this.current.y, b, a, d)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() ||
                sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown()
        },
        onButtonTraversal: null,
        doButtonTraversal: function(b) {
            sc.control.menuBack() && this.invokeBackButton();
            var a = this.getRepeaterValue();
            if (!b) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                switch (a) {
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
            if (this.onButtonTraversal) this.onButtonTraversal(b)
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
        addFocusGui: function(b, a, d) {
            if (!this.elements[d]) {
                this.elements[d] = [];
                this.rowIndex[d] = 0
            }
            if (this.currentRow == -1) {
                this.currentRow = d;
                this.current.x = d
            }
            this.elements[d][a] = b;
            b.buttonGroup = this;
            b.buttonInteract = null
        },
        addEmptyRow: function(b) {
            if (!this.elements[b]) {
                this.elements[b] = [];
                this.rowIndex[b] = 0
            }
        },
        setLeftRightCallback: function(b) {
            if (b) this.leftRightCallback = b
        },
        getCurrentCellIndex: function() {
            return this.rowIndex[this.currentRow]
        },
        regainCurrentFocus: function(b, a, d) {
            this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], b, a, d)
        },
        setCurrentRowIndexes: function(b,
            a, d, c, e, f) {
            if (this.elements[b].length == 0) {
                for (var g = b; this.elements[g].length == 0;) g = (g + 1) % this.elements.length;
                this.currentRow = g = g % this.elements.length
            } else this.currentRow = b;
            this.rowIndex[b] = a;
            d && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], c, e, f)
        },
        isPositionValid: function(b, a) {
            return this.elements[b] && this.elements[b][a] != void 0
        },
        clear: function() {
            this.parent();
            this.rowIndex.length = 0;
            this.currentRow = -1
        },
        stepRight: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var b =
                    this.rowIndex[this.currentRow] + 1;
                if (b >= this.elements[this.currentRow].length) b = this.elements[this.currentRow].length - 1;
                else
                    for (var a = b; a < this.elements[this.currentRow].length; a++)
                        if (this.elements[this.currentRow][a] !== void 0) {
                            b = a;
                            break
                        } this._lastRowIndex = b = b % this.elements[this.currentRow].length;
                this.rowIndex[this.currentRow] = b;
                this.leftRightCallback && this.leftRightCallback(true, this.currentRow) && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepLeft: function() {
            if (!(this.isEmpty() ||
                    this.currentRow == -1)) {
                var b = this.rowIndex[this.currentRow] - 1;
                if (b < 0) b = 0;
                else
                    for (var a = b; a >= 0; a--)
                        if (this.elements[this.currentRow][a] !== void 0) {
                            b = a;
                            break
                        } this._lastRowIndex = b = b % this.elements[this.currentRow].length;
                this.rowIndex[this.currentRow] = b;
                this.leftRightCallback && this.leftRightCallback(false, this.currentRow) && this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepDown: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var b = this.current.x + 1;
                for (b >=
                    this.elements.length && (b = 0); !this.elements[b] || this.elements[b].length == 0;) {
                    b++;
                    b >= this.elements.length && (b = 0)
                }
                this.currentRow = b = b % this.elements.length;
                this.focusCurrentButton(this.currentRow, this.usePrevRowIndex ? this._lastRowIndex : this.rowIndex[this.currentRow], false, false, true)
            }
        },
        stepUp: function() {
            if (!(this.isEmpty() || this.currentRow == -1)) {
                var b = this.current.x - 1;
                for (b < 0 && (b = this.elements.length - 1); !this.elements[b] || this.elements[b].length == 0;) {
                    b--;
                    b < 0 && (b = this.elements.length - 1)
                }
                this.currentRow =
                    b = b % this.elements.length;
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
