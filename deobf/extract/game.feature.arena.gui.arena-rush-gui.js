ig.module("game.feature.arena.gui.arena-rush-gui").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-misc", "game.feature.arena.gui.arena-effect-display", "game.feature.gui.widget.modal-dialog", "game.feature.arena.gui.arena-trophy-gui").defines(function() {
    sc.ArenaRushOverview = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        interact: null,
        content: null,
        msgBox: null,
        header: null,
        medals: null,
        list: null,
        medal: null,
        effect: null,
        total: null,
        time: null,
        totalOverlay: null,
        medalHeader: null,
        medalFooter: null,
        callback: null,
        entries: [],
        currentIndex: 0,
        timer: 0,
        totalValue: 0,
        addEntries: false,
        cup: null,
        medalType: null,
        state: 0,
        blockTimer: 0,
        initGui: false,
        scoreCountSound: new ig.Sound("media/sound/arena/arena-score-count.ogg", 0.8, 0.1),
        scoreDotSound: new ig.Sound("media/sound/arena/score-dot.ogg",
            0.8),
        scoreDotPitch: 0.8,
        init: function(b) {
            this.parent();
            this.hook.zIndex = 9999998;
            this.hook.localAlpha = 0.8;
            this.hook.temporary = true;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.cup = sc.arena.runtime.cup;
            this.callback = b;
            this.medalType = sc.arena.getCupMedal(this.cup, -1);
            this.interact = new sc.ScreenInteractEntry(this, true);
            this.content = new ig.GuiElementBase;
            this.content.setSize(280, 146);
            this.header = new sc.TextGui(ig.lang.get("sc.gui.arena.rushModeDone"));
            this.header.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            this.header.setPos(0, -4);
            this.content.addChildGui(this.header);
            b = new ig.ColorGui("#7E7E7E", 280, 1);
            b.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            b.setPos(0, 13);
            this.content.addChildGui(b);
            this.medals = new ig.GuiElementBase;
            this.list = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.list.showTopBar = false;
            this.list.showBottomBar = false;
            this.list.setContent(this.medals);
            this.list.setSize(184, 76);
            this.list.setPos(0, 13);
            this.content.addChildGui(this.list);
            b = new ig.ColorGui("#7E7E7E", 280, 1);
            b.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.TOP);
            b.setPos(0, 13 + this.list.hook.size.y - 1);
            this.content.addChildGui(b);
            this.total = new sc.STATS_ENTRY_TYPE.KeyValue("total", {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                numberSize: sc.NUMBER_SIZE.TEXT,
                transitionTime: 0.2
            }, 286);
            this.total.keyGui.setText(ig.lang.get("sc.gui.arena.totalScore"));
            this.total.setPos(-3, 13 + this.list.hook.size.y);
            this.total.setValueAsNumber(0, true);
            this.content.addChildGui(this.total);
            this.totalOverlay = new sc.NumberGui(999999999, {
                size: sc.NUMBER_SIZE.TEXT,
                dots: true,
                transitionTime: 0.2,
                color: sc.GUI_NUMBER_COLOR.NO_SHADOW
            });
            this.totalOverlay.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.totalOverlay.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.totalOverlay.setPos(5, 0);
            this.totalOverlay.doStateTransition("HIDDEN", true);
            this.total.addChildGui(this.totalOverlay);
            this.time =
                new sc.STATS_ENTRY_TYPE.Time("total", {
                    value: function() {
                        return 0
                    },
                    leading: 2,
                    max: 99,
                    millis: true,
                    hideHours: true,
                    transitionTime: sc.arena.getCupRounds(this.cup).length * 0.1 + 0.1
                }, 286);
            this.time.keyGui.setText(ig.lang.get("sc.gui.arena.time"));
            this.time.setPos(-3, this.total.hook.pos.y + 20);
            this.time.setTime(0, true);
            this.content.addChildGui(this.time);
            this.rushChain = new sc.STATS_ENTRY_TYPE.KeyValue("total", {
                    value: 1,
                    maxValue: 999999999,
                    asNumber: true,
                    numberDots: true,
                    numberSize: sc.NUMBER_SIZE.TEXT,
                    transitionTime: 0.2
                },
                286);
            this.rushChain.keyGui.setText(ig.lang.get("sc.gui.arena.rushChainHigh"));
            this.rushChain.setPos(-3, this.time.hook.pos.y + 20);
            this.rushChain.setValueAsNumber(0, true);
            this.content.addChildGui(this.rushChain);
            this.medal = new ig.GuiElementBase;
            this.medal.setSize(96, 74);
            this.medal.setPos(184, 14);
            this.content.addChildGui(this.medal);
            this.medalHeader = new sc.TextGui("\\c[4]" + ig.lang.get("sc.gui.arena.overview.trophyHeader") + "\\c[0]", {
                font: sc.fontsystem.smallFont
            });
            this.medalHeader.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.4,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 30
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_IN_OUT
                }
            };
            this.medalHeader.setPos(2, 0);
            this.medalHeader.doStateTransition("HIDDEN", true);
            this.medal.addChildGui(this.medalHeader);
            b = ig.lang.get("sc.gui.arena.medals")[this.medalType - 1];
            this.medalFooter = new sc.TextGui("\\c[4]" + b + "\\c[0]", {
                font: sc.fontsystem.smallFont,
                maxWidth: 76,
                textAlign: ig.Font.ALIGN.RIGHT,
                linePadding: -3
            });
            this.medalFooter.setAlign(ig.GUI_ALIGN_X.RIGHT, ig.GUI_ALIGN_Y.BOTTOM);
            this.medalFooter.setPos(0, -2);
            this.medalFooter.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.4,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 30
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_IN_OUT
                }
            };
            this.medalFooter.setPos(2, 0);
            this.medalFooter.doStateTransition("HIDDEN", true);
            this.medal.addChildGui(this.medalFooter);
            this.effect = new sc.ArenaMedalEffect;
            this.effect.setAlign(ig.GUI_ALIGN_X.CENTER, ig.GUI_ALIGN_Y.CENTER);
            this.medal.addChildGui(this.effect);
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.blockTimer > 0) this.blockTimer = this.blockTimer - ig.system.tick;
            if (this.done) {
                sc.control.menuScrollUp() ? this.list.scrollY(-18) : sc.control.menuScrollDown() && this.list.scrollY(18);
                sc.control.arenaScrollDown() ? this.list.scrollY(140 * ig.system.tick) : sc.control.arenaScrollUp() && this.list.scrollY(-140 * ig.system.tick)
            }
            if (this.addEntries) {
                if (this.currentIndex >
                    0) {
                    if (this.scoreDotPitch < 1.5) this.scoreDotPitch = this.scoreDotPitch + 0.6 * ig.system.tick;
                    this.scoreDotSound.play(false, {
                        speed: this.scoreDotPitch
                    })
                }
                if (this.timer <= 0)
                    if (this.currentIndex == -1) {
                        this.timer = 0.1;
                        this.currentIndex = 0
                    } else {
                        if (!this.initGui) {
                            this.time.setTime(sc.arena.runtime.timer);
                            this.rushChain.setValueAsNumber(sc.arena.getCupProgress(this.cup).rush.chain);
                            this.initGui = true
                        }
                        var b = this.entries[this.currentIndex],
                            a = new sc.ArenaCupOverview.MedalEntry(b.id, b.medal),
                            d = ~~(b.id / 10);
                        a.setPos(1 + b.id %
                            10 * 18, 2 + d * 18);
                        this.medals.addChildGui(a);
                        this.totalValue = this.totalValue + b.points;
                        this.total.setValueAsNumber(this.totalValue);
                        this.currentIndex++;
                        this.medals.hook.size.y = 2 + (d + 1) * 18;
                        this.list.recalculateScrollBars(true);
                        this.list.setScrollY(this.medals.hook.size.y, false, 0.1, KEY_SPLINES.LINEAR);
                        this.timer = 0.1;
                        if (this.currentIndex >= this.entries.length) {
                            this.addEntries = false;
                            this.done = true;
                            this.timer = 0.2;
                            this.medalHeader && this.medalHeader.doStateTransition("DEFAULT");
                            this.medalFooter && this.medalFooter.doStateTransition("DEFAULT",
                                false, false, null, 0.4)
                        }
                    }
                else this.timer = this.timer - ig.system.tick
            } else if (this.done && this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.scoreDotPitch < 1.5) this.scoreDotPitch = this.scoreDotPitch + 0.6 * ig.system.tick;
                this.scoreDotSound.play(false, {
                    speed: this.scoreDotPitch
                });
                if (this.timer <= 0) {
                    this.totalOverlay.setMaxNumber(this.totalValue);
                    this.totalOverlay.setNumber(this.totalValue, true);
                    this.totalOverlay.doStateTransition("DEFAULT", false, false, function() {
                        this.totalOverlay.doStateTransition("HIDDEN")
                    }.bind(this));
                    this.scoreCountSound.play();
                    this.state = 1;
                    this.effect && this.effect.show(this.medalType, false)
                }
            }
        },
        updateDrawables: function(b) {
            b.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        show: function() {
            ig.interact.addEntry(this.interact);
            this.blockTimer = 0.2;
            this.addMedals();
            this.msgBox.doStateTransition("DEFAULT");
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.addEntries = false;
            this.blockTimer = 1;
            this.effect && this.effect.hide(true);
            ig.interact.removeEntry(this.interact);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true)
        },
        addMedals: function() {
            this.medals.removeAllChildren();
            this.list.recalculateScrollBars(true);
            var b = sc.arena.runtime.rushScores;
            if (b)
                for (var a = 0; a < b.length; a++) {
                    var d = b[a];
                    this.entries.push({
                        id: a,
                        medal: d.medal || 0,
                        time: d.time || 0,
                        points: d.points || 0
                    })
                } else throw Error("No Round Progress found: " + this.cup);
            this.totalValue = 0;
            this.addEntries = true;
            this.currentIndex = -1;
            this.timer = 0.1
        },
        skip: function() {
            if (!this.done && this.addEntries) {
                this.addEntries =
                    false;
                if (this.currentIndex < 0) this.currentIndex = 0;
                for (var b = this.currentIndex; b < this.entries.length; b++) {
                    var a = this.entries[this.currentIndex],
                        d = new sc.ArenaCupOverview.MedalEntry(a.id, a.medal, true),
                        c = ~~(a.id / 10);
                    d.setPos(1 + a.id % 10 * 18, 2 + c * 18);
                    this.medals.addChildGui(d);
                    this.totalValue = this.totalValue + a.points;
                    this.currentIndex++;
                    this.medals.hook.size.y = 2 + (c + 1) * 18
                }
                this.total.setValueAsNumber(this.totalValue, true);
                this.list.recalculateScrollBars(true);
                this.list.setScrollY(this.medals.hook.size.y, false,
                    0.1, KEY_SPLINES.LINEAR);
                if (!this.initGui) {
                    this.time.setTime(sc.arena.runtime.timer, true);
                    this.initGui = true
                }
                this.medalHeader && this.medalHeader.doStateTransition("DEFAULT");
                this.medalFooter && this.medalFooter.doStateTransition("DEFAULT");
                this.rushChain.setValueAsNumber(sc.arena.getCupProgress(this.cup).rush.chain);
                this.totalOverlay.setMaxNumber(this.totalValue);
                this.totalOverlay.setNumber(this.totalValue, true);
                this.totalOverlay.doStateTransition("DEFAULT", false, false, function() {
                    this.totalOverlay.doStateTransition("HIDDEN")
                }.bind(this));
                this.scoreCountSound.play();
                this.effect && this.effect.show(this.medalType, false);
                this.timer = 0;
                this.done = true
            }
        },
        onInteraction: function() {
            if (this.state == 0) {
                this.blockTimer = 0.2;
                this.skip();
                this.state = 1
            } else {
                this.hide();
                this.callback && this.callback()
            }
        }
    })
});
ig.baked = !0;
