ig.module("game.feature.menu.gui.map.map-floor").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.area-loadable").defines(function() {
    function b(a, b, d, h, i) {
        e = sc.AREA_CONNECTIONS[h.dir];
        f = i ? e.second : e.first;
        if (h.offset) {
            g.x = h.offset.x;
            g.y = h.offset.y
        } else {
            g.x = 0;
            g.y = 0
        }
        c.x = a;
        c.y = b;
        a = Math.max(0, h.size - 1);
        d.draw(c.x + f.ox + g.x, c.y + f.oy + g.y, f.x, f.y, f.w2, f.h2);
        c.x = c.x + e.step.x;
        for (c.y = c.y + e.step.y; a--;) {
            d.draw(c.x + f.ox + g.x, c.y + f.oy + g.y, 281, 411, f.w, f.h);
            c.x = c.x + e.step.x2;
            c.y = c.y + e.step.y2
        }
        d.draw(c.x + f.ox + g.x, c.y + f.oy + g.y, f.x + e.step.x, f.y + e.step.y, f.w2, f.h2)
    }

    function a(a, b, d, e) {
        e.fill && d.draw(a, b, 284, 412, 8, 8);
        if (e.offset) {
            c.x = e.offset.x;
            c.y = e.offset.y
        } else {
            c.x = 0;
            c.y = 0
        }
        d.draw(a + c.x, b + c.y, e.src.x, e.src.y, e.size[0], e.size[1]);
        e.src2 && d.draw(a + e.offset2.x, b + e.offset2.y, e.src2.x, e.src2.y, e.size[2], e.size[3])
    }

    function d(a, b, c, d) {
        return a < 0 || b < 0 || a >= c[0].length || b >= c.length ? 0 : c[b][a] == d ? 1 : 0
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
        init: function(a, b, c) {
            this.parent();
            this.room = a;
            this.name = a.name.toCamel().toPath("", "");
            this.unlocked = ig.vars.storage.maps[this.name] ? true : false;
            this.floor = b;
            this.id = c;
            b = a.name == sc.map.currentMap;
            a.zMin != void 0 && (b = b && ig.game.playerEntity.coll.level >= a.zMin);
            a.zMax != void 0 && (b = b && ig.game.playerEntity.coll.level <= a.zMax);
            this.active = b;
            this.tileWidth = Math.max(0, a.max.x -
                a.min.x);
            this.tileHeight = Math.max(0, a.max.y - a.min.y);
            this.setPos(a.min.x * 8, a.min.y * 8);
            this.setSize(this.tileWidth * 8, this.tileHeight * 8)
        },
        onVisibilityChange: function(a) {
            a ? this.preRender() : this.clearPrerendered()
        },
        onDetach: function() {
            this.clearPrerendered()
        },
        updateDrawables: function(a) {
            this.prerendered && a.addGfx(this.buffer, 0, 0, 0, 0).setAlpha(this.roomAlpha)
        },
        preRender: function() {
            if (!this.prerendered && this.unlocked) {
                this.buffer = ig.imageAtlas.getFragment(this.tileWidth * 8, this.tileHeight * 8, function() {
                    for (var c =
                            this.room, e = this.floor.tiles, f = this.floor.connections, g = this.gfx, p = this.active, r = c.id, t = 0, q = 0, s = null, v = 0, y = 0, u = true, z = null, D = h, C = ig.system.context, A = [], B = c.min.y; B < c.max.y; B++) {
                        for (var t = 0, w = c.min.x; w < c.max.x; w++) {
                            if (e[B][w] == r) {
                                for (v = 0; v < D.length; ++v) A[v] = d(w + D[v].x, B + D[v].y, e, r);
                                for (v = j.length; v--;) {
                                    z = j[v];
                                    s = z.check;
                                    u = true;
                                    for (y = i.length; y--;)
                                        if (s[y] != A[i[y]]) {
                                            u = false;
                                            break
                                        } if (u) {
                                        a(t, q, g, z);
                                        break
                                    }
                                }
                                for (v = k.length; v--;) {
                                    z = k[v];
                                    s = z.check;
                                    u = true;
                                    for (y = A.length; y--;)
                                        if (s[y] != -1 && s[y] != A[y]) {
                                            u = false;
                                            break
                                        } u && a(t, q, g, z)
                                }
                            }
                            t = t + 8
                        }
                        q = q + 8
                    }
                    v = f.length;
                    for (t = new ig.VarCondition(""); v--;) {
                        s = f[v];
                        if (s.map1 + 1 == r || s.map2 + 1 == r)
                            if (s.condition != void 0) {
                                t.setCondition(s.condition);
                                t.evaluate() && b((s.tx - c.min.x) * 8, (s.ty - c.min.y) * 8, g, s, s.map2 + 1 == r)
                            } else b((s.tx - c.min.x) * 8, (s.ty - c.min.y) * 8, g, s, s.map2 + 1 == r)
                    }
                    if (p) {
                        q = 0;
                        for (B = c.min.y; B < c.max.y; B++) {
                            t = 0;
                            for (w = c.min.x; w < c.max.x; w++) {
                                if (e[B][w] == r) {
                                    f = t;
                                    p = q;
                                    s = g;
                                    v = C;
                                    y = d(w + 1, B, e, r) != 1;
                                    u = d(w, B + 1, e, r) != 1;
                                    z = v.globalAlpha;
                                    v.globalAlpha = v.globalAlpha * 0.3;
                                    s.draw(f, p, 292, 436, 8 - (y ?
                                        1 : 0), 8 - (u ? 1 : 0));
                                    v.globalAlpha = z
                                }
                                t = t + 8
                            }
                            q = q + 8
                        }
                    }
                }.bind(this));
                this.prerendered = true
            }
        },
        clearPrerendered: function() {
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
        init: function(a, b, c, d, e) {
            this.parent();
            var f = Math.floor(this.gfx.width / 12);
            this.icon = sc.AREA_ICONS[c] || sc.AREA_ICONS.arrow_up;
            var g = this.icon.index;
            this.map = d || null;
            this.offsetX = g % f * 12;
            this.offsetY =
                Math.floor(g / f) * 12;
            this.setPos(a - 6, b - 6);
            this.setSize(12, 12);
            d = this.icon.type;
            if (d == sc.AREA_ICON_TYPE.LARGE) {
                this.setPos(a - this.icon.width / 2, b - this.icon.height / 2);
                this.setSize(this.icon.width, this.icon.height)
            }
            e && this.map && this.map.unlocked && d == sc.AREA_ICON_TYPE.AREA && e.area && this.createAreaName(e, c, a, b)
        },
        updateDrawables: function(a) {
            this.map && this.map.unlocked && (this.icon.type == sc.AREA_ICON_TYPE.LARGE ? a.addGfx(this.gfx, 0, 0, this.icon.sx, this.icon.sy, this.icon.width, this.icon.height) : a.addGfx(this.gfx,
                this.hook.size.x / 2 - 6, 0, this.offsetX, this.offsetY, 12, 12))
        },
        createAreaName: function(a, b, c, d) {
            var e = "???";
            a.map && ig.vars.storage.maps[a.map.toCamel().toPath("", "")] && (e = sc.map.getAreaName(a.area));
            var f = new ig.ColorGui("black");
            f.hook.localAlpha = 0.5;
            e = new sc.TextGui(e, {
                font: sc.fontsystem.tinyFont
            });
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            f.setSize(e.hook.size.x + 4, e.hook.size.y + 2);
            switch (b) {
                case "area_up":
                    f.setPos(0, -(f.hook.size.y + 1));
                    f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    break;
                case "area_down":
                    f.setPos(0, 13);
                    f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    break;
                case "area_left":
                    f.setPos(f.hook.size.x / 2 - 6 - (f.hook.size.x + 1), 1);
                    f.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
                    break;
                case "area_right":
                    f.setPos(f.hook.size.x / 2 - 6 + 13, 1);
                    f.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER)
            }
            if (a.offset) {
                f.hook.pos.x = f.hook.pos.x + a.offset.x;
                f.hook.pos.y = f.hook.pos.y + a.offset.y
            }
            f.addChildGui(e);
            this.addChildGui(f);
            this.setSize(f.hook.size.x, f.hook.size.y);
            this.setPos(c -
                this.hook.size.x / 2, d - 6)
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
        init: function(a, b) {
            this.parent();
            this.callback = b || null;
            this.floor = a;
            this.name = a.name ? ig.LangLabel.getText(a.name) :
                "";
            this.rooms = this.floor.rooms;
            this.setPos(0, 0);
            this.setSize(a.tiles[0].length * 8, a.tiles.length * 8);
            this.doStateTransition("HIDDEN", true)
        },
        onAttach: function() {
            var a = this._createRooms();
            if (this.activeRoom) {
                this.leaGui = new sc.MapCurrentRoomWrapper(this.activeRoom);
                this.addChildGui(this.leaGui)
            }
            this._createIcons(a);
            this.callback && this.callback(true, this, a)
        },
        update: function() {},
        updateDrawables: function() {},
        showFloor: function() {
            this.addObservers();
            this.doStateTransition("DEFAULT");
            this.calculateOpacity(true,
                true)
        },
        hideFloor: function() {
            this.removeObservers();
            this.doStateTransition("HIDDEN")
        },
        calculateOpacity: function(a, b) {
            sc.map.currentFloor != this.floor.level ? this.doStateTransition("HIDDEN_FAST", a) : b || this.doStateTransition("DEFAULT", a)
        },
        calculatePosOffset: function() {
            this.doPosTranstition(this.hook.pos.x, (sc.map.currentFloor - this.floor.level) * 8, 0.3, KEY_SPLINES.EASE)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        modelChanged: function(a,
            b) {
            if (a == sc.menu && b == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                this.calculatePosOffset();
                this.calculateOpacity(false)
            }
        },
        _updateAlphaOnRooms: function() {
            for (var a = this.hook.children, b = a.length; b--;)
                if (a[b].gui.roomAlpha != void 0) a[b].gui.roomAlpha = this._alpha
        },
        _createIcons: function(a) {
            for (var b = null, b = null, c = this.floor.icons, d = c.length, e = new ig.VarCondition; d--;) {
                var b = c[d],
                    f = b.data ? b.data.condition : null;
                if (f) {
                    e.setCondition(f);
                    if (!e.evaluate()) continue
                }
                b = new sc.MapIcon(b.x, b.y, b.icon, a[b.map], b.data);
                this.addChildGui(b)
            }
        },
        _createRooms: function() {
            for (var a = null, b = null, c = [], d = [], e = 0; e < this.rooms.length; e++)
                if (a = this.rooms[e]) {
                    b = new sc.MapRoom(a, this.floor, this.floor.level);
                    if (b.active) {
                        this.activeRoom = b.hook;
                        d.push(b.hook)
                    }
                    if (b.unlocked) {
                        if (b.hook.pos.y < this.bounds.y) this.bounds.y = b.hook.pos.y;
                        if (b.hook.pos.y < this.bounds.x) this.bounds.x = b.hook.pos.x;
                        if (b.hook.pos.x + b.hook.size.x > this.bounds.width) this.bounds.width = b.hook.pos.x + b.hook.size.x;
                        if (b.hook.pos.y + b.hook.size.y > this.bounds.height) this.bounds.height = b.hook.pos.y +
                            b.hook.size.y
                    }
                    c[a.id - 1] = b
                } if (d.length >= 2) {
                a = new ig.GuiElementBase;
                d = this.getBounds(d);
                a.hook.pos.x = d.x;
                a.hook.pos.y = d.y;
                a.hook.size.x = d.width;
                a.hook.size.y = d.height;
                this.activeRoom = a.hook
            }
            for (e = 0; e < c.length; e++) c[e] && c[e].unlocked && this.addChildGui(c[e]);
            this.bounds.width = this.bounds.width - this.bounds.x;
            this.bounds.height = this.bounds.height - this.bounds.y;
            return c
        },
        getBounds: function(a) {
            for (var b = 0, c = 0, d = 0, e = 0, b = a[0].pos.x, c = a[0].pos.y, d = b + a[0].size.x, e = c + a[0].size.y, f = 1; f < a.length; f++) {
                if (a[f].pos.x <
                    b) b = a[f].pos.x;
                if (a[f].pos.y < c) c = a[f].pos.y;
                a[f].pos.x + a[f].size.x > d && (d = a[f].pos.x + a[f].size.x);
                a[f].pos.y + a[f].size.y > e && (e = a[f].pos.y + a[f].size.y)
            }
            return {
                x: b,
                y: c,
                width: d - b,
                height: e - c
            }
        }
    });
    var c = Vec2.createC(0, 0),
        e = null,
        f = false,
        g = Vec2.createC(0, 0),
        h = [{
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
        i = [1, 3, 4, 6],
        j = [{
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
        k = [{
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
