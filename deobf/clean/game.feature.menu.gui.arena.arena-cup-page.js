/**
 * game.feature.menu.gui.arena.arena-cup-page
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.arena.arena-cup-page")`.
 *
 * `sc.ArenaCupInfoPage`: the cup info page in the arena info box — banner,
 * highscore, best time, rush time (or rush-disabled note), difficulty,
 * coins/creator, rounds and rush medal. `sc.ArenaBanner`: the cup banner
 * image box with its frame lines.
 */
ig.module("game.feature.menu.gui.arena.arena-cup-page")
    .requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.misc")
    .defines(function () {

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

        init: function () {
            this.parent();
            this.setPivot(0, 1);
            this.setSize(269, 214);
            var y = 1;
            this.banner = new sc.ArenaBanner;
            this.banner.hook.pos.y = y;
            this.addChildGui(this.banner);
            y = y + this.banner.hook.size.y;
            this.highscore = this.createStatGui("highscore", "KeyValue", this, y, {
                value: 1,
                maxValue: 999999999,
                asNumber: true,
                numberDots: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.highscore, "highscore", 0, "dyn", 18);
            this.time = this.createStatGui("time", "Time", this, y + 20, {
                value: function () {
                    return 0
                },
                leading: 2,
                max: 99,
                millis: true,
                hideHours: true,
                transitionTime: 0.2
            });
            this.setAnnotation(this.time, "time", 1, "dyn", 38);
            this.rushTime = this.createStatGui("rush", "Time", this, y + 40, {
                value: function () {
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
            this.noRush = this.createStatGui("rush", "KeyValue", this, y + 40, {
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
            var bolt = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
            bolt.setPos(-17, -1);
            this.rushTime.addChildGui(bolt);
            bolt = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
            bolt.setPos(-17, -1);
            this.noRush.addChildGui(bolt);
            y = y + 62;
            this.headerInfo = new sc.ArenaInfoLine(ig.lang.get("sc.gui.arena.menu.info"));
            this.headerInfo.setPos(0, y);
            this.headerInfo.show(true);
            this.addChildGui(this.headerInfo);
            y = y + (this.headerInfo.hook.size.y - 1);
            this.difficulty = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.difficulty"), 268);
            this.difficulty.valueGui.setPos(0, -2);
            this.difficulty.setPos(1, y);
            this.setAnnotation(this.difficulty, "difficulty", 2, 277, 16, -5, 1);
            this.addChildGui(this.difficulty);
            y = y + 17;
            this.coins = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu." + (sc.menu.arenaCustomMode ? "creator" : "coins")), 267);
            this.coins.setPos(1, y);
            this.setAnnotation(this.coins, sc.menu.arenaCustomMode ? "creator" : "coins", 3, 277, 16, -5, 1);
            this.addChildGui(this.coins);
            y = y + 17;
            this.rounds = new sc.ArenaKeyValue(ig.lang.get("sc.gui.arena.menu.rounds"), 267);
            this.rounds.setPos(1, y);
            this.setAnnotation(this.rounds, "rounds", 4, 277, 34, -5, 1);
            this.addChildGui(this.rounds);
            y = y + 17;
            this.rush = new sc.ArenaKeyValue("\\i[insetArrow]" + ig.lang.get("sc.gui.arena.menu.rush"), 270, true);
            this.rush.valueGui.setPos(1, -1);
            this.rush.setPos(1, y);
            this.addChildGui(this.rush);
            y = y + 17;
            this.setData();
            this.hook.size.y = y;
            this.doStateTransition("HIDDEN", true)
        },

        show: function () {
            this.doStateTransition("DEFAULT")
        },

        hide: function (immediate) {
            this.doStateTransition("HIDDEN", immediate)
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
        },

        setData: function (key, cup) {
            if (cup) {
                var core = cup.core;
                this.difficulty.setValue(this.getDifficulty(core.difficulty));
                this.banner.setImage(core.banner, core.offset);
                this.highscore.setValueAsNumber(sc.arena.getTotalPoints(key, true));
                this.time.setTime(sc.arena.getTotalTime(key));
                this.rushTime.setTime(sc.arena.getRoundTime(key, -1));
                this.rounds.setValue(sc.arena.getRoundsCleared(key) + "\\i[slash]" + cup.rounds.length);
                sc.menu.arenaCustomMode ? this.coins.setValue(core.creator ? ig.LangLabel.getText(core.creator) : ig.lang.get("sc.gui.arena.arenaName")) : this.coins.setValue(sc.arena.getArenaCoinsObtainedInCup(key) + "\\i[slash]" + sc.arena.getAvailableArenaCoinsInCup(key));
                if (core.noRush) {
                    this.noRush.doStateTransition("DEFAULT", true);
                    this.rushTime.doStateTransition("HIDDEN", true);
                    this.rush.setValue("\\i[arena-medal-x]")
                } else {
                    this.noRush.doStateTransition("HIDDEN", true);
                    this.rushTime.doStateTransition("DEFAULT", true);
                    this.rush.setValue("\\i[arena-medal-" + sc.arena.getCupMedal(key, -1) + "]")
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

        getDifficulty: function (difficulty) {
            for (var difficulty = parseInt(difficulty).limit(0, 6), text = "", i = 5; i--;) text = text + (i < difficulty ? "\\i[diff-" + difficulty + "]" : "\\i[diff-0]");
            return text
        }
    });

    sc.ArenaBanner = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        image: null,
        imageGui: null,

        init: function (width) {
            this.parent();
            this.setSize(width || 277, 64);
            this.setPos(-4, 0)
        },

        setImage: function (banner, offset) {
            if (banner) {
                this.imageGui && this.imageGui.remove();
                this.image = new ig.Image(banner.src);
                this.imageGui = new ig.ImageGui(this.image, banner.offX || 0, banner.offY || 0, banner.width || 8, banner.height || 8);
                offset && this.imageGui.setPos(offset.x, offset.y);
                this.addChildGui(this.imageGui)
            } else {
                this.image = null;
                this.imageGui && this.imageGui.remove();
                this.imageGui = null
            }
        },

        updateDrawables: function (renderer) {
            var size = this.hook.size;
            renderer.addColor("#000", 0, 0, size.x, size.y - 1).setAlpha(0.5);
            renderer.addColor("#FFF", 32, 0, size.x - 64, 1);
            renderer.addColor("#FFF", 32, size.y - 2, size.x - 64, 1);
            renderer.addGfx(this.gfx, 0, 0, 416, 504, 32, 1);
            renderer.addGfx(this.gfx, 0, size.y - 2, 416, 504, 32, 1);
            renderer.addGfx(this.gfx, size.x - 32, 0, 416, 504, 32, 1, true);
            renderer.addGfx(this.gfx, size.x - 32, size.y - 2, 416, 504, 32, 1, true)
        }
    })
});
ig.baked = !0;
