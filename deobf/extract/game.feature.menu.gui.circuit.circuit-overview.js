ig.module("game.feature.menu.gui.circuit.circuit-overview").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.combat.model.combat-params").defines(function() {
    var b = Vec2.createC(0, 0),
        a = Vec2.createC(0, 0),
        d = Vec2.createC(0, 0),
        c = Vec2.createC(0, 0),
        e = Math.PI / 2,
        f = Math.PI / 4,
        g = e + f;
    sc.CIRCUIT_VAR_KEY = "menu.circuit.start.";
    var h = {
            element: sc.ELEMENT.NEUTRAL,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 44,
                y: 44
            },
            base: {
                x: 0,
                y: 0
            },
            rotation: 0,
            panels: [{
                x: 24,
                y: 1
            }, {
                x: 1,
                y: 24
            }, {
                x: 47,
                y: 24
            }, {
                x: 24,
                y: 47
            }]
        },
        i = {
            element: sc.ELEMENT.HEAT,
            rotation: e,
            base: {
                x: 0,
                y: -149
            },
            startDir: {
                x: 1,
                y: 0
            },
            node: {
                x: 72,
                y: 21
            },
            panels: [{
                x: 29,
                y: 1
            }, {
                x: 75,
                y: 1
            }, {
                x: 6,
                y: 24
            }, {
                x: 52,
                y: 24
            }, {
                x: 98,
                y: 24
            }, {
                x: 29,
                y: 47
            }, {
                x: 75,
                y: 47
            }, {
                x: 52,
                y: 70
            }]
        },
        j = {
            element: sc.ELEMENT.COLD,
            rotation: -e,
            base: {
                x: -127,
                y: 0
            },
            startDir: {
                x: -1,
                y: 0
            },
            node: {
                x: 72,
                y: 101
            },
            panels: [{
                x: 52,
                y: 12
            }, {
                x: 29,
                y: 35
            }, {
                x: 75,
                y: 35
            }, {
                x: 6,
                y: 58
            }, {
                x: 52,
                y: 58
            }, {
                x: 98,
                y: 58
            }, {
                x: 29,
                y: 81
            }, {
                x: 75,
                y: 81
            }]
        },
        k = {
            rotation: 0,
            element: sc.ELEMENT.SHOCK,
            base: {
                x: 0,
                y: 0
            },
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 21,
                y: 72
            },
            panels: [{
                x: 1,
                y: 29
            }, {
                x: 1,
                y: 75
            }, {
                x: 24,
                y: 6
            }, {
                x: 24,
                y: 52
            }, {
                x: 24,
                y: 98
            }, {
                x: 47,
                y: 29
            }, {
                x: 47,
                y: 75
            }, {
                x: 70,
                y: 52
            }]
        },
        l = {
            element: sc.ELEMENT.WAVE,
            rotation: Math.PI,
            base: {
                x: -127,
                y: -149
            },
            startDir: {
                x: 0,
                y: 1
            },
            node: {
                x: 101,
                y: 72
            },
            panels: [{
                x: 12,
                y: 52
            }, {
                x: 35,
                y: 29
            }, {
                x: 35,
                y: 75
            }, {
                x: 58,
                y: 6
            }, {
                x: 58,
                y: 52
            }, {
                x: 58,
                y: 98
            }, {
                x: 81,
                y: 29
            }, {
                x: 81,
                y: 75
            }]
        };
    sc.CircuitMenuButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        repeater: null,
        init: function() {
            this.parent();
            this.repeater =
                new ig.PressRepeater
        },
        setButtons: function(a, b, c, d, e) {
            this.addFocusGui(a, 1, 1);
            this.addFocusGui(b, 1, 2);
            this.addFocusGui(c, 1, 0);
            this.addFocusGui(d, 2, 1);
            this.addFocusGui(e, 0, 1);
            this.setCurrentFocus(1, 1);
            a.focusable && (ig.input.mouseGuiActive ? this.setCurrentFocus(1, 1) : this.focusCurrentButton(1, 1, true, true, false, true))
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown()
        },
        doButtonTraversal: function(a) {
            sc.control.menuBack() &&
                this.invokeBackButton();
            var b = this.getRepeaterValue();
            if (!a) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                var c = a = 0,
                    d = false;
                if (b == "left") {
                    a = Math.max(0, this.current.x - 1);
                    c = this.current.y;
                    if (a == this.current.x) return;
                    if (c == 0 || c == 2) c = 1;
                    d = true
                } else if (b == "right") {
                    a = Math.min(2, this.current.x + 1);
                    c = this.current.y;
                    if (a == this.current.x) return;
                    if (c == 0 || c == 2) c = 1;
                    d = true
                }
                if (b == "up") {
                    a = this.current.x;
                    c = Math.max(0, this.current.y - 1);
                    if (c == this.current.y) return;
                    if (a == 0 || a == 2) a = 1;
                    d = true
                } else if (b == "down") {
                    a =
                        this.current.x;
                    c = Math.min(2, this.current.y + 1);
                    if (c == this.current.y) return;
                    if (a == 0 || a == 2) a = 1;
                    d = true
                }
                d && this.elements[a][c].focusable && this.focusCurrentButton(a, c)
            }
        },
        getRepeaterValue: function() {
            sc.control.rightDown() ? this.repeater.setDown("right") : sc.control.leftDown() ? this.repeater.setDown("left") : sc.control.downDown() ? this.repeater.setDown("down") : sc.control.upDown() && this.repeater.setDown("up");
            return this.repeater.getPressed()
        },
        activate: function() {
            this.parent();
            this.getRepeaterValue()
        }
    });
    sc.CircuitOverviewMenu =
        ig.GuiElementBase.extend({
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
                },
                SCALE: {
                    state: {
                        alpha: 0,
                        scaleX: 1.5,
                        scaleY: 1.5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            },
            buffers: [],
            elements: [],
            buttons: [],
            buttonGroup: null,
            init: function() {
                this.parent();
                this.hook.size.x = ig.system.width;
                this.hook.size.y = ig.system.height;
                this.hook.pivot.x = Math.floor(ig.system.width / 2);
                this.hook.pivot.y =
                    Math.floor(ig.system.height / 2);
                this.buttonGroup = new sc.CircuitMenuButtonGroup;
                this.buttonGroup.addSelectionCallback(function(a) {
                    sc.menu.setInfoText(a.data)
                });
                this.buttonGroup.setMouseFocusLostCallback(function() {
                    sc.menu.setInfoText("", true)
                });
                this.doStateTransition("DEFAULT", true)
            },
            onAttach: function() {
                this._createTrees();
                for (var a = this.buttons.length; a--;)
                    if (ig.vars.get(sc.CIRCUIT_VAR_KEY + "" + a)) this.buttons[a].focusable = true;
                this.buttonGroup.setButtons(this.buttons[0], this.buttons[1], this.buttons[2],
                    this.buttons[3], this.buttons[4])
            },
            onFirstTimeAnimationDone: function(a) {
                this.buttons[a].focusable = true;
                a == 0 && (ig.input.mouseGuiActive || this.buttonGroup.sounds.focus.play())
            },
            onDetach: function() {
                this.buffers[h.element].release();
                this.buffers[i.element].release();
                this.buffers[j.element].release();
                this.buffers[k.element].release();
                this.buffers[l.element].release()
            },
            modelChanged: function(a, b) {
                if (a == sc.model.player && (b == sc.PLAYER_MSG.SKILL_CHANGED || b == sc.PLAYER_MSG.SKILL_BRANCH_SWAP))
                    if (sc.menu.currentSkillTree ==
                        -1)
                        for (var c = this.elements.length; c--;) this.updateBuffer(c);
                    else this.elements[sc.menu.currentSkillTree].needsUpdate = true
            },
            addObservers: function() {
                sc.Model.addObserver(sc.model.player, this)
            },
            removeObservers: function() {
                sc.Model.removeObserver(sc.model.player, this)
            },
            showMenu: function() {
                for (var a = this.elements.length; a--;) {
                    this.elements[a].show();
                    this.buttons[a].doStateTransition("DEFAULT", false, false, null, 0.1)
                }
                ig.interact.setBlockDelay(0.2);
                sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
            },
            exitMenu: function(a) {
                sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
                for (var b = this.elements.length; b--;) {
                    this.elements[b].doStateTransition("HIDDEN", a);
                    this.buttons[b].doStateTransition("HIDDEN", a)
                }
            },
            enterDetailView: function() {
                this.doStateTransition("SCALE")
            },
            leaveDetailView: function() {
                for (var a = this.elements.length; a--;)
                    if (this.elements[a].needsUpdate) {
                        this.updateBuffer(a);
                        this.elements[a].needsUpdate = false
                    } this.doStateTransition("DEFAULT");
                ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD &&
                    this.buttonGroup.regainFocusOnKeyboard();
                ig.interact.setBlockDelay(0.2)
            },
            updateAllBuffers: function() {
                for (var a = this.elements.length; a--;) this.updateBuffer(a)
            },
            updateBuffer: function(a) {
                this.elements[a].buffer = null;
                this.buffers[a].release();
                switch (a) {
                    case sc.ELEMENT.NEUTRAL:
                        this.buffers[a] = ig.imageAtlas.getFragment(93, 93, function() {
                            this._preDrawTree(h)
                        }.bind(this));
                        break;
                    case sc.ELEMENT.HEAT:
                        this.buffers[a] = ig.imageAtlas.getFragment(149, 127, function() {
                            this._preDrawTree(i)
                        }.bind(this));
                        break;
                    case sc.ELEMENT.COLD:
                        this.buffers[a] =
                            ig.imageAtlas.getFragment(149, 127, function() {
                                this._preDrawTree(j)
                            }.bind(this));
                        break;
                    case sc.ELEMENT.SHOCK:
                        this.buffers[a] = ig.imageAtlas.getFragment(127, 149, function() {
                            this._preDrawTree(k)
                        }.bind(this));
                        break;
                    case sc.ELEMENT.WAVE:
                        this.buffers[a] = ig.imageAtlas.getFragment(127, 149, function() {
                            this._preDrawTree(l)
                        }.bind(this))
                }
                this.elements[a].buffer = this.buffers[a]
            },
            _createTrees: function() {
                var a = h.element,
                    b = i.element,
                    c = j.element,
                    d = k.element,
                    e = l.element;
                this.buffers[a] = ig.imageAtlas.getFragment(93, 93,
                    function() {
                        this._preDrawTree(h)
                    }.bind(this));
                this.buffers[b] = ig.imageAtlas.getFragment(149, 127, function() {
                    this._preDrawTree(i)
                }.bind(this));
                this.buffers[c] = ig.imageAtlas.getFragment(149, 127, function() {
                    this._preDrawTree(j)
                }.bind(this));
                this.buffers[d] = ig.imageAtlas.getFragment(127, 149, function() {
                    this._preDrawTree(k)
                }.bind(this));
                this.buffers[e] = ig.imageAtlas.getFragment(127, 149, function() {
                    this._preDrawTree(l)
                }.bind(this));
                var f = this._updateBufferFromFirstTime.bind(this),
                    g = this.onFirstTimeAnimationDone.bind(this);
                this.elements[a] = new sc.CircuitOverviewMenu.Tree(0, 0, this.buffers[a], a, f, g);
                this.elements[b] = new sc.CircuitOverviewMenu.Tree(0, 86, this.buffers[b], b, f, g);
                this.elements[c] = new sc.CircuitOverviewMenu.Tree(0, -86, this.buffers[c], c, f, g);
                this.elements[d] = new sc.CircuitOverviewMenu.Tree(86, 0, this.buffers[d], d, f, g);
                this.elements[e] = new sc.CircuitOverviewMenu.Tree(-86, 0, this.buffers[e], e, f, g);
                this.addChildGui(this.elements[a]);
                this.addChildGui(this.elements[b]);
                this.addChildGui(this.elements[c]);
                this.addChildGui(this.elements[d]);
                this.addChildGui(this.elements[e]);
                this.buttons[a] = new sc.CircuitOverviewMenu.FocusOverlay(0, 0, this.buffers[a], a);
                this.buttons[b] = new sc.CircuitOverviewMenu.FocusOverlay(0, 86, this.buffers[b], b);
                this.buttons[c] = new sc.CircuitOverviewMenu.FocusOverlay(0, -86, this.buffers[c], c);
                this.buttons[d] = new sc.CircuitOverviewMenu.FocusOverlay(86, 0, this.buffers[d], d);
                this.buttons[e] = new sc.CircuitOverviewMenu.FocusOverlay(-86, 0, this.buffers[e], e);
                this.addChildGui(this.buttons[a]);
                this.addChildGui(this.buttons[b]);
                this.addChildGui(this.buttons[c]);
                this.addChildGui(this.buttons[d]);
                this.addChildGui(this.buttons[e])
            },
            _updateBufferFromFirstTime: function(a) {
                this.updateBuffer(a)
            },
            _preDrawTree: function(a) {
                var b = a.panels.length,
                    c = 80 + 48 * a.element;
                if (a.rotation != void 0)
                    if (a.rotation != 0) {
                        ig.system.context.save();
                        ig.system.context.rotate(a.rotation);
                        this.gfx.draw(a.base.x, a.base.y, 65, 160, 127, 149);
                        ig.system.context.restore()
                    } else a.element == 0 ? this.gfx.draw(a.base.x, a.base.y, 392, 368, 93, 93) : this.gfx.draw(a.base.x, a.base.y,
                        65, 160, 127, 149);
                if (sc.model.player.getCore(a.element + 8) && ig.vars.get(sc.CIRCUIT_VAR_KEY + a.element) && sc.model.player.hasElement(a.element)) {
                    for (; b--;) {
                        this.gfx.draw(a.panels[b].x, a.panels[b].y, c, 112, 46, 46);
                        sc.menu.skillState == sc.MENU_SKILL_STATE.SWAP_BRANCHES && this.gfx.draw(a.panels[b].x, a.panels[b].y, 224 + a.element * 48, 320, 45, 45)
                    }
                    this.gfx.draw(a.node.x, a.node.y, a.element * 8, 304, 5, 5);
                    this._preDrawTreeNodes(a.element, a.node.x + 2, a.node.y + 2, a.startDir.x, a.startDir.y)
                }
            },
            _preDrawTreeNodes: function(a, c, e, f,
                g) {
                var h = sc.skilltree.getTree(a);
                d.x = c;
                d.y = e;
                b.x = f;
                b.y = g;
                for (var i = null, j = 0; j < h.length; j++) {
                    i = h[j];
                    if (!this.isEmpty(i)) {
                        this._drawLine(d.x, d.y, f, g, i, a);
                        this._preDrawTreeRecursive(a, i, c, e, b.x, b.y)
                    }
                    this._rotate("CW_90", f, g);
                    f = b.x;
                    g = b.y
                }
            },
            _preDrawTreeRecursive: function(d, e, f, g, h, i) {
                var j = false;
                if (e.orBranch) {
                    var k = e.orBranch;
                    this._rotate(e.direction, h, i);
                    j = Math.abs(b.x) == 1 && Math.abs(b.y) == 1;
                    f = f + ((j ? 4 : 5) + e.distance) * b.x;
                    g = g + ((j ? 2 : 5) + e.distance) * b.y;
                    a.x = b.x;
                    a.y = b.y;
                    this._rotate(k.direction, b.x, b.y);
                    if (j)
                        if (a.x <
                            0 && b.x == 0) {
                            f = f + 2;
                            g = g + (b.y > 0 ? 2 : -2)
                        } else if (a.x > 0 && b.x == 0) {
                        f = f - 2;
                        g = g + (b.y > 0 ? 2 : -2)
                    }(j = Math.abs(b.x) == 1 && Math.abs(b.y) == 1) && ig.error("orBranch can't be rendered with a slope direction.");
                    this._drawOrBranchConnection(f, g, b, d, false, k);
                    f = f + (j ? 3 : 4) * b.x;
                    g = g + (j ? 3 : 4) * b.y;
                    for (h = 0; h < 3; h++) {
                        c.x = 0 + d * 8;
                        c.y = 256 + (sc.model.player.hasSkill(k.left[h].uid) ? 8 : 0);
                        b.x != 0 ? this.gfx.draw(f - 2, g - 2 + (b.x > 0 ? -3 : 3), c.x, c.y, 5, 5) : this.gfx.draw(f - 2 + (b.y < 0 ? -3 : 3), g - 2, c.x, c.y, 5, 5);
                        c.y = 256 + (sc.model.player.hasSkill(k.right[h].uid) ? 8 : 0);
                        b.x !=
                            0 ? this.gfx.draw(f - 2, g - 2 + (b.x > 0 ? 3 : -3), c.x, c.y, 5, 5) : this.gfx.draw(f - 2 + (b.y < 0 ? 3 : -3), g - 2, c.x, c.y, 5, 5);
                        f = f + (j ? 3 : 5) * b.x;
                        g = g + (j ? 3 : 5) * b.y
                    }
                    this._drawOrBranchConnection(f, g, b, d, true, k, e);
                    f = f - b.x;
                    g = g - b.y
                } else {
                    this._rotate(e.direction, h, i);
                    j = Math.abs(b.x) == 1 && Math.abs(b.y) == 1;
                    f = f + ((j ? 3 : 5) + e.distance) * b.x;
                    g = g + ((j ? 3 : 5) + e.distance) * b.y;
                    c.x = 0 + d * 8;
                    c.y = 256 + (sc.model.player.hasSkill(e.uid) ? 8 : 0);
                    this.gfx.draw(f - Math.floor(2.5), g - Math.floor(2.5), c.x, c.y, 5, 5)
                }
                e = e.children;
                if (e.length != 0) {
                    j = null;
                    h = b.x;
                    i = b.y;
                    for (k = 0; k < e.length; k++) {
                        j =
                            e[k];
                        if (!this.isEmpty(j)) {
                            this._drawLine(f, g, h, i, j, d);
                            this._preDrawTreeRecursive(d, j, f, g, h, i)
                        }
                    }
                }
            },
            _drawLine: function(a, d, f, g, h, i) {
                if (!(h.distance <= 0)) {
                    var j = false,
                        j = h.orBranch ? sc.model.player.hasSkill(h.orBranch.left[0].uid) || sc.model.player.hasSkill(h.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(h.uid) ? true : false;
                    this._rotate(h.direction, f, g);
                    f = this._getDrawingDirection(b);
                    g = ig.system.context;
                    h = h.distance;
                    if (f == sc.LINE_DRAW_TYPE.HORZ) {
                        c.x = i * 8;
                        c.y = j ? 276 : 272;
                        this._drawLineStraightLine(b.x >
                            0 ? a + 3 : a - 2 - (8 - (8 - h)), d, h)
                    } else {
                        if (f == sc.LINE_DRAW_TYPE.VERT) {
                            c.x = i * 8;
                            c.y = j ? 276 : 272;
                            g.save();
                            g.translate((a + (b.y > 0 ? 1 : 0)) * ig.system.scale, (d + (b.y > 0 ? 3 : -2)) * ig.system.scale);
                            g.rotate(b.y > 0 ? e : -e);
                            this._drawLineStraightLine(0, 0, h)
                        } else {
                            c.x = i * 8;
                            c.y = j ? 288 : 280;
                            g.save();
                            g.translate(a * ig.system.scale, d * ig.system.scale);
                            g.scale(b.x < 0 ? -1 : 1, b.y < 0 ? -1 : 1);
                            this.gfx.draw(b.x < 0 ? 1 : 2, b.y < 0 ? 1 : 2, c.x, c.y, h, h)
                        }
                        g.restore()
                    }
                }
            },
            _drawLineStraightLine: function(a, b, d) {
                if (d <= 8) this.gfx.draw(a, b, c.x, c.y, d, 1);
                else
                    for (var e = Math.ceil(d /
                            8), f = 8; e--;) {
                        d < 8 && (f = d);
                        this.gfx.draw(a, b, c.x, c.y, f, 1);
                        a = a + 8;
                        d = Math.max(0, d - 8)
                    }
            },
            _drawOrBranchConnection: function(a, b, c, d, e, f, g) {
                var h = sc.model.player,
                    i = h.hasSkill(f.left[0].uid),
                    j = h.hasSkill(f.right[0].uid),
                    k = i || j;
                if (c.x < 0 || c.y < 0)
                    if (j) {
                        i = true;
                        j = false
                    } else if (i) {
                    j = true;
                    i = false
                }
                var m = false;
                j && !i && (m = true);
                var l = e;
                if (c.x < 0 || c.y < 0) l = !l;
                if (e) {
                    h.hasSkill(f.left[2].uid);
                    h.hasSkill(f.right[2].uid);
                    if (g.children[0].orBranch) {
                        i = h.hasSkill(g.children[0].orBranch.left[0].uid);
                        j = h.hasSkill(g.children[0].orBranch.right[0].uid);
                        k = i || j
                    } else k = h.hasSkill(g.children[0].uid)
                }
                c.x != 0 ? this.gfx.draw(a - (c.x < 0 ? 1 : 2), b - 3, d * 8 + (k ? 4 : 0), 296, 4, 7, l, m) : c.y != 0 && this.gfx.draw(a - 3, b - (c.y < 0 ? 1 : 2), 48, 256 + (d * 8 + (k ? 4 : 0)), 7, 4, m, l)
            },
            _rotate: function(a, c, d) {
                b.x = c;
                b.y = d;
                switch (sc.SKILLS_DIRECTION[a]) {
                    case sc.SKILLS_DIRECTION.CW_45:
                        Vec2.rotate(b, -f);
                        b.x = Math.round(b.x);
                        b.y = Math.round(b.y);
                        break;
                    case sc.SKILLS_DIRECTION.CCW_45:
                        Vec2.rotate(b, f);
                        b.x = Math.round(b.x);
                        b.y = Math.round(b.y);
                        break;
                    case sc.SKILLS_DIRECTION.CW_90:
                        Vec2.rotate90CCW(b);
                        break;
                    case sc.SKILLS_DIRECTION.CCW_90:
                        Vec2.rotate90CW(b);
                        break;
                    case sc.SKILLS_DIRECTION.CW_135:
                        Vec2.rotate(b, -g);
                        b.x = Math.round(b.x);
                        b.y = Math.round(b.y);
                        break;
                    case sc.SKILLS_DIRECTION.CCW_135:
                        Vec2.rotate(b, g);
                        b.x = Math.round(b.x);
                        b.y = Math.round(b.y)
                }
                return b
            },
            _getDrawingDirection: function(a) {
                if (a.x == 0 && a.y == 0) {
                    ig.error("Can't get cardinal direction when x and y are zero! Direction: [x: %i, y: %i]", a.x, a.y);
                    return -1
                }
                if (a.x >= 0) {
                    if (a.y < 0 && a.x == 0 || a.y > 0 && a.x == 0) return sc.LINE_DRAW_TYPE.VERT;
                    if (a.y == 0 && a.x > 0) return sc.LINE_DRAW_TYPE.HORZ;
                    if (a.y < 0 && a.x > 0 || a.y >
                        0 && a.x > 0) return sc.LINE_DRAW_TYPE.SLOPE
                } else {
                    if (a.y == 0 && a.x < 0) return sc.LINE_DRAW_TYPE.HORZ;
                    if (a.y < 0 && a.x < 0 || a.y > 0 && a.x < 0) return sc.LINE_DRAW_TYPE.SLOPE
                }
                return "If this return, you broke something horribly Bro."
            },
            isEmpty: function(a) {
                for (var b in a) return false;
                return true
            }
        });
    var o = {
        "0": {
            sx: 176,
            sy: 368,
            w: 92,
            h: 92,
            x: 1,
            y: 1
        },
        1: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 11,
            y: -11,
            rot: Math.PI / 2
        },
        2: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 11,
            y: -11,
            rot: -(Math.PI / 2)
        },
        3: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 0,
            y: 0
        },
        4: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 0,
            y: 0,
            rot: Math.PI
        }
    };
    sc.CircuitOverviewMenu.Tree = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        buffer: null,
        element: 0,
        needsUpdate: false,
        overlay: null,
        updater: null,
        done: null,
        _timer: 0,
        _alpha: 0,
        _firstTime: false,
        init: function(a, b, c, d, e, f) {
            this.parent();
            this.setSize(c.width, c.height);
            this.setPivot(c.width / 2, c.height / 2);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.buffer = c;
            this.element = d || 0;
            this.updater = e || null;
            this.done = f || null;
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: a,
                        offsetY: b
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: a + (a ? a > 0 ? 15 : -15 : 0),
                        offsetY: b + (b ? b > 0 ? 15 : -15 : 0)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            this.buffer && a.addGfx(this.buffer, 0, 0, 0, 0);
            if (this._timer > 0) {
                this._timer = this._timer - ig.system.tick;
                if (this._timer <= 0) {
                    this._timer = 0;
                    this.done && this.done(this.element)
                } else if (this._timer <= 1 && !ig.vars.get(sc.CIRCUIT_VAR_KEY + this.element) && !this._firstTime) {
                    ig.vars.set("menu.circuit.start." +
                        this.element, true);
                    this.updater(this.element);
                    this._firstTime = true
                }
                var b = (this._timer / 2).limit(0, 1);
                this._alpha = this._timer > 1 ? 2 - KEY_SPLINES.LINEAR.get(b * 2) : KEY_SPLINES.LINEAR.get(b * 2);
                b = o[this.element];
                b.rot && a.addTransform().setPivot(this.buffer.width / 2, this.buffer.height / 2).setRotate(b.rot);
                a.addGfx(this.gfx, b.x, b.y, b.sx, b.sy, b.w, b.h).setAlpha(this._alpha);
                b.rot && a.undoTransform()
            }
        },
        show: function() {
            this.doStateTransition("DEFAULT", false, false, function() {
                if (sc.model.player.getCore(this.element + 8) &&
                    !ig.vars.get(sc.CIRCUIT_VAR_KEY + this.element)) {
                    ig.interact.setBlockDelay(2);
                    this._timer = 2
                }
            }.bind(this), 0.1)
        }
    });
    var m = [{
            x: 47,
            y: 47
        }],
        n = [{
            x: 52,
            y: 47
        }, {
            x: 75,
            y: 70
        }, {
            x: 98,
            y: 47
        }],
        p = [{
            x: 52,
            y: 81
        }, {
            x: 75,
            y: 58
        }, {
            x: 98,
            y: 81
        }],
        r = [{
            x: 47,
            y: 52
        }, {
            x: 70,
            y: 75
        }, {
            x: 47,
            y: 98
        }],
        t = [{
            x: 81,
            y: 52
        }, {
            x: 58,
            y: 75
        }, {
            x: 81,
            y: 98
        }];
    sc.CircuitOverviewMenu.FocusOverlay = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        rotation: 0,
        neutral: false,
        piv: Vec2.createC(0, 0),
        points: [],
        element: 0,
        submitSound: null,
        focusable: false,
        init: function(a,
            b, c, d) {
            this.parent();
            this.setSize(c.width, c.height);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.element = d;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: a,
                        offsetY: b
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: a + (a ? a > 0 ? 15 : -15 : 0),
                        offsetY: b + (b ? b > 0 ? 15 : -15 : 0)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            switch (this.element) {
                case sc.ELEMENT.NEUTRAL:
                    this.points = m;
                    break;
                case sc.ELEMENT.HEAT:
                    this.points = n;
                    this.rotation =
                        e;
                    this.piv.y = -c.width || 0;
                    break;
                case sc.ELEMENT.COLD:
                    this.points = p;
                    this.rotation = -e;
                    this.piv.x = -c.height || 0;
                    break;
                case sc.ELEMENT.SHOCK:
                    this.points = r;
                    break;
                case sc.ELEMENT.WAVE:
                    this.points = t;
                    this.rotation = -Math.PI;
                    this.piv.y = -c.height || 0;
                    this.piv.x = -c.width || 0
            }
            this.doStateTransition("HIDDEN", true)
        },
        onButtonPress: function() {
            if (this.focusable) {
                this.submitSound && this.submitSound.play();
                sc.menu.selectSkillTree(this.element)
            }
        },
        updateDrawables: function(a) {
            if (sc.menu.skillState != sc.MENU_SKILL_STATE.SWAP_BRANCHES &&
                (!ig.interact.isBlocked() && this.focusable) && this.focus)
                if (this.element != sc.ELEMENT.NEUTRAL) {
                    a.addTransform().setRotate(this.rotation);
                    a.addGfx(this.gfx, -3 + this.piv.x, 2 + this.piv.y, 192, 160, 122, 145);
                    a.undoTransform()
                } else a.addGfx(this.gfx, -3, -3, 320, 168, 99, 99)
        },
        canPlayFocusSounds: function() {
            return !ig.interact.isBlocked() || this.focusable
        },
        isMouseOver: function() {
            if (!this.focusable || ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) return false;
            for (var a = Math.floor(this.hook.screenCoords.x), b = Math.floor(this.hook.screenCoords.y),
                    c = Math.floor(sc.control.getMouseX()), d = Math.floor(sc.control.getMouseY()), e = this.points.length; e--;)
                if (Math.abs(c - (this.points[e].x + a)) + Math.abs(d - (this.points[e].y + b)) <= 45) return true;
            return false
        }
    })
});
ig.baked = !0;
