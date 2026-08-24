ig.module("game.feature.msg.gui.message-box").requires("impact.feature.gui.gui", "game.feature.gui.base.boxes", "game.feature.gui.base.text").defines(function() {
    sc.MsgBoxGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            SUB: {
                state: {
                    alpha: 0.8
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0.3,
                    scaleX: 0.3
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        box: null,
        personEntry: null,
        init: function(maxWidth, pointer, text, speed, personEntry, beepSound) {
            this.parent();
            this.personEntry = personEntry;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (maxWidth = 202);
            this.text = new sc.TextGui(text, {
                maxWidth: maxWidth,
                speed: speed,
                bestRatio: 4,
                optimize: true
            });
            this.box = new sc.ArrowBoxGui(this.text.hook.size.x, this.text.hook.size.y, pointer);
            this.text.setPos(this.box.PADDING_X, this.box.PADDING_Y);
            this.text.setBeepSound(beepSound);
            this.hook.size.x = this.box.hook.size.x;
            this.hook.size.y = this.box.hook.size.y;
            this.hook.pivot.x = this.box.hook.pivot.x;
            this.hook.pivot.y = this.box.hook.pivot.y;
            this.addChildGui(this.box);
            this.addChildGui(this.text)
        },
        setPointerDown: function() {
            this.box.setPointerDown()
        },
        setOnFinish: function(onFinish) {
            this.text.textBlock.onFinish = onFinish
        },
        isFinished: function() {
            return this.text.textBlock.isFinished()
        },
        skip: function() {
            this.text.finish()
        }
    });
    sc.ChoiceBoxGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
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
                    scaleY: 0,
                    scaleX: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        choices: null,
        buttons: [],
        buttonInteract: null,
        buttonGroup: null,
        bgBox: null,
        pointerOffsetX: 0,
        delayTimer: 0,
        columns: 1,
        init: function(choices, pointerX, y, columns, buttonWidth) {
            this.parent();
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.hook.localAlpha = 0.9;
            this.choices = choices;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.columns = columns ? columns < 1 ? 1 : columns : 1;
            for (var rowsPerColumn = Math.ceil(this.choices.length / this.columns), row = 0, offsetY = 0, width = buttonWidth || sc.BUTTON_DEFAULT_WIDTH, column = 0, maxHeight = 0, index = 0, i = 0; i < choices.length; ++i) {
                var active =
                    choices[i].activeCondition.evaluate();
                if (choices[i].showCondition.evaluate()) {
                    active = new sc.ButtonGui(this.choices[i].label, void 0, active, sc.BUTTON_TYPE.ITEM);
                    active.choiceIndex = i;
                    var self = this;
                    active.onButtonPress = function() {
                        self.remove();
                        sc.model.message.selectChoice(this.choiceIndex)
                    };
                    if (choices[i].center) {
                        active.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                        active.textChild.setPos(0, 0)
                    }
                    active.setPos(3 + column, 3 + offsetY);
                    if (choices[i].stretch) {
                        this.buttonGroup.addFocusGui(active, 0, row);
                        for (var col = 1; col < this.columns; col++) this.buttonGroup.addNull(col, row)
                    } else this.buttonGroup.addFocusGui(active,
                        index, row);
                    offsetY = offsetY + (active.hook.size.y + 0);
                    row++;
                    maxHeight < offsetY && (maxHeight = offsetY);
                    if (row >= rowsPerColumn) {
                        offsetY = 0;
                        column = column + (width + 1);
                        index++;
                        row = 0
                    }
                    width = Math.max(width, active.hook.size.x);
                    this.buttons[i] = active
                }
            }
            this.bgBox = new sc.BlackGrayBox(width * this.columns + 6 + (this.columns - 1), maxHeight - 0 + 6 - 1, true);
            this.bgBox.hook.localAlpha = this.hook.localAlpha;
            this.addChildGui(this.bgBox);
            this.delayTimer = 0.3;
            for (i = 0; i < choices.length; ++i)
                if (this.buttons[i]) {
                    choices[i].stretch ? this.buttons[i].setWidth(width * this.columns) : this.buttons[i].setWidth(width);
                    this.addChildGui(this.buttons[i])
                } this.setSize(this.bgBox.hook.size.x, this.bgBox.hook.size.y +
                12);
            this.hook.pivot.y = this.hook.size.y;
            choices = pointerX - this.hook.size.x / 2;
            this.pointerOffsetX = this.hook.size.x / 2;
            if (choices + this.hook.size.x + 2 > ig.system.width) {
                this.pointerOffsetX = this.pointerOffsetX + (choices + this.hook.size.x + 2 - ig.system.width);
                choices = ig.system.width - this.hook.size.x - 2
            } else if (choices < 2) {
                this.pointerOffsetX = this.pointerOffsetX + (choices - 2);
                choices = 2
            }
            this.setPos(choices, y);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        update: function() {
            if (this.delayTimer) {
                this.delayTimer = this.delayTimer - ig.system.actualTick;
                if (this.delayTimer <= 0) {
                    this.delayTimer = 0;
                    ig.interact.addEntry(this.buttonInteract)
                }
            }
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, this.pointerOffsetX - 8, this.hook.size.y - 12, 32, 32, 16, 12)
        },
        remove: function() {
            ig.interact.removeEntry(this.buttonInteract);
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;
