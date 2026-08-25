ig.module("impact.feature.gui.gui").requires("impact.base.image", "impact.base.game", "impact.feature.storage.storage").defines(function() {
    function b(a, b) {
        return a.zIndex - b.zIndex
    }

    function a(a, b) {
        switch (a.align.x) {
            case ig.GUI_ALIGN.X_LEFT:
                return a.pos.x;
            case ig.GUI_ALIGN.X_RIGHT:
                return b - a.size.x - a.pos.x;
            case ig.GUI_ALIGN.X_CENTER:
                return Math.floor(b / 2 - a.size.x / 2 + a.pos.x)
        }
        return 0
    }

    function d(a, b) {
        switch (a.align.y) {
            case ig.GUI_ALIGN.Y_TOP:
                return a.pos.y;
            case ig.GUI_ALIGN.Y_BOTTOM:
                return b - a.size.y - a.pos.y;
            case ig.GUI_ALIGN.Y_CENTER:
                return Math.floor(b / 2 - a.size.y / 2 + a.pos.y)
        }
        return 0
    }

    function c(a) {
        for (var b = 0; b < a.length; ++b) {
            a[b].gui.varsChanged && a[b].gui.varsChanged();
            c(a[b].children)
        }
    }

    function e(a, b) {
        if (b != a._visible) {
            a._visible = b;
            if (a.gui.onVisibilityChange) a.gui.onVisibilityChange(b)
        }
    }

    function f(b, c) {
        var e = c.parentHook,
            g;
        if (e instanceof ig.Gui) {
            b.active = c.pauseGui || !ig.game.paused;
            g = ig.system.width;
            e = ig.system.height
        } else {
            f(b, e);
            b.x = b.x + e.scroll.x;
            b.y = b.y + e.scroll.y;
            g = e.size.x;
            e = e.size.y
        }
        b.x = b.x +
            a(c, g);
        b.y = b.y + d(c, e)
    }
    ig.perf.gui = true;
    var g = [],
        h = [],
        i = ig.Class.extend({
            drawSteps: [],
            addGfx: function(a, b, c, d, e, f, g, h, i) {
                return this.addDraw().setGfx(a, b, c, d, e, f, g, h, i)
            },
            addGfxTile: function(a, b, c, d, e, f, g, h) {
                return this.addDraw().setGfxTile(a, b, c, d, e, f, g, h)
            },
            addVideo: function(a, b, c, d, e) {
                return this.addDraw().setVideo(a, b, c, d, e)
            },
            addGameStateDraw: function(a, b, c) {
                return this.addDraw().setGameStateDraw(a, b, c)
            },
            addColor: function(a, b, c, d, e) {
                return this.addDraw().setColor(a, b, c, d, e)
            },
            addPattern: function(a,
                b, c, d, e, f, g) {
                return this.addDraw().setPattern(a, b, c, d, e, f, g)
            },
            addText: function(a, b, c) {
                return this.addDraw().setText(a, b, c)
            },
            clearDrawSteps: function() {
                for (; this.drawSteps.length;) {
                    var a = this.drawSteps.pop();
                    a && a.kill()
                }
            },
            addDraw: function() {
                var a = k.get(ig.GuiDrawable);
                this.drawSteps.push(a);
                return a
            },
            addTransform: function() {
                var a = k.get(ig.GuiTransform);
                this.drawSteps.push(a);
                return a
            },
            undoTransform: function() {
                this.drawSteps.push(null)
            },
            draw: function() {
                for (var a = ig.system, b = a.context, c = a.scale, d = 0, e =
                        0, f = this.drawSteps, g = f.length, i = 0; i < g; ++i) {
                    var j = f[i];
                    if (j)
                        if (j.draw) j.draw(d, e);
                        else {
                            if (j.transform) {
                                h.push(j);
                                if (j.isComplex()) {
                                    j.transform(d, e);
                                    d = e = 0
                                } else {
                                    d = d + a.getDrawPos(j.translate.x) / c;
                                    e = e + a.getDrawPos(j.translate.y) / c
                                }
                                if (j.alpha != 1) {
                                    j.preAlpha = b.globalAlpha;
                                    b.globalAlpha = b.globalAlpha * j.alpha
                                }
                            }
                        }
                    else {
                        j = h.pop();
                        if (!j) throw Error("Gui Draw: tried to undo non existing transform. Too many undos?");
                        if (j.isComplex()) {
                            b.restore();
                            d = j.prePos.x;
                            e = j.prePos.y
                        } else {
                            d = d - a.getDrawPos(j.translate.x) / c;
                            e =
                                e - a.getDrawPos(j.translate.y) / c
                        }
                        if (j.alpha != 1) b.globalAlpha = j.preAlpha
                    }
                }
                if (h.length > 0) throw Error("Exited gui draw with transform remaining. Forgot to undo transform");
            }
        }),
        j = 0;
    ig.Gui = ig.GameAddon.extend({
        guiHooks: [],
        namedGuiElements: {},
        screenBlocked: false,
        renderer: new i,
        mouseListenerHooks: [],
        controlModule: null,
        init: function() {
            this.parent("GUI");
            ig.storage.register(this)
        },
        setControlModule: function(a) {
            this.controlModule = a
        },
        onStorageSave: function(a) {
            var b = {},
                c;
            for (c in this.namedGuiElements) {
                var d = this.namedGuiElements[c].hook.mapGuiInfo;
                b[c] = {
                    settings: d.settings,
                    type: d.type
                }
            }
            a.gui = b
        },
        onStoragePreLoad: function(a) {
            this.onReset();
            var a = a.gui,
                b;
            for (b in a) {
                var c = a[b];
                if (!ig.GUI[c.type] || !ig.GUI[c.type]._noGuiSave) {
                    c = this.createEventGui(b, c.type, c.settings, true);
                    this.spawnEventGui(c)
                }
            }
        },
        deferredUpdateOrder: 500,
        onDeferredUpdate: function() {
            this.screenBlocked = false;
            this.renderer.clearDrawSteps();
            this._updateGuiMouse();
            j = 0;
            this._updateRecursive(0, 0, ig.system.width, ig.system.height, g, true, this.guiHooks, 0, 0, 1, true);
            ig.game.mapRenderingBlocked =
                this.screenBlocked
        },
        postDrawOrder: 500,
        onPostDraw: function() {
            ig.perf.gui && this.renderer.draw()
        },
        onVarsChanged: function() {
            c(this.guiHooks)
        },
        clearNamedGuiElements: function() {
            for (var a in this.namedGuiElements) this.namedGuiElements[a].remove();
            this.namedGuiElements = {}
        },
        onReset: function() {
            this.clearNamedGuiElements();
            for (var a = this.guiHooks.length; a--;)
                if (this.guiHooks[a].temporary) {
                    this.guiHooks[a].onDetach();
                    this.guiHooks.splice(a, 1)
                }
        },
        logGUIArray: function() {
            console.groupCollapsed("GUI Array Elements:");
            for (var a in ig.GUI) ig.GUI[a] && console.log(a);
            console.groupEnd()
        },
        createEventGui: function(a, b, c, d) {
            var e = ig.GUI[b];
            if (!e) return null;
            e = new e(c);
            e.hook.mapGuiInfo = {
                name: a,
                type: b,
                settings: c,
                free: d || false
            };
            return e
        },
        spawnEventGui: function(a) {
            var b = a.hook.mapGuiInfo,
                c = ig.GUI[b.type];
            b.name && (this.namedGuiElements[b.name] = a);
            if (c.spawnHandler) {
                a.hook.removeAfterTransition = false;
                c.spawnHandler(a)
            } else this.addGuiElement(a)
        },
        freeEventGui: function(a) {
            if (a) a.hook.parentHook ? a.hook.mapGuiInfo.free = true : a.clearCached &&
                a.clearCached()
        },
        addGuiElement: function(a) {
            a = a.hook;
            a.removeAfterTransition = false;
            if (this.guiHooks.indexOf(a) == -1) {
                this.guiHooks.push(a);
                this.guiHooks.sort(b);
                a.onAttach(this)
            }
        },
        sortGui: function() {
            this.guiHooks.sort(b)
        },
        removeGuiElement: function(a) {
            this.guiHooks.erase(a.hook)
        },
        _updateGuiMouse: function() {
            var a, b;
            if (this.controlModule) {
                a = this.controlModule.getMouseX();
                b = this.controlModule.getMouseY()
            } else {
                a = ig.input.mouse.x;
                b = ig.input.mouse.y
            }
            for (var c = null, d = this.controlModule && this.controlModule.getGuiClick(),
                    e = 0; e < this.mouseListenerHooks.length; ++e) {
                var g = this.mouseListenerHooks[e];
                if (g._visible) {
                    if (!g.screenCoords) {
                        g.screenCoords = {
                            x: 0,
                            y: 0,
                            w: g.size.x,
                            h: g.size.y,
                            active: false,
                            zIndex: 0
                        };
                        f(g.screenCoords, g)
                    }
                    var h = g.screenCoords;
                    if (h.active) {
                        var i = false;
                        if (i = g.gui.isMouseOver ? g.gui.isMouseOver() : h.x <= a && h.x + h.w > a && h.y <= b && h.y + h.h > b)
                            if (c)
                                if (c.screenCoords.zIndex < g.screenCoords.zIndex) {
                                    c.mouseOver = false;
                                    c.gui.onMouseInteract && c.gui.onMouseInteract(false, false);
                                    c = g
                                } else i = false;
                        else c = g;
                        if (!i) {
                            g.mouseOver = i;
                            g.gui.onMouseInteract && g.gui.onMouseInteract(false, false)
                        }
                    }
                }
            }
            if (c) {
                c.mouseOver = true;
                c.gui.onMouseInteract && c.gui.onMouseInteract(true, d)
            }
        },
        _updateRecursive: function(b, c, f, g, h, i, k, q, s, v, y) {
            for (var u = h.length > 0, z = false, D = 0; D < k.length; ++D) {
                var C, A, B, w;
                if (u) {
                    C = h[h.length - 4];
                    A = h[h.length - 3];
                    B = h[h.length - 2];
                    w = h[h.length - 1]
                }
                var x = k[D],
                    E = y && (k != this.guiHooks || x.pauseGui || !ig.game.paused);
                if (E && x.updateState()) {
                    x.onDetach();
                    k.splice(D, 1);
                    D--;
                    if (x.mapGuiInfo) {
                        var G = x.mapGuiInfo.name;
                        G && this.namedGuiElements[G] ==
                            x.gui && delete this.namedGuiElements[x.mapGuiInfo.name];
                        x.mapGuiInfo.free && x.gui.clearCached && x.gui.clearCached()
                    }
                } else {
                    var J = E;
                    if (E && (x._visible || x.invisibleUpdate)) {
                        J = false;
                        x.gui.update()
                    }
                    var I = x.size.x,
                        K = x.size.y,
                        H = b,
                        M = c,
                        L = q,
                        N = s,
                        H = H + a(x, f),
                        M = M + d(x, g),
                        F = x.currentState,
                        O = v * F.alpha;
                    if (F.alpha == 1 && x.screenBlocking) ig.gui.screenBlocked = true;
                    H = H + (x.align.x == ig.GUI_ALIGN.X_RIGHT ? -F.offsetX : F.offsetX);
                    M = M + (x.align.y == ig.GUI_ALIGN.Y_BOTTOM ? -F.offsetY : F.offsetY);
                    L = L + H;
                    N = N + M;
                    if ((G = i && O > 0.01 && F.scaleX != 0 &&
                            F.scaleY != 0) && u) {
                        C = C - H;
                        A = A - M;
                        if (F.scaleX != 1 || F.scaleY != 1 || F.angle != 0) {
                            C = C - x.pivot.x;
                            A = A - x.pivot.y;
                            C = C / Math.abs(F.scaleX);
                            A = A / Math.abs(F.scaleY);
                            C = C + x.pivot.x;
                            A = A + x.pivot.y;
                            B = B / Math.abs(F.scaleX);
                            w = w / Math.abs(F.scaleY)
                        }
                        G = !(0 >= C + B || 0 >= A + w || I <= C || K <= A)
                    }
                    if (x.screenCoords) {
                        j++;
                        x.screenCoords.x = L;
                        x.screenCoords.y = N;
                        x.screenCoords.w = x.size.x;
                        x.screenCoords.h = x.size.y;
                        x.screenCoords.active = E;
                        x.screenCoords.zIndex = j;
                        if (u) {
                            if (C > 0) {
                                x.screenCoords.x = x.screenCoords.x + C;
                                x.screenCoords.w = x.screenCoords.w - C
                            }
                            if (A >
                                0) {
                                x.screenCoords.y = x.screenCoords.y + A;
                                x.screenCoords.h = x.screenCoords.h - A
                            }
                            x.screenCoords.w = Math.min(x.screenCoords.w, B + (C < 0 ? C : 0));
                            x.screenCoords.h = Math.min(x.screenCoords.h, w + (A < 0 ? A : 0))
                        }
                    }
                    J && G && x.gui.update();
                    if (x._subState.subtreeTransition || G || x._visible || x.invisibleUpdate) {
                        J = this.renderer.addTransform();
                        J.setTranslate(H, M);
                        J.setScale(F.scaleX, F.scaleY);
                        J.setPivot(x.pivot.x, x.pivot.y);
                        J.setRotate(F.angle);
                        J.setAlpha(O);
                        x.clip && J.setClip(x.size.x, x.size.y);
                        H = x.clip;
                        if (G && (u || H))
                            if (H)
                                if (u) {
                                    var M =
                                        Math.max(C, 0),
                                        F = Math.max(A, 0),
                                        J = Math.min(C + B, I),
                                        P = Math.min(A + w, K);
                                    h.push(M, F, J - M, P - F)
                                } else h.push(0, 0, I, K);
                        else h.push(C, A, B, w);
                        e(x, G);
                        if (G && x.localAlpha > 0) {
                            x.localAlpha != 1 && this.renderer.addTransform().setAlpha(x.localAlpha);
                            x.gui.updateDrawables(this.renderer);
                            x.localAlpha != 1 && this.renderer.undoTransform()
                        }
                        E = this._updateRecursive(x.scroll.x, x.scroll.y, I, K, h, G, x.children, L, N, O, E);
                        x._subState.subtreeTransition = x.hasTransition() || E;
                        z = z || x._subState.subtreeTransition;
                        if (G && (u || H)) h.length = h.length -
                            4;
                        this.renderer.undoTransform()
                    }
                }
            }
            return z
        },
        _drawRecursive: function(a, b, c, d, e) {
            for (var f = ig.system.context, g = 0; g < e.length; ++g) {
                var h = e[g],
                    i = a,
                    j = b;
                switch (h.align.x) {
                    case ig.GUI_ALIGN.X_LEFT:
                        i = i + h.pos.x;
                        break;
                    case ig.GUI_ALIGN.X_RIGHT:
                        i = i + (c - h.size.x - h.pos.x);
                        break;
                    case ig.GUI_ALIGN.X_CENTER:
                        i = i + Math.floor(c / 2 - h.size.x / 2 + h.pos.x)
                }
                switch (h.align.y) {
                    case ig.GUI_ALIGN.Y_TOP:
                        j = j + h.pos.y;
                        break;
                    case ig.GUI_ALIGN.Y_BOTTOM:
                        j = j + (d - h.size.y - h.pos.y);
                        break;
                    case ig.GUI_ALIGN.Y_CENTER:
                        j = j + Math.floor(d / 2 - h.size.y /
                            2 + h.pos.y)
                }
                var k = h.currentState;
                if (h._visible) {
                    var i = i + (h.align.x == ig.GUI_ALIGN.X_RIGHT ? -k.offsetX : k.offsetX),
                        j = j + (h.align.y == ig.GUI_ALIGN.Y_BOTTOM ? -k.offsetY : k.offsetY),
                        u = f.globalAlpha,
                        z = u * k.alpha,
                        D = z * h.localAlpha,
                        C = false;
                    if (h.clip || k.scaleX != 1 || k.scaleY != 1 || k.angle != 0) {
                        C = true;
                        f.save();
                        f.translate(ig.system.getDrawPos(i), ig.system.getDrawPos(j));
                        i = j = 0;
                        if (h.clip) {
                            f.beginPath();
                            f.rect(0, 0, h.size.x, h.size.y);
                            f.clip()
                        }
                        if (k.scaleX != 1 || k.scaleY != 1 || k.angle != 0) {
                            f.translate(ig.system.getDrawPos(h.pivot.x),
                                ig.system.getDrawPos(h.pivot.y));
                            f.rotate(k.angle);
                            f.scale(k.scaleX, k.scaleY);
                            f.translate(-ig.system.getDrawPos(h.pivot.x), -ig.system.getDrawPos(h.pivot.y))
                        }
                    }
                    k = h.drawables;
                    if (D > 0 && k.length > 0) {
                        if (u != D) f.globalAlpha = D;
                        for (var A = 0; A < k.length; ++A) k[A].draw(i, j);
                        if (D != z) f.globalAlpha = z
                    } else if (u != z) f.globalAlpha = z;
                    this._drawRecursive(h.scroll.x + i, h.scroll.y + j, h.size.x, h.size.y, h.children);
                    if (u != z) f.globalAlpha = u;
                    C && ig.system.context.restore()
                }
            }
        },
        _addMouseListenerHook: function(a) {
            this.mouseListenerHooks.push(a)
        },
        _removeMouseListenerHook: function(a) {
            this.mouseListenerHooks.erase(a)
        }
    });
    ig.addGameAddon(function() {
        return ig.gui = new ig.Gui
    });
    ig.GUI = {};
    ig.GUI_ALIGN = {};
    ig.GUI_ALIGN.Y_TOP = 1;
    ig.GUI_ALIGN.Y_CENTER = 2;
    ig.GUI_ALIGN.Y_BOTTOM = 3;
    ig.GUI_ALIGN.X_LEFT = 4;
    ig.GUI_ALIGN.X_CENTER = 5;
    ig.GUI_ALIGN.X_RIGHT = 6;
    ig.GUI_ALIGN_X = {
        LEFT: ig.GUI_ALIGN.X_LEFT,
        RIGHT: ig.GUI_ALIGN.X_RIGHT,
        CENTER: ig.GUI_ALIGN.X_CENTER
    };
    ig.GUI_ALIGN_Y = {
        TOP: ig.GUI_ALIGN.Y_TOP,
        BOTTOM: ig.GUI_ALIGN.Y_BOTTOM,
        CENTER: ig.GUI_ALIGN.Y_CENTER
    };
    ig.GuiHook = ig.Class.extend({
        pos: Vec2.create(),
        size: {
            x: 1,
            y: 1
        },
        pivot: {
            x: 0,
            y: 0
        },
        scroll: {
            x: 0,
            y: 0
        },
        align: {
            x: ig.GUI_ALIGN.X_LEFT,
            y: ig.GUI_ALIGN.Y_TOP
        },
        parentHook: null,
        children: [],
        mouseRecord: false,
        screenCoords: null,
        mouseOver: false,
        localAlpha: 1,
        zIndex: 0,
        pauseGui: false,
        invisibleUpdate: false,
        screenBlocking: false,
        stateCallback: null,
        clip: false,
        temporary: false,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        gui: null,
        currentState: {
            offsetX: 0,
            offsetY: 0,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0
        },
        currentStateName: "",
        anim: {
            targetState: null,
            initState: null,
            timer: 0,
            maxTime: 0,
            timeFunction: null
        },
        removeAfterTransition: false,
        posTransition: null,
        scrollTransition: null,
        _visible: false,
        _subState: {
            subtreeTransition: false
        },
        mapGuiInfo: null,
        drawSteps: [],
        init: function(a) {
            this.gui = a;
            if (a.transitions) {
                this.transitions = a.transitions;
                this.doStateTransition("DEFAULT", true)
            }
        },
        setMouseRecord: function(a) {
            if (this.mouseRecord != a) {
                this.mouseRecord = a;
                this.parentHook && (a ? ig.gui._addMouseListenerHook(this) : ig.gui._removeMouseListenerHook(this))
            }
        },
        onAttach: function(a) {
            if (this.parentHook !=
                a) {
                this.parentHook = a;
                e(this, a instanceof ig.Gui ? true : a._visible);
                this.mouseRecord && ig.gui._addMouseListenerHook(this);
                this.gui.onAttach && this.gui.onAttach();
                for (a = this.children.length; a--;) this.children[a].onAttach(this)
            }
        },
        onDetach: function() {
            if (this.parentHook) {
                if (this.mouseRecord) {
                    this.screenCoords = null;
                    ig.gui._removeMouseListenerHook(this)
                }
                for (var a = this.children.length; a--;) this.children[a].onDetach();
                this.gui.onDetach && this.gui.onDetach();
                this.parentHook = null
            }
        },
        getChildGuiIndex: function(a) {
            return this.children.indexOf(a)
        },
        getChildGuiByIndex: function(a) {
            return this.children[a]
        },
        addChildHook: function(a) {
            a.removeAfterTransition = false;
            this.children.erase(a);
            a.onDetach();
            this.children.push(a);
            this.parentHook && a.onAttach(this)
        },
        insertChildHook: function(a, b) {
            a.removeAfterTransition = false;
            this.children.erase(a);
            a.onDetach();
            this.children.splice(b, 0, a);
            this.parentHook && a.onAttach(this)
        },
        removeChildHook: function(a) {
            a.removeAfterTransition = false;
            this.children.erase(a);
            a.onDetach()
        },
        removeChildHookByIndex: function(a) {
            a = this.children.splice(a,
                1)[0];
            a.removeAfterTransition = false;
            a.onDetach();
            return a
        },
        removeAllChildren: function() {
            for (var a = this.children.length; a--;) {
                this.children[a].onDetach();
                this.children[a].removeAfterTransition = false
            }
            this.children.length = 0
        },
        doStateTransition: function(a, b, c, d, e) {
            var f = this.transitions[a];
            if (!f) throw Error("No Transition found with name: " + a);
            if (!this.removeAfterTransition) {
                this.removeAfterTransition = c || false;
                this.stateCallback = null;
                if (!b)
                    for (var g = this.parentHook; g && g != ig.gui;) {
                        g._subState.subtreeTransition =
                            true;
                        g = g.parentHook
                    }
                if (this.currentStateName == a) {
                    if (d) this.stateCallback = d;
                    this.anim.timer = Math.max(this.anim.timer, b ? f.time : 0 - (e || 0))
                } else {
                    this.currentStateName = a;
                    this._setStateData(f.state, f.time, f.timeFunction, b, c, d, e)
                }
            }
        },
        getStateTransitionProgress: function() {
            return !this.anim.maxTime ? 1 : Math.min(1, this.anim.timer / this.anim.maxTime)
        },
        doTempStateTransition: function(a, b, c, d, e, f, g) {
            if (!this.removeAfterTransition) {
                this.removeAfterTransition = e || false;
                this.currentStateName = null;
                this._setStateData(a, b,
                    c, d, e, f, g)
            }
        },
        setScale: function(a, b) {
            this.currentState.scaleX = a;
            this.currentState.scaleY = b
        },
        _setStateData: function(a, b, c, d, e, f, g) {
            if (f) this.stateCallback = f;
            this.anim.initState = ig.copy(this.currentState);
            var e = {
                    offsetX: 0,
                    offsetY: 0,
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                    angle: 0
                },
                h;
            for (h in a) e[h] = a[h];
            this.anim.targetState = e;
            this.anim.maxTime = b;
            this.anim.timer = d ? b : 0 - (g || 0);
            this.anim.timeFunction = c;
            if (d) this.currentState = ig.copy(e)
        },
        doPosTranstition: function(a, b, c, d, e, f, g) {
            f && (c = Math.max(c, this.posTransition ? this.posTransition.time -
                this.posTransition.timer : 0));
            if (!c || c <= 0) {
                this.pos.x = a;
                this.pos.y = b;
                this.posTransition = null
            } else this.posTransition = {
                startX: this.pos.x,
                startY: this.pos.y,
                x: a,
                y: b,
                time: c,
                timeFunction: d || KEY_SPLINES.EASE_IN_OUT,
                timer: 0 - (e || 0),
                endCallback: g
            }
        },
        getPosTransitionProgress: function() {
            return !this.posTransition ? 1 : this.posTransition.timeFunction.get(this.posTransition.timer / this.posTransition.time)
        },
        doScrollTransition: function(a, b, c, d, e) {
            if (!c || c <= 0 || Math.abs(a - this.scroll.x) < ig.COLLISION.EPS && Math.abs(b - this.scroll.y) <
                ig.COLLISION.EPS) {
                this.scroll.x = a;
                this.scroll.y = b;
                this.scrollTransition = null
            } else this.scrollTransition = {
                startX: this.scroll.x,
                startY: this.scroll.y,
                x: a,
                y: b,
                time: c,
                timeFunction: d || KEY_SPLINES.EASE_IN_OUT,
                timer: 0,
                endCallback: e || null
            }
        },
        hasTransition: function() {
            return !!this.anim.targetState
        },
        getTransitionFactor: function() {
            return (this.anim.timer / this.anim.maxTime).limit(0, 1)
        },
        setStateValue: function(a, b, c) {
            this.transitions[a] && (this.transitions[a].state[b] = c)
        },
        updateState: function() {
            if (this.posTransition) {
                this.posTransition.timer =
                    this.posTransition.timer + ig.system.actualTick;
                var a = Math.min(1, Math.max(0, this.posTransition.timer) / this.posTransition.time),
                    a = this.posTransition.timeFunction.get(a);
                this.pos.x = this.posTransition.startX * (1 - a) + this.posTransition.x * a;
                this.pos.y = this.posTransition.startY * (1 - a) + this.posTransition.y * a;
                if (a == 1) {
                    this.posTransition.endCallback && this.posTransition.endCallback();
                    this.posTransition = null
                }
            }
            if (this.scrollTransition) {
                this.scrollTransition.timer = this.scrollTransition.timer + ig.system.actualTick;
                a =
                    Math.min(1, this.scrollTransition.timer / this.scrollTransition.time);
                a = this.scrollTransition.timeFunction.get(a);
                this.scroll.x = this.scrollTransition.startX * (1 - a) + this.scrollTransition.x * a;
                this.scroll.y = this.scrollTransition.startY * (1 - a) + this.scrollTransition.y * a;
                if (a == 1) {
                    a = this.scrollTransition.endCallback;
                    this.scrollTransition = null;
                    a && a()
                }
            }
            if (this.anim.targetState) {
                this.anim.timer = this.anim.timer + ig.system.actualTick;
                var a = (this.anim.timer / this.anim.maxTime).limit(0, 1),
                    a = this.anim.timeFunction.get(a),
                    b;
                for (b in this.anim.targetState) this.currentState[b] = (1 - a) * this.anim.initState[b] + a * this.anim.targetState[b];
                if (a == 1) {
                    this.anim.targetState = null;
                    if (this.stateCallback) {
                        a = this.stateCallback;
                        this.stateCallback = null;
                        a()
                    }
                } else return false
            }
            return this.removeAfterTransition
        }
    });
    ig.GuiDrawable = ig.Class.extend({
        pos: {
            x: 0,
            y: 0
        },
        size: {
            x: 0,
            y: 0
        },
        src: {
            x: 0,
            y: 0
        },
        gfxSource: null,
        gfxType: 0,
        flip: {
            x: false,
            y: false
        },
        alpha: 1,
        compositionMode: "source-over",
        setPos: function(a, b) {
            this.pos.x = a;
            this.pos.y = b;
            return this
        },
        setSize: function(a,
            b) {
            this.size.x = a;
            this.size.y = b;
            return this
        },
        setSrc: function(a, b) {
            this.src.x = a;
            this.src.y = b;
            return this
        },
        setAlpha: function(a) {
            this.alpha = a;
            return this
        },
        setColor: function(a, b, c, d, e) {
            this.gfxSource = a;
            this.gfxType = 3;
            this.setPos(b, c);
            this.setSize(d, e);
            return this
        },
        setCompositionMode: function(a) {
            this.compositionMode = a || "source-over";
            return this
        },
        setGfx: function(a, b, c, d, e, f, g, h, i) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.Image || a instanceof ig.ImageAtlasFragment)) throw Error("Invalid setGfx Call. gfx is not instance of ig.Image");
            this.gfxSource = a;
            this.gfxType = 1;
            this.setPos(b, c);
            this.setSrc(d, e);
            this.setSize(f, g);
            this.flip.x = h || false;
            this.flip.y = i || false;
            return this
        },
        setGfxTile: function(a, b, c, d, e, f, g, h) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.Image)) throw Error("Invalid setGfxTile Call. gfx is not instance of ig.Image");
            f = f ? f : e;
            this.setGfx(a, b, c, Math.floor(d * e) % a.width, Math.floor(d * e / a.width) * f, e, f, g, h);
            return this
        },
        setVideo: function(a, b, c, d, e) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.Video)) throw Error("Invalid setVideo Call. video is not instance of ig.Video");
            this.gfxSource = a;
            this.gfxType = 5;
            this.setPos(b, c);
            this.setSize(d, e);
            return this
        },
        setGameStateDraw: function(a, b, c) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.GameState)) throw Error("Invalid setGameStateDraw Call. gamestate is not instance of ig.GameState");
            this.gfxSource = a;
            this.gfxType = 6;
            this.setPos(b, c);
            return this
        },
        setPattern: function(a, b, c, d, e, f, g) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.ImagePattern)) throw Error("Invalid setPattern Call. gfx is not instance of ig.ImagePattern");
            this.gfxSource =
                a;
            this.gfxType = 2;
            this.color = this.gfx = null;
            this.setPos(b, c);
            this.setSrc(d, e);
            this.setSize(f, g);
            return this
        },
        setText: function(a, b, c) {
            if (window.IG_GAME_DEBUG && !(a instanceof ig.TextBlock)) throw Error("Invalid setText Call. gfx is not instance of ig.TextBlock");
            this.gfxSource = a;
            this.gfxType = 4;
            this.setPos(b, c);
            return this
        },
        draw: function(a, b) {
            var c = ig.system,
                d = c.context,
                e = c.scale,
                f = a + this.pos.x,
                g = b + this.pos.y,
                h, i;
            if (this.alpha != 1) {
                h = d.globalAlpha;
                d.globalAlpha = d.globalAlpha * this.alpha
            }
            if (this.compositionMode !=
                "source-over") {
                i = d.globalCompositeOperation;
                d.globalCompositeOperation = this.compositionMode
            }
            if (this.gfxType == 3) {
                d.fillStyle = this.gfxSource;
                d.fillRect(c.getDrawPos(f), c.getDrawPos(g), this.size.x * e, this.size.y * e)
            } else this.gfxType == 1 ? this.gfxSource.draw(f, g, this.src.x, this.src.y, this.size.x, this.size.y, this.flip.x, this.flip.y) : this.gfxType == 5 ? this.gfxSource.draw(f, g, this.size.x, this.size.y) : this.gfxType == 6 ? this.gfxSource.forceDraw(f, g) : this.gfxType == 2 ? this.gfxSource.draw(f, g, this.src.x, this.src.y, this.size.x,
                this.size.y) : this.gfxType == 4 && this.gfxSource.draw(f, g);
            if (d.globalCompositeOperation != "source-over") d.globalCompositeOperation = i;
            if (this.alpha != 1) d.globalAlpha = h
        },
        kill: function() {
            this.gfxSource = null;
            this.gfxType = 0;
            k.free(this)
        },
        clear: function() {
            this.alpha = 1;
            this.src.x = this.src.y = this.size.x = this.size.y = void 0;
            this.flip.x = this.flip.y = false;
            this.compositionMode = "source-over"
        }
    });
    ig.GuiTransform = ig.Class.extend({
        translate: {
            x: 0,
            y: 0
        },
        scale: {
            x: 1,
            y: 1
        },
        rotate: 0,
        pivot: {
            x: 0,
            y: 0
        },
        alpha: 1,
        clip: {
            x: 0,
            y: 0
        },
        prePos: {
            x: 0,
            y: 0
        },
        preAlpha: 0,
        setAlpha: function(a) {
            this.alpha = a;
            return this
        },
        setClip: function(a, b) {
            this.clip.x = a;
            this.clip.y = b;
            return this
        },
        setTranslate: function(a, b) {
            this.translate.x = a;
            this.translate.y = b;
            return this
        },
        setScale: function(a, b) {
            this.scale.x = a;
            this.scale.y = b;
            return this
        },
        setRotate: function(a) {
            this.rotate = a;
            return this
        },
        setPivot: function(a, b) {
            this.pivot.x = a;
            this.pivot.y = b;
            return this
        },
        isComplex: function() {
            return this.scale.x != 1 || this.scale.y != 1 || this.rotate || this.clip.x != 0
        },
        transform: function(a, b) {
            var c =
                ig.system,
                d = c.context,
                c = c.scale;
            d.save();
            this.prePos.x = a;
            this.prePos.y = b;
            d.translate(ig.system.getDrawPos(a + this.translate.x), ig.system.getDrawPos(b + this.translate.y));
            if (this.clip.x != 0) {
                d.beginPath();
                d.rect(0, 0, this.clip.x * c, this.clip.y * c);
                d.clip()
            }
            if (this.scale.x != 1 || this.scale.y != 1 || this.rotate != 0) {
                d.translate(ig.system.getDrawPos(this.pivot.x), ig.system.getDrawPos(this.pivot.y));
                d.rotate(this.rotate);
                d.scale(this.scale.x || 1E-4, this.scale.y || 1E-4);
                d.translate(-ig.system.getDrawPos(this.pivot.x),
                    -ig.system.getDrawPos(this.pivot.y))
            }
        },
        kill: function() {
            k.free(this)
        },
        clear: function() {
            this.translate.x = this.translate.y = 0;
            this.scale.x = this.scale.y = 1;
            this.rotate = 0;
            this.pivot.x = this.pivot.y = 0;
            this.alpha = 1;
            this.clip.x = this.clip.y = 0
        }
    });
    ig.GuiStepPool = ig.Class.extend({
        get: function(a) {
            if (!a.poolEntries) a.poolEntries = [];
            if (a.poolEntries.length) {
                a = a.poolEntries.pop();
                a.clear();
                return a
            }
            return new a
        },
        free: function(a) {
            var b = a.constructor;
            if (!b.poolEntries) b.poolEntries = [];
            b.poolEntries.push(a)
        }
    });
    var k = new ig.GuiStepPool;
    ig.GuiElementBase = ig.Class.extend({
        hook: null,
        init: function() {
            this.hook = new ig.GuiHook(this)
        },
        setPos: function(a, b) {
            var c = this.hook;
            c.pos.x = a || 0;
            c.pos.y = b || 0;
            c.posTransition = null
        },
        getDestPos: function() {
            var a = this.hook;
            return a.posTransition || a.pos
        },
        setScroll: function(a, b) {
            var c = this.hook;
            c.scroll.x = a;
            c.scroll.y = b;
            c.scrollTransition = null
        },
        getDestScroll: function() {
            var a = this.hook;
            return a.scrollTransition || a.scroll
        },
        setSize: function(a, b) {
            var c = this.hook;
            c.size.x = a;
            c.size.y = b
        },
        setPivot: function(a, b) {
            var c =
                this.hook;
            c.pivot.x = a;
            c.pivot.y = b
        },
        setAlign: function(a, b) {
            var c = this.hook;
            c.align.x = a;
            c.align.y = b
        },
        isVisible: function() {
            return this.hook._visible
        },
        getChildGuiIndex: function(a) {
            return this.hook.getChildGuiIndex(a.hook)
        },
        getChildGuiByIndex: function(a) {
            return this.hook.getChildGuiByIndex(a)
        },
        addChildGui: function(a) {
            this.hook.addChildHook(a.hook)
        },
        insertChildGui: function(a, b) {
            this.hook.insertChildHook(a.hook, b)
        },
        removeChildGui: function(a) {
            this.hook.removeChildHook(a.hook)
        },
        removeChildGuiByIndex: function(a) {
            return this.hook.removeChildHookByIndex(a).gui
        },
        removeAllChildren: function() {
            this.hook.removeAllChildren()
        },
        update: function() {},
        updateDrawables: function() {},
        remove: function(a) {
            if (a) {
                this.hook.onDetach();
                this.hook.removeAfterTransition = false
            } else this.hook.removeAfterTransition = true
        },
        onAttach: null,
        onDetach: null,
        onVisibilityChange: null,
        isMouseOver: null,
        hide: function() {},
        show: function() {},
        doStateTransition: function(a, b, c, d, e) {
            this.hook.doStateTransition(a, b, c, d, e)
        },
        doTempStateTransition: function(a, b, c, d, e, f, g) {
            this.hook.doTempStateTransition(a, b,
                c, d, e, f, g)
        },
        doPosTranstition: function(a, b, c, d, e, f, g) {
            this.hook.doPosTranstition(a, b, c, d, e, f, g)
        },
        doScrollTransition: function(a, b, c, d, e) {
            this.hook.doScrollTransition(a, b, c, d, e)
        },
        hasTransition: function() {
            return this.hook.hasTransition()
        },
        getTransitionFactor: function() {
            return this.hook.getTransitionFactor()
        },
        setStateValue: function(a, b, c) {
            this.hook.setStateValue(a, b, c)
        }
    })
});
ig.baked = !0;
