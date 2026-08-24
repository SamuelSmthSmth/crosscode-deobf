ig.module("game.feature.msg.gui.message-board").requires("impact.feature.gui.gui", "game.feature.gui.base.boxes", "game.feature.gui.base.text").defines(function() {
    sc.MsgBoardContentGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        text: null,
        init: function() {
            this.parent();
            var maxWidth = 230;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (maxWidth = 202);
            this.text =
                new sc.TextGui("WHATEVER", {
                    maxWidth: maxWidth,
                    textAlign: ig.Font.ALIGN.LEFT,
                    bestRatio: 10,
                    optimize: true
                });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        },
        setContent: function(text, textAlign, speed, onFinish) {
            var width = 0,
                height = 0;
            this.text.setTextAlign(textAlign);
            this.text.setTextSpeed(speed);
            this.text.textBlock.onFinish = onFinish;
            this.text.setPos(0, height);
            this.text.setText(text);
            height = height + this.text.hook.size.y;
            width = Math.max(width, this.text.hook.size.x);
            this.setSize(width, height);
            this.doStateTransition("HIDDEN",
                true);
            this.doStateTransition("DEFAULT", false, false, null, speed == ig.TextBlock.SPEED.IMMEDIATE ? fadeTime : 0)
        },
        isFinished: function() {
            return this.text.textBlock.isFinished()
        },
        skip: function() {
            this.text.finish()
        }
    });
    var fadeTime = 0.1,
        tempVec = Vec2.create();
    sc.MsgBoardGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0.1,
                    scaleX: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        box: null,
        content: null,
        side: null,
        sizeTransition: {
            start: Vec2.create(),
            end: Vec2.create(),
            timer: 0
        },
        init: function() {
            this.parent();
            this.box = new sc.ArrowBoxGui(8, 8, sc.ArrowBoxGui.POINTER.NONE);
            this.addChildGui(this.box);
            this.content = new sc.MsgBoardContentGui;
            this.content.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.content);
            this.setSide(null)
        },
        setSide: function(side) {
            this.side = side;
            var posX = 0,
                posY = -80;
            if (side) {
                posY = 56;
                posX = 96;
                side == sc.MESSAGE_SIDES.LEFT && (posX = -posX)
            }
            if (this.hook.pos.x != posX || this.hook.pos.y != posY) this.hook.currentStateName == "HIDDEN" ? this.setPos(posX, posY) : this.doPosTranstition(posX, posY, 0.3, KEY_SPLINES.EASE_IN_OUT)
        },
        hasSide: function() {
            return this.side
        },
        setContent: function(text, textAlign, speed, onFinish, side) {
            this.content.setContent(text, textAlign, speed, onFinish);
            this.setSide(side);
            text = this.content.hook.size;
            textAlign = text.x + 20;
            speed = text.y + 12;
            side = 250;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (side = 220);
            textAlign = Math.max(side, textAlign);
            speed = Math.max(36, speed);
            this.content.setPos((textAlign - text.x) / 2, (speed - text.y) / 2);
            if (this.hook.currentStateName == "HIDDEN") {
                this.doStateTransition("DEFAULT");
                this.setSize(textAlign, speed)
            } else if (this.hook.size.x != textAlign || this.hook.size.y != speed) {
                Vec2.assign(this.sizeTransition.start,
                    this.hook.size);
                Vec2.assignC(this.sizeTransition.end, textAlign, speed);
                this.sizeTransition.timer = fadeTime
            }
            this.content.isFinished() && onFinish()
        },
        skip: function() {
            this.content.skip()
        },
        setSize: function(width, height) {
            this.parent(width, height);
            this.setPivot(width / 2, height / 2);
            this.box.setSize(width, height)
        },
        update: function() {
            if (this.sizeTransition.timer) {
                this.sizeTransition.timer = this.sizeTransition.timer - ig.system.actualTick;
                if (this.sizeTransition.timer < 0) this.sizeTransition.timer = 0;
                var progress = 1 - this.sizeTransition.timer / fadeTime,
                    progress = KEY_SPLINES.EASE_IN_OUT.get(progress),
                    progress = Vec2.lerp(this.sizeTransition.start,
                        this.sizeTransition.end, progress, tempVec);
                this.setSize(this.sizeTransition.end.x, progress.y)
            }
        },
        hide: function(instant) {
            this.doStateTransition("HIDDEN", instant)
        }
    })
});
ig.baked = !0;
