/**
 * game.feature.menu.gui.map.map-stamp
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.map.map-stamp")`.
 *
 * Player-placed map stamps. `sc.StampGui` is a single stamp on the map,
 * `sc.StampEditMenu` is the popup to pick a stamp icon (or delete the stamp)
 * when one is placed/right-clicked, and `sc.StampMenuButton` is one icon
 * choice in that popup. `sc.MAP_STAMPS` maps each stamp key to its icon.
 */
ig.module("game.feature.menu.gui.map.map-stamp")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    var MENU_X = 0,
        MENU_Y = 0,
        MOUSE_X = 0,
        MOUSE_Y = 0;

    sc.MAP_STAMPS = {
        DEFAULT: {
            icon: 0
        },
        CHEST: {
            icon: 1
        },
        ENEMY: {
            icon: 2
        },
        GREEN: {
            icon: 3
        },
        SECRET: {
            icon: 4
        },
        QUEST: {
            icon: 5
        },
        UNKNOWN: {
            icon: 6
        },
        XXX: {
            icon: 7
        },
        ARROW_RIGHT: {
            icon: 15
        },
        ARROW_LEFT: {
            icon: 16
        },
        ARROW_UP: {
            icon: 17
        },
        ARROW_DOWN: {
            icon: 18
        },
        ARROW_DOWN_RIGHT: {
            icon: 19
        },
        ARROW_DOWN_LEFT: {
            icon: 20
        },
        ARROW_UP_RIGHT: {
            icon: 21
        },
        ARROW_UP_LEFT: {
            icon: 22
        }
    };

    sc.StampGui = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        key: "DEFAULT",
        icon: {
            x: 0,
            y: 0
        },
        floor: 0,
        floorGui: null,
        name: "",
        index: -1,
        activated: true,

        init: function (key, x, y, floor, index, floorGui) {
            this.parent();
            this.setSize(8, 8);
            this.setPos(x - 4, y - 4);
            this.floorGui = floorGui;
            this.index = index;
            this.key = key || "DEFAULT";
            key = sc.MAP_STAMPS[this.key].icon;
            this.icon.x = key % 15;
            this.icon.y = ~~(key / 15);
            this.floor = floor || 0;
            this.name = ig.lang.get("sc.gui.menu.map-menu.stamps." + this.key)
        },

        setKey: function (key) {
            this.key = key || "DEFAULT";
            key = sc.MAP_STAMPS[this.key].icon;
            this.icon.x = key % 15;
            this.icon.y = ~~(key / 15);
            this.name = ig.lang.get("sc.gui.menu.map-menu.stamps." + this.key)
        },

        updateDrawables: function (drawables) {
            drawables.addGfx(this.gfx, 1, 1, 56 + this.icon.x * 8, 288 + this.icon.y * 8, 8, 8)
        },

        isMouseOver: function () {
            if (!(this.floor != sc.map.currentFloor || sc.menu.mapWorldmapActive || ig.interact.isBlocked() || sc.menu.mapStampMenu)) {
                if (sc.menu.mapDrag) {
                    return sc.menu.mapMapFocus == this
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var distance = this.getDistanceToCursor();
                    if (sc.menu.mapCursorMoved) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    if (distance <= 6) {
                        var hook = this.hook;
                        sc.menu.focusMap(hook.pos.x + Math.floor(hook.size.x / 2) + sc.menu.mapAreaOffset.x, hook.pos.y + Math.floor(hook.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this, true)
                    } else {
                        sc.menu.unfocusMap(this)
                    }
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY());
                    if (mouseY <= 21 || mouseY >= 299) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    hook = this.hook;
                    MOUSE_X = hook.screenCoords.x;
                    MOUSE_Y = hook.screenCoords.y;
                    var isOver = mouseX >= MOUSE_X && mouseX <= MOUSE_X + 7 && mouseY >= MOUSE_Y && mouseY <= MOUSE_Y + 8;
                    isOver ? sc.menu.focusMap(hook.pos.x + Math.floor(hook.size.x / 2) + sc.menu.mapAreaOffset.x, hook.pos.y + Math.floor(hook.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this) : sc.menu.unfocusMap(this);
                    return isOver
                }
                return false
            }
        },

        getDistanceToCursor: function () {
            return Math.floor(Vec2.distanceC(sc.menu.mapCursor.x - sc.menu.mapAreaOffset.x, sc.menu.mapCursor.y - sc.menu.mapAreaOffset.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    });

    sc.StampEditMenu = ig.BoxGui.extend({
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
            width: 6,
            height: 6,
            left: 9,
            top: 9,
            right: 9,
            bottom: 9,
            offsets: {
                "default": {
                    x: 432,
                    y: 304
                }
            }
        }),
        "delete": null,
        anchor: null,
        stamps: [],
        buttongroup: null,
        _active: false,

        init: function () {
            this.parent(70, 111);
            this.delete = new sc.ButtonGui(ig.lang.get("sc.gui.menu.map-menu.delete"), 64, true, sc.BUTTON_TYPE.ITEM);
            this.delete.setPos(3, 3);
            this.delete.data = {
                "delete": true
            };
            this.delete.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.delete.textChild.setPos(0, 0);
            this.addChildGui(this.delete);
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.soundsOnPressed = true;
            this.buttongroup.addSelectionCallback(function () {}.bind(this));
            this.buttongroup.addPressCallback(function (button) {
                if (button.data.delete) {
                    sc.menu.removeStamp(sc.map.currentArea.path, this.anchor.index);
                    sc.menu.unfocusMap(this.anchor);
                    sc.menu.popBackCallback();
                    this.anchor.floorGui.removeChildGui(this.anchor);
                    this.hide()
                } else if (button.data.stamp) {
                    this.anchor.setKey(button.key);
                    sc.menu.editStamp(this.anchor.index, sc.map.currentArea.path, button.key);
                    sc.menu.unfocusMap(this.anchor);
                    sc.menu.popBackCallback();
                    this.hide()
                }
            }.bind(this));
            this.buttongroup.addFocusGui(this.delete, 0, 0);
            this.createStamps();
            this.buttongroup.fillEmptySpace();
            this.doStateTransition("HIDDEN", true)
        },

        show: function (anchor) {
            if (!this._active) {
                this._active = true;
                sc.menu.mapDrag = false;
                this.hook.currentStateName == "DEFAULT" && this.doStateTransition("HIDDEN", true);
                this.anchor = anchor;
                sc.menu.mapStampMenu = true;
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.pushBackCallback(this.onBackPressed.bind(this));
                anchor = anchor.hook;
                this.limitPosition(anchor.pos.x + sc.menu.mapAreaOffset.x + sc.menu.mapCamera.x - 70 - 2, anchor.pos.y + sc.menu.mapAreaOffset.y + sc.menu.mapCamera.y + 3);
                this.setPos(MENU_X, MENU_Y);
                this.unPressAllButtons();
                this.pressCurrentStamp(this.anchor.key);
                ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, true);
                this.doStateTransition("DEFAULT")
            }
        },

        hide: function (popCallback) {
            if (this._active) {
                this._active = false;
                popCallback && sc.menu.popBackCallback();
                sc.menu.mapStampMenu = false;
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                this.doStateTransition("HIDDEN")
            }
        },

        createStamps: function () {
            var posX = 3,
                posY = 25,
                column = 0,
                row = 1,
                index = 0,
                key;
            for (key in sc.MAP_STAMPS) {
                var button = new sc.StampMenuButton(key);
                button.data = {
                    stamp: true
                };
                button.setPos(posX, posY);
                this.addChildGui(button);
                this.buttongroup.addFocusGui(button, column, row);
                this.stamps[index] = button;
                column++;
                posX = posX + 16;
                index++;
                if (column >= 4) {
                    column = 0;
                    row++;
                    posX = 3;
                    posY = posY + 21
                }
            }
        },

        limitPosition: function (x, y) {
            MENU_X = x;
            MENU_Y = y;
            MENU_X < 1 && (x = x + 80);
            MENU_Y + 111 >= 298 && (y = y - 111);
            MENU_X = x;
            MENU_Y = y
        },

        unPressAllButtons: function () {
            for (var index = this.stamps.length; index--;) {
                this.stamps[index].setPressed(false)
            }
        },

        pressCurrentStamp: function (key) {
            for (var index = this.stamps.length; index--;) {
                key == this.stamps[index].key && this.buttongroup.setPressedFocusGui(this.stamps[index])
            }
        },

        updateDrawables: function (drawables) {
            this.parent(drawables);
            drawables.addColor("#292b2f", 2, 23, 66, 1)
        },

        onBackPressed: function () {
            sc.menu.popBackCallback();
            this.hide()
        }
    });

    sc.StampMenuButton = sc.ButtonGui.extend({
        icons: new ig.Image("media/gui/menu.png"),
        key: "DEFAULT",
        icon: {
            x: 0,
            y: 0
        },
        iconGui: null,

        init: function (key) {
            this.parent("", 16, true, sc.BUTTON_TYPE.GROUP, null, true);
            this.noFocusOnPressed = true;
            this.key = key || "DEFAULT";
            key = sc.MAP_STAMPS[key].icon;
            this.icon.x = key % 15;
            this.icon.y = ~~(key / 15);
            this.iconGui = new ig.ImageGui(this.icons, 56 + this.icon.x * 8, 288 + this.icon.y * 8, 8, 8);
            this.iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.iconGui)
        }
    })
});
ig.baked = !0;
