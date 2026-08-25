ig.module("impact.feature.interact.button-interact").requires("impact.feature.interact.interact").defines(function() {
    ig.BUTTON_GROUP_SELECT_TYPE = {
        ALL: 0,
        VERTICAL: 1,
        HORIZONTAL: 2
    };
    ig.ButtonGroup = ig.Class.extend({
        buttonInteract: null,
        elements: [],
        selectionCallbacks: [],
        pressCallbacks: [],
        mouseFocusLostCallback: null,
        backButton: null,
        current: {
            x: 0,
            y: 0
        },
        regain: {
            x: 0,
            y: 0
        },
        largestIndex: {
            x: 0,
            y: 0
        },
        loopButtons: true,
        soundsOnPressed: false,
        enableMultiPressed: false,
        ignoreActiveFocus: false,
        selectionType: ig.BUTTON_GROUP_SELECT_TYPE.ALL,
        _lastInvokedPress: null,
        _isParallel: false,
        sounds: {
            focus: null
        },
        init: function(b, a, d) {
            this.selectionType = b || ig.BUTTON_GROUP_SELECT_TYPE.ALL;
            this.loopButtons = a != void 0 ? a : true;
            this.soundsOnPressed = d || false
        },
        addFocusGui: function(b, a, d, c) {
            c && this._setBackButton(b);
            this.elements[a] || (this.elements[a] = []);
            this.elements[a][d] = b;
            b.buttonGroup = this;
            b.buttonInteract = null;
            this.largestIndex.x = Math.max(this.largestIndex.x, a);
            this.largestIndex.y = Math.max(this.largestIndex.y, d)
        },
        fillEmptySpace: function() {
            for (var b =
                    0; b < this.elements.length; b++)
                for (var a = 0; a < this.largestIndex.y; a++) {
                    this.elements[b] || (this.elements[b] = []);
                    this.elements[b][a] || (this.elements[b][a] = null)
                }
        },
        insertFocusGui: function(b, a, d) {
            this.elements[a] || (this.elements[a] = []);
            this.unfocusCurrentButton();
            this.elements[a].splice(d, 0, b);
            b.buttonGroup = this;
            b.buttonInteract = null
        },
        removeFocusGui: function(b, a) {
            this.elements[b] || (this.elements[b] = []);
            var d = this.elements[b].splice(a, 1)[0];
            if (!d) return null;
            d.keepPressed && d.setPressed(false);
            d.focusLost();
            d.buttonGroup = null;
            d.buttonInteract = null;
            return d
        },
        addNull: function(b, a) {
            this.elements[b] || (this.elements[b] = []);
            this.elements[b][a] = null
        },
        makeEmptyGrid: function(b, a) {
            for (var d = 0; d < b; d++)
                for (var c = 0; c < a; c++) {
                    this.elements[d] || (this.elements[d] = []);
                    this.elements[d][c] = null
                }
        },
        invokeCurrentButton: function() {
            if (this.elements[this.current.x]) {
                var b = this.elements[this.current.x][this.current.y];
                if (b)
                    if (b.active) {
                        if (b.keepPressed) {
                            if (!b.pressed) {
                                b.invokeButtonPress();
                                b.setPressed(true)
                            }
                        } else b.invokeButtonPress();
                        this._invokePressCallbacks(b);
                        this._lastInvokedPress && (!this._lastInvokedPress.isSameAs(b) && this._lastInvokedPress.keepPressed) && this._lastInvokedPress.setPressed(false);
                        if (!this.enableMultiPressed) this._lastInvokedPress = b
                    } else b.blockedSound && b.blockedSound.play()
            }
        },
        invokeBackButton: function() {
            this.backButton && this.backButton.invokeButtonPress()
        },
        setMouseFocusLostCallback: function(b) {
            if (b) this.mouseFocusLostCallback = b
        },
        addPressCallback: function(b) {
            b && this.pressCallbacks.push(b)
        },
        removePressCallback: function(b) {
            b &&
                this.pressCallbacks.remove(b)
        },
        addSelectionCallback: function(b) {
            b && this.selectionCallbacks.push(b)
        },
        removeSelectionCallback: function(b) {
            b && this.selectionCallbacks.remove(b)
        },
        clearSelectionCallbacks: function() {
            this.selectionCallbacks.length = 0
        },
        stepRight: function() {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL && !this.isEmpty()) {
                var b = this.current.x;
                if (this.loopButtons)
                    for (; !this.elements[++b % this.elements.length];);
                else {
                    b++;
                    if (b >= this.elements.length) b = this.elements.length - 1;
                    else
                        for (var a =
                                b; a < this.elements.length; a++)
                            if (this.elements[a]) {
                                b = a;
                                break
                            }
                }
                b = b % this.elements.length;
                if (this.elements[b][this.current.y]) this.focusCurrentButtonX(b);
                else {
                    for (var d = a = this.current.y, c = 0, e = 0; !this.elements[b][++a % this.elements[b].length];) c++;
                    d--;
                    for (d < 0 && (d = this.elements[b].length - 1); !this.elements[b][d];) {
                        d--;
                        e++;
                        d < 0 && (d = this.elements[b].length - 1)
                    }
                    c < e ? this.focusCurrentButton(b, a) : this.focusCurrentButton(b, d)
                }
            }
        },
        stepLeft: function() {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL && !this.isEmpty()) {
                var b =
                    this.current.x - 1;
                if (this.loopButtons)
                    for (b < 0 && (b = this.elements.length - 1); !this.elements[b];) {
                        b--;
                        b < 0 && (b = this.elements.length - 1)
                    } else if (b < 0) b = 0;
                    else
                        for (var a = b; a >= 0; a--)
                            if (this.elements[a]) {
                                b = a;
                                break
                            } if (this.elements[b][this.current.y]) this.focusCurrentButtonX(b);
                else {
                    for (var d = a = this.current.y, c = 0, e = 0; !this.elements[b][++a % this.elements[b].length];) c++;
                    d--;
                    for (d < 0 && (d = this.elements[b].length - 1); !this.elements[b][d];) {
                        d--;
                        e++;
                        d < 0 && (d = this.elements[b].length - 1)
                    }
                    c < e ? this.focusCurrentButton(b, a) : this.focusCurrentButton(b,
                        d)
                }
            }
        },
        stepDown: function(b) {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL && !this.isEmpty()) {
                var a = this.current.y;
                if (this.elements[this.current.x]) {
                    if (b) a = b + a >= this.elements[this.current.x].length ? this.elements[this.current.x].length - 1 : a + b;
                    else if (this.loopButtons)
                        for (; this.elements[this.current.x][++a % this.elements[this.current.x].length] === void 0;);
                    else {
                        a++;
                        if (a >= this.elements[this.current.x].length) a = this.elements[this.current.x].length - 1;
                        else
                            for (b = a; b < this.elements[this.current.x].length; b++)
                                if (this.elements[this.current.x][b] !==
                                    void 0) {
                                    a = b;
                                    break
                                }
                    }
                    a = a % this.elements[this.current.x].length;
                    if (this.elements[this.current.x][a]) this.focusCurrentButtonY(a);
                    else {
                        for (var d = b = this.current.x, c = 0, e = 0; !this.elements[++b % this.elements.length][a];) c++;
                        d--;
                        for (d < 0 && (d = this.elements.length - 1); !this.elements[d][a];) {
                            d--;
                            e++;
                            d < 0 && (d = this.elements.length - 1)
                        }
                        c < e ? this.focusCurrentButton(b, a) : this.focusCurrentButton(d, a)
                    }
                }
            }
        },
        stepUp: function(b) {
            if (this.selectionType != ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL && !this.isEmpty()) {
                var a = this.current.y -
                    1;
                if (this.elements[this.current.x]) {
                    if (b) a = a - b < 0 ? 0 : a - b;
                    else if (this.loopButtons)
                        for (a < 0 && (a = this.elements[this.current.x].length - 1); this.elements[this.current.x][a] === void 0;) {
                            a--;
                            a < 0 && (a = this.elements[this.current.x].length - 1)
                        } else if (a < 0) a = 0;
                        else
                            for (b = a; b >= 0; b--)
                                if (this.elements[this.current.x][b] !== void 0) {
                                    a = b;
                                    break
                                } if (this.elements[this.current.x][a]) this.focusCurrentButtonY(a);
                    else {
                        for (var d = b = this.current.x, c = 0, e = 0; !this.elements[++b % this.elements.length][a];) c++;
                        for (; !this.elements[d][a];) {
                            d--;
                            e++;
                            d < 0 && (d = this.elements.length - 1)
                        }
                        c < e ? this.focusCurrentButton(b, a) : this.focusCurrentButton(d, a)
                    }
                }
            }
        },
        _activate: function() {
            if (!ig.input.mouseGuiActive && !this.ignoreActiveFocus) {
                var b = this.getCurrentElement();
                if (b) {
                    b.focusGained();
                    this._invokeSelectionCallbacks(b)
                }
            }
        },
        _deactivate: function() {
            for (var b = 0; b < this.elements.length; ++b)
                if (this.elements[b])
                    for (var a = 0; a < this.elements[b].length; ++a) this.elements[b][a] && this.elements[b][a].focusLost();
            this._lastInvokedPress && this._lastInvokedPress.setPressed(false);
            this._lastInvokedPress = null
        },
        clear: function() {
            var b = this.elements[this.current.x] ? this.elements[this.current.x][this.current.y] : null;
            if (b) {
                b.keepPressed && b.setPressed(false);
                b.focusLost()
            }
            this.current.x = 0;
            this.current.y = 0;
            this.elements = [];
            this.largestIndex.x = 0;
            this.largestIndex.y = 0;
            this._lastInvokedPress = null
        },
        doButtonTraversal: function() {},
        getCurrentElement: function() {
            return this.elements[this.current.x] && this.elements[this.current.x][this.current.y]
        },
        getElementAt: function(b, a) {
            return this.elements[b] &&
                this.elements[b][a]
        },
        getYElementAt: function(b) {
            return this.elements[this.current.x] && this.elements[this.current.x][b]
        },
        isNonMouseMenuInput: function() {
            return false
        },
        isEmpty: function() {
            return this.elements.length == 0
        },
        isPositionValid: function(b, a) {
            return this.elements[b] && this.elements[b][a]
        },
        isActive: function() {
            if (!this.buttonInteract || !this.buttonInteract.isActive()) return false;
            if (this._isParallel) return true;
            var b = this.buttonInteract.buttonGroupStack;
            return b.length == 0 ? false : this == b[b.length - 1]
        },
        setLastInvokedButton: function(b) {
            this._lastInvokedPress = b
        },
        setMouseOverGui: function() {},
        setCurrentFocus: function(b, a) {
            this.current.x = b;
            this.current.y = a
        },
        setRegainFocus: function(b, a) {
            this.regain.x = b;
            this.regain.y = a
        },
        focusCurrentButtonX: function(b) {
            if (this.current.x != b) {
                this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                this.current.x = b % this.elements.length;
                b = this.elements[this.current.x][this.current.y];
                b.keepPressed && !this.soundsOnPressed ? b.pressed ||
                    this.sounds.focus && this.sounds.focus.play() : this.sounds.focus && this.sounds.focus.play();
                b.focusGained();
                this._invokeSelectionCallbacks(b)
            }
        },
        focusCurrentButtonY: function(b) {
            if (this.current.y != b) {
                this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                this.current.y = b % this.elements[this.current.x].length;
                b = this.elements[this.current.x][this.current.y];
                b.keepPressed && !this.soundsOnPressed ? b.pressed || this.sounds.focus && this.sounds.focus.play() : this.sounds.focus &&
                    this.sounds.focus.play();
                b.focusGained();
                this._invokeSelectionCallbacks(b)
            }
        },
        focusCurrentButton: function(b, a, d, c, e, f) {
            if (!this.buttonInteract || !this.buttonInteract.mouseOverGui)
                if (f || this.getCurrentElement())
                    if (!e || !(this.current.x == b && this.current.y == a)) {
                        this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                        this.current.x = b % this.elements.length;
                        this.current.y = a % this.elements[this.current.x].length;
                        c = c != void 0 ? c : false;
                        b = this.elements[this.current.x][this.current.y];
                        b.keepPressed && !this.soundsOnPressed ? b.pressed || !c && this.sounds.focus && this.sounds.focus.play() : !c && this.sounds.focus && this.sounds.focus.play();
                        b.focusGained();
                        d || this._invokeSelectionCallbacks(b)
                    }
        },
        regainFocusOnKeyboard: function(b) {
            this.focusCurrentButton(this.current.x, this.current.y, b || false, true)
        },
        unfocusCurrentButton: function() {
            var b = this.elements[this.current.x][this.current.y];
            b && b.focusLost()
        },
        getCurrentX: function() {
            return this.current.x
        },
        getCurrentY: function() {
            return this.current.y
        },
        setPressedFocusGui: function(b) {
            this._lastInvokedPress &&
                this._lastInvokedPress.setPressed(false);
            b.setPressed(true);
            if (!this.enableMultiPressed) this._lastInvokedPress = b
        },
        _setBackButton: function(b) {
            this.backButton = b
        },
        _invokeSelectionCallbacks: function(b) {
            for (var a = this.selectionCallbacks.length; a--;) this.selectionCallbacks[a](b)
        },
        _invokePressCallbacks: function(b, a) {
            for (var d = this.pressCallbacks.length; d--;) this.pressCallbacks[d](b, a || false)
        }
    });
    ig.ButtonInteractEntry = ig.InteractEntry.extend({
        buttonGroupStack: [],
        parallelGroups: [],
        globalButtons: [],
        hotkeyCallbacks: [],
        mouseOverGui: null,
        mouseOverGuiClickPre: false,
        mouseIsOver: false,
        pushButtonGroup: function(b) {
            this.buttonGroupStack.push(b);
            b.buttonInteract = this;
            if (this.isActive()) {
                b._activate();
                ig.input.mouseGuiActive && (this.mouseIsOver && this.mouseOverGui) && b._invokeSelectionCallbacks(this.mouseOverGui)
            }
        },
        removeButtonGroup: function(b) {
            this.buttonGroupStack.erase(b);
            b.buttonInteract = this;
            b._deactivate()
        },
        addGlobalButton: function(b, a, d) {
            if (!(d && this.globalButtons.indexOf(b) != -1)) {
                this.hotkeyCallbacks.push(a || null);
                this.globalButtons.push(b);
                b.buttonInteract = this;
                b.buttonGroup = null
            }
        },
        removeGlobalButton: function(b) {
            b.buttonInteract = null;
            var a = this.globalButtons.indexOf(b);
            if (a != -1) {
                this.globalButtons.splice(a, 1);
                this.hotkeyCallbacks.splice(a, 1);
                b.focusLost()
            }
        },
        addParallelGroup: function(b) {
            if (b) {
                b._isParallel = true;
                b.buttonInteract = this;
                this.parallelGroups.push(b)
            }
        },
        removeParallelGroup: function(b) {
            if (b) {
                b._isParallel = false;
                b.buttonInteract = null;
                this.parallelGroups.erase(b)
            }
        },
        clearAllButtons: function() {
            for (var b =
                    this.globalButtons.length, a = null; b--;) {
                a = this.globalButtons[b];
                a.buttonInteract = null;
                a.focusLost()
            }
            this.globalButtons = [];
            this.hotkeyCallbacks = []
        },
        pause: function(b) {
            this.pauseTimer = b || BUTTON_GROUP_DEFAULT_PAUSE_TIME
        },
        onConnect: function() {
            var b = this.getTopButtonGroup();
            b && b._activate()
        },
        onDisconnect: function() {
            var b = this.getTopButtonGroup();
            b && b._deactivate();
            if (this.mouseOverGui) {
                this.mouseOverGui.focusLost();
                this.mouseOverGui = null;
                this.mouseOverGuiClickPre = false
            }
        },
        clearMouseOverFocus: function() {
            if (this.mouseOverGui) {
                this.mouseOverGui.focusLost();
                this.mouseOverGui = null;
                this.mouseOverGuiClickPre = false
            }
        },
        update: function() {
            var b = this.getTopButtonGroup();
            if (b && b.isNonMouseMenuInput()) ig.input.mouseGuiActive = false;
            if (ig.input.mouseGuiActive) {
                if (b && !this.regainFocus) {
                    this.regainFocus = true;
                    var a = b.getCurrentElement();
                    if (a && this.mouseOverGui != a) {
                        a.focus && !this.mouseOverGui && this._invokeMouseFocusLostCallbacks();
                        a.focusLost()
                    }
                }
                if (this.mouseOverGui && sc.control.getGuiClickPre()) this.mouseOverGuiClickPre = true;
                if (this.mouseOverGuiClickPre && this.mouseOverGui &&
                    sc.control.getGuiClick() && !ig.interact.isBlocked()) {
                    b = this.mouseOverGui.buttonGroup;
                    if (this.mouseOverGui.active) {
                        if (this.mouseOverGui.keepPressed) {
                            if (!this.mouseOverGui.pressed) {
                                this.mouseOverGui.invokeButtonPress();
                                this.mouseOverGui.setPressed(true)
                            }
                        } else this.mouseOverGui.invokeButtonPress();
                        b && b._invokePressCallbacks(this.mouseOverGui, true);
                        if (b) {
                            b._lastInvokedPress && (!b._lastInvokedPress.isSameAs(this.mouseOverGui) && b._lastInvokedPress.keepPressed) && b._lastInvokedPress.setPressed(false);
                            if (!b.enableMultiPressed) b._lastInvokedPress =
                                this.mouseOverGui
                        }
                    } else this.mouseOverGui.blockedSound && this.mouseOverGui.blockedSound.play()
                }
                if (!this.mouseIsOver && this.mouseOverGui && this.mouseOverGui.canLeaveFocus()) {
                    this.mouseOverGui.focusLost();
                    this.mouseOverGui = null;
                    this.mouseOverGuiClickPre = false;
                    this._invokeMouseFocusLostCallbacks()
                }
                this.mouseIsOver = false
            } else if (b) {
                if (this.regainFocus) {
                    a = b.getCurrentElement();
                    if (this.mouseOverGui == a) this.regainFocus = false;
                    if (this.mouseOverGui) {
                        this.mouseOverGui.focusLost();
                        this.mouseOverGui = null;
                        this.mouseOverGuiClickPre =
                            false
                    }
                    if (a && !b.ignoreActiveFocus) {
                        a.focusGained();
                        b._invokeSelectionCallbacks(a)
                    }
                }
                b.doButtonTraversal(this.regainFocus);
                this.regainFocus = false
            }
            for (b = this.globalButtons.length; b--;)
                if (this.hotkeyCallbacks[b] && this.hotkeyCallbacks[b]()) {
                    if (!this.globalButtons[b].keepMouseFocus) ig.input.mouseGuiActive = false;
                    this.globalButtons[b].active ? this.globalButtons[b].invokeButtonPress(true) : this.globalButtons[b].blockedSound && this.globalButtons[b].blockedSound.play()
                }
        },
        setMouseOverGui: function(b) {
            var a = b.buttonGroup ||
                this.getTopButtonGroup();
            if (a.isActive() && ig.input.mouseGuiActive) {
                if (this.mouseOverGui != b && (this.mouseOverGui ? this.mouseOverGui.canLeaveFocus() : 1)) {
                    this.mouseOverGui && this.mouseOverGui.focusLost();
                    b.canPlayFocusSounds() && (b.keepPressed ? a.soundsOnPressed ? a.sounds.focus && a.sounds.focus.play() : b.pressed || a.sounds.focus && a.sounds.focus.play() : a.sounds.focus && a.sounds.focus.play());
                    b.focusGained();
                    this.mouseOverGui = b;
                    this.mouseOverGuiClickPre = false;
                    a._invokeSelectionCallbacks(this.mouseOverGui)
                }
                this.mouseIsOver =
                    true
            }
        },
        getTopButtonGroup: function() {
            return this.buttonGroupStack.length > 0 ? this.buttonGroupStack[this.buttonGroupStack.length - 1] : null
        },
        _invokeMouseFocusLostCallbacks: function() {
            var b = this.getTopButtonGroup();
            b && b.mouseFocusLostCallback && b.mouseFocusLostCallback();
            for (b = this.parallelGroups.length; b--;) this.parallelGroups[b].mouseFocusLostCallback && this.parallelGroups[b].mouseFocusLostCallback()
        }
    })
});
ig.baked = !0;
