/**
 * game.feature.menu.gui.arena.arena-misc
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.arena.arena-misc")`.
 *
 * Arena menu widgets:
 *  - `sc.ArenaInfoBox`: the left info panel — cup info page and round
 *    info page with title, category icon, level and synopsis key/round.
 *  - `sc.ArenaTopLine`, `sc.ArenaKeyValue` / `sc.ArenaTinyKeyValue`,
 *    `sc.ArenaInfoLine`: small display helpers.
 *  - `sc.ArenaTotalPoints`: the arena-coin total panel.
 *  - `sc.ArenaEntryButton` / `sc.ArenaRoundEntryButton`: cup list rows
 *    (trophy decoration) and round rows (number, dots, medal).
 */
ig.module("game.feature.menu.gui.arena.arena-misc")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-cup-page", "game.feature.menu.gui.arena.arena-round-page", "game.feature.menu.gui.stats.stats-types")
    .defines(function () {

    function formatNumber(value) {
        for (var lang = ig.currentLang + "", separator = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", pattern = /(\d+)(\d{3})/, value = value + ""; pattern.test(value);) value = value.replace(pattern, "$1" + separator + "$2");
        return value
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

        init: function () {
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
            var page = new sc.ArenaCupInfoPage;
            page.setPos(6, 23);
            this.addChildGui(page);
            this.pages.push(page);
            page = new sc.ArenaRoundInfoPage;
            page.setPos(6, 24);
            page.doStateTransition("HIDDEN", true);
            this.addChildGui(page);
            this.pages.push(page);
            var topLine = new sc.ArenaTopLine(277);
            topLine.setPos(2, 24);
            this.addChildGui(topLine);
            var lvlLabel = new sc.TextGui("lvl", {
                font: sc.fontsystem.tinyFont
            });
            lvlLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            lvlLabel.setPos(6, 3);
            this.addChildGui(lvlLabel);
            this.setInfo()
        },

        show: function () {
            this.pages[0].doStateTransition("DEFAULT", true);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.key = "-1s";
            this.cup = null;
            this.page = 0;
            this.round = -2;
            this.doStateTransition("HIDDEN")
        },

        switchPage: function (page) {
            this.pages[this.page] && this.pages[this.page].hide();
            this.page = page || 0;
            this.pages[this.page] && this.pages[this.page].show();
            this.key = "-1s";
            this.round = -2
        },

        setInfo: function (key, round) {
            this.page == 0 ? this.setCupInfo(key) : this.page == 1 && this.setRoundInfo(key, round)
        },

        setCupInfo: function (key) {
            if (this.key != key) {
                this.level.setNumber(key ? sc.arena.getCupLevel(key) : 0);
                this.key = key;
                (this.cup = sc.arena.getCupData(this.key)) ? this.title.setText(sc.arena.getCupName(this.key)) : this.title.setText(ig.lang.get("sc.gui.arena.menu.noCup"));
                this.pages[0].setData(key, this.cup, true)
            }
        },

        setRoundInfo: function (key, round) {
            if (round == void 0) {
                this.title.setText(ig.lang.get("sc.gui.arena.menu.noRound"));
                this.pages[1].setData();
                this.round = -2
            } else if (!(this.key == key && this.round == round)) {
                this.key = key;
                this.round = round;
                (this.cup = sc.arena.getCupData(this.key)) ? round == -1 ? this.title.setText(ig.lang.get("sc.gui.arena.menu.rush")) : this.title.setText(ig.LangLabel.getText(this.cup.rounds[round].name)) : this.title.setText(ig.lang.get("sc.gui.arena.menu.noRound"));
                this.round >= -1 && this.pages[1].setData(key, this.round, true)
            }
        },

        setCategory: function (category) {
            this.category.setText("\\i[arena-" + category + "]")
        }
    });

    sc.ArenaTopLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),

        init: function (width) {
            this.parent();
            this.setSize(width || 100, 1)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            var size = this.hook.size;
            renderer.addGfx(this.gfx, 0, 0, 416, 504, 32, 1);
            renderer.addColor("#FFF", 32, 0, size.x - 64, 1);
            renderer.addGfx(this.gfx, size.x - 32, 0, 416, 504, 32, 1, true)
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

        init: function (key, width, largeValue) {
            this.parent();
            this.setSize(width || 269, 20);
            this.keyGui = new sc.TextGui(key, {
                font: sc.fontsystem.smallFont
            });
            this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.TextGui("", {
                font: largeValue ? sc.fontsystem.font : sc.fontsystem.smallFont
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(0, 0);
            this.addChildGui(this.valueGui);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X)
        },

        setKey: function (key) {
            this.keyGui.setText(key)
        },

        setValue: function (value) {
            this.valueGui.setText(value)
        },

        updateDrawables: function (renderer) {
            if (this.keyGui && this.valueGui) {
                var startX = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    width = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    width = Math.floor(width / 3) * 3;
                renderer.addPattern(this.constructor.PATTERN, startX, 12, 0, 0, width, 4)
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

        init: function (key, width, largeValue) {
            this.parent();
            this.setSize(width || 269, 20);
            this.keyGui = new sc.TextGui(key, {
                font: sc.fontsystem.smallFont
            });
            this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.keyGui.setPos(0, 0);
            this.addChildGui(this.keyGui);
            this.valueGui = new sc.TextGui("", {
                font: largeValue ? sc.fontsystem.font : sc.fontsystem.smallFont
            });
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(0, 0);
            this.addChildGui(this.valueGui);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(560, 192, 15, 4, ig.ImagePattern.OPT.REPEAT_X)
        },

        updateDrawables: function (renderer) {
            if (this.keyGui && this.valueGui) {
                var startX = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    width = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 1,
                    width = Math.floor(width / 3) * 3;
                renderer.addPattern(this.constructor.PATTERN, startX, 12, 0, 0, width, 4)
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

        init: function (text) {
            this.parent();
            this.textGui = new sc.TextGui(text, {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.textGui.setPos(0, -0.5);
            this.addChildGui(this.textGui);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.setSize(277, 13)
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.setPivot(width / 2, height / 2)
        },

        updateDrawables: function (renderer) {
            renderer.addColor("#545454", 0, 6, this.hook.size.x, 1);
            this.ninepatch.draw(renderer, 100, this.hook.size.y, "default", this.hook.size.x / 2 - 50, 0)
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

        init: function () {
            this.parent(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(281, 23);
            this.setPos(8, 27);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.totalPoints"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.number = new sc.TextGui(formatNumber(0));
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

        show: function () {
            this.number.setText(formatNumber(sc.arena.getTotalArenaCoins()));
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.doStateTransition("HIDDEN")
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            var startX = this.text.hook.size.x + this.text.hook.pos.x + 1,
                width = this.hook.size.x - this.text.hook.size.x - this.number.hook.size.x - 10,
                width = Math.floor(width / 4) * 4;
            renderer.addPattern(this.constructor.PATTERN, startX, 14, 0, 0, width, 4)
        }
    });

    sc.ArenaEntryButton = sc.ListBoxButton.extend({
        trophyGfx: new ig.Image("media/gui/arena-gui.png"),
        key: null,
        description: null,
        decoration: null,

        init: function (label, cup, description, trophy) {
            this.parent(label, 233, 28);
            this.key = cup || null;
            this.description = description || null;
            this.button.submitSound = null;
            this.decoration = new ig.ImageGui(this.trophyGfx, 48, 32, 16, trophy == 5 ? 17 : 16);
            this.decoration.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.decoration.setPos(5, 2);
            this.addChildGui(this.decoration);
            this.setDecoration(trophy)
        },

        setDecoration: function (trophy) {
            this.decoration.offsetX = (trophy || 0) * 16
        }
    });

    sc.ArenaRoundEntryButton = sc.ArenaEntryButton.extend({
        round: null,
        dots: null,
        index: -2,

        init: function (label, cup, index, medal, roundCount, description) {
            this.parent(label, cup, description, medal);
            this.decoration.offsetY = 0;
            this.index = index;
            if (index >= 0) {
                this.round = new sc.NumberGui(roundCount || 99, {
                    size: sc.NUMBER_SIZE.TEXT,
                    leadingZeros: roundCount >= 100 ? 3 : 2
                });
                this.round.setPos(7, 5);
                this.round.setNumber(index + 1);
                this.addChildGui(this.round);
                this.dots = new ig.ImageGui(this.round.gfx, 267, 35, 3, 7);
                this.dots.setPos(7 + this.round.hook.size.x + 1, 7);
                this.addChildGui(this.dots);
                this.button.textChild.hook.pos.x = this.dots.hook.pos.x + 6
            } else {
                this.button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.button.textChild.setPos(0, 0)
            }
        },

        updateDrawables: function (renderer) {
            this.parent(renderer)
        },

        setActive: function (active) {
            this.parent(active);
            this.round && this.round.setColor(active ? sc.GUI_NUMBER_COLOR.WHITE : sc.GUI_NUMBER_COLOR.GREY);
            if (this.dots) this.dots.offsetY = active ? 35 : 65
        }
    })
});
ig.baked = !0;
