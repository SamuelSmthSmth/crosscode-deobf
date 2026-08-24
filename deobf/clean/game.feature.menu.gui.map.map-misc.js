/**
 * game.feature.menu.gui.map.map-misc
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.map.map-misc")`.
 *
 * Misc map submenu widgets: `sc.LandmarkGui` (clickable landmark/stamp icons),
 * `sc.MapCurrentRoomWrapper` (corner brackets around the current room),
 * `sc.MapNameGui` (the room-name tooltip), `sc.WorldmapAreaName`, `sc.MapCursor`,
 * `sc.MapChestDisplay` / `sc.MapStampDisplay` (bottom-left counters),
 * `sc.MapFloorButton` + `sc.MapFloorButtonContainer` (floor switcher on the right),
 * `sc.CurrentAreaDisplay` (area name label) and the debug-only `sc.DebugFloorView`.
 */
ig.module("game.feature.menu.gui.map.map-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    var floorButtonScratch = [],
        landmarkScreenX = 0,
        landmarkScreenY = 0;

    sc.LandmarkGui = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        key: null,
        activated: true,
        floor: 0,
        landmark: null,
        map: null,
        description: null,
        name: null,

        init: function (key, landmark, floor, map, areaPath) {
            this.parent();
            this.setSize(16, 16);
            this.setPos(landmark.x - 8, landmark.y - 8);
            this.key = key;
            this.landmark = landmark;
            this.floor = floor;
            this.map = map;
            this.activated = sc.map.isLandmarkActive(key, areaPath, true);
            if (sc.model.isTeleportBlockedNewGame()) this.activated = false;
            var name = sc.map.getCurrentAreaLandmark(this.key).name;
            this.name = name ? ig.LangLabel.getText(name) : null;
            var description = sc.map.getCurrentAreaLandmark(this.key).description;
            this.description = description ? ig.LangLabel.getText(description) : null
        },

        updateDrawables: function (renderer) {
            if (this.activated)
                if (this.focus && this.floor == sc.map.currentFloor) {
                    renderer.addGfx(this.gfx, -5, -6, 450, 170, 28, 28).setCompositionMode("lighter");
                    renderer.addGfx(this.gfx, 0, 0, 464, 144, 16, 16)
                } else renderer.addGfx(this.gfx, 0, 0, 448, 144, 16, 16);
            else this.focus && this.floor == sc.map.currentFloor ? renderer.addGfx(this.gfx, 0, 0, 624, 144, 16, 16) : renderer.addGfx(this.gfx, 0, 0, 608, 144, 16, 16)
        },

        isMouseOver: function () {
            if (!(this.floor != sc.map.currentFloor || sc.menu.mapWorldmapActive || ig.interact.isBlocked() || sc.menu.mapStampMenu)) {
                if (sc.menu.mapDrag) return sc.menu.mapMapFocus == this;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var distance = this.getDistanceToCursor();
                    if (sc.menu.mapCursorMoved) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    if (distance <= 10) {
                        var hook = this.hook;
                        sc.menu.focusMap(hook.pos.x + Math.floor(hook.size.x / 2) + sc.menu.mapAreaOffset.x, hook.pos.y + Math.floor(hook.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this, true);
                        return true
                    }
                    sc.menu.unfocusMap(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY());
                    if (mouseY <= 21 || mouseY >= 299) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    var mouseHook = this.hook;
                    landmarkScreenX = mouseHook.screenCoords.x;
                    landmarkScreenY = mouseHook.screenCoords.y;
                    var isOver = mouseX >= landmarkScreenX && mouseX <= landmarkScreenX + 15 && mouseY >= landmarkScreenY && mouseY <= landmarkScreenY + 16;
                    isOver ? sc.menu.focusMap(mouseHook.pos.x + Math.floor(mouseHook.size.x / 2) + sc.menu.mapAreaOffset.x, mouseHook.pos.y + Math.floor(mouseHook.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this) : sc.menu.unfocusMap(this);
                    return isOver
                }
                return false
            }
        },

        getDistanceToCursor: function () {
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

        init: function (activeRoom) {
            this.parent();
            this.setPos(activeRoom.pos.x, activeRoom.pos.y);
            this.setSize(activeRoom.size.x, activeRoom.size.y);
            var cornerIndex = 648 + (activeRoom.size.x <= 24 || activeRoom.size.y <= 24 ? 0 : 16),
                cornerGui = new ig.ImageGui(this.gfx, cornerIndex, 144, 16, 16);
            cornerGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            cornerGui.setPos(-3, -3);
            this.addChildGui(cornerGui);
            cornerGui = new ig.ImageGui(this.gfx, cornerIndex, 144, 16, 16);
            cornerGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            cornerGui.flipX = true;
            cornerGui.setPos(-2, -3);
            this.addChildGui(cornerGui);
            cornerGui = new ig.ImageGui(this.gfx, cornerIndex, 144, 16, 16);
            cornerGui.flipY = true;
            cornerGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            cornerGui.setPos(-3, -2);
            this.addChildGui(cornerGui);
            cornerGui = new ig.ImageGui(this.gfx, cornerIndex, 144, 16, 16);
            cornerGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            cornerGui.flipY = true;
            cornerGui.flipX = true;
            cornerGui.setPos(-2, -2);
            this.addChildGui(cornerGui)
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

        init: function () {
            this.parent(8, 8);
            this.hook.localAlpha = 0.8;
            this.text = new sc.TextGui("T", {
                font: sc.fontsystem.tinyFont
            });
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.hook.size.y = this.text.hook.size.y + 2
        },

        setText: function (text, delay, instant) {
            if (text) {
                this.doStateTransition("DEFAULT", delay ? false : true, false, null, delay || 0);
                this.text.setText(text);
                this.setSize(this.text.hook.size.x + 4, this.text.hook.size.y + 2)
            } else this.doStateTransition("HIDDEN", instant)
        }
    });

    sc.WorldmapAreaName = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        name: null,
        hasText: false,
        flip: false,

        init: function () {
            this.parent();
            this.name = new sc.MapNameGui;
            this.name.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.name)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            this.flip ? this.hasText && renderer.addGfx(this.gfx, this.hook.size.x, -3, 320, 461, 3, 3) : this.hasText && renderer.addGfx(this.gfx, 0, this.hook.size.y - 3, 320, 461, 3, 3)
        },

        setText: function (text, delay, instant) {
            this.name.setText(text, delay, instant);
            this.hasText = text != "";
            this.hook.size.x = this.name.hook.size.x + 3;
            this.hook.size.y = this.name.hook.size.y + 3
        },

        setFlip: function (flip) {
            this.flip = flip || false
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

        init: function (worldmap) {
            this.parent();
            this.setSize(11, 24);
            this._worldmap = worldmap || false
        },

        focusOnNode: function (x, y) {
            this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.15;
            this._focusOffset = 0
        },

        unfocus: function () {
            this.focus = false;
            this._focusTime = this._focusTimer = 0.15;
            this._focusOffset = 0
        },

        moveTo: function (x, y, animate, time) {
            animate && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y, time, KEY_SPLINES.EASE) : this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.15;
                this._focusOffset = 3;
                this.focus = false
            }
        },

        looseFocus: function () {
            this._focusTime = this._focusTimer = 0.15;
            this._focusOffset = 0
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        update: function () {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.tick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
            }
        },

        updateDrawables: function (renderer) {
            if (this.focus) renderer.addGfx(this.gfx, 0, -1 + this._focusOffset, 434, 146, 11, 17);
            else if (this._gamepadActive) {
                renderer.addGfx(this.gfx, 1, 0, 419, 147, 9, 14);
                renderer.addGfx(this.gfx, 1, this.hook.size.y - 9, 483, 147, 9, 9).setCompositionMode("lighter")
            }
        },

        modelChanged: function (menu, event, data) {
            if (!this._ignoreModel && menu == sc.menu)
                if (event == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) this._gamepadActive = true
                } else if (event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                this._focusTime = this._focusTimer = 0.15;
                this._focusOffset = 0
            } else event == sc.MENU_EVENT.MAP_FOCUS_AREA ? this._worldmap && this.focusOnNode(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y) : event == sc.MENU_EVENT.MAP_FOCUS_MAP ? this._worldmap || this.focusOnNode(sc.menu.mapCursor.x, sc.menu.mapCursor.y) : event == sc.MENU_EVENT.MAP_UNFOCUS ? this._worldmap == data && this.unfocus() : event == sc.MENU_EVENT.MAP_ENSURE_FOCUS && (this.focus || (data ? this.focusOnNode(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y) : this.focusOnNode(sc.menu.mapCursor.x, sc.menu.mapCursor.y)))
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

        init: function () {
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

        update: function () {
            var chestCount = sc.map.getCurrentChestCount();
            if (chestCount != this._oldMax) {
                this._oldMax = chestCount;
                this.max.setNumber(chestCount)
            }
            chestCount = sc.stats.getMap("chests", sc.map.currentArea.path) || 0;
            if (chestCount != this._oldCount) {
                this._oldCount = chestCount;
                this.current.setNumber(Math.min(this._oldMax, chestCount))
            }
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 280, 448, 11, 11);
            renderer.addGfx(this.gfx, 33, 2, 80, 408, 8, 8)
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

        init: function () {
            this.parent();
            this.setSize(58, 11);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(12, 42);
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

        update: function () {
            var stampCount = sc.menu.getStampCount(sc.map.currentArea.path);
            if (stampCount != this._oldCount) {
                this._oldCount = stampCount;
                this.current.setNumber(Math.min(sc.MAP_STAMPS_MAX, stampCount))
            }
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 280, 460, 11, 11);
            renderer.addGfx(this.gfx, 33, 2, 80, 408, 8, 8)
        }
    });

    sc.MapFloorButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        textGui: null,
        name: "???",
        level: 0,
        alpha: 1,
        alphaTimer: 0,

        init: function (name, level) {
            this.parent(true, true);
            this.setSize(62, 34);
            this.name = name || "???";
            this.level = level || 0;
            this.keepMouseFocus = true;
            this.textGui = new sc.TextGui(this.name, {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.textGui.setPos(0, -2);
            this.addChildGui(this.textGui)
        },

        focusGained: function (focus) {
            this.parent(focus);
            if (this.focus) {
                this.alphaTimer = 0;
                this.alpha = 1
            }
        },

        onMouseInteract: function (mousePos, justActivated) {
            if (!sc.menu.mapDrag) {
                this.parent(mousePos, justActivated);
                if (!sc.menu.mapMouseOverFloorButtons && mousePos && !sc.menu.mapDrag) sc.menu.mapMouseOverFloorButtons = true
            }
        },

        update: function () {
            this.alphaTimer = (this.alphaTimer + ig.system.actualTick) % 1;
            var progress = this.alphaTimer / 1;
            progress = KEY_SPLINES.EASE_IN_OUT.get(1 - (progress > 0.5 ? 1 - (progress - 0.5) * 2 : progress * 2));
            this.alpha = 0.8 * progress + 0.2
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 314, 384 + (this.focus ? 34 : 0), 62, 34);
            this.focus ? renderer.addGfx(this.gfx, 0, 0, 376, 384, 62, 34).setAlpha(this.alpha) : this.pressed && renderer.addGfx(this.gfx, 0, 0, 376, 384, 62, 34)
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

        init: function () {
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
                this.setSize(62, 34 * this._floors.length + -8 * Math.max(0, this._floors.length - 1));
                this._createButtons(true)
            }
        },

        showMenu: function () {
            sc.menu.buttonInteract.addParallelGroup(this.buttongroup);
            this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            sc.menu.buttonInteract.removeParallelGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        centerMap: function () {
            this._selfUpdate = true;
            this._submitSound.play();
            sc.menu.selectFloor(sc.map.currentFloor)
        },

        update: function () {
            if (this._floors && !sc.menu.mapWorldmapActive && !sc.menu.mapStampMenu && !sc.menu.helpMenuOpen) {
                var floor = -1E4;
                if (this.pressed("circle-right", ig.BUTTONS.DPAD_UP, ig.BUTTONS.LEFT_SHOULDER)) {
                    floor = sc.map.currentFloor + 1;
                    if (floor > this._maxFloor) floor = this._minFloor
                } else if (this.pressed("circle-left", ig.BUTTONS.DPAD_DOWN, ig.BUTTONS.RIGHT_SHOULDER)) {
                    floor = sc.map.currentFloor - 1;
                    if (floor < this._minFloor) floor = this._maxFloor
                }
                if (floor > -1E4 && floor != sc.map.currentFloor) {
                    this._submitSound.play();
                    sc.menu.selectFloor(floor);
                    if (sc.menu.mapMapFocus) this.hoverRoom = sc.menu.mapMapFocus = null
                }
            }
        },

        pressed: function (key, gamepadButton1, gamepadButton2) {
            return ig.input.pressed(key) || ig.gamepad.isButtonPressed(gamepadButton1) || ig.gamepad.isButtonPressed(gamepadButton2)
        },

        onFloorPress: function (button) {
            if (button.level != void 0) {
                this._selfUpdate = true;
                this._submitSound.play();
                sc.menu.selectFloor(button.level || 0)
            }
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu)
                if (event == sc.MENU_EVENT.MAP_CHANGED_FLOOR)
                    if (this._selfUpdate) this._selfUpdate = false;
                    else {
                        var buttons = this.buttongroup.elements[0];
                        if (buttons)
                            for (var i = buttons.length; i--;)
                                buttons[i] && (buttons[i].level != void 0 && buttons[i].level == sc.map.currentFloor) && this.buttongroup.setPressedFocusGui(buttons[i])
                    }
            else if (event == sc.MENU_EVENT.MAP_WORLDMAP_STATE) data ? this.exitMenu() : this.showMenu();
            else if (event == sc.MENU_EVENT.MAP_AREA_LOAD_DONE) {
                this._floors = sc.map.getCurrentArea().floors;
                this.setSize(62, 34 * this._floors.length + -8 * Math.max(0, this._floors.length - 1));
                this._createButtons(true);
                this.showMenu()
            }
        },

        _createButtons: function (instant) {
            this.hook.removeAllChildren();
            this.buttongroup.clear();
            this.leaIcon.doStateTransition("HIDDEN", true);
            var floorsLeft = this._floors.length,
                yPos = 0,
                hasMap = false,
                level = 0,
                mapCount = 0,
                button = null;
            this._minFloor = 1E5;
            for (this._maxFloor = -1E5; floorsLeft--;) {
                var floorMaps = this._floors[floorsLeft].maps;
                level = this._floors[floorsLeft].level;
                mapCount = floorMaps.length;
                for (hasMap = false; mapCount--;)
                    if (ig.vars.storage.maps[floorMaps[mapCount].path.toCamel().toPath("", "")]) {
                        hasMap = true;
                        break
                    }
                if (hasMap) {
                    if (level < this._minFloor) this._minFloor = level;
                    if (level > this._maxFloor) this._maxFloor = level;
                    button = new sc.MapFloorButton(this._getFloorName(level, floorsLeft), level);
                    button.setPos(0, yPos);
                    this.buttongroup.addFocusGui(button, 0, floorsLeft);
                    if (sc.map.currentFloor == level) {
                        this.buttongroup.setPressedFocusGui(button);
                        if (sc.map.currentPlayerArea == sc.map.currentArea) {
                            this.leaIcon.setPos(45, yPos - 3);
                            this.leaIcon.doStateTransition("DEFAULT", instant || false)
                        }
                    }
                    yPos = yPos + 26;
                    floorButtonScratch.push(button)
                }
            }
            for (floorsLeft = floorButtonScratch.length; floorsLeft--;) this.addChildGui(floorButtonScratch[floorsLeft]);
            this.addChildGui(this.leaIcon);
            floorButtonScratch.length = 0
        },

        _getFloorName: function (level, index) {
            var floor = sc.map.getCurrentArea().floors[index];
            return floor && floor.handle ? ig.LangLabel.getText(floor.handle) : level == 0 ? ig.lang.get("sc.gui.menu.map-menu.gf") : level < 0 ? ig.lang.get("sc.gui.menu.map-menu.base-short") + Math.abs(level) : Math.abs(level) + ig.lang.get("sc.gui.menu.map-menu.floor-short")
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

        init: function () {
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

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this.text.setText(ig.lang.get("sc.gui.menu.map-menu.area") + sc.map.getCurrentAreaName());
            var hook = this.text.hook;
            this.setSize(hook.size.x + 6, hook.size.y + 2);
            this.setStateValue("HIDDEN", "offsetX", -(hook.size.x + 2));
            this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event, data) {
            menu == sc.menu && (event == sc.MENU_EVENT.MAP_WORLDMAP_STATE ? data ? this.exitMenu() : this.showMenu() : event == sc.MENU_EVENT.MAP_AREA_LOAD_DONE && this.showMenu())
        }
    });

    var DEBUG_COLORS = ["black", "red", "green", "blue", "yellow", "pink", "cyan", "orange", "purple", "wheat"];

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

        init: function () {
            this.parent();
            if (sc.map.getCurrentArea()) {
                this.floor = sc.map.getCurrentArea().floors;
                this.doStateTransition("HIDDEN", true)
            }
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            if (this.floor)
                for (var floorIndex = this.floor.length, tiles = null, yOffset = 0; floorIndex--;) {
                    for (var tiles = this.floor[floorIndex].tiles, row = 0; row < tiles.length; row++)
                        for (var col = 0; col < tiles[0].length; col++) tiles[row][col] && renderer.addColor(DEBUG_COLORS[tiles[row][col] % DEBUG_COLORS.length], col * 4, row * 4 + yOffset, 4, 4);
                    yOffset = yOffset + (tiles.length * 4 + 4)
                }
        }
    })
});
ig.baked = !0;
