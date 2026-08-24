/**
 * game.feature.menu.gui.arena.arena-round-page
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.arena.arena-round-page")`.
 *
 * `sc.ArenaRoundInfoPage`: the round info page in the arena info box —
 * highscore, medal requirements (silver/gold/platinum), time, coins,
 * clears, objective description, plus a flip page with bonus points and
 * challenge mods. `sc.ArenaChallengeEntry`: one challenge row with icon.
 * `sc.ArenaRoundInfoPage.Medals`: the three medal requirement numbers.
 */
ig.module("game.feature.menu.gui.arena.arena-round-page")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.misc")
    .defines(function () {

    sc.ArenaRoundInfoPage = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        numberGFX: new ig.Image("media/gui/basic.png"),
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
        highscore: null,
        time: null,
        coins: null,
        clearTimes: null,
        headerInfo: null,
        headerFeat: null,
        headerChallenges: null,
        medals: null,
        bonuses: null,
        challenges: null,
        noneText: null,
        leftContent: null,
        rightContent: null,
        side: false,

        init: function () {
            this.parent();
            this.setPivot(0, 213);
            this.setSize(269, 213);
            var y = 2;
            this.leftContent = new ig.GuiElementBase;
            this.leftContent.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0.5,
                        scaleX: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.leftContent.setPivot(-4, 0);
            this.leftContent.setSize(269, 213);
            this.leftContent.setPos(0, 0);
            this.addChildGui(this.leftContent);
            this.rightContent = new ig.GuiElementBase;
            this.rightContent.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0.5,
                        scaleX: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.rightContent.setPivot(273, 0);
            this.rightContent.setSize(269, 213);
            this.rightContent.setPos(0, 0);
            this.rightContent.doStateTransition("HIDDEN", true);
            this.addChildGui(this.rightContent);
            this.highscore = this.createStatGui("highscore", "KeyValue", this.leftContent, y, {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.highscore, "highscoreRound", 0, "dyn", 32);
            y = y + 18;
            this.medals = new sc.ArenaRoundInfoPage.Medals;
            this.medals.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.medals.setPos(1, y);
            this.leftContent.addChildGui(this.medals);
            var medalIcon = new ig.ImageGui(this.gfx, 544, 224, 9, 12);
            medalIcon.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            medalIcon.setPos(this.medals.hook.size.x + 3, y);
            this.leftContent.addChildGui(medalIcon);
            y = y + this.medals.hook.size.y;
            this.time = this.createStatGui("timeRound", "Time", this.leftContent, y, {
                value: function () {
                    return 0
                },
                leading: 2,
                max: 99,
                millis: true,
                hideHours: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.time, "timeRound", 1, "dyn", 18, 0, -1);
            y = y + 17;
            if (!sc.menu.arenaCustomMode) {
                this.coins = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.coins"), 267);
                this.coins.setPos(1, y);
                this.setAnnotation(this.coins, "coinsRound", 2, 277, 16, -5, 1);
                this.leftContent.addChildGui(this.coins);
                y = y + 17
            }
            this.clearTimes = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.cleared"), 267);
            this.clearTimes.setPos(1, y);
            this.setAnnotation(this.clearTimes, "clears", 3, 277, 16, -5, 1);
            this.leftContent.addChildGui(this.clearTimes);
            y = y + 20;
            this.headerFeat = new sc.ArenaInfoLine(ig.lang.get("sc.gui.arena.menu.objective"));
            this.headerFeat.setPos(0, y);
            this.headerFeat.show(true);
            this.leftContent.addChildGui(this.headerFeat);
            y = y + (this.headerFeat.hook.size.y + 2);
            var objectiveContainer = new ig.GuiElementBase;
            objectiveContainer.setSize(269, 38);
            objectiveContainer.setPos(0, y + 2);
            this.leftContent.addChildGui(objectiveContainer);
            this.setAnnotation(objectiveContainer, "objective", 4, 277, 83 + (sc.menu.arenaCustomMode ? 17 : 0), -4, -4);
            this.description = new sc.TextGui("", {
                font: sc.fontsystem.smallFont,
                maxWidth: 269,
                textAlign: ig.Font.ALIGN.CENTER,
                linePadding: 0
            });
            this.description.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.description.setPos(0, 0);
            objectiveContainer.addChildGui(this.description);
            y = 2;
            this.headerFeat = new sc.ArenaInfoLine(ig.lang.get("sc.gui.arena.menu.bonuses"));
            this.headerFeat.setPos(0, y);
            this.headerFeat.show(true);
            this.bonusTotal = this.createStatGui("bonuses", "KeyValue", this.rightContent, y, {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.bonusTotal, "bonus", 0, "dyn", 72);
            y = y + 14;
            this.bonuses = new ig.GuiElementBase;
            this.bonuses.setSize(269, 60);
            this.bonuses.setPos(0, y);
            this.rightContent.addChildGui(this.bonuses);
            y = y + this.bonuses.hook.size.y;
            this.headerChallenges = new sc.ArenaInfoLine(ig.lang.get("sc.gui.arena.menu.challenges"));
            this.headerChallenges.setPos(0, y);
            this.headerChallenges.show(true);
            this.rightContent.addChildGui(this.headerChallenges);
            y = y + (this.headerChallenges.hook.size.y + 2);
            this.challenges = new ig.GuiElementBase;
            this.challenges.setSize(269, 92);
            this.challenges.setPos(0, y);
            this.rightContent.addChildGui(this.challenges);
            this.setAnnotation(this.challenges, "challenges", 4, 277, 100, -4, -4);
            this.noneText = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.bonusNone"), {
                font: sc.fontsystem.smallFont,
                maxWidth: 269,
                textAlign: ig.Font.ALIGN.CENTER
            });
            this.noneText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            var bottomBar = new ig.ColorGui("#545454", 277, 22);
            bottomBar.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            bottomBar.setPos(0, 2);
            this.addChildGui(bottomBar);
            this.rightButton = new sc.ButtonGui("\\i[page-right]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.rightButton.onButtonPress = this.onRightButtonPressed.bind(this);
            this.rightButton.textChild.setPos(1, 0);
            this.rightButton.keepMouseFocus = true;
            this.rightButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.rightButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.rightButton.setPos(-4, 2);
            this.addChildGui(this.rightButton);
            this.leftButton = new sc.ButtonGui("\\i[page-left]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.leftButton.onButtonPress = this.onLeftButtonPressed.bind(this);
            this.leftButton.textChild.setPos(1, 0);
            this.leftButton.keepMouseFocus = true;
            this.leftButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.leftButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.leftButton.setPos(-4, 2);
            this.addChildGui(this.leftButton);
            this.pagesNumberContainer = new ig.GuiElementBase;
            this.pagesNumberContainer.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.pagesNumberContainer.setPos(0, 7);
            this.pagesNumberContainer.setSize(60, 8);
            this.pagesNumberContainer.hook.transitions = {
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
            var pageIcon = new ig.ImageGui(this.numberGFX, 96, 0, 8, 8);
            pageIcon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.pagesNumberContainer.addChildGui(pageIcon);
            this.currentPage = new sc.NumberGui(99);
            this.currentPage.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentPage.setPos(36, 0);
            this.pagesNumberContainer.addChildGui(this.currentPage);
            var totalPages = new sc.NumberGui(2);
            totalPages.setNumber(2, true);
            totalPages.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            totalPages.setPos(36, 0);
            this.pagesNumberContainer.addChildGui(totalPages);
            this.addChildGui(this.pagesNumberContainer);
            this.setData()
        },

        onRightButtonCheck: function () {
            return sc.control.rightPressed()
        },

        onLeftButtonCheck: function () {
            return sc.control.leftPressed()
        },

        onRightButtonPressed: function () {
            this.togglePage()
        },

        onLeftButtonPressed: function () {
            this.togglePage()
        },

        show: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
            sc.menu.buttonInteract.removeGlobalButton(this.leftButton);
            this.side = true;
            this.togglePage(true);
            this.doStateTransition("DEFAULT")
        },

        hide: function (immediate) {
            sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
            sc.menu.buttonInteract.removeGlobalButton(this.leftButton);
            this.doStateTransition("HIDDEN", immediate)
        },

        togglePage: function (immediate) {
            ig.interact.setBlockDelay(0.2);
            if (this.side = !this.side) {
                this.leftContent.doStateTransition("HIDDEN", immediate);
                this.rightContent.doStateTransition("DEFAULT", immediate);
                this.rightButton.doStateTransition("HIDDEN", true);
                this.leftButton.doStateTransition("DEFAULT", true);
                sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
                sc.menu.buttonInteract.addGlobalButton(this.leftButton, this.onLeftButtonCheck.bind(this), true);
                this.currentPage.setNumber(2)
            } else {
                this.leftContent.doStateTransition("DEFAULT", immediate);
                this.rightContent.doStateTransition("HIDDEN", immediate);
                this.rightButton.doStateTransition("DEFAULT", true);
                this.leftButton.doStateTransition("HIDDEN", true);
                sc.menu.buttonInteract.removeGlobalButton(this.leftButton);
                sc.menu.buttonInteract.addGlobalButton(this.rightButton, this.onRightButtonCheck.bind(this), true);
                this.currentPage.setNumber(1)
            }
        },

        setData: function (key, round) {
            if (key) {
                this.highscore.setValueAsNumber(sc.arena.getRoundPoints(key, round));
                this.medals.setValues(sc.arena.getRoundMedalRequirement(key, round, true), sc.arena.getRoundMedalRequirement(key, round), sc.arena.getRoundMedalRequirement(key, round, false, true));
                this.time.setTime(sc.arena.getRoundTime(key, round), true);
                this.coins && this.coins.setValue(sc.arena.getArenaCoinsObtainedInRound(key, round) + "\\i[slash]" + sc.arena.getAvailableArenaCoinsInRound(key, round));
                this.clearTimes.setValue(sc.arena.getRoundCompletionTotal(key, round) + "");
                this.bonuses.removeAllChildren();
                this.challenges.removeAllChildren();
                if (round != -1) {
                    var roundData = sc.arena.getCupRounds(key)[round],
                        objective = roundData.objective ? ig.LangLabel.getText(roundData.objective) : ig.lang.get("sc.gui.arena.menu.objectiveDefault");
                    roundData.description && (objective = objective + ("\\n" + ig.LangLabel.getText(roundData.description)));
                    this.description.setText(objective);
                    this.setBonusPoints(roundData.bonuses);
                    this.setChallenges(sc.arena.getChallengeMods(key, round))
                } else {
                    this.setChallenges(sc.arena.getChallengeMods(key, -1));
                    this.bonusTotal.setValueAsNumber(0);
                    this.bonuses.addChildGui(this.noneText);
                    this.description.setText(ig.lang.get("sc.gui.arena.menu.objectiveRushMode"))
                }
            } else {
                this.bonusTotal.setValueAsNumber(0, true);
                this.highscore.setValueAsNumber(0, true);
                this.medals.setValues(0, 0, 0, true);
                this.time.setTime(0, true);
                this.description.setText("");
                this.bonuses.removeAllChildren();
                this.challenges.removeAllChildren();
                this.clearTimes.setValue("0");
                this.coins && this.coins.setValue("0\\i[slash]0")
            }
        },

        setChallenges: function (challenges) {
            if (challenges) {
                var y = 0,
                    count = 0,
                    isTiny = Object.keys(challenges).length >= 6;
                for (var key in challenges) {
                    var entry = new sc.ArenaChallengeEntry(key, 269, isTiny, challenges[key].global);
                    entry.setPos(0, y);
                    this.challenges.addChildGui(entry);
                    y = y + (entry.hook.size.y - 3);
                    count++
                }
            }
        },

        setBonusPoints: function (bonuses) {
            var total = 0,
                bonuses = ig.copy(bonuses);
            bonuses.sort(function (a, b) {
                return (sc.ARENA_BONUS_OBJECTIVE[a.type] || 0).order - (sc.ARENA_BONUS_OBJECTIVE[b.type] || 0).order
            }.bind(this));
            if (bonuses)
                for (var count = Math.min(bonuses.length, sc.ARENA_MAX_BONUS_OBJECTIVES), i = 0; i < count; i++) {
                    bonuses.length <= 4 ? this.createBonusEntry("\\i[insetArrow]" + this.getBonusText(bonuses[i]), i * 14, this.getBonusPointsText(bonuses[i])) : this.createBonusEntry("\\i[insetArrow]" + this.getBonusText(bonuses[i]), 5 + i * 9, this.getBonusPointsText(bonuses[i]), true);
                    total = total + bonuses[i].points
                }
            this.bonusTotal.setValueAsNumber(total)
        },

        getBonusText: function (bonus) {
            return sc.ARENA_BONUS_OBJECTIVE[bonus.type] ? sc.ARENA_BONUS_OBJECTIVE[bonus.type].getText(ig.lang.get("sc.gui.arena.bonuses." + bonus.type), bonus) : "INVALID TYPE: " + bonus.type
        },

        getBonusPointsText: function (bonus) {
            var definition = sc.ARENA_BONUS_OBJECTIVE[bonus.type];
            return definition ? (definition.getPointsRange ? definition.getPointsRange(bonus, bonus.points) : bonus.points || 0) + "" : "INVALID_TYPE: " + bonus.type
        },

        createBonusEntry: function (label, y, value, isTiny) {
            var entry = null;
            if (isTiny) {
                entry = new sc.TrophyTabOverview.Entry(label, value, 267);
                entry.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP)
            } else {
                entry = new sc.ArenaKeyValue(label, 267);
                entry.setValue(value || "")
            }
            entry.setPos(1, y);
            this.bonuses.addChildGui(entry)
        },

        createStatGui: function (key, type, parent, y, options) {
            var gui = new sc.STATS_ENTRY_TYPE[type](key, options, options.width || 277);
            gui.keyGui.setText(ig.lang.get("sc.gui.arena.menu." + key));
            gui.setPos(-4, y);
            parent && parent.addChildGui(gui);
            return gui
        },

        setAnnotation: function (gui, key, index, width, height, offsetX, offsetY) {
            gui.annotation = {
                content: {
                    title: "sc.gui.menu.help.arena.titles." + key,
                    description: "sc.gui.menu.help.arena.description." + key
                },
                offset: {
                    x: offsetX || 0,
                    y: offsetY || 0
                },
                size: {
                    x: width || "dyn",
                    y: height || "dyn"
                },
                index: {
                    x: 0,
                    y: index + 1
                }
            }
        }
    });

    sc.ArenaChallengeEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/arena-gui.png"),
        icon: null,
        text: null,
        tiny: false,
        global: false,

        init: function (key, width, tiny, global) {
            this.parent();
            this.tiny = tiny || false;
            this.global = global || false;
            this.icon = sc.ARENA_CHALLENGES[key || "NO_MELEE"].icon || 1;
            if (this.tiny) {
                this.text = new sc.TextGui(ig.lang.get("sc.gui.arena.challenges.descriptions." + key), {
                    font: sc.fontsystem.tinyFont,
                    maxWidth: width - 13
                });
                this.text.setPos(13, 1);
                this.addChildGui(this.text);
                this.setSize(width, Math.max(this.text.hook.size.y + 4, 14))
            } else {
                this.text = new sc.TextGui(ig.lang.get("sc.gui.arena.challenges.descriptions." + key), {
                    font: sc.fontsystem.smallFont,
                    maxWidth: width - 21
                });
                this.text.setPos(21, 2);
                this.addChildGui(this.text);
                this.setSize(width, Math.max(this.text.hook.size.y + 4, 22))
            }
        },

        updateDrawables: function (renderer) {
            if (this.tiny) {
                renderer.addGfx(this.gfx, 0, 0, 364 + this.icon % 6 * 10, ~~(this.icon / 6) * 10, 10, 10);
                this.global && renderer.addGfx(this.gfx, 0, 0, 146, 48, 10, 10)
            } else {
                renderer.addGfx(this.gfx, 0, 0, 256 + this.icon % 6 * 18, ~~(this.icon / 6) * 18, 18, 18);
                this.global && renderer.addGfx(this.gfx, 0, 0, 128, 48, 18, 18)
            }
        }
    });

    sc.ArenaRoundInfoPage.Medals = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/arena-gui.png"),
        silver: null,
        gold: null,
        platin: null,
        platUnlocked: false,

        init: function () {
            this.parent();
            this.silver = new sc.NumberGui(99999999, {
                size: sc.NUMBER_SIZE.NORMAL,
                transitionTime: 0.2,
                leadingZeros: 8,
                zeroAsGrey: true
            });
            this.silver.setPos(18, 4);
            this.silver.setNumber(0, true);
            this.addChildGui(this.silver);
            this.gold = new sc.NumberGui(99999999, {
                size: sc.NUMBER_SIZE.NORMAL,
                transitionTime: 0.2,
                leadingZeros: 8,
                zeroAsGrey: true
            });
            this.gold.setPos(18 + this.silver.hook.size.x + 5 + 18, 4);
            this.gold.setNumber(0, true);
            this.addChildGui(this.gold);
            if (this.platUnlocked = sc.stats.getMap("arena", "medals-got-4") > 0) {
                this.platin = new sc.NumberGui(99999999, {
                    size: sc.NUMBER_SIZE.NORMAL,
                    transitionTime: 0.2,
                    leadingZeros: 8,
                    zeroAsGrey: true
                });
                this.platin.setPos(18 + this.silver.hook.size.x + this.gold.hook.size.x + 10 + 36, 4);
                this.platin.setNumber(0, true);
                this.addChildGui(this.platin);
                this.setSize(64 + this.silver.hook.size.x + this.gold.hook.size.x + this.platin.hook.size.x, 16)
            } else this.setSize(41 + this.silver.hook.size.x + this.gold.hook.size.x, 16)
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, 32, 0, 16, 16);
            renderer.addGfx(this.gfx, this.silver.hook.size.x + 5 + 18, 0, 48, 0, 16, 16);
            this.platUnlocked && renderer.addGfx(this.gfx, this.silver.hook.size.x + this.gold.hook.size.x + 10 + 36, 0, 64, 0, 16, 16)
        },

        setValues: function (silver, gold, platin, immediate) {
            this.silver.setNumber(silver, immediate);
            this.gold.setNumber(gold, immediate);
            this.platUnlocked && this.platin.setNumber(platin, immediate)
        }
    })
});
ig.baked = !0;
