ig.module("game.feature.gui.widget.indiegogo-gui").requires("impact.feature.gui.gui", "impact.feature.interact.gui.focus-gui", "impact.feature.gui.base.box").defines(function() {
    sc.INDIEGOGO_FETCH_URL = "http://www.cross-code.com/page/api/get-indiegogo-data.php";
    sc.IndiegogoGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetY: -20
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        button: null,
        goalListGui: null,
        goalsData: null,
        active: false,
        init: function() {
            this.parent();
            this.setSize(158, 93);
            this.button = new sc.IndiegogoButton(this.onBarFilled.bind(this));
            this.addChildGui(this.button);
            this.goalListGui = new sc.IndiegogoGoalList;
            this.goalListGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.goalListGui.setPos(0, 94);
            this.addChildGui(this.goalListGui)
        },
        setData: function(a) {
            this.goalsData = a.goals;
            this.button.setData(a);
            this.goalListGui.setData(a.goals);
            this.active && this.doStateTransition("DEFAULT")
        },
        onBarFilled: function(a) {
            this.goalListGui.setReachedGoal(a)
        },
        update: function() {
            this.goalListGui.setViewAll(this.button.focus)
        },
        show: function() {
            this.active = true;
            $.ajax({
                url: sc.INDIEGOGO_FETCH_URL,
                type: "GET",
                dataType: "json",
                async: true,
                success: this._dataResponse.bind(this)
            })
        },
        _dataResponse: function(a) {
            this.setData(a)
        },
        hide: function(a) {
            this.active = false;
            this.doStateTransition("HIDDEN", a)
        }
    });
    sc.IndiegogoButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/indiegogo.png"),
        highlight: null,
        daysGui: null,
        fundBar: null,
        actionText: null,
        init: function(a) {
            this.parent();
            this.setSize(158,
                93);
            this.highlight = new sc.IndiegogoButtonHighlight;
            this.addChildGui(this.highlight);
            var b = new sc.TextGui("days\nleft!", {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(10, 8);
            this.addChildGui(b);
            this.daysGui = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE,
                transitionTime: 3
            });
            this.daysGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.daysGui.setPos(37, 9);
            this.addChildGui(this.daysGui);
            b = new sc.TextGui("fund-o-meter", {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(9, 27);
            this.addChildGui(b);
            this.fundBar = new sc.IndiegogoFundBar(a);
            this.fundBar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.fundBar.setPos(5, 23);
            this.addChildGui(this.fundBar);
            this.actionText = new sc.TextGui("", {
                font: sc.fontsystem.font,
                speed: ig.TextBlock.SPEED.NORMAL
            });
            this.actionText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.actionText.setPos(0, 3);
            this.addChildGui(this.actionText)
        },
        setData: function(a) {
            this.fundBar.setData(a.goals, a.current);
            this.daysGui.setNumber(a.days, true);
            this.actionText.setText(a.callToAction || "Make it happen!")
        },
        update: function() {
            this.highlight.doStateTransition(this.focus ? "DEFAULT" : "HIDDEN")
        },
        updateDrawables: function(a) {
            var b = this.hook;
            a.addGfx(this.gfx, 0, 0, 0, 0, b.size.x, b.size.y)
        },
        onButtonPress: function() {
            sc.BUTTON_SOUND.submit.play();
            window.SHOW_INDIEGOGO && window.SHOW_INDIEGOGO()
        }
    });
    sc.IndiegogoButtonHighlight = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/indiegogo.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 184,
                    y: 0
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent(158, 93, false)
        }
    });
    sc.IndiegogoFundBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/indiegogo.png"),
        filledCallback: null,
        fundingGoals: null,
        value: 0,
        maxValue: 0,
        fillCount: 0,
        fadeTimer: 0,
        beepSound: new ig.Sound("media/sound/hud/dialog-beep-2.ogg", 0.5),
        beepTimer: 0,
        init: function(a) {
            this.parent();
            this.setSize(148, 5);
            this.filledCallback = a
        },
        setData: function(a, b) {
            this.fundingGoals = a;
            this.maxValue = b;
            this.fillCount = this.value = 0
        },
        update: function() {
            if (this.fundingGoals) {
                var a = this.fundingGoals[this.fillCount].money - (this.fillCount ? this.fundingGoals[this.fillCount - 1].money : 0);
                if (this.value < this.maxValue) {
                    this.value = this.value + Math.min(a * 1, 4E4) * ig.system.actualTick;
                    if (this.value >= this.maxValue) {
                        this.value = this.maxValue;
                        this.beepSound.play(null)
                    } else {
                        this.beepTimer = this.beepTimer + ig.system.actualTick;
                        if (this.beepTimer > 0.05) {
                            this.beepTimer = this.beepTimer - 0.05;
                            a = 0.2 + 0.8 * (Math.log(this.value / 5) / 13);
                            this.beepSound.play(null, {
                                speed: a
                            })
                        }
                    }
                }
                for (a = this.fundingGoals.length; a--;)
                    if (this.fundingGoals[a].money <= this.value) break;
                a++;
                if (a > this.fillCount) {
                    this.fillCount = a;
                    this.filledCallback(a);
                    this.fadeTimer = 0.4
                }
                if (this.fadeTimer > 0) this.fadeTimer = this.fadeTimer - ig.system.actualTick
            }
        },
        updateDrawables: function(a) {
            if (this.fundingGoals) {
                var b = this.fillCount ? this.fundingGoals[this.fillCount - 1].money : 0,
                    d = this.hook,
                    g = Math.floor(d.size.x * ((this.value - b) / (this.fundingGoals[this.fillCount].money - b) % 1));
                if (this.fadeTimer > 0) {
                    b = this.fillCount % 2 ? 112 : 120;
                    a.addGfx(this.gfx, 0, 0, 0, b, d.size.x, d.size.y).setAlpha(this.fadeTimer / 0.4)
                }
                b = this.fillCount % 2 ? 120 : 112;
                a.addGfx(this.gfx, 0, 0, 0, b, g, d.size.y)
            }
        }
    });
    var b = {
            x: 160,
            y: 16
        },
        a = {
            x: 160,
            y: 24
        },
        d = {
            x: 160,
            y: 32
        };
    sc.IndiegogoGoal = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/indiegogo.png"),
        ninepatch: new ig.NinePatch("media/gui/indiegogo.png", {
            width: 16,
            height: 8,
            left: 4,
            top: 4,
            right: 4,
            bottom: 4,
            offsets: {
                "default": {
                    x: 160,
                    y: 0
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FADE_1: {
                state: {
                    alpha: 0.9
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FADE_2: {
                state: {
                    alpha: 0.75
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FADE_3: {
                state: {
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FADE_4: {
                state: {
                    alpha: 0.2
                },
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
        fade: 1,
        icon: null,
        init: function(a) {
            a = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont,
                maxWidth: 138
            });
            a.setPos(16, 2);
            this.parent(158, 4 + a.hook.size.y - 1, false);
            this.addChildGui(a);
            this.icon = new ig.ImageGui;
            this.icon.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.icon.setPos(4, 0);
            this.addChildGui(this.icon);
            this.setGoalState(b);
            this.hook.localAlpha = 0.9
        },
        setGoalState: function(a) {
            this.icon.setImage(this.gfx, a.x, a.y, 10, 8)
        }
    });
    sc.IndiegogoGoalList = ig.GuiElementBase.extend({
        goalGuis: [],
        viewAllMode: false,
        reachedGoal: 0,
        init: function() {
            this.parent();
            this.setSize(158, 0)
        },
        setData: function(a) {
            this.removeAllChildren();
            for (var b = this.reachedGoal = this.goalGuis.length = 0; b < a.length; ++b) {
                var d = new sc.IndiegogoGoal(a[b].text);
                this.goalGuis.push(d);
                d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.addChildGui(d)
            }
            this.updateList()
        },
        updateList: function() {
            for (var c = this.goalGuis.length, e = 0; c--;) {
                var f = this.goalGuis[c];
                f.doPosTranstition(0, e, 0.2);
                var g = b;
                c < this.reachedGoal ? g = d : c == this.reachedGoal && (g = a);
                f.setGoalState(g);
                if (this.viewAllMode || c <= this.reachedGoal) e = e + (f.hook.size.y + 1);
                g = "DEFAULT";
                if (!this.viewAllMode)
                    if (c >
                        this.reachedGoal) g = "HIDDEN";
                    else if (c < this.reachedGoal - 5) {
                    g = this.reachedGoal - 5 - c;
                    g = g > 4 ? "HIDDEN" : "FADE_" + g
                }
                f.doStateTransition(g)
            }
        },
        setViewAll: function(a) {
            if (this.viewAllMode != a) {
                this.viewAllMode = a;
                this.updateList()
            }
        },
        setReachedGoal: function(a) {
            this.reachedGoal = a;
            this.updateList()
        }
    })
});
ig.baked = !0;
