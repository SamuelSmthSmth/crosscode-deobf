/**
 * game.feature.menu.gui.map.map-worldmap
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.map.map-worldmap")`.
 *
 * The worldmap overlay of the map menu. `sc.MapWorldMap` draws the world
 * map and hosts one `sc.AreaButton` per visited area (with its chest
 * counter), `sc.WorldMapExtra` renders special map decorations (beach /
 * final dungeon) with a reveal animation, and `sc.AreaButton` is the focus
 * button for a single area that loads it when pressed.
 */
ig.module("game.feature.menu.gui.map.map-worldmap")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.map.map-misc")
    .defines(function () {

    Vec2.createC(0, 0);
    var SUBMIT_SOUND = sc.BUTTON_SOUND.submit,
        WORLD_MAP_EXTRA_POS = {
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

        init: function (key, area) {
            this.parent(true, false);
            this.setSize(16, 16);
            this.setPivot(8, 8);
            this.key = key;
            this.area = area;
            this.description = new ig.LangLabel(this.area.description || "");
            if (this.area) {
                this.activeArea = key == sc.map.currentPlayerArea.path;
                this.icon = sc.AREA_TYPE[this.area.areaType] * 8
            }
        },

        onButtonPress: function () {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var mouseY = Math.floor(sc.control.getMouseY());
                if (mouseY <= 21 || mouseY >= 299) return
            }
            SUBMIT_SOUND.play();
            sc.menu.loadArea(this.key)
        },

        updateDrawables: function (drawables) {
            this.focus && drawables.addGfx(this.gfx, -3, -2, 421, 173, 21, 21).setCompositionMode("lighter");
            drawables.addGfx(this.gfx, 4, 4, 328 + this.icon, 456 + (this.activeArea ? 8 : 0), 8, 8);
            if (this.activeArea) {
                drawables.addGfx(this.gfx, 1, 2, 304, 440, 3, 3);
                drawables.addGfx(this.gfx, -11, -8, 280, 424, 16, 11)
            }
        },

        isMouseOver: function () {
            if (sc.menu.mapWorldmapActive && !ig.interact.isBlocked()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var distance = this.getDistanceToCursor();
                    if (sc.menu.mapWmCursorMoved) {
                        sc.menu.unfocusArea(this);
                        return false
                    }
                    if (distance <= 10) {
                        var hook = this.hook;
                        sc.menu.focusArea(hook.pos.x + Math.floor(hook.size.x / 2) - 1, hook.pos.y + Math.floor(hook.size.y / 2) + 1, this, true);
                        return true
                    }
                    sc.menu.unfocusArea(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY()),
                        hook = this.hook;
                    var isOver = mouseX >= hook.pos.x && mouseX <= hook.pos.x + hook.size.x && mouseY >= hook.pos.y && mouseY <= hook.pos.y + hook.size.y;
                    isOver ? sc.menu.focusArea(hook.pos.x + Math.floor(hook.size.x / 2) - 1, hook.pos.y + Math.floor(hook.size.y / 2) + 1, this) : sc.menu.unfocusArea(this);
                    return isOver
                }
                return false
            }
        },

        getDistanceToCursor: function () {
            return Math.floor(Vec2.distanceC(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    });

    sc.WorldMapExtra = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/world-map-extra.png"),
        timer: 0,
        image: null,
        overlay: null,

        init: function (key, reveal) {
            this.parent();
            var extra = WORLD_MAP_EXTRA_POS[key];
            this.setSize(extra.w, extra.h);
            this.setPos(extra.x, extra.y);
            this.image = new ig.ImageGui(this.gfx, extra.sx, extra.sy, extra.w, extra.h);
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
            if (reveal) {
                this.overlay = new ig.ImageGui(this.gfx, extra.sx + extra.w, extra.sy, extra.w, extra.h);
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
                this.overlay.doStateTransition("DEFAULT", false, false, function () {
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
        _cursorPos: Vec2.createC(-1E4, -1E4),

        init: function () {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus = true;
            this.buttonGroup.addSelectionCallback(function (entry) {
                entry && entry.data && sc.menu.setInfoText(entry.data)
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true);
                this.areaName.setText("")
            }.bind(this));
            this.buttonGroup.onButtonTraversal = function () {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.mapAreaFocus) {
                    sc.menu.mapAreaFocus.onButtonPress()
                }
            }.bind(this);
            this._addAreas();
            this.cursor = new sc.MapCursor(true);
            this.addChildGui(this.cursor);
            this.areaName = new sc.WorldmapAreaName;
            this.addChildGui(this.areaName);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            sc.menu.mapWmCursorMoved = false;
            if (!ig.interact.isBlocked() && this.buttonGroup.isActive()) {
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var cursorPos = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        cursorPos = this._cursorPos;
                        this._initCursor(cursorPos);
                        sc.menu.mapWorldCursor.x = cursorPos.x;
                        sc.menu.mapWorldCursor.y = cursorPos.y;
                        this._limitCursorPos();
                        sc.menu.resetWorldmapCursor();
                        sc.menu.setInfoText("", true);
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        this._cursorPos.x = sc.menu.mapWorldCursor.x;
                        this._cursorPos.y = sc.menu.mapWorldCursor.y;
                        this.cursor.unfocus()
                    }
                    sc.menu.toggledInputMode()
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var moveX = 0,
                        moveY = 0,
                        axis = 0,
                        moved = false;
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        moveX = (-100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        moveX = (100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        moveY = (-100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                        moveY = (100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if (moved) {
                        sc.menu.mapWmCursorMoved = true;
                        sc.menu.mapWorldCursor.x = moveX >= 0 ? Math.floor(sc.menu.mapWorldCursor.x + moveX) : Math.ceil(sc.menu.mapWorldCursor.x + moveX);
                        sc.menu.mapWorldCursor.y = moveY >= 0 ? Math.floor(sc.menu.mapWorldCursor.y + moveY) : Math.ceil(sc.menu.mapWorldCursor.y + moveY);
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
                    }
                }
            }
        },

        updateDrawables: function (drawables) {
            drawables.addGfx(this.gfx, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            this.areaName.setText("");
            var count = this.areas.length;
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            for (sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup); count--;) {
                this.areas[count].focusLost()
            }
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

        hide: function () {
            this.areaName.setText("");
            this.cursor.unfocus();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this.cursor.removeObservers();
            this.doStateTransition("HIDDEN")
        },

        _focusCurrentArea: function () {
            if (sc.menu.mapWorldFirstVisit) {
                var cursorPos = this._cursorPos;
                cursorPos.x = sc.menu.mapWorldCursor.x;
                cursorPos.y = sc.menu.mapWorldCursor.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y)
            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                sc.menu.mapWorldFirstVisit = true;
                cursorPos = this._cursorPos;
                this._initCursor(cursorPos);
                for (var area = sc.map.currentArea, index = this.areas.length; index--;) {
                    cursorPos = this.areas[index];
                    if (cursorPos.key == area.path) {
                        var cursorY = cursorPos.hook.pos.y + Math.floor(8) + 1;
                        sc.menu.mapWorldCursor.x = cursorPos.hook.pos.x + Math.floor(8) - 1;
                        sc.menu.mapWorldCursor.y = cursorY;
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.mapWorldCursor.x, sc.menu.mapWorldCursor.y);
                        break
                    }
                }
            }
        },

        _initCursor: function (cursorPos) {
            if (cursorPos.x <= -1E4 || cursorPos.y <= -1E4) {
                cursorPos.x = ig.system.width / 2;
                cursorPos.y = ig.system.height / 2
            }
        },

        _limitCursorPos: function () {
            var x = sc.menu.mapWorldCursor.x;
            sc.menu.mapWorldCursor.x = x.limit(5, ig.system.width - Math.floor(this.cursor.hook.size.x / 2));
            x = sc.menu.mapWorldCursor.y;
            sc.menu.mapWorldCursor.y = x.limit(41, ig.system.height - this.cursor.hook.size.y - 4)
        },

        _setAreaName: function (areaButton) {
            var area = areaButton.area,
                pos = areaButton.hook.pos,
                found = sc.stats.getMap("chests", areaButton.key) || 0,
                total = sc.map.getChestCount(areaButton.key),
                found = Math.min(found, total),
                suffix = "";
            total != 0 && (suffix = found >= total ? " \\c[3][" + found + "/" + total + "]\\c[0]" : " [" + found + "/" + total + "]");
            this.areaName.setText(ig.LangLabel.getText(area.name) + suffix);
            var x = pos.x + 11,
                y = pos.y - this.areaName.hook.size.y + 5;
            this.areaName.setPos(x, y);
            if (this.areaName.hook.pos.x + this.areaName.hook.size.x >= ig.system.width - 2) {
                this.areaName.setPos(x - this.areaName.hook.size.x - 10, y + 23);
                this.areaName.setFlip(true)
            } else {
                this.areaName.setFlip(false)
            }
        },

        _addAreas: function () {
            var areas = sc.map.areas,
                key;
            for (key in WORLD_MAP_EXTRA_POS) {
                if (sc.map.getVisitedArea(key)) {
                    var extra = null;
                    if (ig.vars.get("menu.circuit.start." + key)) {
                        extra = new sc.WorldMapExtra(key, false)
                    } else {
                        ig.vars.set("menu.circuit.start." + key, true);
                        extra = new sc.WorldMapExtra(key, true)
                    }
                    this.addChildGui(extra)
                }
            }
            for (key in areas) {
                var area = areas[key];
                if ((!area.condition || (new ig.VarCondition(area.condition)).evaluate()) && sc.map.getVisitedArea(key)) {
                    extra = this._addAreaButton(key, area);
                    this.addChildGui(extra)
                }
            }
        },

        _addAreaButton: function (key, area) {
            var button = new sc.AreaButton(key, area);
            button.setPos(area.position.x - 8 + 1, area.position.y - 8);
            this.buttonGroup.addFocusGui(button);
            this.areas.push(button);
            return button
        },

        onBackButtonPress: function () {
            sc.menu.exitWorldMap()
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.MAP_WORLDMAP_STATE) {
                    if (data) {
                        this.show()
                    } else {
                        ig.interact.setBlockDelay(0.2);
                        sc.menu.popBackCallback();
                        this.hide()
                    }
                } else if (event == sc.MENU_EVENT.MAP_FOCUS_AREA) {
                    this._setAreaName(sc.menu.mapAreaFocus);
                    sc.menu.setInfoText(sc.menu.mapAreaFocus.description)
                } else if (event == sc.MENU_EVENT.MAP_UNFOCUS) {
                    this.areaName.setText("");
                    sc.menu.setInfoText("", true)
                } else if (event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                    this.areaName.setText("", false, true)
                } else if (event == sc.MENU_EVENT.MAP_AREA_LOAD) {
                    sc.menu.popBackCallback();
                    this.hide()
                }
            }
        }
    })
});
ig.baked = !0;
