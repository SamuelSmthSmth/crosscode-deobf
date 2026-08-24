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
        doMessageStep: function(skip) {
            if (sc.model.message.hasStackedSideMessages()) this.showNextSideMessage();
            else {
                if (skip) this.quickPop = true;
                this.popMessage()
            }
        },
        updateBottomGap: function() {
            var offsetY = 3 + sc.model.message.bottomGap;
            sc.model.isCutscene() && (offsetY = offsetY + 20);
            this.doPosTranstition(0, offsetY, 0.2, KEY_SPLINES.EASE_IN_OUT)
        },
        modelChanged: function(model,
            msg) {
            if (model == sc.model.message)
                if (msg == sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE) this.timer <= 0 && this.showNextSideMessage();
                else if (msg == sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE)
                for (; this.visibleBoxes.length > 0;) this.popMessage();
            else if (msg == sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED) {
                this.restoreAfterLoad();
                this.restoreAfterPause(true);
                if (model.sideMessageStack.length > 0 || this.visibleBoxes.length > 0) this.timer = 2
            } else msg == sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE && this.updateBottomGap();
            else if (model == sc.model && (msg == sc.GAME_MODEL_MSG.STATE_CHANGED ||
                    msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)) {
                this.updateBottomGap();
                var visible = sc.model.isRunning() || sc.model.isPaused() && !sc.arena.isSideMessagesBlocked();
                this.doStateTransition(visible ? "DEFAULT" : "HIDDEN");
                this.visibleBoxes[this.visibleBoxes.length - 1] && !sc.model.isCutscene() && sc.skipInteract.addEntry(this.skipInteractEntry);
                if (visible && !sc.model.isReset()) {
                    visible = sc.model.isPaused();
                    if (visible != this.pauseMode)(this.pauseMode = visible) ? this.fillMessagesOnPause() : this.restoreAfterPause()
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
            var lastBox = this.visibleBoxes[this.visibleBoxes.length - 1];
            lastBox && lastBox.text.stop();
            for (var messages = sc.model.message.sideMessages, offsetY = 0, i = this.visibleBoxes.length; i--;) offsetY = offsetY + (this.visibleBoxes[i].hook.size.y + 3);
            for (i = Math.max(0, messages.length - this.visibleBoxes.length); i--;) {
                var entry = messages[i],
                    box = new sc.SideMessageBoxGui;
                box.setContent(entry.charExpression, entry.message, true);
                box.setPos(0, offsetY);
                box.show();
                offsetY = offsetY + (box.hook.size.y + 3);
                this.contentGui.addChildGui(box);
                this.pauseBoxes.push(box)
            }
            this.pauseMaxY = offsetY - 3;
            this.visibleBoxes.length < messages.length && this.sideLabel.doStateTransition("DEFAULT");
            for (i = 0; i < this.visibleBoxes.length; ++i) this.visibleBoxes[i].doStateTransition("DEFAULT");
            this.updateSkipGui()
        },
        restoreAfterLoad: function() {
            this.clearMessages();
            for (var messages = sc.model.message.sideMessages, start = messages.length - sc.model.message.displayedSideMessages; start < messages.length; ++start) this.pushMessageBottom(messages[start], 100, start < messages.length -
                1);
            this.contentGui.doScrollTransition(0, 0, 0.2, KEY_SPLINES.EASE_OUT)
        },
        restoreAfterPause: function() {
            this.sideLabel.doStateTransition("HIDDEN");
            this.contentGui.doScrollTransition(0, 0, 0.2, KEY_SPLINES.EASE_OUT);
            for (var i = this.pauseBoxes.length; i--;) this.pauseBoxes[i].remove(false);
            for (i = 0; i < this.visibleBoxes.length - 1; ++i) this.visibleBoxes[i].doStateTransition("UPWARD");
            (i = this.visibleBoxes[this.visibleBoxes.length - 1]) && i.text.resume();
            this.updateSkipGui()
        },
        scrollMessages: function(amount) {
            var scrollY = this.contentGui.getDestScroll().y,
                scrollY = (scrollY - amount).limit(0, this.pauseMaxY - this.contentGui.hook.size.y);
            this.contentGui.doScrollTransition(0, scrollY, 0.2, KEY_SPLINES.EASE_OUT)
        },
        showNextSideMessage: function() {
            var entry = sc.model.message.getNextSideMessage();
            this.timer = sc.getMessageTime(entry.message);
            this.pushMessageBottom(entry, 100);
            sc.voiceActing.play(entry.charExpression, entry.message);
            this.quickPop = false;
            sc.model.message.displayedSideMessages = this.visibleBoxes.length
        },
        pushMessageBottom: function(entry, height, isInstant) {
            var box = new sc.SideMessageBoxGui;
            box.setContent(entry.charExpression, entry.message,
                isInstant || false);
            isInstant || box.setOnFinish(this.onMessageFinish.bind(this));
            sc.model.isCutscene() || sc.skipInteract.addEntry(this.skipInteractEntry);
            entry = box.hook.size.y;
            this.contentGui.addChildGui(box);
            box.show();
            box.setPos(0, 0);
            this.visibleBoxes.push(box);
            for (var i = this.visibleBoxes.length, offsetY = entry = 0; i--;) {
                box = this.visibleBoxes[i];
                if (!offsetY && i < this.visibleBoxes.length - 1 && entry + box.hook.size.y > height) {
                    offsetY = i + 1;
                    entry = Math.max(box.hook.pos.y, entry - box.hook.size.y - 3)
                }
                box.doPosTranstition(0, entry, 0.2, KEY_SPLINES.EASE_OUT);
                i < this.visibleBoxes.length - 1 && box.doStateTransition("UPWARD");
                offsetY || (entry = entry + (box.hook.size.y + 3))
            }
            if (offsetY) {
                for (i = offsetY; i--;) this.visibleBoxes[i].remove(true);
                this.visibleBoxes.splice(0, offsetY)
            }
            this.updateSkipGui();
            return true
        },
        isLastBlockFinished: function() {
            var count = this.visibleBoxes.length;
            return count == 0 ? false : this.visibleBoxes[count - 1].isFinished()
        },
        popMessage: function() {
            this.timer = this.quickPop ? -0.2 : -1;
            var box = this.visibleBoxes.shift();
            box.text.finish();
            box.remove();
            if (this.visibleBoxes.length == 0) {
                sc.skipInteract.removeEntry(this.skipInteractEntry);
                this.quickPop = false
            }
            sc.model.message.displayedSideMessages =
                this.visibleBoxes.length
        },
        updateSkipGui: function() {
            var box = this.visibleBoxes[this.visibleBoxes.length - 1];
            if (!this.pauseMode && box && box.isFinished() && this.skipInteractEntry.isActive()) {
                this.skipGui.setPos(box.hook.size.x + 1, 0);
                this.skipGui.show()
            } else this.skipGui.hide()
        },
        onMessageFinish: function() {
            this.updateSkipGui()
        },
        onSkipInteract: function(msg) {
            if (msg == sc.SKIP_INTERACT_MSG.SKIPPED)(msg = this.visibleBoxes[this.visibleBoxes.length - 1]) && (msg.isFinished() ? this.doMessageStep(true) : msg.skip());
            this.updateSkipGui()
        }
    });
    sc.getMessageTime =
        function(message) {
            return Math.max(2, message.toString().length / 20 * 1 + 1)
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
        setContent: function(face, text, isInstant) {
            this.text.setText(text);
            isInstant ? this.text.finish() :
                this.text.setBeepSound(this.beepSound);
            text = this.text.hook.size.x;
            text = (text < 101 ? 101 : 202) + 62;
            isInstant = Math.max(42, this.text.hook.size.y + 4);
            this.setSize(text, isInstant);
            this.face.setFace(face, isInstant)
        },
        setOnFinish: function(onFinish) {
            this.text.textBlock.onFinish = onFinish
        },
        isFinished: function() {
            return this.text.textBlock.isFinished()
        },
        skip: function() {
            this.text.finish()
        },
        show: function(instant) {
            this.hook.pivot.y = instant ? 0 : this.hook.size.y;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        remove: function(instant) {
            this.hook.pivot.y = instant ? 0 : this.hook.size.y;
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
        setFace: function(charExpression, height) {
            this.charExpression = charExpression;
            this.hook.size.y = height;
            this.timer = 0
        },
        update: function() {
            this.timer = this.timer + ig.system.actualTick
        },
        updateDrawables: function(drawables) {
            this.charExpression &&
                sc.MsgGuiTools.drawPortrait(drawables, this.charExpression, this.timer, 0, 0, this.hook.size.x, this.hook.size.y)
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
            var gui = new sc.SlickSmallSideGui(this.hook.size.y);
            this.addChildGui(gui);
            gui = new sc.SlickBigSideGui(70);
            gui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(gui);
            gui = new ig.ImageGui(this.gfx, 16, 80, 8, 8);
            gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            gui.setPos(0, -19);
            this.addChildGui(gui);
            gui = new ig.ImageGui(this.gfx, 16, 88, 8, 8);
            gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            gui.setPos(0, 19);
            this.addChildGui(gui);
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
