/**
 * game.feature.menu.gui.enemies.enemy-pages
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.enemies.enemy-pages")`.
 *
 * The enemy codex info pages and their widgets:
 *  - `sc.EnemyPageGeneralInfo`: base params (HP/ATK/DEF/FOC), element
 *    resistances, exp/money, item drops and kill count + live enemy view.
 *  - `sc.EnemyPageMetaInfo`: species, kill-gated reports/trivia.
 *  - `sc.EnemyLocation`, `sc.EnemyBaseParamLine`, `sc.EnemyDrops`,
 *    `sc.EnemyKillCount`, `sc.EnemyExpMoney`, `sc.EnemyResistence`
 *    (+ `sc.EnemyElementSlopeLine`), `sc.EnemyDisplayBox`: the widgets.
 */
ig.module("game.feature.menu.gui.enemies.enemy-pages")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.combat.gui.enemy-display-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.misc")
    .defines(function () {

    ig.perf.fullEnemyFibula = false;

    var DEFAULT_ELEM_FACTORS = [1, 1, 1, 1];

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

        init: function () {
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
            var y = 15;
            this.baseHp = this.createStatusLine("maxhp", 0, 0, y);
            y = y + 14;
            this.baseAttack = this.createStatusLine("atk", 1, 0, y);
            y = y + 14;
            this.baseDefense = this.createStatusLine("def", 2, 0, y);
            y = y + 14;
            this.baseFocus = this.createStatusLine("foc", 3, 0, y);
            y = y + 23;
            this.resistance = new sc.EnemyResistence;
            this.resistance.setPos(0, y);
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

        setData: function (key, enemy, animate, isBooster) {
            if (enemy) {
                this.display.setEnemy(key, true, enemy.anim, enemy.extra, isBooster);
                var params = enemy.params,
                    credit = enemy.credit,
                    level = enemy.level;
                if (isBooster && sc.combat.canShowBoostedEntry(key, enemy.boss)) {
                    level = ig.perf.fullEnemyFibula ? sc.MIN_BOOSTER_LEVEL : enemy.boostedLevel || sc.MIN_BOOSTER_LEVEL;
                    params = sc.EnemyLevelScaling.adaptParams(params, enemy.level, level);
                    credit = sc.EnemyLevelScaling.adaptCredits(credit, enemy.level, level)
                }
                this.baseHp.setNumber(params.hp, animate);
                this.baseAttack.setNumber(params.attack, animate);
                this.baseDefense.setNumber(params.defense, animate);
                this.baseFocus.setNumber(params.focus, animate);
                this.resistance.setResistance(params.elemFactor || DEFAULT_ELEM_FACTORS, animate);
                this.expMoney.setValues(sc.model.player.getRawExpGain(enemy.exp || 0, level, sc.LEVEL_CURVES.REGULAR), credit || 0, animate);
                this.drops.setDrops(enemy.itemDrops, animate, isBooster);
                this.location.setLocation(enemy.area, animate);
                this.kills.setKills(sc.stats.getMap("combat", "kill" + key), animate);
                this.baseHp.setScrambleNumbers(params.hp > 9999999)
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

        createStatusLine: function (key, iconIndex, x, y) {
            var line = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + key), iconIndex);
            line.setPos(x, y);
            line.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + key,
                    description: "sc.gui.menu.help.enemy.description." + key
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: iconIndex + 1
                }
            };
            this.addChildGui(line);
            return line
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

        init: function () {
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
            this.killMore.doStateTransition("HIDDEN", true);
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

        setData: function (key, enemy) {
            this.killMore.doStateTransition("HIDDEN", true);
            this.species.doStateTransition("HIDDEN", true);
            this.trivia.doStateTransition("HIDDEN", true);
            this.descriptions.removeAllChildren();
            if (enemy) {
                var killRequirement = enemy.boss ? 1 : enemy.kills || sc.MIN_KILLS,
                    kills = sc.stats.getMap("combat", "kill" + key) || 0;
                if (ig.perf.fullEnemyFibula || kills <= -1 || kills >= killRequirement) {
                    var speciesText = null;
                    speciesText = enemy.species ? ig.LangLabel.getText(enemy.species, true) : ig.lang.get("sc.gui.menu.enemy.unknown");
                    this.species.setText(ig.lang.get("sc.gui.menu.enemy.species") + speciesText);
                    this.species.doStateTransition("DEFAULT", true);
                    if ((speciesText = enemy.descriptions) && speciesText.length >= 1) {
                        var condition = new ig.VarCondition(""),
                            report = null,
                            y = 0,
                            reportCount = 0,
                            textOptions = {
                                font: sc.fontsystem.smallFont,
                                maxWidth: 265
                            },
                            divider = new ig.ColorGui("#C7C7C7", 269, 1);
                        divider.setPos(-2, y);
                        this.descriptions.addChildGui(divider);
                        for (var y = y + 1, i = 0; i < speciesText.length; i++) {
                            report = speciesText[i];
                            condition.setCondition(report.condition || "");
                            if (ig.perf.fullEnemyFibula || condition.evaluate()) {
                                divider = new sc.TextGui(ig.LangLabel.getText(report.text), textOptions);
                                divider.setPos(0, y);
                                this.descriptions.addChildGui(divider);
                                y = y + divider.hook.size.y;
                                reportCount++;
                                divider = sc.combat.getEnemyName(key) + " Report #" + (i + 1);
                                ig.langEdit.submitCustomFile(divider, new ig.LangLabel(report.text), "data/enemies/" + key.toPath("", ".json"), true)
                            }
                        }
                        this.trivia.setText(ig.lang.get("sc.gui.menu.enemy.trivia"))
                    } else this.trivia.setText(ig.lang.get("sc.gui.menu.enemy.trivia") + ig.lang.get("sc.gui.menu.enemy.noReports"));
                    this.trivia.doStateTransition("DEFAULT", true)
                } else {
                    var killMore = ig.lang.get("sc.gui.menu.enemy.killMore");
                    killMore = killMore.replace("[x]", killRequirement - kills);
                    killMore = killMore.replace("[y]", ig.LangLabel.getText(enemy.name) + "");
                    this.killMore.setText(killMore);
                    this.killMore.doStateTransition("DEFAULT", true)
                }
            }
        },

        getPercent: function (value, total) {
            return Math.floor(value / total * 100)
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

        init: function () {
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
            this.location.setPos(10, 0);
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

        setLocation: function (area, animate) {
            var areaName = area ? sc.map.getAreaName(area) : null;
            this.location.setText(ig.lang.get("sc.gui.menu.enemy.location") + (areaName ? areaName : "???"));
            this.location.doStateTransition("DEFAULT", animate);
            this.image.doStateTransition("DEFAULT", animate)
        },

        hide: function (immediate) {
            this.location.doStateTransition("HIDDEN", immediate);
            this.image.doStateTransition("HIDDEN", immediate)
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

        init: function (label, iconIndex) {
            this.parent();
            this.setSize(118, 12);
            this.name = label || "Flowey";
            this.icon = iconIndex || 0;
            var textGui = new sc.TextGui(label, {
                font: sc.fontsystem.tinyFont
            });
            textGui.setPos(13, 3);
            this.addChildGui(textGui);
            this.number = new sc.NumberGui(9999999, {
                transitionTime: 0.15
            });
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(0, 4);
            this.addChildGui(this.number);
            this.doStateTransition("HIDDEN", true)
        },

        setNumber: function (value, animate) {
            this.hook.currentStateName == "HIDDEN" && this.number.setNumber(0, true);
            this.doStateTransition("DEFAULT", true);
            this.number.setNumber(value || 0, animate)
        },

        setScrambleNumbers: function (scramble) {
            this.number.scramble = scramble
        },

        hide: function () {
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 520, 48, 118, 11);
            renderer.addGfx(this.gfx, 0, 0, sc.MODIFIER_ICON_DRAW.X + this.icon * 12, sc.MODIFIER_ICON_DRAW.Y, 11, 11)
        }
    });

    var RANK_ICON_INDEX = {
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

        init: function () {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(269, 70);
            this.setPos(0, 144);
            var label = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.drops"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(2, 0);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.rank"), {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(1, 0);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.chance"), {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(62, 0);
            this.addChildGui(label);
            var divider = new ig.ColorGui("#CCCCCC", 269, 1);
            divider.setPos(0, 7);
            this.addChildGui(divider);
            this.container = new ig.GuiElementBase;
            this.container.setSize(269, 60);
            this.container.setPos(0, 10);
            this.addChildGui(this.container)
        },

        setDrops: function (drops, animate, isBooster) {
            this.doStateTransition("DEFAULT", true);
            this.container.removeAllChildren();
            if (drops)
                for (var item = null, label = null, item = item = item = null, y = 0, i = 0; i < 4; i++)
                    if (drops[i]) {
                        if (!drops[i].boosted || isBooster) {
                            item = sc.inventory.getItem(drops[i].item);
                            label = "\\i[" + item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) + "]";
                            label = sc.stats.getMap("items", drops[i].item) ? label + ig.LangLabel.getText(item.name) : label + "???????????????";
                            var itemGui = new sc.TextGui(label);
                            itemGui.setPos(0, y - 3);
                            this.container.addChildGui(itemGui);
                            var chanceGui = new sc.PercentNumber(100, {
                                transitionTime: 0.15
                            });
                            this.prevChances[i] && chanceGui.setNumber(this.prevChances[i], true);
                            chanceGui.setNumber(Math.round(drops[i].prob * 100), animate);
                            chanceGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                            chanceGui.setPos(63, y + 2);
                            this.container.addChildGui(chanceGui);
                            this.prevChances[i] = Math.round(drops[i].prob * 100);
                            var rankGui = new ig.ImageGui(this.gfx, 537 + RANK_ICON_INDEX[drops[i].rank || "D"] * 15, 34, 14, 12);
                            rankGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                            rankGui.setPos(1, y);
                            this.container.addChildGui(rankGui);
                            y = y + 15
                        }
                    } else this.prevChances[i] = 0
        },

        hide: function () {
            for (var i = 4; i--;) this.prevChances[i] = 0;
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

        init: function () {
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

        setKills: function (kills, animate) {
            if (kills <= -1) {
                this.count.doStateTransition("HIDDEN", true);
                this.image.doStateTransition("HIDDEN", true);
                this.special.doStateTransition("DEFAULT")
            } else {
                if (this.count.isVisible()) this.special.doStateTransition("HIDDEN");
                else {
                    this.count.setNumber(0, true);
                    this.special.doStateTransition("HIDDEN", true)
                }
                this.count.setNumber(kills || 0, animate);
                this.count.doStateTransition("DEFAULT", animate);
                this.image.doStateTransition("DEFAULT", animate)
            }
        },

        hide: function () {
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

        init: function () {
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

        setValues: function (exp, money, animate) {
            this.doStateTransition("DEFAULT", true);
            this.exp.setNumber(exp, animate);
            this.money.setNumber(money, animate)
        },

        hide: function () {
            this.exp.setNumber(0, true);
            this.money.setNumber(0, true);
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 472, 32, 14, 10);
            renderer.addGfx(this.gfx, 75, 0, 488, 32, 12, 10)
        }
    });

    var RES_LINE_LAYOUT = {
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

        init: function () {
            this.parent();
            this.setSize(118, 51);
            var label = new sc.TextGui(ig.lang.get("sc.gui.menu.enemy.resistance"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(0, 0);
            this.addChildGui(label);
            for (var i = 0; i < 4; i++) {
                this.createNumber(i);
                this.createLine(i);
                this.createImage(i)
            }
        },

        setResistance: function (factors, animate) {
            this.doStateTransition("DEFAULT", true);
            if (factors)
                for (var i = this.res.length; i--;) {
                    var value = this.getValue(factors[i]);
                    if (value) {
                        this.lines[i].show(animate);
                        this.res[i].setNumber(value, animate);
                        value < 0 ? this.res[i].setColor(sc.GUI_NUMBER_COLOR.RED) : this.res[i].setColor(sc.GUI_NUMBER_COLOR.WHITE);
                        this.images[i].doStateTransition("DEFAULT", animate)
                    } else {
                        this.lines[i].hide(animate);
                        this.res[i].setNumber(0, animate);
                        this.res[i].doStateTransition("HIDDEN", animate);
                        this.images[i].doStateTransition("HIDDEN", animate)
                    }
                }
            else
                for (i = this.res.length; i--;) {
                    this.res[i].hide();
                    this.lines[i].hide(true)
                }
        },

        hide: function () {
            for (var i = this.res.length; i--;) {
                this.res[i].hide();
                this.lines[i].hasLine = true;
                this.lines[i].hide(true);
                this.images[i].doStateTransition("HIDDEN", true)
            }
            this.doStateTransition("HIDDEN", true)
        },

        createNumber: function (index) {
            var number = new sc.PercentNumber(999, {
                signed: true,
                transitionTime: 0.15
            });
            number.setPos(RES_LINE_LAYOUT[index].x, RES_LINE_LAYOUT[index].y);
            this.addChildGui(number);
            this.res[index] = number
        },

        createLine: function (index) {
            var line = new sc.EnemyElementSlopeLine(index, RES_LINE_LAYOUT[index].width);
            line.setPos(RES_LINE_LAYOUT[index].x2, RES_LINE_LAYOUT[index].y2);
            this.addChildGui(line);
            this.lines[index] = line
        },

        createImage: function (index) {
            var image = new ig.ImageGui(this.gfx, 520 + index * 21, 120, 21, 21);
            image.hook.transitions = {
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
            image.setPos(RES_LINE_LAYOUT[index].x3, RES_LINE_LAYOUT[index].y3);
            this.addChildGui(image);
            this.images[index] = image
        },

        getValue: function (factor) {
            return Math.round((factor - 1) * -100)
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 520, 63, 83, 51)
        }
    });

    sc.EnemyElementSlopeLine = ig.GuiElementBase.extend({
        slope: null,
        line: null,
        hasLine: false,

        init: function (index, width) {
            this.parent();
            this.setSize(width + 5, 5);
            this.slope = new sc.SlopeLine(5, RES_LINE_LAYOUT[index].right || false, RES_LINE_LAYOUT[index].down || false, sc.SlopeLine_Color.GREY);
            this.addChildGui(this.slope);
            this.line = new ig.ColorGui("#C7C7C7", width, 1);
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
            if (RES_LINE_LAYOUT[index].right) {
                this.slope.setPos(0, 5);
                this.line.setPos(5, 0);
                this.line.setPivot(0, 0)
            } else {
                this.slope.setPos(width + 5, 0);
                this.line.setPos(0, 4);
                this.line.setPivot(width, 0)
            }
            this.slope.hide();
            this.line.doStateTransition("HIDDEN", true)
        },

        show: function (animate) {
            if (!this.hasLine)
                if (animate) {
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

        hide: function (immediate) {
            if (this.hasLine) {
                this.slope.hide(immediate ? 0 : 0.1, immediate ? 0 : 0.1);
                this.line.doStateTransition("HIDDEN", immediate);
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

        init: function () {
            this.parent(147, 111);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.container = new ig.GuiElementBase;
            this.container.hook.clip = true;
            this.container.setSize(145, 109);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },

        setEnemy: function (key, immediate, anim, extra, isBooster) {
            if (key) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (key) {
                    this.display = new sc.EnemyDisplayGui(key, true, anim, this.centerEnemy.bind(this), extra, isBooster);
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                this.display && (immediate ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true));
                this.doStateTransition("HIDDEN", true)
            }
        },

        centerEnemy: function (display) {
            display.enemy && display.setPos(this.container.hook.size.x / 2 - display.hook.size.x / 2 + display.displayOffset.x, this.container.hook.size.y / 2 - display.hook.size.y / 2 + display.displayOffset.y)
        }
    })
});
ig.baked = !0;
