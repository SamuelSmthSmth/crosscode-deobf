/**
 * game.feature.menu.area-loadable
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.area-loadable")`.
 *
 * Loads the area JSON (`data/areas/*.json`) and derives room bounds from
 * the floor tile maps via flood fill:
 * - `sc.AreaRoomBounds`: bounding box + map/name/id for one room on a floor.
 * - `sc.AreaLoadable`: `ig.Loadable` subclass that fetches the area file and
 *   computes `floors[].rooms`.
 * - `sc.AREA_ICONS` / `sc.AREA_CONNECTIONS`: data tables for the map-menu
 *   area icons (arrows, shops, chests, ...) and connection strip rendering.
 */
ig.module("game.feature.menu.area-loadable")
    .requires("impact.base.game", "impact.base.loader")
    .defines(function () {

    function floodFillRoom(bounds, tiles, x, y, roomId) {
        var hit;
        hit = y < 0 ? false : x < 0 ? false : y >= tiles.length ? false : x >= tiles[0].length ? false : tiles[y][x] == roomId;
        if (hit) {
            tiles[y][x] = tiles[y][x] + 1E4;
            bounds.min.x = Math.min(bounds.min.x, x);
            bounds.min.y = Math.min(bounds.min.y, y);
            bounds.max.x = Math.max(bounds.max.x, x);
            bounds.max.y = Math.max(bounds.max.y, y);
            floodFillRoom(bounds, tiles, x - 1, y, roomId);
            floodFillRoom(bounds, tiles, x + 1, y, roomId);
            floodFillRoom(bounds, tiles, x, y - 1, roomId);
            floodFillRoom(bounds, tiles, x, y + 1, roomId)
        }
    }

    sc.AREA_ICON_TYPE = {
        AREA: 1,
        LARGE: 2
    };

    sc.AREA_ICONS = {
        arrow_up: {
            index: 0,
            pivotY: 6
        },
        arrow_down: {
            index: 1,
            pivotY: -5
        },
        floor_down: {
            index: 4,
            pivotY: -5
        },
        arrow_left: {
            index: 2,
            pivotY: -2
        },
        arrow_right: {
            index: 3,
            pivotY: -2
        },
        shop: {
            index: 14
        },
        trader: {
            index: 15
        },
        pub: {
            index: 3
        },
        weapons: {
            index: 5
        },
        quest: {
            index: 6
        },
        quest_hub: {
            index: 16
        },
        entrance: {
            index: 7
        },
        chest: {
            index: 8
        },
        area_up: {
            index: 10,
            pivotY: 6,
            type: sc.AREA_ICON_TYPE.AREA,
            _wm: {
                area: {
                    _type: "Select",
                    _info: "Area this leads to",
                    _select: "areas"
                },
                map: {
                    _type: "Maps",
                    _info: "The map this points to"
                },
                offset: {
                    _type: "Vec2",
                    _info: "optional offset",
                    _optional: true
                },
                condition: {
                    _type: "VarCondition",
                    _info: "condition fir the icon to show up",
                    _optional: true
                }
            }
        },
        area_down: {
            index: 11,
            pivotY: -6,
            type: sc.AREA_ICON_TYPE.AREA,
            _wm: {
                area: {
                    _type: "Select",
                    _info: "Area this leads to",
                    _select: "areas"
                },
                map: {
                    _type: "Maps",
                    _info: "The map this points to"
                },
                offset: {
                    _type: "Vec2",
                    _info: "optional offset",
                    _optional: true
                }
            }
        },
        area_left: {
            index: 12,
            pivotX: 6,
            type: sc.AREA_ICON_TYPE.AREA,
            _wm: {
                area: {
                    _type: "Select",
                    _info: "Area this leads to",
                    _select: "areas"
                },
                map: {
                    _type: "Maps",
                    _info: "The map this points to"
                },
                offset: {
                    _type: "Vec2",
                    _info: "optional offset",
                    _optional: true
                }
            }
        },
        area_right: {
            index: 13,
            pivotX: -6,
            type: sc.AREA_ICON_TYPE.AREA,
            _wm: {
                area: {
                    _type: "Select",
                    _info: "Area this leads to",
                    _select: "areas"
                },
                map: {
                    _type: "Maps",
                    _info: "The map this points to"
                },
                offset: {
                    _type: "Vec2",
                    _info: "optional offset",
                    _optional: true
                }
            }
        },
        ferro: {
            index: 17
        },
        gate: {
            index: 40,
            type: sc.AREA_ICON_TYPE.LARGE,
            width: 80,
            height: 56,
            sx: 0,
            sy: 48,
            pivotY: 27
        }
    };

    sc.AREA_CONNECTIONS = {
        VERTICAL: {
            first: {
                x: 304,
                y: 416,
                w: 8,
                h: 2,
                ox: 0,
                oy: 6,
                w2: 4,
                h2: 2
            },
            second: {
                x: 304,
                y: 418,
                w: 8,
                h: 3,
                ox: 0,
                oy: 8,
                w2: 4,
                h2: 3
            },
            step: {
                x: 4,
                y: 0,
                x2: 8,
                y2: 0
            }
        },
        HORIZONTAL: {
            first: {
                x: 296,
                y: 416,
                w: 3,
                h: 8,
                ox: 5,
                oy: 0,
                w2: 3,
                h2: 4
            },
            second: {
                x: 299,
                y: 416,
                w: 2,
                h: 8,
                ox: 8,
                oy: 0,
                w2: 2,
                h2: 4
            },
            step: {
                x: 0,
                y: 4,
                x2: 0,
                y2: 8
            }
        }
    };

    sc.AreaRoomBounds = ig.Class.extend({
        zMin: 0,
        zMax: 0,
        min: {
            x: 0,
            y: 0
        },
        max: {
            x: 0,
            y: 0
        },
        offset: {
            x: 0,
            y: 0
        },
        name: "default_empty",
        text: "???",
        id: 1,

        init: function (mapData, id, startX, startY, tiles) {
            this.name = mapData.path || "default_empty";
            this.text = mapData.name ? ig.LangLabel.getText(mapData.name) || "???" : "???";
            this.id = id || 1;
            this.offset.x = mapData.offset ? mapData.offset.x : 0;
            this.offset.y = mapData.offset ? mapData.offset.y : 0;
            this.min.x = this.max.x = startX || 0;
            this.min.y = this.max.y = startY || 0;
            this.zMin = mapData.zMin;
            this.zMax = mapData.zMax;
            floodFillRoom(this, tiles, startX, startY, this.id);
            this.max.x++;
            this.max.y++
        }
    });

    var roomSeen = [];

    sc.AreaLoadable = ig.Loadable.extend({
        cacheType: "AreaMap",
        data: null,
        lowestFloor: 0,

        init: function (area) {
            this.parent(area)
        },

        loadInternal: function (area) {
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(ig.root + area.toPath("data/areas/", ".json") + ig.getCacheSuffix()),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },

        onerror: function () {
            this.data = null;
            this.loadingFinished(false)
        },

        onload: function (data) {
            this.data = data;
            this._createRooms();
            this.loadingFinished(true)
        },

        _createRooms: function () {
            for (var floors = this.data.floors, floor = null, tiles = null, rooms = [], i = floors.length; i--;) {
                floor = floors[i];
                if (floor.level < this.lowestFloor) this.lowestFloor = floor.level;
                roomSeen.length = 0;
                rooms = [];
                if ((tiles = floor.tiles) && tiles[0][0] != void 0) {
                    for (var y = 0; y < tiles.length; y++)
                        for (var x = 0; x < tiles[y].length; x++) {
                            if (tiles[y][x] > 1E4) tiles[y][x] = tiles[y][x] - 1E4;
                            if (tiles[y][x] != 0 && !roomSeen[tiles[y][x]]) {
                                roomSeen[tiles[y][x]] = 1;
                                rooms.push(new sc.AreaRoomBounds(floor.maps[tiles[y][x] - 1], tiles[y][x], x, y, tiles));
                                if (tiles[y][x] > 1E4) tiles[y][x] = tiles[y][x] - 1E4
                            }
                        }
                    floor.rooms = rooms
                } else console.error("Tiles must by a two dimensional Array! Tiles: %O", tiles)
            }
        }
    })
});
ig.baked = !0;
