ig.module("game.feature.menu.gui.help.help-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.HELP_ICON_TYPE = {
        INFO: 0
    };
    sc.HelpAnnoBase = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        icon: 0,
        flipX: false,
        flipY: false,
        init: function(b, a, d, c) {
            this.parent();
            this.setSize(d || 13, c || 13);
            this.icon = b || 0;
            this.flipX = a.flipIconX || false;
            this.flipY = a.flipIconY || false
        },
        updateDrawables: function(b) {
            var a = this.hook;
            b.addGfx(this.gfx,
                -1, -1, 642 + (this.focus ? 7 : 0), 160 + (a.size.y <= 11 ? 8 : 0), 6, 6);
            b.addGfx(this.gfx, a.size.x - 5, -1, 642 + (this.focus ? 7 : 0), 160 + (a.size.y <= 11 ? 8 : 0), 6, 6, true);
            b.addGfx(this.gfx, a.size.x - 5, a.size.y - 5, 642 + (this.focus ? 7 : 0), 160 + (a.size.y <= 11 ? 8 : 0), 6, 6, true, true);
            b.addGfx(this.gfx, -1, a.size.y - 5, 642 + (this.focus ? 7 : 0), 160 + (a.size.y <= 11 ? 8 : 0), 6, 6, false, true)
        }
    });
    sc.HELP_ANNO_TYPE = {};
    sc.HELP_ANNO_TYPE.INFO = sc.HelpAnnoBase.extend({
        init: function(b) {
            this.parent(sc.HELP_ICON_TYPE.INFO, b)
        }
    });
    sc.HelpInfoBox = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        title: null,
        description: null,
        line: null,
        content: null,
        init: function() {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE_DARKER);
            this.setSize(200, 13);
            this.title = new sc.TextGui("");
            this.title.hook.transitions = {
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
            this.title.setPos(5, 1);
            this.addChildGui(this.title);
            this.description =
                new sc.TextGui("", {
                    font: sc.fontsystem.smallFont,
                    maxWidth: 190
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
            this.description.setPos(5, 18);
            this.addChildGui(this.description);
            this.line = new ig.ColorGui("#545454", 196, 1);
            this.line.hook.transitions = {
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
            this.line.setPos(2,
                17);
            this.addChildGui(this.line);
            this.content = new ig.GuiElementBase;
            this.addChildGui(this.content);
            this.doStateTransition("HIDDEN", true);
            this.hook.anim.targetState = null
        },
        show: function(b, a, d, c, e) {
            var f = b.hook.pos,
                g = f.x + b.hook.size.x + 1;
            g >= ig.system.width / 2 + 85 && (g = f.x - 200 - 1);
            var h = f.y;
            b.hook.size.y < 30 && (h = h + b.hook.size.y);
            var b = 200,
                i = 100;
            this.content.removeAllChildren();
            if (e == "buff") {
                this.content.hook.size.x = 200;
                this.title.doStateTransition("HIDDEN", true);
                this.description.doStateTransition("HIDDEN", true);
                this.line.doStateTransition("HIDDEN", true);
                (a = sc.inventory.getItem(sc.menu.buffID)) || (a = sc.inventory.getItem(sc.trade.buffID));
                d = a.stats;
                c = d.length;
                for (a = 0; c--;) {
                    e = sc.STAT_CHANGE_SETTINGS[d[c]];
                    if (e.type.key != "heal") {
                        e = new sc.HelpBuffEntry(e, c, d.length);
                        e.setPos(0, a);
                        a = a + e.hook.size.y;
                        this.content.addChildGui(e)
                    }
                }
                b = 398;
                i = a
            } else if (e == "levels") {
                this.description.doStateTransition("HIDDEN", true);
                this.title.doStateTransition("DEFAULT", true);
                this.line.doStateTransition("DEFAULT", true);
                this.title.setText("\\c[3]" +
                    this.getText(a, c) + "\\c[0]");
                this.content.setPos(0, 18);
                this.content.hook.size.x = 150;
                a = 0;
                d = new sc.HelpLevelEntry("green", sc.FONT_COLORS.GREEN);
                d.setPos(5, a);
                this.content.addChildGui(d);
                a = a + (d.hook.size.y + 1);
                d = new sc.HelpLevelEntry("white", 0);
                d.setPos(5, a);
                this.content.addChildGui(d);
                a = a + (d.hook.size.y + 1);
                d = new sc.HelpLevelEntry("orange", sc.FONT_COLORS.PURPLE);
                d.setPos(5, a);
                this.content.addChildGui(d);
                a = a + (d.hook.size.y + 1);
                d = new sc.HelpLevelEntry("red", sc.FONT_COLORS.RED);
                d.setPos(5, a);
                this.content.addChildGui(d);
                a = a + (d.hook.size.y + 1);
                b = 204;
                i = a + 20;
                g = g - 4
            } else {
                this.title.doStateTransition("DEFAULT", true);
                this.description.doStateTransition("DEFAULT", true);
                this.line.doStateTransition("DEFAULT", true);
                this.title.setText("\\c[3]" + this.getText(a, c) + "\\c[0]");
                this.description.setText(this.getText(d, c));
                i = 18 + this.description.hook.size.y + 4
            }
            if (i != this.hook.size.y || b != this.hook.size.x) this.hook.currentStateName == "HIDDEN" && this.hook.hasTransition() ? this.doSizeTransition(b, i, 0.2, KEY_SPLINES.EASE) : this.setSize(b, i);
            h + i >=
                310 && (h = f.y - i);
            this.hook.currentStateName == "HIDDEN" && this.hook.hasTransition() ? this.doPosTranstition(g, h, 0.2, KEY_SPLINES.EASE) : this.hook.currentStateName == "DEFAULT" ? this.doPosTranstition(g, h, 0.2, KEY_SPLINES.EASE) : this.setPos(g, h);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN", false, false, null, 0.1)
        },
        getText: function(b, a) {
            return typeof b == "function" ? b(a) : ig.lang.get(b)
        }
    });
    sc.HelpLevelEntry = ig.GuiElementBase.extend({
        color: null,
        desc: null,
        init: function(b, a) {
            this.parent();
            this.color = new sc.TextGui("\\c[" + a + "]" + ig.lang.get("sc.gui.menu.help.equip.colors." + b) + "\\c[0]:", {
                font: sc.fontsystem.smallFont
            });
            this.addChildGui(this.color);
            this.desc = new sc.TextGui(ig.lang.get("sc.gui.menu.help.equip.colorDesc." + b), {
                font: sc.fontsystem.smallFont,
                maxWidth: 160
            });
            this.desc.setPos(35, 0);
            this.addChildGui(this.desc);
            this.hook.size.y = Math.max(this.desc.hook.size.y, this.color.hook.size.y)
        }
    });
    sc.HelpBuffEntry = ig.GuiElementBase.extend({
        icon: null,
        statName: null,
        description: null,
        init: function(b,
            a) {
            this.parent();
            this.icon = new sc.TextGui("\\i[" + b.icon + "]\\i[" + b.grade + "]", {
                font: sc.fontsystem.tinyFont
            });
            this.icon.setPos(2, 2);
            this.addChildGui(this.icon);
            var d = this.getStatName(b.type, b.change),
                d = b.negative ? d + (" \\c[1]- " + -1 * this.getStatValue(b.type, b.value, b.change) + "%\\c[0]") : d + (" \\c[2]+ " + this.getStatValue(b.type, b.value, b.change) + "%\\c[0]");
            this.statName = new sc.TextGui(d, {
                font: sc.fontsystem.smallFont
            });
            this.statName.setPos(19, 0);
            this.addChildGui(this.statName);
            d = new sc.TextGui("\\i[insetArrow]", {
                font: sc.fontsystem.smallFont
            });
            d.setPos(2, 12);
            this.addChildGui(d);
            this.description = new sc.TextGui(this.getStatName(b.type, b.change, true), {
                font: sc.fontsystem.smallFont,
                maxWidth: 378
            });
            this.description.setPos(19, 11);
            this.addChildGui(this.description);
            this.setSize(400, 11 + this.description.hook.size.y);
            if (a != 0) {
                d = new ig.ColorGui("#545454", 400, 1);
                d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.addChildGui(d);
                this.hook.size.y = this.hook.size.y + 1
            }
        },
        getStatName: function(b, a, d) {
            var c = "param";
            if (a ==
                sc.STAT_CHANGE_TYPE.STATS)
                if (b.key == "elemFactor") switch (b.index) {
                    case 0:
                        c = "heat";
                        break;
                    case 1:
                        c = "cold";
                        break;
                    case 2:
                        c = "shock";
                        break;
                    case 3:
                        c = "wave"
                } else b.key == "hp" ? c = "maxhp" : b.key == "attack" ? c = "atk" : b.key == "defense" ? c = "def" : b.key == "focus" && (c = "foc");
                else if (a == sc.STAT_CHANGE_TYPE.MODIFIER) c = (!d ? "modifier." : "") + b.key;
            else if (a == sc.STAT_CHANGE_TYPE.HEAL) return "ERROR ERROR";
            return ig.lang.get("sc.gui.menu.equip." + (d ? "descriptions." : "") + c)
        },
        getStatValue: function(b, a, d) {
            d == sc.STAT_CHANGE_TYPE.STATS && (a =
                b.key == "elemFactor" ? (a - 1) * -1 : a - 1);
            return Math.round(a * 100)
        }
    })
});
ig.baked = !0;
