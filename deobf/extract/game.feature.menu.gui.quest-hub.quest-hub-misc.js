ig.module("game.feature.menu.gui.quest-hub.quest-hub-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.social.social-misc", "game.feature.interact.button-group", "game.feature.menu.gui.quests.quest-entries").defines(function() {
    sc.QuestHubAvailable = sc.MenuPanel.extend({
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
                    offsetX: 220
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        number: null,
        init: function() {
            this.parent(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(200, 23);
            this.setPos(66, 28);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.available"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.number = new sc.NumberGui(999, {
                size: sc.NUMBER_SIZE.TEXT
            });
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.number.setPos(5, 1);
            this.addChildGui(this.number);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.hub.titles.available",
                    description: "sc.gui.menu.help.hub.description.available"
                },
                offset: {
                    x: 0,
                    y: 0
                },
                size: {
                    x: "dyn",
                    y: "dyn"
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN",
                true)
        },
        show: function() {
            var a = ig.database.get("questHubs")[sc.menu.questHubID];
            if (!a) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
            var a = a.areas,
                b = sc.quests.staticQuests,
                c = new ig.VarCondition,
                e = 0,
                f;
            for (f in b) {
                var g = b[f];
                if (g.hubSettings && !g.noTrack)
                    for (var h = 0; h < a.length; h++)
                        if (g.area == a[h] && !sc.quests.isQuestActive(f) && !sc.quests.isQuestSolved(f) && (!g.extension || ig.extensions.hasExtension(g.extension)))
                            if (g.hubSettings.condition) {
                                c.setCondition(g.hubSettings.condition);
                                c.evaluate() &&
                                    e++
                            } else e++
            }
            this.number.setMaxNumber(e);
            this.number.setNumber(e, true);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.text.hook.size.x + this.text.hook.pos.x + 1,
                c = this.hook.size.x - this.text.hook.size.x - this.number.hook.size.x - 10,
                c = Math.floor(c / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 14, 0, 0, c, 4)
        }
    });
    var b = {
        total: 0,
        solved: 0
    };
    sc.QuestHubCompletion = sc.MenuPanel.extend({
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
                    offsetX: -220
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        percent: null,
        init: function() {
            this.parent(sc.MenuPanelType.BOTTOM_RIGHT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setSize(200, 23);
            this.setPos(66, 28);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.completion"));
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(5, 0);
            this.addChildGui(this.text);
            this.percent = new sc.StatPercentNumber(null, {
                size: sc.NUMBER_SIZE.TEXT,
                leadingZeros: 1,
                scramble: false
            });
            this.percent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.percent.setPos(5, 1);
            this.addChildGui(this.percent);
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.hub.titles.rate",
                    description: "sc.gui.menu.help.hub.description.rate"
                },
                offset: {
                    x: 0,
                    y: 0
                },
                size: {
                    x: "dyn",
                    y: "dyn"
                },
                index: {
                    x: 1,
                    y: 0
                }
            };
            this.doStateTransition("HIDDEN",
                true)
        },
        show: function() {
            var a = ig.database.get("questHubs")[sc.menu.questHubID];
            if (!a) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
            for (var a = a.areas, d = 0, c = a.length, e = 0; c--;) {
                sc.quests.getTotalHubQuestsSolved(a[c], b);
                if (b.total != 0) {
                    e++;
                    d = d + b.solved / b.total
                }
            }
            d = d / e;
            this.percent.setNumber(d, true);
            d >= 1 && this.percent.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            this.parent(a);
            var b = this.text.hook.size.x +
                this.text.hook.pos.x + 1,
                c = this.hook.size.x - this.text.hook.size.x - this.percent.hook.size.x - 10,
                c = Math.floor(c / 4) * 4;
            a.addPattern(this.constructor.PATTERN, b, 14, 0, 0, c, 4)
        }
    });
    sc.QuestHubListEntry = ig.FocusGui.extend({
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
        gfx: new ig.Image("media/gui/menu.png"),
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 10,
            left: 8,
            top: 15,
            right: 8,
            bottom: 15,
            offsets: {
                "default": {
                    x: 0,
                    y: 114
                },
                focus: {
                    x: 45,
                    y: 114
                },
                hdefault: {
                    x: 170,
                    y: 50
                },
                hfocus: {
                    x: 213,
                    y: 50
                }
            }
        }),
        character: null,
        questTitle: null,
        questLocation: null,
        levelContent: null,
        level: null,
        areaContent: null,
        area: null,
        rewards: null,
        init: function(a, b) {
            this.parent();
            this.setSize(433, 50);
            var c = sc.quests.getStaticQuest(a),
                e = c.hubSettings;
            this.character = new sc.QuestHubCharacterView;
            this.character.setPos(6, 3);
            this.character.setCharacter(e.hideChar && b == sc.MENU_QUEST_HUB_TABS.OPEN ? "misc.blank" : e.character);
            this.addChildGui(this.character);
            this.questTitle =
                new sc.TextGui(c.name);
            this.questTitle.setPos(40, 1);
            this.addChildGui(this.questTitle);
            this.questLocation = new sc.TextGui(e.location, {
                font: sc.fontsystem.smallFont,
                maxWidth: 238
            });
            this.questLocation.setPos(52, 18);
            this.addChildGui(this.questLocation);
            this.levelContent = new ig.ColorGui("000");
            this.levelContent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.levelContent.setSize(37, 13);
            this.levelContent.setPos(6, 3);
            this.levelContent.hook.localAlpha = 0.5;
            this.addChildGui(this.levelContent);
            e = new sc.TextGui("LvL", {
                font: sc.fontsystem.tinyFont
            });
            e.setPos(3, 2);
            this.levelContent.addChildGui(e);
            this.level = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(2, 3);
            this.level.setNumber(c.level);
            this.levelContent.addChildGui(this.level);
            this.areaContent = new ig.ColorGui("000");
            this.areaContent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.areaContent.setPos(6 + this.levelContent.hook.size.x + 1, 3);
            this.areaContent.hook.localAlpha = 0.5;
            this.areaContent.setSize(98,
                13);
            this.addChildGui(this.areaContent);
            e = new ig.ImageGui(this.gfx, 480, 224, 9, 11);
            e.setPos(2, 1);
            this.areaContent.addChildGui(e);
            this.area = new sc.TextGui(sc.map.getAreaName(c.area), {
                font: sc.fontsystem.smallFont
            });
            this.area.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.area.setPos(14, 0);
            this.areaContent.addChildGui(this.area);
            this.rewards = new sc.QuestHubRewards;
            this.rewards.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.rewards.setPos(6, 4);
            this.addChildGui(this.rewards);
            e = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.rewards"), {
                font: sc.fontsystem.tinyFont
            });
            e.setPos(3, 2);
            this.rewards.addChildGui(e);
            var f = c.rewards,
                c = 10,
                e = 14;
            f.exp && (c = this.addImageRewardGui(c, e, 472, 32, 14, 10, 17));
            f.cp && (c = this.addImageRewardGui(c, e, 593, 19, 10, 10, 13));
            f.money && (c = this.addImageRewardGui(c, e, 488, 32, 12, 10, 15));
            if (f.items)
                for (var f = f.items || [], e = e - 4, g = 0; g < f.length; g++) c = this.addItemRewardGui(c, e, f[g].id);
            sc.menu.questsSeen[a] || (sc.menu.questsSeen[a] = true)
        },
        addImageRewardGui: function(a, b, c, e, f, g, h) {
            c = new ig.ImageGui(this.gfx, c, e, f, g);
            c.setPos(a,
                b);
            this.rewards.addChildGui(c);
            return a + h
        },
        addItemRewardGui: function(a, b, c) {
            c = new sc.TextGui(sc.inventory.getItemIcon(c));
            c.setPos(a, b);
            this.rewards.addChildGui(c);
            return a + 16
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? "hfocus" : "hdefault", 1);
            a.addGfx(this.gfx, 41, 18, 530, 208, 9, 10)
        }
    });
    sc.QuestHubRewards = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 5,
            height: 5,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 560,
                    y: 465
                }
            }
        }),
        init: function() {
            this.parent(136, 29)
        }
    });
    sc.QuestHubCharacterView = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 544,
                    y: 482
                }
            }
        }),
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
        init: function() {
            this.parent(31, 44);
            this.container =
                new ig.GuiElementBase;
            this.container.setSize(31, 44);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },
        setCharacter: function(a, b) {
            if (a) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (a) {
                    this.display = new sc.NPCDisplayGui(a, true, null, this.centerNPC.bind(this));
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                if (this.display) {
                    b ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true);
                    this.display = null
                }
                this.doStateTransition("HIDDEN",
                    true)
            }
        },
        centerNPC: function(a) {
            a.npc && a.setPos(this.container.hook.size.x / 2 - a.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - a.hook.size.y / 2)
        }
    })
});
ig.baked = !0;
