ig.module("game.feature.quick-menu.gui.circle-menu").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
    var tempVec = Vec2.createC(0, 0);
    sc.RingMenuButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        state: 0,
        alpha: 1,
        alphaTimer: 0,
        endPos: Vec2.createC(0, 0),
        origin: Vec2.createC(40, 40),
        endPosActive: Vec2.createC(0, 0),
        data: null,
        submitSound: null,
        blockedSound: null,
        init: function(state, endX, endY) {
            this.parent(true, true);
            this.setPos(this.origin.x, this.origin.y);
            this.setSize(32, 32);
            this.setPivot(16, 16);
            this.state = state;
            this.endPos.x = endX;
            this.endPos.y = endY;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.blockedSound = sc.BUTTON_SOUND.denied
        },
        invokeButtonPress: function() {
            this.parent();
            this.submitSound && this.submitSound.play()
        },
        focusGained: function() {
            this.parent();
            if (this.focus) {
                this.alphaTimer = 0;
                this.alpha = 1
            }
        },
        update: function() {
            this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
            var progress = this.alphaTimer / 1,
                progress = KEY_SPLINES.EASE_IN_OUT.get(1 - (progress > 0.5 ? 1 - (progress - 0.5) * 2 : progress * 2));
            this.alpha = 0.8 * progress + 0.2
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, 0, 0, 400, 304, 32, 32);
            this.active ? this.focus ? drawables.addGfx(this.gfx, 0, 0, 400, 336, 32, 32).setAlpha(this.alpha) : this.pressed && drawables.addGfx(this.gfx, 0, 0, 400, 336, 32, 32) : this.focus && drawables.addGfx(this.gfx, 0, 0, 400, 272, 32, 32);
            drawables.addGfx(this.gfx, 8, 8, 432 + (this.state -
                1) * 16, 352 + (this.active ? 0 : 16), 16, 16)
        },
        show: function(instant, resetPressed) {
            resetPressed && this.setPressed(false);
            this.doStateTransition("DEFAULT", false, false, null, instant);
            this.doPosTranstition(this.endPos.x, this.endPos.y, 0.2, KEY_SPLINES.EASE_OUT, instant)
        },
        hide: function() {
            this.focusLost();
            this.setPressed(false);
            this.doStateTransition("HIDDEN");
            this.doPosTranstition(this.origin.x, this.origin.y, 0.2, KEY_SPLINES.LINEAR)
        },
        activate: function() {
            this.doStateTransition("DEFAULT");
            this.doPosTranstition(this.endPosActive.x, this.endPosActive.y, 0.1, KEY_SPLINES.LINEAR)
        },
        deactivate: function() {
            this.doStateTransition("HIDDEN");
            this.focusLost();
            this.doPosTranstition(this.endPos.x, this.endPos.y, 0.1, KEY_SPLINES.LINEAR)
        }
    });
    sc.ItemTimerOverlay = ig.GuiElementBase.extend({
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        isActive: true,
        numberGui: null,
        button: null,
        init: function(button) {
            this.parent();
            this.setSize(32, 32);
            this.button = button;
            this.numberGui = new sc.NumberGui(60, {
                leadingZeros: 2,
                size: sc.NUMBER_SIZE.NORMAL,
                noZero: true,
                color: sc.GUI_NUMBER_COLOR.RED
            });
            this.numberGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.numberGui.setNumber(0);
            this.addChildGui(this.numberGui)
        },
        update: function() {
            this.numberGui.setNumber(Math.ceil(sc.model.player.itemBlockTimer))
        }
    });
    sc.QuickMenuButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        init: function() {
            this.parent();
            this.addNull(0, 0)
        },
        setButtons: function(check, items, map, party) {
            check && this.addFocusGui(check, 0, 1);
            items && this.addFocusGui(items,
                0, 2);
            map && this.addFocusGui(map, 0, 3);
            party && this.addFocusGui(party, 0, 4)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.leftDown() || sc.control.rightDown() || sc.control.upDown() || sc.control.downDown()
        },
        doButtonTraversal: function(isMouseGuiActive) {
            if (!isMouseGuiActive) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                this.hasCD(1) && sc.control.leftDown() ? this.focusCurrentButton(0, 1) : this.hasCD(2) && sc.control.upDown() ? this.focusCurrentButton(0, 2) : this.hasCD(3) && sc.control.rightDown() ? this.focusCurrentButton(0, 3) :
                    this.hasCD(4) && sc.control.downDown() && this.focusCurrentButton(0, 4)
            }
        },
        focusCurrentButton: function(x, y, noSelectionCallback, force, skipFocusSound) {
            if (!this.buttonInteract || !this.buttonInteract.mouseOverGui)
                if (skipFocusSound || !(this.current.x == x && this.current.y == y)) {
                    this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                    this.current.x = x % this.elements.length;
                    this.current.y = y % this.elements[this.current.x].length;
                    force = force != void 0 ? force : false;
                    x = this.elements[this.current.x][this.current.y];
                    x.keepPressed && !this.soundsOnPressed ?
                        x.pressed || !force && this.sounds.focus && this.sounds.focus.play() : !force && this.sounds.focus && this.sounds.focus.play();
                    x.focusGained();
                    noSelectionCallback || this._invokeSelectionCallbacks(x)
                }
        },
        hasCD: function(index) {
            return this.elements[0][index]
        }
    });
    sc.QuickRingMenu = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    angle: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            PRE_DEFAULT: {
                state: {
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    angle: -1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        buttongroup: null,
        items: null,
        map: null,
        check: null,
        party: null,
        buttons: [],
        init: function() {
            this.parent();
            this.setSize(112, 112);
            this.setPivot(56, 56);
            sc.Model.addObserver(sc.quickmodel, this);
            this.buttongroup = new sc.QuickMenuButtonGroup;
            this.buttongroup.addPressCallback(function(button) {
                if (button.state != void 0) switch (button.state) {
                    case sc.QUICK_MENU_STATE.ITEMS:
                        sc.quickmodel.enterItems();
                        this._unfocusAll(button);
                        break;
                    case sc.QUICK_MENU_STATE.MAP:
                        this._unfocusAll();
                        sc.menu.setDirectMode(true, sc.MENU_SUBMENU.MAP);
                        sc.model.enterMenu(true);
                        sc.model.prevSubState = sc.GAME_MODEL_SUBSTATE.RUNNING;
                        break;
                    case sc.QUICK_MENU_STATE.CHECK:
                        sc.quickmodel.enterCheck();
                        this._unfocusAll();
                        break;
                    case sc.QUICK_MENU_STATE.PARTY:
                        sc.quickmodel.enterParty();
                        this._unfocusAll(button)
                }
            }.bind(this));
            this.createButtons();
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            this._updatePos()
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, 16, 16, 320, 288, 80, 80)
        },
        enter: function() {
            this.doStateTransition("PRE_DEFAULT",
                true);
            this.doStateTransition("DEFAULT");
            (!sc.model.isSaveAllowed() || sc.model.isTeleportBlocked()) && !sc.autoControl.isActive() ? this.map.setActive(false) : this.map.setActive(true);
            sc.pvp.isActive() || sc.model.player.itemBlockTimer > 0 || sc.quickmodel.itemsBlocked ? this.items.setActive(false) : this.items.setActive(true);
            !sc.model.player.getCore(sc.PLAYER_CORE.MENU_SOCIAL) || sc.party.currentParty.length <= 0 ? this.party.setActive(false) : this.party.setActive(true);
            for (var i = this.buttons.length; i--;) this.buttons[i].show();
            this._updatePos();
            sc.quickmodel.buttonInteract.pushButtonGroup(this.buttongroup)
        },
        exit: function() {
            this.doStateTransition("HIDDEN");
            for (var i = this.buttons.length; i--;) this.buttons[i].hide();
            sc.quickmodel.buttonInteract.removeButtonGroup(this.buttongroup)
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        createButtons: function() {
            for (var positions = [], angle = 0; angle < 360; angle = angle + 90) {
                tempVec.x = 56 - 35 * Math.sin(angle * Math.PI / 180);
                tempVec.y = 56 - 35 * Math.cos(angle * Math.PI / 180);
                positions.push({
                    x: tempVec.x,
                    y: tempVec.y
                })
            }
            this.items =
                this._createRingButton("items", sc.QUICK_MENU_STATE.ITEMS, positions, 0, 1);
            this.check = this._createRingButton("analyze", sc.QUICK_MENU_STATE.CHECK, positions, 0, 2);
            this.party = this._createRingButton("party", sc.QUICK_MENU_STATE.PARTY, positions, 0, 3);
            this.map = this._createRingButton("map", sc.QUICK_MENU_STATE.MAP, positions, 0, 4);
            this.items.addChildGui(new sc.ItemTimerOverlay(this.items));
            this.buttongroup.setButtons(this.check, this.items, this.map, this.party)
        },
        _unfocusAll: function() {
            for (var i = this.buttons.length; i--;) this.buttons[i].focusLost()
        },
        _createRingButton: function(name, state, positions) {
            var button = new sc.RingMenuButton(state, Math.floor(positions[state - 1].x - 16) + 1, Math.floor(positions[state - 1].y - 16) + 1);
            button.data = ig.lang.get("sc.gui.quick-menu.description." + name);
            button.endPosActive.x = Math.floor(positions[0].x - 16) + 1;
            button.endPosActive.y = Math.floor(positions[0].y - 16) + 5;
            this.addChildGui(button);
            return this.buttons[state - 1] = button
        },
        _updatePos: function() {
            var player = ig.game.playerEntity,
                hook = this.hook;
            if (player) {
                player = player.coll;
                ig.system.getScreenFromMapPos(tempVec, Math.round(player.pos.x + player.size.x / 2), Math.round(player.pos.y - player.pos.z - player.size.z / 2 + player.size.y / 2));
                hook.pos.x = tempVec.x -
                    hook.size.x / 2;
                hook.pos.y = tempVec.y - hook.size.y / 2;
                hook.pos.x = Math.max(0, Math.min(ig.system.width - hook.size.x, hook.pos.x));
                hook.pos.y = Math.max(0, Math.min(ig.system.height - hook.size.y, hook.pos.y))
            }
        },
        _setStateActive: function(state) {
            var index = state - 1,
                count = this.buttons.length;
            if (this.buttons[index]) {
                for (; count--;) count != index && this.buttons[count].deactivate();
                this.buttons[index].activate()
            } else {
                for (; count--;) this.buttons[count].show(0, true);
                sc.quickmodel.isQuickNone() && !ig.input.mouseGuiActive && (sc.quickmodel.previousState == sc.QUICK_MENU_STATE.ITEMS ? this.buttons[0].focusGained() : sc.quickmodel.previousState ==
                    sc.QUICK_MENU_STATE.PARTY ? this.buttons[2].focusGained() : sc.quickmodel.previousState == sc.QUICK_MENU_STATE.CHECK && this.buttongroup.focusCurrentButton(0, 1, false, true, true))
            }
        },
        modelChanged: function(model, msg) {
            if (model == sc.quickmodel && msg == sc.QUICK_MODEL_EVENT.SWITCH_STATE)
                if (sc.quickmodel.isQuickCheck()) this.hide();
                else {
                    this.show();
                    this._setStateActive(sc.quickmodel.currentState)
                }
        }
    })
});
ig.baked = !0;
