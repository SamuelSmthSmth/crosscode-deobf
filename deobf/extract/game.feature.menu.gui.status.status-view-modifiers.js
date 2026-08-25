ig.module("game.feature.menu.gui.status.status-view-modifiers").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
    sc.StatusViewModifiers = ig.GuiElementBase.extend({
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
            this.container = new sc.StatusViewModifiersContainer;
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
        updatePage: function(b) {
            this.container.updateValues(false, b)
        }
    });
    sc.StatusViewModifiersContainer = sc.MenuPanel.extend({
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
            var b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.modifierName"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(8, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.equip"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(89, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.skills"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(132, 4);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.info"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(169, 4);
            this.addChildGui(b);
            this.createParameterLines()
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function(b) {
            this.doStateTransition("HIDDEN",
                b)
        },
        updateValues: function(b, a) {
            if (a) {
                var d = sc.model.player.equipModifiers,
                    c = sc.model.player.elementConfigs[sc.menu.statusElement].modifiers,
                    e;
                for (e in this.entries) this.updateLine(e, d, c, false)
            } else this.createParameterLines(b)
        },
        updateLine: function(b, a, d, c) {
            var e = this.entries[b],
                f = 0,
                g = 0,
                f = Math.round(((a[b] || 1) - 1) * 100),
                g = Math.round((d[b] || 0) * 100);
            e.hook.pos.y >= 194 && (c = true);
            e.updateValues(f, g, 0, c, g - f, 0, true)
        },
        createParameterLines: function(b) {
            var a = sc.model.player.elementConfigs[sc.menu.statusElement].modifiers,
                d = b ? this.list.getScrollY() : 0;
            this.list.clear(true);
            var c = sc.model.player.equipModifiers,
                e = null,
                f, g = false,
                h;
            for (h in a)
                if (a[h] != 0) {
                    f = (e = sc.MODIFIERS[h]) ? e.icon : 50;
                    g = e ? e.noPercent : false;
                    this.createLine(h, 5, f, g, e.noPercent);
                    this.updateLine(h, c, a, b)
                } b && this.list.scrollY(d, true)
        },
        createLine: function(b, a, d, c, e) {
            var f = ig.lang.get("sc.gui.menu.equip.modifier." + b),
                g = ig.lang.get("sc.gui.menu.equip.descriptions." + b),
                a = new sc.StatusParamBar(f, g, 513, a, d, true, true, e);
            c && a.hideValues(true);
            this.entries[b] = a;
            this.list.addEntry(a,
                0);
            return a
        }
    })
});
ig.baked = !0;
