ig.module("game.feature.menu.gui.save.save-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.version.version", "game.feature.gui.widget.modal-dialog", "game.feature.menu.gui.menu-misc", "impact.feature.interact.gui.focus-gui").defines(function() {
    sc.SaveSlotNewButton = ig.FocusGui.extend({
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
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 0,
            left: 8,
            top: 40,
            right: 8,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 114
                },
                focus: {
                    x: 45,
                    y: 114
                }
            }
        }),
        slot: -1,
        slotOver: null,
        text: null,
        init: function(a) {
            this.parent();
            this.setSize(448, 40);
            this.slot = a == void 0 ? -1 : a;
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.new-slot"));
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.slotOver = new sc.SaveSlotButtonHighlight;
            this.addChildGui(this.slotOver);
            this.slotOver.setSlot(this.slot)
        },
        focusGained: function() {
            this.focus =
                true;
            this.slotOver.focus = true
        },
        focusLost: function() {
            this.focus = false;
            this.slotOver.focus = false
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default")
        }
    });
    sc.SaveSlotButton = ig.FocusGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            MOVE: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DELETE: {
                state: {
                    alpha: 0.5,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        gfx: new ig.Image("media/gui/menu.png"),
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 0,
            left: 8,
            top: 40,
            right: 8,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 114
                },
                focus: {
                    x: 45,
                    y: 114
                }
            }
        }),
        slot: -1,
        slotOver: null,
        level: null,
        location: null,
        time: null,
        credit: null,
        chapter: null,
        party: null,
        elements: null,
        autoSlotMiss: null,
        wrapper: null,
        content: null,
        effect: null,
        init: function(a, b) {
            this.parent();
            this.setSize(448, 40);
            this.wrapper = new ig.GuiElementBase;
            this.wrapper.setSize(448, 40);
            this.wrapper.hook.transitions = {
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
            this.wrapper.doStateTransition("DEFAULT", true);
            this.content = new ig.GuiElementBase;
            this.content.setSize(448, 40);
            this.content.hook.transitions = {
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
            this.content.doStateTransition("DEFAULT", true);
            this.chapter = new sc.SaveSlotChapter;
            this.content.addChildGui(this.chapter);
            var c = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.level"), {
                font: sc.fontsystem.tinyFont
            });
            c.setPos(ig.currentLang == "ja_JP" ? 150 : 154, 5);
            this.content.addChildGui(c);
            this.level = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE
            });
            this.level.setPos(170, 6);
            this.content.addChildGui(this.level);
            this.location = new sc.SaveSlotLocation;
            this.content.addChildGui(this.location);
            this.party = new sc.SaveSlotParty;
            this.content.addChildGui(this.party);
            this.elements = new sc.SaveSlotElements;
            this.content.addChildGui(this.elements);
            var e = new ig.GuiElementBase;
            e.setPos(313, 5);
            e.setSize(47, 18);
            c = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.playtime"), {
                font: sc.fontsystem.tinyFont
            });
            c.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, 0);
            e.addChildGui(c);
            c = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.credit"), {
                font: sc.fontsystem.tinyFont
            });
            c.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, 11);
            e.addChildGui(c);
            this.content.addChildGui(e);
            this.time = new sc.SaveSlotPlayTime;
            this.content.addChildGui(this.time);
            this.credit = new sc.NumberGui(9999999);
            this.credit.setPos(368, 15);
            this.content.addChildGui(this.credit);
            this.wrapper.addChildGui(this.content);
            this.slotOver = new sc.SaveSlotButtonHighlight;
            this.wrapper.addChildGui(this.slotOver);
            this.autoSlotMiss = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.noAuto"));
            this.autoSlotMiss.hook.transitions = {
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
            this.autoSlotMiss.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.autoSlotMiss);
            this.autoSlotMiss.doStateTransition("HIDDEN", true);
            this.addChildGui(this.wrapper);
            this.effect = new sc.SaveSlotUpdateEffect;
            this.addChildGui(this.effect);
            this.setSave(a, b)
        },
        setSave: function(a, b, c) {
            c = c == void 0 ? true : c;
            this.slot = b == void 0 ? -1 : b;
            this.slotOver.setSlot(this.slot);
            if (a) {
                var b = a.vars && a.vars.storage && a.vars.storage.plot && a.vars.storage.plot.metaSpace,
                    e = a.vars && a.vars.storage && a.vars.storage.plot && a.vars.storage.plot.line >= 4E4;
                if (a.player) {
                    this.chapter.setChapter(a.player.chapter ||
                        0, b, e);
                    this.level.setNumber(a.player.level || 0, c);
                    this.credit.setNumber(a.player.credit || 0, c);
                    this.elements.setElements(a.player)
                }
                this.location.setLocation(a);
                this.party.setParty(a, c);
                this.time.setTime(a, c)
            } else {
                this.content.doStateTransition("HIDDEN", true);
                this.autoSlotMiss.doStateTransition("DEFAULT", true)
            }
        },
        doNewEffect: function() {
            this.wrapper.doStateTransition("HIDDEN", true);
            this.effect.playNew(function() {
                this.wrapper.doStateTransition("DEFAULT", true)
            }.bind(this))
        },
        doUpdateEffect: function(a, b) {
            this.effect.playUpdate(b,
                function() {
                    this.setSave(a, this.slot, true)
                }.bind(this))
        },
        setSlot: function(a) {
            this.slot = a == void 0 ? -1 : a;
            this.slotOver.setSlot(this.slot)
        },
        setSlotOver: function(a) {
            this.slotOver.setSlot(a)
        },
        focusGained: function() {
            this.focus = true;
            this.slotOver.focus = true
        },
        focusLost: function() {
            this.focus = false;
            this.slotOver.focus = false
        },
        updateDrawables: function(a) {
            if (this.wrapper.hook.currentStateName != "HIDDEN") {
                this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
                this.content.hook.currentStateName !=
                    "HIDDEN" && a.addGfx(this.gfx, 430, 15, 490, 224, 10, 8)
            }
        }
    });
    sc.SaveSlotPlayTime = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        hour: null,
        minute: null,
        second: null,
        millis: null,
        color: 0,
        hideHours: false,
        drawHourDots: true,
        init: function(a, b, c, e, f, g) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(72, 13);
            this.setPos(8, 4);
            this.hideHours = g;
            e = e || 0;
            this.hour = new sc.NumberGui(b || 999, {
                leadingZeros: c || 3,
                size: a || null,
                transitionTime: e,
                noZero: this.hideHours
            });
            this.hour.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.hour.setPos(46, 0);
            this.addChildGui(this.hour);
            this.minute = new sc.NumberGui(99, {
                leadingZeros: 2,
                size: a || null,
                transitionTime: e
            });
            this.minute.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.minute.setPos(23, 0);
            this.addChildGui(this.minute);
            this.second = new sc.NumberGui(99, {
                leadingZeros: 2,
                size: a || null,
                transitionTime: e
            });
            this.second.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.second.setPos(0, 0);
            this.addChildGui(this.second);
            if (f) {
                this.millis = new sc.NumberGui(99, {
                    leadingZeros: 2,
                    size: a || null,
                    transitionTime: e
                });
                this.millis.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.millis.setPos(0, 0);
                this.addChildGui(this.millis);
                this.second.hook.pos.x = this.second.hook.pos.x + 21;
                this.minute.hook.pos.x = this.minute.hook.pos.x + 21;
                this.hour.hook.pos.x = this.hour.hook.pos.x + 21;
                this.setSize(69 + this.hour.hook.size.x, 13)
            } else this.setSize(48 + this.hour.hook.size.x, 13)
        },
        setColor: function(a) {
            this.color = a || sc.GUI_NUMBER_COLOR.WHITE;
            this.hour.setColor(this.color);
            this.minute.setColor(this.color);
            this.second.setColor(this.color)
        },
        setTime: function(a, b) {
            var c = a.playtime;
            this.millis && this.millis.setNumber(Math.floor(c * 100) % 100, b);
            this.second.setNumber(Math.floor(c) % 60, b);
            this.minute.setNumber(Math.floor(c / 60) % 60, b);
            this.hour.setNumber(Math.floor(c / 60 / 60), b)
        },
        setTimeFromValue: function(a, b) {
            this.millis && this.millis.setNumber(Math.floor(a * 100) % 100, b);
            this.second.setNumber(Math.floor(a) % 60, b);
            this.minute.setNumber(Math.floor(a / 60) % 60, b);
            var c = Math.floor(a / 60 / 60);
            this.hour.setNumber(c, b);
            if (this.hideHours) {
                this.drawHourDots =
                    c > 0;
                this.hook.size.x = this.drawHourDots ? (this.millis ? 69 : 48) + this.hour.hook.size.x : this.millis ? 61 : 40
            }
        },
        updateDrawables: function(a) {
            if (this.millis) {
                a.addGfx(this.gfx, this.hook.size.x - 20, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 3 : 2, 112, 1 + this.color * 8, 3, 7);
                a.addGfx(this.gfx, this.hook.size.x - 42, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7);
                this.drawHourDots && a.addGfx(this.gfx, this.hook.size.x - 65, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7)
            } else {
                a.addGfx(this.gfx,
                    this.hook.size.x - 21, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7);
                this.drawHourDots && a.addGfx(this.gfx, this.hook.size.x - 44, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7)
            }
        }
    });
    sc.SaveSlotLocation = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 4,
            height: 4,
            left: 13,
            top: 13,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 459,
                    y: 224
                }
            }
        }),
        location: null,
        version: null,
        init: function() {
            this.parent(305, 13);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(3, 3);
            this.location = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.location.setPos(26, 0);
            this.addChildGui(this.location);
            this.version = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont
            });
            this.version.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.version.setPos(5, 1);
            this.newGamePlus = new ig.ImageGui(this.ninepatch.gfx, 560, 496, 11, 11);
            this.newGamePlus.hook.transitions = {
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
            this.newGamePlus.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.newGamePlus.setPos(5, 0);
            this.newGamePlus.doStateTransition("HIDDEN", true)
        },
        setLocation: function(a) {
            var b = "",
                b = a.area && a.area.langUid ? b + (a.area ? ig.LangLabel.getText(a.area) : "???") : b + (a.area ? a.area : "???"),
                b = a.specialMap && a.specialMap.langUid ? b + (" - " + (a.specialMap ? ig.LangLabel.getText(a.specialMap) : a.map || "???")) : b + (" - " + (a.specialMap ? a.specialMap : a.map || "???"));
            this.location.setText(b);
            b = a.version || "V0.2.2";
            if ((a.saveVersion ||
                    0) < sc.version.saveVersion) b = "\\c[1]" + b;
            this.newGamePlus.doStateTransition("HIDDEN", true);
            a.newGamePlus && a.newGamePlus.active && this.newGamePlus.doStateTransition("DEFAULT", true);
            this.version.setText(b)
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addGfx(this.ninepatch.gfx, 13, 1, 481, 224, 8, 11)
        }
    });
    sc.SaveSlotParty = ig.BoxGui.extend({
        headsGfx: new ig.Image("media/gui/severed-heads.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 4,
            height: 0,
            left: 19,
            top: 19,
            right: 19,
            bottom: 0,
            offsets: {
                "default": {
                    x: 416,
                    y: 224
                }
            }
        }),
        party: [],
        init: function() {
            this.parent(94, 19);
            this.setPos(215, 4);
            this.party.push(0)
        },
        setParty: function(a) {
            this.party.length = 1;
            if (a.party)
                for (var a = a.party.currentParty, b = 0; b < a.length; b++) {
                    var c = sc.party.models[a[b]];
                    c && this.party.push(c.getHeadIdx())
                }
        },
        updateDrawables: function(a) {
            this.parent(a);
            for (var b = 0; b < this.party.length; b++) a.addGfx(this.headsGfx, 14 + b * 21, 2, this.party[b] * 24, 8, 24, 16)
        }
    });
    sc.SaveSlotElements = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 4,
            height: 0,
            left: 19,
            top: 19,
            right: 19,
            bottom: 0,
            offsets: {
                "default": {
                    x: 416,
                    y: 224
                }
            }
        }),
        elements: [],
        init: function() {
            this.parent();
            this.setSize(43, 19);
            this.setPos(198, 5)
        },
        setElements: function(a) {
            if (a.core[sc.PLAYER_CORE.ELEMENT_CHANGE]) {
                this.elements[sc.ELEMENT.HEAT] = a.core[sc.ELEMENT.HEAT + 8];
                this.elements[sc.ELEMENT.COLD] = a.core[sc.ELEMENT.COLD + 8];
                this.elements[sc.ELEMENT.SHOCK] = a.core[sc.ELEMENT.SHOCK + 8];
                this.elements[sc.ELEMENT.WAVE] = a.core[sc.ELEMENT.WAVE + 8]
            } else {
                this.elements[sc.ELEMENT.HEAT] = false;
                this.elements[sc.ELEMENT.COLD] =
                    false;
                this.elements[sc.ELEMENT.SHOCK] = false;
                this.elements[sc.ELEMENT.WAVE] = false
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.ninepatch.gfx, -1, -1, 656, 0, 18, 18);
            this.elements[sc.ELEMENT.HEAT] && a.addGfx(this.ninepatch.gfx, 4, 8, 640, 0, 8, 8);
            this.elements[sc.ELEMENT.COLD] && a.addGfx(this.ninepatch.gfx, 4, 0, 648, 0, 8, 8);
            this.elements[sc.ELEMENT.SHOCK] && a.addGfx(this.ninepatch.gfx, 8, 4, 640, 8, 8, 8);
            this.elements[sc.ELEMENT.WAVE] && a.addGfx(this.ninepatch.gfx, 0, 4, 648, 8, 8, 8)
        }
    });
    sc.SaveSlotChapter = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/chapters.png"),
        metaGfx: new ig.Image("media/gui/menu.png"),
        chapter: null,
        dlc: false,
        textGui: null,
        chapterGui: null,
        metaMarker: null,
        init: function() {
            this.parent();
            this.setSize(147, 34);
            this.setPos(4, 2);
            this.textGui = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.chapter"), {
                font: sc.fontsystem.tinyFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.textGui.setPos(68, 0);
            this.addChildGui(this.textGui);
            this.chapterGui = new sc.NumberGui(14, {
                leadingZeros: 2
            });
            this.chapterGui.hook.transitions = {
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
            this.chapterGui.setPos(106, 25);
            this.addChildGui(this.chapterGui);
            this.metaMarker = new ig.ImageGui(this.metaGfx, 544, 496, 11, 10);
            this.metaMarker.hook.transitions = {
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
            this.metaMarker.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.metaMarker.setPos(12, 1);
            this.metaMarker.setPos(-15,
                14);
            this.addChildGui(this.metaMarker)
        },
        setChapter: function(a, b, c) {
            this.chapter = Math.min(sc.model.player.chapters.length, (a || 0) + 1);
            this.dlc = c;
            this.chapterGui.setNumber(this.chapter, true);
            if (this.chapter == 0) {
                this.textGui.setText(ig.lang.get("sc.gui.menu.save-menu.chapter0"));
                this.chapterGui.doStateTransition("HIDDEN", true)
            } else if (this.chapter == 11 && !this.dlc) {
                this.textGui.setText(ig.lang.get("sc.gui.menu.save-menu.chapterLast"));
                this.chapterGui.doStateTransition("HIDDEN", true)
            } else {
                this.textGui.setText(ig.lang.get("sc.gui.menu.save-menu.chapter"));
                this.chapterGui.doStateTransition("DEFAULT", true)
            }
            b >= 1 ? this.metaMarker.doStateTransition("DEFAULT", true) : this.metaMarker.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            var b = this.chapter + (this.dlc ? 1 : 0);
            a.addGfx(this.gfx, 0, 0, b % 2 * 147, Math.floor(b / 2) * 34, 147, 34)
        }
    });
    var b = {
        "default": {
            top: "#525B68",
            bottom: "#2D343C"
        },
        newgame: {
            top: "#656852",
            bottom: "#3b3c2d"
        },
        focus: {
            top: "#faac49",
            bottom: "#c73a24"
        }
    };
    sc.SaveSlotButtonHighlight = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 12,
            height: 0,
            left: 6,
            top: 37,
            right: 7,
            bottom: 0,
            offsets: {
                "default": {
                    x: 91,
                    y: 115
                },
                focus: {
                    x: 134,
                    y: 115
                },
                newgame: {
                    x: 160,
                    y: 192
                }
            }
        }),
        gfx: new ig.Image("media/gui/menu.png"),
        slot: -1,
        focus: false,
        newgame: false,
        slotGui: null,
        init: function() {
            this.parent();
            this.setPos(2, 1);
            this.setSize(446, 38)
        },
        setSlot: function(a) {
            if (this.slot != a && this.slotGui) {
                this.slotGui.remove();
                this.slotGui = null
            }
            this.slot = a == void 0 ? -1 : a;
            this.newgame = false;
            if (this.slot != -1) {
                this.newgame = false;
                a = ig.storage.getSlot(this.slot <= -2 ? -1 : this.slot).data;
                if (a.newGamePlus && a.newGamePlus.active) this.newgame = true
            }
            if (this.slot <= -2) {
                if (!this.slotGui) {
                    this.slotGui = new sc.TextGui("auto");
                    this.slotGui.setPos(5, -2);
                    this.addChildGui(this.slotGui)
                }
            } else {
                if (!this.slotGui) {
                    this.slotGui = new sc.NumberGui(99, {
                        leadingZeros: 2
                    });
                    this.slotGui.setPos(4, 3);
                    this.addChildGui(this.slotGui)
                }
                this.slotGui.setNumber(this.slot + 1, true)
            }
        },
        updateDrawables: function(a) {
            var d = (this.slot <= -2 ? 37 : 25) + (this.newgame ? this.slot <= -2 ? 8 : 9 : 0),
                c = this.focus ? "focus" : "default";
            this.ninepatch.draw(a,
                d, 39, c);
            var e = this.hook.size.x - d - 7;
            a.addColor(b[c].top, d, 0, e, 1);
            a.addColor(b[c].bottom, d, 36, e, 1);
            a.addGfx(this.ninepatch.gfx, this.hook.size.x - 7, 0, this.focus ? 169 : 126, 115, 5, 37);
            this.newgame && this.slotGui && a.addGfx(this.gfx, this.slotGui.hook.pos.x + this.slotGui.hook.size.x + 1, this.slot <= -2 ? 2 : 1.5, 560, 496, 10, 10)
        },
        setSize: function(a) {
            a = Math.max(a, 50);
            this.parent(a, 39)
        }
    });
    sc.SaveSlotUpdateEffect = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 0,
            left: 8,
            top: 40,
            right: 8,
            bottom: 0,
            offsets: {
                "default": {
                    x: 175,
                    y: 114
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN_UPDATE: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            },
            DEFAULT_UPDATE: {
                state: {
                    alpha: 1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            },
            NEW_HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 0
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE
            },
            NEW_HIDDEN_END: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        init: function() {
            this.parent();
            this.setSize(448, 40);
            this.setPivot(0, 20);
            this.doStateTransition("HIDDEN", true)
        },
        playNew: function(a) {
            this.doStateTransition("NEW_HIDDEN", true);
            this.setPivot(0, 20);
            this.doStateTransition("DEFAULT", false, false, function() {
                this.setPivot(448, 20);
                a && a();
                this.doStateTransition("NEW_HIDDEN_END", false, false, null, 0.05)
            }.bind(this), 0.2)
        },
        playUpdate: function(a, b) {
            this.doStateTransition("HIDDEN_UPDATE", true);
            this.setPivot(0, 20);
            this.doStateTransition("DEFAULT_UPDATE", false, false, function() {
                this.setPivot(448, 20);
                b && b();
                this.doStateTransition("HIDDEN_UPDATE", false, false, null, 0.05)
            }.bind(this), a)
        },
        updateDrawables: function(a) {
            this.ninepatch.drawComposite(a, this.hook.size.x, this.hook.size.y, "default", "lighter")
        }
    })
});
ig.baked = !0;
