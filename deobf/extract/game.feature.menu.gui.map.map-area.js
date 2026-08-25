ig.module("game.feature.menu.gui.map.map-area").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.map.map-floor", "game.feature.menu.gui.map.map-misc").defines(function() {
    var b = 0,
        a = 0,
        d = Vec2.createC(0, 0),
        c = sc.BUTTON_SOUND.submit,
        e = sc.BUTTON_SOUND.denied;
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
        init: function() {
            this.parent();
            b = Math.floor(ig.system.width / 2);
            a = Math.floor(ig.system.height / 2)
        },
        updateDrawables: function() {}
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
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width /
                2, ig.system.height / 2);
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
            this.buttongroup.addSelectionCallback(function(a) {
                a.data ? sc.menu.setInfoText(a.data) : a.description ? sc.menu.setInfoText(a.description) : sc.menu.setInfoText("", true)
            });
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            });
            this.buttongroup.addPressCallback(function(a) {
                this.onLandmarkPressed(a)
            }.bind(this));
            this.buttongroup.onButtonTraversal = function() {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.mapMapFocus) this.onLandmarkPressed(sc.menu.mapMapFocus)
            }.bind(this);
            this.setArea();
            this.calculateScrollingOffset(true);
            this.limitCameraPos();
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
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
                    var a = Math.min(1, Math.max(0, this._vertOffsetTimer) / this._vertOffsetTime),
                        a = KEY_SPLINES.EASE.get(a);
                    this._vertOffset = this._vertOffsetStart * (1 - a) + this._vertOffsetTarget * a;
                    if (a == 1) this._vertOffsetTimer = this._vertOffsetTime
                }
                if (!ig.interact.isBlocked() && this.buttongroup.isActive() && !sc.menu.mapStampMenu) {
                    if (this._lastDevice != ig.input.currentDevice) {
                        this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                        this._lastDevice = ig.input.currentDevice;
                        a = null;
                        if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                            a =
                                this._cursorPos;
                            this.initCursor(a);
                            sc.menu.mapCursor.x = a.x;
                            sc.menu.mapCursor.y = a.y;
                            this.limitCursorPos();
                            sc.menu.mapCamera.x = Math.floor(-a.x + ig.system.width / 2);
                            sc.menu.mapCamera.y = Math.floor(-a.y + ig.system.height / 2);
                            this.limitCameraPos();
                            this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.EASE);
                            this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y);
                            if (sc.menu.mapMapFocus) this.hoverRoom = sc.menu.mapMapFocus = null;
                            this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true)
                        } else if (ig.input.currentDevice ==
                            ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                            this._cursorPos.x = sc.menu.mapCursor.x;
                            this._cursorPos.y = sc.menu.mapCursor.y;
                            this.cursor.unfocus();
                            this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                        }
                        sc.menu.toggledInputMode()
                    }
                    a = false;
                    if (!this.hook.scrollTransition) {
                        if (sc.control.menuSkillLeft(0.5)) {
                            sc.menu.mapCamera.x = sc.menu.mapCamera.x + 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            a = true
                        } else if (sc.control.menuSkillRight(0.5)) {
                            sc.menu.mapCamera.x = sc.menu.mapCamera.x -
                                250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            a = true
                        }
                        if (sc.control.menuSkillUp(0.5)) {
                            sc.menu.mapCamera.y = sc.menu.mapCamera.y + 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.y = sc.menu.mapCamera.y;
                            a = true
                        } else if (sc.control.menuSkillDown(0.5)) {
                            sc.menu.mapCamera.y = sc.menu.mapCamera.y - 250 * ig.system.actualTick;
                            this.limitCameraPos();
                            this.hook.scroll.y = sc.menu.mapCamera.y;
                            a = true
                        }
                    }
                    if (!a && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        var b = 0,
                            c = 0,
                            e =
                            0;
                        if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                            b = (-150 + e * 100) * ig.system.actualTick;
                            a = true
                        } else if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                            b = (150 + e * 100) * ig.system.actualTick;
                            a = true
                        }
                        if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                            c = (-150 + e * 100) * ig.system.actualTick;
                            a = true
                        } else if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                            c = (150 + e * 100) * ig.system.actualTick;
                            a = true
                        }
                        if (a) {
                            sc.menu.mapCursorMoved = true;
                            sc.menu.mapCursor.x = b >= 0 ? Math.floor(sc.menu.mapCursor.x +
                                b) : Math.ceil(sc.menu.mapCursor.x + b);
                            sc.menu.mapCursor.y = c >= 0 ? Math.floor(sc.menu.mapCursor.y + c) : Math.ceil(sc.menu.mapCursor.y + c);
                            this.limitCursorPos();
                            this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
                            this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y);
                            d.x = sc.menu.mapCamera.x;
                            d.y = sc.menu.mapCamera.y;
                            sc.menu.mapCamera.x = Math.floor(-sc.menu.mapCursor.x + ig.system.width / 2);
                            sc.menu.mapCamera.y = Math.floor(-sc.menu.mapCursor.y + ig.system.height / 2);
                            this.limitCameraPos()
                        }
                        a = false;
                        if (Math.abs(sc.menu.mapCamera.x -
                                d.x) >= 18 || Math.abs(sc.menu.mapCamera.y - d.y) >= 18) a = true;
                        if (this.hook.scrollTransition) {
                            this.hook.scrollTransition.x = sc.menu.mapCamera.x;
                            this.hook.scrollTransition.y = sc.menu.mapCamera.y
                        } else if (a) this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.LINEAR);
                        else {
                            this.hook.scroll.x = sc.menu.mapCamera.x;
                            this.hook.scroll.y = sc.menu.mapCamera.y
                        }
                    }
                }
            }
        },
        updateDrawables: function(a) {
            var b = this.hook;
            if (b.hasTransition()) a.addPattern(this.constructor.PATTERN2, -512, -512, -b.scroll.x, -b.scroll.y +
                this._vertOffset, 2064, 2064);
            else {
                a.addColor("#154453", 0, 0, b.size.x, b.size.y);
                a.addGfx(this.background, 0, 0).setAlpha(0.3 * this._alpha);
                a.addGfx(this.background, b.size.x - this.background.width, 0, 0, 0, void 0, void 0, true).setAlpha(0.3 * this._alpha);
                a.addPattern(this.constructor.PATTERN, 0, 0, -b.scroll.x, -b.scroll.y + this._vertOffset, b.size.x, b.size.y)
            }
        },
        onMouseInteract: function(a, b) {
            if (!ig.interact.isBlocked() && !b && sc.map.getCurrentArea() && this.buttongroup.isActive() && !sc.menu.mapLoading && !sc.menu.mapStampMenu)
                if (sc.menu.mapMouseOverFloorButtons)
                    if (a &&
                        sc.control.getGuiPressed()) {
                        sc.menu.mapMouseOverFloorButtons = false;
                        sc.menu.unfocusMap(sc.menu.mapMapFocus);
                        this._delayedDrag = true
                    } else {
                        if (a) sc.menu.mapMouseOverFloorButtons = false;
                        else {
                            this.hoverRoom = null;
                            this.mapNameGui.setText("")
                        }
                        sc.menu.mapDrag = false
                    }
            else {
                var c = Math.floor(sc.control.getMouseX()),
                    d = Math.floor(sc.control.getMouseY());
                ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY());
                if (sc.control.getGuiPressed() || this._delayedDrag) {
                    this._delayedDrag =
                        false;
                    Vec2.assignC(this._lastMousePos, c, d);
                    sc.menu.mapDrag = true;
                    this._dragTimer = 0;
                    ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                } else if (sc.control.getGuiHold()) {
                    if (sc.menu.mapDrag) {
                        this._dragTimer = this._dragTimer + ig.system.actualTick;
                        if (!sc.menu.mapWasDragged) sc.menu.mapWasDragged = (Math.abs(c - this._lastMousePos.x) >= 1 || Math.abs(d - this._lastMousePos.y) >= 1) && this._dragTimer >= 0.1;
                        sc.menu.mapCamera.x = sc.menu.mapCamera.x + (c - this._lastMousePos.x);
                        sc.menu.mapCamera.y = sc.menu.mapCamera.y + (d - this._lastMousePos.y);
                        this.limitCameraPos();
                        this.hook.scroll.x = sc.menu.mapCamera.x;
                        this.hook.scroll.y = sc.menu.mapCamera.y;
                        Vec2.assignC(this._lastMousePos, c, d);
                        ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.control.getMouseX(), sc.control.getMouseY())
                    }
                } else sc.menu.mapDrag = false
            }
        },
        onLandmarkPressed: function(a) {
            if (sc.menu.mapWasDragged) sc.menu.mapWasDragged = false;
            else if (a instanceof sc.StampGui) {
                c.play();
                sc.menu.openStampMenu(a)
            } else if (a.activated) {
                c.play();
                var b = ig.lang.get("sc.gui.menu.map-menu.teleport"),
                    b = ig.lang.grammarReplace(b, sc.map.getMapName(a.map.path));
                sc.Dialogs.showYesNoDialog(b, null, function(b) {
                    sc.menu.mapDrag = false;
                    b.data == 0 && sc.map.startTeleport(a.map)
                }.bind(this))
            } else e.play()
        },
        findMap: function(a, b, c, d) {
            if (!sc.menu.mapMapFocus) {
                var e = 0,
                    k = 0;
                if (c) {
                    e = a - this.area.hook.pos.x;
                    k = b - this.area.hook.pos.y
                } else {
                    e = a - sc.menu.mapCamera.x - this.area.hook.pos.x + 1;
                    k = b - sc.menu.mapCamera.y - this.area.hook.pos.y + 1
                }
                if (this.area.hook.children.length != 0 && this.area.hook.children[sc.map.getCurrentFloorIndex()]) {
                    var l =
                        sc.map.getCurrentArea(),
                        o = l.floors[sc.map.getCurrentFloorIndex()].tiles,
                        e = Math.min(Math.max(Math.floor(e / 8), -1), l.width),
                        m = Math.min(Math.max(Math.floor(k / 8), -1), l.height);
                    if (e >= l.width || e <= -1 || m >= l.height || m <= -1) {
                        this.hoverRoom = null;
                        this.mapNameGui.setText("");
                        return false
                    }
                    k = false;
                    l = l.floors[sc.map.getCurrentFloorIndex()].rooms;
                    o = o[m][e];
                    for (e = l.length; e--;)
                        if (ig.vars.storage.maps[l[e].name.toCamel().toPath("", "")] && l[e].id == o) {
                            o = e;
                            k = true;
                            break
                        } if (k) {
                        o = l[o];
                        c ? this.mapNameGui.setPos(sc.menu.mapCursor.x +
                            5, sc.menu.mapCursor.y - this.mapNameGui.hook.size.y - 4) : this.mapNameGui.setPos(a - sc.menu.mapCamera.x, b - sc.menu.mapCamera.y - this.mapNameGui.hook.size.y - 1);
                        if (this.hoverRoom != o) {
                            this.hoverRoom = o;
                            this.mapNameGui.setText(o.text, d)
                        }
                        return true
                    }
                    this.hoverRoom = null;
                    this.mapNameGui.setText("");
                    return false
                }
            }
        },
        showLandmarkName: function(a) {
            a = a ? a : "???";
            sc.menu.mapMapFocus.activated || (a = "\\c[1]" + ig.lang.get("sc.gui.menu.map-menu.blocked") + "\\c[0]: " + a);
            this.mapNameGui.setText(a);
            var a = sc.menu.mapMapFocus.hook.pos.x,
                b = sc.menu.mapMapFocus.hook.pos.y,
                b = b - (this.mapNameGui.hook.size.y - 2);
            this.hoverRoom = sc.mapMapFocus;
            this.mapNameGui.setPos(a + 15 + sc.menu.mapAreaOffset.x, b + sc.menu.mapAreaOffset.y)
        },
        loadNewArea: function(a) {
            this.doStateTransition("DEFAULT");
            sc.menu.setInfoText("", true);
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            this.landmarks.length = 0;
            this.stamps.length = 0;
            var b = this._areaCache[sc.map.currentArea.path] || {
                x: -1E4,
                y: -1E4,
                cx: -1E4,
                cy: -1E4,
                floor: 0
            };
            b.x = sc.menu.mapCursor.x;
            b.y = sc.menu.mapCursor.y;
            b.cx = sc.menu.mapCamera.x;
            b.cy = sc.menu.mapCamera.y;
            b.floor = sc.map.currentFloor;
            this._areaCache[sc.map.currentArea.path] = b;
            for (var b = this.area.hook.children, c = b.length; c--;) b[c].gui.removeObservers();
            this.buttongroup.clear();
            this.area.removeAllChildren();
            this.area.doStateTransition("HIDDEN", true);
            sc.map.unloadCurrentArea();
            sc.map.loadArea(a, this)
        },
        onLoadableComplete: function(a, b) {
            sc.map.loading = false;
            if (a) {
                sc.menu.mapWasDragged = false;
                this.setArea();
                this._prevFloor = sc.map.currentFloor;
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive =
                        ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice
                }
                var c = this._areaCache[b.path];
                c ? sc.map.currentFloor = c.floor : sc.map.validateCurrentFloor();
                this.calculateScrollingOffset(true);
                this.centerCurrentPosition(true, false);
                if (c) {
                    this._cursorPos.x = c.x;
                    this._cursorPos.y = c.y;
                    sc.menu.mapCursor.x = c.x;
                    sc.menu.mapCursor.y = c.y;
                    sc.menu.mapCamera.x = c.cx;
                    sc.menu.mapCamera.y = c.cy;
                    this.limitCursorPos();
                    this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y, false);
                    this.findMap(sc.menu.mapCursor.x,
                        sc.menu.mapCursor.y, true)
                }
                this._prevFloor = sc.map.currentFloor;
                this.limitCameraPos();
                this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0, KEY_SPLINES.LINEAR);
                this.area.doStateTransition("DEFAULT");
                ig.interact.setBlockDelay(0.2);
                sc.menu.setAreaLoadDone(b.path)
            }
        },
        setArea: function() {
            var a = sc.map.getCurrentArea();
            if (a) {
                var b = this.area.hook,
                    c = this.hook,
                    d = a.floors;
                this.area.setSize(a.width * 8, a.height * 8);
                this.area.setPos(c.size.x / 2 - b.size.x / 2, c.size.y / 2 - b.size.y / 2);
                this.area.removeAllChildren();
                sc.menu.mapAreaOffset.x = b.pos.x;
                sc.menu.mapAreaOffset.y = b.pos.y;
                sc.map.validateCurrentPlayerFloor();
                for (a = 0; a < d.length; a++) {
                    b = new sc.MapFloor(d[a], this.createLandmarks.bind(this));
                    this.area.addChildGui(b)
                }
            }
        },
        createLandmarks: function(a, b) {
            if (a) {
                var c = b.floor,
                    d = c.landmarks,
                    e = sc.map.currentArea.path;
                if (d)
                    for (var k = d.length; k--;) {
                        var l = d[k].id;
                        if (sc.map.isLandmarkActive(l, e)) {
                            l = new sc.LandmarkGui(l, d[k], c.level, c.maps[d[k].map], e);
                            b.addChildGui(l);
                            this.buttongroup.addFocusGui(l);
                            this.landmarks.push(l)
                        }
                    }
                if (d =
                    sc.menu.getStamps(e))
                    for (k = d.length; k--;)
                        if (d[k] && d[k].level == c.level) {
                            l = new sc.StampGui(d[k].key, d[k].x, d[k].y, d[k].level, k, b);
                            b.addChildGui(l);
                            this.buttongroup.addFocusGui(l);
                            this.stamps.push(l)
                        }
            }
        },
        addStamp: function() {
            var a = this.getCurrentFloorGui(),
                b = sc.map.currentArea.path;
            if (sc.menu.getStampCount(b) >= sc.MAP_STAMPS_MAX) sc.BUTTON_SOUND.denied.play();
            else if (a) {
                var c = 0,
                    d = 0;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    c = sc.menu.mapCursor.x - sc.menu.mapAreaOffset.x;
                    d = sc.menu.mapCursor.y - sc.menu.mapAreaOffset.y -
                        1
                } else {
                    c = Math.floor(sc.control.getMouseX());
                    d = Math.floor(sc.control.getMouseY());
                    if (d <= 22 || d >= 298) {
                        sc.BUTTON_SOUND.denied.play();
                        return
                    }
                    c = c - (sc.menu.mapAreaOffset.x + sc.menu.mapCamera.x);
                    d = d - (sc.menu.mapAreaOffset.y + sc.menu.mapCamera.y)
                }
                if (this.isSettable(a, c, d)) {
                    sc.BUTTON_SOUND.submit.play();
                    b = sc.menu.addMapStamp(b, "DEFAULT", c, d, a.floor.level);
                    c = new sc.StampGui("DEFAULT", c, d, a.floor.level, b, a);
                    d = c.hook;
                    a.addChildGui(c);
                    this.buttongroup.addFocusGui(c);
                    this.stamps.push(c);
                    sc.menu.focusMap(d.pos.x + Math.floor(d.size.x /
                        2) + sc.menu.mapAreaOffset.x, d.pos.y + Math.floor(d.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, c, ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD);
                    sc.menu.openStampMenu(c)
                } else sc.BUTTON_SOUND.denied.play()
            }
        },
        isSettable: function(a, b, c) {
            for (var a = a.hook.children, d = a.length; d--;) {
                var e = a[d];
                if (e.gui instanceof sc.StampGui || e.gui instanceof sc.LandmarkGui)
                    if (Vec2.distanceC(b, c, e.pos.x + e.size.x / 2, e.pos.y + e.size.y / 2) <= (e.gui instanceof sc.LandmarkGui ? 14 : 10)) return false
            }
            return true
        },
        getCurrentFloorGui: function() {
            for (var a =
                    this.area.hook.children, b = a.length; b--;)
                if (a[b].gui.floor.level == sc.map.currentFloor) return a[b].gui;
            return null
        },
        centerCurrentPosition: function(a, b) {
            for (var c = this.area.hook, d = null, e = null, k = c.children, l = k.length; l--;) {
                a && k[l].gui.showFloor();
                if (k[l].gui.floor.level == sc.map.currentFloor) {
                    d = k[l];
                    e = k[l].gui.activeRoom
                }
            }
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                k = this._cursorPos;
                this.initCursor(k);
                if (e) {
                    k.x = c.pos.x + e.pos.x + e.size.x / 2;
                    k.y = c.pos.y + e.pos.y + e.size.y / 2
                } else if (d) {
                    e = d.gui.bounds;
                    k.x = c.pos.x + c.size.x / 2;
                    k.y = c.pos.y + d.pos.y + d.size.y / 2;
                    k.x = c.pos.x + e.x + e.width / 2;
                    k.y = c.pos.y + e.y + e.height / 2
                } else {
                    k.x = c.pos.x + c.size.x / 2;
                    k.y = c.pos.y + c.size.y / 2
                }
                sc.menu.mapCursor.x = k.x;
                sc.menu.mapCursor.y = k.y;
                this.cursor.moveTo(sc.menu.mapCursor.x, sc.menu.mapCursor.y, b, 0.3);
                this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true, b ? 0.2 : 0);
                ig.interact.setBlockDelay(0.3);
                sc.menu.mapCamera.x = Math.floor(-k.x + ig.system.width / 2);
                sc.menu.mapCamera.y = Math.floor(-k.y + ig.system.height / 2)
            } else if (e) {
                sc.menu.mapCamera.x = -(c.pos.x + e.pos.x + e.size.x / 2) + ig.system.width / 2;
                sc.menu.mapCamera.y = -(c.pos.y + e.pos.y + e.size.y / 2) + ig.system.height / 2
            } else if (d) {
                e = d.gui.bounds;
                sc.menu.mapCamera.x = -(c.pos.x + e.x + e.width / 2) + ig.system.width / 2;
                sc.menu.mapCamera.y = -(c.pos.y + e.y + e.height / 2) + ig.system.height / 2
            } else {
                sc.menu.mapCamera.x = -(ig.system.width / 2 - c.pos.x - c.size.x / 2);
                sc.menu.mapCamera.y = -(ig.system.height / 2 - c.pos.y - c.size.y / 2)
            }
            this.limitCameraPos()
        },
        limitCameraPos: function() {
            var c = this.area.hook,
                d = -sc.menu.mapCamera.x,
                e = c.pos.x;
            sc.menu.mapCamera.x = -d.limit(e - b, e + (c.size.x - b));
            d = -sc.menu.mapCamera.y;
            e = c.pos.y;
            sc.menu.mapCamera.y = -d.limit(e - a, e + (c.size.y - a))
        },
        limitCursorPos: function() {
            var a = sc.menu.mapCursor.x;
            sc.menu.mapCursor.x = a.limit(this.area.hook.pos.x, this.area.hook.pos.x + this.area.hook.size.x);
            var a = sc.menu.mapCursor.y,
                b = sc.menu.mapCursor.x + sc.menu.mapCamera.x;
            sc.menu.mapCursor.y = a.limit(this.area.hook.pos.y, this.area.hook.pos.y + this.area.hook.size.y - (b < 181 ? Math.min(25, 181 - b) : 0))
        },
        initCursor: function(a) {
            if (a.x <= -1E4 || a.y <= -1E4) {
                for (var b =
                        this.area.hook, c = null, d = null, e = b.children, k = e.length; k--;)
                    if (e[k].gui.floor.level == sc.map.currentFloor) {
                        c = e[k];
                        d = e[k].gui.activeRoom
                    } if (d) {
                    a.x = b.pos.x + d.pos.x + d.size.x / 2;
                    a.y = b.pos.y + d.pos.y + d.size.y / 2
                } else if (c) {
                    a.x = b.pos.x + b.size.x / 2;
                    a.y = b.pos.y + c.pos.y + c.size.y / 2
                } else {
                    a.x = b.pos.x + b.size.x / 2;
                    a.y = b.pos.y + b.size.y / 2
                }
            }
        },
        calculateScrollingOffset: function(a) {
            if (a) {
                this._vertOffsetStart = this._vertOffsetTarget = this._vertOffset = -sc.map.currentFloor * 8;
                this._vertOffsetTimer = 0.3
            } else {
                this._vertOffsetTarget = -sc.map.currentFloor * 8;
                this._vertOffsetStart = this._vertOffset;
                this._vertOffsetTimer = 0;
                this._vertOffsetTime = 0.3
            }
        },
        showMenu: function() {
            sc.menu.mapWasDragged = false;
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            if (sc.menu.mapFirstVisit)
                for (var a = this.area.hook.children, b = a.length; b--;) a[b].gui.showFloor();
            else {
                this.centerCurrentPosition(true);
                sc.menu.mapFirstVisit = true
            }
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            this._prevFloor = sc.map.currentFloor;
            this._alphaTimer = this._alphaTime;
            this._alpha =
                0;
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
            this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0, KEY_SPLINES.LINEAR);
            this.doStateTransition("DEFAULT", false, false, function() {
                this._alpha = this._alphaTimer = 0
            }.bind(this))
        },
        exitMenu: function() {
            this.hoverRoom = null;
            this.mapNameGui.setText("");
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            sc.menu.mapMapFocus = false;
            this._cursorPos.x = sc.menu.mapCursor.x;
            this._cursorPos.y = sc.menu.mapCursor.y;
            this.cursor.unfocus();
            this._alpha = 0;
            for (var a = this.area.hook.children, b = a.length; b--;) a[b].gui.hideFloor();
            this.doStateTransition("HIDDEN")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.cursor.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.cursor.removeObservers()
        },
        modelChanged: function(a,
            b, c) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.MAP_CHANGED_FLOOR)
                    if (this._prevFloor == sc.map.currentFloor) {
                        this.centerCurrentPosition(false, true);
                        this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.3, KEY_SPLINES.EASE)
                    } else {
                        this.calculateScrollingOffset(false);
                        ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.findMap(sc.menu.mapCursor.x, sc.menu.mapCursor.y, true);
                        this._prevFloor = sc.map.currentFloor
                    }
            else if (b == sc.MENU_EVENT.MAP_WORLDMAP_STATE)
                if (c) {
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
            else if (b == sc.MENU_EVENT.MAP_AREA_LOAD) this.loadNewArea(c);
            else if (b == sc.MENU_EVENT.MAP_AREA_LOAD_DONE) {
                this.cursor.focus =
                    false;
                this.cursor._ignoreModel = false
            } else if (b == sc.MENU_EVENT.MAP_FOCUS_MAP) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    sc.menu.mapCamera.x = Math.floor(-sc.menu.mapCursor.x + ig.system.width / 2);
                    sc.menu.mapCamera.y = Math.floor(-sc.menu.mapCursor.y + ig.system.height / 2);
                    this.limitCameraPos();
                    this.doScrollTransition(sc.menu.mapCamera.x, sc.menu.mapCamera.y, 0.2, KEY_SPLINES.LINEAR)
                }
                sc.menu.setInfoText(sc.menu.mapMapFocus.description);
                this.showLandmarkName(sc.menu.mapMapFocus.name)
            } else b == sc.MENU_EVENT.MAP_UNFOCUS ?
                sc.menu.setInfoText("", true) : b == sc.MENU_EVENT.MAP_UPDATE_STAMP && this.showLandmarkName(sc.menu.mapMapFocus.name)
        }
    })
});
ig.baked = !0;
