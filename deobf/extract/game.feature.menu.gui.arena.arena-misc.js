ig.module("game.feature.menu.gui.arena.arena-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-cup-page", "game.feature.menu.gui.arena.arena-round-page", "game.feature.menu.gui.stats.stats-types").defines(function() {
    function b(a) {
        for (var b = ig.currentLang + "", b = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", c = /(\d+)(\d{3})/, a = a + ""; c.test(a);) a =
            a.replace(c, "$1" + b + "$2");
        return a
    }
    sc.ArenaInfoBox = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 8,
            left: 27,
            top: 21,
            right: 27,
            bottom: 3,
            offsets: {
                "default": {
                    x: 520,
                    y: 0
                },
                single: {
                    x: 456,
                    y: 244
                }
            }
        }),
        title: null,
        category: null,
        level: null,
        pages: [],
        cup: null,
        key: "-1s",
        round: -2,
        page: 0,
        init: function() {
            this.parent(281, 237);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.arena.titles.avgLevel",
                    description: "sc.gui.menu.help.arena.description.avgLevel"
                },
                offset: {
                    x: 257,
                    y: 2
                },
                size: {
                    x: 21,
                    y: 19
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.title = new sc.TextGui("");
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.title.setPos(0, 4);
            this.addChildGui(this.title);
            this.category = new sc.TextGui("");
            this.category.setPos(7, 3);
            this.addChildGui(this.category);
            this.level = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(5, 11);
            this.addChildGui(this.level);
            var a = new sc.ArenaCupInfoPage;
            a.setPos(6, 23);
            this.addChildGui(a);
            this.pages.push(a);
            a = new sc.ArenaRoundInfoPage;
            a.setPos(6, 24);
            a.doStateTransition("HIDDEN", true);
            this.addChildGui(a);
            this.pages.push(a);
            a = new sc.ArenaTopLine(277);
            a.setPos(2, 24);
            this.addChildGui(a);
            a = new sc.TextGui("lvl", {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            a.setPos(6, 3);
            this.addChildGui(a);
            this.setInfo()
        },
        show: function() {
            this.pages[0].doStateTransition("DEFAULT", true);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.key = "-1s";
            this.cup = null;
            this.page = 0;
            this.round = -2;
            this.doStateTransition("HIDDEN")
        },
        switchPage: function(a) {
            this.pages[this.page] && this.pages[this.page].hide();
            this.page = a || 0;
            this.pages[this.page] && this.pages[this.page].show();
            this.key = "-1s";
            this.round = -2
        },
        setInfo: function(a, b) {
            this.page == 0 ? this.setCupInfo(a) : this.page ==
                1 && this.setRoundInfo(a, b)
        },
        setCupInfo: function(a) {
            if (this.key != a) {
                this.level.setNumber(a ? sc.arena.getCupLevel(a) : 0);
                this.key = a;
                (this.cup = sc.arena.getCupData(this.key)) ? this.title.setText(sc.arena.getCupName(this.key)): this.title.setText(ig.lang.get("sc.gui.arena.menu.noCup"));
                this.pages[0].setData(a, this.cup, true)
            }
        },
        setRoundInfo: function(a, b) {
            if (b == void 0) {
                this.title.setText(ig.lang.get("sc.gui.arena.menu.noRound"));
                this.pages[1].setData();
                this.round = -2
            } else if (!(this.key == a && this.round == b)) {
                this.key =
                    a;
                this.round = b;
                (this.cup = sc.arena.getCupData(this.key)) ? b == -1 ? this.title.setText(ig.lang.get("sc.gui.arena.menu.rush")) : this.title.setText(ig.LangLabel.getText(this.cup.rounds[b].name)): this.title.setText(ig.lang.get("sc.gui.arena.menu.noRound"));
                this.round >= -1 && this.pages[1].setData(a, this.round, true)
            }
        },
        setCategory: function(a) {
            this.category.setText("\\i[arena-" + a + "]")
        }
    });
    sc.ArenaTopLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        init: function(a) {
            this.parent();
            this.setSize(a ||
                100, 1)
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.hook.size;
            a.addGfx(this.gfx, 0, 0, 416, 504, 32, 1);
            a.addColor("#FFF", 32, 0, b.x - 64, 1);
            a.addGfx(this.gfx, b.x - 32, 0, 416, 504, 32, 1, true)
        }
    });
    sc.ArenaKeyValue = ig.SimpleGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
            }
        },
        keyGui: null,
        valueGui: null,
        init: function(a, b, c) {
            this.parent();
            this.setSize(b || 269, 20);
            this.keyGui =
                new sc.TextGui(a, {
                    font: sc.fontsystem.smallFont
                });
            this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.TextGui("", {
                font: c ? sc.fontsystem.font : sc.fontsystem.smallFont
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(0, 0);
            this.addChildGui(this.valueGui);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X)
        },
        setKey: function(a) {
            this.keyGui.setText(a)
        },
        setValue: function(a) {
            this.valueGui.setText(a)
        },
        updateDrawables: function(a) {
            if (this.keyGui && this.valueGui) {
                var b = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    c = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    c = Math.floor(c / 3) * 3;
                a.addPattern(this.constructor.PATTERN, b, 12, 0, 0, c, 4)
            }
        }
    });
    sc.ArenaTinyKeyValue = ig.SimpleGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
            }
        },
        keyGui: null,
        valueGui: null,
        init: function(a, b, c) {
            this.parent();
            this.setSize(b || 269, 20);
            this.keyGui = new sc.TextGui(a, {
                font: sc.fontsystem.smallFont
            });
            this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.TextGui("", {
                font: c ? sc.fontsystem.font : sc.fontsystem.smallFont
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(0, 0);
            this.addChildGui(this.valueGui);
            if (!this.constructor.PATTERN) this.constructor.PATTERN =
                this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X)
        },
        updateDrawables: function(a) {
            if (this.keyGui && this.valueGui) {
                var b = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    c = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    c = Math.floor(c / 3) * 3;
                a.addPattern(this.constructor.PATTERN, b, 12, 0, 0, c, 4)
            }
        }
    });
    sc.ArenaInfoLine = ig.SimpleGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 6,
            top: 13,
            right: 6,
            bottom: 0,
            offsets: {
                "default": {
                    x: 32,
                    y: 304
                }
            }
        }),
        textGui: null,
        init: function(a) {
            this.parent();
            this.textGui = new sc.TextGui(a, {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.textGui.setPos(0, -0.5);
            this.addChildGui(this.textGui);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.setSize(277, 13)
        },
        setSize: function(a, b) {
            this.parent(a, b);
            this.setPivot(a / 2, b / 2)
        },
        updateDrawables: function(a) {
            a.addColor("#545454", 0, 6, this.hook.size.x, 1);
            this.ninepatch.draw(a, 100, this.hook.size.y, "default", this.hook.size.x / 2 - 50, 0)
        }
    });
    sc.ArenaTotalPoints = sc.MenuPanel.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -140.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        number: null,
        init: function() {
            this.parent(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(281, 23);
            this.setPos(8, 27);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.totalPoints"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.number = new sc.TextGui(b(0));
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.number.setPos(5, 0);
            this.addChildGui(this.number);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.arena.titles.points",
                    description: "sc.gui.menu.help.arena.description.points"
                },
                offset: {
                    x: 0,
                    y: 0
                },
                size: {
                    x: "dyn",
                    y: "dyn"
                },
                index: {
                    x: 0,
                    y: "last"
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.number.setText(b(sc.arena.getTotalArenaCoins()));
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.text.hook.size.x + this.text.hook.pos.x + 1,
                c = this.hook.size.x - this.text.hook.size.x -
                this.number.hook.size.x - 10,
                c = Math.floor(c / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 14, 0, 0, c, 4)
        }
    });
    sc.ArenaEntryButton = sc.ListBoxButton.extend({
        trophyGfx: new ig.Image("media/gui/arena-gui.png"),
        key: null,
        description: null,
        decoration: null,
        init: function(a, b, c, e) {
            this.parent(a, 233, 28);
            this.key = b || null;
            this.description = c || null;
            this.button.submitSound = null;
            this.decoration = new ig.ImageGui(this.trophyGfx, 48, 32, 16, e == 5 ? 17 : 16);
            this.decoration.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.decoration.setPos(5,
                2);
            this.addChildGui(this.decoration);
            this.setDecoration(e)
        },
        setDecoration: function(a) {
            this.decoration.offsetX = (a || 0) * 16
        }
    });
    sc.ArenaRoundEntryButton = sc.ArenaEntryButton.extend({
        round: null,
        dots: null,
        index: -2,
        init: function(a, b, c, e, f, g) {
            this.parent(a, b, g, e);
            this.decoration.offsetY = 0;
            this.index = c;
            if (c >= 0) {
                this.round = new sc.NumberGui(f || 99, {
                    size: sc.NUMBER_SIZE.TEXT,
                    leadingZeros: f >= 100 ? 3 : 2
                });
                this.round.setPos(7, 5);
                this.round.setNumber(c + 1);
                this.addChildGui(this.round);
                this.dots = new ig.ImageGui(this.round.gfx,
                    267, 35, 3, 7);
                this.dots.setPos(7 + this.round.hook.size.x + 1, 7);
                this.addChildGui(this.dots);
                this.button.textChild.hook.pos.x = this.dots.hook.pos.x + 6
            } else {
                this.button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.button.textChild.setPos(0, 0)
            }
        },
        updateDrawables: function(a) {
            this.parent(a)
        },
        setActive: function(a) {
            this.parent(a);
            this.round && this.round.setColor(a ? sc.GUI_NUMBER_COLOR.WHITE : sc.GUI_NUMBER_COLOR.GREY);
            if (this.dots) this.dots.offsetY = a ? 35 : 65
        }
    })
});
ig.baked = !0;
