ig.module("game.feature.menu.gui.map.map-stamp").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc").defines(function() {
    var b = 0,
        a = 0,
        d = 0,
        c = 0;
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
        init: function(a, b, c, d, i, j) {
            this.parent();
            this.setSize(8, 8);
            this.setPos(b - 4, c - 4);
            this.floorGui = j;
            this.index = i;
            this.key = a || "DEFAULT";
            a = sc.MAP_STAMPS[this.key].icon;
            this.icon.x = a % 15;
            this.icon.y = ~~(a / 15);
            this.floor = d || 0;
            this.name = ig.lang.get("sc.gui.menu.map-menu.stamps." + this.key)
        },
        setKey: function(a) {
            this.key = a || "DEFAULT";
            a =
                sc.MAP_STAMPS[this.key].icon;
            this.icon.x = a % 15;
            this.icon.y = ~~(a / 15);
            this.name = ig.lang.get("sc.gui.menu.map-menu.stamps." + this.key)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 1, 1, 56 + this.icon.x * 8, 288 + this.icon.y * 8, 8, 8)
        },
        isMouseOver: function() {
            if (!(this.floor != sc.map.currentFloor || sc.menu.mapWorldmapActive || ig.interact.isBlocked() || sc.menu.mapStampMenu)) {
                if (sc.menu.mapDrag) return sc.menu.mapMapFocus == this;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var a = this.getDistanceToCursor();
                    if (sc.menu.mapCursorMoved) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    if (a <= 6) {
                        a = this.hook;
                        sc.menu.focusMap(a.pos.x + Math.floor(a.size.x / 2) + sc.menu.mapAreaOffset.x, a.pos.y + Math.floor(a.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this, true)
                    } else sc.menu.unfocusMap(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var b = Math.floor(sc.control.getMouseX()),
                        g = Math.floor(sc.control.getMouseY());
                    if (g <= 21 || g >= 299) {
                        sc.menu.unfocusMap(this);
                        return false
                    }
                    a = this.hook;
                    d = a.screenCoords.x;
                    c = a.screenCoords.y;
                    (b = b >= d && b <= d + 7 && g >= c && g <= c + 8) ? sc.menu.focusMap(a.pos.x +
                        Math.floor(a.size.x / 2) + sc.menu.mapAreaOffset.x, a.pos.y + Math.floor(a.size.y / 2) + 1 + sc.menu.mapAreaOffset.y, this): sc.menu.unfocusMap(this);
                    return b
                }
                return false
            }
        },
        getDistanceToCursor: function() {
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
        init: function() {
            this.parent(70, 111);
            this.delete = new sc.ButtonGui(ig.lang.get("sc.gui.menu.map-menu.delete"), 64, true, sc.BUTTON_TYPE.ITEM);
            this.delete.setPos(3, 3);
            this.delete.data = {
                "delete": true
            };
            this.delete.textChild.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.delete.textChild.setPos(0, 0);
            this.addChildGui(this.delete);
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.soundsOnPressed = true;
            this.buttongroup.addSelectionCallback(function() {}.bind(this));
            this.buttongroup.addPressCallback(function(a) {
                if (a.data.delete) {
                    sc.menu.removeStamp(sc.map.currentArea.path, this.anchor.index);
                    sc.menu.unfocusMap(this.anchor);
                    sc.menu.popBackCallback();
                    this.anchor.floorGui.removeChildGui(this.anchor);
                    this.hide()
                } else if (a.data.stamp) {
                    this.anchor.setKey(a.key);
                    sc.menu.editStamp(this.anchor.index, sc.map.currentArea.path, a.key);
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
        show: function(c) {
            if (!this._active) {
                this._active = true;
                sc.menu.mapDrag = false;
                this.hook.currentStateName == "DEFAULT" && this.doStateTransition("HIDDEN", true);
                this.anchor = c;
                sc.menu.mapStampMenu = true;
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.pushBackCallback(this.onBackPressed.bind(this));
                c = c.hook;
                this.limitPosition(c.pos.x + sc.menu.mapAreaOffset.x + sc.menu.mapCamera.x - 70 - 2, c.pos.y + sc.menu.mapAreaOffset.y + sc.menu.mapCamera.y + 3);
                this.setPos(b, a);
                this.unPressAllButtons();
                this.pressCurrentStamp(this.anchor.key);
                ig.input.currentDevice != ig.INPUT_DEVICES.GAMEPAD ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, true);
                this.doStateTransition("DEFAULT")
            }
        },
        hide: function(a) {
            if (this._active) {
                this._active = false;
                a && sc.menu.popBackCallback();
                sc.menu.mapStampMenu = false;
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                this.doStateTransition("HIDDEN")
            }
        },
        createStamps: function() {
            var a = 3,
                b = 25,
                c = 0,
                d = 1,
                i = 0,
                j;
            for (j in sc.MAP_STAMPS) {
                var k = new sc.StampMenuButton(j);
                k.data = {
                    stamp: true
                };
                k.setPos(a, b);
                this.addChildGui(k);
                this.buttongroup.addFocusGui(k, c, d);
                this.stamps[i] = k;
                c++;
                a = a + 16;
                i++;
                if (c >= 4) {
                    c = 0;
                    d++;
                    a = 3;
                    b = b + 21
                }
            }
        },
        limitPosition: function(c, d) {
            b = c;
            a = d;
            b < 1 && (c = c + 80);
            a + 111 >= 298 && (d = d - 111);
            b = c;
            a = d
        },
        unPressAllButtons: function() {
            for (var a =
                    this.stamps.length; a--;) this.stamps[a].setPressed(false)
        },
        pressCurrentStamp: function(a) {
            for (var b = this.stamps.length; b--;) a == this.stamps[b].key && this.buttongroup.setPressedFocusGui(this.stamps[b])
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addColor("#292b2f", 2, 23, 66, 1)
        },
        onBackPressed: function() {
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
        init: function(a) {
            this.parent("", 16, true,
                sc.BUTTON_TYPE.GROUP, null, true);
            this.noFocusOnPressed = true;
            this.key = a || "DEFAULT";
            a = sc.MAP_STAMPS[a].icon;
            this.icon.x = a % 15;
            this.icon.y = ~~(a / 15);
            this.iconGui = new ig.ImageGui(this.icons, 56 + this.icon.x * 8, 288 + this.icon.y * 8, 8, 8);
            this.iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.iconGui)
        }
    })
});
ig.baked = !0;
