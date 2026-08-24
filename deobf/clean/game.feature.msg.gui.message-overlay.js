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
        modelChanged: function(model, msg, data) {
            if (model instanceof sc.GameModel) {
                if (msg == sc.GAME_MODEL_MSG.STATE_CHANGED || msg == sc.GAME_MODEL_MSG.DREAM_MODE_CHANGE) {
                    if (model.isCutscene() && !ig.dreamFx.isActive()) {
                        this.topBar.doStateTransition("DEFAULT");
                        this.bottomBar.doStateTransition("DEFAULT")
                    } else {
                        this.topBar.doStateTransition("HIDDEN_TOP");
                        this.bottomBar.doStateTransition("HIDDEN_BOTTOM")
                    }
                    this.messageArea.doStateTransition("DEFAULT")
                }
            } else if (model == sc.model.message && msg == sc.MESSAGE_EVENT.MENU_MODE_CHANGE) {
                if (data) {
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
        updateDrawables: function(drawables) {
            drawables.addColor("black", 0, 0, ig.system.getDrawPos(this.hook.size.x), ig.system.getDrawPos(this.hook.size.y))
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
        updateDrawables: function(drawables) {
            drawables.addPattern(this.constructor.pattern, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
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
            setBgState: function(state, silent) {
                this.bgState = state;
                this.bgTimer = 0;
                this.bgState == sc.PRIVATE_MSG_BG_STATE.OPEN_UP && this.text.setText(ig.lang.get("sc.gui.msg.private"));
                state.doSizeTransition ? this.doPosTranstition(0, state.offY || 0, state.doSizeTransition, KEY_SPLINES.EASE_OUT) :
                    this.setPos(0, state.offY || 0);
                this.text.doPosTranstition(0, this.bgState.textY, 0.1, KEY_SPLINES.EASE_IN_OUT);
                this.bgState.changeState && this.doStateTransition("PRE_HIDDEN");
                this.sound.handle && this.sound.handle.stop();
                if (!silent && !sc.model.isTitle()) {
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
                        var alpha = (1 + Math.sin(this.bgTimer * Math.PI * 3.6)).limit(0, 1);
                        this.hook.localAlpha = alpha;
                        this.text.hook.localAlpha = alpha;
                        if (ig.system.skipMode) sc.model.message.onSkipClearBlocking()
                    } else if (this.bgState.doSizeTransition) {
                        alpha = this.bgTimer;
                        this.hook.localAlpha =
                            1;
                        this.text.hook.localAlpha = 1;
                        alpha = alpha / this.bgState.doSizeTransition;
                        alpha = Math.min(alpha, 1);
                        alpha = KEY_SPLINES.EASE_OUT.get(alpha);
                        this.bgState.inverse && (alpha = 1 - alpha);
                        this.setSize(ig.system.width, Math.floor(32 * (1 - alpha) + 310 * alpha));
                        if (this.bgState.inverse && alpha <= 0) {
                            this.bgState = null;
                            this.setPivot(ig.system.width, 16);
                            this.doStateTransition("HIDDEN");
                            sc.model.message.clearBlocking()
                        } else if (!this.bgState.inverse && alpha >= 1) {
                            this.bgState = null;
                            sc.model.message.clearBlocking()
                        }
                    }
                }
            },
            updateDrawables: function(drawables) {
                var width = this.hook.size.x,
                    height = this.hook.size.y,
                    sideX = (width - 200) / 2;
                this.boxNinePatch.draw(drawables, 200, 16, "upper", sideX, 0);
                this.boxNinePatch.draw(drawables, 200, 16, "lower", sideX, height - 16);
                var middle = height - 32;
                if (middle > 1) {
                    drawables.addTransform().setAlpha(0.9);
                    height = Math.min(48, Math.floor(middle / 2));
                    sideX = Math.min(48, middle - height);
                    middle = middle - height - sideX;
                    drawables.addPattern(this.bgPatterns.getPattern(0), 0, 16, 0, 0, width, height);
                    drawables.addPattern(this.bgPatterns.getPattern(1), 0, 16 + height + middle, 0, 48 - sideX, width, sideX);
                    middle > 0 && drawables.addColor("#001428", 0, 16 + height, width, middle);
                    drawables.undoTransform()
                }
            },
            modelChanged: function(model, msg, isOutgoing) {
                if (msg == sc.MESSAGE_EVENT.RING_PRIVATE) {
                    this.doStateTransition("DEFAULT");
                    model = isOutgoing ? ig.lang.get("sc.gui.msg.outgoing") :
                        ig.lang.get("sc.gui.msg.incoming");
                    this.text.setText(model);
                    this.setBgState(sc.PRIVATE_MSG_BG_STATE.BLINK);
                    this.sound.handle = isOutgoing ? this.sound.outgoing.play(true) : this.sound.incoming.play(true)
                } else if (msg == sc.MESSAGE_EVENT.START_PRIVATE) this.setBgState(sc.PRIVATE_MSG_BG_STATE.OPEN_UP);
                else if (msg == sc.MESSAGE_EVENT.END_PRIVATE) {
                    this.bgSilent = isOutgoing;
                    this.setBgState(sc.PRIVATE_MSG_BG_STATE.PRE_CLOSE, isOutgoing)
                } else if (msg == sc.MESSAGE_EVENT.DROP_PRIVATE) {
                    this.sound.handle && this.sound.handle.stop();
                    !isOutgoing && !sc.model.isTitle() && this.sound.drop.play();
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
        modelChanged: function(model, msg, data) {
            if (msg == sc.MESSAGE_EVENT.RING_PRIVATE) this.clickToContinue = false;
            else if (msg == sc.MESSAGE_EVENT.MESSAGE_INTERACT) {
                if (!sc.model.message.autoScript)
                    if (this.clickToContinue) sc.model.message.clearBlocking();
                    else {
                        ig.interact.setBlockDelay(0);
                        this.skip()
                    }
            } else if (msg == sc.MESSAGE_EVENT.PERSON_ADDED) {
                var name = data;
                this.portraits[name] = new ig.MessageOverlayGui.Portrait(this, model.getCharExpression(name), model.getSide(name) == sc.MESSAGE_SIDES.LEFT, model.getOrder(name));
                this.entries[name] = new ig.MessageOverlayGui.Entry(this, name, model.getSide(name) == sc.MESSAGE_SIDES.LEFT, model.getOrder(name), model.getDisplayName(name));
                this.addChildGui(this.portraits[name]);
                this.addChildGui(this.entries[name]);
                this._reorderPortraits(this.portraits[name]);
                this._pushVisibleDisplayName(this.entries[name]);
                this.boardMsg.hasSide() || this.boardMsg.hide()
            } else if (msg == sc.MESSAGE_EVENT.PERSON_REMOVED) {
                name = data;
                this.portraits[name].remove();
                this.entries[name].remove();
                delete this.portraits[name];
                delete this.entries[name];
                this._reorderPortraits()
            } else if (msg == sc.MESSAGE_EVENT.PERSON_CHANGED) {
                var name = data,
                    order = model.getOrder(name),
                    lookRight = model.getSide(name) == sc.MESSAGE_SIDES.LEFT,
                    data = this.portraits[name],
                    entry = this.entries[name];
                data.lookRight != lookRight && entry.clearMessages();
                data.order = order;
                entry.order = order;
                data.setExpression(model.getCharExpression(name));
                entry.setDisplayName(model.getDisplayName(name));
                entry.setLookRight(lookRight);
                data.setLookRight(lookRight);
                this._pushVisibleDisplayName(entry);
                this._reorderPortraits()
            } else if (msg == sc.MESSAGE_EVENT.EXPRESSION_CHANGED) {
                name = data;
                this.portraits[name].setExpression(model.getCharExpression(name), true)
            } else if (msg == sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE) {
                this.clickToContinue = false;
                name = data.center ? ig.Font.ALIGN.CENTER : ig.Font.ALIGN.LEFT;
                order = getTextSpeed();
                this.boardMsg.setContent(data.text, name, order, this.onTextFinished.bind(this), data.side)
            } else if (msg == sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE) this.boardMsg.hide();
            else if (msg == sc.MESSAGE_EVENT.NEW_MESSAGE) {
                var name =
                    data.name,
                    msg = ig.system.width - 256,
                    count = 2,
                    rightOrder = order = -1E3;
                for (entry in this.entries) {
                    this.entries[entry].lookRight ? rightOrder = Math.max(rightOrder, this.entries[entry].order) : order = Math.max(order, this.entries[entry].order);
                    count-- > 0 || (msg = msg - this.PORTRAIT_GAP)
                }
                msg = Math.min(msg, 175);
                entry = name ? this.entries[name] : data.left ? this.leftOffEntry : this.rightOffEntry;
                name && this._pushVisibleDisplayName(entry);
                msg = entry.addMessage(msg, data.text);
                data = msg.hook.size.y + 13 + 2;
                entry = this.messages.length;
                for (count = false; entry--;) {
                    var oldMessage = this.messages[entry];
                    oldMessage.setPointerDown();
                    count = count || oldMessage.personEntry.order < (oldMessage.personEntry.lookRight ? rightOrder : order);
                    if (data +
                        oldMessage.hook.size.y > 128 || count && data + oldMessage.hook.size.y > 80) {
                        oldMessage.doPosTranstition(oldMessage.hook.pos.x, oldMessage.hook.pos.y + oldMessage.hook.size.y, 0.2, KEY_SPLINES.EASE_OUT);
                        oldMessage.doStateTransition("HIDDEN", false, true);
                        this.messages.splice(entry, 1)
                    } else {
                        oldMessage.doPosTranstition(oldMessage.hook.pos.x, data, 0.2, KEY_SPLINES.EASE_OUT);
                        oldMessage.doStateTransition("SUB")
                    }
                    data = data + (oldMessage.hook.size.y + 2)
                }
                this.messages.push(msg);
                name || this._reorderPortraits()
            } else if (msg == sc.MESSAGE_EVENT.SHOW_CHOICE) {
                name = data.name;
                this.choiceGui = new sc.ChoiceBoxGui(data.options, this.portraits[name].hook.pos.x + 64, this.portraits[name].hook.pos.y +
                    128, data.columns, data.forceWidth);
                this.addChildGui(this.choiceGui)
            } else if (msg == sc.MESSAGE_EVENT.CLEARED) {
                for (name in this.portraits)
                    if (!data || model.getSide(name) == data) {
                        this.portraits[name].remove();
                        this.entries[name].remove();
                        delete this.portraits[name];
                        delete this.entries[name]
                    }(!data || data == sc.MESSAGE_SIDES.LEFT) && this.leftOffEntry.clearMessages();
                (!data || data == sc.MESSAGE_SIDES.RIGHT) && this.rightOffEntry.clearMessages();
                this.choiceGui && this.choiceGui.remove()
            }
            for (var anyPortrait in this.portraits) break;
            model.isPrivateActive() && (anyPortrait = false);
            ig.dreamFx.isActive() &&
                (anyPortrait = false);
            this.bottomShadow.doStateTransition(anyPortrait ? "DEFAULT" : "HIDDEN")
        },
        onTextFinished: function() {
            ig.system.skipMode || sc.model.message.autoContinue ? sc.model.message.clearBlocking() : this.clickToContinue = true
        },
        clearMessages: function() {
            for (var i = this.messages.length; i--;) this.messages[i].doStateTransition("HIDDEN", false, true);
            this.messages = []
        },
        skip: function() {
            if (sc.model.message.hasBoardMessage()) this.boardMsg.skip();
            else {
                var index = this.messages.length - 1;
                index >= 0 && this.messages[index].skip()
            }
        },
        _reorderPortraits: function(addedPortrait) {
            this.hook.children.sort(function(a,
                b) {
                var orderA = a.gui.order || 0,
                    orderB = b.gui.order || 0;
                a.gui.isEntry || (orderA = orderA + 1E5);
                b.gui.isEntry || (orderB = orderB + 1E5);
                return orderB - orderA
            });
            var messageModel = sc.model.message,
                leftX = 0,
                rightX = 0,
                name;
            for (name in this.portraits) messageModel.getSide(name) == sc.MESSAGE_SIDES.LEFT ? leftX++ : rightX++;
            leftX = 0 + (leftX == 1 ? this.PORTRAIT_GAP / 2 : 0);
            rightX = ig.system.width - 128 - (rightX == 1 ? this.PORTRAIT_GAP / 2 : 0);
            this.leftOffEntry.hasMessages() && (leftX = leftX + 48);
            this.rightOffEntry.hasMessages() && (rightX = rightX - 48);
            if (ig.dreamFx.isActive()) {
                leftX = leftX + 48;
                rightX = rightX - 48
            }
            for (var offsetY = messageModel.isPrivateActive() ? 22 : 0, children = this.hook.children, i = children.length; i--;) {
                var child = children[i],
                    gui = child.gui;
                if (!gui.isEntry && !child.removeAfterTransition && (name = gui.name) && this.portraits[name]) {
                    var posX;
                    if (messageModel.getSide(name) == sc.MESSAGE_SIDES.LEFT) {
                        posX = leftX;
                        leftX = leftX + this.PORTRAIT_GAP
                    } else {
                        posX = rightX;
                        rightX = rightX - this.PORTRAIT_GAP
                    }
                    if (gui == addedPortrait || gui.hook.getStateTransitionProgress() == 0) {
                        gui.setPos(posX, offsetY);
                        this.entries[name].setPos(posX, offsetY)
                    } else {
                        var timeFunction;
                        if (Math.abs(child.pos.x - posX) > 200) {
                            timeFunction = KEY_SPLINES.EASE_IN_OUT;
                            gui = 0.6
                        } else {
                            timeFunction = KEY_SPLINES.EASE_OUT;
                            gui = 0.2
                        }
                        child.doPosTranstition(posX, offsetY, gui, timeFunction, 0, true);
                        this.entries[name].doPosTranstition(posX, offsetY, gui, timeFunction, 0, true)
                    }
                }
            }
        },
        _pushVisibleDisplayName: function(entry) {
            if (entry.displayName) {
                entry.setDisplayNameVisible(true);
                var messageModel = sc.model.message,
                    side = messageModel.getSide(entry.name),
                    otherName;
                for (otherName in this.entries) {
                    var otherEntry = this.entries[otherName];
                    otherEntry != entry && messageModel.getSide(otherName) == side && otherEntry.setDisplayNameVisible(false)
                }
            }
        }
    });
    var getTextSpeed = function() {
        var speed = sc.options.get("text-speed") != void 0 ? sc.options.get("text-speed") : ig.TextBlock.SPEED.FAST;
        if (sc.model.message.autoScript) speed = ig.TextBlock.SPEED.SLOW;
        if (ig.system.skipMode) speed = ig.TextBlock.SPEED.IMMEDIATE;
        return speed
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
        init: function(area, name, lookRight, order, displayName) {
            this.parent();
            this.setSize(128, 128);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.area = area;
            this.name = name;
            this.lookRight = lookRight;
            this.order = order;
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", true);
            this.doStateTransition("DEFAULT");
            if (!this.name) this.order = -1E3;
            displayName && this.setDisplayName(displayName)
        },
        addMessage: function(x, text) {
            var pointer = this.lookRight ? sc.ArrowBoxGui.POINTER.TOP_LEFT : sc.ArrowBoxGui.POINTER.TOP_RIGHT,
                speed = getTextSpeed();
            if (!ig.system.skipMode && ig.dreamFx.isActive()) speed = ig.TextBlock.SPEED.NORMAL;
            pointer = new sc.MsgBoxGui(x, pointer, text, speed, this, ig.dreamFx.isActive() ? null : this.beepSound);
            pointer.setAlign(this.lookRight ? ig.GUI_ALIGN.X_LEFT : ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            pointer.setPos(112, 13);
            this.area.clickToContinue = false;
            pointer.setOnFinish(this.area.onTextFinished.bind(this.area));
            this.addChildGui(pointer);
            pointer.doStateTransition("HIDDEN", true);
            pointer.doStateTransition("DEFAULT");
            if (pointer.isFinished()) this.area.onTextFinished();
            return pointer
        },
        hasMessages: function() {
            for (var i = this.hook.children.length; i--;)
                if (!this.hook.children[i].removeAfterTransition) return true;
            return false
        },
        clearMessages: function() {
            for (var i = 0; i < this.hook.children.length; i++) this.hook.children[i].transitions.HIDDEN && this.hook.children[i].doStateTransition("HIDDEN", true, true)
        },
        setDisplayNameVisible: function(visible) {
            this.displayName &&
                this.displayName.doStateTransition(visible ? "DEFAULT_RIGHT" : "HIDDEN_RIGHT")
        },
        setDisplayName: function(displayName) {
            if (!displayName && this.displayName) {
                this.displayName.doStateTransition("HIDDEN_RIGHT", false, true);
                this.displayName = null
            } else if (!this.displayName && displayName) {
                this.displayName = new ig.MessageOverlayGui.DisplayName(displayName);
                this.displayName.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.displayName.setPos(0, -1);
                this.addChildGui(this.displayName);
                this.displayName.doStateTransition("HIDDEN_RIGHT", true);
                this.displayName.doStateTransition("DEFAULT_RIGHT")
            } else this.displayName &&
                this.displayName.setText(displayName)
        },
        setLookRight: function(lookRight) {
            this.lookRight = lookRight
        },
        remove: function() {
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true);
            for (var i = 0; i < this.hook.children.length; ++i) this.hook.children[i].transitions.HIDDEN && this.hook.children[i].doStateTransition("HIDDEN", false, true)
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
        init: function(area, charExpression, lookRight, order) {
            this.parent();
            this.setSize(128, 128);
            this.setPivot(64, 64);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.area = area;
            this.name = charExpression.character.name;
            this.charExpression = charExpression;
            this.lookRight = lookRight;
            this.order =
                order;
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", true);
            this.doStateTransition(this.lookRight ? "DEFAULT" : "DEFAULT_RIGHT");
            if (ig.dreamFx.isActive()) this.hook.localAlpha = 0.5
        },
        setLookRight: function(lookRight) {
            this.lookRight = lookRight;
            this.doStateTransition(this.lookRight ? "DEFAULT" : "DEFAULT_RIGHT", true)
        },
        setExpression: function(charExpression, force) {
            if (force || this.charExpression != charExpression) {
                this.charExpression = charExpression;
                this.timer = 0
            }
        },
        remove: function() {
            this.doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true);
            for (var i =
                    0; i < this.hook.children.length; ++i) this.hook.children[i].doStateTransition(this.lookRight ? "HIDDEN_LEFT" : "HIDDEN_RIGHT", false, true)
        },
        update: function() {
            this.timer = this.timer + ig.system.actualTick
        },
        updateDrawables: function(drawables) {
            var data = this.charExpression.character.data;
            sc.MsgGuiTools.drawPortrait(drawables, this.charExpression, this.timer, (128 - data.face.width) / 2, 128 - data.face.height)
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
        init: function(displayName) {
            this.parent();
            this.hook.localAlpha = 0.7;
            displayName = new sc.TextGui(displayName, {
                font: sc.fontsystem.font
            });
            displayName.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.text = displayName;
            this.setSize(displayName.hook.size.x + 32, displayName.hook.size.y);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.addChildGui(displayName)
        },
        updateDrawables: function(drawables) {
            this.ninepatch.draw(drawables, this.hook.size.x, 14, "default", 0, 2)
        },
        setText: function(displayName) {
            this.text.setText(displayName);
            this.setSize(this.text.hook.size.x + 32, this.text.hook.size.y);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2)
        }
    });
    sc.MsgGuiTools = {};
    sc.MsgGuiTools.drawPortrait = function(drawables, charExpression, timer, posX, posY, clipWidth, clipHeight) {
        var charExpression =
            sc.playerSkins.replaceFace(charExpression),
            character = charExpression.character,
            expressionName = charExpression.expression,
            data = character.data,
            character = character.faceImage,
            charExpression = charExpression.expressionImages,
            parts = data.face.parts,
            expressionName = data.face.expressions[expressionName],
            clipX, clipY;
        if (clipWidth) {
            clipX = data.face.centerX - Math.floor(clipWidth / 2);
            clipY = data.face.centerY - Math.floor(clipHeight / 2)
        }
        if (expressionName) {
            var anim = expressionName.anim,
                frameTime = expressionName.time,
                loop = expressionName.repeat || false,
                faces = expressionName.faces,
                expressionName = null;
            if (anim) {
                expressionName = Math.floor(timer / frameTime);
                loop ? loop > 1 ? expressionName > loop && (expressionName = (expressionName - loop) % (anim.length - loop) + loop) : expressionName = expressionName % anim.length : expressionName = expressionName.limit(0, anim.length - 1);
                expressionName = faces[anim[expressionName]]
            } else expressionName = faces[0];
            for (loop = anim = timer = 0; loop < expressionName.length; ++loop) {
                var part = parts[loop][expressionName[loop]],
                    destX = part.destX + timer,
                    destY = part.destY + anim,
                    timer = timer + (part.subX || 0),
                    anim = anim + (part.subY || 0);
                if (loop == 0) {
                    clipX = clipX + timer;
                    clipY = clipY + anim
                }
                var image = character;
                part.img && (image = charExpression[part.img]);
                if (clipWidth) {
                    if (!part.hideOnClip && !(clipX >= destX + part.width || clipX + clipWidth <= destX || clipY >= destY + part.height || clipY + clipHeight <= destY)) {
                        var srcX = Math.max(0, clipX - destX),
                            srcY = Math.max(0, clipY - destY),
                            width = Math.min(0, clipX + clipWidth - destX - part.width) - srcX,
                            height = Math.min(0, clipY + clipHeight - destY - part.height) - srcY;
                        drawables.addGfx(image, posX - clipX + srcX + destX, posY - clipY + srcY + destY, part.srcX + srcX, part.srcY + srcY, part.width + width, part.height + height)
                    }
                } else drawables.addGfx(image, posX + destX, posY + destY, part.srcX, part.srcY, part.width, part.height)
            }
        }
    }
});
ig.baked = !0;
