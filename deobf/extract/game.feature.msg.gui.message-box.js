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
        init: function(b, a, d, c, e, f) {
            this.parent();
            this.personEntry = e;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (b = 202);
            this.text = new sc.TextGui(d, {
                maxWidth: b,
                speed: c,
                bestRatio: 4,
                optimize: true
            });
            this.box = new sc.ArrowBoxGui(this.text.hook.size.x, this.text.hook.size.y, a);
            this.text.setPos(this.box.PADDING_X, this.box.PADDING_Y);
            this.text.setBeepSound(f);
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
        setOnFinish: function(b) {
            this.text.textBlock.onFinish = b
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
        init: function(b, a, d, c, e) {
            this.parent();
            this.hook.align.y = ig.GUI_ALIGN.Y_BOTTOM;
            this.hook.localAlpha = 0.9;
            this.choices = b;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.columns = c ? c < 1 ? 1 : c : 1;
            for (var c = Math.ceil(this.choices.length / this.columns), f = 0, g = 0, e = e || sc.BUTTON_DEFAULT_WIDTH, h = 0, i = 0, j = 0, k = 0; k < b.length; ++k) {
                var l =
                    b[k].activeCondition.evaluate();
                if (b[k].showCondition.evaluate()) {
                    l = new sc.ButtonGui(this.choices[k].label, void 0, l, sc.BUTTON_TYPE.ITEM);
                    l.choiceIndex = k;
                    var o = this;
                    l.onButtonPress = function() {
                        o.remove();
                        sc.model.message.selectChoice(this.choiceIndex)
                    };
                    if (b[k].center) {
                        l.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                        l.textChild.setPos(0, 0)
                    }
                    l.setPos(3 + f, 3 + g);
                    if (b[k].stretch) {
                        this.buttonGroup.addFocusGui(l, 0, h);
                        for (var m = 1; m < this.columns; m++) this.buttonGroup.addNull(m, h)
                    } else this.buttonGroup.addFocusGui(l,
                        i, h);
                    g = g + (l.hook.size.y + 0);
                    h++;
                    j < g && (j = g);
                    if (h >= c) {
                        g = 0;
                        f = f + (e + 1);
                        i++;
                        h = 0
                    }
                    e = Math.max(e, l.hook.size.x);
                    this.buttons[k] = l
                }
            }
            this.bgBox = new sc.BlackGrayBox(e * this.columns + 6 + (this.columns - 1), j - 0 + 6 - 1, true);
            this.bgBox.hook.localAlpha = this.hook.localAlpha;
            this.addChildGui(this.bgBox);
            this.delayTimer = 0.3;
            for (k = 0; k < b.length; ++k)
                if (this.buttons[k]) {
                    b[k].stretch ? this.buttons[k].setWidth(e * this.columns) : this.buttons[k].setWidth(e);
                    this.addChildGui(this.buttons[k])
                } this.setSize(this.bgBox.hook.size.x, this.bgBox.hook.size.y +
                12);
            this.hook.pivot.y = this.hook.size.y;
            b = a - this.hook.size.x / 2;
            this.pointerOffsetX = this.hook.size.x / 2;
            if (b + this.hook.size.x + 2 > ig.system.width) {
                this.pointerOffsetX = this.pointerOffsetX + (b + this.hook.size.x + 2 - ig.system.width);
                b = ig.system.width - this.hook.size.x - 2
            } else if (b < 2) {
                this.pointerOffsetX = this.pointerOffsetX + (b - 2);
                b = 2
            }
            this.setPos(b, d);
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
        updateDrawables: function(b) {
            b.addGfx(this.gfx, this.pointerOffsetX - 8, this.hook.size.y - 12, 32, 32, 16, 12)
        },
        remove: function() {
            ig.interact.removeEntry(this.buttonInteract);
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;
