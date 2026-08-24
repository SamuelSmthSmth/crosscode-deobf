/**
 * game.feature.menu.gui.save.save-misc
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.save.save-misc")`.
 *
 * The per-slot widgets of the save/load menu:
 *  - `sc.SaveSlotNewButton`: the "new slot" row button.
 *  - `sc.SaveSlotButton`: one save slot row — chapter, level, location,
 *    party heads, elements, playtime and credit, plus the auto-slot
 *    ("no autosave") note and update/new-slot effects.
 *  - `sc.SaveSlotPlayTime`: the hh:mm:ss (optionally + ms) playtime counter.
 *  - `sc.SaveSlotLocation`: the area/location label with new-game-plus badge
 *    and save-version color marker.
 *  - `sc.SaveSlotParty`: the party member head icons.
 *  - `sc.SaveSlotElements`: the 2x2 element-change icons.
 *  - `sc.SaveSlotChapter`: the chapter number with DLC / meta-space markers.
 *  - `sc.SaveSlotButtonHighlight`: the row highlight bar (slot number,
 *    "auto" tag, new-game-plus icon, focus/newgame color schemes).
 *  - `sc.SaveSlotUpdateEffect`: the sweep transition played on new/update.
 */
ig.module("game.feature.menu.gui.save.save-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.version.version", "game.feature.gui.widget.modal-dialog", "game.feature.menu.gui.menu-misc", "impact.feature.interact.gui.focus-gui")
    .defines(function () {

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

        init: function (slot) {
            this.parent();
            this.setSize(448, 40);
            this.slot = slot == void 0 ? -1 : slot;
            this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.new-slot"));
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.slotOver = new sc.SaveSlotButtonHighlight;
            this.addChildGui(this.slotOver);
            this.slotOver.setSlot(this.slot)
        },

        focusGained: function () {
            this.focus = true;
            this.slotOver.focus = true
        },

        focusLost: function () {
            this.focus = false;
            this.slotOver.focus = false
        },

        updateDrawables: function (renderer) {
            this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default")
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

        init: function (save, slot) {
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
            var levelLabel = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.level"), {
                font: sc.fontsystem.tinyFont
            });
            levelLabel.setPos(ig.currentLang == "ja_JP" ? 150 : 154, 5);
            this.content.addChildGui(levelLabel);
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
            var labels = new ig.GuiElementBase;
            labels.setPos(313, 5);
            labels.setSize(47, 18);
            levelLabel = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.playtime"), {
                font: sc.fontsystem.tinyFont
            });
            levelLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            levelLabel.setPos(0, 0);
            labels.addChildGui(levelLabel);
            levelLabel = new sc.TextGui(ig.lang.get("sc.gui.menu.save-menu.credit"), {
                font: sc.fontsystem.tinyFont
            });
            levelLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            levelLabel.setPos(0, 11);
            labels.addChildGui(levelLabel);
            this.content.addChildGui(labels);
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
            this.autoSlotMiss.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.autoSlotMiss);
            this.autoSlotMiss.doStateTransition("HIDDEN", true);
            this.addChildGui(this.wrapper);
            this.effect = new sc.SaveSlotUpdateEffect;
            this.addChildGui(this.effect);
            this.setSave(save, slot)
        },

        setSave: function (save, slot, animate) {
            animate = animate == void 0 ? true : animate;
            this.slot = slot == void 0 ? -1 : slot;
            this.slotOver.setSlot(this.slot);
            if (save) {
                var metaSpace = save.vars && save.vars.storage && save.vars.storage.plot && save.vars.storage.plot.metaSpace,
                    isMeta = save.vars && save.vars.storage && save.vars.storage.plot && save.vars.storage.plot.line >= 4E4;
                if (save.player) {
                    this.chapter.setChapter(save.player.chapter || 0, slot, isMeta);
                    this.level.setNumber(save.player.level || 0, animate);
                    this.credit.setNumber(save.player.credit || 0, animate);
                    this.elements.setElements(save.player)
                }
                this.location.setLocation(save);
                this.party.setParty(save, animate);
                this.time.setTime(save, animate)
            } else {
                this.content.doStateTransition("HIDDEN", true);
                this.autoSlotMiss.doStateTransition("DEFAULT", true)
            }
        },

        doNewEffect: function () {
            this.wrapper.doStateTransition("HIDDEN", true);
            this.effect.playNew(function () {
                this.wrapper.doStateTransition("DEFAULT", true)
            }.bind(this))
        },

        doUpdateEffect: function (save, animate) {
            this.effect.playUpdate(animate, function () {
                this.setSave(save, this.slot, true)
            }.bind(this))
        },

        setSlot: function (slot) {
            this.slot = slot == void 0 ? -1 : slot;
            this.slotOver.setSlot(this.slot)
        },

        setSlotOver: function (slot) {
            this.slotOver.setSlot(slot)
        },

        focusGained: function () {
            this.focus = true;
            this.slotOver.focus = true
        },

        focusLost: function () {
            this.focus = false;
            this.slotOver.focus = false
        },

        updateDrawables: function (renderer) {
            if (this.wrapper.hook.currentStateName != "HIDDEN") {
                this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
                this.content.hook.currentStateName != "HIDDEN" && renderer.addGfx(this.gfx, 430, 15, 490, 224, 10, 8)
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

        init: function (size, hours, leadingZeros, transitionTime, showMillis, hideHours) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(72, 13);
            this.setPos(8, 4);
            this.hideHours = hideHours;
            transitionTime = transitionTime || 0;
            this.hour = new sc.NumberGui(hours || 999, {
                leadingZeros: leadingZeros || 3,
                size: size || null,
                transitionTime: transitionTime,
                noZero: this.hideHours
            });
            this.hour.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hour.setPos(46, 0);
            this.addChildGui(this.hour);
            this.minute = new sc.NumberGui(99, {
                leadingZeros: 2,
                size: size || null,
                transitionTime: transitionTime
            });
            this.minute.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.minute.setPos(23, 0);
            this.addChildGui(this.minute);
            this.second = new sc.NumberGui(99, {
                leadingZeros: 2,
                size: size || null,
                transitionTime: transitionTime
            });
            this.second.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.second.setPos(0, 0);
            this.addChildGui(this.second);
            if (showMillis) {
                this.millis = new sc.NumberGui(99, {
                    leadingZeros: 2,
                    size: size || null,
                    transitionTime: transitionTime
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

        setColor: function (color) {
            this.color = color || sc.GUI_NUMBER_COLOR.WHITE;
            this.hour.setColor(this.color);
            this.minute.setColor(this.color);
            this.second.setColor(this.color)
        },

        setTime: function (save, animate) {
            var playtime = save.playtime;
            this.millis && this.millis.setNumber(Math.floor(playtime * 100) % 100, animate);
            this.second.setNumber(Math.floor(playtime) % 60, animate);
            this.minute.setNumber(Math.floor(playtime / 60) % 60, animate);
            this.hour.setNumber(Math.floor(playtime / 60 / 60), animate)
        },

        setTimeFromValue: function (value, animate) {
            this.millis && this.millis.setNumber(Math.floor(value * 100) % 100, animate);
            this.second.setNumber(Math.floor(value) % 60, animate);
            this.minute.setNumber(Math.floor(value / 60) % 60, animate);
            var hours = Math.floor(value / 60 / 60);
            this.hour.setNumber(hours, animate);
            if (this.hideHours) {
                this.drawHourDots = hours > 0;
                this.hook.size.x = this.drawHourDots ? (this.millis ? 69 : 48) + this.hour.hook.size.x : this.millis ? 61 : 40
            }
        },

        updateDrawables: function (renderer) {
            if (this.millis) {
                renderer.addGfx(this.gfx, this.hook.size.x - 20, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 3 : 2, 112, 1 + this.color * 8, 3, 7);
                renderer.addGfx(this.gfx, this.hook.size.x - 42, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7);
                this.drawHourDots && renderer.addGfx(this.gfx, this.hook.size.x - 65, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7)
            } else {
                renderer.addGfx(this.gfx, this.hook.size.x - 21, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7);
                this.drawHourDots && renderer.addGfx(this.gfx, this.hook.size.x - 44, this.hour.metrics == sc.NUMBER_SIZE.TEXT ? 2 : 1, 107, 1 + this.color * 8, 3, 7)
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
        newGamePlus: null,

        init: function () {
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

        setLocation: function (save) {
            var text = "",
                text = save.area && save.area.langUid ? text + (save.area ? ig.LangLabel.getText(save.area) : "???") : text + (save.area ? save.area : "???"),
                text = save.specialMap && save.specialMap.langUid ? text + (" - " + (save.specialMap ? ig.LangLabel.getText(save.specialMap) : save.map || "???")) : text + (" - " + (save.specialMap ? save.specialMap : save.map || "???"));
            this.location.setText(text);
            text = save.version || "V0.2.2";
            if ((save.saveVersion || 0) < sc.version.saveVersion) text = "\\c[1]" + text;
            this.newGamePlus.doStateTransition("HIDDEN", true);
            save.newGamePlus && save.newGamePlus.active && this.newGamePlus.doStateTransition("DEFAULT", true);
            this.version.setText(text)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addGfx(this.ninepatch.gfx, 13, 1, 481, 224, 8, 11)
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

        init: function () {
            this.parent(94, 19);
            this.setPos(215, 4);
            this.party.push(0)
        },

        setParty: function (save) {
            this.party.length = 1;
            if (save.party)
                for (var current = save.party.currentParty, i = 0; i < current.length; i++) {
                    var model = sc.party.models[current[i]];
                    model && this.party.push(model.getHeadIdx())
                }
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            for (var i = 0; i < this.party.length; i++) renderer.addGfx(this.headsGfx, 14 + i * 21, 2, this.party[i] * 24, 8, 24, 16)
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

        init: function () {
            this.parent();
            this.setSize(43, 19);
            this.setPos(198, 5)
        },

        setElements: function (player) {
            if (player.core[sc.PLAYER_CORE.ELEMENT_CHANGE]) {
                this.elements[sc.ELEMENT.HEAT] = player.core[sc.ELEMENT.HEAT + 8];
                this.elements[sc.ELEMENT.COLD] = player.core[sc.ELEMENT.COLD + 8];
                this.elements[sc.ELEMENT.SHOCK] = player.core[sc.ELEMENT.SHOCK + 8];
                this.elements[sc.ELEMENT.WAVE] = player.core[sc.ELEMENT.WAVE + 8]
            } else {
                this.elements[sc.ELEMENT.HEAT] = false;
                this.elements[sc.ELEMENT.COLD] = false;
                this.elements[sc.ELEMENT.SHOCK] = false;
                this.elements[sc.ELEMENT.WAVE] = false
            }
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.ninepatch.gfx, -1, -1, 656, 0, 18, 18);
            this.elements[sc.ELEMENT.HEAT] && renderer.addGfx(this.ninepatch.gfx, 4, 8, 640, 0, 8, 8);
            this.elements[sc.ELEMENT.COLD] && renderer.addGfx(this.ninepatch.gfx, 4, 0, 648, 0, 8, 8);
            this.elements[sc.ELEMENT.SHOCK] && renderer.addGfx(this.ninepatch.gfx, 8, 4, 640, 8, 8, 8);
            this.elements[sc.ELEMENT.WAVE] && renderer.addGfx(this.ninepatch.gfx, 0, 4, 648, 8, 8, 8)
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

        init: function () {
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
            this.metaMarker.setPos(-15, 14);
            this.addChildGui(this.metaMarker)
        },

        setChapter: function (chapter, slot, isMeta) {
            this.chapter = Math.min(sc.model.player.chapters.length, (chapter || 0) + 1);
            this.dlc = isMeta;
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
            slot >= 1 ? this.metaMarker.doStateTransition("DEFAULT", true) : this.metaMarker.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (renderer) {
            var frame = this.chapter + (this.dlc ? 1 : 0);
            renderer.addGfx(this.gfx, 0, 0, frame % 2 * 147, Math.floor(frame / 2) * 34, 147, 34)
        }
    });

    var SAVE_SLOT_HIGHLIGHT_COLORS = {
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

        init: function () {
            this.parent();
            this.setPos(2, 1);
            this.setSize(446, 38)
        },

        setSlot: function (slot) {
            if (this.slot != slot && this.slotGui) {
                this.slotGui.remove();
                this.slotGui = null
            }
            this.slot = slot == void 0 ? -1 : slot;
            this.newgame = false;
            if (this.slot != -1) {
                this.newgame = false;
                var data = ig.storage.getSlot(this.slot <= -2 ? -1 : this.slot).data;
                if (data.newGamePlus && data.newGamePlus.active) this.newgame = true
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

        updateDrawables: function (renderer) {
            var highlightWidth = (this.slot <= -2 ? 37 : 25) + (this.newgame ? this.slot <= -2 ? 8 : 9 : 0),
                state = this.focus ? "focus" : "default";
            this.ninepatch.draw(renderer, highlightWidth, 39, state);
            var colorWidth = this.hook.size.x - highlightWidth - 7;
            renderer.addColor(SAVE_SLOT_HIGHLIGHT_COLORS[state].top, highlightWidth, 0, colorWidth, 1);
            renderer.addColor(SAVE_SLOT_HIGHLIGHT_COLORS[state].bottom, highlightWidth, 36, colorWidth, 1);
            renderer.addGfx(this.ninepatch.gfx, this.hook.size.x - 7, 0, this.focus ? 169 : 126, 115, 5, 37);
            this.newgame && this.slotGui && renderer.addGfx(this.gfx, this.slotGui.hook.pos.x + this.slotGui.hook.size.x + 1, this.slot <= -2 ? 2 : 1.5, 560, 496, 10, 10)
        },

        setSize: function (width) {
            width = Math.max(width, 50);
            this.parent(width, 39)
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

        init: function () {
            this.parent();
            this.setSize(448, 40);
            this.setPivot(0, 20);
            this.doStateTransition("HIDDEN", true)
        },

        playNew: function (callback) {
            this.doStateTransition("NEW_HIDDEN", true);
            this.setPivot(0, 20);
            this.doStateTransition("DEFAULT", false, false, function () {
                this.setPivot(448, 20);
                callback && callback();
                this.doStateTransition("NEW_HIDDEN_END", false, false, null, 0.05)
            }.bind(this), 0.2)
        },

        playUpdate: function (delay, callback) {
            this.doStateTransition("HIDDEN_UPDATE", true);
            this.setPivot(0, 20);
            this.doStateTransition("DEFAULT_UPDATE", false, false, function () {
                this.setPivot(448, 20);
                callback && callback();
                this.doStateTransition("HIDDEN_UPDATE", false, false, null, 0.05)
            }.bind(this), delay)
        },

        updateDrawables: function (renderer) {
            this.ninepatch.drawComposite(renderer, this.hook.size.x, this.hook.size.y, "default", "lighter")
        }
    })
});
ig.baked = !0;
