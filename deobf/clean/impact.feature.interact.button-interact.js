/**
 * impact.feature.interact.button-interact
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.interact.button-interact")`.
 *
 * Button-group navigation and mouse interaction:
 *   - `ig.BUTTON_GROUP_SELECT_TYPE` — grid movement constraints (ALL / VERTICAL
 *     / HORIZONTAL).
 *   - `ig.ButtonGroup` — a grid of `ig.FocusGui` elements with keyboard
 *     traversal (looping or clamped), press invocation, selection/press
 *     callbacks and a back button.
 *   - `ig.ButtonInteractEntry` — the interact entry that owns the button-group
 *     stack, global (hotkey) buttons, parallel groups and the mouse-over
 *     focus handling.
 */
ig.module("impact.feature.interact.button-interact")
    .requires("impact.feature.interact.interact")
    .defines(function () {

    ig.BUTTON_GROUP_SELECT_TYPE = {
        ALL: 0,
        VERTICAL: 1,
        HORIZONTAL: 2
    };

    /** A navigable grid of focus GUI elements. */
    ig.ButtonGroup = ig.Class.extend({
        buttonInteract: null,
        elements: [],
        selectionCallbacks: [],
        pressCallbacks: [],
        mouseFocusLostCallback: null,
        backButton: null,
        current: { x: 0, y: 0 },
        regain: { x: 0, y: 0 },
        largestIndex: { x: 0, y: 0 },
        loopButtons: true,
        soundsOnPressed: false,
        enableMultiPressed: false,
        ignoreActiveFocus: false,
        selectionType: ig.BUTTON_GROUP_SELECT_TYPE.ALL,
        _lastInvokedPress: null,
        _isParallel: false,
        sounds: { focus: null },

        init: function (selectionType, loopButtons, soundsOnPressed) {
            this.selectionType = selectionType || ig.BUTTON_GROUP_SELECT_TYPE.ALL;
            this.loopButtons = loopButtons != void 0 ? loopButtons : true;
            this.soundsOnPressed = soundsOnPressed || false;
        },

        /** Register a focus GUI at (x, y); optionally as the back button. */
        addFocusGui: function (element, x, y, isBackButton) {
            isBackButton && this._setBackButton(element);
            this.elements[x] || (this.elements[x] = []);
            this.elements[x][y] = element;
            element.buttonGroup = this;
            element.buttonInteract = null;
            this.largestIndex.x = Math.max(this.largestIndex.x, x);
            this.largestIndex.y = Math.max(this.largestIndex.y, y);
        },

        /** Fill every cell up to the largest index with `null`. */
        fillEmptySpace: function () {
            for (var x = 0; x < this.elements.length; x++) {
                for (var y = 0; y < this.largestIndex.y; y++) {
                    this.elements[x] || (this.elements[x] = []);
                    this.elements[x][y] || (this.elements[x][y] = null);
                }
            }
        },

        /** Insert a focus GUI at (x, y), shifting the rest of the row. */
        insertFocusGui: function (element, x, y) {
            this.elements[x] || (this.elements[x] = []);
            this.unfocusCurrentButton();
            this.elements[x].splice(y, 0, element);
            element.buttonGroup = this;
            element.buttonInteract = null;
        },

        /** Remove and clean up the element at (x, y). */
        removeFocusGui: function (x, y) {
            this.elements[x] || (this.elements[x] = []);
            var element = this.elements[x].splice(y, 1)[0];
            if (!element) return null;
            element.keepPressed && element.setPressed(false);
            element.focusLost();
            element.buttonGroup = null;
            element.buttonInteract = null;
            return element;
        },

        addNull: function (x, y) {
            this.elements[x] || (this.elements[x] = []);
            this.elements[x][y] = null;
        },

        /** Reset a `width` × `height` grid to empty. */
        makeEmptyGrid: function (width, height) {
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    this.elements[x] || (this.elements[x] = []);
                    this.elements[x][y] = null;
                }
            }
        },

        /** Press the currently focused element (respecting keepPressed). */
        invokeCurrentButton: function () {
            if (this.elements[this.current.x]) {
                var element = this.elements[this.current.x][this.current.y];
                if (element) {
                    if (element.active) {
                        if (element.keepPressed) {
                            if (!element.pressed) {
                                element.invokeButtonPress();
                                element.setPressed(true);
                            }
                        } else {
                            element.invokeButtonPress();
                        }
                        this._invokePressCallbacks(element);
                        this._lastInvokedPress &&
                            (!this._lastInvokedPress.isSameAs(element) && this._lastInvokedPress.keepPressed) &&
                            this._lastInvokedPress.setPressed(false);
                        if (!this.enableMultiPressed) this._lastInvokedPress = element;
                    } else {
                        element.blockedSound && element.blockedSound.play();
                    }
                }
            }
        },

        invokeBackButton: function () {
            this.backButton && this.backButton.invokeButtonPress();
        },

        setMouseFocusLostCallback: function (callback) {
            if (callback) this.mouseFocusLostCallback = callback;
        },

        addPressCallback: function (callback) {
            callback && this.pressCallbacks.push(callback);
        },

        removePressCallback: function (callback) {
            callback && this.pressCallbacks.remove(callback);
        },

        addSelectionCallback: function (callback) {
            callback && this.selectionCallbacks.push(callback);
        },

        removeSelectionCallback: function (callback) {
            callback && this.selectionCallbacks.remove(callback);
        },

        clearSelectionCallbacks: function () {
            this.selectionCallbacks.length = 0;
        },

        /** Move the selection to the next column with a focusable element. */
        stepRight: function () {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL && !this.isEmpty()) {
                var newX = this.current.x;
                if (this.loopButtons) {
                    for (; !this.elements[++newX % this.elements.length];);
                } else {
                    newX++;
                    if (newX >= this.elements.length) {
                        newX = this.elements.length - 1;
                    } else {
                        for (var i = newX; i < this.elements.length; i++) {
                            if (this.elements[i]) {
                                newX = i;
                                break;
                            }
                        }
                    }
                }
                newX = newX % this.elements.length;
                if (this.elements[newX][this.current.y]) {
                    this.focusCurrentButtonX(newX);
                } else {
                    var forwardY = this.current.y,
                        backwardY = this.current.y,
                        forwardSteps = 0,
                        backwardSteps = 0;
                    for (; !this.elements[newX][++forwardY % this.elements[newX].length];) forwardSteps++;
                    backwardY--;
                    for (backwardY < 0 && (backwardY = this.elements[newX].length - 1); !this.elements[newX][backwardY];) {
                        backwardY--;
                        backwardSteps++;
                        backwardY < 0 && (backwardY = this.elements[newX].length - 1);
                    }
                    forwardSteps < backwardSteps ?
                        this.focusCurrentButton(newX, forwardY) :
                        this.focusCurrentButton(newX, backwardY);
                }
            }
        },

        stepLeft: function () {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL && !this.isEmpty()) {
                var newX = this.current.x - 1;
                if (this.loopButtons) {
                    for (newX < 0 && (newX = this.elements.length - 1); !this.elements[newX];) {
                        newX--;
                        newX < 0 && (newX = this.elements.length - 1);
                    }
                } else if (newX < 0) {
                    newX = 0;
                } else {
                    for (var i = newX; i >= 0; i--) {
                        if (this.elements[i]) {
                            newX = i;
                            break;
                        }
                    }
                }
                if (this.elements[newX][this.current.y]) {
                    this.focusCurrentButtonX(newX);
                } else {
                    var forwardY = this.current.y,
                        backwardY = this.current.y,
                        forwardSteps = 0,
                        backwardSteps = 0;
                    for (; !this.elements[newX][++forwardY % this.elements[newX].length];) forwardSteps++;
                    backwardY--;
                    for (backwardY < 0 && (backwardY = this.elements[newX].length - 1); !this.elements[newX][backwardY];) {
                        backwardY--;
                        backwardSteps++;
                        backwardY < 0 && (backwardY = this.elements[newX].length - 1);
                    }
                    forwardSteps < backwardSteps ?
                        this.focusCurrentButton(newX, forwardY) :
                        this.focusCurrentButton(newX, backwardY);
                }
            }
        },

        /** Move the selection down `delta` rows (or to the next focusable row). */
        stepDown: function (delta) {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL && !this.isEmpty()) {
                var newY = this.current.y;
                if (this.elements[this.current.x]) {
                    if (delta) {
                        newY = delta + newY >= this.elements[this.current.x].length ?
                            this.elements[this.current.x].length - 1 : newY + delta;
                    } else if (this.loopButtons) {
                        for (; this.elements[this.current.x][++newY % this.elements[this.current.x].length] === void 0;);
                    } else {
                        newY++;
                        if (newY >= this.elements[this.current.x].length) {
                            newY = this.elements[this.current.x].length - 1;
                        } else {
                            for (delta = newY; delta < this.elements[this.current.x].length; delta++) {
                                if (this.elements[this.current.x][delta] !== void 0) {
                                    newY = delta;
                                    break;
                                }
                            }
                        }
                    }
                    newY = newY % this.elements[this.current.x].length;
                    if (this.elements[this.current.x][newY]) {
                        this.focusCurrentButtonY(newY);
                    } else {
                        var forwardX = this.current.x,
                            backwardX = this.current.x,
                            forwardSteps = 0,
                            backwardSteps = 0;
                        for (; !this.elements[++forwardX % this.elements.length][newY];) forwardSteps++;
                        backwardX--;
                        for (backwardX < 0 && (backwardX = this.elements.length - 1); !this.elements[backwardX][newY];) {
                            backwardX--;
                            backwardSteps++;
                            backwardX < 0 && (backwardX = this.elements.length - 1);
                        }
                        forwardSteps < backwardSteps ?
                            this.focusCurrentButton(forwardX, newY) :
                            this.focusCurrentButton(backwardX, newY);
                    }
                }
            }
        },

        /** Move the selection up `delta` rows (or to the previous focusable row). */
        stepUp: function (delta) {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL && !this.isEmpty()) {
                var newY = this.current.y - 1;
                if (this.elements[this.current.x]) {
                    if (delta) {
                        newY = newY - delta < 0 ? 0 : newY - delta;
                    } else if (this.loopButtons) {
                        for (newY < 0 && (newY = this.elements[this.current.x].length - 1); this.elements[this.current.x][newY] === void 0;) {
                            newY--;
                            newY < 0 && (newY = this.elements[this.current.x].length - 1);
                        }
                    } else if (newY < 0) {
                        newY = 0;
                    } else {
                        for (delta = newY; delta >= 0; delta--) {
                            if (this.elements[this.current.x][delta] !== void 0) {
                                newY = delta;
                                break;
                            }
                        }
                    }
                    if (this.elements[this.current.x][newY]) {
                        this.focusCurrentButtonY(newY);
                    } else {
                        var forwardX = this.current.x,
                            backwardX = this.current.x,
                            forwardSteps = 0,
                            backwardSteps = 0;
                        for (; !this.elements[++forwardX % this.elements.length][newY];) forwardSteps++;
                        for (; !this.elements[backwardX][newY];) {
                            backwardX--;
                            backwardSteps++;
                            backwardX < 0 && (backwardX = this.elements.length - 1);
                        }
                        forwardSteps < backwardSteps ?
                            this.focusCurrentButton(forwardX, newY) :
                            this.focusCurrentButton(backwardX, newY);
                    }
                }
            }
        },

        /** Give the current element focus and fire the selection callbacks. */
        _activate: function () {
            if (!ig.input.mouseGuiActive && !this.ignoreActiveFocus) {
                var element = this.getCurrentElement();
                if (element) {
                    element.focusGained();
                    this._invokeSelectionCallbacks(element);
                }
            }
        },

        /** Remove focus from every element in the grid. */
        _deactivate: function () {
            for (var x = 0; x < this.elements.length; ++x) {
                if (this.elements[x]) {
                    for (var y = 0; y < this.elements[x].length; ++y) {
                        this.elements[x][y] && this.elements[x][y].focusLost();
                    }
                }
            }
            this._lastInvokedPress && this._lastInvokedPress.setPressed(false);
            this._lastInvokedPress = null;
        },

        /** Clear the grid and the current selection. */
        clear: function () {
            var element = this.elements[this.current.x] ? this.elements[this.current.x][this.current.y] : null;
            if (element) {
                element.keepPressed && element.setPressed(false);
                element.focusLost();
            }
            this.current.x = 0;
            this.current.y = 0;
            this.elements = [];
            this.largestIndex.x = 0;
            this.largestIndex.y = 0;
            this._lastInvokedPress = null;
        },

        doButtonTraversal: function () {},

        getCurrentElement: function () {
            return this.elements[this.current.x] && this.elements[this.current.x][this.current.y];
        },

        getElementAt: function (x, y) {
            return this.elements[x] && this.elements[x][y];
        },

        getYElementAt: function (y) {
            return this.elements[this.current.x] && this.elements[this.current.x][y];
        },

        isNonMouseMenuInput: function () {
            return false;
        },

        isEmpty: function () {
            return this.elements.length == 0;
        },

        isPositionValid: function (x, y) {
            return this.elements[x] && this.elements[x][y];
        },

        /** True when this group is the active (top) group of its entry. */
        isActive: function () {
            if (!this.buttonInteract || !this.buttonInteract.isActive()) return false;
            if (this._isParallel) return true;
            var stack = this.buttonInteract.buttonGroupStack;
            return stack.length == 0 ? false : this == stack[stack.length - 1];
        },

        setLastInvokedButton: function (element) {
            this._lastInvokedPress = element;
        },

        setMouseOverGui: function () {},

        setCurrentFocus: function (x, y) {
            this.current.x = x;
            this.current.y = y;
        },

        setRegainFocus: function (x, y) {
            this.regain.x = x;
            this.regain.y = y;
        },

        /** Move focus to column `x`, playing the focus sound when appropriate. */
        focusCurrentButtonX: function (x) {
            if (this.current.x != x) {
                this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                this.current.x = x % this.elements.length;
                var element = this.elements[this.current.x][this.current.y];
                element.keepPressed && !this.soundsOnPressed ?
                    element.pressed || this.sounds.focus && this.sounds.focus.play() :
                    this.sounds.focus && this.sounds.focus.play();
                element.focusGained();
                this._invokeSelectionCallbacks(element);
            }
        },

        /** Move focus to row `y`, playing the focus sound when appropriate. */
        focusCurrentButtonY: function (y) {
            if (this.current.y != y) {
                this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                this.current.y = y % this.elements[this.current.x].length;
                var element = this.elements[this.current.x][this.current.y];
                element.keepPressed && !this.soundsOnPressed ?
                    element.pressed || this.sounds.focus && this.sounds.focus.play() :
                    this.sounds.focus && this.sounds.focus.play();
                element.focusGained();
                this._invokeSelectionCallbacks(element);
            }
        },

        /**
         * Move focus to (x, y).
         * @param {boolean} skipSelectionCallbacks - don't fire selection callbacks
         * @param {boolean} skipSound - don't play the focus sound
         * @param {boolean} skipIfSame - no-op when already focused there
         * @param {boolean} force - focus even without an interact entry / current element
         */
        focusCurrentButton: function (x, y, skipSelectionCallbacks, skipSound, skipIfSame, force) {
            if (!this.buttonInteract || !this.buttonInteract.mouseOverGui) {
                if (force || this.getCurrentElement()) {
                    if (!skipIfSame || !(this.current.x == x && this.current.y == y)) {
                        this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                        this.current.x = x % this.elements.length;
                        this.current.y = y % this.elements[this.current.x].length;
                        skipSound = skipSound != void 0 ? skipSound : false;
                        var element = this.elements[this.current.x][this.current.y];
                        element.keepPressed && !this.soundsOnPressed ?
                            element.pressed || !skipSound && this.sounds.focus && this.sounds.focus.play() :
                            !skipSound && this.sounds.focus && this.sounds.focus.play();
                        element.focusGained();
                        skipSelectionCallbacks || this._invokeSelectionCallbacks(element);
                    }
                }
            }
        },

        regainFocusOnKeyboard: function (skipSound) {
            this.focusCurrentButton(this.current.x, this.current.y, skipSound || false, true);
        },

        unfocusCurrentButton: function () {
            var element = this.elements[this.current.x][this.current.y];
            element && element.focusLost();
        },

        getCurrentX: function () {
            return this.current.x;
        },

        getCurrentY: function () {
            return this.current.y;
        },

        /** Mark `element` as the pressed button (only one unless multi-press). */
        setPressedFocusGui: function (element) {
            this._lastInvokedPress && this._lastInvokedPress.setPressed(false);
            element.setPressed(true);
            if (!this.enableMultiPressed) this._lastInvokedPress = element;
        },

        _setBackButton: function (element) {
            this.backButton = element;
        },

        _invokeSelectionCallbacks: function (element) {
            for (var i = this.selectionCallbacks.length; i--;) this.selectionCallbacks[i](element);
        },

        _invokePressCallbacks: function (element, viaMouse) {
            for (var i = this.pressCallbacks.length; i--;) this.pressCallbacks[i](element, viaMouse || false);
        }
    });

    /** The interact entry that owns button groups, globals and mouse focus. */
    ig.ButtonInteractEntry = ig.InteractEntry.extend({
        buttonGroupStack: [],
        parallelGroups: [],
        globalButtons: [],
        hotkeyCallbacks: [],
        mouseOverGui: null,
        mouseOverGuiClickPre: false,
        mouseIsOver: false,

        pushButtonGroup: function (group) {
            this.buttonGroupStack.push(group);
            group.buttonInteract = this;
            if (this.isActive()) {
                group._activate();
                ig.input.mouseGuiActive && (this.mouseIsOver && this.mouseOverGui) &&
                    group._invokeSelectionCallbacks(this.mouseOverGui);
            }
        },

        removeButtonGroup: function (group) {
            this.buttonGroupStack.erase(group);
            group.buttonInteract = this;
            group._deactivate();
        },

        /** Register a global button with an optional hotkey check callback. */
        addGlobalButton: function (button, hotkeyCallback, skipIfExists) {
            if (!(skipIfExists && this.globalButtons.indexOf(button) != -1)) {
                this.hotkeyCallbacks.push(hotkeyCallback || null);
                this.globalButtons.push(button);
                button.buttonInteract = this;
                button.buttonGroup = null;
            }
        },

        removeGlobalButton: function (button) {
            button.buttonInteract = null;
            var index = this.globalButtons.indexOf(button);
            if (index != -1) {
                this.globalButtons.splice(index, 1);
                this.hotkeyCallbacks.splice(index, 1);
                button.focusLost();
            }
        },

        addParallelGroup: function (group) {
            if (group) {
                group._isParallel = true;
                group.buttonInteract = this;
                this.parallelGroups.push(group);
            }
        },

        removeParallelGroup: function (group) {
            if (group) {
                group._isParallel = false;
                group.buttonInteract = null;
                this.parallelGroups.erase(group);
            }
        },

        clearAllButtons: function () {
            for (var i = this.globalButtons.length, button = null; i--;) {
                button = this.globalButtons[i];
                button.buttonInteract = null;
                button.focusLost();
            }
            this.globalButtons = [];
            this.hotkeyCallbacks = [];
        },

        pause: function (duration) {
            this.pauseTimer = duration || BUTTON_GROUP_DEFAULT_PAUSE_TIME;
        },

        onConnect: function () {
            var topGroup = this.getTopButtonGroup();
            topGroup && topGroup._activate();
        },

        onDisconnect: function () {
            var topGroup = this.getTopButtonGroup();
            topGroup && topGroup._deactivate();
            if (this.mouseOverGui) {
                this.mouseOverGui.focusLost();
                this.mouseOverGui = null;
                this.mouseOverGuiClickPre = false;
            }
        },

        clearMouseOverFocus: function () {
            if (this.mouseOverGui) {
                this.mouseOverGui.focusLost();
                this.mouseOverGui = null;
                this.mouseOverGuiClickPre = false;
            }
        },

        /**
         * Handle mouse clicks/hover on focus GUIs, keyboard traversal and
         * global (hotkey) buttons. Called by the interact manager each frame.
         */
        update: function () {
            var topGroup = this.getTopButtonGroup();
            if (topGroup && topGroup.isNonMouseMenuInput()) ig.input.mouseGuiActive = false;
            if (ig.input.mouseGuiActive) {
                if (topGroup && !this.regainFocus) {
                    this.regainFocus = true;
                    var currentElement = topGroup.getCurrentElement();
                    if (currentElement && this.mouseOverGui != currentElement) {
                        currentElement.focus && !this.mouseOverGui && this._invokeMouseFocusLostCallbacks();
                        currentElement.focusLost();
                    }
                }
                if (this.mouseOverGui && sc.control.getGuiClickPre()) this.mouseOverGuiClickPre = true;
                if (this.mouseOverGuiClickPre && this.mouseOverGui &&
                    sc.control.getGuiClick() && !ig.interact.isBlocked()) {
                    topGroup = this.mouseOverGui.buttonGroup;
                    if (this.mouseOverGui.active) {
                        if (this.mouseOverGui.keepPressed) {
                            if (!this.mouseOverGui.pressed) {
                                this.mouseOverGui.invokeButtonPress();
                                this.mouseOverGui.setPressed(true);
                            }
                        } else {
                            this.mouseOverGui.invokeButtonPress();
                        }
                        topGroup && topGroup._invokePressCallbacks(this.mouseOverGui, true);
                        if (topGroup) {
                            topGroup._lastInvokedPress &&
                                (!topGroup._lastInvokedPress.isSameAs(this.mouseOverGui) && topGroup._lastInvokedPress.keepPressed) &&
                                topGroup._lastInvokedPress.setPressed(false);
                            if (!topGroup.enableMultiPressed) topGroup._lastInvokedPress = this.mouseOverGui;
                        }
                    } else {
                        this.mouseOverGui.blockedSound && this.mouseOverGui.blockedSound.play();
                    }
                }
                if (!this.mouseIsOver && this.mouseOverGui && this.mouseOverGui.canLeaveFocus()) {
                    this.mouseOverGui.focusLost();
                    this.mouseOverGui = null;
                    this.mouseOverGuiClickPre = false;
                    this._invokeMouseFocusLostCallbacks();
                }
                this.mouseIsOver = false;
            } else if (topGroup) {
                if (this.regainFocus) {
                    currentElement = topGroup.getCurrentElement();
                    if (this.mouseOverGui == currentElement) this.regainFocus = false;
                    if (this.mouseOverGui) {
                        this.mouseOverGui.focusLost();
                        this.mouseOverGui = null;
                        this.mouseOverGuiClickPre = false;
                    }
                    if (currentElement && !topGroup.ignoreActiveFocus) {
                        currentElement.focusGained();
                        topGroup._invokeSelectionCallbacks(currentElement);
                    }
                }
                topGroup.doButtonTraversal(this.regainFocus);
                this.regainFocus = false;
            }
            for (topGroup = this.globalButtons.length; topGroup--;) {
                if (this.hotkeyCallbacks[topGroup] && this.hotkeyCallbacks[topGroup]()) {
                    if (!this.globalButtons[topGroup].keepMouseFocus) ig.input.mouseGuiActive = false;
                    this.globalButtons[topGroup].active ?
                        this.globalButtons[topGroup].invokeButtonPress(true) :
                        this.globalButtons[topGroup].blockedSound && this.globalButtons[topGroup].blockedSound.play();
                }
            }
        },

        /** Set the mouse-over focus GUI (from FocusGui.onMouseInteract). */
        setMouseOverGui: function (element) {
            var group = element.buttonGroup || this.getTopButtonGroup();
            if (group.isActive() && ig.input.mouseGuiActive) {
                if (this.mouseOverGui != element && (this.mouseOverGui ? this.mouseOverGui.canLeaveFocus() : 1)) {
                    this.mouseOverGui && this.mouseOverGui.focusLost();
                    element.canPlayFocusSounds() &&
                        (element.keepPressed ?
                            group.soundsOnPressed ?
                                group.sounds.focus && group.sounds.focus.play() :
                                element.pressed || group.sounds.focus && group.sounds.focus.play() :
                            group.sounds.focus && group.sounds.focus.play());
                    element.focusGained();
                    this.mouseOverGui = element;
                    this.mouseOverGuiClickPre = false;
                    group._invokeSelectionCallbacks(this.mouseOverGui);
                }
                this.mouseIsOver = true;
            }
        },

        getTopButtonGroup: function () {
            return this.buttonGroupStack.length > 0 ?
                this.buttonGroupStack[this.buttonGroupStack.length - 1] :
                null;
        },

        _invokeMouseFocusLostCallbacks: function () {
            var group = this.getTopButtonGroup();
            group && group.mouseFocusLostCallback && group.mouseFocusLostCallback();
            for (group = this.parallelGroups.length; group--;) {
                this.parallelGroups[group].mouseFocusLostCallback && this.parallelGroups[group].mouseFocusLostCallback();
            }
        }
    });
});
ig.baked = !0;
