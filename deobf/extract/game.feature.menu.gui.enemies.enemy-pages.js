ig.module("game.feature.menu.gui.enemies.enemy-pages").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.combat.gui.enemy-display-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.misc").defines(function() {
    ig.perf.fullEnemyFibula = false;
    var b = [1, 1, 1, 1];
    sc.EnemyPageGeneralInfo = ig.GuiElementBase.extend({
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
        location: null,
        kills: null,
        display: null,
        baseHp: null,
        baseAttack: null,
        baseDefense: null,
        baseFocus: null,
        resistance: null,
        expMoney: null,
        drops: null,
        init: function() {
            this.parent();
            this.setSize(269, 216);
            this.location = new sc.EnemyLocation;
            this.location.setPos(2, 0);
            this.addChildGui(this.location);
            this.kills = new sc.EnemyKillCount;
            this.addChildGui(this.kills);
            this.display = new sc.EnemyDisplayBox;
            this.display.setPos(0, 14);
            this.addChildGui(this.display);
            var a = 15;
            this.baseHp = this.createStatusLine("maxhp", 0, 0, a);
            a = a +
                14;
            this.baseAttack = this.createStatusLine("atk", 1, 0, a);
            a = a + 14;
            this.baseDefense = this.createStatusLine("def", 2, 0, a);
            a = a + 14;
            this.baseFocus = this.createStatusLine("foc", 3, 0, a);
            a = a + 23;
            this.resistance = new sc.EnemyResistence;
            this.resistance.setPos(0, a);
            this.addChildGui(this.resistance);
            this.expMoney = new sc.EnemyExpMoney;
            this.expMoney.setPos(0, this.display.hook.size.y + 3 + 14);
            this.addChildGui(this.expMoney);
            this.drops = new sc.EnemyDrops;
            this.addChildGui(this.drops);
            this.setData();
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.enemy.titles.res",
                    description: "sc.gui.menu.help.enemy.description.res"
                },
                offset: {
                    x: -2,
                    y: 76
                },
                size: {
                    x: 121,
                    y: 63
                },
                index: {
                    x: 0,
                    y: 5
                }
            };
            this.annotation[1] = {
                content: {
                    title: "sc.gui.menu.help.enemy.titles.view",
                    description: "sc.gui.menu.help.enemy.description.view"
                },
                offset: {
                    x: 121,
                    y: 13
                },
                size: {
                    x: 149,
                    y: 126
                },
                index: {
                    x: 1,
                    y: 1
                }
            };
            this.annotation[2] = {
                content: {
                    title: "sc.gui.menu.help.enemy.titles.rewards",
                    description: "sc.gui.menu.help.enemy.description.rewards"
                },
                offset: {
                    x: -2,
                    y: 142
                },
                size: {
                    x: 272,
                    y: 73
                },
                index: {
                    x: 0,
                    y: 6
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        setData: function(a, d, f, g) {
            if (d) {
                this.display.setEnemy(a, true, d.anim, d.extra, g);
                var h = d.params,
                    i = d.credit,
                    j = d.level;
                if (g && sc.combat.canShowBoostedEntry(a, d.boss)) {
                    j = ig.perf.fullEnemyFibula ? sc.MIN_BOOSTER_LEVEL : d.boostedLevel || sc.MIN_BOOSTER_LEVEL;
                    h = sc.EnemyLevelScaling.adaptParams(h, d.level, j);
                    i = sc.EnemyLevelScaling.adaptCredits(i, d.level, j)
                }
                this.baseHp.setNumber(h.hp, f);
                this.baseAttack.setNumber(h.attack, f);
                this.baseDefense.setNumber(h.defense,
                    f);
                this.baseFocus.setNumber(h.focus, f);
                this.resistance.setResistance(h.elemFactor || b, f);
                this.expMoney.setValues(sc.model.player.getRawExpGain(d.exp || 0, j, sc.LEVEL_CURVES.REGULAR), i || 0, f);
                this.drops.setDrops(d.itemDrops, f, g);
                this.location.setLocation(d.area, f);
                this.kills.setKills(sc.stats.getMap("combat", "kill" + a), f);
                this.baseHp.setScrambleNumbers(h.hp > 9999999)
            } else {
                this.display.setEnemy();
                this.baseHp.hide();
                this.baseAttack.hide();
                this.baseDefense.hide();
                this.baseFocus.hide();
                this.resistance.hide();
                this.expMoney.hide();
                this.drops.hide();
                this.location.hide();
                this.kills.hide()
            }
        },
        createStatusLine: function(a, b, d, g) {
            var h = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + a), b);
            h.setPos(d, g);
            h.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + a,
                    description: "sc.gui.menu.help.enemy.description." + a
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: b + 1
                }
            };
            this.addChildGui(h);
            return h
        }
    });
    sc.EnemyPageMetaInfo = ig.GuiElementBase.extend({
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
        killMore: null,
        species: null,
        trivia: null,
        descriptions: null,
        content: null,
        init: function() {
            this.parent();
            this.setSize(269, 216);
            this.killMore = new sc.TextGui("", {
                maxWidth: 259
            });
            this.killMore.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.killMore.hook.transitions = {
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
            this.killMore.doStateTransition("HIDDEN",
                true);
            this.addChildGui(this.killMore);
            this.content = new ig.GuiElementBase;
            this.addChildGui(this.content);
            this.species = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.species"), {
                font: sc.fontsystem.smallFont
            });
            this.species.hook.transitions = {
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
            this.species.setPos(2, 0);
            this.addChildGui(this.species);
            this.trivia = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.trivia"), {
                font: sc.fontsystem.smallFont
            });
            this.trivia.hook.transitions = {
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
            this.trivia.setPos(2, 15);
            this.addChildGui(this.trivia);
            this.descriptions = new ig.GuiElementBase;
            this.descriptions.setSize(265, 186);
            this.descriptions.setPos(2, 30);
            this.addChildGui(this.descriptions);
            this.setData();
            this.doStateTransition("HIDDEN", true)
        },
        setData: function(a, b) {
            this.killMore.doStateTransition("HIDDEN", true);
            this.species.doStateTransition("HIDDEN",
                true);
            this.trivia.doStateTransition("HIDDEN", true);
            this.descriptions.removeAllChildren();
            if (b) {
                var d = b.boss ? 1 : b.kills || sc.MIN_KILLS,
                    g = sc.stats.getMap("combat", "kill" + a) || 0;
                if (ig.perf.fullEnemyFibula || g <= -1 || g >= d) {
                    d = null;
                    d = b.species ? ig.LangLabel.getText(b.species, true) : ig.lang.get("sc.gui.menu.enemy.unknown");
                    this.species.setText(ig.lang.get("sc.gui.menu.enemy.species") + d);
                    this.species.doStateTransition("DEFAULT", true);
                    if ((d = b.descriptions) && d.length >= 1) {
                        var g = new ig.VarCondition(""),
                            h = null,
                            i = 0,
                            j =
                            0,
                            k = {
                                font: sc.fontsystem.smallFont,
                                maxWidth: 265
                            },
                            l = new ig.ColorGui("#C7C7C7", 269, 1);
                        l.setPos(-2, i);
                        this.descriptions.addChildGui(l);
                        for (var i = i + 1, o = 0; o < d.length; o++) {
                            h = d[o];
                            g.setCondition(h.condition || "");
                            if (ig.perf.fullEnemyFibula || g.evaluate()) {
                                l = new sc.TextGui(ig.LangLabel.getText(h.text), k);
                                l.setPos(0, i);
                                this.descriptions.addChildGui(l);
                                i = i + l.hook.size.y;
                                j++;
                                l = sc.combat.getEnemyName(a) + " Report #" + (o + 1);
                                ig.langEdit.submitCustomFile(l, new ig.LangLabel(h.text), "data/enemies/" + a.toPath("", ".json"),
                                    true)
                            }
                        }
                        this.trivia.setText(ig.lang.get("sc.gui.menu.enemy.trivia"))
                    } else this.trivia.setText(ig.lang.get("sc.gui.menu.enemy.trivia") + ig.lang.get("sc.gui.menu.enemy.noReports"));
                    this.trivia.doStateTransition("DEFAULT", true)
                } else {
                    h = ig.lang.get("sc.gui.menu.enemy.killMore");
                    h = h.replace("[x]", d - g);
                    h = h.replace("[y]", ig.LangLabel.getText(b.name) + "");
                    this.killMore.setText(h);
                    this.killMore.doStateTransition("DEFAULT", true)
                }
            }
        },
        getPercent: function(a, b) {
            return Math.floor(a / b * 100)
        }
    });
    sc.EnemyLocation = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 4
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        location: null,
        image: null,
        init: function() {
            this.parent();
            this.setSize(269, 20);
            this.location = new sc.TextGui("Location: Bergen Trail", {
                font: sc.fontsystem.smallFont
            });
            this.location.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 4
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.location.setPos(10,
                0);
            this.addChildGui(this.location);
            this.image = new ig.ImageGui(this.gfx, 481, 224, 8, 11);
            this.image.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        angle: 0.2
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.image.setPivot(4, 6);
            this.addChildGui(this.image);
            this.hide(true)
        },
        setLocation: function(a, b) {
            var d = a ? sc.map.getAreaName(a) : null;
            this.location.setText(ig.lang.get("sc.gui.menu.enemy.location") + (d ? d : "???"));
            this.location.doStateTransition("DEFAULT",
                b);
            this.image.doStateTransition("DEFAULT", b)
        },
        hide: function(a) {
            this.location.doStateTransition("HIDDEN", a);
            this.image.doStateTransition("HIDDEN", a)
        }
    });
    sc.EnemyBaseParamLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
        number: null,
        name: "Flowey",
        icon: 0,
        init: function(a, b) {
            this.parent();
            this.setSize(118, 12);
            this.name = a || "Flowey";
            this.icon = b || 0;
            var d =
                new sc.TextGui(a, {
                    font: sc.fontsystem.tinyFont
                });
            d.setPos(13, 3);
            this.addChildGui(d);
            this.number = new sc.NumberGui(9999999, {
                transitionTime: 0.15
            });
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(0, 4);
            this.addChildGui(this.number);
            this.doStateTransition("HIDDEN", true)
        },
        setNumber: function(a, b) {
            this.hook.currentStateName == "HIDDEN" && this.number.setNumber(0, true);
            this.doStateTransition("DEFAULT", true);
            this.number.setNumber(a || 0, b)
        },
        setScrambleNumbers: function(a) {
            this.number.scramble =
                a
        },
        hide: function() {
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 520, 48, 118, 11);
            a.addGfx(this.gfx, 0, 0, sc.MODIFIER_ICON_DRAW.X + this.icon * 12, sc.MODIFIER_ICON_DRAW.Y, 11, 11)
        }
    });
    var a = {
        D: 0,
        C: 1,
        B: 2,
        A: 3,
        S: 4
    };
    sc.EnemyDrops = ig.GuiElementBase.extend({
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
        container: null,
        prevChances: [],
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(269, 70);
            this.setPos(0, 144);
            var a = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.drops"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(2, 0);
            this.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.rank"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(1, 0);
            this.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.chance"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            a.setPos(62, 0);
            this.addChildGui(a);
            a = new ig.ColorGui("#CCCCCC", 269, 1);
            a.setPos(0, 7);
            this.addChildGui(a);
            this.container = new ig.GuiElementBase;
            this.container.setSize(269, 60);
            this.container.setPos(0, 10);
            this.addChildGui(this.container)
        },
        setDrops: function(b, d, f) {
            this.doStateTransition("DEFAULT", true);
            this.container.removeAllChildren();
            if (b)
                for (var g = null, h = null, g = g = g = null, i = 0, j = 0; j < 4; j++)
                    if (b[j]) {
                        if (!b[j].boosted || f) {
                            g = sc.inventory.getItem(b[j].item);
                            h = "\\i[" + g.icon + sc.inventory.getRaritySuffix(g.rarity ||
                                0) + "]";
                            h = sc.stats.getMap("items", b[j].item) ? h + ig.LangLabel.getText(g.name) : h + "???????????????";
                            g = new sc.TextGui(h);
                            g.setPos(0, i - 3);
                            this.container.addChildGui(g);
                            g = new sc.PercentNumber(100, {
                                transitionTime: 0.15
                            });
                            this.prevChances[j] && g.setNumber(this.prevChances[j], true);
                            g.setNumber(Math.round(b[j].prob * 100), d);
                            g.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                            g.setPos(63, i + 2);
                            this.container.addChildGui(g);
                            this.prevChances[j] = Math.round(b[j].prob * 100);
                            g = new ig.ImageGui(this.gfx, 537 + a[b[j].rank || "D"] *
                                15, 34, 14, 12);
                            g.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                            g.setPos(1, i);
                            this.container.addChildGui(g);
                            i = i + 15
                        }
                    } else this.prevChances[j] = 0
        },
        hide: function() {
            for (var a = 4; a--;) this.prevChances[a] = 0;
            this.doStateTransition("HIDDEN", true)
        }
    });
    sc.EnemyKillCount = ig.GuiElementBase.extend({
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
        count: null,
        image: null,
        special: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(269, 20);
            this.count = new sc.NumberGui(99999999, {
                size: sc.NUMBER_SIZE.SMALL,
                transitionTime: 0.15
            });
            this.count.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 4
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.count.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.count.setPos(14, 3);
            this.addChildGui(this.count);
            this.image = new ig.ImageGui(this.gfx, 579, 19, 11, 10);
            this.image.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        angle: -0.3
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.image.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.image.setPos(1, 2);
            this.addChildGui(this.image);
            this.special = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.special"), {
                font: sc.fontsystem.smallFont
            });
            this.special.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 4
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.special.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.special.doStateTransition("HIDDEN", true);
            this.special.setPos(1, 0);
            this.addChildGui(this.special);
            this.hide()
        },
        setKills: function(a, b) {
            if (a <= -1) {
                this.count.doStateTransition("HIDDEN", true);
                this.image.doStateTransition("HIDDEN", true);
                this.special.doStateTransition("DEFAULT")
            } else {
                if (this.count.isVisible()) this.special.doStateTransition("HIDDEN");
                else {
                    this.count.setNumber(0, true);
                    this.special.doStateTransition("HIDDEN",
                        true)
                }
                this.count.setNumber(a || 0, b);
                this.count.doStateTransition("DEFAULT", b);
                this.image.doStateTransition("DEFAULT", b)
            }
        },
        hide: function() {
            this.special.doStateTransition("HIDDEN");
            this.count.doStateTransition("HIDDEN");
            this.image.doStateTransition("HIDDEN")
        }
    });
    sc.EnemyExpMoney = ig.GuiElementBase.extend({
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
        exp: null,
        money: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(147, 10);
            this.exp = new sc.NumberGui(9999999, {
                transitionTime: 0.15
            });
            this.exp.setPos(15, 1);
            this.addChildGui(this.exp);
            this.money = new sc.NumberGui(9999999, {
                transitionTime: 0.15
            });
            this.money.setPos(89, 1);
            this.addChildGui(this.money);
            this.hide()
        },
        setValues: function(a, b, d) {
            this.doStateTransition("DEFAULT", true);
            this.exp.setNumber(a, d);
            this.money.setNumber(b, d)
        },
        hide: function() {
            this.exp.setNumber(0, true);
            this.money.setNumber(0,
                true);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 472, 32, 14, 10);
            a.addGfx(this.gfx, 75, 0, 488, 32, 12, 10)
        }
    });
    var d = {
        "0": {
            x: -2,
            y: 42,
            x2: 0,
            y2: 46,
            x3: 49,
            y3: 29,
            width: 49,
            down: true
        },
        1: {
            x: 77,
            y: -1,
            x2: 66,
            y2: 7,
            x3: 48,
            y3: 7,
            width: 47,
            right: true
        },
        2: {
            x: 77,
            y: 10,
            x2: 77,
            y2: 18,
            x3: 60,
            y3: 18,
            width: 36,
            right: true
        },
        3: {
            x: -2,
            y: 31,
            x2: 0,
            y2: 35,
            x3: 38,
            y3: 18,
            width: 38,
            down: true
        }
    };
    sc.EnemyResistence = ig.GuiElementBase.extend({
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
        res: [],
        lines: [],
        images: [],
        init: function() {
            this.parent();
            this.setSize(118, 51);
            var a = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.resistance"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(0, 0);
            this.addChildGui(a);
            for (a = 0; a < 4; a++) {
                this.createNumber(a);
                this.createLine(a);
                this.createImage(a)
            }
        },
        setResistance: function(a, b) {
            this.doStateTransition("DEFAULT", true);
            if (a)
                for (var d = this.res.length; d--;) {
                    var g = this.getValue(a[d]);
                    if (g) {
                        this.lines[d].show(b);
                        this.res[d].setNumber(g, b);
                        g < 0 ? this.res[d].setColor(sc.GUI_NUMBER_COLOR.RED) : this.res[d].setColor(sc.GUI_NUMBER_COLOR.WHITE);
                        this.images[d].doStateTransition("DEFAULT", b)
                    } else {
                        this.lines[d].hide(b);
                        this.res[d].setNumber(0, b);
                        this.res[d].doStateTransition("HIDDEN", b);
                        this.images[d].doStateTransition("HIDDEN", b)
                    }
                } else
                    for (d = this.res.length; d--;) {
                        this.res[d].hide();
                        this.lines[d].hide(true)
                    }
        },
        hide: function() {
            for (var a = this.res.length; a--;) {
                this.res[a].hide();
                this.lines[a].hasLine =
                    true;
                this.lines[a].hide(true);
                this.images[a].doStateTransition("HIDDEN", true)
            }
            this.doStateTransition("HIDDEN", true)
        },
        createNumber: function(a) {
            var b = new sc.PercentNumber(999, {
                signed: true,
                transitionTime: 0.15
            });
            b.setPos(d[a].x, d[a].y);
            this.addChildGui(b);
            this.res[a] = b
        },
        createLine: function(a) {
            var b = new sc.EnemyElementSlopeLine(a, d[a].width);
            b.setPos(d[a].x2, d[a].y2);
            this.addChildGui(b);
            this.lines[a] = b
        },
        createImage: function(a) {
            var b = new ig.ImageGui(this.gfx, 520 + a * 21, 120, 21, 21);
            b.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
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
            b.setPos(d[a].x3, d[a].y3);
            this.addChildGui(b);
            this.images[a] = b
        },
        getValue: function(a) {
            return Math.round((a - 1) * -100)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 520, 63, 83, 51)
        }
    });
    sc.EnemyElementSlopeLine = ig.GuiElementBase.extend({
        slope: null,
        line: null,
        hasLine: false,
        init: function(a, b) {
            this.parent();
            this.setSize(b + 5, 5);
            this.slope = new sc.SlopeLine(5, d[a].right || false, d[a].down || false, sc.SlopeLine_Color.GREY);
            this.addChildGui(this.slope);
            this.line = new ig.ColorGui("#C7C7C7", b, 1);
            this.line.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.line);
            if (d[a].right) {
                this.slope.setPos(0, 5);
                this.line.setPos(5, 0);
                this.line.setPivot(0, 0)
            } else {
                this.slope.setPos(b + 5, 0);
                this.line.setPos(0, 4);
                this.line.setPivot(b, 0)
            }
            this.slope.hide();
            this.line.doStateTransition("HIDDEN", true)
        },
        show: function(a) {
            if (!this.hasLine)
                if (a) {
                    this.slope.show(0);
                    this.line.doStateTransition("DEFAULT", true)
                } else {
                    this.line.hook.currentStateName == "HIDDEN" && this.line.hasTransition();
                    this.slope.hide();
                    this.slope.show(0.1);
                    this.line.doStateTransition("HIDDEN", true);
                    this.line.doStateTransition("DEFAULT", false, false, null, 0.1);
                    this.hasLine = true
                }
        },
        hide: function(a) {
            if (this.hasLine) {
                this.slope.hide(a ? 0 : 0.1, a ? 0 : 0.1);
                this.line.doStateTransition("HIDDEN", a);
                this.hasLine = false
            }
        }
    });
    sc.EnemyDisplayBox = ig.BoxGui.extend({
        display: null,
        container: null,
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
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 6,
            left: 4,
            top: 4,
            right: 4,
            bottom: 4,
            offsets: {
                "default": {
                    x: 520,
                    y: 33
                }
            }
        }),
        init: function() {
            this.parent(147, 111);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.container = new ig.GuiElementBase;
            this.container.hook.clip = true;
            this.container.setSize(145, 109);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },
        setEnemy: function(a,
            b, d, g, h) {
            if (a) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (a) {
                    this.display = new sc.EnemyDisplayGui(a, true, d, this.centerEnemy.bind(this), g, h);
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                this.display && (b ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true));
                this.doStateTransition("HIDDEN", true)
            }
        },
        centerEnemy: function(a) {
            a.enemy && a.setPos(this.container.hook.size.x / 2 - a.hook.size.x / 2 + a.displayOffset.x, this.container.hook.size.y /
                2 - a.hook.size.y / 2 + a.displayOffset.y)
        }
    })
});
ig.baked = !0;
