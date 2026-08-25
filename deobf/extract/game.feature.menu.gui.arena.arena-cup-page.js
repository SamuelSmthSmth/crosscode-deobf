ig.module("game.feature.menu.gui.arena.arena-cup-page").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.misc").defines(function() {
    sc.ArenaCupInfoPage = ig.GuiElementBase.extend({
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
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        banner: null,
        headerInfo: null,
        highscore: null,
        time: null,
        rushTime: null,
        noRush: null,
        rounds: null,
        rush: null,
        difficulty: null,
        coins: null,
        init: function() {
            this.parent();
            this.setPivot(0, 1);
            this.setSize(269, 214);
            var b = 1;
            this.banner = new sc.ArenaBanner;
            this.banner.hook.pos.y = b;
            this.addChildGui(this.banner);
            b = b + this.banner.hook.size.y;
            this.highscore = this.createStatGui("highscore", "KeyValue", this, b, {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.highscore, "highscore", 0, "dyn", 18);
            this.time =
                this.createStatGui("time", "Time", this, b + 20, {
                    value: function() {
                        return 0
                    },
                    leading: 2,
                    max: 99,
                    millis: true,
                    hideHours: true,
                    transitionTime: 0.2
                });
            this.setAnnotation(this.time, "time", 1, "dyn", 38);
            this.rushTime = this.createStatGui("rush", "Time", this, b + 40, {
                value: function() {
                    return 0
                },
                width: 253,
                leading: 2,
                max: 99,
                millis: true,
                hideHours: true,
                transitionTime: 0.2
            });
            this.rushTime.hook.transitions = {
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
            this.rushTime.doStateTransition("DEFAULT", true);
            this.noRush = this.createStatGui("rush", "KeyValue", this, b + 40, {
                value: ig.lang.get("sc.gui.arena.rushDisabled"),
                transitionTime: 0.2,
                width: 253
            });
            this.noRush.hook.transitions = {
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
            this.noRush.doStateTransition("HIDDEN", true);
            this.noRush.hook.pos.x = this.noRush.hook.pos.x + 24;
            this.rushTime.hook.pos.x = this.rushTime.hook.pos.x + 24;
            var a = new ig.ImageGui(this.gfx,
                512, 207, 17, 16);
            a.setPos(-17, -1);
            this.rushTime.addChildGui(a);
            a = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
            a.setPos(-17, -1);
            this.noRush.addChildGui(a);
            b = b + 62;
            this.headerInfo = new sc.ArenaInfoLine(ig.lang.get("sc.gui.arena.menu.info"));
            this.headerInfo.setPos(0, b);
            this.headerInfo.show(true);
            this.addChildGui(this.headerInfo);
            b = b + (this.headerInfo.hook.size.y - 1);
            this.difficulty = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.difficulty"), 268);
            this.difficulty.valueGui.setPos(0, -2);
            this.difficulty.setPos(1,
                b);
            this.setAnnotation(this.difficulty, "difficulty", 2, 277, 16, -5, 1);
            this.addChildGui(this.difficulty);
            b = b + 17;
            this.coins = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu." + (sc.menu.arenaCustomMode ? "creator" : "coins")), 267);
            this.coins.setPos(1, b);
            this.setAnnotation(this.coins, sc.menu.arenaCustomMode ? "creator" : "coins", 3, 277, 16, -5, 1);
            this.addChildGui(this.coins);
            b = b + 17;
            this.rounds = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.rounds"), 267);
            this.rounds.setPos(1, b);
            this.setAnnotation(this.rounds,
                "rounds", 4, 277, 34, -5, 1);
            this.addChildGui(this.rounds);
            b = b + 17;
            this.rush = new sc.ArenaKeyValue("\\i[insetArrow]" + ig.lang.get("sc.gui.arena.menu.rush"), 270, true);
            this.rush.valueGui.setPos(1, -1);
            this.rush.setPos(1, b);
            this.addChildGui(this.rush);
            b = b + 17;
            this.setData();
            this.hook.size.y = b;
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function(b) {
            this.doStateTransition("HIDDEN", b)
        },
        createStatGui: function(b, a, d, c, e) {
            a = new sc.STATS_ENTRY_TYPE[a](b, e, e.width || 277);
            a.keyGui.setText(ig.lang.get("sc.gui.arena.menu." + b));
            a.setPos(-4, c);
            d && d.addChildGui(a);
            return a
        },
        setAnnotation: function(b, a, d, c, e, f, g) {
            b.annotation = {
                content: {
                    title: "sc.gui.menu.help.arena.titles." + a,
                    description: "sc.gui.menu.help.arena.description." + a
                },
                offset: {
                    x: f || 0,
                    y: g || 0
                },
                size: {
                    x: c || "dyn",
                    y: e || "dyn"
                },
                index: {
                    x: 0,
                    y: d + 1
                }
            }
        },
        setData: function(b, a) {
            if (a) {
                var d = a.core;
                this.difficulty.setValue(this.getDifficulty(d.difficulty));
                this.banner.setImage(d.banner, d.offset);
                this.highscore.setValueAsNumber(sc.arena.getTotalPoints(b,
                    true));
                this.time.setTime(sc.arena.getTotalTime(b));
                this.rushTime.setTime(sc.arena.getRoundTime(b, -1));
                this.rounds.setValue(sc.arena.getRoundsCleared(b) + "\\i[slash]" + a.rounds.length);
                sc.menu.arenaCustomMode ? this.coins.setValue(d.creator ? ig.LangLabel.getText(d.creator) : ig.lang.get("sc.gui.arena.arenaName")) : this.coins.setValue(sc.arena.getArenaCoinsObtainedInCup(b) + "\\i[slash]" + sc.arena.getAvailableArenaCoinsInCup(b));
                if (d.noRush) {
                    this.noRush.doStateTransition("DEFAULT", true);
                    this.rushTime.doStateTransition("HIDDEN",
                        true);
                    this.rush.setValue("\\i[arena-medal-x]")
                } else {
                    this.noRush.doStateTransition("HIDDEN", true);
                    this.rushTime.doStateTransition("DEFAULT", true);
                    this.rush.setValue("\\i[arena-medal-" + sc.arena.getCupMedal(b, -1) + "]")
                }
            } else {
                this.noRush.doStateTransition("HIDDEN", true);
                this.rushTime.doStateTransition("DEFAULT", true);
                this.difficulty.setValue(this.getDifficulty(0));
                this.banner.setImage();
                this.highscore.setValueAsNumber(0, true);
                this.time.setTime(0, true);
                this.rushTime.setTime(0, true);
                this.rounds.setValue("0\\i[slash]0");
                this.rush.setValue("\\i[arena-medal-0]");
                this.coins.setValue(sc.menu.arenaCustomMode ? "" : "0\\i[slash]0")
            }
        },
        getDifficulty: function(b) {
            for (var b = parseInt(b).limit(0, 6), a = "", d = 5; d--;) a = a + (d < b ? "\\i[diff-" + b + "]" : "\\i[diff-0]");
            return a
        }
    });
    sc.ArenaBanner = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        image: null,
        imageGui: null,
        init: function(b) {
            this.parent();
            this.setSize(b || 277, 64);
            this.setPos(-4, 0)
        },
        setImage: function(b, a) {
            if (b) {
                this.imageGui && this.imageGui.remove();
                this.image = new ig.Image(b.src);
                this.imageGui = new ig.ImageGui(this.image, b.offX || 0, b.offY || 0, b.width || 8, b.height || 8);
                a && this.imageGui.setPos(a.x, a.y);
                this.addChildGui(this.imageGui)
            } else {
                this.image = null;
                this.imageGui && this.imageGui.remove();
                this.imageGui = null
            }
        },
        updateDrawables: function(b) {
            var a = this.hook.size;
            b.addColor("#000", 0, 0, a.x, a.y - 1).setAlpha(0.5);
            b.addColor("#FFF", 32, 0, a.x - 64, 1);
            b.addColor("#FFF", 32, a.y - 2, a.x - 64, 1);
            b.addGfx(this.gfx, 0, 0, 416, 504, 32, 1);
            b.addGfx(this.gfx, 0, a.y - 2, 416, 504, 32, 1);
            b.addGfx(this.gfx, a.x - 32, 0, 416,
                504, 32, 1, true);
            b.addGfx(this.gfx, a.x - 32, a.y - 2, 416, 504, 32, 1, true)
        }
    })
});
ig.baked = !0;
