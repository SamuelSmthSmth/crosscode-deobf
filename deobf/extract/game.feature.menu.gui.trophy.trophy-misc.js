ig.module("game.feature.menu.gui.trophy.trophy-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.stats.stats-misc", "game.feature.interact.button-group").defines(function() {
    function b(a) {
        for (var b = ig.currentLang + "", b = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", e = /(\d+)(\d{3})/, a =
                a + ""; e.test(a);) a = a.replace(e, "$1" + b + "$2");
        return a
    }
    sc.TrophyTabOverview = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        total: null,
        category: null,
        section: null,
        init: function() {
            this.parent();
            this.setSize(132, 40);
            this.setPos(-134, 0);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            var a = 2;
            this.total = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.totalTrophies"),
                "99");
            this.total.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.total.setPos(1, a);
            this.addChildGui(this.total);
            a = a + 8;
            this.category = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.category"), "99");
            this.category.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.category.setPos(1, a);
            this.addChildGui(this.category);
            a = a + 8;
            this.section = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.section"), "99");
            this.section.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.section.setPos(1, a);
            this.addChildGui(this.section);
            this.updateNumbers()
        },
        updateNumbers: function(a, b) {
            var e = sc.trophies.getTotalTrophies(a, b),
                f = sc.trophies.getTotalTrophies(a),
                g = sc.trophies.getTotalTrophies();
            this.total.setValue(g.count + " / " + g.total);
            this.category.setValue(f.count + " / " + f.total);
            this.section.setValue(e.count + " / " + e.total)
        },
        updateDrawables: function(a) {
            a.addColor("#7E7E7E", 0, this.hook.size.y - 1, 132, 1)
        }
    });
    sc.TrophyTabOverview.Entry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        value: null,
        init: function(a, b, e) {
            this.parent();
            this.setSize(e || 130, 8);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 189, 16, 1, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont
            });
            this.addChildGui(this.text);
            this.value = new sc.TextGui(b, {
                font: sc.fontsystem.tinyFont
            });
            this.value.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.value)
        },
        setValue: function(a) {
            this.value.setText(a)
        },
        updateDrawables: function(a) {
            var b = this.text.hook.size.x + this.text.hook.pos.x + 1,
                e = this.hook.size.x - this.text.hook.size.x - this.value.hook.size.x - 1,
                e = Math.floor(e / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 5, 0, 0, e, 1)
        }
    });
    sc.TrophyTotalPoints = sc.MenuPanel.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 220
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        number: null,
        init: function() {
            this.parent(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(200, 23);
            this.setPos(66, 28);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.points"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.number = new sc.TextGui(b(0));
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.number.setPos(5,
                0);
            this.addChildGui(this.number);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.trophy.titles.points",
                    description: "sc.gui.menu.help.trophy.description.points"
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
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.number.setText(b(sc.trophies.getTotalPoints()));
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.text.hook.size.x + this.text.hook.pos.x +
                1,
                e = this.hook.size.x - this.text.hook.size.x - this.number.hook.size.x - 10,
                e = Math.floor(e / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 14, 0, 0, e, 4)
        }
    });
    sc.TrophyCompletion = sc.MenuPanel.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -220
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        percent: null,
        init: function() {
            this.parent(sc.MenuPanelType.BOTTOM_RIGHT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(200, 23);
            this.setPos(66, 28);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.completion"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.percent = new sc.StatPercentNumber(null, {
                size: sc.NUMBER_SIZE.TEXT,
                leadingZeros: 1,
                scramble: false
            });
            this.percent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.percent.setPos(5, 1);
            this.addChildGui(this.percent);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.trophy.titles.rate",
                    description: "sc.gui.menu.help.trophy.description.rate"
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
                    x: 1,
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            var a = sc.trophies.getTotalTrophiesUnlocked(true);
            this.percent.setNumber(a, true);
            if (a >= 1) {
                this.text.setText("\\c[3]" + ig.lang.get("sc.gui.menu.trophies.completion") + "\\c[0]");
                this.percent.setColor(sc.GUI_NUMBER_COLOR.ORANGE)
            }
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.text.hook.size.x + this.text.hook.pos.x + 1,
                e = this.hook.size.x - this.text.hook.size.x - this.percent.hook.size.x - 10,
                e = Math.floor(e / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 14, 0, 0, e, 4)
        }
    });
    sc.TrophySectionList = ig.GuiElementBase.extend({
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
        buttongroup: null,
        index: -1,
        category: null,
        callback: null,
        active: false,
        currentButton: -1,
        prevButton: -1,
        buttons: [],
        sectionButtons: {},
        switchLeft: null,
        switchRight: null,
        init: function(a, b, e) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(2, 45);
            this.category = a || null;
            this.index = b || 0;
            this.callback = e || null;
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.addPressCallback(function(a) {
                a.data.index != this.currentButton && this.callback && this.callback(this.category, this.index, a)
            }.bind(this));
            this.bg = new sc.MenuScanLines;
            this.addChildGui(this.bg);
            var b = sc.TROPHY_SECTIONS[a],
                e = 3,
                f = 0,
                g;
            for (g in b) {
                this.addButton(a, b[g], 1, e, f);
                f++;
                e = e + 25
            }
            this.currentButton = 0;
            this.setActiveButton(this.currentButton);
            this.setSize(132, e + 1);
            this.bg.setPos(0, 1);
            this.bg.setSize(this.hook.size.x, e - 1);
            this.switchLeft = new sc.TextGui("\\i[list-up]");
            this.switchLeft.setPos(1, -16);
            this.addChildGui(this.switchLeft);
            this.switchRight = new sc.TextGui("\\i[list-down]");
            this.switchRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.switchRight.setPos(0,
                -16);
            this.addChildGui(this.switchRight);
            a = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.sectionText"), {
                font: sc.fontsystem.smallFont
            });
            a.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            a.setPos(0, -14);
            this.addChildGui(a);
            this.doStateTransition("HIDDEN", true)
        },
        activate: function() {
            if (!this.active) {
                this.active = true;
                sc.menu.buttonInteract.addParallelGroup(this.buttongroup);
                this.setActiveButton(this.currentButton);
                this.doStateTransition("DEFAULT", true);
                var a = sc.TROPHY_SECTIONS[this.category],
                    b = sc.trophies.trophies,
                    e = sc.menu.newUnlocks[sc.MENU_SUBMENU.TROPHY] || [],
                    f;
                for (f in b) {
                    var g = b[f];
                    if (g.track && g.category == this.category)
                        for (var h in a) a[h] == g.section && e.indexOf(f) != -1 && this.sectionButtons[h].overlay.activate()
                }
            }
        },
        deactivate: function() {
            if (this.active) {
                this.active = false;
                for (var a in this.sectionButtons) this.sectionButtons[a].overlay.deactivate();
                sc.menu.buttonInteract.removeParallelGroup(this.buttongroup);
                this.doStateTransition("HIDDEN", true)
            }
        },
        setActiveButton: function(a, b) {
            for (var e = 0; e < this.buttons.length; e++)(b ||
                e != a) && this.buttons[e].setPressed(false);
            this.prevButton = this.currentButton;
            this.currentButton = a;
            a >= 0 && this.buttons[this.currentButton].setPressed(true)
        },
        getCurrentSection: function() {
            return this.currentButton < 0 ? 0 : this.buttons[this.currentButton].data.section
        },
        getPreviousSection: function() {
            return this.prevButton < 0 ? 0 : this.buttons[this.prevButton].data.section
        },
        updateDrawables: function(a) {
            a.addColor("#7E7E7E", 0, 0, 132, 1);
            a.addColor("#7E7E7E", 0, -16, 132, 1);
            a.addColor("#7E7E7E", 0, this.hook.size.y - 1, 132,
                1)
        },
        addButton: function(a, b, e, f, g) {
            var h = new sc.ButtonGui(ig.lang.get("sc.gui.menu.trophies.sections." + a + "." + b), 130, true, sc.BUTTON_TYPE.DEFAULT, null, true);
            h.animateOnPress = true;
            h.setData({
                section: b,
                category: a,
                index: g
            });
            h.setPos(e, f);
            a = new sc.NewUnlockOverlay;
            a.setPos(4, 4);
            a.deactivate();
            h.addChildGui(a);
            h.overlay = a;
            this.addChildGui(h);
            this.buttongroup.addFocusGui(h, 0, g);
            this.buttons[g] = h;
            this.sectionButtons[b] = h
        }
    });
    var a = /\\c\[\d\]/g;
    sc.TrophyListEntry = ig.FocusGui.extend({
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
        gfx: new ig.Image("media/gui/menu.png"),
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 10,
            left: 8,
            top: 15,
            right: 8,
            bottom: 15,
            offsets: {
                "default": {
                    x: 0,
                    y: 114
                },
                focus: {
                    x: 45,
                    y: 114
                },
                hdefault: {
                    x: 170,
                    y: 50
                },
                hfocus: {
                    x: 213,
                    y: 50
                }
            }
        }),
        character: null,
        title: null,
        description: null,
        progress: null,
        icon: null,
        overlay: null,
        steamID: false,
        key: null,
        toggleState: false,
        triggered: false,
        init: function(a, b,
            e, f) {
            this.parent();
            this.setSize(295, 50);
            this.key = a;
            b = sc.trophies.getTrophy(a);
            this.triggered = e = sc.trophies.isTrophyUnlocked(a);
            this.steamID = b.steamID || false;
            var g = new ig.VarCondition("");
            !e && b.nameCond && g.setCondition(b.nameCond);
            var h = 0;
            e || (h = 4);
            var i = "\\c[4]" + ig.lang.get("sc.gui.menu.trophies.questionMarks") + "\\c[4]";
            this.title = new sc.TextGui(g.evaluate() ? this.getTextWithColor(b.name, h) : i);
            this.title.setPos(54, 1);
            this.addChildGui(this.title);
            !e && b.descCond ? g.setCondition(b.descCond) : g.setCondition("");
            i = "\\c[4]" + ig.lang.get("sc.gui.menu.trophies.questionMarksDesc") + "\\c[4]";
            this.description = new sc.TextGui(g.evaluate() ? this.getTextWithColor(b.description, h) : i, {
                font: sc.fontsystem.smallFont,
                maxWidth: 224,
                linePadding: -1
            });
            this.description.hook.transitions = {
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
            };
            this.description.setPos(66, 18);
            this.addChildGui(this.description);
            this.progress = new sc.TrophyProgress(b);
            this.progress.hook.transitions = {
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
            };
            this.progress.setPos(66, 20);
            this.addChildGui(this.progress);
            this.toggleProgress(f, true);
            this.icon = new sc.TrophyIconGraphic(b.icon, b.stars, b.points, e);
            this.addChildGui(this.icon);
            if (sc.menu.hasNewUnlockKey(sc.MENU_SUBMENU.TROPHY, a)) {
                this.overlay = new sc.NewUnlockOverlay;
                this.overlay.setPos(4, 3);
                this.overlay.activate();
                this.addChildGui(this.overlay)
            }
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a,
                this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? "hfocus" : "hdefault", 1);
            a.addGfx(this.gfx, 55, 18, 530, 208, 9, 10);
            this.steamID && !this.toggleState && a.addGfx(this.gfx, this.hook.size.x - 17, this.hook.size.y - 16, 624, 496, 13, 12).setAlpha(this.triggered ? 0.8 : 0.25)
        },
        toggleProgress: function(a, b) {
            this.toggleState = a;
            if (sc.trophies.getTrophy(this.key).progType != "NONE")
                if (a) {
                    this.progress.show(b);
                    this.description.doStateTransition("HIDDEN",
                        true)
                } else {
                    this.progress.hide(b);
                    this.description.doStateTransition("DEFAULT", true)
                }
            else {
                this.progress.hide(true);
                this.description.doStateTransition("DEFAULT", true)
            }
        },
        clearOverlay: function() {
            this.overlay && this.overlay.deactivate(true, true)
        },
        getTextWithColor: function(b, c) {
            b = ig.LangLabel.getText(b);
            c != 0 && (b = b.replace(a, ""));
            return "\\c[" + c + "]" + b + "\\c[0]"
        }
    });
    sc.TrophyProgress = ig.GuiElementBase.extend({
        numberGfx: new ig.Image("media/gui/basic.png"),
        bar: null,
        content: null,
        init: function(a) {
            this.parent("blue");
            this.setSize(222, 26);
            this.bar = new sc.TrophyProgressBar(a.triggered);
            this.bar.setPos(0, 2);
            this.addChildGui(this.bar);
            this.content = new ig.GuiElementBase("red");
            this.content.hook.transitions = {
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
            };
            this.content.setSize(222, 10);
            this.content.setPos(0, 11);
            this.content.setPivot(0, 10);
            this.addChildGui(this.content);
            this.content.doStateTransition("DEFAULT", true);
            this.setProgress(a)
        },
        show: function() {
            this.doStateTransition("DEFAULT", true)
        },
        hide: function() {
            this.doStateTransition("HIDDEN", true)
        },
        setProgress: function(a) {
            this.content.removeAllChildren();
            var b = a.stats,
                e = a.progType || (a.condition ? "CONDITION" : "VALUE");
            e == "VALUE" || e == "PERCENT" || e == "VALUE_HIDDEN" ? this.setProgressForValueType(a.triggered, e, b) : e == "TIME" ? this.setProgressForTimeType(a.triggered, e, b) : this.setProgressFallback(a.triggered)
        },
        setProgressFallback: function(a) {
            this.bar.setRatio(a ? 1 : 0);
            var b = new ig.ImageGui(this.numberGfx,
                96, !a ? 24 : 0, 8, 8);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.addChildGui(b);
            b = new sc.NumberGui(1, {
                size: sc.NUMBER_SIZE.NORMAL,
                dots: true
            });
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(-(b.hook.size.x / 2) - 5, 0);
            b.setNumber(a ? 1 : 0);
            this.content.addChildGui(b);
            var e = new sc.NumberGui(1, {
                size: sc.NUMBER_SIZE.NORMAL,
                dots: true
            });
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            e.setPos(e.hook.size.x / 2 + 5, 0);
            e.setNumber(1);
            this.content.addChildGui(e);
            if (!a) {
                b.setColor(sc.GUI_NUMBER_COLOR.GREY);
                e.setColor(sc.GUI_NUMBER_COLOR.GREY)
            }
        },
        setProgressForTimeType: function(a, b, e) {
            if (e.length == 0) return this.setProgressFallback(a);
            var e = e[0],
                f = (e.mapKey ? sc.stats.getMap(e.key, e.mapKey) : sc.stats.get(e.key)) || 0,
                b = parseFloat(ig.Event.getExpressionValue(e.value)),
                f = a ? b : Math.min(f, b);
            this.bar.setRatio(f / b);
            var g = new ig.ImageGui(this.numberGfx, 96, !a ? 24 : 0, 8, 8);
            g.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.addChildGui(g);
            g = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.NORMAL, 99, 2);
            g.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_TOP);
            g.setPos(-(g.hook.size.x / 2) - 5, 0);
            g.setTimeFromValue(f);
            g.stat = e;
            if (f < b) g.update = function() {
                this.setTimeFromValue((this.stat.mapKey ? sc.stats.getMap(this.stat.key, this.stat.mapKey) : sc.stats.get(this.stat.key)) || 0, true)
            };
            this.content.addChildGui(g);
            e = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.NORMAL, 99, 2);
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            e.setPos(e.hook.size.x / 2 + 5, 0);
            e.setTimeFromValue(b);
            this.content.addChildGui(e);
            if (!a) {
                g.setColor(sc.GUI_NUMBER_COLOR.GREY);
                e.setColor(sc.GUI_NUMBER_COLOR.GREY)
            }
        },
        setProgressForValueType: function(a, b, e) {
            for (var f = e.length, g = 0, h = 0; f--;) var i = e[f],
                j = parseFloat(ig.Event.getExpressionValue(i.value)),
                g = a ? g + j : g + Math.max(Math.min((i.mapKey ? sc.stats.getMap(i.key, i.mapKey) : sc.stats.get(i.key)) || 0, j), 0),
                h = h + j;
            g = Math.min(g, h);
            this.bar.setRatio(g / h);
            e = new ig.ImageGui(this.numberGfx, 96, !a ? 24 : 0, 8, 8);
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.addChildGui(e);
            if (b == "VALUE" || b == "VALUE_HIDDEN") {
                e = new sc.NumberGui(g || 1, {
                    size: sc.NUMBER_SIZE.NORMAL,
                    dots: true
                });
                e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                e.setPos(-(e.hook.size.x / 2) - 5, 0);
                e.setNumber(g);
                this.content.addChildGui(e);
                b = new sc.NumberGui(h, {
                    size: sc.NUMBER_SIZE.NORMAL,
                    dots: true,
                    scramble: b == "VALUE_HIDDEN" && !a
                });
                b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                b.setPos(b.hook.size.x / 2 + 5, 0);
                b.setNumber(h);
                this.content.addChildGui(b);
                if (!a) {
                    e.setColor(sc.GUI_NUMBER_COLOR.GREY);
                    b.setColor(sc.GUI_NUMBER_COLOR.GREY)
                }
            } else if (b == "PERCENT") {
                e = new sc.StatPercentNumber(100, {
                    smallPercent: true
                });
                e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                e.setNumber(g);
                e.setPos(-(e.hook.size.x / 2) - 5, 0);
                this.content.addChildGui(e);
                b = new sc.StatPercentNumber(100, {
                    smallPercent: true
                });
                b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                b.setNumber(h);
                b.setPos(b.hook.size.x / 2 + 5, 0);
                this.content.addChildGui(b);
                if (!a) {
                    e.setColor(sc.GUI_NUMBER_COLOR.GREY);
                    b.setColor(sc.GUI_NUMBER_COLOR.GREY)
                }
            }
        }
    });
    sc.TrophyProgressBar = ig.GuiElementBase.extend({
        backgroundPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 5,
            top: 5,
            right: 5,
            bottom: 0,
            offsets: {
                "default": {
                    x: 48,
                    y: 416
                }
            }
        }),
        ratio: 0,
        ratioSmall: 0,
        triggered: false,
        frame: 5,
        init: function(a) {
            this.parent();
            this.setSize(222, 5);
            this.ratio = 0;
            this.triggered = a
        },
        updateDrawables: function(a) {
            this.frame >= 1 && this.backgroundPatch.draw(a, this.hook.size.x, this.hook.size.y, "default");
            if (this.frame == 5) {
                a.addColor(this.triggered ? "#25b000" : "#156C00", 4, 0, this.ratio, 1);
                a.addColor(this.triggered ? "#25b000" : "#156C00", 3, 1, this.ratio, 1);
                a.addColor(this.triggered ? "#25b000" : "#156C00",
                    2, 2, this.ratio, 1);
                a.addColor(this.triggered ? "#25b000" : "#156C00", 1, 3, this.ratio, 1);
                a.addColor(this.triggered ? "#25b000" : "#156C00", 0, 4, this.ratio, 1)
            } else if (this.frame == 0) {
                a.addColor("#4d4d4d", 0, 4, this.hook.size.x, 1);
                a.addColor(this.triggered ? "#25b000" : "#156C00", 0, 4, this.ratioSmall, 1)
            }
        },
        setRatio: function(a) {
            this.ratio = Math.round(a * 218);
            this.ratioSmall = Math.round(a * 222)
        }
    });
    sc.TrophyIconGraphic = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        icons: new ig.Image("media/gui/feat-icons.png"),
        ribbon: null,
        icon: null,
        points: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        init: function(a, b, e, f) {
            this.parent();
            this.setSize(43, 43);
            this.setPos(8, 3);
            a = (sc.TROPHY_ICONS[a] || 0).index;
            f || (a = 0);
            this.icon = new ig.ImageGui(this.icons, a % 12 * 42, ~~(a / 12) * 42, 42, 42);
            this.addChildGui(this.icon);
            this.ribbon = new ig.ImageGui(this.gfx, 576, f ? 465 : 481, 51, 14);
            this.ribbon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.ribbon);
            this.points = new sc.NumberGui(e, {
                size: sc.NUMBER_SIZE.TINY,
                color: sc.GUI_NUMBER_COLOR.GREY
            });
            this.points.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.points.setNumber(e);
            this.points.setPos(1, 0);
            this.ribbon.addChildGui(this.points);
            this.addStars(b, f)
        },
        addStars: function(a, b) {
            var e = null;
            switch (sc.TROPHY_STARS[a]) {
                case sc.TROPHY_STARS["1"]:
                    e = this.createStar(b);
                    e.setPos(0, 0);
                    break;
                case sc.TROPHY_STARS["2"]:
                    e = this.createStar(b);
                    e.setPos(-5, 1);
                    e = this.createStar(b);
                    e.setPos(5, 1);
                    break;
                case sc.TROPHY_STARS["3"]:
                    e = this.createStar(b);
                    e.setPos(0, 0);
                    e = this.createStar(b);
                    e.setPos(-9, 1);
                    e = this.createStar(b);
                    e.setPos(9, 1);
                    break;
                case sc.TROPHY_STARS["4"]:
                    e = this.createStar(b);
                    e.setPos(-5, 1);
                    e = this.createStar(b);
                    e.setPos(5, 1);
                    e = this.createStar(b);
                    e.setPos(-14, 3);
                    e = this.createStar(b);
                    e.setPos(14, 3);
                    break;
                case sc.TROPHY_STARS["5"]:
                    e = this.createStar(b);
                    e.setPos(0, 0);
                    e = this.createStar(b);
                    e.setPos(-8, 1);
                    e = this.createStar(b);
                    e.setPos(8, 1);
                    e = this.createStar(b);
                    e.setPos(-15, 4);
                    e = this.createStar(b);
                    e.setPos(15, 4)
            }
        },
        createStar: function(a) {
            a = new ig.ImageGui(this.gfx, a ? 576 : 585, 496, 7, 6);
            a.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.ribbon.addChildGui(a);
            return a
        }
    })
});
ig.baked = !0;
