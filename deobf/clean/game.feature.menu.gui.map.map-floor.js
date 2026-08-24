/**
 * game.feature.menu.gui.map.map-floor
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.map.map-floor")`.
 *
 * `sc.MapRoom`: a single unlocked room on the map, prerendered into an atlas
 * fragment (tile autotiling via neighbor patterns, area connections, active
 * room highlight).
 * `sc.MapIcon`: an area-transition icon (up/down/left/right) with optional
 * area-name label.
 * `sc.MapFloor`: one floor of the current area — hosts its rooms and icons,
 * handles floor show/hide and floor-change transitions.
 */
ig.module("game.feature.menu.gui.map.map-floor")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.area-loadable")
    .defines(function () {

    function drawConnection(x, y, gfx, connection, reverse) {
        connectionData = sc.AREA_CONNECTIONS[connection.dir];
        spritePart = reverse ? connectionData.second : connectionData.first;
        if (connection.offset) {
            offsetPos.x = connection.offset.x;
            offsetPos.y = connection.offset.y
        } else {
            offsetPos.x = 0;
            offsetPos.y = 0
        }
        tilePos.x = x;
        tilePos.y = y;
        var steps = Math.max(0, connection.size - 1);
        gfx.draw(tilePos.x + spritePart.ox + offsetPos.x, tilePos.y + spritePart.oy + offsetPos.y, spritePart.x, spritePart.y, spritePart.w2, spritePart.h2);
        tilePos.x = tilePos.x + connectionData.step.x;
        for (tilePos.y = tilePos.y + connectionData.step.y; steps--;) {
            gfx.draw(tilePos.x + spritePart.ox + offsetPos.x, tilePos.y + spritePart.oy + offsetPos.y, 281, 411, spritePart.w, spritePart.h);
            tilePos.x = tilePos.x + connectionData.step.x2;
            tilePos.y = tilePos.y + connectionData.step.y2
        }
        gfx.draw(tilePos.x + spritePart.ox + offsetPos.x, tilePos.y + spritePart.oy + offsetPos.y, spritePart.x + connectionData.step.x, spritePart.y + connectionData.step.y, spritePart.w2, spritePart.h2)
    }

    function drawTile(x, y, gfx, pattern) {
        pattern.fill && gfx.draw(x, y, 284, 412, 8, 8);
        if (pattern.offset) {
            tilePos.x = pattern.offset.x;
            tilePos.y = pattern.offset.y
        } else {
            tilePos.x = 0;
            tilePos.y = 0
        }
        gfx.draw(x + tilePos.x, y + tilePos.y, pattern.src.x, pattern.src.y, pattern.size[0], pattern.size[1]);
        pattern.src2 && gfx.draw(x + pattern.offset2.x, y + pattern.offset2.y, pattern.src2.x, pattern.src2.y, pattern.size[2], pattern.size[3])
    }

    function getNeighborMatch(x, y, tiles, roomId) {
        return x < 0 || y < 0 || x >= tiles[0].length || y >= tiles.length ? 0 : tiles[y][x] == roomId ? 1 : 0
    }

    sc.MapRoom = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        room: null,
        buffer: null,
        floor: null,
        name: "default_empty",
        id: 0,
        roomAlpha: 1,
        tileWidth: 0,
        tileHeight: 0,
        active: false,
        unlocked: false,
        prerendered: false,

        init: function (room, floor, id) {
            this.parent();
            this.room = room;
            this.name = room.name.toCamel().toPath("", "");
            this.unlocked = ig.vars.storage.maps[this.name] ? true : false;
            this.floor = floor;
            this.id = id;
            var isActive = room.name == sc.map.currentMap;
            room.zMin != void 0 && (isActive = isActive && ig.game.playerEntity.coll.level >= room.zMin);
            room.zMax != void 0 && (isActive = isActive && ig.game.playerEntity.coll.level <= room.zMax);
            this.active = isActive;
            this.tileWidth = Math.max(0, room.max.x - room.min.x);
            this.tileHeight = Math.max(0, room.max.y - room.min.y);
            this.setPos(room.min.x * 8, room.min.y * 8);
            this.setSize(this.tileWidth * 8, this.tileHeight * 8)
        },

        onVisibilityChange: function (visible) {
            visible ? this.preRender() : this.clearPrerendered()
        },

        onDetach: function () {
            this.clearPrerendered()
        },

        updateDrawables: function (renderer) {
            this.prerendered && renderer.addGfx(this.buffer, 0, 0, 0, 0).setAlpha(this.roomAlpha)
        },

        preRender: function () {
            if (!this.prerendered && this.unlocked) {
                this.buffer = ig.imageAtlas.getFragment(this.tileWidth * 8, this.tileHeight * 8, function () {
                    for (var room = this.room, tiles = this.floor.tiles, connections = this.floor.connections, gfx = this.gfx, isActive = this.active, roomId = room.id, x = 0, y = 0, pattern = null, patternIndex = 0, cornerIndex = 0, matched = true, neighborMatches = null, neighborOffsets = NEIGHBOR_OFFSETS, context = ig.system.context, neighborValues = [], row = room.min.y; row < room.max.y; row++) {
                        for (var x = 0, col = room.min.x; col < room.max.x; col++) {
                            if (tiles[row][col] == roomId) {
                                for (patternIndex = 0; patternIndex < neighborOffsets.length; ++patternIndex) neighborValues[patternIndex] = getNeighborMatch(col + neighborOffsets[patternIndex].x, row + neighborOffsets[patternIndex].y, tiles, roomId);
                                for (patternIndex = TILE_PATTERNS.length; patternIndex--;) {
                                    pattern = TILE_PATTERNS[patternIndex];
                                    neighborMatches = pattern.check;
                                    matched = true;
                                    for (cornerIndex = CORNER_INDICES.length; cornerIndex--;)
                                        if (neighborMatches[cornerIndex] != neighborValues[CORNER_INDICES[cornerIndex]]) {
                                            matched = false;
                                            break
                                        }
                                    if (matched) {
                                        drawTile(x, y, gfx, pattern);
                                        break
                                    }
                                }
                                for (patternIndex = CORNER_PATTERNS.length; patternIndex--;) {
                                    pattern = CORNER_PATTERNS[patternIndex];
                                    neighborMatches = pattern.check;
                                    matched = true;
                                    for (cornerIndex = neighborValues.length; cornerIndex--;)
                                        if (neighborMatches[cornerIndex] != -1 && neighborMatches[cornerIndex] != neighborValues[cornerIndex]) {
                                            matched = false;
                                            break
                                        }
                                    matched && drawTile(x, y, gfx, pattern)
                                }
                            }
                            x = x + 8
                        }
                        y = y + 8
                    }
                    var connectionCount = connections.length;
                    for (var condition = new ig.VarCondition(""); connectionCount--;) {
                        var connection = connections[connectionCount];
                        if (connection.map1 + 1 == roomId || connection.map2 + 1 == roomId)
                            if (connection.condition != void 0) {
                                condition.setCondition(connection.condition);
                                condition.evaluate() && drawConnection((connection.tx - room.min.x) * 8, (connection.ty - room.min.y) * 8, gfx, connection, connection.map2 + 1 == roomId)
                            } else drawConnection((connection.tx - room.min.x) * 8, (connection.ty - room.min.y) * 8, gfx, connection, connection.map2 + 1 == roomId)
                    }
                    if (isActive) {
                        y = 0;
                        for (row = room.min.y; row < room.max.y; row++) {
                            x = 0;
                            for (col = room.min.x; col < room.max.x; col++) {
                                if (tiles[row][col] == roomId) {
                                    var drawX = x;
                                    var drawY = y;
                                    var tileGfx = gfx;
                                    var ctx = context;
                                    var openRight = getNeighborMatch(col + 1, row, tiles, roomId) != 1;
                                    var openDown = getNeighborMatch(col, row + 1, tiles, roomId) != 1;
                                    var prevAlpha = ctx.globalAlpha;
                                    ctx.globalAlpha = ctx.globalAlpha * 0.3;
                                    tileGfx.draw(drawX, drawY, 292, 436, 8 - (openRight ? 1 : 0), 8 - (openDown ? 1 : 0));
                                    ctx.globalAlpha = prevAlpha
                                }
                                x = x + 8
                            }
                            y = y + 8
                        }
                    }
                }.bind(this));
                this.prerendered = true
            }
        },

        clearPrerendered: function () {
            if (this.prerendered) {
                this.buffer.release();
                this.buffer = null;
                this.prerendered = false
            }
        }
    });

    sc.MapIcon = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/area-icons.png"),
        offsetX: 0,
        offsetY: 0,
        map: 0,
        icon: "",

        init: function (x, y, iconKey, map, data) {
            this.parent();
            var columns = Math.floor(this.gfx.width / 12);
            this.icon = sc.AREA_ICONS[iconKey] || sc.AREA_ICONS.arrow_up;
            var iconIndex = this.icon.index;
            this.map = map || null;
            this.offsetX = iconIndex % columns * 12;
            this.offsetY = Math.floor(iconIndex / columns) * 12;
            this.setPos(x - 6, y - 6);
            this.setSize(12, 12);
            var type = this.icon.type;
            if (type == sc.AREA_ICON_TYPE.LARGE) {
                this.setPos(x - this.icon.width / 2, y - this.icon.height / 2);
                this.setSize(this.icon.width, this.icon.height)
            }
            data && this.map && this.map.unlocked && type == sc.AREA_ICON_TYPE.AREA && data.area && this.createAreaName(data, iconKey, x, y)
        },

        updateDrawables: function (renderer) {
            this.map && this.map.unlocked && (this.icon.type == sc.AREA_ICON_TYPE.LARGE ? renderer.addGfx(this.gfx, 0, 0, this.icon.sx, this.icon.sy, this.icon.width, this.icon.height) : renderer.addGfx(this.gfx, this.hook.size.x / 2 - 6, 0, this.offsetX, this.offsetY, 12, 12))
        },

        createAreaName: function (data, iconKey, x, y) {
            var name = "???";
            data.map && ig.vars.storage.maps[data.map.toCamel().toPath("", "")] && (name = sc.map.getAreaName(data.area));
            var labelBg = new ig.ColorGui("black");
            labelBg.hook.localAlpha = 0.5;
            var label = new sc.TextGui(name, {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            labelBg.setSize(label.hook.size.x + 4, label.hook.size.y + 2);
            switch (iconKey) {
                case "area_up":
                    labelBg.setPos(0, -(labelBg.hook.size.y + 1));
                    labelBg.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    break;
                case "area_down":
                    labelBg.setPos(0, 13);
                    labelBg.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    break;
                case "area_left":
                    labelBg.setPos(labelBg.hook.size.x / 2 - 6 - (labelBg.hook.size.x + 1), 1);
                    labelBg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
                    break;
                case "area_right":
                    labelBg.setPos(labelBg.hook.size.x / 2 - 6 + 13, 1);
                    labelBg.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
            }
            if (data.offset) {
                labelBg.hook.pos.x = labelBg.hook.pos.x + data.offset.x;
                labelBg.hook.pos.y = labelBg.hook.pos.y + data.offset.y
            }
            labelBg.addChildGui(label);
            this.addChildGui(labelBg);
            this.setSize(labelBg.hook.size.x, labelBg.hook.size.y);
            this.setPos(x - this.hook.size.x / 2, y - 6)
        }
    });

    sc.MapFloor = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.4,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_FAST: {
                state: {
                    alpha: 0
                },
                time: 0.4,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        floor: null,
        name: "",
        nameGui: null,
        leaGui: null,
        rooms: null,
        activeRoom: null,
        callback: null,
        bounds: {
            x: 1E5,
            y: 1E5,
            width: -1,
            height: -1
        },

        init: function (floor, callback) {
            this.parent();
            this.callback = callback || null;
            this.floor = floor;
            this.name = floor.name ? ig.LangLabel.getText(floor.name) : "";
            this.rooms = this.floor.rooms;
            this.setPos(0, 0);
            this.setSize(floor.tiles[0].length * 8, floor.tiles.length * 8);
            this.doStateTransition("HIDDEN", true)
        },

        onAttach: function () {
            var rooms = this._createRooms();
            if (this.activeRoom) {
                this.leaGui = new sc.MapCurrentRoomWrapper(this.activeRoom);
                this.addChildGui(this.leaGui)
            }
            this._createIcons(rooms);
            this.callback && this.callback(true, this, rooms)
        },

        update: function () {},

        updateDrawables: function () {},

        showFloor: function () {
            this.addObservers();
            this.doStateTransition("DEFAULT");
            this.calculateOpacity(true, true)
        },

        hideFloor: function () {
            this.removeObservers();
            this.doStateTransition("HIDDEN")
        },

        calculateOpacity: function (instant, noChange) {
            sc.map.currentFloor != this.floor.level ? this.doStateTransition("HIDDEN_FAST", instant) : noChange || this.doStateTransition("DEFAULT", instant)
        },

        calculatePosOffset: function () {
            this.doPosTranstition(this.hook.pos.x, (sc.map.currentFloor - this.floor.level) * 8, 0.3, KEY_SPLINES.EASE)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu && event == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                this.calculatePosOffset();
                this.calculateOpacity(false)
            }
        },

        _updateAlphaOnRooms: function () {
            for (var children = this.hook.children, i = children.length; i--;)
                if (children[i].gui.roomAlpha != void 0) children[i].gui.roomAlpha = this._alpha
        },

        _createIcons: function (rooms) {
            for (var room = null, icon = null, i = this.floor.icons.length, condition = new ig.VarCondition; i--;) {
                var iconData = this.floor.icons[i],
                    iconCondition = iconData.data ? iconData.data.condition : null;
                if (iconCondition) {
                    condition.setCondition(iconCondition);
                    if (!condition.evaluate()) continue
                }
                icon = new sc.MapIcon(iconData.x, iconData.y, iconData.icon, rooms[iconData.map], iconData.data);
                this.addChildGui(icon)
            }
        },

        _createRooms: function () {
            for (var room = null, roomGui = null, rooms = [], activeHooks = [], i = 0; i < this.rooms.length; i++)
                if (room = this.rooms[i]) {
                    roomGui = new sc.MapRoom(room, this.floor, this.floor.level);
                    if (roomGui.active) {
                        this.activeRoom = roomGui.hook;
                        activeHooks.push(roomGui.hook)
                    }
                    if (roomGui.unlocked) {
                        if (roomGui.hook.pos.y < this.bounds.y) this.bounds.y = roomGui.hook.pos.y;
                        if (roomGui.hook.pos.y < this.bounds.x) this.bounds.x = roomGui.hook.pos.x;
                        if (roomGui.hook.pos.x + roomGui.hook.size.x > this.bounds.width) this.bounds.width = roomGui.hook.pos.x + roomGui.hook.size.x;
                        if (roomGui.hook.pos.y + roomGui.hook.size.y > this.bounds.height) this.bounds.height = roomGui.hook.pos.y + roomGui.hook.size.y
                    }
                    rooms[room.id - 1] = roomGui
                }
            if (activeHooks.length >= 2) {
                var wrapper = new ig.GuiElementBase;
                var bounds = this.getBounds(activeHooks);
                wrapper.hook.pos.x = bounds.x;
                wrapper.hook.pos.y = bounds.y;
                wrapper.hook.size.x = bounds.width;
                wrapper.hook.size.y = bounds.height;
                this.activeRoom = wrapper.hook
            }
            for (i = 0; i < rooms.length; i++) rooms[i] && rooms[i].unlocked && this.addChildGui(rooms[i]);
            this.bounds.width = this.bounds.width - this.bounds.x;
            this.bounds.height = this.bounds.height - this.bounds.y;
            return rooms
        },

        getBounds: function (hooks) {
            var minX = hooks[0].pos.x,
                minY = hooks[0].pos.y,
                maxX = minX + hooks[0].size.x,
                maxY = minY + hooks[0].size.y,
                i = 1;
            for (; i < hooks.length; i++) {
                if (hooks[i].pos.x < minX) minX = hooks[i].pos.x;
                if (hooks[i].pos.y < minY) minY = hooks[i].pos.y;
                hooks[i].pos.x + hooks[i].size.x > maxX && (maxX = hooks[i].pos.x + hooks[i].size.x);
                hooks[i].pos.y + hooks[i].size.y > maxY && (maxY = hooks[i].pos.y + hooks[i].size.y)
            }
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            }
        }
    });

    var tilePos = Vec2.createC(0, 0),
        connectionData = null,
        spritePart = false,
        offsetPos = Vec2.createC(0, 0),
        NEIGHBOR_OFFSETS = [{
            x: -1,
            y: -1
        }, {
            x: 0,
            y: -1
        }, {
            x: 1,
            y: -1
        }, {
            x: -1,
            y: 0
        }, {
            x: 1,
            y: 0
        }, {
            x: -1,
            y: 1
        }, {
            x: 0,
            y: 1
        }, {
            x: 1,
            y: 1
        }],
        CORNER_INDICES = [1, 3, 4, 6],
        TILE_PATTERNS = [{
            check: [0, 0, 0, 0],
            src: {
                x: 304,
                y: 408
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 1, 1, 1],
            src: {
                x: 284,
                y: 412
            },
            size: [8, 8],
            fill: false
        }, {
            check: [0, 0, 1, 1],
            src: {
                x: 280,
                y: 408
            },
            size: [8, 8],
            fill: false
        }, {
            check: [0, 1, 0, 1],
            src: {
                x: 288,
                y: 408
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 0, 1, 0],
            src: {
                x: 280,
                y: 416
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 1, 0, 0],
            src: {
                x: 288,
                y: 416
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 0, 1, 1],
            src: {
                x: 280,
                y: 412
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 1, 0, 1],
            src: {
                x: 288,
                y: 412
            },
            size: [8, 8],
            fill: false
        }, {
            check: [1, 1, 1, 0],
            src: {
                x: 284,
                y: 416
            },
            size: [8, 8],
            fill: false
        }, {
            check: [0, 1, 1, 1],
            src: {
                x: 284,
                y: 408
            },
            size: [8, 8],
            fill: false
        }, {
            check: [0, 1, 1, 0],
            src: {
                x: 284,
                y: 408
            },
            size: [8, 4, 8, 4],
            src2: {
                x: 284,
                y: 420
            },
            offset2: {
                x: 0,
                y: 4
            },
            fill: false
        }, {
            check: [1, 0, 0, 1],
            src: {
                x: 280,
                y: 412
            },
            size: [4, 8, 4, 8],
            src2: {
                x: 292,
                y: 412
            },
            offset2: {
                x: 4,
                y: 0
            },
            fill: false
        }, {
            check: [0, 1, 0, 0],
            src: {
                x: 288,
                y: 408
            },
            size: [8, 4, 8, 4],
            src2: {
                x: 288,
                y: 420
            },
            offset2: {
                x: 0,
                y: 4
            },
            fill: false
        }, {
            check: [0, 0, 1, 0],
            src: {
                x: 280,
                y: 408
            },
            size: [8, 4, 8, 4],
            src2: {
                x: 280,
                y: 420
            },
            offset2: {
                x: 0,
                y: 4
            },
            fill: false
        }, {
            check: [0, 0, 0, 1],
            src: {
                x: 280,
                y: 408
            },
            size: [4, 8, 4, 8],
            src2: {
                x: 292,
                y: 408
            },
            offset2: {
                x: 4,
                y: 0
            },
            fill: false
        }, {
            check: [1, 0, 0, 0],
            src: {
                x: 280,
                y: 416
            },
            size: [4, 8, 4, 8],
            src2: {
                x: 292,
                y: 416
            },
            offset2: {
                x: 4,
                y: 0
            },
            fill: false
        }],
        CORNER_PATTERNS = [{
            check: [-1, -1, -1, 1, -1, 0, 1, -1],
            src: {
                x: 296,
                y: 412
            },
            size: [4, 4],
            offset: {
                x: 0,
                y: 4
            }
        }, {
            check: [-1, -1, -1, -1, 1, -1, 1, 0],
            src: {
                x: 300,
                y: 412
            },
            size: [4, 4],
            offset: {
                x: 4,
                y: 4
            }
        }, {
            check: [0, 1, -1, 1, -1, -1, -1, -1],
            src: {
                x: 296,
                y: 408
            },
            size: [4, 4],
            offset: {
                x: 0,
                y: 0
            }
        }, {
            check: [-1, 1, 0, -1, 1, -1, -1, -1],
            src: {
                x: 300,
                y: 408
            },
            size: [4, 4],
            offset: {
                x: 4,
                y: 0
            }
        }]
});
ig.baked = !0;
