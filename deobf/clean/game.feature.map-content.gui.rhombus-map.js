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
        init: function(callback) {
            this.parent();
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = callback || null;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus =
                true;
            this.buttonGroup.addSelectionCallback(function(location) {
                location && location.entity && this.info.setText(location.entity.description)
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
            this.help.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN_Y.CENTER);
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
                    var cursorPos = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        cursorPos = this._cursorPos;
                        this._initCursor(cursorPos);
                        this._worldCursor.x = cursorPos.x;
                        this._worldCursor.y = cursorPos.y;
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
                    var dx = cursorPos = 0,
                        dy = 0,
                        moved = false;
                    if ((dy = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        cursorPos = (-100 + dy * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((dy = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        cursorPos = (100 + dy * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if ((dy = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        dx = (-100 + dy * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((dy = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) >
                        0.5) {
                        dx = (100 + dy * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if (moved) {
                        this._cursorMoved = true;
                        this._worldCursor.x = cursorPos >= 0 ? Math.floor(this._worldCursor.x + cursorPos) : Math.ceil(this._worldCursor.x + cursorPos);
                        this._worldCursor.y = dx >= 0 ? Math.floor(this._worldCursor.y + dx) : Math.ceil(this._worldCursor.y + dx);
                        this._limitCursorPos();
                        this.cursor.moveTo(this._worldCursor.x, this._worldCursor.y)
                    }
                }
            }
        },
        createLocationUIs: function() {
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.RhombusPoint && (!entity.condition || entity.condition.evaluate())) {
                    entity =
                        this.createLocationUI(entity);
                    this.buttonGroup.addFocusGui(entity);
                    this.locations.push(entity);
                    this.container.addChildGui(entity)
                }
            }
        },
        createLocationUI: function(entity) {
            var location = new sc.RhombusMenuLocation(entity, this),
                hook = location.hook,
                entity = entity.coll;
            ig.system.getScreenFromMapPos(screenPos, Math.round(entity.pos.x + entity.size.x / 2), Math.round(entity.pos.y - entity.pos.z - entity.size.z / 2 + entity.size.y / 2));
            if (screenPos.x < 0) screenPos.x = 0;
            if (screenPos.x > ig.system.width) screenPos.x = ig.system.width;
            if (screenPos.y < 0) screenPos.y = 0;
            if (screenPos.y > ig.system.height) screenPos.y = ig.system.height;
            hook.pos.x = screenPos.x - hook.size.x / 2;
            hook.pos.y = screenPos.y - hook.size.y / 2;
            return location
        },
        onButtonPress: function(location) {
            for (var i =
                    this.locations.length; i--;) this.locations[i].doStateTransition("HIDDEN");
            this.infoBox.hide();
            this.doStateTransition("HIDDEN", false, true, function() {
                ig.interact.removeEntry(this.buttonInteract);
                this.callback && this.callback(location.map, location.marker, location)
            }.bind(this), 0)
        },
        focusLocation: function(x, y, location) {
            if (this.currentFocus == location) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this._worldCursor.x = x;
                    this._worldCursor.y = y;
                    this.cursor.focusOnNode(x, y)
                }
            } else {
                this._worldCursor.x = x;
                this._worldCursor.y = y;
                if (this.currentFocus &&
                    this.currentFocus.focus) this.currentFocus.focus = false;
                if ((this.currentFocus = location) && !this.currentFocus.focus) this.currentFocus.focus = true;
                this.cursor.focusOnNode(x, y);
                this.infoBox.show(this.currentFocus)
            }
        },
        unfocus: function(location) {
            if (this.currentFocus == location) {
                if (this.currentFocus) this.currentFocus.focus = false;
                this.currentFocus = null;
                this.info.setText("", 0.2);
                this.cursor.unfocus();
                this.infoBox.hide()
            }
        },
        _initCursor: function(cursorPos) {
            if (cursorPos.x <= -1E4 || cursorPos.y <= -1E4) {
                cursorPos.x = ig.system.width / 2;
                cursorPos.y = ig.system.height / 2
            }
        },
        _limitCursorPos: function() {
            var cursorX =
                this._worldCursor.x;
            this._worldCursor.x = cursorX.limit(5, ig.system.width - Math.floor(this.cursor.hook.size.x / 2));
            cursorX = this._worldCursor.y;
            this._worldCursor.y = cursorX.limit(41, ig.system.height - this.cursor.hook.size.y - 4)
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
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.TOP);
            this.title.setPos(0, 2);
            this.addChildGui(this.title);
            (new ig.ColorGui("#CCCCCC", 144, 82)).setPos(3, 18);
            this.icon = new ig.ImageGui(this.gfx, 0, 0, 142, 80);
            this.icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN_Y.TOP);
            this.icon.setPos(0, 17);
            this.addChildGui(this.icon);
            this.arrow = new sc.RhombusMenuArrow;
            this.addChildGui(this.arrow);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(drawables) {
            this.parent(drawables);
            drawables.addColor("#CCCCCC", 3, this.title.hook.size.y + 1, 142, 1)
        },
        show: function(location) {
            this.alignToBase(location.hook);
            this.setData(location.entity);
            this.doStateTransition("DEFAULT");
            this.active = true
        },
        hide: function(instant) {
            this.doStateTransition("HIDDEN", instant);
            this.active = false
        },
        setData: function(entity) {
            this.title.setText(entity.title);
            this.icon.offsetY = entity.icon * 80
        },
        alignToBase: function(anchor) {
            var hook =
                    this.hook,
                isHidden = hook.currentState.alpha == 0;
            screenPos.x = anchor.pos.x + Math.floor(anchor.size.x / 2);
            screenPos.y = anchor.pos.y + Math.floor(anchor.size.y / 2);
            anchor = screenPos.y + -46;
            screenPos.y = Math.max(10, Math.min(ig.system.height - 100 - 10, screenPos.y + -46));
            if (isHidden) hook.pos.y = screenPos.y;
            var arrowOffset = 38 + (anchor - screenPos.y);
            if (screenPos.x + 173 < ig.system.width) {
                this.currentTileOffset = "default";
                if (isHidden) hook.pos.x = screenPos.x + 20 + 10;
                hook.doPosTranstition(screenPos.x + 20, screenPos.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(-10, Math.max(7, Math.min(125, arrowOffset)), false)
            } else {
                this.currentTileOffset = "flipped";
                if (isHidden) hook.pos.x = screenPos.x - hook.size.x - 20 - 10 - 1;
                hook.doPosTranstition(screenPos.x -
                    hook.size.x - 20 - 1, screenPos.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(hook.size.x + 1, Math.max(7, Math.min(125, 38 + (anchor - screenPos.y))), true)
            }
            this.arrow.bottomAnchor = false;
            this.arrow.flipY = false;
            if (arrowOffset < 7) {
                this.arrow.bottomAnchor = true;
                this.arrow.flipY = true
            } else if (arrowOffset > 125) this.arrow.bottomAnchor = true
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
        setPosition: function(x, y, flipX, flipY, bottomAnchor) {
            this.setPos(x, y);
            this.flipX = flipX || false;
            this.flipY = flipY || false;
            this.bottomAnchor = bottomAnchor || false
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, 0, 0, this.bottomAnchor ? 444 : 434, 337, 9, 15, this.flipX, this.flipY)
        }
    });
    var focusFrames = [0.1, 0.1, 0.1, 0.1],
        focusFrameOffsets = [0, 0, 0, 0],
        submitSound = sc.BUTTON_SOUND.submit,
        screenPos = Vec2.createC(0, 0);
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
        init: function(entity, callback) {
            this.parent(true, false);
            this.setSize(16, 16);
            this.setPivot(8, 8);
            this.entity = entity;
            this.callback = callback;
            this.origin = entity.map == ig.game.previousMap;
            this.icon = this.entity.icon * 24;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", false, false, function() {}.bind(this))
        },
        onButtonPress: function() {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var mouseY = Math.floor(sc.control.getMouseY());
                if (mouseY <= 21 || mouseY >= 299) return
            }
            submitSound.play();
            this.callback.onButtonPress(this.entity)
        },
        update: function() {
            if (this.focus) {
                this.focusTimer = this.focusTimer + ig.system.actualTick;
                if (this.focusTimer >= focusFrames[this.focusFrame]) {
                    this.focusFrame = (this.focusFrame + 1) % focusFrameOffsets.length;
                    this.focusTimer = 0
                }
            }
        },
        updateDrawables: function(drawables) {
            this.focus && drawables.addGfx(this.gfx, -this.hook.pivot.x, -this.hook.pivot.y, 144 + 32 * focusFrameOffsets[this.focusFrame],
                0, 32, 32).setCompositionMode("lighter");
            drawables.addGfx(this.gfx, this.hook.pivot.x - 12, this.hook.pivot.y - 12, 144 + this.icon, 48 + (this.origin ? 24 : 0), 24, 24);
            this.origin && drawables.addGfx(this.gfx, -21, -13, 208, 32, 22, 17)
        },
        isMouseOver: function() {
            if (!ig.interact.isBlocked()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var distance = this.getDistanceToCursor();
                    if (this.callback._cursorMoved) {
                        this.callback.unfocus(this);
                        return false
                    }
                    if (distance <= 10) {
                        distance = this.hook;
                        this.callback.focusLocation(distance.pos.x + Math.floor(distance.size.x / 2) - 1, distance.pos.y + Math.floor(distance.size.y /
                            2) + 1, this, true);
                        return true
                    }
                    this.callback.unfocus(this)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY()),
                        hook = this.hook;
                    (mouseX = mouseX >= hook.pos.x && mouseX <= hook.pos.x + hook.size.x && mouseY >= hook.pos.y && mouseY <= hook.pos.y + hook.size.y) ? this.callback.focusLocation(hook.pos.x + Math.floor(hook.size.x / 2) - 1, hook.pos.y + Math.floor(hook.size.y / 2) + 1, this): this.callback.unfocus(this);
                    return mouseX
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
