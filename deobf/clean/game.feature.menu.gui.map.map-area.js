/**
 * game.feature.menu.gui.map.map-area
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.map.map-area")`.
 *
 * `sc.MapArea`: a thin GUI element that just caches half the screen size.
 * `sc.MapAreaContainer`: the interactive area map — renders the current area's
 * floors as `sc.MapFloor` children, handles pan/drag and gamepad cursor input,
 * mouse landmark/stamp placement, area switching via `sc.map.loadArea`, camera
 * and cursor limiting, floor transitions and the map name tooltip.
 */
ig.module("game.feature.menu.gui.map.map-area")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.map.map-floor", "game.feature.menu.gui.map.map-misc")
    .defines(function () {

    var halfWidth = 0,
        halfHeight = 0,
        cameraScratch = Vec2.createC(0, 0),
        submitSound = sc.BUTTON_SOUND.submit,
        deniedSound = sc.BUTTON_SOUND.denied;

    sc.MapArea = ig.GuiElementBase.extend({
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

        init: function () {
            this.parent();
            halfWidth = Math.floor(ig.system.width / 2);
            halfHeight = Math.floor(ig.system.height / 2)
        },

        updateDrawables: function () {}
    });

    sc.MapAreaContainer = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        background: new ig.Image("media/gui/env-white.png"),
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
            },
            HIDDEN_WORLD: {
                state: {
                    alpha: 1,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    angle: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        area: null,
        buttongroup: null,
        _lastMousePos: Vec2.createC(0, 0),
        _cursorPos: Vec2.createC(-1E4, -1E4),
        _dragTimer: 0,
        _delayedDrag: false,
        _alphaTimer: 0.1,
        _alphaTime: 0.5,
        _alpha: 0,
        _firstVisit: false,
        _prevFloor: -100,
        _vertOffset: 0,
        _vertOffsetTarget: 0,
        _vertOffsetStart: 0,
        _vertOffsetCurrent: 0,
        _vertOffsetTimer: 0,
        _vertOffsetTime: 0.3,
        _areaCache: {},
        _gamepadActive: false,
        _lastDevice: 0,
        mapNameGui: null,
        hoverRoom: null,
        cursor: null,
        landmarks: [],
        stamps: [],

        init: function () {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            if (!this.constructor.PATTERN) {
                this.constructor.PATTERN = this.gfx.createPattern(440, 400, 32, 32, ig.ImagePattern.OPT.REPEAT_X_AND_Y);
                this.constructor.PATTERN2 = this.gfx.createPattern(472, 400, 32, 32, ig.ImagePattern.OPT.REPEAT_X_AND_Y)
            }
            this.hook.setMouseRecord(true);
            this.area = new sc.MapArea;
            this.addChildGui(this.area);
            this.cursor = new sc.MapCursor;
            this.addChildGui(this.cursor);
            this.mapNameGui = new sc.MapNameGui;
            this.addChildGui(this.mapNameGui);
            this.buttongroup = new sc.MouseButtonGroup;
            this.buttongroup.ignoreActiveFocus = true;
            this.buttongroup.addSelectionCallback(function (button) {
                button.data ? sc.menu.setInfoText(button.data) : button.description ? sc.menu.setInfoText(button.description) : sc.menu.setInfoText("", true)
            });
            this.buttongroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            this.buttongroup.addPressCallback(function (button) {
                this.onLandmarkPressed(button)
            }.bind(this));
            this.buttongroup.onButtonTraversal = function () {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.mapMapFocus) this.onLandmarkPressed(sc.menu.mapMapFocus)
            }.bind(this);
            this.setArea();
            this.calculateScrollingOffset(true);
            this.limitCameraPos();
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            sc.menu.mapCursorMoved = false;
            if (this._alphaTimer < this._alphaTime) {
                this._alphaTimer = this._alphaTimer + ig.system.tick;
                if (this._alphaTimer >= this._alphaTime) {
                    this._alphaTimer = this._alphaTime;
                    this._alpha = 1
                } else this._alpha = this._alphaTimer / this._alphaTime
            }
            if (!sc.menu.mapLoading) {
                if (this._vertOffsetTimer < this._vertOffsetTime) {
                    this._vertOffsetTimer = this._vertOffsetTimer + ig.system.tick;
                    var progress = Math.min(1, Math.max(0, this._vertOffsetTimer) / this._vertOffsetTime);
                    progress = KEY_SPLINES.EASE.get(progress);
                    this._vertOffset = this._vertOffsetStart * (1 - progress) + this._vertOffsetTarget * progress;
                    if (progress == 1) this._vertOffsetTimer = this._vertOffsetTime
                }
                if (!ig.interact.isBlocked() && this.buttongroup.isActive() && !sc.menu.mapStampMenu) {
                    if (this._lastDevice != ig.input.currentDevice) {
                        this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                        this._lastDevice = ig.input.currentDevice;
                        var moved = null;
                        if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                            moved = this._cursorPos;
                            this.initCursor(moved);
                            sc.menu.mapCursor.x = moved.x;
                            sc.menu.mapCursor.y = moved.y;
                            this.limitCursorPos();
                            sc.menu.mapCamera.x = Math.floor(-moved.x + ig.system.width / 2);
                            sc.menu.mapCamera.y = Math.floor(-moved.y + ig.system.height / 2);
                            this.limitCameraPos();
                            this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.EASE);
                            this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y);
                            if (sc.menu.mapMapFocus) this.hoverRoom = sc.menu.mapMapFocus = null;
                            this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true)
                        } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                            this._cursorPos.x = sc.menu.mapCursor.x;
                            this._cursorPos.y = sc.menu.mapCursor.y;
                            this.cursor.unfocus();
                            this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                        }
                        sc.menu.toggledInputMode()
                    }
                    moved = false;
                    if (!this.hook.scrollTransition) {
                        if (sc.control.menuSkillLeft(0.5)) {
                            sc.menu.mapCamera.x = sc.menu.mapCamera.x + 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            moved = true
                        } else if (sc.control.menuSkillRight(0.5)) {
                            sc.menu.mapCamera.x = sc.menu.mapCamera.x - 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            moved = true
                        }
                        if (sc.control.menuSkillUp(0.5)) {
                            sc.menu.mapCamera.y = sc.menu.mapCamera.y + 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.y = sc.menu.mapCamera.y;
                            moved = true
                        } else if (sc.control.menuSkillDown(0.5)) {
                            sc.menu.mapCamera.y = sc.menu.mapCamera.y - 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.y = sc.menu.mapCamera.y;
                            moved = true
                        }
                    }
                    if (!moved && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        var stickX = 0,
                            stickY = 0,
                            axisValue = 0;
                        if ((axisValue = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                            stickX = (-150 + axisValue * 100) * ig.system.actualTick;
                            moved = true
                        } else if ((axisValue = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                            stickX = (150 + axisValue * 100) * ig.system.actualTick;
                            moved = true
                        }
                        if ((axisValue = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                            stickY = (-150 + axisValue * 100) * ig.system.actualTick;
                            moved = true
                        } else if ((axisValue = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                            stickY = (150 + axisValue * 100) * ig.system.actualTick;
                            moved = true
                        }
                        if (moved) {
                            sc.menu.mapCursorMoved = true;
                            sc.menu.mapCursor.x = stickX >= 0 ? Math.floor(sc.menu.mapCursor.x + stickX) : Math.ceil(sc.menu.mapCursor.x + stickX);
                            sc.menu.mapCursor.y = stickY >= 0 ? Math.floor(sc.menu.mapCursor.y + stickY) : Math.ceil(sc.menu.mapCursor.y + stickY);
                            this.limitCursorPos();
                            this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
                            this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y);
                            cameraScratch.x = sc.menu.mapCamera.x;
                            cameraScratch.y = sc.menu.mapCamera.y;
                            sc.menu.mapCamera.x = Math.floor(-sc.menu.mapCursor.x + ig.system.width / 2);
                            sc.menu.mapCamera.y = Math.floor(-sc.menu.mapCursor.y + ig.system.height / 2);
                            this.limitCameraPos()
                        }
                        moved = false;
                        if (Math.abs(sc.menu.mapCamera.x - cameraScratch.x) >= 18 || Math.abs(sc.menu.mapCamera.y - cameraScratch.y) >= 18) moved = true;
                        if (this.hook.scrollTransition) {
                            this.hook.scrollTransition.x = sc.menu.mapCamera.x;
                            this.hook.scrollTransition.y = sc.menu.mapCamera.y
                        } else if (moved) this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.LINEAR);
                        else {
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            this.hook.scroll.y = sc.menu.mapCamera.y
                        }
                    }
                }
            }
        },

        updateDrawables: function (renderer) {
            var hook = this.hook;
            if (hook.hasTransition()) renderer.addPattern(this.constructor.PATTERN2, -512, -512, -hook.scroll.x, -hook.scroll.y + this._vertOffset, 2064, 2064);
            else {
                renderer.addColor("#154453", 0, 0, hook.size.x, hook.size.y);
                renderer.addGfx(this.background, 0, 0).setAlpha(0.3 * this._alpha);
                renderer.addGfx(this.background, hook.size.x - this.background.width, 0, 0, 0, void 0, void 0, true).setAlpha(0.3 * this._alpha);
                renderer.addPattern(this.constructor.PATTERN, 0, 0, -hook.scroll.x, -hook.scroll.y + this._vertOffset, hook.size.x, hook.size.y)
            }
        },

        onMouseInteract: function (mousePos, justActivated) {
            if (!ig.interact.isBlocked() && !justActivated && sc.map.getCurrentArea() && this.buttongroup.isActive() && !sc.menu.mapLoading && !sc.menu.mapStampMenu)
                if (sc.menu.mapMouseOverFloorButtons)
                    if (mousePos && sc.control.getGuiPressed()) {
                        sc.menu.mapMouseOverFloorButtons = false;
                        sc.menu.unfocusMap(sc.menu.mapMapFocus);
                        this._delayedDrag = true
                    } else {
                        if (mousePos) sc.menu.mapMouseOverFloorButtons = false;
                        else {
                            this.hoverRoom = null;
                            this.mapNameGui.setText("")
                        }
                        sc.menu.mapDrag = false
                    }
            else {
                var mouseX = Math.floor(sc.control.getMouseX()),
                    mouseY = Math.floor(sc.control.getMouseY());
                ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY());
                if (sc.control.getGuiPressed() || this._delayedDrag) {
                    this._delayedDrag = false;
                    Vec2.assignC(this._lastMousePos, mouseX, mouseY);
                    sc.menu.mapDrag = true;
                    this._dragTimer = 0;
                    ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                } else if (sc.control.getGuiHold()) {
                    if (sc.menu.mapDrag) {
                        this._dragTimer = this._dragTimer + ig.system.actualTick;
                        if (!sc.menu.mapWasDragged) sc.menu.mapWasDragged = (Math.abs(mouseX - this._lastMousePos.x) >= 1 || Math.abs(mouseY - this._lastMousePos.y) >= 1) && this._dragTimer >= 0.1;
                        sc.menu.mapCamera.x = sc.menu.mapCamera.x + (mouseX - this._lastMousePos.x);
                        sc.menu.mapCamera.y = sc.menu.mapCamera.y + (mouseY - this._lastMousePos.y);
                        this.limitCameraPos();
                        this.hook.scroll.x = sc.menu.mapCamera.x;
                        this.hook.scroll.y = sc.menu.mapCamera.y;
                        Vec2.assignC(this._lastMousePos, mouseX, mouseY);
                        ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                    }
                } else sc.menu.mapDrag = false
            }
        },

        onLandmarkPressed: function (button) {
            if (sc.menu.mapWasDragged) sc.menu.mapWasDragged = false;
            else if (button instanceof sc.StampGui) {
                submitSound.play();
                sc.menu.openStampMenu(button)
            } else if (button.activated) {
                submitSound.play();
                var message = ig.lang.get("sc.gui.menu.map-menu.teleport");
                message = ig.lang.grammarReplace(message, sc.map.getMapName(button.map.path));
                sc.Dialogs.showYesNoDialog(message, null, function (result) {
                    sc.menu.mapDrag = false;
                    result.data == 0 && sc.map.startTeleport(button.map)
                }.bind(this))
            } else deniedSound.play()
        },

        findMap: function (mouseX, mouseY, isCursor, fadeIn) {
            if (!sc.menu.mapMapFocus) {
                var tileX = 0,
                    tileY = 0;
                if (isCursor) {
                    tileX = mouseX - this.area.hook.pos.x;
                    tileY = mouseY - this.area.hook.pos.y
                } else {
                    tileX = mouseX - sc.menu.mapCamera.x - this.area.hook.pos.x + 1;
                    tileY = mouseY - sc.menu.mapCamera.y - this.area.hook.pos.y + 1
                }
                if (this.area.hook.children.length != 0 && this.area.hook.children[sc.map.getCurrentFloorIndex()]) {
                    var area = sc.map.getCurrentArea(),
                        roomId = area.floors[sc.map.getCurrentFloorIndex()].tiles;
                    tileX = Math.min(Math.max(Math.floor(tileX / 8), -1), area.width);
                    tileY = Math.min(Math.max(Math.floor(tileY / 8), -1), area.height);
                    if (tileX >= area.width || tileX <= -1 || tileY >= area.height || tileY <= -1) {
                        this.hoverRoom = null;
                        this.mapNameGui.setText("");
                        return false
                    }
                    var found = false;
                    var rooms = area.floors[sc.map.getCurrentFloorIndex()].rooms;
                    roomId = roomId[tileY][tileX];
                    for (tileX = rooms.length; tileX--;)
                        if (ig.vars.storage.maps[rooms[tileX].name.toCamel().toPath("", "")] && rooms[tileX].id == roomId) {
                            roomId = tileX;
                            found = true;
                            break
                        }
                    if (found) {
                        var room = rooms[roomId];
                        isCursor ? this.mapNameGui.setPos(sc.menu.mapCursor.x + 5, sc.menu.mapCursor.y - this.mapNameGui.hook.size.y - 4) : this.mapNameGui.setPos(mouseX - sc.menu.mapCamera.x, mouseY - sc.menu.mapCamera.y - this.mapNameGui.hook.size.y - 1);
                        if (this.hoverRoom != room) {
                            this.hoverRoom = room;
                            this.mapNameGui.setText(room.text, fadeIn)
                        }
                        return true
                    }
                    this.hoverRoom = null;
                    this.mapNameGui.setText("");
                    return false
                }
            }
        },

        showLandmarkName: function (name) {
            name = name ? name : "???";
            sc.menu.mapMapFocus.activated || (name = "\\c[1]" + ig.lang.get("sc.gui.menu.map-menu.blocked") + "\\c[0]: " + name);
            this.mapNameGui.setText(name);
            var posX = sc.menu.mapMapFocus.hook.pos.x,
                posY = sc.menu.mapMapFocus.hook.pos.y;
            posY = posY - (this.mapNameGui.hook.size.y - 2);
            this.hoverRoom = sc.mapMapFocus;
            this.mapNameGui.setPos(posX + 15 + sc.menu.mapAreaOffset.x, posY + sc.menu.mapAreaOffset.y)
        },

        loadNewArea: function (area) {
            this.doStateTransition("DEFAULT");
            sc.menu.setInfoText("", true);
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            this.landmarks.length = 0;
            this.stamps.length = 0;
            var cache = this._areaCache[sc.map.currentArea.path] || {
                x: -1E4,
                y: -1E4,
                cx: -1E4,
                cy: -1E4,
                floor: 0
            };
            cache.x = sc.menu.mapCursor.x;
            cache.y = sc.menu.mapCursor.y;
            cache.cx = sc.menu.mapCamera.x;
            cache.cy = sc.menu.mapCamera.y;
            cache.floor = sc.map.currentFloor;
            this._areaCache[sc.map.currentArea.path] = cache;
            for (var children = this.area.hook.children, i = children.length; i--;) children[i].gui.removeObservers();
            this.buttongroup.clear();
            this.area.removeAllChildren();
            this.area.doStateTransition("HIDDEN", true);
            sc.map.unloadCurrentArea();
            sc.map.loadArea(area, this)
        },

        onLoadableComplete: function (success, area) {
            sc.map.loading = false;
            if (success) {
                sc.menu.mapWasDragged = false;
                this.setArea();
                this._prevFloor = sc.map.currentFloor;
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice
                }
                var cache = this._areaCache[area.path];
                cache ? sc.map.currentFloor = cache.floor : sc.map.validateCurrentFloor();
                this.calculateScrollingOffset(true);
                this.centerCurrentPosition(true, false);
                if (cache) {
                    this._cursorPos.x = cache.x;
                    this._cursorPos.y = cache.y;
                    sc.menu.mapCursor.x = cache.x;
                    sc.menu.mapCursor.y = cache.y;
                    sc.menu.mapCamera.x = cache.cx;
                    sc.menu.mapCamera.y = cache.cy;
                    this.limitCursorPos();
                    this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y, false);
                    this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true)
                }
                this._prevFloor = sc.map.currentFloor;
                this.limitCameraPos();
                this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0, KEY_SPLINES.LINEAR);
                this.area.doStateTransition("DEFAULT");
                ig.interact.setBlockDelay(0.2);
                sc.menu.setAreaLoadDone(area.path)
            }
        },

        setArea: function () {
            var area = sc.map.getCurrentArea();
            if (area) {
                var hook = this.area.hook,
                    containerHook = this.hook,
                    floors = area.floors;
                this.area.setSize(area.width * 8, area.height * 8);
                this.area.setPos(containerHook.size.x / 2 - hook.size.x / 2, containerHook.size.y / 2 - hook.size.y / 2);
                this.area.removeAllChildren();
                sc.menu.mapAreaOffset.x = hook.pos.x;
                sc.menu.mapAreaOffset.y = hook.pos.y;
                sc.map.validateCurrentPlayerFloor();
                for (var i = 0; i < floors.length; i++) {
                    var floor = new sc.MapFloor(floors[i], this.createLandmarks.bind(this));
                    this.area.addChildGui(floor)
                }
            }
        },

        createLandmarks: function (success, floorGui) {
            if (success) {
                var floor = floorGui.floor,
                    landmarks = floor.landmarks,
                    areaPath = sc.map.currentArea.path;
                if (landmarks)
                    for (var i = landmarks.length; i--;) {
                        var landmarkId = landmarks[i].id;
                        if (sc.map.isLandmarkActive(landmarkId, areaPath)) {
                            var landmark = new sc.LandmarkGui(landmarkId, landmarks[i], floor.level, floor.maps[landmarks[i].map], areaPath);
                            floorGui.addChildGui(landmark);
                            this.buttongroup.addFocusGui(landmark);
                            this.landmarks.push(landmark)
                        }
                    }
                if (landmarks = sc.menu.getStamps(areaPath))
                    for (i = landmarks.length; i--;)
                        if (landmarks[i] && landmarks[i].level == floor.level) {
                            var stamp = new sc.StampGui(landmarks[i].key, landmarks[i].x, landmarks[i].y, landmarks[i].level, i, floorGui);
                            floorGui.addChildGui(stamp);
                            this.buttongroup.addFocusGui(stamp);
                            this.stamps.push(stamp)
                        }
            }
        },

        addStamp: function () {
            var floorGui = this.getCurrentFloorGui(),
                areaPath = sc.map.currentArea.path;
            if (sc.menu.getStampCount(areaPath) >= sc.MAP_STAMPS_MAX) sc.BUTTON_SOUND.denied.play();
            else if (floorGui) {
                var stampX = 0,
                    stampY = 0;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    stampX = sc.menu.mapCursor.x - sc.menu.mapAreaOffset.x;
                    stampY = sc.menu.mapCursor.y - sc.menu.mapAreaOffset.y - 1
                } else {
                    stampX = Math.floor(sc.control.getMouseX());
                    stampY = Math.floor(sc.control.getMouseY());
                    if (stampY <= 22 || stampY >= 298) {
                        sc.BUTTON_SOUND.denied.play();
                        return
                    }
                    stampX = stampX - (sc.menu.mapAreaOffset.x + sc.menu.mapCamera.x);
                    stampY = stampY - (sc.menu.mapAreaOffset.y + sc.menu.mapCamera.y)
                }
                if (this.isSettable(floorGui, stampX, stampY)) {
                    sc.BUTTON_SOUND.submit.play();
                    var index = sc.menu.addMapStamp(areaPath, "DEFAULT", stampX, stampY, floorGui.floor.level);
                    var stamp = new sc.StampGui("DEFAULT", stampX, stampY, floorGui.floor.level, index, floorGui);
                    var stampHook = stamp.hook;
                    floorGui.addChildGui(stamp);
                    this.buttongroup.addFocusGui(stamp);
                    this.stamps.push(stamp);
                    sc.menu.focusMap(stampHook.pos.x + Math.floor(stampHook.size.x / 2) + sc.menu.mapAreaOffset.x, stampHook.pos.y + Math.floor(stampHook.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, stamp, ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD);
                    sc.menu.openStampMenu(stamp)
                } else sc.BUTTON_SOUND.denied.play()
            }
        },

        isSettable: function (floorGui, x, y) {
            for (var children = floorGui.hook.children, i = children.length; i--;) {
                var child = children[i];
                if (child.gui instanceof sc.StampGui || child.gui instanceof sc.LandmarkGui)
                    if (Vec2.distanceC(x, y, child.pos.x + child.size.x / 2, child.pos.y + child.size.y / 2) <= (child.gui instanceof sc.LandmarkGui ? 14 : 10)) return false
            }
            return true
        },

        getCurrentFloorGui: function () {
            for (var children = this.area.hook.children, i = children.length; i--;)
                if (children[i].gui.floor.level == sc.map.currentFloor) return children[i].gui;
            return null
        },

        centerCurrentPosition: function (showFloors, moveCursor) {
            for (var areaHook = this.area.hook, floorChild = null, activeRoom = null, children = areaHook.children, i = children.length; i--;) {
                showFloors && children[i].gui.showFloor();
                if (children[i].gui.floor.level == sc.map.currentFloor) {
                    floorChild = children[i];
                    activeRoom = children[i].gui.activeRoom
                }
            }
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                var cursorPos = this._cursorPos;
                this.initCursor(cursorPos);
                if (activeRoom) {
                    cursorPos.x = areaHook.pos.x + activeRoom.pos.x + activeRoom.size.x / 2;
                    cursorPos.y = areaHook.pos.y + activeRoom.pos.y + activeRoom.size.y / 2
                } else if (floorChild) {
                    var bounds = floorChild.gui.bounds;
                    cursorPos.x = areaHook.pos.x + bounds.x + bounds.width / 2;
                    cursorPos.y = areaHook.pos.y + bounds.y + bounds.height / 2
                } else {
                    cursorPos.x = areaHook.pos.x + areaHook.size.x / 2;
                    cursorPos.y = areaHook.pos.y + areaHook.size.y / 2
                }
                sc.menu.mapCursor.x = cursorPos.x;
                sc.menu.mapCursor.y = cursorPos.y;
                this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y, moveCursor, 0.3);
                this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true, moveCursor ? 0.2 : 0);
                ig.interact.setBlockDelay(0.3);
                sc.menu.mapCamera.x = Math.floor(-cursorPos.x + ig.system.width / 2);
                sc.menu.mapCamera.y = Math.floor(-cursorPos.y + ig.system.height / 2)
            } else if (activeRoom) {
                sc.menu.mapCamera.x = -(areaHook.pos.x + activeRoom.pos.x + activeRoom.size.x / 2) + ig.system.width / 2;
                sc.menu.mapCamera.y = -(areaHook.pos.y + activeRoom.pos.y + activeRoom.size.y / 2) + ig.system.height / 2
            } else if (floorChild) {
                var floorBounds = floorChild.gui.bounds;
                sc.menu.mapCamera.x = -(areaHook.pos.x + floorBounds.x + floorBounds.width / 2) + ig.system.width / 2;
                sc.menu.mapCamera.y = -(areaHook.pos.y + floorBounds.y + floorBounds.height / 2) + ig.system.height / 2
            } else {
                sc.menu.mapCamera.x = -(ig.system.width / 2 - areaHook.pos.x - areaHook.size.x / 2);
                sc.menu.mapCamera.y = -(ig.system.height / 2 - areaHook.pos.y - areaHook.size.y / 2)
            }
            this.limitCameraPos()
        },

        limitCameraPos: function () {
            var areaHook = this.area.hook,
                cameraX = -sc.menu.mapCamera.x,
                areaX = areaHook.pos.x;
            sc.menu.mapCamera.x = -cameraX.limit(areaX - halfWidth, areaX + (areaHook.size.x - halfWidth));
            cameraX = -sc.menu.mapCamera.y;
            areaX = areaHook.pos.y;
            sc.menu.mapCamera.y = -cameraX.limit(areaX - halfHeight, areaX + (areaHook.size.y - halfHeight))
        },

        limitCursorPos: function () {
            var cursorX = sc.menu.mapCursor.x;
            sc.menu.mapCursor.x = cursorX.limit(this.area.hook.pos.x, this.area.hook.pos.x + this.area.hook.size.x);
            var cursorY = sc.menu.mapCursor.y,
                cameraX = sc.menu.mapCursor.x + sc.menu.mapCamera.x;
            sc.menu.mapCursor.y = cursorY.limit(this.area.hook.pos.y, this.area.hook.pos.y + this.area.hook.size.y - (cameraX < 181 ? Math.min(25, 181 - cameraX) : 0))
        },

        initCursor: function (cursorPos) {
            if (cursorPos.x <= -1E4 || cursorPos.y <= -1E4) {
                for (var areaHook = this.area.hook, floorChild = null, activeRoom = null, children = areaHook.children, i = children.length; i--;)
                    if (children[i].gui.floor.level == sc.map.currentFloor) {
                        floorChild = children[i];
                        activeRoom = children[i].gui.activeRoom
                    }
                if (activeRoom) {
                    cursorPos.x = areaHook.pos.x + activeRoom.pos.x + activeRoom.size.x / 2;
                    cursorPos.y = areaHook.pos.y + activeRoom.pos.y + activeRoom.size.y / 2
                } else if (floorChild) {
                    cursorPos.x = areaHook.pos.x + areaHook.size.x / 2;
                    cursorPos.y = areaHook.pos.y + floorChild.pos.y + floorChild.size.y / 2
                } else {
                    cursorPos.x = areaHook.pos.x + areaHook.size.x / 2;
                    cursorPos.y = areaHook.pos.y + areaHook.size.y / 2
                }
            }
        },

        calculateScrollingOffset: function (instant) {
            if (instant) {
                this._vertOffsetStart = this._vertOffsetTarget = this._vertOffset = -sc.map.currentFloor * 8;
                this._vertOffsetTimer = 0.3
            } else {
                this._vertOffsetTarget = -sc.map.currentFloor * 8;
                this._vertOffsetStart = this._vertOffset;
                this._vertOffsetTimer = 0;
                this._vertOffsetTime = 0.3
            }
        },

        showMenu: function () {
            sc.menu.mapWasDragged = false;
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            if (sc.menu.mapFirstVisit)
                for (var children = this.area.hook.children, i = children.length; i--;) children[i].gui.showFloor();
            else {
                this.centerCurrentPosition(true);
                sc.menu.mapFirstVisit = true
            }
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            this._prevFloor = sc.map.currentFloor;
            this._alphaTimer = this._alphaTime;
            this._alpha = 0;
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
            this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0, KEY_SPLINES.LINEAR);
            this.doStateTransition("DEFAULT", false, false, function () {
                this._alpha = this._alphaTimer = 0
            }.bind(this))
        },

        exitMenu: function () {
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            sc.menu.mapMapFocus = false;
            this._cursorPos.x = sc.menu.mapCursor.x;
            this._cursorPos.y = sc.menu.mapCursor.y;
            this.cursor.unfocus();
            this._alpha = 0;
            for (var children = this.area.hook.children, i = children.length; i--;) children[i].gui.hideFloor();
            this.doStateTransition("HIDDEN")
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            this.cursor.addObservers()
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            this.cursor.removeObservers()
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu)
                if (event == sc.MENU_EVENT.MAP_CHANGED_FLOOR)
                    if (this._prevFloor == sc.map.currentFloor) {
                        this.centerCurrentPosition(false, true);
                        this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.EASE)
                    } else {
                        this.calculateScrollingOffset(false);
                        ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
                        this._prevFloor = sc.map.currentFloor
                    }
            else if (event == sc.MENU_EVENT.MAP_WORLDMAP_STATE)
                if (data) {
                    this.hoverRoom = null;
                    this.mapNameGui.setText("");
                    this.doStateTransition("HIDDEN_WORLD");
                    this.cursor._ignoreModel = true
                } else {
                    this.cursor.focus = false;
                    this.cursor._ignoreModel = false;
                    ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.initCursor(this._cursorPos);
                    this.doStateTransition("DEFAULT");
                    ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true) : this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                }
            else if (event == sc.MENU_EVENT.MAP_AREA_LOAD) this.loadNewArea(data);
            else if (event == sc.MENU_EVENT.MAP_AREA_LOAD_DONE) {
                this.cursor.focus = false;
                this.cursor._ignoreModel = false
            } else if (event == sc.MENU_EVENT.MAP_FOCUS_MAP) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    sc.menu.mapCamera.x = Math.floor(-sc.menu.mapCursor.x + ig.system.width / 2);
                    sc.menu.mapCamera.y = Math.floor(-sc.menu.mapCursor.y + ig.system.height / 2);
                    this.limitCameraPos();
                    this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.2, KEY_SPLINES.LINEAR)
                }
                sc.menu.setInfoText(sc.menu.mapMapFocus.description);
                this.showLandmarkName(sc.menu.mapMapFocus.name)
            } else event == sc.MENU_EVENT.MAP_UNFOCUS ?
                sc.menu.setInfoText("", true) : event == sc.MENU_EVENT.MAP_UPDATE_STAMP && this.showLandmarkName(sc.menu.mapMapFocus.name)
        }
    })
});
ig.baked = !0;
