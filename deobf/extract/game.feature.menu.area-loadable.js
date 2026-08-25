ig.module("game.feature.menu.area-loadable").requires("impact.base.game", "impact.base.loader").defines(function() {
    function b(a, c, e, f, g) {
        var h;
        h = f < 0 ? false : e < 0 ? false : f >= c.length ? false : e >= c[0].length ? false : c[f][e] == g;
        if (h) {
            c[f][e] = c[f][e] + 1E4;
            a.min.x = Math.min(a.min.x, e);
            a.min.y = Math.min(a.min.y, f);
            a.max.x = Math.max(a.max.x, e);
            a.max.y = Math.max(a.max.y, f);
            b(a, c, e - 1, f, g);
            b(a, c, e + 1, f, g);
            b(a, c, e, f - 1, g);
            b(a, c, e, f + 1, g)
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
        init: function(a, c, e, f, g) {
            this.name = a.path || "default_empty";
            this.text = a.name ? ig.LangLabel.getText(a.name) || "???" : "???";
            this.id = c || 1;
            this.offset.x = a.offset ? a.offset.x : 0;
            this.offset.y = a.offset ? a.offset.y : 0;
            this.min.x = this.max.x =
                e || 0;
            this.min.y = this.max.y = f || 0;
            this.zMin = a.zMin;
            this.zMax = a.zMax;
            b(this, g, e, f, this.id);
            this.max.x++;
            this.max.y++
        }
    });
    var a = [];
    sc.AreaLoadable = ig.Loadable.extend({
        cacheType: "AreaMap",
        data: null,
        lowestFloor: 0,
        init: function(a) {
            this.parent(a)
        },
        loadInternal: function(a) {
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(ig.root + a.toPath("data/areas/", ".json") + ig.getCacheSuffix()),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.data = null;
            this.loadingFinished(false)
        },
        onload: function(a) {
            this.data = a;
            this._createRooms();
            this.loadingFinished(true)
        },
        _createRooms: function() {
            for (var b = this.data.floors, c = null, e = null, f = [], g = b.length; g--;) {
                e = b[g];
                if (e.level < this.lowestFloor) this.lowestFloor = e.level;
                a.length = 0;
                f = [];
                if ((c = e.tiles) && c[0][0] != void 0) {
                    for (var h = 0; h < c.length; h++)
                        for (var i = 0; i < c[h].length; i++) {
                            c[h][i] > 1E4 && (c[h][i] = c[h][i] - 1E4);
                            if (c[h][i] != 0 && !a[c[h][i]]) {
                                a[c[h][i]] = 1;
                                f.push(new sc.AreaRoomBounds(e.maps[c[h][i] - 1], c[h][i], i, h, c));
                                c[h][i] > 1E4 && (c[h][i] = c[h][i] -
                                    1E4)
                            }
                        }
                    e.rooms = f
                } else console.error("Tiles must by a two dimensional Array! Tiles: %O", c)
            }
        }
    })
});
ig.baked = !0;
