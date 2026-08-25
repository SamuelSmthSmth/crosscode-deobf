ig.module("game.feature.menu.gui.map.map-worldmap").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.map.map-misc").defines(function() {
    Vec2.createC(0, 0);
    var b = sc.BUTTON_SOUND.submit,
        a = {
            beach: {
                x: 227,
                y: 262,
                w: 29,
                h: 22,
                sx: 0,
                sy: 0
            },
            "final-dng": {
                x: 45,
                y: 74,
                w: 31,
                h: 51,
                sx: 58,
                sy: 0
            }
        };
    sc.AreaButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        key: null,
        area: null,
        icon: 1,
        activeArea: false,
        focusCount: 0,
        description: "",
        init: function(a, b) {
            this.parent(true, false);
            this.setSize(16, 16);
            this.setPivot(8, 8);
            this.key = a;
            this.area = b;
            this.description = new ig.LangLabel(this.area.description || "");
            if (this.area) {
                this.activeArea = a == sc.map.currentPlayerArea.path;
                this.icon = sc.AREA_TYPE[this.area.areaType] * 8
            }
        },
        onButtonPress: function() {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var a = Math.floor(sc.control.getMouseY());
                if (a <= 21 || a >= 299) return
            }
            b.play();
            sc.menu.loadArea(this.key)
        },
        updateDrawables: function(a) {
            this.focus && a.addGfx(this.gfx, -3, -2, 421, 173, 21, 21).setCompositionMode("lighter");
            a.addGfx(this.gfx, 4, 4, 328 + this.icon, 456 + (this.activeArea ? 8 : 0), 8, 8);
            if (this.activeArea) {
                a.addGfx(this.gfx, 1, 2, 304, 440, 3, 3);
                a.addGfx(this.gfx, -11, -8, 280, 424, 16, 11)
            }
        },
        isMouseOver: function() {
            if (sc.menu.mapWorldmapActive && !ig.interact.isBlocked()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var a = this.getDistanceToCursor();
                    if (sc.menu.mapWmCursorMoved) {
                        sc.menu.unfocusArea(this);
                        return false
                    }
                    if (a <= 10) {
                        a = this.hook;
                        sc.menu.focusArea(a.pos.x + Math.floor(a.size.x / 2) - 1, a.pos.y + Math.floor(a.size.y / 2) +
                            1, this, true);
                        return true
                    }
                    sc.menu.unfocusArea(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var b = Math.floor(sc.control.getMouseX()),
                        e = Math.floor(sc.control.getMouseY()),
                        a = this.hook;
                    (b = b >= a.pos.x && b <= a.pos.x + a.size.x && e >= a.pos.y && e <= a.pos.y + a.size.y) ? sc.menu.focusArea(a.pos.x + Math.floor(a.size.x / 2) - 1, a.pos.y + Math.floor(a.size.y / 2) + 1, this): sc.menu.unfocusArea(this);
                    return b
                }
                return false
            }
        },
        getDistanceToCursor: function() {
            return Math.floor(Vec2.distanceC(sc.menu.mapWorldCursor.x,
                sc.menu.mapWorldCursor.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    });
    sc.WorldMapExtra = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/world-map-extra.png"),
        timer: 0,
        image: null,
        overlay: null,
        init: function(b, c) {
            this.parent();
            var e = a[b];
            this.setSize(e.w, e.h);
            this.setPos(e.x, e.y);
            this.image = new ig.ImageGui(this.gfx, e.sx, e.sy, e.w, e.h);
            this.image.hook.transitions = {
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
            this.addChildGui(this.image);
            if (c) {
                this.overlay = new ig.ImageGui(this.gfx, e.sx + e.w, e.sy, e.w, e.h);
                this.overlay.renderMode = "lighter";
                this.overlay.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.3,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0
                        },
                        time: 0.5,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.addChildGui(this.overlay);
                this.image.doStateTransition("HIDDEN", true);
                this.overlay.doStateTransition("HIDDEN", true);
                this.overlay.doStateTransition("DEFAULT", false, false,
                    function() {
                        this.image.doStateTransition("DEFAULT", true);
                        this.overlay.doStateTransition("HIDDEN", false, false, null, 0.2)
                    }.bind(this), 0.4)
            }
        }
    });
    sc.MapWorldMap = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/world-map.png"),
        buttonGroup: null,
        areas: [],
        cursor: null,
        areaName: null,
        _gamepadActive: false,
        _lastDevice: 0,
        _cursorPos: Vec2.createC(-1E4,
            -1E4),
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus = true;
            this.buttonGroup.addSelectionCallback(function(a) {
                a && a.data && sc.menu.setInfoText(a.data)
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true);
                this.areaName.setText("")
            }.bind(this));
            this.buttonGroup.onButtonTraversal = function() {
                if (ig.input.currentDevice ==
                    ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.mapAreaFocus) sc.menu.mapAreaFocus.onButtonPress()
            }.bind(this);
            this._addAreas();
            this.cursor = new sc.MapCursor(true);
            this.addChildGui(this.cursor);
            this.areaName = new sc.WorldmapAreaName;
            this.addChildGui(this.areaName);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            sc.menu.mapWmCursorMoved = false;
            if (!ig.interact.isBlocked() && this.buttonGroup.isActive()) {
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice ==
                        ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var a = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        a = this._cursorPos;
                        this._initCursor(a);
                        sc.menu.mapWorldCursor.x = a.x;
                        sc.menu.mapWorldCursor.y = a.y;
                        this._limitCursorPos();
                        sc.menu.resetWorldmapCursor();
                        sc.menu.setInfoText("", true);
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        this._cursorPos.x = sc.menu.mapWorldCursor.x;
                        this._cursorPos.y =
                            sc.menu.mapWorldCursor.y;
                        this.cursor.unfocus()
                    }
                    sc.menu.toggledInputMode()
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var b = a = 0,
                        e = 0,
                        f = false;
                    if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        a = (-100 + e * 100) * ig.system.actualTick;
                        f = true
                    } else if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        a = (100 + e * 100) * ig.system.actualTick;
                        f = true
                    }
                    if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        b = (-100 + e * 100) * ig.system.actualTick;
                        f = true
                    } else if ((e = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) >
                        0.5) {
                        b = (100 + e * 100) * ig.system.actualTick;
                        f = true
                    }
                    if (f) {
                        sc.menu.mapWmCursorMoved = true;
                        sc.menu.mapWorldCursor.x = a >= 0 ? Math.floor(sc.menu.mapWorldCursor.x + a) : Math.ceil(sc.menu.mapWorldCursor.x + a);
                        sc.menu.mapWorldCursor.y = b >= 0 ? Math.floor(sc.menu.mapWorldCursor.y + b) : Math.ceil(sc.menu.mapWorldCursor.y + b);
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
                    }
                }
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu,
                this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function() {
            this.areaName.setText("");
            var a = this.areas.length;
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            for (sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup); a--;) this.areas[a].focusLost();
            sc.menu.resetWorldmapCursor();
            this.cursor.addObservers();
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            this._focusCurrentArea();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.areaName.setText("");
            this.cursor.unfocus();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this.cursor.removeObservers();
            this.doStateTransition("HIDDEN")
        },
        _focusCurrentArea: function() {
            if (sc.menu.mapWorldFirstVisit) {
                var a = this._cursorPos;
                a.x = sc.menu.mapWorldCursor.x;
                a.y = sc.menu.mapWorldCursor.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
            } else if (ig.input.currentDevice ==
                ig.INPUT_DEVICES.GAMEPAD) {
                sc.menu.mapWorldFirstVisit = true;
                a = this._cursorPos;
                this._initCursor(a);
                for (var b = sc.map.currentArea, e = this.areas.length; e--;) {
                    a = this.areas[e];
                    if (a.key == b.path) {
                        b = a.hook.pos.y + Math.floor(8) + 1;
                        sc.menu.mapWorldCursor.x = a.hook.pos.x + Math.floor(8) - 1;
                        sc.menu.mapWorldCursor.y = b;
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y);
                        break
                    }
                }
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
                sc.menu.mapWorldCursor.x;
            sc.menu.mapWorldCursor.x = a.limit(5, ig.system.width - Math.floor(this.cursor.hook.size.x / 2));
            a = sc.menu.mapWorldCursor.y;
            sc.menu.mapWorldCursor.y = a.limit(41, ig.system.height - this.cursor.hook.size.y - 4)
        },
        _setAreaName: function(a) {
            var b = a.area,
                e = a.hook.pos,
                f = sc.stats.getMap("chests", a.key) || 0,
                a = sc.map.getChestCount(a.key),
                f = Math.min(f, a),
                g = "";
            a != 0 && (g = f >= a ? " \\c[3][" + f + "/" + a + "]\\c[0]" : " [" + f + "/" + a + "]");
            this.areaName.setText(ig.LangLabel.getText(b.name) + g);
            b = e.x + 11;
            e = e.y - this.areaName.hook.size.y +
                5;
            this.areaName.setPos(b, e);
            if (this.areaName.hook.pos.x + this.areaName.hook.size.x >= ig.system.width - 2) {
                this.areaName.setPos(b - this.areaName.hook.size.x - 10, e + 23);
                this.areaName.setFlip(true)
            } else this.areaName.setFlip(false)
        },
        _addAreas: function() {
            var b = sc.map.areas,
                c;
            for (c in a)
                if (sc.map.getVisitedArea(c)) {
                    var e = null;
                    if (ig.vars.get("menu.circuit.start." + c)) e = new sc.WorldMapExtra(c, false);
                    else {
                        ig.vars.set("menu.circuit.start." + c, true);
                        e = new sc.WorldMapExtra(c, true)
                    }
                    this.addChildGui(e)
                } for (c in b) {
                e = b[c];
                if ((!e.condition || (new ig.VarCondition(e.condition)).evaluate()) && sc.map.getVisitedArea(c)) {
                    e = this._addAreaButton(c, e);
                    this.addChildGui(e)
                }
            }
        },
        _addAreaButton: function(a, b) {
            var e = new sc.AreaButton(a, b);
            e.setPos(b.position.x - 8 + 1, b.position.y - 8);
            this.buttonGroup.addFocusGui(e);
            this.areas.push(e);
            return e
        },
        onBackButtonPress: function() {
            sc.menu.exitWorldMap()
        },
        modelChanged: function(a, b, e) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.MAP_WORLDMAP_STATE)
                    if (e) this.show();
                    else {
                        ig.interact.setBlockDelay(0.2);
                        sc.menu.popBackCallback();
                        this.hide()
                    }
            else if (b == sc.MENU_EVENT.MAP_FOCUS_AREA) {
                this._setAreaName(sc.menu.mapAreaFocus);
                sc.menu.setInfoText(sc.menu.mapAreaFocus.description)
            } else if (b == sc.MENU_EVENT.MAP_UNFOCUS) {
                this.areaName.setText("");
                sc.menu.setInfoText("", true)
            } else if (b == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) this.areaName.setText("", false, true);
            else if (b == sc.MENU_EVENT.MAP_AREA_LOAD) {
                sc.menu.popBackCallback();
                this.hide()
            }
        }
    })
});
ig.baked = !0;
