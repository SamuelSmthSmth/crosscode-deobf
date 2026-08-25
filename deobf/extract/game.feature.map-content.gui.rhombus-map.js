ig.module("game.feature.map-content.gui.rhombus-map").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.numbers", "game.feature.menu.gui.enemies.enemy-pages").defines(function() {
    sc.RhombusMapMenu = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        callback: null,
        buttonInteract: null,
        buttonGroup: null,
        locations: [],
        currentFocus: null,
        _cursorMoved: false,
        _gamepadActive: false,
        _lastDevice: 0,
        _cursorPos: Vec2.createC(-1E4, -1E4),
        _worldCursor: Vec2.createC(-1E4, -1E4),
        info: null,
        help: null,
        container: null,
        infoBox: null,
        init: function(a) {
            this.parent();
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = a || null;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus =
                true;
            this.buttonGroup.addSelectionCallback(function(a) {
                a && a.entity && this.info.setText(a.entity.description)
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function() {
                this.info.setText("", 0.2);
                this.infoBox.hide()
            }.bind(this));
            this.buttonGroup.onButtonTraversal = function() {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && this.currentFocus) this.currentFocus.onButtonPress()
            }.bind(this);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.container = new ig.GuiElementBase;
            this.container.setSize(ig.system.width, ig.system.height);
            this.addChildGui(this.container);
            this.cursor = new sc.MapCursor;
            this.addChildGui(this.cursor);
            this.info = new sc.InfoBar(this.hook.size.x, 21, true);
            this.info.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.info);
            this.info.doStateTransition("DEFAULT");
            this.help = new sc.InfoBar(this.hook.size.x, 21, true);
            this.help.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.help.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.help.setText(ig.lang.get("sc.gui.menu.rhombus.help"));
            this.addChildGui(this.help);
            this.help.doStateTransition("DEFAULT");
            this.infoBox = new sc.RhombusMenuInfo;
            this.addChildGui(this.infoBox);
            ig.interact.addEntry(this.buttonInteract);
            this.createLocationUIs();
            this.doStateTransition("DEFAULT", true)
        },
        update: function() {
            this._cursorMoved = false;
            if (!ig.interact.isBlocked() && this.buttonGroup.isActive()) {
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var a = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        a = this._cursorPos;
                        this._initCursor(a);
                        this._worldCursor.x = a.x;
                        this._worldCursor.y = a.y;
                        this._limitCursorPos();
                        this._cursorMoved = false;
                        if (this.currentFocus) this.currentFocus.focus = false;
                        this.currentFocus = null;
                        this.info.setText("", 0.2);
                        this.cursor.moveTo(this._worldCursor.x, this._worldCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        this._cursorPos.x = this._worldCursor.x;
                        this._cursorPos.y = this._worldCursor.y;
                        this.cursor.unfocus()
                    }
                    this.cursor.looseFocus()
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var b = a = 0,
                        c = 0,
                        d = false;
                    if ((c = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        a = (-100 + c * 100) * ig.system.actualTick;
                        d = true
                    } else if ((c = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        a = (100 + c * 100) * ig.system.actualTick;
                        d = true
                    }
                    if ((c = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        b = (-100 + c * 100) * ig.system.actualTick;
                        d = true
                    } else if ((c = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) >
                        0.5) {
                        b = (100 + c * 100) * ig.system.actualTick;
                        d = true
                    }
                    if (d) {
                        this._cursorMoved = true;
                        this._worldCursor.x = a >= 0 ? Math.floor(this._worldCursor.x + a) : Math.ceil(this._worldCursor.x + a);
                        this._worldCursor.y = b >= 0 ? Math.floor(this._worldCursor.y + b) : Math.ceil(this._worldCursor.y + b);
                        this._limitCursorPos();
                        this.cursor.moveTo(this._worldCursor.x, this._worldCursor.y)
                    }
                }
            }
        },
        createLocationUIs: function() {
            for (var a = ig.game.shownEntities, b = a.length; b--;) {
                var c = a[b];
                if (c instanceof ig.ENTITY.RhombusPoint && (!c.condition || c.condition.evaluate())) {
                    c =
                        this.createLocationUI(c);
                    this.buttonGroup.addFocusGui(c);
                    this.locations.push(c);
                    this.container.addChildGui(c)
                }
            }
        },
        createLocationUI: function(a) {
            var b = new sc.RhombusMenuLocation(a, this),
                d = b.hook,
                a = a.coll;
            ig.system.getScreenFromMapPos(c, Math.round(a.pos.x + a.size.x / 2), Math.round(a.pos.y - a.pos.z - a.size.z / 2 + a.size.y / 2));
            if (c.x < 0) c.x = 0;
            if (c.x > ig.system.width) c.x = ig.system.width;
            if (c.y < 0) c.y = 0;
            if (c.y > ig.system.height) c.y = ig.system.height;
            d.pos.x = c.x - d.size.x / 2;
            d.pos.y = c.y - d.size.y / 2;
            return b
        },
        onButtonPress: function(a) {
            for (var b =
                    this.locations.length; b--;) this.locations[b].doStateTransition("HIDDEN");
            this.infoBox.hide();
            this.doStateTransition("HIDDEN", false, true, function() {
                ig.interact.removeEntry(this.buttonInteract);
                this.callback && this.callback(a.map, a.marker, a)
            }.bind(this), 0)
        },
        focusLocation: function(a, b, c) {
            if (this.currentFocus == c) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this._worldCursor.x = a;
                    this._worldCursor.y = b;
                    this.cursor.focusOnNode(a, b)
                }
            } else {
                this._worldCursor.x = a;
                this._worldCursor.y = b;
                if (this.currentFocus &&
                    this.currentFocus.focus) this.currentFocus.focus = false;
                if ((this.currentFocus = c) && !this.currentFocus.focus) this.currentFocus.focus = true;
                this.cursor.focusOnNode(a, b);
                this.infoBox.show(this.currentFocus)
            }
        },
        unfocus: function(a) {
            if (this.currentFocus == a) {
                if (this.currentFocus) this.currentFocus.focus = false;
                this.currentFocus = null;
                this.info.setText("", 0.2);
                this.cursor.unfocus();
                this.infoBox.hide()
            }
        },
        _initCursor: function(a) {
            if (a.x <= -1E4 || a.y <= -1E4) {
                a.x = ig.system.width / 2;
                a.y = ig.system.height / 2
            }
        },
        _limitCursorPos: function() {
            var a =
                this._worldCursor.x;
            this._worldCursor.x = a.limit(5, ig.system.width - Math.floor(this.cursor.hook.size.x / 2));
            a = this._worldCursor.y;
            this._worldCursor.y = a.limit(41, ig.system.height - this.cursor.hook.size.y - 4)
        }
    });
    sc.RhombusMenuInfo = ig.BoxGui.extend({
        transitions: {
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
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 304
                },
                flipped: {
                    x: 456,
                    y: 304
                }
            }
        }),
        gfx: new ig.Image("media/gui/rhombus-map.png"),
        title: null,
        arrow: null,
        icon: null,
        init: function() {
            this.parent(148, 100);
            this.title = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.title.setPos(0, 2);
            this.addChildGui(this.title);
            (new ig.ColorGui("#CCCCCC", 144, 82)).setPos(3, 18);
            this.icon = new ig.ImageGui(this.gfx, 0, 0, 142, 80);
            this.icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.icon.setPos(0, 17);
            this.addChildGui(this.icon);
            this.arrow = new sc.RhombusMenuArrow;
            this.addChildGui(this.arrow);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addColor("#CCCCCC", 3, this.title.hook.size.y + 1, 142, 1)
        },
        show: function(a) {
            this.alignToBase(a.hook);
            this.setData(a.entity);
            this.doStateTransition("DEFAULT");
            this.active = true
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a);
            this.active = false
        },
        setData: function(a) {
            this.title.setText(a.title);
            this.icon.offsetY = a.icon * 80
        },
        alignToBase: function(a) {
            var b =
                this.hook,
                d = b.currentState.alpha == 0;
            c.x = a.pos.x + Math.floor(a.size.x / 2);
            c.y = a.pos.y + Math.floor(a.size.y / 2);
            a = c.y + -46;
            c.y = Math.max(10, Math.min(ig.system.height - 100 - 10, c.y + -46));
            if (d) b.pos.y = c.y;
            var h = 38 + (a - c.y);
            if (c.x + 173 < ig.system.width) {
                this.currentTileOffset = "default";
                if (d) b.pos.x = c.x + 20 + 10;
                b.doPosTranstition(c.x + 20, c.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(-10, Math.max(7, Math.min(125, h)), false)
            } else {
                this.currentTileOffset = "flipped";
                if (d) b.pos.x = c.x - b.size.x - 20 - 10 - 1;
                b.doPosTranstition(c.x -
                    b.size.x - 20 - 1, c.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(b.size.x + 1, Math.max(7, Math.min(125, 38 + (a - c.y))), true)
            }
            this.arrow.bottomAnchor = false;
            this.arrow.flipY = false;
            if (h < 7) {
                this.arrow.bottomAnchor = true;
                this.arrow.flipY = true
            } else if (h > 125) this.arrow.bottomAnchor = true
        }
    });
    sc.RhombusMenuArrow = ig.GuiElementBase.extend({
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
        flipX: false,
        flipY: false,
        bottomAnchor: false,
        init: function() {
            this.parent();
            this.setSize(9, 15);
            this.doStateTransition("DEFAULT")
        },
        setPosition: function(a, b, c, d, i) {
            this.setPos(a, b);
            this.flipX = c || false;
            this.flipY = d || false;
            this.bottomAnchor = i || false
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, this.bottomAnchor ? 444 : 434, 337, 9, 15, this.flipX, this.flipY)
        }
    });
    var b = [0.1, 0.1, 0.1, 0.1],
        a = [0, 0, 0, 0],
        d = sc.BUTTON_SOUND.submit,
        c = Vec2.createC(0, 0);
    sc.RhombusMenuLocation = ig.FocusGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/rhombus-map.png"),
        entity: null,
        callback: null,
        icon: 0,
        origin: false,
        focusTimer: 0,
        focusFrame: 0,
        init: function(a, b) {
            this.parent(true, false);
            this.setSize(16, 16);
            this.setPivot(8, 8);
            this.entity = a;
            this.callback = b;
            this.origin = a.map == ig.game.previousMap;
            this.icon = this.entity.icon * 24;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", false, false, function() {}.bind(this))
        },
        onButtonPress: function() {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var a = Math.floor(sc.control.getMouseY());
                if (a <= 21 || a >= 299) return
            }
            d.play();
            this.callback.onButtonPress(this.entity)
        },
        update: function() {
            if (this.focus) {
                this.focusTimer = this.focusTimer + ig.system.actualTick;
                if (this.focusTimer >= b[this.focusFrame]) {
                    this.focusFrame = (this.focusFrame + 1) % a.length;
                    this.focusTimer = 0
                }
            }
        },
        updateDrawables: function(b) {
            this.focus && b.addGfx(this.gfx, -this.hook.pivot.x, -this.hook.pivot.y, 144 + 32 * a[this.focusFrame],
                0, 32, 32).setCompositionMode("lighter");
            b.addGfx(this.gfx, this.hook.pivot.x - 12, this.hook.pivot.y - 12, 144 + this.icon, 48 + (this.origin ? 24 : 0), 24, 24);
            this.origin && b.addGfx(this.gfx, -21, -13, 208, 32, 22, 17)
        },
        isMouseOver: function() {
            if (!ig.interact.isBlocked()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var a = this.getDistanceToCursor();
                    if (this.callback._cursorMoved) {
                        this.callback.unfocus(this);
                        return false
                    }
                    if (a <= 10) {
                        a = this.hook;
                        this.callback.focusLocation(a.pos.x + Math.floor(a.size.x / 2) - 1, a.pos.y + Math.floor(a.size.y /
                            2) + 1, this, true);
                        return true
                    }
                    this.callback.unfocus(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var b = Math.floor(sc.control.getMouseX()),
                        c = Math.floor(sc.control.getMouseY()),
                        a = this.hook;
                    (b = b >= a.pos.x && b <= a.pos.x + a.size.x && c >= a.pos.y && c <= a.pos.y + a.size.y) ? this.callback.focusLocation(a.pos.x + Math.floor(a.size.x / 2) - 1, a.pos.y + Math.floor(a.size.y / 2) + 1, this): this.callback.unfocus(this);
                    return b
                }
                return false
            }
        },
        unfocus: function() {
            this.focusTimer = 0;
            this.focusFrame = -1;
            this.callback.unfocus(this)
        },
        getDistanceToCursor: function() {
            return Math.floor(Vec2.distanceC(this.callback._worldCursor.x, this.callback._worldCursor.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    })
});
ig.baked = !0;
