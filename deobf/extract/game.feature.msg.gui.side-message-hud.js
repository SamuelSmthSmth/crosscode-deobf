ig.module("game.feature.msg.gui.side-message-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.boxes", "game.feature.gui.base.text", "game.feature.gui.base.slick-box", "game.feature.msg.gui.msg-skip-hud").defines(function() {
    sc.SideMessageHudGui = ig.GuiElementBase.extend({
        sideLabel: null,
        pauseMaxY: 0,
        pauseBoxes: [],
        visibleBoxes: [],
        timer: 0,
        pauseMode: false,
        messageIndex: 0,
        prePauseMsgState: null,
        contentGui: null,
        skipGui: null,
        quickPop: false,
        skipInteractEntry: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function() {
            this.parent();
            this.setSize(290, 200);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.hook.zIndex = 101;
            this.hook.pauseGui = true;
            this.contentGui = new sc.SideMessageContentGui;
            this.addChildGui(this.contentGui);
            this.setPos(0, 3);
            this.skipGui = new sc.MsgSkipGui;
            this.addChildGui(this.skipGui);
            this.skipGui.doStateTransition("HIDDEN", true);
            this.skipGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.skipInteractEntry = new sc.SkipInteractEntry(this, 10);
            this.sideLabel = new sc.SideMessageLabelGui;
            this.addChildGui(this.sideLabel);
            this.sideLabel.doStateTransition("HIDDEN", true);
            sc.Model.addObserver(sc.model.message, this);
            sc.Model.addObserver(sc.model, this)
        },
        update: function() {
            if (!this.pauseMode && this.hook.currentStateName == "DEFAULT")
                if (this.timer > 0) {
                    this.timer = this.timer - ig.system.actualTick;
                    this.timer <= 0 && this.doMessageStep()
                } else if (this.timer < 0) {
                this.timer = this.timer + ig.system.actualTick;
                if (this.timer >=
                    0) this.visibleBoxes.length > 0 ? this.popMessage() : this.timer = 0
            }
            this.pauseMode && ig.canLeavePauseMenu && (sc.control.scrollUp() ? this.scrollMessages(-48) : sc.control.scrollDown() && this.scrollMessages(48))
        },
        doMessageStep: function(b) {
            if (sc.model.message.hasStackedSideMessages()) this.showNextSideMessage();
            else {
                if (b) this.quickPop = true;
                this.popMessage()
            }
        },
        updateBottomGap: function() {
            var b = 3 + sc.model.message.bottomGap;
            sc.model.isCutscene() && (b = b + 20);
            this.doPosTranstition(0, b, 0.2, KEY_SPLINES.EASE_IN_OUT)
        },
        modelChanged: function(b,
            a) {
            if (b == sc.model.message)
                if (a == sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE) this.timer <= 0 && this.showNextSideMessage();
                else if (a == sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE)
                for (; this.visibleBoxes.length > 0;) this.popMessage();
            else if (a == sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED) {
                this.restoreAfterLoad();
                this.restoreAfterPause(true);
                if (b.sideMessageStack.length > 0 || this.visibleBoxes.length > 0) this.timer = 2
            } else a == sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE && this.updateBottomGap();
            else if (b == sc.model && (a == sc.GAME_MODEL_MSG.STATE_CHANGED ||
                    a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)) {
                this.updateBottomGap();
                var d = sc.model.isRunning() || sc.model.isPaused() && !sc.arena.isSideMessagesBlocked();
                this.doStateTransition(d ? "DEFAULT" : "HIDDEN");
                this.visibleBoxes[this.visibleBoxes.length - 1] && !sc.model.isCutscene() && sc.skipInteract.addEntry(this.skipInteractEntry);
                if (d && !sc.model.isReset()) {
                    d = sc.model.isPaused();
                    if (d != this.pauseMode)(this.pauseMode = d) ? this.fillMessagesOnPause() : this.restoreAfterPause()
                }
            }
        },
        clearMessages: function() {
            for (; this.visibleBoxes.length >
                0;) this.visibleBoxes.shift().remove();
            this.updateSkipGui();
            sc.skipInteract.removeEntry(this.skipInteractEntry);
            this.timer = 0;
            this.quickPop = false
        },
        fillMessagesOnPause: function() {
            var b = this.visibleBoxes[this.visibleBoxes.length - 1];
            b && b.text.stop();
            for (var b = sc.model.message.sideMessages, a = 0, d = this.visibleBoxes.length; d--;) a = a + (this.visibleBoxes[d].hook.size.y + 3);
            for (d = Math.max(0, b.length - this.visibleBoxes.length); d--;) {
                var c = b[d],
                    e = new sc.SideMessageBoxGui;
                e.setContent(c.charExpression, c.message, true);
                e.setPos(0, a);
                e.show();
                a = a + (e.hook.size.y + 3);
                this.contentGui.addChildGui(e);
                this.pauseBoxes.push(e)
            }
            this.pauseMaxY = a - 3;
            this.visibleBoxes.length < b.length && this.sideLabel.doStateTransition("DEFAULT");
            for (d = 0; d < this.visibleBoxes.length; ++d) this.visibleBoxes[d].doStateTransition("DEFAULT");
            this.updateSkipGui()
        },
        restoreAfterLoad: function() {
            this.clearMessages();
            for (var b = sc.model.message.sideMessages, a = b.length - sc.model.message.displayedSideMessages; a < b.length; ++a) this.pushMessageBottom(b[a], 100, a < b.length -
                1);
            this.contentGui.doScrollTransition(0, 0, 0.2, KEY_SPLINES.EASE_OUT)
        },
        restoreAfterPause: function() {
            this.sideLabel.doStateTransition("HIDDEN");
            this.contentGui.doScrollTransition(0, 0, 0.2, KEY_SPLINES.EASE_OUT);
            for (var b = this.pauseBoxes.length; b--;) this.pauseBoxes[b].remove(false);
            for (b = 0; b < this.visibleBoxes.length - 1; ++b) this.visibleBoxes[b].doStateTransition("UPWARD");
            (b = this.visibleBoxes[this.visibleBoxes.length - 1]) && b.text.resume();
            this.updateSkipGui()
        },
        scrollMessages: function(b) {
            var a = this.contentGui.getDestScroll().y,
                a = (a - b).limit(0, this.pauseMaxY - this.contentGui.hook.size.y);
            this.contentGui.doScrollTransition(0, a, 0.2, KEY_SPLINES.EASE_OUT)
        },
        showNextSideMessage: function() {
            var b = sc.model.message.getNextSideMessage();
            this.timer = sc.getMessageTime(b.message);
            this.pushMessageBottom(b, 100);
            sc.voiceActing.play(b.charExpression, b.message);
            this.quickPop = false;
            sc.model.message.displayedSideMessages = this.visibleBoxes.length
        },
        pushMessageBottom: function(b, a, d) {
            var c = new sc.SideMessageBoxGui;
            c.setContent(b.charExpression, b.message,
                d || false);
            d || c.setOnFinish(this.onMessageFinish.bind(this));
            sc.model.isCutscene() || sc.skipInteract.addEntry(this.skipInteractEntry);
            b = c.hook.size.y;
            this.contentGui.addChildGui(c);
            c.show();
            c.setPos(0, 0);
            this.visibleBoxes.push(c);
            for (var d = this.visibleBoxes.length, e = b = 0; d--;) {
                c = this.visibleBoxes[d];
                if (!e && d < this.visibleBoxes.length - 1 && b + c.hook.size.y > a) {
                    e = d + 1;
                    b = Math.max(c.hook.pos.y, b - c.hook.size.y - 3)
                }
                c.doPosTranstition(0, b, 0.2, KEY_SPLINES.EASE_OUT);
                d < this.visibleBoxes.length - 1 && c.doStateTransition("UPWARD");
                e || (b = b + (c.hook.size.y + 3))
            }
            if (e) {
                for (d = e; d--;) this.visibleBoxes[d].remove(true);
                this.visibleBoxes.splice(0, e)
            }
            this.updateSkipGui();
            return true
        },
        isLastBlockFinished: function() {
            var b = this.visibleBoxes.length;
            return b == 0 ? false : this.visibleBoxes[b - 1].isFinished()
        },
        popMessage: function() {
            this.timer = this.quickPop ? -0.2 : -1;
            var b = this.visibleBoxes.shift();
            b.text.finish();
            b.remove();
            if (this.visibleBoxes.length == 0) {
                sc.skipInteract.removeEntry(this.skipInteractEntry);
                this.quickPop = false
            }
            sc.model.message.displayedSideMessages =
                this.visibleBoxes.length
        },
        updateSkipGui: function() {
            var b = this.visibleBoxes[this.visibleBoxes.length - 1];
            if (!this.pauseMode && b && b.isFinished() && this.skipInteractEntry.isActive()) {
                this.skipGui.setPos(b.hook.size.x + 1, 0);
                this.skipGui.show()
            } else this.skipGui.hide()
        },
        onMessageFinish: function() {
            this.updateSkipGui()
        },
        onSkipInteract: function(b) {
            if (b == sc.SKIP_INTERACT_MSG.SKIPPED)(b = this.visibleBoxes[this.visibleBoxes.length - 1]) && (b.isFinished() ? this.doMessageStep(true) : b.skip());
            this.updateSkipGui()
        }
    });
    sc.getMessageTime =
        function(b) {
            return Math.max(2, b.toString().length / 20 * 1 + 1)
        };
    sc.SideMessageContentGui = ig.GuiElementBase.extend({
        init: function() {
            this.parent();
            this.setSize(264, 180);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.hook.clip = true
        }
    });
    sc.SideMessageBoxGui = sc.SlickBoxRawGui.extend({
        text: null,
        face: null,
        beepSound: new ig.Sound("media/sound/hud/dialog-beep-2.ogg", 1, 0.02),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            UPWARD: {
                state: {
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 1,
                    scaleY: 0,
                    offsetX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        init: function() {
            this.parent(0, 0, false);
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.text = new sc.TextGui("", {
                maxWidth: 202,
                speed: ig.TextBlock.SPEED.NORMAL
            });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(60, 0);
            this.addChildGui(this.text);
            this.face = new sc.SideMessageFaceGui;
            this.addChildGui(this.face)
        },
        setContent: function(b, a, d) {
            this.text.setText(a);
            d ? this.text.finish() :
                this.text.setBeepSound(this.beepSound);
            a = this.text.hook.size.x;
            a = (a < 101 ? 101 : 202) + 62;
            d = Math.max(42, this.text.hook.size.y + 4);
            this.setSize(a, d);
            this.face.setFace(b, d)
        },
        setOnFinish: function(b) {
            this.text.textBlock.onFinish = b
        },
        isFinished: function() {
            return this.text.textBlock.isFinished()
        },
        skip: function() {
            this.text.finish()
        },
        show: function(b) {
            this.hook.pivot.y = b ? 0 : this.hook.size.y;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        remove: function(b) {
            this.hook.pivot.y = b ? 0 : this.hook.size.y;
            this.doStateTransition("HIDDEN", false, true)
        }
    });
    sc.SideMessageFaceGui = ig.GuiElementBase.extend({
        charExpression: null,
        timer: 0,
        transitions: {
            DEFAULT: {
                state: {
                    scaleX: -1
                },
                time: 0,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        init: function() {
            this.parent();
            this.hook.size.x = 56;
            this.hook.pivot.x = 28;
            this.doStateTransition("DEFAULT", true)
        },
        setFace: function(b, a) {
            this.charExpression = b;
            this.hook.size.y = a;
            this.timer = 0
        },
        update: function() {
            this.timer = this.timer + ig.system.actualTick
        },
        updateDrawables: function(b) {
            this.charExpression &&
                sc.MsgGuiTools.drawPortrait(b, this.charExpression, this.timer, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    });
    sc.SideMessageLabelGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        iconText: null,
        currentIconDevice: null,
        init: function() {
            this.parent();
            this.setSize(24, 180);
            this.hook.align.x = ig.GUI_ALIGN.X_RIGHT;
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            var b = new sc.SlickSmallSideGui(this.hook.size.y);
            this.addChildGui(b);
            b = new sc.SlickBigSideGui(70);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(b);
            b = new ig.ImageGui(this.gfx, 16, 80, 8, 8);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            b.setPos(0, -19);
            this.addChildGui(b);
            b = new ig.ImageGui(this.gfx, 16, 88, 8, 8);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            b.setPos(0, 19);
            this.addChildGui(b);
            this.iconText = new sc.TextGui("\\i[mousewheel]");
            this.currentIconDevice =
                ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
            this.iconText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.iconText)
        },
        update: function() {
            if (this.currentIconDevice != ig.input.currentDevice) {
                this.currentIconDevice = ig.input.currentDevice;
                this.iconText.setText(this.currentIconDevice == ig.INPUT_DEVICES.GAMEPAD ? "\\i[gamepad-l1]\n\\i[gamepad-r1]" : "\\i[mousewheel]")
            }
        }
    })
});
ig.baked = !0;
