ig.module("game.feature.msg.gui.message-overlay").requires("impact.feature.gui.gui", "game.feature.msg.gui.message-box", "game.feature.model.options-model").defines(function() {
    ig.MessageOverlayGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        messageArea: null,
        privateMsgBg: null,
        topBar: null,
        bottomBar: null,
        bottomShadow: null,
        init: function() {
            this.parent();
            this.hook.zIndex = 50;
            this.hook.size.x =
                ig.system.width;
            this.hook.size.y = ig.system.height;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.message, this);
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.topBar = new ig.MessageOverlayGui.BlackBar;
            this.topBar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.topBar);
            this.bottomBar = new ig.MessageOverlayGui.BlackBar;
            this.bottomBar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.bottomBar);
            this.privateMsgBg = new sc.PrivateMessageBGGui;
            this.addChildGui(this.privateMsgBg);
            this.messageArea = new ig.MessageAreaGui;
            this.messageArea.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.messageArea);
            this.topBar.doStateTransition("HIDDEN_TOP", true);
            this.bottomBar.doStateTransition("HIDDEN_BOTTOM", true);
            this.addChildGui(new sc.SkipSceneGui)
        },
        modelChanged: function(a, b, c) {
            if (a instanceof sc.GameModel) {
                if (b == sc.GAME_MODEL_MSG.STATE_CHANGED || b == sc.GAME_MODEL_MSG.DREAM_MODE_CHANGE) {
                    if (a.isCutscene() && !ig.dreamFx.isActive()) {
                        this.topBar.doStateTransition("DEFAULT");
                        this.bottomBar.doStateTransition("DEFAULT")
                    } else {
                        this.topBar.doStateTransition("HIDDEN_TOP");
                        this.bottomBar.doStateTransition("HIDDEN_BOTTOM")
                    }
                    this.messageArea.doStateTransition("DEFAULT")
                }
            } else if (a == sc.model.message && b == sc.MESSAGE_EVENT.MENU_MODE_CHANGE) {
                if (c) {
                    this.hook.pauseGui = true;
                    this.hook.zIndex = 1201;
                    ig.gui.sortGui();
                    this.topBar.doStateTransition("DEFAULT");
                    this.bottomBar.doStateTransition("DEFAULT")
                } else {
                    this.topBar.doStateTransition("HIDDEN_TOP", false, false, this.onPostMenuMode.bind(this));
                    this.bottomBar.doStateTransition("HIDDEN_BOTTOM")
                }
                this.messageArea.doStateTransition("DEFAULT")
            }
        },
        onPostMenuMode: function() {
            this.hook.pauseGui = false;
            this.hook.zIndex = 50;
            ig.gui.sortGui()
        }
    });
    ig.MessageOverlayGui.BlackBar = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN_TOP: {
                state: {
                    alpha: 1,
                    offsetY: -21
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN_BOTTOM: {
                state: {
                    alpha: 1,
                    offsetY: -21
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function() {
            this.parent();
            this.hook.size.y = 21;
            this.hook.size.x = ig.system.width
        },
        updateDrawables: function(a) {
            a.addColor("black", 0, 0, ig.system.getDrawPos(this.hook.size.x), ig.system.getDrawPos(this.hook.size.y))
        }
    });
    ig.MessageOverlayGui.BottomShadow = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function() {
            this.parent();
            this.hook.localAlpha = 1;
            this.hook.size.x =
                ig.system.width;
            this.hook.size.y = 128;
            if (!this.constructor.pattern) this.constructor.pattern = this.gfx.createPattern(144, 0, 16, 128, ig.ImagePattern.OPT.REPEAT_X)
        },
        updateDrawables: function(a) {
            a.addPattern(this.constructor.pattern, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    });
    sc.PRIVATE_MSG_BG_STATE = {
        BLINK: {
            doBlink: true,
            textY: 8,
            offY: -48
        },
        OPEN_UP: {
            doSizeTransition: 0.5,
            textY: 0
        },
        PRE_CLOSE: {
            wait: 0.3,
            textY: 0
        },
        CLOSE_DOWN: {
            doSizeTransition: 0.2,
            inverse: true,
            textY: 8,
            changeState: "HIDDEN"
        }
    };
    sc.PrivateMessageBGGui =
        ig.GuiElementBase.extend({
            gfx: new ig.Image("media/gui/message.png"),
            boxNinePatch: new ig.NinePatch("media/gui/message.png", {
                width: 16,
                height: 0,
                left: 24,
                top: 16,
                right: 24,
                bottom: 0,
                offsets: {
                    upper: {
                        x: 64,
                        y: 96
                    },
                    lower: {
                        x: 64,
                        y: 112
                    }
                }
            }),
            sound: {
                incoming: new ig.Sound("media/sound/hud/calling.ogg", 1),
                outgoing: new ig.Sound("media/sound/hud/calling.ogg", 1),
                open: new ig.Sound("media/sound/hud/take-call.ogg", 1),
                close: new ig.Sound("media/sound/hud/end-call.ogg", 1),
                drop: new ig.Sound("media/sound/hud/end-call.ogg", 1),
                handle: null
            },
            bgPatterns: new ig.ImagePatternSheet("media/gui/message.png", ig.ImagePattern.OPT.REPEAT_X, 8, 48, 128, 80, 2, 1),
            transitions: {
                DEFAULT: {
                    state: {},
                    time: 0.3,
                    timeFunction: KEY_SPLINES.JUMPY
                },
                PRE_HIDDEN: {
                    state: {
                        alpha: 0.5
                    },
                    time: 0.3,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0.4,
                        scaleY: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            },
            bgState: 0,
            bgTimer: 0,
            bgSilent: false,
            text: null,
            init: function() {
                this.parent();
                this.doStateTransition("HIDDEN", true);
                this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.text =
                    new sc.TextGui(ig.lang.get("sc.gui.msg.private"));
                this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.text.setPos(0, 4);
                this.addChildGui(this.text);
                this.setSize(ig.system.width, 32);
                this.setPivot(ig.system.width, 16);
                sc.Model.addObserver(sc.model.message, this)
            },
            setBgState: function(a, b) {
                this.bgState = a;
                this.bgTimer = 0;
                this.bgState == sc.PRIVATE_MSG_BG_STATE.OPEN_UP && this.text.setText(ig.lang.get("sc.gui.msg.private"));
                a.doSizeTransition ? this.doPosTranstition(0, a.offY || 0, a.doSizeTransition, KEY_SPLINES.EASE_OUT) :
                    this.setPos(0, a.offY || 0);
                this.text.doPosTranstition(0, this.bgState.textY, 0.1, KEY_SPLINES.EASE_IN_OUT);
                this.bgState.changeState && this.doStateTransition("PRE_HIDDEN");
                this.sound.handle && this.sound.handle.stop();
                if (!b && !sc.model.isTitle()) {
                    this.sound.handle = null;
                    this.bgState == sc.PRIVATE_MSG_BG_STATE.OPEN_UP ? this.sound.open.play() : this.bgState == sc.PRIVATE_MSG_BG_STATE.CLOSE_DOWN && this.sound.close.play()
                }
            },
            isReady: function() {
                return this.bgState == sc.PRIVATE_MSG_BG_STATE.OPEN_UP && this.bgTimer >= 0.3
            },
            update: function() {
                if (this.bgState) {
                    this.bgTimer =
                        this.bgTimer + ig.system.actualTick;
                    if (this.bgState.wait) {
                        if (this.bgTimer >= this.bgState.wait) {
                            this.setBgState(sc.PRIVATE_MSG_BG_STATE.CLOSE_DOWN, this.bgSilent);
                            this.bgSilent = false
                        }
                    } else if (this.bgState.doBlink) {
                        this.setSize(ig.system.width, 32);
                        this.setPivot(ig.system.width, 16);
                        var a = (1 + Math.sin(this.bgTimer * Math.PI * 3.6)).limit(0, 1);
                        this.hook.localAlpha = a;
                        this.text.hook.localAlpha = a;
                        if (ig.system.skipMode) sc.model.message.onSkipClearBlocking()
                    } else if (this.bgState.doSizeTransition) {
                        a = this.bgTimer;
                        this.hook.localAlpha =
                            1;
                        this.text.hook.localAlpha = 1;
                        a = a / this.bgState.doSizeTransition;
                        a = Math.min(a, 1);
                        a = KEY_SPLINES.EASE_OUT.get(a);
                        this.bgState.inverse && (a = 1 - a);
                        this.setSize(ig.system.width, Math.floor(32 * (1 - a) + 310 * a));
                        if (this.bgState.inverse && a <= 0) {
                            this.bgState = null;
                            this.setPivot(ig.system.width, 16);
                            this.doStateTransition("HIDDEN");
                            sc.model.message.clearBlocking()
                        } else if (!this.bgState.inverse && a >= 1) {
                            this.bgState = null;
                            sc.model.message.clearBlocking()
                        }
                    }
                }
            },
            updateDrawables: function(a) {
                var b = this.hook.size.x,
                    c = this.hook.size.y,
                    e = (b - 200) / 2;
                this.boxNinePatch.draw(a, 200, 16, "upper", e, 0);
                this.boxNinePatch.draw(a, 200, 16, "lower", e, c - 16);
                var f = c - 32;
                if (f > 1) {
                    a.addTransform().setAlpha(0.9);
                    c = Math.min(48, Math.floor(f / 2));
                    e = Math.min(48, f - c);
                    f = f - c - e;
                    a.addPattern(this.bgPatterns.getPattern(0), 0, 16, 0, 0, b, c);
                    a.addPattern(this.bgPatterns.getPattern(1), 0, 16 + c + f, 0, 48 - e, b, e);
                    f > 0 && a.addColor("#001428", 0, 16 + c, b, f);
                    a.undoTransform()
                }
            },
            modelChanged: function(a, b, c) {
                if (b == sc.MESSAGE_EVENT.RING_PRIVATE) {
                    this.doStateTransition("DEFAULT");
                    a = c ? ig.lang.get("sc.gui.msg.outgoing") :
                        ig.lang.get("sc.gui.msg.incoming");
                    this.text.setText(a);
                    this.setBgState(sc.PRIVATE_MSG_BG_STATE.BLINK);
                    this.sound.handle = c ? this.sound.outgoing.play(true) : this.sound.incoming.play(true)
                } else if (b == sc.MESSAGE_EVENT.START_PRIVATE) this.setBgState(sc.PRIVATE_MSG_BG_STATE.OPEN_UP);
                else if (b == sc.MESSAGE_EVENT.END_PRIVATE) {
                    this.bgSilent = c;
                    this.setBgState(sc.PRIVATE_MSG_BG_STATE.PRE_CLOSE, c)
                } else if (b == sc.MESSAGE_EVENT.DROP_PRIVATE) {
                    this.sound.handle && this.sound.handle.stop();
                    !c && !sc.model.isTitle() && this.sound.drop.play();
                    this.doStateTransition("HIDDEN");
                    sc.model.message.clearBlocking()
                }
            }
        });
    ig.MessageAreaGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        clickToContinue: false,
        entries: {},
        portraits: {},
        boardMsg: null,
        leftOffEntry: null,
        rightOffEntry: null,
        messages: [],
        choiceGui: null,
        bottomShadow: null,
        PORTRAIT_GAP: 64,
        MESSAGE_GAP: 8,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.bottomShadow = new ig.MessageOverlayGui.BottomShadow;
            this.bottomShadow.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.bottomShadow);
            this.bottomShadow.order = 1E7;
            this.leftOffEntry = new ig.MessageOverlayGui.Entry(this, null, true, -1E3);
            this.leftOffEntry.setPos(-104, 0);
            this.addChildGui(this.leftOffEntry);
            this.rightOffEntry = new ig.MessageOverlayGui.Entry(this, null, false, -1E3);
            this.rightOffEntry.setPos(ig.system.width - 24, 0);
            this.addChildGui(this.rightOffEntry);
            this.boardMsg = new sc.MsgBoardGui;
            this.boardMsg.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.boardMsg.setPos(0, -80);
            this.addChildGui(this.boardMsg);
            this.boardMsg.hide(true);
            sc.Model.addObserver(sc.model.message, this)
        },
        update: function() {
            if (this.clickToContinue && ig.system.skipMode) {
                this.clickToContinue = false;
                sc.model.message.clearBlocking()
            }
        },
        modelChanged: function(a, d, c) {
            if (d == sc.MESSAGE_EVENT.RING_PRIVATE) this.clickToContinue = false;
            else if (d == sc.MESSAGE_EVENT.MESSAGE_INTERACT) {
                if (!sc.model.message.autoScript)
                    if (this.clickToContinue) sc.model.message.clearBlocking();
                    else {
                        ig.interact.setBlockDelay(0);
                        this.skip()
                    }
            } else if (d == sc.MESSAGE_EVENT.PERSON_ADDED) {
                var e = c;
                this.portraits[e] = new ig.MessageOverlayGui.Portrait(this, a.getCharExpression(e), a.getSide(e) == sc.MESSAGE_SIDES.LEFT, a.getOrder(e));
                this.entries[e] = new ig.MessageOverlayGui.Entry(this, e, a.getSide(e) == sc.MESSAGE_SIDES.LEFT, a.getOrder(e), a.getDisplayName(e));
                this.addChildGui(this.portraits[e]);
                this.addChildGui(this.entries[e]);
                this._reorderPortraits(this.portraits[e]);
                this._pushVisibleDisplayName(this.entries[e]);
                this.boardMsg.hasSide() || this.boardMsg.hide()
            } else if (d == sc.MESSAGE_EVENT.PERSON_REMOVED) {
                e = c;
                this.portraits[e].remove();
                this.entries[e].remove();
                delete this.portraits[e];
                delete this.entries[e];
                this._reorderPortraits()
            } else if (d == sc.MESSAGE_EVENT.PERSON_CHANGED) {
                var e = c,
                    f = a.getOrder(e),
                    g = a.getSide(e) == sc.MESSAGE_SIDES.LEFT,
                    c = this.portraits[e],
                    h = this.entries[e];
                c.lookRight != g && h.clearMessages();
                c.order = f;
                h.order = f;
                c.setExpression(a.getCharExpression(e));
                h.setDisplayName(a.getDisplayName(e));
                h.setLookRight(g);
                c.setLookRight(g);
                this._pushVisibleDisplayName(h);
                this._reorderPortraits()
            } else if (d == sc.MESSAGE_EVENT.EXPRESSION_CHANGED) {
                e = c;
                this.portraits[e].setExpression(a.getCharExpression(e), true)
            } else if (d == sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE) {
                this.clickToContinue = false;
                e = c.center ? ig.Font.ALIGN.CENTER : ig.Font.ALIGN.LEFT;
                f = b();
                this.boardMsg.setContent(c.text, e, f, this.onTextFinished.bind(this), c.side)
            } else if (d == sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE) this.boardMsg.hide();
            else if (d == sc.MESSAGE_EVENT.NEW_MESSAGE) {
                var e =
                    c.name,
                    d = ig.system.width - 256,
                    i = 2,
                    g = f = -1E3;
                for (h in this.entries) {
                    this.entries[h].lookRight ? g = Math.max(g, this.entries[h].order) : f = Math.max(f, this.entries[h].order);
                    i-- > 0 || (d = d - this.PORTRAIT_GAP)
                }
                d = Math.min(d, 175);
                h = e ? this.entries[e] : c.left ? this.leftOffEntry : this.rightOffEntry;
                e && this._pushVisibleDisplayName(h);
                d = h.addMessage(d, c.text);
                c = d.hook.size.y + 13 + 2;
                h = this.messages.length;
                for (i = false; h--;) {
                    var j = this.messages[h];
                    j.setPointerDown();
                    i = i || j.personEntry.order < (j.personEntry.lookRight ? g : f);
                    if (c +
                        j.hook.size.y > 128 || i && c + j.hook.size.y > 80) {
                        j.doPosTranstition(j.hook.pos.x, j.hook.pos.y + j.hook.size.y, 0.2, KEY_SPLINES.EASE_OUT);
                        j.doStateTransition("HIDDEN", false, true);
                        this.messages.splice(h, 1)
                    } else {
                        j.doPosTranstition(j.hook.pos.x, c, 0.2, KEY_SPLINES.EASE_OUT);
                        j.doStateTransition("SUB")
                    }
                    c = c + (j.hook.size.y + 2)
                }
                this.messages.push(d);
                e || this._reorderPortraits()
            } else if (d == sc.MESSAGE_EVENT.SHOW_CHOICE) {
                e = c.name;
                this.choiceGui = new sc.ChoiceBoxGui(c.options, this.portraits[e].hook.pos.x + 64, this.portraits[e].hook.pos.y +
                    128, c.columns, c.forceWidth);
                this.addChildGui(this.choiceGui)
            } else if (d == sc.MESSAGE_EVENT.CLEARED) {
                for (e in this.portraits)
                    if (!c || a.getSide(e) == c) {
                        this.portraits[e].remove();
                        this.entries[e].remove();
                        delete this.portraits[e];
                        delete this.entries[e]
                    }(!c || c == sc.MESSAGE_SIDES.LEFT) && this.leftOffEntry.clearMessages();
                (!c || c == sc.MESSAGE_SIDES.RIGHT) && this.rightOffEntry.clearMessages();
                this.choiceGui && this.choiceGui.remove()
            }
            for (var k in this.portraits) break;
            a.isPrivateActive() && (k = false);
            ig.dreamFx.isActive() &&
                (k = false);
            this.bottomShadow.doStateTransition(k ? "DEFAULT" : "HIDDEN")
        },
        onTextFinished: function() {
            ig.system.skipMode || sc.model.message.autoContinue ? sc.model.message.clearBlocking() : this.clickToContinue = true
        },
        clearMessages: function() {
            for (var a = this.messages.length; a--;) this.messages[a].doStateTransition("HIDDEN", false, true);
            this.messages = []
        },
        skip: function() {
            if (sc.model.message.hasBoardMessage()) this.boardMsg.skip();
            else {
                var a = this.messages.length - 1;
                a >= 0 && this.messages[a].skip()
            }
        },
        _reorderPortraits: function(a) {
            this.hook.children.sort(function(a,
                b) {
                var c = a.gui.order || 0,
                    d = b.gui.order || 0;
                a.gui.isEntry || (c = c + 1E5);
                b.gui.isEntry || (d = d + 1E5);
                return d - c
            });
            var b = sc.model.message,
                c = 0,
                e = 0,
                f;
            for (f in this.portraits) b.getSide(f) == sc.MESSAGE_SIDES.LEFT ? e++ : c++;
            e = 0 + (e == 1 ? this.PORTRAIT_GAP / 2 : 0);
            c = ig.system.width - 128 - (c == 1 ? this.PORTRAIT_GAP / 2 : 0);
            this.leftOffEntry.hasMessages() && (e = e + 48);
            this.rightOffEntry.hasMessages() && (c = c - 48);
            if (ig.dreamFx.isActive()) {
                e = e + 48;
                c = c - 48
            }
            for (var g = b.isPrivateActive() ? 22 : 0, h = this.hook.children, i = h.length; i--;) {
                var j = h[i],
                    k = j.gui;
                if (!k.isEntry && !j.removeAfterTransition && (f = k.name) && this.portraits[f]) {
                    var l;
                    if (b.getSide(f) == sc.MESSAGE_SIDES.LEFT) {
                        l = e;
                        e = e + this.PORTRAIT_GAP
                    } else {
                        l = c;
                        c = c - this.PORTRAIT_GAP
                    }
                    if (k == a || k.hook.getStateTransitionProgress() == 0) {
                        k.setPos(l, g);
                        this.entries[f].setPos(l, g)
                    } else {
                        var o;
                        if (Math.abs(j.pos.x - l) > 200) {
                            o = KEY_SPLINES.EASE_IN_OUT;
                            k = 0.6
                        } else {
                            o = KEY_SPLINES.EASE_OUT;
                            k = 0.2
                        }
                        j.doPosTranstition(l, g, k, o, 0, true);
                        this.entries[f].doPosTranstition(l, g, k, o, 0, true)
                    }
                }
            }
        },
        _pushVisibleDisplayName: function(a) {
            if (a.displayName) {
                a.setDisplayNameVisible(true);
                var b = sc.model.message,
                    c = b.getSide(a.name),
                    e;
                for (e in this.entries) {
                    var f = this.entries[e];
                    f != a && b.getSide(e) == c && f.setDisplayNameVisible(false)
                }
            }
        }
    });
    var b = function() {
        var a = sc.options.get("text-speed") != void 0 ? sc.options.get("text-speed") : ig.TextBlock.SPEED.FAST;
        if (sc.model.message.autoScript) a = ig.TextBlock.SPEED.SLOW;
        if (ig.system.skipMode) a = ig.TextBlock.SPEED.IMMEDIATE;
        return a
    };
    ig.MessageOverlayGui.Entry = ig.GuiElementBase.extend({
        name: null,
        isEntry: true,
        lookRight: false,
        order: 0,
        beepSound: new ig.Sound("media/sound/hud/dialog-beep-2.ogg",
            1, 0.02),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN_LEFT: {
                state: {
                    alpha: 0,
                    offsetX: -32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN_RIGHT: {
                state: {
                    alpha: 0,
                    offsetX: 32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function(a, b, c, e, f) {
            this.parent();
            this.setSize(128, 128);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.area = a;
            this.name = b;
            this.lookRight = c;
            this.order = e;
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", true);
            this.doStateTransition("DEFAULT");
            if (!this.name) this.order = -1E3;
            f && this.setDisplayName(f)
        },
        addMessage: function(a, d) {
            var c = this.lookRight ? sc.ArrowBoxGui.POINTER.TOP_LEFT : sc.ArrowBoxGui.POINTER.TOP_RIGHT,
                e = b();
            if (!ig.system.skipMode && ig.dreamFx.isActive()) e = ig.TextBlock.SPEED.NORMAL;
            c = new sc.MsgBoxGui(a, c, d, e, this, ig.dreamFx.isActive() ? null : this.beepSound);
            c.setAlign(this.lookRight ? ig.GUI_ALIGN.X_LEFT : ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            c.setPos(112, 13);
            this.area.clickToContinue = false;
            c.setOnFinish(this.area.onTextFinished.bind(this.area));
            this.addChildGui(c);
            c.doStateTransition("HIDDEN", true);
            c.doStateTransition("DEFAULT");
            if (c.isFinished()) this.area.onTextFinished();
            return c
        },
        hasMessages: function() {
            for (var a = this.hook.children.length; a--;)
                if (!this.hook.children[a].removeAfterTransition) return true;
            return false
        },
        clearMessages: function() {
            for (var a = 0; a < this.hook.children.length; a++) this.hook.children[a].transitions.HIDDEN && this.hook.children[a].doStateTransition("HIDDEN", true, true)
        },
        setDisplayNameVisible: function(a) {
            this.displayName &&
                this.displayName.doStateTransition(a ? "DEFAULT_RIGHT" : "HIDDEN_RIGHT")
        },
        setDisplayName: function(a) {
            if (!a && this.displayName) {
                this.displayName.doStateTransition("HIDDEN_RIGHT", false, true);
                this.displayName = null
            } else if (!this.displayName && a) {
                this.displayName = new ig.MessageOverlayGui.DisplayName(a);
                this.displayName.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.displayName.setPos(0, -1);
                this.addChildGui(this.displayName);
                this.displayName.doStateTransition("HIDDEN_RIGHT", true);
                this.displayName.doStateTransition("DEFAULT_RIGHT")
            } else this.displayName &&
                this.displayName.setText(a)
        },
        setLookRight: function(a) {
            this.lookRight = a
        },
        remove: function() {
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true);
            for (var a = 0; a < this.hook.children.length; ++a) this.hook.children[a].transitions.HIDDEN && this.hook.children[a].doStateTransition("HIDDEN", false, true)
        }
    });
    ig.MessageOverlayGui.Portrait = ig.GuiElementBase.extend({
        name: null,
        charExpression: null,
        lookRight: false,
        order: 0,
        timer: 0,
        displayName: null,
        transitions: {
            DEFAULT: {
                state: {
                    scaleX: -1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            DEFAULT_RIGHT: {
                state: {
                    scaleX: 1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN_LEFT: {
                state: {
                    scaleX: -1,
                    alpha: 0,
                    offsetX: -32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN_RIGHT: {
                state: {
                    scaleX: 1,
                    alpha: 0,
                    offsetX: 32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function(a, b, c, e) {
            this.parent();
            this.setSize(128, 128);
            this.setPivot(64, 64);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.area = a;
            this.name = b.character.name;
            this.charExpression = b;
            this.lookRight = c;
            this.order =
                e;
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", true);
            this.doStateTransition(this.lookRight ? "DEFAULT" : "DEFAULT_RIGHT");
            if (ig.dreamFx.isActive()) this.hook.localAlpha = 0.5
        },
        setLookRight: function(a) {
            this.lookRight = a;
            this.doStateTransition(this.lookRight ? "DEFAULT" : "DEFAULT_RIGHT", true)
        },
        setExpression: function(a, b) {
            if (b || this.charExpression != a) {
                this.charExpression = a;
                this.timer = 0
            }
        },
        remove: function() {
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true);
            for (var a =
                    0; a < this.hook.children.length; ++a) this.hook.children[a].doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true)
        },
        update: function() {
            this.timer = this.timer + ig.system.actualTick
        },
        updateDrawables: function(a) {
            var b = this.charExpression.character.data;
            sc.MsgGuiTools.drawPortrait(a, this.charExpression, this.timer, (128 - b.face.width) / 2, 128 - b.face.height)
        }
    });
    ig.MessageOverlayGui.DisplayName = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 0,
            left: 16,
            top: 14,
            right: 16,
            bottom: 0,
            offsets: {
                "default": {
                    x: 48,
                    y: 32
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {
                    scaleX: -1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            },
            DEFAULT_RIGHT: {
                state: {
                    scaleX: 1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN_LEFT: {
                state: {
                    scaleX: -1,
                    alpha: 0,
                    offsetY: -10
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN_RIGHT: {
                state: {
                    scaleX: 1,
                    alpha: 0,
                    offsetY: -10
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        text: null,
        init: function(a) {
            this.parent();
            this.hook.localAlpha = 0.7;
            a = new sc.TextGui(a, {
                font: sc.fontsystem.font
            });
            a.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.text = a;
            this.setSize(a.hook.size.x + 32, a.hook.size.y);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.addChildGui(a)
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, 14, "default", 0, 2)
        },
        setText: function(a) {
            this.text.setText(a);
            this.setSize(this.text.hook.size.x + 32, this.text.hook.size.y);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2)
        }
    });
    sc.MsgGuiTools = {};
    sc.MsgGuiTools.drawPortrait = function(a, b, c, e, f, g, h) {
        var b =
            sc.playerSkins.replaceFace(b),
            i = b.character,
            j = b.expression,
            k = i.data,
            i = i.faceImage,
            b = b.expressionImages,
            l = k.face.parts,
            j = k.face.expressions[j],
            o, m;
        if (g) {
            o = k.face.centerX - Math.floor(g / 2);
            m = k.face.centerY - Math.floor(h / 2)
        }
        if (j) {
            var k = j.anim,
                n = j.time,
                p = j.repeat || false,
                r = j.faces,
                j = null;
            if (k) {
                j = Math.floor(c / n);
                p ? p > 1 ? j > p && (j = (j - p) % (k.length - p) + p) : j = j % k.length : j = j.limit(0, k.length - 1);
                j = r[k[j]]
            } else j = r[0];
            for (p = k = c = 0; p < j.length; ++p) {
                var n = l[p][j[p]],
                    r = n.destX + c,
                    t = n.destY + k,
                    c = c + (n.subX || 0),
                    k = k + (n.subY || 0);
                if (p == 0) {
                    o = o + c;
                    m = m + k
                }
                var q = i;
                n.img && (q = b[n.img]);
                if (g) {
                    if (!n.hideOnClip && !(o >= r + n.width || o + g <= r || m >= t + n.height || m + h <= t)) {
                        var s = Math.max(0, o - r),
                            v = Math.max(0, m - t),
                            y = Math.min(0, o + g - r - n.width) - s,
                            u = Math.min(0, m + h - t - n.height) - v;
                        a.addGfx(q, e - o + s + r, f - m + v + t, n.srcX + s, n.srcY + v, n.width + y, n.height + u)
                    }
                } else a.addGfx(q, e + r, f + t, n.srcX, n.srcY, n.width, n.height)
            }
        }
    }
});
ig.baked = !0;
