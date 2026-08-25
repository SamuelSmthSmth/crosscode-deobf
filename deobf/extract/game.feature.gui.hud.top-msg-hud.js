ig.module("game.feature.gui.hud.top-msg-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.model.options-model").defines(function() {
    var b = {
            icon: 0,
            bgm: "landmark"
        },
        a = {
            icon: 1,
            sound: new ig.Sound("media/sound/hud/quest-task-solved.ogg", 0.5)
        },
        d = {
            icon: 2
        },
        c = {
            icon: 3
        },
        e = {
            icon: 4
        };
    sc.TopMsgHudGui = ig.GuiElementBase.extend({
        topGui: null,
        bottomGui: null,
        iconGui: null,
        visible: false,
        timer: 0,
        maxTime: 0,
        current: null,
        messages: [],
        bgm: {},
        init: function() {
            this.parent();
            this.hook.zIndex = 51;
            this.hook.pauseGui = true;
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.topGui = new sc.TopMsgTopGui;
            this.topGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.topGui);
            this.bottomGui = new sc.TopMsgTitleGui;
            this.bottomGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.bottomGui.setPos(0, 14);
            this.addChildGui(this.bottomGui);
            this.iconGui = new sc.TopMsgIconGui;
            this.iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.iconGui.setPos(0,
                0);
            this.addChildGui(this.iconGui);
            this.bgm.landmark = ig.bgm.loadTrack("landmark");
            this.animationEndBinded = this.animationEnd.bind(this);
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.map, this);
            sc.Model.addObserver(sc.quests, this);
            sc.Model.addObserver(sc.lore, this);
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.trophies, this);
            this.setSize(222, 64)
        },
        setContent: function(a, b, c, d) {
            this.bottomGui.setContent(b, c, d);
            this.iconGui.setIcon(a.icon);
            a.sound && a.sound.play();
            a.bgm && ig.bgm.inbetween(this.bgm[a.bgm],
                1, "FAST")
        },
        showMessage: function(a, b, c, d, e) {
            this.messages.push({
                icon: a,
                titleText: b,
                subText: c,
                subFontSize: d,
                id: e || null
            });
            this.visible ? this.maxTime = 3 : this.popMessage()
        },
        popMessage: function() {
            var a = this.messages.pop();
            this.setContent(a.icon, a.titleText, a.subText, a.subFontSize);
            this.visible = true;
            this.topGui.doStateTransition("DEFAULT");
            this.iconGui.doStateTransition("DEFAULT");
            this.bottomGui.doStateTransition("DEFAULT", false, false, this.animationEndBinded);
            this.timer = 0;
            this.maxTime = this.messages.length >
                0 ? 3 : 4;
            this.current = a
        },
        update: function() {
            if (!ig.game.paused && this.maxTime > 0) {
                this.timer = this.timer + ig.system.actualTick;
                this.timer >= this.maxTime && this.hide()
            }
        },
        clear: function() {
            this.messages.length = 0;
            this.current = null;
            this.hide()
        },
        hide: function() {
            this.maxTimer = 0;
            this.iconGui.doStateTransition("HIDDEN");
            if (this.messages.length > 0) this.bottomGui.hide(this.animationEndBinded);
            else {
                this.current = null;
                this.visible = false;
                this.bottomGui.hide();
                this.topGui.doStateTransition("HIDDEN")
            }
        },
        animationEnd: function() {
            this.bottomGui.hook.currentStateName ==
                "DEFAULT" ? this.bottomGui.showSubText() : this.bottomGui.hook.currentStateName == "HIDDEN" && this.messages.length > 0 && this.popMessage()
        },
        checkDuplicates: function(a) {
            if (this.current && this.current.id == a) return true;
            for (var b = this.messages.length; b--;)
                if (this.messages.id == a) return true;
            return false
        },
        modelChanged: function(f, g, h) {
            if (f == sc.model) g == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED ? f.isReset() && this.clear() : g == sc.GAME_MODEL_MSG.CLEAR_TOP_MESSAGE && this.clear();
            else if (f == sc.map) g == sc.MAP_EVENT.LANDMARK_ADDED &&
                h && h.landmark && h.area && sc.options.get("update-landmark-style") == sc.UPDATE_LANDMARK_STYLE.LARGE && this.showMessage(b, ig.lang.get("sc.gui.landmark-hud.title-new"), sc.map.getLandmarkName(h.landmark, h.area), sc.fontsystem.font);
            else if (f == sc.quests) {
                if (g == sc.QUEST_MODEL_EVENT.TASK_DONE && h && h.state && !h.state.skipPreviousTask() && sc.options.get("update-quest-style") == sc.UPDATE_QUEST_STYLE.LARGE && !this.checkDuplicates(h.quest.id)) {
                    f = sc.options.get("quest-show-current");
                    g = Math.max(0, h.state.currentTask - (f ? 1 :
                        0));
                    g = h.quest.tasks[g];
                    this.showMessage(a, ig.lang.get("sc.gui.quest-hud." + (f ? "taskDoneCurrent" : "taskDoneCenter")), g.task.toString(), sc.fontsystem.smallFont, h.quest.id)
                }
            } else if (f == sc.lore)
                if (g == sc.LORE_EVENT.UNLOCKED) {
                    if (h && sc.options.get("update-lore-style") == sc.UPDATE_LORE_STYLE.LARGE) {
                        f = "\\c[3]" + sc.lore.getLoreTitle(h.lore) + "\\c[0] ";
                        f = f + (h.updated ? ig.lang.get("sc.gui.lore-hud.updated") : ig.lang.get("sc.gui.lore-hud.unlocked"));
                        this.showMessage(d, ig.lang.get("sc.gui.lore-hud.top-title"), f, sc.fontsystem.font)
                    }
                } else g ==
                    sc.LORE_EVENT.ACIVATED && this.showMessage(d, ig.lang.get("sc.gui.lore-hud.top-first-title"), ig.lang.get("sc.gui.lore-hud.top-first"), sc.fontsystem.font);
            else if (f == sc.menu) {
                if (g == sc.MENU_EVENT.DROP_COMPLETED && h && sc.options.get("update-drop-style") == sc.UPDATE_LORE_STYLE.LARGE) {
                    f = "\\c[3]" + sc.menu.getDropName(h) + "\\c[0] ";
                    f = f + ig.lang.get("sc.gui.drop-hud.completed");
                    this.showMessage(c, ig.lang.get("sc.gui.drop-hud.title"), f, sc.fontsystem.smallFont)
                }
            } else if (f == sc.trophies && (g == sc.TROPHY_EVENTS.TRIGGERED &&
                    h) && sc.options.get("update-trophy-style") == sc.UPDATE_TROPHY_STYLE.LARGE) {
                f = ig.lang.get("sc.gui.feats.unlocked") + " \\c[3]" + new ig.LangLabel(sc.trophies.getTrophyName(h)) + "\\c[0]";
                this.showMessage(e, ig.lang.get("sc.gui.feats.hud-title"), f, sc.fontsystem.smallFont)
            }
        }
    });
    sc.TopMsgIconGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/message.png"),
        icon: 0,
        init: function() {
            this.parent();
            this.setSize(24, 24);
            this.setPivot(12, 12);
            this.doStateTransition("HIDDEN", true)
        },
        setIcon: function(a) {
            this.icon = a
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 96 + this.icon * 24, 128, 24, 24, false, false)
        }
    });
    sc.TopMsgTopGui = ig.ImageGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/message.png"),
        init: function() {
            this.parent(this.gfx,
                48, 148, 32, 12);
            this.setPivot(this.hook.size.x / 2, 0);
            this.doStateTransition("HIDDEN", true)
        }
    });
    sc.TopMsgTitleGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        titleTextGui: null,
        subTextGui: null,
        gfx: new ig.Image("media/gui/message.png"),
        ninePatches: {
            left: new ig.NinePatch("media/gui/message.png", {
                width: 4,
                height: 0,
                left: 12,
                top: 4,
                right: 0,
                bottom: 0,
                offsets: {
                    "default": {
                        x: 0,
                        y: 144
                    }
                }
            }),
            leftInner: new ig.NinePatch("media/gui/message.png", {
                width: 8,
                height: 0,
                left: 8,
                top: 11,
                right: 0,
                bottom: 0,
                offsets: {
                    "default": {
                        x: 16,
                        y: 136
                    }
                }
            }),
            rightInner: new ig.NinePatch("media/gui/message.png", {
                width: 8,
                height: 0,
                left: 0,
                top: 11,
                right: 8,
                bottom: 0,
                offsets: {
                    "default": {
                        x: 64,
                        y: 136
                    }
                }
            }),
            right: new ig.NinePatch("media/gui/message.png", {
                width: 4,
                height: 0,
                left: 0,
                top: 4,
                right: 12,
                bottom: 0,
                offsets: {
                    "default": {
                        x: 80,
                        y: 144
                    }
                }
            })
        },
        init: function() {
            this.parent();
            this.titleTextGui = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont
            });
            this.titleTextGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.titleTextGui.setPos(0, 8);
            this.addChildGui(this.titleTextGui);
            this.subTextGui = new sc.TopMsgSubGui;
            this.subTextGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.subTextGui.setPos(0, 17);
            this.addChildGui(this.subTextGui);
            this.setSize(222, 22);
            this.setPivot(111, 9);
            this.doStateTransition("HIDDEN", true)
        },
        setContent: function(a, b, c) {
            this.titleTextGui.setText(a);
            this.subTextGui.setContent(b, c)
        },
        showSubText: function() {
            this.subTextGui.doStateTransition("DEFAULT")
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", false, false, a);
            this.subTextGui.doStateTransition("HIDDEN")
        },
        updateDrawables: function(a) {
            var b = this.hook.size.x,
                c = Math.max(64, this.titleTextGui.hook.size.x + 20),
                c = Math.ceil(c / 2) * 2,
                b = (b - c) / 2,
                c = (c - 32) / 2,
                d = 0;
            this.ninePatches.left.draw(a, b, 8, "default", d, 14);
            d = d + b;
            this.ninePatches.leftInner.draw(a, c, 11, "default", d, 6);
            d = d + c;
            a.addGfx(this.gfx, d, 0, 32, 130, 32, 17, false, false);
            d = d + 32;
            this.ninePatches.rightInner.draw(a, c, 11, "default", d, 6);
            this.ninePatches.right.draw(a,
                b, 8, "default", d + c, 14)
        }
    });
    sc.TopMsgSubGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 24,
            height: 4,
            left: 8,
            top: 5,
            right: 8,
            bottom: 3,
            offsets: {
                "default": {
                    x: 8,
                    y: 148
                }
            }
        }),
        init: function() {
            this.parent();
            this.hook.localAlpha = 0.7;
            this.subTextGui = new sc.TextGui("", {
                maxWidth: 206,
                textAlign: ig.Font.ALIGN.CENTER,
                bestRatio: 8
            });
            this.subTextGui.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.subTextGui.setPos(0, 0);
            this.addChildGui(this.subTextGui);
            this.setPivot(109, 0);
            this.doStateTransition("HIDDEN", true)
        },
        setContent: function(a, b) {
            this.subTextGui.setFont(b);
            this.subTextGui.setText(a);
            this.setSize(218, this.subTextGui.hook.size.y);
            this.setPivot(109, 0)
        }
    })
});
ig.baked = !0;
