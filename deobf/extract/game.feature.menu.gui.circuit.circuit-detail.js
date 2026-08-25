ig.module("game.feature.menu.gui.circuit.circuit-detail").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.circuit.circuit-detail-elements", "game.feature.menu.gui.circuit.circuit-overview", "game.feature.menu.gui.circuit.circuit-effect-display").defines(function() {
    function b(a, b, c) {
        if (b <= 1) return false;
        if (sc.newgame.get("remove-skill-blocks")) return 0;
        for (var c = m[c].shadeBlock,
                d = c.ids, e = d.length; e--;)
            if (a == d[e] && !sc.model.player.hasItem(c.levels[b - 2])) return c.levels[b - 2];
        return 0
    }

    function a(a, b, f, g, h, i, j, k, m, l, o, r) {
        var u = f && sc.model.player.hasSkill(f.uid),
            y = null,
            L = false;
        if (!l) {
            q.x = 32;
            q.y = 0;
            s.x = h;
            s.y = i;
            v.x = 8;
            v.y = 8;
            t.x = 0;
            t.y = 0;
            n.x = -j;
            n.y = -k;
            c(n, l, u, true, m);
            q.x = o >= 0 ? q.x + Math.max(0, r[o] - 1) * 8 : q.x + Math.max(0, f.level - 1) * 8;
            a.addGfx(b, s.x, s.y, q.x, q.y, v.x, v.y)
        }
        if (g && g.length != 0) {
            n.x = j;
            n.y = k;
            for (f = 0; f < g.length; f++) {
                y = g[f];
                L = y.orBranch ? sc.model.player.hasSkill(y.orBranch.left[0].uid) ||
                    sc.model.player.hasSkill(y.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(y.uid) ? true : false;
                q.x = 32;
                q.y = 0;
                s.x = h;
                s.y = i;
                v.x = 8;
                v.y = 8;
                t.x = 0;
                t.y = 0;
                if (!l) {
                    n.x = j;
                    n.y = k;
                    e(y.direction, n.x, n.y)
                }
                c(n, l, u, L, m);
                q.x = o >= 0 ? o + 1 >= 3 ? y.orBranch ? q.x + Math.max(0, y.orBranch.levels[0] - 1) * 8 : q.x + Math.max(0, y.level - 1) * 8 : q.x + Math.max(0, r[o + 1] - 1) * 8 : y.orBranch ? q.x + Math.max(0, y.orBranch.levels[0] - 1) * 8 : q.x + Math.max(0, y.level - 1) * 8;
                a.addGfx(b, s.x, s.y, q.x, q.y, v.x, v.y);
                if (l) {
                    Vec2.assign(p, n);
                    d(a, b, y, m, s.x + t.x, s.y + t.y, n.x, n.y,
                        1, true);
                    Vec2.assign(n, p);
                    e("CW_90", n.x, n.y)
                }
            }
        }
    }

    function d(a, b, c, d, f, h, i, j, k, m, l) {
        var o = 0,
            o = l ? k : (k != void 0 ? k : c.distance) * 8;
        if (!(o <= 0)) {
            n.x = i;
            n.y = j;
            var p = c.orBranch ? true : false,
                l = false,
                l = p ? sc.model.player.hasSkill(c.orBranch.left[0].uid) || sc.model.player.hasSkill(c.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(c.uid) ? true : false,
                k = 0,
                k = p ? c.orBranch.levels[0] : c.level || 0,
                k = Math.max(0, k - 1) * 16;
            m && e(c.direction, i, j);
            switch (g(n)) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    if (o <= 16) a.addGfx(b, f, h, (l ? 80 + d * 48 : 32) +
                        k, 80, o, 8);
                    else {
                        c = Math.ceil(o / 16);
                        for (i = 16; c--;) {
                            o < 16 && (i = o);
                            a.addGfx(b, f, h, (l ? 80 + d * 48 : 32) + k, 80, i, 8);
                            f = f + 16;
                            o = Math.max(0, o - 16)
                        }
                    }
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    if (o <= 16) a.addGfx(b, f, h, l ? 177 + d * 8 : 169, 312 + k, 8, o);
                    else {
                        c = Math.ceil(o / 16);
                        for (i = 16; c--;) {
                            o < 16 && (i = o);
                            a.addGfx(b, f, h, l ? 177 + d * 8 : 169, 312 + k, 8, i);
                            h = h + 16;
                            o = Math.max(0, o - 16)
                        }
                    }
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    c = l;
                    i = n.x;
                    j = n.y;
                    m = false;
                    if (i > 0 && j < 0 || i < 0 && j > 0) {
                        m = true;
                        h = h + (o - 16 + 1)
                    } else h = h + 1;
                    n.x = i;
                    n.y = j;
                    i = Math.ceil(o / 16);
                    for (j = 16; i--;) {
                        o < 16 && (j = o);
                        a.addGfx(b,
                            f, h - 3, (c ? 80 + d * 48 : 32) + k, 88, j, 24, m);
                        f = f + 16;
                        o = Math.max(0, o - 16);
                        h = h + (m ? -(o < 16 ? o : 16) : 16)
                    }
            }
        }
    }

    function c(a, b, c, d, e) {
        if (b || c) {
            q.x = d ? 80 : 104;
            q.x = q.x + e * 48
        } else q.x = 32;
        switch (f(a)) {
            case sc.TREE_CARDINAL_DIR.NORTH:
                q.y = 0;
                v.y = 8;
                s.x = s.x - 3;
                s.y = s.y - (b ? 11 : 19);
                t.y = -8;
                break;
            case sc.TREE_CARDINAL_DIR.EAST:
                q.y = 8;
                v.y = 8;
                s.x = s.x + (b ? 5 : 13);
                s.y = s.y - 3;
                t.x = 8;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH:
                q.y = 16;
                v.y = 8;
                s.x = s.x - 3;
                s.y = s.y + (b ? 5 : 13);
                t.y = t.y + 8;
                break;
            case sc.TREE_CARDINAL_DIR.WEST:
                q.y = 24;
                v.y = 8;
                s.x = s.x - (b ? 11 : 19);
                s.y = s.y - 3;
                t.x = -8;
                break;
            case sc.TREE_CARDINAL_DIR.NORTH_EAST:
                q.y = 32;
                v.y = 12;
                s.x = 25;
                s.y = 4;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH_EAST:
                q.y = 44;
                v.y = 12;
                s.x = 25;
                s.y = 25;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH_WEST:
                q.y = 56;
                v.y = 12;
                s.x = 9;
                s.y = 25;
                break;
            case sc.TREE_CARDINAL_DIR.NORTH_WEST:
                q.y = 68;
                v.y = 12;
                s.x = 9;
                s.y = 5
        }
    }

    function e(a, b, c) {
        n.x = b;
        n.y = c;
        switch (sc.SKILLS_DIRECTION[a]) {
            case sc.SKILLS_DIRECTION.CW_45:
                Vec2.rotate(n, -j);
                n.x = Math.round(n.x);
                n.y = Math.round(n.y);
                break;
            case sc.SKILLS_DIRECTION.CCW_45:
                Vec2.rotate(n, j);
                n.x = Math.round(n.x);
                n.y = Math.round(n.y);
                break;
            case sc.SKILLS_DIRECTION.CW_90:
                Vec2.rotate90CCW(n);
                break;
            case sc.SKILLS_DIRECTION.CCW_90:
                Vec2.rotate90CW(n);
                break;
            case sc.SKILLS_DIRECTION.CW_135:
                Vec2.rotate(n, -k);
                n.x = Math.round(n.x);
                n.y = Math.round(n.y);
                break;
            case sc.SKILLS_DIRECTION.CCW_135:
                Vec2.rotate(n, k);
                n.x = Math.round(n.x);
                n.y = Math.round(n.y)
        }
        return n
    }

    function f(a) {
        if (a.x >= 0) {
            if (a.y < 0 && a.x == 0) return sc.TREE_CARDINAL_DIR.NORTH;
            if (a.y > 0 && a.x == 0) return sc.TREE_CARDINAL_DIR.SOUTH;
            if (a.y == 0 && a.x > 0) return sc.TREE_CARDINAL_DIR.EAST;
            if (a.y < 0 && a.x > 0) return sc.TREE_CARDINAL_DIR.NORTH_EAST;
            if (a.y > 0 && a.x > 0) return sc.TREE_CARDINAL_DIR.SOUTH_EAST
        } else {
            if (a.y == 0 && a.x < 0) return sc.TREE_CARDINAL_DIR.WEST;
            if (a.y < 0 && a.x < 0) return sc.TREE_CARDINAL_DIR.NORTH_WEST;
            if (a.y > 0 && a.x < 0) return sc.TREE_CARDINAL_DIR.SOUTH_WEST
        }
        return null
    }

    function g(a) {
        if (a.x >= 0) {
            if (a.y < 0 && a.x == 0 || a.y > 0 && a.x == 0) return sc.LINE_DRAW_TYPE.VERT;
            if (a.y == 0 && a.x > 0) return sc.LINE_DRAW_TYPE.HORZ;
            if (a.y < 0 && a.x > 0 || a.y > 0 && a.x > 0) return sc.LINE_DRAW_TYPE.SLOPE
        } else {
            if (a.y == 0 && a.x <
                0) return sc.LINE_DRAW_TYPE.HORZ;
            if (a.y < 0 && a.x < 0 || a.y > 0 && a.x < 0) return sc.LINE_DRAW_TYPE.SLOPE
        }
        return "If this return, you broke something horribly Bro."
    }

    function h(a) {
        for (var b in a) return false;
        return true
    }
    var i = Math.PI / 2,
        j = Math.PI / 4,
        k = i + j,
        l = Math.floor(20),
        o = !window.IG_GAME_DEBUG || false,
        m = [{
            element: sc.ELEMENT.NEUTRAL,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 375,
                y: 375
            },
            offset: {
                x: 1095,
                y: 1095
            },
            size: {
                x: 751,
                y: 751
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47],
                levels: [225, 225]
            }
        }, {
            element: sc.ELEMENT.HEAT,
            rotation: i,
            startDir: {
                x: 1,
                y: 0
            },
            node: {
                x: 519,
                y: 199
            },
            offset: {
                x: 951,
                y: 1990
            },
            size: {
                x: 1039,
                y: 951
            },
            shadeBlock: {
                ids: [64, 63, 89, 97, 98, 118, 119, 128, 127, 105, 73, 72],
                levels: [230, 410]
            }
        }, {
            element: sc.ELEMENT.COLD,
            rotation: -i,
            startDir: {
                x: -1,
                y: 0
            },
            node: {
                x: 519,
                y: 751
            },
            offset: {
                x: 951,
                y: 0
            },
            size: {
                x: 1039,
                y: 951
            },
            shadeBlock: {
                ids: [176, 205, 206, 214, 215, 151, 150, 160, 159, 184, 185, 192],
                levels: [230, 410]
            }
        }, {
            rotation: 0,
            element: sc.ELEMENT.SHOCK,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 199,
                y: 519
            },
            offset: {
                x: 1990,
                y: 951
            },
            size: {
                x: 951,
                y: 1039
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47,
                    246, 247, 279, 301, 302
                ],
                levels: [230, 410]
            }
        }, {
            element: sc.ELEMENT.WAVE,
            rotation: Math.PI,
            startDir: {
                x: 0,
                y: 1
            },
            node: {
                x: 751,
                y: 519
            },
            offset: {
                x: 0,
                y: 951
            },
            size: {
                x: 951,
                y: 1039
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47, 333, 334, 366, 388, 389],
                levels: [230, 410]
            }
        }],
        n = Vec2.createC(0, 0),
        p = Vec2.createC(0, 0),
        r = Vec2.createC(0, 0),
        t = Vec2.createC(0, 0),
        q = Vec2.createC(0, 0),
        s = Vec2.createC(0, 0),
        v = Vec2.createC(0, 0),
        y = {
            225: 0,
            230: 40,
            231: 80,
            410: 80
        },
        u = Vec2.createC(0, 0);
    sc.CircuitTreeDetailContainer = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        trees: [],
        cursor: null,
        _lastMousePos: Vec2.createC(0, 0),
        _dragTimer: 0,
        _cameraLastPositions: [],
        _lastDevice: 0,
        _gamepadActive: false,
        _cursorPos: [],
        _delayedDrag: false,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            if (!this.constructor.PATTERN) this.constructor.PATTERN =
                this.gfx.createPattern(0, 192, 64, 64, ig.ImagePattern.OPT.REPEAT_X_AND_Y);
            this.hook.setMouseRecord(true);
            this.cursor = new sc.CiruitCursor;
            this.addChildGui(this.cursor);
            this.doStateTransition("HIDDEN", true)
        },
        scrollToTree: function(a, b, c, d) {
            var e = null;
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                e = this._cursorPos[a];
                this._initCursorPos(e, a);
                sc.menu.skillCursor.x = e.x;
                sc.menu.skillCursor.y = e.y;
                this.limitCursorPos(a);
                this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y, b != -1, c);
                sc.menu.skillCamera.x =
                    Math.floor(-e.x + ig.system.width / 2);
                sc.menu.skillCamera.y = Math.floor(-e.y + ig.system.height / 2)
            } else {
                e = this._cameraLastPositions[a];
                sc.menu.skillCamera.x = e.x;
                sc.menu.skillCamera.y = e.y
            }
            this.limitCameraPos(a);
            this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, c, KEY_SPLINES.EASE, d)
        },
        limitCameraPos: function(a) {
            var a = m[a],
                b = -sc.menu.skillCamera.x,
                c = Math.floor(162);
            sc.menu.skillCamera.x = -b.limit(a.offset.x - c, a.offset.x + (a.size.x - ig.system.width) + c);
            b = -sc.menu.skillCamera.y;
            c = Math.floor(42);
            sc.menu.skillCamera.y = -b.limit(a.offset.y - c, a.offset.y + (a.size.y - ig.system.height) + c)
        },
        limitCursorPos: function(a) {
            var a = m[a],
                b = sc.menu.skillCursor.x;
            sc.menu.skillCursor.x = b.limit(a.offset.x - 32 + 16 - 120, a.offset.x + (a.size.x - 16) + 32 + 120);
            var b = sc.menu.skillCursor.y,
                c = sc.menu.skillCursor.x + sc.menu.skillCamera.x;
            sc.menu.skillCursor.y = b.limit(a.offset.y, a.offset.y + a.size.y - (c < 181 ? Math.min(25, 181 - c) : 0))
        },
        switchElementTree: function(a, b) {
            if (a >= 0) {
                this._addTreeLazy(a);
                if (b != -1) {
                    var c = this._cameraLastPositions[b];
                    c.x = sc.menu.skillCamera.x;
                    c.y = sc.menu.skillCamera.y;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        c = this._cursorPos[b];
                        c.x = sc.menu.skillCursor.x;
                        c.y = sc.menu.skillCursor.y
                    }
                    this.trees[b].deactivate(true);
                    this.trees[a].activate(false);
                    this.scrollToTree(a, b, 0.5, function() {
                        this.trees[sc.menu.previousSkillTree].doStateTransition("HIDDEN", true)
                    }.bind(this));
                    ig.interact.setBlockDelay(0.5)
                } else {
                    this.trees[a].activate(true);
                    this.scrollToTree(a, b);
                    this.doStateTransition("DEFAULT")
                }
                this._checkLastDevice()
            } else {
                if (b !=
                    -1) {
                    c = this._cameraLastPositions[b];
                    c.x = sc.menu.skillCamera.x;
                    c.y = sc.menu.skillCamera.y;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        c = this._cursorPos[b];
                        c.x = sc.menu.lastSkillCursor.x;
                        c.y = sc.menu.lastSkillCursor.y
                    }
                }
                this.doStateTransition("HIDDEN")
            }
        },
        exitMenu: function() {
            for (var a = this.trees.length; a--;) this.trees[a] && this.trees[a].exit();
            this.doStateTransition("HIDDEN")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.cursor.addObservers();
            for (var a = this.trees.length; a--;) this.trees[a] &&
                this.trees[a].addObservers()
        },
        removeObservers: function() {
            this.cursor.removeObservers();
            sc.Model.removeObserver(sc.menu, this);
            for (var a = this.trees.length; a--;) this.trees[a] && this.trees[a].removeObservers()
        },
        update: function() {
            sc.menu.skillCursorMoved = false;
            if (!ig.interact.isBlocked() && !(sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU || sc.menu.skillState == sc.MENU_SKILL_STATE.OVERVIEW || sc.menu.currentSkillTree >= 0 && !this.trees[sc.menu.currentSkillTree].buttonGroup.isActive())) {
                var a = sc.menu.currentSkillTree;
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var b = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        b = this._cursorPos[a];
                        this._initCursorPos(b, a);
                        sc.menu.skillCursor.x = b.x;
                        sc.menu.skillCursor.y = b.y;
                        this.limitCursorPos(a);
                        sc.menu.skillCamera.x = Math.floor(-b.x + ig.system.width / 2);
                        sc.menu.skillCamera.y = Math.floor(-b.y + ig.system.height / 2);
                        this.limitCameraPos(a);
                        this.doScrollTransition(sc.menu.skillCamera.x,
                            sc.menu.skillCamera.y, 0.3, KEY_SPLINES.EASE);
                        this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        b = this._cursorPos[a];
                        if (sc.menu.currentSkillFocus) {
                            b.x = sc.menu.skillRecoverPos.x;
                            b.y = sc.menu.skillRecoverPos.y
                        } else {
                            b.x = sc.menu.skillCursor.x;
                            b.y = sc.menu.skillCursor.y
                        }
                        sc.menu.unfocusCursor(sc.menu.currentSkillFocus)
                    }
                    sc.menu.toggledInputMode()
                }
                a = false;
                if (!this.hook.scrollTransition) {
                    if (sc.control.menuSkillLeft(0.5)) {
                        sc.menu.skillCamera.x =
                            Math.floor(sc.menu.skillCamera.x + 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        a = true
                    } else if (sc.control.menuSkillRight(0.5)) {
                        sc.menu.skillCamera.x = Math.floor(sc.menu.skillCamera.x - 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        a = true
                    }
                    if (sc.control.menuSkillUp(0.5)) {
                        sc.menu.skillCamera.y = Math.floor(sc.menu.skillCamera.y + 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.y = sc.menu.skillCamera.y;
                        a = true
                    } else if (sc.control.menuSkillDown(0.5)) {
                        sc.menu.skillCamera.y = Math.floor(sc.menu.skillCamera.y - 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.y = sc.menu.skillCamera.y;
                        a = true
                    }
                }
                if (!a && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var c = b = 0,
                        d = 0,
                        a = false;
                    if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        b = (-150 + d * 100) * ig.system.actualTick;
                        a = true
                    } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) >
                        0.5) {
                        b = (150 + d * 100) * ig.system.actualTick;
                        a = true
                    }
                    if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        c = (-150 + d * 100) * ig.system.actualTick;
                        a = true
                    } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                        c = (150 + d * 100) * ig.system.actualTick;
                        a = true
                    }
                    if (a) {
                        sc.menu.skillCursorMoved = true;
                        sc.menu.skillCursor.x = b >= 0 ? Math.floor(sc.menu.skillCursor.x + b) : Math.ceil(sc.menu.skillCursor.x + b);
                        sc.menu.skillCursor.y = c >= 0 ? Math.floor(sc.menu.skillCursor.y + c) : Math.ceil(sc.menu.skillCursor.y + c);
                        this.limitCursorPos(sc.menu.currentSkillTree);
                        this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y);
                        u.x = sc.menu.skillCamera.x;
                        u.y = sc.menu.skillCamera.y;
                        sc.menu.skillCamera.x = Math.floor(-sc.menu.skillCursor.x + ig.system.width / 2);
                        sc.menu.skillCamera.y = Math.floor(-sc.menu.skillCursor.y + ig.system.height / 2);
                        this.limitCameraPos(sc.menu.currentSkillTree)
                    }
                    a = false;
                    if (Math.abs(sc.menu.skillCamera.x - u.x) >= 18 || Math.abs(sc.menu.skillCamera.y - u.y) >= 18) a = true;
                    if (this.hook.scrollTransition) {
                        this.hook.scrollTransition.x = sc.menu.skillCamera.x;
                        this.hook.scrollTransition.y =
                            sc.menu.skillCamera.y
                    } else if (a) this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.3, KEY_SPLINES.LINEAR);
                    else {
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        this.hook.scroll.y = sc.menu.skillCamera.y
                    }
                }
            }
        },
        updateDrawables: function(a) {
            var b = this.hook;
            b.hasTransition() ? a.addPattern(this.constructor.PATTERN, -256, -256, -b.scroll.x, -b.scroll.y, 1216, 704) : a.addPattern(this.constructor.PATTERN, 0, 0, -b.scroll.x, -b.scroll.y, b.size.x, b.size.y)
        },
        onMouseInteract: function(a, b) {
            if (!(ig.interact.isBlocked() ||
                    this.trees[sc.menu.currentSkillFocus] && !this.trees[sc.menu.currentSkillTree].buttonGroup.isActive()))
                if (sc.menu.currentSkillTree == -1 || sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU)
                    if (a && sc.control.getGuiPressed()) {
                        sc.menu.exitNodeMenu();
                        sc.menu.unfocusCursor(sc.menu.currentSkillFocus);
                        this._delayedDrag = true
                    } else sc.menu.skillDrag = false;
            else if (!b) {
                var c = Math.floor(sc.control.getMouseX()),
                    d = Math.floor(sc.control.getMouseY());
                if (sc.control.getGuiPressed() || this._delayedDrag) {
                    this._delayedDrag = false;
                    Vec2.assignC(this._lastMousePos, c, d);
                    sc.menu.skillDrag = true;
                    this._dragTimer = 0
                } else if (sc.control.getGuiHold()) {
                    if (sc.menu.skillDrag) {
                        this._dragTimer = this._dragTimer + ig.system.actualTick;
                        if (!sc.menu.skillWasDragged) sc.menu.skillWasDragged = (Math.abs(c - this._lastMousePos.x) >= 1 || Math.abs(d - this._lastMousePos.y) >= 1) && this._dragTimer >= 0.1;
                        sc.menu.skillCamera.x = sc.menu.skillCamera.x + (c - this._lastMousePos.x);
                        sc.menu.skillCamera.y = sc.menu.skillCamera.y + (d - this._lastMousePos.y);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        this.hook.scroll.y = sc.menu.skillCamera.y;
                        Vec2.assignC(this._lastMousePos, c, d)
                    }
                } else sc.menu.skillDrag = false
            }
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.SKILL_NODE_SELECT) {
                    this.limitCameraPos(sc.menu.currentSkillTree);
                    this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.2)
                } else if (b == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    sc.menu.skillCamera.x = Math.floor(-sc.menu.skillCursor.x +
                        ig.system.width / 2);
                    sc.menu.skillCamera.y = Math.floor(-sc.menu.skillCursor.y + ig.system.height / 2);
                    this.limitCameraPos(sc.menu.currentSkillTree);
                    this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.2, KEY_SPLINES.LINEAR)
                }
            } else if (b == sc.MENU_EVENT.CIRCUIT_FOCUS_CAM) {
                this.limitCameraPos(sc.menu.currentSkillTree);
                this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, c ? c.time || 0.2 : 0.2, void 0, c && c.callback)
            }
        },
        _initCursorPos: function(a, b) {
            if (a.x <= -1E4 || a.y <= -1E4) {
                a.x = -this._cameraLastPositions[b].x +
                    ig.system.width / 2;
                a.y = -this._cameraLastPositions[b].y + ig.system.height / 2
            }
        },
        _checkLastDevice: function() {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
        },
        _addTreeLazy: function(a) {
            if (!this.trees[a]) {
                this.trees[a] = new sc.CircuitTreeDetail(a);
                this.trees[a].setPos(m[a].offset.x, m[a].offset.y);
                var b = Vec2.createC(0, 0);
                b.x = ig.system.width / 2 - m[a].node.x - m[a].offset.x;
                b.y = ig.system.height / 2 - m[a].node.y -
                    m[a].offset.y;
                this._cameraLastPositions[a] = b;
                this._cursorPos[a] = Vec2.createC(-1E4, -1E4);
                this.insertChildGui(this.trees[a], 0)
            }
        }
    });
    sc.CircuitTreeDetail = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
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
        tree: null,
        buttonGroup: null,
        skills: [],
        skillStart: 0,
        effectGuis: [],
        init: function(a) {
            this.parent();
            this.setSize(m[a].size.x, m[a].size.y);
            if (a == void 0) throw Error("Element muss be defined");
            this.tree = m[a];
            this.buttonGroup = new sc.CircuitDetailButtonGroup;
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.menu, this);
            this._createTree();
            this.doStateTransition("DEFAULT", true)
        },
        updateDrawables: function(a) {
            window.IG_GAME_DEBUG && o && a.addColor("white", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.05)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.model.player, this);
            sc.Model.removeObserver(sc.menu, this)
        },
        activate: function(a, b) {
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
            sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT", a, false, b || null)
        },
        deactivate: function(a) {
            for (var b = this.effectGuis.length; b--;) {
                this.effectGuis[b].hide();
                this.removeChildGui(this.effectGuis[b])
            }
            this.effectGuis.length = 0;
            sc.menu.popBackCallback();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            a ||
                this.doStateTransition("HIDDEN")
        },
        exit: function() {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },
        modelChanged: function(a, b, c) {
            if (a == sc.model.player) {
                if (b == sc.PLAYER_MSG.SKILL_CHANGED && c >= this.skillStart && c <= this.skillStart + this.skills.length - 1)
                    for (a = this.skills.length; a--;) this.skills[a].updateIconAlpha()
            } else a == sc.menu && b == sc.MENU_EVENT.SKILL_SHOW_EFFECT && this._showEffect(c.gui, c.isSwitch, c.delay)
        },
        _showEffect: function(a, b, c) {
            if (a && this.tree.element == a.element) {
                var d = new sc.CircuitEffectDisplay;
                this.addChildGui(d);
                d.show(a, b, c);
                this.effectGuis.push(d)
            }
        },
        _onBackButtonPress: function() {
            this.deactivate();
            sc.menu.selectSkillTree(-1)
        },
        _createTree: function() {
            var a = sc.skilltree.getTree(this.tree.element);
            r.x = this.tree.node.x;
            r.y = this.tree.node.y;
            var b = this.tree.startDir.x,
                c = this.tree.startDir.y;
            n.x = b;
            n.y = c;
            var d = null;
            this.skillStart = a[0].uid;
            d = new sc.CircuitTreeDetail.Start(r.x, r.y, b, c, this.tree.element, a);
            this.addChildGui(d);
            for (var f = 0; f < a.length; f++) {
                d = a[f];
                h(d) || this._createTreeNodesRecursive(d,
                    this.tree.element, r.x, r.y, b, c, null);
                e("CW_90", b, c);
                b = n.x;
                c = n.y
            }
        },
        _createTreeNodesRecursive: function(a, b, c, d, f, g, i) {
            var j = false,
                k = null,
                m = null;
            if (a.orBranch) {
                var l = a.orBranch;
                e(a.direction, f, g);
                j = Math.abs(n.x) == 1 && Math.abs(n.y) == 1;
                c = c + (a.distance + (j ? 2 : 3)) * 8 * n.x;
                d = d + (a.distance + (j ? 2 : 3)) * 8 * n.y;
                p.x = n.x;
                p.y = n.y;
                e(l.direction, n.x, n.y);
                (j = Math.abs(n.x) == 1 && Math.abs(n.y) == 1) && ig.error("orBranch can't be rendered with a slope direction.");
                k = new sc.CircuitTreeDetail.OrBranchLine(c, d, n.x, n.y, l, a, b, false);
                this.addChildGui(k);
                for (var c = c + (j ? 3 : 6) * 8 * n.x, d = d + (j ? 3 : 6) * 8 * n.y, f = k = null, g = i, o = 0; o < 3; o++) {
                    if (o + 1 >= 3) k = f = a.children[0];
                    else {
                        k = l.left[o + 1];
                        f = l.right[o + 1]
                    }
                    if (n.x != 0) {
                        k = new sc.CircuitTreeDetail.Node(c, d + (n.x > 0 ? -24 : 24), n.x, n.y, l.left[o], b, k, this.buttonGroup, this.skillStart, g, o, l.levels, true);
                        if (g) g.nextGui = k;
                        g = k;
                        this.addChildGui(k);
                        this.skills[l.left[o].uid - this.skillStart] = k;
                        k = new sc.CircuitTreeDetail.Node(c, d + (n.x > 0 ? 24 : -24), n.x, n.y, l.right[o], b, f, this.buttonGroup, this.skillStart, i, o, l.levels, false)
                    } else {
                        k = new sc.CircuitTreeDetail.Node(c +
                            (n.y > 0 ? 24 : -24), d, n.x, n.y, l.left[o], b, k, this.buttonGroup, this.skillStart, g, o, l.levels, true);
                        if (g) g.nextGui = k;
                        g = k;
                        this.addChildGui(k);
                        this.skills[l.left[o].uid - this.skillStart] = k;
                        k = new sc.CircuitTreeDetail.Node(c + (n.y > 0 ? -24 : 24), d, n.x, n.y, l.right[o], b, f, this.buttonGroup, this.skillStart, i, o, l.levels, false)
                    }
                    if (i) i.nextGui = k;
                    i = k;
                    this.addChildGui(k);
                    g.orGui = i;
                    i.orGui = g;
                    this.skills[l.right[o].uid - this.skillStart] = k;
                    c = c + (j ? 3 : 5) * 8 * n.x;
                    d = d + (j ? 3 : 5) * 8 * n.y;
                    m = k
                }
                c = c - (j ? 1 : 2) * 8 * n.x;
                d = d - (j ? 1 : 2) * 8 * n.y;
                k = new sc.CircuitTreeDetail.OrBranchLine(c,
                    d, n.x, n.y, l, a, b, true);
                this.addChildGui(k);
                c = c + 8 * n.x;
                d = d + 8 * n.y
            } else {
                e(a.direction, f, g);
                j = Math.abs(n.x) == 1 && Math.abs(n.y) == 1;
                c = c + (a.distance + (j ? 3 : 5)) * 8 * n.x;
                d = d + (a.distance + (j ? 3 : 5)) * 8 * n.y;
                k = new sc.CircuitTreeDetail.Node(c, d, n.x, n.y, a, b, null, this.buttonGroup, this.skillStart, i);
                this.addChildGui(k);
                m = this.skills[a.uid - this.skillStart] = k
            }
            a = a.children;
            if (a.length != 0) {
                j = null;
                f = n.x;
                g = n.y;
                for (l = 0; l < a.length; l++) {
                    j = a[l];
                    if (!h(j)) {
                        d = this._createLine(j, b, c, d, f, g);
                        this._createTreeNodesRecursive(j, b, c, d, f, g, m)
                    }
                }
            }
        },
        _createLine: function(a, b, c, d, f, g) {
            if (a.distance <= 0) return d;
            e(a.direction, f, g);
            n.x == 1 && (n.y == -1 && a.orBranch) && (d = d - 1);
            a = new sc.CircuitTreeDetail.Line(c, d, n.x, n.y, a, b);
            this.addChildGui(a);
            return d
        }
    });
    sc.CircuitTreeDetail.Start = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        element: 0,
        children: null,
        dirX: 0,
        dirY: 0,
        centerPos: 0,
        init: function(a, b, c, d, e, f) {
            this.parent();
            this.setSize(40, 40);
            this.setPos(a - l, b - l);
            this.element = e;
            this.children = f;
            this.dirX = c;
            this.dirY = d;
            this.centerPos = l - 6
        },
        updateDrawables: function(b) {
            window.IG_GAME_DEBUG && o && b.addColor("red", 1, 1, 39, 39).setAlpha(0.2);
            b.addGfx(this.gfx, this.centerPos, this.centerPos, 56, 0 + this.element * 16, 13, 13);
            a(b, this.gfx, null, this.children, l, l, this.dirX, this.dirY, this.element, true)
        }
    });
    sc.CircuitTreeDetail.Node = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        icons: new ig.Image("media/gui/circuit-icons.png"),
        parentGui: null,
        element: 0,
        skill: null,
        branchSkill: null,
        coords: {
            x: 5,
            y: 5,
            w: 31,
            h: 31
        },
        dirX: 0,
        dirY: 0,
        centerPos: 0,
        orBranchIndex: -1,
        orLevels: null,
        orLeft: true,
        blocked: false,
        blockID: 0,
        submitSound: null,
        blockedSound: null,
        _iconAlpha: 1,
        _player: null,
        _buttonGroup: null,
        init: function(a, c, d, e, f, g, h, i, j, k, m, o, n) {
            this.parent();
            this.setSize(41, 41);
            this.setPos(a - l, c - l);
            this.parentGui = k || null;
            this.element = g;
            this.skill = f;
            this.dirX = d;
            this.dirY = e;
            this.centerPos = l - 15;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.blockedSound = sc.BUTTON_SOUND.denied;
            this._player = sc.model.player;
            this.updateIconAlpha();
            if (h) {
                this.branchSkill = [];
                this.branchSkill.push(h);
                this.orBranchIndex = m;
                this.orLevels = o;
                this.orLeft = n == void 0 ? true : n;
                this.blockID = b(this.skill.uid, this.orLevels[this.orBranchIndex], this.element)
            } else this.blockID = b(this.skill.uid, this.skill.level, this.element);
            if (this.blockID > 0) this.blocked = true;
            (this._buttonGroup = i) && i.addFocusGui(this, f.uid - j || 0, 0)
        },
        updateIconAlpha: function() {
            this._iconAlpha = 1;
            if (!this._player.hasSkill(this.skill.uid)) this._iconAlpha = this._calculateAlpha(this.parentGui, this._iconAlpha)
        },
        getOffsetX: function() {
            return m[this.element].offset.x
        },
        getOffsetY: function() {
            return m[this.element].offset.y
        },
        getDistanceToCursor: function() {
            return Math.floor(Vec2.distanceC(sc.menu.skillCursor.x - m[this.element].offset.x, sc.menu.skillCursor.y - m[this.element].offset.y, this.hook.pos.x + l, this.hook.pos.y + l))
        },
        updateDrawables: function(b) {
            if (window.IG_GAME_DEBUG) {
                o && b.addColor(this.branchSkill ? "yellow" : "green", 1, 1, 39, 39).setAlpha(0.2);
                o && b.addColor(this.branchSkill ? "yellow" : "green", 5, 5, 31, 31).setAlpha(0.2)
            }
            var c = sc.model.player.hasSkill(this.skill.uid);
            b.addGfx(this.gfx,
                this.centerPos, this.centerPos, 0, c ? 32 + this.element * 32 : 0, 31, 31);
            if (this._iconAlpha > 0) {
                c = sc.skilltree.getSkill(this.skill.uid).icon;
                b.addGfx(this.icons, 8, 8, c % 10 * 24, Math.floor(c / 10) * 24, 24, 24).setAlpha(this._iconAlpha)
            }
            a(b, this.gfx, this.skill, this.branchSkill ? this.branchSkill : this.skill.children, l, l, this.dirX, this.dirY, this.element, false, this.orBranchIndex, this.orLevels);
            if (this.blocked) {
                c = m[this.element].shadeBlock.levels[(this.branchSkill ? this.orLevels[this.orBranchIndex] : this.skill.level) - 2];
                c = y[c];
                b.addGfx(this.gfx, this.centerPos, this.centerPos, 480, 168 + c, 32, 40)
            }
        },
        onButtonPress: function() {
            if (sc.menu.skillWasDragged) sc.menu.skillWasDragged = false;
            else {
                var a = false;
                if (this._checkParentForBlock(this.parentGui)) this.blockedSound && this.blockedSound.play();
                else {
                    this.parentGui && (this._hasParent(this.parentGui) || (a = true));
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        var b = Math.floor(sc.control.getMouseY());
                        if (b <= 21 || b >= 299) return
                    }
                    this.submitSound && this.submitSound.play();
                    sc.menu.centerOnNode(this,
                        a)
                }
            }
        },
        onMouseInteract: function(a, b) {
            ig.input.state("shift") || this.parent(a, b)
        },
        isMouseOver: function() {
            if (sc.menu.currentSkillTree == -1 || sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU) return false;
            if (sc.menu.skillDrag) return sc.menu.currentSkillFocus == this;
            if (!ig.interact.isBlocked() && this._buttonGroup.isActive()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var a = this.getDistanceToCursor();
                    if (sc.menu.skillCursorMoved) {
                        sc.menu.unfocusCursor(this);
                        return false
                    }
                    if (a <= 14) {
                        sc.menu.focusCursorOnNode(this.hook.pos.x +
                            20 + m[this.element].offset.x, this.hook.pos.y + 20 + m[this.element].offset.y, this);
                        return true
                    }
                    sc.menu.unfocusCursor(this);
                    return false
                }
                var a = Math.floor(sc.control.getMouseX()),
                    b = Math.floor(sc.control.getMouseY());
                if (b <= 21 || b >= 299) {
                    sc.menu.unfocusCursor(this);
                    return false
                }
                this.coords.x = 5 + this.hook.screenCoords.x;
                this.coords.y = 5 + this.hook.screenCoords.y;
                (a = this.coords.x <= a && this.coords.x + this.coords.w > a && this.coords.y <= b && this.coords.y + this.coords.h > b) && !ig.input.state("shift") ? sc.menu.focusCursorOnNode(this.hook.pos.x +
                    20 + m[this.element].offset.x, this.hook.pos.y + 20 + m[this.element].offset.y, this) : sc.menu.unfocusCursor(this);
                return a
            }
        },
        getNodeFocus: function(a) {
            a = a || Vec2.createC(0, 0);
            a.x = this.hook.pos.x + 20 + m[this.element].offset.x;
            a.y = this.hook.pos.y + 20 + m[this.element].offset.y;
            return a
        },
        _hasParent: function(a) {
            if (a)
                if (a.branchSkill)
                    if (a.orBranchIndex == 2) {
                        if (!sc.model.player.hasSkill(a.skill.uid) && !sc.model.player.hasSkill(a.skill.uid - 1)) return false
                    } else if (a.orLeft) {
                if (!sc.model.player.hasSkill(a.skill.uid) && !sc.model.player.hasSkill(a.skill.uid +
                        1)) return false
            } else {
                if (!sc.model.player.hasSkill(a.skill.uid) && !sc.model.player.hasSkill(a.skill.uid - 1)) return false
            } else if (!sc.model.player.hasSkill(a.skill.uid)) return false;
            return true
        },
        _checkParentForBlock: function(a) {
            return this.blocked ? true : a ? a.blocked ? true : a.parentGui ? a.parentGui.blocked ? true : this._checkParentForBlock(a.parentGui) : false : false
        },
        _calculateAlpha: function(a, b) {
            if (b <= 0.2) return 0.2;
            if (a) {
                if (a.branchSkill)
                    if (a.orBranchIndex == 2) {
                        if (this._player.hasSkill(a.skill.uid) || this._player.hasSkill(a.skill.uid -
                                1)) return b
                    } else if (a.orLeft) {
                    if (this._player.hasSkill(a.skill.uid) || this._player.hasSkill(a.skill.uid + 1)) return b
                } else {
                    if (this._player.hasSkill(a.skill.uid) || this._player.hasSkill(a.skill.uid - 1)) return b
                } else if (this._player.hasSkill(a.skill.uid)) return b;
                return this._calculateAlpha(a.parentGui, (b * 100 - 20) / 100)
            }
            return b
        }
    });
    sc.CircuitTreeDetail.OrBranchLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        orSkill: null,
        skill: null,
        element: 0,
        dirX: 0,
        dirY: 0,
        drawDir: 0,
        flip: false,
        levelOffset: 0,
        uidLeft: 0,
        uidRight: 0,
        uidNext: -1,
        uidLeftNext: -1,
        uidRightNext: -1,
        hasBranchChildren: false,
        init: function(a, b, c, d, e, f, h, i) {
            this.parent();
            this.setPos(a, b);
            this.element = h;
            this.orSkill = e;
            this.skill = f;
            this.dirX = c;
            this.dirY = d;
            this.flip = i != void 0 ? i : false;
            n.x = c;
            n.y = d;
            this.levelOffset = this.flip ? Math.max(0, f.children[0].level - 1) * 56 : Math.max(0, e.levels[0] - 1) * 56;
            this.uidLeft = this.orSkill.left[0].uid;
            this.uidRight = this.orSkill.right[0].uid;
            this.uidLeftNext = this.skill ? this.orSkill.left[2].uid : -1;
            this.uidRightNext =
                this.skill ? this.orSkill.right[2].uid : -1;
            this.hasBranchChildren = this.skill.children[0].orBranch ? true : false;
            this.uidNext = this.skill ? this.skill.children[0].uid : -1;
            if (this.hasBranchChildren) {
                this.uidLeftNext = this.skill ? this.skill.children[0].orBranch.left[0].uid : -1;
                this.uidRightNext = this.skill ? this.skill.children[0].orBranch.right[0].uid : -1;
                if (this.flip) this.levelOffset = Math.max(0, this.skill.children[0].orBranch.levels[0] - 1) * 56
            }
            this.drawDir = g(n);
            switch (this.drawDir) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    this.setSize(32,
                        56);
                    this.setPos(a + (c > 0 ? -3 : -27), b - 27);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    this.setSize(56, 32);
                    this.setPos(a - 27, b + (d > 0 ? -3 : -27));
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    ig.warn("This will lead to an error bro, we can't draw orBranches in slopes: " + Vec2.print(c, d))
            }
        },
        updateDrawables: function(a) {
            window.IG_GAME_DEBUG && o && a.addColor("yellow", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.2);
            var b = sc.model.player,
                c = b.hasSkill(this.uidLeft),
                d = b.hasSkill(this.uidRight),
                e = c || d;
            if (this.dirX < 0 || this.dirY < 0)
                if (c &&
                    d) c = d = true;
                else if (d) {
                c = true;
                d = false
            } else if (c) {
                d = true;
                c = false
            }
            var f = false;
            d && !c && (f = true);
            var g = this.flip;
            if (this.dirX < 0 || this.dirY < 0) g = !g;
            if (this.flip)
                if (this.hasBranchChildren) {
                    c = b.hasSkill(this.uidLeftNext);
                    d = b.hasSkill(this.uidRightNext);
                    e = c || d
                } else e = b.hasSkill(this.uidNext);
            switch (this.drawDir) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    a.addGfx(this.gfx, 0, f ? -1 : 0, e ? 352 + this.element * 32 : 320, this.levelOffset, 32, 56, g, f);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    a.addGfx(this.gfx, f ? -1 : 0, 0, this.levelOffset, e ? 344 + this.element *
                        32 : 312, 56, 32, f, g)
            }
            c && d && a.addGfx(this.gfx, this.hook.size.x / 2 - 16, this.hook.size.y / 2 - 16, 480, 320, 32, 32)
        }
    });
    sc.CircuitTreeDetail.Line = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        endSkill: null,
        element: 0,
        dirX: 0,
        dirY: 0,
        overrideDistance: false,
        init: function(a, b, c, d, e, h) {
            this.parent();
            this.element = h;
            this.endSkill = e;
            this.dirX = c;
            this.dirY = d;
            n.x = c;
            n.y = d;
            c = e.distance * 8;
            d = g(n);
            h = d == sc.LINE_DRAW_TYPE.SLOPE;
            a = a + (h ? n.x > 0 ? 13 : c + 11 : n.x > 0 ? 21 : c + 19) * n.x;
            b = b + (h ? n.y > 0 ? n.x > 0 ? 12 : 11 : c + (n.x > 0 ? 13 : 12) : n.y >
                0 ? 21 : c + 19) * n.y;
            n.x == 0 && (a = a - 3);
            n.y == 0 && (b = b - 3);
            var i = h = 0;
            if (e.orBranch) {
                if (g(n) == sc.LINE_DRAW_TYPE.SLOPE) {
                    h = 3;
                    i = 6;
                    this.overrideDistance = true
                }
                switch (f(n)) {
                    case sc.TREE_CARDINAL_DIR.SOUTH_WEST:
                        a = a - 3;
                        break;
                    case sc.TREE_CARDINAL_DIR.NORTH_EAST:
                        b = b - 2;
                        break;
                    case sc.TREE_CARDINAL_DIR.NORTH_WEST:
                        a = a - 3;
                        b = b - 3
                }
            }
            this.setPos(a, b);
            switch (d) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    this.setSize(c, 8);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    this.setSize(8, c);
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    this.setSize(c + h, c + i)
            }
        },
        updateDrawables: function(a) {
            window.IG_GAME_DEBUG &&
                o && a.addColor("blue", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.2);
            this.overrideDistance ? d(a, this.gfx, this.endSkill, this.element, 0, 0, this.dirX, this.dirY, this.endSkill.distance * 8 + 3, false, true) : d(a, this.gfx, this.endSkill, this.element, 0, 0, this.dirX, this.dirY)
        }
    })
});
ig.baked = !0;
