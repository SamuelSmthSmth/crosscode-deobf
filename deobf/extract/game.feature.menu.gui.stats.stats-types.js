ig.module("game.feature.menu.gui.stats.stats-types").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.save.save-misc", "game.feature.menu.gui.stats.stats-gui-builds", "game.feature.menu.gui.stats.stats-misc", "game.feature.menu.gui.synop.synop-misc").defines(function() {
    function b(a) {
        for (var b = ig.currentLang + "", b = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", c = /(\d+)(\d{3})/, a = a + ""; c.test(a);) a =
            a.replace(c, "$1" + b + "$2");
        return a
    }
    sc.STATS_ENTRY_TYPE = {};
    sc.StatsBaseEntryGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        key: null,
        keyGui: null,
        valueGui: null,
        init: function(a, b, c) {
            this.parent();
            this.setSize(c, 20);
            this.key = a;
            this.keyGui = new sc.TextGui("");
            this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.keyGui.setPos(5, 0);
            this.addChildGui(this.keyGui);
            c = null;
            if (b.displayName) c = b.displayName;
            else(c = ig.lang.get("sc.gui.menu.stats.keys")[a]) || (c = "\\c[1]~ " + a + "\\c[0]");
            this.keyGui.setText(c);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X)
        },
        updateDrawables: function(a) {
            if (this.keyGui && this.valueGui) {
                var b = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
                    c = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 10,
                    c = Math.floor(c / 4) * 4;
                a.addPattern(this.constructor.PATTERN, b, 12, 0, 0, c, 4)
            }
        }
    });
    sc.STATS_ENTRY_TYPE.Time = sc.StatsBaseEntryGui.extend({
        stat: null,
        map: null,
        value: null,
        updateTime: false,
        init: function(a, b, c) {
            this.parent(a, b, c);
            this.stat = b.stat || a;
            this.map = b.map || null;
            this.updateTime = b.update || false;
            this.valueGui = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.TEXT, b.max, b.leading, b.transitionTime, b.millis, b.hideHours);
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(5, 2);
            this.addChildGui(this.valueGui);
            a = 0;
            if (b.value) {
                this.value = b.value;
                a = this.value()
            } else a = sc.stats.getMap(this.map, this.stat);
            this.valueGui.second.setNumber(Math.floor(a) % 60, true);
            this.valueGui.minute.setNumber(Math.floor(a /
                60) % 60, true);
            this.valueGui.hour.setNumber(Math.floor(a / 60 / 60), true)
        },
        update: function() {
            if (this.updateTime && this.map && this.stat) {
                var a = 0,
                    a = this.value ? this.value() : sc.stats.getMap(this.map, this.stat);
                this.valueGui.second.setNumber(Math.floor(a) % 60, true);
                this.valueGui.minute.setNumber(Math.floor(a / 60) % 60, true);
                this.valueGui.hour.setNumber(Math.floor(a / 60 / 60), true)
            }
        },
        setTime: function(a, b) {
            this.valueGui.setTimeFromValue(a, b)
        }
    });
    sc.STATS_ENTRY_TYPE.Percent = sc.StatsBaseEntryGui.extend({
        init: function(a, b,
            c) {
            this.parent(a, b, c);
            var c = 0,
                c = b.calc ? b.calc() : b.map ? sc.stats.getMap(b.map, b.stat || a) || 0 : sc.stats.get(b.stat || a) || 0,
                e = null;
            if (b.displayName) e = b.displayName;
            else(e = ig.lang.get("sc.gui.menu.stats.keys")[a]) || (e = "\\c[1]~ " + e + "\\c[0]");
            this.valueGui = new sc.StatPercentNumber(null, {
                size: sc.NUMBER_SIZE.TEXT,
                leadingZeros: b.frontLeading || 1,
                scramble: c >= 1 ? false : b.scramble
            });
            if (b.highlight)
                if (b.highlight.min != void 0) {
                    if (c >= b.highlight.min) {
                        this.valueGui.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
                        this.keyGui.setText("\\c[3]" +
                            e + "\\c[0]")
                    }
                } else {
                    this.valueGui.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
                    this.keyGui.setText("\\c[3]" + e + "\\c[0]")
                } this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(5, 0);
            this.valueGui.setNumber(Math.min(100, c));
            this.addChildGui(this.valueGui)
        }
    });
    sc.STATS_ENTRY_TYPE.KeyValue = sc.StatsBaseEntryGui.extend({
        init: function(a, d, c) {
            this.parent(a, d, c);
            var c = d.stat || null,
                e = d.map || null,
                f = 0,
                f = d.value ? typeof d.value == "function" ? d.value() || 0 : d.value || 0 : e ? sc.stats.getMap(e, c || a) ||
                0 : sc.stats.get(c || a) || 0;
            d.add && (f = f + (d.add || 0));
            d.hideNameIfNull && f == 0 && this.keyGui.setText("???????????????");
            if (d.asNumber) {
                this.valueGui = new sc.NumberGui(d.maxValue || null, {
                    leadingZeros: d.leadingZeros || 0,
                    size: d.numberSize || sc.NUMBER_SIZE.TEXT,
                    signed: f == 0,
                    dots: d.numberDots,
                    transitionTime: d.transitionTime || 0
                });
                this.valueGui.setNumber(f)
            } else this.valueGui = new sc.TextGui(b(f) + (d.postfix ? d.postfix() : ""));
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(5, 0);
            this.addChildGui(this.valueGui)
        },
        setValue: function(a, d, c) {
            this.valueGui.setText((d ? b(a) : a) + (c ? c : ""))
        },
        setValueAsNumber: function(a, b) {
            this.valueGui.setMaxNumber(a || 5);
            this.valueGui.setNumber(a, b)
        }
    });
    sc.STATS_ENTRY_TYPE.KeyCurMax = sc.StatsBaseEntryGui.extend({
        init: function(a, d, c) {
            this.parent(a, d, c);
            var e = d.stat || null,
                f = d.map || null,
                c = 0,
                c = d.value ? typeof d.value == "function" ? d.value() || 0 : d.value || 0 : f ? sc.stats.getMap(f, e || a) || 0 : sc.stats.get(e || a) || 0,
                a = d.max ? d.max() : 0,
                e = b(Math.min(a, c + (d.add || 0))),
                f = b(a);
            d.hide && d.hide(c, a) && (f = "???");
            var g =
                null,
                g = d.highlight ? c >= a ? "\\c[3]" + e + "\\i[slash-highlight]" + f + "\\c[0]" : e + "\\i[slash]" + f : e + "\\i[slash]" + f;
            this.valueGui = new sc.TextGui(g);
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(5, 0);
            this.addChildGui(this.valueGui)
        }
    });
    sc.STATS_ENTRY_TYPE.KeyValuePercent = sc.StatsBaseEntryGui.extend({
        numberGui: null,
        percentGui: null,
        init: function(a, d, c) {
            this.parent(a, d, c);
            var e = d.stat || null,
                f = d.map || null,
                c = 0,
                c = d.value ? typeof d.value == "function" ? d.value() || 0 : d.value || 0 : f ? sc.stats.getMap(f,
                    e || a) || 0 : sc.stats.get(e || a) || 0;
            this.numberGui = new sc.TextGui(b(c) + "\\i[arrow-percent]");
            this.numberGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            e = 0;
            if (d.calc) e = d.calc();
            else e = (e = d.maxMap ? sc.stats.getMap(d.maxMap, d.maxStat || a) || 0 : sc.stats.get(d.maxStat || a) || 0) ? Math.min(1, c / e) : 0;
            this.percentGui = new sc.StatPercentNumber(null, {
                size: sc.NUMBER_SIZE.TEXT,
                leadingZeros: 2
            });
            this.percentGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.percentGui.setNumber(e);
            this.valueGui = new ig.GuiElementBase;
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.valueGui.setPos(5, 0);
            this.addChildGui(this.valueGui);
            this.valueGui.addChildGui(this.numberGui);
            this.valueGui.addChildGui(this.percentGui);
            this.valueGui.setSize(this.numberGui.hook.size.x + this.percentGui.hook.size.x + 2, 20)
        }
    });
    sc.STATS_ENTRY_TYPE.Separator = ig.GuiElementBase.extend({
        separatorText: null,
        init: function(a, b, c) {
            this.parent();
            this.setSize(c, 14);
            if (b.noText) {
                a = new ig.ColorGui("#545454", c + 5, 1);
                a.setPos(0, 0);
                this.addChildGui(a);
                this.hook.size.y = 1
            } else {
                this.separatorText = new sc.TextGui(ig.lang.get("sc.gui.menu.stats.groups." + (b.group || a)), {
                    font: sc.fontsystem.tinyFont
                });
                this.separatorText.setPos(2, 3);
                this.addChildGui(this.separatorText);
                a = new ig.ColorGui("#545454", c + 5, 1);
                a.setPos(0, 11);
                this.addChildGui(a)
            }
        }
    });
    sc.STATS_ENTRY_TYPE.Logs = ig.GuiElementBase.extend({
        init: function(a, b, c) {
            this.parent();
            this.setSize(c, 20);
            for (var a = sc.menu.logEntries, b = a.length, c = 0, e = null, e = null, f = 0; b--;) {
                var e = a[b],
                    g = sc.LOG_GUI_TYPE[e.type];
                if (g &&
                    (!g.isAvailable || g.isAvailable(e))) {
                    c++;
                    e = new sc.LOG_GUI_TYPE[e.type](e);
                    e.setPos(3, f);
                    this.addChildGui(e);
                    f = f + e.hook.size.y;
                    if (c >= 50) break
                }
            }
            this.hook.size.y = f
        }
    })
});
ig.baked = !0;
