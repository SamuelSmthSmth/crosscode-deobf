ig.module("game.feature.menu.gui.map.map-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc").defines(function() {
    var b = [],
        a = 0,
        d = 0;
    sc.LandmarkGui = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        key: null,
        activated: true,
        floor: 0,
        landmark: null,
        map: null,
        description: null,
        name: null,
        init: function(a, b, c, d, i) {
            this.parent();
            this.setSize(16, 16);
            this.setPos(b.x - 8, b.y - 8);
            this.key = a;
            this.landmark = b;
            this.floor = c;
            this.map = d;
            this.activated = sc.map.isLandmarkActive(a, i, true);
            if (sc.model.isTeleportBlockedNewGame()) this.activated = false;
            this.name = (a = sc.map.getCurrentAreaLandmark(this.key).name) ? ig.LangLabel.getText(a) : null;
            this.description = (a = sc.map.getCurrentAreaLandmark(this.key).description) ? ig.LangLabel.getText(a) : null
        },
        updateDrawables: function(a) {
            if (this.activated)
                if (this.focus && this.floor == sc.map.currentFloor) {
                    a.addGfx(this.gfx, -5, -6, 450, 170, 28, 28).setCompositionMode("lighter");
                    a.addGfx(this.gfx, 0, 0, 464, 144,
                        16, 16)
                } else a.addGfx(this.gfx, 0, 0, 448, 144, 16, 16);
            else this.focus && this.floor == sc.map.currentFloor ? a.addGfx(this.gfx, 0, 0, 624, 144, 16, 16) : a.addGfx(this.gfx, 0, 0, 608, 144, 16, 16)
        },
        isMouseOver: function() {
            if (!(this.floor != sc.map.currentFloor || sc.menu.mapWorldmapActive || ig.interact.isBlocked() || sc.menu.mapStampMenu)) {
                if (sc.menu.mapDrag) return sc.menu.mapMapFocus == this;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var b = this.getDistanceToCursor();
                    if (sc.menu.mapCursorMoved) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    if (b <=
                        10) {
                        b = this.hook;
                        sc.menu.focusMap(b.pos.x + Math.floor(b.size.x / 2) + sc.menu.mapAreaOffset.x, b.pos.y + Math.floor(b.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this, true);
                        return true
                    }
                    sc.menu.unfocusMap(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var c = Math.floor(sc.control.getMouseX()),
                        g = Math.floor(sc.control.getMouseY());
                    if (g <= 21 || g >= 299) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    b = this.hook;
                    a = b.screenCoords.x;
                    d = b.screenCoords.y;
                    (c = c >= a && c <= a + 15 && g >= d && g <= d + 16) ? sc.menu.focusMap(b.pos.x +
                        Math.floor(b.size.x / 2) + sc.menu.mapAreaOffset.x, b.pos.y + Math.floor(b.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this): sc.menu.unfocusMap(this);
                    return c
                }
                return false
            }
        },
        getDistanceToCursor: function() {
            return Math.floor(Vec2.distanceC(sc.menu.mapCursor.x - sc.menu.mapAreaOffset.x, sc.menu.mapCursor.y - sc.menu.mapAreaOffset.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    });
    sc.MapCurrentRoomWrapper = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
        init: function(a) {
            this.parent();
            this.setPos(a.pos.x, a.pos.y);
            this.setSize(a.size.x, a.size.y);
            var a = 648 + (a.size.x <= 24 || a.size.y <= 24 ? 0 : 16),
                b = new ig.ImageGui(this.gfx, a, 144, 16, 16);
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(-3, -3);
            this.addChildGui(b);
            b = new ig.ImageGui(this.gfx, a, 144, 16, 16);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.flipX = true;
            b.setPos(-2, -3);
            this.addChildGui(b);
            b = new ig.ImageGui(this.gfx, a, 144, 16, 16);
            b.flipY = true;
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(-3, -2);
            this.addChildGui(b);
            b = new ig.ImageGui(this.gfx, a, 144, 16, 16);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            b.flipY = true;
            b.flipX = true;
            b.setPos(-2, -2);
            this.addChildGui(b)
        }
    });
    sc.MapNameGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 3,
            top: 3,
            right: 3,
            bottom: 3,
            offsets: {
                "default": {
                    x: 296,
                    y: 448
                }
            }
        }),
        text: null,
        init: function() {
            this.parent(8, 8);
            this.hook.localAlpha = 0.8;
            this.text = new sc.TextGui("T", {
                font: sc.fontsystem.tinyFont
            });
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.hook.size.y = this.text.hook.size.y + 2
        },
        setText: function(a, b, c) {
            if (a) {
                this.doStateTransition("DEFAULT", b ? false : true, false, null, b || 0);
                this.text.setText(a);
                this.setSize(this.text.hook.size.x + 4, this.text.hook.size.y +
                    2)
            } else this.doStateTransition("HIDDEN", c)
        }
    });
    sc.WorldmapAreaName = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        name: null,
        hasText: false,
        flip: false,
        init: function() {
            this.parent();
            this.name = new sc.MapNameGui;
            this.name.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.name)
        },
        updateDrawables: function(a) {
            this.parent(a);
            this.flip ? this.hasText && a.addGfx(this.gfx, this.hook.size.x, -3, 320, 461, 3, 3) : this.hasText && a.addGfx(this.gfx, 0, this.hook.size.y - 3, 320, 461, 3, 3)
        },
        setText: function(a,
            b, c) {
            this.name.setText(a, b, c);
            this.hasText = a != "";
            this.hook.size.x = this.name.hook.size.x + 3;
            this.hook.size.y = this.name.hook.size.y + 3
        },
        setFlip: function(a) {
            this.flip = a || false
        }
    });
    sc.MapCursor = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        focusOffset: {
            x: 0,
            y: 8
        },
        focus: false,
        _focusTimer: 0,
        _focusTime: 0,
        _focusOffset: 0,
        _lastDevice: 0,
        _gamepadActive: false,
        _worldmap: false,
        _ignoreModel: false,
        init: function(a) {
            this.parent();
            this.setSize(11, 24);
            this._worldmap = a || false
        },
        focusOnNode: function(a, b) {
            this.setPos(a -
                Math.floor(this.hook.size.x / 2), b - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.15;
            this._focusOffset = 0
        },
        unfocus: function() {
            this.focus = false;
            this._focusTime = this._focusTimer = 0.15;
            this._focusOffset = 0
        },
        moveTo: function(a, b, c, d) {
            c && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(a - Math.floor(this.hook.size.x / 2), b - Math.floor(this.hook.size.y / 2) - this.focusOffset.y, d, KEY_SPLINES.EASE) : this.setPos(a - Math.floor(this.hook.size.x /
                2), b - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.15;
                this._focusOffset = 3;
                this.focus = false
            }
        },
        looseFocus: function() {
            this._focusTime = this._focusTimer = 0.15;
            this._focusOffset = 0
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        update: function() {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice =
                    ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.tick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
            }
        },
        updateDrawables: function(a) {
            if (this.focus) a.addGfx(this.gfx, 0, -1 + this._focusOffset, 434, 146, 11, 17);
            else if (this._gamepadActive) {
                a.addGfx(this.gfx, 1, 0, 419, 147, 9, 14);
                a.addGfx(this.gfx, 1, this.hook.size.y - 9, 483,
                    147, 9, 9).setCompositionMode("lighter")
            }
        },
        modelChanged: function(a, b, c) {
            if (!this._ignoreModel && a == sc.menu)
                if (b == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) this._gamepadActive = true
                } else if (b == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                this._focusTime = this._focusTimer = 0.15;
                this._focusOffset = 0
            } else b == sc.MENU_EVENT.MAP_FOCUS_AREA ? this._worldmap && this.focusOnNode(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y) : b == sc.MENU_EVENT.MAP_FOCUS_MAP ? this._worldmap ||
                this.focusOnNode(sc.menu.mapCursor.x, sc.menu.mapCursor.y) : b == sc.MENU_EVENT.MAP_UNFOCUS ? this._worldmap == c && this.unfocus() : b == sc.MENU_EVENT.MAP_ENSURE_FOCUS && (this.focus || (c ? this.focusOnNode(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y) : this.focusOnNode(sc.menu.mapCursor.x, sc.menu.mapCursor.y)))
        }
    });
    sc.MapChestDisplay = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        current: null,
        max: null,
        _oldCount: -1,
        _oldMax: -1,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -70
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.setSize(58, 11);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(12, 24);
            this.current = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.current.setPos(26, 2);
            this.current.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.current);
            this.max = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.max.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.max.setPos(0, 2);
            this.addChildGui(this.max);
            this.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.map.titles.chest",
                    description: "sc.gui.menu.help.map.description.chest"
                },
                offset: {
                    x: -3,
                    y: -2
                },
                size: {
                    x: "dyn",
                    y: 15,
                    offX: 6
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            var a = sc.map.getCurrentChestCount();
            if (a != this._oldMax) {
                this._oldMax = a;
                this.max.setNumber(a)
            }
            a = sc.stats.getMap("chests", sc.map.currentArea.path) || 0;
            if (a != this._oldCount) {
                this._oldCount = a;
                this.current.setNumber(Math.min(this._oldMax,
                    a))
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 280, 448, 11, 11);
            a.addGfx(this.gfx, 33, 2, 80, 408, 8, 8)
        }
    });
    sc.MapStampDisplay = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        current: null,
        max: null,
        _oldCount: -1,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -70
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.setSize(58, 11);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(12,
                42);
            this.current = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.current.setPos(26, 2);
            this.current.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.current);
            this.max = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.max.setNumber(sc.MAP_STAMPS_MAX, true);
            this.max.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.max.setPos(0, 2);
            this.addChildGui(this.max);
            this.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.map.titles.stamps",
                    description: "sc.gui.menu.help.map.description.stamps"
                },
                offset: {
                    x: -3,
                    y: -2
                },
                size: {
                    x: "dyn",
                    y: 15,
                    offX: 6
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            var a = sc.menu.getStampCount(sc.map.currentArea.path);
            if (a != this._oldCount) {
                this._oldCount = a;
                this.current.setNumber(Math.min(sc.MAP_STAMPS_MAX, a))
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 280, 460, 11, 11);
            a.addGfx(this.gfx, 33, 2, 80, 408, 8, 8)
        }
    });
    sc.MapFloorButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        textGui: null,
        name: "???",
        level: 0,
        alpha: 1,
        alphaTimer: 0,
        init: function(a, b) {
            this.parent(true, true);
            this.setSize(62, 34);
            this.name = a || "???";
            this.level = b || 0;
            this.keepMouseFocus = true;
            this.textGui = new sc.TextGui(this.name, {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.textGui.setPos(0, -2);
            this.addChildGui(this.textGui)
        },
        focusGained: function(a) {
            this.parent(a);
            if (this.focus) {
                this.alphaTimer = 0;
                this.alpha = 1
            }
        },
        onMouseInteract: function(a, b) {
            if (!sc.menu.mapDrag) {
                this.parent(a, b);
                if (!sc.menu.mapMouseOverFloorButtons &&
                    a && !sc.menu.mapDrag) sc.menu.mapMouseOverFloorButtons = true
            }
        },
        update: function() {
            this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
            var a = this.alphaTimer / 1,
                a = KEY_SPLINES.EASE_IN_OUT.get(1 - (a > 0.5 ? 1 - (a - 0.5) * 2 : a * 2));
            this.alpha = 0.8 * a + 0.2
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 314, 384 + (this.focus ? 34 : 0), 62, 34);
            this.focus ? a.addGfx(this.gfx, 0, 0, 376, 384, 62, 34).setAlpha(this.alpha) : this.pressed && a.addGfx(this.gfx, 0, 0, 376, 384, 62, 34)
        }
    });
    sc.MapFloorButtonContainer = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        buttongroup: null,
        leaIcon: null,
        hasVisitedRooms: [],
        _floors: null,
        _selfUpdate: false,
        _submitSound: null,
        _minFloor: 0,
        _maxFloor: 0,
        init: function() {
            this.parent();
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -87
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.setPos(25, 33);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.doStateTransition("HIDDEN", true);
            this._submitSound = sc.BUTTON_SOUND.submit;
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.ignoreActiveFocus = true;
            this.buttongroup.addPressCallback(this.onFloorPress.bind(this));
            this.leaIcon = new ig.ImageGui(this.gfx, 280, 388, 34, 20);
            this.leaIcon.hook.transitions = {
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
            this.leaIcon.doStateTransition("HIDDEN", true);
            if (sc.map.getCurrentArea()) {
                this._floors = sc.map.getCurrentArea().floors;
                this.setSize(62, 34 * this._floors.length + -8 * Math.max(0, this._floors.length -
                    1));
                this._createButtons(true)
            }
        },
        showMenu: function() {
            sc.menu.buttonInteract.addParallelGroup(this.buttongroup);
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeParallelGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        centerMap: function() {
            this._selfUpdate = true;
            this._submitSound.play();
            sc.menu.selectFloor(sc.map.currentFloor)
        },
        update: function() {
            if (this._floors &&
                !sc.menu.mapWorldmapActive && !sc.menu.mapStampMenu && !sc.menu.helpMenuOpen) {
                var a = -1E4;
                if (this.pressed("circle-right", ig.BUTTONS.DPAD_UP, ig.BUTTONS.LEFT_SHOULDER)) {
                    a = sc.map.currentFloor + 1;
                    if (a > this._maxFloor) a = this._minFloor
                } else if (this.pressed("circle-left", ig.BUTTONS.DPAD_DOWN, ig.BUTTONS.RIGHT_SHOULDER)) {
                    a = sc.map.currentFloor - 1;
                    if (a < this._minFloor) a = this._maxFloor
                }
                if (a > -1E4 && a != sc.map.currentFloor) {
                    this._submitSound.play();
                    sc.menu.selectFloor(a);
                    if (sc.menu.mapMapFocus) this.hoverRoom = sc.menu.mapMapFocus =
                        null
                }
            }
        },
        pressed: function(a, b, c) {
            return ig.input.pressed(a) || ig.gamepad.isButtonPressed(b) || ig.gamepad.isButtonPressed(c)
        },
        onFloorPress: function(a) {
            if (a.level != void 0) {
                this._selfUpdate = true;
                this._submitSound.play();
                sc.menu.selectFloor(a.level || 0)
            }
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.MAP_CHANGED_FLOOR)
                    if (this._selfUpdate) this._selfUpdate = false;
                    else {
                        if (a = this.buttongroup.elements[0])
                            for (b = a.length; b--;) a[b] && (a[b].level != void 0 && a[b].level == sc.map.currentFloor) && this.buttongroup.setPressedFocusGui(a[b])
                    }
            else if (b ==
                sc.MENU_EVENT.MAP_WORLDMAP_STATE) c ? this.exitMenu() : this.showMenu();
            else if (b == sc.MENU_EVENT.MAP_AREA_LOAD_DONE) {
                this._floors = sc.map.getCurrentArea().floors;
                this.setSize(62, 34 * this._floors.length + -8 * Math.max(0, this._floors.length - 1));
                this._createButtons(true);
                this.showMenu()
            }
        },
        _createButtons: function(a) {
            this.hook.removeAllChildren();
            this.buttongroup.clear();
            this.leaIcon.doStateTransition("HIDDEN", true);
            var c = this._floors.length,
                d = 0,
                h = null,
                i = 0,
                h = false,
                j = 0,
                k = null;
            this._minFloor = 1E5;
            for (this._maxFloor = -1E5; c--;) {
                k = this._floors[c].maps;
                i = this._floors[c].level;
                j = k.length;
                for (h = false; j--;)
                    if (ig.vars.storage.maps[k[j].path.toCamel().toPath("", "")]) {
                        h = true;
                        break
                    } if (h) {
                    if (i < this._minFloor) this._minFloor = i;
                    if (i > this._maxFloor) this._maxFloor = i;
                    h = new sc.MapFloorButton(this._getFloorName(i, c), i);
                    h.setPos(0, d);
                    this.buttongroup.addFocusGui(h, 0, c);
                    if (sc.map.currentFloor == i) {
                        this.buttongroup.setPressedFocusGui(h);
                        if (sc.map.currentPlayerArea == sc.map.currentArea) {
                            this.leaIcon.setPos(45, d - 3);
                            this.leaIcon.doStateTransition("DEFAULT",
                                a || false)
                        }
                    }
                    d = d + 26;
                    b.push(h)
                }
            }
            for (c = b.length; c--;) this.addChildGui(b[c]);
            this.addChildGui(this.leaIcon);
            b.length = 0
        },
        _getFloorName: function(a, b) {
            var c = sc.map.getCurrentArea().floors[b];
            return c && c.handle ? ig.LangLabel.getText(c.handle) : a == 0 ? ig.lang.get("sc.gui.menu.map-menu.gf") : a < 0 ? ig.lang.get("sc.gui.menu.map-menu.base-short") + Math.abs(a) : Math.abs(a) + ig.lang.get("sc.gui.menu.map-menu.floor-short")
        }
    });
    sc.CurrentAreaDisplay = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        init: function() {
            this.parent(sc.MenuPanelType.SQUARE);
            this.setPos(2, 24);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.text = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont
            });
            this.text.setPos(0, 1);
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.text)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu,
                this)
        },
        showMenu: function() {
            this.text.setText(ig.lang.get("sc.gui.menu.map-menu.area") + sc.map.getCurrentAreaName());
            var a = this.text.hook;
            this.setSize(a.size.x + 6, a.size.y + 2);
            this.setStateValue("HIDDEN", "offsetX", -(a.size.x + 2));
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(a, b, c) {
            a == sc.menu && (b == sc.MENU_EVENT.MAP_WORLDMAP_STATE ? c ? this.exitMenu() : this.showMenu() : b == sc.MENU_EVENT.MAP_AREA_LOAD_DONE && this.showMenu())
        }
    });
    var c = ["black", "red",
        "green", "blue", "yellow", "pink", "cyan", "orange", "purple", "wheat"
    ];
    sc.DebugFloorView = sc.MenuPanel.extend({
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
        floor: null,
        init: function() {
            this.parent();
            if (sc.map.getCurrentArea()) {
                this.floor = sc.map.getCurrentArea().floors;
                this.doStateTransition("HIDDEN", true)
            }
        },
        updateDrawables: function(a) {
            this.parent(a);
            if (this.floor)
                for (var b = this.floor.length, d = null, h = 0; b--;) {
                    for (var d =
                            this.floor[b].tiles, i = 0; i < d.length; i++)
                        for (var j = 0; j < d[0].length; j++) d[i][j] && a.addColor(c[d[i][j] % c.length], j * 4, i * 4 + h, 4, 4);
                    h = h + (d.length * 4 + 4)
                }
        }
    })
});
ig.baked = !0;
