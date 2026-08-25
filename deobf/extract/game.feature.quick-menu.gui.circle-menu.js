ig.module("game.feature.quick-menu.gui.circle-menu").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
    var b = Vec2.createC(0, 0);
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
        init: function(a, b, c) {
            this.parent(true, true);
            this.setPos(this.origin.x, this.origin.y);
            this.setSize(32, 32);
            this.setPivot(16, 16);
            this.state = a;
            this.endPos.x = b;
            this.endPos.y = c;
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
            var a = this.alphaTimer / 1,
                a = KEY_SPLINES.EASE_IN_OUT.get(1 - (a > 0.5 ? 1 - (a - 0.5) * 2 : a * 2));
            this.alpha = 0.8 * a + 0.2
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 400, 304, 32, 32);
            this.active ? this.focus ? a.addGfx(this.gfx, 0, 0, 400, 336, 32, 32).setAlpha(this.alpha) : this.pressed && a.addGfx(this.gfx, 0, 0, 400, 336, 32, 32) : this.focus && a.addGfx(this.gfx, 0, 0, 400, 272, 32, 32);
            a.addGfx(this.gfx, 8, 8, 432 + (this.state -
                1) * 16, 352 + (this.active ? 0 : 16), 16, 16)
        },
        show: function(a, b) {
            b && this.setPressed(false);
            this.doStateTransition("DEFAULT", false, false, null, a);
            this.doPosTranstition(this.endPos.x, this.endPos.y, 0.2, KEY_SPLINES.EASE_OUT, a)
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
        init: function(a) {
            this.parent();
            this.setSize(32, 32);
            this.button = a;
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
        setButtons: function(a, b, c, e) {
            a && this.addFocusGui(a, 0, 1);
            b && this.addFocusGui(b,
                0, 2);
            c && this.addFocusGui(c, 0, 3);
            e && this.addFocusGui(e, 0, 4)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.leftDown() || sc.control.rightDown() || sc.control.upDown() || sc.control.downDown()
        },
        doButtonTraversal: function(a) {
            if (!a) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                this.hasCD(1) && sc.control.leftDown() ? this.focusCurrentButton(0, 1) : this.hasCD(2) && sc.control.upDown() ? this.focusCurrentButton(0, 2) : this.hasCD(3) && sc.control.rightDown() ? this.focusCurrentButton(0, 3) :
                    this.hasCD(4) && sc.control.downDown() && this.focusCurrentButton(0, 4)
            }
        },
        focusCurrentButton: function(a, b, c, e, f) {
            if (!this.buttonInteract || !this.buttonInteract.mouseOverGui)
                if (f || !(this.current.x == a && this.current.y == b)) {
                    this.elements[this.current.x][this.current.y] && this.elements[this.current.x][this.current.y].focusLost();
                    this.current.x = a % this.elements.length;
                    this.current.y = b % this.elements[this.current.x].length;
                    e = e != void 0 ? e : false;
                    a = this.elements[this.current.x][this.current.y];
                    a.keepPressed && !this.soundsOnPressed ?
                        a.pressed || !e && this.sounds.focus && this.sounds.focus.play() : !e && this.sounds.focus && this.sounds.focus.play();
                    a.focusGained();
                    c || this._invokeSelectionCallbacks(a)
                }
        },
        hasCD: function(a) {
            return this.elements[0][a]
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
            this.buttongroup.addPressCallback(function(a) {
                if (a.state != void 0) switch (a.state) {
                    case sc.QUICK_MENU_STATE.ITEMS:
                        sc.quickmodel.enterItems();
                        this._unfocusAll(a);
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
                        this._unfocusAll(a)
                }
            }.bind(this));
            this.createButtons();
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            this._updatePos()
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 16, 16, 320, 288, 80, 80)
        },
        enter: function() {
            this.doStateTransition("PRE_DEFAULT",
                true);
            this.doStateTransition("DEFAULT");
            (!sc.model.isSaveAllowed() || sc.model.isTeleportBlocked()) && !sc.autoControl.isActive() ? this.map.setActive(false) : this.map.setActive(true);
            sc.pvp.isActive() || sc.model.player.itemBlockTimer > 0 || sc.quickmodel.itemsBlocked ? this.items.setActive(false) : this.items.setActive(true);
            !sc.model.player.getCore(sc.PLAYER_CORE.MENU_SOCIAL) || sc.party.currentParty.length <= 0 ? this.party.setActive(false) : this.party.setActive(true);
            for (var a = this.buttons.length; a--;) this.buttons[a].show();
            this._updatePos();
            sc.quickmodel.buttonInteract.pushButtonGroup(this.buttongroup)
        },
        exit: function() {
            this.doStateTransition("HIDDEN");
            for (var a = this.buttons.length; a--;) this.buttons[a].hide();
            sc.quickmodel.buttonInteract.removeButtonGroup(this.buttongroup)
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        createButtons: function() {
            for (var a = [], d = 0; d < 360; d = d + 90) {
                b.x = 56 - 35 * Math.sin(d * Math.PI / 180);
                b.y = 56 - 35 * Math.cos(d * Math.PI / 180);
                a.push({
                    x: b.x,
                    y: b.y
                })
            }
            this.items =
                this._createRingButton("items", sc.QUICK_MENU_STATE.ITEMS, a, 0, 1);
            this.check = this._createRingButton("analyze", sc.QUICK_MENU_STATE.CHECK, a, 0, 2);
            this.party = this._createRingButton("party", sc.QUICK_MENU_STATE.PARTY, a, 0, 3);
            this.map = this._createRingButton("map", sc.QUICK_MENU_STATE.MAP, a, 0, 4);
            this.items.addChildGui(new sc.ItemTimerOverlay(this.items));
            this.buttongroup.setButtons(this.check, this.items, this.map, this.party)
        },
        _unfocusAll: function() {
            for (var a = this.buttons.length; a--;) this.buttons[a].focusLost()
        },
        _createRingButton: function(a, b, c) {
            var e = new sc.RingMenuButton(b, Math.floor(c[b - 1].x - 16) + 1, Math.floor(c[b - 1].y - 16) + 1);
            e.data = ig.lang.get("sc.gui.quick-menu.description." + a);
            e.endPosActive.x = Math.floor(c[0].x - 16) + 1;
            e.endPosActive.y = Math.floor(c[0].y - 16) + 5;
            this.addChildGui(e);
            return this.buttons[b - 1] = e
        },
        _updatePos: function() {
            var a = ig.game.playerEntity,
                d = this.hook;
            if (a) {
                a = a.coll;
                ig.system.getScreenFromMapPos(b, Math.round(a.pos.x + a.size.x / 2), Math.round(a.pos.y - a.pos.z - a.size.z / 2 + a.size.y / 2));
                d.pos.x = b.x -
                    d.size.x / 2;
                d.pos.y = b.y - d.size.y / 2;
                d.pos.x = Math.max(0, Math.min(ig.system.width - d.size.x, d.pos.x));
                d.pos.y = Math.max(0, Math.min(ig.system.height - d.size.y, d.pos.y))
            }
        },
        _setStateActive: function(a) {
            var a = a - 1,
                b = this.buttons.length;
            if (this.buttons[a]) {
                for (; b--;) b != a && this.buttons[b].deactivate();
                this.buttons[a].activate()
            } else {
                for (; b--;) this.buttons[b].show(0, true);
                sc.quickmodel.isQuickNone() && !ig.input.mouseGuiActive && (sc.quickmodel.previousState == sc.QUICK_MENU_STATE.ITEMS ? this.buttons[0].focusGained() : sc.quickmodel.previousState ==
                    sc.QUICK_MENU_STATE.PARTY ? this.buttons[2].focusGained() : sc.quickmodel.previousState == sc.QUICK_MENU_STATE.CHECK && this.buttongroup.focusCurrentButton(0, 1, false, true, true))
            }
        },
        modelChanged: function(a, b) {
            if (a == sc.quickmodel && b == sc.QUICK_MODEL_EVENT.SWITCH_STATE)
                if (sc.quickmodel.isQuickCheck()) this.hide();
                else {
                    this.show();
                    this._setStateActive(sc.quickmodel.currentState)
                }
        }
    })
});
ig.baked = !0;
