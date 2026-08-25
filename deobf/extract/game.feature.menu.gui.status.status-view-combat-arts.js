ig.module("game.feature.menu.gui.status.status-view-combat-arts").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
    var b = {
        THROW: {
            actionKey: "THROW_SPECIAL",
            icon: 0
        },
        ATTACK: {
            actionKey: "ATTACK_SPECIAL",
            icon: 1
        },
        DASH: {
            actionKey: "DASH_SPECIAL",
            icon: 2
        },
        GUARD: {
            actionKey: "GUARD_SPECIAL",
            icon: 3
        }
    };
    sc.StatusViewCombatArts = ig.GuiElementBase.extend({
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
            this.container = new sc.StatusViewCombatArtsContainer;
            this.addChildGui(this.container);
            this.hide(true)
        },
        show: function() {
            this.container.updateValues(true);
            this.container.show()
        },
        hide: function(a) {
            this.container.hide(a)
        },
        updatePage: function(a) {
            this.container.updateValues(false, a)
        }
    });
    sc.StatusViewCombatArtsContainer = sc.MenuPanel.extend({
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
            this.list.setSize(this.hook.size.x,
                196);
            this.addChildGui(this.list);
            this.createArts(false)
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
        },
        updateValues: function(a) {
            this.createArts(a)
        },
        createArts: function(a) {
            var d = a ? this.list.getScrollY() : 0;
            this.list.clear(true);
            for (var c in b) this.addType(b[c]);
            a && this.list.scrollY(d, true)
        },
        addType: function(a) {
            var b = this.getMaxArts(sc.menu.statusElement, a);
            if (b > 0) {
                var c = new sc.StatusViewCombatArtsLine(a.actionKey, a.icon);
                this.list.addEntry(c,
                    0);
                this.addArts(a.actionKey, sc.menu.statusElement, b)
            }
        },
        addArts: function(a, b, c) {
            for (var e = 0; e < 3; e++) {
                var f = sc.model.player.getActiveCombatArt(b, sc.PLAYER_ACTION[a + (e + 1)]);
                if (f)
                    if (f = sc.model.player.getCombatArt(b, f.name)) {
                        f = new sc.StatusViewCombatArtsEntry(e + 1, f);
                        this.list.addEntry(f);
                        if (e != c - 1) {
                            f = new sc.StatusViewCombatArtsLineSingle;
                            this.list.addEntry(f)
                        }
                    }
            }
        },
        getMaxArts: function(a, b) {
            for (var c = 0, e = b.actionKey; c < 3 && sc.model.player.getActionByElement(a, sc.PLAYER_ACTION[e + (c + 1)]);) c++;
            return c
        }
    });
    sc.StatusViewCombatArtsEntry =
        ig.GuiElementBase.extend({
            skillIcons: new ig.Image("media/gui/circuit-icons.png"),
            icon: null,
            level: null,
            sp: null,
            dmgType: null,
            stunType: null,
            condition: null,
            name: null,
            description: null,
            info: null,
            init: function(a, b) {
                this.parent();
                this.setSize(512, 41);
                this.info = b;
                this.addText("lvl", 9, 2);
                this.icon = new ig.ImageGui(this.skillIcons, b.icon % 10 * 24, Math.floor(b.icon / 10) * 24, 24, 24);
                this.icon.setPos(3, 12);
                this.addChildGui(this.icon);
                this.level = new sc.NumberGui(9, {
                    size: sc.NUMBER_SIZE.LARGE
                });
                this.level.setNumber(a);
                this.level.setPos(25,
                    3);
                this.addChildGui(this.level);
                this.name = new sc.TextGui("\\c[3]" + b.name + "\\c[0]");
                this.name.setPos(40, -1);
                this.addChildGui(this.name);
                this.description = new sc.TextGui(b.description, {
                    maxWidth: 460,
                    font: sc.fontsystem.smallFont,
                    linePadding: -3
                });
                this.description.setPos(40, 17);
                this.addChildGui(this.description);
                var c = 168,
                    c = c + (this.addText("sp", c, 2).x + 3);
                this.sp = new sc.NumberGui(9);
                this.sp.setNumber(sc.PLAYER_SP_COST[a - 1]);
                this.sp.setPos(c, 3);
                this.addChildGui(this.sp);
                c = c + 13;
                c = c + (this.addText("dmgType",
                    c, 2).x + 3);
                this.dmgType = new sc.TextGui(this.getDamageType(b.dmgType));
                this.dmgType.setPos(c, -1);
                this.addChildGui(this.dmgType);
                c = c + (this.dmgType.hook.size.x + 5);
                if (b.stunType || b.status && sc.menu.statusElement != 0) c = c + (this.addText("effects", c, 2).x + 2);
                if (b.stunType) {
                    this.stunType = new sc.TextGui(this.getStunType(b.stunType));
                    this.stunType.setPos(c, -1);
                    this.addChildGui(this.stunType);
                    c = c + (this.stunType.hook.size.x + 6)
                }
                if (b.status && sc.menu.statusElement != 0) {
                    this.condition = new sc.TextGui(this.getConditionType(b.status));
                    this.condition.setPos(c, -1);
                    this.addChildGui(this.condition)
                }
            },
            addText: function(a, b, c) {
                a = new sc.TextGui("\\c[4]" + ig.lang.get("sc.gui.menu.status." + a) + "\\c[0]", {
                    font: sc.fontsystem.tinyFont
                });
                a.setPos(b, c);
                this.addChildGui(a);
                return a.hook.size
            },
            getDamageType: function(a) {
                return ig.lang.get("sc.gui.menu.status.damageTypes")[a - 1]
            },
            getStunType: function(a) {
                var b = ig.lang.get("sc.gui.menu.status.stunTypes");
                return "\\i[status-stun-" + a + "]" + b[a - 1]
            },
            getConditionType: function() {
                var a = ig.lang.get("sc.gui.menu.status.conditions");
                return "\\i[status-cond-" + sc.menu.statusElement + "]" + ig.lang.get("sc.gui.menu.status.inflicts") + " " + a[sc.menu.statusElement]
            }
        });
    sc.StatusViewCombatArtsLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        icon: 0,
        init: function(a, b) {
            this.parent();
            this.setSize(515, 11);
            this.icon = b || 0;
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.status.artType." + a), {
                font: sc.fontsystem.tinyFont
            });
            this.text.setPos(13, 3);
            this.addChildGui(this.text)
        },
        updateDrawables: function(a) {
            a.addColor("#C7C7C7",
                0, 10, this.hook.size.x, 1);
            a.addGfx(this.gfx, 0, 0, 640, 432 + this.icon * 12, 11, 11)
        }
    });
    sc.StatusViewCombatArtsLineSingle = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        init: function() {
            this.parent();
            this.setSize(502, 1)
        },
        updateDrawables: function(a) {
            a.addColor("#545454", 0, 0, this.hook.size.x - 88, 1);
            a.addGfx(this.gfx, this.hook.size.x - 88, 0, 576, 511, 88, 1)
        }
    })
});
ig.baked = !0;
