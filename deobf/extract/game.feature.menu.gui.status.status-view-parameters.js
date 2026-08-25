ig.module("game.feature.menu.gui.status.status-view-parameters").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
    sc.StatusViewParameters = ig.GuiElementBase.extend({
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
        container: null,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.container = new sc.StatusViewParametersContainer;
            this.addChildGui(this.container);
            this.hide(true)
        },
        show: function() {
            this.container.updateValues(true);
            this.container.show()
        },
        hide: function(b) {
            this.container.hide(b)
        },
        updatePage: function() {
            this.container.updateValues()
        }
    });
    sc.StatusViewParametersContainer = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 271.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        bg: null,
        list: null,
        entries: {},
        init: function() {
            this.parent(sc.MenuPanelType.TOP_LEFT_EDGE);
            this.setSize(518, 213);
            this.setPos(25, 59);
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 11);
            this.bg.setSize(this.hook.size.x, 196);
            this.addChildGui(this.bg);
            this.list = new sc.StatsScrollPane(2);
            this.list.onCheckScrollable = function() {
                return !sc.menu.helpMenuOpen
            };
            this.list.setPos(0, 11);
            this.list.setSize(this.hook.size.x, 196);
            this.addChildGui(this.list);
            var b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.param"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(8, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.base"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(89, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.equip"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(132, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.skills"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(174, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.info"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(213,
                4);
            this.addChildGui(b);
            this.createParameterLines()
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function(b) {
            this.doStateTransition("HIDDEN", b)
        },
        updateValues: function(b) {
            var a = sc.model.player,
                d = a.baseParams,
                c = a.equipParams,
                a = a.elementConfigs[sc.menu.statusElement].baseParams;
            this.updateLine("maxhp", "hp", d, c, a, b);
            this.updateLine("atk", "attack", d, c, a, b);
            this.updateLine("def", "defense", d, c, a, b);
            this.updateLine("foc", "focus", d, c, a, b);
            this.updateLine("heat", "elemFactor", d, c, a, b);
            this.updateLine("cold",
                "elemFactor", d, c, a, b);
            this.updateLine("shock", "elemFactor", d, c, a, b);
            this.updateLine("wave", "elemFactor", d, c, a, b)
        },
        updateLine: function(b, a, d, c, e, f) {
            var b = this.entries[b],
                g = 0,
                h = 0,
                i = 0;
            if (b.usePercent) {
                i = b.lineID - 1;
                g = Math.round(-(d[a][i] - 1) * 100);
                h = Math.round((c[a][i] - 1) * 100);
                i = Math.round(-(e[a][i] - 1) * 100)
            } else {
                g = d[a];
                h = c[a];
                i = e[a]
            }
            b.updateValues(g, h, i, f, h - g, i - h, true)
        },
        createParameterLines: function() {
            this.createLine("maxhp", 0, 0, false);
            this.createLine("atk", 0, 1, false, null, null, true);
            this.createLine("def",
                0, 2, false, null, null, true);
            this.createLine("foc", 0, 3, false, null, 0, true);
            this.createLine("res", 1, 4, true, "heat");
            this.createLine("res", 2, 5, true, "cold");
            this.createLine("res", 3, 6, true, "shock");
            this.createLine("res", 4, 7, true, "wave")
        },
        createLine: function(b, a, d, c, e, f, g) {
            var h = ig.lang.get("sc.gui.menu.equip." + b),
                i = ig.lang.get("sc.gui.menu.equip.descriptions." + (e || b)),
                a = new sc.StatusParamBar(h, i, 513, a, d, c, null, null, g);
            if (f) a.hook.size.y = a.hook.size.y + f;
            this.entries[e || b] = a;
            this.list.addEntry(a, 0)
        }
    })
});
ig.baked = !0;
